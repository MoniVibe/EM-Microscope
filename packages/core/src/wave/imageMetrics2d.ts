import type { FieldOutput2D } from "../solvers/Solver";

export function pixelCoordinateM(field: FieldOutput2D, uIndex: number, vIndex: number): { uM: number; vM: number } {
  return {
    uM: field.uMinM + uIndex * ((field.uMaxM - field.uMinM) / field.width),
    vM: field.vMinM + vIndex * ((field.vMaxM - field.vMinM) / field.height)
  };
}

export function peakPixel2D(intensity: Float64Array, width: number): { index: number; uIndex: number; vIndex: number; value: number } {
  let index = 0;
  let value = Number.NEGATIVE_INFINITY;
  for (let candidate = 0; candidate < intensity.length; candidate += 1) {
    const candidateValue = intensity[candidate] ?? 0;
    if (candidateValue > value) {
      index = candidate;
      value = candidateValue;
    }
  }
  return {
    index,
    uIndex: index % width,
    vIndex: Math.floor(index / width),
    value
  };
}

export function centralRowMinimumNear(field: FieldOutput2D, radiusM: number, lowerFactor = 0.6, upperFactor = 1.6): { uIndex: number; radiusM: number; normalized: number } {
  const peak = peakPixel2D(field.intensity, field.width).value;
  const centerV = Math.floor(field.height / 2);
  const centerU = Math.floor(field.width / 2);
  let best = {
    uIndex: centerU,
    radiusM: 0,
    normalized: Number.POSITIVE_INFINITY
  };

  for (let uIndex = centerU; uIndex < field.width; uIndex += 1) {
    const { uM } = pixelCoordinateM(field, uIndex, centerV);
    const candidateRadiusM = Math.abs(uM);
    if (candidateRadiusM < radiusM * lowerFactor || candidateRadiusM > radiusM * upperFactor) continue;
    const index = centerV * field.width + uIndex;
    const normalized = peak > 0 ? (field.intensity[index] ?? 0) / peak : 0;
    if (normalized < best.normalized) {
      best = {
        uIndex,
        radiusM: candidateRadiusM,
        normalized
      };
    }
  }

  return best;
}
