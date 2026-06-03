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

export const l3Scalar2DProvenance: PhysicsProvenance = {
  kind: "simulated",
  level: "L3",
  solverId: "scalar.coherent.l3.2d",
  model: "scalar-wave-2d-angular-spectrum",
  dimensionality: "2d",
  approximation: [
    "coherent monochromatic scalar field",
    "2D transverse image-plane intensity approximation",
    "paraxial thin-lens phase model planned for L3 solver",
    "homogeneous medium",
    "no partial coherence",
    "no vector optics",
    "not true 3D physics",
    "not fluorescence or full microscope objective physics"
  ]
};

export const l33PartialCoherence2DProvenance: PhysicsProvenance = {
  kind: "simulated",
  level: "L3",
  solverId: "scalar.partialCoherent.l3.3.2d",
  model: "scalar-partial-coherence-2d-angular-spectrum",
  dimensionality: "2d",
  approximation: [
    "Partial-coherence scalar brightfield approximation",
    "deterministic source-angle sampling",
    "detector intensities averaged across coherent scalar L3 solves",
    "monochromatic scalar field",
    "homogeneous medium",
    "no vector polarization",
    "no fluorescence",
    "not true 3D physics",
    "not a certified ISO microscope measurement"
  ]
};

export function makeWaveEnergyLedger({
  inputEnergy,
  afterMaskEnergy,
  outputEnergy,
  stages,
  provenance = l2Scalar1DProvenance
}: {
  inputEnergy: number;
  afterMaskEnergy: number;
  outputEnergy: number;
  stages?: EnergyLedger["stages"];
  provenance?: PhysicsProvenance;
}): EnergyLedger {
  const reference = Math.max(afterMaskEnergy, Number.EPSILON);
  return {
    inputEnergy,
    afterMaskEnergy,
    outputEnergy,
    clippedEnergy: Math.max(0, inputEnergy - afterMaskEnergy),
    relativeOutputDrift: (outputEnergy - afterMaskEnergy) / reference,
    units: "relative-field-energy",
    stages,
    provenance
  };
}
