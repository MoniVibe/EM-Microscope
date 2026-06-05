import { describe, expect, it } from "vitest";
import {
  cameraCalibrationMetricsCsv,
  cameraCalibrationReportBundleJson,
  cameraCalibrationReportJson,
  cameraCalibrationReportMarkdown,
  cameraCalibrationResidualsCsv,
  cameraPhotonTransferCsv,
  l69ExampleCalibrationCsv,
  parseCameraCalibrationCsv,
  runCameraCalibration
} from "./cameraCalibration";

describe("L6.9 camera calibration import", () => {
  it("imports dark/flat exposure summary CSV and hashes it deterministically", () => {
    const a = parseCameraCalibrationCsv(fixtureCsv(), { sourceName: "fixture.csv", importedAtIso: "2026-06-05T00:00:00.000Z" });
    const b = parseCameraCalibrationCsv(fixtureCsv(), { sourceName: "fixture.csv", importedAtIso: "2026-06-05T00:00:00.000Z" });

    expect(a.schema).toBe("emmicro.cameraCalibrationDataset.v1");
    expect(a.sourceName).toBe("fixture.csv");
    expect(a.rows).toHaveLength(5);
    expect(a.skippedRowCount).toBe(0);
    expect(a.dataHash).toBe(b.dataHash);
    expect(a.sourceTextHash).toBe(b.sourceTextHash);
    expect(a.warnings.some((warning) => warning.code === "l69.calibration.boundary")).toBe(true);
  });

  it("rejects missing required columns clearly", () => {
    expect(() => parseCameraCalibrationCsv("frame_type,exposure_ms,mean_dn\ndark,1,64")).toThrow(/missing required column.*variance_dn2/i);
  });

  it("warns on too few dark/flat frames and invalid rows while preserving provenance", () => {
    const dataset = parseCameraCalibrationCsv(
      [
        "frame_type,exposure_ms,mean_dn,variance_dn2,notes",
        "dark,1,64,2.5,only dark",
        "flat,1,400,35,only flat",
        "flat,not-a-number,400,35,bad row"
      ].join("\n"),
      { sourceName: "sparse.csv" }
    );

    expect(dataset.rows).toHaveLength(2);
    expect(dataset.skippedRowCount).toBe(1);
    expect(dataset.warnings.some((warning) => warning.code === "l69.calibration.import.skippedRow")).toBe(true);
    expect(dataset.warnings.some((warning) => warning.code === "l69.calibration.import.tooFewDarkExposures")).toBe(true);
    expect(dataset.warnings.some((warning) => warning.code === "l69.calibration.import.tooFewFlatExposures")).toBe(true);
    expect(dataset.sourceName).toBe("sparse.csv");
  });
});

describe("L6.9 photon-transfer calibration", () => {
  it("estimates black level, dark current, conversion gain, read noise, SNR, and QE from known photons", () => {
    const dataset = parseCameraCalibrationCsv(fixtureCsv(), { bitDepth: 12 });
    const run = runCameraCalibration({
      dataset,
      baseSettings: {
        pixelPitchM: 4.8e-6,
        bitDepth: 12,
        gainDnPerElectron: 0.1
      }
    });

    expect(run.fittedProfile.blackLevelDn).toBeCloseTo(50, 6);
    expect(run.fittedProfile.gainDnPerElectron).toBeCloseTo(0.1, 5);
    expect(run.fittedProfile.conversionGainElectronsPerDn).toBeCloseTo(10, 4);
    expect(run.fittedProfile.readNoiseElectronsRms).toBeCloseTo(10, 4);
    expect(run.fittedProfile.darkCurrentElectronsPerS).toBeCloseTo(100, 3);
    expect(run.fittedProfile.effectiveQuantumEfficiency).toBeCloseTo(0.5, 4);
    expect(metric(run, "dynamicRange")).toBeGreaterThan(1000);
    expect(metric(run, "residualRmsDn")).toBeLessThan(0.5);
  });

  it("does not estimate QE without calibrated photon input", () => {
    const dataset = parseCameraCalibrationCsv(l69ExampleCalibrationCsv(false));
    const run = runCameraCalibration({ dataset });
    const text = `${run.assumptions.join("\n")}\n${run.warnings.map((warning) => warning.message).join("\n")}`;

    expect(run.fittedProfile.effectiveQuantumEfficiency).toBeNull();
    expect(metric(run, "effectiveQuantumEfficiency")).toBeNaN();
    expect(text).toContain("QE cannot be estimated without known photon flux / photons-per-pixel calibration.");
  });

  it("detects saturated data and estimates full well from ADC clipping", () => {
    const csv = [
      "frame_type,exposure_ms,mean_dn,variance_dn2",
      "dark,0,64,4",
      "dark,10,64.2,4.1",
      "flat,1,450,42",
      "flat,4,1600,156",
      "flat,20,4090,300"
    ].join("\n");
    const dataset = parseCameraCalibrationCsv(csv, { bitDepth: 12 });
    const run = runCameraCalibration({ dataset, baseSettings: { bitDepth: 12, gainDnPerElectron: 0.1 } });

    expect(run.photonTransfer.some((point) => point.saturated)).toBe(true);
    expect(run.fittedProfile.saturationDn).toBeGreaterThan(4000);
    expect(run.fittedProfile.fullWellElectrons).toBeGreaterThan(30000);
    expect(run.warnings.some((warning) => warning.code === "l69.calibration.import.saturation")).toBe(true);
  });
});

describe("L6.9 camera measured-vs-simulated calibration reports", () => {
  it("generates residuals and exports Markdown JSON and CSV reports without certification claims", () => {
    const dataset = parseCameraCalibrationCsv(fixtureCsv(), { sourceName: "fixture.csv", bitDepth: 12 });
    const run = runCameraCalibration({ dataset, baseSettings: { bitDepth: 12 } });
    const bundle = cameraCalibrationReportBundleJson(dataset, run);
    const reportText = [
      cameraCalibrationReportJson(run, dataset),
      cameraCalibrationReportMarkdown(run, dataset),
      cameraCalibrationMetricsCsv(run),
      cameraPhotonTransferCsv(run),
      cameraCalibrationResidualsCsv(run),
      JSON.stringify(bundle)
    ].join("\n");

    expect(run.residuals).toHaveLength(dataset.rows.length);
    expect(run.resultHash).toMatch(/^[0-9a-f]+$/);
    expect(bundle.schema).toBe("emmicro.cameraCalibrationBundle.v1");
    expect(bundle.manifest.calibrationDataHash).toBe(dataset.dataHash);
    expect(reportText).toContain("Residual RMS");
    expect(reportText).toContain("frame_type,exposure_ms");
    expect(reportText).toContain("not EMVA 1288 certification");
    expect(reportText).not.toMatch(/EMVA compliant|certified EMVA|lab-accredited calibration is complete|3D Maxwell solve executed|FDTD solver executable/i);
  });
});

function fixtureCsv(): string {
  return [
    "frame_type,exposure_ms,mean_dn,variance_dn2,photons_per_pixel,temperature_c,notes",
    "dark,0,50,1,,22,dark bias",
    "dark,10,50.1,1.01,,22,dark exposure",
    "flat,1,550.01,51.001,10000,22,flat exposure",
    "flat,2,1050.02,101.002,20000,22,flat exposure",
    "flat,4,2050.04,201.004,40000,22,flat exposure"
  ].join("\n");
}

function metric(run: ReturnType<typeof runCameraCalibration>, id: string): number {
  return run.metrics.find((item) => item.id === id)?.value ?? Number.NaN;
}
