import { describe, expect, it } from "vitest";
import { compileCoatingStackToPlanarTmm, l41DefaultCoatingStack, runCoatingStack, runCoatingSweep } from "./coatingStack";

describe("L4.1 coating stack runner", () => {
  it("compiles spectral material IDs into a planar TMM input", () => {
    const compiled = compileCoatingStackToPlanarTmm(l41DefaultCoatingStack);

    expect(compiled.input.incidentMedium.label).toBe("Air");
    expect(compiled.input.substrateMedium.label).toBe("BK7 glass");
    expect(compiled.input.layers[0]?.material.label).toBe("MgF2 coating");
    expect(compiled.input.layers[0]?.thicknessM).toBeCloseTo(l41DefaultCoatingStack.layers[0]?.thicknessM ?? 0, 15);
    expect(compiled.warnings.some((warning) => warning.message.includes("not a general 3D Maxwell solver"))).toBe(true);
  });

  it("runs the editable AR stack through the existing planar Maxwell TMM path", () => {
    const run = runCoatingStack(l41DefaultCoatingStack);

    expect(run.tmm.reflectance).toBeLessThan(0.02);
    expect(run.tmm.transmittance).toBeGreaterThan(0.9);
    expect(run.tmm.energyBalanceError).toBeLessThan(1e-10);
    expect(run.provenance.limitations.join(" ")).toContain("not a general 3D Maxwell solver");
  });

  it("sweeps wavelength with deterministic aggregate hashes", () => {
    const sweep = { startWavelengthM: 450e-9, endWavelengthM: 650e-9, sampleCount: 9 };
    const a = runCoatingSweep(l41DefaultCoatingStack, sweep);
    const b = runCoatingSweep(structuredClone(l41DefaultCoatingStack), sweep);
    const c = runCoatingSweep(
      {
        ...l41DefaultCoatingStack,
        layers: l41DefaultCoatingStack.layers.map((layer) => ({ ...layer, thicknessM: layer.thicknessM * 1.1 }))
      },
      sweep
    );

    expect(a.samples).toHaveLength(9);
    expect(a.reflectanceMin).toBeLessThan(a.reflectanceMax);
    expect(a.absorbanceMax).toBeCloseTo(0, 12);
    expect(a.resultHash).toBe(b.resultHash);
    expect(a.resultHash).not.toBe(c.resultHash);
  });

  it("surfaces material range warnings during sweeps", () => {
    const sweep = runCoatingSweep(l41DefaultCoatingStack, { startWavelengthM: 350e-9, endWavelengthM: 750e-9, sampleCount: 5 });

    expect(sweep.warnings.some((warning) => warning.code === "maxwell.material.wavelengthClamped")).toBe(true);
  });
});
