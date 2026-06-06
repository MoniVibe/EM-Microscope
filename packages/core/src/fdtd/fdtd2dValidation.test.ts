import { describe, expect, it } from "vitest";
import {
  addSimulationBuilderElement,
  createSimulationBuilderElement,
  defaultSimulationBuilderScenario
} from "../maxwell/simulationBuilder";
import {
  createFdtd2dFixtureScene,
  createFdtd2dScene,
  initializeFdtd2dState,
  l91Fdtd2dBoundary,
  runFdtd2dValidationFixture,
  simulationBuilderToFdtd2dSandbox,
  stepFdtd2dState,
  type Fdtd2dFixtureKind
} from "./fdtd2dSandbox";
import {
  analyzeFdtd2dBoundaryDiagnostics,
  createFdtd2dStabilityReport,
  createFdtd2dValidationHarnessReport,
  fdtd2dConvergenceCsv,
  fdtd2dStabilityReportJson,
  fdtd2dValidationReportJson,
  fdtd2dValidationReportMarkdown,
  runFdtd2dConvergenceDiagnostic,
  runFdtd2dReferenceChecks,
  runFdtd2dValidationSuite
} from "./fdtd2dValidation";

describe("L9.1 FDTD stability dashboard", () => {
  it("computes CFL status from dx, dy, and dt", () => {
    const scene = createFdtd2dScene();
    const state = initializeFdtd2dState(scene);
    stepFdtd2dState(state, 30);
    const report = createFdtd2dStabilityReport(state);

    expect(report.schema).toBe("emmicro.fdtd2d.stabilityReport.v1");
    expect(report.status).toBe("stable");
    expect(report.statusLabel).toBe("Stable");
    expect(report.cflFactor).toBeCloseTo(scene.grid.cfl);
    expect(report.dtSeconds).toBeGreaterThan(0);
    expect(report.dxUm).toBe(scene.grid.dxUm);
    expect(report.dyUm).toBe(scene.grid.dxUm);
  });

  it("blocks unsafe CFL settings", () => {
    const unsafe = createFdtd2dScene({ grid: { ...createFdtd2dScene().grid, cfl: 0.85 } });
    const report = createFdtd2dStabilityReport(unsafe);

    expect(report.status).toBe("unstable-blocked");
    expect(report.statusLabel).toBe("Unstable / blocked");
    expect(report.warnings.map((warning) => warning.code)).toContain("fdtd2d.cfl.blocked");
    expect(() => initializeFdtd2dState(unsafe)).toThrow("Run blocked: CFL factor exceeds stability limit.");
  });

  it("detects NaN and Infinity in field arrays and reports max field magnitudes", () => {
    const state = initializeFdtd2dState(createFdtd2dScene());
    state.ez[0] = Number.NaN;
    state.hx[1] = Number.POSITIVE_INFINITY;
    state.hy[2] = -3;
    const report = createFdtd2dStabilityReport(state);

    expect(report.status).toBe("diverged");
    expect(report.hasNonFinite).toBe(true);
    expect(report.maxAbsHy).toBe(3);
  });

  it("reports finite energy traces and boundary/proximity warnings", () => {
    const scene = createFdtd2dScene({
      grid: { ...createFdtd2dScene().grid, nx: 80, ny: 80, boundaryCells: 10 },
      sources: [{ ...createFdtd2dScene().sources[0]!, x: 11, y: 40 }],
      objects: [{ id: "near-wall", label: "Near wall", kind: "pec-block", x: 9, y: 20, width: 4, height: 20 }],
      monitors: [{ id: "near-monitor", label: "Near monitor", kind: "point", x: 8, y: 8 }]
    });
    const state = initializeFdtd2dState(scene);
    stepFdtd2dState(state, 20);
    const report = createFdtd2dStabilityReport(state);
    const boundary = analyzeFdtd2dBoundaryDiagnostics(scene);

    expect(report.finalEnergy).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(report.finalEnergy)).toBe(true);
    expect(report.energyTrend).toMatch(/flat|rising|falling|not-run/);
    expect(boundary.warnings.map((warning) => warning.code)).toEqual(expect.arrayContaining([
      "fdtd2d.boundary.sourceClose",
      "fdtd2d.boundary.objectInside",
      "fdtd2d.boundary.monitorInside"
    ]));
  });
});

describe("L9.1 FDTD validation fixtures", () => {
  it("runs every validation fixture with finite traces", () => {
    const kinds: Fdtd2dFixtureKind[] = ["empty-space", "pec-wall", "dielectric-interface", "absorbing-slab", "point-source-symmetry", "slit-diagnostic"];

    for (const kind of kinds) {
      const report = runFdtd2dValidationFixture(kind, 70);
      expect(report.status).toMatch(/pass|warning/);
      expect(report.energyFinite).toBe(true);
      expect(Number.isFinite(report.maxAbsEz)).toBe(true);
    }
  });

  it("builds a fixture/reference validation suite", () => {
    const suite = runFdtd2dValidationSuite(70);

    expect(suite.schema).toBe("emmicro.fdtd2d.validationSuite.v1");
    expect(suite.fixtureReports).toHaveLength(6);
    expect(suite.referenceChecks.map((check) => check.id)).toEqual(expect.arrayContaining([
      "dielectric-fresnel-trend",
      "absorber-thickness-trend",
      "absorber-beer-lambert-style",
      "point-source-radial-symmetry",
      "slit-qualitative-warning"
    ]));
  });
});

describe("L9.1 FDTD reference checks", () => {
  it("compares dielectric interface response against Fresnel trend", () => {
    const checks = runFdtd2dReferenceChecks(70);
    const fresnel = checks.find((check) => check.id === "dielectric-fresnel-trend")!;

    expect(fresnel.reference).toBeCloseTo(0.04);
    expect(Number.isFinite(fresnel.measured)).toBe(true);
    expect(Number.isFinite(fresnel.residual)).toBe(true);
  });

  it("reports lower transmission for thicker absorber with Beer-Lambert-style reference", () => {
    const checks = runFdtd2dReferenceChecks(70);
    const trend = checks.find((check) => check.id === "absorber-thickness-trend")!;
    const beer = checks.find((check) => check.id === "absorber-beer-lambert-style")!;

    expect(trend.residual).toBeGreaterThan(0);
    expect(beer.reference).toBeGreaterThanOrEqual(0);
    expect(beer.reference).toBeLessThanOrEqual(1);
  });

  it("computes point-source radial symmetry score and keeps slit qualitative", () => {
    const checks = runFdtd2dReferenceChecks(70);
    const symmetry = checks.find((check) => check.id === "point-source-radial-symmetry")!;
    const slit = checks.find((check) => check.id === "slit-qualitative-warning")!;

    expect(symmetry.measured).toBeGreaterThanOrEqual(0);
    expect(symmetry.measured).toBeLessThanOrEqual(1);
    expect(slit.status).toBe("warning");
    expect(slit.note).toContain("qualitative");
  });
});

describe("L9.1 FDTD convergence diagnostics", () => {
  it("runs bounded grid convergence levels and exports residual-vs-grid CSV", () => {
    const report = runFdtd2dConvergenceDiagnostic({ fixtureKind: "empty-space", levels: [64, 96, 128], steps: 50 });
    const csv = fdtd2dConvergenceCsv(report);

    expect(report.schema).toBe("emmicro.fdtd2d.convergenceReport.v1");
    expect(report.rows).toHaveLength(3);
    expect(report.rows[0]?.residualFromPrevious).toBe(0);
    expect(report.rows.slice(1).every((row) => Number.isFinite(row.residualFromPrevious))).toBe(true);
    expect(csv).toContain("residual_from_previous");
    expect(csv).toContain("field_snapshot_delta");
  });

  it("exports validation and stability reports", () => {
    const scene = createFdtd2dFixtureScene("dielectric-interface");
    const state = initializeFdtd2dState(scene);
    stepFdtd2dState(state, 40);
    const convergence = runFdtd2dConvergenceDiagnostic({ fixtureKind: "empty-space", levels: [64, 96], steps: 30 });
    const report = createFdtd2dValidationHarnessReport({ scene, state, convergence });
    const markdown = fdtd2dValidationReportMarkdown(report);

    expect(markdown).toContain("L9.1 2D FDTD Validation + Stability Harness Report");
    expect(markdown).toContain("CFL factor");
    expect(markdown).toContain("Reference Checks");
    expect(fdtd2dValidationReportJson(report)).toContain("emmicro.fdtd2d.validationHarnessReport.v1");
    expect(fdtd2dStabilityReportJson(report.stability)).toContain("emmicro.fdtd2d.stabilityReport.v1");
  });
});

describe("L9.1 boundaries and regressions", () => {
  it("does not claim production FDTD, 3D Maxwell, WebGPU, FEM/BEM/RCWA, or external Meep replacement", () => {
    const text = l91Fdtd2dBoundary.join(" ");

    expect(text).toContain("not full 3D Maxwell");
    expect(text).toContain("not production FDTD");
    expect(text).toContain("WebGPU acceleration is not implemented");
    expect(text).toContain("The L8.9 external Meep/FDTD path remains");
    expect(text).toContain("No FEM/BEM/RCWA execution");
    expect(text).not.toMatch(/production FDTD is available|3D Maxwell is implemented|WebGPU acceleration is implemented|replacement for external Meep/i);
  });

  it("keeps Simulation Builder to sandbox handoff working", () => {
    let scenario = defaultSimulationBuilderScenario();
    scenario = addSimulationBuilderElement(scenario, createSimulationBuilderElement("finite-transparent-block", 8, "Transparent block"));
    const handoff = simulationBuilderToFdtd2dSandbox(scenario);

    expect(handoff.scene.label).toContain("L9.1 2D sandbox slice");
    expect(handoff.mappedObjects.map((item) => item.kind)).toContain("dielectric-rectangle");
  });
});
