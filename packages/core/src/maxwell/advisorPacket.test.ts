import { describe, expect, it } from "vitest";
import {
  advisorClaimLedgerCsv,
  advisorEvidenceTableCsv,
  advisorGapTableCsv,
  advisorPacketExportFiles,
  advisorPacketMarkdown,
  advisorPacketPresets,
  createAdvisorReviewPacket,
  createAdvisorReviewPacketFromPreset,
  evaluateAdvisorPacketCompleteness,
  l99AdvisorPacketBoundary,
  l99AdvisorPacketPrinciple
} from "./advisorPacket";
import { createExampleLibraryRegistry, loadExampleLibraryEntry } from "./exampleLibrary";

describe("L9.9 advisor packet builder", () => {
  it("creates a packet from selected examples", () => {
    const packet = createAdvisorReviewPacket({
      selectedExampleIds: ["scalar-circular-aperture-airy", "rcwa-binary-grating"],
      selectedSceneIds: ["consistency-tmm-rcwa"],
      reviewType: "First physics review"
    });

    expect(packet.schema).toBe("emmicro.advisorPacket.v1");
    expect(packet.label).toBe("L9.9 Advisor Review Packet / Evidence Dossier Generator");
    expect(packet.presetId).toBe("custom");
    expect(packet.selectedExampleIds).toEqual(["scalar-circular-aperture-airy", "rcwa-binary-grating"]);
    expect(packet.scenarios.map((scenario) => scenario.id)).toContain("example-scalar-circular-aperture-airy");
    expect(packet.scenarios.map((scenario) => scenario.id)).toContain("example-rcwa-binary-grating");
    expect(packet.packetHash).toMatch(/^[0-9a-f]{16}$/i);
  });

  it("creates a physics sanity preset", () => {
    const packet = createAdvisorReviewPacketFromPreset("physics-sanity");
    const titles = packet.scenarios.map((scenario) => scenario.title).join(" ");

    expect(packet.reviewType).toBe("First physics review");
    expect(packet.selectedExampleIds).toEqual([
      "scalar-circular-aperture-airy",
      "scalar-long-single-slit",
      "scalar-double-slit-order-spacing",
      "scalar-thin-lens-focal-plane",
      "scalar-coherence-demonstrator"
    ]);
    expect(titles).toContain("Circular aperture Airy/Bessel");
    expect(titles).toContain("Long single slit sinc^2");
    expect(titles).toContain("Double slit order spacing");
    expect(titles).toContain("Ideal thin lens focal plane");
    expect(titles).toContain("Coherence demonstrator");
  });

  it("creates a surface geometry preset", () => {
    const packet = createAdvisorReviewPacketFromPreset("surface-geometry");
    const titles = packet.scenarios.map((scenario) => scenario.title).join(" ");

    expect(packet.reviewType).toBe("Surface geometry review");
    expect(titles).toContain("transparent finite block");
    expect(titles).toContain("Absorbing block");
    expect(titles).toContain("Reflective plate");
    expect(titles).toContain("aperture");
    expect(titles).toContain("Tilted wedge");
  });

  it("creates a solver credibility preset", () => {
    const packet = createAdvisorReviewPacketFromPreset("solver-credibility");
    const cases = packet.consistencyCases.map((item) => item.id);

    expect(packet.reviewType).toBe("Solver credibility review");
    expect(cases).toContain("tmm-rcwa-no-pattern");
    expect(cases).toContain("fdtd-cpu-webgpu-parity");
    expect(cases).toContain("tmm-external-fdtd-slab");
    expect(packet.claimLedger.map((claim) => claim.id)).toContain("fdtd-webgpu-parity");
  });

  it("creates a workflow preset", () => {
    const packet = createAdvisorReviewPacketFromPreset("workflow");
    const titles = packet.scenarios.map((scenario) => scenario.title);

    expect(packet.reviewType).toBe("Optical bench workflow review");
    expect(titles).toContain("Build My Simulation wizard");
    expect(titles).toContain("Simulation Builder ordered bench");
    expect(titles).toContain("Solver router");
    expect(titles).toContain("Evidence autopack");
    expect(titles).toContain("Example library");
    expect(packet.selectedExampleIds).toContain("gap-unsupported-curved-material-lens");
  });

  it("creates a full current-state preset", () => {
    const packet = createAdvisorReviewPacketFromPreset("full-current-state");
    const registry = createExampleLibraryRegistry();

    expect(packet.reviewType).toBe("Full current-state review");
    expect(packet.selectedExampleIds).toEqual(registry.entries.map((entry) => entry.id));
    expect(packet.scenarios.length).toBeGreaterThan(registry.entries.length);
    expect(packet.consistencyCases.length).toBeGreaterThanOrEqual(7);
  });

  it("hashes packet contents deterministically", () => {
    const first = createAdvisorReviewPacketFromPreset("solver-credibility");
    const second = createAdvisorReviewPacketFromPreset("solver-credibility");

    expect(first.packetHash).toBe(second.packetHash);
    expect(first.completeness.reportHash).toBe(second.completeness.reportHash);
    expect(first.claimLedger.map((claim) => claim.claimHash)).toEqual(second.claimLedger.map((claim) => claim.claimHash));
  });
});

describe("L9.9 advisor packet claim ledger", () => {
  it("marks supported claims as supported", () => {
    const packet = createAdvisorReviewPacketFromPreset("full-current-state");

    expect(statusOf(packet, "scalar-airy-bessel")).toBe("supported");
    expect(statusOf(packet, "planar-tmm-rta")).toBe("supported");
    expect(statusOf(packet, "fdtd2d-browser")).toBe("supported");
    expect(statusOf(packet, "external-fdtd-import")).toBe("supported");
  });

  it("marks bounded diagnostic claims as diagnostic", () => {
    const packet = createAdvisorReviewPacketFromPreset("full-current-state");

    expect(statusOf(packet, "rcwa-preview-bounded")).toBe("diagnostic");
    expect(statusOf(packet, "camera-diagnostics")).toBe("diagnostic");
    expect(statusOf(packet, "iteration-count-not-validation")).toBe("diagnostic");
  });

  it("marks unsupported claims as unsupported", () => {
    const packet = createAdvisorReviewPacketFromPreset("full-current-state");

    expect(statusOf(packet, "arbitrary-3d-maxwell-unsupported")).toBe("unsupported");
  });

  it("marks not implemented claims as not implemented", () => {
    const packet = createAdvisorReviewPacketFromPreset("full-current-state");

    expect(statusOf(packet, "fem-bem-not-implemented")).toBe("not-implemented");
    expect(statusOf(packet, "certified-validation-not-implemented")).toBe("not-implemented");
  });

  it("includes evidence references for supported claims", () => {
    const packet = createAdvisorReviewPacketFromPreset("full-current-state");

    for (const claim of packet.claimLedger.filter((entry) => entry.status === "supported")) {
      expect(claim.evidenceReferences.length).toBeGreaterThan(0);
      expect(claim.evidenceReferences.join(" ")).not.toBe("none");
    }
  });

  it("includes limitations for every claim", () => {
    const packet = createAdvisorReviewPacketFromPreset("full-current-state");

    expect(packet.claimLedger.every((claim) => claim.limitations.length > 0)).toBe(true);
  });
});

describe("L9.9 advisor packet completeness", () => {
  it("reports complete when evidence, residuals, limitations, and hashes exist", () => {
    const packet = createAdvisorReviewPacketFromPreset("physics-sanity");

    expect(packet.completeness.scorePercent).toBe(100);
    expect(packet.completeness.summary.missing).toBe(0);
    expect(packet.completeness.summary.warning).toBe(0);
  });

  it("warns when residuals are missing", () => {
    const packet = createAdvisorReviewPacketFromPreset("physics-sanity");
    const altered = {
      ...packet,
      scenarios: packet.scenarios.map((scenario, index) => index === 0 ? { ...scenario, residuals: [] } : scenario)
    };

    expect(completenessStatus(altered, "residual-present")).toBe("warning");
  });

  it("warns when convergence/stability evidence is missing", () => {
    const packet = createAdvisorReviewPacketFromPreset("physics-sanity");
    const altered = {
      ...packet,
      scenarios: packet.scenarios.map((scenario, index) => index === 0 ? { ...scenario, convergenceStabilityConsistency: [] } : scenario)
    };

    expect(completenessStatus(altered, "convergence-stability-consistency-present")).toBe("warning");
  });

  it("warns when limitations are missing", () => {
    const packet = createAdvisorReviewPacketFromPreset("physics-sanity");
    const altered = {
      ...packet,
      claimLedger: packet.claimLedger.map((claim, index) => index === 0 ? { ...claim, limitations: [] } : claim)
    };

    expect(completenessStatus(altered, "limitations-present")).toBe("warning");
  });

  it("warns when unsupported items are not listed", () => {
    const packet = createAdvisorReviewPacketFromPreset("physics-sanity");
    const altered = {
      ...packet,
      gaps: [],
      claimLedger: packet.claimLedger.filter((claim) => claim.status !== "unsupported" && claim.status !== "not-implemented")
    };

    expect(completenessStatus(altered, "unsupported-items-listed")).toBe("warning");
  });

  it("reports not-applicable items correctly", () => {
    const packet = createAdvisorReviewPacket({
      selectedExampleIds: [],
      selectedSceneIds: ["workflow-build-my-simulation"],
      includeConsistencyBench: false,
      reviewType: "Optical bench workflow review"
    });

    expect(packet.completeness.items.find((item) => item.id === "solver-route-present")?.status).toBe("not-applicable");
    expect(packet.completeness.items.find((item) => item.id === "evidence-task-present")?.status).toBe("not-applicable");
  });
});

describe("L9.9 advisor packet exports", () => {
  it("exports Markdown packet", () => {
    const packet = createAdvisorReviewPacketFromPreset("solver-credibility");
    const markdown = advisorPacketMarkdown(packet);

    expect(markdown).toContain("L9.9 Advisor Review Packet / Evidence Dossier");
    expect(markdown).toContain(l99AdvisorPacketPrinciple);
    expect(markdown).toContain("## Claim Ledger");
  });

  it("exports JSON packet", () => {
    const file = advisorPacketExportFiles(createAdvisorReviewPacketFromPreset("physics-sanity")).find((item) => item.filename === "advisor_packet.json");

    expect(file?.content).toContain("emmicro.advisorPacket.v1");
    expect(file?.content).toContain("packetHash");
  });

  it("exports summary CSV", () => {
    const file = advisorPacketExportFiles(createAdvisorReviewPacketFromPreset("physics-sanity")).find((item) => item.filename === "advisor_packet_summary.csv");

    expect(file?.content).toContain("packet_hash,preset,review_type,completeness");
  });

  it("exports claim ledger CSV", () => {
    const csv = advisorClaimLedgerCsv(createAdvisorReviewPacketFromPreset("full-current-state"));

    expect(csv).toContain("claim_id,claim,status,category");
    expect(csv).toContain("arbitrary-3d-maxwell-unsupported");
  });

  it("exports evidence table CSV", () => {
    const csv = advisorEvidenceTableCsv(createAdvisorReviewPacketFromPreset("solver-credibility"));

    expect(csv).toContain("evidence_id,label,source,status");
    expect(csv).toContain("TMM vs RCWA no-pattern consistency");
  });

  it("exports gap table CSV", () => {
    const csv = advisorGapTableCsv(createAdvisorReviewPacketFromPreset("full-current-state"));

    expect(csv).toContain("gap_id,feature,status");
    expect(csv).toContain("Arbitrary 3D Maxwell");
    expect(csv).toContain("FEM/BEM solver");
  });

  it("exports review questions Markdown", () => {
    const file = advisorPacketExportFiles(createAdvisorReviewPacketFromPreset("workflow")).find((item) => item.filename === "advisor_review_questions.md");

    expect(file?.content).toContain("L9.9 Advisor Review Questions");
    expect(file?.content).toContain("Which claims need stronger numeric residuals");
  });

  it("exports reproducibility manifest JSON", () => {
    const file = advisorPacketExportFiles(createAdvisorReviewPacketFromPreset("solver-credibility")).find((item) => item.filename === "advisor_reproducibility_manifest.json");

    expect(file?.content).toContain("emmicro.advisorPacket.reproducibilityManifest.v1");
    expect(file?.content).toContain("receipts");
  });

  it("exports the required packet file set plus HTML", () => {
    const files = advisorPacketExportFiles(createAdvisorReviewPacketFromPreset("physics-sanity"));

    expect(files.map((file) => file.filename)).toEqual([
      "advisor_packet.md",
      "advisor_packet.json",
      "advisor_packet_summary.csv",
      "advisor_claim_ledger.csv",
      "advisor_evidence_table.csv",
      "advisor_gap_table.csv",
      "advisor_review_questions.md",
      "advisor_reproducibility_manifest.json",
      "advisor_packet.html"
    ]);
  });
});

describe("L9.9 boundaries and regressions", () => {
  it("does not claim certified validation", () => {
    const packet = createAdvisorReviewPacketFromPreset("full-current-state");
    const combined = `${advisorPacketMarkdown(packet)} ${l99AdvisorPacketBoundary.join(" ")}`;

    expect(combined).toContain("does not provide certified validation");
    expect(combined).not.toMatch(/certified validation report exists|certified validation implemented|validated without advisor review/i);
  });

  it("does not claim automatic correctness proof", () => {
    const packet = createAdvisorReviewPacketFromPreset("physics-sanity");

    expect(packet.claimsNotMade.join(" ")).toContain("Automatic correctness proof is not claimed");
    expect(advisorPacketMarkdown(packet)).not.toMatch(/automatic correctness proof is complete|solver correctness certified/i);
  });

  it("does not claim arbitrary 3D Maxwell/FEM/BEM", () => {
    const packet = createAdvisorReviewPacketFromPreset("full-current-state");
    const ledger = advisorClaimLedgerCsv(packet);

    expect(ledger).toContain("Arbitrary 3D Maxwell runs in browser,unsupported");
    expect(ledger).toContain("FEM/BEM solver exists,not-implemented");
    expect(advisorPacketMarkdown(packet)).not.toMatch(/arbitrary 3D Maxwell execution is implemented|FEM\/BEM route implemented/i);
  });

  it("does not mark unsupported examples executable", () => {
    const unsupported = loadExampleLibraryEntry("gap-unsupported-curved-material-lens");
    const packet = createAdvisorReviewPacket({ selectedExampleIds: ["gap-unsupported-curved-material-lens"] });
    const scenario = packet.scenarios.find((item) => item.exampleId === "gap-unsupported-curved-material-lens");

    expect(unsupported.example.runnableInBrowser).toBe(false);
    expect(unsupported.routeDecision.status).toBe("unsupported");
    expect(scenario?.runnable).toBe(false);
    expect(scenario?.solverId).toBe("unsupported");
  });

  it("keeps L9.8 example library working", () => {
    const registry = createExampleLibraryRegistry();

    expect(registry.label).toBe("L9.8 Guided Example Library / Known Experiment Pack");
    expect(registry.entries.map((entry) => entry.id)).toContain("scalar-circular-aperture-airy");
    expect(loadExampleLibraryEntry("rcwa-binary-grating").evidenceTask.taskType).toBe("rcwa-convergence");
  });

  it("keeps L9.7 wizard working", () => {
    const loaded = loadExampleLibraryEntry("external-transparent-finite-block");

    expect(loaded.decision.label).toBe("L9.7 Solver Method Decision Wizard / Simulation Intake");
    expect(loaded.decision.generatedTemplate.templateHash).not.toHaveLength(0);
  });

  it("keeps L9.6 consistency bench working", () => {
    const packet = createAdvisorReviewPacketFromPreset("solver-credibility");

    expect(packet.consistencyCases.map((item) => item.id)).toContain("tmm-rcwa-no-pattern");
    expect(packet.consistencyCases.map((item) => item.id)).toContain("fdtd-cpu-webgpu-parity");
  });

  it("keeps L9.5 evidence autopack working", () => {
    const loaded = loadExampleLibraryEntry("fdtd2d-point-source");

    expect(loaded.evidenceTask.schema).toBe("emmicro.solverEvidenceTask.v1");
    expect(loaded.evidenceTask.generatedArtifacts.length).toBeGreaterThan(0);
  });

  it("keeps L9.3 RCWA working", () => {
    const loaded = loadExampleLibraryEntry("rcwa-binary-grating");

    expect(loaded.routeDecision.recommendedSolver).toBe("rcwa-1d-preview");
    expect(loaded.actions.map((action) => action.label)).toContain("Load Example");
  });

  it("keeps L9.2 FDTD working", () => {
    const loaded = loadExampleLibraryEntry("fdtd2d-point-source");

    expect(loaded.fdtd2dScene?.id).toBe("l92-point-source-symmetry");
    expect(loaded.evidenceTask.taskType).toBe("fdtd2d-validation");
  });

  it("keeps L8.9 external run ingestion working", () => {
    const loaded = loadExampleLibraryEntry("external-transparent-finite-block");

    expect(loaded.routeDecision.recommendedSolver).toBe("external-fdtd-meep");
    expect(loaded.evidenceTask.taskType).toBe("external-fdtd-run-pack");
    expect(loaded.evidenceTask.generatedArtifacts.map((item) => item.filename)).toContain("external_fdtd_run_pack/scene_manifest.json");
  });

  it("keeps presets registered in a review-friendly order", () => {
    expect(advisorPacketPresets.map((preset) => preset.id)).toEqual([
      "physics-sanity",
      "surface-geometry",
      "solver-credibility",
      "workflow",
      "full-current-state"
    ]);
  });
});

function statusOf(packet: ReturnType<typeof createAdvisorReviewPacket>, id: string) {
  return packet.claimLedger.find((claim) => claim.id === id)?.status;
}

function completenessStatus(packet: ReturnType<typeof createAdvisorReviewPacket>, id: ReturnType<typeof createAdvisorReviewPacket>["completeness"]["items"][number]["id"]) {
  return evaluateAdvisorPacketCompleteness(packet).items.find((item) => item.id === id)?.status;
}
