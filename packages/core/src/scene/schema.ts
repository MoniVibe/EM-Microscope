import { z } from "zod";

export const displayLengthUnitSchema = z.enum(["m", "mm", "um", "nm"]);
export const displayAngleUnitSchema = z.enum(["rad", "deg"]);
export const solverIdSchema = z.enum(["geometric.l0", "geometric.l1.2d", "scalar.angularSpectrum.l2.1d", "scalar.coherent.l3.2d"]);

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

const sampleAmplitudeProfile1DSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("singleSlit"),
      widthM: positiveNumber,
      centerYM: finiteNumber
    })
    .strict(),
  z
    .object({
      kind: z.literal("doubleSlit"),
      slitWidthM: positiveNumber,
      separationM: positiveNumber,
      centerYM: finiteNumber
    })
    .strict(),
  z
    .object({
      kind: z.literal("grating"),
      periodM: positiveNumber,
      slitWidthM: positiveNumber,
      count: z.number().int().min(1).max(201),
      centerYM: finiteNumber
    })
    .strict(),
  z
    .object({
      kind: z.literal("barTarget1D"),
      periodM: positiveNumber,
      dutyCycle: z.number().finite().min(0.01).max(0.99),
      bars: z.number().int().min(1).max(201),
      contrast: z.number().finite().min(0).max(1),
      centerYM: finiteNumber
    })
    .strict()
]);

const samplePhaseProfile1DSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("phaseStep"),
      stepYM: finiteNumber,
      phaseLeftRad: finiteNumber,
      phaseRightRad: finiteNumber
    })
    .strict(),
  z
    .object({
      kind: z.literal("phaseGrating"),
      periodM: positiveNumber,
      dutyCycle: z.number().finite().min(0.01).max(0.99),
      phaseDepthRad: finiteNumber,
      centerYM: finiteNumber
    })
    .strict()
]);

export const sampleTransmission1DSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("analyticAmplitude"),
      profile: sampleAmplitudeProfile1DSchema
    })
    .strict(),
  z
    .object({
      kind: z.literal("analyticPhase"),
      profile: samplePhaseProfile1DSchema
    })
    .strict(),
  z
    .object({
      kind: z.literal("analyticComplex"),
      amplitudeProfile: sampleAmplitudeProfile1DSchema,
      phaseProfile: samplePhaseProfile1DSchema
    })
    .strict()
]);

export const samplePlane1DSchema = z
  .object({
    id: z.string().min(1),
    type: z.literal("samplePlane1D"),
    label: z.string().min(1),
    xM: finiteNumber,
    gridId: z.string().min(1),
    transmission: sampleTransmission1DSchema
  })
  .strict();

export const fieldGrid2DSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    uMinM: finiteNumber,
    uMaxM: finiteNumber,
    vMinM: finiteNumber,
    vMaxM: finiteNumber,
    width: z.number().int().min(16).max(1024),
    height: z.number().int().min(16).max(1024),
    spacingUM: positiveNumber,
    spacingVM: positiveNumber
  })
  .strict()
  .refine((grid) => grid.uMaxM > grid.uMinM, "uMaxM must be greater than uMinM")
  .refine((grid) => grid.vMaxM > grid.vMinM, "vMaxM must be greater than vMinM")
  .refine((grid) => Math.abs(grid.spacingUM - (grid.uMaxM - grid.uMinM) / grid.width) <= Math.max(1e-15, grid.spacingUM * 1e-9), {
    message: "spacingUM must equal (uMaxM - uMinM) / width"
  })
  .refine((grid) => Math.abs(grid.spacingVM - (grid.vMaxM - grid.vMinM) / grid.height) <= Math.max(1e-15, grid.spacingVM * 1e-9), {
    message: "spacingVM must equal (vMaxM - vMinM) / height"
  });

const fieldSource2DSchema = z.discriminatedUnion("kind", [
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
      waistUM: positiveNumber,
      waistVM: positiveNumber,
      amplitude: nonNegativeNumber,
      phaseRad: finiteNumber.default(0),
      centerUM: finiteNumber.default(0),
      centerVM: finiteNumber.default(0)
    })
    .strict()
]);

export const fieldPlane2DSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    role: z.enum(["source", "detector"]),
    xM: finiteNumber,
    gridId: z.string().min(1),
    mediumId: z.string().min(1),
    fieldSource: fieldSource2DSchema.optional()
  })
  .strict()
  .superRefine((plane, ctx) => {
    if (plane.role === "source" && !plane.fieldSource) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `2D field plane ${plane.id} is a source but has no fieldSource` });
    }
  });

export const sampleTransmission2DSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("uniform"),
      amplitude: nonNegativeNumber,
      phaseRad: finiteNumber
    })
    .strict(),
  z
    .object({
      kind: z.literal("disc"),
      radiusM: positiveNumber,
      centerUM: finiteNumber.default(0),
      centerVM: finiteNumber.default(0),
      amplitudeInside: nonNegativeNumber,
      amplitudeOutside: nonNegativeNumber,
      phaseInsideRad: finiteNumber.default(0),
      phaseOutsideRad: finiteNumber.default(0)
    })
    .strict(),
  z
    .object({
      kind: z.literal("doubleSlit2D"),
      slitWidthM: positiveNumber,
      slitHeightM: positiveNumber,
      separationM: positiveNumber,
      centerUM: finiteNumber.default(0),
      centerVM: finiteNumber.default(0)
    })
    .strict(),
  z
    .object({
      kind: z.literal("grating2D"),
      periodM: positiveNumber,
      dutyCycle: z.number().finite().min(0.01).max(0.99),
      orientationRad: finiteNumber.default(0),
      centerUM: finiteNumber.default(0),
      centerVM: finiteNumber.default(0)
    })
    .strict(),
  z
    .object({
      kind: z.literal("barTarget2D"),
      periodM: positiveNumber,
      dutyCycle: z.number().finite().min(0.01).max(0.99),
      bars: z.number().int().min(1).max(201),
      contrast: z.number().finite().min(0).max(1),
      orientationRad: finiteNumber.default(0),
      centerUM: finiteNumber.default(0),
      centerVM: finiteNumber.default(0)
    })
    .strict(),
  z
    .object({
      kind: z.literal("phaseStep2D"),
      boundaryUM: finiteNumber,
      phaseLeftRad: finiteNumber,
      phaseRightRad: finiteNumber
    })
    .strict(),
  z
    .object({
      kind: z.literal("checkerboard"),
      periodM: positiveNumber,
      contrast: z.number().finite().min(0).max(1),
      centerUM: finiteNumber.default(0),
      centerVM: finiteNumber.default(0)
    })
    .strict()
]);

export const samplePlane2DSchema = z
  .object({
    id: z.string().min(1),
    type: z.literal("samplePlane2D"),
    label: z.string().min(1),
    xM: finiteNumber,
    gridId: z.string().min(1),
    transmission: sampleTransmission2DSchema
  })
  .strict();

export const pupilPlane2DSchema = z
  .object({
    id: z.string().min(1),
    type: z.literal("pupilPlane2D"),
    label: z.string().min(1),
    xM: finiteNumber,
    gridId: z.string().min(1),
    shape: z.discriminatedUnion("kind", [
      z
        .object({
          kind: z.literal("circle"),
          radiusM: positiveNumber,
          centerUM: finiteNumber.default(0),
          centerVM: finiteNumber.default(0)
        })
        .strict(),
      z
        .object({
          kind: z.literal("annulus"),
          innerRadiusM: nonNegativeNumber,
          outerRadiusM: positiveNumber,
          centerUM: finiteNumber.default(0),
          centerVM: finiteNumber.default(0)
        })
        .strict()
    ]),
    numericalAperture: positiveNumber.optional()
  })
  .strict()
  .superRefine((plane, ctx) => {
    if (plane.shape.kind === "annulus" && plane.shape.innerRadiusM >= plane.shape.outerRadiusM) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `pupil plane ${plane.id} annulus inner radius must be smaller than outer radius` });
    }
  });

export const thinLensPhasePlane2DSchema = z
  .object({
    id: z.string().min(1),
    type: z.literal("thinLensPhasePlane2D"),
    label: z.string().min(1),
    xM: finiteNumber,
    gridId: z.string().min(1),
    focalLengthM: finiteNumber.refine((value) => Math.abs(value) > 1e-12, "focal length cannot be zero"),
    centerUM: finiteNumber.default(0),
    centerVM: finiteNumber.default(0)
  })
  .strict();

export const detectorPlane2DSchema = z
  .object({
    id: z.string().min(1),
    type: z.literal("detectorPlane2D"),
    label: z.string().min(1),
    xM: finiteNumber,
    gridId: z.string().min(1),
    mediumId: z.string().min(1),
    output: z.literal("intensity")
  })
  .strict();

export const coherentMicroscopePipeline2DSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    sourcePlaneId: z.string().min(1),
    samplePlaneIds: z.array(z.string().min(1)),
    lensPlaneId: z.string().min(1),
    pupilPlaneId: z.string().min(1),
    detectorPlaneId: z.string().min(1),
    wavelengthM: positiveNumber,
    mediumId: z.string().min(1),
    outputFieldPolicy: z.enum(["detectorOnly", "allPlanes"])
  })
  .strict();

export const cameraModel2DSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    pixelPitchM: positiveNumber,
    widthPx: z.number().int().min(4).max(4096),
    heightPx: z.number().int().min(4).max(4096),
    quantumEfficiency: z.number().finite().min(0).max(1),
    exposureS: positiveNumber,
    fullWellElectrons: positiveNumber,
    readNoiseElectronsRms: nonNegativeNumber,
    darkCurrentElectronsPerS: nonNegativeNumber,
    bitDepth: z.union([z.literal(8), z.literal(10), z.literal(12), z.literal(14), z.literal(16)]),
    gainDnPerElectron: positiveNumber,
    blackLevelDn: nonNegativeNumber,
    peakPhotonRatePerS: positiveNumber.default(2e6),
    nonuniformity: z
      .object({
        prnuStdFraction: nonNegativeNumber.optional(),
        dsnuElectronsRms: nonNegativeNumber.optional()
      })
      .strict()
      .optional(),
    seed: z.number().int()
  })
  .strict();

export const sensorPipeline2DSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    inputFieldOutputId: z.string().min(1).optional(),
    cameraModelId: z.string().min(1),
    outputPolicy: z.enum(["pixelatedOnly", "pixelatedAndNoisy"])
  })
  .strict();

export const measurementSettings2DSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    targetFeaturePeriodM: positiveNumber.optional(),
    mtfFrequencyCyclesPerM: positiveNumber.optional(),
    objectSpaceMagnification: positiveNumber.optional()
  })
  .strict();

export const sweepParameterSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("wavelengthM"), values: z.array(positiveNumber).min(1).max(16) }).strict(),
  z.object({ kind: z.literal("numericalAperture"), values: z.array(positiveNumber).min(1).max(16) }).strict(),
  z.object({ kind: z.literal("defocusM"), values: z.array(finiteNumber).min(1).max(16) }).strict(),
  z.object({ kind: z.literal("pixelPitchM"), values: z.array(positiveNumber).min(1).max(16) }).strict(),
  z.object({ kind: z.literal("exposureS"), values: z.array(positiveNumber).min(1).max(16) }).strict(),
  z.object({ kind: z.literal("quantumEfficiency"), values: z.array(z.number().finite().min(0).max(1)).min(1).max(16) }).strict()
]);

export const sweepDefinitionSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    parameters: z.array(sweepParameterSchema).min(1).max(3),
    outputs: z.array(z.enum(["mtf50", "snrMean", "saturationFraction", "contrastAtTarget", "edgeEnergyFraction"])).min(1)
  })
  .strict();

export const engineeringReportSettingsSchema = z
  .object({
    id: z.string().min(1).default("report-default"),
    title: z.string().min(1).default("L3.2 Instrument Performance Report"),
    includeLimitations: z.boolean().default(true),
    includeWarnings: z.boolean().default(true)
  })
  .strict()
  .default({});

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
    samplePlanes1D: z.array(samplePlane1DSchema).default([]),
    sampleMasks1D: z.array(z.never()).default([])
  });

type SceneV3ReferenceInput = Omit<z.infer<typeof sceneV3BaseSchema>, "schemaVersion">;

function validateSceneV3WaveReferences(scene: SceneV3ReferenceInput, ctx: z.RefinementCtx): void {
  validateSceneV2References(scene, ctx);

  const ids = new Set<string>();
  for (const id of [
    ...scene.fieldGrids1D.map((grid) => grid.id),
    ...scene.fieldPlanes1D.map((plane) => plane.id),
    ...scene.masks1D.map((mask) => mask.id),
    ...scene.samplePlanes1D.map((sample) => sample.id)
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
  for (const sample of scene.samplePlanes1D) {
    if (!gridIds.has(sample.gridId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `sample plane ${sample.id} references an unknown grid` });
    }
  }
}

export const sceneV3Schema = sceneV3BaseSchema.superRefine(validateSceneV3WaveReferences);

const sceneV4BaseSchema = sceneV3BaseSchema
  .omit({ schemaVersion: true, waveSettings: true })
  .extend({
    schemaVersion: z.literal("0.4.0"),
    waveSettings: z
      .object({
        defaultCoherence: z.literal("coherent"),
        defaultPolarization: z.literal("scalar-unpolarized-placeholder"),
        defaultGrid1DId: z.string().min(1).optional(),
        defaultGrid2DId: z.string().min(1).optional()
      })
      .strict(),
    fieldGrids2D: z.array(fieldGrid2DSchema).default([]),
    fieldPlanes2D: z.array(fieldPlane2DSchema).default([]),
    samplePlanes2D: z.array(samplePlane2DSchema).default([]),
    pupilPlanes2D: z.array(pupilPlane2DSchema).default([]),
    thinLensPhasePlanes2D: z.array(thinLensPhasePlane2DSchema).default([]),
    detectorPlanes2D: z.array(detectorPlane2DSchema).default([]),
    microscopePipelines2D: z.array(coherentMicroscopePipeline2DSchema).default([])
  });

type SceneV4ReferenceInput = Omit<z.infer<typeof sceneV4BaseSchema>, "schemaVersion">;

function validateSceneV4References(scene: SceneV4ReferenceInput, ctx: z.RefinementCtx): void {
  validateSceneV3WaveReferences(scene, ctx);

  const ids = new Set<string>();
  for (const id of [
    ...scene.fieldGrids2D.map((grid) => grid.id),
    ...scene.fieldPlanes2D.map((plane) => plane.id),
    ...scene.samplePlanes2D.map((sample) => sample.id),
    ...scene.pupilPlanes2D.map((pupil) => pupil.id),
    ...scene.thinLensPhasePlanes2D.map((lens) => lens.id),
    ...scene.detectorPlanes2D.map((detector) => detector.id),
    ...scene.microscopePipelines2D.map((pipeline) => pipeline.id)
  ]) {
    if (ids.has(id)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `duplicate 2D wave id: ${id}` });
    }
    ids.add(id);
  }

  const gridIds = new Set(scene.fieldGrids2D.map((grid) => grid.id));
  const mediaIds = new Set(scene.mediaCatalog.map((medium) => medium.id));
  const fieldPlaneIds = new Set(scene.fieldPlanes2D.map((plane) => plane.id));
  const samplePlaneIds = new Set(scene.samplePlanes2D.map((sample) => sample.id));
  const lensPlaneIds = new Set(scene.thinLensPhasePlanes2D.map((lens) => lens.id));
  const pupilPlaneIds = new Set(scene.pupilPlanes2D.map((pupil) => pupil.id));
  const detectorPlaneIds = new Set(scene.detectorPlanes2D.map((detector) => detector.id));

  if (scene.waveSettings.defaultGrid2DId && !gridIds.has(scene.waveSettings.defaultGrid2DId)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `unknown default 2D field grid id: ${scene.waveSettings.defaultGrid2DId}` });
  }
  for (const plane of scene.fieldPlanes2D) {
    if (!gridIds.has(plane.gridId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `2D field plane ${plane.id} references an unknown grid` });
    }
    if (!mediaIds.has(plane.mediumId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `2D field plane ${plane.id} references an unknown medium` });
    }
  }
  for (const sample of scene.samplePlanes2D) {
    if (!gridIds.has(sample.gridId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `2D sample plane ${sample.id} references an unknown grid` });
    }
  }
  for (const pupil of scene.pupilPlanes2D) {
    if (!gridIds.has(pupil.gridId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `2D pupil plane ${pupil.id} references an unknown grid` });
    }
  }
  for (const lens of scene.thinLensPhasePlanes2D) {
    if (!gridIds.has(lens.gridId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `2D thin-lens phase plane ${lens.id} references an unknown grid` });
    }
  }
  for (const detector of scene.detectorPlanes2D) {
    if (!gridIds.has(detector.gridId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `2D detector plane ${detector.id} references an unknown grid` });
    }
    if (!mediaIds.has(detector.mediumId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `2D detector plane ${detector.id} references an unknown medium` });
    }
  }
  for (const pipeline of scene.microscopePipelines2D) {
    if (!fieldPlaneIds.has(pipeline.sourcePlaneId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `2D pipeline ${pipeline.id} references an unknown source plane` });
    }
    for (const samplePlaneId of pipeline.samplePlaneIds) {
      if (!samplePlaneIds.has(samplePlaneId)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `2D pipeline ${pipeline.id} references an unknown sample plane` });
      }
    }
    if (!lensPlaneIds.has(pipeline.lensPlaneId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `2D pipeline ${pipeline.id} references an unknown thin-lens phase plane` });
    }
    if (!pupilPlaneIds.has(pipeline.pupilPlaneId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `2D pipeline ${pipeline.id} references an unknown pupil plane` });
    }
    if (!detectorPlaneIds.has(pipeline.detectorPlaneId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `2D pipeline ${pipeline.id} references an unknown detector plane` });
    }
    if (!mediaIds.has(pipeline.mediumId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `2D pipeline ${pipeline.id} references an unknown medium` });
    }
  }
}

export const sceneV4Schema = sceneV4BaseSchema.superRefine(validateSceneV4References);

const sceneV5BaseSchema = sceneV4BaseSchema
  .omit({ schemaVersion: true })
  .extend({
    schemaVersion: z.literal("0.5.0"),
    cameraModels: z.array(cameraModel2DSchema).default([]),
    sensorPipelines2D: z.array(sensorPipeline2DSchema).default([]),
    measurementSettings: z.array(measurementSettings2DSchema).default([]),
    sweepDefinitions: z.array(sweepDefinitionSchema).default([]),
    reportSettings: engineeringReportSettingsSchema
  });

type SceneV5ReferenceInput = Omit<z.infer<typeof sceneV5BaseSchema>, "schemaVersion">;

function validateSceneV5References(scene: SceneV5ReferenceInput, ctx: z.RefinementCtx): void {
  validateSceneV4References(scene, ctx);

  const ids = new Set<string>();
  for (const id of [
    ...scene.cameraModels.map((camera) => camera.id),
    ...scene.sensorPipelines2D.map((pipeline) => pipeline.id),
    ...scene.measurementSettings.map((settings) => settings.id),
    ...scene.sweepDefinitions.map((sweep) => sweep.id)
  ]) {
    if (ids.has(id)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `duplicate L3.2 id: ${id}` });
    }
    ids.add(id);
  }

  const cameraIds = new Set(scene.cameraModels.map((camera) => camera.id));
  for (const pipeline of scene.sensorPipelines2D) {
    if (!cameraIds.has(pipeline.cameraModelId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `sensor pipeline ${pipeline.id} references an unknown camera model` });
    }
  }
}

export const sceneV5Schema = sceneV5BaseSchema.superRefine(validateSceneV5References);

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
export type SampleTransmission1D = z.infer<typeof sampleTransmission1DSchema>;
export type SamplePlane1D = z.infer<typeof samplePlane1DSchema>;
export type FieldGrid2D = z.infer<typeof fieldGrid2DSchema>;
export type FieldPlane2D = z.infer<typeof fieldPlane2DSchema>;
export type SampleTransmission2D = z.infer<typeof sampleTransmission2DSchema>;
export type SamplePlane2D = z.infer<typeof samplePlane2DSchema>;
export type PupilPlane2D = z.infer<typeof pupilPlane2DSchema>;
export type ThinLensPhasePlane2D = z.infer<typeof thinLensPhasePlane2DSchema>;
export type DetectorPlane2D = z.infer<typeof detectorPlane2DSchema>;
export type CoherentMicroscopePipeline2D = z.infer<typeof coherentMicroscopePipeline2DSchema>;
export type CameraModel2D = z.infer<typeof cameraModel2DSchema>;
export type SensorPipeline2D = z.infer<typeof sensorPipeline2DSchema>;
export type MeasurementSettings2D = z.infer<typeof measurementSettings2DSchema>;
export type SweepParameter = z.infer<typeof sweepParameterSchema>;
export type SweepDefinition = z.infer<typeof sweepDefinitionSchema>;
export type EngineeringReportSettings = z.infer<typeof engineeringReportSettingsSchema>;
export type SceneV1 = z.infer<typeof sceneV1Schema>;
export type SceneV2 = z.infer<typeof sceneV2Schema>;
export type SceneV3 = z.infer<typeof sceneV3Schema>;
export type SceneV4 = z.infer<typeof sceneV4Schema>;
export type SceneV5 = z.infer<typeof sceneV5Schema>;
export type Scene = SceneV5;

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
    samplePlanes1D: [],
    sampleMasks1D: []
  };
}

export function migrateSceneV3ToV4(scene: SceneV3): SceneV4 {
  return {
    ...scene,
    schemaVersion: "0.4.0",
    waveSettings: {
      ...scene.waveSettings
    },
    fieldGrids2D: [],
    fieldPlanes2D: [],
    samplePlanes2D: [],
    pupilPlanes2D: [],
    thinLensPhasePlanes2D: [],
    detectorPlanes2D: [],
    microscopePipelines2D: []
  };
}

export function migrateSceneV4ToV5(scene: SceneV4): SceneV5 {
  return {
    ...scene,
    schemaVersion: "0.5.0",
    cameraModels: [],
    sensorPipelines2D: [],
    measurementSettings: [],
    sweepDefinitions: [],
    reportSettings: {
      id: "report-default",
      title: "L3.2 Instrument Performance Report",
      includeLimitations: true,
      includeWarnings: true
    }
  };
}

export function parseScene(value: unknown): Scene {
  const maybeVersion = typeof value === "object" && value !== null ? (value as { schemaVersion?: unknown }).schemaVersion : undefined;
  if (maybeVersion === "0.1.0") {
    return migrateSceneV4ToV5(migrateSceneV3ToV4(migrateSceneV2ToV3(migrateSceneV1ToV2(parseSceneV1(value)))));
  }
  if (maybeVersion === "0.2.0") {
    return migrateSceneV4ToV5(migrateSceneV3ToV4(migrateSceneV2ToV3(sceneV2Schema.parse(value))));
  }
  if (maybeVersion === "0.3.0") {
    return migrateSceneV4ToV5(migrateSceneV3ToV4(sceneV3Schema.parse(value)));
  }
  if (maybeVersion === "0.4.0") {
    return migrateSceneV4ToV5(sceneV4Schema.parse(value));
  }
  return sceneV5Schema.parse(value);
}
