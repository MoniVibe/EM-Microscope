import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import type { MaterialImportResult } from "./materialImport";
import type { ComplexRefractiveIndex, MaxwellMaterialSample } from "./materials";

export type SpectralMaterialPoint = {
  wavelengthM: number;
  refractiveIndex: ComplexRefractiveIndex;
};

export type SpectralMaterialRecord = {
  id: string;
  label: string;
  family: "ambient" | "dielectric" | "coating" | "absorber" | "semiconductor";
  samples: SpectralMaterialPoint[];
  source: string;
  notes: string[];
};

export type MaterialCatalogEntry = SpectralMaterialRecord & {
  origin: "builtIn" | "imported";
  sourceRecordId: string;
  sourcePackId?: string;
  sourcePackLabel?: string;
  sourcePackHash?: string;
  materialHash: string;
  warnings: SolverWarning[];
};

export type MaterialCatalogReference = {
  materialId: string;
  label: string;
  origin: MaterialCatalogEntry["origin"];
  sourceRecordId: string;
  sourcePackId?: string;
  sourcePackHash?: string;
  materialHash: string;
};

export type MaxwellMaterialCatalog = {
  id: string;
  type: "maxwellMaterialCatalog";
  analysisId: "analysis.maxwell.l5.phase4.materialCatalog";
  materials: MaterialCatalogEntry[];
  warnings: SolverWarning[];
  resultHash: string;
};

export type MaterialCatalogInput = {
  id?: string;
  imports?: MaterialImportResult[];
};

export type MaterialResolutionOptions = {
  extrapolation?: "block" | "clamp";
};

export type SpectralMaterialLookup = {
  material: MaxwellMaterialSample;
  interpolation: "exact" | "linear" | "clampedLow" | "clampedHigh";
  lowerWavelengthM: number;
  upperWavelengthM: number;
  warnings: SolverWarning[];
};

export type CatalogMaterialLookup = SpectralMaterialLookup & {
  entry: MaterialCatalogEntry;
  reference: MaterialCatalogReference;
};

export const l4SpectralMaterialCatalog = {
  air: spectralMaterial("air", "Air", "ambient", [
    [400, 1, 0],
    [550, 1, 0],
    [700, 1, 0]
  ]),
  bk7: spectralMaterial(
    "bk7",
    "BK7 glass",
    "dielectric",
    [
      [400, 1.5308, 0],
      [486.1, 1.5224, 0],
      [550, 1.5185, 0],
      [587.6, 1.5168, 0],
      [656.3, 1.5143, 0],
      [700, 1.5131, 0]
    ],
    "diagnostic BK7-like visible dispersion samples"
  ),
  mgf2: spectralMaterial(
    "mgf2",
    "MgF2 coating",
    "coating",
    [
      [400, 1.386, 0],
      [550, 1.38, 0],
      [700, 1.376, 0]
    ],
    "diagnostic MgF2-like coating samples"
  ),
  sio2: spectralMaterial(
    "sio2",
    "SiO2 coating",
    "coating",
    [
      [400, 1.47, 0],
      [550, 1.46, 0],
      [700, 1.455, 0]
    ],
    "diagnostic fused-silica-like coating samples"
  ),
  tio2: spectralMaterial(
    "tio2",
    "TiO2 high-index coating",
    "coating",
    [
      [400, 2.65, 0],
      [550, 2.35, 0],
      [700, 2.25, 0]
    ],
    "diagnostic TiO2-like high-index coating samples"
  ),
  chromiumLossy: spectralMaterial(
    "chromiumLossy",
    "Lossy chromium-like film",
    "absorber",
    [
      [400, 2.8, 3.1],
      [550, 3.1, 3.3],
      [700, 3.4, 3.6]
    ],
    "diagnostic lossy-metal film samples"
  ),
  silicon: spectralMaterial(
    "silicon",
    "Silicon absorber",
    "semiconductor",
    [
      [400, 5.57, 0.39],
      [550, 4.14, 0.045],
      [700, 3.78, 0.012]
    ],
    "diagnostic silicon absorption samples for future sensor-stack checks"
  )
} satisfies Record<string, SpectralMaterialRecord>;

export type L4SpectralMaterialId = keyof typeof l4SpectralMaterialCatalog;

export function listL4SpectralMaterials(): SpectralMaterialRecord[] {
  return Object.values(l4SpectralMaterialCatalog);
}

export function getL4SpectralMaterial(materialId: string): SpectralMaterialRecord {
  const record = l4SpectralMaterialCatalog[materialId as L4SpectralMaterialId];
  if (!record) throw new Error(`unknown L4 spectral material '${materialId}'`);
  return record;
}

export function createMaterialCatalog(input: MaterialCatalogInput = {}): MaxwellMaterialCatalog {
  const materials: MaterialCatalogEntry[] = [
    ...listL4SpectralMaterials().map((record) => builtInCatalogEntry(record)),
    ...(input.imports ?? []).flatMap((importResult) => importResult.records.map((record) => importedCatalogEntry(record, importResult)))
  ];
  const warnings = catalogWarnings(materials, input.imports ?? []);
  const resultHash = fnv1a64(
    stableStringify({
      analysisId: "analysis.maxwell.l5.phase4.materialCatalog",
      id: input.id ?? "l54-material-catalog",
      materials: materials.map((material) => materialForHash(material)),
      warningCodes: warnings.map((warning) => warning.code)
    })
  );

  return {
    id: input.id ?? "l54-material-catalog",
    type: "maxwellMaterialCatalog",
    analysisId: "analysis.maxwell.l5.phase4.materialCatalog",
    materials,
    warnings: uniqueWarnings(warnings),
    resultHash
  };
}

export const l54BuiltInMaterialCatalog = createMaterialCatalog({ id: "l54-built-in-material-catalog" });

export function listCatalogMaterials(catalog: MaxwellMaterialCatalog = l54BuiltInMaterialCatalog): MaterialCatalogEntry[] {
  return catalog.materials;
}

export function getCatalogMaterial(materialId: string, catalog: MaxwellMaterialCatalog = l54BuiltInMaterialCatalog): MaterialCatalogEntry {
  const material = catalog.materials.find((candidate) => candidate.id === materialId);
  if (!material) {
    throw new Error(
      `coating design references material '${materialId}', but that material is not loaded. Import the original material pack or replace the material.`
    );
  }
  return material;
}

export function materialCatalogReference(material: MaterialCatalogEntry): MaterialCatalogReference {
  return {
    materialId: material.id,
    label: material.label,
    origin: material.origin,
    sourceRecordId: material.sourceRecordId,
    sourcePackId: material.sourcePackId,
    sourcePackHash: material.sourcePackHash,
    materialHash: material.materialHash
  };
}

export function materialCatalogReferencesForIds(
  materialIds: string[],
  catalog: MaxwellMaterialCatalog = l54BuiltInMaterialCatalog
): MaterialCatalogReference[] {
  const seen = new Set<string>();
  const references: MaterialCatalogReference[] = [];
  for (const materialId of materialIds) {
    if (seen.has(materialId)) continue;
    seen.add(materialId);
    references.push(materialCatalogReference(getCatalogMaterial(materialId, catalog)));
  }
  return references;
}

export function sampleCatalogMaterial(
  materialId: string,
  wavelengthM: number,
  catalog: MaxwellMaterialCatalog = l54BuiltInMaterialCatalog,
  options: MaterialResolutionOptions = {}
): CatalogMaterialLookup {
  const entry = getCatalogMaterial(materialId, catalog);
  const lookup = sampleSpectralMaterial(entry, wavelengthM);
  const outOfRange = lookup.interpolation === "clampedLow" || lookup.interpolation === "clampedHigh";
  if (entry.origin === "imported" && outOfRange && options.extrapolation !== "clamp") {
    throw new Error(
      `material '${entry.label}' (${entry.id}) has no sample at ${(wavelengthM * 1e9).toFixed(1)} nm; import a material pack covering that wavelength or replace the material.`
    );
  }
  const warnings = uniqueWarnings([...entry.warnings, ...lookup.warnings]);
  return {
    ...lookup,
    material: {
      ...lookup.material,
      catalogMaterialId: entry.id,
      sourceRecordId: entry.sourceRecordId,
      sourcePackId: entry.sourcePackId,
      sourcePackHash: entry.sourcePackHash,
      materialHash: entry.materialHash,
      provenanceNotes: entry.notes,
      source: materialSourceWithReceipt(entry)
    },
    warnings,
    entry,
    reference: materialCatalogReference(entry)
  };
}

export function sampleSpectralMaterial(record: SpectralMaterialRecord, wavelengthM: number): SpectralMaterialLookup {
  if (wavelengthM <= 0 || !Number.isFinite(wavelengthM)) throw new Error("material lookup wavelength must be positive");
  const samples = sortedSamples(record);
  const first = samples[0];
  const last = samples[samples.length - 1];
  if (!first || !last) throw new Error(`material '${record.id}' must include at least one spectral sample`);

  const warnings: SolverWarning[] = [];
  let lower = first;
  let upper = last;
  let interpolation: SpectralMaterialLookup["interpolation"] = "linear";

  const exact = samples.find((sample) => Math.abs(sample.wavelengthM - wavelengthM) <= 1e-15);
  if (exact) {
    lower = exact;
    upper = exact;
    interpolation = "exact";
  } else if (wavelengthM < first.wavelengthM) {
    lower = first;
    upper = first;
    interpolation = "clampedLow";
    warnings.push({
      code: "maxwell.material.wavelengthClamped",
      message: `${record.label} has no sample at ${(wavelengthM * 1e9).toFixed(1)} nm; clamped to ${(first.wavelengthM * 1e9).toFixed(1)} nm.`
    });
  } else if (wavelengthM > last.wavelengthM) {
    lower = last;
    upper = last;
    interpolation = "clampedHigh";
    warnings.push({
      code: "maxwell.material.wavelengthClamped",
      message: `${record.label} has no sample at ${(wavelengthM * 1e9).toFixed(1)} nm; clamped to ${(last.wavelengthM * 1e9).toFixed(1)} nm.`
    });
  } else {
    for (let i = 0; i < samples.length - 1; i += 1) {
      const a = samples[i];
      const b = samples[i + 1];
      if (!a || !b) continue;
      if (a.wavelengthM <= wavelengthM && wavelengthM <= b.wavelengthM) {
        lower = a;
        upper = b;
        break;
      }
    }
  }

  const refractiveIndex = interpolateIndex(lower, upper, wavelengthM);
  if (refractiveIndex.k < 0) {
    warnings.push({
      code: "maxwell.material.negativeExtinction",
      message: `${record.label} produced negative extinction coefficient k; clamped to passive k=0.`
    });
  }

  return {
    material: {
      id: `${record.id}@${Math.round(wavelengthM * 1e9)}nm`,
      label: record.label,
      refractiveIndex: {
        n: refractiveIndex.n,
        k: Math.max(0, refractiveIndex.k)
      },
      wavelengthRangeM: [first.wavelengthM, last.wavelengthM],
      source: record.source
    },
    interpolation,
    lowerWavelengthM: lower.wavelengthM,
    upperWavelengthM: upper.wavelengthM,
    warnings
  };
}

function spectralMaterial(
  id: string,
  label: string,
  family: SpectralMaterialRecord["family"],
  rows: Array<[number, number, number]>,
  source = "built-in diagnostic spectral samples; not an authoritative material database"
): SpectralMaterialRecord {
  return {
    id,
    label,
    family,
    samples: rows.map(([wavelengthNm, n, k]) => ({
      wavelengthM: wavelengthNm * 1e-9,
      refractiveIndex: { n, k }
    })),
    source,
    notes: [
      "Use as Phase 0/1 diagnostics only.",
      "Replace with sourced wavelength-dependent material records before scientific use."
    ]
  };
}

function builtInCatalogEntry(record: SpectralMaterialRecord): MaterialCatalogEntry {
  const materialHash = fnv1a64(stableStringify(materialForHash(record)));
  return {
    ...cloneRecord(record),
    origin: "builtIn",
    sourceRecordId: record.id,
    materialHash,
    warnings: []
  };
}

function importedCatalogEntry(record: SpectralMaterialRecord, importResult: MaterialImportResult): MaterialCatalogEntry {
  const materialHash = fnv1a64(stableStringify(materialForHash(record)));
  const id = `material:${importResult.resultHash}:${materialHash}`;
  return {
    ...cloneRecord(record),
    id,
    origin: "imported",
    sourceRecordId: record.id,
    sourcePackId: importResult.id,
    sourcePackLabel: importResult.label,
    sourcePackHash: importResult.resultHash,
    materialHash,
    warnings: importResult.warnings
      .filter((warning) => warning.elementId === record.id)
      .map((warning) => ({
        ...warning,
        elementId: id
      }))
  };
}

function catalogWarnings(materials: MaterialCatalogEntry[], imports: MaterialImportResult[]): SolverWarning[] {
  const warnings: SolverWarning[] = imports.flatMap((importResult) => importResult.warnings);
  const ids = new Set<string>();
  const labels = new Map<string, MaterialCatalogEntry>();
  for (const material of materials) {
    if (ids.has(material.id)) {
      warnings.push({
        code: "maxwell.materialCatalog.duplicateId",
        message: `Material catalog contains duplicate material id '${material.id}'.`,
        elementId: material.id
      });
    }
    ids.add(material.id);

    const labelKey = material.label.toLocaleLowerCase();
    const existing = labels.get(labelKey);
    if (existing) {
      warnings.push({
        code: "maxwell.materialCatalog.duplicateLabel",
        message: `Material label '${material.label}' appears multiple times; stable material IDs disambiguate the selections.`,
        elementId: material.id
      });
    } else {
      labels.set(labelKey, material);
    }
  }
  return warnings;
}

function sortedSamples(record: SpectralMaterialRecord): SpectralMaterialPoint[] {
  return [...record.samples].sort((a, b) => a.wavelengthM - b.wavelengthM);
}

function interpolateIndex(lower: SpectralMaterialPoint, upper: SpectralMaterialPoint, wavelengthM: number): ComplexRefractiveIndex {
  if (lower.wavelengthM === upper.wavelengthM) return lower.refractiveIndex;
  const t = (wavelengthM - lower.wavelengthM) / (upper.wavelengthM - lower.wavelengthM);
  return {
    n: lower.refractiveIndex.n + (upper.refractiveIndex.n - lower.refractiveIndex.n) * t,
    k: lower.refractiveIndex.k + (upper.refractiveIndex.k - lower.refractiveIndex.k) * t
  };
}

function cloneRecord(record: SpectralMaterialRecord): SpectralMaterialRecord {
  return {
    ...record,
    samples: record.samples.map((sample) => ({
      wavelengthM: sample.wavelengthM,
      refractiveIndex: { ...sample.refractiveIndex }
    })),
    notes: [...record.notes]
  };
}

function materialSourceWithReceipt(entry: MaterialCatalogEntry): string {
  return [
    entry.source,
    `materialId:${entry.id}`,
    `materialHash:${entry.materialHash}`,
    entry.sourcePackHash ? `sourcePackHash:${entry.sourcePackHash}` : undefined
  ]
    .filter((part): part is string => part !== undefined)
    .join("; ");
}

function materialForHash(record: SpectralMaterialRecord): unknown {
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
