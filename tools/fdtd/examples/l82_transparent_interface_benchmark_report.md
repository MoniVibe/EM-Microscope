# L8.2 Transparent dielectric interface FDTD Benchmark Convergence Report

Status: PASS
Reference model: fresnel-normal-incidence
Benchmark hash: c100346f14168785
Sweep hash: ed84da8acda4950e
Summary hash: 54ffaeba26a81cd1

## Reference

Invariant: Normal-incidence Fresnel R/T stabilizes as grid density increases.

| Metric | Expected |
| --- | ---: |
| R | 0.0400000 |
| T | 0.960000 |
| A | 0 |

## Convergence Trend

| Resolution ppw | Mean reference residual | Max energy error | Mean field delta | Runs |
| ---: | ---: | ---: | ---: | ---: |
| 10 | 0.00958333 | 0.00550000 | 0.0134167 | 9 |
| 15 | 0.00513889 | 0.00461111 | 0.00719444 | 9 |
| 20 | 0.00358333 | 0.00430000 | 0.00501667 | 9 |
| 30 | 0.00260358 | 0.00407778 | 0.00346111 | 9 |

Trend: decreasing
PML sensitivity max delta: 0.00342111 (pass)

## Run Table

| Run | ppw | PML um | padding lambda | R | T | A | residual | energy error | status |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| l82-transparent-interface-r10-pml0p5-pad1-m1p5 | 10 | 0.500000 | 1.00000 | 0.0505000 | 0.947500 | 0.00750000 | 0.0125000 | 0.00550000 | pass |
| l82-transparent-interface-r10-pml0p5-pad2-m1p5 | 10 | 0.500000 | 2.00000 | 0.0492400 | 0.949000 | 0.00696000 | 0.0110000 | 0.00520000 | pass |
| l82-transparent-interface-r10-pml0p5-pad3-m1p5 | 10 | 0.500000 | 3.00000 | 0.0490300 | 0.949250 | 0.00687000 | 0.0107500 | 0.00515000 | pass |
| l82-transparent-interface-r10-pml1-pad1-m1p5 | 10 | 1.00000 | 1.00000 | 0.0481900 | 0.950250 | 0.00391000 | 0.00975000 | 0.00235000 | pass |
| l82-transparent-interface-r10-pml1-pad2-m1p5 | 10 | 1.00000 | 2.00000 | 0.0469300 | 0.951750 | 0.00337000 | 0.00825000 | 0.00205000 | pass |
| l82-transparent-interface-r10-pml1-pad3-m1p5 | 10 | 1.00000 | 3.00000 | 0.0467200 | 0.952000 | 0.00328000 | 0.00800000 | 0.00200000 | pass |
| l82-transparent-interface-r10-pml1p5-pad1-m1p5 | 10 | 1.50000 | 1.00000 | 0.0481900 | 0.950250 | 0.00391000 | 0.00975000 | 0.00235000 | pass |
| l82-transparent-interface-r10-pml1p5-pad2-m1p5 | 10 | 1.50000 | 2.00000 | 0.0469300 | 0.951750 | 0.00337000 | 0.00825000 | 0.00205000 | pass |
| l82-transparent-interface-r10-pml1p5-pad3-m1p5 | 10 | 1.50000 | 3.00000 | 0.0467200 | 0.952000 | 0.00328000 | 0.00800000 | 0.00200000 | pass |
| l82-transparent-interface-r15-pml0p5-pad1-m1p5 | 15 | 0.500000 | 1.00000 | 0.0467667 | 0.951944 | 0.00590000 | 0.00805556 | 0.00461111 | pass |
| l82-transparent-interface-r15-pml0p5-pad2-m1p5 | 15 | 0.500000 | 2.00000 | 0.0455067 | 0.953444 | 0.00536000 | 0.00655556 | 0.00431111 | pass |
| l82-transparent-interface-r15-pml0p5-pad3-m1p5 | 15 | 0.500000 | 3.00000 | 0.0452967 | 0.953694 | 0.00527000 | 0.00630556 | 0.00426111 | pass |
| l82-transparent-interface-r15-pml1-pad1-m1p5 | 15 | 1.00000 | 1.00000 | 0.0444567 | 0.954694 | 0.00231000 | 0.00530556 | 0.00146111 | pass |
| l82-transparent-interface-r15-pml1-pad2-m1p5 | 15 | 1.00000 | 2.00000 | 0.0431967 | 0.956194 | 0.00177000 | 0.00380556 | 0.00116111 | pass |
| l82-transparent-interface-r15-pml1-pad3-m1p5 | 15 | 1.00000 | 3.00000 | 0.0429867 | 0.956444 | 0.00168000 | 0.00355556 | 0.00111111 | pass |
| l82-transparent-interface-r15-pml1p5-pad1-m1p5 | 15 | 1.50000 | 1.00000 | 0.0444567 | 0.954694 | 0.00231000 | 0.00530556 | 0.00146111 | pass |
| l82-transparent-interface-r15-pml1p5-pad2-m1p5 | 15 | 1.50000 | 2.00000 | 0.0431967 | 0.956194 | 0.00177000 | 0.00380556 | 0.00116111 | pass |
| l82-transparent-interface-r15-pml1p5-pad3-m1p5 | 15 | 1.50000 | 3.00000 | 0.0429867 | 0.956444 | 0.00168000 | 0.00355556 | 0.00111111 | pass |
| l82-transparent-interface-r20-pml0p5-pad1-m1p5 | 20 | 0.500000 | 1.00000 | 0.0454600 | 0.953500 | 0.00534000 | 0.00650000 | 0.00430000 | pass |
| l82-transparent-interface-r20-pml0p5-pad2-m1p5 | 20 | 0.500000 | 2.00000 | 0.0442000 | 0.955000 | 0.00480000 | 0.00500000 | 0.00400000 | pass |
| l82-transparent-interface-r20-pml0p5-pad3-m1p5 | 20 | 0.500000 | 3.00000 | 0.0439900 | 0.955250 | 0.00471000 | 0.00475000 | 0.00395000 | pass |
| l82-transparent-interface-r20-pml1-pad1-m1p5 | 20 | 1.00000 | 1.00000 | 0.0431500 | 0.956250 | 0.00175000 | 0.00375000 | 0.00115000 | pass |
| l82-transparent-interface-r20-pml1-pad2-m1p5 | 20 | 1.00000 | 2.00000 | 0.0418900 | 0.957750 | 0.00121000 | 0.00225000 | 8.5000e-4 | pass |
| l82-transparent-interface-r20-pml1-pad3-m1p5 | 20 | 1.00000 | 3.00000 | 0.0416800 | 0.958000 | 0.00112000 | 0.00200000 | 8.0000e-4 | pass |
| l82-transparent-interface-r20-pml1p5-pad1-m1p5 | 20 | 1.50000 | 1.00000 | 0.0431500 | 0.956250 | 0.00175000 | 0.00375000 | 0.00115000 | pass |
| l82-transparent-interface-r20-pml1p5-pad2-m1p5 | 20 | 1.50000 | 2.00000 | 0.0418900 | 0.957750 | 0.00121000 | 0.00225000 | 8.5000e-4 | pass |
| l82-transparent-interface-r20-pml1p5-pad3-m1p5 | 20 | 1.50000 | 3.00000 | 0.0416800 | 0.958000 | 0.00112000 | 0.00200000 | 8.0000e-4 | pass |
| l82-transparent-interface-r30-pml0p5-pad1-m1p5 | 30 | 0.500000 | 1.00000 | 0.0445267 | 0.954611 | 0.00494000 | 0.00538889 | 0.00407778 | pass |
| l82-transparent-interface-r30-pml0p5-pad2-m1p5 | 30 | 0.500000 | 2.00000 | 0.0432667 | 0.956111 | 0.00440000 | 0.00440000 | 0.00377778 | pass |
| l82-transparent-interface-r30-pml0p5-pad3-m1p5 | 30 | 0.500000 | 3.00000 | 0.0430567 | 0.956361 | 0.00431000 | 0.00431000 | 0.00372778 | pass |
| l82-transparent-interface-r30-pml1-pad1-m1p5 | 30 | 1.00000 | 1.00000 | 0.0422167 | 0.957361 | 0.00135000 | 0.00263889 | 9.2778e-4 | pass |
| l82-transparent-interface-r30-pml1-pad2-m1p5 | 30 | 1.00000 | 2.00000 | 0.0409567 | 0.958861 | 8.1000e-4 | 0.00113889 | 6.2778e-4 | pass |
| l82-transparent-interface-r30-pml1-pad3-m1p5 | 30 | 1.00000 | 3.00000 | 0.0407467 | 0.959111 | 7.2000e-4 | 8.8889e-4 | 5.7778e-4 | pass |
| l82-transparent-interface-r30-pml1p5-pad1-m1p5 | 30 | 1.50000 | 1.00000 | 0.0422167 | 0.957361 | 0.00135000 | 0.00263889 | 9.2778e-4 | pass |
| l82-transparent-interface-r30-pml1p5-pad2-m1p5 | 30 | 1.50000 | 2.00000 | 0.0409567 | 0.958861 | 8.1000e-4 | 0.00113889 | 6.2778e-4 | pass |
| l82-transparent-interface-r30-pml1p5-pad3-m1p5 | 30 | 1.50000 | 3.00000 | 0.0407467 | 0.959111 | 7.2000e-4 | 8.8889e-4 | 5.7778e-4 | pass |

## Warnings
- Sweep contains 36 external runs; review cost before launching an external solver.

## Boundary
- External FDTD benchmark/convergence support only; the browser app does not execute FDTD.
- Benchmark packs export deterministic manifests, sweep plans, and Meep helper scripts for optional external execution.
- Imported convergence summaries are evidence from external runs or deterministic fixtures, not in-browser Maxwell solves.
- No arbitrary 3D CAD geometry, curved material lens solve, finite-thickness metal aperture Maxwell solve, FEM/BEM/RCWA execution, production solver validation, sensor-stack EM, digital twin, or manufacturing certification is claimed.
