import { describe, expect, it } from "vitest";
import type { CoatingStackDefinition } from "./coatingStack";
import { runCoatingDesignFoundry, visibleArObjective } from "./designFoundry";
import { runCoatingYieldAnalysis } from "./coatingYield";

const poorSingleLayerAr: CoatingStackDefinition = {
  id: "yield-poor-single-layer-ar",
  label: "Poor single-layer AR seed",
  wavelengthM: 550e-9,
  angleRad: 0,
  polarization: "TE",
  incidentMaterialId: "air",
  substrateMaterialId: "bk7",
  layers: [
    {
      id: "layer-mgf2",
      label: "MgF2 coating",
      materialId: "mgf2",
      thicknessM: 35e-9
    }
  ]
};

describe("L5.2 planar coating yield analysis", () => {
  it("reports deterministic yield around a foundry-certified coating", () => {
    const foundry = runCoatingDesignFoundry({
      id: "yield-foundry-visible-ar",
      label: "Yield foundry visible AR",
      seedStack: poorSingleLayerAr,
      objective: visibleArObjective,
      settings: { passes: 2, samplesPerVariable: 7, candidateCount: 2 }
    });
    const yieldRun = runCoatingYieldAnalysis({
      id: "yield-visible-ar",
      label: "Visible AR yield",
      stack: foundry.best.stack,
      objective: visibleArObjective,
      tolerances: foundry.best.stack.layers.map((layer) => ({ layerId: layer.id, sigmaM: 2e-9 })),
      settings: { sampleCount: 31 }
    });
    const repeat = runCoatingYieldAnalysis({
      id: "yield-visible-ar",
      label: "Visible AR yield",
      stack: foundry.best.stack,
      objective: visibleArObjective,
      tolerances: foundry.best.stack.layers.map((layer) => ({ layerId: layer.id, sigmaM: 2e-9 })),
      settings: { sampleCount: 31 }
    });

    expect(yieldRun.type).toBe("maxwellDesignFoundryPlanarYield");
    expect(yieldRun.samples).toHaveLength(31);
    expect(yieldRun.passRate).toBeGreaterThanOrEqual(0);
    expect(yieldRun.passRate).toBeLessThanOrEqual(1);
    expect(yieldRun.confidenceInterval.lower).toBeLessThanOrEqual(yieldRun.passRate);
    expect(yieldRun.confidenceInterval.upper).toBeGreaterThanOrEqual(yieldRun.passRate);
    expect(yieldRun.sensitivities[0]?.layerId).toBe("layer-mgf2");
    expect(yieldRun.resultHash).toBe(repeat.resultHash);
    expect(yieldRun.provenance.limitations.join(" ")).toContain("not a certified manufacturing yield claim");
  });

  it("lowers pass rate when coating thickness uncertainty grows", () => {
    const foundry = runCoatingDesignFoundry({
      id: "yield-foundry-visible-ar-wide",
      label: "Yield foundry visible AR wide",
      seedStack: poorSingleLayerAr,
      objective: visibleArObjective,
      settings: { passes: 2, samplesPerVariable: 7, candidateCount: 2 }
    });
    const requirement = [{ id: "mean-r-tight", label: "Mean R <= 2%", metric: "meanReflectance" as const, operator: "<=" as const, limit: 0.02 }];
    const lowSigma = runCoatingYieldAnalysis({
      id: "yield-low-sigma",
      label: "Low sigma yield",
      stack: foundry.best.stack,
      objective: visibleArObjective,
      tolerances: foundry.best.stack.layers.map((layer) => ({ layerId: layer.id, sigmaM: 0.2e-9 })),
      requirements: requirement,
      settings: { sampleCount: 41 }
    });
    const highSigma = runCoatingYieldAnalysis({
      id: "yield-high-sigma",
      label: "High sigma yield",
      stack: foundry.best.stack,
      objective: visibleArObjective,
      tolerances: foundry.best.stack.layers.map((layer) => ({ layerId: layer.id, sigmaM: 40e-9 })),
      requirements: requirement,
      settings: { sampleCount: 41 }
    });

    expect(lowSigma.passRate).toBeGreaterThan(highSigma.passRate);
    expect(highSigma.requirements[0]?.worstValue ?? 0).toBeGreaterThan(lowSigma.requirements[0]?.worstValue ?? 0);
  });

  it("handles a bare boundary without thickness tolerances", () => {
    const yieldRun = runCoatingYieldAnalysis({
      id: "yield-bare",
      label: "Bare boundary yield",
      stack: { ...poorSingleLayerAr, layers: [] },
      objective: visibleArObjective,
      settings: { sampleCount: 5 }
    });

    expect(yieldRun.tolerances).toHaveLength(0);
    expect(yieldRun.samples).toHaveLength(5);
    expect(yieldRun.sensitivities).toHaveLength(0);
    expect(yieldRun.warnings.some((warning) => warning.code === "maxwell.yield.noThicknessTolerances")).toBe(true);
  });

  it("changes hashes when tolerance assumptions change", () => {
    const a = runCoatingYieldAnalysis({
      id: "yield-hash",
      label: "Yield hash",
      stack: poorSingleLayerAr,
      objective: visibleArObjective,
      tolerances: [{ layerId: "layer-mgf2", sigmaM: 1e-9 }],
      settings: { sampleCount: 11 }
    });
    const b = runCoatingYieldAnalysis({
      id: "yield-hash",
      label: "Yield hash",
      stack: poorSingleLayerAr,
      objective: visibleArObjective,
      tolerances: [{ layerId: "layer-mgf2", sigmaM: 2e-9 }],
      settings: { sampleCount: 11 }
    });

    expect(a.resultHash).not.toBe(b.resultHash);
  });
});
