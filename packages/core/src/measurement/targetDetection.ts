import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import type { L72GeometricTarget, L72GeometryPoint, L72PointSet } from "./geometricCalibration";

export type L73DetectorKind = "dot-grid" | "checkerboard-scaffold";
export type L73ThresholdMode = "auto" | "manual";
export type L73DotPolarity = "auto" | "dark-on-light" | "light-on-dark";
export type L73DetectedPointStatus = "accepted" | "rejected";
export type L73DetectedPointSource = "detected" | "manual";

export type L73TargetImage = {
  widthPx: number;
  heightPx: number;
  pixels: number[];
  imageHash: string;
  sourceName?: string;
};

export type L73ImageRoi = {
  xPx: number;
  yPx: number;
  widthPx: number;
  heightPx: number;
};

export type L73DetectionSettings = {
  detector: L73DetectorKind;
  expectedRows: number;
  expectedColumns: number;
  spacingUm: number;
  thresholdMode: L73ThresholdMode;
  threshold: number;
  polarity: L73DotPolarity;
  minBlobAreaPx: number;
  maxBlobAreaPx: number;
  maxMissingPoints: number;
  outlierResidualWarnPx: number;
  subpixelWindowPx: number;
};

export type L73DetectedPoint = L72GeometryPoint & {
  status: L73DetectedPointStatus;
  source: L73DetectedPointSource;
  areaPx: number;
  confidence: number;
  gridResidualPx: number | null;
  reason?: string;
  originalXPx?: number;
  originalYPx?: number;
};

export type L73ManualEdit =
  | { type: "move"; id: string; xPx: number; yPx: number }
  | { type: "reject"; id: string; reason?: string }
  | { type: "accept"; id: string }
  | { type: "delete"; id: string }
  | { type: "add"; id?: string; row: number; col: number; xPx: number; yPx: number }
  | { type: "relabel"; id: string; row: number; col: number };

export type L73DetectionResult = {
  schema: "emmicro.l73.targetDetection.v1";
  appVersion: "L7.3 Measured Target Detection and ROI Hardening";
  id: string;
  label: string;
  imageHash: string;
  roi: L73ImageRoi;
  settings: L73DetectionSettings;
  thresholdUsed: number;
  polarityUsed: Exclude<L73DotPolarity, "auto">;
  expectedPointCount: number;
  detectedPointCount: number;
  acceptedPointCount: number;
  rejectedPointCount: number;
  coverageScore: number;
  gridMatchRmsPx: number | null;
  fitRmsPx: number | null;
  fitMaxPx: number | null;
  points: L73DetectedPoint[];
  rejectedPoints: L73DetectedPoint[];
  manualEdits: L73ManualEdit[];
  warnings: SolverWarning[];
  limitations: string[];
  resultHash: string;
};

export const l73DetectionLimitations = [
  "L7.3 measured-target detection is diagnostic single-image 2D grid-point extraction only; it is not certified camera calibration, ISO/Imatest-equivalent calibration, or lab-accredited metrology.",
  "Dot-grid detection, ROI handling, and manual point correction feed L7.2 diagnostic geometry fits; they are not full multi-view bundle adjustment, 3D pose calibration, stereo calibration, AprilTag/ArUco fiducial support, or a microscope digital twin.",
  "The workbench does not execute hardware control, full 3D Maxwell, FDTD, FEM, BEM, RCWA, pixel-level sensor-stack EM, manufacturing calibration, or certification workflows."
] as const;

export function defaultL73DetectionSettings(input: Partial<L73DetectionSettings> = {}): L73DetectionSettings {
  return {
    detector: input.detector ?? "dot-grid",
    expectedRows: integerInRange(input.expectedRows ?? 7, 2, 80),
    expectedColumns: integerInRange(input.expectedColumns ?? 9, 2, 80),
    spacingUm: Math.max(0.001, finite(input.spacingUm ?? 50, 50)),
    thresholdMode: input.thresholdMode ?? "auto",
    threshold: clamp(finite(input.threshold ?? 0.5, 0.5), 0, 1),
    polarity: input.polarity ?? "auto",
    minBlobAreaPx: Math.max(1, finite(input.minBlobAreaPx ?? 6, 6)),
    maxBlobAreaPx: Math.max(1, finite(input.maxBlobAreaPx ?? 240, 240)),
    maxMissingPoints: integerInRange(input.maxMissingPoints ?? 2, 0, 500),
    outlierResidualWarnPx: Math.max(0.1, finite(input.outlierResidualWarnPx ?? 8, 8)),
    subpixelWindowPx: Math.max(1, finite(input.subpixelWindowPx ?? 3, 3))
  };
}

export function targetImageFromGeometricTarget(target: L72GeometricTarget, sourceName = "generated-l72-target"): L73TargetImage {
  return normalizeTargetImage({
    widthPx: target.image.widthPx,
    heightPx: target.image.heightPx,
    pixels: target.image.pixels,
    sourceName
  });
}

export function normalizeTargetImage(input: { widthPx: number; heightPx: number; pixels: number[]; sourceName?: string }): L73TargetImage {
  const widthPx = integerInRange(input.widthPx, 1, 8192);
  const heightPx = integerInRange(input.heightPx, 1, 8192);
  const expected = widthPx * heightPx;
  const pixels = input.pixels.slice(0, expected).map((value) => clamp(finite(value, 0), 0, 1));
  while (pixels.length < expected) pixels.push(0);
  const imageHash = fnv1a64(stableStringify({ widthPx, heightPx, sample: sampleForHash(pixels) }));
  return { widthPx, heightPx, pixels, imageHash, sourceName: input.sourceName };
}

export function defaultL73Roi(image: Pick<L73TargetImage, "widthPx" | "heightPx">, marginFraction = 0.08): L73ImageRoi {
  const marginX = Math.round(image.widthPx * clamp(marginFraction, 0, 0.45));
  const marginY = Math.round(image.heightPx * clamp(marginFraction, 0, 0.45));
  return clampRoi({ xPx: marginX, yPx: marginY, widthPx: image.widthPx - marginX * 2, heightPx: image.heightPx - marginY * 2 }, image.widthPx, image.heightPx);
}

export function detectMeasuredTargetPoints({
  id = "l73-target-detection",
  label = "L7.3 measured target dot-grid detection",
  image,
  roi,
  settings = defaultL73DetectionSettings()
}: {
  id?: string;
  label?: string;
  image: L73TargetImage;
  roi?: Partial<L73ImageRoi>;
  settings?: Partial<L73DetectionSettings>;
}): L73DetectionResult {
  const normalizedImage = normalizeTargetImage(image);
  const normalizedSettings = defaultL73DetectionSettings(settings);
  const normalizedRoi = clampRoi({ ...defaultL73Roi(normalizedImage, 0), ...roi }, normalizedImage.widthPx, normalizedImage.heightPx);
  const warnings = imageWarnings(normalizedImage, normalizedRoi);
  if (normalizedSettings.detector !== "dot-grid") {
    warnings.push({ code: "l73.detector.checkerboardScaffold", message: "Checkerboard automatic detection is scaffold-only in L7.3; dot-grid detection is the executable path." });
  }
  const thresholdUsed = normalizedSettings.thresholdMode === "manual" ? normalizedSettings.threshold : otsuThreshold(normalizedImage, normalizedRoi);
  const polarityUsed = choosePolarity(normalizedImage, normalizedRoi, normalizedSettings, thresholdUsed);
  const components = connectedComponents(normalizedImage, normalizedRoi, normalizedSettings, thresholdUsed, polarityUsed);
  const matched = matchComponentsToGrid(components, normalizedSettings);
  warnings.push(...matched.warnings);
  return finalizeDetection({
    id,
    label,
    imageHash: normalizedImage.imageHash,
    roi: normalizedRoi,
    settings: normalizedSettings,
    thresholdUsed,
    polarityUsed,
    points: matched.points,
    manualEdits: [],
    warnings
  });
}

export function applyDetectionManualEdits(result: L73DetectionResult, edits: L73ManualEdit[]): L73DetectionResult {
  const points = [...result.points, ...result.rejectedPoints].map((point) => ({ ...point }));
  const byId = new Map(points.map((point) => [point.id, point]));
  const warnings: SolverWarning[] = result.warnings.filter((warning) => !warning.code.startsWith("l73.manual."));
  for (const edit of edits) {
    if (edit.type === "add") {
      const id = edit.id ?? `manual-${edit.row}-${edit.col}-${points.length}`;
      const point = {
        id,
        row: edit.row,
        col: edit.col,
        xPx: round(edit.xPx),
        yPx: round(edit.yPx),
        xWorldUm: worldX(edit.col, result.settings),
        yWorldUm: worldY(edit.row, result.settings),
        status: "accepted" as const,
        source: "manual" as const,
        areaPx: 0,
        confidence: 1,
        gridResidualPx: null
      };
      points.push(point);
      byId.set(id, point);
      continue;
    }
    const point = byId.get(edit.id);
    if (!point) {
      warnings.push({ code: "l73.manual.missingPoint", message: `Manual edit referenced missing point '${edit.id}'.` });
      continue;
    }
    if (edit.type === "move") {
      point.originalXPx ??= point.xPx;
      point.originalYPx ??= point.yPx;
      point.xPx = round(edit.xPx);
      point.yPx = round(edit.yPx);
      point.source = "manual";
      point.status = "accepted";
      point.reason = undefined;
      point.gridResidualPx = null;
    } else if (edit.type === "reject") {
      point.status = "rejected";
      point.reason = edit.reason ?? "manual rejection";
      point.source = point.source === "manual" ? "manual" : "detected";
    } else if (edit.type === "accept") {
      point.status = "accepted";
      point.reason = undefined;
    } else if (edit.type === "delete") {
      const index = points.findIndex((candidate) => candidate.id === edit.id);
      if (index >= 0) points.splice(index, 1);
      byId.delete(edit.id);
    } else if (edit.type === "relabel") {
      point.row = edit.row;
      point.col = edit.col;
      point.xWorldUm = worldX(edit.col, result.settings);
      point.yWorldUm = worldY(edit.row, result.settings);
      point.source = "manual";
      point.gridResidualPx = null;
    }
  }
  return finalizeDetection({
    id: result.id,
    label: result.label,
    imageHash: result.imageHash,
    roi: result.roi,
    settings: result.settings,
    thresholdUsed: result.thresholdUsed,
    polarityUsed: result.polarityUsed,
    points,
    manualEdits: [...result.manualEdits, ...edits],
    warnings
  });
}

export function pointSetFromDetection(result: L73DetectionResult): L72PointSet {
  return {
    schema: "emmicro.l72.pointSet.v1",
    id: `${result.id}-accepted-points`,
    label: `${result.label} accepted points`,
    points: result.points.filter((point) => point.status === "accepted").map(stripDetectionFields),
    sourceHash: result.resultHash,
    warnings: result.warnings,
    limitations: result.limitations
  };
}

export function attachGeometryFitMetricsToDetection(result: L73DetectionResult, fit: { metrics: { rmsResidualPx: number; maxResidualPx: number }; resultHash?: string }): L73DetectionResult {
  return finalizeDetection({
    id: result.id,
    label: result.label,
    imageHash: result.imageHash,
    roi: result.roi,
    settings: result.settings,
    thresholdUsed: result.thresholdUsed,
    polarityUsed: result.polarityUsed,
    points: [...result.points, ...result.rejectedPoints],
    manualEdits: result.manualEdits,
    warnings: result.warnings,
    fitRmsPx: fit.metrics.rmsResidualPx,
    fitMaxPx: fit.metrics.maxResidualPx
  });
}

export function detectedPointsCsv(result: L73DetectionResult): string {
  return detectionPointsCsv(result.points.filter((point) => point.status === "accepted"));
}

export function rejectedPointsCsv(result: L73DetectionResult): string {
  return detectionPointsCsv(result.rejectedPoints);
}

export function detectionReportJson(result: L73DetectionResult): string {
  return JSON.stringify({ result }, null, 2);
}

export function detectionReportMarkdown(result: L73DetectionResult): string {
  return [
    `# ${result.label}`,
    "",
    `App version: ${result.appVersion}`,
    `Result hash: ${result.resultHash}`,
    `Image hash: ${result.imageHash}`,
    `Detector: ${result.settings.detector}`,
    `Polarity: ${result.polarityUsed}`,
    `Threshold: ${result.thresholdUsed.toPrecision(5)}`,
    `ROI: x=${result.roi.xPx}, y=${result.roi.yPx}, w=${result.roi.widthPx}, h=${result.roi.heightPx}`,
    "",
    "## Confidence",
    `- Expected points: ${result.expectedPointCount}`,
    `- Detected points: ${result.detectedPointCount}`,
    `- Accepted points: ${result.acceptedPointCount}`,
    `- Rejected points: ${result.rejectedPointCount}`,
    `- Coverage score: ${result.coverageScore.toPrecision(4)}`,
    `- Grid match RMS: ${formatNullable(result.gridMatchRmsPx)} px`,
    `- Fit RMS: ${formatNullable(result.fitRmsPx)} px`,
    `- Fit max: ${formatNullable(result.fitMaxPx)} px`,
    "",
    "## Warnings",
    ...(result.warnings.length ? result.warnings.map((warning) => `- ${warning.message}`) : ["- none"]),
    "",
    "## Limitations",
    ...result.limitations.map((limitation) => `- ${limitation}`)
  ].join("\n");
}

type Component = {
  id: string;
  xPx: number;
  yPx: number;
  areaPx: number;
  confidence: number;
  meanValue: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

function connectedComponents(image: L73TargetImage, roi: L73ImageRoi, settings: L73DetectionSettings, threshold: number, polarity: Exclude<L73DotPolarity, "auto">): Component[] {
  const visited = new Uint8Array(image.widthPx * image.heightPx);
  const components: Component[] = [];
  const qualifies = (value: number) => polarity === "dark-on-light" ? value <= threshold : value >= threshold;
  const weightFor = (value: number) => polarity === "dark-on-light" ? Math.max(1e-6, threshold - value) : Math.max(1e-6, value - threshold);
  const x0 = roi.xPx;
  const y0 = roi.yPx;
  const x1 = roi.xPx + roi.widthPx;
  const y1 = roi.yPx + roi.heightPx;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const seedIndex = y * image.widthPx + x;
      if (visited[seedIndex]) continue;
      visited[seedIndex] = 1;
      if (!qualifies(image.pixels[seedIndex] ?? 0)) continue;
      const queue = [seedIndex];
      let head = 0;
      let area = 0;
      let weightSum = 0;
      let xSum = 0;
      let ySum = 0;
      let valueSum = 0;
      let minX = x;
      let minY = y;
      let maxX = x;
      let maxY = y;
      while (head < queue.length) {
        const index = queue[head++]!;
        const cx = index % image.widthPx;
        const cy = Math.floor(index / image.widthPx);
        const value = image.pixels[index] ?? 0;
        area += 1;
        valueSum += value;
        const weight = weightFor(value);
        weightSum += weight;
        xSum += cx * weight;
        ySum += cy * weight;
        minX = Math.min(minX, cx);
        minY = Math.min(minY, cy);
        maxX = Math.max(maxX, cx);
        maxY = Math.max(maxY, cy);
        const neighbors = [
          { x: cx - 1, y: cy },
          { x: cx + 1, y: cy },
          { x: cx, y: cy - 1 },
          { x: cx, y: cy + 1 }
        ];
        for (const neighbor of neighbors) {
          if (neighbor.x < x0 || neighbor.x >= x1 || neighbor.y < y0 || neighbor.y >= y1) continue;
          const next = neighbor.y * image.widthPx + neighbor.x;
          if (visited[next]) continue;
          visited[next] = 1;
          if (qualifies(image.pixels[next] ?? 0)) queue.push(next);
        }
      }
      if (area < settings.minBlobAreaPx || area > settings.maxBlobAreaPx) continue;
      const width = maxX - minX + 1;
      const height = maxY - minY + 1;
      const circularity = Math.min(width, height) / Math.max(1, Math.max(width, height));
      if (circularity < 0.35) continue;
      const confidence = clamp(circularity * Math.min(1, area / Math.max(1, settings.minBlobAreaPx)), 0, 1);
      components.push({
        id: `blob-${components.length}`,
        xPx: round(xSum / Math.max(1e-12, weightSum)),
        yPx: round(ySum / Math.max(1e-12, weightSum)),
        areaPx: area,
        confidence: round(confidence),
        meanValue: round(valueSum / area),
        minX,
        minY,
        maxX,
        maxY
      });
    }
  }
  return components.sort((a, b) => a.yPx - b.yPx || a.xPx - b.xPx);
}

function matchComponentsToGrid(components: Component[], settings: L73DetectionSettings): { points: L73DetectedPoint[]; warnings: SolverWarning[] } {
  const warnings: SolverWarning[] = [];
  const expected = settings.expectedRows * settings.expectedColumns;
  if (components.length === 0) {
    warnings.push({ code: "l73.detect.noBlobs", message: "No dot-grid blobs were detected in the selected ROI." });
    return { points: [], warnings };
  }
  if (components.length < expected - settings.maxMissingPoints) {
    warnings.push({ code: "l73.detect.missingPoints", message: `${Math.max(0, expected - components.length)} expected dot-grid points are missing before manual correction.` });
  }
  const axes = principalAxes(components, settings);
  const projected = components.map((component) => ({
    component,
    u: component.xPx * axes.u.x + component.yPx * axes.u.y,
    v: component.xPx * axes.v.x + component.yPx * axes.v.y
  }));
  const colCenters = cluster1d(projected.map((point) => point.u), settings.expectedColumns);
  const rowCenters = cluster1d(projected.map((point) => point.v), settings.expectedRows);
  const candidates = projected.map(({ component, u, v }) => {
    const col = nearestIndex(colCenters, u);
    const row = nearestIndex(rowCenters, v);
    const residual = Math.hypot(u - colCenters[col]!, v - rowCenters[row]!);
    return {
      ...component,
      row,
      col,
      residualPx: round(residual)
    };
  });
  const byCell = new Map<string, typeof candidates>();
  for (const candidate of candidates) {
    const key = `${candidate.row}:${candidate.col}`;
    byCell.set(key, [...(byCell.get(key) ?? []), candidate]);
  }
  const points: L73DetectedPoint[] = [];
  for (const entries of byCell.values()) {
    const sorted = [...entries].sort((a, b) => a.residualPx - b.residualPx);
    sorted.forEach((entry, index) => {
      const rejected = index > 0 || entry.residualPx > settings.outlierResidualWarnPx;
      points.push({
        id: `p-${entry.row}-${entry.col}${index > 0 ? `-dup-${index}` : ""}`,
        row: entry.row,
        col: entry.col,
        xPx: entry.xPx,
        yPx: entry.yPx,
        xWorldUm: worldX(entry.col, settings),
        yWorldUm: worldY(entry.row, settings),
        status: rejected ? "rejected" : "accepted",
        source: "detected",
        areaPx: entry.areaPx,
        confidence: entry.confidence,
        gridResidualPx: entry.residualPx,
        reason: index > 0 ? "duplicate grid cell" : entry.residualPx > settings.outlierResidualWarnPx ? "grid residual outlier" : undefined
      });
    });
  }
  const acceptedCells = new Set(points.filter((point) => point.status === "accepted").map((point) => `${point.row}:${point.col}`));
  if (acceptedCells.size < expected) warnings.push({ code: "l73.detect.gridCoverage", message: `${expected - acceptedCells.size} expected grid cells are missing after row/column assignment.` });
  if (points.some((point) => point.reason === "duplicate grid cell")) warnings.push({ code: "l73.detect.duplicateCells", message: "Multiple detected blobs mapped to the same grid cell; duplicates were rejected." });
  if (points.some((point) => point.reason === "grid residual outlier")) warnings.push({ code: "l73.detect.outliers", message: "Some detected blobs exceeded the grid residual threshold and were rejected." });
  return { points: points.sort((a, b) => (a.row ?? 0) - (b.row ?? 0) || (a.col ?? 0) - (b.col ?? 0)), warnings };
}

function finalizeDetection(input: {
  id: string;
  label: string;
  imageHash: string;
  roi: L73ImageRoi;
  settings: L73DetectionSettings;
  thresholdUsed: number;
  polarityUsed: Exclude<L73DotPolarity, "auto">;
  points: L73DetectedPoint[];
  manualEdits: L73ManualEdit[];
  warnings: SolverWarning[];
  fitRmsPx?: number | null;
  fitMaxPx?: number | null;
}): L73DetectionResult {
  const expectedPointCount = input.settings.expectedRows * input.settings.expectedColumns;
  const accepted = input.points.filter((point) => point.status === "accepted");
  const rejected = input.points.filter((point) => point.status === "rejected");
  const gridMatchRmsPx = rms(accepted.map((point) => point.gridResidualPx).filter((value): value is number => value !== null && Number.isFinite(value)));
  const warnings = dedupeWarnings([
    ...input.warnings,
    ...(accepted.length < expectedPointCount - input.settings.maxMissingPoints ? [{ code: "l73.detect.coverageWarning", message: `Accepted point coverage is ${(accepted.length / Math.max(1, expectedPointCount)).toPrecision(4)}; manual correction is recommended.` }] : [])
  ]);
  const partial = {
    schema: "emmicro.l73.targetDetection.v1" as const,
    appVersion: "L7.3 Measured Target Detection and ROI Hardening" as const,
    id: input.id,
    label: input.label,
    imageHash: input.imageHash,
    roi: input.roi,
    settings: input.settings,
    thresholdUsed: round(input.thresholdUsed),
    polarityUsed: input.polarityUsed,
    expectedPointCount,
    detectedPointCount: input.points.length,
    acceptedPointCount: accepted.length,
    rejectedPointCount: rejected.length,
    coverageScore: round(accepted.length / Math.max(1, expectedPointCount)),
    gridMatchRmsPx,
    fitRmsPx: input.fitRmsPx === undefined ? null : round(input.fitRmsPx ?? 0),
    fitMaxPx: input.fitMaxPx === undefined ? null : round(input.fitMaxPx ?? 0),
    points: accepted,
    rejectedPoints: rejected,
    manualEdits: input.manualEdits,
    warnings,
    limitations: [...l73DetectionLimitations]
  };
  return { ...partial, resultHash: fnv1a64(stableStringify(resultForHash(partial))) };
}

function choosePolarity(image: L73TargetImage, roi: L73ImageRoi, settings: L73DetectionSettings, threshold: number): Exclude<L73DotPolarity, "auto"> {
  if (settings.polarity === "dark-on-light" || settings.polarity === "light-on-dark") return settings.polarity;
  const darkCount = quickComponentCount(image, roi, settings, threshold, "dark-on-light");
  const lightCount = quickComponentCount(image, roi, settings, threshold, "light-on-dark");
  const expected = settings.expectedRows * settings.expectedColumns;
  return Math.abs(darkCount - expected) <= Math.abs(lightCount - expected) ? "dark-on-light" : "light-on-dark";
}

function quickComponentCount(image: L73TargetImage, roi: L73ImageRoi, settings: L73DetectionSettings, threshold: number, polarity: Exclude<L73DotPolarity, "auto">): number {
  return connectedComponents(image, roi, settings, threshold, polarity).length;
}

function imageWarnings(image: L73TargetImage, roi: L73ImageRoi): SolverWarning[] {
  const values = roiPixels(image, roi);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const warnings: SolverWarning[] = [];
  if (max - min < 0.08) warnings.push({ code: "l73.image.lowContrast", message: "Selected ROI has low contrast; dot detection may be unstable." });
  const saturated = values.filter((value) => value <= 0.01 || value >= 0.99).length / Math.max(1, values.length);
  if (saturated > 0.2) warnings.push({ code: "l73.image.saturation", message: "Selected ROI has many saturated pixels; centroid confidence may be reduced." });
  return warnings;
}

function otsuThreshold(image: L73TargetImage, roi: L73ImageRoi): number {
  const histogram = new Array<number>(256).fill(0);
  const values = roiPixels(image, roi);
  for (const value of values) histogram[Math.max(0, Math.min(255, Math.round(value * 255)))]! += 1;
  const total = values.length;
  let sum = 0;
  for (let i = 0; i < 256; i += 1) sum += i * histogram[i]!;
  let sumB = 0;
  let wB = 0;
  let best = 0;
  let bestVariance = -1;
  for (let i = 0; i < 256; i += 1) {
    wB += histogram[i]!;
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += i * histogram[i]!;
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const variance = wB * wF * (mB - mF) * (mB - mF);
    if (variance > bestVariance) {
      bestVariance = variance;
      best = i;
    }
  }
  return clamp((best + 0.5) / 255, 0.02, 0.98);
}

function principalAxes(points: Array<{ xPx: number; yPx: number }>, settings: L73DetectionSettings): { u: { x: number; y: number }; v: { x: number; y: number } } {
  if (settings.expectedRows === settings.expectedColumns) return { u: { x: 1, y: 0 }, v: { x: 0, y: 1 } };
  const meanX = points.reduce((sum, point) => sum + point.xPx, 0) / points.length;
  const meanY = points.reduce((sum, point) => sum + point.yPx, 0) / points.length;
  let xx = 0;
  let yy = 0;
  let xy = 0;
  for (const point of points) {
    const dx = point.xPx - meanX;
    const dy = point.yPx - meanY;
    xx += dx * dx;
    yy += dy * dy;
    xy += dx * dy;
  }
  let theta = 0.5 * Math.atan2(2 * xy, xx - yy);
  let u = { x: Math.cos(theta), y: Math.sin(theta) };
  if (u.x < 0) u = { x: -u.x, y: -u.y };
  let v = { x: -u.y, y: u.x };
  if (v.y < 0) v = { x: -v.x, y: -v.y };
  theta = Math.atan2(u.y, u.x);
  return { u: { x: Math.cos(theta), y: Math.sin(theta) }, v };
}

function cluster1d(values: number[], count: number): number[] {
  if (count <= 1) return [values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length)];
  const min = Math.min(...values);
  const max = Math.max(...values);
  let centers = Array.from({ length: count }, (_, index) => min + ((max - min) * index) / Math.max(1, count - 1));
  for (let iteration = 0; iteration < 12; iteration += 1) {
    const buckets = centers.map(() => [] as number[]);
    for (const value of values) buckets[nearestIndex(centers, value)]!.push(value);
    centers = centers.map((center, index) => {
      const bucket = buckets[index]!;
      return bucket.length ? bucket.reduce((sum, value) => sum + value, 0) / bucket.length : center;
    }).sort((a, b) => a - b);
  }
  return centers;
}

function nearestIndex(values: number[], value: number): number {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < values.length; index += 1) {
    const distance = Math.abs(value - values[index]!);
    if (distance < bestDistance) {
      best = index;
      bestDistance = distance;
    }
  }
  return best;
}

function roiPixels(image: L73TargetImage, roi: L73ImageRoi): number[] {
  const values: number[] = [];
  for (let y = roi.yPx; y < roi.yPx + roi.heightPx; y += 1) {
    for (let x = roi.xPx; x < roi.xPx + roi.widthPx; x += 1) values.push(image.pixels[y * image.widthPx + x] ?? 0);
  }
  return values;
}

function stripDetectionFields(point: L73DetectedPoint): L72GeometryPoint {
  return {
    id: point.id,
    row: point.row,
    col: point.col,
    xPx: point.xPx,
    yPx: point.yPx,
    xWorldUm: point.xWorldUm,
    yWorldUm: point.yWorldUm,
    idealXPx: point.idealXPx,
    idealYPx: point.idealYPx
  };
}

function detectionPointsCsv(points: L73DetectedPoint[]): string {
  return [
    "id,status,source,row,col,x_px,y_px,x_world_um,y_world_um,area_px,confidence,grid_residual_px,reason",
    ...points.map((point) => [
      point.id,
      point.status,
      point.source,
      point.row ?? "",
      point.col ?? "",
      point.xPx,
      point.yPx,
      point.xWorldUm ?? "",
      point.yWorldUm ?? "",
      point.areaPx,
      point.confidence,
      point.gridResidualPx ?? "",
      point.reason ?? ""
    ].map(csvEscape).join(","))
  ].join("\n");
}

function clampRoi(roi: Partial<L73ImageRoi>, widthPx: number, heightPx: number): L73ImageRoi {
  const xPx = integerInRange(roi.xPx ?? 0, 0, Math.max(0, widthPx - 1));
  const yPx = integerInRange(roi.yPx ?? 0, 0, Math.max(0, heightPx - 1));
  const width = integerInRange(roi.widthPx ?? widthPx - xPx, 1, Math.max(1, widthPx - xPx));
  const height = integerInRange(roi.heightPx ?? heightPx - yPx, 1, Math.max(1, heightPx - yPx));
  return { xPx, yPx, widthPx: width, heightPx: height };
}

function worldX(col: number, settings: L73DetectionSettings): number {
  return round(col * settings.spacingUm - ((settings.expectedColumns - 1) * settings.spacingUm) / 2);
}

function worldY(row: number, settings: L73DetectionSettings): number {
  return round(row * settings.spacingUm - ((settings.expectedRows - 1) * settings.spacingUm) / 2);
}

function rms(values: number[]): number | null {
  const finiteValues = values.filter(Number.isFinite);
  if (finiteValues.length === 0) return null;
  return round(Math.sqrt(finiteValues.reduce((sum, value) => sum + value * value, 0) / finiteValues.length));
}

function sampleForHash(values: number[]): number[] {
  const stride = Math.max(1, Math.floor(values.length / 128));
  const sample: number[] = [];
  for (let index = 0; index < values.length; index += stride) sample.push(round(values[index] ?? 0));
  return sample;
}

function resultForHash(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}

function dedupeWarnings(warnings: SolverWarning[]): SolverWarning[] {
  const seen = new Set<string>();
  const output: SolverWarning[] = [];
  for (const warning of warnings) {
    const key = `${warning.code}:${warning.elementId ?? ""}:${warning.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(warning);
  }
  return output;
}

function integerInRange(value: number, min: number, max: number): number {
  return Math.round(clamp(finite(value, min), min, max));
}

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Number.isFinite(value) ? Number(value.toPrecision(12)) : value;
}

function formatNullable(value: number | null): string {
  return value === null || !Number.isFinite(value) ? "n/a" : value.toPrecision(6);
}

function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
