import { describe, expect, it } from "vitest";
import { computeThinLensReadout } from "./thinLens";
import type { ThinLensElement } from "../scene/schema";

const lens: ThinLensElement = {
  id: "lens",
  type: "thinLens",
  label: "Lens",
  xM: 0.15,
  yCenterM: 0,
  focalLengthM: 0.05,
  clearApertureM: 0.02,
  material: {
    refractiveIndex: 1.5,
    dispersionModel: "none"
  },
  approximation: "thinLensParaxial"
};

describe("thin-lens readouts", () => {
  it("matches the thin-lens equation for f=50mm and object distance=150mm", () => {
    const readout = computeThinLensReadout(lens, 0);

    expect(readout.objectDistanceM).toBeCloseTo(0.15, 12);
    expect(readout.focalPlaneXM).toBeCloseTo(0.2, 12);
    expect(readout.imageDistanceM).toBeCloseTo(0.075, 12);
    expect(readout.imageXM).toBeCloseTo(0.225, 12);
    expect(readout.magnification).toBeCloseTo(-0.5, 12);
  });
});
