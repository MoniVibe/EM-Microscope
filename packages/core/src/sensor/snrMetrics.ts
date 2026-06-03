import type { CameraModel2D } from "../scene/schema";
import { cameraDynamicRange, cameraMaxDigitalNumber } from "./cameraModel";
import type { CameraImageOutput2D } from "./pixelSampling2d";

export type SnrMetrics2D = {
  meanSignalElectrons: number;
  peakSignalElectrons: number;
  meanExpectedElectrons: number;
  peakExpectedElectrons: number;
  meanSnr: number;
  peakSnr: number;
  saturationFraction: number;
  dynamicRange: number;
  quantizationStepElectrons: number;
  warnings: string[];
  provenanceLabel: string;
};

export function computeSnrMetrics2D(camera: CameraModel2D, image: CameraImageOutput2D): SnrMetrics2D {
  const pixelCount = image.signalElectrons.length;
  let signalSum = 0;
  let expectedSum = 0;
  let signalPeak = 0;
  let expectedPeak = 0;
  let saturated = 0;

  for (let index = 0; index < pixelCount; index += 1) {
    const signal = image.signalElectrons[index] ?? 0;
    const expected = image.expectedElectrons[index] ?? 0;
    signalSum += signal;
    expectedSum += expected;
    signalPeak = Math.max(signalPeak, signal);
    expectedPeak = Math.max(expectedPeak, expected);
    saturated += image.saturationMask[index] ?? 0;
  }

  const meanSignal = pixelCount > 0 ? signalSum / pixelCount : 0;
  const meanExpected = pixelCount > 0 ? expectedSum / pixelCount : 0;
  const dark = camera.darkCurrentElectronsPerS * camera.exposureS;
  const meanNoise = Math.sqrt(Math.max(0, meanSignal + dark + camera.readNoiseElectronsRms ** 2));
  const peakNoise = Math.sqrt(Math.max(0, signalPeak + dark + camera.readNoiseElectronsRms ** 2));
  const maxDn = cameraMaxDigitalNumber(camera);
  const quantizationStep = camera.gainDnPerElectron > 0 ? 1 / camera.gainDnPerElectron : Number.POSITIVE_INFINITY;
  const saturationFraction = pixelCount > 0 ? saturated / pixelCount : 0;
  const warnings: string[] = [];

  if (saturationFraction > 0.001) warnings.push("Sensor saturation: one or more pixels reached full well or digital maximum.");
  if (meanSignal > 0 && meanSignal / meanNoise < 5) warnings.push("Low mean SNR: exposure, QE, or illumination may be insufficient.");
  if (camera.blackLevelDn >= maxDn * 0.25) warnings.push("High black level consumes a large fraction of digital range.");
  if (quantizationStep > Math.max(1, camera.readNoiseElectronsRms * 2)) warnings.push("Quantization step is coarse relative to read noise.");

  return {
    meanSignalElectrons: meanSignal,
    peakSignalElectrons: signalPeak,
    meanExpectedElectrons: meanExpected,
    peakExpectedElectrons: expectedPeak,
    meanSnr: meanNoise > 0 ? meanSignal / meanNoise : 0,
    peakSnr: peakNoise > 0 ? signalPeak / peakNoise : 0,
    saturationFraction,
    dynamicRange: cameraDynamicRange(camera),
    quantizationStepElectrons: quantizationStep,
    warnings,
    provenanceLabel: "L3.2 deterministic virtual camera estimate; relative photon calibration unless source power is calibrated."
  };
}
