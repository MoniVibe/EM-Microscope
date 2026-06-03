import { mulberry32 } from "../math/rng";

export type NoiseSample = {
  shotNoiseElectrons: number;
  readNoiseElectrons: number;
  prnuFactor: number;
  dsnuElectrons: number;
};

export function gaussianFromRandom(random: () => number): number {
  const u1 = Math.max(Number.MIN_VALUE, random());
  const u2 = Math.max(Number.MIN_VALUE, random());
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function makeSeededGaussian(seed: number): () => number {
  const random = mulberry32(seed);
  return () => gaussianFromRandom(random);
}

export function deterministicNoiseSample({
  seed,
  index,
  shotSigmaElectrons,
  readSigmaElectrons,
  prnuStdFraction = 0,
  dsnuElectronsRms = 0
}: {
  seed: number;
  index: number;
  shotSigmaElectrons: number;
  readSigmaElectrons: number;
  prnuStdFraction?: number;
  dsnuElectronsRms?: number;
}): NoiseSample {
  const gaussian = makeSeededGaussian((seed + Math.imul(index + 1, 0x9e3779b9)) >>> 0);
  const prnu = prnuStdFraction > 0 ? gaussian() * prnuStdFraction : 0;
  const dsnu = dsnuElectronsRms > 0 ? gaussian() * dsnuElectronsRms : 0;
  return {
    shotNoiseElectrons: shotSigmaElectrons > 0 ? gaussian() * shotSigmaElectrons : 0,
    readNoiseElectrons: readSigmaElectrons > 0 ? gaussian() * readSigmaElectrons : 0,
    prnuFactor: Math.max(0, 1 + prnu),
    dsnuElectrons: dsnu
  };
}
