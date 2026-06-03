import type { Scene, ThinLensElement } from "../scene/schema";

export type NAReadout = {
  lensId: string;
  thetaRad: number;
  numericalAperture: number;
  airyRadiusM: number | null;
  provenance: "analytic paraxial estimate";
};

export function computeNAReadouts(scene: Scene): NAReadout[] {
  return scene.elements
    .filter((element): element is ThinLensElement => element.type === "thinLens")
    .map((lens) => computeNAReadout(lens, scene.environment.ambientRefractiveIndex, scene.environment.defaultWavelengthM));
}

export function computeNAReadout(lens: ThinLensElement, refractiveIndex: number, wavelengthM: number): NAReadout {
  const radiusM = lens.clearApertureM / 2;
  const thetaRad = Math.atan(radiusM / Math.abs(lens.focalLengthM));
  const numericalAperture = refractiveIndex * Math.sin(thetaRad);
  return {
    lensId: lens.id,
    thetaRad,
    numericalAperture,
    airyRadiusM: numericalAperture > 0 ? (0.61 * wavelengthM) / numericalAperture : null,
    provenance: "analytic paraxial estimate"
  };
}
