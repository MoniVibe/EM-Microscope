import { cmul, complex, type Complex } from "./complex";

export type ComplexRefractiveIndex = {
  n: number;
  k: number;
};

export type MaxwellMaterialSample = {
  id: string;
  label: string;
  refractiveIndex: ComplexRefractiveIndex;
  relativePermeability?: Complex;
  wavelengthRangeM?: [number, number];
  source?: string;
  catalogMaterialId?: string;
  sourceRecordId?: string;
  sourcePackId?: string;
  sourcePackHash?: string;
  materialHash?: string;
  provenanceNotes?: string[];
};

export function complexIndex(sample: MaxwellMaterialSample): Complex {
  return complex(sample.refractiveIndex.n, sample.refractiveIndex.k);
}

export function relativePermittivityFromIndex(index: ComplexRefractiveIndex): Complex {
  return cmul(complex(index.n, index.k), complex(index.n, index.k));
}

export function absorptionCoefficientPerM(index: ComplexRefractiveIndex, wavelengthM: number): number {
  if (wavelengthM <= 0 || !Number.isFinite(wavelengthM)) throw new Error("wavelength must be positive");
  return (4 * Math.PI * Math.max(0, index.k)) / wavelengthM;
}

export const l4MaterialSamples = {
  air: {
    id: "air",
    label: "Air",
    refractiveIndex: { n: 1, k: 0 },
    source: "constant diagnostic sample"
  },
  bk7: {
    id: "bk7-587nm",
    label: "BK7 glass n=1.5168",
    refractiveIndex: { n: 1.5168, k: 0 },
    source: "constant diagnostic sample near 587 nm"
  },
  mgf2: {
    id: "mgf2-550nm",
    label: "MgF2 n=1.38",
    refractiveIndex: { n: 1.38, k: 0 },
    source: "constant diagnostic sample near 550 nm"
  },
  tio2: {
    id: "tio2-550nm",
    label: "TiO2 n=2.35",
    refractiveIndex: { n: 2.35, k: 0 },
    source: "constant diagnostic sample near 550 nm"
  },
  sio2: {
    id: "sio2-550nm",
    label: "SiO2 n=1.46",
    refractiveIndex: { n: 1.46, k: 0 },
    source: "constant diagnostic sample near 550 nm"
  },
  chromiumLossy: {
    id: "chromium-lossy-550nm",
    label: "Lossy chromium-like film",
    refractiveIndex: { n: 3.1, k: 3.3 },
    source: "constant diagnostic absorber sample"
  }
} satisfies Record<string, MaxwellMaterialSample>;
