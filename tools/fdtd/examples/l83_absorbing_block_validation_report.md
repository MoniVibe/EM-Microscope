# L8.3 Finite absorbing block Validation Report

Scene hash: 57d180841f117d44
Manifest hash: 5d06db76b4244ab1
Script hash: 7e762146add0bf54
Geometry hash: d6caacb5c6fba65c
Status: PASS

## Grid / Boundary

Grid density: 12.0000 points per wavelength
Grid spacing: 41.6667 nm
Estimated cells: 4.9766e+10
PML thickness: 0.750000 um

## Reference

Model: beer-lambert
Invariant: Transmission decreases monotonically with lossy-block thickness and R+T+A stays near 1.

| Metric | Reference | Imported | Residual |
| --- | ---: | ---: | ---: |
| R | 0 | 8.0000e-4 | 8.0000e-4 |
| T | 0.606531 | 0.602531 | 0.00400000 |
| A | 0.393469 | 0.396669 | 0.00320000 |
| R+T+A | 1 | 1.00000 | 0 |

## Monitor Positions

| Monitor | z um | Normal |
| --- | ---: | --- |
| incident-flux | 2.1500e+4 | +z |
| reflected-flux | 2.1200e+4 | -z |
| transmitted-flux | 2.2800e+4 | +z |
| field-slice-xz | 1.2500e+4 | +y |
| l83-absorbing-block-front-flux | 1.0350e+4 | +z |
| l83-absorbing-block-back-flux | 1.0650e+4 | +z |

## Warnings
- fdtd.geometry.absorberDispersionUnverified: Finite absorbing block uses a simple lossy diagnostic material; dispersive material fitting and convergence evidence are required before production claims.
- fdtd.export.largeGrid: Estimated FDTD grid is large; external execution may require coarser resolution or HPC resources.

## Boundary
- Limited finite surface-geometry diagnostics only: placed transparent block, absorbing block, ideal reflective plate, aperture/blocker, and tilted wedge/interface.
- External FDTD export/import only; the browser app does not execute FDTD or arbitrary 3D Maxwell.
- Field maps, flux summaries, and validation reports are imported evidence or deterministic fixtures, not in-browser Maxwell solves.
- Ideal reflector and aperture/blocker modes are diagnostic and require convergence evidence before physical interpretation.
- No arbitrary CAD import, freeform curved material lens solve, conformal multilayer curved coating solve, production metal optics model, FEM/BEM/RCWA execution, sensor-stack EM, digital twin, or manufacturing certification is claimed.
