import { describe, expect, it } from "vitest";
import {
  airyCircularApertureIntensity,
  circularApertureValidationJson,
  circularApertureValidationMarkdown,
  defaultCircularApertureValidationConfig,
  expectedAiryFirstMinimum,
  runCircularApertureValidation
} from "./circularApertureValidation";

describe("L6.2 numerical scalar diffraction validation", () => {
  it("computes the first Airy minimum for 500nm, D=1um, L=10mm near 7.7mm using exact angle geometry", () => {
    const result = runCircularApertureValidation();

    expect(result.expected.apertureToPlaneDistanceM).toBeCloseTo(10e-3, 15);
    expect(result.expected.firstMinimumSinTheta).toBeCloseTo(0.609835, 5);
    expect(result.expected.firstMinimumThetaRad).toBeCloseTo(0.6556, 3);
    expect(result.expected.firstMinimumRadiusM).toBeGreaterThan(7.6e-3);
    expect(result.expected.firstMinimumRadiusM).toBeLessThan(7.8e-3);
  });

  it("computes the circular aperture benchmark without reusing the analytic Airy map as the numerical result", () => {
    const result = runCircularApertureValidation();

    expect(result.type).toBe("l62NumericalScalarPropagationValidation");
    expect(result.analysisId).toBe("analysis.wave.l6.phase2.numericalScalarPropagationValidation");
    expect(result.comparison.numericalMethod).toBe("radial-huygens-fresnel-quadrature");
    expect(result.comparison.numericalIndependentOfAnalyticReference).toBe(true);
    expect(result.numericalField.id).toContain("numerical-intensity-map");
    expect(result.analyticField.id).toContain("analytic-intensity-map");
    expect(result.residualField.id).toContain("residual-intensity-map");
    expect(result.numericalField.provenance.kind).toBe("simulated");
    expect(result.analyticField.provenance.kind).toBe("analytic");
    expect(result.radialProfile.some((sample) => Math.abs(sample.residual) > 1e-8)).toBe(true);
  });

  it("warns that a 10mm x 10mm plane does not contain the first minimum", () => {
    const result = runCircularApertureValidation();

    expect(result.expected.detectorHalfWidthM).toBeCloseTo(5e-3, 15);
    expect(result.expected.detectorHalfDiagonalM).toBeCloseTo(Math.SQRT2 * 5e-3, 15);
    expect(result.expected.firstMinimumInsidePlane).toBe(false);
    expect(result.expected.firstMinimumInsidePlaneDiagonal).toBe(false);
    expect(result.comparison.measuredFirstMinimumRadiusM).toBeNull();
    expect(result.comparison.firstMinimumSearchStatus).toBe("outside-plane");
    expect(result.warnings.some((warning) => warning.code === "validation.diffraction.firstMinimumOutsidePlane")).toBe(true);
    expect(result.warnings.map((warning) => warning.message).join(" ")).toContain("does not fully include it");
  });

  it("normalizes numerical and analytic center intensity to 1", () => {
    const result = runCircularApertureValidation();
    const centerIndex = Math.floor(result.field.height / 2) * result.field.width + Math.floor(result.field.width / 2);

    expect(result.numericalField.intensity[centerIndex]).toBeCloseTo(1, 12);
    expect(result.analyticField.intensity[centerIndex]).toBeCloseTo(1, 12);
    expect(result.residuals.centerNormalizationError).toBeLessThan(1e-10);
  });

  it("produces a radially symmetric numerical intensity map", () => {
    const result = runCircularApertureValidation();

    expect(result.residuals.radialSymmetryError).toBeLessThan(5e-3);
    for (let vIndex = 0; vIndex < result.field.height; vIndex += 37) {
      for (let uIndex = 0; uIndex < result.field.width; uIndex += 41) {
        const mirrorV = result.field.height - 1 - vIndex;
        const mirrorU = result.field.width - 1 - uIndex;
        const index = vIndex * result.field.width + uIndex;
        const mirrorIndex = mirrorV * result.field.width + mirrorU;
        expect(result.field.intensity[index]).toBeCloseTo(result.field.intensity[mirrorIndex] ?? 0, 12);
      }
    }
  });

  it("matches the Airy/Bessel analytic radial profile within declared tolerance", () => {
    const result = runCircularApertureValidation();
    const config = result.config;

    expect(airyCircularApertureIntensity(0, config)).toBe(1);
    for (const sample of result.radialProfile.slice(0, 8)) {
      expect(sample.analyticIntensity).toBeCloseTo(airyCircularApertureIntensity(sample.radiusM, config), 12);
    }
    expect(result.residuals.rmsResidual).toBeLessThan(1e-3);
    expect(result.residuals.maxResidual).toBeLessThan(2e-3);
    expect(result.comparison.energy.relativePlaneIntegralError).toBeLessThan(1e-3);
  });

  it("detects the first minimum position within tolerance when the plane includes it", () => {
    const result = runCircularApertureValidation({
      observationPlane: {
        ...defaultCircularApertureValidationConfig().observationPlane,
        sizeM: 20e-3
      },
      radialSamples: 192,
      numerical: {
        ...defaultCircularApertureValidationConfig().numerical,
        radialObservationSamples: 192
      }
    });

    expect(result.expected.firstMinimumInsidePlaneDiagonal).toBe(true);
    expect(result.comparison.firstMinimumSearchStatus).toBe("measured");
    expect(result.comparison.measuredFirstMinimumRadiusM).not.toBeNull();
    expect(result.residuals.firstMinimumErrorM).not.toBeNull();
    expect(result.residuals.firstMinimumErrorM ?? Infinity).toBeLessThan(0.15e-3);
  });

  it("updates numerical propagation when observation z changes", () => {
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
    expect(far.resultHash).not.toBe(near.resultHash);
    expect(far.radialProfile[12]?.numericalIntensity).not.toBeCloseTo(near.radialProfile[12]?.numericalIntensity ?? 0, 6);
  });

  it("warns when aperture or observation sampling is under-resolved", () => {
    const result = runCircularApertureValidation({
      observationPlane: {
        ...defaultCircularApertureValidationConfig().observationPlane,
        resolution: 33
      },
      numerical: {
        method: "radial-huygens-fresnel-quadrature",
        apertureRadialSamples: 8,
        apertureAngularSamples: 24,
        radialObservationSamples: 32
      }
    });

    expect(result.warnings.some((warning) => warning.code === "validation.diffraction.underResolvedNumericalPropagation")).toBe(true);
  });

  it("uses deterministic hashes for benchmark config and result", () => {
    const a = runCircularApertureValidation();
    const b = runCircularApertureValidation(structuredClone(defaultCircularApertureValidationConfig()));

    expect(a.configHash).toBe(b.configHash);
    expect(a.resultHash).toBe(b.resultHash);
  });

  it("exports validation JSON and Markdown with numerical method, formulas, residuals, warnings, and boundary language", () => {
    const result = runCircularApertureValidation();
    const json = JSON.stringify(circularApertureValidationJson(result));
    const markdown = circularApertureValidationMarkdown(result);

    expect(json).toContain("emmicro.circularApertureValidation.v2");
    expect(json).toContain("radial-huygens-fresnel-quadrature");
    expect(json).toContain("numericalIndependentOfAnalyticReference");
    expect(json).toContain("numericalFieldPreview");
    expect(json).toContain("analyticFieldPreview");
    expect(json).toContain("residualFieldPreview");
    expect(json).toContain("I/I0 = [2 J1(k a sin(theta)) / (k a sin(theta))]^2");
    expect(json).toContain("U(rho) ~= integral_aperture");
    expect(json).toContain("validation.diffraction.firstMinimumOutsidePlane");
    expect(json).toContain("finitePlaneIntegralRelativeError");
    expect(markdown).toContain("circular pinhole");
    expect(markdown).toContain("Numerical path independent of analytic Airy renderer: yes");
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
