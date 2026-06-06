# L8.3 Tilted transparent interface/wedge Validation Report

Scene hash: 8cdbd083e4c11c7f
Manifest hash: 6911bbf405b20e2b
Script hash: 0e4219c422d5f915
Geometry hash: 29302a7e197191a2
Status: WARNING

## Grid / Boundary

Grid density: 12.0000 points per wavelength
Grid spacing: 41.6667 nm
Estimated cells: 4.9766e+10
PML thickness: 0.750000 um

## Reference

Model: snell-fresnel
Invariant: Tilted dielectric surface reports Snell direction and Fresnel trend while warning about staircasing/convergence.

| Metric | Reference | Imported | Residual |
| --- | ---: | ---: | ---: |
| R | 0.0400000 | 0.0424000 | 0.00240000 |
| T | 0.960000 | 0.948000 | 0.0120000 |
| A | 0 | 0.00960000 | 0.00960000 |
| R+T+A | 1 | 1.00000 | 0 |

## Monitor Positions

| Monitor | z um | Normal |
| --- | ---: | --- |
| incident-flux | 2.1500e+4 | +z |
| reflected-flux | 2.1200e+4 | -z |
| transmitted-flux | 2.2800e+4 | +z |
| field-slice-xz | 1.2500e+4 | +y |
| l83-tilted-wedge-front-flux | 9.9955e+3 | +z |
| l83-tilted-wedge-back-flux | 1.0005e+4 | +z |

## Warnings
- fdtd.geometry.staircasingSensitive: Tilted transparent interface/wedge has tilted finite surfaces; staircasing/subpixel-smoothing sensitivity must be checked by convergence sweep.
- fdtd.export.largeGrid: Estimated FDTD grid is large; external execution may require coarser resolution or HPC resources.
- fdtd.surfaceGeometry.tiltedConvergenceRequired: Tilted/wedge surfaces need resolution and PML convergence evidence before interpreting direction residuals.

## Boundary
- Limited finite surface-geometry diagnostics only: placed transparent block, absorbing block, ideal reflective plate, aperture/blocker, and tilted wedge/interface.
- External FDTD export/import only; the browser app does not execute FDTD or arbitrary 3D Maxwell.
- Field maps, flux summaries, and validation reports are imported evidence or deterministic fixtures, not in-browser Maxwell solves.
- Ideal reflector and aperture/blocker modes are diagnostic and require convergence evidence before physical interpretation.
- No arbitrary CAD import, freeform curved material lens solve, conformal multilayer curved coating solve, production metal optics model, FEM/BEM/RCWA execution, sensor-stack EM, digital twin, or manufacturing certification is claimed.
