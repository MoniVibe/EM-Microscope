import { describe, expect, it } from "vitest";
import { runRobustCoatingSearch } from "./coatingRobustSearch";
import { runCoatingSearch, type CoatingSearchSpec } from "./coatingSearch";
import { l41DefaultCoatingStack, runCoatingStack } from "./coatingStack";
import { createMinimalMaxwellScene3D } from "./maxwell3dValidation";
import { planarTmmBackend, solveCoatingStackWithPlanarTmmBackend } from "./planarTmmBackend";
import {
  getMaxwellSolverBackend,
  isMaxwellSolverMethodAvailable,
  listExecutableMaxwellSolverBackends,
  listMaxwellSolverBackends,
  listScaffoldedMaxwellSolverBackends,
  unavailableMaxwellSolverMethods
} from "./solverRegistry";
import { UnsupportedBackendError } from "./solverBackend";

describe("External FDTD backend scaffold", () => {
  it("registers as scaffold-only/unavailable", () => {
    const backend = getMaxwellSolverBackend("external-fdtd");

    expect(backend.label).toBe("ExternalFdtdBackend");
    expect(backend.method).toBe("fdtd");
    expect(backend.capabilities().availability).toBe("scaffold-only");
    expect(listMaxwellSolverBackends().map((candidate) => candidate.id)).toEqual(["planar-tmm", "external-fdtd"]);
    expect(listExecutableMaxwellSolverBackends().map((candidate) => candidate.id)).toEqual(["planar-tmm"]);
    expect(listScaffoldedMaxwellSolverBackends().map((candidate) => candidate.id)).toEqual(["external-fdtd"]);
    expect(isMaxwellSolverMethodAvailable("fdtd")).toBe(false);
    expect(unavailableMaxwellSolverMethods()).toEqual(["rcwa", "fdtd", "fem-frequency-domain", "bem-frequency-domain"]);
  });

  it("advertises 3D FDTD capabilities without claiming execution", () => {
    const capabilities = getMaxwellSolverBackend("external-fdtd").capabilities();

    expect(capabilities.dimensions).toEqual(["3d"]);
    expect(capabilities.geometry).toEqual(["voxel"]);
    expect(capabilities.supports3dGeometry).toBe(true);
    expect(capabilities.supportsFDTD).toBe(true);
    expect(capabilities.supportsVolumetricFields).toBe(true);
    expect(capabilities.supportsApertures).toBe(false);
    expect(capabilities.supportsCurvedSurfaces).toBe(false);
    expect(capabilities.availability).toBe("scaffold-only");
  });

  it("throws a clear unsupported-backend error on solve", () => {
    const backend = getMaxwellSolverBackend("external-fdtd");
    const scene = createMinimalMaxwellScene3D();

    expect(() => backend.solve(scene)).toThrow(UnsupportedBackendError);
    expect(() => backend.solve(scene)).toThrow(/not executable in L6\.0/);
  });

  it("keeps PlanarTmmBackend as the only executable backend", () => {
    const direct = runCoatingStack(l41DefaultCoatingStack);
    const backend = solveCoatingStackWithPlanarTmmBackend(l41DefaultCoatingStack);

    expect(planarTmmBackend.capabilities().availability).toBe("executable");
    expect(isMaxwellSolverMethodAvailable("planar-tmm")).toBe(true);
    expect(backend.backendId).toBe("planar-tmm");
    expect(backend.coatingStackResult?.resultHash).toBe(direct.resultHash);
    expect(backend.metrics.reflectance).toBeCloseTo(direct.tmm.reflectance, 14);
  });

  it("keeps coating search and robust correlated drift search working through PlanarTmmBackend", () => {
    const search = runCoatingSearch(basicSearchSpec());
    const robust = runRobustCoatingSearch({
      id: "l60-backend-regression-robust",
      label: "L6.0 backend regression robust search",
      nominalSearch: basicSearchSpec(),
      uncertainty: {
        thickness: { mode: "deterministic-grid", sigmaNm: 2, sigmaLevels: [-1, 0, 1], maxSamplesPerCandidate: 9 },
        model: {
          mode: "correlated-thickness",
          preset: "shared-scale",
          globalThicknessScale: { sigmaFraction: 0.01, sigmaLevels: [-1, 0, 1] },
          maxSamplesPerCandidate: 9
        }
      },
      robustObjective: { primary: "p90Score" },
      candidateLimit: 2
    });

    expect(search.solverBackend.id).toBe("planar-tmm");
    expect(search.solverBackend.capabilities.availability).toBe("executable");
    expect(robust.solverBackend.id).toBe("planar-tmm");
    expect(robust.best.uncertaintyReceipt.model).toBe("correlated-thickness");
    expect(robust.best.uncertaintyReceipt.globalThicknessScale?.sigmaFraction).toBe(0.01);
  });
});

function basicSearchSpec(): CoatingSearchSpec {
  return {
    id: "l60-backend-regression-search",
    label: "L6.0 backend regression search",
    baseStack: {
      ...l41DefaultCoatingStack,
      layers: []
    },
    wavelengthsM: [550e-9],
    anglesRad: [0],
    polarizations: ["TE"],
    candidateMaterialIds: ["mgf2", "sio2"],
    layerCount: { min: 1, max: 2 },
    thicknessM: { min: 70e-9, max: 120e-9, step: 25e-9 },
    constraints: {
      disallowAdjacentSameMaterial: true,
      maxTotalThicknessM: 220e-9
    },
    objective: {
      terms: [{ metric: "reflectance", direction: "minimize", weight: 1 }]
    },
    search: {
      mode: "beam",
      beamWidth: 5,
      maxCandidates: 4,
      refinementPasses: 1,
      seed: 60
    }
  };
}
