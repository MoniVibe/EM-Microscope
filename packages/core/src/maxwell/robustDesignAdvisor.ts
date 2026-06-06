import { createOpticalBenchBundle } from "../fdtd/fdtdMultiElementBench";
import { mulberry32 } from "../math/rng";
import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import { defaultOpticalBenchScenario } from "./multiElementBench";
import { orderedSimulationBuilderElements, type SimulationBuilderElement, type SimulationBuilderScenario } from "./simulationBuilder";
import {
  createExampleToleranceFdtdSweepSummary,
  createToleranceFdtdSweepManifest,
  defaultToleranceMetrics,
  defaultToleranceThresholds,
  defaultToleranceVariationSpecs,
  metricLabel,
  runToleranceAnalysis,
  toleranceVariationHash,
  type ToleranceAnalysisReport,
  type ToleranceFdtdSweepManifest,
  type ToleranceFdtdSweepSummary,
  type ToleranceMetricKey,
  type ToleranceRunResult,
  type ToleranceRunStatus,
  type ToleranceSensitivityRow,
  type ToleranceThreshold,
  type ToleranceVariationProperty,
  type ToleranceVariationSpec
} from "./processToleranceRunner";

export type RobustDesignActionKind = "nominal-recenter" | "tolerance-tighten" | "tolerance-relax" | "robust-grid";
export type RobustDesignRankingMode = "worst-case" | "p90" | "pass-rate" | "expected" | "improvement-per-cost" | "weighted";
export type RobustDesignConfidence = "high" | "medium" | "low";
export type RobustDesignBudgetAction = "tighten" | "relax" | "keep" | "locked";

export type RobustDesignVariablePermission = {
  specId: string;
  locked?: boolean;
  allowNominalMove?: boolean;
  allowTighten?: boolean;
  allowRelax?: boolean;
  minDelta?: number;
  maxDelta?: number;
  minNominal?: number;
  maxNominal?: number;
  costWeight?: number;
};

export type RobustDesignAdvisorInput = {
  baselineReport?: ToleranceAnalysisReport | null;
  variations?: ToleranceVariationSpec[];
  thresholds?: ToleranceThreshold[];
  selectedMetrics?: ToleranceMetricKey[];
  permissions?: RobustDesignVariablePermission[];
  rankingMode?: RobustDesignRankingMode;
  candidateLimit?: number;
  gridMaxRuns?: number;
  seed?: number;
  label?: string;
};

export type RobustDesignRecommendation = {
  id: string;
  actionKind: RobustDesignActionKind;
  label: string;
  specId: string;
  target: string;
  metric: ToleranceMetricKey;
  why: string;
  expectedImprovement: number;
  improvementPerCost: number;
  costScore: number;
  confidence: RobustDesignConfidence;
  tradeoff: string;
  evidence: string;
  candidateId?: string;
  locked?: boolean;
};

export type RobustDesignToleranceBudgetRow = {
  specId: string;
  label: string;
  property: ToleranceVariationProperty;
  currentDelta: number;
  recommendedDelta: number;
  minDelta: number;
  maxDelta: number;
  costWeight: number;
  sensitivityScore: number;
  action: RobustDesignBudgetAction;
  reason: string;
};

export type RobustDesignCandidateComparison = {
  baselineNominalScore: number;
  candidateNominalScore: number;
  baselineWorstCaseScore: number;
  candidateWorstCaseScore: number;
  baselineP90Score: number;
  candidateP90Score: number;
  baselineExpectedScore: number;
  candidateExpectedScore: number;
  baselinePassRate: number;
  candidatePassRate: number;
  passRateDelta: number;
  worstCaseImprovement: number;
  p90Improvement: number;
  expectedImprovement: number;
  failingCaseReduction: number;
  improvementPerCost: number;
  topFailureBefore: string;
  topFailureAfter: string;
};

export type RobustDesignCandidate = {
  id: string;
  label: string;
  actionKind: RobustDesignActionKind;
  scenario: SimulationBuilderScenario;
  variations: ToleranceVariationSpec[];
  thresholds: ToleranceThreshold[];
  report: ToleranceAnalysisReport;
  costScore: number;
  comparison: RobustDesignCandidateComparison;
  candidateHash: string;
  warnings: SolverWarning[];
};

export type RobustDesignAdvisorReport = {
  schema: "emmicro.l87.robustDesignAdvisor.v1";
  label: string;
  baselineSceneHash: string;
  baselineVariationHash: string;
  baselineRunHash: string;
  baselineToleranceReport: ToleranceAnalysisReport;
  baselineEvaluation: ToleranceAnalysisReport;
  rankingMode: RobustDesignRankingMode;
  recommendations: RobustDesignRecommendation[];
  toleranceBudget: RobustDesignToleranceBudgetRow[];
  candidates: RobustDesignCandidate[];
  bestCandidate: RobustDesignCandidate | null;
  warnings: SolverWarning[];
  boundary: string[];
  exports: string[];
  reportHash: string;
};

export type RobustFdtdCandidateSweepManifest = {
  schema: "emmicro.l87.fdtdCandidateSweepManifest.v1";
  label: string;
  baselineSceneHash: string;
  baselineVariationHash: string;
  candidateCount: number;
  candidates: Array<{
    candidateId: string;
    candidateHash: string;
    sceneHash: string;
    variationHash: string;
    toleranceSweepManifestHash: string;
    caseCount: number;
    manifestFilename: string;
  }>;
  boundary: string[];
  manifestHash: string;
};

export type RobustFdtdCandidateSweepSummary = {
  schema: "emmicro.l87.fdtdCandidateSweepSummary.v1";
  baselineSceneHash: string;
  baselineVariationHash: string;
  sweepManifestHash: string;
  results: Array<{
    candidateId: string;
    candidateHash: string;
    toleranceSweepManifestHash: string;
    passRows: number;
    warningRows: number;
    failRows: number;
    residualP90: number;
    energyBalanceP90: number;
    status: ToleranceRunStatus;
  }>;
  summaryHash: string;
};

export const l87RobustDesignBoundary = [
  "L8.7 turns L8.6 tolerance/sensitivity results into deterministic diagnostic robust-design guidance.",
  "Recommendations may suggest recentering, tolerance tightening, tolerance relaxation, or a small robust-grid candidate comparison, but nothing is auto-applied without explicit user action.",
  "Cost-weighted rankings are engineering heuristics over existing scalar/external evidence receipts, not certified optical tolerancing.",
  "External FDTD candidate sweeps are exported/imported as manifests and summaries only; production FDTD execution stays outside the browser.",
  "No automatic final design approval, full inverse design, in-browser FDTD, arbitrary 3D Maxwell/CAD solve, FEM/BEM/RCWA execution, production EM solver, digital twin, or manufacturing certification is implemented."
] as const;

export function runRobustDesignAdvisor(scenario: SimulationBuilderScenario = defaultOpticalBenchScenario(), input: RobustDesignAdvisorInput = {}): RobustDesignAdvisorReport {
  const variations = cloneVariations(input.variations ?? input.baselineReport?.variations ?? defaultToleranceVariationSpecs(scenario));
  const thresholds = cloneThresholds(input.thresholds ?? input.baselineReport?.thresholds ?? defaultToleranceThresholds());
  const selectedMetrics = [...(input.selectedMetrics ?? input.baselineReport?.selectedMetrics ?? defaultToleranceMetrics)];
  const gridMaxRuns = input.gridMaxRuns ?? 12;
  const baselineToleranceReport = input.baselineReport ?? runToleranceAnalysis(scenario, { variations, thresholds, selectedMetrics, mode: "one-at-a-time", gridMaxRuns });
  const baselineEvaluation = baselineToleranceReport.mode === "deterministic-grid"
    ? baselineToleranceReport
    : runToleranceAnalysis(scenario, { variations, thresholds, selectedMetrics, mode: "deterministic-grid", gridMaxRuns });
  const baselineSensitivityReport = baselineToleranceReport.sensitivity.length > 0
    ? baselineToleranceReport
    : runToleranceAnalysis(scenario, { variations, thresholds, selectedMetrics, mode: "one-at-a-time", gridMaxRuns });
  const permissions = normalizePermissions(variations, input.permissions ?? []);
  const toleranceBudget = createToleranceBudget(baselineSensitivityReport, variations, permissions);
  const candidateDrafts = createCandidateDrafts(scenario, baselineSensitivityReport, variations, thresholds, selectedMetrics, permissions, toleranceBudget, input.seed ?? 870);
  const baselineScores = scoreReport(baselineEvaluation, selectedMetrics, thresholds);
  const candidates = candidateDrafts.slice(0, input.candidateLimit ?? 6).map((draft, index) => evaluateCandidateDraft(draft, index, baselineEvaluation, baselineScores, selectedMetrics, thresholds, gridMaxRuns));
  const rankedCandidates = rankCandidates(candidates, input.rankingMode ?? "weighted");
  const recommendations = createRecommendations(baselineSensitivityReport, toleranceBudget, rankedCandidates, permissions);
  const bestCandidate = rankedCandidates[0] ?? null;
  const warnings = uniqueWarnings([
    ...baselineToleranceReport.warnings,
    ...baselineEvaluation.warnings,
    ...baselineSensitivityReport.warnings,
    ...rankedCandidates.flatMap((candidate) => candidate.warnings),
    ...toleranceBudget.filter((row) => row.action === "locked" && row.sensitivityScore > 0.02).map((row) => ({
      code: "robustDesign.lockedSensitiveVariable",
      message: `${row.label} is sensitive but locked; L8.7 reports this as guidance and does not modify it.`
    }))
  ]);
  const draft = {
    schema: "emmicro.l87.robustDesignAdvisor.v1" as const,
    label: input.label ?? "L8.7 Robust Design Advisor / Tolerance-to-Action Optimizer",
    baselineSceneHash: baselineEvaluation.sceneHash,
    baselineVariationHash: toleranceVariationHash(variations, thresholds),
    baselineRunHash: baselineEvaluation.reportHash,
    baselineToleranceReport,
    baselineEvaluation,
    rankingMode: input.rankingMode ?? "weighted",
    recommendations,
    toleranceBudget,
    candidates: rankedCandidates,
    bestCandidate,
    warnings,
    boundary: [...l87RobustDesignBoundary],
    exports: [
      "robust_design_report.md",
      "robust_design_report.json",
      "candidate_table.csv",
      "recommendations.csv",
      "before_after_metrics.csv",
      "tolerance_budget.csv",
      "fdtd_candidate_sweep_manifest.json"
    ]
  };
  return { ...draft, reportHash: fnv1a64(stableStringify(robustReportForHash(draft))) };
}

export function createRobustFdtdCandidateSweepManifest(report: RobustDesignAdvisorReport, gridMaxRuns = 18): RobustFdtdCandidateSweepManifest {
  const candidates = report.candidates.map((candidate, index) => {
    const toleranceManifest = createToleranceFdtdSweepManifest(candidate.scenario, {
      variations: candidate.variations,
      thresholds: candidate.thresholds,
      selectedMetrics: report.baselineEvaluation.selectedMetrics,
      mode: "deterministic-grid",
      gridMaxRuns
    });
    return {
      candidateId: candidate.id,
      candidateHash: candidate.candidateHash,
      sceneHash: candidate.report.sceneHash,
      variationHash: candidate.report.variationHash,
      toleranceSweepManifestHash: toleranceManifest.manifestHash,
      caseCount: toleranceManifest.caseCount,
      manifestFilename: `l87_candidate_${String(index + 1).padStart(3, "0")}_fdtd_sweep_manifest.json`
    };
  }).filter((candidate) => candidate.caseCount > 0);
  const draft = {
    schema: "emmicro.l87.fdtdCandidateSweepManifest.v1" as const,
    label: "L8.7 external FDTD robust candidate sweep manifest",
    baselineSceneHash: report.baselineSceneHash,
    baselineVariationHash: report.baselineVariationHash,
    candidateCount: candidates.length,
    candidates,
    boundary: [
      "External FDTD candidate sweep export/import only; production FDTD execution stays external.",
      "Candidate hashes and underlying L8.6 tolerance sweep hashes are preserved for receipt comparison.",
      "Imported summaries are diagnostic evidence, not certified robust design approval."
    ]
  };
  return { ...draft, manifestHash: fnv1a64(stableStringify(draft)) };
}

export function createExampleRobustFdtdCandidateSweepSummary(manifest: RobustFdtdCandidateSweepManifest): RobustFdtdCandidateSweepSummary {
  const random = mulberry32(hashSeed(manifest.manifestHash));
  const results = manifest.candidates.map((candidate, index) => {
    const residuals = Array.from({ length: Math.max(1, candidate.caseCount) }, (_item, row) => Number((0.008 + index * 0.003 + row * 0.0015 + random() * 0.001).toPrecision(12)));
    const balances = residuals.map((residual) => Number((1 + residual * 0.3).toPrecision(12)));
    const residualP90 = percentile(residuals, 0.9);
    const energyBalanceP90 = percentile(balances.map((value) => Math.abs(value - 1)), 0.9);
    const status: ToleranceRunStatus = residualP90 > 0.05 || energyBalanceP90 > 0.05 ? "fail" : residualP90 > 0.025 ? "warning" : "pass";
    return {
      candidateId: candidate.candidateId,
      candidateHash: candidate.candidateHash,
      toleranceSweepManifestHash: candidate.toleranceSweepManifestHash,
      passRows: status === "pass" ? candidate.caseCount : Math.max(0, candidate.caseCount - 1),
      warningRows: status === "warning" ? 1 : 0,
      failRows: status === "fail" ? 1 : 0,
      residualP90,
      energyBalanceP90,
      status
    };
  });
  const draft = {
    schema: "emmicro.l87.fdtdCandidateSweepSummary.v1" as const,
    baselineSceneHash: manifest.baselineSceneHash,
    baselineVariationHash: manifest.baselineVariationHash,
    sweepManifestHash: manifest.manifestHash,
    results
  };
  return { ...draft, summaryHash: fnv1a64(stableStringify(draft)) };
}

export function parseRobustFdtdCandidateSweepSummary(json: string): RobustFdtdCandidateSweepSummary {
  const body = JSON.parse(json) as RobustFdtdCandidateSweepSummary;
  if (body.schema !== "emmicro.l87.fdtdCandidateSweepSummary.v1") throw new Error("Expected emmicro.l87.fdtdCandidateSweepSummary.v1");
  return body;
}

export function validateRobustFdtdCandidateSweepSummary(manifest: RobustFdtdCandidateSweepManifest, summary: RobustFdtdCandidateSweepSummary): SolverWarning[] {
  const warnings: SolverWarning[] = [];
  if (summary.baselineSceneHash !== manifest.baselineSceneHash) {
    warnings.push({ code: "robustDesign.fdtd.baselineSceneHashMismatch", message: "Imported robust candidate sweep summary baseline scene hash does not match the exported manifest." });
  }
  if (summary.baselineVariationHash !== manifest.baselineVariationHash) {
    warnings.push({ code: "robustDesign.fdtd.baselineVariationHashMismatch", message: "Imported robust candidate sweep summary variation hash does not match the exported manifest." });
  }
  if (summary.sweepManifestHash !== manifest.manifestHash) {
    warnings.push({ code: "robustDesign.fdtd.manifestHashMismatch", message: "Imported robust candidate sweep summary manifest hash does not match the exported manifest." });
  }
  const expected = new Map(manifest.candidates.map((candidate) => [candidate.candidateId, candidate]));
  for (const result of summary.results) {
    const candidate = expected.get(result.candidateId);
    if (!candidate) {
      warnings.push({ code: "robustDesign.fdtd.unknownCandidate", message: `Imported robust candidate ${result.candidateId} is not in the exported manifest.` });
      continue;
    }
    if (candidate.candidateHash !== result.candidateHash) {
      warnings.push({ code: "robustDesign.fdtd.candidateHashMismatch", message: `Imported robust candidate ${result.candidateId} hash does not match the exported candidate hash.` });
    }
    if (candidate.toleranceSweepManifestHash !== result.toleranceSweepManifestHash) {
      warnings.push({ code: "robustDesign.fdtd.toleranceSweepHashMismatch", message: `Imported robust candidate ${result.candidateId} L8.6 tolerance sweep hash does not match.` });
    }
  }
  return uniqueWarnings(warnings);
}

export function robustDesignReportJson(report: RobustDesignAdvisorReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function robustFdtdCandidateSweepManifestJson(manifest: RobustFdtdCandidateSweepManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export function robustFdtdCandidateSweepSummaryJson(summary: RobustFdtdCandidateSweepSummary): string {
  return `${JSON.stringify(summary, null, 2)}\n`;
}

export function robustDesignReportMarkdown(report: RobustDesignAdvisorReport, fdtdSummary?: RobustFdtdCandidateSweepSummary | null): string {
  return [
    `# ${report.label}`,
    "",
    `Baseline scene hash: ${report.baselineSceneHash}`,
    `Baseline variation hash: ${report.baselineVariationHash}`,
    `Report hash: ${report.reportHash}`,
    `Ranking mode: ${report.rankingMode}`,
    `Best candidate: ${report.bestCandidate ? report.bestCandidate.label : "none"}`,
    "",
    "## Ranked Recommendations",
    "",
    "| Rank | Action | Target | Metric | Expected improvement | Cost | Confidence |",
    "| ---: | --- | --- | --- | ---: | ---: | --- |",
    ...report.recommendations.slice(0, 16).map((item, index) => `| ${index + 1} | ${item.label} | ${item.target} | ${metricLabel(item.metric)} | ${formatNumber(item.expectedImprovement)} | ${formatNumber(item.costScore)} | ${item.confidence} |`),
    "",
    "## Candidate Comparison",
    "",
    "| Candidate | Action | Worst-case improvement | P90 improvement | Pass-rate delta | Cost | Improvement / cost | Top failure after |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |",
    ...report.candidates.map((candidate) => `| ${candidate.label} | ${candidate.actionKind} | ${formatNumber(candidate.comparison.worstCaseImprovement)} | ${formatNumber(candidate.comparison.p90Improvement)} | ${formatPercent(candidate.comparison.passRateDelta)} | ${formatNumber(candidate.costScore)} | ${formatNumber(candidate.comparison.improvementPerCost)} | ${candidate.comparison.topFailureAfter} |`),
    "",
    "## Tolerance Budget",
    "",
    "| Variation | Action | Current delta | Recommended delta | Sensitivity | Cost weight | Reason |",
    "| --- | --- | ---: | ---: | ---: | ---: | --- |",
    ...report.toleranceBudget.map((row) => `| ${row.label} | ${row.action} | ${formatNumber(row.currentDelta)} | ${formatNumber(row.recommendedDelta)} | ${formatNumber(row.sensitivityScore)} | ${formatNumber(row.costWeight)} | ${row.reason} |`),
    "",
    "## External FDTD Candidate Sweep Evidence",
    "",
    fdtdSummary
      ? `Imported robust candidate sweep summary ${fdtdSummary.summaryHash}; ${fdtdSummary.results.length} candidate rows; ${fdtdSummary.results.filter((row) => row.status === "pass").length} passing candidates.`
      : "No external FDTD candidate sweep summary imported. Browser execution of FDTD is not implemented.",
    "",
    "## Warnings",
    "",
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning.code}: ${warning.message}`) : ["- none"]),
    "",
    "## Boundary",
    "",
    ...report.boundary.map((item) => `- ${item}`)
  ].join("\n");
}

export function robustCandidateTableCsv(report: RobustDesignAdvisorReport): string {
  return [
    "candidate_id,label,action_kind,candidate_hash,cost_score,worst_case_improvement,p90_improvement,expected_improvement,pass_rate_delta,improvement_per_cost,top_failure_before,top_failure_after",
    ...report.candidates.map((candidate) => csvRow([
      candidate.id,
      candidate.label,
      candidate.actionKind,
      candidate.candidateHash,
      candidate.costScore,
      candidate.comparison.worstCaseImprovement,
      candidate.comparison.p90Improvement,
      candidate.comparison.expectedImprovement,
      candidate.comparison.passRateDelta,
      candidate.comparison.improvementPerCost,
      candidate.comparison.topFailureBefore,
      candidate.comparison.topFailureAfter
    ]))
  ].join("\n");
}

export function robustRecommendationsCsv(report: RobustDesignAdvisorReport): string {
  return [
    "recommendation_id,action_kind,label,spec_id,target,metric,expected_improvement,cost_score,improvement_per_cost,confidence,evidence,tradeoff",
    ...report.recommendations.map((item) => csvRow([item.id, item.actionKind, item.label, item.specId, item.target, item.metric, item.expectedImprovement, item.costScore, item.improvementPerCost, item.confidence, item.evidence, item.tradeoff]))
  ].join("\n");
}

export function robustBeforeAfterMetricsCsv(report: RobustDesignAdvisorReport): string {
  return [
    "candidate_id,metric,baseline,candidate,delta",
    ...report.candidates.flatMap((candidate) => report.baselineEvaluation.selectedMetrics.map((metric) => {
      const baseline = report.baselineEvaluation.nominalRun.metrics[metric];
      const next = candidate.report.nominalRun.metrics[metric];
      return csvRow([candidate.id, metric, baseline, next, next - baseline]);
    }))
  ].join("\n");
}

export function robustToleranceBudgetCsv(report: RobustDesignAdvisorReport): string {
  return [
    "spec_id,label,property,action,current_delta,recommended_delta,min_delta,max_delta,cost_weight,sensitivity_score,reason",
    ...report.toleranceBudget.map((row) => csvRow([row.specId, row.label, row.property, row.action, row.currentDelta, row.recommendedDelta, row.minDelta, row.maxDelta, row.costWeight, row.sensitivityScore, row.reason]))
  ].join("\n");
}

function createCandidateDrafts(
  scenario: SimulationBuilderScenario,
  baseline: ToleranceAnalysisReport,
  variations: ToleranceVariationSpec[],
  thresholds: ToleranceThreshold[],
  selectedMetrics: ToleranceMetricKey[],
  permissions: Map<string, Required<RobustDesignVariablePermission>>,
  budget: RobustDesignToleranceBudgetRow[],
  seed: number
): Array<{ label: string; actionKind: RobustDesignActionKind; scenario: SimulationBuilderScenario; variations: ToleranceVariationSpec[]; costScore: number; sourceSpecIds: string[]; warnings: SolverWarning[] }> {
  const drafts: Array<{ label: string; actionKind: RobustDesignActionKind; scenario: SimulationBuilderScenario; variations: ToleranceVariationSpec[]; costScore: number; sourceSpecIds: string[]; warnings: SolverWarning[] }> = [];
  const ranked = rankedSensitivityRows(baseline);
  const seenTopSpecs = new Set<string>();
  const topSpecs = ranked.map((row) => variations.find((variation) => variation.id === row.specId)).filter((item): item is ToleranceVariationSpec => {
    if (!item || seenTopSpecs.has(item.id)) return false;
    seenTopSpecs.add(item.id);
    return true;
  });
  for (const spec of topSpecs.slice(0, 3)) {
    const permission = permissions.get(spec.id)!;
    if (!permission.locked && permission.allowNominalMove && nominalMovableProperties.has(spec.property)) {
      const recentered = createRecenterScenario(scenario, baseline, spec, permission);
      if (recentered.changed) {
        drafts.push({
          label: `Recenter ${spec.label}`,
          actionKind: "nominal-recenter",
          scenario: recentered.scenario,
          variations: cloneVariations(variations),
          costScore: permission.costWeight,
          sourceSpecIds: [spec.id],
          warnings: recentered.warnings
        });
      }
    }
  }
  for (const row of budget.filter((item) => item.action === "tighten").slice(0, 3)) {
    const permission = permissions.get(row.specId)!;
    drafts.push({
      label: `Tighten ${row.label}`,
      actionKind: "tolerance-tighten",
      scenario: cloneScenario(scenario),
      variations: updateVariationDelta(variations, row.specId, row.recommendedDelta),
      costScore: permission.costWeight * Math.max(0.25, (row.currentDelta - row.recommendedDelta) / Math.max(1e-12, row.currentDelta)),
      sourceSpecIds: [row.specId],
      warnings: []
    });
  }
  for (const row of budget.filter((item) => item.action === "relax").slice(0, 2)) {
    const permission = permissions.get(row.specId)!;
    drafts.push({
      label: `Relax ${row.label}`,
      actionKind: "tolerance-relax",
      scenario: cloneScenario(scenario),
      variations: updateVariationDelta(variations, row.specId, row.recommendedDelta),
      costScore: Math.max(0.1, permission.costWeight * 0.25),
      sourceSpecIds: [row.specId],
      warnings: []
    });
  }
  const random = mulberry32(seed);
  const combined = cloneScenario(scenario);
  let combinedScenario = combined;
  let combinedVariations = cloneVariations(variations);
  const combinedSpecIds: string[] = [];
  let combinedCost = 0;
  const combinedWarnings: SolverWarning[] = [];
  for (const spec of topSpecs.slice(0, 2)) {
    const permission = permissions.get(spec.id)!;
    if (!permission.locked && permission.allowNominalMove && nominalMovableProperties.has(spec.property)) {
      const recentered = createRecenterScenario(combinedScenario, baseline, spec, permission, 0.2 + random() * 0.15);
      combinedScenario = recentered.scenario;
      combinedWarnings.push(...recentered.warnings);
      if (recentered.changed) {
        combinedSpecIds.push(spec.id);
        combinedCost += permission.costWeight * 0.75;
      }
    }
    const row = budget.find((item) => item.specId === spec.id && item.action === "tighten");
    if (row) {
      combinedVariations = updateVariationDelta(combinedVariations, row.specId, row.recommendedDelta);
      combinedSpecIds.push(row.specId);
      combinedCost += permission.costWeight;
    }
  }
  if (combinedSpecIds.length > 0) {
    drafts.push({
      label: "Balanced robust-grid candidate",
      actionKind: "robust-grid",
      scenario: combinedScenario,
      variations: combinedVariations,
      costScore: Math.max(1, combinedCost),
      sourceSpecIds: Array.from(new Set(combinedSpecIds)),
      warnings: uniqueWarnings(combinedWarnings)
    });
  }
  if (drafts.length === 0) {
    drafts.push({
      label: "Baseline-preserving diagnostic candidate",
      actionKind: "robust-grid",
      scenario: cloneScenario(scenario),
      variations: cloneVariations(variations),
      costScore: 1,
      sourceSpecIds: [],
      warnings: [{ code: "robustDesign.noUnlockedCandidate", message: "No unlocked sensitive variable could be changed; candidate preserves the baseline for comparison only." }]
    });
  }
  void thresholds;
  void selectedMetrics;
  return drafts.sort((a, b) => candidateDraftPriority(a.actionKind) - candidateDraftPriority(b.actionKind) || a.label.localeCompare(b.label));
}

function evaluateCandidateDraft(
  draft: { label: string; actionKind: RobustDesignActionKind; scenario: SimulationBuilderScenario; variations: ToleranceVariationSpec[]; costScore: number; sourceSpecIds: string[]; warnings: SolverWarning[] },
  index: number,
  baseline: ToleranceAnalysisReport,
  baselineScores: ReturnType<typeof scoreReport>,
  selectedMetrics: ToleranceMetricKey[],
  thresholds: ToleranceThreshold[],
  gridMaxRuns: number
): RobustDesignCandidate {
  const report = runToleranceAnalysis(draft.scenario, { variations: draft.variations, thresholds, selectedMetrics, mode: "deterministic-grid", gridMaxRuns });
  const scores = scoreReport(report, selectedMetrics, thresholds);
  const comparison = compareReports(baseline, baselineScores, report, scores, draft.costScore);
  const id = `l87-candidate-${String(index + 1).padStart(3, "0")}`;
  const candidateForHash = {
    id,
    label: draft.label,
    actionKind: draft.actionKind,
    sceneHash: report.sceneHash,
    variationHash: report.variationHash,
    costScore: draft.costScore,
    sourceSpecIds: draft.sourceSpecIds,
    comparison
  };
  return {
    id,
    label: draft.label,
    actionKind: draft.actionKind,
    scenario: draft.scenario,
    variations: draft.variations,
    thresholds,
    report,
    costScore: Number(draft.costScore.toPrecision(12)),
    comparison,
    candidateHash: fnv1a64(stableStringify(candidateForHash)),
    warnings: uniqueWarnings([...draft.warnings, ...report.warnings])
  };
}

function createRecommendations(
  baseline: ToleranceAnalysisReport,
  budget: RobustDesignToleranceBudgetRow[],
  candidates: RobustDesignCandidate[],
  permissions: Map<string, Required<RobustDesignVariablePermission>>
): RobustDesignRecommendation[] {
  const bySpec = new Map<string, RobustDesignCandidate[]>();
  for (const candidate of candidates) {
    for (const variation of candidate.variations) {
      const existing = bySpec.get(variation.id) ?? [];
      existing.push(candidate);
      bySpec.set(variation.id, existing);
    }
  }
  const recommendations: RobustDesignRecommendation[] = [];
  const ranked = rankedSensitivityRows(baseline);
  for (const row of budget) {
    const sensitivity = ranked.find((item) => item.specId === row.specId);
    const metric = sensitivity?.metric ?? baseline.selectedMetrics[0] ?? "peakIntensity";
    const permission = permissions.get(row.specId)!;
    const candidate = candidates.find((item) => item.variations.some((variation) => variation.id === row.specId && item.actionKind !== "nominal-recenter")) ?? candidates.find((item) => item.actionKind === "robust-grid");
    const expected = candidate?.comparison.expectedImprovement ?? row.sensitivityScore;
    const cost = row.action === "relax" ? Math.max(0.1, row.costWeight * 0.25) : row.costWeight;
    const label = row.action === "tighten"
      ? `Tighten ${row.label} to ${formatNumber(row.recommendedDelta)}`
      : row.action === "relax"
        ? `Relax ${row.label} to ${formatNumber(row.recommendedDelta)}`
        : row.action === "locked"
          ? `Locked sensitive variable: ${row.label}`
          : `Keep ${row.label}`;
    recommendations.push({
      id: `l87-rec-${String(recommendations.length + 1).padStart(3, "0")}`,
      actionKind: row.action === "relax" ? "tolerance-relax" : row.action === "tighten" ? "tolerance-tighten" : "robust-grid",
      label,
      specId: row.specId,
      target: row.label,
      metric,
      why: row.reason,
      expectedImprovement: Number(expected.toPrecision(12)),
      improvementPerCost: Number((expected / Math.max(1e-9, cost)).toPrecision(12)),
      costScore: Number(cost.toPrecision(12)),
      confidence: row.action === "locked" ? "low" : row.sensitivityScore > 0.05 ? "high" : row.sensitivityScore > 0.005 ? "medium" : "low",
      tradeoff: row.action === "relax" ? "Reduces manufacturing burden but should be rechecked against pass/fail thresholds." : permission.locked ? "No change is made because the parameter is locked." : "May increase build/manufacturing burden; rank by improvement per cost.",
      evidence: sensitivity ? `${metricLabel(metric)} sensitivity delta ${formatNumber(sensitivity.delta)} from ${sensitivity.worstRunId}` : "No strong L8.6 sensitivity signal.",
      candidateId: candidate?.id,
      locked: permission.locked
    });
  }
  for (const candidate of candidates.filter((item) => item.actionKind === "nominal-recenter").slice(0, 3)) {
    const metric = baseline.selectedMetrics[0] ?? "peakIntensity";
    recommendations.push({
      id: `l87-rec-${String(recommendations.length + 1).padStart(3, "0")}`,
      actionKind: "nominal-recenter",
      label: candidate.label,
      specId: candidate.id,
      target: candidate.label,
      metric,
      why: "Candidate shifts nominal placement opposite the worst L8.6 perturbation direction.",
      expectedImprovement: candidate.comparison.expectedImprovement,
      improvementPerCost: candidate.comparison.improvementPerCost,
      costScore: candidate.costScore,
      confidence: candidate.comparison.expectedImprovement > 0 ? "medium" : "low",
      tradeoff: "Changes nominal setup and must be confirmed by the user before applying.",
      evidence: `Candidate ${candidate.candidateHash} compared against baseline ${baseline.reportHash}.`,
      candidateId: candidate.id
    });
  }
  return recommendations.sort((a, b) => b.improvementPerCost - a.improvementPerCost || b.expectedImprovement - a.expectedImprovement);
}

function createToleranceBudget(baseline: ToleranceAnalysisReport, variations: ToleranceVariationSpec[], permissions: Map<string, Required<RobustDesignVariablePermission>>): RobustDesignToleranceBudgetRow[] {
  const ranked = rankedSensitivityRows(baseline);
  const maxSensitivity = Math.max(1e-12, ...ranked.map((row) => Math.abs(row.delta)));
  return variations.filter((variation) => variation.enabled && variation.model.kind === "plus-minus").map((variation) => {
    const sensitivity = ranked.find((row) => row.specId === variation.id);
    const sensitivityScore = sensitivity ? Math.abs(sensitivity.delta) / maxSensitivity : 0;
    const permission = permissions.get(variation.id)!;
    const currentDelta = variation.model.kind === "plus-minus" ? variation.model.delta : 0;
    let action: RobustDesignBudgetAction = "keep";
    let recommendedDelta = currentDelta;
    let reason = "Sensitivity is moderate; keep current diagnostic tolerance.";
    if (permission.locked) {
      action = "locked";
      reason = "Parameter is locked; L8.7 will not change it.";
    } else if (sensitivityScore >= 0.35 && permission.allowTighten) {
      action = "tighten";
      recommendedDelta = clamp(currentDelta * 0.5, permission.minDelta, permission.maxDelta);
      reason = "High sensitivity in L8.6 result; tightening can improve worst-case robustness.";
    } else if (sensitivityScore <= 0.08 && permission.allowRelax) {
      action = "relax";
      recommendedDelta = clamp(currentDelta * 1.5, permission.minDelta, permission.maxDelta);
      reason = "Low sensitivity in L8.6 result; relaxing may reduce manufacturing burden.";
    }
    return {
      specId: variation.id,
      label: variation.label,
      property: variation.property,
      currentDelta,
      recommendedDelta: Number(recommendedDelta.toPrecision(12)),
      minDelta: permission.minDelta,
      maxDelta: permission.maxDelta,
      costWeight: permission.costWeight,
      sensitivityScore: Number(sensitivityScore.toPrecision(12)),
      action,
      reason
    };
  });
}

function createRecenterScenario(scenario: SimulationBuilderScenario, baseline: ToleranceAnalysisReport, spec: ToleranceVariationSpec, permission: Required<RobustDesignVariablePermission>, fraction = 0.3): { scenario: SimulationBuilderScenario; changed: boolean; warnings: SolverWarning[] } {
  const run = baseline.runs.find((item) => item.id === baseline.sensitivity.find((row) => row.specId === spec.id)?.worstRunId) ?? baseline.worstCase;
  const perturbation = run.perturbations.find((item) => item.specId === spec.id);
  const nominal = nominalValueForSpec(scenario, spec);
  if (!perturbation || nominal === null) {
    return {
      scenario: cloneScenario(scenario),
      changed: false,
      warnings: [{ code: "robustDesign.recenterNoPerturbation", message: `${spec.label} cannot be recentered because no matching L8.6 perturbation was found.` }]
    };
  }
  const nextNominal = spec.application === "relative" ? nominal * (1 - perturbation.level * fraction) : nominal - perturbation.level * fraction;
  const clamped = clamp(nextNominal, permission.minNominal, permission.maxNominal);
  const next = setNominalValue(cloneScenario(scenario), spec, clamped);
  return { scenario: next, changed: Math.abs(clamped - nominal) > 1e-12, warnings: [] };
}

function updateVariationDelta(variations: ToleranceVariationSpec[], specId: string, nextDelta: number): ToleranceVariationSpec[] {
  return variations.map((variation) => variation.id === specId && variation.model.kind === "plus-minus" ? { ...variation, model: { ...variation.model, delta: Number(nextDelta.toPrecision(12)) } } : { ...variation });
}

function compareReports(
  baseline: ToleranceAnalysisReport,
  baselineScores: ReturnType<typeof scoreReport>,
  candidate: ToleranceAnalysisReport,
  candidateScores: ReturnType<typeof scoreReport>,
  costScore: number
): RobustDesignCandidateComparison {
  const expectedImprovement = baselineScores.expectedScore - candidateScores.expectedScore;
  return {
    baselineNominalScore: baselineScores.nominalScore,
    candidateNominalScore: candidateScores.nominalScore,
    baselineWorstCaseScore: baselineScores.worstCaseScore,
    candidateWorstCaseScore: candidateScores.worstCaseScore,
    baselineP90Score: baselineScores.p90Score,
    candidateP90Score: candidateScores.p90Score,
    baselineExpectedScore: baselineScores.expectedScore,
    candidateExpectedScore: candidateScores.expectedScore,
    baselinePassRate: baseline.passRate,
    candidatePassRate: candidate.passRate,
    passRateDelta: Number((candidate.passRate - baseline.passRate).toPrecision(12)),
    worstCaseImprovement: Number((baselineScores.worstCaseScore - candidateScores.worstCaseScore).toPrecision(12)),
    p90Improvement: Number((baselineScores.p90Score - candidateScores.p90Score).toPrecision(12)),
    expectedImprovement: Number(expectedImprovement.toPrecision(12)),
    failingCaseReduction: baseline.failingCases.length - candidate.failingCases.length,
    improvementPerCost: Number((expectedImprovement / Math.max(1e-9, costScore)).toPrecision(12)),
    topFailureBefore: topFailureLabel(baseline),
    topFailureAfter: topFailureLabel(candidate)
  };
}

function scoreReport(report: ToleranceAnalysisReport, selectedMetrics: ToleranceMetricKey[], thresholds: ToleranceThreshold[]) {
  const runs = [report.nominalRun, ...report.runs];
  const scores = runs.map((run) => scoreRun(run, selectedMetrics, thresholds));
  return {
    nominalScore: Number(scoreRun(report.nominalRun, selectedMetrics, thresholds).toPrecision(12)),
    worstCaseScore: Number(Math.max(...scores).toPrecision(12)),
    p90Score: percentile(scores, 0.9),
    expectedScore: Number((scores.reduce((sum, score) => sum + score, 0) / Math.max(1, scores.length)).toPrecision(12))
  };
}

function scoreRun(run: ToleranceRunResult, selectedMetrics: ToleranceMetricKey[], thresholds: ToleranceThreshold[]): number {
  const statusWeight = { pass: 0, warning: 35, fail: 100 } satisfies Record<ToleranceRunStatus, number>;
  let score = statusWeight[run.status] + run.warnings.length * 5;
  for (const threshold of thresholds.filter((item) => item.enabled)) {
    const value = run.metrics[threshold.metric];
    const denom = Math.max(1e-9, Math.abs(threshold.pass));
    if (threshold.direction === "min") score += Math.max(0, (threshold.pass - value) / denom) * 60;
    else score += Math.max(0, (value - threshold.pass) / denom) * 60;
  }
  if (selectedMetrics.includes("centroidShiftAbsUm")) score += Math.max(0, run.metrics.centroidShiftAbsUm) * 0.1;
  if (selectedMetrics.includes("energyBalanceError")) score += Math.max(0, run.metrics.energyBalanceError) * 20;
  if (selectedMetrics.includes("warningCount")) score += Math.max(0, run.metrics.warningCount) * 3;
  return Number(score.toPrecision(12));
}

function rankedSensitivityRows(report: ToleranceAnalysisReport): ToleranceSensitivityRow[] {
  return [...report.sensitivity].sort((a, b) => b.rankScore - a.rankScore || a.label.localeCompare(b.label));
}

function rankCandidates(candidates: RobustDesignCandidate[], rankingMode: RobustDesignRankingMode): RobustDesignCandidate[] {
  return [...candidates].sort((a, b) => candidateRankScore(b, rankingMode) - candidateRankScore(a, rankingMode) || a.label.localeCompare(b.label));
}

function candidateRankScore(candidate: RobustDesignCandidate, rankingMode: RobustDesignRankingMode): number {
  const comparison = candidate.comparison;
  if (rankingMode === "worst-case") return comparison.worstCaseImprovement;
  if (rankingMode === "p90") return comparison.p90Improvement;
  if (rankingMode === "pass-rate") return comparison.passRateDelta;
  if (rankingMode === "expected") return comparison.expectedImprovement;
  if (rankingMode === "improvement-per-cost") return comparison.improvementPerCost;
  return comparison.worstCaseImprovement * 0.35 + comparison.p90Improvement * 0.25 + comparison.expectedImprovement * 0.2 + comparison.passRateDelta * 50 + comparison.improvementPerCost * 0.2;
}

function candidateDraftPriority(actionKind: RobustDesignActionKind): number {
  if (actionKind === "robust-grid") return 0;
  if (actionKind === "tolerance-tighten") return 1;
  if (actionKind === "nominal-recenter") return 2;
  return 3;
}

function normalizePermissions(variations: ToleranceVariationSpec[], permissions: RobustDesignVariablePermission[]): Map<string, Required<RobustDesignVariablePermission>> {
  const supplied = new Map(permissions.map((permission) => [permission.specId, permission]));
  const output = new Map<string, Required<RobustDesignVariablePermission>>();
  for (const variation of variations) {
    const modelDelta = variation.model.kind === "plus-minus" ? variation.model.delta : 1;
    const existing = supplied.get(variation.id) ?? { specId: variation.id };
    output.set(variation.id, {
      specId: variation.id,
      locked: existing.locked ?? false,
      allowNominalMove: existing.allowNominalMove ?? nominalMovableProperties.has(variation.property),
      allowTighten: existing.allowTighten ?? true,
      allowRelax: existing.allowRelax ?? true,
      minDelta: existing.minDelta ?? Math.max(1e-12, modelDelta * 0.25),
      maxDelta: existing.maxDelta ?? Math.max(1e-12, modelDelta * 2),
      minNominal: existing.minNominal ?? -Infinity,
      maxNominal: existing.maxNominal ?? Infinity,
      costWeight: existing.costWeight ?? defaultCostWeight(variation)
    });
  }
  return output;
}

function defaultCostWeight(variation: ToleranceVariationSpec): number {
  if (variation.property === "xUm" || variation.property === "yUm") return 5;
  if (variation.property === "zMm" || variation.property === "focalLengthMm" || variation.property === "observationZMm") return 3;
  if (variation.property === "thicknessUm" || variation.property === "materialIndex" || variation.property === "absorptionCoefficientPerM") return 8;
  if (variation.targetKind === "source") return 4;
  return 2;
}

function topFailureLabel(report: ToleranceAnalysisReport): string {
  const failed = report.failingCases[0];
  if (failed?.perturbations[0]) return failed.perturbations[0].label;
  if (report.worstCase.perturbations[0]) return report.worstCase.perturbations[0].label;
  return "none";
}

function nominalValueForSpec(scenario: SimulationBuilderScenario, spec: ToleranceVariationSpec): number | null {
  if (spec.targetKind === "source") {
    if (spec.property === "wavelengthNm") return scenario.source.wavelengthNm;
    if (spec.property === "sourceXUm") return scenario.source.xUm;
    if (spec.property === "sourceYUm") return scenario.source.yUm;
    if (spec.property === "sourceZMm") return scenario.source.zMm;
    return null;
  }
  if (spec.targetKind === "target") {
    if (spec.property === "targetZMm") return scenario.target.zMm;
    if (spec.property === "targetThicknessUm") return scenario.target.thicknessUm;
    if (spec.property === "targetSubstrateIndex") return scenario.target.substrateIndex;
    return null;
  }
  if (spec.targetKind === "monitor") {
    if (spec.targetId === "observation-plane" && spec.property === "observationZMm") return scenario.observationPlaneZMm;
    const monitor = (scenario.customMonitors ?? []).find((item) => item.id === spec.targetId);
    if (!monitor) return null;
    if (spec.property === "monitorXUm") return monitor.xUm;
    if (spec.property === "monitorWidthUm") return monitor.widthUm;
    if (spec.property === "monitorHeightUm") return monitor.heightUm;
    return null;
  }
  const element = scenario.elements.find((item) => item.id === spec.targetId);
  if (!element) return null;
  if (spec.property === "xUm" || spec.property === "yUm" || spec.property === "orientationDeg") return element[spec.property] ?? 0;
  if (spec.property === "widthUm") return element.widthUm ?? element.apertureDiameterUm ?? element.apertureWidthUm ?? null;
  if (spec.property === "heightUm") return element.heightUm ?? element.apertureDiameterUm ?? element.apertureHeightUm ?? null;
  if (spec.property === "thicknessUm") return element.thicknessUm ?? 0;
  const value = element[spec.property as keyof SimulationBuilderElement];
  return typeof value === "number" ? value : null;
}

function setNominalValue(scenario: SimulationBuilderScenario, spec: ToleranceVariationSpec, value: number): SimulationBuilderScenario {
  if (spec.targetKind === "source") {
    if (spec.property === "wavelengthNm") return { ...scenario, source: { ...scenario.source, wavelengthNm: clampPositive(value) } };
    if (spec.property === "sourceXUm") return { ...scenario, source: { ...scenario.source, xUm: value } };
    if (spec.property === "sourceYUm") return { ...scenario, source: { ...scenario.source, yUm: value } };
    if (spec.property === "sourceZMm") return { ...scenario, source: { ...scenario.source, zMm: value } };
    return scenario;
  }
  if (spec.targetKind === "target") {
    if (spec.property === "targetZMm") return { ...scenario, target: { ...scenario.target, zMm: value } };
    if (spec.property === "targetThicknessUm") return { ...scenario, target: { ...scenario.target, thicknessUm: clampPositive(value) } };
    if (spec.property === "targetSubstrateIndex") return { ...scenario, target: { ...scenario.target, substrateIndex: clampPositive(value) } };
    return scenario;
  }
  if (spec.targetKind === "monitor") {
    if (spec.targetId === "observation-plane" && spec.property === "observationZMm") return { ...scenario, observationPlaneZMm: value };
    return {
      ...scenario,
      customMonitors: (scenario.customMonitors ?? []).map((monitor) => {
        if (monitor.id !== spec.targetId) return monitor;
        if (spec.property === "monitorXUm") return { ...monitor, xUm: value };
        if (spec.property === "monitorWidthUm") return { ...monitor, widthUm: clampPositive(value) };
        if (spec.property === "monitorHeightUm") return { ...monitor, heightUm: clampPositive(value) };
        return monitor;
      })
    };
  }
  return {
    ...scenario,
    elements: orderedSimulationBuilderElements(scenario.elements.map((element) => {
      if (element.id !== spec.targetId) return element;
      const positive = positiveNominalProperties.has(spec.property);
      const next = positive ? clampPositive(value) : value;
      if (spec.property === "xUm") return { ...element, xUm: next };
      if (spec.property === "yUm") return { ...element, yUm: next };
      if (spec.property === "zMm") return { ...element, zMm: next };
      if (spec.property === "widthUm") return { ...element, widthUm: next };
      if (spec.property === "heightUm") return { ...element, heightUm: next };
      if (spec.property === "thicknessUm") return { ...element, thicknessUm: next };
      if (spec.property === "apertureDiameterUm") return { ...element, apertureDiameterUm: next };
      if (spec.property === "apertureWidthUm") return { ...element, apertureWidthUm: next };
      if (spec.property === "apertureHeightUm") return { ...element, apertureHeightUm: next };
      if (spec.property === "focalLengthMm") return { ...element, focalLengthMm: next };
      if (spec.property === "orientationDeg") return { ...element, orientationDeg: next };
      if (spec.property === "materialIndex") return { ...element, materialIndex: next };
      if (spec.property === "absorptionCoefficientPerM") return { ...element, absorptionCoefficientPerM: Math.max(0, next) };
      if (spec.property === "extinctionCoefficient") return { ...element, extinctionCoefficient: Math.max(0, next) };
      return element;
    }))
  };
}

function cloneScenario(scenario: SimulationBuilderScenario): SimulationBuilderScenario {
  return JSON.parse(JSON.stringify(scenario)) as SimulationBuilderScenario;
}

function cloneVariations(variations: ToleranceVariationSpec[]): ToleranceVariationSpec[] {
  return JSON.parse(JSON.stringify(variations)) as ToleranceVariationSpec[];
}

function cloneThresholds(thresholds: ToleranceThreshold[]): ToleranceThreshold[] {
  return JSON.parse(JSON.stringify(thresholds)) as ToleranceThreshold[];
}

function robustReportForHash(report: Omit<RobustDesignAdvisorReport, "reportHash">): unknown {
  return {
    ...report,
    candidates: report.candidates.map((candidate) => ({
      id: candidate.id,
      label: candidate.label,
      actionKind: candidate.actionKind,
      reportHash: candidate.report.reportHash,
      candidateHash: candidate.candidateHash,
      costScore: candidate.costScore,
      comparison: candidate.comparison
    })),
    bestCandidate: report.bestCandidate ? { id: report.bestCandidate.id, candidateHash: report.bestCandidate.candidateHash } : null
  };
}

function percentile(values: number[], pct: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(pct * sorted.length) - 1));
  return Number((sorted[index] ?? 0).toPrecision(12));
}

function hashSeed(hash: string): number {
  return Array.from(hash).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 870);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clampPositive(value: number): number {
  return Math.max(1e-12, value);
}

function csvRow(values: Array<string | number | boolean | null | undefined>): string {
  return values.map((value) => csvEscape(value == null ? "" : String(value))).join(",");
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "n/a";
  if (value === 0) return "0";
  if (Math.abs(value) >= 1000 || Math.abs(value) < 0.001) return value.toExponential(4);
  return value.toPrecision(6).replace(/\.?0+$/, "");
}

function formatPercent(value: number): string {
  return `${formatNumber(value * 100)}%`;
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

const nominalMovableProperties = new Set<ToleranceVariationProperty>(["sourceXUm", "sourceYUm", "sourceZMm", "xUm", "yUm", "zMm", "thicknessUm", "focalLengthMm", "orientationDeg", "observationZMm", "monitorXUm"]);
const positiveNominalProperties = new Set<ToleranceVariationProperty>(["wavelengthNm", "widthUm", "heightUm", "thicknessUm", "apertureDiameterUm", "apertureWidthUm", "apertureHeightUm", "focalLengthMm", "materialIndex", "targetThicknessUm", "targetSubstrateIndex", "monitorWidthUm", "monitorHeightUm"]);
