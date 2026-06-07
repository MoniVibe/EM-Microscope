import { createFdtd2dFixtureScene, type Fdtd2dFixtureKind, type Fdtd2dScene } from "../fdtd/fdtd2dSandbox";
import { fnv1a64, stableStringify } from "../scene/hashScene";
import { type SimulationBuilderScenario } from "./simulationBuilder";
import {
  createSimulationIntakeDecision,
  simulationIntakeGeneratedTemplateJson,
  simulationIntakeWizardAnswersJson,
  type SimulationIntakeAnswers,
  type SimulationIntakeDecision,
  type SimulationIntakeGeneratedTemplate
} from "./simulationIntakeWizard";
import { promoteSolverEvidenceTaskToCampaign, type SolverEvidenceCampaignPromotion, type SolverEvidenceTask } from "./solverEvidence";
import { type CrossSolverConsistencyCaseId } from "./crossSolverConsistency";
import { type SolverRouteDecision, type SolverRouteExampleId, type SolverRouteSolverId } from "./solverRouter";

export type ExampleLibraryCategoryId =
  | "planar-tmm"
  | "scalar-diffraction"
  | "rcwa"
  | "fdtd2d"
  | "external-fdtd"
  | "camera-diagnostics"
  | "evidence-robustness"
  | "unsupported-gap";

export type ExampleLibraryDifficultyId = "beginner" | "intermediate" | "advanced" | "external-run" | "diagnostic-only" | "gap-unsupported";

export type ExampleLibraryPhysicsTypeId =
  | "planar-tmm"
  | "scalar-diffraction"
  | "rcwa-periodic"
  | "fdtd2d"
  | "external-fdtd"
  | "camera-calibration-mtf"
  | "evidence-robustness"
  | "unsupported-gap";

export type ExampleLibrarySolverLaneId = SolverRouteSolverId | "diagnostics" | "engineering-evidence";

export type ExampleLibraryWorkbenchTarget =
  | "build-my-simulation"
  | "simulation-builder"
  | "rcwa-preview"
  | "fdtd2d-sandbox"
  | "external-fdtd-run-pack"
  | "diagnostics"
  | "engineering-evidence"
  | "gap-report";

export type ExampleLibraryActionId =
  | "load-example"
  | "open-wizard-answers"
  | "show-solver-route"
  | "generate-evidence-pack"
  | "open-consistency-bench"
  | "add-to-engineering-evidence-campaign"
  | "export-example-report";

export type ExampleLibraryAction = {
  id: ExampleLibraryActionId;
  label: string;
  enabled: boolean;
  target: ExampleLibraryWorkbenchTarget | "export" | "consistency";
  reason: string;
};

export type ExampleLibraryEntry = {
  schema: "emmicro.exampleLibrary.entry.v1";
  id: string;
  title: string;
  category: ExampleLibraryCategoryId;
  difficulty: ExampleLibraryDifficultyId;
  physicsType: ExampleLibraryPhysicsTypeId;
  solverLane: ExampleLibrarySolverLaneId;
  routeExample: SolverRouteExampleId;
  targetWorkbench: ExampleLibraryWorkbenchTarget;
  whatThisDemonstrates: string;
  setupSummary: string;
  expectedPhysics: string[];
  expectedOutputs: string[];
  evidence: string[];
  limitations: string[];
  tags: string[];
  runnableInBrowser: boolean;
  externalEvidenceRequired: boolean;
  hasAnalyticReference: boolean;
  hasConvergenceEvidence: boolean;
  hasMeasuredDataWorkflow: boolean;
  unsupported: boolean;
  wizardAnswers: SimulationIntakeAnswers;
  preferredConsistencyCaseIds: CrossSolverConsistencyCaseId[];
  fdtd2dFixtureKind?: Fdtd2dFixtureKind;
  smokeSearchTerm: string;
  exampleHash: string;
};

export type ExampleLibraryRegistry = {
  schema: "emmicro.exampleLibrary.registry.v1";
  label: "L9.8 Guided Example Library / Known Experiment Pack";
  version: "L9.8";
  entries: ExampleLibraryEntry[];
  boundary: string[];
  registryHash: string;
};

export type ExampleLibraryFilters = {
  text?: string;
  solverLane?: ExampleLibrarySolverLaneId | "all";
  physicsType?: ExampleLibraryPhysicsTypeId | "all";
  difficulty?: ExampleLibraryDifficultyId | "all";
  runnableInBrowser?: boolean | null;
  externalEvidenceRequired?: boolean | null;
  hasAnalyticReference?: boolean | null;
  hasConvergenceEvidence?: boolean | null;
  hasMeasuredDataWorkflow?: boolean | null;
  unsupported?: boolean | null;
};

export type ExampleLibraryCampaignPromotion = {
  schema: "emmicro.exampleLibrary.campaignPromotion.v1";
  exampleId: string;
  exampleHash: string;
  evidencePromotion: SolverEvidenceCampaignPromotion;
  preservedHashes: {
    exampleHash: string;
    routeHash: string;
    evidenceTaskHash: string;
    sceneHash: string;
  };
  promotionHash: string;
};

export type ExampleLibraryLoadedExample = {
  schema: "emmicro.exampleLibrary.loadedExample.v1";
  example: ExampleLibraryEntry;
  decision: SimulationIntakeDecision;
  routeDecision: SolverRouteDecision;
  evidenceTask: SolverEvidenceTask;
  generatedTemplate: SimulationIntakeGeneratedTemplate;
  simulationBuilderScenario?: SimulationBuilderScenario;
  fdtd2dScene?: Fdtd2dScene;
  actions: ExampleLibraryAction[];
  campaignPromotion: ExampleLibraryCampaignPromotion;
  loadHash: string;
};

export type ExampleLibraryExportFile = {
  filename: string;
  mime: string;
  content: string;
};

type RawExampleLibraryEntry = Omit<ExampleLibraryEntry, "schema" | "exampleHash">;

export const l98ExampleLibraryBoundary = [
  "L9.8 is a guided example and known-experiment starter library over existing solver routes; it does not add a new solver or new optical physics.",
  "Examples provide starter workflows, expected physics notes, evidence tasks, and limitation reports; they are not automatic correctness proofs.",
  "L9.8 does not provide certified validation, certified solver selection, production RCWA/FDTD certification, arbitrary 3D Maxwell, FEM, BEM, digital twin behavior, hardware control, lab accreditation, or manufacturing certification.",
  "External FDTD examples export/import run packs and evidence only; external execution remains outside the browser and under the user's control.",
  "Unsupported examples remain gap reports and required-evidence checklists, not executable green lights."
] as const;

export const exampleLibraryCategoryLabels: Record<ExampleLibraryCategoryId, string> = {
  "planar-tmm": "Planar coating / TMM",
  "scalar-diffraction": "Scalar diffraction",
  rcwa: "RCWA periodic structures",
  fdtd2d: "2D FDTD sandbox",
  "external-fdtd": "External FDTD finite geometry",
  "camera-diagnostics": "Camera / calibration / MTF diagnostics",
  "evidence-robustness": "Evidence / robustness",
  "unsupported-gap": "Unsupported / gap examples"
};

export const exampleLibraryDifficultyLabels: Record<ExampleLibraryDifficultyId, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  "external-run": "External-run",
  "diagnostic-only": "Diagnostic-only",
  "gap-unsupported": "Gap / unsupported"
};

export const exampleLibraryPhysicsLabels: Record<ExampleLibraryPhysicsTypeId, string> = {
  "planar-tmm": "Planar TMM",
  "scalar-diffraction": "Scalar diffraction",
  "rcwa-periodic": "RCWA periodic",
  fdtd2d: "2D FDTD",
  "external-fdtd": "External FDTD",
  "camera-calibration-mtf": "Camera / calibration / MTF",
  "evidence-robustness": "Evidence / robustness",
  "unsupported-gap": "Unsupported gap"
};

const planarAnswers: SimulationIntakeAnswers = answers("planar-coating", "rta", "infinite-planar-layers", "coating-stack", "fast-preview");
const scalarAnswers: SimulationIntakeAnswers = answers("aperture-slit-lens", "focal-plane-psf", "ideal-mask-phase-elements", "lossless-dielectric-n", "in-browser-diagnostic");
const rcwaAnswers: SimulationIntakeAnswers = answers("periodic-grating", "diffraction-orders", "periodic-1d-grating", "periodic-material-pattern", "convergence-tested-report");
const fdtd2dAnswers: SimulationIntakeAnswers = answers("finite-material-object", "field-animation", "small-2d-slice", "lossless-dielectric-n", "in-browser-diagnostic");
const externalAnswers: SimulationIntakeAnswers = answers("finite-material-object", "field-map-2d", "finite-block-aperture-wedge", "lossless-dielectric-n", "external-solver-evidence");
const diagnosticAnswers: SimulationIntakeAnswers = answers("camera-sensor-image-quality", "mtf-resolution", "measured-image-target-data", "unknown", "in-browser-diagnostic");
const evidenceAnswers: SimulationIntakeAnswers = answers("multi-element-bench", "tolerance-robustness", "finite-block-aperture-wedge", "imported-material-pack", "engineering-evidence-dossier");
const gapAnswers: SimulationIntakeAnswers = answers("multi-element-bench", "field-map-2d", "arbitrary-cad-freeform-curved-3d", "imported-material-pack", "engineering-evidence-dossier");

const rawExampleLibraryEntries: RawExampleLibraryEntry[] = [
  entry({
    id: "planar-air-glass-interface",
    title: "Air-to-glass planar interface",
    category: "planar-tmm",
    difficulty: "beginner",
    physicsType: "planar-tmm",
    solverLane: "planar-tmm",
    routeExample: "planar",
    targetWorkbench: "simulation-builder",
    whatThisDemonstrates: "A single laterally invariant dielectric boundary with the normal-incidence Fresnel limit.",
    setupSummary: "Plane wave from air into n=1.5 glass, no lateral structure, R/T/A requested.",
    expectedPhysics: ["Normal-incidence reflectance is about 4% for n=1 to n=1.5.", "R+T+A should stay near one for a lossless interface."],
    expectedOutputs: ["R/T/A row", "energy-balance residual", "Fresnel limiting-case note", "TMM evidence report"],
    evidence: ["analytic Fresnel reference", "PlanarTmmBackend route", "L9.5 TMM evidence task"],
    limitations: ["No lateral finite geometry, roughness, vector high-NA, or 3D Maxwell behavior is represented."],
    tags: ["air", "glass", "fresnel", "interface", "tmm"],
    runnableInBrowser: true,
    externalEvidenceRequired: false,
    hasAnalyticReference: true,
    hasConvergenceEvidence: false,
    hasMeasuredDataWorkflow: false,
    unsupported: false,
    wizardAnswers: planarAnswers,
    preferredConsistencyCaseIds: ["tmm-rcwa-no-pattern", "tmm-external-fdtd-slab"],
    smokeSearchTerm: "air glass"
  }),
  entry({
    id: "planar-simple-ar-coating",
    title: "Simple AR coating",
    category: "planar-tmm",
    difficulty: "intermediate",
    physicsType: "planar-tmm",
    solverLane: "planar-tmm",
    routeExample: "planar",
    targetWorkbench: "simulation-builder",
    whatThisDemonstrates: "A simple anti-reflection coating candidate routed to the planar stack workflow.",
    setupSummary: "Air, one or two dielectric coating layers, and a glass substrate with R/T/A evidence.",
    expectedPhysics: ["A quarter-wave-like layer can reduce reflectance near the design wavelength.", "Layer-thickness drift affects reflectance yield."],
    expectedOutputs: ["coating-stack template", "R/T/A summary", "material receipt notes", "robust coating candidate handoff"],
    evidence: ["TMM energy balance", "material provenance rows", "optional robust-yield comparison"],
    limitations: ["This is a planar thin-film starter, not a finite coated lens, conformal coating, or manufacturing certificate."],
    tags: ["ar", "coating", "thin-film", "yield", "tmm"],
    runnableInBrowser: true,
    externalEvidenceRequired: false,
    hasAnalyticReference: true,
    hasConvergenceEvidence: false,
    hasMeasuredDataWorkflow: false,
    unsupported: false,
    wizardAnswers: answers("planar-coating", "rta", "infinite-planar-layers", "coating-stack", "engineering-evidence-dossier"),
    preferredConsistencyCaseIds: ["tmm-rcwa-no-pattern", "tmm-external-fdtd-slab"],
    smokeSearchTerm: "coating"
  }),
  entry({
    id: "scalar-circular-aperture-airy",
    title: "Circular aperture Airy/Bessel",
    category: "scalar-diffraction",
    difficulty: "beginner",
    physicsType: "scalar-diffraction",
    solverLane: "scalar-propagation",
    routeExample: "scalar",
    targetWorkbench: "simulation-builder",
    whatThisDemonstrates: "Ideal scalar diffraction from a circular aperture with an Airy/Bessel limiting reference.",
    setupSummary: "Coherent source, ideal zero-thickness circular aperture, ideal lens/focal-plane monitor.",
    expectedPhysics: ["First dark ring follows the Airy/Bessel relation.", "Radial profile should match the scalar benchmark within declared sampling limits."],
    expectedOutputs: ["intensity map", "radial profile", "residual curve", "scalar validation evidence pack"],
    evidence: ["analytic Airy/Bessel reference", "scalar residual rows", "L9.5 scalar-validation task"],
    limitations: ["The aperture is ideal and zero thickness; this is not a finite metal aperture Maxwell solve."],
    tags: ["airy", "bessel", "circular", "aperture", "psf"],
    runnableInBrowser: true,
    externalEvidenceRequired: false,
    hasAnalyticReference: true,
    hasConvergenceEvidence: true,
    hasMeasuredDataWorkflow: false,
    unsupported: false,
    wizardAnswers: scalarAnswers,
    preferredConsistencyCaseIds: ["scalar-fdtd-aperture", "tmm-scalar-lens-not-comparable"],
    smokeSearchTerm: "Airy"
  }),
  entry({
    id: "scalar-long-single-slit",
    title: "Long single slit sinc^2",
    category: "scalar-diffraction",
    difficulty: "beginner",
    physicsType: "scalar-diffraction",
    solverLane: "scalar-propagation",
    routeExample: "scalar",
    targetWorkbench: "simulation-builder",
    whatThisDemonstrates: "Coherent long-slit scalar diffraction and the sinc-squared reference profile.",
    setupSummary: "Ideal long slit, coherent illumination, monitor profile across the diffraction pattern.",
    expectedPhysics: ["Minima spacing follows the single-slit relation.", "Energy loss is aperture transmission, not material absorption."],
    expectedOutputs: ["1D profile", "reference residual", "monitor-stack summary", "scalar evidence pack"],
    evidence: ["analytic sinc-squared reference", "scalar residual rows", "optional scalar-vs-FDTD aperture consistency case"],
    limitations: ["Finite screen thickness, finite conductivity, and edge fields require external evidence."],
    tags: ["slit", "sinc", "diffraction", "scalar"],
    runnableInBrowser: true,
    externalEvidenceRequired: false,
    hasAnalyticReference: true,
    hasConvergenceEvidence: true,
    hasMeasuredDataWorkflow: false,
    unsupported: false,
    wizardAnswers: scalarAnswers,
    preferredConsistencyCaseIds: ["scalar-fdtd-aperture"],
    smokeSearchTerm: "slit"
  }),
  entry({
    id: "scalar-double-slit-order-spacing",
    title: "Double slit order spacing",
    category: "scalar-diffraction",
    difficulty: "intermediate",
    physicsType: "scalar-diffraction",
    solverLane: "scalar-propagation",
    routeExample: "scalar",
    targetWorkbench: "simulation-builder",
    whatThisDemonstrates: "Coherent two-aperture interference order spacing using an ideal scalar mask.",
    setupSummary: "Two ideal slits with coherent illumination and an observation plane in the far-field-like region.",
    expectedPhysics: ["Fringe spacing scales with wavelength and slit separation.", "Single-slit envelope modulates the double-slit orders."],
    expectedOutputs: ["order-spacing table", "profile residual", "field/profile export", "decision report"],
    evidence: ["analytic order-spacing reference", "scalar validation rows", "coherence demonstrator comparison option"],
    limitations: ["No finite-thickness blocker or metal aperture Maxwell fields are claimed."],
    tags: ["double-slit", "interference", "orders", "scalar"],
    runnableInBrowser: true,
    externalEvidenceRequired: false,
    hasAnalyticReference: true,
    hasConvergenceEvidence: true,
    hasMeasuredDataWorkflow: false,
    unsupported: false,
    wizardAnswers: scalarAnswers,
    preferredConsistencyCaseIds: ["scalar-fdtd-aperture"],
    smokeSearchTerm: "double slit"
  }),
  entry({
    id: "scalar-thin-lens-focal-plane",
    title: "Ideal thin lens focal plane",
    category: "scalar-diffraction",
    difficulty: "intermediate",
    physicsType: "scalar-diffraction",
    solverLane: "scalar-propagation",
    routeExample: "scalar",
    targetWorkbench: "simulation-builder",
    whatThisDemonstrates: "Ideal zero-thickness thin-lens phase propagation to a focal-plane monitor.",
    setupSummary: "A scalar field passes through an ideal lens phase element and is sampled near focus.",
    expectedPhysics: ["Focal-plane spot follows the scalar diffraction and sampling assumptions.", "Phase curvature focuses the field without material geometry."],
    expectedOutputs: ["focal-plane intensity", "profile export", "sampling warning rows", "scalar validation report"],
    evidence: ["thin-lens scalar reference", "energy ledger", "monitor-stack summary"],
    limitations: ["No real thick lens material, aberration, vector high-NA, or curved-surface Maxwell solve is represented."],
    tags: ["thin-lens", "focal", "psf", "scalar"],
    runnableInBrowser: true,
    externalEvidenceRequired: false,
    hasAnalyticReference: true,
    hasConvergenceEvidence: true,
    hasMeasuredDataWorkflow: false,
    unsupported: false,
    wizardAnswers: scalarAnswers,
    preferredConsistencyCaseIds: ["tmm-scalar-lens-not-comparable"],
    smokeSearchTerm: "lens"
  }),
  entry({
    id: "scalar-coherence-demonstrator",
    title: "Coherence demonstrator",
    category: "scalar-diffraction",
    difficulty: "intermediate",
    physicsType: "scalar-diffraction",
    solverLane: "scalar-propagation",
    routeExample: "scalar",
    targetWorkbench: "simulation-builder",
    whatThisDemonstrates: "How coherent, partially coherent, and incoherent assumptions change ideal interference visibility.",
    setupSummary: "Double-slit-like scalar setup with explicit coherence interpretation and gamma12 visibility notes.",
    expectedPhysics: ["Visibility falls as mutual coherence decreases.", "The example demonstrates assumptions, not a source statistics engine."],
    expectedOutputs: ["coherence summary", "interference profile", "visibility comparison", "scalar evidence task"],
    evidence: ["deterministic scalar coherence demo", "analytic interference term", "limitations report"],
    limitations: ["This is not a full physical source model, fluorescence model, or vector partial-coherence Maxwell solve."],
    tags: ["coherence", "visibility", "gamma12", "scalar"],
    runnableInBrowser: true,
    externalEvidenceRequired: false,
    hasAnalyticReference: true,
    hasConvergenceEvidence: false,
    hasMeasuredDataWorkflow: false,
    unsupported: false,
    wizardAnswers: answers("aperture-slit-lens", "focal-plane-psf", "ideal-mask-phase-elements", "lossless-dielectric-n", "fast-preview"),
    preferredConsistencyCaseIds: ["scalar-fdtd-aperture"],
    smokeSearchTerm: "coherence"
  }),
  entry({
    id: "rcwa-binary-grating",
    title: "RCWA binary grating",
    category: "rcwa",
    difficulty: "advanced",
    physicsType: "rcwa-periodic",
    solverLane: "rcwa-1d-preview",
    routeExample: "rcwa",
    targetWorkbench: "rcwa-preview",
    whatThisDemonstrates: "A bounded 1D binary periodic grating routed to the in-browser RCWA preview lane.",
    setupSummary: "Plane-wave incidence on a 1D rectangular binary grating with capped harmonic count.",
    expectedPhysics: ["Diffraction orders appear according to the grating equation.", "Harmonic convergence and energy balance determine whether the preview is useful."],
    expectedOutputs: ["order table", "R/T/A totals", "harmonic convergence CSV", "no-pattern TMM consistency option"],
    evidence: ["RCWA convergence task", "energy balance", "propagating/evanescent order status"],
    limitations: ["Only a bounded 1D binary preview is implemented; not arbitrary 2D/aniso/conical/production RCWA."],
    tags: ["rcwa", "grating", "orders", "binary"],
    runnableInBrowser: true,
    externalEvidenceRequired: false,
    hasAnalyticReference: false,
    hasConvergenceEvidence: true,
    hasMeasuredDataWorkflow: false,
    unsupported: false,
    wizardAnswers: rcwaAnswers,
    preferredConsistencyCaseIds: ["tmm-rcwa-no-pattern", "rcwa-external-grating-fixture"],
    smokeSearchTerm: "grating"
  }),
  entry({
    id: "rcwa-no-pattern-tmm-consistency",
    title: "RCWA no-pattern TMM consistency",
    category: "rcwa",
    difficulty: "advanced",
    physicsType: "rcwa-periodic",
    solverLane: "rcwa-1d-preview",
    routeExample: "rcwa",
    targetWorkbench: "rcwa-preview",
    whatThisDemonstrates: "The no-pattern limit should bridge the RCWA preview lane back to PlanarTmmBackend.",
    setupSummary: "Use the RCWA preview with a no-pattern or equivalent fill case and compare against planar TMM.",
    expectedPhysics: ["No lateral pattern should collapse to the planar stack response.", "Residuals expose numerical/configuration mismatch."],
    expectedOutputs: ["TMM consistency row", "harmonic convergence rows", "energy-balance residual", "route/evidence hashes"],
    evidence: ["L9.6 TMM-vs-RCWA no-pattern case", "L9.5 RCWA evidence pack", "TMM bridge report"],
    limitations: ["Agreement in this limiting case does not certify patterned-grating RCWA correctness."],
    tags: ["rcwa", "tmm", "consistency", "no-pattern"],
    runnableInBrowser: true,
    externalEvidenceRequired: false,
    hasAnalyticReference: true,
    hasConvergenceEvidence: true,
    hasMeasuredDataWorkflow: false,
    unsupported: false,
    wizardAnswers: rcwaAnswers,
    preferredConsistencyCaseIds: ["tmm-rcwa-no-pattern"],
    smokeSearchTerm: "no pattern"
  }),
  entry({
    id: "fdtd2d-point-source",
    title: "2D FDTD point source",
    category: "fdtd2d",
    difficulty: "intermediate",
    physicsType: "fdtd2d",
    solverLane: "fdtd-2d-cpu",
    routeExample: "fdtd2d",
    targetWorkbench: "fdtd2d-sandbox",
    whatThisDemonstrates: "A capped in-browser 2D TMz point-source diagnostic fixture with radial symmetry monitors.",
    setupSummary: "Centered Gaussian point source in a bounded simple-absorbing domain with symmetry point monitors.",
    expectedPhysics: ["Fields remain finite and roughly symmetric before boundary loss dominates.", "CFL and grid caps must remain safe."],
    expectedOutputs: ["field/intensity map", "energy trace", "monitor traces", "stability report"],
    evidence: ["2D FDTD fixture reference", "CFL/stability dashboard", "CPU reference stepping"],
    limitations: ["2D TMz diagnostic only; not full 3D Maxwell, production FDTD, or a replacement for external Meep."],
    tags: ["fdtd", "point-source", "tmz", "sandbox"],
    runnableInBrowser: true,
    externalEvidenceRequired: false,
    hasAnalyticReference: false,
    hasConvergenceEvidence: true,
    hasMeasuredDataWorkflow: false,
    unsupported: false,
    wizardAnswers: fdtd2dAnswers,
    preferredConsistencyCaseIds: ["fdtd-cpu-webgpu-parity"],
    fdtd2dFixtureKind: "point-source-symmetry",
    smokeSearchTerm: "FDTD point"
  }),
  entry({
    id: "fdtd2d-dielectric-block",
    title: "2D FDTD dielectric block",
    category: "fdtd2d",
    difficulty: "intermediate",
    physicsType: "fdtd2d",
    solverLane: "fdtd-2d-cpu",
    routeExample: "fdtd2d",
    targetWorkbench: "fdtd2d-sandbox",
    whatThisDemonstrates: "A bounded 2D dielectric-interface/block diagnostic and rough Fresnel trend check.",
    setupSummary: "Line source into a dielectric rectangle/half-space fixture with incident and transmitted monitors.",
    expectedPhysics: ["A dielectric contrast should reflect and transmit qualitatively.", "Monitor trends are diagnostic, not certified flux metrology."],
    expectedOutputs: ["field map", "material map", "monitor trace", "2D FDTD validation report"],
    evidence: ["rough Fresnel reference note", "stability checks", "bounded fixture report"],
    limitations: ["No production FDTD, no arbitrary 3D block solve, and no lab validation claim."],
    tags: ["fdtd", "dielectric", "block", "interface"],
    runnableInBrowser: true,
    externalEvidenceRequired: false,
    hasAnalyticReference: true,
    hasConvergenceEvidence: true,
    hasMeasuredDataWorkflow: false,
    unsupported: false,
    wizardAnswers: fdtd2dAnswers,
    preferredConsistencyCaseIds: ["fdtd-cpu-webgpu-parity", "tmm-external-fdtd-slab"],
    fdtd2dFixtureKind: "dielectric-interface",
    smokeSearchTerm: "dielectric"
  }),
  entry({
    id: "fdtd2d-pec-reflection",
    title: "2D FDTD PEC reflection",
    category: "fdtd2d",
    difficulty: "intermediate",
    physicsType: "fdtd2d",
    solverLane: "fdtd-2d-cpu",
    routeExample: "fdtd2d",
    targetWorkbench: "fdtd2d-sandbox",
    whatThisDemonstrates: "A PEC-like reflection fixture in the bounded 2D FDTD sandbox.",
    setupSummary: "Pulse source and PEC-like blocker/wall with behind-wall and source-side monitors.",
    expectedPhysics: ["Field behind the wall should remain lower than the source side.", "Reflection behavior is qualitative within the capped sandbox."],
    expectedOutputs: ["field snapshot", "behind-wall monitor trace", "validation fixture report", "CPU/WebGPU parity option"],
    evidence: ["PEC-like fixture reference", "stability and finite-field checks", "monitor trace exports"],
    limitations: ["PEC behavior is idealized in 2D TMz and is not finite metal optical certification."],
    tags: ["fdtd", "pec", "reflection", "wall"],
    runnableInBrowser: true,
    externalEvidenceRequired: false,
    hasAnalyticReference: false,
    hasConvergenceEvidence: true,
    hasMeasuredDataWorkflow: false,
    unsupported: false,
    wizardAnswers: fdtd2dAnswers,
    preferredConsistencyCaseIds: ["fdtd-cpu-webgpu-parity"],
    fdtd2dFixtureKind: "pec-wall",
    smokeSearchTerm: "PEC"
  }),
  entry({
    id: "external-transparent-finite-block",
    title: "External FDTD transparent finite block",
    category: "external-fdtd",
    difficulty: "external-run",
    physicsType: "external-fdtd",
    solverLane: "external-fdtd-meep",
    routeExample: "external",
    targetWorkbench: "external-fdtd-run-pack",
    whatThisDemonstrates: "Finite transparent geometry requiring external field/flux evidence rather than an in-browser production solve.",
    setupSummary: "Finite dielectric block and monitor stack exported as an external FDTD / Meep run pack.",
    expectedPhysics: ["Imported flux should trend against slab/Fresnel references where applicable.", "Receipts and convergence/PML checks determine evidence quality."],
    expectedOutputs: ["scene manifest", "Meep helper script", "run config", "import checklist", "field/flux evidence slots"],
    evidence: ["external run receipt", "flux summary", "field slice", "convergence/PML review"],
    limitations: ["Browser does not execute or certify the external run; imported evidence is required for serious claims."],
    tags: ["external", "fdtd", "transparent", "finite-block", "meep"],
    runnableInBrowser: false,
    externalEvidenceRequired: true,
    hasAnalyticReference: true,
    hasConvergenceEvidence: true,
    hasMeasuredDataWorkflow: false,
    unsupported: false,
    wizardAnswers: externalAnswers,
    preferredConsistencyCaseIds: ["tmm-external-fdtd-slab"],
    smokeSearchTerm: "transparent finite"
  }),
  entry({
    id: "external-aperture-blocker",
    title: "External FDTD aperture/blocker",
    category: "external-fdtd",
    difficulty: "external-run",
    physicsType: "external-fdtd",
    solverLane: "external-fdtd-meep",
    routeExample: "external",
    targetWorkbench: "external-fdtd-run-pack",
    whatThisDemonstrates: "A finite aperture/blocker edge case with scalar limiting references and external evidence slots.",
    setupSummary: "Finite aperture or blocker exported for external FDTD, then imported as field/flux evidence.",
    expectedPhysics: ["Aperture/blocker edge behavior needs external convergence before physical interpretation.", "Scalar limiting references help sanity-check trends only."],
    expectedOutputs: ["external run pack", "aperture validation dossier", "field slice", "convergence summary"],
    evidence: ["aperture/blocker import checklist", "scalar limiting reference", "PML/convergence warning rows"],
    limitations: ["This is not a finite metal aperture Maxwell solve in the browser."],
    tags: ["external", "fdtd", "aperture", "blocker", "edge"],
    runnableInBrowser: false,
    externalEvidenceRequired: true,
    hasAnalyticReference: true,
    hasConvergenceEvidence: true,
    hasMeasuredDataWorkflow: false,
    unsupported: false,
    wizardAnswers: answers("finite-material-object", "field-map-2d", "finite-block-aperture-wedge", "reflective-ideal-plate", "convergence-tested-report"),
    preferredConsistencyCaseIds: ["scalar-fdtd-aperture"],
    smokeSearchTerm: "aperture blocker"
  }),
  entry({
    id: "diagnostic-camera-photon-transfer",
    title: "Camera photon-transfer calibration",
    category: "camera-diagnostics",
    difficulty: "diagnostic-only",
    physicsType: "camera-calibration-mtf",
    solverLane: "diagnostics",
    routeExample: "unsupported",
    targetWorkbench: "diagnostics",
    whatThisDemonstrates: "Camera calibration diagnostics over imported/synthetic measurement summaries.",
    setupSummary: "Photon-transfer CSV or example measurements feed the camera calibration workbench.",
    expectedPhysics: ["Gain, read-noise, and linearity fits are diagnostic summaries.", "This does not model pixel-level EM sensor-stack absorption."],
    expectedOutputs: ["calibration report", "residual rows", "camera profile handoff", "study export"],
    evidence: ["EMVA-inspired diagnostic report", "residual RMS/max", "source CSV receipts"],
    limitations: ["Not EMVA 1288 certification, ISO-certified calibration, lab accreditation, hardware control, or sensor-stack EM."],
    tags: ["camera", "photon-transfer", "calibration", "diagnostic"],
    runnableInBrowser: true,
    externalEvidenceRequired: false,
    hasAnalyticReference: false,
    hasConvergenceEvidence: false,
    hasMeasuredDataWorkflow: true,
    unsupported: false,
    wizardAnswers: diagnosticAnswers,
    preferredConsistencyCaseIds: [],
    smokeSearchTerm: "camera"
  }),
  entry({
    id: "diagnostic-slanted-edge-mtf",
    title: "Slanted-edge MTF",
    category: "camera-diagnostics",
    difficulty: "diagnostic-only",
    physicsType: "camera-calibration-mtf",
    solverLane: "diagnostics",
    routeExample: "unsupported",
    targetWorkbench: "diagnostics",
    whatThisDemonstrates: "ISO 12233-inspired slanted-edge SFR/MTF diagnostics over generated or imported target images.",
    setupSummary: "Generate/import a slanted-edge target, compute ESF/LSF/SFR-MTF, and compare blur response.",
    expectedPhysics: ["MTF50 and MTF10 summarize edge sharpness under the diagnostic image model.", "Measured-vs-simulated MTF can sanity-check trends."],
    expectedOutputs: ["MTF bundle", "SFR/MTF CSV", "blur comparison", "line-pair sanity check"],
    evidence: ["slanted-edge diagnostic report", "measured-vs-simulated MTF comparison", "target contrast checks"],
    limitations: ["Not ISO 12233 certification, Imatest-equivalent certification, certified metrology, or full EM optics."],
    tags: ["mtf", "slanted-edge", "resolution", "diagnostic"],
    runnableInBrowser: true,
    externalEvidenceRequired: false,
    hasAnalyticReference: false,
    hasConvergenceEvidence: false,
    hasMeasuredDataWorkflow: true,
    unsupported: false,
    wizardAnswers: diagnosticAnswers,
    preferredConsistencyCaseIds: [],
    smokeSearchTerm: "MTF"
  }),
  entry({
    id: "diagnostic-geometric-dot-grid",
    title: "Geometric dot-grid calibration",
    category: "camera-diagnostics",
    difficulty: "diagnostic-only",
    physicsType: "camera-calibration-mtf",
    solverLane: "diagnostics",
    routeExample: "unsupported",
    targetWorkbench: "diagnostics",
    whatThisDemonstrates: "2D dot-grid target fitting for pixel scale, rotation, shear, and radial residual diagnostics.",
    setupSummary: "Generate/import dot-grid points, fit similarity/affine/radial models, inspect residual vectors.",
    expectedPhysics: ["Fitted residuals summarize 2D image geometry and distortion.", "Manual point correction changes the diagnostic fit input only."],
    expectedOutputs: ["geometry fit report", "residual vector map", "distortion CSV", "session QA handoff"],
    evidence: ["target point CSV receipt", "fit residual rows", "confidence report"],
    limitations: ["Not certified camera calibration, lab metrology, or full 3D pose/stereo calibration."],
    tags: ["dot-grid", "geometry", "distortion", "pixel-scale", "diagnostic"],
    runnableInBrowser: true,
    externalEvidenceRequired: false,
    hasAnalyticReference: false,
    hasConvergenceEvidence: false,
    hasMeasuredDataWorkflow: true,
    unsupported: false,
    wizardAnswers: answers("measured-target-calibration", "geometric-distortion-pixel-scale", "measured-image-target-data", "unknown", "in-browser-diagnostic"),
    preferredConsistencyCaseIds: [],
    smokeSearchTerm: "dot grid"
  }),
  entry({
    id: "evidence-engineering-campaign",
    title: "Engineering Evidence Campaign",
    category: "evidence-robustness",
    difficulty: "advanced",
    physicsType: "evidence-robustness",
    solverLane: "engineering-evidence",
    routeExample: "external",
    targetWorkbench: "engineering-evidence",
    whatThisDemonstrates: "A campaign-level dossier over curated scenarios, convergence, tolerance, robust-design, and unsupported-item evidence.",
    setupSummary: "Golden evidence campaign manifest plus summary/dossier exports from existing L8.8/L9.x receipts.",
    expectedPhysics: ["Scenario references and residuals are reported with hashes and limitations.", "Iteration count is not validation."],
    expectedOutputs: ["engineering_evidence_dossier.md", "scenario_summary.csv", "capability_truth_table.csv", "unsupported_items.csv"],
    evidence: ["scenario receipts", "convergence/PML summaries", "tolerance and robust before/after metrics"],
    limitations: ["Not certified validation, production EM solver certification, automatic final design approval, or manufacturing certification."],
    tags: ["evidence", "campaign", "dossier", "hashes"],
    runnableInBrowser: true,
    externalEvidenceRequired: true,
    hasAnalyticReference: true,
    hasConvergenceEvidence: true,
    hasMeasuredDataWorkflow: true,
    unsupported: false,
    wizardAnswers: evidenceAnswers,
    preferredConsistencyCaseIds: ["tmm-external-fdtd-slab", "absorber-consistency", "rcwa-external-grating-fixture"],
    smokeSearchTerm: "campaign"
  }),
  entry({
    id: "evidence-process-tolerance-runner",
    title: "Process tolerance runner",
    category: "evidence-robustness",
    difficulty: "advanced",
    physicsType: "evidence-robustness",
    solverLane: "engineering-evidence",
    routeExample: "external",
    targetWorkbench: "engineering-evidence",
    whatThisDemonstrates: "Deterministic one-at-a-time, grid, and seeded tolerance studies over an editable optical bench.",
    setupSummary: "Variation specs attach to source, element, target, material, and monitor parameters with thresholds.",
    expectedPhysics: ["Sensitivity rankings show which variables move diagnostic metrics most.", "Worst-case and pass-rate tables summarize tolerance risk."],
    expectedOutputs: ["tolerance_report.md", "tolerance_run_table.csv", "tolerance_sensitivity.csv", "external FDTD variation sweep manifest"],
    evidence: ["variation hash", "threshold rows", "external sweep receipt slots"],
    limitations: ["Diagnostic tolerance study only; not certified optical tolerancing or automatic redesign."],
    tags: ["tolerance", "process", "variation", "sensitivity"],
    runnableInBrowser: true,
    externalEvidenceRequired: true,
    hasAnalyticReference: false,
    hasConvergenceEvidence: true,
    hasMeasuredDataWorkflow: false,
    unsupported: false,
    wizardAnswers: evidenceAnswers,
    preferredConsistencyCaseIds: ["tmm-external-fdtd-slab", "absorber-consistency"],
    smokeSearchTerm: "tolerance"
  }),
  entry({
    id: "evidence-robust-design-advisor",
    title: "Robust Design Advisor",
    category: "evidence-robustness",
    difficulty: "advanced",
    physicsType: "evidence-robustness",
    solverLane: "engineering-evidence",
    routeExample: "external",
    targetWorkbench: "engineering-evidence",
    whatThisDemonstrates: "Ranked recentering, tolerance-budget, and candidate-grid suggestions over existing tolerance evidence.",
    setupSummary: "Run or import tolerance evidence, review candidate comparison, and explicitly apply any candidate.",
    expectedPhysics: ["Candidate scores summarize diagnostic robustness changes.", "Recommendations do not become design changes until the user applies them."],
    expectedOutputs: ["robust_design_report.md", "candidate_table.csv", "recommendations.csv", "before_after_metrics.csv"],
    evidence: ["baseline and candidate hashes", "pass-rate delta", "worst-case improvement", "external candidate sweep receipts"],
    limitations: ["Not automatic final design approval, full inverse design, inverse optimization, or certified manufacturing readiness."],
    tags: ["robust", "advisor", "candidate", "tolerance"],
    runnableInBrowser: true,
    externalEvidenceRequired: true,
    hasAnalyticReference: false,
    hasConvergenceEvidence: true,
    hasMeasuredDataWorkflow: false,
    unsupported: false,
    wizardAnswers: evidenceAnswers,
    preferredConsistencyCaseIds: ["absorber-consistency", "tmm-external-fdtd-slab"],
    smokeSearchTerm: "robust"
  }),
  entry({
    id: "gap-unsupported-curved-material-lens",
    title: "Unsupported curved material lens / arbitrary CAD gap",
    category: "unsupported-gap",
    difficulty: "gap-unsupported",
    physicsType: "unsupported-gap",
    solverLane: "unsupported",
    routeExample: "unsupported",
    targetWorkbench: "gap-report",
    whatThisDemonstrates: "How the app should refuse arbitrary curved/freeform/CAD material geometry while preserving useful next steps.",
    setupSummary: "Curved/freeform material lens request is converted into a gap report with safe approximations and external evidence needs.",
    expectedPhysics: ["No executable in-app route is selected.", "The report names future solvers/evidence rather than implying capability."],
    expectedOutputs: ["unsupported gap report", "required evidence checklist", "safe approximation list", "wizard answers JSON"],
    evidence: ["unsupported-feature route", "gap report", "required future/external solver list"],
    limitations: ["Not runnable as a solver; no arbitrary 3D Maxwell, FEM, BEM, CAD meshing, or production FDTD is implemented."],
    tags: ["unsupported", "curved-lens", "cad", "3d-maxwell", "gap"],
    runnableInBrowser: false,
    externalEvidenceRequired: true,
    hasAnalyticReference: false,
    hasConvergenceEvidence: false,
    hasMeasuredDataWorkflow: false,
    unsupported: true,
    wizardAnswers: gapAnswers,
    preferredConsistencyCaseIds: ["tmm-scalar-lens-not-comparable"],
    smokeSearchTerm: "curved lens"
  })
];

export function createExampleLibraryRegistry(): ExampleLibraryRegistry {
  const entries = rawExampleLibraryEntries.map(materializeEntry);
  const stable = {
    schema: "emmicro.exampleLibrary.registry.v1",
    version: "L9.8",
    entries: entries.map((example) => ({ id: example.id, hash: example.exampleHash })),
    boundary: l98ExampleLibraryBoundary
  };
  return {
    schema: "emmicro.exampleLibrary.registry.v1",
    label: "L9.8 Guided Example Library / Known Experiment Pack",
    version: "L9.8",
    entries,
    boundary: [...l98ExampleLibraryBoundary],
    registryHash: hash(stable)
  };
}

export function getExampleLibraryEntry(id: string): ExampleLibraryEntry | undefined {
  return createExampleLibraryRegistry().entries.find((entry) => entry.id === id);
}

export function filterExampleLibraryEntries(filters: ExampleLibraryFilters = {}, entries = createExampleLibraryRegistry().entries): ExampleLibraryEntry[] {
  const text = (filters.text ?? "").trim().toLowerCase();
  return entries.filter((entry) => {
    if (filters.solverLane && filters.solverLane !== "all" && entry.solverLane !== filters.solverLane) return false;
    if (filters.physicsType && filters.physicsType !== "all" && entry.physicsType !== filters.physicsType) return false;
    if (filters.difficulty && filters.difficulty !== "all" && entry.difficulty !== filters.difficulty) return false;
    if (typeof filters.runnableInBrowser === "boolean" && entry.runnableInBrowser !== filters.runnableInBrowser) return false;
    if (typeof filters.externalEvidenceRequired === "boolean" && entry.externalEvidenceRequired !== filters.externalEvidenceRequired) return false;
    if (typeof filters.hasAnalyticReference === "boolean" && entry.hasAnalyticReference !== filters.hasAnalyticReference) return false;
    if (typeof filters.hasConvergenceEvidence === "boolean" && entry.hasConvergenceEvidence !== filters.hasConvergenceEvidence) return false;
    if (typeof filters.hasMeasuredDataWorkflow === "boolean" && entry.hasMeasuredDataWorkflow !== filters.hasMeasuredDataWorkflow) return false;
    if (typeof filters.unsupported === "boolean" && entry.unsupported !== filters.unsupported) return false;
    if (!text) return true;
    const haystack = [
      entry.id,
      entry.title,
      exampleLibraryCategoryLabels[entry.category],
      exampleLibraryDifficultyLabels[entry.difficulty],
      exampleLibraryPhysicsLabels[entry.physicsType],
      entry.solverLane,
      entry.routeExample,
      entry.targetWorkbench,
      entry.whatThisDemonstrates,
      entry.setupSummary,
      entry.smokeSearchTerm,
      ...entry.expectedPhysics,
      ...entry.expectedOutputs,
      ...entry.evidence,
      ...entry.limitations,
      ...entry.tags
    ].join(" ").toLowerCase();
    return haystack.includes(text);
  });
}

export function loadExampleLibraryEntry(id: string): ExampleLibraryLoadedExample {
  const example = getExampleLibraryEntry(id);
  if (!example) throw new Error(`Example library entry '${id}' is not registered`);
  const decision = createSimulationIntakeDecision(example.wizardAnswers);
  const fdtd2dScene = example.fdtd2dFixtureKind ? createFdtd2dFixtureScene(example.fdtd2dFixtureKind) : decision.generatedTemplate.fdtd2dScene;
  const campaignPromotion = promoteExampleToEngineeringEvidenceCampaign(example, decision.evidenceTask);
  const draft = {
    schema: "emmicro.exampleLibrary.loadedExample.v1" as const,
    example,
    decision,
    routeDecision: decision.routeDecision,
    evidenceTask: decision.evidenceTask,
    generatedTemplate: decision.generatedTemplate,
    simulationBuilderScenario: decision.generatedTemplate.simulationBuilderScenario,
    fdtd2dScene,
    actions: actionsForLoadedExample(example, decision),
    campaignPromotion
  };
  return { ...draft, loadHash: hash(loadedExampleForHash(draft)) };
}

export function exampleLibraryReportMarkdown(loaded: ExampleLibraryLoadedExample): string {
  const example = loaded.example;
  return [
    "# L9.8 Guided Example Report",
    "",
    `Example: ${example.title}`,
    `Example id: ${example.id}`,
    `Example hash: ${example.exampleHash}`,
    `Load hash: ${loaded.loadHash}`,
    `Category: ${exampleLibraryCategoryLabels[example.category]}`,
    `Difficulty: ${exampleLibraryDifficultyLabels[example.difficulty]}`,
    `Physics type: ${exampleLibraryPhysicsLabels[example.physicsType]}`,
    `Solver lane: ${example.solverLane}`,
    `Route example: ${example.routeExample}`,
    `Target workbench: ${example.targetWorkbench}`,
    `Runnable in browser: ${example.runnableInBrowser ? "yes" : "no"}`,
    `External evidence required: ${example.externalEvidenceRequired ? "yes" : "no"}`,
    `Unsupported/gap: ${example.unsupported ? "yes" : "no"}`,
    "",
    "## What This Demonstrates",
    "",
    example.whatThisDemonstrates,
    "",
    "## Setup",
    "",
    example.setupSummary,
    "",
    "## Solver Recommendation",
    "",
    `Recommended solver: ${loaded.routeDecision.recommendedSolverLabel} (${loaded.routeDecision.recommendedSolver})`,
    `Route status: ${loaded.routeDecision.status}`,
    `Route hash: ${loaded.routeDecision.resultHash}`,
    `Evidence task: ${loaded.evidenceTask.label}`,
    `Evidence task hash: ${loaded.evidenceTask.taskHash}`,
    "",
    "## Expected Physics",
    "",
    ...example.expectedPhysics.map((item) => `- ${item}`),
    "",
    "## Expected Outputs",
    "",
    ...example.expectedOutputs.map((item) => `- ${item}`),
    "",
    "## Evidence Task",
    "",
    ...example.evidence.map((item) => `- ${item}`),
    "",
    "## Actions",
    "",
    ...loaded.actions.map((action) => `- ${action.label}: ${action.enabled ? "enabled" : "disabled"} - ${action.reason}`),
    "",
    "## Limitations",
    "",
    ...example.limitations.map((item) => `- ${item}`),
    "",
    "## Boundary",
    "",
    ...l98ExampleLibraryBoundary.map((item) => `- ${item}`)
  ].join("\n");
}

export function exampleLibraryReportJson(loaded: ExampleLibraryLoadedExample): string {
  return `${JSON.stringify(loaded, null, 2)}\n`;
}

export function exampleLibraryRegistryCsv(entries = createExampleLibraryRegistry().entries): string {
  return [
    "example_id,title,category,difficulty,physics_type,solver_lane,route_example,target_workbench,runnable_in_browser,external_evidence_required,analytic_reference,convergence_evidence,measured_data_workflow,unsupported,example_hash",
    ...entries.map((entry) =>
      csvRow([
        entry.id,
        entry.title,
        exampleLibraryCategoryLabels[entry.category],
        exampleLibraryDifficultyLabels[entry.difficulty],
        exampleLibraryPhysicsLabels[entry.physicsType],
        entry.solverLane,
        entry.routeExample,
        entry.targetWorkbench,
        entry.runnableInBrowser,
        entry.externalEvidenceRequired,
        entry.hasAnalyticReference,
        entry.hasConvergenceEvidence,
        entry.hasMeasuredDataWorkflow,
        entry.unsupported,
        entry.exampleHash
      ])
    )
  ].join("\n");
}

export function exampleLibrarySceneTemplateJson(loaded: ExampleLibraryLoadedExample): string {
  return `${JSON.stringify(
    {
      schema: "emmicro.exampleLibrary.sceneTemplate.v1",
      exampleId: loaded.example.id,
      exampleHash: loaded.example.exampleHash,
      templateHash: loaded.generatedTemplate.templateHash,
      routeHash: loaded.routeDecision.resultHash,
      generatedTemplate: loaded.generatedTemplate,
      fdtd2dScene: loaded.fdtd2dScene
    },
    null,
    2
  )}\n`;
}

export function exampleLibraryWizardAnswersJson(loaded: ExampleLibraryLoadedExample): string {
  return simulationIntakeWizardAnswersJson(loaded.example.wizardAnswers);
}

export function exampleLibraryExportFiles(loaded: ExampleLibraryLoadedExample, registry = createExampleLibraryRegistry()): ExampleLibraryExportFile[] {
  return [
    file("example_report.md", "text/markdown", `${exampleLibraryReportMarkdown(loaded)}\n`),
    file("example_report.json", "application/json", exampleLibraryReportJson(loaded)),
    file("example_registry.csv", "text/csv", `${exampleLibraryRegistryCsv(registry.entries)}\n`),
    file("example_scene_template.json", "application/json", exampleLibrarySceneTemplateJson(loaded)),
    file("example_wizard_answers.json", "application/json", exampleLibraryWizardAnswersJson(loaded))
  ];
}

export function promoteExampleToEngineeringEvidenceCampaign(example: ExampleLibraryEntry, evidenceTask: SolverEvidenceTask): ExampleLibraryCampaignPromotion {
  const evidencePromotion = promoteSolverEvidenceTaskToCampaign(evidenceTask);
  const draft = {
    schema: "emmicro.exampleLibrary.campaignPromotion.v1" as const,
    exampleId: example.id,
    exampleHash: example.exampleHash,
    evidencePromotion,
    preservedHashes: {
      exampleHash: example.exampleHash,
      routeHash: evidenceTask.routeHash,
      evidenceTaskHash: evidenceTask.taskHash,
      sceneHash: evidenceTask.sceneHash
    }
  };
  return { ...draft, promotionHash: hash(draft) };
}

function materializeEntry(raw: RawExampleLibraryEntry): ExampleLibraryEntry {
  const draft = { schema: "emmicro.exampleLibrary.entry.v1" as const, ...raw };
  return { ...draft, exampleHash: hash(exampleForHash(draft)) };
}

function entry(raw: RawExampleLibraryEntry): RawExampleLibraryEntry {
  return raw;
}

function answers(
  problemType: SimulationIntakeAnswers["problemType"],
  desiredOutput: SimulationIntakeAnswers["desiredOutput"],
  geometry: SimulationIntakeAnswers["geometry"],
  material: SimulationIntakeAnswers["material"],
  rigor: SimulationIntakeAnswers["rigor"]
): SimulationIntakeAnswers {
  return {
    schema: "emmicro.simulationIntake.answers.v1",
    problemType,
    desiredOutput,
    geometry,
    material,
    rigor
  };
}

function actionsForLoadedExample(example: ExampleLibraryEntry, decision: SimulationIntakeDecision): ExampleLibraryAction[] {
  const actions: ExampleLibraryAction[] = [
    {
      id: "load-example",
      label: "Load Example",
      enabled: true,
      target: example.targetWorkbench,
      reason: example.unsupported
        ? "Load the unsupported gap report and required-evidence checklist without opening an executable solver."
        : `Load this example into ${example.targetWorkbench}.`
    },
    {
      id: "open-wizard-answers",
      label: "Open Wizard Answers",
      enabled: true,
      target: "build-my-simulation",
      reason: "Populate the L9.7 wizard answer set for this known experiment."
    },
    {
      id: "show-solver-route",
      label: "Show Solver Route",
      enabled: true,
      target: "build-my-simulation",
      reason: `Show the L9.4 route decision ${decision.routeDecision.resultHash}.`
    },
    {
      id: "generate-evidence-pack",
      label: "Generate Evidence Pack",
      enabled: true,
      target: "export",
      reason: `Generate the L9.5 ${decision.evidenceTask.taskType} evidence task.`
    },
    {
      id: "open-consistency-bench",
      label: "Open Consistency Bench",
      enabled: example.preferredConsistencyCaseIds.length > 0,
      target: "consistency",
      reason: example.preferredConsistencyCaseIds.length
        ? `Review ${example.preferredConsistencyCaseIds.join(", ")}.`
        : "No cross-solver overlap case is attached to this diagnostic example."
    },
    {
      id: "add-to-engineering-evidence-campaign",
      label: "Add to Engineering Evidence Campaign",
      enabled: !example.unsupported,
      target: "engineering-evidence",
      reason: example.unsupported
        ? "Unsupported gap examples remain reports and are not promoted as executable campaign scenarios."
        : "Preserve example id/hash plus route/evidence task hashes for campaign handoff."
    },
    {
      id: "export-example-report",
      label: "Export Example Report",
      enabled: true,
      target: "export",
      reason: "Export example_report.md/json, example_registry.csv, scene template JSON, and wizard answers JSON."
    }
  ];
  return actions;
}

function exampleForHash(entry: Omit<ExampleLibraryEntry, "exampleHash">): unknown {
  return {
    schema: entry.schema,
    id: entry.id,
    title: entry.title,
    category: entry.category,
    difficulty: entry.difficulty,
    physicsType: entry.physicsType,
    solverLane: entry.solverLane,
    routeExample: entry.routeExample,
    targetWorkbench: entry.targetWorkbench,
    whatThisDemonstrates: entry.whatThisDemonstrates,
    setupSummary: entry.setupSummary,
    expectedPhysics: entry.expectedPhysics,
    expectedOutputs: entry.expectedOutputs,
    evidence: entry.evidence,
    limitations: entry.limitations,
    tags: entry.tags,
    runnableInBrowser: entry.runnableInBrowser,
    externalEvidenceRequired: entry.externalEvidenceRequired,
    hasAnalyticReference: entry.hasAnalyticReference,
    hasConvergenceEvidence: entry.hasConvergenceEvidence,
    hasMeasuredDataWorkflow: entry.hasMeasuredDataWorkflow,
    unsupported: entry.unsupported,
    wizardAnswers: entry.wizardAnswers,
    preferredConsistencyCaseIds: entry.preferredConsistencyCaseIds,
    fdtd2dFixtureKind: entry.fdtd2dFixtureKind,
    smokeSearchTerm: entry.smokeSearchTerm
  };
}

function loadedExampleForHash(loaded: Omit<ExampleLibraryLoadedExample, "loadHash">): unknown {
  return {
    schema: loaded.schema,
    exampleId: loaded.example.id,
    exampleHash: loaded.example.exampleHash,
    decisionHash: loaded.decision.decisionHash,
    routeHash: loaded.routeDecision.resultHash,
    taskHash: loaded.evidenceTask.taskHash,
    templateHash: loaded.generatedTemplate.templateHash,
    fdtd2dSceneHash: loaded.fdtd2dScene?.sceneHash ?? null,
    actionIds: loaded.actions.map((action) => [action.id, action.enabled, action.target]),
    campaignPromotionHash: loaded.campaignPromotion.promotionHash
  };
}

function file(filename: string, mime: string, content: string): ExampleLibraryExportFile {
  return { filename, mime, content };
}

function hash(value: unknown): string {
  return fnv1a64(stableStringify(value));
}

function csvRow(values: Array<string | number | boolean>): string {
  return values.map((value) => {
    const text = String(value);
    if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  }).join(",");
}

// Keep the L9.7 template export helper referenced from this module for source-guarded export compatibility.
export const exampleLibraryGeneratedTemplateJson = simulationIntakeGeneratedTemplateJson;
