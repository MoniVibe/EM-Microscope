import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import type { CoatingStackDefinition } from "./coatingStack";
import { evaluateCoatingDesignStack, type CoatingDesignMetrics, type CoatingDesignObjective } from "./designFoundry";

export type CoatingYieldMetric = keyof Pick<
  CoatingDesignMetrics,
  | "meanReflectance"
  | "maxReflectance"
  | "minReflectance"
  | "meanTransmittance"
  | "minTransmittance"
  | "meanAbsorbance"
  | "maxAbsorbance"
  | "maxEnergyBalanceError"
>;

export type CoatingYieldRequirement = {
  id: string;
  label: string;
  metric: CoatingYieldMetric;
  operator: "<=" | ">=";
  limit: number;
};

export type CoatingThicknessTolerance = {
  layerId: string;
  sigmaM: number;
  driftM?: number;
  distribution?: "normal" | "uniform";
};

export type CoatingYieldSettings = {
  sampleCount?: number;
  sigmaClip?: number;
  sensitivityStepSigma?: number;
  confidenceLevel?: 0.9 | 0.95 | 0.99;
};

export type CoatingYieldProblem = {
  id: string;
  label: string;
  stack: CoatingStackDefinition;
  objective: CoatingDesignObjective;
  tolerances?: CoatingThicknessTolerance[];
  requirements?: CoatingYieldRequirement[];
  settings?: CoatingYieldSettings;
};

export type CoatingYieldPerturbation = {
  layerId: string;
  label: string;
  nominalThicknessM: number;
  deltaM: number;
  sampledThicknessM: number;
};

export type CoatingYieldSample = {
  index: number;
  passed: boolean;
  score: number;
  metrics: CoatingDesignMetrics;
  perturbations: CoatingYieldPerturbation[];
  resultHash: string;
};

export type CoatingYieldRequirementResult = {
  requirement: CoatingYieldRequirement;
  nominalValue: number;
  worstValue: number;
  passRate: number;
};

export type CoatingYieldSensitivity = {
  rank: number;
  layerId: string;
  label: string;
  sigmaM: number;
  minusScore: number;
  plusScore: number;
  scoreSlopePerNm: number;
  maxReflectanceSlopePerNm: number;
  impactScore: number;
};

export type CoatingYieldResult = {
  id: string;
  type: "maxwellDesignFoundryPlanarYield";
  analysisId: "analysis.maxwell.l5.phase2.yield.planarCoating";
  label: string;
  nominal: {
    score: number;
    metrics: CoatingDesignMetrics;
    resultHash: string;
  };
  requirements: CoatingYieldRequirementResult[];
  tolerances: CoatingThicknessTolerance[];
  samples: CoatingYieldSample[];
  passCount: number;
  passRate: number;
  confidenceInterval: {
    method: "wilson";
    level: number;
    lower: number;
    upper: number;
  };
  worstSample: CoatingYieldSample;
  bestSample: CoatingYieldSample;
  sensitivities: CoatingYieldSensitivity[];
  warnings: SolverWarning[];
  resultHash: string;
  provenance: {
    label: "L5.2 Maxwell Design Foundry planar coating tolerance and yield analysis";
    limitations: string[];
  };
};

const haltonPrimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61];

export function defaultVisibleArYieldRequirements(): CoatingYieldRequirement[] {
  return [
    {
      id: "yield.mean-reflectance-visible",
      label: "Mean R <= 2%",
      metric: "meanReflectance",
      operator: "<=",
      limit: 0.02
    },
    {
      id: "yield.max-reflectance-visible",
      label: "Max R <= 6%",
      metric: "maxReflectance",
      operator: "<=",
      limit: 0.06
    },
    {
      id: "yield.max-absorbance-visible",
      label: "Max A <= 0.5%",
      metric: "maxAbsorbance",
      operator: "<=",
      limit: 0.005
    }
  ];
}

export function runCoatingYieldAnalysis(problem: CoatingYieldProblem): CoatingYieldResult {
  validateYieldProblem(problem);
  const settings = {
    sampleCount: clampInteger(problem.settings?.sampleCount ?? 41, 3, 501),
    sigmaClip: clamp(problem.settings?.sigmaClip ?? 3, 0.25, 8),
    sensitivityStepSigma: clamp(problem.settings?.sensitivityStepSigma ?? 1, 0.05, 5),
    confidenceLevel: problem.settings?.confidenceLevel ?? 0.95
  };
  const tolerances = normalizeTolerances(problem.stack, problem.tolerances);
  const requirements = problem.requirements ?? defaultVisibleArYieldRequirements();
  const warnings: SolverWarning[] = [
    {
      code: "maxwell.yield.planarThicknessOnly",
      message:
        "L5.2 yield analysis perturbs planar coating thicknesses and re-solves through the existing Maxwell TMM path; this is not full manufacturing VVUQ, 3D FEM/BEM/RCWA/FDTD, lab calibration, or PDK-certified yield."
    }
  ];
  if (tolerances.length === 0) {
    warnings.push({
      code: "maxwell.yield.noThicknessTolerances",
      message: "Yield analysis received no coating thickness tolerances; nominal stack is sampled without perturbation."
    });
  }

  const nominalEvaluation = evaluateCoatingDesignStack(problem.stack, problem.objective);
  warnings.push(...nominalEvaluation.warnings);

  const samples: CoatingYieldSample[] = [];
  for (let sampleIndex = 0; sampleIndex < settings.sampleCount; sampleIndex += 1) {
    const { stack, perturbations } = perturbStack(problem.stack, tolerances, sampleIndex, settings.sigmaClip);
    const evaluation = evaluateCoatingDesignStack(stack, problem.objective);
    const passed = passesRequirements(evaluation.metrics, requirements);
    warnings.push(...evaluation.warnings);
    samples.push({
      index: sampleIndex,
      passed,
      score: evaluation.score,
      metrics: evaluation.metrics,
      perturbations,
      resultHash: sampleHash(problem.id, sampleIndex, stack, evaluation.metrics, passed)
    });
  }

  const passCount = samples.filter((sample) => sample.passed).length;
  const passRate = passCount / Math.max(1, samples.length);
  const confidenceInterval = wilsonInterval(passCount, samples.length, settings.confidenceLevel);
  const worstSample = [...samples].sort((a, b) => b.score - a.score)[0] ?? nominalSample(problem, nominalEvaluation.metrics, nominalEvaluation.score);
  const bestSample = [...samples].sort((a, b) => a.score - b.score)[0] ?? nominalSample(problem, nominalEvaluation.metrics, nominalEvaluation.score);
  const requirementResults = requirements.map((requirement) => requirementResult(requirement, nominalEvaluation.metrics, samples));
  const sensitivities = sensitivityResults(problem.stack, problem.objective, tolerances, settings.sensitivityStepSigma);

  const resultHash = fnv1a64(
    stableStringify({
      analysisId: "analysis.maxwell.l5.phase2.yield.planarCoating",
      problem: {
        id: problem.id,
        stack: stackForHash(problem.stack),
        objective: normalizedObjectiveForHash(problem.objective),
        tolerances,
        requirements,
        settings
      },
      nominal: {
        score: roundNumber(nominalEvaluation.score),
        metrics: roundMetrics(nominalEvaluation.metrics)
      },
      passRate: roundNumber(passRate),
      samples: samples.map((sample) => ({
        index: sample.index,
        passed: sample.passed,
        score: roundNumber(sample.score),
        metrics: roundMetrics(sample.metrics)
      }))
    })
  );

  return {
    id: problem.id,
    type: "maxwellDesignFoundryPlanarYield",
    analysisId: "analysis.maxwell.l5.phase2.yield.planarCoating",
    label: problem.label,
    nominal: {
      score: nominalEvaluation.score,
      metrics: nominalEvaluation.metrics,
      resultHash: fnv1a64(stableStringify({ stack: stackForHash(problem.stack), metrics: roundMetrics(nominalEvaluation.metrics), score: roundNumber(nominalEvaluation.score) }))
    },
    requirements: requirementResults,
    tolerances,
    samples,
    passCount,
    passRate,
    confidenceInterval,
    worstSample,
    bestSample,
    sensitivities,
    warnings: uniqueWarnings(warnings),
    resultHash,
    provenance: yieldProvenance()
  };
}

function perturbStack(
  stack: CoatingStackDefinition,
  tolerances: CoatingThicknessTolerance[],
  sampleIndex: number,
  sigmaClip: number
): { stack: CoatingStackDefinition; perturbations: CoatingYieldPerturbation[] } {
  const perturbations: CoatingYieldPerturbation[] = [];
  const layers = stack.layers.map((layer, layerIndex) => {
    const tolerance = tolerances.find((candidate) => candidate.layerId === layer.id);
    if (!tolerance) return { ...layer };

    const u = halton(sampleIndex + 1, haltonPrimes[(layerIndex * 2) % haltonPrimes.length] ?? 2);
    const v = halton(sampleIndex + 1, haltonPrimes[(layerIndex * 2 + 1) % haltonPrimes.length] ?? 3);
    const z = tolerance.distribution === "uniform" ? 2 * u - 1 : clippedNormal(u, v, sigmaClip);
    const deltaM = (tolerance.driftM ?? 0) + tolerance.sigmaM * z;
    const sampledThicknessM = Math.max(0.1e-9, layer.thicknessM + deltaM);
    perturbations.push({
      layerId: layer.id,
      label: layer.label,
      nominalThicknessM: layer.thicknessM,
      deltaM,
      sampledThicknessM
    });
    return { ...layer, thicknessM: sampledThicknessM };
  });

  return {
    stack: { ...stack, layers },
    perturbations
  };
}

function sensitivityResults(
  stack: CoatingStackDefinition,
  objective: CoatingDesignObjective,
  tolerances: CoatingThicknessTolerance[],
  sensitivityStepSigma: number
): CoatingYieldSensitivity[] {
  const nominal = evaluateCoatingDesignStack(stack, objective);
  return tolerances
    .map((tolerance) => {
      const layer = stack.layers.find((candidate) => candidate.id === tolerance.layerId);
      if (!layer) return null;
      const stepM = Math.max(0.05e-9, tolerance.sigmaM * sensitivityStepSigma);
      const minusStack = setLayerThickness(stack, tolerance.layerId, Math.max(0.1e-9, layer.thicknessM - stepM));
      const plusStack = setLayerThickness(stack, tolerance.layerId, layer.thicknessM + stepM);
      const minus = evaluateCoatingDesignStack(minusStack, objective);
      const plus = evaluateCoatingDesignStack(plusStack, objective);
      const denominatorNm = Math.max(1e-12, 2 * stepM * 1e9);
      return {
        rank: 0,
        layerId: tolerance.layerId,
        label: layer.label,
        sigmaM: tolerance.sigmaM,
        minusScore: minus.score,
        plusScore: plus.score,
        scoreSlopePerNm: (plus.score - minus.score) / denominatorNm,
        maxReflectanceSlopePerNm: (plus.metrics.maxReflectance - minus.metrics.maxReflectance) / denominatorNm,
        impactScore: Math.max(Math.abs(minus.score - nominal.score), Math.abs(plus.score - nominal.score))
      };
    })
    .filter((sensitivity): sensitivity is Omit<CoatingYieldSensitivity, "rank"> & { rank: number } => sensitivity !== null)
    .sort((a, b) => b.impactScore - a.impactScore)
    .map((sensitivity, index) => ({ ...sensitivity, rank: index + 1 }));
}

function requirementResult(
  requirement: CoatingYieldRequirement,
  nominalMetrics: CoatingDesignMetrics,
  samples: CoatingYieldSample[]
): CoatingYieldRequirementResult {
  const sampleValues = samples.map((sample) => metricValue(sample.metrics, requirement.metric));
  const passCount = samples.filter((sample) => passesRequirement(sample.metrics, requirement)).length;
  return {
    requirement,
    nominalValue: metricValue(nominalMetrics, requirement.metric),
    worstValue: requirement.operator === "<=" ? Math.max(...sampleValues) : Math.min(...sampleValues),
    passRate: passCount / Math.max(1, samples.length)
  };
}

function passesRequirements(metrics: CoatingDesignMetrics, requirements: CoatingYieldRequirement[]): boolean {
  return requirements.every((requirement) => passesRequirement(metrics, requirement));
}

function passesRequirement(metrics: CoatingDesignMetrics, requirement: CoatingYieldRequirement): boolean {
  const value = metricValue(metrics, requirement.metric);
  return requirement.operator === "<=" ? value <= requirement.limit : value >= requirement.limit;
}

function metricValue(metrics: CoatingDesignMetrics, metric: CoatingYieldMetric): number {
  return metrics[metric];
}

function normalizeTolerances(stack: CoatingStackDefinition, tolerances: CoatingThicknessTolerance[] | undefined): CoatingThicknessTolerance[] {
  const source: CoatingThicknessTolerance[] = tolerances ?? stack.layers.map((layer) => ({ layerId: layer.id, sigmaM: 2e-9, distribution: "normal" as const }));
  return source
    .filter((tolerance) => stack.layers.some((layer) => layer.id === tolerance.layerId))
    .map((tolerance) => ({
      layerId: tolerance.layerId,
      sigmaM: Math.max(0, tolerance.sigmaM),
      driftM: tolerance.driftM ?? 0,
      distribution: tolerance.distribution ?? "normal"
    }));
}

function setLayerThickness(stack: CoatingStackDefinition, layerId: string, thicknessM: number): CoatingStackDefinition {
  return {
    ...stack,
    layers: stack.layers.map((layer) => (layer.id === layerId ? { ...layer, thicknessM } : { ...layer }))
  };
}

function validateYieldProblem(problem: CoatingYieldProblem): void {
  if (problem.objective.type !== "planarCoatingStack") throw new Error("yield objective must be a planar coating stack objective");
  if (problem.objective.wavelengthsM.length === 0) throw new Error("yield objective must include at least one wavelength");
  for (const wavelengthM of problem.objective.wavelengthsM) {
    if (wavelengthM <= 0 || !Number.isFinite(wavelengthM)) throw new Error("yield objective wavelengths must be positive");
  }
  for (const tolerance of problem.tolerances ?? []) {
    if (tolerance.sigmaM < 0 || !Number.isFinite(tolerance.sigmaM)) throw new Error("coating thickness tolerance sigma must be finite and non-negative");
  }
  for (const requirement of problem.requirements ?? []) {
    if (!Number.isFinite(requirement.limit)) throw new Error("yield requirement limits must be finite");
  }
}

function nominalSample(problem: CoatingYieldProblem, metrics: CoatingDesignMetrics, score: number): CoatingYieldSample {
  return {
    index: -1,
    passed: passesRequirements(metrics, problem.requirements ?? defaultVisibleArYieldRequirements()),
    score,
    metrics,
    perturbations: [],
    resultHash: sampleHash(problem.id, -1, problem.stack, metrics, true)
  };
}

function wilsonInterval(passCount: number, sampleCount: number, level: number): CoatingYieldResult["confidenceInterval"] {
  const z = zForConfidence(level);
  if (sampleCount <= 0) {
    return { method: "wilson", level, lower: 0, upper: 0 };
  }
  const phat = passCount / sampleCount;
  const z2 = z * z;
  const denominator = 1 + z2 / sampleCount;
  const center = (phat + z2 / (2 * sampleCount)) / denominator;
  const spread = (z * Math.sqrt((phat * (1 - phat) + z2 / (4 * sampleCount)) / sampleCount)) / denominator;
  return {
    method: "wilson",
    level,
    lower: clamp(center - spread, 0, 1),
    upper: clamp(center + spread, 0, 1)
  };
}

function zForConfidence(level: number): number {
  if (level >= 0.99) return 2.5758293035489004;
  if (level >= 0.95) return 1.959963984540054;
  return 1.6448536269514722;
}

function clippedNormal(u: number, v: number, sigmaClip: number): number {
  const safeU = clamp(u, 1e-12, 1 - 1e-12);
  const z = Math.sqrt(-2 * Math.log(safeU)) * Math.cos(2 * Math.PI * v);
  return clamp(z, -sigmaClip, sigmaClip);
}

function halton(index: number, base: number): number {
  let fraction = 1;
  let result = 0;
  let n = index;
  while (n > 0) {
    fraction /= base;
    result += fraction * (n % base);
    n = Math.floor(n / base);
  }
  return result;
}

function yieldProvenance(): CoatingYieldResult["provenance"] {
  return {
    label: "L5.2 Maxwell Design Foundry planar coating tolerance and yield analysis",
    limitations: [
      "Perturbs coating thicknesses only and re-solves each sample through the planar Maxwell TMM coating-stack path.",
      "Pass rate and confidence bounds are deterministic workbench estimates, not a certified manufacturing yield claim.",
      "Local sensitivity uses finite thickness steps, not adjoint gradients or full uncertainty propagation.",
      "This is not 3D FEM/BEM/RCWA/FDTD, foundry PDK checking, thermal/structural multiphysics, lab calibration, or digital-twin validation.",
      "Built-in material records are diagnostic samples, not an authoritative optical material database."
    ]
  };
}

function sampleHash(id: string, sampleIndex: number, stack: CoatingStackDefinition, metrics: CoatingDesignMetrics, passed: boolean): string {
  return fnv1a64(
    stableStringify({
      id,
      sampleIndex,
      stack: stackForHash(stack),
      metrics: roundMetrics(metrics),
      passed
    })
  );
}

function normalizedObjectiveForHash(objective: CoatingDesignObjective): CoatingDesignObjective {
  return {
    ...objective,
    wavelengthsM: [...objective.wavelengthsM],
    terms: objective.terms.map((term) => ({ ...term })),
    constraints: objective.constraints ? { ...objective.constraints, allowedMaterialIds: objective.constraints.allowedMaterialIds ? [...objective.constraints.allowedMaterialIds] : undefined } : undefined
  };
}

function stackForHash(stack: CoatingStackDefinition): unknown {
  return {
    id: stack.id,
    wavelengthM: roundNumber(stack.wavelengthM),
    angleRad: roundNumber(stack.angleRad),
    polarization: stack.polarization,
    incidentMaterialId: stack.incidentMaterialId,
    substrateMaterialId: stack.substrateMaterialId,
    layers: stack.layers.map((layer) => ({
      id: layer.id,
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampInteger(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
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
