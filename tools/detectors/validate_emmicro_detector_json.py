#!/usr/bin/env python3
"""Validate the EMMicro external detector JSON shape without OpenCV."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def require_string(value: Any, label: str) -> str:
    require(isinstance(value, str) and bool(value.strip()), f"{label} must be a non-empty string")
    return value


def require_number(value: Any, label: str) -> float:
    require(isinstance(value, (int, float)) and not isinstance(value, bool), f"{label} must be numeric")
    return float(value)


def validate_marker(marker: dict[str, Any], index: int) -> None:
    require_number(marker.get("id"), f"detections.markers[{index}].id")
    corners = marker.get("cornersPx")
    require(isinstance(corners, list) and len(corners) == 4, f"detections.markers[{index}].cornersPx must have four points")
    for corner_index, corner in enumerate(corners):
        require(isinstance(corner, list) and len(corner) >= 2, f"marker {index} corner {corner_index} must be [x,y]")
        require_number(corner[0], f"marker {index} corner {corner_index} x")
        require_number(corner[1], f"marker {index} corner {corner_index} y")


def validate_charuco(corner: dict[str, Any], index: int) -> None:
    require_number(corner.get("id"), f"detections.charucoCorners[{index}].id")
    require_number(corner.get("xPx"), f"detections.charucoCorners[{index}].xPx")
    require_number(corner.get("yPx"), f"detections.charucoCorners[{index}].yPx")


def validate(payload: dict[str, Any]) -> None:
    require(payload.get("version") == "emmicro.detector.v1", "version must be emmicro.detector.v1")
    detector = payload.get("detector")
    require(isinstance(detector, dict), "detector receipt is required")
    require_string(detector.get("name"), "detector.name")
    require_string(detector.get("version"), "detector.version")
    image = payload.get("image")
    require(isinstance(image, dict), "image receipt is required")
    require_string(image.get("sourceName"), "image.sourceName")
    require_string(image.get("imageHash"), "image.imageHash")
    require_number(image.get("width"), "image.width")
    require_number(image.get("height"), "image.height")
    board = payload.get("board")
    require(isinstance(board, dict), "board receipt is required")
    require_string(board.get("boardId"), "board.boardId")
    require_string(board.get("boardHash"), "board.boardHash")
    detections = payload.get("detections")
    require(isinstance(detections, dict), "detections is required")
    markers = detections.get("markers", [])
    charuco = detections.get("charucoCorners", [])
    require(isinstance(markers, list), "detections.markers must be a list")
    require(isinstance(charuco, list), "detections.charucoCorners must be a list")
    for index, marker in enumerate(markers):
        require(isinstance(marker, dict), f"detections.markers[{index}] must be an object")
        validate_marker(marker, index)
    for index, corner in enumerate(charuco):
        require(isinstance(corner, dict), f"detections.charucoCorners[{index}] must be an object")
        validate_charuco(corner, index)


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate an EMMicro emmicro.detector.v1 JSON file.")
    parser.add_argument("--json", required=True, help="Detector JSON path.")
    args = parser.parse_args()
    payload = json.loads(Path(args.json).read_text(encoding="utf-8"))
    validate(payload)
    print("valid emmicro.detector.v1")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
