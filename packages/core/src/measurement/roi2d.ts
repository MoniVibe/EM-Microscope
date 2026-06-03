import type { MeasurementRoi2D, MeasuredImage2D } from "../scene/schema";
import type { MeasuredImagePixels2D } from "./measuredImage2d";
import { validateMeasuredImagePixels2D } from "./measuredImage2d";

export type RoiImagePoint2D = {
  xPx: number;
  yPx: number;
};

export type ExtractedRoiPixels2D = {
  widthPx: number;
  heightPx: number;
  data: Float32Array;
};

export function mapRoiPixelToImagePixel(roi: MeasurementRoi2D, localXPx: number, localYPx: number): RoiImagePoint2D {
  const rotationRad = roi.rotationRad ?? 0;
  const centerXPx = roi.xPx + roi.widthPx / 2;
  const centerYPx = roi.yPx + roi.heightPx / 2;
  const relXPx = localXPx - roi.widthPx / 2;
  const relYPx = localYPx - roi.heightPx / 2;
  return {
    xPx: centerXPx + relXPx * Math.cos(rotationRad) - relYPx * Math.sin(rotationRad),
    yPx: centerYPx + relXPx * Math.sin(rotationRad) + relYPx * Math.cos(rotationRad)
  };
}

export function roiCornersPx(roi: MeasurementRoi2D): RoiImagePoint2D[] {
  return [
    mapRoiPixelToImagePixel(roi, 0, 0),
    mapRoiPixelToImagePixel(roi, roi.widthPx, 0),
    mapRoiPixelToImagePixel(roi, roi.widthPx, roi.heightPx),
    mapRoiPixelToImagePixel(roi, 0, roi.heightPx)
  ];
}

export function roiWithinImage2D(roi: MeasurementRoi2D, image: Pick<MeasuredImage2D, "widthPx" | "heightPx">): boolean {
  return roiCornersPx(roi).every((point) => point.xPx >= 0 && point.yPx >= 0 && point.xPx <= image.widthPx && point.yPx <= image.heightPx);
}

export function measurementRoiWarnings2D(roi: MeasurementRoi2D, image?: Pick<MeasuredImage2D, "id" | "widthPx" | "heightPx">): string[] {
  const warnings: string[] = [];
  if (!image) {
    warnings.push(`ROI ${roi.label} references a missing measured image.`);
    return warnings;
  }
  if (!roiWithinImage2D(roi, image)) {
    warnings.push(`ROI ${roi.label} extends outside measured image bounds.`);
  }
  if (roi.widthPx < 8 || roi.heightPx < 8) {
    warnings.push(`ROI ${roi.label} is very small for measured target metrics.`);
  }
  return warnings;
}

export function extractMeasurementRoi2D(image: MeasuredImagePixels2D, roi: MeasurementRoi2D): ExtractedRoiPixels2D {
  validateMeasuredImagePixels2D(image);
  const widthPx = Math.max(1, Math.round(roi.widthPx));
  const heightPx = Math.max(1, Math.round(roi.heightPx));
  const output = new Float32Array(widthPx * heightPx);
  for (let y = 0; y < heightPx; y += 1) {
    for (let x = 0; x < widthPx; x += 1) {
      const source = mapRoiPixelToImagePixel(roi, x + 0.5, y + 0.5);
      output[y * widthPx + x] = sampleNearestGrayscale(image, source.xPx, source.yPx);
    }
  }
  return { widthPx, heightPx, data: output };
}

function sampleNearestGrayscale(image: MeasuredImagePixels2D, xPx: number, yPx: number): number {
  const x = Math.round(xPx);
  const y = Math.round(yPx);
  if (x < 0 || y < 0 || x >= image.widthPx || y >= image.heightPx) return 0;
  if (image.channels === "grayscale") {
    return image.data[y * image.widthPx + x] ?? 0;
  }
  const index = (y * image.widthPx + x) * 3;
  return 0.2126 * (image.data[index] ?? 0) + 0.7152 * (image.data[index + 1] ?? 0) + 0.0722 * (image.data[index + 2] ?? 0);
}
