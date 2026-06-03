import { sampleL1Scene } from "../scene/sampleScene";
import type { Scene } from "../scene/schema";

export type L3PresetId = "airyPupil" | "badSampling";

export type L3PresetDefinition = {
  id: L3PresetId;
  label: string;
  scene: Scene;
};

const gridId = "grid-2mm-256";
const wavelengthM = 500e-9;
const focalLengthM = 0.02;
const pupilRadiusM = 100e-6;

export const l3PresetLabels: Record<L3PresetId, string> = {
  airyPupil: "Circular pupil Airy-like focus",
  badSampling: "Bad 2D sampling warning"
};

export function makeL3PresetScene(id: L3PresetId): Scene {
  const base = structuredClone(sampleL1Scene);
  const samples = id === "badSampling" ? 32 : 256;
  const windowM = 0.002;
  const spacingM = windowM / samples;
  const radiusM = id === "badSampling" ? 30e-6 : pupilRadiusM;

  return {
    ...base,
    sceneId: `sample-l3-${id}`,
    name: `L3 ${l3PresetLabels[id]}`,
    bench: {
      xMinM: 0,
      xMaxM: focalLengthM + 0.005,
      yMinM: -windowM / 2,
      yMaxM: windowM / 2,
      opticalAxisYM: 0
    },
    elements: [
      {
        id: "l3-lens-marker",
        type: "thinLens",
        label: "L3 thin-lens phase marker",
        xM: 0,
        yCenterM: 0,
        focalLengthM,
        clearApertureM: radiusM * 2,
        material: {
          refractiveIndex: 1,
          dispersionModel: "none"
        },
        approximation: "thinLensParaxial"
      },
      {
        id: "l3-pupil-marker",
        type: "aperture",
        label: "L3 circular pupil marker",
        xM: 0,
        yCenterM: 0,
        diameterM: radiusM * 2
      }
    ],
    detectors: [
      {
        id: "l3-detector-screen",
        type: "screenDetector",
        label: "2D image-plane detector marker",
        xM: focalLengthM,
        yCenterM: 0,
        heightM: windowM,
        bins: 128
      }
    ],
    environment: {
      ambientRefractiveIndex: 1,
      defaultWavelengthM: wavelengthM
    },
    solverSettings: {
      activeSolverId: "scalar.coherent.l3.2d",
      rayCount: 25,
      sampling: "deterministicFan",
      modeDisclosure: true
    },
    waveSettings: {
      ...base.waveSettings,
      defaultGrid2DId: gridId
    },
    fieldGrids2D: [
      {
        id: gridId,
        label: `${Math.round(windowM * 1000)} mm 2D image grid`,
        uMinM: -windowM / 2,
        uMaxM: windowM / 2,
        vMinM: -windowM / 2,
        vMaxM: windowM / 2,
        width: samples,
        height: samples,
        spacingUM: spacingM,
        spacingVM: spacingM
      }
    ],
    fieldPlanes2D: [
      {
        id: "l3-source-field",
        label: "Coherent 2D plane-wave source",
        role: "source",
        xM: 0,
        gridId,
        mediumId: "air",
        fieldSource: {
          kind: "uniformPlaneWave",
          amplitude: 1,
          phaseRad: 0
        }
      }
    ],
    samplePlanes2D: [],
    pupilPlanes2D: [
      {
        id: "l3-pupil",
        type: "pupilPlane2D",
        label: "Circular scalar pupil",
        xM: 0,
        gridId,
        shape: {
          kind: "circle",
          radiusM,
          centerUM: 0,
          centerVM: 0
        },
        numericalAperture: radiusM / focalLengthM
      }
    ],
    thinLensPhasePlanes2D: [
      {
        id: "l3-thin-lens-phase",
        type: "thinLensPhasePlane2D",
        label: "Thin-lens scalar phase",
        xM: 0,
        gridId,
        focalLengthM,
        centerUM: 0,
        centerVM: 0
      }
    ],
    detectorPlanes2D: [
      {
        id: "l3-detector",
        type: "detectorPlane2D",
        label: "2D image-plane detector",
        xM: focalLengthM,
        gridId,
        mediumId: "air",
        output: "intensity"
      }
    ],
    microscopePipelines2D: [
      {
        id: "l3-pipeline",
        label: "Coherent scalar pupil focus",
        sourcePlaneId: "l3-source-field",
        samplePlaneIds: [],
        lensPlaneId: "l3-thin-lens-phase",
        pupilPlaneId: "l3-pupil",
        detectorPlaneId: "l3-detector",
        wavelengthM,
        mediumId: "air",
        outputFieldPolicy: "detectorOnly"
      }
    ],
    metadata: {
      ...base.metadata,
      appVersion: "0.4.0"
    }
  };
}

export const l3PresetScenes: Record<L3PresetId, Scene> = {
  airyPupil: makeL3PresetScene("airyPupil"),
  badSampling: makeL3PresetScene("badSampling")
};

export const l3PresetDefinitions: L3PresetDefinition[] = [
  { id: "airyPupil", label: l3PresetLabels.airyPupil, scene: l3PresetScenes.airyPupil },
  { id: "badSampling", label: l3PresetLabels.badSampling, scene: l3PresetScenes.badSampling }
];

export const l3AiryReference = {
  wavelengthM,
  focalLengthM,
  pupilDiameterM: pupilRadiusM * 2,
  firstMinimumRadiusM: (1.22 * wavelengthM * focalLengthM) / (pupilRadiusM * 2)
};
