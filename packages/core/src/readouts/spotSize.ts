import type { DetectorHistogram } from "../optics/detectors";

export type SpotReadout = {
  detectorId: string;
  rayCount: number;
  totalPowerW: number;
  centroidM: number | null;
  rmsRadiusM: number | null;
  provenance: "geometric detector RMS";
};

export function computeSpotReadouts(histograms: DetectorHistogram[]): SpotReadout[] {
  return histograms.map((histogram) => ({
    detectorId: histogram.detectorId,
    rayCount: histogram.rayCount,
    totalPowerW: histogram.totalPowerW,
    centroidM: histogram.centroidM,
    rmsRadiusM: histogram.rmsRadiusM,
    provenance: "geometric detector RMS"
  }));
}
