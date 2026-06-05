# EMMicro L8.1 External FDTD Helpers

These tools support the L8.1 `External FDTD / Field Maps` workflow.

Scope:
- The web app exports an EMMicro FDTD scene manifest and a deterministic Meep-style Python helper script.
- External Meep/FDTD execution is optional and happens outside the browser.
- The browser imports receipt, flux summary, and field-slice evidence for comparison against the L8.0 analytic/TMM surface result.

Not scope:
- No browser FDTD execution.
- No arbitrary 3D CAD Maxwell solve.
- No FEM/BEM/RCWA execution.
- No production solver validation, digital twin, sensor-stack EM, or manufacturing certification.

Typical flow:

1. Export `fdtd_scene_manifest.json` and `meep_scene.py` from the Simulation Builder.
2. Run or adapt `meep_scene.py` in an environment where Meep is installed.
3. Produce `run_receipt.json`, `flux_summary.json`, and `field_slice_xz.csv`.
4. Import those artifacts in the L8.1 panel.

The files in `examples/` are deterministic diagnostic fixtures. They are not measured lab results.

## Scripts

`run_meep_scene.py`

Validates a manifest and script pair, checks whether Meep is importable, and writes a receipt scaffold. It does not make Meep available or certify the generated script.

`postprocess_meep_output.py`

Validates a receipt, a flux summary, and a field-slice CSV, then writes a compact import bundle summary for the web UI.

Both scripts use only the Python standard library unless you choose to execute Meep yourself.
