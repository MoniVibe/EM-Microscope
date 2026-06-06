import {
  beerLambertTransmission,
  createSimulationBuilderElement,
  defaultSimulationBuilderScenario,
  orderedSimulationBuilderElements,
  type SimulationBuilderElement,
  type SimulationBuilderElementKind,
  type SimulationBuilderScenario,
  type SimulationBuilderValidationStatus
} from "../maxwell/simulationBuilder";
import { fresnelReflectanceNormal, runPlanarTmm } from "../maxwell/planarTmm";
import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import { createFdtdBenchmarkPack, type FdtdBenchmarkKind, type FdtdBenchmarkPack } from "./fdtdBenchmarkSuite";
import { exportFdtdBundleFromSimulationBuilder } from "./fdtdSceneExport";
import { fdtdFieldSliceToCsv, importFdtdRunArtifacts, makeFdtdFieldSlice, makeFdtdFluxSummary, makeFdtdRunReceipt } from "./fdtdRunImport";
import type { FdtdExportBundle, FdtdFieldSlice, FdtdFluxSummary, FdtdImportedRun, FdtdRunReceipt } from "./fdtdTypes";

export type SurfaceGeometryKind = "transparent-block" | "absorbing-block" | "reflective-plate" | "aperture-blocker" | "tilted-wedge";
export type SurfaceGeometryReferenceModel = "planar-tmm-broad-block" | "beer-lambert" | "ideal-reflector" | "aperture-open-fraction" | "snell-fresnel";
export type SurfaceGeometryClassification = "PASS" | "WARNING" | "FAIL" | "DIAGNOSTIC" | "NEEDS_CONVERGENCE";

export type SurfaceGeometryReference = {
  kind: SurfaceGeometryKind;
  model: SurfaceGeometryReferenceModel;
  expected: { reflectance: number; transmittance: number; absorbance: number };
  apertureOpenFraction?: number;
  snellDirectionDeg?: number;
  invariant: string;
  referenceHash: string;
};

export type SurfaceGeometryScene = {
  schema: "emmicro.fdtd.surfaceGeometryScene.v1";
  kind: SurfaceGeometryKind;
  scenario: SimulationBuilderScenario;
  bundle: FdtdExportBundle;
  geometryIds: string[];
  monitorIds: string[];
  reference: SurfaceGeometryReference;
  warnings: SolverWarning[];
  limitations: string[];
  sceneHash: string;
};

export type SurfaceGeometryValidationReport = {
  schema: "emmicro.fdtd.surfaceGeometryValidationReport.v1";
  kind: SurfaceGeometryKind;
  sourceScenarioHash: string;
  manifestHash: string;
  scriptHash: string;
  sceneHash: string;
  geometryHash: string;
  grid: {
    gridSpacingNm: number;
    pointsPerWavelength: number;
    estimatedCells: number;
  };
  pmlThicknessUm: number;
  monitorPositions: Array<{ id: string; zUm: number; normal: string }>;
  reference: SurfaceGeometryReference;
  imported: { reflectance: number; transmittance: number; absorbance: number };
  residuals: { reflectance: number; transmittance: number; absorbance: number; energyBalance: number; referenceResidual: number };
  energyBalance: number;
  status: SimulationBuilderValidationStatus;
  classification: SurfaceGeometryClassification;
  warnings: SolverWarning[];
  reportHash: string;
};

export type SurfaceGeometryExampleBundle = {
  scene: SurfaceGeometryScene;
  receipt: FdtdRunReceipt;
  flux: FdtdFluxSummary;
  fieldSlice: FdtdFieldSlice;
  fieldSliceCsv: string;
  imported: FdtdImportedRun;
  validation: SurfaceGeometryValidationReport;
};

export type SurfaceGeometryImportInput = {
  receiptJson: string | FdtdRunReceipt;
  fluxJson: string | FdtdFluxSummary;
  fieldSliceCsv: string;
};

export const surfaceGeometryKinds: SurfaceGeometryKind[] = ["transparent-block", "absorbing-block", "reflective-plate", "aperture-blocker", "tilted-wedge"];

export const l83SurfaceGeometryBoundary = [
  "Limited finite surface-geometry diagnostics only: placed transparent block, absorbing block, ideal reflective plate, aperture/blocker, and tilted wedge/interface.",
  "External FDTD export/import only; this finite-geometry workflow does not execute production FDTD or arbitrary 3D Maxwell in the browser.",
  "Field maps, flux summaries, and validation reports are imported evidence or deterministic fixtures, not in-browser Maxwell solves.",
  "Ideal reflector and aperture/blocker modes are diagnostic and require convergence evidence before physical interpretation.",
  "No arbitrary CAD import, freeform curved material lens solve, conformal multilayer curved coating solve, production metal optics model, FEM/BEM/RCWA execution, sensor-stack EM, digital twin, or manufacturing certification is claimed."
] as const;

export function createSurfaceGeometryElement(kind: SurfaceGeometryKind, zMm = defaultSurfaceGeometryZ(kind)): SimulationBuilderElement {
  const element = createSimulationBuilderElement(surfaceGeometryElementKind(kind), zMm, surfaceGeometryLabel(kind));
  if (kind === "transparent-block") {
    return {
      ...element,
      id: "l83-transparent-block",
      xUm: 0,
      yUm: 0,
      widthUm: 6,
      heightUm: 6,
      thicknessUm: 4,
      materialIndex: 1.5
    };
  }
  if (kind === "absorbing-block") {
    return {
      ...element,
      id: "l83-absorbing-block",
      xUm: 0,
      yUm: 0,
      widthUm: 6,
      heightUm: 6,
      thicknessUm: 100,
      materialIndex: 1.2,
      extinctionCoefficient: 0.02,
      absorptionCoefficientPerM: 5000
    };
  }
  if (kind === "reflective-plate") {
    return {
      ...element,
      id: "l83-reflective-plate",
      xUm: 0,
      yUm: 0,
      widthUm: 8,
      heightUm: 8,
      thicknessUm: 0.5
    };
  }
  if (kind === "aperture-blocker") {
    return {
      ...element,
      id: "l83-aperture-blocker",
      xUm: 0,
      yUm: 0,
      widthUm: 10,
      heightUm: 10,
      thicknessUm: 0.8,
      apertureWidthUm: 4,
      apertureHeightUm: 6
    };
  }
  return {
    ...element,
    id: "l83-tilted-wedge",
    xUm: 0,
    yUm: 0,
    widthUm: 8,
    heightUm: 8,
    thicknessUm: 3,
    orientationDeg: 12,
    materialIndex: 1.5
  };
}

export function createSurfaceGeometryScenario(kind: SurfaceGeometryKind): SimulationBuilderScenario {
  const base = defaultSimulationBuilderScenario();
  return {
    ...base,
    id: `l83-${kind}-surface-geometry`,
    label: `L8.3 ${surfaceGeometryLabel(kind)} external FDTD finite-geometry diagnostic`,
    grid: {
      ...base.grid,
      domainWidthUm: 12,
      domainHeightUm: 12,
      zStartMm: 0,
      zEndMm: 25,
      pointsPerWavelength: 12
    },
    source: {
      ...base.source,
      label: "500 nm coherent plane wave for finite geometry",
      zMm: 1
    },
    elements: [createSurfaceGeometryElement(kind)],
    target: {
      ...base.target,
      label: "Air reference monitor target",
      incidentIndex: 1,
      substrateIndex: 1,
      extinctionCoefficient: 0,
      absorptionCoefficientPerM: 0,
      thicknessUm: 0
    },
    observationPlaneZMm: 23.5,
    boundary: [...l83SurfaceGeometryBoundary]
  };
}

export function createSurfaceGeometryScene(kindOrScenario: SurfaceGeometryKind | SimulationBuilderScenario): SurfaceGeometryScene {
  const scenario = typeof kindOrScenario === "string" ? createSurfaceGeometryScenario(kindOrScenario) : kindOrScenario;
  const element = firstSurfaceGeometryElement(scenario);
  const kind = element ? surfaceGeometryKindForElement(element) : "transparent-block";
  const bundle = exportFdtdBundleFromSimulationBuilder(scenario);
  const geometryIds = bundle.manifest.geometry.filter((geometry) => geometry.sourceElementId).map((geometry) => geometry.id);
  const monitorIds = bundle.manifest.monitors.filter((monitor) => monitor.id.includes("l83-") || monitor.id === "field-slice-xz").map((monitor) => monitor.id);
  const reference = createSurfaceGeometryReference(scenario, kind);
  const warnings = uniqueWarnings([...bundle.manifest.readiness.warnings, ...surfaceGeometryReferenceWarnings(kind, element)]);
  const draft = {
    schema: "emmicro.fdtd.surfaceGeometryScene.v1" as const,
    kind,
    scenario,
    bundle,
    geometryIds,
    monitorIds,
    reference,
    warnings,
    limitations: [...l83SurfaceGeometryBoundary]
  };
  return {
    ...draft,
    sceneHash: fnv1a64(stableStringify(surfaceSceneForHash(draft)))
  };
}

export function createSurfaceGeometryConvergencePack(kind: SurfaceGeometryKind): FdtdBenchmarkPack {
  return createFdtdBenchmarkPack({
    benchmarkKind: benchmarkKindForSurfaceGeometry(kind),
    scenario: createSurfaceGeometryScenario(kind),
    sweepSettings: {
      maxRunCount: kind === "aperture-blocker" ? 12 : 18
    }
  });
}

export function createSurfaceGeometryExampleBundle(kind: SurfaceGeometryKind): SurfaceGeometryExampleBundle {
  const scene = createSurfaceGeometryScene(kind);
  const receipt = createSurfaceGeometryReceipt(scene);
  const flux = createSurfaceGeometryFlux(scene, receipt);
  const fieldSlice = createSurfaceGeometryFieldSlice(scene);
  const imported: FdtdImportedRun = {
    receipt,
    flux,
    fieldSlice,
    warnings: [...receipt.warnings, ...flux.warnings]
  };
  const validation = validateSurfaceGeometryImportedRun(scene, imported);
  return {
    scene,
    receipt,
    flux,
    fieldSlice,
    fieldSliceCsv: fdtdFieldSliceToCsv(fieldSlice),
    imported,
    validation
  };
}

export function createSurfaceGeometryExampleBundles(): Record<SurfaceGeometryKind, SurfaceGeometryExampleBundle> {
  return {
    "transparent-block": createSurfaceGeometryExampleBundle("transparent-block"),
    "absorbing-block": createSurfaceGeometryExampleBundle("absorbing-block"),
    "reflective-plate": createSurfaceGeometryExampleBundle("reflective-plate"),
    "aperture-blocker": createSurfaceGeometryExampleBundle("aperture-blocker"),
    "tilted-wedge": createSurfaceGeometryExampleBundle("tilted-wedge")
  };
}

export function importSurfaceGeometryArtifacts(scene: SurfaceGeometryScene, input: SurfaceGeometryImportInput): SurfaceGeometryValidationReport {
  const imported = importFdtdRunArtifacts({
    receiptJson: input.receiptJson,
    fluxJson: input.fluxJson,
    fieldSliceCsv: input.fieldSliceCsv,
    fieldSlice: {
      id: "field-slice-xz",
      sourceScenarioHash: scene.bundle.manifest.sourceScenarioHash,
      manifestHash: scene.bundle.manifest.manifestHash
    }
  });
  return validateSurfaceGeometryImportedRun(scene, imported);
}

export function validateSurfaceGeometryImportedRun(scene: SurfaceGeometryScene, imported: FdtdImportedRun): SurfaceGeometryValidationReport {
  const warnings: SolverWarning[] = [...scene.warnings, ...imported.warnings];
  if (imported.receipt.sourceScenarioHash !== scene.bundle.manifest.sourceScenarioHash) {
    warnings.push({
      code: "fdtd.surfaceGeometry.sourceHashMismatch",
      message: "Imported finite-geometry receipt does not match the active L8.3 scene hash."
    });
  }
  if (imported.receipt.manifestHash !== scene.bundle.manifest.manifestHash || imported.fieldSlice.manifestHash !== scene.bundle.manifest.manifestHash) {
    warnings.push({
      code: "fdtd.surfaceGeometry.manifestHashMismatch",
      message: "Imported finite-geometry result does not match the active FDTD manifest hash."
    });
  }
  if (imported.receipt.scriptHash !== scene.bundle.script.scriptHash) {
    warnings.push({
      code: "fdtd.surfaceGeometry.scriptHashMismatch",
      message: "Imported finite-geometry receipt does not match the exported Meep helper script hash."
    });
  }
  const importedRta = {
    reflectance: imported.flux.reflectance,
    transmittance: imported.flux.transmittance,
    absorbance: imported.flux.absorbance
  };
  const expected = scene.reference.expected;
  const energyBalance = imported.flux.energyBalance;
  const residuals = {
    reflectance: Math.abs(importedRta.reflectance - expected.reflectance),
    transmittance: Math.abs(importedRta.transmittance - expected.transmittance),
    absorbance: Math.abs(importedRta.absorbance - expected.absorbance),
    energyBalance: Math.abs(energyBalance - 1),
    referenceResidual: Math.max(
      Math.abs(importedRta.reflectance - expected.reflectance),
      Math.abs(importedRta.transmittance - expected.transmittance),
      Math.abs(importedRta.absorbance - expected.absorbance)
    )
  };
  const hasHashMismatch = warnings.some((warning) => warning.code.includes("HashMismatch"));
  const status = statusForSurfaceGeometry(scene.kind, residuals.referenceResidual, residuals.energyBalance, hasHashMismatch);
  const classification = classificationForSurfaceGeometry(scene.kind, status, residuals.referenceResidual, residuals.energyBalance);
  const geometryHash = fnv1a64(stableStringify(scene.bundle.manifest.geometry.filter((geometry) => geometry.sourceElementId)));
  const base = {
    schema: "emmicro.fdtd.surfaceGeometryValidationReport.v1" as const,
    kind: scene.kind,
    sourceScenarioHash: scene.bundle.manifest.sourceScenarioHash,
    manifestHash: scene.bundle.manifest.manifestHash,
    scriptHash: scene.bundle.script.scriptHash,
    sceneHash: scene.sceneHash,
    geometryHash,
    grid: {
      gridSpacingNm: scene.bundle.manifest.grid.gridSpacingNm,
      pointsPerWavelength: scene.bundle.manifest.grid.pointsPerWavelength,
      estimatedCells: scene.bundle.manifest.grid.estimatedCells
    },
    pmlThicknessUm: scene.bundle.manifest.boundaries.pmlThicknessUm,
    monitorPositions: scene.bundle.manifest.monitors.map((monitor) => ({ id: monitor.id, zUm: monitor.centerUm.z, normal: monitor.normal })),
    reference: scene.reference,
    imported: importedRta,
    residuals,
    energyBalance,
    status,
    classification,
    warnings: uniqueWarnings(warnings)
  };
  return {
    ...base,
    reportHash: fnv1a64(stableStringify(base))
  };
}

export function surfaceGeometrySceneJson(scene: SurfaceGeometryScene): string {
  return `${JSON.stringify(scene, null, 2)}\n`;
}

export function surfaceGeometryValidationReportJson(report: SurfaceGeometryValidationReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function surfaceGeometryValidationReportMarkdown(report: SurfaceGeometryValidationReport): string {
  return [
    `# L8.3 ${surfaceGeometryLabel(report.kind)} Validation Report`,
    "",
    `Scene hash: ${report.sceneHash}`,
    `Manifest hash: ${report.manifestHash}`,
    `Script hash: ${report.scriptHash}`,
    `Geometry hash: ${report.geometryHash}`,
    `Status: ${report.classification}`,
    "",
    "## Grid / Boundary",
    "",
    `Grid density: ${formatNumber(report.grid.pointsPerWavelength)} points per wavelength`,
    `Grid spacing: ${formatNumber(report.grid.gridSpacingNm)} nm`,
    `Estimated cells: ${formatNumber(report.grid.estimatedCells)}`,
    `PML thickness: ${formatNumber(report.pmlThicknessUm)} um`,
    "",
    "## Reference",
    "",
    `Model: ${report.reference.model}`,
    `Invariant: ${report.reference.invariant}`,
    "",
    "| Metric | Reference | Imported | Residual |",
    "| --- | ---: | ---: | ---: |",
    `| R | ${formatNumber(report.reference.expected.reflectance)} | ${formatNumber(report.imported.reflectance)} | ${formatNumber(report.residuals.reflectance)} |`,
    `| T | ${formatNumber(report.reference.expected.transmittance)} | ${formatNumber(report.imported.transmittance)} | ${formatNumber(report.residuals.transmittance)} |`,
    `| A | ${formatNumber(report.reference.expected.absorbance)} | ${formatNumber(report.imported.absorbance)} | ${formatNumber(report.residuals.absorbance)} |`,
    `| R+T+A | 1 | ${formatNumber(report.energyBalance)} | ${formatNumber(report.residuals.energyBalance)} |`,
    "",
    "## Monitor Positions",
    "",
    "| Monitor | z um | Normal |",
    "| --- | ---: | --- |",
    ...report.monitorPositions.map((monitor) => `| ${monitor.id} | ${formatNumber(monitor.zUm)} | ${monitor.normal} |`),
    "",
    "## Warnings",
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning.code}: ${warning.message}`) : ["- none"]),
    "",
    "## Boundary",
    ...l83SurfaceGeometryBoundary.map((item) => `- ${item}`)
  ].join("\n");
}

export function surfaceGeometryMetricsCsv(report: SurfaceGeometryValidationReport): string {
  return [
    "metric,reference,imported,residual,status,classification",
    row("reflectance", report.reference.expected.reflectance, report.imported.reflectance, report.residuals.reflectance, report.status, report.classification),
    row("transmittance", report.reference.expected.transmittance, report.imported.transmittance, report.residuals.transmittance, report.status, report.classification),
    row("absorbance", report.reference.expected.absorbance, report.imported.absorbance, report.residuals.absorbance, report.status, report.classification),
    row("energy_balance", 1, report.energyBalance, report.residuals.energyBalance, report.status, report.classification)
  ].join("\n");
}

export function surfaceGeometryReceiptJson(example: SurfaceGeometryExampleBundle): string {
  return `${JSON.stringify(example.receipt, null, 2)}\n`;
}

export function surfaceGeometryFluxSummaryJson(example: SurfaceGeometryExampleBundle): string {
  return `${JSON.stringify(example.flux, null, 2)}\n`;
}

export function surfaceGeometryKindForElement(element: SimulationBuilderElement): SurfaceGeometryKind {
  if (element.kind === "finite-absorbing-block") return "absorbing-block";
  if (element.kind === "finite-reflective-plate") return "reflective-plate";
  if (element.kind === "finite-aperture-blocker") return "aperture-blocker";
  if (element.kind === "tilted-interface-wedge") return "tilted-wedge";
  return "transparent-block";
}

function createSurfaceGeometryReference(scenario: SimulationBuilderScenario, kind: SurfaceGeometryKind): SurfaceGeometryReference {
  const element = firstSurfaceGeometryElement(scenario) ?? createSurfaceGeometryElement(kind);
  let model: SurfaceGeometryReferenceModel;
  let expected: SurfaceGeometryReference["expected"];
  let apertureOpenFraction: number | undefined;
  let snellDirectionDeg: number | undefined;
  let invariant: string;
  if (kind === "transparent-block") {
    model = "planar-tmm-broad-block";
    expected = broadTransparentBlockReference(scenario, element);
    invariant = "Broad finite dielectric block trends toward planar TMM/Fresnel R/T/A as transverse dimensions exceed the beam and convergence improves.";
  } else if (kind === "absorbing-block") {
    model = "beer-lambert";
    const transmittance = beerLambertTransmission(element.absorptionCoefficientPerM ?? 5000, Math.max(0, element.thicknessUm ?? 100) * 1e-6);
    expected = { reflectance: 0, transmittance, absorbance: 1 - transmittance };
    invariant = "Transmission decreases monotonically with lossy-block thickness and R+T+A stays near 1.";
  } else if (kind === "reflective-plate") {
    model = "ideal-reflector";
    expected = { reflectance: 1, transmittance: 0, absorbance: 0 };
    invariant = "Ideal reflective diagnostic keeps R near 1 and T near 0; it is not a real metal model.";
  } else if (kind === "aperture-blocker") {
    model = "aperture-open-fraction";
    apertureOpenFraction = openFraction(element);
    expected = { reflectance: 0, transmittance: apertureOpenFraction, absorbance: 1 - apertureOpenFraction };
    invariant = "Blocked/transmitted power follows aperture open fraction only as a diagnostic; edge diffraction requires convergence evidence.";
  } else {
    model = "snell-fresnel";
    expected = { reflectance: fresnelReflectanceNormal(1, element.materialIndex ?? 1.5), transmittance: 1 - fresnelReflectanceNormal(1, element.materialIndex ?? 1.5), absorbance: 0 };
    snellDirectionDeg = snellDirection(element.orientationDeg ?? 12, 1, element.materialIndex ?? 1.5);
    invariant = "Tilted dielectric surface reports Snell direction and Fresnel trend while warning about staircasing/convergence.";
  }
  const draft = {
    kind,
    model,
    expected,
    apertureOpenFraction,
    snellDirectionDeg,
    invariant
  };
  return {
    ...draft,
    referenceHash: fnv1a64(stableStringify(draft))
  };
}

function createSurfaceGeometryReceipt(scene: SurfaceGeometryScene): FdtdRunReceipt {
  return makeFdtdRunReceipt({
    schema: "emmicro.fdtd.runReceipt.v1",
    runId: `l83-example-${scene.kind}`,
    sourceScenarioHash: scene.bundle.manifest.sourceScenarioHash,
    manifestHash: scene.bundle.manifest.manifestHash,
    scriptHash: scene.bundle.script.scriptHash,
    tool: {
      name: "example-fixture",
      version: "emmicro.l83.fixture",
      postprocessorVersion: "emmicro.fdtd.surfaceGeometry.fixture.v1"
    },
    createdAtIso: "2026-06-06T00:00:00.000Z",
    settings: {
      resolution: Math.max(1, Math.round(1000 / scene.bundle.manifest.grid.gridSpacingNm)),
      until: scene.kind === "aperture-blocker" ? 320 : 240,
      pmlThicknessUm: scene.bundle.manifest.boundaries.pmlThicknessUm
    },
    warnings: scene.warnings
  });
}

function createSurfaceGeometryFlux(scene: SurfaceGeometryScene, receipt: FdtdRunReceipt): FdtdFluxSummary {
  const expected = scene.reference.expected;
  const imported = syntheticImportedRta(scene.kind, expected);
  const incidentFlux = 1;
  return makeFdtdFluxSummary({
    schema: "emmicro.fdtd.fluxSummary.v1",
    runId: receipt.runId,
    sourceScenarioHash: scene.bundle.manifest.sourceScenarioHash,
    manifestHash: scene.bundle.manifest.manifestHash,
    incidentFlux,
    reflectedFlux: imported.reflectance,
    transmittedFlux: imported.transmittance,
    absorbedFlux: imported.absorbance,
    reflectance: imported.reflectance,
    transmittance: imported.transmittance,
    absorbance: imported.absorbance,
    energyBalance: imported.reflectance + imported.transmittance + imported.absorbance,
    monitors: [
      { id: "incident-flux", flux: incidentFlux },
      { id: "reflected-flux", flux: imported.reflectance },
      { id: "transmitted-flux", flux: imported.transmittance },
      { id: "absorbed-estimate", flux: imported.absorbance }
    ],
    warnings: scene.warnings
  });
}

function createSurfaceGeometryFieldSlice(scene: SurfaceGeometryScene): FdtdFieldSlice {
  const xCount = 25;
  const zCount = 31;
  const grid = scene.scenario.grid;
  const width = grid.domainWidthUm;
  const zStart = grid.zStartMm * 1000;
  const zEnd = grid.zEndMm * 1000;
  const element = firstSurfaceGeometryElement(scene.scenario) ?? createSurfaceGeometryElement(scene.kind);
  const centerZ = element.zMm * 1000;
  const halfWidth = Math.max(0.1, (element.widthUm ?? width) / 2);
  const halfThickness = Math.max(0.05, (element.thicknessUm ?? 1) / 2);
  const samples = [];
  for (let zi = 0; zi < zCount; zi += 1) {
    const zUm = zStart + ((zEnd - zStart) * zi) / (zCount - 1);
    const after = zUm > centerZ + halfThickness;
    const insideZ = Math.abs(zUm - centerZ) <= halfThickness;
    for (let xi = 0; xi < xCount; xi += 1) {
      const xUm = -width / 2 + (width * xi) / (xCount - 1);
      const insideX = Math.abs(xUm - (element.xUm ?? 0)) <= halfWidth;
      const intensity = surfaceFieldIntensity(scene.kind, xUm, zUm, after, insideZ, insideX, scene.reference);
      samples.push({
        xUm: round(xUm),
        zUm: round(zUm),
        value: round(Math.sqrt(Math.max(0, intensity)) * Math.cos((zUm / Math.max(0.001, scene.scenario.source.wavelengthNm / 1000)) * Math.PI * 2)),
        intensity: round(intensity)
      });
    }
  }
  return makeFdtdFieldSlice({
    schema: "emmicro.fdtd.fieldSlice.v1",
    id: "field-slice-xz",
    sourceScenarioHash: scene.bundle.manifest.sourceScenarioHash,
    manifestHash: scene.bundle.manifest.manifestHash,
    component: "intensity",
    plane: "xz",
    samples,
    xCount,
    zCount
  });
}

function broadTransparentBlockReference(scenario: SimulationBuilderScenario, element: SimulationBuilderElement): SurfaceGeometryReference["expected"] {
  const n = element.materialIndex ?? 1.5;
  const tmm = runPlanarTmm({
    id: "l83-transparent-block-reference",
    label: "L8.3 broad transparent block TMM reference",
    wavelengthM: scenario.source.wavelengthNm * 1e-9,
    angleRad: 0,
    polarization: "TE",
    incidentMedium: { id: "air-in", label: "Air", refractiveIndex: { n: 1, k: 0 }, source: "L8.3 reference" },
    substrateMedium: { id: "air-out", label: "Air", refractiveIndex: { n: 1, k: 0 }, source: "L8.3 reference" },
    layers: [
      {
        id: "finite-block-broad-limit",
        label: "Broad finite block slab limit",
        material: { id: "glass", label: "Glass", refractiveIndex: { n, k: 0 }, source: "L8.3 reference" },
        thicknessM: Math.max(1e-9, (element.thicknessUm ?? 4) * 1e-6)
      }
    ],
    tolerance: 1e-8
  });
  return { reflectance: tmm.reflectance, transmittance: tmm.transmittance, absorbance: tmm.absorbance };
}

function syntheticImportedRta(kind: SurfaceGeometryKind, expected: SurfaceGeometryReference["expected"]): SurfaceGeometryReference["expected"] {
  const delta = kind === "aperture-blocker" ? 0.018 : kind === "tilted-wedge" ? 0.012 : 0.004;
  if (kind === "reflective-plate") return { reflectance: 0.996, transmittance: 0.002, absorbance: 0.002 };
  const reflectance = clamp(expected.reflectance + delta * 0.2);
  const transmittance = clamp(expected.transmittance - delta);
  const absorbance = clamp(1 - reflectance - transmittance);
  return { reflectance, transmittance, absorbance };
}

function surfaceFieldIntensity(
  kind: SurfaceGeometryKind,
  xUm: number,
  zUm: number,
  after: boolean,
  insideZ: boolean,
  insideX: boolean,
  reference: SurfaceGeometryReference
): number {
  const edge = 1 - 0.12 * Math.min(1, Math.abs(xUm) / 6);
  if (kind === "transparent-block") return Math.max(0, edge * (after && insideX ? reference.expected.transmittance : insideZ && insideX ? 0.72 : 1));
  if (kind === "absorbing-block") return Math.max(0, edge * (after && insideX ? reference.expected.transmittance : insideZ && insideX ? 0.42 : 1));
  if (kind === "reflective-plate") return Math.max(0, !after ? edge * (1 + 0.24 * Math.cos(zUm * 0.18)) : insideX ? 0.035 : 0.4 * edge);
  if (kind === "aperture-blocker") {
    const aperture = Math.abs(xUm) < 2.2;
    const sideLobe = after ? 0.18 * Math.pow(Math.cos(xUm * 1.2), 2) : 0;
    return Math.max(0, aperture ? 0.82 * edge + sideLobe : after ? sideLobe : 0.34 * edge);
  }
  const shift = after ? Math.min(3, Math.max(-3, (zUm - 10000) / 2800)) : 0;
  return Math.max(0, edge * Math.exp(-Math.pow((xUm - shift) / 5, 2)) * (insideZ ? 0.78 : 1));
}

function surfaceGeometryElementKind(kind: SurfaceGeometryKind): SimulationBuilderElementKind {
  if (kind === "transparent-block") return "finite-transparent-block";
  if (kind === "absorbing-block") return "finite-absorbing-block";
  if (kind === "reflective-plate") return "finite-reflective-plate";
  if (kind === "aperture-blocker") return "finite-aperture-blocker";
  return "tilted-interface-wedge";
}

function surfaceGeometryLabel(kind: SurfaceGeometryKind): string {
  if (kind === "transparent-block") return "Finite transparent block";
  if (kind === "absorbing-block") return "Finite absorbing block";
  if (kind === "reflective-plate") return "Finite ideal reflective plate";
  if (kind === "aperture-blocker") return "Finite aperture/blocker";
  return "Tilted transparent interface/wedge";
}

function firstSurfaceGeometryElement(scenario: SimulationBuilderScenario): SimulationBuilderElement | null {
  return orderedSimulationBuilderElements(scenario.elements).find((element) => surfaceElementKinds.includes(element.kind)) ?? null;
}

const surfaceElementKinds: SimulationBuilderElementKind[] = [
  "finite-transparent-block",
  "finite-absorbing-block",
  "finite-reflective-plate",
  "finite-aperture-blocker",
  "tilted-interface-wedge"
];

function surfaceGeometryReferenceWarnings(kind: SurfaceGeometryKind, element: SimulationBuilderElement | null): SolverWarning[] {
  if (kind === "aperture-blocker") {
    return [{ code: "fdtd.surfaceGeometry.noClosedFormAperture", message: "Finite aperture/blocker edge fields are diagnostic and need convergence evidence.", elementId: element?.id }];
  }
  if (kind === "tilted-wedge") {
    return [{ code: "fdtd.surfaceGeometry.tiltedConvergenceRequired", message: "Tilted/wedge surfaces need resolution and PML convergence evidence before interpreting direction residuals.", elementId: element?.id }];
  }
  return [];
}

function benchmarkKindForSurfaceGeometry(kind: SurfaceGeometryKind): FdtdBenchmarkKind {
  if (kind === "absorbing-block") return "absorbing-slab";
  if (kind === "reflective-plate") return "mirror";
  if (kind === "aperture-blocker") return "empty-space";
  return "transparent-slab";
}

function statusForSurfaceGeometry(kind: SurfaceGeometryKind, referenceResidual: number, energyResidual: number, hashMismatch: boolean): SimulationBuilderValidationStatus {
  if (hashMismatch) return "fail";
  if (kind === "aperture-blocker" || kind === "tilted-wedge") return referenceResidual > 0.12 || energyResidual > 0.06 ? "fail" : "warning";
  if (referenceResidual <= 0.03 && energyResidual <= 0.02) return "pass";
  if (referenceResidual <= 0.1 && energyResidual <= 0.06) return "warning";
  return "fail";
}

function classificationForSurfaceGeometry(kind: SurfaceGeometryKind, status: SimulationBuilderValidationStatus, referenceResidual: number, energyResidual: number): SurfaceGeometryClassification {
  if (status === "fail") return "FAIL";
  if (kind === "aperture-blocker") return referenceResidual > 0.08 || energyResidual > 0.04 ? "NEEDS_CONVERGENCE" : "DIAGNOSTIC";
  if (kind === "tilted-wedge") return "WARNING";
  return status === "pass" ? "PASS" : "WARNING";
}

function defaultSurfaceGeometryZ(kind: SurfaceGeometryKind): number {
  if (kind === "absorbing-block") return 10.5;
  if (kind === "reflective-plate") return 11;
  if (kind === "aperture-blocker") return 9.5;
  if (kind === "tilted-wedge") return 10;
  return 10;
}

function openFraction(element: SimulationBuilderElement): number {
  const apertureArea = Math.max(0.01, element.apertureWidthUm ?? 1) * Math.max(0.01, element.apertureHeightUm ?? 1);
  const screenArea = Math.max(0.01, element.widthUm ?? 1) * Math.max(0.01, element.heightUm ?? 1);
  return clamp(apertureArea / screenArea);
}

function snellDirection(angleDeg: number, n1: number, n2: number): number {
  const theta = Math.abs(angleDeg) * Math.PI / 180;
  return Math.asin(Math.min(0.999999, (n1 / Math.max(1e-9, n2)) * Math.sin(theta))) * 180 / Math.PI;
}

function surfaceSceneForHash(scene: Omit<SurfaceGeometryScene, "sceneHash">): unknown {
  return {
    schema: scene.schema,
    kind: scene.kind,
    scenario: {
      id: scene.scenario.id,
      grid: scene.scenario.grid,
      source: scene.scenario.source,
      elements: scene.scenario.elements,
      target: scene.scenario.target,
      observationPlaneZMm: scene.scenario.observationPlaneZMm
    },
    manifestHash: scene.bundle.manifest.manifestHash,
    scriptHash: scene.bundle.script.scriptHash,
    referenceHash: scene.reference.referenceHash,
    warningCodes: scene.warnings.map((warning) => warning.code)
  };
}

function row(metric: string, reference: number, imported: number, residual: number, status: string, classification: string): string {
  return [metric, reference, imported, residual, status, classification].map(csvEscape).join(",");
}

function csvEscape(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function round(value: number): number {
  return Number(value.toPrecision(12));
}

function formatNumber(value: number): string {
  if (value === 0) return "0";
  if (!Number.isFinite(value)) return "n/a";
  if (Math.abs(value) >= 1000 || Math.abs(value) < 0.001) return value.toExponential(4);
  return value.toPrecision(6);
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
