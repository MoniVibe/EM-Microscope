# EMMicro

A 2D microscope-grade optical bench MVP.

The first version is intentionally L0 geometric optics: deterministic rays, thin lenses, aperture clipping,
detector histograms, and analytic microscope readouts. Diffraction is not faked; the UI labels Airy/PSF values as
analytic estimates until a real scalar wave solver is added.

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
