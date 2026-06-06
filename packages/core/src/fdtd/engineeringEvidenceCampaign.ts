import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import {
  createApertureValidationExampleBundle,
  type ApertureValidationExampleBundle,
  type ApertureValidationKind
} from "./fdtdApertureValidation";
import {
  createFdtdBenchmarkExampleBundle,
  type FdtdBenchmarkExampleBundle,
  type FdtdBenchmarkKind,
  type FdtdConvergenceSummary
} from "./fdtdBenchmarkSuite";
import { createOpticalBenchBundle, type OpticalBenchBundle } from "./fdtdMultiElementBench";
import {
  createExampleToleranceFdtdSweepSummary,
  createToleranceFdtdSweepManifest,
  defaultToleranceMetrics,
  defaultToleranceThresholds,
  defaultToleranceVariationSpecs,
  runToleranceAnalysis,
  type ToleranceAnalysisReport
} from "../maxwell/processToleranceRunner";
import {
  createExampleRobustFdtdCandidateSweepSummary,
  createRobustFdtdCandidateSweepManifest,
  runRobustDesignAdvisor,
  type RobustDesignAdvisorReport
} from "../maxwell/robustDesignAdvisor";
import { defaultOpticalBenchScenario } from "../maxwell/multiElementBench";
import type { SimulationBuilderValidationStatus } from "../maxwell/simulationBuilder";

export type EngineeringEvidenceScenarioId =
  | "transparent-slab"
  | "absorbing-slab"
  | "reflective-plate"
  | "long-slit"
  | "circular-pinhole"
  | "multielement-chain"
  | "robust-candidate";

export type EngineeringEvidenceStatus = SimulationBuilderValidationStatus;
export type EngineeringEvidenceType = "imported-fixture" | "computed" | "computed/imported" | "external-only";
export type EngineeringEvidenceCapabilityStatus = "executable" | "external-only" | "scaffold-only" | "not-implemented" | "unsupported";

export type EngineeringEvidenceMetricSet = {
  reflectance?: number;
  transmittance?: number;
  absorbance?: number;
  peakIntensity?: number;
  passRate?: number;
  worstCaseScore?: number;
  expectedScore?: number;
};

export type EngineeringEvidenceReceipt = {
  sceneHash: string;
  sourceScenarioHash?: string;
  manifestHash?: string;
  scriptHash?: string;
  referenceHash?: string;
  resultHash?: string;
  summaryHash?: string;
};

export type EngineeringEvidenceScenarioResult = {
  id: EngineeringEvidenceScenarioId;
  label: string;
  purpose: string;
  referenceModel: string;
  referenceDescription: string;
  evidenceType: EngineeringEvidenceType;
  status: EngineeringEvidenceStatus;
  residual: number;
  convergenceStatus: string;
  pmlStatus: EngineeringEvidenceStatus | "n/a";
  expected: EngineeringEvidenceMetricSet;
  computed: EngineeringEvidenceMetricSet;
  receipts: EngineeringEvidenceReceipt;
  warnings: SolverWarning[];
  unsupported: string[];
  notes: string[];
};

export type EngineeringEvidenceConvergenceRow = {
  scenarioId: EngineeringEvidenceScenarioId;
  label: string;
  runCount: number;
  trend: string;
  finalResidual: number;
  finalEnergyBalanceError: number;
  pmlSensitivity: number | null;
  status: EngineeringEvidenceStatus;
};

export type EngineeringEvidenceToleranceSummary = {
  label: string;
  reportHash: string;
  variationHash: string;
  passRate: number;
  worstCaseStatus: EngineeringEvidenceStatus;
  failingCaseCount: number;
  topSensitivity: string;
  sweepManifestHash: string;
  sweepSummaryHash: string;
};

export type EngineeringEvidenceRobustSummary = {
  label: string;
  reportHash: string;
  baselinePassRate: number;
  candidatePassRate: number;
  passRateDelta: number;
  worstCaseImprovement: number;
  expectedImprovement: number;
  bestCandidateLabel: string;
  candidateHash: string;
  sweepManifestHash: string;
  sweepSummaryHash: string;
  remainingFailureDriver: string;
};

export type EngineeringEvidenceCapabilityRow = {
  id: string;
  label: string;
  status: EngineeringEvidenceCapabilityStatus;
  evidence: string;
};

export type EngineeringEvidenceUnsupportedItem = {
  id: string;
  label: string;
  reason: string;
  status: "unsupported" | "not-implemented" | "scaffold-only";
};

export type EngineeringEvidenceCampaignManifest = {
  schema: "emmicro.l88.evidenceCampaignManifest.v1";
  id: string;
  label: string;
  version: "L8.8";
  scenarioIds: EngineeringEvidenceScenarioId[];
  requiredArtifacts: string[];
  thresholds: {
    passResidual: number;
    warningResidual: number;
    pmlWarning: number;
    pmlFail: number;
  };
  boundary: string[];
  manifestHash: string;
};

export type GoldenEvidenceCampaignSummary = {
  schema: "emmicro.l88.goldenCampaignSummary.v1";
  campaignId: string;
  manifestHash: string;
  label: string;
  generatedAtIso: string;
  scenarios: EngineeringEvidenceScenarioResult[];
  convergence: EngineeringEvidenceConvergenceRow[];
  toleranceSummary: EngineeringEvidenceToleranceSummary;
  robustSummary: EngineeringEvidenceRobustSummary;
  capabilityTruthTable: EngineeringEvidenceCapabilityRow[];
  unsupportedItems: EngineeringEvidenceUnsupportedItem[];
  boundary: string[];
  dossierExports: string[];
  summaryHash: string;
};

export type EngineeringEvidenceCampaignBundle = {
  manifest: EngineeringEvidenceCampaignManifest;
  summary: GoldenEvidenceCampaignSummary;
};

export const l88EngineeringEvidenceBoundary = [
  "L8.8 is an engineer-facing evidence/reporting campaign over existing L8.x scenes, references, convergence summaries, tolerance results, and robust-advisor receipts.",
  "Golden campaign fixtures are deterministic diagnostic evidence and import contracts; external FDTD execution remains optional and outside the browser.",
  "Iteration count is not validation. This dossier reports runnable evidence, references, residuals, convergence behavior, and limitations.",
  "The campaign is not certified validation, certified tolerancing, automatic final design approval, in-browser FDTD, arbitrary 3D Maxwell/CAD execution, FEM/BEM/RCWA, production EM solving, digital twin behavior, or manufacturing certification."
] as const;

export const l88ScenarioIds: EngineeringEvidenceScenarioId[] = [
  "transparent-slab",
  "absorbing-slab",
  "reflective-plate",
  "long-slit",
  "circular-pinhole",
  "multielement-chain",
  "robust-candidate"
];

export function createEngineeringEvidenceCampaignManifest(): EngineeringEvidenceCampaignManifest {
  const draft = {
    schema: "emmicro.l88.evidenceCampaignManifest.v1" as const,
    id: "l88-golden-evidence-campaign",
    label: "L8.8 Golden Evidence Pack / External FDTD Acceptance Campaign",
    version: "L8.8" as const,
    scenarioIds: [...l88ScenarioIds],
    requiredArtifacts: [
      "campaign_manifest.json",
      "golden_campaign_summary.json",
      "engineering_evidence_dossier.md",
      "scenario_summary.csv",
      "convergence_summary.csv",
      "tolerance_summary.csv",
      "robust_candidate_summary.csv",
      "capability_truth_table.csv",
      "unsupported_items.csv"
    ],
    thresholds: {
      passResidual: 0.03,
      warningResidual: 0.08,
      pmlWarning: 0.015,
      pmlFail: 0.05
    },
    boundary: [...l88EngineeringEvidenceBoundary]
  };
  return { ...draft, manifestHash: fnv1a64(stableStringify(draft)) };
}

export function createGoldenEvidenceCampaignSummary(
  manifest: EngineeringEvidenceCampaignManifest = createEngineeringEvidenceCampaignManifest()
): GoldenEvidenceCampaignSummary {
  const transparent = createFdtdBenchmarkExampleBundle("transparent-slab");
  const absorbing = createFdtdBenchmarkExampleBundle("absorbing-slab");
  const reflective = createFdtdBenchmarkExampleBundle("mirror");
  const longSlit = createApertureValidationExampleBundle("long-slit");
  const circular = createApertureValidationExampleBundle("circular-pinhole");
  const bench = createOpticalBenchBundle(defaultOpticalBenchScenario());
  const tolerance = runToleranceAnalysis(defaultOpticalBenchScenario(), {
    variations: defaultToleranceVariationSpecs(defaultOpticalBenchScenario()),
    thresholds: defaultToleranceThresholds(),
    selectedMetrics: defaultToleranceMetrics,
    mode: "one-at-a-time",
    gridMaxRuns: 8,
    label: "L8.8 golden campaign L8.6 tolerance variation"
  });
  const robust = runRobustDesignAdvisor(defaultOpticalBenchScenario(), {
    baselineReport: tolerance,
    variations: tolerance.variations,
    thresholds: tolerance.thresholds,
    rankingMode: "weighted",
    gridMaxRuns: 8,
    candidateLimit: 4,
    label: "L8.8 golden campaign L8.7 robust candidate review"
  });
  const toleranceSweep = createToleranceFdtdSweepManifest(defaultOpticalBenchScenario(), {
    variations: tolerance.variations,
    thresholds: tolerance.thresholds,
    selectedMetrics: tolerance.selectedMetrics,
    mode: "deterministic-grid",
    gridMaxRuns: 8
  });
  const toleranceSweepSummary = createExampleToleranceFdtdSweepSummary(toleranceSweep);
  const robustSweep = createRobustFdtdCandidateSweepManifest(robust, 8);
  const robustSweepSummary = createExampleRobustFdtdCandidateSweepSummary(robustSweep);
  const scenarios: EngineeringEvidenceScenarioResult[] = [
    scenarioFromBenchmark("transparent-slab", "Transparent slab", "Transparent air-glass-air material interaction", transparent),
    scenarioFromBenchmark("absorbing-slab", "Absorbing slab", "Absorption and lossy thickness behavior", absorbing),
    scenarioFromBenchmark("reflective-plate", "Reflective plate", "Ideal mirror / high-reflection limit", reflective),
    scenarioFromAperture("long-slit", "Long slit aperture", "Scalar sinc-squared edge-diffraction limiting case", longSlit),
    scenarioFromAperture("circular-pinhole", "Circular aperture", "Airy/Bessel first-ring limiting case", circular),
    scenarioFromBench(bench),
    scenarioFromRobust(robust)
  ];
  const convergence = [
    convergenceFromBenchmark("transparent-slab", "Transparent slab", transparent.convergenceSummary),
    convergenceFromBenchmark("absorbing-slab", "Absorbing slab", absorbing.convergenceSummary),
    convergenceFromBenchmark("reflective-plate", "Reflective plate", reflective.convergenceSummary),
    convergenceFromAperture("long-slit", "Long slit aperture", longSlit),
    convergenceFromAperture("circular-pinhole", "Circular aperture", circular)
  ];
  const draft = {
    schema: "emmicro.l88.goldenCampaignSummary.v1" as const,
    campaignId: manifest.id,
    manifestHash: manifest.manifestHash,
    label: manifest.label,
    generatedAtIso: "2026-06-06T00:00:00.000Z",
    scenarios,
    convergence,
    toleranceSummary: toleranceSummaryFromReport(tolerance, toleranceSweep.manifestHash, toleranceSweepSummary.summaryHash),
    robustSummary: robustSummaryFromReport(robust, robustSweep.manifestHash, robustSweepSummary.summaryHash),
    capabilityTruthTable: createEngineeringEvidenceCapabilityTruthTable(),
    unsupportedItems: createEngineeringEvidenceUnsupportedItems(),
    boundary: [...l88EngineeringEvidenceBoundary],
    dossierExports: [
      "engineering_evidence_dossier.md",
      "engineering_evidence_dossier.json",
      "scenario_summary.csv",
      "convergence_summary.csv",
      "tolerance_summary.csv",
      "robust_candidate_summary.csv",
      "capability_truth_table.csv",
      "unsupported_items.csv"
    ]
  };
  return { ...draft, summaryHash: fnv1a64(stableStringify(summaryForHash(draft))) };
}

export function createEngineeringEvidenceCampaignBundle(): EngineeringEvidenceCampaignBundle {
  const manifest = createEngineeringEvidenceCampaignManifest();
  return { manifest, summary: createGoldenEvidenceCampaignSummary(manifest) };
}

export function parseEngineeringEvidenceCampaignManifest(value: string | EngineeringEvidenceCampaignManifest): EngineeringEvidenceCampaignManifest {
  const body = parseObject(value, "campaign manifest") as EngineeringEvidenceCampaignManifest;
  if (body.schema !== "emmicro.l88.evidenceCampaignManifest.v1") throw new Error("Expected emmicro.l88.evidenceCampaignManifest.v1");
  const draft = {
    schema: body.schema,
    id: requiredString(body, "id"),
    label: requiredString(body, "label"),
    version: body.version,
    scenarioIds: requiredArray(body.scenarioIds, "scenarioIds").map((id) => parseScenarioId(String(id))),
    requiredArtifacts: requiredArray(body.requiredArtifacts, "requiredArtifacts").map(String),
    thresholds: parseThresholds(parseObject(body.thresholds, "thresholds")),
    boundary: requiredArray(body.boundary, "boundary").map(String)
  };
  return { ...draft, manifestHash: body.manifestHash ?? fnv1a64(stableStringify(draft)) };
}

export function parseGoldenEvidenceCampaignSummary(value: string | GoldenEvidenceCampaignSummary): GoldenEvidenceCampaignSummary {
  const body = parseObject(value, "golden campaign summary") as GoldenEvidenceCampaignSummary;
  if (body.schema !== "emmicro.l88.goldenCampaignSummary.v1") throw new Error("Expected emmicro.l88.goldenCampaignSummary.v1");
  const draft = {
    schema: body.schema,
    campaignId: requiredString(body, "campaignId"),
    manifestHash: requiredString(body, "manifestHash"),
    label: requiredString(body, "label"),
    generatedAtIso: requiredString(body, "generatedAtIso"),
    scenarios: requiredArray(body.scenarios, "scenarios").map((item) => parseScenarioResult(parseObject(item, "scenario"))),
    convergence: requiredArray(body.convergence, "convergence").map((item) => parseConvergenceRow(parseObject(item, "convergence"))),
    toleranceSummary: parseToleranceSummary(parseObject(body.toleranceSummary, "toleranceSummary")),
    robustSummary: parseRobustSummary(parseObject(body.robustSummary, "robustSummary")),
    capabilityTruthTable: requiredArray(body.capabilityTruthTable, "capabilityTruthTable").map((item) => parseCapabilityRow(parseObject(item, "capability"))),
    unsupportedItems: requiredArray(body.unsupportedItems, "unsupportedItems").map((item) => parseUnsupportedItem(parseObject(item, "unsupportedItem"))),
    boundary: requiredArray(body.boundary, "boundary").map(String),
    dossierExports: requiredArray(body.dossierExports, "dossierExports").map(String)
  };
  return { ...draft, summaryHash: body.summaryHash ?? fnv1a64(stableStringify(summaryForHash(draft))) };
}

export function validateEngineeringEvidenceCampaign(
  manifest: EngineeringEvidenceCampaignManifest,
  summary: GoldenEvidenceCampaignSummary
): SolverWarning[] {
  const warnings: SolverWarning[] = [];
  if (summary.campaignId !== manifest.id) warnings.push({ code: "evidenceCampaign.campaignIdMismatch", message: "Golden campaign summary campaign id does not match manifest id." });
  if (summary.manifestHash !== manifest.manifestHash) warnings.push({ code: "evidenceCampaign.manifestHashMismatch", message: "Golden campaign summary manifest hash does not match campaign manifest." });
  const scenarioIds = new Set(summary.scenarios.map((scenario) => scenario.id));
  for (const required of manifest.scenarioIds) {
    if (!scenarioIds.has(required)) warnings.push({ code: "evidenceCampaign.missingScenario", message: `Golden campaign summary is missing scenario ${required}.` });
  }
  for (const scenario of summary.scenarios) {
    if (!scenario.referenceModel || !scenario.referenceDescription) warnings.push({ code: "evidenceCampaign.referenceMissing", message: `${scenario.label} is missing reference model detail.` });
    if (!Number.isFinite(scenario.residual)) warnings.push({ code: "evidenceCampaign.residualMissing", message: `${scenario.label} is missing a finite residual.` });
    if (!scenario.receipts.sceneHash && !scenario.receipts.resultHash) warnings.push({ code: "evidenceCampaign.receiptMissing", message: `${scenario.label} is missing hashes/receipts.` });
    if (scenario.status === "fail") warnings.push({ code: "evidenceCampaign.scenarioFail", message: `${scenario.label} is failing in the golden campaign.` });
  }
  for (const artifact of manifest.requiredArtifacts) {
    if (!summary.dossierExports.includes(artifact) && artifact !== "campaign_manifest.json" && artifact !== "golden_campaign_summary.json") {
      warnings.push({ code: "evidenceCampaign.exportMissing", message: `Dossier export list is missing ${artifact}.` });
    }
  }
  if (!summary.boundary.join(" ").includes("not certified validation")) {
    warnings.push({ code: "evidenceCampaign.boundaryMissing", message: "Campaign boundary must explicitly say this is not certified validation." });
  }
  return uniqueWarnings(warnings);
}

export function engineeringEvidenceCampaignManifestJson(manifest: EngineeringEvidenceCampaignManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export function goldenEvidenceCampaignSummaryJson(summary: GoldenEvidenceCampaignSummary): string {
  return `${JSON.stringify(summary, null, 2)}\n`;
}

export function engineeringEvidenceDossierJson(summary: GoldenEvidenceCampaignSummary): string {
  return goldenEvidenceCampaignSummaryJson(summary);
}

export function engineeringEvidenceDossierMarkdown(summary: GoldenEvidenceCampaignSummary): string {
  return [
    `# ${summary.label}`,
    "",
    "Iteration count is not validation. This dossier reports runnable evidence, references, residuals, convergence behavior, and limitations.",
    "",
    "## Executive Summary",
    "",
    `Campaign id: ${summary.campaignId}`,
    `Manifest hash: ${summary.manifestHash}`,
    `Summary hash: ${summary.summaryHash}`,
    `Scenario count: ${summary.scenarios.length}`,
    `Passing scenarios: ${summary.scenarios.filter((scenario) => scenario.status === "pass").length}`,
    `Warning scenarios: ${summary.scenarios.filter((scenario) => scenario.status === "warning").length}`,
    `Failing scenarios: ${summary.scenarios.filter((scenario) => scenario.status === "fail").length}`,
    "",
    "## What Was Simulated",
    "",
    "| Scenario | Purpose | Evidence | Scene/result hash |",
    "| --- | --- | --- | --- |",
    ...summary.scenarios.map((scenario) => `| ${scenario.label} | ${scenario.purpose} | ${scenario.evidenceType} | ${scenario.receipts.sceneHash || scenario.receipts.resultHash || "n/a"} |`),
    "",
    "## Scenario-by-Scenario Validation",
    "",
    "| Scenario | Reference | Status | Expected T | Computed T | Residual | Convergence | PML |",
    "| --- | --- | --- | ---: | ---: | ---: | --- | --- |",
    ...summary.scenarios.map((scenario) => `| ${scenario.label} | ${scenario.referenceModel} | ${scenario.status.toUpperCase()} | ${formatNumber(scenario.expected.transmittance)} | ${formatNumber(scenario.computed.transmittance)} | ${formatNumber(scenario.residual)} | ${scenario.convergenceStatus} | ${scenario.pmlStatus} |`),
    "",
    "## Convergence and PML Sensitivity",
    "",
    "| Scenario | Runs | Trend | Final residual | Energy error | PML sensitivity | Status |",
    "| --- | ---: | --- | ---: | ---: | ---: | --- |",
    ...summary.convergence.map((row) => `| ${row.label} | ${row.runCount} | ${row.trend} | ${formatNumber(row.finalResidual)} | ${formatNumber(row.finalEnergyBalanceError)} | ${formatNumber(row.pmlSensitivity)} | ${row.status} |`),
    "",
    "## Process / Tolerance Variation",
    "",
    `Tolerance report: ${summary.toleranceSummary.reportHash}`,
    `Variation hash: ${summary.toleranceSummary.variationHash}`,
    `Pass rate: ${formatPercent(summary.toleranceSummary.passRate)}`,
    `Worst case: ${summary.toleranceSummary.worstCaseStatus}`,
    `Top sensitivity: ${summary.toleranceSummary.topSensitivity}`,
    "",
    "## Robust-Design Recommendation Before / After",
    "",
    `Robust report: ${summary.robustSummary.reportHash}`,
    `Best candidate: ${summary.robustSummary.bestCandidateLabel}`,
    `Candidate hash: ${summary.robustSummary.candidateHash}`,
    `Baseline pass rate: ${formatPercent(summary.robustSummary.baselinePassRate)}`,
    `Candidate pass rate: ${formatPercent(summary.robustSummary.candidatePassRate)}`,
    `Pass-rate delta: ${formatPercent(summary.robustSummary.passRateDelta)}`,
    `Worst-case improvement: ${formatNumber(summary.robustSummary.worstCaseImprovement)}`,
    `Expected improvement: ${formatNumber(summary.robustSummary.expectedImprovement)}`,
    `Remaining failure driver: ${summary.robustSummary.remainingFailureDriver}`,
    "",
    "## Capability Truth Table",
    "",
    "| Capability | Status | Evidence |",
    "| --- | --- | --- |",
    ...summary.capabilityTruthTable.map((row) => `| ${row.label} | ${row.status} | ${row.evidence} |`),
    "",
    "## Unsupported / Scaffold-Only Items",
    "",
    "| Item | Status | Reason |",
    "| --- | --- | --- |",
    ...summary.unsupportedItems.map((item) => `| ${item.label} | ${item.status} | ${item.reason} |`),
    "",
    "## Reproducibility Receipts",
    "",
    "| Scenario | Scene | Manifest | Script | Reference | Result/Summary |",
    "| --- | --- | --- | --- | --- | --- |",
    ...summary.scenarios.map((scenario) => `| ${scenario.label} | ${scenario.receipts.sceneHash || "n/a"} | ${scenario.receipts.manifestHash || "n/a"} | ${scenario.receipts.scriptHash || "n/a"} | ${scenario.receipts.referenceHash || "n/a"} | ${scenario.receipts.resultHash || scenario.receipts.summaryHash || "n/a"} |`),
    "",
    "## Limitations",
    "",
    ...summary.boundary.map((item) => `- ${item}`)
  ].join("\n");
}

export function engineeringEvidenceScenarioSummaryCsv(summary: GoldenEvidenceCampaignSummary): string {
  return [
    "scenario_id,label,reference_model,status,residual,convergence_status,pml_status,evidence_type,scene_hash,manifest_hash,script_hash,result_hash",
    ...summary.scenarios.map((scenario) => csvRow([
      scenario.id,
      scenario.label,
      scenario.referenceModel,
      scenario.status,
      scenario.residual,
      scenario.convergenceStatus,
      scenario.pmlStatus,
      scenario.evidenceType,
      scenario.receipts.sceneHash,
      scenario.receipts.manifestHash,
      scenario.receipts.scriptHash,
      scenario.receipts.resultHash ?? scenario.receipts.summaryHash
    ]))
  ].join("\n");
}

export function engineeringEvidenceConvergenceSummaryCsv(summary: GoldenEvidenceCampaignSummary): string {
  return [
    "scenario_id,label,run_count,trend,final_residual,final_energy_balance_error,pml_sensitivity,status",
    ...summary.convergence.map((row) => csvRow([row.scenarioId, row.label, row.runCount, row.trend, row.finalResidual, row.finalEnergyBalanceError, row.pmlSensitivity, row.status]))
  ].join("\n");
}

export function engineeringEvidenceToleranceSummaryCsv(summary: GoldenEvidenceCampaignSummary): string {
  const row = summary.toleranceSummary;
  return [
    "label,report_hash,variation_hash,pass_rate,worst_case_status,failing_case_count,top_sensitivity,sweep_manifest_hash,sweep_summary_hash",
    csvRow([row.label, row.reportHash, row.variationHash, row.passRate, row.worstCaseStatus, row.failingCaseCount, row.topSensitivity, row.sweepManifestHash, row.sweepSummaryHash])
  ].join("\n");
}

export function engineeringEvidenceRobustCandidateSummaryCsv(summary: GoldenEvidenceCampaignSummary): string {
  const row = summary.robustSummary;
  return [
    "label,report_hash,best_candidate,candidate_hash,baseline_pass_rate,candidate_pass_rate,pass_rate_delta,worst_case_improvement,expected_improvement,remaining_failure_driver,sweep_manifest_hash,sweep_summary_hash",
    csvRow([
      row.label,
      row.reportHash,
      row.bestCandidateLabel,
      row.candidateHash,
      row.baselinePassRate,
      row.candidatePassRate,
      row.passRateDelta,
      row.worstCaseImprovement,
      row.expectedImprovement,
      row.remainingFailureDriver,
      row.sweepManifestHash,
      row.sweepSummaryHash
    ])
  ].join("\n");
}

export function engineeringEvidenceCapabilityTruthTableCsv(summary: GoldenEvidenceCampaignSummary): string {
  return [
    "capability_id,label,status,evidence",
    ...summary.capabilityTruthTable.map((row) => csvRow([row.id, row.label, row.status, row.evidence]))
  ].join("\n");
}

export function engineeringEvidenceUnsupportedItemsCsv(summary: GoldenEvidenceCampaignSummary): string {
  return [
    "item_id,label,status,reason",
    ...summary.unsupportedItems.map((item) => csvRow([item.id, item.label, item.status, item.reason]))
  ].join("\n");
}

export function createEngineeringEvidenceCapabilityTruthTable(): EngineeringEvidenceCapabilityRow[] {
  return [
    { id: "engineering-evidence-campaign", label: "Engineering Evidence Campaign", status: "executable", evidence: "L8.8 campaign manifest, golden summary, scenario table, convergence review, tolerance/robust summaries, and dossier exports." },
    { id: "golden-scenario-validation-dossier", label: "Golden scenario validation dossier", status: "executable", evidence: "Deterministic transparent, absorbing, reflective, aperture, multi-element, and robust candidate scenarios are bundled." },
    { id: "external-fdtd-import", label: "External FDTD evidence import", status: "external-only", evidence: "Manifest/script/hash receipts and imported field/flux/convergence summaries are accepted; production FDTD execution stays external." },
    { id: "planar-tmm-reference", label: "Planar TMM/Fresnel references", status: "executable", evidence: "Transparent slab/interface and mirror/absorber references reuse existing L8.0/L8.2 analytic/TMM paths." },
    { id: "aperture-scalar-reference", label: "Aperture scalar limiting references", status: "executable", evidence: "L8.4 long-slit and circular-pinhole scalar references and convergence diagnostics are included." },
    { id: "l86-tolerance-evidence", label: "L8.6 tolerance evidence", status: "executable", evidence: "Deterministic-grid tolerance report and FDTD variation sweep fixture hashes are preserved." },
    { id: "l87-robust-evidence", label: "L8.7 robust before/after evidence", status: "executable", evidence: "Best candidate before/after metrics and external candidate sweep receipt hashes are preserved." },
    { id: "external-fdtd-backend", label: "ExternalFdtdBackend", status: "scaffold-only", evidence: "Registered/export/import scaffold only; no in-browser production solver execution." },
    { id: "certified-validation", label: "Certified validation", status: "not-implemented", evidence: "L8.8 is an evidence dossier, not V&V certification." },
    { id: "production-em-solver-certification", label: "Production EM solver certification", status: "not-implemented", evidence: "No production Maxwell solver, certified tolerancing, FEM/BEM/RCWA, or manufacturing certification is claimed." }
  ];
}

export function createEngineeringEvidenceUnsupportedItems(): EngineeringEvidenceUnsupportedItem[] {
  return [
    { id: "production-browser-fdtd", label: "Production in-browser FDTD execution", status: "not-implemented", reason: "L9.2 adds only a capped diagnostic 2D TMz sandbox with CPU reference stepping, optional WebGPU acceleration, parity, stability, and convergence diagnostics; production FDTD remains external." },
    { id: "arbitrary-3d-maxwell", label: "Arbitrary 3D Maxwell/CAD solve", status: "not-implemented", reason: "Current 3D work is schema/export/import scaffolding and diagnostics, not a full 3D solver." },
    { id: "fem-bem-rcwa", label: "FEM/BEM/RCWA execution", status: "not-implemented", reason: "No FEM, BEM, or RCWA backend is shipped." },
    { id: "certified-tolerancing", label: "Certified optical tolerancing", status: "not-implemented", reason: "L8.6/L8.7/L8.8 are diagnostic engineering aids only." },
    { id: "automatic-final-design-approval", label: "Automatic final design approval", status: "not-implemented", reason: "Robust candidates require explicit user application and review." },
    { id: "digital-twin", label: "Digital twin / manufacturing certification", status: "unsupported", reason: "No measured hardware loop, manufacturing line, or certified metrology process is implemented." }
  ];
}

function scenarioFromBenchmark(
  id: EngineeringEvidenceScenarioId,
  label: string,
  purpose: string,
  bundle: FdtdBenchmarkExampleBundle
): EngineeringEvidenceScenarioResult {
  const summary = bundle.convergenceSummary;
  const reference = summary.reference;
  const finalRun = summary.runs[summary.runs.length - 1]!;
  return {
    id,
    label,
    purpose,
    referenceModel: reference.referenceModel,
    referenceDescription: reference.invariant,
    evidenceType: "imported-fixture",
    status: summary.status,
    residual: round(summary.trend.finalReferenceResidual),
    convergenceStatus: summary.trend.status,
    pmlStatus: summary.pmlSensitivity.status,
    expected: reference.expected,
    computed: finalRun.imported,
    receipts: {
      sceneHash: summary.sourceScenarioHash,
      sourceScenarioHash: summary.sourceScenarioHash,
      manifestHash: bundle.pack.benchmarkManifest.baseManifestHash,
      scriptHash: bundle.pack.scripts[0]?.export.scriptHash,
      referenceHash: reference.referenceHash,
      summaryHash: summary.summaryHash,
      resultHash: summary.summaryHash
    },
    warnings: summary.warnings,
    unsupported: [],
    notes: [`Benchmark hash ${summary.benchmarkHash}`, `Sweep hash ${summary.sweepHash}`]
  };
}

function scenarioFromAperture(
  id: EngineeringEvidenceScenarioId,
  label: string,
  purpose: string,
  bundle: ApertureValidationExampleBundle
): EngineeringEvidenceScenarioResult {
  const report = bundle.validation;
  return {
    id,
    label,
    purpose,
    referenceModel: report.reference.model,
    referenceDescription: report.reference.invariant,
    evidenceType: "imported-fixture",
    status: report.status,
    residual: round(report.residuals.referenceResidual),
    convergenceStatus: report.convergence.trend,
    pmlStatus: report.warnings.some((warning) => warning.code.includes("pml") || warning.code.includes("PML")) ? "warning" : "pass",
    expected: {
      reflectance: report.reference.apertureOpenFraction !== undefined ? undefined : undefined,
      transmittance: report.imported.transmittance + report.residuals.transmittance,
      absorbance: report.imported.absorbance + report.residuals.absorbance
    },
    computed: {
      reflectance: report.imported.reflectance,
      transmittance: report.imported.transmittance,
      absorbance: report.imported.absorbance
    },
    receipts: {
      sceneHash: report.sceneHash,
      sourceScenarioHash: report.sourceScenarioHash,
      manifestHash: report.manifestHash,
      scriptHash: report.scriptHash,
      referenceHash: report.reference.referenceHash,
      resultHash: report.reportHash,
      summaryHash: report.convergence.convergenceHash
    },
    warnings: report.warnings,
    unsupported: report.classification === "NEEDS_CONVERGENCE" ? ["Finite aperture edge fields need convergence before physical interpretation."] : [],
    notes: [`Classification ${report.classification}`, `Profile RMS ${formatNumber(report.residuals.profileRms)}`]
  };
}

function scenarioFromBench(bundle: OpticalBenchBundle): EngineeringEvidenceScenarioResult {
  const external = bundle.externalEvidence;
  const finalSnapshot = bundle.scalarPreview.snapshots[bundle.scalarPreview.snapshots.length - 1];
  return {
    id: "multielement-chain",
    label: "Multi-element chain",
    purpose: "Ordered optical bench workflow, solver routing, monitor stack, and external evidence receipts",
    referenceModel: "stage-by-stage receipts",
    referenceDescription: "Ordered elements route scalar-capable stages to scalar preview and finite elements to external FDTD evidence receipts.",
    evidenceType: "computed/imported",
    status: bundle.validationReport.computationStatus === "blocked" ? "fail" : bundle.validationReport.warnings.length > 0 ? "warning" : "pass",
    residual: round(Math.abs((external.flux.energyBalance ?? 1) - 1)),
    convergenceStatus: "stage receipts",
    pmlStatus: "n/a",
    expected: { transmittance: 1, peakIntensity: finalSnapshot?.metrics.peakIntensity },
    computed: {
      reflectance: external.flux.reflectance,
      transmittance: external.flux.transmittance,
      absorbance: external.flux.absorbance,
      peakIntensity: finalSnapshot?.metrics.peakIntensity
    },
    receipts: {
      sceneHash: bundle.scene.sceneHash,
      sourceScenarioHash: bundle.fdtdBundle.manifest.sourceScenarioHash,
      manifestHash: bundle.fdtdBundle.manifest.manifestHash,
      scriptHash: bundle.fdtdBundle.script.scriptHash,
      resultHash: bundle.validationReport.reportHash,
      summaryHash: external.imported.receipt.receiptHash
    },
    warnings: bundle.validationReport.warnings,
    unsupported: [],
    notes: [`Solver rows ${bundle.solverPlan.length}`, `Monitor snapshots ${bundle.scalarPreview.snapshots.length}`]
  };
}

function scenarioFromRobust(report: RobustDesignAdvisorReport): EngineeringEvidenceScenarioResult {
  const best = report.bestCandidate;
  const comparison = best?.comparison;
  return {
    id: "robust-candidate",
    label: "Robust candidate before/after",
    purpose: "L8.6 process variation plus L8.7 robust-advisor candidate improvement",
    referenceModel: "L8.7 before/after tolerance metrics",
    referenceDescription: "Best robust candidate is compared against the deterministic-grid baseline pass rate, expected score, and worst-case score.",
    evidenceType: "computed",
    status: comparison && comparison.passRateDelta >= 0 ? "pass" : "warning",
    residual: round(Math.max(0, -(comparison?.passRateDelta ?? 0))),
    convergenceStatus: "tolerance-grid comparison",
    pmlStatus: "n/a",
    expected: {
      passRate: report.baselineEvaluation.passRate,
      worstCaseScore: comparison?.baselineWorstCaseScore,
      expectedScore: comparison?.baselineExpectedScore
    },
    computed: {
      passRate: comparison?.candidatePassRate,
      worstCaseScore: comparison?.candidateWorstCaseScore,
      expectedScore: comparison?.candidateExpectedScore
    },
    receipts: {
      sceneHash: report.baselineSceneHash,
      referenceHash: report.baselineVariationHash,
      resultHash: best?.candidateHash ?? report.reportHash,
      summaryHash: report.reportHash
    },
    warnings: report.warnings,
    unsupported: [],
    notes: [`Best candidate ${best?.label ?? "none"}`, `Remaining failure ${comparison?.topFailureAfter ?? "none"}`]
  };
}

function convergenceFromBenchmark(
  scenarioId: EngineeringEvidenceScenarioId,
  label: string,
  summary: FdtdConvergenceSummary
): EngineeringEvidenceConvergenceRow {
  return {
    scenarioId,
    label,
    runCount: summary.runs.length,
    trend: summary.trend.status,
    finalResidual: round(summary.trend.finalReferenceResidual),
    finalEnergyBalanceError: round(summary.trend.finalEnergyBalanceError),
    pmlSensitivity: round(summary.pmlSensitivity.maxDelta),
    status: summary.status
  };
}

function convergenceFromAperture(
  scenarioId: EngineeringEvidenceScenarioId,
  label: string,
  bundle: ApertureValidationExampleBundle
): EngineeringEvidenceConvergenceRow {
  const report = bundle.validation.convergence;
  return {
    scenarioId,
    label,
    runCount: report.rows.length,
    trend: report.trend,
    finalResidual: round(report.bestResidual),
    finalEnergyBalanceError: round(Math.min(...report.rows.map((row) => row.energyResidual))),
    pmlSensitivity: null,
    status: report.rows.every((row) => row.status === "pass") ? "pass" : report.rows.some((row) => row.status === "fail") ? "fail" : "warning"
  };
}

function toleranceSummaryFromReport(report: ToleranceAnalysisReport, sweepManifestHash: string, sweepSummaryHash: string): EngineeringEvidenceToleranceSummary {
  return {
    label: report.label,
    reportHash: report.reportHash,
    variationHash: report.variationHash,
    passRate: round(report.passRate),
    worstCaseStatus: report.worstCase.status,
    failingCaseCount: report.failingCases.length,
    topSensitivity: report.sensitivity[0]?.label ?? "none",
    sweepManifestHash,
    sweepSummaryHash
  };
}

function robustSummaryFromReport(report: RobustDesignAdvisorReport, sweepManifestHash: string, sweepSummaryHash: string): EngineeringEvidenceRobustSummary {
  const candidate = report.bestCandidate;
  const comparison = candidate?.comparison;
  return {
    label: report.label,
    reportHash: report.reportHash,
    baselinePassRate: round(report.baselineEvaluation.passRate),
    candidatePassRate: round(comparison?.candidatePassRate ?? report.baselineEvaluation.passRate),
    passRateDelta: round(comparison?.passRateDelta ?? 0),
    worstCaseImprovement: round(comparison?.worstCaseImprovement ?? 0),
    expectedImprovement: round(comparison?.expectedImprovement ?? 0),
    bestCandidateLabel: candidate?.label ?? "none",
    candidateHash: candidate?.candidateHash ?? "none",
    sweepManifestHash,
    sweepSummaryHash,
    remainingFailureDriver: comparison?.topFailureAfter ?? "none"
  };
}

function parseScenarioResult(record: Record<string, unknown>): EngineeringEvidenceScenarioResult {
  return {
    id: parseScenarioId(requiredString(record, "id")),
    label: requiredString(record, "label"),
    purpose: requiredString(record, "purpose"),
    referenceModel: requiredString(record, "referenceModel"),
    referenceDescription: requiredString(record, "referenceDescription"),
    evidenceType: requiredString(record, "evidenceType") as EngineeringEvidenceType,
    status: parseStatus(requiredString(record, "status")),
    residual: requiredNumber(record, "residual"),
    convergenceStatus: requiredString(record, "convergenceStatus"),
    pmlStatus: String(record.pmlStatus) as EngineeringEvidenceScenarioResult["pmlStatus"],
    expected: parseMetricSet(parseObject(record.expected, "scenario.expected")),
    computed: parseMetricSet(parseObject(record.computed, "scenario.computed")),
    receipts: parseReceipt(parseObject(record.receipts, "scenario.receipts")),
    warnings: parseWarnings(record.warnings),
    unsupported: requiredArray(record.unsupported, "unsupported").map(String),
    notes: requiredArray(record.notes, "notes").map(String)
  };
}

function parseConvergenceRow(record: Record<string, unknown>): EngineeringEvidenceConvergenceRow {
  return {
    scenarioId: parseScenarioId(requiredString(record, "scenarioId")),
    label: requiredString(record, "label"),
    runCount: requiredNumber(record, "runCount"),
    trend: requiredString(record, "trend"),
    finalResidual: requiredNumber(record, "finalResidual"),
    finalEnergyBalanceError: requiredNumber(record, "finalEnergyBalanceError"),
    pmlSensitivity: record.pmlSensitivity === null ? null : requiredNumber(record, "pmlSensitivity"),
    status: parseStatus(requiredString(record, "status"))
  };
}

function parseToleranceSummary(record: Record<string, unknown>): EngineeringEvidenceToleranceSummary {
  return {
    label: requiredString(record, "label"),
    reportHash: requiredString(record, "reportHash"),
    variationHash: requiredString(record, "variationHash"),
    passRate: requiredNumber(record, "passRate"),
    worstCaseStatus: parseStatus(requiredString(record, "worstCaseStatus")),
    failingCaseCount: requiredNumber(record, "failingCaseCount"),
    topSensitivity: requiredString(record, "topSensitivity"),
    sweepManifestHash: requiredString(record, "sweepManifestHash"),
    sweepSummaryHash: requiredString(record, "sweepSummaryHash")
  };
}

function parseRobustSummary(record: Record<string, unknown>): EngineeringEvidenceRobustSummary {
  return {
    label: requiredString(record, "label"),
    reportHash: requiredString(record, "reportHash"),
    baselinePassRate: requiredNumber(record, "baselinePassRate"),
    candidatePassRate: requiredNumber(record, "candidatePassRate"),
    passRateDelta: requiredNumber(record, "passRateDelta"),
    worstCaseImprovement: requiredNumber(record, "worstCaseImprovement"),
    expectedImprovement: requiredNumber(record, "expectedImprovement"),
    bestCandidateLabel: requiredString(record, "bestCandidateLabel"),
    candidateHash: requiredString(record, "candidateHash"),
    sweepManifestHash: requiredString(record, "sweepManifestHash"),
    sweepSummaryHash: requiredString(record, "sweepSummaryHash"),
    remainingFailureDriver: requiredString(record, "remainingFailureDriver")
  };
}

function parseCapabilityRow(record: Record<string, unknown>): EngineeringEvidenceCapabilityRow {
  return {
    id: requiredString(record, "id"),
    label: requiredString(record, "label"),
    status: requiredString(record, "status") as EngineeringEvidenceCapabilityStatus,
    evidence: requiredString(record, "evidence")
  };
}

function parseUnsupportedItem(record: Record<string, unknown>): EngineeringEvidenceUnsupportedItem {
  return {
    id: requiredString(record, "id"),
    label: requiredString(record, "label"),
    reason: requiredString(record, "reason"),
    status: requiredString(record, "status") as EngineeringEvidenceUnsupportedItem["status"]
  };
}

function parseMetricSet(record: Record<string, unknown>): EngineeringEvidenceMetricSet {
  return {
    reflectance: optionalNumber(record.reflectance),
    transmittance: optionalNumber(record.transmittance),
    absorbance: optionalNumber(record.absorbance),
    peakIntensity: optionalNumber(record.peakIntensity),
    passRate: optionalNumber(record.passRate),
    worstCaseScore: optionalNumber(record.worstCaseScore),
    expectedScore: optionalNumber(record.expectedScore)
  };
}

function parseReceipt(record: Record<string, unknown>): EngineeringEvidenceReceipt {
  return {
    sceneHash: typeof record.sceneHash === "string" ? record.sceneHash : "",
    sourceScenarioHash: typeof record.sourceScenarioHash === "string" ? record.sourceScenarioHash : undefined,
    manifestHash: typeof record.manifestHash === "string" ? record.manifestHash : undefined,
    scriptHash: typeof record.scriptHash === "string" ? record.scriptHash : undefined,
    referenceHash: typeof record.referenceHash === "string" ? record.referenceHash : undefined,
    resultHash: typeof record.resultHash === "string" ? record.resultHash : undefined,
    summaryHash: typeof record.summaryHash === "string" ? record.summaryHash : undefined
  };
}

function parseThresholds(record: Record<string, unknown>): EngineeringEvidenceCampaignManifest["thresholds"] {
  return {
    passResidual: requiredNumber(record, "passResidual"),
    warningResidual: requiredNumber(record, "warningResidual"),
    pmlWarning: requiredNumber(record, "pmlWarning"),
    pmlFail: requiredNumber(record, "pmlFail")
  };
}

function parseScenarioId(id: string): EngineeringEvidenceScenarioId {
  if (!l88ScenarioIds.includes(id as EngineeringEvidenceScenarioId)) throw new Error(`Unsupported L8.8 scenario id: ${id}`);
  return id as EngineeringEvidenceScenarioId;
}

function parseStatus(status: string): EngineeringEvidenceStatus {
  if (status !== "pass" && status !== "warning" && status !== "fail") throw new Error(`Unsupported status: ${status}`);
  return status;
}

function parseWarnings(value: unknown): SolverWarning[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const record = parseObject(item, `warning ${index + 1}`);
    return {
      code: requiredString(record, "code"),
      message: requiredString(record, "message"),
      elementId: typeof record.elementId === "string" ? record.elementId : undefined
    };
  });
}

function parseObject(value: unknown, label: string): Record<string, unknown> {
  if (typeof value === "string") return parseObject(JSON.parse(value) as unknown, label);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function requiredArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function requiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) throw new Error(`${key} must be a non-empty string`);
  return value;
}

function requiredNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${key} must be a finite number`);
  return value;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function summaryForHash(summary: Omit<GoldenEvidenceCampaignSummary, "summaryHash">): unknown {
  return {
    schema: summary.schema,
    campaignId: summary.campaignId,
    manifestHash: summary.manifestHash,
    scenarios: summary.scenarios.map((scenario) => ({
      id: scenario.id,
      status: scenario.status,
      residual: scenario.residual,
      referenceModel: scenario.referenceModel,
      receipts: scenario.receipts
    })),
    convergence: summary.convergence,
    toleranceSummary: summary.toleranceSummary,
    robustSummary: summary.robustSummary,
    capabilityTruthTable: summary.capabilityTruthTable,
    unsupportedItems: summary.unsupportedItems,
    boundary: summary.boundary,
    dossierExports: summary.dossierExports
  };
}

function csvRow(values: Array<string | number | boolean | null | undefined>): string {
  return values.map((value) => csvEscape(value == null ? "" : String(value))).join(",");
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "n/a";
  if (value === 0) return "0";
  if (Math.abs(value) >= 1000 || Math.abs(value) < 0.001) return value.toExponential(4);
  return value.toPrecision(6).replace(/\.?0+$/, "");
}

function formatPercent(value: number): string {
  return `${formatNumber(value * 100)}%`;
}

function round(value: number | undefined): number {
  return Number((value ?? 0).toPrecision(12));
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
