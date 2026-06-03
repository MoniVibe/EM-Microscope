import type { DetectorHistogram, DetectorHit } from "../optics/detectors";

export function detectorHitsToCsv(hits: DetectorHit[]): string {
  const header = "detectorId,rayId,sourceId,yM,slope,powerW,wavelengthM";
  const rows = hits.map((hit) =>
    [hit.detectorId, hit.rayId, hit.sourceId, hit.yM, hit.slope, hit.powerW, hit.wavelengthM].join(",")
  );
  return [header, ...rows].join("\n");
}

export function detectorHistogramToCsv(histogram: DetectorHistogram): string {
  const header = "detectorId,binIndex,yMinM,yMaxM,powerW,rayCount";
  const rows = histogram.bins.map((bin) =>
    [histogram.detectorId, bin.index, bin.yMinM, bin.yMaxM, bin.powerW, bin.rayCount].join(",")
  );
  return [header, ...rows].join("\n");
}
