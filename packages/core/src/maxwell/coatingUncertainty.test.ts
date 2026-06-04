import { describe, expect, it } from "vitest";
import { generateCoatingUncertaintySamples, applyCoatingUncertaintySample } from "./coatingUncertainty";
import type { CoatingStackDefinition } from "./coatingStack";

describe("L5.7 coating uncertainty drift/correlation", () => {
  it("preserves deterministic independent-thickness samples", () => {
    const a = generateCoatingUncertaintySamples(stackFixture(), {
      mode: "independent-thickness",
      sigmaNm: 2,
      sigmaLevels: [-1, 0, 1],
      maxSamplesPerCandidate: 99
    });
    const b = generateCoatingUncertaintySamples(structuredClone(stackFixture()), {
      mode: "independent-thickness",
      sigmaNm: 2,
      sigmaLevels: [-1, 0, 1],
      maxSamplesPerCandidate: 99
    });

    expect(a.receipt.model).toBe("independent-thickness");
    expect(a.receipt.sampleReduction).toBe("none");
    expect(a.samples).toHaveLength(9);
    expect(a.samples.map((sample) => sample.resultHash)).toEqual(b.samples.map((sample) => sample.resultHash));
    expect(a.samples.some((sample) => sample.layerThicknessDeltasNm.join(",") === "-2,0")).toBe(true);
  });

  it("applies global scale drift to all layers proportionally", () => {
    const samples = generateCoatingUncertaintySamples(stackFixture(), {
      mode: "correlated-thickness",
      preset: "shared-scale",
      globalThicknessScale: { sigmaFraction: 0.01, sigmaLevels: [0, 1] },
      maxSamplesPerCandidate: 10
    });
    const plus = samples.samples.find((sample) => sample.drivers.some((driver) => driver.id === "global:scale" && driver.sigmaMultiplier === 1));

    expect(samples.receipt.model).toBe("correlated-thickness");
    expect(samples.receipt.globalThicknessScale?.sigmaFraction).toBe(0.01);
    expect(plus?.layerThicknessDeltasNm).toEqual([1, 2]);
  });

  it("applies global offset drift to all layers", () => {
    const samples = generateCoatingUncertaintySamples(stackFixture(), {
      mode: "correlated-thickness",
      preset: "shared-offset-residual",
      globalThicknessOffsetNm: { sigmaNm: 3, sigmaLevels: [0, -1] },
      maxSamplesPerCandidate: 10
    });
    const minus = samples.samples.find((sample) => sample.drivers.some((driver) => driver.id === "global:offset" && driver.sigmaMultiplier === -1));

    expect(minus?.layerThicknessDeltasNm).toEqual([-3, -3]);
  });

  it("combines shared drift with per-layer residuals", () => {
    const samples = generateCoatingUncertaintySamples(stackFixture(), {
      mode: "correlated-thickness",
      globalThicknessOffsetNm: { sigmaNm: 2, sigmaLevels: [0, 1] },
      perLayerResidualNm: { sigmaNm: 0.5, sigmaLevels: [0, 1] },
      maxSamplesPerCandidate: 99
    });
    const combined = samples.samples.find(
      (sample) =>
        sample.drivers.some((driver) => driver.id === "global:offset") &&
        sample.drivers.some((driver) => driver.id === "residual:layer-a") &&
        !sample.drivers.some((driver) => driver.id === "residual:layer-b")
    );

    expect(samples.receipt.theoreticalSamplesPerCandidate).toBe(8);
    expect(combined?.layerThicknessDeltasNm).toEqual([2.5, 2]);
  });

  it("applies layer group drift to selected layer indices", () => {
    const samples = generateCoatingUncertaintySamples(stackFixture(), {
      mode: "correlated-thickness",
      layerGroupDrift: [{ groupId: "front", layerIndices: [0], sigmaNm: 4, sigmaLevels: [0, 1] }],
      maxSamplesPerCandidate: 10
    });
    const group = samples.samples.find((sample) => sample.drivers.some((driver) => driver.id === "group:front"));

    expect(group?.layerThicknessDeltasNm).toEqual([4, 0]);
  });

  it("respects maxSamplesPerCandidate with deterministic reduction receipts", () => {
    const samples = generateCoatingUncertaintySamples(
      {
        ...stackFixture(),
        layers: [
          ...stackFixture().layers,
          { id: "layer-c", label: "Layer C", materialId: "tio2", thicknessM: 150e-9 }
        ]
      },
      {
        mode: "correlated-thickness",
        globalThicknessScale: { sigmaFraction: 0.01, sigmaLevels: [-2, 0, 2] },
        perLayerResidualNm: { sigmaNm: 1, sigmaLevels: [-1, 0, 1] },
        maxSamplesPerCandidate: 5
      }
    );

    expect(samples.samples.length).toBeLessThanOrEqual(5);
    expect(samples.receipt.sampleReduction).toBe("deterministic-cap");
    expect(samples.receipt.theoreticalSamplesPerCandidate).toBeGreaterThan(samples.receipt.generatedSamplesPerCandidate);
  });

  it("applies a sample to produce perturbed stack receipts", () => {
    const stack = stackFixture();
    const sample = generateCoatingUncertaintySamples(stack, {
      mode: "correlated-thickness",
      globalThicknessScale: { sigmaFraction: 0.01, sigmaLevels: [0, 1] },
      maxSamplesPerCandidate: 10
    }).samples.find((candidate) => candidate.drivers.length > 0);
    if (!sample) throw new Error("missing non-nominal sample");

    const applied = applyCoatingUncertaintySample(stack, sample);

    expect(applied.stack.layers[0]?.thicknessM).toBeCloseTo(101e-9, 12);
    expect(applied.stack.layers[1]?.thicknessM).toBeCloseTo(202e-9, 12);
    expect(applied.perturbations[0]?.drivers[0]?.kind).toBe("global-scale");
  });
});

function stackFixture(): CoatingStackDefinition {
  return {
    id: "uncertainty-test-stack",
    label: "Uncertainty test stack",
    wavelengthM: 550e-9,
    angleRad: 0,
    polarization: "TE",
    incidentMaterialId: "air",
    substrateMaterialId: "bk7",
    layers: [
      { id: "layer-a", label: "Layer A", materialId: "mgf2", thicknessM: 100e-9 },
      { id: "layer-b", label: "Layer B", materialId: "sio2", thicknessM: 200e-9 }
    ]
  };
}
