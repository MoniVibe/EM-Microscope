import { describe, expect, it } from "vitest";
import { l41DefaultCoatingStack, runCoatingStack, serializeCoatingStackDesign } from "./coatingStack";
import { applyCoatingSearchCandidate, runCoatingSearch, type CoatingSearchSpec } from "./coatingSearch";
import { createMaterialCatalog, listCatalogMaterials } from "./materialCatalog";
import { importMaterialPackage } from "./materialImport";

describe("L5.5 coating material/order/thickness search", () => {
  it("returns deterministic ranked candidates for a fixed spec and seed", () => {
    const spec = basicSpec();
    const a = runCoatingSearch(spec);
    const b = runCoatingSearch(structuredClone(spec));

    expect(a.type).toBe("maxwellCoatingMaterialOrderSearch");
    expect(a.best.score).toBe(b.best.score);
    expect(a.best.resultHash).toBe(b.best.resultHash);
    expect(a.resultHash).toBe(b.resultHash);
    expect(a.evaluationCount).toBeGreaterThan(0);
  });

  it("uses materialId rather than display names and preserves provenance receipts", () => {
    const result = runCoatingSearch(basicSpec());

    expect(result.best.layers[0]?.materialId).toMatch(/mgf2|sio2/);
    expect(result.best.materialCatalogRefs.some((reference) => reference.materialId === result.best.layers[0]?.materialId)).toBe(true);
    expect(result.best.materialCatalogRefs[0]?.materialHash).toBeTruthy();
  });

  it("evaluates imported materials through the material catalog", () => {
    const { catalog, materialId } = importedCatalogFixture();
    const result = runCoatingSearch(
      {
        ...basicSpec(),
        candidateMaterialIds: [materialId, "sio2"],
        layerCount: { min: 1, max: 1 },
        thicknessM: { min: 90e-9, max: 110e-9, step: 20e-9 }
      },
      { materialCatalog: catalog, materialResolution: { extrapolation: "clamp" } }
    );

    expect(result.candidates.some((candidate) => candidate.layers.some((layer) => layer.materialId === materialId))).toBe(true);
    const imported = result.candidates.find((candidate) => candidate.layers.some((layer) => layer.materialId === materialId));
    expect(imported?.materialCatalogRefs.some((reference) => reference.origin === "imported" && reference.sourcePackHash)).toBe(true);
  });

  it("rejects missing imported material references clearly", () => {
    expect(() =>
      runCoatingSearch({
        ...basicSpec(),
        candidateMaterialIds: ["material:missing-pack:missing-material"]
      })
    ).toThrow(/material is not loaded|material 'material:missing-pack:missing-material'/);
  });

  it("respects layer count, thickness, total thickness, and adjacent-material constraints", () => {
    const result = runCoatingSearch({
      ...basicSpec(),
      candidateMaterialIds: ["mgf2", "sio2"],
      layerCount: { min: 2, max: 2 },
      thicknessM: { min: 40e-9, max: 80e-9, step: 40e-9 },
      constraints: {
        disallowAdjacentSameMaterial: true,
        maxTotalThicknessM: 121e-9
      }
    });

    expect(result.candidates.length).toBeGreaterThan(0);
    for (const candidate of result.candidates) {
      expect(candidate.layers).toHaveLength(2);
      expect(candidate.layers[0]?.materialId).not.toBe(candidate.layers[1]?.materialId);
      expect(candidate.stack.layers.reduce((sum, layer) => sum + layer.thicknessM, 0)).toBeLessThanOrEqual(121e-9);
      for (const layer of candidate.stack.layers) {
        expect(layer.thicknessM).toBeGreaterThanOrEqual(40e-9);
        expect(layer.thicknessM).toBeLessThanOrEqual(80e-9);
      }
    }
  });

  it("ranks a searched AR candidate above a bare substrate for reflectance", () => {
    const result = runCoatingSearch({
      ...basicSpec(),
      candidateMaterialIds: ["mgf2"],
      layerCount: { min: 1, max: 1 },
      thicknessM: { min: 60e-9, max: 120e-9, step: 10e-9 }
    });
    const bare = runCoatingStack({ ...l41DefaultCoatingStack, layers: [] });

    expect(result.best.metrics.meanReflectance).toBeLessThan(bare.tmm.reflectance);
    expect(result.best.stack.layers[0]?.thicknessM).toBeGreaterThan(60e-9);
    expect(result.best.stack.layers[0]?.thicknessM).toBeLessThan(120e-9);
  });

  it("applies a selected candidate into a serializable coating-stack design", () => {
    const result = runCoatingSearch(basicSpec());
    const applied = applyCoatingSearchCandidate(l41DefaultCoatingStack, result.best);
    const design = serializeCoatingStackDesign(applied);

    expect(applied.layers.map((layer) => layer.materialId)).toEqual(result.best.layers.map((layer) => layer.materialId));
    expect(design.materialCatalogRefs.some((reference) => reference.materialId === result.best.layers[0]?.materialId)).toBe(true);
  });

  it("can filter candidates by maximum absorbance", () => {
    const result = runCoatingSearch({
      ...basicSpec(),
      candidateMaterialIds: ["chromiumLossy", "mgf2"],
      constraints: {
        maxAbsorbance: 0.01
      }
    });

    expect(result.candidates.every((candidate) => candidate.metrics.maxAbsorbance <= 0.01)).toBe(true);
    expect(result.candidates.every((candidate) => !candidate.layers.some((layer) => layer.materialId === "chromiumLossy"))).toBe(true);
  });
});

function basicSpec(): CoatingSearchSpec {
  return {
    id: "l55-test-search",
    label: "L5.5 test search",
    baseStack: {
      ...l41DefaultCoatingStack,
      layers: []
    },
    wavelengthsM: [550e-9],
    anglesRad: [0],
    polarizations: ["TE"],
    candidateMaterialIds: ["mgf2", "sio2"],
    layerCount: { min: 1, max: 2 },
    thicknessM: { min: 60e-9, max: 120e-9, step: 30e-9 },
    constraints: {
      disallowAdjacentSameMaterial: true,
      maxTotalThicknessM: 220e-9
    },
    objective: {
      terms: [{ metric: "reflectance", direction: "minimize", weight: 1 }]
    },
    search: {
      mode: "beam",
      beamWidth: 8,
      maxCandidates: 5,
      refinementPasses: 1,
      seed: 123
    }
  };
}

function importedCatalogFixture(): { catalog: ReturnType<typeof createMaterialCatalog>; materialId: string } {
  const imported = importMaterialPackage({
    schema: "emmicro.materials.v1",
    id: "l55-search-pack",
    label: "L5.5 search material pack",
    records: [
      {
        id: "imported-ar-search",
        label: "Imported search AR coating",
        family: "coating",
        wavelengthUnit: "nm",
        source: {
          name: "unit test coating source",
          reference: "synthetic L5.5 fixture",
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
