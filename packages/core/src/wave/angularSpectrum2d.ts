import type { FieldGrid2D } from "../scene/schema";
import { cloneComplexGrid2D, index2D, type ComplexGrid2D } from "./complex2d";
import { angularFrequencyGrid2D, fft2D } from "./fft2d";

export function propagateAngularSpectrum2D(
  input: ComplexGrid2D,
  grid: FieldGrid2D,
  vacuumWavelengthM: number,
  refractiveIndex: number,
  distanceM: number
): ComplexGrid2D {
  if (distanceM < 0) {
    throw new Error("2D angular-spectrum propagation distance must be nonnegative");
  }
  if (distanceM === 0) {
    return cloneComplexGrid2D(input);
  }

  const spectrum = fft2D(input);
  const { ku, kv } = angularFrequencyGrid2D(grid);
  const mediumWavelengthM = vacuumWavelengthM / refractiveIndex;
  const k = (2 * Math.PI) / mediumWavelengthM;

  for (let vIndex = 0; vIndex < grid.height; vIndex += 1) {
    const kvValue = kv[vIndex] ?? 0;
    for (let uIndex = 0; uIndex < grid.width; uIndex += 1) {
      const kuValue = ku[uIndex] ?? 0;
      const targetIndex = index2D(grid.width, uIndex, vIndex);
      const longitudinalSquared = k * k - kuValue * kuValue - kvValue * kvValue;
      if (longitudinalSquared >= 0) {
        const phase = Math.sqrt(longitudinalSquared) * distanceM;
        multiplyByComplex2D(spectrum, targetIndex, Math.cos(phase), Math.sin(phase));
      } else {
        const decay = Math.exp(-Math.sqrt(-longitudinalSquared) * distanceM);
        spectrum.real[targetIndex] = (spectrum.real[targetIndex] ?? 0) * decay;
        spectrum.imag[targetIndex] = (spectrum.imag[targetIndex] ?? 0) * decay;
      }
    }
  }

  return fft2D(spectrum, true);
}

function multiplyByComplex2D(field: ComplexGrid2D, index: number, factorReal: number, factorImag: number): void {
  const real = field.real[index] ?? 0;
  const imag = field.imag[index] ?? 0;
  field.real[index] = real * factorReal - imag * factorImag;
  field.imag[index] = real * factorImag + imag * factorReal;
}
