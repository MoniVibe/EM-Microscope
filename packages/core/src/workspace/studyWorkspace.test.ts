import { describe, expect, it } from "vitest";
import type { FieldOutput2D } from "../solvers/Solver";
import { l41DefaultCoatingStack } from "../maxwell/coatingStack";
import type { CoatingSearchSpec } from "../maxwell/coatingSearch";
import type { RobustCoatingSearchSpec } from "../maxwell/coatingRobustSearch";
import { runCoherenceDemonstrator } from "../wave/coherenceDemonstrator";
import {
  capabilitiesCsv,
  capabilitiesMarkdown,
  compareStudyRuns,
  createFieldMarker,
  createStudySnapshot,
  detectFirstMinimum,
  distanceBetweenMarkers,
  findFieldMinimum,
  findFieldPeak,
  l66CapabilitiesMatrix,
  measureFieldRoi,
  parseStudyBundleJson,
  practicalSweepCsv,
  practicalSweepMarkdown,
  profileCsv,
  profileFromPairs,
  runCircularObservationZSweep,
  runCoatingRobustSigmaSweep,
  runCoherenceGammaSweep,
  runThinLensDefocusSweep,
  studyBundleJson,
  studyBundleMarkdown,
  studyComparisonCsv,
  studyComparisonMarkdown,
  studyMetricsCsv,
  studyProfilesCsv
} from "./studyWorkspace";

describe("L6.6 Practical Study Workspace core", () => {
  it("shows executable, scaffold-only, and not-implemented capability statuses without scientific overclaim", () => {
    const capabilities = l66CapabilitiesMatrix();
    const markdown = capabilitiesMarkdown(capabilities);
    const csv = capabilitiesCsv(capabilities);

    expect(capabilities.find((capability) => capability.id === "planar-tmm-backend")?.status).toBe("executable");
    expect(capabilities.find((capability) => capability.id === "external-fdtd-export")?.status).toBe("scaffold-only");
    expect(capabilities.find((capability) => capability.id === "3d-maxwell-solve")?.status).toBe("not-implemented");
    expect(capabilities.find((capability) => capability.id === "fdtd-fem-bem-rcwa-execution")?.status).toBe("not-implemented");
    expect(markdown).toContain("PlanarTmmBackend");
    expect(csv).toContain("ExternalFdtdBackend export");
    expect(`${markdown}\n${csv}`).not.toMatch(/3D Maxwell solve executed|FDTD solver executable|FEM\/BEM\/RCWA available|digital twin certified/i);
  });

  it("saves and reimports a validation study bundle deterministically", () => {
    const result = runCoherenceDemonstrator({ mode: "partial-coherence", coherence: { gammaMagnitude: 0.5, gammaPhaseRad: 0 } });
    const study = createStudySnapshot({
      id: "gamma-half-study",
      name: "Double slit coherence gamma sweep",
      mode: "validation.coherence",
      selectedWorkbench: "validation-bench",
      inputs: result.config,
      appState: { validationBenchmark: "coherence", gamma: 0.5 },
      backendReceipt: { label: "scalar validation" },
      materialReceipts: [{ materialId: "none", materialHash: "not-applicable" }],
      resultHashes: [result.resultHash],
      metrics: [
        { id: "visibility", label: "Fringe visibility", value: result.visibility.measured },
        { id: "orderSpacingMm", label: "Order spacing", value: result.expected.orderSpacingSmallAngleM * 1e3, unit: "mm" }
      ],
      profiles: {
        centerline: result.profile.slice(0, 5).map((sample) => ({ xM: sample.positionM, intensity: sample.partialIntensity }))
      },
      warnings: result.warnings,
      limitations: result.provenance.limitations,
      createdAtIso: "2026-06-05T00:00:00.000Z"
    });
    const bundle = studyBundleJson(study);
    const imported = parseStudyBundleJson(JSON.stringify(bundle));

    expect(imported.study.resultHash).toBe(study.resultHash);
    expect(imported.manifest.resultHashes).toEqual([result.resultHash]);
    expect(imported.manifest.materialReceiptCount).toBe(1);
    expect(imported.metricsCsv).toContain("visibility");
    expect(imported.profilesCsv).toContain("centerline");
    expect(studyMetricsCsv(study)).toContain("orderSpacingMm");
    expect(studyProfilesCsv(study)).toContain("centerline");
    expect(studyBundleMarkdown(bundle)).toContain("Capabilities");
  });

  it("saves a coating study with backend and material provenance receipts", () => {
    const study = createStudySnapshot({
      id: "coating-study",
      name: "AR coating robust optimizer run",
      mode: "coating.planar-stack",
      selectedWorkbench: "coating-stack-workbench",
      inputs: l41DefaultCoatingStack,
      backendReceipt: { label: "PlanarTmmBackend", availability: "executable" },
      materialReceipts: [{ materialId: "mgf2", materialHash: "hash-mgf2" }],
      uncertaintyReceipts: [{ model: "independent-thickness", sigmaNm: 2 }],
      resultHashes: ["stack-hash", "yield-hash"],
      metrics: [{ id: "reflectance", label: "Reflectance", value: 0.012 }],
      warnings: [{ code: "test.warning", message: "test warning" }],
      limitations: ["planar TMM only"],
      createdAtIso: "2026-06-05T00:00:00.000Z"
    });
    const bundle = studyBundleJson(study);

    expect(bundle.manifest.backendReceipt).toEqual({ label: "PlanarTmmBackend", availability: "executable" });
    expect(bundle.manifest.materialReceiptCount).toBe(1);
    expect(bundle.manifest.uncertaintyReceiptCount).toBe(1);
    expect(bundle.warningsJson).toHaveLength(1);
    expect(JSON.stringify(bundle)).toContain("planar TMM only");
  });

  it("runs gamma sweeps with monotonic visibility and exportable rows", () => {
    const sweep = runCoherenceGammaSweep({ start: 0, stop: 1, sampleCount: 6, maxRuns: 6 });
    const visibilities = sweep.rows.map((row) => row.metrics.find((metric) => metric.id === "visibility")?.value ?? Number.NaN);

    expect(sweep.schema).toBe("emmicro.practicalSweep.v1");
    expect(sweep.rows).toHaveLength(6);
    for (let i = 1; i < visibilities.length; i += 1) {
      expect(visibilities[i] ?? 0).toBeGreaterThanOrEqual((visibilities[i - 1] ?? 0) - 0.02);
    }
    expect(practicalSweepCsv(sweep)).toContain("visibility");
    expect(practicalSweepMarkdown(sweep)).toContain("Coherence gamma sweep");
  });

  it("runs observation z and thin-lens defocus sweeps with changing metrics and budget warnings", () => {
    const zSweep = runCircularObservationZSweep({ start: 12, stop: 40, sampleCount: 5, maxRuns: 5 });
    const expectedMinima = zSweep.rows.map((row) => row.metrics.find((metric) => metric.id === "expectedFirstMinimumMm")?.value ?? 0);
    const defocusSweep = runThinLensDefocusSweep({ start: -1, stop: 1, sampleCount: 5, maxRuns: 5 });
    const budgetSweep = runCoherenceGammaSweep({ start: 0, stop: 1, sampleCount: 40, maxRuns: 7 });

    expect(expectedMinima.at(-1)).toBeGreaterThan(expectedMinima[0] ?? 0);
    expect(defocusSweep.rows.some((row) => row.metrics.some((metric) => metric.id === "centerPeak"))).toBe(true);
    expect(budgetSweep.rows).toHaveLength(7);
    expect(budgetSweep.budget.truncated).toBe(true);
    expect(budgetSweep.warnings.some((warning) => warning.code === "l66.sweep.budgetTruncated")).toBe(true);
  });

  it("runs robust sigma sweeps over the existing planar robust optimizer", () => {
    const sweep = runCoatingRobustSigmaSweep(robustSpec(), { start: 0, stop: 8, sampleCount: 3, maxRuns: 3 });
    const worstScores = sweep.rows.map((row) => row.metrics.find((metric) => metric.id === "worstCaseScore")?.value ?? Number.NaN);

    expect(sweep.family).toBe("coating-robust-sigma");
    expect(sweep.rows).toHaveLength(3);
    expect(worstScores[0]).not.toBe(worstScores[2]);
    expect(practicalSweepCsv(sweep)).toContain("p90Score");
  });

  it("measures fields with crosshair markers, distances, peak/min finders, ROI, and profile CSV", () => {
    const field = fixtureField();
    const a = createFieldMarker(field, { id: "a", label: "A", uM: -1, vM: 0 });
    const b = createFieldMarker(field, { id: "b", label: "B", uM: 1, vM: 0 });
    const peak = findFieldPeak(field);
    const minimum = findFieldMinimum(field);
    const roi = measureFieldRoi(field, { uMinM: -1, uMaxM: 1, vMinM: -1, vMaxM: 1 });
    const profile = profileFromPairs([
      { xM: 0, intensity: 1 },
      { xM: 1, intensity: 0.3 },
      { xM: 2, intensity: 0 },
      { xM: 3, intensity: 0.4 }
    ]);
    const firstMinimum = detectFirstMinimum(profile);

    expect(a.units.u).toBe("m");
    expect(distanceBetweenMarkers(a, b)).toBeCloseTo(2);
    expect(peak.intensity).toBe(9);
    expect(minimum.intensity).toBe(0);
    expect(roi.sampleCount).toBe(9);
    expect(firstMinimum.status).toBe("measured");
    expect(firstMinimum.positionM).toBe(2);
    expect(profileCsv(profile)).toContain("x_m,intensity");
  });

  it("compares gamma=1 and gamma=0 runs with metric deltas and reports incompatible run types gracefully", () => {
    const gamma1 = runCoherenceDemonstrator({ mode: "partial-coherence", coherence: { gammaMagnitude: 1, gammaPhaseRad: 0 } });
    const gamma0 = runCoherenceDemonstrator({ mode: "partial-coherence", coherence: { gammaMagnitude: 0, gammaPhaseRad: 0 } });
    const comparison = compareStudyRuns(
      {
        id: "gamma1",
        label: "gamma=1",
        kind: "validation.coherence",
        resultHash: gamma1.resultHash,
        metrics: [{ id: "visibility", label: "Fringe visibility", value: gamma1.visibility.measured }],
        field: gamma1.partialField
      },
      {
        id: "gamma0",
        label: "gamma=0",
        kind: "validation.coherence",
        resultHash: gamma0.resultHash,
        metrics: [{ id: "visibility", label: "Fringe visibility", value: gamma0.visibility.measured }],
        field: gamma0.partialField
      }
    );
    const incompatible = compareStudyRuns(
      { id: "a", label: "A", kind: "validation.coherence", resultHash: "a", metrics: [], field: gamma1.partialField },
      { id: "b", label: "B", kind: "coating.planar-stack", resultHash: "b", metrics: [] }
    );

    expect(comparison.deltas[0]?.delta).toBeLessThan(0);
    expect(comparison.differenceField).toBeTruthy();
    expect(studyComparisonCsv(comparison)).toContain("visibility");
    expect(studyComparisonMarkdown(comparison)).toContain("gamma=1 vs gamma=0");
    expect(incompatible.warnings.some((warning) => warning.code === "studyComparison.incompatibleFields")).toBe(true);
    expect(incompatible.warnings.some((warning) => warning.code === "studyComparison.noCommonMetrics")).toBe(true);
  });
});

function fixtureField(): FieldOutput2D {
  return {
    id: "fixture",
    type: "fieldImage2D",
    planeId: "plane",
    gridId: "grid",
    xM: 0,
    width: 3,
    height: 3,
    uMinM: -1,
    uMaxM: 1,
    vMinM: -1,
    vMaxM: 1,
    intensity: new Float64Array([0, 1, 2, 3, 4, 5, 6, 7, 9]),
    normalization: "peak-normalized",
    units: {
      u: "m",
      v: "m",
      intensity: "relative"
    },
    provenance: {
      kind: "simulated",
      level: "L4",
      solverId: "em.fdtdIsland.l4",
      model: "em-fdtd-bounded",
      dimensionality: "2d",
      approximation: ["fixture only"]
    }
  };
}

function robustSpec(): RobustCoatingSearchSpec {
  return {
    id: "l66-test-robust-sweep",
    label: "L6.6 test robust sigma sweep",
    nominalSearch: basicNominalSpec(),
    uncertainty: {
      thickness: {
        mode: "deterministic-grid",
        sigmaNm: 2,
        sigmaLevels: [-1, 0, 1],
        maxSamplesPerCandidate: 5
      }
    },
    robustObjective: {
      primary: "p90Score"
    },
    candidateLimit: 3
  };
}

function basicNominalSpec(): CoatingSearchSpec {
  return {
    id: "l66-test-search",
    label: "L6.6 test nominal search",
    baseStack: {
      ...l41DefaultCoatingStack,
      layers: []
    },
    wavelengthsM: [550e-9],
    anglesRad: [0],
    polarizations: ["TE"],
    candidateMaterialIds: ["mgf2", "sio2"],
    layerCount: { min: 1, max: 1 },
    thicknessM: { min: 60e-9, max: 120e-9, step: 30e-9 },
    constraints: {
      disallowAdjacentSameMaterial: true,
      maxTotalThicknessM: 160e-9
    },
    objective: {
      terms: [{ metric: "reflectance", direction: "minimize", weight: 1 }]
    },
    search: {
      mode: "beam",
      beamWidth: 4,
      maxCandidates: 4,
      refinementPasses: 1,
      seed: 66
    }
  };
}
