# L7.7 External Detector Runner Pack

This folder contains optional command-line helpers for producing EMMicro-compatible external detector output.
The web app imports detector results; it does not run OpenCV, OpenCV.js, AprilTag, camera hardware, or native
detector binaries during npm test, npm build, or browser runtime.

## Install

```bash
python -m venv .venv
.venv\Scripts\python -m pip install -r tools/detectors/requirements-opencv.txt
```

Use `opencv-contrib-python`, not plain `opencv-python`, because the ArUco/ChArUco APIs live in OpenCV contrib builds.

## Generate an OpenCV-Compatible ChArUco Board

```bash
python tools/detectors/opencv_charuco_generate.py ^
  --squares-x 7 ^
  --squares-y 5 ^
  --square-length-mm 10 ^
  --marker-length-mm 6 ^
  --dictionary DICT_4X4_50 ^
  --out-board-png charuco_board.png ^
  --out-manifest charuco_board_manifest.json
```

The manifest uses `emmicro.board.opencv_charuco.v1` and includes dictionary, board dimensions, physical lengths,
world-space ChArUco corners, image hash, board hash, OpenCV version, and runner hash.

## Detect a Frame

```bash
python tools/detectors/opencv_charuco_detect.py ^
  --image frame_001.png ^
  --board-manifest charuco_board_manifest.json ^
  --dictionary DICT_4X4_50 ^
  --out-json frame_001_detection.json ^
  --out-csv frame_001_marker_corners.csv ^
  --out-overlay frame_001_detection_overlay.png
```

The JSON output uses the canonical L7.6/L7.7 bridge contract:

```json
{
  "version": "emmicro.detector.v1",
  "detector": {
    "name": "opencv-charuco",
    "version": "4.x",
    "runnerHash": "sha256:...",
    "parameters": {
      "dictionary": "DICT_4X4_50",
      "cornerRefinement": true
    }
  },
  "image": {
    "sourceName": "frame_001.png",
    "imageHash": "sha256:...",
    "width": 1920,
    "height": 1080
  },
  "board": {
    "boardId": "opencv-charuco-7x5-DICT_4X4_50",
    "boardHash": "sha256:..."
  },
  "detections": {
    "markers": [],
    "charucoCorners": []
  },
  "warnings": []
}
```

## Validate Output Without OpenCV

```bash
python tools/detectors/validate_emmicro_detector_json.py --json tools/detectors/examples/charuco_detection.json
```

This validator checks the bridge schema shape only. It does not certify calibration quality.

## Bundled Fixtures

- `examples/charuco_board_manifest.json`
- `examples/charuco_board.png`
- `examples/charuco_detection.json`
- `examples/charuco_marker_corners.csv`
- Legacy aliases retained for L7.6 tests: `examples/example_detection.json`, `examples/example_marker_corners.csv`

The fixture JSON/CSV validate through the web app import bridge without Python/OpenCV. Regenerate real lab boards and
detector outputs with the scripts above when working with actual images.

## Boundaries

- OpenCV ChArUco helper execution is optional external tooling.
- browser-native OpenCV.js/ArUco detector execution is not implemented.
- AprilTag decoding is not implemented; `apriltag_detect.py` is a scaffold only.
- Certified camera calibration, lab-accredited metrology, full 3D pose calibration, stereo calibration, hardware
  camera control, digital-twin calibration, manufacturing certification, and full 3D Maxwell/FDTD/FEM/BEM/RCWA/CAD
  execution are not implemented.
