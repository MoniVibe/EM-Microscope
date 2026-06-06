import { describe, expect, it } from "vitest";
import {
  createSimulationBuilderElement,
  defaultSimulationBuilderScenario
} from "../maxwell/simulationBuilder";
import {
  createFdtdBenchmarkPack
} from "./fdtdBenchmarkSuite";
import {
  exportFdtdBundleFromSimulationBuilder,
  fdtdMeepScriptText
} from "./fdtdSceneExport";
import {
  createAbsorbingFdtdExampleBundle,
  createTransparentFdtdExampleBundle
} from "./fdtdExamples";
import {
  createSurfaceGeometryConvergencePack,
  createSurfaceGeometryElement,
  createSurfaceGeometryExampleBundle,
  createSurfaceGeometryExampleBundles,
  createSurfaceGeometryScenario,
  createSurfaceGeometryScene,
  importSurfaceGeometryArtifacts,
  l83SurfaceGeometryBoundary,
  surfaceGeometryFluxSummaryJson,
  surfaceGeometryMetricsCsv,
  surfaceGeometryReceiptJson,
  surfaceGeometrySceneJson,
  surfaceGeometryValidationReportJson,
  surfaceGeometryValidationReportMarkdown,
  type SurfaceGeometryKind
} from "./fdtdSurfaceGeometry";

const kinds: SurfaceGeometryKind[] = ["transparent-block", "absorbing-block", "reflective-plate", "aperture-blocker", "tilted-wedge"];

describe("L8.3 finite surface geometry export", () => {
  it.each(kinds)("exports %s with deterministic manifest and script hashes", (kind) => {
    const a = createSurfaceGeometryScene(kind);
    const b = createSurfaceGeometryScene(kind);

    expect(a.sceneHash).toBe(b.sceneHash);
    expect(a.bundle.manifest.manifestHash).toBe(b.bundle.manifest.manifestHash);
    expect(a.bundle.script.scriptHash).toBe(b.bundle.script.scriptHash);
    expect(a.geometryIds.length).toBeGreaterThan(0);
    expect(a.monitorIds).toContain("field-slice-xz");
    expect(surfaceGeometrySceneJson(a)).toContain("emmicro.fdtd.surfaceGeometryScene.v1");
    expect(fdtdMeepScriptText(a.bundle.script)).toContain("import meep as mp");
  });

  it("preserves x/y/z placement and finite dimensions in exported geometry", () => {
    const element = {
      ...createSurfaceGeometryElement("transparent-block", 12),
      xUm: 1.25,
      yUm: -0.5,
      widthUm: 7,
      heightUm: 5,
      thicknessUm: 3
    };
    const scenario = {
      ...createSurfaceGeometryScenario("transparent-block"),
      elements: [element]
    };
    const scene = createSurfaceGeometryScene(scenario);
    const geometry = scene.bundle.manifest.geometry.find((item) => item.sourceElementId === element.id);

    expect(geometry?.centerUm).toEqual({ x: 1.25, y: -0.5, z: 12000 });
    expect(geometry?.sizeUm).toEqual({ x: 7, y: 5, z: 3 });
  });

  it("sorts placed elements by z while preserving transverse extents", () => {
    const scenario = {
      ...defaultSimulationBuilderScenario(),
      elements: [
        createSurfaceGeometryElement("absorbing-block", 14),
        createSurfaceGeometryElement("transparent-block", 9)
      ]
    };
    const bundle = exportFdtdBundleFromSimulationBuilder(scenario);
    const surfaceGeometry = bundle.manifest.geometry.filter((item) => item.sourceElementId);

    expect(surfaceGeometry.map((item) => item.centerUm.z)).toEqual([9000, 14000]);
    expect(surfaceGeometry.every((item) => item.sizeUm.x > 0 && item.sizeUm.y > 0)).toBe(true);
  });

  it("exports aperture blockers as deterministic four-block Meep helper geometry", () => {
    const scene = createSurfaceGeometryScene("aperture-blocker");
    const script = fdtdMeepScriptText(scene.bundle.script);

    expect(script).toContain("finite-aperture-blocker");
    expect(script).toContain("four absorbing/reflective blocker blocks");
    expect(scene.bundle.manifest.geometry.find((item) => item.kind === "finite-aperture-blocker")?.apertureUm).toEqual({ width: 4, height: 6 });
  });

  it("exports tilted wedge orientation into the helper script", () => {
    const scene = createSurfaceGeometryScene("tilted-wedge");

    expect(scene.bundle.manifest.geometry.find((item) => item.kind === "tilted-interface-wedge")?.rotationDeg).toBe(12);
    expect(fdtdMeepScriptText(scene.bundle.script)).toContain("e1=mp.Vector3");
  });
});

describe("L8.3 finite surface geometry validation", () => {
  it("compares broad transparent block to a TMM reference", () => {
    const example = createSurfaceGeometryExampleBundle("transparent-block");

    expect(example.scene.reference.model).toBe("planar-tmm-broad-block");
    expect(example.validation.status).toBe("pass");
    expect(example.validation.energyBalance).toBeCloseTo(1, 12);
  });

  it("checks absorbing block attenuation against Beer-Lambert", () => {
    const example = createSurfaceGeometryExampleBundle("absorbing-block");

    expect(example.scene.reference.model).toBe("beer-lambert");
    expect(example.scene.reference.expected.transmittance).toBeCloseTo(Math.exp(-0.5), 12);
    expect(example.validation.imported.transmittance).toBeLessThan(1);
    expect(example.validation.status).toBe("pass");
  });

  it("checks ideal reflective plate R near 1 and T near 0", () => {
    const example = createSurfaceGeometryExampleBundle("reflective-plate");

    expect(example.scene.reference.model).toBe("ideal-reflector");
    expect(example.validation.imported.reflectance).toBeGreaterThan(0.99);
    expect(example.validation.imported.transmittance).toBeLessThan(0.01);
    expect(example.validation.classification).toBe("PASS");
  });

  it("reports diagnostic-only status for aperture/blocker edge fields", () => {
    const example = createSurfaceGeometryExampleBundle("aperture-blocker");

    expect(example.scene.reference.model).toBe("aperture-open-fraction");
    expect(example.validation.classification).toBe("DIAGNOSTIC");
    expect(example.validation.warnings.map((warning) => warning.code)).toContain("fdtd.surfaceGeometry.noClosedFormAperture");
  });

  it("reports tilted/wedge Snell-Fresnel diagnostics with convergence warning", () => {
    const example = createSurfaceGeometryExampleBundle("tilted-wedge");

    expect(example.scene.reference.model).toBe("snell-fresnel");
    expect(example.scene.reference.snellDirectionDeg).toBeGreaterThan(0);
    expect(example.validation.classification).toBe("WARNING");
    expect(example.validation.warnings.map((warning) => warning.code)).toContain("fdtd.geometry.staircasingSensitive");
  });
});

describe("L8.3 finite geometry warnings", () => {
  it("warns when geometry is under-resolved", () => {
    const scenario = {
      ...createSurfaceGeometryScenario("transparent-block"),
      elements: [{ ...createSurfaceGeometryElement("transparent-block", 10), thicknessUm: 0.05 }]
    };
    const scene = createSurfaceGeometryScene(scenario);

    expect(scene.warnings.map((warning) => warning.code)).toContain("fdtd.geometry.underResolved");
  });

  it("warns when geometry is close to PML/domain boundary", () => {
    const scenario = {
      ...createSurfaceGeometryScenario("transparent-block"),
      elements: [createSurfaceGeometryElement("transparent-block", 0.001)]
    };
    const scene = createSurfaceGeometryScene(scenario);

    expect(scene.warnings.map((warning) => warning.code)).toContain("fdtd.geometry.pmlProximity");
  });

  it("warns when flux monitors are too close to thin scatterers", () => {
    const scene = createSurfaceGeometryScene("reflective-plate");

    expect(scene.warnings.map((warning) => warning.code)).toContain("fdtd.geometry.monitorProximity");
  });

  it("warns that ideal reflectors are not real metal models", () => {
    const scene = createSurfaceGeometryScene("reflective-plate");

    expect(scene.warnings.map((warning) => warning.code)).toContain("fdtd.geometry.idealReflector");
  });

  it("blocks unsupported curved material lens and finite metal aperture geometry", () => {
    const scenario = {
      ...defaultSimulationBuilderScenario(),
      elements: [
        createSimulationBuilderElement("curved-material-lens", 10),
        createSimulationBuilderElement("finite-metal-aperture", 11)
      ]
    };
    const bundle = exportFdtdBundleFromSimulationBuilder(scenario);

    expect(bundle.manifest.readiness.status).toBe("blocked");
    expect(bundle.manifest.readiness.unsupported.map((item) => item.reason).join(" ")).toContain("curved material lens solving is scaffold-only");
    expect(bundle.manifest.readiness.unsupported.map((item) => item.reason).join(" ")).toContain("finite-thickness metal aperture Maxwell solve is not implemented");
  });
});

describe("L8.3 fixture import and reports", () => {
  it.each(kinds)("imports %s fixture evidence with field metadata and monitor positions", (kind) => {
    const example = createSurfaceGeometryExampleBundle(kind);
    const report = importSurfaceGeometryArtifacts(example.scene, {
      receiptJson: surfaceGeometryReceiptJson(example),
      fluxJson: surfaceGeometryFluxSummaryJson(example),
      fieldSliceCsv: example.fieldSliceCsv
    });

    expect(report.manifestHash).toBe(example.scene.bundle.manifest.manifestHash);
    expect(report.monitorPositions.length).toBeGreaterThan(3);
    expect(example.fieldSlice.plane).toBe("xz");
    expect(example.fieldSlice.samples.length).toBe(example.fieldSlice.xCount * example.fieldSlice.zCount);
  });

  it("warns on source or scene hash mismatch", () => {
    const example = createSurfaceGeometryExampleBundle("transparent-block");
    const receipt = { ...example.receipt, sourceScenarioHash: "wrong-source-hash" };
    const report = importSurfaceGeometryArtifacts(example.scene, {
      receiptJson: receipt,
      fluxJson: example.flux,
      fieldSliceCsv: example.fieldSliceCsv
    });

    expect(report.status).toBe("fail");
    expect(report.warnings.map((warning) => warning.code)).toContain("fdtd.surfaceGeometry.sourceHashMismatch");
  });

  it("exports validation reports and metric CSVs", () => {
    const example = createSurfaceGeometryExampleBundle("absorbing-block");
    const markdown = surfaceGeometryValidationReportMarkdown(example.validation);
    const json = JSON.parse(surfaceGeometryValidationReportJson(example.validation));
    const csv = surfaceGeometryMetricsCsv(example.validation);

    expect(markdown).toContain("L8.3 Finite absorbing block Validation Report");
    expect(markdown).toContain("Monitor Positions");
    expect(json.schema).toBe("emmicro.fdtd.surfaceGeometryValidationReport.v1");
    expect(csv).toContain("energy_balance");
  });

  it("creates all bundled example fixtures", () => {
    const examples = createSurfaceGeometryExampleBundles();

    expect(Object.keys(examples).sort()).toEqual([...kinds].sort());
    expect(examples["aperture-blocker"].validation.classification).toBe("DIAGNOSTIC");
  });
});

describe("L8.3 boundary and regressions", () => {
  it("keeps finite geometry convergence hooks available", () => {
    const pack = createSurfaceGeometryConvergencePack("transparent-block");

    expect(pack.sweepPlan.runCount).toBeGreaterThan(0);
    expect(pack.benchmarkManifest.baseManifest.geometry.some((item) => item.kind === "finite-transparent-block")).toBe(true);
  });

  it("keeps L8.2 convergence suite working", () => {
    const pack = createFdtdBenchmarkPack({ benchmarkKind: "transparent-interface" });

    expect(pack.sweepPlan.runCount).toBe(36);
    expect(pack.benchmarkManifest.limitations.join(" ")).toContain("External FDTD benchmark/convergence support only");
  });

  it("keeps L8.1 field import fixtures working", () => {
    const transparent = createTransparentFdtdExampleBundle();
    const absorbing = createAbsorbingFdtdExampleBundle();

    expect(transparent.validation.status).toBe("pass");
    expect(absorbing.validation.status).toBe("pass");
  });

  it("keeps strict non-goal boundary language", () => {
    const text = l83SurfaceGeometryBoundary.join(" ");

    expect(text).toContain("External FDTD export/import only");
    expect(text).toContain("browser app does not execute FDTD");
    expect(text).toContain("No arbitrary CAD import");
    expect(text).toContain("FEM/BEM/RCWA");
    expect(text).toContain("manufacturing certification");
    expect(text).not.toMatch(/browser FDTD execution is available|arbitrary 3D Maxwell solved|production EM solver|digital twin certified/i);
  });
});
