import { describe, expect, it } from "vitest";
import {
  createExampleLibraryRegistry,
  exampleLibraryExportFiles,
  exampleLibraryRegistryCsv,
  exampleLibraryReportMarkdown,
  filterExampleLibraryEntries,
  getExampleLibraryEntry,
  l98ExampleLibraryBoundary,
  loadExampleLibraryEntry,
  promoteExampleToEngineeringEvidenceCampaign,
  type ExampleLibraryEntry,
  type ExampleLibraryPhysicsTypeId,
  type ExampleLibrarySolverLaneId
} from "./exampleLibrary";

const requiredIds = [
  "planar-air-glass-interface",
  "planar-simple-ar-coating",
  "scalar-circular-aperture-airy",
  "scalar-long-single-slit",
  "scalar-double-slit-order-spacing",
  "scalar-thin-lens-focal-plane",
  "scalar-coherence-demonstrator",
  "rcwa-binary-grating",
  "rcwa-no-pattern-tmm-consistency",
  "fdtd2d-point-source",
  "fdtd2d-dielectric-block",
  "fdtd2d-pec-reflection",
  "external-transparent-finite-block",
  "external-aperture-blocker",
  "diagnostic-camera-photon-transfer",
  "diagnostic-slanted-edge-mtf",
  "diagnostic-geometric-dot-grid",
  "evidence-engineering-campaign",
  "evidence-process-tolerance-runner",
  "evidence-robust-design-advisor",
  "gap-unsupported-curved-material-lens"
] as const;

describe("L9.8 example library registry", () => {
  it("loads a deterministic registry with the known experiment pack", () => {
    const first = createExampleLibraryRegistry();
    const second = createExampleLibraryRegistry();

    expect(first.schema).toBe("emmicro.exampleLibrary.registry.v1");
    expect(first.label).toBe("L9.8 Guided Example Library / Known Experiment Pack");
    expect(first.registryHash).toBe(second.registryHash);
    expect(first.entries.map((entry) => entry.id)).toEqual(requiredIds);
    expect(first.entries.length).toBeGreaterThanOrEqual(21);
  });

  it("has unique example ids and deterministic example hashes", () => {
    const registry = createExampleLibraryRegistry();
    const ids = registry.entries.map((entry) => entry.id);
    const hashes = registry.entries.map((entry) => entry.exampleHash);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(hashes).size).toBe(hashes.length);
    expect(hashes.every((hash) => /^[0-9a-f]{16}$/i.test(hash))).toBe(true);
    expect(hashes).toEqual(createExampleLibraryRegistry().entries.map((entry) => entry.exampleHash));
  });

  it("includes route, evidence, expected output, limitation, and wizard metadata for every example", () => {
    for (const entry of createExampleLibraryRegistry().entries) {
      expect(entry.schema).toBe("emmicro.exampleLibrary.entry.v1");
      expect(entry.title).not.toHaveLength(0);
      expect(entry.whatThisDemonstrates).not.toHaveLength(0);
      expect(entry.routeExample).toMatch(/planar|scalar|rcwa|fdtd2d|external|unsupported/);
      expect(entry.solverLane).not.toHaveLength(0);
      expect(entry.targetWorkbench).not.toHaveLength(0);
      expect(entry.wizardAnswers.schema).toBe("emmicro.simulationIntake.answers.v1");
      expect(entry.expectedPhysics.length).toBeGreaterThan(0);
      expect(entry.expectedOutputs.length).toBeGreaterThan(0);
      expect(entry.evidence.length).toBeGreaterThan(0);
      expect(entry.limitations.length).toBeGreaterThan(0);
      expect(entry.exampleHash).not.toHaveLength(0);
    }
  });
});

describe("L9.8 example library filters", () => {
  it.each([
    ["planar-tmm", "planar-air-glass-interface"],
    ["scalar-propagation", "scalar-circular-aperture-airy"],
    ["rcwa-1d-preview", "rcwa-binary-grating"],
    ["fdtd-2d-cpu", "fdtd2d-point-source"],
    ["external-fdtd-meep", "external-transparent-finite-block"],
    ["diagnostics", "diagnostic-slanted-edge-mtf"],
    ["engineering-evidence", "evidence-engineering-campaign"],
    ["unsupported", "gap-unsupported-curved-material-lens"]
  ] satisfies Array<[ExampleLibrarySolverLaneId, string]>)("filters solver lane %s", (solverLane, expectedId) => {
    expect(ids(filterExampleLibraryEntries({ solverLane }))).toContain(expectedId);
  });

  it.each([
    ["planar-tmm", "planar-simple-ar-coating"],
    ["scalar-diffraction", "scalar-long-single-slit"],
    ["rcwa-periodic", "rcwa-no-pattern-tmm-consistency"],
    ["fdtd2d", "fdtd2d-dielectric-block"],
    ["external-fdtd", "external-aperture-blocker"],
    ["camera-calibration-mtf", "diagnostic-geometric-dot-grid"],
    ["evidence-robustness", "evidence-robust-design-advisor"],
    ["unsupported-gap", "gap-unsupported-curved-material-lens"]
  ] satisfies Array<[ExampleLibraryPhysicsTypeId, string]>)("filters physics type %s", (physicsType, expectedId) => {
    expect(ids(filterExampleLibraryEntries({ physicsType }))).toContain(expectedId);
  });

  it("filters by text and evidence flags", () => {
    expect(ids(filterExampleLibraryEntries({ text: "Airy" }))).toEqual(["scalar-circular-aperture-airy"]);
    expect(ids(filterExampleLibraryEntries({ text: "grating", hasConvergenceEvidence: true }))).toContain("rcwa-binary-grating");
    expect(ids(filterExampleLibraryEntries({ hasAnalyticReference: true }))).toContain("planar-air-glass-interface");
    expect(ids(filterExampleLibraryEntries({ externalEvidenceRequired: true }))).toContain("external-transparent-finite-block");
    expect(ids(filterExampleLibraryEntries({ hasMeasuredDataWorkflow: true }))).toContain("diagnostic-slanted-edge-mtf");
    expect(ids(filterExampleLibraryEntries({ unsupported: true }))).toEqual(["gap-unsupported-curved-material-lens"]);
  });
});

describe("L9.8 example loading", () => {
  it.each([
    ["planar-air-glass-interface", "planar-tmm", "tmm-report"],
    ["scalar-circular-aperture-airy", "scalar-propagation", "scalar-validation"],
    ["rcwa-binary-grating", "rcwa-1d-preview", "rcwa-convergence"],
    ["fdtd2d-point-source", "fdtd-2d-cpu", "fdtd2d-validation"],
    ["external-transparent-finite-block", "external-fdtd-meep", "external-fdtd-run-pack"],
    ["gap-unsupported-curved-material-lens", "unsupported", "unsupported-gap-report"]
  ] as const)("loads %s into the expected route and evidence task", (id, solverId, taskType) => {
    const loaded = loadExampleLibraryEntry(id);

    expect(loaded.example.id).toBe(id);
    expect(loaded.routeDecision.recommendedSolver).toBe(solverId);
    expect(loaded.evidenceTask.taskType).toBe(taskType);
    expect(loaded.generatedTemplate.templateHash).not.toHaveLength(0);
    expect(loaded.loadHash).not.toHaveLength(0);
  });

  it("loads the three 2D FDTD known experiments as fixture scenes", () => {
    expect(loadExampleLibraryEntry("fdtd2d-point-source").fdtd2dScene?.id).toBe("l92-point-source-symmetry");
    expect(loadExampleLibraryEntry("fdtd2d-dielectric-block").fdtd2dScene?.id).toBe("l90-dielectric-interface");
    expect(loadExampleLibraryEntry("fdtd2d-pec-reflection").fdtd2dScene?.id).toBe("l90-pec-wall");
  });

  it("keeps unsupported examples non-runnable while still loading a gap report action set", () => {
    const loaded = loadExampleLibraryEntry("gap-unsupported-curved-material-lens");
    const loadAction = loaded.actions.find((action) => action.id === "load-example");
    const campaignAction = loaded.actions.find((action) => action.id === "add-to-engineering-evidence-campaign");

    expect(loaded.example.unsupported).toBe(true);
    expect(loaded.example.runnableInBrowser).toBe(false);
    expect(loadAction?.enabled).toBe(true);
    expect(loadAction?.target).toBe("gap-report");
    expect(campaignAction?.enabled).toBe(false);
    expect(loaded.routeDecision.status).toBe("unsupported");
  });
});

describe("L9.8 evidence and exports", () => {
  it("preserves example, route, scene, and evidence hashes when promoting eligible examples", () => {
    const loaded = loadExampleLibraryEntry("external-transparent-finite-block");
    const promotion = promoteExampleToEngineeringEvidenceCampaign(loaded.example, loaded.evidenceTask);

    expect(promotion.schema).toBe("emmicro.exampleLibrary.campaignPromotion.v1");
    expect(promotion.exampleId).toBe(loaded.example.id);
    expect(promotion.preservedHashes.exampleHash).toBe(loaded.example.exampleHash);
    expect(promotion.preservedHashes.routeHash).toBe(loaded.evidenceTask.routeHash);
    expect(promotion.preservedHashes.evidenceTaskHash).toBe(loaded.evidenceTask.taskHash);
    expect(promotion.evidencePromotion.campaignTarget).toBe("Engineering Evidence Campaign");
  });

  it("exports the required L9.8 report, registry, scene template, and wizard answer files", () => {
    const loaded = loadExampleLibraryEntry("scalar-circular-aperture-airy");
    const files = exampleLibraryExportFiles(loaded);

    expect(files.map((file) => file.filename)).toEqual([
      "example_report.md",
      "example_report.json",
      "example_registry.csv",
      "example_scene_template.json",
      "example_wizard_answers.json"
    ]);
    expect(files.find((file) => file.filename === "example_report.md")?.content).toContain("L9.8 Guided Example Report");
    expect(files.find((file) => file.filename === "example_registry.csv")?.content).toContain("scalar-circular-aperture-airy");
    expect(files.find((file) => file.filename === "example_scene_template.json")?.content).toContain("templateHash");
    expect(files.find((file) => file.filename === "example_wizard_answers.json")?.content).toContain("emmicro.simulationIntake.answers.v1");
  });

  it("keeps boundary language strict in reports and registry CSV output", () => {
    const loaded = loadExampleLibraryEntry("rcwa-binary-grating");
    const report = exampleLibraryReportMarkdown(loaded);
    const registryCsv = exampleLibraryRegistryCsv();
    const boundary = l98ExampleLibraryBoundary.join(" ");

    expect(report).toContain("not automatic correctness proofs");
    expect(report).toContain("not arbitrary 2D/aniso/conical/production RCWA");
    expect(boundary).toContain("does not add a new solver or new optical physics");
    expect(boundary).toContain("does not provide certified validation");
    expect(boundary).toContain("arbitrary 3D Maxwell");
    expect(boundary).toContain("FEM");
    expect(boundary).toContain("BEM");
    expect(registryCsv).toContain("example_id,title,category,difficulty");
    expect(registryCsv).toContain("gap-unsupported-curved-material-lens");
    expect(registryCsv).not.toMatch(/automatic correctness proof is complete|certified solver selection implemented|arbitrary 3D Maxwell execution is implemented|FEM\/BEM route implemented|production RCWA certified|production FDTD certified/i);
  });

  it("keeps L9.7/L9.6/L9.5/L9.4/L9.3/L9.2/L8.9 route seams visible through loaded examples", () => {
    const loaded = loadExampleLibraryEntry("evidence-engineering-campaign");
    const routeReasons = `${loaded.decision.why.join(" ")} ${loaded.evidenceTask.boundary.join(" ")} ${loaded.decision.boundary.join(" ")}`;

    expect(routeReasons).toContain("L9.4");
    expect(routeReasons).toContain("L9.5");
    expect(routeReasons).toContain("L9.6");
    expect(routeReasons).toContain("L9.7");
    expect(routeReasons).toContain("External FDTD");
    expect(loaded.actions.map((action) => action.id)).toEqual([
      "load-example",
      "open-wizard-answers",
      "show-solver-route",
      "generate-evidence-pack",
      "open-consistency-bench",
      "add-to-engineering-evidence-campaign",
      "export-example-report"
    ]);
  });
});

function ids(entries: ExampleLibraryEntry[]): string[] {
  return entries.map((entry) => entry.id);
}
