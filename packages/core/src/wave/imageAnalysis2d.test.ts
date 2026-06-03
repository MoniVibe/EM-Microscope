import { describe, expect, it } from "vitest";
import { l3AiryReference, l3PresetScenes } from "../validation/fixturesL3";
import { scalarCoherentL3_2dSolver } from "../solvers/scalarCoherentL3_2d";
import { crossSectionsThroughPeak } from "./crossSections2d";
import { centralRowMinimumNear } from "./imageMetrics2d";
import { radialProfile2D, summarizeImage2D } from "./radialProfile2d";

describe("2D image analysis utilities", () => {
  it("extracts cross sections, radial profiles, and finite summary metrics from the L3 fixture", () => {
    const result = scalarCoherentL3_2dSolver.run(l3PresetScenes.airyPupil);
    const field = result.fieldImageOutputs?.[0];
    if (!field) throw new Error("missing field");

    const crossSections = crossSectionsThroughPeak(field);
    const radial = radialProfile2D(field, 48);
    const summary = summarizeImage2D(field);
    const minimum = centralRowMinimumNear(field, l3AiryReference.firstMinimumRadiusM);

    expect(crossSections.horizontal).toHaveLength(field.width);
    expect(crossSections.vertical).toHaveLength(field.height);
    expect(crossSections.peakIntensity).toBeGreaterThan(0);
    expect(radial).toHaveLength(48);
    expect(radial.some((bin) => bin.samples > 0 && bin.normalized < 0.1)).toBe(true);
    expect(summary.peakIntensity).toBeGreaterThan(0);
    expect(summary.totalIntensity).toBeGreaterThan(0);
    expect(summary.edgeFraction).toBeLessThan(1e-3);
    expect(summary.dynamicRange).toBeGreaterThan(1);
    expect(minimum.normalized).toBeLessThan(0.25);
  });
});
