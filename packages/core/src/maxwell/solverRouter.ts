import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SimulationBuilderElementKind, SimulationBuilderScenario } from "./simulationBuilder";

export type SolverRouteSolverId = "planar-tmm" | "scalar-propagation" | "rcwa-1d-preview" | "fdtd-2d-cpu" | "fdtd-2d-webgpu" | "external-fdtd-meep" | "unsupported";

export type SolverExecution = "in-browser" | "external" | "scaffold" | "not-implemented";
export type SolverDimensions = "1d-planar" | "2d" | "2.5d" | "3d-external" | "periodic-1d" | "none";
export type SolverRiskLevel = "low" | "medium" | "high";
export type SolverRouteStatus = "ready" | "warning" | "external-required" | "unsupported";
export type SolverAlternativeStatus = "recommended" | "possible" | "diagnostic" | "external-only" | "rejected" | "unsupported";
export type MethodMatrixStatus = "best" | "possible" | "diagnostic" | "external-only" | "unsupported" | "not-valid" | "overkill" | "scaffold";

export type SolverSceneFeatureId =
  | "planar-layers"
  | "ideal-aperture-lens"
  | "periodic-1d-grating"
  | "small-2d-finite-slice"
  | "finite-material-geometry"
  | "external-run-evidence"
  | "curved-freeform-cad"
  | "arbitrary-3d-geometry"
  | "finite-metal-optics"
  | "production-certification-request";

export type SolverSceneKind = "planar-multilayer-stack" | "ideal-scalar-chain" | "periodic-1d-grating" | "small-2d-finite-slice" | "finite-external-fdtd" | "unsupported-scaffold";

export type SolverCapability = {
  id: SolverRouteSolverId;
  label: string;
  implemented: boolean;
  execution: SolverExecution;
  dimensions: SolverDimensions;
  supports: string[];
  rejects: string[];
  validationAvailable: string[];
  riskLevel: SolverRiskLevel;
  notes: string[];
};

export type SolverSceneDescriptor = {
  sceneId: string;
  label: string;
  summary: string;
  kind: SolverSceneKind;
  features: SolverSceneFeatureId[];
  sourceModel: string;
  requestedOutputs: string[];
  dimensions: "1d" | "2d" | "2.5d" | "3d" | "mixed";
  provenance: string[];
};

export type SolverAlternative = {
  solverId: SolverRouteSolverId;
  label: string;
  status: SolverAlternativeStatus;
  reasons: string[];
  assumptions: string[];
  limitations: string[];
};

export type ValidationCheck = {
  id: string;
  label: string;
  status: "available" | "external-required" | "not-applicable";
  description: string;
};

export type SolverCostEstimate = {
  runtimeClass: "instant" | "interactive" | "bounded-browser" | "external-run" | "blocked";
  computeLocation: "browser" | "browser-or-gpu" | "external" | "none";
  relativeCost: "low" | "medium" | "high" | "not-applicable";
  riskLevel: SolverRiskLevel;
  notes: string[];
};

export type SolverRouteAction = {
  id: string;
  label: string;
  solverId: SolverRouteSolverId;
  kind: "open-panel" | "handoff" | "export" | "show-info";
  enabled: boolean;
  reason: string;
};

export type SolverRouteDecision = {
  schema: "emmicro.solverRouter.decision.v1";
  sceneId: string;
  sceneLabel: string;
  sceneKind: SolverSceneKind;
  recommendedSolver: SolverRouteSolverId;
  recommendedSolverLabel: string;
  alternatives: SolverAlternative[];
  status: SolverRouteStatus;
  reasons: string[];
  assumptions: string[];
  limitations: string[];
  unsupportedItems: string[];
  validationChecks: ValidationCheck[];
  estimatedCost: SolverCostEstimate;
  requiredUserActions: string[];
  routeActions: SolverRouteAction[];
  boundary: string[];
  resultHash: string;
};

export type MethodMatrixFeatureId = "planar-layers" | "ideal-aperture-lens" | "periodic-1d-grating" | "finite-dielectric-block" | "arbitrary-3d-geometry" | "curved-material-lens";

export type MethodMatrixCell = {
  featureId: MethodMatrixFeatureId;
  solverId: SolverRouteSolverId;
  status: MethodMatrixStatus;
  explanation: string;
  assumptions: string[];
  validation: string[];
  nextAction: string;
};

export type MethodMatrixRow = {
  featureId: MethodMatrixFeatureId;
  featureLabel: string;
  cells: MethodMatrixCell[];
};

export type SolverRouteExampleId = "planar" | "scalar" | "rcwa" | "fdtd2d" | "external" | "unsupported";

export const l94SolverRouterBoundary = [
  "L9.4 is a deterministic method recommendation and capability routing layer only.",
  "L9.4 does not prove automatic solver correctness and does not certify a selected method.",
  "L9.4 does not add new optical physics, new RCWA/FDTD/FEM/BEM engines, or a replacement for external Meep/FDTD.",
  "L9.4 does not implement arbitrary 3D Maxwell, arbitrary CAD/freeform geometry solving, FEM, BEM, production RCWA certification, production FDTD certification, digital twin behavior, manufacturing certification, or lab-accredited validation.",
  "2D FDTD remains a bounded diagnostic slice workflow; WebGPU is optional acceleration with CPU fallback.",
  "1D RCWA remains a bounded binary-grating preview with convergence and no-pattern TMM consistency diagnostics."
] as const;

export const solverCapabilities: SolverCapability[] = [
  {
    id: "planar-tmm",
    label: "PlanarTmmBackend",
    implemented: true,
    execution: "in-browser",
    dimensions: "1d-planar",
    supports: ["normal/oblique planar multilayer stacks", "coating R/T/A", "no lateral pattern"],
    rejects: ["lateral periodic grating", "finite blocks", "aperture/lens diffraction chains", "curved/freeform geometry"],
    validationAvailable: ["energy balance", "Fresnel limiting cases", "layer-stack result hash"],
    riskLevel: "low",
    notes: ["Best for laterally invariant layers; not a finite-geometry Maxwell solve."]
  },
  {
    id: "scalar-propagation",
    label: "Scalar propagation",
    implemented: true,
    execution: "in-browser",
    dimensions: "2d",
    supports: ["ideal apertures", "ideal thin lenses", "free-space propagation", "scalar validation benchmarks"],
    rejects: ["finite material blocks", "metal thickness", "periodic order efficiency", "vector/high-NA/3D Maxwell claims"],
    validationAvailable: ["Airy/slit references", "energy ledger", "monitor-stack previews"],
    riskLevel: "medium",
    notes: ["Useful for ideal masks and lenses, not finite material discontinuities."]
  },
  {
    id: "rcwa-1d-preview",
    label: "RCWA Preview Solver",
    implemented: true,
    execution: "in-browser",
    dimensions: "periodic-1d",
    supports: ["1D periodic binary gratings", "plane-wave incidence", "diffraction order table", "harmonic convergence"],
    rejects: ["nonperiodic finite block", "arbitrary 2D periodic patterns", "anisotropic/conical RCWA", "curved/freeform CAD gratings"],
    validationAvailable: ["harmonic convergence", "energy balance", "no-pattern TMM consistency"],
    riskLevel: "medium",
    notes: ["Bounded diagnostic preview; high-contrast gratings still need external validation."]
  },
  {
    id: "fdtd-2d-cpu",
    label: "2D FDTD CPU reference",
    implemented: true,
    execution: "in-browser",
    dimensions: "2d",
    supports: ["small 2D TMz diagnostic slices", "bounded grid/source/object/monitor scenes", "CPU reference stepping"],
    rejects: ["3D geometry", "production FDTD certification", "large unbounded domains", "periodic RCWA order metrology"],
    validationAvailable: ["CFL/stability checks", "fixture references", "grid convergence", "energy and monitor traces"],
    riskLevel: "medium",
    notes: ["Diagnostic 2D slice only; not a production browser FDTD engine."]
  },
  {
    id: "fdtd-2d-webgpu",
    label: "2D FDTD WebGPU acceleration",
    implemented: true,
    execution: "in-browser",
    dimensions: "2d",
    supports: ["optional acceleration for bounded 2D TMz scenes", "CPU/GPU parity checks", "performance diagnostics"],
    rejects: ["required WebGPU execution", "3D geometry", "production FDTD certification", "large unbounded domains"],
    validationAvailable: ["CPU/GPU parity", "CPU fallback receipt", "performance report"],
    riskLevel: "medium",
    notes: ["Optional and platform dependent; CPU reference remains the baseline."]
  },
  {
    id: "external-fdtd-meep",
    label: "External FDTD / Meep export-import",
    implemented: true,
    execution: "external",
    dimensions: "3d-external",
    supports: ["finite material geometry evidence", "external run packs", "receipt/flux/field-slice import", "convergence evidence"],
    rejects: ["in-browser production FDTD execution", "automatic external-run correctness", "FEM/BEM replacement"],
    validationAvailable: ["run receipt", "flux summary", "field-slice import", "convergence/PML review"],
    riskLevel: "high",
    notes: ["Best route for finite material geometry, but execution stays outside the browser."]
  },
  {
    id: "unsupported",
    label: "Unsupported / scaffold",
    implemented: false,
    execution: "scaffold",
    dimensions: "none",
    supports: ["visibility of unsupported items", "gap reports", "required-feature notes"],
    rejects: ["execution", "certification", "automatic correctness"],
    validationAvailable: ["unsupported-item report", "required external evidence checklist"],
    riskLevel: "high",
    notes: ["Shows why a scene is blocked instead of pretending it is executable."]
  }
];

const unsupportedFeatureLabels: Record<SolverSceneFeatureId, string> = {
  "planar-layers": "planar layers",
  "ideal-aperture-lens": "ideal aperture/lens scalar chain",
  "periodic-1d-grating": "1D periodic grating",
  "small-2d-finite-slice": "small 2D finite slice",
  "finite-material-geometry": "finite material geometry",
  "external-run-evidence": "external run evidence",
  "curved-freeform-cad": "curved/freeform/CAD material geometry",
  "arbitrary-3d-geometry": "arbitrary 3D geometry",
  "finite-metal-optics": "finite metal optics",
  "production-certification-request": "production/certification request"
};

const planarElementKinds = new Set<SimulationBuilderElementKind>(["material-interface", "material-slab", "mirror-surface", "absorbing-slab"]);
const scalarElementKinds = new Set<SimulationBuilderElementKind>(["circular-aperture", "ideal-lens"]);
const finiteElementKinds = new Set<SimulationBuilderElementKind>(["finite-transparent-block", "finite-absorbing-block", "finite-reflective-plate", "finite-aperture-blocker", "tilted-interface-wedge"]);
const unsupportedElementKinds = new Set<SimulationBuilderElementKind>(["curved-material-lens", "finite-metal-aperture"]);

export function getSolverCapability(id: SolverRouteSolverId): SolverCapability {
  const capability = solverCapabilities.find((item) => item.id === id);
  if (!capability) throw new Error(`Solver capability '${id}' is not registered`);
  return capability;
}

export function classifySimulationBuilderScenario(scenario: SimulationBuilderScenario): SolverSceneDescriptor {
  const features = new Set<SolverSceneFeatureId>();
  const orderedKinds = scenario.elements.map((element) => element.kind);
  if (orderedKinds.some((kind) => planarElementKinds.has(kind)) || scenario.target.kind) features.add("planar-layers");
  if (orderedKinds.some((kind) => scalarElementKinds.has(kind))) features.add("ideal-aperture-lens");
  if (orderedKinds.some((kind) => finiteElementKinds.has(kind))) features.add("finite-material-geometry");
  if (orderedKinds.some((kind) => unsupportedElementKinds.has(kind))) {
    features.add("curved-freeform-cad");
    if (orderedKinds.includes("finite-metal-aperture")) features.add("finite-metal-optics");
  }

  const kind = routeKindFromFeatures(features);
  return {
    sceneId: scenario.id,
    label: scenario.label,
    summary: summarizeBuilderScene(scenario, features),
    kind,
    features: [...features],
    sourceModel: `${scenario.source.type}, ${scenario.source.wavelengthNm} nm, ${scenario.source.coherence}`,
    requestedOutputs: ["ordered solver plan", "surface validation", "monitor/observation reports"],
    dimensions: features.has("finite-material-geometry") || features.has("curved-freeform-cad") ? "mixed" : "2d",
    provenance: ["Simulation Builder current scene", ...scenario.boundary.slice(0, 2)]
  };
}

export function createSolverRouteExampleScene(exampleId: SolverRouteExampleId): SolverSceneDescriptor {
  switch (exampleId) {
    case "planar":
      return {
        sceneId: "l94-example-planar-stack",
        label: "Planar coating stack",
        summary: "Laterally invariant air/coating/glass stack with R/T/A requested.",
        kind: "planar-multilayer-stack",
        features: ["planar-layers"],
        sourceModel: "plane wave, layered medium",
        requestedOutputs: ["R/T/A", "energy balance", "coating report"],
        dimensions: "1d",
        provenance: ["L9.4 deterministic route example"]
      };
    case "scalar":
      return {
        sceneId: "l94-example-scalar-chain",
        label: "Ideal aperture and thin lens chain",
        summary: "Ideal aperture/lens/free-space chain with monitor stack requested.",
        kind: "ideal-scalar-chain",
        features: ["ideal-aperture-lens"],
        sourceModel: "coherent scalar field",
        requestedOutputs: ["field profile", "monitor stack", "scalar validation"],
        dimensions: "2d",
        provenance: ["L9.4 deterministic route example"]
      };
    case "rcwa":
      return {
        sceneId: "l94-example-binary-grating",
        label: "Binary grating on glass substrate",
        summary: "1D periodic binary rectangular grating under plane-wave incidence.",
        kind: "periodic-1d-grating",
        features: ["periodic-1d-grating", "planar-layers"],
        sourceModel: "plane wave, 1D periodic layered medium",
        requestedOutputs: ["diffraction orders", "R/T/A", "harmonic convergence", "TMM no-pattern consistency"],
        dimensions: "2.5d",
        provenance: ["L9.4 deterministic route example", "L9.3 bounded RCWA preview capability"]
      };
    case "fdtd2d":
      return {
        sceneId: "l94-example-small-2d-slice",
        label: "Small bounded 2D dielectric slice",
        summary: "Small 2D TMz finite slice with field map and stability diagnostics requested.",
        kind: "small-2d-finite-slice",
        features: ["small-2d-finite-slice", "finite-material-geometry"],
        sourceModel: "2D TMz source in bounded diagnostic sandbox",
        requestedOutputs: ["field map", "monitor trace", "CFL/stability diagnostics"],
        dimensions: "2d",
        provenance: ["L9.4 deterministic route example", "L9.2 bounded 2D FDTD sandbox capability"]
      };
    case "external":
      return {
        sceneId: "l94-example-finite-external",
        label: "Finite block plus aperture chain",
        summary: "Finite dielectric/absorbing material geometry with aperture edges and field maps requested.",
        kind: "finite-external-fdtd",
        features: ["finite-material-geometry", "external-run-evidence"],
        sourceModel: "finite material geometry requiring external field evidence",
        requestedOutputs: ["external run pack", "receipt", "flux summary", "field slice"],
        dimensions: "3d",
        provenance: ["L9.4 deterministic route example", "L8.9 external FDTD ingestion capability"]
      };
    case "unsupported":
      return {
        sceneId: "l94-example-unsupported-curved-lens",
        label: "Curved freeform material lens",
        summary: "Curved/freeform material lens or arbitrary CAD object that has no executable in-app route.",
        kind: "unsupported-scaffold",
        features: ["curved-freeform-cad", "arbitrary-3d-geometry"],
        sourceModel: "material geometry outside the implemented browser/external handoff set",
        requestedOutputs: ["gap report", "required external evidence list"],
        dimensions: "3d",
        provenance: ["L9.4 deterministic route example"]
      };
  }
}

export function routeSolverScene(scene: SolverSceneDescriptor): SolverRouteDecision {
  const features = new Set(scene.features);
  const unsupportedItems = unsupportedItemsFor(features);
  const recommendedSolver = recommendedSolverFor(features);
  const recommendedCapability = getSolverCapability(recommendedSolver);
  const status = statusFor(recommendedSolver, features);
  const alternatives = solverCapabilities.map((capability) => alternativeFor(capability, recommendedSolver, features));
  const validationChecks = validationChecksFor(recommendedSolver, features);
  const estimatedCost = costEstimateFor(recommendedSolver);
  const reasons = reasonsFor(recommendedSolver, features, scene);
  const assumptions = assumptionsFor(recommendedSolver, features);
  const limitations = limitationsFor(recommendedSolver, features);
  const routeActions = routeActionsFor(recommendedSolver, features);
  const requiredUserActions = routeActions.filter((action) => action.enabled && (action.kind === "handoff" || action.kind === "export")).map((action) => action.label);
  const stable = {
    schema: "emmicro.solverRouter.decision.v1",
    sceneId: scene.sceneId,
    sceneKind: scene.kind,
    features: [...features].sort(),
    recommendedSolver,
    status,
    reasons,
    assumptions,
    limitations,
    unsupportedItems
  };

  return {
    schema: "emmicro.solverRouter.decision.v1",
    sceneId: scene.sceneId,
    sceneLabel: scene.label,
    sceneKind: scene.kind,
    recommendedSolver,
    recommendedSolverLabel: recommendedCapability.label,
    alternatives,
    status,
    reasons,
    assumptions,
    limitations,
    unsupportedItems,
    validationChecks,
    estimatedCost,
    requiredUserActions,
    routeActions,
    boundary: [...l94SolverRouterBoundary],
    resultHash: fnv1a64(stableStringify(stable))
  };
}

export function methodSelectionMatrix(): MethodMatrixRow[] {
  const rows: Array<{ featureId: MethodMatrixFeatureId; featureLabel: string; bySolver: Partial<Record<SolverRouteSolverId, [MethodMatrixStatus, string, string]>> }> = [
    {
      featureId: "planar-layers",
      featureLabel: "Planar layers",
      bySolver: {
        "planar-tmm": ["best", "Best for laterally invariant multilayer R/T/A.", "Open TMM coating workbench"],
        "scalar-propagation": ["not-valid", "Scalar propagation does not model multilayer Fresnel interference as the primary method.", "Use TMM"],
        "rcwa-1d-preview": ["possible", "No-pattern RCWA consistency is possible but TMM is simpler and lower risk.", "Run no-pattern TMM check"],
        "fdtd-2d-cpu": ["overkill", "2D FDTD is diagnostic overkill for a planar stack.", "Use only for bounded diagnostic slice"],
        "fdtd-2d-webgpu": ["overkill", "WebGPU acceleration is optional and unnecessary for planar layers.", "Use CPU/TMM baseline"],
        "external-fdtd-meep": ["possible", "External FDTD can model it but is slower and needs run evidence.", "Export external pack"]
      }
    },
    {
      featureId: "ideal-aperture-lens",
      featureLabel: "Ideal aperture/lens",
      bySolver: {
        "planar-tmm": ["not-valid", "TMM has no lateral aperture or ideal lens propagation chain.", "Use scalar validation"],
        "scalar-propagation": ["best", "Best implemented in-browser route for ideal masks, lenses, and free-space propagation.", "Open scalar validation bench"],
        "rcwa-1d-preview": ["not-valid", "RCWA requires periodic layered structure, not an isolated ideal lens chain.", "Use RCWA only for gratings"],
        "fdtd-2d-cpu": ["diagnostic", "2D FDTD can be a bounded field diagnostic, not the preferred ideal-lens solver.", "Send 2D slice to sandbox"],
        "fdtd-2d-webgpu": ["diagnostic", "Optional acceleration for the bounded 2D diagnostic route only.", "Run parity if available"],
        "external-fdtd-meep": ["possible", "External FDTD is possible but usually unnecessary for ideal scalar elements.", "Export only if finite material geometry is introduced"]
      }
    },
    {
      featureId: "periodic-1d-grating",
      featureLabel: "1D periodic grating",
      bySolver: {
        "planar-tmm": ["not-valid", "TMM is rejected because a lateral periodic pattern exists.", "Use RCWA preview"],
        "scalar-propagation": ["not-valid", "Scalar chain does not compute grating order efficiency.", "Use RCWA preview"],
        "rcwa-1d-preview": ["best", "Best implemented in-browser route for bounded 1D binary periodic gratings.", "Open RCWA Preview Solver"],
        "fdtd-2d-cpu": ["diagnostic", "2D FDTD can provide a small-field diagnostic but not preferred order efficiency.", "Send 2D slice if needed"],
        "fdtd-2d-webgpu": ["diagnostic", "Optional acceleration for diagnostic 2D slice only.", "Run CPU/GPU parity"],
        "external-fdtd-meep": ["possible", "External FDTD can validate harder grating cases but needs external run evidence.", "Export external evidence pack"]
      }
    },
    {
      featureId: "finite-dielectric-block",
      featureLabel: "Finite dielectric block",
      bySolver: {
        "planar-tmm": ["not-valid", "TMM is rejected for finite lateral geometry.", "Use external FDTD evidence"],
        "scalar-propagation": ["not-valid", "Scalar propagation is rejected for finite material discontinuities.", "Use external FDTD evidence"],
        "rcwa-1d-preview": ["not-valid", "RCWA is rejected because the geometry is nonperiodic and finite.", "Use external FDTD evidence"],
        "fdtd-2d-cpu": ["diagnostic", "2D FDTD is a bounded diagnostic slice, not a full finite-geometry proof.", "Send 2D slice to sandbox"],
        "fdtd-2d-webgpu": ["diagnostic", "Optional acceleration for bounded diagnostic slice only.", "Run CPU/GPU parity"],
        "external-fdtd-meep": ["best", "Best available evidence path for finite material geometry.", "Export external FDTD run pack"]
      }
    },
    {
      featureId: "arbitrary-3d-geometry",
      featureLabel: "Arbitrary 3D geometry",
      bySolver: {
        "planar-tmm": ["unsupported", "Not a laterally invariant stack.", "Show unsupported items"],
        "scalar-propagation": ["unsupported", "Not an ideal scalar chain.", "Show unsupported items"],
        "rcwa-1d-preview": ["unsupported", "Not a bounded 1D periodic grating.", "Show unsupported items"],
        "fdtd-2d-cpu": ["unsupported", "2D FDTD is diagnostic only and does not solve arbitrary 3D geometry.", "Show unsupported items"],
        "fdtd-2d-webgpu": ["unsupported", "WebGPU route is still 2D diagnostic only.", "Show unsupported items"],
        "external-fdtd-meep": ["external-only", "External evidence may be required, but arbitrary 3D CAD routing is scaffold-only here.", "Create gap report"]
      }
    },
    {
      featureId: "curved-material-lens",
      featureLabel: "Curved material lens",
      bySolver: {
        "planar-tmm": ["not-valid", "Curved material lens is not planar.", "Show unsupported items"],
        "scalar-propagation": ["possible", "Ideal thin-lens approximation is possible only if the curved body is replaced by an ideal lens.", "Open scalar validation bench"],
        "rcwa-1d-preview": ["not-valid", "Not a 1D periodic binary grating.", "Show unsupported items"],
        "fdtd-2d-cpu": ["unsupported", "2D sandbox does not implement real curved material lens solving.", "Show unsupported items"],
        "fdtd-2d-webgpu": ["unsupported", "WebGPU acceleration does not change the unsupported physics.", "Show unsupported items"],
        "external-fdtd-meep": ["scaffold", "Future external route may support this with explicit CAD/mesh evidence.", "Create gap report"]
      }
    }
  ];

  return rows.map((row) => ({
    featureId: row.featureId,
    featureLabel: row.featureLabel,
    cells: solverCapabilities.map((capability) => {
      const cell = row.bySolver[capability.id] ?? ["unsupported", "No route declared for this feature/solver pair.", "Show unsupported items"];
      return {
        featureId: row.featureId,
        solverId: capability.id,
        status: cell[0],
        explanation: cell[1],
        assumptions: assumptionsForCell(row.featureId, capability.id),
        validation: validationForCell(cell[0], capability.id),
        nextAction: cell[2]
      };
    })
  }));
}

export function solverRouteReportMarkdown(decision: SolverRouteDecision): string {
  return [
    "# L9.4 Solver Route Report",
    "",
    `Scene: ${decision.sceneLabel}`,
    `Scene id: ${decision.sceneId}`,
    `Scene kind: ${decision.sceneKind}`,
    `Recommended solver: ${decision.recommendedSolverLabel} (${decision.recommendedSolver})`,
    `Route status: ${decision.status}`,
    `Result hash: ${decision.resultHash}`,
    "",
    "## Why",
    "",
    ...decision.reasons.map((reason) => `- ${reason}`),
    "",
    "## Alternatives",
    "",
    "| Solver | Status | Reason |",
    "| --- | --- | --- |",
    ...decision.alternatives.map((alternative) => `| ${alternative.label} | ${alternative.status} | ${alternative.reasons.join("; ")} |`),
    "",
    "## Assumptions",
    "",
    ...decision.assumptions.map((assumption) => `- ${assumption}`),
    "",
    "## Limitations",
    "",
    ...decision.limitations.map((limitation) => `- ${limitation}`),
    "",
    "## Validation Plan",
    "",
    "| Check | Status | Description |",
    "| --- | --- | --- |",
    ...decision.validationChecks.map((check) => `| ${check.label} | ${check.status} | ${check.description} |`),
    "",
    "## Required Actions",
    "",
    ...(decision.requiredUserActions.length ? decision.requiredUserActions.map((action) => `- ${action}`) : ["- No external action required before using the recommended in-browser route."]),
    "",
    "## Unsupported Items",
    "",
    ...(decision.unsupportedItems.length ? decision.unsupportedItems.map((item) => `- ${item}`) : ["- None for this route decision."]),
    "",
    "## Boundary",
    "",
    ...decision.boundary.map((item) => `- ${item}`)
  ].join("\n");
}

export function solverRouteReportJson(decision: SolverRouteDecision): string {
  return `${JSON.stringify(decision, null, 2)}\n`;
}

export function solverRouteMatrixCsv(rows: MethodMatrixRow[] = methodSelectionMatrix()): string {
  return [
    "feature_id,feature_label,solver_id,solver_label,status,explanation,next_action",
    ...rows.flatMap((row) =>
      row.cells.map((cell) =>
        csvRow([row.featureId, row.featureLabel, cell.solverId, getSolverCapability(cell.solverId).label, cell.status, cell.explanation, cell.nextAction])
      )
    )
  ].join("\n");
}

export function unsupportedItemsCsv(decision: SolverRouteDecision): string {
  const rows = decision.unsupportedItems.length ? decision.unsupportedItems.map((item) => csvRow([decision.sceneId, item, "blocked", "Requires external/scaffold planning; not executable in L9.4."])) : [csvRow([decision.sceneId, "none", "clear", "No unsupported item detected for this route."])];
  return ["scene_id,item,status,next_step", ...rows].join("\n");
}

export function validationPlanCsv(decision: SolverRouteDecision): string {
  return [
    "scene_id,solver_id,check_id,label,status,description",
    ...decision.validationChecks.map((check) => csvRow([decision.sceneId, decision.recommendedSolver, check.id, check.label, check.status, check.description]))
  ].join("\n");
}

function routeKindFromFeatures(features: Set<SolverSceneFeatureId>): SolverSceneKind {
  if (hasUnsupportedFeature(features)) return "unsupported-scaffold";
  if (features.has("periodic-1d-grating")) return "periodic-1d-grating";
  if (features.has("small-2d-finite-slice")) return "small-2d-finite-slice";
  if (features.has("finite-material-geometry")) return "finite-external-fdtd";
  if (features.has("ideal-aperture-lens")) return "ideal-scalar-chain";
  if (features.has("planar-layers")) return "planar-multilayer-stack";
  return "unsupported-scaffold";
}

function summarizeBuilderScene(scenario: SimulationBuilderScenario, features: Set<SolverSceneFeatureId>): string {
  const featureText = [...features].map((feature) => unsupportedFeatureLabels[feature]).join(", ");
  return `${scenario.elements.length} ordered elements, target ${scenario.target.kind}, features: ${featureText || "none"}`;
}

function recommendedSolverFor(features: Set<SolverSceneFeatureId>): SolverRouteSolverId {
  if (hasUnsupportedFeature(features)) return "unsupported";
  if (features.has("periodic-1d-grating")) return "rcwa-1d-preview";
  if (features.has("small-2d-finite-slice")) return "fdtd-2d-cpu";
  if (features.has("finite-material-geometry") || features.has("external-run-evidence")) return "external-fdtd-meep";
  if (features.has("ideal-aperture-lens")) return "scalar-propagation";
  if (features.has("planar-layers")) return "planar-tmm";
  return "unsupported";
}

function statusFor(recommendedSolver: SolverRouteSolverId, features: Set<SolverSceneFeatureId>): SolverRouteStatus {
  if (recommendedSolver === "unsupported") return "unsupported";
  if (recommendedSolver === "external-fdtd-meep") return "external-required";
  if (recommendedSolver === "fdtd-2d-cpu" || features.has("periodic-1d-grating")) return "warning";
  return "ready";
}

function alternativeFor(capability: SolverCapability, recommendedSolver: SolverRouteSolverId, features: Set<SolverSceneFeatureId>): SolverAlternative {
  if (capability.id === recommendedSolver) {
    return {
      solverId: capability.id,
      label: capability.label,
      status: "recommended",
      reasons: reasonsFor(capability.id, features),
      assumptions: assumptionsFor(capability.id, features),
      limitations: limitationsFor(capability.id, features)
    };
  }
  const status = alternativeStatusFor(capability.id, features);
  return {
    solverId: capability.id,
    label: capability.label,
    status,
    reasons: alternativeReasonsFor(capability.id, status, features),
    assumptions: assumptionsFor(capability.id, features),
    limitations: limitationsFor(capability.id, features)
  };
}

function alternativeStatusFor(solverId: SolverRouteSolverId, features: Set<SolverSceneFeatureId>): SolverAlternativeStatus {
  if (solverId === "unsupported") return hasUnsupportedFeature(features) ? "recommended" : "unsupported";
  if (hasUnsupportedFeature(features)) return solverId === "external-fdtd-meep" ? "external-only" : "unsupported";
  if (features.has("periodic-1d-grating")) {
    if (solverId === "external-fdtd-meep") return "possible";
    if (solverId === "fdtd-2d-cpu" || solverId === "fdtd-2d-webgpu") return "diagnostic";
    return "rejected";
  }
  if (features.has("small-2d-finite-slice")) {
    if (solverId === "fdtd-2d-webgpu") return "possible";
    if (solverId === "external-fdtd-meep") return "possible";
    return "rejected";
  }
  if (features.has("finite-material-geometry") || features.has("external-run-evidence")) {
    if (solverId === "fdtd-2d-cpu" || solverId === "fdtd-2d-webgpu") return "diagnostic";
    if (solverId === "external-fdtd-meep") return "recommended";
    return "rejected";
  }
  if (features.has("ideal-aperture-lens")) {
    if (solverId === "fdtd-2d-cpu" || solverId === "fdtd-2d-webgpu") return "diagnostic";
    if (solverId === "external-fdtd-meep") return "possible";
    if (solverId === "planar-tmm" && features.has("planar-layers")) return "possible";
    return "rejected";
  }
  if (features.has("planar-layers")) {
    if (solverId === "rcwa-1d-preview") return "possible";
    if (solverId === "external-fdtd-meep") return "possible";
    if (solverId === "fdtd-2d-cpu" || solverId === "fdtd-2d-webgpu") return "diagnostic";
    return "rejected";
  }
  return "unsupported";
}

function reasonsFor(solverId: SolverRouteSolverId, features: Set<SolverSceneFeatureId>, scene?: SolverSceneDescriptor): string[] {
  if (solverId === "planar-tmm") return ["The scene is laterally invariant enough for a planar multilayer stack.", "PlanarTmmBackend gives direct R/T/A and energy-balance checks."];
  if (solverId === "scalar-propagation") return ["The scene uses ideal aperture/lens/free-space elements.", "Scalar propagation is the implemented route for ideal masks and monitor-stack previews."];
  if (solverId === "rcwa-1d-preview") return ["The scene contains a 1D periodic grating or patterned layer.", "RCWA Preview reports diffraction orders, R/T/A totals, harmonic convergence, and no-pattern TMM consistency."];
  if (solverId === "fdtd-2d-cpu") return ["The scene is a small bounded 2D finite slice.", "The CPU reference sandbox can run deterministic diagnostic TMz stepping with stability checks."];
  if (solverId === "fdtd-2d-webgpu") return ["Optional acceleration can be used when the browser supports WebGPU.", "CPU/GPU parity keeps CPU reference as the baseline."];
  if (solverId === "external-fdtd-meep") return ["Finite material geometry needs external field evidence.", "External FDTD / Meep export-import is the available route for receipts, flux summaries, and field slices."];
  return [
    "The scene contains unsupported or scaffold-only features.",
    `Unsupported features: ${unsupportedItemsFor(features).join("; ") || scene?.summary || "no executable solver route declared"}.`
  ];
}

function alternativeReasonsFor(solverId: SolverRouteSolverId, status: SolverAlternativeStatus, features: Set<SolverSceneFeatureId>): string[] {
  if (status === "possible") return [`${getSolverCapability(solverId).label} can provide secondary evidence, but it is not the best primary route.`];
  if (status === "diagnostic") return [`${getSolverCapability(solverId).label} is useful as a bounded diagnostic only for this scene.`];
  if (status === "external-only") return [`${getSolverCapability(solverId).label} requires external evidence and is not an in-browser execution route.`];
  if (status === "unsupported") return [`${getSolverCapability(solverId).label} is not executable for this feature set.`];
  if (features.has("periodic-1d-grating") && solverId === "planar-tmm") return ["TMM is rejected because a lateral periodic structure exists."];
  if (features.has("periodic-1d-grating") && solverId === "scalar-propagation") return ["Scalar propagation is rejected because diffraction-order efficiency is required."];
  if (features.has("finite-material-geometry") && solverId === "rcwa-1d-preview") return ["RCWA is rejected for nonperiodic finite material geometry."];
  if (features.has("finite-material-geometry") && solverId === "scalar-propagation") return ["Scalar propagation is rejected for finite material discontinuities."];
  if (features.has("finite-material-geometry") && solverId === "planar-tmm") return ["TMM is rejected for finite lateral geometry."];
  if (features.has("ideal-aperture-lens") && solverId === "rcwa-1d-preview") return ["RCWA is rejected because the scene is not periodic."];
  return [`${getSolverCapability(solverId).label} is not the appropriate primary route for the detected features.`];
}

function assumptionsFor(solverId: SolverRouteSolverId, features: Set<SolverSceneFeatureId>): string[] {
  if (solverId === "planar-tmm") return ["Layers are laterally invariant.", "Material indices are represented as constant samples.", "No finite aperture or lateral pattern is part of the TMM solve."];
  if (solverId === "scalar-propagation") return ["Apertures and lenses are ideal scalar elements.", "Paraxial/scalar approximations are acceptable for the diagnostic view.", "Finite material discontinuities are not part of this route."];
  if (solverId === "rcwa-1d-preview") return ["The grating is 1D, binary, rectangular, and periodic.", "Incidence is plane-wave.", "Harmonic count is capped for browser safety."];
  if (solverId === "fdtd-2d-cpu" || solverId === "fdtd-2d-webgpu") return ["The scene is a bounded 2D TMz diagnostic slice.", "Grid and step caps are respected.", "3D effects are outside the sandbox."];
  if (solverId === "external-fdtd-meep") return ["External solver execution occurs outside the browser.", "Receipts, flux summaries, and field slices are imported as evidence.", "Convergence/PML review remains required."];
  if (features.size > 0) return [...features].map((feature) => `Detected feature: ${unsupportedFeatureLabels[feature]}.`);
  return ["No executable solver assumptions could be established."];
}

function limitationsFor(solverId: SolverRouteSolverId, features: Set<SolverSceneFeatureId>): string[] {
  const shared = ["Not an automatic correctness proof.", "Not production solver certification.", "Not a digital twin or manufacturing certification workflow."];
  if (solverId === "planar-tmm") return ["No lateral pattern, aperture edge, finite block, or curved/freeform geometry solve.", ...shared];
  if (solverId === "scalar-propagation") return ["No finite material Maxwell geometry, vector high-NA, sensor-stack EM, or periodic order-efficiency solve.", ...shared];
  if (solverId === "rcwa-1d-preview") return ["Not arbitrary 2D-periodic RCWA, anisotropic/conical RCWA, freeform grating CAD, or production RCWA certification.", ...shared];
  if (solverId === "fdtd-2d-cpu" || solverId === "fdtd-2d-webgpu") return ["No arbitrary 3D Maxwell, production browser FDTD, required WebGPU execution, FEM, or BEM.", ...shared];
  if (solverId === "external-fdtd-meep") return ["The app exports/imports evidence but does not execute or certify external Meep/FDTD runs.", "No FEM/BEM implementation.", ...shared];
  return [...unsupportedItemsFor(features), "No executable in-app solver is selected.", ...shared];
}

function validationChecksFor(solverId: SolverRouteSolverId, features: Set<SolverSceneFeatureId>): ValidationCheck[] {
  if (solverId === "planar-tmm") {
    return [
      check("tmm-energy-balance", "TMM energy balance", "available", "Check R+T+A and layer-stack residuals."),
      check("fresnel-limit", "Fresnel limiting case", "available", "Compare simple interface cases against Fresnel references.")
    ];
  }
  if (solverId === "scalar-propagation") {
    return [
      check("scalar-energy-ledger", "Scalar energy ledger", "available", "Track field energy through ideal masks and propagation."),
      check("airy-slit-reference", "Airy/slit reference", "available", "Compare aperture cases against existing scalar validation benchmarks.")
    ];
  }
  if (solverId === "rcwa-1d-preview") {
    return [
      check("rcwa-harmonic-convergence", "Harmonic convergence", "available", "Run capped harmonic sweep over diffraction-order efficiencies."),
      check("rcwa-energy-balance", "RCWA energy balance", "available", "Check R+T+A and energy-balance residual."),
      check("rcwa-tmm-no-pattern", "No-pattern TMM consistency", "available", "Compare the unpatterned limit against PlanarTmmBackend.")
    ];
  }
  if (solverId === "fdtd-2d-cpu" || solverId === "fdtd-2d-webgpu") {
    return [
      check("fdtd2d-stability", "2D FDTD stability", "available", "Check CFL, finite fields, boundary proximity, and energy trend."),
      check("fdtd2d-convergence", "2D FDTD convergence", "available", "Run bounded grid convergence diagnostics."),
      check("fdtd2d-cpu-gpu-parity", "CPU/GPU parity", solverId === "fdtd-2d-webgpu" ? "available" : "not-applicable", "Compare WebGPU output to CPU reference when WebGPU is available.")
    ];
  }
  if (solverId === "external-fdtd-meep") {
    return [
      check("external-run-receipt", "External run receipt", "external-required", "Import run receipt JSON from the external solver workflow."),
      check("external-flux-summary", "Flux summary", "external-required", "Import R/T/A flux summary evidence."),
      check("external-field-slice", "Field slice", "external-required", "Import field-slice CSV for visual and numeric diagnostics."),
      check("external-convergence", "Convergence/PML review", "external-required", "Review resolution and PML sensitivity over external evidence.")
    ];
  }
  return [check("unsupported-gap-report", "Unsupported item report", "available", "List blocked features and required future/external evidence.")];
}

function check(id: string, label: string, status: ValidationCheck["status"], description: string): ValidationCheck {
  return { id, label, status, description };
}

function costEstimateFor(solverId: SolverRouteSolverId): SolverCostEstimate {
  if (solverId === "planar-tmm") return { runtimeClass: "instant", computeLocation: "browser", relativeCost: "low", riskLevel: "low", notes: ["Small deterministic matrix calculation."] };
  if (solverId === "scalar-propagation") return { runtimeClass: "interactive", computeLocation: "browser", relativeCost: "low", riskLevel: "medium", notes: ["Interactive scalar grid/profile computation."] };
  if (solverId === "rcwa-1d-preview") return { runtimeClass: "bounded-browser", computeLocation: "browser", relativeCost: "medium", riskLevel: "medium", notes: ["Harmonic count is capped and high contrast requires caution."] };
  if (solverId === "fdtd-2d-cpu") return { runtimeClass: "bounded-browser", computeLocation: "browser", relativeCost: "medium", riskLevel: "medium", notes: ["Bounded diagnostic stepping with grid/object caps."] };
  if (solverId === "fdtd-2d-webgpu") return { runtimeClass: "bounded-browser", computeLocation: "browser-or-gpu", relativeCost: "medium", riskLevel: "medium", notes: ["Optional acceleration, platform dependent, CPU fallback required."] };
  if (solverId === "external-fdtd-meep") return { runtimeClass: "external-run", computeLocation: "external", relativeCost: "high", riskLevel: "high", notes: ["Requires external solver execution and imported evidence."] };
  return { runtimeClass: "blocked", computeLocation: "none", relativeCost: "not-applicable", riskLevel: "high", notes: ["No executable route is available."] };
}

function routeActionsFor(solverId: SolverRouteSolverId, features: Set<SolverSceneFeatureId>): SolverRouteAction[] {
  const actions: SolverRouteAction[] = [
    action("export-solver-route-report", "Export Solver Route Report", solverId, "export", true, "Write solver_route_report.md/json and CSV evidence."),
    action("show-method-selection-matrix", "Show Method Selection Matrix", solverId, "show-info", true, "Review solver capability statuses by scene feature.")
  ];
  if (solverId === "planar-tmm") actions.unshift(action("open-tmm-coating-workbench", "Open TMM Coating Workbench", solverId, "open-panel", true, "Planar stack is executable with PlanarTmmBackend."));
  if (solverId === "scalar-propagation") actions.unshift(action("open-scalar-validation-bench", "Open Scalar Validation Bench", solverId, "open-panel", true, "Ideal scalar chain is executable in-browser."));
  if (solverId === "rcwa-1d-preview") actions.unshift(action("open-rcwa-preview-solver", "Open RCWA Preview Solver", solverId, "open-panel", true, "1D periodic grating matches the L9.3 RCWA preview lane."));
  if (solverId === "fdtd-2d-cpu" || features.has("small-2d-finite-slice")) actions.unshift(action("send-2d-slice-to-fdtd-sandbox", "Send 2D Slice to FDTD Sandbox", "fdtd-2d-cpu", "handoff", true, "Bounded diagnostic 2D slice can be handed to the sandbox."));
  if (solverId === "external-fdtd-meep") {
    actions.unshift(action("export-external-fdtd-run-pack", "Export External FDTD Run Pack", solverId, "export", true, "Finite material geometry requires external run evidence."));
    actions.unshift(action("open-engineering-evidence-campaign", "Open Engineering Evidence Campaign", solverId, "open-panel", true, "Review imported external evidence and limitations."));
  }
  if (solverId === "unsupported") actions.unshift(action("show-unsupported-items", "Show Unsupported Items", solverId, "show-info", true, "Blocked features must remain visible and non-executable."));
  return actions;
}

function action(id: string, label: string, solverId: SolverRouteSolverId, kind: SolverRouteAction["kind"], enabled: boolean, reason: string): SolverRouteAction {
  return { id, label, solverId, kind, enabled, reason };
}

function hasUnsupportedFeature(features: Set<SolverSceneFeatureId>): boolean {
  return (
    features.has("curved-freeform-cad") ||
    features.has("arbitrary-3d-geometry") ||
    features.has("finite-metal-optics") ||
    features.has("production-certification-request")
  );
}

function unsupportedItemsFor(features: Set<SolverSceneFeatureId>): string[] {
  return [...features]
    .filter((feature) => feature === "curved-freeform-cad" || feature === "arbitrary-3d-geometry" || feature === "finite-metal-optics" || feature === "production-certification-request")
    .map((feature) => unsupportedFeatureLabels[feature]);
}

function assumptionsForCell(featureId: MethodMatrixFeatureId, solverId: SolverRouteSolverId): string[] {
  if (solverId === "fdtd-2d-webgpu") return ["WebGPU is optional and CPU fallback remains valid."];
  if (featureId === "periodic-1d-grating") return ["Plane-wave incidence and bounded 1D periodic structure are assumed for RCWA."];
  if (featureId === "curved-material-lens" && solverId === "scalar-propagation") return ["Only an ideal thin-lens substitute is allowed; real curved material solving is not implied."];
  if (solverId === "external-fdtd-meep") return ["External execution and imported evidence are required."];
  return ["Use only within the declared solver capability boundary."];
}

function validationForCell(status: MethodMatrixStatus, solverId: SolverRouteSolverId): string[] {
  if (status === "unsupported" || status === "not-valid") return ["unsupported-item report"];
  return getSolverCapability(solverId).validationAvailable;
}

function csvRow(values: Array<string | number | boolean>): string {
  return values.map(csvEscape).join(",");
}

function csvEscape(value: string | number | boolean): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
