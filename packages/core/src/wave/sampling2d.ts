import { isPowerOfTwo } from "../math/fft";
import type { FieldGrid2D, PupilPlane2D, SamplePlane2D } from "../scene/schema";
import type { SolverWarning } from "../solvers/Solver";
import { minimumFeatureSize2DM } from "./sampleMasks2d";

export function gridSamplingWarnings2D(grid: FieldGrid2D): SolverWarning[] {
  const warnings: SolverWarning[] = [];
  if (!isPowerOfTwo(grid.width) || !isPowerOfTwo(grid.height)) {
    warnings.push({
      code: "fieldGrid2D.notPowerOfTwo",
      message: `${grid.label} is ${grid.width}x${grid.height}; radix-2 FFT2 requires power-of-two dimensions.`,
      elementId: grid.id
    });
  }
  if (grid.width < 64 || grid.height < 64) {
    warnings.push({
      code: "fieldGrid2D.lowSampleCount",
      message: `${grid.label} is too small for a useful 2D diffraction image.`,
      elementId: grid.id
    });
  }
  return warnings;
}

export function sampleSamplingWarnings2D(sample: SamplePlane2D, grid: FieldGrid2D): SolverWarning[] {
  const featureM = minimumFeatureSize2DM(sample.transmission);
  if (featureM === null) return [];
  const samplesAcrossFeature = featureM / Math.max(grid.spacingUM, grid.spacingVM);
  if (samplesAcrossFeature >= 8) return [];
  return [
    {
      code: "sample2D.undersampled",
      message: `${sample.label} has a ${samplesAcrossFeature.toFixed(1)} sample feature; use at least 8 samples across the smallest 2D sample feature.`,
      elementId: sample.id
    }
  ];
}

export function pupilSamplingWarnings2D(pupil: PupilPlane2D, grid: FieldGrid2D): SolverWarning[] {
  const diameterM = pupil.shape.kind === "circle" ? pupil.shape.radiusM * 2 : pupil.shape.outerRadiusM * 2;
  const samplesAcrossDiameter = diameterM / Math.max(grid.spacingUM, grid.spacingVM);
  if (samplesAcrossDiameter >= 16) return [];
  return [
    {
      code: "pupil2D.undersampled",
      message: `${pupil.label} spans ${samplesAcrossDiameter.toFixed(1)} grid samples; use at least 16 samples across a circular pupil diameter.`,
      elementId: pupil.id
    }
  ];
}

export function edgeEnergyWarning2D(intensity: Float64Array, width: number, height: number, edgeBins = 4, threshold = 1e-3): SolverWarning[] {
  if (width < edgeBins * 4 || height < edgeBins * 4) return [];
  let total = 0;
  let edge = 0;
  for (let vIndex = 0; vIndex < height; vIndex += 1) {
    for (let uIndex = 0; uIndex < width; uIndex += 1) {
      const index = vIndex * width + uIndex;
      const value = intensity[index] ?? 0;
      total += value;
      if (uIndex < edgeBins || uIndex >= width - edgeBins || vIndex < edgeBins || vIndex >= height - edgeBins) {
        edge += value;
      }
    }
  }
  if (total <= 0 || edge / total <= threshold) return [];
  return [
    {
      code: "field2D.edgeEnergy",
      message: "Non-negligible 2D intensity reaches the transverse grid edge; enlarge the field window to reduce wraparound risk."
    }
  ];
}
