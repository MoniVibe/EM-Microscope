import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import { runCoatingStack, type CoatingStackDefinition, type CoatingStackRunOptions } from "./coatingStack";
import {
  applyCoatingSearchCandidate,
  runCoatingSearch,
  type CoatingCandidateMetrics,
  type CoatingSearchCandidate,
  type CoatingSearchMetric,
  type CoatingSearchObjective,
  type CoatingSearchPolarization,
  type CoatingSearchResult,
  type CoatingSearchSample,
  type CoatingSearchSpec
} from "./coatingSearch";
import type { MaterialCatalogReference } from "./materialCatalog";
import type { MaxwellPolarization } from "./planarTmm";

export type RobustCoatingSearchPrimaryMetric = "p90Score" | "expectedScore" | "worstCaseScore" | "passRate";

export type RobustThicknessUncertainty = {
  mode: "deterministic-grid";
  sigmaNm: number;
  sigmaLevels?: number[];
  maxSamplesPerCandidate?: number;
};

export type RobustCoatingObjective = {
  primary: RobustCoatingSearchPrimaryMetric;
  passThreshold?: number;
  weights?: {
    nominalScore?: number;
    expectedScore?: number;
    p90Score?: number;
    worstCaseScore?: number;
    passRate?: number;
  };
};

export type RobustCoatingSearchSpec = {
  id: string;
  label: string;
  nominalSearch: CoatingSearchSpec;
  uncertainty: {
    thickness: RobustThicknessUncertainty;
  };
  robustObjective: RobustCoatingObjective;
  candidateLimit?: number;
};

export type RobustLayerPerturbation = {
  layerId: string;
  label: string;
  materialId: string;
  nominalThicknessM: number;
  sigmaMultiplier: number;
  deltaM: number;
  sampledThicknessM: number;
};

export type RobustCoatingSample = {
  index: number;
  label: string;
  sigmaMultipliers: number[];
  score: number;
  passed?: boolean;
  metrics: CoatingCandidateMetrics;
  perturbations: RobustLayerPerturbation[];
  resultHash: string;
};

export type RobustYieldMetrics = {
  sampleCount: number;
  expectedScore: number;
  medianScore: number;
  p90Score: number;
  worstCaseScore: number;
  passRate?: number;
  expectedReflectance: number;
  p90Reflectance: number;
  worstCaseReflectance: number;
  expectedTransmittance: number;
  expectedAbsorbance: number;
};

export type RobustUncertaintyReceipt = {
  model: "thickness-only";
  mode: "deterministic-grid";
  sigmaNm: number;
  sigmaLevels: number[];
  maxSamplesPerCandidate: number;
  generatedSamplesPerCandidate: number;
  importedMaterialNkAssumption: "fixed";
};

export type RobustCoatingSearchCandidate = {
  id: string;
  rank: number;
  robustScore: number;
  nominalCandidate: CoatingSearchCandidate;
  stack: CoatingStackDefinition;
  layers: CoatingSearchCandidate["layers"];
  materialCatalogRefs: MaterialCatalogReference[];
  nominal: {
    score: number;
    metrics: CoatingCandidateMetrics;
    resultHash: string;
  };
  yield: RobustYieldMetrics;
  samples: RobustCoatingSample[];
  uncertaintyReceipt: RobustUncertaintyReceipt;
  warnings: SolverWarning[];
  resultHash: string;
};

export type RobustCoatingSearchResult = {
  id: string;
  type: "maxwellRobustYieldCoatingSearch";
  analysisId: "analysis.maxwell.l5.phase6.robustYieldCoatingSearch";
  label: string;
  spec: RobustCoatingSearchSpec;
  nominalSearchResult: CoatingSearchResult;
  best: RobustCoatingSearchCandidate;
  candidates: RobustCoatingSearchCandidate[];
  evaluationCount: number;
  sampleEvaluationCount: number;
  warnings: SolverWarning[];
  resultHash: string;
  provenance: {
    label: "L5.6 deterministic planar coating robust-yield search";
    limitations: string[];
  };
};

type NormalizedThicknessModel = Required<RobustThicknessUncertainty>;

type WorkingRobustCandidate = Omit<RobustCoatingSearchCandidate, "rank">;

export function runRobustCoatingSearch(spec: RobustCoatingSearchSpec, options: CoatingStackRunOptions = {}): RobustCoatingSearchResult {
  validateRobustSpec(spec);
  const thickness = normalizeThicknessModel(spec.uncertainty.thickness);
  const nominalSearchResult = runCoatingSearch(spec.nominalSearch, options);
  const candidateLimit = clampInteger(spec.candidateLimit ?? nominalSearchResult.candidates.length, 1, nominalSearchResult.candidates.length);
  const warnings: SolverWarning[] = [
    {
      code: "maxwell.robustSearch.planarThicknessOnly",
      message:
        "L5.6 robust search wraps L5.5 nominal coating candidates with deterministic thickness-only perturbations and re-solves each sample through the existing planar Maxwell TMM path; this is not material n/k uncertainty, correlated drift, Monte Carlo certification, 3D FEM/BEM/RCWA/FDTD, digital-twin calibration, or manufacturing certification."
    }
  ];

  const candidates = nominalSearchResult.candidates
    .slice(0, candidateLimit)
    .map((candidate) => evaluateRobustCandidate(spec, candidate, thickness, options))
    .sort(compareWorkingCandidates)
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }));

  if (candidates.length === 0) throw new Error("robust coating search produced no valid candidates; relax nominal search constraints first");

  const sampleEvaluationCount = candidates.reduce((sum, candidate) => sum + candidate.samples.length, 0);
  const resultHash = fnv1a64(
    stableStringify({
      analysisId: "analysis.maxwell.l5.phase6.robustYieldCoatingSearch",
      spec: specForHash(spec, thickness),
      nominalSearchHash: nominalSearchResult.resultHash,
      candidates: candidates.map((candidate) => ({
        rank: candidate.rank,
        robustScore: roundNumber(candidate.robustScore),
        nominalHash: candidate.nominal.resultHash,
        yield: roundYieldMetrics(candidate.yield),
        receipt: candidate.uncertaintyReceipt,
        resultHash: candidate.resultHash
      })),
      warningCodes: warnings.map((warning) => warning.code)
    })
  );

  return {
    id: spec.id,
    type: "maxwellRobustYieldCoatingSearch",
    analysisId: "analysis.maxwell.l5.phase6.robustYieldCoatingSearch",
    label: spec.label,
    spec: cloneSpec(spec),
    nominalSearchResult,
    best: candidates[0]!,
    candidates,
    evaluationCount: nominalSearchResult.evaluationCount,
    sampleEvaluationCount,
    warnings: uniqueWarnings([...warnings, ...candidates.flatMap((candidate) => candidate.warnings), ...nominalSearchResult.warnings]),
    resultHash,
    provenance: robustSearchProvenance()
  };
}

export function applyRobustCoatingSearchCandidate(baseStack: CoatingStackDefinition, candidate: RobustCoatingSearchCandidate): CoatingStackDefinition {
  return applyCoatingSearchCandidate(baseStack, candidate.nominalCandidate);
}

function evaluateRobustCandidate(
  spec: RobustCoatingSearchSpec,
  nominalCandidate: CoatingSearchCandidate,
  thickness: NormalizedThicknessModel,
  options: CoatingStackRunOptions
): WorkingRobustCandidate {
  const sigmaVectors = deterministicSigmaVectors(nominalCandidate.stack.layers.length, thickness.sigmaLevels, thickness.maxSamplesPerCandidate);
  const samples = sigmaVectors.map((sigmaMultipliers, index) => evaluateRobustSample(spec, nominalCandidate.stack, thickness.sigmaNm, sigmaMultipliers, index, options));
  const yieldMetrics = summarizeRobustSamples(samples);
  const robustScore = scoreRobustMetrics(nominalCandidate.score, yieldMetrics, spec.robustObjective);
  const uncertaintyReceipt: RobustUncertaintyReceipt = {
    model: "thickness-only",
    mode: thickness.mode,
    sigmaNm: thickness.sigmaNm,
    sigmaLevels: [...thickness.sigmaLevels],
    maxSamplesPerCandidate: thickness.maxSamplesPerCandidate,
    generatedSamplesPerCandidate: samples.length,
    importedMaterialNkAssumption: "fixed"
  };
  const warnings: SolverWarning[] = [
    {
      code: "maxwell.robustSearch.importedNkFixed",
      message:
        "L5.6 robust search keeps imported and built-in material n/k records fixed while perturbing layer thicknesses; material source uncertainty is recorded as out of scope."
    }
  ];
  const resultHash = fnv1a64(
    stableStringify({
      analysisId: "analysis.maxwell.l5.phase6.robustYieldCandidate",
      nominalHash: nominalCandidate.resultHash,
      robustScore: roundNumber(robustScore),
      yield: roundYieldMetrics(yieldMetrics),
      receipt: uncertaintyReceipt,
      sampleHashes: samples.map((sample) => sample.resultHash)
    })
  );

  return {
    id: resultHash,
    robustScore,
    nominalCandidate,
    stack: cloneStack(nominalCandidate.stack),
    layers: nominalCandidate.layers.map((layer) => ({ ...layer })),
    materialCatalogRefs: nominalCandidate.materialCatalogRefs.map((reference) => ({ ...reference })),
    nominal: {
      score: nominalCandidate.score,
      metrics: cloneMetrics(nominalCandidate.metrics),
      resultHash: nominalCandidate.resultHash
    },
    yield: yieldMetrics,
    samples,
    uncertaintyReceipt,
    warnings: uniqueWarnings([...warnings, ...nominalCandidate.warnings, ...samples.flatMap((sample) => sample.metrics.samples.flatMap(() => []))]),
    resultHash
  };
}

function evaluateRobustSample(
  spec: RobustCoatingSearchSpec,
  nominalStack: CoatingStackDefinition,
  sigmaNm: number,
  sigmaMultipliers: number[],
  index: number,
  options: CoatingStackRunOptions
): RobustCoatingSample {
  const { stack, perturbations } = perturbStack(nominalStack, sigmaNm * 1e-9, sigmaMultipliers);
  const metrics = evaluateStackMetrics(spec.nominalSearch, stack, options);
  const score = scoreMetrics(metrics, spec.nominalSearch.objective);
  const passed = spec.robustObjective.passThreshold === undefined ? undefined : score <= spec.robustObjective.passThreshold;
  const label = sigmaMultipliers.length === 0 ? "nominal" : sigmaMultipliers.map((value) => `${value >= 0 ? "+" : ""}${formatMultiplier(value)}`).join(",");
  const resultHash = fnv1a64(
    stableStringify({
      analysisId: "analysis.maxwell.l5.phase6.robustYieldSample",
      index,
      stack: stackForHash(stack),
      sigmaMultipliers: sigmaMultipliers.map(roundNumber),
      score: roundNumber(score),
      passed,
      metrics: metricsForHash(metrics)
    })
  );

  return {
    index,
    label,
    sigmaMultipliers: sigmaMultipliers.map(roundNumber),
    score,
    passed,
    metrics,
    perturbations,
    resultHash
  };
}

function evaluateStackMetrics(spec: CoatingSearchSpec, stack: CoatingStackDefinition, options: CoatingStackRunOptions): CoatingCandidateMetrics {
  const samples: CoatingSearchSample[] = [];
  for (const wavelengthM of spec.wavelengthsM) {
    for (const angleRad of spec.anglesRad ?? [spec.baseStack.angleRad]) {
      for (const polarization of spec.polarizations ?? [spec.baseStack.polarization]) {
        samples.push(evaluateSample(stack, wavelengthM, angleRad, polarization, options));
      }
    }
  }
  return summarizeSamples(samples, spec.objective);
}

function evaluateSample(
  stack: CoatingStackDefinition,
  wavelengthM: number,
  angleRad: number,
  polarization: CoatingSearchPolarization,
  options: CoatingStackRunOptions
): CoatingSearchSample {
  const normalized = normalizePolarization(polarization);
  if (normalized === "unpolarized") {
    const te = runCoatingStack({ ...stack, wavelengthM, angleRad, polarization: "TE" }, options);
    const tm = runCoatingStack({ ...stack, wavelengthM, angleRad, polarization: "TM" }, options);
    return {
      wavelengthM,
      angleRad,
      polarization: "unpolarized",
      reflectance: (te.tmm.reflectance + tm.tmm.reflectance) / 2,
      transmittance: (te.tmm.transmittance + tm.tmm.transmittance) / 2,
      absorbance: (te.tmm.absorbance + tm.tmm.absorbance) / 2
    };
  }

  const run = runCoatingStack({ ...stack, wavelengthM, angleRad, polarization: normalized }, options);
  return {
    wavelengthM,
    angleRad,
    polarization: normalized,
    reflectance: run.tmm.reflectance,
    transmittance: run.tmm.transmittance,
    absorbance: run.tmm.absorbance,
    phaseRad: Math.atan2(run.tmm.amplitudeReflection.im, run.tmm.amplitudeReflection.re)
  };
}

function summarizeSamples(samples: CoatingSearchSample[], objective: CoatingSearchObjective): CoatingCandidateMetrics {
  const reflectance = samples.map((sample) => sample.reflectance);
  const transmittance = samples.map((sample) => sample.transmittance);
  const absorbance = samples.map((sample) => sample.absorbance);
  const phaseTerm = objective.terms.find((term) => term.metric === "phaseError");
  const targetPhaseRad = phaseTerm?.targetPhaseRad ?? phaseTerm?.target ?? 0;
  const phaseErrors = samples
    .filter((sample) => sample.phaseRad !== undefined)
    .map((sample) => Math.abs(wrapPhase((sample.phaseRad ?? 0) - targetPhaseRad)));

  return {
    meanReflectance: mean(reflectance),
    maxReflectance: Math.max(...reflectance),
    meanTransmittance: mean(transmittance),
    minTransmittance: Math.min(...transmittance),
    meanAbsorbance: mean(absorbance),
    maxAbsorbance: Math.max(...absorbance),
    meanPhaseError: phaseErrors.length === 0 ? 0 : mean(phaseErrors),
    samples
  };
}

function scoreMetrics(metrics: CoatingCandidateMetrics, objective: CoatingSearchObjective): number {
  let score = 0;
  for (const term of objective.terms) {
    const weight = term.weight ?? 1;
    const value = objectiveMetric(metrics, term.metric);
    if (term.target !== undefined || term.metric === "phaseError") {
      const target = term.metric === "phaseError" ? term.targetPhaseRad ?? term.target ?? 0 : term.target ?? 0;
      const miss = term.metric === "phaseError" ? value : term.direction === "minimize" ? Math.max(0, value - target) : Math.max(0, target - value);
      score += weight * miss * miss;
    } else if (term.direction === "minimize") {
      score += weight * value;
    } else {
      score += weight * (1 - value);
    }
  }
  return score;
}

function objectiveMetric(metrics: CoatingCandidateMetrics, metric: CoatingSearchMetric): number {
  if (metric === "reflectance") return metrics.meanReflectance;
  if (metric === "transmittance") return metrics.meanTransmittance;
  if (metric === "absorbance") return metrics.meanAbsorbance;
  return metrics.meanPhaseError;
}

function summarizeRobustSamples(samples: RobustCoatingSample[]): RobustYieldMetrics {
  const scores = samples.map((sample) => sample.score);
  const reflectance = samples.map((sample) => sample.metrics.meanReflectance);
  const transmittance = samples.map((sample) => sample.metrics.meanTransmittance);
  const absorbance = samples.map((sample) => sample.metrics.meanAbsorbance);
  const passSamples = samples.filter((sample) => sample.passed === true);
  const hasPassThreshold = samples.some((sample) => sample.passed !== undefined);

  return {
    sampleCount: samples.length,
    expectedScore: mean(scores),
    medianScore: percentile(scores, 0.5),
    p90Score: percentile(scores, 0.9),
    worstCaseScore: Math.max(...scores),
    passRate: hasPassThreshold ? passSamples.length / Math.max(1, samples.length) : undefined,
    expectedReflectance: mean(reflectance),
    p90Reflectance: percentile(reflectance, 0.9),
    worstCaseReflectance: Math.max(...reflectance),
    expectedTransmittance: mean(transmittance),
    expectedAbsorbance: mean(absorbance)
  };
}

function scoreRobustMetrics(nominalScore: number, metrics: RobustYieldMetrics, objective: RobustCoatingObjective): number {
  if (objective.primary === "passRate" && metrics.passRate === undefined) {
    throw new Error("robust pass-rate ranking requires a pass threshold");
  }
  const primary = robustMetricValue(metrics, objective.primary);
  const weights = objective.weights ?? {};
  let score = primary;
  if (weights.nominalScore) score += weights.nominalScore * nominalScore;
  if (weights.expectedScore) score += weights.expectedScore * metrics.expectedScore;
  if (weights.p90Score) score += weights.p90Score * metrics.p90Score;
  if (weights.worstCaseScore) score += weights.worstCaseScore * metrics.worstCaseScore;
  if (weights.passRate) score += weights.passRate * (1 - (metrics.passRate ?? 0));
  return score;
}

function robustMetricValue(metrics: RobustYieldMetrics, metric: RobustCoatingSearchPrimaryMetric): number {
  if (metric === "expectedScore") return metrics.expectedScore;
  if (metric === "worstCaseScore") return metrics.worstCaseScore;
  if (metric === "passRate") return 1 - (metrics.passRate ?? 0);
  return metrics.p90Score;
}

function deterministicSigmaVectors(layerCount: number, levels: number[], maxSamples: number): number[][] {
  if (layerCount === 0) return [[]];
  const normalizedLevels = uniqueNumbers(levels).sort((a, b) => Math.abs(a) - Math.abs(b) || a - b);
  const fullCount = normalizedLevels.length ** layerCount;
  if (fullCount <= maxSamples) {
    return cartesianSigmaVectors(layerCount, normalizedLevels).sort(compareSigmaVectors);
  }

  const vectors: number[][] = [Array.from({ length: layerCount }, () => 0)];
  const nonzero = normalizedLevels.filter((level) => level !== 0).sort((a, b) => Math.abs(a) - Math.abs(b) || a - b);
  for (const level of nonzero) {
    vectors.push(Array.from({ length: layerCount }, () => level));
  }
  for (let layerIndex = 0; layerIndex < layerCount; layerIndex += 1) {
    for (const level of nonzero) {
      const vector = Array.from({ length: layerCount }, () => 0);
      vector[layerIndex] = level;
      vectors.push(vector);
    }
  }

  return uniqueSigmaVectors(vectors).sort(compareSigmaVectors).slice(0, maxSamples);
}

function cartesianSigmaVectors(layerCount: number, levels: number[]): number[][] {
  let output: number[][] = [[]];
  for (let index = 0; index < layerCount; index += 1) {
    const next: number[][] = [];
    for (const prefix of output) {
      for (const level of levels) next.push([...prefix, level]);
    }
    output = next;
  }
  return uniqueSigmaVectors(output);
}

function compareSigmaVectors(a: number[], b: number[]): number {
  const aMag = a.reduce((sum, value) => sum + Math.abs(value), 0);
  const bMag = b.reduce((sum, value) => sum + Math.abs(value), 0);
  if (aMag !== bMag) return aMag - bMag;
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const delta = (a[index] ?? 0) - (b[index] ?? 0);
    if (delta !== 0) return delta;
  }
  return 0;
}

function uniqueSigmaVectors(vectors: number[][]): number[][] {
  const seen = new Set<string>();
  const output: number[][] = [];
  for (const vector of vectors) {
    const key = vector.map(roundNumber).join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(vector.map(roundNumber));
  }
  return output;
}

function perturbStack(stack: CoatingStackDefinition, sigmaM: number, sigmaMultipliers: number[]): { stack: CoatingStackDefinition; perturbations: RobustLayerPerturbation[] } {
  const perturbations: RobustLayerPerturbation[] = [];
  const layers = stack.layers.map((layer, index) => {
    const sigmaMultiplier = sigmaMultipliers[index] ?? 0;
    const deltaM = sigmaM * sigmaMultiplier;
    const sampledThicknessM = Math.max(0.1e-9, layer.thicknessM + deltaM);
    perturbations.push({
      layerId: layer.id,
      label: layer.label,
      materialId: layer.materialId,
      nominalThicknessM: layer.thicknessM,
      sigmaMultiplier,
      deltaM,
      sampledThicknessM
    });
    return { ...layer, thicknessM: sampledThicknessM };
  });
  return { stack: { ...stack, layers }, perturbations };
}

function validateRobustSpec(spec: RobustCoatingSearchSpec): void {
  if (!spec.id) throw new Error("robust coating search spec id is required");
  if (!spec.label) throw new Error("robust coating search label is required");
  if (spec.robustObjective.primary === "passRate" && spec.robustObjective.passThreshold === undefined) {
    throw new Error("robust pass-rate ranking requires a pass threshold");
  }
  normalizeThicknessModel(spec.uncertainty.thickness);
}

function normalizeThicknessModel(model: RobustThicknessUncertainty): NormalizedThicknessModel {
  if (model.mode !== "deterministic-grid") throw new Error("robust coating search only supports deterministic-grid thickness uncertainty in L5.6");
  const sigmaNm = clamp(model.sigmaNm, 0, 1000);
  if (!Number.isFinite(sigmaNm)) throw new Error("robust thickness sigma must be finite");
  const sigmaLevels = uniqueNumbers(model.sigmaLevels ?? [-2, 0, 2]);
  if (sigmaLevels.length === 0) throw new Error("robust sigma levels must include at least one value");
  if (!sigmaLevels.includes(0)) sigmaLevels.push(0);
  const maxSamplesPerCandidate = clampInteger(model.maxSamplesPerCandidate ?? 81, 1, 1000);
  return {
    mode: "deterministic-grid",
    sigmaNm,
    sigmaLevels: sigmaLevels.sort((a, b) => a - b),
    maxSamplesPerCandidate
  };
}

function compareWorkingCandidates(a: WorkingRobustCandidate, b: WorkingRobustCandidate): number {
  if (a.robustScore !== b.robustScore) return a.robustScore - b.robustScore;
  if (a.nominal.score !== b.nominal.score) return a.nominal.score - b.nominal.score;
  return a.resultHash.localeCompare(b.resultHash);
}

function normalizePolarization(polarization: CoatingSearchPolarization): MaxwellPolarization | "unpolarized" {
  if (polarization === "s") return "TE";
  if (polarization === "p") return "TM";
  return polarization;
}

function cloneSpec(spec: RobustCoatingSearchSpec): RobustCoatingSearchSpec {
  return {
    ...spec,
    nominalSearch: {
      ...spec.nominalSearch,
      baseStack: cloneStack(spec.nominalSearch.baseStack),
      wavelengthsM: [...spec.nominalSearch.wavelengthsM],
      anglesRad: spec.nominalSearch.anglesRad ? [...spec.nominalSearch.anglesRad] : undefined,
      polarizations: spec.nominalSearch.polarizations ? [...spec.nominalSearch.polarizations] : undefined,
      candidateMaterialIds: [...spec.nominalSearch.candidateMaterialIds],
      layerCount: { ...spec.nominalSearch.layerCount },
      thicknessM: { ...spec.nominalSearch.thicknessM },
      constraints: spec.nominalSearch.constraints ? { ...spec.nominalSearch.constraints } : undefined,
      objective: { terms: spec.nominalSearch.objective.terms.map((term) => ({ ...term })) },
      search: spec.nominalSearch.search ? { ...spec.nominalSearch.search } : undefined
    },
    uncertainty: {
      thickness: {
        ...spec.uncertainty.thickness,
        sigmaLevels: spec.uncertainty.thickness.sigmaLevels ? [...spec.uncertainty.thickness.sigmaLevels] : undefined
      }
    },
    robustObjective: {
      ...spec.robustObjective,
      weights: spec.robustObjective.weights ? { ...spec.robustObjective.weights } : undefined
    }
  };
}

function specForHash(spec: RobustCoatingSearchSpec, thickness: NormalizedThicknessModel): unknown {
  return {
    ...cloneSpec(spec),
    uncertainty: { thickness },
    robustObjective: { ...spec.robustObjective, weights: spec.robustObjective.weights ? { ...spec.robustObjective.weights } : undefined }
  };
}

function cloneStack(stack: CoatingStackDefinition): CoatingStackDefinition {
  return {
    ...stack,
    layers: stack.layers.map((layer) => ({ ...layer }))
  };
}

function cloneMetrics(metrics: CoatingCandidateMetrics): CoatingCandidateMetrics {
  return {
    ...metrics,
    samples: metrics.samples.map((sample) => ({ ...sample }))
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
      label: layer.label,
      materialId: layer.materialId,
      thicknessM: roundNumber(layer.thicknessM)
    }))
  };
}

function metricsForHash(metrics: CoatingCandidateMetrics): unknown {
  return {
    meanReflectance: roundNumber(metrics.meanReflectance),
    maxReflectance: roundNumber(metrics.maxReflectance),
    meanTransmittance: roundNumber(metrics.meanTransmittance),
    minTransmittance: roundNumber(metrics.minTransmittance),
    meanAbsorbance: roundNumber(metrics.meanAbsorbance),
    maxAbsorbance: roundNumber(metrics.maxAbsorbance),
    meanPhaseError: roundNumber(metrics.meanPhaseError)
  };
}

function roundYieldMetrics(metrics: RobustYieldMetrics): RobustYieldMetrics {
  return {
    sampleCount: metrics.sampleCount,
    expectedScore: roundNumber(metrics.expectedScore),
    medianScore: roundNumber(metrics.medianScore),
    p90Score: roundNumber(metrics.p90Score),
    worstCaseScore: roundNumber(metrics.worstCaseScore),
    passRate: metrics.passRate === undefined ? undefined : roundNumber(metrics.passRate),
    expectedReflectance: roundNumber(metrics.expectedReflectance),
    p90Reflectance: roundNumber(metrics.p90Reflectance),
    worstCaseReflectance: roundNumber(metrics.worstCaseReflectance),
    expectedTransmittance: roundNumber(metrics.expectedTransmittance),
    expectedAbsorbance: roundNumber(metrics.expectedAbsorbance)
  };
}

function robustSearchProvenance(): RobustCoatingSearchResult["provenance"] {
  return {
    label: "L5.6 deterministic planar coating robust-yield search",
    limitations: [
      "Runs L5.5 nominal material/order/thickness search first, then re-ranks selected candidates under deterministic thickness perturbations.",
      "Perturbs scalar coating thicknesses only and re-solves each sample through the planar Maxwell TMM coating-stack path.",
      "Imported and built-in material n/k records are fixed in L5.6; material source uncertainty is recorded but not sampled.",
      "Deterministic robust metrics are workbench estimates, not certified manufacturing yield or full VVUQ.",
      "This is not correlated drift modeling, material n/k perturbation, Monte Carlo confidence intervals, 3D FEM/BEM/RCWA/FDTD, digital-twin calibration, or sensor electrical transport."
    ]
  };
}

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const index = clampInteger(Math.ceil(p * sorted.length) - 1, 0, sorted.length - 1);
  return sorted[index]!;
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function wrapPhase(value: number): number {
  let output = value;
  while (output > Math.PI) output -= 2 * Math.PI;
  while (output < -Math.PI) output += 2 * Math.PI;
  return output;
}

function uniqueNumbers(values: number[]): number[] {
  const seen = new Set<string>();
  const output: number[] = [];
  for (const value of values) {
    if (!Number.isFinite(value)) throw new Error("robust sigma levels must be finite");
    const rounded = roundNumber(value);
    const key = `${rounded}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(rounded);
  }
  return output;
}

function formatMultiplier(value: number): string {
  if (Number.isInteger(value)) return value.toFixed(0);
  return value.toFixed(2);
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
