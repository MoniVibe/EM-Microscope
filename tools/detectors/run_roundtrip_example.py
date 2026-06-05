#!/usr/bin/env python3
"""Optional L7.8 detector round-trip fixture runner.

This helper packages the shipped L7.8 fixtures into a reproducible report. It
does not run during npm tests/build, and it does not require OpenCV unless a
future caller wires in an actual detector invocation outside the browser app.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path
from shutil import copy2
from typing import Any


FIXTURE_NAMES = {
    "clean": {
        "image": "synthetic_capture_clean.png",
        "json": "detection_clean.json",
        "csv": "marker_corners_clean.csv",
        "report": "roundtrip_report_clean.json",
    },
    "partial-view": {
        "image": "synthetic_capture_perspective.png",
        "json": "detection_perspective.json",
        "csv": "marker_corners_perspective.csv",
        "report": "roundtrip_report_partial_view.json",
    },
    "blur-noise": {
        "image": "synthetic_capture_blur_noise.png",
        "json": "detection_blur_noise.json",
        "csv": "marker_corners_blur_noise.csv",
        "report": "roundtrip_report_blur_noise.json",
    },
}


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the optional L7.8 detector round-trip fixture pack.")
    parser.add_argument("--fixture", choices=sorted(FIXTURE_NAMES), default="clean")
    parser.add_argument("--fixture-dir", type=Path, default=Path(__file__).parent / "examples" / "l78_roundtrip")
    parser.add_argument("--out-dir", type=Path, default=Path("artifacts") / "l78_roundtrip")
    args = parser.parse_args()

    fixture_dir = args.fixture_dir.resolve()
    out_dir = args.out_dir.resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    names = FIXTURE_NAMES[args.fixture]
    board_manifest = read_json(fixture_dir / "board_manifest.json")
    detection = read_json(fixture_dir / names["json"])
    report = read_json(fixture_dir / names["report"])
    marker_rows = read_csv(fixture_dir / names["csv"])

    copied = []
    for filename in ["board_manifest.json", "board_print.png", names["image"], names["json"], names["csv"], names["report"]]:
        src = fixture_dir / filename
        dst = out_dir / filename
        copy2(src, dst)
        copied.append({"file": filename, "sha256": sha256_file(dst)})

    summary = {
        "schema": "emmicro.l78.roundtrip_cli_fixture.v1",
        "fixture": args.fixture,
        "status": report.get("status", "unknown"),
        "boardId": board_manifest.get("boardId"),
        "boardHash": board_manifest.get("boardHash"),
        "boardImageHash": board_manifest.get("boardImageHash"),
        "detector": detection.get("detector", {}),
        "image": detection.get("image", {}),
        "detectedMarkers": len(detection.get("detections", {}).get("markers", [])),
        "detectedCharucoCorners": len(detection.get("detections", {}).get("charucoCorners", [])),
        "markerCsvRows": max(0, len(marker_rows) - 1),
        "acceptanceMetrics": report.get("metrics", {}),
        "copied": copied,
        "limitations": [
            "Fixture runner only; no browser-native OpenCV.js detector is executed.",
            "OpenCV/AprilTag decoding, certified calibration, lab metrology, full 3D pose/stereo calibration, hardware control, digital twins, manufacturing certification, and full 3D Maxwell/FDTD/FEM/BEM/RCWA are not implemented here.",
        ],
    }
    (out_dir / "roundtrip_report.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    (out_dir / "roundtrip_report.md").write_text(markdown(summary), encoding="utf-8")
    print(json.dumps({"status": summary["status"], "outDir": str(out_dir), "report": str(out_dir / "roundtrip_report.json")}, indent=2))
    return 0


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path) -> list[list[str]]:
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.reader(handle))


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def markdown(summary: dict[str, Any]) -> str:
    metrics = summary["acceptanceMetrics"]
    lines = [
        f"# L7.8 Detector Round-Trip Fixture: {summary['fixture']}",
        "",
        f"Status: {str(summary['status']).upper()}",
        f"Board: {summary['boardId']}",
        f"Board hash: {summary['boardHash']}",
        f"Image hash: {summary['image'].get('imageHash', 'n/a')}",
        f"Detected markers: {summary['detectedMarkers']}",
        f"Detected ChArUco corners: {summary['detectedCharucoCorners']}",
        f"Coverage score: {metrics.get('coverageScore', 'n/a')}",
        f"Fit RMS px: {metrics.get('fitRmsPx', 'n/a')}",
        f"Session QA: {metrics.get('sessionQaStatus', 'n/a')}",
        "",
        "## Copied Files",
        *[f"- {item['file']}: {item['sha256']}" for item in summary["copied"]],
        "",
        "## Limitations",
        *[f"- {item}" for item in summary["limitations"]],
        "",
    ]
    return "\n".join(lines)


if __name__ == "__main__":
    raise SystemExit(main())
