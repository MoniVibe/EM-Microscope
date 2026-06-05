import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import type { SlantedEdgeMtfResult } from "../imageQuality/slantedEdgeMtf";
import type { L71FieldMtfMapResult, L71FocusSweepResult, L71QualificationResult } from "../imageQuality/focusFieldMtfQualification";
import type { L72GeometricFitResult } from "../measurement/geometricCalibration";
import type { L75FiducialFitResult } from "../measurement/fiducialBoard";
import type { L73DetectionResult } from "../measurement/targetDetection";
import type { L68CameraRunResult } from "./cameraSensorLite";
import type { L69CameraCalibrationResult } from "./cameraCalibration";

export type L74FrameType =
  | "dot_grid"
  | "point_csv"
  | "geometric_fit"
  | "target_detection"
  | "fiducial_board"
  | "slanted_edge"
  | "focus_sweep_mtf"
  | "field_mtf_map"
  | "camera_calibration"
  | "camera_frame";

export type L74QaStatus = "pass" | "warning" | "fail";
export type L74MetricFamily = "geometry" | "mtf" | "camera" | "detection" | "session";

export type L74SessionManifestRow = {
  frameId: string;
  type: L74FrameType;
  pathOrName?: string;
  sourceLabel: string;
  focusZUm?: number;
  exposureMs?: number;
  gain?: number;
  temperatureC?: number;
  notes?: string;
  inputHash: string;
  sourceIndex: number;
};

export type L74FrameMetric = {
  id: string;
  label: string;
  family: L74MetricFamily;
  value: number;
  unit?: string;
};

export type L74SessionFrame = L74SessionManifestRow & {
  status: L74QaStatus;
  resultHash: string;
  analysisSettings: Record<string, unknown>;
  metrics: L74FrameMetric[];
  warnings: SolverWarning[];
  limitations: string[];
};

export type L74SessionThresholds = {
  maxGeometricRmsResidualPx: number;
  maxPixelScaleRepeatabilityStdUmPerPx: number;
  minMtf50CyclesPerPx: number;
  maxMtf50CoefficientOfVariation: number;
  maxCameraBlackLevelDriftDn: number;
  maxAllowedWarningCount: number;
  minDetectionCoverage: number;
  maxZScore: number;
};

export type L74MetricAggregate = {
  metricId: string;
  label: string;
  family: L74MetricFamily;
  unit?: string;
  count: number;
  mean: number;
  std: number;
  min: number;
  max: number;
  coefficientOfVariation: number | null;
  repeatabilityStd: number;
  bestFrameId: string;
  worstFrameId: string;
  driftSlopePerFrame: number | null;
  driftSlopePerFocusUm: number | null;
  driftSlopePerExposureMs: number | null;
  driftSlopePerTemperatureC: number | null;
};

export type L74SessionOutlier = {
  frameId: string;
  metricId: string;
  severity: Exclude<L74QaStatus, "pass">;
  rule: "threshold" | "z-score" | "warning-count" | "detection-coverage" | "session-repeatability" | "camera-drift";
  message: string;
  value: number;
  threshold?: number;
};

export type L74SessionQaResult = {
  schema: "emmicro.l74.batchSessionQa.v1";
  appVersion: "L7.4 Batch Measurement Session + Repeatability QA";
  id: string;
  label: string;
  manifestHash: string;
  frameCount: number;
  acceptedFrameCount: number;
  rejectedFrameCount: number;
  status: L74QaStatus;
  thresholds: L74SessionThresholds;
  frames: L74SessionFrame[];
  aggregates: L74MetricAggregate[];
  outliers: L74SessionOutlier[];
  warnings: SolverWarning[];
  limitations: string[];
  resultHash: string;
};

export const l74Limitations = [
  "L7.4 batch measurement sessions are diagnostic repeatability and QA summaries only; they are not certified camera calibration, ISO/Imatest/EMVA certification, or lab-accredited metrology.",
  "Session aggregation reuses existing L6.8-L7.3 diagnostic metrics and deterministic thresholds; it does not add full 3D pose/stereo calibration, hardware control, or manufacturing calibration.",
  "The workbench does not execute new optical propagation physics, full 3D Maxwell, FDTD, FEM, BEM, RCWA, arbitrary CAD Maxwell solves, pixel-level sensor-stack EM, digital twins, or manufacturing certification workflows."
] as const;

export function defaultL74Thresholds(input: Partial<L74SessionThresholds> = {}): L74SessionThresholds {
  return {
    maxGeometricRmsResidualPx: finite(input.maxGeometricRmsResidualPx, 1),
    maxPixelScaleRepeatabilityStdUmPerPx: finite(input.maxPixelScaleRepeatabilityStdUmPerPx, 0.05),
    minMtf50CyclesPerPx: finite(input.minMtf50CyclesPerPx, 0.1),
    maxMtf50CoefficientOfVariation: finite(input.maxMtf50CoefficientOfVariation, 0.15),
    maxCameraBlackLevelDriftDn: finite(input.maxCameraBlackLevelDriftDn, 4),
    maxAllowedWarningCount: Math.max(0, Math.round(finite(input.maxAllowedWarningCount, 2))),
    minDetectionCoverage: clamp(finite(input.minDetectionCoverage, 0.95), 0, 1),
    maxZScore: Math.max(0.1, finite(input.maxZScore, 2.5))
  };
}

export function exampleL74SessionManifestCsv(): string {
  return [
    "frame_id,type,path_or_name,focus_z_um,exposure_ms,gain,temperature_c,notes",
    "001,dot_grid,dot_001.png,0,10,1.0,22.1,center",
    "002,dot_grid,dot_002.png,0,10,1.0,22.1,center repeat",
    "003,slanted_edge,edge_001.png,-50,10,1.0,22.2,focus sweep",
    "004,slanted_edge,edge_002.png,0,10,1.0,22.2,focus sweep",
    "005,slanted_edge,edge_003.png,50,10,1.0,22.2,focus sweep",
    "006,camera_calibration,cal_001.csv,,5,1.0,22.0,dark flat exposure",
    "007,camera_frame,camera_001.json,,10,1.0,23.0,sensor repeatability"
  ].join("\n");
}

export function parseL74SessionManifestCsv(text: string): { rows: L74SessionManifestRow[]; manifestHash: string; warnings: SolverWarning[] } {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
  if (lines.length === 0) throw new Error("L7.4 session manifest is empty");
  const header = splitCsvLine(lines[0] ?? "").map(normalizeHeader);
  const frameIdIndex = findColumn(header, ["frame_id", "frameid", "id"]);
  const typeIndex = findColumn(header, ["type", "frame_type", "kind"]);
  const sourceIndex = findColumn(header, ["path_or_name", "source_label", "source", "name", "path"]);
  if (frameIdIndex < 0 || typeIndex < 0) throw new Error("L7.4 session manifest requires frame_id and type columns");
  if (sourceIndex < 0) throw new Error("L7.4 session manifest requires path_or_name or source_label column");

  const focusIndex = findColumn(header, ["focus_z_um", "focus_um", "focus_z"]);
  const exposureIndex = findColumn(header, ["exposure_ms", "exposure"]);
  const gainIndex = findColumn(header, ["gain"]);
  const temperatureIndex = findColumn(header, ["temperature_c", "temp_c", "temperature"]);
  const notesIndex = findColumn(header, ["notes", "note", "comment"]);
  const rows: L74SessionManifestRow[] = [];
  const warnings: SolverWarning[] = [];
  for (let index = 1; index < lines.length; index += 1) {
    const cells = splitCsvLine(lines[index] ?? "");
    const frameId = (cells[frameIdIndex] ?? "").trim();
    const type = normalizeFrameType(cells[typeIndex] ?? "");
    const sourceLabel = (cells[sourceIndex] ?? "").trim();
    if (!frameId || !type) throw new Error(`L7.4 session manifest row ${index + 1} is missing frame_id or has unsupported type`);
    if (!sourceLabel) throw new Error(`L7.4 session manifest row ${index + 1} is missing path_or_name/source_label`);
    const row: Omit<L74SessionManifestRow, "inputHash"> = {
      frameId,
      type,
      pathOrName: sourceLabel,
      sourceLabel,
      focusZUm: optionalNumber(cells[focusIndex]),
      exposureMs: optionalNumber(cells[exposureIndex]),
      gain: optionalNumber(cells[gainIndex]),
      temperatureC: optionalNumber(cells[temperatureIndex]),
      notes: notesIndex >= 0 ? emptyToUndefined(cells[notesIndex]) : undefined,
      sourceIndex: index - 1
    };
    rows.push({ ...row, inputHash: fnv1a64(stableStringify(row)) });
  }
  if (rows.length === 0) throw new Error("L7.4 session manifest has no data rows");
  const ids = new Set<string>();
  for (const row of rows) {
    if (ids.has(row.frameId)) warnings.push({ code: "l74.manifest.duplicateFrameId", message: `Duplicate frame id '${row.frameId}' appears in the session manifest.` });
    ids.add(row.frameId);
  }
  return { rows, manifestHash: fnv1a64(stableStringify(rows.map((row) => ({ ...row })))), warnings };
}

export function l74SyntheticFramesFromManifest(rows: L74SessionManifestRow[]): L74SessionFrame[] {
  return rows.map((row, index) => {
    const metrics = syntheticMetricsForRow(row, index);
    const warnings = syntheticWarningsForRow(row, index);
    return createL74SessionFrame({ ...row, metrics, warnings, resultHash: fnv1a64(stableStringify({ row, metrics, warnings })) });
  });
}

export function l74FrameFromGeometricFit(row: L74SessionManifestRow, fit: L72GeometricFitResult): L74SessionFrame {
  return createL74SessionFrame({
    ...row,
    type: row.type === "dot_grid" ? row.type : "geometric_fit",
    resultHash: fit.resultHash,
    metrics: compactMetrics([
      metric("mean_pixel_scale_um_per_px", "Mean pixel scale", "geometry", fit.metrics.meanPixelScaleUmPerPx, "um/px"),
      metric("rotation_deg", "Rotation", "geometry", fit.metrics.rotationDeg, "deg"),
      metric("radial_k1", "Radial k1", "geometry", fit.radial.k1),
      metric("radial_k2", "Radial k2", "geometry", fit.radial.k2),
      metric("rms_residual_px", "RMS reprojection residual", "geometry", fit.metrics.rmsResidualPx, "px"),
      metric("max_residual_px", "Max reprojection residual", "geometry", fit.metrics.maxResidualPx, "px"),
      metric("center_residual_px", "Center residual", "geometry", fit.metrics.centerResidualAveragePx, "px"),
      metric("corner_residual_px", "Corner residual", "geometry", fit.metrics.cornerResidualAveragePx, "px")
    ]),
    warnings: [...fit.warnings, ...fit.issues.map((issue) => ({ code: issue.code, message: issue.message }))],
    limitations: fit.limitations,
    analysisSettings: { model: fit.model, pointCount: fit.pointCount }
  });
}

export function l74FrameFromDetection(row: L74SessionManifestRow, detection: L73DetectionResult): L74SessionFrame {
  return createL74SessionFrame({
    ...row,
    type: "target_detection",
    resultHash: detection.resultHash,
    metrics: compactMetrics([
      metric("detection_coverage", "Detection coverage", "detection", detection.coverageScore),
      metric("accepted_point_count", "Accepted points", "detection", detection.acceptedPointCount),
      metric("rejected_point_count", "Rejected points", "detection", detection.rejectedPointCount),
      metric("grid_match_rms_px", "Grid match RMS", "detection", detection.gridMatchRmsPx, "px"),
      metric("rms_residual_px", "Fit RMS residual", "geometry", detection.fitRmsPx, "px"),
      metric("max_residual_px", "Fit max residual", "geometry", detection.fitMaxPx, "px")
    ]),
    warnings: detection.warnings,
    limitations: detection.limitations,
    analysisSettings: { detector: detection.settings.detector, roi: detection.roi, manualEditCount: detection.manualEdits.length }
  });
}

export function l74FrameFromFiducialFit(row: L74SessionManifestRow, result: L75FiducialFitResult): L74SessionFrame {
  return createL74SessionFrame({
    ...row,
    type: "fiducial_board",
    resultHash: result.resultHash,
    metrics: compactMetrics([
      metric("fiducial_marker_coverage", "Fiducial marker coverage", "detection", result.match.markerCoverageScore),
      metric("fiducial_charuco_coverage", "Fiducial ChArUco-style corner coverage", "detection", result.match.charucoCoverageScore),
      metric("fiducial_board_area_coverage", "Fiducial board area coverage", "detection", result.match.boardAreaCoverageScore),
      metric("detection_coverage", "Detection coverage", "detection", result.match.coverageScore),
      metric("accepted_point_count", "Accepted matched points", "detection", result.match.matchedPointCount),
      metric("accepted_marker_count", "Accepted marker IDs", "detection", result.match.acceptedMarkerCount),
      metric("missing_marker_count", "Missing marker IDs", "detection", result.match.missingMarkerIds.length),
      metric("rms_residual_px", "Fiducial fit RMS residual", "geometry", result.fit?.metrics.rmsResidualPx, "px"),
      metric("max_residual_px", "Fiducial fit max residual", "geometry", result.fit?.metrics.maxResidualPx, "px")
    ]),
    status: result.status,
    warnings: result.warnings,
    limitations: result.limitations,
    analysisSettings: {
      model: result.model,
      markerCount: result.match.markerCount,
      acceptedMarkerCount: result.match.acceptedMarkerCount,
      acceptedCharucoCornerCount: result.match.acceptedCharucoCornerCount,
      coveredQuadrants: result.match.coveredQuadrants
    }
  });
}

export function l74FrameFromMtf(row: L74SessionManifestRow, mtf: SlantedEdgeMtfResult): L74SessionFrame {
  return createL74SessionFrame({
    ...row,
    type: "slanted_edge",
    resultHash: mtf.hashes.resultHash,
    metrics: compactMetrics([
      metric("mtf50_cycles_per_px", "MTF50", "mtf", mtf.metrics.mtf50CyclesPerPx, "cycles/px"),
      metric("mtf10_cycles_per_px", "MTF10", "mtf", mtf.metrics.mtf10CyclesPerPx, "cycles/px"),
      metric("mtf_at_nyquist", "MTF at Nyquist", "mtf", mtf.metrics.mtfAtNyquist),
      metric("edge_contrast", "Edge contrast", "mtf", mtf.metrics.edgeContrast)
    ]),
    warnings: mtf.warnings,
    limitations: mtf.limitations,
    analysisSettings: { edgeAngleDeg: mtf.metrics.edgeAngleDeg, roi: mtf.roi, oversampling: mtf.settings.oversampling }
  });
}

export function l74FrameFromFocusSweep(row: L74SessionManifestRow, focus: L71FocusSweepResult): L74SessionFrame {
  return createL74SessionFrame({
    ...row,
    type: "focus_sweep_mtf",
    resultHash: focus.resultHash,
    metrics: compactMetrics([
      metric("best_focus_um", "Best focus", "mtf", focus.bestFocus.focusZMm === null ? null : focus.bestFocus.focusZMm * 1000, "um"),
      metric("best_focus_metric", "Best focus metric", "mtf", focus.bestFocus.metricValue),
      metric("depth_of_focus_um", "Depth of focus", "mtf", focus.depthOfFocus.rangeMm * 1000, "um")
    ]),
    warnings: focus.warnings,
    limitations: focus.limitations,
    analysisSettings: { metric: focus.metric, threshold: focus.threshold, rowCount: focus.rows.length }
  });
}

export function l74FrameFromFieldMap(row: L74SessionManifestRow, fieldMap: L71FieldMtfMapResult): L74SessionFrame {
  return createL74SessionFrame({
    ...row,
    type: "field_mtf_map",
    resultHash: fieldMap.resultHash,
    metrics: compactMetrics([
      metric("mtf50_cycles_per_px", "Worst-field MTF50", "mtf", fieldMap.worstRoi?.mtf50CyclesPerPx ?? null, "cycles/px"),
      metric("center_mtf50_cycles_per_px", "Center MTF50", "mtf", fieldMap.centerMtf50CyclesPerPx, "cycles/px"),
      metric("corner_average_mtf50_cycles_per_px", "Corner average MTF50", "mtf", fieldMap.cornerAverageMtf50CyclesPerPx, "cycles/px"),
      metric("field_uniformity_score", "Field uniformity", "mtf", fieldMap.fieldUniformityScore)
    ]),
    warnings: fieldMap.warnings,
    limitations: fieldMap.limitations,
    analysisSettings: { layout: fieldMap.layout, roiCount: fieldMap.rows.length }
  });
}

export function l74FrameFromQualification(row: L74SessionManifestRow, qualification: L71QualificationResult): L74SessionFrame {
  return createL74SessionFrame({
    ...row,
    type: "focus_sweep_mtf",
    resultHash: qualification.resultHash,
    metrics: compactMetrics([
      metric("qualification_issue_count", "Qualification issue count", "mtf", qualification.issues.length),
      metric("mtf50_cycles_per_px", "Worst ROI MTF50", "mtf", qualification.worstRoi?.mtf50CyclesPerPx ?? null, "cycles/px")
    ]),
    status: qualification.status,
    warnings: [...qualification.warnings, ...qualification.issues.map((issue) => ({ code: issue.code, message: issue.message }))],
    limitations: qualification.limitations,
    analysisSettings: { spec: qualification.spec, recommendation: qualification.recommendation }
  });
}

export function l74FrameFromCameraCalibration(row: L74SessionManifestRow, run: L69CameraCalibrationResult): L74SessionFrame {
  return createL74SessionFrame({
    ...row,
    type: "camera_calibration",
    resultHash: run.resultHash,
    metrics: compactMetrics([
      metric("black_level_dn", "Black level", "camera", run.fittedProfile.blackLevelDn, "DN"),
      metric("read_noise_e_rms", "Read noise", "camera", run.fittedProfile.readNoiseElectronsRms, "e- RMS"),
      metric("gain_dn_per_e", "Gain", "camera", run.fittedProfile.gainDnPerElectron, "DN/e-"),
      metric("dark_current_e_per_s", "Dark current", "camera", run.fittedProfile.darkCurrentElectronsPerS, "e-/px/s"),
      metric("snr_mean", "Mean SNR", "camera", mean(run.photonTransfer.map((point) => point.measuredSnr)))
    ]),
    warnings: run.warnings,
    limitations: run.limitations,
    analysisSettings: { datasetHash: run.dataset.dataHash, rowCount: run.dataset.rowCount }
  });
}

export function l74FrameFromCameraRun(row: L74SessionManifestRow, run: L68CameraRunResult): L74SessionFrame {
  const metricMap = new Map(run.metrics.map((item) => [item.id, item]));
  return createL74SessionFrame({
    ...row,
    type: "camera_frame",
    resultHash: run.resultHash,
    metrics: compactMetrics([
      metric("black_level_dn", "Black level", "camera", run.settings.blackLevelDn, "DN"),
      metric("read_noise_e_rms", "Read noise", "camera", run.settings.readNoiseElectronsRms, "e- RMS"),
      metric("gain_dn_per_e", "Gain", "camera", run.settings.gainDnPerElectron, "DN/e-"),
      metric("snr_mean", "Mean SNR", "camera", metricMap.get("meanSnr")?.value ?? metricMap.get("snrMean")?.value),
      metric("saturation_fraction", "Saturation fraction", "camera", metricMap.get("saturationFraction")?.value)
    ]),
    warnings: run.warnings,
    limitations: run.limitations,
    analysisSettings: { noiseMode: run.settings.noiseMode, sourceHash: run.source.resultHash }
  });
}

export function createL74SessionFrame(input: L74SessionManifestRow & {
  resultHash?: string;
  status?: L74QaStatus;
  metrics?: L74FrameMetric[];
  warnings?: SolverWarning[];
  limitations?: string[];
  analysisSettings?: Record<string, unknown>;
}): L74SessionFrame {
  const metrics = input.metrics ?? [];
  const warnings = input.warnings ?? [];
  const status = input.status ?? (warnings.length > 0 ? "warning" : "pass");
  const frame: Omit<L74SessionFrame, "resultHash"> = {
    frameId: input.frameId,
    type: input.type,
    pathOrName: input.pathOrName,
    sourceLabel: input.sourceLabel,
    focusZUm: input.focusZUm,
    exposureMs: input.exposureMs,
    gain: input.gain,
    temperatureC: input.temperatureC,
    notes: input.notes,
    inputHash: input.inputHash,
    sourceIndex: input.sourceIndex,
    status,
    analysisSettings: input.analysisSettings ?? {},
    metrics,
    warnings,
    limitations: input.limitations ?? [...l74Limitations]
  };
  return { ...frame, resultHash: input.resultHash ?? fnv1a64(stableStringify(frame)) };
}

export function runL74SessionQa(input: {
  id?: string;
  label?: string;
  manifestHash?: string;
  frames: L74SessionFrame[];
  thresholds?: Partial<L74SessionThresholds>;
  warnings?: SolverWarning[];
}): L74SessionQaResult {
  if (input.frames.length === 0) throw new Error("L7.4 session QA requires at least one frame");
  const thresholds = defaultL74Thresholds(input.thresholds);
  const aggregates = aggregateMetrics(input.frames);
  const outliers = detectOutliers(input.frames, aggregates, thresholds);
  const frameSeverities = new Map<string, L74QaStatus>();
  for (const frame of input.frames) frameSeverities.set(frame.frameId, frame.status);
  for (const outlier of outliers) {
    const current = frameSeverities.get(outlier.frameId) ?? "pass";
    frameSeverities.set(outlier.frameId, worseStatus(current, outlier.severity));
  }
  const frames = input.frames.map((frame) => ({ ...frame, status: frameSeverities.get(frame.frameId) ?? frame.status }));
  const rejectedFrameCount = frames.filter((frame) => frame.status === "fail").length;
  const warningCount = frames.filter((frame) => frame.status === "warning").length;
  const status: L74QaStatus = rejectedFrameCount > 0 ? "fail" : warningCount > 0 || outliers.length > 0 ? "warning" : "pass";
  const warnings = [...(input.warnings ?? []), ...sessionWarnings(aggregates, thresholds)];
  const partial = {
    schema: "emmicro.l74.batchSessionQa.v1" as const,
    appVersion: "L7.4 Batch Measurement Session + Repeatability QA" as const,
    id: input.id ?? "l74-session-qa",
    label: input.label ?? "L7.4 Batch Measurement Session + Repeatability QA",
    manifestHash: input.manifestHash ?? fnv1a64(stableStringify(frames.map((frame) => frame.inputHash))),
    frameCount: frames.length,
    acceptedFrameCount: frames.length - rejectedFrameCount,
    rejectedFrameCount,
    status,
    thresholds,
    frames,
    aggregates,
    outliers,
    warnings,
    limitations: [...l74Limitations]
  };
  return { ...partial, resultHash: fnv1a64(stableStringify(resultForHash(partial))) };
}

export function sessionReportJson(result: L74SessionQaResult): string {
  return JSON.stringify({ result }, null, 2);
}

export function sessionReportMarkdown(result: L74SessionQaResult): string {
  return [
    `# ${result.label}`,
    "",
    `App version: ${result.appVersion}`,
    `Session status: ${result.status.toUpperCase()}`,
    `Result hash: ${result.resultHash}`,
    `Manifest hash: ${result.manifestHash}`,
    `Frames: ${result.frameCount}`,
    `Accepted / rejected frames: ${result.acceptedFrameCount} / ${result.rejectedFrameCount}`,
    "",
    "## Thresholds",
    ...Object.entries(result.thresholds).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Aggregate Metrics",
    "| Metric | Family | Count | Mean | Std | Min | Max | CV | Worst frame |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
    ...result.aggregates.map((aggregate) => `| ${aggregate.label} | ${aggregate.family} | ${aggregate.count} | ${fmt(aggregate.mean)} | ${fmt(aggregate.std)} | ${fmt(aggregate.min)} | ${fmt(aggregate.max)} | ${fmt(aggregate.coefficientOfVariation)} | ${aggregate.worstFrameId} |`),
    "",
    "## Outliers",
    ...(result.outliers.length ? result.outliers.map((outlier) => `- ${outlier.severity.toUpperCase()} ${outlier.frameId}: ${outlier.message}`) : ["- none"]),
    "",
    "## Frame Review",
    "| Frame | Type | Status | Source | Warning count | Result hash |",
    "| --- | --- | --- | --- | ---: | --- |",
    ...result.frames.map((frame) => `| ${frame.frameId} | ${frame.type} | ${frame.status} | ${frame.sourceLabel} | ${frame.warnings.length} | ${frame.resultHash} |`),
    "",
    "## Warnings",
    ...(result.warnings.length ? result.warnings.map((warning) => `- ${warning.message}`) : ["- none"]),
    "",
    "## Limitations",
    ...result.limitations.map((limitation) => `- ${limitation}`)
  ].join("\n");
}

export function frameMetricsCsv(result: L74SessionQaResult): string {
  return [
    "frame_id,type,status,source_label,metric_id,metric_label,family,value,unit,result_hash,warning_count",
    ...result.frames.flatMap((frame) =>
      frame.metrics.map((metricRow) =>
        [
          frame.frameId,
          frame.type,
          frame.status,
          frame.sourceLabel,
          metricRow.id,
          metricRow.label,
          metricRow.family,
          metricRow.value,
          metricRow.unit ?? "",
          frame.resultHash,
          frame.warnings.length
        ].map(csvEscape).join(",")
      )
    )
  ].join("\n");
}

export function sessionMetricsCsv(result: L74SessionQaResult): string {
  return [
    "metric_id,label,family,count,mean,std,min,max,coefficient_of_variation,repeatability_std,best_frame_id,worst_frame_id,drift_slope_per_frame,drift_slope_per_focus_um,drift_slope_per_exposure_ms,drift_slope_per_temperature_c",
    ...result.aggregates.map((aggregate) =>
      [
        aggregate.metricId,
        aggregate.label,
        aggregate.family,
        aggregate.count,
        aggregate.mean,
        aggregate.std,
        aggregate.min,
        aggregate.max,
        aggregate.coefficientOfVariation ?? "",
        aggregate.repeatabilityStd,
        aggregate.bestFrameId,
        aggregate.worstFrameId,
        aggregate.driftSlopePerFrame ?? "",
        aggregate.driftSlopePerFocusUm ?? "",
        aggregate.driftSlopePerExposureMs ?? "",
        aggregate.driftSlopePerTemperatureC ?? ""
      ].map(csvEscape).join(",")
    )
  ].join("\n");
}

export function outliersCsv(result: L74SessionQaResult): string {
  return [
    "frame_id,metric_id,severity,rule,value,threshold,message",
    ...result.outliers.map((outlier) =>
      [outlier.frameId, outlier.metricId, outlier.severity, outlier.rule, outlier.value, outlier.threshold ?? "", outlier.message].map(csvEscape).join(",")
    )
  ].join("\n");
}

export function sessionWarningsJson(result: L74SessionQaResult): string {
  return JSON.stringify({ warnings: result.warnings, frameWarnings: result.frames.map((frame) => ({ frameId: frame.frameId, warnings: frame.warnings })) }, null, 2);
}

function aggregateMetrics(frames: L74SessionFrame[]): L74MetricAggregate[] {
  const buckets = new Map<string, Array<{ frame: L74SessionFrame; metric: L74FrameMetric }>>();
  for (const frame of frames) {
    for (const metricRow of frame.metrics) {
      const key = metricRow.id;
      const bucket = buckets.get(key) ?? [];
      bucket.push({ frame, metric: metricRow });
      buckets.set(key, bucket);
    }
  }
  return [...buckets.entries()]
    .map(([metricId, rows]) => {
      const values = rows.map((row) => row.metric.value).filter(Number.isFinite);
      const firstMetric = rows[0]!.metric;
      const average = mean(values);
      const std = standardDeviation(values);
      const best = rows.reduce((candidate, row) => row.metric.value > candidate.metric.value ? row : candidate, rows[0]!);
      const worst = rows.reduce((candidate, row) => row.metric.value < candidate.metric.value ? row : candidate, rows[0]!);
      return {
        metricId,
        label: firstMetric.label,
        family: firstMetric.family,
        unit: firstMetric.unit,
        count: values.length,
        mean: round(average),
        std: round(std),
        min: round(Math.min(...values)),
        max: round(Math.max(...values)),
        coefficientOfVariation: average === 0 ? null : round(Math.abs(std / average)),
        repeatabilityStd: round(std),
        bestFrameId: best.frame.frameId,
        worstFrameId: worst.frame.frameId,
        driftSlopePerFrame: slope(rows.map((row) => [row.frame.sourceIndex, row.metric.value])),
        driftSlopePerFocusUm: slope(rows.filter((row) => row.frame.focusZUm !== undefined).map((row) => [row.frame.focusZUm!, row.metric.value])),
        driftSlopePerExposureMs: slope(rows.filter((row) => row.frame.exposureMs !== undefined).map((row) => [row.frame.exposureMs!, row.metric.value])),
        driftSlopePerTemperatureC: slope(rows.filter((row) => row.frame.temperatureC !== undefined).map((row) => [row.frame.temperatureC!, row.metric.value]))
      };
    })
    .sort((a, b) => a.family.localeCompare(b.family) || a.metricId.localeCompare(b.metricId));
}

function detectOutliers(frames: L74SessionFrame[], aggregates: L74MetricAggregate[], thresholds: L74SessionThresholds): L74SessionOutlier[] {
  const outliers: L74SessionOutlier[] = [];
  const byMetric = new Map<string, L74MetricAggregate>(aggregates.map((aggregate) => [aggregate.metricId, aggregate]));
  for (const frame of frames) {
    if (frame.warnings.length > thresholds.maxAllowedWarningCount) {
      outliers.push({
        frameId: frame.frameId,
        metricId: "warning_count",
        severity: "warning",
        rule: "warning-count",
        value: frame.warnings.length,
        threshold: thresholds.maxAllowedWarningCount,
        message: `Frame ${frame.frameId} has ${frame.warnings.length} warnings, above allowed ${thresholds.maxAllowedWarningCount}.`
      });
    }
    for (const metricRow of frame.metrics) {
      const aggregate = byMetric.get(metricRow.id);
      if (metricRow.id === "rms_residual_px" && metricRow.value > thresholds.maxGeometricRmsResidualPx) {
        outliers.push(thresholdOutlier(frame, metricRow, "fail", thresholds.maxGeometricRmsResidualPx, `reprojection RMS ${fmt(metricRow.value)} px exceeds threshold ${fmt(thresholds.maxGeometricRmsResidualPx)} px`));
      }
      if (metricRow.id === "detection_coverage" && metricRow.value < thresholds.minDetectionCoverage) {
        outliers.push({
          frameId: frame.frameId,
          metricId: metricRow.id,
          severity: "warning",
          rule: "detection-coverage",
          value: metricRow.value,
          threshold: thresholds.minDetectionCoverage,
          message: `Frame ${frame.frameId} detection coverage is ${fmt(metricRow.value)}, below required ${fmt(thresholds.minDetectionCoverage)}.`
        });
      }
      if (metricRow.id === "mtf50_cycles_per_px" && metricRow.value < thresholds.minMtf50CyclesPerPx) {
        outliers.push(thresholdOutlier(frame, metricRow, "fail", thresholds.minMtf50CyclesPerPx, `MTF50 ${fmt(metricRow.value)} cycles/px is below minimum ${fmt(thresholds.minMtf50CyclesPerPx)}`));
      }
      if (aggregate && aggregate.std > 0) {
        const z = Math.abs((metricRow.value - aggregate.mean) / aggregate.std);
        if (z > thresholds.maxZScore) {
          outliers.push({
            frameId: frame.frameId,
            metricId: metricRow.id,
            severity: "warning",
            rule: "z-score",
            value: round(z),
            threshold: thresholds.maxZScore,
            message: `Frame ${frame.frameId} ${metricRow.label} is ${fmt(z)} standard deviations from the session mean.`
          });
        }
      }
    }
  }
  const pixelScale = byMetric.get("mean_pixel_scale_um_per_px");
  if (pixelScale && pixelScale.std > thresholds.maxPixelScaleRepeatabilityStdUmPerPx) {
    outliers.push({
      frameId: pixelScale.worstFrameId,
      metricId: pixelScale.metricId,
      severity: "warning",
      rule: "session-repeatability",
      value: pixelScale.std,
      threshold: thresholds.maxPixelScaleRepeatabilityStdUmPerPx,
      message: `Pixel-scale repeatability std ${fmt(pixelScale.std)} um/px exceeds threshold ${fmt(thresholds.maxPixelScaleRepeatabilityStdUmPerPx)} um/px.`
    });
  }
  const mtf50 = byMetric.get("mtf50_cycles_per_px");
  if (mtf50?.coefficientOfVariation !== null && mtf50?.coefficientOfVariation !== undefined && mtf50.coefficientOfVariation > thresholds.maxMtf50CoefficientOfVariation) {
    outliers.push({
      frameId: mtf50.worstFrameId,
      metricId: mtf50.metricId,
      severity: "warning",
      rule: "session-repeatability",
      value: mtf50.coefficientOfVariation,
      threshold: thresholds.maxMtf50CoefficientOfVariation,
      message: `MTF50 coefficient of variation ${fmt(mtf50.coefficientOfVariation)} exceeds threshold ${fmt(thresholds.maxMtf50CoefficientOfVariation)}.`
    });
  }
  const blackLevel = byMetric.get("black_level_dn");
  if (blackLevel && Math.abs(blackLevel.max - blackLevel.min) > thresholds.maxCameraBlackLevelDriftDn) {
    outliers.push({
      frameId: blackLevel.worstFrameId,
      metricId: blackLevel.metricId,
      severity: "warning",
      rule: "camera-drift",
      value: round(Math.abs(blackLevel.max - blackLevel.min)),
      threshold: thresholds.maxCameraBlackLevelDriftDn,
      message: `Camera black-level drift ${fmt(Math.abs(blackLevel.max - blackLevel.min))} DN exceeds threshold ${fmt(thresholds.maxCameraBlackLevelDriftDn)} DN.`
    });
  }
  return dedupeOutliers(outliers);
}

function sessionWarnings(aggregates: L74MetricAggregate[], thresholds: L74SessionThresholds): SolverWarning[] {
  const warnings: SolverWarning[] = [];
  const mtf50 = aggregates.find((aggregate) => aggregate.metricId === "mtf50_cycles_per_px");
  if (mtf50?.coefficientOfVariation !== null && mtf50?.coefficientOfVariation !== undefined && mtf50.coefficientOfVariation > thresholds.maxMtf50CoefficientOfVariation) {
    warnings.push({ code: "l74.session.mtf50Repeatability", message: "MTF50 repeatability is outside the configured coefficient-of-variation threshold." });
  }
  const pixelScale = aggregates.find((aggregate) => aggregate.metricId === "mean_pixel_scale_um_per_px");
  if (pixelScale && pixelScale.std > thresholds.maxPixelScaleRepeatabilityStdUmPerPx) {
    warnings.push({ code: "l74.session.pixelScaleRepeatability", message: "Pixel-scale repeatability is outside the configured std threshold." });
  }
  return warnings;
}

function thresholdOutlier(frame: L74SessionFrame, metricRow: L74FrameMetric, severity: Exclude<L74QaStatus, "pass">, threshold: number, reason: string): L74SessionOutlier {
  return {
    frameId: frame.frameId,
    metricId: metricRow.id,
    severity,
    rule: "threshold",
    value: metricRow.value,
    threshold,
    message: `Frame ${frame.frameId} rejected: ${reason}.`
  };
}

function syntheticMetricsForRow(row: L74SessionManifestRow, index: number): L74FrameMetric[] {
  if (row.type === "dot_grid" || row.type === "point_csv" || row.type === "geometric_fit" || row.type === "target_detection" || row.type === "fiducial_board") {
    const residual = index === 1 ? 1.35 : 0.18 + index * 0.03;
    const coverage = index === 1 ? 0.86 : 0.985 - index * 0.003;
    return compactMetrics([
      metric("mean_pixel_scale_um_per_px", "Mean pixel scale", "geometry", 2.35 + index * 0.006, "um/px"),
      metric("rotation_deg", "Rotation", "geometry", 0.12 + index * 0.015, "deg"),
      metric("radial_k1", "Radial k1", "geometry", -0.012 + index * 0.0008),
      metric("rms_residual_px", "RMS reprojection residual", "geometry", residual, "px"),
      metric("max_residual_px", "Max reprojection residual", "geometry", residual * 2.1, "px"),
      metric("center_residual_px", "Center residual", "geometry", residual * 0.7, "px"),
      metric("corner_residual_px", "Corner residual", "geometry", residual * 1.35, "px"),
      metric("detection_coverage", "Detection coverage", "detection", coverage)
    ]);
  }
  if (row.type === "slanted_edge" || row.type === "focus_sweep_mtf" || row.type === "field_mtf_map") {
    const focusPenalty = row.focusZUm === undefined ? 0 : Math.abs(row.focusZUm) / 1000;
    return compactMetrics([
      metric("mtf50_cycles_per_px", "MTF50", "mtf", 0.29 - focusPenalty - index * 0.006, "cycles/px"),
      metric("mtf10_cycles_per_px", "MTF10", "mtf", 0.41 - focusPenalty * 0.6 - index * 0.005, "cycles/px"),
      metric("mtf_at_nyquist", "MTF at Nyquist", "mtf", 0.28 - focusPenalty * 0.5 - index * 0.002),
      metric("field_uniformity_score", "Field uniformity", "mtf", 0.92 - index * 0.015)
    ]);
  }
  return compactMetrics([
    metric("black_level_dn", "Black level", "camera", 63 + index * 1.2, "DN"),
    metric("read_noise_e_rms", "Read noise", "camera", 2.1 + index * 0.08, "e- RMS"),
    metric("gain_dn_per_e", "Gain", "camera", 0.82 + index * 0.002, "DN/e-"),
    metric("dark_current_e_per_s", "Dark current", "camera", 0.14 + index * 0.01, "e-/px/s"),
    metric("snr_mean", "Mean SNR", "camera", 38 - index * 0.7)
  ]);
}

function syntheticWarningsForRow(row: L74SessionManifestRow, index: number): SolverWarning[] {
  if ((row.type === "dot_grid" || row.type === "target_detection") && index === 1) {
    return [{ code: "l74.example.lowDetectionCoverage", message: "Example repeat frame has intentionally low dot-grid coverage for outlier QA." }];
  }
  return [];
}

function metric(id: string, label: string, family: L74MetricFamily, value: number | null | undefined, unit?: string): L74FrameMetric | null {
  return value === null || value === undefined || !Number.isFinite(value) ? null : { id, label, family, value: round(value), unit };
}

function compactMetrics(values: Array<L74FrameMetric | null>): L74FrameMetric[] {
  return values.filter((value): value is L74FrameMetric => value !== null);
}

function normalizeFrameType(value: string): L74FrameType | null {
  const normalized = value.trim().toLowerCase().replace(/[-\s]+/g, "_");
  if (normalized === "dot_grid" || normalized === "dotgrid") return "dot_grid";
  if (normalized === "point_csv" || normalized === "points_csv") return "point_csv";
  if (normalized === "geometric_fit" || normalized === "geometry") return "geometric_fit";
  if (normalized === "target_detection" || normalized === "detection") return "target_detection";
  if (normalized === "fiducial_board" || normalized === "fiducial" || normalized === "charuco" || normalized === "charuco_board") return "fiducial_board";
  if (normalized === "slanted_edge" || normalized === "edge") return "slanted_edge";
  if (normalized === "focus_sweep" || normalized === "focus_sweep_mtf") return "focus_sweep_mtf";
  if (normalized === "field_mtf" || normalized === "field_mtf_map") return "field_mtf_map";
  if (normalized === "camera_calibration" || normalized === "calibration") return "camera_calibration";
  if (normalized === "camera_frame" || normalized === "sensor_lite" || normalized === "camera") return "camera_frame";
  return null;
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index] ?? "";
    if (char === "\"") {
      if (quoted && line[index + 1] === "\"") {
        cell += "\"";
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell);
  return cells.map((value) => value.trim());
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[-\s]+/g, "_");
}

function findColumn(header: string[], names: string[]): number {
  return header.findIndex((cell) => names.includes(cell));
}

function optionalNumber(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : undefined;
}

function mean(values: number[]): number {
  if (values.length === 0) return Number.NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length <= 1) return 0;
  const average = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1);
  return Math.sqrt(Math.max(0, variance));
}

function slope(points: Array<[number, number]>): number | null {
  const filtered = points.filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (filtered.length < 2) return null;
  const meanX = mean(filtered.map(([x]) => x));
  const meanY = mean(filtered.map(([, y]) => y));
  const denominator = filtered.reduce((sum, [x]) => sum + (x - meanX) ** 2, 0);
  if (denominator === 0) return null;
  const numerator = filtered.reduce((sum, [x, y]) => sum + (x - meanX) * (y - meanY), 0);
  return round(numerator / denominator);
}

function worseStatus(a: L74QaStatus, b: L74QaStatus): L74QaStatus {
  const order: Record<L74QaStatus, number> = { pass: 0, warning: 1, fail: 2 };
  return order[b] > order[a] ? b : a;
}

function finite(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? value! : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toPrecision(12)) : value;
}

function fmt(value: number | null | undefined): string {
  return value === null || value === undefined || !Number.isFinite(value) ? "n/a" : value.toPrecision(4);
}

function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

function dedupeOutliers(outliers: L74SessionOutlier[]): L74SessionOutlier[] {
  const seen = new Set<string>();
  return outliers.filter((outlier) => {
    const key = `${outlier.frameId}:${outlier.metricId}:${outlier.rule}:${outlier.severity}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function resultForHash(result: Omit<L74SessionQaResult, "resultHash">): unknown {
  return {
    ...result,
    frames: result.frames.map((frame) => ({ frameId: frame.frameId, type: frame.type, status: frame.status, resultHash: frame.resultHash, metrics: frame.metrics })),
    warnings: result.warnings.map((warning) => warning.code)
  };
}
