# L8.3 Finite ideal reflective plate Validation Report

Scene hash: 48560bcbab88e2f5
Manifest hash: 9f35e9fe1bebdf17
Script hash: 5748c2113f496920
Geometry hash: 530899a7165693a5
Status: PASS

## Grid / Boundary

Grid density: 12.0000 points per wavelength
Grid spacing: 41.6667 nm
Estimated cells: 4.9766e+10
PML thickness: 0.750000 um

## Reference

Model: ideal-reflector
Invariant: Ideal reflective diagnostic keeps R near 1 and T near 0; it is not a real metal model.

| Metric | Reference | Imported | Residual |
| --- | ---: | ---: | ---: |
| R | 1.00000 | 0.996000 | 0.00400000 |
| T | 0 | 0.00200000 | 0.00200000 |
| A | 0 | 0.00200000 | 0.00200000 |
| R+T+A | 1 | 1.00000 | 0 |

## Monitor Positions

| Monitor | z um | Normal |
| --- | ---: | --- |
| incident-flux | 2.1500e+4 | +z |
| reflected-flux | 2.1200e+4 | -z |
| transmitted-flux | 2.2800e+4 | +z |
| field-slice-xz | 1.2500e+4 | +y |
| l83-reflective-plate-front-flux | 1.0999e+4 | +z |
| l83-reflective-plate-back-flux | 1.1001e+4 | +z |

## Warnings
- fdtd.geometry.monitorProximity: Finite ideal reflective plate has flux monitors within two wavelengths of the scatterer in the generated helper scene; move monitors farther away for production convergence runs.
- fdtd.geometry.idealReflector: Finite ideal reflective plate is an ideal reflector diagnostic, not a real finite-thickness metal optics model.
- fdtd.export.largeGrid: Estimated FDTD grid is large; external execution may require coarser resolution or HPC resources.

## Boundary
- Limited finite surface-geometry diagnostics only: placed transparent block, absorbing block, ideal reflective plate, aperture/blocker, and tilted wedge/interface.
- External FDTD export/import only; the browser app does not execute FDTD or arbitrary 3D Maxwell.
- Field maps, flux summaries, and validation reports are imported evidence or deterministic fixtures, not in-browser Maxwell solves.
- Ideal reflector and aperture/blocker modes are diagnostic and require convergence evidence before physical interpretation.
- No arbitrary CAD import, freeform curved material lens solve, conformal multilayer curved coating solve, production metal optics model, FEM/BEM/RCWA execution, sensor-stack EM, digital twin, or manufacturing certification is claimed.
