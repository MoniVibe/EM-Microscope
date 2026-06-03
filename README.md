# EMMicro

An EM-first light simulator MVP. The visible web app is now the L4 Maxwell Phase 0 planar multilayer
transfer-matrix workbench; the earlier geometric/scalar microscope bench code remains in source and tests as
historical validation scaffolding, but it is hidden from the app shell.

L4 Phase 0 uses a DOM-free frequency-domain planar multilayer transfer-matrix special case for film stacks. It
computes complex-amplitude reflection/transmission, R/T/A Poynting-style flux ratios, effective permittivity,
energy-balance checks, warnings, and deterministic hashes. It is not a general 3D Maxwell solver,
FEM/BEM/RCWA/FDTD engine, arbitrary CAD geometry solver, curved lens solver, aperture solver, or sensor-stack
simulator.

## Current Visible Mode

- `L4 Maxwell Phase 0 Planar TMM`: frequency-domain Maxwell planar multilayer transfer-matrix special case with
  constant complex material samples, film-stack R/T/A, Poynting-style energy accounting, JSON/Markdown export, and
  strict limitations against arbitrary 3D EM claims.

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

## L4 Maxwell Phase 0

The L4 core modules live under `packages/core/src/maxwell`. They include a small complex-number utility, constant
complex refractive-index material samples, relative-permittivity conversion, absorption-coefficient diagnostics,
and a planar multilayer transfer-matrix solver for TE/TM plane waves. The bundled validation fixtures cover a bare
air/glass interface, a MgF2 quarter-wave AR coating, a lossy chromium-like film on glass, and an oblique TM AR
stack.

This is Maxwell-first but intentionally narrow: the TMM path solves the planar film-stack special case directly
from frequency-domain boundary conditions and E/H admittance, not geometric raytracing. It does not solve curved
lenses, apertures, arbitrary 3D geometry, vector focusing through high-NA objectives, RCWA gratings, FEM/BEM
meshes, FDTD time marching, or pixel-level sensor absorption yet.

Recommended next L4 steps:

- Add a wavelength-dependent material importer with source metadata, interpolation policy, and passivity checks.
- Compile optical coating stacks from scene elements into planar TMM inputs for normal/oblique validation cases.
- Export field-monitor metadata around film interfaces, not just aggregate R/T/A.
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
