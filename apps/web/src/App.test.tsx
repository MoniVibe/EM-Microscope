import { describe, expect, it } from "vitest";
import { solverDisclosureFor } from "./App";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const testDir = fileURLToPath(new URL(".", import.meta.url));

describe("solver disclosure copy", () => {
  it("labels the L2 result as a 1D scalar slice without claiming a full PSF", () => {
    const disclosure = solverDisclosureFor("scalar.angularSpectrum.l2.1d");

    expect(disclosure.label).toBe("L2 scalar 1D field propagation");
    expect(disclosure.detail).toBe("1D transverse slice; not a full circular-aperture Airy disk");
    expect(`${disclosure.label} ${disclosure.detail}`).not.toMatch(/Airy disk simulated|full PSF simulated|full microscope image simulated/i);
  });

  it("labels L2.5 sample propagation without claiming a microscope image", () => {
    const disclosure = solverDisclosureFor("scalar.angularSpectrum.l2.1d", true);

    expect(disclosure.label).toBe("L2 scalar 1D sample propagation");
    expect(disclosure.detail).toBe("1D coherent transverse slice; not a full microscope image, full PSF, or Airy disk");
    expect(`${disclosure.label} ${disclosure.detail}`).not.toMatch(/Airy disk simulated|full PSF simulated|full microscope image simulated/i);
  });

  it("labels L3 as a coherent scalar 2D approximation without claiming complete microscope physics", () => {
    const disclosure = solverDisclosureFor("scalar.coherent.l3.2d");

    expect(disclosure.label).toBe("L3 coherent 2D scalar image approximation");
    expect(disclosure.detail).toContain("2D coherent scalar image-plane intensity approximation");
    expect(`${disclosure.label} ${disclosure.detail}`).not.toMatch(/full microscope image|true microscope simulation|incoherent imaging|fluorescence simulated|vector PSF|Maxwell solver/i);
  });

  it("labels L3.3 as a partial-coherence scalar approximation without certified microscope claims", () => {
    const disclosure = solverDisclosureFor("scalar.partialCoherent.l3.3.2d");

    expect(disclosure.label).toBe("L3.3 partial-coherence scalar brightfield approximation");
    expect(disclosure.detail).toContain("source-angle intensity averaging");
    expect(`${disclosure.label} ${disclosure.detail}`).not.toMatch(/true 3D simulation|certified microscope simulation|vector optics simulated|fluorescence simulated|Maxwell solver/i);
  });

  it("keeps measured-data UI copy away from certified calibration claims", () => {
    const importPanel = readFileSync(resolve(testDir, "measurement/ImageImportPanel.tsx"), "utf8");
    const calibrationPanel = readFileSync(resolve(testDir, "measurement/CalibrationPanel.tsx"), "utf8");
    const roiPanel = readFileSync(resolve(testDir, "measurement/RoiPanel.tsx"), "utf8");

    expect(`${importPanel}\n${calibrationPanel}\n${roiPanel}`).not.toMatch(/certified ISO|certified EMVA|clinical calibration|hardware calibration/i);
  });

  it("labels L3.4B compare/fit as diagnostic measured-vs-simulated workbench output", () => {
    const comparePanel = readFileSync(resolve(testDir, "measurement/ComparePanel.tsx"), "utf8");
    const fitPanel = readFileSync(resolve(testDir, "measurement/FitPanel.tsx"), "utf8");

    expect(comparePanel).toContain("measured-vs-simulated workbench");
    expect(comparePanel).toContain("Not certified ISO 12233, EMVA 1288, clinical, or hardware calibration");
    expect(fitPanel).toContain("diagnostic only");
    expect(`${comparePanel}\n${fitPanel}`).not.toMatch(/certified ISO 12233 calibration|certified EMVA 1288 calibration|clinical calibration service|hardware calibration service/i);
  });

  it("labels L6.4 Maxwell foundry as planar execution plus lens validation without claiming arbitrary 3D EM", () => {
    const maxwellPanel = readFileSync(resolve(testDir, "maxwell/MaxwellPanel.tsx"), "utf8");
    const explainability = readFileSync(resolve(testDir, "explainabilityContent.ts"), "utf8");
    const explainComponents = readFileSync(resolve(testDir, "explainability/Explainability.tsx"), "utf8");

    expect(maxwellPanel).toContain("L6.4 Maxwell Design Foundry");
    expect(maxwellPanel).toContain("frequency-domain Maxwell planar coating-stack TMM, L6.4 thin-lens focal validation, slit/order validation, and explainability layer");
    expect(maxwellPanel).toContain("ideal scalar lens diffraction validation plus accessible tooltips; still not a general 3D Maxwell solver, and ExternalFdtdBackend remains scaffold-only");
    expect(maxwellPanel).toContain("Explain mode");
    expect(maxwellPanel).toContain("Show all explanations");
    expect(maxwellPanel).toContain("Under the hood: Airy/Bessel reference");
    expect(maxwellPanel).toContain("Under the hood: numerical propagation");
    expect(maxwellPanel).toContain("Under the hood: thin lens phase");
    expect(maxwellPanel).toContain("Under the hood: ExternalFdtdBackend");
    expect(explainComponents).toContain('role="tooltip"');
    expect(explainComponents).toContain("aria-describedby");
    expect(explainComponents).toContain("Escape");
    expect(explainComponents).toContain("ShowAllExplanationsDrawer");
    expect(explainComponents).not.toContain("title=");
    expect(explainability).toContain("validation.source.wavelength");
    expect(explainability).toContain("validation.analyticReference.airyBessel");
    expect(explainability).toContain("validation.numericalPropagation.huygensFresnel");
    expect(explainability).toContain("validation.residualMap");
    expect(explainability).toContain("validation.lens.thinLensPhase");
    expect(explainability).toContain("validation.lens.airyRadius");
    expect(explainability).toContain("validation.lens.focusMetric");
    expect(explainability).toContain("backend.planarTmm");
    expect(explainability).toContain("backend.externalFdtdScaffold");
    expect(explainability).toContain("coating.provenanceReceipt");
    expect(explainability).toContain("coating.reflectance");
    expect(explainability).toContain("robust.p90Score");
    expect(explainability).toContain("robust.sampleReduction");
    expect(explainability).toContain("No full 3D Maxwell, FDTD, FEM, BEM, RCWA");
    expect(maxwellPanel).toContain("L6.0 does not execute 3D Maxwell solves.");
    expect(maxwellPanel).toContain("It defines the 3D problem/result contract and external-backend export scaffold only.");
    expect(maxwellPanel).toContain("Validation Bench");
    expect(maxwellPanel).toContain("Physics exam sequence");
    expect(maxwellPanel).toContain("Circular pinhole Airy/Bessel");
    expect(maxwellPanel).toContain("Long single slit sinc^2");
    expect(maxwellPanel).toContain("Double slit / grating orders");
    expect(maxwellPanel).toContain("Ideal thin lens focal plane");
    expect(maxwellPanel).toContain("Advisor Review Mode");
    expect(maxwellPanel).toContain("Run Advisor Review");
    expect(maxwellPanel).toContain("Advisor Markdown");
    expect(maxwellPanel).toContain("Advisor JSON");
    expect(maxwellPanel).toContain("Advisor CSV");
    expect(maxwellPanel).toContain("y1 ~= 5.00 mm");
    expect(maxwellPanel).toContain("orders every 5.00 mm");
    expect(maxwellPanel).toContain("Slit JSON");
    expect(maxwellPanel).toContain("Slit Markdown");
    expect(maxwellPanel).toContain("Ideal thin lens focal-plane validation");
    expect(maxwellPanel).toContain("r1 ~= 1.22 lambda f / D = 61 um");
    expect(maxwellPanel).toContain("Lens phase");
    expect(maxwellPanel).toContain("Pupil D");
    expect(maxwellPanel).toContain("Numerical Focal Map");
    expect(maxwellPanel).toContain("Analytic Airy Map");
    expect(maxwellPanel).toContain("Focus Scan");
    expect(maxwellPanel).toContain("Run Lens Benchmark");
    expect(maxwellPanel).toContain("Lens JSON");
    expect(maxwellPanel).toContain("Lens Markdown");
    expect(maxwellPanel).toContain("Lens CSV");
    expect(maxwellPanel).toContain("runThinLensFocalValidation");
    expect(maxwellPanel).toContain("thinLensFocalValidationJson");
    expect(maxwellPanel).toContain("thinLensFocalValidationCsv");
    expect(maxwellPanel).toContain("runSlitOrderValidation");
    expect(maxwellPanel).toContain("runAdvisorValidationReview");
    expect(maxwellPanel).toContain("slitOrderValidationJson");
    expect(maxwellPanel).toContain("advisorValidationReviewMarkdown");
    expect(maxwellPanel).toContain("Circular pinhole Airy/Bessel");
    expect(maxwellPanel).toContain("Circular aperture, not long slit");
    expect(maxwellPanel).toContain("hand-checkable scalar diffraction benchmarks with numerical results, analytic references, residuals, and report exports");
    expect(maxwellPanel).toContain("Computation mode");
    expect(maxwellPanel).toContain("Analytic Airy reference");
    expect(maxwellPanel).toContain("Numerical scalar propagation");
    expect(maxwellPanel).toContain("Compare numerical vs analytic");
    expect(maxwellPanel).toContain("Map grid");
    expect(maxwellPanel).toContain("Aperture radial");
    expect(maxwellPanel).toContain("Aperture angular");
    expect(maxwellPanel).toContain("Numerical Intensity Map");
    expect(maxwellPanel).toContain("Analytic Reference Map");
    expect(maxwellPanel).toContain("Residual Map");
    expect(maxwellPanel).toContain("Residual Curve");
    expect(maxwellPanel).toContain("Measured first min");
    expect(maxwellPanel).toContain("Finite-plane energy check");
    expect(maxwellPanel).toContain("Expected first Airy minimum");
    expect(maxwellPanel).toContain("Warning: first minimum is outside the 10 mm x 10 mm observation plane.");
    expect(maxwellPanel).toContain("Observation z");
    expect(maxwellPanel).toContain("Run Comparison");
    expect(maxwellPanel).toContain("Validation JSON");
    expect(maxwellPanel).toContain("Validation Markdown");
    expect(maxwellPanel).toContain("runCircularApertureValidation");
    expect(maxwellPanel).toContain("circularApertureValidationPipeline");
    expect(maxwellPanel).toContain("circularApertureValidationJson");
    expect(maxwellPanel).toContain("circularApertureValidationMarkdown");
    expect(maxwellPanel).toContain("Active solver backend");
    expect(maxwellPanel).toContain("PlanarTmmBackend");
    expect(maxwellPanel).toContain("ExternalFdtdBackend");
    expect(maxwellPanel).toContain("Future 3D Backends");
    expect(maxwellPanel).toContain("Scaffolded, not executable");
    expect(maxwellPanel).toContain("schema/export only in L6.0");
    expect(maxwellPanel).toContain("Export 3D FDTD Scaffold");
    expect(maxwellPanel).toContain("createMinimalMaxwellScene3D");
    expect(maxwellPanel).toContain("exportExternalFdtdScaffold");
    expect(maxwellPanel).toContain("externalFdtdSolverReceipt");
    expect(maxwellPanel).toContain("FEM/FDTD/BEM/RCWA");
    expect(maxwellPanel).toContain("solverBackend: run.solverBackend");
    expect(maxwellPanel).toContain("createMaterialCatalog");
    expect(maxwellPanel).toContain("listCatalogMaterials");
    expect(maxwellPanel).toContain("runCoatingSearch");
    expect(maxwellPanel).toContain("runRobustCoatingSearch");
    expect(maxwellPanel).toContain("runCoatingStack");
    expect(maxwellPanel).toContain("runCoatingSweep");
    expect(maxwellPanel).toContain("runCoatingDesignFoundry");
    expect(maxwellPanel).toContain("runCoatingYieldAnalysis");
    expect(maxwellPanel).toContain("serializeCoatingStackDesign");
    expect(maxwellPanel).toContain("parseMaterialImportJson");
    expect(maxwellPanel).toContain("Material Library");
    expect(maxwellPanel).toContain("MaterialPassport");
    expect(maxwellPanel).toContain("Template JSON");
    expect(maxwellPanel).toContain("Example Pack");
    expect(maxwellPanel).toContain("Planar Field Monitor");
    expect(maxwellPanel).toContain("Monitor CSV");
    expect(maxwellPanel).toContain("Design Foundry");
    expect(maxwellPanel).toContain("Apply Best");
    expect(maxwellPanel).toContain("Coating Search");
    expect(maxwellPanel).toContain("Run Search");
    expect(maxwellPanel).toContain("Robust Search");
    expect(maxwellPanel).toContain("CoatingUncertaintyModel");
    expect(maxwellPanel).toContain("Shared deposition scale");
    expect(maxwellPanel).toContain("Shared offset + residual");
    expect(maxwellPanel).toContain("Independent P90");
    expect(maxwellPanel).toContain("formatUncertaintyReceipt");
    expect(maxwellPanel).toContain("Run Robust Search");
    expect(maxwellPanel).toContain("Apply Robust");
    expect(maxwellPanel).toContain("Robust Search JSON");
    expect(maxwellPanel).toContain("Apply Search");
    expect(maxwellPanel).toContain("Tolerance Yield");
    expect(maxwellPanel).toContain("Yield JSON");
    expect(maxwellPanel).not.toMatch(/general 3D Maxwell solver ready|full 3D FEM Maxwell solver|arbitrary CAD Maxwell solved|production FEM\/BEM\/RCWA|3D Maxwell solve executed|full 3D Maxwell aperture solver|FDTD aperture solved|real thick lens solved/i);
  });

  it("keeps the visible app shell Maxwell-only", () => {
    const app = readFileSync(resolve(testDir, "App.tsx"), "utf8");
    const maxwellReturn = app.indexOf("return <MaxwellOnlyApp />;");
    const legacyWorkspace = app.indexOf('<main className="workspace">');

    expect(app).toContain('aria-label="Maxwell simulator"');
    expect(app).toContain("PlanarTmmBackend + Validation Bench");
    expect(app).toContain("L6.4 Maxwell Design Foundry");
    expect(app).toContain("executable planar backend, explainability layer, thin-lens focal validation, slit/order ladder, scaffold-only 3D export");
    expect(maxwellReturn).toBeGreaterThan(0);
    expect(maxwellReturn).toBeLessThan(legacyWorkspace);
  });
});
