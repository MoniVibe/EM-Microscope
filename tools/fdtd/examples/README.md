# L8.1/L8.2/L8.3 FDTD Example Fixtures

These files are deterministic diagnostic fixtures generated from `packages/core`.
They are for import/export and convergence smoke testing only and are not measured lab results.
L8.3 adds finite placed surface-geometry diagnostics for transparent blocks, absorbing blocks, reflective plates, aperture/blockers, and tilted interface wedges.

Regenerate with:

```powershell
npx --yes tsx tools/fdtd/generate_examples.mjs
```
