import type { SolverWarning } from "../solvers/Solver";

export type MaxwellProblemVersion = "emmicro.maxwell.problem.v1";
export type MaxwellProblemKind = "planar-stack";
export type MaxwellProblemBackendId = "planar-tmm";
export type MaxwellProblemPolarization = "te" | "tm" | "unpolarized";

export type MaxwellSourceSpec = {
  kind: "plane-wave";
  wavelengthNm?: number;
  angleDeg: number;
  polarization: MaxwellProblemPolarization;
};

export type MaxwellMonitorSpec = {
  id: string;
  kind: "planar-field";
  label: string;
};

export type MaxwellProblemProvenance = {
  label: string;
  sourceStackId?: string;
  sourceStackLabel?: string;
  sourceResultHash?: string;
  limitations: string[];
};

export type MaxwellProblemValidation = {
  valid: boolean;
  errors: string[];
  warnings: SolverWarning[];
};

export interface MaxwellProblem {
  id: string;
  kind: MaxwellProblemKind;
  backendId: MaxwellProblemBackendId;
  version: MaxwellProblemVersion;
  createdAt?: string;
  materialCatalogHash?: string;
  source: MaxwellSourceSpec;
  monitors: MaxwellMonitorSpec[];
  provenance: MaxwellProblemProvenance;
}
export interface PlanarStackProblem extends MaxwellProblem {
  kind: "planar-stack";
  backendId: "planar-tmm";
  stack: {
    label: string;
    incidentMaterialId: string;
    substrateMaterialId: string;
    layers: Array<{
      id: string;
      label: string;
      materialId: string;
      thicknessNm: number;
    }>;
  };
  sweep: {
    wavelengthsNm: number[];
    angleDeg: number;
    polarization: MaxwellProblemPolarization;
  };
}
