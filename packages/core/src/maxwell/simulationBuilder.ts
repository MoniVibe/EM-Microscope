import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import type { MaxwellMaterialSample } from "./materials";
import { fresnelReflectanceNormal, runPlanarTmm, type PlanarTmmResult } from "./planarTmm";

export type SimulationBuilderStepId = "grid" | "source" | "elements" | "target" | "compute" | "validate";
export type SimulationBuilderStepStatus = "not-set" | "ready" | "warning" | "computed" | "validated" | "unsupported";
export type SimulationBuilderCapabilityStatus = "executable" | "scaffold-only" | "not-implemented";
export type SimulationBuilderSourceType = "plane-wave" | "point-source";
export type SimulationBuilderCoherenceMode = "coherent" | "incoherent" | "partial";
export type SimulationBuilderApertureShape = "long-slit" | "circular-pinhole" | "rectangular-aperture" | "opaque-blocker";
export type SimulationBuilderScreenModel = "absorbing-screen" | "ideal-reflective-screen" | "transparent-reference";
export type SimulationBuilderElementKind =
  | "circular-aperture"
  | "ideal-lens"
  | "material-interface"
  | "material-slab"
  | "mirror-surface"
  | "absorbing-slab"
  | "finite-transparent-block"
  | "finite-absorbing-block"
  | "finite-reflective-plate"
  | "finite-aperture-blocker"
  | "tilted-interface-wedge"
  | "curved-material-lens"
  | "finite-metal-aperture";
export type SimulationBuilderTargetKind = "transparent-dielectric" | "mirror" | "absorbing-slab";
export type SimulationBuilderValidationStatus = "pass" | "warning" | "fail";
export type SimulationBuilderCustomMonitorKind = "field" | "flux" | "observation";
export type SimulationBuilderCustomMonitorSolverRoute = "scalar-chain" | "external-fdtd";

export type SimulationBuilderGrid = {
  units: "mm" | "um" | "nm";
  domainWidthUm: number;
  domainHeightUm: number;
  zStartMm: number;
  zEndMm: number;
  pointsPerWavelength: number;
};

export type SimulationBuilderSource = {
  type: SimulationBuilderSourceType;
  label: string;
  wavelengthNm: number;
  xUm: number;
  yUm: number;
  zMm: number;
  direction: "+z" | "-z";
  coherence: SimulationBuilderCoherenceMode;
};

export type SimulationBuilderElement = {
  id: string;
  kind: SimulationBuilderElementKind;
  label: string;
  xUm?: number;
  yUm?: number;
  zMm: number;
  widthUm?: number;
  heightUm?: number;
  apertureDiameterUm?: number;
  apertureWidthUm?: number;
  apertureHeightUm?: number;
  apertureShape?: SimulationBuilderApertureShape;
  screenModel?: SimulationBuilderScreenModel;
  focalLengthMm?: number;
  thicknessUm?: number;
  orientationDeg?: number;
  materialIndex?: number;
  extinctionCoefficient?: number;
  absorptionCoefficientPerM?: number;
  materialLabel: string;
  model: string;
  status: SimulationBuilderCapabilityStatus;
  validation: string;
};

export type SimulationBuilderCustomMonitor = {
  id: string;
  label: string;
  kind: SimulationBuilderCustomMonitorKind;
  zMm: number;
  xUm: number;
  yUm: number;
  widthUm: number;
  heightUm: number;
  sourceElementId?: string;
  solverRoute: SimulationBuilderCustomMonitorSolverRoute;
};

export type SimulationBuilderTarget = {
  kind: SimulationBuilderTargetKind;
  label: string;
  zMm: number;
  incidentIndex: number;
  substrateIndex: number;
  extinctionCoefficient: number;
  absorptionCoefficientPerM: number;
  thicknessUm: number;
};

export type SimulationBuilderScenario = {
  schema: "emmicro.simulationBuilder.v1";
  id: string;
  label: string;
  grid: SimulationBuilderGrid;
  source: SimulationBuilderSource;
  elements: SimulationBuilderElement[];
  customMonitors?: SimulationBuilderCustomMonitor[];
  target: SimulationBuilderTarget;
  observationPlaneZMm: number;
  boundary: string[];
};

export type SimulationBuilderGridSummary = {
  wavelengthNm: number;
  dxNm: number;
  dyNm: number;
  dzNm: number;
  samplesX: number;
  samplesY: number;
  samplesZ: number;
  estimatedVolumetricSamples: number;
  warnings: SolverWarning[];
};

export type SimulationBuilderAxisNode = {
  id: string;
  label: string;
  kind: "source" | "element" | "target" | "observation";
  zMm: number;
  status: SimulationBuilderCapabilityStatus | "computed";
  detail: string;
};

export type SimulationBuilderSurfaceValidation = {
  kind: SimulationBuilderTargetKind;
  label: string;
  solverPath: "planar-tmm-fresnel" | "analytic-ideal-mirror" | "beer-lambert";
  computed: { reflectance: number; transmittance: number; absorbance: number };
  expected: { reflectance: number; transmittance: number; absorbance: number };
  residuals: { reflectance: number; transmittance: number; absorbance: number; beerLambert?: number };
  energyBalance: number;
  energyBalanceResidual: number;
  status: SimulationBuilderValidationStatus;
  analyticReference: string;
  warnings: SolverWarning[];
  tmm?: Pick<PlanarTmmResult, "reflectance" | "transmittance" | "absorbance" | "energyBalanceError" | "resultHash">;
};

export type SimulationBuilderResult = {
  schema: "emmicro.simulationBuilder.result.v1";
  scenarioId: string;
  label: string;
  stepStatuses: Record<SimulationBuilderStepId, SimulationBuilderStepStatus>;
  grid: SimulationBuilderGridSummary;
  orderedElements: SimulationBuilderElement[];
  axis: SimulationBuilderAxisNode[];
  validation: SimulationBuilderSurfaceValidation;
  warnings: SolverWarning[];
  limitations: string[];
  capabilitySummary: Array<{ id: string; label: string; status: SimulationBuilderCapabilityStatus; evidence: string }>;
  resultHash: string;
};

export type SimulationBuilderValidationInput = {
  grid?: SimulationBuilderGrid | null;
  source?: SimulationBuilderSource | null;
  elements?: SimulationBuilderElement[];
  target?: SimulationBuilderTarget | null;
};

export const l80SimulationBuilderBoundary = [
  "Limited ordered optical-bench validation over grid/source/elements/target/compute/validate plus L8.5 multi-element scene orchestration, L8.6 diagnostic process/tolerance variation, and L8.7 robust-design guidance only.",
  "L8.5.1 element inspector editing changes placement, dimensions, material metadata, custom monitors, and workflow state only; it does not add new physics.",
  "L8.6 process/tolerance variation runs deterministic one-at-a-time, grid, seeded sample, and external FDTD sweep receipt workflows over the current editable scene; it is not certified tolerancing or auto redesign.",
  "L8.7 robust design recommendations compare recentering, tolerance-budget, and candidate-grid actions over existing L8.6 evidence; they are not automatic final design approval or full inverse design.",
  "L8.5 scalar chain preview is limited to ideal plane elements and observation planes.",
  "L8.5 finite geometry routes to external FDTD export/import evidence with receipts; the browser does not execute FDTD.",
  "Transparent, reflective, and absorbing planar surface/slab cases are executable.",
  "Apertures and ideal lenses are placement-aware scalar/ideal elements in this builder, not material Maxwell geometry solves.",
  "No arbitrary 3D material geometry is executable in-app.",
  "No FDTD/FEM/BEM/RCWA execution is performed in the browser.",
  "No real curved material lens solve, finite-thickness metal aperture Maxwell solve, sensor-stack EM absorption, full inverse optimization, automatic final design approval, digital twin, certified tolerancing, or manufacturing certification is claimed."
] as const;

export const l80ReleaseTrail = [
  { milestone: "L6.1", label: "Circular aperture Airy/Bessel validation", runnable: "circular-aperture benchmark" },
  { milestone: "L6.2", label: "Independent numerical propagation vs analytic Airy", runnable: "numeric-vs-analytic residual report" },
  { milestone: "L6.3", label: "Single-slit and double-slit validation", runnable: "slit/order-spacing benchmark" },
  { milestone: "L6.5", label: "Coherence demonstrator", runnable: "coherent/partial/incoherent comparison" },
  { milestone: "L6.8", label: "Camera sensor-lite", runnable: "deterministic detector post-process" },
  { milestone: "L6.9", label: "Camera calibration", runnable: "photon-transfer diagnostic fit" },
  { milestone: "L7.0", label: "Slanted-edge MTF", runnable: "SFR/MTF workbench" },
  { milestone: "L7.2", label: "Geometry/distortion", runnable: "dot-grid fit report" },
  { milestone: "L7.3", label: "Measured target detection", runnable: "ROI-limited detection confidence report" },
  { milestone: "L7.6", label: "External detector bridge", runnable: "detector JSON/CSV receipt validation" },
  { milestone: "L8.0", label: "Sequential Simulation Builder", runnable: "grid/source/elements/material validation report" },
  { milestone: "L8.1", label: "External FDTD field maps", runnable: "manifest/script export plus imported flux/field validation" },
  { milestone: "L8.2", label: "FDTD benchmark convergence suite", runnable: "sweep-plan export plus imported convergence/PML diagnostics" },
  { milestone: "L8.3", label: "Finite surface geometry starter set", runnable: "placed transparent/absorbing/reflective/aperture/wedge external FDTD fixtures" },
  { milestone: "L8.4", label: "Aperture/blocker edge-diffraction validation", runnable: "long-slit/circular/rectangular/blocker scalar reference and external FDTD fixture diagnostics" },
  { milestone: "L8.5", label: "Multi-element optical bench propagation chain", runnable: "ordered multi-element scene graph, solver plan, scalar monitor stack, and external FDTD chain fixture" },
  { milestone: "L8.5.1", label: "Element inspector + direct editing", runnable: "numeric source-of-truth editing, optional diagram drag, custom monitors, warnings, and undo/redo" },
  { milestone: "L8.6", label: "Process / tolerance variation runner", runnable: "deterministic tolerance studies, sensitivity ranking, pass/fail tables, and external FDTD sweep receipts" },
  { milestone: "L8.7", label: "Robust Design Advisor", runnable: "ranked design actions, candidate comparison, tolerance budget, and external FDTD candidate sweep receipts" }
] as const;

export function defaultSimulationBuilderScenario(): SimulationBuilderScenario {
  return {
    schema: "emmicro.simulationBuilder.v1",
    id: "l80-sequential-optical-bench",
    label: "L8.0 Sequential Optical Bench + Surface Interaction Validation",
    grid: {
      units: "um",
      domainWidthUm: 10,
      domainHeightUm: 10,
      zStartMm: 0,
      zEndMm: 25,
      pointsPerWavelength: 10
    },
    source: {
      type: "plane-wave",
      label: "500 nm coherent plane wave",
      wavelengthNm: 500,
      xUm: 0,
      yUm: 0,
      zMm: 0,
      direction: "+z",
      coherence: "coherent"
    },
    elements: [
      createSimulationBuilderElement("circular-aperture", 10, "Circular aperture"),
      createSimulationBuilderElement("material-slab", 20, "Planar glass slab")
    ],
    customMonitors: [],
    target: {
      kind: "transparent-dielectric",
      label: "Air to glass transparent dielectric interface",
      zMm: 22,
      incidentIndex: 1,
      substrateIndex: 1.5,
      extinctionCoefficient: 0,
      absorptionCoefficientPerM: 4000,
      thicknessUm: 50
    },
    observationPlaneZMm: 25,
    boundary: [...l80SimulationBuilderBoundary]
  };
}

export function createSimulationBuilderElement(
  kind: SimulationBuilderElementKind,
  zMm: number,
  label = simulationElementLabel(kind)
): SimulationBuilderElement {
  const status = elementStatus(kind);
  return {
    id: `${kind}-${Math.round(zMm * 1000)}`,
    kind,
    label,
    zMm,
    xUm: finiteGeometryKind(kind) ? 0 : undefined,
    yUm: finiteGeometryKind(kind) ? 0 : undefined,
    widthUm: finiteGeometryKind(kind) ? defaultFiniteGeometryWidthUm(kind) : undefined,
    heightUm: finiteGeometryKind(kind) ? defaultFiniteGeometryHeightUm(kind) : undefined,
    apertureDiameterUm: kind === "circular-aperture" ? 1 : undefined,
    apertureWidthUm: kind === "finite-aperture-blocker" ? 4 : undefined,
    apertureHeightUm: kind === "finite-aperture-blocker" ? 6 : undefined,
    apertureShape: kind === "finite-aperture-blocker" ? "rectangular-aperture" : undefined,
    screenModel: kind === "finite-aperture-blocker" ? "absorbing-screen" : undefined,
    focalLengthMm: kind === "ideal-lens" ? 20 : undefined,
    thicknessUm: kind === "material-slab" || kind === "absorbing-slab" ? 1000 : finiteGeometryKind(kind) ? defaultFiniteGeometryThicknessUm(kind) : undefined,
    orientationDeg: kind === "tilted-interface-wedge" ? 12 : undefined,
    materialIndex: kind === "finite-transparent-block" || kind === "tilted-interface-wedge" ? 1.5 : kind === "finite-absorbing-block" ? 1.2 : undefined,
    extinctionCoefficient: kind === "finite-absorbing-block" ? 0.02 : undefined,
    absorptionCoefficientPerM: kind === "finite-absorbing-block" ? 5000 : undefined,
    materialLabel: elementMaterialLabel(kind),
    model: elementModel(kind),
    status,
    validation: elementValidation(kind, status)
  };
}

export function addSimulationBuilderElement(scenario: SimulationBuilderScenario, element: SimulationBuilderElement): SimulationBuilderScenario {
  return {
    ...scenario,
    elements: orderedSimulationBuilderElements([...scenario.elements, element])
  };
}

export function orderedSimulationBuilderElements(elements: SimulationBuilderElement[]): SimulationBuilderElement[] {
  return [...elements].sort((a, b) => (a.zMm === b.zMm ? a.id.localeCompare(b.id) : a.zMm - b.zMm));
}

export function orderedSimulationBuilderCustomMonitors(monitors: SimulationBuilderCustomMonitor[] = []): SimulationBuilderCustomMonitor[] {
  return [...monitors].sort((a, b) => (a.zMm === b.zMm ? a.id.localeCompare(b.id) : a.zMm - b.zMm));
}

export function validateSimulationBuilderScenario(input: SimulationBuilderValidationInput): { valid: boolean; errors: string[]; warnings: SolverWarning[] } {
  const errors: string[] = [];
  const warnings: SolverWarning[] = [];
  if (!input.grid) {
    errors.push("grid must be defined before compute");
  } else {
    if (!Number.isFinite(input.grid.pointsPerWavelength) || input.grid.pointsPerWavelength <= 0) errors.push("grid points per wavelength must be positive");
    if (!Number.isFinite(input.grid.domainWidthUm) || input.grid.domainWidthUm <= 0) errors.push("grid domain width must be positive");
    if (!Number.isFinite(input.grid.domainHeightUm) || input.grid.domainHeightUm <= 0) errors.push("grid domain height must be positive");
    if (!Number.isFinite(input.grid.zStartMm) || !Number.isFinite(input.grid.zEndMm) || input.grid.zEndMm <= input.grid.zStartMm) errors.push("grid z range must be increasing");
    if (input.grid.pointsPerWavelength < 8) {
      warnings.push({
        code: "simulationBuilder.grid.underResolved",
        message: "Grid density is below 8 points per wavelength; validation previews may be under-resolved."
      });
    }
  }
  if (!input.source) {
    errors.push("source must be defined before compute");
  } else {
    if (!Number.isFinite(input.source.wavelengthNm) || input.source.wavelengthNm <= 0) errors.push("source wavelength must be positive");
  }
  if (!input.target) errors.push("target/material surface must be defined before compute");
  for (const element of input.elements ?? []) {
    if (!Number.isFinite(element.zMm)) errors.push(`${element.label} z position must be finite`);
    if (element.status !== "executable") {
      warnings.push({
        code: "simulationBuilder.element.unsupported",
        message: `${element.label} is ${element.status}; it is shown for placement clarity but is not part of the executable validation solve.`,
        elementId: element.id
      });
    }
  }
  return { valid: errors.length === 0, errors, warnings: uniqueWarnings(warnings) };
}

export function summarizeSimulationBuilderGrid(grid: SimulationBuilderGrid, source: SimulationBuilderSource): SimulationBuilderGridSummary {
  const dxNm = source.wavelengthNm / grid.pointsPerWavelength;
  const samplesX = Math.max(1, Math.ceil((grid.domainWidthUm * 1000) / dxNm));
  const samplesY = Math.max(1, Math.ceil((grid.domainHeightUm * 1000) / dxNm));
  const samplesZ = Math.max(1, Math.ceil(((grid.zEndMm - grid.zStartMm) * 1_000_000) / dxNm));
  const estimatedVolumetricSamples = samplesX * samplesY * samplesZ;
  const warnings: SolverWarning[] = [];
  if (grid.pointsPerWavelength < 8) {
    warnings.push({
      code: "simulationBuilder.grid.underResolved",
      message: "Grid density is below 8 points per wavelength; increase points per wavelength before trusting residuals."
    });
  }
  if (estimatedVolumetricSamples > 100_000_000) {
    warnings.push({
      code: "simulationBuilder.grid.volumetricNotExecutable",
      message: "Estimated volumetric sample count is large; L8.0 reports sampled validation metrics and does not execute a full 3D volumetric Maxwell solve in-app."
    });
  }
  return {
    wavelengthNm: source.wavelengthNm,
    dxNm,
    dyNm: dxNm,
    dzNm: dxNm,
    samplesX,
    samplesY,
    samplesZ,
    estimatedVolumetricSamples,
    warnings
  };
}

export function simulationBuilderAxisNodes(scenario: SimulationBuilderScenario): SimulationBuilderAxisNode[] {
  const nodes: SimulationBuilderAxisNode[] = [
    {
      id: "source",
      label: scenario.source.label,
      kind: "source",
      zMm: scenario.source.zMm,
      status: "executable",
      detail: `${scenario.source.type}, ${scenario.source.wavelengthNm} nm, ${scenario.source.direction}`
    },
    ...orderedSimulationBuilderElements(scenario.elements).map((element) => ({
      id: element.id,
      label: element.label,
      kind: "element" as const,
      zMm: element.zMm,
      status: element.status,
      detail: `${element.model}; ${element.materialLabel}`
    })),
    {
      id: "target",
      label: scenario.target.label,
      kind: "target",
      zMm: scenario.target.zMm,
      status: "executable",
      detail: targetKindLabel(scenario.target.kind)
    },
    {
      id: "observation",
      label: "Observation plane",
      kind: "observation",
      zMm: scenario.observationPlaneZMm,
      status: "computed",
      detail: "sampled field/intensity preview plane"
    }
  ];
  return nodes.sort((a, b) => (a.zMm === b.zMm ? a.id.localeCompare(b.id) : a.zMm - b.zMm));
}

export function runSimulationBuilderScenario(scenario: SimulationBuilderScenario): SimulationBuilderResult {
  const validation = validateSimulationBuilderScenario(scenario);
  if (!validation.valid) throw new Error(`Simulation Builder scenario is incomplete: ${validation.errors.join("; ")}`);
  const grid = summarizeSimulationBuilderGrid(scenario.grid, scenario.source);
  const orderedElements = orderedSimulationBuilderElements(scenario.elements);
  const surface = computeSimulationBuilderSurfaceValidation(scenario.target, scenario.source.wavelengthNm);
  const warnings = uniqueWarnings([...validation.warnings, ...grid.warnings, ...surface.warnings]);
  const stepStatuses: Record<SimulationBuilderStepId, SimulationBuilderStepStatus> = {
    grid: grid.warnings.length ? "warning" : "ready",
    source: "ready",
    elements: orderedElements.some((element) => element.status !== "executable") ? "unsupported" : "ready",
    target: "ready",
    compute: surface.status === "fail" ? "warning" : "computed",
    validate: surface.status === "pass" ? "validated" : "warning"
  };
  const capabilitySummary = simulationBuilderCapabilitySummary(orderedElements);
  const resultHash = fnv1a64(
    stableStringify({
      schema: "emmicro.simulationBuilder.result.v1",
      scenario: scenarioForHash(scenario),
      validation: surfaceForHash(surface),
      warningCodes: warnings.map((warning) => warning.code)
    })
  );
  return {
    schema: "emmicro.simulationBuilder.result.v1",
    scenarioId: scenario.id,
    label: scenario.label,
    stepStatuses,
    grid,
    orderedElements,
    axis: simulationBuilderAxisNodes(scenario),
    validation: surface,
    warnings,
    limitations: [...l80SimulationBuilderBoundary],
    capabilitySummary,
    resultHash
  };
}

export function computeSimulationBuilderSurfaceValidation(target: SimulationBuilderTarget, wavelengthNm: number): SimulationBuilderSurfaceValidation {
  if (target.kind === "transparent-dielectric") return transparentDielectricValidation(target, wavelengthNm);
  if (target.kind === "mirror") return mirrorValidation(target);
  return absorbingSlabValidation(target);
}

export function beerLambertTransmission(absorptionCoefficientM: number, thicknessM: number): number {
  if (absorptionCoefficientM < 0 || !Number.isFinite(absorptionCoefficientM)) throw new Error("absorption coefficient must be finite and non-negative");
  if (thicknessM < 0 || !Number.isFinite(thicknessM)) throw new Error("absorbing slab thickness must be finite and non-negative");
  return Math.exp(-absorptionCoefficientM * thicknessM);
}

export function simulationBuilderScenarioJson(scenario: SimulationBuilderScenario): string {
  return `${JSON.stringify(scenario, null, 2)}\n`;
}

export function simulationBuilderValidationReportJson(result: SimulationBuilderResult): string {
  return `${JSON.stringify(result, null, 2)}\n`;
}

export function simulationBuilderValidationMetricsCsv(result: SimulationBuilderResult): string {
  return [
    "metric,computed,expected,residual,status",
    csvRow(["reflectance", result.validation.computed.reflectance, result.validation.expected.reflectance, result.validation.residuals.reflectance, result.validation.status]),
    csvRow(["transmittance", result.validation.computed.transmittance, result.validation.expected.transmittance, result.validation.residuals.transmittance, result.validation.status]),
    csvRow(["absorbance", result.validation.computed.absorbance, result.validation.expected.absorbance, result.validation.residuals.absorbance, result.validation.status]),
    csvRow(["energy_balance", result.validation.energyBalance, 1, result.validation.energyBalanceResidual, result.validation.status])
  ].join("\n");
}

export function simulationBuilderValidationReportMarkdown(result: SimulationBuilderResult): string {
  return [
    `# ${result.label}`,
    "",
    `Scenario: ${result.scenarioId}`,
    `Result hash: ${result.resultHash}`,
    "",
    "## Ordered Workflow",
    "",
    "| Step | Status |",
    "| --- | --- |",
    ...Object.entries(result.stepStatuses).map(([step, status]) => `| ${step} | ${status} |`),
    "",
    "## Optical Axis",
    "",
    "| Item | z mm | Status | Detail |",
    "| --- | ---: | --- | --- |",
    ...result.axis.map((node) => `| ${node.label} | ${formatNumber(node.zMm)} | ${node.status} | ${node.detail} |`),
    "",
    "## Surface Validation",
    "",
    `Solver path: ${result.validation.solverPath}`,
    `Analytic reference: ${result.validation.analyticReference}`,
    "",
    "| Metric | Computed | Expected | Residual |",
    "| --- | ---: | ---: | ---: |",
    `| R | ${formatNumber(result.validation.computed.reflectance)} | ${formatNumber(result.validation.expected.reflectance)} | ${formatNumber(result.validation.residuals.reflectance)} |`,
    `| T | ${formatNumber(result.validation.computed.transmittance)} | ${formatNumber(result.validation.expected.transmittance)} | ${formatNumber(result.validation.residuals.transmittance)} |`,
    `| A | ${formatNumber(result.validation.computed.absorbance)} | ${formatNumber(result.validation.expected.absorbance)} | ${formatNumber(result.validation.residuals.absorbance)} |`,
    `| R+T+A | ${formatNumber(result.validation.energyBalance)} | 1 | ${formatNumber(result.validation.energyBalanceResidual)} |`,
    "",
    `Status: ${result.validation.status.toUpperCase()}`,
    "",
    "## Boundary",
    "",
    ...result.limitations.map((item) => `- ${item}`)
  ].join("\n");
}

function transparentDielectricValidation(target: SimulationBuilderTarget, wavelengthNm: number): SimulationBuilderSurfaceValidation {
  const incident = material("air", "Incident medium", target.incidentIndex, 0);
  const substrate = material("dielectric", "Transparent dielectric", target.substrateIndex, 0);
  const tmm = runPlanarTmm({
    id: "l80-transparent-interface",
    label: target.label,
    wavelengthM: wavelengthNm * 1e-9,
    angleRad: 0,
    polarization: "TE",
    incidentMedium: incident,
    substrateMedium: substrate,
    layers: [],
    tolerance: 1e-9
  });
  const expectedR = fresnelReflectanceNormal(target.incidentIndex, target.substrateIndex);
  const expectedT = 1 - expectedR;
  const computed = {
    reflectance: tmm.reflectance,
    transmittance: tmm.transmittance,
    absorbance: tmm.absorbance
  };
  const expected = { reflectance: expectedR, transmittance: expectedT, absorbance: 0 };
  return surfaceValidationResult({
    kind: target.kind,
    label: target.label,
    solverPath: "planar-tmm-fresnel",
    computed,
    expected,
    analyticReference: "Normal-incidence Fresnel equations: R=((n1-n2)/(n1+n2))^2, T=1-R for lossless media.",
    warnings: tmm.warnings,
    tmm: {
      reflectance: tmm.reflectance,
      transmittance: tmm.transmittance,
      absorbance: tmm.absorbance,
      energyBalanceError: tmm.energyBalanceError,
      resultHash: tmm.resultHash
    }
  });
}

function mirrorValidation(target: SimulationBuilderTarget): SimulationBuilderSurfaceValidation {
  return surfaceValidationResult({
    kind: target.kind,
    label: target.label,
    solverPath: "analytic-ideal-mirror",
    computed: { reflectance: 1, transmittance: 0, absorbance: 0 },
    expected: { reflectance: 1, transmittance: 0, absorbance: 0 },
    analyticReference: "Ideal mirror/PEC-like boundary benchmark: R=1, T=0, A=0; phase is noted but not a material lens solve.",
    warnings: [
      {
        code: "simulationBuilder.mirror.idealized",
        message: "Ideal mirror validation is analytic and does not model finite-thickness metal aperture geometry."
      }
    ]
  });
}

function absorbingSlabValidation(target: SimulationBuilderTarget): SimulationBuilderSurfaceValidation {
  const thicknessM = target.thicknessUm * 1e-6;
  const expectedT = beerLambertTransmission(target.absorptionCoefficientPerM, thicknessM);
  return surfaceValidationResult({
    kind: target.kind,
    label: target.label,
    solverPath: "beer-lambert",
    computed: { reflectance: 0, transmittance: expectedT, absorbance: 1 - expectedT },
    expected: { reflectance: 0, transmittance: expectedT, absorbance: 1 - expectedT },
    analyticReference: "Beer-Lambert attenuation: I=I0 exp(-alpha d) for a homogeneous absorbing slab.",
    warnings: [
      {
        code: "simulationBuilder.absorber.scalarBeerLambert",
        message: "Absorbing slab validation uses Beer-Lambert attenuation; it is not a pixel-level sensor-stack EM absorption solve."
      }
    ]
  });
}

function surfaceValidationResult(input: {
  kind: SimulationBuilderTargetKind;
  label: string;
  solverPath: SimulationBuilderSurfaceValidation["solverPath"];
  computed: SimulationBuilderSurfaceValidation["computed"];
  expected: SimulationBuilderSurfaceValidation["expected"];
  analyticReference: string;
  warnings: SolverWarning[];
  tmm?: SimulationBuilderSurfaceValidation["tmm"];
}): SimulationBuilderSurfaceValidation {
  const residuals = {
    reflectance: Math.abs(input.computed.reflectance - input.expected.reflectance),
    transmittance: Math.abs(input.computed.transmittance - input.expected.transmittance),
    absorbance: Math.abs(input.computed.absorbance - input.expected.absorbance)
  };
  const energyBalance = input.computed.reflectance + input.computed.transmittance + input.computed.absorbance;
  const energyBalanceResidual = Math.abs(energyBalance - 1);
  const worstResidual = Math.max(residuals.reflectance, residuals.transmittance, residuals.absorbance, energyBalanceResidual);
  const status: SimulationBuilderValidationStatus = worstResidual <= 1e-4 ? "pass" : worstResidual <= 1e-2 ? "warning" : "fail";
  return {
    kind: input.kind,
    label: input.label,
    solverPath: input.solverPath,
    computed: input.computed,
    expected: input.expected,
    residuals,
    energyBalance,
    energyBalanceResidual,
    status,
    analyticReference: input.analyticReference,
    warnings: uniqueWarnings(input.warnings),
    tmm: input.tmm
  };
}

function simulationBuilderCapabilitySummary(elements: SimulationBuilderElement[]): SimulationBuilderResult["capabilitySummary"] {
  const base = [
    {
      id: "multi-element-optical-bench-chain",
      label: "Multi-element optical bench chain",
      status: "executable" as const,
      evidence: "L8.5.1 ordered source/elements/target/monitor scene graph, element inspector editing, solver plan, scalar preview, external FDTD handoff, and validation report exports"
    },
    {
      id: "element-inspector-direct-editing",
      label: "Element inspector direct editing",
      status: "executable" as const,
      evidence: "L8.5.1 synchronized list/diagram selection, numeric source-of-truth property edits, optional drag commit, snap/nudge controls, custom monitors, edit warnings, and undo/redo"
    },
    {
      id: "scalar-multi-plane-preview",
      label: "Scalar multi-plane preview",
      status: "executable" as const,
      evidence: "L8.5 computes deterministic field/intensity monitor snapshots for ideal apertures, slits, thin lenses, and observation planes"
    },
    {
      id: "external-fdtd-chain-export-import",
      label: "External FDTD chain export/import",
      status: "executable" as const,
      evidence: "L8.5 exports deterministic multi-element manifests/scripts and imports bundled field/flux/receipt evidence for supported finite geometry"
    },
    {
      id: "process-tolerance-variation-runner",
      label: "Process / tolerance variation runner",
      status: "executable" as const,
      evidence: "L8.6 runs deterministic one-at-a-time, grid, and seeded process/tolerance studies over the editable L8.5.1 bench scene with pass/fail, sensitivity ranking, and worst-case tables"
    },
    {
      id: "external-fdtd-variation-sweep",
      label: "External FDTD variation sweep export/import",
      status: "executable" as const,
      evidence: "L8.6 exports deterministic variation sweep manifests and imports external FDTD summary receipts; the browser does not execute the FDTD sweep"
    },
    {
      id: "robust-design-advisor",
      label: "Robust Design Advisor",
      status: "executable" as const,
      evidence: "L8.7 converts L8.6 tolerance sensitivity into ranked diagnostic actions, candidate comparisons, tolerance-budget rows, and explicit apply/export controls"
    },
    {
      id: "robust-candidate-comparison",
      label: "Robust candidate comparison",
      status: "executable" as const,
      evidence: "L8.7 compares baseline vs candidate nominal, worst-case, p90, pass-rate, warning, and cost-weighted scores without adding new optical physics"
    },
    {
      id: "external-fdtd-candidate-sweep",
      label: "External FDTD candidate sweep export/import",
      status: "executable" as const,
      evidence: "L8.7 exports robust candidate sweep manifests and imports external summary receipts for supported finite-geometry candidates; the browser does not execute FDTD"
    },
    {
      id: "sequential-simulation-builder",
      label: "Sequential Simulation Builder",
      status: "executable" as const,
      evidence: "ordered grid/source/elements/target/compute/validate scenario and report"
    },
    {
      id: "transparent-interface-validation",
      label: "Transparent interface/slab validation",
      status: "executable" as const,
      evidence: "PlanarTmmBackend/Fresnel R/T/A residual"
    },
    {
      id: "reflective-surface-validation",
      label: "Reflective surface validation",
      status: "executable" as const,
      evidence: "ideal mirror R=1, T=0, A=0 analytic check"
    },
    {
      id: "absorbing-slab-validation",
      label: "Absorbing slab validation",
      status: "executable" as const,
      evidence: "Beer-Lambert attenuation residual and energy balance"
    },
    {
      id: "external-fdtd-manifest-export",
      label: "External FDTD manifest export",
      status: "executable" as const,
      evidence: "L8.1 exports supported Simulation Builder slab scenes with readiness, geometry, material, monitor, and boundary evidence"
    },
    {
      id: "external-fdtd-field-import",
      label: "External FDTD field/flux import",
      status: "executable" as const,
      evidence: "L8.1 imports external receipt, flux summary, and field-slice CSV evidence for comparison against L8.0 analytic/TMM targets"
    },
    {
      id: "external-fdtd-benchmark-export",
      label: "External FDTD benchmark export",
      status: "executable" as const,
      evidence: "L8.2 exports deterministic benchmark manifests, bounded sweep plans, expected references, and Meep helper scripts"
    },
    {
      id: "external-fdtd-convergence-import",
      label: "External FDTD convergence import",
      status: "executable" as const,
      evidence: "L8.2 imports convergence summaries and per-run flux evidence for residual-vs-resolution and energy-balance diagnostics"
    },
    {
      id: "external-fdtd-convergence-diagnostics",
      label: "FDTD convergence diagnostics",
      status: "executable" as const,
      evidence: "L8.2 computes reference residual trends, field-slice deltas, and PML/padding sensitivity warnings over external-run evidence"
    },
    {
      id: "finite-transparent-block-fdtd",
      label: "Finite transparent block external FDTD export/import",
      status: "executable" as const,
      evidence: "L8.3 exports placed finite dielectric blocks and validates imported fixtures against Fresnel/TMM-style broad-block references"
    },
    {
      id: "finite-absorbing-block-fdtd",
      label: "Finite absorbing block external FDTD export/import",
      status: "executable" as const,
      evidence: "L8.3 exports placed lossy blocks and validates imported fixtures against Beer-Lambert attenuation and energy balance"
    },
    {
      id: "finite-reflective-plate-diagnostic",
      label: "Finite ideal reflective plate diagnostic",
      status: "executable" as const,
      evidence: "L8.3 exports ideal reflector diagnostics with explicit non-production-metal warnings"
    },
    {
      id: "finite-aperture-blocker-diagnostic",
      label: "Finite aperture/blocker external FDTD diagnostic",
      status: "executable" as const,
      evidence: "L8.3 exports finite blocker/aperture masks and reports diagnostic edge-field/convergence warnings"
    },
    {
      id: "aperture-blocker-edge-diffraction-diagnostic",
      label: "Aperture/blocker edge-diffraction diagnostic",
      status: "executable" as const,
      evidence: "L8.4 compares long-slit and circular-pinhole external FDTD fixtures against scalar limiting-case references with edge/PML/monitor warnings"
    },
    {
      id: "tilted-wedge-interface-diagnostic",
      label: "Tilted interface/wedge external FDTD diagnostic",
      status: "executable" as const,
      evidence: "L8.3 exports tilted dielectric surface diagnostics with staircasing and convergence warnings"
    },
    {
      id: "arbitrary-3d-material-geometry",
      label: "Arbitrary 3D material geometry",
      status: "not-implemented" as const,
      evidence: "explicit boundary; ExternalFdtdBackend remains scaffold/export-only"
    },
    {
      id: "certified-optical-tolerancing",
      label: "Certified optical tolerancing",
      status: "not-implemented" as const,
      evidence: "L8.6 is diagnostic process variation only; it is not certified optical tolerancing or manufacturing qualification"
    },
    {
      id: "auto-redesign-inverse-optimization",
      label: "Auto redesign / inverse optimization",
      status: "not-implemented" as const,
      evidence: "L8.7 ranks and compares user-applied candidates but does not automatically approve final designs or run full inverse optimization"
    },
    {
      id: "automatic-final-design-approval",
      label: "Automatic final design approval",
      status: "not-implemented" as const,
      evidence: "L8.7 recommendations are diagnostic guidance and require explicit user action; no final design is automatically approved"
    },
    {
      id: "full-inverse-design",
      label: "Full inverse design",
      status: "not-implemented" as const,
      evidence: "L8.7 uses bounded deterministic candidate heuristics over existing variables, not adjoint/topology/full inverse design"
    }
  ];
  return [
    ...base,
    ...elements.map((element) => ({
      id: element.id,
      label: element.label,
      status: element.status,
      evidence: element.validation
    }))
  ];
}

function material(id: string, label: string, n: number, k: number): MaxwellMaterialSample {
  return {
    id,
    label,
    refractiveIndex: { n, k },
    source: "L8.0 constant diagnostic material sample"
  };
}

function elementStatus(kind: SimulationBuilderElementKind): SimulationBuilderCapabilityStatus {
  if (kind === "curved-material-lens") return "scaffold-only";
  if (kind === "finite-metal-aperture") return "not-implemented";
  return "executable";
}

function simulationElementLabel(kind: SimulationBuilderElementKind): string {
  switch (kind) {
    case "circular-aperture":
      return "Circular aperture";
    case "ideal-lens":
      return "Ideal thin lens";
    case "material-interface":
      return "Planar material interface";
    case "material-slab":
      return "Transparent material slab";
    case "mirror-surface":
      return "Ideal mirror surface";
    case "absorbing-slab":
      return "Absorbing slab";
    case "finite-transparent-block":
      return "Finite transparent block";
    case "finite-absorbing-block":
      return "Finite absorbing block";
    case "finite-reflective-plate":
      return "Finite ideal reflective plate";
    case "finite-aperture-blocker":
      return "Finite aperture/blocker";
    case "tilted-interface-wedge":
      return "Tilted interface/wedge";
    case "curved-material-lens":
      return "Curved material lens";
    case "finite-metal-aperture":
      return "Finite-thickness metal aperture";
  }
}

function elementMaterialLabel(kind: SimulationBuilderElementKind): string {
  switch (kind) {
    case "circular-aperture":
      return "ideal scalar mask";
    case "ideal-lens":
      return "zero-thickness phase mask";
    case "material-interface":
      return "planar dielectric interface";
    case "material-slab":
      return "lossless planar dielectric";
    case "mirror-surface":
      return "ideal mirror";
    case "absorbing-slab":
      return "homogeneous absorber";
    case "finite-transparent-block":
      return "finite dielectric n=1.5";
    case "finite-absorbing-block":
      return "finite lossy dielectric";
    case "finite-reflective-plate":
      return "ideal PEC-like reflector";
    case "finite-aperture-blocker":
      return "finite absorbing blocker mask";
    case "tilted-interface-wedge":
      return "tilted dielectric geometry";
    case "curved-material-lens":
      return "curved dielectric geometry";
    case "finite-metal-aperture":
      return "finite metal thickness";
  }
}

function elementModel(kind: SimulationBuilderElementKind): string {
  switch (kind) {
    case "circular-aperture":
      return "scalar aperture mask";
    case "ideal-lens":
      return "ideal thin-lens phase";
    case "material-interface":
      return "Fresnel/TMM planar interface";
    case "material-slab":
      return "PlanarTmmBackend slab";
    case "mirror-surface":
      return "analytic ideal reflector";
    case "absorbing-slab":
      return "Beer-Lambert slab";
    case "finite-transparent-block":
      return "external FDTD finite dielectric block";
    case "finite-absorbing-block":
      return "external FDTD lossy block";
    case "finite-reflective-plate":
      return "external FDTD ideal reflector diagnostic";
    case "finite-aperture-blocker":
      return "external FDTD finite aperture/blocker diagnostic";
    case "tilted-interface-wedge":
      return "external FDTD tilted interface diagnostic";
    case "curved-material-lens":
      return "scaffold only";
    case "finite-metal-aperture":
      return "not implemented";
  }
}

function elementValidation(kind: SimulationBuilderElementKind, status: SimulationBuilderCapabilityStatus): string {
  if (status === "scaffold-only") return "shown in z-order only; real curved material solve is not executable";
  if (status === "not-implemented") return "not part of L8.0 executable validation";
  switch (kind) {
    case "circular-aperture":
      return "existing scalar circular-aperture validation family";
    case "ideal-lens":
      return "existing ideal thin-lens scalar validation family";
    case "material-interface":
    case "material-slab":
      return "planar TMM/Fresnel validation";
    case "mirror-surface":
      return "ideal mirror analytic R/T/A check";
    case "absorbing-slab":
      return "Beer-Lambert attenuation check";
    case "finite-transparent-block":
      return "external FDTD export/import with Fresnel/TMM broad-block reference";
    case "finite-absorbing-block":
      return "external FDTD export/import with Beer-Lambert attenuation reference";
    case "finite-reflective-plate":
      return "external FDTD ideal R near 1, T near 0 diagnostic; not real metal production optics";
    case "finite-aperture-blocker":
      return "external FDTD aperture/blocker diagnostic field-map fixture; edge diffraction requires scalar-reference and convergence evidence";
    case "tilted-interface-wedge":
      return "external FDTD Snell/Fresnel direction diagnostic with staircasing warning";
    case "curved-material-lens":
    case "finite-metal-aperture":
      return "not executable";
  }
}

function finiteGeometryKind(kind: SimulationBuilderElementKind): boolean {
  return kind === "finite-transparent-block" || kind === "finite-absorbing-block" || kind === "finite-reflective-plate" || kind === "finite-aperture-blocker" || kind === "tilted-interface-wedge";
}

function defaultFiniteGeometryWidthUm(kind: SimulationBuilderElementKind): number {
  if (kind === "finite-reflective-plate") return 8;
  if (kind === "finite-aperture-blocker") return 10;
  if (kind === "tilted-interface-wedge") return 8;
  return 6;
}

function defaultFiniteGeometryHeightUm(kind: SimulationBuilderElementKind): number {
  if (kind === "finite-aperture-blocker") return 10;
  return defaultFiniteGeometryWidthUm(kind);
}

function defaultFiniteGeometryThicknessUm(kind: SimulationBuilderElementKind): number {
  if (kind === "finite-reflective-plate") return 0.5;
  if (kind === "finite-aperture-blocker") return 0.8;
  if (kind === "tilted-interface-wedge") return 3;
  if (kind === "finite-absorbing-block") return 100;
  return 4;
}

function targetKindLabel(kind: SimulationBuilderTargetKind): string {
  if (kind === "transparent-dielectric") return "transparent dielectric interface/slab";
  if (kind === "mirror") return "ideal reflective surface";
  return "absorbing slab";
}

function scenarioForHash(scenario: SimulationBuilderScenario): unknown {
  return {
    id: scenario.id,
    grid: scenario.grid,
    source: scenario.source,
    elements: orderedSimulationBuilderElements(scenario.elements),
    target: scenario.target,
    observationPlaneZMm: scenario.observationPlaneZMm
  };
}

function surfaceForHash(surface: SimulationBuilderSurfaceValidation): unknown {
  return {
    kind: surface.kind,
    solverPath: surface.solverPath,
    computed: surface.computed,
    expected: surface.expected,
    residuals: surface.residuals,
    energyBalance: surface.energyBalance,
    status: surface.status
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
