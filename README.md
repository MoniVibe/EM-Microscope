# EMMicro

An EM-first light simulator MVP. The visible web app is now the L5.5 Maxwell Design Foundry planar multilayer
transfer-matrix workbench; the earlier geometric/scalar microscope bench code remains in source and tests as
historical validation scaffolding, but it is hidden from the app shell.

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
the coating editor. It is not a general 3D Maxwell solver,
FEM/BEM/RCWA/FDTD engine, arbitrary CAD geometry solver, curved lens solver, aperture solver, sensor-stack
simulator, adjoint optimizer, topology optimizer, digital twin, or manufacturing certification system.

## Current Visible Mode

- `L5.5 Maxwell Design Foundry`: frequency-domain Maxwell planar multilayer transfer-matrix special case with
  diagnostic spectral material records, editable film stacks, wavelength sweeps, planar E/H field-monitor samples,
  per-layer flux-drop absorption estimates, film-stack R/T/A, a visible-AR coating objective optimizer, certified
  best-candidate re-solve hashes, planar thickness tolerance/yield analysis, material import/audit evidence,
  imported-material selection, selected-material provenance receipts, deterministic coating material/order/thickness
  search, candidate application, JSON/Markdown/CSV export, and strict limitations against arbitrary 3D EM claims.

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

The web panel now includes a Coating Search card. Users can choose candidate materials from the active catalog,
including imported pack records, set target wavelengths and layer/thickness bounds, run the search, inspect ranked
candidate metrics and material hashes, export `Search JSON`, and apply a chosen candidate back into the coating
stack editor.

Recommended next L5 steps:

- Add drift/correlation controls and robust optimization loops that optimize yield directly, not just nominal score.
- Compile optical coating stacks from future scene elements into planar TMM inputs for normal/oblique validation cases.
- Prototype a separate 3D engine boundary that can call an external FEM/BEM/RCWA/FDTD backend without mixing it
  into the current 2D scalar/ray bench API.

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
