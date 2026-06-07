import { describe, expect, it } from "vitest";
import {
  createSimulationIntakeDecision,
  defaultSimulationIntakeAnswers,
  simulationIntakeDecisionMatrixCsv,
  simulationIntakeDecisionReportJson,
  simulationIntakeDecisionReportMarkdown,
  simulationIntakeGeneratedTemplateJson,
  simulationIntakeWizardAnswersJson,
  type SimulationIntakeAnswers
} from "./simulationIntakeWizard";

function answers(input: Partial<SimulationIntakeAnswers>): SimulationIntakeAnswers {
  return { ...defaultSimulationIntakeAnswers, ...input, schema: "emmicro.simulationIntake.answers.v1" };
}

describe("L9.7 simulation intake wizard routing", () => {
  it("routes planar coating answers to TMM workflow", () => {
    const decision = createSimulationIntakeDecision(answers({
      problemType: "planar-coating",
      desiredOutput: "rta",
      geometry: "infinite-planar-layers",
      material: "coating-stack",
      rigor: "fast-preview"
    }));
    expect(decision.routeDecision.recommendedSolver).toBe("planar-tmm");
    expect(decision.evidenceTask.taskType).toBe("tmm-report");
    expect(decision.generatedTemplate.kind).toBe("planar-tmm-coating-template");
  });

  it("routes ideal aperture/lens answers to scalar propagation workflow", () => {
    const decision = createSimulationIntakeDecision(answers({
      problemType: "aperture-slit-lens",
      desiredOutput: "focal-plane-psf",
      geometry: "ideal-mask-phase-elements",
      material: "lossless-dielectric-n",
      rigor: "in-browser-diagnostic"
    }));
    expect(decision.routeDecision.recommendedSolver).toBe("scalar-propagation");
    expect(decision.evidenceTask.taskType).toBe("scalar-validation");
    expect(decision.generatedTemplate.kind).toBe("scalar-aperture-lens-template");
  });

  it("routes periodic grating answers to RCWA workflow", () => {
    const decision = createSimulationIntakeDecision(answers({
      problemType: "periodic-grating",
      desiredOutput: "diffraction-orders",
      geometry: "periodic-1d-grating",
      material: "periodic-material-pattern",
      rigor: "convergence-tested-report"
    }));
    expect(decision.routeDecision.recommendedSolver).toBe("rcwa-1d-preview");
    expect(decision.evidenceTask.taskType).toBe("rcwa-convergence");
    expect(decision.generatedTemplate.kind).toBe("rcwa-binary-grating-template");
    expect(decision.generatedTemplate.rcwaPreviewSpec?.harmonicCount).toBe(9);
  });

  it("routes small 2D finite scene answers to 2D FDTD sandbox", () => {
    const decision = createSimulationIntakeDecision(answers({
      problemType: "finite-material-object",
      desiredOutput: "field-animation",
      geometry: "small-2d-slice",
      material: "lossless-dielectric-n",
      rigor: "in-browser-diagnostic"
    }));
    expect(decision.routeDecision.recommendedSolver).toBe("fdtd-2d-cpu");
    expect(decision.evidenceTask.taskType).toBe("fdtd2d-validation");
    expect(decision.generatedTemplate.kind).toBe("fdtd2d-sandbox-template");
    expect(decision.generatedTemplate.fdtd2dScene?.schema).toBe("emmicro.fdtd2d.scene.v1");
  });

  it("routes finite material geometry answers to external FDTD workflow", () => {
    const decision = createSimulationIntakeDecision(answers({
      problemType: "finite-material-object",
      desiredOutput: "field-map-2d",
      geometry: "finite-block-aperture-wedge",
      material: "absorbing-nk-alpha",
      rigor: "external-solver-evidence"
    }));
    expect(decision.routeDecision.recommendedSolver).toBe("external-fdtd-meep");
    expect(decision.evidenceTask.taskType).toBe("external-fdtd-run-pack");
    expect(decision.generatedTemplate.kind).toBe("external-fdtd-builder-template");
  });

  it("routes arbitrary CAD/curved material lens answers to unsupported gap report", () => {
    const decision = createSimulationIntakeDecision(answers({
      problemType: "finite-material-object",
      desiredOutput: "field-map-2d",
      geometry: "arbitrary-cad-freeform-curved-3d",
      material: "imported-material-pack",
      rigor: "engineering-evidence-dossier"
    }));
    expect(decision.routeDecision.recommendedSolver).toBe("unsupported");
    expect(decision.evidenceTask.taskType).toBe("unsupported-gap-report");
    expect(decision.generatedTemplate.kind).toBe("unsupported-gap-template");
    expect(decision.generatedTemplate.unsupportedGap?.currentStatus).toBe("unsupported");
    expect(decision.nextActions.find((action) => action.id === "show-unsupported-gap-report")?.enabled).toBe(true);
  });
});

describe("L9.7 wizard generated templates", () => {
  it("creates planar coating scene template", () => {
    const template = createSimulationIntakeDecision().generatedTemplate;
    expect(template.simulationBuilderScenario?.elements.map((element) => element.kind)).toEqual(["material-slab", "material-slab"]);
    expect(template.simulationBuilderScenario?.label).toContain("planar TMM coating template");
  });

  it("creates scalar aperture/lens scene template", () => {
    const template = createSimulationIntakeDecision(answers({
      problemType: "aperture-slit-lens",
      desiredOutput: "focal-plane-psf",
      geometry: "ideal-mask-phase-elements",
      material: "lossless-dielectric-n",
      rigor: "in-browser-diagnostic"
    })).generatedTemplate;
    expect(template.simulationBuilderScenario?.elements.map((element) => element.kind)).toEqual(["circular-aperture", "ideal-lens"]);
  });

  it("creates RCWA grating template", () => {
    const template = createSimulationIntakeDecision(answers({
      problemType: "periodic-grating",
      desiredOutput: "diffraction-orders",
      geometry: "periodic-1d-grating",
      material: "periodic-material-pattern",
      rigor: "fast-preview"
    })).generatedTemplate;
    expect(template.rcwaPreviewSpec).toMatchObject({ periodNm: 700, dutyCycle: 0.5, harmonicCount: 5 });
  });

  it("creates 2D FDTD template", () => {
    const template = createSimulationIntakeDecision(answers({
      problemType: "finite-material-object",
      desiredOutput: "field-animation",
      geometry: "small-2d-slice",
      material: "lossless-dielectric-n",
      rigor: "in-browser-diagnostic"
    })).generatedTemplate;
    expect(template.label).toContain("2D FDTD sandbox template");
    expect(template.fdtd2dScene?.schema).toBe("emmicro.fdtd2d.scene.v1");
  });

  it("creates external FDTD Simulation Builder template", () => {
    const template = createSimulationIntakeDecision(answers({
      problemType: "finite-material-object",
      desiredOutput: "field-map-2d",
      geometry: "finite-block-aperture-wedge",
      material: "absorbing-nk-alpha",
      rigor: "external-solver-evidence"
    })).generatedTemplate;
    expect(template.simulationBuilderScenario?.elements.map((element) => element.kind)).toContain("finite-transparent-block");
    expect(template.simulationBuilderScenario?.elements.map((element) => element.kind)).toContain("finite-aperture-blocker");
    expect(template.simulationBuilderScenario?.elements.map((element) => element.kind)).toContain("finite-absorbing-block");
  });

  it("preserves user units/material/output preferences", () => {
    const decision = createSimulationIntakeDecision(answers({
      desiredOutput: "evidence-dossier",
      geometry: "finite-block-aperture-wedge",
      material: "absorbing-nk-alpha",
      rigor: "engineering-evidence-dossier"
    }));
    expect(decision.generatedTemplate.preservedPreferences.join(" ")).toContain("Evidence dossier");
    expect(decision.generatedTemplate.preservedPreferences.join(" ")).toContain("absorbing n/k or alpha");
    expect(decision.solverScene.requestedOutputs).toContain("Evidence dossier");
    expect(decision.solverScene.requestedOutputs).toContain("Engineering evidence dossier");
  });
});

describe("L9.7 wizard evidence and export integration", () => {
  it("generates evidence task through L9.5 and offers L9.6 checks", () => {
    const decision = createSimulationIntakeDecision(answers({
      problemType: "periodic-grating",
      desiredOutput: "diffraction-orders",
      geometry: "periodic-1d-grating",
      material: "periodic-material-pattern",
      rigor: "convergence-tested-report"
    }));
    expect(decision.evidenceTask.schema).toBe("emmicro.solverEvidenceTask.v1");
    expect(decision.evidenceTask.routeHash).toBe(decision.routeDecision.resultHash);
    expect(decision.consistencyCaseIds).toContain("tmm-rcwa-no-pattern");
    expect(decision.consistencyCaseIds).toContain("rcwa-external-grating-fixture");
  });

  it("exports Markdown, JSON, decision matrix CSV, template JSON, and answers JSON", () => {
    const decision = createSimulationIntakeDecision();
    expect(simulationIntakeDecisionReportMarkdown(decision)).toContain("# L9.7 Solver Method Decision Wizard / Simulation Intake");
    expect(JSON.parse(simulationIntakeDecisionReportJson(decision)).decisionHash).toBe(decision.decisionHash);
    expect(simulationIntakeDecisionMatrixCsv(decision)).toContain("decision_hash,answer_step,answer_id");
    expect(JSON.parse(simulationIntakeGeneratedTemplateJson(decision.generatedTemplate)).templateHash).toBe(decision.generatedTemplate.templateHash);
    expect(JSON.parse(simulationIntakeWizardAnswersJson(decision.answers)).problemType).toBe("planar-coating");
  });

  it("preserves route limitations and unsupported items", () => {
    const decision = createSimulationIntakeDecision(answers({
      problemType: "finite-material-object",
      desiredOutput: "field-map-2d",
      geometry: "arbitrary-cad-freeform-curved-3d",
      material: "imported-material-pack",
      rigor: "engineering-evidence-dossier"
    }));
    expect(decision.unsupportedItems.join(" ")).toContain("arbitrary 3D geometry");
    expect(decision.limitations.join(" ")).toContain("Unsupported or scaffold-only requests remain visible as gap reports");
  });
});

describe("L9.7 boundaries and regressions", () => {
  it("does not claim automatic correctness, certified solver selection, or unsupported solvers are executable", () => {
    const report = simulationIntakeDecisionReportMarkdown(createSimulationIntakeDecision(answers({
      geometry: "arbitrary-cad-freeform-curved-3d",
      material: "imported-material-pack",
      rigor: "engineering-evidence-dossier"
    })));
    expect(report).toContain("does not prove automatic correctness");
    expect(report).toContain("does not certify solver selection");
    expect(report).toContain("gap reports");
    expect(report).not.toMatch(/automatic correctness proof is complete|certified solver selection is complete|unsupported solver executable/i);
  });

  it("does not claim arbitrary 3D Maxwell/FEM/BEM or production RCWA/FDTD certification", () => {
    const report = simulationIntakeDecisionReportMarkdown(createSimulationIntakeDecision());
    expect(report).toContain("not production RCWA/FDTD");
    expect(report).toContain("arbitrary 3D Maxwell");
    expect(report).toContain("FEM");
    expect(report).toContain("BEM");
    expect(report).not.toMatch(/arbitrary 3D Maxwell solved|FEM\/BEM implemented|production RCWA certified|production FDTD certified/i);
  });

  it("keeps L9.6, L9.5, and L9.4 artifacts linked", () => {
    const decision = createSimulationIntakeDecision();
    expect(decision.consistencyCaseIds.length).toBeGreaterThan(0);
    expect(decision.evidenceTask.routeHash).toBe(decision.routeDecision.resultHash);
    expect(decision.decisionHash).toMatch(/^[0-9a-f]+$/);
  });
});
