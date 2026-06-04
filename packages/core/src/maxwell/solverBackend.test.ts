import { describe, expect, it } from "vitest";
import { l41DefaultCoatingStack, runCoatingStack, type CoatingStackDefinition } from "./coatingStack";
import { runRobustCoatingSearch } from "./coatingRobustSearch";
import { runCoatingSearch, type CoatingSearchSpec } from "./coatingSearch";
import { createMaterialCatalog, listCatalogMaterials } from "./materialCatalog";
import { importMaterialPackage } from "./materialImport";
import { compileCoatingStackToPlanarStackProblem } from "./planarSceneCompiler";
import { planarTmmBackend, solveCoatingStackWithPlanarTmmBackend } from "./planarTmmBackend";
import { getMaxwellSolverBackend, isMaxwellSolverMethodAvailable, unavailableMaxwellSolverMethods } from "./solverRegistry";

describe("L5.8 solver backend boundary", () => {
  it("registers the planar TMM backend and marks future methods unavailable", () => {
    const backend = getMaxwellSolverBackend("planar-tmm");

    expect(backend.id).toBe("planar-tmm");
    expect(backend.label).toBe("PlanarTmmBackend");
    expect(backend.method).toBe("planar-tmm");
    expect(isMaxwellSolverMethodAvailable("planar-tmm")).toBe(true);
    expect(isMaxwellSolverMethodAvailable("fdtd")).toBe(false);
    expect(unavailableMaxwellSolverMethods()).toEqual(["rcwa", "fdtd", "fem-frequency-domain", "bem-frequency-domain"]);
  });

  it("reports planar-only capabilities without advertising 3D, apertures, curved surfaces, FEM, FDTD, BEM, or RCWA", () => {
    const capabilities = planarTmmBackend.capabilities();

    expect(capabilities.dimensions).toEqual(["1d-planar"]);
    expect(capabilities.geometry).toEqual(["planar-layers"]);
    expect(capabilities.supportsMaterialProvenance).toBe(true);
    expect(capabilities.supportsCoatingStacks).toBe(true);
    expect(capabilities.supportsFieldMonitors).toBe(true);
    expect(capabilities.supportsVolumetricFields).toBe(false);
    expect(capabilities.supportsApertures).toBe(false);
    expect(capabilities.supportsCurvedSurfaces).toBe(false);
    expect(capabilities.supports3dGeometry).toBe(false);
    expect(capabilities.supportsFEM).toBe(false);
    expect(capabilities.supportsFDTD).toBe(false);
    expect(capabilities.supportsBEM).toBe(false);
    expect(capabilities.supportsRCWA).toBe(false);
  });

  it("validates planar stack problems and rejects unsupported problem kinds", () => {
    const problem = compileCoatingStackToPlanarStackProblem(l41DefaultCoatingStack);
    const invalidProblem = {
      ...problem,
      kind: "voxel",
      backendId: "planar-tmm"
    } as unknown as typeof problem;
    const valid = planarTmmBackend.validateProblem(problem);
    const invalid = planarTmmBackend.validateProblem(invalidProblem);

    expect(valid.valid).toBe(true);
    expect(valid.warnings.some((warning) => warning.message.includes("not 3D Maxwell"))).toBe(true);
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.join(" ")).toContain("planar-stack");
    expect(() => planarTmmBackend.solve(invalidProblem)).toThrow(/validation failed/);
  });

  it("solves a planar stack problem through the backend and matches direct runCoatingStack R/T/A results", () => {
    const direct = runCoatingStack(l41DefaultCoatingStack);
    const backend = solveCoatingStackWithPlanarTmmBackend(l41DefaultCoatingStack);

    expect(backend.backendId).toBe("planar-tmm");
    expect(backend.receipts.solver.capabilities.dimensions).toEqual(["1d-planar"]);
    expect(backend.coatingStackResult?.resultHash).toBe(direct.resultHash);
    expect(backend.metrics.reflectance).toBeCloseTo(direct.tmm.reflectance, 14);
    expect(backend.metrics.transmittance).toBeCloseTo(direct.tmm.transmittance, 14);
    expect(backend.metrics.absorbance).toBeCloseTo(direct.tmm.absorbance, 14);
    expect(backend.metrics.energyBalanceError).toBeCloseTo(direct.tmm.energyBalanceError, 14);
  });

  it("preserves imported material hashes and pack hashes in backend receipts", () => {
    const { catalog, materialId } = importedCatalogFixture();
    const backend = solveCoatingStackWithPlanarTmmBackend(importedStack(materialId), {
      materialCatalog: catalog,
      materialResolution: { extrapolation: "clamp" }
    });

    expect(backend.receipts.materials.some((reference) => reference.materialId === materialId)).toBe(true);
    expect(backend.receipts.materials.some((reference) => reference.origin === "imported" && reference.sourcePackHash)).toBe(true);
    expect(backend.coatingStackResult?.materialCatalogRefs.some((reference) => reference.materialHash)).toBe(true);
  });

  it("returns deterministic backend result hashes", () => {
    const a = solveCoatingStackWithPlanarTmmBackend(l41DefaultCoatingStack);
    const b = solveCoatingStackWithPlanarTmmBackend(structuredClone(l41DefaultCoatingStack));

    expect(a.resultHash).toBe(b.resultHash);
  });

  it("keeps coating search deterministic while exposing backend receipts", () => {
    const a = runCoatingSearch(basicSearchSpec());
    const b = runCoatingSearch(structuredClone(basicSearchSpec()));

    expect(a.solverBackend.id).toBe("planar-tmm");
    expect(a.solverBackend.capabilities.supports3dGeometry).toBe(false);
    expect(a.best.resultHash).toBe(b.best.resultHash);
  });

  it("preserves robust uncertainty receipts when robust search runs through the backend", () => {
    const result = runRobustCoatingSearch({
      id: "l58-backend-robust-test",
      label: "L5.8 backend robust test",
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
      candidateLimit: 3
    });

    expect(result.solverBackend.id).toBe("planar-tmm");
    expect(result.best.uncertaintyReceipt.model).toBe("correlated-thickness");
    expect(result.best.uncertaintyReceipt.globalThicknessScale?.sigmaFraction).toBe(0.01);
    expect(result.best.comparison?.receipt.legacyModel).toBe("thickness-only");
    expect(result.best.samples[0]?.perturbations[0]?.drivers).toBeDefined();
  });

  it("serializes backend capabilities, material receipts, and uncertainty receipts in robust JSON output", () => {
    const result = runRobustCoatingSearch({
      id: "l58-backend-json-test",
      label: "L5.8 backend JSON robust test",
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
    const json = JSON.stringify(result);

    expect(json).toContain("\"solverBackend\"");
    expect(json).toContain("\"id\":\"planar-tmm\"");
    expect(json).toContain("\"dimensions\":[\"1d-planar\"]");
    expect(json).toContain("\"supports3dGeometry\":false");
    expect(json).toContain("\"supportsFDTD\":false");
    expect(json).toContain("\"materialCatalogRefs\"");
    expect(json).toContain("\"uncertaintyReceipt\"");
    expect(json).toContain("\"globalThicknessScale\"");
  });
});

function basicSearchSpec(): CoatingSearchSpec {
  return {
    id: "l58-backend-search",
    label: "L5.8 backend search",
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
      seed: 58
    }
  };
}

function importedCatalogFixture(): { catalog: ReturnType<typeof createMaterialCatalog>; materialId: string } {
  const imported = importMaterialPackage({
    schema: "emmicro.materials.v1",
    id: "l58-backend-pack",
    label: "L5.8 backend material pack",
    records: [
      {
        id: "imported-backend-ar",
        label: "Imported backend AR coating",
        family: "coating",
        wavelengthUnit: "nm",
        source: {
          name: "unit test backend coating source",
          reference: "synthetic L5.8 backend fixture",
          license: "test-only"
        },
        samples: [
          { wavelength: 400, n: 1.32, k: 0 },
          { wavelength: 550, n: 1.31, k: 0 },
          { wavelength: 700, n: 1.3, k: 0 }
        ]
      }
    ]
  });
  const catalog = createMaterialCatalog({ imports: [imported] });
  const materialId = listCatalogMaterials(catalog).find((material) => material.origin === "imported")?.id;
  if (!materialId) throw new Error("missing imported material id");
  return { catalog, materialId };
}

function importedStack(materialId: string): CoatingStackDefinition {
  return {
    ...l41DefaultCoatingStack,
    id: "l58-imported-backend-stack",
    label: "L5.8 imported backend stack",
    layers: [
      {
        id: "layer-imported-backend-ar",
        label: "Imported backend AR coating",
        materialId,
        thicknessM: 96e-9
      }
    ]
  };
}
