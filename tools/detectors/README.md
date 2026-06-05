# L7.6 External Detector Bridge

This folder is a scaffold for detector runners that produce EMMicro-compatible external detector output.

The browser app imports detector results; it does not run detector decoding itself. Python/OpenCV is optional, and npm tests do not require Python, OpenCV, OpenCV.js, AprilTag, camera hardware, or native binaries.

## Supported Import Contracts

- Canonical JSON: `examples/example_detection.json`
- Marker-corner CSV: `examples/example_marker_corners.csv`

Required CSV columns:

```csv
marker_id,corner_index,x_px,y_px
```

Recommended receipt columns:

```csv
frame_id,confidence,detector_name,detector_version,board_id,board_hash,image_hash,image_width,image_height
```

## Boundary

- External detector JSON/CSV import is executable in L7.6.
- Detector receipt validation is executable in L7.6.
- Detector comparison and report export are executable in L7.6.
- browser-native OpenCV ArUco detector is not implemented.
- AprilTag decoding is not implemented.
- Certified camera calibration, full 3D pose/stereo calibration, hardware camera control, and full 3D Maxwell/FDTD/FEM/BEM/RCWA/CAD execution are not implemented.

The optional `opencv_charuco_detect.py` file is a runner template only. Adapt it to your own OpenCV-compatible board metadata and image capture flow before trusting its output.
