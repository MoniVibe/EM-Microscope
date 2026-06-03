import { describe, expect, it } from "vitest";
import type { TestTarget2D } from "../scene/schema";
import { samplePlaneFromTestTarget2D, testTargetFeaturePeriodM, transmissionFromTestTarget2D, usaf1951LinePairsPerMm } from "./testTargets2d";

describe("2D test target fixtures", () => {
  it("converts line-pair targets into bar sample planes", () => {
    const target: TestTarget2D = {
      id: "lp",
      label: "Line pairs",
      kind: "linePairs",
      periodM: 20e-6,
      dutyCycle: 0.5,
      orientationRad: 0,
      contrast: 0.8
    };

    const sample = samplePlaneFromTestTarget2D(target, { xM: 0, gridId: "grid" });

    expect(sample.id).toBe("l33-target-lp");
    expect(sample.transmission.kind).toBe("barTarget2D");
    expect(testTargetFeaturePeriodM(target)).toBe(20e-6);
  });

  it("uses the USAF 1951 group/element line-pair relationship", () => {
    const target: TestTarget2D = {
      id: "usaf",
      label: "USAF",
      kind: "usafStyleBars",
      group: 2,
      element: 1,
      orientation: "vertical",
      contrast: 0.8
    };

    const transmission = transmissionFromTestTarget2D(target);

    expect(usaf1951LinePairsPerMm(2, 1)).toBeCloseTo(4, 12);
    expect(transmission.kind).toBe("barTarget2D");
  });
});
