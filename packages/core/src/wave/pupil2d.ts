import type { FieldGrid2D, PupilPlane2D } from "../scene/schema";
import { cloneComplexGrid2D, index2D, type ComplexGrid2D } from "./complex2d";
import { fieldEnergy2D } from "./field2d";
import type { PlaneApplication2D } from "./sampleMasks2d";

export function applyPupilPlane2D(field: ComplexGrid2D, pupil: PupilPlane2D, grid: FieldGrid2D): PlaneApplication2D {
  const output = cloneComplexGrid2D(field);
  for (let vIndex = 0; vIndex < grid.height; vIndex += 1) {
    const vM = grid.vMinM + vIndex * grid.spacingVM;
    for (let uIndex = 0; uIndex < grid.width; uIndex += 1) {
      const uM = grid.uMinM + uIndex * grid.spacingUM;
      const targetIndex = index2D(grid.width, uIndex, vIndex);
      if (!insidePupil(pupil, uM, vM)) {
        output.real[targetIndex] = 0;
        output.imag[targetIndex] = 0;
      }
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

export function insidePupil(pupil: PupilPlane2D, uM: number, vM: number): boolean {
  const radiusM = Math.hypot(uM - pupil.shape.centerUM, vM - pupil.shape.centerVM);
  if (pupil.shape.kind === "circle") {
    return radiusM <= pupil.shape.radiusM;
  }
  return radiusM >= pupil.shape.innerRadiusM && radiusM <= pupil.shape.outerRadiusM;
}
