import { describe, expect, it } from "vitest";
import {
  compileCoatingStackToPlanarTmm,
  deserializeCoatingStackDesign,
  l41DefaultCoatingStack,
  runCoatingStack,
  runCoatingSweep,
  serializeCoatingStackDesign,
  type CoatingStackDefinition
} from "./coatingStack";
import { createMaterialCatalog, listCatalogMaterials } from "./materialCatalog";
import { importMaterialPackage } from "./materialImport";

describe("L4.1 coating stack runner", () => {
  it("compiles spectral material IDs into a planar TMM input", () => {
    const compiled = compileCoatingStackToPlanarTmm(l41DefaultCoatingStack);

    expect(compiled.input.incidentMedium.label).toBe("Air");
    expect(compiled.input.substrateMedium.label).toBe("BK7 glass");
    expect(compiled.input.layers[0]?.material.label).toBe("MgF2 coating");
    expect(compiled.input.layers[0]?.thicknessM).toBeCloseTo(l41DefaultCoatingStack.layers[0]?.thicknessM ?? 0, 15);
    expect(compiled.warnings.some((warning) => warning.message.includes("not a general 3D Maxwell solver"))).toBe(true);
  });

  it("runs the editable AR stack through the existing planar Maxwell TMM path", () => {
    const run = runCoatingStack(l41DefaultCoatingStack);

    expect(run.tmm.reflectance).toBeLessThan(0.02);
    expect(run.tmm.transmittance).toBeGreaterThan(0.9);
    expect(run.tmm.energyBalanceError).toBeLessThan(1e-10);
    expect(run.fieldMonitor.samples.length).toBeGreaterThan(2);
    expect(run.fieldMonitor.aggregateLayerAbsorbance).toBeCloseTo(run.tmm.absorbance, 10);
    expect(run.provenance.limitations.join(" ")).toContain("not a general 3D Maxwell solver");
  });

  it("sweeps wavelength with deterministic aggregate hashes", () => {
    const sweep = { startWavelengthM: 450e-9, endWavelengthM: 650e-9, sampleCount: 9 };
    const a = runCoatingSweep(l41DefaultCoatingStack, sweep);
    const b = runCoatingSweep(structuredClone(l41DefaultCoatingStack), sweep);
    const c = runCoatingSweep(
      {
        ...l41DefaultCoatingStack,
        layers: l41DefaultCoatingStack.layers.map((layer) => ({ ...layer, thicknessM: layer.thicknessM * 1.1 }))
      },
      sweep
    );

    expect(a.samples).toHaveLength(9);
    expect(a.reflectanceMin).toBeLessThan(a.reflectanceMax);
    expect(a.absorbanceMax).toBeCloseTo(0, 12);
    expect(a.resultHash).toBe(b.resultHash);
    expect(a.resultHash).not.toBe(c.resultHash);
  });

  it("surfaces material range warnings during sweeps", () => {
    const sweep = runCoatingSweep(l41DefaultCoatingStack, { startWavelengthM: 350e-9, endWavelengthM: 750e-9, sampleCount: 5 });

    expect(sweep.warnings.some((warning) => warning.code === "maxwell.material.wavelengthClamped")).toBe(true);
  });

  it("compiles imported material IDs into Maxwell TMM material receipts", () => {
    const { catalog, materialId } = importedCatalogFixture();
    const stack = importedStack(materialId);
    const compiled = compileCoatingStackToPlanarTmm(stack, stack.wavelengthM, { materialCatalog: catalog });
    const run = runCoatingStack(stack, { materialCatalog: catalog });

    expect(compiled.input.layers[0]?.material.label).toBe("Imported AR coating");
    expect(compiled.input.layers[0]?.material.catalogMaterialId).toBe(materialId);
    expect(compiled.input.layers[0]?.material.sourcePackHash).toBeTruthy();
    expect(compiled.materialCatalogRefs.some((reference) => reference.materialId === materialId)).toBe(true);
    expect(run.materialCatalogRefs.some((reference) => reference.materialId === materialId)).toBe(true);
    expect(run.tmm.energyBalanceError).toBeLessThan(1e-10);
  });

  it("serializes material references and fails clearly when an imported pack is missing", () => {
    const { catalog, materialId } = importedCatalogFixture();
    const stack = importedStack(materialId);
    const design = serializeCoatingStackDesign(stack, catalog);

    expect(design.schema).toBe("emmicro.coatingStack.v1");
    expect(design.materialCatalogRefs.some((reference) => reference.materialId === materialId)).toBe(true);
    expect(deserializeCoatingStackDesign(design, catalog).layers[0]?.materialId).toBe(materialId);
    expect(() => deserializeCoatingStackDesign(design, createMaterialCatalog())).toThrow(/material pack is not loaded/);
  });
});

function importedCatalogFixture(): { catalog: ReturnType<typeof createMaterialCatalog>; materialId: string } {
  const imported = importMaterialPackage({
    schema: "emmicro.materials.v1",
    id: "l54-stack-pack",
    label: "L5.4 stack material pack",
    records: [
      {
        id: "imported-ar",
        label: "Imported AR coating",
        family: "coating",
        wavelengthUnit: "nm",
        source: {
          name: "unit test coating source",
          reference: "synthetic L5.4 stack fixture",
          license: "test-only"
        },
        samples: [
          { wavelength: 400, n: 1.32, k: 0 },
          { wavelength: 550, n: 1.31, k: 0 },
          { wavelength: 700, n: 1.3, k: 0 }
        ]
      }
    ]
  });
  const catalog = createMaterialCatalog({ imports: [imported] });
  const materialId = listCatalogMaterials(catalog).find((material) => material.origin === "imported")?.id;
  if (!materialId) throw new Error("missing imported material id");
  return { catalog, materialId };
}

function importedStack(materialId: string): CoatingStackDefinition {
  return {
    ...l41DefaultCoatingStack,
    id: "l54-imported-stack",
    label: "L5.4 imported material stack",
    layers: [
      {
        id: "layer-imported-ar",
        label: "Imported AR coating",
        materialId,
        thicknessM: 96e-9
      }
    ]
  };
}
