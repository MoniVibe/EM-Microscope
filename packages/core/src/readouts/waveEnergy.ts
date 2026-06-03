import type { EnergyLedger, PhysicsProvenance } from "../solvers/Solver";

export const l2Scalar1DProvenance: PhysicsProvenance = {
  kind: "simulated",
  level: "L2",
  solverId: "scalar.angularSpectrum.l2.1d",
  model: "scalar-wave-1d-angular-spectrum",
  dimensionality: "1d",
  approximation: [
    "coherent monochromatic scalar field",
    "1D transverse slice",
    "homogeneous medium",
    "no polarization",
    "not a full circular-aperture Airy disk"
  ]
};

export function makeWaveEnergyLedger({
  inputEnergy,
  afterMaskEnergy,
  outputEnergy
}: {
  inputEnergy: number;
  afterMaskEnergy: number;
  outputEnergy: number;
}): EnergyLedger {
  const reference = Math.max(afterMaskEnergy, Number.EPSILON);
  return {
    inputEnergy,
    afterMaskEnergy,
    outputEnergy,
    clippedEnergy: Math.max(0, inputEnergy - afterMaskEnergy),
    relativeOutputDrift: (outputEnergy - afterMaskEnergy) / reference,
    units: "relative-field-energy",
    provenance: l2Scalar1DProvenance
  };
}
