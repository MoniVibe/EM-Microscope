import { describe, expect, it } from "vitest";
import {
  addSimulationBuilderElement,
  createSimulationBuilderElement,
  defaultSimulationBuilderScenario,
  runSimulationBuilderScenario
} from "../maxwell/simulationBuilder";
import {
  createAbsorbingFdtdExampleBundle,
  createTransparentFdtdExampleBundle
} from "./fdtdExamples";
import {
  createFdtdBenchmarkExampleBundle,
  createFdtdBenchmarkPack,
  createFdtdBenchmarkScenario,
  fdtdBenchmarkKinds,
  fdtdBenchmarkManifestJson,
  fdtdBenchmarkReportJson,
  fdtdBenchmarkReportMarkdown,
  fdtdConvergenceMetricsCsv,
  fdtdConvergenceSummaryJson,
  fdtdFluxSummariesJson,
  fdtdRunTableCsv,
  fdtdSweepPlanJson,
  importFdtdConvergenceBundleArtifacts,
  l82FdtdBenchmarkBoundary
} from "./fdtdBenchmarkSuite";
import { exportFdtdBundleFromSimulationBuilder, validateFdtdExportReadiness } from "./fdtdSceneExport";

describe("L8.2 FDTD benchmark suite generation", () => {
  it("generates bounded benchmark plans for empty space, transparent interface/slab, absorber, and mirror", () => {
    for (const kind of fdtdBenchmarkKinds) {
      const pack = createFdtdBenchmarkPack({ benchmarkKind: kind });

      expect(pack.benchmarkManifest.benchmarkKind).toBe(kind);
      expect(pack.sweepPlan.runCount).toBe(36);
      expect(pack.sweepPlan.settings.resolutionPointsPerWavelength).toEqual([10, 15, 20, 30]);
      expect(pack.sweepPlan.settings.pmlThicknessUm).toEqual([0.5, 1, 1.5]);
      expect(pack.sweepPlan.settings.paddingWavelengths).toEqual([1, 2, 3]);
      expect(pack.scripts).toHaveLength(pack.sweepPlan.runCount);
      expect(fdtdBenchmarkManifestJson(pack.benchmarkManifest)).toContain("emmicro.fdtd.benchmarkManifest.v1");
      expect(fdtdSweepPlanJson(pack.sweepPlan)).toContain("emmicro.fdtd.sweepPlan.v1");
      expect(pack.readme).toContain("Run these Meep/FDTD jobs outside the browser");
    }
  });

  it("hashes benchmark manifests and sweep plans deterministically", () => {
    const a = createFdtdBenchmarkPack({ benchmarkKind: "transparent-interface" });
    const b = createFdtdBenchmarkPack({ benchmarkKind: "transparent-interface" });

    expect(a.benchmarkManifest.benchmarkHash).toBe(b.benchmarkManifest.benchmarkHash);
    expect(a.sweepPlan.sweepHash).toBe(b.sweepPlan.sweepHash);
    expect(a.packHash).toBe(b.packHash);
    expect(a.scripts.map((script) => script.export.scriptHash)).toEqual(b.scripts.map((script) => script.export.scriptHash));
  });

  it("preserves grid, PML, padding, source, material, and monitor settings in the exported pack", () => {
    const pack = createFdtdBenchmarkPack({ benchmarkKind: "absorbing-slab" });
    const first = pack.sweepPlan.runs[0]!;

    expect(pack.benchmarkManifest.baseManifest.source.kind).toBe("plane-wave");
    expect(pack.benchmarkManifest.baseManifest.targetKind).toBe("absorbing-slab");
    expect(pack.benchmarkManifest.baseManifest.materials.map((material) => material.id)).toContain("target-absorber");
    expect(pack.benchmarkManifest.baseManifest.monitors.map((monitor) => monitor.id)).toContain("transmitted-flux");
    expect(first.resolutionPointsPerWavelength).toBe(10);
    expect(first.pmlThicknessUm).toBe(0.5);
    expect(first.paddingWavelengths).toBe(1);
    expect(first.monitorOffsetWavelengths).toBe(1.5);
    expect(pack.scripts[0]!.export.python).toContain("L8.2 benchmark run");
  });
});

describe("L8.2 FDTD convergence import and diagnostics", () => {
  it("imports convergence_summary.json and computes residual trends against the reference", () => {
    const example = createFdtdBenchmarkExampleBundle("transparent-interface");
    const imported = importFdtdConvergenceBundleArtifacts({
      convergenceSummaryJson: fdtdConvergenceSummaryJson(example.convergenceSummary),
      expectedPack: example.pack
    });

    expect(imported.schema).toBe("emmicro.fdtd.convergenceSummary.v1");
    expect(imported.reference.referenceModel).toBe("fresnel-normal-incidence");
    expect(imported.runs.length).toBe(example.pack.sweepPlan.runCount);
    expect(imported.trend.rows.map((row) => row.resolutionPointsPerWavelength)).toEqual([10, 15, 20, 30]);
    expect(imported.trend.finalReferenceResidual).toBeLessThan(imported.trend.rows[0]!.meanReferenceResidual);
    expect(imported.status).toMatch(/pass|warning/);
  });

  it("imports per-run flux summaries and recomputes R/T/A residuals and energy-balance error", () => {
    const example = createFdtdBenchmarkExampleBundle("empty-space");
    const imported = importFdtdConvergenceBundleArtifacts({
      convergenceSummaryJson: fdtdConvergenceSummaryJson(example.convergenceSummary),
      fluxSummariesJson: fdtdFluxSummariesJson(example.fluxSummaries),
      expectedPack: example.pack
    });
    const first = imported.runs[0]!;

    expect(first.expected.reflectance).toBe(0);
    expect(first.expected.transmittance).toBe(1);
    expect(first.residuals.referenceResidual).toBeGreaterThan(0);
    expect(first.residuals.energyBalance).toBeGreaterThanOrEqual(0);
    expect(imported.trend.finalEnergyBalanceError).toBeLessThan(0.01);
  });

  it("warns when PML sensitivity exceeds threshold", () => {
    const example = createFdtdBenchmarkExampleBundle("absorbing-slab", { pmlSensitive: true });

    expect(example.convergenceSummary.pmlSensitivity.status).toBe("warning");
    expect(example.convergenceSummary.warnings.map((warning) => warning.code)).toContain("fdtd.convergence.highPmlSensitivity");
    expect(example.convergenceSummary.reference.referenceModel).toBe("beer-lambert");
  });

  it("warns when convergence is non-monotonic or unstable", () => {
    const example = createFdtdBenchmarkExampleBundle("mirror", { unstable: true });

    expect(["non-monotonic", "unstable"]).toContain(example.convergenceSummary.trend.status);
    expect(example.convergenceSummary.warnings.map((warning) => warning.code).join(" ")).toMatch(/fdtd\.convergence\.(nonMonotonicTrend|unstableTrend)/);
  });

  it("flags scene/grid hash mismatches during import", () => {
    const example = createFdtdBenchmarkExampleBundle("transparent-interface");
    const otherPack = createFdtdBenchmarkPack({ benchmarkKind: "mirror" });
    const imported = importFdtdConvergenceBundleArtifacts({
      convergenceSummaryJson: fdtdConvergenceSummaryJson(example.convergenceSummary),
      expectedPack: otherPack
    });

    expect(imported.status).toBe("fail");
    expect(imported.warnings.map((warning) => warning.code)).toContain("fdtd.convergence.benchmarkHashMismatch");
    expect(imported.warnings.map((warning) => warning.code)).toContain("fdtd.convergence.sweepHashMismatch");
  });

  it("exports benchmark_report.md/json/csv and run tables", () => {
    const example = createFdtdBenchmarkExampleBundle("transparent-slab");
    const markdown = fdtdBenchmarkReportMarkdown(example.convergenceSummary);
    const json = fdtdBenchmarkReportJson(example.convergenceSummary);
    const metricsCsv = fdtdConvergenceMetricsCsv(example.convergenceSummary);
    const runCsv = fdtdRunTableCsv(example.convergenceSummary);

    expect(markdown).toContain("Convergence Trend");
    expect(markdown).toContain("No arbitrary 3D CAD geometry");
    expect(json).toContain("emmicro.fdtd.convergenceSummary.v1");
    expect(metricsCsv).toContain("mean_reference_residual");
    expect(runCsv).toContain("reference_residual");
  });
});

describe("L8.2 FDTD verification boundaries and regressions", () => {
  it("does not claim in-browser FDTD, arbitrary 3D Maxwell, or FEM/BEM/RCWA execution", () => {
    const text = l82FdtdBenchmarkBoundary.join(" ");

    expect(text).toContain("External FDTD benchmark/convergence support only");
    expect(text).toContain("does not execute production FDTD in the browser");
    expect(text).toContain("No arbitrary 3D CAD geometry");
    expect(text).toContain("FEM/BEM/RCWA");
    expect(text).not.toMatch(/browser FDTD execution is available|general arbitrary 3D Maxwell solver|production solver validation is certified/i);
  });

  it("blocks unsupported curved material lens geometry", () => {
    const scenario = addSimulationBuilderElement(
      defaultSimulationBuilderScenario(),
      createSimulationBuilderElement("curved-material-lens", 24, "Curved lens smoke")
    );
    const readiness = validateFdtdExportReadiness(scenario);

    expect(readiness.status).toBe("blocked");
    expect(readiness.unsupported[0]?.reason).toContain("curved material lens solving is scaffold-only");
  });

  it("keeps L8.1 single-run field import fixtures working", () => {
    const transparent = createTransparentFdtdExampleBundle();
    const absorbing = createAbsorbingFdtdExampleBundle();

    expect(transparent.validation.status).toBe("pass");
    expect(absorbing.validation.status).toBe("pass");
  });

  it("keeps L8.0 Simulation Builder material validation working", () => {
    const result = runSimulationBuilderScenario(defaultSimulationBuilderScenario());

    expect(result.validation.status).toBe("pass");
    expect(result.validation.expected.reflectance).toBeCloseTo(0.04, 12);
  });

  it("keeps ExternalFdtdBackend external/export-import only", () => {
    const scenario = createFdtdBenchmarkScenario("transparent-interface");
    const bundle = exportFdtdBundleFromSimulationBuilder(scenario);

    expect(bundle.manifest.limitations.join(" ")).toContain("External FDTD export/import only");
    expect(bundle.manifest.limitations.join(" ")).toContain("does not execute production FDTD in the browser");
  });
});
