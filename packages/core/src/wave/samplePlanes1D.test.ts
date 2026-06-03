import { describe, expect, it } from "vitest";
import type { SamplePlane1D } from "../scene/schema";
import { makeComplexArray } from "./complex";
import { fieldEnergy } from "./field1d";
import { applySamplePlane1D } from "./samplePlanes1D";
import { transmissionAtY } from "./transmissionMasks1D";

describe("analytic 1D sample transmissions", () => {
  it("evaluates amplitude samples for slits, gratings, and bar targets", () => {
    const single: SamplePlane1D["transmission"] = {
      kind: "analyticAmplitude",
      profile: { kind: "singleSlit", widthM: 100e-6, centerYM: 0 }
    };
    expect(transmissionAtY(single, 0).amplitude).toBe(1);
    expect(transmissionAtY(single, 200e-6).amplitude).toBe(0);

    const double: SamplePlane1D["transmission"] = {
      kind: "analyticAmplitude",
      profile: { kind: "doubleSlit", slitWidthM: 20e-6, separationM: 100e-6, centerYM: 0 }
    };
    expect(transmissionAtY(double, -50e-6).amplitude).toBe(1);
    expect(transmissionAtY(double, 50e-6).amplitude).toBe(1);
    expect(transmissionAtY(double, 0).amplitude).toBe(0);

    const grating: SamplePlane1D["transmission"] = {
      kind: "analyticAmplitude",
      profile: { kind: "grating", periodM: 20e-6, slitWidthM: 8e-6, count: 3, centerYM: 0 }
    };
    expect(transmissionAtY(grating, 20e-6).amplitude).toBe(1);
    expect(transmissionAtY(grating, 10e-6).amplitude).toBe(0);

    const bars: SamplePlane1D["transmission"] = {
      kind: "analyticAmplitude",
      profile: { kind: "barTarget1D", periodM: 100e-6, dutyCycle: 0.5, bars: 3, contrast: 0.8, centerYM: 0 }
    };
    expect(transmissionAtY(bars, -125e-6).amplitude).toBeCloseTo(1, 12);
    expect(transmissionAtY(bars, -75e-6).amplitude).toBeCloseTo(0.2, 12);
  });

  it("preserves field energy for phase-only samples before propagation", () => {
    const yM = Float64Array.from([-2, -1, 0, 1, 2].map((value) => value * 1e-6));
    const field = makeComplexArray(yM.length);
    field.real.fill(1);

    const sample: SamplePlane1D = {
      id: "phase",
      type: "samplePlane1D",
      label: "Phase step",
      xM: 0,
      gridId: "grid",
      transmission: {
        kind: "analyticPhase",
        profile: { kind: "phaseStep", stepYM: 0, phaseLeftRad: 0, phaseRightRad: Math.PI }
      }
    };

    const before = fieldEnergy(field, 1e-6);
    const applied = applySamplePlane1D(field, sample, yM, 1e-6);

    expect(applied.outputEnergy).toBeCloseTo(before, 12);
    expect(applied.clippedEnergy).toBeCloseTo(0, 12);
  });
});
