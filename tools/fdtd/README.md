# EMMicro L8.1-L8.9 External FDTD Helpers + L9.2 2D Sandbox WebGPU Smoke

These tools support the L8.1 `External FDTD / Field Maps` workflow, the L8.2 `FDTD Verification Suite`, the L8.3 `Surface Geometry Interaction Starter Set`, the L8.4 `Aperture / Blocker Edge-Diffraction Validation` workbench, the L8.5 `Multi-Element Optical Bench Propagation Chain`, the L8.5.1 `Element Inspector + Direct Optical Bench Editing` workbench, the L8.6 `Process / Tolerance Runner`, the L8.7 `Robust Design Advisor`, the L8.8 `Engineering Evidence Campaign`, the L8.8a two-view interaction hardening smoke flow, the L8.9 `Real External FDTD Run Ingestion` workflow, L9.0 browser smoke for the capped 2D FDTD sandbox, L9.1 browser smoke for validation/stability/convergence diagnostics, and L9.2 browser smoke for optional WebGPU acceleration/fallback, CPU/GPU parity, and performance diagnostics.

Scope:
- The web app exports an EMMicro FDTD scene manifest and a deterministic Meep-style Python helper script.
- External Meep/FDTD execution is optional and happens outside the browser.
- The browser imports receipt, flux summary, and field-slice evidence for comparison against the L8.0 analytic/TMM surface result.
- L8.2 benchmark packs add bounded resolution/PML/padding sweep plans, expected reference files, convergence summary import, residual-vs-resolution diagnostics, and benchmark dossiers.
- L8.3 surface-geometry packs add finite transparent block, absorbing block, ideal reflective plate, aperture/blocker, and tilted wedge/interface scene manifests, Meep helper scripts, deterministic field/flux fixtures, validation reports, and convergence sweep hooks.
- L8.4 aperture/blocker packs add long-slit, circular-pinhole, rectangular-aperture, and opaque-blocker scene manifests, Meep helper scripts, deterministic field/flux fixtures, scalar limiting-case profile comparisons, aperture cells-across diagnostics, convergence rows, and validation dossiers.
- L8.5 multi-element packs add ordered bench scene JSON, solver plan JSON, monitor stack CSV, validation report JSON/Markdown, metrics CSV, FDTD manifest/script exports, and bundled receipt/flux/field-slice evidence for supported finite geometry chains.
- L8.5.1 adds element selection, numeric inspector editing, optional x-z diagram drag, keyboard nudges, snap, undo/redo, custom monitor editing, and export-blocking warnings for invalid edited scenes.
- L8.6 tolerance packs add diagnostic variation specs, run tables, sensitivity rankings, failing-case exports, FDTD variation sweep manifests, and imported external sweep summary receipts.
- L8.7 robust-design packs add ranked recommendations, candidate tables, tolerance budgets, before/after metric exports, FDTD candidate sweep manifests, and imported candidate sweep summary receipts.
- L8.8 engineering-evidence packs add curated transparent/absorbing/reflective/aperture/multi-element/robust scenarios, analytic/TMM/scalar references, convergence/PML summaries, L8.6 tolerance evidence, L8.7 robust before/after evidence, capability truth tables, unsupported-item tables, and engineer-facing Markdown/JSON/CSV dossiers under `tools/evidence/`.
- L8.8a two-view interaction hardening adds explicit Optical Axis Placement vs X-Z Surface Geometry roles, Inspect/Edit Geometry mode, z-only axis drag, finite geometry body/handle edits, warning visuals, and source-of-truth inspector copy.
- L8.9 real-run packs add `scene_manifest.json`, `meep_scene.py`, `expected_reference.json`, `run_config.json`, `material_receipts.json`, `monitor_receipts.json`, `README.md`, `reproduce.sh`, `reproduce.ps1`, `postprocess.py`, and `requirements-meep.txt` exports; import `real_run_bundle.json` or individual receipt/flux/field/energy/postprocess artifacts; validate hashes and required monitors/files; compare R/T/A, energy balance, and field-slice residuals; promote accepted evidence; and export reproducibility reports.
- L9.0 sandbox smoke covers the in-browser diagnostic 2D TMz sandbox, grid caps, field/intensity/material views, Simulation Builder 2D slice handoff, and exports named `fdtd2d_sandbox_report.md`, `fdtd2d_sandbox_report.json`, `field_snapshot.csv`, `monitor_trace.csv`, and `energy_trace.csv`.
- L9.1 sandbox smoke covers CFL/dt/grid stability, unsafe-CFL blocking, NaN/Infinity guard copy, validation fixtures, Fresnel/absorber/symmetry reference checks, bounded grid convergence, boundary diagnostics, Simulation Builder 2D slice handoff, and exports named `fdtd2d_validation_report.md`, `fdtd2d_validation_report.json`, `fdtd2d_convergence.csv`, `fdtd2d_energy_trace.csv`, `fdtd2d_monitor_trace.csv`, and `fdtd2d_stability_report.json`.
- L9.2 sandbox smoke covers CPU reference backend selection, optional WebGPU availability/fallback, CPU/GPU parity checks, performance benchmark metrics, backend report exports, and the same L9.1 validation fixture/regression surface.

Not scope:
- No production browser FDTD execution; L9.2 is capped diagnostic 2D TMz only.
- No required WebGPU; optional WebGPU acceleration falls back to CPU when unavailable or failed.
- No arbitrary 3D CAD Maxwell solve.
- No FEM/BEM/RCWA execution.
- No browser finite-geometry Maxwell solve or arbitrary material geometry solver.
- No production metal aperture model or arbitrary CAD aperture-edge solver.
- No production solver validation, digital twin, sensor-stack EM, or manufacturing certification.
- No certified validation or production EM solver certification.
- No certified optical tolerancing, automatic final design approval, auto redesign, or full inverse optimization.

Typical flow:

1. Export `fdtd_scene_manifest.json` and `meep_scene.py` from the Simulation Builder.
2. Run or adapt `meep_scene.py` in an environment where Meep is installed.
3. Produce `run_receipt.json`, `flux_summary.json`, and `field_slice_xz.csv`.
4. Import those artifacts in the L8.1 panel.

L8.9 real-run flow:

1. Export `Export Real Run Pack` from the L8.9 panel.
2. Run or adapt `reproduce.sh` / `reproduce.ps1` locally if Meep is installed.
3. Produce or postprocess `run_receipt.json`, `flux_summary.json`, `field_slice_xz.csv`, `energy_balance.json`, and `postprocess_log.json`.
4. Import those files or a `real_run_bundle.json` in the L8.9 panel.
5. Review hash validation, reference comparison, field/intensity preview, warnings, and promotion state.
6. Export `reproducibility_report.md`, `reproducibility_report.json`, `real_run_metrics.csv`, and `real_run_warnings.json`.

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

L8.6 smoke artifacts include:

- `l86-variation-setup-smoke.png`
- `l86-sensitivity-table-smoke.png`
- `l86-worst-case-passfail-smoke.png`
- `l86-fdtd-sweep-smoke.png`

L8.7 smoke artifacts include:

- `l87-robust-advisor-recommendations-smoke.png`
- `l87-candidate-comparison-smoke.png`
- `l87-tolerance-budget-smoke.png`
- `l87-fdtd-candidate-sweep-smoke.png`
- `l87-robust-design-report-smoke.png`

L8.8 smoke artifacts include:

- `l88-evidence-campaign-table-smoke.png`
- `l88-transparent-slab-evidence-smoke.png`
- `l88-aperture-evidence-smoke.png`
- `l88-robust-before-after-smoke.png`
- `l88-engineer-dossier-export-smoke.png`

L8.8a smoke artifacts include:

- `l88a-two-view-labels-smoke.png`
- `l88a-axis-z-drag-smoke.png`
- `l88a-xz-edit-handles-smoke.png`
- `l88a-warning-visuals-smoke.png`

L8.9 smoke artifacts include:

- `l89-real-run-pack-smoke.png`
- `l89-real-run-fixture-smoke.png`
- `l89-hash-mismatch-smoke.png`
- `l89-repro-report-smoke.png`

L9.0 smoke artifacts include:

- `l90-fdtd-sandbox-grid-smoke.png`
- `l90-fdtd-source-field-smoke.png`
- `l90-fdtd-material-scatter-smoke.png`
- `l90-fdtd-monitor-trace-smoke.png`
- `l90-builder-to-sandbox-smoke.png`

L9.1 smoke artifacts include:

- `l91-fdtd-stability-dashboard-smoke.png`
- `l91-fdtd-fixtures-smoke.png`
- `l91-fresnel-absorber-reference-smoke.png`
- `l91-grid-convergence-smoke.png`
- `l91-validation-export-smoke.png`

L9.2 smoke artifacts include:

- `l92-backend-selector-smoke.png`
- `l92-webgpu-status-smoke.png`
- `l92-cpu-gpu-parity-smoke.png`
- `l92-performance-benchmark-smoke.png`
- `l92-fallback-cpu-smoke.png`

L8.9 fixture manifest:

- `examples/l89_real_run_fixtures_manifest.json`

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

`l86_browser_smoke_code.js`

Playwright CLI smoke helper for the L8.6 process/tolerance runner, one-at-a-time/grid studies, sensitivity and worst-case tables, report export, external FDTD variation sweep summary import, L8.5.1 editing, and L8.4/L8.2/L7.8 regressions:

```powershell
npx --yes --package @playwright/cli playwright-cli open https://monivibe.github.io/EM-Microscope/
npx --yes --package @playwright/cli playwright-cli run-code --filename tools/fdtd/l86_browser_smoke_code.js
```

`l87_browser_smoke_code.js`

Playwright CLI smoke helper for the L8.7 robust advisor, recommendation generation, candidate comparison, tolerance budget locks/costs, explicit candidate apply, robust report export, external FDTD candidate sweep summary import, and L8.6/L8.5.1/L8.4/L8.2/L7.8 regressions:

```powershell
npx --yes --package @playwright/cli playwright-cli open https://monivibe.github.io/EM-Microscope/
npx --yes --package @playwright/cli playwright-cli run-code --filename tools/fdtd/l87_browser_smoke_code.js
```

`l88_browser_smoke_code.js`

Playwright CLI smoke helper for the L8.8 engineering evidence campaign, bundled golden campaign load, scenario table/detail review, dossier export controls, and L8.7/L8.6/L8.4 regressions:

```powershell
npx --yes --package @playwright/cli playwright-cli open https://monivibe.github.io/EM-Microscope/
npx --yes --package @playwright/cli playwright-cli run-code --filename tools/fdtd/l88_browser_smoke_code.js
```

`l88a_browser_smoke_code.js`

Playwright CLI smoke helper for L8.8a two-view editing: labels, Inspect/Edit Geometry mode, z-only optical-axis drag, X-Z finite geometry body/handle edits, warning visuals, and L8.8 regression visibility:

```powershell
npx --yes --package @playwright/cli playwright-cli open https://monivibe.github.io/EM-Microscope/
npx --yes --package @playwright/cli playwright-cli run-code --filename tools/fdtd/l88a_browser_smoke_code.js
```

`l89_browser_smoke_code.js`

Playwright CLI smoke helper for L8.9 real external run ingestion: pack controls, transparent/aperture/hash-mismatch fixtures, validation/comparison, promotion controls, and L8.8 regression visibility:

```powershell
npx --yes --package @playwright/cli playwright-cli open https://monivibe.github.io/EM-Microscope/
npx --yes --package @playwright/cli playwright-cli run-code --filename tools/fdtd/l89_browser_smoke_code.js
```

`l90_browser_smoke_code.js`

Playwright CLI smoke helper for L9.0 in-browser 2D FDTD sandbox: grid budget controls, reset/step/run-N flow, field/intensity/material views, monitor traces, Simulation Builder 2D slice handoff, and L9.0 export filenames:

```powershell
npx --yes --package @playwright/cli playwright-cli open https://monivibe.github.io/EM-Microscope/
npx --yes --package @playwright/cli playwright-cli run-code --filename tools/fdtd/l90_browser_smoke_code.js
```

`l91_browser_smoke_code.js`

Playwright CLI smoke helper for L9.1 in-browser 2D FDTD validation and stability: CFL/dt/grid status, unsafe-CFL blocking, validation fixtures, reference checks, bounded convergence table, validation exports, Simulation Builder handoff, and L8.9/L8.8 regression visibility:

```powershell
npx --yes --package @playwright/cli playwright-cli open https://monivibe.github.io/EM-Microscope/
npx --yes --package @playwright/cli playwright-cli run-code --filename tools/fdtd/l91_browser_smoke_code.js
```

`l92_browser_smoke_code.js`

Playwright CLI smoke helper for L9.2 optional WebGPU acceleration and CPU fallback: backend selector, WebGPU status panel, CPU/GPU parity, performance benchmark, backend exports, Simulation Builder handoff, and L8.9/L8.8 regression visibility:

```powershell
npx --yes --package @playwright/cli playwright-cli open https://monivibe.github.io/EM-Microscope/
npx --yes --package @playwright/cli playwright-cli run-code --filename tools/fdtd/l92_browser_smoke_code.js
```
