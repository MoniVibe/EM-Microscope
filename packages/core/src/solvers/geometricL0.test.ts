import { describe, expect, it } from "vitest";
import { resultHash, geometricL0Solver } from "./geometricL0";
import type { SceneV1 } from "../scene/schema";

function baseScene(): SceneV1 {
  return {
    schemaVersion: "0.1.0",
    sceneId: "test-scene",
    name: "Test scene",
    seed: 42,
    units: {
      internal: "SI",
      displayLength: "mm",
      displayAngle: "deg"
    },
    environment: {
      ambientRefractiveIndex: 1,
      defaultWavelengthM: 550e-9
    },
    bench: {
      xMinM: 0,
      xMaxM: 0.16,
      yMinM: -0.01,
      yMaxM: 0.01,
      opticalAxisYM: 0
    },
    sources: [
      {
        id: "source",
        type: "collimatedSource",
        label: "Source",
        xM: 0,
        yCenterM: 0,
        beamHeightM: 0.006,
        wavelengthM: 550e-9,
        powerW: 1,
        angleRad: 0,
        rayCount: 5
      }
    ],
    elements: [],
    detectors: [
      {
        id: "screen",
        type: "screenDetector",
        label: "Screen",
        xM: 0.1,
        yCenterM: 0,
        heightM: 0.02,
        bins: 16
      }
    ],
    solverSettings: {
      activeSolverId: "geometric.l0",
      rayCount: 5,
      sampling: "deterministicFan",
      modeDisclosure: true
    },
    metadata: {
      createdAtIso: "2026-06-03T00:00:00.000Z",
      modifiedAtIso: "2026-06-03T00:00:00.000Z",
      appVersion: "0.1.0"
    }
  };
}

describe("geometric L0 solver", () => {
  it("is deterministic for the same scene and seed", () => {
    const scene = baseScene();
    const a = geometricL0Solver.run(scene);
    const b = geometricL0Solver.run(scene);

    expect(resultHash(a)).toBe(resultHash(b));
  });

  it("focuses collimated rays at lens.x + focalLength", () => {
    const scene = baseScene();
    scene.elements = [
      {
        id: "lens",
        type: "thinLens",
        label: "Lens",
        xM: 0.05,
        yCenterM: 0,
        focalLengthM: 0.05,
        clearApertureM: 0.01,
        material: {
          refractiveIndex: 1.5,
          dispersionModel: "none"
        },
        approximation: "thinLensParaxial"
      }
    ];
    scene.detectors[0].xM = 0.1;

    const result = geometricL0Solver.run(scene);

    expect(result.detectorHits).toHaveLength(5);
    for (const hit of result.detectorHits ?? []) {
      expect(hit.yM).toBeCloseTo(0, 12);
    }
  });

  it("clips rays outside an aperture exactly", () => {
    const scene = baseScene();
    scene.elements = [
      {
        id: "stop",
        type: "aperture",
        label: "Stop",
        xM: 0.05,
        yCenterM: 0,
        diameterM: 0.004
      }
    ];

    const result = geometricL0Solver.run(scene);

    expect(result.rays?.filter((ray) => ray.alive)).toHaveLength(3);
    expect(result.rays?.filter((ray) => ray.clippedBy === "stop")).toHaveLength(2);
  });

  it("accounts for detector power after clipping", () => {
    const scene = baseScene();
    scene.elements = [
      {
        id: "stop",
        type: "aperture",
        label: "Stop",
        xM: 0.05,
        yCenterM: 0,
        diameterM: 0.004
      }
    ];

    const result = geometricL0Solver.run(scene);

    expect(result.readouts.energy?.sourcePowerW).toBeCloseTo(1, 12);
    expect(result.readouts.energy?.survivingPowerW).toBeCloseTo(0.6, 12);
    expect(result.readouts.energy?.clippedPowerW).toBeCloseTo(0.4, 12);
    expect(result.detectorHistograms?.[0]?.totalPowerW).toBeCloseTo(0.6, 12);
  });
});
