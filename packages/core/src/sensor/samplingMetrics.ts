import type { MeasurementSettings2D } from "../scene/schema";
import { interpolateMtfAtFrequency, nyquistFrequencyCyclesPerM, type MtfMetrics2D } from "../wave/otfMtf2d";

export type SamplingMetrics2D = {
  pixelPitchM: number;
  nyquistCyclesPerM: number;
  targetFrequencyCyclesPerM: number | null;
  contrastAtTarget: number | null;
  warnings: string[];
  provenanceLabel: string;
};

export function computeSamplingMetrics2D({
  pixelPitchM,
  measurement,
  mtf
}: {
  pixelPitchM: number;
  measurement?: MeasurementSettings2D;
  mtf?: MtfMetrics2D;
}): SamplingMetrics2D {
  const nyquist = nyquistFrequencyCyclesPerM(pixelPitchM);
  const targetFrequency =
    measurement?.mtfFrequencyCyclesPerM ?? (measurement?.targetFeaturePeriodM ? 1 / measurement.targetFeaturePeriodM : null);
  const contrastAtTarget = targetFrequency !== null && mtf ? interpolateMtfAtFrequency(mtf.radial, targetFrequency) : null;
  const warnings: string[] = [];
  if (targetFrequency !== null && targetFrequency > nyquist) warnings.push("Target feature frequency exceeds sensor Nyquist; aliasing is expected.");
  if (contrastAtTarget !== null && contrastAtTarget < 0.1) warnings.push("Low contrast transfer at the selected target feature frequency.");
  return {
    pixelPitchM,
    nyquistCyclesPerM: nyquist,
    targetFrequencyCyclesPerM: targetFrequency,
    contrastAtTarget,
    warnings,
    provenanceLabel: "Sampling metrics from camera pixel pitch and L3.2 MTF; no sensor MTF or demosaic model included."
  };
}
