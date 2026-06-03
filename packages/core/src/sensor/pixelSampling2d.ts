import type { CameraModel2D } from "../scene/schema";
import type { FieldOutput2D, PhysicsProvenance } from "../solvers/Solver";
import { cameraMaxDigitalNumber } from "./cameraModel";
import { deterministicNoiseSample } from "./noiseModel";

export type CameraImageOutput2D = {
  id: string;
  label: string;
  widthPx: number;
  heightPx: number;
  pixelPitchM: number;
  uMinM: number;
  uMaxM: number;
  vMinM: number;
  vMaxM: number;
  normalizedIrradiance: Float64Array;
  signalElectrons: Float64Array;
  darkElectrons: Float64Array;
  expectedElectrons: Float64Array;
  noisyElectrons: Float64Array;
  digitalNumbers: Uint16Array;
  saturationMask: Uint8Array;
  provenance: PhysicsProvenance;
};

export type CameraRenderOptions = {
  includeNoise?: boolean;
  id?: string;
  label?: string;
};

export function renderCameraImage2D(field: FieldOutput2D, camera: CameraModel2D, options: CameraRenderOptions = {}): CameraImageOutput2D {
  const width = camera.widthPx;
  const height = camera.heightPx;
  const normalizedIrradiance = new Float64Array(width * height);
  const signalElectrons = new Float64Array(width * height);
  const darkElectrons = new Float64Array(width * height);
  const expectedElectrons = new Float64Array(width * height);
  const noisyElectrons = new Float64Array(width * height);
  const digitalNumbers = new Uint16Array(width * height);
  const saturationMask = new Uint8Array(width * height);
  const maxDigitalNumber = cameraMaxDigitalNumber(camera);
  const includeNoise = options.includeNoise ?? true;
  const peak = maxValue(field.intensity);
  const uSpan = width * camera.pixelPitchM;
  const vSpan = height * camera.pixelPitchM;
  const uMinM = -uSpan / 2;
  const vMinM = -vSpan / 2;
  const darkPerPixel = camera.darkCurrentElectronsPerS * camera.exposureS;
  const prnuStdFraction = camera.nonuniformity?.prnuStdFraction ?? 0;
  const dsnuElectronsRms = camera.nonuniformity?.dsnuElectronsRms ?? 0;

  for (let v = 0; v < height; v += 1) {
    for (let u = 0; u < width; u += 1) {
      const index = v * width + u;
      const uM = uMinM + (u + 0.5) * camera.pixelPitchM;
      const vM = vMinM + (v + 0.5) * camera.pixelPitchM;
      const normalized = peak > 0 ? sampleNearestNormalized(field, uM, vM, peak) : 0;
      const rawSignalElectrons = normalized * camera.peakPhotonRatePerS * camera.exposureS * camera.quantumEfficiency;
      const shotSigma = Math.sqrt(Math.max(0, rawSignalElectrons + darkPerPixel));
      const noise = includeNoise
        ? deterministicNoiseSample({
            seed: camera.seed,
            index,
            shotSigmaElectrons: shotSigma,
            readSigmaElectrons: camera.readNoiseElectronsRms,
            prnuStdFraction,
            dsnuElectronsRms
          })
        : { shotNoiseElectrons: 0, readNoiseElectrons: 0, prnuFactor: 1, dsnuElectrons: 0 };
      const signal = rawSignalElectrons * noise.prnuFactor;
      const expected = signal + darkPerPixel + noise.dsnuElectrons;
      const noisy = expected + noise.shotNoiseElectrons + noise.readNoiseElectrons;
      const clipped = Math.max(0, Math.min(camera.fullWellElectrons, noisy));
      const digital = Math.max(0, Math.min(maxDigitalNumber, Math.round(camera.blackLevelDn + clipped * camera.gainDnPerElectron)));

      normalizedIrradiance[index] = normalized;
      signalElectrons[index] = signal;
      darkElectrons[index] = darkPerPixel;
      expectedElectrons[index] = Math.max(0, expected);
      noisyElectrons[index] = clipped;
      digitalNumbers[index] = digital;
      saturationMask[index] = noisy >= camera.fullWellElectrons || digital >= maxDigitalNumber ? 1 : 0;
    }
  }

  return {
    id: options.id ?? `${field.id}-camera`,
    label: options.label ?? `${camera.label} image`,
    widthPx: width,
    heightPx: height,
    pixelPitchM: camera.pixelPitchM,
    uMinM,
    uMaxM: uMinM + uSpan,
    vMinM,
    vMaxM: vMinM + vSpan,
    normalizedIrradiance,
    signalElectrons,
    darkElectrons,
    expectedElectrons,
    noisyElectrons,
    digitalNumbers,
    saturationMask,
    provenance: {
      kind: "simulated",
      level: "L3",
      solverId: "scalar.coherent.l3.2d",
      model: "scalar-wave-2d-angular-spectrum",
      dimensionality: "2d",
      approximation: [
        "L3.2 virtual camera post-process",
        "relative photon calibration unless externally calibrated",
        "deterministic shot/read/dark noise estimate"
      ]
    }
  };
}

function sampleNearestNormalized(field: FieldOutput2D, uM: number, vM: number, peak: number): number {
  if (uM < field.uMinM || uM > field.uMaxM || vM < field.vMinM || vM > field.vMaxM) return 0;
  const uIndex = Math.max(0, Math.min(field.width - 1, Math.floor(((uM - field.uMinM) / (field.uMaxM - field.uMinM)) * field.width)));
  const vIndex = Math.max(0, Math.min(field.height - 1, Math.floor(((vM - field.vMinM) / (field.vMaxM - field.vMinM)) * field.height)));
  const intensity = field.intensity[vIndex * field.width + uIndex] ?? 0;
  return Math.max(0, intensity / peak);
}

function maxValue(values: Float64Array): number {
  let max = 0;
  for (const value of values) max = Math.max(max, value);
  return max;
}
