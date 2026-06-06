import { describe, expect, it } from "vitest";
import { defaultOpticalBenchScenario } from "./multiElementBench";
import {
  defaultToleranceThresholds,
  defaultToleranceVariationSpecs,
  runToleranceAnalysis,
  type ToleranceVariationSpec
} from "./processToleranceRunner";
import {
  createExampleRobustFdtdCandidateSweepSummary,
  createRobustFdtdCandidateSweepManifest,
  parseRobustFdtdCandidateSweepSummary,
  robustBeforeAfterMetricsCsv,
  robustCandidateTableCsv,
  robustDesignReportJson,
  robustDesignReportMarkdown,
  robustFdtdCandidateSweepSummaryJson,
  robustRecommendationsCsv,
  robustToleranceBudgetCsv,
  runRobustDesignAdvisor,
  validateRobustFdtdCandidateSweepSummary
} from "./robustDesignAdvisor";

function variationsWithLowSensitivityMetadata(): ToleranceVariationSpec[] {
  const specs = defaultToleranceVariationSpecs(defaultOpticalBenchScenario());
  return [
    ...specs,
    {
      id: "l87-source-power-metadata",
      label: "Source intensity metadata tolerance",
      targetKind: "source",
      targetId: "source",
      property: "sourceIntensityScale",
      unit: "relative",
      application: "relative",
      model: { kind: "plus-minus", delta: 0.1, includeNominal: true },
      enabled: true
    }
  ];
}

function runFastAdvisor(input: Parameters<typeof runRobustDesignAdvisor>[1] = {}) {
  return runRobustDesignAdvisor(defaultOpticalBenchScenario(), { gridMaxRuns: 6, candidateLimit: 5, ...input });
}

describe("L8.7 robust design advisor", () => {
  it("loads a baseline L8.6 tolerance result and preserves hashes", () => {
    const scenario = defaultOpticalBenchScenario();
    const variations = defaultToleranceVariationSpecs(scenario);
    const baseline = runToleranceAnalysis(scenario, { variations, thresholds: defaultToleranceThresholds(), mode: "one-at-a-time" });
    const report = runRobustDesignAdvisor(scenario, { baselineReport: baseline, variations, gridMaxRuns: 6, candidateLimit: 5 });

    expect(report.schema).toBe("emmicro.l87.robustDesignAdvisor.v1");
    expect(report.baselineToleranceReport.reportHash).toBe(baseline.reportHash);
    expect(report.baselineSceneHash).toBeTruthy();
    expect(report.baselineVariationHash).toBeTruthy();
    expect(report.candidates.length).toBeGreaterThan(0);
  });

  it("identifies high-sensitivity variables and generates ranked recommendations", () => {
    const report = runFastAdvisor({
      variations: variationsWithLowSensitivityMetadata(),
      rankingMode: "improvement-per-cost"
    });

    expect(report.toleranceBudget.some((row) => row.action === "tighten")).toBe(true);
    expect(report.recommendations.some((item) => item.actionKind === "tolerance-tighten")).toBe(true);
    expect(report.recommendations[0]?.improvementPerCost).toBeGreaterThanOrEqual(report.recommendations.at(-1)?.improvementPerCost ?? 0);
  });

  it("generates nominal recentering, tolerance-tightening, tolerance-relaxation, and robust-grid candidates", () => {
    const report = runFastAdvisor({
      variations: variationsWithLowSensitivityMetadata()
    });
    const actionKinds = report.candidates.map((candidate) => candidate.actionKind);

    expect(actionKinds).toContain("nominal-recenter");
    expect(actionKinds).toContain("tolerance-tighten");
    expect(actionKinds).toContain("tolerance-relax");
    expect(actionKinds).toContain("robust-grid");
  });

  it("ranks candidates by worst-case score, p90 score, pass rate, expected score, and improvement per cost", () => {
    const scenario = defaultOpticalBenchScenario();
    const variations = variationsWithLowSensitivityMetadata();
    const modes = ["worst-case", "p90", "pass-rate", "expected", "improvement-per-cost", "weighted"] as const;

    for (const rankingMode of modes) {
      const report = runRobustDesignAdvisor(scenario, { variations, rankingMode, gridMaxRuns: 6, candidateLimit: 3 });
      expect(report.bestCandidate?.candidateHash).toBeTruthy();
      expect(report.candidates.length).toBeGreaterThan(0);
      expect(report.rankingMode).toBe(rankingMode);
    }
  }, 20000);
});

describe("L8.7 candidate comparison", () => {
  it("compares baseline vs candidate nominal, worst-case, p90, pass-rate, and failure-driver metrics", () => {
    const report = runFastAdvisor({ variations: defaultToleranceVariationSpecs() });
    const candidate = report.candidates[0]!;

    expect(candidate.comparison.baselineNominalScore).toBeGreaterThanOrEqual(0);
    expect(candidate.comparison.candidateNominalScore).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(candidate.comparison.worstCaseImprovement)).toBe(true);
    expect(Number.isFinite(candidate.comparison.p90Improvement)).toBe(true);
    expect(Number.isFinite(candidate.comparison.passRateDelta)).toBe(true);
    expect(candidate.comparison.topFailureBefore).toBeTruthy();
    expect(candidate.comparison.topFailureAfter).toBeTruthy();
    expect(candidate.candidateHash).toBeTruthy();
    expect(candidate.report.sceneHash).toBeTruthy();
    expect(candidate.report.variationHash).toBeTruthy();
  });

  it("exports robust report JSON/Markdown and candidate/recommendation/before-after CSVs", () => {
    const report = runFastAdvisor({ variations: variationsWithLowSensitivityMetadata() });

    expect(JSON.parse(robustDesignReportJson(report)).schema).toBe("emmicro.l87.robustDesignAdvisor.v1");
    expect(robustDesignReportMarkdown(report)).toContain("diagnostic robust-design guidance");
    expect(robustCandidateTableCsv(report)).toContain("candidate_id,label,action_kind");
    expect(robustRecommendationsCsv(report)).toContain("recommendation_id,action_kind");
    expect(robustBeforeAfterMetricsCsv(report)).toContain("candidate_id,metric,baseline,candidate,delta");
    expect(robustToleranceBudgetCsv(report)).toContain("spec_id,label,property,action");
  });
});

describe("L8.7 tolerance budget advisor", () => {
  it("suggests tightening sensitive tolerances and relaxing low-sensitivity tolerances", () => {
    const report = runFastAdvisor({
      variations: variationsWithLowSensitivityMetadata()
    });

    expect(report.toleranceBudget.some((row) => row.action === "tighten" && row.recommendedDelta < row.currentDelta)).toBe(true);
    expect(report.toleranceBudget.some((row) => row.action === "relax" && row.recommendedDelta > row.currentDelta)).toBe(true);
  });

  it("respects locked parameters and min/max allowable tolerance bounds", () => {
    const scenario = defaultOpticalBenchScenario();
    const variations = defaultToleranceVariationSpecs(scenario);
    const lockedSpec = variations[0]!;
    const boundedSpec = variations[1]!;
    const report = runRobustDesignAdvisor(scenario, {
      variations,
      gridMaxRuns: 6,
      candidateLimit: 5,
      permissions: [
        { specId: lockedSpec.id, locked: true },
        { specId: boundedSpec.id, minDelta: 4, maxDelta: 4 }
      ]
    });

    expect(report.toleranceBudget.find((row) => row.specId === lockedSpec.id)?.action).toBe("locked");
    expect(report.candidates.every((candidate) => {
      const variation = candidate.variations.find((item) => item.id === lockedSpec.id);
      return variation?.model.kind !== "plus-minus" || variation.model.delta === lockedSpec.model.delta;
    })).toBe(true);
    const bounded = report.toleranceBudget.find((row) => row.specId === boundedSpec.id);
    expect(bounded?.recommendedDelta).toBeGreaterThanOrEqual(4);
    expect(bounded?.recommendedDelta).toBeLessThanOrEqual(4);
  });
});

describe("L8.7 external FDTD candidate sweep", () => {
  it("exports candidate sweep manifest and imports bundled candidate sweep summaries", () => {
    const report = runFastAdvisor({ variations: defaultToleranceVariationSpecs() });
    const manifest = createRobustFdtdCandidateSweepManifest(report, 6);
    const summary = createExampleRobustFdtdCandidateSweepSummary(manifest);
    const parsed = parseRobustFdtdCandidateSweepSummary(robustFdtdCandidateSweepSummaryJson(summary));

    expect(manifest.schema).toBe("emmicro.l87.fdtdCandidateSweepManifest.v1");
    expect(manifest.candidateCount).toBeGreaterThan(0);
    expect(parsed.summaryHash).toBe(summary.summaryHash);
    expect(validateRobustFdtdCandidateSweepSummary(manifest, parsed)).toHaveLength(0);
  });

  it("warns on baseline, candidate, and candidate sweep hash mismatches", () => {
    const report = runFastAdvisor({ variations: defaultToleranceVariationSpecs() });
    const manifest = createRobustFdtdCandidateSweepManifest(report, 6);
    const summary = {
      ...createExampleRobustFdtdCandidateSweepSummary(manifest),
      baselineSceneHash: "mismatch",
      baselineVariationHash: "mismatch",
      results: createExampleRobustFdtdCandidateSweepSummary(manifest).results.map((row, index) => index === 0 ? { ...row, candidateHash: "mismatch", toleranceSweepManifestHash: "mismatch" } : row)
    };

    expect(validateRobustFdtdCandidateSweepSummary(manifest, summary).map((warning) => warning.code)).toEqual(expect.arrayContaining([
      "robustDesign.fdtd.baselineSceneHashMismatch",
      "robustDesign.fdtd.baselineVariationHashMismatch",
      "robustDesign.fdtd.candidateHashMismatch",
      "robustDesign.fdtd.toleranceSweepHashMismatch"
    ]));
  });
});

describe("L8.7 boundaries and regressions", () => {
  it("does not claim certified tolerancing, automatic final design approval, full inverse design, in-browser FDTD, or arbitrary 3D Maxwell/FEM/BEM/RCWA", () => {
    const markdown = robustDesignReportMarkdown(runFastAdvisor({ variations: defaultToleranceVariationSpecs() }));

    expect(markdown).toContain("not certified optical tolerancing");
    expect(markdown).toContain("No automatic final design approval");
    expect(markdown).toContain("full inverse design");
    expect(markdown).toContain("production FDTD execution stays outside the browser");
    expect(markdown).toContain("arbitrary 3D Maxwell");
    expect(markdown).toContain("FEM/BEM/RCWA");
  });

  it("keeps the L8.6 tolerance runner working for the same default bench", () => {
    const scenario = defaultOpticalBenchScenario();
    const tolerance = runToleranceAnalysis(scenario, { variations: defaultToleranceVariationSpecs(scenario), mode: "deterministic-grid", gridMaxRuns: 12 });
    const robust = runRobustDesignAdvisor(scenario, { baselineReport: tolerance, gridMaxRuns: 6, candidateLimit: 5 });

    expect(tolerance.schema).toBe("emmicro.l86.toleranceReport.v1");
    expect(robust.baselineToleranceReport.reportHash).toBe(tolerance.reportHash);
  });
});
