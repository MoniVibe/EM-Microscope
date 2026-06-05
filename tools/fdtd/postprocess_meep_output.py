#!/usr/bin/env python3
"""Create a compact EMMicro import summary from external FDTD artifacts."""

from __future__ import annotations

import argparse
import csv
import json
import pathlib
from typing import Any


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate EMMicro L8.1 FDTD import artifacts.")
    parser.add_argument("--receipt", type=pathlib.Path, required=True, help="run_receipt.json")
    parser.add_argument("--flux", type=pathlib.Path, required=True, help="flux_summary.json")
    parser.add_argument("--field-csv", type=pathlib.Path, required=True, help="field_slice_xz.csv")
    parser.add_argument("--out", type=pathlib.Path, default=pathlib.Path("fdtd_import_summary.json"))
    args = parser.parse_args()

    receipt = load_json(args.receipt)
    flux = load_json(args.flux)
    rows = load_field_rows(args.field_csv)
    warnings = []

    if receipt.get("schema") != "emmicro.fdtd.runReceipt.v1":
        warnings.append({"code": "fdtd.postprocess.badReceiptSchema", "message": "Receipt schema is not emmicro.fdtd.runReceipt.v1."})
    if flux.get("schema") != "emmicro.fdtd.fluxSummary.v1":
        warnings.append({"code": "fdtd.postprocess.badFluxSchema", "message": "Flux schema is not emmicro.fdtd.fluxSummary.v1."})
    if receipt.get("runId") != flux.get("runId"):
        warnings.append({"code": "fdtd.postprocess.runIdMismatch", "message": "Receipt and flux summary runId values differ."})

    intensities = [row["intensity"] for row in rows]
    summary = {
        "schema": "emmicro.fdtd.importSummary.v1",
        "runId": receipt.get("runId"),
        "sourceScenarioHash": receipt.get("sourceScenarioHash"),
        "manifestHash": receipt.get("manifestHash"),
        "flux": {
            "reflectance": flux.get("reflectance"),
            "transmittance": flux.get("transmittance"),
            "absorbance": flux.get("absorbance"),
            "energyBalance": flux.get("energyBalance"),
        },
        "fieldSlice": {
            "sampleCount": len(rows),
            "minIntensity": min(intensities) if intensities else 0,
            "maxIntensity": max(intensities) if intensities else 0,
        },
        "warnings": warnings,
    }
    args.out.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))
    return 0 if not warnings else 1


def load_json(path: pathlib.Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        value = json.load(handle)
    if not isinstance(value, dict):
        raise SystemExit(f"{path} must contain a JSON object")
    return value


def load_field_rows(path: pathlib.Path) -> list[dict[str, float]]:
    with path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        required = {"x_um", "z_um", "value", "intensity"}
        if set(reader.fieldnames or []) < required:
            raise SystemExit("field CSV must include x_um,z_um,value,intensity")
        rows = []
        for row in reader:
            rows.append({name: float(row[name]) for name in required})
    return rows


if __name__ == "__main__":
    raise SystemExit(main())
