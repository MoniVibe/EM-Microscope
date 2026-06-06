# L8.8 Engineering Evidence Campaign

This folder contains the deterministic Golden Evidence Pack used by the L8.8 Engineering Evidence Campaign panel.

The web app imports:

- `campaign_manifest.json`
- `expected/golden_campaign_summary.json`

The dossier export path writes:

- `engineering_evidence_dossier.md`
- `engineering_evidence_dossier.json`
- `scenario_summary.csv`
- `convergence_summary.csv`
- `tolerance_summary.csv`
- `robust_candidate_summary.csv`
- `capability_truth_table.csv`
- `unsupported_items.csv`

The scenario folders keep compact per-scenario fixture slices for review. They are generated from the same core campaign functions used by the app. They are deterministic diagnostic fixtures, not measured lab data and not certification evidence.

Scope boundaries:

- External FDTD execution is optional and remains outside the browser.
- The browser imports and reports evidence; it does not execute FDTD/FEM/BEM/RCWA.
- This pack is not certified validation, certified optical tolerancing, production EM solver certification, arbitrary 3D Maxwell/CAD solving, digital twin behavior, or manufacturing certification.

`run_campaign.py` performs a lightweight local consistency check over the checked-in campaign files. It also reports whether Meep is importable, but Meep is never required for npm tests, builds, or the web runtime.
