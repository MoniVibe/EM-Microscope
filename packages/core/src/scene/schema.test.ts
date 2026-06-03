import { describe, expect, it } from "vitest";
import { sampleL1Scene, sampleL2Scene, sampleScene } from "./sampleScene";
import { parseScene, parseSceneV1 } from "./schema";

describe("SceneV1 schema", () => {
  it("validates the canonical sample scene", () => {
    expect(parseSceneV1(sampleScene).sceneId).toBe("sample-l0-thin-lens");
  });

  it("rejects non-SI internal units", () => {
    const invalid = structuredClone(sampleScene) as unknown as Record<string, unknown>;
    invalid.units = { internal: "mm", displayLength: "mm", displayAngle: "deg" };

    expect(() => parseSceneV1(invalid)).toThrow();
  });

  it("rejects duplicate element ids", () => {
    const invalid = structuredClone(sampleScene);
    invalid.detectors[0] = { ...invalid.detectors[0], id: invalid.sources[0].id };

    expect(() => parseSceneV1(invalid)).toThrow(/duplicate element id/);
  });
});

describe("SceneV3 migration", () => {
  it("migrates SceneV1 to SceneV3 without inventing L2 fields", () => {
    const migrated = parseScene(sampleScene);

    expect(migrated.schemaVersion).toBe("0.3.0");
    expect(migrated.solverSettings.activeSolverId).toBe("geometric.l0");
    expect(migrated.fieldGrids1D).toEqual([]);
    expect(migrated.fieldPlanes1D).toEqual([]);
    expect(migrated.masks1D).toEqual([]);
  });

  it("validates the migrated L1 sample scene", () => {
    const parsed = parseScene(sampleL1Scene);

    expect(parsed.schemaVersion).toBe("0.3.0");
    expect(parsed.solverSettings.activeSolverId).toBe("geometric.l1.2d");
    expect(parsed.waveSettings.defaultCoherence).toBe("coherent");
  });

  it("defaults missing L2.5 sample collections on older SceneV3 files", () => {
    const olderScene = structuredClone(sampleL2Scene) as Record<string, unknown>;
    delete olderScene.samplePlanes1D;
    delete olderScene.sampleMasks1D;

    const parsed = parseScene(olderScene);

    expect(parsed.schemaVersion).toBe("0.3.0");
    expect(parsed.samplePlanes1D).toEqual([]);
    expect(parsed.sampleMasks1D).toEqual([]);
  });
});
