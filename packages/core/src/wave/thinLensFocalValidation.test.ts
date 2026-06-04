import { describe, expect, it } from "vitest";
import {
  airyThinLensFocalIntensity,
  defaultThinLensFocalValidationConfig,
  expectedThinLensFocalValues,
  runThinLensFocalValidation,
  thinLensFocalValidationCsv,
  thinLensFocalValidationJson,
  thinLensFocalValidationMarkdown,
  thinLensFocalValidationPipeline
} from "./thinLensFocalValidation";

describe("L6.4 ideal thin lens focal-plane validation", () => {
  it("predicts the first Airy dark ring near 61 um for lambda=500nm, f=20mm, D=200um", () => {
    const result = runThinLensFocalValidation();

    expect(result.expected.firstDarkCoefficient).toBeCloseTo(1.21967, 4);
    expect(result.expected.firstDarkRadiusM).toBeGreaterThan(60e-6);
    expect(result.expected.firstDarkRadiusM).toBeLessThan(62e-6);
    expect(result.expected.firstDarkRadiusSmallAngleM).toBeCloseTo(result.expected.firstDarkRadiusM, 15);
    expect(result.expected.firstDarkInsidePlane).toBe(true);
  });

  it("renders the ordered source-lens-pupil-propagation-focal-plane pipeline", () => {
    const result = runThinLensFocalValidation();
    const pipeline = thinLensFocalValidationPipeline(result).map((step) => `${step.label}: ${step.detail}`).join("\n");

    expect(pipeline).toContain("Source");
    expect(pipeline).toContain("Lens plane");
    expect(pipeline).toContain("Pupil");
    expect(pipeline).toContain("Propagation");
    expect(pipeline).toContain("Observation");
    expect(pipeline).toContain("Check");
    expect(pipeline).toContain("first dark radius");
  });

  it("keeps the thin-lens phase convention explicit", () => {
    const result = runThinLensFocalValidation();

    expect(result.config.lens.phaseConvention).toBe("tau_lens(u,v)=P(u,v) exp[-i k (u^2+v^2)/(2f)]");
    expect(result.formulas.thinLensPhase).toContain("exp[-i k");
    expect(result.formulas.pupil).toContain("D/2");
  });

  it("computes a numerical focal map without reusing the analytic Airy map", () => {
    const result = runThinLensFocalValidation();

    expect(result.type).toBe("l64ThinLensFocalValidation");
    expect(result.analysisId).toBe("analysis.wave.l6.phase4.thinLensFocalValidation");
    expect(result.comparison.numericalMethod).toBe("radial-fresnel-thin-lens-quadrature");
    expect(result.comparison.numericalIndependentOfAnalyticReference).toBe(true);
    expect(result.numericalField.id).toContain("numerical-intensity-map");
    expect(result.analyticField.id).toContain("analytic-intensity-map");
    expect(result.residualField.id).toContain("residual-intensity-map");
    expect(result.numericalField.provenance.kind).toBe("simulated");
    expect(result.analyticField.provenance.kind).toBe("analytic");
    expect(result.radialProfile.some((sample) => Math.abs(sample.residual) > 1e-8)).toBe(true);
  });

  it("matches the analytic Airy PSF within tolerance at the focal plane", () => {
    const result = runThinLensFocalValidation();

    expect(airyThinLensFocalIntensity(0, result.config)).toBe(1);
    for (const sample of result.radialProfile.slice(0, 10)) {
      expect(sample.analyticIntensity).toBeCloseTo(airyThinLensFocalIntensity(sample.radiusM, result.config), 12);
    }
    expect(result.residuals.rmsResidual).toBeLessThan(1e-3);
    expect(result.residuals.maxResidual).toBeLessThan(3e-3);
    expect(result.residuals.centerNormalizationError).toBeLessThan(1e-10);
    expect(result.residuals.radialSymmetryError).toBeLessThan(1e-10);
  });

  it("reports measured first dark radius when visible", () => {
    const result = runThinLensFocalValidation();

    expect(result.comparison.firstDarkSearchStatus).toBe("measured");
    expect(result.comparison.measuredFirstDarkRadiusM).not.toBeNull();
    expect(result.comparison.firstDarkRadiusErrorM ?? Infinity).toBeLessThan(2e-6);
  });

  it("warns when the field of view excludes the first dark ring", () => {
    const result = runThinLensFocalValidation({
      observationPlane: {
        ...defaultThinLensFocalValidationConfig().observationPlane,
        sizeM: 80e-6
      }
    });

    expect(result.expected.firstDarkInsidePlane).toBe(false);
    expect(result.warnings.some((warning) => warning.code === "validation.thinLens.firstDarkOutsidePlane")).toBe(true);
  });

  it("updates focus metrics when observation z moves away from f", () => {
    const inFocus = runThinLensFocalValidation();
    const defocused = runThinLensFocalValidation({
      observationPlane: {
        ...defaultThinLensFocalValidationConfig().observationPlane,
        zM: 22e-3
      }
    });
    const offFocusScanSample = inFocus.focusScan.find((sample) => Math.abs(sample.zM - 22e-3) < 1e-9);

    expect(inFocus.comparison.focus.bestFocusZM).toBeCloseTo(20e-3, 12);
    expect(inFocus.comparison.focus.configuredPlanePeakRelative).toBeCloseTo(1, 6);
    expect(offFocusScanSample?.centerIntensityRelative ?? 1).toBeLessThan(0.999);
    expect(defocused.comparison.focus.configuredPlanePeakRelative).toBeLessThan(0.999);
    expect(defocused.residuals.rmsResidual).toBeGreaterThan(inFocus.residuals.rmsResidual);
  });

  it("exports JSON, Markdown, and CSV with formulas, values, residuals, warnings, and limitations", () => {
    const result = runThinLensFocalValidation();
    const json = JSON.stringify(thinLensFocalValidationJson(result));
    const markdown = thinLensFocalValidationMarkdown(result);
    const csv = thinLensFocalValidationCsv(result);

    expect(json).toContain("emmicro.thinLensFocalValidation.v1");
    expect(json).toContain("radial-fresnel-thin-lens-quadrature");
    expect(json).toContain("numericalIndependentOfAnalyticReference");
    expect(json).toContain("tau_lens(u,v)");
    expect(markdown).toContain("about 61 um");
    expect(markdown).toContain("zero-thickness phase mask");
    expect(markdown).toContain("not a full vector Maxwell lens solve");
    expect(csv).toContain("expected_first_dark_radius_um");
    expect(csv).toContain("focus_scan");
    expect(`${json}\n${markdown}\n${csv}`).not.toMatch(/full 3D Maxwell lens solver|FDTD lens solved|real thick lens solved|digital twin solved/i);
  });

  it("uses deterministic hashes for benchmark config and result", () => {
    const a = runThinLensFocalValidation();
    const b = runThinLensFocalValidation(structuredClone(defaultThinLensFocalValidationConfig()));

    expect(a.configHash).toBe(b.configHash);
    expect(a.resultHash).toBe(b.resultHash);
    expect(expectedThinLensFocalValues(a.config).firstDarkRadiusM).toBe(a.expected.firstDarkRadiusM);
  });
});
