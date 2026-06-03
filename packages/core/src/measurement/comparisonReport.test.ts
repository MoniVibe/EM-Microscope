import { describe, expect, it } from "vitest";
import { createComparisonReport2D, comparisonReportToHtml, comparisonReportToJson, comparisonReportToMarkdown } from "./comparisonReport";
import { runDeterministicFit2D } from "./fitRunner";
import { runMeasuredSimulatedComparison2D } from "./modelComparison2d";
import { fieldOutputFromMeasuredPixels2D, l34bLinePairPixels, l34bLinePairRoi, l34bMeasuredImage, l34bMeasuredScene } from "../validation/fixturesL34b";

describe("L3.4B comparison report", () => {
  it("exports image hashes, ROI metadata, residual summary, fit params, warnings, provenance, and limitations", () => {
    const comparison = runMeasuredSimulatedComparison2D({
      id: "report-comparison",
      measuredImage: l34bMeasuredImage,
      measuredPixels: l34bLinePairPixels,
      rois: [l34bLinePairRoi],
      simulatedField: fieldOutputFromMeasuredPixels2D("report-field", l34bLinePairPixels)
    });
    const fit = runDeterministicFit2D({
      id: "report-fit",
      comparison,
      fitParameters: [
        { kind: "gaussianBlurSigmaPx", min: 0, max: 1, steps: 2 },
        { kind: "intensityScale", min: 1, max: 1.1, steps: 2 }
      ]
    });
    const report = createComparisonReport2D({ scene: l34bMeasuredScene, comparison, fit });
    const json = comparisonReportToJson(report);
    const markdown = comparisonReportToMarkdown(report);
    const html = comparisonReportToHtml(report);
    expect(json).toContain(l34bMeasuredImage.imageHash);
    expect(markdown).toContain("ROI Definitions");
    expect(markdown).toContain("Residual Summary");
    expect(markdown).toContain("Best parameters");
    expect(html).toContain("<html");
    expect(`${json}\n${markdown}\n${html}`).toContain("not certified ISO 12233, EMVA 1288, clinical, or hardware calibration");
    expect(`${json}\n${markdown}\n${html}`).not.toContain("certified ISO 12233 calibration");
    expect(`${json}\n${markdown}\n${html}`).not.toContain("certified EMVA 1288 calibration");
  });
});
