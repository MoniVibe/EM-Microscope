import { describe, expect, it } from "vitest";
import { getL4SpectralMaterial, listL4SpectralMaterials, sampleSpectralMaterial } from "./materialCatalog";

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
