# L7.8 Detector Round-Trip Acceptance Fixtures

Deterministic fixtures for the EMMicro L7.8 detector round-trip acceptance pack. These files exercise the existing L7.7 external detector bridge and L7.5/L7.2/L7.4 handoff chain without requiring Python/OpenCV for npm tests or browser runtime.

## Files

- board_manifest.json
- board_print.png
- synthetic_capture_clean.png
- synthetic_capture_perspective.png
- synthetic_capture_blur_noise.png
- detection_clean.json
- detection_perspective.json
- detection_blur_noise.json
- marker_corners_clean.csv
- marker_corners_perspective.csv
- marker_corners_blur_noise.csv
- expected_fit_summary.json
- expected_session_summary.json
- roundtrip_report_*.md/json
- roundtrip_metrics_*.csv
- roundtrip_warnings_*.json

## Expected behavior

- clean: acceptance PASS under default thresholds.
- perspective/partial-view: acceptance WARNING because coverage is intentionally low.
- blur-noise: acceptance FAIL/WARNING path depending thresholds because confidence and residual stress are intentionally lower.

## Boundary

These are diagnostic fixtures only. They do not implement browser-native OpenCV.js/ArUco detection, AprilTag decoding, certified camera calibration, lab-accredited metrology, full 3D pose/stereo calibration, hardware control, digital-twin/manufacturing certification, or full 3D Maxwell/FDTD/FEM/BEM/RCWA/CAD physics.
