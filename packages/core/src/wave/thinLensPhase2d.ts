import type { FieldGrid2D, ThinLensPhasePlane2D } from "../scene/schema";
import { multiplyByComplex } from "./complex";
import { cloneComplexGrid2D, index2D, type ComplexGrid2D } from "./complex2d";
import { fieldEnergy2D } from "./field2d";
import type { PlaneApplication2D } from "./sampleMasks2d";

export function applyThinLensPhase2D(
  field: ComplexGrid2D,
  lens: ThinLensPhasePlane2D,
  grid: FieldGrid2D,
  vacuumWavelengthM: number,
  refractiveIndex: number
): PlaneApplication2D {
  const output = cloneComplexGrid2D(field);
  const k = (2 * Math.PI * refractiveIndex) / vacuumWavelengthM;
  for (let vIndex = 0; vIndex < grid.height; vIndex += 1) {
    const vM = grid.vMinM + vIndex * grid.spacingVM - lens.centerVM;
    for (let uIndex = 0; uIndex < grid.width; uIndex += 1) {
      const uM = grid.uMinM + uIndex * grid.spacingUM - lens.centerUM;
      const phase = (-k * (uM * uM + vM * vM)) / (2 * lens.focalLengthM);
      multiplyByComplex(output.real, output.imag, index2D(grid.width, uIndex, vIndex), Math.cos(phase), Math.sin(phase));
    }
  }

  const inputEnergy = fieldEnergy2D(field, grid.spacingUM, grid.spacingVM);
  const outputEnergy = fieldEnergy2D(output, grid.spacingUM, grid.spacingVM);
  return {
    field: output,
    inputEnergy,
    outputEnergy,
    clippedEnergy: Math.max(0, inputEnergy - outputEnergy)
  };
}
