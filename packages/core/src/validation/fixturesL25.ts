import { sampleL2Scene } from "../scene/sampleScene";
import type { Scene, SamplePlane1D } from "../scene/schema";

export type L25PresetId = "singleSlit" | "doubleSlit" | "grating" | "phaseStep" | "barTarget" | "badSampling";

export type L25PresetDefinition = {
  id: L25PresetId;
  label: string;
  scene: Scene;
};

const gridId = "grid-40mm-4096";

export const l25PresetLabels: Record<L25PresetId, string> = {
  singleSlit: "Single slit sample",
  doubleSlit: "Double slit sample",
  grating: "Amplitude grating",
  phaseStep: "Phase step",
  barTarget: "1D bar target",
  badSampling: "Bad sampling warning"
};

export function makeL25PresetScene(id: L25PresetId): Scene {
  const base = structuredClone(sampleL2Scene);
  const detectorXM = id === "grating" ? 0.5 : id === "barTarget" || id === "phaseStep" ? 0.2 : 1;
  const windowM = id === "grating" ? 0.08 : 0.04;
  const samples = id === "badSampling" ? 512 : id === "grating" ? 8192 : 4096;
  const spacingM = windowM / samples;
  const samplePlane = samplePlaneForPreset(id);

  return {
    ...base,
    sceneId: `sample-l25-${id}`,
    name: `L2.5 ${l25PresetLabels[id]}`,
    bench: {
      xMinM: 0,
      xMaxM: detectorXM + 0.05,
      yMinM: -windowM / 2,
      yMaxM: windowM / 2,
      opticalAxisYM: 0
    },
    elements: [
      {
        id: "sample-marker",
        type: "aperture",
        label: l25PresetLabels[id],
        xM: 0,
        yCenterM: 0,
        diameterM: sampleMarkerDiameterM(samplePlane)
      }
    ],
    detectors: [
      {
        id: "wave-detector-screen",
        type: "screenDetector",
        label: "Detector image-profile plane",
        xM: detectorXM,
        yCenterM: 0,
        heightM: windowM,
        bins: 128
      }
    ],
    fieldGrids1D: [
      {
        id: gridId,
        label: `${Math.round(windowM * 1000)} mm detector slice`,
        yMinM: -windowM / 2,
        yMaxM: windowM / 2,
        samples,
        spacingM
      }
    ],
    fieldPlanes1D: [
      {
        id: "source-field",
        label: "Coherent plane-wave source",
        role: "source",
        xM: 0,
        gridId,
        mediumId: "air",
        fieldSource: {
          kind: "uniformPlaneWave",
          amplitude: 1,
          phaseRad: 0
        }
      },
      {
        id: "detector-field",
        label: "Detector image-profile plane",
        role: "detector",
        xM: detectorXM,
        gridId,
        mediumId: "air"
      }
    ],
    masks1D: [],
    samplePlanes1D: [samplePlane],
    sampleMasks1D: [],
    metadata: {
      ...base.metadata,
      appVersion: "0.3.0"
    }
  };
}

export const l25PresetScenes: Record<L25PresetId, Scene> = {
  singleSlit: makeL25PresetScene("singleSlit"),
  doubleSlit: makeL25PresetScene("doubleSlit"),
  grating: makeL25PresetScene("grating"),
  phaseStep: makeL25PresetScene("phaseStep"),
  barTarget: makeL25PresetScene("barTarget"),
  badSampling: makeL25PresetScene("badSampling")
};

export const l25PresetDefinitions: L25PresetDefinition[] = [
  { id: "singleSlit", label: l25PresetLabels.singleSlit, scene: l25PresetScenes.singleSlit },
  { id: "doubleSlit", label: l25PresetLabels.doubleSlit, scene: l25PresetScenes.doubleSlit },
  { id: "grating", label: l25PresetLabels.grating, scene: l25PresetScenes.grating },
  { id: "phaseStep", label: l25PresetLabels.phaseStep, scene: l25PresetScenes.phaseStep },
  { id: "barTarget", label: l25PresetLabels.barTarget, scene: l25PresetScenes.barTarget },
  { id: "badSampling", label: l25PresetLabels.badSampling, scene: l25PresetScenes.badSampling }
];

function samplePlaneForPreset(id: L25PresetId): SamplePlane1D {
  const base = {
    id: "sample-plane",
    type: "samplePlane1D" as const,
    label: l25PresetLabels[id],
    xM: 0,
    gridId
  };

  if (id === "singleSlit") {
    return {
      ...base,
      transmission: {
        kind: "analyticAmplitude",
        profile: { kind: "singleSlit", widthM: 100e-6, centerYM: 0 }
      }
    };
  }

  if (id === "doubleSlit") {
    return {
      ...base,
      transmission: {
        kind: "analyticAmplitude",
        profile: { kind: "doubleSlit", slitWidthM: 80e-6, separationM: 250e-6, centerYM: 0 }
      }
    };
  }

  if (id === "grating") {
    return {
      ...base,
      transmission: {
        kind: "analyticAmplitude",
        profile: { kind: "grating", periodM: 200e-6, slitWidthM: 80e-6, count: 11, centerYM: 0 }
      }
    };
  }

  if (id === "badSampling") {
    return {
      ...base,
      transmission: {
        kind: "analyticAmplitude",
        profile: { kind: "grating", periodM: 20e-6, slitWidthM: 8e-6, count: 11, centerYM: 0 }
      }
    };
  }

  if (id === "phaseStep") {
    return {
      ...base,
      transmission: {
        kind: "analyticPhase",
        profile: { kind: "phaseStep", stepYM: 0, phaseLeftRad: 0, phaseRightRad: Math.PI }
      }
    };
  }

  return {
    ...base,
    transmission: {
      kind: "analyticAmplitude",
      profile: { kind: "barTarget1D", periodM: 250e-6, dutyCycle: 0.5, bars: 9, contrast: 0.85, centerYM: 0 }
    }
  };
}

function sampleMarkerDiameterM(sample: SamplePlane1D): number {
  const transmission = sample.transmission;
  if (transmission.kind === "analyticPhase") return 0.006;
  const profile = transmission.kind === "analyticAmplitude" ? transmission.profile : transmission.amplitudeProfile;
  if (profile.kind === "singleSlit") return profile.widthM;
  if (profile.kind === "doubleSlit") return profile.separationM + profile.slitWidthM;
  if (profile.kind === "grating") return profile.periodM * profile.count;
  return profile.periodM * profile.bars;
}
