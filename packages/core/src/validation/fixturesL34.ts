import { createMeasuredImage2D, grayscaleMeasuredPixels2D, type MeasuredImagePixels2D } from "../measurement/measuredImage2d";
import type { MeasurementRoi2D, Scene } from "../scene/schema";
import { l33PresetScenes } from "./fixturesL33";

export const l34SyntheticPixels: MeasuredImagePixels2D = makeSyntheticLinePairPixels(96, 64, 12);

export const l34MeasuredImage = createMeasuredImage2D({
  id: "l34-synthetic-line-pairs",
  label: "Synthetic measured line-pair import",
  pixels: l34SyntheticPixels,
  importedAtIso: "2026-06-03T00:00:00.000Z",
  pixelDataPolicy: "external-session",
  calibration: {
    pixelSizeUM: 0.5,
    pixelSizeVM: 0.5,
    magnification: 10,
    wavelengthM: 500e-9,
    objectiveNA: 0.02,
    sourceNA: 0.0025,
    exposureS: 0.01,
    bitDepth: 12,
    notes: "Synthetic L3.4 fixture metadata"
  },
  source: "synthetic-fixture"
});

export const l34MeasurementRoi: MeasurementRoi2D = {
  id: "l34-line-pair-roi",
  imageId: l34MeasuredImage.id,
  label: "Line-pair ROI",
  type: "linePairs",
  xPx: 12,
  yPx: 8,
  widthPx: 72,
  heightPx: 48,
  rotationRad: 0
};

export const l34MeasuredScene: Scene = {
  ...l33PresetScenes.linePairs,
  schemaVersion: "0.7.0",
  sceneId: "sample-l34-measured-foundation",
  name: "L3.4 measured-image foundation fixture",
  measuredImages2D: [l34MeasuredImage],
  calibrationTargets2D: [
    {
      id: "l34-calibration-target",
      label: "Synthetic line-pair target metadata",
      measuredImageId: l34MeasuredImage.id,
      targetKind: "linePairs",
      testTargetId: "l33-line-pairs-24um"
    }
  ],
  measurementRois2D: [l34MeasurementRoi],
  comparisonRuns2D: [],
  fitRuns2D: [],
  comparisonReportSettings: {
    id: "l34-comparison-report",
    title: "L3.4 Measured-Data Foundation Report",
    includeLimitations: true,
    includeWarnings: true
  },
  metadata: {
    ...l33PresetScenes.linePairs.metadata,
    appVersion: "0.7.0"
  }
};

function makeSyntheticLinePairPixels(widthPx: number, heightPx: number, periodPx: number): MeasuredImagePixels2D {
  const values = new Float32Array(widthPx * heightPx);
  for (let y = 0; y < heightPx; y += 1) {
    for (let x = 0; x < widthPx; x += 1) {
      const bright = Math.floor(x / (periodPx / 2)) % 2 === 0;
      values[y * widthPx + x] = bright ? 0.9 : 0.18;
    }
  }
  return grayscaleMeasuredPixels2D(widthPx, heightPx, values);
}
