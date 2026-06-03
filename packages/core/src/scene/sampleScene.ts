import type { SceneV1 } from "./schema";

export const sampleScene: SceneV1 = {
  schemaVersion: "0.1.0",
  sceneId: "sample-l0-thin-lens",
  name: "L0 thin lens bench",
  seed: 1024,
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
    xMaxM: 0.24,
    yMinM: -0.035,
    yMaxM: 0.035,
    opticalAxisYM: 0
  },
  sources: [
    {
      id: "src-collimated",
      type: "collimatedSource",
      label: "Collimated source",
      xM: 0.015,
      yCenterM: 0,
      beamHeightM: 0.018,
      wavelengthM: 550e-9,
      powerW: 1,
      angleRad: 0,
      rayCount: 25
    }
  ],
  elements: [
    {
      id: "lens-objective",
      type: "thinLens",
      label: "Thin lens",
      xM: 0.09,
      yCenterM: 0,
      focalLengthM: 0.05,
      clearApertureM: 0.022,
      material: {
        refractiveIndex: 1.52,
        dispersionModel: "none"
      },
      approximation: "thinLensParaxial"
    },
    {
      id: "aperture-stop",
      type: "aperture",
      label: "Aperture stop",
      xM: 0.125,
      yCenterM: 0,
      diameterM: 0.016
    }
  ],
  detectors: [
    {
      id: "detector-screen",
      type: "screenDetector",
      label: "Screen detector",
      xM: 0.14,
      yCenterM: 0,
      heightM: 0.028,
      bins: 64
    }
  ],
  solverSettings: {
    activeSolverId: "geometric.l0",
    rayCount: 25,
    sampling: "deterministicFan",
    modeDisclosure: true
  },
  metadata: {
    createdAtIso: "2026-06-03T00:00:00.000Z",
    modifiedAtIso: "2026-06-03T00:00:00.000Z",
    appVersion: "0.1.0"
  }
};
