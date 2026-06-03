import { describe, expect, it } from "vitest";
import { l4AbsorbingFilmTmm, l4BareGlassTmm, l4QuarterWaveArTmm } from "../validation/fixturesL4";
import { runPlanarFieldMonitor } from "./planarFieldMonitor";
import { runPlanarTmm } from "./planarTmm";

describe("L4.2 planar TMM field monitor", () => {
  it("matches transmitted flux for a bare lossless interface", () => {
    const tmm = runPlanarTmm(l4BareGlassTmm);
    const monitor = runPlanarFieldMonitor(l4BareGlassTmm, tmm);
    const substrate = monitor.samples.find((sample) => sample.kind === "substrateBoundary");

    expect(substrate?.normalizedPoyntingFlux ?? 0).toBeCloseTo(tmm.transmittance, 12);
    expect(monitor.aggregateLayerAbsorbance).toBeCloseTo(0, 12);
    expect(monitor.samples).toHaveLength(2);
  });

  it("keeps lossless AR layer front/back flux stable", () => {
    const tmm = runPlanarTmm(l4QuarterWaveArTmm);
    const monitor = runPlanarFieldMonitor(l4QuarterWaveArTmm, tmm);
    const layer = monitor.layerFlux[0];

    expect(layer?.rawAbsorbedFlux ?? 1).toBeCloseTo(0, 10);
    expect(monitor.aggregateLayerAbsorbance).toBeCloseTo(tmm.absorbance, 10);
    expect(monitor.maxElectricIntensity).toBeGreaterThan(0);
  });

  it("estimates lossy-layer absorption from planar flux drop", () => {
    const tmm = runPlanarTmm(l4AbsorbingFilmTmm);
    const monitor = runPlanarFieldMonitor(l4AbsorbingFilmTmm, tmm);
    const layer = monitor.layerFlux[0];

    expect(layer?.absorbedFlux ?? 0).toBeGreaterThan(0.01);
    expect(monitor.aggregateLayerAbsorbance).toBeCloseTo(tmm.absorbance, 5);
    expect(monitor.provenance.limitations.join(" ")).toContain("not a general 3D Maxwell field solution");
  });

  it("is deterministic and sensitive to layer thickness", () => {
    const a = runPlanarFieldMonitor(l4QuarterWaveArTmm);
    const b = runPlanarFieldMonitor(structuredClone(l4QuarterWaveArTmm));
    const c = runPlanarFieldMonitor({
      ...l4QuarterWaveArTmm,
      layers: l4QuarterWaveArTmm.layers.map((layer) => ({ ...layer, thicknessM: layer.thicknessM * 1.1 }))
    });

    expect(a.resultHash).toBe(b.resultHash);
    expect(a.resultHash).not.toBe(c.resultHash);
  });
});
