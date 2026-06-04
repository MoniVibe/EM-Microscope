import { mulberry32 } from "../math/rng";
import { cameraDynamicRange, cameraWithDefaults } from "../sensor/cameraModel";
import { gaussianFromRandom } from "../sensor/noiseModel";
import type { CameraModel2D } from "../scene/schema";
import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { FieldOutput2D, SolverWarning } from "../solvers/Solver";
import type { L67MeasuredDataset } from "./measuredWorkbench";
import type { StudyProfilePoint } from "./studyWorkspace";

export type L68CameraNoiseMode = "noiseless" | "shot-only" | "shot-read" | "shot-read-dark";

export type L68CameraSettings = {
  id: string;
  label: string;
  pixelPitchM: number;
  widthPx: number;
  heightPx: number;
  quantumEfficiency: number;
  exposureS: number;
  photonFluxScale: number;
  fullWellElectrons: number;
  readNoiseElectronsRms: number;
  darkCurrentElectronsPerS: number;
  bitDepth: 8 | 10 | 12 | 14 | 16;
  gainDnPerElectron: number;
  blackLevelDn: number;
  seed: number;
  noiseMode: L68CameraNoiseMode;
};

export type L68CameraMetric = {
  id: string;
  label: string;
  value: number;
  unit?: string;
};

export type L68CameraHistogramBin = {
  minDn: number;
  maxDn: number;
  count: number;
};

export type L68CameraProfilePoint = {
  xM: number;
  opticalIntensity: number;
  photons: number;
  electrons: number;
  digitalNumber: number;
  snr: number;
  saturated: boolean;
};

export type L68CameraRunResult = {
  schema: "emmicro.cameraSensorLiteRun.v1";
  appVersion: "L6.8";
  id: string;
  label: string;
  source: {
    id: string;
    label: string;
    resultHash: string;
    kind: string;
  };
  settings: L68CameraSettings;
  widthPx: number;
  heightPx: number;
  maps: {
    opticalIntensity: number[];
    photons: number[];
    signalElectrons: number[];
    noisyElectrons: number[];
    digitalNumbers: number[];
    saturationMask: number[];
    snr: number[];
  };
  histogram: L68CameraHistogramBin[];
  profile: L68CameraProfilePoint[];
  metrics: L68CameraMetric[];
  warnings: SolverWarning[];
  limitations: string[];
  resultHash: string;
};

export type L68CameraReportBundle = {
  schema: "emmicro.cameraSensorLiteBundle.v1";
  appVersion: "L6.8 Camera/Sensor-Lite Acquisition Workbench";
  manifest: {
    cameraRunHash: string;
    sourceResultHash: string;
    warningCount: number;
    capabilityBoundary: string;
  };
  cameraRun: L68CameraRunResult;
  cameraReportJson: string;
  cameraReportMarkdown: string;
  cameraMetricsCsv: string;
  cameraProfileCsv: string;
  cameraHistogramCsv: string;
  warningsJson: SolverWarning[];
};

export type L68CameraOpticalInput = {
  id: string;
  label: string;
  resultHash: string;
  kind: string;
  width: number;
  height: number;
  uMinM: number;
  uMaxM: number;
  vMinM: number;
  vMaxM: number;
  intensity: ArrayLike<number>;
};

export function defaultL68CameraSettings(input: Partial<L68CameraSettings> = {}): L68CameraSettings {
  const camera = cameraWithDefaults({
    id: input.id,
    label: input.label,
    pixelPitchM: input.pixelPitchM,
    widthPx: input.widthPx,
    heightPx: input.heightPx,
    quantumEfficiency: input.quantumEfficiency,
    exposureS: input.exposureS,
    fullWellElectrons: input.fullWellElectrons,
    readNoiseElectronsRms: input.readNoiseElectronsRms,
    darkCurrentElectronsPerS: input.darkCurrentElectronsPerS,
    bitDepth: input.bitDepth,
    gainDnPerElectron: input.gainDnPerElectron,
    blackLevelDn: input.blackLevelDn,
    peakPhotonRatePerS: input.photonFluxScale,
    seed: input.seed
  });
  return {
    id: camera.id,
    label: input.label ?? "L6.8 Camera/Sensor-Lite",
    pixelPitchM: camera.pixelPitchM,
    widthPx: camera.widthPx,
    heightPx: camera.heightPx,
    quantumEfficiency: clamp(camera.quantumEfficiency, 0, 1),
    exposureS: Math.max(0, camera.exposureS),
    photonFluxScale: Math.max(0, input.photonFluxScale ?? camera.peakPhotonRatePerS),
    fullWellElectrons: Math.max(1, camera.fullWellElectrons),
    readNoiseElectronsRms: Math.max(0, camera.readNoiseElectronsRms),
    darkCurrentElectronsPerS: Math.max(0, camera.darkCurrentElectronsPerS),
    bitDepth: normalizeBitDepth(camera.bitDepth),
    gainDnPerElectron: Math.max(0, camera.gainDnPerElectron),
    blackLevelDn: Math.max(0, camera.blackLevelDn),
    seed: Math.round(camera.seed),
    noiseMode: input.noiseMode ?? "shot-read-dark"
  };
}

export function cameraSettingsToCameraModel2D(settings: L68CameraSettings): CameraModel2D {
  return cameraWithDefaults({
    id: settings.id,
    label: settings.label,
    pixelPitchM: settings.pixelPitchM,
    widthPx: settings.widthPx,
    heightPx: settings.heightPx,
    quantumEfficiency: settings.quantumEfficiency,
    exposureS: settings.exposureS,
    fullWellElectrons: settings.fullWellElectrons,
    readNoiseElectronsRms: settings.readNoiseElectronsRms,
    darkCurrentElectronsPerS: settings.darkCurrentElectronsPerS,
    bitDepth: settings.bitDepth,
    gainDnPerElectron: settings.gainDnPerElectron,
    blackLevelDn: settings.blackLevelDn,
    peakPhotonRatePerS: settings.photonFluxScale,
    seed: settings.seed
  });
}

export function opticalInputFromField(field: FieldOutput2D, resultHash: string, kind = "validation.field2d"): L68CameraOpticalInput {
  return {
    id: field.id,
    label: field.id,
    resultHash,
    kind,
    width: field.width,
    height: field.height,
    uMinM: field.uMinM,
    uMaxM: field.uMaxM,
    vMinM: field.vMinM,
    vMaxM: field.vMaxM,
    intensity: field.intensity
  };
}

export function opticalInputFromProfile(profile: StudyProfilePoint[], input: { id: string; label: string; resultHash: string; kind: string; heightPx?: number } = { id: "profile", label: "Profile", resultHash: "profile", kind: "profile" }): L68CameraOpticalInput {
  if (profile.length < 2) throw new Error("camera profile input requires at least two samples");
  const sorted = [...profile].sort((a, b) => a.xM - b.xM);
  const width = sorted.length;
  const height = Math.max(1, Math.round(input.heightPx ?? 24));
  const data = new Float64Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) data[y * width + x] = sorted[x]?.intensity ?? 0;
  }
  return {
    id: input.id,
    label: input.label,
    resultHash: input.resultHash,
    kind: input.kind,
    width,
    height,
    uMinM: sorted[0]!.xM,
    uMaxM: sorted[sorted.length - 1]!.xM,
    vMinM: -(height / 2),
    vMaxM: height / 2,
    intensity: data
  };
}

export function runCameraSensorLite(input: {
  id?: string;
  label?: string;
  optical: L68CameraOpticalInput;
  settings?: Partial<L68CameraSettings>;
}): L68CameraRunResult {
  const settings = defaultL68CameraSettings(input.settings);
  const maxDn = 2 ** settings.bitDepth - 1;
  const width = settings.widthPx;
  const height = settings.heightPx;
  const pixelCount = width * height;
  const peakIntensity = maxValue(input.optical.intensity);
  const opticalIntensity = new Array<number>(pixelCount);
  const photons = new Array<number>(pixelCount);
  const signalElectrons = new Array<number>(pixelCount);
  const noisyElectrons = new Array<number>(pixelCount);
  const digitalNumbers = new Array<number>(pixelCount);
  const saturationMask = new Array<number>(pixelCount);
  const snr = new Array<number>(pixelCount);
  const uSpan = width * settings.pixelPitchM;
  const vSpan = height * settings.pixelPitchM;
  const uMinM = -uSpan / 2;
  const vMinM = -vSpan / 2;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const uM = uMinM + (x + 0.5) * settings.pixelPitchM;
      const vM = vMinM + (y + 0.5) * settings.pixelPitchM;
      const intensity = peakIntensity > 0 ? sampleOptical(input.optical, uM, vM) / peakIntensity : 0;
      const photonCount = intensity * settings.photonFluxScale * settings.exposureS;
      const expectedSignal = photonCount * settings.quantumEfficiency;
      const darkExpected = usesDark(settings.noiseMode) ? settings.darkCurrentElectronsPerS * settings.exposureS : 0;
      const rng = mulberry32((settings.seed + Math.imul(index + 1, 0x9e3779b9)) >>> 0);
      const shotSignal = usesShot(settings.noiseMode) ? poissonSample(expectedSignal, rng) : expectedSignal;
      const shotDark = usesDark(settings.noiseMode) ? poissonSample(darkExpected, rng) : darkExpected;
      const read = usesRead(settings.noiseMode) ? gaussianFromRandom(rng) * settings.readNoiseElectronsRms : 0;
      const total = Math.max(0, Math.min(settings.fullWellElectrons, shotSignal + shotDark + read));
      const dn = Math.max(0, Math.min(maxDn, Math.round(settings.blackLevelDn + total * settings.gainDnPerElectron)));
      opticalIntensity[index] = intensity;
      photons[index] = photonCount;
      signalElectrons[index] = expectedSignal;
      noisyElectrons[index] = total;
      digitalNumbers[index] = dn;
      saturationMask[index] = total >= settings.fullWellElectrons || dn >= maxDn ? 1 : 0;
      snr[index] = snrEstimate(expectedSignal, darkExpected, settings.readNoiseElectronsRms);
    }
  }
  const histogram = histogramDn(digitalNumbers, settings.bitDepth);
  const profile = centerlineProfile({
    width,
    height,
    pixelPitchM: settings.pixelPitchM,
    opticalIntensity,
    photons,
    signalElectrons,
    noisyElectrons,
    digitalNumbers,
    saturationMask,
    snr
  });
  const warnings = cameraWarnings(settings, { opticalIntensity, signalElectrons, digitalNumbers, saturationMask, snr });
  const metrics = cameraMetrics(settings, { photons, signalElectrons, noisyElectrons, digitalNumbers, saturationMask, snr });
  const base = {
    schema: "emmicro.cameraSensorLiteRun.v1" as const,
    appVersion: "L6.8" as const,
    id: input.id ?? slugId(input.label ?? "camera sensor lite"),
    label: input.label ?? "L6.8 Camera/Sensor-Lite acquisition",
    source: {
      id: input.optical.id,
      label: input.optical.label,
      resultHash: input.optical.resultHash,
      kind: input.optical.kind
    },
    settings,
    widthPx: width,
    heightPx: height,
    maps: {
      opticalIntensity,
      photons,
      signalElectrons,
      noisyElectrons,
      digitalNumbers,
      saturationMask,
      snr
    },
    histogram,
    profile,
    metrics,
    warnings,
    limitations: l68CameraLimitations()
  };
  return { ...base, resultHash: fnv1a64(stableStringify(cameraRunForHash(base))) };
}

export function cameraRunToMeasuredDataset(run: L68CameraRunResult): L67MeasuredDataset {
  const profile = run.profile.map((point, index) => ({
    xM: point.xM,
    intensity: runMaxDn(run) > 0 ? point.digitalNumber / runMaxDn(run) : 0,
    sourceIndex: index,
    label: "synthetic-camera-dn"
  }));
  const base = {
    schema: "emmicro.measuredData.v1" as const,
    appVersion: "L6.7" as const,
    id: `${run.id}-synthetic-measured`,
    label: `${run.label} synthetic camera profile`,
    kind: "image-centerline" as const,
    sourceName: "camera-sensor-lite.synthetic",
    importedAtIso: "1970-01-01T00:00:00.000Z",
    imageHash: run.resultHash,
    dimensions: {
      widthPx: run.widthPx,
      heightPx: run.heightPx
    },
    calibration: {
      positionUnit: "m" as const,
      pixelSizeM: run.settings.pixelPitchM,
      xOffsetM: 0,
      flipX: false,
      normalizationMode: "peak" as const,
      intensityScale: 1,
      backgroundOffset: 0
    },
    profile,
    metadata: {
      notes: "Synthetic Camera/Sensor-Lite DN centerline sent to measured-vs-simulated comparison.",
      skippedRowCount: 0
    },
    warnings: [
      ...run.warnings,
      {
        code: "l68.syntheticMeasured.boundary",
        message: "Synthetic camera output is a detector/acquisition model, not imported lab data or certified calibration."
      }
    ],
    limitations: l68CameraLimitations()
  };
  return { ...base, measuredDataHash: fnv1a64(stableStringify({ ...base, profile: base.profile.map((point) => ({ xM: quantize(point.xM), intensity: quantize(point.intensity), sourceIndex: point.sourceIndex })) })) };
}

export function cameraReportBundleJson(run: L68CameraRunResult): L68CameraReportBundle {
  return {
    schema: "emmicro.cameraSensorLiteBundle.v1",
    appVersion: "L6.8 Camera/Sensor-Lite Acquisition Workbench",
    manifest: {
      cameraRunHash: run.resultHash,
      sourceResultHash: run.source.resultHash,
      warningCount: run.warnings.length,
      capabilityBoundary: "Camera/Sensor-Lite is a detector/acquisition post-process over existing scalar/planar outputs; it is not pixel-level EM sensor-stack simulation, certified EMVA characterization, certified calibration, digital twin, or 3D Maxwell/FDTD/FEM/BEM/RCWA execution."
    },
    cameraRun: run,
    cameraReportJson: cameraReportJson(run),
    cameraReportMarkdown: cameraReportMarkdown(run),
    cameraMetricsCsv: cameraMetricsCsv(run),
    cameraProfileCsv: cameraProfileCsv(run),
    cameraHistogramCsv: cameraHistogramCsv(run),
    warningsJson: run.warnings
  };
}

export function cameraReportJson(run: L68CameraRunResult): string {
  return JSON.stringify({ run, warnings: run.warnings, limitations: run.limitations }, null, 2);
}

export function cameraReportMarkdown(run: L68CameraRunResult): string {
  return [
    `# ${run.label}`,
    "",
    `App version: ${run.appVersion}`,
    `Camera run hash: ${run.resultHash}`,
    `Source optical result hash: ${run.source.resultHash}`,
    `Noise mode: ${run.settings.noiseMode}`,
    "",
    "## Metrics",
    "| Metric | Value | Unit |",
    "| --- | ---: | --- |",
    ...run.metrics.map((metric) => `| ${metric.label} | ${formatNumber(metric.value)} | ${metric.unit ?? ""} |`),
    "",
    "## Warnings",
    ...(run.warnings.length ? run.warnings.map((warning) => `- ${warning.message}`) : ["- none"]),
    "",
    "## Limitations",
    ...run.limitations.map((limitation) => `- ${limitation}`)
  ].join("\n");
}

export function cameraMetricsCsv(run: L68CameraRunResult): string {
  return ["metric,label,value,unit", ...run.metrics.map((metric) => [metric.id, metric.label, metric.value, metric.unit ?? ""].map(csvEscape).join(","))].join("\n");
}

export function cameraProfileCsv(run: L68CameraRunResult): string {
  return [
    "x_m,optical_intensity,photons,electrons,digital_number,snr,saturated",
    ...run.profile.map((point) => [point.xM, point.opticalIntensity, point.photons, point.electrons, point.digitalNumber, point.snr, point.saturated ? 1 : 0].map(csvEscape).join(","))
  ].join("\n");
}

export function cameraHistogramCsv(run: L68CameraRunResult): string {
  return ["min_dn,max_dn,count", ...run.histogram.map((bin) => [bin.minDn, bin.maxDn, bin.count].map(csvEscape).join(","))].join("\n");
}

export function l68CameraLimitations(): string[] {
  return [
    "Camera/Sensor-Lite converts existing simulated intensity into a synthetic detector readout only.",
    "It does not model pixel-level electromagnetic absorption, microlenses, color filters, charge diffusion, passivation, semiconductor transport, or a real calibrated sensor stack.",
    "It is not certified EMVA 1288 characterization, ISO/clinical/hardware calibration, digital twin, manufacturing certification, or full 3D Maxwell/FDTD/FEM/BEM/RCWA execution."
  ];
}

function cameraMetrics(
  settings: L68CameraSettings,
  maps: Pick<L68CameraRunResult["maps"], "photons" | "signalElectrons" | "noisyElectrons" | "digitalNumbers" | "saturationMask" | "snr">
): L68CameraMetric[] {
  const meanPhotons = mean(maps.photons);
  const peakPhotons = maxValue(maps.photons);
  const meanElectrons = mean(maps.signalElectrons);
  const peakElectrons = maxValue(maps.signalElectrons);
  const meanDn = mean(maps.digitalNumbers);
  const peakDn = maxValue(maps.digitalNumbers);
  const saturationFraction = mean(maps.saturationMask);
  const meanSnr = mean(maps.snr);
  const peakSnr = maxValue(maps.snr);
  const dynamicRange = cameraDynamicRange(cameraSettingsToCameraModel2D(settings));
  const quantizationStepElectrons = settings.gainDnPerElectron > 0 ? 1 / settings.gainDnPerElectron : Number.POSITIVE_INFINITY;
  return [
    metric("meanPhotons", "Mean photons", meanPhotons, "photons"),
    metric("peakPhotons", "Peak photons", peakPhotons, "photons"),
    metric("meanSignalElectrons", "Mean signal electrons", meanElectrons, "e-"),
    metric("peakSignalElectrons", "Peak signal electrons", peakElectrons, "e-"),
    metric("meanDn", "Mean DN", meanDn, "DN"),
    metric("peakDn", "Peak DN", peakDn, "DN"),
    metric("saturationFraction", "Saturation fraction", saturationFraction, ""),
    metric("meanSnr", "Mean SNR", meanSnr, ""),
    metric("peakSnr", "Peak SNR", peakSnr, ""),
    metric("dynamicRange", "Dynamic range estimate", dynamicRange, "e-/e-rms"),
    metric("quantizationStepElectrons", "Quantization step", quantizationStepElectrons, "e-/DN")
  ];
}

function cameraWarnings(
  settings: L68CameraSettings,
  maps: Pick<L68CameraRunResult["maps"], "opticalIntensity" | "signalElectrons" | "digitalNumbers" | "saturationMask" | "snr">
): SolverWarning[] {
  const warnings: SolverWarning[] = [];
  const saturationFraction = mean(maps.saturationMask);
  const meanSignal = mean(maps.signalElectrons);
  const meanSnr = mean(maps.snr);
  const maxDn = 2 ** settings.bitDepth - 1;
  const uniqueDn = new Set(maps.digitalNumbers).size;
  const qStep = settings.gainDnPerElectron > 0 ? 1 / settings.gainDnPerElectron : Number.POSITIVE_INFINITY;
  if (saturationFraction > 0.001) warnings.push({ code: "l68.camera.saturation", message: "Camera/Sensor-Lite saturation: full well or ADC maximum reached." });
  if (meanSignal > 0 && meanSnr < 5) warnings.push({ code: "l68.camera.lowSnr", message: "Low mean SNR: exposure, QE, or photon flux may be insufficient." });
  if (meanSignal < 1) warnings.push({ code: "l68.camera.lowSignal", message: "Mean signal is below 1 electron per pixel; output is read/quantization limited." });
  if (qStep > Math.max(1, settings.readNoiseElectronsRms * 2)) warnings.push({ code: "l68.camera.quantization", message: "Quantization step is coarse relative to read noise." });
  if (uniqueDn < 8 && maxDn > 16) warnings.push({ code: "l68.camera.lowDigitalSpread", message: "Digital output uses very few DN levels; exposure/gain may be too low." });
  warnings.push({
    code: "l68.camera.boundary",
    message: "Camera/Sensor-Lite is not pixel-level EM absorption, microlens/color-filter/semiconductor transport, certified calibration, EMVA compliance, digital twin, or 3D Maxwell execution."
  });
  return warnings;
}

function sampleOptical(input: L68CameraOpticalInput, uM: number, vM: number): number {
  if (uM < input.uMinM || uM > input.uMaxM || vM < input.vMinM || vM > input.vMaxM) return 0;
  const x = ((uM - input.uMinM) / Math.max(1e-30, input.uMaxM - input.uMinM)) * (input.width - 1);
  const y = ((vM - input.vMinM) / Math.max(1e-30, input.vMaxM - input.vMinM)) * (input.height - 1);
  return bilinear(input.intensity, input.width, input.height, x, y);
}

function bilinear(values: ArrayLike<number>, width: number, height: number, x: number, y: number): number {
  const x0 = clamp(Math.floor(x), 0, width - 1);
  const y0 = clamp(Math.floor(y), 0, height - 1);
  const x1 = clamp(x0 + 1, 0, width - 1);
  const y1 = clamp(y0 + 1, 0, height - 1);
  const tx = clamp(x - x0, 0, 1);
  const ty = clamp(y - y0, 0, 1);
  const a = values[y0 * width + x0] ?? 0;
  const b = values[y0 * width + x1] ?? a;
  const c = values[y1 * width + x0] ?? a;
  const d = values[y1 * width + x1] ?? c;
  return a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + d * tx * ty;
}

function poissonSample(lambda: number, rng: () => number): number {
  if (lambda <= 0) return 0;
  if (lambda < 40) {
    const limit = Math.exp(-lambda);
    let k = 0;
    let product = 1;
    do {
      k += 1;
      product *= rng();
    } while (product > limit);
    return k - 1;
  }
  return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * gaussianFromRandom(rng)));
}

function snrEstimate(signal: number, dark: number, readNoise: number): number {
  const denominator = Math.sqrt(Math.max(0, signal + dark + readNoise * readNoise));
  return denominator > 0 ? signal / denominator : 0;
}

function centerlineProfile(input: {
  width: number;
  height: number;
  pixelPitchM: number;
  opticalIntensity: number[];
  photons: number[];
  signalElectrons: number[];
  noisyElectrons: number[];
  digitalNumbers: number[];
  saturationMask: number[];
  snr: number[];
}): L68CameraProfilePoint[] {
  const row = Math.floor(input.height / 2);
  const x0 = -((input.width - 1) / 2) * input.pixelPitchM;
  const profile: L68CameraProfilePoint[] = [];
  for (let x = 0; x < input.width; x += 1) {
    const index = row * input.width + x;
    profile.push({
      xM: x0 + x * input.pixelPitchM,
      opticalIntensity: input.opticalIntensity[index] ?? 0,
      photons: input.photons[index] ?? 0,
      electrons: input.noisyElectrons[index] ?? input.signalElectrons[index] ?? 0,
      digitalNumber: input.digitalNumbers[index] ?? 0,
      snr: input.snr[index] ?? 0,
      saturated: (input.saturationMask[index] ?? 0) > 0
    });
  }
  return profile;
}

function histogramDn(values: number[], bitDepth: number, binCount = 32): L68CameraHistogramBin[] {
  const maxDn = 2 ** bitDepth - 1;
  const bins = new Array(binCount).fill(0);
  for (const value of values) {
    const index = clamp(Math.floor((value / Math.max(1, maxDn)) * binCount), 0, binCount - 1);
    bins[index] = (bins[index] ?? 0) + 1;
  }
  return bins.map((count, index) => ({
    minDn: Math.round((index / binCount) * maxDn),
    maxDn: Math.round(((index + 1) / binCount) * maxDn),
    count
  }));
}

function usesShot(mode: L68CameraNoiseMode): boolean {
  return mode === "shot-only" || mode === "shot-read" || mode === "shot-read-dark";
}

function usesRead(mode: L68CameraNoiseMode): boolean {
  return mode === "shot-read" || mode === "shot-read-dark";
}

function usesDark(mode: L68CameraNoiseMode): boolean {
  return mode === "shot-read-dark";
}

function normalizeBitDepth(value: number): L68CameraSettings["bitDepth"] {
  return [8, 10, 12, 14, 16].includes(value) ? (value as L68CameraSettings["bitDepth"]) : 12;
}

function cameraRunForHash(run: Omit<L68CameraRunResult, "resultHash">): unknown {
  return {
    schema: run.schema,
    id: run.id,
    source: run.source,
    settings: run.settings,
    metrics: run.metrics.map((metricItem) => ({ id: metricItem.id, value: quantize(metricItem.value) })),
    profile: run.profile.map((point) => ({
      xM: quantize(point.xM),
      opticalIntensity: quantize(point.opticalIntensity),
      digitalNumber: point.digitalNumber,
      snr: quantize(point.snr),
      saturated: point.saturated
    }))
  };
}

function runMaxDn(run: L68CameraRunResult): number {
  return 2 ** run.settings.bitDepth - 1;
}

function metric(id: string, label: string, value: number, unit?: string): L68CameraMetric {
  return { id, label, value, unit };
}

function mean(values: ArrayLike<number>): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (let index = 0; index < values.length; index += 1) sum += values[index] ?? 0;
  return sum / values.length;
}

function maxValue(values: ArrayLike<number>): number {
  let max = 0;
  for (let index = 0; index < values.length; index += 1) max = Math.max(max, values[index] ?? 0);
  return max;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function quantize(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Number(value.toFixed(10));
}

function csvEscape(value: unknown): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "n/a";
  return Math.abs(value) >= 1e-3 && Math.abs(value) < 1e4 ? value.toFixed(6) : value.toExponential(4);
}

function slugId(label: string): string {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug || "camera"}-${fnv1a64(label).slice(0, 8)}`;
}
