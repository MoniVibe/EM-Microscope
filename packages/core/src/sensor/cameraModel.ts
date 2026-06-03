import type { CameraModel2D } from "../scene/schema";

export const defaultL32CameraModel: CameraModel2D = {
  id: "l3-camera",
  label: "L3.2 reference scientific CMOS",
  pixelPitchM: 6.5e-6,
  widthPx: 256,
  heightPx: 256,
  quantumEfficiency: 0.62,
  exposureS: 0.01,
  fullWellElectrons: 30000,
  readNoiseElectronsRms: 1.6,
  darkCurrentElectronsPerS: 0.4,
  bitDepth: 12,
  gainDnPerElectron: 0.12,
  blackLevelDn: 64,
  peakPhotonRatePerS: 2e6,
  seed: 1024
};

export function cameraWithDefaults(camera?: Partial<CameraModel2D>): CameraModel2D {
  return {
    ...defaultL32CameraModel,
    ...camera,
    nonuniformity: camera?.nonuniformity ? { ...camera.nonuniformity } : camera?.nonuniformity
  };
}

export function cameraMaxDigitalNumber(camera: CameraModel2D): number {
  return 2 ** camera.bitDepth - 1;
}

export function cameraDynamicRange(camera: CameraModel2D): number {
  return camera.readNoiseElectronsRms > 0 ? camera.fullWellElectrons / camera.readNoiseElectronsRms : Number.POSITIVE_INFINITY;
}
