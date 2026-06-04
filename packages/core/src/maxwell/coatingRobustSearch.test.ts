import { describe, expect, it } from "vitest";
import { l41DefaultCoatingStack, serializeCoatingStackDesign } from "./coatingStack";
import { applyRobustCoatingSearchCandidate, runRobustCoatingSearch, type RobustCoatingSearchPrimaryMetric, type RobustCoatingSearchSpec } from "./coatingRobustSearch";
import type { CoatingSearchSpec } from "./coatingSearch";
import { createMaterialCatalog, listCatalogMaterials } from "./materialCatalog";
import { importMaterialPackage } from "./materialImport";

describe("L5.6 robust-yield coating search", () => {
  it("returns deterministic robust candidates for a fixed nominal spec and thickness uncertainty model", () => {
    const spec = robustSpec();
    const a = runRobustCoatingSearch(spec);
    const b = runRobustCoatingSearch(structuredClone(spec));

    expect(a.type).toBe("maxwellRobustYieldCoatingSearch");
    expect(a.analysisId).toBe("analysis.maxwell.l5.phase6.robustYieldCoatingSearch");
    expect(a.best.resultHash).toBe(b.best.resultHash);
    expect(a.resultHash).toBe(b.resultHash);
    expect(a.sampleEvaluationCount).toBeGreaterThan(0);
    expect(a.nominalSearchResult.type).toBe("maxwellCoatingMaterialOrderSearch");
  });

  it("wraps L5.5 nominal candidates and reports nominal plus robust metrics", () => {
    const result = runRobustCoatingSearch(robustSpec());

    expect(result.best.nominalCandidate.resultHash).toBe(result.nominalSearchResult.candidates[0]?.resultHash);
    expect(result.best.nominal.score).toBe(result.best.nominalCandidate.score);
    expect(result.best.yield.expectedScore).toBeGreaterThanOrEqual(0);
    expect(result.best.yield.p90Score).toBeGreaterThanOrEqual(result.best.yield.medianScore);
    expect(result.best.yield.worstCaseScore).toBeGreaterThanOrEqual(result.best.yield.p90Score);
    expect(result.best.yield.sampleCount).toBe(result.best.samples.length);
  });

  it("can rank by expected, p90, worst-case, and pass-rate metrics", () => {
    for (const primary of ["expectedScore", "p90Score", "worstCaseScore", "passRate"] satisfies RobustCoatingSearchPrimaryMetric[]) {
      const result = runRobustCoatingSearch(
        robustSpec({
          primary,
          passThreshold: primary === "passRate" ? 0.05 : undefined
        })
      );

      expect(result.candidates.length).toBeGreaterThan(0);
      expect(result.best.robustScore).toBeLessThanOrEqual(result.candidates.at(-1)?.robustScore ?? Number.POSITIVE_INFINITY);
      if (primary === "passRate") expect(result.best.yield.passRate).not.toBeUndefined();
    }
  });

  it("requires a pass threshold for pass-rate ranking", () => {
    expect(() => runRobustCoatingSearch(robustSpec({ primary: "passRate", passThreshold: undefined }))).toThrow(/pass threshold/i);
  });

  it("changes robust metrics when thickness sigma increases", () => {
    const lowSigma = runRobustCoatingSearch(robustSpec({ sigmaNm: 0 }));
    const highSigma = runRobustCoatingSearch(robustSpec({ sigmaNm: 8 }));

    expect(highSigma.best.yield.worstCaseScore).not.toBe(lowSigma.best.yield.worstCaseScore);
    expect(highSigma.best.uncertaintyReceipt.sigmaNm).toBe(8);
  });

  it("caps deterministic sample count for wider stacks", () => {
    const result = runRobustCoatingSearch(
      robustSpec({
        layerCountMax: 5,
        maxSamplesPerCandidate: 9,
        candidateMaterialIds: ["mgf2", "sio2", "tio2"]
      })
    );

    expect(result.best.samples.length).toBeLessThanOrEqual(9);
    expect(result.best.uncertaintyReceipt.maxSamplesPerCandidate).toBe(9);
  });

  it("preserves imported material provenance receipts and records fixed imported n/k assumption", () => {
    const { catalog, materialId } = importedCatalogFixture();
    const result = runRobustCoatingSearch(
      robustSpec({
        candidateMaterialIds: [materialId, "sio2"],
        layerCountMin: 1,
        layerCountMax: 1
      }),
      { materialCatalog: catalog, materialResolution: { extrapolation: "clamp" } }
    );

    const imported = result.candidates.find((candidate) => candidate.materialCatalogRefs.some((reference) => reference.origin === "imported"));
    expect(imported).toBeTruthy();
    expect(imported?.materialCatalogRefs.some((reference) => reference.origin === "imported" && reference.sourcePackHash)).toBe(true);
    expect(imported?.uncertaintyReceipt.importedMaterialNkAssumption).toBe("fixed");
    expect(result.warnings.some((warning) => warning.code === "maxwell.robustSearch.importedNkFixed")).toBe(true);
  });

  it("rejects missing imported materials clearly", () => {
    expect(() =>
      runRobustCoatingSearch(
        robustSpec({
          candidateMaterialIds: ["material:missing-pack:missing-material"]
        })
      )
    ).toThrow(/material is not loaded|material 'material:missing-pack:missing-material'/);
  });

  it("applies a robust candidate into a normal serializable coating stack", () => {
    const result = runRobustCoatingSearch(robustSpec());
    const applied = applyRobustCoatingSearchCandidate(l41DefaultCoatingStack, result.best);
    const design = serializeCoatingStackDesign(applied);

    expect(applied.layers.map((layer) => layer.materialId)).toEqual(result.best.layers.map((layer) => layer.materialId));
    expect(design.materialCatalogRefs.some((reference) => reference.materialId === result.best.layers[0]?.materialId)).toBe(true);
  });

  it("serializes robust uncertainty settings and limitations in JSON output", () => {
    const result = runRobustCoatingSearch(robustSpec({ sigmaNm: 3, sigmaLevels: [-2, 0, 2], maxSamplesPerCandidate: 7 }));
    const json = JSON.stringify(result);

    expect(json).toContain("maxwellRobustYieldCoatingSearch");
    expect(json).toContain("\"sigmaNm\":3");
    expect(json).toContain("\"sigmaLevels\":[-2,0,2]");
    expect(json).toContain("thickness-only");
    expect(json).toContain("not certified manufacturing yield");
  });
});

function robustSpec(
  overrides: {
    primary?: RobustCoatingSearchPrimaryMetric;
    passThreshold?: number;
    sigmaNm?: number;
    sigmaLevels?: number[];
    maxSamplesPerCandidate?: number;
    candidateMaterialIds?: string[];
    layerCountMin?: number;
    layerCountMax?: number;
  } = {}
): RobustCoatingSearchSpec {
  return {
    id: "l56-test-robust-search",
    label: "L5.6 test robust search",
    nominalSearch: basicNominalSpec(overrides),
    uncertainty: {
      thickness: {
        mode: "deterministic-grid",
        sigmaNm: overrides.sigmaNm ?? 2,
        sigmaLevels: overrides.sigmaLevels ?? [-2, 0, 2],
        maxSamplesPerCandidate: overrides.maxSamplesPerCandidate ?? 81
      }
    },
    robustObjective: {
      primary: overrides.primary ?? "p90Score",
      passThreshold: overrides.passThreshold,
      weights: {
        nominalScore: 0.05
      }
    },
    candidateLimit: 5
  };
}

function basicNominalSpec(
  overrides: {
    candidateMaterialIds?: string[];
    layerCountMin?: number;
    layerCountMax?: number;
  } = {}
): CoatingSearchSpec {
  return {
    id: "l56-test-nominal-search",
    label: "L5.6 nominal precursor search",
    baseStack: {
      ...l41DefaultCoatingStack,
      layers: []
    },
    wavelengthsM: [450e-9, 550e-9, 650e-9],
    anglesRad: [0],
    polarizations: ["TE"],
    candidateMaterialIds: overrides.candidateMaterialIds ?? ["mgf2", "sio2", "tio2"],
    layerCount: { min: overrides.layerCountMin ?? 1, max: overrides.layerCountMax ?? 3 },
    thicknessM: { min: 50e-9, max: 150e-9, step: 50e-9 },
    constraints: {
      disallowAdjacentSameMaterial: true,
      maxTotalThicknessM: 500e-9,
      maxAbsorbance: 0.03
    },
    objective: {
      terms: [
        { metric: "reflectance", direction: "minimize", weight: 1 },
        { metric: "absorbance", direction: "minimize", weight: 0.2 }
      ]
    },
    search: {
      mode: "beam",
      beamWidth: 8,
      maxCandidates: 5,
      refinementPasses: 1,
      seed: 56
    }
  };
}

function importedCatalogFixture(): { catalog: ReturnType<typeof createMaterialCatalog>; materialId: string } {
  const imported = importMaterialPackage({
    schema: "emmicro.materials.v1",
    id: "l56-robust-pack",
    label: "L5.6 robust material pack",
    records: [
      {
        id: "imported-robust-ar",
        label: "Imported robust AR coating",
        family: "coating",
        wavelengthUnit: "nm",
        source: {
          name: "unit test coating source",
          reference: "synthetic L5.6 fixture",
          license: "test-only"
        },
        samples: [
          { wavelength: 400, n: 1.32, k: 0 },
          { wavelength: 550, n: 1.31, k: 0 },
          { wavelength: 700, n: 1.3, k: 0 }
        ]
      }
    ]
  });
  const catalog = createMaterialCatalog({ imports: [imported] });
  const materialId = listCatalogMaterials(catalog).find((material) => material.origin === "imported")?.id;
  if (!materialId) throw new Error("missing imported material id");
  return { catalog, materialId };
}
