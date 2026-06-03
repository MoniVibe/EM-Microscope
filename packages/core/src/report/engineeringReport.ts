import { testTargetCyclesPerM, testTargetFeaturePeriodM } from "../wave/testTargets2d";
import type { CameraModel2D, EngineeringReportSettings, MeasurementSettings2D, Scene, TestTarget2D } from "../scene/schema";
import type { PartialCoherenceOutput, SolverResult, SourceAngleSetOutput } from "../solvers/Solver";
import type { CameraImageOutput2D } from "../sensor/pixelSampling2d";
import type { SamplingMetrics2D } from "../sensor/samplingMetrics";
import type { SnrMetrics2D } from "../sensor/snrMetrics";
import type { MtfMetrics2D } from "../wave/otfMtf2d";
import type { PsfMetrics2D } from "../wave/psfMetrics2d";
import type { SweepResult } from "../sweeps/sweepRunner";
import type { ResolutionTargetMetrics2D } from "../metrics/resolutionTargetMetrics";

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
  illumination?: {
    sourceAngleSet?: Pick<SourceAngleSetOutput, "id" | "label" | "illuminationModelId" | "weightSum"> & { angleCount: number };
    partialCoherence?: PartialCoherenceOutput;
  };
  testTarget?: {
    id: string;
    label: string;
    kind: TestTarget2D["kind"];
    featurePeriodM: number | null;
    cyclesPerM: number | null;
  };
  resolutionTarget?: ResolutionTargetMetrics2D;
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
  testTarget,
  resolutionTarget,
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
  testTarget?: TestTarget2D;
  resolutionTarget?: ResolutionTargetMetrics2D;
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
    illumination:
      result.sourceAngleSetOutput || result.partialCoherenceOutput
        ? {
            sourceAngleSet: result.sourceAngleSetOutput && {
              id: result.sourceAngleSetOutput.id,
              label: result.sourceAngleSetOutput.label,
              illuminationModelId: result.sourceAngleSetOutput.illuminationModelId,
              angleCount: result.sourceAngleSetOutput.samples.length,
              weightSum: result.sourceAngleSetOutput.weightSum
            },
            partialCoherence: result.partialCoherenceOutput
          }
        : undefined,
    testTarget: testTarget && {
      id: testTarget.id,
      label: testTarget.label,
      kind: testTarget.kind,
      featurePeriodM: testTargetFeaturePeriodM(testTarget),
      cyclesPerM: testTargetCyclesPerM(testTarget)
    },
    resolutionTarget,
    sweep,
    warnings,
    performanceStats: result.performanceStats,
    limitations: settings.includeLimitations ? limitationsForSolver(result.solverId) : []
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
    "## Illumination",
    report.illumination?.sourceAngleSet
      ? `- ${report.illumination.sourceAngleSet.label}: ${report.illumination.sourceAngleSet.angleCount} source angles, weight sum ${report.illumination.sourceAngleSet.weightSum.toFixed(6)}`
      : "- No partial-coherence source-angle set",
    report.illumination?.partialCoherence ? `- ${report.illumination.partialCoherence.provenanceLabel}` : "",
    "",
    "## Target",
    report.testTarget
      ? `- ${report.testTarget.label}: ${report.testTarget.kind}, feature ${report.testTarget.featurePeriodM === null ? "n/a" : formatMetric(report.testTarget.featurePeriodM, "m")}`
      : "- No L3.3 test target",
    report.resolutionTarget
      ? `- Contrast: ${report.resolutionTarget.contrastMichelson === null ? "n/a" : report.resolutionTarget.contrastMichelson.toFixed(3)}\n- SFR50: ${formatNullable(report.resolutionTarget.sfr50CyclesPerM)} cycles/m\n- ${report.resolutionTarget.provenanceLabel}`
      : "",
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

export function l33Limitations(): string[] {
  return [
    "Partial coherence is approximated by deterministic source-angle intensity averaging.",
    "The model is scalar and monochromatic; it does not include vector polarization, fluorescence, scattering, or sensor color response.",
    "Targets are analytic 2D masks on the workbench grid, not calibrated physical microscope slides.",
    "SFR and target contrast metrics are workbench estimates, not certified ISO 12233 or microscope-metrology measurements.",
    "Sweeps reuse the current detector field for post-processing parameters unless the scene is recomputed."
  ];
}

function limitationsForSolver(solverId: string): string[] {
  return solverId === "scalar.partialCoherent.l3.3.2d" ? l33Limitations() : l32Limitations();
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
