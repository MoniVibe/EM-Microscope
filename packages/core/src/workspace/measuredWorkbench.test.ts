import { describe, expect, it } from "vitest";
import {
  compareMeasuredToSimulatedProfile,
  createMeasuredProfileFromImagePixels,
  fitGridCsv,
  l67MeasuredLimitations,
  measuredComparisonBundleJson,
  measuredComparisonReportMarkdown,
  measuredMetricsCsv,
  parseMeasuredCsvProfile,
  residualProfileCsv,
  runL67DiagnosticFit,
  type L67SimulatedProfile
} from "./measuredWorkbench";

describe("L6.7 Measured-vs-Simulated Lab Data Workbench core", () => {
  it("imports CSV measured profiles with units, calibration, deterministic hash, ROI, and clear malformed-row warnings", () => {
    const csv = [
      "x_um,intensity",
      "-2,0.1",
      "-1,0.5",
      "0,1.0",
      "bad,row",
      "1,0.5",
      "2,0.1"
    ].join("\n");
    const measured = parseMeasuredCsvProfile(csv, {
      id: "profile-a",
      label: "Bench profile A",
      sourceName: "bench.csv",
      calibration: {
        normalizationMode: "peak",
        roi: { xMinM: -1e-6, xMaxM: 1e-6 }
      },
      notes: "synthetic profile"
    });
    const again = parseMeasuredCsvProfile(csv, {
      id: "profile-a",
      label: "Bench profile A",
      sourceName: "bench.csv",
      calibration: {
        normalizationMode: "peak",
        roi: { xMinM: -1e-6, xMaxM: 1e-6 }
      },
      notes: "synthetic profile"
    });

    expect(measured.kind).toBe("csv-profile");
    expect(measured.profile).toHaveLength(3);
    expect(measured.profile[0]?.xM).toBeCloseTo(-1e-6, 12);
    expect(measured.profile[1]?.intensity).toBeCloseTo(1);
    expect(measured.metadata.skippedRowCount).toBe(1);
    expect(measured.warnings[0]?.code).toBe("l67.csv.skippedRows");
    expect(again.measuredDataHash).toBe(measured.measuredDataHash);
  });

  it("imports measured image pixels as a calibrated grayscale centerline with image hash", () => {
    const measured = createMeasuredProfileFromImagePixels({
      id: "image-a",
      label: "Image centerline",
      sourceName: "bench.png",
      widthPx: 5,
      heightPx: 3,
      data: [
        0, 0, 0, 0, 0,
        0.1, 0.5, 1, 0.5, 0.1,
        0, 0, 0, 0, 0
      ],
      calibration: {
        pixelSizeM: 2e-6,
        normalizationMode: "peak"
      }
    });

    expect(measured.kind).toBe("image-centerline");
    expect(measured.dimensions).toEqual({ widthPx: 5, heightPx: 3 });
    expect(measured.imageHash).toMatch(/^[0-9a-f]+$/);
    expect(measured.profile[0]?.xM).toBeCloseTo(-4e-6, 12);
    expect(measured.profile[2]?.intensity).toBeCloseTo(1);
    expect(measured.warnings[0]?.message).toContain("grayscale centerline");
  });

  it("compares measured and simulated profiles with residual metrics and CSV exports", () => {
    const simulated = gaussianSimulatedProfile();
    const measured = parseMeasuredCsvProfile(profileCsvFrom(simulated, { shiftM: 0, scale: 1, background: 0 }), {
      id: "matched",
      label: "Matched",
      calibration: { normalizationMode: "none" }
    });
    const comparison = compareMeasuredToSimulatedProfile({ id: "matched-comparison", measured, simulated });

    expect(comparison.metrics.rmsResidual).toBeLessThan(1e-10);
    expect(comparison.metrics.maeResidual).toBeLessThan(1e-10);
    expect(comparison.metrics.maxAbsResidual).toBeLessThan(1e-10);
    expect(comparison.metrics.normalizedCrossCorrelation).toBeGreaterThan(0.999999);
    expect(comparison.metrics.peakPositionErrorM).toBeCloseTo(0, 12);
    expect(residualProfileCsv(comparison)).toContain("x_m,measured,simulated,residual");
    expect(measuredMetricsCsv(comparison)).toContain("rmsResidual");
  });

  it("fits bounded diagnostic shift, scale, and background for a known shifted synthetic measurement", () => {
    const simulated = gaussianSimulatedProfile();
    const measured = parseMeasuredCsvProfile(profileCsvFrom(simulated, { shiftM: 2e-4, scale: 0.85, background: 0.04 }), {
      id: "shifted",
      label: "Shifted",
      calibration: { normalizationMode: "none" }
    });
    const baseline = compareMeasuredToSimulatedProfile({ id: "baseline", measured, simulated });
    const fit = runL67DiagnosticFit({
      comparison: baseline,
      measured,
      simulated,
      settings: {
        shiftStartM: -4e-4,
        shiftStopM: 4e-4,
        shiftSteps: 9,
        scaleStart: 0.75,
        scaleStop: 0.95,
        scaleSteps: 5,
        backgroundStart: 0,
        backgroundStop: 0.08,
        backgroundSteps: 5
      }
    });

    expect(fit.best.shiftM).toBeCloseTo(2e-4, 12);
    expect(fit.best.intensityScale).toBeCloseTo(0.85, 12);
    expect(fit.best.backgroundOffset).toBeCloseTo(0.04, 12);
    expect(fit.improvement.rmsResidualDelta).toBeGreaterThan(0.1);
    expect(fit.best.rmsResidual).toBeLessThan(baseline.metrics.rmsResidual);
    expect(fitGridCsv(fit)).toContain("shift_m,intensity_scale,background_offset");
    expect(fit.warnings.some((warning) => warning.message.includes("Diagnostic fit"))).toBe(true);
  });

  it("exports report bundles with hashes, residuals, fit grids, warnings, and strict limitations", () => {
    const simulated = gaussianSimulatedProfile();
    const measured = parseMeasuredCsvProfile(profileCsvFrom(simulated, { shiftM: 0, scale: 1, background: 0 }), {
      id: "export-measured",
      label: "Export measured",
      calibration: { normalizationMode: "none" }
    });
    const comparison = compareMeasuredToSimulatedProfile({ id: "export-comparison", measured, simulated });
    const fit = runL67DiagnosticFit({
      comparison,
      measured,
      simulated,
      settings: { shiftSteps: 3, scaleSteps: 3, backgroundSteps: 3 }
    });
    const bundle = measuredComparisonBundleJson(comparison, fit);
    const markdown = measuredComparisonReportMarkdown(comparison, fit);

    expect(bundle.schema).toBe("emmicro.measuredComparisonBundle.v1");
    expect(bundle.manifest.measuredDataHash).toBe(measured.measuredDataHash);
    expect(bundle.manifest.fitResultHash).toBe(fit.resultHash);
    expect(bundle.residualProfileCsv).toContain("residual");
    expect(bundle.fitGridCsv).toContain("normalized_cross_correlation");
    expect(markdown).toContain("Diagnostic Fit");
    expect(markdown).toContain("No certified ISO/EMVA");
    expect(`${markdown}\n${l67MeasuredLimitations().join("\n")}`).not.toMatch(/certified calibration service|full 3D Maxwell solved|digital twin certified|manufacturing certified/i);
  });
});

function gaussianSimulatedProfile(): L67SimulatedProfile {
  const profile = Array.from({ length: 41 }, (_, index) => {
    const xM = (index - 20) * 1e-4;
    return {
      xM,
      intensity: Math.exp(-(xM * xM) / (2 * 4e-8))
    };
  });
  return {
    id: "gaussian-sim",
    label: "Gaussian simulated profile",
    resultHash: "simhash-gaussian",
    sourceKind: "validation.synthetic",
    profile
  };
}

function profileCsvFrom(simulated: L67SimulatedProfile, transform: { shiftM: number; scale: number; background: number }): string {
  const rows = ["x_m,intensity"];
  for (const point of simulated.profile) {
    const sourceX = point.xM - transform.shiftM;
    const source = Math.exp(-(sourceX * sourceX) / (2 * 4e-8));
    rows.push(`${point.xM},${source * transform.scale + transform.background}`);
  }
  return rows.join("\n");
}
