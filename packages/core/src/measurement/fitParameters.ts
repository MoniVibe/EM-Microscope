import type { FitParameter2D } from "../scene/schema";

export type FitPresetId2D = "focus" | "resolution" | "illumination" | "cameraLite";

export type FitPreset2D = {
  id: FitPresetId2D;
  label: string;
  parameters: FitParameter2D[];
};

export const defaultFitPresets2D: FitPreset2D[] = [
  {
    id: "focus",
    label: "Focus fit",
    parameters: [
      { kind: "defocusM", min: -2e-6, max: 2e-6, steps: 5 },
      { kind: "intensityScale", min: 0.75, max: 1.25, steps: 5 },
      { kind: "backgroundOffset", min: -0.05, max: 0.1, steps: 4 }
    ]
  },
  {
    id: "resolution",
    label: "Resolution fit",
    parameters: [
      { kind: "effectiveNA", min: 0.01, max: 0.12, steps: 5 },
      { kind: "gaussianBlurSigmaPx", min: 0, max: 2.4, steps: 7 },
      { kind: "intensityScale", min: 0.75, max: 1.25, steps: 5 }
    ]
  },
  {
    id: "illumination",
    label: "Illumination fit",
    parameters: [
      { kind: "sourceNA", min: 0, max: 0.08, steps: 5 },
      { kind: "backgroundOffset", min: -0.05, max: 0.1, steps: 4 },
      { kind: "intensityScale", min: 0.75, max: 1.25, steps: 5 }
    ]
  },
  {
    id: "cameraLite",
    label: "Camera fit lite",
    parameters: [
      { kind: "gaussianBlurSigmaPx", min: 0, max: 1.5, steps: 4 },
      { kind: "intensityScale", min: 0.75, max: 1.25, steps: 5 },
      { kind: "backgroundOffset", min: -0.05, max: 0.15, steps: 5 }
    ]
  }
];

export function fitPresetById2D(id: FitPresetId2D): FitPreset2D {
  const preset = defaultFitPresets2D.find((candidate) => candidate.id === id);
  if (!preset) throw new Error(`unknown fit preset: ${id}`);
  return preset;
}

export function fitParameterValues2D(parameter: FitParameter2D): number[] {
  const steps = Math.max(2, Math.round(parameter.steps));
  const values: number[] = [];
  for (let index = 0; index < steps; index += 1) {
    const t = steps === 1 ? 0 : index / (steps - 1);
    values.push(parameter.min + (parameter.max - parameter.min) * t);
  }
  return values;
}
