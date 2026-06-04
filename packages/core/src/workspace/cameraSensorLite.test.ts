import { describe, expect, it } from "vitest";
import { compareMeasuredToSimulatedProfile, type L67SimulatedProfile } from "./measuredWorkbench";
import {
  cameraHistogramCsv,
  cameraMetricsCsv,
  cameraProfileCsv,
  cameraReportBundleJson,
  cameraReportJson,
  cameraReportMarkdown,
  cameraRunToMeasuredDataset,
  defaultL68CameraSettings,
  l68CameraLimitations,
  opticalInputFromProfile,
  runCameraSensorLite,
  type L68CameraNoiseMode,
  type L68CameraRunResult,
  type L68CameraSettings
} from "./cameraSensorLite";
import type { StudyProfilePoint } from "./studyWorkspace";

describe("L6.8 Camera/Sensor-Lite model", () => {
  it("converts normalized intensity to photons, electrons, and DN in noiseless mode", () => {
    const run = runFixture({
      widthPx: 3,
      heightPx: 3,
      pixelPitchM: 1e-6,
      quantumEfficiency: 0.5,
      exposureS: 0.01,
      photonFluxScale: 100_000,
      fullWellElectrons: 30_000,
      readNoiseElectronsRms: 0,
      darkCurrentElectronsPerS: 0,
      bitDepth: 12,
      gainDnPerElectron: 0.1,
      blackLevelDn: 10,
      seed: 7,
      noiseMode: "noiseless"
    });
    const center = run.profile[1]!;

    expect(center.opticalIntensity).toBeCloseTo(1);
    expect(center.photons).toBeCloseTo(1_000);
    expect(center.electrons).toBeCloseTo(500);
    expect(center.digitalNumber).toBe(60);
    expect(metricValue(run, "peakPhotons")).toBeCloseTo(1_000);
    expect(metricValue(run, "peakSignalElectrons")).toBeCloseTo(500);
  });

  it("applies quantum efficiency and exposure scaling", () => {
    const base = runFixture({ quantumEfficiency: 0.4, exposureS: 0.01, noiseMode: "noiseless" });
    const doubleQe = runFixture({ quantumEfficiency: 0.8, exposureS: 0.01, noiseMode: "noiseless" });
    const doubleExposure = runFixture({ quantumEfficiency: 0.4, exposureS: 0.02, noiseMode: "noiseless" });

    expect(metricValue(doubleQe, "peakSignalElectrons")).toBeCloseTo(metricValue(base, "peakSignalElectrons") * 2);
    expect(metricValue(doubleExposure, "peakSignalElectrons")).toBeCloseTo(metricValue(base, "peakSignalElectrons") * 2);
  });

  it("clips at full well and ADC bit depth and reports saturation fraction", () => {
    const run = runFixture(
      {
        widthPx: 5,
        heightPx: 5,
        pixelPitchM: 1e-6,
        quantumEfficiency: 1,
        exposureS: 1,
        photonFluxScale: 1e9,
        fullWellElectrons: 100,
        readNoiseElectronsRms: 0,
        darkCurrentElectronsPerS: 0,
        bitDepth: 8,
        gainDnPerElectron: 10,
        blackLevelDn: 0,
        seed: 11,
        noiseMode: "noiseless"
      },
      constantProfile(5, 1)
    );

    expect(Math.max(...run.maps.noisyElectrons)).toBe(100);
    expect(Math.max(...run.maps.digitalNumbers)).toBe(255);
    expect(metricValue(run, "saturationFraction")).toBeGreaterThan(0.75);
    expect(run.warnings.some((warning) => warning.code === "l68.camera.saturation")).toBe(true);
  });

  it("is deterministic for a fixed seed and changes when the seed changes", () => {
    const settings: Partial<L68CameraSettings> = {
      widthPx: 5,
      heightPx: 5,
      pixelPitchM: 1e-6,
      photonFluxScale: 250_000,
      exposureS: 0.02,
      quantumEfficiency: 0.7,
      readNoiseElectronsRms: 2,
      darkCurrentElectronsPerS: 3,
      noiseMode: "shot-read-dark",
      seed: 1234
    };
    const a = runFixture(settings, constantProfile(5, 1));
    const b = runFixture(settings, constantProfile(5, 1));
    const c = runFixture({ ...settings, seed: 1235 }, constantProfile(5, 1));

    expect(a.resultHash).toBe(b.resultHash);
    expect(a.maps.digitalNumbers).toEqual(b.maps.digitalNumbers);
    expect(c.resultHash).not.toBe(a.resultHash);
    expect(c.maps.digitalNumbers).not.toEqual(a.maps.digitalNumbers);
  });

  it("supports noiseless, shot-only, shot+read, and shot+read+dark modes", () => {
    const modes: L68CameraNoiseMode[] = ["noiseless", "shot-only", "shot-read", "shot-read-dark"];
    const runs = modes.map((noiseMode) => runFixture({ noiseMode, seed: 33 }, constantProfile(5, 1)));

    expect(runs.map((run) => run.settings.noiseMode)).toEqual(modes);
    expect(new Set(runs.map((run) => run.resultHash)).size).toBeGreaterThan(1);
    for (const run of runs) {
      expect(run.maps.digitalNumbers).toHaveLength(run.widthPx * run.heightPx);
      expect(metricValue(run, "meanSnr")).toBeGreaterThan(0);
    }
  });

  it("reports SNR, low signal, quantization, and boundary warnings without claiming sensor-stack compliance", () => {
    const run = runFixture({
      photonFluxScale: 10,
      exposureS: 0.001,
      quantumEfficiency: 0.1,
      readNoiseElectronsRms: 5,
      gainDnPerElectron: 0.01,
      noiseMode: "shot-read-dark"
    });
    const text = `${run.warnings.map((warning) => warning.message).join("\n")}\n${l68CameraLimitations().join("\n")}`;

    expect(metricValue(run, "meanSnr")).toBeLessThan(1);
    expect(run.warnings.some((warning) => warning.code === "l68.camera.lowSignal")).toBe(true);
    expect(run.warnings.some((warning) => warning.code === "l68.camera.quantization")).toBe(true);
    expect(text).toContain("does not model pixel-level electromagnetic absorption");
    expect(text).not.toMatch(/EMVA compliant|certified calibration system|pixel-level sensor stack is executable|3D Maxwell solve executed|FDTD solver executable/i);
  });

  it("exports report JSON, Markdown, metrics CSV, profile CSV, histogram CSV, and warnings", () => {
    const run = runFixture({ noiseMode: "shot-read-dark", seed: 44 }, constantProfile(5, 0.8));
    const bundle = cameraReportBundleJson(run);

    expect(bundle.schema).toBe("emmicro.cameraSensorLiteBundle.v1");
    expect(bundle.manifest.cameraRunHash).toBe(run.resultHash);
    expect(bundle.manifest.sourceResultHash).toBe(run.source.resultHash);
    expect(cameraReportJson(run)).toContain("cameraSensorLiteRun");
    expect(cameraReportMarkdown(run)).toContain("## Metrics");
    expect(cameraMetricsCsv(run)).toContain("meanPhotons");
    expect(cameraProfileCsv(run)).toContain("x_m,optical_intensity,photons,electrons,digital_number,snr,saturated");
    expect(cameraHistogramCsv(run)).toContain("min_dn,max_dn,count");
    expect(bundle.warningsJson.some((warning) => warning.code === "l68.camera.boundary")).toBe(true);
  });
});

describe("L6.8 Camera/Sensor-Lite workspace integration", () => {
  it("sends synthetic camera output to measured-vs-simulated comparison while preserving hashes", () => {
    const profile = triangularProfile();
    const optical = opticalInputFromProfile(profile, {
      id: "source-profile",
      label: "Source optical profile",
      resultHash: "source-hash",
      kind: "validation.thin-lens",
      heightPx: 5
    });
    const run = runCameraSensorLite({
      id: "camera-to-measured",
      label: "Camera to measured",
      optical,
      settings: {
        widthPx: 5,
        heightPx: 5,
        pixelPitchM: 1e-6,
        photonFluxScale: 1_000_000,
        exposureS: 0.01,
        quantumEfficiency: 0.6,
        readNoiseElectronsRms: 1,
        noiseMode: "noiseless"
      }
    });
    const measured = cameraRunToMeasuredDataset(run);
    const simulated: L67SimulatedProfile = {
      id: optical.id,
      label: optical.label,
      resultHash: optical.resultHash,
      sourceKind: optical.kind,
      profile
    };
    const comparison = compareMeasuredToSimulatedProfile({
      id: "l68-camera-comparison",
      label: "L6.8 synthetic camera vs optical comparison",
      measured,
      simulated
    });

    expect(measured.kind).toBe("image-centerline");
    expect(measured.imageHash).toBe(run.resultHash);
    expect(measured.metadata.notes).toContain("Synthetic Camera/Sensor-Lite");
    expect(measured.warnings.some((warning) => warning.code === "l68.syntheticMeasured.boundary")).toBe(true);
    expect(comparison.simulated.resultHash).toBe("source-hash");
    expect(comparison.measured.imageHash).toBe(run.resultHash);
    expect(comparison.residualProfile.length).toBeGreaterThan(0);
  });
});

function runFixture(settings: Partial<L68CameraSettings> = {}, profile: StudyProfilePoint[] = triangularProfile()): L68CameraRunResult {
  const normalized = defaultL68CameraSettings({
    id: "fixture-camera",
    label: "Fixture camera",
    widthPx: 3,
    heightPx: 3,
    pixelPitchM: 1e-6,
    quantumEfficiency: 0.5,
    exposureS: 0.01,
    photonFluxScale: 100_000,
    fullWellElectrons: 30_000,
    readNoiseElectronsRms: 0,
    darkCurrentElectronsPerS: 0,
    bitDepth: 12,
    gainDnPerElectron: 0.1,
    blackLevelDn: 0,
    seed: 1,
    noiseMode: "noiseless",
    ...settings
  });
  const optical = opticalInputFromProfile(profile, {
    id: "fixture-profile",
    label: "Fixture profile",
    resultHash: "fixture-source-hash",
    kind: "validation.fixture",
    heightPx: normalized.heightPx
  });
  return runCameraSensorLite({ id: "fixture-run", label: "Fixture run", optical, settings: normalized });
}

function triangularProfile(): StudyProfilePoint[] {
  return [
    { xM: -1e-6, intensity: 0.25 },
    { xM: 0, intensity: 1 },
    { xM: 1e-6, intensity: 0.5 }
  ];
}

function constantProfile(count: number, intensity: number): StudyProfilePoint[] {
  return Array.from({ length: count }, (_, index) => ({
    xM: (index - (count - 1) / 2) * 1e-6,
    intensity
  }));
}

function metricValue(run: L68CameraRunResult, id: string): number {
  return run.metrics.find((metric) => metric.id === id)?.value ?? Number.NaN;
}
