import { describe, expect, it } from "vitest";
import type { CoatingStackDefinition } from "./coatingStack";
import { runCoatingDesignFoundry, visibleArObjective } from "./designFoundry";

const poorSingleLayerAr: CoatingStackDefinition = {
  id: "foundry-poor-single-layer-ar",
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

describe("L5.1 Maxwell Design Foundry planar coating optimizer", () => {
  it("improves a poor coating seed and certifies the best candidate through TMM", () => {
    const result = runCoatingDesignFoundry({
      id: "foundry-visible-ar",
      label: "Visible AR foundry run",
      seedStack: poorSingleLayerAr,
      objective: visibleArObjective,
      settings: { passes: 3, samplesPerVariable: 7, candidateCount: 3 }
    });

    expect(result.type).toBe("maxwellDesignFoundryPlanarCoating");
    expect(result.best.score).toBeLessThan(result.seed.score);
    expect(result.best.metrics.meanReflectance).toBeLessThan(result.seed.metrics.meanReflectance);
    expect(result.best.certifiedRun.tmm.energyBalanceError).toBeLessThan(1e-10);
    expect(result.best.certifiedRun.provenance.limitations.join(" ")).toContain("not a general 3D Maxwell solver");
    expect(result.provenance.limitations.join(" ")).toContain("not adjoint optimization");
    expect(result.warnings.some((warning) => warning.code === "maxwell.designFoundry.planarProposalOnly")).toBe(true);
  });

  it("is deterministic and sensitive to objective wavelength samples", () => {
    const a = runCoatingDesignFoundry({
      id: "foundry-visible-ar",
      label: "Visible AR foundry run",
      seedStack: cloneStack(poorSingleLayerAr),
      objective: visibleArObjective,
      settings: { passes: 2, samplesPerVariable: 5, candidateCount: 2 }
    });
    const b = runCoatingDesignFoundry({
      id: "foundry-visible-ar",
      label: "Visible AR foundry run",
      seedStack: cloneStack(poorSingleLayerAr),
      objective: visibleArObjective,
      settings: { passes: 2, samplesPerVariable: 5, candidateCount: 2 }
    });
    const c = runCoatingDesignFoundry({
      id: "foundry-visible-ar",
      label: "Visible AR foundry run",
      seedStack: cloneStack(poorSingleLayerAr),
      objective: {
        ...visibleArObjective,
        wavelengthsM: [450e-9, 550e-9, 650e-9]
      },
      settings: { passes: 2, samplesPerVariable: 5, candidateCount: 2 }
    });

    expect(a.resultHash).toBe(b.resultHash);
    expect(a.resultHash).not.toBe(c.resultHash);
  });

  it("certifies a bare stack without claiming optimization variables", () => {
    const result = runCoatingDesignFoundry({
      id: "foundry-bare-boundary",
      label: "Bare boundary foundry run",
      seedStack: { ...poorSingleLayerAr, layers: [] },
      objective: visibleArObjective
    });

    expect(result.variableCount).toBe(0);
    expect(result.seed.resultHash).toBe(result.best.resultHash);
    expect(result.warnings.some((warning) => warning.code === "maxwell.designFoundry.noVariables")).toBe(true);
  });

  it("clamps generated variables to objective thickness bounds", () => {
    const objective = {
      ...visibleArObjective,
      constraints: {
        ...visibleArObjective.constraints,
        minThicknessM: 20e-9,
        maxThicknessM: 80e-9
      }
    };
    const result = runCoatingDesignFoundry({
      id: "foundry-bounded",
      label: "Bounded foundry run",
      seedStack: { ...poorSingleLayerAr, layers: poorSingleLayerAr.layers.map((layer) => ({ ...layer, thicknessM: 200e-9 })) },
      objective,
      settings: { passes: 1, samplesPerVariable: 5, candidateCount: 2 }
    });

    expect(result.seed.stack.layers[0]?.thicknessM).toBeLessThanOrEqual(80e-9);
    expect(result.best.stack.layers[0]?.thicknessM).toBeGreaterThanOrEqual(20e-9);
    expect(result.best.stack.layers[0]?.thicknessM).toBeLessThanOrEqual(80e-9);
  });
});

function cloneStack(stack: CoatingStackDefinition): CoatingStackDefinition {
  return {
    ...stack,
    layers: stack.layers.map((layer) => ({ ...layer }))
  };
}
