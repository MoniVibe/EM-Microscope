import { describe, expect, it } from "vitest";
import {
  advisorValidationReviewCsv,
  advisorValidationReviewJson,
  advisorValidationReviewMarkdown,
  defaultSlitOrderValidationConfig,
  runAdvisorValidationReview,
  runSlitOrderValidation,
  slitOrderValidationJson,
  slitOrderValidationMarkdown
} from "./slitOrderValidation";

describe("L6.3 long slit validation", () => {
  it("predicts first minima near +/-5 mm for lambda=500nm, a=100um, L=1m", () => {
    const result = runSlitOrderValidation({ kind: "long-single-slit-sinc2" });
    const firstMinima = result.expected.features.filter((feature) => Math.abs(feature.order) === 1);

    expect(result.config.kind).toBe("long-single-slit-sinc2");
    expect(result.expected.primarySpacingSmallAngleM).toBeCloseTo(5e-3, 12);
    expect(firstMinima).toHaveLength(2);
    for (const feature of firstMinima) {
      expect(Math.abs(feature.expectedPositionM)).toBeGreaterThan(4.99e-3);
      expect(Math.abs(feature.expectedPositionM)).toBeLessThan(5.01e-3);
      expect(feature.visible).toBe(true);
      expect(feature.measuredPositionM).not.toBeNull();
      expect(feature.errorM ?? Infinity).toBeLessThan(0.15e-3);
    }
  });

  it("matches sinc squared analytic profile within tolerance without using it as the numerical map", () => {
    const result = runSlitOrderValidation({ kind: "long-single-slit-sinc2" });

    expect(result.numericalField.provenance.kind).toBe("simulated");
    expect(result.analyticField.provenance.kind).toBe("analytic");
    expect(result.profile.some((sample) => Math.abs(sample.residual) > 1e-8)).toBe(true);
    expect(result.residuals.rmsResidual).toBeLessThan(1e-3);
    expect(result.residuals.maxResidual).toBeLessThan(2e-3);
    expect(result.formulas.singleSlitIntensity).toContain("sinc^2");
  });

  it("warns when detector plane is too narrow to include expected minima", () => {
    const result = runSlitOrderValidation({
      kind: "long-single-slit-sinc2",
      observationPlane: {
        ...defaultSlitOrderValidationConfig("long-single-slit-sinc2").observationPlane,
        widthM: 6e-3
      }
    });

    expect(result.expected.features.some((feature) => !feature.visible)).toBe(true);
    expect(result.warnings.some((warning) => warning.code === "validation.diffraction.featureOutsidePlane")).toBe(true);
  });
});

describe("L6.3 double slit order validation", () => {
  it("predicts order spacing near 5 mm for lambda=500nm, d=100um, L=1m", () => {
    const result = runSlitOrderValidation({ kind: "double-slit-orders" });

    expect(result.config.kind).toBe("double-slit-orders");
    expect(result.expected.primarySpacingSmallAngleM).toBeCloseTo(5e-3, 12);
    expect(result.expected.features.find((feature) => feature.order === -2)?.smallAnglePositionM).toBeCloseTo(-10e-3, 12);
    expect(result.expected.features.find((feature) => feature.order === -1)?.smallAnglePositionM).toBeCloseTo(-5e-3, 12);
    expect(result.expected.features.find((feature) => feature.order === 0)?.smallAnglePositionM).toBeCloseTo(0, 12);
    expect(result.expected.features.find((feature) => feature.order === 1)?.smallAnglePositionM).toBeCloseTo(5e-3, 12);
    expect(result.expected.features.find((feature) => feature.order === 2)?.smallAnglePositionM).toBeCloseTo(10e-3, 12);
  });

  it("reports order positions for m=-2,-1,0,+1,+2 when visible", () => {
    const result = runSlitOrderValidation({ kind: "double-slit-orders" });
    const visibleCoreOrders = result.expected.features.filter((feature) => Math.abs(feature.order) <= 2);

    expect(visibleCoreOrders).toHaveLength(5);
    for (const feature of visibleCoreOrders) {
      expect(feature.kind).toBe("order-maximum");
      expect(feature.visible).toBe(true);
      expect(feature.measuredPositionM).not.toBeNull();
      expect(feature.errorM ?? Infinity).toBeLessThan(0.15e-3);
    }
  });

  it("matches analytic interference orders and finite-slit envelope within tolerance", () => {
    const result = runSlitOrderValidation({ kind: "double-slit-orders" });

    expect(result.formulas.doubleSlitOrders).toContain("d sin(theta) = m lambda");
    expect(result.formulas.doubleSlitIntensity).toContain("sinc^2");
    expect(result.formulas.doubleSlitIntensity).toContain("cos^2");
    expect(result.profile.some((sample) => Math.abs(sample.residual) > 1e-8)).toBe(true);
    expect(result.residuals.rmsResidual).toBeLessThan(1e-3);
    expect(result.residuals.maxResidual).toBeLessThan(2e-3);
  });
});

describe("L6.5 Advisor Review Mode", () => {
  it("runs circular aperture, long slit, double slit, thin lens, and coherence validations", () => {
    const review = runAdvisorValidationReview();

    expect(review.generatedBenchmarks).toEqual([
      "circular-pinhole-airy-bessel",
      "long-single-slit-sinc2",
      "double-slit-orders",
      "ideal-thin-lens-focal-plane",
      "coherence-demonstrator-double-slit"
    ]);
    expect(review.circular.benchmark).toBe("Circular pinhole Airy/Bessel");
    expect(review.singleSlit.benchmark).toBe("Long single slit sinc^2");
    expect(review.doubleSlit.benchmark).toBe("Double slit / grating orders");
    expect(review.thinLens.benchmark).toBe("Ideal thin lens focal plane");
    expect(review.coherence.benchmark).toBe("Coherence Demonstrator: double slit");
    expect(review.singleSlit.expected).toContain("5");
    expect(review.doubleSlit.expected).toContain("5");
    expect(review.thinLens.expected).toContain("61");
    expect(review.coherence.expected).toContain("visibility");
    expect(review.singleSlit.status).toBe("pass");
    expect(review.doubleSlit.status).toBe("pass");
    expect(review.thinLens.status).toBe("pass");
    expect(review.coherence.status).toBe("pass");
  });

  it("exports a combined advisor validation report with formulas, residuals, warnings, and limitations", () => {
    const review = runAdvisorValidationReview();
    const json = JSON.stringify(advisorValidationReviewJson(review));
    const markdown = advisorValidationReviewMarkdown(review);
    const csv = advisorValidationReviewCsv(review);
    const single = runSlitOrderValidation({ kind: "long-single-slit-sinc2" });
    const double = runSlitOrderValidation({ kind: "double-slit-orders" });

    expect(json).toContain("emmicro.advisorValidationReview.v3");
    expect(markdown).toContain("Circular pinhole Airy/Bessel");
    expect(markdown).toContain("Long single slit sinc^2");
    expect(markdown).toContain("Double slit / grating orders");
    expect(markdown).toContain("Ideal thin lens focal plane");
    expect(markdown).toContain("Coherence Demonstrator: double slit");
    expect(markdown).toContain("not a full stochastic source engine");
    expect(markdown).toContain("not a full 3D Maxwell/FDTD/FEM/BEM/RCWA solve");
    expect(csv).toContain("benchmark,expected,measured,rms_residual,max_residual,warning_count,status");
    expect(JSON.stringify(slitOrderValidationJson(single))).toContain("emmicro.slitOrderValidation.v1");
    expect(slitOrderValidationMarkdown(double)).toContain("d sin(theta) = m lambda");
    expect(`${json}\n${markdown}\n${csv}`).not.toMatch(/full 3D Maxwell aperture solver|FDTD aperture solved|physical metal aperture solved/i);
  });

  it("warns on under-sampled slit propagation", () => {
    const result = runSlitOrderValidation({
      kind: "double-slit-orders",
      numerical: {
        ...defaultSlitOrderValidationConfig("double-slit-orders").numerical,
        apertureSamples: 48
      },
      observationPlane: {
        ...defaultSlitOrderValidationConfig("double-slit-orders").observationPlane,
        widthSamples: 65
      }
    });

    expect(result.warnings.some((warning) => warning.code === "validation.diffraction.underResolvedSlitPropagation")).toBe(true);
  });
});
