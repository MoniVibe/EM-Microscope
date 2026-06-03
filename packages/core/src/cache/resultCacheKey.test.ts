import { describe, expect, it } from "vitest";
import { l3PresetScenes } from "../validation/fixturesL3";
import { makeL3ResultCacheKey } from "./resultCacheKey";

describe("L3 result cache key", () => {
  it("is stable for the same scene and changes when pipeline settings change", () => {
    const scene = structuredClone(l3PresetScenes.airyPupil);
    const a = makeL3ResultCacheKey(scene);
    const b = makeL3ResultCacheKey(structuredClone(scene));

    scene.microscopePipelines2D[0] = {
      ...scene.microscopePipelines2D[0]!,
      wavelengthM: 510e-9
    };

    expect(a).toBe(b);
    expect(makeL3ResultCacheKey(scene)).not.toBe(a);
  });

  it("changes when grid dimensions change", () => {
    const scene = structuredClone(l3PresetScenes.airyPupil);
    const original = makeL3ResultCacheKey(scene);
    scene.fieldGrids2D[0] = {
      ...scene.fieldGrids2D[0]!,
      width: 128,
      height: 128,
      spacingUM: (scene.fieldGrids2D[0]!.uMaxM - scene.fieldGrids2D[0]!.uMinM) / 128,
      spacingVM: (scene.fieldGrids2D[0]!.vMaxM - scene.fieldGrids2D[0]!.vMinM) / 128
    };

    expect(makeL3ResultCacheKey(scene)).not.toBe(original);
  });
});
