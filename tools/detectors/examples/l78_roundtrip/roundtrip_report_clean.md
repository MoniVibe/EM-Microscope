# L7.8 detector round-trip acceptance

App version: L7.8 Detector Round-Trip Acceptance Pack
Status: PASS
Result hash: b1d28c4a61e509a0

## Detector Receipt
- Detector: opencv-charuco l78-clean-fixture
- Runner hash: l78-clean-runner-fnv1a64
- Dictionary: DICT_4X4_50
- Board hash status: match
- Image hash status: match
- Receipt status: PASS

## Acceptance Metrics
- Detected markers: 35
- Detected ChArUco corners: 48
- Accepted markers: 35
- Accepted ChArUco corners: 48
- Matched points: 188
- Coverage score: 1.000
- Mean confidence: 0.9900
- Fit RMS: 3.660e-10 px
- Fit max residual: 6.555e-10 px
- Session QA: PASS
- Manual edits: 0

## Wizard Steps
| Step | Status | Required file | Hash | Next action |
| --- | --- | --- | --- | --- |
| Export board manifest / printable board | pass | board_manifest.json + board_print.png | 747e6cb4591b8b8e | Run external detector helper |
| Run external detector helper | pass | synthetic_capture_*.png | 02da980b391692f5 | Import detector output |
| Import detector JSON/CSV | pass | detection_*.json or marker CSV | 1b9060dd61b2ab9a | Validate receipt and hashes |
| Validate receipt and hashes | pass | detector receipt | 48910faaaeea5eef | Match IDs to board |
| Match IDs to board | pass | board_manifest.json + detection_*.json | e799bd2e30aebccd | Run geometry fit |
| Run geometry fit | pass | matched_points.csv | 8c9df26dae5d8407 | Add to session QA |
| Add to batch session QA | pass | session_report.json | 78066ab08204e424 | Export round-trip evidence |
| Export round-trip evidence | ready | roundtrip_report.md/json/csv | n/a | Export report bundle |

## Warnings
- none

## Exports
- roundtrip_report.md
- roundtrip_report.json
- roundtrip_metrics.csv
- roundtrip_warnings.json

## Boundary
- L7.8 is an operational detector round-trip acceptance package over L7.7 external detector imports; it does not add browser-native OpenCV.js, AprilTag decoding, or new detector physics.
- Acceptance metrics validate receipts, hashes, ID matching, diagnostic geometry fit, and L7.4 session QA handoff only; they are not certified camera calibration, lab-accredited metrology, or full 3D pose/stereo calibration.
- The workflow does not execute hardware camera control, pixel-level sensor-stack EM, a digital twin, manufacturing certification, or full 3D Maxwell/FDTD/FEM/BEM/RCWA/CAD physics.