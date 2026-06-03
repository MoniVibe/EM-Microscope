import { describe, expect, it } from "vitest";
import { fft } from "./fft";
import type { ComplexArray } from "../wave/complex";

describe("radix-2 FFT", () => {
  it("round-trips a complex sequence through inverse FFT", () => {
    const input: ComplexArray = {
      real: Float64Array.from([1, 2, -1, 0.5, 0, 3, -2, 1]),
      imag: Float64Array.from([0, 0.5, 1, -1, 2, 0, 0.25, -0.75])
    };

    const output = fft(fft(input), true);

    for (let index = 0; index < input.real.length; index += 1) {
      expect(output.real[index]).toBeCloseTo(input.real[index] ?? 0, 12);
      expect(output.imag[index]).toBeCloseTo(input.imag[index] ?? 0, 12);
    }
  });
});
