import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import { runCoatingStack, type CoatingStackRunOptions } from "./coatingStack";
import type { MaxwellProblemValidation, MaxwellProblemPolarization, PlanarStackProblem } from "./maxwellProblem";
import type { PlanarStackSolveResult, PlanarStackSolveSample } from "./maxwellResult";
import { coatingStackFromPlanarStackProblem, compileCoatingStackToPlanarStackProblem } from "./planarSceneCompiler";
import {
  planarTmmBackendCapabilities,
  planarTmmSolverReceipt,
  type MaxwellSolverBackend,
  type MaxwellSolverCapabilities,
  type MaxwellSolverReceipt
} from "./solverBackend";

export class PlanarTmmBackend implements MaxwellSolverBackend<PlanarStackProblem, PlanarStackSolveResult, CoatingStackRunOptions> {
  readonly id = "planar-tmm" as const;
  readonly label = "PlanarTmmBackend";
  readonly method = "planar-tmm" as const;
  readonly solverVersion = "emmicro.planar-tmm-backend.l5.8";

  capabilities(): MaxwellSolverCapabilities {
    return {
      ...planarTmmBackendCapabilities,
      dimensions: [...planarTmmBackendCapabilities.dimensions],
      geometry: [...planarTmmBackendCapabilities.geometry],
      polarizations: [...planarTmmBackendCapabilities.polarizations]
    };
  }

  validateProblem(problem: PlanarStackProblem): MaxwellProblemValidation {
    const errors: string[] = [];
    const warnings: SolverWarning[] = [
      {
        code: "maxwell.backend.planarTmmOnly",
        message:
          "L5.8 PlanarTmmBackend accepts solver-neutral planar-stack problems only; this is not 3D Maxwell, FEM, FDTD, BEM, RCWA, curved optics, CAD, aperture diffraction, or digital-twin simulation."
      }
    ];

    if (problem.version !== "emmicro.maxwell.problem.v1") errors.push("unsupported Maxwell problem version");
    if (problem.kind !== "planar-stack") errors.push("PlanarTmmBackend only accepts planar-stack problems");
    if (problem.backendId !== "planar-tmm") errors.push("PlanarTmmBackend requires backendId 'planar-tmm'");
    if (!problem.id) errors.push("Maxwell problem id is required");
    if (!problem.stack?.incidentMaterialId) errors.push("planar stack incident material is required");
    if (!problem.stack?.substrateMaterialId) errors.push("planar stack substrate material is required");
    if (!problem.sweep?.wavelengthsNm?.length) errors.push("planar stack problem requires at least one wavelength");
    for (const wavelengthNm of problem.sweep?.wavelengthsNm ?? []) {
      if (!Number.isFinite(wavelengthNm) || wavelengthNm <= 0) errors.push("planar stack wavelengths must be positive finite nm values");
    }
    if (!Number.isFinite(problem.sweep?.angleDeg) || Math.abs(problem.sweep.angleDeg) >= 90) errors.push("planar stack angle must be finite and below grazing incidence");
    if (!["te", "tm", "unpolarized"].includes(problem.sweep?.polarization)) errors.push("planar stack polarization must be te, tm, or unpolarized");
    for (const layer of problem.stack?.layers ?? []) {
      if (!layer.id) errors.push("planar stack layer id is required");
      if (!layer.materialId) errors.push(`planar stack layer ${layer.id || "(missing id)"} material is required`);
      if (!Number.isFinite(layer.thicknessNm) || layer.thicknessNm <= 0) errors.push(`planar stack layer ${layer.id || "(missing id)"} thickness must be positive`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  solve(problem: PlanarStackProblem, options: CoatingStackRunOptions = {}): PlanarStackSolveResult {
    const validation = this.validateProblem(problem);
    if (!validation.valid) throw new Error(`PlanarTmmBackend problem validation failed: ${validation.errors.join("; ")}`);

    const samples: PlanarStackSolveSample[] = [];
    const warnings: SolverWarning[] = [...validation.warnings];

    for (const wavelengthNm of problem.sweep.wavelengthsNm) {
      samples.push(solveSample(problem, wavelengthNm, problem.sweep.polarization, options));
      warnings.push(...samples[samples.length - 1]!.coatingStackResults.flatMap((result) => result.warnings));
    }

    const runs = samples.flatMap((sample) => sample.coatingStackResults);
    const materialRefs = runs[0]?.materialCatalogRefs ?? [];
    const receipt = planarTmmSolverReceipt();
    const resultHash = fnv1a64(
      stableStringify({
        analysisId: "analysis.maxwell.l5.phase8.planarTmmBackendSolve",
        problem: problemForHash(problem),
        sampleHashes: samples.flatMap((sample) => sample.resultHashes),
        materialRefs,
        solver: solverReceiptForHash(receipt),
        warningCodes: uniqueWarnings(warnings).map((warning) => warning.code)
      })
    );

    return {
      problemId: problem.id,
      backendId: "planar-tmm",
      backendMethod: "planar-tmm",
      solverVersion: this.solverVersion,
      resultHash,
      metrics: summarizeSamples(samples),
      warnings: uniqueWarnings(warnings),
      receipts: {
        materials: materialRefs.map((reference) => ({ ...reference })),
        solver: receipt
      },
      samples,
      coatingStackResult: runs.length === 1 ? runs[0] : undefined
    };
  }
}
export const planarTmmBackend = new PlanarTmmBackend();

export function solvePlanarStackProblem(problem: PlanarStackProblem, options: CoatingStackRunOptions = {}): PlanarStackSolveResult {
  return planarTmmBackend.solve(problem, options);
}

export function solveCoatingStackWithPlanarTmmBackend(
  stack: Parameters<typeof compileCoatingStackToPlanarStackProblem>[0],
  options: CoatingStackRunOptions = {}
): PlanarStackSolveResult {
  return planarTmmBackend.solve(compileCoatingStackToPlanarStackProblem(stack, options), options);
}

function solveSample(
  problem: PlanarStackProblem,
  wavelengthNm: number,
  polarization: MaxwellProblemPolarization,
  options: CoatingStackRunOptions
): PlanarStackSolveSample {
  if (polarization === "unpolarized") {
    const te = runCoatingStack(coatingStackFromPlanarStackProblem(problem, wavelengthNm, "te"), options);
    const tm = runCoatingStack(coatingStackFromPlanarStackProblem(problem, wavelengthNm, "tm"), options);
    return {
      wavelengthNm,
      angleDeg: problem.sweep.angleDeg,
      polarization,
      reflectance: (te.tmm.reflectance + tm.tmm.reflectance) / 2,
      transmittance: (te.tmm.transmittance + tm.tmm.transmittance) / 2,
      absorbance: (te.tmm.absorbance + tm.tmm.absorbance) / 2,
      energyBalanceError: Math.max(te.tmm.energyBalanceError, tm.tmm.energyBalanceError),
      coatingStackResults: [te, tm],
      resultHashes: [te.resultHash, tm.resultHash]
    };
  }

  const run = runCoatingStack(coatingStackFromPlanarStackProblem(problem, wavelengthNm, polarization), options);
  return {
    wavelengthNm,
    angleDeg: problem.sweep.angleDeg,
    polarization,
    reflectance: run.tmm.reflectance,
    transmittance: run.tmm.transmittance,
    absorbance: run.tmm.absorbance,
    energyBalanceError: run.tmm.energyBalanceError,
    coatingStackResults: [run],
    resultHashes: [run.resultHash]
  };
}

function summarizeSamples(samples: PlanarStackSolveSample[]): PlanarStackSolveResult["metrics"] {
  return {
    reflectance: mean(samples.map((sample) => sample.reflectance)),
    transmittance: mean(samples.map((sample) => sample.transmittance)),
    absorbance: mean(samples.map((sample) => sample.absorbance)),
    energyBalanceError: Math.max(...samples.map((sample) => sample.energyBalanceError))
  };
}

function problemForHash(problem: PlanarStackProblem): unknown {
  return {
    id: problem.id,
    kind: problem.kind,
    backendId: problem.backendId,
    version: problem.version,
    materialCatalogHash: problem.materialCatalogHash,
    stack: {
      incidentMaterialId: problem.stack.incidentMaterialId,
      substrateMaterialId: problem.stack.substrateMaterialId,
      layers: problem.stack.layers.map((layer) => ({
        id: layer.id,
        materialId: layer.materialId,
        thicknessNm: roundNumber(layer.thicknessNm)
      }))
    },
    sweep: {
      wavelengthsNm: problem.sweep.wavelengthsNm.map(roundNumber),
      angleDeg: roundNumber(problem.sweep.angleDeg),
      polarization: problem.sweep.polarization
    }
  };
}

function solverReceiptForHash(receipt: MaxwellSolverReceipt): unknown {
  return {
    id: receipt.id,
    method: receipt.method,
    solverVersion: receipt.solverVersion,
    capabilities: receipt.capabilities
  };
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function roundNumber(value: number): number {
  return Number(value.toPrecision(12));
}

function uniqueWarnings(warnings: SolverWarning[]): SolverWarning[] {
  const seen = new Set<string>();
  const output: SolverWarning[] = [];
  for (const warning of warnings) {
    const key = `${warning.code}:${warning.elementId ?? ""}:${warning.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(warning);
  }
  return output;
}
