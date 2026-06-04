import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import { runCoatingStack, type CoatingStackDefinition, type CoatingStackRunOptions, type CoatingStackRunResult } from "./coatingStack";

export type CoatingDesignMetric = "reflectance" | "transmittance" | "absorbance";
export type CoatingDesignDirection = "minimize" | "maximize";
export type CoatingDesignAggregation = "mean" | "max" | "min";

export type CoatingDesignObjectiveTerm = {
  metric: CoatingDesignMetric;
  direction: CoatingDesignDirection;
  weight?: number;
  aggregation?: CoatingDesignAggregation;
  target?: number;
};

export type CoatingDesignObjective = {
  id: string;
  label: string;
  type: "planarCoatingStack";
  wavelengthsM: number[];
  terms: CoatingDesignObjectiveTerm[];
  constraints?: {
    maxLayerCount?: number;
    allowedMaterialIds?: string[];
    minThicknessM?: number;
    maxThicknessM?: number;
    maxTotalThicknessM?: number;
  };
};

export type CoatingDesignVariable = {
  layerId: string;
  minThicknessM: number;
  maxThicknessM: number;
};

export type CoatingDesignSettings = {
  passes?: number;
  samplesPerVariable?: number;
  candidateCount?: number;
};

export type CoatingDesignProblem = {
  id: string;
  label: string;
  seedStack: CoatingStackDefinition;
  objective: CoatingDesignObjective;
  variables?: CoatingDesignVariable[];
  settings?: CoatingDesignSettings;
  materialCatalog?: CoatingStackRunOptions["materialCatalog"];
  materialResolution?: CoatingStackRunOptions["materialResolution"];
};

export type CoatingDesignMetrics = {
  sampleCount: number;
  meanReflectance: number;
  maxReflectance: number;
  minReflectance: number;
  meanTransmittance: number;
  maxTransmittance: number;
  minTransmittance: number;
  meanAbsorbance: number;
  maxAbsorbance: number;
  minAbsorbance: number;
  maxEnergyBalanceError: number;
};

export type CoatingDesignCandidate = {
  rank: number;
  score: number;
  improvementFromSeed: number;
  stack: CoatingStackDefinition;
  metrics: CoatingDesignMetrics;
  certifiedRun: CoatingStackRunResult;
  resultHash: string;
};

export type CoatingDesignResult = {
  id: string;
  type: "maxwellDesignFoundryPlanarCoating";
  analysisId: "analysis.maxwell.l5.phase1.designFoundry.planarCoating";
  label: string;
  objective: CoatingDesignObjective;
  seed: CoatingDesignCandidate;
  best: CoatingDesignCandidate;
  candidates: CoatingDesignCandidate[];
  evaluationCount: number;
  variableCount: number;
  warnings: SolverWarning[];
  resultHash: string;
  provenance: {
    label: "L5.1 Maxwell Design Foundry planar coating objective and thickness optimizer";
    limitations: string[];
  };
};

export type CoatingDesignEvaluation = {
  score: number;
  stack: CoatingStackDefinition;
  metrics: CoatingDesignMetrics;
  warnings: SolverWarning[];
};

export const visibleArObjective: CoatingDesignObjective = {
  id: "objective.visible-ar-low-reflection",
  label: "Visible AR low-reflection coating",
  type: "planarCoatingStack",
  wavelengthsM: [420e-9, 470e-9, 520e-9, 570e-9, 620e-9, 670e-9, 700e-9],
  terms: [
    { metric: "reflectance", direction: "minimize", aggregation: "mean", weight: 1 },
    { metric: "reflectance", direction: "minimize", aggregation: "max", weight: 0.8 },
    { metric: "absorbance", direction: "minimize", aggregation: "max", weight: 0.25 }
  ],
  constraints: {
    maxLayerCount: 8,
    minThicknessM: 5e-9,
    maxThicknessM: 240e-9,
    maxTotalThicknessM: 900e-9
  }
};

export function runCoatingDesignFoundry(problem: CoatingDesignProblem): CoatingDesignResult {
  validateProblem(problem);
  const runOptions: CoatingStackRunOptions = {
    materialCatalog: problem.materialCatalog,
    materialResolution: problem.materialResolution
  };

  const settings = {
    passes: clampInteger(problem.settings?.passes ?? 3, 1, 8),
    samplesPerVariable: clampInteger(problem.settings?.samplesPerVariable ?? 9, 3, 31),
    candidateCount: clampInteger(problem.settings?.candidateCount ?? 4, 1, 12)
  };
  const variables = normalizedVariables(problem.seedStack, problem.objective, problem.variables);
  const warnings: SolverWarning[] = [
    {
      code: "maxwell.designFoundry.planarProposalOnly",
      message:
        "L5.1 Design Foundry optimizes planar coating thickness proposals and certifies the selected result through the existing Maxwell TMM path; this is not adjoint, topology, 3D FEM/BEM/RCWA/FDTD, digital twin, sensor-complete, or manufacturing-certified design."
    }
  ];
  if (variables.length === 0) {
    warnings.push({
      code: "maxwell.designFoundry.noVariables",
      message: "Design Foundry received no coating thickness variables; only the seed stack was certified."
    });
  }

  const evaluationCache = new Map<string, CoatingDesignEvaluation>();
  const allEvaluations = new Map<string, CoatingDesignEvaluation>();
  const evaluate = (stack: CoatingStackDefinition): CoatingDesignEvaluation => {
    const key = stackKey(stack);
    const cached = evaluationCache.get(key);
    if (cached) return cached;
    const evaluated = evaluateCoatingDesignStack(stack, problem.objective, runOptions);
    evaluationCache.set(key, evaluated);
    allEvaluations.set(key, evaluated);
    return evaluated;
  };

  const seedStack = clampStackToVariables(cloneStack(problem.seedStack), variables);
  const seedEvaluation = evaluate(seedStack);
  let bestEvaluation = seedEvaluation;

  for (let pass = 0; pass < settings.passes; pass += 1) {
    for (const variable of variables) {
      const currentThicknessM = layerThickness(bestEvaluation.stack, variable.layerId);
      const fullSpanM = variable.maxThicknessM - variable.minThicknessM;
      const passSpanM = pass === 0 ? fullSpanM : fullSpanM / 2 ** pass;
      const lowM = pass === 0 ? variable.minThicknessM : Math.max(variable.minThicknessM, currentThicknessM - passSpanM / 2);
      const highM = pass === 0 ? variable.maxThicknessM : Math.min(variable.maxThicknessM, currentThicknessM + passSpanM / 2);

      for (let sampleIndex = 0; sampleIndex < settings.samplesPerVariable; sampleIndex += 1) {
        const thicknessM =
          settings.samplesPerVariable === 1 ? currentThicknessM : lowM + ((highM - lowM) * sampleIndex) / (settings.samplesPerVariable - 1);
        const candidateStack = setLayerThickness(bestEvaluation.stack, variable.layerId, thicknessM);
        const candidateEvaluation = evaluate(candidateStack);
        if (candidateEvaluation.score < bestEvaluation.score - 1e-15) {
          bestEvaluation = candidateEvaluation;
        }
      }
    }
  }

  const rankedEvaluations = [...allEvaluations.values()]
    .sort((a, b) => a.score - b.score)
    .slice(0, settings.candidateCount)
    .map((evaluation, index) => makeCandidate(evaluation, index + 1, seedEvaluation.score, runOptions));
  const seed = makeCandidate(seedEvaluation, 0, seedEvaluation.score, runOptions);
  const best = rankedEvaluations[0] ?? seed;
  warnings.push(...seedEvaluation.warnings, ...bestEvaluation.warnings, ...best.certifiedRun.warnings);

  const resultHash = fnv1a64(
    stableStringify({
      analysisId: "analysis.maxwell.l5.phase1.designFoundry.planarCoating",
      problem: {
        id: problem.id,
        objective: normalizedObjectiveForHash(problem.objective),
        variables,
        settings,
        seedStack: stackForHash(seed.stack),
        materialCatalogHash: problem.materialCatalog?.resultHash
      },
      seedHash: seed.resultHash,
      bestHash: best.resultHash,
      evaluationCount: evaluationCache.size
    })
  );

  return {
    id: problem.id,
    type: "maxwellDesignFoundryPlanarCoating",
    analysisId: "analysis.maxwell.l5.phase1.designFoundry.planarCoating",
    label: problem.label,
    objective: normalizedObjectiveForHash(problem.objective),
    seed,
    best,
    candidates: rankedEvaluations,
    evaluationCount: evaluationCache.size,
    variableCount: variables.length,
    warnings: uniqueWarnings(warnings),
    resultHash,
    provenance: designFoundryProvenance()
  };
}

export function evaluateCoatingDesignStack(
  stack: CoatingStackDefinition,
  objective: CoatingDesignObjective,
  runOptions: CoatingStackRunOptions = {}
): CoatingDesignEvaluation {
  const warnings: SolverWarning[] = [];
  const reflectance: number[] = [];
  const transmittance: number[] = [];
  const absorbance: number[] = [];
  const energyBalanceError: number[] = [];

  for (const wavelengthM of objective.wavelengthsM) {
    const run = runCoatingStack({ ...stack, wavelengthM }, runOptions);
    warnings.push(...run.warnings);
    reflectance.push(run.tmm.reflectance);
    transmittance.push(run.tmm.transmittance);
    absorbance.push(run.tmm.absorbance);
    energyBalanceError.push(run.tmm.energyBalanceError);
  }

  const metrics: CoatingDesignMetrics = {
    sampleCount: objective.wavelengthsM.length,
    meanReflectance: mean(reflectance),
    maxReflectance: Math.max(...reflectance),
    minReflectance: Math.min(...reflectance),
    meanTransmittance: mean(transmittance),
    maxTransmittance: Math.max(...transmittance),
    minTransmittance: Math.min(...transmittance),
    meanAbsorbance: mean(absorbance),
    maxAbsorbance: Math.max(...absorbance),
    minAbsorbance: Math.min(...absorbance),
    maxEnergyBalanceError: Math.max(...energyBalanceError)
  };
  const score = scoreCoatingDesignMetrics(metrics, stack, objective);

  return {
    score,
    stack,
    metrics,
    warnings: uniqueWarnings(warnings)
  };
}

export function scoreCoatingDesignMetrics(metrics: CoatingDesignMetrics, stack: CoatingStackDefinition, objective: CoatingDesignObjective): number {
  let score = constraintPenalty(stack, objective);
  for (const term of objective.terms) {
    const weight = term.weight ?? 1;
    const metric = metricValue(metrics, term.metric, term.aggregation ?? "mean");
    if (term.target !== undefined) {
      const miss = term.direction === "minimize" ? Math.max(0, metric - term.target) : Math.max(0, term.target - metric);
      score += weight * miss * miss;
    } else if (term.direction === "minimize") {
      score += weight * metric;
    } else {
      score += weight * (1 - metric);
    }
  }
  return score;
}

function constraintPenalty(stack: CoatingStackDefinition, objective: CoatingDesignObjective): number {
  const constraints = objective.constraints;
  if (!constraints) return 0;

  let penalty = 0;
  if (constraints.maxLayerCount !== undefined && stack.layers.length > constraints.maxLayerCount) {
    penalty += 1000 + (stack.layers.length - constraints.maxLayerCount) * 100;
  }
  if (constraints.allowedMaterialIds) {
    for (const layer of stack.layers) {
      if (!constraints.allowedMaterialIds.includes(layer.materialId)) {
        penalty += 100;
      }
    }
  }
  if (constraints.minThicknessM !== undefined || constraints.maxThicknessM !== undefined) {
    const minThicknessM = constraints.minThicknessM ?? 0;
    const maxThicknessM = constraints.maxThicknessM ?? Number.POSITIVE_INFINITY;
    for (const layer of stack.layers) {
      if (layer.thicknessM < minThicknessM) penalty += 10 + (minThicknessM - layer.thicknessM) / Math.max(1e-12, minThicknessM);
      if (layer.thicknessM > maxThicknessM) penalty += 10 + (layer.thicknessM - maxThicknessM) / Math.max(1e-12, maxThicknessM);
    }
  }
  if (constraints.maxTotalThicknessM !== undefined) {
    const totalThicknessM = stack.layers.reduce((sum, layer) => sum + layer.thicknessM, 0);
    if (totalThicknessM > constraints.maxTotalThicknessM) {
      penalty += 20 + (totalThicknessM - constraints.maxTotalThicknessM) / Math.max(1e-12, constraints.maxTotalThicknessM);
    }
  }
  return penalty;
}

function makeCandidate(evaluation: CoatingDesignEvaluation, rank: number, seedScore: number, runOptions: CoatingStackRunOptions = {}): CoatingDesignCandidate {
  const certifiedRun = runCoatingStack(evaluation.stack, runOptions);
  const resultHash = fnv1a64(
    stableStringify({
      analysisId: "analysis.maxwell.l5.phase1.designFoundry.candidate",
      stack: stackForHash(evaluation.stack),
      metrics: roundMetrics(evaluation.metrics),
      score: roundNumber(evaluation.score),
      certifiedRunHash: certifiedRun.resultHash
    })
  );

  return {
    rank,
    score: evaluation.score,
    improvementFromSeed: seedScore - evaluation.score,
    stack: evaluation.stack,
    metrics: evaluation.metrics,
    certifiedRun,
    resultHash
  };
}

function normalizedVariables(
  stack: CoatingStackDefinition,
  objective: CoatingDesignObjective,
  variables: CoatingDesignVariable[] | undefined
): CoatingDesignVariable[] {
  const constraints = objective.constraints;
  const defaultMinM = constraints?.minThicknessM ?? 5e-9;
  const defaultMaxM = constraints?.maxThicknessM ?? 250e-9;
  const source = variables ?? stack.layers.map((layer) => ({ layerId: layer.id, minThicknessM: defaultMinM, maxThicknessM: defaultMaxM }));
  return source
    .filter((variable) => stack.layers.some((layer) => layer.id === variable.layerId))
    .map((variable) => {
      const minThicknessM = Math.max(0.1e-9, Math.min(variable.minThicknessM, variable.maxThicknessM));
      const maxThicknessM = Math.max(minThicknessM, variable.maxThicknessM);
      return {
        layerId: variable.layerId,
        minThicknessM,
        maxThicknessM
      };
    });
}

function clampStackToVariables(stack: CoatingStackDefinition, variables: CoatingDesignVariable[]): CoatingStackDefinition {
  let output = cloneStack(stack);
  for (const variable of variables) {
    output = setLayerThickness(output, variable.layerId, clamp(layerThickness(output, variable.layerId), variable.minThicknessM, variable.maxThicknessM));
  }
  return output;
}

function setLayerThickness(stack: CoatingStackDefinition, layerId: string, thicknessM: number): CoatingStackDefinition {
  return {
    ...stack,
    layers: stack.layers.map((layer) => (layer.id === layerId ? { ...layer, thicknessM } : { ...layer }))
  };
}

function layerThickness(stack: CoatingStackDefinition, layerId: string): number {
  const layer = stack.layers.find((candidate) => candidate.id === layerId);
  if (!layer) throw new Error(`unknown coating design variable layer '${layerId}'`);
  return layer.thicknessM;
}

function validateProblem(problem: CoatingDesignProblem): void {
  if (problem.objective.type !== "planarCoatingStack") throw new Error("design objective must be a planar coating stack objective");
  if (problem.objective.wavelengthsM.length === 0) throw new Error("design objective must include at least one wavelength");
  for (const wavelengthM of problem.objective.wavelengthsM) {
    if (wavelengthM <= 0 || !Number.isFinite(wavelengthM)) throw new Error("design objective wavelengths must be positive");
  }
  if (problem.objective.terms.length === 0) throw new Error("design objective must include at least one term");
  for (const term of problem.objective.terms) {
    if ((term.weight ?? 1) < 0 || !Number.isFinite(term.weight ?? 1)) throw new Error("design objective term weights must be finite and non-negative");
  }
}

function metricValue(metrics: CoatingDesignMetrics, metric: CoatingDesignMetric, aggregation: CoatingDesignAggregation): number {
  const prefix = aggregation === "mean" ? "mean" : aggregation;
  const key = `${prefix}${capitalize(metric)}` as keyof CoatingDesignMetrics;
  return metrics[key] as number;
}

function designFoundryProvenance(): CoatingDesignResult["provenance"] {
  return {
    label: "L5.1 Maxwell Design Foundry planar coating objective and thickness optimizer",
    limitations: [
      "Accepts a declarative coating objective and searches coating thicknesses only.",
      "Every reported candidate is re-solved through the existing planar frequency-domain Maxwell TMM coating stack path.",
      "This is not adjoint optimization, topology optimization, 3D FEM/BEM/RCWA/FDTD, curved optics, CAD geometry, sensor-complete modeling, lab calibration, or manufacturing certification.",
      "Manufacturing constraints are simple scalar screening rules, not foundry PDK design-rule checking.",
      "Built-in material records are diagnostic samples, not an authoritative optical material database."
    ]
  };
}

function normalizedObjectiveForHash(objective: CoatingDesignObjective): CoatingDesignObjective {
  return {
    ...objective,
    wavelengthsM: [...objective.wavelengthsM],
    terms: objective.terms.map((term) => ({ ...term })),
    constraints: objective.constraints ? { ...objective.constraints, allowedMaterialIds: objective.constraints.allowedMaterialIds ? [...objective.constraints.allowedMaterialIds] : undefined } : undefined
  };
}

function cloneStack(stack: CoatingStackDefinition): CoatingStackDefinition {
  return {
    ...stack,
    layers: stack.layers.map((layer) => ({ ...layer }))
  };
}

function stackKey(stack: CoatingStackDefinition): string {
  return stableStringify(stackForHash(stack));
}

function stackForHash(stack: CoatingStackDefinition): unknown {
  return {
    id: stack.id,
    label: stack.label,
    wavelengthM: roundNumber(stack.wavelengthM),
    angleRad: roundNumber(stack.angleRad),
    polarization: stack.polarization,
    incidentMaterialId: stack.incidentMaterialId,
    substrateMaterialId: stack.substrateMaterialId,
    layers: stack.layers.map((layer) => ({
      id: layer.id,
      label: layer.label,
      materialId: layer.materialId,
      thicknessM: roundNumber(layer.thicknessM)
    }))
  };
}

function roundMetrics(metrics: CoatingDesignMetrics): CoatingDesignMetrics {
  return {
    sampleCount: metrics.sampleCount,
    meanReflectance: roundNumber(metrics.meanReflectance),
    maxReflectance: roundNumber(metrics.maxReflectance),
    minReflectance: roundNumber(metrics.minReflectance),
    meanTransmittance: roundNumber(metrics.meanTransmittance),
    maxTransmittance: roundNumber(metrics.maxTransmittance),
    minTransmittance: roundNumber(metrics.minTransmittance),
    meanAbsorbance: roundNumber(metrics.meanAbsorbance),
    maxAbsorbance: roundNumber(metrics.maxAbsorbance),
    minAbsorbance: roundNumber(metrics.minAbsorbance),
    maxEnergyBalanceError: roundNumber(metrics.maxEnergyBalanceError)
  };
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampInteger(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function roundNumber(value: number): number {
  return Number(value.toPrecision(12));
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
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
