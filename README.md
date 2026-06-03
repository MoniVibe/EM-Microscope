# EMMicro

A 2D microscope-grade optical bench MVP.

The first public version started as L0 geometric optics: deterministic rays, thin lenses, aperture clipping,
detector histograms, and analytic microscope readouts. The current build adds L1 2D surface optics, an on-demand
L2 scalar wave profile, L2.5 analytic sample/object planes for validated 1D coherent experiments, an early
L3 coherent 2D scalar image-plane workbench, and L3.2 instrument-performance post-processing.

Diffraction is still not faked. L0/L1 keep Airy/PSF values labeled as analytic estimates, while L2 is explicitly
labeled as scalar 1D angular-spectrum propagation, not a full circular-aperture Airy disk or microscope image.
L3 is labeled as a coherent 2D scalar image-plane intensity approximation, not partial coherence, vector optics,
fluorescence, 3D physics, EM, or a full microscope objective model.
L3.2 is labeled as a virtual camera, MTF, SNR, sampling, sweep, and report layer over L3 outputs, not additional
diffraction physics or calibrated hardware prediction.

## Current Modes

- `L0 Geometric Ray Optics`: thin-lens paraxial approximation, aperture clipping, detector histograms.
- `L1 2D Surface Ray Optics`: biconvex thick lens surfaces, vector Snell refraction, lensmaker EFL/BFL readouts,
  geometric detector spot size, and spherical-aberration diagnostics.
- `L2 Scalar 1D Wave Profile`: coherent monochromatic angular-spectrum propagation through a rectangular slit,
  detector intensity profile, sampling warnings, energy accounting, and CSV/JSON field export.
- `L2.5 Sample/Image Plane v0`: analytic 1D sample planes for single slit, double slit, amplitude grating,
  phase step, and bar-target presets. These are labeled as coherent 1D transverse slices, not full microscope
  images, full PSFs, or Airy disk simulations.
- `L3 Coherent 2D Scalar Image Approximation`: worker-backed plane-wave source, 2D angular-spectrum propagation,
  thin-lens scalar phase, circular pupil, detector/image-plane intensity map, energy stages, sampling warnings,
  image analysis metrics, display controls, cache/performance telemetry, cancellation, and CSV/JSON/PNG export.
- `L3.2 Instrument Performance Workbench v0`: virtual camera pixel sampling, deterministic shot/read/dark noise,
  SNR and saturation estimates, PSF/OTF/MTF metrics, Nyquist/target-contrast warnings, deterministic sweeps, and
  JSON/Markdown/HTML engineering report export.

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
