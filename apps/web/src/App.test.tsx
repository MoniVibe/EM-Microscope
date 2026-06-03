import { describe, expect, it } from "vitest";
import { solverDisclosureFor } from "./App";

describe("solver disclosure copy", () => {
  it("labels the L2 result as a 1D scalar slice without claiming a full PSF", () => {
    const disclosure = solverDisclosureFor("scalar.angularSpectrum.l2.1d");

    expect(disclosure.label).toBe("L2 scalar 1D field propagation");
    expect(disclosure.detail).toBe("1D transverse slice; not a full circular-aperture Airy disk");
    expect(`${disclosure.label} ${disclosure.detail}`).not.toMatch(/Airy disk simulated|full PSF/i);
  });
});
