# EMMicro

A 2D microscope-grade optical bench MVP.

The first public version started as L0 geometric optics: deterministic rays, thin lenses, aperture clipping,
detector histograms, and analytic microscope readouts. The current build adds an L1 2D surface-optics mode with
vector Snell refraction through editable thick-lens surfaces.

Diffraction is still not faked; the UI labels Airy/PSF values as analytic estimates until a real scalar wave solver
is added.

## Current Modes

- `L0 Geometric Ray Optics`: thin-lens paraxial approximation, aperture clipping, detector histograms.
- `L1 2D Surface Ray Optics`: biconvex thick lens surfaces, vector Snell refraction, lensmaker EFL/BFL readouts,
  geometric detector spot size, and spherical-aberration diagnostics.

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
