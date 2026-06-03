import { describe, expect, it } from "vitest";
import { fieldProfileToCsv } from "../export/fieldProfileExport";
import { l25PresetScenes } from "../validation/fixturesL25";
import { closestIndex, expectedSmallAnglePositionM, maxValue, normalizedAt } from "../wave/validationMetrics1D";
import { scalarAngularSpectrumL2_1dSolver } from "./scalarAngularSpectrumL2_1d";

describe("L2.5 sample/image plane scalar chain", () => {
  it("keeps single-slit sample minima near the Fraunhofer reference locations", () => {
    const result = scalarAngularSpectrumL2_1dSolver.run(l25PresetScenes.singleSlit);
    const field = result.fieldOutputs?.[0];
    if (!field) throw new Error("missing field output");

    const expectedM = expectedSmallAnglePositionM(500e-9, 1, 100e-6, 1);
    const positive = closestIndex(field.yM, expectedM);
    const negative = closestIndex(field.yM, -expectedM);

    expect(field.yM[positive]).toBeCloseTo(0.005, 3);
    expect(field.yM[negative]).toBeCloseTo(-0.005, 3);
    expect(normalizedAt(field.intensity, positive)).toBeLessThan(0.05);
    expect(normalizedAt(field.intensity, negative)).toBeLessThan(0.05);
  });

  it("places double-slit bright fringes near the expected spacing", () => {
    const result = scalarAngularSpectrumL2_1dSolver.run(l25PresetScenes.doubleSlit);
    const field = result.fieldOutputs?.[0];
    if (!field) throw new Error("missing field output");

    const expectedM = expectedSmallAnglePositionM(500e-9, 1, 250e-6, 1);
    const positive = closestIndex(field.yM, expectedM);
    const negative = closestIndex(field.yM, -expectedM);

    expect(field.yM[positive]).toBeCloseTo(0.002, 3);
    expect(field.yM[negative]).toBeCloseTo(-0.002, 3);
    expect(normalizedAt(field.intensity, positive)).toBeGreaterThan(0.35);
    expect(normalizedAt(field.intensity, negative)).toBeGreaterThan(0.35);
  });

  it("places amplitude grating first orders near the expected detector positions", () => {
    const result = scalarAngularSpectrumL2_1dSolver.run(l25PresetScenes.grating);
    const field = result.fieldOutputs?.[0];
    if (!field) throw new Error("missing field output");

    const expectedM = expectedSmallAnglePositionM(500e-9, 0.5, 200e-6, 1);
    const positive = closestIndex(field.yM, expectedM);
    const negative = closestIndex(field.yM, -expectedM);

    expect(field.yM[positive]).toBeCloseTo(0.00125, 3);
    expect(field.yM[negative]).toBeCloseTo(-0.00125, 3);
    expect(normalizedAt(field.intensity, positive)).toBeGreaterThan(0.1);
    expect(normalizedAt(field.intensity, negative)).toBeGreaterThan(0.1);
  });

  it("preserves phase-step energy through the sample interaction and output propagation", () => {
    const result = scalarAngularSpectrumL2_1dSolver.run(l25PresetScenes.phaseStep);
    const energy = result.energyLedger;
    if (!energy) throw new Error("missing energy ledger");

    const sampleStage = energy.stages?.find((stage) => stage.kind === "sample");
    expect(sampleStage?.outputEnergy).toBeCloseTo(sampleStage?.inputEnergy ?? 0, 10);
    expect(Math.abs(energy.relativeOutputDrift)).toBeLessThan(1e-9);
  });

  it("keeps bar-target output finite and modulated", () => {
    const result = scalarAngularSpectrumL2_1dSolver.run(l25PresetScenes.barTarget);
    const field = result.fieldOutputs?.[0];
    if (!field) throw new Error("missing field output");

    let min = Number.POSITIVE_INFINITY;
    for (const value of field.intensity) {
      expect(Number.isFinite(value)).toBe(true);
      min = Math.min(min, value);
    }
    expect(maxValue(field.intensity)).toBeGreaterThan(min);
    expect(result.energyLedger?.afterMaskEnergy).toBeLessThan(result.energyLedger?.inputEnergy ?? 0);
  });

  it("emits sample undersampling warnings for a deliberately bad fixture", () => {
    const warnings = scalarAngularSpectrumL2_1dSolver.validateScene(l25PresetScenes.badSampling);

    expect(warnings.some((warning) => warning.code === "sample.undersampled")).toBe(true);
  });

  it("keeps ordinary L2.5 presets above the sample undersampling threshold", () => {
    for (const scene of [l25PresetScenes.singleSlit, l25PresetScenes.doubleSlit, l25PresetScenes.grating, l25PresetScenes.phaseStep, l25PresetScenes.barTarget]) {
      const warnings = scalarAngularSpectrumL2_1dSolver.validateScene(scene);
      expect(warnings.some((warning) => warning.code === "sample.undersampled")).toBe(false);
    }
  });

  it("exports L2.5 profiles with units, hashes, and sample provenance", () => {
    const result = scalarAngularSpectrumL2_1dSolver.run(l25PresetScenes.doubleSlit);
    const field = result.fieldOutputs?.[0];
    if (!field) throw new Error("missing field output");

    const csv = fieldProfileToCsv(result, field);

    expect(csv).toContain("# solverId,scalar.angularSpectrum.l2.1d");
    expect(csv).toContain("# yUnit,m");
    expect(csv).toContain("# provenance,L2:scalar-wave-1d-angular-spectrum");
    expect(csv).toContain("yM,intensity,phaseRad,real,imag");
  });
});
