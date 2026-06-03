import { describe, expect, it } from "vitest";
import { l34SyntheticPixels } from "../validation/fixturesL34";
import { createMeasuredImage2D, hashMeasuredImagePixels2D, measuredImageHistogram2D } from "./measuredImage2d";

describe("measured image 2D foundation", () => {
  it("hashes normalized measured image pixels deterministically", () => {
    const a = hashMeasuredImagePixels2D(l34SyntheticPixels);
    const b = hashMeasuredImagePixels2D({
      ...l34SyntheticPixels,
      data: new Float32Array(l34SyntheticPixels.data)
    });

    expect(a).toBe(b);
    expect(a).toHaveLength(16);
  });

  it("creates measured image metadata without storing DOM image objects", () => {
    const image = createMeasuredImage2D({
      id: "measured",
      label: "Measured",
      pixels: l34SyntheticPixels,
      importedAtIso: "2026-06-03T00:00:00.000Z",
      pixelDataPolicy: "external-session"
    });

    expect(image.widthPx).toBe(l34SyntheticPixels.widthPx);
    expect(image.heightPx).toBe(l34SyntheticPixels.heightPx);
    expect(image.imageHash).toBe(hashMeasuredImagePixels2D(l34SyntheticPixels));
    expect(image.provenance.kind).toBe("measured");
  });

  it("summarizes measured image histograms and saturation counts", () => {
    const histogram = measuredImageHistogram2D(l34SyntheticPixels, 16);

    expect(histogram.binCount).toBe(16);
    expect(histogram.bins.reduce((sum, value) => sum + value, 0)).toBe(l34SyntheticPixels.widthPx * l34SyntheticPixels.heightPx);
    expect(histogram.saturatedLowCount).toBe(0);
    expect(histogram.saturatedHighCount).toBe(0);
  });
});
