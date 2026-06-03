import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { FieldOutput2D } from "../solvers/Solver";
import type { ExtractedRoiPixels2D } from "./roi2d";

export type ResidualMapMode2D = "signed" | "absolute" | "normalized";

export type ResidualMap2D = {
  width: number;
  height: number;
  values: Float32Array;
  mode: ResidualMapMode2D;
  min: number;
  max: number;
  meanAbs: number;
  rms: number;
  resultHash: string;
};

export function createResidualMap2D({
  measured,
  simulated,
  mode = "signed"
}: {
  measured: ExtractedRoiPixels2D;
  simulated: ExtractedRoiPixels2D;
  mode?: ResidualMapMode2D;
}): ResidualMap2D {
  if (measured.widthPx !== simulated.widthPx || measured.heightPx !== simulated.heightPx) {
    throw new Error("residual map inputs must share dimensions; resampling must be explicit before comparison");
  }
  const signed = new Float32Array(measured.data.length);
  let maxAbs = 0;
  for (let index = 0; index < signed.length; index += 1) {
    const value = (measured.data[index] ?? 0) - (simulated.data[index] ?? 0);
    signed[index] = value;
    maxAbs = Math.max(maxAbs, Math.abs(value));
  }

  const values = new Float32Array(signed.length);
  for (let index = 0; index < values.length; index += 1) {
    const value = signed[index] ?? 0;
    values[index] = mode === "absolute" ? Math.abs(value) : mode === "normalized" ? (maxAbs > 0 ? value / maxAbs : 0) : value;
  }
  const summary = summarize(values);
  const resultHash = fnv1a64(
    stableStringify({
      type: "residualMap2D",
      mode,
      width: measured.widthPx,
      height: measured.heightPx,
      values: Array.from(values, quantize)
    })
  );
  return {
    width: measured.widthPx,
    height: measured.heightPx,
    values,
    mode,
    min: summary.min,
    max: summary.max,
    meanAbs: summary.meanAbs,
    rms: summary.rms,
    resultHash
  };
}

export function resampleFieldToMeasuredPixels2D(field: FieldOutput2D, widthPx: number, heightPx: number): Float32Array {
  if (widthPx <= 0 || heightPx <= 0) {
    throw new Error("resampled measured dimensions must be positive");
  }
  const output = new Float32Array(widthPx * heightPx);
  const peak = maxValue(field.intensity);
  for (let y = 0; y < heightPx; y += 1) {
    const fieldY = ((y + 0.5) / heightPx) * field.height - 0.5;
    for (let x = 0; x < widthPx; x += 1) {
      const fieldX = ((x + 0.5) / widthPx) * field.width - 0.5;
      const raw = bilinear(field.intensity, field.width, field.height, fieldX, fieldY);
      output[y * widthPx + x] = peak > 0 ? Math.max(0, Math.min(1, raw / peak)) : 0;
    }
  }
  return output;
}

export function centralResidualCrossSection2D(measured: ExtractedRoiPixels2D, simulated: ExtractedRoiPixels2D): { measured: number[]; simulated: number[]; residual: number[] } {
  if (measured.widthPx !== simulated.widthPx || measured.heightPx !== simulated.heightPx) {
    throw new Error("cross-section inputs must share dimensions");
  }
  const row = Math.floor(measured.heightPx / 2);
  const measuredRow: number[] = [];
  const simulatedRow: number[] = [];
  const residualRow: number[] = [];
  for (let x = 0; x < measured.widthPx; x += 1) {
    const measuredValue = measured.data[row * measured.widthPx + x] ?? 0;
    const simulatedValue = simulated.data[row * simulated.widthPx + x] ?? 0;
    measuredRow.push(measuredValue);
    simulatedRow.push(simulatedValue);
    residualRow.push(measuredValue - simulatedValue);
  }
  return { measured: measuredRow, simulated: simulatedRow, residual: residualRow };
}

function summarize(values: Float32Array): { min: number; max: number; meanAbs: number; rms: number } {
  if (values.length === 0) return { min: 0, max: 0, meanAbs: 0, rms: 0 };
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let absSum = 0;
  let squareSum = 0;
  for (const value of values) {
    min = Math.min(min, value);
    max = Math.max(max, value);
    absSum += Math.abs(value);
    squareSum += value * value;
  }
  return {
    min,
    max,
    meanAbs: absSum / values.length,
    rms: Math.sqrt(squareSum / values.length)
  };
}

function bilinear(values: Float64Array, width: number, height: number, x: number, y: number): number {
  const x0 = Math.max(0, Math.min(width - 1, Math.floor(x)));
  const y0 = Math.max(0, Math.min(height - 1, Math.floor(y)));
  const x1 = Math.max(0, Math.min(width - 1, x0 + 1));
  const y1 = Math.max(0, Math.min(height - 1, y0 + 1));
  const tx = Math.max(0, Math.min(1, x - x0));
  const ty = Math.max(0, Math.min(1, y - y0));
  const a = values[y0 * width + x0] ?? 0;
  const b = values[y0 * width + x1] ?? a;
  const c = values[y1 * width + x0] ?? a;
  const d = values[y1 * width + x1] ?? c;
  return a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + d * tx * ty;
}

function maxValue(values: Float64Array): number {
  let max = 0;
  for (const value of values) max = Math.max(max, value);
  return max;
}

function quantize(value: number): number {
  return Number(value.toFixed(6));
}
