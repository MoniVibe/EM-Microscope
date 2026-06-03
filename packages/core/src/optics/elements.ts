import type { ApertureElement, ThinLensElement } from "../scene/schema";
import type { Ray } from "./ray";

export function propagateRayToX(ray: Ray, xM: number): Ray {
  const dx = xM - ray.x;
  return {
    ...ray,
    x: xM,
    y: ray.y + ray.slope * dx
  };
}

export function applyAperture(ray: Ray, aperture: ApertureElement): Ray {
  const halfDiameter = aperture.diameterM / 2;
  if (Math.abs(ray.y - aperture.yCenterM) <= halfDiameter + 1e-15) {
    return ray;
  }

  return {
    ...ray,
    alive: false,
    clippedBy: aperture.id
  };
}

export function applyThinLens(ray: Ray, lens: ThinLensElement): Ray {
  const centeredY = ray.y - lens.yCenterM;
  const halfAperture = lens.clearApertureM / 2;
  if (Math.abs(centeredY) > halfAperture + 1e-15) {
    return {
      ...ray,
      alive: false,
      clippedBy: lens.id
    };
  }

  return {
    ...ray,
    slope: ray.slope - centeredY / lens.focalLengthM
  };
}
