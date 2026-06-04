import { describe, expect, it } from "vitest";
import { createMaterialCatalog, listCatalogMaterials } from "./materialCatalog";
import { importMaterialPackage } from "./materialImport";
import type { MaxwellScene3D } from "./maxwell3dTypes";
import {
  createMinimalMaxwellScene3D,
  deserializeMaxwellScene3DManifest,
  hashMaxwellScene3D,
  materialIdsInMaxwellScene3D,
  serializeMaxwellScene3DManifest,
  validateMaxwellScene3D,
  withMaxwellScene3DHash
} from "./maxwell3dValidation";

describe("L6.0 3D Maxwell schema", () => {
  it("validates a minimal 3D plane-wave box scene", () => {
    const scene = createMinimalMaxwellScene3D();
    const validation = validateMaxwellScene3D(scene);

    expect(validation.valid).toBe(true);
    expect(scene.version).toBe("emmicro.maxwell.scene3d.v1");
    expect(scene.backendId).toBe("external-fdtd");
    expect(scene.objects[0]?.kind).toBe("box");
    expect(scene.sources[0]?.kind).toBe("plane-wave");
    expect(scene.monitors.some((monitor) => monitor.kind === "field-volume")).toBe(true);
    expect(scene.boundaries.some((boundary) => boundary.kind === "pml")).toBe(true);
    expect(validation.warnings.some((warning) => warning.message.includes("does not execute 3D Maxwell solves"))).toBe(true);
  });

  it("requires units, domain, background material, sources, monitors, and boundaries", () => {
    const invalid = withMaxwellScene3DHash({
      ...createMinimalMaxwellScene3D(),
      units: "cm" as MaxwellScene3D["units"],
      domain: { size: [0, 8, 8] },
      backgroundMaterialId: "",
      boundaries: [],
      sources: [],
      monitors: []
    });
    const validation = validateMaxwellScene3D(invalid);

    expect(validation.valid).toBe(false);
    expect(validation.errors.join(" ")).toContain("units");
    expect(validation.errors.join(" ")).toContain("domain size");
    expect(validation.errors.join(" ")).toContain("background material");
    expect(validation.errors.join(" ")).toContain("boundary");
    expect(validation.errors.join(" ")).toContain("source");
    expect(validation.errors.join(" ")).toContain("monitor");
  });

  it("rejects unknown materials", () => {
    const scene = withMaxwellScene3DHash({
      ...createMinimalMaxwellScene3D(),
      objects: [
        {
          id: "unknown-box",
          kind: "box",
          center: [0, 0, 0],
          size: [1, 1, 1],
          materialId: "not-loaded"
        }
      ]
    });
    const validation = validateMaxwellScene3D(scene);

    expect(validation.valid).toBe(false);
    expect(validation.errors.join(" ")).toContain("unknown material 'not-loaded'");
  });

  it("hashes 3D scenes deterministically", () => {
    const a = createMinimalMaxwellScene3D();
    const b = createMinimalMaxwellScene3D();

    expect(a.receipts.sceneHash).toBe(hashMaxwellScene3D(a));
    expect(a.receipts.sceneHash).toBe(b.receipts.sceneHash);
  });

  it("preserves imported material provenance receipts", () => {
    const imported = importMaterialPackage({
      schema: "emmicro.materials.v1",
      id: "l60-3d-pack",
      label: "L6.0 imported 3D material pack",
      records: [
        {
          id: "l60-imported-glass",
          label: "L6.0 imported glass",
          family: "dielectric",
          wavelengthUnit: "nm",
          source: {
            name: "unit test 3D source",
            reference: "synthetic L6.0 fixture",
            license: "test-only"
          },
          samples: [
            { wavelength: 450, n: 1.62, k: 0 },
            { wavelength: 550, n: 1.6, k: 0 },
            { wavelength: 650, n: 1.58, k: 0 }
          ]
        }
      ]
    });
    const catalog = createMaterialCatalog({ id: "l60-3d-catalog", imports: [imported] });
    const importedMaterialId = listCatalogMaterials(catalog).find((material) => material.origin === "imported")?.id;
    if (!importedMaterialId) throw new Error("missing imported material id");

    const scene = createMinimalMaxwellScene3D({ materialCatalog: catalog, objectMaterialId: importedMaterialId });
    const importedReceipt = scene.receipts.materials.find((reference) => reference.materialId === importedMaterialId);

    expect(validateMaxwellScene3D(scene, catalog).valid).toBe(true);
    expect(importedReceipt?.origin).toBe("imported");
    expect(importedReceipt?.sourcePackHash).toBe(imported.resultHash);
    expect(materialIdsInMaxwellScene3D(scene)).toContain(importedMaterialId);
  });

  it("serializes and deserializes scene3d manifests", () => {
    const scene = createMinimalMaxwellScene3D();
    const serialized = serializeMaxwellScene3DManifest(scene);
    const roundTrip = deserializeMaxwellScene3DManifest(serialized);

    expect(roundTrip).toEqual(scene);
    expect(validateMaxwellScene3D(roundTrip).valid).toBe(true);
    expect(serialized).toContain("\"version\":\"emmicro.maxwell.scene3d.v1\"");
    expect(serialized).toContain("\"sceneHash\"");
  });
});
