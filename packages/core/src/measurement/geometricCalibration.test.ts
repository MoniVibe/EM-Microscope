import { describe, expect, it } from "vitest";
import {
  compareGeometricCalibrations,
  distortionMapCsv,
  fitGeometricCalibration,
  generateGeometricCalibrationTarget,
  geometricCalibrationReportJson,
  geometricCalibrationReportMarkdown,
  geometricComparisonCsv,
  geometricPointsCsv,
  geometricResidualsCsv,
  parseGeometricPointCsv,
  pointSetFromTarget
} from "./geometricCalibration";

describe("L7.2 geometric calibration core", () => {
  it("generates deterministic dot-grid targets with point and world-coordinate exports", () => {
    const a = generateGeometricCalibrationTarget({ kind: "dot-grid", rows: 6, columns: 8, spacingUm: 40, pixelPitchUm: 4, rotationDeg: 3 });
    const b = generateGeometricCalibrationTarget({ kind: "dot-grid", rows: 6, columns: 8, spacingUm: 40, pixelPitchUm: 4, rotationDeg: 3 });

    expect(a.schema).toBe("emmicro.l72.geometricTarget.v1");
    expect(a.points).toHaveLength(48);
    expect(a.resultHash).toBe(b.resultHash);
    expect(a.image.imageHash).toBe(b.image.imageHash);
    expect(geometricPointsCsv(a)).toContain("x_world_um");
  });

  it("generates checkerboard metadata and line-grid pixels deterministically", () => {
    const checkerboard = generateGeometricCalibrationTarget({ kind: "checkerboard", rows: 5, columns: 7 });
    const lineGrid = generateGeometricCalibrationTarget({ kind: "line-grid", rows: 4, columns: 6 });

    expect(checkerboard.kind).toBe("checkerboard");
    expect(checkerboard.points[0]?.idealXPx).toBeTypeOf("number");
    expect(lineGrid.image.pixels.some((value) => value < 0.2)).toBe(true);
  });

  it("fits a similarity transform and recovers pixel scale and rotation from a synthetic grid", () => {
    const target = generateGeometricCalibrationTarget({
      kind: "dot-grid",
      rows: 7,
      columns: 9,
      spacingUm: 50,
      pixelPitchUm: 5,
      rotationDeg: 5,
      radialK1: 0
    });
    const fit = fitGeometricCalibration({ points: target, model: "similarity" });

    expect(fit.schema).toBe("emmicro.l72.geometricFit.v1");
    expect(fit.metrics.meanPixelScaleUmPerPx).toBeCloseTo(5, 4);
    expect(fit.metrics.rotationDeg).toBeCloseTo(5, 3);
    expect(fit.metrics.rmsResidualPx).toBeLessThan(1e-8);
    expect(fit.metrics.maxResidualPx).toBeLessThan(1e-8);
    expect(fit.residuals).toHaveLength(target.points.length);
    expect(fit.resultHash).toMatch(/^[0-9a-f]+$/);
  });

  it("fits affine scale and shear on synthetic points", () => {
    const base = generateGeometricCalibrationTarget({ rows: 5, columns: 6, spacingUm: 25, pixelPitchUm: 5, rotationDeg: 0 });
    const points = base.points.map((point) => ({
      ...point,
      xPx: point.xPx + 0.04 * (point.yWorldUm ?? 0),
      yPx: point.yPx + 0.01 * (point.xWorldUm ?? 0)
    }));
    const fit = fitGeometricCalibration({ points, model: "affine" });

    expect(fit.metrics.pixelScaleXUmPerPx).toBeGreaterThan(0);
    expect(fit.metrics.pixelScaleYUmPerPx).toBeGreaterThan(0);
    expect(Math.abs(fit.metrics.shear ?? 0)).toBeGreaterThan(0.01);
    expect(fit.metrics.rmsResidualPx).toBeLessThan(1e-8);
  });

  it("recovers synthetic radial k1 approximately and emits residual/correction maps", () => {
    const target = generateGeometricCalibrationTarget({
      rows: 7,
      columns: 9,
      spacingUm: 50,
      pixelPitchUm: 5,
      rotationDeg: 2,
      radialK1: 0.08
    });
    const radial = fitGeometricCalibration({ points: target, model: "radial-k1" });
    const similarity = fitGeometricCalibration({ points: target, model: "similarity" });

    expect(radial.radial.k1).toBeCloseTo(0.08, 2);
    expect(radial.correctedPoints).toHaveLength(target.points.length);
    expect(radial.metrics.rmsResidualPx).toBeLessThan(similarity.metrics.rmsResidualPx);
    expect(distortionMapCsv(radial)).toContain("radius_norm");
  });

  it("imports point CSV, rejects missing columns, warns on too few points, and exports reports", () => {
    const csv = [
      "id,x_px,y_px,row,col,x_world_um,y_world_um",
      "a,10,20,0,0,0,0",
      "b,20,20,0,1,50,0",
      "c,10,30,1,0,0,50",
      "d,20,30,1,1,50,50"
    ].join("\n");
    const pointSet = parseGeometricPointCsv(csv);
    const few = parseGeometricPointCsv(["id,x_px,y_px", "a,1,2", "b,3,4"].join("\n"));
    const fit = fitGeometricCalibration({ points: pointSet, model: "similarity" });
    const markdown = geometricCalibrationReportMarkdown(fit);

    expect(pointSet.points).toHaveLength(4);
    expect(few.warnings.some((warning) => warning.code === "l72.points.tooFew")).toBe(true);
    expect(() => parseGeometricPointCsv("id,x_px\np,1")).toThrow(/missing required column: y_px/);
    expect(geometricResidualsCsv(fit)).toContain("residual_px");
    expect(geometricCalibrationReportJson(fit)).toContain("emmicro.l72.geometricFit.v1");
    expect(markdown).toContain("not certified camera calibration");
    expect(markdown).toContain("not full camera resectioning");
    expect(markdown).not.toMatch(/certified camera calibration implemented|lab-accredited metrology implemented|full 3D pose calibration implemented/i);
  });

  it("compares measured and simulated geometry diagnostics by metrics and matched point residuals", () => {
    const measuredTarget = generateGeometricCalibrationTarget({ rows: 6, columns: 7, radialK1: 0.04, rotationDeg: 2 });
    const simulatedTarget = generateGeometricCalibrationTarget({ rows: 6, columns: 7, radialK1: 0.02, rotationDeg: 1.5 });
    const measured = fitGeometricCalibration({ points: pointSetFromTarget(measuredTarget), model: "radial-k1" });
    const simulated = fitGeometricCalibration({ points: pointSetFromTarget(simulatedTarget), model: "radial-k1" });
    const comparison = compareGeometricCalibrations({ measured, simulated });

    expect(comparison.schema).toBe("emmicro.l72.geometryComparison.v1");
    expect(comparison.matchedPointCount).toBe(measuredTarget.points.length);
    expect(comparison.metricDeltas.some((metric) => metric.id === "radialK1" && metric.delta !== null)).toBe(true);
    expect(geometricComparisonCsv(comparison)).toContain("metric,radialK1");
  });
});
