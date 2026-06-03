import { describe, expect, it } from "vitest";
import { sampleScene } from "./sampleScene";
import { parseSceneV1 } from "./schema";

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
