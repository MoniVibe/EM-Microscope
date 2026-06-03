import type { FieldOutput2D } from "../solvers/Solver";
import { peakPixel2D, pixelCoordinateM } from "./imageMetrics2d";

export type RadialProfileBin2D = {
  radiusM: number;
  meanIntensity: number;
  normalized: number;
  samples: number;
};

export type ImageSummary2D = {
  peakIntensity: number;
  totalIntensity: number;
  centroidUM: number;
  centroidVM: number;
  edgeFraction: number;
  dynamicRange: number;
};

export function radialProfile2D(field: FieldOutput2D, binCount = 64): RadialProfileBin2D[] {
  const peak = peakPixel2D(field.intensity, field.width);
  const peakCoordinate = pixelCoordinateM(field, peak.uIndex, peak.vIndex);
  const maxRadiusM = Math.hypot(field.uMaxM - field.uMinM, field.vMaxM - field.vMinM) / 2;
  const sums = new Float64Array(binCount);
  const counts = new Uint32Array(binCount);

  for (let vIndex = 0; vIndex < field.height; vIndex += 1) {
    for (let uIndex = 0; uIndex < field.width; uIndex += 1) {
      const index = vIndex * field.width + uIndex;
      const { uM, vM } = pixelCoordinateM(field, uIndex, vIndex);
      const radiusM = Math.hypot(uM - peakCoordinate.uM, vM - peakCoordinate.vM);
      const bin = Math.min(binCount - 1, Math.floor((radiusM / maxRadiusM) * binCount));
      sums[bin] = (sums[bin] ?? 0) + (field.intensity[index] ?? 0);
      counts[bin] = (counts[bin] ?? 0) + 1;
    }
  }

  const profile: RadialProfileBin2D[] = [];
  for (let bin = 0; bin < binCount; bin += 1) {
    const samples = counts[bin] ?? 0;
    const meanIntensity = samples > 0 ? (sums[bin] ?? 0) / samples : 0;
    profile.push({
      radiusM: ((bin + 0.5) / binCount) * maxRadiusM,
      meanIntensity,
      normalized: peak.value > 0 ? meanIntensity / peak.value : 0,
      samples
    });
  }
  return profile;
}

export function summarizeImage2D(field: FieldOutput2D, edgeBins = 4): ImageSummary2D {
  let total = 0;
  let weightedU = 0;
  let weightedV = 0;
  let edge = 0;
  let peak = 0;
  let minPositive = Number.POSITIVE_INFINITY;

  for (let vIndex = 0; vIndex < field.height; vIndex += 1) {
    for (let uIndex = 0; uIndex < field.width; uIndex += 1) {
      const index = vIndex * field.width + uIndex;
      const intensity = field.intensity[index] ?? 0;
      const { uM, vM } = pixelCoordinateM(field, uIndex, vIndex);
      total += intensity;
      weightedU += intensity * uM;
      weightedV += intensity * vM;
      peak = Math.max(peak, intensity);
      if (intensity > 0) minPositive = Math.min(minPositive, intensity);
      if (uIndex < edgeBins || uIndex >= field.width - edgeBins || vIndex < edgeBins || vIndex >= field.height - edgeBins) {
        edge += intensity;
      }
    }
  }

  return {
    peakIntensity: peak,
    totalIntensity: total,
    centroidUM: total > 0 ? weightedU / total : 0,
    centroidVM: total > 0 ? weightedV / total : 0,
    edgeFraction: total > 0 ? edge / total : 0,
    dynamicRange: minPositive < Number.POSITIVE_INFINITY && minPositive > 0 ? peak / minPositive : 0
  };
}
