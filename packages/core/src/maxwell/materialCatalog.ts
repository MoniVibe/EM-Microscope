import type { SolverWarning } from "../solvers/Solver";
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

export type SpectralMaterialLookup = {
  material: MaxwellMaterialSample;
  interpolation: "exact" | "linear" | "clampedLow" | "clampedHigh";
  lowerWavelengthM: number;
  upperWavelengthM: number;
  warnings: SolverWarning[];
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
