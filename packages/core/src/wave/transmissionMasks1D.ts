import type { SampleTransmission1D } from "../scene/schema";

export type ComplexTransmission = {
  amplitude: number;
  phaseRad: number;
};

type AmplitudeProfile1D =
  | Extract<SampleTransmission1D, { kind: "analyticAmplitude" }>["profile"]
  | Extract<SampleTransmission1D, { kind: "analyticComplex" }>["amplitudeProfile"];

type PhaseProfile1D =
  | Extract<SampleTransmission1D, { kind: "analyticPhase" }>["profile"]
  | Extract<SampleTransmission1D, { kind: "analyticComplex" }>["phaseProfile"];

export function transmissionAtY(transmission: SampleTransmission1D, yM: number): ComplexTransmission {
  if (transmission.kind === "analyticAmplitude") {
    return { amplitude: amplitudeProfileAtY(transmission.profile, yM), phaseRad: 0 };
  }
  if (transmission.kind === "analyticPhase") {
    return { amplitude: 1, phaseRad: phaseProfileAtY(transmission.profile, yM) };
  }
  return {
    amplitude: amplitudeProfileAtY(transmission.amplitudeProfile, yM),
    phaseRad: phaseProfileAtY(transmission.phaseProfile, yM)
  };
}

export function minimumFeatureSizeM(transmission: SampleTransmission1D): number | null {
  if (transmission.kind === "analyticAmplitude") {
    return amplitudeFeatureSizeM(transmission.profile);
  }
  if (transmission.kind === "analyticPhase") {
    return phaseFeatureSizeM(transmission.profile);
  }
  const amplitudeFeature = amplitudeFeatureSizeM(transmission.amplitudeProfile);
  const phaseFeature = phaseFeatureSizeM(transmission.phaseProfile);
  if (amplitudeFeature === null) return phaseFeature;
  if (phaseFeature === null) return amplitudeFeature;
  return Math.min(amplitudeFeature, phaseFeature);
}

function amplitudeProfileAtY(profile: AmplitudeProfile1D, yM: number): number {
  if (profile.kind === "singleSlit") {
    return Math.abs(yM - profile.centerYM) <= profile.widthM / 2 ? 1 : 0;
  }

  if (profile.kind === "doubleSlit") {
    const left = profile.centerYM - profile.separationM / 2;
    const right = profile.centerYM + profile.separationM / 2;
    return Math.abs(yM - left) <= profile.slitWidthM / 2 || Math.abs(yM - right) <= profile.slitWidthM / 2 ? 1 : 0;
  }

  if (profile.kind === "grating") {
    const relative = yM - profile.centerYM;
    const nearest = Math.round(relative / profile.periodM);
    const halfCount = (profile.count - 1) / 2;
    if (Math.abs(nearest) > halfCount + 1e-12) return 0;
    return Math.abs(relative - nearest * profile.periodM) <= profile.slitWidthM / 2 ? 1 : 0;
  }

  const totalWidthM = profile.bars * profile.periodM;
  const local = yM - profile.centerYM + totalWidthM / 2;
  if (local < 0 || local > totalWidthM) return 1;
  const cycle = local % profile.periodM;
  const bright = cycle < profile.periodM * profile.dutyCycle;
  return bright ? 1 : 1 - profile.contrast;
}

function phaseProfileAtY(profile: PhaseProfile1D, yM: number): number {
  if (profile.kind === "phaseStep") {
    return yM < profile.stepYM ? profile.phaseLeftRad : profile.phaseRightRad;
  }

  const local = positiveModulo(yM - profile.centerYM, profile.periodM);
  return local < profile.periodM * profile.dutyCycle ? profile.phaseDepthRad : 0;
}

function amplitudeFeatureSizeM(profile: AmplitudeProfile1D): number {
  if (profile.kind === "singleSlit") return profile.widthM;
  if (profile.kind === "doubleSlit") return profile.slitWidthM;
  if (profile.kind === "grating") return Math.min(profile.slitWidthM, profile.periodM - profile.slitWidthM);
  return Math.min(profile.periodM * profile.dutyCycle, profile.periodM * (1 - profile.dutyCycle));
}

function phaseFeatureSizeM(profile: PhaseProfile1D): number | null {
  if (profile.kind === "phaseStep") return null;
  return Math.min(profile.periodM * profile.dutyCycle, profile.periodM * (1 - profile.dutyCycle));
}

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}
