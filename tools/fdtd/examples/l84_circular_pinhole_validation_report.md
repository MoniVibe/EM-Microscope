# L8.4 Circular pinhole aperture Aperture Validation Report

Scene hash: 4b5d69a020723f13
Manifest hash: 4988876e01a19248
Script hash: 91e497b3ad5863f1
Geometry hash: 26b86a0994b5eee7
Status: PASS

## Aperture Diagnostics

Reference: airy-bessel
Invariant: Circular aperture scalar limiting case: first dark ring is near 1.22 lambda z / D.
Aperture cells across: 64.0000
Screen thickness cells: 12.8000
PML distance: 47.7000 wavelengths
Monitor distance: 1.60000 wavelengths
Observation includes first minimum/ring: yes

## Flux / Blocked Power

| Metric | Imported | Residual |
| --- | ---: | ---: |
| Reflectance | 0.0224547 | 0.00420000 |
| Transmittance | 0.0809665 | 0.00630000 |
| Absorbance | 0.896579 | 0.00210000 |
| Blocked power | 0.919034 | 0 |
| Profile RMS | 0.0157083 | 0.0157083 |

## Convergence

| Run | ppw | aperture cells | residual | status |
| --- | ---: | ---: | ---: | --- |
| l84-circular-pinhole-r6 | 6.00000 | 48.0000 | 0.130000 | fail |
| l84-circular-pinhole-r8 | 8.00000 | 64.0000 | 0.0546583 | warning |
| l84-circular-pinhole-r12 | 12.0000 | 96.0000 | 0.0329262 | warning |
| l84-circular-pinhole-r16 | 16.0000 | 128.000 | 0.0229810 | pass |
| l84-circular-pinhole-r24 | 24.0000 | 192.000 | 0.0173872 | pass |

## Warnings
- fdtd.geometry.monitorProximity: Circular pinhole aperture has flux monitors within two wavelengths of the scatterer in the generated helper scene; move monitors farther away for production convergence runs.
- fdtd.geometry.edgeFieldConvergenceRequired: Circular pinhole aperture has aperture edges; treat downstream fields as diagnostic until resolution/PML convergence is shown.
- fdtd.aperture.scalarLimit: Circular pinhole aperture finite FDTD screen is compared only to scalar limiting-case diffraction references; finite thickness and finite screen size can shift residuals.
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
