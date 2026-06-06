import {
  computeSimulationBuilderSurfaceValidation,
  defaultSimulationBuilderScenario,
  type SimulationBuilderScenario,
  type SimulationBuilderValidationStatus
} from "../maxwell/simulationBuilder";
import { runPlanarTmm } from "../maxwell/planarTmm";
import type { MaxwellMaterialSample } from "../maxwell/materials";
import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import { exportFdtdBundleFromSimulationBuilder, exportMeepScriptForFdtdManifest } from "./fdtdSceneExport";
import { makeFdtdFluxSummary, parseFdtdFluxSummaryJson } from "./fdtdRunImport";
import type { FdtdExportBundle, FdtdFluxSummary, FdtdMeepScriptExport, FdtdSceneManifest } from "./fdtdTypes";

export type FdtdBenchmarkKind = "empty-space" | "transparent-interface" | "transparent-slab" | "absorbing-slab" | "mirror";
export type FdtdConvergenceTrendStatus = "decreasing" | "stable" | "non-monotonic" | "unstable";

export type FdtdBenchmarkThresholds = {
  referenceResidualPass: number;
  referenceResidualWarning: number;
  energyBalancePass: number;
  energyBalanceWarning: number;
  pmlSensitivityWarning: number;
  pmlSensitivityFail: number;
  fieldDeltaWarning: number;
};

export type FdtdBenchmarkReference = {
  benchmarkKind: FdtdBenchmarkKind;
  referenceModel: "flux-conservation" | "fresnel-normal-incidence" | "planar-tmm-stack" | "beer-lambert" | "ideal-mirror";
  expected: { reflectance: number; transmittance: number; absorbance: number };
  invariant: string;
  thresholds: FdtdBenchmarkThresholds;
  referenceHash: string;
};

export type FdtdBenchmarkManifest = {
  schema: "emmicro.fdtd.benchmarkManifest.v1";
  id: string;
  label: string;
  benchmarkKind: FdtdBenchmarkKind;
  sourceScenarioHash: string;
  baseManifestHash: string;
  baseManifest: FdtdSceneManifest;
  reference: FdtdBenchmarkReference;
  limitations: string[];
  warnings: SolverWarning[];
  benchmarkHash: string;
};

export type FdtdSweepSettings = {
  resolutionPointsPerWavelength: number[];
  pmlThicknessUm: number[];
  paddingWavelengths: number[];
  monitorOffsetWavelengths: number[];
  runUntil: number;
  maxRunCount: number;
};

export type FdtdSweepRunRequest = {
  runId: string;
  index: number;
  resolutionPointsPerWavelength: number;
  pmlThicknessUm: number;
  paddingWavelengths: number;
  monitorOffsetWavelengths: number;
  runUntil: number;
  estimatedCells: number;
  scriptHash: string;
};

export type FdtdSweepPlan = {
  schema: "emmicro.fdtd.sweepPlan.v1";
  benchmarkHash: string;
  sourceScenarioHash: string;
  baseManifestHash: string;
  settings: FdtdSweepSettings;
  requestedRunCount: number;
  runCount: number;
  budget: {
    maxRunCount: number;
    truncated: boolean;
  };
  runs: FdtdSweepRunRequest[];
  warnings: SolverWarning[];
  sweepHash: string;
};

export type FdtdBenchmarkScript = {
  runId: string;
  filename: string;
  export: FdtdMeepScriptExport;
};

export type FdtdBenchmarkPack = {
  schema: "emmicro.fdtd.benchmarkPack.v1";
  benchmarkManifest: FdtdBenchmarkManifest;
  sweepPlan: FdtdSweepPlan;
  scripts: FdtdBenchmarkScript[];
  expectedReferenceJson: string;
  readme: string;
  packHash: string;
};

export type FdtdConvergenceRun = {
  runId: string;
  resolutionPointsPerWavelength: number;
  pmlThicknessUm: number;
  paddingWavelengths: number;
  monitorOffsetWavelengths: number;
  imported: { reflectance: number; transmittance: number; absorbance: number };
  expected: { reflectance: number; transmittance: number; absorbance: number };
  residuals: { reflectance: number; transmittance: number; absorbance: number; energyBalance: number; referenceResidual: number };
  energyBalance: number;
  fieldSliceDelta: number;
  status: SimulationBuilderValidationStatus;
  warnings: SolverWarning[];
};

export type FdtdConvergenceTrendRow = {
  resolutionPointsPerWavelength: number;
  meanReferenceResidual: number;
  maxEnergyBalanceError: number;
  meanFieldSliceDelta: number;
  runCount: number;
};

export type FdtdConvergenceSummary = {
  schema: "emmicro.fdtd.convergenceSummary.v1";
  benchmarkKind: FdtdBenchmarkKind;
  sourceScenarioHash: string;
  benchmarkHash: string;
  sweepHash: string;
  reference: FdtdBenchmarkReference;
  runs: FdtdConvergenceRun[];
  trend: {
    status: FdtdConvergenceTrendStatus;
    rows: FdtdConvergenceTrendRow[];
    finalReferenceResidual: number;
    finalEnergyBalanceError: number;
  };
  pmlSensitivity: {
    maxDelta: number;
    status: SimulationBuilderValidationStatus;
  };
  status: SimulationBuilderValidationStatus;
  warnings: SolverWarning[];
  summaryHash: string;
};

export type FdtdBenchmarkExampleBundle = {
  pack: FdtdBenchmarkPack;
  convergenceSummary: FdtdConvergenceSummary;
  fluxSummaries: FdtdFluxSummary[];
};

export type FdtdConvergenceImportInput = {
  convergenceSummaryJson: string | FdtdConvergenceSummary;
  fluxSummariesJson?: string | FdtdFluxSummary[];
  expectedPack?: FdtdBenchmarkPack;
};

export const l82FdtdBenchmarkBoundary = [
  "External FDTD benchmark/convergence support only; this benchmark workflow does not execute production FDTD in the browser.",
  "Benchmark packs export deterministic manifests, sweep plans, and Meep helper scripts for optional external execution.",
  "Imported convergence summaries are evidence from external runs or deterministic fixtures, not in-browser Maxwell solves.",
  "No arbitrary 3D CAD geometry, curved material lens solve, finite-thickness metal aperture Maxwell solve, FEM/BEM/RCWA execution, production solver validation, sensor-stack EM, digital twin, or manufacturing certification is claimed."
] as const;

export const fdtdBenchmarkKinds: FdtdBenchmarkKind[] = ["empty-space", "transparent-interface", "transparent-slab", "absorbing-slab", "mirror"];

export function defaultFdtdSweepSettings(): FdtdSweepSettings {
  return {
    resolutionPointsPerWavelength: [10, 15, 20, 30],
    pmlThicknessUm: [0.5, 1, 1.5],
    paddingWavelengths: [1, 2, 3],
    monitorOffsetWavelengths: [1.5],
    runUntil: 240,
    maxRunCount: 36
  };
}

export function createFdtdBenchmarkScenario(kind: FdtdBenchmarkKind): SimulationBuilderScenario {
  const base = defaultSimulationBuilderScenario();
  if (kind === "empty-space") {
    return {
      ...base,
      id: "l82-empty-space-fdtd-benchmark",
      label: "L8.2 empty-space external FDTD convergence benchmark",
      elements: [],
      target: {
        ...base.target,
        label: "Air to air empty-space marker",
        incidentIndex: 1,
        substrateIndex: 1,
        thicknessUm: 0
      }
    };
  }
  if (kind === "transparent-slab") {
    return {
      ...base,
      id: "l82-transparent-slab-fdtd-benchmark",
      label: "L8.2 transparent slab external FDTD convergence benchmark",
      target: {
        ...base.target,
        label: "Air-glass-air transparent slab",
        incidentIndex: 1,
        substrateIndex: 1.5,
        thicknessUm: 250
      }
    };
  }
  if (kind === "absorbing-slab") {
    return {
      ...base,
      id: "l82-absorbing-slab-fdtd-benchmark",
      label: "L8.2 absorbing slab external FDTD convergence benchmark",
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
  if (kind === "mirror") {
    return {
      ...base,
      id: "l82-mirror-fdtd-benchmark",
      label: "L8.2 mirror external FDTD convergence benchmark",
      target: {
        ...base.target,
        kind: "mirror",
        label: "Ideal mirror / reflective surface",
        incidentIndex: 1,
        substrateIndex: 1,
        thicknessUm: 0
      }
    };
  }
  return {
    ...base,
    id: "l82-transparent-interface-fdtd-benchmark",
    label: "L8.2 transparent interface external FDTD convergence benchmark",
    target: {
      ...base.target,
      label: "Air to glass transparent dielectric interface",
      incidentIndex: 1,
      substrateIndex: 1.5,
      thicknessUm: 0
    }
  };
}

export function createFdtdBenchmarkReference(kind: FdtdBenchmarkKind, scenario = createFdtdBenchmarkScenario(kind)): FdtdBenchmarkReference {
  const thresholds = defaultBenchmarkThresholds();
  const expected = expectedRtaForBenchmark(kind, scenario);
  const referenceModel = referenceModelForBenchmark(kind);
  const draft = {
    benchmarkKind: kind,
    referenceModel,
    expected,
    invariant: invariantForBenchmark(kind),
    thresholds
  };
  return {
    ...draft,
    referenceHash: fnv1a64(stableStringify(draft))
  };
}

export function createFdtdBenchmarkPack(input: {
  benchmarkKind: FdtdBenchmarkKind;
  scenario?: SimulationBuilderScenario;
  sweepSettings?: Partial<FdtdSweepSettings>;
}): FdtdBenchmarkPack {
  const scenario = input.scenario ?? createFdtdBenchmarkScenario(input.benchmarkKind);
  const baseBundle = exportFdtdBundleFromSimulationBuilder(scenario);
  const reference = createFdtdBenchmarkReference(input.benchmarkKind, scenario);
  const warnings = baseBundle.manifest.readiness.status === "blocked"
    ? [{ code: "fdtd.benchmark.blockedManifest", message: "Benchmark manifest contains unsupported geometry and must not be treated as executable external FDTD evidence." }]
    : [];
  const manifestDraft = {
    schema: "emmicro.fdtd.benchmarkManifest.v1" as const,
    id: `l82-${input.benchmarkKind}-benchmark`,
    label: `L8.2 ${benchmarkLabel(input.benchmarkKind)} convergence benchmark`,
    benchmarkKind: input.benchmarkKind,
    sourceScenarioHash: baseBundle.manifest.sourceScenarioHash,
    baseManifestHash: baseBundle.manifest.manifestHash,
    baseManifest: baseBundle.manifest,
    reference,
    limitations: [...l82FdtdBenchmarkBoundary],
    warnings
  };
  const benchmarkManifest: FdtdBenchmarkManifest = {
    ...manifestDraft,
    benchmarkHash: fnv1a64(stableStringify(manifestDraft))
  };
  const sweepPlan = createFdtdSweepPlan(benchmarkManifest, baseBundle, input.sweepSettings);
  const scripts = sweepPlan.runs.map((run) => createBenchmarkScript(baseBundle.manifest, run));
  const expectedReferenceJson = `${JSON.stringify(reference, null, 2)}\n`;
  const readme = fdtdBenchmarkPackReadme(benchmarkManifest, sweepPlan);
  const packDraft = {
    schema: "emmicro.fdtd.benchmarkPack.v1" as const,
    benchmarkManifest,
    sweepPlan,
    scripts,
    expectedReferenceJson,
    readme
  };
  return {
    ...packDraft,
    packHash: fnv1a64(stableStringify(packForHash(packDraft)))
  };
}

export function createFdtdSweepPlan(
  benchmarkManifest: FdtdBenchmarkManifest,
  baseBundle: FdtdExportBundle,
  settingsPatch: Partial<FdtdSweepSettings> = {}
): FdtdSweepPlan {
  const settings = normalizeSweepSettings({ ...defaultFdtdSweepSettings(), ...settingsPatch });
  const requested = cartesian(settings.resolutionPointsPerWavelength, settings.pmlThicknessUm, settings.paddingWavelengths, settings.monitorOffsetWavelengths);
  const truncated = requested.length > settings.maxRunCount;
  const selected = requested.slice(0, settings.maxRunCount);
  const warnings: SolverWarning[] = [];
  if (truncated) {
    warnings.push({
      code: "fdtd.benchmark.sweepTruncated",
      message: `Sweep requested ${requested.length} runs and was truncated to ${settings.maxRunCount}.`
    });
  }
  if (selected.length >= 24) {
    warnings.push({
      code: "fdtd.benchmark.externalCostReview",
      message: `Sweep contains ${selected.length} external runs; review cost before launching an external solver.`
    });
  }
  const runs = selected.map((entry, index): FdtdSweepRunRequest => {
    const runSeed = {
      benchmarkHash: benchmarkManifest.benchmarkHash,
      index,
      resolutionPointsPerWavelength: entry.resolution,
      pmlThicknessUm: entry.pml,
      paddingWavelengths: entry.padding,
      monitorOffsetWavelengths: entry.monitorOffset,
      runUntil: settings.runUntil
    };
    const runId = `l82-${benchmarkManifest.benchmarkKind}-r${entry.resolution}-pml${formatIdNumber(entry.pml)}-pad${formatIdNumber(entry.padding)}-m${formatIdNumber(entry.monitorOffset)}`;
    const scriptSeed = { runId, baseScriptHash: baseBundle.script.scriptHash, ...runSeed };
    return {
      runId,
      index,
      resolutionPointsPerWavelength: entry.resolution,
      pmlThicknessUm: entry.pml,
      paddingWavelengths: entry.padding,
      monitorOffsetWavelengths: entry.monitorOffset,
      runUntil: settings.runUntil,
      estimatedCells: estimateRunCells(baseBundle.manifest, entry.resolution, entry.padding),
      scriptHash: fnv1a64(stableStringify(scriptSeed))
    };
  });
  const draft = {
    schema: "emmicro.fdtd.sweepPlan.v1" as const,
    benchmarkHash: benchmarkManifest.benchmarkHash,
    sourceScenarioHash: benchmarkManifest.sourceScenarioHash,
    baseManifestHash: benchmarkManifest.baseManifestHash,
    settings,
    requestedRunCount: requested.length,
    runCount: runs.length,
    budget: {
      maxRunCount: settings.maxRunCount,
      truncated
    },
    runs,
    warnings
  };
  return {
    ...draft,
    sweepHash: fnv1a64(stableStringify(draft))
  };
}

export function createFdtdBenchmarkExampleBundle(kind: FdtdBenchmarkKind, options: { pmlSensitive?: boolean; unstable?: boolean } = {}): FdtdBenchmarkExampleBundle {
  const pack = createFdtdBenchmarkPack({ benchmarkKind: kind });
  const convergenceSummary = createFdtdConvergenceSummaryFixture(pack, options);
  const fluxSummaries = convergenceSummary.runs.map((run) => makeFluxSummaryForRun(pack, run));
  return { pack, convergenceSummary, fluxSummaries };
}

export function createFdtdBenchmarkExampleBundles(): Record<FdtdBenchmarkKind, FdtdBenchmarkExampleBundle> {
  return {
    "empty-space": createFdtdBenchmarkExampleBundle("empty-space"),
    "transparent-interface": createFdtdBenchmarkExampleBundle("transparent-interface"),
    "transparent-slab": createFdtdBenchmarkExampleBundle("transparent-slab"),
    "absorbing-slab": createFdtdBenchmarkExampleBundle("absorbing-slab", { pmlSensitive: true }),
    mirror: createFdtdBenchmarkExampleBundle("mirror")
  };
}

export function createFdtdConvergenceSummaryFixture(pack: FdtdBenchmarkPack, options: { pmlSensitive?: boolean; unstable?: boolean } = {}): FdtdConvergenceSummary {
  const runs = pack.sweepPlan.runs.map((request) => syntheticConvergenceRun(pack.benchmarkManifest.reference, request, options));
  return makeFdtdConvergenceSummary({
    benchmarkKind: pack.benchmarkManifest.benchmarkKind,
    sourceScenarioHash: pack.benchmarkManifest.sourceScenarioHash,
    benchmarkHash: pack.benchmarkManifest.benchmarkHash,
    sweepHash: pack.sweepPlan.sweepHash,
    reference: pack.benchmarkManifest.reference,
    runs,
    warnings: [...pack.benchmarkManifest.warnings, ...pack.sweepPlan.warnings]
  });
}

export function makeFdtdConvergenceSummary(input: {
  benchmarkKind: FdtdBenchmarkKind;
  sourceScenarioHash: string;
  benchmarkHash: string;
  sweepHash: string;
  reference: FdtdBenchmarkReference;
  runs: Array<Omit<FdtdConvergenceRun, "expected" | "residuals" | "energyBalance" | "status" | "warnings"> & Partial<Pick<FdtdConvergenceRun, "expected" | "residuals" | "energyBalance" | "status" | "warnings">>>;
  warnings?: SolverWarning[];
}): FdtdConvergenceSummary {
  const runs = input.runs.map((run) => analyzeRun(input.reference, run));
  const trendRows = convergenceTrendRows(runs);
  const trendStatus = convergenceTrendStatus(trendRows, input.reference.thresholds);
  const pmlSensitivity = pmlSensitivityForRuns(runs, input.reference.thresholds);
  const warnings = uniqueWarnings([...(input.warnings ?? []), ...runs.flatMap((run) => run.warnings), ...trendWarnings(trendStatus), ...pmlWarnings(pmlSensitivity)]);
  const final = trendRows.at(-1);
  const finalReferenceResidual = final?.meanReferenceResidual ?? Number.POSITIVE_INFINITY;
  const finalEnergyBalanceError = final?.maxEnergyBalanceError ?? Number.POSITIVE_INFINITY;
  const status = statusForSummary(finalReferenceResidual, finalEnergyBalanceError, trendStatus, pmlSensitivity.status, input.reference.thresholds, warnings);
  const draft = {
    schema: "emmicro.fdtd.convergenceSummary.v1" as const,
    benchmarkKind: input.benchmarkKind,
    sourceScenarioHash: input.sourceScenarioHash,
    benchmarkHash: input.benchmarkHash,
    sweepHash: input.sweepHash,
    reference: input.reference,
    runs,
    trend: {
      status: trendStatus,
      rows: trendRows,
      finalReferenceResidual,
      finalEnergyBalanceError
    },
    pmlSensitivity,
    status,
    warnings
  };
  return {
    ...draft,
    summaryHash: fnv1a64(stableStringify(summaryForHash(draft)))
  };
}

export function importFdtdConvergenceBundleArtifacts(input: FdtdConvergenceImportInput): FdtdConvergenceSummary {
  const parsed = parseFdtdConvergenceSummaryJson(input.convergenceSummaryJson);
  const fluxByRun = new Map<string, FdtdFluxSummary>();
  for (const flux of parseFluxSummaryArray(input.fluxSummariesJson)) {
    fluxByRun.set(flux.runId, flux);
  }
  const runs = parsed.runs.map((run) => {
    const flux = fluxByRun.get(run.runId);
    return flux
      ? {
          ...run,
          imported: {
            reflectance: flux.reflectance,
            transmittance: flux.transmittance,
            absorbance: flux.absorbance
          }
        }
      : run;
  });
  const warnings: SolverWarning[] = [...parsed.warnings];
  if (input.expectedPack) {
    if (parsed.benchmarkHash !== input.expectedPack.benchmarkManifest.benchmarkHash) {
      warnings.push({
        code: "fdtd.convergence.benchmarkHashMismatch",
        message: "Imported convergence summary does not match the active benchmark manifest hash."
      });
    }
    if (parsed.sweepHash !== input.expectedPack.sweepPlan.sweepHash) {
      warnings.push({
        code: "fdtd.convergence.sweepHashMismatch",
        message: "Imported convergence summary does not match the active sweep plan hash."
      });
    }
    if (parsed.sourceScenarioHash !== input.expectedPack.benchmarkManifest.sourceScenarioHash) {
      warnings.push({
        code: "fdtd.convergence.sourceHashMismatch",
        message: "Imported convergence summary does not match the active Simulation Builder scene hash."
      });
    }
  }
  return makeFdtdConvergenceSummary({
    benchmarkKind: parsed.benchmarkKind,
    sourceScenarioHash: parsed.sourceScenarioHash,
    benchmarkHash: parsed.benchmarkHash,
    sweepHash: parsed.sweepHash,
    reference: input.expectedPack?.benchmarkManifest.reference ?? parsed.reference,
    runs,
    warnings
  });
}

export function parseFdtdConvergenceSummaryJson(value: string | FdtdConvergenceSummary): FdtdConvergenceSummary {
  const record = parseObject(value, "FDTD convergence summary");
  if (record.schema !== "emmicro.fdtd.convergenceSummary.v1") throw new Error("FDTD convergence summary schema must be emmicro.fdtd.convergenceSummary.v1");
  const benchmarkKind = parseBenchmarkKind(requiredString(record, "benchmarkKind"));
  const reference = parseReference(parseObject(record.reference, "convergence.reference"));
  const runs = requiredArray(record.runs, "runs").map((item, index) => parseConvergenceRun(parseObject(item, `run ${index + 1}`), reference));
  return makeFdtdConvergenceSummary({
    benchmarkKind,
    sourceScenarioHash: requiredString(record, "sourceScenarioHash"),
    benchmarkHash: requiredString(record, "benchmarkHash"),
    sweepHash: requiredString(record, "sweepHash"),
    reference,
    runs,
    warnings: parseWarnings(record.warnings)
  });
}

export function fdtdBenchmarkManifestJson(manifest: FdtdBenchmarkManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export function fdtdSweepPlanJson(plan: FdtdSweepPlan): string {
  return `${JSON.stringify(plan, null, 2)}\n`;
}

export function fdtdConvergenceSummaryJson(summary: FdtdConvergenceSummary): string {
  return `${JSON.stringify(summary, null, 2)}\n`;
}

export function fdtdFluxSummariesJson(fluxSummaries: FdtdFluxSummary[]): string {
  return `${JSON.stringify(fluxSummaries, null, 2)}\n`;
}

export function fdtdBenchmarkReportJson(summary: FdtdConvergenceSummary): string {
  return `${JSON.stringify(summary, null, 2)}\n`;
}

export function fdtdBenchmarkReportMarkdown(summary: FdtdConvergenceSummary): string {
  return [
    `# L8.2 ${benchmarkLabel(summary.benchmarkKind)} FDTD Benchmark Convergence Report`,
    "",
    `Status: ${summary.status.toUpperCase()}`,
    `Reference model: ${summary.reference.referenceModel}`,
    `Benchmark hash: ${summary.benchmarkHash}`,
    `Sweep hash: ${summary.sweepHash}`,
    `Summary hash: ${summary.summaryHash}`,
    "",
    "## Reference",
    "",
    `Invariant: ${summary.reference.invariant}`,
    "",
    "| Metric | Expected |",
    "| --- | ---: |",
    `| R | ${formatNumber(summary.reference.expected.reflectance)} |`,
    `| T | ${formatNumber(summary.reference.expected.transmittance)} |`,
    `| A | ${formatNumber(summary.reference.expected.absorbance)} |`,
    "",
    "## Convergence Trend",
    "",
    "| Resolution ppw | Mean reference residual | Max energy error | Mean field delta | Runs |",
    "| ---: | ---: | ---: | ---: | ---: |",
    ...summary.trend.rows.map((row) => `| ${row.resolutionPointsPerWavelength} | ${formatNumber(row.meanReferenceResidual)} | ${formatNumber(row.maxEnergyBalanceError)} | ${formatNumber(row.meanFieldSliceDelta)} | ${row.runCount} |`),
    "",
    `Trend: ${summary.trend.status}`,
    `PML sensitivity max delta: ${formatNumber(summary.pmlSensitivity.maxDelta)} (${summary.pmlSensitivity.status})`,
    "",
    "## Run Table",
    "",
    "| Run | ppw | PML um | padding lambda | R | T | A | residual | energy error | status |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
    ...summary.runs.map((run) => `| ${run.runId} | ${run.resolutionPointsPerWavelength} | ${formatNumber(run.pmlThicknessUm)} | ${formatNumber(run.paddingWavelengths)} | ${formatNumber(run.imported.reflectance)} | ${formatNumber(run.imported.transmittance)} | ${formatNumber(run.imported.absorbance)} | ${formatNumber(run.residuals.referenceResidual)} | ${formatNumber(run.residuals.energyBalance)} | ${run.status} |`),
    "",
    "## Warnings",
    ...(summary.warnings.length ? summary.warnings.map((warning) => `- ${warning.message}`) : ["- none"]),
    "",
    "## Boundary",
    ...l82FdtdBenchmarkBoundary.map((item) => `- ${item}`)
  ].join("\n");
}

export function fdtdConvergenceMetricsCsv(summary: FdtdConvergenceSummary): string {
  return [
    "resolution_points_per_wavelength,mean_reference_residual,max_energy_balance_error,mean_field_slice_delta,run_count,status",
    ...summary.trend.rows.map((row) => [row.resolutionPointsPerWavelength, row.meanReferenceResidual, row.maxEnergyBalanceError, row.meanFieldSliceDelta, row.runCount, summary.status].join(","))
  ].join("\n");
}

export function fdtdRunTableCsv(summary: FdtdConvergenceSummary): string {
  return [
    "run_id,resolution_points_per_wavelength,pml_thickness_um,padding_wavelengths,monitor_offset_wavelengths,reflectance,transmittance,absorbance,reference_residual,energy_balance_error,field_slice_delta,status",
    ...summary.runs.map((run) =>
      [
        run.runId,
        run.resolutionPointsPerWavelength,
        run.pmlThicknessUm,
        run.paddingWavelengths,
        run.monitorOffsetWavelengths,
        run.imported.reflectance,
        run.imported.transmittance,
        run.imported.absorbance,
        run.residuals.referenceResidual,
        run.residuals.energyBalance,
        run.fieldSliceDelta,
        run.status
      ].join(",")
    )
  ].join("\n");
}

export function fdtdBenchmarkPackReadme(manifest: FdtdBenchmarkManifest, sweepPlan: FdtdSweepPlan): string {
  return [
    `# L8.2 ${benchmarkLabel(manifest.benchmarkKind)} FDTD Benchmark Pack`,
    "",
    "This pack is for optional external FDTD verification. Run these Meep/FDTD jobs outside the browser; L9.1's separate in-browser 2D sandbox is diagnostic only.",
    "",
    "Files:",
    "- benchmark_manifest.json",
    "- sweep_plan.json",
    "- expected_reference.json",
    "- meep_scripts/*.py",
    "- convergence_summary.json after external postprocess",
    "",
    `Run count: ${sweepPlan.runCount}`,
    `Reference model: ${manifest.reference.referenceModel}`,
    `Expected R/T/A: ${formatNumber(manifest.reference.expected.reflectance)} / ${formatNumber(manifest.reference.expected.transmittance)} / ${formatNumber(manifest.reference.expected.absorbance)}`,
    "",
    "Do not treat this pack as production solver validation, certification, hardware control, or a general 3D Maxwell/CAD/FEM/BEM/RCWA workflow."
  ].join("\n");
}

function createBenchmarkScript(manifest: FdtdSceneManifest, run: FdtdSweepRunRequest): FdtdBenchmarkScript {
  const adjustedManifest = {
    ...manifest,
    grid: {
      ...manifest.grid,
      pointsPerWavelength: run.resolutionPointsPerWavelength,
      gridSpacingNm: manifest.source.wavelengthUm * 1000 / run.resolutionPointsPerWavelength,
      estimatedCells: run.estimatedCells
    },
    boundaries: {
      ...manifest.boundaries,
      pmlThicknessUm: run.pmlThicknessUm
    }
  };
  const baseScript = exportMeepScriptForFdtdManifest(adjustedManifest);
  const python = [
    `# L8.2 benchmark run: ${run.runId}`,
    `# padding_wavelengths: ${formatNumber(run.paddingWavelengths)}`,
    `# monitor_offset_wavelengths: ${formatNumber(run.monitorOffsetWavelengths)}`,
    `# run_until: ${formatNumber(run.runUntil)}`,
    baseScript.python
  ].join("\n");
  const scriptHash = fnv1a64(stableStringify({ runId: run.runId, baseScriptHash: baseScript.scriptHash, python }));
  return {
    runId: run.runId,
    filename: `${run.runId}.py`,
    export: {
      ...baseScript,
      scriptHash,
      python
    }
  };
}

function syntheticConvergenceRun(reference: FdtdBenchmarkReference, request: FdtdSweepRunRequest, options: { pmlSensitive?: boolean; unstable?: boolean }): FdtdConvergenceRun {
  const normalizedResolution = request.resolutionPointsPerWavelength / 10;
  const base = baseResidualFor(reference.benchmarkKind) / Math.max(1, normalizedResolution * normalizedResolution);
  const pmlBias = request.pmlThicknessUm <= 0.5 ? (options.pmlSensitive ? 0.045 : 0.006) : request.pmlThicknessUm < 1 ? 0.003 : 0.0005;
  const paddingBias = request.paddingWavelengths <= 1 ? 0.003 : request.paddingWavelengths >= 3 ? -0.0005 : 0;
  const unstableBias = options.unstable && request.resolutionPointsPerWavelength >= 20 ? 0.035 : 0;
  const residual = Math.max(0, base + pmlBias + paddingBias + unstableBias);
  const sign = reference.benchmarkKind === "absorbing-slab" ? -1 : 1;
  const imported = clampRta({
    reflectance: reference.expected.reflectance + residual * 0.42,
    transmittance: reference.expected.transmittance - sign * residual * 0.5,
    absorbance: reference.expected.absorbance + sign * residual * 0.18
  });
  const energyNudge = request.pmlThicknessUm <= 0.5 ? 0.003 : 0.0004;
  const withEnergy = {
    ...imported,
    absorbance: Math.max(0, imported.absorbance + energyNudge)
  };
  return analyzeRun(reference, {
    runId: request.runId,
    resolutionPointsPerWavelength: request.resolutionPointsPerWavelength,
    pmlThicknessUm: request.pmlThicknessUm,
    paddingWavelengths: request.paddingWavelengths,
    monitorOffsetWavelengths: request.monitorOffsetWavelengths,
    imported: withEnergy,
    fieldSliceDelta: Math.max(0.0001, residual * 0.7)
  });
}

function makeFluxSummaryForRun(pack: FdtdBenchmarkPack, run: FdtdConvergenceRun): FdtdFluxSummary {
  const incidentFlux = 1;
  return makeFdtdFluxSummary({
    schema: "emmicro.fdtd.fluxSummary.v1",
    runId: run.runId,
    sourceScenarioHash: pack.benchmarkManifest.sourceScenarioHash,
    manifestHash: pack.benchmarkManifest.baseManifestHash,
    incidentFlux,
    reflectedFlux: run.imported.reflectance,
    transmittedFlux: run.imported.transmittance,
    absorbedFlux: run.imported.absorbance,
    reflectance: run.imported.reflectance,
    transmittance: run.imported.transmittance,
    absorbance: run.imported.absorbance,
    energyBalance: run.energyBalance,
    monitors: [
      { id: "incident-flux", flux: incidentFlux },
      { id: "reflected-flux", flux: run.imported.reflectance },
      { id: "transmitted-flux", flux: run.imported.transmittance }
    ],
    warnings: run.warnings
  });
}

function analyzeRun(
  reference: FdtdBenchmarkReference,
  run: Omit<FdtdConvergenceRun, "expected" | "residuals" | "energyBalance" | "status" | "warnings"> & Partial<Pick<FdtdConvergenceRun, "expected" | "residuals" | "energyBalance" | "status" | "warnings">>
): FdtdConvergenceRun {
  const expected = reference.expected;
  const energyBalance = run.imported.reflectance + run.imported.transmittance + run.imported.absorbance;
  const residuals = {
    reflectance: Math.abs(run.imported.reflectance - expected.reflectance),
    transmittance: Math.abs(run.imported.transmittance - expected.transmittance),
    absorbance: Math.abs(run.imported.absorbance - expected.absorbance),
    energyBalance: Math.abs(energyBalance - 1),
    referenceResidual: Math.max(
      Math.abs(run.imported.reflectance - expected.reflectance),
      Math.abs(run.imported.transmittance - expected.transmittance),
      Math.abs(run.imported.absorbance - expected.absorbance)
    )
  };
  const status = statusForRun(residuals.referenceResidual, residuals.energyBalance, reference.thresholds);
  const warnings: SolverWarning[] = [...(run.warnings ?? [])];
  if (residuals.energyBalance > reference.thresholds.energyBalanceWarning) {
    warnings.push({
      code: "fdtd.convergence.energyBalanceHigh",
      message: `Run ${run.runId} has R+T+A energy-balance error ${residuals.energyBalance.toExponential(3)}.`
    });
  }
  return {
    runId: run.runId,
    resolutionPointsPerWavelength: run.resolutionPointsPerWavelength,
    pmlThicknessUm: run.pmlThicknessUm,
    paddingWavelengths: run.paddingWavelengths,
    monitorOffsetWavelengths: run.monitorOffsetWavelengths,
    imported: run.imported,
    expected,
    residuals,
    energyBalance,
    fieldSliceDelta: run.fieldSliceDelta,
    status,
    warnings: uniqueWarnings(warnings)
  };
}

function expectedRtaForBenchmark(kind: FdtdBenchmarkKind, scenario: SimulationBuilderScenario): FdtdBenchmarkReference["expected"] {
  if (kind === "empty-space") return { reflectance: 0, transmittance: 1, absorbance: 0 };
  if (kind === "transparent-slab") {
    const tmm = runPlanarTmm({
      id: "l82-transparent-slab-reference",
      label: "Air-glass-air transparent slab TMM reference",
      wavelengthM: scenario.source.wavelengthNm * 1e-9,
      angleRad: 0,
      polarization: "TE",
      incidentMedium: material("air", "Air", 1, 0),
      substrateMedium: material("air-exit", "Air exit", 1, 0),
      layers: [
        {
          id: "glass-slab",
          label: "Transparent glass slab",
          material: material("glass", "Glass", scenario.target.substrateIndex, 0),
          thicknessM: Math.max(1e-9, scenario.target.thicknessUm * 1e-6)
        }
      ],
      tolerance: 1e-8
    });
    return { reflectance: tmm.reflectance, transmittance: tmm.transmittance, absorbance: tmm.absorbance };
  }
  const surface = computeSimulationBuilderSurfaceValidation(scenario.target, scenario.source.wavelengthNm);
  return { ...surface.expected };
}

function defaultBenchmarkThresholds(): FdtdBenchmarkThresholds {
  return {
    referenceResidualPass: 0.02,
    referenceResidualWarning: 0.06,
    energyBalancePass: 0.01,
    energyBalanceWarning: 0.03,
    pmlSensitivityWarning: 0.015,
    pmlSensitivityFail: 0.05,
    fieldDeltaWarning: 0.08
  };
}

function referenceModelForBenchmark(kind: FdtdBenchmarkKind): FdtdBenchmarkReference["referenceModel"] {
  if (kind === "empty-space") return "flux-conservation";
  if (kind === "transparent-interface") return "fresnel-normal-incidence";
  if (kind === "transparent-slab") return "planar-tmm-stack";
  if (kind === "absorbing-slab") return "beer-lambert";
  return "ideal-mirror";
}

function invariantForBenchmark(kind: FdtdBenchmarkKind): string {
  if (kind === "empty-space") return "R stays near 0, T stays near 1, and R+T+A stays near 1 as resolution/PML/padding vary.";
  if (kind === "transparent-interface") return "Normal-incidence Fresnel R/T stabilizes as grid density increases.";
  if (kind === "transparent-slab") return "Planar TMM slab R/T/A stabilizes as grid density increases.";
  if (kind === "absorbing-slab") return "Beer-Lambert attenuation residual and energy balance stabilize as grid density increases.";
  return "Ideal mirror reflectance stays near 1 while transmission stays near 0.";
}

function benchmarkLabel(kind: FdtdBenchmarkKind): string {
  if (kind === "empty-space") return "Empty-space propagation";
  if (kind === "transparent-interface") return "Transparent dielectric interface";
  if (kind === "transparent-slab") return "Transparent slab";
  if (kind === "absorbing-slab") return "Absorbing slab";
  return "Ideal mirror";
}

function normalizeSweepSettings(settings: FdtdSweepSettings): FdtdSweepSettings {
  return {
    resolutionPointsPerWavelength: positiveUnique(settings.resolutionPointsPerWavelength),
    pmlThicknessUm: positiveUnique(settings.pmlThicknessUm),
    paddingWavelengths: positiveUnique(settings.paddingWavelengths),
    monitorOffsetWavelengths: positiveUnique(settings.monitorOffsetWavelengths),
    runUntil: positive(settings.runUntil, "runUntil"),
    maxRunCount: Math.max(1, Math.floor(positive(settings.maxRunCount, "maxRunCount")))
  };
}

function cartesian(resolution: number[], pml: number[], padding: number[], monitorOffset: number[]): Array<{ resolution: number; pml: number; padding: number; monitorOffset: number }> {
  const rows: Array<{ resolution: number; pml: number; padding: number; monitorOffset: number }> = [];
  for (const r of resolution) {
    for (const p of pml) {
      for (const pad of padding) {
        for (const monitor of monitorOffset) rows.push({ resolution: r, pml: p, padding: pad, monitorOffset: monitor });
      }
    }
  }
  return rows;
}

function estimateRunCells(manifest: FdtdSceneManifest, resolutionPointsPerWavelength: number, paddingWavelengths: number): number {
  const scale = resolutionPointsPerWavelength / Math.max(1, manifest.grid.pointsPerWavelength);
  const paddingScale = 1 + Math.max(0, paddingWavelengths) * 0.08;
  return Math.round(manifest.grid.estimatedCells * scale ** 3 * paddingScale);
}

function convergenceTrendRows(runs: FdtdConvergenceRun[]): FdtdConvergenceTrendRow[] {
  const resolutions = [...new Set(runs.map((run) => run.resolutionPointsPerWavelength))].sort((a, b) => a - b);
  return resolutions.map((resolution) => {
    const group = runs.filter((run) => run.resolutionPointsPerWavelength === resolution);
    const count = Math.max(1, group.length);
    return {
      resolutionPointsPerWavelength: resolution,
      meanReferenceResidual: group.reduce((sum, run) => sum + run.residuals.referenceResidual, 0) / count,
      maxEnergyBalanceError: Math.max(...group.map((run) => run.residuals.energyBalance)),
      meanFieldSliceDelta: group.reduce((sum, run) => sum + run.fieldSliceDelta, 0) / count,
      runCount: group.length
    };
  });
}

function convergenceTrendStatus(rows: FdtdConvergenceTrendRow[], thresholds: FdtdBenchmarkThresholds): FdtdConvergenceTrendStatus {
  if (rows.length < 2) return "stable";
  const first = rows[0]!;
  const last = rows[rows.length - 1]!;
  const nonMonotonic = rows.some((row, index) => index > 0 && row.meanReferenceResidual > rows[index - 1]!.meanReferenceResidual + thresholds.referenceResidualPass * 0.25);
  if (last.meanReferenceResidual > first.meanReferenceResidual * 1.1) return "unstable";
  if (nonMonotonic) return "non-monotonic";
  if (last.meanReferenceResidual < first.meanReferenceResidual * 0.75) return "decreasing";
  return "stable";
}

function pmlSensitivityForRuns(runs: FdtdConvergenceRun[], thresholds: FdtdBenchmarkThresholds): FdtdConvergenceSummary["pmlSensitivity"] {
  const keys = [...new Set(runs.map((run) => `${run.resolutionPointsPerWavelength}:${run.paddingWavelengths}:${run.monitorOffsetWavelengths}`))];
  let maxDelta = 0;
  for (const key of keys) {
    const group = runs.filter((run) => `${run.resolutionPointsPerWavelength}:${run.paddingWavelengths}:${run.monitorOffsetWavelengths}` === key);
    if (group.length < 2) continue;
    const residuals = group.map((run) => run.residuals.referenceResidual);
    maxDelta = Math.max(maxDelta, Math.max(...residuals) - Math.min(...residuals));
  }
  const status: SimulationBuilderValidationStatus = maxDelta > thresholds.pmlSensitivityFail ? "fail" : maxDelta > thresholds.pmlSensitivityWarning ? "warning" : "pass";
  return { maxDelta, status };
}

function statusForRun(referenceResidual: number, energyBalanceError: number, thresholds: FdtdBenchmarkThresholds): SimulationBuilderValidationStatus {
  if (referenceResidual <= thresholds.referenceResidualPass && energyBalanceError <= thresholds.energyBalancePass) return "pass";
  if (referenceResidual <= thresholds.referenceResidualWarning && energyBalanceError <= thresholds.energyBalanceWarning) return "warning";
  return "fail";
}

function statusForSummary(
  referenceResidual: number,
  energyBalanceError: number,
  trend: FdtdConvergenceTrendStatus,
  pmlStatus: SimulationBuilderValidationStatus,
  thresholds: FdtdBenchmarkThresholds,
  warnings: SolverWarning[]
): SimulationBuilderValidationStatus {
  if (warnings.some((warning) => warning.code.includes("HashMismatch"))) return "fail";
  if (referenceResidual > thresholds.referenceResidualWarning || energyBalanceError > thresholds.energyBalanceWarning || trend === "unstable" || pmlStatus === "fail") return "fail";
  if (referenceResidual > thresholds.referenceResidualPass || energyBalanceError > thresholds.energyBalancePass || trend === "non-monotonic" || pmlStatus === "warning") return "warning";
  return "pass";
}

function trendWarnings(status: FdtdConvergenceTrendStatus): SolverWarning[] {
  if (status === "unstable") return [{ code: "fdtd.convergence.unstableTrend", message: "Reference residual increases at the highest resolution; imported evidence is unstable." }];
  if (status === "non-monotonic") return [{ code: "fdtd.convergence.nonMonotonicTrend", message: "Reference residual is non-monotonic across resolution; inspect mesh, monitor, and stopping settings." }];
  return [];
}

function pmlWarnings(pml: FdtdConvergenceSummary["pmlSensitivity"]): SolverWarning[] {
  if (pml.status === "fail") return [{ code: "fdtd.convergence.highPmlSensitivity", message: "PML sensitivity exceeds the fail threshold; move boundaries farther away or adjust PML settings." }];
  if (pml.status === "warning") return [{ code: "fdtd.convergence.highPmlSensitivity", message: "PML sensitivity exceeds the warning threshold; treat this benchmark as configuration-sensitive." }];
  return [];
}

function parseFluxSummaryArray(value: string | FdtdFluxSummary[] | undefined): FdtdFluxSummary[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => parseFdtdFluxSummaryJson(item));
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) throw new Error("FDTD flux summaries import must be a JSON array");
  return parsed.map((item) => parseFdtdFluxSummaryJson(item as FdtdFluxSummary));
}

function parseConvergenceRun(record: Record<string, unknown>, reference: FdtdBenchmarkReference): FdtdConvergenceRun {
  return analyzeRun(reference, {
    runId: requiredString(record, "runId"),
    resolutionPointsPerWavelength: requiredNumber(record, "resolutionPointsPerWavelength"),
    pmlThicknessUm: requiredNumber(record, "pmlThicknessUm"),
    paddingWavelengths: requiredNumber(record, "paddingWavelengths"),
    monitorOffsetWavelengths: requiredNumber(record, "monitorOffsetWavelengths"),
    imported: parseRta(parseObject(record.imported, "run.imported")),
    fieldSliceDelta: requiredNumber(record, "fieldSliceDelta"),
    warnings: parseWarnings(record.warnings)
  });
}

function parseReference(record: Record<string, unknown>): FdtdBenchmarkReference {
  const benchmarkKind = parseBenchmarkKind(requiredString(record, "benchmarkKind"));
  const referenceModel = requiredString(record, "referenceModel") as FdtdBenchmarkReference["referenceModel"];
  const validModels: FdtdBenchmarkReference["referenceModel"][] = ["flux-conservation", "fresnel-normal-incidence", "planar-tmm-stack", "beer-lambert", "ideal-mirror"];
  if (!validModels.includes(referenceModel)) throw new Error("referenceModel is not a supported FDTD benchmark reference model");
  const draft = {
    benchmarkKind,
    referenceModel,
    expected: parseRta(parseObject(record.expected, "reference.expected")),
    invariant: requiredString(record, "invariant"),
    thresholds: parseThresholds(parseObject(record.thresholds, "reference.thresholds"))
  };
  return {
    ...draft,
    referenceHash: typeof record.referenceHash === "string" ? record.referenceHash : fnv1a64(stableStringify(draft))
  };
}

function parseThresholds(record: Record<string, unknown>): FdtdBenchmarkThresholds {
  return {
    referenceResidualPass: requiredNumber(record, "referenceResidualPass"),
    referenceResidualWarning: requiredNumber(record, "referenceResidualWarning"),
    energyBalancePass: requiredNumber(record, "energyBalancePass"),
    energyBalanceWarning: requiredNumber(record, "energyBalanceWarning"),
    pmlSensitivityWarning: requiredNumber(record, "pmlSensitivityWarning"),
    pmlSensitivityFail: requiredNumber(record, "pmlSensitivityFail"),
    fieldDeltaWarning: requiredNumber(record, "fieldDeltaWarning")
  };
}

function parseRta(record: Record<string, unknown>): FdtdBenchmarkReference["expected"] {
  return {
    reflectance: requiredNumber(record, "reflectance"),
    transmittance: requiredNumber(record, "transmittance"),
    absorbance: requiredNumber(record, "absorbance")
  };
}

function parseBenchmarkKind(value: string): FdtdBenchmarkKind {
  if (!fdtdBenchmarkKinds.includes(value as FdtdBenchmarkKind)) throw new Error(`Unsupported FDTD benchmark kind: ${value}`);
  return value as FdtdBenchmarkKind;
}

function parseObject(value: unknown, label: string): Record<string, unknown> {
  if (typeof value === "string") {
    try {
      return parseObject(JSON.parse(value) as unknown, label);
    } catch (error) {
      throw new Error(`${label} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be a JSON object`);
  return value as Record<string, unknown>;
}

function requiredArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function requiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) throw new Error(`${key} must be a non-empty string`);
  return value;
}

function requiredNumber(record: Record<string, unknown>, key: string): number {
  const value = record[key];
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${key} must be a finite number`);
  return value;
}

function parseWarnings(value: unknown): SolverWarning[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const record = parseObject(item, `warning ${index + 1}`);
    return {
      code: requiredString(record, "code"),
      message: requiredString(record, "message"),
      elementId: typeof record.elementId === "string" ? record.elementId : undefined
    };
  });
}

function material(id: string, label: string, n: number, k: number): MaxwellMaterialSample {
  return {
    id,
    label,
    refractiveIndex: { n, k },
    source: "L8.2 benchmark diagnostic material sample"
  };
}

function baseResidualFor(kind: FdtdBenchmarkKind): number {
  if (kind === "empty-space") return 0.018;
  if (kind === "absorbing-slab") return 0.024;
  if (kind === "mirror") return 0.02;
  return 0.016;
}

function clampRta(input: FdtdBenchmarkReference["expected"]): FdtdBenchmarkReference["expected"] {
  return {
    reflectance: Math.max(0, Math.min(1, input.reflectance)),
    transmittance: Math.max(0, Math.min(1, input.transmittance)),
    absorbance: Math.max(0, Math.min(1, input.absorbance))
  };
}

function positiveUnique(values: number[]): number[] {
  return [...new Set(values.map((value) => positive(value, "sweep value")))].sort((a, b) => a - b);
}

function positive(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} must be positive`);
  return value;
}

function formatIdNumber(value: number): string {
  return String(value).replace(/[^0-9a-z]+/gi, "p");
}

function formatNumber(value: number): string {
  if (value === 0) return "0";
  if (!Number.isFinite(value)) return "n/a";
  if (Math.abs(value) >= 1000 || Math.abs(value) < 0.001) return value.toExponential(4);
  return value.toPrecision(6);
}

function packForHash(pack: Omit<FdtdBenchmarkPack, "packHash">): unknown {
  return {
    schema: pack.schema,
    benchmarkHash: pack.benchmarkManifest.benchmarkHash,
    sweepHash: pack.sweepPlan.sweepHash,
    scriptHashes: pack.scripts.map((script) => script.export.scriptHash),
    expectedReferenceJson: pack.expectedReferenceJson,
    readme: pack.readme
  };
}

function summaryForHash(summary: Omit<FdtdConvergenceSummary, "summaryHash">): unknown {
  return {
    schema: summary.schema,
    benchmarkKind: summary.benchmarkKind,
    sourceScenarioHash: summary.sourceScenarioHash,
    benchmarkHash: summary.benchmarkHash,
    sweepHash: summary.sweepHash,
    referenceHash: summary.reference.referenceHash,
    runs: summary.runs.map((run) => ({
      runId: run.runId,
      imported: run.imported,
      residuals: run.residuals,
      energyBalance: run.energyBalance,
      fieldSliceDelta: run.fieldSliceDelta,
      status: run.status
    })),
    trend: summary.trend,
    pmlSensitivity: summary.pmlSensitivity,
    status: summary.status,
    warnings: summary.warnings
  };
}

function uniqueWarnings(warnings: SolverWarning[]): SolverWarning[] {
  const seen = new Set<string>();
  const output: SolverWarning[] = [];
  for (const warning of warnings) {
    const key = `${warning.code}:${warning.elementId ?? ""}:${warning.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(warning);
  }
  return output;
}
