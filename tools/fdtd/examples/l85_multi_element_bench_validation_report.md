# L8.5 Multi-Element Optical Bench Propagation Chain

Scene hash: 588269a545ca93a2
Report hash: d58c421fe1e36261
Status: EXTERNAL-RESULTS-IMPORTED

## Ordered Scene

| Item | z mm | Solver route | Status | Validation reference |
| --- | ---: | --- | --- | --- |
| 500 nm coherent plane-wave source | 0 | scalar-chain | executable | coherent source placement |
| Circular aperture 1 | 10.0000 | scalar-chain | executable | scalar aperture mask; circular aperture Airy/Bessel validation family |
| Ideal thin lens 1 | 20.0000 | scalar-chain | executable | ideal zero-thickness thin-lens phase mask; scalar focal-plane validation family |
| Transparent block 1 | 30.0000 | external-fdtd | external-only | external FDTD export/import with broad-block Fresnel/TMM reference |
| Absorbing blocker 1 | 40.0000 | external-fdtd | external-only | external FDTD export/import with Beer-Lambert attenuation and energy-balance reference |
| Transparent target plane | 50.0000 | scalar-chain | computed | target/observation plane |

## Solver Plan

| Segment | Solver path | Status | Executable |
| --- | --- | --- | --- |
| 500 nm coherent plane-wave source -> Circular aperture 1 | scalar-chain | executable | yes |
| Circular aperture 1 -> Ideal thin lens 1 | scalar-chain | executable | yes |
| Ideal thin lens 1 -> Transparent block 1 | external-fdtd | external-only | no |
| Transparent block 1 -> Absorbing blocker 1 | external-fdtd | external-only | no |
| Absorbing blocker 1 -> Transparent target plane | scalar-chain | computed | yes |

## Monitor Stack

| Monitor | z mm | Status | Peak | Relative power |
| --- | ---: | --- | ---: | ---: |
| After source | 0 | computed | 1.00000 | 1.00000 |
| After Circular aperture 1 | 10.2500 | computed | 1.00000 | 0.114583 |
| After Ideal thin lens 1 | 20.2500 | computed | 1.14341 | 0.114583 |
| Before Transparent block 1 | 29.7500 | external-only | 1.10274 | 0.114583 |
| After Transparent block 1 | 30.2500 | external-only | 0.992467 | 0.103125 |
| Before Absorbing blocker 1 | 39.7500 | external-only | 1.01877 | 0.114583 |
| After Absorbing blocker 1 | 40.2500 | external-only | 0.733518 | 0.0825000 |
| At target | 50.0000 | computed | 0.955509 | 0.114583 |
| Observation plane | 60.0000 | computed | 0.899786 | 0.114575 |

## External Evidence

Imported fixture: l85-multi-element-fixture-588269a5; R/T/A 0.0800000 / 0.740000 / 0.180000; energy 1.00000.

## Warnings

- opticalBench.scalar.externalBoundary: Transparent block 1 is finite geometry; scalar preview stops at a placement/attenuation diagnostic and requires imported external FDTD evidence.
- opticalBench.scalar.externalBoundary: Absorbing blocker 1 is finite geometry; scalar preview stops at a placement/attenuation diagnostic and requires imported external FDTD evidence.
- opticalBench.external.fixture: Bundled L8.5 multi-element evidence is deterministic fixture data for UI/report validation, not a browser-run FDTD solve.

## Boundary

- L8.5 is an ordered multi-element optical-bench workflow, not a general-purpose Maxwell solver.
- Scalar chain preview is limited to ideal plane elements: free-space propagation, apertures/slits, ideal thin lenses, and observation planes.
- Finite transparent blocks, absorbing blocks, reflective plates, aperture/blocker screens, and tilted wedges route to external FDTD export/import evidence.
- Imported external FDTD field/flux maps require receipts and scene/script hashes before they are reported as evidence.
- No in-browser FDTD execution, arbitrary CAD/freeform geometry solve, general arbitrary 3D Maxwell, FEM/BEM/RCWA, production metal optics model, curved material lens solve, conformal multilayer curved coating solver, sensor-stack EM, digital twin calibration, hardware control, or manufacturing certification is implemented.
