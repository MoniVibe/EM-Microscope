import { z } from "zod";
import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import type { SpectralMaterialPoint, SpectralMaterialRecord } from "./materialCatalog";

export type MaterialImportUnit = "m" | "um" | "nm";

export type MaterialImportSource = {
  name: string;
  reference?: string;
  url?: string;
  doi?: string;
  license?: string;
  retrievedAt?: string;
};

export type MaterialImportSample = {
  wavelength: number;
  n: number;
  k?: number;
  nUncertainty?: number;
  kUncertainty?: number;
};

export type MaterialImportRecord = {
  id: string;
  label: string;
  family: SpectralMaterialRecord["family"];
  wavelengthUnit?: MaterialImportUnit;
  source: MaterialImportSource;
  notes?: string[];
  samples: MaterialImportSample[];
};

export type MaterialImportPackage = {
  schema: "emmicro.materials.v1";
  id: string;
  label: string;
  records: MaterialImportRecord[];
};

export type MaterialImportResult = {
  id: string;
  type: "maxwellMaterialImport";
  analysisId: "analysis.maxwell.l5.phase3.materialImport";
  label: string;
  records: SpectralMaterialRecord[];
  warnings: SolverWarning[];
  resultHash: string;
  provenance: {
    label: "L5.3 sourced spectral material import and provenance audit";
    limitations: string[];
  };
};

export type MaterialCatalogAudit = {
  id: string;
  type: "maxwellMaterialCatalogAudit";
  analysisId: "analysis.maxwell.l5.phase3.materialCatalogAudit";
  recordCount: number;
  sampleCount: number;
  familyCounts: Record<SpectralMaterialRecord["family"], number>;
  wavelengthRangeM: [number, number] | null;
  diagnosticRecordCount: number;
  sourcedRecordCount: number;
  warnings: SolverWarning[];
  resultHash: string;
};

const finiteNumber = z.number().finite();

const materialImportSourceSchema = z.object({
  name: z.string().min(1),
  reference: z.string().min(1).optional(),
  url: z.string().url().optional(),
  doi: z.string().min(1).optional(),
  license: z.string().min(1).optional(),
  retrievedAt: z.string().min(1).optional()
});

const materialImportSampleSchema = z.object({
  wavelength: finiteNumber.positive(),
  n: finiteNumber.positive(),
  k: finiteNumber.optional(),
  nUncertainty: finiteNumber.nonnegative().optional(),
  kUncertainty: finiteNumber.nonnegative().optional()
});

const materialImportRecordSchema = z.object({
  id: z.string().min(1).regex(/^[A-Za-z0-9._:-]+$/),
  label: z.string().min(1),
  family: z.enum(["ambient", "dielectric", "coating", "absorber", "semiconductor"]),
  wavelengthUnit: z.enum(["m", "um", "nm"]).optional(),
  source: materialImportSourceSchema,
  notes: z.array(z.string().min(1)).optional(),
  samples: z.array(materialImportSampleSchema).min(1)
});

const materialImportPackageSchema = z.object({
  schema: z.literal("emmicro.materials.v1"),
  id: z.string().min(1),
  label: z.string().min(1),
  records: z.array(materialImportRecordSchema).min(1)
});

export function parseMaterialImportJson(text: string): MaterialImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    throw new Error(`invalid material import JSON: ${(error as Error).message}`);
  }
  return importMaterialPackage(raw);
}

export function importMaterialPackage(input: unknown): MaterialImportResult {
  const parsed = materialImportPackageSchema.parse(input) satisfies MaterialImportPackage;
  const warnings: SolverWarning[] = [];
  const seenIds = new Set<string>();
  const records: SpectralMaterialRecord[] = parsed.records.map((record) => {
    if (seenIds.has(record.id)) {
      warnings.push({
        code: "maxwell.materialImport.duplicateId",
        message: `Material import package contains duplicate material id '${record.id}'.`,
        elementId: record.id
      });
    }
    seenIds.add(record.id);
    return importedRecord(record, warnings);
  });
  warnings.push(...auditMaterialCatalog(records).warnings);

  const resultHash = fnv1a64(
    stableStringify({
      analysisId: "analysis.maxwell.l5.phase3.materialImport",
      package: parsed,
      records: records.map(recordForHash),
      warningCodes: warnings.map((warning) => warning.code)
    })
  );

  return {
    id: parsed.id,
    type: "maxwellMaterialImport",
    analysisId: "analysis.maxwell.l5.phase3.materialImport",
    label: parsed.label,
    records,
    warnings: uniqueWarnings(warnings),
    resultHash,
    provenance: materialImportProvenance()
  };
}

export function auditMaterialCatalog(records: SpectralMaterialRecord[], id = "material-catalog-audit"): MaterialCatalogAudit {
  const familyCounts: MaterialCatalogAudit["familyCounts"] = {
    ambient: 0,
    dielectric: 0,
    coating: 0,
    absorber: 0,
    semiconductor: 0
  };
  let sampleCount = 0;
  let minWavelengthM = Number.POSITIVE_INFINITY;
  let maxWavelengthM = Number.NEGATIVE_INFINITY;
  let diagnosticRecordCount = 0;
  let sourcedRecordCount = 0;
  const warnings: SolverWarning[] = [];
  const seenIds = new Set<string>();

  for (const record of records) {
    familyCounts[record.family] += 1;
    sampleCount += record.samples.length;
    if (seenIds.has(record.id)) {
      warnings.push({
        code: "maxwell.materialCatalog.duplicateId",
        message: `Material catalog contains duplicate material id '${record.id}'.`,
        elementId: record.id
      });
    }
    seenIds.add(record.id);

    if (isDiagnosticRecord(record)) {
      diagnosticRecordCount += 1;
    } else {
      sourcedRecordCount += 1;
    }

    if (record.samples.length === 0) {
      warnings.push({
        code: "maxwell.materialCatalog.emptyRecord",
        message: `${record.label} has no wavelength samples.`,
        elementId: record.id
      });
    }
    for (const sample of record.samples) {
      minWavelengthM = Math.min(minWavelengthM, sample.wavelengthM);
      maxWavelengthM = Math.max(maxWavelengthM, sample.wavelengthM);
      if (sample.refractiveIndex.k < 0) {
        warnings.push({
          code: "maxwell.materialCatalog.negativeExtinction",
          message: `${record.label} contains negative extinction coefficient k.`,
          elementId: record.id
        });
      }
    }
  }

  if (diagnosticRecordCount > 0) {
    warnings.push({
      code: "maxwell.materialCatalog.diagnosticRecords",
      message: `${diagnosticRecordCount} material records are diagnostic placeholders, not sourced optical constants.`
    });
  }

  const wavelengthRangeM = sampleCount === 0 ? null : ([minWavelengthM, maxWavelengthM] as [number, number]);
  const resultHash = fnv1a64(
    stableStringify({
      analysisId: "analysis.maxwell.l5.phase3.materialCatalogAudit",
      id,
      records: records.map(recordForHash),
      warnings: warnings.map((warning) => warning.code)
    })
  );

  return {
    id,
    type: "maxwellMaterialCatalogAudit",
    analysisId: "analysis.maxwell.l5.phase3.materialCatalogAudit",
    recordCount: records.length,
    sampleCount,
    familyCounts,
    wavelengthRangeM,
    diagnosticRecordCount,
    sourcedRecordCount,
    warnings: uniqueWarnings(warnings),
    resultHash
  };
}

export function createMaterialImportTemplate(): MaterialImportPackage {
  return {
    schema: "emmicro.materials.v1",
    id: "user-material-pack",
    label: "User spectral material pack",
    records: [
      {
        id: "custom-mgf2",
        label: "Custom MgF2 coating",
        family: "coating",
        wavelengthUnit: "nm",
        source: {
          name: "Replace with source name",
          reference: "Replace with paper, vendor data sheet, or measurement run id",
          url: "https://example.com/material-source",
          license: "Replace with data license",
          retrievedAt: "2026-06-04"
        },
        notes: ["Example schema only; replace values before use."],
        samples: [
          { wavelength: 400, n: 1.386, k: 0 },
          { wavelength: 550, n: 1.38, k: 0 },
          { wavelength: 700, n: 1.376, k: 0 }
        ]
      }
    ]
  };
}

function importedRecord(record: MaterialImportRecord, warnings: SolverWarning[]): SpectralMaterialRecord {
  const wavelengthUnit = record.wavelengthUnit ?? "nm";
  const sourceLabel = sourceSummary(record.source);
  if (!record.source.url && !record.source.doi && !record.source.reference) {
    warnings.push({
      code: "maxwell.materialImport.weakSource",
      message: `${record.label} lacks URL, DOI, or reference metadata.`,
      elementId: record.id
    });
  }

  const samples = record.samples
    .map((sample) => importedSample(record, sample, wavelengthUnit, warnings))
    .sort((a, b) => a.wavelengthM - b.wavelengthM);
  validateDistinctWavelengths(record, samples);

  return {
    id: record.id,
    label: record.label,
    family: record.family,
    samples,
    source: sourceLabel,
    notes: [
      "Imported through L5.3 material import schema.",
      `Source name: ${record.source.name}`,
      ...(record.source.reference ? [`Reference: ${record.source.reference}`] : []),
      ...(record.source.doi ? [`DOI: ${record.source.doi}`] : []),
      ...(record.source.url ? [`URL: ${record.source.url}`] : []),
      ...(record.source.license ? [`License: ${record.source.license}`] : []),
      ...(record.source.retrievedAt ? [`Retrieved: ${record.source.retrievedAt}`] : []),
      ...(record.notes ?? [])
    ]
  };
}

function importedSample(
  record: MaterialImportRecord,
  sample: MaterialImportSample,
  wavelengthUnit: MaterialImportUnit,
  warnings: SolverWarning[]
): SpectralMaterialPoint {
  if ((sample.k ?? 0) < 0) {
    warnings.push({
      code: "maxwell.materialImport.negativeExtinctionClamped",
      message: `${record.label} sample at ${sample.wavelength} ${wavelengthUnit} had negative k; clamped to passive k=0.`,
      elementId: record.id
    });
  }

  return {
    wavelengthM: toMeters(sample.wavelength, wavelengthUnit),
    refractiveIndex: {
      n: sample.n,
      k: Math.max(0, sample.k ?? 0)
    }
  };
}

function validateDistinctWavelengths(record: MaterialImportRecord, samples: SpectralMaterialPoint[]): void {
  for (let i = 1; i < samples.length; i += 1) {
    const prev = samples[i - 1];
    const current = samples[i];
    if (!prev || !current) continue;
    if (Math.abs(prev.wavelengthM - current.wavelengthM) <= 1e-18) {
      throw new Error(`material '${record.id}' has duplicate wavelength sample ${(current.wavelengthM * 1e9).toFixed(6)} nm`);
    }
  }
}

function sourceSummary(source: MaterialImportSource): string {
  return [
    source.name,
    source.reference,
    source.doi ? `doi:${source.doi}` : undefined,
    source.url,
    source.license ? `license:${source.license}` : undefined,
    source.retrievedAt ? `retrieved:${source.retrievedAt}` : undefined
  ]
    .filter((part): part is string => part !== undefined && part.length > 0)
    .join("; ");
}

function toMeters(value: number, unit: MaterialImportUnit): number {
  if (unit === "m") return value;
  if (unit === "um") return value * 1e-6;
  return value * 1e-9;
}

function isDiagnosticRecord(record: SpectralMaterialRecord): boolean {
  const text = `${record.source} ${record.notes.join(" ")}`.toLowerCase();
  return text.includes("diagnostic") || text.includes("placeholder");
}

function recordForHash(record: SpectralMaterialRecord): unknown {
  return {
    id: record.id,
    label: record.label,
    family: record.family,
    source: record.source,
    notes: record.notes,
    samples: record.samples.map((sample) => ({
      wavelengthM: roundNumber(sample.wavelengthM),
      n: roundNumber(sample.refractiveIndex.n),
      k: roundNumber(sample.refractiveIndex.k)
    }))
  };
}

function materialImportProvenance(): MaterialImportResult["provenance"] {
  return {
    label: "L5.3 sourced spectral material import and provenance audit",
    limitations: [
      "Imports spectral n,k tables and source metadata only; it does not verify source correctness or licensing.",
      "Imported records are normalized for the planar Maxwell TMM material API but are not automatically used by editable coating stacks yet.",
      "Passivity checks clamp negative extinction coefficients; they do not validate Kramers-Kronig consistency or physical dispersion models.",
      "This is not a live refractiveindex.info integration, laboratory material fit, digital-twin calibration, or certified material database."
    ]
  };
}

function roundNumber(value: number): number {
  return Number(value.toPrecision(12));
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
