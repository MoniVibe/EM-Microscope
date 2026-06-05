import {
  runSimulationBuilderScenario,
  type SimulationBuilderScenario,
  type SimulationBuilderValidationStatus
} from "../maxwell/simulationBuilder";
import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import type { FdtdExportBundle, FdtdImportedRun, FdtdValidationReport } from "./fdtdTypes";

export function validateFdtdImportedRunAgainstScenario(
  scenario: SimulationBuilderScenario,
  bundle: FdtdExportBundle,
  imported: FdtdImportedRun
): FdtdValidationReport {
  const l80 = runSimulationBuilderScenario(scenario);
  const warnings: SolverWarning[] = [...imported.warnings];
  if (imported.receipt.sourceScenarioHash !== bundle.manifest.sourceScenarioHash) {
    warnings.push({
      code: "fdtd.validation.sourceHashMismatch",
      message: "Imported FDTD receipt does not match the current Simulation Builder scenario hash."
    });
  }
  if (imported.receipt.manifestHash !== bundle.manifest.manifestHash) {
    warnings.push({
      code: "fdtd.validation.manifestHashMismatch",
      message: "Imported FDTD receipt does not match the exported manifest hash."
    });
  }
  if (imported.receipt.scriptHash !== bundle.script.scriptHash) {
    warnings.push({
      code: "fdtd.validation.scriptHashMismatch",
      message: "Imported FDTD receipt does not match the exported Meep script hash."
    });
  }
  if (bundle.manifest.readiness.status === "blocked") {
    warnings.push({
      code: "fdtd.validation.blockedManifest",
      message: "The exported manifest contains unsupported geometry and should not be treated as executable evidence."
    });
  }

  const expected = {
    reflectance: l80.validation.expected.reflectance,
    transmittance: l80.validation.expected.transmittance,
    absorbance: l80.validation.expected.absorbance
  };
  const importedValues = {
    reflectance: imported.flux.reflectance,
    transmittance: imported.flux.transmittance,
    absorbance: imported.flux.absorbance
  };
  const residuals = {
    reflectance: Math.abs(importedValues.reflectance - expected.reflectance),
    transmittance: Math.abs(importedValues.transmittance - expected.transmittance),
    absorbance: Math.abs(importedValues.absorbance - expected.absorbance),
    energyBalance: Math.abs(imported.flux.energyBalance - 1)
  };
  const worstResidual = Math.max(residuals.reflectance, residuals.transmittance, residuals.absorbance, residuals.energyBalance);
  const hasHashMismatch = warnings.some((warning) => warning.code.includes("HashMismatch"));
  const status: SimulationBuilderValidationStatus = hasHashMismatch || bundle.manifest.readiness.status === "blocked" ? "fail" : worstResidual <= 0.025 ? "pass" : worstResidual <= 0.1 ? "warning" : "fail";
  const base = {
    schema: "emmicro.fdtd.validationReport.v1" as const,
    sourceScenarioHash: bundle.manifest.sourceScenarioHash,
    manifestHash: bundle.manifest.manifestHash,
    scriptHash: bundle.script.scriptHash,
    targetKind: scenario.target.kind,
    expected,
    imported: importedValues,
    residuals,
    energyBalance: imported.flux.energyBalance,
    status,
    warnings: uniqueWarnings(warnings)
  };
  return {
    ...base,
    reportHash: fnv1a64(stableStringify(base))
  };
}

export function fdtdValidationReportJson(report: FdtdValidationReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function fdtdValidationReportMarkdown(report: FdtdValidationReport): string {
  return [
    "# L8.1 External FDTD Field Import Validation",
    "",
    `Scenario hash: ${report.sourceScenarioHash}`,
    `Manifest hash: ${report.manifestHash}`,
    `Script hash: ${report.scriptHash}`,
    `Target kind: ${report.targetKind}`,
    `Status: ${report.status.toUpperCase()}`,
    "",
    "| Metric | L8.0 analytic/TMM expected | Imported FDTD | Residual |",
    "| --- | ---: | ---: | ---: |",
    `| R | ${formatNumber(report.expected.reflectance)} | ${formatNumber(report.imported.reflectance)} | ${formatNumber(report.residuals.reflectance)} |`,
    `| T | ${formatNumber(report.expected.transmittance)} | ${formatNumber(report.imported.transmittance)} | ${formatNumber(report.residuals.transmittance)} |`,
    `| A | ${formatNumber(report.expected.absorbance)} | ${formatNumber(report.imported.absorbance)} | ${formatNumber(report.residuals.absorbance)} |`,
    `| R+T+A | 1 | ${formatNumber(report.energyBalance)} | ${formatNumber(report.residuals.energyBalance)} |`,
    "",
    "## Warnings",
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning.message}`) : ["- none"])
  ].join("\n");
}

export function fdtdValidationMetricsCsv(report: FdtdValidationReport): string {
  return [
    "metric,expected,imported,residual,status",
    row("reflectance", report.expected.reflectance, report.imported.reflectance, report.residuals.reflectance, report.status),
    row("transmittance", report.expected.transmittance, report.imported.transmittance, report.residuals.transmittance, report.status),
    row("absorbance", report.expected.absorbance, report.imported.absorbance, report.residuals.absorbance, report.status),
    row("energy_balance", 1, report.energyBalance, report.residuals.energyBalance, report.status)
  ].join("\n");
}

function row(metric: string, expected: number, imported: number, residual: number, status: string): string {
  return [metric, expected, imported, residual, status].map(String).join(",");
}

function formatNumber(value: number): string {
  if (value === 0) return "0";
  if (Math.abs(value) >= 1000 || Math.abs(value) < 0.001) return value.toExponential(4);
  return value.toPrecision(6);
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
