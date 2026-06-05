import { defaultL68CameraSettings, type L68CameraSettings } from "./cameraSensorLite";
import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";

export type L69CalibrationFrameType = "dark" | "flat" | "exposure";

export type L69CalibrationCsvRow = {
  frameType: L69CalibrationFrameType;
  exposureMs: number;
  meanDn: number;
  varianceDn2: number;
  photonsPerPixel?: number;
  temperatureC?: number;
  notes?: string;
  sourceIndex: number;
};

export type L69CameraCalibrationDataset = {
  schema: "emmicro.cameraCalibrationDataset.v1";
  appVersion: "L6.9";
  id: string;
  label: string;
  sourceName: string;
  importedAtIso: string;
  originalColumns: string[];
  rowCount: number;
  skippedRowCount: number;
  rows: L69CalibrationCsvRow[];
  sourceTextHash: string;
  dataHash: string;
  warnings: SolverWarning[];
  limitations: string[];
};

export type L69CameraCalibrationMetric = {
  id: string;
  label: string;
  value: number;
  unit?: string;
};

export type L69PhotonTransferPoint = {
  frameType: L69CalibrationFrameType;
  exposureMs: number;
  measuredMeanDn: number;
  darkCorrectedMeanDn: number;
  measuredVarianceDn2: number;
  darkCorrectedVarianceDn2: number;
  measuredSnr: number;
  photonsPerPixel?: number;
  saturated: boolean;
};

export type L69CameraResidualPoint = {
  frameType: L69CalibrationFrameType;
  exposureMs: number;
  measuredMeanDn: number;
  simulatedMeanDn: number;
  residualMeanDn: number;
  measuredVarianceDn2: number;
  simulatedVarianceDn2: number;
  residualVarianceDn2: number;
  measuredSnr: number;
  simulatedSnr: number;
  residualSnr: number;
};

export type L69CalibratedCameraProfile = {
  pixelPitchM: number;
  quantumEfficiency: number | null;
  effectiveQuantumEfficiency: number | null;
  fullWellElectrons: number;
  readNoiseElectronsRms: number;
  darkCurrentElectronsPerS: number;
  gainDnPerElectron: number;
  conversionGainElectronsPerDn: number;
  blackLevelDn: number;
  bitDepth: L68CameraSettings["bitDepth"];
  saturationDn: number;
};

export type L69CameraCalibrationResult = {
  schema: "emmicro.cameraCalibrationRun.v1";
  appVersion: "L6.9";
  id: string;
  label: string;
  dataset: Pick<L69CameraCalibrationDataset, "id" | "label" | "sourceName" | "dataHash" | "sourceTextHash" | "rowCount">;
  assumptions: string[];
  fittedProfile: L69CalibratedCameraProfile;
  photonTransfer: L69PhotonTransferPoint[];
  residuals: L69CameraResidualPoint[];
  metrics: L69CameraCalibrationMetric[];
  warnings: SolverWarning[];
  limitations: string[];
  resultHash: string;
};

export type L69CameraCalibrationReportBundle = {
  schema: "emmicro.cameraCalibrationBundle.v1";
  appVersion: "L6.9 Camera Calibration / Photon-Transfer Workbench";
  manifest: {
    calibrationDataHash: string;
    sourceTextHash: string;
    calibrationResultHash: string;
    warningCount: number;
    capabilityBoundary: string;
  };
  dataset: L69CameraCalibrationDataset;
  calibrationRun: L69CameraCalibrationResult;
  calibrationReportJson: string;
  calibrationReportMarkdown: string;
  calibrationMetricsCsv: string;
  photonTransferCsv: string;
  residualsCsv: string;
  warningsJson: SolverWarning[];
};

type Regression = {
  slope: number;
  intercept: number;
  r2: number;
};

export function parseCameraCalibrationCsv(
  text: string,
  input: {
    id?: string;
    label?: string;
    sourceName?: string;
    importedAtIso?: string;
    bitDepth?: L68CameraSettings["bitDepth"];
  } = {}
): L69CameraCalibrationDataset {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
  if (rows.length === 0) throw new Error("camera calibration CSV is empty");

  const header = splitCsvLine(rows[0] ?? "").map((cell) => cell.trim());
  if (!header.some((cell) => /[A-Za-z_]/.test(cell))) throw new Error("camera calibration CSV requires a header row");

  const frameTypeIndex = findColumn(header, ["frame_type", "frame", "type", "kind"]);
  const exposureIndex = findColumn(header, ["exposure_ms", "exposure_time_ms", "exposure", "t_ms"]);
  const meanIndex = findColumn(header, ["mean_dn", "mean", "mean_signal", "mean_digital_number", "mean_adu"]);
  const varianceIndex = findColumn(header, ["variance_dn2", "variance", "var_dn2", "temporal_variance_dn2", "variance_adu2"]);
  const photonsIndex = findColumn(header, ["photons_per_pixel", "photon_flux_per_pixel", "known_photons_per_pixel", "photons"]);
  const temperatureIndex = findColumn(header, ["temperature_c", "temp_c", "temperature"]);
  const notesIndex = findColumn(header, ["notes", "note", "comment"]);

  const missing: string[] = [];
  if (frameTypeIndex < 0) missing.push("frame_type");
  if (exposureIndex < 0) missing.push("exposure_ms");
  if (meanIndex < 0) missing.push("mean_dn");
  if (varianceIndex < 0) missing.push("variance_dn2");
  if (missing.length > 0) throw new Error(`camera calibration CSV is missing required column(s): ${missing.join(", ")}`);

  const parsed: L69CalibrationCsvRow[] = [];
  const warnings: SolverWarning[] = [];
  let skippedRowCount = 0;
  for (let index = 1; index < rows.length; index += 1) {
    const cells = splitCsvLine(rows[index] ?? "");
    const frameType = normalizeFrameType(cells[frameTypeIndex] ?? "");
    const exposureMs = Number(cells[exposureIndex]);
    const meanDn = Number(cells[meanIndex]);
    const varianceDn2 = Number(cells[varianceIndex]);
    const photonsPerPixel = photonsIndex >= 0 && cells[photonsIndex] !== undefined && cells[photonsIndex] !== "" ? Number(cells[photonsIndex]) : undefined;
    const temperatureC = temperatureIndex >= 0 && cells[temperatureIndex] !== undefined && cells[temperatureIndex] !== "" ? Number(cells[temperatureIndex]) : undefined;
    if (!frameType || !Number.isFinite(exposureMs) || !Number.isFinite(meanDn) || !Number.isFinite(varianceDn2) || exposureMs < 0 || meanDn < 0 || varianceDn2 < 0) {
      skippedRowCount += 1;
      warnings.push({
        code: "l69.calibration.import.skippedRow",
        message: `Skipped calibration CSV row ${index + 1}: expected frame_type, nonnegative exposure_ms, mean_dn, and variance_dn2.`
      });
      continue;
    }
    if (photonsPerPixel !== undefined && (!Number.isFinite(photonsPerPixel) || photonsPerPixel <= 0)) {
      skippedRowCount += 1;
      warnings.push({
        code: "l69.calibration.import.badPhotonInput",
        message: `Skipped calibration CSV row ${index + 1}: photons_per_pixel must be positive when supplied.`
      });
      continue;
    }
    if (temperatureC !== undefined && !Number.isFinite(temperatureC)) {
      skippedRowCount += 1;
      warnings.push({
        code: "l69.calibration.import.badTemperature",
        message: `Skipped calibration CSV row ${index + 1}: temperature_c must be numeric when supplied.`
      });
      continue;
    }
    parsed.push({
      frameType,
      exposureMs,
      meanDn,
      varianceDn2,
      photonsPerPixel,
      temperatureC,
      notes: notesIndex >= 0 ? cells[notesIndex] : undefined,
      sourceIndex: index - 1
    });
  }
  if (parsed.length < 2) throw new Error("camera calibration CSV requires at least two valid data rows");

  warnings.push(...datasetWarnings(parsed, input.bitDepth));
  const sourceTextHash = fnv1a64(text);
  const base = {
    schema: "emmicro.cameraCalibrationDataset.v1" as const,
    appVersion: "L6.9" as const,
    id: input.id ?? slugId(input.label ?? "l69 camera calibration"),
    label: input.label ?? "L6.9 camera calibration import",
    sourceName: input.sourceName ?? "camera-calibration.csv",
    importedAtIso: input.importedAtIso ?? "1970-01-01T00:00:00.000Z",
    originalColumns: header,
    rowCount: parsed.length,
    skippedRowCount,
    rows: parsed.sort((a, b) => a.exposureMs - b.exposureMs || a.frameType.localeCompare(b.frameType)),
    sourceTextHash,
    warnings,
    limitations: l69CameraCalibrationLimitations()
  };
  return { ...base, dataHash: fnv1a64(stableStringify(datasetForHash(base))) };
}

export function runCameraCalibration(input: {
  id?: string;
  label?: string;
  dataset: L69CameraCalibrationDataset;
  baseSettings?: Partial<L68CameraSettings>;
}): L69CameraCalibrationResult {
  const baseCamera = defaultL68CameraSettings(input.baseSettings);
  const bitDepth = input.baseSettings?.bitDepth ?? inferBitDepth(input.dataset.rows, baseCamera.bitDepth);
  const maxDn = 2 ** bitDepth - 1;
  const darkRows = input.dataset.rows.filter((row) => row.frameType === "dark");
  const flatRows = input.dataset.rows.filter((row) => row.frameType === "flat" || row.frameType === "exposure");
  const darkMeanFit = fitDarkMean(darkRows);
  const blackLevelDn = clamp(darkMeanFit.intercept, 0, maxDn);
  const darkSlopeDnPerS = Math.max(0, darkMeanFit.slope);
  const darkVarianceFit = fitDarkVariance(darkRows);
  const readNoiseVarianceDn2 = Math.max(0, darkVarianceFit.intercept);
  const photonTransfer = input.dataset.rows.map((row) => photonTransferPoint(row, darkMeanFit, darkVarianceFit, maxDn));
  const unsaturatedFlat = photonTransfer.filter((row) => row.frameType !== "dark" && row.darkCorrectedMeanDn > 0 && !row.saturated);
  const varianceFit = fitPhotonTransferVariance(unsaturatedFlat);
  const gainDnPerElectron = Number.isFinite(varianceFit.slope) && varianceFit.slope > 0 ? varianceFit.slope : baseCamera.gainDnPerElectron || 0.1;
  const conversionGainElectronsPerDn = gainDnPerElectron > 0 ? 1 / gainDnPerElectron : Number.POSITIVE_INFINITY;
  const readNoiseElectronsRms = gainDnPerElectron > 0 ? Math.sqrt(readNoiseVarianceDn2) / gainDnPerElectron : Number.POSITIVE_INFINITY;
  const darkCurrentElectronsPerS = gainDnPerElectron > 0 ? darkSlopeDnPerS / gainDnPerElectron : 0;
  const saturationDn = detectSaturationDn(input.dataset.rows, maxDn) ?? maxDn;
  const fullWellElectrons = gainDnPerElectron > 0 ? Math.max(1, (saturationDn - blackLevelDn) / gainDnPerElectron) : baseCamera.fullWellElectrons;
  const flatSignalFit = fitFlatSignal(unsaturatedFlat);
  const qe = estimateQuantumEfficiency(unsaturatedFlat, gainDnPerElectron);
  const residuals = input.dataset.rows.map((row) => simulateResidual(row, {
    blackLevelDn,
    darkSlopeDnPerS,
    readNoiseVarianceDn2,
    gainDnPerElectron,
    saturationDn,
    flatSignalSlopeDnPerS: Math.max(0, flatSignalFit.slope),
    quantumEfficiency: qe
  }));
  const warnings = calibrationWarnings({
    datasetWarnings: input.dataset.warnings,
    darkRows,
    flatRows,
    varianceFit,
    flatSignalFit,
    qe,
    saturationDetected: detectSaturationDn(input.dataset.rows, maxDn) !== null,
    maxDn
  });
  const fittedProfile: L69CalibratedCameraProfile = {
    pixelPitchM: baseCamera.pixelPitchM,
    quantumEfficiency: qe,
    effectiveQuantumEfficiency: qe,
    fullWellElectrons,
    readNoiseElectronsRms,
    darkCurrentElectronsPerS,
    gainDnPerElectron,
    conversionGainElectronsPerDn,
    blackLevelDn,
    bitDepth,
    saturationDn
  };
  const metrics = calibrationMetrics({
    blackLevelDn,
    darkCurrentElectronsPerS,
    gainDnPerElectron,
    conversionGainElectronsPerDn,
    readNoiseElectronsRms,
    fullWellElectrons,
    saturationDn,
    qe,
    linearityError: linearityError(unsaturatedFlat, flatSignalFit),
    residuals
  });
  const assumptions = [
    "Photon-transfer analysis uses summary statistics, not raw frame stacks.",
    "Variance-vs-mean slope is interpreted as DN/e- for the L6.8 camera-lite model.",
    qe === null ? "QE is not identifiable without known photons_per_pixel input." : "Effective QE is estimated from known photons_per_pixel input.",
    "This is an EMVA-inspired diagnostic workflow, not EMVA 1288 certification."
  ];
  const base = {
    schema: "emmicro.cameraCalibrationRun.v1" as const,
    appVersion: "L6.9" as const,
    id: input.id ?? slugId(input.label ?? "l69 camera calibration run"),
    label: input.label ?? "L6.9 Camera Calibration / Photon-Transfer",
    dataset: {
      id: input.dataset.id,
      label: input.dataset.label,
      sourceName: input.dataset.sourceName,
      dataHash: input.dataset.dataHash,
      sourceTextHash: input.dataset.sourceTextHash,
      rowCount: input.dataset.rowCount
    },
    assumptions,
    fittedProfile,
    photonTransfer,
    residuals,
    metrics,
    warnings,
    limitations: l69CameraCalibrationLimitations()
  };
  return { ...base, resultHash: fnv1a64(stableStringify(resultForHash(base))) };
}

export function cameraCalibrationReportBundleJson(dataset: L69CameraCalibrationDataset, calibrationRun: L69CameraCalibrationResult): L69CameraCalibrationReportBundle {
  const warnings = dedupeWarnings([...dataset.warnings, ...calibrationRun.warnings]);
  return {
    schema: "emmicro.cameraCalibrationBundle.v1",
    appVersion: "L6.9 Camera Calibration / Photon-Transfer Workbench",
    manifest: {
      calibrationDataHash: dataset.dataHash,
      sourceTextHash: dataset.sourceTextHash,
      calibrationResultHash: calibrationRun.resultHash,
      warningCount: warnings.length,
      capabilityBoundary: "Camera calibration is an EMVA-inspired diagnostic photon-transfer workflow over summary data and the L6.8 camera-lite model; it is not EMVA 1288 certification, lab-accredited/ISO calibration, pixel-level sensor-stack EM, digital twin calibration, or 3D Maxwell/FDTD/FEM/BEM/RCWA execution."
    },
    dataset,
    calibrationRun,
    calibrationReportJson: cameraCalibrationReportJson(calibrationRun, dataset),
    calibrationReportMarkdown: cameraCalibrationReportMarkdown(calibrationRun, dataset),
    calibrationMetricsCsv: cameraCalibrationMetricsCsv(calibrationRun),
    photonTransferCsv: cameraPhotonTransferCsv(calibrationRun),
    residualsCsv: cameraCalibrationResidualsCsv(calibrationRun),
    warningsJson: warnings
  };
}

export function cameraCalibrationReportJson(calibrationRun: L69CameraCalibrationResult, dataset?: L69CameraCalibrationDataset): string {
  return JSON.stringify({ dataset, calibrationRun, warnings: calibrationRun.warnings, limitations: l69CameraCalibrationLimitations() }, null, 2);
}

export function cameraCalibrationReportMarkdown(calibrationRun: L69CameraCalibrationResult, dataset?: L69CameraCalibrationDataset): string {
  return [
    `# ${calibrationRun.label}`,
    "",
    `App version: ${calibrationRun.appVersion}`,
    `Calibration result hash: ${calibrationRun.resultHash}`,
    `Calibration data hash: ${calibrationRun.dataset.dataHash}`,
    dataset ? `Input source: ${dataset.sourceName}` : "",
    "",
    "## Estimated Camera Profile",
    "| Parameter | Value | Unit |",
    "| --- | ---: | --- |",
    `| Black level | ${formatNumber(calibrationRun.fittedProfile.blackLevelDn)} | DN |`,
    `| Conversion gain | ${formatNumber(calibrationRun.fittedProfile.conversionGainElectronsPerDn)} | e-/DN |`,
    `| L6.8 gain | ${formatNumber(calibrationRun.fittedProfile.gainDnPerElectron)} | DN/e- |`,
    `| Read noise | ${formatNumber(calibrationRun.fittedProfile.readNoiseElectronsRms)} | e- RMS |`,
    `| Dark current | ${formatNumber(calibrationRun.fittedProfile.darkCurrentElectronsPerS)} | e-/px/s |`,
    `| Full well | ${formatNumber(calibrationRun.fittedProfile.fullWellElectrons)} | e- |`,
    `| Saturation | ${formatNumber(calibrationRun.fittedProfile.saturationDn)} | DN |`,
    `| Effective QE | ${calibrationRun.fittedProfile.effectiveQuantumEfficiency === null ? "not identifiable" : formatNumber(calibrationRun.fittedProfile.effectiveQuantumEfficiency)} |  |`,
    "",
    "## Metrics",
    "| Metric | Value | Unit |",
    "| --- | ---: | --- |",
    ...calibrationRun.metrics.map((metric) => `| ${metric.label} | ${formatNumber(metric.value)} | ${metric.unit ?? ""} |`),
    "",
    "## Assumptions",
    ...calibrationRun.assumptions.map((assumption) => `- ${assumption}`),
    "",
    "## Warnings",
    ...(calibrationRun.warnings.length ? calibrationRun.warnings.map((warning) => `- ${warning.message}`) : ["- none"]),
    "",
    "## Limitations",
    ...calibrationRun.limitations.map((limitation) => `- ${limitation}`)
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function cameraCalibrationMetricsCsv(calibrationRun: L69CameraCalibrationResult): string {
  return ["metric,label,value,unit", ...calibrationRun.metrics.map((metric) => [metric.id, metric.label, metric.value, metric.unit ?? ""].map(csvEscape).join(","))].join("\n");
}

export function cameraPhotonTransferCsv(calibrationRun: L69CameraCalibrationResult): string {
  return [
    "frame_type,exposure_ms,measured_mean_dn,dark_corrected_mean_dn,measured_variance_dn2,dark_corrected_variance_dn2,measured_snr,photons_per_pixel,saturated",
    ...calibrationRun.photonTransfer.map((point) =>
      [
        point.frameType,
        point.exposureMs,
        point.measuredMeanDn,
        point.darkCorrectedMeanDn,
        point.measuredVarianceDn2,
        point.darkCorrectedVarianceDn2,
        point.measuredSnr,
        point.photonsPerPixel ?? "",
        point.saturated ? 1 : 0
      ].map(csvEscape).join(",")
    )
  ].join("\n");
}

export function cameraCalibrationResidualsCsv(calibrationRun: L69CameraCalibrationResult): string {
  return [
    "frame_type,exposure_ms,measured_mean_dn,simulated_mean_dn,residual_mean_dn,measured_variance_dn2,simulated_variance_dn2,residual_variance_dn2,measured_snr,simulated_snr,residual_snr",
    ...calibrationRun.residuals.map((point) =>
      [
        point.frameType,
        point.exposureMs,
        point.measuredMeanDn,
        point.simulatedMeanDn,
        point.residualMeanDn,
        point.measuredVarianceDn2,
        point.simulatedVarianceDn2,
        point.residualVarianceDn2,
        point.measuredSnr,
        point.simulatedSnr,
        point.residualSnr
      ].map(csvEscape).join(",")
    )
  ].join("\n");
}

export function l69ExampleCalibrationCsv(includePhotons = false): string {
  if (includePhotons) {
    return [
      "frame_type,exposure_ms,mean_dn,variance_dn2,photons_per_pixel,temperature_c,notes",
      "dark,1,64.2,2.9,,22,dark frame",
      "dark,10,66.8,3.4,,22,dark frame",
      "flat,1,412.1,38.5,3600,22,flat frame",
      "flat,5,1820.4,174.2,18000,22,flat frame",
      "flat,10,3562.7,342.9,36000,22,flat frame"
    ].join("\n");
  }
  return [
    "frame_type,exposure_ms,mean_dn,variance_dn2,temperature_c,notes",
    "dark,1,64.2,2.9,22,dark frame",
    "dark,10,66.8,3.4,22,dark frame",
    "flat,1,412.1,38.5,22,flat frame",
    "flat,5,1820.4,174.2,22,flat frame",
    "flat,10,3562.7,342.9,22,flat frame"
  ].join("\n");
}

export function l69CameraCalibrationLimitations(): string[] {
  return [
    "Camera calibration is a diagnostic photon-transfer-style workflow over imported summary measurements.",
    "It is EMVA-inspired only; it is not EMVA 1288 certification, ISO-certified calibration, or lab-accredited camera characterization.",
    "It does not perform hardware camera control, raw frame-stack metrology, pixel-level charge transport, sensor-stack electromagnetic absorption, digital twin calibration, manufacturing certification, or full 3D Maxwell/FDTD/FEM/BEM/RCWA execution."
  ];
}

function datasetWarnings(rows: L69CalibrationCsvRow[], bitDepth?: L68CameraSettings["bitDepth"]): SolverWarning[] {
  const warnings: SolverWarning[] = [];
  const darks = rows.filter((row) => row.frameType === "dark");
  const flats = rows.filter((row) => row.frameType === "flat" || row.frameType === "exposure");
  const darkExposureCount = new Set(darks.map((row) => row.exposureMs)).size;
  const flatExposureCount = new Set(flats.map((row) => row.exposureMs)).size;
  if (darks.length === 0) warnings.push({ code: "l69.calibration.import.missingDark", message: "Calibration import has no dark rows; black level/read noise/dark current will be less identifiable." });
  if (flats.length === 0) warnings.push({ code: "l69.calibration.import.missingFlat", message: "Calibration import has no flat/exposure rows; photon-transfer gain and saturation will be less identifiable." });
  if (darkExposureCount < 2) warnings.push({ code: "l69.calibration.import.tooFewDarkExposures", message: "Use at least two dark exposure levels to estimate dark offset vs exposure." });
  if (flatExposureCount < 2) warnings.push({ code: "l69.calibration.import.tooFewFlatExposures", message: "Use at least two flat/exposure levels to estimate photon-transfer slope and linearity." });
  if (!rows.some((row) => row.photonsPerPixel !== undefined)) {
    warnings.push({ code: "l69.calibration.qe.notIdentifiable", message: "QE cannot be estimated without known photon flux / photons-per-pixel calibration." });
  }
  const maxDn = bitDepth ? 2 ** bitDepth - 1 : inferMaxDn(rows);
  if (rows.some((row) => row.meanDn >= maxDn * 0.98)) warnings.push({ code: "l69.calibration.import.saturation", message: "Calibration data includes rows near ADC saturation/clipping." });
  warnings.push({
    code: "l69.calibration.boundary",
    message: "Camera calibration is EMVA-inspired diagnostic analysis only, not EMVA 1288 certification, ISO calibration, sensor-stack EM, digital twin, or 3D Maxwell execution."
  });
  return warnings;
}

function fitDarkMean(darkRows: L69CalibrationCsvRow[]): Regression {
  if (darkRows.length >= 2) return linearRegression(darkRows.map((row) => row.exposureMs * 1e-3), darkRows.map((row) => row.meanDn));
  const value = darkRows[0]?.meanDn ?? 0;
  return { slope: 0, intercept: value, r2: 1 };
}

function fitDarkVariance(darkRows: L69CalibrationCsvRow[]): Regression {
  if (darkRows.length >= 2) return linearRegression(darkRows.map((row) => row.exposureMs * 1e-3), darkRows.map((row) => row.varianceDn2));
  const value = darkRows[0]?.varianceDn2 ?? 0;
  return { slope: 0, intercept: value, r2: 1 };
}

function photonTransferPoint(row: L69CalibrationCsvRow, darkMeanFit: Regression, darkVarianceFit: Regression, maxDn: number): L69PhotonTransferPoint {
  const exposureS = row.exposureMs * 1e-3;
  const darkMean = darkMeanFit.intercept + darkMeanFit.slope * exposureS;
  const darkVariance = Math.max(0, darkVarianceFit.intercept + darkVarianceFit.slope * exposureS);
  const signalMean = row.frameType === "dark" ? Math.max(0, row.meanDn - darkMeanFit.intercept) : Math.max(0, row.meanDn - darkMean);
  const signalVariance = row.frameType === "dark" ? row.varianceDn2 : Math.max(0, row.varianceDn2 - darkVariance);
  return {
    frameType: row.frameType,
    exposureMs: row.exposureMs,
    measuredMeanDn: row.meanDn,
    darkCorrectedMeanDn: signalMean,
    measuredVarianceDn2: row.varianceDn2,
    darkCorrectedVarianceDn2: signalVariance,
    measuredSnr: row.varianceDn2 > 0 ? signalMean / Math.sqrt(row.varianceDn2) : 0,
    photonsPerPixel: row.photonsPerPixel,
    saturated: row.meanDn >= maxDn * 0.98
  };
}

function fitPhotonTransferVariance(rows: L69PhotonTransferPoint[]): Regression {
  const usable = rows.filter((row) => row.darkCorrectedMeanDn > 0 && row.darkCorrectedVarianceDn2 > 0);
  if (usable.length < 2) return { slope: Number.NaN, intercept: Number.NaN, r2: 0 };
  return linearRegression(usable.map((row) => row.darkCorrectedMeanDn), usable.map((row) => row.darkCorrectedVarianceDn2));
}

function fitFlatSignal(rows: L69PhotonTransferPoint[]): Regression {
  const usable = rows.filter((row) => row.darkCorrectedMeanDn > 0);
  if (usable.length < 2) return { slope: 0, intercept: usable[0]?.darkCorrectedMeanDn ?? 0, r2: 0 };
  return linearRegression(usable.map((row) => row.exposureMs * 1e-3), usable.map((row) => row.darkCorrectedMeanDn));
}

function estimateQuantumEfficiency(rows: L69PhotonTransferPoint[], gainDnPerElectron: number): number | null {
  if (gainDnPerElectron <= 0) return null;
  const estimates = rows
    .filter((row) => row.photonsPerPixel !== undefined && row.photonsPerPixel > 0 && row.darkCorrectedMeanDn > 0)
    .map((row) => row.darkCorrectedMeanDn / gainDnPerElectron / (row.photonsPerPixel as number))
    .filter((value) => Number.isFinite(value) && value >= 0);
  if (estimates.length === 0) return null;
  return clamp(median(estimates), 0, 1);
}

function simulateResidual(
  row: L69CalibrationCsvRow,
  fit: {
    blackLevelDn: number;
    darkSlopeDnPerS: number;
    readNoiseVarianceDn2: number;
    gainDnPerElectron: number;
    saturationDn: number;
    flatSignalSlopeDnPerS: number;
    quantumEfficiency: number | null;
  }
): L69CameraResidualPoint {
  const exposureS = row.exposureMs * 1e-3;
  const darkSignalDn = fit.darkSlopeDnPerS * exposureS;
  const flatSignalDn =
    row.frameType === "dark"
      ? 0
      : row.photonsPerPixel !== undefined && fit.quantumEfficiency !== null
        ? row.photonsPerPixel * fit.quantumEfficiency * fit.gainDnPerElectron
        : fit.flatSignalSlopeDnPerS * exposureS;
  const simulatedMeanDn = clamp(fit.blackLevelDn + darkSignalDn + flatSignalDn, 0, fit.saturationDn);
  const simulatedVarianceDn2 = Math.max(0, fit.readNoiseVarianceDn2 + fit.gainDnPerElectron * Math.max(0, simulatedMeanDn - fit.blackLevelDn));
  const measuredSignalDn = Math.max(0, row.meanDn - fit.blackLevelDn);
  const simulatedSignalDn = Math.max(0, simulatedMeanDn - fit.blackLevelDn);
  const measuredSnr = row.varianceDn2 > 0 ? measuredSignalDn / Math.sqrt(row.varianceDn2) : 0;
  const simulatedSnr = simulatedVarianceDn2 > 0 ? simulatedSignalDn / Math.sqrt(simulatedVarianceDn2) : 0;
  return {
    frameType: row.frameType,
    exposureMs: row.exposureMs,
    measuredMeanDn: row.meanDn,
    simulatedMeanDn,
    residualMeanDn: row.meanDn - simulatedMeanDn,
    measuredVarianceDn2: row.varianceDn2,
    simulatedVarianceDn2,
    residualVarianceDn2: row.varianceDn2 - simulatedVarianceDn2,
    measuredSnr,
    simulatedSnr,
    residualSnr: measuredSnr - simulatedSnr
  };
}

function calibrationWarnings(input: {
  datasetWarnings: SolverWarning[];
  darkRows: L69CalibrationCsvRow[];
  flatRows: L69CalibrationCsvRow[];
  varianceFit: Regression;
  flatSignalFit: Regression;
  qe: number | null;
  saturationDetected: boolean;
  maxDn: number;
}): SolverWarning[] {
  const warnings: SolverWarning[] = [...input.datasetWarnings];
  if (!Number.isFinite(input.varianceFit.slope) || input.varianceFit.slope <= 0) {
    warnings.push({
      code: "l69.calibration.gainFallback",
      message: "Photon-transfer variance-vs-mean slope was not identifiable; retained the base camera conversion gain."
    });
  }
  if (input.flatSignalFit.r2 < 0.98 && input.flatRows.length >= 3) {
    warnings.push({
      code: "l69.calibration.linearity",
      message: "Flat mean vs exposure has visible nonlinearity; inspect saturation, illumination stability, or clipped rows."
    });
  }
  if (input.qe === null) {
    warnings.push({
      code: "l69.calibration.qe.notIdentifiable.fit",
      message: "QE cannot be estimated without known photon flux / photons-per-pixel calibration."
    });
  }
  if (!input.saturationDetected) {
    warnings.push({
      code: "l69.calibration.fullWell.lowerBound",
      message: "Saturation was not directly observed; full-well/saturation remains an ADC/profile assumption, not a measured certified limit."
    });
  }
  warnings.push({
    code: "l69.calibration.notCertified",
    message: "This is an EMVA-inspired diagnostic calibration workflow, not EMVA 1288 certification or lab-accredited camera characterization."
  });
  return dedupeWarnings(warnings);
}

function calibrationMetrics(input: {
  blackLevelDn: number;
  darkCurrentElectronsPerS: number;
  gainDnPerElectron: number;
  conversionGainElectronsPerDn: number;
  readNoiseElectronsRms: number;
  fullWellElectrons: number;
  saturationDn: number;
  qe: number | null;
  linearityError: number;
  residuals: L69CameraResidualPoint[];
}): L69CameraCalibrationMetric[] {
  const residualMean = input.residuals.map((point) => point.residualMeanDn);
  const residualSnr = input.residuals.map((point) => point.residualSnr);
  const maxMeasuredDn = maxValue(input.residuals.map((point) => point.measuredMeanDn));
  const saturationMismatchDn = Math.abs(maxMeasuredDn - input.saturationDn);
  return [
    metric("blackLevelDn", "Black level", input.blackLevelDn, "DN"),
    metric("darkCurrentElectronsPerS", "Dark current", input.darkCurrentElectronsPerS, "e-/px/s"),
    metric("gainDnPerElectron", "L6.8 gain", input.gainDnPerElectron, "DN/e-"),
    metric("conversionGainElectronsPerDn", "Conversion gain", input.conversionGainElectronsPerDn, "e-/DN"),
    metric("readNoiseElectronsRms", "Read noise", input.readNoiseElectronsRms, "e- RMS"),
    metric("fullWellElectrons", "Full well", input.fullWellElectrons, "e-"),
    metric("saturationDn", "Saturation", input.saturationDn, "DN"),
    metric("effectiveQuantumEfficiency", "Effective QE", input.qe ?? Number.NaN, ""),
    metric("dynamicRange", "Dynamic range", input.readNoiseElectronsRms > 0 ? input.fullWellElectrons / input.readNoiseElectronsRms : Number.POSITIVE_INFINITY, ""),
    metric("residualRmsDn", "Residual RMS", rms(residualMean), "DN"),
    metric("maxResidualDn", "Max residual", maxAbs(residualMean), "DN"),
    metric("linearityError", "Linearity error", input.linearityError, ""),
    metric("snrMismatchRms", "SNR mismatch RMS", rms(residualSnr), ""),
    metric("saturationMismatchDn", "Saturation mismatch", saturationMismatchDn, "DN")
  ];
}

function linearityError(rows: L69PhotonTransferPoint[], fit: Regression): number {
  const usable = rows.filter((row) => row.darkCorrectedMeanDn > 0);
  if (usable.length < 2 || fit.slope === 0) return Number.NaN;
  const residuals = usable.map((row) => {
    const predicted = fit.intercept + fit.slope * row.exposureMs * 1e-3;
    return row.darkCorrectedMeanDn - predicted;
  });
  const scale = Math.max(...usable.map((row) => Math.abs(row.darkCorrectedMeanDn)), 1);
  return maxAbs(residuals) / scale;
}

function detectSaturationDn(rows: L69CalibrationCsvRow[], maxDn: number): number | null {
  const nearAdc = rows.filter((row) => row.meanDn >= maxDn * 0.98).map((row) => row.meanDn);
  if (nearAdc.length > 0) return Math.min(maxDn, Math.max(...nearAdc));
  const flats = rows.filter((row) => row.frameType !== "dark").sort((a, b) => a.exposureMs - b.exposureMs);
  if (flats.length < 4) return null;
  const slopes: number[] = [];
  for (let index = 1; index < flats.length; index += 1) {
    const dx = (flats[index]!.exposureMs - flats[index - 1]!.exposureMs) * 1e-3;
    if (dx > 0) slopes.push((flats[index]!.meanDn - flats[index - 1]!.meanDn) / dx);
  }
  if (slopes.length < 2) return null;
  const early = Math.max(1e-12, median(slopes.slice(0, Math.ceil(slopes.length / 2))));
  const late = slopes[slopes.length - 1] ?? early;
  if (late < early * 0.25) return Math.max(...flats.map((row) => row.meanDn));
  return null;
}

function inferBitDepth(rows: L69CalibrationCsvRow[], fallback: L68CameraSettings["bitDepth"]): L68CameraSettings["bitDepth"] {
  const max = maxValue(rows.map((row) => row.meanDn));
  for (const depth of [8, 10, 12, 14, 16] as const) {
    if (max <= 2 ** depth - 1) return depth;
  }
  return fallback;
}

function inferMaxDn(rows: L69CalibrationCsvRow[]): number {
  return 2 ** inferBitDepth(rows, 12) - 1;
}

function linearRegression(x: number[], y: number[]): Regression {
  const count = Math.min(x.length, y.length);
  if (count === 0) return { slope: 0, intercept: 0, r2: 0 };
  const meanX = mean(x.slice(0, count));
  const meanY = mean(y.slice(0, count));
  let numerator = 0;
  let denominator = 0;
  let total = 0;
  for (let index = 0; index < count; index += 1) {
    const dx = (x[index] ?? 0) - meanX;
    const dy = (y[index] ?? 0) - meanY;
    numerator += dx * dy;
    denominator += dx * dx;
    total += dy * dy;
  }
  const slope = denominator > 0 ? numerator / denominator : 0;
  const intercept = meanY - slope * meanX;
  let residual = 0;
  for (let index = 0; index < count; index += 1) {
    const estimate = intercept + slope * (x[index] ?? 0);
    residual += ((y[index] ?? 0) - estimate) ** 2;
  }
  return { slope, intercept, r2: total > 0 ? Math.max(0, 1 - residual / total) : 1 };
}

function normalizeFrameType(value: string): L69CalibrationFrameType | null {
  const normalized = normalizeColumn(value);
  if (normalized === "dark" || normalized === "bias" || normalized === "dark_frame") return "dark";
  if (normalized === "flat" || normalized === "light" || normalized === "flat_frame") return "flat";
  if (normalized === "exposure" || normalized === "sweep" || normalized === "exposure_sweep") return "exposure";
  return null;
}

function splitCsvLine(line: string): string[] {
  const output: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"") {
      quoted = !quoted;
      continue;
    }
    if (!quoted && (char === "," || char === "\t" || char === ";")) {
      output.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  output.push(current.trim());
  return output;
}

function findColumn(header: string[], candidates: string[]): number {
  const normalized = header.map((cell) => normalizeColumn(cell));
  for (const candidate of candidates.map(normalizeColumn)) {
    const index = normalized.indexOf(candidate);
    if (index >= 0) return index;
  }
  return -1;
}

function normalizeColumn(value: string): string {
  return value.trim().toLowerCase().replaceAll(" ", "_").replaceAll("-", "_");
}

function datasetForHash(dataset: Omit<L69CameraCalibrationDataset, "dataHash">): unknown {
  return {
    schema: dataset.schema,
    id: dataset.id,
    label: dataset.label,
    sourceName: dataset.sourceName,
    originalColumns: dataset.originalColumns,
    sourceTextHash: dataset.sourceTextHash,
    rows: dataset.rows.map((row) => quantizeObject(row))
  };
}

function resultForHash(run: Omit<L69CameraCalibrationResult, "resultHash">): unknown {
  return {
    schema: run.schema,
    id: run.id,
    dataset: run.dataset,
    fittedProfile: quantizeObject(run.fittedProfile as unknown as Record<string, unknown>),
    metrics: run.metrics.map((metricItem) => ({ id: metricItem.id, value: quantize(metricItem.value) })),
    residuals: run.residuals.map((point) => quantizeObject(point as unknown as Record<string, unknown>)),
    warningCodes: run.warnings.map((warning) => warning.code)
  };
}

function dedupeWarnings(warnings: SolverWarning[]): SolverWarning[] {
  const seen = new Set<string>();
  const output: SolverWarning[] = [];
  for (const warning of warnings) {
    const key = `${warning.code}:${warning.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(warning);
  }
  return output;
}

function quantizeObject<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, typeof item === "number" ? quantize(item) : item])) as T;
}

function metric(id: string, label: string, value: number, unit?: string): L69CameraCalibrationMetric {
  return { id, label, value, unit };
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2 : (sorted[middle] ?? 0);
}

function rms(values: number[]): number {
  if (values.length === 0) return Number.NaN;
  return Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length);
}

function maxAbs(values: number[]): number {
  if (values.length === 0) return Number.NaN;
  return Math.max(...values.map((value) => Math.abs(value)));
}

function maxValue(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function quantize(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Number(value.toFixed(12));
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
  return `${slug || "camera-calibration"}-${fnv1a64(label).slice(0, 8)}`;
}
