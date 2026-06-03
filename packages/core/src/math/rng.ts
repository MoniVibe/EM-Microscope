export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededJitterCentered(seed: number, index: number, amplitude: number): number {
  const random = mulberry32((seed + Math.imul(index + 1, 0x9e3779b9)) >>> 0);
  return (random() - 0.5) * amplitude;
}
