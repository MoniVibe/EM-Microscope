import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import {
  generateSlantedEdgeTarget,
  l70MtfLimitations,
  runSlantedEdgeMtf,
  type L70ImageLike,
  type L70Rect,
  type L70ResolutionTargetImage,
  type SlantedEdgeMtfResult
} from "./slantedEdgeMtf";

export type L71FocusMetric = "mtf50" | "mtf10" | "nyquist" | "mtf-area";
export type L71FieldLayout = "center" | "center-corners" | "grid-3x3";
export type L71QualificationStatus = "pass" | "fail" | "warning";

export type L71FocusSweepInput = {
  id?: string;
  label?: string;
  focusPositionsMm?: number[];
  widthPx?: number;
  heightPx?: number;
  edgeAngleDeg?: number;
  contrast?: number;
  pixelPitchUm?: number | null;
  bestFocusMm?: number;
  baseBlurSigmaPx?: number;
  defocusBlurSigmaPerMm?: number;
  metric?: L71FocusMetric;
  threshold?: number;
  oversampling?: number;
};

export type L71FocusSweepRow = {
  index: number;
  focusZMm: number;
  blurSigmaPx: number;
  mtf50CyclesPerPx: number | null;
  mtf10CyclesPerPx: number | null;
  mtfAtNyquist: number | null;
  mtfArea: number;
  selectedMetricValue: number | null;
  resultHash: string;
  warningCodes: string[];
};

export type L71DepthOfFocus = {
  threshold: number;
  startMm: number | null;
  stopMm: number | null;
  rangeMm: number;
  rowCount: number;
};

export type L71FocusSweepResult = {
  schema: "emmicro.l71.focusSweepMtf.v1";
  appVersion: "L7.1 Focus + Field MTF Qualification Workbench";
  id: string;
  label: string;
  metric: L71FocusMetric;
  threshold: number;
  rows: L71FocusSweepRow[];
  bestFocus: {
    focusZMm: number | null;
    metricValue: number | null;
    rowIndex: number | null;
  };
  depthOfFocus: L71DepthOfFocus;
  warnings: SolverWarning[];
  limitations: string[];
  resultHash: string;
};

export type L71FieldRoiRole = "center" | "corner" | "mid-field" | "custom";

export type L71FieldRoiSpec = L70Rect & {
  id: string;
  label: string;
  role: L71FieldRoiRole;
};

export type L71FieldMtfMapInput = {
  id?: string;
  label?: string;
  image?: L70ResolutionTargetImage | L70ImageLike;
  widthPx?: number;
  heightPx?: number;
  layout?: L71FieldLayout;
  rois?: L71FieldRoiSpec[];
  edgeAngleDeg?: number;
  contrast?: number;
  pixelPitchUm?: number | null;
  centerBlurSigmaPx?: number;
  fieldBlurSigmaPx?: number;
  oversampling?: number;
};

export type L71FieldMtfRow = {
  roi: L71FieldRoiSpec;
  edgeAngleDeg: number;
  edgeContrast: number;
  mtf50CyclesPerPx: number | null;
  mtf10CyclesPerPx: number | null;
  mtfAtNyquist: number | null;
  mtf50LpPerMm: number | null;
  warningCodes: string[];
  resultHash: string;
};

export type L71FieldMtfMapResult = {
  schema: "emmicro.l71.fieldMtfMap.v1";
  appVersion: "L7.1 Focus + Field MTF Qualification Workbench";
  id: string;
  label: string;
  layout: L71FieldLayout;
  image: {
    widthPx: number;
    heightPx: number;
    pixelPitchUm: number | null;
    sourceHash: string;
  };
  rows: L71FieldMtfRow[];
  bestRoi: L71FieldMtfRow | null;
  worstRoi: L71FieldMtfRow | null;
  centerMtf50CyclesPerPx: number | null;
  cornerAverageMtf50CyclesPerPx: number | null;
  centerToCornerFalloff: number | null;
  fieldUniformityScore: number | null;
  warnings: SolverWarning[];
  limitations: string[];
  resultHash: string;
};

export type L71QualificationSpec = {
  centerMtf50Min: number;
  cornerMtf50Min: number;
  nyquistMtfMin: number;
  depthOfFocusMinMm: number;
  disallowSaturatedRois: boolean;
  disallowLowContrastRois: boolean;
  disallowBadAngleRois: boolean;
};

export type L71QualificationIssue = {
  code: string;
  severity: "fail" | "warning";
  message: string;
  roiId?: string;
  metric?: string;
  value?: number | null;
  threshold?: number;
};

export type L71QualificationResult = {
  schema: "emmicro.l71.qualification.v1";
  appVersion: "L7.1 Focus + Field MTF Qualification Workbench";
  id: string;
  label: string;
  status: L71QualificationStatus;
  spec: L71QualificationSpec;
  focusSweepHash: string;
  fieldMapHash: string;
  issues: L71QualificationIssue[];
  worstRoi: L71FieldMtfRow | null;
  recommendation: string;
  warnings: SolverWarning[];
  limitations: string[];
  resultHash: string;
};

export type L71FocusFieldComparisonResult = {
  schema: "emmicro.l71.focusFieldComparison.v1";
  appVersion: "L7.1 Focus + Field MTF Qualification Workbench";
  id: string;
  label: string;
  measuredHash: string;
  simulatedHash: string;
  bestFocusDeltaMm: number | null;
  focusMetricRmsDelta: number | null;
  fieldMtf50RmsDelta: number | null;
  matchedFieldRoiCount: number;
  focusRows: Array<{ focusZMm: number; measured: number | null; simulated: number | null; delta: number | null }>;
  fieldRows: Array<{ roiId: string; label: string; measuredMtf50: number | null; simulatedMtf50: number | null; delta: number | null }>;
  diagnosticFit: {
    defocusOffsetMm: number | null;
    note: string;
  };
  warnings: SolverWarning[];
  limitations: string[];
  resultHash: string;
};

export const l71FocusFieldLimitations = [
  ...l70MtfLimitations,
  "Focus and field qualification is diagnostic thresholding over slanted-edge MTF results; it is not ISO 12233 certification, Imatest-equivalent testing, or lab-accredited metrology.",
  "Measured-vs-simulated focus/field comparison is a diagnostic residual check and simple offset estimate only; it is not calibrated optical model fitting or a digital twin.",
  "Synthetic focus sweeps vary slanted-edge blur as a deterministic proxy for defocus; they do not add new optical propagation physics."
] as const;

export function runSyntheticFocusSweepMtf(input: L71FocusSweepInput = {}): L71FocusSweepResult {
  const focusPositionsMm = normalizeFocusPositions(input.focusPositionsMm);
  const bestFocusMm = finite(input.bestFocusMm ?? 0.04, 0.04);
  const baseBlurSigmaPx = Math.max(0.05, finite(input.baseBlurSigmaPx ?? 0.7, 0.7));
  const defocusBlurSigmaPerMm = Math.max(0, finite(input.defocusBlurSigmaPerMm ?? 18, 18));
  const rows = focusPositionsMm.map((focusZMm, index) => {
    const blurSigmaPx = baseBlurSigmaPx + Math.abs(focusZMm - bestFocusMm) * defocusBlurSigmaPerMm;
    const target = generateSlantedEdgeTarget({
      id: `l71-focus-target-${index}`,
      label: `L7.1 focus target ${focusZMm.toPrecision(4)} mm`,
      widthPx: input.widthPx ?? 160,
      heightPx: input.heightPx ?? 120,
      edgeAngleDeg: input.edgeAngleDeg ?? 5,
      contrast: input.contrast ?? 0.9,
      pixelPitchUm: input.pixelPitchUm ?? 3.45,
      blurSigmaPx
    });
    const mtf = runSlantedEdgeMtf({
      id: `l71-focus-mtf-${index}`,
      label: `L7.1 focus MTF ${focusZMm.toPrecision(4)} mm`,
      image: target,
      oversampling: input.oversampling ?? 4
    });
    return focusRow(index, focusZMm, blurSigmaPx, mtf, input.metric ?? "mtf50");
  });
  return finalizeFocusSweep({
    id: input.id ?? "l71-focus-sweep",
    label: input.label ?? "L7.1 synthetic focus sweep MTF",
    metric: input.metric ?? "mtf50",
    threshold: finite(input.threshold ?? 0.2, 0.2),
    rows
  });
}

export function finalizeFocusSweep({
  id,
  label,
  metric,
  threshold,
  rows
}: {
  id: string;
  label: string;
  metric: L71FocusMetric;
  threshold: number;
  rows: L71FocusSweepRow[];
}): L71FocusSweepResult {
  const warnings: SolverWarning[] = [];
  const best = bestFocusRow(rows);
  if (best && (best.index === 0 || best.index === rows.length - 1)) {
    warnings.push({
      code: "l71.focus.bestFocusAtSweepEdge",
      message: "Best focus is at the edge of the sweep; extend the focus range before trusting depth-of-focus."
    });
  }
  const depthOfFocus = computeDepthOfFocus(rows, threshold);
  if (depthOfFocus.rangeMm <= 0) {
    warnings.push({
      code: "l71.focus.noAcceptableFocusRange",
      message: "No focus positions met the selected MTF threshold."
    });
  }
  const partial = {
    schema: "emmicro.l71.focusSweepMtf.v1" as const,
    appVersion: "L7.1 Focus + Field MTF Qualification Workbench" as const,
    id,
    label,
    metric,
    threshold,
    rows,
    bestFocus: {
      focusZMm: best?.focusZMm ?? null,
      metricValue: best?.selectedMetricValue ?? null,
      rowIndex: best?.index ?? null
    },
    depthOfFocus,
    warnings,
    limitations: [...l71FocusFieldLimitations]
  };
  return {
    ...partial,
    resultHash: fnv1a64(stableStringify(resultForHash(partial)))
  };
}

export function fieldRoiPreset(layout: L71FieldLayout, widthPx: number, heightPx: number): L71FieldRoiSpec[] {
  const roiWidth = Math.max(40, Math.min(72, Math.floor(widthPx * 0.28)));
  const roiHeight = Math.max(40, Math.min(72, Math.floor(heightPx * 0.28)));
  const marginX = Math.max(8, Math.floor(widthPx * 0.07));
  const marginY = Math.max(8, Math.floor(heightPx * 0.07));
  const centerX = Math.round((widthPx - roiWidth) / 2);
  const centerY = Math.round((heightPx - roiHeight) / 2);
  const corners: L71FieldRoiSpec[] = [
    roi("top-left", "Top left", "corner", marginX, marginY, roiWidth, roiHeight),
    roi("top-right", "Top right", "corner", widthPx - marginX - roiWidth, marginY, roiWidth, roiHeight),
    roi("bottom-left", "Bottom left", "corner", marginX, heightPx - marginY - roiHeight, roiWidth, roiHeight),
    roi("bottom-right", "Bottom right", "corner", widthPx - marginX - roiWidth, heightPx - marginY - roiHeight, roiWidth, roiHeight)
  ];
  const center = roi("center", "Center", "center", centerX, centerY, roiWidth, roiHeight);
  if (layout === "center") return [center];
  if (layout === "center-corners") return [center, ...corners];
  const xs = [marginX, centerX, widthPx - marginX - roiWidth];
  const ys = [marginY, centerY, heightPx - marginY - roiHeight];
  const rows: L71FieldRoiSpec[] = [];
  for (let rowIndex = 0; rowIndex < 3; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < 3; columnIndex += 1) {
      const isCenter = rowIndex === 1 && columnIndex === 1;
      const isCorner = (rowIndex === 0 || rowIndex === 2) && (columnIndex === 0 || columnIndex === 2);
      rows.push(
        roi(
          `grid-${rowIndex}-${columnIndex}`,
          isCenter ? "Center" : `Field ${rowIndex + 1},${columnIndex + 1}`,
          isCenter ? "center" : isCorner ? "corner" : "mid-field",
          xs[columnIndex] ?? centerX,
          ys[rowIndex] ?? centerY,
          roiWidth,
          roiHeight
        )
      );
    }
  }
  return rows;
}

export function generateSyntheticFieldMtfTarget(input: L71FieldMtfMapInput = {}): { image: L70ImageLike; rois: L71FieldRoiSpec[]; sourceHash: string } {
  const widthPx = integerInRange(input.widthPx ?? 192, 96, 1024);
  const heightPx = integerInRange(input.heightPx ?? 144, 96, 1024);
  const layout = input.layout ?? "center-corners";
  const rois = input.rois ?? fieldRoiPreset(layout, widthPx, heightPx);
  const pixels = new Array(widthPx * heightPx).fill(0.5);
  const centerBlur = Math.max(0.05, finite(input.centerBlurSigmaPx ?? 0.75, 0.75));
  const fieldBlur = Math.max(centerBlur, finite(input.fieldBlurSigmaPx ?? 1.8, 1.8));
  const centerX = widthPx / 2;
  const centerY = heightPx / 2;
  const maxRadius = Math.hypot(centerX, centerY);
  for (const spec of rois) {
    const roiCenterX = spec.xPx + spec.widthPx / 2;
    const roiCenterY = spec.yPx + spec.heightPx / 2;
    const radial = maxRadius > 0 ? Math.hypot(roiCenterX - centerX, roiCenterY - centerY) / maxRadius : 0;
    const blurSigmaPx = centerBlur + (fieldBlur - centerBlur) * radial;
    const target = generateSlantedEdgeTarget({
      widthPx: spec.widthPx,
      heightPx: spec.heightPx,
      edgeAngleDeg: input.edgeAngleDeg ?? 5,
      contrast: input.contrast ?? 0.9,
      pixelPitchUm: input.pixelPitchUm ?? 3.45,
      blurSigmaPx
    });
    pastePixels(pixels, widthPx, target.pixels, spec);
  }
  const sourceHash = fnv1a64(stableStringify({ widthPx, heightPx, rois, pixels: sampleForHash(pixels) }));
  return {
    image: {
      widthPx,
      heightPx,
      pixels,
      pixelPitchUm: input.pixelPitchUm ?? 3.45
    },
    rois,
    sourceHash
  };
}

export function runFieldMtfMap(input: L71FieldMtfMapInput = {}): L71FieldMtfMapResult {
  const generated = input.image
    ? {
        image: normalizeImage(input.image),
        rois: input.rois ?? fieldRoiPreset(input.layout ?? "center-corners", input.image.widthPx, input.image.heightPx),
        sourceHash: hashImage(input.image.widthPx, input.image.heightPx, input.image.pixels)
      }
    : generateSyntheticFieldMtfTarget(input);
  const layout = input.layout ?? "center-corners";
  const warnings: SolverWarning[] = [];
  const rows = generated.rois.map((spec) => {
    const mtf = runSlantedEdgeMtf({
      id: `l71-field-${spec.id}`,
      label: `L7.1 field ROI ${spec.label}`,
      image: generated.image,
      roi: spec,
      edgeAngleDeg: input.edgeAngleDeg ?? 5,
      oversampling: input.oversampling ?? 4
    });
    return {
      roi: spec,
      edgeAngleDeg: mtf.metrics.edgeAngleDeg,
      edgeContrast: mtf.metrics.edgeContrast,
      mtf50CyclesPerPx: mtf.metrics.mtf50CyclesPerPx,
      mtf10CyclesPerPx: mtf.metrics.mtf10CyclesPerPx,
      mtfAtNyquist: mtf.metrics.mtfAtNyquist,
      mtf50LpPerMm: mtf.metrics.mtf50LpPerMm,
      warningCodes: mtf.warnings.map((warning) => warning.code),
      resultHash: mtf.hashes.resultHash
    };
  });
  const ranked = rows.filter((row) => row.mtf50CyclesPerPx !== null).sort((a, b) => (a.mtf50CyclesPerPx ?? 0) - (b.mtf50CyclesPerPx ?? 0));
  const worstRoi = ranked[0] ?? null;
  const bestRoi = ranked[ranked.length - 1] ?? null;
  const centerRows = rows.filter((row) => row.roi.role === "center" && row.mtf50CyclesPerPx !== null);
  const cornerRows = rows.filter((row) => row.roi.role === "corner" && row.mtf50CyclesPerPx !== null);
  const centerMtf50 = averageNullable(centerRows.map((row) => row.mtf50CyclesPerPx));
  const cornerMtf50 = averageNullable(cornerRows.map((row) => row.mtf50CyclesPerPx));
  const falloff = centerMtf50 !== null && cornerMtf50 !== null && centerMtf50 > 0 ? (centerMtf50 - cornerMtf50) / centerMtf50 : null;
  const uniformity =
    centerMtf50 !== null && worstRoi?.mtf50CyclesPerPx !== null && worstRoi?.mtf50CyclesPerPx !== undefined && centerMtf50 > 0
      ? worstRoi.mtf50CyclesPerPx / centerMtf50
      : null;
  if (rows.length === 0) {
    warnings.push({ code: "l71.field.noRois", message: "Field MTF map has no ROIs to analyze." });
  }
  const partial = {
    schema: "emmicro.l71.fieldMtfMap.v1" as const,
    appVersion: "L7.1 Focus + Field MTF Qualification Workbench" as const,
    id: input.id ?? "l71-field-mtf-map",
    label: input.label ?? "L7.1 field MTF map",
    layout,
    image: {
      widthPx: generated.image.widthPx,
      heightPx: generated.image.heightPx,
      pixelPitchUm: generated.image.pixelPitchUm ?? null,
      sourceHash: generated.sourceHash
    },
    rows,
    bestRoi,
    worstRoi,
    centerMtf50CyclesPerPx: centerMtf50,
    cornerAverageMtf50CyclesPerPx: cornerMtf50,
    centerToCornerFalloff: falloff,
    fieldUniformityScore: uniformity,
    warnings,
    limitations: [...l71FocusFieldLimitations]
  };
  return {
    ...partial,
    resultHash: fnv1a64(stableStringify(resultForHash(partial)))
  };
}

export function defaultL71QualificationSpec(): L71QualificationSpec {
  return {
    centerMtf50Min: 0.14,
    cornerMtf50Min: 0.08,
    nyquistMtfMin: 0.02,
    depthOfFocusMinMm: 0.1,
    disallowSaturatedRois: true,
    disallowLowContrastRois: true,
    disallowBadAngleRois: true
  };
}

export function qualifyFocusFieldMtf({
  id = "l71-qualification",
  label = "L7.1 focus + field MTF qualification",
  focusSweep,
  fieldMap,
  spec = defaultL71QualificationSpec()
}: {
  id?: string;
  label?: string;
  focusSweep: L71FocusSweepResult;
  fieldMap: L71FieldMtfMapResult;
  spec?: L71QualificationSpec;
}): L71QualificationResult {
  const issues: L71QualificationIssue[] = [];
  if ((fieldMap.centerMtf50CyclesPerPx ?? -Infinity) < spec.centerMtf50Min) {
    issues.push(fail("l71.qualification.centerMtf50", "Center MTF50 is below the required threshold.", "centerMtf50", fieldMap.centerMtf50CyclesPerPx, spec.centerMtf50Min));
  }
  if ((fieldMap.worstRoi?.mtf50CyclesPerPx ?? -Infinity) < spec.cornerMtf50Min) {
    issues.push(fail("l71.qualification.worstFieldMtf50", "Worst-field MTF50 is below the required threshold.", "worstFieldMtf50", fieldMap.worstRoi?.mtf50CyclesPerPx ?? null, spec.cornerMtf50Min, fieldMap.worstRoi?.roi.id));
  }
  if (fieldMap.rows.some((row) => row.mtfAtNyquist !== null && row.mtfAtNyquist < spec.nyquistMtfMin)) {
    const row = fieldMap.rows.find((item) => item.mtfAtNyquist !== null && item.mtfAtNyquist < spec.nyquistMtfMin);
    issues.push(fail("l71.qualification.nyquistMtf", "At least one ROI is below the Nyquist MTF threshold.", "mtfAtNyquist", row?.mtfAtNyquist ?? null, spec.nyquistMtfMin, row?.roi.id));
  }
  if (spec.nyquistMtfMin > 0) {
    for (const row of fieldMap.rows.filter((item) => item.mtfAtNyquist === null)) {
      issues.push({
        code: "l71.qualification.nyquistUnavailable",
        severity: "warning",
        message: "ROI MTF at Nyquist is unavailable from this diagnostic run.",
        roiId: row.roi.id,
        metric: "mtfAtNyquist",
        value: null,
        threshold: spec.nyquistMtfMin
      });
    }
  }
  if (focusSweep.depthOfFocus.rangeMm < spec.depthOfFocusMinMm) {
    issues.push(fail("l71.qualification.depthOfFocus", "Depth of focus is below the required range.", "depthOfFocus", focusSweep.depthOfFocus.rangeMm, spec.depthOfFocusMinMm));
  }
  for (const row of fieldMap.rows) {
    if (spec.disallowSaturatedRois && row.warningCodes.includes("l70.mtf.roi.saturated")) {
      issues.push(fail("l71.qualification.saturatedRoi", "ROI has saturated samples.", "warning", null, undefined, row.roi.id));
    }
    if (spec.disallowLowContrastRois && row.warningCodes.includes("l70.mtf.roi.lowContrast")) {
      issues.push(fail("l71.qualification.lowContrastRoi", "ROI has low contrast.", "warning", null, undefined, row.roi.id));
    }
    if (spec.disallowBadAngleRois && row.warningCodes.includes("l70.mtf.edge.angleOutsidePreferredRange")) {
      issues.push(fail("l71.qualification.badAngleRoi", "ROI edge angle is outside the preferred diagnostic range.", "warning", null, undefined, row.roi.id));
    }
  }
  const warningIssues = [...focusSweep.warnings, ...fieldMap.warnings].map((warning) => ({
    code: warning.code,
    severity: "warning" as const,
    message: warning.message
  }));
  issues.push(...warningIssues);
  const status: L71QualificationStatus = issues.some((issue) => issue.severity === "fail") ? "fail" : warningIssues.length > 0 ? "warning" : "pass";
  const recommendation = qualificationRecommendation(status, focusSweep, fieldMap);
  const partial = {
    schema: "emmicro.l71.qualification.v1" as const,
    appVersion: "L7.1 Focus + Field MTF Qualification Workbench" as const,
    id,
    label,
    status,
    spec,
    focusSweepHash: focusSweep.resultHash,
    fieldMapHash: fieldMap.resultHash,
    issues,
    worstRoi: fieldMap.worstRoi,
    recommendation,
    warnings: [...focusSweep.warnings, ...fieldMap.warnings],
    limitations: [...l71FocusFieldLimitations]
  };
  return {
    ...partial,
    resultHash: fnv1a64(stableStringify(resultForHash(partial)))
  };
}

export function compareFocusFieldMtf({
  id = "l71-focus-field-comparison",
  label = "L7.1 measured vs simulated focus/field MTF",
  measuredFocus,
  simulatedFocus,
  measuredField,
  simulatedField
}: {
  id?: string;
  label?: string;
  measuredFocus: L71FocusSweepResult;
  simulatedFocus: L71FocusSweepResult;
  measuredField?: L71FieldMtfMapResult;
  simulatedField?: L71FieldMtfMapResult;
}): L71FocusFieldComparisonResult {
  const warnings: SolverWarning[] = [];
  const focusRows = measuredFocus.rows.map((row) => {
    const simulated = nearestFocusRow(simulatedFocus.rows, row.focusZMm);
    const measured = row.selectedMetricValue;
    const simulatedValue = simulated?.selectedMetricValue ?? null;
    return {
      focusZMm: row.focusZMm,
      measured,
      simulated: simulatedValue,
      delta: measured !== null && simulatedValue !== null ? round(measured - simulatedValue) : null
    };
  });
  const focusMetricRmsDelta = rmsNullable(focusRows.map((row) => row.delta));
  const bestFocusDeltaMm =
    measuredFocus.bestFocus.focusZMm !== null && simulatedFocus.bestFocus.focusZMm !== null
      ? round(measuredFocus.bestFocus.focusZMm - simulatedFocus.bestFocus.focusZMm)
      : null;
  const fieldRows: L71FocusFieldComparisonResult["fieldRows"] = [];
  if (measuredField && simulatedField) {
    const simulatedById = new Map(simulatedField.rows.map((row) => [row.roi.id, row]));
    for (const measuredRow of measuredField.rows) {
      const simulatedRow = simulatedById.get(measuredRow.roi.id);
      if (!simulatedRow) continue;
      fieldRows.push({
        roiId: measuredRow.roi.id,
        label: measuredRow.roi.label,
        measuredMtf50: measuredRow.mtf50CyclesPerPx,
        simulatedMtf50: simulatedRow.mtf50CyclesPerPx,
        delta:
          measuredRow.mtf50CyclesPerPx !== null && simulatedRow.mtf50CyclesPerPx !== null
            ? round(measuredRow.mtf50CyclesPerPx - simulatedRow.mtf50CyclesPerPx)
            : null
      });
    }
    if (fieldRows.length === 0) {
      warnings.push({
        code: "l71.comparison.noMatchingFieldRois",
        message: "No matching field ROI ids were available for measured-vs-simulated field comparison."
      });
    }
  } else {
    warnings.push({
      code: "l71.comparison.fieldMapMissing",
      message: "Field-map residuals were skipped because one side of the comparison is missing."
    });
  }
  const partial = {
    schema: "emmicro.l71.focusFieldComparison.v1" as const,
    appVersion: "L7.1 Focus + Field MTF Qualification Workbench" as const,
    id,
    label,
    measuredHash: measuredFocus.resultHash,
    simulatedHash: simulatedFocus.resultHash,
    bestFocusDeltaMm,
    focusMetricRmsDelta,
    fieldMtf50RmsDelta: rmsNullable(fieldRows.map((row) => row.delta)),
    matchedFieldRoiCount: fieldRows.length,
    focusRows,
    fieldRows,
    diagnosticFit: {
      defocusOffsetMm: bestFocusDeltaMm,
      note: "Simple diagnostic best-focus offset only; this is not calibrated optical model fitting."
    },
    warnings,
    limitations: [...l71FocusFieldLimitations]
  };
  return {
    ...partial,
    resultHash: fnv1a64(stableStringify(resultForHash(partial)))
  };
}

export function focusSweepCsv(result: L71FocusSweepResult): string {
  return [
    "focus_z_mm,blur_sigma_px,mtf50_cycles_per_px,mtf10_cycles_per_px,mtf_at_nyquist,mtf_area,selected_metric,result_hash,warning_codes",
    ...result.rows.map((row) =>
      [
        row.focusZMm,
        row.blurSigmaPx,
        row.mtf50CyclesPerPx ?? "",
        row.mtf10CyclesPerPx ?? "",
        row.mtfAtNyquist ?? "",
        row.mtfArea,
        row.selectedMetricValue ?? "",
        row.resultHash,
        row.warningCodes.join(";")
      ]
        .map(csvEscape)
        .join(",")
    )
  ].join("\n");
}

export function fieldMtfMapCsv(result: L71FieldMtfMapResult): string {
  return [
    "roi_id,label,role,x_px,y_px,width_px,height_px,edge_angle_deg,edge_contrast,mtf50_cycles_per_px,mtf10_cycles_per_px,mtf_at_nyquist,mtf50_lp_per_mm,result_hash,warning_codes",
    ...result.rows.map((row) =>
      [
        row.roi.id,
        row.roi.label,
        row.roi.role,
        row.roi.xPx,
        row.roi.yPx,
        row.roi.widthPx,
        row.roi.heightPx,
        row.edgeAngleDeg,
        row.edgeContrast,
        row.mtf50CyclesPerPx ?? "",
        row.mtf10CyclesPerPx ?? "",
        row.mtfAtNyquist ?? "",
        row.mtf50LpPerMm ?? "",
        row.resultHash,
        row.warningCodes.join(";")
      ]
        .map(csvEscape)
        .join(",")
    )
  ].join("\n");
}

export function qualificationReportJson(result: L71QualificationResult): string {
  return JSON.stringify(result, null, 2);
}

export function qualificationReportMarkdown(result: L71QualificationResult, focusSweep?: L71FocusSweepResult, fieldMap?: L71FieldMtfMapResult, comparison?: L71FocusFieldComparisonResult): string {
  return [
    `# ${result.label}`,
    "",
    `Status: ${result.status.toUpperCase()}`,
    `Result hash: ${result.resultHash}`,
    `Recommendation: ${result.recommendation}`,
    "",
    "## Focus",
    focusSweep
      ? `Best focus: ${formatNullable(focusSweep.bestFocus.focusZMm)} mm; depth of focus: ${focusSweep.depthOfFocus.rangeMm.toPrecision(5)} mm at ${focusSweep.depthOfFocus.threshold.toPrecision(4)}`
      : "Focus sweep: not attached",
    "",
    "## Field",
    fieldMap
      ? `Worst ROI: ${fieldMap.worstRoi?.roi.label ?? "n/a"}; center MTF50: ${formatNullable(fieldMap.centerMtf50CyclesPerPx)}; corner average MTF50: ${formatNullable(fieldMap.cornerAverageMtf50CyclesPerPx)}`
      : "Field map: not attached",
    "",
    "## Comparison",
    comparison
      ? `Best focus delta: ${formatNullable(comparison.bestFocusDeltaMm)} mm; focus RMS delta: ${formatNullable(comparison.focusMetricRmsDelta)}`
      : "Comparison: not attached",
    "",
    "## Issues",
    ...(result.issues.length ? result.issues.map((issue) => `- ${issue.severity.toUpperCase()}: ${issue.message}`) : ["- none"]),
    "",
    "## Limitations",
    ...result.limitations.map((limitation) => `- ${limitation}`)
  ].join("\n");
}

export function focusFieldComparisonCsv(result: L71FocusFieldComparisonResult): string {
  return [
    "kind,id_or_focus,measured,simulated,delta",
    ...result.focusRows.map((row) => ["focus", row.focusZMm, row.measured ?? "", row.simulated ?? "", row.delta ?? ""].map(csvEscape).join(",")),
    ...result.fieldRows.map((row) => ["field", row.roiId, row.measuredMtf50 ?? "", row.simulatedMtf50 ?? "", row.delta ?? ""].map(csvEscape).join(","))
  ].join("\n");
}

function focusRow(index: number, focusZMm: number, blurSigmaPx: number, mtf: SlantedEdgeMtfResult, metric: L71FocusMetric): L71FocusSweepRow {
  return {
    index,
    focusZMm: round(focusZMm),
    blurSigmaPx: round(blurSigmaPx),
    mtf50CyclesPerPx: mtf.metrics.mtf50CyclesPerPx,
    mtf10CyclesPerPx: mtf.metrics.mtf10CyclesPerPx,
    mtfAtNyquist: mtf.metrics.mtfAtNyquist,
    mtfArea: mtfArea(mtf),
    selectedMetricValue: selectedMetric(mtf, metric),
    resultHash: mtf.hashes.resultHash,
    warningCodes: mtf.warnings.map((warning) => warning.code)
  };
}

function selectedMetric(mtf: SlantedEdgeMtfResult, metric: L71FocusMetric): number | null {
  if (metric === "mtf10") return mtf.metrics.mtf10CyclesPerPx;
  if (metric === "nyquist") return mtf.metrics.mtfAtNyquist;
  if (metric === "mtf-area") return mtfArea(mtf);
  return mtf.metrics.mtf50CyclesPerPx;
}

function mtfArea(mtf: SlantedEdgeMtfResult): number {
  if (mtf.mtf.length < 2) return 0;
  let area = 0;
  for (let index = 1; index < mtf.mtf.length; index += 1) {
    const a = mtf.mtf[index - 1]!;
    const b = mtf.mtf[index]!;
    area += ((a.mtf + b.mtf) * 0.5) * Math.max(0, b.frequencyCyclesPerPx - a.frequencyCyclesPerPx);
  }
  return round(area);
}

function bestFocusRow(rows: L71FocusSweepRow[]): L71FocusSweepRow | null {
  const ranked = rows
    .filter((row) => row.selectedMetricValue !== null && Number.isFinite(row.selectedMetricValue))
    .sort((a, b) => (b.selectedMetricValue ?? -Infinity) - (a.selectedMetricValue ?? -Infinity));
  return ranked[0] ?? null;
}

function computeDepthOfFocus(rows: L71FocusSweepRow[], threshold: number): L71DepthOfFocus {
  let bestStart: number | null = null;
  let bestStop: number | null = null;
  let currentStart: number | null = null;
  let currentStop: number | null = null;
  const sorted = [...rows].sort((a, b) => a.focusZMm - b.focusZMm);
  for (const row of sorted) {
    if ((row.selectedMetricValue ?? -Infinity) >= threshold) {
      if (currentStart === null) currentStart = row.focusZMm;
      currentStop = row.focusZMm;
      continue;
    }
    if (currentStart !== null && currentStop !== null && (bestStart === null || currentStop - currentStart > (bestStop ?? 0) - bestStart)) {
      bestStart = currentStart;
      bestStop = currentStop;
    }
    currentStart = null;
    currentStop = null;
  }
  if (currentStart !== null && currentStop !== null && (bestStart === null || currentStop - currentStart > (bestStop ?? 0) - bestStart)) {
    bestStart = currentStart;
    bestStop = currentStop;
  }
  const rowCount = sorted.filter((row) => (row.selectedMetricValue ?? -Infinity) >= threshold).length;
  return {
    threshold,
    startMm: bestStart,
    stopMm: bestStop,
    rangeMm: bestStart !== null && bestStop !== null ? round(bestStop - bestStart) : 0,
    rowCount
  };
}

function normalizeFocusPositions(values?: number[]): number[] {
  const source = values && values.length > 0 ? values : [-0.2, -0.15, -0.1, -0.05, 0, 0.05, 0.1, 0.15, 0.2];
  return Array.from(new Set(source.filter(Number.isFinite).map(round))).sort((a, b) => a - b);
}

function normalizeImage(image: L70ResolutionTargetImage | L70ImageLike): L70ImageLike {
  return {
    widthPx: image.widthPx,
    heightPx: image.heightPx,
    pixelPitchUm: image.pixelPitchUm ?? null,
    pixels: Array.from(image.pixels)
  };
}

function nearestFocusRow(rows: L71FocusSweepRow[], focusZMm: number): L71FocusSweepRow | null {
  if (rows.length === 0) return null;
  return [...rows].sort((a, b) => Math.abs(a.focusZMm - focusZMm) - Math.abs(b.focusZMm - focusZMm))[0] ?? null;
}

function rmsNullable(values: Array<number | null>): number | null {
  const finiteValues = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (finiteValues.length === 0) return null;
  return round(Math.sqrt(finiteValues.reduce((sum, value) => sum + value * value, 0) / finiteValues.length));
}

function pastePixels(target: number[], targetWidthPx: number, source: number[], spec: L71FieldRoiSpec): void {
  for (let y = 0; y < spec.heightPx; y += 1) {
    for (let x = 0; x < spec.widthPx; x += 1) {
      target[(spec.yPx + y) * targetWidthPx + spec.xPx + x] = source[y * spec.widthPx + x] ?? 0.5;
    }
  }
}

function roi(id: string, label: string, role: L71FieldRoiRole, xPx: number, yPx: number, widthPx: number, heightPx: number): L71FieldRoiSpec {
  return { id, label, role, xPx, yPx, widthPx, heightPx };
}

function fail(code: string, message: string, metric: string, value: number | null, threshold?: number, roiId?: string): L71QualificationIssue {
  return { code, severity: "fail", message, metric, value, threshold, roiId };
}

function qualificationRecommendation(status: L71QualificationStatus, focusSweep: L71FocusSweepResult, fieldMap: L71FieldMtfMapResult): string {
  const focus = focusSweep.bestFocus.focusZMm === null ? "unknown focus" : `${focusSweep.bestFocus.focusZMm.toPrecision(4)} mm`;
  if (status === "pass") return `PASS. Best focus is near ${focus}; field MTF meets the configured diagnostic thresholds.`;
  if (fieldMap.worstRoi) return `Best focus is near ${focus}. Worst field is ${fieldMap.worstRoi.roi.label}; improve field sharpness or relax the diagnostic threshold.`;
  return `Best focus is near ${focus}. Review failed focus/field metrics before using this setup.`;
}

function averageNullable(values: Array<number | null>): number | null {
  const finiteValues = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (finiteValues.length === 0) return null;
  return round(finiteValues.reduce((sum, value) => sum + value, 0) / finiteValues.length);
}

function hashImage(widthPx: number, heightPx: number, pixels: ArrayLike<number>): string {
  return fnv1a64(stableStringify({ widthPx, heightPx, sample: sampleForHash(Array.from(pixels)) }));
}

function sampleForHash(values: number[]): number[] {
  const stride = Math.max(1, Math.floor(values.length / 128));
  const sample: number[] = [];
  for (let index = 0; index < values.length; index += stride) sample.push(round(values[index] ?? 0));
  return sample;
}

function resultForHash(value: unknown): unknown {
  return JSON.parse(stableStringify(value), (_key, item) => (typeof item === "number" && Number.isFinite(item) ? round(item) : item));
}

function csvEscape(value: unknown): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}

function formatNullable(value: number | null): string {
  return value === null || !Number.isFinite(value) ? "n/a" : value.toPrecision(6);
}

function integerInRange(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(finite(value, min))));
}

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Number(value.toPrecision(12));
}
