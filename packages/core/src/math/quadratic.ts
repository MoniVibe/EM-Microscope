export type QuadraticRoots = {
  discriminant: number;
  roots: number[];
};

export function solveQuadratic(a: number, b: number, c: number, epsilon = 1e-14): QuadraticRoots {
  if (Math.abs(a) < epsilon) {
    if (Math.abs(b) < epsilon) {
      return { discriminant: Number.NaN, roots: [] };
    }
    return { discriminant: b * b, roots: [-c / b] };
  }

  const discriminant = b * b - 4 * a * c;
  if (discriminant < -epsilon) {
    return { discriminant, roots: [] };
  }
  if (Math.abs(discriminant) <= epsilon) {
    return { discriminant, roots: [-b / (2 * a)] };
  }

  const sqrtD = Math.sqrt(discriminant);
  const q = -0.5 * (b + Math.sign(b || 1) * sqrtD);
  const r1 = q / a;
  const r2 = c / q;
  return {
    discriminant,
    roots: [r1, r2].sort((x, y) => x - y)
  };
}

export function nearestPositiveRoot(roots: number[], epsilon = 1e-10): number | null {
  const positive = roots.filter((root) => root > epsilon).sort((a, b) => a - b);
  return positive[0] ?? null;
}
