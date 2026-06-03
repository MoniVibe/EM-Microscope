import { l3PresetScenes } from "./fixturesL3";
import { defaultL32CameraModel } from "../sensor/cameraModel";
import type { CameraModel2D, MeasurementSettings2D, Scene, SweepDefinition } from "../scene/schema";

export const l32Scene: Scene = l3PresetScenes.airyPupil;

export const l32Camera: CameraModel2D = l32Scene.cameraModels[0] ?? defaultL32CameraModel;

export const l32Measurement: MeasurementSettings2D = l32Scene.measurementSettings[0] ?? {
  id: "l3-measurement",
  label: "L3.2 target feature",
  targetFeaturePeriodM: 25e-6,
  mtfFrequencyCyclesPerM: 40_000,
  objectSpaceMagnification: 1
};

export const l32Sweep: SweepDefinition = l32Scene.sweepDefinitions[0] ?? {
  id: "l3-exposure-qe-sweep",
  label: "Exposure x QE",
  parameters: [
    { kind: "exposureS", values: [0.0025, 0.005, 0.01, 0.02] },
    { kind: "quantumEfficiency", values: [0.35, 0.62, 0.85] }
  ],
  outputs: ["snrMean", "saturationFraction", "contrastAtTarget"]
};
