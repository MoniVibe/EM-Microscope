import type { FieldOutput2D } from "../solvers/Solver";
import { crossSectionsThroughPeak } from "./crossSections2d";
import { summarizeImage2D } from "./radialProfile2d";

export type PsfMetrics2D = {
  peakUM: number;
  peakVM: number;
  centroidUM: number;
  centroidVM: number;
  fwhmUM: number | null;
  fwhmVM: number | null;
  edgeEnergyFraction: number;
  warnings: string[];
  provenanceLabel: string;
};

export function computePsfMetrics2D(field: FieldOutput2D): PsfMetrics2D {
  const summary = summarizeImage2D(field);
  const cross = crossSectionsThroughPeak(field);
  const peakU = cross.horizontal[cross.centerUIndex]?.coordinateM ?? 0;
  const peakV = cross.vertical[cross.centerVIndex]?.coordinateM ?? 0;
  const warnings: string[] = [];
  if (summary.edgeFraction > 0.02) warnings.push("PSF edge energy is high; enlarge the detector grid before trusting MTF tails.");
  if (Math.abs(summary.centroidUM) > Math.abs(field.uMaxM - field.uMinM) * 0.05 || Math.abs(summary.centroidVM) > Math.abs(field.vMaxM - field.vMinM) * 0.05) {
    warnings.push("PSF centroid is displaced from the detector center; MTF may include alignment effects.");
  }

  return {
    peakUM: peakU,
    peakVM: peakV,
    centroidUM: summary.centroidUM,
    centroidVM: summary.centroidVM,
    fwhmUM: fullWidthHalfMax(cross.horizontal),
    fwhmVM: fullWidthHalfMax(cross.vertical),
    edgeEnergyFraction: summary.edgeFraction,
    warnings,
    provenanceLabel: "PSF metrics derived from L3 coherent scalar detector intensity."
  };
}

function fullWidthHalfMax(samples: Array<{ coordinateM: number; normalized: number }>): number | null {
  const peakIndex = samples.reduce((best, sample, index) => (sample.normalized > (samples[best]?.normalized ?? 0) ? index : best), 0);
  const left = crossing(samples, peakIndex, -1);
  const right = crossing(samples, peakIndex, 1);
  if (left === null || right === null) return null;
  return Math.abs(right - left);
}

function crossing(samples: Array<{ coordinateM: number; normalized: number }>, start: number, direction: -1 | 1): number | null {
  for (let index = start; index >= 0 && index < samples.length; index += direction) {
    const current = samples[index];
    const next = samples[index + direction];
    if (!current || !next) continue;
    if (next.normalized <= 0.5) {
      const span = current.normalized - next.normalized;
      const t = span > 0 ? (current.normalized - 0.5) / span : 0;
      return current.coordinateM + (next.coordinateM - current.coordinateM) * t;
    }
  }
  return null;
}
