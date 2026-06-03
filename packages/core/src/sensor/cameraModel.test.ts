import { describe, expect, it } from "vitest";
import type { FieldOutput2D } from "../solvers/Solver";
import { cameraWithDefaults } from "./cameraModel";
import { renderCameraImage2D } from "./pixelSampling2d";
import { computeSnrMetrics2D } from "./snrMetrics";

describe("L3.2 virtual camera model", () => {
  it("converts relative intensity into deterministic electrons and digital numbers", () => {
    const field = constantField(32, 32, 1);
    const camera = cameraWithDefaults({ widthPx: 32, heightPx: 32, exposureS: 0.01, quantumEfficiency: 0.5, peakPhotonRatePerS: 100000 });
    const image = renderCameraImage2D(field, camera, { includeNoise: false });

    expect(image.signalElectrons[0]).toBeCloseTo(500, 8);
    expect(image.noisyElectrons[0]).toBeCloseTo(500 + camera.darkCurrentElectronsPerS * camera.exposureS, 8);
    expect(image.digitalNumbers[0]).toBe(Math.round(camera.blackLevelDn + image.noisyElectrons[0]! * camera.gainDnPerElectron));
  });

  it("uses deterministic seeded noise", () => {
    const field = constantField(32, 32, 1);
    const camera = cameraWithDefaults({ widthPx: 32, heightPx: 32, seed: 44, peakPhotonRatePerS: 100000 });
    const a = renderCameraImage2D(field, camera, { includeNoise: true });
    const b = renderCameraImage2D(field, camera, { includeNoise: true });

    expect(Array.from(a.digitalNumbers.slice(0, 20))).toEqual(Array.from(b.digitalNumbers.slice(0, 20)));
  });

  it("adds shot-noise variance near the expected electron mean", () => {
    const field = constantField(64, 64, 1);
    const camera = cameraWithDefaults({
      widthPx: 64,
      heightPx: 64,
      exposureS: 0.01,
      quantumEfficiency: 1,
      peakPhotonRatePerS: 1000000,
      readNoiseElectronsRms: 0,
      darkCurrentElectronsPerS: 0,
      fullWellElectrons: 50000
    });
    const image = renderCameraImage2D(field, camera, { includeNoise: true });
    const expected = image.expectedElectrons[0] ?? 0;
    const variance = sampleVariance(Array.from(image.noisyElectrons, (value) => value - expected));

    expect(variance).toBeGreaterThan(expected * 0.6);
    expect(variance).toBeLessThan(expected * 1.4);
  });

  it("reports saturation and SNR branches", () => {
    const field = constantField(16, 16, 1);
    const camera = cameraWithDefaults({ widthPx: 16, heightPx: 16, peakPhotonRatePerS: 1e10, fullWellElectrons: 1000, gainDnPerElectron: 1 });
    const image = renderCameraImage2D(field, camera, { includeNoise: false });
    const snr = computeSnrMetrics2D(camera, image);

    expect(snr.saturationFraction).toBe(1);
    expect(snr.warnings.join(" ")).toContain("saturation");
  });
});

function constantField(width: number, height: number, intensity: number): FieldOutput2D {
  return {
    id: "constant",
    type: "fieldImage2D",
    planeId: "plane",
    gridId: "grid",
    xM: 0,
    width,
    height,
    uMinM: -width * 5e-6,
    uMaxM: width * 5e-6,
    vMinM: -height * 5e-6,
    vMaxM: height * 5e-6,
    intensity: new Float64Array(width * height).fill(intensity),
    normalization: "raw",
    units: { u: "m", v: "m", intensity: "relative" },
    provenance: {
      kind: "simulated",
      level: "L3",
      solverId: "scalar.coherent.l3.2d",
      model: "scalar-wave-2d-angular-spectrum",
      dimensionality: "2d",
      approximation: ["test field"]
    }
  };
}

function sampleVariance(values: number[]): number {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
}
