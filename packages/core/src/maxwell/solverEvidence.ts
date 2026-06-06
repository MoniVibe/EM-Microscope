import { fnv1a64, stableStringify } from "../scene/hashScene";
import {
  getSolverCapability,
  type SolverRouteDecision,
  type SolverRouteSolverId,
  type SolverSceneDescriptor,
  type ValidationCheck
} from "./solverRouter";

export type SolverEvidenceTaskType =
  | "tmm-report"
  | "scalar-validation"
  | "rcwa-convergence"
  | "fdtd2d-validation"
  | "external-fdtd-run-pack"
  | "unsupported-gap-report";

export type EvidenceInputStatus = "available" | "external-required" | "missing" | "not-applicable";
export type EvidenceInputKind = "scene" | "source" | "materials" | "monitors" | "route" | "external-results" | "unsupported-feature";
export type EvidenceArtifactKind = "markdown" | "json" | "csv" | "python" | "checklist";
export type SolverEvidenceActionKind = "generate" | "run-check" | "export" | "open-panel" | "import" | "promote" | "show-info";

export type EvidenceInput = {
  id: string;
  label: string;
  kind: EvidenceInputKind;
  required: boolean;
  status: EvidenceInputStatus;
  hash: string;
  notes: string[];
};

export type EvidenceArtifact = {
  filename: string;
  kind: EvidenceArtifactKind;
  purpose: string;
  requiredForPromotion: boolean;
};

export type SolverEvidenceAction = {
  id: string;
  label: string;
  kind: SolverEvidenceActionKind;
  enabled: boolean;
  reason: string;
};

export type SolverEvidenceTask = {
  schema: "emmicro.solverEvidenceTask.v1";
  id: string;
  sceneHash: string;
  routeId: SolverRouteSolverId;
  routeHash: string;
  sceneId: string;
  sceneLabel: string;
  taskType: SolverEvidenceTaskType;
  label: string;
  why: string[];
  requiredInputs: EvidenceInput[];
  generatedArtifacts: EvidenceArtifact[];
  validationChecks: ValidationCheck[];
  actions: SolverEvidenceAction[];
  warnings: string[];
  limitations: string[];
  unsupportedFeatures: string[];
  boundary: string[];
  taskHash: string;
};

export type SolverEvidenceExportFile = {
  filename: string;
  originalPath: string;
  mime: string;
  content: string;
};

export type SolverEvidenceCampaignPromotion = {
  schema: "emmicro.solverEvidenceTaskPromotion.v1";
  taskId: string;
  taskHash: string;
  routeId: SolverRouteSolverId;
  taskType: SolverEvidenceTaskType;
  campaignTarget: "Engineering Evidence Campaign";
  accepted: boolean;
  acceptedWithWarnings: boolean;
  status: "accepted" | "accepted-with-warnings";
  preservedHashes: {
    sceneHash: string;
    routeHash: string;
    taskHash: string;
  };
  warnings: string[];
  limitations: string[];
  promotionHash: string;
};

export const l95SolverEvidenceBoundary = [
  "L9.5 generates deterministic evidence task packs from an existing solver route; it does not add a solver or new optical physics.",
  "L9.5 evidence packs are workflow manifests, reports, checklists, and validation plans, not automatic correctness proofs.",
  "L9.5 does not certify solver selection, production RCWA/FDTD, arbitrary 3D Maxwell, FEM, BEM, external solver execution, digital twin behavior, or manufacturing readiness.",
  "External FDTD packs remain run/export/import evidence workflows; Meep or other external solvers execute outside the browser.",
  "Unsupported scenes produce gap reports and next-step checklists instead of becoming executable."
] as const;

export function createSolverEvidenceTask(scene: SolverSceneDescriptor, decision: SolverRouteDecision): SolverEvidenceTask {
  const taskType = taskTypeForRoute(decision.recommendedSolver);
  const sceneHash = hashFor("scene", {
    sceneId: scene.sceneId,
    label: scene.label,
    kind: scene.kind,
    features: [...scene.features].sort(),
    sourceModel: scene.sourceModel,
    requestedOutputs: [...scene.requestedOutputs].sort(),
    provenance: scene.provenance
  });
  const label = taskLabel(taskType);
  const requiredInputs = inputsFor(scene, decision, sceneHash, taskType);
  const generatedArtifacts = artifactsFor(taskType);
  const warnings = warningsFor(taskType, decision);
  const limitations = uniqueStrings([...decision.limitations, ...limitationsForTask(taskType)]);
  const actions = actionsFor(taskType);
  const draft = {
    schema: "emmicro.solverEvidenceTask.v1" as const,
    id: `l95-${safeId(scene.sceneId)}-${taskType}-${sceneHash.slice(0, 8)}`,
    sceneHash,
    routeId: decision.recommendedSolver,
    routeHash: decision.resultHash,
    sceneId: scene.sceneId,
    sceneLabel: scene.label,
    taskType,
    label,
    why: whyFor(taskType, decision),
    requiredInputs,
    generatedArtifacts,
    validationChecks: decision.validationChecks,
    actions,
    warnings,
    limitations,
    unsupportedFeatures: decision.unsupportedItems,
    boundary: [...l95SolverEvidenceBoundary]
  };
  return { ...draft, taskHash: hashFor("task", taskForHash(draft)) };
}

export function solverEvidenceTaskJson(task: SolverEvidenceTask): string {
  return `${JSON.stringify(task, null, 2)}\n`;
}

export function solverEvidenceTaskMarkdown(task: SolverEvidenceTask): string {
  return [
    "# L9.5 Solver Evidence Task",
    "",
    `Task: ${task.label}`,
    `Task id: ${task.id}`,
    `Scene: ${task.sceneLabel}`,
    `Route: ${getSolverCapability(task.routeId).label} (${task.routeId})`,
    `Task type: ${task.taskType}`,
    `Scene hash: ${task.sceneHash}`,
    `Route hash: ${task.routeHash}`,
    `Task hash: ${task.taskHash}`,
    "",
    "## Why This Evidence Task",
    "",
    ...task.why.map((item) => `- ${item}`),
    "",
    "## Required Inputs",
    "",
    "| Input | Status | Hash | Notes |",
    "| --- | --- | --- | --- |",
    ...task.requiredInputs.map((input) => `| ${input.label} | ${input.status} | ${input.hash} | ${input.notes.join("; ")} |`),
    "",
    "## Generated Artifacts",
    "",
    "| Artifact | Kind | Purpose |",
    "| --- | --- | --- |",
    ...task.generatedArtifacts.map((artifact) => `| ${artifact.filename} | ${artifact.kind} | ${artifact.purpose} |`),
    "",
    "## Validation Plan",
    "",
    "| Check | Status | Description |",
    "| --- | --- | --- |",
    ...task.validationChecks.map((check) => `| ${check.label} | ${check.status} | ${check.description} |`),
    "",
    "## Warnings",
    "",
    ...(task.warnings.length ? task.warnings.map((warning) => `- ${warning}`) : ["- No route-specific warnings beyond the declared limitations."]),
    "",
    "## Limitations",
    "",
    ...task.limitations.map((limitation) => `- ${limitation}`),
    "",
    "## Boundary",
    "",
    ...task.boundary.map((item) => `- ${item}`)
  ].join("\n");
}

export function solverEvidenceArtifactsCsv(task: SolverEvidenceTask): string {
  return [
    "task_id,route_id,task_type,filename,kind,purpose,required_for_promotion",
    ...task.generatedArtifacts.map((artifact) =>
      csvRow([task.id, task.routeId, task.taskType, artifact.filename, artifact.kind, artifact.purpose, artifact.requiredForPromotion])
    )
  ].join("\n");
}

export function solverEvidenceValidationPlanCsv(task: SolverEvidenceTask): string {
  return [
    "task_id,route_id,check_id,label,status,description",
    ...task.validationChecks.map((check) => csvRow([task.id, task.routeId, check.id, check.label, check.status, check.description]))
  ].join("\n");
}

export function solverEvidenceInputsCsv(task: SolverEvidenceTask): string {
  return [
    "task_id,input_id,label,kind,required,status,hash,notes",
    ...task.requiredInputs.map((input) => csvRow([task.id, input.id, input.label, input.kind, input.required, input.status, input.hash, input.notes.join("; ")]))
  ].join("\n");
}

export function solverEvidenceActionsCsv(task: SolverEvidenceTask): string {
  return [
    "task_id,action_id,label,kind,enabled,reason",
    ...task.actions.map((action) => csvRow([task.id, action.id, action.label, action.kind, action.enabled, action.reason]))
  ].join("\n");
}

export function solverEvidenceBundleFiles(task: SolverEvidenceTask): SolverEvidenceExportFile[] {
  const core: SolverEvidenceExportFile[] = [
    file("solver_evidence_task.md", "solver_evidence_task.md", "text/markdown", `${solverEvidenceTaskMarkdown(task)}\n`),
    file("solver_evidence_task.json", "solver_evidence_task.json", "application/json", solverEvidenceTaskJson(task)),
    file("solver_evidence_artifacts.csv", "solver_evidence_artifacts.csv", "text/csv", `${solverEvidenceArtifactsCsv(task)}\n`),
    file("solver_evidence_validation_plan.csv", "solver_evidence_validation_plan.csv", "text/csv", `${solverEvidenceValidationPlanCsv(task)}\n`),
    file("solver_evidence_inputs.csv", "solver_evidence_inputs.csv", "text/csv", `${solverEvidenceInputsCsv(task)}\n`),
    file("solver_evidence_actions.csv", "solver_evidence_actions.csv", "text/csv", `${solverEvidenceActionsCsv(task)}\n`)
  ];
  return [
    ...core,
    ...task.generatedArtifacts.map((artifact) =>
      file(downloadNameFor(artifact.filename), artifact.filename, mimeFor(artifact.kind), artifactContent(task, artifact))
    )
  ];
}

export function promoteSolverEvidenceTaskToCampaign(task: SolverEvidenceTask): SolverEvidenceCampaignPromotion {
  const draft = {
    schema: "emmicro.solverEvidenceTaskPromotion.v1" as const,
    taskId: task.id,
    taskHash: task.taskHash,
    routeId: task.routeId,
    taskType: task.taskType,
    campaignTarget: "Engineering Evidence Campaign" as const,
    accepted: true,
    acceptedWithWarnings: task.warnings.length > 0 || task.unsupportedFeatures.length > 0,
    status: (task.warnings.length > 0 || task.unsupportedFeatures.length > 0 ? "accepted-with-warnings" : "accepted") as "accepted" | "accepted-with-warnings",
    preservedHashes: {
      sceneHash: task.sceneHash,
      routeHash: task.routeHash,
      taskHash: task.taskHash
    },
    warnings: task.warnings,
    limitations: task.limitations
  };
  return { ...draft, promotionHash: hashFor("promotion", draft) };
}

export function solverEvidencePromotionJson(promotion: SolverEvidenceCampaignPromotion): string {
  return `${JSON.stringify(promotion, null, 2)}\n`;
}

function taskTypeForRoute(routeId: SolverRouteSolverId): SolverEvidenceTaskType {
  if (routeId === "planar-tmm") return "tmm-report";
  if (routeId === "scalar-propagation") return "scalar-validation";
  if (routeId === "rcwa-1d-preview") return "rcwa-convergence";
  if (routeId === "fdtd-2d-cpu" || routeId === "fdtd-2d-webgpu") return "fdtd2d-validation";
  if (routeId === "external-fdtd-meep") return "external-fdtd-run-pack";
  return "unsupported-gap-report";
}

function taskLabel(taskType: SolverEvidenceTaskType): string {
  if (taskType === "tmm-report") return "TMM R/T/A evidence report";
  if (taskType === "scalar-validation") return "Scalar propagation validation pack";
  if (taskType === "rcwa-convergence") return "RCWA convergence evidence pack";
  if (taskType === "fdtd2d-validation") return "2D FDTD stability/convergence evidence pack";
  if (taskType === "external-fdtd-run-pack") return "External FDTD run pack and import checklist";
  return "Unsupported solver gap report";
}

function artifactsFor(taskType: SolverEvidenceTaskType): EvidenceArtifact[] {
  if (taskType === "tmm-report") {
    return [
      artifact("tmm_evidence_report.md", "markdown", "Planar TMM R/T/A report with assumptions and limitations."),
      artifact("tmm_evidence_report.json", "json", "Machine-readable TMM task receipt."),
      artifact("tmm_rta.csv", "csv", "Reflectance/transmittance/absorbance evidence rows."),
      artifact("material_receipts.json", "json", "Wavelength and material receipt hashes."),
      artifact("energy_balance.csv", "csv", "R+T+A energy-balance ledger.")
    ];
  }
  if (taskType === "scalar-validation") {
    return [
      artifact("scalar_validation_report.md", "markdown", "Scalar validation report with ideal aperture/lens assumptions."),
      artifact("scalar_validation_report.json", "json", "Machine-readable scalar validation task receipt."),
      artifact("scalar_profiles.csv", "csv", "Field/profile export rows."),
      artifact("scalar_residuals.csv", "csv", "Analytic-reference residual rows where available."),
      artifact("field_monitor_summary.csv", "csv", "Monitor stack summary rows.")
    ];
  }
  if (taskType === "rcwa-convergence") {
    return [
      artifact("rcwa_evidence_pack.json", "json", "RCWA evidence manifest with route/task hashes."),
      artifact("rcwa_report.md", "markdown", "RCWA route report with boundary and validation needs."),
      artifact("rcwa_report.json", "json", "Machine-readable RCWA route receipt."),
      artifact("rcwa_orders.csv", "csv", "Diffraction order efficiency table."),
      artifact("rcwa_convergence.csv", "csv", "Harmonic convergence rows."),
      artifact("rcwa_tmm_consistency.csv", "csv", "No-pattern TMM consistency rows.")
    ];
  }
  if (taskType === "fdtd2d-validation") {
    return [
      artifact("fdtd2d_evidence_pack.json", "json", "2D FDTD evidence manifest with grid/backend receipts."),
      artifact("fdtd2d_validation_report.md", "markdown", "2D FDTD diagnostic stability/convergence report."),
      artifact("fdtd2d_validation_report.json", "json", "Machine-readable 2D FDTD validation receipt."),
      artifact("fdtd2d_convergence.csv", "csv", "Bounded grid convergence rows."),
      artifact("fdtd2d_energy_trace.csv", "csv", "Energy trace evidence rows."),
      artifact("fdtd2d_monitor_trace.csv", "csv", "Monitor trace evidence rows."),
      artifact("fdtd2d_backend_parity.json", "json", "CPU/WebGPU availability and parity receipt reference.")
    ];
  }
  if (taskType === "external-fdtd-run-pack") {
    return [
      artifact("external_fdtd_run_pack/scene_manifest.json", "json", "External scene manifest to run outside the browser."),
      artifact("external_fdtd_run_pack/meep_scene.py", "python", "Meep helper script scaffold."),
      artifact("external_fdtd_run_pack/expected_reference.json", "json", "Expected reference and acceptance metadata."),
      artifact("external_fdtd_run_pack/run_config.json", "json", "Run settings and convergence plan."),
      artifact("external_fdtd_run_pack/material_receipts.json", "json", "Material and wavelength receipt hashes."),
      artifact("external_fdtd_run_pack/monitor_receipts.json", "json", "Monitor and field-slice receipt hashes."),
      artifact("external_fdtd_run_pack/README.md", "markdown", "External run instructions."),
      artifact("external_fdtd_run_pack/postprocess.py", "python", "Postprocess helper scaffold."),
      artifact("external_fdtd_import_checklist.csv", "checklist", "Checklist for run_receipt, flux_summary, field_slice, energy_balance, and postprocess_log imports.")
    ];
  }
  return [
    artifact("unsupported_gap_report.md", "markdown", "Human-readable gap report for blocked route features."),
    artifact("unsupported_gap_report.json", "json", "Machine-readable unsupported route receipt."),
    artifact("unsupported_items.csv", "csv", "Unsupported feature list."),
    artifact("suggested_next_steps.csv", "csv", "Approximation and future-solver next steps.")
  ];
}

function inputsFor(scene: SolverSceneDescriptor, decision: SolverRouteDecision, sceneHash: string, taskType: SolverEvidenceTaskType): EvidenceInput[] {
  const inputs: EvidenceInput[] = [
    input("scene-descriptor", "Scene descriptor", "scene", true, "available", sceneHash, [scene.summary]),
    input("source-model", "Source model", "source", true, "available", hashFor("source", scene.sourceModel), [scene.sourceModel]),
    input("route-decision", "Solver route decision", "route", true, "available", decision.resultHash, [`${decision.recommendedSolverLabel} selected by L9.4 router.`]),
    input("material-feature-receipts", "Material/feature receipts", "materials", true, "available", hashFor("materials", [...scene.features].sort()), scene.features),
    input("monitor-output-request", "Monitor/output request", "monitors", true, "available", hashFor("outputs", [...scene.requestedOutputs].sort()), scene.requestedOutputs)
  ];
  if (taskType === "external-fdtd-run-pack") {
    inputs.push(
      input("run_receipt.json", "External run receipt", "external-results", true, "external-required", "pending-external-run", ["Import after external Meep/FDTD execution."]),
      input("flux_summary.json", "Flux summary", "external-results", true, "external-required", "pending-external-run", ["Import R/T/A flux evidence."]),
      input("field_slice_xz.csv", "Field slice X-Z CSV", "external-results", true, "external-required", "pending-external-run", ["Import field-slice evidence."]),
      input("energy_balance.json", "Energy balance JSON", "external-results", true, "external-required", "pending-external-run", ["Import energy-balance evidence."]),
      input("postprocess_log.json", "Postprocess log", "external-results", true, "external-required", "pending-external-run", ["Import postprocess receipt."])
    );
  }
  if (taskType === "unsupported-gap-report") {
    inputs.push(
      input("unsupported-features", "Unsupported features", "unsupported-feature", true, "available", hashFor("unsupported", decision.unsupportedItems), decision.unsupportedItems)
    );
  }
  return inputs;
}

function whyFor(taskType: SolverEvidenceTaskType, decision: SolverRouteDecision): string[] {
  const base = [...decision.reasons];
  if (taskType === "tmm-report") return [...base, "TMM evidence needs R/T/A, material receipts, and energy balance."];
  if (taskType === "scalar-validation") return [...base, "Scalar evidence needs profiles, residual rows, monitor summaries, and ideal-element warnings."];
  if (taskType === "rcwa-convergence") return [...base, "RCWA evidence needs order efficiencies, harmonic convergence, energy balance, and no-pattern TMM consistency."];
  if (taskType === "fdtd2d-validation") return [...base, "2D FDTD evidence needs CFL/stability, grid convergence, energy traces, monitor traces, and backend/parity receipts."];
  if (taskType === "external-fdtd-run-pack") return [...base, "External FDTD evidence needs a run pack plus imported receipt, flux, field-slice, energy, and postprocess artifacts."];
  return [...base, "Unsupported evidence needs a gap report that explains missing solver features and possible approximations."];
}

function warningsFor(taskType: SolverEvidenceTaskType, decision: SolverRouteDecision): string[] {
  const warnings: string[] = [];
  if (decision.status !== "ready") warnings.push(`Route status is ${decision.status}; review validation before using this evidence.`);
  if (taskType === "rcwa-convergence") warnings.push("RCWA preview is bounded to 1D binary periodic gratings and capped harmonic counts.");
  if (taskType === "fdtd2d-validation") warnings.push("2D FDTD evidence is a bounded TMz diagnostic slice, not a full finite-geometry proof.");
  if (taskType === "external-fdtd-run-pack") warnings.push("External FDTD execution occurs outside the browser and must be imported with receipts.");
  if (taskType === "unsupported-gap-report") warnings.push("Unsupported scenes remain non-executable; this pack is a gap report only.");
  return uniqueStrings(warnings);
}

function limitationsForTask(taskType: SolverEvidenceTaskType): string[] {
  const shared = [
    "Evidence generation is not automatic correctness proof.",
    "Evidence generation is not certified solver selection.",
    "Evidence generation is not production RCWA/FDTD certification.",
    "Evidence generation is not arbitrary 3D Maxwell, FEM, or BEM."
  ];
  if (taskType === "external-fdtd-run-pack") return ["The app does not execute external Meep/FDTD and does not replace external solvers.", ...shared];
  if (taskType === "unsupported-gap-report") return ["Unsupported/scaffold scenes are not runnable from this evidence pack.", ...shared];
  return shared;
}

function actionsFor(taskType: SolverEvidenceTaskType): SolverEvidenceAction[] {
  const actions: SolverEvidenceAction[] = [
    action("generate-evidence-pack", "Generate Evidence Pack", "generate", true, "Create deterministic L9.5 task reports, artifact list, input receipts, and validation plan."),
    action("export-evidence-bundle", "Export Evidence Bundle", "export", true, "Download solver_evidence_task.md/json and CSV evidence manifests."),
    action("add-to-engineering-evidence-campaign", "Add to Engineering Evidence Campaign", "promote", true, "Promote task hash, route hash, warnings, and limitations into campaign handoff metadata.")
  ];
  if (taskType === "tmm-report" || taskType === "scalar-validation" || taskType === "rcwa-convergence" || taskType === "fdtd2d-validation") {
    actions.splice(1, 0, action("run-available-in-browser-checks", "Run In-Browser Checks", "run-check", true, "Open or hand off to the implemented bounded in-browser diagnostic lane."));
  }
  if (taskType === "external-fdtd-run-pack") {
    actions.unshift(action("generate-external-run-pack", "Generate External Run Pack", "export", true, "Write scene manifest, Meep helper script, run config, receipts, README, and postprocess scaffold."));
    actions.push(action("open-run-instructions", "Open Run Instructions", "show-info", true, "Show the README/checklist for running external FDTD outside the browser."));
    actions.push(action("import-results", "Import Results", "import", true, "Import run_receipt.json, flux_summary.json, field_slice_xz.csv, energy_balance.json, and postprocess_log.json."));
    actions.push(action("validate-receipts", "Validate Receipts", "run-check", true, "Validate imported receipt hashes and required artifacts before promotion."));
    actions.push(action("promote-to-engineering-evidence-campaign", "Promote to Engineering Evidence Campaign", "promote", true, "Promote external run-pack task metadata after receipt validation."));
  }
  if (taskType === "unsupported-gap-report") {
    actions.splice(1, 0, action("show-unsupported-gap-report", "Show Unsupported Gap Report", "show-info", true, "Export a blocked-feature gap report and suggested next steps."));
  }
  return actions;
}

function artifact(filename: string, kind: EvidenceArtifactKind, purpose: string, requiredForPromotion = true): EvidenceArtifact {
  return { filename, kind, purpose, requiredForPromotion };
}

function input(id: string, label: string, kind: EvidenceInputKind, required: boolean, status: EvidenceInputStatus, hash: string, notes: string[]): EvidenceInput {
  return { id, label, kind, required, status, hash, notes };
}

function action(id: string, label: string, kind: SolverEvidenceActionKind, enabled: boolean, reason: string): SolverEvidenceAction {
  return { id, label, kind, enabled, reason };
}

function artifactContent(task: SolverEvidenceTask, artifact: EvidenceArtifact): string {
  if (artifact.kind === "python") {
    return [
      "# L9.5 generated evidence helper scaffold",
      `# Task: ${task.id}`,
      `# Route: ${task.routeId}`,
      "# Execution remains outside the browser; review README and run_config.json before use.",
      "print('L9.5 evidence helper scaffold; replace with lab/local execution wiring as needed.')",
      ""
    ].join("\n");
  }
  if (artifact.kind === "csv" || artifact.kind === "checklist") {
    if (task.taskType === "unsupported-gap-report" && artifact.filename === "suggested_next_steps.csv") {
      return [
        "task_id,unsupported_feature,approximation_option,future_solver_needed",
        ...(task.unsupportedFeatures.length ? task.unsupportedFeatures : ["none"]).map((item) =>
          csvRow([task.id, item, "Replace with ideal/scalar/external-evidence approximation only when physically justified.", "Future CAD/3D Maxwell/FEM/BEM/external workflow planning."])
        )
      ].join("\n");
    }
    return [
      "task_id,route_id,artifact,status,note",
      csvRow([task.id, task.routeId, artifact.filename, "planned", artifact.purpose])
    ].join("\n");
  }
  if (artifact.kind === "json") {
    return `${JSON.stringify({
      schema: "emmicro.solverEvidenceArtifact.v1",
      taskId: task.id,
      taskHash: task.taskHash,
      routeId: task.routeId,
      sceneHash: task.sceneHash,
      artifact
    }, null, 2)}\n`;
  }
  return [
    `# ${artifact.filename}`,
    "",
    `Task: ${task.label}`,
    `Task id: ${task.id}`,
    `Route: ${task.routeId}`,
    `Task hash: ${task.taskHash}`,
    "",
    artifact.purpose,
    "",
    "This generated artifact is an L9.5 evidence task output. It is not automatic correctness proof, certified solver selection, production RCWA/FDTD certification, arbitrary 3D Maxwell, FEM, BEM, digital twin behavior, or manufacturing certification.",
    ""
  ].join("\n");
}

function mimeFor(kind: EvidenceArtifactKind): string {
  if (kind === "json") return "application/json";
  if (kind === "csv" || kind === "checklist") return "text/csv";
  if (kind === "python") return "text/x-python";
  return "text/markdown";
}

function file(filename: string, originalPath: string, mime: string, content: string): SolverEvidenceExportFile {
  return { filename, originalPath, mime, content };
}

function downloadNameFor(path: string): string {
  return path.replace(/[\\/]/g, "__");
}

function taskForHash(task: Omit<SolverEvidenceTask, "taskHash">): unknown {
  return {
    schema: task.schema,
    id: task.id,
    sceneHash: task.sceneHash,
    routeId: task.routeId,
    routeHash: task.routeHash,
    taskType: task.taskType,
    inputHashes: task.requiredInputs.map((input) => [input.id, input.status, input.hash]),
    artifacts: task.generatedArtifacts.map((artifact) => [artifact.filename, artifact.kind, artifact.requiredForPromotion]),
    checks: task.validationChecks.map((check) => [check.id, check.status]),
    warningText: task.warnings,
    limitations: task.limitations,
    unsupportedFeatures: task.unsupportedFeatures
  };
}

function hashFor(label: string, value: unknown): string {
  return fnv1a64(stableStringify({ label, value }));
}

function safeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scene";
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function csvRow(values: Array<string | number | boolean>): string {
  return values.map(csvEscape).join(",");
}

function csvEscape(value: string | number | boolean): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
