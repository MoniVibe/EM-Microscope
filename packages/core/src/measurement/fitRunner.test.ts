import { describe, expect, it } from "vitest";
import { createMeasuredImage2D } from "./measuredImage2d";
import { runMeasuredSimulatedComparison2D } from "./modelComparison2d";
import { runDeterministicFit2D, transformSimulatedPixels2D, makeFitRunCacheKey2D } from "./fitRunner";
import { fieldOutputFromMeasuredPixels2D, l34bLinePairPixels, l34bLinePairRoi } from "../validation/fixturesL34b";

describe("L3.4B deterministic fit runner", () => {
  it("recovers a known blur/scale/background surrogate from synthetic measured data", () => {
    const simulatedField = fieldOutputFromMeasuredPixels2D("fit-base", l34bLinePairPixels);
    const baseCrop = { widthPx: l34bLinePairRoi.widthPx, heightPx: l34bLinePairRoi.heightPx, data: crop(l34bLinePairPixels.data, l34bLinePairPixels.widthPx, l34bLinePairRoi) };
    const transformed = transformSimulatedPixels2D(baseCrop, {
      gaussianBlurSigmaPx: 1,
      intensityScale: 1.1,
      backgroundOffset: 0.05
    });
    const measuredPixels = {
      ...l34bLinePairPixels,
      data: paste(l34bLinePairPixels.data, l34bLinePairPixels.widthPx, l34bLinePairRoi, transformed.data)
    };
    const measuredImage = createMeasuredImage2D({
      id: "fit-measured",
      label: "Fit measured",
      pixels: measuredPixels,
      importedAtIso: "2026-06-03T00:00:00.000Z",
      pixelDataPolicy: "external-session",
      source: "synthetic-fixture"
    });
    const roi = { ...l34bLinePairRoi, imageId: measuredImage.id };
    const comparison = runMeasuredSimulatedComparison2D({
      id: "fit-comparison",
      measuredImage,
      measuredPixels,
      rois: [roi],
      simulatedField
    });
    const fitParameters = [
      { kind: "gaussianBlurSigmaPx" as const, min: 0, max: 2, steps: 5 },
      { kind: "intensityScale" as const, min: 0.9, max: 1.2, steps: 4 },
      { kind: "backgroundOffset" as const, min: 0, max: 0.1, steps: 3 }
    ];
    const fit = runDeterministicFit2D({ id: "fit-run", comparison, fitParameters });
    expect(fit.bestParameters.gaussianBlurSigmaPx).toBeCloseTo(1, 5);
    expect(fit.bestParameters.backgroundOffset).toBeCloseTo(0.05, 5);
    expect(fit.evaluatedCount).toBe(5 * 4 * 3);
    expect(fit.resultHash).toBe(runDeterministicFit2D({ id: "fit-run", comparison, fitParameters }).resultHash);
    expect(makeFitRunCacheKey2D(comparison, fitParameters)).not.toBe(makeFitRunCacheKey2D({ ...comparison, resultHash: "changed" }, fitParameters));
  });
});

function crop(data: Float32Array, imageWidthPx: number, roi: typeof l34bLinePairRoi): Float32Array {
  const output = new Float32Array(roi.widthPx * roi.heightPx);
  for (let y = 0; y < roi.heightPx; y += 1) {
    for (let x = 0; x < roi.widthPx; x += 1) {
      output[y * roi.widthPx + x] = data[(roi.yPx + y) * imageWidthPx + roi.xPx + x] ?? 0;
    }
  }
  return output;
}

function paste(original: Float32Array, imageWidthPx: number, roi: typeof l34bLinePairRoi, patch: Float32Array): Float32Array {
  const output = new Float32Array(original);
  for (let y = 0; y < roi.heightPx; y += 1) {
    for (let x = 0; x < roi.widthPx; x += 1) {
      output[(roi.yPx + y) * imageWidthPx + roi.xPx + x] = patch[y * roi.widthPx + x] ?? 0;
    }
  }
  return output;
}
