import { z } from "zod";

export const displayLengthUnitSchema = z.enum(["m", "mm", "um", "nm"]);
export const displayAngleUnitSchema = z.enum(["rad", "deg"]);
export const solverIdSchema = z.enum(["geometric.l0", "geometric.l1.2d", "scalar.angularSpectrum.l2.1d"]);

const finiteNumber = z.number().finite();
const positiveNumber = finiteNumber.positive();
const nonNegativeNumber = finiteNumber.nonnegative();

export const sourceElementSchema = z.discriminatedUnion("type", [
  z
    .object({
      id: z.string().min(1),
      type: z.literal("pointSource"),
      label: z.string().min(1),
      xM: finiteNumber,
      yM: finiteNumber,
      wavelengthM: positiveNumber,
      powerW: nonNegativeNumber,
      angularSpreadRad: nonNegativeNumber,
      rayCount: z.number().int().min(1).max(4096)
    })
    .strict(),
  z
    .object({
      id: z.string().min(1),
      type: z.literal("collimatedSource"),
      label: z.string().min(1),
      xM: finiteNumber,
      yCenterM: finiteNumber,
      beamHeightM: positiveNumber,
      wavelengthM: positiveNumber,
      powerW: nonNegativeNumber,
      angleRad: finiteNumber,
      rayCount: z.number().int().min(1).max(4096)
    })
    .strict()
]);

export const opticalElementSchema = z.discriminatedUnion("type", [
  z
    .object({
      id: z.string().min(1),
      type: z.literal("thinLens"),
      label: z.string().min(1),
      xM: finiteNumber,
      yCenterM: finiteNumber,
      focalLengthM: finiteNumber.refine((value) => Math.abs(value) > 1e-12, "focal length cannot be zero"),
      clearApertureM: positiveNumber,
      material: z
        .object({
          refractiveIndex: positiveNumber,
          dispersionModel: z.literal("none")
        })
        .strict(),
      approximation: z.literal("thinLensParaxial")
    })
    .strict(),
  z
    .object({
      id: z.string().min(1),
      type: z.literal("aperture"),
      label: z.string().min(1),
      xM: finiteNumber,
      yCenterM: finiteNumber,
      diameterM: positiveNumber
    })
    .strict(),
  z
    .object({
      id: z.string().min(1),
      type: z.literal("thickLens2D"),
      label: z.string().min(1),
      xM: finiteNumber,
      yCenterM: finiteNumber,
      thicknessM: positiveNumber,
      radius1M: finiteNumber.refine((value) => Math.abs(value) > 1e-12, "radius1 cannot be zero"),
      radius2M: finiteNumber.refine((value) => Math.abs(value) > 1e-12, "radius2 cannot be zero"),
      apertureDiameterM: positiveNumber,
      mediumId: z.string().min(1),
      material: z
        .object({
          refractiveIndex: positiveNumber,
          dispersionModel: z.literal("none")
        })
        .strict(),
      approximation: z.literal("surfaceSnell2D")
    })
    .strict()
]);

export const detectorElementSchema = z
  .object({
    id: z.string().min(1),
    type: z.literal("screenDetector"),
    label: z.string().min(1),
    xM: finiteNumber,
    yCenterM: finiteNumber,
    heightM: positiveNumber,
    bins: z.number().int().min(4).max(512)
  })
  .strict();

const sceneV1BaseSchema = z
  .object({
    schemaVersion: z.literal("0.1.0"),
    sceneId: z.string().min(1),
    name: z.string().min(1),
    seed: z.number().int(),
    units: z
      .object({
        internal: z.literal("SI"),
        displayLength: displayLengthUnitSchema,
        displayAngle: displayAngleUnitSchema
      })
      .strict(),
    environment: z
      .object({
        ambientRefractiveIndex: positiveNumber,
        defaultWavelengthM: positiveNumber
      })
      .strict(),
    bench: z
      .object({
        xMinM: finiteNumber,
        xMaxM: finiteNumber,
        yMinM: finiteNumber,
        yMaxM: finiteNumber,
        opticalAxisYM: finiteNumber
      })
      .strict()
      .refine((bench) => bench.xMaxM > bench.xMinM, "xMaxM must be greater than xMinM")
      .refine((bench) => bench.yMaxM > bench.yMinM, "yMaxM must be greater than yMinM"),
    sources: z.array(sourceElementSchema).min(1),
    elements: z.array(opticalElementSchema),
    detectors: z.array(detectorElementSchema).min(1),
    solverSettings: z
      .object({
        activeSolverId: z.literal("geometric.l0"),
        rayCount: z.number().int().min(1).max(4096),
        sampling: z.enum(["deterministicFan", "seededJitter"]),
        modeDisclosure: z.boolean()
      })
      .strict(),
    metadata: z
      .object({
        createdAtIso: z.string().min(1),
        modifiedAtIso: z.string().min(1),
        appVersion: z.string().min(1)
      })
      .strict()
  })
  .strict();

export const sceneV1Schema = sceneV1BaseSchema
  .superRefine((scene, ctx) => {
    const ids = new Set<string>();
    const allIds = [
      ...scene.sources.map((source) => source.id),
      ...scene.elements.map((element) => element.id),
      ...scene.detectors.map((detector) => detector.id)
    ];
    for (const id of allIds) {
      if (ids.has(id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `duplicate element id: ${id}` });
      }
      ids.add(id);
    }
  });

export const mediumSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    refractiveIndex: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("constant"), n: positiveNumber }).strict(),
      z
        .object({
          kind: z.literal("cauchy"),
          A: positiveNumber,
          B: finiteNumber,
          C: finiteNumber,
          wavelengthRangeM: z.tuple([positiveNumber, positiveNumber]).optional()
        })
        .strict()
    ])
  })
  .strict();

export const surfaceElement2DSchema = z.discriminatedUnion("type", [
  z
    .object({
      id: z.string().min(1),
      type: z.literal("planeSurface2D"),
      label: z.string().min(1),
      vertex: z.object({ xM: finiteNumber, yM: finiteNumber }).strict(),
      normal: z.object({ x: finiteNumber, y: finiteNumber }).strict(),
      apertureRadiusM: positiveNumber,
      mediumBeforeId: z.string().min(1),
      mediumAfterId: z.string().min(1),
      interaction: z.enum(["refract", "reflect", "autoTir"])
    })
    .strict(),
  z
    .object({
      id: z.string().min(1),
      type: z.literal("circularSurface2D"),
      label: z.string().min(1),
      vertex: z.object({ xM: finiteNumber, yM: finiteNumber }).strict(),
      radiusOfCurvatureM: finiteNumber.refine((value) => Math.abs(value) > 1e-12, "radius cannot be zero"),
      apertureRadiusM: positiveNumber,
      mediumBeforeId: z.string().min(1),
      mediumAfterId: z.string().min(1),
      interaction: z.enum(["refract", "reflect", "autoTir"]),
      signConvention: z.literal("positiveCenterAlongIncreasingX")
    })
    .strict()
]);

const sceneV2BaseSchema = sceneV1BaseSchema
  .omit({ schemaVersion: true, solverSettings: true })
  .extend({
    schemaVersion: z.literal("0.2.0"),
    geometry: z
      .object({
        dimension: z.literal("2d"),
        opticalAxis: z.literal("x"),
        transverseAxes: z.tuple([z.literal("y")])
      })
      .strict(),
    mediaCatalog: z.array(mediumSchema).min(1),
    surfaceElements2D: z.array(surfaceElement2DSchema),
    assemblies2D: z.array(z.never()),
    solverSettings: z
      .object({
        activeSolverId: solverIdSchema,
        rayCount: z.number().int().min(1).max(4096),
        sampling: z.enum(["deterministicFan", "seededJitter"]),
        modeDisclosure: z.boolean()
      })
      .strict()
  });

function validateSceneV2References(scene: Omit<z.infer<typeof sceneV2BaseSchema>, "schemaVersion">, ctx: z.RefinementCtx): void {
  const ids = new Set<string>();
  const allIds = [
    ...scene.sources.map((source) => source.id),
    ...scene.elements.map((element) => element.id),
    ...scene.detectors.map((detector) => detector.id),
    ...scene.surfaceElements2D.map((surface) => surface.id)
  ];
  for (const id of allIds) {
    if (ids.has(id)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `duplicate element id: ${id}` });
    }
    ids.add(id);
  }

  const mediaIds = new Set(scene.mediaCatalog.map((medium) => medium.id));
  for (const element of scene.elements) {
    if (element.type === "thickLens2D" && !mediaIds.has(element.mediumId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `unknown medium id: ${element.mediumId}` });
    }
  }
  for (const surface of scene.surfaceElements2D) {
    if (!mediaIds.has(surface.mediumBeforeId) || !mediaIds.has(surface.mediumAfterId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `surface ${surface.id} references an unknown medium` });
    }
  }
}

export const sceneV2Schema = sceneV2BaseSchema.superRefine(validateSceneV2References);

export const fieldGrid1DSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    yMinM: finiteNumber,
    yMaxM: finiteNumber,
    samples: z.number().int().min(16).max(16384),
    spacingM: positiveNumber
  })
  .strict()
  .refine((grid) => grid.yMaxM > grid.yMinM, "yMaxM must be greater than yMinM")
  .refine((grid) => Math.abs(grid.spacingM - (grid.yMaxM - grid.yMinM) / grid.samples) <= Math.max(1e-15, grid.spacingM * 1e-9), {
    message: "spacingM must equal (yMaxM - yMinM) / samples"
  });

const fieldSource1DSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("uniformPlaneWave"),
      amplitude: nonNegativeNumber,
      phaseRad: finiteNumber
    })
    .strict(),
  z
    .object({
      kind: z.literal("gaussian"),
      waistM: positiveNumber,
      amplitude: nonNegativeNumber,
      phaseRad: finiteNumber.default(0),
      centerYM: finiteNumber.default(0)
    })
    .strict()
]);

export const fieldPlane1DSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    role: z.enum(["source", "detector"]),
    xM: finiteNumber,
    gridId: z.string().min(1),
    mediumId: z.string().min(1),
    fieldSource: fieldSource1DSchema.optional()
  })
  .strict()
  .superRefine((plane, ctx) => {
    if (plane.role === "source" && !plane.fieldSource) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `field plane ${plane.id} is a source but has no fieldSource` });
    }
  });

export const mask1DSchema = z.discriminatedUnion("type", [
  z
    .object({
      id: z.string().min(1),
      type: z.literal("rectAperture1D"),
      label: z.string().min(1),
      xM: finiteNumber,
      gridId: z.string().min(1),
      widthM: positiveNumber,
      centerYM: finiteNumber
    })
    .strict()
]);

const sceneV3BaseSchema = sceneV2BaseSchema
  .omit({ schemaVersion: true })
  .extend({
    schemaVersion: z.literal("0.3.0"),
    waveSettings: z
      .object({
        defaultCoherence: z.literal("coherent"),
        defaultPolarization: z.literal("scalar-unpolarized-placeholder"),
        defaultGrid1DId: z.string().min(1).optional()
      })
      .strict(),
    fieldGrids1D: z.array(fieldGrid1DSchema),
    fieldPlanes1D: z.array(fieldPlane1DSchema),
    masks1D: z.array(mask1DSchema),
    sampleMasks1D: z.array(z.never())
  });

export const sceneV3Schema = sceneV3BaseSchema.superRefine((scene, ctx) => {
  validateSceneV2References(scene, ctx);

  const ids = new Set<string>();
  for (const id of [
    ...scene.fieldGrids1D.map((grid) => grid.id),
    ...scene.fieldPlanes1D.map((plane) => plane.id),
    ...scene.masks1D.map((mask) => mask.id)
  ]) {
    if (ids.has(id)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `duplicate wave id: ${id}` });
    }
    ids.add(id);
  }

  const gridIds = new Set(scene.fieldGrids1D.map((grid) => grid.id));
  const mediaIds = new Set(scene.mediaCatalog.map((medium) => medium.id));
  if (scene.waveSettings.defaultGrid1DId && !gridIds.has(scene.waveSettings.defaultGrid1DId)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `unknown default field grid id: ${scene.waveSettings.defaultGrid1DId}` });
  }
  for (const plane of scene.fieldPlanes1D) {
    if (!gridIds.has(plane.gridId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `field plane ${plane.id} references an unknown grid` });
    }
    if (!mediaIds.has(plane.mediumId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `field plane ${plane.id} references an unknown medium` });
    }
  }
  for (const mask of scene.masks1D) {
    if (!gridIds.has(mask.gridId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `mask ${mask.id} references an unknown grid` });
    }
  }
});

export type SourceElement = z.infer<typeof sourceElementSchema>;
export type OpticalElement = z.infer<typeof opticalElementSchema>;
export type ThinLensElement = Extract<OpticalElement, { type: "thinLens" }>;
export type ApertureElement = Extract<OpticalElement, { type: "aperture" }>;
export type ThickLens2DElement = Extract<OpticalElement, { type: "thickLens2D" }>;
export type DetectorElement = z.infer<typeof detectorElementSchema>;
export type Medium = z.infer<typeof mediumSchema>;
export type SurfaceElement2D = z.infer<typeof surfaceElement2DSchema>;
export type FieldGrid1D = z.infer<typeof fieldGrid1DSchema>;
export type FieldPlane1D = z.infer<typeof fieldPlane1DSchema>;
export type Mask1D = z.infer<typeof mask1DSchema>;
export type RectApertureMask1D = Extract<Mask1D, { type: "rectAperture1D" }>;
export type SceneV1 = z.infer<typeof sceneV1Schema>;
export type SceneV2 = z.infer<typeof sceneV2Schema>;
export type SceneV3 = z.infer<typeof sceneV3Schema>;
export type Scene = SceneV3;

export function parseSceneV1(value: unknown): SceneV1 {
  return sceneV1Schema.parse(value);
}

export function migrateSceneV1ToV2(scene: SceneV1): SceneV2 {
  return {
    ...scene,
    schemaVersion: "0.2.0",
    geometry: {
      dimension: "2d",
      opticalAxis: "x",
      transverseAxes: ["y"]
    },
    mediaCatalog: [
      {
        id: "air",
        label: "Air",
        refractiveIndex: {
          kind: "constant",
          n: scene.environment.ambientRefractiveIndex
        }
      }
    ],
    surfaceElements2D: [],
    assemblies2D: [],
    solverSettings: {
      ...scene.solverSettings,
      activeSolverId: "geometric.l0"
    }
  };
}

export function migrateSceneV2ToV3(scene: SceneV2): SceneV3 {
  return {
    ...scene,
    schemaVersion: "0.3.0",
    waveSettings: {
      defaultCoherence: "coherent",
      defaultPolarization: "scalar-unpolarized-placeholder"
    },
    fieldGrids1D: [],
    fieldPlanes1D: [],
    masks1D: [],
    sampleMasks1D: []
  };
}

export function parseScene(value: unknown): Scene {
  const maybeVersion = typeof value === "object" && value !== null ? (value as { schemaVersion?: unknown }).schemaVersion : undefined;
  if (maybeVersion === "0.1.0") {
    return migrateSceneV2ToV3(migrateSceneV1ToV2(parseSceneV1(value)));
  }
  if (maybeVersion === "0.2.0") {
    return migrateSceneV2ToV3(sceneV2Schema.parse(value));
  }
  return sceneV3Schema.parse(value);
}
