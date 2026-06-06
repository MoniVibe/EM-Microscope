# L8.2 Absorbing slab FDTD Benchmark Convergence Report

Status: FAIL
Reference model: beer-lambert
Benchmark hash: 52ccaa5123ac249e
Sweep hash: a481c30f206c462e
Summary hash: 67cbfe2b4126c026

## Reference

Invariant: Beer-Lambert attenuation residual and energy balance stabilize as grid density increases.

| Metric | Expected |
| --- | ---: |
| R | 0 |
| T | 0.606531 |
| A | 0.393469 |

## Convergence Trend

| Resolution ppw | Mean reference residual | Max energy error | Mean field delta | Runs |
| ---: | ---: | ---: | ---: | ---: |
| 10 | 0.0200833 | 0.0562800 | 0.0281167 | 9 |
| 15 | 0.0134167 | 0.0464133 | 0.0187833 | 9 |
| 20 | 0.0110833 | 0.0429600 | 0.0155167 | 9 |
| 30 | 0.00941667 | 0.0404933 | 0.0131833 | 9 |

Trend: decreasing
PML sensitivity max delta: 0.0222500 (warning)

## Run Table

| Run | ppw | PML um | padding lambda | R | T | A | residual | energy error | status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| l82-absorbing-slab-r10-pml0p5-pad1-m1p5 | 10 | 0.500000 | 1.00000 | 0.0302400 | 0.642531 | 0.383509 | 0.0360000 | 0.0562800 | fail |
| l82-absorbing-slab-r10-pml0p5-pad2-m1p5 | 10 | 0.500000 | 2.00000 | 0.0289800 | 0.641031 | 0.384049 | 0.0345000 | 0.0540600 | fail |
| l82-absorbing-slab-r10-pml0p5-pad3-m1p5 | 10 | 0.500000 | 3.00000 | 0.0287700 | 0.640781 | 0.384139 | 0.0342500 | 0.0536900 | fail |
| l82-absorbing-slab-r10-pml1-pad1-m1p5 | 10 | 1.00000 | 1.00000 | 0.0115500 | 0.620281 | 0.388919 | 0.0137500 | 0.0207500 | warning |
| l82-absorbing-slab-r10-pml1-pad2-m1p5 | 10 | 1.00000 | 2.00000 | 0.0102900 | 0.618781 | 0.389459 | 0.0122500 | 0.0185300 | warning |
| l82-absorbing-slab-r10-pml1-pad3-m1p5 | 10 | 1.00000 | 3.00000 | 0.0100800 | 0.618531 | 0.389549 | 0.0120000 | 0.0181600 | warning |
| l82-absorbing-slab-r10-pml1p5-pad1-m1p5 | 10 | 1.50000 | 1.00000 | 0.0115500 | 0.620281 | 0.388919 | 0.0137500 | 0.0207500 | warning |
| l82-absorbing-slab-r10-pml1p5-pad2-m1p5 | 10 | 1.50000 | 2.00000 | 0.0102900 | 0.618781 | 0.389459 | 0.0122500 | 0.0185300 | warning |
| l82-absorbing-slab-r10-pml1p5-pad3-m1p5 | 10 | 1.50000 | 3.00000 | 0.0100800 | 0.618531 | 0.389549 | 0.0120000 | 0.0181600 | warning |
| l82-absorbing-slab-r15-pml0p5-pad1-m1p5 | 15 | 0.500000 | 1.00000 | 0.0246400 | 0.635864 | 0.385909 | 0.0293333 | 0.0464133 | fail |
| l82-absorbing-slab-r15-pml0p5-pad2-m1p5 | 15 | 0.500000 | 2.00000 | 0.0233800 | 0.634364 | 0.386449 | 0.0278333 | 0.0441933 | fail |
| l82-absorbing-slab-r15-pml0p5-pad3-m1p5 | 15 | 0.500000 | 3.00000 | 0.0231700 | 0.634114 | 0.386539 | 0.0275833 | 0.0438233 | fail |
| l82-absorbing-slab-r15-pml1-pad1-m1p5 | 15 | 1.00000 | 1.00000 | 0.00595000 | 0.613614 | 0.391319 | 0.00708333 | 0.0108833 | warning |
| l82-absorbing-slab-r15-pml1-pad2-m1p5 | 15 | 1.00000 | 2.00000 | 0.00469000 | 0.612114 | 0.391859 | 0.00558333 | 0.00866333 | pass |
| l82-absorbing-slab-r15-pml1-pad3-m1p5 | 15 | 1.00000 | 3.00000 | 0.00448000 | 0.611864 | 0.391949 | 0.00533333 | 0.00829333 | pass |
| l82-absorbing-slab-r15-pml1p5-pad1-m1p5 | 15 | 1.50000 | 1.00000 | 0.00595000 | 0.613614 | 0.391319 | 0.00708333 | 0.0108833 | warning |
| l82-absorbing-slab-r15-pml1p5-pad2-m1p5 | 15 | 1.50000 | 2.00000 | 0.00469000 | 0.612114 | 0.391859 | 0.00558333 | 0.00866333 | pass |
| l82-absorbing-slab-r15-pml1p5-pad3-m1p5 | 15 | 1.50000 | 3.00000 | 0.00448000 | 0.611864 | 0.391949 | 0.00533333 | 0.00829333 | pass |
| l82-absorbing-slab-r20-pml0p5-pad1-m1p5 | 20 | 0.500000 | 1.00000 | 0.0226800 | 0.633531 | 0.386749 | 0.0270000 | 0.0429600 | fail |
| l82-absorbing-slab-r20-pml0p5-pad2-m1p5 | 20 | 0.500000 | 2.00000 | 0.0214200 | 0.632031 | 0.387289 | 0.0255000 | 0.0407400 | fail |
| l82-absorbing-slab-r20-pml0p5-pad3-m1p5 | 20 | 0.500000 | 3.00000 | 0.0212100 | 0.631781 | 0.387379 | 0.0252500 | 0.0403700 | fail |
| l82-absorbing-slab-r20-pml1-pad1-m1p5 | 20 | 1.00000 | 1.00000 | 0.00399000 | 0.611281 | 0.392159 | 0.00475000 | 0.00743000 | pass |
| l82-absorbing-slab-r20-pml1-pad2-m1p5 | 20 | 1.00000 | 2.00000 | 0.00273000 | 0.609781 | 0.392699 | 0.00325000 | 0.00521000 | pass |
| l82-absorbing-slab-r20-pml1-pad3-m1p5 | 20 | 1.00000 | 3.00000 | 0.00252000 | 0.609531 | 0.392789 | 0.00300000 | 0.00484000 | pass |
| l82-absorbing-slab-r20-pml1p5-pad1-m1p5 | 20 | 1.50000 | 1.00000 | 0.00399000 | 0.611281 | 0.392159 | 0.00475000 | 0.00743000 | pass |
| l82-absorbing-slab-r20-pml1p5-pad2-m1p5 | 20 | 1.50000 | 2.00000 | 0.00273000 | 0.609781 | 0.392699 | 0.00325000 | 0.00521000 | pass |
| l82-absorbing-slab-r20-pml1p5-pad3-m1p5 | 20 | 1.50000 | 3.00000 | 0.00252000 | 0.609531 | 0.392789 | 0.00300000 | 0.00484000 | pass |
| l82-absorbing-slab-r30-pml0p5-pad1-m1p5 | 30 | 0.500000 | 1.00000 | 0.0212800 | 0.631864 | 0.387349 | 0.0253333 | 0.0404933 | fail |
| l82-absorbing-slab-r30-pml0p5-pad2-m1p5 | 30 | 0.500000 | 2.00000 | 0.0200200 | 0.630364 | 0.387889 | 0.0238333 | 0.0382733 | fail |
| l82-absorbing-slab-r30-pml0p5-pad3-m1p5 | 30 | 0.500000 | 3.00000 | 0.0198100 | 0.630114 | 0.387979 | 0.0235833 | 0.0379033 | fail |
| l82-absorbing-slab-r30-pml1-pad1-m1p5 | 30 | 1.00000 | 1.00000 | 0.00259000 | 0.609614 | 0.392759 | 0.00308333 | 0.00496333 | pass |
| l82-absorbing-slab-r30-pml1-pad2-m1p5 | 30 | 1.00000 | 2.00000 | 0.00133000 | 0.608114 | 0.393299 | 0.00158333 | 0.00274333 | pass |
| l82-absorbing-slab-r30-pml1-pad3-m1p5 | 30 | 1.00000 | 3.00000 | 0.00112000 | 0.607864 | 0.393389 | 0.00133333 | 0.00237333 | pass |
| l82-absorbing-slab-r30-pml1p5-pad1-m1p5 | 30 | 1.50000 | 1.00000 | 0.00259000 | 0.609614 | 0.392759 | 0.00308333 | 0.00496333 | pass |
| l82-absorbing-slab-r30-pml1p5-pad2-m1p5 | 30 | 1.50000 | 2.00000 | 0.00133000 | 0.608114 | 0.393299 | 0.00158333 | 0.00274333 | pass |
| l82-absorbing-slab-r30-pml1p5-pad3-m1p5 | 30 | 1.50000 | 3.00000 | 0.00112000 | 0.607864 | 0.393389 | 0.00133333 | 0.00237333 | pass |

## Warnings
- Sweep contains 36 external runs; review cost before launching an external solver.
- Run l82-absorbing-slab-r10-pml0p5-pad1-m1p5 has R+T+A energy-balance error 5.628e-2.
- Run l82-absorbing-slab-r10-pml0p5-pad2-m1p5 has R+T+A energy-balance error 5.406e-2.
- Run l82-absorbing-slab-r10-pml0p5-pad3-m1p5 has R+T+A energy-balance error 5.369e-2.
- Run l82-absorbing-slab-r15-pml0p5-pad1-m1p5 has R+T+A energy-balance error 4.641e-2.
- Run l82-absorbing-slab-r15-pml0p5-pad2-m1p5 has R+T+A energy-balance error 4.419e-2.
- Run l82-absorbing-slab-r15-pml0p5-pad3-m1p5 has R+T+A energy-balance error 4.382e-2.
- Run l82-absorbing-slab-r20-pml0p5-pad1-m1p5 has R+T+A energy-balance error 4.296e-2.
- Run l82-absorbing-slab-r20-pml0p5-pad2-m1p5 has R+T+A energy-balance error 4.074e-2.
- Run l82-absorbing-slab-r20-pml0p5-pad3-m1p5 has R+T+A energy-balance error 4.037e-2.
- Run l82-absorbing-slab-r30-pml0p5-pad1-m1p5 has R+T+A energy-balance error 4.049e-2.
- Run l82-absorbing-slab-r30-pml0p5-pad2-m1p5 has R+T+A energy-balance error 3.827e-2.
- Run l82-absorbing-slab-r30-pml0p5-pad3-m1p5 has R+T+A energy-balance error 3.790e-2.
- PML sensitivity exceeds the warning threshold; treat this benchmark as configuration-sensitive.

## Boundary
- External FDTD benchmark/convergence support only; the browser app does not execute FDTD.
- Benchmark packs export deterministic manifests, sweep plans, and Meep helper scripts for optional external execution.
- Imported convergence summaries are evidence from external runs or deterministic fixtures, not in-browser Maxwell solves.
- No arbitrary 3D CAD geometry, curved material lens solve, finite-thickness metal aperture Maxwell solve, FEM/BEM/RCWA execution, production solver validation, sensor-stack EM, digital twin, or manufacturing certification is claimed.
