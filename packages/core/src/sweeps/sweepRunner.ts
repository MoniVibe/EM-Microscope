import type { CameraModel2D, MeasurementSettings2D, SweepDefinition, SweepParameter } from "../scene/schema";
import type { FieldOutput2D } from "../solvers/Solver";
import { computeSamplingMetrics2D } from "../sensor/samplingMetrics";
import { renderCameraImage2D } from "../sensor/pixelSampling2d";
import { computeSnrMetrics2D } from "../sensor/snrMetrics";
import { computeMtf2D } from "../wave/otfMtf2d";
import { summarizeImage2D } from "../wave/radialProfile2d";

export type SweepRow = {
  parameters: Record<string, number>;
  outputs: Record<string, number | null>;
  warnings: string[];
};

export type SweepResult = {
  id: string;
  label: string;
  rowCount: number;
  rows: SweepRow[];
  provenanceLabel: string;
};

export function runSweepDefinition2D({
  field,
  camera,
  measurement,
  definition,
  maxRows = 64
}: {
  field: FieldOutput2D;
  camera: CameraModel2D;
  measurement?: MeasurementSettings2D;
  definition: SweepDefinition;
  maxRows?: number;
}): SweepResult {
  const rows: SweepRow[] = [];
  const mtf = computeMtf2D(field, 64);
  const imageSummary = summarizeImage2D(field);
  const combinations = cartesianParameters(definition.parameters).slice(0, maxRows);

  for (const parameters of combinations) {
    const sweptCamera = applyCameraParameters(camera, parameters);
    const sensor = renderCameraImage2D(field, sweptCamera, { includeNoise: false });
    const snr = computeSnrMetrics2D(sweptCamera, sensor);
    const sampling = computeSamplingMetrics2D({ pixelPitchM: sweptCamera.pixelPitchM, measurement, mtf });
    const output: Record<string, number | null> = {};
    for (const requested of definition.outputs) {
      if (requested === "mtf50") output.mtf50 = mtf.mtf50CyclesPerM;
      if (requested === "snrMean") output.snrMean = snr.meanSnr;
      if (requested === "saturationFraction") output.saturationFraction = snr.saturationFraction;
      if (requested === "contrastAtTarget") output.contrastAtTarget = sampling.contrastAtTarget;
      if (requested === "edgeEnergyFraction") output.edgeEnergyFraction = imageSummary.edgeFraction;
    }
    rows.push({
      parameters,
      outputs: output,
      warnings: [...snr.warnings, ...sampling.warnings]
    });
  }

  return {
    id: definition.id,
    label: definition.label,
    rowCount: rows.length,
    rows,
    provenanceLabel: "L3.2 deterministic post-processing sweep over camera/measurement parameters; physics field is reused."
  };
}

export function sweepResultToCsv(result: SweepResult): string {
  const parameterKeys = Array.from(new Set(result.rows.flatMap((row) => Object.keys(row.parameters))));
  const outputKeys = Array.from(new Set(result.rows.flatMap((row) => Object.keys(row.outputs))));
  const lines = [[...parameterKeys, ...outputKeys, "warnings"].join(",")];
  for (const row of result.rows) {
    lines.push(
      [
        ...parameterKeys.map((key) => row.parameters[key] ?? ""),
        ...outputKeys.map((key) => row.outputs[key] ?? ""),
        row.warnings.join("; ")
      ].join(",")
    );
  }
  return lines.join("\n");
}

function cartesianParameters(parameters: SweepParameter[]): Record<string, number>[] {
  let rows: Record<string, number>[] = [{}];
  for (const parameter of parameters) {
    const next: Record<string, number>[] = [];
    for (const row of rows) {
      for (const value of parameter.values) {
        next.push({ ...row, [parameter.kind]: value });
      }
    }
    rows = next;
  }
  return rows;
}

function applyCameraParameters(camera: CameraModel2D, parameters: Record<string, number>): CameraModel2D {
  return {
    ...camera,
    pixelPitchM: parameters.pixelPitchM ?? camera.pixelPitchM,
    exposureS: parameters.exposureS ?? camera.exposureS,
    quantumEfficiency: parameters.quantumEfficiency ?? camera.quantumEfficiency
  };
}
