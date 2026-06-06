import {
  orderedSimulationBuilderElements,
  type SimulationBuilderElement,
  type SimulationBuilderScenario,
  type SimulationBuilderValidationStatus
} from "../maxwell/simulationBuilder";
import { fresnelReflectanceNormal } from "../maxwell/planarTmm";
import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";

export type Fdtd2dPolarization = "TMz";
export type Fdtd2dBoundaryKind = "simple-absorbing";
export type Fdtd2dGridStatus = "safe" | "warning" | "blocked";
export type Fdtd2dSourceKind = "point" | "line";
export type Fdtd2dWaveform = "continuous" | "gaussian-pulse";
export type Fdtd2dObjectKind = "dielectric-rectangle" | "absorbing-rectangle" | "pec-block" | "slit-screen";
export type Fdtd2dMonitorKind = "point" | "line";
export type Fdtd2dFixtureKind = "empty-space" | "pec-wall" | "dielectric-interface" | "absorbing-slab" | "slit-diagnostic";

export type Fdtd2dGrid = {
  nx: number;
  ny: number;
  dxUm: number;
  cfl: number;
  boundaryCells: number;
  maxStepsPerRun: number;
  maxObjects: number;
  maxMonitorSamples: number;
};

export type Fdtd2dSource = {
  id: string;
  label: string;
  kind: Fdtd2dSourceKind;
  waveform: Fdtd2dWaveform;
  x: number;
  y: number;
  x2?: number;
  y2?: number;
  amplitude: number;
  periodSteps: number;
  pulseCenterStep: number;
  pulseWidthSteps: number;
};

export type Fdtd2dObject = {
  id: string;
  label: string;
  kind: Fdtd2dObjectKind;
  x: number;
  y: number;
  width: number;
  height: number;
  epsilonR?: number;
  sigma?: number;
  apertureWidth?: number;
  apertureCenterY?: number;
};

export type Fdtd2dMonitor = {
  id: string;
  label: string;
  kind: Fdtd2dMonitorKind;
  x: number;
  y: number;
  x2?: number;
  y2?: number;
};

export type Fdtd2dScene = {
  schema: "emmicro.fdtd2d.scene.v1";
  id: string;
  label: string;
  polarization: Fdtd2dPolarization;
  grid: Fdtd2dGrid;
  sources: Fdtd2dSource[];
  objects: Fdtd2dObject[];
  monitors: Fdtd2dMonitor[];
  boundary: {
    kind: Fdtd2dBoundaryKind;
    note: string;
  };
  limitations: string[];
  sceneHash: string;
};

export type Fdtd2dBudget = {
  schema: "emmicro.fdtd2d.budget.v1";
  nx: number;
  ny: number;
  cells: number;
  estimatedFieldBytes: number;
  estimatedTotalBytes: number;
  maxGridCells: number;
  warningGridCells: number;
  maxStepsPerRun: number;
  status: Fdtd2dGridStatus;
  warnings: SolverWarning[];
  budgetHash: string;
};

export type Fdtd2dState = {
  schema: "emmicro.fdtd2d.state.v1";
  scene: Fdtd2dScene;
  budget: Fdtd2dBudget;
  step: number;
  dtCells: number;
  dtSeconds: number;
  ez: Float32Array;
  hx: Float32Array;
  hy: Float32Array;
  epsilonR: Float32Array;
  sigma: Float32Array;
  pec: Uint8Array;
  material: Uint8Array;
  energyTrace: number[];
  monitorTraces: Record<string, number[]>;
  warnings: SolverWarning[];
};

export type Fdtd2dFieldSample = {
  x: number;
  y: number;
  ez: number;
  intensity: number;
  material: number;
};

export type Fdtd2dSnapshot = {
  schema: "emmicro.fdtd2d.snapshot.v1";
  sceneHash: string;
  step: number;
  nx: number;
  ny: number;
  maxAbsEz: number;
  totalEnergy: number;
  samples: Fdtd2dFieldSample[];
  snapshotHash: string;
};

export type Fdtd2dRunResult = {
  schema: "emmicro.fdtd2d.runResult.v1";
  scene: Fdtd2dScene;
  budget: Fdtd2dBudget;
  stepsRequested: number;
  stepsCompleted: number;
  snapshot: Fdtd2dSnapshot;
  energyTrace: number[];
  monitorTraces: Record<string, number[]>;
  status: SimulationBuilderValidationStatus;
  warnings: SolverWarning[];
  resultHash: string;
};

export type Fdtd2dValidationReport = {
  schema: "emmicro.fdtd2d.validationReport.v1";
  kind: Fdtd2dFixtureKind;
  label: string;
  reference: string;
  sceneHash: string;
  stepsCompleted: number;
  energyFinite: boolean;
  maxAbsEz: number;
  metrics: Record<string, number>;
  status: SimulationBuilderValidationStatus;
  warnings: SolverWarning[];
  reportHash: string;
};

export type Fdtd2dSimulationBuilderHandoff = {
  schema: "emmicro.fdtd2d.simulationBuilderHandoff.v1";
  scenarioId: string;
  scenarioLabel: string;
  scene: Fdtd2dScene;
  mappedObjects: Array<{ sourceId: string; objectId: string; kind: Fdtd2dObjectKind }>;
  blocked: Array<{ id: string; label: string; reason: string }>;
  warnings: SolverWarning[];
  handoffHash: string;
};

export type Fdtd2dReport = {
  schema: "emmicro.fdtd2d.sandboxReport.v1";
  label: string;
  sceneHash: string;
  resultHash: string;
  polarization: Fdtd2dPolarization;
  grid: Fdtd2dGrid;
  budget: Fdtd2dBudget;
  stepsCompleted: number;
  maxAbsEz: number;
  finalEnergy: number;
  monitorIds: string[];
  status: SimulationBuilderValidationStatus;
  warnings: SolverWarning[];
  boundary: string[];
  reportHash: string;
};

export const l90Fdtd2dBoundary = [
  "L9.0 is a bounded in-browser 2D FDTD Maxwell sandbox using one TMz polarization: Ez, Hx, and Hy.",
  "It is a diagnostic live field-evolution sandbox for small grids only, not full 3D Maxwell and not production FDTD.",
  "CPU typed-array stepping is the L9.0 executable path; WebGPU is optional future acceleration and is not required.",
  "Hard grid, memory, object, step, and monitor-sample caps are enforced before stepping.",
  "The L8.9 external Meep/FDTD path remains the serious path for large, 3D, or production solver work.",
  "No FEM/BEM/RCWA execution, arbitrary CAD/freeform geometry, sensor-stack EM, digital twin, hardware control, lab accreditation, or manufacturing certification is claimed."
] as const;

export const defaultFdtd2dGrid: Fdtd2dGrid = {
  nx: 256,
  ny: 256,
  dxUm: 0.05,
  cfl: 0.45,
  boundaryCells: 10,
  maxStepsPerRun: 1200,
  maxObjects: 32,
  maxMonitorSamples: 5000
};

const c0 = 299_792_458;
const warningCells = 512 * 512;
const maxCells = 1024 * 1024;

export function createFdtd2dScene(input: Partial<Omit<Fdtd2dScene, "schema" | "sceneHash" | "limitations">> = {}): Fdtd2dScene {
  const grid = sanitizeGrid({ ...defaultFdtd2dGrid, ...(input.grid ?? {}) });
  const draft = {
    schema: "emmicro.fdtd2d.scene.v1" as const,
    id: input.id ?? "l90-fdtd2d-default",
    label: input.label ?? "L9.0 bounded 2D FDTD sandbox",
    polarization: "TMz" as const,
    grid,
    sources: input.sources ?? [defaultPointSource(grid)],
    objects: input.objects ?? [],
    monitors: input.monitors ?? [defaultLineMonitor(grid)],
    boundary: input.boundary ?? {
      kind: "simple-absorbing" as const,
      note: "Simple lossy edge damping scaffold; not production PML."
    },
    limitations: [...l90Fdtd2dBoundary]
  };
  return {
    ...draft,
    sceneHash: hashCanonical(sceneForHash(draft))
  };
}

export function createFdtd2dFixtureScene(kind: Fdtd2dFixtureKind): Fdtd2dScene {
  const grid = { ...defaultFdtd2dGrid, nx: 192, ny: 160, maxStepsPerRun: 900 };
  const source = defaultPointSource(grid);
  if (kind === "empty-space") {
    return createFdtd2dScene({
      id: "l90-empty-space",
      label: "L9.0 empty-space 2D FDTD propagation fixture",
      grid,
      sources: [{ ...source, waveform: "gaussian-pulse", amplitude: 0.85 }],
      monitors: [defaultLineMonitor(grid)]
    });
  }
  if (kind === "pec-wall") {
    return createFdtd2dScene({
      id: "l90-pec-wall",
      label: "L9.0 PEC-like reflection fixture",
      grid,
      sources: [{ ...source, waveform: "gaussian-pulse", amplitude: 0.9 }],
      objects: [{ id: "pec-wall", label: "PEC-like reflector wall", kind: "pec-block", x: 112, y: 18, width: 5, height: 124 }],
      monitors: [defaultLineMonitor(grid), { id: "behind-wall", label: "Behind wall field", kind: "line", x: 132, y: 24, x2: 132, y2: 136 }]
    });
  }
  if (kind === "dielectric-interface") {
    return createFdtd2dScene({
      id: "l90-dielectric-interface",
      label: "L9.0 dielectric interface rough Fresnel fixture",
      grid,
      sources: [{ ...source, kind: "line", x: 34, y: 25, x2: 34, y2: 135, waveform: "gaussian-pulse", amplitude: 0.7 }],
      objects: [{ id: "glass-halfspace", label: "n 1.5 dielectric half-space", kind: "dielectric-rectangle", x: 105, y: 10, width: 70, height: 140, epsilonR: 2.25 }],
      monitors: [defaultLineMonitor(grid), { id: "transmitted-interface", label: "Transmitted side monitor", kind: "line", x: 150, y: 28, x2: 150, y2: 132 }]
    });
  }
  if (kind === "absorbing-slab") {
    return createFdtd2dScene({
      id: "l90-absorbing-slab",
      label: "L9.0 absorbing slab attenuation fixture",
      grid,
      sources: [{ ...source, kind: "line", x: 34, y: 25, x2: 34, y2: 135, waveform: "gaussian-pulse", amplitude: 0.7 }],
      objects: [{ id: "lossy-slab", label: "Lossy absorbing slab", kind: "absorbing-rectangle", x: 92, y: 20, width: 28, height: 120, epsilonR: 1.4, sigma: 0.08 }],
      monitors: [defaultLineMonitor(grid), { id: "after-absorber", label: "After absorber monitor", kind: "line", x: 150, y: 28, x2: 150, y2: 132 }]
    });
  }
  return createFdtd2dScene({
    id: "l90-slit-diagnostic",
    label: "L9.0 qualitative 2D FDTD slit diagnostic",
    grid,
    sources: [{ ...source, kind: "line", x: 34, y: 25, x2: 34, y2: 135, waveform: "gaussian-pulse", amplitude: 0.7 }],
    objects: [{ id: "slit-screen", label: "PEC-like screen with slit", kind: "slit-screen", x: 95, y: 12, width: 5, height: 136, apertureWidth: 24, apertureCenterY: 80 }],
    monitors: [defaultLineMonitor(grid), { id: "after-slit", label: "After slit monitor", kind: "line", x: 148, y: 20, x2: 148, y2: 140 }]
  });
}

export function estimateFdtd2dBudget(grid: Fdtd2dGrid, objectCount = 0): Fdtd2dBudget {
  const nx = Math.max(1, Math.floor(grid.nx));
  const ny = Math.max(1, Math.floor(grid.ny));
  const cells = nx * ny;
  const warnings: SolverWarning[] = [];
  if (cells > warningCells) {
    warnings.push({
      code: "fdtd2d.grid.large",
      message: "Grid is above the L9.0 warning threshold; reduce dimensions unless you intentionally need an experimental run."
    });
  }
  if (cells > maxCells) {
    warnings.push({
      code: "fdtd2d.grid.blocked",
      message: "Grid exceeds the L9.0 hard maximum of 1024 x 1024 cells."
    });
  }
  if (objectCount > grid.maxObjects) {
    warnings.push({
      code: "fdtd2d.objects.tooMany",
      message: `Scene has ${objectCount} objects, above the L9.0 cap of ${grid.maxObjects}.`
    });
  }
  if (grid.cfl <= 0 || grid.cfl > 0.7) {
    warnings.push({
      code: "fdtd2d.cfl.warning",
      message: "CFL factor should stay in (0, 0.7] for this normalized 2D TMz sandbox."
    });
  }
  const estimatedFieldBytes = cells * 3 * Float32Array.BYTES_PER_ELEMENT;
  const estimatedTotalBytes = cells * (5 * Float32Array.BYTES_PER_ELEMENT + Uint8Array.BYTES_PER_ELEMENT * 2);
  const status: Fdtd2dGridStatus = cells > maxCells || objectCount > grid.maxObjects || grid.cfl <= 0 || grid.cfl > 0.9 ? "blocked" : cells > warningCells || warnings.length > 0 ? "warning" : "safe";
  const draft = {
    schema: "emmicro.fdtd2d.budget.v1" as const,
    nx,
    ny,
    cells,
    estimatedFieldBytes,
    estimatedTotalBytes,
    maxGridCells: maxCells,
    warningGridCells: warningCells,
    maxStepsPerRun: grid.maxStepsPerRun,
    status,
    warnings
  };
  return {
    ...draft,
    budgetHash: hashCanonical(draft)
  };
}

export function stableDtForFdtd2d(grid: Fdtd2dGrid): { dtCells: number; dtSeconds: number } {
  const dxM = Math.max(1e-12, grid.dxUm * 1e-6);
  const cfl = Math.max(0.001, Math.min(0.7, grid.cfl));
  return {
    dtCells: cfl / Math.SQRT2,
    dtSeconds: (cfl * dxM) / (c0 * Math.SQRT2)
  };
}

export function initializeFdtd2dState(scene: Fdtd2dScene): Fdtd2dState {
  const grid = sanitizeGrid(scene.grid);
  const budget = estimateFdtd2dBudget(grid, scene.objects.length);
  const cells = grid.nx * grid.ny;
  if (budget.status === "blocked") {
    throw new Error(`L9.0 2D FDTD grid is blocked: ${budget.warnings.map((warning) => warning.message).join(" ")}`);
  }
  const { dtCells, dtSeconds } = stableDtForFdtd2d(grid);
  const state: Fdtd2dState = {
    schema: "emmicro.fdtd2d.state.v1",
    scene: { ...scene, grid },
    budget,
    step: 0,
    dtCells,
    dtSeconds,
    ez: new Float32Array(cells),
    hx: new Float32Array(cells),
    hy: new Float32Array(cells),
    epsilonR: new Float32Array(cells),
    sigma: new Float32Array(cells),
    pec: new Uint8Array(cells),
    material: new Uint8Array(cells),
    energyTrace: [],
    monitorTraces: Object.fromEntries(scene.monitors.map((monitor) => [monitor.id, []])),
    warnings: [...budget.warnings]
  };
  state.epsilonR.fill(1);
  applyBoundaryDamping(state);
  applyFdtd2dObjects(state, scene.objects);
  return state;
}

export function cloneFdtd2dState(state: Fdtd2dState): Fdtd2dState {
  return {
    ...state,
    ez: new Float32Array(state.ez),
    hx: new Float32Array(state.hx),
    hy: new Float32Array(state.hy),
    epsilonR: new Float32Array(state.epsilonR),
    sigma: new Float32Array(state.sigma),
    pec: new Uint8Array(state.pec),
    material: new Uint8Array(state.material),
    energyTrace: [...state.energyTrace],
    monitorTraces: Object.fromEntries(Object.entries(state.monitorTraces).map(([id, values]) => [id, [...values]])),
    warnings: [...state.warnings]
  };
}

export function stepFdtd2dState(state: Fdtd2dState, requestedSteps = 1): Fdtd2dState {
  const steps = Math.max(0, Math.min(Math.floor(requestedSteps), state.scene.grid.maxStepsPerRun));
  for (let index = 0; index < steps; index += 1) {
    stepMagnetic(state);
    stepElectric(state);
    injectSources(state);
    state.step += 1;
    recordTraces(state);
  }
  return state;
}

export function runFdtd2dScene(scene: Fdtd2dScene, steps: number): Fdtd2dRunResult {
  const state = initializeFdtd2dState(scene);
  stepFdtd2dState(state, steps);
  return fdtd2dRunResultFromState(state, steps);
}

export function fdtd2dRunResultFromState(state: Fdtd2dState, stepsRequested = state.step): Fdtd2dRunResult {
  const snapshot = createFdtd2dSnapshot(state);
  const hasBadField = state.ez.some((value) => !Number.isFinite(value)) || state.hx.some((value) => !Number.isFinite(value)) || state.hy.some((value) => !Number.isFinite(value));
  const warnings = [...state.warnings];
  if (hasBadField) {
    warnings.push({ code: "fdtd2d.field.nonFinite", message: "FDTD state contains NaN or Infinity and must not be trusted." });
  }
  const status: SimulationBuilderValidationStatus = hasBadField ? "fail" : state.budget.status === "warning" || warnings.length > 0 ? "warning" : "pass";
  const draft = {
    schema: "emmicro.fdtd2d.runResult.v1" as const,
    scene: state.scene,
    budget: state.budget,
    stepsRequested,
    stepsCompleted: state.step,
    snapshot,
    energyTrace: [...state.energyTrace],
    monitorTraces: Object.fromEntries(Object.entries(state.monitorTraces).map(([id, values]) => [id, [...values]])),
    status,
    warnings: uniqueWarnings(warnings)
  };
  return {
    ...draft,
    resultHash: hashCanonical(runResultForHash(draft))
  };
}

export function createFdtd2dSnapshot(state: Fdtd2dState, stride = snapshotStride(state.scene.grid)): Fdtd2dSnapshot {
  const samples: Fdtd2dFieldSample[] = [];
  let maxAbsEz = 0;
  let totalEnergy = 0;
  for (let y = 0; y < state.scene.grid.ny; y += 1) {
    for (let x = 0; x < state.scene.grid.nx; x += 1) {
      const idx = index2d(x, y, state.scene.grid.nx);
      const ez = state.ez[idx] ?? 0;
      const hx = state.hx[idx] ?? 0;
      const hy = state.hy[idx] ?? 0;
      const intensity = ez * ez;
      maxAbsEz = Math.max(maxAbsEz, Math.abs(ez));
      totalEnergy += intensity + hx * hx + hy * hy;
      if (x % stride === 0 && y % stride === 0) {
        samples.push({ x, y, ez, intensity, material: state.material[idx] ?? 0 });
      }
    }
  }
  const draft = {
    schema: "emmicro.fdtd2d.snapshot.v1" as const,
    sceneHash: state.scene.sceneHash,
    step: state.step,
    nx: state.scene.grid.nx,
    ny: state.scene.grid.ny,
    maxAbsEz,
    totalEnergy,
    samples
  };
  return {
    ...draft,
    snapshotHash: hashCanonical(snapshotForHash(draft))
  };
}

export function runFdtd2dValidationFixture(kind: Fdtd2dFixtureKind, steps = 140): Fdtd2dValidationReport {
  const scene = createFdtd2dFixtureScene(kind);
  const result = runFdtd2dScene(scene, steps);
  const metrics = fixtureMetrics(kind, result);
  const warnings = [...result.warnings];
  const energyFinite = result.energyTrace.every((value) => Number.isFinite(value));
  if (!energyFinite) warnings.push({ code: "fdtd2d.validation.nonFiniteEnergy", message: "Energy trace contains NaN or Infinity." });
  const maxAbsEz = result.snapshot.maxAbsEz;
  const status = validationStatusForFixture(kind, metrics, energyFinite, maxAbsEz, warnings);
  const draft = {
    schema: "emmicro.fdtd2d.validationReport.v1" as const,
    kind,
    label: scene.label,
    reference: fixtureReference(kind),
    sceneHash: scene.sceneHash,
    stepsCompleted: result.stepsCompleted,
    energyFinite,
    maxAbsEz,
    metrics,
    status,
    warnings: uniqueWarnings(warnings)
  };
  return {
    ...draft,
    reportHash: hashCanonical(draft)
  };
}

export function createFdtd2dSandboxReport(result: Fdtd2dRunResult): Fdtd2dReport {
  const draft = {
    schema: "emmicro.fdtd2d.sandboxReport.v1" as const,
    label: result.scene.label,
    sceneHash: result.scene.sceneHash,
    resultHash: result.resultHash,
    polarization: result.scene.polarization,
    grid: result.scene.grid,
    budget: result.budget,
    stepsCompleted: result.stepsCompleted,
    maxAbsEz: result.snapshot.maxAbsEz,
    finalEnergy: result.energyTrace[result.energyTrace.length - 1] ?? 0,
    monitorIds: Object.keys(result.monitorTraces),
    status: result.status,
    warnings: uniqueWarnings(result.warnings),
    boundary: [...l90Fdtd2dBoundary]
  };
  return {
    ...draft,
    reportHash: hashCanonical(reportForHash(draft))
  };
}

export function fdtd2dSandboxReportJson(report: Fdtd2dReport): string {
  return json(report);
}

export function fdtd2dSandboxReportMarkdown(report: Fdtd2dReport): string {
  return [
    "# L9.0 In-Browser 2D FDTD Maxwell Sandbox Report",
    "",
    `Label: ${report.label}`,
    `Scene hash: ${report.sceneHash}`,
    `Result hash: ${report.resultHash}`,
    `Polarization: ${report.polarization}`,
    `Grid: ${report.grid.nx} x ${report.grid.ny}`,
    `Cells: ${report.budget.cells}`,
    `Estimated total memory: ${report.budget.estimatedTotalBytes} bytes`,
    `Steps completed: ${report.stepsCompleted}`,
    `Max |Ez|: ${formatNumber(report.maxAbsEz)}`,
    `Final energy: ${formatNumber(report.finalEnergy)}`,
    `Status: ${report.status.toUpperCase()}`,
    "",
    "## Monitors",
    ...(report.monitorIds.length ? report.monitorIds.map((id) => `- ${id}`) : ["- none"]),
    "",
    "## Warnings",
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning.code}: ${warning.message}`) : ["- none"]),
    "",
    "## Boundary",
    ...report.boundary.map((item) => `- ${item}`)
  ].join("\n");
}

export function fdtd2dFieldSnapshotCsv(snapshot: Fdtd2dSnapshot): string {
  return [
    "x,y,ez,intensity,material",
    ...snapshot.samples.map((sample) => [sample.x, sample.y, sample.ez, sample.intensity, sample.material].map(String).join(","))
  ].join("\n");
}

export function fdtd2dMonitorTraceCsv(result: Fdtd2dRunResult): string {
  const monitorIds = Object.keys(result.monitorTraces);
  const maxLength = Math.max(0, ...monitorIds.map((id) => result.monitorTraces[id]?.length ?? 0));
  return [
    ["step", ...monitorIds].join(","),
    ...Array.from({ length: maxLength }, (_row, index) => [index + 1, ...monitorIds.map((id) => result.monitorTraces[id]?.[index] ?? "")].join(","))
  ].join("\n");
}

export function fdtd2dEnergyTraceCsv(result: Fdtd2dRunResult): string {
  return [
    "step,total_energy",
    ...result.energyTrace.map((value, index) => `${index + 1},${value}`)
  ].join("\n");
}

export function simulationBuilderToFdtd2dSandbox(scenario: SimulationBuilderScenario): Fdtd2dSimulationBuilderHandoff {
  const nx = 256;
  const ny = 192;
  const grid = { ...defaultFdtd2dGrid, nx, ny, dxUm: Math.max(0.01, scenario.source.wavelengthNm / 1000 / Math.max(4, scenario.grid.pointsPerWavelength)) };
  const sources: Fdtd2dSource[] = [
    {
      id: "builder-source",
      label: scenario.source.label,
      kind: scenario.source.type === "plane-wave" ? "line" : "point",
      waveform: "continuous",
      x: clampInt(Math.round(nx * 0.18), 2, nx - 3),
      y: clampInt(Math.round(yFromUm(scenario.source.yUm, scenario.grid.domainHeightUm, ny)), 2, ny - 3),
      x2: scenario.source.type === "plane-wave" ? clampInt(Math.round(nx * 0.18), 2, nx - 3) : undefined,
      y2: scenario.source.type === "plane-wave" ? ny - 18 : undefined,
      amplitude: 0.45,
      periodSteps: 28,
      pulseCenterStep: 30,
      pulseWidthSteps: 12
    }
  ];
  const objects: Fdtd2dObject[] = [];
  const mappedObjects: Fdtd2dSimulationBuilderHandoff["mappedObjects"] = [];
  const blocked: Fdtd2dSimulationBuilderHandoff["blocked"] = [];
  const warnings: SolverWarning[] = [];
  for (const element of orderedSimulationBuilderElements(scenario.elements)) {
    const rect = rectFromBuilderElement(element, scenario, nx, ny);
    if (element.kind === "finite-transparent-block") {
      const object = { ...rect, id: element.id, label: element.label, kind: "dielectric-rectangle" as const, epsilonR: Math.pow(element.materialIndex ?? 1.5, 2) };
      objects.push(object);
      mappedObjects.push({ sourceId: element.id, objectId: object.id, kind: object.kind });
    } else if (element.kind === "finite-absorbing-block") {
      const object = { ...rect, id: element.id, label: element.label, kind: "absorbing-rectangle" as const, epsilonR: Math.max(1, element.materialIndex ?? 1.2), sigma: Math.max(0.02, (element.absorptionCoefficientPerM ?? 5000) / 100000) };
      objects.push(object);
      mappedObjects.push({ sourceId: element.id, objectId: object.id, kind: object.kind });
    } else if (element.kind === "finite-reflective-plate") {
      const object = { ...rect, id: element.id, label: element.label, kind: "pec-block" as const };
      objects.push(object);
      mappedObjects.push({ sourceId: element.id, objectId: object.id, kind: object.kind });
    } else if (element.kind === "finite-aperture-blocker") {
      if ((element.apertureShape ?? "rectangular-aperture") === "opaque-blocker") {
        const object = { ...rect, id: element.id, label: element.label, kind: "pec-block" as const };
        objects.push(object);
        mappedObjects.push({ sourceId: element.id, objectId: object.id, kind: object.kind });
      } else {
        const object = {
          ...rect,
          id: element.id,
          label: element.label,
          kind: "slit-screen" as const,
          apertureWidth: clampInt(Math.round(((element.apertureHeightUm ?? element.apertureWidthUm ?? 2) / Math.max(1, scenario.grid.domainHeightUm)) * ny), 4, Math.max(4, rect.height - 2)),
          apertureCenterY: rect.y + Math.round(rect.height / 2)
        };
        objects.push(object);
        mappedObjects.push({ sourceId: element.id, objectId: object.id, kind: object.kind });
        warnings.push({ code: "fdtd2d.handoff.apertureQualitative", message: `${element.label} maps to a qualitative 2D slit/screen diagnostic only.`, elementId: element.id });
      }
    } else if (element.kind === "curved-material-lens" || element.kind === "finite-metal-aperture") {
      blocked.push({ id: element.id, label: element.label, reason: "curved/freeform/finite metal geometry is unsupported in the bounded L9.0 2D sandbox" });
    }
  }
  if (objects.length > grid.maxObjects) {
    warnings.push({ code: "fdtd2d.handoff.objectCap", message: "Mapped object count exceeds the L9.0 object cap; extra objects are not safe to run." });
  }
  const scene = createFdtd2dScene({
    id: `l90-handoff-${scenario.id}`,
    label: `L9.0 2D sandbox slice from ${scenario.label}`,
    grid,
    sources,
    objects: objects.slice(0, grid.maxObjects),
    monitors: [
      defaultLineMonitor(grid),
      { id: "builder-observation-line", label: "Simulation Builder observation line", kind: "line", x: clampInt(Math.round(nx * 0.86), 2, nx - 3), y: 18, x2: clampInt(Math.round(nx * 0.86), 2, nx - 3), y2: ny - 18 }
    ]
  });
  const draft = {
    schema: "emmicro.fdtd2d.simulationBuilderHandoff.v1" as const,
    scenarioId: scenario.id,
    scenarioLabel: scenario.label,
    scene,
    mappedObjects,
    blocked,
    warnings
  };
  return {
    ...draft,
    handoffHash: hashCanonical(handoffForHash(draft))
  };
}

function stepMagnetic(state: Fdtd2dState): void {
  const { nx, ny } = state.scene.grid;
  const dt = state.dtCells;
  for (let y = 0; y < ny - 1; y += 1) {
    for (let x = 0; x < nx; x += 1) {
      const idx = index2d(x, y, nx);
      state.hx[idx] = (state.hx[idx] ?? 0) - dt * ((state.ez[index2d(x, y + 1, nx)] ?? 0) - (state.ez[idx] ?? 0));
    }
  }
  for (let y = 0; y < ny; y += 1) {
    for (let x = 0; x < nx - 1; x += 1) {
      const idx = index2d(x, y, nx);
      state.hy[idx] = (state.hy[idx] ?? 0) + dt * ((state.ez[index2d(x + 1, y, nx)] ?? 0) - (state.ez[idx] ?? 0));
    }
  }
}

function stepElectric(state: Fdtd2dState): void {
  const { nx, ny } = state.scene.grid;
  const dt = state.dtCells;
  for (let y = 1; y < ny - 1; y += 1) {
    for (let x = 1; x < nx - 1; x += 1) {
      const idx = index2d(x, y, nx);
      if (state.pec[idx]) {
        state.ez[idx] = 0;
        continue;
      }
      const dHyDx = (state.hy[idx] ?? 0) - (state.hy[index2d(x - 1, y, nx)] ?? 0);
      const dHxDy = (state.hx[idx] ?? 0) - (state.hx[index2d(x, y - 1, nx)] ?? 0);
      const eps = Math.max(0.1, state.epsilonR[idx] ?? 1);
      const loss = Math.max(0, state.sigma[idx] ?? 0);
      const damping = 1 / (1 + loss * dt);
      state.ez[idx] = damping * ((state.ez[idx] ?? 0) + (dt / eps) * (dHyDx - dHxDy));
    }
  }
}

function injectSources(state: Fdtd2dState): void {
  for (const source of state.scene.sources) {
    const value = sourceValue(source, state.step);
    if (source.kind === "point") {
      addSourceAt(state, source.x, source.y, value);
    } else {
      const x1 = source.x;
      const y1 = source.y;
      const x2 = source.x2 ?? source.x;
      const y2 = source.y2 ?? source.y;
      const count = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
      for (let index = 0; index <= count; index += 1) {
        const t = index / count;
        addSourceAt(state, Math.round(x1 + (x2 - x1) * t), Math.round(y1 + (y2 - y1) * t), value / Math.sqrt(count + 1));
      }
    }
  }
}

function addSourceAt(state: Fdtd2dState, x: number, y: number, value: number): void {
  const cx = clampInt(Math.round(x), 1, state.scene.grid.nx - 2);
  const cy = clampInt(Math.round(y), 1, state.scene.grid.ny - 2);
  const idx = index2d(cx, cy, state.scene.grid.nx);
  if (!state.pec[idx]) state.ez[idx] = (state.ez[idx] ?? 0) + value;
}

function sourceValue(source: Fdtd2dSource, step: number): number {
  const phase = (2 * Math.PI * step) / Math.max(2, source.periodSteps);
  if (source.waveform === "gaussian-pulse") {
    const envelope = Math.exp(-Math.pow((step - source.pulseCenterStep) / Math.max(1, source.pulseWidthSteps), 2));
    return source.amplitude * envelope * Math.sin(phase);
  }
  return source.amplitude * Math.sin(phase);
}

function recordTraces(state: Fdtd2dState): void {
  const energy = totalFieldEnergy(state);
  state.energyTrace.push(energy);
  capTrace(state.energyTrace, state.scene.grid.maxMonitorSamples);
  for (const monitor of state.scene.monitors) {
    const trace = state.monitorTraces[monitor.id] ?? [];
    trace.push(sampleMonitor(state, monitor));
    capTrace(trace, state.scene.grid.maxMonitorSamples);
    state.monitorTraces[monitor.id] = trace;
  }
}

function totalFieldEnergy(state: Fdtd2dState): number {
  let sum = 0;
  for (let index = 0; index < state.ez.length; index += 1) {
    const ez = state.ez[index] ?? 0;
    const hx = state.hx[index] ?? 0;
    const hy = state.hy[index] ?? 0;
    sum += ez * ez + hx * hx + hy * hy;
  }
  return sum;
}

function sampleMonitor(state: Fdtd2dState, monitor: Fdtd2dMonitor): number {
  if (monitor.kind === "point") {
    return state.ez[index2d(clampInt(Math.round(monitor.x), 0, state.scene.grid.nx - 1), clampInt(Math.round(monitor.y), 0, state.scene.grid.ny - 1), state.scene.grid.nx)] ?? 0;
  }
  const x1 = monitor.x;
  const y1 = monitor.y;
  const x2 = monitor.x2 ?? monitor.x;
  const y2 = monitor.y2 ?? monitor.y;
  const count = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
  let sum = 0;
  for (let index = 0; index <= count; index += 1) {
    const t = index / count;
    const x = clampInt(Math.round(x1 + (x2 - x1) * t), 0, state.scene.grid.nx - 1);
    const y = clampInt(Math.round(y1 + (y2 - y1) * t), 0, state.scene.grid.ny - 1);
    sum += state.ez[index2d(x, y, state.scene.grid.nx)] ?? 0;
  }
  return sum / (count + 1);
}

function capTrace(trace: number[], maxSamples: number): void {
  if (trace.length > maxSamples) trace.splice(0, trace.length - maxSamples);
}

function applyBoundaryDamping(state: Fdtd2dState): void {
  const { nx, ny, boundaryCells } = state.scene.grid;
  const width = Math.max(0, Math.floor(boundaryCells));
  for (let y = 0; y < ny; y += 1) {
    for (let x = 0; x < nx; x += 1) {
      const distance = Math.min(x, y, nx - 1 - x, ny - 1 - y);
      if (distance >= width) continue;
      const strength = Math.pow((width - distance) / Math.max(1, width), 2);
      state.sigma[index2d(x, y, nx)] = Math.max(state.sigma[index2d(x, y, nx)] ?? 0, 0.03 + 0.18 * strength);
      state.material[index2d(x, y, nx)] = 4;
    }
  }
}

function applyFdtd2dObjects(state: Fdtd2dState, objects: Fdtd2dObject[]): void {
  for (const object of objects) {
    if (object.kind === "slit-screen") {
      applySlitScreen(state, object);
      continue;
    }
    const x0 = clampInt(Math.floor(object.x), 0, state.scene.grid.nx - 1);
    const y0 = clampInt(Math.floor(object.y), 0, state.scene.grid.ny - 1);
    const x1 = clampInt(Math.ceil(object.x + object.width), 0, state.scene.grid.nx);
    const y1 = clampInt(Math.ceil(object.y + object.height), 0, state.scene.grid.ny);
    for (let y = y0; y < y1; y += 1) {
      for (let x = x0; x < x1; x += 1) {
        const idx = index2d(x, y, state.scene.grid.nx);
        if (object.kind === "dielectric-rectangle") {
          state.epsilonR[idx] = Math.max(1, object.epsilonR ?? 2.25);
          state.material[idx] = 1;
        } else if (object.kind === "absorbing-rectangle") {
          state.epsilonR[idx] = Math.max(1, object.epsilonR ?? 1.3);
          state.sigma[idx] = Math.max(state.sigma[idx] ?? 0, object.sigma ?? 0.08);
          state.material[idx] = 2;
        } else {
          state.pec[idx] = 1;
          state.material[idx] = 3;
        }
      }
    }
  }
}

function applySlitScreen(state: Fdtd2dState, object: Fdtd2dObject): void {
  const x0 = clampInt(Math.floor(object.x), 0, state.scene.grid.nx - 1);
  const x1 = clampInt(Math.ceil(object.x + object.width), 0, state.scene.grid.nx);
  const y0 = clampInt(Math.floor(object.y), 0, state.scene.grid.ny - 1);
  const y1 = clampInt(Math.ceil(object.y + object.height), 0, state.scene.grid.ny);
  const apertureCenter = object.apertureCenterY ?? object.y + object.height / 2;
  const apertureHalf = Math.max(1, (object.apertureWidth ?? 12) / 2);
  for (let y = y0; y < y1; y += 1) {
    const insideAperture = Math.abs(y - apertureCenter) <= apertureHalf;
    for (let x = x0; x < x1; x += 1) {
      if (insideAperture) continue;
      const idx = index2d(x, y, state.scene.grid.nx);
      state.pec[idx] = 1;
      state.material[idx] = 3;
    }
  }
}

function fixtureMetrics(kind: Fdtd2dFixtureKind, result: Fdtd2dRunResult): Record<string, number> {
  const centerEnergy = result.snapshot.totalEnergy;
  if (kind === "dielectric-interface") {
    return {
      totalEnergy: centerEnergy,
      fresnelR: fresnelReflectanceNormal(1, 1.5),
      transmittedMonitorRms: rms(result.monitorTraces["transmitted-interface"] ?? [])
    };
  }
  if (kind === "pec-wall") {
    return {
      totalEnergy: centerEnergy,
      behindWallRms: rms(result.monitorTraces["behind-wall"] ?? []),
      sourceSideRms: rms(result.monitorTraces["center-line"] ?? [])
    };
  }
  if (kind === "absorbing-slab") {
    return {
      totalEnergy: centerEnergy,
      afterAbsorberRms: rms(result.monitorTraces["after-absorber"] ?? []),
      sourceSideRms: rms(result.monitorTraces["center-line"] ?? [])
    };
  }
  if (kind === "slit-diagnostic") {
    return {
      totalEnergy: centerEnergy,
      afterSlitRms: rms(result.monitorTraces["after-slit"] ?? []),
      sourceSideRms: rms(result.monitorTraces["center-line"] ?? [])
    };
  }
  return {
    totalEnergy: centerEnergy,
    centerLineRms: rms(result.monitorTraces["center-line"] ?? [])
  };
}

function fixtureReference(kind: Fdtd2dFixtureKind): string {
  if (kind === "pec-wall") return "PEC-like wall should reflect fields and keep low transmitted field behind the blocker.";
  if (kind === "dielectric-interface") return "Dielectric interface is compared qualitatively to normal-incidence Fresnel reflectance R=((n1-n2)/(n1+n2))^2.";
  if (kind === "absorbing-slab") return "Absorbing slab should attenuate downstream monitor amplitude; Beer-Lambert-style interpretation is qualitative in L9.0.";
  if (kind === "slit-diagnostic") return "Qualitative 2D FDTD slit diagnostic: downstream spreading/diffraction is expected, not certified agreement.";
  return "Empty-space pulse should propagate with finite fields and boundary damping loss.";
}

function validationStatusForFixture(kind: Fdtd2dFixtureKind, metrics: Record<string, number>, energyFinite: boolean, maxAbsEz: number, warnings: SolverWarning[]): SimulationBuilderValidationStatus {
  if (!energyFinite || !Number.isFinite(maxAbsEz) || maxAbsEz > 1e6) return "fail";
  if (kind === "pec-wall" && (metrics.behindWallRms ?? 1) > Math.max(0.25, (metrics.sourceSideRms ?? 0) * 0.9)) return "warning";
  if (kind === "absorbing-slab" && (metrics.afterAbsorberRms ?? 1) > Math.max(0.25, (metrics.sourceSideRms ?? 0) * 1.1)) return "warning";
  if (warnings.some((warning) => warning.code.includes("blocked"))) return "fail";
  return warnings.length > 0 ? "warning" : "pass";
}

function defaultPointSource(grid: Fdtd2dGrid): Fdtd2dSource {
  return {
    id: "source-point",
    label: "Continuous point source",
    kind: "point",
    waveform: "continuous",
    x: Math.round(grid.nx * 0.28),
    y: Math.round(grid.ny * 0.5),
    amplitude: 0.45,
    periodSteps: 28,
    pulseCenterStep: 30,
    pulseWidthSteps: 12
  };
}

function defaultLineMonitor(grid: Fdtd2dGrid): Fdtd2dMonitor {
  return {
    id: "center-line",
    label: "Center monitor line",
    kind: "line",
    x: Math.round(grid.nx * 0.66),
    y: Math.round(grid.ny * 0.2),
    x2: Math.round(grid.nx * 0.66),
    y2: Math.round(grid.ny * 0.8)
  };
}

function sanitizeGrid(grid: Fdtd2dGrid): Fdtd2dGrid {
  return {
    nx: clampInt(Math.floor(grid.nx), 8, 4096),
    ny: clampInt(Math.floor(grid.ny), 8, 4096),
    dxUm: Math.max(0.001, grid.dxUm),
    cfl: grid.cfl,
    boundaryCells: clampInt(Math.floor(grid.boundaryCells), 0, 64),
    maxStepsPerRun: clampInt(Math.floor(grid.maxStepsPerRun), 1, 10000),
    maxObjects: clampInt(Math.floor(grid.maxObjects), 1, 128),
    maxMonitorSamples: clampInt(Math.floor(grid.maxMonitorSamples), 16, 50000)
  };
}

function rectFromBuilderElement(element: SimulationBuilderElement, scenario: SimulationBuilderScenario, nx: number, ny: number): Omit<Fdtd2dObject, "id" | "label" | "kind"> {
  const width = clampInt(Math.max(2, Math.round(((element.thicknessUm ?? 1) / Math.max(1, (scenario.grid.zEndMm - scenario.grid.zStartMm) * 1000)) * nx)), 2, Math.max(2, nx - 4));
  const height = clampInt(Math.max(3, Math.round(((element.heightUm ?? element.widthUm ?? 4) / Math.max(1, scenario.grid.domainHeightUm)) * ny)), 3, Math.max(3, ny - 4));
  const centerX = clampInt(Math.round(((element.zMm - scenario.grid.zStartMm) / Math.max(0.001, scenario.grid.zEndMm - scenario.grid.zStartMm)) * nx), 2, nx - 3);
  const centerY = clampInt(Math.round(yFromUm(element.yUm ?? 0, scenario.grid.domainHeightUm, ny)), 2, ny - 3);
  return {
    x: clampInt(centerX - Math.round(width / 2), 1, nx - width - 1),
    y: clampInt(centerY - Math.round(height / 2), 1, ny - height - 1),
    width,
    height
  };
}

function yFromUm(yUm: number, domainHeightUm: number, ny: number): number {
  return ny / 2 + (yUm / Math.max(1, domainHeightUm)) * ny;
}

function index2d(x: number, y: number, nx: number): number {
  return y * nx + x;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function snapshotStride(grid: Fdtd2dGrid): number {
  return Math.max(1, Math.ceil(Math.sqrt((grid.nx * grid.ny) / 4096)));
}

function rms(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length);
}

function sceneForHash(scene: Omit<Fdtd2dScene, "sceneHash">): unknown {
  return {
    schema: scene.schema,
    id: scene.id,
    polarization: scene.polarization,
    grid: scene.grid,
    sources: scene.sources,
    objects: scene.objects,
    monitors: scene.monitors,
    boundary: scene.boundary
  };
}

function snapshotForHash(snapshot: Omit<Fdtd2dSnapshot, "snapshotHash">): unknown {
  return {
    schema: snapshot.schema,
    sceneHash: snapshot.sceneHash,
    step: snapshot.step,
    nx: snapshot.nx,
    ny: snapshot.ny,
    maxAbsEz: roundHashNumber(snapshot.maxAbsEz),
    totalEnergy: roundHashNumber(snapshot.totalEnergy),
    samples: snapshot.samples.slice(0, 256).map((sample) => ({
      x: sample.x,
      y: sample.y,
      ez: roundHashNumber(sample.ez),
      intensity: roundHashNumber(sample.intensity),
      material: sample.material
    }))
  };
}

function runResultForHash(result: Omit<Fdtd2dRunResult, "resultHash">): unknown {
  return {
    schema: result.schema,
    sceneHash: result.scene.sceneHash,
    stepsCompleted: result.stepsCompleted,
    snapshotHash: result.snapshot.snapshotHash,
    finalEnergy: roundHashNumber(result.energyTrace[result.energyTrace.length - 1] ?? 0),
    monitorIds: Object.keys(result.monitorTraces),
    status: result.status,
    warningCodes: result.warnings.map((warning) => warning.code)
  };
}

function reportForHash(report: Omit<Fdtd2dReport, "reportHash">): unknown {
  return {
    schema: report.schema,
    sceneHash: report.sceneHash,
    resultHash: report.resultHash,
    stepsCompleted: report.stepsCompleted,
    finalEnergy: roundHashNumber(report.finalEnergy),
    monitorIds: report.monitorIds,
    status: report.status,
    warningCodes: report.warnings.map((warning) => warning.code)
  };
}

function handoffForHash(handoff: Omit<Fdtd2dSimulationBuilderHandoff, "handoffHash">): unknown {
  return {
    schema: handoff.schema,
    scenarioId: handoff.scenarioId,
    sceneHash: handoff.scene.sceneHash,
    mappedObjects: handoff.mappedObjects,
    blocked: handoff.blocked,
    warningCodes: handoff.warnings.map((warning) => warning.code)
  };
}

function roundHashNumber(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Number(value.toPrecision(8));
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

function hashCanonical(value: unknown): string {
  return fnv1a64(stableStringify(value));
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function formatNumber(value: number): string {
  if (value === 0) return "0";
  if (!Number.isFinite(value)) return "n/a";
  if (Math.abs(value) >= 1000 || Math.abs(value) < 0.001) return value.toExponential(4);
  return value.toPrecision(6);
}
