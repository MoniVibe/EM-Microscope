import type { FieldOutput2D } from "../solvers/Solver";

export function michelsonContrast(values: ArrayLike<number>, lowerPercentile = 0.05, upperPercentile = 0.95): number | null {
  const finite = Array.from(values).filter((value) => Number.isFinite(value));
  if (finite.length < 2) return null;
  finite.sort((a, b) => a - b);
  const low = percentileSorted(finite, lowerPercentile);
  const high = percentileSorted(finite, upperPercentile);
  const denominator = high + low;
  if (denominator <= 0) return null;
  return Math.max(0, Math.min(1, (high - low) / denominator));
}

export function centralRowIntensity(field: FieldOutput2D): Float64Array {
  const row = Math.floor(field.height / 2);
  const values = new Float64Array(field.width);
  for (let uIndex = 0; uIndex < field.width; uIndex += 1) {
    values[uIndex] = field.intensity[row * field.width + uIndex] ?? 0;
  }
  return values;
}

export function centralColumnIntensity(field: FieldOutput2D): Float64Array {
  const column = Math.floor(field.width / 2);
  const values = new Float64Array(field.height);
  for (let vIndex = 0; vIndex < field.height; vIndex += 1) {
    values[vIndex] = field.intensity[vIndex * field.width + column] ?? 0;
  }
  return values;
}

export function fullFieldContrast(field: FieldOutput2D): number | null {
  return michelsonContrast(field.intensity);
}

function percentileSorted(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const clamped = Math.min(Math.max(percentile, 0), 1);
  const index = Math.min(values.length - 1, Math.max(0, Math.round(clamped * (values.length - 1))));
  return values[index] ?? 0;
}
