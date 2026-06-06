import { describe, expect, it } from "vitest";
import {
  addSimulationBuilderElement,
  createSimulationBuilderElement,
  defaultSimulationBuilderScenario
} from "../maxwell/simulationBuilder";
import {
  createFdtd2dFixtureScene,
  createFdtd2dSandboxReport,
  createFdtd2dScene,
  estimateFdtd2dBudget,
  fdtd2dEnergyTraceCsv,
  fdtd2dFieldSnapshotCsv,
  fdtd2dMonitorTraceCsv,
  fdtd2dSandboxReportJson,
  fdtd2dSandboxReportMarkdown,
  initializeFdtd2dState,
  l90Fdtd2dBoundary,
  runFdtd2dScene,
  runFdtd2dValidationFixture,
  simulationBuilderToFdtd2dSandbox,
  stableDtForFdtd2d,
  stepFdtd2dState,
  type Fdtd2dFixtureKind
} from "./fdtd2dSandbox";

describe("L9.0 in-browser 2D FDTD Maxwell sandbox core", () => {
  it("creates deterministic bounded TMz scenes and finite time steps", () => {
    const a = createFdtd2dScene();
    const b = createFdtd2dScene();
    const dt = stableDtForFdtd2d(a.grid);

    expect(a.schema).toBe("emmicro.fdtd2d.scene.v1");
    expect(a.polarization).toBe("TMz");
    expect(a.sceneHash).toBe(b.sceneHash);
    expect(a.sources[0]?.kind).toBe("point");
    expect(a.monitors[0]?.kind).toBe("line");
    expect(dt.dtCells).toBeGreaterThan(0);
    expect(dt.dtSeconds).toBeGreaterThan(0);
  });

  it("enforces grid, object, and CFL safety budgets before stepping", () => {
    const safe = estimateFdtd2dBudget(createFdtd2dScene().grid);
    const warned = estimateFdtd2dBudget({ ...createFdtd2dScene().grid, nx: 513, ny: 513 });
    const blocked = estimateFdtd2dBudget({ ...createFdtd2dScene().grid, nx: 1100, ny: 1100 });
    const tooManyObjects = estimateFdtd2dBudget(createFdtd2dScene().grid, 40);
    const badCfl = estimateFdtd2dBudget({ ...createFdtd2dScene().grid, cfl: 1.1 });

    expect(safe.status).toBe("safe");
    expect(warned.status).toBe("warning");
    expect(blocked.status).toBe("blocked");
    expect(tooManyObjects.status).toBe("blocked");
    expect(badCfl.status).toBe("blocked");
    expect(blocked.warnings.map((warning) => warning.code)).toContain("fdtd2d.grid.blocked");
  });

  it("steps empty space without NaN or Infinity and records monitors", () => {
    const scene = createFdtd2dScene({ grid: { ...createFdtd2dScene().grid, nx: 96, ny: 80, maxStepsPerRun: 200 } });
    const state = initializeFdtd2dState(scene);

    stepFdtd2dState(state, 60);
    const result = runFdtd2dScene(scene, 60);

    expect(state.step).toBe(60);
    expect(result.stepsCompleted).toBe(60);
    expect(result.status).toBe("pass");
    expect(result.snapshot.maxAbsEz).toBeGreaterThan(0);
    expect(result.energyTrace).toHaveLength(60);
    expect(result.energyTrace.every((value) => Number.isFinite(value))).toBe(true);
    expect(result.monitorTraces["center-line"]).toHaveLength(60);
  });

  it("initializes material, absorber, PEC, and slit maps explicitly", () => {
    const scene = createFdtd2dScene({
      grid: { ...createFdtd2dScene().grid, nx: 80, ny: 64 },
      objects: [
        { id: "glass", label: "Glass", kind: "dielectric-rectangle", x: 20, y: 12, width: 8, height: 18, epsilonR: 2.25 },
        { id: "loss", label: "Loss", kind: "absorbing-rectangle", x: 34, y: 12, width: 8, height: 18, epsilonR: 1.4, sigma: 0.1 },
        { id: "pec", label: "PEC", kind: "pec-block", x: 48, y: 12, width: 5, height: 18 },
        { id: "slit", label: "Slit", kind: "slit-screen", x: 62, y: 8, width: 3, height: 48, apertureWidth: 12, apertureCenterY: 32 }
      ]
    });
    const state = initializeFdtd2dState(scene);

    expect([...state.material]).toContain(1);
    expect([...state.material]).toContain(2);
    expect([...state.material]).toContain(3);
    expect([...state.pec].some((value) => value === 1)).toBe(true);
    expect([...state.sigma].some((value) => value > 0.08)).toBe(true);
    expect([...state.epsilonR].some((value) => value >= 2.25)).toBe(true);
  });

  it("runs validation fixtures and keeps reports/export artifacts deterministic", () => {
    const kinds: Fdtd2dFixtureKind[] = ["empty-space", "pec-wall", "dielectric-interface", "absorbing-slab", "slit-diagnostic"];

    for (const kind of kinds) {
      const report = runFdtd2dValidationFixture(kind, 80);
      expect(report.schema).toBe("emmicro.fdtd2d.validationReport.v1");
      expect(report.status).toMatch(/pass|warning/);
      expect(report.energyFinite).toBe(true);
      expect(report.maxAbsEz).toBeGreaterThanOrEqual(0);
      expect(report.reportHash).toHaveLength(16);
    }

    const result = runFdtd2dScene(createFdtd2dFixtureScene("dielectric-interface"), 70);
    const report = createFdtd2dSandboxReport(result);
    const markdown = fdtd2dSandboxReportMarkdown(report);

    expect(markdown).toContain("L9.0 In-Browser 2D FDTD Maxwell Sandbox Report");
    expect(markdown).toContain("not full 3D Maxwell");
    expect(fdtd2dSandboxReportJson(report)).toContain("emmicro.fdtd2d.sandboxReport.v1");
    expect(fdtd2dFieldSnapshotCsv(result.snapshot)).toContain("x,y,ez,intensity,material");
    expect(fdtd2dMonitorTraceCsv(result)).toContain("step,center-line");
    expect(fdtd2dEnergyTraceCsv(result)).toContain("step,total_energy");
  });

  it("maps supported Simulation Builder finite elements into the sandbox and blocks unsupported curved/3D work", () => {
    let scenario = defaultSimulationBuilderScenario();
    scenario = addSimulationBuilderElement(scenario, createSimulationBuilderElement("finite-transparent-block", 8, "Transparent block"));
    scenario = addSimulationBuilderElement(scenario, createSimulationBuilderElement("finite-absorbing-block", 12, "Absorbing block"));
    scenario = addSimulationBuilderElement(scenario, createSimulationBuilderElement("finite-reflective-plate", 16, "Reflective plate"));
    scenario = addSimulationBuilderElement(scenario, createSimulationBuilderElement("finite-aperture-blocker", 18, "Aperture screen"));
    scenario = addSimulationBuilderElement(scenario, createSimulationBuilderElement("curved-material-lens", 20, "Curved lens"));
    scenario = addSimulationBuilderElement(scenario, createSimulationBuilderElement("finite-metal-aperture", 22, "Metal aperture"));

    const handoff = simulationBuilderToFdtd2dSandbox(scenario);

    expect(handoff.schema).toBe("emmicro.fdtd2d.simulationBuilderHandoff.v1");
    expect(handoff.scene.schema).toBe("emmicro.fdtd2d.scene.v1");
    expect(handoff.mappedObjects.map((item) => item.kind)).toContain("dielectric-rectangle");
    expect(handoff.mappedObjects.map((item) => item.kind)).toContain("absorbing-rectangle");
    expect(handoff.mappedObjects.map((item) => item.kind)).toContain("pec-block");
    expect(handoff.mappedObjects.map((item) => item.kind)).toContain("slit-screen");
    expect(handoff.blocked.map((item) => item.id)).toContain("curved-material-lens-20000");
    expect(handoff.blocked.map((item) => item.id)).toContain("finite-metal-aperture-22000");
    expect(handoff.warnings.map((warning) => warning.code)).toContain("fdtd2d.handoff.apertureQualitative");
  });

  it("states the L9.0 boundary without overclaiming 3D or production solver capability", () => {
    const text = l90Fdtd2dBoundary.join(" ");

    expect(text).toContain("bounded in-browser 2D FDTD Maxwell sandbox");
    expect(text).toContain("TMz polarization: Ez, Hx, and Hy");
    expect(text).toContain("not full 3D Maxwell");
    expect(text).toContain("not production FDTD");
    expect(text).toContain("The L8.9 external Meep/FDTD path remains");
    expect(text).not.toMatch(/certified solver|full arbitrary 3D Maxwell solve|production FDTD is available|digital twin is implemented/i);
  });
});
