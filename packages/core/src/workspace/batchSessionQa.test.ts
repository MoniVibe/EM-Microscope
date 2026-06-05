import { describe, expect, it } from "vitest";
import {
  createL74SessionFrame,
  defaultL74Thresholds,
  exampleL74SessionManifestCsv,
  frameMetricsCsv,
  l74SyntheticFramesFromManifest,
  outliersCsv,
  parseL74SessionManifestCsv,
  runL74SessionQa,
  sessionMetricsCsv,
  sessionReportJson,
  sessionReportMarkdown
} from "./batchSessionQa";

describe("L7.4 Batch Measurement Session QA", () => {
  it("imports valid manifests with metadata and deterministic hashes", () => {
    const manifest = exampleL74SessionManifestCsv();
    const first = parseL74SessionManifestCsv(manifest);
    const second = parseL74SessionManifestCsv(manifest);

    expect(first.manifestHash).toBe(second.manifestHash);
    expect(first.rows).toHaveLength(7);
    expect(first.rows[0]).toMatchObject({
      frameId: "001",
      type: "dot_grid",
      pathOrName: "dot_001.png",
      sourceLabel: "dot_001.png",
      focusZUm: 0,
      exposureMs: 10,
      gain: 1,
      temperatureC: 22.1,
      notes: "center"
    });
    expect(first.rows[0]?.inputHash).toMatch(/^[0-9a-f]+$/);
  });

  it("rejects manifests missing frame_id/type/source fields", () => {
    expect(() => parseL74SessionManifestCsv("type,path_or_name\nslanted_edge,edge.png")).toThrow(/frame_id and type/);
    expect(() => parseL74SessionManifestCsv("frame_id,type\n001,slanted_edge")).toThrow(/path_or_name or source_label/);
    expect(() => parseL74SessionManifestCsv("frame_id,type,path_or_name\n001,unknown,frame.png")).toThrow(/unsupported type/);
  });

  it("computes aggregate repeatability metrics across geometry, MTF, and camera families", () => {
    const { rows, manifestHash } = parseL74SessionManifestCsv(exampleL74SessionManifestCsv());
    const result = runL74SessionQa({
      id: "aggregate-test",
      manifestHash,
      frames: l74SyntheticFramesFromManifest(rows),
      thresholds: { minMtf50CyclesPerPx: 0.12 }
    });
    const pixelScale = result.aggregates.find((aggregate) => aggregate.metricId === "mean_pixel_scale_um_per_px");
    const mtf50 = result.aggregates.find((aggregate) => aggregate.metricId === "mtf50_cycles_per_px");
    const blackLevel = result.aggregates.find((aggregate) => aggregate.metricId === "black_level_dn");

    expect(result.schema).toBe("emmicro.l74.batchSessionQa.v1");
    expect(result.appVersion).toContain("L7.4");
    expect(pixelScale?.family).toBe("geometry");
    expect(pixelScale?.mean).toBeGreaterThan(2.3);
    expect(pixelScale?.std).toBeGreaterThan(0);
    expect(pixelScale?.coefficientOfVariation).toBeGreaterThan(0);
    expect(mtf50?.family).toBe("mtf");
    expect(mtf50?.count).toBe(3);
    expect(blackLevel?.family).toBe("camera");
    expect(blackLevel?.max).toBeGreaterThan(blackLevel?.min ?? 0);
  });

  it("flags threshold, coverage, z-score, warning-count, and session-repeatability outliers", () => {
    const { rows, manifestHash } = parseL74SessionManifestCsv(exampleL74SessionManifestCsv());
    const warningHeavy = createL74SessionFrame({
      ...rows[0]!,
      frameId: "warn-heavy",
      metrics: [{ id: "mtf50_cycles_per_px", label: "MTF50", family: "mtf", value: 0.24, unit: "cycles/px" }],
      warnings: [
        { code: "a", message: "warning a" },
        { code: "b", message: "warning b" },
        { code: "c", message: "warning c" }
      ]
    });
    const frames = [
      ...l74SyntheticFramesFromManifest(rows),
      warningHeavy,
      createL74SessionFrame({
        ...rows[2]!,
        frameId: "z-mtf",
        metrics: [{ id: "mtf50_cycles_per_px", label: "MTF50", family: "mtf", value: 0.01, unit: "cycles/px" }]
      })
    ];
    const result = runL74SessionQa({
      manifestHash,
      frames,
      thresholds: {
        maxGeometricRmsResidualPx: 0.8,
        minDetectionCoverage: 0.95,
        minMtf50CyclesPerPx: 0.12,
        maxAllowedWarningCount: 1,
        maxPixelScaleRepeatabilityStdUmPerPx: 0.001,
        maxZScore: 1.3
      }
    });

    expect(result.status).toBe("fail");
    expect(result.outliers.some((outlier) => outlier.metricId === "rms_residual_px" && outlier.severity === "fail")).toBe(true);
    expect(result.outliers.some((outlier) => outlier.rule === "detection-coverage")).toBe(true);
    expect(result.outliers.some((outlier) => outlier.rule === "z-score")).toBe(true);
    expect(result.outliers.some((outlier) => outlier.rule === "warning-count")).toBe(true);
    expect(result.outliers.some((outlier) => outlier.rule === "session-repeatability")).toBe(true);
    expect(result.rejectedFrameCount).toBeGreaterThan(0);
    expect(result.acceptedFrameCount).toBeLessThan(result.frameCount);
  });

  it("computes metric trends vs frame index, focus, exposure, and temperature", () => {
    const rows = parseL74SessionManifestCsv([
      "frame_id,type,path_or_name,focus_z_um,exposure_ms,gain,temperature_c,notes",
      "001,slanted_edge,a.png,-50,5,1,20,a",
      "002,slanted_edge,b.png,0,10,1,21,b",
      "003,slanted_edge,c.png,50,15,1,22,c"
    ].join("\n")).rows;
    const frames = rows.map((row, index) =>
      createL74SessionFrame({
        ...row,
        metrics: [{ id: "mtf50_cycles_per_px", label: "MTF50", family: "mtf", value: 0.2 + index * 0.04, unit: "cycles/px" }]
      })
    );
    const result = runL74SessionQa({ frames });
    const trend = result.aggregates.find((aggregate) => aggregate.metricId === "mtf50_cycles_per_px");

    expect(trend?.driftSlopePerFrame).toBeGreaterThan(0);
    expect(trend?.driftSlopePerFocusUm).toBeGreaterThan(0);
    expect(trend?.driftSlopePerExposureMs).toBeGreaterThan(0);
    expect(trend?.driftSlopePerTemperatureC).toBeGreaterThan(0);
  });

  it("exports reports with thresholds, aggregates, outliers, hashes, warnings, limitations, and no certification overclaim", () => {
    const { rows, manifestHash } = parseL74SessionManifestCsv(exampleL74SessionManifestCsv());
    const result = runL74SessionQa({
      manifestHash,
      frames: l74SyntheticFramesFromManifest(rows),
      thresholds: defaultL74Thresholds({ maxGeometricRmsResidualPx: 0.8 })
    });
    const markdown = sessionReportMarkdown(result);
    const json = sessionReportJson(result);
    const frameCsv = frameMetricsCsv(result);
    const sessionCsv = sessionMetricsCsv(result);
    const outlierCsv = outliersCsv(result);

    expect(markdown).toContain("L7.4 Batch Measurement Session + Repeatability QA");
    expect(markdown).toContain("Thresholds");
    expect(markdown).toContain("Aggregate Metrics");
    expect(markdown).toContain("Outliers");
    expect(markdown).toContain("diagnostic repeatability and QA summaries only");
    expect(json).toContain(result.resultHash);
    expect(frameCsv).toContain("frame_id,type,status");
    expect(sessionCsv).toContain("coefficient_of_variation");
    expect(outlierCsv).toContain("frame_id,metric_id,severity");
    expect(`${markdown}\n${json}\n${frameCsv}\n${sessionCsv}`).not.toMatch(/certified calibration executable|ISO certification passed|Imatest-equivalent certified|EMVA 1288 certified|lab-accredited metrology complete|full 3D Maxwell solved|FDTD executable|digital twin certified|manufacturing certified/i);
  });
});
