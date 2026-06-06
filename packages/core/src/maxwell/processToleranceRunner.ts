import { createOpticalBenchBundle, type OpticalBenchBundle } from "../fdtd/fdtdMultiElementBench";
import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import { mulberry32 } from "../math/rng";
import { defaultOpticalBenchScenario } from "./multiElementBench";
import { orderedSimulationBuilderElements, type SimulationBuilderElement, type SimulationBuilderScenario } from "./simulationBuilder";

export type ToleranceVariationTargetKind = "source" | "element" | "target" | "monitor";
export type ToleranceVariationApplication = "absolute" | "relative";
export type ToleranceVariationUnit = "nm" | "um" | "mm" | "deg" | "relative" | "1/m" | "unitless";
export type ToleranceVariationProperty =
  | "wavelengthNm"
  | "sourceXUm"
  | "sourceYUm"
  | "sourceZMm"
  | "sourceIntensityScale"
  | "xUm"
  | "yUm"
  | "zMm"
  | "widthUm"
  | "heightUm"
  | "thicknessUm"
  | "apertureDiameterUm"
  | "apertureWidthUm"
  | "apertureHeightUm"
  | "focalLengthMm"
  | "orientationDeg"
  | "materialIndex"
  | "extinctionCoefficient"
  | "absorptionCoefficientPerM"
  | "targetZMm"
  | "targetThicknessUm"
  | "targetSubstrateIndex"
  | "observationZMm"
  | "monitorXUm"
  | "monitorWidthUm"
  | "monitorHeightUm";

export type ToleranceVariationModel =
  | { kind: "plus-minus"; delta: number; includeNominal?: boolean }
  | { kind: "discrete"; values: number[] }
  | { kind: "sigma-levels"; sigma: number; levels: number[] }
  | { kind: "uniform"; min: number; max: number; steps: number }
  | { kind: "seeded-normal"; mean?: number; sigma: number; samples: number; seed: number };

export type ToleranceVariationSpec = {
  id: string;
  label: string;
  targetKind: ToleranceVariationTargetKind;
  targetId: string;
  property: ToleranceVariationProperty;
  unit: ToleranceVariationUnit;
  application: ToleranceVariationApplication;
  model: ToleranceVariationModel;
  enabled: boolean;
  groupId?: string;
  boundary?: string;
};

export type ToleranceRunMode = "one-at-a-time" | "deterministic-grid" | "seeded-samples";
export type ToleranceRunStatus = "pass" | "warning" | "fail";
export type ToleranceMetricKey =
  | "peakIntensity"
  | "meanIntensity"
  | "relativePower"
  | "totalPower"
  | "centroidXUm"
  | "centroidShiftAbsUm"
  | "transmittedFlux"
  | "reflectedFlux"
  | "absorbedFlux"
  | "energyBalanceError"
  | "validationResidual"
  | "warningCount";

export type ToleranceThreshold = {
  id: string;
  metric: ToleranceMetricKey;
  label: string;
  direction: "min" | "max";
  pass: number;
  warn?: number;
  enabled: boolean;
};

export type TolerancePerturbation = {
  specId: string;
  label: string;
  targetKind: ToleranceVariationTargetKind;
  targetId: string;
  property: ToleranceVariationProperty;
  unit: ToleranceVariationUnit;
  application: ToleranceVariationApplication;
  level: number;
  nominal: number;
  appliedValue: number;
};

export type ToleranceRunCase = {
  id: string;
  label: string;
  mode: ToleranceRunMode;
  perturbations: TolerancePerturbation[];
  scenario: SimulationBuilderScenario;
  scenarioHash: string;
};

export type ToleranceRunResult = {
  id: string;
  label: string;
  mode: ToleranceRunMode;
  perturbations: TolerancePerturbation[];
  sceneHash: string;
  sourceScenarioHash: string;
  solverRoutes: Array<{ id: string; label: string; solverRoute: string; status: string }>;
  metrics: Record<ToleranceMetricKey, number>;
  thresholdResults: Array<{ thresholdId: string; metric: ToleranceMetricKey; value: number; status: ToleranceRunStatus; limit: number }>;
  status: ToleranceRunStatus;
  warnings: SolverWarning[];
  runHash: string;
};

export type ToleranceSensitivityRow = {
  specId: string;
  label: string;
  metric: ToleranceMetricKey;
  nominalValue: number;
  minValue: number;
  maxValue: number;
  delta: number;
  maxAbsLevel: number;
  slopePerUnit: number;
  worstRunId: string;
  rankScore: number;
};

export type ToleranceAnalysisReport = {
  schema: "emmicro.l86.toleranceReport.v1";
  label: string;
  mode: ToleranceRunMode;
  sceneHash: string;
  variationHash: string;
  selectedMetrics: ToleranceMetricKey[];
  variations: ToleranceVariationSpec[];
  thresholds: ToleranceThreshold[];
  nominalRun: ToleranceRunResult;
  runs: ToleranceRunResult[];
  sensitivity: ToleranceSensitivityRow[];
  worstCase: ToleranceRunResult;
  failingCases: ToleranceRunResult[];
  passRate: number;
  warnings: SolverWarning[];
  boundary: string[];
  exports: string[];
  reportHash: string;
};

export type ToleranceFdtdSweepCase = {
  runId: string;
  label: string;
  sceneHash: string;
  sourceScenarioHash: string;
  fdtdManifestHash: string;
  meepScriptHash: string;
  perturbations: TolerancePerturbation[];
  manifestFilename: string;
  scriptFilename: string;
};

export type ToleranceFdtdSweepManifest = {
  schema: "emmicro.l86.fdtdVariationSweepManifest.v1";
  label: string;
  sceneHash: string;
  variationHash: string;
  caseCount: number;
  cases: ToleranceFdtdSweepCase[];
  boundary: string[];
  manifestHash: string;
};

export type ToleranceFdtdSweepSummary = {
  schema: "emmicro.l86.fdtdVariationSweepSummary.v1";
  sceneHash: string;
  variationHash: string;
  sweepManifestHash: string;
  results: Array<{
    runId: string;
    sourceScenarioHash: string;
    fdtdManifestHash: string;
    reflectance: number;
    transmittance: number;
    absorbance: number;
    energyBalance: number;
    residual: number;
    status: ToleranceRunStatus;
  }>;
  summaryHash: string;
};

export type ToleranceAnalysisInput = {
  variations: ToleranceVariationSpec[];
  thresholds?: ToleranceThreshold[];
  selectedMetrics?: ToleranceMetricKey[];
  mode?: ToleranceRunMode;
  gridMaxRuns?: number;
  seededSamples?: number;
  seed?: number;
  label?: string;
};

export const l86ToleranceBoundary = [
  "L8.6 is deterministic diagnostic process/tolerance variation analysis over the editable L8.5.1 optical bench.",
  "One-at-a-time, grid, and seeded sample runs perturb existing source, placement, dimension, material metadata, and monitor variables only.",
  "Sensitivity, pass/fail, worst-case, and pass-rate outputs are diagnostic engineering aids, not certified optical tolerancing.",
  "External FDTD variation sweeps are exported/imported as manifests and receipts only; the browser does not execute FDTD.",
  "No automatic redesign, inverse optimization, certified Monte Carlo tolerance analysis, in-browser FDTD, arbitrary 3D Maxwell/CAD solve, FEM/BEM/RCWA execution, production EM solver, digital twin, or manufacturing certification is implemented."
] as const;

export const defaultToleranceMetrics: ToleranceMetricKey[] = ["peakIntensity", "centroidShiftAbsUm", "transmittedFlux", "energyBalanceError"];

export function defaultToleranceVariationSpecs(scenario: SimulationBuilderScenario = defaultOpticalBenchScenario()): ToleranceVariationSpec[] {
  const aperture = scenario.elements.find((element) => element.kind === "circular-aperture") ?? orderedSimulationBuilderElements(scenario.elements)[0];
  const lens = scenario.elements.find((element) => element.kind === "ideal-lens") ?? orderedSimulationBuilderElements(scenario.elements)[1];
  const transparent = scenario.elements.find((element) => element.kind === "finite-transparent-block") ?? orderedSimulationBuilderElements(scenario.elements)[2];
  const specs: Array<ToleranceVariationSpec | null> = [
    {
      id: "l86-source-wavelength-pm5nm",
      label: "Source wavelength +/-5 nm",
      targetKind: "source",
      targetId: "source",
      property: "wavelengthNm",
      unit: "nm",
      application: "absolute",
      model: { kind: "plus-minus", delta: 5, includeNominal: true },
      enabled: true
    },
    aperture
      ? {
          id: "l86-aperture-x-decenter-pm5um",
          label: `${aperture.label} x decenter +/-5 um`,
          targetKind: "element",
          targetId: aperture.id,
          property: "xUm",
          unit: "um",
          application: "absolute",
          model: { kind: "plus-minus", delta: 5, includeNominal: true },
          enabled: true
        }
      : null,
    lens
      ? {
          id: "l86-lens-z-shift-pm005mm",
          label: `${lens.label} z shift +/-0.05 mm`,
          targetKind: "element",
          targetId: lens.id,
          property: "zMm",
          unit: "mm",
          application: "absolute",
          model: { kind: "plus-minus", delta: 0.05, includeNominal: true },
          enabled: true
        }
      : null,
    transparent
      ? {
          id: "l86-block-thickness-pm2pct",
          label: `${transparent.label} thickness +/-2%`,
          targetKind: "element",
          targetId: transparent.id,
          property: "thicknessUm",
          unit: "relative",
          application: "relative",
          model: { kind: "plus-minus", delta: 0.02, includeNominal: true },
          enabled: true
        }
      : null
  ];
  return specs.filter((item): item is ToleranceVariationSpec => Boolean(item));
}

export function defaultToleranceThresholds(): ToleranceThreshold[] {
  return [
    { id: "min-peak-intensity", metric: "peakIntensity", label: "Peak intensity >= 0.25", direction: "min", pass: 0.25, warn: 0.3, enabled: true },
    { id: "max-centroid-shift", metric: "centroidShiftAbsUm", label: "Centroid shift <= 6 um", direction: "max", pass: 6, warn: 4, enabled: true },
    { id: "min-transmitted-flux", metric: "transmittedFlux", label: "Transmitted flux >= 0.60", direction: "min", pass: 0.6, warn: 0.7, enabled: true },
    { id: "max-energy-balance-error", metric: "energyBalanceError", label: "Energy balance error <= 0.05", direction: "max", pass: 0.05, warn: 0.025, enabled: true }
  ];
}

export function toleranceVariationHash(variations: ToleranceVariationSpec[], thresholds: ToleranceThreshold[] = []): string {
  return fnv1a64(stableStringify({ variations: normalizeVariations(variations), thresholds: thresholds.filter((threshold) => threshold.enabled) }));
}

export function validateToleranceVariationSpecs(scenario: SimulationBuilderScenario, variations: ToleranceVariationSpec[]): { valid: boolean; errors: string[]; warnings: SolverWarning[] } {
  const errors: string[] = [];
  const warnings: SolverWarning[] = [];
  const ids = new Set<string>();
  for (const variation of variations) {
    if (ids.has(variation.id)) errors.push(`Duplicate variation id: ${variation.id}`);
    ids.add(variation.id);
    if (!variation.enabled) continue;
    const nominal = nominalValueForVariation(scenario, variation);
    if (nominal === null) {
      errors.push(`${variation.label} target/property is not supported in the current scene.`);
      continue;
    }
    if (!Number.isFinite(nominal)) errors.push(`${variation.label} nominal value is not finite.`);
    const levels = variationLevels(variation, "grid");
    if (levels.length === 0) errors.push(`${variation.label} has no deterministic levels.`);
    if (levels.some((level) => !Number.isFinite(level))) errors.push(`${variation.label} contains a non-finite variation level.`);
    if (variation.property === "sourceIntensityScale") {
      warnings.push({
        code: "tolerance.variation.sourceIntensityScaleMetadataOnly",
        message: `${variation.label} is accepted as process metadata, but the current L8.6 scalar bench does not model source power scaling as new optical physics.`
      });
    }
    if (variation.groupId) {
      warnings.push({
        code: "tolerance.variation.linkedDriftMetadataOnly",
        message: `${variation.label} belongs to linked drift group ${variation.groupId}; L8.6 records the group but does not perform optimizer-style coupled redesign.`
      });
    }
  }
  return { valid: errors.length === 0, errors, warnings: uniqueWarnings(warnings) };
}

export function createToleranceRunCases(scenario: SimulationBuilderScenario, input: ToleranceAnalysisInput): ToleranceRunCase[] {
  const mode = input.mode ?? "one-at-a-time";
  const variations = normalizeVariations(input.variations).filter((variation) => variation.enabled);
  if (mode === "deterministic-grid") return createGridToleranceRunCases(scenario, variations, input.gridMaxRuns ?? 81);
  if (mode === "seeded-samples") return createSeededToleranceRunCases(scenario, variations, input.seededSamples ?? 16, input.seed ?? 860);
  return createOneAtATimeToleranceRunCases(scenario, variations);
}

export function runToleranceAnalysis(scenario: SimulationBuilderScenario = defaultOpticalBenchScenario(), input: ToleranceAnalysisInput): ToleranceAnalysisReport {
  const thresholds = input.thresholds ?? defaultToleranceThresholds();
  const selectedMetrics = input.selectedMetrics ?? defaultToleranceMetrics;
  const mode = input.mode ?? "one-at-a-time";
  const variationValidation = validateToleranceVariationSpecs(scenario, input.variations);
  const baseCase = makeRunCase("l86-nominal", "Nominal scene", mode, scenario, []);
  const runCases = createToleranceRunCases(scenario, { ...input, mode });
  const nominal = evaluateRunCase(baseCase, thresholds, selectedMetrics, null);
  const runsWithoutShift = runCases.map((runCase) => evaluateRunCase(runCase, thresholds, selectedMetrics, nominal));
  const runs = runsWithoutShift.map((run) => finalizeThresholds(run, thresholds));
  const allRuns = [nominal, ...runs];
  const sensitivity = createSensitivityRows(nominal, runs, selectedMetrics);
  const worstCase = worstRun(allRuns, selectedMetrics);
  const failingCases = allRuns.filter((run) => run.status === "fail");
  const passRate = allRuns.length > 0 ? allRuns.filter((run) => run.status === "pass").length / allRuns.length : 0;
  const variationHash = toleranceVariationHash(input.variations, thresholds);
  const sceneHash = createOpticalBenchBundle(scenario).scene.sceneHash;
  const warnings = uniqueWarnings([
    ...variationValidation.warnings,
    ...variationValidation.errors.map((message) => ({ code: "tolerance.variation.invalid", message })),
    ...allRuns.flatMap((run) => run.warnings)
  ]);
  const draft = {
    schema: "emmicro.l86.toleranceReport.v1" as const,
    label: input.label ?? "L8.6 Process / Tolerance Variation Runner",
    mode,
    sceneHash,
    variationHash,
    selectedMetrics,
    variations: normalizeVariations(input.variations),
    thresholds,
    nominalRun: nominal,
    runs,
    sensitivity,
    worstCase,
    failingCases,
    passRate,
    warnings,
    boundary: [...l86ToleranceBoundary],
    exports: [
      "tolerance_report.md",
      "tolerance_report.json",
      "tolerance_run_table.csv",
      "tolerance_sensitivity.csv",
      "failing_cases.csv",
      "fdtd_variation_sweep_manifest.json"
    ]
  };
  return { ...draft, reportHash: fnv1a64(stableStringify(reportForHash(draft))) };
}

export function createToleranceFdtdSweepManifest(scenario: SimulationBuilderScenario, input: ToleranceAnalysisInput): ToleranceFdtdSweepManifest {
  const cases = createToleranceRunCases(scenario, { ...input, mode: input.mode ?? "deterministic-grid" }).filter((runCase) => {
    const bundle = createOpticalBenchBundle(runCase.scenario);
    return bundle.scene.elements.some((element) => element.solverRoute === "external-fdtd");
  });
  const sweepCases: ToleranceFdtdSweepCase[] = cases.map((runCase, index) => {
    const bundle = createOpticalBenchBundle(runCase.scenario);
    return {
      runId: `l86-fdtd-${String(index + 1).padStart(3, "0")}-${bundle.fdtdBundle.manifest.manifestHash.slice(0, 8)}`,
      label: runCase.label,
      sceneHash: bundle.scene.sceneHash,
      sourceScenarioHash: bundle.fdtdBundle.manifest.sourceScenarioHash,
      fdtdManifestHash: bundle.fdtdBundle.manifest.manifestHash,
      meepScriptHash: bundle.fdtdBundle.script.scriptHash,
      perturbations: runCase.perturbations,
      manifestFilename: `l86_case_${String(index + 1).padStart(3, "0")}_fdtd_scene_manifest.json`,
      scriptFilename: `l86_case_${String(index + 1).padStart(3, "0")}_meep.py`
    };
  });
  const draft = {
    schema: "emmicro.l86.fdtdVariationSweepManifest.v1" as const,
    label: "L8.6 external FDTD variation sweep manifest",
    sceneHash: createOpticalBenchBundle(scenario).scene.sceneHash,
    variationHash: toleranceVariationHash(input.variations, input.thresholds ?? defaultToleranceThresholds()),
    caseCount: sweepCases.length,
    cases: sweepCases,
    boundary: [
      "External FDTD sweep export/import only; the browser app does not execute FDTD.",
      "Each run case preserves scene, variation, manifest, and script hashes for receipt comparison.",
      "Imported summaries are diagnostic evidence, not certified tolerance or production solver validation."
    ]
  };
  return { ...draft, manifestHash: fnv1a64(stableStringify(draft)) };
}

export function createExampleToleranceFdtdSweepSummary(manifest: ToleranceFdtdSweepManifest): ToleranceFdtdSweepSummary {
  const results = manifest.cases.map((item, index) => {
    const residual = Number((0.01 + index * 0.0025).toPrecision(12));
    const reflectance = Number((0.05 + index * 0.001).toPrecision(12));
    const absorbance = Number((0.11 + index * 0.0015).toPrecision(12));
    const transmittance = Number(Math.max(0, 1 - reflectance - absorbance).toPrecision(12));
    return {
      runId: item.runId,
      sourceScenarioHash: item.sourceScenarioHash,
      fdtdManifestHash: item.fdtdManifestHash,
      reflectance,
      transmittance,
      absorbance,
      energyBalance: Number((reflectance + transmittance + absorbance).toPrecision(12)),
      residual,
      status: residual <= 0.05 ? ("pass" as const) : ("warning" as const)
    };
  });
  const draft = {
    schema: "emmicro.l86.fdtdVariationSweepSummary.v1" as const,
    sceneHash: manifest.sceneHash,
    variationHash: manifest.variationHash,
    sweepManifestHash: manifest.manifestHash,
    results
  };
  return { ...draft, summaryHash: fnv1a64(stableStringify(draft)) };
}

export function parseToleranceFdtdSweepSummary(json: string): ToleranceFdtdSweepSummary {
  const body = JSON.parse(json) as ToleranceFdtdSweepSummary;
  if (body.schema !== "emmicro.l86.fdtdVariationSweepSummary.v1") throw new Error("Expected emmicro.l86.fdtdVariationSweepSummary.v1");
  return body;
}

export function validateToleranceFdtdSweepSummary(manifest: ToleranceFdtdSweepManifest, summary: ToleranceFdtdSweepSummary): SolverWarning[] {
  const warnings: SolverWarning[] = [];
  if (summary.sceneHash !== manifest.sceneHash) {
    warnings.push({ code: "tolerance.fdtd.sceneHashMismatch", message: "Imported FDTD sweep summary scene hash does not match the current L8.6 sweep manifest." });
  }
  if (summary.variationHash !== manifest.variationHash) {
    warnings.push({ code: "tolerance.fdtd.variationHashMismatch", message: "Imported FDTD sweep summary variation hash does not match the current L8.6 variation spec." });
  }
  if (summary.sweepManifestHash !== manifest.manifestHash) {
    warnings.push({ code: "tolerance.fdtd.manifestHashMismatch", message: "Imported FDTD sweep summary manifest hash does not match the exported sweep manifest." });
  }
  const expectedRuns = new Set(manifest.cases.map((item) => item.runId));
  for (const result of summary.results) {
    if (!expectedRuns.has(result.runId)) {
      warnings.push({ code: "tolerance.fdtd.unknownRun", message: `Imported FDTD sweep result ${result.runId} is not present in the exported sweep manifest.` });
    }
    if (Math.abs(result.energyBalance - 1) > 0.05) {
      warnings.push({ code: "tolerance.fdtd.energyBalanceWarning", message: `Imported FDTD sweep result ${result.runId} has energy balance outside the diagnostic threshold.` });
    }
  }
  return uniqueWarnings(warnings);
}

export function toleranceReportJson(report: ToleranceAnalysisReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function toleranceFdtdSweepManifestJson(manifest: ToleranceFdtdSweepManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export function toleranceFdtdSweepSummaryJson(summary: ToleranceFdtdSweepSummary): string {
  return `${JSON.stringify(summary, null, 2)}\n`;
}

export function toleranceRunTableCsv(report: ToleranceAnalysisReport): string {
  const runs = [report.nominalRun, ...report.runs];
  return [
    "run_id,label,status,mode,perturbations,peak_intensity,centroid_x_um,centroid_shift_abs_um,transmitted_flux,energy_balance_error,warning_count,run_hash",
    ...runs.map((run) => csvRow([
      run.id,
      run.label,
      run.status,
      run.mode,
      perturbationLabel(run.perturbations),
      run.metrics.peakIntensity,
      run.metrics.centroidXUm,
      run.metrics.centroidShiftAbsUm,
      run.metrics.transmittedFlux,
      run.metrics.energyBalanceError,
      run.metrics.warningCount,
      run.runHash
    ]))
  ].join("\n");
}

export function toleranceSensitivityCsv(report: ToleranceAnalysisReport): string {
  return [
    "spec_id,label,metric,nominal,min,max,delta,max_abs_level,slope_per_unit,worst_run_id,rank_score",
    ...report.sensitivity.map((row) => csvRow([row.specId, row.label, row.metric, row.nominalValue, row.minValue, row.maxValue, row.delta, row.maxAbsLevel, row.slopePerUnit, row.worstRunId, row.rankScore]))
  ].join("\n");
}

export function toleranceFailingCasesCsv(report: ToleranceAnalysisReport): string {
  return [
    "run_id,label,status,perturbations,primary_metric,primary_value,run_hash",
    ...report.failingCases.map((run) => {
      const metric = report.selectedMetrics[0] ?? "peakIntensity";
      return csvRow([run.id, run.label, run.status, perturbationLabel(run.perturbations), metric, run.metrics[metric], run.runHash]);
    })
  ].join("\n");
}

export function toleranceReportMarkdown(report: ToleranceAnalysisReport, fdtdSummary?: ToleranceFdtdSweepSummary | null): string {
  return [
    `# ${report.label}`,
    "",
    `Mode: ${report.mode}`,
    `Scene hash: ${report.sceneHash}`,
    `Variation hash: ${report.variationHash}`,
    `Report hash: ${report.reportHash}`,
    `Pass rate: ${formatPercent(report.passRate)}`,
    `Worst case: ${report.worstCase.label} (${report.worstCase.status})`,
    "",
    "## Variations",
    "",
    "| Variation | Target | Property | Model | Unit |",
    "| --- | --- | --- | --- | --- |",
    ...report.variations.filter((variation) => variation.enabled).map((variation) => `| ${variation.label} | ${variation.targetKind}:${variation.targetId} | ${variation.property} | ${variationModelLabel(variation)} | ${variation.unit} |`),
    "",
    "## Thresholds",
    "",
    "| Threshold | Metric | Rule | Status |",
    "| --- | --- | --- | --- |",
    ...report.thresholds.filter((threshold) => threshold.enabled).map((threshold) => `| ${threshold.label} | ${metricLabel(threshold.metric)} | ${threshold.direction} ${formatNumber(threshold.pass)} | enabled |`),
    "",
    "## Sensitivity Ranking",
    "",
    "| Rank | Variation | Metric | Delta | Slope / unit | Worst run |",
    "| ---: | --- | --- | ---: | ---: | --- |",
    ...report.sensitivity.slice(0, 12).map((row, index) => `| ${index + 1} | ${row.label} | ${metricLabel(row.metric)} | ${formatNumber(row.delta)} | ${formatNumber(row.slopePerUnit)} | ${row.worstRunId} |`),
    "",
    "## Run Table",
    "",
    "| Run | Status | Perturbations | Peak | Centroid shift | Transmitted flux | Energy error |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: |",
    ...[report.nominalRun, ...report.runs].slice(0, 24).map((run) => `| ${run.label} | ${run.status} | ${perturbationLabel(run.perturbations)} | ${formatNumber(run.metrics.peakIntensity)} | ${formatNumber(run.metrics.centroidShiftAbsUm)} | ${formatNumber(run.metrics.transmittedFlux)} | ${formatNumber(run.metrics.energyBalanceError)} |`),
    "",
    "## External FDTD Sweep Evidence",
    "",
    fdtdSummary
      ? `Imported sweep summary ${fdtdSummary.summaryHash}; ${fdtdSummary.results.length} result rows; ${fdtdSummary.results.filter((row) => row.status === "pass").length} passing rows.`
      : "No external FDTD sweep summary imported. Browser execution of FDTD is not implemented.",
    "",
    "## Warnings",
    "",
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning.code}: ${warning.message}`) : ["- none"]),
    "",
    "## Boundary",
    "",
    ...report.boundary.map((item) => `- ${item}`)
  ].join("\n");
}

function createOneAtATimeToleranceRunCases(scenario: SimulationBuilderScenario, variations: ToleranceVariationSpec[]): ToleranceRunCase[] {
  const cases: ToleranceRunCase[] = [];
  for (const variation of variations) {
    const nominal = nominalValueForVariation(scenario, variation);
    if (nominal === null) continue;
    const levels = variationLevels(variation, "one-at-a-time").filter((level) => Math.abs(level) > 1e-15);
    for (const level of levels) {
      const perturbation = makePerturbation(variation, nominal, level);
      const next = applyPerturbations(scenario, [perturbation]);
      cases.push(makeRunCase(`l86-oat-${String(cases.length + 1).padStart(3, "0")}`, `${variation.label} ${formatSignedLevel(level, variation)}`, "one-at-a-time", next, [perturbation]));
    }
  }
  return cases;
}

function createGridToleranceRunCases(scenario: SimulationBuilderScenario, variations: ToleranceVariationSpec[], maxRuns: number): ToleranceRunCase[] {
  const levels = variations.map((variation) => {
    const nominal = nominalValueForVariation(scenario, variation);
    if (nominal === null) return [];
    return variationLevels(variation, "grid").map((level) => makePerturbation(variation, nominal, level));
  }).filter((item) => item.length > 0);
  const output: ToleranceRunCase[] = [];
  function visit(index: number, perturbations: TolerancePerturbation[]): void {
    if (output.length >= maxRuns) return;
    if (index >= levels.length) {
      const next = applyPerturbations(scenario, perturbations);
      output.push(makeRunCase(`l86-grid-${String(output.length + 1).padStart(3, "0")}`, `Grid case ${output.length + 1}`, "deterministic-grid", next, perturbations));
      return;
    }
    for (const perturbation of levels[index]!) visit(index + 1, [...perturbations, perturbation]);
  }
  visit(0, []);
  return output;
}

function createSeededToleranceRunCases(scenario: SimulationBuilderScenario, variations: ToleranceVariationSpec[], sampleCount: number, seed: number): ToleranceRunCase[] {
  const random = mulberry32(seed);
  const output: ToleranceRunCase[] = [];
  for (let run = 0; run < sampleCount; run += 1) {
    const perturbations: TolerancePerturbation[] = [];
    for (const variation of variations) {
      const nominal = nominalValueForVariation(scenario, variation);
      if (nominal === null) continue;
      const level = seededLevel(variation, random);
      perturbations.push(makePerturbation(variation, nominal, level));
    }
    const next = applyPerturbations(scenario, perturbations);
    output.push(makeRunCase(`l86-seed-${String(run + 1).padStart(3, "0")}`, `Seeded sample ${run + 1}`, "seeded-samples", next, perturbations));
  }
  return output;
}

function evaluateRunCase(runCase: ToleranceRunCase, thresholds: ToleranceThreshold[], selectedMetrics: ToleranceMetricKey[], nominal: ToleranceRunResult | null): ToleranceRunResult {
  const bundle = createOpticalBenchBundle(runCase.scenario);
  const raw = extractToleranceMetrics(bundle);
  const metrics = {
    ...raw,
    centroidShiftAbsUm: nominal ? Math.abs(raw.centroidXUm - nominal.metrics.centroidXUm) : 0
  };
  const partial = {
    id: runCase.id,
    label: runCase.label,
    mode: runCase.mode,
    perturbations: runCase.perturbations,
    sceneHash: bundle.scene.sceneHash,
    sourceScenarioHash: bundle.scene.sourceScenarioHash,
    solverRoutes: bundle.scene.elements.map((element) => ({ id: element.id, label: element.label, solverRoute: element.solverRoute, status: element.status })),
    metrics,
    thresholdResults: [],
    status: "pass" as ToleranceRunStatus,
    warnings: uniqueWarnings([...bundle.validationReport.warnings]),
    runHash: ""
  };
  return finalizeThresholds(partial, thresholds, selectedMetrics);
}

function finalizeThresholds(run: Omit<ToleranceRunResult, "thresholdResults" | "status" | "runHash"> & Partial<Pick<ToleranceRunResult, "thresholdResults" | "status" | "runHash">>, thresholds: ToleranceThreshold[], selectedMetrics: ToleranceMetricKey[] = defaultToleranceMetrics): ToleranceRunResult {
  const thresholdResults = thresholds.filter((threshold) => threshold.enabled).map((threshold) => {
    const value = run.metrics[threshold.metric];
    return {
      thresholdId: threshold.id,
      metric: threshold.metric,
      value,
      status: thresholdStatus(value, threshold),
      limit: threshold.pass
    };
  });
  const status: ToleranceRunStatus = thresholdResults.some((item) => item.status === "fail") ? "fail" : thresholdResults.some((item) => item.status === "warning") || run.warnings.length > 0 ? "warning" : "pass";
  const draft = {
    id: run.id,
    label: run.label,
    mode: run.mode,
    perturbations: run.perturbations,
    sceneHash: run.sceneHash,
    sourceScenarioHash: run.sourceScenarioHash,
    solverRoutes: run.solverRoutes,
    metrics: ensureMetricKeys(run.metrics, selectedMetrics),
    thresholdResults,
    status,
    warnings: run.warnings
  };
  return { ...draft, runHash: fnv1a64(stableStringify(draft)) };
}

function extractToleranceMetrics(bundle: OpticalBenchBundle): Record<ToleranceMetricKey, number> {
  const snapshot = bundle.scalarPreview.snapshots.find((item) => item.monitorId === "observation-plane") ?? bundle.scalarPreview.snapshots[bundle.scalarPreview.snapshots.length - 1];
  const metrics = snapshot?.metrics ?? { peakIntensity: 0, meanIntensity: 0, totalPower: 0, relativePower: 0, centroidXUm: 0 };
  return {
    peakIntensity: Number(metrics.peakIntensity.toPrecision(12)),
    meanIntensity: Number(metrics.meanIntensity.toPrecision(12)),
    relativePower: Number(metrics.relativePower.toPrecision(12)),
    totalPower: Number(metrics.totalPower.toPrecision(12)),
    centroidXUm: Number(metrics.centroidXUm.toPrecision(12)),
    centroidShiftAbsUm: 0,
    transmittedFlux: Number((bundle.externalEvidence.flux.transmittance ?? 0).toPrecision(12)),
    reflectedFlux: Number((bundle.externalEvidence.flux.reflectance ?? 0).toPrecision(12)),
    absorbedFlux: Number((bundle.externalEvidence.flux.absorbance ?? 0).toPrecision(12)),
    energyBalanceError: Number(Math.abs((bundle.externalEvidence.flux.energyBalance ?? 1) - 1).toPrecision(12)),
    validationResidual: Number(Math.max(Math.abs((bundle.externalEvidence.flux.energyBalance ?? 1) - 1), bundle.validationReport.warnings.length * 0.001).toPrecision(12)),
    warningCount: bundle.validationReport.warnings.length
  };
}

function createSensitivityRows(nominal: ToleranceRunResult, runs: ToleranceRunResult[], selectedMetrics: ToleranceMetricKey[]): ToleranceSensitivityRow[] {
  const rows: ToleranceSensitivityRow[] = [];
  const specIds = Array.from(new Set(runs.flatMap((run) => run.perturbations.map((perturbation) => perturbation.specId))));
  for (const specId of specIds) {
    const specRuns = runs.filter((run) => run.perturbations.length === 1 && run.perturbations[0]?.specId === specId);
    if (specRuns.length === 0) continue;
    const label = specRuns[0]?.perturbations[0]?.label ?? specId;
    const maxAbsLevel = Math.max(1e-12, ...specRuns.map((run) => Math.abs(run.perturbations[0]?.level ?? 0)));
    for (const metric of selectedMetrics) {
      const values = specRuns.map((run) => run.metrics[metric]);
      const minValue = Math.min(...values, nominal.metrics[metric]);
      const maxValue = Math.max(...values, nominal.metrics[metric]);
      const delta = maxValue - minValue;
      const worst = specRuns.reduce((best, run) => (Math.abs(run.metrics[metric] - nominal.metrics[metric]) > Math.abs(best.metrics[metric] - nominal.metrics[metric]) ? run : best), specRuns[0]!);
      rows.push({
        specId,
        label,
        metric,
        nominalValue: nominal.metrics[metric],
        minValue,
        maxValue,
        delta,
        maxAbsLevel,
        slopePerUnit: delta / maxAbsLevel,
        worstRunId: worst.id,
        rankScore: Math.abs(delta)
      });
    }
  }
  return rows.sort((a, b) => b.rankScore - a.rankScore || a.label.localeCompare(b.label));
}

function worstRun(runs: ToleranceRunResult[], selectedMetrics: ToleranceMetricKey[]): ToleranceRunResult {
  const statusWeight = { pass: 0, warning: 1, fail: 2 } satisfies Record<ToleranceRunStatus, number>;
  return runs.reduce((worst, run) => {
    const weighted = statusWeight[run.status] - statusWeight[worst.status];
    if (weighted !== 0) return weighted > 0 ? run : worst;
    const metric = selectedMetrics[0] ?? "peakIntensity";
    return Math.abs(run.metrics[metric]) > Math.abs(worst.metrics[metric]) ? run : worst;
  }, runs[0]!);
}

function makeRunCase(id: string, label: string, mode: ToleranceRunMode, scenario: SimulationBuilderScenario, perturbations: TolerancePerturbation[]): ToleranceRunCase {
  const bundle = createOpticalBenchBundle(scenario);
  return { id, label, mode, perturbations, scenario, scenarioHash: bundle.scene.sourceScenarioHash };
}

function makePerturbation(variation: ToleranceVariationSpec, nominal: number, level: number): TolerancePerturbation {
  const appliedValue = variation.application === "relative" ? nominal * (1 + level) : nominal + level;
  return {
    specId: variation.id,
    label: variation.label,
    targetKind: variation.targetKind,
    targetId: variation.targetId,
    property: variation.property,
    unit: variation.unit,
    application: variation.application,
    level: Number(level.toPrecision(12)),
    nominal: Number(nominal.toPrecision(12)),
    appliedValue: Number(appliedValue.toPrecision(12))
  };
}

function applyPerturbations(scenario: SimulationBuilderScenario, perturbations: TolerancePerturbation[]): SimulationBuilderScenario {
  return perturbations.reduce((current, perturbation) => applyPerturbation(current, perturbation), cloneScenario(scenario));
}

function applyPerturbation(scenario: SimulationBuilderScenario, perturbation: TolerancePerturbation): SimulationBuilderScenario {
  if (perturbation.targetKind === "source") {
    const sourcePatch: Partial<SimulationBuilderScenario["source"]> = {};
    if (perturbation.property === "wavelengthNm") sourcePatch.wavelengthNm = clampPositive(perturbation.appliedValue);
    if (perturbation.property === "sourceXUm") sourcePatch.xUm = perturbation.appliedValue;
    if (perturbation.property === "sourceYUm") sourcePatch.yUm = perturbation.appliedValue;
    if (perturbation.property === "sourceZMm") sourcePatch.zMm = perturbation.appliedValue;
    return { ...scenario, source: { ...scenario.source, ...sourcePatch } };
  }
  if (perturbation.targetKind === "target") {
    const targetPatch: Partial<SimulationBuilderScenario["target"]> = {};
    if (perturbation.property === "targetZMm") targetPatch.zMm = perturbation.appliedValue;
    if (perturbation.property === "targetThicknessUm") targetPatch.thicknessUm = clampPositive(perturbation.appliedValue);
    if (perturbation.property === "targetSubstrateIndex") targetPatch.substrateIndex = clampPositive(perturbation.appliedValue);
    return { ...scenario, target: { ...scenario.target, ...targetPatch } };
  }
  if (perturbation.targetKind === "monitor") {
    if (perturbation.targetId === "observation-plane" && perturbation.property === "observationZMm") {
      return { ...scenario, observationPlaneZMm: perturbation.appliedValue };
    }
    return {
      ...scenario,
      customMonitors: (scenario.customMonitors ?? []).map((monitor) => {
        if (monitor.id !== perturbation.targetId) return monitor;
        if (perturbation.property === "monitorXUm") return { ...monitor, xUm: perturbation.appliedValue };
        if (perturbation.property === "monitorWidthUm") return { ...monitor, widthUm: clampPositive(perturbation.appliedValue) };
        if (perturbation.property === "monitorHeightUm") return { ...monitor, heightUm: clampPositive(perturbation.appliedValue) };
        return monitor;
      })
    };
  }
  return {
    ...scenario,
    elements: orderedSimulationBuilderElements(
      scenario.elements.map((element) => (element.id === perturbation.targetId ? applyElementPerturbation(element, perturbation) : element))
    )
  };
}

function applyElementPerturbation(element: SimulationBuilderElement, perturbation: TolerancePerturbation): SimulationBuilderElement {
  const value = positiveElementProperties.has(perturbation.property) ? clampPositive(perturbation.appliedValue) : perturbation.appliedValue;
  if (perturbation.property === "xUm") return { ...element, xUm: value };
  if (perturbation.property === "yUm") return { ...element, yUm: value };
  if (perturbation.property === "zMm") return { ...element, zMm: value };
  if (perturbation.property === "widthUm") return { ...element, widthUm: value };
  if (perturbation.property === "heightUm") return { ...element, heightUm: value };
  if (perturbation.property === "thicknessUm") return { ...element, thicknessUm: value };
  if (perturbation.property === "apertureDiameterUm") return { ...element, apertureDiameterUm: value };
  if (perturbation.property === "apertureWidthUm") return { ...element, apertureWidthUm: value };
  if (perturbation.property === "apertureHeightUm") return { ...element, apertureHeightUm: value };
  if (perturbation.property === "focalLengthMm") return { ...element, focalLengthMm: value };
  if (perturbation.property === "orientationDeg") return { ...element, orientationDeg: value };
  if (perturbation.property === "materialIndex") return { ...element, materialIndex: value };
  if (perturbation.property === "extinctionCoefficient") return { ...element, extinctionCoefficient: Math.max(0, value) };
  if (perturbation.property === "absorptionCoefficientPerM") return { ...element, absorptionCoefficientPerM: Math.max(0, value) };
  return element;
}

const positiveElementProperties = new Set<ToleranceVariationProperty>(["widthUm", "heightUm", "thicknessUm", "apertureDiameterUm", "apertureWidthUm", "apertureHeightUm", "focalLengthMm", "materialIndex"]);

function nominalValueForVariation(scenario: SimulationBuilderScenario, variation: ToleranceVariationSpec): number | null {
  if (variation.targetKind === "source") {
    if (variation.property === "wavelengthNm") return scenario.source.wavelengthNm;
    if (variation.property === "sourceXUm") return scenario.source.xUm;
    if (variation.property === "sourceYUm") return scenario.source.yUm;
    if (variation.property === "sourceZMm") return scenario.source.zMm;
    if (variation.property === "sourceIntensityScale") return 1;
    return null;
  }
  if (variation.targetKind === "target") {
    if (variation.property === "targetZMm") return scenario.target.zMm;
    if (variation.property === "targetThicknessUm") return scenario.target.thicknessUm;
    if (variation.property === "targetSubstrateIndex") return scenario.target.substrateIndex;
    return null;
  }
  if (variation.targetKind === "monitor") {
    if (variation.targetId === "observation-plane" && variation.property === "observationZMm") return scenario.observationPlaneZMm;
    const monitor = (scenario.customMonitors ?? []).find((item) => item.id === variation.targetId);
    if (!monitor) return null;
    if (variation.property === "monitorXUm") return monitor.xUm;
    if (variation.property === "monitorWidthUm") return monitor.widthUm;
    if (variation.property === "monitorHeightUm") return monitor.heightUm;
    return null;
  }
  const element = scenario.elements.find((item) => item.id === variation.targetId);
  if (!element) return null;
  if (variation.property === "xUm" || variation.property === "yUm" || variation.property === "orientationDeg") return element[variation.property] ?? 0;
  if (variation.property === "widthUm") return element.widthUm ?? element.apertureDiameterUm ?? element.apertureWidthUm ?? null;
  if (variation.property === "heightUm") return element.heightUm ?? element.apertureDiameterUm ?? element.apertureHeightUm ?? null;
  if (variation.property === "thicknessUm") return element.thicknessUm ?? 0;
  const value = element[variation.property as keyof SimulationBuilderElement];
  return typeof value === "number" ? value : null;
}

function variationLevels(variation: ToleranceVariationSpec, mode: "one-at-a-time" | "grid"): number[] {
  const model = variation.model;
  if (model.kind === "plus-minus") return mode === "grid" || model.includeNominal !== false ? [-model.delta, 0, model.delta] : [-model.delta, model.delta];
  if (model.kind === "discrete") return uniqueNumbers(model.values);
  if (model.kind === "sigma-levels") return uniqueNumbers(model.levels.map((level) => level * model.sigma));
  if (model.kind === "uniform") {
    const steps = Math.max(2, Math.floor(model.steps));
    return Array.from({ length: steps }, (_item, index) => Number((model.min + ((model.max - model.min) * index) / (steps - 1)).toPrecision(12)));
  }
  if (model.kind === "seeded-normal") {
    const random = mulberry32(model.seed);
    return Array.from({ length: model.samples }, () => (model.mean ?? 0) + gaussian(random) * model.sigma);
  }
  return [];
}

function seededLevel(variation: ToleranceVariationSpec, random: () => number): number {
  const model = variation.model;
  if (model.kind === "plus-minus") return (random() * 2 - 1) * model.delta;
  if (model.kind === "uniform") return model.min + random() * (model.max - model.min);
  if (model.kind === "sigma-levels") return gaussian(random) * model.sigma;
  if (model.kind === "seeded-normal") return (model.mean ?? 0) + gaussian(random) * model.sigma;
  if (model.kind === "discrete") return model.values[Math.min(model.values.length - 1, Math.floor(random() * model.values.length))] ?? 0;
  return 0;
}

function thresholdStatus(value: number, threshold: ToleranceThreshold): ToleranceRunStatus {
  if (threshold.direction === "min") {
    if (value < threshold.pass) return "fail";
    if (threshold.warn !== undefined && value < threshold.warn) return "warning";
    return "pass";
  }
  if (value > threshold.pass) return "fail";
  if (threshold.warn !== undefined && value > threshold.warn) return "warning";
  return "pass";
}

function ensureMetricKeys(metrics: Record<ToleranceMetricKey, number>, selectedMetrics: ToleranceMetricKey[]): Record<ToleranceMetricKey, number> {
  const output = { ...metrics };
  for (const key of selectedMetrics) output[key] = Number((output[key] ?? 0).toPrecision(12));
  return output;
}

function normalizeVariations(variations: ToleranceVariationSpec[]): ToleranceVariationSpec[] {
  return [...variations].sort((a, b) => a.id.localeCompare(b.id)).map((variation) => ({ ...variation }));
}

function reportForHash(report: Omit<ToleranceAnalysisReport, "reportHash">): unknown {
  return {
    ...report,
    nominalRun: { ...report.nominalRun, runHash: report.nominalRun.runHash },
    runs: report.runs.map((run) => ({ ...run, scenario: undefined }))
  };
}

function perturbationLabel(perturbations: TolerancePerturbation[]): string {
  if (perturbations.length === 0) return "nominal";
  return perturbations.map((item) => `${item.label}: ${formatNumber(item.level)} ${item.unit} -> ${formatNumber(item.appliedValue)}`).join("; ");
}

function variationModelLabel(variation: ToleranceVariationSpec): string {
  const model = variation.model;
  if (model.kind === "plus-minus") return `nominal +/- ${formatNumber(model.delta)}`;
  if (model.kind === "discrete") return `[${model.values.map(formatNumber).join(", ")}]`;
  if (model.kind === "sigma-levels") return `${formatNumber(model.sigma)} sigma x [${model.levels.join(", ")}]`;
  if (model.kind === "uniform") return `uniform ${formatNumber(model.min)}..${formatNumber(model.max)} (${model.steps})`;
  return `seeded normal sigma ${formatNumber(model.sigma)} samples ${model.samples}`;
}

export function metricLabel(metric: ToleranceMetricKey): string {
  const labels: Record<ToleranceMetricKey, string> = {
    peakIntensity: "peak intensity",
    meanIntensity: "mean intensity",
    relativePower: "relative power",
    totalPower: "total power",
    centroidXUm: "centroid x",
    centroidShiftAbsUm: "centroid shift",
    transmittedFlux: "transmitted flux",
    reflectedFlux: "reflected flux",
    absorbedFlux: "absorbed flux",
    energyBalanceError: "energy-balance error",
    validationResidual: "validation residual",
    warningCount: "warning count"
  };
  return labels[metric];
}

function formatSignedLevel(level: number, variation: ToleranceVariationSpec): string {
  const prefix = level >= 0 ? "+" : "";
  return `${prefix}${formatNumber(level)} ${variation.unit}`;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "n/a";
  if (value === 0) return "0";
  if (Math.abs(value) >= 1000 || Math.abs(value) < 0.001) return value.toExponential(4);
  return value.toPrecision(6).replace(/\.?0+$/, "");
}

function formatPercent(value: number): string {
  return `${formatNumber(value * 100)}%`;
}

function csvRow(values: Array<string | number | boolean | null | undefined>): string {
  return values.map((value) => csvEscape(value == null ? "" : String(value))).join(",");
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function uniqueNumbers(values: number[]): number[] {
  return Array.from(new Set(values.map((value) => Number(value.toPrecision(12))))).sort((a, b) => a - b);
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

function gaussian(random: () => number): number {
  const u1 = Math.max(1e-12, random());
  const u2 = Math.max(1e-12, random());
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function cloneScenario(scenario: SimulationBuilderScenario): SimulationBuilderScenario {
  return JSON.parse(JSON.stringify(scenario)) as SimulationBuilderScenario;
}

function clampPositive(value: number): number {
  return Math.max(1e-12, value);
}
