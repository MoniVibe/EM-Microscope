# L8.4 Rectangular aperture Aperture Validation Report

Scene hash: 25c012532a0f947a
Manifest hash: c0382146f92ba396
Script hash: 05c7fa222ae012de
Geometry hash: 3e65e055186c0225
Status: PASS

## Aperture Diagnostics

Reference: rectangular-sinc2
Invariant: Rectangular aperture diagnostic uses separable sinc-style scalar envelopes in the far-field limit.
Aperture cells across: 64.0000
Screen thickness cells: 12.8000
PML distance: 47.7000 wavelengths
Monitor distance: 1.60000 wavelengths
Observation includes first minimum/ring: yes

## Flux / Blocked Power

| Metric | Imported | Residual |
| --- | ---: | ---: |
| Reflectance | 0.0196667 | 0.00300000 |
| Transmittance | 0.162167 | 0.00450000 |
| Absorbance | 0.818167 | 0.00150000 |
| Blocked power | 0.837833 | 0 |
| Profile RMS | 0.0106837 | 0.0106837 |

## Convergence

| Run | ppw | aperture cells | residual | status |
| --- | ---: | ---: | ---: | --- |
| l84-rectangular-aperture-r6 | 6.00000 | 48.0000 | 0.110000 | fail |
| l84-rectangular-aperture-r8 | 8.00000 | 64.0000 | 0.0462493 | warning |
| l84-rectangular-aperture-r12 | 12.0000 | 96.0000 | 0.0278606 | pass |
| l84-rectangular-aperture-r16 | 16.0000 | 128.000 | 0.0194454 | pass |
| l84-rectangular-aperture-r24 | 24.0000 | 192.000 | 0.0147123 | pass |

## Warnings
- fdtd.geometry.monitorProximity: Rectangular aperture has flux monitors within two wavelengths of the scatterer in the generated helper scene; move monitors farther away for production convergence runs.
- fdtd.geometry.edgeFieldConvergenceRequired: Rectangular aperture has aperture edges; treat downstream fields as diagnostic until resolution/PML convergence is shown.
- fdtd.aperture.scalarLimit: Rectangular aperture finite FDTD screen is compared only to scalar limiting-case diffraction references; finite thickness and finite screen size can shift residuals.
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
