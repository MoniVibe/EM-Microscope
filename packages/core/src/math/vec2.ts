export type Vec2 = {
  x: number;
  y: number;
};

export function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

export function lengthSquared(v: Vec2): number {
  return dot(v, v);
}

export function length(v: Vec2): number {
  return Math.sqrt(lengthSquared(v));
}

export function normalize(v: Vec2): Vec2 {
  const len = length(v);
  if (len === 0) {
    throw new Error("Cannot normalize a zero-length vector");
  }
  return scale(v, 1 / len);
}

export function negate(v: Vec2): Vec2 {
  return { x: -v.x, y: -v.y };
}

export function distance(a: Vec2, b: Vec2): number {
  return length(sub(a, b));
}

export function angleBetween(a: Vec2, b: Vec2): number {
  const denominator = length(a) * length(b);
  if (denominator === 0) return 0;
  const c = Math.min(1, Math.max(-1, dot(a, b) / denominator));
  return Math.acos(c);
}
