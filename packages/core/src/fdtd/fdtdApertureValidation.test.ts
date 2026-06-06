import { describe, expect, it } from "vitest";
import { createFdtdBenchmarkExampleBundles } from "./fdtdBenchmarkSuite";
import { createTransparentFdtdExampleBundle } from "./fdtdExamples";
import {
  apertureConvergenceCsv,
  apertureFluxSummaryJson,
  apertureMetricsCsv,
  apertureProfileCsv,
  apertureReceiptJson,
  apertureValidationKinds,
  apertureValidationReportJson,
  apertureValidationReportMarkdown,
  apertureValidationSceneJson,
  circularApertureFirstMinimumUm,
  createApertureConvergenceReport,
  createApertureValidationElement,
  createApertureValidationExampleBundle,
  createApertureValidationExampleBundles,
  createApertureValidationScene,
  importApertureArtifacts,
  l84ApertureValidationBoundary,
  singleSlitMinimaUm,
  type ApertureValidationKind
} from "./fdtdApertureValidation";
import { createSurfaceGeometryExampleBundle } from "./fdtdSurfaceGeometry";
import { defaultSimulationBuilderScenario, runSimulationBuilderScenario } from "../maxwell/simulationBuilder";
import { createDetectorRoundTripAcceptance } from "../measurement/detectorRoundTrip";
import { l69ExampleCalibrationCsv, parseCameraCalibrationCsv, runCameraCalibration } from "../workspace/cameraCalibration";

describe("L8.4 Aperture / Blocker Edge-Diffraction Validation", () => {
  it("exports long-slit, circular-pinhole, rectangular-aperture, and opaque-blocker scenes deterministically", () => {
    for (const kind of apertureValidationKinds) {
      const a = createApertureValidationScene(kind);
      const b = createApertureValidationScene(kind);
      expect(a.sceneHash).toBe(b.sceneHash);
      expect(a.bundle.manifest.manifestHash).toBe(b.bundle.manifest.manifestHash);
      expect(a.bundle.script.scriptHash).toBe(b.bundle.script.scriptHash);
      expect(a.bundle.manifest.geometry.some((geometry) => geometry.apertureShape === kind)).toBe(true);
      expect(apertureValidationSceneJson(a)).toContain("emmicro.fdtd.apertureValidationScene.v1");
      expect(a.bundle.script.python).toContain(kind);
    }
  });

  it("preserves aperture z position, finite screen dimensions, model, and cells-across diagnostics", () => {
    const element = {
      ...createApertureValidationElement("long-slit", "ideal-reflective-screen", 0.032),
      apertureWidthUm: 1.5,
      widthUm: 20,
      heightUm: 18,
      thicknessUm: 0.6
    };
    const scene = createApertureValidationScene({
      ...defaultSimulationBuilderScenario(),
      id: "l84-custom-long-slit",
      grid: { units: "um", domainWidthUm: 20, domainHeightUm: 18, zStartMm: 0, zEndMm: 0.07, pointsPerWavelength: 10 },
      source: { ...defaultSimulationBuilderScenario().source, zMm: 0.004 },
      elements: [element],
      target: { ...defaultSimulationBuilderScenario().target, zMm: 0.065, incidentIndex: 1, substrateIndex: 1, thicknessUm: 0 },
      observationPlaneZMm: 0.06
    });
    const geometry = scene.bundle.manifest.geometry.find((item) => item.sourceElementId === element.id);
    expect(geometry?.centerUm.z).toBe(32);
    expect(geometry?.sizeUm.x).toBe(20);
    expect(geometry?.sizeUm.y).toBe(18);
    expect(geometry?.screenModel).toBe("ideal-reflective-screen");
    expect(scene.diagnostics.apertureCellsAcross).toBeGreaterThan(20);
    expect(scene.diagnostics.screenThicknessCells).toBeGreaterThan(10);
  });

  it("generates specialized helper script geometry for long slit, circular pinhole, and solid blocker", () => {
    const slit = createApertureValidationScene("long-slit");
    const circular = createApertureValidationScene("circular-pinhole");
    const blocker = createApertureValidationScene("opaque-blocker");

    expect(slit.bundle.script.python).toContain("long-slit");
    expect(slit.bundle.script.python).toContain("four-screen-block helper");
    expect(circular.bundle.script.python).toContain("circular-pinhole segmented screen helper");
    expect(circular.bundle.script.python).toContain("aperture_radius_um");
    expect(blocker.bundle.script.python).toContain("opaque-blocker solid screen diagnostic");
  });

  it("computes single-slit minima using a sin(theta) = m lambda", () => {
    const minima = singleSlitMinimaUm(2, 500, 30, 2);
    expect(minima[0]).toBeCloseTo(7.745, 2);
    expect(minima[1]).toBeCloseTo(17.321, 2);
  });

  it("computes circular-aperture first minimum near 1.22 lambda z / D", () => {
    expect(circularApertureFirstMinimumUm(4, 500, 30)).toBeCloseTo(4.575, 3);
    const scene = createApertureValidationScene("circular-pinhole");
    expect(scene.reference.model).toBe("airy-bessel");
    expect(scene.reference.expectedFirstMinimumUm).toBeCloseTo(4.575, 3);
  });

  it("warns when observation plane does not include expected scalar minima or ring", () => {
    const scenario = {
      ...defaultSimulationBuilderScenario(),
      id: "l84-missing-minimum",
      grid: { units: "um" as const, domainWidthUm: 2, domainHeightUm: 2, zStartMm: 0, zEndMm: 0.06, pointsPerWavelength: 8 },
      source: { ...defaultSimulationBuilderScenario().source, zMm: 0.004 },
      elements: [createApertureValidationElement("circular-pinhole", "absorbing-screen", 0.025)],
      target: { ...defaultSimulationBuilderScenario().target, zMm: 0.058, incidentIndex: 1, substrateIndex: 1, thicknessUm: 0 },
      observationPlaneZMm: 0.055
    };
    const scene = createApertureValidationScene(scenario);
    expect(scene.diagnostics.observationContainsFirstMinimum).toBe(false);
    expect(scene.warnings.map((warning) => warning.code)).toContain("fdtd.aperture.observationMissesMinimum");
  });

  it("compares imported long-slit and circular fixtures to scalar references", () => {
    const slit = createApertureValidationExampleBundle("long-slit");
    const circular = createApertureValidationExampleBundle("circular-pinhole");

    expect(slit.validation.reference.model).toBe("single-slit-sinc2");
    expect(slit.validation.profile.length).toBeGreaterThan(40);
    expect(slit.validation.residuals.profileRms).toBeLessThan(0.03);
    expect(circular.validation.reference.model).toBe("airy-bessel");
    expect(circular.validation.residuals.profileRms).toBeLessThan(0.04);
    expect(circular.validation.reference.expectedFirstMinimumUm).toBeGreaterThan(0);
  });

  it("treats rectangular aperture as separable-sinc diagnostic and blocker as flux/shadow diagnostic", () => {
    const rectangular = createApertureValidationExampleBundle("rectangular-aperture");
    const blocker = createApertureValidationExampleBundle("opaque-blocker");

    expect(rectangular.validation.reference.model).toBe("rectangular-sinc2");
    expect(rectangular.validation.classification).not.toBe("FAIL");
    expect(blocker.validation.reference.model).toBe("blocker-shadow-flux");
    expect(blocker.validation.imported.blockedPower).toBeGreaterThan(0.9);
    expect(blocker.validation.classification).toBe("DIAGNOSTIC");
  });

  it("flags under-resolution, PML proximity, monitor proximity, thickness, staircasing, and convergence warnings", () => {
    const tiny = {
      ...defaultSimulationBuilderScenario(),
      id: "l84-under-resolved",
      grid: { units: "um" as const, domainWidthUm: 8, domainHeightUm: 8, zStartMm: 0, zEndMm: 0.0265, pointsPerWavelength: 4 },
      source: { ...defaultSimulationBuilderScenario().source, zMm: 0.004 },
      elements: [{ ...createApertureValidationElement("long-slit", "ideal-reflective-screen", 0.025), apertureWidthUm: 0.25, apertureHeightUm: 8, thicknessUm: 0.2 }],
      target: { ...defaultSimulationBuilderScenario().target, zMm: 0.026, incidentIndex: 1, substrateIndex: 1, thicknessUm: 0 },
      observationPlaneZMm: 0.026
    };
    const scene = createApertureValidationScene(tiny);
    const codes = scene.warnings.map((warning) => warning.code);
    expect(codes).toContain("fdtd.aperture.underResolved");
    expect(codes).toContain("fdtd.aperture.thicknessUnderResolved");
    expect(codes).toContain("fdtd.aperture.monitorTooClose");
    expect(codes).toContain("fdtd.aperture.pmlProximity");
    expect(codes).toContain("fdtd.aperture.edgeStaircasing");
    expect(codes).toContain("fdtd.aperture.convergenceRequired");
    expect(codes).toContain("fdtd.aperture.idealReflectiveScreen");
  });

  it("computes residual-vs-resolution and aperture-cells convergence rows", () => {
    const convergence = createApertureConvergenceReport("long-slit");
    expect(convergence.rows).toHaveLength(5);
    expect(convergence.rows[0]!.apertureCellsAcross).toBeLessThan(convergence.rows[4]!.apertureCellsAcross);
    expect(convergence.rows[4]!.referenceResidual).toBeLessThan(convergence.rows[0]!.referenceResidual);
    expect(convergence.trend).toBe("decreasing");
    expect(apertureConvergenceCsv(convergence)).toContain("aperture_cells_across");
  });

  it("imports bundled fixtures and preserves hashes, field-slice metadata, and monitor positions", () => {
    for (const kind of apertureValidationKinds) {
      const example = createApertureValidationExampleBundle(kind);
      const report = importApertureArtifacts(example.scene, {
        receiptJson: apertureReceiptJson(example),
        fluxJson: apertureFluxSummaryJson(example),
        fieldSliceCsv: example.fieldSliceCsv
      });
      expect(report.manifestHash).toBe(example.scene.bundle.manifest.manifestHash);
      expect(report.scriptHash).toBe(example.scene.bundle.script.scriptHash);
      expect(example.fieldSlice.id).toBe("aperture-field-slice-xz");
      expect(report.monitorPositions.some((monitor) => monitor.id.includes("flux"))).toBe(true);
      expect(report.reportHash).toBe(example.validation.reportHash);
    }
  });

  it("exports aperture validation reports as Markdown, JSON, metrics, profile, and convergence CSV", () => {
    const example = createApertureValidationExampleBundle("long-slit");
    const markdown = apertureValidationReportMarkdown(example.validation);
    const json = JSON.parse(apertureValidationReportJson(example.validation));
    const metrics = apertureMetricsCsv(example.validation);
    const profile = apertureProfileCsv(example.validation);
    const convergence = apertureConvergenceCsv(example.validation);

    expect(markdown).toContain("L8.4 Long-slit aperture Aperture Validation Report");
    expect(markdown).toContain("a sin(theta) = m lambda");
    expect(json.schema).toBe("emmicro.fdtd.apertureValidationReport.v1");
    expect(metrics).toContain("blocked_power");
    expect(profile).toContain("coordinate_um");
    expect(convergence).toContain("monitor_distance_lambda");
  });

  it("generates deterministic fixture bundles for all aperture kinds", () => {
    const examples = createApertureValidationExampleBundles();
    expect(Object.keys(examples).sort()).toEqual([...apertureValidationKinds].sort());
    expect(examples["long-slit"].validation.reference.model).toBe("single-slit-sinc2");
    expect(examples["circular-pinhole"].validation.reference.model).toBe("airy-bessel");
    expect(examples["opaque-blocker"].validation.warnings.map((warning) => warning.code)).toContain("fdtd.aperture.blockerNoClosedForm");
  });

  it("keeps L8.4 boundary language strict", () => {
    const text = l84ApertureValidationBoundary.join(" ");
    expect(text).toContain("External FDTD export/import evidence only");
    expect(text).toContain("Scalar sinc/Airy references are limiting-case checks");
    expect(text).toContain("not production metal aperture models");
    expect(text).not.toMatch(/browser app executes FDTD|production metal aperture model is executable|arbitrary 3D Maxwell solved|FEM\/BEM\/RCWA execution is available/i);
  });

  it("preserves L8.3, L8.2, L8.1, L8.0, L7.8, and L6.9 regressions", () => {
    expect(createSurfaceGeometryExampleBundle("transparent-block").validation.reference.model).toBe("planar-tmm-broad-block");
    expect(createFdtdBenchmarkExampleBundles()["transparent-interface"].convergenceSummary.reference.referenceModel).toBe("fresnel-normal-incidence");
    expect(createTransparentFdtdExampleBundle().validation.status).toBe("pass");
    expect(runSimulationBuilderScenario(defaultSimulationBuilderScenario()).validation.solverPath).toBe("planar-tmm-fresnel");
    expect(createDetectorRoundTripAcceptance({ fixtureKind: "custom" }).schema).toBe("emmicro.l78.detectorRoundTripAcceptance.v1");
    expect(runCameraCalibration({ dataset: parseCameraCalibrationCsv(l69ExampleCalibrationCsv(false)) }).schema).toBe("emmicro.cameraCalibrationRun.v1");
  });
});
