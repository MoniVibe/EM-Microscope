import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import {
  applyFiducialManualEdits,
  fitFiducialBoardDetection,
  generateFiducialBoard,
  generateSyntheticFiducialDetection,
  matchFiducialBoardDetection,
  parseFiducialDetectionJson,
  type L75FiducialBoard,
  type L75FiducialDetectionBundle,
  type L75FiducialFitResult,
  type L75FiducialManualEdit,
  type L75FiducialMatchResult,
  type L75PixelPoint
} from "./fiducialBoard";
import type { L72FitModel } from "./geometricCalibration";

export type L76ExternalDetectorFormat = "json" | "csv";

export const l77ExternalDetectorAppVersion = "L7.7 External Detector Runner Pack / Real Detector Bridge" as const;

export type L76ExternalDetectorReceipt = {
  name: string;
  version: string;
  runnerHash?: string;
  parameters: Record<string, unknown>;
};

export type L76DetectorImageReceipt = {
  sourceName: string;
  imageHash: string;
  widthPx: number;
  heightPx: number;
  expectedImageHash?: string;
  hashMatchesExpected: boolean | null;
};

export type L76DetectorBoardReceipt = {
  boardId: string;
  boardHash: string;
  expectedBoardHash?: string;
  hashMatchesExpected: boolean | null;
};

export type L76DetectorReceipt = {
  schema: "emmicro.l76.detectorReceipt.v1";
  detector: L76ExternalDetectorReceipt;
  image: L76DetectorImageReceipt;
  board: L76DetectorBoardReceipt;
  sourceFormat: L76ExternalDetectorFormat;
  sourceTextHash: string;
  detectionHash: string;
  warningCodes: string[];
  resultHash: string;
};

export type L76ExternalDetectorImportResult = {
  schema: "emmicro.l76.externalDetectorImport.v1";
  appVersion: typeof l77ExternalDetectorAppVersion;
  id: string;
  label: string;
  sourceFormat: L76ExternalDetectorFormat;
  detector: L76ExternalDetectorReceipt;
  image: L76DetectorImageReceipt;
  board: L76DetectorBoardReceipt;
  detection: L75FiducialDetectionBundle;
  match: L75FiducialMatchResult | null;
  receipt: L76DetectorReceipt;
  warnings: SolverWarning[];
  limitations: string[];
  resultHash: string;
};

export type L76ExternalDetectorImportOptions = {
  id?: string;
  label?: string;
  board?: L75FiducialBoard;
  expectedBoardHash?: string;
  expectedImageHash?: string;
  minConfidence?: number;
};

export type L76ExternalDetectorCsvOptions = L76ExternalDetectorImportOptions & {
  detector?: Partial<L76ExternalDetectorReceipt>;
  image?: Partial<Omit<L76DetectorImageReceipt, "hashMatchesExpected">>;
  boardReceipt?: Partial<Omit<L76DetectorBoardReceipt, "hashMatchesExpected">>;
  frameId?: string;
};

export type L76DetectorComparisonInput = L76ExternalDetectorImportResult | L75FiducialDetectionBundle;

export type L76DetectorComparisonRow = {
  kind: "marker" | "charuco";
  id: number;
  cornerIndex: number | null;
  aXPx: number | null;
  aYPx: number | null;
  bXPx: number | null;
  bYPx: number | null;
  deltaPx: number | null;
  status: "matched" | "missing-in-a" | "missing-in-b";
};

export type L76DetectorComparisonResult = {
  schema: "emmicro.l76.detectorComparison.v1";
  appVersion: typeof l77ExternalDetectorAppVersion;
  id: string;
  label: string;
  comparisonKind: "synthetic-vs-imported" | "imported-vs-imported" | "manual-corrected-vs-raw";
  a: {
    label: string;
    detectionHash: string;
    detectorName?: string;
  };
  b: {
    label: string;
    detectionHash: string;
    detectorName?: string;
  };
  matchedMarkerIds: number[];
  matchedCharucoCornerIds: number[];
  missingMarkerIdsInA: number[];
  missingMarkerIdsInB: number[];
  extraMarkerIdsInA: number[];
  extraMarkerIdsInB: number[];
  missingCharucoCornerIdsInA: number[];
  missingCharucoCornerIdsInB: number[];
  meanCornerDeltaPx: number | null;
  maxCornerDeltaPx: number | null;
  meanCharucoDeltaPx: number | null;
  maxCharucoDeltaPx: number | null;
  coverageDelta: number | null;
  fitRmsDeltaPx: number | null;
  fitA: L75FiducialFitResult | null;
  fitB: L75FiducialFitResult | null;
  rows: L76DetectorComparisonRow[];
  warnings: SolverWarning[];
  limitations: string[];
  resultHash: string;
};

type CanonicalDetectorJson = {
  version?: unknown;
  detector?: {
    name?: unknown;
    version?: unknown;
    runnerHash?: unknown;
    parameters?: unknown;
  };
  image?: {
    sourceName?: unknown;
    imageHash?: unknown;
    width?: unknown;
    height?: unknown;
  };
  board?: {
    boardId?: unknown;
    boardHash?: unknown;
  };
  detections?: {
    markers?: Array<{
      id?: unknown;
      cornersPx?: unknown;
      confidence?: unknown;
    }>;
    charucoCorners?: Array<{
      id?: unknown;
      xPx?: unknown;
      yPx?: unknown;
      confidence?: unknown;
    }>;
  };
  warnings?: unknown;
};

export const l76ExternalDetectorLimitations = [
  "L7.7 external detector runner pack imports, validates, receipts, compares, and hands off detector outputs from optional external tooling only; it does not run browser-native OpenCV.js or AprilTag decoding.",
  "The bridge is diagnostic evidence plumbing over L7.5 fiducial matching, L7.2 geometry fits, and L7.4 session QA; it is not certified camera calibration, lab-accredited metrology, or an OpenCV-equivalent browser detector.",
  "The workflow does not implement full 3D pose calibration, stereo calibration, hardware camera control, digital twin calibration, manufacturing certification, or full 3D Maxwell/FDTD/FEM/BEM/RCWA/CAD execution."
] as const;

export function parseExternalDetectorJson(text: string, options: L76ExternalDetectorImportOptions = {}): L76ExternalDetectorImportResult {
  const parsed = JSON.parse(text) as CanonicalDetectorJson;
  if (parsed.version !== "emmicro.detector.v1") throw new Error("external detector JSON requires version 'emmicro.detector.v1'");
  const detector = detectorReceipt(parsed.detector);
  const image = imageReceipt(parsed.image, options);
  const board = boardReceipt(parsed.board, options);
  const detections = parsed.detections;
  if (!detections || typeof detections !== "object") throw new Error("external detector JSON requires detections");
  const markers = normalizeMarkers(detections.markers ?? [], image, options.minConfidence);
  const charucoCorners = normalizeCharucoCorners(detections.charucoCorners ?? [], image, options.minConfidence);
  const warnings = normalizeProvidedWarnings(parsed.warnings);
  warnings.push(...validateAgainstReceipts({ board: options.board, boardReceipt: board, image, markers, charucoCorners, minConfidence: options.minConfidence }));
  return createExternalDetectorImport({
    sourceFormat: "json",
    sourceText: text,
    id: options.id,
    label: options.label ?? "L7.7 external detector JSON import",
    detector,
    image,
    board,
    frameId: image.sourceName,
    markers,
    charucoCorners,
    warnings,
    boardModel: options.board
  });
}

export function parseExternalDetectorMarkerCsv(text: string, options: L76ExternalDetectorCsvOptions = {}): L76ExternalDetectorImportResult {
  const rows = parseCsvRows(text);
  if (rows.length < 2) throw new Error("external detector CSV is empty");
  const headers = rows[0]!.map(normalizeHeader);
  for (const column of ["marker_id", "corner_index", "x_px", "y_px"]) {
    if (!headers.includes(column)) throw new Error(`external detector CSV missing required column: ${column}`);
  }
  const columnIndex = (names: string[]): number => {
    for (const name of names) {
      const found = headers.indexOf(name);
      if (found >= 0) return found;
    }
    return -1;
  };
  const markerIndex = columnIndex(["marker_id", "markerid", "id"]);
  const cornerIndex = columnIndex(["corner_index", "corner"]);
  const xIndex = columnIndex(["x_px", "x"]);
  const yIndex = columnIndex(["y_px", "y"]);
  const frameIndex = columnIndex(["frame_id", "frameid"]);
  const confidenceIndex = columnIndex(["confidence", "score"]);
  const detectorNameIndex = columnIndex(["detector_name"]);
  const detectorVersionIndex = columnIndex(["detector_version"]);
  const boardIdIndex = columnIndex(["board_id"]);
  const boardHashIndex = columnIndex(["board_hash"]);
  const imageHashIndex = columnIndex(["image_hash"]);
  const imageWidthIndex = columnIndex(["image_width", "width", "width_px"]);
  const imageHeightIndex = columnIndex(["image_height", "height", "height_px"]);
  let frameId = options.frameId ?? "";
  let detectorName = options.detector?.name ?? "";
  let detectorVersion = options.detector?.version ?? "";
  let boardId = options.boardReceipt?.boardId ?? options.board?.id ?? "";
  let nextBoardHash = options.boardReceipt?.boardHash ?? "";
  let imageHash = options.image?.imageHash ?? "";
  let widthPx = options.image?.widthPx ?? options.board?.image.widthPx ?? 0;
  let heightPx = options.image?.heightPx ?? options.board?.image.heightPx ?? 0;
  const sourceName = options.image?.sourceName ?? options.frameId ?? "";
  const warnings: SolverWarning[] = [];
  const byMarker = new Map<number, Array<L75PixelPoint | null>>();
  const confidences = new Map<number, number>();
  const seenCorners = new Set<string>();
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex]!;
    if (!row.some((cell) => cell.trim())) continue;
    const nextFrameId = optionalString(row[frameIndex]) ?? (sourceName || "frame_001");
    if (!frameId) frameId = nextFrameId;
    if (frameId !== nextFrameId) throw new Error("external detector CSV must contain one frame_id per import");
    detectorName = stableOptionalString(detectorName, row[detectorNameIndex], "detector_name", rowIndex + 1);
    detectorVersion = stableOptionalString(detectorVersion, row[detectorVersionIndex], "detector_version", rowIndex + 1);
    boardId = stableOptionalString(boardId, row[boardIdIndex], "board_id", rowIndex + 1);
    nextBoardHash = stableOptionalString(nextBoardHash, row[boardHashIndex], "board_hash", rowIndex + 1);
    imageHash = stableOptionalString(imageHash, row[imageHashIndex], "image_hash", rowIndex + 1);
    widthPx = widthPx || optionalPositiveInteger(row[imageWidthIndex]) || 0;
    heightPx = heightPx || optionalPositiveInteger(row[imageHeightIndex]) || 0;
    const markerId = requiredInteger(row[markerIndex], `marker_id row ${rowIndex + 1}`);
    const corner = integerInRange(requiredInteger(row[cornerIndex], `corner_index row ${rowIndex + 1}`), 0, 3);
    const key = `${markerId}:${corner}`;
    if (seenCorners.has(key)) throw new Error(`external detector CSV duplicate marker/corner pair: ${key}`);
    seenCorners.add(key);
    const current = byMarker.get(markerId) ?? [null, null, null, null];
    current[corner] = {
      xPx: requiredNumber(row[xIndex], `x_px row ${rowIndex + 1}`),
      yPx: requiredNumber(row[yIndex], `y_px row ${rowIndex + 1}`)
    };
    byMarker.set(markerId, current);
    const confidence = optionalNumber(row[confidenceIndex]);
    if (confidence !== null) confidences.set(markerId, confidence);
  }
  if (!detectorName || !detectorVersion) throw new Error("external detector CSV requires detector_name and detector_version receipt columns or options");
  if (!boardId || !nextBoardHash) throw new Error("external detector CSV requires board_id and board_hash receipt columns or options");
  if (!imageHash) throw new Error("external detector CSV requires image_hash receipt column or options");
  if (!widthPx || !heightPx) throw new Error("external detector CSV requires image width/height via columns or options");
  const image = finalizeImageReceipt(
    {
      sourceName: sourceName || frameId || "frame_001",
      imageHash,
      widthPx,
      heightPx
    },
    options
  );
  const board = finalizeBoardReceipt({ boardId, boardHash: nextBoardHash }, options);
  const markers = [...byMarker.entries()].map(([id, corners]) => {
    if (corners.some((corner) => corner === null)) throw new Error(`external detector CSV marker ${id} does not have all four corners`);
    const tuple = corners as [L75PixelPoint, L75PixelPoint, L75PixelPoint, L75PixelPoint];
    validateCornerOrder(tuple, `marker ${id}`);
    return { id, cornersPx: tuple, confidence: confidences.get(id) ?? 1 };
  });
  warnings.push(...validateAgainstReceipts({ board: options.board, boardReceipt: board, image, markers, charucoCorners: [], minConfidence: options.minConfidence }));
  return createExternalDetectorImport({
    sourceFormat: "csv",
    sourceText: text,
    id: options.id,
    label: options.label ?? "L7.7 external detector CSV import",
    detector: { name: detectorName, version: detectorVersion, runnerHash: options.detector?.runnerHash, parameters: options.detector?.parameters ?? {} },
    image,
    board,
    frameId: frameId || image.sourceName,
    markers,
    charucoCorners: [],
    warnings,
    boardModel: options.board
  });
}

export function fitExternalDetectorImport(input: {
  id?: string;
  label?: string;
  importResult: L76ExternalDetectorImportResult;
  board: L75FiducialBoard;
  model?: L72FitModel;
}): L75FiducialFitResult {
  return fitFiducialBoardDetection({
    id: input.id ?? "l76-external-detector-fit",
    label: input.label ?? "L7.7 external detector L7.2 geometry handoff",
    board: input.board,
    detection: input.importResult.detection,
    model: input.model
  });
}

export function applyExternalDetectorManualEdits(input: {
  importResult: L76ExternalDetectorImportResult;
  edits: L75FiducialManualEdit[];
  board?: L75FiducialBoard;
  id?: string;
  label?: string;
}): L76ExternalDetectorImportResult {
  const detection = applyFiducialManualEdits(input.importResult.detection, input.edits);
  const warnings = [
    ...input.importResult.warnings,
    { code: "l76.detector.manualReviewApplied", message: `${input.edits.length} L7.5 manual fiducial review edit(s) were applied to the imported detector output.` }
  ];
  return finalizeExternalDetectorImport({
    id: input.id ?? `${input.importResult.id}-manual-review`,
    label: input.label ?? `${input.importResult.label} with L7.5 manual review`,
    sourceFormat: input.importResult.sourceFormat,
    detector: input.importResult.detector,
    image: input.importResult.image,
    board: input.importResult.board,
    detection: withDetectionWarnings(detection, warnings),
    boardModel: input.board,
    warnings,
    sourceTextHash: input.importResult.receipt.sourceTextHash
  });
}

export function compareExternalDetectors(input: {
  id?: string;
  label?: string;
  comparisonKind?: L76DetectorComparisonResult["comparisonKind"];
  board?: L75FiducialBoard;
  model?: L72FitModel;
  a: L76DetectorComparisonInput;
  b: L76DetectorComparisonInput;
}): L76DetectorComparisonResult {
  const a = normalizeComparisonInput(input.a);
  const b = normalizeComparisonInput(input.b);
  const aMarkers = acceptedMarkerMap(a.detection);
  const bMarkers = acceptedMarkerMap(b.detection);
  const aCharuco = acceptedCharucoMap(a.detection);
  const bCharuco = acceptedCharucoMap(b.detection);
  const markerIds = sortedUnion([...aMarkers.keys()], [...bMarkers.keys()]);
  const charucoIds = sortedUnion([...aCharuco.keys()], [...bCharuco.keys()]);
  const rows: L76DetectorComparisonRow[] = [];
  const cornerDeltas: number[] = [];
  const charucoDeltas: number[] = [];
  const matchedMarkerIds: number[] = [];
  const matchedCharucoCornerIds: number[] = [];
  const missingMarkerIdsInA: number[] = [];
  const missingMarkerIdsInB: number[] = [];
  const missingCharucoCornerIdsInA: number[] = [];
  const missingCharucoCornerIdsInB: number[] = [];
  for (const id of markerIds) {
    const markerA = aMarkers.get(id);
    const markerB = bMarkers.get(id);
    if (markerA && markerB) {
      matchedMarkerIds.push(id);
      for (let cornerIndex = 0; cornerIndex < 4; cornerIndex += 1) {
        const pointA = markerA.cornersPx[cornerIndex]!;
        const pointB = markerB.cornersPx[cornerIndex]!;
        const delta = distancePx(pointA, pointB);
        cornerDeltas.push(delta);
        rows.push({ kind: "marker", id, cornerIndex, aXPx: pointA.xPx, aYPx: pointA.yPx, bXPx: pointB.xPx, bYPx: pointB.yPx, deltaPx: round(delta), status: "matched" });
      }
    } else if (markerA) {
      missingMarkerIdsInB.push(id);
      for (let cornerIndex = 0; cornerIndex < 4; cornerIndex += 1) {
        const pointA = markerA.cornersPx[cornerIndex]!;
        rows.push({ kind: "marker", id, cornerIndex, aXPx: pointA.xPx, aYPx: pointA.yPx, bXPx: null, bYPx: null, deltaPx: null, status: "missing-in-b" });
      }
    } else if (markerB) {
      missingMarkerIdsInA.push(id);
      for (let cornerIndex = 0; cornerIndex < 4; cornerIndex += 1) {
        const pointB = markerB.cornersPx[cornerIndex]!;
        rows.push({ kind: "marker", id, cornerIndex, aXPx: null, aYPx: null, bXPx: pointB.xPx, bYPx: pointB.yPx, deltaPx: null, status: "missing-in-a" });
      }
    }
  }
  for (const id of charucoIds) {
    const cornerA = aCharuco.get(id);
    const cornerB = bCharuco.get(id);
    if (cornerA && cornerB) {
      matchedCharucoCornerIds.push(id);
      const delta = distancePx(cornerA, cornerB);
      charucoDeltas.push(delta);
      rows.push({ kind: "charuco", id, cornerIndex: null, aXPx: cornerA.xPx, aYPx: cornerA.yPx, bXPx: cornerB.xPx, bYPx: cornerB.yPx, deltaPx: round(delta), status: "matched" });
    } else if (cornerA) {
      missingCharucoCornerIdsInB.push(id);
      rows.push({ kind: "charuco", id, cornerIndex: null, aXPx: cornerA.xPx, aYPx: cornerA.yPx, bXPx: null, bYPx: null, deltaPx: null, status: "missing-in-b" });
    } else if (cornerB) {
      missingCharucoCornerIdsInA.push(id);
      rows.push({ kind: "charuco", id, cornerIndex: null, aXPx: null, aYPx: null, bXPx: cornerB.xPx, bYPx: cornerB.yPx, deltaPx: null, status: "missing-in-a" });
    }
  }
  const fitA = input.board ? fitFiducialBoardDetection({ id: `${input.id ?? "l76-detector-comparison"}-a-fit`, label: `${a.label} fit`, board: input.board, detection: a.detection, model: input.model }) : null;
  const fitB = input.board ? fitFiducialBoardDetection({ id: `${input.id ?? "l76-detector-comparison"}-b-fit`, label: `${b.label} fit`, board: input.board, detection: b.detection, model: input.model }) : null;
  const matchA = input.board ? matchFiducialBoardDetection({ id: `${input.id ?? "l76-detector-comparison"}-a-match`, board: input.board, detection: a.detection }) : null;
  const matchB = input.board ? matchFiducialBoardDetection({ id: `${input.id ?? "l76-detector-comparison"}-b-match`, board: input.board, detection: b.detection }) : null;
  const warnings: SolverWarning[] = [];
  if (matchedMarkerIds.length === 0 && matchedCharucoCornerIds.length === 0) warnings.push({ code: "l76.comparison.noOverlap", message: "Detector comparison has no overlapping accepted marker IDs or ChArUco-style corner IDs." });
  if (missingMarkerIdsInA.length || missingMarkerIdsInB.length) warnings.push({ code: "l76.comparison.markerCoverageDelta", message: "Detector comparison has marker IDs present in one detection set but missing in the other." });
  const partial = {
    schema: "emmicro.l76.detectorComparison.v1" as const,
    appVersion: l77ExternalDetectorAppVersion,
    id: input.id ?? "l76-detector-comparison",
    label: input.label ?? "L7.7 external detector comparison",
    comparisonKind: input.comparisonKind ?? "synthetic-vs-imported",
    a: { label: a.label, detectionHash: a.detection.resultHash, detectorName: a.detectorName },
    b: { label: b.label, detectionHash: b.detection.resultHash, detectorName: b.detectorName },
    matchedMarkerIds,
    matchedCharucoCornerIds,
    missingMarkerIdsInA,
    missingMarkerIdsInB,
    extraMarkerIdsInA: missingMarkerIdsInB,
    extraMarkerIdsInB: missingMarkerIdsInA,
    missingCharucoCornerIdsInA,
    missingCharucoCornerIdsInB,
    meanCornerDeltaPx: meanOrNull(cornerDeltas),
    maxCornerDeltaPx: maxOrNull(cornerDeltas),
    meanCharucoDeltaPx: meanOrNull(charucoDeltas),
    maxCharucoDeltaPx: maxOrNull(charucoDeltas),
    coverageDelta: matchA && matchB ? round(matchA.coverageScore - matchB.coverageScore) : null,
    fitRmsDeltaPx: fitA?.fit && fitB?.fit ? round(fitA.fit.metrics.rmsResidualPx - fitB.fit.metrics.rmsResidualPx) : null,
    fitA,
    fitB,
    rows,
    warnings,
    limitations: [...l76ExternalDetectorLimitations]
  };
  return { ...partial, resultHash: fnv1a64(stableStringify(resultForHash(partial))) };
}

export function detectorBridgeReportJson(importResult: L76ExternalDetectorImportResult, comparison?: L76DetectorComparisonResult, fit?: L75FiducialFitResult): string {
  return JSON.stringify({
    runnerPack: {
      version: l77ExternalDetectorAppVersion,
      optionalExternalTooling: true,
      browserNativeOpenCvJsDetector: false,
      aprilTagDecoder: false
    },
    importResult,
    comparison,
    fit
  }, null, 2);
}

export function detectorBridgeReportMarkdown(importResult: L76ExternalDetectorImportResult, comparison?: L76DetectorComparisonResult, fit?: L75FiducialFitResult): string {
  const dictionary = detectorParameter(importResult.detector.parameters, "dictionary") ?? "not supplied";
  const parameters = detectorParametersSummary(importResult.detector.parameters);
  return [
    `# ${importResult.label}`,
    "",
    `App version: ${importResult.appVersion}`,
    `Import hash: ${importResult.resultHash}`,
    `Detection hash: ${importResult.detection.resultHash}`,
    `Receipt hash: ${importResult.receipt.resultHash}`,
    "",
    "## Detector Receipt",
    `- Detector: ${importResult.detector.name} ${importResult.detector.version}`,
    `- Runner hash: ${importResult.detector.runnerHash ?? "not supplied"}`,
    `- Dictionary: ${dictionary}`,
    `- Parameters: ${parameters}`,
    `- Image: ${importResult.image.sourceName} (${importResult.image.widthPx} x ${importResult.image.heightPx})`,
    `- Image hash: ${importResult.image.imageHash}`,
    `- Image hash status: ${hashStatus(importResult.image.hashMatchesExpected)}`,
    `- Board: ${importResult.board.boardId}`,
    `- Board hash: ${importResult.board.boardHash}`,
    `- Board hash status: ${hashStatus(importResult.board.hashMatchesExpected)}`,
    "",
    "## Imported Detections",
    `- Markers: ${importResult.detection.markers.length}`,
    `- ChArUco-style corners: ${importResult.detection.charucoCorners.length}`,
    `- Manual edits: ${importResult.detection.manualEdits.length}`,
    importResult.match ? `- Matched points: ${importResult.match.matchedPointCount}` : "- Matched points: not run",
    fit ? `- Fit status: ${fit.status.toUpperCase()}` : "- Fit status: not run",
    fit?.fit ? `- Fit RMS residual: ${fit.fit.metrics.rmsResidualPx.toPrecision(4)} px` : "- Fit RMS residual: n/a",
    "",
    "## Detector Comparison",
    ...(comparison ? [
      `- Comparison hash: ${comparison.resultHash}`,
      `- Matched marker IDs: ${comparison.matchedMarkerIds.length}`,
      `- Mean corner delta: ${formatMaybe(comparison.meanCornerDeltaPx)} px`,
      `- Max corner delta: ${formatMaybe(comparison.maxCornerDeltaPx)} px`,
      `- Coverage delta: ${formatMaybe(comparison.coverageDelta)}`
    ] : ["- not run"]),
    "",
    "## Warnings",
    ...(importResult.warnings.length ? importResult.warnings.map((warning) => `- ${warning.message}`) : ["- none"]),
    "",
    "## Exports",
    "- detector_bridge_report.md",
    "- detector_bridge_report.json",
    "- imported_detections.csv",
    "- detector_comparison.csv",
    "",
    "## Boundary",
    ...importResult.limitations.map((limitation) => `- ${limitation}`),
    "- browser-native OpenCV.js/ArUco detector execution is not implemented.",
    "- AprilTag decoding is not implemented."
  ].join("\n");
}

export function importedDetectionsCsv(importResult: L76ExternalDetectorImportResult): string {
  return [
    "kind,id,corner_index,x_px,y_px,confidence,status,source,detector_name,detector_version,board_id,board_hash,image_hash",
    ...importResult.detection.markers.flatMap((marker) => marker.cornersPx.map((corner, index) => [
      "marker",
      marker.id,
      index,
      corner.xPx,
      corner.yPx,
      marker.confidence,
      marker.status,
      marker.source,
      importResult.detector.name,
      importResult.detector.version,
      importResult.board.boardId,
      importResult.board.boardHash,
      importResult.image.imageHash
    ].map(csvEscape).join(","))),
    ...importResult.detection.charucoCorners.map((corner) => [
      "charuco",
      corner.id,
      "",
      corner.xPx,
      corner.yPx,
      corner.confidence,
      corner.status,
      corner.source,
      importResult.detector.name,
      importResult.detector.version,
      importResult.board.boardId,
      importResult.board.boardHash,
      importResult.image.imageHash
    ].map(csvEscape).join(","))
  ].join("\n");
}

export function detectorComparisonCsv(result: L76DetectorComparisonResult): string {
  return [
    "kind,id,corner_index,a_x_px,a_y_px,b_x_px,b_y_px,delta_px,status",
    ...result.rows.map((row) => [row.kind, row.id, row.cornerIndex ?? "", row.aXPx ?? "", row.aYPx ?? "", row.bXPx ?? "", row.bYPx ?? "", row.deltaPx ?? "", row.status].map(csvEscape).join(","))
  ].join("\n");
}

export function externalDetectorBoardInstructionsMarkdown(board: L75FiducialBoard): string {
  return [
    "# EMMicro L7.7 External Detector Runner Pack",
    "",
    "Use `board_manifest.json` as the board receipt and write detector results as canonical `emmicro.detector.v1` JSON or marker-corner CSV.",
    "The browser app imports detector outputs; optional Python/OpenCV helpers live outside the web runtime in `tools/detectors/`.",
    "",
    "Required CSV columns: `marker_id,corner_index,x_px,y_px`.",
    "Recommended receipt columns: `frame_id,confidence,detector_name,detector_version,board_id,board_hash,image_hash,image_width,image_height`.",
    "",
    "Optional helper commands:",
    "- `python tools/detectors/opencv_charuco_generate.py --squares-x 7 --squares-y 5 --square-length-mm 10 --marker-length-mm 6 --dictionary DICT_4X4_50 --out-board-png charuco_board.png --out-manifest charuco_board_manifest.json`",
    "- `python tools/detectors/opencv_charuco_detect.py --image frame_001.png --board-manifest charuco_board_manifest.json --dictionary DICT_4X4_50 --out-json frame_001_detection.json --out-csv frame_001_marker_corners.csv --out-overlay frame_001_detection_overlay.png`",
    "",
    `Board ID: ${board.id}`,
    `Board hash: ${board.resultHash}`,
    `Board image hash: ${board.image.imageHash}`,
    "",
    "The browser app imports and validates external detector output, but browser-native OpenCV.js/ArUco detector execution is not implemented and AprilTag decoding is not implemented."
  ].join("\n");
}

export function exampleExternalDetectorJson(board: L75FiducialBoard = generateFiducialBoard()): string {
  const detection = exampleDetectionForBoard(board);
  return JSON.stringify(
    {
      version: "emmicro.detector.v1",
      detector: {
        name: "opencv-charuco",
        version: "l77-fixture",
        runnerHash: "example-runner-fnv1a64",
        parameters: {
          dictionary: "DICT_4X4_50",
          cornerRefinement: true,
          source: "tools/detectors/examples/charuco_detection.json"
        }
      },
      image: {
        sourceName: detection.frameId,
        imageHash: board.image.imageHash,
        width: board.image.widthPx,
        height: board.image.heightPx
      },
      board: {
        boardId: board.id,
        boardHash: board.resultHash
      },
      detections: {
        markers: detection.markers.slice(0, 6).map((marker) => ({
          id: marker.id,
          cornersPx: marker.cornersPx.map((corner) => [corner.xPx, corner.yPx]),
          confidence: marker.confidence
        })),
        charucoCorners: detection.charucoCorners.slice(0, 10).map((corner) => ({
          id: corner.id,
          xPx: corner.xPx,
          yPx: corner.yPx,
          confidence: corner.confidence
        }))
      },
      warnings: []
    },
    null,
    2
  );
}

export function exampleExternalDetectorMarkerCsv(board: L75FiducialBoard = generateFiducialBoard()): string {
  const detection = exampleDetectionForBoard(board);
  const rows = [
    "frame_id,marker_id,corner_index,x_px,y_px,confidence,detector_name,detector_version,board_id,board_hash,image_hash,image_width,image_height"
  ];
  for (const marker of detection.markers.slice(0, 4)) {
    for (let cornerIndex = 0; cornerIndex < 4; cornerIndex += 1) {
      const corner = marker.cornersPx[cornerIndex]!;
      rows.push([
        detection.frameId,
        marker.id,
        cornerIndex,
        corner.xPx,
        corner.yPx,
        marker.confidence,
        "opencv-charuco",
        "l77-fixture",
        board.id,
        board.resultHash,
        board.image.imageHash,
        board.image.widthPx,
        board.image.heightPx
      ].map(csvEscape).join(","));
    }
  }
  return rows.join("\n");
}

function createExternalDetectorImport(input: {
  sourceFormat: L76ExternalDetectorFormat;
  sourceText: string;
  id?: string;
  label: string;
  detector: L76ExternalDetectorReceipt;
  image: L76DetectorImageReceipt;
  board: L76DetectorBoardReceipt;
  frameId: string;
  markers: Array<{ id: number; cornersPx: [L75PixelPoint, L75PixelPoint, L75PixelPoint, L75PixelPoint]; confidence: number }>;
  charucoCorners: Array<{ id: number; xPx: number; yPx: number; confidence: number }>;
  warnings: SolverWarning[];
  boardModel?: L75FiducialBoard;
}): L76ExternalDetectorImportResult {
  const detection = parseFiducialDetectionJson(JSON.stringify({
    frameId: input.frameId,
    boardId: input.board.boardId,
    markers: input.markers.map((marker) => ({
      id: marker.id,
      cornersPx: marker.cornersPx.map((corner) => [corner.xPx, corner.yPx]),
      confidence: marker.confidence
    })),
    charucoCorners: input.charucoCorners.map((corner) => ({
      id: corner.id,
      xPx: corner.xPx,
      yPx: corner.yPx,
      confidence: corner.confidence
    }))
  }), { id: "l76-external-detector-detection", label: "L7.7 imported external detector fiducial detections" });
  return finalizeExternalDetectorImport({
    id: input.id ?? "l76-external-detector-import",
    label: input.label,
    sourceFormat: input.sourceFormat,
    detector: input.detector,
    image: input.image,
    board: input.board,
    detection: withDetectionWarnings(detection, input.warnings),
    boardModel: input.boardModel,
    warnings: input.warnings,
    sourceTextHash: fnv1a64(stableStringify(input.sourceText))
  });
}

function finalizeExternalDetectorImport(input: {
  id: string;
  label: string;
  sourceFormat: L76ExternalDetectorFormat;
  detector: L76ExternalDetectorReceipt;
  image: L76DetectorImageReceipt;
  board: L76DetectorBoardReceipt;
  detection: L75FiducialDetectionBundle;
  boardModel?: L75FiducialBoard;
  warnings: SolverWarning[];
  sourceTextHash: string;
}): L76ExternalDetectorImportResult {
  const match = input.boardModel ? matchFiducialBoardDetection({ id: `${input.id}-match`, board: input.boardModel, detection: input.detection }) : null;
  const warnings = mergeWarnings(input.warnings, match?.warnings ?? []);
  const detection = withDetectionWarnings(input.detection, warnings);
  const receipt = detectorReceiptForImport({
    detector: input.detector,
    image: input.image,
    board: input.board,
    sourceFormat: input.sourceFormat,
    sourceTextHash: input.sourceTextHash,
    detectionHash: detection.resultHash,
    warnings
  });
  const partial = {
    schema: "emmicro.l76.externalDetectorImport.v1" as const,
    appVersion: l77ExternalDetectorAppVersion,
    id: input.id,
    label: input.label,
    sourceFormat: input.sourceFormat,
    detector: input.detector,
    image: input.image,
    board: input.board,
    detection,
    match,
    receipt,
    warnings,
    limitations: [...l76ExternalDetectorLimitations]
  };
  return { ...partial, resultHash: fnv1a64(stableStringify(resultForHash(partial))) };
}

function detectorReceiptForImport(input: {
  detector: L76ExternalDetectorReceipt;
  image: L76DetectorImageReceipt;
  board: L76DetectorBoardReceipt;
  sourceFormat: L76ExternalDetectorFormat;
  sourceTextHash: string;
  detectionHash: string;
  warnings: SolverWarning[];
}): L76DetectorReceipt {
  const partial = {
    schema: "emmicro.l76.detectorReceipt.v1" as const,
    detector: input.detector,
    image: input.image,
    board: input.board,
    sourceFormat: input.sourceFormat,
    sourceTextHash: input.sourceTextHash,
    detectionHash: input.detectionHash,
    warningCodes: input.warnings.map((warning) => warning.code).sort()
  };
  return { ...partial, resultHash: fnv1a64(stableStringify(partial)) };
}

function detectorReceipt(value: CanonicalDetectorJson["detector"]): L76ExternalDetectorReceipt {
  if (!value || typeof value !== "object") throw new Error("external detector JSON requires detector receipt");
  const name = requiredString(value.name, "detector.name");
  const version = requiredString(value.version, "detector.version");
  return {
    name,
    version,
    runnerHash: optionalString(value.runnerHash) ?? undefined,
    parameters: value.parameters && typeof value.parameters === "object" && !Array.isArray(value.parameters)
      ? value.parameters as Record<string, unknown>
      : {}
  };
}

function imageReceipt(value: CanonicalDetectorJson["image"], options: L76ExternalDetectorImportOptions): L76DetectorImageReceipt {
  if (!value || typeof value !== "object") throw new Error("external detector JSON requires image receipt");
  return finalizeImageReceipt({
    sourceName: requiredString(value.sourceName, "image.sourceName"),
    imageHash: requiredString(value.imageHash, "image.imageHash"),
    widthPx: integerInRange(requiredInteger(value.width, "image.width"), 1, 100000),
    heightPx: integerInRange(requiredInteger(value.height, "image.height"), 1, 100000)
  }, options);
}

function boardReceipt(value: CanonicalDetectorJson["board"], options: L76ExternalDetectorImportOptions): L76DetectorBoardReceipt {
  if (!value || typeof value !== "object") throw new Error("external detector JSON requires board receipt");
  return finalizeBoardReceipt({
    boardId: requiredString(value.boardId, "board.boardId"),
    boardHash: requiredString(value.boardHash, "board.boardHash")
  }, options);
}

function finalizeImageReceipt(input: Omit<L76DetectorImageReceipt, "hashMatchesExpected">, options: L76ExternalDetectorImportOptions): L76DetectorImageReceipt {
  const expectedImageHash = options.expectedImageHash;
  return {
    ...input,
    expectedImageHash,
    hashMatchesExpected: expectedImageHash ? input.imageHash === expectedImageHash : null
  };
}

function finalizeBoardReceipt(input: Omit<L76DetectorBoardReceipt, "hashMatchesExpected">, options: L76ExternalDetectorImportOptions): L76DetectorBoardReceipt {
  const expectedBoardHash = options.expectedBoardHash ?? options.board?.resultHash;
  return {
    ...input,
    expectedBoardHash,
    hashMatchesExpected: expectedBoardHash ? input.boardHash === expectedBoardHash : null
  };
}

function normalizeMarkers(markers: NonNullable<CanonicalDetectorJson["detections"]>["markers"], image: L76DetectorImageReceipt, minConfidence = 0): Array<{ id: number; cornersPx: [L75PixelPoint, L75PixelPoint, L75PixelPoint, L75PixelPoint]; confidence: number }> {
  if (!Array.isArray(markers)) throw new Error("external detector JSON detections.markers must be an array");
  const seen = new Set<number>();
  return markers.map((marker, index) => {
    const id = requiredInteger(marker.id, `detections.markers[${index}].id`);
    if (seen.has(id)) throw new Error(`external detector JSON duplicate marker id: ${id}`);
    seen.add(id);
    if (!Array.isArray(marker.cornersPx) || marker.cornersPx.length !== 4) throw new Error(`external detector JSON marker ${id} requires four cornersPx entries`);
    const corners = marker.cornersPx.map((corner, cornerIndex) => {
      if (!Array.isArray(corner) || corner.length < 2) throw new Error(`external detector JSON marker ${id} corner ${cornerIndex} is invalid`);
      const point = {
        xPx: requiredNumber(corner[0], `marker ${id} corner ${cornerIndex} xPx`),
        yPx: requiredNumber(corner[1], `marker ${id} corner ${cornerIndex} yPx`)
      };
      validatePointInImage(point, image, `marker ${id} corner ${cornerIndex}`);
      return point;
    }) as [L75PixelPoint, L75PixelPoint, L75PixelPoint, L75PixelPoint];
    validateCornerOrder(corners, `marker ${id}`);
    return { id, cornersPx: corners, confidence: confidenceValue(marker.confidence, minConfidence) };
  });
}

function normalizeCharucoCorners(charucoCorners: NonNullable<CanonicalDetectorJson["detections"]>["charucoCorners"], image: L76DetectorImageReceipt, minConfidence = 0): Array<{ id: number; xPx: number; yPx: number; confidence: number }> {
  if (!Array.isArray(charucoCorners)) throw new Error("external detector JSON detections.charucoCorners must be an array");
  const seen = new Set<number>();
  return charucoCorners.map((corner, index) => {
    const id = requiredInteger(corner.id, `detections.charucoCorners[${index}].id`);
    if (seen.has(id)) throw new Error(`external detector JSON duplicate ChArUco corner id: ${id}`);
    seen.add(id);
    const point = {
      id,
      xPx: requiredNumber(corner.xPx, `charuco ${id} xPx`),
      yPx: requiredNumber(corner.yPx, `charuco ${id} yPx`),
      confidence: confidenceValue(corner.confidence, minConfidence)
    };
    validatePointInImage(point, image, `charuco ${id}`);
    return point;
  });
}

function validateAgainstReceipts(input: {
  board?: L75FiducialBoard;
  boardReceipt: L76DetectorBoardReceipt;
  image: L76DetectorImageReceipt;
  markers: Array<{ id: number; cornersPx: [L75PixelPoint, L75PixelPoint, L75PixelPoint, L75PixelPoint]; confidence: number }>;
  charucoCorners: Array<{ id: number; xPx: number; yPx: number; confidence: number }>;
  minConfidence?: number;
}): SolverWarning[] {
  const warnings: SolverWarning[] = [];
  if (input.boardReceipt.hashMatchesExpected === false) warnings.push({ code: "l76.detector.boardHashMismatch", message: "External detector board_hash does not match the active board manifest hash." });
  if (input.image.hashMatchesExpected === false) warnings.push({ code: "l76.detector.imageHashMismatch", message: "External detector image_hash does not match the expected image hash." });
  const minConfidence = input.minConfidence ?? 0.5;
  const lowMarker = input.markers.filter((marker) => marker.confidence < minConfidence).map((marker) => marker.id);
  const lowCharuco = input.charucoCorners.filter((corner) => corner.confidence < minConfidence).map((corner) => corner.id);
  if (lowMarker.length || lowCharuco.length) warnings.push({ code: "l76.detector.lowConfidence", message: `External detector output includes low-confidence IDs below ${minConfidence}: markers ${lowMarker.join(", ") || "none"}, ChArUco-style corners ${lowCharuco.join(", ") || "none"}.` });
  if (input.board) {
    const markerIds = new Set(input.board.markers.map((marker) => marker.id));
    const charucoIds = new Set(input.board.charucoCorners.map((corner) => corner.id));
    const unknownMarkers = input.markers.map((marker) => marker.id).filter((id) => !markerIds.has(id));
    const unknownCharuco = input.charucoCorners.map((corner) => corner.id).filter((id) => !charucoIds.has(id));
    if (unknownMarkers.length) warnings.push({ code: "l76.detector.unknownMarkerId", message: `External detector reported marker IDs not present on board ${input.board.id}: ${unknownMarkers.join(", ")}.` });
    if (unknownCharuco.length) warnings.push({ code: "l76.detector.unknownCharucoCornerId", message: `External detector reported ChArUco-style corner IDs not present on board ${input.board.id}: ${unknownCharuco.join(", ")}.` });
    if (input.markers.length < 3 && input.charucoCorners.length < 3) warnings.push({ code: "l76.detector.insufficientCoverage", message: "External detector output has too few marker/corner IDs for a stable L7.2 geometry handoff." });
  }
  return warnings;
}

function validatePointInImage(point: { xPx: number; yPx: number }, image: L76DetectorImageReceipt, label: string): void {
  if (point.xPx < 0 || point.xPx > image.widthPx || point.yPx < 0 || point.yPx > image.heightPx) {
    throw new Error(`external detector point out of image bounds: ${label}`);
  }
}

function validateCornerOrder(corners: [L75PixelPoint, L75PixelPoint, L75PixelPoint, L75PixelPoint], label: string): void {
  const area2 = signedPolygonArea2(corners);
  if (Math.abs(area2) < 1e-9) throw new Error(`external detector ${label} corners are degenerate`);
  if (area2 <= 0) throw new Error(`external detector ${label} corners must be ordered top-left, top-right, bottom-right, bottom-left in image coordinates`);
}

function withDetectionWarnings(detection: L75FiducialDetectionBundle, warnings: SolverWarning[]): L75FiducialDetectionBundle {
  const next = {
    ...detection,
    warnings: mergeWarnings(detection.warnings, warnings)
  };
  return { ...next, resultHash: fnv1a64(stableStringify(resultForHash(next))) };
}

function normalizeComparisonInput(input: L76DetectorComparisonInput): { detection: L75FiducialDetectionBundle; label: string; detectorName?: string } {
  if ("schema" in input && input.schema === "emmicro.l76.externalDetectorImport.v1") return { detection: input.detection, label: input.label, detectorName: input.detector.name };
  return { detection: input, label: input.label };
}

function acceptedMarkerMap(detection: L75FiducialDetectionBundle): Map<number, L75FiducialDetectionBundle["markers"][number]> {
  return new Map(detection.markers.filter((marker) => marker.status === "accepted").map((marker) => [marker.id, marker]));
}

function acceptedCharucoMap(detection: L75FiducialDetectionBundle): Map<number, L75FiducialDetectionBundle["charucoCorners"][number]> {
  return new Map(detection.charucoCorners.filter((corner) => corner.status === "accepted").map((corner) => [corner.id, corner]));
}

function exampleDetectionForBoard(board: L75FiducialBoard): L75FiducialDetectionBundle {
  const keep = new Set(board.markers.slice(0, 8).map((marker) => marker.id));
  return generateSyntheticFiducialDetection(board, {
    frameId: "frame_001.png",
    missingMarkerIds: board.markers.filter((marker) => !keep.has(marker.id)).map((marker) => marker.id),
    includeCharucoCorners: true,
    noisePx: 0.02
  });
}

function normalizeProvidedWarnings(value: unknown): SolverWarning[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    if (typeof item === "string") return { code: `l76.detector.externalWarning.${index}`, message: item };
    if (item && typeof item === "object" && "message" in item) {
      const record = item as { code?: unknown; message?: unknown };
      return { code: String(record.code ?? `l76.detector.externalWarning.${index}`), message: String(record.message ?? "") };
    }
    return { code: `l76.detector.externalWarning.${index}`, message: String(item) };
  }).filter((warning) => warning.message.trim().length > 0);
}

function confidenceValue(value: unknown, _minConfidence: number): number {
  return clamp(finite(Number(value ?? 1), 1), 0, 1);
}

function mergeWarnings(...groups: SolverWarning[][]): SolverWarning[] {
  const seen = new Set<string>();
  const warnings: SolverWarning[] = [];
  for (const group of groups) {
    for (const warning of group) {
      const key = `${warning.code}:${warning.message}`;
      if (seen.has(key)) continue;
      seen.add(key);
      warnings.push(warning);
    }
  }
  return warnings;
}

function parseCsvRows(text: string): string[][] {
  return text.split(/\r?\n/).filter((line) => line.trim().length > 0).map(splitCsvLine);
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index] ?? "";
    if (char === "\"") {
      if (quoted && line[index + 1] === "\"") {
        cell += "\"";
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell);
  return cells.map((value) => value.trim());
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[-\s]+/g, "_");
}

function stableOptionalString(current: string, value: unknown, label: string, row: number): string {
  const next = optionalString(value);
  if (!next) return current;
  if (current && current !== next) throw new Error(`external detector CSV has mixed ${label} values by row ${row}`);
  return next;
}

function requiredString(value: unknown, label: string): string {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`${label} is required`);
  return text;
}

function optionalString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function requiredInteger(value: unknown, label: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a number`);
  return Math.round(parsed);
}

function optionalPositiveInteger(value: unknown): number | null {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

function requiredNumber(value: unknown, label: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a finite number`);
  return parsed;
}

function optionalNumber(value: unknown): number | null {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function integerInRange(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(finite(value, min))));
}

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function signedPolygonArea2(corners: L75PixelPoint[]): number {
  let area2 = 0;
  for (let index = 0; index < corners.length; index += 1) {
    const a = corners[index]!;
    const b = corners[(index + 1) % corners.length]!;
    area2 += a.xPx * b.yPx - b.xPx * a.yPx;
  }
  return area2;
}

function distancePx(a: { xPx: number; yPx: number }, b: { xPx: number; yPx: number }): number {
  return Math.hypot(a.xPx - b.xPx, a.yPx - b.yPx);
}

function sortedUnion(a: number[], b: number[]): number[] {
  return [...new Set([...a, ...b])].sort((left, right) => left - right);
}

function meanOrNull(values: number[]): number | null {
  if (!values.length) return null;
  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function maxOrNull(values: number[]): number | null {
  if (!values.length) return null;
  return round(Math.max(...values));
}

function round(value: number): number {
  return Number(value.toPrecision(12));
}

function detectorParameter(parameters: Record<string, unknown>, key: string): string | null {
  const value = parameters[key];
  if (value === undefined || value === null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function detectorParametersSummary(parameters: Record<string, unknown>): string {
  const entries = Object.entries(parameters);
  if (!entries.length) return "none";
  return entries.map(([key, value]) => `${key}=${formatDetectorParameterValue(value)}`).join(", ");
}

function formatDetectorParameterValue(value: unknown): string {
  if (value === undefined || value === null) return "null";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function hashStatus(value: boolean | null): string {
  if (value === true) return "matched";
  if (value === false) return "mismatched";
  return "present, not compared";
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
