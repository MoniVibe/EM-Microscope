import { describe, expect, it } from "vitest";
import {
  addSimulationBuilderElement,
  createSimulationBuilderElement,
  defaultSimulationBuilderScenario
} from "../maxwell/simulationBuilder";
import {
  exportFdtdBundleFromSimulationBuilder,
  fdtdManifestJson,
  fdtdMeepScriptText,
  l81FdtdBoundary,
  validateFdtdExportReadiness
} from "./fdtdSceneExport";

describe("L8.1 external FDTD scene export", () => {
  it("exports a deterministic manifest and Meep helper script from the Simulation Builder scene", () => {
    const scenario = defaultSimulationBuilderScenario();
    const a = exportFdtdBundleFromSimulationBuilder(scenario);
    const b = exportFdtdBundleFromSimulationBuilder(defaultSimulationBuilderScenario());

    expect(a.manifest.manifestHash).toBe(b.manifest.manifestHash);
    expect(a.script.scriptHash).toBe(b.script.scriptHash);
    expect(a.manifest.schema).toBe("emmicro.fdtd.sceneManifest.v1");
    expect(a.manifest.readiness.status).not.toBe("blocked");
    expect(a.manifest.geometry.map((geometry) => geometry.kind)).toContain("transparent-slab");
    expect(a.manifest.monitors.map((monitor) => monitor.id)).toContain("field-slice-xz");
    expect(fdtdManifestJson(a.manifest)).toContain("emmicro.fdtd.sceneManifest.v1");
    expect(fdtdMeepScriptText(a.script)).toContain("import meep as mp");
    expect(fdtdMeepScriptText(a.script)).toContain("sim = mp.Simulation");
    expect(fdtdMeepScriptText(a.script)).toContain("tools/fdtd/postprocess_meep_output.py");
  });

  it("blocks curved material lens geometry instead of claiming an executable 3D Maxwell solve", () => {
    const scenario = addSimulationBuilderElement(
      defaultSimulationBuilderScenario(),
      createSimulationBuilderElement("curved-material-lens", 24, "Curved lens smoke")
    );
    const readiness = validateFdtdExportReadiness(scenario);
    const bundle = exportFdtdBundleFromSimulationBuilder(scenario);

    expect(readiness.status).toBe("blocked");
    expect(readiness.unsupported.map((item) => item.id)).toContain("curved-material-lens-24000");
    expect(bundle.script.warnings.map((warning) => warning.code)).toContain("fdtd.meep.blockedManifest");
  });

  it("keeps FDTD boundaries explicit", () => {
    const text = l81FdtdBoundary.join(" ");

    expect(text).toContain("External FDTD export/import only");
    expect(text).toContain("browser app does not execute FDTD");
    expect(text).toContain("No arbitrary 3D CAD geometry");
    expect(text).toContain("FEM/BEM/RCWA");
    expect(text).not.toMatch(/browser FDTD execution is available|full arbitrary 3D Maxwell solve|FEM execution available|digital twin certified/i);
  });
});
