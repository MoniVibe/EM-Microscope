import { fnv1a64 } from "../scene/hashScene";
import type { ImageCalibration2D, MeasuredImage2D } from "../scene/schema";

export type MeasuredImagePixels2D = {
  widthPx: number;
  heightPx: number;
  channels: "grayscale" | "rgb";
  data: Float32Array;
};

export type MeasuredImageHistogram2D = {
  bins: number[];
  binCount: number;
  min: number;
  max: number;
  mean: number;
  saturatedLowCount: number;
  saturatedHighCount: number;
};

export function hashMeasuredImagePixels2D(image: MeasuredImagePixels2D): string {
  validateMeasuredImagePixels2D(image);
  const parts: string[] = [`${image.widthPx}x${image.heightPx}:${image.channels}:`];
  for (let index = 0; index < image.data.length; index += 1) {
    const value = image.data[index] ?? 0;
    const quantized = Math.round(clamp01(Number.isFinite(value) ? value : 0) * 65535);
    parts.push(quantized.toString(16), ",");
  }
  return fnv1a64(parts.join(""));
}

export function createMeasuredImage2D({
  id,
  label,
  pixels,
  importedAtIso,
  pixelDataPolicy = "external-session",
  calibration,
  previewDataUrl,
  source = "user-import"
}: {
  id: string;
  label: string;
  pixels: MeasuredImagePixels2D;
  importedAtIso: string;
  pixelDataPolicy?: MeasuredImage2D["pixelDataPolicy"];
  calibration?: ImageCalibration2D;
  previewDataUrl?: string;
  source?: MeasuredImage2D["provenance"]["source"];
}): MeasuredImage2D {
  validateMeasuredImagePixels2D(pixels);
  return {
    id,
    label,
    widthPx: pixels.widthPx,
    heightPx: pixels.heightPx,
    channels: pixels.channels,
    pixelDataPolicy,
    imageHash: hashMeasuredImagePixels2D(pixels),
    importedAtIso,
    calibration,
    previewDataUrl,
    provenance: {
      kind: "measured",
      source,
      dimensionality: "2d",
      approximation: ["decoded to normalized floating-point image samples"]
    }
  };
}

export function measuredImageHistogram2D(image: MeasuredImagePixels2D, binCount = 64): MeasuredImageHistogram2D {
  validateMeasuredImagePixels2D(image);
  const bins = new Array(Math.max(2, Math.min(256, Math.round(binCount)))).fill(0);
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let sum = 0;
  let saturatedLowCount = 0;
  let saturatedHighCount = 0;
  const sampleCount = image.widthPx * image.heightPx;
  const stride = image.channels === "rgb" ? 3 : 1;

  for (let pixelIndex = 0; pixelIndex < sampleCount; pixelIndex += 1) {
    const value = grayscaleValueAt(image.data, pixelIndex, stride);
    min = Math.min(min, value);
    max = Math.max(max, value);
    sum += value;
    if (value <= 0) saturatedLowCount += 1;
    if (value >= 1) saturatedHighCount += 1;
    const binIndex = Math.min(bins.length - 1, Math.max(0, Math.floor(clamp01(value) * bins.length)));
    bins[binIndex] = (bins[binIndex] ?? 0) + 1;
  }

  return {
    bins,
    binCount: bins.length,
    min: sampleCount > 0 ? min : 0,
    max: sampleCount > 0 ? max : 0,
    mean: sampleCount > 0 ? sum / sampleCount : 0,
    saturatedLowCount,
    saturatedHighCount
  };
}

export function validateMeasuredImagePixels2D(image: MeasuredImagePixels2D): void {
  if (!Number.isInteger(image.widthPx) || image.widthPx <= 0 || !Number.isInteger(image.heightPx) || image.heightPx <= 0) {
    throw new Error("measured image dimensions must be positive integers");
  }
  const expectedLength = image.widthPx * image.heightPx * (image.channels === "rgb" ? 3 : 1);
  if (image.data.length !== expectedLength) {
    throw new Error(`measured image data length ${image.data.length} does not match expected ${expectedLength}`);
  }
}

export function grayscaleMeasuredPixels2D(widthPx: number, heightPx: number, data: ArrayLike<number>): MeasuredImagePixels2D {
  const expectedLength = widthPx * heightPx;
  if (data.length !== expectedLength) {
    throw new Error(`grayscale measured image data length ${data.length} does not match expected ${expectedLength}`);
  }
  const output = new Float32Array(expectedLength);
  for (let index = 0; index < expectedLength; index += 1) {
    output[index] = clamp01(data[index] ?? 0);
  }
  return {
    widthPx,
    heightPx,
    channels: "grayscale",
    data: output
  };
}

function grayscaleValueAt(data: Float32Array, pixelIndex: number, stride: number): number {
  if (stride === 1) return clamp01(data[pixelIndex] ?? 0);
  const offset = pixelIndex * 3;
  return clamp01(0.2126 * (data[offset] ?? 0) + 0.7152 * (data[offset + 1] ?? 0) + 0.0722 * (data[offset + 2] ?? 0));
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
