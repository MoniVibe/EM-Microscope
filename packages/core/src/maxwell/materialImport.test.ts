import { describe, expect, it } from "vitest";
import { listL4SpectralMaterials, sampleSpectralMaterial } from "./materialCatalog";
import { auditMaterialCatalog, createMaterialImportTemplate, importMaterialPackage, parseMaterialImportJson } from "./materialImport";

describe("L5.3 spectral material import", () => {
  it("imports sourced n,k records with wavelength unit normalization", () => {
    const result = importMaterialPackage({
      schema: "emmicro.materials.v1",
      id: "unit-test-pack",
      label: "Unit test material pack",
      records: [
        {
          id: "custom-sio2",
          label: "Custom SiO2",
          family: "coating",
          wavelengthUnit: "nm",
          source: {
            name: "unit test source",
            reference: "synthetic test fixture",
            license: "test-only"
          },
          samples: [
            { wavelength: 700, n: 1.455, k: 0 },
            { wavelength: 400, n: 1.47, k: 0 },
            { wavelength: 550, n: 1.46, k: 0 }
          ]
        }
      ]
    });
    const record = result.records[0];
    const lookup = sampleSpectralMaterial(record!, 475e-9);

    expect(result.type).toBe("maxwellMaterialImport");
    expect(record?.samples[0]?.wavelengthM).toBeCloseTo(400e-9, 18);
    expect(record?.samples[1]?.wavelengthM).toBeCloseTo(550e-9, 18);
    expect(record?.samples[2]?.wavelengthM).toBeCloseTo(700e-9, 18);
    expect(lookup.interpolation).toBe("linear");
    expect(lookup.material.refractiveIndex.n).toBeCloseTo(1.465, 12);
    expect(record?.source).toContain("unit test source");
    expect(result.provenance.limitations.join(" ")).toContain("not a live refractiveindex.info integration");
  });

  it("clamps negative extinction and warns about weak source metadata", () => {
    const result = importMaterialPackage({
      schema: "emmicro.materials.v1",
      id: "weak-source-pack",
      label: "Weak source material pack",
      records: [
        {
          id: "lossy-test",
          label: "Lossy test",
          family: "absorber",
          wavelengthUnit: "um",
          source: { name: "unreferenced source" },
          samples: [{ wavelength: 0.55, n: 2.1, k: -0.3 }]
        }
      ]
    });

    expect(result.records[0]?.samples[0]?.wavelengthM).toBeCloseTo(550e-9, 18);
    expect(result.records[0]?.samples[0]?.refractiveIndex.k).toBe(0);
    expect(result.warnings.some((warning) => warning.code === "maxwell.materialImport.negativeExtinctionClamped")).toBe(true);
    expect(result.warnings.some((warning) => warning.code === "maxwell.materialImport.weakSource")).toBe(true);
  });

  it("audits built-in diagnostic material records", () => {
    const audit = auditMaterialCatalog(listL4SpectralMaterials());

    expect(audit.recordCount).toBeGreaterThan(0);
    expect(audit.sampleCount).toBeGreaterThan(audit.recordCount);
    expect(audit.diagnosticRecordCount).toBeGreaterThan(0);
    expect(audit.warnings.some((warning) => warning.code === "maxwell.materialCatalog.diagnosticRecords")).toBe(true);
  });

  it("is deterministic and sensitive to material source/sample changes", () => {
    const template = createMaterialImportTemplate();
    const a = parseMaterialImportJson(JSON.stringify(template));
    const b = parseMaterialImportJson(JSON.stringify(template));
    const c = parseMaterialImportJson(
      JSON.stringify({
        ...template,
        records: template.records.map((record) => ({
          ...record,
          samples: record.samples.map((sample, index) => (index === 1 ? { ...sample, n: sample.n + 0.001 } : sample))
        }))
      })
    );

    expect(a.resultHash).toBe(b.resultHash);
    expect(a.resultHash).not.toBe(c.resultHash);
  });

  it("rejects duplicate wavelengths after unit conversion", () => {
    expect(() =>
      importMaterialPackage({
        schema: "emmicro.materials.v1",
        id: "duplicate-pack",
        label: "Duplicate material pack",
        records: [
          {
            id: "duplicate",
            label: "Duplicate",
            family: "coating",
            wavelengthUnit: "nm",
            source: { name: "test", reference: "test" },
            samples: [
              { wavelength: 550, n: 1.5, k: 0 },
              { wavelength: 550, n: 1.51, k: 0 }
            ]
          }
        ]
      })
    ).toThrow(/duplicate wavelength/);
  });
});
