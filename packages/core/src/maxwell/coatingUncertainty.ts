import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { CoatingStackDefinition } from "./coatingStack";

export type CoatingUncertaintyMode = "independent-thickness" | "correlated-thickness";
export type CoatingUncertaintySampleReduction = "none" | "deterministic-cap";

export type CoatingIndependentThicknessModel = {
  mode: "independent-thickness";
  sigmaNm: number;
  sigmaLevels?: number[];
  maxSamplesPerCandidate?: number;
};

export type CoatingCorrelatedThicknessModel = {
  mode: "correlated-thickness";
  preset?: "shared-scale" | "shared-offset-residual" | "custom";
  globalThicknessScale?: {
    sigmaFraction: number;
    sigmaLevels?: number[];
  };
  globalThicknessOffsetNm?: {
    sigmaNm: number;
    sigmaLevels?: number[];
  };
  perLayerResidualNm?: {
    sigmaNm: number;
    sigmaLevels?: number[];
  };
  layerGroupDrift?: Array<{
    groupId: string;
    layerIndices: number[];
    sigmaNm?: number;
    sigmaFraction?: number;
    sigmaLevels?: number[];
  }>;
  maxSamplesPerCandidate?: number;
};

export type CoatingUncertaintyModel = CoatingIndependentThicknessModel | CoatingCorrelatedThicknessModel;

export type NormalizedCoatingUncertaintyModel =
  | Required<CoatingIndependentThicknessModel>
  | {
      mode: "correlated-thickness";
      preset: "shared-scale" | "shared-offset-residual" | "custom";
      globalThicknessScale?: {
        sigmaFraction: number;
        sigmaLevels: number[];
      };
      globalThicknessOffsetNm?: {
        sigmaNm: number;
        sigmaLevels: number[];
      };
      perLayerResidualNm?: {
        sigmaNm: number;
        sigmaLevels: number[];
      };
      layerGroupDrift: Array<{
        groupId: string;
        layerIndices: number[];
        sigmaNm?: number;
        sigmaFraction?: number;
        sigmaLevels: number[];
      }>;
      maxSamplesPerCandidate: number;
    };

export type CoatingUncertaintyDriverReceipt = {
  id: string;
  label: string;
  kind: "layer-independent" | "global-scale" | "global-offset" | "layer-residual" | "layer-group";
  sigmaMultiplier: number;
  sigmaNm?: number;
  sigmaFraction?: number;
  layerIndices?: number[];
};

export type CoatingUncertaintySample = {
  id: string;
  label: string;
  weight: number;
  layerThicknessDeltasNm: number[];
  drivers: CoatingUncertaintyDriverReceipt[];
  resultHash: string;
};

export type CoatingUncertaintyPerturbation = {
  layerId: string;
  label: string;
  materialId: string;
  nominalThicknessM: number;
  deltaM: number;
  deltaNm: number;
  sampledThicknessM: number;
  drivers: CoatingUncertaintyDriverReceipt[];
};

export type CoatingUncertaintyReceipt = {
  model: CoatingUncertaintyMode;
  label: string;
  sigmaNm?: number;
  sigmaLevels?: number[];
  maxSamplesPerCandidate: number;
  generatedSamplesPerCandidate: number;
  theoreticalSamplesPerCandidate: number;
  sampleReduction: CoatingUncertaintySampleReduction;
  globalThicknessScale?: {
    sigmaFraction: number;
    sigmaLevels: number[];
  };
  globalThicknessOffsetNm?: {
    sigmaNm: number;
    sigmaLevels: number[];
  };
  perLayerResidualNm?: {
    sigmaNm: number;
    sigmaLevels: number[];
  };
  layerGroupDrift?: Array<{
    groupId: string;
    layerIndices: number[];
    sigmaNm?: number;
    sigmaFraction?: number;
    sigmaLevels: number[];
  }>;
};

export type CoatingUncertaintySampleSet = {
  model: NormalizedCoatingUncertaintyModel;
  samples: CoatingUncertaintySample[];
  receipt: CoatingUncertaintyReceipt;
};

type UncertaintyDriver = {
  id: string;
  label: string;
  kind: CoatingUncertaintyDriverReceipt["kind"];
  levels: number[];
  sigmaNm?: number;
  sigmaFraction?: number;
  layerIndices: number[];
  deltasNmForLevel: (level: number) => number[];
};

export function generateCoatingUncertaintySamples(stack: CoatingStackDefinition, model: CoatingUncertaintyModel): CoatingUncertaintySampleSet {
  const normalized = normalizeCoatingUncertaintyModel(model);
  const drivers = driversForModel(stack, normalized);
  const theoreticalSamplesPerCandidate = drivers.reduce((product, driver) => product * driver.levels.length, 1);
  const maxSamplesPerCandidate = normalized.maxSamplesPerCandidate;
  const vectors =
    theoreticalSamplesPerCandidate <= maxSamplesPerCandidate
      ? cartesianDriverVectors(drivers)
      : reducedDriverVectors(drivers, maxSamplesPerCandidate);
  const samples = uniqueVectors(vectors)
    .sort(compareVectors)
    .slice(0, maxSamplesPerCandidate)
    .map((vector, index) => sampleForVector(stack, drivers, vector, index));
  const sampleReduction: CoatingUncertaintySampleReduction = theoreticalSamplesPerCandidate <= maxSamplesPerCandidate ? "none" : "deterministic-cap";
  const receipt = receiptForModel(normalized, samples.length, theoreticalSamplesPerCandidate, sampleReduction);

  return {
    model: normalized,
    samples,
    receipt
  };
}

export function applyCoatingUncertaintySample(
  stack: CoatingStackDefinition,
  sample: CoatingUncertaintySample
): { stack: CoatingStackDefinition; perturbations: CoatingUncertaintyPerturbation[] } {
  const perturbations: CoatingUncertaintyPerturbation[] = [];
  const layers = stack.layers.map((layer, index) => {
    const deltaNm = sample.layerThicknessDeltasNm[index] ?? 0;
    const deltaM = deltaNm * 1e-9;
    const sampledThicknessM = Math.max(0.1e-9, layer.thicknessM + deltaM);
    const drivers = sample.drivers.filter((driver) => driver.layerIndices?.includes(index) ?? false);
    perturbations.push({
      layerId: layer.id,
      label: layer.label,
      materialId: layer.materialId,
      nominalThicknessM: layer.thicknessM,
      deltaM,
      deltaNm,
      sampledThicknessM,
      drivers
    });
    return { ...layer, thicknessM: sampledThicknessM };
  });

  return {
    stack: { ...stack, layers },
    perturbations
  };
}

export function normalizeCoatingUncertaintyModel(model: CoatingUncertaintyModel): NormalizedCoatingUncertaintyModel {
  if (model.mode === "independent-thickness") {
    const sigmaNm = clampFinite(model.sigmaNm, 0, 1000, "independent thickness sigma must be finite");
    return {
      mode: "independent-thickness",
      sigmaNm,
      sigmaLevels: normalizeLevels(model.sigmaLevels ?? [-2, 0, 2]),
      maxSamplesPerCandidate: clampInteger(model.maxSamplesPerCandidate ?? 81, 1, 1000)
    };
  }

  return {
    mode: "correlated-thickness",
    preset: model.preset ?? "custom",
    globalThicknessScale: model.globalThicknessScale
      ? {
          sigmaFraction: clampFinite(model.globalThicknessScale.sigmaFraction, 0, 1, "global thickness scale sigma must be finite"),
          sigmaLevels: normalizeLevels(model.globalThicknessScale.sigmaLevels ?? [-2, 0, 2])
        }
      : undefined,
    globalThicknessOffsetNm: model.globalThicknessOffsetNm
      ? {
          sigmaNm: clampFinite(model.globalThicknessOffsetNm.sigmaNm, 0, 1000, "global thickness offset sigma must be finite"),
          sigmaLevels: normalizeLevels(model.globalThicknessOffsetNm.sigmaLevels ?? [-2, 0, 2])
        }
      : undefined,
    perLayerResidualNm: model.perLayerResidualNm
      ? {
          sigmaNm: clampFinite(model.perLayerResidualNm.sigmaNm, 0, 1000, "per-layer residual sigma must be finite"),
          sigmaLevels: normalizeLevels(model.perLayerResidualNm.sigmaLevels ?? [-1, 0, 1])
        }
      : undefined,
    layerGroupDrift: (model.layerGroupDrift ?? []).map((group) => ({
      groupId: group.groupId,
      layerIndices: uniqueLayerIndices(group.layerIndices),
      sigmaNm: group.sigmaNm === undefined ? undefined : clampFinite(group.sigmaNm, 0, 1000, "layer group sigmaNm must be finite"),
      sigmaFraction: group.sigmaFraction === undefined ? undefined : clampFinite(group.sigmaFraction, 0, 1, "layer group sigmaFraction must be finite"),
      sigmaLevels: normalizeLevels(group.sigmaLevels ?? [-1, 0, 1])
    })),
    maxSamplesPerCandidate: clampInteger(model.maxSamplesPerCandidate ?? 81, 1, 1000)
  };
}

function driversForModel(stack: CoatingStackDefinition, model: NormalizedCoatingUncertaintyModel): UncertaintyDriver[] {
  if (stack.layers.length === 0) return [nominalDriver(stack)];
  if (model.mode === "independent-thickness") {
    return stack.layers.map((layer, index) => ({
      id: `layer:${layer.id}`,
      label: `${layer.label} independent thickness`,
      kind: "layer-independent",
      levels: model.sigmaLevels,
      sigmaNm: model.sigmaNm,
      layerIndices: [index],
      deltasNmForLevel: (level) => stack.layers.map((_, layerIndex) => (layerIndex === index ? model.sigmaNm * level : 0))
    }));
  }

  const drivers: UncertaintyDriver[] = [];
  if (model.globalThicknessScale) {
    const scale = model.globalThicknessScale;
    drivers.push({
      id: "global:scale",
      label: "Shared deposition scale",
      kind: "global-scale",
      levels: scale.sigmaLevels,
      sigmaFraction: scale.sigmaFraction,
      layerIndices: stack.layers.map((_, index) => index),
      deltasNmForLevel: (level) => stack.layers.map((layer) => layer.thicknessM * 1e9 * scale.sigmaFraction * level)
    });
  }
  if (model.globalThicknessOffsetNm) {
    const offset = model.globalThicknessOffsetNm;
    drivers.push({
      id: "global:offset",
      label: "Shared deposition offset",
      kind: "global-offset",
      levels: offset.sigmaLevels,
      sigmaNm: offset.sigmaNm,
      layerIndices: stack.layers.map((_, index) => index),
      deltasNmForLevel: (level) => stack.layers.map(() => offset.sigmaNm * level)
    });
  }
  for (const group of model.layerGroupDrift) {
    const validLayerIndices = group.layerIndices.filter((index) => index >= 0 && index < stack.layers.length);
    if (validLayerIndices.length === 0) continue;
    drivers.push({
      id: `group:${group.groupId}`,
      label: `Layer group ${group.groupId}`,
      kind: "layer-group",
      levels: group.sigmaLevels,
      sigmaNm: group.sigmaNm,
      sigmaFraction: group.sigmaFraction,
      layerIndices: validLayerIndices,
      deltasNmForLevel: (level) =>
        stack.layers.map((layer, index) => {
          if (!validLayerIndices.includes(index)) return 0;
          return (group.sigmaNm ?? 0) * level + layer.thicknessM * 1e9 * (group.sigmaFraction ?? 0) * level;
        })
    });
  }
  if (model.perLayerResidualNm) {
    const residual = model.perLayerResidualNm;
    for (const [index, layer] of stack.layers.entries()) {
      drivers.push({
        id: `residual:${layer.id}`,
        label: `${layer.label} residual`,
        kind: "layer-residual",
        levels: residual.sigmaLevels,
        sigmaNm: residual.sigmaNm,
        layerIndices: [index],
        deltasNmForLevel: (level) => stack.layers.map((_, layerIndex) => (layerIndex === index ? residual.sigmaNm * level : 0))
      });
    }
  }
  return drivers.length > 0 ? drivers : [nominalDriver(stack)];
}

function nominalDriver(stack: CoatingStackDefinition): UncertaintyDriver {
  return {
    id: "nominal",
    label: "Nominal",
    kind: "global-offset",
    levels: [0],
    layerIndices: stack.layers.map((_, index) => index),
    deltasNmForLevel: () => stack.layers.map(() => 0)
  };
}

function cartesianDriverVectors(drivers: UncertaintyDriver[]): number[][] {
  let output: number[][] = [[]];
  for (const driver of drivers) {
    const next: number[][] = [];
    for (const prefix of output) {
      for (const level of driver.levels) next.push([...prefix, level]);
    }
    output = next;
  }
  return output;
}

function reducedDriverVectors(drivers: UncertaintyDriver[], maxSamples: number): number[][] {
  const zero = drivers.map(() => 0);
  const vectors: number[][] = [zero];
  const sharedDrivers = drivers
    .map((driver, index) => ({ driver, index }))
    .filter(({ driver }) => driver.kind !== "layer-independent" && driver.kind !== "layer-residual");
  const residualDrivers = drivers
    .map((driver, index) => ({ driver, index }))
    .filter(({ driver }) => driver.kind === "layer-independent" || driver.kind === "layer-residual");

  for (const { driver, index } of sharedDrivers) {
    for (const level of nonzeroLevels(driver.levels)) {
      const vector = [...zero];
      vector[index] = level;
      vectors.push(vector);
    }
  }
  for (const { driver, index } of residualDrivers) {
    for (const level of nonzeroLevels(driver.levels)) {
      const vector = [...zero];
      vector[index] = level;
      vectors.push(vector);
    }
  }

  return uniqueVectors(vectors).sort(compareVectors).slice(0, maxSamples);
}

function sampleForVector(stack: CoatingStackDefinition, drivers: UncertaintyDriver[], vector: number[], index: number): CoatingUncertaintySample {
  const layerThicknessDeltasNm = stack.layers.map(() => 0);
  const receipts: CoatingUncertaintyDriverReceipt[] = [];
  for (const [driverIndex, driver] of drivers.entries()) {
    const level = vector[driverIndex] ?? 0;
    if (level === 0) continue;
    const driverDeltas = driver.deltasNmForLevel(level);
    for (const [layerIndex, deltaNm] of driverDeltas.entries()) {
      layerThicknessDeltasNm[layerIndex] = roundNumber((layerThicknessDeltasNm[layerIndex] ?? 0) + deltaNm);
    }
    receipts.push({
      id: driver.id,
      label: driver.label,
      kind: driver.kind,
      sigmaMultiplier: roundNumber(level),
      sigmaNm: driver.sigmaNm,
      sigmaFraction: driver.sigmaFraction,
      layerIndices: [...driver.layerIndices]
    });
  }
  const label = receipts.length === 0 ? "nominal" : receipts.map((receipt) => `${receipt.label} ${formatSigned(receipt.sigmaMultiplier)}sigma`).join(" + ");
  const resultHash = fnv1a64(
    stableStringify({
      index,
      label,
      vector: vector.map(roundNumber),
      layerThicknessDeltasNm: layerThicknessDeltasNm.map(roundNumber),
      drivers: receipts
    })
  );

  return {
    id: `uncertainty-sample-${index}`,
    label,
    weight: 1,
    layerThicknessDeltasNm,
    drivers: receipts,
    resultHash
  };
}

function receiptForModel(
  model: NormalizedCoatingUncertaintyModel,
  generatedSamplesPerCandidate: number,
  theoreticalSamplesPerCandidate: number,
  sampleReduction: CoatingUncertaintySampleReduction
): CoatingUncertaintyReceipt {
  if (model.mode === "independent-thickness") {
    return {
      model: "independent-thickness",
      label: "Independent layer thickness",
      sigmaNm: model.sigmaNm,
      sigmaLevels: [...model.sigmaLevels],
      maxSamplesPerCandidate: model.maxSamplesPerCandidate,
      generatedSamplesPerCandidate,
      theoreticalSamplesPerCandidate,
      sampleReduction
    };
  }

  return {
    model: "correlated-thickness",
    label: correlatedLabel(model),
    maxSamplesPerCandidate: model.maxSamplesPerCandidate,
    generatedSamplesPerCandidate,
    theoreticalSamplesPerCandidate,
    sampleReduction,
    globalThicknessScale: model.globalThicknessScale ? { ...model.globalThicknessScale, sigmaLevels: [...model.globalThicknessScale.sigmaLevels] } : undefined,
    globalThicknessOffsetNm: model.globalThicknessOffsetNm ? { ...model.globalThicknessOffsetNm, sigmaLevels: [...model.globalThicknessOffsetNm.sigmaLevels] } : undefined,
    perLayerResidualNm: model.perLayerResidualNm ? { ...model.perLayerResidualNm, sigmaLevels: [...model.perLayerResidualNm.sigmaLevels] } : undefined,
    layerGroupDrift: model.layerGroupDrift.length > 0 ? model.layerGroupDrift.map((group) => ({ ...group, layerIndices: [...group.layerIndices], sigmaLevels: [...group.sigmaLevels] })) : undefined
  };
}

function correlatedLabel(model: Extract<NormalizedCoatingUncertaintyModel, { mode: "correlated-thickness" }>): string {
  if (model.preset === "shared-scale") return "Shared deposition scale";
  if (model.preset === "shared-offset-residual") return "Shared offset + residual";
  return "Correlated thickness drift";
}

function normalizeLevels(levels: number[]): number[] {
  const output = uniqueNumbers(levels);
  if (!output.includes(0)) output.push(0);
  if (output.length === 0) throw new Error("uncertainty sigma levels must include at least one value");
  return output.sort((a, b) => a - b);
}

function uniqueLayerIndices(indices: number[]): number[] {
  return [...new Set(indices.map((index) => Math.round(index)).filter((index) => Number.isFinite(index)))].sort((a, b) => a - b);
}

function nonzeroLevels(levels: number[]): number[] {
  return levels.filter((level) => level !== 0).sort((a, b) => Math.abs(a) - Math.abs(b) || a - b);
}

function uniqueVectors(vectors: number[][]): number[][] {
  const seen = new Set<string>();
  const output: number[][] = [];
  for (const vector of vectors) {
    const rounded = vector.map(roundNumber);
    const key = rounded.join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(rounded);
  }
  return output;
}

function compareVectors(a: number[], b: number[]): number {
  const aMagnitude = a.reduce((sum, value) => sum + Math.abs(value), 0);
  const bMagnitude = b.reduce((sum, value) => sum + Math.abs(value), 0);
  if (aMagnitude !== bMagnitude) return aMagnitude - bMagnitude;
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const delta = (a[index] ?? 0) - (b[index] ?? 0);
    if (delta !== 0) return delta;
  }
  return 0;
}

function uniqueNumbers(values: number[]): number[] {
  const seen = new Set<string>();
  const output: number[] = [];
  for (const value of values) {
    if (!Number.isFinite(value)) throw new Error("uncertainty sigma levels must be finite");
    const rounded = roundNumber(value);
    const key = `${rounded}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(rounded);
  }
  return output;
}

function clampFinite(value: number, min: number, max: number, message: string): number {
  if (!Number.isFinite(value)) throw new Error(message);
  return Math.min(max, Math.max(min, value));
}

function clampInteger(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function roundNumber(value: number): number {
  return Number(value.toPrecision(12));
}

function formatSigned(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}
