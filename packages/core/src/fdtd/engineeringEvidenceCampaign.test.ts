import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createEngineeringEvidenceCampaignBundle,
  engineeringEvidenceCampaignManifestJson,
  engineeringEvidenceCapabilityTruthTableCsv,
  engineeringEvidenceConvergenceSummaryCsv,
  engineeringEvidenceDossierJson,
  engineeringEvidenceDossierMarkdown,
  engineeringEvidenceRobustCandidateSummaryCsv,
  engineeringEvidenceScenarioSummaryCsv,
  engineeringEvidenceToleranceSummaryCsv,
  engineeringEvidenceUnsupportedItemsCsv,
  goldenEvidenceCampaignSummaryJson,
  l88EngineeringEvidenceBoundary,
  parseEngineeringEvidenceCampaignManifest,
  parseGoldenEvidenceCampaignSummary,
  validateEngineeringEvidenceCampaign
} from "./engineeringEvidenceCampaign";
import { defaultOpticalBenchScenario } from "../maxwell/multiElementBench";
import { defaultToleranceThresholds, defaultToleranceVariationSpecs, runToleranceAnalysis } from "../maxwell/processToleranceRunner";
import { runRobustDesignAdvisor } from "../maxwell/robustDesignAdvisor";

const cachedBundle = createEngineeringEvidenceCampaignBundle();
const cachedManifest = cachedBundle.manifest;
const cachedSummary = cachedBundle.summary;

describe("engineering evidence campaign", () => {
  it("imports campaign_manifest.json and golden campaign summary", () => {
    const manifest = parseEngineeringEvidenceCampaignManifest(engineeringEvidenceCampaignManifestJson(cachedManifest));
    const summary = parseGoldenEvidenceCampaignSummary(goldenEvidenceCampaignSummaryJson(cachedSummary));
    expect(manifest.schema).toBe("emmicro.l88.evidenceCampaignManifest.v1");
    expect(summary.schema).toBe("emmicro.l88.goldenCampaignSummary.v1");
    expect(validateEngineeringEvidenceCampaign(manifest, summary)).toHaveLength(0);
  });

  it("imports the checked-in tools/evidence campaign bundle", () => {
    const evidenceRoot = resolve(process.cwd(), "../../tools/evidence");
    const manifest = parseEngineeringEvidenceCampaignManifest(readFileSync(resolve(evidenceRoot, "campaign_manifest.json"), "utf8"));
    const summary = parseGoldenEvidenceCampaignSummary(readFileSync(resolve(evidenceRoot, "expected/golden_campaign_summary.json"), "utf8"));
    const folders = [
      "transparent_slab",
      "absorbing_slab",
      "reflective_plate",
      "long_slit",
      "circular_pinhole",
      "multielement_chain",
      "robust_candidate"
    ];

    expect(validateEngineeringEvidenceCampaign(manifest, summary)).toHaveLength(0);
    for (const folder of folders) {
      for (const filename of ["scene.json", "meep_scene.py", "reference.json", "imported_result_summary.json", "convergence_summary.json"]) {
        expect(existsSync(resolve(evidenceRoot, "scenarios", folder, filename))).toBe(true);
      }
    }
  });

  it("validates scenario references, statuses, and preserved hashes", () => {
    const summary = cachedSummary;
    expect(summary.scenarios.map((scenario) => scenario.id)).toEqual([
      "transparent-slab",
      "absorbing-slab",
      "reflective-plate",
      "long-slit",
      "circular-pinhole",
      "multielement-chain",
      "robust-candidate"
    ]);
    for (const scenario of summary.scenarios) {
      expect(scenario.referenceModel.length).toBeGreaterThan(3);
      expect(Number.isFinite(scenario.residual)).toBe(true);
      expect(scenario.receipts.sceneHash || scenario.receipts.resultHash || scenario.receipts.summaryHash).toBeTruthy();
      expect(["pass", "warning", "fail"]).toContain(scenario.status);
    }
  });

  it("reports capability truth table rows", () => {
    const summary = cachedSummary;
    expect(summary.capabilityTruthTable.find((row) => row.id === "engineering-evidence-campaign")?.status).toBe("executable");
    expect(summary.capabilityTruthTable.find((row) => row.id === "certified-validation")?.status).toBe("not-implemented");
    expect(summary.capabilityTruthTable.find((row) => row.id === "external-fdtd-backend")?.status).toBe("scaffold-only");
  });
});

describe("evidence scenario validation", () => {
  it("validates transparent slab against Fresnel/TMM reference", () => {
    const scenario = cachedSummary.scenarios.find((row) => row.id === "transparent-slab")!;
    expect(scenario.referenceModel).toBe("planar-tmm-stack");
    expect(scenario.residual).toBeLessThan(0.08);
    expect(scenario.status).not.toBe("fail");
  });

  it("validates absorbing slab against Beer-Lambert/TMM reference", () => {
    const scenario = cachedSummary.scenarios.find((row) => row.id === "absorbing-slab")!;
    expect(scenario.referenceModel).toBe("beer-lambert");
    expect(scenario.computed.absorbance).toBeGreaterThan(0);
    expect(scenario.status).not.toBe("fail");
  });

  it("validates reflective plate against ideal mirror reference", () => {
    const scenario = cachedSummary.scenarios.find((row) => row.id === "reflective-plate")!;
    expect(scenario.referenceModel).toBe("ideal-mirror");
    expect(scenario.expected.reflectance).toBe(1);
    expect(scenario.computed.reflectance).toBeGreaterThan(0.9);
  });

  it("validates long slit and circular aperture scalar references", () => {
    const summary = cachedSummary;
    const slit = summary.scenarios.find((row) => row.id === "long-slit")!;
    const circular = summary.scenarios.find((row) => row.id === "circular-pinhole")!;
    expect(slit.referenceModel).toBe("single-slit-sinc2");
    expect(circular.referenceModel).toBe("airy-bessel");
    expect(circular.convergenceStatus).toBeTruthy();
  });

  it("validates multi-element chain receipts", () => {
    const scenario = cachedSummary.scenarios.find((row) => row.id === "multielement-chain")!;
    expect(scenario.referenceModel).toBe("stage-by-stage receipts");
    expect(scenario.receipts.manifestHash).toBeTruthy();
    expect(scenario.receipts.scriptHash).toBeTruthy();
  });
});

describe("tolerance and robust evidence", () => {
  it("imports L8.6 variation summary into campaign", () => {
    const summary = cachedSummary;
    expect(summary.toleranceSummary.reportHash).toMatch(/^[0-9a-f]+$/);
    expect(summary.toleranceSummary.sweepManifestHash).toBeTruthy();
    expect(summary.toleranceSummary.topSensitivity).not.toBe("none");
  });

  it("imports L8.7 robust candidate summary into campaign", () => {
    const summary = cachedSummary;
    expect(summary.robustSummary.reportHash).toMatch(/^[0-9a-f]+$/);
    expect(summary.robustSummary.sweepManifestHash).toBeTruthy();
    expect(summary.robustSummary.bestCandidateLabel).not.toBe("none");
  });

  it("compares baseline vs candidate metrics and reports remaining failures", () => {
    const summary = cachedSummary;
    expect(Number.isFinite(summary.robustSummary.passRateDelta)).toBe(true);
    expect(Number.isFinite(summary.robustSummary.worstCaseImprovement)).toBe(true);
    expect(summary.robustSummary.remainingFailureDriver.length).toBeGreaterThan(0);
  });
});

describe("evidence dossier export", () => {
  it("exports Markdown and JSON dossiers", () => {
    const summary = cachedSummary;
    expect(engineeringEvidenceDossierMarkdown(summary)).toContain("Iteration count is not validation");
    expect(engineeringEvidenceDossierMarkdown(summary)).toContain("## Limitations");
    expect(JSON.parse(engineeringEvidenceDossierJson(summary)).schema).toBe("emmicro.l88.goldenCampaignSummary.v1");
  });

  it("exports scenario, convergence, tolerance, robust, truth, and unsupported CSVs", () => {
    const summary = cachedSummary;
    expect(engineeringEvidenceScenarioSummaryCsv(summary)).toContain("scenario_id,label,reference_model");
    expect(engineeringEvidenceConvergenceSummaryCsv(summary)).toContain("final_residual");
    expect(engineeringEvidenceToleranceSummaryCsv(summary)).toContain("variation_hash");
    expect(engineeringEvidenceRobustCandidateSummaryCsv(summary)).toContain("best_candidate");
    expect(engineeringEvidenceCapabilityTruthTableCsv(summary)).toContain("capability_id,label,status");
    expect(engineeringEvidenceUnsupportedItemsCsv(summary)).toContain("browser-fdtd");
  });
});

describe("L8.8 boundaries and regressions", () => {
  it("does not claim certified validation or production solver features", () => {
    const boundary = l88EngineeringEvidenceBoundary.join(" ");
    expect(boundary).toContain("not certified validation");
    expect(boundary).toContain("in-browser FDTD");
    expect(boundary).toContain("arbitrary 3D Maxwell");
    expect(boundary).toContain("FEM/BEM/RCWA");
    expect(boundary).toContain("digital twin");
    expect(boundary).toContain("manufacturing certification");
  });

  it("keeps L8.7 robust advisor and L8.6 tolerance runner working", () => {
    const scenario = defaultOpticalBenchScenario();
    const tolerance = runToleranceAnalysis(scenario, {
      variations: defaultToleranceVariationSpecs(scenario),
      thresholds: defaultToleranceThresholds(),
      mode: "deterministic-grid",
      gridMaxRuns: 6
    });
    const robust = runRobustDesignAdvisor(scenario, { baselineReport: tolerance, candidateLimit: 3, gridMaxRuns: 6 });
    expect(tolerance.schema).toBe("emmicro.l86.toleranceReport.v1");
    expect(robust.schema).toBe("emmicro.l87.robustDesignAdvisor.v1");
    expect(robust.candidates.length).toBeGreaterThan(0);
  });

  it("keeps L8.8 manifest and summary validation strict", () => {
    const manifest = cachedManifest;
    const summary = cachedSummary;
    const bad = { ...summary, manifestHash: "mismatch" };
    expect(validateEngineeringEvidenceCampaign(manifest, bad).map((warning) => warning.code)).toContain("evidenceCampaign.manifestHashMismatch");
  });
});
