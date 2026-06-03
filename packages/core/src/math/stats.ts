export type WeightedStats = {
  count: number;
  totalWeight: number;
  centroid: number | null;
  rmsRadius: number | null;
  min: number | null;
  max: number | null;
};

export function weightedStats(values: Array<{ value: number; weight: number }>): WeightedStats {
  if (values.length === 0) {
    return {
      count: 0,
      totalWeight: 0,
      centroid: null,
      rmsRadius: null,
      min: null,
      max: null
    };
  }

  let totalWeight = 0;
  let weightedSum = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const { value, weight } of values) {
    totalWeight += weight;
    weightedSum += value * weight;
    min = Math.min(min, value);
    max = Math.max(max, value);
  }

  if (totalWeight === 0) {
    return {
      count: values.length,
      totalWeight,
      centroid: null,
      rmsRadius: null,
      min,
      max
    };
  }

  const centroid = weightedSum / totalWeight;
  let weightedRadius2 = 0;
  for (const { value, weight } of values) {
    const d = value - centroid;
    weightedRadius2 += d * d * weight;
  }

  return {
    count: values.length,
    totalWeight,
    centroid,
    rmsRadius: Math.sqrt(weightedRadius2 / totalWeight),
    min,
    max
  };
}
