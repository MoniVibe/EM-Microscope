#!/usr/bin/env python3
"""Optional OpenCV ChArUco detector runner for EMMicro L7.7.

The script runs outside the browser and emits canonical `emmicro.detector.v1`
JSON plus marker-corner CSV. It is not imported by npm tests and it is not a
certified calibration, hardware-control, AprilTag, or browser-native detector.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path
from typing import Any


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return f"sha256:{digest.hexdigest()}"


def script_hash() -> str:
    return sha256_file(Path(__file__).resolve())


def load_cv2() -> Any:
    try:
        import cv2  # type: ignore
    except Exception as exc:  # pragma: no cover - optional external tool
        raise SystemExit(
            "OpenCV is optional and not installed. Install with "
            "`python -m pip install -r tools/detectors/requirements-opencv.txt`."
        ) from exc
    if not hasattr(cv2, "aruco"):
        raise SystemExit("The installed cv2 package has no aruco module. Install opencv-contrib-python.")
    return cv2


def predefined_dictionary(cv2: Any, name: str) -> Any:
    dictionary_id = getattr(cv2.aruco, name, None)
    if dictionary_id is None:
        raise SystemExit(f"Unknown OpenCV ArUco dictionary: {name}")
    return cv2.aruco.getPredefinedDictionary(dictionary_id)


def make_charuco_board(cv2: Any, manifest: dict[str, Any], dictionary: Any) -> Any:
    squares_x = int(manifest["squaresX"])
    squares_y = int(manifest["squaresY"])
    square_length = float(manifest["squareLengthMm"])
    marker_length = float(manifest["markerLengthMm"])
    if hasattr(cv2.aruco, "CharucoBoard"):
        try:
            return cv2.aruco.CharucoBoard((squares_x, squares_y), square_length, marker_length, dictionary)
        except TypeError:
            pass
    if hasattr(cv2.aruco, "CharucoBoard_create"):
        return cv2.aruco.CharucoBoard_create(squares_x, squares_y, square_length, marker_length, dictionary)
    raise SystemExit("This OpenCV build does not expose a supported ChArUco board constructor.")


def detect_charuco(cv2: Any, image: Any, board: Any, dictionary: Any, corner_refinement: bool) -> tuple[Any, Any, Any, Any, list[str]]:
    warnings: list[str] = []
    parameters = cv2.aruco.DetectorParameters()
    if corner_refinement and hasattr(cv2.aruco, "CORNER_REFINE_SUBPIX"):
        parameters.cornerRefinementMethod = cv2.aruco.CORNER_REFINE_SUBPIX
    if hasattr(cv2.aruco, "CharucoDetector"):
        try:
            detector = cv2.aruco.CharucoDetector(board, cv2.aruco.CharucoParameters(), parameters)
            charuco_corners, charuco_ids, marker_corners, marker_ids = detector.detectBoard(image)
            return marker_corners, marker_ids, charuco_corners, charuco_ids, warnings
        except Exception as exc:
            warnings.append(f"Modern CharucoDetector path failed, falling back to aruco.detectMarkers: {exc}")
    marker_corners, marker_ids, _rejected = cv2.aruco.detectMarkers(image, dictionary, parameters=parameters)
    charuco_corners = None
    charuco_ids = None
    if marker_ids is not None and len(marker_ids):
        try:
            _count, charuco_corners, charuco_ids = cv2.aruco.interpolateCornersCharuco(marker_corners, marker_ids, image, board)
        except Exception as exc:
            warnings.append(f"interpolateCornersCharuco failed: {exc}")
    return marker_corners, marker_ids, charuco_corners, charuco_ids, warnings


def point_pair(value: Any) -> list[float]:
    flat = value.reshape(-1).tolist() if hasattr(value, "reshape") else list(value)
    return [round(float(flat[0]), 6), round(float(flat[1]), 6)]


def marker_payload(marker_corners: Any, marker_ids: Any) -> list[dict[str, Any]]:
    if marker_ids is None or marker_corners is None:
        return []
    ids = marker_ids.reshape(-1).tolist() if hasattr(marker_ids, "reshape") else list(marker_ids)
    markers: list[dict[str, Any]] = []
    for marker_id, corners in zip(ids, marker_corners):
        corner_rows = corners.reshape(4, 2) if hasattr(corners, "reshape") else corners
        markers.append({
            "id": int(marker_id),
            "cornersPx": [point_pair(corner) for corner in corner_rows],
            "confidence": 1.0,
        })
    return markers


def charuco_payload(charuco_corners: Any, charuco_ids: Any) -> list[dict[str, Any]]:
    if charuco_ids is None or charuco_corners is None:
        return []
    ids = charuco_ids.reshape(-1).tolist() if hasattr(charuco_ids, "reshape") else list(charuco_ids)
    corners = charuco_corners.reshape(-1, 2) if hasattr(charuco_corners, "reshape") else charuco_corners
    return [
        {"id": int(corner_id), "xPx": point_pair(corner)[0], "yPx": point_pair(corner)[1], "confidence": 1.0}
        for corner_id, corner in zip(ids, corners)
    ]


def write_marker_csv(path: Path, payload: dict[str, Any]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow([
            "frame_id",
            "marker_id",
            "corner_index",
            "x_px",
            "y_px",
            "confidence",
            "detector_name",
            "detector_version",
            "board_id",
            "board_hash",
            "image_hash",
            "image_width",
            "image_height",
        ])
        for marker in payload["detections"]["markers"]:
            for index, corner in enumerate(marker["cornersPx"]):
                writer.writerow([
                    payload["image"]["sourceName"],
                    marker["id"],
                    index,
                    corner[0],
                    corner[1],
                    marker.get("confidence", 1.0),
                    payload["detector"]["name"],
                    payload["detector"]["version"],
                    payload["board"]["boardId"],
                    payload["board"]["boardHash"],
                    payload["image"]["imageHash"],
                    payload["image"]["width"],
                    payload["image"]["height"],
                ])


def write_overlay(cv2: Any, path: Path, color_image: Any, marker_corners: Any, marker_ids: Any, charuco_corners: Any, charuco_ids: Any) -> None:
    overlay = color_image.copy()
    if marker_ids is not None and marker_corners is not None and len(marker_corners):
        cv2.aruco.drawDetectedMarkers(overlay, marker_corners, marker_ids)
    if charuco_ids is not None and charuco_corners is not None and len(charuco_corners):
        cv2.aruco.drawDetectedCornersCharuco(overlay, charuco_corners, charuco_ids)
    if not cv2.imwrite(str(path), overlay):
        raise SystemExit(f"Failed to write overlay image: {path}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Detect OpenCV ChArUco markers and emit EMMicro detector JSON.")
    parser.add_argument("--image", required=True, help="Input image path.")
    parser.add_argument("--board-manifest", required=True, help="OpenCV ChArUco board manifest JSON.")
    parser.add_argument("--dictionary", default=None, help="OpenCV dictionary name; defaults to manifest dictionary.")
    parser.add_argument("--out-json", required=True, help="Output emmicro.detector.v1 JSON path.")
    parser.add_argument("--out-csv", default=None, help="Optional output marker-corner CSV path.")
    parser.add_argument("--out-overlay", default=None, help="Optional overlay PNG path.")
    parser.add_argument("--no-corner-refinement", action="store_true", help="Disable subpixel marker corner refinement.")
    args = parser.parse_args()

    cv2 = load_cv2()
    image_path = Path(args.image)
    manifest_path = Path(args.board_manifest)
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    dictionary_name = args.dictionary or manifest.get("dictionary") or "DICT_4X4_50"
    dictionary = predefined_dictionary(cv2, dictionary_name)
    board = make_charuco_board(cv2, manifest, dictionary)

    color = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
    if color is None:
        raise SystemExit(f"Could not read image: {image_path}")
    gray = cv2.cvtColor(color, cv2.COLOR_BGR2GRAY)
    corner_refinement = not args.no_corner_refinement
    marker_corners, marker_ids, charuco_corners, charuco_ids, warnings = detect_charuco(cv2, gray, board, dictionary, corner_refinement)
    height, width = gray.shape[:2]
    payload = {
        "version": "emmicro.detector.v1",
        "detector": {
            "name": "opencv-charuco",
            "version": str(getattr(cv2, "__version__", "unknown")),
            "runnerHash": script_hash(),
            "parameters": {
                "dictionary": dictionary_name,
                "cornerRefinement": corner_refinement,
                "boardManifest": str(manifest_path),
                "source": "tools/detectors/opencv_charuco_detect.py",
            },
        },
        "image": {
            "sourceName": image_path.name,
            "imageHash": sha256_file(image_path),
            "width": int(width),
            "height": int(height),
        },
        "board": {
            "boardId": str(manifest["boardId"]),
            "boardHash": str(manifest["boardHash"]),
        },
        "detections": {
            "markers": marker_payload(marker_corners, marker_ids),
            "charucoCorners": charuco_payload(charuco_corners, charuco_ids),
        },
        "warnings": warnings,
    }
    out_json = Path(args.out_json)
    out_json.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    if args.out_csv:
        write_marker_csv(Path(args.out_csv), payload)
    if args.out_overlay:
        write_overlay(cv2, Path(args.out_overlay), color, marker_corners, marker_ids, charuco_corners, charuco_ids)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
