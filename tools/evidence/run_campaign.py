#!/usr/bin/env python3
"""L8.8 evidence campaign checker.

This helper intentionally does not execute browser FDTD. It validates the
checked-in campaign manifest/summary pair and reports optional Meep availability
for future external-run workflows.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        body = json.load(handle)
    if not isinstance(body, dict):
        raise ValueError(f"{path} must contain a JSON object")
    return body


def check_campaign(root: Path) -> list[str]:
    manifest_path = root / "campaign_manifest.json"
    summary_path = root / "expected" / "golden_campaign_summary.json"
    manifest = load_json(manifest_path)
    summary = load_json(summary_path)
    issues: list[str] = []

    if manifest.get("schema") != "emmicro.l88.evidenceCampaignManifest.v1":
        issues.append("campaign_manifest.json schema mismatch")
    if summary.get("schema") != "emmicro.l88.goldenCampaignSummary.v1":
        issues.append("golden_campaign_summary.json schema mismatch")
    if summary.get("campaignId") != manifest.get("id"):
        issues.append("summary campaignId does not match manifest id")
    if summary.get("manifestHash") != manifest.get("manifestHash"):
        issues.append("summary manifestHash does not match manifest manifestHash")

    required = set(manifest.get("scenarioIds", []))
    scenarios = summary.get("scenarios", [])
    present = {scenario.get("id") for scenario in scenarios if isinstance(scenario, dict)}
    missing = sorted(required - present)
    if missing:
        issues.append(f"missing scenarios: {', '.join(missing)}")

    boundary = " ".join(str(item) for item in summary.get("boundary", []))
    if "not certified validation" not in boundary:
        issues.append("summary boundary does not state not certified validation")
    if "browser" not in boundary or "FDTD" not in boundary:
        issues.append("summary boundary does not preserve browser FDTD limitation")

    required_artifacts = set(manifest.get("requiredArtifacts", []))
    dossier_exports = set(summary.get("dossierExports", []))
    missing_exports = sorted(required_artifacts - dossier_exports - {"campaign_manifest.json", "golden_campaign_summary.json"})
    if missing_exports:
        issues.append(f"missing dossier exports: {', '.join(missing_exports)}")

    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description="Check the L8.8 engineering evidence campaign bundle.")
    parser.add_argument("--root", type=Path, default=ROOT, help="Path to tools/evidence")
    parser.add_argument("--require-meep", action="store_true", help="Fail if Python Meep is not importable")
    args = parser.parse_args()

    issues = check_campaign(args.root)
    meep_available = importlib.util.find_spec("meep") is not None
    if args.require_meep and not meep_available:
        issues.append("Python Meep is not importable")

    if issues:
        print("L8.8 evidence campaign check: FAIL")
        for issue in issues:
            print(f"- {issue}")
        return 1

    print("L8.8 evidence campaign check: PASS")
    print(f"Meep importable: {'yes' if meep_available else 'no'}")
    print("External FDTD execution is optional; checked-in fixtures are deterministic diagnostic evidence.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
