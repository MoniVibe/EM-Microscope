import { describe, expect, it } from "vitest";
import { fieldOutputFromMeasuredPixels2D, l34bLinePairPixels } from "../validation/fixturesL34b";
import { createResidualMap2D, resampleFieldToMeasuredPixels2D } from "./residualMaps2d";

describe("L3.4B residual maps", () => {
  it("creates finite signed, absolute, and normalized residual maps with stable dimensions", () => {
    const measured = {
      widthPx: 4,
      heightPx: 2,
      data: new Float32Array([0, 0.25, 0.5, 1, 0.1, 0.2, 0.3, 0.4])
    };
    const simulated = {
      widthPx: 4,
      heightPx: 2,
      data: new Float32Array([0.1, 0.2, 0.4, 0.8, 0.1, 0.1, 0.4, 0.5])
    };
    const signed = createResidualMap2D({ measured, simulated, mode: "signed" });
    const absolute = createResidualMap2D({ measured, simulated, mode: "absolute" });
    const normalized = createResidualMap2D({ measured, simulated, mode: "normalized" });
    expect(signed.width).toBe(4);
    expect(signed.height).toBe(2);
    expect(signed.rms).toBeGreaterThan(0);
    expect(absolute.min).toBeGreaterThanOrEqual(0);
    expect(Math.max(...normalized.values)).toBeLessThanOrEqual(1);
    expect(signed.resultHash).toBe(createResidualMap2D({ measured, simulated, mode: "signed" }).resultHash);
  });

  it("resamples simulated fields explicitly before residual comparison", () => {
    const field = fieldOutputFromMeasuredPixels2D("line-pair-field", l34bLinePairPixels);
    const resampled = resampleFieldToMeasuredPixels2D(field, 32, 16);
    expect(resampled.length).toBe(32 * 16);
    expect(Math.max(...resampled)).toBeLessThanOrEqual(1);
  });
});
