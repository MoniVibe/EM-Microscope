# EMMicro

A 2D microscope-grade optical bench MVP.

The first public version started as L0 geometric optics: deterministic rays, thin lenses, aperture clipping,
detector histograms, and analytic microscope readouts. The current build adds L1 2D surface optics, an on-demand
L2 scalar wave profile, and L2.5 analytic sample/object planes for validated 1D coherent experiments.

Diffraction is still not faked. L0/L1 keep Airy/PSF values labeled as analytic estimates, while L2 is explicitly
labeled as scalar 1D angular-spectrum propagation, not a full circular-aperture Airy disk or microscope image.

## Current Modes

- `L0 Geometric Ray Optics`: thin-lens paraxial approximation, aperture clipping, detector histograms.
- `L1 2D Surface Ray Optics`: biconvex thick lens surfaces, vector Snell refraction, lensmaker EFL/BFL readouts,
  geometric detector spot size, and spherical-aberration diagnostics.
- `L2 Scalar 1D Wave Profile`: coherent monochromatic angular-spectrum propagation through a rectangular slit,
  detector intensity profile, sampling warnings, energy accounting, and CSV/JSON field export.
- `L2.5 Sample/Image Plane v0`: analytic 1D sample planes for single slit, double slit, amplitude grating,
  phase step, and bar-target presets. These are labeled as coherent 1D transverse slices, not full microscope
  images, full PSFs, or Airy disk simulations.

## L2 Validation Fixture

The bundled L2 scene uses a 100 um rectangular slit, 500 nm wavelength, and 1 m propagation distance. The first
1D Fraunhofer minima are expected near +/-5 mm, and the core tests check that the simulated intensity profile
places the first minima there while conserving free-space field energy.

The L2.5 preset scenes add numeric checks for double-slit fringe spacing, grating order positions, passive
amplitude energy drop, phase-only energy preservation, bad sampling warnings, deterministic hashes, and export
metadata.

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
