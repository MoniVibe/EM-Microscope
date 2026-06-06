# L8.2 Empty-space propagation FDTD Benchmark Convergence Report

Status: PASS
Reference model: flux-conservation
Benchmark hash: d9bb21f3caa68d7d
Sweep hash: 42c2eb7eefcd7c44
Summary hash: f67a32850a36619d

## Reference

Invariant: R stays near 0, T stays near 1, and R+T+A stays near 1 as resolution/PML/padding vary.

| Metric | Expected |
| --- | ---: |
| R | 0 |
| T | 1.00000 |
| A | 0 |

## Convergence Trend

| Resolution ppw | Mean reference residual | Max energy error | Mean field delta | Runs |
| ---: | ---: | ---: | ---: | ---: |
| 10 | 0.0105833 | 0.00570000 | 0.0148167 | 9 |
| 15 | 0.00558333 | 0.00470000 | 0.00781667 | 9 |
| 20 | 0.00383333 | 0.00435000 | 0.00536667 | 9 |
| 30 | 0.00269889 | 0.00410000 | 0.00361667 | 9 |

Trend: decreasing
PML sensitivity max delta: 0.00335000 (pass)

## Run Table

| Run | ppw | PML um | padding lambda | R | T | A | residual | energy error | status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| l82-empty-space-r10-pml0p5-pad1-m1p5 | 10 | 0.500000 | 1.00000 | 0.0113400 | 0.986500 | 0.00786000 | 0.0135000 | 0.00570000 | pass |
| l82-empty-space-r10-pml0p5-pad2-m1p5 | 10 | 0.500000 | 2.00000 | 0.0100800 | 0.988000 | 0.00732000 | 0.0120000 | 0.00540000 | pass |
| l82-empty-space-r10-pml0p5-pad3-m1p5 | 10 | 0.500000 | 3.00000 | 0.00987000 | 0.988250 | 0.00723000 | 0.0117500 | 0.00535000 | pass |
| l82-empty-space-r10-pml1-pad1-m1p5 | 10 | 1.00000 | 1.00000 | 0.00903000 | 0.989250 | 0.00427000 | 0.0107500 | 0.00255000 | pass |
| l82-empty-space-r10-pml1-pad2-m1p5 | 10 | 1.00000 | 2.00000 | 0.00777000 | 0.990750 | 0.00373000 | 0.00925000 | 0.00225000 | pass |
| l82-empty-space-r10-pml1-pad3-m1p5 | 10 | 1.00000 | 3.00000 | 0.00756000 | 0.991000 | 0.00364000 | 0.00900000 | 0.00220000 | pass |
| l82-empty-space-r10-pml1p5-pad1-m1p5 | 10 | 1.50000 | 1.00000 | 0.00903000 | 0.989250 | 0.00427000 | 0.0107500 | 0.00255000 | pass |
| l82-empty-space-r10-pml1p5-pad2-m1p5 | 10 | 1.50000 | 2.00000 | 0.00777000 | 0.990750 | 0.00373000 | 0.00925000 | 0.00225000 | pass |
| l82-empty-space-r10-pml1p5-pad3-m1p5 | 10 | 1.50000 | 3.00000 | 0.00756000 | 0.991000 | 0.00364000 | 0.00900000 | 0.00220000 | pass |
| l82-empty-space-r15-pml0p5-pad1-m1p5 | 15 | 0.500000 | 1.00000 | 0.00714000 | 0.991500 | 0.00606000 | 0.00850000 | 0.00470000 | pass |
| l82-empty-space-r15-pml0p5-pad2-m1p5 | 15 | 0.500000 | 2.00000 | 0.00588000 | 0.993000 | 0.00552000 | 0.00700000 | 0.00440000 | pass |
| l82-empty-space-r15-pml0p5-pad3-m1p5 | 15 | 0.500000 | 3.00000 | 0.00567000 | 0.993250 | 0.00543000 | 0.00675000 | 0.00435000 | pass |
| l82-empty-space-r15-pml1-pad1-m1p5 | 15 | 1.00000 | 1.00000 | 0.00483000 | 0.994250 | 0.00247000 | 0.00575000 | 0.00155000 | pass |
| l82-empty-space-r15-pml1-pad2-m1p5 | 15 | 1.00000 | 2.00000 | 0.00357000 | 0.995750 | 0.00193000 | 0.00425000 | 0.00125000 | pass |
| l82-empty-space-r15-pml1-pad3-m1p5 | 15 | 1.00000 | 3.00000 | 0.00336000 | 0.996000 | 0.00184000 | 0.00400000 | 0.00120000 | pass |
| l82-empty-space-r15-pml1p5-pad1-m1p5 | 15 | 1.50000 | 1.00000 | 0.00483000 | 0.994250 | 0.00247000 | 0.00575000 | 0.00155000 | pass |
| l82-empty-space-r15-pml1p5-pad2-m1p5 | 15 | 1.50000 | 2.00000 | 0.00357000 | 0.995750 | 0.00193000 | 0.00425000 | 0.00125000 | pass |
| l82-empty-space-r15-pml1p5-pad3-m1p5 | 15 | 1.50000 | 3.00000 | 0.00336000 | 0.996000 | 0.00184000 | 0.00400000 | 0.00120000 | pass |
| l82-empty-space-r20-pml0p5-pad1-m1p5 | 20 | 0.500000 | 1.00000 | 0.00567000 | 0.993250 | 0.00543000 | 0.00675000 | 0.00435000 | pass |
| l82-empty-space-r20-pml0p5-pad2-m1p5 | 20 | 0.500000 | 2.00000 | 0.00441000 | 0.994750 | 0.00489000 | 0.00525000 | 0.00405000 | pass |
| l82-empty-space-r20-pml0p5-pad3-m1p5 | 20 | 0.500000 | 3.00000 | 0.00420000 | 0.995000 | 0.00480000 | 0.00500000 | 0.00400000 | pass |
| l82-empty-space-r20-pml1-pad1-m1p5 | 20 | 1.00000 | 1.00000 | 0.00336000 | 0.996000 | 0.00184000 | 0.00400000 | 0.00120000 | pass |
| l82-empty-space-r20-pml1-pad2-m1p5 | 20 | 1.00000 | 2.00000 | 0.00210000 | 0.997500 | 0.00130000 | 0.00250000 | 9.0000e-4 | pass |
| l82-empty-space-r20-pml1-pad3-m1p5 | 20 | 1.00000 | 3.00000 | 0.00189000 | 0.997750 | 0.00121000 | 0.00225000 | 8.5000e-4 | pass |
| l82-empty-space-r20-pml1p5-pad1-m1p5 | 20 | 1.50000 | 1.00000 | 0.00336000 | 0.996000 | 0.00184000 | 0.00400000 | 0.00120000 | pass |
| l82-empty-space-r20-pml1p5-pad2-m1p5 | 20 | 1.50000 | 2.00000 | 0.00210000 | 0.997500 | 0.00130000 | 0.00250000 | 9.0000e-4 | pass |
| l82-empty-space-r20-pml1p5-pad3-m1p5 | 20 | 1.50000 | 3.00000 | 0.00189000 | 0.997750 | 0.00121000 | 0.00225000 | 8.5000e-4 | pass |
| l82-empty-space-r30-pml0p5-pad1-m1p5 | 30 | 0.500000 | 1.00000 | 0.00462000 | 0.994500 | 0.00498000 | 0.00550000 | 0.00410000 | pass |
| l82-empty-space-r30-pml0p5-pad2-m1p5 | 30 | 0.500000 | 2.00000 | 0.00336000 | 0.996000 | 0.00444000 | 0.00444000 | 0.00380000 | pass |
| l82-empty-space-r30-pml0p5-pad3-m1p5 | 30 | 0.500000 | 3.00000 | 0.00315000 | 0.996250 | 0.00435000 | 0.00435000 | 0.00375000 | pass |
| l82-empty-space-r30-pml1-pad1-m1p5 | 30 | 1.00000 | 1.00000 | 0.00231000 | 0.997250 | 0.00139000 | 0.00275000 | 9.5000e-4 | pass |
| l82-empty-space-r30-pml1-pad2-m1p5 | 30 | 1.00000 | 2.00000 | 0.00105000 | 0.998750 | 8.5000e-4 | 0.00125000 | 6.5000e-4 | pass |
| l82-empty-space-r30-pml1-pad3-m1p5 | 30 | 1.00000 | 3.00000 | 8.4000e-4 | 0.999000 | 7.6000e-4 | 0.00100000 | 6.0000e-4 | pass |
| l82-empty-space-r30-pml1p5-pad1-m1p5 | 30 | 1.50000 | 1.00000 | 0.00231000 | 0.997250 | 0.00139000 | 0.00275000 | 9.5000e-4 | pass |
| l82-empty-space-r30-pml1p5-pad2-m1p5 | 30 | 1.50000 | 2.00000 | 0.00105000 | 0.998750 | 8.5000e-4 | 0.00125000 | 6.5000e-4 | pass |
| l82-empty-space-r30-pml1p5-pad3-m1p5 | 30 | 1.50000 | 3.00000 | 8.4000e-4 | 0.999000 | 7.6000e-4 | 0.00100000 | 6.0000e-4 | pass |

## Warnings
- Sweep contains 36 external runs; review cost before launching an external solver.

## Boundary
- External FDTD benchmark/convergence support only; the browser app does not execute FDTD.
- Benchmark packs export deterministic manifests, sweep plans, and Meep helper scripts for optional external execution.
- Imported convergence summaries are evidence from external runs or deterministic fixtures, not in-browser Maxwell solves.
- No arbitrary 3D CAD geometry, curved material lens solve, finite-thickness metal aperture Maxwell solve, FEM/BEM/RCWA execution, production solver validation, sensor-stack EM, digital twin, or manufacturing certification is claimed.
