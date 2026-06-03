export function closestIndex(values: Float64Array, target: number): number {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < values.length; index += 1) {
    const distance = Math.abs((values[index] ?? 0) - target);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }
  return bestIndex;
}

export function maxValue(values: Float64Array): number {
  let max = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    max = Math.max(max, value);
  }
  return Number.isFinite(max) ? max : 0;
}

export function expectedSmallAnglePositionM(wavelengthM: number, propagationM: number, pitchM: number, order: number): number {
  return (order * wavelengthM * propagationM) / pitchM;
}

export function normalizedAt(values: Float64Array, index: number): number {
  const peak = maxValue(values);
  return peak > 0 ? (values[index] ?? 0) / peak : 0;
}
