import { describe, expect, it } from "vitest";
import { l4AbsorbingFilmTmm, l4BareGlassTmm, l4ObliqueStackTmm, l4QuarterWaveArTmm } from "../validation/fixturesL4";
import { fresnelReflectanceNormal, runPlanarTmm } from "./planarTmm";

describe("L4 Phase 0 planar Maxwell TMM", () => {
  it("matches the normal-incidence Fresnel reflectance for a bare interface", () => {
    const result = runPlanarTmm(l4BareGlassTmm);
    const expected = fresnelReflectanceNormal(l4BareGlassTmm.incidentMedium.refractiveIndex.n, l4BareGlassTmm.substrateMedium.refractiveIndex.n);
    expect(result.reflectance).toBeCloseTo(expected, 12);
    expect(result.transmittance + result.reflectance).toBeCloseTo(1, 12);
    expect(result.absorbance).toBeCloseTo(0, 12);
    expect(result.provenance.limitations.join(" ")).toContain("not a general 3D Maxwell solver");
  });

  it("reduces reflectance for a quarter-wave antireflection layer", () => {
    const bare = runPlanarTmm(l4BareGlassTmm);
    const coated = runPlanarTmm(l4QuarterWaveArTmm);
    expect(coated.reflectance).toBeLessThan(bare.reflectance);
    expect(coated.energyBalanceError).toBeLessThan(1e-10);
  });

  it("reports absorption for a lossy film stack", () => {
    const result = runPlanarTmm(l4AbsorbingFilmTmm);
    expect(result.absorbance).toBeGreaterThan(0.01);
    expect(result.reflectance + result.transmittance + result.absorbance).toBeCloseTo(1, 12);
    expect(result.effectivePermittivity.layers[0]?.epsilonR.im ?? 0).toBeGreaterThan(0);
  });

  it("handles oblique TM polarization with finite Poynting-style outputs", () => {
    const result = runPlanarTmm(l4ObliqueStackTmm);
    expect(result.polarization).toBe("TM");
    expect(Number.isFinite(result.reflectance)).toBe(true);
    expect(Number.isFinite(result.transmittance)).toBe(true);
    expect(result.reflectance).toBeGreaterThanOrEqual(0);
    expect(result.transmittance).toBeGreaterThanOrEqual(0);
  });

  it("is deterministic for identical stack inputs and sensitive to layer thickness", () => {
    const a = runPlanarTmm(l4QuarterWaveArTmm);
    const b = runPlanarTmm(structuredClone(l4QuarterWaveArTmm));
    const c = runPlanarTmm({
      ...l4QuarterWaveArTmm,
      layers: l4QuarterWaveArTmm.layers.map((layer) => ({ ...layer, thicknessM: layer.thicknessM * 1.05 }))
    });
    expect(a.resultHash).toBe(b.resultHash);
    expect(a.resultHash).not.toBe(c.resultHash);
  });
});
