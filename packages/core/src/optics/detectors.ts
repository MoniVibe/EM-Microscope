import { weightedStats } from "../math/stats";
import type { DetectorElement } from "../scene/schema";
import type { Ray } from "./ray";

export type DetectorHit = {
  detectorId: string;
  rayId: string;
  sourceId: string;
  yM: number;
  slope: number;
  powerW: number;
  wavelengthM: number;
};

export type DetectorHistogramBin = {
  index: number;
  yMinM: number;
  yMaxM: number;
  powerW: number;
  rayCount: number;
};

export type DetectorHistogram = {
  detectorId: string;
  bins: DetectorHistogramBin[];
  totalPowerW: number;
  rayCount: number;
  centroidM: number | null;
  rmsRadiusM: number | null;
  minYM: number | null;
  maxYM: number | null;
};

export function hitDetector(ray: Ray, detector: DetectorElement): DetectorHit | null {
  const halfHeight = detector.heightM / 2;
  if (Math.abs(ray.y - detector.yCenterM) > halfHeight + 1e-15) {
    return null;
  }

  return {
    detectorId: detector.id,
    rayId: ray.id,
    sourceId: ray.sourceId,
    yM: ray.y,
    slope: ray.slope,
    powerW: ray.powerW,
    wavelengthM: ray.wavelengthM
  };
}

export function buildDetectorHistogram(detector: DetectorElement, hits: DetectorHit[]): DetectorHistogram {
  const bins = Array.from({ length: detector.bins }, (_, index) => {
    const yMinM = detector.yCenterM - detector.heightM / 2 + (index / detector.bins) * detector.heightM;
    return {
      index,
      yMinM,
      yMaxM: yMinM + detector.heightM / detector.bins,
      powerW: 0,
      rayCount: 0
    };
  });

  for (const hit of hits) {
    if (hit.detectorId !== detector.id) continue;
    const relative = (hit.yM - (detector.yCenterM - detector.heightM / 2)) / detector.heightM;
    const index = Math.min(detector.bins - 1, Math.max(0, Math.floor(relative * detector.bins)));
    const bin = bins[index];
    if (!bin) continue;
    bin.powerW += hit.powerW;
    bin.rayCount += 1;
  }

  const stats = weightedStats(
    hits
      .filter((hit) => hit.detectorId === detector.id)
      .map((hit) => ({ value: hit.yM, weight: hit.powerW }))
  );

  return {
    detectorId: detector.id,
    bins,
    totalPowerW: stats.totalWeight,
    rayCount: stats.count,
    centroidM: stats.centroid,
    rmsRadiusM: stats.rmsRadius,
    minYM: stats.min,
    maxYM: stats.max
  };
}
