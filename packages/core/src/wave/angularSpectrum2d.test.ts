import { describe, expect, it } from "vitest";
import type { FieldGrid2D, FieldPlane2D } from "../scene/schema";
import { propagateAngularSpectrum2D } from "./angularSpectrum2d";
import { createFieldFromPlane2D, fieldEnergy2D, intensityAndPhase2D } from "./field2d";

const grid: FieldGrid2D = {
  id: "grid-4mm-64",
  label: "4 mm 2D test grid",
  uMinM: -0.002,
  uMaxM: 0.002,
  vMinM: -0.002,
  vMaxM: 0.002,
  width: 64,
  height: 64,
  spacingUM: 0.004 / 64,
  spacingVM: 0.004 / 64
};

describe("2D angular-spectrum propagation", () => {
  it("conserves energy for a gaussian field in free space", () => {
    const source: FieldPlane2D = {
      id: "source",
      label: "Gaussian source",
      role: "source",
      xM: 0,
      gridId: grid.id,
      mediumId: "air",
      fieldSource: {
        kind: "gaussian",
        waistUM: 0.00055,
        waistVM: 0.00045,
        amplitude: 1,
        phaseRad: 0,
        centerUM: 0,
        centerVM: 0
      }
    };
    const input = createFieldFromPlane2D(grid, source);
    const output = propagateAngularSpectrum2D(input, grid, 500e-9, 1, 0.05);

    const inputEnergy = fieldEnergy2D(input, grid.spacingUM, grid.spacingVM);
    const outputEnergy = fieldEnergy2D(output, grid.spacingUM, grid.spacingVM);

    expect(Math.abs((outputEnergy - inputEnergy) / inputEnergy)).toBeLessThan(1e-9);
  });

  it("keeps plane-wave intensity uniform and advances phase consistently", () => {
    const source: FieldPlane2D = {
      id: "source",
      label: "Plane wave source",
      role: "source",
      xM: 0,
      gridId: grid.id,
      mediumId: "air",
      fieldSource: {
        kind: "uniformPlaneWave",
        amplitude: 1,
        phaseRad: 0
      }
    };
    const input = createFieldFromPlane2D(grid, source);
    const output = propagateAngularSpectrum2D(input, grid, 500e-9, 1, 0.01);
    const { intensity, phaseRad } = intensityAndPhase2D(output);
    const expectedPhase = (2 * Math.PI * 0.01) / 500e-9;

    for (const value of intensity) {
      expect(value).toBeCloseTo(1, 10);
    }
    const phaseError = Math.atan2(Math.sin((phaseRad[0] ?? 0) - expectedPhase), Math.cos((phaseRad[0] ?? 0) - expectedPhase));
    expect(Math.abs(phaseError)).toBeLessThan(1e-9);
  });
});
