import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import {
  fitGeometricCalibration,
  type L72FitModel,
  type L72GeometricFitResult,
  type L72GeometryPoint,
  type L72PointSet
} from "./geometricCalibration";

export type L75FiducialStatus = "accepted" | "rejected";
export type L75FiducialSource = "synthetic" | "imported" | "manual";

export type L75WorldPoint = {
  xWorldUm: number;
  yWorldUm: number;
};

export type L75PixelPoint = {
  xPx: number;
  yPx: number;
};

export type L75FiducialBoardInput = {
  id?: string;
  label?: string;
  squaresX?: number;
  squaresY?: number;
  squareSizeMm?: number;
  markerSizeFraction?: number;
  dictionary?: string;
  markerIdStart?: number;
  imageWidthPx?: number;
  imageHeightPx?: number;
  marginPx?: number;
};

export type L75FiducialMarker = {
  id: number;
  row: number;
  col: number;
  centerWorldUm: L75WorldPoint;
  cornersWorldUm: [L75WorldPoint, L75WorldPoint, L75WorldPoint, L75WorldPoint];
  charucoCornerIds: [number, number, number, number];
};

export type L75CharucoCorner = {
  id: number;
  row: number;
  col: number;
  xWorldUm: number;
  yWorldUm: number;
};

export type L75FiducialBoard = {
  schema: "emmicro.l75.fiducialBoard.v1";
  appVersion: "L7.5 Fiducial Board / ChArUco-style Target Workflow";
  id: string;
  label: string;
  settings: Required<Omit<L75FiducialBoardInput, "id" | "label">>;
  markers: L75FiducialMarker[];
  charucoCorners: L75CharucoCorner[];
  image: {
    widthPx: number;
    heightPx: number;
    pixels: number[];
    imageHash: string;
  };
  warnings: SolverWarning[];
  limitations: string[];
  resultHash: string;
};

export type L75DetectedMarker = {
  id: number;
  cornersPx: [L75PixelPoint, L75PixelPoint, L75PixelPoint, L75PixelPoint];
  status: L75FiducialStatus;
  source: L75FiducialSource;
  confidence: number;
  reason?: string;
  originalId?: number;
};

export type L75DetectedCharucoCorner = {
  id: number;
  xPx: number;
  yPx: number;
  status: L75FiducialStatus;
  source: L75FiducialSource;
  confidence: number;
  reason?: string;
  originalId?: number;
};

export type L75FiducialDetectionBundle = {
  schema: "emmicro.l75.fiducialDetection.v1";
  appVersion: "L7.5 Fiducial Board / ChArUco-style Target Workflow";
  id: string;
  label: string;
  frameId: string;
  boardId?: string;
  markers: L75DetectedMarker[];
  charucoCorners: L75DetectedCharucoCorner[];
  manualEdits: L75FiducialManualEdit[];
  sourceHash: string;
  warnings: SolverWarning[];
  limitations: string[];
  resultHash: string;
};

export type L75FiducialManualEdit =
  | { type: "reject-marker"; id: number; reason?: string }
  | { type: "accept-marker"; id: number }
  | { type: "move-marker-corner"; id: number; cornerIndex: number; xPx: number; yPx: number }
  | { type: "relabel-marker"; id: number; nextId: number }
  | { type: "reject-charuco"; id: number; reason?: string }
  | { type: "accept-charuco"; id: number }
  | { type: "move-charuco"; id: number; xPx: number; yPx: number }
  | { type: "relabel-charuco"; id: number; nextId: number };

export type L75FiducialMatchResult = {
  schema: "emmicro.l75.fiducialMatch.v1";
  appVersion: "L7.5 Fiducial Board / ChArUco-style Target Workflow";
  id: string;
  label: string;
  boardHash: string;
  detectionHash: string;
  markerCount: number;
  detectedMarkerCount: number;
  acceptedMarkerCount: number;
  rejectedMarkerCount: number;
  acceptedCharucoCornerCount: number;
  matchedPointCount: number;
  markerCoverageScore: number;
  charucoCoverageScore: number;
  boardAreaCoverageScore: number;
  coverageScore: number;
  coveredQuadrants: Array<"top-left" | "top-right" | "bottom-left" | "bottom-right">;
  missingMarkerIds: number[];
  duplicateMarkerIds: number[];
  duplicateCharucoCornerIds: number[];
  ambiguousIds: number[];
  matchedPoints: L72GeometryPoint[];
  pointSet: L72PointSet;
  warnings: SolverWarning[];
  limitations: string[];
  resultHash: string;
};

export type L75FiducialFitResult = {
  schema: "emmicro.l75.fiducialFit.v1";
  appVersion: "L7.5 Fiducial Board / ChArUco-style Target Workflow";
  id: string;
  label: string;
  model: L72FitModel;
  status: "pass" | "warning" | "fail";
  match: L75FiducialMatchResult;
  fit: L72GeometricFitResult | null;
  warnings: SolverWarning[];
  limitations: string[];
  resultHash: string;
};

export const l75FiducialLimitations = [
  "L7.5 fiducial-board workflow is diagnostic 2D board generation, imported/synthetic detection matching, and geometry-fit handoff only; it is not certified camera calibration or lab-accredited metrology.",
  "The default board is a diagnostic ChArUco-style synthetic fiducial board; it is not OpenCV-compatible ArUco/ChArUco marker encoding and it does not implement AprilTag decoding.",
  "The workflow does not implement full 3D pose calibration, stereo calibration, hardware camera control, digital twin calibration, manufacturing certification, or full 3D Maxwell/FDTD/FEM/BEM/RCWA/CAD execution."
] as const;

export function generateFiducialBoard(input: L75FiducialBoardInput = {}): L75FiducialBoard {
  const squaresX = integerInRange(input.squaresX ?? 7, 2, 32);
  const squaresY = integerInRange(input.squaresY ?? 5, 2, 32);
  const squareSizeMm = Math.max(0.1, finite(input.squareSizeMm ?? 10, 10));
  const markerSizeFraction = clamp(finite(input.markerSizeFraction ?? 0.65, 0.65), 0.2, 0.92);
  const dictionary = input.dictionary?.trim() || "diagnostic-synthetic-4x4";
  const markerIdStart = Math.max(0, Math.round(finite(input.markerIdStart ?? 0, 0)));
  const imageWidthPx = integerInRange(input.imageWidthPx ?? 560, 160, 2048);
  const imageHeightPx = integerInRange(input.imageHeightPx ?? 400, 120, 2048);
  const marginPx = integerInRange(input.marginPx ?? 28, 0, 256);
  const squareSizeUm = squareSizeMm * 1000;
  const boardWidthUm = squaresX * squareSizeUm;
  const boardHeightUm = squaresY * squareSizeUm;
  const markerSizeUm = squareSizeUm * markerSizeFraction;
  const markers: L75FiducialMarker[] = [];
  for (let row = 0; row < squaresY; row += 1) {
    for (let col = 0; col < squaresX; col += 1) {
      const centerX = (col + 0.5) * squareSizeUm - boardWidthUm / 2;
      const centerY = (row + 0.5) * squareSizeUm - boardHeightUm / 2;
      const half = markerSizeUm / 2;
      markers.push({
        id: markerIdStart + row * squaresX + col,
        row,
        col,
        centerWorldUm: { xWorldUm: round(centerX), yWorldUm: round(centerY) },
        cornersWorldUm: [
          { xWorldUm: round(centerX - half), yWorldUm: round(centerY - half) },
          { xWorldUm: round(centerX + half), yWorldUm: round(centerY - half) },
          { xWorldUm: round(centerX + half), yWorldUm: round(centerY + half) },
          { xWorldUm: round(centerX - half), yWorldUm: round(centerY + half) }
        ],
        charucoCornerIds: [
          row * (squaresX + 1) + col,
          row * (squaresX + 1) + col + 1,
          (row + 1) * (squaresX + 1) + col + 1,
          (row + 1) * (squaresX + 1) + col
        ]
      });
    }
  }
  const charucoCorners: L75CharucoCorner[] = [];
  for (let row = 0; row <= squaresY; row += 1) {
    for (let col = 0; col <= squaresX; col += 1) {
      charucoCorners.push({
        id: row * (squaresX + 1) + col,
        row,
        col,
        xWorldUm: round(col * squareSizeUm - boardWidthUm / 2),
        yWorldUm: round(row * squareSizeUm - boardHeightUm / 2)
      });
    }
  }
  const pixels = renderBoardPixels({ squaresX, squaresY, markerIdStart, imageWidthPx, imageHeightPx, marginPx, markerSizeFraction });
  const imageHash = fnv1a64(stableStringify({ widthPx: imageWidthPx, heightPx: imageHeightPx, sample: sampleForHash(pixels) }));
  const warnings: SolverWarning[] = dictionary === "diagnostic-synthetic-4x4"
    ? [{ code: "l75.board.syntheticDictionary", message: "Default fiducial board uses diagnostic synthetic IDs, not OpenCV/AprilTag-compatible encoded markers." }]
    : [{ code: "l75.board.dictionaryLabelOnly", message: `Dictionary '${dictionary}' is metadata only unless an external detector provides compatible detections.` }];
  const partial = {
    schema: "emmicro.l75.fiducialBoard.v1" as const,
    appVersion: "L7.5 Fiducial Board / ChArUco-style Target Workflow" as const,
    id: input.id ?? `l75-board-${squaresX}x${squaresY}`,
    label: input.label ?? "L7.5 diagnostic ChArUco-style synthetic fiducial board",
    settings: { squaresX, squaresY, squareSizeMm, markerSizeFraction, dictionary, markerIdStart, imageWidthPx, imageHeightPx, marginPx },
    markers,
    charucoCorners,
    image: { widthPx: imageWidthPx, heightPx: imageHeightPx, pixels, imageHash },
    warnings,
    limitations: [...l75FiducialLimitations]
  };
  return { ...partial, resultHash: fnv1a64(stableStringify(resultForHash(partial))) };
}

export function generateSyntheticFiducialDetection(board: L75FiducialBoard, input: {
  id?: string;
  label?: string;
  frameId?: string;
  scalePxPerMm?: number;
  rotationDeg?: number;
  translateXPx?: number;
  translateYPx?: number;
  noisePx?: number;
  missingMarkerIds?: number[];
  rejectedMarkerIds?: number[];
  droppedMarkerModulo?: number;
  includeCharucoCorners?: boolean;
} = {}): L75FiducialDetectionBundle {
  const scalePxPerMm = Math.max(0.001, finite(input.scalePxPerMm ?? 7.2, 7.2));
  const rotationDeg = finite(input.rotationDeg ?? 3.5, 3.5);
  const translateXPx = finite(input.translateXPx ?? 0, 0);
  const translateYPx = finite(input.translateYPx ?? 0, 0);
  const noisePx = Math.max(0, finite(input.noisePx ?? 0.05, 0.05));
  const missing = new Set(input.missingMarkerIds ?? []);
  const rejected = new Set(input.rejectedMarkerIds ?? []);
  const droppedModulo = input.droppedMarkerModulo && input.droppedMarkerModulo > 1 ? Math.round(input.droppedMarkerModulo) : 0;
  const markers = board.markers
    .filter((marker) => !missing.has(marker.id) && (!droppedModulo || marker.id % droppedModulo !== 0))
    .map((marker) => ({
      id: marker.id,
      cornersPx: marker.cornersWorldUm.map((corner, cornerIndex) => worldToPixel(board, corner, { scalePxPerMm, rotationDeg, translateXPx, translateYPx, noisePx, salt: marker.id * 10 + cornerIndex })) as [L75PixelPoint, L75PixelPoint, L75PixelPoint, L75PixelPoint],
      status: rejected.has(marker.id) ? "rejected" as const : "accepted" as const,
      source: "synthetic" as const,
      confidence: rejected.has(marker.id) ? 0.4 : 0.99,
      reason: rejected.has(marker.id) ? "Synthetic rejected marker for manual-review smoke." : undefined
    }));
  const visibleMarkerIds = new Set(markers.map((marker) => marker.id));
  const visibleCharucoIds = new Set<number>();
  for (const marker of board.markers) {
    if (visibleMarkerIds.has(marker.id)) {
      for (const id of marker.charucoCornerIds) visibleCharucoIds.add(id);
    }
  }
  const charucoCorners = input.includeCharucoCorners === false ? [] : board.charucoCorners
    .filter((corner) => visibleCharucoIds.has(corner.id))
    .map((corner) => {
      const px = worldToPixel(board, { xWorldUm: corner.xWorldUm, yWorldUm: corner.yWorldUm }, { scalePxPerMm, rotationDeg, translateXPx, translateYPx, noisePx, salt: corner.id + 1000 });
      return { id: corner.id, xPx: px.xPx, yPx: px.yPx, status: "accepted" as const, source: "synthetic" as const, confidence: 0.98 };
    });
  return createDetectionBundle({
    id: input.id ?? "l75-synthetic-fiducial-detection",
    label: input.label ?? "L7.5 synthetic clean-board fiducial detections",
    frameId: input.frameId ?? "frame_001",
    boardId: board.id,
    markers,
    charucoCorners,
    warnings: droppedModulo || missing.size
      ? [{ code: "l75.synthetic.partialView", message: "Synthetic detection intentionally omits markers for partial-view QA." }]
      : [],
    sourceSeed: { boardHash: board.resultHash, scalePxPerMm, rotationDeg, translateXPx, translateYPx, noisePx, missing: [...missing], droppedModulo }
  });
}

export function parseFiducialMarkerCsv(text: string, input: { id?: string; label?: string; boardId?: string } = {}): L75FiducialDetectionBundle {
  const rows = parseCsvRows(text);
  if (rows.length < 2) throw new Error("fiducial marker CSV is empty");
  const headers = rows[0]!.map(normalizeHeader);
  for (const column of ["frame_id", "marker_id", "corner_index", "x_px", "y_px"]) {
    if (!headers.includes(column)) throw new Error(`fiducial marker CSV missing required column: ${column}`);
  }
  const index = (name: string) => headers.indexOf(name);
  const frameIndex = index("frame_id");
  const markerIndex = index("marker_id");
  const cornerIndex = index("corner_index");
  const xIndex = index("x_px");
  const yIndex = index("y_px");
  let frameId = "";
  const byMarker = new Map<number, Array<L75PixelPoint | null>>();
  const seenCorners = new Set<string>();
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex]!;
    if (!row.some((cell) => cell.trim())) continue;
    const nextFrameId = requiredString(row[frameIndex], `frame_id row ${rowIndex + 1}`);
    if (!frameId) frameId = nextFrameId;
    if (frameId !== nextFrameId) throw new Error("fiducial marker CSV must contain one frame_id per import");
    const markerId = requiredInteger(row[markerIndex], `marker_id row ${rowIndex + 1}`);
    const corner = integerInRange(requiredInteger(row[cornerIndex], `corner_index row ${rowIndex + 1}`), 0, 3);
    const key = `${markerId}:${corner}`;
    if (seenCorners.has(key)) throw new Error(`fiducial marker CSV duplicate marker/corner pair: ${key}`);
    seenCorners.add(key);
    const current = byMarker.get(markerId) ?? [null, null, null, null];
    current[corner] = { xPx: requiredNumber(row[xIndex], `x_px row ${rowIndex + 1}`), yPx: requiredNumber(row[yIndex], `y_px row ${rowIndex + 1}`) };
    byMarker.set(markerId, current);
  }
  const markers: L75DetectedMarker[] = [];
  for (const [markerId, corners] of byMarker.entries()) {
    if (corners.some((corner) => corner === null)) throw new Error(`fiducial marker CSV marker ${markerId} does not have all four corners`);
    markers.push({ id: markerId, cornersPx: corners as [L75PixelPoint, L75PixelPoint, L75PixelPoint, L75PixelPoint], status: "accepted", source: "imported", confidence: 1 });
  }
  return createDetectionBundle({ id: input.id, label: input.label ?? "L7.5 imported marker-corner detections", frameId, boardId: input.boardId, markers, charucoCorners: [], sourceSeed: { headers, markers } });
}

export function parseFiducialCharucoCsv(text: string, input: { id?: string; label?: string; boardId?: string } = {}): L75FiducialDetectionBundle {
  const rows = parseCsvRows(text);
  if (rows.length < 2) throw new Error("fiducial ChArUco corner CSV is empty");
  const headers = rows[0]!.map(normalizeHeader);
  for (const column of ["frame_id", "charuco_corner_id", "x_px", "y_px"]) {
    if (!headers.includes(column)) throw new Error(`fiducial ChArUco corner CSV missing required column: ${column}`);
  }
  const index = (name: string) => headers.indexOf(name);
  const frameIndex = index("frame_id");
  const cornerIdIndex = index("charuco_corner_id");
  const xIndex = index("x_px");
  const yIndex = index("y_px");
  let frameId = "";
  const seen = new Set<number>();
  const charucoCorners: L75DetectedCharucoCorner[] = [];
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex]!;
    if (!row.some((cell) => cell.trim())) continue;
    const nextFrameId = requiredString(row[frameIndex], `frame_id row ${rowIndex + 1}`);
    if (!frameId) frameId = nextFrameId;
    if (frameId !== nextFrameId) throw new Error("fiducial ChArUco corner CSV must contain one frame_id per import");
    const id = requiredInteger(row[cornerIdIndex], `charuco_corner_id row ${rowIndex + 1}`);
    if (seen.has(id)) throw new Error(`fiducial ChArUco corner CSV duplicate corner id: ${id}`);
    seen.add(id);
    charucoCorners.push({ id, xPx: requiredNumber(row[xIndex], `x_px row ${rowIndex + 1}`), yPx: requiredNumber(row[yIndex], `y_px row ${rowIndex + 1}`), status: "accepted", source: "imported", confidence: 1 });
  }
  return createDetectionBundle({ id: input.id, label: input.label ?? "L7.5 imported ChArUco-style corner detections", frameId, boardId: input.boardId, markers: [], charucoCorners, sourceSeed: { headers, charucoCorners } });
}

export function parseFiducialDetectionJson(text: string, input: { id?: string; label?: string } = {}): L75FiducialDetectionBundle {
  const parsed = JSON.parse(text) as {
    frameId?: string;
    boardId?: string;
    markers?: Array<{ id: number; cornersPx: number[][]; status?: L75FiducialStatus; confidence?: number }>;
    charucoCorners?: Array<{ id: number; xPx: number; yPx: number; status?: L75FiducialStatus; confidence?: number }>;
  };
  const frameId = requiredString(parsed.frameId, "frameId");
  const markerIds = new Set<number>();
  const markers = (parsed.markers ?? []).map((marker, index): L75DetectedMarker => {
    const id = requiredInteger(marker.id, `markers[${index}].id`);
    if (markerIds.has(id)) throw new Error(`fiducial detection JSON duplicate marker id: ${id}`);
    markerIds.add(id);
    if (!Array.isArray(marker.cornersPx) || marker.cornersPx.length !== 4) throw new Error(`fiducial detection JSON marker ${id} requires four cornersPx entries`);
    return {
      id,
      cornersPx: marker.cornersPx.map((corner, cornerIndex) => {
        if (!Array.isArray(corner) || corner.length < 2) throw new Error(`fiducial detection JSON marker ${id} corner ${cornerIndex} is invalid`);
        return { xPx: requiredNumber(corner[0], `marker ${id} corner ${cornerIndex} x`), yPx: requiredNumber(corner[1], `marker ${id} corner ${cornerIndex} y`) };
      }) as [L75PixelPoint, L75PixelPoint, L75PixelPoint, L75PixelPoint],
      status: marker.status ?? "accepted",
      source: "imported",
      confidence: finite(marker.confidence ?? 1, 1)
    };
  });
  const charucoIds = new Set<number>();
  const charucoCorners = (parsed.charucoCorners ?? []).map((corner, index): L75DetectedCharucoCorner => {
    const id = requiredInteger(corner.id, `charucoCorners[${index}].id`);
    if (charucoIds.has(id)) throw new Error(`fiducial detection JSON duplicate ChArUco corner id: ${id}`);
    charucoIds.add(id);
    return { id, xPx: requiredNumber(corner.xPx, `charuco ${id} xPx`), yPx: requiredNumber(corner.yPx, `charuco ${id} yPx`), status: corner.status ?? "accepted", source: "imported", confidence: finite(corner.confidence ?? 1, 1) };
  });
  return createDetectionBundle({ id: input.id, label: input.label ?? "L7.5 imported fiducial detection JSON", frameId, boardId: parsed.boardId, markers, charucoCorners, sourceSeed: parsed });
}

export function applyFiducialManualEdits(bundle: L75FiducialDetectionBundle, edits: L75FiducialManualEdit[]): L75FiducialDetectionBundle {
  let markers = bundle.markers.map((marker) => ({ ...marker, cornersPx: marker.cornersPx.map((corner) => ({ ...corner })) as [L75PixelPoint, L75PixelPoint, L75PixelPoint, L75PixelPoint] }));
  let charucoCorners = bundle.charucoCorners.map((corner) => ({ ...corner }));
  for (const edit of edits) {
    if (edit.type === "reject-marker") markers = markers.map((marker) => marker.id === edit.id ? { ...marker, status: "rejected", reason: edit.reason ?? "Rejected during L7.5 manual review." } : marker);
    if (edit.type === "accept-marker") markers = markers.map((marker) => marker.id === edit.id ? { ...marker, status: "accepted", reason: undefined } : marker);
    if (edit.type === "move-marker-corner") markers = markers.map((marker) => marker.id === edit.id ? { ...marker, cornersPx: marker.cornersPx.map((corner, index) => index === edit.cornerIndex ? { xPx: edit.xPx, yPx: edit.yPx } : corner) as [L75PixelPoint, L75PixelPoint, L75PixelPoint, L75PixelPoint] } : marker);
    if (edit.type === "relabel-marker") markers = markers.map((marker) => marker.id === edit.id ? { ...marker, id: edit.nextId, originalId: marker.originalId ?? marker.id } : marker);
    if (edit.type === "reject-charuco") charucoCorners = charucoCorners.map((corner) => corner.id === edit.id ? { ...corner, status: "rejected", reason: edit.reason ?? "Rejected during L7.5 manual review." } : corner);
    if (edit.type === "accept-charuco") charucoCorners = charucoCorners.map((corner) => corner.id === edit.id ? { ...corner, status: "accepted", reason: undefined } : corner);
    if (edit.type === "move-charuco") charucoCorners = charucoCorners.map((corner) => corner.id === edit.id ? { ...corner, xPx: edit.xPx, yPx: edit.yPx } : corner);
    if (edit.type === "relabel-charuco") charucoCorners = charucoCorners.map((corner) => corner.id === edit.id ? { ...corner, id: edit.nextId, originalId: corner.originalId ?? corner.id } : corner);
  }
  return createDetectionBundle({
    id: bundle.id,
    label: bundle.label,
    frameId: bundle.frameId,
    boardId: bundle.boardId,
    markers,
    charucoCorners,
    manualEdits: [...bundle.manualEdits, ...edits],
    warnings: bundle.warnings,
    sourceSeed: { sourceHash: bundle.sourceHash, edits }
  });
}

export function matchFiducialBoardDetection(input: { id?: string; label?: string; board: L75FiducialBoard; detection: L75FiducialDetectionBundle }): L75FiducialMatchResult {
  const { board, detection } = input;
  const markerById = new Map(board.markers.map((marker) => [marker.id, marker]));
  const charucoById = new Map(board.charucoCorners.map((corner) => [corner.id, corner]));
  const warnings: SolverWarning[] = [...detection.warnings];
  const matchedPoints: L72GeometryPoint[] = [];
  const duplicateMarkerIds = duplicates(detection.markers.map((marker) => marker.id));
  const duplicateCharucoCornerIds = duplicates(detection.charucoCorners.map((corner) => corner.id));
  for (const id of duplicateMarkerIds) warnings.push({ code: "l75.match.duplicateMarkerId", message: `Duplicate fiducial marker id ${id} appears in the detection bundle.` });
  for (const id of duplicateCharucoCornerIds) warnings.push({ code: "l75.match.duplicateCharucoCornerId", message: `Duplicate ChArUco-style corner id ${id} appears in the detection bundle.` });
  const acceptedMarkerIds = new Set<number>();
  const usedMarkerIds = new Set<number>();
  for (const marker of detection.markers) {
    if (marker.status !== "accepted") continue;
    const boardMarker = markerById.get(marker.id);
    if (!boardMarker) {
      warnings.push({ code: "l75.match.unknownMarkerId", message: `Detected marker id ${marker.id} is not present in board ${board.id}.` });
      continue;
    }
    if (usedMarkerIds.has(marker.id)) continue;
    usedMarkerIds.add(marker.id);
    acceptedMarkerIds.add(marker.id);
    for (let cornerIndex = 0; cornerIndex < 4; cornerIndex += 1) {
      const px = marker.cornersPx[cornerIndex]!;
      const world = boardMarker.cornersWorldUm[cornerIndex]!;
      matchedPoints.push({
        id: `marker-${marker.id}-${cornerIndex}`,
        row: boardMarker.row,
        col: boardMarker.col,
        xPx: px.xPx,
        yPx: px.yPx,
        xWorldUm: world.xWorldUm,
        yWorldUm: world.yWorldUm
      });
    }
  }
  const usedCharucoIds = new Set<number>();
  for (const corner of detection.charucoCorners) {
    if (corner.status !== "accepted") continue;
    const boardCorner = charucoById.get(corner.id);
    if (!boardCorner) {
      warnings.push({ code: "l75.match.unknownCharucoCornerId", message: `Detected ChArUco-style corner id ${corner.id} is not present in board ${board.id}.` });
      continue;
    }
    if (usedCharucoIds.has(corner.id)) continue;
    usedCharucoIds.add(corner.id);
    matchedPoints.push({
      id: `charuco-${corner.id}`,
      row: boardCorner.row,
      col: boardCorner.col,
      xPx: corner.xPx,
      yPx: corner.yPx,
      xWorldUm: boardCorner.xWorldUm,
      yWorldUm: boardCorner.yWorldUm
    });
  }
  const missingMarkerIds = board.markers.map((marker) => marker.id).filter((id) => !acceptedMarkerIds.has(id));
  const markerCoverageScore = round(acceptedMarkerIds.size / Math.max(1, board.markers.length));
  const charucoCoverageScore = round(usedCharucoIds.size / Math.max(1, board.charucoCorners.length));
  const boardAreaCoverageScore = round(areaCoverage(matchedPoints, board));
  const coverageScore = round((markerCoverageScore + charucoCoverageScore + boardAreaCoverageScore) / 3);
  const coveredQuadrants = coveredBoardQuadrants(matchedPoints);
  if (matchedPoints.length < 3) warnings.push({ code: "l75.match.tooFewPoints", message: "Fewer than three matched fiducial points are available; geometry fitting is under-constrained." });
  if (boardAreaCoverageScore < 0.18) warnings.push({ code: "l75.match.poorBoardCoverage", message: "Matched fiducial points cover a narrow board area; partial-view fit may be fragile." });
  if (coveredQuadrants.length < 2) warnings.push({ code: "l75.match.concentratedCoverage", message: "Matched fiducial points are concentrated in one board region." });
  if (boardAreaCoverageScore < 0.35 || coveredQuadrants.length < 3) warnings.push({ code: "l75.match.radialCoverageLow", message: "Radial distortion fit is not trustworthy with this narrow fiducial coverage." });
  if (missingMarkerIds.length > 0) warnings.push({ code: "l75.match.missingMarkers", message: `${missingMarkerIds.length} board marker IDs are not visible or accepted.` });
  const pointSet: L72PointSet = {
    schema: "emmicro.l72.pointSet.v1",
    id: `${detection.frameId}-fiducial-points`,
    label: `${detection.label} matched fiducial points`,
    points: matchedPoints,
    sourceHash: fnv1a64(stableStringify(matchedPoints.map(pointForHash))),
    warnings,
    limitations: [...l75FiducialLimitations]
  };
  const partial = {
    schema: "emmicro.l75.fiducialMatch.v1" as const,
    appVersion: "L7.5 Fiducial Board / ChArUco-style Target Workflow" as const,
    id: input.id ?? "l75-fiducial-match",
    label: input.label ?? "L7.5 diagnostic fiducial ID match",
    boardHash: board.resultHash,
    detectionHash: detection.resultHash,
    markerCount: board.markers.length,
    detectedMarkerCount: detection.markers.length,
    acceptedMarkerCount: acceptedMarkerIds.size,
    rejectedMarkerCount: detection.markers.filter((marker) => marker.status === "rejected").length,
    acceptedCharucoCornerCount: usedCharucoIds.size,
    matchedPointCount: matchedPoints.length,
    markerCoverageScore,
    charucoCoverageScore,
    boardAreaCoverageScore,
    coverageScore,
    coveredQuadrants,
    missingMarkerIds,
    duplicateMarkerIds,
    duplicateCharucoCornerIds,
    ambiguousIds: [...new Set([...duplicateMarkerIds, ...duplicateCharucoCornerIds])].sort((a, b) => a - b),
    matchedPoints,
    pointSet,
    warnings,
    limitations: [...l75FiducialLimitations]
  };
  return { ...partial, resultHash: fnv1a64(stableStringify(resultForHash(partial))) };
}

export function fitFiducialBoardDetection(input: { id?: string; label?: string; board: L75FiducialBoard; detection: L75FiducialDetectionBundle; model?: L72FitModel }): L75FiducialFitResult {
  const model = input.model ?? "similarity";
  const match = matchFiducialBoardDetection({ id: `${input.id ?? "l75-fiducial-fit"}-match`, board: input.board, detection: input.detection });
  let fit: L72GeometricFitResult | null = null;
  const warnings: SolverWarning[] = [...match.warnings];
  try {
    if (match.pointSet.points.length >= 3) {
      fit = fitGeometricCalibration({
        id: `${input.id ?? "l75-fiducial-fit"}-l72-fit`,
        label: `L7.5 fiducial ${model} geometry handoff`,
        points: match.pointSet,
        model
      });
      for (const warning of fit.warnings) warnings.push(warning);
      for (const issue of fit.issues) warnings.push({ code: issue.code, message: issue.message });
    }
  } catch (error) {
    warnings.push({ code: "l75.fit.failed", message: `Fiducial geometry fit failed: ${(error as Error).message}` });
  }
  const status: "pass" | "warning" | "fail" = !fit ? "fail" : fit.status === "fail" ? "fail" : warnings.length > 0 || fit.status === "warning" ? "warning" : "pass";
  const partial = {
    schema: "emmicro.l75.fiducialFit.v1" as const,
    appVersion: "L7.5 Fiducial Board / ChArUco-style Target Workflow" as const,
    id: input.id ?? "l75-fiducial-fit",
    label: input.label ?? "L7.5 fiducial board diagnostic fit",
    model,
    status,
    match,
    fit,
    warnings,
    limitations: [...l75FiducialLimitations]
  };
  return { ...partial, resultHash: fnv1a64(stableStringify(resultForHash(partial))) };
}

export function fiducialBoardManifestJson(board: L75FiducialBoard): string {
  const { pixels: _pixels, ...image } = board.image;
  return JSON.stringify({ board: { ...board, image } }, null, 2);
}

export function fiducialDetectionReportJson(result: L75FiducialFitResult): string {
  return JSON.stringify({ result }, null, 2);
}

export function fiducialDetectionReportMarkdown(result: L75FiducialFitResult): string {
  return [
    `# ${result.label}`,
    "",
    `App version: ${result.appVersion}`,
    `Status: ${result.status.toUpperCase()}`,
    `Result hash: ${result.resultHash}`,
    `Board hash: ${result.match.boardHash}`,
    `Detection hash: ${result.match.detectionHash}`,
    "",
    "## Match Summary",
    `- Markers accepted / detected / board: ${result.match.acceptedMarkerCount} / ${result.match.detectedMarkerCount} / ${result.match.markerCount}`,
    `- ChArUco-style corners accepted: ${result.match.acceptedCharucoCornerCount}`,
    `- Matched points: ${result.match.matchedPointCount}`,
    `- Coverage score: ${fmt(result.match.coverageScore)}`,
    `- Board area coverage: ${fmt(result.match.boardAreaCoverageScore)}`,
    `- Covered quadrants: ${result.match.coveredQuadrants.join(", ") || "none"}`,
    `- Missing marker IDs: ${result.match.missingMarkerIds.slice(0, 24).join(", ") || "none"}`,
    "",
    "## Fit",
    result.fit ? `- Model: ${result.fit.model}` : "- Model: not run",
    result.fit ? `- RMS residual: ${fmt(result.fit.metrics.rmsResidualPx)} px` : "- RMS residual: n/a",
    result.fit ? `- Max residual: ${fmt(result.fit.metrics.maxResidualPx)} px` : "- Max residual: n/a",
    "",
    "## Warnings",
    ...(result.warnings.length ? result.warnings.map((warning) => `- ${warning.message}`) : ["- none"]),
    "",
    "## Boundary",
    ...result.limitations.map((limitation) => `- ${limitation}`)
  ].join("\n");
}

export function fiducialMatchedPointsCsv(result: L75FiducialMatchResult | L75FiducialFitResult): string {
  const match = "match" in result ? result.match : result;
  return [
    "id,row,col,x_px,y_px,x_world_um,y_world_um",
    ...match.matchedPoints.map((point) => [point.id, point.row ?? "", point.col ?? "", point.xPx, point.yPx, point.xWorldUm ?? "", point.yWorldUm ?? ""].map(csvEscape).join(","))
  ].join("\n");
}

export function fiducialRejectedPointsCsv(bundle: L75FiducialDetectionBundle): string {
  return [
    "kind,id,corner_index,x_px,y_px,reason",
    ...bundle.markers.filter((marker) => marker.status === "rejected").flatMap((marker) => marker.cornersPx.map((corner, index) => ["marker", marker.id, index, corner.xPx, corner.yPx, marker.reason ?? ""].map(csvEscape).join(","))),
    ...bundle.charucoCorners.filter((corner) => corner.status === "rejected").map((corner) => ["charuco", corner.id, "", corner.xPx, corner.yPx, corner.reason ?? ""].map(csvEscape).join(","))
  ].join("\n");
}

function createDetectionBundle(input: {
  id?: string;
  label?: string;
  frameId: string;
  boardId?: string;
  markers: L75DetectedMarker[];
  charucoCorners: L75DetectedCharucoCorner[];
  manualEdits?: L75FiducialManualEdit[];
  warnings?: SolverWarning[];
  sourceSeed: unknown;
}): L75FiducialDetectionBundle {
  const warnings = input.warnings ?? [];
  const partial = {
    schema: "emmicro.l75.fiducialDetection.v1" as const,
    appVersion: "L7.5 Fiducial Board / ChArUco-style Target Workflow" as const,
    id: input.id ?? "l75-fiducial-detection",
    label: input.label ?? "L7.5 fiducial detections",
    frameId: input.frameId,
    boardId: input.boardId,
    markers: input.markers,
    charucoCorners: input.charucoCorners,
    manualEdits: input.manualEdits ?? [],
    sourceHash: fnv1a64(stableStringify(input.sourceSeed)),
    warnings,
    limitations: [...l75FiducialLimitations]
  };
  return { ...partial, resultHash: fnv1a64(stableStringify(resultForHash(partial))) };
}

function renderBoardPixels(input: { squaresX: number; squaresY: number; markerIdStart: number; imageWidthPx: number; imageHeightPx: number; marginPx: number; markerSizeFraction: number }): number[] {
  const pixels = new Array(input.imageWidthPx * input.imageHeightPx).fill(1);
  const usableW = Math.max(1, input.imageWidthPx - input.marginPx * 2);
  const usableH = Math.max(1, input.imageHeightPx - input.marginPx * 2);
  const squareW = usableW / input.squaresX;
  const squareH = usableH / input.squaresY;
  for (let y = 0; y < input.imageHeightPx; y += 1) {
    for (let x = 0; x < input.imageWidthPx; x += 1) {
      const bx = x - input.marginPx;
      const by = y - input.marginPx;
      if (bx < 0 || by < 0 || bx > usableW || by > usableH) continue;
      const col = Math.min(input.squaresX - 1, Math.floor(bx / squareW));
      const row = Math.min(input.squaresY - 1, Math.floor(by / squareH));
      const localX = (bx - col * squareW) / squareW;
      const localY = (by - row * squareH) / squareH;
      const checker = (row + col) % 2 === 0 ? 0.88 : 0.72;
      let value = checker;
      const markerHalf = input.markerSizeFraction / 2;
      if (Math.abs(localX - 0.5) <= markerHalf && Math.abs(localY - 0.5) <= markerHalf) {
        const markerId = input.markerIdStart + row * input.squaresX + col;
        const bit = ((Math.floor(localX * 8) + Math.floor(localY * 8) + markerId) % 3) === 0;
        value = bit ? 0.08 : 0.22;
      }
      pixels[y * input.imageWidthPx + x] = value;
    }
  }
  return pixels;
}

function worldToPixel(board: L75FiducialBoard, world: L75WorldPoint, input: { scalePxPerMm: number; rotationDeg: number; translateXPx: number; translateYPx: number; noisePx: number; salt: number }): L75PixelPoint {
  const xMm = world.xWorldUm / 1000;
  const yMm = world.yWorldUm / 1000;
  const c = Math.cos((input.rotationDeg * Math.PI) / 180);
  const s = Math.sin((input.rotationDeg * Math.PI) / 180);
  const jitterX = input.noisePx * Math.sin(input.salt * 12.9898);
  const jitterY = input.noisePx * Math.cos(input.salt * 78.233);
  return {
    xPx: round(board.image.widthPx / 2 + input.translateXPx + (xMm * c - yMm * s) * input.scalePxPerMm + jitterX),
    yPx: round(board.image.heightPx / 2 + input.translateYPx + (xMm * s + yMm * c) * input.scalePxPerMm + jitterY)
  };
}

function areaCoverage(points: L72GeometryPoint[], board: L75FiducialBoard): number {
  const usable = points.filter((point) => point.xWorldUm !== undefined && point.yWorldUm !== undefined);
  if (usable.length < 2) return 0;
  const xs = usable.map((point) => point.xWorldUm!);
  const ys = usable.map((point) => point.yWorldUm!);
  const area = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
  const boardArea = board.settings.squaresX * board.settings.squareSizeMm * 1000 * board.settings.squaresY * board.settings.squareSizeMm * 1000;
  return clamp(area / Math.max(1, boardArea), 0, 1);
}

function coveredBoardQuadrants(points: L72GeometryPoint[]): Array<"top-left" | "top-right" | "bottom-left" | "bottom-right"> {
  const quadrants = new Set<"top-left" | "top-right" | "bottom-left" | "bottom-right">();
  for (const point of points) {
    if (point.xWorldUm === undefined || point.yWorldUm === undefined) continue;
    if (point.xWorldUm < 0 && point.yWorldUm < 0) quadrants.add("top-left");
    if (point.xWorldUm >= 0 && point.yWorldUm < 0) quadrants.add("top-right");
    if (point.xWorldUm < 0 && point.yWorldUm >= 0) quadrants.add("bottom-left");
    if (point.xWorldUm >= 0 && point.yWorldUm >= 0) quadrants.add("bottom-right");
  }
  return [...quadrants].sort();
}

function duplicates(values: number[]): number[] {
  const seen = new Set<number>();
  const duplicate = new Set<number>();
  for (const value of values) {
    if (seen.has(value)) duplicate.add(value);
    seen.add(value);
  }
  return [...duplicate].sort((a, b) => a - b);
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

function requiredString(value: unknown, label: string): string {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`${label} is required`);
  return text;
}

function requiredInteger(value: unknown, label: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a number`);
  return Math.round(parsed);
}

function requiredNumber(value: unknown, label: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a finite number`);
  return parsed;
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

function round(value: number): number {
  return Number(value.toPrecision(12));
}

function fmt(value: number | null): string {
  return value === null || !Number.isFinite(value) ? "n/a" : value.toPrecision(4);
}

function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

function sampleForHash(values: number[]): number[] {
  if (values.length <= 512) return values.map(round);
  const step = Math.max(1, Math.floor(values.length / 512));
  const sample: number[] = [];
  for (let index = 0; index < values.length; index += step) sample.push(round(values[index] ?? 0));
  return sample.slice(0, 512);
}

function pointForHash(point: L72GeometryPoint): unknown {
  return {
    id: point.id,
    row: point.row,
    col: point.col,
    xPx: round(point.xPx),
    yPx: round(point.yPx),
    xWorldUm: point.xWorldUm === undefined ? undefined : round(point.xWorldUm),
    yWorldUm: point.yWorldUm === undefined ? undefined : round(point.yWorldUm)
  };
}

function resultForHash<T extends Record<string, unknown>>(value: T): Omit<T, "resultHash"> {
  const copy = { ...value };
  delete (copy as Partial<T> & { resultHash?: unknown }).resultHash;
  return copy;
}
