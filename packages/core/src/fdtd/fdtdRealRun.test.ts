import { describe, expect, it } from "vitest";
import {
  compareRealExternalRunToReferences,
  createRealExternalRunFixture,
  createRealExternalRunPack,
  createRealExternalRunReproducibilityReport,
  importRealExternalRunBundle,
  realExternalRunMetricsCsv,
  realExternalRunReproducibilityMarkdown,
  realExternalRunWarningsJson,
  validateRealExternalRunBundle
} from "./fdtdRealRun";
import { createTransparentFdtdExampleBundle, createTransparentFdtdExampleScenario } from "./fdtdExamples";

describe("L8.9 real external FDTD run ingestion", () => {
  it("exports a deterministic user-runnable external run pack without requiring Meep at test time", () => {
    const pack = createRealExternalRunPack(createTransparentFdtdExampleScenario());
    const paths = pack.files.map((file) => file.path);

    expect(pack.schema).toBe("emmicro.fdtd.realRunPack.v1");
    expect(paths).toEqual([
      "scene_manifest.json",
      "meep_scene.py",
      "expected_reference.json",
      "run_config.json",
      "material_receipts.json",
      "monitor_receipts.json",
      "README.md",
      "reproduce.sh",
      "reproduce.ps1",
      "postprocess.py",
      "requirements-meep.txt"
    ]);
    expect(pack.packHash).toHaveLength(16);
    expect(pack.materialHash).toHaveLength(16);
    expect(pack.monitorHash).toHaveLength(16);
    expect(pack.runConfig.requiredMonitorIds).toContain("incident-flux");
    expect(pack.runConfig.outputFiles).toContain("postprocess_log.json");
    expect(pack.files.find((file) => file.path === "README.md")?.text).toContain("The web app does not execute FDTD");
    expect(pack.files.find((file) => file.path === "postprocess.py")?.text).toContain("Replace the synthetic readers below with real Meep output readers");
  });

  it("imports a real-run-style transparent fixture and compares it to the current reference", () => {
    const fixture = createRealExternalRunFixture("transparent-slab");

    expect(fixture.bundle.schema).toBe("emmicro.fdtd.realRunBundle.v1");
    expect(fixture.validation.status).toBe("pass");
    expect(fixture.validation.materialHashStatus).toBe("match");
    expect(fixture.validation.monitorHashStatus).toBe("match");
    expect(fixture.validation.runConfigHashStatus).toBe("match");
    expect(fixture.comparison.status).toBe("pass");
    expect(fixture.comparison.referenceResidual).toBeLessThanOrEqual(0.025);
    expect(fixture.promotion.accepted).toBe(true);
  });

  it("round-trips imported receipt, flux, field slice, energy, and postprocess artifacts", () => {
    const scenario = createTransparentFdtdExampleScenario();
    const example = createTransparentFdtdExampleBundle();
    const pack = createRealExternalRunPack(scenario);
    const seed = createRealExternalRunFixture("transparent-slab").bundle;
    const imported = importRealExternalRunBundle(pack, {
      receiptJson: example.receipt,
      fluxJson: example.flux,
      fieldSliceCsv: example.fieldSliceCsv,
      fieldSlice: {
        id: "field-slice-xz",
        sourceScenarioHash: pack.sourceScenarioHash,
        manifestHash: pack.manifestHash
      },
      energyBalanceJson: JSON.stringify(seed.energyBalance),
      postprocessLogJson: JSON.stringify(seed.postprocessLog)
    });
    const validation = validateRealExternalRunBundle(scenario, pack, imported);
    const comparison = compareRealExternalRunToReferences(pack, imported, validation);

    expect(imported.receipt.receiptHash).toBe(example.receipt.receiptHash);
    expect(imported.flux.fluxHash).toBe(example.flux.fluxHash);
    expect(imported.fieldSlice.sliceHash).toBe(example.fieldSlice.sliceHash);
    expect(imported.energyBalance.energyHash).toBe(seed.energyBalance.energyHash);
    expect(validation.status).toBe("pass");
    expect(comparison.status).toBe("pass");
  });

  it("flags hash mismatches and refuses promotion without explicit warning acceptance", () => {
    const fixture = createRealExternalRunFixture("hash-mismatch");

    expect(fixture.validation.status).toBe("fail");
    expect(fixture.validation.materialHashStatus).toBe("mismatch");
    expect(fixture.validation.monitorHashStatus).toBe("mismatch");
    expect(fixture.validation.runConfigHashStatus).toBe("mismatch");
    expect(fixture.comparison.status).toBe("fail");
    expect(fixture.promotion.accepted).toBe(false);
    expect(fixture.validation.warnings.map((warning) => warning.code)).toContain("fdtd.realRun.materialHashMismatch");
  });

  it("exports reproducibility reports, metrics, and warning artifacts with strict boundary language", () => {
    const fixture = createRealExternalRunFixture("transparent-slab");
    const report = createRealExternalRunReproducibilityReport(
      fixture.pack,
      fixture.bundle,
      fixture.validation,
      fixture.comparison,
      fixture.promotion
    );
    const markdown = realExternalRunReproducibilityMarkdown(report);
    const metrics = realExternalRunMetricsCsv(fixture.comparison, fixture.validation);
    const warnings = realExternalRunWarningsJson(report);

    expect(report.schema).toBe("emmicro.fdtd.realRunReproducibilityReport.v1");
    expect(markdown).toContain("L8.9 Real External FDTD Run Reproducibility Report");
    expect(markdown).toContain("No in-browser FDTD");
    expect(markdown).toContain("arbitrary 3D Maxwell/CAD execution");
    expect(metrics).toContain("field_slice_rms_delta");
    expect(warnings).toContain("emmicro.fdtd.realRunWarnings.v1");
  });
});
