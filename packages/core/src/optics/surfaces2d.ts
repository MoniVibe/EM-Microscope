import { nearestPositiveRoot, solveQuadratic } from "../math/quadratic";
import { add, dot, normalize, scale, sub, type Vec2 } from "../math/vec2";

export type Ray2D = {
  id: string;
  sourceId: string;
  origin: Vec2;
  dir: Vec2;
  wavelengthM: number;
  powerW: number;
  mediumId: string;
  alive: boolean;
  clippedBy?: string;
};

export type Surface2D =
  | {
      id: string;
      type: "planeSurface2D";
      label: string;
      vertex: Vec2;
      normal: Vec2;
      apertureRadiusM: number;
      mediumBeforeId: string;
      mediumAfterId: string;
      interaction: "refract" | "reflect" | "autoTir";
    }
  | {
      id: string;
      type: "circularSurface2D";
      label: string;
      vertex: Vec2;
      center: Vec2;
      radiusM: number;
      signedRadiusM: number;
      apertureRadiusM: number;
      mediumBeforeId: string;
      mediumAfterId: string;
      interaction: "refract" | "reflect" | "autoTir";
    };

export type SurfaceHit2D = {
  surface: Surface2D;
  point: Vec2;
  normal: Vec2;
  t: number;
  aperturePassed: boolean;
};

export function intersectSurface2D(ray: Ray2D, surface: Surface2D, epsilon = 1e-10): SurfaceHit2D | null {
  if (surface.type === "planeSurface2D") {
    return intersectPlaneSurface2D(ray, surface, epsilon);
  }
  return intersectCircularSurface2D(ray, surface, epsilon);
}

export function intersectPlaneSurface2D(
  ray: Ray2D,
  surface: Extract<Surface2D, { type: "planeSurface2D" }>,
  epsilon = 1e-10
): SurfaceHit2D | null {
  const denominator = dot(ray.dir, surface.normal);
  if (Math.abs(denominator) < 1e-14) return null;

  const t = dot(sub(surface.vertex, ray.origin), surface.normal) / denominator;
  if (t <= epsilon) return null;

  const point = add(ray.origin, scale(ray.dir, t));
  return {
    surface,
    point,
    normal: normalize(surface.normal),
    t,
    aperturePassed: Math.abs(point.y - surface.vertex.y) <= surface.apertureRadiusM + 1e-14
  };
}

export function intersectCircularSurface2D(
  ray: Ray2D,
  surface: Extract<Surface2D, { type: "circularSurface2D" }>,
  epsilon = 1e-10
): SurfaceHit2D | null {
  const oc = sub(ray.origin, surface.center);
  const a = dot(ray.dir, ray.dir);
  const b = 2 * dot(ray.dir, oc);
  const c = dot(oc, oc) - surface.radiusM * surface.radiusM;
  const roots = solveQuadratic(a, b, c);
  const t = nearestPositiveRoot(roots.roots, epsilon);
  if (t === null) return null;

  const point = add(ray.origin, scale(ray.dir, t));
  const normal = normalize(sub(point, surface.center));
  return {
    surface,
    point,
    normal,
    t,
    aperturePassed: Math.abs(point.y - surface.vertex.y) <= surface.apertureRadiusM + 1e-14
  };
}

export function surfaceVertexXM(surface: Surface2D): number {
  return surface.vertex.x;
}
