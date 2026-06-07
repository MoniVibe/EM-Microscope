import { fnv1a64, stableStringify } from "../scene/hashScene";
import {
  createCrossSolverConsistencyBench,
  type CrossSolverConsistencyCase,
  type CrossSolverConsistencyCaseId
} from "./crossSolverConsistency";
import {
  createExampleLibraryRegistry,
  exampleLibraryCategoryLabels,
  exampleLibraryPhysicsLabels,
  loadExampleLibraryEntry,
  type ExampleLibraryEntry,
  type ExampleLibraryLoadedExample
} from "./exampleLibrary";

export type AdvisorPacketPresetId =
  | "physics-sanity"
  | "surface-geometry"
  | "solver-credibility"
  | "workflow"
  | "full-current-state"
  | "custom";

export type AdvisorPacketReviewType =
  | "First physics review"
  | "Surface geometry review"
  | "Solver credibility review"
  | "External FDTD review"
  | "2D FDTD / RCWA solver review"
  | "Optical bench workflow review"
  | "Camera / imaging diagnostics review"
  | "Full current-state review";

export type AdvisorClaimStatus = "supported" | "diagnostic" | "unsupported" | "not-implemented";
export type AdvisorClaimCategory = "physics" | "solver" | "workflow" | "diagnostic" | "unsupported";
export type AdvisorCompletenessStatus = "complete" | "warning" | "missing" | "not-applicable";
export type AdvisorScenarioSource = "example-library" | "surface-geometry" | "workflow" | "consistency-bench";
export type AdvisorEvidenceStatus = "available" | "external-required" | "scaffold" | "unsupported";
export type AdvisorReceiptKind = "example" | "route" | "evidence-task" | "consistency-case" | "registry" | "packet" | "scene";

export type AdvisorPacketPreset = {
  id: Exclude<AdvisorPacketPresetId, "custom">;
  label: string;
  reviewType: AdvisorPacketReviewType;
  description: string;
  exampleIds: string[];
  sceneIds: string[];
  consistencyCaseIds: CrossSolverConsistencyCaseId[];
};

export type AdvisorPacketBuildOptions = {
  presetId?: AdvisorPacketPresetId;
  selectedExampleIds?: string[];
  selectedSceneIds?: string[];
  reviewType?: AdvisorPacketReviewType;
  includeConsistencyBench?: boolean;
};

export type AdvisorPacketScenario = {
  schema: "emmicro.advisorPacket.scenario.v1";
  id: string;
  title: string;
  source: AdvisorScenarioSource;
  exampleId?: string;
  category: string;
  solverLabel: string;
  solverId: string;
  routeStatus: string;
  routeHash: string;
  evidenceTaskId: string;
  evidenceTaskHash: string;
  placementSummary: string;
  setupSummary: string;
  expectedResults: string[];
  computedImportedResults: string[];
  residuals: string[];
  convergenceStabilityConsistency: string[];
  limitations: string[];
  unsupportedItems: string[];
  externalEvidenceRequired: boolean;
  runnable: boolean;
  scenarioHash: string;
};

export type AdvisorClaim = {
  schema: "emmicro.advisorPacket.claim.v1";
  id: string;
  text: string;
  category: AdvisorClaimCategory;
  status: AdvisorClaimStatus;
  evidenceReferences: string[];
  limitations: string[];
  relatedScenarioIds: string[];
  claimHash: string;
};

export type AdvisorEvidenceRow = {
  id: string;
  label: string;
  source: string;
  status: AdvisorEvidenceStatus;
  artifactFilenames: string[];
  routeHash: string;
  evidenceHash: string;
  notes: string[];
};

export type AdvisorGapRow = {
  id: string;
  feature: string;
  status: AdvisorClaimStatus;
  evidenceNeeded: string[];
  limitations: string[];
  relatedScenarioIds: string[];
};

export type AdvisorReceipt = {
  id: string;
  label: string;
  kind: AdvisorReceiptKind;
  hash: string;
  source: string;
};

export type AdvisorCompletenessItem = {
  id:
    | "scene-selected"
    | "solver-route-present"
    | "evidence-task-present"
    | "expected-reference-present"
    | "computed-imported-result-present"
    | "residual-present"
    | "convergence-stability-consistency-present"
    | "limitations-present"
    | "unsupported-items-listed"
    | "hashes-receipts-present";
  label: string;
  status: AdvisorCompletenessStatus;
  detail: string;
};

export type AdvisorCompletenessReport = {
  schema: "emmicro.advisorPacket.completeness.v1";
  scorePercent: number;
  items: AdvisorCompletenessItem[];
  summary: {
    complete: number;
    warning: number;
    missing: number;
    notApplicable: number;
  };
  reportHash: string;
};

export type AdvisorReviewPacket = {
  schema: "emmicro.advisorPacket.v1";
  label: "L9.9 Advisor Review Packet / Evidence Dossier Generator";
  version: "L9.9";
  presetId: AdvisorPacketPresetId;
  reviewType: AdvisorPacketReviewType;
  selectedExampleIds: string[];
  selectedSceneIds: string[];
  executiveSummary: string;
  principle: typeof l99AdvisorPacketPrinciple;
  claimsMade: string[];
  claimsNotMade: string[];
  scenarios: AdvisorPacketScenario[];
  consistencyCases: CrossSolverConsistencyCase[];
  evidenceTable: AdvisorEvidenceRow[];
  claimLedger: AdvisorClaim[];
  gaps: AdvisorGapRow[];
  reproducibilityReceipts: AdvisorReceipt[];
  reviewQuestions: string[];
  completeness: AdvisorCompletenessReport;
  boundary: string[];
  packetHash: string;
};

export type AdvisorPacketExportFile = {
  filename: string;
  mime: string;
  content: string;
};

export const l99AdvisorPacketPrinciple =
  "Iteration count is not validation. This packet reports runnable evidence, references, residuals, convergence behavior, and limitations." as const;

export const l99AdvisorPacketBoundary = [
  "L9.9 is an advisor review packet and evidence dossier generator over existing L9.8-L8.9 workflows; it does not add a solver or new optical physics.",
  "The packet reports selected examples, solver routes, evidence tasks, residual/convergence/consistency summaries, limitations, gaps, and receipts; it is not automatic correctness proof.",
  "L9.9 does not provide certified validation, certified solver selection, production RCWA/FDTD certification, arbitrary 3D Maxwell, FEM, BEM, digital twin behavior, lab accreditation, or manufacturing certification.",
  "External FDTD remains an export/import evidence workflow; Meep or other external solvers execute outside the browser and under the user's control.",
  "Unsupported and scaffold items stay listed as gaps or future-work requirements, not executable capability claims."
] as const;

export const advisorPacketPresets: AdvisorPacketPreset[] = [
  {
    id: "physics-sanity",
    label: "Physics Sanity",
    reviewType: "First physics review",
    description: "Scalar diffraction and limiting-case references for a first physics sanity discussion.",
    exampleIds: [
      "scalar-circular-aperture-airy",
      "scalar-long-single-slit",
      "scalar-double-slit-order-spacing",
      "scalar-thin-lens-focal-plane",
      "scalar-coherence-demonstrator"
    ],
    sceneIds: [],
    consistencyCaseIds: ["scalar-fdtd-aperture", "tmm-scalar-lens-not-comparable"]
  },
  {
    id: "surface-geometry",
    label: "Surface Geometry",
    reviewType: "Surface geometry review",
    description: "Finite block, absorber, reflector, aperture, and wedge workflow coverage with external-evidence boundaries.",
    exampleIds: ["external-transparent-finite-block", "external-aperture-blocker"],
    sceneIds: ["surface-absorbing-block", "surface-reflective-plate", "surface-tilted-wedge"],
    consistencyCaseIds: ["tmm-external-fdtd-slab", "absorber-consistency"]
  },
  {
    id: "solver-credibility",
    label: "Solver Credibility",
    reviewType: "Solver credibility review",
    description: "Cross-solver overlap, parity, convergence, and external-evidence checks for bounded solver credibility.",
    exampleIds: [
      "planar-air-glass-interface",
      "rcwa-no-pattern-tmm-consistency",
      "rcwa-binary-grating",
      "fdtd2d-point-source",
      "external-transparent-finite-block",
      "evidence-engineering-campaign"
    ],
    sceneIds: ["consistency-tmm-rcwa", "consistency-cpu-webgpu", "consistency-external-fdtd"],
    consistencyCaseIds: ["tmm-rcwa-no-pattern", "fdtd-cpu-webgpu-parity", "scalar-fdtd-aperture", "tmm-external-fdtd-slab", "rcwa-external-grating-fixture"]
  },
  {
    id: "workflow",
    label: "Workflow / Simulation Intake",
    reviewType: "Optical bench workflow review",
    description: "Simulation intake, ordered bench, solver router, evidence autopack, library, campaign, and gap report workflow coverage.",
    exampleIds: [
      "evidence-engineering-campaign",
      "evidence-process-tolerance-runner",
      "evidence-robust-design-advisor",
      "diagnostic-slanted-edge-mtf",
      "diagnostic-geometric-dot-grid",
      "gap-unsupported-curved-material-lens"
    ],
    sceneIds: ["workflow-build-my-simulation", "workflow-simulation-builder", "workflow-solver-router", "workflow-evidence-autopack", "workflow-example-library"],
    consistencyCaseIds: ["absorber-consistency", "tmm-scalar-lens-not-comparable"]
  },
  {
    id: "full-current-state",
    label: "Full Current-State",
    reviewType: "Full current-state review",
    description: "All L9.8 examples plus workflow, surface, consistency, diagnostic, and unsupported-gap summaries.",
    exampleIds: [],
    sceneIds: [
      "surface-absorbing-block",
      "surface-reflective-plate",
      "surface-tilted-wedge",
      "workflow-build-my-simulation",
      "workflow-simulation-builder",
      "workflow-solver-router",
      "workflow-evidence-autopack",
      "workflow-example-library",
      "consistency-tmm-rcwa",
      "consistency-cpu-webgpu",
      "consistency-external-fdtd"
    ],
    consistencyCaseIds: ["tmm-rcwa-no-pattern", "fdtd-cpu-webgpu-parity", "scalar-fdtd-aperture", "tmm-external-fdtd-slab", "absorber-consistency", "rcwa-external-grating-fixture", "tmm-scalar-lens-not-comparable"]
  }
];

const supplementalScenarioDefinitions: Record<string, Omit<AdvisorPacketScenario, "schema" | "scenarioHash">> = {
  "surface-absorbing-block": supplemental("surface-absorbing-block", "Absorbing block", "surface-geometry", "Surface geometry", "External FDTD / Meep export-import", "external-fdtd-meep", "external-required", "external-run-pack", "external evidence", "Absorbing finite block placed in the x-z bench with monitor and PML extents shown.", "Finite absorber geometry scaffold from the L8.3/L8.9 surface workflow.", ["Transmission/absorption trend is expected to depend on imported external FDTD evidence."], ["External run pack and imported field/flux evidence are required before numeric claims."], ["Residual is not computed in-browser for this finite absorber; external run receipts are required."], ["Absorber consistency case and imported convergence table are the review targets."], ["No production FDTD certification or arbitrary 3D material meshing is implied."], ["full finite absorber validation requires external solver data"], true, false),
  "surface-reflective-plate": supplemental("surface-reflective-plate", "Reflective plate", "surface-geometry", "Surface geometry", "External FDTD / Meep export-import", "external-fdtd-meep", "external-required", "external-run-pack", "external evidence", "Reflective plate or PEC-like boundary placed as a finite surface in the x-z bench.", "Finite reflective geometry scaffold from the L8.3 surface palette.", ["Reflection trend should be reviewed against external solver or bounded 2D FDTD fixtures."], ["Review packet records placement and required evidence; it does not compute a certified PEC validation."], ["Residual must come from imported external or bounded fixture evidence."], ["Consistency should be checked against PEC or reflection fixture evidence when available."], ["No arbitrary curved/freeform reflector or 3D Maxwell solve is implemented."], ["reflective finite-surface production validation requires external evidence"], true, false),
  "surface-tilted-wedge": supplemental("surface-tilted-wedge", "Tilted wedge", "surface-geometry", "Surface geometry", "External FDTD / Meep export-import", "external-fdtd-meep", "external-required", "external-run-pack", "external evidence", "Tilted wedge scene with finite extents and monitor placement summarized for advisor review.", "Wedge is a surface-geometry scaffold that must be exported/imported for numeric finite-geometry evidence.", ["Refraction/reflection trend is expected qualitatively; exact finite wedge fields require external evidence."], ["The packet reports the scene requirement and unsupported/caution status for production claims."], ["Residual is external-only until a run bundle is imported."], ["Convergence is external-only and should include mesh/time-step receipts."], ["Not a validated arbitrary CAD or curved-material optics route."], ["tilted wedge finite-geometry evidence is external-only"], true, false),
  "workflow-build-my-simulation": supplemental("workflow-build-my-simulation", "Build My Simulation wizard", "workflow", "Workflow", "L9.7 Solver Method Decision Wizard", "workflow", "ready", "l97-wizard", "workflow evidence", "Five-question intake places the requested problem onto the bounded method matrix.", "L9.7 simulation intake and generated scene-template workflow.", ["Wizard should produce a deterministic route recommendation and matrix row."], ["Decision report, matrix CSV, generated template, and wizard answer JSON are exported."], ["Residual is not a physics result; route evidence and receipt hashes are the relevant checks."], ["Completeness depends on route checks, generated artifacts, and limitations."], ["The wizard does not certify solver selection or solver correctness."], [], false, true),
  "workflow-simulation-builder": supplemental("workflow-simulation-builder", "Simulation Builder ordered bench", "workflow", "Workflow", "Simulation Builder", "workflow", "ready", "l80-builder", "workflow evidence", "Ordered source, element, target, monitor, and validation summaries for bench review.", "L8-L9 ordered bench workflow with placement and export receipts.", ["Builder should preserve z-ordering, finite extents, monitor placement, and warnings."], ["Scenario JSON, validation report, metrics CSV, and surface/FDTD evidence exports are available."], ["Residual depends on selected validation mode; packet records missing residuals as warnings when absent."], ["Validation and consistency are bounded by selected scene and route."], ["Not a universal optical digital twin or hardware control system."], [], false, true),
  "workflow-solver-router": supplemental("workflow-solver-router", "Solver router", "workflow", "Workflow", "L9.4 Solver Router", "workflow", "ready", "l94-router", "workflow evidence", "Method-selection matrix maps scene features to bounded solver lanes and alternatives.", "L9.4 deterministic router and method matrix workflow.", ["Router should name the recommended solver, alternatives, warnings, and unsupported items."], ["Route report, route JSON, method matrix CSV, and validation plan CSV are available."], ["Residual is not a router concept; advisor should review validation checks and evidence tasks."], ["Consistency is handled by L9.6 where solver assumptions overlap."], ["Router recommendation is not certified solver selection."], [], false, true),
  "workflow-evidence-autopack": supplemental("workflow-evidence-autopack", "Evidence autopack", "workflow", "Workflow", "L9.5 Evidence Auto-Pack", "workflow", "ready", "l95-evidence", "workflow evidence", "Evidence task packs collect required inputs, generated artifacts, validation checks, warnings, and limitations.", "L9.5 evidence manifest over the selected solver route.", ["Evidence pack should expose what inputs are available, missing, external, or not applicable."], ["Solver evidence task report, JSON, artifact CSV, validation plan, inputs, and actions are available."], ["Residual is present when the selected evidence task or consistency case provides it."], ["Convergence/stability/consistency status is taken from evidence tasks and L9.6 cases."], ["Evidence pack is not automatic correctness proof."], [], false, true),
  "workflow-example-library": supplemental("workflow-example-library", "Example library", "workflow", "Workflow", "L9.8 Guided Example Library", "workflow", "ready", "l98-library", "workflow evidence", "Known experiment starter examples load into existing L9.7/L9.4/L9.5/L9.6/RCWA/FDTD/diagnostic workflows.", "L9.8 deterministic registry and loaded-example workflow.", ["Example selection should preserve example, route, evidence, scene, and registry hashes."], ["Example report, registry CSV, scene template, and wizard answers are available."], ["Residual is inherited from evidence task or consistency case rather than from the library itself."], ["Convergence is declared per example and consistency case."], ["Examples are starter workflows, not automatic correctness proofs."], [], false, true),
  "consistency-tmm-rcwa": supplemental("consistency-tmm-rcwa", "TMM vs RCWA no-pattern", "consistency-bench", "Consistency", "L9.6 Cross-Solver Consistency Bench", "planar-tmm + rcwa-1d-preview", "ready", "l96-tmm-rcwa", "consistency evidence", "Uniform-layer/no-pattern overlap case for TMM and RCWA.", "Shared scene compares planar TMM against RCWA in a uniform limit.", ["R/T/A residuals should be within the declared no-pattern tolerance."], ["L9.6 consistency metrics and case hash provide the computed residuals."], ["Residual table is generated by the L9.6 case."], ["Harmonic/no-pattern consistency is the convergence review target."], ["Agreement in this overlap case does not prove production RCWA correctness."], [], false, true),
  "consistency-cpu-webgpu": supplemental("consistency-cpu-webgpu", "CPU vs WebGPU FDTD parity", "consistency-bench", "Consistency", "L9.6 Cross-Solver Consistency Bench", "fdtd-2d-cpu + fdtd-2d-webgpu", "ready", "l96-fdtd-parity", "consistency evidence", "Bounded 2D FDTD state parity between CPU reference and WebGPU/fallback candidate.", "Shared fixture compares deterministic field states after a bounded step count.", ["RMS Ez and energy deltas should stay within the declared parity tolerance for tested scenes."], ["L9.6 parity metrics and L9.2 backend receipts provide computed residuals."], ["Residual table is generated by the L9.6 parity case."], ["Stability and parity are bounded to fixture scenes and step counts."], ["No full 3D Maxwell or production FDTD certification is implied."], [], false, true),
  "consistency-external-fdtd": supplemental("consistency-external-fdtd", "TMM/Fresnel vs external FDTD", "consistency-bench", "Consistency", "L9.6 Cross-Solver Consistency Bench", "planar-tmm + external-fdtd-meep", "external-required", "l96-external-slab", "external consistency evidence", "Planar slab comparison against imported external FDTD evidence.", "External run/import evidence is required to compare finite solver output against a simple reference.", ["Imported flux/R/T/A should agree with the reference within declared external-run tolerances."], ["Bundled/imported external run receipts and L9.6 case rows describe available computed/imported values."], ["Residual is imported or bundled, not produced by in-browser production FDTD."], ["Convergence depends on external mesh/time-step run receipts."], ["External FDTD execution is outside the browser."], ["external FDTD comparison requires external run provenance"], true, false)
};

export function getAdvisorPacketPreset(id: Exclude<AdvisorPacketPresetId, "custom">): AdvisorPacketPreset {
  const preset = advisorPacketPresets.find((item) => item.id === id);
  if (!preset) throw new Error(`Advisor packet preset '${id}' is not registered`);
  return preset;
}

export function createAdvisorReviewPacket(options: AdvisorPacketBuildOptions = {}): AdvisorReviewPacket {
  const registry = createExampleLibraryRegistry();
  const presetId = options.presetId ?? (options.selectedExampleIds?.length ? "custom" : "physics-sanity");
  const preset = presetId === "custom" ? undefined : getAdvisorPacketPreset(presetId);
  const presetExampleIds = preset?.id === "full-current-state" ? registry.entries.map((entry) => entry.id) : preset?.exampleIds ?? [];
  const selectedExampleIds = uniqueStrings(options.selectedExampleIds ?? presetExampleIds);
  const selectedSceneIds = uniqueStrings([...(preset?.sceneIds ?? []), ...(options.selectedSceneIds ?? [])]);
  const loadedExamples = selectedExampleIds.map((id) => loadExampleLibraryEntry(id));
  const includeConsistencyBench = options.includeConsistencyBench ?? true;
  const consistencyBench = includeConsistencyBench ? createCrossSolverConsistencyBench(loadedExamples[0]?.evidenceTask) : undefined;
  const requestedCaseIds = uniqueStrings([
    ...(preset?.consistencyCaseIds ?? []),
    ...loadedExamples.flatMap((loaded) => loaded.example.preferredConsistencyCaseIds)
  ]) as CrossSolverConsistencyCaseId[];
  const consistencyCases = consistencyBench ? selectConsistencyCases(consistencyBench.cases, requestedCaseIds, presetId === "full-current-state") : [];
  const scenarios = [
    ...loadedExamples.map((loaded) => scenarioFromExample(loaded, consistencyCases)),
    ...selectedSceneIds.map((id) => scenarioFromSupplemental(id)),
    ...consistencyCases.map((item) => scenarioFromConsistencyCase(item))
  ];
  const gaps = buildGapRows(scenarios);
  const claimLedger = buildClaimLedger(loadedExamples.map((loaded) => loaded.example), scenarios, consistencyCases, gaps);
  const evidenceTable = buildEvidenceTable(loadedExamples, scenarios, consistencyCases);
  const reproducibilityReceipts = buildReceipts(registry.registryHash, loadedExamples, scenarios, consistencyCases);
  const reviewType = options.reviewType ?? preset?.reviewType ?? "Full current-state review";
  const draft = {
    schema: "emmicro.advisorPacket.v1" as const,
    label: "L9.9 Advisor Review Packet / Evidence Dossier Generator" as const,
    version: "L9.9" as const,
    presetId,
    reviewType,
    selectedExampleIds,
    selectedSceneIds,
    executiveSummary: executiveSummaryFor(presetId, reviewType, scenarios, claimLedger, gaps),
    principle: l99AdvisorPacketPrinciple,
    claimsMade: claimsMadeFor(claimLedger),
    claimsNotMade: claimsNotMadeFor(gaps),
    scenarios,
    consistencyCases,
    evidenceTable,
    claimLedger,
    gaps,
    reproducibilityReceipts,
    reviewQuestions: reviewQuestionsFor(reviewType, scenarios, claimLedger, gaps),
    boundary: [...l99AdvisorPacketBoundary]
  };
  const completeness = evaluateAdvisorPacketCompleteness(draft);
  const packetWithoutHash = { ...draft, completeness };
  return { ...packetWithoutHash, packetHash: hash("advisor-packet", packetForHash(packetWithoutHash)) };
}

export function createAdvisorReviewPacketFromPreset(presetId: Exclude<AdvisorPacketPresetId, "custom">): AdvisorReviewPacket {
  return createAdvisorReviewPacket({ presetId });
}

export function evaluateAdvisorPacketCompleteness(
  packet: Omit<AdvisorReviewPacket, "packetHash" | "completeness"> | Omit<AdvisorReviewPacket, "packetHash"> | AdvisorReviewPacket
): AdvisorCompletenessReport {
  const evidenceScenarios = packet.scenarios.filter((scenario) => scenario.source === "example-library");
  const runnableEvidenceScenarios = evidenceScenarios.filter((scenario) => scenario.runnable && scenario.solverId !== "unsupported");
  const items: AdvisorCompletenessItem[] = [
    item("scene-selected", "scene selected", packet.scenarios.length > 0 ? "complete" : "missing", packet.scenarios.length ? `${packet.scenarios.length} scenarios selected` : "no examples or scenes selected"),
    item(
      "solver-route-present",
      "solver route exists",
      evidenceScenarios.length === 0 ? "not-applicable" : evidenceScenarios.every((scenario) => Boolean(scenario.routeHash)) ? "complete" : "missing",
      evidenceScenarios.length === 0 ? "workflow-only packet has no example route requirement" : `${evidenceScenarios.length} example routes recorded`
    ),
    item(
      "evidence-task-present",
      "evidence task exists",
      evidenceScenarios.length === 0 ? "not-applicable" : evidenceScenarios.every((scenario) => Boolean(scenario.evidenceTaskHash)) ? "complete" : "missing",
      evidenceScenarios.length === 0 ? "workflow-only packet has no example evidence task requirement" : `${evidenceScenarios.length} evidence task hashes recorded`
    ),
    item(
      "expected-reference-present",
      "reference/expected result exists",
      packet.scenarios.every((scenario) => scenario.expectedResults.length > 0) ? "complete" : "missing",
      "expected physics or review target is listed for each scenario"
    ),
    item(
      "computed-imported-result-present",
      "computed/imported result exists",
      packet.scenarios.every((scenario) => scenario.computedImportedResults.length > 0) ? "complete" : "warning",
      "computed/imported result summaries or required evidence outputs are listed"
    ),
    item(
      "residual-present",
      "residual present",
      runnableEvidenceScenarios.length === 0 ? "not-applicable" : runnableEvidenceScenarios.every((scenario) => scenario.residuals.length > 0) ? "complete" : "warning",
      runnableEvidenceScenarios.length === 0 ? "no runnable example scenario requires residuals" : "runnable selected examples include residual or validation-residual references"
    ),
    item(
      "convergence-stability-consistency-present",
      "convergence or stability present",
      runnableEvidenceScenarios.length === 0 ? "not-applicable" : runnableEvidenceScenarios.every((scenario) => scenario.convergenceStabilityConsistency.length > 0) ? "complete" : "warning",
      runnableEvidenceScenarios.length === 0 ? "no runnable example scenario requires convergence/stability evidence" : "runnable selected examples include convergence, stability, or consistency notes"
    ),
    item(
      "limitations-present",
      "limitations present",
      packet.scenarios.every((scenario) => scenario.limitations.length > 0) && packet.claimLedger.every((claim) => claim.limitations.length > 0) ? "complete" : "warning",
      "scenario and claim limitations are populated"
    ),
    item(
      "unsupported-items-listed",
      "unsupported items listed",
      packet.gaps.length > 0 && packet.claimLedger.some((claim) => claim.status === "unsupported" || claim.status === "not-implemented") ? "complete" : "warning",
      `${packet.gaps.length} gap rows and unsupported/not-implemented claims recorded`
    ),
    item(
      "hashes-receipts-present",
      "hashes/receipts present",
      packet.reproducibilityReceipts.length > 0 && packet.reproducibilityReceipts.every((receipt) => Boolean(receipt.hash)) ? "complete" : "missing",
      `${packet.reproducibilityReceipts.length} reproducibility receipts recorded`
    )
  ];
  const summary = {
    complete: items.filter((entry) => entry.status === "complete").length,
    warning: items.filter((entry) => entry.status === "warning").length,
    missing: items.filter((entry) => entry.status === "missing").length,
    notApplicable: items.filter((entry) => entry.status === "not-applicable").length
  };
  const applicable = items.length - summary.notApplicable;
  const scorePercent = applicable > 0 ? Math.round((summary.complete / applicable) * 100) : 100;
  const draft = {
    schema: "emmicro.advisorPacket.completeness.v1" as const,
    scorePercent,
    items,
    summary
  };
  return { ...draft, reportHash: hash("advisor-completeness", draft) };
}

export function advisorPacketMarkdown(packet: AdvisorReviewPacket): string {
  return [
    "# L9.9 Advisor Review Packet / Evidence Dossier",
    "",
    `Review type: ${packet.reviewType}`,
    `Preset: ${packet.presetId}`,
    `Packet hash: ${packet.packetHash}`,
    `Completeness: ${packet.completeness.scorePercent}%`,
    "",
    packet.principle,
    "",
    "## 1. Executive Summary",
    "",
    packet.executiveSummary,
    "",
    "## 2. Claims Being Made",
    "",
    ...packet.claimsMade.map((claim) => `- ${claim}`),
    "",
    "## 3. Claims Not Being Made",
    "",
    ...packet.claimsNotMade.map((claim) => `- ${claim}`),
    "",
    "## 4. Selected Examples/Scenes",
    "",
    ...packet.scenarios.flatMap((scenario) => [
      `### ${scenario.title}`,
      "",
      `Source: ${scenario.source}`,
      `Solver: ${scenario.solverLabel} (${scenario.solverId})`,
      `Route status: ${scenario.routeStatus}`,
      `Route hash: ${scenario.routeHash}`,
      `Evidence task hash: ${scenario.evidenceTaskHash}`,
      `Scenario hash: ${scenario.scenarioHash}`,
      "",
      scenario.setupSummary,
      ""
    ]),
    "## 5. Physical Setup Diagrams / Placement Summaries",
    "",
    ...packet.scenarios.map((scenario) => `- ${scenario.title}: ${scenario.placementSummary}`),
    "",
    "## 6. Solver Route Decisions",
    "",
    "| Scenario | Solver | Route status | Route hash |",
    "| --- | --- | --- | --- |",
    ...packet.scenarios.map((scenario) => `| ${scenario.title} | ${scenario.solverLabel} | ${scenario.routeStatus} | ${scenario.routeHash} |`),
    "",
    "## 7. Evidence Artifacts",
    "",
    "| Evidence | Status | Artifacts | Hash |",
    "| --- | --- | --- | --- |",
    ...packet.evidenceTable.map((row) => `| ${row.label} | ${row.status} | ${row.artifactFilenames.join("; ")} | ${row.evidenceHash} |`),
    "",
    "## 8. Expected vs Computed/Imported Results",
    "",
    ...packet.scenarios.flatMap((scenario) => [
      `### ${scenario.title}`,
      "",
      "Expected/reference:",
      ...scenario.expectedResults.map((entry) => `- ${entry}`),
      "",
      "Computed/imported/evidence target:",
      ...scenario.computedImportedResults.map((entry) => `- ${entry}`),
      ""
    ]),
    "## 9. Convergence / Stability / Consistency Checks",
    "",
    ...packet.scenarios.flatMap((scenario) => [
      `### ${scenario.title}`,
      "",
      ...(scenario.residuals.length ? scenario.residuals.map((entry) => `- Residual: ${entry}`) : ["- Residual: not applicable or awaiting external evidence."]),
      ...scenario.convergenceStabilityConsistency.map((entry) => `- Check: ${entry}`),
      ""
    ]),
    "## 10. Tolerance / Robustness Evidence If Included",
    "",
    ...packet.evidenceTable.filter((row) => /tolerance|robust|campaign|consistency/i.test(`${row.label} ${row.notes.join(" ")}`)).map((row) => `- ${row.label}: ${row.notes.join("; ")}`),
    "",
    "## 11. Unsupported / Scaffold / Future-Work Items",
    "",
    "| Feature | Status | Evidence needed |",
    "| --- | --- | --- |",
    ...packet.gaps.map((gap) => `| ${gap.feature} | ${gap.status} | ${gap.evidenceNeeded.join("; ")} |`),
    "",
    "## 12. Reproducibility Receipts",
    "",
    "| Receipt | Kind | Hash | Source |",
    "| --- | --- | --- | --- |",
    ...packet.reproducibilityReceipts.map((receipt) => `| ${receipt.label} | ${receipt.kind} | ${receipt.hash} | ${receipt.source} |`),
    "",
    "## 13. Review Questions For Advisor",
    "",
    ...packet.reviewQuestions.map((question) => `- ${question}`),
    "",
    "## Claim Ledger",
    "",
    "| Claim | Status | Evidence | Limitations |",
    "| --- | --- | --- | --- |",
    ...packet.claimLedger.map((claim) => `| ${claim.text} | ${claim.status} | ${claim.evidenceReferences.join("; ")} | ${claim.limitations.join("; ")} |`),
    "",
    "## Completeness",
    "",
    "| Item | Status | Detail |",
    "| --- | --- | --- |",
    ...packet.completeness.items.map((entry) => `| ${entry.label} | ${entry.status} | ${entry.detail} |`),
    "",
    "## Boundary",
    "",
    ...packet.boundary.map((entry) => `- ${entry}`)
  ].join("\n");
}

export function advisorPacketJson(packet: AdvisorReviewPacket): string {
  return `${JSON.stringify(packet, null, 2)}\n`;
}

export function advisorPacketSummaryCsv(packet: AdvisorReviewPacket): string {
  return [
    "packet_hash,preset,review_type,completeness,scenarios,claims,gaps,evidence_rows,receipts",
    csvRow([
      packet.packetHash,
      packet.presetId,
      packet.reviewType,
      packet.completeness.scorePercent,
      packet.scenarios.length,
      packet.claimLedger.length,
      packet.gaps.length,
      packet.evidenceTable.length,
      packet.reproducibilityReceipts.length
    ])
  ].join("\n");
}

export function advisorClaimLedgerCsv(packet: AdvisorReviewPacket): string {
  return [
    "claim_id,claim,status,category,evidence_references,limitations,related_scenarios,claim_hash",
    ...packet.claimLedger.map((claim) =>
      csvRow([claim.id, claim.text, claim.status, claim.category, claim.evidenceReferences.join(";"), claim.limitations.join(";"), claim.relatedScenarioIds.join(";"), claim.claimHash])
    )
  ].join("\n");
}

export function advisorEvidenceTableCsv(packet: AdvisorReviewPacket): string {
  return [
    "evidence_id,label,source,status,artifact_filenames,route_hash,evidence_hash,notes",
    ...packet.evidenceTable.map((row) =>
      csvRow([row.id, row.label, row.source, row.status, row.artifactFilenames.join(";"), row.routeHash, row.evidenceHash, row.notes.join(";")])
    )
  ].join("\n");
}

export function advisorGapTableCsv(packet: AdvisorReviewPacket): string {
  return [
    "gap_id,feature,status,evidence_needed,limitations,related_scenarios",
    ...packet.gaps.map((gap) =>
      csvRow([gap.id, gap.feature, gap.status, gap.evidenceNeeded.join(";"), gap.limitations.join(";"), gap.relatedScenarioIds.join(";")])
    )
  ].join("\n");
}

export function advisorReviewQuestionsMarkdown(packet: AdvisorReviewPacket): string {
  return [
    "# L9.9 Advisor Review Questions",
    "",
    `Packet hash: ${packet.packetHash}`,
    "",
    ...packet.reviewQuestions.map((question) => `- ${question}`)
  ].join("\n");
}

export function advisorReproducibilityManifestJson(packet: AdvisorReviewPacket): string {
  return `${JSON.stringify(
    {
      schema: "emmicro.advisorPacket.reproducibilityManifest.v1",
      packetHash: packet.packetHash,
      presetId: packet.presetId,
      reviewType: packet.reviewType,
      receipts: packet.reproducibilityReceipts,
      selectedExampleIds: packet.selectedExampleIds,
      selectedSceneIds: packet.selectedSceneIds,
      completenessHash: packet.completeness.reportHash,
      boundary: packet.boundary
    },
    null,
    2
  )}\n`;
}

export function advisorPacketHtml(packet: AdvisorReviewPacket): string {
  const markdown = advisorPacketMarkdown(packet)
    .split("\n")
    .map((line) => escapeHtml(line))
    .join("<br>\n");
  return [
    "<!doctype html>",
    "<html>",
    "<head>",
    "<meta charset=\"utf-8\">",
    "<title>L9.9 Advisor Review Packet</title>",
    "<style>body{font-family:Arial,sans-serif;line-height:1.45;margin:32px;color:#10243a}code,pre{font-family:Consolas,monospace}.boundary{color:#6a3b00}</style>",
    "</head>",
    "<body>",
    markdown,
    "</body>",
    "</html>"
  ].join("\n");
}

export function advisorPacketExportFiles(packet: AdvisorReviewPacket): AdvisorPacketExportFile[] {
  return [
    file("advisor_packet.md", "text/markdown", `${advisorPacketMarkdown(packet)}\n`),
    file("advisor_packet.json", "application/json", advisorPacketJson(packet)),
    file("advisor_packet_summary.csv", "text/csv", `${advisorPacketSummaryCsv(packet)}\n`),
    file("advisor_claim_ledger.csv", "text/csv", `${advisorClaimLedgerCsv(packet)}\n`),
    file("advisor_evidence_table.csv", "text/csv", `${advisorEvidenceTableCsv(packet)}\n`),
    file("advisor_gap_table.csv", "text/csv", `${advisorGapTableCsv(packet)}\n`),
    file("advisor_review_questions.md", "text/markdown", `${advisorReviewQuestionsMarkdown(packet)}\n`),
    file("advisor_reproducibility_manifest.json", "application/json", advisorReproducibilityManifestJson(packet)),
    file("advisor_packet.html", "text/html", `${advisorPacketHtml(packet)}\n`)
  ];
}

function scenarioFromExample(loaded: ExampleLibraryLoadedExample, consistencyCases: CrossSolverConsistencyCase[]): AdvisorPacketScenario {
  const example = loaded.example;
  const relatedCases = consistencyCases.filter((item) => example.preferredConsistencyCaseIds.includes(item.id));
  const computedImportedResults = [
    `Route decision: ${loaded.routeDecision.recommendedSolverLabel} (${loaded.routeDecision.status})`,
    `Evidence task: ${loaded.evidenceTask.label}`,
    ...loaded.evidenceTask.generatedArtifacts.map((artifact) => `${artifact.filename}: ${artifact.purpose}`),
    ...example.expectedOutputs.map((output) => `Expected output target: ${output}`)
  ];
  const residuals = [
    ...loaded.evidenceTask.validationChecks.map((check) => `${check.label} (${check.status}): ${check.description}`),
    ...relatedCases.flatMap((item) => item.metrics.map((metric) => `${item.label} / ${metric.label}: residual ${formatMetric(metric.residual)} tolerance ${formatMetric(metric.tolerance)} ${metric.units}`))
  ];
  const convergence = [
    ...(example.hasConvergenceEvidence ? ["Example declares convergence evidence in the L9.8 registry."] : []),
    ...relatedCases.map((item) => `${item.label}: ${item.status} - ${item.statusReason}`),
    ...loaded.evidenceTask.requiredInputs.map((input) => `${input.label}: ${input.status}`)
  ];
  return finalizeScenario({
    id: `example-${example.id}`,
    title: example.title,
    source: "example-library",
    exampleId: example.id,
    category: `${exampleLibraryCategoryLabels[example.category]} / ${exampleLibraryPhysicsLabels[example.physicsType]}`,
    solverLabel: loaded.routeDecision.recommendedSolverLabel,
    solverId: loaded.routeDecision.recommendedSolver,
    routeStatus: loaded.routeDecision.status,
    routeHash: loaded.routeDecision.resultHash,
    evidenceTaskId: loaded.evidenceTask.id,
    evidenceTaskHash: loaded.evidenceTask.taskHash,
    placementSummary: placementSummaryForExample(example),
    setupSummary: example.setupSummary,
    expectedResults: example.expectedPhysics,
    computedImportedResults,
    residuals,
    convergenceStabilityConsistency: convergence.length ? convergence : ["Evidence task records route validation inputs; no universal convergence claim is made."],
    limitations: uniqueStrings([...example.limitations, ...loaded.evidenceTask.limitations]),
    unsupportedItems: uniqueStrings([...loaded.evidenceTask.unsupportedFeatures, ...(example.unsupported ? example.limitations : [])]),
    externalEvidenceRequired: example.externalEvidenceRequired,
    runnable: example.runnableInBrowser
  });
}

function scenarioFromSupplemental(id: string): AdvisorPacketScenario {
  const definition = supplementalScenarioDefinitions[id];
  if (!definition) throw new Error(`Advisor packet supplemental scene '${id}' is not registered`);
  return finalizeScenario(definition);
}

function scenarioFromConsistencyCase(item: CrossSolverConsistencyCase): AdvisorPacketScenario {
  return finalizeScenario({
    id: `consistency-${item.id}`,
    title: item.label,
    source: "consistency-bench",
    category: "Cross-solver consistency",
    solverLabel: item.comparedSolvers.join(" vs "),
    solverId: item.comparedSolvers.join("+"),
    routeStatus: item.status,
    routeHash: item.caseHash,
    evidenceTaskId: item.evidenceTaskHashes.join(";") || "l96-consistency-case",
    evidenceTaskHash: item.caseHash,
    placementSummary: item.sharedScene,
    setupSummary: item.assumptions.join(" "),
    expectedResults: item.requiredEvidence.length ? item.requiredEvidence : [item.statusReason],
    computedImportedResults: item.metrics.length ? item.metrics.map((metric) => `${metric.label}: ${formatMetric(metric.valueA)} vs ${formatMetric(metric.valueB)} (${metric.status})`) : [item.statusReason],
    residuals: item.metrics.length ? item.metrics.map((metric) => `${metric.label}: residual ${formatMetric(metric.residual)} tolerance ${formatMetric(metric.tolerance)} ${metric.units}`) : [`Guardrail status: ${item.status}`],
    convergenceStabilityConsistency: [`${item.status}: ${item.statusReason}`, ...item.warnings.map((warning) => warning.message)],
    limitations: [...item.boundary, ...item.assumptions],
    unsupportedItems: item.status === "NOT COMPARABLE" || item.status === "NEEDS EXTERNAL EVIDENCE" ? item.requiredEvidence : [],
    externalEvidenceRequired: item.status === "NEEDS EXTERNAL EVIDENCE",
    runnable: item.status !== "NEEDS EXTERNAL EVIDENCE"
  });
}

function finalizeScenario(draft: Omit<AdvisorPacketScenario, "schema" | "scenarioHash">): AdvisorPacketScenario {
  const scenario = { schema: "emmicro.advisorPacket.scenario.v1" as const, ...draft };
  return { ...scenario, scenarioHash: hash("advisor-scenario", scenarioForHash(scenario)) };
}

function buildClaimLedger(
  examples: ExampleLibraryEntry[],
  scenarios: AdvisorPacketScenario[],
  consistencyCases: CrossSolverConsistencyCase[],
  gaps: AdvisorGapRow[]
): AdvisorClaim[] {
  const scenarioIds = new Set(scenarios.map((scenario) => scenario.id));
  const exampleIds = new Set(examples.map((example) => example.id));
  const caseIds = new Set(consistencyCases.map((item) => item.id));
  const claims: Array<Omit<AdvisorClaim, "schema" | "claimHash">> = [];

  if (exampleIds.has("scalar-circular-aperture-airy")) claims.push(claim("scalar-airy-bessel", "Circular aperture scalar validation matches Airy/Bessel reference", "physics", "supported", ["scalar-circular-aperture-airy", "scalar-validation"], ["Scalar diffraction approximation only; not vector high-NA or arbitrary 3D Maxwell."], ["example-scalar-circular-aperture-airy"]));
  if (exampleIds.has("scalar-long-single-slit")) claims.push(claim("scalar-long-slit", "Long slit scalar validation gives expected minima", "physics", "supported", ["scalar-long-single-slit", "sinc^2 validation reference"], ["Ideal scalar slit model only; no finite-thickness material aperture is certified."], ["example-scalar-long-single-slit"]));
  if (exampleIds.has("scalar-double-slit-order-spacing")) claims.push(claim("scalar-double-slit", "Double slit order spacing follows the selected scalar interference reference", "physics", "supported", ["scalar-double-slit-order-spacing", "order-spacing validation"], ["Coherent ideal-aperture assumptions only."], ["example-scalar-double-slit-order-spacing"]));
  if (exampleIds.has("scalar-thin-lens-focal-plane")) claims.push(claim("scalar-thin-lens", "Ideal thin-lens focal-plane packet is available as a scalar reference", "physics", "supported", ["scalar-thin-lens-focal-plane", "thin-lens focal validation"], ["Zero-thickness scalar phase model only; no real thick lens or CAD material lens is solved."], ["example-scalar-thin-lens-focal-plane"]));
  if (examples.some((example) => example.solverLane === "planar-tmm")) claims.push(claim("planar-tmm-rta", "Planar coating uses TMM R/T/A path", "solver", "supported", ["PlanarTmmBackend", "tmm-report", "planar-air-glass-interface"], ["Laterally invariant planar stack only; no finite roughness, freeform optics, or production certification."], scenarios.filter((scenario) => scenario.solverId === "planar-tmm").map((scenario) => scenario.id)));
  if (examples.some((example) => example.solverLane === "rcwa-1d-preview")) claims.push(claim("rcwa-preview-bounded", "1D RCWA preview produces bounded order/energy/convergence evidence", "solver", "diagnostic", ["rcwa-binary-grating", "rcwa-convergence", "rcwa_tmm_consistency.csv"], ["Preview solver only; not arbitrary 2D periodic, conical, anisotropic, or production RCWA certification."], scenarios.filter((scenario) => scenario.solverId === "rcwa-1d-preview").map((scenario) => scenario.id)));
  if (examples.some((example) => example.solverLane === "fdtd-2d-cpu")) claims.push(claim("fdtd2d-browser", "2D FDTD runs in browser", "solver", "supported", ["L9.0-L9.2 sandbox evidence", "fdtd2d-validation"], ["Bounded TMz 2D fixture sandbox only; not full 3D Maxwell or production FDTD."], scenarios.filter((scenario) => scenario.solverId === "fdtd-2d-cpu").map((scenario) => scenario.id)));
  if (caseIds.has("fdtd-cpu-webgpu-parity")) claims.push(claim("fdtd-webgpu-parity", "WebGPU FDTD matches CPU reference for tested scenes", "solver", "supported", ["fdtd-cpu-webgpu-parity", "fdtd2d parity report"], ["Supported only for the deterministic fixtures and tolerances represented by the parity bench."], ["consistency-fdtd-cpu-webgpu-parity", "consistency-cpu-webgpu"].filter((id) => scenarioIds.has(id))));
  if (examples.some((example) => example.solverLane === "external-fdtd-meep")) claims.push(claim("external-fdtd-import", "External FDTD can be run/imported", "workflow", "supported", ["L8.9 run-pack/import evidence", "external-fdtd-run-pack"], ["Execution remains external; browser only exports, imports, validates receipts, and reports evidence."], scenarios.filter((scenario) => scenario.solverId === "external-fdtd-meep").map((scenario) => scenario.id)));
  if (examples.some((example) => example.category === "camera-diagnostics")) claims.push(claim("camera-diagnostics", "Camera/imaging diagnostics can package measured-image QA evidence", "diagnostic", "diagnostic", ["diagnostic workbenches", "slanted-edge MTF", "dot-grid calibration"], ["Diagnostics are scaffolded QA workflows, not ISO/EMVA certification or calibrated lab metrology."], scenarios.filter((scenario) => scenario.category.includes("Camera")).map((scenario) => scenario.id)));
  if (examples.some((example) => example.category === "evidence-robustness")) claims.push(claim("engineering-evidence-campaign", "Engineering evidence campaign and robustness workflows can summarize existing evidence", "workflow", "diagnostic", ["L8.8 campaign", "process tolerance runner", "robust design advisor"], ["Campaigns organize evidence and warnings; they do not manufacture validation or replace physical metrology."], scenarios.filter((scenario) => scenario.category.includes("Evidence")).map((scenario) => scenario.id)));

  claims.push(claim("iteration-count-not-validation", l99AdvisorPacketPrinciple, "workflow", "diagnostic", ["completeness checker", "claim ledger", "reproducibility receipts"], ["The packet reports evidence presence and limitations; advisor review remains required."], scenarios.map((scenario) => scenario.id)));
  claims.push(claim("arbitrary-3d-maxwell-unsupported", "Arbitrary 3D Maxwell runs in browser", "unsupported", "unsupported", ["none"], ["No arbitrary 3D Maxwell/FDTD/FEM/BEM execution is implemented."], relatedGapScenarioIds(gaps, "3D Maxwell")));
  claims.push(claim("fem-bem-not-implemented", "FEM/BEM solver exists", "unsupported", "not-implemented", ["none"], ["No FEM or BEM backend exists in this app."], relatedGapScenarioIds(gaps, "FEM/BEM")));
  claims.push(claim("certified-validation-not-implemented", "Certified validation report or automatic correctness proof exists", "unsupported", "not-implemented", ["none"], ["The packet is review/reporting workflow only, not certification."], relatedGapScenarioIds(gaps, "Certified validation")));

  return uniqueClaims(claims).map((entry) => {
    const draft = { schema: "emmicro.advisorPacket.claim.v1" as const, ...entry };
    return { ...draft, claimHash: hash("advisor-claim", claimForHash(draft)) };
  });
}

function buildEvidenceTable(loadedExamples: ExampleLibraryLoadedExample[], scenarios: AdvisorPacketScenario[], consistencyCases: CrossSolverConsistencyCase[]): AdvisorEvidenceRow[] {
  const exampleRows = loadedExamples.map((loaded) => ({
    id: `evidence-${loaded.example.id}`,
    label: loaded.evidenceTask.label,
    source: loaded.example.title,
    status: evidenceStatusFor(loaded),
    artifactFilenames: loaded.evidenceTask.generatedArtifacts.map((artifact) => artifact.filename),
    routeHash: loaded.routeDecision.resultHash,
    evidenceHash: loaded.evidenceTask.taskHash,
    notes: [
      loaded.evidenceTask.why.join("; "),
      ...loaded.evidenceTask.warnings,
      ...loaded.evidenceTask.limitations.slice(0, 2)
    ].filter(Boolean)
  }));
  const consistencyRows = consistencyCases.map((item) => ({
    id: `evidence-consistency-${item.id}`,
    label: item.label,
    source: "L9.6 Cross-Solver Consistency Bench",
    status: item.status === "NEEDS EXTERNAL EVIDENCE" ? "external-required" as const : item.status === "NOT COMPARABLE" ? "scaffold" as const : "available" as const,
    artifactFilenames: ["cross_solver_consistency_report.md", "consistency_metrics.csv", "solver_pair_residuals.csv"],
    routeHash: item.caseHash,
    evidenceHash: item.caseHash,
    notes: [item.statusReason, ...item.requiredEvidence]
  }));
  const supplementalRows = scenarios
    .filter((scenario) => scenario.source !== "example-library" && scenario.source !== "consistency-bench")
    .map((scenario) => ({
      id: `evidence-${scenario.id}`,
      label: scenario.title,
      source: scenario.source,
      status: scenario.externalEvidenceRequired ? "external-required" as const : "scaffold" as const,
      artifactFilenames: ["advisor_packet.md", "advisor_reproducibility_manifest.json"],
      routeHash: scenario.routeHash,
      evidenceHash: scenario.evidenceTaskHash,
      notes: scenario.computedImportedResults
    }));
  return uniqueById([...exampleRows, ...consistencyRows, ...supplementalRows]);
}

function buildGapRows(scenarios: AdvisorPacketScenario[]): AdvisorGapRow[] {
  const scenarioGaps = scenarios
    .filter((scenario) => scenario.unsupportedItems.length > 0 || scenario.externalEvidenceRequired || scenario.solverId === "unsupported")
    .map((scenario) => ({
      id: `gap-${safeId(scenario.id)}`,
      feature: `${scenario.title} evidence boundary`,
      status: scenario.solverId === "unsupported" ? "unsupported" as const : "diagnostic" as const,
      evidenceNeeded: scenario.unsupportedItems.length ? scenario.unsupportedItems : ["external run/import receipts", "mesh/time-step convergence evidence", "advisor-reviewed residual table"],
      limitations: scenario.limitations,
      relatedScenarioIds: [scenario.id]
    }));
  const globalGaps: AdvisorGapRow[] = [
    {
      id: "gap-arbitrary-3d-maxwell",
      feature: "Arbitrary 3D Maxwell",
      status: "unsupported",
      evidenceNeeded: ["validated 3D Maxwell solver", "3D geometry meshing", "material model validation", "benchmark residuals and convergence"],
      limitations: ["No arbitrary 3D Maxwell execution is implemented in the browser."],
      relatedScenarioIds: scenarios.filter((scenario) => /3D|CAD|curved|gap/i.test(`${scenario.title} ${scenario.unsupportedItems.join(" ")}`)).map((scenario) => scenario.id)
    },
    {
      id: "gap-fem-bem",
      feature: "FEM/BEM solver",
      status: "not-implemented",
      evidenceNeeded: ["FEM/BEM backend", "mesh validation", "solver residuals", "benchmark suite"],
      limitations: ["No FEM or BEM backend exists in this app."],
      relatedScenarioIds: []
    },
    {
      id: "gap-certified-validation",
      feature: "Certified validation report / automatic correctness proof",
      status: "not-implemented",
      evidenceNeeded: ["independent V&V plan", "metrology process", "review signoff", "traceable calibration evidence"],
      limitations: ["L9.9 generates review packets only; it is not certification."],
      relatedScenarioIds: []
    },
    {
      id: "gap-production-rcwa-fdtd",
      feature: "Production RCWA/FDTD certification",
      status: "not-implemented",
      evidenceNeeded: ["production solver qualification", "larger benchmark suite", "external reproducibility receipts", "advisor acceptance criteria"],
      limitations: ["RCWA and FDTD workflows are bounded previews, diagnostics, and external run/import evidence."],
      relatedScenarioIds: []
    },
    {
      id: "gap-digital-twin-manufacturing",
      feature: "Digital twin / manufacturing certification",
      status: "not-implemented",
      evidenceNeeded: ["hardware control", "process metrology", "lab accreditation", "manufacturing QA process"],
      limitations: ["No digital twin or manufacturing certification workflow is implemented."],
      relatedScenarioIds: []
    }
  ];
  return uniqueById([...scenarioGaps, ...globalGaps]);
}

function buildReceipts(
  registryHash: string,
  loadedExamples: ExampleLibraryLoadedExample[],
  scenarios: AdvisorPacketScenario[],
  consistencyCases: CrossSolverConsistencyCase[]
): AdvisorReceipt[] {
  return uniqueById([
    { id: "receipt-l98-registry", label: "L9.8 example registry", kind: "registry" as const, hash: registryHash, source: "createExampleLibraryRegistry" },
    ...loadedExamples.flatMap((loaded) => [
      { id: `receipt-example-${loaded.example.id}`, label: loaded.example.title, kind: "example" as const, hash: loaded.example.exampleHash, source: loaded.example.id },
      { id: `receipt-route-${loaded.example.id}`, label: `${loaded.example.title} route`, kind: "route" as const, hash: loaded.routeDecision.resultHash, source: loaded.routeDecision.recommendedSolver },
      { id: `receipt-evidence-${loaded.example.id}`, label: `${loaded.example.title} evidence task`, kind: "evidence-task" as const, hash: loaded.evidenceTask.taskHash, source: loaded.evidenceTask.taskType }
    ]),
    ...scenarios.map((scenario) => ({ id: `receipt-scenario-${scenario.id}`, label: scenario.title, kind: "scene" as const, hash: scenario.scenarioHash, source: scenario.source })),
    ...consistencyCases.map((item) => ({ id: `receipt-consistency-${item.id}`, label: item.label, kind: "consistency-case" as const, hash: item.caseHash, source: "L9.6 Cross-Solver Consistency Bench" }))
  ]);
}

function executiveSummaryFor(
  presetId: AdvisorPacketPresetId,
  reviewType: AdvisorPacketReviewType,
  scenarios: AdvisorPacketScenario[],
  claims: AdvisorClaim[],
  gaps: AdvisorGapRow[]
): string {
  const supported = claims.filter((claim) => claim.status === "supported").length;
  const diagnostic = claims.filter((claim) => claim.status === "diagnostic").length;
  const unsupported = claims.filter((claim) => claim.status === "unsupported" || claim.status === "not-implemented").length;
  return `This ${reviewType} packet was generated from preset '${presetId}' with ${scenarios.length} selected examples/scenes, ${supported} supported claims, ${diagnostic} diagnostic claims, ${unsupported} unsupported/not-implemented claims, and ${gaps.length} gap rows. It is intended for engineering review of what was modeled, which method was routed, what evidence exists, and what remains unsupported.`;
}

function claimsMadeFor(claims: AdvisorClaim[]): string[] {
  return claims
    .filter((claim) => claim.status === "supported" || claim.status === "diagnostic")
    .map((claim) => `${claim.text} (${claim.status})`);
}

function claimsNotMadeFor(gaps: AdvisorGapRow[]): string[] {
  return uniqueStrings([
    "Automatic correctness proof is not claimed.",
    "Certified validation is not claimed.",
    "Certified solver selection is not claimed.",
    "Production RCWA/FDTD certification is not claimed.",
    "Arbitrary 3D Maxwell, FEM, and BEM execution are not claimed.",
    "Digital twin or manufacturing certification is not claimed.",
    ...gaps.map((gap) => `${gap.feature}: ${gap.status}`)
  ]);
}

function reviewQuestionsFor(
  reviewType: AdvisorPacketReviewType,
  scenarios: AdvisorPacketScenario[],
  claims: AdvisorClaim[],
  gaps: AdvisorGapRow[]
): string[] {
  return [
    `For this ${reviewType}, are the selected scenarios sufficient for the next engineering review?`,
    "Which claims need stronger numeric residuals or imported external evidence before they can be treated as supported?",
    "Are the listed limitations explicit enough to prevent certification or universal-correctness overclaiming?",
    "Which unsupported gaps should be converted into external run packs, benchmarks, or future solver work?",
    `Do the ${scenarios.length} scenario receipts and ${claims.length} claim rows make the work reproducible enough for advisor review?`,
    `Which of the ${gaps.length} gap rows should become the next implementation objective?`
  ];
}

function selectConsistencyCases(cases: CrossSolverConsistencyCase[], requestedIds: CrossSolverConsistencyCaseId[], includeAll: boolean): CrossSolverConsistencyCase[] {
  if (includeAll) return cases;
  const requested = new Set(requestedIds);
  return cases.filter((item) => requested.has(item.id));
}

function placementSummaryForExample(example: ExampleLibraryEntry): string {
  if (example.category === "planar-tmm") return "Laterally invariant z-stack; no finite x-y placement is represented.";
  if (example.category === "scalar-diffraction") return "Ideal scalar aperture/lens plane followed by focal or observation plane placement.";
  if (example.category === "rcwa") return "1D periodic grating unit cell with period, duty cycle, and depth routed to the RCWA preview.";
  if (example.category === "fdtd2d") return "Bounded 2D x-z FDTD fixture with source, material region, monitors, and PML-like boundary treatment.";
  if (example.category === "external-fdtd") return "Finite x-z geometry prepared as an external FDTD run/import pack with monitor placement and receipts.";
  if (example.category === "camera-diagnostics") return "Measured image or diagnostic target frame with ROI/calibration/MTF metadata rather than a Maxwell field placement.";
  if (example.category === "evidence-robustness") return "Engineering evidence campaign over scenarios, tolerances, robustness records, and reproducibility receipts.";
  return "Unsupported geometry request is held as a gap report and required-evidence checklist.";
}

function evidenceStatusFor(loaded: ExampleLibraryLoadedExample): AdvisorEvidenceStatus {
  if (loaded.example.unsupported || loaded.routeDecision.status === "unsupported") return "unsupported";
  if (loaded.example.externalEvidenceRequired || loaded.routeDecision.status === "external-required") return "external-required";
  if (!loaded.example.runnableInBrowser) return "scaffold";
  return "available";
}

function supplemental(
  id: string,
  title: string,
  source: AdvisorScenarioSource,
  category: string,
  solverLabel: string,
  solverId: string,
  routeStatus: string,
  evidenceTaskId: string,
  evidenceTaskHash: string,
  placementSummary: string,
  setupSummary: string,
  expectedResults: string[],
  computedImportedResults: string[],
  residuals: string[],
  convergenceStabilityConsistency: string[],
  limitations: string[],
  unsupportedItems: string[],
  externalEvidenceRequired: boolean,
  runnable: boolean
): Omit<AdvisorPacketScenario, "schema" | "scenarioHash"> {
  return {
    id,
    title,
    source,
    category,
    solverLabel,
    solverId,
    routeStatus,
    routeHash: hash("supplemental-route", { id, solverId, routeStatus }),
    evidenceTaskId,
    evidenceTaskHash: hash("supplemental-evidence", { id, evidenceTaskId, evidenceTaskHash }),
    placementSummary,
    setupSummary,
    expectedResults,
    computedImportedResults,
    residuals,
    convergenceStabilityConsistency,
    limitations,
    unsupportedItems,
    externalEvidenceRequired,
    runnable
  };
}

function claim(
  id: string,
  text: string,
  category: AdvisorClaimCategory,
  status: AdvisorClaimStatus,
  evidenceReferences: string[],
  limitations: string[],
  relatedScenarioIds: string[]
): Omit<AdvisorClaim, "schema" | "claimHash"> {
  return {
    id,
    text,
    category,
    status,
    evidenceReferences,
    limitations,
    relatedScenarioIds: uniqueStrings(relatedScenarioIds)
  };
}

function item(
  id: AdvisorCompletenessItem["id"],
  label: string,
  status: AdvisorCompletenessStatus,
  detail: string
): AdvisorCompletenessItem {
  return { id, label, status, detail };
}

function relatedGapScenarioIds(gaps: AdvisorGapRow[], text: string): string[] {
  const needle = text.toLowerCase();
  return uniqueStrings(gaps.filter((gap) => `${gap.feature} ${gap.limitations.join(" ")}`.toLowerCase().includes(needle)).flatMap((gap) => gap.relatedScenarioIds));
}

function uniqueClaims(claims: Array<Omit<AdvisorClaim, "schema" | "claimHash">>): Array<Omit<AdvisorClaim, "schema" | "claimHash">> {
  const seen = new Set<string>();
  const result: Array<Omit<AdvisorClaim, "schema" | "claimHash">> = [];
  for (const claimEntry of claims) {
    if (seen.has(claimEntry.id)) continue;
    seen.add(claimEntry.id);
    result.push(claimEntry);
  }
  return result;
}

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const itemEntry of items) {
    if (seen.has(itemEntry.id)) continue;
    seen.add(itemEntry.id);
    result.push(itemEntry);
  }
  return result;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}

function scenarioForHash(scenario: Omit<AdvisorPacketScenario, "scenarioHash">): unknown {
  return {
    id: scenario.id,
    title: scenario.title,
    source: scenario.source,
    solverId: scenario.solverId,
    routeStatus: scenario.routeStatus,
    routeHash: scenario.routeHash,
    evidenceTaskHash: scenario.evidenceTaskHash,
    expectedResults: scenario.expectedResults,
    computedImportedResults: scenario.computedImportedResults,
    residuals: scenario.residuals,
    convergenceStabilityConsistency: scenario.convergenceStabilityConsistency,
    limitations: scenario.limitations,
    unsupportedItems: scenario.unsupportedItems
  };
}

function claimForHash(claim: Omit<AdvisorClaim, "claimHash">): unknown {
  return {
    id: claim.id,
    text: claim.text,
    category: claim.category,
    status: claim.status,
    evidenceReferences: claim.evidenceReferences,
    limitations: claim.limitations,
    relatedScenarioIds: claim.relatedScenarioIds
  };
}

function packetForHash(packet: Omit<AdvisorReviewPacket, "packetHash">): unknown {
  return {
    schema: packet.schema,
    version: packet.version,
    presetId: packet.presetId,
    reviewType: packet.reviewType,
    selectedExampleIds: packet.selectedExampleIds,
    selectedSceneIds: packet.selectedSceneIds,
    scenarios: packet.scenarios.map((scenario) => ({ id: scenario.id, hash: scenario.scenarioHash })),
    consistencyCases: packet.consistencyCases.map((item) => ({ id: item.id, hash: item.caseHash })),
    claimLedger: packet.claimLedger.map((claim) => ({ id: claim.id, hash: claim.claimHash })),
    gaps: packet.gaps.map((gap) => gap.id),
    receipts: packet.reproducibilityReceipts.map((receipt) => ({ id: receipt.id, hash: receipt.hash })),
    completenessHash: packet.completeness.reportHash,
    boundary: packet.boundary
  };
}

function hash(namespace: string, value: unknown): string {
  return fnv1a64(`${namespace}:${stableStringify(value)}`);
}

function formatMetric(value: number | null): string {
  if (value === null) return "n/a";
  if (!Number.isFinite(value)) return "n/a";
  return Math.abs(value) >= 1e-3 ? value.toFixed(6) : value.toExponential(3);
}

function safeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function csvRow(values: Array<string | number | boolean | null | undefined>): string {
  return values.map((value) => {
    const text = String(value ?? "");
    if (!/[",\n\r]/.test(text)) return text;
    return `"${text.replace(/"/g, "\"\"")}"`;
  }).join(",");
}

function file(filename: string, mime: string, content: string): AdvisorPacketExportFile {
  return { filename, mime, content };
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
