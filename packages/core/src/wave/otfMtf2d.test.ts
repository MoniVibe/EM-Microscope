import { describe, expect, it } from "vitest";
import { l32Camera, l32Measurement } from "../validation/fixturesL32";
import { l3PresetScenes } from "../validation/fixturesL3";
import { scalarCoherentL3_2dSolver } from "../solvers/scalarCoherentL3_2d";
import { computeSamplingMetrics2D } from "../sensor/samplingMetrics";
import { computeMtf2D, interpolateMtfAtFrequency } from "./otfMtf2d";
import { computePsfMetrics2D } from "./psfMetrics2d";

describe("L3.2 PSF/OTF/MTF metrics", () => {
  it("normalizes OTF DC to MTF[0] = 1 and reports finite radial metrics", () => {
    const field = l3Field();
    const mtf = computeMtf2D(field);

    expect(mtf.mtf[0]).toBeCloseTo(1, 8);
    expect(mtf.radial.every((bin) => Number.isFinite(bin.mtf))).toBe(true);
    expect(mtf.mtf50CyclesPerM).not.toBeNull();
    expect(mtf.mtf10CyclesPerM).not.toBeNull();
  });

  it("computes target contrast and Nyquist warnings", () => {
    const field = l3Field();
    const mtf = computeMtf2D(field);
    const contrast = interpolateMtfAtFrequency(mtf.radial, 40_000);
    const sampling = computeSamplingMetrics2D({
      pixelPitchM: 20e-6,
      measurement: { ...l32Measurement, targetFeaturePeriodM: 20e-6 },
      mtf
    });

    expect(contrast).toBeGreaterThanOrEqual(0);
    expect(contrast).toBeLessThanOrEqual(1);
    expect(sampling.warnings.join(" ")).toContain("Nyquist");
  });

  it("reports PSF edge and width metrics for the Airy fixture", () => {
    const psf = computePsfMetrics2D(l3Field());

    expect(Math.abs(psf.centroidUM)).toBeLessThan(1e-6);
    expect(psf.edgeEnergyFraction).toBeLessThan(0.05);
    expect(psf.fwhmUM).not.toBeNull();
    expect(l32Camera.pixelPitchM).toBeGreaterThan(0);
  });
});

function l3Field() {
  const result = scalarCoherentL3_2dSolver.run(l3PresetScenes.airyPupil);
  const field = result.fieldImageOutputs[0];
  if (!field) throw new Error("missing L3 field");
  return field;
}
