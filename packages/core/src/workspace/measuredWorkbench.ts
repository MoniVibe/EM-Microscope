import { hashMeasuredImagePixels2D, type MeasuredImagePixels2D } from "../measurement/measuredImage2d";
import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import type { StudyProfilePoint } from "./studyWorkspace";

export type L67MeasuredDataKind = "csv-profile" | "image-centerline" | "csv-grid";
export type L67NormalizationMode = "none" | "peak" | "area" | "center";

export type L67MeasuredCalibration = {
  positionUnit: "m" | "mm" | "um" | "px";
  pixelSizeM?: number;
  xOffsetM: number;
  yOffsetM?: number;
  flipX: boolean;
  flipY?: boolean;
  roi?: {
    xMinM?: number;
    xMaxM?: number;
  };
  normalizationMode: L67NormalizationMode;
  intensityScale: number;
  backgroundOffset: number;
};

export type L67MeasuredProfilePoint = {
  xM: number;
  intensity: number;
  sourceIndex: number;
  label?: string;
};

export type L67MeasuredDataset = {
  schema: "emmicro.measuredData.v1";
  appVersion: "L6.7";
  id: string;
  label: string;
  kind: L67MeasuredDataKind;
  sourceName: string;
  importedAtIso: string;
  measuredDataHash: string;
  imageHash?: string;
  dimensions?: {
    widthPx: number;
    heightPx: number;
  };
  calibration: L67MeasuredCalibration;
  profile: L67MeasuredProfilePoint[];
  metadata: {
    notes?: string;
    wavelengthM?: number;
    originalColumns?: string[];
    skippedRowCount: number;
  };
  warnings: SolverWarning[];
  limitations: string[];
};

export type L67SimulatedProfile = {
  id: string;
  label: string;
  resultHash: string;
  profile: StudyProfilePoint[];
  sourceKind: string;
};

export type L67ResidualProfilePoint = {
  xM: number;
  measured: number;
  simulated: number;
  residual: number;
};

export type L67MeasuredComparisonMetrics = {
  rmsResidual: number;
  maeResidual: number;
  maxAbsResidual: number;
  normalizedCrossCorrelation: number;
  peakPositionErrorM: number | null;
  centroidErrorM: number | null;
  fwhmErrorM: number | null;
  firstMinimumErrorM: number | null;
  visibilityError: number | null;
  areaNormalizationRatio: number | null;
};

export type L67MeasuredComparisonResult = {
  schema: "emmicro.measuredComparison.v1";
  appVersion: "L6.7";
  id: string;
  label: string;
  measured: Pick<L67MeasuredDataset, "id" | "label" | "kind" | "sourceName" | "measuredDataHash" | "imageHash" | "calibration">;
  simulated: Pick<L67SimulatedProfile, "id" | "label" | "resultHash" | "sourceKind">;
  alignment: {
    shiftM: number;
    intensityScale: number;
    backgroundOffset: number;
  };
  residualProfile: L67ResidualProfilePoint[];
  metrics: L67MeasuredComparisonMetrics;
  warnings: SolverWarning[];
  limitations: string[];
  resultHash: string;
};

export type L67DiagnosticFitSettings = {
  shiftStartM: number;
  shiftStopM: number;
  shiftSteps: number;
  scaleStart: number;
  scaleStop: number;
  scaleSteps: number;
  backgroundStart: number;
  backgroundStop: number;
  backgroundSteps: number;
};

export type L67DiagnosticFitRow = {
  shiftM: number;
  intensityScale: number;
  backgroundOffset: number;
  score: number;
  rmsResidual: number;
  normalizedCrossCorrelation: number;
};

export type L67DiagnosticFitResult = {
  schema: "emmicro.measuredFit.v1";
  appVersion: "L6.7";
  id: string;
  comparisonId: string;
  optimizer: "deterministic-grid-search";
  settings: L67DiagnosticFitSettings;
  before: {
    score: number;
    rmsResidual: number;
  };
  best: L67DiagnosticFitRow;
  evaluatedCount: number;
  improvement: {
    scoreDelta: number;
    rmsResidualDelta: number;
    rmsResidualRatio: number;
  };
  rows: L67DiagnosticFitRow[];
  warnings: SolverWarning[];
  limitations: string[];
  resultHash: string;
};

export type L67MeasuredComparisonBundle = {
  schema: "emmicro.measuredComparisonBundle.v1";
  appVersion: "L6.7 Measured-vs-Simulated Lab Data Workbench";
  manifest: {
    measuredDataHash: string;
    simulatedResultHash: string;
    comparisonResultHash: string;
    fitResultHash?: string;
    warningCount: number;
    capabilityBoundary: string;
  };
  comparison: L67MeasuredComparisonResult;
  fit?: L67DiagnosticFitResult;
  comparisonReportMarkdown: string;
  comparisonReportJson: string;
  measuredMetricsCsv: string;
  simulatedMetricsCsv: string;
  residualProfileCsv: string;
  fitGridCsv: string;
  warningsJson: SolverWarning[];
};

export function defaultL67MeasuredCalibration(input: Partial<L67MeasuredCalibration> = {}): L67MeasuredCalibration {
  return {
    positionUnit: input.positionUnit ?? "m",
    pixelSizeM: input.pixelSizeM,
    xOffsetM: input.xOffsetM ?? 0,
    yOffsetM: input.yOffsetM,
    flipX: input.flipX ?? false,
    flipY: input.flipY,
    roi: input.roi,
    normalizationMode: input.normalizationMode ?? "peak",
    intensityScale: input.intensityScale ?? 1,
    backgroundOffset: input.backgroundOffset ?? 0
  };
}

export function parseMeasuredCsvProfile(
  text: string,
  input: {
    id?: string;
    label?: string;
    sourceName?: string;
    calibration?: Partial<L67MeasuredCalibration>;
    notes?: string;
    wavelengthM?: number;
    importedAtIso?: string;
  } = {}
): L67MeasuredDataset {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
  if (rows.length === 0) throw new Error("measured CSV profile is empty");

  const first = splitCsvLine(rows[0] ?? "");
  const hasHeader = first.some((cell) => /[A-Za-z]/.test(cell));
  const header = hasHeader ? first.map((cell) => cell.trim()) : ["x_m", "intensity"];
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const xIndex = findColumn(header, ["x_m", "position_m", "x", "position", "radius_m", "x_mm", "position_mm", "x_um", "position_um", "pixel", "x_px"]);
  const intensityIndex = findColumn(header, ["intensity", "measured", "value", "relative_intensity", "signal"]);
  if (xIndex < 0 || intensityIndex < 0) throw new Error("measured CSV profile requires position and intensity columns");

  const inferredUnit = inferPositionUnit(header[xIndex] ?? "", input.calibration?.positionUnit);
  const calibration = defaultL67MeasuredCalibration({ ...input.calibration, positionUnit: inferredUnit });
  const parsed: Array<{ xRaw: number; intensity: number; sourceIndex: number }> = [];
  let skippedRowCount = 0;
  dataRows.forEach((row, rowIndex) => {
    const cells = splitCsvLine(row);
    const xRaw = Number(cells[xIndex]);
    const intensity = Number(cells[intensityIndex]);
    if (!Number.isFinite(xRaw) || !Number.isFinite(intensity)) {
      skippedRowCount += 1;
      return;
    }
    parsed.push({ xRaw, intensity, sourceIndex: rowIndex });
  });
  if (parsed.length < 2) throw new Error("measured CSV profile requires at least two numeric samples");

  const profile = calibrateAndNormalizeProfile(
    parsed.map((point) => ({
      xM: unitToMeters(point.xRaw, calibration),
      intensity: point.intensity,
      sourceIndex: point.sourceIndex
    })),
    calibration
  );
  return createMeasuredDataset({
    id: input.id,
    label: input.label ?? "Measured CSV profile",
    kind: "csv-profile",
    sourceName: input.sourceName ?? "measured-profile.csv",
    importedAtIso: input.importedAtIso,
    calibration,
    profile,
    metadata: {
      notes: input.notes,
      wavelengthM: input.wavelengthM,
      originalColumns: header,
      skippedRowCount
    },
    warnings: skippedRowCount > 0 ? [{ code: "l67.csv.skippedRows", message: `Skipped ${skippedRowCount} malformed measured CSV row(s).` }] : []
  });
}

export function createMeasuredProfileFromImagePixels(input: {
  id?: string;
  label?: string;
  sourceName?: string;
  widthPx: number;
  heightPx: number;
  data: ArrayLike<number>;
  channels?: "grayscale" | "rgb" | "rgba";
  lineYPx?: number;
  halfHeightPx?: number;
  calibration?: Partial<L67MeasuredCalibration>;
  notes?: string;
  importedAtIso?: string;
}): L67MeasuredDataset {
  const pixels = measuredPixelsFromArray(input.widthPx, input.heightPx, input.data, input.channels ?? "grayscale");
  const calibration = defaultL67MeasuredCalibration({
    ...input.calibration,
    positionUnit: "px",
    pixelSizeM: input.calibration?.pixelSizeM ?? 1
  });
  const lineY = Math.max(0, Math.min(input.heightPx - 1, Math.round(input.lineYPx ?? (input.heightPx - 1) / 2)));
  const halfHeight = Math.max(0, Math.round(input.halfHeightPx ?? 0));
  const rawProfile: L67MeasuredProfilePoint[] = [];
  for (let x = 0; x < input.widthPx; x += 1) {
    let sum = 0;
    let count = 0;
    for (let y = Math.max(0, lineY - halfHeight); y <= Math.min(input.heightPx - 1, lineY + halfHeight); y += 1) {
      sum += grayscaleAt(pixels, x, y);
      count += 1;
    }
    rawProfile.push({
      xM: (x - (input.widthPx - 1) / 2) * (calibration.pixelSizeM ?? 1),
      intensity: count > 0 ? sum / count : 0,
      sourceIndex: x
    });
  }
  const imageHash = hashMeasuredImagePixels2D(pixels);
  const profile = calibrateAndNormalizeProfile(rawProfile, calibration);
  return createMeasuredDataset({
    id: input.id,
    label: input.label ?? "Measured image centerline",
    kind: "image-centerline",
    sourceName: input.sourceName ?? "measured-image",
    importedAtIso: input.importedAtIso,
    calibration,
    profile,
    imageHash,
    dimensions: { widthPx: input.widthPx, heightPx: input.heightPx },
    metadata: {
      notes: input.notes,
      skippedRowCount: 0
    },
    warnings: [
      {
        code: "l67.image.centerline",
        message: "Measured image import currently compares a calibrated grayscale centerline/profile, not a certified camera or sensor-stack model."
      }
    ]
  });
}

export function simulatedProfileFromStudy(study: {
  id: string;
  name: string;
  mode: string;
  resultHash: string;
  profiles: Record<string, StudyProfilePoint[]>;
}): L67SimulatedProfile {
  const entry = Object.entries(study.profiles)[0];
  if (!entry) throw new Error("selected simulated study has no profile data to compare");
  return {
    id: study.id,
    label: `${study.name} ${entry[0]}`,
    resultHash: study.resultHash,
    profile: entry[1],
    sourceKind: study.mode
  };
}

export function compareMeasuredToSimulatedProfile(input: {
  id?: string;
  label?: string;
  measured: L67MeasuredDataset;
  simulated: L67SimulatedProfile;
  shiftM?: number;
  intensityScale?: number;
  backgroundOffset?: number;
}): L67MeasuredComparisonResult {
  const shiftM = input.shiftM ?? 0;
  const intensityScale = input.intensityScale ?? 1;
  const backgroundOffset = input.backgroundOffset ?? 0;
  const simulatedSorted = normalizeStudyProfile(input.simulated.profile);
  const residualProfile: L67ResidualProfilePoint[] = [];
  for (const measuredPoint of input.measured.profile) {
    const simulatedRaw = sampleProfile(simulatedSorted, measuredPoint.xM - shiftM);
    if (simulatedRaw === null) continue;
    const simulated = simulatedRaw * intensityScale + backgroundOffset;
    residualProfile.push({
      xM: measuredPoint.xM,
      measured: measuredPoint.intensity,
      simulated,
      residual: measuredPoint.intensity - simulated
    });
  }
  const warnings: SolverWarning[] = [];
  if (residualProfile.length < Math.max(4, input.measured.profile.length * 0.5)) {
    warnings.push({
      code: "l67.compare.lowOverlap",
      message: "Measured and simulated profiles have limited coordinate overlap; check calibration, ROI, and shift bounds."
    });
  }
  if (input.measured.kind === "image-centerline") {
    warnings.push({
      code: "l67.compare.imageProfileOnly",
      message: "Image comparison uses a grayscale centerline/profile in this pass; full image-map certification is not claimed."
    });
  }
  const metrics = measuredComparisonMetrics(residualProfile);
  const id = input.id ?? slugId(input.label ?? "l67 measured comparison");
  const limitations = l67MeasuredLimitations();
  const base = {
    schema: "emmicro.measuredComparison.v1" as const,
    appVersion: "L6.7" as const,
    id,
    label: input.label ?? "L6.7 measured-vs-simulated comparison",
    measured: {
      id: input.measured.id,
      label: input.measured.label,
      kind: input.measured.kind,
      sourceName: input.measured.sourceName,
      measuredDataHash: input.measured.measuredDataHash,
      imageHash: input.measured.imageHash,
      calibration: input.measured.calibration
    },
    simulated: {
      id: input.simulated.id,
      label: input.simulated.label,
      resultHash: input.simulated.resultHash,
      sourceKind: input.simulated.sourceKind
    },
    alignment: {
      shiftM,
      intensityScale,
      backgroundOffset
    },
    residualProfile,
    metrics,
    warnings: [...input.measured.warnings, ...warnings],
    limitations
  };
  return {
    ...base,
    resultHash: fnv1a64(stableStringify(comparisonForHash(base)))
  };
}

export function runL67DiagnosticFit(input: {
  id?: string;
  comparison: L67MeasuredComparisonResult;
  measured: L67MeasuredDataset;
  simulated: L67SimulatedProfile;
  settings?: Partial<L67DiagnosticFitSettings>;
}): L67DiagnosticFitResult {
  const settings = normalizeFitSettings(input.settings);
  const baseline = compareMeasuredToSimulatedProfile({
    id: `${input.comparison.id}-baseline`,
    label: "baseline",
    measured: input.measured,
    simulated: input.simulated
  });
  const rows: L67DiagnosticFitRow[] = [];
  let best: L67DiagnosticFitRow | null = null;
  for (const shiftM of gridValues(settings.shiftStartM, settings.shiftStopM, settings.shiftSteps)) {
    for (const intensityScale of gridValues(settings.scaleStart, settings.scaleStop, settings.scaleSteps)) {
      for (const backgroundOffset of gridValues(settings.backgroundStart, settings.backgroundStop, settings.backgroundSteps)) {
        const comparison = compareMeasuredToSimulatedProfile({
          id: `${input.comparison.id}-fit-eval`,
          label: "fit evaluation",
          measured: input.measured,
          simulated: input.simulated,
          shiftM,
          intensityScale,
          backgroundOffset
        });
        const row = {
          shiftM,
          intensityScale,
          backgroundOffset,
          score: comparison.metrics.rmsResidual - comparison.metrics.normalizedCrossCorrelation * 0.02,
          rmsResidual: comparison.metrics.rmsResidual,
          normalizedCrossCorrelation: comparison.metrics.normalizedCrossCorrelation
        };
        rows.push(row);
        if (!best || row.score < best.score || (row.score === best.score && stableStringify(row) < stableStringify(best))) best = row;
      }
    }
  }
  const selected = best ?? {
    shiftM: 0,
    intensityScale: 1,
    backgroundOffset: 0,
    score: Number.POSITIVE_INFINITY,
    rmsResidual: Number.POSITIVE_INFINITY,
    normalizedCrossCorrelation: 0
  };
  const warnings: SolverWarning[] = [
    ...input.comparison.warnings,
    {
      code: "l67.fit.diagnosticOnly",
      message: "Diagnostic fit adjusts alignment/scale/background only; it is not certified calibration or new physics fitting."
    }
  ];
  const base = {
    schema: "emmicro.measuredFit.v1" as const,
    appVersion: "L6.7" as const,
    id: input.id ?? `${input.comparison.id}-fit`,
    comparisonId: input.comparison.id,
    optimizer: "deterministic-grid-search" as const,
    settings,
    before: {
      score: baseline.metrics.rmsResidual - baseline.metrics.normalizedCrossCorrelation * 0.02,
      rmsResidual: baseline.metrics.rmsResidual
    },
    best: selected,
    evaluatedCount: rows.length,
    improvement: {
      scoreDelta: (baseline.metrics.rmsResidual - baseline.metrics.normalizedCrossCorrelation * 0.02) - selected.score,
      rmsResidualDelta: baseline.metrics.rmsResidual - selected.rmsResidual,
      rmsResidualRatio: baseline.metrics.rmsResidual > 0 ? selected.rmsResidual / baseline.metrics.rmsResidual : 1
    },
    rows,
    warnings,
    limitations: l67MeasuredLimitations()
  };
  return {
    ...base,
    resultHash: fnv1a64(stableStringify(fitForHash(base)))
  };
}

export function measuredComparisonReportJson(comparison: L67MeasuredComparisonResult, fit?: L67DiagnosticFitResult): string {
  return JSON.stringify({ comparison, fit, warnings: measuredComparisonWarnings(comparison, fit), limitations: l67MeasuredLimitations() }, null, 2);
}

export function measuredComparisonReportMarkdown(comparison: L67MeasuredComparisonResult, fit?: L67DiagnosticFitResult): string {
  const metricRows = measuredComparisonMetricRows(comparison);
  return [
    `# ${comparison.label}`,
    "",
    `App version: ${comparison.appVersion}`,
    `Measured data hash: ${comparison.measured.measuredDataHash}`,
    `Simulated result hash: ${comparison.simulated.resultHash}`,
    `Comparison result hash: ${comparison.resultHash}`,
    fit ? `Fit result hash: ${fit.resultHash}` : "",
    "",
    "## Metrics",
    "| Metric | Value | Unit |",
    "| --- | ---: | --- |",
    ...metricRows.map((row) => `| ${row.label} | ${formatNumber(row.value)} | ${row.unit ?? ""} |`),
    "",
    "## Diagnostic Fit",
    fit
      ? `- Evaluated ${fit.evaluatedCount} bounded grid points; RMS ${formatNumber(fit.before.rmsResidual)} -> ${formatNumber(fit.best.rmsResidual)}.`
      : "- No fit run.",
    fit ? `- Best parameters: shift=${formatNumber(fit.best.shiftM)} m, scale=${formatNumber(fit.best.intensityScale)}, background=${formatNumber(fit.best.backgroundOffset)}.` : "",
    "",
    "## Warnings",
    ...(measuredComparisonWarnings(comparison, fit).length ? measuredComparisonWarnings(comparison, fit).map((warning) => `- ${warning.message}`) : ["- none"]),
    "",
    "## Limitations",
    ...l67MeasuredLimitations().map((limitation) => `- ${limitation}`)
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function measuredMetricsCsv(comparison: L67MeasuredComparisonResult): string {
  return [
    "metric,value,unit",
    ...measuredComparisonMetricRows(comparison).map((row) => [row.id, row.value, row.unit ?? ""].map(csvEscape).join(","))
  ].join("\n");
}

export function simulatedMetricsCsv(comparison: L67MeasuredComparisonResult): string {
  return [
    "simulated_id,result_hash,source_kind,alignment_shift_m,intensity_scale,background_offset",
    [
      comparison.simulated.id,
      comparison.simulated.resultHash,
      comparison.simulated.sourceKind,
      comparison.alignment.shiftM,
      comparison.alignment.intensityScale,
      comparison.alignment.backgroundOffset
    ].map(csvEscape).join(",")
  ].join("\n");
}

export function residualProfileCsv(comparison: L67MeasuredComparisonResult): string {
  return [
    "x_m,measured,simulated,residual",
    ...comparison.residualProfile.map((point) => [point.xM, point.measured, point.simulated, point.residual].map(csvEscape).join(","))
  ].join("\n");
}

export function fitGridCsv(fit?: L67DiagnosticFitResult): string {
  if (!fit) return "shift_m,intensity_scale,background_offset,score,rms_residual,normalized_cross_correlation";
  return [
    "shift_m,intensity_scale,background_offset,score,rms_residual,normalized_cross_correlation",
    ...fit.rows.map((row) => [row.shiftM, row.intensityScale, row.backgroundOffset, row.score, row.rmsResidual, row.normalizedCrossCorrelation].map(csvEscape).join(","))
  ].join("\n");
}

export function measuredComparisonBundleJson(comparison: L67MeasuredComparisonResult, fit?: L67DiagnosticFitResult): L67MeasuredComparisonBundle {
  const warnings = measuredComparisonWarnings(comparison, fit);
  return {
    schema: "emmicro.measuredComparisonBundle.v1",
    appVersion: "L6.7 Measured-vs-Simulated Lab Data Workbench",
    manifest: {
      measuredDataHash: comparison.measured.measuredDataHash,
      simulatedResultHash: comparison.simulated.resultHash,
      comparisonResultHash: comparison.resultHash,
      fitResultHash: fit?.resultHash,
      warningCount: warnings.length,
      capabilityBoundary: "Diagnostic measured-vs-simulated comparison over existing scalar validation/planar TMM outputs only; no certified calibration, sensor model, digital twin, or 3D Maxwell/FDTD/FEM/BEM/RCWA execution."
    },
    comparison,
    fit,
    comparisonReportMarkdown: measuredComparisonReportMarkdown(comparison, fit),
    comparisonReportJson: measuredComparisonReportJson(comparison, fit),
    measuredMetricsCsv: measuredMetricsCsv(comparison),
    simulatedMetricsCsv: simulatedMetricsCsv(comparison),
    residualProfileCsv: residualProfileCsv(comparison),
    fitGridCsv: fitGridCsv(fit),
    warningsJson: warnings
  };
}

export function l67MeasuredLimitations(): string[] {
  return [
    "Measured-vs-simulated workbench output is diagnostic comparison evidence only.",
    "No certified ISO/EMVA/clinical/hardware calibration is performed.",
    "No new diffraction physics, sensor-stack model, microscope digital twin, manufacturing certification, or 3D Maxwell/FDTD/FEM/BEM/RCWA execution is added.",
    "Diagnostic fit is limited to bounded alignment, intensity scale, and background offset."
  ];
}

function createMeasuredDataset(input: {
  id?: string;
  label: string;
  kind: L67MeasuredDataKind;
  sourceName: string;
  importedAtIso?: string;
  calibration: L67MeasuredCalibration;
  profile: L67MeasuredProfilePoint[];
  imageHash?: string;
  dimensions?: { widthPx: number; heightPx: number };
  metadata: L67MeasuredDataset["metadata"];
  warnings?: SolverWarning[];
}): L67MeasuredDataset {
  if (input.profile.length < 2) throw new Error("measured dataset requires at least two calibrated profile samples");
  const base = {
    schema: "emmicro.measuredData.v1" as const,
    appVersion: "L6.7" as const,
    id: input.id ?? slugId(input.label),
    label: input.label,
    kind: input.kind,
    sourceName: input.sourceName,
    importedAtIso: input.importedAtIso ?? "1970-01-01T00:00:00.000Z",
    imageHash: input.imageHash,
    dimensions: input.dimensions,
    calibration: input.calibration,
    profile: input.profile,
    metadata: input.metadata,
    warnings: input.warnings ?? [],
    limitations: l67MeasuredLimitations()
  };
  return {
    ...base,
    measuredDataHash: fnv1a64(stableStringify(measuredDatasetForHash(base)))
  };
}

function calibrateAndNormalizeProfile(profile: L67MeasuredProfilePoint[], calibration: L67MeasuredCalibration): L67MeasuredProfilePoint[] {
  const transformed = profile
    .map((point) => ({
      ...point,
      xM: (calibration.flipX ? -point.xM : point.xM) + calibration.xOffsetM,
      intensity: point.intensity * calibration.intensityScale + calibration.backgroundOffset
    }))
    .filter((point) => calibration.roi?.xMinM === undefined || point.xM >= calibration.roi.xMinM)
    .filter((point) => calibration.roi?.xMaxM === undefined || point.xM <= calibration.roi.xMaxM)
    .sort((a, b) => a.xM - b.xM);
  const denominator = normalizationDenominator(transformed, calibration.normalizationMode);
  return transformed.map((point) => ({
    ...point,
    intensity: denominator > 0 ? point.intensity / denominator : point.intensity
  }));
}

function normalizationDenominator(profile: L67MeasuredProfilePoint[], mode: L67NormalizationMode): number {
  if (mode === "none") return 1;
  if (profile.length === 0) return 1;
  if (mode === "peak") return Math.max(...profile.map((point) => Math.abs(point.intensity)), 0) || 1;
  if (mode === "center") {
    const center = profile.reduce((best, point) => (Math.abs(point.xM) < Math.abs(best.xM) ? point : best), profile[0]!);
    return Math.abs(center.intensity) || 1;
  }
  const sorted = [...profile].sort((a, b) => a.xM - b.xM);
  let area = 0;
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1]!;
    const current = sorted[index]!;
    area += Math.abs(current.xM - previous.xM) * Math.max(0, (previous.intensity + current.intensity) / 2);
  }
  return area || 1;
}

function measuredComparisonMetrics(residualProfile: L67ResidualProfilePoint[]): L67MeasuredComparisonMetrics {
  if (residualProfile.length === 0) {
    return {
      rmsResidual: Number.NaN,
      maeResidual: Number.NaN,
      maxAbsResidual: Number.NaN,
      normalizedCrossCorrelation: Number.NaN,
      peakPositionErrorM: null,
      centroidErrorM: null,
      fwhmErrorM: null,
      firstMinimumErrorM: null,
      visibilityError: null,
      areaNormalizationRatio: null
    };
  }
  const rmsResidual = Math.sqrt(residualProfile.reduce((sum, point) => sum + point.residual * point.residual, 0) / residualProfile.length);
  const maeResidual = residualProfile.reduce((sum, point) => sum + Math.abs(point.residual), 0) / residualProfile.length;
  const maxAbsResidual = Math.max(...residualProfile.map((point) => Math.abs(point.residual)));
  const measuredProfile = residualProfile.map((point) => ({ xM: point.xM, intensity: point.measured }));
  const simulatedProfile = residualProfile.map((point) => ({ xM: point.xM, intensity: point.simulated }));
  const measuredPeak = peakPosition(measuredProfile);
  const simulatedPeak = peakPosition(simulatedProfile);
  const measuredCentroid = centroid(measuredProfile);
  const simulatedCentroid = centroid(simulatedProfile);
  const measuredFwhm = fwhm(measuredProfile);
  const simulatedFwhm = fwhm(simulatedProfile);
  const measuredFirstMin = firstMinimumRightOfCenter(measuredProfile);
  const simulatedFirstMin = firstMinimumRightOfCenter(simulatedProfile);
  const measuredVisibility = visibility(measuredProfile);
  const simulatedVisibility = visibility(simulatedProfile);
  const measuredArea = areaUnderProfile(measuredProfile);
  const simulatedArea = areaUnderProfile(simulatedProfile);
  return {
    rmsResidual,
    maeResidual,
    maxAbsResidual,
    normalizedCrossCorrelation: normalizedCrossCorrelation(measuredProfile, simulatedProfile),
    peakPositionErrorM: measuredPeak === null || simulatedPeak === null ? null : measuredPeak - simulatedPeak,
    centroidErrorM: measuredCentroid === null || simulatedCentroid === null ? null : measuredCentroid - simulatedCentroid,
    fwhmErrorM: measuredFwhm === null || simulatedFwhm === null ? null : measuredFwhm - simulatedFwhm,
    firstMinimumErrorM: measuredFirstMin === null || simulatedFirstMin === null ? null : measuredFirstMin - simulatedFirstMin,
    visibilityError: measuredVisibility === null || simulatedVisibility === null ? null : measuredVisibility - simulatedVisibility,
    areaNormalizationRatio: simulatedArea > 0 ? measuredArea / simulatedArea : null
  };
}

function normalizeStudyProfile(profile: StudyProfilePoint[]): StudyProfilePoint[] {
  const sorted = [...profile].filter((point) => Number.isFinite(point.xM) && Number.isFinite(point.intensity)).sort((a, b) => a.xM - b.xM);
  const peak = Math.max(...sorted.map((point) => Math.abs(point.intensity)), 0);
  return sorted.map((point) => ({ ...point, intensity: peak > 0 ? point.intensity / peak : point.intensity }));
}

function sampleProfile(profile: StudyProfilePoint[], xM: number): number | null {
  if (profile.length === 0 || xM < profile[0]!.xM || xM > profile[profile.length - 1]!.xM) return null;
  let low = 0;
  let high = profile.length - 1;
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (profile[mid]!.xM <= xM) low = mid;
    else high = mid;
  }
  const a = profile[low]!;
  const b = profile[Math.min(profile.length - 1, low + 1)]!;
  if (a.xM === b.xM) return a.intensity;
  const t = (xM - a.xM) / (b.xM - a.xM);
  return a.intensity * (1 - t) + b.intensity * t;
}

function peakPosition(profile: Array<{ xM: number; intensity: number }>): number | null {
  if (profile.length === 0) return null;
  return profile.reduce((best, point) => (point.intensity > best.intensity ? point : best), profile[0]!).xM;
}

function centroid(profile: Array<{ xM: number; intensity: number }>): number | null {
  let weighted = 0;
  let total = 0;
  for (const point of profile) {
    const value = Math.max(0, point.intensity);
    weighted += point.xM * value;
    total += value;
  }
  return total > 0 ? weighted / total : null;
}

function fwhm(profile: Array<{ xM: number; intensity: number }>): number | null {
  if (profile.length < 2) return null;
  const max = Math.max(...profile.map((point) => point.intensity));
  const threshold = max / 2;
  const above = profile.filter((point) => point.intensity >= threshold);
  if (above.length < 2) return null;
  return above[above.length - 1]!.xM - above[0]!.xM;
}

function firstMinimumRightOfCenter(profile: Array<{ xM: number; intensity: number }>): number | null {
  const candidates = profile.filter((point) => point.xM >= 0);
  for (let index = 1; index < candidates.length - 1; index += 1) {
    const previous = candidates[index - 1]!;
    const current = candidates[index]!;
    const next = candidates[index + 1]!;
    if (current.intensity <= previous.intensity && current.intensity <= next.intensity && current.intensity < 0.35) return current.xM;
  }
  return null;
}

function visibility(profile: Array<{ intensity: number }>): number | null {
  if (profile.length < 2) return null;
  const max = Math.max(...profile.map((point) => point.intensity));
  const min = Math.min(...profile.map((point) => point.intensity));
  return max + min > 0 ? (max - min) / (max + min) : null;
}

function areaUnderProfile(profile: Array<{ xM: number; intensity: number }>): number {
  if (profile.length < 2) return 0;
  let area = 0;
  for (let index = 1; index < profile.length; index += 1) {
    const previous = profile[index - 1]!;
    const current = profile[index]!;
    area += Math.abs(current.xM - previous.xM) * Math.max(0, (previous.intensity + current.intensity) / 2);
  }
  return area;
}

function normalizedCrossCorrelation(measured: Array<{ intensity: number }>, simulated: Array<{ intensity: number }>): number {
  const count = Math.min(measured.length, simulated.length);
  if (count < 2) return 0;
  const meanMeasured = measured.slice(0, count).reduce((sum, point) => sum + point.intensity, 0) / count;
  const meanSimulated = simulated.slice(0, count).reduce((sum, point) => sum + point.intensity, 0) / count;
  let numerator = 0;
  let measuredPower = 0;
  let simulatedPower = 0;
  for (let index = 0; index < count; index += 1) {
    const a = measured[index]!.intensity - meanMeasured;
    const b = simulated[index]!.intensity - meanSimulated;
    numerator += a * b;
    measuredPower += a * a;
    simulatedPower += b * b;
  }
  const denominator = Math.sqrt(measuredPower * simulatedPower);
  return denominator > 0 ? numerator / denominator : 0;
}

function normalizeFitSettings(input: Partial<L67DiagnosticFitSettings> = {}): L67DiagnosticFitSettings {
  return {
    shiftStartM: input.shiftStartM ?? -1e-4,
    shiftStopM: input.shiftStopM ?? 1e-4,
    shiftSteps: Math.max(2, Math.min(21, Math.round(input.shiftSteps ?? 9))),
    scaleStart: input.scaleStart ?? 0.8,
    scaleStop: input.scaleStop ?? 1.2,
    scaleSteps: Math.max(2, Math.min(21, Math.round(input.scaleSteps ?? 5))),
    backgroundStart: input.backgroundStart ?? -0.05,
    backgroundStop: input.backgroundStop ?? 0.05,
    backgroundSteps: Math.max(2, Math.min(21, Math.round(input.backgroundSteps ?? 5)))
  };
}

function gridValues(start: number, stop: number, steps: number): number[] {
  if (steps <= 1) return [start];
  const values: number[] = [];
  for (let index = 0; index < steps; index += 1) {
    const t = index / (steps - 1);
    values.push(start + (stop - start) * t);
  }
  return values;
}

function measuredComparisonMetricRows(comparison: L67MeasuredComparisonResult): Array<{ id: string; label: string; value: number; unit?: string }> {
  const metrics = comparison.metrics;
  return [
    { id: "rmsResidual", label: "RMS residual", value: metrics.rmsResidual },
    { id: "maeResidual", label: "MAE residual", value: metrics.maeResidual },
    { id: "maxAbsResidual", label: "Max absolute residual", value: metrics.maxAbsResidual },
    { id: "normalizedCrossCorrelation", label: "Normalized cross-correlation", value: metrics.normalizedCrossCorrelation },
    { id: "peakPositionErrorM", label: "Peak position error", value: metrics.peakPositionErrorM ?? Number.NaN, unit: "m" },
    { id: "centroidErrorM", label: "Centroid error", value: metrics.centroidErrorM ?? Number.NaN, unit: "m" },
    { id: "fwhmErrorM", label: "FWHM error", value: metrics.fwhmErrorM ?? Number.NaN, unit: "m" },
    { id: "firstMinimumErrorM", label: "First minimum error", value: metrics.firstMinimumErrorM ?? Number.NaN, unit: "m" },
    { id: "visibilityError", label: "Visibility error", value: metrics.visibilityError ?? Number.NaN },
    { id: "areaNormalizationRatio", label: "Area normalization ratio", value: metrics.areaNormalizationRatio ?? Number.NaN }
  ];
}

function measuredComparisonWarnings(comparison: L67MeasuredComparisonResult, fit?: L67DiagnosticFitResult): SolverWarning[] {
  const seen = new Set<string>();
  const output: SolverWarning[] = [];
  for (const warning of [...comparison.warnings, ...(fit?.warnings ?? [])]) {
    const key = `${warning.code}:${warning.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(warning);
  }
  return output;
}

function splitCsvLine(line: string): string[] {
  const output: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"") {
      quoted = !quoted;
      continue;
    }
    if (!quoted && (char === "," || char === "\t" || char === ";")) {
      output.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  output.push(current.trim());
  return output;
}

function findColumn(header: string[], candidates: string[]): number {
  const normalized = header.map((cell) => normalizeColumn(cell));
  for (const candidate of candidates.map(normalizeColumn)) {
    const index = normalized.indexOf(candidate);
    if (index >= 0) return index;
  }
  return -1;
}

function normalizeColumn(value: string): string {
  return value.trim().toLowerCase().replaceAll(" ", "_").replaceAll("-", "_");
}

function inferPositionUnit(header: string, fallback?: L67MeasuredCalibration["positionUnit"]): L67MeasuredCalibration["positionUnit"] {
  const normalized = normalizeColumn(header);
  if (normalized.includes("_um") || normalized.includes("micron")) return "um";
  if (normalized.includes("_mm")) return "mm";
  if (normalized.includes("_px") || normalized.includes("pixel")) return "px";
  if (normalized.includes("_m")) return "m";
  return fallback ?? "m";
}

function unitToMeters(value: number, calibration: L67MeasuredCalibration): number {
  if (calibration.positionUnit === "m") return value;
  if (calibration.positionUnit === "mm") return value * 1e-3;
  if (calibration.positionUnit === "um") return value * 1e-6;
  return value * (calibration.pixelSizeM ?? 1);
}

function measuredPixelsFromArray(widthPx: number, heightPx: number, data: ArrayLike<number>, channels: "grayscale" | "rgb" | "rgba"): MeasuredImagePixels2D {
  if (!Number.isInteger(widthPx) || !Number.isInteger(heightPx) || widthPx <= 0 || heightPx <= 0) throw new Error("measured image dimensions must be positive integers");
  if (channels === "grayscale") {
    if (data.length !== widthPx * heightPx) throw new Error("grayscale image data length does not match dimensions");
    return { widthPx, heightPx, channels: "grayscale", data: Float32Array.from(Array.from(data, clamp01)) };
  }
  const stride = channels === "rgb" ? 3 : 4;
  if (data.length !== widthPx * heightPx * stride) throw new Error(`${channels} image data length does not match dimensions`);
  const output = new Float32Array(widthPx * heightPx);
  for (let pixel = 0; pixel < widthPx * heightPx; pixel += 1) {
    const offset = pixel * stride;
    output[pixel] = clamp01(0.2126 * (data[offset] ?? 0) + 0.7152 * (data[offset + 1] ?? 0) + 0.0722 * (data[offset + 2] ?? 0));
  }
  return { widthPx, heightPx, channels: "grayscale", data: output };
}

function grayscaleAt(pixels: MeasuredImagePixels2D, x: number, y: number): number {
  if (pixels.channels === "grayscale") return pixels.data[y * pixels.widthPx + x] ?? 0;
  const index = (y * pixels.widthPx + x) * 3;
  return 0.2126 * (pixels.data[index] ?? 0) + 0.7152 * (pixels.data[index + 1] ?? 0) + 0.0722 * (pixels.data[index + 2] ?? 0);
}

function comparisonForHash(comparison: Omit<L67MeasuredComparisonResult, "resultHash">): unknown {
  return {
    schema: comparison.schema,
    id: comparison.id,
    measuredHash: comparison.measured.measuredDataHash,
    simulatedHash: comparison.simulated.resultHash,
    alignment: comparison.alignment,
    metrics: quantizeObject(comparison.metrics),
    residualProfile: comparison.residualProfile.map((point) => ({
      xM: quantize(point.xM),
      measured: quantize(point.measured),
      simulated: quantize(point.simulated),
      residual: quantize(point.residual)
    }))
  };
}

function fitForHash(fit: Omit<L67DiagnosticFitResult, "resultHash">): unknown {
  return {
    schema: fit.schema,
    id: fit.id,
    comparisonId: fit.comparisonId,
    settings: fit.settings,
    best: quantizeObject(fit.best),
    evaluatedCount: fit.evaluatedCount,
    improvement: quantizeObject(fit.improvement)
  };
}

function measuredDatasetForHash(dataset: Omit<L67MeasuredDataset, "measuredDataHash">): unknown {
  return {
    schema: dataset.schema,
    id: dataset.id,
    kind: dataset.kind,
    sourceName: dataset.sourceName,
    imageHash: dataset.imageHash,
    dimensions: dataset.dimensions,
    calibration: dataset.calibration,
    profile: dataset.profile.map((point) => ({
      xM: quantize(point.xM),
      intensity: quantize(point.intensity),
      sourceIndex: point.sourceIndex
    })),
    metadata: dataset.metadata
  };
}

function quantizeObject<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, typeof item === "number" ? quantize(item) : item])) as T;
}

function quantize(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Number(value.toFixed(12));
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function csvEscape(value: unknown): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "n/a";
  return Math.abs(value) >= 1e-3 && Math.abs(value) < 1e4 ? value.toFixed(6) : value.toExponential(4);
}

function slugId(label: string): string {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug || "measured"}-${fnv1a64(label).slice(0, 8)}`;
}
