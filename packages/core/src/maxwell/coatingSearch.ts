import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import { runCoatingStack, type CoatingStackDefinition, type CoatingStackRunOptions } from "./coatingStack";
import { getCatalogMaterial, materialCatalogReferencesForIds, type MaterialCatalogReference, type MaxwellMaterialCatalog } from "./materialCatalog";
import type { MaxwellPolarization } from "./planarTmm";

export type CoatingSearchMetric = "reflectance" | "transmittance" | "absorbance" | "phaseError";
export type CoatingSearchDirection = "minimize" | "maximize";
export type CoatingSearchPolarization = MaxwellPolarization | "s" | "p" | "unpolarized";
export type CoatingSearchMode = "beam" | "exhaustive" | "random-seeded" | "coordinate-refine";

export type CoatingSearchObjectiveTerm = {
  metric: CoatingSearchMetric;
  direction: CoatingSearchDirection;
  weight?: number;
  target?: number;
  targetPhaseRad?: number;
};

export type CoatingSearchObjective = {
  terms: CoatingSearchObjectiveTerm[];
};

export type CoatingSearchSpec = {
  id: string;
  label: string;
  baseStack: CoatingStackDefinition;
  wavelengthsM: number[];
  anglesRad?: number[];
  polarizations?: CoatingSearchPolarization[];
  candidateMaterialIds: string[];
  layerCount: {
    min: number;
    max: number;
  };
  thicknessM: {
    min: number;
    max: number;
    step?: number;
  };
  constraints?: {
    maxTotalThicknessM?: number;
    disallowAdjacentSameMaterial?: boolean;
    requireFirstMaterialId?: string;
    requireLastMaterialId?: string;
    maxAbsorbance?: number;
  };
  objective: CoatingSearchObjective;
  search?: {
    mode?: CoatingSearchMode;
    maxCandidates?: number;
    beamWidth?: number;
    refinementPasses?: number;
    seed?: number;
  };
};

export type CoatingSearchSample = {
  wavelengthM: number;
  angleRad: number;
  polarization: "TE" | "TM" | "unpolarized";
  reflectance: number;
  transmittance: number;
  absorbance: number;
  phaseRad?: number;
};

export type CoatingCandidateMetrics = {
  meanReflectance: number;
  maxReflectance: number;
  meanTransmittance: number;
  minTransmittance: number;
  meanAbsorbance: number;
  maxAbsorbance: number;
  meanPhaseError: number;
  samples: CoatingSearchSample[];
};

export type CoatingSearchCandidateLayer = {
  materialId: string;
  label: string;
  thicknessM: number;
};

export type CoatingSearchCandidate = {
  id: string;
  rank: number;
  score: number;
  stack: CoatingStackDefinition;
  layers: CoatingSearchCandidateLayer[];
  metrics: CoatingCandidateMetrics;
  materialCatalogRefs: MaterialCatalogReference[];
  warnings: SolverWarning[];
  resultHash: string;
};

export type CoatingSearchResult = {
  id: string;
  type: "maxwellCoatingMaterialOrderSearch";
  analysisId: "analysis.maxwell.l5.phase5.coatingMaterialOrderSearch";
  label: string;
  spec: CoatingSearchSpec;
  best: CoatingSearchCandidate;
  candidates: CoatingSearchCandidate[];
  evaluationCount: number;
  rejectedCount: number;
  warnings: SolverWarning[];
  resultHash: string;
  provenance: {
    label: "L5.5 deterministic planar coating material/order/thickness search";
    limitations: string[];
  };
};

type WorkingCandidate = Omit<CoatingSearchCandidate, "rank">;

type SearchSettings = Required<NonNullable<CoatingSearchSpec["search"]>>;

export function runCoatingSearch(spec: CoatingSearchSpec, options: CoatingStackRunOptions = {}): CoatingSearchResult {
  const catalog = options.materialCatalog;
  validateSearchSpec(spec, catalog);
  const settings = normalizeSettings(spec.search);
  const thicknessValues = thicknessGrid(spec.thicknessM.min, spec.thicknessM.max, spec.thicknessM.step);
  const warnings: SolverWarning[] = [
    {
      code: "maxwell.coatingSearch.planarTmmOnly",
      message:
        "L5.5 coating search proposes planar material/order/thickness candidates and evaluates them through the existing Maxwell TMM path; this is not topology optimization, robust-yield optimization, 3D FEM/BEM/RCWA/FDTD, digital-twin calibration, or manufacturing certification."
    }
  ];
  if (settings.mode !== "beam") {
    warnings.push({
      code: "maxwell.coatingSearch.modeMappedToBeam",
      message: `Search mode '${settings.mode}' is mapped to deterministic beam search in L5.5.`
    });
  }

  let evaluationCount = 0;
  let rejectedCount = 0;
  const candidateCache = new Map<string, WorkingCandidate | null>();
  const ranked = new Map<string, WorkingCandidate>();
  let beam: WorkingCandidate[] = [emptyCandidate(spec)];

  const evaluate = (stack: CoatingStackDefinition): WorkingCandidate | null => {
    const key = stackKey(stack);
    if (candidateCache.has(key)) return candidateCache.get(key) ?? null;
    evaluationCount += 1;
    const candidate = evaluateSearchStack(spec, stack, options);
    if (!candidate) rejectedCount += 1;
    candidateCache.set(key, candidate);
    return candidate;
  };

  for (let depth = 1; depth <= spec.layerCount.max; depth += 1) {
    const extensions: WorkingCandidate[] = [];
    for (const prefix of beam) {
      for (const materialId of spec.candidateMaterialIds) {
        if (!canAppendMaterial(prefix.stack.layers.map((layer) => layer.materialId), materialId, depth, spec)) continue;
        let bestForAppend: WorkingCandidate | null = null;
        for (const thicknessM of thicknessValues) {
          const stack = appendLayer(spec, prefix.stack, materialId, thicknessM, catalog);
          if (!candidatePassesStaticConstraints(stack, spec)) {
            rejectedCount += 1;
            continue;
          }
          const candidate = evaluate(stack);
          if (!candidate) continue;
          if (!bestForAppend || candidate.score < bestForAppend.score) bestForAppend = candidate;
        }
        if (bestForAppend) extensions.push(bestForAppend);
      }
    }

    beam = dedupeCandidates(extensions)
      .sort(compareCandidates)
      .slice(0, settings.beamWidth);

    if (depth >= spec.layerCount.min) {
      for (const candidate of beam) {
        if (!candidatePassesFinalConstraints(candidate.stack, spec)) continue;
        ranked.set(stackKey(candidate.stack), candidate);
      }
    }
  }

  const refined = [...ranked.values()]
    .sort(compareCandidates)
    .slice(0, Math.max(settings.beamWidth, settings.maxCandidates))
    .map((candidate) => refineCandidate(spec, candidate, thicknessValues, evaluate, settings.refinementPasses))
    .filter((candidate): candidate is WorkingCandidate => candidate !== null);

  for (const candidate of refined) {
    if (candidatePassesFinalConstraints(candidate.stack, spec)) {
      ranked.set(stackKey(candidate.stack), candidate);
    }
  }

  const candidates = dedupeCandidates([...ranked.values()])
    .sort(compareCandidates)
    .slice(0, settings.maxCandidates)
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }));

  if (candidates.length === 0) throw new Error("coating search produced no valid candidates; relax material, thickness, layer-count, or wavelength constraints");

  const resultHash = fnv1a64(
    stableStringify({
      analysisId: "analysis.maxwell.l5.phase5.coatingMaterialOrderSearch",
      spec: specForHash(spec),
      catalogHash: options.materialCatalog?.resultHash,
      candidates: candidates.map((candidate) => ({
        rank: candidate.rank,
        score: roundNumber(candidate.score),
        stack: stackForHash(candidate.stack),
        metrics: metricsForHash(candidate.metrics),
        resultHash: candidate.resultHash
      })),
      evaluationCount,
      rejectedCount,
      warningCodes: warnings.map((warning) => warning.code)
    })
  );

  return {
    id: spec.id,
    type: "maxwellCoatingMaterialOrderSearch",
    analysisId: "analysis.maxwell.l5.phase5.coatingMaterialOrderSearch",
    label: spec.label,
    spec: cloneSpec(spec),
    best: candidates[0]!,
    candidates,
    evaluationCount,
    rejectedCount,
    warnings: uniqueWarnings([...warnings, ...candidates.flatMap((candidate) => candidate.warnings)]),
    resultHash,
    provenance: coatingSearchProvenance()
  };
}

export function applyCoatingSearchCandidate(baseStack: CoatingStackDefinition, candidate: CoatingSearchCandidate): CoatingStackDefinition {
  return {
    ...baseStack,
    layers: candidate.stack.layers.map((layer) => ({ ...layer }))
  };
}

function evaluateSearchStack(spec: CoatingSearchSpec, stack: CoatingStackDefinition, options: CoatingStackRunOptions): WorkingCandidate | null {
  const samples: CoatingSearchSample[] = [];
  const warnings: SolverWarning[] = [];
  for (const wavelengthM of spec.wavelengthsM) {
    for (const angleRad of spec.anglesRad ?? [spec.baseStack.angleRad]) {
      for (const polarization of spec.polarizations ?? [spec.baseStack.polarization]) {
        const sample = evaluateSample(stack, wavelengthM, angleRad, polarization, options);
        warnings.push(...sample.warnings);
        samples.push(sample.sample);
      }
    }
  }
  const metrics = summarizeSamples(samples, spec.objective);
  if (spec.constraints?.maxAbsorbance !== undefined && metrics.maxAbsorbance > spec.constraints.maxAbsorbance) return null;
  const score = scoreMetrics(metrics, spec.objective);
  const run = runCoatingStack(stack, options);
  const resultHash = fnv1a64(
    stableStringify({
      analysisId: "analysis.maxwell.l5.phase5.coatingSearch.candidate",
      stack: stackForHash(stack),
      score: roundNumber(score),
      metrics: metricsForHash(metrics),
      materialCatalogRefs: run.materialCatalogRefs,
      runHash: run.resultHash
    })
  );

  return {
    id: resultHash,
    score,
    stack: cloneStack(stack),
    layers: stack.layers.map((layer) => ({
      materialId: layer.materialId,
      label: layer.label,
      thicknessM: layer.thicknessM
    })),
    metrics,
    materialCatalogRefs: run.materialCatalogRefs,
    warnings: uniqueWarnings([...warnings, ...run.warnings]),
    resultHash
  };
}

function evaluateSample(
  stack: CoatingStackDefinition,
  wavelengthM: number,
  angleRad: number,
  polarization: CoatingSearchPolarization,
  options: CoatingStackRunOptions
): { sample: CoatingSearchSample; warnings: SolverWarning[] } {
  const normalized = normalizePolarization(polarization);
  if (normalized === "unpolarized") {
    const te = runCoatingStack({ ...stack, wavelengthM, angleRad, polarization: "TE" }, options);
    const tm = runCoatingStack({ ...stack, wavelengthM, angleRad, polarization: "TM" }, options);
    return {
      sample: {
        wavelengthM,
        angleRad,
        polarization: "unpolarized",
        reflectance: (te.tmm.reflectance + tm.tmm.reflectance) / 2,
        transmittance: (te.tmm.transmittance + tm.tmm.transmittance) / 2,
        absorbance: (te.tmm.absorbance + tm.tmm.absorbance) / 2
      },
      warnings: uniqueWarnings([...te.warnings, ...tm.warnings])
    };
  }

  const run = runCoatingStack({ ...stack, wavelengthM, angleRad, polarization: normalized }, options);
  return {
    sample: {
      wavelengthM,
      angleRad,
      polarization: normalized,
      reflectance: run.tmm.reflectance,
      transmittance: run.tmm.transmittance,
      absorbance: run.tmm.absorbance,
      phaseRad: Math.atan2(run.tmm.amplitudeReflection.im, run.tmm.amplitudeReflection.re)
    },
    warnings: run.warnings
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

function refineCandidate(
  spec: CoatingSearchSpec,
  seed: WorkingCandidate,
  thicknessValues: number[],
  evaluate: (stack: CoatingStackDefinition) => WorkingCandidate | null,
  passes: number
): WorkingCandidate | null {
  let best: WorkingCandidate | null = seed;
  const firstThickness = thicknessValues[0] ?? spec.thicknessM.min;
  const coarseStep = Math.max(1e-12, thicknessValues[1] === undefined ? spec.thicknessM.step ?? 10e-9 : thicknessValues[1] - firstThickness);
  for (let pass = 0; pass < passes; pass += 1) {
    const step = coarseStep / 2 ** (pass + 1);
    for (let layerIndex = 0; layerIndex < (best?.stack.layers.length ?? 0); layerIndex += 1) {
      const current = best!.stack.layers[layerIndex]!.thicknessM;
      for (const thicknessM of [current - step, current, current + step]) {
        const boundedThicknessM = clamp(thicknessM, spec.thicknessM.min, spec.thicknessM.max);
        const stack = setLayerThickness(best!.stack, layerIndex, boundedThicknessM);
        if (!candidatePassesStaticConstraints(stack, spec)) continue;
        const candidate = evaluate(stack);
        if (candidate && candidatePassesFinalConstraints(candidate.stack, spec) && candidate.score < best!.score) best = candidate;
      }
    }
  }
  return best;
}

function appendLayer(
  spec: CoatingSearchSpec,
  stack: CoatingStackDefinition,
  materialId: string,
  thicknessM: number,
  catalog?: MaxwellMaterialCatalog
): CoatingStackDefinition {
  const material = catalog ? getCatalogMaterial(materialId, catalog) : undefined;
  const layerIndex = stack.layers.length + 1;
  return {
    ...stack,
    id: `${spec.id}-candidate`,
    label: `${spec.label} candidate`,
    layers: [
      ...stack.layers.map((layer) => ({ ...layer })),
      {
        id: `search-layer-${layerIndex}`,
        label: material?.label ?? materialId,
        materialId,
        thicknessM
      }
    ]
  };
}

function emptyCandidate(spec: CoatingSearchSpec): WorkingCandidate {
  const stack = {
    ...spec.baseStack,
    id: `${spec.id}-candidate`,
    label: `${spec.label} candidate`,
    layers: []
  };
  return {
    id: "empty",
    score: Number.POSITIVE_INFINITY,
    stack,
    layers: [],
    metrics: emptyMetrics(),
    materialCatalogRefs: [],
    warnings: [],
    resultHash: "empty"
  };
}

function validateSearchSpec(spec: CoatingSearchSpec, catalog?: MaxwellMaterialCatalog): void {
  if (!spec.id) throw new Error("coating search spec id is required");
  if (spec.wavelengthsM.length === 0) throw new Error("coating search requires at least one wavelength");
  for (const wavelengthM of spec.wavelengthsM) {
    if (wavelengthM <= 0 || !Number.isFinite(wavelengthM)) throw new Error("coating search wavelengths must be positive");
  }
  for (const angleRad of spec.anglesRad ?? [spec.baseStack.angleRad]) {
    if (!Number.isFinite(angleRad) || Math.abs(angleRad) >= Math.PI / 2) throw new Error("coating search angles must be finite and below grazing incidence");
  }
  if (spec.candidateMaterialIds.length === 0) throw new Error("coating search requires at least one candidate material");
  if (catalog) {
    materialCatalogReferencesForIds([spec.baseStack.incidentMaterialId, spec.baseStack.substrateMaterialId, ...spec.candidateMaterialIds], catalog);
  }
  if (spec.layerCount.min < 0 || spec.layerCount.max < spec.layerCount.min || !Number.isInteger(spec.layerCount.min) || !Number.isInteger(spec.layerCount.max)) {
    throw new Error("coating search layer count bounds must be non-negative integers with max >= min");
  }
  if (spec.thicknessM.min <= 0 || spec.thicknessM.max < spec.thicknessM.min) throw new Error("coating search thickness bounds must be positive with max >= min");
  if ((spec.thicknessM.step ?? 1e-9) <= 0) throw new Error("coating search thickness step must be positive");
  if (spec.objective.terms.length === 0) throw new Error("coating search objective requires at least one term");
}

function normalizeSettings(search: CoatingSearchSpec["search"]): SearchSettings {
  return {
    mode: search?.mode ?? "beam",
    maxCandidates: clampInteger(search?.maxCandidates ?? 6, 1, 24),
    beamWidth: clampInteger(search?.beamWidth ?? 8, 1, 64),
    refinementPasses: clampInteger(search?.refinementPasses ?? 2, 0, 5),
    seed: search?.seed ?? 0
  };
}

function thicknessGrid(minM: number, maxM: number, stepM = 25e-9): number[] {
  const values: number[] = [];
  const count = Math.max(1, Math.floor((maxM - minM) / stepM) + 1);
  for (let i = 0; i < count; i += 1) {
    values.push(roundNumber(Math.min(maxM, minM + i * stepM)));
  }
  if (values[values.length - 1] !== maxM) values.push(maxM);
  return values;
}

function canAppendMaterial(prefix: string[], materialId: string, depth: number, spec: CoatingSearchSpec): boolean {
  if (spec.constraints?.disallowAdjacentSameMaterial && prefix[prefix.length - 1] === materialId) return false;
  if (depth === 1 && spec.constraints?.requireFirstMaterialId && materialId !== spec.constraints.requireFirstMaterialId) return false;
  return true;
}

function candidatePassesStaticConstraints(stack: CoatingStackDefinition, spec: CoatingSearchSpec): boolean {
  const totalThicknessM = stack.layers.reduce((sum, layer) => sum + layer.thicknessM, 0);
  if (spec.constraints?.maxTotalThicknessM !== undefined && totalThicknessM > spec.constraints.maxTotalThicknessM) return false;
  for (const layer of stack.layers) {
    if (layer.thicknessM < spec.thicknessM.min || layer.thicknessM > spec.thicknessM.max) return false;
  }
  return true;
}

function candidatePassesFinalConstraints(stack: CoatingStackDefinition, spec: CoatingSearchSpec): boolean {
  if (stack.layers.length < spec.layerCount.min || stack.layers.length > spec.layerCount.max) return false;
  const lastMaterialId = stack.layers[stack.layers.length - 1]?.materialId;
  if (spec.constraints?.requireLastMaterialId && lastMaterialId !== spec.constraints.requireLastMaterialId) return false;
  return candidatePassesStaticConstraints(stack, spec);
}

function setLayerThickness(stack: CoatingStackDefinition, layerIndex: number, thicknessM: number): CoatingStackDefinition {
  return {
    ...stack,
    layers: stack.layers.map((layer, index) => (index === layerIndex ? { ...layer, thicknessM } : { ...layer }))
  };
}

function normalizePolarization(polarization: CoatingSearchPolarization): MaxwellPolarization | "unpolarized" {
  if (polarization === "s") return "TE";
  if (polarization === "p") return "TM";
  return polarization;
}

function compareCandidates(a: WorkingCandidate, b: WorkingCandidate): number {
  if (a.score !== b.score) return a.score - b.score;
  return stackKey(a.stack).localeCompare(stackKey(b.stack));
}

function dedupeCandidates(candidates: WorkingCandidate[]): WorkingCandidate[] {
  const seen = new Map<string, WorkingCandidate>();
  for (const candidate of candidates) {
    const key = stackKey(candidate.stack);
    const existing = seen.get(key);
    if (!existing || candidate.score < existing.score) seen.set(key, candidate);
  }
  return [...seen.values()];
}

function stackKey(stack: CoatingStackDefinition): string {
  return stableStringify(stackForHash(stack));
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

function specForHash(spec: CoatingSearchSpec): unknown {
  return {
    ...cloneSpec(spec),
    baseStack: stackForHash(spec.baseStack),
    wavelengthsM: spec.wavelengthsM.map(roundNumber),
    anglesRad: (spec.anglesRad ?? [spec.baseStack.angleRad]).map(roundNumber)
  };
}

function cloneSpec(spec: CoatingSearchSpec): CoatingSearchSpec {
  return {
    ...spec,
    baseStack: cloneStack(spec.baseStack),
    wavelengthsM: [...spec.wavelengthsM],
    anglesRad: spec.anglesRad ? [...spec.anglesRad] : undefined,
    polarizations: spec.polarizations ? [...spec.polarizations] : undefined,
    candidateMaterialIds: [...spec.candidateMaterialIds],
    layerCount: { ...spec.layerCount },
    thicknessM: { ...spec.thicknessM },
    constraints: spec.constraints ? { ...spec.constraints } : undefined,
    objective: { terms: spec.objective.terms.map((term) => ({ ...term })) },
    search: spec.search ? { ...spec.search } : undefined
  };
}

function cloneStack(stack: CoatingStackDefinition): CoatingStackDefinition {
  return {
    ...stack,
    layers: stack.layers.map((layer) => ({ ...layer }))
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
    meanPhaseError: roundNumber(metrics.meanPhaseError),
    samples: metrics.samples.map((sample) => ({
      wavelengthM: roundNumber(sample.wavelengthM),
      angleRad: roundNumber(sample.angleRad),
      polarization: sample.polarization,
      reflectance: roundNumber(sample.reflectance),
      transmittance: roundNumber(sample.transmittance),
      absorbance: roundNumber(sample.absorbance),
      phaseRad: sample.phaseRad === undefined ? undefined : roundNumber(sample.phaseRad)
    }))
  };
}

function emptyMetrics(): CoatingCandidateMetrics {
  return {
    meanReflectance: 0,
    maxReflectance: 0,
    meanTransmittance: 0,
    minTransmittance: 0,
    meanAbsorbance: 0,
    maxAbsorbance: 0,
    meanPhaseError: 0,
    samples: []
  };
}

function coatingSearchProvenance(): CoatingSearchResult["provenance"] {
  return {
    label: "L5.5 deterministic planar coating material/order/thickness search",
    limitations: [
      "Searches discrete material IDs and scalar layer thicknesses only.",
      "Every candidate is evaluated through the existing planar Maxwell TMM coating-stack path.",
      "This is not robust-yield optimization, drift/correlation modeling, adjoint optimization, topology optimization, 3D FEM/BEM/RCWA/FDTD, digital-twin calibration, or manufacturing certification.",
      "Search quality depends on the selected candidate material catalog, wavelength range, layer-count bounds, and thickness grid."
    ]
  };
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
