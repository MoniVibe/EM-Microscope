import { describe, expect, it } from "vitest";
import { l34bDarkPixels, l34bFlatPixels, l34bLinePairPixels, l34bMeasuredImage, l34bPsfSpotPixels, l34bSlantedEdgePixels } from "../validation/fixturesL34b";
import { computeMeasuredRoiMetrics2D, computeRoiMetrics2D } from "./measuredMetrics2d";
import type { MeasurementRoi2D } from "../scene/schema";

describe("L3.4B measured ROI metrics", () => {
  it("computes line-pair Michelson contrast from a measured ROI", () => {
    const roi = roiFor("linePairs", l34bLinePairPixels.widthPx, l34bLinePairPixels.heightPx);
    const metrics = computeMeasuredRoiMetrics2D({ image: l34bMeasuredImage, pixels: l34bLinePairPixels, roi });
    expect(metrics.contrastMichelson).toBeGreaterThan(0.6);
    expect(metrics.provenanceLabel).toContain("not certified ISO 12233");
  });

  it("computes a finite slanted-edge-style SFR estimate", () => {
    const roi = roiFor("slantedEdge", l34bSlantedEdgePixels.widthPx, l34bSlantedEdgePixels.heightPx, (7 * Math.PI) / 180);
    const metrics = computeRoiMetrics2D({ crop: { widthPx: l34bSlantedEdgePixels.widthPx, heightPx: l34bSlantedEdgePixels.heightPx, data: l34bSlantedEdgePixels.data }, roi });
    expect(metrics.slantedEdgeSfr?.edgeContrast).toBeGreaterThan(0.6);
    expect(metrics.slantedEdgeSfr?.sfr50CyclesPerPx).toBeGreaterThan(0);
  });

  it("computes PSF spot centroid and FWHM metrics", () => {
    const roi = roiFor("psfSpot", l34bPsfSpotPixels.widthPx, l34bPsfSpotPixels.heightPx);
    const metrics = computeRoiMetrics2D({ crop: { widthPx: l34bPsfSpotPixels.widthPx, heightPx: l34bPsfSpotPixels.heightPx, data: l34bPsfSpotPixels.data }, roi });
    expect(metrics.psf?.centroidXPx).toBeCloseTo(32.2, 0);
    expect(metrics.psf?.fwhmXPx ?? 0).toBeGreaterThan(5);
    expect(metrics.psf?.edgeEnergyFraction ?? 1).toBeLessThan(0.02);
  });

  it("computes flat and dark frame vocabulary without claiming EMVA compliance", () => {
    const flat = computeRoiMetrics2D({ crop: { widthPx: l34bFlatPixels.widthPx, heightPx: l34bFlatPixels.heightPx, data: l34bFlatPixels.data }, roi: roiFor("flatField", 64, 64) });
    const dark = computeRoiMetrics2D({ crop: { widthPx: l34bDarkPixels.widthPx, heightPx: l34bDarkPixels.heightPx, data: l34bDarkPixels.data }, roi: roiFor("darkFrame", 64, 64) });
    expect(flat.flatDark.nonuniformity ?? 0).toBeGreaterThan(0);
    expect(dark.flatDark.noiseRms).toBeGreaterThan(0);
    expect(`${flat.provenanceLabel} ${dark.provenanceLabel}`).not.toContain("certified EMVA");
  });
});

function roiFor(type: MeasurementRoi2D["type"], widthPx: number, heightPx: number, rotationRad = 0): MeasurementRoi2D {
  return {
    id: `${type}-roi`,
    imageId: l34bMeasuredImage.id,
    label: `${type} ROI`,
    type,
    xPx: 0,
    yPx: 0,
    widthPx,
    heightPx,
    rotationRad
  };
}
