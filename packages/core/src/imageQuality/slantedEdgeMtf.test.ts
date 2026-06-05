import { describe, expect, it } from "vitest";
import {
  analyzeLinePairTarget,
  compareMtfRuns,
  generateLinePairTarget,
  generateSlantedEdgeTarget,
  linePairContrastCsv,
  mtfComparisonCsv,
  parseMtfCsvFrame,
  runSlantedEdgeMtf,
  slantedEdgeEsfCsv,
  slantedEdgeLsfCsv,
  slantedEdgeMtfCurveCsv,
  slantedEdgeMtfReportJson,
  slantedEdgeMtfReportMarkdown
} from "./slantedEdgeMtf";

describe("L7.0 slanted-edge and resolution target MTF workbench core", () => {
  it("generates a deterministic slanted edge and estimates ESF, LSF, MTF, MTF50, MTF10, and lp/mm metrics", () => {
    const target = generateSlantedEdgeTarget({
      widthPx: 160,
      heightPx: 120,
      edgeAngleDeg: 5,
      blurSigmaPx: 1.1,
      contrast: 0.9,
      pixelPitchUm: 3.45
    });
    const rerunTarget = generateSlantedEdgeTarget({
      widthPx: 160,
      heightPx: 120,
      edgeAngleDeg: 5,
      blurSigmaPx: 1.1,
      contrast: 0.9,
      pixelPitchUm: 3.45
    });
    const result = runSlantedEdgeMtf({
      image: target,
      oversampling: 4,
      window: "hann",
      smoothing: "moving-average"
    });

    expect(target.resultHash).toBe(rerunTarget.resultHash);
    expect(result.schema).toBe("emmicro.l70.slantedEdgeMtf.v1");
    expect(result.metrics.edgeAngleDeg).toBeCloseTo(5, 0);
    expect(result.metrics.edgeContrast).toBeGreaterThan(0.75);
    expect(result.esf.length).toBeGreaterThan(64);
    expect(result.lsf.length).toBe(result.esf.length - 1);
    expect(result.mtf[0]?.mtf).toBe(1);
    expect(result.metrics.mtf50CyclesPerPx).toBeGreaterThan(0);
    expect(result.metrics.mtf10CyclesPerPx).toBeGreaterThan(result.metrics.mtf50CyclesPerPx ?? 0);
    expect(result.metrics.nyquistCyclesPerPx).toBe(0.5);
    expect(result.metrics.nyquistLpPerMm).toBeCloseTo(144.928, 2);
    expect(result.metrics.mtf50LpPerMm).toBeCloseTo((result.metrics.mtf50CyclesPerPx ?? 0) / 0.00345, 4);
    expect(result.warnings.every((warning) => warning.code !== "l70.mtf.pixelPitchMissing")).toBe(true);
    expect(result.hashes.resultHash).toHaveLength(16);
  });

  it("shows that additional blur reduces MTF50 and supports measured-vs-simulated curve comparison exports", () => {
    const sharp = runSlantedEdgeMtf({
      id: "measured",
      label: "Measured sharper edge",
      image: generateSlantedEdgeTarget({ blurSigmaPx: 0.65, edgeAngleDeg: 6, pixelPitchUm: 2.2 }),
      oversampling: 4
    });
    const blurred = runSlantedEdgeMtf({
      id: "simulated",
      label: "Simulated blurrier edge",
      image: generateSlantedEdgeTarget({ blurSigmaPx: 2.1, edgeAngleDeg: 6, pixelPitchUm: 2.2 }),
      oversampling: 4
    });
    const comparison = compareMtfRuns(sharp, blurred);

    expect(sharp.metrics.mtf50CyclesPerPx).toBeGreaterThan(blurred.metrics.mtf50CyclesPerPx ?? 0);
    expect(comparison.schema).toBe("emmicro.l70.mtfComparison.v1");
    expect(comparison.metrics.rmsDelta).toBeGreaterThan(0);
    expect(comparison.points.length).toBe(sharp.mtf.length);
    expect(mtfComparisonCsv(comparison)).toContain("delta_mtf");
    expect(slantedEdgeMtfReportJson(sharp, comparison)).toContain("emmicro.l70.mtfComparison.v1");
    expect(slantedEdgeMtfReportMarkdown(sharp, comparison)).toContain("ISO 12233-inspired diagnostic workflow only");
    expect(slantedEdgeMtfCurveCsv(sharp)).toContain("frequency_cycles_per_px");
    expect(slantedEdgeEsfCsv(sharp)).toContain("distance_px");
    expect(slantedEdgeLsfCsv(sharp)).toContain("distance_px");
  });

  it("emits warnings for missing pixel pitch, low contrast, saturation, poor angle, and no certified claims", () => {
    const target = generateSlantedEdgeTarget({
      widthPx: 96,
      heightPx: 80,
      edgeAngleDeg: 0.2,
      contrast: 1,
      meanSignal: 0.5,
      blurSigmaPx: 0.4,
      pixelPitchUm: null
    });
    const result = runSlantedEdgeMtf({
      image: target,
      oversampling: 4,
      roi: { xPx: 0, yPx: 0, widthPx: 96, heightPx: 80 }
    });
    const lowContrast = runSlantedEdgeMtf({
      image: generateSlantedEdgeTarget({ contrast: 0.04, blurSigmaPx: 1.2, edgeAngleDeg: 5 }),
      oversampling: 4
    });
    const warningText = result.warnings.concat(lowContrast.warnings).map((warning) => warning.code).join("\n");
    const report = slantedEdgeMtfReportMarkdown(result);

    expect(warningText).toContain("l70.mtf.pixelPitchMissing");
    expect(warningText).toContain("l70.mtf.roi.lowContrast");
    expect(warningText).toContain("l70.mtf.roi.saturated");
    expect(warningText).toContain("l70.mtf.edge.angleOutsidePreferredRange");
    expect(result.metrics.mtf50LpPerMm).toBeNull();
    expect(report).toContain("not certified ISO 12233");
    expect(report).not.toMatch(/certified ISO 12233 result|Imatest-equivalent result|lab-accredited result/i);
  });

  it("generates and analyzes line-pair targets with blur-sensitive high-frequency contrast", () => {
    const crisp = generateLinePairTarget({
      widthPx: 180,
      heightPx: 140,
      blurSigmaPx: 0.2,
      pixelPitchUm: 3.45
    });
    const blurred = generateLinePairTarget({
      widthPx: 180,
      heightPx: 140,
      blurSigmaPx: 2.2,
      pixelPitchUm: 3.45
    });
    const crispAnalysis = analyzeLinePairTarget(crisp);
    const blurredAnalysis = analyzeLinePairTarget(blurred);
    const crispHigh = crispAnalysis.rows.at(-1)?.contrastMichelson ?? 0;
    const blurredHigh = blurredAnalysis.rows.at(-1)?.contrastMichelson ?? 0;

    expect(crisp.kind).toBe("line-pair");
    expect(crisp.resultHash).not.toBe(blurred.resultHash);
    expect(crispAnalysis.rows).toHaveLength(7);
    expect(crispHigh).toBeGreaterThan(blurredHigh);
    expect(crispAnalysis.rows[0]?.frequencyLpPerMm).toBeCloseTo(11.594, 2);
    expect(linePairContrastCsv(crispAnalysis)).toContain("contrast_michelson");
  });

  it("parses matrix and point CSV frames for imported MTF targets", () => {
    const matrix = parseMtfCsvFrame("0,0.5,1\n0,0.5,1");
    const points = parseMtfCsvFrame("x_px,y_px,dn\n0,0,0\n1,0,1\n0,1,0.25\n1,1,0.75");

    expect(matrix.widthPx).toBe(3);
    expect(matrix.heightPx).toBe(2);
    expect(matrix.pixels).toEqual([0, 0.5, 1, 0, 0.5, 1]);
    expect(points.widthPx).toBe(2);
    expect(points.heightPx).toBe(2);
    expect(points.pixels).toEqual([0, 1, 0.25, 0.75]);
  });
});
