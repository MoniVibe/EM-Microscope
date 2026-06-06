import {
  createOpticalBenchExternalEvidence,
  createOpticalBenchScene,
  createOpticalBenchSolverPlan,
  createOpticalBenchValidationReport,
  defaultOpticalBenchScenario,
  opticalBenchCrossSection,
  runOpticalBenchScalarPreview,
  type OpticalBenchCrossSectionItem,
  type OpticalBenchExternalEvidence,
  type OpticalBenchScalarPreview,
  type OpticalBenchScene,
  type OpticalBenchSolverPlanRow,
  type OpticalBenchValidationReport
} from "../maxwell/multiElementBench";
import type { SimulationBuilderScenario } from "../maxwell/simulationBuilder";
import { exportFdtdBundleFromSimulationBuilder } from "./fdtdSceneExport";
import type { FdtdExportBundle } from "./fdtdTypes";

export type OpticalBenchBundle = {
  scene: OpticalBenchScene;
  crossSection: OpticalBenchCrossSectionItem[];
  solverPlan: OpticalBenchSolverPlanRow[];
  scalarPreview: OpticalBenchScalarPreview;
  fdtdBundle: FdtdExportBundle;
  externalEvidence: OpticalBenchExternalEvidence;
  validationReport: OpticalBenchValidationReport;
};

export function createOpticalBenchBundle(scenario: SimulationBuilderScenario = defaultOpticalBenchScenario()): OpticalBenchBundle {
  const scene = createOpticalBenchScene(scenario);
  const solverPlan = createOpticalBenchSolverPlan(scene);
  const scalarPreview = runOpticalBenchScalarPreview(scene);
  const fdtdBundle = exportFdtdBundleFromSimulationBuilder(scenario);
  const externalEvidence = createOpticalBenchExternalEvidence(scene, fdtdBundle);
  const validationReport = createOpticalBenchValidationReport({ scene, solverPlan, scalarPreview, externalEvidence });
  return {
    scene,
    crossSection: opticalBenchCrossSection(scene),
    solverPlan,
    scalarPreview,
    fdtdBundle,
    externalEvidence,
    validationReport
  };
}
