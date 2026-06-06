# EMMicro

An EM-first light simulator MVP. The visible web app is now the L9.2 WebGPU-Accelerated 2D FDTD Sandbox plus the L9.1 Validation + Stability Harness and L8.9 Real External FDTD Run Ingestion + Engineering Evidence Campaign Simulation Builder over the existing
Maxwell Design Foundry planar multilayer transfer-matrix workbench and L7.8 Detector Round-Trip Acceptance Pack /
Real Detector Bridge. L9.2 keeps the capped browser-native 2D TMz FDTD sandbox with CPU reference Ez/Hx/Hy typed-array stepping, optional WebGPU acceleration when browser/secure-context/adapter/device/memory guardrails permit it, grid/object/step/monitor caps, fixtures, field/intensity/material views, Simulation Builder 2D slice handoff, visible CFL/dt/grid stability diagnostics, NaN/Infinity guards, boundary proximity warnings, Fresnel/absorber/symmetry reference checks, bounded grid-convergence diagnostics, CPU/GPU parity checks, performance diagnostics, and exports for `fdtd2d_validation_report.md`, `fdtd2d_validation_report.json`, `fdtd2d_backend_report.md`, `fdtd2d_backend_report.json`, `fdtd2d_parity.csv`, `fdtd2d_performance.csv`, `fdtd2d_convergence.csv`, `fdtd2d_stability_report.json`, `fdtd2d_energy_trace.csv`, `fdtd2d_monitor_trace.csv`, plus the L9.0-compatible sandbox reports/traces. L8.9 keeps the ordered Grid -> Source -> Elements -> Target / Material -> Compute -> Validate
workflow, adds a real external-run pack/import/reproducibility path on top of L8.1-L8.8 FDTD evidence, keeps the engineer-facing golden evidence campaign over L8.1-L8.7 evidence, keeps the diagnostic robust-design advisor over the L8.6 process/tolerance variation runner, and keeps the L8.5.1 multi-element scene graph plus element inspector for source -> apertures/slits/lenses/finite geometry -> target -> observation/monitors,
including numeric source-of-truth editing, optional diagram drag, non-drag nudge/order controls, snap settings, undo/redo, custom monitors, edit warnings,
x-z bench cross-section, solver-plan routing, scalar multi-plane monitor snapshots, external FDTD chain fixture import,
scene/solver/monitor/report exports, tolerance sensitivity ranking, pass/fail thresholds, worst-case tables, tolerance report exports, external FDTD variation sweep manifest/summary receipts, and a milestone trail that states iteration count is not validation,
then includes the L8.1 external FDTD scene manifest export, deterministic Meep helper script export, importable run receipt/flux
summary/field-slice CSV evidence, field-map preview, R/T/A energy-balance comparison against the L8.0 analytic/TMM
target result, deterministic fixtures, optional helper scripts under `tools/fdtd/`, and L8.2 external FDTD benchmark
packs with bounded resolution/PML/padding sweeps, convergence summary import, residual-vs-resolution diagnostics,
PML sensitivity warnings, and exportable benchmark dossiers. L8.3 adds finite placed transparent block, absorbing
block, ideal reflective plate, aperture/blocker, and tilted wedge/interface geometry export/import diagnostics with
x/y/z placement, finite dimensions, X-Z cross-section previews, deterministic field/flux fixtures, validation
reports, and warnings for under-resolution, PML/monitor proximity, ideal-reflector interpretation, aperture
diagnostic limits, and staircasing/convergence sensitivity. L8.4 adds finite aperture/blocker edge-diffraction
validation for long slits, circular pinholes, rectangular apertures, and opaque blockers, including scalar
single-slit/Airy/rectangular-sinc limiting references, blocked-power diagnostics, aperture cells-across/thickness/PML
and monitor-distance warnings, field-slice/profile previews, residual-vs-resolution convergence rows, and exportable
aperture validation dossiers. L8.5 composes those pieces into an ordered bench workflow: ideal plane elements run in
the scalar preview path, finite transparent/absorbing/reflective/aperture/wedge geometry routes to external FDTD
export/import evidence, scaffold-only/unsupported elements stay visible in the solver plan, and the boundary remains
explicit that this is not production browser FDTD, arbitrary 3D Maxwell/FEM/BEM/RCWA, production metal optics, digital twin, or
manufacturing certification.
L8.6 tolerance/process variation is diagnostic only: it is not certified optical tolerancing, automatic redesign,
inverse optimization, production browser FDTD execution, arbitrary 3D Maxwell/FEM/BEM/RCWA, production EM solving, digital
twin behavior, or manufacturing certification.
L8.7 adds diagnostic robust-design guidance on top of that result: ranked recentering, tolerance tightening,
tolerance relaxation, cost-weighted candidate comparison, explicit user-applied candidate actions, and external FDTD
candidate sweep manifests/summary receipts. L8.7 is not certified optical tolerancing, automatic final design
approval, full inverse design, production browser FDTD execution, arbitrary 3D Maxwell/FEM/BEM/RCWA, production EM solving,
digital twin behavior, or manufacturing certification.
L8.8 adds a Golden Evidence Pack / External FDTD Acceptance Campaign on top of the existing stack: curated
transparent slab, absorbing slab, reflective plate, long-slit, circular-pinhole, multi-element chain, and robust
candidate scenarios; analytic/TMM/scalar references; expected-vs-imported/computed residuals; convergence/PML
summaries; L8.6 tolerance evidence; L8.7 robust before/after metrics; capability truth tables; reproducibility hashes;
and one-click Markdown/JSON/CSV engineer dossier exports. L8.8 is evidence/reporting only, not certified validation,
certified tolerancing, production EM solver certification, production browser FDTD execution, arbitrary 3D Maxwell/FEM/BEM/RCWA,
digital twin behavior, or manufacturing certification.
L8.8a hardens the two-view editor contract: Optical Axis Placement is order and z-position only, X-Z Surface Geometry
is finite shape and transverse placement, Inspect/Edit Geometry modes prevent accidental drag, pointer previews commit
only on drop, Escape cancels previews, and inspector fields remain the exact source of truth.
L8.9 adds a real external FDTD run ingestion and reproducibility workbench: it exports a deterministic pack containing
`scene_manifest.json`, `meep_scene.py`, `expected_reference.json`, `run_config.json`, `material_receipts.json`,
`monitor_receipts.json`, `README.md`, `reproduce.sh`, `reproduce.ps1`, `postprocess.py`, and
`requirements-meep.txt`; imports `run_receipt.json`, `flux_summary.json`, `field_slice_xz.csv`, optional field preview
metadata, `energy_balance.json`, and `postprocess_log.json`; validates scene/script/material/monitor/run-config hashes,
required monitor ids, required files, and receipt hashes; compares R/T/A, energy balance, field-slice RMS, and reference
residuals; promotes accepted imports to the Engineering Evidence Campaign evidence queue; and exports
`reproducibility_report.md`, `reproducibility_report.json`, `real_run_metrics.csv`, and `real_run_warnings.json`.
Meep/Python remain optional local user-machine tooling only; npm tests, GitHub Pages deploy jobs, and the L8.9 web runtime do not
execute this external Meep/FDTD pack. L8.9 is still not the L9.2 in-browser sandbox, arbitrary 3D Maxwell/FDTD/FEM/BEM/RCWA/CAD execution, production
solver certification, digital twin behavior, lab accreditation, hardware control, or manufacturing certification.
L9.2 is a bounded diagnostic 2D FDTD sandbox only: it runs one TMz polarization in the browser on small capped grids,
supports simple source/object/monitor scenes, maps compatible Simulation Builder finite blocks into a 2D slice, keeps
CPU reference stepping as the validation baseline and fallback, and optionally uses WebGPU acceleration when supported.
It provides sanity fixtures for empty space, PEC-like reflection, a rough Fresnel dielectric interface, absorber
attenuation, point-source symmetry, qualitative slit spreading, CPU/GPU parity metrics, backend performance diagnostics,
and stability, boundary, reference, and bounded convergence diagnostics. It is not full 3D Maxwell, not a production FDTD
engine, not required WebGPU execution, not a replacement for external Meep/FDTD, not FEM/BEM/RCWA, not arbitrary CAD/freeform
geometry, not hardware control, and not manufacturing or lab certification.
The L7.8 diagnostic workbenches remain available as the Diagnostic Workbenches mode, with diagnostic external
detector round-trip acceptance, board/export helper workflow, external detector JSON/CSV import, optional external OpenCV ChArUco runner tooling, detector receipt and hash validation, detector comparison, synthetic fiducial board generation,
imported/synthetic marker matching, partial-view QA, manual correction, L7.2 geometry handoff, L7.4 session QA
handoff, round-trip evidence exports, batch session manifest import, per-frame metric aggregation, repeatability
standard deviation and coefficient-of-variation summaries,
drift slopes, threshold-controlled outlier review, session report exports, measured target
image import, generated-target image handoff, numeric ROI controls, auto/manual dot-grid thresholding, polarity
selection, connected-component blob detection, grid matching, manual point move/reject/accept/add/delete correction,
detection confidence reports, detector report exports, deterministic dot/checker/line target generation, point CSV
import, similarity/affine/radial image-geometry fitting, pixel-scale/rotation/skew diagnostics, residual vector and
heatmap previews, corrected/undistorted point tables,
measured-vs-simulated geometry comparison, synthetic/current-frame focus sweeps, best-focus and depth-of-focus
readouts, center/corner/3x3 field MTF maps, diagnostic PASS/FAIL/WARNING qualification reports,
measured-vs-simulated focus/field residual comparison, generated/imported slanted-edge targets, ROI-based
ESF/LSF/SFR-MTF, MTF50/MTF10/Nyquist metrics, cycles/pixel plus optional lp/mm units, line-pair target sanity
checks, JSON/Markdown/CSV MTF exports, diagnostic dark/flat/exposure
CSV import, deterministic calibration data hashes, photon-transfer-style sensor-lite fitting, fitted camera profiles,
measured-vs-simulated camera residuals, calibration report bundles, deterministic detector acquisition
post-processing, photons/electrons/DN conversion, shot/read/dark noise modes, saturation/SNR/histogram metrics,
measured CSV/image import, calibration/ROI controls, residual metrics, deterministic diagnostic fitting,
report bundles, guided optical-bench terminology, saved studies, parameter sweeps, measurement markers, run comparison, a capabilities matrix,
self-contained study bundle exports/imports, a scalar double-slit coherence demonstrator, ideal thin-lens focal-plane
validation, an accessible explainability layer, circular-aperture, long-slit, and double-slit scalar diffraction
validation, Advisor Review Mode exports, and a scaffold-only 3D Maxwell/FDTD export runway; the earlier
geometric/scalar microscope bench code remains in source and tests as historical validation scaffolding, but it is
hidden from the app shell.

L4 Phase 0 uses a DOM-free frequency-domain planar multilayer transfer-matrix special case for film stacks. L4.1
adds diagnostic wavelength-dependent material records, editable coating stacks, and wavelength sweeps over the same
planar Maxwell TMM path. L4.2 adds a planar field monitor that samples complex tangential E/H equivalents through
the stack and estimates per-layer absorption from planar flux drops. It computes complex-amplitude
reflection/transmission, R/T/A Poynting-style flux ratios, effective permittivity, energy-balance checks, warnings,
and deterministic hashes. L5.1 adds a declarative planar coating objective layer and deterministic thickness
optimizer that proposes coating designs, then certifies the selected result by re-running the same Maxwell TMM
coating-stack path. L5.2 adds deterministic planar coating tolerance/yield analysis: thickness perturbation
sampling, pass-rate confidence bounds, worst sample, and finite-difference layer sensitivity. L5.3 adds a sourced
material import/provenance boundary with JSON schema validation, unit normalization, passivity warnings, catalog
audit hashes, and template export. L5.4 wires imported material packs into a unified material catalog so coating
layers can select hash-backed imported material IDs, resolve wavelength-normalized `n,k` into the existing TMM
solver, and export/load stack designs with material receipts. L5.5 adds deterministic material/order/thickness
search over that catalog so the workbench can rank planar coating candidates and apply a selected result back to
the coating editor. L5.6 adds deterministic robust-yield coating search that wraps L5.5 nominal candidates with
thickness-only perturbation samples, ranks by p90/expected/worst/pass-rate robust score, records fixed material
`n,k` assumptions, and applies the selected robust candidate back to the coating editor. L5.7 upgrades that robust
path with deterministic correlated thickness drift models: shared deposition scale, shared offset, per-layer
residuals, layer-group drift, receipt-level sample reduction evidence, and independent-thickness comparison metrics.
L5.8 moves the existing planar stack path behind a solver-neutral backend boundary, registering `PlanarTmmBackend`
as the only available Maxwell backend and exposing planar-only capability receipts for future RCWA/FDTD/FEM/BEM
adapters. L6.0 adds a 3D Maxwell scene/result schema, deterministic 3D scene validation and hashing, field dataset
manifest types, and an `ExternalFdtdBackend`/Meep-style export scaffold that is registered but not executable.
L6.1 adds a visible ordered diffraction validation bench for the circular pinhole Airy/Bessel benchmark. L6.2 adds an
independent numerical scalar propagation path for that same benchmark and compares it against the analytic Airy reference.
L6.3 adds coherent long-slit `sinc^2`, double-slit/order-spacing validation, and Advisor Review Mode exports that
combine the circular, single-slit, and double-slit proof reports. L6.3a adds accessible custom tooltips,
under-the-hood formula/snippet panels, Explain mode highlighting, and a searchable explanation drawer without
changing solver behavior. L6.4 adds an ideal thin-lens focal-plane validation benchmark with a zero-thickness
quadratic phase mask, circular pupil, numerical scalar Fresnel propagation, analytic Airy PSF reference, residual
maps, radial overlays, z focus scan, and JSON/Markdown/CSV exports.
L6.4b clarifies the UI mental models by separating spatial validation-bench diagnostics from the planar coating-stack workbench.
L6.5 adds a scalar double-slit coherence demonstrator that compares coherent field summation,
incoherent intensity summation, and partial-coherence `gamma12` interpolation with visibility checks and
Markdown/JSON/CSV exports.
L6.6 adds the practical study workspace layer over those existing planar/scalar engines: saved validation/coating
studies, bounded parameter sweeps, marker/peak/minimum/profile measurement tools, run comparison, a visible
capabilities matrix, and study bundle exports/imports with receipts and limitations.
L6.7 adds a measured-vs-simulated lab data workbench: CSV profile import, PNG/JPEG image-centerline import,
calibration/ROI/normalization controls, profile residual metrics, deterministic shift/scale/background diagnostic
fit, comparison study save, and Markdown/JSON/CSV report bundle exports.
L6.8 adds a Camera/Sensor-Lite acquisition workbench that converts existing simulated optical profiles into
synthetic detector readout with pixel pitch, QE, exposure, photon flux scale, full well, shot/read/dark noise,
gain, black level, ADC bit depth, deterministic seed, SNR/saturation/histogram/profile metrics, camera report
exports, study integration, and synthetic-camera handoff into the measured-vs-simulated comparison workflow.
L6.9 adds a Camera Calibration / Photon-Transfer workbench that imports dark/flat/exposure summary CSV data, hashes
the source and parsed rows, estimates black level, dark current, conversion gain, read noise, full well/saturation,
linearity, SNR, dynamic range, and effective QE only when known photons-per-pixel data is supplied, then compares
measured camera curves against a fitted L6.8-compatible camera profile with residual exports and an apply-to-camera
control. It is EMVA-inspired diagnostic characterization only, not EMVA 1288 certification or certified lab
calibration.
L7.0 adds a Slanted-Edge / Resolution Target MTF Workbench that generates or imports slanted-edge targets, computes
ROI-based ESF, LSF, SFR/MTF curves, reports MTF50, MTF10, Nyquist MTF, cycles/pixel, and lp/mm when pixel pitch is known,
compares measured and simulated MTF curves, generates line-pair targets for contrast sanity checks, exports MTF
JSON/Markdown/CSV bundles, and saves MTF studies alongside the existing study workspace. It is ISO 12233-inspired
diagnostic analysis only, not ISO 12233 certification, Imatest-equivalent testing, lab-accredited metrology, pure
lens-only MTF certification, or sensor-stack EM.
L7.1 adds a Focus + Field MTF Qualification Workbench over the L7.0 slanted-edge engine: synthetic focus sweeps,
current-frame/imported-MTF focus rows, MTF50/MTF10/Nyquist/area vs focus, best focus, depth of focus, center/corner/3x3
field MTF maps, configurable center/worst-field/Nyquist/DOF thresholds, PASS/FAIL/WARNING qualification reports,
measured-vs-simulated focus/field residual comparison, and exports named `focus_sweep.csv`, `field_mtf_map.csv`,
`qualification_report.md`, `qualification_report.json`, and `mtf_comparison.csv`. It remains diagnostic thresholding,
not ISO 12233 certification, Imatest-equivalent testing, calibrated optical model fitting, pure lens-only MTF
certification, or sensor-stack EM.
L7.2 adds a Geometric Calibration / Distortion & Pixel-Scale Workbench: deterministic dot/checker/line target
generation, point CSV import, similarity/affine/radial k1/k2 fitting, pixel-scale/rotation/shear/anisotropy metrics,
residual vector maps, residual heatmaps, corrected/undistorted point previews, measured-vs-simulated geometry
comparison, study integration, and exports named `geometric_calibration_report.md`,
`geometric_calibration_report.json`, `points.csv`, `residuals.csv`, `distortion_map.csv`, and
`geometric_comparison.csv`. It remains diagnostic 2D image-geometry analysis only, not certified camera calibration,
lab-accredited metrology, full 3D pose/stereo calibration, digital-twin manufacturing calibration, or sensor-stack EM.
L7.3 adds Measured Target Detection and ROI Hardening over L7.2: generated or imported target images can be decoded
as measured grayscale frames, cropped by ROI, auto-thresholded or manually thresholded, polarity-classified, segmented
with connected-component blob detection, matched to grid rows/columns and world coordinates, manually corrected, fit
through the L7.2 geometry models, and exported as `detected_points.csv`, `rejected_points.csv`,
`detection_report.md`, and `detection_report.json`. Checkerboard automatic detection is scaffold-only in L7.3; L7.5
adds diagnostic fiducial matching from synthetic/imported detections, but real OpenCV ArUco/ChArUco marker decoding
and AprilTag decoding are not implemented.
L7.4 adds Batch Measurement Session + Repeatability QA over L6.8-L7.3 diagnostic results: a session manifest imports
frame/source metadata, existing camera/geometric/MTF/detection results can be normalized into per-frame metrics,
deterministic aggregates compute mean/std/min/max/CV/repeatability and drift slopes, thresholds flag low MTF50,
geometric residuals, detection coverage, warning-count, z-score, pixel-scale repeatability, and camera black-level
drift issues, and exports include `session_report.md`, `session_report.json`, `frame_metrics.csv`,
`session_metrics.csv`, `outliers.csv`, and `warnings.json`. It is diagnostic batch QA only, not certified metrology,
lab accreditation, hardware control, manufacturing certification, or new 3D Maxwell/FDTD/FEM/BEM/RCWA/CAD execution.
It is not a general 3D Maxwell solver,
FEM/BEM/RCWA/FDTD engine, arbitrary CAD geometry solver, curved lens solver, stochastic source engine, aperture solver, sensor-stack
simulator, adjoint optimizer, topology optimizer, digital twin, certified calibration system, or manufacturing
certification system.

## Current Visible Mode

- `L9.2 WebGPU-Accelerated 2D FDTD Sandbox`: a top-level 2D diagnostic sandbox that runs TMz Ez/Hx/Hy with CPU reference
  typed-array stepping by default and optional WebGPU acceleration when the browser, secure context, adapter, device, and
  memory caps permit it. It keeps default 256 x 256 grids, warnings above 512 x 512, a hard 1024 x 1024 cell cap,
  object/step/monitor-sample caps, reset/step/run/run-N controls, field/intensity/material overlays, source and monitor
  markers, energy/monitor traces, sanity fixtures, CFL/dt/grid stability status, max-field and NaN/Infinity checks,
  boundary proximity warnings, Fresnel/absorber/symmetry reference checks, bounded residual-vs-grid convergence
  diagnostics, WebGPU availability/fallback reporting, CPU/GPU parity checks, and backend performance metrics. Exports are
  named `fdtd2d_validation_report.md`, `fdtd2d_validation_report.json`, `fdtd2d_backend_report.md`,
  `fdtd2d_backend_report.json`, `fdtd2d_parity.csv`, `fdtd2d_performance.csv`, `fdtd2d_convergence.csv`,
  `fdtd2d_stability_report.json`, `fdtd2d_energy_trace.csv`, and `fdtd2d_monitor_trace.csv`, plus the L9.0-compatible
  `fdtd2d_sandbox_report.md`, `fdtd2d_sandbox_report.json`, `field_snapshot.csv`, `monitor_trace.csv`, and
  `energy_trace.csv`. It is a bounded 2D diagnostic only; production FDTD, full 3D Maxwell, required WebGPU execution,
  FEM/BEM/RCWA, arbitrary CAD/freeform geometry, and certified solver validation stay out of scope.

- `L9.2 Simulation Builder + 2D Sandbox Handoff`: a top-level Simulation Builder workflow that
  follows `Grid -> Source -> Elements -> Target / Material -> Observation / Monitors -> Validate`. It lets users define domain
  units, x/y/z extents, points per wavelength, source type/position/wavelength/coherence, and an ordered z-axis list
  of apertures, ideal lenses, planar material interfaces/slabs, mirrors, absorbers, and L8.3 finite transparent
  blocks, absorbing blocks, ideal reflective plates, aperture/blockers, and tilted interface wedges. L8.5.1 adds
  synchronized element-list / X-Z diagram selection, an Element Inspector, numeric editing for placement/size/material fields,
  optional pointer drag that commits on drop, non-drag nudge/order buttons, keyboard nudges, snap controls, undo/redo,
  custom monitors before/after selected elements, add/duplicate/delete/enable/disable/z-position controls,
  automatic source/after-element/before-after finite-geometry/target/observation monitors, an all-element X-Z cross-section, a solver-plan table, scalar
  chain preview snapshots, bundled external FDTD chain evidence, and exports named `multielement_scene.json`,
  `solver_plan.json`, `monitor_stack.csv`, `multielement_validation_report.md`,
  `multielement_validation_report.json`, and `multielement_metrics.csv`, plus `fdtd2d_sandbox_scene.json` and
  `fdtd2d_sandbox_handoff.json` for compatible L9.2 2D slices. The optical-axis diagram and X-Z
  cross-section show the source, every placed element, finite dimensions, target, and observation plane with z
  positions and capability tags. L8.8a separates the interaction model: Optical Axis Placement handles order and
  z-position only, while X-Z Surface Geometry handles finite shape and transverse placement through Inspect/Edit
  Geometry modes, selected-object handles, keyboard/numeric alternatives, and warning visuals for overlap,
  outside-domain placement, monitor/material proximity, PML proximity, and under-resolution.

  The L8.8 Engineering Evidence Campaign loads/imports a bundled golden campaign and exports an engineer-facing
  dossier. The campaign table covers transparent slab, absorbing slab, reflective plate, long-slit, circular-pinhole,
  multi-element chain, and robust-candidate scenarios. Each row keeps the reference model, residual, convergence/PML
  status, evidence type, scene/script/result hashes, warnings, and unsupported notes. The dossier exports
  `engineering_evidence_dossier.md`, `engineering_evidence_dossier.json`, `scenario_summary.csv`,
  `convergence_summary.csv`, `tolerance_summary.csv`, `robust_candidate_summary.csv`,
  `capability_truth_table.csv`, and `unsupported_items.csv`. It explicitly includes: "Iteration count is not
  validation. This dossier reports runnable evidence, references, residuals, convergence behavior, and limitations."
  The bundled files live under `tools/evidence/`, with optional external-run scaffolding; npm tests/build and browser
  runtime do not require Meep or Python.

  The L8.9 Real External FDTD Run Ingestion workbench makes the external production path real-user runnable without
  moving Meep/Python into the browser. It exports a named run pack, imports a full `real_run_bundle.json` or individual
  `run_receipt.json`, `flux_summary.json`, `field_slice_xz.csv`, `energy_balance.json`, and `postprocess_log.json`
  artifacts, validates scene/script/material/monitor/run-config hashes and required monitor/file coverage, shows
  field/intensity previews plus imported monitor positions and R/T/A energy-balance deltas, compares against the
  current analytic/TMM/scalar reference, and can promote accepted results to the Engineering Evidence Campaign. It
  exports `reproducibility_report.md`, `reproducibility_report.json`, `real_run_metrics.csv`,
  `real_run_warnings.json`, `real_run_validation.json`, `real_run_comparison.json`, and optional
  `real_run_promotion.json`.

  The L8.6 process/tolerance runner attaches source, element, material, geometry, and monitor variation specs to that
  current editable scene, then runs one-at-a-time, bounded deterministic-grid, or seeded deterministic diagnostic
  studies. It reports pass/fail threshold checks, sensitivity rankings, run/worst-case tables, exports
  `tolerance_report.md`, `tolerance_report.json`, `tolerance_run_table.csv`, `tolerance_sensitivity.csv`, and
  `failing_cases.csv`, and exports/imports external FDTD variation sweep evidence via
  `fdtd_variation_sweep_manifest.json` and `fdtd_variation_sweep_fixture_summary.json`. It is diagnostic process
  variation only, not certified tolerancing, auto redesign, inverse optimization, production browser FDTD, arbitrary 3D Maxwell,
  FEM/BEM/RCWA, production EM solving, digital twin behavior, or manufacturing certification.

  The L8.7 Robust Design Advisor consumes the current L8.6 tolerance result and generates ranked diagnostic actions:
  nominal recentering candidates, tolerance tightening for sensitive variables, tolerance relaxation for
  low-sensitivity variables, small robust-grid candidates, cost-weighted rankings, baseline-vs-candidate comparison,
  tolerance-budget rows, explicit apply-candidate controls, and external FDTD candidate sweep receipts. It exports
  `robust_design_report.md`, `robust_design_report.json`, `candidate_table.csv`, `recommendations.csv`,
  `before_after_metrics.csv`, `tolerance_budget.csv`, and `fdtd_candidate_sweep_manifest.json`, plus a bundled
  `candidate_sweep_summary_fixture.json` for UI/report validation. Candidate application is explicit and user-driven;
  L8.7 does not auto-approve final designs, perform full inverse design, certify optical tolerances, or execute FDTD
  in the browser.

  The executable material cases are deliberately limited and checkable:
  - transparent dielectric interface/slab: PlanarTmmBackend/Fresnel normal-incidence R/T/A validation, including the
    default air-to-glass R ~= 4 percent and R+T+A energy balance;
  - reflective surface: ideal mirror/PEC-like analytic check with R ~= 1 and T ~= 0;
  - absorbing slab: Beer-Lambert attenuation check where transmission decreases with thickness and residuals are
    reported against `I = I0 exp(-alpha d)`.

  L8.1/L8.2 exports `simulation_builder_scenario.json`, `validation_report.md`, `validation_report.json`,
  `validation_metrics.csv`, `fdtd_scene_manifest.json`, `meep_scene.py`, imported field-slice CSV evidence, and FDTD
  validation reports. It also imports receipt/flux/field-slice artifacts, previews the imported field map, compares
  imported R/T/A against the L8.0 analytic/TMM target result, provides transparent and absorbing slab fixtures, and
  keeps optional external helper scripts in `tools/fdtd/`. L8.2 adds `fdtd_benchmark_manifest.json`,
  `fdtd_sweep_plan.json`, `fdtd_expected_reference.json`, `fdtd_benchmark_report.md`,
  `fdtd_benchmark_report.json`, `fdtd_convergence_metrics.csv`, and `fdtd_run_table.csv` exports; imports
  `convergence_summary.json` plus optional per-run flux summaries; and shows residual-vs-resolution, energy-balance,
  field-delta, and PML/padding sensitivity diagnostics for empty-space, transparent-interface, transparent-slab,
  absorbing-slab, and mirror fixtures. L8.3 adds `surface_geometry_scene.json`, `surface_geometry_meep.py`,
  `surface_geometry_validation_report.md`, `surface_geometry_validation_report.json`, and
  `surface_geometry_metrics.csv` exports plus bundled `tools/fdtd/examples/l83_*` field, flux, receipt, manifest,
  script, and sweep-plan fixtures for transparent-block, absorbing-block, reflective-plate, aperture-blocker, and
  tilted-wedge diagnostics. L8.4 adds `aperture_validation_scene.json`, `aperture_validation_report.md`,
  `aperture_validation_report.json`, `aperture_metrics.csv`, `aperture_profile.csv`, and
  `aperture_convergence.csv` exports plus bundled `tools/fdtd/examples/l84_*` scene, manifest, script, receipt, flux,
  field-slice, profile, and convergence fixtures for long-slit, circular-pinhole, rectangular-aperture, and
  opaque-blocker diagnostics. Boundary: this is limited ordered optical-bench validation plus scalar preview,
  L9.2 diagnostic 2D sandbox handoff with optional WebGPU acceleration where supported, and external FDTD export/import and benchmark convergence evidence only, not production browser FDTD execution, arbitrary 3D
  material geometry, FEM/BEM/RCWA execution, real curved material lens solving, production metal aperture models,
  arbitrary CAD aperture-edge solving, sensor-stack EM, digital twin behavior, or manufacturing certification.

- `L7.8 Detector Round-Trip Acceptance Pack / Real Detector Bridge`: frequency-domain Maxwell planar multilayer transfer-matrix special case through
  the executable registered `PlanarTmmBackend`, with
  detector round-trip acceptance over board export, optional external detector helper output, import, receipt/hash
  validation, ID matching, diagnostic geometry fit, session QA handoff, and exports named `roundtrip_report.md`,
  `roundtrip_report.json`, `roundtrip_metrics.csv`, and `roundtrip_warnings.json`,
  external detector JSON/CSV import using the canonical `emmicro.detector.v1` receipt schema, optional external
  Python/OpenCV ChArUco runner tooling under `tools/detectors/`, detector/image/board hashes, import warnings,
  deterministic detector receipts, detector comparison, and exports named
  `detector_bridge_report.md`, `detector_bridge_report.json`, `imported_detections.csv`, and
  `detector_comparison.csv`,
  diagnostic ChArUco-style synthetic fiducial board generation, deterministic marker IDs and board coordinates,
  synthetic clean-board detections, JSON detection import, ID-to-board matching, partial-view coverage warnings,
  manual marker accept/reject/move/relabel correction, L7.2 similarity/affine/radial geometry-fit handoff, L7.4
  `fiducial_board` session QA handoff, and exports named `board_manifest.json`,
  `fiducial_detection_report.md`, `fiducial_detection_report.json`, `matched_points.csv`, and `rejected_points.csv`,
  batch session manifest import, deterministic synthetic/example frame rows, per-frame metric normalization from
  existing camera/geometric/MTF/detection results, aggregate repeatability metrics, drift slopes versus frame/focus/
  exposure/temperature, threshold controls, outlier tables, trend previews, session QA reports,
  generated/imported measured target image handling, numeric ROI controls, dot-grid threshold/polarity controls,
  connected-component blob detection, centroiding, grid row/column matching, manual point correction, detection
  confidence reports, L7.2 fit handoff, and target detection report exports,
  deterministic dot/checker/line geometric target generation, imported point CSV fitting, similarity/affine/radial
  k1/k2 diagnostic models, pixel-scale, rotation, shear, scale-anisotropy, residual vector map, residual heatmap,
  corrected/undistorted point preview, measured-vs-simulated geometry comparison, geometric calibration reports,
  synthetic/current-frame focus MTF sweeps, best-focus and depth-of-focus diagnostics, center/corner/3x3 field MTF
  mapping, worst-field ROI and center-corner falloff readouts, configurable diagnostic qualification thresholds,
  PASS/FAIL/WARNING reports, measured-vs-simulated focus/field residual comparison, focus/field/qualification exports,
  diagnostic spectral material records, editable film stacks, wavelength sweeps, planar E/H field-monitor samples,
  per-layer flux-drop absorption estimates, film-stack R/T/A, a visible-AR coating objective optimizer, certified
  best-candidate re-solve hashes, planar thickness tolerance/yield analysis, material import/audit evidence,
  imported-material selection, selected-material provenance receipts, deterministic coating material/order/thickness
  search, deterministic independent or correlated thickness-drift robust-yield re-ranking, candidate application,
  independent-thickness comparison metrics, sample reduction receipts, backend capability receipts,
  JSON/Markdown/CSV export, a scaffold-only `ExternalFdtdBackend` manifest/Meep-style script export, and an ordered
  scalar diffraction validation bench for the 500 nm source, 1 um circular aperture, independent numerical
  Huygens-Fresnel propagation, analytic Airy/Bessel reference maps, residual maps, radial mismatch curves,
  convergence controls, finite-plane energy checks, coherent long-slit `sinc^2` validation, double-slit/grating
  order validation, ideal thin-lens focal-plane scalar validation with the hand-check `r1 ~= 1.22 lambda f / D`,
  focus scan, scalar double-slit coherence validation with `I = |U1|^2 + |U2|^2 + 2 Re(gamma12 U1 U2*)`,
  measured visibility `V = (Imax - Imin) / (Imax + Imin)`, coherent/partial/incoherent maps, centerline profiles,
  order-spacing tables, saved studies, bounded parameter sweeps, marker/peak/minimum/profile measurement exports,
  gamma and selected-run comparisons, a capabilities matrix, study bundle JSON/Markdown/CSV exports/imports,
  measured CSV profile import, PNG/JPEG image-centerline import, calibration/ROI/normalization controls,
  measured-vs-simulated residual metrics, deterministic bounded shift/scale/background diagnostic fitting,
  comparison-study save, and comparison report JSON/Markdown/CSV exports,
  Slanted-Edge / Resolution Target MTF controls for generated or imported slanted-edge frames, edge angle, blur,
  contrast, oversampling, pixel pitch, MTF CSV import, Camera/Sensor-Lite DN-frame handoff, ESF/LSF/MTF preview curves,
  MTF50/MTF10/Nyquist readouts, cycles/pixel plus optional lp/mm units, measured-vs-simulated blur-response comparison,
  line-pair target generation, line-pair contrast rows, MTF study save, and MTF JSON/Markdown/CSV bundle exports,
  Camera Calibration Workbench controls for dark/flat/exposure summary CSV import, example datasets with or without
  known `photons_per_pixel`, deterministic source/data hashes, photon-transfer fit, fitted black level, conversion
  gain, read noise, dark current, full-well/saturation, linearly range diagnostics, SNR/dynamic-range metrics,
  QE reporting only when calibrated photon input is present, measured-vs-simulated camera curves, residual curves,
  apply-to-camera-profile, calibration-study save, and calibration JSON/Markdown/CSV bundle exports,
  Camera/Sensor-Lite acquisition controls for pixel pitch, sensor width/height, QE, exposure, photon flux scale,
  full well, read noise, dark current, ADC bit depth, conversion gain, black level, deterministic seed, and
  noiseless/shot/shot+read/shot+read+dark modes; it shows synthetic raw DN preview, histogram, before/after line
  profile, mean/peak photons/electrons/DN, saturation fraction, mean/peak SNR, dynamic range estimate, warnings,
  camera report exports, study save, and synthetic-camera send-to-measured comparison,
  Advisor Review Mode Markdown/JSON/CSV exports, accessible custom tooltips, under-the-hood
  formula/snippet panels, Explain mode highlighting, and a searchable explanation drawer,
  and strict limitations against arbitrary 3D EM, certified camera calibration, lab-accredited metrology,
  full 3D pose/stereo calibration, ISO 12233 certification, Imatest-equivalent testing, EMVA 1288
  certification, certified lab calibration, pure lens-only MTF certification, digital-twin, pixel-level sensor-stack EM,
  or stochastic source-engine claims.

## L2 Validation Fixture

The bundled L2 scene uses a 100 um rectangular slit, 500 nm wavelength, and 1 m propagation distance. The first
1D Fraunhofer minima are expected near +/-5 mm, and the core tests check that the simulated intensity profile
places the first minima there while conserving free-space field energy.

The L2.5 preset scenes add numeric checks for double-slit fringe spacing, grating order positions, passive
amplitude energy drop, phase-only energy preservation, bad sampling warnings, deterministic hashes, and export
metadata.

## L3 Validation Fixture

The bundled L3 scene uses a 500 nm coherent plane wave, a 20 mm focal-length thin-lens phase plane, and a 200 um
circular pupil on a 256 x 256 detector grid. Core tests check that the focal-plane peak is centered, that the
first low-intensity band falls near the scalar Airy first-minimum estimate, that pupil energy clipping and
free-space propagation energy accounting are stable, and that image exports include solver provenance.

The web workbench runs L3 image computations through a browser worker when available, falls back to the main
thread for test and unsupported contexts, caches identical scene results, and reports grid size, FFT count,
compute time, estimated memory, worker usage, and cache hits. The image view supports linear, log, and gamma
display mappings; the analysis panel reports peak location, centroid, radial low estimate, edge energy fraction,
and dynamic range for quick validation.

## L3.2 Instrument Performance

L3.2 converts the computed L3 detector intensity into engineering decision-support readouts. The bundled camera
model includes pixel pitch, sensor size, quantum efficiency, exposure, full well, read noise, dark current, bit
depth, gain, black level, and a deterministic seed. Camera output includes pixelated/noisy digital numbers,
saturation fraction, mean/peak SNR, dynamic range, and quantization warnings.

MTF is computed as `abs(FFT2(normalized PSF)) / DC` from the L3 coherent scalar detector image. Reports include
MTF50, MTF10, cutoff estimate, target-frequency contrast, sensor Nyquist frequency, and warnings for aliasing or
low contrast. These MTF values are explicitly coherent-scalar-derived and should not be read as a full incoherent
microscope MTF until a partial-coherence/incoherent imaging mode exists.

The sweep panel currently runs deterministic post-processing sweeps over camera/measurement parameters such as
exposure, quantum efficiency, and pixel pitch. Report export produces self-contained JSON, Markdown, and HTML
with scene/result hashes, solver version, camera settings, MTF/SNR/sampling summaries, warnings, performance
stats, provenance, and limitations.

## L3.3 Brightfield Partial Coherence

L3.3 keeps the 2D MVP scope and reuses the coherent L3 propagation path once per deterministic source angle.
The solver injects the selected target as an analytic 2D sample mask, runs the coherent sub-solve, and averages
detector intensities rather than complex fields. Bundled presets include line pairs, a slanted edge, and a
Siemens-star-like target.

The UI exposes source NA, source-angle count, and target selection for L3.3 scenes. The image panel adds
illumination, test-target, and resolution-target sections; report export includes source-angle and target
metadata. Slanted-edge SFR and target contrast are workbench estimates, not certified ISO measurements.

## L3.4B Measured-vs-Simulated Workbench

L3.4 adds the first compare-to-real scaffolding without adding a new physics solver. The web app can import a
PNG or JPEG target image, decode it in the browser, convert it to normalized grayscale `Float32Array` pixels for
core utilities, and store measured-image metadata in SceneV7. Core modules provide deterministic measured-image
hashing, histogram summaries, pixel-size calibration conversion, ROI coordinate transforms, ROI bounds warnings,
and nearest-neighbor ROI extraction.

L3.4B adds the working comparison loop. After importing a measured image and defining ROIs, the app can compare
the active measured ROI against the currently computed L3/L3.3 detector image. It computes line-pair contrast,
slanted-edge-style SFR, PSF centroid/FWHM, flat/dark frame statistics, metric deltas, a signed residual map, and a
measured/simulated cross-section plot. The fit panel runs a deterministic grid search over focus, resolution,
illumination, or camera-lite surrogate parameters such as effective NA, defocus, source NA, Gaussian blur,
intensity scale, and background offset. Fit output is diagnostic-only and includes score, residual RMS, grid count,
cache status, best parameters, warnings, and a deterministic result hash.

Comparison export produces `comparison_report.json`, `comparison_report.md`, `comparison_report.html`,
`measured_metrics.csv`, `fit_grid.csv`, and `residual.png` from the browser UI.

SceneV7 is additive: old scenes migrate with empty measured-image, calibration-target, ROI, comparison-run, and
fit-run arrays. The current L3.4B layer does not claim ISO 12233, EMVA 1288, clinical, or hardware calibration.
True 3D physics remains out of scope; 3D should wait until the 2D measured-data diagnostics are stronger.

## L4 Maxwell Phase 0/1

The L4 core modules live under `packages/core/src/maxwell`. They include a small complex-number utility, constant
complex refractive-index material samples, relative-permittivity conversion, absorption-coefficient diagnostics,
and a planar multilayer transfer-matrix solver for TE/TM plane waves. The bundled validation fixtures cover a bare
air/glass interface, a MgF2 quarter-wave AR coating, a lossy chromium-like film on glass, and an oblique TM AR
stack.

L4.1 adds `materialCatalog` and `coatingStack` modules. The material catalog is still a built-in diagnostic data
set, not an authoritative material database import, but it establishes the right API shape: wavelength-dependent
`n,k`, source/provenance notes, interpolation/clamping warnings, and passivity checks. The coating-stack runner
compiles material IDs and layer thicknesses into the planar TMM solver, then can run single-wavelength R/T/A or a
deterministic wavelength sweep with CSV/JSON/Markdown export.

L4.2 adds `planarFieldMonitor`. It samples the planar stack at the incident/substrate boundaries and at
front/mid/back points inside each coating layer. Outputs include complex tangential E/H values, |E|^2, phase,
normalized Poynting-style flux, a field plot in the UI, monitor CSV export, and per-layer absorption estimated from
front/back planar flux differences. These are planar TMM monitor observables, not full 3D field volumes or
volumetric absorption-density integrals.

This is Maxwell-first but intentionally narrow: the TMM path solves the planar film-stack special case directly
from frequency-domain boundary conditions and E/H admittance, not geometric raytracing. It does not solve curved
lenses, apertures, arbitrary 3D geometry, vector focusing through high-NA objectives, RCWA gratings, FEM/BEM
meshes, FDTD time marching, or pixel-level sensor absorption yet.

## L5.1 Maxwell Design Foundry

The first `trueem2.md` layer lives in `packages/core/src/maxwell/designFoundry.ts`. It introduces a declarative
planar coating objective schema with wavelength samples, weighted objective terms, scalar manufacturing constraints,
thickness variables, deterministic coordinate-search settings, candidate ranking, and result hashes.

The current optimizer is intentionally narrow. It searches coating layer thicknesses for the visible low-reflection
objective and evaluates every candidate through `runCoatingStack`, which compiles spectral materials, runs planar
TMM, computes the field monitor, and returns provenance/warnings. The accepted best candidate also carries a
certified single-wavelength stack run hash. The web panel exposes the objective, seed/best scores, mean reflectance,
evaluation count, best thicknesses, Apply Best, and Foundry JSON export.

This is the first layer above simulation: users can ask for a physical coating outcome instead of manually choosing
every thickness. By itself, it is still not adjoint optimization, topology optimization, digital-twin calibration,
PDK rule checking, or sensor-complete design.

## L5.2 Planar Tolerance Yield

The next `trueem2.md` layer lives in `packages/core/src/maxwell/coatingYield.ts`. It evaluates the foundry best stack
under deterministic coating-thickness perturbations, then re-solves every sample through the same planar Maxwell TMM
objective metrics. The report includes nominal performance, pass/fail requirements, pass rate, Wilson confidence
bounds, worst/best samples, and local finite-difference sensitivity by coating layer.

The current web panel shows pass rate, 95% confidence interval, sample count, worst score, per-requirement worst
values, top sensitivity rows, and `Yield JSON` export. Summary/JSON exports now include the stack run, field monitor,
foundry result, and yield analysis together.

This is useful as an early robust-design gate, but it is still only planar thickness tolerancing. It is not a
certified manufacturing yield claim, PDK rule check, digital-twin calibration, thermal/structural multiphysics, or a
full VVUQ process.

## L5.3 Material Import And Provenance

The material-import layer lives in `packages/core/src/maxwell/materialImport.ts`. It defines the
`emmicro.materials.v1` JSON package schema for sourced spectral `n,k` records, normalizes wavelength units
(`m`, `um`, `nm`), validates material family/source/sample fields, clamps negative extinction coefficients with
warnings, rejects duplicate wavelengths, and produces deterministic import/catalog audit hashes.

The web panel includes a Material Library card with record/sample counts, sourced versus diagnostic counts,
wavelength range, import-preview rows, `Material JSON` file preview, `Template JSON` export, and an example pack for
local smoke testing. Imported material records are audited and visible as provenance evidence.

This closes the first material-data gap without pretending the built-in records are authoritative. It is still not a
live refractiveindex.info integration, laboratory fit pipeline, Kramers-Kronig validation, licensing verifier, or
digital-twin material calibration.

## L5.4 Material Selection Integration

The material-selection layer extends `packages/core/src/maxwell/materialCatalog.ts` and
`packages/core/src/maxwell/coatingStack.ts`. Built-in diagnostic materials and imported material packs now share one
catalog. Built-ins keep stable short IDs such as `mgf2`; imported records receive deterministic hash-backed IDs of
the form `material:<packHash>:<materialHash>`.

Coating-stack compilation resolves `incidentMaterialId`, `substrateMaterialId`, and every coating-layer
`materialId` through that catalog before calling the planar TMM solver. Resolved Maxwell material samples carry the
catalog material ID, source record ID, pack hash, material hash, source text, and provenance notes. Imported material
extrapolation blocks by default in the core resolver; the web workbench can explicitly clamp for interactive sweeps
and surfaces warnings when wavelength coverage is exceeded.

Stack design serialization now saves material references with hashes and fails loudly if a saved imported material is
not loaded. The web panel groups material dropdowns into Built-in and Imported sections, shows a compact provenance
receipt beside the selected coating material, lets users add the first imported coating as a layer, and includes the
serialized design document in the L5.4 JSON export.

## L5.5 Coating Material/Order Search

The search layer lives in `packages/core/src/maxwell/coatingSearch.ts`. It accepts a search spec with target
wavelengths, angles, polarizations, candidate material IDs, layer-count bounds, thickness bounds, objective terms,
constraints, and deterministic beam-search settings. Each candidate is evaluated through `runCoatingStack`, so the
reported R/T/A metrics are still the existing planar Maxwell TMM special case rather than a separate optimizer-only
surrogate.

The first algorithm is intentionally bounded: it builds candidate material orders with a deterministic beam, samples
a coarse thickness grid for each extension, refines surviving candidates locally, ranks by weighted objective terms,
and preserves L5.4 material catalog receipts for every candidate. It supports reflectance minimization,
transmittance maximization, absorbance minimization, layer-count/thickness/total-thickness constraints, adjacent
duplicate rejection, imported material IDs, and serializable candidate application.

The web panel now presents this as the `Coating Stack Optimizer`. Users can choose candidate materials from the
active catalog, including imported pack records, set target wavelengths and layer/thickness bounds, find candidate
coatings, inspect ranked candidate metrics and material hashes, export `Optimizer JSON`, and apply a chosen
candidate back into the coating stack editor.

## L5.6 Robust-Yield Coating Search

The robust search layer lives in `packages/core/src/maxwell/coatingRobustSearch.ts`. It runs the L5.5 nominal
material/order/thickness beam search first, then evaluates the top nominal candidates under deterministic
thickness perturbation samples. The default robust ranking uses p90 score so candidate order reflects bad-but-plausible
thickness outcomes rather than only nominal performance. Users can also rank by expected score, worst-case score,
or pass rate when they supply a pass-score threshold.

The uncertainty model is intentionally minimal for this layer: scalar layer-thickness sigma in nm, signed
deterministic sigma levels, and a max sample cap. If the full Cartesian grid would exceed the cap, the robust
module falls back to a deterministic reduced sample set. Each sample is re-solved through the same planar Maxwell
TMM coating-stack path and the result records nominal metrics, expected/p90/worst robust score, pass rate when
configured, sample count, material hashes, imported pack hashes, and a receipt that imported and built-in material
`n,k` values were held fixed.

The web panel adds robust controls inside the Coating Stack Optimizer: `Robust optimizer`, thickness sigma, sigma
levels, max samples, ranking mode, optional pass score, `Find Robust Coating Candidates`, `Robust Optimizer JSON`,
and `Apply Robust Coating Candidate`.
This makes coating design manufacturing-aware without introducing correlated drift, material uncertainty,
Monte Carlo confidence intervals, 3D geometry, FEM/FDTD/BEM/RCWA, digital-twin calibration, or sensor electrical
transport.

## L5.7 Drift/Correlation Robust Yield

The drift/correlation layer adds `packages/core/src/maxwell/coatingUncertainty.ts` and extends
`coatingRobustSearch.ts`. The robust search still starts from the L5.5 nominal material/order/thickness beam search
and re-solves every robust sample through the same planar Maxwell TMM stack path. The new uncertainty model can
run the L5.6 independent layer-thickness grid or correlated deterministic drivers for shared deposition scale,
shared thickness offset, per-layer residual thickness, and layer-group drift.

Receipts now record the selected uncertainty model, generated versus theoretical samples, whether the deterministic
sample cap reduced the full Cartesian set, and the material `n,k` fixed-assumption boundary. Correlated robust
candidates also carry comparison metrics against an independent-thickness baseline so users can see whether shared
process drift changed p90/expected/worst yield behavior instead of only receiving a new ranking.

The web panel exposes a robust model selector with `Independent thickness`, `Shared deposition scale`, and
`Shared offset + residual`, plus sigma controls for thickness, scale, offset, residual, sample cap, ranking mode, and
pass-score threshold. Result rows show the chosen model receipt, sample reduction, correlated-vs-independent p90
comparison, material hashes, and `Apply Robust`.

L5.7 is still a deterministic planar coating workbench. It does not sample material-data uncertainty, roughness,
stress/thermal drift, metrology calibration data, Monte Carlo confidence intervals, 3D Maxwell geometry, RCWA
gratings, FEM/BEM/FDTD meshes, sensor transport, or manufacturing certification.

## L5.8 Solver Backend Boundary

The backend-boundary layer adds `packages/core/src/maxwell/solverBackend.ts`,
`maxwellProblem.ts`, `maxwellResult.ts`, `solverRegistry.ts`, `planarSceneCompiler.ts`, and
`planarTmmBackend.ts`. It defines a solver-neutral Maxwell problem/result envelope and a
`MaxwellSolverBackend` contract, then registers `PlanarTmmBackend` as the only available backend.

`PlanarTmmBackend` does not duplicate or replace the physics math. It compiles a `PlanarStackProblem` back into the
existing coating-stack runner, calls `runCoatingStack`, and exposes the original direct result inside a backend
result envelope. Core parity tests verify that direct `runCoatingStack` and backend-wrapped solves match R/T/A and
energy-balance metrics, while preserving material IDs, material hashes, imported pack hashes, warnings, and
deterministic result hashes.

The backend registry has type-level future slots for `rcwa`, `fdtd`, `fem-frequency-domain`, and
`bem-frequency-domain`, but those methods are explicitly unavailable in L5.8. The registered planar backend reports
`dimensions: ["1d-planar"]`, `geometry: ["planar-layers"]`, field-monitor support, material provenance support,
and `false` for 3D geometry, volumetric fields, apertures, curved surfaces, FEM, FDTD, BEM, and RCWA.

Coating search and robust/correlated robust yield evaluation now use the backend wrapper for planar stack
evaluations where practical, while the direct low-level TMM helper remains available for tests and parity checks.
JSON/Markdown exports include the active backend receipt so downstream tooling can see the method, capability
boundary, and unsupported future solver classes.

L5.8 is architecture preparation, not new physics. It is still not a 3D Maxwell solver, FEM/FDTD/BEM/RCWA engine,
arbitrary CAD geometry solver, aperture diffraction model, curved lens solver, sensor-stack transport model,
material-uncertainty engine, digital twin, or manufacturing certification system.

## L6.0 3D Maxwell Schema and FDTD Scaffold

L6.0 starts the 3D Maxwell runway without turning the browser app into a fake 3D solver. It adds
`maxwell3dTypes.ts`, `maxwell3dValidation.ts`, `fieldDatasetManifest.ts`, `externalFdtdBackend.ts`, and
`meepExport.ts` to define a minimal 3D scene contract:

- `MaxwellScene3D` with units, domain size/resolution, background material, PML/periodic/PEC boundaries, objects,
  sources, monitors, material receipts, and a deterministic scene hash.
- Minimal geometry: boxes and spheres.
- Minimal source/monitor contracts: plane-wave sources, field-volume monitors, and flux-plane monitors.
- Field dataset manifest types for future openPMD/HDF5-style external field outputs.
- `ExternalFdtdBackend`, registered as `scaffold-only` with `method: "fdtd"` and `dimensions: ["3d"]`.

`ExternalFdtdBackend` advertises the future 3D/FDTD capability boundary but throws `UnsupportedBackendError` on
`solve()` in L6.0. The backend registry therefore distinguishes registered scaffolds from executable solvers:
`PlanarTmmBackend` remains the only executable backend, and `fdtd` remains unavailable for in-app solves.

The web panel shows a `Future 3D Backends` section with `ExternalFdtdBackend` marked as
`schema/export only in L6.0`. `Export 3D FDTD Scaffold` downloads a deterministic JSON payload containing the
3D scene manifest, material receipts, scaffold backend receipt, deterministic scene/export hashes, and a Meep-style
Python script skeleton. The script is labeled:

```text
Generated scaffold only; not yet validated as an executable Meep workflow.
```

L6.0 does not execute 3D Maxwell solves. It defines the 3D problem/result contract and external-backend export
scaffold only. It still does not implement FDTD execution, WebAssembly FDTD, FEM, BEM, RCWA, CAD import, curved
lenses, aperture diffraction solves, volumetric E/H solve results from a real backend, sensor-stack electrical
transport, digital-twin calibration, adjoint/topology optimization, or a GPU/HPC job runner.

## L6.1 Diffraction Validation Bench

L6.1 adds a visible `Validation Bench` card for a hand-checkable scalar diffraction exam:

```text
source -> propagation to aperture -> circular aperture mask -> propagation to observation plane -> intensity map -> analytic check
```

The default benchmark is the advisor's "1 um diameter with Bessel check" case interpreted physically as a circular
pinhole, not a long slit:

- Monochromatic point source at `(0, 0, 0)`, wavelength `500 nm`.
- Ideal zero-thickness circular amplitude aperture, diameter `1 um`, centered at `z = 10 mm`.
- Zero-thickness `10 mm x 10 mm` observation plane at `z = 20 mm`, with an observation-z slider.
- Normalized 2D scalar intensity map.
- Radial Airy/Bessel profile overlay.
- JSON and Markdown exports with formulas, expected values, residuals, warnings, hashes, and limitations.

The analytic reference is:

```text
I/I0 = [2 J1(k a sin(theta)) / (k a sin(theta))]^2
sin(theta) = rho / sqrt(rho^2 + L^2)
k a sin(theta) = 3.831705970... at the first Airy minimum
```

For the default geometry, the first Airy minimum is about `7.7 mm` from the optical axis. The detector half-width is
`5.0 mm`, and even the half-diagonal is only about `7.07 mm`, so the UI reports that the first minimum is outside
the `10 mm x 10 mm` observation plane. That warning is intentional validation evidence, not a failure.

This benchmark treats the point emitter as one monochromatic spatial mode and reports time-averaged intensity.
Multi-point incoherent source summation is a later validation case. Long-slit `sinc^2` diffraction is also a later
separate benchmark; L6.1 keeps the Bessel/Airy case named as a circular pinhole.

L6.1 is still not a full 3D Maxwell aperture solver. It does not model a finite-thickness metal screen, aperture
material interaction, edge boundary conditions, subwavelength-aperture vector effects, FDTD/FEM/BEM/RCWA execution,
curved lenses, sensor transport, or microscope digital-twin calibration.

## L6.2 Numerical Scalar Propagation Validation

L6.2 keeps the same circular pinhole geometry, but adds an independent numerical propagation path so the validation
bench is not just drawing the Airy formula:

```text
source -> aperture field -> numerical scalar propagation -> observation plane -> analytic comparison -> residual report
```

The numerical result uses deterministic radial Huygens-Fresnel quadrature over the ideal circular aperture:

```text
U(rho) ~= integral_aperture exp(i k (R - L)) r dr dphi
```

That computed radial field is rendered onto the zero-thickness 2D observation plane and compared against the analytic
Airy/Bessel reference:

```text
I/I0 = [2 J1(k a sin(theta)) / (k a sin(theta))]^2
sin(theta) = rho / sqrt(rho^2 + L^2)
```

The visible `Validation Bench` now includes:

- Computation mode selector: analytic reference, numerical scalar propagation, or numerical-vs-analytic comparison.
- Convergence controls for observation map grid, radial observation samples, aperture radial samples, and aperture
  angular samples.
- Numerical intensity map, analytic reference map, and residual map.
- Radial numerical-vs-analytic overlay and signed residual curve.
- RMS residual, max residual, center normalization error, radial symmetry error, measured first-minimum radius when the
  detector includes it, first-minimum error, and finite-plane peak-normalized energy-integral comparison.
- JSON and Markdown exports with numerical method, grid/sampling settings, formulas, residuals, warnings, hashes, and
  limitation language.

For the default `10 mm x 10 mm` observation plane at `z = 20 mm`, L6.2 intentionally preserves the L6.1 warning that
the expected first Airy minimum is about `7.7 mm` from center and therefore outside the square detector's half-diagonal.
When the plane is widened enough to include that radius, the numerical profile reports a measured first minimum and
first-minimum error.

L6.2 remains scalar diffraction validation. It does not execute FDTD, FEM, BEM, RCWA, finite-thickness aperture
material interaction, curved lenses, sensor transport, or microscope digital-twin calibration.

## L6.3 Coherent Slit And Order Validation Bench

L6.3 extends the visible validation ladder beyond the circular-aperture Airy/Bessel case with two hand-checkable
coherent scalar diffraction benchmarks and a combined advisor export mode.

The long single-slit benchmark uses the default `lambda = 500 nm`, slit width `a = 100 um`, propagation distance
`L = 1 m`, and a `25 mm` observation width. The expected Fraunhofer minima follow:

```text
a sin(theta) = m lambda
y_m ~= m lambda L / a
I/I0 = sinc^2(pi a sin(theta) / lambda)
```

For the default geometry, the first minima are expected at about `+/-5.00 mm`. The numerical path integrates the
coherent aperture field across the open slit and compares the resulting observation-plane profile against the
analytic `sinc^2` reference, reporting measured minima, RMS residual, max residual, warnings, and deterministic
hashes.

The double-slit/order benchmark uses the default `lambda = 500 nm`, slit separation `d = 100 um`, slit width
`a = 20 um`, propagation distance `L = 1 m`, and a `40 mm` observation width. The expected order spacing follows:

```text
d sin(theta) = m lambda
Delta y ~= lambda L / d
I/I0 = sinc^2(pi a sin(theta) / lambda) cos^2(pi d sin(theta) / lambda)
```

For the default geometry, orders are spaced about `5.00 mm` apart. The visible table reports the expected and
measured positions for orders around `m = -2..+2`, with the finite-slit envelope kept explicit.

Advisor Review Mode runs the circular aperture, long single-slit, and double-slit/order validations together and
exports `advisor_validation_report.md`, `advisor_validation_report.json`, and `advisor_validation_report.csv`. This
mode is meant to give a compact proof packet for review: benchmark name, method, status, key metric, warnings, and
hash evidence.

L6.3 remains scalar diffraction validation. It does not execute FDTD, FEM, BEM, RCWA, material aperture interaction,
finite-thickness screens, curved lenses, sensor transport, arbitrary 3D geometry, or microscope digital-twin
calibration.

## L6.3a Explainability Layer

L6.3a adds a UI/education layer without changing the solvers. Important labels, controls, metrics, panels, badges,
and result values can expose short custom tooltips on hover or keyboard focus. These tooltips are implemented with
`aria-describedby` and `role="tooltip"` and are dismissible with Escape; the app does not rely on native `title`
attributes for the visible Maxwell explainability content.

Richer explanations live outside tooltips in keyboard/touch-accessible under-the-hood panels and the searchable
`Show all explanations` drawer. Those panels include formulas, snippets, units, assumptions, and limitation notes
for Airy/Bessel references, scalar Huygens-Fresnel propagation, residual metrics, finite-plane checks,
`PlanarTmmBackend`, scaffold-only `ExternalFdtdBackend`, material provenance, coating R/T/A, and robust p90/sample
reduction meanings.

The boundary language stays explicit: diffraction explanations describe scalar validation only, the executable
Maxwell path remains planar TMM only, and L6.3a does not add full 3D Maxwell, FDTD, FEM, BEM, RCWA, finite-thickness
aperture, sensor, or digital-twin execution.

## L6.4 Ideal Thin Lens Focal-Plane Validation

L6.4 extends the ordered scalar validation ladder to the advisor's next physical step:

```text
source -> lens phase -> circular pupil -> scalar propagation -> focal plane -> Airy check
```

The default benchmark is deliberately hand-checkable:

- Coherent plane wave, `lambda = 500 nm`.
- Ideal zero-thickness thin-lens phase mask, `f = 20 mm`.
- Circular clear pupil, `D = 200 um`.
- Observation plane at `z = 20 mm`, with a `300 um x 300 um` field of view.
- Expected first dark ring `r1 ~= 1.22 lambda f / D`, about `61 um`.

The numerical path uses deterministic scalar Fresnel quadrature through the ideal thin-lens phase and circular pupil:

```text
tau_lens(u,v) = P(u,v) exp[-i k (u^2 + v^2) / (2f)]
```

It renders a numerical focal-plane map, analytic Airy PSF map, residual map, radial numerical-vs-analytic overlay,
residual curve, measured first-dark radius when visible, RMS/max residuals, center normalization error, radial
symmetry error, finite-plane integral comparison, and a focus scan around `z=f`.

L6.4 exports `l64-thin-lens-focal-validation.json`, `.md`, and `.csv`, and Advisor Review Mode now includes the
thin-lens focal-plane benchmark alongside circular pinhole, single-slit, and double-slit/order checks.

L6.4 remains scalar ideal-lens validation. It does not model curved/thick glass, refractive material volume,
dispersion, coatings, chromatic aberration, vector polarization, real sensor response, ray tracing, full 3D Maxwell,
FDTD, FEM, BEM, RCWA, or microscope digital-twin behavior.

## L6.4b Guided Optical Bench Terminology

L6.4b is a UI/readability patch, not a physics change. It separates the two active mental models:

- `Validation Bench: spatial optical layout` for source -> aperture/slit/lens -> observation-plane scalar
  validation along the optical z-axis.
- `Coating Stack Workbench: planar layer model` for light direction -> incident medium -> coating layers ->
  substrate medium in the executable planar TMM solver.

The validation plots now show "Where is this measured?" notes explaining that radial overlays, centerline overlays,
residual curves, and focus diagnostics are extracted from zero-thickness observation planes. The coating R/T/A and
field-monitor panels now state that measurements are across an ideal infinite planar stack, with the incident side
before the first layer and the substrate side after the last layer. There is no 3D source-to-substrate distance in
the coating solver.

The visible former Search UI is renamed to `Coating Stack Optimizer`: `Find Candidate Coatings`, `Optimizer JSON`,
and `Apply Coating Candidate`. The helper copy states that the optimizer tries selected local materials, layer
orders, and thicknesses; it does not search the internet or fetch new material data.

## L6.5 Coherence Demonstrator

L6.5 adds a Validation Bench entry named `Coherence Demonstrator` for the same hand-checkable double-slit geometry:
`lambda=500 nm`, slit width `a=20 um`, slit separation `d=100 um`, and propagation distance `L=1 m`.

The demonstrator computes separate scalar slit fields `U1` and `U2`, then renders:

- coherent fields: `|U1 + U2|^2`
- incoherent intensities: `|U1|^2 + |U2|^2`
- partial coherence: `|U1|^2 + |U2|^2 + 2 Re(gamma12 U1 U2*)`

The `|gamma12|` control runs from `0` to `1` and defaults to `1`. The measured fringe visibility is reported as
`V = (Imax - Imin) / (Imax + Imin)` and should approximately track `|gamma12|` for equal slit intensities.
The panel shows coherent, incoherent, partial-coherence, and interference-term maps, a centerline profile,
order-position table, "Where is this measured?" guidance, and `l65-coherence-demonstrator` Markdown/JSON/CSV exports.

This is a scalar coherence validation demonstrator. It is not a stochastic/vector coherence engine, FDTD/FEM/BEM/RCWA
solve, real source-statistics model, microscope sensor model, or 3D Maxwell execution path.

## L6.6 Practical Study Workspace

L6.6 is a workflow layer over the existing executable engines. It does not add a new Maxwell solver, but it makes
the planar/scalar proof surface more useful for repeatable studies:

- `Study Manager`: save the active validation or coating state, load it back into the app, duplicate/delete runs,
  export a study bundle, import a bundle, and copy a shareable URL containing the current study state.
- `Parameter Sweep Runner`: run bounded sweeps for coherence `gamma12`, validation wavelength, observation distance,
  slit width, double-slit separation, thin-lens defocus, coating wavelength, and core robust-coating sigma studies.
- `Measurement Tools`: pin a crosshair marker, detect a peak/minimum on the active scalar field, measure marker
  distance, and export centerline profiles as CSV for downstream review.
- `Run Comparison`: compare the hand-check coherent-versus-incoherent gamma endpoints or compare two saved studies
  by metric deltas, warnings, limitations, and hash evidence.
- `Capabilities Matrix`: show which pieces are executable, scaffolded, planned, or unavailable so the UI does not
  overclaim 3D Maxwell, FDTD, FEM, BEM, RCWA, CAD geometry, sensor simulation, digital twins, or certification.
- `Study Bundle Export`: produce JSON/Markdown/CSV artifacts with study metadata, metrics, profiles, warnings,
  capabilities, backend/material/uncertainty receipts, result hashes, and explicit limitations.

The L6.6 core is deterministic and covered by source-level tests for save/reimport, practical sweeps, measurement
helpers, run comparison, and capability matrix boundaries. Browser smoke should cover the visible capabilities
matrix, study save/export/import affordances, sweep output, measurement markers, comparison exports, and coating
study export.

## L6.7 Measured-vs-Simulated Lab Data Workbench

L6.7 is a lab-data comparison layer over the existing scalar validation and planar TMM outputs. It does not add new
diffraction physics, FDTD/FEM/BEM/RCWA execution, a sensor-stack model, certified calibration, or a microscope
digital twin.

- `Measured import`: import CSV profiles directly, or import PNG/JPEG images as deterministic grayscale centerline
  profiles with image/data hashes.
- `Calibration and ROI`: set pixel size, x offset, ROI min/max, and normalization assumptions before comparing.
- `Compare`: compare measured profile samples against the selected active validation profile or a saved study
  profile, then report RMS residual, MAE residual, max residual, normalized cross-correlation, peak/centroid/FWHM
  errors, first-minimum error where available, visibility error, and area ratio.
- `Diagnostic fit`: run a bounded deterministic grid search over x shift, intensity scale, and background offset.
  The fit reports before/after score, best parameters, fit hash, and warnings.
- `Study integration`: save measured comparisons into the Study Manager with residual, measured, and simulated
  profiles plus measured-data hashes and fit hashes.
- `Report bundle`: export `comparison_report.json`, `comparison_report.md`, measured metrics CSV, simulated metrics
  CSV, residual profile CSV, fit grid CSV, and warnings JSON.

The L6.7 tests cover CSV import, image-centerline import, deterministic hashes, ROI/normalization, profile residual
metrics, diagnostic shift/scale/background fitting, report bundle contents, and no-overclaim boundary language.
Browser smoke should cover generating/importing a measured CSV profile, comparing it to an active validation
profile, running the diagnostic fit, exporting the report bundle, saving the comparison study, and re-smoking the
coating optimizer.

## L6.8 Camera/Sensor-Lite Acquisition Workbench

L6.8 is a detector/acquisition layer over existing scalar validation and planar TMM outputs. It converts a selected
simulated optical profile into synthetic camera output, then lets that synthetic camera profile enter the L6.7
measured-vs-simulated comparison workflow.

- `Camera settings`: pixel pitch, sensor width/height, quantum efficiency, exposure, photon flux scale, full well,
  read noise, dark current, ADC bit depth, conversion gain, black level, deterministic seed, and noise mode.
- `Noise modes`: ideal/noiseless, shot only, shot + read, and shot + read + dark.
- `Output maps`: normalized optical intensity, photons, signal electrons, noisy/clipped electrons, DN/raw image,
  saturation mask, SNR estimates, histogram, and centerline profile.
- `Metrics and warnings`: mean/peak photons, mean/peak electrons, mean/peak DN, saturation fraction, mean/peak SNR,
  dynamic range estimate, quantization step, low-signal warnings, saturation warnings, and boundary warnings.
- `Measured integration`: `Send synthetic camera image to Measured-vs-Simulated` creates a deterministic synthetic
  measured image-centerline dataset, preserves the source optical result hash and camera run hash, and compares it
  against the clean simulated profile.
- `Study and export integration`: camera studies save settings, source hashes, result hashes, metrics, warnings,
  optical/photon/electron/DN profiles, and limitations. Camera exports include `camera_report.json`,
  `camera_report.md`, `camera_metrics.csv`, `camera_profile.csv`, `camera_histogram.csv`, and `warnings.json`.

This is not a pixel-level electromagnetic sensor-stack model. It does not model microlenses, color filters,
passivation, charge diffusion, semiconductor transport, calibrated sensor stacks, certified EMVA 1288
characterization, certified calibration, digital twins, manufacturing certification, or 3D Maxwell/FDTD/FEM/BEM/RCWA
execution.

The L6.8 tests cover intensity-to-photon/electron/DN conversion, QE/exposure scaling, full-well and ADC clipping,
determinism by seed, all noise modes, SNR/saturation/quantization warnings, camera exports, synthetic-camera
handoff into measured comparison, and capability-boundary rows for camera acquisition versus unavailable
pixel-level sensor stacks and certified EMVA characterization.

## L6.9 Camera Calibration / Photon-Transfer Workbench

L6.9 is a measurement-driven diagnostic layer over L6.8 Camera/Sensor-Lite. It imports summary measurements from
dark frames, flat frames, and exposure sweeps, then estimates an L6.8-compatible camera profile and compares
measured camera behavior against the fitted simulation curve.

- `Calibration import`: accepts summary CSV rows with `frame_type`, `exposure_ms`, `mean_dn`, `variance_dn2`,
  optional `photons_per_pixel`, optional `temperature_c`, and notes. The importer validates required columns,
  skips malformed rows with warnings, preserves source names, and hashes both source text and normalized data.
- `Photon-transfer diagnostics`: estimates black level, dark offset vs exposure, dark current, read noise,
  variance-vs-mean conversion gain, full well/saturation, linearity error, SNR curve, and dynamic range.
- `QE identifiability`: effective QE is estimated only when calibrated `photons_per_pixel` input is present. Without
  photon input, the report explicitly states that QE cannot be estimated.
- `Fitted camera profile`: reports pixel pitch, QE if identifiable, full well, read noise, dark current,
  DN/e- gain, e-/DN conversion gain, black level, ADC bit depth, and saturation DN, and can apply those values back
  into the Camera/Sensor-Lite controls.
- `Measured-vs-simulated camera comparison`: exports measured/simulated mean DN, variance, SNR, residual RMS,
  max residual, linearity error, SNR mismatch, and saturation mismatch.
- `Study and export integration`: calibration studies save fitted profiles, data hashes, assumptions, warnings,
  residual profiles, and limitations. Calibration exports include `camera_calibration_report.json`,
  `camera_calibration_report.md`, `camera_calibration_metrics.csv`, `camera_photon_transfer.csv`,
  `camera_residuals.csv`, and warnings JSON.

This is an EMVA-inspired diagnostic workflow only. It is not EMVA 1288 certification, ISO-certified calibration,
lab-accredited camera characterization, hardware control, raw frame-stack metrology, pixel-level charge transport,
sensor-stack electromagnetic absorption, digital twin calibration, manufacturing certification, or full 3D
Maxwell/FDTD/FEM/BEM/RCWA execution.

The L6.9 tests cover calibration CSV import, deterministic hashes, missing-column validation, sparse/saturated data
warnings, black-level/dark-current/read-noise/gain/full-well estimates, QE identifiability, measured-vs-simulated
residuals, Markdown/JSON/CSV exports, study capability boundaries, and L6.8 camera regression coverage.

## L7.0 Slanted-Edge / Resolution Target MTF Workbench

L7.0 is an image-quality diagnostic layer over the existing study and camera-lite workspace. It does not add new
Maxwell physics; it analyzes 2D target images produced by the browser or imported as CSV frames.

- `Slanted-edge target generation`: creates deterministic high-contrast slanted-edge targets with configurable
  width, height, edge angle, contrast, blur sigma, and pixel pitch.
- `Imported MTF frames`: accepts numeric matrix CSV or `x_px,y_px,dn` CSV rows, then runs the same ROI-based
  slanted-edge analysis path.
- `ESF/LSF/SFR-MTF`: estimates the edge angle, bins an oversampled ESF, derives an LSF, applies a selected window,
  computes MTF, and reports MTF50, MTF10, MTF at Nyquist, cycles/pixel, and lp/mm when pixel pitch is known.
- `Measured-vs-simulated MTF`: compares the current run to a generated blurrier reference and exports the residual
  curve, RMS delta, max delta, MTF50 delta, MTF10 delta, and Nyquist delta.
- `Line-pair sanity check`: generates deterministic line-pair bands and reports Michelson contrast per frequency.
- `Camera-lite handoff`: sends the current Camera/Sensor-Lite DN frame into the MTF workbench as normalized image
  samples with the current calibrated pixel pitch.
- `Study and export integration`: MTF studies save metrics, ESF/LSF/MTF profiles, hashes, warnings, limitations,
  and report bundles. Exports include `l70-mtf_report.json`, `l70-mtf_report.md`, `l70-mtf_curve.csv`,
  `l70-mtf_esf.csv`, `l70-mtf_lsf.csv`, optional `l70-mtf_comparison.csv`, and optional
  `l70-line_pair_contrast.csv`.

This is ISO 12233-inspired diagnostic analysis only. It is not ISO 12233 certification, Imatest-equivalent
measurement, lab-accredited metrology, pure lens-only MTF certification, optical manufacturing certification,
pixel-level sensor-stack EM, or full 3D Maxwell/FDTD/FEM/BEM/RCWA execution.

The L7.0 tests cover deterministic slanted-edge target generation, edge-angle estimation, ESF/LSF/MTF construction,
MTF50/MTF10/Nyquist metrics, lp/mm conversion, blur reducing MTF50, measured-vs-simulated MTF comparison, warning
boundaries, line-pair contrast, CSV import, and report exports.

## L7.1 Focus + Field MTF Qualification Workbench

L7.1 is a diagnostic qualification layer over L7.0 slanted-edge MTF. It does not add new propagation physics or a
calibrated optical model; it organizes focus and field MTF measurements into practical acceptance reports.

- `Focus sweep MTF`: runs deterministic synthetic focus sweeps or imports the current L7.0 MTF result as a focus row,
  then reports MTF50/MTF10/Nyquist/area vs focus, best focus, depth of focus, edge-of-sweep warnings, and CSV export.
- `Field MTF map`: analyzes center, center+corners, or 3x3 ROI layouts, then reports best/worst ROI, center MTF50,
  corner average MTF50, center-corner falloff, field uniformity, ROI warnings, and CSV export.
- `Qualification thresholds`: applies configurable center MTF50, worst-field MTF50, Nyquist MTF availability/value,
  depth-of-focus, saturation, low-contrast, and bad-angle policies to produce PASS, FAIL, or WARNING.
- `Measured-vs-simulated comparison`: compares focus curves and field maps against a deterministic simulated reference,
  reporting best-focus delta, focus RMS delta, field MTF50 RMS delta, matched ROI count, and comparison CSV.
- `Study and export integration`: L7.1 studies save focus/field/qualification hashes, metrics, profiles, warnings,
  limitations, capabilities, and bundle exports. The focused qualification export writes `focus_sweep.csv`,
  `field_mtf_map.csv`, `qualification_report.md`, `qualification_report.json`, and `mtf_comparison.csv`.

This is diagnostic focus/field MTF thresholding only. It is not ISO 12233 certification, Imatest-equivalent testing,
lab-accredited metrology, calibrated optical model fitting, pure lens-only MTF certification, optical manufacturing
certification, pixel-level sensor-stack EM, or full 3D Maxwell/FDTD/FEM/BEM/RCWA execution.

## L7.2 Geometric Calibration / Distortion & Pixel-Scale Workbench

L7.2 adds a diagnostic 2D image-geometry layer over the study workspace. It does not add hardware control, certified
camera calibration, multi-view bundle adjustment, 3D pose calibration, stereo calibration, digital-twin metrology, or
new Maxwell physics.

- `Target generation`: creates deterministic dot-grid, checkerboard, or line-grid calibration targets with image
  hashes, point tables, configurable rows/columns/spacing/pixel pitch/rotation, and optional radial k1/k2 distortion.
- `Point import`: accepts `id,x_px,y_px` CSV points with optional `x_world_um,y_world_um,row,col`, fills grid world
  coordinates from spacing where possible, and records source hashes plus warnings.
- `Fitting`: runs similarity, affine, radial-k1, or radial-k1+k2 diagnostic fits and reports pixel scale, rotation,
  shear, scale anisotropy, radial terms, RMS/max residuals, field distortion, corner/center residuals, and straight
  line bow.
- `Visualization`: shows target point overlays, fit metrics, residual vectors, residual heatmap, corrected or
  undistorted point previews, and measured-vs-simulated geometry deltas.
- `Study and export integration`: L7.2 studies save target/point/fit/comparison hashes, metrics, residual profiles,
  warnings, limitations, and capabilities. Exports include `geometric_calibration_report.md`,
  `geometric_calibration_report.json`, `points.csv`, `residuals.csv`, `distortion_map.csv`, and
  `geometric_comparison.csv`.

This is diagnostic 2D image-geometry analysis only. It is not certified camera calibration, ISO/Imatest-equivalent
measurement, lab-accredited metrology, full 3D pose or stereo calibration, raw sensor-stack EM, digital-twin
manufacturing calibration, or full 3D Maxwell/FDTD/FEM/BEM/RCWA execution.

## L7.3 Measured Target Detection and ROI Hardening

L7.3 turns the L7.2 target workflow into a measured-image workflow without changing the physics backend. It remains a
diagnostic single-image 2D grid-point extraction and geometry-fit tool, not a certified calibration system.

- `Measured target image`: uses generated targets as measured frames or imports PNG/JPEG/WebP images, normalizes them
  to deterministic grayscale target images, records image hashes, and exposes ROI x/y/width/height controls.
- `Dot-grid detection`: supports auto/manual threshold, dark-on-light or light-on-dark polarity, connected-component
  blob filtering, centroid refinement, grid row/column assignment, world-coordinate mapping, duplicate/outlier
  rejection, and confidence warnings for low contrast, saturation, missing points, duplicate grid cells, and residuals.
- `Manual correction`: lets the operator move, reject, accept, add, or delete points, then feeds accepted points into
  the existing L7.2 similarity/affine/radial fit models.
- `Visualization and reports`: overlays the measured image raster, ROI rectangle, accepted/rejected points, optional
  labels, and post-fit confidence values. Exports include `detected_points.csv`, `rejected_points.csv`,
  `detection_report.md`, and `detection_report.json`.
- `Capability boundaries`: dot-grid detection is executable; checkerboard automatic detection is scaffold-only;
  AprilTag/ArUco detection, certified camera calibration, lab metrology, full 3D pose/stereo, digital twins, hardware
  control, sensor-stack EM, and full 3D Maxwell/FDTD/FEM/BEM/RCWA execution are not implemented.

## L7.4 Batch Measurement Session + Repeatability QA

L7.4 turns individual diagnostic outputs into a repeatable session review layer without changing the physics backend.
It remains diagnostic batch QA over existing L6.8-L7.3 metrics, not a certified metrology or accreditation workflow.

- `Session manifest`: imports CSV rows with `frame_id`, `type`, `path_or_name` or `source_label`, optional focus,
  exposure, gain, temperature, notes, deterministic row hashes, duplicate-ID warnings, and an example manifest.
- `Frame normalization`: maps geometric fits, measured target detection, slanted-edge MTF, focus/field MTF,
  camera calibration, and camera frame runs into a shared per-frame metric schema; example rows fall back to
  deterministic synthetic frame metrics for smoke and demos.
- `Repeatability QA`: aggregates mean/std/min/max/coefficient-of-variation, repeatability standard deviation, best/worst
  frame, and drift slopes versus frame order, focus, exposure, and temperature.
- `Outlier review`: threshold controls cover geometric RMS residual, pixel-scale repeatability, minimum MTF50, MTF50 CV,
  camera black-level drift, warning count, detection coverage, and z-score outliers.
- `Reports and study integration`: exports `session_report.md`, `session_report.json`, `frame_metrics.csv`,
  `session_metrics.csv`, `outliers.csv`, and `warnings.json`, saves L7.4 session studies, and includes session QA
  in study bundles and capability exports.
- `Capability boundaries`: session QA and repeatability diagnostics are executable; certified metrology reports,
  lab accreditation workflows, hardware control, manufacturing certification, calibrated optical model fitting,
  sensor-stack EM, full 3D pose/stereo, AprilTag/ArUco detection, and full 3D Maxwell/FDTD/FEM/BEM/RCWA/CAD execution
  are not implemented.

## L7.5 Fiducial Board / ChArUco-style Target Workflow

L7.5 adds a diagnostic fiducial-board workflow on top of the L7.2 geometry and L7.4 session QA layers without
claiming real detector decoding or certified calibration. The default board is a deterministic ChArUco-style
synthetic target for internal diagnostics; it is not OpenCV-compatible ArUco/ChArUco marker encoding.

- `Board generation`: creates deterministic marker IDs, marker/world coordinates, ChArUco-style corner IDs, a
  synthetic preview image, manifest hashes, and `board_manifest.json` exports.
- `Detection import and synthetic smoke data`: supports deterministic synthetic clean-board detections plus JSON
  detection import. Core also validates marker-corner CSV and ChArUco-style corner CSV imports with duplicate-ID and
  missing-column errors.
- `Matching and QA`: matches marker and ChArUco-style corner IDs to board coordinates, reports marker coverage,
  ChArUco corner coverage, board-area coverage, covered quadrants, missing IDs, duplicate IDs, and partial-view/radial
  coverage warnings.
- `Manual correction`: accepts/rejects markers, moves marker corners, and relabels markers before re-matching and
  refitting.
- `Geometry and session handoff`: matched points feed existing L7.2 similarity/affine/radial diagnostic fits, and
  L7.5 fit results can be inserted into L7.4 session QA as `fiducial_board` frames.
- `Exports and study integration`: exports `fiducial_detection_report.md`,
  `fiducial_detection_report.json`, `matched_points.csv`, `rejected_points.csv`, and study bundles with L7.5
  capability boundaries.
- `Capability boundaries`: real OpenCV ArUco/ChArUco marker decoding, AprilTag decoding, certified camera
  calibration, lab-accredited metrology, hardware control, full 3D pose/stereo calibration, digital twins,
  manufacturing certification, and full 3D Maxwell/FDTD/FEM/BEM/RCWA/CAD execution are not implemented.

## L7.6 Real Detector Bridge / External CV Integration

L7.6 adds the practical bridge between real external computer-vision detector output and the existing L7.5 fiducial
workflow. It accepts detector results from outside the browser, validates their receipts, and hands accepted points to
the same matching, manual review, geometry fit, and session QA path already used by synthetic fiducial detections.

- `Canonical JSON import`: validates `emmicro.detector.v1` detector receipts with detector name/version, runner hash,
  parameters, image hash/size, board ID/hash, marker corners, ChArUco-style corners, low-confidence warnings, mismatch
  warnings, unknown-ID warnings, duplicate-ID rejection, corner-count rejection, corner-order checks, and image bounds
  checks.
- `CSV import`: supports marker-corner CSV with required `marker_id,corner_index,x_px,y_px` columns and optional
  `frame_id`, `confidence`, `detector_name`, `detector_version`, `board_id`, `board_hash`, `image_hash`,
  `image_width`, and `image_height` receipt columns.
- `Detector receipts`: preserves detector name/version/parameters, input hashes, warning codes, source hash,
  detection hash, and deterministic result hash.
- `Handoffs`: imported detector points feed L7.5 matching/manual correction, L7.2 similarity/affine/radial geometry
  fits, and L7.4 `fiducial_board` session QA frames.
- `Comparison and exports`: compares synthetic-vs-imported, imported-vs-imported, or manual-corrected-vs-raw detector
  sets with matched IDs, missing/extra IDs, mean/max corner deltas, coverage delta, and fit RMS delta. Exports include
  `detector_bridge_report.md`, `detector_bridge_report.json`, `imported_detections.csv`, and
  `detector_comparison.csv`.
- `Tools scaffold`: `tools/detectors/` contains validating example JSON/CSV and an optional Python/OpenCV runner
  template. Python/OpenCV is not required for npm tests.
- `Capability boundaries`: browser-native OpenCV ArUco detector execution, AprilTag decoding, certified camera
  calibration, lab-accredited metrology, full 3D pose/stereo calibration, hardware control, digital twins,
  manufacturing certification, and full 3D Maxwell/FDTD/FEM/BEM/RCWA/CAD execution are not implemented.

## L7.7 External Detector Runner Pack / Real Detector Bridge

L7.7 turns the L7.6 import bridge into a practical external-detector workflow. The web app still does not run
OpenCV in-browser; instead, optional scripts under `tools/detectors/` can generate OpenCV-compatible ChArUco board
assets, detect markers/corners from local images, and emit canonical `emmicro.detector.v1` JSON/CSV for import.

- `Optional OpenCV tooling`: `opencv_charuco_generate.py` writes a board PNG and
  `emmicro.board.opencv_charuco.v1` manifest; `opencv_charuco_detect.py` reads an image and manifest, runs
  OpenCV ChArUco detection when `opencv-contrib-python` is installed, and emits detector JSON, marker CSV, and an
  optional overlay image.
- `Receipts`: detector outputs preserve OpenCV version, dictionary, corner-refinement setting, runner hash, board
  hash, image hash, detector parameters, warning messages, and import/result hashes.
- `Fixtures`: `tools/detectors/examples/charuco_detection.json`, `charuco_marker_corners.csv`,
  `charuco_board_manifest.json`, and `charuco_board.png` validate through the app without requiring Python/OpenCV.
- `Web import polish`: the External Detector Bridge now labels OpenCV ChArUco detector output explicitly and shows
  detector version, dictionary, parameter summary, marker/corner counts, and board/image hash status.
- `Exports`: detector bridge JSON/Markdown reports and `imported_detections.csv` preserve detector name/version,
  dictionary, board hash, image hash, and receipt status fields.
- `Capability boundaries`: OpenCV ChArUco helper execution is optional external CLI tooling only. Browser-native
  OpenCV.js/ArUco detector execution, AprilTag decoding, certified camera calibration, lab-accredited metrology,
  full 3D pose/stereo calibration, hardware control, digital twins, manufacturing certification, and full 3D
  Maxwell/FDTD/FEM/BEM/RCWA/CAD execution are not implemented.

## L7.8 Detector Round-Trip Acceptance Pack / Real Detector Bridge

L7.8 adds an operational acceptance layer over the L7.7 detector bridge. It does not replace the external detector
import contract; it packages the end-to-end evidence path so a detector board/export, external-helper run, imported
JSON/CSV output, receipt/hash validation, ID matching, diagnostic geometry fit, L7.4 session QA handoff, and final
evidence export can be reviewed as one deterministic round trip.

- `Web wizard`: the External Detector Round Trip panel shows the eight-step chain from `board_manifest.json` through
  detector import, receipt validation, matched points, geometry fit, session QA, and export readiness.
- `Acceptance reports`: exports include `roundtrip_report.md`, `roundtrip_report.json`, `roundtrip_metrics.csv`, and
  `roundtrip_warnings.json`.
- `Fixture package`: `tools/detectors/examples/l78_roundtrip/` includes clean, partial-view, and blur/noise detector
  fixture outputs plus expected fit/session summaries.
- `Optional helper`: `python tools/detectors/run_roundtrip_example.py --fixture clean --out-dir artifacts/l78_roundtrip_clean`
  copies a deterministic fixture bundle and prints a machine-readable status summary without requiring OpenCV.
- `Capability boundaries`: L7.8 validates operational detector evidence only. Browser-native OpenCV.js/ArUco detector
  execution, AprilTag decoding, certified camera calibration, lab-accredited metrology, full 3D pose/stereo
  calibration, hardware control, digital twins, manufacturing certification, and full 3D Maxwell/FDTD/FEM/BEM/RCWA/CAD
  execution are not implemented.

## L7.8.1 CI and Bundle Hygiene

L7.8.1 is maintenance-only. It keeps the L7.8 product behavior unchanged while cleaning up operational warnings:

- `GitHub Actions`: the Pages workflow uses Node 24 explicitly with Node 24-compatible official actions where current
  releases exist.
- `Bundle splitting`: Vite uses Rollup `manualChunks` to split React, icons, the Maxwell panel, explainability content,
  and acyclic core chunks. Maxwell/FDTD stay in one chunk while shared scene/hash code stays in a base chunk, so the
  production bundle avoids circular core imports without raising `chunkSizeWarningLimit`.
- `Boundary`: no detector, physics, calibration, hardware, or UI feature behavior changes are part of this pass.

Recommended next Maxwell steps:

- Consider L7.9 detector-review hardening next: add residual-vector overlays for imported detector corners, richer
  manual-review diffs, saved detector comparison studies, AprilTag as an external-helper path only if a real decoder is
  added, and stronger public Pages smoke coverage for imports, manual edits, saved studies, and exports.

## Local Development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5175`.

## Verification

```bash
npm run test
npm run build
npm audit
```

## GitHub Pages

This repo deploys `apps/web/dist` through `.github/workflows/deploy-pages.yml`.

The workflow sets `GITHUB_PAGES=true`, which makes Vite build with the `/EM-Microscope/` base path required by
GitHub Pages project sites.
