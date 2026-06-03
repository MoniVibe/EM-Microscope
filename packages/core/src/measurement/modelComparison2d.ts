import { testTargetCyclesPerM } from "../wave/testTargets2d";
import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { MeasuredImage2D, MeasurementRoi2D, TestTarget2D } from "../scene/schema";
import type { FieldOutput2D, SolverResult, SolverWarning } from "../solvers/Solver";
import { computeMeasuredRoiMetrics2D, computeRoiMetrics2D, type MeasuredRoiMetrics2D } from "./measuredMetrics2d";
import type { MeasuredImagePixels2D } from "./measuredImage2d";
import { createResidualMap2D, centralResidualCrossSection2D, resampleFieldToMeasuredPixels2D, type ResidualMap2D } from "./residualMaps2d";
import { extractMeasurementRoi2D, type ExtractedRoiPixels2D } from "./roi2d";

export type ComparisonMetricName2D =
  | "contrast"
  | "sfr50"
  | "psfFwhm"
  | "centroidX"
  | "centroidY"
  | "noise"
  | "background"
  | "flatNonuniformity";

export type ComparisonMetricDelta2D = {
  roiId: string;
  metric: ComparisonMetricName2D;
  measured: number;
  simulated: number;
  delta: number;
  unit?: string;
};

export type ComparisonRoiOutput2D = {
  roiId: string;
  roiLabel: string;
  roiType: MeasurementRoi2D["type"];
  measuredMetrics: MeasuredRoiMetrics2D;
  simulatedMetrics: MeasuredRoiMetrics2D;
  measuredCrop: ExtractedRoiPixels2D;
  simulatedCrop: ExtractedRoiPixels2D;
  residualMap: ResidualMap2D;
  crossSection: {
    measured: number[];
    simulated: number[];
    residual: number[];
  };
  metricDeltas: ComparisonMetricDelta2D[];
};

export type ComparisonRunOutput2D = {
  id: string;
  type: "measuredSimulatedComparison2D";
  analysisId: "analysis.measuredCompare.l3.4b.2d";
  label: string;
  measuredImageHash: string;
  simulatedResultHash: string;
  sceneHash?: string;
  roiIds: string[];
  targetFrequencyCyclesPerM: number | null;
  roiOutputs: ComparisonRoiOutput2D[];
  metricDeltas: ComparisonMetricDelta2D[];
  residualMap?: ResidualMap2D;
  warnings: SolverWarning[];
  provenance: {
    label: "measured-vs-simulated workbench";
    limitations: string[];
  };
  resultHash: string;
};

export function runMeasuredSimulatedComparison2D({
  id,
  label = "L3.4B measured-vs-simulated comparison",
  measuredImage,
  measuredPixels,
  rois,
  simulatedField,
  simulatedResult,
  testTarget
}: {
  id: string;
  label?: string;
  measuredImage: MeasuredImage2D;
  measuredPixels: MeasuredImagePixels2D;
  rois: MeasurementRoi2D[];
  simulatedField: FieldOutput2D;
  simulatedResult?: SolverResult | null;
  testTarget?: TestTarget2D;
}): ComparisonRunOutput2D {
  const simulatedFull: MeasuredImagePixels2D = {
    widthPx: measuredImage.widthPx,
    heightPx: measuredImage.heightPx,
    channels: "grayscale",
    data: resampleFieldToMeasuredPixels2D(simulatedField, measuredImage.widthPx, measuredImage.heightPx)
  };
  const roiOutputs = rois.map((roi) => compareRoi({ measuredImage, measuredPixels, simulatedPixels: simulatedFull, roi }));
  const metricDeltas = roiOutputs.flatMap((output) => output.metricDeltas);
  const warnings = uniqueWarnings([
    {
      code: "comparison2D.resampled",
      message: "Simulated detector field was explicitly resampled into measured image pixel coordinates before residual comparison."
    },
    ...(measuredImage.calibration?.pixelSizeUM && measuredImage.calibration?.pixelSizeVM
      ? []
      : [
          {
            code: "comparison2D.pixelCalibrationMissing",
            message: "Pixel calibration is incomplete; pixel metrics are diagnostic and not physical-size calibrated."
          }
        ]),
    ...roiOutputs.flatMap((output) => [
      ...output.measuredMetrics.warnings.map((message) => ({ code: "measuredMetric.warning", message, elementId: output.roiId })),
      ...output.simulatedMetrics.warnings.map((message) => ({ code: "simulatedMetric.warning", message, elementId: output.roiId }))
    ])
  ]);
  const resultHash = comparisonResultHash({
    id,
    measuredImageHash: measuredImage.imageHash,
    simulatedResultHash: simulatedResult?.resultHash ?? simulatedField.id,
    roiOutputs
  });
  return {
    id,
    type: "measuredSimulatedComparison2D",
    analysisId: "analysis.measuredCompare.l3.4b.2d",
    label,
    measuredImageHash: measuredImage.imageHash,
    simulatedResultHash: simulatedResult?.resultHash ?? simulatedField.id,
    sceneHash: simulatedResult?.sceneHash,
    roiIds: rois.map((roi) => roi.id),
    targetFrequencyCyclesPerM: testTarget ? testTargetCyclesPerM(testTarget) : null,
    roiOutputs,
    metricDeltas,
    residualMap: roiOutputs[0]?.residualMap,
    warnings,
    provenance: {
      label: "measured-vs-simulated workbench",
      limitations: [
        "Measured-vs-simulated workbench output is diagnostic only.",
        "Not certified ISO 12233, EMVA 1288, clinical, or hardware calibration.",
        "Residuals use explicit pixel-coordinate resampling and do not prove physical registration."
      ]
    },
    resultHash
  };
}

function compareRoi({
  measuredImage,
  measuredPixels,
  simulatedPixels,
  roi
}: {
  measuredImage: MeasuredImage2D;
  measuredPixels: MeasuredImagePixels2D;
  simulatedPixels: MeasuredImagePixels2D;
  roi: MeasurementRoi2D;
}): ComparisonRoiOutput2D {
  const measuredCrop = extractMeasurementRoi2D(measuredPixels, roi);
  const simulatedCrop = extractMeasurementRoi2D(simulatedPixels, roi);
  const measuredMetrics = computeMeasuredRoiMetrics2D({ image: measuredImage, pixels: measuredPixels, roi });
  const simulatedMetrics = computeRoiMetrics2D({ crop: simulatedCrop, roi });
  const residualMap = createResidualMap2D({ measured: measuredCrop, simulated: simulatedCrop, mode: "signed" });
  const crossSection = centralResidualCrossSection2D(measuredCrop, simulatedCrop);
  const metricDeltas = metricDeltasFor(roi.id, measuredMetrics, simulatedMetrics);
  return {
    roiId: roi.id,
    roiLabel: roi.label,
    roiType: roi.type,
    measuredMetrics,
    simulatedMetrics,
    measuredCrop,
    simulatedCrop,
    residualMap,
    crossSection,
    metricDeltas
  };
}

function metricDeltasFor(roiId: string, measured: MeasuredRoiMetrics2D, simulated: MeasuredRoiMetrics2D): ComparisonMetricDelta2D[] {
  const output: ComparisonMetricDelta2D[] = [];
  pushDelta(output, roiId, "contrast", measured.contrastMichelson, simulated.contrastMichelson);
  pushDelta(output, roiId, "sfr50", measured.slantedEdgeSfr?.sfr50CyclesPerPx ?? null, simulated.slantedEdgeSfr?.sfr50CyclesPerPx ?? null, "cycles/px");
  pushDelta(output, roiId, "psfFwhm", meanNullable(measured.psf?.fwhmXPx ?? null, measured.psf?.fwhmYPx ?? null), meanNullable(simulated.psf?.fwhmXPx ?? null, simulated.psf?.fwhmYPx ?? null), "px");
  pushDelta(output, roiId, "centroidX", measured.psf?.centroidXPx ?? null, simulated.psf?.centroidXPx ?? null, "px");
  pushDelta(output, roiId, "centroidY", measured.psf?.centroidYPx ?? null, simulated.psf?.centroidYPx ?? null, "px");
  pushDelta(output, roiId, "noise", measured.flatDark.noiseRms, simulated.flatDark.noiseRms);
  pushDelta(output, roiId, "background", measured.flatDark.mean, simulated.flatDark.mean);
  pushDelta(output, roiId, "flatNonuniformity", measured.flatDark.nonuniformity, simulated.flatDark.nonuniformity);
  return output;
}

function pushDelta(output: ComparisonMetricDelta2D[], roiId: string, metric: ComparisonMetricName2D, measured: number | null, simulated: number | null, unit?: string): void {
  if (measured === null || simulated === null || !Number.isFinite(measured) || !Number.isFinite(simulated)) return;
  output.push({
    roiId,
    metric,
    measured,
    simulated,
    delta: measured - simulated,
    unit
  });
}

function meanNullable(a: number | null, b: number | null): number | null {
  if (a === null && b === null) return null;
  if (a === null) return b;
  if (b === null) return a;
  return (a + b) / 2;
}

function comparisonResultHash({
  id,
  measuredImageHash,
  simulatedResultHash,
  roiOutputs
}: {
  id: string;
  measuredImageHash: string;
  simulatedResultHash: string;
  roiOutputs: ComparisonRoiOutput2D[];
}): string {
  return fnv1a64(
    stableStringify({
      type: "comparisonRunOutput2D",
      id,
      measuredImageHash,
      simulatedResultHash,
      rois: roiOutputs.map((roi) => ({
        roiId: roi.roiId,
        residualHash: roi.residualMap.resultHash,
        metricDeltas: roi.metricDeltas.map((delta) => ({
          metric: delta.metric,
          measured: quantize(delta.measured),
          simulated: quantize(delta.simulated),
          delta: quantize(delta.delta)
        }))
      }))
    })
  );
}

function quantize(value: number): number {
  return Number(value.toFixed(8));
}

function uniqueWarnings(warnings: SolverWarning[]): SolverWarning[] {
  const seen = new Set<string>();
  const output: SolverWarning[] = [];
  for (const warning of warnings) {
    const key = `${warning.code}:${warning.elementId ?? ""}:${warning.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(warning);
  }
  return output;
}
