import { describe, expect, it } from "vitest";
import {
  applyFiducialManualEdits,
  fiducialBoardManifestJson,
  fiducialDetectionReportJson,
  fiducialDetectionReportMarkdown,
  fiducialMatchedPointsCsv,
  fiducialRejectedPointsCsv,
  fitFiducialBoardDetection,
  generateFiducialBoard,
  generateSyntheticFiducialDetection,
  matchFiducialBoardDetection,
  parseFiducialCharucoCsv,
  parseFiducialDetectionJson,
  parseFiducialMarkerCsv
} from "./fiducialBoard";
import { l74FrameFromFiducialFit, parseL74SessionManifestCsv, runL74SessionQa } from "../workspace/batchSessionQa";

describe("L7.5 fiducial board generation", () => {
  it("generates deterministic board IDs, marker IDs, world coordinates, and manifest hashes", () => {
    const first = generateFiducialBoard({ squaresX: 7, squaresY: 5, squareSizeMm: 10, markerSizeFraction: 0.65 });
    const second = generateFiducialBoard({ squaresX: 7, squaresY: 5, squareSizeMm: 10, markerSizeFraction: 0.65 });

    expect(first.resultHash).toBe(second.resultHash);
    expect(first.markers).toHaveLength(35);
    expect(first.charucoCorners).toHaveLength(48);
    expect(first.markers[0]).toMatchObject({ id: 0, row: 0, col: 0 });
    expect(first.markers[34]).toMatchObject({ id: 34, row: 4, col: 6 });
    expect(first.markers[0]?.cornersWorldUm[0]).toMatchObject({ xWorldUm: -33250, yWorldUm: -23250 });
    expect(first.charucoCorners[0]).toMatchObject({ id: 0, xWorldUm: -35000, yWorldUm: -25000 });
    expect(first.image.imageHash).toMatch(/^[0-9a-f]+$/);
    expect(fiducialBoardManifestJson(first)).toContain("diagnostic-synthetic-4x4");
  });
});

describe("L7.5 fiducial detection import", () => {
  it("imports marker-corner CSV with deterministic source hash", () => {
    const csv = [
      "frame_id,marker_id,corner_index,x_px,y_px",
      "frame_001,12,0,123.4,85.1",
      "frame_001,12,1,145.2,85.8",
      "frame_001,12,2,145.6,108.0",
      "frame_001,12,3,123.1,107.4"
    ].join("\n");
    const first = parseFiducialMarkerCsv(csv);
    const second = parseFiducialMarkerCsv(csv);

    expect(first.sourceHash).toBe(second.sourceHash);
    expect(first.markers).toHaveLength(1);
    expect(first.markers[0]?.id).toBe(12);
    expect(first.markers[0]?.cornersPx[2]).toMatchObject({ xPx: 145.6, yPx: 108 });
  });

  it("imports ChArUco-style corner CSV and JSON detection bundles", () => {
    const csv = [
      "frame_id,charuco_corner_id,x_px,y_px",
      "frame_001,37,184.2,210.8",
      "frame_001,38,194.2,210.4"
    ].join("\n");
    const charuco = parseFiducialCharucoCsv(csv);
    const json = parseFiducialDetectionJson(JSON.stringify({
      frameId: "frame_001",
      boardId: "board_7x5_v1",
      markers: [{ id: 12, cornersPx: [[123.4, 85.1], [145.2, 85.8], [145.6, 108.0], [123.1, 107.4]] }],
      charucoCorners: [{ id: 37, xPx: 184.2, yPx: 210.8 }]
    }));

    expect(charuco.charucoCorners).toHaveLength(2);
    expect(json.boardId).toBe("board_7x5_v1");
    expect(json.markers[0]?.source).toBe("imported");
  });

  it("rejects duplicate IDs and missing required columns clearly", () => {
    expect(() => parseFiducialMarkerCsv("frame_id,marker_id,x_px,y_px\nf,1,2,3")).toThrow(/corner_index/);
    expect(() => parseFiducialMarkerCsv("frame_id,marker_id,corner_index,x_px,y_px\nf,1,0,2,3\nf,1,0,4,5")).toThrow(/duplicate marker\/corner/);
    expect(() => parseFiducialCharucoCsv("frame_id,charuco_corner_id,x_px,y_px\nf,7,2,3\nf,7,4,5")).toThrow(/duplicate corner id/);
    expect(() => parseFiducialDetectionJson(JSON.stringify({
      frameId: "f",
      markers: [
        { id: 2, cornersPx: [[1, 1], [2, 1], [2, 2], [1, 2]] },
        { id: 2, cornersPx: [[3, 3], [4, 3], [4, 4], [3, 4]] }
      ]
    }))).toThrow(/duplicate marker id/);
  });
});

describe("L7.5 fiducial matching, fitting, review, and session handoff", () => {
  it("matches partial-view detections to board coordinates and feeds similarity/affine fits", () => {
    const board = generateFiducialBoard();
    const detection = generateSyntheticFiducialDetection(board, { droppedMarkerModulo: 3, noisePx: 0.02 });
    const match = matchFiducialBoardDetection({ board, detection });
    const similarity = fitFiducialBoardDetection({ board, detection, model: "similarity" });
    const affine = fitFiducialBoardDetection({ board, detection, model: "affine" });

    expect(match.matchedPointCount).toBeGreaterThan(20);
    expect(match.missingMarkerIds.length).toBeGreaterThan(0);
    expect(match.coverageScore).toBeGreaterThan(0.3);
    expect(match.pointSet.schema).toBe("emmicro.l72.pointSet.v1");
    expect(similarity.fit?.model).toBe("similarity");
    expect(similarity.fit?.pointCount).toBe(match.matchedPointCount);
    expect(affine.fit?.model).toBe("affine");
  });

  it("warns on too few points, poor coverage, and radial-fit coverage limits", () => {
    const board = generateFiducialBoard();
    const detection = generateSyntheticFiducialDetection(board, { missingMarkerIds: board.markers.slice(1).map((marker) => marker.id), includeCharucoCorners: false });
    const match = matchFiducialBoardDetection({ board, detection });

    expect(match.warnings.map((warning) => warning.code)).toContain("l75.match.poorBoardCoverage");
    expect(match.warnings.map((warning) => warning.code)).toContain("l75.match.concentratedCoverage");
    expect(match.warnings.map((warning) => warning.code)).toContain("l75.match.radialCoverageLow");
  });

  it("applies manual accept/reject/move/relabel edits and updates residual evidence", () => {
    const board = generateFiducialBoard();
    const detection = generateSyntheticFiducialDetection(board, { missingMarkerIds: [0, 1, 2], noisePx: 0 });
    const edited = applyFiducialManualEdits(detection, [
      { type: "reject-marker", id: 3, reason: "operator rejected edge marker" },
      { type: "move-marker-corner", id: 4, cornerIndex: 0, xPx: detection.markers.find((marker) => marker.id === 4)!.cornersPx[0].xPx + 1.5, yPx: detection.markers.find((marker) => marker.id === 4)!.cornersPx[0].yPx },
      { type: "relabel-marker", id: 5, nextId: 1 }
    ]);
    const fit = fitFiducialBoardDetection({ board, detection: edited, model: "similarity" });

    expect(edited.manualEdits).toHaveLength(3);
    expect(edited.markers.find((marker) => marker.id === 3)?.status).toBe("rejected");
    expect(edited.markers.find((marker) => marker.id === 1)?.originalId).toBe(5);
    expect(fit.fit?.metrics.rmsResidualPx).toBeGreaterThan(0);
  });

  it("exports reports and adds fiducial frame metrics to L7.4 session QA", () => {
    const board = generateFiducialBoard();
    const detection = generateSyntheticFiducialDetection(board, { droppedMarkerModulo: 4 });
    const fit = fitFiducialBoardDetection({ board, detection, model: "similarity" });
    const { rows, manifestHash } = parseL74SessionManifestCsv("frame_id,type,path_or_name\nfid_001,fiducial_board,fiducial.json");
    const frame = l74FrameFromFiducialFit(rows[0]!, fit);
    const session = runL74SessionQa({ manifestHash, frames: [frame] });

    expect(fiducialDetectionReportMarkdown(fit)).toContain("diagnostic");
    expect(fiducialDetectionReportJson(fit)).toContain("fiducialFit");
    expect(fiducialMatchedPointsCsv(fit)).toContain("x_world_um");
    expect(fiducialRejectedPointsCsv(detection)).toContain("kind,id");
    expect(frame.type).toBe("fiducial_board");
    expect(frame.metrics.find((metric) => metric.id === "fiducial_marker_coverage")?.value).toBeGreaterThan(0);
    expect(session.aggregates.find((metric) => metric.metricId === "fiducial_board_area_coverage")?.family).toBe("detection");
  });
});

describe("L7.5 boundaries", () => {
  it("does not claim OpenCV/AprilTag compatibility, certified calibration, full pose, stereo, hardware control, or 3D Maxwell execution", () => {
    const board = generateFiducialBoard();
    const detection = generateSyntheticFiducialDetection(board);
    const fit = fitFiducialBoardDetection({ board, detection });
    const text = `${fiducialBoardManifestJson(board)}\n${fiducialDetectionReportMarkdown(fit)}`;

    expect(text).toContain("not OpenCV-compatible");
    expect(text).toContain("AprilTag decoding");
    expect(text).toContain("not certified camera calibration");
    expect(text).toContain("not implement full 3D pose calibration");
    expect(text).not.toMatch(/OpenCV-compatible ArUco detector|AprilTag decoder executable|certified camera calibration result|full 3D pose calibration result|stereo calibration result|hardware camera control implemented|full 3D Maxwell solved|FDTD solved|digital twin certified|manufacturing certified/i);
  });
});
