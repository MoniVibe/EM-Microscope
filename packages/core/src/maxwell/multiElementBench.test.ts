import { describe, expect, it } from "vitest";
import { createApertureValidationExampleBundle } from "../fdtd/fdtdApertureValidation";
import { createOpticalBenchBundle } from "../fdtd/fdtdMultiElementBench";
import { createSurfaceGeometryExampleBundle } from "../fdtd/fdtdSurfaceGeometry";
import { createFdtdBenchmarkExampleBundle } from "../fdtd/fdtdBenchmarkSuite";
import {
  addOpticalBenchElement,
  createOpticalBenchExternalEvidence,
  createOpticalBenchScene,
  createOpticalBenchSolverPlan,
  createOpticalBenchValidationReport,
  defaultOpticalBenchScenario,
  deleteOpticalBenchElement,
  duplicateOpticalBenchElement,
  opticalBenchCrossSection,
  opticalBenchMetricsCsv,
  opticalBenchMonitorStackCsv,
  opticalBenchSceneJson,
  opticalBenchSolverPlanJson,
  opticalBenchValidationReportJson,
  opticalBenchValidationReportMarkdown,
  opticalBenchWarnings,
  runOpticalBenchScalarPreview,
  setOpticalBenchElementEnabled,
  updateOpticalBenchElementZ,
  validateOpticalBenchExternalEvidence
} from "./multiElementBench";

describe("multi-element optical bench scene graph", () => {
  it("adds multiple optical elements and sorts them by z position", () => {
    const scenario = addOpticalBenchElement(
      addOpticalBenchElement(defaultOpticalBenchScenario(), "finite-reflective-plate", { zMm: 18, label: "Reflective plate" }),
      "tilted-interface-wedge",
      { zMm: 12, label: "Tilted wedge" }
    );
    const scene = createOpticalBenchScene(scenario);

    expect(scene.elements.map((element) => element.label)).toContain("Reflective plate");
    expect(scene.elements.map((element) => element.label)).toContain("Tilted wedge");
    expect(scene.elements.map((element) => element.zMm)).toEqual([...scene.elements.map((element) => element.zMm)].sort((a, b) => a - b));
  });

  it("supports duplicate, delete, enable-disable, and z-position updates", () => {
    const base = defaultOpticalBenchScenario();
    const first = base.elements[0]!;
    const duplicated = duplicateOpticalBenchElement(base, first.id);
    const copy = duplicated.elements.find((element) => element.label.includes("copy"));
    expect(copy).toBeDefined();

    const moved = updateOpticalBenchElementZ(duplicated, copy!.id, 14.5);
    expect(moved.elements.find((element) => element.id === copy!.id)?.zMm).toBe(14.5);

    const disabled = setOpticalBenchElementEnabled(moved, copy!.id, false);
    const disabledScene = createOpticalBenchScene(disabled);
    expect(disabledScene.elements.find((element) => element.id === copy!.id)?.enabled).toBe(false);

    const deleted = deleteOpticalBenchElement(disabled, copy!.id);
    expect(deleted.elements.some((element) => element.id === copy!.id)).toBe(false);
  });

  it("detects overlapping elements and monitor/material warnings", () => {
    const scenario = {
      ...defaultOpticalBenchScenario(),
      elements: [
        { ...defaultOpticalBenchScenario().elements[0]!, zMm: 10, thicknessUm: 2000 },
        { ...defaultOpticalBenchScenario().elements[1]!, zMm: 10.5, thicknessUm: 2000 }
      ]
    };
    const warnings = opticalBenchWarnings(createOpticalBenchScene(scenario));

    expect(warnings.map((warning) => warning.code)).toContain("opticalBench.element.overlap");
  });

  it("exports deterministic scene JSON", () => {
    const sceneA = createOpticalBenchScene(defaultOpticalBenchScenario());
    const sceneB = createOpticalBenchScene(defaultOpticalBenchScenario());

    expect(sceneA.sceneHash).toBe(sceneB.sceneHash);
    expect(JSON.parse(opticalBenchSceneJson(sceneA)).schema).toBe("emmicro.opticalBenchScene.v1");
    expect(opticalBenchSceneJson(sceneA)).toContain("L8.5 is an ordered multi-element optical-bench workflow");
  });
});

describe("multi-element x-z cross-section and solver plan", () => {
  it("includes source, all elements, monitors, target, and PML boundary items", () => {
    const scene = createOpticalBenchScene(defaultOpticalBenchScenario());
    const crossSection = opticalBenchCrossSection(scene);

    expect(crossSection.some((item) => item.kind === "source")).toBe(true);
    expect(crossSection.filter((item) => item.kind === "element")).toHaveLength(scene.elements.length);
    expect(crossSection.some((item) => item.kind === "monitor" && item.id === "observation-plane")).toBe(true);
    expect(crossSection.some((item) => item.kind === "target")).toBe(true);
    expect(crossSection.filter((item) => item.kind === "pml")).toHaveLength(2);
  });

  it("routes ideal aperture/lens through scalar preview and finite geometry through external FDTD", () => {
    const scene = createOpticalBenchScene(defaultOpticalBenchScenario());
    const plan = createOpticalBenchSolverPlan(scene);

    expect(plan.find((row) => row.label.includes("Circular aperture"))?.solverRoute).toBe("scalar-chain");
    expect(plan.find((row) => row.label.includes("Ideal thin lens"))?.solverRoute).toBe("scalar-chain");
    expect(plan.find((row) => row.label.includes("Transparent block"))?.solverRoute).toBe("external-fdtd");
    expect(plan.find((row) => row.label.includes("Absorbing blocker"))?.solverRoute).toBe("external-fdtd");
    expect(JSON.parse(opticalBenchSolverPlanJson(plan))[0].segment).toContain("source");
  });

  it("marks unsupported curved or finite metal lens/aperture scenes as blocked", () => {
    const scenario = addOpticalBenchElement(
      addOpticalBenchElement(defaultOpticalBenchScenario(), "curved-material-lens", { zMm: 46, label: "Curved material lens" }),
      "finite-metal-aperture",
      { zMm: 48, label: "Finite metal aperture" }
    );
    const scene = createOpticalBenchScene(scenario);
    const plan = createOpticalBenchSolverPlan(scene);
    const preview = runOpticalBenchScalarPreview(scene);
    const report = createOpticalBenchValidationReport({ scene, solverPlan: plan, scalarPreview: preview, externalEvidence: null });

    expect(plan.find((row) => row.label === "Curved material lens")?.solverRoute).toBe("scaffold");
    expect(plan.find((row) => row.label === "Finite metal aperture")?.solverRoute).toBe("unsupported");
    expect(report.computationStatus).toBe("blocked");
  });
});

describe("scalar multi-plane propagation chain", () => {
  it("computes monitor snapshots after source, aperture, lens, target, and observation plane", () => {
    const scene = createOpticalBenchScene(defaultOpticalBenchScenario());
    const preview = runOpticalBenchScalarPreview(scene);
    const labels = preview.snapshots.map((snapshot) => snapshot.label);

    expect(labels).toContain("After source");
    expect(labels.some((label) => label.includes("Circular aperture"))).toBe(true);
    expect(labels.some((label) => label.includes("Ideal thin lens"))).toBe(true);
    expect(labels).toContain("At target");
    expect(labels).toContain("Observation plane");
    expect(preview.snapshots.every((snapshot) => snapshot.profile.length > 0)).toBe(true);
    expect(preview.stageMetrics.every((metric) => Number.isFinite(metric.peakIntensity))).toBe(true);
  });

  it("stores external-only monitor snapshots around finite geometry without claiming in-browser FDTD", () => {
    const scene = createOpticalBenchScene(defaultOpticalBenchScenario());
    const preview = runOpticalBenchScalarPreview(scene);

    expect(preview.snapshots.some((snapshot) => snapshot.status === "external-only")).toBe(true);
    expect(preview.warnings.map((warning) => warning.code)).toContain("opticalBench.scalar.externalBoundary");
  });
});

describe("multi-element external FDTD handoff and validation report", () => {
  it("creates bundled multi-element external evidence with field, flux, receipt, and monitor positions", () => {
    const bundle = createOpticalBenchBundle(defaultOpticalBenchScenario());

    expect(bundle.fdtdBundle.manifest.geometry.length).toBeGreaterThan(0);
    expect(bundle.externalEvidence.receipt.runId).toContain("l85-multi-element-fixture");
    expect(bundle.externalEvidence.flux.monitors.length).toBeGreaterThan(0);
    expect(bundle.externalEvidence.fieldSlice.xCount).toBe(13);
    expect(bundle.validationReport.computationStatus).toBe("external-results-imported");
  });

  it("warns when imported external evidence does not match the scene hash", () => {
    const bundle = createOpticalBenchBundle(defaultOpticalBenchScenario());
    const mismatched = {
      ...bundle.externalEvidence.imported,
      receipt: { ...bundle.externalEvidence.receipt, sourceScenarioHash: "mismatch" }
    };

    expect(validateOpticalBenchExternalEvidence(bundle.scene, mismatched).map((warning) => warning.code)).toContain("opticalBench.external.sceneHashMismatch");
  });

  it("exports validation markdown, JSON, monitor CSV, and metrics CSV with hard boundary language", () => {
    const bundle = createOpticalBenchBundle(defaultOpticalBenchScenario());
    const markdown = opticalBenchValidationReportMarkdown(bundle.validationReport);
    const json = JSON.parse(opticalBenchValidationReportJson(bundle.validationReport));
    const monitorCsv = opticalBenchMonitorStackCsv(bundle.scalarPreview);
    const metricsCsv = opticalBenchMetricsCsv(bundle.validationReport);

    expect(markdown).toContain("No production in-browser FDTD execution");
    expect(markdown).toContain("No production in-browser FDTD execution");
    expect(markdown).not.toMatch(/arbitrary 3D Maxwell solved|browser FDTD execution is available|FEM execution is available|digital twin certified|manufacturing certification available/i);
    expect(json.schema).toBe("emmicro.opticalBench.validationReport.v1");
    expect(monitorCsv).toContain("monitor_id,label,z_mm");
    expect(metricsCsv).toContain("external_reflectance");
  });
});

describe("L8.5 boundaries and regressions", () => {
  it("keeps L8.4 aperture, L8.3 surface geometry, and L8.2 convergence fixtures working", () => {
    const aperture = createApertureValidationExampleBundle("long-slit");
    const surface = createSurfaceGeometryExampleBundle("transparent-block");
    const convergence = createFdtdBenchmarkExampleBundle("transparent-interface");

    expect(aperture.validation.status).toMatch(/pass|warning|diagnostic/);
    expect(surface.validation.status).toMatch(/pass|warning|fail/);
    expect(convergence.convergenceSummary.status).toMatch(/pass|warning|fail/);
  });

  it("does not claim in-browser arbitrary 3D Maxwell, FDTD, FEM, BEM, or RCWA", () => {
    const bundle = createOpticalBenchBundle(defaultOpticalBenchScenario());
    const boundary = bundle.scene.boundary.join(" ");

    expect(boundary).toContain("No production in-browser FDTD execution");
    expect(boundary).toContain("general arbitrary 3D Maxwell");
    expect(boundary).toContain("FEM/BEM/RCWA");
    expect(boundary).not.toMatch(/FDTD execution is available|arbitrary 3D Maxwell solved|production EM solver|digital twin certified/i);
  });
});
