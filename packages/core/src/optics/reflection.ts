import { dot, scale, sub, normalize, type Vec2 } from "../math/vec2";

export function reflectDirection(incident: Vec2, normal: Vec2): Vec2 {
  return normalize(sub(incident, scale(normal, 2 * dot(incident, normal))));
}
