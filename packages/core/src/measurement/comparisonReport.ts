import type { ComparisonReportSettings, MeasurementRoi2D, Scene } from "../scene/schema";
import type { ComparisonRunOutput2D } from "./modelComparison2d";
import type { FitRunOutput2D } from "./fitRunner";

export type ComparisonReport2D = {
  title: string;
  generatedAtIso: string;
  appVersion: string;
  scene: {
    sceneId: string;
    name: string;
    sceneHash?: string;
  };
  analysis: {
    analysisId: ComparisonRunOutput2D["analysisId"];
    comparisonRunId: string;
    comparisonResultHash: string;
    measuredImageHash: string;
    simulatedResultHash: string;
    fitResultHash?: string;
  };
  calibration: unknown;
  rois: MeasurementRoi2D[];
  metricDeltas: Array<{
    roiId: string;
    metric: string;
    measured: number;
    simulated: number;
    delta: number;
    unit?: string;
  }>;
  residualSummary?: {
    width: number;
    height: number;
    mode: string;
    min: number;
    max: number;
    meanAbs: number;
    rms: number;
    resultHash: string;
  };
  fit?: {
    optimizer: FitRunOutput2D["optimizer"];
    evaluatedCount: number;
    bestParameters: FitRunOutput2D["bestParameters"];
    score: number;
    residualRms: number;
    confidenceLabel: FitRunOutput2D["confidenceLabel"];
    resultHash: string;
  };
  warnings: string[];
  provenance: {
    comparison: ComparisonRunOutput2D["provenance"];
    fit?: FitRunOutput2D["provenance"];
  };
  limitations: string[];
};

export function createComparisonReport2D({
  scene,
  comparison,
  fit,
  settings = scene.comparisonReportSettings
}: {
  scene: Scene;
  comparison: ComparisonRunOutput2D;
  fit?: FitRunOutput2D | null;
  settings?: ComparisonReportSettings;
}): ComparisonReport2D {
  const measuredImage = scene.measuredImages2D.find((image) => image.imageHash === comparison.measuredImageHash) ?? scene.measuredImages2D[0];
  const roiSet = new Set(comparison.roiIds);
  const warnings = settings.includeWarnings
    ? [...comparison.warnings.map((warning) => warning.message), ...(fit?.warnings ?? []).map((warning) => warning.message)]
    : [];
  const limitations = settings.includeLimitations
    ? uniqueStrings([
        ...comparison.provenance.limitations,
        ...(fit?.provenance.limitations ?? []),
        "This report is not certified ISO 12233, EMVA 1288, clinical, or hardware calibration."
      ])
    : [];
  return {
    title: settings.title,
    generatedAtIso: new Date().toISOString(),
    appVersion: scene.metadata.appVersion,
    scene: {
      sceneId: scene.sceneId,
      name: scene.name,
      sceneHash: comparison.sceneHash
    },
    analysis: {
      analysisId: comparison.analysisId,
      comparisonRunId: comparison.id,
      comparisonResultHash: comparison.resultHash,
      measuredImageHash: comparison.measuredImageHash,
      simulatedResultHash: comparison.simulatedResultHash,
      fitResultHash: fit?.resultHash
    },
    calibration: measuredImage?.calibration ?? null,
    rois: scene.measurementRois2D.filter((roi) => roiSet.has(roi.id)),
    metricDeltas: comparison.metricDeltas.map((delta) => ({
      roiId: delta.roiId,
      metric: delta.metric,
      measured: delta.measured,
      simulated: delta.simulated,
      delta: delta.delta,
      unit: delta.unit
    })),
    residualSummary: comparison.residualMap && {
      width: comparison.residualMap.width,
      height: comparison.residualMap.height,
      mode: comparison.residualMap.mode,
      min: comparison.residualMap.min,
      max: comparison.residualMap.max,
      meanAbs: comparison.residualMap.meanAbs,
      rms: comparison.residualMap.rms,
      resultHash: comparison.residualMap.resultHash
    },
    fit: fit
      ? {
          optimizer: fit.optimizer,
          evaluatedCount: fit.evaluatedCount,
          bestParameters: fit.bestParameters,
          score: fit.score,
          residualRms: fit.residualRms,
          confidenceLabel: fit.confidenceLabel,
          resultHash: fit.resultHash
        }
      : undefined,
    warnings: uniqueStrings(warnings),
    provenance: {
      comparison: comparison.provenance,
      fit: fit?.provenance
    },
    limitations
  };
}

export function comparisonReportToJson(report: ComparisonReport2D): string {
  return JSON.stringify(report, null, 2);
}

export function comparisonReportToMarkdown(report: ComparisonReport2D): string {
  return [
    `# ${report.title}`,
    "",
    `Generated: ${report.generatedAtIso}`,
    `App version: ${report.appVersion}`,
    `Scene: ${report.scene.name} (${report.scene.sceneHash ?? "n/a"})`,
    `Analysis: ${report.analysis.analysisId}`,
    `Measured image hash: ${report.analysis.measuredImageHash}`,
    `Simulated result hash: ${report.analysis.simulatedResultHash}`,
    `Comparison result hash: ${report.analysis.comparisonResultHash}`,
    report.analysis.fitResultHash ? `Fit result hash: ${report.analysis.fitResultHash}` : "",
    "",
    "## Calibration",
    `- ${JSON.stringify(report.calibration ?? null)}`,
    "",
    "## ROI Definitions",
    ...(report.rois.length > 0
      ? report.rois.map((roi) => `- ${roi.label}: ${roi.type}, x=${roi.xPx}, y=${roi.yPx}, w=${roi.widthPx}, h=${roi.heightPx}, rotate=${roi.rotationRad ?? 0} rad`)
      : ["- No ROIs"]),
    "",
    "## Measured vs Simulated Metrics",
    ...(report.metricDeltas.length > 0
      ? report.metricDeltas.map(
          (delta) =>
            `- ${delta.roiId} ${delta.metric}: measured ${formatNumber(delta.measured)}${unitSuffix(delta.unit)}, simulated ${formatNumber(delta.simulated)}${unitSuffix(delta.unit)}, delta ${formatNumber(delta.delta)}${unitSuffix(delta.unit)}`
        )
      : ["- No comparable metric deltas"]),
    "",
    "## Residual Summary",
    report.residualSummary
      ? `- ${report.residualSummary.width} x ${report.residualSummary.height}, ${report.residualSummary.mode}, RMS ${formatNumber(report.residualSummary.rms)}, mean abs ${formatNumber(report.residualSummary.meanAbs)}, hash ${report.residualSummary.resultHash}`
      : "- No residual map",
    "",
    "## Fit",
    report.fit
      ? `- ${report.fit.optimizer}, evaluated ${report.fit.evaluatedCount}, score ${formatNumber(report.fit.score)}, residual RMS ${formatNumber(report.fit.residualRms)}, confidence ${report.fit.confidenceLabel}\n- Best parameters: ${JSON.stringify(report.fit.bestParameters)}`
      : "- No fit run",
    "",
    "## Warnings",
    ...(report.warnings.length > 0 ? report.warnings.map((warning) => `- ${warning}`) : ["- None"]),
    "",
    "## Provenance",
    `- ${report.provenance.comparison.label}`,
    report.provenance.fit ? `- ${report.provenance.fit.label}` : "",
    "",
    "## Limitations",
    ...report.limitations.map((limitation) => `- ${limitation}`)
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function comparisonReportToHtml(report: ComparisonReport2D): string {
  const markdown = comparisonReportToMarkdown(report);
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(report.title)}</title></head><body>${markdown
    .split("\n")
    .map((line) => markdownLineToHtml(line))
    .join("\n")}</body></html>`;
}

export function comparisonMetricsToCsv2D(comparison: ComparisonRunOutput2D): string {
  return [
    "roiId,metric,measured,simulated,delta,unit",
    ...comparison.metricDeltas.map((delta) => [delta.roiId, delta.metric, delta.measured, delta.simulated, delta.delta, delta.unit ?? ""].join(","))
  ].join("\n");
}

export function fitEvaluationsToCsv2D(fit: FitRunOutput2D): string {
  const parameterKeys = Array.from(new Set(fit.evaluations.flatMap((evaluation) => Object.keys(evaluation.parameters)))).sort();
  return [
    [...parameterKeys, "score", "residualRms"].join(","),
    ...fit.evaluations.map((evaluation) => [...parameterKeys.map((key) => evaluation.parameters[key as keyof typeof evaluation.parameters] ?? ""), evaluation.score, evaluation.residualRms].join(","))
  ].join("\n");
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function unitSuffix(unit?: string): string {
  return unit ? ` ${unit}` : "";
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "n/a";
  return Math.abs(value) >= 1e-3 && Math.abs(value) < 1e4 ? value.toFixed(5) : value.toExponential(4);
}

function markdownLineToHtml(line: string): string {
  if (line.startsWith("# ")) return `<h1>${escapeHtml(line.slice(2))}</h1>`;
  if (line.startsWith("## ")) return `<h2>${escapeHtml(line.slice(3))}</h2>`;
  if (line.startsWith("- ")) return `<li>${escapeHtml(line.slice(2))}</li>`;
  if (line.trim() === "") return "";
  return `<p>${escapeHtml(line)}</p>`;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
