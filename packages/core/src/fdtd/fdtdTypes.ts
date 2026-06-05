import type {
  SimulationBuilderCapabilityStatus,
  SimulationBuilderElement,
  SimulationBuilderScenario,
  SimulationBuilderTargetKind,
  SimulationBuilderValidationStatus
} from "../maxwell/simulationBuilder";
import type { SolverWarning } from "../solvers/Solver";

export type FdtdExportStatus = "ready" | "warning" | "blocked";
export type FdtdSourceKind = "plane-wave" | "point-source";
export type FdtdGeometryKind = "transparent-slab" | "absorbing-slab" | "mirror-scaffold";
export type FdtdMonitorKind = "flux-plane" | "field-slice";

export type FdtdExportReadiness = {
  status: FdtdExportStatus;
  supported: Array<{ id: string; label: string; evidence: string }>;
  unsupported: Array<{ id: string; label: string; reason: string; status: SimulationBuilderCapabilityStatus }>;
  warnings: SolverWarning[];
  estimatedCells: number;
  gridSpacingNm: number;
  sceneHash: string;
};

export type FdtdMaterial = {
  id: string;
  label: string;
  refractiveIndex: { n: number; k: number };
  absorptionCoefficientPerM?: number;
  materialHash: string;
};

export type FdtdGeometry = {
  id: string;
  kind: FdtdGeometryKind;
  label: string;
  centerUm: { x: number; y: number; z: number };
  sizeUm: { x: number; y: number; z: number };
  materialId: string;
  sourceElementId?: string;
};

export type FdtdMonitor = {
  id: string;
  kind: FdtdMonitorKind;
  label: string;
  centerUm: { x: number; y: number; z: number };
  sizeUm: { x: number; y: number; z: number };
  normal: "+z" | "-z" | "+x" | "-x" | "+y" | "-y";
  fields?: Array<"Ex" | "Ey" | "Ez" | "Hx" | "Hy" | "Hz" | "intensity">;
};

export type FdtdSceneManifest = {
  schema: "emmicro.fdtd.sceneManifest.v1";
  id: string;
  label: string;
  sourceScenarioId: string;
  sourceScenarioHash: string;
  targetKind: SimulationBuilderTargetKind;
  units: "um";
  grid: {
    domainWidthUm: number;
    domainHeightUm: number;
    zStartUm: number;
    zEndUm: number;
    gridSpacingNm: number;
    pointsPerWavelength: number;
    estimatedCells: number;
  };
  source: {
    kind: FdtdSourceKind;
    wavelengthUm: number;
    centerUm: { x: number; y: number; z: number };
    direction: "+z" | "-z";
    component: "Ex" | "Ey" | "Ez";
  };
  materials: FdtdMaterial[];
  geometry: FdtdGeometry[];
  monitors: FdtdMonitor[];
  boundaries: {
    pmlThicknessUm: number;
    note: string;
  };
  readiness: FdtdExportReadiness;
  limitations: string[];
  manifestHash: string;
};

export type FdtdMeepScriptExport = {
  schema: "emmicro.fdtd.meepScript.v1";
  manifestHash: string;
  sourceScenarioHash: string;
  scriptHash: string;
  python: string;
  warnings: SolverWarning[];
};

export type FdtdRunReceipt = {
  schema: "emmicro.fdtd.runReceipt.v1";
  runId: string;
  sourceScenarioHash: string;
  manifestHash: string;
  scriptHash: string;
  tool: {
    name: "meep" | "example-fixture" | "external-fdtd";
    version: string;
    postprocessorVersion: string;
  };
  createdAtIso: string;
  settings: {
    resolution: number;
    until: number;
    pmlThicknessUm: number;
  };
  warnings: SolverWarning[];
  receiptHash: string;
};

export type FdtdFluxSummary = {
  schema: "emmicro.fdtd.fluxSummary.v1";
  runId: string;
  sourceScenarioHash: string;
  manifestHash: string;
  incidentFlux: number;
  reflectedFlux: number;
  transmittedFlux: number;
  absorbedFlux: number;
  reflectance: number;
  transmittance: number;
  absorbance: number;
  energyBalance: number;
  monitors: Array<{ id: string; flux: number }>;
  warnings: SolverWarning[];
  fluxHash: string;
};

export type FdtdFieldSliceSample = {
  xUm: number;
  zUm: number;
  value: number;
  intensity: number;
};

export type FdtdFieldSlice = {
  schema: "emmicro.fdtd.fieldSlice.v1";
  id: string;
  sourceScenarioHash: string;
  manifestHash: string;
  component: "Ex" | "Ey" | "Ez" | "intensity";
  plane: "xz" | "xy" | "yz";
  samples: FdtdFieldSliceSample[];
  xCount: number;
  zCount: number;
  minIntensity: number;
  maxIntensity: number;
  sliceHash: string;
};

export type FdtdImportedRun = {
  receipt: FdtdRunReceipt;
  flux: FdtdFluxSummary;
  fieldSlice: FdtdFieldSlice;
  warnings: SolverWarning[];
};

export type FdtdValidationReport = {
  schema: "emmicro.fdtd.validationReport.v1";
  sourceScenarioHash: string;
  manifestHash: string;
  scriptHash: string;
  targetKind: SimulationBuilderTargetKind;
  expected: { reflectance: number; transmittance: number; absorbance: number };
  imported: { reflectance: number; transmittance: number; absorbance: number };
  residuals: { reflectance: number; transmittance: number; absorbance: number; energyBalance: number };
  energyBalance: number;
  status: SimulationBuilderValidationStatus;
  warnings: SolverWarning[];
  reportHash: string;
};

export type FdtdExampleBundle = {
  manifest: FdtdSceneManifest;
  script: FdtdMeepScriptExport;
  receipt: FdtdRunReceipt;
  flux: FdtdFluxSummary;
  fieldSlice: FdtdFieldSlice;
  fieldSliceCsv: string;
  imported: FdtdImportedRun;
  validation: FdtdValidationReport;
};

export type FdtdExportBundle = {
  manifest: FdtdSceneManifest;
  script: FdtdMeepScriptExport;
};

export type FdtdScenarioExportInput = {
  scenario: SimulationBuilderScenario;
  runUntil?: number;
};
