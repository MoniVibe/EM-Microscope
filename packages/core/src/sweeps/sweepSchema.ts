import type { SweepDefinition } from "../scene/schema";

export const defaultL32SweepDefinitions: SweepDefinition[] = [
  {
    id: "exposure-qe",
    label: "Exposure x QE",
    parameters: [
      { kind: "exposureS", values: [0.0025, 0.005, 0.01, 0.02] },
      { kind: "quantumEfficiency", values: [0.35, 0.62, 0.85] }
    ],
    outputs: ["snrMean", "saturationFraction", "contrastAtTarget"]
  },
  {
    id: "pixel-pitch",
    label: "Pixel pitch",
    parameters: [{ kind: "pixelPitchM", values: [3.45e-6, 6.5e-6, 11e-6, 15e-6] }],
    outputs: ["mtf50", "snrMean", "contrastAtTarget"]
  }
];
