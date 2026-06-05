import { describe, expect, it } from "vitest";
import { fitGeometricCalibration, generateGeometricCalibrationTarget } from "./geometricCalibration";
import {
  applyDetectionManualEdits,
  attachGeometryFitMetricsToDetection,
  defaultL73Roi,
  detectMeasuredTargetPoints,
  detectedPointsCsv,
  detectionReportJson,
  detectionReportMarkdown,
  normalizeTargetImage,
  pointSetFromDetection,
  rejectedPointsCsv,
  targetImageFromGeometricTarget
} from "./targetDetection";

describe("L7.3 measured target dot-grid detection", () => {
  it("detects all dots in a clean synthetic dot-grid and maps row/column/world coordinates", () => {
    const target = generateGeometricCalibrationTarget({ kind: "dot-grid", rows: 7, columns: 9, spacingUm: 50, pixelPitchUm: 5, rotationDeg: 2, radialK1: 0 });
    const image = targetImageFromGeometricTarget(target);
    const detection = detectMeasuredTargetPoints({
      image,
      roi: defaultL73Roi(image, 0.03),
      settings: { expectedRows: 7, expectedColumns: 9, spacingUm: 50 }
    });

    expect(detection.schema).toBe("emmicro.l73.targetDetection.v1");
    expect(detection.acceptedPointCount).toBe(63);
    expect(detection.rejectedPointCount).toBe(0);
    expect(detection.coverageScore).toBe(1);
    expect(detection.gridMatchRmsPx ?? 0).toBeLessThan(0.75);
    expect(detection.points[0]).toMatchObject({ row: 0, col: 0, xWorldUm: -200, yWorldUm: -150 });
    expect(detection.resultHash).toMatch(/^[0-9a-f]+$/);
    expect(detectMeasuredTargetPoints({ image, roi: defaultL73Roi(image, 0.03), settings: { expectedRows: 7, expectedColumns: 9, spacingUm: 50 } }).resultHash).toBe(detection.resultHash);
  });

  it("supports dark-on-light and light-on-dark polarity", () => {
    const target = generateGeometricCalibrationTarget({ rows: 5, columns: 6, dotRadiusPx: 3, contrast: 0.9 });
    const image = targetImageFromGeometricTarget(target);
    const inverted = normalizeTargetImage({
      widthPx: image.widthPx,
      heightPx: image.heightPx,
      pixels: image.pixels.map((value) => 1 - value),
      sourceName: "inverted-dot-grid"
    });

    const dark = detectMeasuredTargetPoints({ image, settings: { expectedRows: 5, expectedColumns: 6, polarity: "dark-on-light" } });
    const light = detectMeasuredTargetPoints({ image: inverted, settings: { expectedRows: 5, expectedColumns: 6, polarity: "light-on-dark" } });

    expect(dark.acceptedPointCount).toBe(30);
    expect(light.acceptedPointCount).toBe(30);
  });

  it("rejects blobs outside area limits and warns when expected points are missing", () => {
    const target = generateGeometricCalibrationTarget({ rows: 5, columns: 5, dotRadiusPx: 3 });
    const image = targetImageFromGeometricTarget(target);
    const detection = detectMeasuredTargetPoints({
      image,
      settings: { expectedRows: 5, expectedColumns: 5, minBlobAreaPx: 80, maxMissingPoints: 1 }
    });

    expect(detection.acceptedPointCount).toBe(0);
    expect(detection.warnings.some((warning) => warning.code === "l73.detect.noBlobs" || warning.code === "l73.detect.coverageWarning")).toBe(true);
  });

  it("crops detection to the selected ROI and updates coverage when ROI changes", () => {
    const target = generateGeometricCalibrationTarget({ rows: 6, columns: 6, spacingUm: 40, pixelPitchUm: 4 });
    const image = targetImageFromGeometricTarget(target);
    const full = detectMeasuredTargetPoints({ image, settings: { expectedRows: 6, expectedColumns: 6, spacingUm: 40 } });
    const cropped = detectMeasuredTargetPoints({
      image,
      roi: { xPx: 0, yPx: 0, widthPx: Math.round(image.widthPx * 0.55), heightPx: image.heightPx },
      settings: { expectedRows: 6, expectedColumns: 6, spacingUm: 40, maxMissingPoints: 1 }
    });

    expect(full.acceptedPointCount).toBe(36);
    expect(cropped.acceptedPointCount).toBeLessThan(36);
    expect(cropped.warnings.some((warning) => warning.code === "l73.detect.coverageWarning")).toBe(true);
  });

  it("accepts, rejects, moves, adds, deletes, and relabels manual points", () => {
    const target = generateGeometricCalibrationTarget({ rows: 4, columns: 4 });
    const detection = detectMeasuredTargetPoints({ image: targetImageFromGeometricTarget(target), settings: { expectedRows: 4, expectedColumns: 4 } });
    const first = detection.points[0]!;
    const edited = applyDetectionManualEdits(detection, [
      { type: "move", id: first.id, xPx: first.xPx + 1.5, yPx: first.yPx + 0.5 },
      { type: "reject", id: first.id, reason: "test outlier" },
      { type: "accept", id: first.id },
      { type: "relabel", id: first.id, row: 0, col: 1 },
      { type: "add", id: "manual-extra", row: 3, col: 3, xPx: first.xPx + 20, yPx: first.yPx + 20 },
      { type: "delete", id: "manual-extra" }
    ]);

    expect(edited.points.some((point) => point.id === first.id && point.source === "manual" && point.col === 1)).toBe(true);
    expect(edited.manualEdits).toHaveLength(6);
    expect(edited.resultHash).not.toBe(detection.resultHash);
  });

  it("feeds detected and manually corrected points into L7.2 geometry fits and reduces outlier residuals after correction", () => {
    const target = generateGeometricCalibrationTarget({ rows: 6, columns: 7, spacingUm: 40, pixelPitchUm: 4, rotationDeg: 3 });
    const detection = detectMeasuredTargetPoints({ image: targetImageFromGeometricTarget(target), settings: { expectedRows: 6, expectedColumns: 7, spacingUm: 40 } });
    const first = detection.points[0]!;
    const outlier = applyDetectionManualEdits(detection, [{ type: "move", id: first.id, xPx: first.xPx + 20, yPx: first.yPx - 10 }]);
    const corrected = applyDetectionManualEdits(outlier, [{ type: "move", id: first.id, xPx: first.xPx, yPx: first.yPx }]);
    const outlierFit = fitGeometricCalibration({ points: pointSetFromDetection(outlier), model: "similarity" });
    const correctedFit = fitGeometricCalibration({ points: pointSetFromDetection(corrected), model: "similarity" });
    const withFitMetrics = attachGeometryFitMetricsToDetection(corrected, correctedFit);

    expect(detection.acceptedPointCount).toBe(42);
    expect(correctedFit.metrics.rmsResidualPx).toBeLessThan(outlierFit.metrics.rmsResidualPx);
    expect(withFitMetrics.fitRmsPx).toBe(correctedFit.metrics.rmsResidualPx);
  });

  it("exports detected points, rejected points, and diagnostic reports with strict boundaries", () => {
    const target = generateGeometricCalibrationTarget({ rows: 4, columns: 5 });
    const detection = detectMeasuredTargetPoints({ image: targetImageFromGeometricTarget(target), settings: { expectedRows: 4, expectedColumns: 5 } });
    const rejected = applyDetectionManualEdits(detection, [{ type: "reject", id: detection.points[0]!.id, reason: "manual smoke rejection" }]);
    const markdown = detectionReportMarkdown(rejected);

    expect(detectedPointsCsv(rejected)).toContain("x_world_um");
    expect(rejectedPointsCsv(rejected)).toContain("manual smoke rejection");
    expect(detectionReportJson(rejected)).toContain("emmicro.l73.targetDetection.v1");
    expect(markdown).toContain("not certified camera calibration");
    expect(markdown).toContain("not full multi-view bundle adjustment");
    expect(markdown).toContain("AprilTag/ArUco fiducial support");
    expect(markdown).not.toMatch(/certified camera calibration implemented|full 3D pose calibration implemented|stereo calibration implemented|AprilTag detector implemented|ArUco detector implemented/i);
  });
});
