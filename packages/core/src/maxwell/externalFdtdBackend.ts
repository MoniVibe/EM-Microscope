import type { MaxwellScene3D } from "./maxwell3dTypes";
import { validateMaxwellScene3D } from "./maxwell3dValidation";
import type { MaxwellProblemValidation } from "./maxwellProblem";
import type { MaxwellSolveResult3D } from "./maxwellResult";
import {
  UnsupportedBackendError,
  type MaxwellSolverBackend,
  type MaxwellSolverCapabilities,
  type MaxwellSolverReceipt
} from "./solverBackend";

export const externalFdtdBackendCapabilities: MaxwellSolverCapabilities = {
  availability: "scaffold-only",
  dimensions: ["3d"],
  geometry: ["voxel"],
  steadyState: true,
  timeDomain: true,
  wavelengths: "single",
  polarizations: ["s", "p"],
  supportsMaterialProvenance: true,
  supportsCoatingStacks: false,
  supportsFieldMonitors: true,
  supportsVolumetricFields: true,
  supportsApertures: false,
  supportsCurvedSurfaces: false,
  supports3dGeometry: true,
  supportsFEM: false,
  supportsFDTD: true,
  supportsBEM: false,
  supportsRCWA: false
};

export class ExternalFdtdBackend implements MaxwellSolverBackend<MaxwellScene3D, MaxwellSolveResult3D> {
  readonly id = "external-fdtd" as const;
  readonly label = "ExternalFdtdBackend";
  readonly method = "fdtd" as const;
  readonly solverVersion = "emmicro.external-fdtd-scaffold.l6.0";

  capabilities(): MaxwellSolverCapabilities {
    return {
      ...externalFdtdBackendCapabilities,
      dimensions: [...externalFdtdBackendCapabilities.dimensions],
      geometry: [...externalFdtdBackendCapabilities.geometry],
      polarizations: [...externalFdtdBackendCapabilities.polarizations]
    };
  }

  validateProblem(problem: MaxwellScene3D): MaxwellProblemValidation {
    const validation = validateMaxwellScene3D(problem);
    return {
      ...validation,
      warnings: [
        ...validation.warnings,
        {
          code: "maxwell.backend.externalFdtdScaffoldOnly",
          message:
            "ExternalFdtdBackend is registered for L6.0 schema/export only; it is not installed or executable as a 3D Maxwell solver in the browser app."
        }
      ]
    };
  }

  solve(problem: MaxwellScene3D): MaxwellSolveResult3D {
    const validation = this.validateProblem(problem);
    const validationDetail = validation.valid ? "" : ` Validation errors: ${validation.errors.join("; ")}`;
    throw new UnsupportedBackendError(`ExternalFdtdBackend is scaffolded but not executable in L6.0.${validationDetail}`);
  }
}

export const externalFdtdBackend = new ExternalFdtdBackend();

export function externalFdtdSolverReceipt(): MaxwellSolverReceipt {
  return {
    id: "external-fdtd",
    label: "ExternalFdtdBackend",
    method: "fdtd",
    solverVersion: "emmicro.external-fdtd-scaffold.l6.0",
    capabilities: externalFdtdBackend.capabilities(),
    unsupported: [
      "in-app 3D Maxwell execution",
      "validated Meep workflow execution",
      "FEM",
      "BEM",
      "RCWA",
      "CAD import",
      "curved lenses",
      "aperture diffraction solve",
      "sensor electrical transport",
      "digital twin calibration",
      "adjoint/topology optimization",
      "GPU/HPC job runner"
    ]
  };
}
