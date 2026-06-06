# EMMicro L8.1/L8.2/L8.3/L8.4/L8.5/L8.5.1 External FDTD Helpers

These tools support the L8.1 `External FDTD / Field Maps` workflow, the L8.2 `FDTD Verification Suite`, the L8.3 `Surface Geometry Interaction Starter Set`, the L8.4 `Aperture / Blocker Edge-Diffraction Validation` workbench, the L8.5 `Multi-Element Optical Bench Propagation Chain`, and the L8.5.1 `Element Inspector + Direct Optical Bench Editing` workbench.

Scope:
- The web app exports an EMMicro FDTD scene manifest and a deterministic Meep-style Python helper script.
- External Meep/FDTD execution is optional and happens outside the browser.
- The browser imports receipt, flux summary, and field-slice evidence for comparison against the L8.0 analytic/TMM surface result.
- L8.2 benchmark packs add bounded resolution/PML/padding sweep plans, expected reference files, convergence summary import, residual-vs-resolution diagnostics, and benchmark dossiers.
- L8.3 surface-geometry packs add finite transparent block, absorbing block, ideal reflective plate, aperture/blocker, and tilted wedge/interface scene manifests, Meep helper scripts, deterministic field/flux fixtures, validation reports, and convergence sweep hooks.
- L8.4 aperture/blocker packs add long-slit, circular-pinhole, rectangular-aperture, and opaque-blocker scene manifests, Meep helper scripts, deterministic field/flux fixtures, scalar limiting-case profile comparisons, aperture cells-across diagnostics, convergence rows, and validation dossiers.
- L8.5 multi-element packs add ordered bench scene JSON, solver plan JSON, monitor stack CSV, validation report JSON/Markdown, metrics CSV, FDTD manifest/script exports, and bundled receipt/flux/field-slice evidence for supported finite geometry chains.
- L8.5.1 adds element selection, numeric inspector editing, optional x-z diagram drag, keyboard nudges, snap, undo/redo, custom monitor editing, and export-blocking warnings for invalid edited scenes.

Not scope:
- No browser FDTD execution.
- No arbitrary 3D CAD Maxwell solve.
- No FEM/BEM/RCWA execution.
- No browser finite-geometry Maxwell solve or arbitrary material geometry solver.
- No production metal aperture model or arbitrary CAD aperture-edge solver.
- No production solver validation, digital twin, sensor-stack EM, or manufacturing certification.

Typical flow:

1. Export `fdtd_scene_manifest.json` and `meep_scene.py` from the Simulation Builder.
2. Run or adapt `meep_scene.py` in an environment where Meep is installed.
3. Produce `run_receipt.json`, `flux_summary.json`, and `field_slice_xz.csv`.
4. Import those artifacts in the L8.1 panel.

The files in `examples/` are deterministic diagnostic fixtures. They are not measured lab results.

L8.2 example prefixes include:

- `l82_empty_space_*`
- `l82_transparent_interface_*`
- `l82_transparent_slab_*`
- `l82_absorbing_slab_*`
- `l82_mirror_*`

L8.3 example prefixes include:

- `l83_transparent_block_*`
- `l83_absorbing_block_*`
- `l83_reflective_plate_*`
- `l83_aperture_blocker_*`
- `l83_tilted_wedge_*`

L8.4 example prefixes include:

- `l84_long_slit_*`
- `l84_circular_pinhole_*`
- `l84_rectangular_aperture_*`
- `l84_opaque_blocker_*`

L8.5 example prefixes include:

- `l85_multi_element_bench_*`

L8.5.1 smoke artifacts include:

- `l851-element-inspector-smoke.png`
- `l851-drag-move-smoke.png`
- `l851-element-actions-smoke.png`
- `l851-edit-warnings-smoke.png`
- `l851-undo-export-smoke.png`

## Scripts

`run_meep_scene.py`

Validates a manifest and script pair, checks whether Meep is importable, and writes a receipt scaffold. It does not make Meep available or certify the generated script.

`postprocess_meep_output.py`

Validates a receipt, a flux summary, and a field-slice CSV, then writes a compact import bundle summary for the web UI.

Both scripts use only the Python standard library unless you choose to execute Meep yourself.

`l81_browser_smoke_code.js`

Playwright CLI smoke helper for the L8.1 single-run field-map controls under the current app shell. Open the target URL first; the helper runs against the current page and writes screenshots under `.playwright-cli/`:

```powershell
npx --yes --package @playwright/cli playwright-cli open https://monivibe.github.io/EM-Microscope/
npx --yes --package @playwright/cli playwright-cli run-code --filename tools/fdtd/l81_browser_smoke_code.js
```

`l82_browser_smoke_code.js`

Playwright CLI smoke helper for the L8.2 benchmark convergence suite:

```powershell
npx --yes --package @playwright/cli playwright-cli open https://monivibe.github.io/EM-Microscope/
npx --yes --package @playwright/cli playwright-cli run-code --filename tools/fdtd/l82_browser_smoke_code.js
```

`l83_browser_smoke_code.js`

Playwright CLI smoke helper for the L8.3 finite surface-geometry palette, fixture import, reports, unsupported-shape guardrail, and L8.2/L8.1/L7.8 regressions:

```powershell
npx --yes --package @playwright/cli playwright-cli open https://monivibe.github.io/EM-Microscope/
npx --yes --package @playwright/cli playwright-cli run-code --filename tools/fdtd/l83_browser_smoke_code.js
```

`l84_browser_smoke_code.js`

Playwright CLI smoke helper for the L8.4 aperture/blocker validation workbench, including L8.3/L8.2/L8.1/L7.8 regressions:

```powershell
npx --yes --package @playwright/cli playwright-cli open https://monivibe.github.io/EM-Microscope/
npx --yes --package @playwright/cli playwright-cli run-code --filename tools/fdtd/l84_browser_smoke_code.js
```

`l85_browser_smoke_code.js`

Playwright CLI smoke helper for the L8.5 multi-element bench, solver plan, monitor stack, scalar preview, external FDTD fixture import, and L8.4/L8.2/L7.8 regressions:

```powershell
npx --yes --package @playwright/cli playwright-cli open https://monivibe.github.io/EM-Microscope/
npx --yes --package @playwright/cli playwright-cli run-code --filename tools/fdtd/l85_browser_smoke_code.js
```

`l851_browser_smoke_code.js`

Playwright CLI smoke helper for the L8.5.1 element inspector, synchronized selection, numeric editing, optional drag, nudge fallback, undo/export guardrails, custom monitor export, scalar preview, external FDTD fixture import, and L8.4/L8.2/L7.8 regressions:

```powershell
npx --yes --package @playwright/cli playwright-cli open https://monivibe.github.io/EM-Microscope/
npx --yes --package @playwright/cli playwright-cli run-code --filename tools/fdtd/l851_browser_smoke_code.js
```
