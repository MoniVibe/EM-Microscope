import type { SolverWarning } from "../solvers/Solver";
import type { CoatingStackRunResult } from "./coatingStack";
import type { FieldDatasetManifest, FieldVolume3D, FluxMonitorResult } from "./fieldDatasetManifest";
import type { MaterialCatalogReference } from "./materialCatalog";
import type { MaxwellSolverMethod, MaxwellSolverReceipt } from "./solverBackend";

export interface MaxwellSolveResult {
  problemId: string;
  backendId: string;
  backendMethod: MaxwellSolverMethod;
  solverVersion: string;
  resultHash: string;
  metrics: {
    reflectance?: number;
    transmittance?: number;
    absorbance?: number;
    energyBalanceError?: number;
  };
  warnings: SolverWarning[];
  receipts: {
    materials: MaterialCatalogReference[];
    solver: MaxwellSolverReceipt;
    uncertainty?: unknown;
  };
}
export type PlanarStackSolveSample = {
  wavelengthNm: number;
  angleDeg: number;
  polarization: "te" | "tm" | "unpolarized";
  reflectance: number;
  transmittance: number;
  absorbance: number;
  energyBalanceError: number;
  coatingStackResults: CoatingStackRunResult[];
  resultHashes: string[];
};

export interface PlanarStackSolveResult extends MaxwellSolveResult {
  backendId: "planar-tmm";
  backendMethod: "planar-tmm";
  samples: PlanarStackSolveSample[];
  coatingStackResult?: CoatingStackRunResult;
}

export interface MaxwellSolveResult3D extends MaxwellSolveResult {
  backendId: "external-fdtd";
  backendMethod: "fdtd";
  sceneHash: string;
  fieldDatasetManifest?: FieldDatasetManifest;
  fieldVolumes: FieldVolume3D[];
  fluxMonitors: FluxMonitorResult[];
  provenance: {
    label: "L6.0 external FDTD scaffold";
    limitations: string[];
  };
}
