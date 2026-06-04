import { describe, expect, it } from "vitest";
import {
  coherenceDemonstratorCsv,
  coherenceDemonstratorJson,
  coherenceDemonstratorMarkdown,
  defaultCoherenceDemonstratorConfig,
  runCoherenceDemonstrator
} from "./coherenceDemonstrator";

describe("L6.5 coherence demonstrator", () => {
  it("renders coherent, incoherent, and partial-coherence modes", () => {
    const coherent = runCoherenceDemonstrator({ mode: "coherent-fields" });
    const partial = runCoherenceDemonstrator({ mode: "partial-coherence", coherence: { gammaMagnitude: 0.5, gammaPhaseRad: 0 } });
    const incoherent = runCoherenceDemonstrator({ mode: "incoherent-intensities" });

    expect(coherent.config.mode).toBe("coherent-fields");
    expect(partial.config.mode).toBe("partial-coherence");
    expect(incoherent.config.mode).toBe("incoherent-intensities");
    expect(coherent.coherentField.id).toContain("coherent-map");
    expect(partial.partialField.id).toContain("partial-map");
    expect(incoherent.incoherentField.id).toContain("incoherent-map");
  });

  it("uses gamma=1 to preserve strong interference fringes", () => {
    const result = runCoherenceDemonstrator({ mode: "partial-coherence", coherence: { gammaMagnitude: 1, gammaPhaseRad: 0 } });

    expect(result.visibility.measured).toBeGreaterThan(0.94);
    expect(result.visibility.expected).toBe(1);
    expect(result.formulas.coherentFields).toBe("Icoh = |U1 + U2|^2");
  });

  it("uses gamma=0 to remove the interference term", () => {
    const result = runCoherenceDemonstrator({ mode: "partial-coherence", coherence: { gammaMagnitude: 0, gammaPhaseRad: 0 } });

    expect(result.visibility.measured).toBeLessThan(0.06);
    expect(result.visibility.expected).toBe(0);
    expect(result.profile.some((sample) => Math.abs(sample.interferenceTerm) > 1e-12)).toBe(false);
  });

  it("uses intermediate gamma to reduce fringe visibility", () => {
    const gamma1 = runCoherenceDemonstrator({ mode: "partial-coherence", coherence: { gammaMagnitude: 1, gammaPhaseRad: 0 } });
    const gamma05 = runCoherenceDemonstrator({ mode: "partial-coherence", coherence: { gammaMagnitude: 0.5, gammaPhaseRad: 0 } });
    const gamma0 = runCoherenceDemonstrator({ mode: "partial-coherence", coherence: { gammaMagnitude: 0, gammaPhaseRad: 0 } });

    expect(gamma05.visibility.measured).toBeGreaterThan(gamma0.visibility.measured);
    expect(gamma05.visibility.measured).toBeLessThan(gamma1.visibility.measured);
    expect(gamma05.visibility.measured).toBeCloseTo(0.5, 1);
  });

  it("reports V=(Imax-Imin)/(Imax+Imin) and tracks gamma for equal slits", () => {
    const result = runCoherenceDemonstrator({ mode: "partial-coherence", coherence: { gammaMagnitude: 0.75, gammaPhaseRad: 0 } });
    const recomputed = (result.visibility.maxIntensity - result.visibility.minIntensity) / (result.visibility.maxIntensity + result.visibility.minIntensity);

    expect(result.visibility.formula).toBe("V = (Imax - Imin) / (Imax + Imin)");
    expect(result.visibility.measured).toBeCloseTo(recomputed, 12);
    expect(result.visibility.measured).toBeCloseTo(0.75, 1);
    expect(result.visibility.error).toBeLessThan(0.08);
  });

  it("keeps default double-slit order spacing near 5 mm", () => {
    const result = runCoherenceDemonstrator();
    const coreOrders = result.expected.features.filter((feature) => Math.abs(feature.order) <= 2);

    expect(result.expected.orderSpacingSmallAngleM).toBeCloseTo(5e-3, 12);
    expect(result.formulas.doubleSlitOrders).toBe("d sin(theta) = m lambda");
    expect(coreOrders).toHaveLength(5);
    for (const feature of coreOrders) {
      expect(feature.visible).toBe(true);
      expect(feature.measuredPositionM).not.toBeNull();
      expect(feature.errorM ?? Infinity).toBeLessThan(0.15e-3);
    }
  });

  it("exports coherence parameters, formulas, visibility, and limitations", () => {
    const result = runCoherenceDemonstrator({ mode: "partial-coherence", coherence: { gammaMagnitude: 0.5, gammaPhaseRad: 0 } });
    const json = JSON.stringify(coherenceDemonstratorJson(result));
    const markdown = coherenceDemonstratorMarkdown(result);
    const csv = coherenceDemonstratorCsv(result);

    expect(json).toContain("emmicro.coherenceDemonstrator.v1");
    expect(json).toContain("I = |U1|^2 + |U2|^2 + 2 Re(gamma12 U1 U2*)");
    expect(markdown).toContain("Degree of coherence |gamma12|: 0.500");
    expect(markdown).toContain("V = (Imax - Imin) / (Imax + Imin)");
    expect(markdown).toContain("not a full stochastic/vector 3D Maxwell source model");
    expect(csv).toContain("visibility_measured");
    expect(`${json}\n${markdown}\n${csv}`).not.toMatch(/full stochastic 3D Maxwell simulated|FDTD coherence simulation|real source statistics engine executed/i);
  });

  it("rejects invalid gamma values", () => {
    expect(() => runCoherenceDemonstrator({ coherence: { gammaMagnitude: -0.1, gammaPhaseRad: 0 } })).toThrow(/gamma magnitude/);
    expect(() => runCoherenceDemonstrator({ coherence: { gammaMagnitude: 1.1, gammaPhaseRad: 0 } })).toThrow(/gamma magnitude/);
  });

  it("warns on under-sampled coherence propagation", () => {
    const result = runCoherenceDemonstrator({
      numerical: {
        ...defaultCoherenceDemonstratorConfig().numerical,
        apertureSamplesPerSlit: 48
      },
      observationPlane: {
        ...defaultCoherenceDemonstratorConfig().observationPlane,
        widthSamples: 65
      }
    });

    expect(result.warnings.some((warning) => warning.code === "validation.coherence.underResolved")).toBe(true);
  });
});
