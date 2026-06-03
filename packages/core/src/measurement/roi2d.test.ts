import { describe, expect, it } from "vitest";
import { l34MeasuredImage, l34MeasurementRoi, l34SyntheticPixels } from "../validation/fixturesL34";
import { extractMeasurementRoi2D, mapRoiPixelToImagePixel, measurementRoiWarnings2D, roiWithinImage2D } from "./roi2d";

describe("measurement ROI 2D", () => {
  it("maps unrotated ROI local pixels back to source image pixels", () => {
    const point = mapRoiPixelToImagePixel(l34MeasurementRoi, 0, 0);

    expect(point.xPx).toBeCloseTo(l34MeasurementRoi.xPx, 12);
    expect(point.yPx).toBeCloseTo(l34MeasurementRoi.yPx, 12);
  });

  it("maps rotated ROI points deterministically around the ROI center", () => {
    const roi = { ...l34MeasurementRoi, widthPx: 10, heightPx: 10, rotationRad: Math.PI / 2 };
    const point = mapRoiPixelToImagePixel(roi, 10, 5);

    expect(point.xPx).toBeCloseTo(roi.xPx + 5, 12);
    expect(point.yPx).toBeCloseTo(roi.yPx + 10, 12);
  });

  it("extracts nearest-neighbor grayscale ROI pixels with expected dimensions", () => {
    const extracted = extractMeasurementRoi2D(l34SyntheticPixels, l34MeasurementRoi);

    expect(extracted.widthPx).toBe(l34MeasurementRoi.widthPx);
    expect(extracted.heightPx).toBe(l34MeasurementRoi.heightPx);
    expect(extracted.data.length).toBe(l34MeasurementRoi.widthPx * l34MeasurementRoi.heightPx);
  });

  it("warns for out-of-bounds ROIs instead of silently rescaling them", () => {
    const roi = { ...l34MeasurementRoi, xPx: 90, widthPx: 20 };

    expect(roiWithinImage2D(roi, l34MeasuredImage)).toBe(false);
    expect(measurementRoiWarnings2D(roi, l34MeasuredImage).some((warning) => warning.includes("outside"))).toBe(true);
  });
});
