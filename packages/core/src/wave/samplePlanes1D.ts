import type { SamplePlane1D } from "../scene/schema";
import { cloneComplexArray, multiplyByComplex, type ComplexArray } from "./complex";
import { fieldEnergy } from "./field1d";
import { transmissionAtY } from "./transmissionMasks1D";

export type SamplePlaneApplication = {
  field: ComplexArray;
  inputEnergy: number;
  outputEnergy: number;
  clippedEnergy: number;
};

export function applySamplePlane1D(field: ComplexArray, sample: SamplePlane1D, yM: Float64Array, spacingM: number): SamplePlaneApplication {
  const output = cloneComplexArray(field);
  for (let index = 0; index < yM.length; index += 1) {
    const transmission = transmissionAtY(sample.transmission, yM[index] ?? 0);
    multiplyByComplex(
      output.real,
      output.imag,
      index,
      transmission.amplitude * Math.cos(transmission.phaseRad),
      transmission.amplitude * Math.sin(transmission.phaseRad)
    );
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
