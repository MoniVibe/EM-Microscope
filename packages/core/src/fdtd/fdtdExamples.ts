import {
  defaultSimulationBuilderScenario,
  runSimulationBuilderScenario,
  type SimulationBuilderScenario
} from "../maxwell/simulationBuilder";
import { exportFdtdBundleFromSimulationBuilder } from "./fdtdSceneExport";
import {
  fdtdFieldSliceToCsv,
  makeFdtdFieldSlice,
  makeFdtdFluxSummary,
  makeFdtdRunReceipt
} from "./fdtdRunImport";
import { validateFdtdImportedRunAgainstScenario } from "./fdtdValidation";
import type {
  FdtdExampleBundle,
  FdtdExportBundle,
  FdtdFieldSlice,
  FdtdFluxSummary,
  FdtdImportedRun,
  FdtdRunReceipt
} from "./fdtdTypes";

export function createTransparentFdtdExampleBundle(): FdtdExampleBundle {
  return createExampleBundle(createTransparentFdtdExampleScenario(), "transparent-slab");
}

export function createTransparentFdtdExampleScenario(): SimulationBuilderScenario {
  return defaultSimulationBuilderScenario();
}

export function createAbsorbingFdtdExampleScenario(): SimulationBuilderScenario {
  const base = defaultSimulationBuilderScenario();
  return {
    ...base,
    id: "l81-absorbing-slab-fdtd-fixture",
    label: "L8.1 absorbing slab external FDTD fixture",
    target: {
      ...base.target,
      kind: "absorbing-slab",
      label: "Beer-Lambert absorbing slab",
      incidentIndex: 1,
      substrateIndex: 1,
      absorptionCoefficientPerM: 5000,
      thicknessUm: 100
    }
  };
}

export function createAbsorbingFdtdExampleBundle(): FdtdExampleBundle {
  return createExampleBundle(createAbsorbingFdtdExampleScenario(), "absorbing-slab");
}

export function fdtdExampleReceiptJson(example: FdtdExampleBundle): string {
  return `${JSON.stringify(example.receipt, null, 2)}\n`;
}

export function fdtdExampleFluxSummaryJson(example: FdtdExampleBundle): string {
  return `${JSON.stringify(example.flux, null, 2)}\n`;
}

function createExampleBundle(scenario: SimulationBuilderScenario, runIdSuffix: string): FdtdExampleBundle {
  const bundle = exportFdtdBundleFromSimulationBuilder(scenario);
  const receipt = createExampleReceipt(bundle, runIdSuffix);
  const flux = createExampleFluxSummary(scenario, bundle, receipt);
  const fieldSlice = createExampleFieldSlice(scenario, bundle);
  const imported: FdtdImportedRun = {
    receipt,
    flux,
    fieldSlice,
    warnings: []
  };
  const validation = validateFdtdImportedRunAgainstScenario(scenario, bundle, imported);
  return {
    manifest: bundle.manifest,
    script: bundle.script,
    receipt,
    flux,
    fieldSlice,
    fieldSliceCsv: fdtdFieldSliceToCsv(fieldSlice),
    imported,
    validation
  };
}

function createExampleReceipt(bundle: FdtdExportBundle, runIdSuffix: string): FdtdRunReceipt {
  return makeFdtdRunReceipt({
    schema: "emmicro.fdtd.runReceipt.v1",
    runId: `l81-example-${runIdSuffix}`,
    sourceScenarioHash: bundle.manifest.sourceScenarioHash,
    manifestHash: bundle.manifest.manifestHash,
    scriptHash: bundle.script.scriptHash,
    tool: {
      name: "example-fixture",
      version: "emmicro.l81.fixture",
      postprocessorVersion: "emmicro.fdtd.postprocess.fixture.v1"
    },
    createdAtIso: "2026-06-06T00:00:00.000Z",
    settings: {
      resolution: Math.max(1, Math.round(1000 / bundle.manifest.grid.gridSpacingNm)),
      until: 200,
      pmlThicknessUm: bundle.manifest.boundaries.pmlThicknessUm
    },
    warnings: []
  });
}

function createExampleFluxSummary(scenario: SimulationBuilderScenario, bundle: FdtdExportBundle, receipt: FdtdRunReceipt): FdtdFluxSummary {
  const result = runSimulationBuilderScenario(scenario);
  const reflectance = result.validation.expected.reflectance;
  const transmittance = result.validation.expected.transmittance;
  const absorbance = result.validation.expected.absorbance;
  const incidentFlux = 1;
  return makeFdtdFluxSummary({
    schema: "emmicro.fdtd.fluxSummary.v1",
    runId: receipt.runId,
    sourceScenarioHash: bundle.manifest.sourceScenarioHash,
    manifestHash: bundle.manifest.manifestHash,
    incidentFlux,
    reflectedFlux: incidentFlux * reflectance,
    transmittedFlux: incidentFlux * transmittance,
    absorbedFlux: incidentFlux * absorbance,
    reflectance,
    transmittance,
    absorbance,
    energyBalance: reflectance + transmittance + absorbance,
    monitors: [
      { id: "incident-flux", flux: incidentFlux },
      { id: "reflected-flux", flux: reflectance },
      { id: "transmitted-flux", flux: transmittance }
    ],
    warnings: []
  });
}

function createExampleFieldSlice(scenario: SimulationBuilderScenario, bundle: FdtdExportBundle): FdtdFieldSlice {
  const result = runSimulationBuilderScenario(scenario);
  const xCount = 17;
  const zCount = 21;
  const width = scenario.grid.domainWidthUm;
  const zStart = scenario.grid.zStartMm * 1000;
  const zEnd = scenario.grid.zEndMm * 1000;
  const targetZ = scenario.target.zMm * 1000;
  const transmittance = Math.max(0, result.validation.expected.transmittance);
  const reflectance = Math.max(0, result.validation.expected.reflectance);
  const samples = [];
  for (let zi = 0; zi < zCount; zi += 1) {
    const zUm = zStart + ((zEnd - zStart) * zi) / (zCount - 1);
    const afterTarget = zUm >= targetZ;
    const axial = afterTarget ? Math.max(0, transmittance) : Math.max(0.2, 1 - 0.22 * reflectance * (1 + Math.cos((zUm / Math.max(1, targetZ)) * Math.PI * 8)));
    for (let xi = 0; xi < xCount; xi += 1) {
      const xUm = -width / 2 + (width * xi) / (xCount - 1);
      const edgeFalloff = 1 - 0.18 * Math.pow(Math.abs(xUm) / Math.max(0.001, width / 2), 2);
      const intensity = Math.max(0, axial * edgeFalloff);
      samples.push({
        xUm: round(xUm),
        zUm: round(zUm),
        value: round(Math.sqrt(intensity) * Math.cos((zUm / Math.max(0.001, scenario.source.wavelengthNm / 1000)) * Math.PI * 2)),
        intensity: round(intensity)
      });
    }
  }
  return makeFdtdFieldSlice({
    schema: "emmicro.fdtd.fieldSlice.v1",
    id: "field-slice-xz",
    sourceScenarioHash: bundle.manifest.sourceScenarioHash,
    manifestHash: bundle.manifest.manifestHash,
    component: "intensity",
    plane: "xz",
    samples,
    xCount,
    zCount
  });
}

function round(value: number): number {
  return Number(value.toPrecision(12));
}
