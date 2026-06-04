import { describe, expect, it } from "vitest";
import { createMinimalMaxwellScene3D } from "./maxwell3dValidation";
import { exportExternalFdtdScaffold, exportMeepPythonStub } from "./meepExport";

describe("L6.0 Meep-style FDTD scaffold export", () => {
  it("exports a deterministic Meep-style Python stub", () => {
    const scene = createMinimalMaxwellScene3D();
    const a = exportMeepPythonStub(scene);
    const b = exportMeepPythonStub(createMinimalMaxwellScene3D());

    expect(a).toBe(b);
    expect(a).toContain("Generated scaffold only; not yet validated as an executable Meep workflow.");
    expect(a).toContain("L6.0 does not execute 3D Maxwell solves in-app.");
    expect(a).toContain(`scene_hash: ${scene.receipts.sceneHash}`);
    expect(a).toContain("cell_size = mp.Vector3(8, 8, 8)");
    expect(a).toContain("resolution = 16");
    expect(a).toContain("materials = {");
    expect(a).toContain("mp.Block");
    expect(a).toContain("mp.ContinuousSource");
    expect(a).toContain("mp.PML");
    expect(a).toContain("field-volume");
    expect(a).toContain("flux-plane");
    expect(a).toContain("HDF5/openPMD output hint");
    expect(a).toContain("# sim.run(until=200)  # intentionally commented; scaffold-only export.");
  });

  it("exports a deterministic JSON scaffold with manifest, backend receipt, script, and warning", () => {
    const scene = createMinimalMaxwellScene3D();
    const a = exportExternalFdtdScaffold(scene);
    const b = exportExternalFdtdScaffold(createMinimalMaxwellScene3D());
    const json = JSON.stringify(a);

    expect(a.resultHash).toBe(b.resultHash);
    expect(a.schema).toBe("emmicro.externalFdtdScaffold.v1");
    expect(a.notExecutableInApp).toBe(true);
    expect(a.backend.id).toBe("external-fdtd");
    expect(a.backend.capabilities.availability).toBe("scaffold-only");
    expect(a.backend.capabilities.supportsFDTD).toBe(true);
    expect(a.scene.receipts.sceneHash).toBe(scene.receipts.sceneHash);
    expect(json).toContain("\"units\":\"um\"");
    expect(json).toContain("\"domain\"");
    expect(json).toContain("\"plane-wave\"");
    expect(json).toContain("\"field-volume\"");
    expect(json).toContain("\"flux-plane\"");
    expect(json).toContain("\"pml\"");
    expect(json).toContain("\"materials\"");
    expect(json).toContain("\"sceneHash\"");
    expect(json).toContain("not yet validated as an executable Meep workflow");
  });

  it("rejects invalid scenes before exporting the stub", () => {
    const invalid = {
      ...createMinimalMaxwellScene3D(),
      receipts: {
        ...createMinimalMaxwellScene3D().receipts,
        sceneHash: "bad-hash"
      }
    };

    expect(() => exportMeepPythonStub(invalid)).toThrow(/invalid 3D Maxwell scene/);
  });
});
