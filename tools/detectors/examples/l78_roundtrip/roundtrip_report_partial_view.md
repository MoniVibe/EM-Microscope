# L7.8 detector round-trip acceptance

App version: L7.8 Detector Round-Trip Acceptance Pack
Status: WARNING
Result hash: 873a376618b3b2de

## Detector Receipt
- Detector: opencv-charuco l78-partial-view-fixture
- Runner hash: l78-partial-view-runner-fnv1a64
- Dictionary: DICT_4X4_50
- Board hash status: match
- Image hash status: match
- Receipt status: WARNING

## Acceptance Metrics
- Detected markers: 4
- Detected ChArUco corners: 6
- Accepted markers: 4
- Accepted ChArUco corners: 6
- Matched points: 22
- Coverage score: 0.1179
- Mean confidence: 0.9200
- Fit RMS: 2.499e-10 px
- Fit max residual: 4.528e-10 px
- Session QA: WARNING
- Manual edits: 0

## Wizard Steps
| Step | Status | Required file | Hash | Next action |
| --- | --- | --- | --- | --- |
| Export board manifest / printable board | pass | board_manifest.json + board_print.png | 747e6cb4591b8b8e | Run external detector helper |
| Run external detector helper | pass | synthetic_capture_*.png | d9c52ad65516b7a2 | Import detector output |
| Import detector JSON/CSV | pass | detection_*.json or marker CSV | 72f858a60fdab76b | Validate receipt and hashes |
| Validate receipt and hashes | pass | detector receipt | 39cf1b916a26ed6e | Match IDs to board |
| Match IDs to board | warning | board_manifest.json + detection_*.json | 3d439b51913b6b85 | Run geometry fit |
| Run geometry fit | pass | matched_points.csv | 90930cf8f8216fe3 | Add to session QA |
| Add to batch session QA | warning | session_report.json | bc27496472a25681 | Export round-trip evidence |
| Export round-trip evidence | ready | roundtrip_report.md/json/csv | n/a | Export report bundle |

## Warnings
- fixture.partialView: Synthetic partial-view fixture intentionally omits board coverage.
- l75.match.poorBoardCoverage: Matched fiducial points cover a narrow board area; partial-view fit may be fragile.
- l75.match.radialCoverageLow: Radial distortion fit is not trustworthy with this narrow fiducial coverage.
- l75.match.missingMarkers: 31 board marker IDs are not visible or accepted.
- l78.roundtrip.minMarkers: Accepted marker count 4 is below 8 (partial-view warning).
- l78.roundtrip.minCharucoCorners: Accepted ChArUco corner count 6 is below 12 (partial-view warning).
- l78.roundtrip.minCoverage: Coverage score 0.1179 is below 0.7.

## Exports
- roundtrip_report.md
- roundtrip_report.json
- roundtrip_metrics.csv
- roundtrip_warnings.json

## Boundary
- L7.8 is an operational detector round-trip acceptance package over L7.7 external detector imports; it does not add browser-native OpenCV.js, AprilTag decoding, or new detector physics.
- Acceptance metrics validate receipts, hashes, ID matching, diagnostic geometry fit, and L7.4 session QA handoff only; they are not certified camera calibration, lab-accredited metrology, or full 3D pose/stereo calibration.
- The workflow does not execute hardware camera control, pixel-level sensor-stack EM, a digital twin, manufacturing certification, or full 3D Maxwell/FDTD/FEM/BEM/RCWA/CAD physics.