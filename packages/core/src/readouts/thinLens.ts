import type { Scene, ThinLensElement } from "../scene/schema";

export type ThinLensReadout = {
  lensId: string;
  focalPlaneXM: number;
  objectDistanceM: number | null;
  imageDistanceM: number | null;
  imageXM: number | null;
  magnification: number | null;
  provenance: "analytic paraxial estimate";
  warnings: string[];
};

export function computeThinLensReadouts(scene: Scene): ThinLensReadout[] {
  const firstSource = scene.sources[0];
  if (!firstSource) return [];

  return scene.elements
    .filter((element): element is ThinLensElement => element.type === "thinLens")
    .map((lens) => computeThinLensReadout(lens, sourceXM(firstSource)));
}

function sourceXM(source: Scene["sources"][number]): number {
  return source.xM;
}

export function computeThinLensReadout(lens: ThinLensElement, objectXM: number): ThinLensReadout {
  const warnings: string[] = [];
  const objectDistanceM = lens.xM - objectXM;

  if (objectDistanceM <= 0) {
    return {
      lensId: lens.id,
      focalPlaneXM: lens.xM + lens.focalLengthM,
      objectDistanceM: null,
      imageDistanceM: null,
      imageXM: null,
      magnification: null,
      provenance: "analytic paraxial estimate",
      warnings: ["source is not upstream of this lens"]
    };
  }

  const denominator = 1 / lens.focalLengthM - 1 / objectDistanceM;
  if (Math.abs(denominator) < 1e-12) {
    warnings.push("image distance tends toward infinity because object distance is near focal length");
    return {
      lensId: lens.id,
      focalPlaneXM: lens.xM + lens.focalLengthM,
      objectDistanceM,
      imageDistanceM: null,
      imageXM: null,
      magnification: null,
      provenance: "analytic paraxial estimate",
      warnings
    };
  }

  const imageDistanceM = 1 / denominator;
  return {
    lensId: lens.id,
    focalPlaneXM: lens.xM + lens.focalLengthM,
    objectDistanceM,
    imageDistanceM,
    imageXM: lens.xM + imageDistanceM,
    magnification: -imageDistanceM / objectDistanceM,
    provenance: "analytic paraxial estimate",
    warnings
  };
}
