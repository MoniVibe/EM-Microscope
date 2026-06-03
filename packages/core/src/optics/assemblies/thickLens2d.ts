import type { ThickLens2DElement } from "../../scene/schema";
import type { Surface2D } from "../surfaces2d";

export type LensmakerReadout = {
  elementId: string;
  effectiveFocalLengthM: number;
  backFocalLengthM: number;
  provenance: "analytic.paraxial";
};

export function surfacesForThickLens2D(
  lens: ThickLens2DElement,
  surroundingMediumId: string
): [Surface2D, Surface2D] {
  const lensMediumId = lens.mediumId;
  const apertureRadiusM = lens.apertureDiameterM / 2;
  const r1 = lens.radius1M;
  const r2 = lens.radius2M;
  const vertex1 = { x: lens.xM, y: lens.yCenterM };
  const vertex2 = { x: lens.xM + lens.thicknessM, y: lens.yCenterM };

  return [
    {
      id: `${lens.id}:surface:front`,
      type: "circularSurface2D",
      label: `${lens.label} front surface`,
      vertex: vertex1,
      center: { x: lens.xM + r1, y: lens.yCenterM },
      radiusM: Math.abs(r1),
      signedRadiusM: r1,
      apertureRadiusM,
      mediumBeforeId: surroundingMediumId,
      mediumAfterId: lensMediumId,
      interaction: "autoTir"
    },
    {
      id: `${lens.id}:surface:back`,
      type: "circularSurface2D",
      label: `${lens.label} back surface`,
      vertex: vertex2,
      center: { x: lens.xM + lens.thicknessM + r2, y: lens.yCenterM },
      radiusM: Math.abs(r2),
      signedRadiusM: r2,
      apertureRadiusM,
      mediumBeforeId: lensMediumId,
      mediumAfterId: surroundingMediumId,
      interaction: "autoTir"
    }
  ];
}

export function lensmakerThickLensInAir(lens: ThickLens2DElement): LensmakerReadout {
  const n = lens.material.refractiveIndex;
  const r1 = lens.radius1M;
  const r2 = lens.radius2M;
  const t = lens.thicknessM;
  const inverseF = (n - 1) * (1 / r1 - 1 / r2 + ((n - 1) * t) / (n * r1 * r2));
  const effectiveFocalLengthM = 1 / inverseF;
  return {
    elementId: lens.id,
    effectiveFocalLengthM,
    backFocalLengthM: effectiveFocalLengthM * (1 - ((n - 1) * t) / (n * r1)),
    provenance: "analytic.paraxial"
  };
}
