import { beforeAll, describe, expect, it } from "vitest";
import {
  createReleaseCandidatePackage,
  knownLimitationsMarkdown,
  l100ReleaseCandidateBoundary,
  publicDemoScriptMarkdown,
  releaseCandidateExportFiles,
  releaseManifestJson,
  releaseNotesMarkdown,
  reviewChecklistMarkdown
} from "./releaseCandidate";
import { createExampleLibraryRegistry } from "./exampleLibrary";

let pkg: ReturnType<typeof createReleaseCandidatePackage>;

beforeAll(() => {
  pkg = createReleaseCandidatePackage({
    commitSha: "test-sha",
    buildDateIso: "2026-06-07T00:00:00.000Z",
    githubPagesUrl: "https://monivibe.github.io/EM-Microscope/"
  });
}, 60000);

describe("L10.0 release candidate package", () => {
  it("creates visible release metadata and stable hashes", () => {
    expect(pkg.schema).toBe("emmicro.releaseCandidate.v1");
    expect(pkg.label).toBe("L10.0 Engineer Review Release Candidate");
    expect(pkg.version).toBe("L10.0 RC");
    expect(pkg.metadata.releaseLabel).toBe("L10.0 RC");
    expect(pkg.metadata.releaseTag).toBe("v0.10.0-rc.1");
    expect(pkg.metadata.commitSha).toBe("test-sha");
    expect(pkg.metadata.buildDateIso).toBe("2026-06-07T00:00:00.000Z");
    expect(pkg.releaseHash).toMatch(/^[0-9a-f]{16}$/i);
    expect(pkg.capabilitySnapshotHash).toMatch(/^[0-9a-f]{16}$/i);
    expect(pkg.exampleRegistryHash).toMatch(/^[0-9a-f]{16}$/i);
    expect(pkg.evidenceCampaignHash).toMatch(/^[0-9a-f]{16}$/i);
    expect(pkg.advisorPacketHash).toMatch(/^[0-9a-f]{16}$/i);
  });

  it("keeps the review front door focused on review-grade release packaging", () => {
    expect(pkg.reviewFrontDoor).toEqual([
      "Start here",
      "What this app can do",
      "What this app cannot do",
      "Suggested review path",
      "Generate advisor packet",
      "Known limitations",
      "Release build info"
    ]);
    expect(pkg.releasePurpose).toContain("engineer review");
    expect(pkg.releasePurpose).toContain("stable, public, tagged release candidate");
  });

  it("exports the required release-candidate files", () => {
    const files = releaseCandidateExportFiles(pkg);

    expect(files.map((file) => file.filename)).toEqual([
      "release_manifest.json",
      "release_notes.md",
      "review_checklist.md",
      "known_limitations.md",
      "public_demo_script.md"
    ]);
    expect(releaseManifestJson(pkg)).toContain("emmicro.releaseCandidate.v1");
    expect(releaseNotesMarkdown(pkg)).toContain("v0.10.0-rc.1");
    expect(reviewChecklistMarkdown(pkg)).toContain("npm test");
    expect(knownLimitationsMarkdown(pkg)).toContain("No arbitrary 3D Maxwell in browser");
    expect(publicDemoScriptMarkdown(pkg)).toContain("15-minute engineer review");
  });

  it("includes review paths that map to valid examples and workflows", () => {
    const registry = createExampleLibraryRegistry();
    const exampleIds = new Set(registry.entries.map((entry) => entry.id));

    expect(pkg.reviewPaths.map((path) => path.id)).toEqual(["fifteen-minute", "thirty-minute", "full-evidence"]);
    expect(pkg.reviewPaths.find((path) => path.id === "fifteen-minute")?.steps.length).toBeGreaterThanOrEqual(7);
    expect(pkg.reviewPaths.find((path) => path.id === "full-evidence")?.steps.length).toBeGreaterThanOrEqual(6);

    for (const path of pkg.reviewPaths) {
      for (const step of path.steps) {
        for (const id of step.exampleIds) {
          expect(exampleIds.has(id), `${path.id} step ${step.order} references ${id}`).toBe(true);
        }
        expect(step.expectedOutputs.length).toBeGreaterThan(0);
        expect(step.limitationsToReview.length).toBeGreaterThan(0);
      }
    }
  });

  it("lists implemented, diagnostic, external, scaffold, and not implemented capability truth rows", () => {
    const categories = new Set(pkg.knownLimitations.map((item) => item.category));

    expect(categories).toEqual(new Set(["implemented", "diagnostic-only", "external-only", "scaffold-only", "not-implemented"]));
    expect(pkg.knownLimitations.map((item) => item.label)).toContain("No arbitrary 3D Maxwell in browser");
    expect(pkg.knownLimitations.map((item) => item.label)).toContain("No production FDTD certification");
    expect(pkg.knownLimitations.map((item) => item.label)).toContain("No FEM/BEM");
    expect(pkg.knownLimitations.map((item) => item.label)).toContain("No production RCWA certification");
    expect(pkg.knownLimitations.map((item) => item.label)).toContain("No certified optical tolerancing");
    expect(pkg.knownLimitations.map((item) => item.label)).toContain("No full microscope digital twin");
    expect(pkg.knownLimitations.map((item) => item.label)).toContain("No manufacturing certification");
    expect(pkg.knownLimitations.map((item) => item.label)).toContain("No certified camera calibration");
  });

  it("includes a broad release smoke matrix and quality checks", () => {
    const smokeIds = pkg.smokeMatrix.map((item) => item.id);

    expect(smokeIds).toContain("l99-advisor-packet");
    expect(smokeIds).toContain("l98-example-library");
    expect(smokeIds).toContain("l97-wizard");
    expect(smokeIds).toContain("l96-consistency");
    expect(smokeIds).toContain("l95-evidence");
    expect(smokeIds).toContain("l94-router");
    expect(smokeIds).toContain("l93-rcwa");
    expect(smokeIds).toContain("l92-fdtd");
    expect(smokeIds).toContain("l89-external-fdtd");
    expect(smokeIds).toContain("l88-evidence-campaign");
    expect(smokeIds).toContain("l86-tolerance");
    expect(smokeIds).toContain("l7-diagnostics");
    expect(pkg.qualityChecks.map((item) => item.id)).toContain("lighthouse-public-quality");
  });

  it("links to the full current-state advisor packet exports", () => {
    expect(pkg.advisorPacketExportFilenames).toContain("advisor_packet.md");
    expect(pkg.advisorPacketExportFilenames).toContain("advisor_packet.html");
    expect(pkg.advisorPacketExportFilenames).toContain("advisor_claim_ledger.csv");
    expect(pkg.advisorPacketExportFilenames).toContain("advisor_gap_table.csv");
    expect(pkg.advisorPacketExportFilenames).toContain("advisor_reproducibility_manifest.json");
  });

  it("keeps release boundaries strict and avoids new solver or certification claims", () => {
    const combined = [
      releaseNotesMarkdown(pkg),
      knownLimitationsMarkdown(pkg),
      publicDemoScriptMarkdown(pkg),
      l100ReleaseCandidateBoundary.join(" ")
    ].join("\n");

    expect(combined).toContain("does not add a solver or new optical physics");
    expect(combined).toContain("not automatic correctness proof");
    expect(combined).toContain("certified validation");
    expect(combined).toContain("arbitrary 3D Maxwell");
    expect(combined).toContain("FEM/BEM");
    expect(combined).not.toMatch(/new solver physics|automatic correctness proof is complete|certified validation implemented|certified solver selection implemented|production RCWA certified|production FDTD certified|arbitrary 3D Maxwell execution is implemented|FEM\/BEM route implemented|digital twin certified|manufacturing certification available/i);
  });

  it("is deterministic for identical metadata", () => {
    const again = createReleaseCandidatePackage({
      commitSha: "test-sha",
      buildDateIso: "2026-06-07T00:00:00.000Z",
      githubPagesUrl: "https://monivibe.github.io/EM-Microscope/"
    });

    expect(again.releaseHash).toBe(pkg.releaseHash);
    expect(again.capabilitySnapshotHash).toBe(pkg.capabilitySnapshotHash);
  }, 60000);
});
