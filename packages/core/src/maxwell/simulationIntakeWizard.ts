import { createFdtd2dFixtureScene, type Fdtd2dScene } from "../fdtd/fdtd2dSandbox";
import { fnv1a64, stableStringify } from "../scene/hashScene";
import { createCrossSolverConsistencyBench, type CrossSolverConsistencyCaseId } from "./crossSolverConsistency";
import { createSolverEvidenceTask, type SolverEvidenceTask } from "./solverEvidence";
import {
  createSolverRouteExampleScene,
  routeSolverScene,
  type SolverRouteDecision,
  type SolverRouteExampleId,
  type SolverRouteSolverId,
  type SolverSceneDescriptor
} from "./solverRouter";
import {
  createSimulationBuilderElement,
  defaultSimulationBuilderScenario,
  orderedSimulationBuilderElements,
  type SimulationBuilderScenario
} from "./simulationBuilder";

export type SimulationIntakeProblemTypeId =
  | "planar-coating"
  | "aperture-slit-lens"
  | "periodic-grating"
  | "finite-material-object"
  | "multi-element-bench"
  | "camera-sensor-image-quality"
  | "measured-target-calibration"
  | "not-sure";

export type SimulationIntakeOutputId =
  | "rta"
  | "diffraction-orders"
  | "field-map-2d"
  | "field-animation"
  | "focal-plane-psf"
  | "camera-dn-electrons-snr"
  | "mtf-resolution"
  | "geometric-distortion-pixel-scale"
  | "tolerance-robustness"
  | "evidence-dossier";

export type SimulationIntakeGeometryId =
  | "infinite-planar-layers"
  | "ideal-mask-phase-elements"
  | "periodic-1d-grating"
  | "small-2d-slice"
  | "finite-block-aperture-wedge"
  | "measured-image-target-data"
  | "arbitrary-cad-freeform-curved-3d";

export type SimulationIntakeMaterialId =
  | "lossless-dielectric-n"
  | "absorbing-nk-alpha"
  | "reflective-ideal-plate"
  | "coating-stack"
  | "periodic-material-pattern"
  | "imported-material-pack"
  | "unknown";

export type SimulationIntakeRigorId =
  | "fast-preview"
  | "in-browser-diagnostic"
  | "external-solver-evidence"
  | "convergence-tested-report"
  | "engineering-evidence-dossier";

export type SimulationIntakeStepId = "problem" | "output" | "geometry" | "materials" | "rigor" | "recommendation";

export type SimulationIntakeOption<TId extends string> = {
  id: TId;
  label: string;
  description: string;
};

export type SimulationIntakeAnswers = {
  schema: "emmicro.simulationIntake.answers.v1";
  problemType: SimulationIntakeProblemTypeId;
  desiredOutput: SimulationIntakeOutputId;
  geometry: SimulationIntakeGeometryId;
  material: SimulationIntakeMaterialId;
  rigor: SimulationIntakeRigorId;
};

export type SimulationIntakeTemplateKind =
  | "planar-tmm-coating-template"
  | "scalar-aperture-lens-template"
  | "rcwa-binary-grating-template"
  | "fdtd2d-sandbox-template"
  | "external-fdtd-builder-template"
  | "unsupported-gap-template";

export type SimulationIntakeGeneratedTemplate = {
  schema: "emmicro.simulationIntake.generatedTemplate.v1";
  kind: SimulationIntakeTemplateKind;
  label: string;
  routeExample: SolverRouteExampleId;
  answers: SimulationIntakeAnswers;
  solverScene: SolverSceneDescriptor;
  simulationBuilderScenario?: SimulationBuilderScenario;
  fdtd2dScene?: Fdtd2dScene;
  rcwaPreviewSpec?: {
    periodNm: number;
    dutyCycle: number;
    depthNm: number;
    harmonicCount: number;
    polarization: "TE" | "TM";
  };
  unsupportedGap?: {
    requestedGeometry: string;
    currentStatus: "unsupported";
    requiredFutureSolvers: string[];
    safeApproximations: string[];
    evidenceRequired: string[];
  };
  preservedPreferences: string[];
  templateHash: string;
};

export type SimulationIntakeActionId =
  | "create-scene-template"
  | "open-recommended-solver"
  | "generate-evidence-pack"
  | "open-consistency-bench"
  | "export-decision-report"
  | "show-unsupported-gap-report";

export type SimulationIntakeAction = {
  id: SimulationIntakeActionId;
  label: string;
  enabled: boolean;
  target: "builder" | "rcwa" | "fdtd2d" | "diagnostics" | "export" | "consistency" | "gap";
  reason: string;
};

export type SimulationIntakeDecision = {
  schema: "emmicro.simulationIntake.decision.v1";
  label: "L9.7 Solver Method Decision Wizard / Simulation Intake";
  answers: SimulationIntakeAnswers;
  generatedTemplate: SimulationIntakeGeneratedTemplate;
  solverScene: SolverSceneDescriptor;
  routeDecision: SolverRouteDecision;
  evidenceTask: SolverEvidenceTask;
  consistencyCaseIds: CrossSolverConsistencyCaseId[];
  recommendedWorkflow: {
    solverId: SolverRouteSolverId;
    solverLabel: string;
    workbenchLabel: string;
    routeStatus: SolverRouteDecision["status"];
    evidenceLabel: string;
  };
  alternativeWorkflows: Array<{ solverId: SolverRouteSolverId; label: string; status: string; reason: string }>;
  why: string[];
  assumptions: string[];
  limitations: string[];
  validationChecks: SolverRouteDecision["validationChecks"];
  unsupportedItems: string[];
  nextActions: SimulationIntakeAction[];
  boundary: string[];
  decisionHash: string;
};

export const l97SimulationIntakeBoundary = [
  "L9.7 is workflow guidance and simulation intake only; it does not add a solver or new optical physics.",
  "The wizard uses L9.4 routing, L9.5 evidence task generation, and L9.6 consistency diagnostics; it does not prove automatic correctness.",
  "L9.7 does not certify solver selection, production RCWA/FDTD, arbitrary 3D Maxwell, FEM, BEM, external solver replacement, digital twin behavior, or manufacturing readiness.",
  "Unsupported or scaffold-only requests remain visible as gap reports and required-evidence checklists, not executable green lights.",
  "External FDTD/Meep execution remains outside the browser; the app exports/imports evidence and receipts only."
] as const;

export const simulationIntakeProblemOptions: Array<SimulationIntakeOption<SimulationIntakeProblemTypeId>> = [
  option("planar-coating", "Planar coating / thin-film stack", "Laterally invariant layers where R/T/A and coating evidence are primary."),
  option("aperture-slit-lens", "Aperture, slit, or lens diffraction", "Ideal masks, slits, thin lenses, focal-plane profiles, and scalar references."),
  option("periodic-grating", "Periodic grating / metasurface unit cell", "A bounded 1D binary periodic structure with diffraction orders."),
  option("finite-material-object", "Finite material object / blocker / aperture edge", "Finite blocks, wedges, absorbing objects, aperture edges, or field maps."),
  option("multi-element-bench", "Full optical bench with multiple elements", "Ordered source-to-elements-to-target workflow with monitors and evidence handoff."),
  option("camera-sensor-image-quality", "Camera / sensor / image quality", "Detector, SNR, MTF, camera calibration, or image-quality diagnostics."),
  option("measured-target-calibration", "Measured target / calibration workflow", "Imported target images, geometry fitting, calibration, or QA sessions."),
  option("not-sure", "I'm not sure", "Start conservative and show what evidence is needed before trusting a result.")
];

export const simulationIntakeOutputOptions: Array<SimulationIntakeOption<SimulationIntakeOutputId>> = [
  option("rta", "Reflectance / transmittance / absorbance", "Power-balance and layer/interface reporting."),
  option("diffraction-orders", "Diffraction orders", "Per-order reflected/transmitted efficiency and order angles."),
  option("field-map-2d", "2D field map", "Bounded field slice or imported external field evidence."),
  option("field-animation", "Field animation", "In-browser 2D TMz time stepping for intuition."),
  option("focal-plane-psf", "Focal plane / PSF", "Ideal scalar propagation to a focus or observation plane."),
  option("camera-dn-electrons-snr", "Camera DN / electrons / SNR", "Detector post-processing or camera sensor-lite diagnostics."),
  option("mtf-resolution", "MTF / resolution", "Resolution target, slanted-edge, line-pair, or focus/field MTF diagnostics."),
  option("geometric-distortion-pixel-scale", "Geometric distortion / pixel scale", "Measured target geometry, dot-grid, or calibration workflows."),
  option("tolerance-robustness", "Tolerance / robustness", "Process/tolerance variation and robust-design guidance."),
  option("evidence-dossier", "Evidence dossier", "Engineer-facing evidence campaign export and reproducibility hashes.")
];

export const simulationIntakeGeometryOptions: Array<SimulationIntakeOption<SimulationIntakeGeometryId>> = [
  option("infinite-planar-layers", "Infinite planar layers", "Layered stack without lateral geometry."),
  option("ideal-mask-phase-elements", "Ideal masks / phase elements", "Ideal aperture, slit, or thin-lens propagation."),
  option("periodic-1d-grating", "1D periodic grating", "Binary periodic pattern under plane-wave incidence."),
  option("small-2d-slice", "Small 2D slice", "Bounded 2D diagnostic grid with capped objects and monitors."),
  option("finite-block-aperture-wedge", "Finite block / aperture / wedge", "Finite material geometry requiring external evidence for serious claims."),
  option("measured-image-target-data", "Measured image / target data", "Imported images, targets, or detector/calibration data."),
  option("arbitrary-cad-freeform-curved-3d", "Unsupported: arbitrary CAD / curved 3D material geometry", "No executable in-app route; create a gap report.")
];

export const simulationIntakeMaterialOptions: Array<SimulationIntakeOption<SimulationIntakeMaterialId>> = [
  option("lossless-dielectric-n", "lossless dielectric n", "Real refractive-index materials."),
  option("absorbing-nk-alpha", "absorbing n/k or alpha", "Lossy materials with extinction coefficient or absorption coefficient."),
  option("reflective-ideal-plate", "reflective ideal plate", "Ideal mirror or PEC-like blocker interpretation."),
  option("coating-stack", "coating stack", "Layered coating materials and provenance."),
  option("periodic-material-pattern", "periodic material pattern", "Binary grating material/background pattern."),
  option("imported-material-pack", "unknown / imported material pack", "User-provided materials that require receipts."),
  option("unknown", "unknown", "Use conservative defaults and preserve uncertainty in the evidence plan.")
];

export const simulationIntakeRigorOptions: Array<SimulationIntakeOption<SimulationIntakeRigorId>> = [
  option("fast-preview", "Fast preview", "Prefer instant browser-native guidance with limitations visible."),
  option("in-browser-diagnostic", "In-browser diagnostic", "Run bounded checks available inside the app."),
  option("external-solver-evidence", "External solver evidence", "Prepare run packs and receipt/import validation."),
  option("convergence-tested-report", "Convergence-tested report", "Include convergence, PML, residual, and warning checks."),
  option("engineering-evidence-dossier", "Engineering evidence dossier", "Promote evidence toward campaign/dossier exports.")
];

export const defaultSimulationIntakeAnswers: SimulationIntakeAnswers = {
  schema: "emmicro.simulationIntake.answers.v1",
  problemType: "planar-coating",
  desiredOutput: "rta",
  geometry: "infinite-planar-layers",
  material: "coating-stack",
  rigor: "fast-preview"
};

export function createSimulationIntakeDecision(answers: SimulationIntakeAnswers = defaultSimulationIntakeAnswers): SimulationIntakeDecision {
  const normalized = normalizeAnswers(answers);
  const routeExample = routeExampleForAnswers(normalized);
  const template = createSimulationIntakeTemplate(normalized, routeExample);
  const routeDecision = routeSolverScene(template.solverScene);
  const evidenceTask = createSolverEvidenceTask(template.solverScene, routeDecision);
  const consistencyBench = createCrossSolverConsistencyBench(evidenceTask);
  const consistencyCaseIds = consistencyCasesFor(routeDecision.recommendedSolver);
  const nextActions = actionsFor(routeDecision, template, consistencyCaseIds);
  const draft = {
    schema: "emmicro.simulationIntake.decision.v1" as const,
    label: "L9.7 Solver Method Decision Wizard / Simulation Intake" as const,
    answers: normalized,
    generatedTemplate: template,
    solverScene: template.solverScene,
    routeDecision,
    evidenceTask,
    consistencyCaseIds,
    recommendedWorkflow: {
      solverId: routeDecision.recommendedSolver,
      solverLabel: routeDecision.recommendedSolverLabel,
      workbenchLabel: workbenchLabelFor(routeDecision.recommendedSolver, normalized),
      routeStatus: routeDecision.status,
      evidenceLabel: evidenceTask.label
    },
    alternativeWorkflows: routeDecision.alternatives.map((item) => ({
      solverId: item.solverId,
      label: item.label,
      status: item.status,
      reason: item.reasons[0] ?? "No route note."
    })),
    why: uniqueStrings([...routeDecision.reasons, ...evidenceTask.why]),
    assumptions: uniqueStrings([...routeDecision.assumptions, ...template.preservedPreferences]),
    limitations: uniqueStrings([...routeDecision.limitations, ...evidenceTask.limitations, ...l97SimulationIntakeBoundary]),
    validationChecks: routeDecision.validationChecks,
    unsupportedItems: routeDecision.unsupportedItems,
    nextActions,
    boundary: [...l97SimulationIntakeBoundary]
  };
  const decisionHash = hash(decisionForHash(draft, consistencyBench.reportHash));
  return { ...draft, decisionHash };
}

export function createSimulationIntakeTemplate(answers: SimulationIntakeAnswers, routeExample = routeExampleForAnswers(answers)): SimulationIntakeGeneratedTemplate {
  const normalized = normalizeAnswers(answers);
  const baseScene = createSolverRouteExampleScene(routeExample);
  const solverScene = personalizeSceneDescriptor(baseScene, normalized, routeExample);
  const draft = {
    schema: "emmicro.simulationIntake.generatedTemplate.v1" as const,
    kind: templateKindFor(routeExample),
    label: templateLabelFor(routeExample),
    routeExample,
    answers: normalized,
    solverScene,
    ...templatePayloadFor(routeExample, normalized, solverScene),
    preservedPreferences: preservedPreferencesFor(normalized)
  };
  return { ...draft, templateHash: hash(draft) };
}

export function simulationIntakeDecisionReportJson(decision: SimulationIntakeDecision): string {
  return `${JSON.stringify(decision, null, 2)}\n`;
}

export function simulationIntakeDecisionReportMarkdown(decision: SimulationIntakeDecision): string {
  return [
    "# L9.7 Solver Method Decision Wizard / Simulation Intake",
    "",
    `Decision hash: ${decision.decisionHash}`,
    `Recommended solver: ${decision.recommendedWorkflow.solverLabel} (${decision.recommendedWorkflow.solverId})`,
    `Workbench: ${decision.recommendedWorkflow.workbenchLabel}`,
    `Route status: ${decision.recommendedWorkflow.routeStatus}`,
    `Evidence task: ${decision.recommendedWorkflow.evidenceLabel}`,
    `Template: ${decision.generatedTemplate.label}`,
    "",
    "## Wizard Answers",
    "",
    `- Problem type: ${labelFor(simulationIntakeProblemOptions, decision.answers.problemType)}`,
    `- Desired output: ${labelFor(simulationIntakeOutputOptions, decision.answers.desiredOutput)}`,
    `- Geometry: ${labelFor(simulationIntakeGeometryOptions, decision.answers.geometry)}`,
    `- Materials: ${labelFor(simulationIntakeMaterialOptions, decision.answers.material)}`,
    `- Rigor / evidence: ${labelFor(simulationIntakeRigorOptions, decision.answers.rigor)}`,
    "",
    "## Why",
    "",
    ...decision.why.map((item) => `- ${item}`),
    "",
    "## Alternatives",
    "",
    "| Solver | Status | Reason |",
    "| --- | --- | --- |",
    ...decision.alternativeWorkflows.map((item) => `| ${item.label} | ${item.status} | ${item.reason} |`),
    "",
    "## Validation And Evidence",
    "",
    ...decision.validationChecks.map((check) => `- ${check.label}: ${check.status} - ${check.description}`),
    `- Evidence task hash: ${decision.evidenceTask.taskHash}`,
    `- Consistency checks: ${decision.consistencyCaseIds.join(", ") || "none"}`,
    "",
    "## Next Actions",
    "",
    ...decision.nextActions.map((action) => `- ${action.label}: ${action.enabled ? "enabled" : "disabled"} - ${action.reason}`),
    "",
    "## Limitations",
    "",
    ...decision.limitations.map((item) => `- ${item}`),
    "",
    "## Unsupported Items",
    "",
    ...(decision.unsupportedItems.length ? decision.unsupportedItems.map((item) => `- ${item}`) : ["- No unsupported item detected for this intake."]),
    "",
    "## Boundary",
    "",
    ...decision.boundary.map((item) => `- ${item}`)
  ].join("\n");
}

export function simulationIntakeDecisionMatrixCsv(decision: SimulationIntakeDecision): string {
  return [
    "decision_hash,answer_step,answer_id,answer_label,recommended_solver,route_status,evidence_task,template_kind",
    csvRow([decision.decisionHash, "problem", decision.answers.problemType, labelFor(simulationIntakeProblemOptions, decision.answers.problemType), decision.routeDecision.recommendedSolver, decision.routeDecision.status, decision.evidenceTask.taskType, decision.generatedTemplate.kind]),
    csvRow([decision.decisionHash, "output", decision.answers.desiredOutput, labelFor(simulationIntakeOutputOptions, decision.answers.desiredOutput), decision.routeDecision.recommendedSolver, decision.routeDecision.status, decision.evidenceTask.taskType, decision.generatedTemplate.kind]),
    csvRow([decision.decisionHash, "geometry", decision.answers.geometry, labelFor(simulationIntakeGeometryOptions, decision.answers.geometry), decision.routeDecision.recommendedSolver, decision.routeDecision.status, decision.evidenceTask.taskType, decision.generatedTemplate.kind]),
    csvRow([decision.decisionHash, "materials", decision.answers.material, labelFor(simulationIntakeMaterialOptions, decision.answers.material), decision.routeDecision.recommendedSolver, decision.routeDecision.status, decision.evidenceTask.taskType, decision.generatedTemplate.kind]),
    csvRow([decision.decisionHash, "rigor", decision.answers.rigor, labelFor(simulationIntakeRigorOptions, decision.answers.rigor), decision.routeDecision.recommendedSolver, decision.routeDecision.status, decision.evidenceTask.taskType, decision.generatedTemplate.kind]),
    "",
    "solver_id,label,status,reason",
    ...decision.alternativeWorkflows.map((item) => csvRow([item.solverId, item.label, item.status, item.reason]))
  ].join("\n");
}

export function simulationIntakeGeneratedTemplateJson(template: SimulationIntakeGeneratedTemplate): string {
  return `${JSON.stringify(template, null, 2)}\n`;
}

export function simulationIntakeWizardAnswersJson(answers: SimulationIntakeAnswers): string {
  return `${JSON.stringify(normalizeAnswers(answers), null, 2)}\n`;
}

function routeExampleForAnswers(answers: SimulationIntakeAnswers): SolverRouteExampleId {
  if (answers.geometry === "arbitrary-cad-freeform-curved-3d") return "unsupported";
  if (answers.problemType === "camera-sensor-image-quality" || answers.problemType === "measured-target-calibration") return "unsupported";
  if (answers.problemType === "periodic-grating" || answers.geometry === "periodic-1d-grating" || answers.desiredOutput === "diffraction-orders" || answers.material === "periodic-material-pattern") return "rcwa";
  if (answers.problemType === "planar-coating" || answers.geometry === "infinite-planar-layers" || answers.material === "coating-stack") return "planar";
  if (answers.problemType === "aperture-slit-lens" || answers.geometry === "ideal-mask-phase-elements" || answers.desiredOutput === "focal-plane-psf") return "scalar";
  if (answers.geometry === "small-2d-slice" || answers.desiredOutput === "field-animation") return "fdtd2d";
  if (answers.problemType === "finite-material-object" || answers.problemType === "multi-element-bench" || answers.geometry === "finite-block-aperture-wedge" || answers.desiredOutput === "field-map-2d" || answers.rigor === "external-solver-evidence" || answers.rigor === "convergence-tested-report") return "external";
  return "external";
}

function personalizeSceneDescriptor(base: SolverSceneDescriptor, answers: SimulationIntakeAnswers, routeExample: SolverRouteExampleId): SolverSceneDescriptor {
  const outputLabel = labelFor(simulationIntakeOutputOptions, answers.desiredOutput);
  const materialLabel = labelFor(simulationIntakeMaterialOptions, answers.material);
  const rigorLabel = labelFor(simulationIntakeRigorOptions, answers.rigor);
  return {
    ...base,
    sceneId: `l97-${routeExample}-${answers.problemType}-${answers.desiredOutput}`,
    label: `L9.7 ${labelFor(simulationIntakeProblemOptions, answers.problemType)} intake`,
    summary: `${base.summary} Intake requested ${outputLabel}; geometry ${labelFor(simulationIntakeGeometryOptions, answers.geometry)}; material ${materialLabel}; rigor ${rigorLabel}.`,
    sourceModel: `${base.sourceModel}; material preference ${materialLabel}`,
    requestedOutputs: uniqueStrings([outputLabel, rigorLabel, ...base.requestedOutputs]),
    provenance: uniqueStrings(["L9.7 Simulation Intake Wizard", ...base.provenance, ...preservedPreferencesFor(answers)])
  };
}

function templatePayloadFor(routeExample: SolverRouteExampleId, answers: SimulationIntakeAnswers, solverScene: SolverSceneDescriptor): Omit<SimulationIntakeGeneratedTemplate, "schema" | "kind" | "label" | "routeExample" | "answers" | "solverScene" | "preservedPreferences" | "templateHash"> {
  if (routeExample === "fdtd2d") {
    return { fdtd2dScene: createFdtd2dFixtureScene(answers.desiredOutput === "field-animation" ? "point-source-symmetry" : "dielectric-interface") };
  }
  if (routeExample === "rcwa") {
    return {
      rcwaPreviewSpec: {
        periodNm: 700,
        dutyCycle: 0.5,
        depthNm: answers.material === "absorbing-nk-alpha" ? 180 : 120,
        harmonicCount: answers.rigor === "fast-preview" ? 5 : 9,
        polarization: "TE"
      }
    };
  }
  if (routeExample === "unsupported") {
    return {
      simulationBuilderScenario: builderTemplateFor(routeExample, answers),
      unsupportedGap: {
        requestedGeometry: labelFor(simulationIntakeGeometryOptions, answers.geometry),
        currentStatus: "unsupported",
        requiredFutureSolvers: ["external 3D FDTD", "FEM", "BEM", "validated CAD meshing"],
        safeApproximations: ["ideal thin-lens scalar benchmark", "planar TMM coating on flat samples", "external FDTD scaffold after simplifying geometry"],
        evidenceRequired: ["geometry/mesh validation", "material model receipts", "convergence study", "independent reference or imported field evidence"]
      }
    };
  }
  return { simulationBuilderScenario: builderTemplateFor(routeExample, answers) };
}

function builderTemplateFor(routeExample: SolverRouteExampleId, answers: SimulationIntakeAnswers): SimulationBuilderScenario {
  const base = defaultSimulationBuilderScenario();
  const common = {
    ...base,
    id: `l97-template-${routeExample}`,
    label: templateLabelFor(routeExample),
    boundary: uniqueStrings([...base.boundary, ...l97SimulationIntakeBoundary])
  };
  if (routeExample === "planar") {
    return {
      ...common,
      elements: [
        { ...createSimulationBuilderElement("material-slab", 8, "L9.7 coating layer 1"), materialLabel: labelFor(simulationIntakeMaterialOptions, answers.material), materialIndex: 1.45, thicknessUm: 120 },
        { ...createSimulationBuilderElement("material-slab", 8.18, "L9.7 coating layer 2"), materialLabel: "high-index coating sample", materialIndex: 2.05, thicknessUm: 90 }
      ],
      target: { ...base.target, label: "L9.7 glass substrate", zMm: 12, incidentIndex: 1, substrateIndex: 1.52, thicknessUm: 0 },
      observationPlaneZMm: 14
    };
  }
  if (routeExample === "scalar") {
    return {
      ...common,
      grid: { ...base.grid, domainWidthUm: 24, domainHeightUm: 18, zEndMm: 45, pointsPerWavelength: 12 },
      elements: [
        { ...createSimulationBuilderElement("circular-aperture", 8, "L9.7 circular aperture"), apertureDiameterUm: 4 },
        { ...createSimulationBuilderElement("ideal-lens", 22, "L9.7 ideal thin lens"), focalLengthMm: 18 }
      ],
      target: { ...base.target, label: "L9.7 transparent focal target", zMm: 34, incidentIndex: 1, substrateIndex: 1, thicknessUm: 0 },
      observationPlaneZMm: 40
    };
  }
  if (routeExample === "external") {
    return {
      ...common,
      grid: { ...base.grid, domainWidthUm: 24, domainHeightUm: 18, zEndMm: 55, pointsPerWavelength: answers.rigor === "fast-preview" ? 10 : 14 },
      elements: orderedSimulationBuilderElements([
        createSimulationBuilderElement("finite-transparent-block", 16, "L9.7 finite transparent block"),
        { ...createSimulationBuilderElement("finite-aperture-blocker", 28, "L9.7 finite aperture edge"), apertureShape: "rectangular-aperture", apertureWidthUm: 4, apertureHeightUm: 8 },
        ...(answers.material === "absorbing-nk-alpha" ? [createSimulationBuilderElement("finite-absorbing-block", 38, "L9.7 absorbing block")] : [])
      ]),
      target: { ...base.target, label: "L9.7 external FDTD target plane", zMm: 45, incidentIndex: 1, substrateIndex: 1.5, thicknessUm: 25 },
      observationPlaneZMm: 52
    };
  }
  return {
    ...common,
    grid: { ...base.grid, domainWidthUm: 32, domainHeightUm: 24, zEndMm: 50 },
    elements: [createSimulationBuilderElement("curved-material-lens", 24, "L9.7 unsupported curved material lens")],
    target: { ...base.target, label: "L9.7 unsupported target scaffold", zMm: 38 },
    observationPlaneZMm: 46
  };
}

function consistencyCasesFor(solverId: SolverRouteSolverId): CrossSolverConsistencyCaseId[] {
  if (solverId === "planar-tmm") return ["tmm-rcwa-no-pattern", "tmm-external-fdtd-slab"];
  if (solverId === "rcwa-1d-preview") return ["tmm-rcwa-no-pattern", "rcwa-external-grating-fixture"];
  if (solverId === "fdtd-2d-cpu" || solverId === "fdtd-2d-webgpu") return ["fdtd-cpu-webgpu-parity", "scalar-fdtd-aperture"];
  if (solverId === "external-fdtd-meep") return ["tmm-external-fdtd-slab", "absorber-consistency", "rcwa-external-grating-fixture"];
  if (solverId === "scalar-propagation") return ["scalar-fdtd-aperture", "tmm-scalar-lens-not-comparable"];
  return ["tmm-scalar-lens-not-comparable"];
}

function actionsFor(routeDecision: SolverRouteDecision, template: SimulationIntakeGeneratedTemplate, consistencyCaseIds: CrossSolverConsistencyCaseId[]): SimulationIntakeAction[] {
  const unsupported = routeDecision.recommendedSolver === "unsupported";
  return [
    {
      id: "create-scene-template",
      label: "Create Scene Template",
      enabled: true,
      target: template.fdtd2dScene ? "fdtd2d" : "builder",
      reason: `Create ${template.label} with preserved wizard answers.`
    },
    {
      id: "open-recommended-solver",
      label: "Open Recommended Solver",
      enabled: !unsupported,
      target: targetFor(routeDecision.recommendedSolver),
      reason: unsupported ? "Unsupported scenes use a gap report instead of opening an executable solver." : `Open ${workbenchLabelFor(routeDecision.recommendedSolver)}.`
    },
    {
      id: "generate-evidence-pack",
      label: "Generate Evidence Pack",
      enabled: true,
      target: "export",
      reason: "Generate the L9.5 evidence task bundle for this route."
    },
    {
      id: "open-consistency-bench",
      label: "Open Consistency Bench",
      enabled: consistencyCaseIds.length > 0,
      target: "consistency",
      reason: consistencyCaseIds.length ? `Show L9.6 checks: ${consistencyCaseIds.join(", ")}.` : "No overlap check is available for this route."
    },
    {
      id: "export-decision-report",
      label: "Export Decision Report",
      enabled: true,
      target: "export",
      reason: "Export simulation_decision_report.md/json, decision matrix CSV, template JSON, and wizard answers JSON."
    },
    {
      id: "show-unsupported-gap-report",
      label: "Show Unsupported Gap Report",
      enabled: unsupported || routeDecision.unsupportedItems.length > 0,
      target: "gap",
      reason: unsupported ? "Show why this request is not executable in the current app." : "Show any scaffold or unsupported items detected by the route."
    }
  ];
}

function normalizeAnswers(answers: SimulationIntakeAnswers): SimulationIntakeAnswers {
  return {
    schema: "emmicro.simulationIntake.answers.v1",
    problemType: answers.problemType,
    desiredOutput: answers.desiredOutput,
    geometry: answers.geometry,
    material: answers.material,
    rigor: answers.rigor
  };
}

function option<TId extends string>(id: TId, label: string, description: string): SimulationIntakeOption<TId> {
  return { id, label, description };
}

function templateKindFor(routeExample: SolverRouteExampleId): SimulationIntakeTemplateKind {
  if (routeExample === "planar") return "planar-tmm-coating-template";
  if (routeExample === "scalar") return "scalar-aperture-lens-template";
  if (routeExample === "rcwa") return "rcwa-binary-grating-template";
  if (routeExample === "fdtd2d") return "fdtd2d-sandbox-template";
  if (routeExample === "external") return "external-fdtd-builder-template";
  return "unsupported-gap-template";
}

function templateLabelFor(routeExample: SolverRouteExampleId): string {
  if (routeExample === "planar") return "L9.7 planar TMM coating template";
  if (routeExample === "scalar") return "L9.7 scalar aperture/lens template";
  if (routeExample === "rcwa") return "L9.7 RCWA binary grating template";
  if (routeExample === "fdtd2d") return "L9.7 2D FDTD sandbox template";
  if (routeExample === "external") return "L9.7 external FDTD Simulation Builder template";
  return "L9.7 unsupported gap report template";
}

function workbenchLabelFor(solverId: SolverRouteSolverId, answers?: SimulationIntakeAnswers): string {
  if (solverId === "planar-tmm") return "Planar TMM / coating workbench";
  if (solverId === "scalar-propagation") return "Scalar aperture/lens diagnostics";
  if (solverId === "rcwa-1d-preview") return "L9.3 RCWA Preview Solver";
  if (solverId === "fdtd-2d-cpu" || solverId === "fdtd-2d-webgpu") return answers?.desiredOutput === "field-animation" ? "L9.2 2D FDTD live field sandbox" : "L9.2 2D FDTD diagnostic sandbox";
  if (solverId === "external-fdtd-meep") return "L8.9 External FDTD run pack / import evidence";
  return "Unsupported gap report";
}

function targetFor(solverId: SolverRouteSolverId): SimulationIntakeAction["target"] {
  if (solverId === "rcwa-1d-preview") return "rcwa";
  if (solverId === "fdtd-2d-cpu" || solverId === "fdtd-2d-webgpu") return "fdtd2d";
  if (solverId === "unsupported") return "gap";
  return "builder";
}

function preservedPreferencesFor(answers: SimulationIntakeAnswers): string[] {
  return [
    `Problem type: ${labelFor(simulationIntakeProblemOptions, answers.problemType)}`,
    `Desired output: ${labelFor(simulationIntakeOutputOptions, answers.desiredOutput)}`,
    `Geometry: ${labelFor(simulationIntakeGeometryOptions, answers.geometry)}`,
    `Material behavior: ${labelFor(simulationIntakeMaterialOptions, answers.material)}`,
    `Rigor/evidence level: ${labelFor(simulationIntakeRigorOptions, answers.rigor)}`
  ];
}

function labelFor<TId extends string>(options: Array<SimulationIntakeOption<TId>>, id: TId): string {
  return options.find((item) => item.id === id)?.label ?? id;
}

function decisionForHash(decision: Omit<SimulationIntakeDecision, "decisionHash">, consistencyReportHash: string): unknown {
  return {
    answers: decision.answers,
    templateHash: decision.generatedTemplate.templateHash,
    routeHash: decision.routeDecision.resultHash,
    evidenceTaskHash: decision.evidenceTask.taskHash,
    consistencyReportHash,
    consistencyCaseIds: decision.consistencyCaseIds,
    nextActions: decision.nextActions.map((action) => ({ id: action.id, enabled: action.enabled, target: action.target }))
  };
}

function uniqueStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function hash(value: unknown): string {
  return fnv1a64(stableStringify(value));
}

function csvRow(values: Array<string | number | boolean | null>): string {
  return values.map((value) => {
    const text = value === null ? "" : String(value);
    if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, "\"\"")}"`;
    return text;
  }).join(",");
}
