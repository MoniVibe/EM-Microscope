import { describe, expect, it } from "vitest";
import { makeL33PresetScene } from "../validation/fixturesL33";
import { scalarCoherentL3_2dSolver } from "./scalarCoherentL3_2d";
import { scalarPartialCoherentL33_2dSolver } from "./scalarPartialCoherentL33_2d";

describe("scalar partial-coherent L3.3 2D solver", () => {
  it("produces an averaged detector-only brightfield output", () => {
    const result = scalarPartialCoherentL33_2dSolver.run(makeL33PresetScene("linePairs"));
    const field = result.fieldImageOutputs?.[0];

    expect(result.solverId).toBe("scalar.partialCoherent.l3.3.2d");
    expect(field?.type).toBe("fieldImage2D");
    expect(field?.real).toBeUndefined();
    expect(field?.phaseRad).toBeUndefined();
    expect(result.sourceAngleSetOutput?.samples).toHaveLength(9);
    expect(result.sourceAngleSetOutput?.weightSum).toBeCloseTo(1, 12);
    expect(result.partialCoherenceOutput?.intensityAveraging).toBe("incoherent-detector-intensity");
    expect(result.assumptions.join(" ")).toContain("Intensity averaged over deterministic source angles");
  });

  it("is deterministic for identical scenes", () => {
    const scene = makeL33PresetScene("slantedEdge");
    const a = scalarPartialCoherentL33_2dSolver.run(scene);
    const b = scalarPartialCoherentL33_2dSolver.run(scene);

    expect(a.resultHash).toBe(b.resultHash);
  });

  it("matches the coherent L3 result for a no-target single center angle scene", () => {
    const scene = makeL33PresetScene("linePairs");
    const noTargetCenterAngleScene = {
      ...scene,
      illuminationModels2D: scene.illuminationModels2D.filter((model) => model.id === "l33-center-source"),
      brightfieldPipelines2D: scene.brightfieldPipelines2D.map((pipeline) => ({
        ...pipeline,
        illuminationModelId: "l33-center-source",
        testTargetId: undefined
      }))
    };
    const coherentScene = {
      ...noTargetCenterAngleScene,
      solverSettings: { ...noTargetCenterAngleScene.solverSettings, activeSolverId: "scalar.coherent.l3.2d" as const }
    };
    const coherent = scalarCoherentL3_2dSolver.run(coherentScene);
    const partial = scalarPartialCoherentL33_2dSolver.run(noTargetCenterAngleScene);
    const coherentIntensity = coherent.fieldImageOutputs?.[0]?.intensity;
    const partialIntensity = partial.fieldImageOutputs?.[0]?.intensity;
    if (!coherentIntensity || !partialIntensity) throw new Error("missing field");

    let maxDelta = 0;
    for (let index = 0; index < coherentIntensity.length; index += 1) {
      maxDelta = Math.max(maxDelta, Math.abs((coherentIntensity[index] ?? 0) - (partialIntensity[index] ?? 0)));
    }
    expect(maxDelta).toBeLessThan(1e-12);
  });
});
