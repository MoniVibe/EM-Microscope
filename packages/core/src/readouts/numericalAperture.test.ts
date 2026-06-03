import { describe, expect, it } from "vitest";
import { computeNAReadout } from "./numericalAperture";
import type { ThinLensElement } from "../scene/schema";

const lens: ThinLensElement = {
  id: "lens",
  type: "thinLens",
  label: "Lens",
  xM: 0.05,
  yCenterM: 0,
  focalLengthM: 0.05,
  clearApertureM: 0.01,
  material: {
    refractiveIndex: 1.5,
    dispersionModel: "none"
  },
  approximation: "thinLensParaxial"
};

describe("NA and Airy estimates", () => {
  it("computes paraxial NA for a 10mm aperture and 50mm focal length", () => {
    const readout = computeNAReadout(lens, 1, 550e-9);

    expect(readout.thetaRad).toBeCloseTo(Math.atan(0.1), 12);
    expect(readout.numericalAperture).toBeCloseTo(0.09950371902099892, 12);
  });

  it("computes the analytic Airy radius estimate", () => {
    const readout = computeNAReadout(lens, 1, 550e-9);

    expect(readout.airyRadiusM).toBeCloseTo((0.61 * 550e-9) / readout.numericalAperture, 12);
  });
});
