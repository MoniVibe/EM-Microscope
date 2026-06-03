import type { FieldOutput2D } from "../solvers/Solver";
import { makeComplexGrid2D } from "./complex2d";
import { fft2D } from "./fft2d";

export type MtfRadialBin = {
  frequencyCyclesPerM: number;
  mtf: number;
  samples: number;
};

export type MtfMetrics2D = {
  width: number;
  height: number;
  spacingUM: number;
  spacingVM: number;
  mtf: Float64Array;
  horizontal: MtfRadialBin[];
  vertical: MtfRadialBin[];
  radial: MtfRadialBin[];
  mtf50CyclesPerM: number | null;
  mtf10CyclesPerM: number | null;
  cutoffCyclesPerM: number | null;
  provenanceLabel: string;
};

export function computeMtf2D(field: FieldOutput2D, radialBins = 96): MtfMetrics2D {
  const spacingUM = (field.uMaxM - field.uMinM) / field.width;
  const spacingVM = (field.vMaxM - field.vMinM) / field.height;
  const psf = makeComplexGrid2D(field.width, field.height);
  const psfSum = sum(field.intensity);
  for (let index = 0; index < field.intensity.length; index += 1) {
    psf.real[index] = psfSum > 0 ? (field.intensity[index] ?? 0) / psfSum : 0;
  }
  const otf = fft2D(psf);
  const dc = Math.max(Number.MIN_VALUE, Math.hypot(otf.real[0] ?? 0, otf.imag[0] ?? 0));
  const mtf = new Float64Array(field.width * field.height);
  for (let index = 0; index < mtf.length; index += 1) {
    mtf[index] = Math.hypot(otf.real[index] ?? 0, otf.imag[index] ?? 0) / dc;
  }
  const radial = radialMtfProfile(mtf, field.width, field.height, spacingUM, spacingVM, radialBins);
  const horizontal = axisMtfProfile(mtf, field.width, field.height, spacingUM, "horizontal");
  const vertical = axisMtfProfile(mtf, field.width, field.height, spacingVM, "vertical");
  return {
    width: field.width,
    height: field.height,
    spacingUM,
    spacingVM,
    mtf,
    horizontal,
    vertical,
    radial,
    mtf50CyclesPerM: firstThresholdFrequency(radial, 0.5),
    mtf10CyclesPerM: firstThresholdFrequency(radial, 0.1),
    cutoffCyclesPerM: firstThresholdFrequency(radial, 0.02),
    provenanceLabel: "MTF derived from L3 coherent scalar PSF/OTF; not full incoherent microscope MTF."
  };
}

export function interpolateMtfAtFrequency(profile: MtfRadialBin[], frequencyCyclesPerM: number): number {
  if (profile.length === 0) return 0;
  const first = profile[0];
  if (!first) return 0;
  if (frequencyCyclesPerM <= first.frequencyCyclesPerM) return first.mtf;
  for (let index = 1; index < profile.length; index += 1) {
    const previous = profile[index - 1];
    const current = profile[index];
    if (!previous || !current) continue;
    if (frequencyCyclesPerM <= current.frequencyCyclesPerM) {
      const span = current.frequencyCyclesPerM - previous.frequencyCyclesPerM;
      const t = span > 0 ? (frequencyCyclesPerM - previous.frequencyCyclesPerM) / span : 0;
      return previous.mtf + (current.mtf - previous.mtf) * t;
    }
  }
  return profile[profile.length - 1]?.mtf ?? 0;
}

export function nyquistFrequencyCyclesPerM(pixelPitchM: number): number {
  return 1 / (2 * pixelPitchM);
}

function radialMtfProfile(mtf: Float64Array, width: number, height: number, spacingU: number, spacingV: number, binCount: number): MtfRadialBin[] {
  const maxFrequency = Math.hypot(1 / (2 * spacingU), 1 / (2 * spacingV));
  const sums = new Float64Array(binCount);
  const counts = new Uint32Array(binCount);
  for (let v = 0; v < height; v += 1) {
    for (let u = 0; u < width; u += 1) {
      const index = v * width + u;
      const frequency = Math.hypot(frequencyForIndex(u, width, spacingU), frequencyForIndex(v, height, spacingV));
      const bin = Math.min(binCount - 1, Math.floor((frequency / maxFrequency) * binCount));
      sums[bin] = (sums[bin] ?? 0) + (mtf[index] ?? 0);
      counts[bin] = (counts[bin] ?? 0) + 1;
    }
  }
  const profile: MtfRadialBin[] = [];
  for (let bin = 0; bin < binCount; bin += 1) {
    const samples = counts[bin] ?? 0;
    profile.push({
      frequencyCyclesPerM: ((bin + 0.5) / binCount) * maxFrequency,
      mtf: samples > 0 ? (sums[bin] ?? 0) / samples : 0,
      samples
    });
  }
  return profile;
}

function axisMtfProfile(mtf: Float64Array, width: number, height: number, spacing: number, axis: "horizontal" | "vertical"): MtfRadialBin[] {
  const length = axis === "horizontal" ? width : height;
  const centerLine = axis === "horizontal" ? 0 : 0;
  const output: MtfRadialBin[] = [];
  for (let index = 0; index <= Math.floor(length / 2); index += 1) {
    const sourceIndex = axis === "horizontal" ? centerLine * width + index : index * width + centerLine;
    output.push({
      frequencyCyclesPerM: Math.abs(frequencyForIndex(index, length, spacing)),
      mtf: mtf[sourceIndex] ?? 0,
      samples: 1
    });
  }
  return output;
}

function firstThresholdFrequency(profile: MtfRadialBin[], threshold: number): number | null {
  for (let index = 1; index < profile.length; index += 1) {
    const previous = profile[index - 1];
    const current = profile[index];
    if (!previous || !current) continue;
    if (current.mtf <= threshold) {
      const delta = previous.mtf - current.mtf;
      const t = delta > 0 ? (previous.mtf - threshold) / delta : 0;
      return previous.frequencyCyclesPerM + (current.frequencyCyclesPerM - previous.frequencyCyclesPerM) * t;
    }
  }
  return null;
}

function frequencyForIndex(index: number, length: number, spacingM: number): number {
  const wrapped = index <= length / 2 ? index : index - length;
  return wrapped / (length * spacingM);
}

function sum(values: Float64Array): number {
  let output = 0;
  for (const value of values) output += value;
  return output;
}
