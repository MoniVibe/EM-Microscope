import { cloneComplexArray, type ComplexArray } from "../wave/complex";

export function isPowerOfTwo(value: number): boolean {
  return Number.isInteger(value) && value > 0 && (value & (value - 1)) === 0;
}

export function fft(input: ComplexArray, inverse = false): ComplexArray {
  const n = input.real.length;
  if (input.imag.length !== n) {
    throw new Error("FFT real and imaginary arrays must have the same length");
  }
  if (!isPowerOfTwo(n)) {
    throw new Error(`FFT length must be a power of two; got ${n}`);
  }

  const output = cloneComplexArray(input);
  bitReversePermute(output.real, output.imag);

  for (let size = 2; size <= n; size *= 2) {
    const half = size / 2;
    const sign = inverse ? 1 : -1;
    const theta = sign * (2 * Math.PI) / size;
    const phaseStepReal = Math.cos(theta);
    const phaseStepImag = Math.sin(theta);

    for (let start = 0; start < n; start += size) {
      let stepReal = 1;
      let stepImag = 0;

      for (let offset = 0; offset < half; offset += 1) {
        const evenIndex = start + offset;
        const oddIndex = evenIndex + half;
        const oddBaseReal = output.real[oddIndex] ?? 0;
        const oddBaseImag = output.imag[oddIndex] ?? 0;
        const oddReal = oddBaseReal * stepReal - oddBaseImag * stepImag;
        const oddImag = oddBaseReal * stepImag + oddBaseImag * stepReal;
        const evenReal = output.real[evenIndex] ?? 0;
        const evenImag = output.imag[evenIndex] ?? 0;

        output.real[evenIndex] = evenReal + oddReal;
        output.imag[evenIndex] = evenImag + oddImag;
        output.real[oddIndex] = evenReal - oddReal;
        output.imag[oddIndex] = evenImag - oddImag;

        const nextReal = stepReal * phaseStepReal - stepImag * phaseStepImag;
        stepImag = stepReal * phaseStepImag + stepImag * phaseStepReal;
        stepReal = nextReal;
      }
    }
  }

  if (inverse) {
    for (let index = 0; index < n; index += 1) {
      output.real[index] = (output.real[index] ?? 0) / n;
      output.imag[index] = (output.imag[index] ?? 0) / n;
    }
  }

  return output;
}

export function angularFrequencyGrid(samples: number, spacingM: number): Float64Array {
  const values = new Float64Array(samples);
  const lengthM = samples * spacingM;
  for (let index = 0; index < samples; index += 1) {
    const cyclesPerM = index < samples / 2 ? index / lengthM : (index - samples) / lengthM;
    values[index] = 2 * Math.PI * cyclesPerM;
  }
  return values;
}

function bitReversePermute(real: Float64Array, imag: Float64Array): void {
  const n = real.length;
  let j = 0;
  for (let i = 1; i < n; i += 1) {
    let bit = n >> 1;
    while ((j & bit) !== 0) {
      j ^= bit;
      bit >>= 1;
    }
    j ^= bit;

    if (i < j) {
      const realI = real[i] ?? 0;
      const imagI = imag[i] ?? 0;
      real[i] = real[j] ?? 0;
      imag[i] = imag[j] ?? 0;
      real[j] = realI;
      imag[j] = imagI;
    }
  }
}
