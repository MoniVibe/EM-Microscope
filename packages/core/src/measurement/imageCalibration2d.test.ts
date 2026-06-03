import { describe, expect, it } from "vitest";
import { l34MeasuredImage } from "../validation/fixturesL34";
import { calibratedPixelSizeM, measuredImageCalibrationWarnings2D, pixelPointToObjectMeters } from "./imageCalibration2d";

describe("measured image calibration 2D", () => {
  it("converts calibrated pixel size to object-space meters exactly", () => {
    const pixelSize = calibratedPixelSizeM({ pixelSizeUM: 0.5, pixelSizeVM: 0.75, magnification: 10 });

    expect(pixelSize?.pixelSizeUM).toBeCloseTo(0.05e-6, 15);
    expect(pixelSize?.pixelSizeVM).toBeCloseTo(0.075e-6, 15);
  });

  it("maps pixel coordinates into calibrated object-space offsets", () => {
    const point = pixelPointToObjectMeters({ xPx: 20, yPx: 10 }, { pixelSizeUM: 0.5, pixelSizeVM: 1, magnification: 5 });

    expect(point?.uM).toBeCloseTo(2e-6, 15);
    expect(point?.vM).toBeCloseTo(2e-6, 15);
  });

  it("warns when imported image metadata is missing comparison-critical calibration", () => {
    const warnings = measuredImageCalibrationWarnings2D({
      ...l34MeasuredImage,
      calibration: undefined
    });

    expect(warnings.some((warning) => warning.includes("pixel size"))).toBe(true);
    expect(warnings.some((warning) => warning.includes("wavelength"))).toBe(true);
  });
});
