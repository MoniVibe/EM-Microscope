import type { FieldOutput2D } from "../solvers/Solver";
import { peakPixel2D, pixelCoordinateM } from "./imageMetrics2d";

export type CrossSectionSample = {
  coordinateM: number;
  intensity: number;
  normalized: number;
};

export type ImageCrossSections2D = {
  horizontal: CrossSectionSample[];
  vertical: CrossSectionSample[];
  centerUIndex: number;
  centerVIndex: number;
  peakIntensity: number;
};

export function crossSectionsThroughPeak(field: FieldOutput2D): ImageCrossSections2D {
  const peak = peakPixel2D(field.intensity, field.width);
  const horizontal: CrossSectionSample[] = [];
  const vertical: CrossSectionSample[] = [];

  for (let uIndex = 0; uIndex < field.width; uIndex += 1) {
    const index = peak.vIndex * field.width + uIndex;
    const { uM } = pixelCoordinateM(field, uIndex, peak.vIndex);
    const intensity = field.intensity[index] ?? 0;
    horizontal.push({
      coordinateM: uM,
      intensity,
      normalized: peak.value > 0 ? intensity / peak.value : 0
    });
  }

  for (let vIndex = 0; vIndex < field.height; vIndex += 1) {
    const index = vIndex * field.width + peak.uIndex;
    const { vM } = pixelCoordinateM(field, peak.uIndex, vIndex);
    const intensity = field.intensity[index] ?? 0;
    vertical.push({
      coordinateM: vM,
      intensity,
      normalized: peak.value > 0 ? intensity / peak.value : 0
    });
  }

  return {
    horizontal,
    vertical,
    centerUIndex: peak.uIndex,
    centerVIndex: peak.vIndex,
    peakIntensity: peak.value
  };
}
