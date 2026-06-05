import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import type { L74SessionQaResult } from "../workspace/batchSessionQa";
import type { L75FiducialBoard, L75FiducialFitResult } from "./fiducialBoard";
import type { L76DetectorComparisonResult, L76ExternalDetectorImportResult } from "./externalDetectorBridge";

export const l78DetectorRoundTripAppVersion = "L7.8 Detector Round-Trip Acceptance Pack" as const;

export type L78RoundTripStatus = "not-started" | "ready" | "warning" | "pass" | "fail";

export type L78DetectorRoundTripStepId =
  | "board-export"
  | "external-helper"
  | "import-output"
  | "receipt-validation"
  | "id-match"
  | "geometry-fit"
  | "session-qa"
  | "evidence-export";

export type L78DetectorRoundTripStep = {
  id: L78DetectorRoundTripStepId;
  label: string;
  status: L78RoundTripStatus;
  requiredFile: string;
  hash: string | null;
  warnings: SolverWarning[];
  nextAction: string;
};

export type L78DetectorRoundTripThresholds = {
  minMarkers: number;
  minCharucoCorners: number;
  minCoverage: number;
  maxFitRmsPx: number;
  maxFitMaxResidualPx: number;
  minMeanConfidence: number;
  allowPartialView: boolean;
};

export type L78DetectorRoundTripMetrics = {
  detectorReceipt: "pass" | "warning" | "fail";
  boardHashStatus: "match" | "mismatch" | "not-compared" | "missing";
  imageHashStatus: "match" | "mismatch" | "not-compared" | "missing";
  detectedMarkers: number;
  detectedCharucoCorners: number;
  acceptedMarkers: number;
  acceptedCharucoCorners: number;
  matchedPoints: number;
  coverageScore: number;
  meanConfidence: number;
  fitRmsPx: number | null;
  fitMaxResidualPx: number | null;
  sessionQaStatus: "pass" | "warning" | "fail" | "not-run";
  manualEditCount: number;
  warningCount: number;
};

export type L78DetectorRoundTripReport = {
  schema: "emmicro.l78.detectorRoundTripAcceptance.v1";
  appVersion: typeof l78DetectorRoundTripAppVersion;
  id: string;
  label: string;
  status: "pass" | "warning" | "fail";
  fixtureKind?: "clean" | "partial-view" | "blur-noise" | "custom";
  thresholds: L78DetectorRoundTripThresholds;
  metrics: L78DetectorRoundTripMetrics;
  steps: L78DetectorRoundTripStep[];
  importResult: {
    resultHash: string | null;
    receiptHash: string | null;
    detectorName: string | null;
    detectorVersion: string | null;
    runnerHash: string | null;
    dictionary: string | null;
    boardHash: string | null;
    imageHash: string | null;
    sourceFormat: string | null;
  };
  comparisonHash: string | null;
  fitHash: string | null;
  sessionHash: string | null;
  warnings: SolverWarning[];
  limitations: string[];
  resultHash: string;
};

export const l78DetectorRoundTripLimitations = [
  "L7.8 is an operational detector round-trip acceptance package over L7.7 external detector imports; it does not add browser-native OpenCV.js, AprilTag decoding, or new detector physics.",
  "Acceptance metrics validate receipts, hashes, ID matching, diagnostic geometry fit, and L7.4 session QA handoff only; they are not certified camera calibration, lab-accredited metrology, or full 3D pose/stereo calibration.",
  "The workflow does not execute hardware camera control, pixel-level sensor-stack EM, a digital twin, manufacturing certification, or full 3D Maxwell/FDTD/FEM/BEM/RCWA/CAD physics."
] as const;

export function defaultL78RoundTripThresholds(input: Partial<L78DetectorRoundTripThresholds> = {}): L78DetectorRoundTripThresholds {
  return {
    minMarkers: Math.max(0, Math.round(finite(input.minMarkers, 4))),
    minCharucoCorners: Math.max(0, Math.round(finite(input.minCharucoCorners, 8))),
    minCoverage: clamp(finite(input.minCoverage, 0.2), 0, 1),
    maxFitRmsPx: Math.max(0, finite(input.maxFitRmsPx, 0.25)),
    maxFitMaxResidualPx: Math.max(0, finite(input.maxFitMaxResidualPx, 0.9)),
    minMeanConfidence: clamp(finite(input.minMeanConfidence, 0.85), 0, 1),
    allowPartialView: input.allowPartialView ?? false
  };
}

export function createDetectorRoundTripAcceptance(input: {
  id?: string;
  label?: string;
  fixtureKind?: L78DetectorRoundTripReport["fixtureKind"];
  board?: L75FiducialBoard | null;
  importResult?: L76ExternalDetectorImportResult | null;
  comparison?: L76DetectorComparisonResult | null;
  fit?: L75FiducialFitResult | null;
  sessionQa?: L74SessionQaResult | null;
  thresholds?: Partial<L78DetectorRoundTripThresholds>;
}): L78DetectorRoundTripReport {
  const thresholds = defaultL78RoundTripThresholds(input.thresholds);
  const importResult = input.importResult ?? null;
  const fit = input.fit ?? null;
  const sessionQa = input.sessionQa ?? null;
  const warnings: SolverWarning[] = [];
  if (importResult) warnings.push(...importResult.warnings);
  if (fit) warnings.push(...fit.warnings);
  if (sessionQa) warnings.push(...sessionQa.warnings);

  const metrics = roundTripMetrics(importResult, fit, sessionQa);
  warnings.push(...thresholdWarnings(metrics, thresholds));
  const steps = roundTripSteps({ board: input.board ?? null, importResult, fit, sessionQa, metrics, thresholds });
  const status = aggregateStatus(steps, warnings);
  const partial = {
    schema: "emmicro.l78.detectorRoundTripAcceptance.v1" as const,
    appVersion: l78DetectorRoundTripAppVersion,
    id: input.id ?? "l78-detector-roundtrip-acceptance",
    label: input.label ?? "L7.8 detector round-trip acceptance",
    status,
    fixtureKind: input.fixtureKind,
    thresholds,
    metrics: { ...metrics, warningCount: warnings.length },
    steps,
    importResult: {
      resultHash: importResult?.resultHash ?? null,
      receiptHash: importResult?.receipt.resultHash ?? null,
      detectorName: importResult?.detector.name ?? null,
      detectorVersion: importResult?.detector.version ?? null,
      runnerHash: importResult?.detector.runnerHash ?? null,
      dictionary: importResult ? stringParameter(importResult.detector.parameters.dictionary) : null,
      boardHash: importResult?.board.boardHash ?? null,
      imageHash: importResult?.image.imageHash ?? null,
      sourceFormat: importResult?.sourceFormat ?? null
    },
    comparisonHash: input.comparison?.resultHash ?? null,
    fitHash: fit?.resultHash ?? null,
    sessionHash: sessionQa?.resultHash ?? null,
    warnings: dedupeWarnings(warnings),
    limitations: [...l78DetectorRoundTripLimitations]
  };
  return { ...partial, resultHash: fnv1a64(stableStringify(resultForHash(partial))) };
}

export function detectorRoundTripReportJson(report: L78DetectorRoundTripReport): string {
  return JSON.stringify(report, null, 2);
}

export function detectorRoundTripReportMarkdown(report: L78DetectorRoundTripReport): string {
  return [
    `# ${report.label}`,
    "",
    `App version: ${report.appVersion}`,
    `Status: ${report.status.toUpperCase()}`,
    `Result hash: ${report.resultHash}`,
    "",
    "## Detector Receipt",
    `- Detector: ${report.importResult.detectorName ?? "not imported"} ${report.importResult.detectorVersion ?? ""}`.trim(),
    `- Runner hash: ${report.importResult.runnerHash ?? "not supplied"}`,
    `- Dictionary: ${report.importResult.dictionary ?? "not supplied"}`,
    `- Board hash status: ${report.metrics.boardHashStatus}`,
    `- Image hash status: ${report.metrics.imageHashStatus}`,
    `- Receipt status: ${report.metrics.detectorReceipt.toUpperCase()}`,
    "",
    "## Acceptance Metrics",
    `- Detected markers: ${report.metrics.detectedMarkers}`,
    `- Detected ChArUco corners: ${report.metrics.detectedCharucoCorners}`,
    `- Accepted markers: ${report.metrics.acceptedMarkers}`,
    `- Accepted ChArUco corners: ${report.metrics.acceptedCharucoCorners}`,
    `- Matched points: ${report.metrics.matchedPoints}`,
    `- Coverage score: ${report.metrics.coverageScore.toPrecision(4)}`,
    `- Mean confidence: ${report.metrics.meanConfidence.toPrecision(4)}`,
    `- Fit RMS: ${formatMaybe(report.metrics.fitRmsPx)} px`,
    `- Fit max residual: ${formatMaybe(report.metrics.fitMaxResidualPx)} px`,
    `- Session QA: ${report.metrics.sessionQaStatus.toUpperCase()}`,
    `- Manual edits: ${report.metrics.manualEditCount}`,
    "",
    "## Wizard Steps",
    "| Step | Status | Required file | Hash | Next action |",
    "| --- | --- | --- | --- | --- |",
    ...report.steps.map((step) => `| ${step.label} | ${step.status} | ${step.requiredFile} | ${step.hash ?? "n/a"} | ${step.nextAction} |`),
    "",
    "## Warnings",
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning.code}: ${warning.message}`) : ["- none"]),
    "",
    "## Exports",
    "- roundtrip_report.md",
    "- roundtrip_report.json",
    "- roundtrip_metrics.csv",
    "- roundtrip_warnings.json",
    "",
    "## Boundary",
    ...report.limitations.map((limitation) => `- ${limitation}`)
  ].join("\n");
}

export function detectorRoundTripMetricsCsv(report: L78DetectorRoundTripReport): string {
  const rows = Object.entries(report.metrics).map(([id, value]) => [id, value].map(csvEscape).join(","));
  return ["metric_id,value", ...rows].join("\n");
}

export function detectorRoundTripWarningsJson(report: L78DetectorRoundTripReport): string {
  return JSON.stringify(report.warnings, null, 2);
}

function roundTripMetrics(importResult: L76ExternalDetectorImportResult | null, fit: L75FiducialFitResult | null, sessionQa: L74SessionQaResult | null): L78DetectorRoundTripMetrics {
  const acceptedMarkers = importResult?.detection.markers.filter((marker) => marker.status === "accepted") ?? [];
  const acceptedCharuco = importResult?.detection.charucoCorners.filter((corner) => corner.status === "accepted") ?? [];
  const confidences = [
    ...acceptedMarkers.map((marker) => marker.confidence),
    ...acceptedCharuco.map((corner) => corner.confidence)
  ];
  const hashStatusBoard = receiptHashStatus(importResult?.board.boardHash, importResult?.board.hashMatchesExpected);
  const hashStatusImage = receiptHashStatus(importResult?.image.imageHash, importResult?.image.hashMatchesExpected);
  return {
    detectorReceipt: detectorReceiptStatus(importResult, hashStatusBoard, hashStatusImage),
    boardHashStatus: hashStatusBoard,
    imageHashStatus: hashStatusImage,
    detectedMarkers: importResult?.detection.markers.length ?? 0,
    detectedCharucoCorners: importResult?.detection.charucoCorners.length ?? 0,
    acceptedMarkers: acceptedMarkers.length,
    acceptedCharucoCorners: acceptedCharuco.length,
    matchedPoints: fit?.match.matchedPointCount ?? importResult?.match?.matchedPointCount ?? 0,
    coverageScore: round(fit?.match.coverageScore ?? importResult?.match?.coverageScore ?? 0),
    meanConfidence: confidences.length ? round(confidences.reduce((sum, value) => sum + value, 0) / confidences.length) : 0,
    fitRmsPx: fit?.fit?.metrics.rmsResidualPx ?? null,
    fitMaxResidualPx: fit?.fit?.metrics.maxResidualPx ?? null,
    sessionQaStatus: sessionQa?.status ?? "not-run",
    manualEditCount: importResult?.detection.manualEdits.length ?? 0,
    warningCount: 0
  };
}

function roundTripSteps(input: {
  board: L75FiducialBoard | null;
  importResult: L76ExternalDetectorImportResult | null;
  fit: L75FiducialFitResult | null;
  sessionQa: L74SessionQaResult | null;
  metrics: L78DetectorRoundTripMetrics;
  thresholds: L78DetectorRoundTripThresholds;
}): L78DetectorRoundTripStep[] {
  const receiptWarnings = receiptStepWarnings(input.metrics);
  const matchWarnings = matchStepWarnings(input.metrics, input.thresholds);
  const fitWarnings = fitStepWarnings(input.metrics, input.thresholds);
  return [
    step("board-export", "Export board manifest / printable board", input.board ? "pass" : "not-started", "board_manifest.json + board_print.png", input.board?.resultHash ?? null, [], input.board ? "Run external detector helper" : "Generate or load a board manifest"),
    step("external-helper", "Run external detector helper", input.importResult ? "pass" : input.board ? "ready" : "not-started", "synthetic_capture_*.png", input.importResult?.receipt.sourceTextHash ?? null, [], input.importResult ? "Import detector output" : "Run tools/detectors helper outside the browser"),
    step("import-output", "Import detector JSON/CSV", input.importResult ? "pass" : "not-started", "detection_*.json or marker CSV", input.importResult?.resultHash ?? null, [], input.importResult ? "Validate receipt and hashes" : "Import detector JSON or CSV"),
    step("receipt-validation", "Validate receipt and hashes", statusFromWarnings(input.importResult ? receiptWarnings : [], Boolean(input.importResult), false), "detector receipt", input.importResult?.receipt.resultHash ?? null, receiptWarnings, input.importResult ? "Match IDs to board" : "Import detector output first"),
    step("id-match", "Match IDs to board", statusFromWarnings(matchWarnings, Boolean(input.importResult?.match), input.thresholds.allowPartialView), "board_manifest.json + detection_*.json", input.importResult?.match?.resultHash ?? null, matchWarnings, input.importResult?.match ? "Run geometry fit" : "Validate/import detection against active board"),
    step("geometry-fit", "Run geometry fit", statusFromWarnings(fitWarnings, Boolean(input.fit?.fit), false), "matched_points.csv", input.fit?.fit?.resultHash ?? null, fitWarnings, input.fit?.fit ? "Add to session QA" : "Run L7.2 geometry fit"),
    step("session-qa", "Add to batch session QA", sessionStatus(input.sessionQa), "session_report.json", input.sessionQa?.resultHash ?? null, [], input.sessionQa ? "Export round-trip evidence" : "Add accepted fit as L7.4 fiducial_board frame"),
    step("evidence-export", "Export round-trip evidence", input.importResult ? "ready" : "not-started", "roundtrip_report.md/json/csv", null, [], input.importResult ? "Export report bundle" : "Complete detector import first")
  ];
}

function thresholdWarnings(metrics: L78DetectorRoundTripMetrics, thresholds: L78DetectorRoundTripThresholds): SolverWarning[] {
  return [
    ...matchStepWarnings(metrics, thresholds),
    ...fitStepWarnings(metrics, thresholds),
    ...receiptStepWarnings(metrics)
  ];
}

function receiptStepWarnings(metrics: L78DetectorRoundTripMetrics): SolverWarning[] {
  const warnings: SolverWarning[] = [];
  if (metrics.boardHashStatus === "mismatch") warnings.push({ code: "l78.roundtrip.boardHashMismatch", message: "Board hash does not match the active board manifest." });
  if (metrics.imageHashStatus === "mismatch") warnings.push({ code: "l78.roundtrip.imageHashMismatch", message: "Image hash does not match the expected capture hash." });
  if (metrics.boardHashStatus === "missing" || metrics.imageHashStatus === "missing") warnings.push({ code: "l78.roundtrip.missingHash", message: "Detector receipt is missing board or image hash evidence." });
  if (metrics.boardHashStatus === "not-compared" || metrics.imageHashStatus === "not-compared") warnings.push({ code: "l78.roundtrip.hashNotCompared", message: "Detector receipt hash was present but not compared against an expected hash." });
  return warnings;
}

function matchStepWarnings(metrics: L78DetectorRoundTripMetrics, thresholds: L78DetectorRoundTripThresholds): SolverWarning[] {
  const warnings: SolverWarning[] = [];
  const coverageSeverity = thresholds.allowPartialView ? "partial-view warning" : "threshold";
  if (metrics.acceptedMarkers < thresholds.minMarkers) warnings.push({ code: "l78.roundtrip.minMarkers", message: `Accepted marker count ${metrics.acceptedMarkers} is below ${thresholds.minMarkers} (${coverageSeverity}).` });
  if (metrics.acceptedCharucoCorners < thresholds.minCharucoCorners) warnings.push({ code: "l78.roundtrip.minCharucoCorners", message: `Accepted ChArUco corner count ${metrics.acceptedCharucoCorners} is below ${thresholds.minCharucoCorners} (${coverageSeverity}).` });
  if (metrics.coverageScore < thresholds.minCoverage) warnings.push({ code: "l78.roundtrip.minCoverage", message: `Coverage score ${metrics.coverageScore.toPrecision(4)} is below ${thresholds.minCoverage}.` });
  if (metrics.meanConfidence < thresholds.minMeanConfidence) warnings.push({ code: "l78.roundtrip.lowMeanConfidence", message: `Mean confidence ${metrics.meanConfidence.toPrecision(4)} is below ${thresholds.minMeanConfidence}.` });
  return warnings;
}

function fitStepWarnings(metrics: L78DetectorRoundTripMetrics, thresholds: L78DetectorRoundTripThresholds): SolverWarning[] {
  const warnings: SolverWarning[] = [];
  if (metrics.fitRmsPx === null) warnings.push({ code: "l78.roundtrip.fitNotRun", message: "Geometry fit has not been run for this detector round trip." });
  else if (metrics.fitRmsPx > thresholds.maxFitRmsPx) warnings.push({ code: "l78.roundtrip.fitRmsExceeded", message: `Fit RMS ${metrics.fitRmsPx.toPrecision(4)} px exceeds ${thresholds.maxFitRmsPx} px.` });
  if (metrics.fitMaxResidualPx === null) warnings.push({ code: "l78.roundtrip.fitMaxResidualMissing", message: "Geometry fit max residual is not available." });
  else if (metrics.fitMaxResidualPx > thresholds.maxFitMaxResidualPx) warnings.push({ code: "l78.roundtrip.fitMaxResidualExceeded", message: `Fit max residual ${metrics.fitMaxResidualPx.toPrecision(4)} px exceeds ${thresholds.maxFitMaxResidualPx} px.` });
  return warnings;
}

function step(id: L78DetectorRoundTripStepId, label: string, status: L78RoundTripStatus, requiredFile: string, hash: string | null, warnings: SolverWarning[], nextAction: string): L78DetectorRoundTripStep {
  return { id, label, status, requiredFile, hash, warnings, nextAction };
}

function statusFromWarnings(warnings: SolverWarning[], hasRun: boolean, allowWarningOnly: boolean): L78RoundTripStatus {
  if (!hasRun) return "not-started";
  if (!warnings.length) return "pass";
  return allowWarningOnly ? "warning" : warnings.some((warning) => warning.code.includes("Mismatch") || warning.code.includes("Exceeded")) ? "fail" : "warning";
}

function sessionStatus(sessionQa: L74SessionQaResult | null): L78RoundTripStatus {
  if (!sessionQa) return "not-started";
  if (sessionQa.status === "fail") return "fail";
  if (sessionQa.status === "warning") return "warning";
  return "pass";
}

function aggregateStatus(steps: L78DetectorRoundTripStep[], warnings: SolverWarning[]): "pass" | "warning" | "fail" {
  if (steps.some((item) => item.status === "fail")) return "fail";
  if (steps.some((item) => item.status === "warning") || warnings.length) return "warning";
  return "pass";
}

function detectorReceiptStatus(importResult: L76ExternalDetectorImportResult | null, board: L78DetectorRoundTripMetrics["boardHashStatus"], image: L78DetectorRoundTripMetrics["imageHashStatus"]): "pass" | "warning" | "fail" {
  if (!importResult) return "fail";
  if (board === "mismatch" || image === "mismatch" || board === "missing" || image === "missing") return "fail";
  if (board === "not-compared" || image === "not-compared" || importResult.warnings.length) return "warning";
  return "pass";
}

function receiptHashStatus(hash: string | undefined, matched: boolean | null | undefined): L78DetectorRoundTripMetrics["boardHashStatus"] {
  if (!hash) return "missing";
  if (matched === true) return "match";
  if (matched === false) return "mismatch";
  return "not-compared";
}

function dedupeWarnings(warnings: SolverWarning[]): SolverWarning[] {
  const seen = new Set<string>();
  const out: SolverWarning[] = [];
  for (const warning of warnings) {
    const key = `${warning.code}:${warning.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(warning);
  }
  return out;
}

function stringParameter(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return typeof value === "string" ? value : JSON.stringify(value);
}

function formatMaybe(value: number | null): string {
  return value === null || !Number.isFinite(value) ? "n/a" : value.toPrecision(4);
}

function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

function resultForHash<T extends Record<string, unknown>>(value: T): Omit<T, "resultHash"> {
  const copy = { ...value };
  delete (copy as Partial<T> & { resultHash?: unknown }).resultHash;
  return copy;
}

function finite(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) ? value as number : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function round(value: number): number {
  return Number(value.toPrecision(12));
}
