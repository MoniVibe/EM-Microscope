import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createDetectorRoundTripAcceptance,
  detectorRoundTripMetricsCsv,
  detectorRoundTripReportJson,
  detectorRoundTripReportMarkdown,
  detectorRoundTripWarningsJson,
  defaultL78RoundTripThresholds
} from "./detectorRoundTrip";
import {
  fitExternalDetectorImport,
  parseExternalDetectorJson,
  parseExternalDetectorMarkerCsv,
  type L76ExternalDetectorImportResult
} from "./externalDetectorBridge";
import {
  generateFiducialBoard,
  generateSyntheticFiducialDetection,
  type L75FiducialBoard,
  type L75FiducialFitResult
} from "./fiducialBoard";
import {
  l74FrameFromFiducialFit,
  parseL74SessionManifestCsv,
  runL74SessionQa,
  type L74SessionQaResult
} from "../workspace/batchSessionQa";

const testDir = fileURLToPath(new URL(".", import.meta.url));

describe("L7.8 detector round-trip acceptance", () => {
  it("passes a clean detector round trip under default thresholds", () => {
    const context = roundTripContext("clean");
    const report = createDetectorRoundTripAcceptance({ ...context, fixtureKind: "clean" });

    expect(report.schema).toBe("emmicro.l78.detectorRoundTripAcceptance.v1");
    expect(report.appVersion).toContain("L7.8");
    expect(report.status).toBe("pass");
    expect(report.metrics.detectorReceipt).toBe("pass");
    expect(report.metrics.boardHashStatus).toBe("match");
    expect(report.metrics.imageHashStatus).toBe("match");
    expect(report.metrics.acceptedMarkers).toBeGreaterThanOrEqual(defaultL78RoundTripThresholds().minMarkers);
    expect(report.metrics.acceptedCharucoCorners).toBeGreaterThanOrEqual(defaultL78RoundTripThresholds().minCharucoCorners);
    expect(report.metrics.fitRmsPx).not.toBeNull();
    expect(report.metrics.sessionQaStatus).toBe("pass");
    expect(report.steps.map((step) => step.label)).toContain("Export board manifest / printable board");
    expect(report.steps.map((step) => step.label)).toContain("Export round-trip evidence");
    expect(detectorRoundTripReportMarkdown(report)).toContain("roundtrip_report.md");
    expect(detectorRoundTripReportJson(report)).toContain("detectorReceipt");
    expect(detectorRoundTripMetricsCsv(report)).toContain("fitRmsPx");
    expect(detectorRoundTripWarningsJson(report)).toBe("[]");
  });

  it("warns on partial-view lower coverage without claiming detector failure", () => {
    const context = roundTripContext("partial-view");
    const report = createDetectorRoundTripAcceptance({ ...context, fixtureKind: "partial-view", thresholds: { allowPartialView: true, minMarkers: 8, minCharucoCorners: 12, minCoverage: 0.7 } });

    expect(report.status).toBe("warning");
    expect(report.steps.find((step) => step.id === "id-match")?.status).toBe("warning");
    expect(report.warnings.map((warning) => warning.code)).toEqual(expect.arrayContaining(["l78.roundtrip.minMarkers", "l78.roundtrip.minCoverage"]));
    expect(detectorRoundTripReportMarkdown(report)).toContain("partial-view warning");
  });

  it("warns on blur/noise lower confidence and elevated fit residual", () => {
    const context = roundTripContext("blur-noise");
    const report = createDetectorRoundTripAcceptance({ ...context, fixtureKind: "blur-noise", thresholds: { minMeanConfidence: 0.85, maxFitRmsPx: 0.08, maxFitMaxResidualPx: 0.25 } });
    const warningCodes = report.warnings.map((warning) => warning.code);

    expect(report.status).toBe("fail");
    expect(warningCodes).toContain("l78.roundtrip.lowMeanConfidence");
    expect(warningCodes).toContain("l78.roundtrip.fitRmsExceeded");
    expect(report.steps.find((step) => step.id === "geometry-fit")?.status).toBe("fail");
  });

  it("fails receipt validation when board or image hashes mismatch", () => {
    const context = roundTripContext("clean", { mismatchHashes: true });
    const report = createDetectorRoundTripAcceptance({ ...context, fixtureKind: "custom" });

    expect(report.status).toBe("fail");
    expect(report.metrics.detectorReceipt).toBe("fail");
    expect(report.metrics.boardHashStatus).toBe("mismatch");
    expect(report.metrics.imageHashStatus).toBe("mismatch");
    expect(report.warnings.map((warning) => warning.code)).toEqual(expect.arrayContaining(["l78.roundtrip.boardHashMismatch", "l78.roundtrip.imageHashMismatch"]));
  });

  it("preserves boundaries in round-trip exports", () => {
    const context = roundTripContext("clean");
    const report = createDetectorRoundTripAcceptance({ ...context, fixtureKind: "clean" });
    const text = [detectorRoundTripReportMarkdown(report), detectorRoundTripReportJson(report)].join("\n");

    expect(text).toContain("not add browser-native OpenCV.js");
    expect(text).toContain("AprilTag decoding");
    expect(text).toContain("not certified camera calibration");
    expect(text).toContain("full 3D pose/stereo calibration");
    expect(text).not.toMatch(/browser-native OpenCV.js detector executable|AprilTag decoder executable|certified camera calibration result|full 3D pose calibration result|stereo calibration result|digital twin certified|manufacturing certified|full 3D Maxwell solved/i);
  });
});

describe("L7.8 detector round-trip shipped fixtures", () => {
  it("ships clean, partial-view, and blur/noise fixture detections with expected summaries", () => {
    const fixtureRoot = resolve(testDir, "../../../../tools/detectors/examples/l78_roundtrip");
    const detectorToolRoot = resolve(testDir, "../../../../tools/detectors");
    const expectedFit = JSON.parse(readFileSync(resolve(fixtureRoot, "expected_fit_summary.json"), "utf8")) as Record<string, { acceptanceStatus: string }>;
    const expectedSession = JSON.parse(readFileSync(resolve(fixtureRoot, "expected_session_summary.json"), "utf8")) as Record<string, { acceptanceStatus: string }>;

    for (const name of [
      "board_manifest.json",
      "board_print.png",
      "synthetic_capture_clean.png",
      "synthetic_capture_perspective.png",
      "synthetic_capture_blur_noise.png",
      "detection_clean.json",
      "detection_perspective.json",
      "detection_blur_noise.json",
      "marker_corners_clean.csv",
      "marker_corners_perspective.csv",
      "marker_corners_blur_noise.csv",
      "README.md"
    ]) {
      expect(existsSync(resolve(fixtureRoot, name))).toBe(true);
    }
    expect(existsSync(resolve(detectorToolRoot, "run_roundtrip_example.py"))).toBe(true);
    expect(expectedFit.clean?.acceptanceStatus).toBe("pass");
    expect(expectedFit["partial-view"]?.acceptanceStatus).toBe("warning");
    expect(expectedFit["blur-noise"]?.acceptanceStatus).toBe("fail");
    expect(expectedSession.clean?.acceptanceStatus).toBe("pass");
  });

  it("imports fixture JSON and CSV files through the L7.7 bridge and reports L7.8 acceptance", () => {
    const fixtureRoot = resolve(testDir, "../../../../tools/detectors/examples/l78_roundtrip");
    const board = generateFiducialBoard({ id: "l75-board-7x5" });
    const cleanJson = readFileSync(resolve(fixtureRoot, "detection_clean.json"), "utf8");
    const partialJson = readFileSync(resolve(fixtureRoot, "detection_perspective.json"), "utf8");
    const blurJson = readFileSync(resolve(fixtureRoot, "detection_blur_noise.json"), "utf8");
    const cleanCsv = readFileSync(resolve(fixtureRoot, "marker_corners_clean.csv"), "utf8");

    const clean = parseExternalDetectorJson(cleanJson, { board, expectedBoardHash: board.resultHash, expectedImageHash: board.image.imageHash, minConfidence: 0.8 });
    const partial = parseExternalDetectorJson(partialJson, { board, expectedBoardHash: board.resultHash, expectedImageHash: board.image.imageHash, minConfidence: 0.8 });
    const blur = parseExternalDetectorJson(blurJson, { board, expectedBoardHash: board.resultHash, expectedImageHash: board.image.imageHash, minConfidence: 0.8 });
    const cleanCsvImport = parseExternalDetectorMarkerCsv(cleanCsv, { board, expectedBoardHash: board.resultHash, expectedImageHash: board.image.imageHash });
    const cleanReport = acceptanceFromImport(board, clean, "clean", {});
    const partialReport = acceptanceFromImport(board, partial, "partial-view", { allowPartialView: true, minMarkers: 8, minCharucoCorners: 12, minCoverage: 0.7 });
    const blurReport = acceptanceFromImport(board, blur, "blur-noise", { minMeanConfidence: 0.85, maxFitRmsPx: 0.08, maxFitMaxResidualPx: 0.25 });

    expect(clean.detector.version).toBe("l78-clean-fixture");
    expect(cleanCsvImport.sourceFormat).toBe("csv");
    expect(cleanCsvImport.detection.markers.length).toBeGreaterThanOrEqual(4);
    expect(cleanReport.status).toBe("pass");
    expect(partialReport.status).toBe("warning");
    expect(partialReport.warnings.map((warning) => warning.code)).toContain("l78.roundtrip.minCoverage");
    expect(blurReport.status).toBe("fail");
    expect(blurReport.warnings.map((warning) => warning.code)).toContain("l78.roundtrip.lowMeanConfidence");
  });
});

type FixtureKind = "clean" | "partial-view" | "blur-noise";

function roundTripContext(kind: FixtureKind, options: { mismatchHashes?: boolean } = {}): {
  board: L75FiducialBoard;
  importResult: L76ExternalDetectorImportResult;
  fit: L75FiducialFitResult;
  sessionQa: L74SessionQaResult;
} {
  const board = generateFiducialBoard({ id: "l75-board-7x5" });
  const payload = detectorPayload(board, kind);
  const importResult = parseExternalDetectorJson(JSON.stringify(payload), {
    board,
    expectedBoardHash: options.mismatchHashes ? "expected-board-hash" : board.resultHash,
    expectedImageHash: options.mismatchHashes ? "expected-image-hash" : board.image.imageHash,
    minConfidence: 0.8
  });
  const fit = fitExternalDetectorImport({ importResult, board, model: "similarity" });
  const manifest = parseL74SessionManifestCsv(`frame_id,type,path_or_name,notes\n${kind},fiducial_board,${kind}.json,L7.8 round-trip fixture`);
  const frame = l74FrameFromFiducialFit(manifest.rows[0]!, fit);
  const sessionQa = runL74SessionQa({ manifestHash: manifest.manifestHash, frames: [frame], warnings: manifest.warnings });
  return { board, importResult, fit, sessionQa };
}

function acceptanceFromImport(board: L75FiducialBoard, importResult: L76ExternalDetectorImportResult, fixtureKind: FixtureKind, thresholds: Parameters<typeof createDetectorRoundTripAcceptance>[0]["thresholds"]) {
  const fit = fitExternalDetectorImport({ importResult, board, model: "similarity" });
  const manifest = parseL74SessionManifestCsv(`frame_id,type,path_or_name,notes\n${fixtureKind},fiducial_board,${fixtureKind}.json,L7.8 fixture`);
  const frame = l74FrameFromFiducialFit(manifest.rows[0]!, fit);
  const sessionQa = runL74SessionQa({ manifestHash: manifest.manifestHash, frames: [frame], warnings: manifest.warnings });
  return createDetectorRoundTripAcceptance({ board, importResult, fit, sessionQa, fixtureKind, thresholds });
}

function detectorPayload(board: L75FiducialBoard, kind: FixtureKind): unknown {
  const synthetic = generateSyntheticFiducialDetection(board, {
    frameId: `synthetic_capture_${kind.replace("-", "_")}.png`,
    includeCharucoCorners: true,
    missingMarkerIds: kind === "partial-view" ? board.markers.slice(4).map((marker) => marker.id) : [],
    noisePx: kind === "blur-noise" ? 0.3 : 0
  });
  const markerLimit = kind === "partial-view" ? 4 : synthetic.markers.length;
  const charucoLimit = kind === "partial-view" ? 6 : synthetic.charucoCorners.length;
  const confidence = kind === "blur-noise" ? 0.65 : kind === "partial-view" ? 0.92 : 0.99;
  return {
    version: "emmicro.detector.v1",
    detector: {
      name: "opencv-charuco",
      version: `l78-${kind}-fixture`,
      runnerHash: `l78-${kind}-runner-fnv1a64`,
      parameters: {
        pythonVersion: "fixture-python-3.x",
        opencvVersion: "fixture-opencv-4.x",
        dictionary: "DICT_4X4_50",
        cornerRefinement: true,
        detectorParameters: kind
      }
    },
    image: {
      sourceName: synthetic.frameId,
      imageHash: board.image.imageHash,
      width: board.image.widthPx,
      height: board.image.heightPx
    },
    board: {
      boardId: board.id,
      boardHash: board.resultHash
    },
    detections: {
      markers: synthetic.markers.slice(0, markerLimit).map((marker) => ({
        id: marker.id,
        cornersPx: marker.cornersPx.map((corner, cornerIndex) => [
          corner.xPx + (kind === "blur-noise" ? (cornerIndex % 2 === 0 ? 0.32 : -0.22) : 0),
          corner.yPx + (kind === "blur-noise" ? (cornerIndex % 2 === 0 ? -0.18 : 0.28) : 0)
        ]),
        confidence
      })),
      charucoCorners: synthetic.charucoCorners.slice(0, charucoLimit).map((corner, index) => ({
        id: corner.id,
        xPx: corner.xPx + (kind === "blur-noise" ? (index % 2 === 0 ? 0.2 : -0.2) : 0),
        yPx: corner.yPx + (kind === "blur-noise" ? (index % 2 === 0 ? -0.2 : 0.2) : 0),
        confidence
      }))
    },
    warnings: kind === "blur-noise"
      ? [{ code: "fixture.blurNoise", message: "Synthetic blur/noise fixture has lowered confidence and residual stress." }]
      : kind === "partial-view"
        ? [{ code: "fixture.partialView", message: "Synthetic partial-view fixture intentionally omits board coverage." }]
        : []
  };
}
