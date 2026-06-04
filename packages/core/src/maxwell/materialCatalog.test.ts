import { describe, expect, it } from "vitest";
import { importMaterialPackage } from "./materialImport";
import { createMaterialCatalog, getL4SpectralMaterial, listCatalogMaterials, listL4SpectralMaterials, sampleCatalogMaterial, sampleSpectralMaterial } from "./materialCatalog";

describe("L4.1 spectral material catalog", () => {
  it("interpolates wavelength-dependent n,k samples", () => {
    const bk7 = getL4SpectralMaterial("bk7");
    const lookup = sampleSpectralMaterial(bk7, 550e-9);

    expect(lookup.material.refractiveIndex.n).toBeCloseTo(1.5185, 12);
    expect(lookup.material.refractiveIndex.k).toBe(0);
    expect(lookup.interpolation).toBe("exact");
  });

  it("clamps out-of-range wavelengths with provenance warnings", () => {
    const mgf2 = getL4SpectralMaterial("mgf2");
    const lookup = sampleSpectralMaterial(mgf2, 900e-9);

    expect(lookup.interpolation).toBe("clampedHigh");
    expect(lookup.material.refractiveIndex.n).toBeCloseTo(1.376, 12);
    expect(lookup.warnings[0]?.message).toContain("clamped");
  });

  it("contains materials needed for coating and future sensor diagnostics", () => {
    const ids = new Set(listL4SpectralMaterials().map((material) => material.id));

    expect(ids.has("air")).toBe(true);
    expect(ids.has("bk7")).toBe(true);
    expect(ids.has("mgf2")).toBe(true);
    expect(ids.has("tio2")).toBe(true);
    expect(ids.has("silicon")).toBe(true);
  });
});

describe("L5.4 material catalog integration", () => {
  it("registers imported materials alongside built-ins with deterministic hash-backed ids", () => {
    const imported = importTestPack();
    const catalog = createMaterialCatalog({ imports: [imported] });
    const repeat = createMaterialCatalog({ imports: [importTestPack()] });
    const importedEntry = listCatalogMaterials(catalog).find((material) => material.origin === "imported");
    const repeatEntry = listCatalogMaterials(repeat).find((material) => material.origin === "imported");

    expect(listCatalogMaterials(catalog).some((material) => material.id === "mgf2")).toBe(true);
    expect(importedEntry?.id).toMatch(/^material:[0-9a-f]+:[0-9a-f]+$/);
    expect(importedEntry?.id).toBe(repeatEntry?.id);
    expect(importedEntry?.sourceRecordId).toBe("custom-low");
    expect(importedEntry?.sourcePackHash).toBe(imported.resultHash);
  });

  it("resolves imported n,k values with normalized wavelength units and material receipts", () => {
    const catalog = createMaterialCatalog({ imports: [importTestPack()] });
    const importedEntry = listCatalogMaterials(catalog).find((material) => material.origin === "imported");
    if (!importedEntry) throw new Error("missing imported test material");

    const lookup = sampleCatalogMaterial(importedEntry.id, 475e-9, catalog);

    expect(lookup.interpolation).toBe("linear");
    expect(lookup.material.refractiveIndex.n).toBeCloseTo(1.9, 12);
    expect(lookup.material.catalogMaterialId).toBe(importedEntry.id);
    expect(lookup.material.materialHash).toBe(importedEntry.materialHash);
    expect(lookup.material.sourcePackHash).toBe(importedEntry.sourcePackHash);
    expect(lookup.material.source).toContain("materialHash");
  });

  it("blocks imported material extrapolation by default but can clamp when explicitly allowed", () => {
    const catalog = createMaterialCatalog({ imports: [importTestPack()] });
    const importedEntry = listCatalogMaterials(catalog).find((material) => material.origin === "imported");
    if (!importedEntry) throw new Error("missing imported test material");

    expect(() => sampleCatalogMaterial(importedEntry.id, 900e-9, catalog)).toThrow(/material pack covering that wavelength/);

    const clamped = sampleCatalogMaterial(importedEntry.id, 900e-9, catalog, { extrapolation: "clamp" });
    expect(clamped.interpolation).toBe("clampedHigh");
    expect(clamped.warnings.some((warning) => warning.code === "maxwell.material.wavelengthClamped")).toBe(true);
  });
});

function importTestPack() {
  return importMaterialPackage({
    schema: "emmicro.materials.v1",
    id: "l54-test-pack",
    label: "L5.4 test material pack",
    records: [
      {
        id: "custom-low",
        label: "Custom low-index coating",
        family: "coating",
        wavelengthUnit: "nm",
        source: {
          name: "unit test material source",
          reference: "synthetic L5.4 fixture",
          license: "test-only"
        },
        samples: [
          { wavelength: 400, n: 2.0, k: 0 },
          { wavelength: 550, n: 1.8, k: 0 },
          { wavelength: 700, n: 1.7, k: 0 }
        ]
      }
    ]
  });
}
