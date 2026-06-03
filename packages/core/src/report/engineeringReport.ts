import type { CameraModel2D, EngineeringReportSettings, MeasurementSettings2D, Scene } from "../scene/schema";
import type { SolverResult } from "../solvers/Solver";
import type { CameraImageOutput2D } from "../sensor/pixelSampling2d";
import type { SamplingMetrics2D } from "../sensor/samplingMetrics";
import type { SnrMetrics2D } from "../sensor/snrMetrics";
import type { MtfMetrics2D } from "../wave/otfMtf2d";
import type { PsfMetrics2D } from "../wave/psfMetrics2d";
import type { SweepResult } from "../sweeps/sweepRunner";

export type EngineeringReport = {
  title: string;
  generatedAtIso: string;
  appVersion: string;
  scene: {
    sceneId: string;
    name: string;
    sceneHash: string;
  };
  solver: {
    solverId: string;
    solverVersion: string;
    resultHash?: string;
    cacheKey?: string;
  };
  camera?: Pick<
    CameraModel2D,
    | "id"
    | "label"
    | "pixelPitchM"
    | "widthPx"
    | "heightPx"
    | "quantumEfficiency"
    | "exposureS"
    | "fullWellElectrons"
    | "readNoiseElectronsRms"
    | "darkCurrentElectronsPerS"
    | "bitDepth"
  >;
  measurement?: MeasurementSettings2D;
  psf?: PsfMetrics2D;
  mtf?: {
    mtf50CyclesPerM: number | null;
    mtf10CyclesPerM: number | null;
    cutoffCyclesPerM: number | null;
    provenanceLabel: string;
  };
  snr?: SnrMetrics2D;
  sampling?: SamplingMetrics2D;
  sensor?: {
    widthPx: number;
    heightPx: number;
    saturationPixels: number;
    provenance: unknown;
  };
  sweep?: SweepResult;
  warnings: string[];
  performanceStats: SolverResult["performanceStats"];
  limitations: string[];
};

export function createEngineeringReport({
  scene,
  result,
  camera,
  measurement,
  sensor,
  psf,
  mtf,
  snr,
  sampling,
  sweep,
  settings = scene.reportSettings
}: {
  scene: Scene;
  result: SolverResult;
  camera?: CameraModel2D;
  measurement?: MeasurementSettings2D;
  sensor?: CameraImageOutput2D;
  psf?: PsfMetrics2D;
  mtf?: MtfMetrics2D;
  snr?: SnrMetrics2D;
  sampling?: SamplingMetrics2D;
  sweep?: SweepResult;
  settings?: EngineeringReportSettings;
}): EngineeringReport {
  const warnings = settings.includeWarnings
    ? [...(result.warnings ?? []).map((warning) => warning.message), ...(psf?.warnings ?? []), ...(snr?.warnings ?? []), ...(sampling?.warnings ?? [])]
    : [];
  return {
    title: settings.title,
    generatedAtIso: new Date().toISOString(),
    appVersion: scene.metadata.appVersion,
    scene: {
      sceneId: scene.sceneId,
      name: scene.name,
      sceneHash: result.sceneHash
    },
    solver: {
      solverId: result.solverId,
      solverVersion: result.solverVersion,
      resultHash: result.resultHash,
      cacheKey: result.cacheKey
    },
    camera: camera && {
      id: camera.id,
      label: camera.label,
      pixelPitchM: camera.pixelPitchM,
      widthPx: camera.widthPx,
      heightPx: camera.heightPx,
      quantumEfficiency: camera.quantumEfficiency,
      exposureS: camera.exposureS,
      fullWellElectrons: camera.fullWellElectrons,
      readNoiseElectronsRms: camera.readNoiseElectronsRms,
      darkCurrentElectronsPerS: camera.darkCurrentElectronsPerS,
      bitDepth: camera.bitDepth
    },
    measurement,
    psf,
    mtf: mtf && {
      mtf50CyclesPerM: mtf.mtf50CyclesPerM,
      mtf10CyclesPerM: mtf.mtf10CyclesPerM,
      cutoffCyclesPerM: mtf.cutoffCyclesPerM,
      provenanceLabel: mtf.provenanceLabel
    },
    snr,
    sampling,
    sensor: sensor && {
      widthPx: sensor.widthPx,
      heightPx: sensor.heightPx,
      saturationPixels: countSaturated(sensor.saturationMask),
      provenance: sensor.provenance
    },
    sweep,
    warnings,
    performanceStats: result.performanceStats,
    limitations: settings.includeLimitations ? l32Limitations() : []
  };
}

export function engineeringReportToJson(report: EngineeringReport): string {
  return JSON.stringify(report, null, 2);
}

export function engineeringReportToMarkdown(report: EngineeringReport): string {
  return [
    `# ${report.title}`,
    "",
    `Generated: ${report.generatedAtIso}`,
    `Scene: ${report.scene.name} (${report.scene.sceneHash})`,
    `Solver: ${report.solver.solverId} ${report.solver.solverVersion}`,
    report.solver.resultHash ? `Result hash: ${report.solver.resultHash}` : "",
    "",
    "## Camera",
    report.camera
      ? `- ${report.camera.label}: ${report.camera.widthPx} x ${report.camera.heightPx}, pixel ${formatMetric(report.camera.pixelPitchM, "m")}, QE ${report.camera.quantumEfficiency}, exposure ${report.camera.exposureS}s`
      : "- No camera model",
    "",
    "## MTF",
    report.mtf
      ? `- MTF50: ${formatNullable(report.mtf.mtf50CyclesPerM)} cycles/m\n- MTF10: ${formatNullable(report.mtf.mtf10CyclesPerM)} cycles/m\n- ${report.mtf.provenanceLabel}`
      : "- No MTF metrics",
    "",
    "## SNR",
    report.snr
      ? `- Mean SNR: ${report.snr.meanSnr.toFixed(2)}\n- Peak SNR: ${report.snr.peakSnr.toFixed(2)}\n- Saturation: ${(report.snr.saturationFraction * 100).toFixed(3)}%`
      : "- No SNR metrics",
    "",
    "## Sampling",
    report.sampling
      ? `- Nyquist: ${report.sampling.nyquistCyclesPerM.toExponential(3)} cycles/m\n- Target contrast: ${report.sampling.contrastAtTarget === null ? "n/a" : report.sampling.contrastAtTarget.toFixed(3)}`
      : "- No sampling metrics",
    "",
    "## Warnings",
    ...(report.warnings.length > 0 ? report.warnings.map((warning) => `- ${warning}`) : ["- None"]),
    "",
    "## Limitations",
    ...report.limitations.map((limitation) => `- ${limitation}`)
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function engineeringReportToHtml(report: EngineeringReport): string {
  const markdown = engineeringReportToMarkdown(report);
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(report.title)}</title></head><body>${markdown
    .split("\n")
    .map((line) => markdownLineToHtml(line))
    .join("\n")}</body></html>`;
}

export function l32Limitations(): string[] {
  return [
    "Camera photon calibration is relative unless an external photon rate is supplied.",
    "QE is scalar, not wavelength-dependent.",
    "No rolling shutter, color filter array, EMCCD, or sCMOS column model.",
    "MTF is derived from coherent scalar L3 PSF/OTF, not a full incoherent microscope MTF.",
    "Sweeps reuse the current L3 field for post-processing parameters in v0."
  ];
}

function countSaturated(mask: Uint8Array): number {
  let count = 0;
  for (const value of mask) count += value;
  return count;
}

function formatNullable(value: number | null): string {
  return value === null ? "n/a" : value.toExponential(3);
}

function formatMetric(value: number, unit: string): string {
  return `${value.toExponential(3)} ${unit}`;
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
