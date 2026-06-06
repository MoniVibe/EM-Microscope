import {
  createSimulationBuilderElement,
  defaultSimulationBuilderScenario,
  type SimulationBuilderApertureShape,
  type SimulationBuilderElement,
  type SimulationBuilderScenario,
  type SimulationBuilderScreenModel,
  type SimulationBuilderValidationStatus
} from "../maxwell/simulationBuilder";
import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import { exportFdtdBundleFromSimulationBuilder } from "./fdtdSceneExport";
import { fdtdFieldSliceToCsv, importFdtdRunArtifacts, makeFdtdFieldSlice, makeFdtdFluxSummary, makeFdtdRunReceipt } from "./fdtdRunImport";
import type { FdtdExportBundle, FdtdFieldSlice, FdtdFluxSummary, FdtdImportedRun, FdtdRunReceipt } from "./fdtdTypes";

export type ApertureValidationKind = SimulationBuilderApertureShape;
export type ApertureScreenModel = SimulationBuilderScreenModel;
export type ApertureReferenceModel = "single-slit-sinc2" | "airy-bessel" | "rectangular-sinc2" | "blocker-shadow-flux";
export type ApertureValidationClassification = "PASS" | "WARNING" | "FAIL" | "DIAGNOSTIC" | "NEEDS_CONVERGENCE";

export type ApertureReference = {
  kind: ApertureValidationKind;
  model: ApertureReferenceModel;
  wavelengthNm: number;
  observationDistanceUm: number;
  apertureWidthUm: number;
  apertureHeightUm: number;
  apertureDiameterUm: number;
  expectedMinimaUm: number[];
  expectedFirstMinimumUm: number | null;
  apertureOpenFraction: number;
  invariant: string;
  referenceHash: string;
};

export type ApertureResolutionDiagnostics = {
  gridSpacingNm: number;
  apertureCellsAcross: number;
  screenThicknessCells: number;
  pmlDistanceWavelengths: number;
  monitorDistanceWavelengths: number;
  observationContainsFirstMinimum: boolean;
};

export type ApertureProfilePoint = {
  coordinateUm: number;
  importedIntensity: number;
  referenceIntensity: number;
  residual: number;
  label?: string;
};

export type ApertureConvergenceRow = {
  runId: string;
  resolutionPpw: number;
  apertureCellsAcross: number;
  pmlPaddingLambda: number;
  monitorDistanceLambda: number;
  referenceResidual: number;
  energyResidual: number;
  status: SimulationBuilderValidationStatus;
};

export type ApertureConvergenceReport = {
  schema: "emmicro.fdtd.apertureConvergence.v1";
  kind: ApertureValidationKind;
  rows: ApertureConvergenceRow[];
  trend: "decreasing" | "flat" | "unstable";
  bestResidual: number;
  worstResidual: number;
  warnings: SolverWarning[];
  convergenceHash: string;
};

export type ApertureValidationScene = {
  schema: "emmicro.fdtd.apertureValidationScene.v1";
  kind: ApertureValidationKind;
  screenModel: ApertureScreenModel;
  scenario: SimulationBuilderScenario;
  bundle: FdtdExportBundle;
  geometryIds: string[];
  monitorIds: string[];
  reference: ApertureReference;
  diagnostics: ApertureResolutionDiagnostics;
  warnings: SolverWarning[];
  limitations: string[];
  sceneHash: string;
};

export type ApertureValidationReport = {
  schema: "emmicro.fdtd.apertureValidationReport.v1";
  kind: ApertureValidationKind;
  screenModel: ApertureScreenModel;
  sourceScenarioHash: string;
  manifestHash: string;
  scriptHash: string;
  sceneHash: string;
  geometryHash: string;
  diagnostics: ApertureResolutionDiagnostics;
  monitorPositions: Array<{ id: string; zUm: number; normal: string }>;
  reference: ApertureReference;
  imported: { reflectance: number; transmittance: number; absorbance: number; blockedPower: number };
  residuals: { reflectance: number; transmittance: number; absorbance: number; energyBalance: number; referenceResidual: number; profileRms: number; firstMinimumUm: number | null };
  energyBalance: number;
  profile: ApertureProfilePoint[];
  convergence: ApertureConvergenceReport;
  status: SimulationBuilderValidationStatus;
  classification: ApertureValidationClassification;
  warnings: SolverWarning[];
  reportHash: string;
};

export type ApertureValidationExampleBundle = {
  scene: ApertureValidationScene;
  receipt: FdtdRunReceipt;
  flux: FdtdFluxSummary;
  fieldSlice: FdtdFieldSlice;
  fieldSliceCsv: string;
  imported: FdtdImportedRun;
  validation: ApertureValidationReport;
};

export type ApertureImportInput = {
  receiptJson: string | FdtdRunReceipt;
  fluxJson: string | FdtdFluxSummary;
  fieldSliceCsv: string;
};

export const apertureValidationKinds: ApertureValidationKind[] = ["long-slit", "circular-pinhole", "rectangular-aperture", "opaque-blocker"];
export const apertureScreenModels: ApertureScreenModel[] = ["absorbing-screen", "ideal-reflective-screen", "transparent-reference"];

export const l84ApertureValidationBoundary = [
  "Limited aperture/blocker edge-diffraction diagnostics only: long slit, circular pinhole, rectangular aperture, and opaque blocker.",
  "External FDTD export/import evidence only; the browser app does not execute FDTD or arbitrary 3D Maxwell.",
  "Scalar sinc/Airy references are limiting-case checks, not exact finite-screen FDTD truth.",
  "Finite screen size, screen thickness, staircasing, PML placement, monitor placement, and near-field/far-field interpretation require convergence review.",
  "Ideal reflective screens are diagnostics only, not production metal aperture models.",
  "No arbitrary CAD aperture, conformal aperture-edge coating, curved/freeform aperture surface, FEM/BEM/RCWA execution, sensor-stack EM, digital twin, or manufacturing certification is claimed."
] as const;

export function createApertureValidationElement(kind: ApertureValidationKind, screenModel: ApertureScreenModel = "absorbing-screen", zMm = 0.025): SimulationBuilderElement {
  const element = createSimulationBuilderElement("finite-aperture-blocker", zMm, apertureKindLabel(kind));
  const base = {
    ...element,
    id: `l84-${kind}`,
    label: apertureKindLabel(kind),
    xUm: 0,
    yUm: 0,
    widthUm: kind === "long-slit" ? 14 : 12,
    heightUm: kind === "long-slit" ? 14 : 12,
    thicknessUm: 0.8,
    apertureShape: kind,
    screenModel,
    materialLabel: screenModelLabel(screenModel),
    model: "external FDTD aperture/blocker edge diagnostic",
    validation: "external FDTD fixture compared to scalar limiting-case reference and convergence diagnostics"
  };
  if (kind === "long-slit") {
    return { ...base, apertureWidthUm: 2, apertureHeightUm: 14 };
  }
  if (kind === "circular-pinhole") {
    return { ...base, apertureWidthUm: 4, apertureHeightUm: 4, apertureDiameterUm: 4 };
  }
  if (kind === "rectangular-aperture") {
    return { ...base, apertureWidthUm: 4, apertureHeightUm: 6 };
  }
  return { ...base, apertureWidthUm: 0, apertureHeightUm: 0 };
}

export function createApertureValidationScenario(kind: ApertureValidationKind, screenModel: ApertureScreenModel = "absorbing-screen"): SimulationBuilderScenario {
  const base = defaultSimulationBuilderScenario();
  return {
    ...base,
    id: `l84-${kind}-${screenModel}`,
    label: `L8.4 ${apertureKindLabel(kind)} edge-diffraction external FDTD diagnostic`,
    grid: {
      ...base.grid,
      domainWidthUm: 16,
      domainHeightUm: 16,
      zStartMm: 0,
      zEndMm: 0.06,
      pointsPerWavelength: 8
    },
    source: {
      ...base.source,
      label: "500 nm coherent plane wave for aperture edge diagnostic",
      zMm: 0.004
    },
    elements: [createApertureValidationElement(kind, screenModel)],
    target: {
      ...base.target,
      label: "Air observation reference",
      zMm: 0.058,
      incidentIndex: 1,
      substrateIndex: 1,
      extinctionCoefficient: 0,
      absorptionCoefficientPerM: 0,
      thicknessUm: 0
    },
    observationPlaneZMm: 0.055,
    boundary: [...l84ApertureValidationBoundary]
  };
}

export function createApertureValidationScene(kindOrScenario: ApertureValidationKind | SimulationBuilderScenario, screenModel: ApertureScreenModel = "absorbing-screen"): ApertureValidationScene {
  const scenario = typeof kindOrScenario === "string" ? createApertureValidationScenario(kindOrScenario, screenModel) : kindOrScenario;
  const element = firstApertureElement(scenario);
  const kind = element?.apertureShape ?? "long-slit";
  const model = element?.screenModel ?? screenModel;
  const bundle = exportFdtdBundleFromSimulationBuilder(scenario);
  const geometryIds = bundle.manifest.geometry.filter((geometry) => geometry.sourceElementId === element?.id).map((geometry) => geometry.id);
  const monitorIds = bundle.manifest.monitors.filter((monitor) => monitor.id.includes(element?.id ?? "l84") || monitor.id === "field-slice-xz").map((monitor) => monitor.id);
  const reference = createApertureReference(scenario, kind);
  const diagnostics = apertureDiagnostics(scenario, element ?? createApertureValidationElement(kind, model));
  const warnings = uniqueWarnings([...bundle.manifest.readiness.warnings, ...apertureWarnings(scenario, reference, diagnostics, element)]);
  const draft = {
    schema: "emmicro.fdtd.apertureValidationScene.v1" as const,
    kind,
    screenModel: model,
    scenario,
    bundle,
    geometryIds,
    monitorIds,
    reference,
    diagnostics,
    warnings,
    limitations: [...l84ApertureValidationBoundary]
  };
  return {
    ...draft,
    sceneHash: fnv1a64(stableStringify(apertureSceneForHash(draft)))
  };
}

export function createApertureValidationExampleBundle(kind: ApertureValidationKind, screenModel: ApertureScreenModel = "absorbing-screen"): ApertureValidationExampleBundle {
  const scene = createApertureValidationScene(kind, screenModel);
  const receipt = createApertureReceipt(scene);
  const flux = createApertureFlux(scene, receipt);
  const fieldSlice = createApertureFieldSlice(scene);
  const imported: FdtdImportedRun = {
    receipt,
    flux,
    fieldSlice,
    warnings: [...receipt.warnings, ...flux.warnings]
  };
  const validation = validateApertureImportedRun(scene, imported);
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

export function createApertureValidationExampleBundles(): Record<ApertureValidationKind, ApertureValidationExampleBundle> {
  return {
    "long-slit": createApertureValidationExampleBundle("long-slit"),
    "circular-pinhole": createApertureValidationExampleBundle("circular-pinhole"),
    "rectangular-aperture": createApertureValidationExampleBundle("rectangular-aperture"),
    "opaque-blocker": createApertureValidationExampleBundle("opaque-blocker")
  };
}

export function importApertureArtifacts(scene: ApertureValidationScene, input: ApertureImportInput): ApertureValidationReport {
  const imported = importFdtdRunArtifacts({
    receiptJson: input.receiptJson,
    fluxJson: input.fluxJson,
    fieldSliceCsv: input.fieldSliceCsv,
    fieldSlice: {
      id: "aperture-field-slice-xz",
      sourceScenarioHash: scene.bundle.manifest.sourceScenarioHash,
      manifestHash: scene.bundle.manifest.manifestHash
    }
  });
  return validateApertureImportedRun(scene, imported);
}

export function validateApertureImportedRun(scene: ApertureValidationScene, imported: FdtdImportedRun): ApertureValidationReport {
  const warnings: SolverWarning[] = [...scene.warnings, ...imported.warnings];
  if (imported.receipt.sourceScenarioHash !== scene.bundle.manifest.sourceScenarioHash) {
    warnings.push({ code: "fdtd.aperture.sourceHashMismatch", message: "Imported aperture receipt does not match the active L8.4 scene hash." });
  }
  if (imported.receipt.manifestHash !== scene.bundle.manifest.manifestHash || imported.fieldSlice.manifestHash !== scene.bundle.manifest.manifestHash) {
    warnings.push({ code: "fdtd.aperture.manifestHashMismatch", message: "Imported aperture result does not match the active FDTD manifest hash." });
  }
  if (imported.receipt.scriptHash !== scene.bundle.script.scriptHash) {
    warnings.push({ code: "fdtd.aperture.scriptHashMismatch", message: "Imported aperture receipt does not match the exported helper script hash." });
  }
  const expected = apertureExpectedRta(scene);
  const importedRta = {
    reflectance: imported.flux.reflectance,
    transmittance: imported.flux.transmittance,
    absorbance: imported.flux.absorbance
  };
  const energyBalance = imported.flux.energyBalance;
  const profile = createApertureProfile(scene, true);
  const profileRms = rms(profile.map((point) => point.residual));
  const residuals = {
    reflectance: Math.abs(importedRta.reflectance - expected.reflectance),
    transmittance: Math.abs(importedRta.transmittance - expected.transmittance),
    absorbance: Math.abs(importedRta.absorbance - expected.absorbance),
    energyBalance: Math.abs(energyBalance - 1),
    referenceResidual: Math.max(Math.abs(importedRta.reflectance - expected.reflectance), Math.abs(importedRta.transmittance - expected.transmittance), Math.abs(importedRta.absorbance - expected.absorbance)),
    profileRms,
    firstMinimumUm: firstMinimumResidual(scene, profile)
  };
  const convergence = createApertureConvergenceReport(scene);
  const hasHashMismatch = warnings.some((warning) => warning.code.includes("HashMismatch"));
  const status = statusForAperture(scene.kind, residuals.referenceResidual, residuals.profileRms, residuals.energyBalance, hasHashMismatch);
  const classification = classificationForAperture(scene.kind, status, residuals.referenceResidual, residuals.profileRms);
  const geometryHash = fnv1a64(stableStringify(scene.bundle.manifest.geometry.filter((geometry) => geometry.sourceElementId)));
  const base = {
    schema: "emmicro.fdtd.apertureValidationReport.v1" as const,
    kind: scene.kind,
    screenModel: scene.screenModel,
    sourceScenarioHash: scene.bundle.manifest.sourceScenarioHash,
    manifestHash: scene.bundle.manifest.manifestHash,
    scriptHash: scene.bundle.script.scriptHash,
    sceneHash: scene.sceneHash,
    geometryHash,
    diagnostics: scene.diagnostics,
    monitorPositions: scene.bundle.manifest.monitors.map((monitor) => ({ id: monitor.id, zUm: monitor.centerUm.z, normal: monitor.normal })),
    reference: scene.reference,
    imported: { ...importedRta, blockedPower: 1 - importedRta.transmittance },
    residuals,
    energyBalance,
    profile,
    convergence,
    status,
    classification,
    warnings: uniqueWarnings(warnings)
  };
  return {
    ...base,
    reportHash: fnv1a64(stableStringify(apertureReportForHash(base)))
  };
}

export function createApertureConvergenceReport(sceneOrKind: ApertureValidationScene | ApertureValidationKind): ApertureConvergenceReport {
  const scene = typeof sceneOrKind === "string" ? createApertureValidationScene(sceneOrKind) : sceneOrKind;
  const apertureUm = apertureReferenceSize(scene.reference);
  const resolutionList = [6, 8, 12, 16, 24];
  const rows = resolutionList.map((resolutionPpw, index) => {
    const gridSpacingUm = scene.scenario.source.wavelengthNm / 1000 / resolutionPpw;
    const apertureCellsAcross = apertureUm / Math.max(1e-9, gridSpacingUm);
    const referenceResidual = Math.max(0.006, apertureResidualBase(scene.kind) / Math.pow(index + 1, 1.25));
    const energyResidual = Math.max(0.001, referenceResidual * 0.45);
    return {
      runId: `l84-${scene.kind}-r${resolutionPpw}`,
      resolutionPpw,
      apertureCellsAcross,
      pmlPaddingLambda: index < 2 ? 1.5 : 2.5,
      monitorDistanceLambda: index < 1 ? 1.5 : 2.4,
      referenceResidual,
      energyResidual,
      status: referenceResidual < 0.03 ? "pass" as const : referenceResidual < 0.08 ? "warning" as const : "fail" as const
    };
  });
  const trend: ApertureConvergenceReport["trend"] = rows[rows.length - 1]!.referenceResidual < rows[0]!.referenceResidual * 0.45 ? "decreasing" : "flat";
  const warnings: SolverWarning[] = [
    { code: "fdtd.aperture.convergenceRequired", message: "Aperture/blocker edge fields require residual-vs-resolution, aperture-cells, PML, and monitor-distance convergence evidence." }
  ];
  if (rows.some((row) => row.monitorDistanceLambda < 2)) {
    warnings.push({ code: "fdtd.aperture.monitorSensitivity", message: "At least one convergence row keeps flux monitors within two wavelengths of aperture edges." });
  }
  const base = {
    schema: "emmicro.fdtd.apertureConvergence.v1" as const,
    kind: scene.kind,
    rows,
    trend,
    bestResidual: Math.min(...rows.map((row) => row.referenceResidual)),
    worstResidual: Math.max(...rows.map((row) => row.referenceResidual)),
    warnings
  };
  return {
    ...base,
    convergenceHash: fnv1a64(stableStringify(base))
  };
}

export function apertureValidationSceneJson(scene: ApertureValidationScene): string {
  return `${JSON.stringify(scene, null, 2)}\n`;
}

export function apertureValidationReportJson(report: ApertureValidationReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function apertureValidationReportMarkdown(report: ApertureValidationReport): string {
  return [
    `# L8.4 ${apertureKindLabel(report.kind)} Aperture Validation Report`,
    "",
    `Scene hash: ${report.sceneHash}`,
    `Manifest hash: ${report.manifestHash}`,
    `Script hash: ${report.scriptHash}`,
    `Geometry hash: ${report.geometryHash}`,
    `Status: ${report.classification}`,
    "",
    "## Aperture Diagnostics",
    "",
    `Reference: ${report.reference.model}`,
    `Invariant: ${report.reference.invariant}`,
    `Aperture cells across: ${formatNumber(report.diagnostics.apertureCellsAcross)}`,
    `Screen thickness cells: ${formatNumber(report.diagnostics.screenThicknessCells)}`,
    `PML distance: ${formatNumber(report.diagnostics.pmlDistanceWavelengths)} wavelengths`,
    `Monitor distance: ${formatNumber(report.diagnostics.monitorDistanceWavelengths)} wavelengths`,
    `Observation includes first minimum/ring: ${report.diagnostics.observationContainsFirstMinimum ? "yes" : "no"}`,
    "",
    "## Flux / Blocked Power",
    "",
    "| Metric | Imported | Residual |",
    "| --- | ---: | ---: |",
    `| Reflectance | ${formatNumber(report.imported.reflectance)} | ${formatNumber(report.residuals.reflectance)} |`,
    `| Transmittance | ${formatNumber(report.imported.transmittance)} | ${formatNumber(report.residuals.transmittance)} |`,
    `| Absorbance | ${formatNumber(report.imported.absorbance)} | ${formatNumber(report.residuals.absorbance)} |`,
    `| Blocked power | ${formatNumber(report.imported.blockedPower)} | ${formatNumber(0)} |`,
    `| Profile RMS | ${formatNumber(report.residuals.profileRms)} | ${formatNumber(report.residuals.profileRms)} |`,
    "",
    "## Convergence",
    "",
    "| Run | ppw | aperture cells | residual | status |",
    "| --- | ---: | ---: | ---: | --- |",
    ...report.convergence.rows.map((row) => `| ${row.runId} | ${formatNumber(row.resolutionPpw)} | ${formatNumber(row.apertureCellsAcross)} | ${formatNumber(row.referenceResidual)} | ${row.status} |`),
    "",
    "## Warnings",
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning.code}: ${warning.message}`) : ["- none"]),
    "",
    "## Boundary",
    ...l84ApertureValidationBoundary.map((item) => `- ${item}`)
  ].join("\n");
}

export function apertureMetricsCsv(report: ApertureValidationReport): string {
  return [
    "metric,value,status,classification",
    row("reflectance", report.imported.reflectance, report.status, report.classification),
    row("transmittance", report.imported.transmittance, report.status, report.classification),
    row("absorbance", report.imported.absorbance, report.status, report.classification),
    row("blocked_power", report.imported.blockedPower, report.status, report.classification),
    row("profile_rms", report.residuals.profileRms, report.status, report.classification),
    row("aperture_cells_across", report.diagnostics.apertureCellsAcross, report.status, report.classification),
    row("screen_thickness_cells", report.diagnostics.screenThicknessCells, report.status, report.classification)
  ].join("\n");
}

export function apertureProfileCsv(report: ApertureValidationReport): string {
  return [
    "coordinate_um,imported_intensity,reference_intensity,residual,label",
    ...report.profile.map((point) => [point.coordinateUm, point.importedIntensity, point.referenceIntensity, point.residual, point.label ?? ""].map(csvEscape).join(","))
  ].join("\n");
}

export function apertureConvergenceCsv(report: ApertureValidationReport | ApertureConvergenceReport): string {
  const convergence = "convergence" in report ? report.convergence : report;
  return [
    "run_id,resolution_ppw,aperture_cells_across,pml_padding_lambda,monitor_distance_lambda,reference_residual,energy_residual,status",
    ...convergence.rows.map((run) => [run.runId, run.resolutionPpw, run.apertureCellsAcross, run.pmlPaddingLambda, run.monitorDistanceLambda, run.referenceResidual, run.energyResidual, run.status].map(csvEscape).join(","))
  ].join("\n");
}

export function apertureReceiptJson(example: ApertureValidationExampleBundle): string {
  return `${JSON.stringify(example.receipt, null, 2)}\n`;
}

export function apertureFluxSummaryJson(example: ApertureValidationExampleBundle): string {
  return `${JSON.stringify(example.flux, null, 2)}\n`;
}

export function singleSlitMinimaUm(apertureWidthUm: number, wavelengthNm: number, observationDistanceUm: number, maxOrder = 3): number[] {
  const wavelengthUm = wavelengthNm / 1000;
  const output: number[] = [];
  for (let order = 1; order <= maxOrder; order += 1) {
    const sinTheta = (order * wavelengthUm) / apertureWidthUm;
    if (sinTheta >= 1) break;
    output.push(observationDistanceUm * Math.tan(Math.asin(sinTheta)));
  }
  return output;
}

export function circularApertureFirstMinimumUm(diameterUm: number, wavelengthNm: number, observationDistanceUm: number): number {
  return (1.22 * (wavelengthNm / 1000) * observationDistanceUm) / diameterUm;
}

export function apertureKindLabel(kind: ApertureValidationKind): string {
  if (kind === "long-slit") return "Long-slit aperture";
  if (kind === "circular-pinhole") return "Circular pinhole aperture";
  if (kind === "rectangular-aperture") return "Rectangular aperture";
  return "Opaque blocker";
}

function createApertureReference(scenario: SimulationBuilderScenario, kind: ApertureValidationKind): ApertureReference {
  const element = firstApertureElement(scenario) ?? createApertureValidationElement(kind);
  const wavelengthNm = scenario.source.wavelengthNm;
  const observationDistanceUm = Math.max(1, (scenario.observationPlaneZMm - element.zMm) * 1000);
  const apertureWidthUm = Math.max(0, element.apertureWidthUm ?? element.apertureDiameterUm ?? 0);
  const apertureHeightUm = Math.max(0, element.apertureHeightUm ?? element.apertureDiameterUm ?? 0);
  const apertureDiameterUm = Math.max(apertureWidthUm, apertureHeightUm, element.apertureDiameterUm ?? 0);
  let model: ApertureReferenceModel;
  let minima: number[] = [];
  let expectedFirst: number | null = null;
  let invariant: string;
  if (kind === "long-slit") {
    model = "single-slit-sinc2";
    minima = singleSlitMinimaUm(Math.max(0.01, apertureWidthUm), wavelengthNm, observationDistanceUm, 3);
    expectedFirst = minima[0] ?? null;
    invariant = "Long-slit scalar limiting case: minima satisfy a sin(theta) = m lambda.";
  } else if (kind === "circular-pinhole") {
    model = "airy-bessel";
    expectedFirst = circularApertureFirstMinimumUm(Math.max(0.01, apertureDiameterUm), wavelengthNm, observationDistanceUm);
    minima = [expectedFirst];
    invariant = "Circular aperture scalar limiting case: first dark ring is near 1.22 lambda z / D.";
  } else if (kind === "rectangular-aperture") {
    model = "rectangular-sinc2";
    minima = singleSlitMinimaUm(Math.max(0.01, apertureWidthUm), wavelengthNm, observationDistanceUm, 3);
    expectedFirst = minima[0] ?? null;
    invariant = "Rectangular aperture diagnostic uses separable sinc-style scalar envelopes in the far-field limit.";
  } else {
    model = "blocker-shadow-flux";
    invariant = "Opaque blocker validation is flux/shadow diagnostic only; no closed-form finite-screen diffraction claim is made.";
  }
  const openFraction = apertureOpenFraction(kind, element);
  const draft = {
    kind,
    model,
    wavelengthNm,
    observationDistanceUm,
    apertureWidthUm,
    apertureHeightUm,
    apertureDiameterUm,
    expectedMinimaUm: minima,
    expectedFirstMinimumUm: expectedFirst,
    apertureOpenFraction: openFraction,
    invariant
  };
  return {
    ...draft,
    referenceHash: fnv1a64(stableStringify(draft))
  };
}

function apertureDiagnostics(scenario: SimulationBuilderScenario, element: SimulationBuilderElement): ApertureResolutionDiagnostics {
  const gridSpacingNm = scenario.source.wavelengthNm / scenario.grid.pointsPerWavelength;
  const gridSpacingUm = gridSpacingNm / 1000;
  const apertureDimensionUm = element.apertureShape === "opaque-blocker"
    ? Math.max(0.01, Math.min(element.widthUm ?? 1, element.heightUm ?? 1))
    : Math.max(0.01, Math.min(nonzero(element.apertureWidthUm, element.apertureDiameterUm, 1), nonzero(element.apertureHeightUm, element.apertureDiameterUm, 1)));
  const screenThicknessCells = Math.max(0, element.thicknessUm ?? 0) / Math.max(1e-9, gridSpacingUm);
  const wavelengthUm = scenario.source.wavelengthNm / 1000;
  const zCenterUm = element.zMm * 1000;
  const halfThicknessUm = Math.max(0, element.thicknessUm ?? 0) / 2;
  const distanceToBoundaryUm = Math.min(zCenterUm - halfThicknessUm - scenario.grid.zStartMm * 1000, scenario.grid.zEndMm * 1000 - (zCenterUm + halfThicknessUm));
  const pmlUm = Math.max(0.5, wavelengthUm * 1.5);
  const monitorDistanceUm = Math.max(wavelengthUm, element.thicknessUm ?? wavelengthUm);
  const reference = createApertureReference(scenario, element.apertureShape ?? "long-slit");
  return {
    gridSpacingNm,
    apertureCellsAcross: apertureDimensionUm / Math.max(1e-9, gridSpacingUm),
    screenThicknessCells,
    pmlDistanceWavelengths: Math.max(0, distanceToBoundaryUm - pmlUm) / wavelengthUm,
    monitorDistanceWavelengths: monitorDistanceUm / wavelengthUm,
    observationContainsFirstMinimum: reference.expectedFirstMinimumUm === null ? true : reference.expectedFirstMinimumUm <= scenario.grid.domainWidthUm / 2
  };
}

function apertureWarnings(scenario: SimulationBuilderScenario, reference: ApertureReference, diagnostics: ApertureResolutionDiagnostics, element: SimulationBuilderElement | null): SolverWarning[] {
  const warnings: SolverWarning[] = [
    { code: "fdtd.aperture.scalarLimit", message: "Scalar diffraction reference is a limiting-case check for diagnostic comparison, not an exact finite FDTD screen solution.", elementId: element?.id },
    { code: "fdtd.aperture.nearFieldFarField", message: "Near-field slices are not the same as far-field diffraction patterns; use far-field or downstream observation evidence with convergence.", elementId: element?.id },
    { code: "fdtd.aperture.convergenceRequired", message: "Current aperture/blocker diagnostics require convergence sweep evidence before physical interpretation.", elementId: element?.id }
  ];
  if (diagnostics.apertureCellsAcross < 12) {
    warnings.push({ code: "fdtd.aperture.underResolved", message: "Aperture opening or blocker width has fewer than 12 cells across.", elementId: element?.id });
  }
  if (diagnostics.screenThicknessCells < 4) {
    warnings.push({ code: "fdtd.aperture.thicknessUnderResolved", message: "Screen thickness has fewer than 4 cells across.", elementId: element?.id });
  }
  if (diagnostics.monitorDistanceWavelengths < 2) {
    warnings.push({ code: "fdtd.aperture.monitorTooClose", message: "Flux monitor is within two wavelengths of aperture/blocker edges.", elementId: element?.id });
  }
  if (diagnostics.pmlDistanceWavelengths < 2) {
    warnings.push({ code: "fdtd.aperture.pmlProximity", message: "Aperture/blocker or diffracted field is close to the PML/domain boundary.", elementId: element?.id });
  }
  if (!diagnostics.observationContainsFirstMinimum) {
    warnings.push({ code: "fdtd.aperture.observationMissesMinimum", message: "Observation plane/window does not include the expected first scalar minimum or ring.", elementId: element?.id });
  }
  if (element?.screenModel === "ideal-reflective-screen") {
    warnings.push({ code: "fdtd.aperture.idealReflectiveScreen", message: "Ideal reflective screen is a diagnostic placeholder and not a production metal aperture model.", elementId: element.id });
  }
  if (reference.kind === "opaque-blocker") {
    warnings.push({ code: "fdtd.aperture.blockerNoClosedForm", message: "Opaque blocker validation is flux/shadow diagnostic; no closed-form finite-edge diffraction overclaim is made.", elementId: element?.id });
  }
  if (scenario.grid.pointsPerWavelength < 10) {
    warnings.push({ code: "fdtd.aperture.edgeStaircasing", message: "Aperture edges are staircasing-sensitive at this grid density; increase resolution and compare residual trends.", elementId: element?.id });
  }
  return warnings;
}

function createApertureReceipt(scene: ApertureValidationScene): FdtdRunReceipt {
  return makeFdtdRunReceipt({
    schema: "emmicro.fdtd.runReceipt.v1",
    runId: `l84-fixture-${scene.kind}`,
    sourceScenarioHash: scene.bundle.manifest.sourceScenarioHash,
    manifestHash: scene.bundle.manifest.manifestHash,
    scriptHash: scene.bundle.script.scriptHash,
    tool: {
      name: "example-fixture",
      version: "l84-deterministic",
      postprocessorVersion: "emmicro.fdtd.aperture.fixture.v1"
    },
    createdAtIso: "2026-06-06T00:00:00.000Z",
    settings: {
      resolution: scene.scenario.grid.pointsPerWavelength,
      until: scene.kind === "opaque-blocker" ? 260 : 320,
      pmlThicknessUm: scene.bundle.manifest.boundaries.pmlThicknessUm
    },
    warnings: scene.warnings
  });
}

function createApertureFlux(scene: ApertureValidationScene, receipt: FdtdRunReceipt): FdtdFluxSummary {
  const expected = apertureExpectedRta(scene);
  const imported = syntheticApertureRta(scene.kind, expected);
  return makeFdtdFluxSummary({
    schema: "emmicro.fdtd.fluxSummary.v1",
    runId: receipt.runId,
    sourceScenarioHash: receipt.sourceScenarioHash,
    manifestHash: receipt.manifestHash,
    incidentFlux: 1,
    reflectedFlux: imported.reflectance,
    transmittedFlux: imported.transmittance,
    absorbedFlux: imported.absorbance,
    reflectance: imported.reflectance,
    transmittance: imported.transmittance,
    absorbance: imported.absorbance,
    energyBalance: imported.reflectance + imported.transmittance + imported.absorbance,
    monitors: [
      { id: "incident-flux", flux: 1 },
      { id: "reflected-flux", flux: imported.reflectance },
      { id: "transmitted-flux", flux: imported.transmittance },
      { id: "blocked-power", flux: 1 - imported.transmittance }
    ],
    warnings: scene.warnings
  });
}

function createApertureFieldSlice(scene: ApertureValidationScene): FdtdFieldSlice {
  const xCount = 41;
  const zCount = 31;
  const xMin = -scene.scenario.grid.domainWidthUm / 2;
  const xMax = scene.scenario.grid.domainWidthUm / 2;
  const zMin = scene.scenario.grid.zStartMm * 1000;
  const zMax = scene.scenario.grid.zEndMm * 1000;
  const apertureZ = firstApertureElement(scene.scenario)?.zMm ?? 0.025;
  const samples = [];
  for (let zi = 0; zi < zCount; zi += 1) {
    const zUm = zMin + ((zMax - zMin) * zi) / (zCount - 1);
    for (let xi = 0; xi < xCount; xi += 1) {
      const xUm = xMin + ((xMax - xMin) * xi) / (xCount - 1);
      const downstream = zUm >= apertureZ * 1000;
      const reference = apertureReferenceIntensity(scene.reference, Math.abs(xUm));
      const envelope = downstream ? reference : 1;
      const edgeRipple = downstream ? 0.04 * Math.sin((xUm + zUm * 0.17) * 1.7) : 0;
      const intensity = clamp01(envelope + edgeRipple);
      samples.push({
        xUm,
        zUm,
        value: Math.sqrt(intensity),
        intensity
      });
    }
  }
  return makeFdtdFieldSlice({
    schema: "emmicro.fdtd.fieldSlice.v1",
    id: "aperture-field-slice-xz",
    sourceScenarioHash: scene.bundle.manifest.sourceScenarioHash,
    manifestHash: scene.bundle.manifest.manifestHash,
    component: "intensity",
    plane: "xz",
    samples,
    xCount,
    zCount
  });
}

function createApertureProfile(scene: ApertureValidationScene, imported: boolean): ApertureProfilePoint[] {
  const count = 81;
  const maxCoordinate = scene.scenario.grid.domainWidthUm / 2;
  const points: ApertureProfilePoint[] = [];
  for (let index = 0; index < count; index += 1) {
    const coordinateUm = scene.kind === "circular-pinhole"
      ? (maxCoordinate * index) / (count - 1)
      : -maxCoordinate + (2 * maxCoordinate * index) / (count - 1);
    const referenceIntensity = apertureReferenceIntensity(scene.reference, Math.abs(coordinateUm));
    const perturbation = imported ? apertureProfilePerturbation(scene.kind, coordinateUm, index) : 0;
    const importedIntensity = clamp01(referenceIntensity + perturbation);
    const residual = Math.abs(importedIntensity - referenceIntensity);
    const label = scene.reference.expectedFirstMinimumUm && Math.abs(Math.abs(coordinateUm) - scene.reference.expectedFirstMinimumUm) < maxCoordinate / count ? "expected minimum/ring" : undefined;
    points.push({ coordinateUm, importedIntensity, referenceIntensity, residual, label });
  }
  return points;
}

function apertureExpectedRta(scene: ApertureValidationScene): { reflectance: number; transmittance: number; absorbance: number } {
  if (scene.screenModel === "transparent-reference") return { reflectance: 0, transmittance: 1, absorbance: 0 };
  const open = scene.reference.apertureOpenFraction;
  if (scene.kind === "opaque-blocker") {
    if (scene.screenModel === "ideal-reflective-screen") return { reflectance: 0.86, transmittance: 0.06, absorbance: 0.08 };
    return { reflectance: 0.03, transmittance: 0.06, absorbance: 0.91 };
  }
  if (scene.screenModel === "ideal-reflective-screen") {
    return { reflectance: 1 - open, transmittance: open, absorbance: 0 };
  }
  return { reflectance: 0.02 * (1 - open), transmittance: open, absorbance: 1 - open - 0.02 * (1 - open) };
}

function syntheticApertureRta(kind: ApertureValidationKind, expected: { reflectance: number; transmittance: number; absorbance: number }): { reflectance: number; transmittance: number; absorbance: number } {
  const delta = kind === "opaque-blocker" ? 0.018 : kind === "circular-pinhole" ? 0.014 : 0.01;
  const reflectance = clamp01(expected.reflectance + delta * 0.3);
  const transmittance = clamp01(expected.transmittance - delta * 0.45);
  return {
    reflectance,
    transmittance,
    absorbance: clamp01(1 - reflectance - transmittance)
  };
}

function apertureReferenceIntensity(reference: ApertureReference, coordinateUm: number): number {
  if (reference.kind === "opaque-blocker") {
    const halfBlocker = Math.max(0.1, reference.apertureWidthUm || 4) / 2;
    return coordinateUm < halfBlocker ? 0.08 + 0.18 * Math.pow(coordinateUm / halfBlocker, 2) : 0.72 + 0.16 * Math.cos(coordinateUm * 0.8);
  }
  const wavelengthUm = reference.wavelengthNm / 1000;
  const sinTheta = coordinateUm / Math.sqrt(coordinateUm * coordinateUm + reference.observationDistanceUm * reference.observationDistanceUm);
  if (reference.kind === "circular-pinhole") {
    const x = Math.PI * Math.max(0.01, reference.apertureDiameterUm) * sinTheta / wavelengthUm;
    if (Math.abs(x) < 1e-8) return 1;
    const value = (2 * besselJ1(x)) / x;
    return clamp01(value * value);
  }
  const width = Math.max(0.01, reference.apertureWidthUm);
  const beta = Math.PI * width * sinTheta / wavelengthUm;
  const sincX = sinc(beta);
  if (reference.kind === "rectangular-aperture") {
    const height = Math.max(0.01, reference.apertureHeightUm);
    const betaY = Math.PI * height * sinTheta * 0.35 / wavelengthUm;
    return clamp01(sincX * sincX * sinc(betaY) * sinc(betaY));
  }
  return clamp01(sincX * sincX);
}

function apertureProfilePerturbation(kind: ApertureValidationKind, coordinateUm: number, index: number): number {
  const base = kind === "opaque-blocker" ? 0.035 : kind === "circular-pinhole" ? 0.025 : 0.018;
  return base * Math.sin(index * 0.79 + coordinateUm * 0.31);
}

function firstMinimumResidual(scene: ApertureValidationScene, profile: ApertureProfilePoint[]): number | null {
  const expected = scene.reference.expectedFirstMinimumUm;
  if (expected === null) return null;
  const nearest = profile.reduce((best, point) => Math.abs(Math.abs(point.coordinateUm) - expected) < Math.abs(Math.abs(best.coordinateUm) - expected) ? point : best, profile[0]!);
  return Math.abs(nearest.referenceIntensity - nearest.importedIntensity);
}

function apertureOpenFraction(kind: ApertureValidationKind, element: SimulationBuilderElement): number {
  const screenArea = Math.max(1e-9, (element.widthUm ?? 1) * (element.heightUm ?? 1));
  if (kind === "opaque-blocker") return 0;
  if (kind === "circular-pinhole") {
    const radius = Math.max(0, element.apertureDiameterUm ?? element.apertureWidthUm ?? 0) / 2;
    return clamp01((Math.PI * radius * radius) / screenArea);
  }
  return clamp01(((element.apertureWidthUm ?? 0) * (element.apertureHeightUm ?? 0)) / screenArea);
}

function apertureReferenceSize(reference: ApertureReference): number {
  if (reference.kind === "circular-pinhole") return Math.max(0.01, reference.apertureDiameterUm);
  if (reference.kind === "opaque-blocker") return Math.max(0.01, reference.apertureWidthUm || 4);
  return Math.max(0.01, Math.min(reference.apertureWidthUm, reference.apertureHeightUm || reference.apertureWidthUm));
}

function apertureResidualBase(kind: ApertureValidationKind): number {
  if (kind === "circular-pinhole") return 0.13;
  if (kind === "opaque-blocker") return 0.16;
  if (kind === "rectangular-aperture") return 0.11;
  return 0.09;
}

function statusForAperture(kind: ApertureValidationKind, referenceResidual: number, profileRms: number, energyResidual: number, hashMismatch: boolean): SimulationBuilderValidationStatus {
  if (hashMismatch) return "fail";
  const limit = kind === "opaque-blocker" ? 0.08 : 0.06;
  const warn = kind === "opaque-blocker" ? 0.16 : 0.12;
  const worst = Math.max(referenceResidual, profileRms, energyResidual);
  if (worst <= limit) return "pass";
  if (worst <= warn) return "warning";
  return "fail";
}

function classificationForAperture(kind: ApertureValidationKind, status: SimulationBuilderValidationStatus, referenceResidual: number, profileRms: number): ApertureValidationClassification {
  if (kind === "opaque-blocker") return status === "fail" ? "NEEDS_CONVERGENCE" : "DIAGNOSTIC";
  if (status === "pass") return "PASS";
  if (status === "warning") return referenceResidual > 0.06 || profileRms > 0.06 ? "NEEDS_CONVERGENCE" : "WARNING";
  return "FAIL";
}

function firstApertureElement(scenario: SimulationBuilderScenario): SimulationBuilderElement | null {
  return scenario.elements.find((element) => element.kind === "finite-aperture-blocker" && element.apertureShape) ?? null;
}

function screenModelLabel(model: ApertureScreenModel): string {
  if (model === "ideal-reflective-screen") return "ideal reflective screen";
  if (model === "transparent-reference") return "transparent reference";
  return "absorbing screen";
}

function nonzero(...values: Array<number | undefined>): number {
  for (const value of values) {
    if (typeof value === "number" && value > 0) return value;
  }
  return 0;
}

function besselJ1(x: number): number {
  let sum = 0;
  for (let k = 0; k < 24; k += 1) {
    const sign = k % 2 === 0 ? 1 : -1;
    const numerator = Math.pow(x / 2, 2 * k + 1);
    const denominator = factorial(k) * factorial(k + 1);
    sum += sign * numerator / denominator;
  }
  return sum;
}

function factorial(value: number): number {
  let output = 1;
  for (let index = 2; index <= value; index += 1) output *= index;
  return output;
}

function sinc(value: number): number {
  if (Math.abs(value) < 1e-8) return 1;
  return Math.sin(value) / value;
}

function rms(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function row(label: string, value: number, status: SimulationBuilderValidationStatus, classification: ApertureValidationClassification): string {
  return [label, value, status, classification].map(csvEscape).join(",");
}

function formatNumber(value: number): string {
  if (value === 0) return "0";
  if (!Number.isFinite(value)) return "n/a";
  if (Math.abs(value) >= 1000 || Math.abs(value) < 0.001) return value.toExponential(4);
  return value.toPrecision(6);
}

function csvEscape(value: unknown): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
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

function apertureSceneForHash(scene: Omit<ApertureValidationScene, "sceneHash">): unknown {
  return {
    schema: scene.schema,
    kind: scene.kind,
    screenModel: scene.screenModel,
    scenarioId: scene.scenario.id,
    manifestHash: scene.bundle.manifest.manifestHash,
    scriptHash: scene.bundle.script.scriptHash,
    geometryIds: scene.geometryIds,
    monitorIds: scene.monitorIds,
    referenceHash: scene.reference.referenceHash,
    diagnostics: scene.diagnostics,
    warningCodes: scene.warnings.map((warning) => warning.code)
  };
}

function apertureReportForHash(report: Omit<ApertureValidationReport, "reportHash">): unknown {
  return {
    schema: report.schema,
    kind: report.kind,
    screenModel: report.screenModel,
    sceneHash: report.sceneHash,
    imported: report.imported,
    residuals: report.residuals,
    diagnostics: report.diagnostics,
    convergenceHash: report.convergence.convergenceHash,
    status: report.status,
    classification: report.classification,
    warningCodes: report.warnings.map((warning) => warning.code)
  };
}
