import { isPowerOfTwo } from "../math/fft";
import type { FieldGrid1D, RectApertureMask1D } from "../scene/schema";
import type { SolverWarning } from "../solvers/Solver";

export function gridSamplingWarnings(grid: FieldGrid1D): SolverWarning[] {
  const warnings: SolverWarning[] = [];
  if (!isPowerOfTwo(grid.samples)) {
    warnings.push({
      code: "fieldGrid.notPowerOfTwo",
      message: `${grid.label} has ${grid.samples} samples; radix-2 FFT requires a power-of-two grid.`,
      elementId: grid.id
    });
  }
  if (grid.samples < 256) {
    warnings.push({
      code: "fieldGrid.lowSampleCount",
      message: `${grid.label} has too few samples for a reliable diffraction profile.`,
      elementId: grid.id
    });
  }
  return warnings;
}

export function apertureSamplingWarnings(mask: RectApertureMask1D, grid: FieldGrid1D): SolverWarning[] {
  const samplesAcrossAperture = mask.widthM / grid.spacingM;
  if (samplesAcrossAperture >= 8) return [];
  return [
    {
      code: "aperture.undersampled",
      message: `${mask.label} spans ${samplesAcrossAperture.toFixed(1)} grid samples; use at least 8 samples across the opening.`,
      elementId: mask.id
    }
  ];
}

export function edgeEnergyWarning(intensity: Float64Array, edgeBins = 8, threshold = 1e-3): SolverWarning[] {
  if (intensity.length < edgeBins * 4) return [];
  let total = 0;
  let edge = 0;
  for (let index = 0; index < intensity.length; index += 1) {
    total += intensity[index] ?? 0;
    if (index < edgeBins || index >= intensity.length - edgeBins) {
      edge += intensity[index] ?? 0;
    }
  }
  if (total <= 0 || edge / total <= threshold) return [];
  return [
    {
      code: "field.edgeEnergy",
      message: "Non-negligible intensity reaches the transverse grid edge; enlarge the field window to reduce wraparound risk."
    }
  ];
}

export function propagationWindowWarnings({
  wavelengthM,
  propagationM,
  apertureWidthM,
  grid
}: {
  wavelengthM: number;
  propagationM: number;
  apertureWidthM: number;
  grid: FieldGrid1D;
}): SolverWarning[] {
  const firstMinimumM = (wavelengthM * propagationM) / apertureWidthM;
  const halfWindowM = (grid.yMaxM - grid.yMinM) / 2;
  if (firstMinimumM < halfWindowM * 0.9) return [];
  return [
    {
      code: "diffraction.windowTooSmall",
      message: "The first Fraunhofer slit minimum is near or outside the transverse field window.",
      elementId: grid.id
    }
  ];
}
