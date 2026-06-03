import type { MeasuredImage2D, MeasurementRoi2D } from "../scene/schema";
import { michelsonContrast } from "../metrics/targetContrast2d";
import { measuredImageCalibrationWarnings2D } from "./imageCalibration2d";
import type { MeasuredImagePixels2D } from "./measuredImage2d";
import { extractMeasurementRoi2D, measurementRoiWarnings2D, type ExtractedRoiPixels2D } from "./roi2d";

export type PsfSpotMetrics2D = {
  centroidXPx: number;
  centroidYPx: number;
  peak: number;
  background: number;
  fwhmXPx: number | null;
  fwhmYPx: number | null;
  asymmetry: number | null;
  edgeEnergyFraction: number;
};

export type FlatDarkMetrics2D = {
  mean: number;
  variance: number;
  noiseRms: number;
  hotPixelFraction: number;
  nonuniformity: number | null;
};

export type SlantedEdgeStyleSfr2D = {
  edgeContrast: number | null;
  sfr50CyclesPerPx: number | null;
  binCount: number;
};

export type MeasuredRoiMetrics2D = {
  roiId: string;
  roiLabel: string;
  roiType: MeasurementRoi2D["type"];
  widthPx: number;
  heightPx: number;
  min: number;
  max: number;
  mean: number;
  variance: number;
  dynamicRange: number;
  contrastMichelson: number | null;
  slantedEdgeSfr: SlantedEdgeStyleSfr2D | null;
  psf: PsfSpotMetrics2D | null;
  flatDark: FlatDarkMetrics2D;
  warnings: string[];
  provenanceLabel: "measured-vs-simulated workbench metrics; not certified ISO 12233, EMVA 1288, clinical, or hardware calibration";
};

export function computeMeasuredRoiMetrics2D({
  image,
  pixels,
  roi
}: {
  image: MeasuredImage2D;
  pixels: MeasuredImagePixels2D;
  roi: MeasurementRoi2D;
}): MeasuredRoiMetrics2D {
  const crop = extractMeasurementRoi2D(pixels, roi);
  return computeRoiMetrics2D({
    crop,
    roi,
    warnings: [...measurementRoiWarnings2D(roi, image), ...measuredImageCalibrationWarnings2D(image)]
  });
}

export function computeRoiMetrics2D({
  crop,
  roi,
  warnings = []
}: {
  crop: ExtractedRoiPixels2D;
  roi: Pick<MeasurementRoi2D, "id" | "label" | "type" | "rotationRad">;
  warnings?: string[];
}): MeasuredRoiMetrics2D {
  const stats = summarizeSamples(crop.data);
  const dynamicWarnings = metricWarnings(crop, stats);
  const contrastMichelson = roi.type === "linePairs" || roi.type === "usafStyleBars" || roi.type === "freeformRect" ? michelsonContrast(crop.data) : null;
  const slantedEdgeSfr = roi.type === "slantedEdge" ? computeSlantedEdgeStyleSfr2D(crop, roi.rotationRad ?? (5 * Math.PI) / 180) : null;
  const psf = roi.type === "psfSpot" ? computePsfSpotMetrics2D(crop) : null;
  const flatDark = computeFlatDarkMetrics2D(crop);

  return {
    roiId: roi.id,
    roiLabel: roi.label,
    roiType: roi.type,
    widthPx: crop.widthPx,
    heightPx: crop.heightPx,
    min: stats.min,
    max: stats.max,
    mean: stats.mean,
    variance: stats.variance,
    dynamicRange: stats.max - stats.min,
    contrastMichelson,
    slantedEdgeSfr,
    psf,
    flatDark,
    warnings: uniqueStrings([...warnings, ...dynamicWarnings, ...(slantedEdgeSfr?.sfr50CyclesPerPx === null ? ["Slanted-edge-style SFR50 did not cross 0.5 in the sampled ROI."] : []), ...(psf?.edgeEnergyFraction && psf.edgeEnergyFraction > 0.08 ? ["PSF spot energy reaches ROI edges; enlarge or recenter the ROI."] : [])]),
    provenanceLabel: "measured-vs-simulated workbench metrics; not certified ISO 12233, EMVA 1288, clinical, or hardware calibration"
  };
}

export function computeSlantedEdgeStyleSfr2D(crop: ExtractedRoiPixels2D, angleRad: number, binCount = 256): SlantedEdgeStyleSfr2D {
  const bins = Math.max(32, Math.min(512, Math.round(binCount)));
  const samples: { sPx: number; value: number }[] = [];
  const centerX = crop.widthPx / 2;
  const centerY = crop.heightPx / 2;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  for (let y = 0; y < crop.heightPx; y += 1) {
    for (let x = 0; x < crop.widthPx; x += 1) {
      samples.push({
        sPx: (x - centerX) * cos + (y - centerY) * sin,
        value: crop.data[y * crop.widthPx + x] ?? 0
      });
    }
  }
  samples.sort((a, b) => a.sPx - b.sPx);
  const minS = samples[0]?.sPx ?? 0;
  const maxS = samples[samples.length - 1]?.sPx ?? minS;
  const spanPx = maxS - minS;
  if (samples.length < bins || spanPx <= 0) {
    return { edgeContrast: null, sfr50CyclesPerPx: null, binCount: bins };
  }

  const sums = new Float64Array(bins);
  const counts = new Uint32Array(bins);
  for (const sample of samples) {
    const index = Math.min(bins - 1, Math.max(0, Math.floor(((sample.sPx - minS) / spanPx) * bins)));
    sums[index] = (sums[index] ?? 0) + sample.value;
    counts[index] = (counts[index] ?? 0) + 1;
  }

  const esf = new Float64Array(bins);
  let last = 0;
  for (let index = 0; index < bins; index += 1) {
    if ((counts[index] ?? 0) > 0) {
      last = (sums[index] ?? 0) / (counts[index] ?? 1);
    }
    esf[index] = last;
  }

  const edgeContrast = michelsonContrast(esf, 0.1, 0.9);
  const lsf = new Float64Array(Math.max(1, bins - 1));
  for (let index = 0; index < lsf.length; index += 1) {
    lsf[index] = Math.abs((esf[index + 1] ?? 0) - (esf[index] ?? 0));
  }

  const dft = dftMagnitude(lsf);
  const reference = Math.max(...Array.from(dft.slice(1)), 0);
  if (reference <= 0) {
    return { edgeContrast, sfr50CyclesPerPx: null, binCount: bins };
  }

  const binSpacingPx = spanPx / bins;
  let sfr50CyclesPerPx: number | null = null;
  for (let index = 1; index < dft.length; index += 1) {
    const normalized = (dft[index] ?? 0) / reference;
    if (normalized <= 0.5) {
      sfr50CyclesPerPx = index / (lsf.length * binSpacingPx);
      break;
    }
  }
  return { edgeContrast, sfr50CyclesPerPx, binCount: bins };
}

export function computePsfSpotMetrics2D(crop: ExtractedRoiPixels2D): PsfSpotMetrics2D {
  const stats = summarizeSamples(crop.data);
  let peakIndex = 0;
  let peak = Number.NEGATIVE_INFINITY;
  for (let index = 0; index < crop.data.length; index += 1) {
    const value = crop.data[index] ?? 0;
    if (value > peak) {
      peak = value;
      peakIndex = index;
    }
  }

  const background = percentile(Array.from(crop.data), 0.1);
  let weightSum = 0;
  let xWeighted = 0;
  let yWeighted = 0;
  for (let y = 0; y < crop.heightPx; y += 1) {
    for (let x = 0; x < crop.widthPx; x += 1) {
      const value = Math.max(0, (crop.data[y * crop.widthPx + x] ?? 0) - background);
      weightSum += value;
      xWeighted += value * x;
      yWeighted += value * y;
    }
  }

  const centroidXPx = weightSum > 0 ? xWeighted / weightSum : peakIndex % crop.widthPx;
  const centroidYPx = weightSum > 0 ? yWeighted / weightSum : Math.floor(peakIndex / crop.widthPx);
  const peakX = peakIndex % crop.widthPx;
  const peakY = Math.floor(peakIndex / crop.widthPx);
  const row = new Float64Array(crop.widthPx);
  const column = new Float64Array(crop.heightPx);
  for (let x = 0; x < crop.widthPx; x += 1) row[x] = crop.data[peakY * crop.widthPx + x] ?? 0;
  for (let y = 0; y < crop.heightPx; y += 1) column[y] = crop.data[y * crop.widthPx + peakX] ?? 0;
  const fwhmXPx = fullWidthHalfMaxPx(row, peakX, background);
  const fwhmYPx = fullWidthHalfMaxPx(column, peakY, background);
  const edgeEnergyFraction = edgeEnergy(crop, background);

  return {
    centroidXPx,
    centroidYPx,
    peak,
    background,
    fwhmXPx,
    fwhmYPx,
    asymmetry: fwhmXPx !== null && fwhmYPx !== null && Math.max(fwhmXPx, fwhmYPx) > 0 ? Math.abs(fwhmXPx - fwhmYPx) / Math.max(fwhmXPx, fwhmYPx) : null,
    edgeEnergyFraction: Number.isFinite(stats.mean) ? edgeEnergyFraction : 0
  };
}

export function computeFlatDarkMetrics2D(crop: ExtractedRoiPixels2D): FlatDarkMetrics2D {
  const stats = summarizeSamples(crop.data);
  const sigma = Math.sqrt(stats.variance);
  let hot = 0;
  const hotThreshold = stats.mean + 6 * sigma;
  for (const value of crop.data) {
    if (value > hotThreshold && value > 0.95) hot += 1;
  }
  return {
    mean: stats.mean,
    variance: stats.variance,
    noiseRms: sigma,
    hotPixelFraction: crop.data.length > 0 ? hot / crop.data.length : 0,
    nonuniformity: stats.mean > 0 ? (stats.max - stats.min) / stats.mean : null
  };
}

function summarizeSamples(values: Float32Array): { min: number; max: number; mean: number; variance: number } {
  if (values.length === 0) return { min: 0, max: 0, mean: 0, variance: 0 };
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let sum = 0;
  for (const value of values) {
    min = Math.min(min, value);
    max = Math.max(max, value);
    sum += value;
  }
  const mean = sum / values.length;
  let varianceSum = 0;
  for (const value of values) varianceSum += (value - mean) ** 2;
  return { min, max, mean, variance: varianceSum / values.length };
}

function metricWarnings(crop: ExtractedRoiPixels2D, stats: { min: number; max: number; mean: number; variance: number }): string[] {
  const warnings: string[] = [];
  let saturatedLow = 0;
  let saturatedHigh = 0;
  for (const value of crop.data) {
    if (value <= 0.001) saturatedLow += 1;
    if (value >= 0.999) saturatedHigh += 1;
  }
  const count = Math.max(1, crop.data.length);
  if (saturatedLow / count > 0.01 || saturatedHigh / count > 0.01) {
    warnings.push("Measured ROI has saturated or clipped pixels.");
  }
  if (stats.max - stats.min < 0.03) {
    warnings.push("Measured ROI has low dynamic range for robust target metrics.");
  }
  if (crop.widthPx < 16 || crop.heightPx < 16) {
    warnings.push("Measured ROI is small; metrics may be unstable.");
  }
  return warnings;
}

function fullWidthHalfMaxPx(values: Float64Array, peakIndex: number, background: number): number | null {
  const peak = values[peakIndex] ?? 0;
  const half = background + Math.max(0, peak - background) * 0.5;
  const left = crossing(values, peakIndex, -1, half);
  const right = crossing(values, peakIndex, 1, half);
  if (left === null || right === null) return null;
  return Math.abs(right - left);
}

function crossing(values: Float64Array, start: number, direction: -1 | 1, threshold: number): number | null {
  for (let index = start; index >= 0 && index < values.length; index += direction) {
    const current = values[index] ?? 0;
    const next = values[index + direction];
    if (next === undefined) continue;
    if (next <= threshold) {
      const span = current - next;
      const t = span > 0 ? (current - threshold) / span : 0;
      return index + direction * t;
    }
  }
  return null;
}

function edgeEnergy(crop: ExtractedRoiPixels2D, background: number): number {
  let edge = 0;
  let total = 0;
  for (let y = 0; y < crop.heightPx; y += 1) {
    for (let x = 0; x < crop.widthPx; x += 1) {
      const value = Math.max(0, (crop.data[y * crop.widthPx + x] ?? 0) - background);
      total += value;
      if (x === 0 || y === 0 || x === crop.widthPx - 1 || y === crop.heightPx - 1) edge += value;
    }
  }
  return total > 0 ? edge / total : 0;
}

function dftMagnitude(values: Float64Array): Float64Array {
  const limit = Math.floor(values.length / 2);
  const output = new Float64Array(limit);
  for (let k = 0; k < limit; k += 1) {
    let real = 0;
    let imag = 0;
    for (let n = 0; n < values.length; n += 1) {
      const phase = (-2 * Math.PI * k * n) / values.length;
      const value = values[n] ?? 0;
      real += value * Math.cos(phase);
      imag += value * Math.sin(phase);
    }
    output[k] = Math.hypot(real, imag);
  }
  return output;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  values.sort((a, b) => a - b);
  const index = Math.min(values.length - 1, Math.max(0, Math.round(p * (values.length - 1))));
  return values[index] ?? 0;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}
