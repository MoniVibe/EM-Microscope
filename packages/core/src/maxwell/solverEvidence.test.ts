import { describe, expect, it } from "vitest";
import { createSolverRouteExampleScene, routeSolverScene } from "./solverRouter";
import {
  createSolverEvidenceTask,
  promoteSolverEvidenceTaskToCampaign,
  solverEvidenceActionsCsv,
  solverEvidenceArtifactsCsv,
  solverEvidenceBundleFiles,
  solverEvidenceInputsCsv,
  solverEvidencePromotionJson,
  solverEvidenceTaskJson,
  solverEvidenceTaskMarkdown,
  solverEvidenceValidationPlanCsv
} from "./solverEvidence";

function taskFor(example: Parameters<typeof createSolverRouteExampleScene>[0]) {
  const scene = createSolverRouteExampleScene(example);
  return createSolverEvidenceTask(scene, routeSolverScene(scene));
}

describe("L9.5 solver evidence task generation", () => {
  it("generates TMM evidence task for planar stack route", () => {
    const task = taskFor("planar");
    expect(task.routeId).toBe("planar-tmm");
    expect(task.taskType).toBe("tmm-report");
    expect(task.generatedArtifacts.map((artifact) => artifact.filename)).toContain("tmm_evidence_report.md");
  });

  it("generates scalar evidence task for ideal aperture/lens route", () => {
    const task = taskFor("scalar");
    expect(task.routeId).toBe("scalar-propagation");
    expect(task.taskType).toBe("scalar-validation");
    expect(task.generatedArtifacts.map((artifact) => artifact.filename)).toContain("scalar_profiles.csv");
  });

  it("generates RCWA evidence task for 1D grating route", () => {
    const task = taskFor("rcwa");
    expect(task.routeId).toBe("rcwa-1d-preview");
    expect(task.taskType).toBe("rcwa-convergence");
    expect(task.generatedArtifacts.map((artifact) => artifact.filename)).toContain("rcwa_convergence.csv");
  });

  it("generates 2D FDTD evidence task for bounded finite slice route", () => {
    const task = taskFor("fdtd2d");
    expect(task.routeId).toBe("fdtd-2d-cpu");
    expect(task.taskType).toBe("fdtd2d-validation");
    expect(task.generatedArtifacts.map((artifact) => artifact.filename)).toContain("fdtd2d_energy_trace.csv");
  });

  it("generates external FDTD run-pack task for finite geometry route", () => {
    const task = taskFor("external");
    expect(task.routeId).toBe("external-fdtd-meep");
    expect(task.taskType).toBe("external-fdtd-run-pack");
    expect(task.generatedArtifacts.map((artifact) => artifact.filename)).toContain("external_fdtd_run_pack/meep_scene.py");
    expect(task.requiredInputs.find((input) => input.id === "run_receipt.json")?.status).toBe("external-required");
  });

  it("generates unsupported gap report for unsupported route", () => {
    const task = taskFor("unsupported");
    expect(task.routeId).toBe("unsupported");
    expect(task.taskType).toBe("unsupported-gap-report");
    expect(task.generatedArtifacts.map((artifact) => artifact.filename)).toContain("unsupported_gap_report.md");
    expect(task.unsupportedFeatures.join(" ")).toContain("curved/freeform/CAD");
  });

  it("hashes evidence tasks deterministically", () => {
    expect(taskFor("rcwa").taskHash).toBe(taskFor("rcwa").taskHash);
    expect(taskFor("rcwa").taskHash).not.toBe(taskFor("scalar").taskHash);
  });
});

describe("L9.5 solver evidence pack artifacts", () => {
  it("lists expected TMM report artifacts", () => {
    expect(taskFor("planar").generatedArtifacts.map((artifact) => artifact.filename)).toEqual([
      "tmm_evidence_report.md",
      "tmm_evidence_report.json",
      "tmm_rta.csv",
      "material_receipts.json",
      "energy_balance.csv"
    ]);
  });

  it("lists expected scalar validation artifacts", () => {
    const names = taskFor("scalar").generatedArtifacts.map((artifact) => artifact.filename);
    expect(names).toContain("scalar_validation_report.md");
    expect(names).toContain("scalar_residuals.csv");
    expect(names).toContain("field_monitor_summary.csv");
  });

  it("lists expected RCWA convergence artifacts", () => {
    const names = taskFor("rcwa").generatedArtifacts.map((artifact) => artifact.filename);
    expect(names).toContain("rcwa_orders.csv");
    expect(names).toContain("rcwa_convergence.csv");
    expect(names).toContain("rcwa_tmm_consistency.csv");
  });

  it("lists expected 2D FDTD stability/convergence artifacts", () => {
    const names = taskFor("fdtd2d").generatedArtifacts.map((artifact) => artifact.filename);
    expect(names).toContain("fdtd2d_validation_report.md");
    expect(names).toContain("fdtd2d_convergence.csv");
    expect(names).toContain("fdtd2d_backend_parity.json");
  });

  it("lists expected external FDTD run-pack/import artifacts", () => {
    const names = taskFor("external").generatedArtifacts.map((artifact) => artifact.filename);
    expect(names).toContain("external_fdtd_run_pack/scene_manifest.json");
    expect(names).toContain("external_fdtd_run_pack/run_config.json");
    expect(names).toContain("external_fdtd_import_checklist.csv");
  });

  it("lists unsupported gap-report artifacts", () => {
    const names = taskFor("unsupported").generatedArtifacts.map((artifact) => artifact.filename);
    expect(names).toContain("unsupported_items.csv");
    expect(names).toContain("suggested_next_steps.csv");
  });
});

describe("L9.5 solver evidence router actions and promotion", () => {
  it("offers Generate Evidence Pack for ready routes", () => {
    expect(taskFor("planar").actions.map((action) => action.id)).toContain("generate-evidence-pack");
  });

  it("offers Run In-Browser Checks for scalar/RCWA/2D FDTD routes", () => {
    for (const example of ["scalar", "rcwa", "fdtd2d"] as const) {
      expect(taskFor(example).actions.map((action) => action.id)).toContain("run-available-in-browser-checks");
    }
  });

  it("offers external FDTD run-pack and receipt actions for external routes", () => {
    const ids = taskFor("external").actions.map((action) => action.id);
    expect(ids).toContain("generate-external-run-pack");
    expect(ids).toContain("import-results");
    expect(ids).toContain("validate-receipts");
    expect(ids).toContain("promote-to-engineering-evidence-campaign");
  });

  it("offers Show Unsupported Gap Report for unsupported routes", () => {
    expect(taskFor("unsupported").actions.map((action) => action.id)).toContain("show-unsupported-gap-report");
  });

  it("promotes evidence task metadata while preserving task hash and warnings", () => {
    const task = taskFor("external");
    const promotion = promoteSolverEvidenceTaskToCampaign(task);
    expect(promotion.campaignTarget).toBe("Engineering Evidence Campaign");
    expect(promotion.preservedHashes.taskHash).toBe(task.taskHash);
    expect(promotion.warnings).toEqual(task.warnings);
    expect(JSON.parse(solverEvidencePromotionJson(promotion)).promotionHash).toBe(promotion.promotionHash);
  });
});

describe("L9.5 solver evidence exports", () => {
  it("exports Markdown/JSON/CSV evidence task reports", () => {
    const task = taskFor("rcwa");
    expect(solverEvidenceTaskMarkdown(task)).toContain("L9.5 Solver Evidence Task");
    expect(JSON.parse(solverEvidenceTaskJson(task)).taskType).toBe("rcwa-convergence");
    expect(solverEvidenceArtifactsCsv(task)).toContain("rcwa_orders.csv");
    expect(solverEvidenceValidationPlanCsv(task)).toContain("rcwa-harmonic-convergence");
    expect(solverEvidenceInputsCsv(task)).toContain("source-model");
    expect(solverEvidenceActionsCsv(task)).toContain("Generate Evidence Pack");
  });

  it("creates a downloadable evidence bundle with sanitized external folder paths", () => {
    const files = solverEvidenceBundleFiles(taskFor("external"));
    expect(files.map((file) => file.filename)).toContain("solver_evidence_task.json");
    expect(files.map((file) => file.filename)).toContain("external_fdtd_run_pack__meep_scene.py");
    expect(files.find((file) => file.originalPath === "external_fdtd_run_pack/meep_scene.py")?.content).toContain("outside the browser");
  });
});

describe("L9.5 boundaries and regressions", () => {
  it("does not claim automatic correctness proof or certified solver selection", () => {
    const report = solverEvidenceTaskMarkdown(taskFor("planar"));
    expect(report).toContain("not automatic correctness proof");
    expect(report).toContain("not certified solver selection");
    expect(report).not.toMatch(/automatic correctness proof is complete|solver selection certified/i);
  });

  it("does not claim production RCWA/FDTD, arbitrary 3D Maxwell, FEM/BEM, or external solver replacement", () => {
    const text = [
      solverEvidenceTaskMarkdown(taskFor("rcwa")),
      solverEvidenceTaskMarkdown(taskFor("fdtd2d")),
      solverEvidenceTaskMarkdown(taskFor("external")),
      solverEvidenceTaskMarkdown(taskFor("unsupported"))
    ].join(" ");
    expect(text).toContain("not production RCWA/FDTD certification");
    expect(text).toContain("not arbitrary 3D Maxwell, FEM, or BEM");
    expect(text).toContain("does not execute external Meep/FDTD");
    expect(text).not.toMatch(/production RCWA certified|production FDTD certified|arbitrary 3D Maxwell solved|FEM\/BEM implemented|external solver replacement/i);
  });

  it("keeps L9.4 router route hashes intact underneath the evidence task", () => {
    const scene = createSolverRouteExampleScene("rcwa");
    const decision = routeSolverScene(scene);
    const task = createSolverEvidenceTask(scene, decision);
    expect(task.routeHash).toBe(decision.resultHash);
    expect(decision.recommendedSolver).toBe("rcwa-1d-preview");
  });
});
