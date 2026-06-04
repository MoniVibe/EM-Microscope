import type { SolverWarning } from "../solvers/Solver";
import type { CoatingStackRunResult } from "./coatingStack";
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
