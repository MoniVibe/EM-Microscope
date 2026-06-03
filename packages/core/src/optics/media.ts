import type { Medium, Scene } from "../scene/schema";

export function refractiveIndexForMedium(medium: Medium, wavelengthM: number): number {
  const model = medium.refractiveIndex;
  if (model.kind === "constant") {
    return model.n;
  }
  const lambdaUm = wavelengthM * 1e6;
  return model.A + model.B / (lambdaUm * lambdaUm) + model.C / (lambdaUm ** 4);
}

export function findMedium(scene: Scene, mediumId: string): Medium {
  const medium = scene.mediaCatalog.find((candidate) => candidate.id === mediumId);
  if (!medium) {
    throw new Error(`Unknown medium id: ${mediumId}`);
  }
  return medium;
}

export function refractiveIndexById(scene: Scene, mediumId: string, wavelengthM: number): number {
  return refractiveIndexForMedium(findMedium(scene, mediumId), wavelengthM);
}
