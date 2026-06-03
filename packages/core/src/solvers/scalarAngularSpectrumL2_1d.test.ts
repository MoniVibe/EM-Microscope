import { describe, expect, it } from "vitest";
import { fieldProfileToCsv } from "../export/fieldProfileExport";
import { sampleL2Scene } from "../scene/sampleScene";
import { parseScene, type Scene } from "../scene/schema";
import { scalarAngularSpectrumL2_1dSolver } from "./scalarAngularSpectrumL2_1d";

function cloneScene(scene: Scene): Scene {
  return structuredClone(scene);
}

function closestIndex(values: Float64Array, target: number): number {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < values.length; index += 1) {
    const distance = Math.abs((values[index] ?? 0) - target);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }
  return bestIndex;
}

function maxValue(values: Float64Array): number {
  let max = 0;
  for (const value of values) max = Math.max(max, value);
  return max;
}

function angleDifference(a: number, b: number): number {
  return Math.atan2(Math.sin(a - b), Math.cos(a - b));
}

describe("scalar angular-spectrum L2 1D solver", () => {
  it("finds the first 1D slit minima near the Fraunhofer reference locations", () => {
    const result = scalarAngularSpectrumL2_1dSolver.run(sampleL2Scene);
    const field = result.fieldOutputs?.[0];
    if (!field) throw new Error("missing field output");

    const peak = maxValue(field.intensity);
    const expectedFirstMinimumM = (sampleL2Scene.environment.defaultWavelengthM * 1) / 100e-6;
    const positive = closestIndex(field.yM, expectedFirstMinimumM);
    const negative = closestIndex(field.yM, -expectedFirstMinimumM);

    expect(field.yM[positive]).toBeCloseTo(0.005, 3);
    expect(field.yM[negative]).toBeCloseTo(-0.005, 3);
    expect((field.intensity[positive] ?? 0) / peak).toBeLessThan(0.05);
    expect((field.intensity[negative] ?? 0) / peak).toBeLessThan(0.05);
  });

  it("conserves energy during free-space propagation without an aperture", () => {
    const scene = cloneScene(sampleL2Scene);
    scene.masks1D = [];
    scene.fieldPlanes1D[0] = {
      ...scene.fieldPlanes1D[0]!,
      fieldSource: {
        kind: "gaussian",
        amplitude: 1,
        waistM: 0.0015,
        phaseRad: 0,
        centerYM: 0
      }
    };

    const result = scalarAngularSpectrumL2_1dSolver.run(scene);

    expect(Math.abs(result.energyLedger?.relativeOutputDrift ?? 1)).toBeLessThan(1e-9);
  });

  it("drops energy when the rectangular aperture clips the field", () => {
    const result = scalarAngularSpectrumL2_1dSolver.run(sampleL2Scene);
    const energy = result.energyLedger;
    if (!energy) throw new Error("missing energy ledger");

    expect(energy.afterMaskEnergy).toBeLessThan(energy.inputEnergy);
    expect(energy.clippedEnergy).toBeGreaterThan(0);
    expect(Math.abs(energy.relativeOutputDrift)).toBeLessThan(1e-9);
  });

  it("keeps a plane wave intensity uniform and advances phase consistently", () => {
    const scene = cloneScene(sampleL2Scene);
    scene.masks1D = [];
    scene.fieldPlanes1D[1] = {
      ...scene.fieldPlanes1D[1]!,
      xM: 0.02
    };

    const result = scalarAngularSpectrumL2_1dSolver.run(scene);
    const field = result.fieldOutputs?.[0];
    if (!field) throw new Error("missing field output");

    const peak = maxValue(field.intensity);
    const centerIndex = closestIndex(field.yM, 0);
    const expectedPhase = (2 * Math.PI * scene.fieldPlanes1D[1]!.xM) / scene.environment.defaultWavelengthM;

    expect(peak).toBeCloseTo(1, 10);
    expect(field.intensity[centerIndex]).toBeCloseTo(1, 10);
    expect(Math.abs(angleDifference(field.phaseRad[centerIndex] ?? 0, expectedPhase))).toBeLessThan(1e-9);
  });

  it("produces a deterministic result hash", () => {
    const a = scalarAngularSpectrumL2_1dSolver.run(sampleL2Scene);
    const b = scalarAngularSpectrumL2_1dSolver.run(sampleL2Scene);

    expect(a.resultHash).toBe(b.resultHash);
  });

  it("reports sampling warning branches without inventing resampling", () => {
    const scene = cloneScene(sampleL2Scene);
    scene.fieldGrids1D[0] = {
      ...scene.fieldGrids1D[0]!,
      samples: 300,
      spacingM: (scene.fieldGrids1D[0]!.yMaxM - scene.fieldGrids1D[0]!.yMinM) / 300
    };

    const parsed = parseScene(scene);
    const warnings = scalarAngularSpectrumL2_1dSolver.validateScene(parsed);

    expect(warnings.some((warning) => warning.code === "fieldGrid.notPowerOfTwo")).toBe(true);
    expect(warnings.some((warning) => warning.code === "aperture.undersampled")).toBe(true);
  });

  it("exports profile CSV with units, hashes, and provenance", () => {
    const result = scalarAngularSpectrumL2_1dSolver.run(sampleL2Scene);
    const field = result.fieldOutputs?.[0];
    if (!field) throw new Error("missing field output");

    const csv = fieldProfileToCsv(result, field);
    const lines = csv.split("\n");

    expect(lines[0]).toBe("# solverId,scalar.angularSpectrum.l2.1d");
    expect(lines.some((line) => line.startsWith("# sceneHash,"))).toBe(true);
    expect(lines.some((line) => line === "# yUnit,m")).toBe(true);
    expect(lines.some((line) => line.includes("L2:scalar-wave-1d-angular-spectrum"))).toBe(true);
    expect(lines).toContain("yM,intensity,phaseRad,real,imag");
  });
});
