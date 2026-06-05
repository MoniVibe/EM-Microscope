import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import type {
  FdtdFieldSlice,
  FdtdFieldSliceSample,
  FdtdFluxSummary,
  FdtdImportedRun,
  FdtdRunReceipt
} from "./fdtdTypes";

export type FdtdFieldSliceCsvContext = {
  id: string;
  sourceScenarioHash: string;
  manifestHash: string;
  component?: FdtdFieldSlice["component"];
  plane?: FdtdFieldSlice["plane"];
};

export type FdtdRunArtifactImportInput = {
  receiptJson: string | FdtdRunReceipt;
  fluxJson: string | FdtdFluxSummary;
  fieldSliceCsv: string;
  fieldSlice: FdtdFieldSliceCsvContext;
};

export function makeFdtdRunReceipt(input: Omit<FdtdRunReceipt, "receiptHash">): FdtdRunReceipt {
  const base = {
    ...input,
    warnings: [...input.warnings]
  };
  return {
    ...base,
    receiptHash: fnv1a64(stableStringify(base))
  };
}

export function makeFdtdFluxSummary(input: Omit<FdtdFluxSummary, "fluxHash">): FdtdFluxSummary {
  const base = {
    ...input,
    monitors: input.monitors.map((monitor) => ({ ...monitor })),
    warnings: [...input.warnings]
  };
  return {
    ...base,
    fluxHash: fnv1a64(stableStringify(base))
  };
}

export function makeFdtdFieldSlice(input: Omit<FdtdFieldSlice, "sliceHash" | "minIntensity" | "maxIntensity">): FdtdFieldSlice {
  const samples = input.samples.map((sample) => ({ ...sample }));
  const intensities = samples.map((sample) => sample.intensity);
  const base = {
    ...input,
    samples,
    minIntensity: intensities.length ? Math.min(...intensities) : 0,
    maxIntensity: intensities.length ? Math.max(...intensities) : 0
  };
  return {
    ...base,
    sliceHash: fnv1a64(stableStringify(base))
  };
}

export function parseFdtdRunReceiptJson(value: string | FdtdRunReceipt): FdtdRunReceipt {
  const record = asRecord(parseJson(value, "FDTD run receipt"), "FDTD run receipt");
  if (record.schema !== "emmicro.fdtd.runReceipt.v1") throw new Error("FDTD run receipt schema must be emmicro.fdtd.runReceipt.v1");
  return {
    schema: "emmicro.fdtd.runReceipt.v1",
    runId: requiredString(record, "runId"),
    sourceScenarioHash: requiredString(record, "sourceScenarioHash"),
    manifestHash: requiredString(record, "manifestHash"),
    scriptHash: requiredString(record, "scriptHash"),
    tool: parseReceiptTool(asRecord(record.tool, "receipt.tool")),
    createdAtIso: requiredString(record, "createdAtIso"),
    settings: parseReceiptSettings(asRecord(record.settings, "receipt.settings")),
    warnings: parseWarnings(record.warnings),
    receiptHash: requiredString(record, "receiptHash")
  };
}

export function parseFdtdFluxSummaryJson(value: string | FdtdFluxSummary): FdtdFluxSummary {
  const record = asRecord(parseJson(value, "FDTD flux summary"), "FDTD flux summary");
  if (record.schema !== "emmicro.fdtd.fluxSummary.v1") throw new Error("FDTD flux summary schema must be emmicro.fdtd.fluxSummary.v1");
  return {
    schema: "emmicro.fdtd.fluxSummary.v1",
    runId: requiredString(record, "runId"),
    sourceScenarioHash: requiredString(record, "sourceScenarioHash"),
    manifestHash: requiredString(record, "manifestHash"),
    incidentFlux: requiredNumber(record, "incidentFlux"),
    reflectedFlux: requiredNumber(record, "reflectedFlux"),
    transmittedFlux: requiredNumber(record, "transmittedFlux"),
    absorbedFlux: requiredNumber(record, "absorbedFlux"),
    reflectance: requiredNumber(record, "reflectance"),
    transmittance: requiredNumber(record, "transmittance"),
    absorbance: requiredNumber(record, "absorbance"),
    energyBalance: requiredNumber(record, "energyBalance"),
    monitors: parseFluxMonitors(record.monitors),
    warnings: parseWarnings(record.warnings),
    fluxHash: requiredString(record, "fluxHash")
  };
}

export function parseFdtdFieldSliceCsv(csv: string, context: FdtdFieldSliceCsvContext): FdtdFieldSlice {
  const lines = csv.trim().split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) throw new Error("FDTD field slice CSV must include a header and at least one sample");
  const header = splitCsvLine(lines[0]!).map((column) => column.trim().toLowerCase());
  const xIndex = requiredColumn(header, "x_um");
  const zIndex = requiredColumn(header, "z_um");
  const valueIndex = requiredColumn(header, "value");
  const intensityIndex = requiredColumn(header, "intensity");
  const samples: FdtdFieldSliceSample[] = [];
  for (const line of lines.slice(1)) {
    const columns = splitCsvLine(line);
    samples.push({
      xUm: csvNumber(columns[xIndex], "x_um"),
      zUm: csvNumber(columns[zIndex], "z_um"),
      value: csvNumber(columns[valueIndex], "value"),
      intensity: csvNumber(columns[intensityIndex], "intensity")
    });
  }
  const xCount = uniqueCount(samples.map((sample) => sample.xUm));
  const zCount = uniqueCount(samples.map((sample) => sample.zUm));
  return makeFdtdFieldSlice({
    schema: "emmicro.fdtd.fieldSlice.v1",
    id: context.id,
    sourceScenarioHash: context.sourceScenarioHash,
    manifestHash: context.manifestHash,
    component: context.component ?? "intensity",
    plane: context.plane ?? "xz",
    samples,
    xCount,
    zCount
  });
}

export function importFdtdRunArtifacts(input: FdtdRunArtifactImportInput): FdtdImportedRun {
  const receipt = parseFdtdRunReceiptJson(input.receiptJson);
  const flux = parseFdtdFluxSummaryJson(input.fluxJson);
  const fieldSlice = parseFdtdFieldSliceCsv(input.fieldSliceCsv, input.fieldSlice);
  const warnings: SolverWarning[] = [];
  if (flux.runId !== receipt.runId) {
    warnings.push({
      code: "fdtd.import.runIdMismatch",
      message: `Flux summary runId ${flux.runId} does not match receipt runId ${receipt.runId}.`
    });
  }
  if (flux.sourceScenarioHash !== receipt.sourceScenarioHash || fieldSlice.sourceScenarioHash !== receipt.sourceScenarioHash) {
    warnings.push({
      code: "fdtd.import.sourceHashMismatch",
      message: "Imported receipt, flux summary, and field slice do not share the same source scenario hash."
    });
  }
  if (flux.manifestHash !== receipt.manifestHash || fieldSlice.manifestHash !== receipt.manifestHash) {
    warnings.push({
      code: "fdtd.import.manifestHashMismatch",
      message: "Imported receipt, flux summary, and field slice do not share the same manifest hash."
    });
  }
  const { receiptHash: _receiptHash, ...receiptPayload } = receipt;
  const { fluxHash: _fluxHash, ...fluxPayload } = flux;
  const recomputedReceipt = makeFdtdRunReceipt(receiptPayload);
  const recomputedFlux = makeFdtdFluxSummary(fluxPayload);
  if (recomputedReceipt.receiptHash !== receipt.receiptHash) {
    warnings.push({
      code: "fdtd.import.receiptHashMismatch",
      message: "Run receipt hash does not match its canonical payload."
    });
  }
  if (recomputedFlux.fluxHash !== flux.fluxHash) {
    warnings.push({
      code: "fdtd.import.fluxHashMismatch",
      message: "Flux summary hash does not match its canonical payload."
    });
  }
  return {
    receipt,
    flux,
    fieldSlice,
    warnings: [...receipt.warnings, ...flux.warnings, ...warnings]
  };
}

export function fdtdFieldSliceToCsv(slice: FdtdFieldSlice): string {
  return [
    "x_um,z_um,value,intensity",
    ...slice.samples.map((sample) => [sample.xUm, sample.zUm, sample.value, sample.intensity].map(formatNumber).join(","))
  ].join("\n");
}

export function fdtdImportedRunJson(imported: FdtdImportedRun): string {
  return `${JSON.stringify(imported, null, 2)}\n`;
}

function parseJson(value: string | object, label: string): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be a JSON object`);
  return value as Record<string, unknown>;
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

function parseReceiptTool(record: Record<string, unknown>): FdtdRunReceipt["tool"] {
  const name = requiredString(record, "name");
  if (name !== "meep" && name !== "example-fixture" && name !== "external-fdtd") throw new Error("receipt.tool.name must be meep, example-fixture, or external-fdtd");
  return {
    name,
    version: requiredString(record, "version"),
    postprocessorVersion: requiredString(record, "postprocessorVersion")
  };
}

function parseReceiptSettings(record: Record<string, unknown>): FdtdRunReceipt["settings"] {
  return {
    resolution: requiredNumber(record, "resolution"),
    until: requiredNumber(record, "until"),
    pmlThicknessUm: requiredNumber(record, "pmlThicknessUm")
  };
}

function parseWarnings(value: unknown): SolverWarning[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const record = asRecord(item, `warning ${index + 1}`);
    return {
      code: requiredString(record, "code"),
      message: requiredString(record, "message"),
      elementId: typeof record.elementId === "string" ? record.elementId : undefined
    };
  });
}

function parseFluxMonitors(value: unknown): FdtdFluxSummary["monitors"] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const record = asRecord(item, `monitor ${index + 1}`);
    return {
      id: requiredString(record, "id"),
      flux: requiredNumber(record, "flux")
    };
  });
}

function requiredColumn(header: string[], name: string): number {
  const index = header.indexOf(name);
  if (index < 0) throw new Error(`FDTD field slice CSV is missing ${name}`);
  return index;
}

function splitCsvLine(line: string): string[] {
  return line.split(",").map((value) => value.trim());
}

function csvNumber(value: string | undefined, label: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`FDTD field slice CSV ${label} must be numeric`);
  return parsed;
}

function uniqueCount(values: number[]): number {
  return new Set(values.map((value) => formatNumber(value))).size;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  return Number(value.toPrecision(12)).toString();
}
