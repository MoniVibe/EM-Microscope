import { z } from "zod";

export const displayLengthUnitSchema = z.enum(["m", "mm", "um", "nm"]);
export const displayAngleUnitSchema = z.enum(["rad", "deg"]);
export const solverIdSchema = z.enum(["geometric.l0", "geometric.l1.2d"]);

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

export const sceneV2Schema = sceneV1BaseSchema
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
  })
  .superRefine((scene, ctx) => {
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
  });

export type SourceElement = z.infer<typeof sourceElementSchema>;
export type OpticalElement = z.infer<typeof opticalElementSchema>;
export type ThinLensElement = Extract<OpticalElement, { type: "thinLens" }>;
export type ApertureElement = Extract<OpticalElement, { type: "aperture" }>;
export type ThickLens2DElement = Extract<OpticalElement, { type: "thickLens2D" }>;
export type DetectorElement = z.infer<typeof detectorElementSchema>;
export type Medium = z.infer<typeof mediumSchema>;
export type SurfaceElement2D = z.infer<typeof surfaceElement2DSchema>;
export type SceneV1 = z.infer<typeof sceneV1Schema>;
export type SceneV2 = z.infer<typeof sceneV2Schema>;
export type Scene = SceneV2;

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

export function parseScene(value: unknown): Scene {
  const maybeVersion = typeof value === "object" && value !== null ? (value as { schemaVersion?: unknown }).schemaVersion : undefined;
  if (maybeVersion === "0.1.0") {
    return migrateSceneV1ToV2(parseSceneV1(value));
  }
  return sceneV2Schema.parse(value);
}
