# L8.2 Ideal mirror FDTD Benchmark Convergence Report

Status: PASS
Reference model: ideal-mirror
Benchmark hash: a8f7b4481e6bc449
Sweep hash: b86b5843a37b4d04
Summary hash: 459cc6b634ccb9c1

## Reference

Invariant: Ideal mirror reflectance stays near 1 while transmission stays near 0.

| Metric | Expected |
| --- | ---: |
| R | 1.00000 |
| T | 0 |
| A | 0 |

## Convergence Trend

| Resolution ppw | Mean reference residual | Max energy error | Mean field delta | Runs |
| ---: | ---: | ---: | ---: | ---: |
| 10 | 0.00543667 | 0.00822000 | 0.0162167 | 9 |
| 15 | 0.00343667 | 0.00622000 | 0.00843889 | 9 |
| 20 | 0.00273667 | 0.00552000 | 0.00571667 | 9 |
| 30 | 0.00223667 | 0.00502000 | 0.00377222 | 9 |

Trend: decreasing
PML sensitivity max delta: 0.00359000 (pass)

## Run Table

| Run | ppw | PML um | padding lambda | R | T | A | residual | energy error | status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| l82-mirror-r10-pml0p5-pad1-m1p5 | 10 | 0.500000 | 1.00000 | 1.00000 | 0 | 0.00822000 | 0.00822000 | 0.00822000 | pass |
| l82-mirror-r10-pml0p5-pad2-m1p5 | 10 | 0.500000 | 2.00000 | 1.00000 | 0 | 0.00768000 | 0.00768000 | 0.00768000 | pass |
| l82-mirror-r10-pml0p5-pad3-m1p5 | 10 | 0.500000 | 3.00000 | 1.00000 | 0 | 0.00759000 | 0.00759000 | 0.00759000 | pass |
| l82-mirror-r10-pml1-pad1-m1p5 | 10 | 1.00000 | 1.00000 | 1.00000 | 0 | 0.00463000 | 0.00463000 | 0.00463000 | pass |
| l82-mirror-r10-pml1-pad2-m1p5 | 10 | 1.00000 | 2.00000 | 1.00000 | 0 | 0.00409000 | 0.00409000 | 0.00409000 | pass |
| l82-mirror-r10-pml1-pad3-m1p5 | 10 | 1.00000 | 3.00000 | 1.00000 | 0 | 0.00400000 | 0.00400000 | 0.00400000 | pass |
| l82-mirror-r10-pml1p5-pad1-m1p5 | 10 | 1.50000 | 1.00000 | 1.00000 | 0 | 0.00463000 | 0.00463000 | 0.00463000 | pass |
| l82-mirror-r10-pml1p5-pad2-m1p5 | 10 | 1.50000 | 2.00000 | 1.00000 | 0 | 0.00409000 | 0.00409000 | 0.00409000 | pass |
| l82-mirror-r10-pml1p5-pad3-m1p5 | 10 | 1.50000 | 3.00000 | 1.00000 | 0 | 0.00400000 | 0.00400000 | 0.00400000 | pass |
| l82-mirror-r15-pml0p5-pad1-m1p5 | 15 | 0.500000 | 1.00000 | 1.00000 | 0 | 0.00622000 | 0.00622000 | 0.00622000 | pass |
| l82-mirror-r15-pml0p5-pad2-m1p5 | 15 | 0.500000 | 2.00000 | 1.00000 | 0 | 0.00568000 | 0.00568000 | 0.00568000 | pass |
| l82-mirror-r15-pml0p5-pad3-m1p5 | 15 | 0.500000 | 3.00000 | 1.00000 | 0 | 0.00559000 | 0.00559000 | 0.00559000 | pass |
| l82-mirror-r15-pml1-pad1-m1p5 | 15 | 1.00000 | 1.00000 | 1.00000 | 0 | 0.00263000 | 0.00263000 | 0.00263000 | pass |
| l82-mirror-r15-pml1-pad2-m1p5 | 15 | 1.00000 | 2.00000 | 1.00000 | 0 | 0.00209000 | 0.00209000 | 0.00209000 | pass |
| l82-mirror-r15-pml1-pad3-m1p5 | 15 | 1.00000 | 3.00000 | 1.00000 | 0 | 0.00200000 | 0.00200000 | 0.00200000 | pass |
| l82-mirror-r15-pml1p5-pad1-m1p5 | 15 | 1.50000 | 1.00000 | 1.00000 | 0 | 0.00263000 | 0.00263000 | 0.00263000 | pass |
| l82-mirror-r15-pml1p5-pad2-m1p5 | 15 | 1.50000 | 2.00000 | 1.00000 | 0 | 0.00209000 | 0.00209000 | 0.00209000 | pass |
| l82-mirror-r15-pml1p5-pad3-m1p5 | 15 | 1.50000 | 3.00000 | 1.00000 | 0 | 0.00200000 | 0.00200000 | 0.00200000 | pass |
| l82-mirror-r20-pml0p5-pad1-m1p5 | 20 | 0.500000 | 1.00000 | 1.00000 | 0 | 0.00552000 | 0.00552000 | 0.00552000 | pass |
| l82-mirror-r20-pml0p5-pad2-m1p5 | 20 | 0.500000 | 2.00000 | 1.00000 | 0 | 0.00498000 | 0.00498000 | 0.00498000 | pass |
| l82-mirror-r20-pml0p5-pad3-m1p5 | 20 | 0.500000 | 3.00000 | 1.00000 | 0 | 0.00489000 | 0.00489000 | 0.00489000 | pass |
| l82-mirror-r20-pml1-pad1-m1p5 | 20 | 1.00000 | 1.00000 | 1.00000 | 0 | 0.00193000 | 0.00193000 | 0.00193000 | pass |
| l82-mirror-r20-pml1-pad2-m1p5 | 20 | 1.00000 | 2.00000 | 1.00000 | 0 | 0.00139000 | 0.00139000 | 0.00139000 | pass |
| l82-mirror-r20-pml1-pad3-m1p5 | 20 | 1.00000 | 3.00000 | 1.00000 | 0 | 0.00130000 | 0.00130000 | 0.00130000 | pass |
| l82-mirror-r20-pml1p5-pad1-m1p5 | 20 | 1.50000 | 1.00000 | 1.00000 | 0 | 0.00193000 | 0.00193000 | 0.00193000 | pass |
| l82-mirror-r20-pml1p5-pad2-m1p5 | 20 | 1.50000 | 2.00000 | 1.00000 | 0 | 0.00139000 | 0.00139000 | 0.00139000 | pass |
| l82-mirror-r20-pml1p5-pad3-m1p5 | 20 | 1.50000 | 3.00000 | 1.00000 | 0 | 0.00130000 | 0.00130000 | 0.00130000 | pass |
| l82-mirror-r30-pml0p5-pad1-m1p5 | 30 | 0.500000 | 1.00000 | 1.00000 | 0 | 0.00502000 | 0.00502000 | 0.00502000 | pass |
| l82-mirror-r30-pml0p5-pad2-m1p5 | 30 | 0.500000 | 2.00000 | 1.00000 | 0 | 0.00448000 | 0.00448000 | 0.00448000 | pass |
| l82-mirror-r30-pml0p5-pad3-m1p5 | 30 | 0.500000 | 3.00000 | 1.00000 | 0 | 0.00439000 | 0.00439000 | 0.00439000 | pass |
| l82-mirror-r30-pml1-pad1-m1p5 | 30 | 1.00000 | 1.00000 | 1.00000 | 0 | 0.00143000 | 0.00143000 | 0.00143000 | pass |
| l82-mirror-r30-pml1-pad2-m1p5 | 30 | 1.00000 | 2.00000 | 1.00000 | 0 | 8.9000e-4 | 8.9000e-4 | 8.9000e-4 | pass |
| l82-mirror-r30-pml1-pad3-m1p5 | 30 | 1.00000 | 3.00000 | 1.00000 | 0 | 8.0000e-4 | 8.0000e-4 | 8.0000e-4 | pass |
| l82-mirror-r30-pml1p5-pad1-m1p5 | 30 | 1.50000 | 1.00000 | 1.00000 | 0 | 0.00143000 | 0.00143000 | 0.00143000 | pass |
| l82-mirror-r30-pml1p5-pad2-m1p5 | 30 | 1.50000 | 2.00000 | 1.00000 | 0 | 8.9000e-4 | 8.9000e-4 | 8.9000e-4 | pass |
| l82-mirror-r30-pml1p5-pad3-m1p5 | 30 | 1.50000 | 3.00000 | 1.00000 | 0 | 8.0000e-4 | 8.0000e-4 | 8.0000e-4 | pass |

## Warnings
- Sweep contains 36 external runs; review cost before launching an external solver.

## Boundary
- External FDTD benchmark/convergence support only; the browser app does not execute FDTD.
- Benchmark packs export deterministic manifests, sweep plans, and Meep helper scripts for optional external execution.
- Imported convergence summaries are evidence from external runs or deterministic fixtures, not in-browser Maxwell solves.
- No arbitrary 3D CAD geometry, curved material lens solve, finite-thickness metal aperture Maxwell solve, FEM/BEM/RCWA execution, production solver validation, sensor-stack EM, digital twin, or manufacturing certification is claimed.
