export type ComplexGrid2D = {
  width: number;
  height: number;
  real: Float64Array;
  imag: Float64Array;
};

export function makeComplexGrid2D(width: number, height: number): ComplexGrid2D {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error(`2D complex grid dimensions must be positive integers; got ${width}x${height}`);
  }
  return {
    width,
    height,
    real: new Float64Array(width * height),
    imag: new Float64Array(width * height)
  };
}

export function cloneComplexGrid2D(input: ComplexGrid2D): ComplexGrid2D {
  return {
    width: input.width,
    height: input.height,
    real: new Float64Array(input.real),
    imag: new Float64Array(input.imag)
  };
}

export function index2D(width: number, uIndex: number, vIndex: number): number {
  return vIndex * width + uIndex;
}

export function assertComplexGrid2D(input: ComplexGrid2D): void {
  const expected = input.width * input.height;
  if (input.real.length !== expected || input.imag.length !== expected) {
    throw new Error(`2D complex grid buffers must have ${expected} entries`);
  }
}
