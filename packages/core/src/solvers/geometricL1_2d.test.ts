import { describe, expect, it } from "vitest";
import { lensmakerThickLensInAir } from "../optics/assemblies/thickLens2d";
import { sampleL1Scene, sampleScene } from "../scene/sampleScene";
import { parseScene } from "../scene/schema";
import { resultHash } from "./geometricL0";
import { geometricL1_2dSolver } from "./geometricL1_2d";

describe("geometric L1 2D solver", () => {
  it("migrates old L0 scenes to the latest scene schema without changing the solver id", () => {
    const migrated = parseScene(sampleScene);

    expect(migrated.schemaVersion).toBe("0.6.0");
    expect(migrated.geometry.dimension).toBe("2d");
    expect(migrated.solverSettings.activeSolverId).toBe("geometric.l0");
    expect(migrated.fieldGrids1D).toEqual([]);
    expect(migrated.fieldGrids2D).toEqual([]);
    expect(migrated.cameraModels).toEqual([]);
  });

  it("computes the expected biconvex thick-lens lensmaker values", () => {
    const lens = sampleL1Scene.elements.find((element) => element.type === "thickLens2D");
    if (!lens || lens.type !== "thickLens2D") throw new Error("missing thick lens");

    const readout = lensmakerThickLensInAir(lens);

    expect(readout.effectiveFocalLengthM).toBeCloseTo(0.0508474576, 10);
    expect(readout.backFocalLengthM).toBeCloseTo(0.0491525424, 10);
  });

  it("is deterministic for the same L1 scene and seed", () => {
    const a = geometricL1_2dSolver.run(sampleL1Scene);
    const b = geometricL1_2dSolver.run(sampleL1Scene);

    expect(resultHash(a)).toBe(resultHash(b));
  });

  it("traces rays through a thick lens to detector hits", () => {
    const result = geometricL1_2dSolver.run(sampleL1Scene);

    expect(result.solverId).toBe("geometric.l1.2d");
    expect(result.detectorHits?.length).toBeGreaterThan(0);
    expect(result.readouts.lensmaker?.[0]?.effectiveFocalLengthM).toBeCloseTo(0.0508474576, 10);
    expect(result.readouts.energy?.detectorPowerW).toBeGreaterThan(0);
    expect(result.readouts.aberration?.[0]?.provenance).toBe("simulated.geometric.l1.2d");
  });
});
