import type { MaxwellProblem, MaxwellProblemValidation } from "./maxwellProblem";
import type { MaxwellSolveResult } from "./maxwellResult";

export type MaxwellSolverBackendId = "planar-tmm" | "external-fdtd";
export type MaxwellSolverMethod = "planar-tmm" | "rcwa" | "fdtd" | "fem-frequency-domain" | "bem-frequency-domain";
export type MaxwellSolverDimension = "1d-planar" | "2d" | "3d";
export type MaxwellSolverGeometry = "planar-layers" | "periodic" | "voxel" | "mesh" | "surface-mesh";
export type MaxwellSolverAvailability = "executable" | "scaffold-only" | "not-installed";

export interface MaxwellSolverCapabilities {
  availability: MaxwellSolverAvailability;
  dimensions: MaxwellSolverDimension[];
  geometry: MaxwellSolverGeometry[];
  steadyState: boolean;
  timeDomain: boolean;
  wavelengths: "single" | "sweep";
  polarizations: Array<"te" | "tm" | "s" | "p" | "unpolarized">;
  supportsMaterialProvenance: boolean;
  supportsCoatingStacks: boolean;
  supportsFieldMonitors: boolean;
  supportsVolumetricFields: boolean;
  supportsApertures: boolean;
  supportsCurvedSurfaces: boolean;
  supports3dGeometry: boolean;
  supportsFEM: boolean;
  supportsFDTD: boolean;
  supportsBEM: boolean;
  supportsRCWA: boolean;
}
export type MaxwellSolverReceipt = {
  id: MaxwellSolverBackendId;
  label: string;
  method: MaxwellSolverMethod;
  solverVersion: string;
  capabilities: MaxwellSolverCapabilities;
  unsupported: string[];
};

export interface MaxwellSolverBackend<
  TProblem = MaxwellProblem,
  TResult extends MaxwellSolveResult = MaxwellSolveResult,
  TOptions = unknown
> {
  readonly id: MaxwellSolverBackendId;
  readonly label: string;
  readonly method: MaxwellSolverMethod;
  readonly solverVersion: string;

  capabilities(): MaxwellSolverCapabilities;

  validateProblem(problem: TProblem): MaxwellProblemValidation;

  solve(problem: TProblem, options?: TOptions): TResult;
}

export type AnyMaxwellSolverBackend = MaxwellSolverBackend<any, MaxwellSolveResult, any>;

export class UnsupportedBackendError extends Error {
  readonly code = "maxwell.backend.unsupported";

  constructor(message: string) {
    super(message);
    this.name = "UnsupportedBackendError";
  }
}

export const planarTmmBackendCapabilities: MaxwellSolverCapabilities = {
  availability: "executable",
  dimensions: ["1d-planar"],
  geometry: ["planar-layers"],
  steadyState: true,
  timeDomain: false,
  wavelengths: "sweep",
  polarizations: ["te", "tm", "s", "p", "unpolarized"],
  supportsMaterialProvenance: true,
  supportsCoatingStacks: true,
  supportsFieldMonitors: true,
  supportsVolumetricFields: false,
  supportsApertures: false,
  supportsCurvedSurfaces: false,
  supports3dGeometry: false,
  supportsFEM: false,
  supportsFDTD: false,
  supportsBEM: false,
  supportsRCWA: false
};

export function planarTmmSolverReceipt(): MaxwellSolverReceipt {
  return {
    id: "planar-tmm",
    label: "PlanarTmmBackend",
    method: "planar-tmm",
    solverVersion: "emmicro.planar-tmm-backend.l5.8",
    capabilities: cloneCapabilities(planarTmmBackendCapabilities),
    unsupported: [
      "3D geometry",
      "apertures",
      "curved surfaces",
      "FEM",
      "FDTD",
      "BEM",
      "RCWA",
      "arbitrary CAD",
      "volumetric E/H fields",
      "sensor electrical transport"
    ]
  };
}

function cloneCapabilities(capabilities: MaxwellSolverCapabilities): MaxwellSolverCapabilities {
  return {
    ...capabilities,
    dimensions: [...capabilities.dimensions],
    geometry: [...capabilities.geometry],
    polarizations: [...capabilities.polarizations]
  };
}
