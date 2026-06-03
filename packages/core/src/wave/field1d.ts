import type { FieldGrid1D, FieldPlane1D } from "../scene/schema";
import { complexMagnitudeSquared, makeComplexArray, type ComplexArray } from "./complex";

export function gridSpacingM(grid: FieldGrid1D): number {
  return grid.spacingM;
}

export function gridLengthM(grid: FieldGrid1D): number {
  return grid.yMaxM - grid.yMinM;
}

export function gridCoordinates(grid: FieldGrid1D): Float64Array {
  const yM = new Float64Array(grid.samples);
  for (let index = 0; index < grid.samples; index += 1) {
    yM[index] = grid.yMinM + index * grid.spacingM;
  }
  return yM;
}

export function createFieldFromPlane(grid: FieldGrid1D, plane: FieldPlane1D): ComplexArray {
  if (!plane.fieldSource) {
    throw new Error(`field plane ${plane.id} has no fieldSource`);
  }

  const field = makeComplexArray(grid.samples);
  if (plane.fieldSource.kind === "uniformPlaneWave") {
    const real = plane.fieldSource.amplitude * Math.cos(plane.fieldSource.phaseRad);
    const imag = plane.fieldSource.amplitude * Math.sin(plane.fieldSource.phaseRad);
    field.real.fill(real);
    field.imag.fill(imag);
    return field;
  }

  for (let index = 0; index < grid.samples; index += 1) {
    const yM = grid.yMinM + index * grid.spacingM;
    const yRel = yM - plane.fieldSource.centerYM;
    const envelope = plane.fieldSource.amplitude * Math.exp(-(yRel * yRel) / (plane.fieldSource.waistM * plane.fieldSource.waistM));
    field.real[index] = envelope * Math.cos(plane.fieldSource.phaseRad);
    field.imag[index] = envelope * Math.sin(plane.fieldSource.phaseRad);
  }
  return field;
}

export function fieldEnergy(field: ComplexArray, spacingM: number): number {
  let sum = 0;
  for (let index = 0; index < field.real.length; index += 1) {
    sum += complexMagnitudeSquared(field.real[index] ?? 0, field.imag[index] ?? 0);
  }
  return sum * spacingM;
}

export function intensityAndPhase(field: ComplexArray): { intensity: Float64Array; phaseRad: Float64Array } {
  const intensity = new Float64Array(field.real.length);
  const phaseRad = new Float64Array(field.real.length);
  for (let index = 0; index < field.real.length; index += 1) {
    intensity[index] = complexMagnitudeSquared(field.real[index] ?? 0, field.imag[index] ?? 0);
    phaseRad[index] = Math.atan2(field.imag[index] ?? 0, field.real[index] ?? 0);
  }
  return { intensity, phaseRad };
}

export function normalizeIntensity(intensity: Float64Array): Float64Array {
  const normalized = new Float64Array(intensity.length);
  let max = 0;
  for (const value of intensity) {
    max = Math.max(max, value);
  }
  if (max <= 0) return normalized;
  for (let index = 0; index < intensity.length; index += 1) {
    normalized[index] = (intensity[index] ?? 0) / max;
  }
  return normalized;
}
