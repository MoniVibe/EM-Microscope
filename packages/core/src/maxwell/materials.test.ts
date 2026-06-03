import { describe, expect, it } from "vitest";
import { absorptionCoefficientPerM, l4MaterialSamples, relativePermittivityFromIndex } from "./materials";

describe("L4 Maxwell material samples", () => {
  it("converts complex refractive index into relative permittivity", () => {
    const epsilon = relativePermittivityFromIndex({ n: 2, k: 0.5 });
    expect(epsilon.re).toBeCloseTo(3.75, 12);
    expect(epsilon.im).toBeCloseTo(2, 12);
  });

  it("computes absorption coefficient from extinction coefficient", () => {
    const alpha = absorptionCoefficientPerM(l4MaterialSamples.chromiumLossy.refractiveIndex, 550e-9);
    expect(alpha).toBeGreaterThan(1e6);
  });
});
