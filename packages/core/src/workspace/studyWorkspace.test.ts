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
  l68CapabilitiesMatrix,
  l69CapabilitiesMatrix,
  l70CapabilitiesMatrix,
  l71CapabilitiesMatrix,
  l72CapabilitiesMatrix,
  l73CapabilitiesMatrix,
  l74CapabilitiesMatrix,
  l75CapabilitiesMatrix,
  l76CapabilitiesMatrix,
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
    const l68Capabilities = l68CapabilitiesMatrix();
    const l69Capabilities = l69CapabilitiesMatrix();
    const l70Capabilities = l70CapabilitiesMatrix();
    const l71Capabilities = l71CapabilitiesMatrix();
    const l72Capabilities = l72CapabilitiesMatrix();
    const l73Capabilities = l73CapabilitiesMatrix();
    const l74Capabilities = l74CapabilitiesMatrix();
    const l75Capabilities = l75CapabilitiesMatrix();
    const l76Capabilities = l76CapabilitiesMatrix();
    const markdown = capabilitiesMarkdown(capabilities);
    const csv = capabilitiesCsv(capabilities);

    expect(capabilities.find((capability) => capability.id === "planar-tmm-backend")?.status).toBe("executable");
    expect(l68Capabilities.find((capability) => capability.id === "camera-sensor-lite-acquisition")?.status).toBe("executable");
    expect(l69Capabilities.find((capability) => capability.id === "camera-calibration-diagnostics")?.status).toBe("executable");
    expect(l70Capabilities.find((capability) => capability.id === "resolution-mtf-diagnostics")?.status).toBe("executable");
    expect(l70Capabilities.find((capability) => capability.id === "slanted-edge-sfr-diagnostics")?.status).toBe("executable");
    expect(l71Capabilities.find((capability) => capability.id === "focus-sweep-mtf-diagnostics")?.status).toBe("executable");
    expect(l71Capabilities.find((capability) => capability.id === "field-mtf-map-diagnostics")?.status).toBe("executable");
    expect(l71Capabilities.find((capability) => capability.id === "mtf-qualification-threshold-report")?.status).toBe("executable");
    expect(l72Capabilities.find((capability) => capability.id === "geometric-distortion-diagnostics")?.status).toBe("executable");
    expect(l72Capabilities.find((capability) => capability.id === "pixel-scale-diagnostic-calibration")?.status).toBe("executable");
    expect(l73Capabilities.find((capability) => capability.id === "dot-grid-target-detection")?.status).toBe("executable");
    expect(l73Capabilities.find((capability) => capability.id === "checkerboard-target-detection")?.status).toBe("scaffold-only");
    expect(l74Capabilities.find((capability) => capability.id === "batch-measurement-session-qa")?.status).toBe("executable");
    expect(l74Capabilities.find((capability) => capability.id === "repeatability-diagnostics")?.status).toBe("executable");
    expect(l75Capabilities.find((capability) => capability.id === "synthetic-fiducial-board-workflow")?.status).toBe("executable");
    expect(l75Capabilities.find((capability) => capability.id === "fiducial-detection-import")?.status).toBe("executable");
    expect(l75Capabilities.find((capability) => capability.id === "charuco-style-fiducial-matching")?.status).toBe("executable");
    expect(l75Capabilities.find((capability) => capability.id === "fiducial-manual-correction")?.status).toBe("executable");
    expect(l75Capabilities.find((capability) => capability.id === "fiducial-geometry-session-handoff")?.status).toBe("executable");
    expect(l76Capabilities.find((capability) => capability.id === "external-detector-json-csv-import")?.status).toBe("executable");
    expect(l76Capabilities.find((capability) => capability.id === "detector-receipt-validation")?.status).toBe("executable");
    expect(l76Capabilities.find((capability) => capability.id === "external-detector-comparison")?.status).toBe("executable");
    expect(l76Capabilities.find((capability) => capability.id === "detector-bridge-reports")?.status).toBe("executable");
    expect(l76Capabilities.find((capability) => capability.id === "opencv-charuco-external-helper")?.status).toBe("executable");
    expect(l76Capabilities.find((capability) => capability.id === "opencv-detector-json-import")?.status).toBe("executable");
    expect(l76Capabilities.find((capability) => capability.id === "detector-roundtrip-wizard")?.status).toBe("executable");
    expect(l76Capabilities.find((capability) => capability.id === "detector-roundtrip-acceptance-reports")?.status).toBe("executable");
    expect(capabilities.find((capability) => capability.id === "external-fdtd-scene-manifest-export")?.status).toBe("executable");
    expect(capabilities.find((capability) => capability.id === "external-meep-script-export")?.status).toBe("executable");
    expect(capabilities.find((capability) => capability.id === "external-fdtd-result-import")?.status).toBe("executable");
    expect(capabilities.find((capability) => capability.id === "external-fdtd-benchmark-export")?.status).toBe("executable");
    expect(capabilities.find((capability) => capability.id === "external-fdtd-convergence-import")?.status).toBe("executable");
    expect(capabilities.find((capability) => capability.id === "external-fdtd-convergence-diagnostics")?.status).toBe("executable");
    expect(capabilities.find((capability) => capability.id === "external-fdtd-finite-surface-geometry-export")?.status).toBe("executable");
    expect(capabilities.find((capability) => capability.id === "external-fdtd-surface-geometry-fixtures")?.status).toBe("executable");
    expect(capabilities.find((capability) => capability.id === "surface-geometry-xz-cross-section")?.status).toBe("executable");
    expect(capabilities.find((capability) => capability.id === "external-fdtd-backend-runner")?.status).toBe("scaffold-only");
    expect(capabilities.find((capability) => capability.id === "browser-fdtd-execution")?.status).toBe("not-implemented");
    expect(capabilities.find((capability) => capability.id === "3d-maxwell-solve")?.status).toBe("not-implemented");
    expect(capabilities.find((capability) => capability.id === "fdtd-fem-bem-rcwa-execution")?.status).toBe("not-implemented");
    expect(l68Capabilities.find((capability) => capability.id === "pixel-level-sensor-stack")?.status).toBe("not-implemented");
    expect(l68Capabilities.find((capability) => capability.id === "certified-emva-characterization")?.status).toBe("not-implemented");
    expect(l69Capabilities.find((capability) => capability.id === "emva-1288-certification")?.status).toBe("not-implemented");
    expect(l70Capabilities.find((capability) => capability.id === "iso-12233-certification")?.status).toBe("not-implemented");
    expect(l70Capabilities.find((capability) => capability.id === "imatest-equivalent-certification")?.status).toBe("not-implemented");
    expect(l70Capabilities.find((capability) => capability.id === "pure-lens-mtf-certification")?.status).toBe("not-implemented");
    expect(l71Capabilities.find((capability) => capability.id === "calibrated-optical-model-fitting")?.status).toBe("not-implemented");
    expect(l72Capabilities.find((capability) => capability.id === "certified-camera-calibration")?.status).toBe("not-implemented");
    expect(l72Capabilities.find((capability) => capability.id === "lab-accredited-metrology")?.status).toBe("not-implemented");
    expect(l72Capabilities.find((capability) => capability.id === "full-3d-pose-calibration")?.status).toBe("not-implemented");
    expect(l72Capabilities.find((capability) => capability.id === "stereo-calibration")?.status).toBe("not-implemented");
    expect(l73Capabilities.find((capability) => capability.id === "apriltag-aruco-detection")?.status).toBe("not-implemented");
    expect(l76Capabilities.find((capability) => capability.id === "browser-native-opencv-aruco-detector")?.status).toBe("not-implemented");
    expect(l76Capabilities.find((capability) => capability.id === "apriltag-decoder")?.status).toBe("not-implemented");
    expect(l74Capabilities.find((capability) => capability.id === "certified-metrology-report")?.status).toBe("not-implemented");
    expect(l74Capabilities.find((capability) => capability.id === "lab-accreditation-workflow")?.status).toBe("not-implemented");
    expect(markdown).toContain("PlanarTmmBackend");
    expect(markdown).toContain("Camera/Sensor-Lite acquisition");
    expect(markdown).toContain("Camera calibration diagnostics");
    expect(markdown).toContain("Resolution MTF diagnostics");
    expect(markdown).toContain("Dot-grid measured target detection");
    expect(markdown).toContain("Batch measurement session QA");
    expect(markdown).toContain("Synthetic fiducial board workflow");
    expect(markdown).toContain("External detector JSON/CSV import");
    expect(markdown).toContain("OpenCV ChArUco external helper");
    expect(markdown).toContain("Detector round-trip wizard");
    expect(markdown).toContain("Detector round-trip acceptance reports");
    expect(csv).toContain("External FDTD scene manifest export");
    expect(csv).toContain("External FDTD result import");
    expect(csv).toContain("External FDTD benchmark export");
    expect(csv).toContain("FDTD convergence diagnostics");
    expect(markdown).toContain("Surface geometry fixture import/validation");
    expect(csv).toContain("External FDTD finite surface geometry export");
    expect(csv).toContain("Surface geometry X-Z cross-section");
    expect(`${markdown}\n${csv}`).not.toMatch(/3D Maxwell solve executed|FDTD solver executable|FEM\/BEM\/RCWA available|digital twin certified|certified EMVA characterization executable|EMVA 1288 certification executable|pixel-level sensor stack executable|ISO 12233 certification executable|Imatest-equivalent certification executable|pure lens-only MTF certification executable|calibrated optical model fitting executable|certified camera calibration executable|lab-accredited metrology executable|certified metrology report executable|lab accreditation executable|full 3D pose calibration executable|stereo calibration executable|AprilTag detector executable|browser-native OpenCV.js\/ArUco detector executable/i);
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

    expect(study.type).toBe("l78PracticalStudy");
    expect(bundle.appVersion).toContain("L7.8");
    expect(imported.study.resultHash).toBe(study.resultHash);
    expect(imported.manifest.resultHashes).toEqual([result.resultHash]);
    expect(imported.manifest.materialReceiptCount).toBe(1);
    expect(imported.manifest.capabilityBoundary).toContain("L8.3 finite placed transparent/absorbing/reflective/aperture/wedge geometry export/import diagnostics");
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
