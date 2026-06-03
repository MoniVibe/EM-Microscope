import { describe, expect, it } from "vitest";
import { solverDisclosureFor } from "./App";

describe("solver disclosure copy", () => {
  it("labels the L2 result as a 1D scalar slice without claiming a full PSF", () => {
    const disclosure = solverDisclosureFor("scalar.angularSpectrum.l2.1d");

    expect(disclosure.label).toBe("L2 scalar 1D field propagation");
    expect(disclosure.detail).toBe("1D transverse slice; not a full circular-aperture Airy disk");
    expect(`${disclosure.label} ${disclosure.detail}`).not.toMatch(/Airy disk simulated|full PSF simulated|full microscope image simulated/i);
  });

  it("labels L2.5 sample propagation without claiming a microscope image", () => {
    const disclosure = solverDisclosureFor("scalar.angularSpectrum.l2.1d", true);

    expect(disclosure.label).toBe("L2 scalar 1D sample propagation");
    expect(disclosure.detail).toBe("1D coherent transverse slice; not a full microscope image, full PSF, or Airy disk");
    expect(`${disclosure.label} ${disclosure.detail}`).not.toMatch(/Airy disk simulated|full PSF simulated|full microscope image simulated/i);
  });

  it("labels L3 as a coherent scalar 2D approximation without claiming complete microscope physics", () => {
    const disclosure = solverDisclosureFor("scalar.coherent.l3.2d");

    expect(disclosure.label).toBe("L3 coherent 2D scalar image approximation");
    expect(disclosure.detail).toContain("2D coherent scalar image-plane intensity approximation");
    expect(`${disclosure.label} ${disclosure.detail}`).not.toMatch(/full microscope image|true microscope simulation|incoherent imaging|fluorescence simulated|vector PSF|Maxwell solver/i);
  });
});
