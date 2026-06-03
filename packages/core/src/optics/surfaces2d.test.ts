import { describe, expect, it } from "vitest";
import { intersectSurface2D, type Ray2D, type Surface2D } from "./surfaces2d";

const baseRay: Ray2D = {
  id: "ray",
  sourceId: "source",
  origin: { x: 0, y: 0 },
  dir: { x: 1, y: 0 },
  wavelengthM: 550e-9,
  powerW: 1,
  mediumId: "air",
  alive: true
};

describe("2D surface intersections", () => {
  it("finds a ray-plane hit", () => {
    const surface: Surface2D = {
      id: "plane",
      type: "planeSurface2D",
      label: "Plane",
      vertex: { x: 0.05, y: 0 },
      normal: { x: -1, y: 0 },
      apertureRadiusM: 0.01,
      mediumBeforeId: "air",
      mediumAfterId: "glass",
      interaction: "refract"
    };

    const hit = intersectSurface2D(baseRay, surface);

    expect(hit?.point.x).toBeCloseTo(0.05, 12);
    expect(hit?.point.y).toBeCloseTo(0, 12);
    expect(hit?.aperturePassed).toBe(true);
  });

  it("finds the nearest positive circular surface hit", () => {
    const surface: Surface2D = {
      id: "circle",
      type: "circularSurface2D",
      label: "Circle",
      vertex: { x: 0.05, y: 0 },
      center: { x: 0.1, y: 0 },
      radiusM: 0.05,
      signedRadiusM: 0.05,
      apertureRadiusM: 0.01,
      mediumBeforeId: "air",
      mediumAfterId: "glass",
      interaction: "refract"
    };

    const hit = intersectSurface2D(baseRay, surface);

    expect(hit?.point.x).toBeCloseTo(0.05, 12);
    expect(hit?.normal.x).toBeCloseTo(-1, 12);
  });

  it("rejects hits behind the ray origin", () => {
    const surface: Surface2D = {
      id: "behind",
      type: "planeSurface2D",
      label: "Behind",
      vertex: { x: -0.01, y: 0 },
      normal: { x: -1, y: 0 },
      apertureRadiusM: 0.01,
      mediumBeforeId: "air",
      mediumAfterId: "glass",
      interaction: "refract"
    };

    expect(intersectSurface2D(baseRay, surface)).toBeNull();
  });

  it("reports aperture clipping at the hit point", () => {
    const surface: Surface2D = {
      id: "small",
      type: "planeSurface2D",
      label: "Small",
      vertex: { x: 0.05, y: 0 },
      normal: { x: -1, y: 0 },
      apertureRadiusM: 0.001,
      mediumBeforeId: "air",
      mediumAfterId: "glass",
      interaction: "refract"
    };

    const ray = { ...baseRay, origin: { x: 0, y: 0.002 } };
    const hit = intersectSurface2D(ray, surface);

    expect(hit?.aperturePassed).toBe(false);
  });
});
