import type { ImageCalibration2D, MeasuredImage2D } from "../scene/schema";

export type PixelSizeM2D = {
  pixelSizeUM: number;
  pixelSizeVM: number;
};

export type PixelPoint2D = {
  xPx: number;
  yPx: number;
};

export type ObjectPointM2D = {
  uM: number;
  vM: number;
};

export function calibratedPixelSizeM(calibration?: ImageCalibration2D): PixelSizeM2D | null {
  if (!calibration?.pixelSizeUM || !calibration.pixelSizeVM) return null;
  const magnification = calibration.magnification ?? 1;
  return {
    pixelSizeUM: (calibration.pixelSizeUM * 1e-6) / magnification,
    pixelSizeVM: (calibration.pixelSizeVM * 1e-6) / magnification
  };
}

export function pixelPointToObjectMeters(point: PixelPoint2D, calibration?: ImageCalibration2D): ObjectPointM2D | null {
  const pixelSize = calibratedPixelSizeM(calibration);
  if (!pixelSize) return null;
  return {
    uM: point.xPx * pixelSize.pixelSizeUM,
    vM: point.yPx * pixelSize.pixelSizeVM
  };
}

export function measuredImageCalibrationWarnings2D(image: MeasuredImage2D): string[] {
  const warnings: string[] = [];
  if (!image.calibration?.pixelSizeUM || !image.calibration.pixelSizeVM) {
    warnings.push("Missing measured image pixel size; comparisons cannot report object-space units.");
  }
  if (!image.calibration?.wavelengthM) {
    warnings.push("Missing measured image wavelength metadata.");
  }
  if (image.calibration?.objectiveNA === undefined) {
    warnings.push("Missing measured image objective NA metadata.");
  }
  if (image.pixelDataPolicy === "external-session" && image.provenance.source === "user-import") {
    warnings.push("Measured image pixels are session-only unless a project bundle or embedded data URL is saved.");
  }
  return warnings;
}
