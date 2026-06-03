import { describe, expect, it } from "vitest";
import type { FieldGrid2D, FieldPlane2D, PupilPlane2D, SamplePlane2D, ThinLensPhasePlane2D } from "../scene/schema";
import { createFieldFromPlane2D } from "./field2d";
import { applyPupilPlane2D } from "./pupil2d";
import { applySamplePlane2D, transmissionAtUV } from "./sampleMasks2d";
import { applyThinLensPhase2D } from "./thinLensPhase2d";

const grid: FieldGrid2D = {
  id: "grid-2mm-64",
  label: "2 mm 2D test grid",
  uMinM: -0.001,
  uMaxM: 0.001,
  vMinM: -0.001,
  vMaxM: 0.001,
  width: 64,
  height: 64,
  spacingUM: 0.002 / 64,
  spacingVM: 0.002 / 64
};

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

describe("2D analytic sample masks", () => {
  it("evaluates double slit and phase-step transmissions", () => {
    expect(
      transmissionAtUV(
        {
          kind: "doubleSlit2D",
          slitWidthM: 50e-6,
          slitHeightM: 500e-6,
          separationM: 200e-6,
          centerUM: 0,
          centerVM: 0
        },
        -100e-6,
        0
      ).amplitude
    ).toBe(1);
    expect(
      transmissionAtUV(
        {
          kind: "doubleSlit2D",
          slitWidthM: 50e-6,
          slitHeightM: 500e-6,
          separationM: 200e-6,
          centerUM: 0,
          centerVM: 0
        },
        0,
        0
      ).amplitude
    ).toBe(0);
    expect(transmissionAtUV({ kind: "phaseStep2D", boundaryUM: 0, phaseLeftRad: 0, phaseRightRad: Math.PI }, 10e-6, 0).phaseRad).toBeCloseTo(
      Math.PI,
      12
    );
  });

  it("preserves energy for phase-only sample and thin-lens phase planes", () => {
    const field = createFieldFromPlane2D(grid, source);
    const sample: SamplePlane2D = {
      id: "phase-step",
      type: "samplePlane2D",
      label: "Phase step",
      xM: 0,
      gridId: grid.id,
      transmission: { kind: "phaseStep2D", boundaryUM: 0, phaseLeftRad: 0, phaseRightRad: Math.PI }
    };
    const lens: ThinLensPhasePlane2D = {
      id: "lens",
      type: "thinLensPhasePlane2D",
      label: "Thin lens phase",
      xM: 0,
      gridId: grid.id,
      focalLengthM: 0.05,
      centerUM: 0,
      centerVM: 0
    };

    const afterSample = applySamplePlane2D(field, sample, grid);
    const afterLens = applyThinLensPhase2D(afterSample.field, lens, grid, 500e-9, 1);

    expect(afterSample.outputEnergy).toBeCloseTo(afterSample.inputEnergy, 10);
    expect(afterLens.outputEnergy).toBeCloseTo(afterLens.inputEnergy, 10);
  });

  it("clips energy with a circular pupil", () => {
    const field = createFieldFromPlane2D(grid, source);
    const pupil: PupilPlane2D = {
      id: "pupil",
      type: "pupilPlane2D",
      label: "Circular pupil",
      xM: 0,
      gridId: grid.id,
      shape: {
        kind: "circle",
        radiusM: 0.00035,
        centerUM: 0,
        centerVM: 0
      }
    };

    const applied = applyPupilPlane2D(field, pupil, grid);

    expect(applied.outputEnergy).toBeLessThan(applied.inputEnergy);
    expect(applied.clippedEnergy).toBeGreaterThan(0);
  });
});
