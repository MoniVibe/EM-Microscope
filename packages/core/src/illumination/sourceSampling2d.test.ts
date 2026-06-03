import { describe, expect, it } from "vitest";
import type { IlluminationModel2D } from "../scene/schema";
import { sampleSourceAngles2D } from "./sourceSampling2d";

describe("source angle sampling 2D", () => {
  it("normalizes deterministic uniform-disk samples", () => {
    const model: IlluminationModel2D = {
      id: "disk",
      label: "Disk",
      kind: "uniformDisk",
      sourceNA: 0.01,
      sampleCount: 9,
      pattern: "rings",
      seed: 1
    };

    const set = sampleSourceAngles2D(model);
    const weightSum = set.samples.reduce((sum, sample) => sum + sample.weight, 0);

    expect(set.samples).toHaveLength(9);
    expect(weightSum).toBeCloseTo(1, 12);
    expect(set.samples[0]).toMatchObject({ angleURad: 0, angleVRad: 0 });
  });

  it("is repeatable for deterministic jitter", () => {
    const model: IlluminationModel2D = {
      id: "jitter",
      label: "Jitter",
      kind: "uniformDisk",
      sourceNA: 0.01,
      sampleCount: 5,
      pattern: "deterministicJitter",
      seed: 42
    };

    expect(sampleSourceAngles2D(model)).toEqual(sampleSourceAngles2D(model));
  });
});
