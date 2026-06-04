import { describe, expect, it } from "vitest";
import {
  airyCircularApertureIntensity,
  circularApertureValidationJson,
  circularApertureValidationMarkdown,
  defaultCircularApertureValidationConfig,
  expectedAiryFirstMinimum,
  runCircularApertureValidation
} from "./circularApertureValidation";

describe("L6.1 circular aperture validation", () => {
  it("computes the first Airy minimum for 500nm, D=1um, L=10mm near 7.7mm using exact angle geometry", () => {
    const result = runCircularApertureValidation();

    expect(result.expected.apertureToPlaneDistanceM).toBeCloseTo(10e-3, 15);
    expect(result.expected.firstMinimumSinTheta).toBeCloseTo(0.609835, 5);
    expect(result.expected.firstMinimumThetaRad).toBeCloseTo(0.6556, 3);
    expect(result.expected.firstMinimumRadiusM).toBeGreaterThan(7.6e-3);
    expect(result.expected.firstMinimumRadiusM).toBeLessThan(7.8e-3);
  });

  it("warns that a 10mm x 10mm plane does not contain the first minimum", () => {
    const result = runCircularApertureValidation();

    expect(result.expected.detectorHalfWidthM).toBeCloseTo(5e-3, 15);
    expect(result.expected.detectorHalfDiagonalM).toBeCloseTo(Math.SQRT2 * 5e-3, 15);
    expect(result.expected.firstMinimumInsidePlane).toBe(false);
    expect(result.expected.firstMinimumInsidePlaneDiagonal).toBe(false);
    expect(result.warnings.some((warning) => warning.code === "validation.diffraction.firstMinimumOutsidePlane")).toBe(true);
    expect(result.warnings.map((warning) => warning.message).join(" ")).toContain("does not fully include it");
  });

  it("normalizes center intensity to 1", () => {
    const result = runCircularApertureValidation();
    const centerIndex = Math.floor(result.field.height / 2) * result.field.width + Math.floor(result.field.width / 2);

    expect(result.field.intensity[centerIndex]).toBeCloseTo(1, 15);
    expect(result.residuals.centerNormalizationError).toBeLessThan(1e-14);
  });

  it("produces a radially symmetric intensity map", () => {
    const result = runCircularApertureValidation();

    expect(result.residuals.radialSymmetryError).toBeLessThan(1e-12);
    for (let vIndex = 0; vIndex < result.field.height; vIndex += 29) {
      for (let uIndex = 0; uIndex < result.field.width; uIndex += 31) {
        const mirrorV = result.field.height - 1 - vIndex;
        const mirrorU = result.field.width - 1 - uIndex;
        const index = vIndex * result.field.width + uIndex;
        const mirrorIndex = mirrorV * result.field.width + mirrorU;
        expect(result.field.intensity[index]).toBeCloseTo(result.field.intensity[mirrorIndex] ?? 0, 14);
      }
    }
  });

  it("matches the Airy/Bessel analytic radial profile within tolerance", () => {
    const result = runCircularApertureValidation();
    const config = result.config;

    expect(airyCircularApertureIntensity(0, config)).toBe(1);
    for (const sample of result.radialProfile) {
      expect(sample.modelIntensity).toBeCloseTo(sample.analyticIntensity, 15);
      expect(sample.analyticIntensity).toBeCloseTo(airyCircularApertureIntensity(sample.radiusM, config), 15);
    }
    expect(result.residuals.rmsResidual).toBeLessThan(1e-14);
    expect(result.residuals.maxResidual).toBeLessThan(1e-14);
  });

  it("moves the expected minimum when the observation z slider changes", () => {
    const near = runCircularApertureValidation({
      observationPlane: {
        ...defaultCircularApertureValidationConfig().observationPlane,
        zM: 20e-3
      }
    });
    const far = runCircularApertureValidation({
      observationPlane: {
        ...defaultCircularApertureValidationConfig().observationPlane,
        zM: 30e-3
      }
    });

    expect(far.expected.apertureToPlaneDistanceM).toBeCloseTo(20e-3, 15);
    expect(far.expected.firstMinimumRadiusM / near.expected.firstMinimumRadiusM).toBeCloseTo(2, 12);
  });

  it("uses deterministic hashes for benchmark config and result", () => {
    const a = runCircularApertureValidation();
    const b = runCircularApertureValidation(structuredClone(defaultCircularApertureValidationConfig()));

    expect(a.configHash).toBe(b.configHash);
    expect(a.resultHash).toBe(b.resultHash);
  });

  it("exports validation JSON and Markdown with formulas, residuals, warnings, and boundary language", () => {
    const result = runCircularApertureValidation();
    const json = JSON.stringify(circularApertureValidationJson(result));
    const markdown = circularApertureValidationMarkdown(result);

    expect(json).toContain("emmicro.circularApertureValidation.v1");
    expect(json).toContain("I/I0 = [2 J1(k a sin(theta)) / (k a sin(theta))]^2");
    expect(json).toContain("sin(theta) = rho / sqrt(rho^2 + L^2)");
    expect(json).toContain("validation.diffraction.firstMinimumOutsidePlane");
    expect(json).toContain("radialSymmetryError");
    expect(markdown).toContain("circular pinhole");
    expect(markdown).toContain("First Airy minimum");
    expect(markdown).toContain("scalar diffraction validation bench, not a full vector Maxwell aperture solve");
    expect(`${json}\n${markdown}`).not.toMatch(/full 3D Maxwell aperture solver|FDTD aperture solved|physical metal aperture solved/i);
  });

  it("keeps the circular pinhole benchmark distinct from later long-slit sinc2 validation", () => {
    const result = runCircularApertureValidation();

    expect(result.config.aperture.kind).toBe("ideal-zero-thickness-circular-amplitude-mask");
    expect(result.formulas.note).toContain("Circular apertures");
    expect(result.formulas.note).toContain("long slits produce sinc^2");
    expect(expectedAiryFirstMinimum(result.config).firstMinimumRadiusM).toBe(result.expected.firstMinimumRadiusM);
  });
});
