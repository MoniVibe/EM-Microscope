import type { IlluminationModel2D, Scene, TestTarget2D } from "../scene/schema";
import { makeL3PresetScene } from "./fixturesL3";

export type L33PresetId = "linePairs" | "slantedEdge" | "siemensStar";

export type L33PresetDefinition = {
  id: L33PresetId;
  label: string;
  scene: Scene;
};

const gridSamples = 128;
const sourceNA = 0.0025;

export const l33PresetLabels: Record<L33PresetId, string> = {
  linePairs: "Brightfield line-pair target",
  slantedEdge: "Brightfield slanted-edge SFR target",
  siemensStar: "Brightfield Siemens-star-like target"
};

const illuminationModels: IlluminationModel2D[] = [
  {
    id: "l33-uniform-disk-source",
    label: "Uniform condenser disk",
    kind: "uniformDisk",
    sourceNA,
    condenserNA: 0.005,
    sampleCount: 9,
    pattern: "rings",
    seed: 3301
  },
  {
    id: "l33-center-source",
    label: "Center coherent angle",
    kind: "singleCoherentAngle",
    angleURad: 0,
    angleVRad: 0
  }
];

const testTargets: TestTarget2D[] = [
  {
    id: "l33-line-pairs-24um",
    label: "24 um line pairs",
    kind: "linePairs",
    periodM: 24e-6,
    dutyCycle: 0.5,
    orientationRad: 0,
    contrast: 0.85
  },
  {
    id: "l33-slanted-edge",
    label: "5 degree slanted edge",
    kind: "slantedEdge",
    edgeAngleRad: (5 * Math.PI) / 180,
    contrast: 0.85
  },
  {
    id: "l33-siemens-star",
    label: "64-spoke Siemens-star-like target",
    kind: "siemensStarLike",
    spokeCount: 64,
    innerRadiusM: 30e-6,
    outerRadiusM: 0.75e-3,
    contrast: 0.85
  },
  {
    id: "l33-checkerboard-40um",
    label: "40 um checkerboard",
    kind: "checkerboard",
    periodM: 40e-6,
    contrast: 0.8
  }
];

export function makeL33PresetScene(id: L33PresetId): Scene {
  const base = makeL3PresetScene("airyPupil");
  const targetId =
    id === "linePairs" ? "l33-line-pairs-24um" : id === "slantedEdge" ? "l33-slanted-edge" : "l33-siemens-star";
  const windowM = base.fieldGrids2D[0] ? base.fieldGrids2D[0].uMaxM - base.fieldGrids2D[0].uMinM : 0.002;
  const spacingM = windowM / gridSamples;

  return {
    ...base,
    schemaVersion: "0.7.0",
    sceneId: `sample-l33-${id}`,
    name: `L3.3 ${l33PresetLabels[id]}`,
    solverSettings: {
      ...base.solverSettings,
      activeSolverId: "scalar.partialCoherent.l3.3.2d"
    },
    fieldGrids2D: base.fieldGrids2D.map((grid) => ({
      ...grid,
      width: gridSamples,
      height: gridSamples,
      spacingUM: spacingM,
      spacingVM: spacingM
    })),
    microscopePipelines2D: base.microscopePipelines2D.map((pipeline) => ({
      ...pipeline,
      label: "Coherent scalar sub-solve for L3.3 brightfield",
      samplePlaneIds: []
    })),
    illuminationModels2D: structuredClone(illuminationModels),
    sourceAngleSets2D: [],
    testTargets2D: structuredClone(testTargets),
    brightfieldPipelines2D: [
      {
        id: "l33-brightfield-pipeline",
        label: "Partial-coherent scalar brightfield",
        coherentPipelineId: "l3-pipeline",
        illuminationModelId: "l33-uniform-disk-source",
        testTargetId: targetId,
        outputFieldPolicy: "averagedDetectorOnly"
      }
    ],
    measurementSettings: [
      {
        id: "l33-target-measurement",
        label: "L3.3 target feature",
        targetFeaturePeriodM: targetId === "l33-line-pairs-24um" ? 24e-6 : targetId === "l33-siemens-star" ? 75e-6 : undefined,
        mtfFrequencyCyclesPerM: targetId === "l33-line-pairs-24um" ? 1 / 24e-6 : 40_000,
        objectSpaceMagnification: 1
      }
    ],
    sweepDefinitions: [
      {
        id: "l33-source-pixel-exposure-sweep",
        label: "Source NA x pixel x exposure",
        parameters: [
          { kind: "sourceNA", values: [0, sourceNA, 0.005] },
          { kind: "pixelPitchM", values: [4.5e-6, 6.5e-6] },
          { kind: "exposureS", values: [0.005, 0.01] }
        ],
        outputs: ["snrMean", "saturationFraction", "contrastAtTarget", "edgeEnergyFraction"]
      }
    ],
    reportSettings: {
      id: "l33-report",
      title: "L3.3 Brightfield Partial-Coherence Report",
      includeLimitations: true,
      includeWarnings: true
    },
    metadata: {
      ...base.metadata,
      appVersion: "0.7.0"
    }
  };
}

export const l33PresetScenes: Record<L33PresetId, Scene> = {
  linePairs: makeL33PresetScene("linePairs"),
  slantedEdge: makeL33PresetScene("slantedEdge"),
  siemensStar: makeL33PresetScene("siemensStar")
};

export const l33PresetDefinitions: L33PresetDefinition[] = [
  { id: "linePairs", label: l33PresetLabels.linePairs, scene: l33PresetScenes.linePairs },
  { id: "slantedEdge", label: l33PresetLabels.slantedEdge, scene: l33PresetScenes.slantedEdge },
  { id: "siemensStar", label: l33PresetLabels.siemensStar, scene: l33PresetScenes.siemensStar }
];
