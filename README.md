# EMMicro

An EM-first light simulator MVP. The visible web app is now the L6.5 Maxwell Design Foundry planar multilayer
transfer-matrix workbench with guided optical-bench terminology, a scalar double-slit coherence demonstrator,
ideal thin-lens focal-plane validation, an accessible explainability layer, circular-aperture, long-slit, and double-slit scalar diffraction validation, Advisor Review Mode exports, and a
scaffold-only 3D Maxwell/FDTD export runway; the earlier geometric/scalar microscope bench code remains in source and tests as
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
It is not a general 3D Maxwell solver,
FEM/BEM/RCWA/FDTD engine, arbitrary CAD geometry solver, curved lens solver, stochastic source engine, aperture solver, sensor-stack
simulator, adjoint optimizer, topology optimizer, digital twin, or manufacturing certification system.

## Current Visible Mode

- `L6.5 Maxwell Design Foundry`: frequency-domain Maxwell planar multilayer transfer-matrix special case through
  the executable registered `PlanarTmmBackend`, with
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
  order-spacing tables, Advisor Review Mode Markdown/JSON/CSV exports, accessible custom tooltips, under-the-hood
  formula/snippet panels, Explain mode highlighting, and a searchable explanation drawer,
  and strict limitations against arbitrary 3D EM or stochastic source-engine claims.

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

Recommended next Maxwell steps:

- Track GitHub Actions Node 20 deprecation separately from physics work so deploy maintenance does not blur the
  validation roadmap.
- Delay real 3D work until an external solver proof-of-life can ingest the L6.0 scene/export scaffold and return
  auditable field data with clear capability receipts.

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
