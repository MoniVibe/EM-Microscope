import type { FieldGrid2D, FieldPlane2D } from "../scene/schema";
import { complexMagnitudeSquared } from "./complex";
import { index2D, makeComplexGrid2D, type ComplexGrid2D } from "./complex2d";

export function gridAreaM2(grid: FieldGrid2D): number {
  return (grid.uMaxM - grid.uMinM) * (grid.vMaxM - grid.vMinM);
}

export function gridCoordinates2D(grid: FieldGrid2D): { uM: Float64Array; vM: Float64Array } {
  const uM = new Float64Array(grid.width);
  const vM = new Float64Array(grid.height);
  for (let uIndex = 0; uIndex < grid.width; uIndex += 1) {
    uM[uIndex] = grid.uMinM + uIndex * grid.spacingUM;
  }
  for (let vIndex = 0; vIndex < grid.height; vIndex += 1) {
    vM[vIndex] = grid.vMinM + vIndex * grid.spacingVM;
  }
  return { uM, vM };
}

export function createFieldFromPlane2D(grid: FieldGrid2D, plane: FieldPlane2D): ComplexGrid2D {
  if (!plane.fieldSource) {
    throw new Error(`2D field plane ${plane.id} has no fieldSource`);
  }

  const field = makeComplexGrid2D(grid.width, grid.height);
  if (plane.fieldSource.kind === "uniformPlaneWave") {
    const real = plane.fieldSource.amplitude * Math.cos(plane.fieldSource.phaseRad);
    const imag = plane.fieldSource.amplitude * Math.sin(plane.fieldSource.phaseRad);
    field.real.fill(real);
    field.imag.fill(imag);
    return field;
  }

  for (let vIndex = 0; vIndex < grid.height; vIndex += 1) {
    const vM = grid.vMinM + vIndex * grid.spacingVM;
    const vRel = vM - plane.fieldSource.centerVM;
    for (let uIndex = 0; uIndex < grid.width; uIndex += 1) {
      const uM = grid.uMinM + uIndex * grid.spacingUM;
      const uRel = uM - plane.fieldSource.centerUM;
      const envelope =
        plane.fieldSource.amplitude *
        Math.exp(-((uRel * uRel) / (plane.fieldSource.waistUM * plane.fieldSource.waistUM) + (vRel * vRel) / (plane.fieldSource.waistVM * plane.fieldSource.waistVM)));
      const targetIndex = index2D(grid.width, uIndex, vIndex);
      field.real[targetIndex] = envelope * Math.cos(plane.fieldSource.phaseRad);
      field.imag[targetIndex] = envelope * Math.sin(plane.fieldSource.phaseRad);
    }
  }
  return field;
}

export function fieldEnergy2D(field: ComplexGrid2D, spacingUM: number, spacingVM: number): number {
  let sum = 0;
  for (let index = 0; index < field.real.length; index += 1) {
    sum += complexMagnitudeSquared(field.real[index] ?? 0, field.imag[index] ?? 0);
  }
  return sum * spacingUM * spacingVM;
}

export function intensityAndPhase2D(field: ComplexGrid2D): { intensity: Float64Array; phaseRad: Float64Array } {
  const intensity = new Float64Array(field.real.length);
  const phaseRad = new Float64Array(field.real.length);
  for (let index = 0; index < field.real.length; index += 1) {
    intensity[index] = complexMagnitudeSquared(field.real[index] ?? 0, field.imag[index] ?? 0);
    phaseRad[index] = Math.atan2(field.imag[index] ?? 0, field.real[index] ?? 0);
  }
  return { intensity, phaseRad };
}
