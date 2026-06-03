import { describe, expect, it } from "vitest";
import { fieldOutputFromMeasuredPixels2D, l34bLinePairPixels, l34bLinePairRoi, l34bMeasuredImage } from "../validation/fixturesL34b";
import { runMeasuredSimulatedComparison2D } from "./modelComparison2d";

describe("L3.4B measured-vs-simulated comparison", () => {
  it("compares measured metrics, simulated metrics, and residuals deterministically", () => {
    const field = fieldOutputFromMeasuredPixels2D("comparison-field", l34bLinePairPixels);
    const first = runMeasuredSimulatedComparison2D({
      id: "comparison",
      measuredImage: l34bMeasuredImage,
      measuredPixels: l34bLinePairPixels,
      rois: [l34bLinePairRoi],
      simulatedField: field
    });
    const second = runMeasuredSimulatedComparison2D({
      id: "comparison",
      measuredImage: l34bMeasuredImage,
      measuredPixels: l34bLinePairPixels,
      rois: [l34bLinePairRoi],
      simulatedField: field
    });
    expect(first.analysisId).toBe("analysis.measuredCompare.l3.4b.2d");
    expect(first.roiOutputs[0]?.measuredMetrics.contrastMichelson).toBeGreaterThan(0.5);
    expect(first.residualMap?.width).toBe(l34bLinePairRoi.widthPx);
    expect(first.resultHash).toBe(second.resultHash);
    expect(first.provenance.limitations.join(" ")).toContain("Not certified ISO 12233");
  });
});
