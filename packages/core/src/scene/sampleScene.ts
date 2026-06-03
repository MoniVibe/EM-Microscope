import { migrateSceneV2ToV3, migrateSceneV3ToV4, migrateSceneV4ToV5, type Scene, type SceneV1, type SceneV2 } from "./schema";

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

const sampleL1SceneV2: SceneV2 = {
  ...sampleScene,
  schemaVersion: "0.2.0",
  sceneId: "sample-l1-thick-lens",
  name: "L1 biconvex surface lens",
  bench: {
    ...sampleScene.bench,
    xMaxM: 0.22,
    yMinM: -0.03,
    yMaxM: 0.03
  },
  mediaCatalog: [
    {
      id: "air",
      label: "Air",
      refractiveIndex: {
        kind: "constant",
        n: 1
      }
    },
    {
      id: "bk7-simple",
      label: "Glass n=1.5",
      refractiveIndex: {
        kind: "constant",
        n: 1.5
      }
    }
  ],
  geometry: {
    dimension: "2d",
    opticalAxis: "x",
    transverseAxes: ["y"]
  },
  surfaceElements2D: [],
  assemblies2D: [],
  elements: [
    {
      id: "lens-thick-biconvex",
      type: "thickLens2D",
      label: "Biconvex thick lens",
      xM: 0.09,
      yCenterM: 0,
      thicknessM: 0.005,
      radius1M: 0.05,
      radius2M: -0.05,
      apertureDiameterM: 0.018,
      mediumId: "bk7-simple",
      material: {
        refractiveIndex: 1.5,
        dispersionModel: "none"
      },
      approximation: "surfaceSnell2D"
    },
    {
      id: "aperture-stop",
      type: "aperture",
      label: "Aperture stop",
      xM: 0.13,
      yCenterM: 0,
      diameterM: 0.016
    }
  ],
  detectors: [
    {
      id: "detector-screen",
      type: "screenDetector",
      label: "Screen detector",
      xM: 0.145,
      yCenterM: 0,
      heightM: 0.028,
      bins: 64
    }
  ],
  solverSettings: {
    ...sampleScene.solverSettings,
    activeSolverId: "geometric.l1.2d"
  }
};

export const sampleL1Scene: Scene = migrateSceneV4ToV5(migrateSceneV3ToV4(migrateSceneV2ToV3(sampleL1SceneV2)));

const l2GridSpacingM = 0.04 / 4096;

export const sampleL2Scene: Scene = {
  ...sampleL1Scene,
  schemaVersion: "0.5.0",
  sceneId: "sample-l2-slit-wave-profile",
  name: "L2 1D slit diffraction profile",
  bench: {
    xMinM: 0,
    xMaxM: 1.05,
    yMinM: -0.02,
    yMaxM: 0.02,
    opticalAxisYM: 0
  },
  sources: [
    {
      id: "src-plane-wave",
      type: "collimatedSource",
      label: "Plane-wave reference rays",
      xM: 0,
      yCenterM: 0,
      beamHeightM: 0.004,
      wavelengthM: 500e-9,
      powerW: 1,
      angleRad: 0,
      rayCount: 25
    }
  ],
  elements: [
    {
      id: "slit-ray-marker",
      type: "aperture",
      label: "100 um slit marker",
      xM: 0.02,
      yCenterM: 0,
      diameterM: 100e-6
    }
  ],
  detectors: [
    {
      id: "wave-detector-screen",
      type: "screenDetector",
      label: "1 m field detector",
      xM: 1.02,
      yCenterM: 0,
      heightM: 0.04,
      bins: 128
    }
  ],
  environment: {
    ambientRefractiveIndex: 1,
    defaultWavelengthM: 500e-9
  },
  solverSettings: {
    activeSolverId: "scalar.angularSpectrum.l2.1d",
    rayCount: 25,
    sampling: "deterministicFan",
    modeDisclosure: true
  },
  waveSettings: {
    defaultCoherence: "coherent",
    defaultPolarization: "scalar-unpolarized-placeholder",
    defaultGrid1DId: "grid-40mm-4096"
  },
  fieldGrids1D: [
    {
      id: "grid-40mm-4096",
      label: "40 mm detector slice",
      yMinM: -0.02,
      yMaxM: 0.02,
      samples: 4096,
      spacingM: l2GridSpacingM
    }
  ],
  fieldPlanes1D: [
    {
      id: "source-field",
      label: "Coherent plane-wave source",
      role: "source",
      xM: 0,
      gridId: "grid-40mm-4096",
      mediumId: "air",
      fieldSource: {
        kind: "uniformPlaneWave",
        amplitude: 1,
        phaseRad: 0
      }
    },
    {
      id: "detector-field",
      label: "Detector intensity profile",
      role: "detector",
      xM: 1,
      gridId: "grid-40mm-4096",
      mediumId: "air"
    }
  ],
  masks1D: [
    {
      id: "slit-100um",
      type: "rectAperture1D",
      label: "100 um rectangular slit",
      xM: 0,
      gridId: "grid-40mm-4096",
      widthM: 100e-6,
      centerYM: 0
    }
  ],
  samplePlanes1D: [],
  sampleMasks1D: [],
  metadata: {
    ...sampleL1Scene.metadata,
    appVersion: "0.5.0"
  }
};
