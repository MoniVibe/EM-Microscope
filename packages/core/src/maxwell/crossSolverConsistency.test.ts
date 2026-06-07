import { describe, expect, it } from "vitest";
import {
  consistencyAssumptionsCsv,
  consistencyMetricsCsv,
  createCrossSolverConsistencyBench,
  crossSolverConsistencyReportJson,
  crossSolverConsistencyReportMarkdown,
  crossSolverStatusForResidual,
  solverPairResidualsCsv
} from "./crossSolverConsistency";
import { createSolverEvidenceTask } from "./solverEvidence";
import { createSolverRouteExampleScene, routeSolverScene } from "./solverRouter";

function caseById(bench: ReturnType<typeof createCrossSolverConsistencyBench>, id: string) {
  const item = bench.cases.find((entry) => entry.id === id);
  if (!item) throw new Error(`Missing consistency case ${id}`);
  return item;
}

function taskForRcwa() {
  const scene = createSolverRouteExampleScene("rcwa");
  return createSolverEvidenceTask(scene, routeSolverScene(scene));
}

describe("L9.6 cross-solver consistency bench", () => {
  it("creates the required deterministic overlap cases and status categories", () => {
    const bench = createCrossSolverConsistencyBench();
    expect(bench.label).toBe("L9.6 Cross-Solver Consistency Bench");
    expect(bench.cases.map((item) => item.id)).toEqual([
      "tmm-rcwa-no-pattern",
      "fdtd-cpu-webgpu-parity",
      "scalar-fdtd-aperture",
      "tmm-external-fdtd-slab",
      "absorber-consistency",
      "rcwa-external-grating-fixture",
      "tmm-scalar-lens-not-comparable"
    ]);
    expect(bench.summary.total).toBe(7);
    expect(bench.summary.pass).toBeGreaterThanOrEqual(1);
    expect(bench.summary.warning).toBeGreaterThanOrEqual(2);
    expect(bench.summary.needsExternalEvidence).toBe(1);
    expect(bench.summary.notComparable).toBe(1);
    expect(bench.reportHash).toMatch(/^[0-9a-f]+$/);
  });

  it("passes the TMM vs RCWA no-pattern uniform-layer bridge", () => {
    const item = caseById(createCrossSolverConsistencyBench(), "tmm-rcwa-no-pattern");
    expect(item.label).toBe("TMM vs RCWA no-pattern consistency");
    expect(item.comparedSolvers).toEqual(["planar-tmm", "rcwa-1d-preview"]);
    expect(item.status).toBe("PASS");
    expect(item.metrics.map((metric) => metric.id)).toEqual(["reflectance", "transmittance", "absorbance", "energy-balance"]);
    expect(item.metrics.every((metric) => metric.status === "PASS")).toBe(true);
    expect(item.requiredEvidence).toContain("rcwa_tmm_consistency.csv");
  });

  it("reports CPU FDTD vs WebGPU parity with fallback warning evidence", () => {
    const item = caseById(createCrossSolverConsistencyBench(), "fdtd-cpu-webgpu-parity");
    expect(item.label).toBe("CPU FDTD vs WebGPU FDTD parity");
    expect(item.comparedSolvers).toEqual(["fdtd-2d-cpu", "fdtd-2d-webgpu"]);
    expect(item.status).toBe("WARNING");
    expect(item.metrics.map((metric) => metric.id)).toEqual(["rms-ez", "rms-hx", "rms-hy", "max-field", "monitor-trace", "energy-delta"]);
    expect(item.warnings.map((warning) => warning.code)).toContain("l96.fdtd.webgpuFallback");
    expect(item.sourceHashes.parityHash).toMatch(/^[0-9a-f]+$/);
  });

  it("keeps scalar aperture vs 2D FDTD as a warning-limited diagnostic", () => {
    const item = caseById(createCrossSolverConsistencyBench(), "scalar-fdtd-aperture");
    expect(item.label).toBe("Scalar aperture vs 2D FDTD diagnostic");
    expect(item.status).toBe("WARNING");
    expect(item.warnings.map((warning) => warning.code)).toContain("l96.scalarFdtd.assumptionMismatch");
    expect(item.assumptions.join(" ")).toContain("qualitative");
    expect(item.metrics.map((metric) => metric.id)).toContain("open-fraction-transmission");
  });

  it("compares TMM/Fresnel against imported external FDTD slab evidence with hashes", () => {
    const item = caseById(createCrossSolverConsistencyBench(), "tmm-external-fdtd-slab");
    expect(item.label).toBe("TMM/Fresnel vs external FDTD slab");
    expect(item.comparedSolvers).toEqual(["planar-tmm", "external-fdtd-meep"]);
    expect(item.status).toBe("PASS");
    expect(item.requiredEvidence).toContain("run_receipt.json");
    expect(item.sourceHashes.packHash).toMatch(/^[0-9a-f]+$/);
    expect(item.sourceHashes.bundleHash).toMatch(/^[0-9a-f]+$/);
    expect(item.sourceHashes.comparisonHash).toMatch(/^[0-9a-f]+$/);
  });

  it("keeps absorber comparisons as a warning because the model domains differ", () => {
    const item = caseById(createCrossSolverConsistencyBench(), "absorber-consistency");
    expect(item.label).toBe("Absorber consistency");
    expect(item.status).toBe("WARNING");
    expect(item.comparedSolvers).toEqual(["planar-tmm", "external-fdtd-meep", "fdtd-2d-cpu"]);
    expect(item.warnings.map((warning) => warning.code)).toContain("l96.absorber.modelMismatch");
    expect(item.metrics.map((metric) => metric.id)).toContain("fdtd2d-transmission-trend");
  });

  it("marks optional missing external grating evidence and non-overlap guardrails explicitly", () => {
    const bench = createCrossSolverConsistencyBench();
    const grating = caseById(bench, "rcwa-external-grating-fixture");
    const notComparable = caseById(bench, "tmm-scalar-lens-not-comparable");
    expect(grating.status).toBe("NEEDS EXTERNAL EVIDENCE");
    expect(grating.label).toBe("RCWA vs external FDTD grating fixture");
    expect(grating.requiredEvidence.join(" ")).toContain("external grating");
    expect(notComparable.status).toBe("NOT COMPARABLE");
    expect(notComparable.label).toBe("TMM vs scalar lens guardrail");
    expect(notComparable.statusReason).toContain("do not expose a comparable shared output");
  });

  it("exports Markdown, JSON, and CSV reports with case hashes and assumptions", () => {
    const bench = createCrossSolverConsistencyBench();
    expect(crossSolverConsistencyReportMarkdown(bench)).toContain("# L9.6 Cross-Solver Consistency Bench");
    expect(JSON.parse(crossSolverConsistencyReportJson(bench)).reportHash).toBe(bench.reportHash);
    expect(consistencyMetricsCsv(bench)).toContain("case_id,case_status,metric_id");
    expect(consistencyMetricsCsv(bench)).toContain("tmm-rcwa-no-pattern");
    expect(solverPairResidualsCsv(bench)).toContain("case_hash,evidence_task_hashes");
    expect(consistencyAssumptionsCsv(bench)).toContain("Scalar ideal aperture and finite 2D FDTD screen assumptions differ");
  });

  it("preserves linked L9.5 evidence task hashes without changing the route hash", () => {
    const linkedTask = taskForRcwa();
    const bench = createCrossSolverConsistencyBench(linkedTask);
    for (const item of bench.cases) {
      expect(item.evidenceTaskHashes).toContain(linkedTask.taskHash);
    }
    expect(caseById(bench, "tmm-rcwa-no-pattern").sourceHashes.rcwaResultHash).toMatch(/^[0-9a-f]+$/);
  });

  it("keeps boundary language away from correctness and certification claims", () => {
    const markdown = crossSolverConsistencyReportMarkdown(createCrossSolverConsistencyBench());
    expect(markdown).toContain("does not add a solver or new optical physics");
    expect(markdown).toContain("does not prove universal solver correctness");
    expect(markdown).toContain("not certified validation");
    expect(markdown).not.toMatch(/automatic correctness proof is complete|certified solver selection is complete|production FDTD certified/i);
  });
});

describe("L9.6 residual status helper", () => {
  it("classifies residuals into pass, warning, fail, and not comparable", () => {
    expect(crossSolverStatusForResidual(0.01, 0.02)).toBe("PASS");
    expect(crossSolverStatusForResidual(0.05, 0.02)).toBe("WARNING");
    expect(crossSolverStatusForResidual(0.2, 0.02)).toBe("FAIL");
    expect(crossSolverStatusForResidual(Number.NaN, 0.02)).toBe("NOT COMPARABLE");
    expect(crossSolverStatusForResidual(0.01, 0)).toBe("NOT COMPARABLE");
  });
});
