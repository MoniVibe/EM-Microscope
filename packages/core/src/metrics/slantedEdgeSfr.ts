import type { TestTarget2D } from "../scene/schema";
import type { FieldOutput2D } from "../solvers/Solver";
import { michelsonContrast } from "./targetContrast2d";

export type SlantedEdgeSfrMetrics = {
  edgeContrast: number | null;
  sfr50CyclesPerM: number | null;
  binCount: number;
  provenanceLabel: "L3.3 slanted-edge SFR approximation";
  warnings: string[];
};

export function computeSlantedEdgeSfr2D(field: FieldOutput2D, target: Extract<TestTarget2D, { kind: "slantedEdge" }>, binCount = 256): SlantedEdgeSfrMetrics {
  const bins = Math.max(32, Math.min(512, Math.round(binCount)));
  const samples = projectedEdgeSamples(field, target.edgeAngleRad);
  if (samples.length < bins) {
    return emptySfr(bins, ["Not enough detector samples for slanted-edge SFR estimate."]);
  }
  samples.sort((a, b) => a.sM - b.sM);
  const minS = samples[0]?.sM ?? 0;
  const maxS = samples[samples.length - 1]?.sM ?? minS;
  const spanM = maxS - minS;
  if (spanM <= 0) {
    return emptySfr(bins, ["Degenerate slanted-edge projection span."]);
  }

  const sums = new Float64Array(bins);
  const counts = new Uint32Array(bins);
  for (const sample of samples) {
    const index = Math.min(bins - 1, Math.max(0, Math.floor(((sample.sM - minS) / spanM) * bins)));
    sums[index] = (sums[index] ?? 0) + sample.intensity;
    counts[index] = (counts[index] ?? 0) + 1;
  }

  const esf = new Float64Array(bins);
  let last = 0;
  for (let index = 0; index < bins; index += 1) {
    if (counts[index]) {
      last = (sums[index] ?? 0) / (counts[index] ?? 1);
    }
    esf[index] = last;
  }

  const edgeContrast = michelsonContrast(esf, 0.1, 0.9);
  const lsf = new Float64Array(bins - 1);
  for (let index = 0; index < lsf.length; index += 1) {
    lsf[index] = Math.abs((esf[index + 1] ?? 0) - (esf[index] ?? 0));
  }

  const dft = dftMagnitude(lsf);
  const reference = Math.max(...Array.from(dft.slice(1)), 0);
  if (reference <= 0) {
    return emptySfr(bins, ["Slanted-edge line-spread estimate has no measurable frequency content."], edgeContrast);
  }

  const binSpacingM = spanM / bins;
  let sfr50CyclesPerM: number | null = null;
  for (let index = 1; index < dft.length; index += 1) {
    const normalized = (dft[index] ?? 0) / reference;
    if (normalized <= 0.5) {
      sfr50CyclesPerM = index / (lsf.length * binSpacingM);
      break;
    }
  }

  return {
    edgeContrast,
    sfr50CyclesPerM,
    binCount: bins,
    provenanceLabel: "L3.3 slanted-edge SFR approximation",
    warnings: sfr50CyclesPerM === null ? ["SFR50 did not cross 0.5 inside the sampled frequency range."] : []
  };
}

function projectedEdgeSamples(field: FieldOutput2D, angleRad: number): { sM: number; intensity: number }[] {
  const samples: { sM: number; intensity: number }[] = [];
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const spacingUM = (field.uMaxM - field.uMinM) / field.width;
  const spacingVM = (field.vMaxM - field.vMinM) / field.height;
  for (let vIndex = 0; vIndex < field.height; vIndex += 1) {
    const vM = field.vMinM + (vIndex + 0.5) * spacingVM;
    for (let uIndex = 0; uIndex < field.width; uIndex += 1) {
      const uM = field.uMinM + (uIndex + 0.5) * spacingUM;
      samples.push({
        sM: uM * cos + vM * sin,
        intensity: field.intensity[vIndex * field.width + uIndex] ?? 0
      });
    }
  }
  return samples;
}

function dftMagnitude(values: Float64Array): Float64Array {
  const limit = Math.floor(values.length / 2);
  const output = new Float64Array(limit);
  for (let k = 0; k < limit; k += 1) {
    let real = 0;
    let imag = 0;
    for (let n = 0; n < values.length; n += 1) {
      const phase = (-2 * Math.PI * k * n) / values.length;
      const value = values[n] ?? 0;
      real += value * Math.cos(phase);
      imag += value * Math.sin(phase);
    }
    output[k] = Math.hypot(real, imag);
  }
  return output;
}

function emptySfr(binCount: number, warnings: string[], edgeContrast: number | null = null): SlantedEdgeSfrMetrics {
  return {
    edgeContrast,
    sfr50CyclesPerM: null,
    binCount,
    provenanceLabel: "L3.3 slanted-edge SFR approximation",
    warnings
  };
}
