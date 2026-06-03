import { describe, expect, it } from "vitest";
import { index2D, makeComplexGrid2D } from "./complex2d";
import { fft2D } from "./fft2d";

describe("radix-2 FFT2", () => {
  it("round-trips a complex 2D field through inverse FFT2", () => {
    const input = makeComplexGrid2D(8, 4);
    for (let vIndex = 0; vIndex < input.height; vIndex += 1) {
      for (let uIndex = 0; uIndex < input.width; uIndex += 1) {
        const index = index2D(input.width, uIndex, vIndex);
        input.real[index] = Math.sin(uIndex * 0.3) + vIndex * 0.25;
        input.imag[index] = Math.cos(vIndex * 0.4) - uIndex * 0.125;
      }
    }

    const output = fft2D(fft2D(input), true);

    for (let index = 0; index < input.real.length; index += 1) {
      expect(output.real[index]).toBeCloseTo(input.real[index] ?? 0, 11);
      expect(output.imag[index]).toBeCloseTo(input.imag[index] ?? 0, 11);
    }
  });

  it("rejects non-power-of-two dimensions", () => {
    expect(() => fft2D(makeComplexGrid2D(6, 4))).toThrow(/powers of two/);
  });
});
