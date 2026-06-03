import { z } from "zod";

export const displayLengthUnitSchema = z.enum(["m", "mm", "um", "nm"]);
export const displayAngleUnitSchema = z.enum(["rad", "deg"]);

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

export const sceneV1Schema = z
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
  .strict()
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

export type SourceElement = z.infer<typeof sourceElementSchema>;
export type OpticalElement = z.infer<typeof opticalElementSchema>;
export type ThinLensElement = Extract<OpticalElement, { type: "thinLens" }>;
export type ApertureElement = Extract<OpticalElement, { type: "aperture" }>;
export type DetectorElement = z.infer<typeof detectorElementSchema>;
export type SceneV1 = z.infer<typeof sceneV1Schema>;

export function parseSceneV1(value: unknown): SceneV1 {
  return sceneV1Schema.parse(value);
}
