# L8.1 External FDTD Artifact Schemas

All artifacts are diagnostic evidence for import into EMMicro. Hashes are deterministic FNV-1a 64-bit values over canonical JSON in the TypeScript core.

## Scene Manifest

Schema id: `emmicro.fdtd.sceneManifest.v1`

Required high-level fields:
- `sourceScenarioHash`
- `manifestHash`
- `grid`
- `source`
- `materials`
- `geometry`
- `monitors`
- `readiness`
- `limitations`

Executable geometry in L8.1 is limited to exported planar/block slab cases used by the Simulation Builder target. Curved material lenses and finite-thickness metal aperture Maxwell solves are blocked.

## Meep Script Export

Schema id: `emmicro.fdtd.meepScript.v1`

The script is a deterministic helper artifact. The browser app does not run it.

## Run Receipt

Schema id: `emmicro.fdtd.runReceipt.v1`

Required high-level fields:
- `runId`
- `sourceScenarioHash`
- `manifestHash`
- `scriptHash`
- `tool`
- `settings`
- `warnings`
- `receiptHash`

## Flux Summary

Schema id: `emmicro.fdtd.fluxSummary.v1`

Required high-level fields:
- `runId`
- `sourceScenarioHash`
- `manifestHash`
- `incidentFlux`
- `reflectedFlux`
- `transmittedFlux`
- `absorbedFlux`
- `reflectance`
- `transmittance`
- `absorbance`
- `energyBalance`
- `monitors`
- `warnings`
- `fluxHash`

## Field Slice CSV

Required header:

```csv
x_um,z_um,value,intensity
```

The imported L8.1 UI treats this as an external field-map slice and compares flux R/T/A against the L8.0 analytic/TMM target result. It does not infer a full 3D Maxwell solution from the CSV alone.
