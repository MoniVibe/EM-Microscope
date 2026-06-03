import { angularFrequencyGrid, fft, isPowerOfTwo } from "../math/fft";
import type { ComplexArray } from "./complex";
import { assertComplexGrid2D, cloneComplexGrid2D, index2D, makeComplexGrid2D, type ComplexGrid2D } from "./complex2d";

export function fft2D(input: ComplexGrid2D, inverse = false): ComplexGrid2D {
  assertComplexGrid2D(input);
  if (!isPowerOfTwo(input.width) || !isPowerOfTwo(input.height)) {
    throw new Error(`FFT2 dimensions must be powers of two; got ${input.width}x${input.height}`);
  }

  const rowTransformed = cloneComplexGrid2D(input);
  for (let vIndex = 0; vIndex < input.height; vIndex += 1) {
    const row = makeComplexRow(input.width);
    for (let uIndex = 0; uIndex < input.width; uIndex += 1) {
      const sourceIndex = index2D(input.width, uIndex, vIndex);
      row.real[uIndex] = rowTransformed.real[sourceIndex] ?? 0;
      row.imag[uIndex] = rowTransformed.imag[sourceIndex] ?? 0;
    }
    const transformed = fft(row, inverse);
    for (let uIndex = 0; uIndex < input.width; uIndex += 1) {
      const targetIndex = index2D(input.width, uIndex, vIndex);
      rowTransformed.real[targetIndex] = transformed.real[uIndex] ?? 0;
      rowTransformed.imag[targetIndex] = transformed.imag[uIndex] ?? 0;
    }
  }

  const output = makeComplexGrid2D(input.width, input.height);
  for (let uIndex = 0; uIndex < input.width; uIndex += 1) {
    const column = makeComplexRow(input.height);
    for (let vIndex = 0; vIndex < input.height; vIndex += 1) {
      const sourceIndex = index2D(input.width, uIndex, vIndex);
      column.real[vIndex] = rowTransformed.real[sourceIndex] ?? 0;
      column.imag[vIndex] = rowTransformed.imag[sourceIndex] ?? 0;
    }
    const transformed = fft(column, inverse);
    for (let vIndex = 0; vIndex < input.height; vIndex += 1) {
      const targetIndex = index2D(input.width, uIndex, vIndex);
      output.real[targetIndex] = transformed.real[vIndex] ?? 0;
      output.imag[targetIndex] = transformed.imag[vIndex] ?? 0;
    }
  }

  return output;
}

export function angularFrequencyGrid2D({
  width,
  height,
  spacingUM,
  spacingVM
}: {
  width: number;
  height: number;
  spacingUM: number;
  spacingVM: number;
}): { ku: Float64Array; kv: Float64Array } {
  return {
    ku: angularFrequencyGrid(width, spacingUM),
    kv: angularFrequencyGrid(height, spacingVM)
  };
}

function makeComplexRow(length: number): ComplexArray {
  return {
    real: new Float64Array(length),
    imag: new Float64Array(length)
  };
}
