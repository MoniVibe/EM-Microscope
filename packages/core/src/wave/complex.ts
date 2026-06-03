export type ComplexArray = {
  real: Float64Array;
  imag: Float64Array;
};

export function makeComplexArray(length: number): ComplexArray {
  return {
    real: new Float64Array(length),
    imag: new Float64Array(length)
  };
}

export function cloneComplexArray(input: ComplexArray): ComplexArray {
  return {
    real: new Float64Array(input.real),
    imag: new Float64Array(input.imag)
  };
}

export function complexMagnitudeSquared(real: number, imag: number): number {
  return real * real + imag * imag;
}

export function multiplyByComplex(
  real: Float64Array,
  imag: Float64Array,
  index: number,
  factorReal: number,
  factorImag: number
): void {
  const a = real[index] ?? 0;
  const b = imag[index] ?? 0;
  real[index] = a * factorReal - b * factorImag;
  imag[index] = a * factorImag + b * factorReal;
}
