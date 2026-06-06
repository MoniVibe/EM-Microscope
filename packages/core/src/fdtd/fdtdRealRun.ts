import {
  runSimulationBuilderScenario,
  type SimulationBuilderScenario,
  type SimulationBuilderValidationStatus
} from "../maxwell/simulationBuilder";
import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import { createApertureValidationExampleBundle } from "./fdtdApertureValidation";
import { createTransparentFdtdExampleBundle, createTransparentFdtdExampleScenario } from "./fdtdExamples";
import {
  exportFdtdBundleFromSimulationBuilder,
  fdtdManifestJson,
  fdtdMeepScriptText
} from "./fdtdSceneExport";
import {
  fdtdFieldSliceToCsv,
  fdtdImportedRunJson,
  importFdtdRunArtifacts,
  makeFdtdFluxSummary,
  makeFdtdRunReceipt,
  type FdtdRunArtifactImportInput
} from "./fdtdRunImport";
import { validateFdtdImportedRunAgainstScenario } from "./fdtdValidation";
import type {
  FdtdExportBundle,
  FdtdFieldSlice,
  FdtdFluxSummary,
  FdtdImportedRun,
  FdtdRunReceipt,
  FdtdValidationReport
} from "./fdtdTypes";

export type RealExternalRunFileName =
  | "scene_manifest.json"
  | "meep_scene.py"
  | "expected_reference.json"
  | "run_config.json"
  | "material_receipts.json"
  | "monitor_receipts.json"
  | "README.md"
  | "reproduce.sh"
  | "reproduce.ps1"
  | "postprocess.py"
  | "requirements-meep.txt";

export type RealExternalRunPackFile = {
  path: RealExternalRunFileName;
  mime: string;
  text: string;
  hash: string;
};

export type RealExternalRunConfig = {
  schema: "emmicro.fdtd.realRunConfig.v1";
  runId: string;
  sourceScenarioHash: string;
  manifestHash: string;
  scriptHash: string;
  resolution: number;
  until: number;
  pmlThicknessUm: number;
  grid: FdtdExportBundle["manifest"]["grid"];
  requiredMonitorIds: string[];
  fieldSliceId: string;
  outputFiles: string[];
  configHash: string;
};

export type RealExternalRunReference = {
  schema: "emmicro.fdtd.realRunExpectedReference.v1";
  model: string;
  sourceScenarioHash: string;
  manifestHash: string;
  expected: { reflectance: number; transmittance: number; absorbance: number };
  tolerances: {
    rtaResidualPass: number;
    rtaResidualWarning: number;
    energyResidualPass: number;
    energyResidualWarning: number;
    fieldSliceRmsWarning: number;
  };
  referenceHash: string;
};

export type RealExternalRunReceiptSet = {
  schema: "emmicro.fdtd.realRunReceiptSet.v1";
  sourceScenarioHash: string;
  manifestHash: string;
  scriptHash: string;
  materialHash: string;
  monitorHash: string;
  runConfigHash: string;
  requiredMonitorIds: string[];
  receiptSetHash: string;
};

export type RealExternalRunPack = {
  schema: "emmicro.fdtd.realRunPack.v1";
  label: string;
  sourceScenarioId: string;
  sourceScenarioHash: string;
  manifestHash: string;
  scriptHash: string;
  materialHash: string;
  monitorHash: string;
  runConfigHash: string;
  bundle: FdtdExportBundle;
  runConfig: RealExternalRunConfig;
  expectedReference: RealExternalRunReference;
  materialReceipts: RealExternalRunReceiptSet;
  monitorReceipts: RealExternalRunReceiptSet;
  commands: {
    createEnvironment: string[];
    install: string;
    run: string;
    postprocess: string;
    import: string;
  };
  files: RealExternalRunPackFile[];
  boundary: string[];
  packHash: string;
};

export type RealExternalEnergyBalance = {
  schema: "emmicro.fdtd.realRunEnergyBalance.v1";
  runId: string;
  reflectance: number;
  transmittance: number;
  absorbance: number;
  rtaSum: number;
  residual: number;
  status: SimulationBuilderValidationStatus;
  energyHash: string;
};

export type RealExternalPostprocessLog = {
  schema: "emmicro.fdtd.realRunPostprocessLog.v1";
  runId: string;
  sourceScenarioHash: string;
  manifestHash: string;
  scriptHash: string;
  materialHash: string;
  monitorHash: string;
  runConfigHash: string;
  postprocessorVersion: string;
  files: string[];
  warnings: SolverWarning[];
  postprocessHash: string;
};

export type RealExternalFieldPreviewMetadata = {
  schema: "emmicro.fdtd.realRunFieldPreview.v1";
  filename: "field_preview.png";
  mime: "image/png";
  width: number;
  height: number;
  minIntensity: number;
  maxIntensity: number;
  previewHash: string;
};

export type RealExternalRunBundle = {
  schema: "emmicro.fdtd.realRunBundle.v1";
  receipt: FdtdRunReceipt;
  flux: FdtdFluxSummary;
  fieldSlice: FdtdFieldSlice;
  fieldSliceCsv: string;
  imported: FdtdImportedRun;
  energyBalance: RealExternalEnergyBalance;
  postprocessLog: RealExternalPostprocessLog;
  fieldPreview: RealExternalFieldPreviewMetadata;
  bundleHash: string;
};

export type RealExternalRunValidation = {
  schema: "emmicro.fdtd.realRunValidation.v1";
  sourceScenarioHash: string;
  manifestHash: string;
  scriptHash: string;
  materialHashStatus: "match" | "mismatch";
  monitorHashStatus: "match" | "mismatch";
  runConfigHashStatus: "match" | "mismatch";
  requiredFilesStatus: SimulationBuilderValidationStatus;
  requiredMonitorsStatus: SimulationBuilderValidationStatus;
  receiptStatus: SimulationBuilderValidationStatus;
  baseValidation: FdtdValidationReport;
  status: SimulationBuilderValidationStatus;
  warnings: SolverWarning[];
  validationHash: string;
};

export type RealExternalRunComparison = {
  schema: "emmicro.fdtd.realRunComparison.v1";
  sourceScenarioHash: string;
  runId: string;
  referenceModel: string;
  rtaDelta: { reflectance: number; transmittance: number; absorbance: number };
  energyBalanceDelta: number;
  fieldSliceRmsDelta: number;
  referenceResidual: number;
  goldenReference: {
    status: "matched-current-scene" | "no-matching-golden";
    label: string;
    hash: string;
  };
  status: SimulationBuilderValidationStatus;
  warnings: SolverWarning[];
  comparisonHash: string;
};

export type RealExternalRunPromotion = {
  schema: "emmicro.fdtd.realRunEvidencePromotion.v1";
  label: string;
  runId: string;
  accepted: boolean;
  acceptedWithWarnings: boolean;
  campaignTarget: "Engineering Evidence Campaign";
  status: SimulationBuilderValidationStatus;
  receipts: {
    sourceScenarioHash: string;
    manifestHash: string;
    scriptHash: string;
    materialHash: string;
    monitorHash: string;
    runConfigHash: string;
    validationHash: string;
    comparisonHash: string;
  };
  warnings: SolverWarning[];
  promotionHash: string;
};

export type RealExternalRunReproducibilityReport = {
  schema: "emmicro.fdtd.realRunReproducibilityReport.v1";
  label: string;
  sourceScenarioHash: string;
  manifestHash: string;
  scriptHash: string;
  materialHash: string;
  monitorHash: string;
  runConfigHash: string;
  packHash: string;
  runId: string | null;
  validationStatus: SimulationBuilderValidationStatus | "pending";
  comparisonStatus: SimulationBuilderValidationStatus | "pending";
  promotionStatus: "accepted" | "accepted-with-warnings" | "not-promoted";
  expected: RealExternalRunReference["expected"];
  imported: RealExternalRunComparison["rtaDelta"] | null;
  residuals: RealExternalRunComparison["rtaDelta"] | null;
  energyBalanceDelta: number | null;
  fieldSliceRmsDelta: number | null;
  warnings: SolverWarning[];
  boundary: string[];
  reportHash: string;
};

export type RealExternalRunFixtureKind = "transparent-slab" | "aperture-blocker" | "hash-mismatch";

export type RealExternalRunFixture = {
  kind: RealExternalRunFixtureKind;
  scenario: SimulationBuilderScenario;
  pack: RealExternalRunPack;
  bundle: RealExternalRunBundle;
  validation: RealExternalRunValidation;
  comparison: RealExternalRunComparison;
  promotion: RealExternalRunPromotion;
};

export const l89RealExternalRunBoundary = [
  "L8.9 exports a deterministic external-run pack and imports user-produced FDTD artifacts; the browser app does not execute FDTD.",
  "Meep/Python are optional local tools outside the web runtime and outside npm tests.",
  "Run receipts, scene/script/material/monitor/run-config hashes, required monitor ids, flux summaries, field slices, and postprocess logs are checked before promotion.",
  "Comparison is against the current analytic/TMM/scalar reference and matching golden campaign hashes when available.",
  "Promotion to Engineering Evidence Campaign is an evidence handoff, not certified solver validation.",
  "No in-browser FDTD, arbitrary 3D Maxwell/CAD execution, FEM/BEM/RCWA, production solver certification, digital twin, lab accreditation, hardware control, manufacturing certification, or sensor-stack EM is claimed."
] as const;

const requiredBundleFiles = [
  "run_receipt.json",
  "flux_summary.json",
  "field_slice_xz.csv",
  "energy_balance.json",
  "postprocess_log.json"
] as const;

export function createRealExternalRunPack(scenario: SimulationBuilderScenario, label = "L8.9 real external FDTD run pack"): RealExternalRunPack {
  const bundle = exportFdtdBundleFromSimulationBuilder(scenario);
  const materialHash = hashCanonical(bundle.manifest.materials);
  const monitorHash = hashCanonical(bundle.manifest.monitors);
  const result = runSimulationBuilderScenario(scenario);
  const runConfig = makeRunConfig(bundle, materialHash, monitorHash);
  const expectedReference = makeExpectedReference(bundle, result.validation.solverPath, {
    reflectance: result.validation.expected.reflectance,
    transmittance: result.validation.expected.transmittance,
    absorbance: result.validation.expected.absorbance
  });
  const materialReceipts = makeReceiptSet(bundle, materialHash, monitorHash, runConfig.configHash);
  const monitorReceipts = makeReceiptSet(bundle, materialHash, monitorHash, runConfig.configHash);
  const commands = {
    createEnvironment: ["python -m venv .venv", ". .venv/bin/activate"],
    install: "python -m pip install -r requirements-meep.txt",
    run: "python meep_scene.py",
    postprocess: "python postprocess.py --manifest scene_manifest.json --receipt run_receipt.json --flux flux_summary.json --field field_slice_xz.csv --out .",
    import: "Import run_receipt.json, flux_summary.json, field_slice_xz.csv, energy_balance.json, and postprocess_log.json in the L8.9 panel."
  };
  const files = makePackFiles(bundle, runConfig, expectedReference, materialReceipts, monitorReceipts, commands);
  const draft = {
    schema: "emmicro.fdtd.realRunPack.v1" as const,
    label,
    sourceScenarioId: scenario.id,
    sourceScenarioHash: bundle.manifest.sourceScenarioHash,
    manifestHash: bundle.manifest.manifestHash,
    scriptHash: bundle.script.scriptHash,
    materialHash,
    monitorHash,
    runConfigHash: runConfig.configHash,
    bundle,
    runConfig,
    expectedReference,
    materialReceipts,
    monitorReceipts,
    commands,
    files,
    boundary: [...l89RealExternalRunBoundary]
  };
  return {
    ...draft,
    packHash: hashCanonical(realRunPackForHash(draft))
  };
}

export function realExternalRunPackManifestJson(pack: RealExternalRunPack): string {
  return json({
    schema: pack.schema,
    label: pack.label,
    sourceScenarioId: pack.sourceScenarioId,
    sourceScenarioHash: pack.sourceScenarioHash,
    manifestHash: pack.manifestHash,
    scriptHash: pack.scriptHash,
    materialHash: pack.materialHash,
    monitorHash: pack.monitorHash,
    runConfigHash: pack.runConfigHash,
    packHash: pack.packHash,
    files: pack.files.map((file) => ({ path: file.path, hash: file.hash })),
    boundary: pack.boundary
  });
}

export function createRealExternalRunFixture(kind: RealExternalRunFixtureKind): RealExternalRunFixture {
  const example = kind === "aperture-blocker"
    ? (() => {
      const aperture = createApertureValidationExampleBundle("long-slit");
      return {
        scenario: aperture.scene.scenario,
        receipt: aperture.receipt,
        flux: aperture.flux,
        fieldSlice: aperture.fieldSlice,
        fieldSliceCsv: aperture.fieldSliceCsv,
        imported: aperture.imported
      };
    })()
    : (() => {
      const transparent = createTransparentFdtdExampleBundle();
      return {
        scenario: createTransparentFdtdExampleScenario(),
        receipt: transparent.receipt,
        flux: transparent.flux,
        fieldSlice: transparent.fieldSlice,
        fieldSliceCsv: transparent.fieldSliceCsv,
        imported: transparent.imported
      };
    })();
  const pack = createRealExternalRunPack(example.scenario, `L8.9 ${kind} real external run pack`);
  const bundle = kind === "hash-mismatch"
    ? createHashMismatchBundle(pack, example.receipt, example.flux, example.fieldSlice, example.fieldSliceCsv)
    : createRealExternalRunBundle(pack, example.receipt, example.flux, example.fieldSlice, example.fieldSliceCsv, []);
  const validation = validateRealExternalRunBundle(example.scenario, pack, bundle);
  const comparison = compareRealExternalRunToReferences(pack, bundle, validation);
  const promotion = promoteRealExternalRunToEvidenceCampaign(pack, comparison, validation, kind === "aperture-blocker");
  return { kind, scenario: example.scenario, pack, bundle, validation, comparison, promotion };
}

export function createRealExternalRunBundle(
  pack: RealExternalRunPack,
  receipt: FdtdRunReceipt,
  flux: FdtdFluxSummary,
  fieldSlice: FdtdFieldSlice,
  fieldSliceCsv: string,
  warnings: SolverWarning[] = []
): RealExternalRunBundle {
  const imported: FdtdImportedRun = {
    receipt,
    flux,
    fieldSlice,
    warnings: uniqueWarnings([...receipt.warnings, ...flux.warnings, ...warnings])
  };
  const energyBalance = makeEnergyBalance(flux);
  const postprocessLog = makePostprocessLog(pack, receipt, uniqueWarnings([...warnings, ...imported.warnings]));
  const fieldPreview = makeFieldPreview(fieldSlice);
  const draft = {
    schema: "emmicro.fdtd.realRunBundle.v1" as const,
    receipt,
    flux,
    fieldSlice,
    fieldSliceCsv,
    imported,
    energyBalance,
    postprocessLog,
    fieldPreview
  };
  return {
    ...draft,
    bundleHash: hashCanonical(realRunBundleForHash(draft))
  };
}

export function importRealExternalRunBundle(
  pack: RealExternalRunPack,
  input: FdtdRunArtifactImportInput & { energyBalanceJson?: string; postprocessLogJson?: string }
): RealExternalRunBundle {
  const imported = importFdtdRunArtifacts(input);
  const energy = input.energyBalanceJson ? parseEnergyBalance(input.energyBalanceJson) : makeEnergyBalance(imported.flux);
  const log = input.postprocessLogJson ? parsePostprocessLog(input.postprocessLogJson) : makePostprocessLog(pack, imported.receipt, imported.warnings);
  const bundle = createRealExternalRunBundle(pack, imported.receipt, imported.flux, imported.fieldSlice, input.fieldSliceCsv, imported.warnings);
  return {
    ...bundle,
    energyBalance: energy,
    postprocessLog: log,
    bundleHash: hashCanonical(realRunBundleForHash({ ...bundle, energyBalance: energy, postprocessLog: log }))
  };
}

export function parseRealExternalRunBundleJson(value: string | RealExternalRunBundle): RealExternalRunBundle {
  const record = typeof value === "string" ? JSON.parse(value) as RealExternalRunBundle : value;
  if (record.schema !== "emmicro.fdtd.realRunBundle.v1") throw new Error("Real external run bundle schema must be emmicro.fdtd.realRunBundle.v1");
  return record;
}

export function validateRealExternalRunBundle(
  scenario: SimulationBuilderScenario,
  pack: RealExternalRunPack,
  bundle: RealExternalRunBundle
): RealExternalRunValidation {
  const baseValidation = validateFdtdImportedRunAgainstScenario(scenario, pack.bundle, bundle.imported);
  const warnings: SolverWarning[] = [...baseValidation.warnings, ...bundle.postprocessLog.warnings];
  const materialHashStatus: RealExternalRunValidation["materialHashStatus"] = bundle.postprocessLog.materialHash === pack.materialHash ? "match" : "mismatch";
  const monitorHashStatus: RealExternalRunValidation["monitorHashStatus"] = bundle.postprocessLog.monitorHash === pack.monitorHash ? "match" : "mismatch";
  const runConfigHashStatus: RealExternalRunValidation["runConfigHashStatus"] = bundle.postprocessLog.runConfigHash === pack.runConfigHash ? "match" : "mismatch";
  if (materialHashStatus === "mismatch") warnings.push({ code: "fdtd.realRun.materialHashMismatch", message: "Imported run material receipt hash does not match the exported L8.9 pack." });
  if (monitorHashStatus === "mismatch") warnings.push({ code: "fdtd.realRun.monitorHashMismatch", message: "Imported run monitor receipt hash does not match the exported L8.9 pack." });
  if (runConfigHashStatus === "mismatch") warnings.push({ code: "fdtd.realRun.runConfigHashMismatch", message: "Imported run configuration hash does not match the exported L8.9 pack." });

  const missingFiles = requiredBundleFiles.filter((filename) => !bundle.postprocessLog.files.includes(filename));
  if (missingFiles.length > 0) {
    warnings.push({ code: "fdtd.realRun.missingRequiredFiles", message: `Imported run bundle is missing required files: ${missingFiles.join(", ")}.` });
  }
  const monitorIds = new Set(bundle.flux.monitors.map((monitor) => monitor.id));
  const missingMonitors = pack.runConfig.requiredMonitorIds.filter((id) => id !== pack.runConfig.fieldSliceId && !monitorIds.has(id));
  if (missingMonitors.length > 0) {
    warnings.push({ code: "fdtd.realRun.missingRequiredMonitors", message: `Flux summary is missing required monitor ids: ${missingMonitors.join(", ")}.` });
  }
  const receiptStatus: SimulationBuilderValidationStatus = bundle.receipt.receiptHash === makeFdtdRunReceipt(stripReceiptHash(bundle.receipt)).receiptHash && bundle.flux.fluxHash === makeFdtdFluxSummary(stripFluxHash(bundle.flux)).fluxHash ? "pass" : "fail";
  if (receiptStatus === "fail") {
    warnings.push({ code: "fdtd.realRun.receiptHashMismatch", message: "Receipt or flux summary canonical hash does not match its payload." });
  }
  const hashStatus: SimulationBuilderValidationStatus = materialHashStatus === "match" && monitorHashStatus === "match" && runConfigHashStatus === "match" ? "pass" : "fail";
  const requiredFilesStatus: SimulationBuilderValidationStatus = missingFiles.length === 0 ? "pass" : "fail";
  const requiredMonitorsStatus: SimulationBuilderValidationStatus = missingMonitors.length === 0 ? "pass" : "fail";
  const status = worstStatus([baseValidation.status, hashStatus, requiredFilesStatus, requiredMonitorsStatus, receiptStatus]);
  const draft = {
    schema: "emmicro.fdtd.realRunValidation.v1" as const,
    sourceScenarioHash: pack.sourceScenarioHash,
    manifestHash: pack.manifestHash,
    scriptHash: pack.scriptHash,
    materialHashStatus,
    monitorHashStatus,
    runConfigHashStatus,
    requiredFilesStatus,
    requiredMonitorsStatus,
    receiptStatus,
    baseValidation,
    status,
    warnings: uniqueWarnings(warnings)
  };
  return {
    ...draft,
    validationHash: hashCanonical(realRunValidationForHash(draft))
  };
}

export function compareRealExternalRunToReferences(
  pack: RealExternalRunPack,
  bundle: RealExternalRunBundle,
  validation: RealExternalRunValidation
): RealExternalRunComparison {
  const expected = pack.expectedReference.expected;
  const imported = bundle.flux;
  const rtaDelta = {
    reflectance: Math.abs(imported.reflectance - expected.reflectance),
    transmittance: Math.abs(imported.transmittance - expected.transmittance),
    absorbance: Math.abs(imported.absorbance - expected.absorbance)
  };
  const energyBalanceDelta = Math.abs(bundle.energyBalance.rtaSum - 1);
  const fieldSliceRmsDelta = fieldSliceRmsDeltaToReference(bundle.fieldSlice, expected.transmittance);
  const referenceResidual = Math.max(rtaDelta.reflectance, rtaDelta.transmittance, rtaDelta.absorbance, energyBalanceDelta);
  const fieldStatus: SimulationBuilderValidationStatus = fieldSliceRmsDelta <= pack.expectedReference.tolerances.fieldSliceRmsWarning ? "pass" : "warning";
  const status = worstStatus([validation.status, residualStatus(referenceResidual, pack), fieldStatus]);
  const warnings: SolverWarning[] = [...validation.warnings];
  if (fieldStatus === "warning") {
    warnings.push({ code: "fdtd.realRun.fieldSliceRmsWarning", message: "Imported field-slice RMS differs from the expected downstream intensity envelope; inspect the preview and convergence evidence." });
  }
  const draft = {
    schema: "emmicro.fdtd.realRunComparison.v1" as const,
    sourceScenarioHash: pack.sourceScenarioHash,
    runId: bundle.receipt.runId,
    referenceModel: pack.expectedReference.model,
    rtaDelta,
    energyBalanceDelta,
    fieldSliceRmsDelta,
    referenceResidual,
    goldenReference: {
      status: validation.baseValidation.sourceScenarioHash === pack.sourceScenarioHash ? "matched-current-scene" as const : "no-matching-golden" as const,
      label: pack.bundle.manifest.label,
      hash: pack.expectedReference.referenceHash
    },
    status,
    warnings: uniqueWarnings(warnings)
  };
  return {
    ...draft,
    comparisonHash: hashCanonical(realRunComparisonForHash(draft))
  };
}

export function promoteRealExternalRunToEvidenceCampaign(
  pack: RealExternalRunPack,
  comparison: RealExternalRunComparison,
  validation: RealExternalRunValidation,
  acceptWarnings = false
): RealExternalRunPromotion {
  const accepted = comparison.status === "pass" || (acceptWarnings && comparison.status === "warning");
  const warnings = uniqueWarnings([...comparison.warnings, ...validation.warnings]);
  const draft = {
    schema: "emmicro.fdtd.realRunEvidencePromotion.v1" as const,
    label: "L8.9 promoted real external FDTD run",
    runId: comparison.runId,
    accepted,
    acceptedWithWarnings: accepted && comparison.status !== "pass",
    campaignTarget: "Engineering Evidence Campaign" as const,
    status: comparison.status,
    receipts: {
      sourceScenarioHash: validation.sourceScenarioHash,
      manifestHash: validation.manifestHash,
      scriptHash: validation.scriptHash,
      materialHash: pack.materialHash,
      monitorHash: pack.monitorHash,
      runConfigHash: pack.runConfigHash,
      validationHash: validation.validationHash,
      comparisonHash: comparison.comparisonHash
    },
    warnings
  };
  return {
    ...draft,
    promotionHash: hashCanonical(realRunPromotionForHash(draft))
  };
}

export function createRealExternalRunReproducibilityReport(
  pack: RealExternalRunPack,
  bundle: RealExternalRunBundle | null,
  validation: RealExternalRunValidation | null,
  comparison: RealExternalRunComparison | null,
  promotion: RealExternalRunPromotion | null
): RealExternalRunReproducibilityReport {
  const warnings = uniqueWarnings([
    ...pack.bundle.manifest.readiness.warnings,
    ...(validation?.warnings ?? []),
    ...(comparison?.warnings ?? []),
    ...(promotion?.warnings ?? [])
  ]);
  const draft = {
    schema: "emmicro.fdtd.realRunReproducibilityReport.v1" as const,
    label: pack.label,
    sourceScenarioHash: pack.sourceScenarioHash,
    manifestHash: pack.manifestHash,
    scriptHash: pack.scriptHash,
    materialHash: pack.materialHash,
    monitorHash: pack.monitorHash,
    runConfigHash: pack.runConfigHash,
    packHash: pack.packHash,
    runId: bundle?.receipt.runId ?? null,
    validationStatus: validation?.status ?? "pending" as const,
    comparisonStatus: comparison?.status ?? "pending" as const,
    promotionStatus: !promotion ? "not-promoted" as const : promotion.acceptedWithWarnings ? "accepted-with-warnings" as const : promotion.accepted ? "accepted" as const : "not-promoted" as const,
    expected: pack.expectedReference.expected,
    imported: comparison?.rtaDelta ?? null,
    residuals: comparison?.rtaDelta ?? null,
    energyBalanceDelta: comparison?.energyBalanceDelta ?? null,
    fieldSliceRmsDelta: comparison?.fieldSliceRmsDelta ?? null,
    warnings,
    boundary: [...l89RealExternalRunBoundary]
  };
  return {
    ...draft,
    reportHash: hashCanonical(realRunReportForHash(draft))
  };
}

export function realExternalRunBundleJson(bundle: RealExternalRunBundle): string {
  return json(bundle);
}

export function realExternalRunValidationJson(validation: RealExternalRunValidation): string {
  return json(validation);
}

export function realExternalRunComparisonJson(comparison: RealExternalRunComparison): string {
  return json(comparison);
}

export function realExternalRunPromotionJson(promotion: RealExternalRunPromotion): string {
  return json(promotion);
}

export function realExternalRunReproducibilityReportJson(report: RealExternalRunReproducibilityReport): string {
  return json(report);
}

export function realExternalRunWarningsJson(report: RealExternalRunReproducibilityReport | RealExternalRunValidation | RealExternalRunComparison | RealExternalRunPromotion): string {
  return json({ schema: "emmicro.fdtd.realRunWarnings.v1", warnings: report.warnings });
}

export function realExternalRunMetricsCsv(comparison: RealExternalRunComparison | null, validation: RealExternalRunValidation | null): string {
  return [
    "metric,value,status",
    row("validation_status", validation?.status ?? "pending", validation?.status ?? "warning"),
    row("comparison_status", comparison?.status ?? "pending", comparison?.status ?? "warning"),
    row("reflectance_delta", comparison?.rtaDelta.reflectance ?? "", comparison?.status ?? "warning"),
    row("transmittance_delta", comparison?.rtaDelta.transmittance ?? "", comparison?.status ?? "warning"),
    row("absorbance_delta", comparison?.rtaDelta.absorbance ?? "", comparison?.status ?? "warning"),
    row("energy_balance_delta", comparison?.energyBalanceDelta ?? "", comparison?.status ?? "warning"),
    row("field_slice_rms_delta", comparison?.fieldSliceRmsDelta ?? "", comparison?.status ?? "warning")
  ].join("\n");
}

export function realExternalRunReproducibilityMarkdown(report: RealExternalRunReproducibilityReport): string {
  return [
    "# L8.9 Real External FDTD Run Reproducibility Report",
    "",
    `Label: ${report.label}`,
    `Run id: ${report.runId ?? "not imported"}`,
    `Pack hash: ${report.packHash}`,
    `Scene hash: ${report.sourceScenarioHash}`,
    `Manifest hash: ${report.manifestHash}`,
    `Script hash: ${report.scriptHash}`,
    `Material hash: ${report.materialHash}`,
    `Monitor hash: ${report.monitorHash}`,
    `Run config hash: ${report.runConfigHash}`,
    `Validation: ${report.validationStatus}`,
    `Comparison: ${report.comparisonStatus}`,
    `Promotion: ${report.promotionStatus}`,
    "",
    "## Expected R/T/A",
    "",
    `- Reflectance: ${formatNumber(report.expected.reflectance)}`,
    `- Transmittance: ${formatNumber(report.expected.transmittance)}`,
    `- Absorbance: ${formatNumber(report.expected.absorbance)}`,
    "",
    "## Imported Residuals",
    "",
    report.residuals ? `- R/T/A deltas: ${formatNumber(report.residuals.reflectance)} / ${formatNumber(report.residuals.transmittance)} / ${formatNumber(report.residuals.absorbance)}` : "- No imported run yet.",
    report.energyBalanceDelta === null ? "- Energy-balance delta: n/a" : `- Energy-balance delta: ${formatNumber(report.energyBalanceDelta)}`,
    report.fieldSliceRmsDelta === null ? "- Field-slice RMS delta: n/a" : `- Field-slice RMS delta: ${formatNumber(report.fieldSliceRmsDelta)}`,
    "",
    "## Required External Run Files",
    "",
    ...requiredBundleFiles.map((filename) => `- ${filename}`),
    "",
    "## Warnings",
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning.code}: ${warning.message}`) : ["- none"]),
    "",
    "## Boundary",
    ...report.boundary.map((item) => `- ${item}`)
  ].join("\n");
}

function makeRunConfig(bundle: FdtdExportBundle, materialHash: string, monitorHash: string): RealExternalRunConfig {
  const draft = {
    schema: "emmicro.fdtd.realRunConfig.v1" as const,
    runId: `l89-${bundle.manifest.sourceScenarioId}`,
    sourceScenarioHash: bundle.manifest.sourceScenarioHash,
    manifestHash: bundle.manifest.manifestHash,
    scriptHash: bundle.script.scriptHash,
    resolution: Math.max(1, Math.round(1000 / bundle.manifest.grid.gridSpacingNm)),
    until: 200,
    pmlThicknessUm: bundle.manifest.boundaries.pmlThicknessUm,
    grid: bundle.manifest.grid,
    requiredMonitorIds: bundle.manifest.monitors.map((monitor) => monitor.id),
    fieldSliceId: bundle.manifest.monitors.find((monitor) => monitor.kind === "field-slice")?.id ?? "field-slice-xz",
    outputFiles: [...requiredBundleFiles],
    materialHash,
    monitorHash
  };
  const { materialHash: _materialHash, monitorHash: _monitorHash, ...publicDraft } = draft;
  return {
    ...publicDraft,
    configHash: hashCanonical(draft)
  };
}

function makeExpectedReference(bundle: FdtdExportBundle, model: string, expected: RealExternalRunReference["expected"]): RealExternalRunReference {
  const draft = {
    schema: "emmicro.fdtd.realRunExpectedReference.v1" as const,
    model,
    sourceScenarioHash: bundle.manifest.sourceScenarioHash,
    manifestHash: bundle.manifest.manifestHash,
    expected,
    tolerances: {
      rtaResidualPass: 0.025,
      rtaResidualWarning: 0.1,
      energyResidualPass: 0.025,
      energyResidualWarning: 0.1,
      fieldSliceRmsWarning: 0.35
    }
  };
  return {
    ...draft,
    referenceHash: hashCanonical(draft)
  };
}

function makeReceiptSet(bundle: FdtdExportBundle, materialHash: string, monitorHash: string, runConfigHash: string): RealExternalRunReceiptSet {
  const draft = {
    schema: "emmicro.fdtd.realRunReceiptSet.v1" as const,
    sourceScenarioHash: bundle.manifest.sourceScenarioHash,
    manifestHash: bundle.manifest.manifestHash,
    scriptHash: bundle.script.scriptHash,
    materialHash,
    monitorHash,
    runConfigHash,
    requiredMonitorIds: bundle.manifest.monitors.map((monitor) => monitor.id)
  };
  return {
    ...draft,
    receiptSetHash: hashCanonical(draft)
  };
}

function makePackFiles(
  bundle: FdtdExportBundle,
  runConfig: RealExternalRunConfig,
  expectedReference: RealExternalRunReference,
  materialReceipts: RealExternalRunReceiptSet,
  monitorReceipts: RealExternalRunReceiptSet,
  commands: RealExternalRunPack["commands"]
): RealExternalRunPackFile[] {
  const files: Array<{ path: RealExternalRunFileName; mime: string; text: string }> = [
    { path: "scene_manifest.json", mime: "application/json", text: fdtdManifestJson(bundle.manifest) },
    { path: "meep_scene.py", mime: "text/x-python", text: fdtdMeepScriptText(bundle.script) },
    { path: "expected_reference.json", mime: "application/json", text: json(expectedReference) },
    { path: "run_config.json", mime: "application/json", text: json(runConfig) },
    { path: "material_receipts.json", mime: "application/json", text: json(materialReceipts) },
    { path: "monitor_receipts.json", mime: "application/json", text: json(monitorReceipts) },
    { path: "README.md", mime: "text/markdown", text: runPackReadme(bundle, runConfig, commands) },
    { path: "reproduce.sh", mime: "text/x-shellscript", text: reproduceSh(commands) },
    { path: "reproduce.ps1", mime: "text/x-powershell", text: reproducePs1(commands) },
    { path: "postprocess.py", mime: "text/x-python", text: postprocessPy(bundle, runConfig, materialReceipts) },
    { path: "requirements-meep.txt", mime: "text/plain", text: "meep\nnumpy\nmatplotlib\n" }
  ];
  return files.map((file) => ({ ...file, hash: hashCanonical({ path: file.path, text: file.text }) }));
}

function runPackReadme(bundle: FdtdExportBundle, runConfig: RealExternalRunConfig, commands: RealExternalRunPack["commands"]): string {
  return [
    "# L8.9 Real External FDTD Run Pack",
    "",
    "This pack is generated by EMMicro for optional local Meep/FDTD execution outside the browser.",
    "The web app does not execute FDTD and does not require Python, Meep, or native solver dependencies.",
    "",
    "## Files",
    "",
    "- `scene_manifest.json`: deterministic EMMicro scene manifest.",
    "- `meep_scene.py`: deterministic Meep helper script.",
    "- `expected_reference.json`: analytic/TMM/scalar reference for R/T/A comparison.",
    "- `run_config.json`: grid, PML, monitor, and output contract.",
    "- `material_receipts.json` and `monitor_receipts.json`: hashes used during import validation.",
    "- `postprocess.py`: schema-oriented placeholder for converting local solver outputs into importable files.",
    "",
    "## Local Commands",
    "",
    ...commands.createEnvironment.map((command) => `- ${command}`),
    `- ${commands.install}`,
    `- ${commands.run}`,
    `- ${commands.postprocess}`,
    "",
    "## Import Outputs",
    "",
    ...requiredBundleFiles.map((filename) => `- ${filename}`),
    "",
    "## Receipt Summary",
    "",
    `- sourceScenarioHash: ${bundle.manifest.sourceScenarioHash}`,
    `- manifestHash: ${bundle.manifest.manifestHash}`,
    `- scriptHash: ${bundle.script.scriptHash}`,
    `- runConfigHash: ${runConfig.configHash}`,
    "",
    "## Boundary",
    "",
    ...l89RealExternalRunBoundary.map((item) => `- ${item}`)
  ].join("\n");
}

function reproduceSh(commands: RealExternalRunPack["commands"]): string {
  return [
    "#!/usr/bin/env bash",
    "set -euo pipefail",
    "python -m venv .venv",
    ". .venv/bin/activate",
    commands.install,
    commands.run,
    commands.postprocess,
    ""
  ].join("\n");
}

function reproducePs1(commands: RealExternalRunPack["commands"]): string {
  return [
    "$ErrorActionPreference = 'Stop'",
    "python -m venv .venv",
    ".\\.venv\\Scripts\\Activate.ps1",
    commands.install,
    commands.run,
    commands.postprocess,
    ""
  ].join("\n");
}

function postprocessPy(bundle: FdtdExportBundle, runConfig: RealExternalRunConfig, receipts: RealExternalRunReceiptSet): string {
  return [
    "\"\"\"L8.9 schema-oriented postprocess placeholder.",
    "",
    "Replace the synthetic readers below with real Meep output readers, then emit:",
    "run_receipt.json, flux_summary.json, field_slice_xz.csv, energy_balance.json, postprocess_log.json.",
    "The browser imports the files but does not run this script.",
    "\"\"\"",
    "",
    "import json",
    "",
    `SOURCE_SCENARIO_HASH = ${JSON.stringify(bundle.manifest.sourceScenarioHash)}`,
    `MANIFEST_HASH = ${JSON.stringify(bundle.manifest.manifestHash)}`,
    `SCRIPT_HASH = ${JSON.stringify(bundle.script.scriptHash)}`,
    `MATERIAL_HASH = ${JSON.stringify(receipts.materialHash)}`,
    `MONITOR_HASH = ${JSON.stringify(receipts.monitorHash)}`,
    `RUN_CONFIG_HASH = ${JSON.stringify(runConfig.configHash)}`,
    "",
    "print(json.dumps({",
    "    'status': 'placeholder',",
    "    'message': 'Wire this script to local Meep outputs, then import generated artifacts into EMMicro L8.9.'",
    "}, indent=2))",
    ""
  ].join("\n");
}

function createHashMismatchBundle(
  pack: RealExternalRunPack,
  receipt: FdtdRunReceipt,
  flux: FdtdFluxSummary,
  fieldSlice: FdtdFieldSlice,
  fieldSliceCsv: string
): RealExternalRunBundle {
  const mismatchWarnings: SolverWarning[] = [{ code: "fdtd.realRun.fixtureHashMismatch", message: "Intentional L8.9 fixture with mismatched material/monitor/run-config hashes." }];
  const nextReceipt = makeFdtdRunReceipt({
    ...stripReceiptHash(receipt),
    warnings: mismatchWarnings
  });
  const nextFlux = makeFdtdFluxSummary({
    ...stripFluxHash(flux),
    warnings: mismatchWarnings
  });
  const bundle = createRealExternalRunBundle(pack, nextReceipt, nextFlux, fieldSlice, fieldSliceCsv, mismatchWarnings);
  const postprocessLog = {
    ...bundle.postprocessLog,
    materialHash: "mismatch-material-hash",
    monitorHash: "mismatch-monitor-hash",
    runConfigHash: "mismatch-run-config-hash",
    warnings: mismatchWarnings,
    postprocessHash: hashCanonical({ mismatch: true, runId: nextReceipt.runId })
  };
  return {
    ...bundle,
    postprocessLog,
    bundleHash: hashCanonical(realRunBundleForHash({ ...bundle, postprocessLog }))
  };
}

function makeEnergyBalance(flux: FdtdFluxSummary): RealExternalEnergyBalance {
  const rtaSum = flux.reflectance + flux.transmittance + flux.absorbance;
  const residual = Math.abs(rtaSum - 1);
  const status: SimulationBuilderValidationStatus = residual <= 0.025 ? "pass" : residual <= 0.1 ? "warning" : "fail";
  const draft = {
    schema: "emmicro.fdtd.realRunEnergyBalance.v1" as const,
    runId: flux.runId,
    reflectance: flux.reflectance,
    transmittance: flux.transmittance,
    absorbance: flux.absorbance,
    rtaSum,
    residual,
    status
  };
  return {
    ...draft,
    energyHash: hashCanonical(draft)
  };
}

function makePostprocessLog(pack: RealExternalRunPack, receipt: FdtdRunReceipt, warnings: SolverWarning[]): RealExternalPostprocessLog {
  const draft = {
    schema: "emmicro.fdtd.realRunPostprocessLog.v1" as const,
    runId: receipt.runId,
    sourceScenarioHash: pack.sourceScenarioHash,
    manifestHash: pack.manifestHash,
    scriptHash: pack.scriptHash,
    materialHash: pack.materialHash,
    monitorHash: pack.monitorHash,
    runConfigHash: pack.runConfigHash,
    postprocessorVersion: "emmicro.fdtd.realRun.postprocess.v1",
    files: [...requiredBundleFiles],
    warnings: uniqueWarnings(warnings)
  };
  return {
    ...draft,
    postprocessHash: hashCanonical(draft)
  };
}

function makeFieldPreview(fieldSlice: FdtdFieldSlice): RealExternalFieldPreviewMetadata {
  const draft = {
    schema: "emmicro.fdtd.realRunFieldPreview.v1" as const,
    filename: "field_preview.png" as const,
    mime: "image/png" as const,
    width: fieldSlice.xCount,
    height: fieldSlice.zCount,
    minIntensity: fieldSlice.minIntensity,
    maxIntensity: fieldSlice.maxIntensity
  };
  return {
    ...draft,
    previewHash: hashCanonical(draft)
  };
}

function parseEnergyBalance(value: string): RealExternalEnergyBalance {
  const parsed = JSON.parse(value) as RealExternalEnergyBalance;
  if (parsed.schema !== "emmicro.fdtd.realRunEnergyBalance.v1") throw new Error("energy_balance.json must use emmicro.fdtd.realRunEnergyBalance.v1");
  return parsed;
}

function parsePostprocessLog(value: string): RealExternalPostprocessLog {
  const parsed = JSON.parse(value) as RealExternalPostprocessLog;
  if (parsed.schema !== "emmicro.fdtd.realRunPostprocessLog.v1") throw new Error("postprocess_log.json must use emmicro.fdtd.realRunPostprocessLog.v1");
  return parsed;
}

function fieldSliceRmsDeltaToReference(fieldSlice: FdtdFieldSlice, downstreamReference: number): number {
  if (fieldSlice.samples.length === 0) return 0;
  const target = Math.max(0, downstreamReference);
  const sum = fieldSlice.samples.reduce((total, sample) => total + Math.pow(sample.intensity - target, 2), 0);
  return Math.sqrt(sum / fieldSlice.samples.length);
}

function residualStatus(value: number, pack: RealExternalRunPack): SimulationBuilderValidationStatus {
  if (value <= pack.expectedReference.tolerances.rtaResidualPass) return "pass";
  if (value <= pack.expectedReference.tolerances.rtaResidualWarning) return "warning";
  return "fail";
}

function stripReceiptHash(receipt: FdtdRunReceipt): Omit<FdtdRunReceipt, "receiptHash"> {
  const { receiptHash: _receiptHash, ...payload } = receipt;
  return payload;
}

function stripFluxHash(flux: FdtdFluxSummary): Omit<FdtdFluxSummary, "fluxHash"> {
  const { fluxHash: _fluxHash, ...payload } = flux;
  return payload;
}

function realRunPackForHash(pack: Omit<RealExternalRunPack, "packHash">): unknown {
  return {
    schema: pack.schema,
    sourceScenarioHash: pack.sourceScenarioHash,
    manifestHash: pack.manifestHash,
    scriptHash: pack.scriptHash,
    materialHash: pack.materialHash,
    monitorHash: pack.monitorHash,
    runConfigHash: pack.runConfigHash,
    expectedReferenceHash: pack.expectedReference.referenceHash,
    files: pack.files.map((file) => ({ path: file.path, hash: file.hash }))
  };
}

function realRunBundleForHash(bundle: Omit<RealExternalRunBundle, "bundleHash">): unknown {
  return {
    schema: bundle.schema,
    receiptHash: bundle.receipt.receiptHash,
    fluxHash: bundle.flux.fluxHash,
    sliceHash: bundle.fieldSlice.sliceHash,
    energyHash: bundle.energyBalance.energyHash,
    postprocessHash: bundle.postprocessLog.postprocessHash,
    previewHash: bundle.fieldPreview.previewHash
  };
}

function realRunValidationForHash(validation: Omit<RealExternalRunValidation, "validationHash">): unknown {
  return {
    schema: validation.schema,
    sourceScenarioHash: validation.sourceScenarioHash,
    manifestHash: validation.manifestHash,
    scriptHash: validation.scriptHash,
    materialHashStatus: validation.materialHashStatus,
    monitorHashStatus: validation.monitorHashStatus,
    runConfigHashStatus: validation.runConfigHashStatus,
    requiredFilesStatus: validation.requiredFilesStatus,
    requiredMonitorsStatus: validation.requiredMonitorsStatus,
    receiptStatus: validation.receiptStatus,
    baseReportHash: validation.baseValidation.reportHash,
    status: validation.status,
    warningCodes: validation.warnings.map((warning) => warning.code)
  };
}

function realRunComparisonForHash(comparison: Omit<RealExternalRunComparison, "comparisonHash">): unknown {
  return {
    schema: comparison.schema,
    sourceScenarioHash: comparison.sourceScenarioHash,
    runId: comparison.runId,
    rtaDelta: comparison.rtaDelta,
    energyBalanceDelta: comparison.energyBalanceDelta,
    fieldSliceRmsDelta: comparison.fieldSliceRmsDelta,
    referenceResidual: comparison.referenceResidual,
    status: comparison.status,
    warningCodes: comparison.warnings.map((warning) => warning.code)
  };
}

function realRunPromotionForHash(promotion: Omit<RealExternalRunPromotion, "promotionHash">): unknown {
  return {
    schema: promotion.schema,
    runId: promotion.runId,
    accepted: promotion.accepted,
    acceptedWithWarnings: promotion.acceptedWithWarnings,
    status: promotion.status,
    receipts: promotion.receipts,
    warningCodes: promotion.warnings.map((warning) => warning.code)
  };
}

function realRunReportForHash(report: Omit<RealExternalRunReproducibilityReport, "reportHash">): unknown {
  return {
    schema: report.schema,
    packHash: report.packHash,
    runId: report.runId,
    validationStatus: report.validationStatus,
    comparisonStatus: report.comparisonStatus,
    promotionStatus: report.promotionStatus,
    expected: report.expected,
    residuals: report.residuals,
    energyBalanceDelta: report.energyBalanceDelta,
    fieldSliceRmsDelta: report.fieldSliceRmsDelta,
    warningCodes: report.warnings.map((warning) => warning.code)
  };
}

function worstStatus(statuses: SimulationBuilderValidationStatus[]): SimulationBuilderValidationStatus {
  if (statuses.includes("fail")) return "fail";
  if (statuses.includes("warning")) return "warning";
  return "pass";
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

function row(metric: string, value: string | number, status: string): string {
  return [metric, value, status].map(csvEscape).join(",");
}

function csvEscape(value: unknown): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}

function hashCanonical(value: unknown): string {
  return fnv1a64(stableStringify(value));
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function formatNumber(value: number): string {
  if (value === 0) return "0";
  if (!Number.isFinite(value)) return "n/a";
  if (Math.abs(value) >= 1000 || Math.abs(value) < 0.001) return value.toExponential(4);
  return value.toPrecision(6);
}
