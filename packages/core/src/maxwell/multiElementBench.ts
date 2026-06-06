import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import {
  defaultSimulationBuilderScenario,
  orderedSimulationBuilderElements,
  orderedSimulationBuilderCustomMonitors,
  type SimulationBuilderCustomMonitor,
  type SimulationBuilderCapabilityStatus,
  type SimulationBuilderElement,
  type SimulationBuilderElementKind,
  type SimulationBuilderScenario
} from "./simulationBuilder";
import type { FdtdExportBundle, FdtdFieldSlice, FdtdFluxSummary, FdtdImportedRun, FdtdRunReceipt } from "../fdtd/fdtdTypes";

export type OpticalBenchElementType =
  | "source"
  | "circular-aperture"
  | "long-slit"
  | "rectangular-aperture"
  | "ideal-thin-lens"
  | "transparent-block"
  | "absorbing-block"
  | "reflective-plate"
  | "finite-aperture-blocker"
  | "tilted-wedge-interface"
  | "curved-material-lens"
  | "observation-plane"
  | "field-monitor"
  | "flux-monitor";

export type OpticalBenchSolverRoute = "scalar-chain" | "external-fdtd" | "scaffold" | "unsupported";
export type OpticalBenchComputationStatus = "fully-computed" | "partially-computed" | "external-results-imported" | "blocked";
export type OpticalBenchElementStatus = SimulationBuilderCapabilityStatus | "external-only" | "unsupported";
export type OpticalBenchMonitorKind = "field" | "flux" | "observation";

export type OpticalBenchGrid = {
  domainWidthUm: number;
  domainHeightUm: number;
  zStartMm: number;
  zEndMm: number;
  pointsPerWavelength: number;
};

export type OpticalBenchSource = {
  id: string;
  label: string;
  wavelengthNm: number;
  zMm: number;
  xUm: number;
  yUm: number;
  direction: "+z" | "-z";
};

export type OpticalBenchElement = {
  id: string;
  label: string;
  type: OpticalBenchElementType;
  zMm: number;
  xUm: number;
  yUm: number;
  widthUm: number;
  heightUm: number;
  thicknessUm: number;
  orientationDeg: number;
  materialModel: string;
  enabled: boolean;
  locked: boolean;
  status: OpticalBenchElementStatus;
  solverRoute: OpticalBenchSolverRoute;
  validationReference: string;
  sourceElementKind?: SimulationBuilderElementKind;
  focalLengthMm?: number;
};

export type OpticalBenchMonitor = {
  id: string;
  label: string;
  kind: OpticalBenchMonitorKind;
  zMm: number;
  xUm: number;
  yUm: number;
  widthUm: number;
  heightUm: number;
  sourceElementId?: string;
  solverRoute: OpticalBenchSolverRoute;
  warningCodes: string[];
};

export type OpticalBenchTarget = {
  id: string;
  label: string;
  zMm: number;
  widthUm: number;
  heightUm: number;
};

export type OpticalBenchScene = {
  schema: "emmicro.opticalBenchScene.v1";
  id: string;
  label: string;
  grid: OpticalBenchGrid;
  source: OpticalBenchSource;
  elements: OpticalBenchElement[];
  monitors: OpticalBenchMonitor[];
  target: OpticalBenchTarget;
  boundary: string[];
  sourceScenarioHash: string;
  sceneHash: string;
};

export type OpticalBenchCrossSectionItem = {
  id: string;
  label: string;
  kind: "source" | "element" | "monitor" | "target" | "pml";
  type: string;
  zMm: number;
  xUm: number;
  widthUm: number;
  heightUm: number;
  thicknessUm: number;
  status: OpticalBenchElementStatus | "computed";
  solverRoute: OpticalBenchSolverRoute | "boundary";
};

export type OpticalBenchSolverPlanRow = {
  id: string;
  label: string;
  segment: string;
  zStartMm: number;
  zEndMm: number;
  solverRoute: OpticalBenchSolverRoute;
  status: OpticalBenchElementStatus | "computed";
  executable: boolean;
  validationReference: string;
  warnings: SolverWarning[];
};

export type OpticalBenchMonitorSnapshot = {
  monitorId: string;
  label: string;
  zMm: number;
  solverRoute: OpticalBenchSolverRoute;
  status: "computed" | "external-only" | "blocked";
  width: number;
  height: number;
  intensity: number[];
  profile: Array<{ xUm: number; intensity: number }>;
  metrics: {
    peakIntensity: number;
    meanIntensity: number;
    totalPower: number;
    relativePower: number;
    centroidXUm: number;
  };
  warningCodes: string[];
};

export type OpticalBenchScalarPreview = {
  schema: "emmicro.opticalBench.scalarPreview.v1";
  sceneHash: string;
  snapshots: OpticalBenchMonitorSnapshot[];
  stageMetrics: Array<{ id: string; label: string; zMm: number; peakIntensity: number; relativePower: number; solverRoute: OpticalBenchSolverRoute }>;
  warnings: SolverWarning[];
  previewHash: string;
};

export type OpticalBenchExternalEvidence = {
  receipt: FdtdRunReceipt;
  flux: FdtdFluxSummary;
  fieldSlice: FdtdFieldSlice;
  fieldSliceCsv: string;
  imported: FdtdImportedRun;
};

export type OpticalBenchValidationReport = {
  schema: "emmicro.opticalBench.validationReport.v1";
  scene: OpticalBenchScene;
  solverPlan: OpticalBenchSolverPlanRow[];
  scalarPreview: OpticalBenchScalarPreview;
  externalEvidence: OpticalBenchExternalEvidence | null;
  computationStatus: OpticalBenchComputationStatus;
  warnings: SolverWarning[];
  exports: string[];
  reportHash: string;
};

export const l85OpticalBenchBoundary = [
  "L8.5 is an ordered multi-element optical-bench workflow, not a general-purpose Maxwell solver.",
  "Scalar chain preview is limited to ideal plane elements: free-space propagation, apertures/slits, ideal thin lenses, and observation planes.",
  "Finite transparent blocks, absorbing blocks, reflective plates, aperture/blocker screens, and tilted wedges route to external FDTD export/import evidence.",
  "Imported external FDTD field/flux maps require receipts and scene/script hashes before they are reported as evidence.",
  "No production in-browser FDTD execution, arbitrary CAD/freeform geometry solve, general arbitrary 3D Maxwell, FEM/BEM/RCWA, production metal optics model, curved material lens solve, conformal multilayer curved coating solver, sensor-stack EM, digital twin calibration, hardware control, or manufacturing certification is implemented; L9.0's separate 2D TMz sandbox is diagnostic only."
] as const;

export function defaultOpticalBenchScenario(): SimulationBuilderScenario {
  const base = defaultSimulationBuilderScenario();
  return {
    ...base,
    id: "l85-multi-element-optical-bench-chain",
    label: "L8.5 Multi-Element Optical Bench Propagation Chain",
    grid: {
      ...base.grid,
      domainWidthUm: 24,
      domainHeightUm: 18,
      zStartMm: 0,
      zEndMm: 65,
      pointsPerWavelength: 12
    },
    source: {
      ...base.source,
      label: "500 nm coherent plane-wave source",
      wavelengthNm: 500,
      zMm: 0
    },
    elements: [
      createBenchElement("circular-aperture", 10, "Circular aperture 1"),
      createBenchElement("ideal-lens", 20, "Ideal thin lens 1"),
      createBenchElement("finite-transparent-block", 30, "Transparent block 1"),
      createBenchElement("finite-absorbing-block", 40, "Absorbing blocker 1")
    ],
    target: {
      ...base.target,
      label: "Transparent target plane",
      zMm: 50,
      thicknessUm: 25
    },
    customMonitors: [],
    observationPlaneZMm: 60,
    boundary: [...l85OpticalBenchBoundary]
  };
}

export function createBenchElement(kind: SimulationBuilderElementKind, zMm: number, label?: string): SimulationBuilderElement {
  const element = orderedSimulationBuilderElements([defaultSimulationBuilderScenario().elements[0]!, defaultSimulationBuilderScenario().elements[1]!]).find((item) => item.kind === kind);
  const fallback = createElementFallback(kind, zMm, label);
  if (!element) return fallback;
  return { ...fallback, id: `${kind}-${Math.round(zMm * 1000)}`, label: label ?? fallback.label };
}

export function addOpticalBenchElement(scenario: SimulationBuilderScenario, kind: SimulationBuilderElementKind, input: { zMm?: number; label?: string } = {}): SimulationBuilderScenario {
  const currentMaxZ = Math.max(scenario.source.zMm, ...scenario.elements.map((element) => element.zMm));
  const zMm = input.zMm ?? Math.min(scenario.observationPlaneZMm - 1, currentMaxZ + 10);
  const count = scenario.elements.filter((element) => element.kind === kind).length + 1;
  const element = createBenchElement(kind, zMm, input.label ?? `${benchKindLabel(kind)} ${count}`);
  return {
    ...scenario,
    elements: orderedSimulationBuilderElements([...scenario.elements, { ...element, id: uniqueElementId(element, scenario.elements) }])
  };
}

export function duplicateOpticalBenchElement(scenario: SimulationBuilderScenario, elementId: string): SimulationBuilderScenario {
  const element = scenario.elements.find((item) => item.id === elementId);
  if (!element) return scenario;
  const copy = {
    ...element,
    id: uniqueElementId({ ...element, id: `${element.id}-copy` }, scenario.elements),
    label: `${element.label} copy`,
    zMm: Math.min(scenario.grid.zEndMm - 0.5, element.zMm + Math.max(0.5, (element.thicknessUm ?? 1) / 1000 + 1))
  };
  return { ...scenario, elements: orderedSimulationBuilderElements([...scenario.elements, copy]) };
}

export function deleteOpticalBenchElement(scenario: SimulationBuilderScenario, elementId: string): SimulationBuilderScenario {
  return { ...scenario, elements: scenario.elements.filter((element) => element.id !== elementId) };
}

export function setOpticalBenchElementEnabled(scenario: SimulationBuilderScenario, elementId: string, enabled: boolean): SimulationBuilderScenario {
  return {
    ...scenario,
    elements: scenario.elements.map((element) => (element.id === elementId ? { ...element, status: enabled ? elementStatusForKind(element.kind) : "scaffold-only", validation: enabled ? elementValidationForKind(element.kind) : "disabled in L8.5 optical bench scene" } : element))
  };
}

export function updateOpticalBenchElementZ(scenario: SimulationBuilderScenario, elementId: string, zMm: number): SimulationBuilderScenario {
  return {
    ...scenario,
    elements: orderedSimulationBuilderElements(scenario.elements.map((element) => (element.id === elementId ? { ...element, zMm } : element)))
  };
}

export function createOpticalBenchScene(scenario: SimulationBuilderScenario = defaultOpticalBenchScenario()): OpticalBenchScene {
  const sourceScenarioHash = opticalBenchSourceScenarioHash(scenario);
  const elements = orderedSimulationBuilderElements(scenario.elements).map((element) => toBenchElement(element));
  const monitors = autoOpticalBenchMonitors(scenario, elements);
  const target: OpticalBenchTarget = {
    id: "target",
    label: scenario.target.label,
    zMm: scenario.target.zMm,
    widthUm: scenario.grid.domainWidthUm,
    heightUm: scenario.grid.domainHeightUm
  };
  const draft = {
    schema: "emmicro.opticalBenchScene.v1" as const,
    id: scenario.id,
    label: scenario.label,
    grid: {
      domainWidthUm: scenario.grid.domainWidthUm,
      domainHeightUm: scenario.grid.domainHeightUm,
      zStartMm: scenario.grid.zStartMm,
      zEndMm: scenario.grid.zEndMm,
      pointsPerWavelength: scenario.grid.pointsPerWavelength
    },
    source: {
      id: "source",
      label: scenario.source.label,
      wavelengthNm: scenario.source.wavelengthNm,
      zMm: scenario.source.zMm,
      xUm: scenario.source.xUm,
      yUm: scenario.source.yUm,
      direction: scenario.source.direction
    },
    elements,
    monitors,
    target,
    boundary: [...l85OpticalBenchBoundary],
    sourceScenarioHash
  };
  const sceneHash = fnv1a64(stableStringify(draft));
  return { ...draft, sceneHash };
}

export function opticalBenchCrossSection(scene: OpticalBenchScene): OpticalBenchCrossSectionItem[] {
  const items: OpticalBenchCrossSectionItem[] = [
    {
      id: "pml-start",
      label: "PML start",
      kind: "pml",
      type: "pml",
      zMm: scene.grid.zStartMm,
      xUm: 0,
      widthUm: scene.grid.domainWidthUm,
      heightUm: scene.grid.domainHeightUm,
      thicknessUm: pmlThicknessUm(scene) / 1000,
      status: "computed",
      solverRoute: "boundary"
    },
    {
      id: scene.source.id,
      label: scene.source.label,
      kind: "source",
      type: "plane-wave",
      zMm: scene.source.zMm,
      xUm: scene.source.xUm,
      widthUm: scene.grid.domainWidthUm,
      heightUm: scene.grid.domainHeightUm,
      thicknessUm: 0,
      status: "executable",
      solverRoute: "scalar-chain"
    },
    ...scene.elements.map((element) => ({
      id: element.id,
      label: element.label,
      kind: "element" as const,
      type: element.type,
      zMm: element.zMm,
      xUm: element.xUm,
      widthUm: element.widthUm,
      heightUm: element.heightUm,
      thicknessUm: element.thicknessUm,
      status: element.status,
      solverRoute: element.solverRoute
    })),
    ...scene.monitors.map((monitor) => ({
      id: monitor.id,
      label: monitor.label,
      kind: "monitor" as const,
      type: monitor.kind,
      zMm: monitor.zMm,
      xUm: monitor.xUm,
      widthUm: monitor.widthUm,
      heightUm: monitor.heightUm,
      thicknessUm: 0,
      status: monitor.solverRoute === "scalar-chain" ? ("computed" as const) : ("external-only" as const),
      solverRoute: monitor.solverRoute
    })),
    {
      id: scene.target.id,
      label: scene.target.label,
      kind: "target",
      type: "target",
      zMm: scene.target.zMm,
      xUm: 0,
      widthUm: scene.target.widthUm,
      heightUm: scene.target.heightUm,
      thicknessUm: 0,
      status: "executable",
      solverRoute: "scalar-chain"
    },
    {
      id: "pml-end",
      label: "PML end",
      kind: "pml",
      type: "pml",
      zMm: scene.grid.zEndMm,
      xUm: 0,
      widthUm: scene.grid.domainWidthUm,
      heightUm: scene.grid.domainHeightUm,
      thicknessUm: pmlThicknessUm(scene) / 1000,
      status: "computed",
      solverRoute: "boundary"
    }
  ];
  return items.sort((a, b) => (a.zMm === b.zMm ? a.id.localeCompare(b.id) : a.zMm - b.zMm));
}

export function createOpticalBenchSolverPlan(scene: OpticalBenchScene): OpticalBenchSolverPlanRow[] {
  const warnings = opticalBenchWarnings(scene);
  const ordered = [...scene.elements];
  const rows: OpticalBenchSolverPlanRow[] = [];
  let previousLabel = scene.source.label;
  let previousZ = scene.source.zMm;
  for (const element of ordered) {
    const elementWarnings = warnings.filter((warning) => warning.elementId === element.id);
    rows.push({
      id: `segment-${element.id}`,
      label: element.label,
      segment: `${previousLabel} -> ${element.label}`,
      zStartMm: previousZ,
      zEndMm: element.zMm,
      solverRoute: element.solverRoute,
      status: element.status,
      executable: element.solverRoute === "scalar-chain",
      validationReference: element.validationReference,
      warnings: elementWarnings
    });
    previousLabel = element.label;
    previousZ = element.zMm;
  }
  rows.push({
    id: "segment-target",
    label: scene.target.label,
    segment: `${previousLabel} -> ${scene.target.label}`,
    zStartMm: previousZ,
    zEndMm: scene.target.zMm,
    solverRoute: "scalar-chain",
    status: "computed",
    executable: true,
    validationReference: "target/observation plane placement with scalar preview and external evidence if finite geometry exists upstream",
    warnings: warnings.filter((warning) => !warning.elementId)
  });
  return rows;
}

export function runOpticalBenchScalarPreview(scene: OpticalBenchScene): OpticalBenchScalarPreview {
  const width = 48;
  const height = 32;
  let field = createUniformField(width, height);
  let currentZ = scene.source.zMm;
  const snapshots: OpticalBenchMonitorSnapshot[] = [
    snapshotForMonitor(scene, sourceMonitor(scene), field, "computed", [])
  ];
  const warnings: SolverWarning[] = [];

  for (const element of scene.elements) {
    if (!element.enabled) continue;
    const distanceMm = Math.max(0, element.zMm - currentZ);
    field = propagatePreview(field, distanceMm, scene.source.wavelengthNm);
    currentZ = element.zMm;
    if (element.solverRoute === "scalar-chain") {
      field = applyScalarElement(field, element, scene);
      const monitor = scene.monitors.find((item) => item.sourceElementId === element.id && item.kind !== "flux");
      if (monitor) snapshots.push(snapshotForMonitor(scene, monitor, field, "computed", monitor.warningCodes));
    } else if (element.solverRoute === "external-fdtd") {
      const before = scene.monitors.find((item) => item.id === `${element.id}-before-field`);
      const after = scene.monitors.find((item) => item.id === `${element.id}-after-field`);
      if (before) snapshots.push(snapshotForMonitor(scene, before, field, "external-only", before.warningCodes));
      if (after) snapshots.push(snapshotForMonitor(scene, after, attenuateField(field, element.type === "absorbing-block" ? 0.72 : 0.9), "external-only", after.warningCodes));
      warnings.push({
        code: "opticalBench.scalar.externalBoundary",
        message: `${element.label} is finite geometry; scalar preview stops at a placement/attenuation diagnostic and requires imported external FDTD evidence.`,
        elementId: element.id
      });
    } else {
      warnings.push({
        code: "opticalBench.scalar.blockedElement",
        message: `${element.label} is ${element.status}; scalar monitor output is not computed through this element.`,
        elementId: element.id
      });
    }
  }

  field = propagatePreview(field, Math.max(0, scene.target.zMm - currentZ), scene.source.wavelengthNm);
  const targetMonitor = scene.monitors.find((monitor) => monitor.id === "target-field");
  if (targetMonitor) snapshots.push(snapshotForMonitor(scene, targetMonitor, field, "computed", targetMonitor.warningCodes));
  const observationMonitor = scene.monitors.find((monitor) => monitor.id === "observation-plane");
  if (observationMonitor) {
    const observationField = propagatePreview(field, Math.max(0, observationMonitor.zMm - scene.target.zMm), scene.source.wavelengthNm);
    snapshots.push(snapshotForMonitor(scene, observationMonitor, observationField, "computed", observationMonitor.warningCodes));
  }

  const stageMetrics = snapshots.map((snapshot) => ({
    id: snapshot.monitorId,
    label: snapshot.label,
    zMm: snapshot.zMm,
    peakIntensity: snapshot.metrics.peakIntensity,
    relativePower: snapshot.metrics.relativePower,
    solverRoute: snapshot.solverRoute
  }));
  const draft = {
    schema: "emmicro.opticalBench.scalarPreview.v1" as const,
    sceneHash: scene.sceneHash,
    snapshots,
    stageMetrics,
    warnings: uniqueWarnings(warnings)
  };
  return { ...draft, previewHash: fnv1a64(stableStringify(draft)) };
}

export function createOpticalBenchExternalEvidence(scene: OpticalBenchScene, fdtdBundle: FdtdExportBundle): OpticalBenchExternalEvidence {
  const finiteCount = scene.elements.filter((element) => element.solverRoute === "external-fdtd").length;
  const incidentFlux = 1;
  const reflectedFlux = finiteCount > 1 ? 0.08 : 0.035;
  const absorbedFlux = finiteCount > 1 ? 0.18 : 0.06;
  const transmittedFlux = Math.max(0, incidentFlux - reflectedFlux - absorbedFlux);
  const receipt = makeOpticalBenchFdtdRunReceipt({
    schema: "emmicro.fdtd.runReceipt.v1",
    runId: `l85-multi-element-fixture-${scene.sceneHash.slice(0, 8)}`,
    sourceScenarioHash: fdtdBundle.manifest.sourceScenarioHash,
    manifestHash: fdtdBundle.manifest.manifestHash,
    scriptHash: fdtdBundle.script.scriptHash,
    tool: {
      name: "example-fixture",
      version: "l85.deterministic.fixture",
      postprocessorVersion: "emmicro.fdtd.multiElement.fixture.v1"
    },
    createdAtIso: "2026-06-06T00:00:00.000Z",
    settings: {
      resolution: Math.max(1, Math.round(1000 / Math.max(1, fdtdBundle.manifest.grid.gridSpacingNm))),
      until: 260,
      pmlThicknessUm: fdtdBundle.manifest.boundaries.pmlThicknessUm
    },
    warnings: [
      {
        code: "opticalBench.external.fixture",
        message: "Bundled L8.5 multi-element evidence is deterministic fixture data for UI/report validation, not a browser-run FDTD solve."
      }
    ]
  });
  const flux = makeOpticalBenchFdtdFluxSummary({
    schema: "emmicro.fdtd.fluxSummary.v1",
    runId: receipt.runId,
    sourceScenarioHash: receipt.sourceScenarioHash,
    manifestHash: receipt.manifestHash,
    incidentFlux,
    reflectedFlux,
    transmittedFlux,
    absorbedFlux,
    reflectance: reflectedFlux / incidentFlux,
    transmittance: transmittedFlux / incidentFlux,
    absorbance: absorbedFlux / incidentFlux,
    energyBalance: reflectedFlux + transmittedFlux + absorbedFlux,
    monitors: scene.monitors
      .filter((monitor) => monitor.kind === "flux")
      .slice(0, 8)
      .map((monitor, index) => ({ id: monitor.id, flux: Number((transmittedFlux * (1 - index * 0.03)).toPrecision(12)) })),
    warnings: receipt.warnings
  });
  const fieldSlice = makeOpticalBenchFdtdFieldSlice({
    schema: "emmicro.fdtd.fieldSlice.v1",
    id: "l85-multi-element-field-slice-xz",
    sourceScenarioHash: receipt.sourceScenarioHash,
    manifestHash: receipt.manifestHash,
    component: "intensity",
    plane: "xz",
    samples: deterministicFieldSliceSamples(scene),
    xCount: 13,
    zCount: 13
  });
  const fieldSliceCsv = opticalBenchFieldSliceToCsv(fieldSlice);
  return {
    receipt,
    flux,
    fieldSlice,
    fieldSliceCsv,
    imported: {
      receipt,
      flux,
      fieldSlice,
      warnings: uniqueWarnings([...receipt.warnings, ...flux.warnings])
    }
  };
}

export function createOpticalBenchValidationReport(input: {
  scene: OpticalBenchScene;
  solverPlan: OpticalBenchSolverPlanRow[];
  scalarPreview: OpticalBenchScalarPreview;
  externalEvidence?: OpticalBenchExternalEvidence | null;
}): OpticalBenchValidationReport {
  const warnings = uniqueWarnings([
    ...opticalBenchWarnings(input.scene),
    ...input.solverPlan.flatMap((row) => row.warnings),
    ...input.scalarPreview.warnings,
    ...(input.externalEvidence?.imported.warnings ?? [])
  ]);
  const status = opticalBenchComputationStatus(input.scene, input.solverPlan, input.externalEvidence ?? null);
  const draft = {
    schema: "emmicro.opticalBench.validationReport.v1" as const,
    scene: input.scene,
    solverPlan: input.solverPlan,
    scalarPreview: input.scalarPreview,
    externalEvidence: input.externalEvidence ?? null,
    computationStatus: status,
    warnings,
    exports: [
      "multielement_scene.json",
      "solver_plan.json",
      "monitor_stack.csv",
      "multielement_validation_report.md",
      "multielement_validation_report.json",
      "multielement_metrics.csv"
    ]
  };
  return { ...draft, reportHash: fnv1a64(stableStringify(reportForHash(draft))) };
}

export function validateOpticalBenchExternalEvidence(scene: OpticalBenchScene, evidence: OpticalBenchExternalEvidence | FdtdImportedRun): SolverWarning[] {
  const imported = "imported" in evidence ? evidence.imported : evidence;
  const warnings: SolverWarning[] = [];
  const expectedScenarioHash = scene.sourceScenarioHash;
  if (imported.receipt.sourceScenarioHash !== expectedScenarioHash) {
    warnings.push({
      code: "opticalBench.external.sceneHashMismatch",
      message: "Imported external evidence source scenario hash does not match the current L8.5 optical bench scene."
    });
  }
  if (Math.abs(imported.flux.energyBalance - 1) > 0.05) {
    warnings.push({
      code: "opticalBench.external.energyBalanceWarning",
      message: "Imported external evidence energy balance is outside the L8.5 diagnostic warning threshold."
    });
  }
  return warnings;
}

export function opticalBenchSceneJson(scene: OpticalBenchScene): string {
  return `${JSON.stringify(scene, null, 2)}\n`;
}

export function opticalBenchSolverPlanJson(plan: OpticalBenchSolverPlanRow[]): string {
  return `${JSON.stringify(plan, null, 2)}\n`;
}

export function opticalBenchMonitorStackCsv(preview: OpticalBenchScalarPreview): string {
  return [
    "monitor_id,label,z_mm,solver_route,status,peak_intensity,mean_intensity,total_power,relative_power,centroid_x_um,warning_codes",
    ...preview.snapshots.map((snapshot) => csvRow([
      snapshot.monitorId,
      snapshot.label,
      snapshot.zMm,
      snapshot.solverRoute,
      snapshot.status,
      snapshot.metrics.peakIntensity,
      snapshot.metrics.meanIntensity,
      snapshot.metrics.totalPower,
      snapshot.metrics.relativePower,
      snapshot.metrics.centroidXUm,
      snapshot.warningCodes.join("|")
    ]))
  ].join("\n");
}

export function opticalBenchMetricsCsv(report: OpticalBenchValidationReport): string {
  return [
    "metric,value,unit,status",
    csvRow(["scene_hash", report.scene.sceneHash, "", report.computationStatus]),
    csvRow(["element_count", report.scene.elements.length, "count", report.computationStatus]),
    csvRow(["monitor_count", report.scene.monitors.length, "count", report.computationStatus]),
    csvRow(["scalar_snapshot_count", report.scalarPreview.snapshots.length, "count", report.computationStatus]),
    csvRow(["external_reflectance", report.externalEvidence?.flux.reflectance ?? "", "relative", report.computationStatus]),
    csvRow(["external_transmittance", report.externalEvidence?.flux.transmittance ?? "", "relative", report.computationStatus]),
    csvRow(["external_absorbance", report.externalEvidence?.flux.absorbance ?? "", "relative", report.computationStatus]),
    csvRow(["warning_count", report.warnings.length, "count", report.computationStatus])
  ].join("\n");
}

export function opticalBenchValidationReportJson(report: OpticalBenchValidationReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function opticalBenchValidationReportMarkdown(report: OpticalBenchValidationReport): string {
  return [
    `# ${report.scene.label}`,
    "",
    `Scene hash: ${report.scene.sceneHash}`,
    `Report hash: ${report.reportHash}`,
    `Status: ${report.computationStatus.toUpperCase()}`,
    "",
    "## Ordered Scene",
    "",
    "| Item | z mm | Solver route | Status | Validation reference |",
    "| --- | ---: | --- | --- | --- |",
    `| ${report.scene.source.label} | ${formatNumber(report.scene.source.zMm)} | scalar-chain | executable | coherent source placement |`,
    ...report.scene.elements.map((element) => `| ${element.label} | ${formatNumber(element.zMm)} | ${element.solverRoute} | ${element.status} | ${element.validationReference} |`),
    `| ${report.scene.target.label} | ${formatNumber(report.scene.target.zMm)} | scalar-chain | computed | target/observation plane |`,
    "",
    "## Solver Plan",
    "",
    "| Segment | Solver path | Status | Executable |",
    "| --- | --- | --- | --- |",
    ...report.solverPlan.map((row) => `| ${row.segment} | ${row.solverRoute} | ${row.status} | ${row.executable ? "yes" : "no"} |`),
    "",
    "## Monitor Stack",
    "",
    "| Monitor | z mm | Status | Peak | Relative power |",
    "| --- | ---: | --- | ---: | ---: |",
    ...report.scalarPreview.snapshots.map((snapshot) => `| ${snapshot.label} | ${formatNumber(snapshot.zMm)} | ${snapshot.status} | ${formatNumber(snapshot.metrics.peakIntensity)} | ${formatNumber(snapshot.metrics.relativePower)} |`),
    "",
    "## External Evidence",
    "",
    report.externalEvidence
      ? `Imported fixture: ${report.externalEvidence.receipt.runId}; R/T/A ${formatNumber(report.externalEvidence.flux.reflectance)} / ${formatNumber(report.externalEvidence.flux.transmittance)} / ${formatNumber(report.externalEvidence.flux.absorbance)}; energy ${formatNumber(report.externalEvidence.flux.energyBalance)}.`
      : "No external FDTD evidence imported.",
    "",
    "## Warnings",
    "",
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning.code}: ${warning.message}`) : ["- none"]),
    "",
    "## Boundary",
    "",
    ...report.scene.boundary.map((item) => `- ${item}`)
  ].join("\n");
}

export function opticalBenchWarnings(scene: OpticalBenchScene): SolverWarning[] {
  const warnings: SolverWarning[] = [];
  const activeElements = scene.elements.filter((element) => element.enabled);
  for (let index = 0; index < activeElements.length - 1; index += 1) {
    const current = activeElements[index]!;
    const next = activeElements[index + 1]!;
    const currentEnd = current.zMm + current.thicknessUm / 2000;
    const nextStart = next.zMm - next.thicknessUm / 2000;
    if (currentEnd > nextStart) {
      warnings.push({
        code: "opticalBench.element.overlap",
        message: `${current.label} overlaps ${next.label}; update z position or thickness before external export.`,
        elementId: current.id
      });
    }
  }
  const pmlUm = pmlThicknessUm(scene);
  for (const element of activeElements) {
    const elementStartUm = element.zMm * 1000 - element.thicknessUm / 2;
    const elementEndUm = element.zMm * 1000 + element.thicknessUm / 2;
    if (elementStartUm - scene.grid.zStartMm * 1000 < pmlUm || scene.grid.zEndMm * 1000 - elementEndUm < pmlUm) {
      warnings.push({
        code: "opticalBench.geometry.pmlProximity",
        message: `${element.label} is too close to the PML/domain boundary for trustworthy external FDTD interpretation.`,
        elementId: element.id
      });
    }
    const monitorTooClose = scene.monitors.some((monitor) => monitor.sourceElementId === element.id && Math.abs(monitor.zMm - element.zMm) * 1000 < Math.max(scene.source.wavelengthNm / 1000, element.thicknessUm));
    if (monitorTooClose) {
      warnings.push({
        code: "opticalBench.monitor.tooClose",
        message: `${element.label} has a monitor closer than one wavelength or one geometry thickness; move monitor farther away for production evidence.`,
        elementId: element.id
      });
    }
    if (element.solverRoute === "unsupported") {
      warnings.push({
        code: "opticalBench.element.unsupported",
        message: `${element.label} is unsupported and blocks a fully computed scene.`,
        elementId: element.id
      });
    }
    if (element.solverRoute === "scaffold") {
      warnings.push({
        code: "opticalBench.element.scaffoldOnly",
        message: `${element.label} is scaffold-only; no scalar or external FDTD result is implied.`,
        elementId: element.id
      });
    }
  }
  for (const monitor of scene.monitors) {
    const insideMaterial = activeElements.some((element) => element.solverRoute === "external-fdtd" && Math.abs(monitor.zMm - element.zMm) * 1000 < element.thicknessUm / 2);
    if (insideMaterial) {
      warnings.push({
        code: "opticalBench.monitor.insideMaterial",
        message: `${monitor.label} is inside finite material geometry; move it before using flux/field values as validation evidence.`,
        elementId: monitor.sourceElementId
      });
    }
  }
  return uniqueWarnings(warnings);
}

function autoOpticalBenchMonitors(scenario: SimulationBuilderScenario, elements: OpticalBenchElement[]): OpticalBenchMonitor[] {
  const width = scenario.grid.domainWidthUm;
  const height = scenario.grid.domainHeightUm;
  const monitors: OpticalBenchMonitor[] = [sourceMonitorForScenario(scenario)];
  for (const element of elements) {
    if (!element.enabled) continue;
    if (element.solverRoute === "scalar-chain") {
      monitors.push({
        id: `${element.id}-after-field`,
        label: `After ${element.label}`,
        kind: "field",
        zMm: element.zMm + 0.25,
        xUm: element.xUm,
        yUm: element.yUm,
        widthUm: width,
        heightUm: height,
        sourceElementId: element.id,
        solverRoute: "scalar-chain",
        warningCodes: []
      });
    } else if (element.solverRoute === "external-fdtd") {
      const offsetMm = Math.max(0.25, element.thicknessUm / 1000);
      monitors.push(
        {
          id: `${element.id}-before-field`,
          label: `Before ${element.label}`,
          kind: "field",
          zMm: element.zMm - offsetMm,
          xUm: element.xUm,
          yUm: element.yUm,
          widthUm: Math.max(1, element.widthUm),
          heightUm: Math.max(1, element.heightUm),
          sourceElementId: element.id,
          solverRoute: "external-fdtd",
          warningCodes: ["opticalBench.external.required"]
        },
        {
          id: `${element.id}-after-field`,
          label: `After ${element.label}`,
          kind: "field",
          zMm: element.zMm + offsetMm,
          xUm: element.xUm,
          yUm: element.yUm,
          widthUm: Math.max(1, element.widthUm),
          heightUm: Math.max(1, element.heightUm),
          sourceElementId: element.id,
          solverRoute: "external-fdtd",
          warningCodes: ["opticalBench.external.required"]
        },
        {
          id: `${element.id}-flux`,
          label: `${element.label} flux`,
          kind: "flux",
          zMm: element.zMm + offsetMm * 1.5,
          xUm: element.xUm,
          yUm: element.yUm,
          widthUm: Math.max(1, element.widthUm),
          heightUm: Math.max(1, element.heightUm),
          sourceElementId: element.id,
          solverRoute: "external-fdtd",
          warningCodes: ["opticalBench.external.required"]
        }
      );
    }
  }
  monitors.push(
    {
      id: "target-field",
      label: "At target",
      kind: "field",
      zMm: scenario.target.zMm,
      xUm: 0,
      yUm: 0,
      widthUm: width,
      heightUm: height,
      solverRoute: "scalar-chain",
      warningCodes: []
    },
    {
      id: "observation-plane",
      label: "Observation plane",
      kind: "observation",
      zMm: scenario.observationPlaneZMm,
      xUm: 0,
      yUm: 0,
      widthUm: width,
      heightUm: height,
      solverRoute: "scalar-chain",
      warningCodes: []
    }
  );
  monitors.push(...orderedSimulationBuilderCustomMonitors(scenario.customMonitors ?? []).map((monitor) => customMonitorToOpticalBenchMonitor(monitor)));
  return monitors.sort((a, b) => (a.zMm === b.zMm ? a.id.localeCompare(b.id) : a.zMm - b.zMm));
}

function customMonitorToOpticalBenchMonitor(monitor: SimulationBuilderCustomMonitor): OpticalBenchMonitor {
  return {
    id: monitor.id,
    label: monitor.label,
    kind: monitor.kind,
    zMm: monitor.zMm,
    xUm: monitor.xUm,
    yUm: monitor.yUm,
    widthUm: monitor.widthUm,
    heightUm: monitor.heightUm,
    sourceElementId: monitor.sourceElementId,
    solverRoute: monitor.solverRoute,
    warningCodes: ["opticalBench.customMonitor"]
  };
}

function sourceMonitorForScenario(scenario: SimulationBuilderScenario): OpticalBenchMonitor {
  return {
    id: "after-source",
    label: "After source",
    kind: "field",
    zMm: scenario.source.zMm,
    xUm: scenario.source.xUm,
    yUm: scenario.source.yUm,
    widthUm: scenario.grid.domainWidthUm,
    heightUm: scenario.grid.domainHeightUm,
    solverRoute: "scalar-chain",
    warningCodes: []
  };
}

function sourceMonitor(scene: OpticalBenchScene): OpticalBenchMonitor {
  return {
    id: "after-source",
    label: "After source",
    kind: "field",
    zMm: scene.source.zMm,
    xUm: scene.source.xUm,
    yUm: scene.source.yUm,
    widthUm: scene.grid.domainWidthUm,
    heightUm: scene.grid.domainHeightUm,
    solverRoute: "scalar-chain",
    warningCodes: []
  };
}

function toBenchElement(element: SimulationBuilderElement): OpticalBenchElement {
  const solverRoute = solverRouteForElement(element);
  return {
    id: element.id,
    label: element.label,
    type: benchElementType(element),
    zMm: element.zMm,
    xUm: element.xUm ?? 0,
    yUm: element.yUm ?? 0,
    widthUm: element.widthUm ?? element.apertureDiameterUm ?? element.apertureWidthUm ?? 6,
    heightUm: element.heightUm ?? element.apertureDiameterUm ?? element.apertureHeightUm ?? element.apertureWidthUm ?? 6,
    thicknessUm: element.thicknessUm ?? (element.kind === "ideal-lens" || element.kind === "circular-aperture" ? 0 : 1),
    orientationDeg: element.orientationDeg ?? 0,
    materialModel: element.materialLabel,
    enabled: element.validation !== "disabled in L8.5 optical bench scene",
    locked: element.id.includes("locked"),
    status: solverRoute === "external-fdtd" ? "external-only" : element.status,
    solverRoute,
    validationReference: validationReferenceForElement(element),
    sourceElementKind: element.kind,
    focalLengthMm: element.focalLengthMm
  };
}

function solverRouteForElement(element: SimulationBuilderElement): OpticalBenchSolverRoute {
  if (element.validation === "disabled in L8.5 optical bench scene") return "scaffold";
  if (element.kind === "circular-aperture" || element.kind === "ideal-lens") return "scalar-chain";
  if (element.kind === "material-interface" || element.kind === "material-slab" || element.kind === "absorbing-slab" || element.kind === "mirror-surface") return "scalar-chain";
  if (element.kind === "finite-transparent-block" || element.kind === "finite-absorbing-block" || element.kind === "finite-reflective-plate" || element.kind === "finite-aperture-blocker" || element.kind === "tilted-interface-wedge") return "external-fdtd";
  if (element.kind === "curved-material-lens") return "scaffold";
  return "unsupported";
}

function benchElementType(element: SimulationBuilderElement): OpticalBenchElementType {
  if (element.kind === "circular-aperture") return "circular-aperture";
  if (element.kind === "ideal-lens") return "ideal-thin-lens";
  if (element.kind === "finite-transparent-block" || element.kind === "material-slab" || element.kind === "material-interface") return "transparent-block";
  if (element.kind === "finite-absorbing-block" || element.kind === "absorbing-slab") return "absorbing-block";
  if (element.kind === "finite-reflective-plate" || element.kind === "mirror-surface") return "reflective-plate";
  if (element.kind === "finite-aperture-blocker") {
    if (element.apertureShape === "long-slit") return "long-slit";
    if (element.apertureShape === "rectangular-aperture") return "rectangular-aperture";
    return "finite-aperture-blocker";
  }
  if (element.kind === "tilted-interface-wedge") return "tilted-wedge-interface";
  if (element.kind === "curved-material-lens") return "curved-material-lens";
  return "finite-aperture-blocker";
}

function validationReferenceForElement(element: SimulationBuilderElement): string {
  if (element.kind === "circular-aperture") return "scalar aperture mask; circular aperture Airy/Bessel validation family";
  if (element.kind === "ideal-lens") return "ideal zero-thickness thin-lens phase mask; scalar focal-plane validation family";
  if (element.kind === "finite-transparent-block") return "external FDTD export/import with broad-block Fresnel/TMM reference";
  if (element.kind === "finite-absorbing-block") return "external FDTD export/import with Beer-Lambert attenuation and energy-balance reference";
  if (element.kind === "finite-reflective-plate") return "external FDTD ideal reflective plate diagnostic; not production metal optics";
  if (element.kind === "finite-aperture-blocker") return "external FDTD aperture/blocker edge-field diagnostic with scalar limiting reference and convergence warnings";
  if (element.kind === "tilted-interface-wedge") return "external FDTD tilted interface/wedge diagnostic with staircasing warning";
  if (element.kind === "curved-material-lens") return "scaffold-only; real curved material lens solve is not implemented";
  if (element.kind === "finite-metal-aperture") return "unsupported; finite-thickness metal aperture Maxwell solve is not implemented";
  return element.validation;
}

function opticalBenchComputationStatus(scene: OpticalBenchScene, solverPlan: OpticalBenchSolverPlanRow[], evidence: OpticalBenchExternalEvidence | null): OpticalBenchComputationStatus {
  if (solverPlan.some((row) => row.solverRoute === "unsupported")) return "blocked";
  const hasExternal = scene.elements.some((element) => element.solverRoute === "external-fdtd");
  if (hasExternal && evidence) return "external-results-imported";
  if (hasExternal) return "partially-computed";
  if (solverPlan.some((row) => row.solverRoute === "scaffold")) return "partially-computed";
  return "fully-computed";
}

function createUniformField(width: number, height: number): number[] {
  return Array.from({ length: width * height }, () => 1);
}

function propagatePreview(field: number[], distanceMm: number, wavelengthNm: number): number[] {
  if (distanceMm <= 0) return [...field];
  const blurRadius = Math.min(4, Math.max(1, Math.round((distanceMm * 500) / Math.max(1, wavelengthNm))));
  return blur1dX(field, 48, 32, blurRadius);
}

function applyScalarElement(field: number[], element: OpticalBenchElement, scene: OpticalBenchScene): number[] {
  if (element.type === "circular-aperture") return applyAperture(field, scene, element, "circular");
  if (element.type === "long-slit") return applyAperture(field, scene, element, "slit");
  if (element.type === "rectangular-aperture") return applyAperture(field, scene, element, "rectangular");
  if (element.type === "ideal-thin-lens") return applyLensFocus(field, scene, element);
  if (element.type === "absorbing-block") return attenuateField(field, 0.86);
  return [...field];
}

function applyAperture(field: number[], scene: OpticalBenchScene, element: OpticalBenchElement, shape: "circular" | "slit" | "rectangular"): number[] {
  const width = 48;
  const height = 32;
  const output = [...field];
  const apertureHalfX = Math.max(0.5, element.widthUm / scene.grid.domainWidthUm * width * 0.5);
  const apertureHalfY = Math.max(0.5, element.heightUm / scene.grid.domainHeightUm * height * 0.5);
  for (let y = 0; y < height; y += 1) {
    const dy = y - (height - 1) / 2;
    for (let x = 0; x < width; x += 1) {
      const dx = x - (width - 1) / 2;
      const inside = shape === "circular"
        ? (dx * dx) / (apertureHalfX * apertureHalfX) + (dy * dy) / (apertureHalfY * apertureHalfY) <= 1
        : shape === "slit"
          ? Math.abs(dx) <= apertureHalfX
          : Math.abs(dx) <= apertureHalfX && Math.abs(dy) <= apertureHalfY;
      if (!inside) output[y * width + x] = 0;
    }
  }
  return output;
}

function applyLensFocus(field: number[], scene: OpticalBenchScene, element: OpticalBenchElement): number[] {
  const width = 48;
  const height = 32;
  const focalBoost = Math.max(1, Math.min(4, (element.focalLengthMm ?? 20) / Math.max(1, scene.target.zMm - element.zMm)));
  const output = [...field];
  for (let y = 0; y < height; y += 1) {
    const dy = (y - (height - 1) / 2) / (height / 2);
    for (let x = 0; x < width; x += 1) {
      const dx = (x - (width - 1) / 2) / (width / 2);
      const radial = Math.sqrt(dx * dx + dy * dy);
      const factor = 1 + Math.exp(-radial * radial * 8) * focalBoost * 0.4;
      output[y * width + x] = (output[y * width + x] ?? 0) * factor;
    }
  }
  return normalizePower(output, sum(field));
}

function attenuateField(field: number[], factor: number): number[] {
  return field.map((value) => value * factor);
}

function blur1dX(field: number[], width: number, height: number, radius: number): number[] {
  const output = new Array<number>(field.length).fill(0);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let total = 0;
      let count = 0;
      for (let offset = -radius; offset <= radius; offset += 1) {
        const sampleX = Math.max(0, Math.min(width - 1, x + offset));
        total += field[y * width + sampleX] ?? 0;
        count += 1;
      }
      output[y * width + x] = total / count;
    }
  }
  return output;
}

function snapshotForMonitor(scene: OpticalBenchScene, monitor: OpticalBenchMonitor, field: number[], status: OpticalBenchMonitorSnapshot["status"], warningCodes: string[]): OpticalBenchMonitorSnapshot {
  const width = 48;
  const height = 32;
  const total = sum(field);
  const peak = Math.max(0, ...field);
  const mean = total / Math.max(1, field.length);
  const profile = Array.from({ length: width }, (_, x) => {
    let column = 0;
    for (let y = 0; y < height; y += 1) column += field[y * width + x] ?? 0;
    return {
      xUm: -scene.grid.domainWidthUm / 2 + (scene.grid.domainWidthUm * x) / (width - 1),
      intensity: column / height
    };
  });
  const profileTotal = profile.reduce((acc, point) => acc + point.intensity, 0);
  const centroidXUm = profileTotal > 0 ? profile.reduce((acc, point) => acc + point.xUm * point.intensity, 0) / profileTotal : 0;
  return {
    monitorId: monitor.id,
    label: monitor.label,
    zMm: monitor.zMm,
    solverRoute: monitor.solverRoute,
    status,
    width,
    height,
    intensity: field.map((value) => Number(value.toPrecision(8))),
    profile: profile.map((point) => ({ xUm: Number(point.xUm.toPrecision(8)), intensity: Number(point.intensity.toPrecision(8)) })),
    metrics: {
      peakIntensity: Number(peak.toPrecision(10)),
      meanIntensity: Number(mean.toPrecision(10)),
      totalPower: Number(total.toPrecision(10)),
      relativePower: Number((total / (width * height)).toPrecision(10)),
      centroidXUm: Number(centroidXUm.toPrecision(10))
    },
    warningCodes
  };
}

function deterministicFieldSliceSamples(scene: OpticalBenchScene): FdtdFieldSlice["samples"] {
  const samples: FdtdFieldSlice["samples"] = [];
  const xCount = 13;
  const zCount = 13;
  for (let zIndex = 0; zIndex < zCount; zIndex += 1) {
    const zUm = scene.grid.zStartMm * 1000 + ((scene.grid.zEndMm - scene.grid.zStartMm) * 1000 * zIndex) / (zCount - 1);
    for (let xIndex = 0; xIndex < xCount; xIndex += 1) {
      const xUm = -scene.grid.domainWidthUm / 2 + (scene.grid.domainWidthUm * xIndex) / (xCount - 1);
      const apertureShadow = scene.elements.some((element) => element.solverRoute === "external-fdtd" && Math.abs(zUm / 1000 - element.zMm) < 5 && Math.abs(xUm - element.xUm) > element.widthUm * 0.45) ? 0.45 : 1;
      const lensFocus = 1 + Math.exp(-(xUm * xUm) / 12) * Math.max(0, zIndex - 2) * 0.025;
      const value = apertureShadow * lensFocus;
      samples.push({
        xUm: Number(xUm.toPrecision(10)),
        zUm: Number(zUm.toPrecision(10)),
        value: Number(Math.sqrt(value).toPrecision(10)),
        intensity: Number(value.toPrecision(10))
      });
    }
  }
  return samples;
}

function opticalBenchSourceScenarioHash(scenario: SimulationBuilderScenario): string {
  const customMonitors = orderedSimulationBuilderCustomMonitors(scenario.customMonitors ?? []);
  return fnv1a64(
    stableStringify({
      schema: scenario.schema,
      id: scenario.id,
      grid: scenario.grid,
      source: scenario.source,
      elements: orderedSimulationBuilderElements(scenario.elements),
      ...(customMonitors.length > 0 ? { customMonitors } : {}),
      target: scenario.target,
      observationPlaneZMm: scenario.observationPlaneZMm
    })
  );
}

function makeOpticalBenchFdtdRunReceipt(input: Omit<FdtdRunReceipt, "receiptHash">): FdtdRunReceipt {
  const base = {
    ...input,
    warnings: [...input.warnings]
  };
  return {
    ...base,
    receiptHash: fnv1a64(stableStringify(base))
  };
}

function makeOpticalBenchFdtdFluxSummary(input: Omit<FdtdFluxSummary, "fluxHash">): FdtdFluxSummary {
  const base = {
    ...input,
    monitors: input.monitors.map((monitor) => ({ ...monitor })),
    warnings: [...input.warnings]
  };
  return {
    ...base,
    fluxHash: fnv1a64(stableStringify(base))
  };
}

function makeOpticalBenchFdtdFieldSlice(input: Omit<FdtdFieldSlice, "sliceHash" | "minIntensity" | "maxIntensity">): FdtdFieldSlice {
  const samples = input.samples.map((sample) => ({ ...sample }));
  const intensities = samples.map((sample) => sample.intensity);
  const base = {
    ...input,
    samples,
    minIntensity: intensities.length ? Math.min(...intensities) : 0,
    maxIntensity: intensities.length ? Math.max(...intensities) : 0
  };
  return {
    ...base,
    sliceHash: fnv1a64(stableStringify(base))
  };
}

function opticalBenchFieldSliceToCsv(slice: FdtdFieldSlice): string {
  return [
    "x_um,z_um,value,intensity",
    ...slice.samples.map((sample) => [sample.xUm, sample.zUm, sample.value, sample.intensity].map(formatFdtdNumber).join(","))
  ].join("\n");
}

function formatFdtdNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  return Number(value.toPrecision(12)).toString();
}

function normalizePower(field: number[], targetPower: number): number[] {
  const current = sum(field);
  if (current <= 0) return field;
  const scale = targetPower / current;
  return field.map((value) => value * scale);
}

function sum(values: number[]): number {
  return values.reduce((acc, value) => acc + value, 0);
}

function pmlThicknessUm(scene: OpticalBenchScene): number {
  return Math.max(0.5, (scene.source.wavelengthNm / 1000) * 1.5);
}

function createElementFallback(kind: SimulationBuilderElementKind, zMm: number, label?: string): SimulationBuilderElement {
  const status = elementStatusForKind(kind);
  return {
    id: `${kind}-${Math.round(zMm * 1000)}`,
    kind,
    label: label ?? benchKindLabel(kind),
    zMm,
    xUm: finiteKind(kind) ? 0 : undefined,
    yUm: finiteKind(kind) ? 0 : undefined,
    widthUm: kind === "circular-aperture" ? undefined : kind === "ideal-lens" ? 8 : finiteKind(kind) ? defaultWidth(kind) : undefined,
    heightUm: kind === "circular-aperture" ? undefined : kind === "ideal-lens" ? 8 : finiteKind(kind) ? defaultHeight(kind) : undefined,
    apertureDiameterUm: kind === "circular-aperture" ? 8 : undefined,
    apertureWidthUm: kind === "finite-aperture-blocker" ? 5 : undefined,
    apertureHeightUm: kind === "finite-aperture-blocker" ? 8 : undefined,
    apertureShape: kind === "finite-aperture-blocker" ? "rectangular-aperture" : undefined,
    screenModel: kind === "finite-aperture-blocker" ? "absorbing-screen" : undefined,
    focalLengthMm: kind === "ideal-lens" ? 30 : undefined,
    thicknessUm: finiteKind(kind) ? defaultThickness(kind) : kind === "material-slab" || kind === "absorbing-slab" ? 100 : undefined,
    orientationDeg: kind === "tilted-interface-wedge" ? 12 : undefined,
    materialIndex: kind === "finite-transparent-block" || kind === "tilted-interface-wedge" ? 1.5 : kind === "finite-absorbing-block" ? 1.2 : undefined,
    extinctionCoefficient: kind === "finite-absorbing-block" ? 0.02 : undefined,
    absorptionCoefficientPerM: kind === "finite-absorbing-block" ? 5000 : undefined,
    materialLabel: materialLabel(kind),
    model: modelLabel(kind),
    status,
    validation: elementValidationForKind(kind)
  };
}

function finiteKind(kind: SimulationBuilderElementKind): boolean {
  return kind === "finite-transparent-block" || kind === "finite-absorbing-block" || kind === "finite-reflective-plate" || kind === "finite-aperture-blocker" || kind === "tilted-interface-wedge";
}

function elementStatusForKind(kind: SimulationBuilderElementKind): SimulationBuilderCapabilityStatus {
  if (kind === "curved-material-lens") return "scaffold-only";
  if (kind === "finite-metal-aperture") return "not-implemented";
  return "executable";
}

function elementValidationForKind(kind: SimulationBuilderElementKind): string {
  if (kind === "curved-material-lens") return "shown in z-order only; real curved material solve is not executable";
  if (kind === "finite-metal-aperture") return "finite-thickness metal aperture Maxwell solve is not implemented";
  if (finiteKind(kind)) return "external FDTD export/import route with diagnostics and boundary warnings";
  return "scalar or planar validation route";
}

function materialLabel(kind: SimulationBuilderElementKind): string {
  if (kind === "ideal-lens") return "zero-thickness phase mask";
  if (kind === "circular-aperture") return "ideal scalar aperture mask";
  if (kind === "finite-transparent-block") return "finite dielectric n=1.5";
  if (kind === "finite-absorbing-block") return "finite lossy dielectric";
  if (kind === "finite-reflective-plate") return "ideal reflective diagnostic";
  if (kind === "finite-aperture-blocker") return "finite absorbing blocker mask";
  if (kind === "tilted-interface-wedge") return "tilted dielectric geometry";
  return "diagnostic material model";
}

function modelLabel(kind: SimulationBuilderElementKind): string {
  if (kind === "ideal-lens") return "ideal thin-lens phase";
  if (kind === "circular-aperture") return "scalar aperture mask";
  if (finiteKind(kind)) return "external FDTD finite geometry";
  if (kind === "curved-material-lens") return "scaffold only";
  if (kind === "finite-metal-aperture") return "not implemented";
  return "scalar/planar diagnostic";
}

function benchKindLabel(kind: SimulationBuilderElementKind): string {
  if (kind === "circular-aperture") return "Circular aperture";
  if (kind === "ideal-lens") return "Ideal thin lens";
  if (kind === "finite-transparent-block") return "Transparent block";
  if (kind === "finite-absorbing-block") return "Absorbing block";
  if (kind === "finite-reflective-plate") return "Reflective plate";
  if (kind === "finite-aperture-blocker") return "Aperture/blocker";
  if (kind === "tilted-interface-wedge") return "Tilted wedge";
  if (kind === "curved-material-lens") return "Curved material lens";
  if (kind === "finite-metal-aperture") return "Finite metal aperture";
  if (kind === "absorbing-slab") return "Absorbing slab";
  if (kind === "mirror-surface") return "Reflective plate";
  return "Transparent block";
}

function defaultWidth(kind: SimulationBuilderElementKind): number {
  if (kind === "finite-aperture-blocker") return 12;
  if (kind === "finite-reflective-plate") return 10;
  return 8;
}

function defaultHeight(kind: SimulationBuilderElementKind): number {
  if (kind === "finite-aperture-blocker") return 12;
  return defaultWidth(kind);
}

function defaultThickness(kind: SimulationBuilderElementKind): number {
  if (kind === "finite-reflective-plate") return 0.5;
  if (kind === "finite-aperture-blocker") return 0.8;
  if (kind === "finite-absorbing-block") return 100;
  if (kind === "tilted-interface-wedge") return 3;
  return 5;
}

function uniqueElementId(element: SimulationBuilderElement, existing: SimulationBuilderElement[]): string {
  const ids = new Set(existing.map((item) => item.id));
  if (!ids.has(element.id)) return element.id;
  let index = 2;
  while (ids.has(`${element.id}-${index}`)) index += 1;
  return `${element.id}-${index}`;
}

function reportForHash(report: Omit<OpticalBenchValidationReport, "reportHash">): unknown {
  return {
    schema: report.schema,
    sceneHash: report.scene.sceneHash,
    solverPlan: report.solverPlan.map((row) => ({ id: row.id, route: row.solverRoute, status: row.status })),
    previewHash: report.scalarPreview.previewHash,
    externalRunId: report.externalEvidence?.receipt.runId ?? null,
    computationStatus: report.computationStatus,
    warningCodes: report.warnings.map((warning) => warning.code)
  };
}

function formatNumber(value: number): string {
  if (value === 0) return "0";
  if (Math.abs(value) >= 1000 || Math.abs(value) < 0.001) return value.toExponential(4);
  return value.toPrecision(6);
}

function csvRow(values: Array<string | number>): string {
  return values.map(csvEscape).join(",");
}

function csvEscape(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
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
