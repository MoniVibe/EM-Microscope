# L8.4 Opaque blocker Aperture Validation Report

Scene hash: 2e3df6389ef3c64b
Manifest hash: bc4e42a117624937
Script hash: b1ea0c44476885fc
Geometry hash: d8f8bee53d12687a
Status: DIAGNOSTIC

## Aperture Diagnostics

Reference: blocker-shadow-flux
Invariant: Opaque blocker validation is flux/shadow diagnostic only; no closed-form finite-screen diffraction claim is made.
Aperture cells across: 192.000
Screen thickness cells: 12.8000
PML distance: 47.7000 wavelengths
Monitor distance: 1.60000 wavelengths
Observation includes first minimum/ring: yes

## Flux / Blocked Power

| Metric | Imported | Residual |
| --- | ---: | ---: |
| Reflectance | 0.0354000 | 0.00540000 |
| Transmittance | 0.0519000 | 0.00810000 |
| Absorbance | 0.912700 | 0.00270000 |
| Blocked power | 0.948100 | 0 |
| Profile RMS | 0.0247682 | 0.0247682 |

## Convergence

| Run | ppw | aperture cells | residual | status |
| --- | ---: | ---: | ---: | --- |
| l84-opaque-blocker-r6 | 6.00000 | 48.0000 | 0.160000 | fail |
| l84-opaque-blocker-r8 | 8.00000 | 64.0000 | 0.0672717 | warning |
| l84-opaque-blocker-r12 | 12.0000 | 96.0000 | 0.0405246 | warning |
| l84-opaque-blocker-r16 | 16.0000 | 128.000 | 0.0282843 | pass |
| l84-opaque-blocker-r24 | 24.0000 | 192.000 | 0.0213997 | pass |

## Warnings
- fdtd.geometry.monitorProximity: Opaque blocker has flux monitors within two wavelengths of the scatterer in the generated helper scene; move monitors farther away for production convergence runs.
- fdtd.geometry.edgeFieldConvergenceRequired: Opaque blocker has aperture edges; treat downstream fields as diagnostic until resolution/PML convergence is shown.
- fdtd.aperture.scalarLimit: Opaque blocker finite FDTD screen is compared only to scalar limiting-case diffraction references; finite thickness and finite screen size can shift residuals.
- fdtd.aperture.scalarLimit: Scalar diffraction reference is a limiting-case check for diagnostic comparison, not an exact finite FDTD screen solution.
- fdtd.aperture.nearFieldFarField: Near-field slices are not the same as far-field diffraction patterns; use far-field or downstream observation evidence with convergence.
- fdtd.aperture.convergenceRequired: Current aperture/blocker diagnostics require convergence sweep evidence before physical interpretation.
- fdtd.aperture.monitorTooClose: Flux monitor is within two wavelengths of aperture/blocker edges.
- fdtd.aperture.blockerNoClosedForm: Opaque blocker validation is flux/shadow diagnostic; no closed-form finite-edge diffraction overclaim is made.
- fdtd.aperture.edgeStaircasing: Aperture edges are staircasing-sensitive at this grid density; increase resolution and compare residual trends.

## Boundary
- Limited aperture/blocker edge-diffraction diagnostics only: long slit, circular pinhole, rectangular aperture, and opaque blocker.
- External FDTD export/import evidence only; the browser app does not execute FDTD or arbitrary 3D Maxwell.
- Scalar sinc/Airy references are limiting-case checks, not exact finite-screen FDTD truth.
- Finite screen size, screen thickness, staircasing, PML placement, monitor placement, and near-field/far-field interpretation require convergence review.
- Ideal reflective screens are diagnostics only, not production metal aperture models.
- No arbitrary CAD aperture, conformal aperture-edge coating, curved/freeform aperture surface, FEM/BEM/RCWA execution, sensor-stack EM, digital twin, or manufacturing certification is claimed.
