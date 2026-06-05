# L7.7 Detector Runner Output Notes

Produce either `emmicro.detector.v1` JSON or marker-corner CSV and keep detector, image, and board receipts with every run.
Optional OpenCV ChArUco helpers live in `tools/detectors/`; Python/OpenCV is not required for npm tests or the web app.

The canonical bridge expects:

- `detector.name`
- `detector.version`
- `image.sourceName`
- `image.imageHash`
- `image.width`
- `image.height`
- `board.boardId`
- `board.boardHash`

The app validates the output, preserves deterministic detector receipts, and hands accepted points to L7.5 fiducial matching, L7.2 geometry fits, and L7.4 session QA.

browser-native OpenCV.js/ArUco detector execution is not implemented. AprilTag decoding is not implemented.
