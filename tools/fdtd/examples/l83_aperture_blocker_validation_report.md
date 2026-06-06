# L8.3 Finite aperture/blocker Validation Report

Scene hash: ee5ff5479f1cf48c
Manifest hash: dcd47a93a79ca5b3
Script hash: dcd29415727afd05
Geometry hash: 7c7915c1b7f38713
Status: DIAGNOSTIC

## Grid / Boundary

Grid density: 12.0000 points per wavelength
Grid spacing: 41.6667 nm
Estimated cells: 4.9766e+10
PML thickness: 0.750000 um

## Reference

Model: aperture-open-fraction
Invariant: Blocked/transmitted power follows aperture open fraction only as a diagnostic; edge diffraction requires convergence evidence.

| Metric | Reference | Imported | Residual |
| --- | ---: | ---: | ---: |
| R | 0 | 0.00360000 | 0.00360000 |
| T | 0.240000 | 0.222000 | 0.0180000 |
| A | 0.760000 | 0.774400 | 0.0144000 |
| R+T+A | 1 | 1.00000 | 0 |

## Monitor Positions

| Monitor | z um | Normal |
| --- | ---: | --- |
| incident-flux | 2.1500e+4 | +z |
| reflected-flux | 2.1200e+4 | -z |
| transmitted-flux | 2.2800e+4 | +z |
| field-slice-xz | 1.2500e+4 | +y |
| l83-aperture-blocker-front-flux | 9.4988e+3 | +z |
| l83-aperture-blocker-back-flux | 9.5012e+3 | +z |

## Warnings
- fdtd.geometry.monitorProximity: Finite aperture/blocker has flux monitors within two wavelengths of the scatterer in the generated helper scene; move monitors farther away for production convergence runs.
- fdtd.geometry.edgeFieldConvergenceRequired: Finite aperture/blocker has aperture edges; treat downstream fields as diagnostic until resolution/PML convergence is shown.
- fdtd.aperture.scalarLimit: Finite aperture/blocker finite FDTD screen is compared only to scalar limiting-case diffraction references; finite thickness and finite screen size can shift residuals.
- fdtd.export.largeGrid: Estimated FDTD grid is large; external execution may require coarser resolution or HPC resources.
- fdtd.surfaceGeometry.noClosedFormAperture: Finite aperture/blocker edge fields are diagnostic and need convergence evidence.

## Boundary
- Limited finite surface-geometry diagnostics only: placed transparent block, absorbing block, ideal reflective plate, aperture/blocker, and tilted wedge/interface.
- External FDTD export/import only; the browser app does not execute FDTD or arbitrary 3D Maxwell.
- Field maps, flux summaries, and validation reports are imported evidence or deterministic fixtures, not in-browser Maxwell solves.
- Ideal reflector and aperture/blocker modes are diagnostic and require convergence evidence before physical interpretation.
- No arbitrary CAD import, freeform curved material lens solve, conformal multilayer curved coating solve, production metal optics model, FEM/BEM/RCWA execution, sensor-stack EM, digital twin, or manufacturing certification is claimed.
