# L8.4 Long-slit aperture Aperture Validation Report

Scene hash: 56061e498e031bd7
Manifest hash: c1075ced58ef74a9
Script hash: 622e04573dc8aaeb
Geometry hash: 1980ab03b3ad7ac1
Status: PASS

## Aperture Diagnostics

Reference: single-slit-sinc2
Invariant: Long-slit scalar limiting case: minima satisfy a sin(theta) = m lambda.
Aperture cells across: 32.0000
Screen thickness cells: 12.8000
PML distance: 47.7000 wavelengths
Monitor distance: 1.60000 wavelengths
Observation includes first minimum/ring: yes

## Flux / Blocked Power

| Metric | Imported | Residual |
| --- | ---: | ---: |
| Reflectance | 0.0201429 | 0.00300000 |
| Transmittance | 0.138357 | 0.00450000 |
| Absorbance | 0.841500 | 0.00150000 |
| Blocked power | 0.861643 | 0 |
| Profile RMS | 0.0120707 | 0.0120707 |

## Convergence

| Run | ppw | aperture cells | residual | status |
| --- | ---: | ---: | ---: | --- |
| l84-long-slit-r6 | 6.00000 | 24.0000 | 0.0900000 | fail |
| l84-long-slit-r8 | 8.00000 | 32.0000 | 0.0378403 | warning |
| l84-long-slit-r12 | 12.0000 | 48.0000 | 0.0227951 | pass |
| l84-long-slit-r16 | 16.0000 | 64.0000 | 0.0159099 | pass |
| l84-long-slit-r24 | 24.0000 | 96.0000 | 0.0120373 | pass |

## Warnings
- fdtd.geometry.monitorProximity: Long-slit aperture has flux monitors within two wavelengths of the scatterer in the generated helper scene; move monitors farther away for production convergence runs.
- fdtd.geometry.edgeFieldConvergenceRequired: Long-slit aperture has aperture edges; treat downstream fields as diagnostic until resolution/PML convergence is shown.
- fdtd.aperture.scalarLimit: Long-slit aperture finite FDTD screen is compared only to scalar limiting-case diffraction references; finite thickness and finite screen size can shift residuals.
- fdtd.aperture.scalarLimit: Scalar diffraction reference is a limiting-case check for diagnostic comparison, not an exact finite FDTD screen solution.
- fdtd.aperture.nearFieldFarField: Near-field slices are not the same as far-field diffraction patterns; use far-field or downstream observation evidence with convergence.
- fdtd.aperture.convergenceRequired: Current aperture/blocker diagnostics require convergence sweep evidence before physical interpretation.
- fdtd.aperture.monitorTooClose: Flux monitor is within two wavelengths of aperture/blocker edges.
- fdtd.aperture.edgeStaircasing: Aperture edges are staircasing-sensitive at this grid density; increase resolution and compare residual trends.

## Boundary
- Limited aperture/blocker edge-diffraction diagnostics only: long slit, circular pinhole, rectangular aperture, and opaque blocker.
- External FDTD export/import evidence only; the browser app does not execute FDTD or arbitrary 3D Maxwell.
- Scalar sinc/Airy references are limiting-case checks, not exact finite-screen FDTD truth.
- Finite screen size, screen thickness, staircasing, PML placement, monitor placement, and near-field/far-field interpretation require convergence review.
- Ideal reflective screens are diagnostics only, not production metal aperture models.
- No arbitrary CAD aperture, conformal aperture-edge coating, curved/freeform aperture surface, FEM/BEM/RCWA execution, sensor-stack EM, digital twin, or manufacturing certification is claimed.
