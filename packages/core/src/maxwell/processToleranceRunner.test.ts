import { describe, expect, it } from "vitest";
import {
  createExampleToleranceFdtdSweepSummary,
  createToleranceFdtdSweepManifest,
  createToleranceRunCases,
  defaultToleranceThresholds,
  defaultToleranceVariationSpecs,
  parseToleranceFdtdSweepSummary,
  runToleranceAnalysis,
  toleranceFailingCasesCsv,
  toleranceFdtdSweepSummaryJson,
  toleranceReportJson,
  toleranceReportMarkdown,
  toleranceRunTableCsv,
  toleranceSensitivityCsv,
  toleranceVariationHash,
  validateToleranceFdtdSweepSummary,
  validateToleranceVariationSpecs,
  type ToleranceVariationSpec
} from "./processToleranceRunner";
import { defaultOpticalBenchScenario } from "./multiElementBench";

describe("L8.6 process tolerance variation model", () => {
  it("adds variation specs to source and optical bench elements", () => {
    const scenario = defaultOpticalBenchScenario();
    const specs = defaultToleranceVariationSpecs(scenario);

    expect(specs.some((spec) => spec.targetKind === "source" && spec.property === "wavelengthNm")).toBe(true);
    expect(specs.some((spec) => spec.targetKind === "element" && spec.property === "xUm")).toBe(true);
    expect(specs.some((spec) => spec.targetKind === "element" && spec.property === "zMm")).toBe(true);
    expect(specs.some((spec) => spec.targetKind === "element" && spec.property === "thicknessUm" && spec.application === "relative")).toBe(true);
    expect(validateToleranceVariationSpecs(scenario, specs).valid).toBe(true);
  });

  it("validates unsupported properties and records linked-drift metadata as warnings", () => {
    const scenario = defaultOpticalBenchScenario();
    const specs: ToleranceVariationSpec[] = [
      {
        ...defaultToleranceVariationSpecs(scenario)[0]!,
        id: "bad-target",
        targetKind: "element",
        targetId: "missing",
        property: "sourceIntensityScale",
        groupId: "thermal-drift"
      }
    ];
    const validation = validateToleranceVariationSpecs(scenario, specs);

    expect(validation.valid).toBe(false);
    expect(validation.errors.join("\n")).toContain("not supported");
  });

  it("supports one-at-a-time perturbations and deterministic grid perturbations", () => {
    const scenario = defaultOpticalBenchScenario();
    const specs = defaultToleranceVariationSpecs(scenario).slice(0, 2);
    const oat = createToleranceRunCases(scenario, { variations: specs, mode: "one-at-a-time" });
    const grid = createToleranceRunCases(scenario, { variations: specs, mode: "deterministic-grid" });

    expect(oat).toHaveLength(4);
    expect(grid).toHaveLength(9);
    expect(oat[0]?.perturbations[0]?.appliedValue).not.toBe(oat[0]?.perturbations[0]?.nominal);
    expect(grid.some((run) => run.perturbations.every((perturbation) => perturbation.level === 0))).toBe(true);
  });

  it("supports seeded sample generation deterministically", () => {
    const scenario = defaultOpticalBenchScenario();
    const specs = defaultToleranceVariationSpecs(scenario);
    const first = createToleranceRunCases(scenario, { variations: specs, mode: "seeded-samples", seededSamples: 5, seed: 123 });
    const second = createToleranceRunCases(scenario, { variations: specs, mode: "seeded-samples", seededSamples: 5, seed: 123 });

    expect(first.map((run) => run.perturbations.map((perturbation) => perturbation.level))).toEqual(second.map((run) => run.perturbations.map((perturbation) => perturbation.level)));
    expect(first).toHaveLength(5);
  });

  it("hashes variation specs deterministically", () => {
    const specs = defaultToleranceVariationSpecs();
    const thresholds = defaultToleranceThresholds();

    expect(toleranceVariationHash(specs, thresholds)).toBe(toleranceVariationHash([...specs].reverse(), thresholds));
  });
});

describe("L8.6 tolerance runner metrics", () => {
  it("computes nominal and perturbed metrics, sensitivity ranking, worst case, and pass rate", () => {
    const report = runToleranceAnalysis(defaultOpticalBenchScenario(), {
      variations: defaultToleranceVariationSpecs(),
      thresholds: defaultToleranceThresholds(),
      mode: "one-at-a-time"
    });

    expect(report.nominalRun.metrics.peakIntensity).toBeGreaterThan(0);
    expect(report.runs.length).toBeGreaterThan(0);
    expect(report.sensitivity.length).toBeGreaterThan(0);
    expect(report.worstCase.id).toBeTruthy();
    expect(report.passRate).toBeGreaterThanOrEqual(0);
    expect(report.passRate).toBeLessThanOrEqual(1);
  });

  it("computes pass/fail threshold specs and exports failing cases", () => {
    const thresholds = [{ ...defaultToleranceThresholds()[0]!, pass: 1000, warn: 2000 }];
    const report = runToleranceAnalysis(defaultOpticalBenchScenario(), {
      variations: defaultToleranceVariationSpecs().slice(0, 1),
      thresholds,
      mode: "one-at-a-time"
    });

    expect(report.failingCases.length).toBeGreaterThan(0);
    expect(toleranceFailingCasesCsv(report)).toContain("run_id,label,status");
  });

  it("exports JSON, markdown, run-table CSV, and sensitivity CSV", () => {
    const report = runToleranceAnalysis(defaultOpticalBenchScenario(), {
      variations: defaultToleranceVariationSpecs(),
      mode: "deterministic-grid",
      gridMaxRuns: 12
    });

    expect(JSON.parse(toleranceReportJson(report)).schema).toBe("emmicro.l86.toleranceReport.v1");
    expect(toleranceReportMarkdown(report)).toContain("not certified optical tolerancing");
    expect(toleranceRunTableCsv(report)).toContain("centroid_shift_abs_um");
    expect(toleranceSensitivityCsv(report)).toContain("slope_per_unit");
  });
});

describe("L8.6 multi-element tolerance workflow", () => {
  it("runs aperture decenter, lens z shift, block thickness, and source wavelength variations while preserving IDs and routes", () => {
    const scenario = defaultOpticalBenchScenario();
    const report = runToleranceAnalysis(scenario, {
      variations: defaultToleranceVariationSpecs(scenario),
      mode: "one-at-a-time"
    });

    expect(report.variations.map((spec) => spec.property)).toEqual(expect.arrayContaining(["xUm", "zMm", "thicknessUm", "wavelengthNm"]));
    expect(report.runs.every((run) => run.solverRoutes.some((route) => route.id === scenario.elements[0]?.id))).toBe(true);
    expect(report.runs.some((run) => run.solverRoutes.some((route) => route.solverRoute === "external-fdtd"))).toBe(true);
  });
});

describe("L8.6 external FDTD tolerance sweep", () => {
  it("exports a finite-geometry variation sweep manifest and imports bundled sweep summaries", () => {
    const scenario = defaultOpticalBenchScenario();
    const manifest = createToleranceFdtdSweepManifest(scenario, {
      variations: defaultToleranceVariationSpecs(scenario).slice(0, 2),
      mode: "deterministic-grid",
      gridMaxRuns: 6
    });
    const summary = createExampleToleranceFdtdSweepSummary(manifest);
    const parsed = parseToleranceFdtdSweepSummary(toleranceFdtdSweepSummaryJson(summary));

    expect(manifest.schema).toBe("emmicro.l86.fdtdVariationSweepManifest.v1");
    expect(manifest.cases.length).toBeGreaterThan(0);
    expect(parsed.summaryHash).toBe(summary.summaryHash);
    expect(validateToleranceFdtdSweepSummary(manifest, parsed)).toHaveLength(0);
  });

  it("warns on scene and variation hash mismatches", () => {
    const manifest = createToleranceFdtdSweepManifest(defaultOpticalBenchScenario(), {
      variations: defaultToleranceVariationSpecs().slice(0, 1),
      mode: "deterministic-grid"
    });
    const summary = {
      ...createExampleToleranceFdtdSweepSummary(manifest),
      sceneHash: "mismatch",
      variationHash: "mismatch"
    };

    expect(validateToleranceFdtdSweepSummary(manifest, summary).map((warning) => warning.code)).toEqual(expect.arrayContaining(["tolerance.fdtd.sceneHashMismatch", "tolerance.fdtd.variationHashMismatch"]));
  });
});

describe("L8.6 boundaries and regressions", () => {
  it("does not claim certified tolerancing, auto redesign, browser FDTD, or arbitrary 3D Maxwell/FEM/BEM/RCWA", () => {
    const report = toleranceReportMarkdown(runToleranceAnalysis(defaultOpticalBenchScenario(), { variations: defaultToleranceVariationSpecs() }));

    expect(report).toContain("not certified optical tolerancing");
    expect(report).toContain("No automatic redesign");
    expect(report).toContain("production FDTD execution stays outside the browser");
    expect(report).toContain("arbitrary 3D Maxwell");
    expect(report).toContain("FEM/BEM/RCWA");
  });
});
