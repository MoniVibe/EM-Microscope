import { describe, expect, it } from "vitest";
import {
  compareFocusFieldMtf,
  defaultL71QualificationSpec,
  fieldMtfMapCsv,
  focusFieldComparisonCsv,
  focusSweepCsv,
  qualifyFocusFieldMtf,
  qualificationReportJson,
  qualificationReportMarkdown,
  runFieldMtfMap,
  runSyntheticFocusSweepMtf
} from "./focusFieldMtfQualification";

describe("L7.1 focus + field MTF qualification core", () => {
  it("runs a synthetic focus sweep with best focus, depth of focus, edge warning, and CSV export", () => {
    const focus = runSyntheticFocusSweepMtf({
      focusPositionsMm: [-0.2, -0.1, 0, 0.05, 0.1, 0.2],
      bestFocusMm: 0.05,
      threshold: 0.05
    });
    const edge = runSyntheticFocusSweepMtf({
      focusPositionsMm: [0, 0.1, 0.2],
      bestFocusMm: 0,
      threshold: 0.1
    });

    expect(focus.schema).toBe("emmicro.l71.focusSweepMtf.v1");
    expect(focus.rows).toHaveLength(6);
    expect(focus.bestFocus.focusZMm).toBeCloseTo(0.05);
    expect(focus.depthOfFocus.rangeMm).toBeGreaterThan(0);
    expect(focusSweepCsv(focus)).toContain("focus_z_mm");
    expect(edge.warnings.some((warning) => warning.code === "l71.focus.bestFocusAtSweepEdge")).toBe(true);
  });

  it("runs a center/corner field MTF map with falloff, uniformity, hashes, and CSV export", () => {
    const field = runFieldMtfMap({
      layout: "center-corners",
      widthPx: 192,
      heightPx: 144,
      centerBlurSigmaPx: 0.65,
      fieldBlurSigmaPx: 2.2,
      pixelPitchUm: 3.45
    });

    expect(field.schema).toBe("emmicro.l71.fieldMtfMap.v1");
    expect(field.rows).toHaveLength(5);
    expect(field.bestRoi?.roi.role).toBe("center");
    expect(field.worstRoi?.roi.role).toBe("corner");
    expect(field.centerToCornerFalloff).toBeGreaterThan(0);
    expect(field.fieldUniformityScore).toBeGreaterThan(0);
    expect(field.resultHash).toMatch(/^[0-9a-f]+$/);
    expect(fieldMtfMapCsv(field)).toContain("roi_id");
  });

  it("qualifies focus and field results without claiming ISO, Imatest, or calibrated optical model status", () => {
    const focus = runSyntheticFocusSweepMtf({
      focusPositionsMm: [-0.2, -0.1, 0, 0.05, 0.1, 0.2],
      bestFocusMm: 0.05,
      threshold: 0.05
    });
    const field = runFieldMtfMap({
      layout: "center-corners",
      widthPx: 192,
      heightPx: 144,
      centerBlurSigmaPx: 0.65,
      fieldBlurSigmaPx: 1.4
    });
    const pass = qualifyFocusFieldMtf({
      focusSweep: focus,
      fieldMap: field,
      spec: {
        ...defaultL71QualificationSpec(),
        centerMtf50Min: 0.05,
        cornerMtf50Min: 0.03,
        nyquistMtfMin: 0,
        depthOfFocusMinMm: 0.01
      }
    });
    const fail = qualifyFocusFieldMtf({
      focusSweep: focus,
      fieldMap: field,
      spec: {
        ...defaultL71QualificationSpec(),
        centerMtf50Min: 1,
        cornerMtf50Min: 1,
        nyquistMtfMin: 1,
        depthOfFocusMinMm: 1
      }
    });
    const markdown = qualificationReportMarkdown(fail, focus, field);

    expect(pass.status).toBe("pass");
    expect(fail.status).toBe("fail");
    expect(fail.issues.some((issue) => issue.code === "l71.qualification.centerMtf50")).toBe(true);
    expect(qualificationReportJson(fail)).toContain("l71.qualification.depthOfFocus");
    expect(markdown).toContain("not ISO 12233 certification");
    expect(markdown).toContain("not calibrated optical model fitting");
    expect(markdown).not.toMatch(/Imatest-equivalent testing is implemented|calibrated optical model fitting is implemented/i);
  });

  it("compares measured and simulated focus/field MTF residuals and exports comparison CSV", () => {
    const measuredFocus = runSyntheticFocusSweepMtf({
      focusPositionsMm: [-0.1, 0, 0.05, 0.1, 0.2],
      bestFocusMm: 0.05,
      threshold: 0.1
    });
    const simulatedFocus = runSyntheticFocusSweepMtf({
      focusPositionsMm: [-0.1, 0, 0.05, 0.1, 0.2],
      bestFocusMm: 0,
      threshold: 0.1
    });
    const measuredField = runFieldMtfMap({ layout: "center-corners", centerBlurSigmaPx: 0.8, fieldBlurSigmaPx: 2.0 });
    const simulatedField = runFieldMtfMap({ layout: "center-corners", centerBlurSigmaPx: 0.7, fieldBlurSigmaPx: 1.5 });
    const comparison = compareFocusFieldMtf({
      measuredFocus,
      simulatedFocus,
      measuredField,
      simulatedField
    });
    const missingField = compareFocusFieldMtf({ measuredFocus, simulatedFocus });

    expect(comparison.schema).toBe("emmicro.l71.focusFieldComparison.v1");
    expect(comparison.bestFocusDeltaMm).toBeCloseTo(0.05);
    expect(comparison.focusMetricRmsDelta).toBeGreaterThan(0);
    expect(comparison.fieldMtf50RmsDelta).toBeGreaterThan(0);
    expect(comparison.matchedFieldRoiCount).toBe(5);
    expect(comparison.diagnosticFit.note).toContain("not calibrated optical model fitting");
    expect(focusFieldComparisonCsv(comparison)).toContain("kind,id_or_focus");
    expect(missingField.warnings.some((warning) => warning.code === "l71.comparison.fieldMapMissing")).toBe(true);
  });
});
