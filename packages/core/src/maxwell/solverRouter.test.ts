import { describe, expect, it } from "vitest";
import { createSimulationBuilderElement, defaultSimulationBuilderScenario } from "./simulationBuilder";
import {
  classifySimulationBuilderScenario,
  createSolverRouteExampleScene,
  l94SolverRouterBoundary,
  methodSelectionMatrix,
  routeSolverScene,
  solverRouteMatrixCsv,
  solverRouteReportJson,
  solverRouteReportMarkdown,
  unsupportedItemsCsv,
  validationPlanCsv
} from "./solverRouter";

describe("L9.4 solver router scene classification", () => {
  it("routes planar multilayer stack to PlanarTmmBackend", () => {
    const decision = routeSolverScene(createSolverRouteExampleScene("planar"));

    expect(decision.recommendedSolver).toBe("planar-tmm");
    expect(decision.status).toBe("ready");
    expect(decision.reasons.join(" ")).toContain("laterally invariant");
  });

  it("routes ideal aperture/lens chain to scalar propagation", () => {
    const decision = routeSolverScene(createSolverRouteExampleScene("scalar"));

    expect(decision.recommendedSolver).toBe("scalar-propagation");
    expect(decision.status).toBe("ready");
    expect(decision.reasons.join(" ")).toContain("ideal aperture/lens");
  });

  it("routes 1D binary periodic grating to RCWA preview", () => {
    const decision = routeSolverScene(createSolverRouteExampleScene("rcwa"));

    expect(decision.recommendedSolver).toBe("rcwa-1d-preview");
    expect(decision.status).toBe("warning");
    expect(decision.validationChecks.map((check) => check.id)).toContain("rcwa-harmonic-convergence");
  });

  it("routes small 2D finite geometry slice to 2D FDTD sandbox", () => {
    const decision = routeSolverScene(createSolverRouteExampleScene("fdtd2d"));

    expect(decision.recommendedSolver).toBe("fdtd-2d-cpu");
    expect(decision.alternatives.find((alternative) => alternative.solverId === "fdtd-2d-webgpu")?.status).toBe("possible");
    expect(decision.validationChecks.map((check) => check.id)).toContain("fdtd2d-stability");
  });

  it("routes finite 3D-like geometry to external FDTD export/import", () => {
    const decision = routeSolverScene(createSolverRouteExampleScene("external"));

    expect(decision.recommendedSolver).toBe("external-fdtd-meep");
    expect(decision.status).toBe("external-required");
    expect(decision.validationChecks.every((check) => check.status === "external-required")).toBe(true);
  });

  it("marks arbitrary CAD/freeform curved material lens as unsupported", () => {
    const decision = routeSolverScene(createSolverRouteExampleScene("unsupported"));

    expect(decision.recommendedSolver).toBe("unsupported");
    expect(decision.status).toBe("unsupported");
    expect(decision.unsupportedItems.join(" ")).toContain("curved/freeform/CAD");
  });

  it("classifies the current Simulation Builder scene deterministically", () => {
    const base = defaultSimulationBuilderScenario();
    const scalar = classifySimulationBuilderScenario(base);
    const finite = classifySimulationBuilderScenario({
      ...base,
      id: "finite-builder-scene",
      elements: [createSimulationBuilderElement("finite-transparent-block", 10), createSimulationBuilderElement("finite-aperture-blocker", 15)]
    });
    const unsupported = classifySimulationBuilderScenario({
      ...base,
      id: "unsupported-builder-scene",
      elements: [createSimulationBuilderElement("curved-material-lens", 10)]
    });

    expect(routeSolverScene(scalar).recommendedSolver).toBe("scalar-propagation");
    expect(routeSolverScene(finite).recommendedSolver).toBe("external-fdtd-meep");
    expect(routeSolverScene(unsupported).recommendedSolver).toBe("unsupported");
    expect(routeSolverScene(scalar).resultHash).toBe(routeSolverScene(classifySimulationBuilderScenario(base)).resultHash);
  });
});

describe("L9.4 solver route reasoning", () => {
  it("explains why TMM is rejected for lateral periodic grating", () => {
    const decision = routeSolverScene(createSolverRouteExampleScene("rcwa"));
    const tmm = decision.alternatives.find((alternative) => alternative.solverId === "planar-tmm");

    expect(tmm?.status).toBe("rejected");
    expect(tmm?.reasons.join(" ")).toContain("lateral periodic");
  });

  it("explains why RCWA is rejected for nonperiodic finite block", () => {
    const decision = routeSolverScene(createSolverRouteExampleScene("external"));
    const rcwa = decision.alternatives.find((alternative) => alternative.solverId === "rcwa-1d-preview");

    expect(rcwa?.status).toBe("rejected");
    expect(rcwa?.reasons.join(" ")).toContain("nonperiodic finite");
  });

  it("explains why scalar propagation is rejected for finite material geometry", () => {
    const decision = routeSolverScene(createSolverRouteExampleScene("external"));
    const scalar = decision.alternatives.find((alternative) => alternative.solverId === "scalar-propagation");

    expect(scalar?.status).toBe("rejected");
    expect(scalar?.reasons.join(" ")).toContain("finite material discontinuities");
  });

  it("explains why 2D FDTD is diagnostic only for 3D scenes", () => {
    const decision = routeSolverScene(createSolverRouteExampleScene("external"));
    const fdtd = decision.alternatives.find((alternative) => alternative.solverId === "fdtd-2d-cpu");

    expect(fdtd?.status).toBe("diagnostic");
    expect(fdtd?.reasons.join(" ")).toContain("bounded diagnostic");
  });

  it("lists validation checks for each accepted route", () => {
    for (const example of ["planar", "scalar", "rcwa", "fdtd2d", "external"] as const) {
      const decision = routeSolverScene(createSolverRouteExampleScene(example));
      expect(decision.validationChecks.length).toBeGreaterThan(0);
      expect(decision.validationChecks.every((check) => check.label.length > 0)).toBe(true);
    }
  });
});

describe("L9.4 solver capability matrix", () => {
  it("shows TMM as executable for planar layers", () => {
    const row = methodSelectionMatrix().find((item) => item.featureId === "planar-layers");
    expect(row?.cells.find((cell) => cell.solverId === "planar-tmm")?.status).toBe("best");
  });

  it("shows RCWA as executable for 1D periodic gratings", () => {
    const row = methodSelectionMatrix().find((item) => item.featureId === "periodic-1d-grating");
    expect(row?.cells.find((cell) => cell.solverId === "rcwa-1d-preview")?.status).toBe("best");
  });

  it("shows 2D FDTD as bounded diagnostic", () => {
    const row = methodSelectionMatrix().find((item) => item.featureId === "finite-dielectric-block");
    expect(row?.cells.find((cell) => cell.solverId === "fdtd-2d-cpu")?.status).toBe("diagnostic");
  });

  it("shows external FDTD as export/import evidence path", () => {
    const row = methodSelectionMatrix().find((item) => item.featureId === "finite-dielectric-block");
    expect(row?.cells.find((cell) => cell.solverId === "external-fdtd-meep")?.status).toBe("best");
  });

  it("shows FEM/BEM and arbitrary 3D Maxwell as not implemented by boundary", () => {
    const text = l94SolverRouterBoundary.join(" ");
    expect(text).toContain("FEM");
    expect(text).toContain("BEM");
    expect(text).toContain("arbitrary 3D Maxwell");
    expect(text).toContain("does not implement");
  });
});

describe("L9.4 solver router actions and exports", () => {
  it("offers Open RCWA for periodic grating scenes", () => {
    const decision = routeSolverScene(createSolverRouteExampleScene("rcwa"));
    expect(decision.routeActions.map((action) => action.id)).toContain("open-rcwa-preview-solver");
  });

  it("offers Send to 2D FDTD Sandbox for supported 2D slice scenes", () => {
    const decision = routeSolverScene(createSolverRouteExampleScene("fdtd2d"));
    expect(decision.routeActions.map((action) => action.id)).toContain("send-2d-slice-to-fdtd-sandbox");
  });

  it("offers Export External FDTD Pack for finite geometry scenes", () => {
    const decision = routeSolverScene(createSolverRouteExampleScene("external"));
    expect(decision.routeActions.map((action) => action.id)).toContain("export-external-fdtd-run-pack");
  });

  it("offers Show Unsupported Items for unsupported scenes", () => {
    const decision = routeSolverScene(createSolverRouteExampleScene("unsupported"));
    expect(decision.routeActions.map((action) => action.id)).toContain("show-unsupported-items");
  });

  it("exports Markdown/JSON route reports and CSV route evidence", () => {
    const decision = routeSolverScene(createSolverRouteExampleScene("rcwa"));
    const markdown = solverRouteReportMarkdown(decision);
    const json = JSON.parse(solverRouteReportJson(decision));
    const matrix = solverRouteMatrixCsv();
    const unsupported = unsupportedItemsCsv(decision);
    const validation = validationPlanCsv(decision);

    expect(markdown).toContain("L9.4 Solver Route Report");
    expect(markdown).toContain("RCWA Preview Solver");
    expect(json.recommendedSolver).toBe("rcwa-1d-preview");
    expect(matrix).toContain("periodic-1d-grating");
    expect(unsupported).toContain("none");
    expect(validation).toContain("rcwa-harmonic-convergence");
  });
});

describe("L9.4 boundaries and regressions", () => {
  it("does not claim automatic solver correctness", () => {
    const report = solverRouteReportMarkdown(routeSolverScene(createSolverRouteExampleScene("planar")));
    expect(report).toContain("does not prove automatic solver correctness");
    expect(report).not.toMatch(/automatic correctness proof is complete|solver correctness certified/i);
  });

  it("does not claim arbitrary 3D Maxwell, FEM/BEM, production RCWA/FDTD certification, or external solver replacement", () => {
    const text = [
      ...l94SolverRouterBoundary,
      solverRouteReportMarkdown(routeSolverScene(createSolverRouteExampleScene("external"))),
      solverRouteMatrixCsv()
    ].join(" ");

    expect(text).toContain("does not implement arbitrary 3D Maxwell");
    expect(text).toContain("FEM");
    expect(text).toContain("BEM");
    expect(text).toContain("production RCWA certification");
    expect(text).toContain("production FDTD certification");
    expect(text).toContain("replacement for external Meep/FDTD");
    expect(text).not.toMatch(/arbitrary 3D Maxwell support enabled|FEM\/BEM route implemented|production RCWA certified|production FDTD certified|external solver replacement implemented/i);
  });
});
