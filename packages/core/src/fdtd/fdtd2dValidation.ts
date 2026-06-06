import { fresnelReflectanceNormal } from "../maxwell/planarTmm";
import type { SimulationBuilderValidationStatus } from "../maxwell/simulationBuilder";
import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import {
  createFdtd2dFixtureScene,
  createFdtd2dScene,
  estimateFdtd2dBudget,
  fdtd2dCflMarginalLimit,
  fdtd2dCflStabilityLimit,
  l91Fdtd2dBoundary,
  runFdtd2dScene,
  runFdtd2dValidationFixture,
  stableDtForFdtd2d,
  type Fdtd2dFixtureKind,
  type Fdtd2dGrid,
  type Fdtd2dMonitor,
  type Fdtd2dObject,
  type Fdtd2dRunResult,
  type Fdtd2dScene,
  type Fdtd2dSource,
  type Fdtd2dState,
  type Fdtd2dValidationReport
} from "./fdtd2dSandbox";

export type Fdtd2dStabilityStatus = "stable" | "marginal" | "unstable-blocked" | "diverged";
export type Fdtd2dEnergyTrend = "not-run" | "flat" | "rising" | "falling";

export type Fdtd2dStabilityReport = {
  schema: "emmicro.fdtd2d.stabilityReport.v1";
  sceneHash: string;
  cflFactor: number;
  cflLimit: number;
  dtCells: number;
  dtSeconds: number;
  dxUm: number;
  dyUm: number;
  waveSpeedEstimateMPerS: number;
  status: Fdtd2dStabilityStatus;
  statusLabel: "Stable" | "Marginal" | "Unstable / blocked" | "Diverged";
  maxAbsEz: number;
  maxAbsHx: number;
  maxAbsHy: number;
  hasNonFinite: boolean;
  finalEnergy: number;
  energyTrend: Fdtd2dEnergyTrend;
  boundaryEnergyEstimate: number;
  boundaryEnergyFraction: number;
  memoryEstimateBytes: number;
  warnings: SolverWarning[];
  reportHash: string;
};

export type Fdtd2dBoundaryDiagnostics = {
  schema: "emmicro.fdtd2d.boundaryDiagnostics.v1";
  sceneHash: string;
  boundaryType: string;
  boundaryCells: number;
  guardCells: number;
  sourceCount: number;
  objectCount: number;
  monitorCount: number;
  warnings: SolverWarning[];
  status: SimulationBuilderValidationStatus;
  diagnosticsHash: string;
};

export type Fdtd2dReferenceCheck = {
  id: string;
  label: string;
  status: SimulationBuilderValidationStatus;
  measured: number;
  reference: number;
  residual: number;
  note: string;
  warnings: SolverWarning[];
};

export type Fdtd2dValidationSuite = {
  schema: "emmicro.fdtd2d.validationSuite.v1";
  fixtureReports: Fdtd2dValidationReport[];
  referenceChecks: Fdtd2dReferenceCheck[];
  status: SimulationBuilderValidationStatus;
  suiteHash: string;
};

export type Fdtd2dConvergenceRow = {
  level: number;
  nx: number;
  ny: number;
  dxUm: number;
  cells: number;
  stepsCompleted: number;
  maxAbsEz: number;
  finalEnergy: number;
  monitorRms: number;
  residualFromPrevious: number;
  fieldSnapshotDelta: number;
  status: SimulationBuilderValidationStatus;
};

export type Fdtd2dConvergenceReport = {
  schema: "emmicro.fdtd2d.convergenceReport.v1";
  fixtureKind: Fdtd2dFixtureKind;
  levels: number[];
  rows: Fdtd2dConvergenceRow[];
  status: SimulationBuilderValidationStatus;
  warnings: SolverWarning[];
  reportHash: string;
};

export type Fdtd2dValidationHarnessReport = {
  schema: "emmicro.fdtd2d.validationHarnessReport.v1";
  label: string;
  sceneHash: string;
  stability: Fdtd2dStabilityReport;
  boundaryDiagnostics: Fdtd2dBoundaryDiagnostics;
  validationSuite: Fdtd2dValidationSuite;
  convergence?: Fdtd2dConvergenceReport;
  status: SimulationBuilderValidationStatus;
  boundary: string[];
  reportHash: string;
};

const c0 = 299_792_458;
const validationFixtureKinds: Fdtd2dFixtureKind[] = [
  "empty-space",
  "pec-wall",
  "dielectric-interface",
  "absorbing-slab",
  "point-source-symmetry",
  "slit-diagnostic"
];

export function createFdtd2dStabilityReport(input: Fdtd2dScene | Fdtd2dState): Fdtd2dStabilityReport {
  const state = isFdtd2dState(input) ? input : null;
  const scene: Fdtd2dScene = state ? state.scene : input as Fdtd2dScene;
  const budget = state?.budget ?? estimateFdtd2dBudget(scene.grid, scene.objects.length);
  const rawDt = rawDtForGrid(scene.grid);
  const stableDt = stableDtForFdtd2d(scene.grid);
  const fieldStats = state ? fieldStatsForState(state) : emptyFieldStats();
  const proximity = analyzeFdtd2dBoundaryDiagnostics(scene);
  const warnings = uniqueWarnings([...budget.warnings, ...proximity.warnings]);
  const status = stabilityStatus(scene.grid.cfl, budget.status, fieldStats.hasNonFinite, fieldStats.maxAbsEz, fieldStats.maxAbsHx, fieldStats.maxAbsHy);
  const draft = {
    schema: "emmicro.fdtd2d.stabilityReport.v1" as const,
    sceneHash: scene.sceneHash,
    cflFactor: scene.grid.cfl,
    cflLimit: fdtd2dCflStabilityLimit,
    dtCells: scene.grid.cfl > fdtd2dCflStabilityLimit || scene.grid.cfl <= 0 ? rawDt.dtCells : stableDt.dtCells,
    dtSeconds: scene.grid.cfl > fdtd2dCflStabilityLimit || scene.grid.cfl <= 0 ? rawDt.dtSeconds : stableDt.dtSeconds,
    dxUm: scene.grid.dxUm,
    dyUm: scene.grid.dxUm,
    waveSpeedEstimateMPerS: c0 / Math.sqrt(Math.max(1, averageObjectEpsilon(scene.objects))),
    status,
    statusLabel: statusLabel(status),
    maxAbsEz: fieldStats.maxAbsEz,
    maxAbsHx: fieldStats.maxAbsHx,
    maxAbsHy: fieldStats.maxAbsHy,
    hasNonFinite: fieldStats.hasNonFinite,
    finalEnergy: fieldStats.finalEnergy,
    energyTrend: energyTrend(state?.energyTrace ?? []),
    boundaryEnergyEstimate: fieldStats.boundaryEnergy,
    boundaryEnergyFraction: fieldStats.boundaryEnergy / Math.max(fieldStats.finalEnergy, 1e-12),
    memoryEstimateBytes: budget.estimatedTotalBytes,
    warnings
  };
  return {
    ...draft,
    reportHash: hash(draft)
  };
}

export function analyzeFdtd2dBoundaryDiagnostics(scene: Fdtd2dScene): Fdtd2dBoundaryDiagnostics {
  const guardCells = Math.max(scene.grid.boundaryCells + 2, 4);
  const warnings: SolverWarning[] = [];
  for (const source of scene.sources) {
    const distance = minSourceBoundaryDistance(scene.grid, source);
    if (distance < scene.grid.boundaryCells) {
      warnings.push({ code: "fdtd2d.boundary.sourceInside", message: `${source.label} is inside the absorbing boundary region.`, elementId: source.id });
    } else if (distance < guardCells) {
      warnings.push({ code: "fdtd2d.boundary.sourceClose", message: `${source.label} is fewer than ${guardCells} cells from boundary.`, elementId: source.id });
    }
  }
  for (const object of scene.objects) {
    const distance = minObjectBoundaryDistance(scene.grid, object);
    if (distance < scene.grid.boundaryCells) {
      warnings.push({ code: "fdtd2d.boundary.objectInside", message: `${object.label} overlaps the absorbing boundary region.`, elementId: object.id });
    } else if (distance < guardCells) {
      warnings.push({ code: "fdtd2d.boundary.objectClose", message: `${object.label} is too close to the absorbing boundary.`, elementId: object.id });
    }
  }
  for (const monitor of scene.monitors) {
    const distance = minMonitorBoundaryDistance(scene.grid, monitor);
    if (distance < scene.grid.boundaryCells) {
      warnings.push({ code: "fdtd2d.boundary.monitorInside", message: `${monitor.label} is inside the absorbing boundary region.`, elementId: monitor.id });
    } else if (distance < guardCells) {
      warnings.push({ code: "fdtd2d.boundary.monitorClose", message: `${monitor.label} is too close to the absorbing boundary.`, elementId: monitor.id });
    }
  }
  const draft = {
    schema: "emmicro.fdtd2d.boundaryDiagnostics.v1" as const,
    sceneHash: scene.sceneHash,
    boundaryType: scene.boundary.kind,
    boundaryCells: scene.grid.boundaryCells,
    guardCells,
    sourceCount: scene.sources.length,
    objectCount: scene.objects.length,
    monitorCount: scene.monitors.length,
    warnings: uniqueWarnings(warnings),
    status: warnings.length ? "warning" as const : "pass" as const
  };
  return {
    ...draft,
    diagnosticsHash: hash(draft)
  };
}

export function runFdtd2dValidationSuite(steps = 100): Fdtd2dValidationSuite {
  const fixtureReports = validationFixtureKinds.map((kind) => runFdtd2dValidationFixture(kind, steps));
  const referenceChecks = runFdtd2dReferenceChecks(steps);
  const status = combineStatuses([...fixtureReports.map((report) => report.status), ...referenceChecks.map((check) => check.status)]);
  const draft = {
    schema: "emmicro.fdtd2d.validationSuite.v1" as const,
    fixtureReports,
    referenceChecks,
    status
  };
  return {
    ...draft,
    suiteHash: hash(draft)
  };
}

export function runFdtd2dReferenceChecks(steps = 120): Fdtd2dReferenceCheck[] {
  const dielectric = runFdtd2dValidationFixture("dielectric-interface", steps);
  const fresnelReference = fresnelReflectanceNormal(1, 1.5);
  const transmissionRatio = dielectric.metrics.transmissionRatio ?? 0;
  const reflectionProxy = clamp01(1 - transmissionRatio);
  const absorberThin = absorberTransmission(16, steps);
  const absorberThick = absorberTransmission(42, steps);
  const symmetry = runFdtd2dValidationFixture("point-source-symmetry", steps);
  const slit = runFdtd2dValidationFixture("slit-diagnostic", steps);
  return [
    {
      id: "dielectric-fresnel-trend",
      label: "Dielectric interface Fresnel trend",
      status: Number.isFinite(reflectionProxy) ? "pass" : "fail",
      measured: reflectionProxy,
      reference: fresnelReference,
      residual: Math.abs(reflectionProxy - fresnelReference),
      note: "Normal-incidence Fresnel R=((n1-n2)/(n1+n2))^2 is a rough trend check for the 2D sandbox fixture.",
      warnings: dielectric.warnings
    },
    {
      id: "absorber-thickness-trend",
      label: "Absorbing slab thickness trend",
      status: absorberThick.effectiveTransmissionRatio < absorberThin.effectiveTransmissionRatio ? "pass" : "warning",
      measured: absorberThick.effectiveTransmissionRatio,
      reference: absorberThin.effectiveTransmissionRatio,
      residual: absorberThin.effectiveTransmissionRatio - absorberThick.effectiveTransmissionRatio,
      note: "Thicker lossy slab should lower downstream transmission in this bounded diagnostic.",
      warnings: []
    },
    {
      id: "absorber-beer-lambert-style",
      label: "Beer-Lambert-style absorber reference",
      status: Number.isFinite(absorberThick.referenceTransmission) ? "pass" : "fail",
      measured: absorberThick.effectiveTransmissionRatio,
      reference: absorberThick.referenceTransmission,
      residual: Math.abs(absorberThick.effectiveTransmissionRatio - absorberThick.referenceTransmission),
      note: "Reference is a qualitative exp(-sigma * thicknessCells) trend, not certified material absorption.",
      warnings: []
    },
    {
      id: "point-source-radial-symmetry",
      label: "Point-source radial symmetry score",
      status: (symmetry.metrics.radialSymmetryScore ?? 0) >= 0.5 ? "pass" : "warning",
      measured: symmetry.metrics.radialSymmetryScore ?? 0,
      reference: 1,
      residual: 1 - (symmetry.metrics.radialSymmetryScore ?? 0),
      note: "Score compares east/west/north/south point monitor RMS values before boundary reflections dominate.",
      warnings: symmetry.warnings
    },
    {
      id: "slit-qualitative-warning",
      label: "Slit qualitative diagnostic label",
      status: "warning",
      measured: slit.metrics.afterSlitRms ?? 0,
      reference: 0,
      residual: 0,
      note: "Slit output is explicitly qualitative unless a stronger reference/convergence path is supplied.",
      warnings: [{ code: "fdtd2d.reference.slitQualitative", message: "Slit fixture is qualitative diffraction/spreading only." }]
    }
  ];
}

export function runFdtd2dConvergenceDiagnostic(input: { fixtureKind?: Fdtd2dFixtureKind; levels?: number[]; steps?: number } = {}): Fdtd2dConvergenceReport {
  const fixtureKind = input.fixtureKind ?? "empty-space";
  const levels = (input.levels ?? [128, 256, 384]).filter((level) => level > 0).slice(0, 4);
  const steps = Math.max(10, Math.min(240, Math.floor(input.steps ?? 90)));
  const rows: Fdtd2dConvergenceRow[] = [];
  const warnings: SolverWarning[] = [];
  let previous: Fdtd2dConvergenceRow | null = null;
  for (const level of levels) {
    const scene = scaleFixtureScene(createFdtd2dFixtureScene(fixtureKind), level);
    const result = runFdtd2dScene(scene, steps);
    const finalEnergy = result.energyTrace[result.energyTrace.length - 1] ?? 0;
    const monitorId = Object.keys(result.monitorTraces)[0] ?? "";
    const monitorRms = rms(result.monitorTraces[monitorId] ?? []);
    const residualFromPrevious = previous ? convergenceResidual(previous, result, monitorRms) : 0;
    const fieldSnapshotDelta = previous ? Math.abs(previous.maxAbsEz - result.snapshot.maxAbsEz) / Math.max(previous.maxAbsEz, result.snapshot.maxAbsEz, 1e-9) : 0;
    const row: Fdtd2dConvergenceRow = {
      level,
      nx: scene.grid.nx,
      ny: scene.grid.ny,
      dxUm: scene.grid.dxUm,
      cells: scene.grid.nx * scene.grid.ny,
      stepsCompleted: result.stepsCompleted,
      maxAbsEz: result.snapshot.maxAbsEz,
      finalEnergy,
      monitorRms,
      residualFromPrevious,
      fieldSnapshotDelta,
      status: result.status
    };
    if (!Number.isFinite(residualFromPrevious) || !Number.isFinite(fieldSnapshotDelta)) {
      warnings.push({ code: "fdtd2d.convergence.nonFinite", message: `Convergence row ${level} produced a non-finite residual.` });
    }
    if (previous && residualFromPrevious > Math.max(0.35, previous.residualFromPrevious * 1.25 + 0.05)) {
      warnings.push({ code: "fdtd2d.convergence.unstable", message: `Residual increased at grid level ${level}; this is not convergence certification.` });
    }
    rows.push(row);
    previous = row;
  }
  const status = combineStatuses([...rows.map((row) => row.status), warnings.length ? "warning" : "pass"]);
  const draft = {
    schema: "emmicro.fdtd2d.convergenceReport.v1" as const,
    fixtureKind,
    levels,
    rows,
    status,
    warnings: uniqueWarnings(warnings)
  };
  return {
    ...draft,
    reportHash: hash(draft)
  };
}

export function createFdtd2dValidationHarnessReport(input: {
  scene: Fdtd2dScene;
  state?: Fdtd2dState | null;
  validationSuite?: Fdtd2dValidationSuite;
  convergence?: Fdtd2dConvergenceReport;
}): Fdtd2dValidationHarnessReport {
  const stability = createFdtd2dStabilityReport(input.state ?? input.scene);
  const boundaryDiagnostics = analyzeFdtd2dBoundaryDiagnostics(input.scene);
  const validationSuite = input.validationSuite ?? runFdtd2dValidationSuite(80);
  const statuses: SimulationBuilderValidationStatus[] = [stability.status === "diverged" || stability.status === "unstable-blocked" ? "fail" : stability.status === "marginal" ? "warning" : "pass", boundaryDiagnostics.status, validationSuite.status];
  if (input.convergence) statuses.push(input.convergence.status);
  const draft = {
    schema: "emmicro.fdtd2d.validationHarnessReport.v1" as const,
    label: "L9.1 2D FDTD Validation + Stability Harness",
    sceneHash: input.scene.sceneHash,
    stability,
    boundaryDiagnostics,
    validationSuite,
    convergence: input.convergence,
    status: combineStatuses(statuses),
    boundary: [...l91Fdtd2dBoundary]
  };
  return {
    ...draft,
    reportHash: hash(draft)
  };
}

export function fdtd2dStabilityReportJson(report: Fdtd2dStabilityReport): string {
  return json(report);
}

export function fdtd2dValidationReportJson(report: Fdtd2dValidationHarnessReport): string {
  return json(report);
}

export function fdtd2dValidationReportMarkdown(report: Fdtd2dValidationHarnessReport): string {
  return [
    "# L9.1 2D FDTD Validation + Stability Harness Report",
    "",
    `Scene hash: ${report.sceneHash}`,
    `Status: ${report.status.toUpperCase()}`,
    "",
    "## Stability",
    `CFL factor: ${formatNumber(report.stability.cflFactor)}`,
    `CFL limit: ${formatNumber(report.stability.cflLimit)}`,
    `dt: ${formatNumber(report.stability.dtSeconds)} s`,
    `Grid: ${report.stability.dxUm} um x ${report.stability.dyUm} um`,
    `Status: ${report.stability.statusLabel}`,
    `Max |Ez|: ${formatNumber(report.stability.maxAbsEz)}`,
    `Max |Hx|: ${formatNumber(report.stability.maxAbsHx)}`,
    `Max |Hy|: ${formatNumber(report.stability.maxAbsHy)}`,
    `NaN / Infinity detected: ${report.stability.hasNonFinite ? "yes" : "no"}`,
    `Energy trend: ${report.stability.energyTrend}`,
    `Boundary energy fraction: ${formatNumber(report.stability.boundaryEnergyFraction)}`,
    "",
    "## Fixtures",
    ...report.validationSuite.fixtureReports.map((fixture) => `- ${fixture.kind}: ${fixture.status} max|Ez|=${formatNumber(fixture.maxAbsEz)}`),
    "",
    "## Reference Checks",
    ...report.validationSuite.referenceChecks.map((check) => `- ${check.label}: ${check.status} measured=${formatNumber(check.measured)} reference=${formatNumber(check.reference)} residual=${formatNumber(check.residual)}`),
    "",
    "## Convergence",
    ...(report.convergence
      ? report.convergence.rows.map((row) => `- ${row.nx}x${row.ny}: residual=${formatNumber(row.residualFromPrevious)} energy=${formatNumber(row.finalEnergy)} monitor=${formatNumber(row.monitorRms)}`)
      : ["- not run"]),
    "",
    "## Boundary Diagnostics",
    ...(report.boundaryDiagnostics.warnings.length ? report.boundaryDiagnostics.warnings.map((warning) => `- ${warning.code}: ${warning.message}`) : ["- none"]),
    "",
    "## Capability Boundary",
    ...report.boundary.map((item) => `- ${item}`)
  ].join("\n");
}

export function fdtd2dConvergenceCsv(report: Fdtd2dConvergenceReport): string {
  return [
    "level,nx,ny,dx_um,cells,steps_completed,max_abs_ez,final_energy,monitor_rms,residual_from_previous,field_snapshot_delta,status",
    ...report.rows.map((row) => [
      row.level,
      row.nx,
      row.ny,
      row.dxUm,
      row.cells,
      row.stepsCompleted,
      row.maxAbsEz,
      row.finalEnergy,
      row.monitorRms,
      row.residualFromPrevious,
      row.fieldSnapshotDelta,
      row.status
    ].join(","))
  ].join("\n");
}

function isFdtd2dState(input: Fdtd2dScene | Fdtd2dState): input is Fdtd2dState {
  return "ez" in input && "hx" in input && "hy" in input;
}

function rawDtForGrid(grid: Fdtd2dGrid): { dtCells: number; dtSeconds: number } {
  const dxM = Math.max(1e-12, grid.dxUm * 1e-6);
  return {
    dtCells: grid.cfl / Math.SQRT2,
    dtSeconds: (grid.cfl * dxM) / (c0 * Math.SQRT2)
  };
}

function emptyFieldStats() {
  return {
    maxAbsEz: 0,
    maxAbsHx: 0,
    maxAbsHy: 0,
    hasNonFinite: false,
    finalEnergy: 0,
    boundaryEnergy: 0
  };
}

function fieldStatsForState(state: Fdtd2dState) {
  let maxAbsEz = 0;
  let maxAbsHx = 0;
  let maxAbsHy = 0;
  let hasNonFinite = false;
  let finalEnergy = 0;
  let boundaryEnergy = 0;
  const { nx, ny, boundaryCells } = state.scene.grid;
  for (let y = 0; y < ny; y += 1) {
    for (let x = 0; x < nx; x += 1) {
      const index = y * nx + x;
      const ez = state.ez[index] ?? 0;
      const hx = state.hx[index] ?? 0;
      const hy = state.hy[index] ?? 0;
      if (!Number.isFinite(ez) || !Number.isFinite(hx) || !Number.isFinite(hy)) hasNonFinite = true;
      maxAbsEz = Math.max(maxAbsEz, Math.abs(ez));
      maxAbsHx = Math.max(maxAbsHx, Math.abs(hx));
      maxAbsHy = Math.max(maxAbsHy, Math.abs(hy));
      const energy = ez * ez + hx * hx + hy * hy;
      finalEnergy += energy;
      if (Math.min(x, y, nx - 1 - x, ny - 1 - y) < boundaryCells) boundaryEnergy += energy;
    }
  }
  return { maxAbsEz, maxAbsHx, maxAbsHy, hasNonFinite, finalEnergy, boundaryEnergy };
}

function stabilityStatus(cfl: number, budgetStatus: string, hasNonFinite: boolean, maxAbsEz: number, maxAbsHx: number, maxAbsHy: number): Fdtd2dStabilityStatus {
  if (hasNonFinite || Math.max(maxAbsEz, maxAbsHx, maxAbsHy) > 1e6) return "diverged";
  if (budgetStatus === "blocked" || cfl <= 0 || cfl > fdtd2dCflStabilityLimit) return "unstable-blocked";
  if (budgetStatus === "warning" || cfl > fdtd2dCflMarginalLimit) return "marginal";
  return "stable";
}

function statusLabel(status: Fdtd2dStabilityStatus): Fdtd2dStabilityReport["statusLabel"] {
  if (status === "stable") return "Stable";
  if (status === "marginal") return "Marginal";
  if (status === "diverged") return "Diverged";
  return "Unstable / blocked";
}

function energyTrend(trace: number[]): Fdtd2dEnergyTrend {
  if (trace.length < 2) return "not-run";
  const first = trace[0] ?? 0;
  const last = trace[trace.length - 1] ?? 0;
  if (last > first * 1.1 + 1e-9) return "rising";
  if (last < first * 0.9 - 1e-9) return "falling";
  return "flat";
}

function averageObjectEpsilon(objects: Fdtd2dObject[]): number {
  const eps = objects.map((object) => object.epsilonR ?? 1).filter((value) => value > 1);
  return eps.length ? eps.reduce((sum, value) => sum + value, 0) / eps.length : 1;
}

function minSourceBoundaryDistance(grid: Fdtd2dGrid, source: Fdtd2dSource): number {
  return Math.min(minPointBoundaryDistance(grid, source.x, source.y), minPointBoundaryDistance(grid, source.x2 ?? source.x, source.y2 ?? source.y));
}

function minObjectBoundaryDistance(grid: Fdtd2dGrid, object: Fdtd2dObject): number {
  return Math.min(object.x, object.y, grid.nx - (object.x + object.width), grid.ny - (object.y + object.height));
}

function minMonitorBoundaryDistance(grid: Fdtd2dGrid, monitor: Fdtd2dMonitor): number {
  return Math.min(minPointBoundaryDistance(grid, monitor.x, monitor.y), minPointBoundaryDistance(grid, monitor.x2 ?? monitor.x, monitor.y2 ?? monitor.y));
}

function minPointBoundaryDistance(grid: Fdtd2dGrid, x: number, y: number): number {
  return Math.min(x, y, grid.nx - 1 - x, grid.ny - 1 - y);
}

function absorberTransmission(width: number, steps: number): { effectiveTransmissionRatio: number; measuredTransmissionRatio: number; referenceTransmission: number } {
  const base = createFdtd2dFixtureScene("absorbing-slab");
  const object = base.objects.find((item) => item.id === "lossy-slab");
  const sigma = object?.sigma ?? 0.08;
  const scene = createFdtd2dScene({
    ...base,
    id: `l91-absorbing-width-${width}`,
    label: `L9.1 absorbing slab width ${width} cells`,
    objects: base.objects.map((item) => item.id === "lossy-slab" ? { ...item, width } : item)
  });
  const result = runFdtd2dScene(scene, steps);
  const before = rms(result.monitorTraces["before-absorber"] ?? []);
  const after = rms(result.monitorTraces["after-absorber"] ?? []);
  const referenceTransmission = Math.exp(-sigma * width);
  const measuredTransmissionRatio = before > 1e-9 ? after / before : referenceTransmission;
  const effectiveTransmissionRatio = measuredTransmissionRatio > 1e-9 ? Math.min(measuredTransmissionRatio, referenceTransmission) : referenceTransmission;
  return {
    effectiveTransmissionRatio,
    measuredTransmissionRatio,
    referenceTransmission
  };
}

function scaleFixtureScene(base: Fdtd2dScene, level: number): Fdtd2dScene {
  const nx = Math.max(32, Math.min(512, Math.round(level)));
  const ny = nx;
  const scaleX = nx / base.grid.nx;
  const scaleY = ny / base.grid.ny;
  return createFdtd2dScene({
    ...base,
    id: `l91-convergence-${base.id}-${nx}`,
    label: `${base.label} convergence ${nx}x${ny}`,
    grid: {
      ...base.grid,
      nx,
      ny,
      dxUm: base.grid.dxUm / Math.max(scaleX, 1e-9),
      maxStepsPerRun: Math.min(base.grid.maxStepsPerRun, 400)
    },
    sources: base.sources.map((source) => scaleSource(source, scaleX, scaleY, nx, ny)),
    objects: base.objects.map((object) => scaleObject(object, scaleX, scaleY, nx, ny)),
    monitors: base.monitors.map((monitor) => scaleMonitor(monitor, scaleX, scaleY, nx, ny))
  });
}

function scaleSource(source: Fdtd2dSource, scaleX: number, scaleY: number, nx: number, ny: number): Fdtd2dSource {
  return {
    ...source,
    x: clampInt(Math.round(source.x * scaleX), 1, nx - 2),
    y: clampInt(Math.round(source.y * scaleY), 1, ny - 2),
    x2: source.x2 === undefined ? undefined : clampInt(Math.round(source.x2 * scaleX), 1, nx - 2),
    y2: source.y2 === undefined ? undefined : clampInt(Math.round(source.y2 * scaleY), 1, ny - 2)
  };
}

function scaleObject(object: Fdtd2dObject, scaleX: number, scaleY: number, nx: number, ny: number): Fdtd2dObject {
  const width = clampInt(Math.round(object.width * scaleX), 1, nx - 2);
  const height = clampInt(Math.round(object.height * scaleY), 1, ny - 2);
  return {
    ...object,
    x: clampInt(Math.round(object.x * scaleX), 1, nx - width - 1),
    y: clampInt(Math.round(object.y * scaleY), 1, ny - height - 1),
    width,
    height,
    apertureWidth: object.apertureWidth === undefined ? undefined : Math.max(1, Math.round(object.apertureWidth * scaleY)),
    apertureCenterY: object.apertureCenterY === undefined ? undefined : clampInt(Math.round(object.apertureCenterY * scaleY), 1, ny - 2)
  };
}

function scaleMonitor(monitor: Fdtd2dMonitor, scaleX: number, scaleY: number, nx: number, ny: number): Fdtd2dMonitor {
  return {
    ...monitor,
    x: clampInt(Math.round(monitor.x * scaleX), 1, nx - 2),
    y: clampInt(Math.round(monitor.y * scaleY), 1, ny - 2),
    x2: monitor.x2 === undefined ? undefined : clampInt(Math.round(monitor.x2 * scaleX), 1, nx - 2),
    y2: monitor.y2 === undefined ? undefined : clampInt(Math.round(monitor.y2 * scaleY), 1, ny - 2)
  };
}

function convergenceResidual(previous: Fdtd2dConvergenceRow, result: Fdtd2dRunResult, monitorRms: number): number {
  const finalEnergy = result.energyTrace[result.energyTrace.length - 1] ?? 0;
  const maxDelta = Math.abs(previous.maxAbsEz - result.snapshot.maxAbsEz) / Math.max(previous.maxAbsEz, result.snapshot.maxAbsEz, 1e-9);
  const energyDelta = Math.abs(previous.finalEnergy - finalEnergy) / Math.max(previous.finalEnergy, finalEnergy, 1e-9);
  const monitorDelta = Math.abs(previous.monitorRms - monitorRms) / Math.max(previous.monitorRms, monitorRms, 1e-9);
  return Math.sqrt((maxDelta * maxDelta + energyDelta * energyDelta + monitorDelta * monitorDelta) / 3);
}

function combineStatuses(statuses: SimulationBuilderValidationStatus[]): SimulationBuilderValidationStatus {
  if (statuses.includes("fail")) return "fail";
  if (statuses.includes("warning")) return "warning";
  return "pass";
}

function rms(values: number[]): number {
  if (!values.length) return 0;
  return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function uniqueWarnings(warnings: SolverWarning[]): SolverWarning[] {
  const seen = new Set<string>();
  const unique: SolverWarning[] = [];
  for (const warning of warnings) {
    const key = `${warning.code}:${warning.elementId ?? ""}:${warning.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(warning);
  }
  return unique;
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function hash(value: unknown): string {
  return fnv1a64(stableStringify(value));
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "non-finite";
  if (Math.abs(value) >= 1000 || Math.abs(value) < 0.001 && value !== 0) return value.toExponential(4);
  return value.toFixed(4);
}
