import { describe, expect, it } from "vitest";
import {
  createDefaultRcwaPreviewSpec,
  createRcwaNoPatternSpec,
  createRcwaTmmConsistencyReport,
  l93RcwaPreviewBoundary,
  rcwaConvergenceCsv,
  rcwaOrdersCsv,
  rcwaPreviewHardHarmonics,
  rcwaPreviewReportJson,
  rcwaPreviewReportMarkdown,
  rcwaTmmConsistencyCsv,
  runRcwaHarmonicConvergence,
  runRcwaPreview
} from "./rcwaPreview";

describe("L9.3 RCWA preview structure", () => {
  it("creates a deterministic 1D binary grating spec", () => {
    const spec = createDefaultRcwaPreviewSpec();
    expect(spec.id).toBe("l93-rcwa-default-binary-grating");
    expect(spec.dutyCycle).toBe(0.5);
    expect(spec.harmonicCount).toBe(9);
    expect(spec.gratingMaterial.refractiveIndex.n).toBeGreaterThan(spec.backgroundMaterial.refractiveIndex.n);
  });

  it("rejects invalid duty cycle and invalid geometry", () => {
    expect(() => createDefaultRcwaPreviewSpec({ dutyCycle: -0.1 })).toThrow(/duty cycle/i);
    expect(() => createDefaultRcwaPreviewSpec({ wavelengthM: 0 })).toThrow(/wavelength/i);
    expect(() => createDefaultRcwaPreviewSpec({ periodM: 0 })).toThrow(/period/i);
    expect(() => createDefaultRcwaPreviewSpec({ depthM: -1e-9 })).toThrow(/depth/i);
  });

  it("computes propagating and evanescent order status", () => {
    const result = runRcwaPreview(createDefaultRcwaPreviewSpec({ periodM: 600e-9, harmonicCount: 7 }));
    expect(result.orders.some((order) => order.transmittedStatus === "propagating")).toBe(true);
    expect(result.orders.some((order) => order.transmittedStatus === "evanescent" || order.reflectedStatus === "evanescent")).toBe(true);
    expect(result.orders.find((order) => order.order === 0)?.transmittedAngleRad).toBeTypeOf("number");
  });

  it("hashes RCWA results deterministically and is sensitive to period", () => {
    const a = runRcwaPreview(createDefaultRcwaPreviewSpec());
    const b = runRcwaPreview(createDefaultRcwaPreviewSpec());
    const c = runRcwaPreview(createDefaultRcwaPreviewSpec({ periodM: 1100e-9 }));
    expect(a.resultHash).toBe(b.resultHash);
    expect(a.resultHash).not.toBe(c.resultHash);
  });
});

describe("L9.3 RCWA preview solver", () => {
  it("runs a simple binary grating without NaN or Infinity", () => {
    const result = runRcwaPreview(createDefaultRcwaPreviewSpec());
    expect(result.type).toBe("boundedInBrowser1dRcwaPreview");
    expect(result.orders.length).toBe(9);
    for (const order of result.orders) {
      expect(Number.isFinite(order.reflectedEfficiency)).toBe(true);
      expect(Number.isFinite(order.transmittedEfficiency)).toBe(true);
    }
  });

  it("reports reflected and transmitted diffraction orders with totals", () => {
    const result = runRcwaPreview(createDefaultRcwaPreviewSpec());
    expect(result.totalReflectance).toBeGreaterThanOrEqual(0);
    expect(result.totalTransmittance).toBeGreaterThan(0);
    expect(result.totalAbsorbance).toBeGreaterThanOrEqual(0);
    expect(result.totalEnergy).toBeCloseTo(1, 10);
    expect(result.energyBalanceError).toBeLessThan(1e-9);
    expect(result.orders.some((order) => Math.abs(order.order) === 1 && order.transmittedEfficiency > 0)).toBe(true);
  });

  it("warns for high harmonic count and respects the hard cap", () => {
    const result = runRcwaPreview(createDefaultRcwaPreviewSpec({ harmonicCount: 81 }));
    expect(result.requestedHarmonicCount).toBe(81);
    expect(result.harmonicCount).toBe(rcwaPreviewHardHarmonics);
    expect(result.warnings.map((warning) => warning.code)).toContain("maxwell.rcwaPreview.harmonicCountCapped");
    expect(result.warnings.map((warning) => warning.code)).toContain("maxwell.rcwaPreview.highHarmonicCount");
  });
});

describe("L9.3 RCWA validation and exports", () => {
  it("compares no-pattern cases against planar TMM with low residual", () => {
    const spec = createRcwaNoPatternSpec(createDefaultRcwaPreviewSpec());
    const result = runRcwaPreview(spec);
    expect(result.effectiveLayer.patterned).toBe(false);
    expect(result.tmmConsistency.status).toBe("pass");
    expect(result.tmmConsistency.residual).not.toBeNull();
    expect(result.tmmConsistency.residual ?? 1).toBeLessThan(1e-10);
    expect(result.orders.filter((order) => order.reflectedEfficiency > 0 || order.transmittedEfficiency > 0).map((order) => order.order)).toEqual([0]);
  });

  it("marks TMM consistency not applicable for patterned gratings", () => {
    const report = createRcwaTmmConsistencyReport(createDefaultRcwaPreviewSpec());
    expect(report.status).toBe("not-applicable");
    expect(report.reason).toContain("no-pattern");
  });

  it("runs harmonic convergence sweep", () => {
    const convergence = runRcwaHarmonicConvergence(createDefaultRcwaPreviewSpec(), [3, 5, 7, 9, 11]);
    expect(convergence.rows.map((row) => row.harmonicCount)).toEqual([3, 5, 7, 9, 11]);
    expect(convergence.maxEnergyBalanceError).toBeLessThan(1e-9);
    expect(convergence.rows.every((row) => Number.isFinite(row.totalTransmittance))).toBe(true);
  });

  it("exports Markdown, JSON, order CSV, convergence CSV, and TMM CSV", () => {
    const result = runRcwaPreview(createDefaultRcwaPreviewSpec());
    const convergence = runRcwaHarmonicConvergence(createDefaultRcwaPreviewSpec(), [3, 5]);
    const markdown = rcwaPreviewReportMarkdown({ schema: "emmicro.rcwaPreview.report.v1", boundary: l93RcwaPreviewBoundary, result, convergence });
    const json = rcwaPreviewReportJson({ schema: "emmicro.rcwaPreview.report.v1", boundary: l93RcwaPreviewBoundary, result, convergence });
    expect(markdown).toContain("L9.3 In-Browser 1D RCWA Preview Report");
    expect(markdown).toContain("not arbitrary 2D-periodic RCWA");
    expect(JSON.parse(json).result.analysisId).toBe("analysis.maxwell.l93.rcwaPreview");
    expect(rcwaOrdersCsv(result)).toContain("order,reflected_angle_deg");
    expect(rcwaConvergenceCsv(convergence)).toContain("harmonic_count,total_reflectance");
    expect(rcwaTmmConsistencyCsv(result.tmmConsistency)).toContain("status,residual");
  });
});

describe("L9.3 RCWA boundaries and regressions", () => {
  it("does not claim arbitrary 2D-periodic RCWA, production certification, 3D Maxwell, FEM, or BEM", () => {
    const text = [
      ...l93RcwaPreviewBoundary,
      ...runRcwaPreview(createDefaultRcwaPreviewSpec()).provenance.limitations
    ].join(" ");
    expect(text).toContain("not arbitrary 2D-periodic RCWA");
    expect(text).toContain("not production RCWA certification");
    expect(text).toContain("not arbitrary 3D Maxwell");
    expect(text).toContain("not FEM/BEM");
    expect(text).not.toMatch(/production RCWA is available|arbitrary 3D Maxwell is implemented|FEM\/BEM solver ready|2D-periodic RCWA implemented/i);
  });
});
