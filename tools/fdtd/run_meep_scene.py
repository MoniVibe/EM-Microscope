#!/usr/bin/env python3
"""Validate an EMMicro L8.1 FDTD manifest/script pair and write a receipt scaffold.

This helper is intentionally conservative: it checks inputs and Meep availability,
but it does not certify that the generated script is a validated production workflow.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import json
import pathlib
import sys
from typing import Any


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare an EMMicro L8.1 external FDTD run receipt.")
    parser.add_argument("manifest", type=pathlib.Path, help="fdtd_scene_manifest.json")
    parser.add_argument("script", type=pathlib.Path, help="generated Meep Python script")
    parser.add_argument("--out", type=pathlib.Path, default=pathlib.Path("fdtd_run"), help="output directory")
    parser.add_argument("--until", type=float, default=200.0, help="Meep run duration recorded in the receipt")
    args = parser.parse_args()

    manifest = load_json(args.manifest)
    if manifest.get("schema") != "emmicro.fdtd.sceneManifest.v1":
        raise SystemExit("manifest schema must be emmicro.fdtd.sceneManifest.v1")
    script_text = args.script.read_text(encoding="utf-8")
    if "import meep as mp" not in script_text:
        raise SystemExit("script does not look like an EMMicro Meep helper export")

    meep_available = check_meep_available()
    warnings = []
    if not meep_available:
        warnings.append(
            {
                "code": "fdtd.helper.meepUnavailable",
                "message": "Python could not import meep; receipt records preparation only, not a solver run.",
            }
        )

    args.out.mkdir(parents=True, exist_ok=True)
    script_hash = fnv1a64(canonical_json({"manifestHash": manifest["manifestHash"], "python": script_text}))
    receipt_payload = {
        "schema": "emmicro.fdtd.runReceipt.v1",
        "runId": f"external-{manifest.get('manifestHash', 'unknown')[:10]}",
        "sourceScenarioHash": manifest["sourceScenarioHash"],
        "manifestHash": manifest["manifestHash"],
        "scriptHash": script_hash,
        "tool": {
            "name": "external-fdtd" if not meep_available else "meep",
            "version": "unknown" if not meep_available else "importable",
            "postprocessorVersion": "tools/fdtd/run_meep_scene.py",
        },
        "createdAtIso": _dt.datetime.now(_dt.timezone.utc).isoformat().replace("+00:00", "Z"),
        "settings": {
            "resolution": max(1, round(1000 / float(manifest["grid"]["gridSpacingNm"]))),
            "until": args.until,
            "pmlThicknessUm": manifest["boundaries"]["pmlThicknessUm"],
        },
        "warnings": warnings,
    }
    receipt = {**receipt_payload, "receiptHash": fnv1a64(canonical_json(receipt_payload))}
    (args.out / "run_receipt.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    (args.out / "scene_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    print(json.dumps({"receipt": str(args.out / "run_receipt.json"), "meepAvailable": meep_available, "warningCount": len(warnings)}, indent=2))
    return 0 if meep_available else 2


def load_json(path: pathlib.Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        value = json.load(handle)
    if not isinstance(value, dict):
        raise SystemExit(f"{path} must contain a JSON object")
    return value


def check_meep_available() -> bool:
    try:
        __import__("meep")
        return True
    except Exception:
        return False


def canonical_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"))


def fnv1a64(text: str) -> str:
    value = 0xCBF29CE484222325
    prime = 0x100000001B3
    mask = 0xFFFFFFFFFFFFFFFF
    for char in text:
        value ^= ord(char)
        value = (value * prime) & mask
    return f"{value:016x}"


if __name__ == "__main__":
    raise SystemExit(main())
