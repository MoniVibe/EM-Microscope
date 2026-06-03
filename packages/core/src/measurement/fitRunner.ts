import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { FitParameter2D } from "../scene/schema";
import type { SolverWarning } from "../solvers/Solver";
import { computeRoiMetrics2D } from "./measuredMetrics2d";
import type { ComparisonRoiOutput2D, ComparisonRunOutput2D } from "./modelComparison2d";
import { createResidualMap2D } from "./residualMaps2d";
import type { ExtractedRoiPixels2D } from "./roi2d";
import { fitParameterValues2D } from "./fitParameters";

export type FitParameters2D = Partial<Record<FitParameter2D["kind"], number>>;

export type FitEvaluation2D = {
  parameters: FitParameters2D;
  score: number;
  residualRms: number;
};

export type FitRunOutput2D = {
  id: string;
  type: "measuredFit2D";
  comparisonRunId: string;
  optimizer: "gridSearch" | "deterministicCoordinateSearch";
  evaluatedCount: number;
  bestParameters: FitParameters2D;
  score: number;
  residualRms: number;
  confidenceLabel: "diagnostic-only" | "weak" | "moderate";
  warnings: SolverWarning[];
  evaluations: FitEvaluation2D[];
  resultHash: string;
  provenance: {
    label: "deterministic measured-vs-model grid search";
    limitations: string[];
  };
};

export function runDeterministicFit2D({
  id,
  comparison,
  roiOutput = comparison.roiOutputs[0],
  fitParameters,
  optimizer = "gridSearch"
}: {
  id: string;
  comparison: ComparisonRunOutput2D;
  roiOutput?: ComparisonRoiOutput2D;
  fitParameters: FitParameter2D[];
  optimizer?: "gridSearch" | "deterministicCoordinateSearch";
}): FitRunOutput2D {
  if (!roiOutput) {
    throw new Error("fit requires at least one comparison ROI output");
  }
  if (fitParameters.length === 0) {
    throw new Error("fit requires at least one fit parameter");
  }

  const evaluations: FitEvaluation2D[] = [];
  let best: FitEvaluation2D | null = null;
  for (const parameters of enumerateParameterGrid(fitParameters)) {
    const transformed = transformSimulatedPixels2D(roiOutput.simulatedCrop, parameters);
    const residual = createResidualMap2D({ measured: roiOutput.measuredCrop, simulated: transformed, mode: "signed" });
    const metricScore = metricError(roiOutput.measuredCrop, transformed, roiOutput.roiType);
    const score = residual.rms + metricScore * 0.25;
    const evaluation: FitEvaluation2D = {
      parameters,
      score,
      residualRms: residual.rms
    };
    evaluations.push(evaluation);
    if (!best || evaluation.score < best.score || (evaluation.score === best.score && stableStringify(evaluation.parameters) < stableStringify(best.parameters))) {
      best = evaluation;
    }
  }

  const selected = best ?? { parameters: {}, score: Number.POSITIVE_INFINITY, residualRms: Number.POSITIVE_INFINITY };
  const warnings = uniqueWarnings([
    ...comparison.warnings,
    {
      code: "fit2D.diagnosticOnly",
      message: "Fit parameters are diagnostic workbench estimates, not objective certification or hardware calibration."
    },
    ...(selected.score > 0.25
      ? [
          {
            code: "fit2D.highResidual",
            message: "Best fit residual remains high; model mismatch, ROI choice, focus, exposure, or calibration may dominate."
          }
        ]
      : [])
  ]);
  const resultHash = fitResultHash({
    id,
    comparisonRunId: comparison.id,
    fitParameters,
    best: selected,
    evaluatedCount: evaluations.length
  });
  return {
    id,
    type: "measuredFit2D",
    comparisonRunId: comparison.id,
    optimizer,
    evaluatedCount: evaluations.length,
    bestParameters: selected.parameters,
    score: selected.score,
    residualRms: selected.residualRms,
    confidenceLabel: confidenceForScore(selected.score),
    warnings,
    evaluations,
    resultHash,
    provenance: {
      label: "deterministic measured-vs-model grid search",
      limitations: [
        "Grid-search fit is deterministic and diagnostic-only.",
        "Not certified ISO 12233, EMVA 1288, clinical, or hardware calibration.",
        "Effective NA, source NA, defocus, blur, scale, and background are compact surrogate parameters."
      ]
    }
  };
}

export function transformSimulatedPixels2D(crop: ExtractedRoiPixels2D, parameters: FitParameters2D): ExtractedRoiPixels2D {
  const sigma = effectiveBlurSigmaPx(parameters);
  const blurred = sigma > 0 ? gaussianBlur(crop, sigma) : new Float32Array(crop.data);
  const scale = parameters.intensityScale ?? 1;
  const background = parameters.backgroundOffset ?? 0;
  const output = new Float32Array(blurred.length);
  for (let index = 0; index < output.length; index += 1) {
    output[index] = Math.max(0, Math.min(1, (blurred[index] ?? 0) * scale + background));
  }
  return {
    widthPx: crop.widthPx,
    heightPx: crop.heightPx,
    data: output
  };
}

export function makeFitRunCacheKey2D(comparison: ComparisonRunOutput2D, fitParameters: FitParameter2D[]): string {
  return fnv1a64(
    stableStringify({
      type: "fitRunCacheKey2D",
      comparisonHash: comparison.resultHash,
      fitParameters
    })
  );
}

function enumerateParameterGrid(parameters: FitParameter2D[]): FitParameters2D[] {
  const grids = parameters.map((parameter) => ({ parameter, values: fitParameterValues2D(parameter) }));
  const output: FitParameters2D[] = [];

  function visit(index: number, current: FitParameters2D): void {
    if (index >= grids.length) {
      output.push({ ...current });
      return;
    }
    const grid = grids[index];
    if (!grid) return;
    for (const value of grid.values) {
      visit(index + 1, {
        ...current,
        [grid.parameter.kind]: value
      });
    }
  }

  visit(0, {});
  return output;
}

function metricError(measured: ExtractedRoiPixels2D, simulated: ExtractedRoiPixels2D, roiType: ComparisonRoiOutput2D["roiType"]): number {
  const roi = { id: "fit-roi", label: "Fit ROI", type: roiType, rotationRad: 0 };
  const measuredMetrics = computeRoiMetrics2D({ crop: measured, roi });
  const simulatedMetrics = computeRoiMetrics2D({ crop: simulated, roi });
  const values: number[] = [];
  addRelative(values, measuredMetrics.contrastMichelson, simulatedMetrics.contrastMichelson);
  addRelative(values, measuredMetrics.slantedEdgeSfr?.sfr50CyclesPerPx ?? null, simulatedMetrics.slantedEdgeSfr?.sfr50CyclesPerPx ?? null);
  addRelative(values, measuredMetrics.psf?.fwhmXPx ?? null, simulatedMetrics.psf?.fwhmXPx ?? null);
  addRelative(values, measuredMetrics.flatDark.mean, simulatedMetrics.flatDark.mean);
  if (values.length === 0) return 0;
  return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length);
}

function addRelative(output: number[], measured: number | null, simulated: number | null): void {
  if (measured === null || simulated === null || !Number.isFinite(measured) || !Number.isFinite(simulated)) return;
  const denominator = Math.max(1e-6, Math.abs(measured));
  output.push((measured - simulated) / denominator);
}

function effectiveBlurSigmaPx(parameters: FitParameters2D): number {
  const gaussian = parameters.gaussianBlurSigmaPx ?? 0;
  const effectiveNaBlur = parameters.effectiveNA ? Math.max(0, 0.04 / Math.max(1e-6, parameters.effectiveNA) - 0.4) : 0;
  const sourceNaBlur = parameters.sourceNA ? parameters.sourceNA * 3 : 0;
  const defocusBlur = parameters.defocusM ? Math.abs(parameters.defocusM) * 4e5 : 0;
  return Math.max(0, gaussian + effectiveNaBlur + sourceNaBlur + defocusBlur);
}

function gaussianBlur(crop: ExtractedRoiPixels2D, sigmaPx: number): Float32Array {
  const radius = Math.max(1, Math.ceil(sigmaPx * 3));
  const kernel = gaussianKernel(sigmaPx, radius);
  const horizontal = new Float32Array(crop.data.length);
  const output = new Float32Array(crop.data.length);
  for (let y = 0; y < crop.heightPx; y += 1) {
    for (let x = 0; x < crop.widthPx; x += 1) {
      let sum = 0;
      for (let k = -radius; k <= radius; k += 1) {
        const sx = Math.max(0, Math.min(crop.widthPx - 1, x + k));
        sum += (crop.data[y * crop.widthPx + sx] ?? 0) * (kernel[k + radius] ?? 0);
      }
      horizontal[y * crop.widthPx + x] = sum;
    }
  }
  for (let y = 0; y < crop.heightPx; y += 1) {
    for (let x = 0; x < crop.widthPx; x += 1) {
      let sum = 0;
      for (let k = -radius; k <= radius; k += 1) {
        const sy = Math.max(0, Math.min(crop.heightPx - 1, y + k));
        sum += (horizontal[sy * crop.widthPx + x] ?? 0) * (kernel[k + radius] ?? 0);
      }
      output[y * crop.widthPx + x] = sum;
    }
  }
  return output;
}

function gaussianKernel(sigmaPx: number, radius: number): Float64Array {
  const kernel = new Float64Array(radius * 2 + 1);
  const sigma = Math.max(1e-6, sigmaPx);
  let sum = 0;
  for (let index = -radius; index <= radius; index += 1) {
    const value = Math.exp(-(index * index) / (2 * sigma * sigma));
    kernel[index + radius] = value;
    sum += value;
  }
  for (let index = 0; index < kernel.length; index += 1) kernel[index] = (kernel[index] ?? 0) / sum;
  return kernel;
}

function confidenceForScore(score: number): FitRunOutput2D["confidenceLabel"] {
  if (score < 0.08) return "moderate";
  if (score < 0.18) return "weak";
  return "diagnostic-only";
}

function fitResultHash({
  id,
  comparisonRunId,
  fitParameters,
  best,
  evaluatedCount
}: {
  id: string;
  comparisonRunId: string;
  fitParameters: FitParameter2D[];
  best: FitEvaluation2D;
  evaluatedCount: number;
}): string {
  return fnv1a64(
    stableStringify({
      type: "fitRunOutput2D",
      id,
      comparisonRunId,
      fitParameters,
      evaluatedCount,
      best: {
        parameters: best.parameters,
        score: Number(best.score.toFixed(10)),
        residualRms: Number(best.residualRms.toFixed(10))
      }
    })
  );
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
