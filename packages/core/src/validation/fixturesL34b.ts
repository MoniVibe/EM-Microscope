import { createMeasuredImage2D, grayscaleMeasuredPixels2D, type MeasuredImagePixels2D } from "../measurement/measuredImage2d";
import type { FieldOutput2D } from "../solvers/Solver";
import type { MeasurementRoi2D, Scene } from "../scene/schema";
import { l33PresetScenes } from "./fixturesL33";

export const l34bLinePairPixels = makeLinePairPixels(96, 64, 12, 0.92, 0.16);
export const l34bSlantedEdgePixels = makeSlantedEdgePixels(96, 64, (7 * Math.PI) / 180);
export const l34bPsfSpotPixels = makePsfSpotPixels(64, 64, 32.2, 30.8, 3.2);
export const l34bFlatPixels = makeFlatPixels(64, 64, 0.52, 0.035);
export const l34bDarkPixels = makeDarkPixels(64, 64, 0.08, 0.012);

export const l34bMeasuredImage = createMeasuredImage2D({
  id: "l34b-synthetic-line-pairs",
  label: "L3.4B synthetic measured line pairs",
  pixels: l34bLinePairPixels,
  importedAtIso: "2026-06-03T00:00:00.000Z",
  pixelDataPolicy: "external-session",
  calibration: {
    pixelSizeUM: 0.5,
    pixelSizeVM: 0.5,
    magnification: 10,
    wavelengthM: 500e-9,
    objectiveNA: 0.04,
    sourceNA: 0.01,
    exposureS: 0.01,
    bitDepth: 12,
    notes: "Synthetic L3.4B measured-vs-simulated fixture metadata"
  },
  source: "synthetic-fixture"
});

export const l34bLinePairRoi: MeasurementRoi2D = {
  id: "l34b-line-pair-roi",
  imageId: l34bMeasuredImage.id,
  label: "L3.4B line-pair ROI",
  type: "linePairs",
  xPx: 8,
  yPx: 8,
  widthPx: 80,
  heightPx: 48,
  rotationRad: 0
};

export const l34bMeasuredScene: Scene = {
  ...l33PresetScenes.linePairs,
  schemaVersion: "0.7.0",
  sceneId: "sample-l34b-compare-fit",
  name: "L3.4B measured-vs-simulated compare and fit fixture",
  measuredImages2D: [l34bMeasuredImage],
  calibrationTargets2D: [
    {
      id: "l34b-line-pair-calibration",
      label: "L3.4B line-pair target metadata",
      measuredImageId: l34bMeasuredImage.id,
      targetKind: "linePairs",
      testTargetId: "l33-line-pairs-24um"
    }
  ],
  measurementRois2D: [l34bLinePairRoi],
  comparisonRuns2D: [
    {
      id: "l34b-comparison-run",
      label: "L3.4B synthetic comparison",
      measuredImageId: l34bMeasuredImage.id,
      roiIds: [l34bLinePairRoi.id],
      targetModelId: "l33-line-pairs-24um",
      metricIds: ["contrast", "background", "noise"]
    }
  ],
  fitRuns2D: [
    {
      id: "l34b-fit-run",
      comparisonRunId: "l34b-comparison-run",
      optimizer: "gridSearch",
      fitParameters: [
        { kind: "gaussianBlurSigmaPx", min: 0, max: 2, steps: 5 },
        { kind: "intensityScale", min: 0.8, max: 1.2, steps: 5 },
        { kind: "backgroundOffset", min: 0, max: 0.1, steps: 3 }
      ]
    }
  ],
  comparisonReportSettings: {
    id: "l34b-comparison-report",
    title: "L3.4B Measured-vs-Simulated Workbench Report",
    includeLimitations: true,
    includeWarnings: true
  },
  metadata: {
    ...l33PresetScenes.linePairs.metadata,
    appVersion: "0.7.0"
  }
};

export function fieldOutputFromMeasuredPixels2D(id: string, pixels: MeasuredImagePixels2D): FieldOutput2D {
  return {
    id,
    type: "fieldImage2D",
    planeId: `${id}-plane`,
    gridId: `${id}-grid`,
    xM: 0,
    width: pixels.widthPx,
    height: pixels.heightPx,
    uMinM: -pixels.widthPx / 2,
    uMaxM: pixels.widthPx / 2,
    vMinM: -pixels.heightPx / 2,
    vMaxM: pixels.heightPx / 2,
    intensity: Float64Array.from(pixels.data),
    normalization: "peak-normalized",
    units: {
      u: "m",
      v: "m",
      intensity: "relative"
    },
    provenance: {
      kind: "simulated",
      level: "L3",
      solverId: "scalar.partialCoherent.l3.3.2d",
      model: "scalar-partial-coherence-2d-angular-spectrum",
      dimensionality: "2d",
      approximation: ["synthetic fixture field generated from measured-like pixels"]
    }
  };
}

function makeLinePairPixels(widthPx: number, heightPx: number, periodPx: number, bright: number, dark: number): MeasuredImagePixels2D {
  const values = new Float32Array(widthPx * heightPx);
  for (let y = 0; y < heightPx; y += 1) {
    for (let x = 0; x < widthPx; x += 1) {
      const isBright = Math.floor(x / (periodPx / 2)) % 2 === 0;
      const falloff = 1 - 0.12 * (y / Math.max(1, heightPx - 1));
      values[y * widthPx + x] = isBright ? bright * falloff : dark;
    }
  }
  return grayscaleMeasuredPixels2D(widthPx, heightPx, values);
}

function makeSlantedEdgePixels(widthPx: number, heightPx: number, angleRad: number): MeasuredImagePixels2D {
  const values = new Float32Array(widthPx * heightPx);
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  for (let y = 0; y < heightPx; y += 1) {
    for (let x = 0; x < widthPx; x += 1) {
      const edge = (x - widthPx / 2) * cos + (y - heightPx / 2) * sin;
      values[y * widthPx + x] = edge >= 0 ? 0.88 : 0.12;
    }
  }
  return grayscaleMeasuredPixels2D(widthPx, heightPx, values);
}

function makePsfSpotPixels(widthPx: number, heightPx: number, centerXPx: number, centerYPx: number, sigmaPx: number): MeasuredImagePixels2D {
  const values = new Float32Array(widthPx * heightPx);
  for (let y = 0; y < heightPx; y += 1) {
    for (let x = 0; x < widthPx; x += 1) {
      const dx = x - centerXPx;
      const dy = y - centerYPx;
      values[y * widthPx + x] = 0.04 + 0.9 * Math.exp(-(dx * dx + dy * dy) / (2 * sigmaPx * sigmaPx));
    }
  }
  return grayscaleMeasuredPixels2D(widthPx, heightPx, values);
}

function makeFlatPixels(widthPx: number, heightPx: number, mean: number, gradient: number): MeasuredImagePixels2D {
  const values = new Float32Array(widthPx * heightPx);
  for (let y = 0; y < heightPx; y += 1) {
    for (let x = 0; x < widthPx; x += 1) {
      values[y * widthPx + x] = mean + gradient * ((x / Math.max(1, widthPx - 1)) - 0.5);
    }
  }
  return grayscaleMeasuredPixels2D(widthPx, heightPx, values);
}

function makeDarkPixels(widthPx: number, heightPx: number, offset: number, ripple: number): MeasuredImagePixels2D {
  const values = new Float32Array(widthPx * heightPx);
  for (let y = 0; y < heightPx; y += 1) {
    for (let x = 0; x < widthPx; x += 1) {
      values[y * widthPx + x] = offset + ripple * (((x * 13 + y * 7) % 11) / 10 - 0.5);
    }
  }
  return grayscaleMeasuredPixels2D(widthPx, heightPx, values);
}
