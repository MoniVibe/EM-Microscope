import type { RectApertureMask1D } from "../scene/schema";
import { cloneComplexArray, type ComplexArray } from "./complex";
import { fieldEnergy } from "./field1d";

export type ApertureApplication = {
  field: ComplexArray;
  inputEnergy: number;
  outputEnergy: number;
  clippedEnergy: number;
};

export function applyRectAperture1D(field: ComplexArray, mask: RectApertureMask1D, yM: Float64Array, spacingM: number): ApertureApplication {
  const output = cloneComplexArray(field);
  const halfWidthM = mask.widthM / 2;
  for (let index = 0; index < yM.length; index += 1) {
    if (Math.abs((yM[index] ?? 0) - mask.centerYM) > halfWidthM) {
      output.real[index] = 0;
      output.imag[index] = 0;
    }
  }

  const inputEnergy = fieldEnergy(field, spacingM);
  const outputEnergy = fieldEnergy(output, spacingM);
  return {
    field: output,
    inputEnergy,
    outputEnergy,
    clippedEnergy: Math.max(0, inputEnergy - outputEnergy)
  };
}
