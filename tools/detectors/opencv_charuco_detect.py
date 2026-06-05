#!/usr/bin/env python3
"""Optional L7.6 external detector runner template.

This template is intentionally outside the npm test path. It sketches how a local
OpenCV script can emit EMMicro's `emmicro.detector.v1` receipt schema, but it is
not a browser-native detector and it is not bundled as a certified calibration
or AprilTag/ArUco implementation.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Emit an EMMicro external detector JSON skeleton.")
    parser.add_argument("--image", required=True, help="Input image path.")
    parser.add_argument("--board-id", required=True, help="Board manifest ID.")
    parser.add_argument("--board-hash", required=True, help="Board manifest hash.")
    parser.add_argument("--image-hash", required=True, help="Precomputed image hash.")
    parser.add_argument("--width", type=int, required=True, help="Image width in pixels.")
    parser.add_argument("--height", type=int, required=True, help="Image height in pixels.")
    parser.add_argument("--out", required=True, help="Output JSON path.")
    parser.add_argument("--detector-name", default="opencv-charuco")
    parser.add_argument("--detector-version", default="external-template")
    args = parser.parse_args()

    try:
        import cv2  # noqa: F401
    except Exception as exc:
        raise SystemExit(
            "OpenCV is optional and not installed in this environment. Install cv2 locally or replace this template "
            "with your own detector runner before using it."
        ) from exc

    payload = {
        "version": "emmicro.detector.v1",
        "detector": {
            "name": args.detector_name,
            "version": args.detector_version,
            "runnerHash": "template-runner-hash",
            "parameters": {"source": "tools/detectors/opencv_charuco_detect.py"},
        },
        "image": {
            "sourceName": Path(args.image).name,
            "imageHash": args.image_hash,
            "width": args.width,
            "height": args.height,
        },
        "board": {
            "boardId": args.board_id,
            "boardHash": args.board_hash,
        },
        "detections": {
            "markers": [],
            "charucoCorners": [],
        },
        "warnings": [
            "Template emitted no detections. Replace with project-specific OpenCV ChArUco extraction before use."
        ],
    }
    Path(args.out).write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
