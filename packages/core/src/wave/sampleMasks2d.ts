import type { FieldGrid2D, SamplePlane2D, SampleTransmission2D } from "../scene/schema";
import { multiplyByComplex } from "./complex";
import { cloneComplexGrid2D, index2D, type ComplexGrid2D } from "./complex2d";
import { fieldEnergy2D } from "./field2d";

export type ComplexTransmission2D = {
  amplitude: number;
  phaseRad: number;
};

export type PlaneApplication2D = {
  field: ComplexGrid2D;
  inputEnergy: number;
  outputEnergy: number;
  clippedEnergy: number;
};

export function transmissionAtUV(transmission: SampleTransmission2D, uM: number, vM: number): ComplexTransmission2D {
  if (transmission.kind === "uniform") {
    return { amplitude: transmission.amplitude, phaseRad: transmission.phaseRad };
  }

  if (transmission.kind === "disc") {
    const radius = Math.hypot(uM - transmission.centerUM, vM - transmission.centerVM);
    const inside = radius <= transmission.radiusM;
    return {
      amplitude: inside ? transmission.amplitudeInside : transmission.amplitudeOutside,
      phaseRad: inside ? transmission.phaseInsideRad : transmission.phaseOutsideRad
    };
  }

  if (transmission.kind === "doubleSlit2D") {
    const uRel = uM - transmission.centerUM;
    const vRel = vM - transmission.centerVM;
    const left = -transmission.separationM / 2;
    const right = transmission.separationM / 2;
    const inVerticalExtent = Math.abs(vRel) <= transmission.slitHeightM / 2;
    const inSlit = Math.abs(uRel - left) <= transmission.slitWidthM / 2 || Math.abs(uRel - right) <= transmission.slitWidthM / 2;
    return { amplitude: inVerticalExtent && inSlit ? 1 : 0, phaseRad: 0 };
  }

  if (transmission.kind === "grating2D") {
    const local = orientedCoordinateM(uM - transmission.centerUM, vM - transmission.centerVM, transmission.orientationRad);
    const cycle = positiveModulo(local, transmission.periodM);
    return { amplitude: cycle < transmission.periodM * transmission.dutyCycle ? 1 : 0, phaseRad: 0 };
  }

  if (transmission.kind === "barTarget2D") {
    const local = orientedCoordinateM(uM - transmission.centerUM, vM - transmission.centerVM, transmission.orientationRad);
    const totalWidthM = transmission.bars * transmission.periodM;
    const bounded = local + totalWidthM / 2;
    if (bounded < 0 || bounded > totalWidthM) return { amplitude: 1, phaseRad: 0 };
    const cycle = bounded % transmission.periodM;
    const bright = cycle < transmission.periodM * transmission.dutyCycle;
    return { amplitude: bright ? 1 : 1 - transmission.contrast, phaseRad: 0 };
  }

  if (transmission.kind === "phaseStep2D") {
    return { amplitude: 1, phaseRad: uM < transmission.boundaryUM ? transmission.phaseLeftRad : transmission.phaseRightRad };
  }

  const uCycle = positiveModulo(uM - transmission.centerUM, transmission.periodM);
  const vCycle = positiveModulo(vM - transmission.centerVM, transmission.periodM);
  const dark = (uCycle < transmission.periodM / 2) !== (vCycle < transmission.periodM / 2);
  return { amplitude: dark ? 1 - transmission.contrast : 1, phaseRad: 0 };
}

export function minimumFeatureSize2DM(transmission: SampleTransmission2D): number | null {
  if (transmission.kind === "uniform") return null;
  if (transmission.kind === "disc") return transmission.radiusM * 2;
  if (transmission.kind === "doubleSlit2D") return Math.min(transmission.slitWidthM, transmission.slitHeightM);
  if (transmission.kind === "grating2D") return Math.min(transmission.periodM * transmission.dutyCycle, transmission.periodM * (1 - transmission.dutyCycle));
  if (transmission.kind === "barTarget2D") return Math.min(transmission.periodM * transmission.dutyCycle, transmission.periodM * (1 - transmission.dutyCycle));
  if (transmission.kind === "phaseStep2D") return null;
  return transmission.periodM / 2;
}

export function applySamplePlane2D(field: ComplexGrid2D, sample: SamplePlane2D, grid: FieldGrid2D): PlaneApplication2D {
  const output = cloneComplexGrid2D(field);
  for (let vIndex = 0; vIndex < grid.height; vIndex += 1) {
    const vM = grid.vMinM + vIndex * grid.spacingVM;
    for (let uIndex = 0; uIndex < grid.width; uIndex += 1) {
      const uM = grid.uMinM + uIndex * grid.spacingUM;
      const targetIndex = index2D(grid.width, uIndex, vIndex);
      const transmission = transmissionAtUV(sample.transmission, uM, vM);
      multiplyByComplex(
        output.real,
        output.imag,
        targetIndex,
        transmission.amplitude * Math.cos(transmission.phaseRad),
        transmission.amplitude * Math.sin(transmission.phaseRad)
      );
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

function orientedCoordinateM(uM: number, vM: number, orientationRad: number): number {
  return uM * Math.cos(orientationRad) + vM * Math.sin(orientationRad);
}

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}
