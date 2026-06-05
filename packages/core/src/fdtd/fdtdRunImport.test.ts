import { describe, expect, it } from "vitest";
import {
  createAbsorbingFdtdExampleBundle,
  createTransparentFdtdExampleBundle,
  fdtdExampleFluxSummaryJson,
  fdtdExampleReceiptJson
} from "./fdtdExamples";
import { importFdtdRunArtifacts, parseFdtdFieldSliceCsv } from "./fdtdRunImport";
import { validateFdtdImportedRunAgainstScenario } from "./fdtdValidation";
import { defaultSimulationBuilderScenario } from "../maxwell/simulationBuilder";

describe("L8.1 external FDTD field-map import", () => {
  it("imports transparent slab receipt, flux summary, and field slice CSV with hashes intact", () => {
    const example = createTransparentFdtdExampleBundle();
    const imported = importFdtdRunArtifacts({
      receiptJson: fdtdExampleReceiptJson(example),
      fluxJson: fdtdExampleFluxSummaryJson(example),
      fieldSliceCsv: example.fieldSliceCsv,
      fieldSlice: {
        id: "field-slice-xz",
        sourceScenarioHash: example.manifest.sourceScenarioHash,
        manifestHash: example.manifest.manifestHash
      }
    });

    expect(imported.warnings).toHaveLength(0);
    expect(imported.receipt.receiptHash).toBe(example.receipt.receiptHash);
    expect(imported.flux.fluxHash).toBe(example.flux.fluxHash);
    expect(imported.fieldSlice.sliceHash).toBe(example.fieldSlice.sliceHash);
    expect(imported.fieldSlice.samples.length).toBe(example.fieldSlice.xCount * example.fieldSlice.zCount);
  });

  it("validates imported transparent flux against the L8.0 analytic/TMM surface result", () => {
    const scenario = defaultSimulationBuilderScenario();
    const example = createTransparentFdtdExampleBundle();
    const report = validateFdtdImportedRunAgainstScenario(scenario, { manifest: example.manifest, script: example.script }, example.imported);

    expect(report.status).toBe("pass");
    expect(report.expected.reflectance).toBeCloseTo(0.04, 12);
    expect(report.imported.reflectance).toBeCloseTo(0.04, 12);
    expect(report.residuals.energyBalance).toBeLessThan(1e-12);
  });

  it("provides an absorbing-slab fixture with Beer-Lambert transmission evidence", () => {
    const example = createAbsorbingFdtdExampleBundle();

    expect(example.manifest.targetKind).toBe("absorbing-slab");
    expect(example.validation.status).toBe("pass");
    expect(example.flux.transmittance).toBeCloseTo(Math.exp(-0.5), 12);
    expect(example.flux.absorbance).toBeCloseTo(1 - Math.exp(-0.5), 12);
    expect(example.fieldSlice.maxIntensity).toBeGreaterThan(example.flux.transmittance * 0.9);
  });

  it("rejects malformed field slice CSV before it can be treated as imported evidence", () => {
    const example = createTransparentFdtdExampleBundle();

    expect(() =>
      parseFdtdFieldSliceCsv("x_um,value\n0,1", {
        id: "bad",
        sourceScenarioHash: example.manifest.sourceScenarioHash,
        manifestHash: example.manifest.manifestHash
      })
    ).toThrow(/missing z_um/);
  });
});
