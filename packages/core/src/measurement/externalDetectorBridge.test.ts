import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyExternalDetectorManualEdits,
  compareExternalDetectors,
  detectorBridgeReportJson,
  detectorBridgeReportMarkdown,
  detectorComparisonCsv,
  exampleExternalDetectorJson,
  exampleExternalDetectorMarkerCsv,
  externalDetectorBoardInstructionsMarkdown,
  fitExternalDetectorImport,
  importedDetectionsCsv,
  parseExternalDetectorJson,
  parseExternalDetectorMarkerCsv
} from "./externalDetectorBridge";
import {
  applyFiducialManualEdits,
  generateFiducialBoard,
  generateSyntheticFiducialDetection
} from "./fiducialBoard";
import { l74FrameFromFiducialFit, parseL74SessionManifestCsv, runL74SessionQa } from "../workspace/batchSessionQa";

const testDir = fileURLToPath(new URL(".", import.meta.url));

describe("L7.6 external detector JSON/CSV bridge", () => {
  it("imports canonical detector JSON with deterministic detector receipts and L7.5 match handoff", () => {
    const board = generateFiducialBoard({ id: "board_7x5_v1" });
    const text = exampleExternalDetectorJson(board);
    const first = parseExternalDetectorJson(text, { board, expectedBoardHash: board.resultHash, expectedImageHash: board.image.imageHash });
    const second = parseExternalDetectorJson(text, { board, expectedBoardHash: board.resultHash, expectedImageHash: board.image.imageHash });

    expect(first.schema).toBe("emmicro.l76.externalDetectorImport.v1");
    expect(first.receipt.schema).toBe("emmicro.l76.detectorReceipt.v1");
    expect(first.receipt.resultHash).toBe(second.receipt.resultHash);
    expect(first.resultHash).toBe(second.resultHash);
    expect(first.detector.name).toBe("opencv-charuco");
    expect(first.image.hashMatchesExpected).toBe(true);
    expect(first.board.hashMatchesExpected).toBe(true);
    expect(first.detection.schema).toBe("emmicro.l75.fiducialDetection.v1");
    expect(first.detection.markers.length).toBeGreaterThan(0);
    expect(first.match?.matchedPointCount).toBeGreaterThan(10);
  });

  it("imports detector marker CSV receipts and rejects missing receipt data", () => {
    const board = generateFiducialBoard({ id: "board_7x5_v1" });
    const csv = exampleExternalDetectorMarkerCsv(board);
    const imported = parseExternalDetectorMarkerCsv(csv, { board, expectedBoardHash: board.resultHash, expectedImageHash: board.image.imageHash });

    expect(imported.sourceFormat).toBe("csv");
    expect(imported.detection.markers).toHaveLength(4);
    expect(imported.receipt.sourceFormat).toBe("csv");
    expect(imported.receipt.warningCodes).toEqual(expect.arrayContaining(["l75.match.missingMarkers"]));
    expect(importedDetectionsCsv(imported)).toContain("marker");
    expect(() => parseExternalDetectorMarkerCsv("marker_id,corner_index,x_px,y_px\n1,0,2,3")).toThrow(/detector_name and detector_version/);
  });

  it("rejects malformed JSON, invalid corner counts, duplicate IDs, bad corner order, and out-of-bounds points", () => {
    const board = generateFiducialBoard();
    const base = JSON.parse(exampleExternalDetectorJson(board));

    expect(() => parseExternalDetectorJson(JSON.stringify({ ...base, detector: undefined }), { board })).toThrow(/detector receipt/);
    expect(() => parseExternalDetectorJson(JSON.stringify({ ...base, detections: { markers: [{ id: 1, cornersPx: [[1, 1]] }] } }), { board })).toThrow(/four cornersPx/);
    expect(() => parseExternalDetectorJson(JSON.stringify({ ...base, detections: { markers: [
      { id: 1, cornersPx: [[10, 10], [20, 10], [20, 20], [10, 20]] },
      { id: 1, cornersPx: [[30, 30], [40, 30], [40, 40], [30, 40]] }
    ] } }), { board })).toThrow(/duplicate marker id/);
    expect(() => parseExternalDetectorJson(JSON.stringify({ ...base, detections: { markers: [{ id: 1, cornersPx: [[10, 10], [10, 20], [20, 20], [20, 10]] }] } }), { board })).toThrow(/ordered top-left/);
    expect(() => parseExternalDetectorJson(JSON.stringify({ ...base, detections: { markers: [{ id: 1, cornersPx: [[-1, 10], [20, 10], [20, 20], [10, 20]] }] } }), { board })).toThrow(/out of image bounds/);
  });

  it("warns on unknown IDs, board/image hash mismatch, low confidence, and insufficient coverage without blocking manual review", () => {
    const board = generateFiducialBoard();
    const payload = JSON.parse(exampleExternalDetectorJson(board));
    payload.board.boardHash = "mismatched-board-hash";
    payload.image.imageHash = "mismatched-image-hash";
    payload.detections.markers = [{ id: 999, cornersPx: [[10, 10], [30, 10], [30, 30], [10, 30]], confidence: 0.2 }];
    payload.detections.charucoCorners = [];
    const imported = parseExternalDetectorJson(JSON.stringify(payload), { board, expectedImageHash: board.image.imageHash, minConfidence: 0.8 });
    const codes = imported.warnings.map((warning) => warning.code);

    expect(codes).toContain("l76.detector.boardHashMismatch");
    expect(codes).toContain("l76.detector.imageHashMismatch");
    expect(codes).toContain("l76.detector.lowConfidence");
    expect(codes).toContain("l76.detector.unknownMarkerId");
    expect(codes).toContain("l76.detector.insufficientCoverage");
    expect(imported.detection.markers[0]?.id).toBe(999);
  });

  it("feeds imported detections through L7.5 manual correction, L7.2 fit, and L7.4 session QA", () => {
    const board = generateFiducialBoard();
    const imported = parseExternalDetectorJson(exampleExternalDetectorJson(board), { board });
    const selected = imported.detection.markers[0]!;
    const edited = applyExternalDetectorManualEdits({
      importResult: imported,
      board,
      edits: [{ type: "reject-marker", id: selected.id, reason: "operator review" }]
    });
    const fit = fitExternalDetectorImport({ importResult: edited, board, model: "similarity" });
    const manifest = parseL74SessionManifestCsv("frame_id,type,path_or_name,notes\next_001,fiducial_board,external_detector.json,L7.6 external detector bridge");
    const frame = l74FrameFromFiducialFit(manifest.rows[0]!, fit);
    const session = runL74SessionQa({ manifestHash: manifest.manifestHash, frames: [frame], warnings: manifest.warnings });

    expect(edited.detection.manualEdits).toHaveLength(1);
    expect(edited.detection.markers.find((marker) => marker.id === selected.id)?.status).toBe("rejected");
    expect(fit.fit?.model).toBe("similarity");
    expect(frame.type).toBe("fiducial_board");
    expect(session.aggregates.find((metric) => metric.metricId === "fiducial_marker_coverage")?.family).toBe("detection");
  });

  it("compares synthetic, imported, and manual-corrected detector sets with exports", () => {
    const board = generateFiducialBoard();
    const imported = parseExternalDetectorJson(exampleExternalDetectorJson(board), { board });
    const shifted = applyFiducialManualEdits(imported.detection, [
      {
        type: "move-marker-corner",
        id: imported.detection.markers[0]!.id,
        cornerIndex: 0,
        xPx: imported.detection.markers[0]!.cornersPx[0].xPx + 2,
        yPx: imported.detection.markers[0]!.cornersPx[0].yPx + 1
      }
    ]);
    const synthetic = generateSyntheticFiducialDetection(board, { missingMarkerIds: board.markers.slice(8).map((marker) => marker.id), noisePx: 0.02 });
    const comparison = compareExternalDetectors({
      board,
      model: "similarity",
      comparisonKind: "manual-corrected-vs-raw",
      a: shifted,
      b: imported
    });
    const syntheticComparison = compareExternalDetectors({ board, a: synthetic, b: imported, comparisonKind: "synthetic-vs-imported" });

    expect(comparison.schema).toBe("emmicro.l76.detectorComparison.v1");
    expect(comparison.matchedMarkerIds.length).toBeGreaterThan(0);
    expect(comparison.meanCornerDeltaPx).toBeGreaterThan(0);
    expect(comparison.maxCornerDeltaPx).toBeGreaterThanOrEqual(comparison.meanCornerDeltaPx ?? 0);
    expect(comparison.fitRmsDeltaPx).not.toBeNull();
    expect(detectorComparisonCsv(comparison)).toContain("delta_px");
    expect(detectorBridgeReportMarkdown(imported, comparison, comparison.fitB ?? undefined)).toContain("detector_bridge");
    expect(detectorBridgeReportJson(imported, syntheticComparison)).toContain("detectorComparison");
  });

  it("exports board detector instructions and preserves no-overclaim boundaries", () => {
    const board = generateFiducialBoard();
    const imported = parseExternalDetectorJson(exampleExternalDetectorJson(board), { board });
    const text = [
      detectorBridgeReportMarkdown(imported),
      externalDetectorBoardInstructionsMarkdown(board)
    ].join("\n");

    expect(text).toContain("browser-native OpenCV ArUco detector is not implemented");
    expect(text).toContain("AprilTag decoding is not implemented");
    expect(text).toContain("board_manifest.json");
    expect(text).toContain("detector_readme.md");
    expect(text).not.toMatch(/OpenCV detector executable|AprilTag decoder executable|certified camera calibration result|full 3D pose calibration result|stereo calibration result|hardware camera control implemented|full 3D Maxwell solved|digital twin certified|manufacturing certified/i);
  });

  it("ships detector scaffold examples that validate without requiring Python", () => {
    const repoRoot = resolve(testDir, "../../../..");
    const readme = readFileSync(resolve(repoRoot, "tools/detectors/README.md"), "utf8");
    const json = readFileSync(resolve(repoRoot, "tools/detectors/examples/example_detection.json"), "utf8");
    const csv = readFileSync(resolve(repoRoot, "tools/detectors/examples/example_marker_corners.csv"), "utf8");
    const board = generateFiducialBoard({ id: "l75-board-7x5" });

    expect(readme).toContain("Python/OpenCV is optional");
    expect(readme).toContain("browser-native OpenCV ArUco detector is not implemented");
    expect(parseExternalDetectorJson(json, { board }).schema).toBe("emmicro.l76.externalDetectorImport.v1");
    expect(parseExternalDetectorMarkerCsv(csv, { board }).schema).toBe("emmicro.l76.externalDetectorImport.v1");
  });
});
