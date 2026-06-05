# L7.8 detector round-trip acceptance

App version: L7.8 Detector Round-Trip Acceptance Pack
Status: FAIL
Result hash: 66cfdb0420e616d4

## Detector Receipt
- Detector: opencv-charuco l78-blur-noise-fixture
- Runner hash: l78-blur-noise-runner-fnv1a64
- Dictionary: DICT_4X4_50
- Board hash status: match
- Image hash status: match
- Receipt status: WARNING

## Acceptance Metrics
- Detected markers: 35
- Detected ChArUco corners: 48
- Accepted markers: 35
- Accepted ChArUco corners: 48
- Matched points: 188
- Coverage score: 1.000
- Mean confidence: 0.6500
- Fit RMS: 0.4475 px
- Fit max residual: 0.7766 px
- Session QA: WARNING
- Manual edits: 0

## Wizard Steps
| Step | Status | Required file | Hash | Next action |
| --- | --- | --- | --- | --- |
| Export board manifest / printable board | pass | board_manifest.json + board_print.png | 747e6cb4591b8b8e | Run external detector helper |
| Run external detector helper | pass | synthetic_capture_*.png | 717ed9c3a4cdc206 | Import detector output |
| Import detector JSON/CSV | pass | detection_*.json or marker CSV | 5ece674a1bbbc282 | Validate receipt and hashes |
| Validate receipt and hashes | pass | detector receipt | d41fafac1cd34af5 | Match IDs to board |
| Match IDs to board | warning | board_manifest.json + detection_*.json | b8574eebe981d8c3 | Run geometry fit |
| Run geometry fit | fail | matched_points.csv | 799d1fc43ca6d191 | Add to session QA |
| Add to batch session QA | warning | session_report.json | 3fd078232d919afa | Export round-trip evidence |
| Export round-trip evidence | ready | roundtrip_report.md/json/csv | n/a | Export report bundle |

## Warnings
- fixture.blurNoise: Synthetic blur/noise fixture has lowered confidence and residual stress.
- l76.detector.lowConfidence: External detector output includes low-confidence IDs below 0.8: markers 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, ChArUco-style corners 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47.
- l72.fit.rmsResidualWarn: RMS reprojection residual exceeds the warning threshold.
- l78.roundtrip.lowMeanConfidence: Mean confidence 0.6500 is below 0.85.
- l78.roundtrip.fitRmsExceeded: Fit RMS 0.4475 px exceeds 0.08 px.
- l78.roundtrip.fitMaxResidualExceeded: Fit max residual 0.7766 px exceeds 0.25 px.

## Exports
- roundtrip_report.md
- roundtrip_report.json
- roundtrip_metrics.csv
- roundtrip_warnings.json

## Boundary
- L7.8 is an operational detector round-trip acceptance package over L7.7 external detector imports; it does not add browser-native OpenCV.js, AprilTag decoding, or new detector physics.
- Acceptance metrics validate receipts, hashes, ID matching, diagnostic geometry fit, and L7.4 session QA handoff only; they are not certified camera calibration, lab-accredited metrology, or full 3D pose/stereo calibration.
- The workflow does not execute hardware camera control, pixel-level sensor-stack EM, a digital twin, manufacturing certification, or full 3D Maxwell/FDTD/FEM/BEM/RCWA/CAD physics.