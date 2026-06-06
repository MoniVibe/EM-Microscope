# L8.3 Finite transparent block Validation Report

Scene hash: e2f740688f7a3e8a
Manifest hash: 97e54c42ab66b8bd
Script hash: 35795dcb00e6e499
Geometry hash: 4e2d6e660c3bdf6d
Status: PASS

## Grid / Boundary

Grid density: 12.0000 points per wavelength
Grid spacing: 41.6667 nm
Estimated cells: 4.9766e+10
PML thickness: 0.750000 um

## Reference

Model: planar-tmm-broad-block
Invariant: Broad finite dielectric block trends toward planar TMM/Fresnel R/T/A as transverse dimensions exceed the beam and convergence improves.

| Metric | Reference | Imported | Residual |
| --- | ---: | ---: | ---: |
| R | 1.7075e-28 | 8.0000e-4 | 8.0000e-4 |
| T | 1.00000 | 0.996000 | 0.00400000 |
| A | 0 | 0.00320000 | 0.00320000 |
| R+T+A | 1 | 1.00000 | 0 |

## Monitor Positions

| Monitor | z um | Normal |
| --- | ---: | --- |
| incident-flux | 2.1500e+4 | +z |
| reflected-flux | 2.1200e+4 | -z |
| transmitted-flux | 2.2800e+4 | +z |
| field-slice-xz | 1.2500e+4 | +y |
| l83-transparent-block-front-flux | 9.9940e+3 | +z |
| l83-transparent-block-back-flux | 1.0006e+4 | +z |

## Warnings
- fdtd.export.largeGrid: Estimated FDTD grid is large; external execution may require coarser resolution or HPC resources.

## Boundary
- Limited finite surface-geometry diagnostics only: placed transparent block, absorbing block, ideal reflective plate, aperture/blocker, and tilted wedge/interface.
- External FDTD export/import only; the browser app does not execute FDTD or arbitrary 3D Maxwell.
- Field maps, flux summaries, and validation reports are imported evidence or deterministic fixtures, not in-browser Maxwell solves.
- Ideal reflector and aperture/blocker modes are diagnostic and require convergence evidence before physical interpretation.
- No arbitrary CAD import, freeform curved material lens solve, conformal multilayer curved coating solve, production metal optics model, FEM/BEM/RCWA execution, sensor-stack EM, digital twin, or manufacturing certification is claimed.
