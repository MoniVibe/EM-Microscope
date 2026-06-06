# L8.1/L8.2/L8.3/L8.4/L8.5 FDTD Example Fixtures

These files are deterministic diagnostic fixtures generated from `packages/core`.
They are for import/export and convergence smoke testing only and are not measured lab results.
L8.3 adds finite placed surface-geometry diagnostics for transparent blocks, absorbing blocks, reflective plates, aperture/blockers, and tilted interface wedges.
L8.4 adds finite aperture/blocker edge-diffraction validation diagnostics for long slits, circular pinholes, rectangular apertures, and opaque blockers.
L8.5 adds a multi-element optical bench chain fixture with scene graph, solver plan, monitor stack, validation report, FDTD manifest/script, and bundled external evidence.

Regenerate with:

```powershell
npx --yes tsx tools/fdtd/generate_examples.mjs
```
