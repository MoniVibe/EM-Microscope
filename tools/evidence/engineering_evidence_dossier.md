# L8.8 Golden Evidence Pack / External FDTD Acceptance Campaign

Iteration count is not validation. This dossier reports runnable evidence, references, residuals, convergence behavior, and limitations.

## Executive Summary

Campaign id: l88-golden-evidence-campaign
Manifest hash: 0ffb3d2c216b86e2
Summary hash: 03344b532989bb09
Scenario count: 7
Passing scenarios: 5
Warning scenarios: 2
Failing scenarios: 0

## What Was Simulated

| Scenario | Purpose | Evidence | Scene/result hash |
| --- | --- | --- | --- |
| Transparent slab | Transparent air-glass-air material interaction | imported-fixture | b9e9d2c32c66a0a6 |
| Absorbing slab | Absorption and lossy thickness behavior | imported-fixture | 982f243c1082d38f |
| Reflective plate | Ideal mirror / high-reflection limit | imported-fixture | 9bea0bd00510266d |
| Long slit aperture | Scalar sinc-squared edge-diffraction limiting case | imported-fixture | 20016793069c92b3 |
| Circular aperture | Airy/Bessel first-ring limiting case | imported-fixture | 4b5d69a020723f13 |
| Multi-element chain | Ordered optical bench workflow, solver routing, monitor stack, and external evidence receipts | computed/imported | 588269a545ca93a2 |
| Robust candidate before/after | L8.6 process variation plus L8.7 robust-advisor candidate improvement | computed | 588269a545ca93a2 |

## Scenario-by-Scenario Validation

| Scenario | Reference | Status | Expected T | Computed T | Residual | Convergence | PML |
| --- | --- | --- | ---: | ---: | ---: | --- | --- |
| Transparent slab | planar-tmm-stack | PASS | 1 | 0.999111 | 0.00260358 | decreasing | pass |
| Absorbing slab | beer-lambert | WARNING | 0.606531 | 0.607864 | 0.00291667 | decreasing | pass |
| Reflective plate | ideal-mirror | PASS | 0 | 0 | 0.00223667 | decreasing | pass |
| Long slit aperture | single-slit-sinc2 | PASS | 0.142857 | 0.138357 | 0.0045 | decreasing | pass |
| Circular aperture | airy-bessel | PASS | 0.0872665 | 0.0809665 | 0.0063 | decreasing | pass |
| Multi-element chain | stage-by-stage receipts | WARNING | 1 | 0.74 | 0 | stage receipts | n/a |
| Robust candidate before/after | L8.7 before/after tolerance metrics | PASS | n/a | n/a | 0 | tolerance-grid comparison | n/a |

## Convergence and PML Sensitivity

| Scenario | Runs | Trend | Final residual | Energy error | PML sensitivity | Status |
| --- | ---: | --- | ---: | ---: | ---: | --- |
| Transparent slab | 36 | decreasing | 0.00260358 | 0.00407778 | 0.00342111 | pass |
| Absorbing slab | 36 | decreasing | 0.00291667 | 0.0116333 | 0.00275 | warning |
| Reflective plate | 36 | decreasing | 0.00223667 | 0.00502 | 0.00359 | pass |
| Long slit aperture | 5 | decreasing | 0.0120373 | 0.0054168 | n/a | fail |
| Circular aperture | 5 | decreasing | 0.0173872 | 0.00782426 | n/a | fail |

## Process / Tolerance Variation

Tolerance report: c65b0f6facea2221
Variation hash: bd2caa3320dde47d
Pass rate: 0%
Worst case: warning
Top sensitivity: Ideal thin lens 1 z shift +/-0.05 mm

## Robust-Design Recommendation Before / After

Robust report: 003a785060fa1160
Best candidate: Balanced robust-grid candidate
Candidate hash: c460d926afd0b8ab
Baseline pass rate: 0%
Candidate pass rate: 0%
Pass-rate delta: 0%
Worst-case improvement: 0
Expected improvement: 0
Remaining failure driver: Circular aperture 1 x decenter +/-5 um

## Capability Truth Table

| Capability | Status | Evidence |
| --- | --- | --- |
| Engineering Evidence Campaign | executable | L8.8 campaign manifest, golden summary, scenario table, convergence review, tolerance/robust summaries, and dossier exports. |
| Golden scenario validation dossier | executable | Deterministic transparent, absorbing, reflective, aperture, multi-element, and robust candidate scenarios are bundled. |
| External FDTD evidence import | external-only | Manifest/script/hash receipts and imported field/flux/convergence summaries are accepted; browser does not execute FDTD. |
| Planar TMM/Fresnel references | executable | Transparent slab/interface and mirror/absorber references reuse existing L8.0/L8.2 analytic/TMM paths. |
| Aperture scalar limiting references | executable | L8.4 long-slit and circular-pinhole scalar references and convergence diagnostics are included. |
| L8.6 tolerance evidence | executable | Deterministic-grid tolerance report and FDTD variation sweep fixture hashes are preserved. |
| L8.7 robust before/after evidence | executable | Best candidate before/after metrics and external candidate sweep receipt hashes are preserved. |
| ExternalFdtdBackend | scaffold-only | Registered/export/import scaffold only; no in-browser solver execution. |
| Certified validation | not-implemented | L8.8 is an evidence dossier, not V&V certification. |
| Production EM solver certification | not-implemented | No production Maxwell solver, certified tolerancing, FEM/BEM/RCWA, or manufacturing certification is claimed. |

## Unsupported / Scaffold-Only Items

| Item | Status | Reason |
| --- | --- | --- |
| In-browser FDTD execution | not-implemented | The web app exports/imports external evidence only. |
| Arbitrary 3D Maxwell/CAD solve | not-implemented | Current 3D work is schema/export/import scaffolding and diagnostics, not a full 3D solver. |
| FEM/BEM/RCWA execution | not-implemented | No FEM, BEM, or RCWA backend is shipped. |
| Certified optical tolerancing | not-implemented | L8.6/L8.7/L8.8 are diagnostic engineering aids only. |
| Automatic final design approval | not-implemented | Robust candidates require explicit user application and review. |
| Digital twin / manufacturing certification | unsupported | No measured hardware loop, manufacturing line, or certified metrology process is implemented. |

## Reproducibility Receipts

| Scenario | Scene | Manifest | Script | Reference | Result/Summary |
| --- | --- | --- | --- | --- | --- |
| Transparent slab | b9e9d2c32c66a0a6 | 6f7759a16a257a90 | 5e07ed066a2e27c9 | c0d9f4ae6feebd90 | e0f37596b2a45898 |
| Absorbing slab | 982f243c1082d38f | 2fbdb1863c5086c2 | f0f52eb77325bbe1 | 10b4b173f1075711 | 6f34fec2824b203e |
| Reflective plate | 9bea0bd00510266d | 5ae7e4fdaf3e9f05 | 78484ba2c44f97ea | 98499069656035e7 | e74ac1703db9f22a |
| Long slit aperture | 20016793069c92b3 | 33d117e7c5e980b1 | 18ebd85d8771dbf9 | 0b0c42018e91a284 | 869d8674c368da04 |
| Circular aperture | 4b5d69a020723f13 | 4988876e01a19248 | 91e497b3ad5863f1 | c027771ff7993aef | 52d09ddc61225611 |
| Multi-element chain | 588269a545ca93a2 | dcc211305c62b196 | 17d79f269458dc42 | n/a | d58c421fe1e36261 |
| Robust candidate before/after | 588269a545ca93a2 | n/a | n/a | bd2caa3320dde47d | c460d926afd0b8ab |

## Limitations

- L8.8 is an engineer-facing evidence/reporting campaign over existing L8.x scenes, references, convergence summaries, tolerance results, and robust-advisor receipts.
- Golden campaign fixtures are deterministic diagnostic evidence and import contracts; external FDTD execution remains optional and outside the browser.
- Iteration count is not validation. This dossier reports runnable evidence, references, residuals, convergence behavior, and limitations.
- The campaign is not certified validation, certified tolerancing, automatic final design approval, in-browser FDTD, arbitrary 3D Maxwell/CAD execution, FEM/BEM/RCWA, production EM solving, digital twin behavior, or manufacturing certification.
