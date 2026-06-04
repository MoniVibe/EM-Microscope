import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import {
  l54BuiltInMaterialCatalog,
  materialCatalogReferencesForIds,
  sampleCatalogMaterial,
  type MaterialCatalogReference,
  type MaterialResolutionOptions,
  type MaxwellMaterialCatalog
} from "./materialCatalog";
import { runPlanarFieldMonitor, type PlanarFieldMonitorResult } from "./planarFieldMonitor";
import { runPlanarTmm, type MaxwellPolarization, type PlanarTmmInput, type PlanarTmmResult } from "./planarTmm";

export type CoatingStackLayer = {
  id: string;
  label: string;
  materialId: string;
  thicknessM: number;
};

export type CoatingStackDefinition = {
  id: string;
  label: string;
  wavelengthM: number;
  angleRad: number;
  polarization: MaxwellPolarization;
  incidentMaterialId: string;
  substrateMaterialId: string;
  layers: CoatingStackLayer[];
  tolerance?: number;
};

export type CoatingStackRunResult = {
  id: string;
  type: "l4CoatingStackPlanarTmm";
  analysisId: "analysis.maxwell.l4.phase1.coatingStackPlanarTmm";
  label: string;
  materialCatalogRefs: MaterialCatalogReference[];
  compiledInput: PlanarTmmInput;
  tmm: PlanarTmmResult;
  fieldMonitor: PlanarFieldMonitorResult;
  warnings: SolverWarning[];
  resultHash: string;
  provenance: {
    label: "L4.1 wavelength-dependent material coating stack compiled to planar Maxwell TMM";
    limitations: string[];
  };
};

export type CoatingStackRunOptions = {
  materialCatalog?: MaxwellMaterialCatalog;
  materialResolution?: MaterialResolutionOptions;
};

export type SerializedCoatingStackDesign = {
  schema: "emmicro.coatingStack.v1";
  stack: CoatingStackDefinition;
  materialCatalogRefs: MaterialCatalogReference[];
  resultHash: string;
};

export type CoatingSweepDefinition = {
  startWavelengthM: number;
  endWavelengthM: number;
  sampleCount: number;
};

export type CoatingSweepSample = {
  wavelengthM: number;
  reflectance: number;
  transmittance: number;
  absorbance: number;
  energyBalanceError: number;
  resultHash: string;
};

export type CoatingSweepResult = {
  id: string;
  type: "l4CoatingStackWavelengthSweep";
  analysisId: "analysis.maxwell.l4.phase1.coatingStackSweep";
  label: string;
  sweep: CoatingSweepDefinition;
  samples: CoatingSweepSample[];
  reflectanceMin: number;
  reflectanceMax: number;
  transmittanceMin: number;
  absorbanceMax: number;
  warnings: SolverWarning[];
  resultHash: string;
  provenance: CoatingStackRunResult["provenance"];
};

export const l41DefaultCoatingStack: CoatingStackDefinition = {
  id: "l41-editable-ar-stack",
  label: "L4.1 editable AR coating stack",
  wavelengthM: 550e-9,
  angleRad: 0,
  polarization: "TE",
  incidentMaterialId: "air",
  substrateMaterialId: "bk7",
  layers: [
    {
      id: "mgf2-quarter-wave",
      label: "MgF2 quarter-wave layer",
      materialId: "mgf2",
      thicknessM: 550e-9 / (4 * 1.38)
    }
  ]
};

export function compileCoatingStackToPlanarTmm(
  stack: CoatingStackDefinition,
  wavelengthM = stack.wavelengthM,
  options: CoatingStackRunOptions = {}
): { input: PlanarTmmInput; warnings: SolverWarning[]; materialCatalogRefs: MaterialCatalogReference[] } {
  const catalog = options.materialCatalog ?? l54BuiltInMaterialCatalog;
  const warnings = validateCoatingStack(stack, wavelengthM);
  warnings.push(...catalog.warnings);
  ensureCoatingStackMaterialsLoaded(stack, catalog);

  const incident = sampleCatalogMaterial(stack.incidentMaterialId, wavelengthM, catalog, options.materialResolution);
  const substrate = sampleCatalogMaterial(stack.substrateMaterialId, wavelengthM, catalog, options.materialResolution);
  warnings.push(...incident.warnings, ...substrate.warnings);

  const layers = stack.layers.map((layer) => {
    const material = sampleCatalogMaterial(layer.materialId, wavelengthM, catalog, options.materialResolution);
    warnings.push(...material.warnings.map((warning) => ({ ...warning, elementId: layer.id })));
    return {
      id: layer.id,
      label: layer.label,
      material: material.material,
      thicknessM: layer.thicknessM
    };
  });

  return {
    input: {
      id: `${stack.id}@${Math.round(wavelengthM * 1e9)}nm`,
      label: stack.label,
      wavelengthM,
      angleRad: stack.angleRad,
      polarization: stack.polarization,
      incidentMedium: incident.material,
      substrateMedium: substrate.material,
      layers,
      tolerance: stack.tolerance
    },
    warnings: uniqueWarnings(warnings),
    materialCatalogRefs: materialCatalogRefsForStack(stack, catalog)
  };
}

export function runCoatingStack(stack: CoatingStackDefinition, options: CoatingStackRunOptions = {}): CoatingStackRunResult {
  const compiled = compileCoatingStackToPlanarTmm(stack, stack.wavelengthM, options);
  const tmm = runPlanarTmm(compiled.input);
  const fieldMonitor = runPlanarFieldMonitor(compiled.input, tmm);
  const warnings = uniqueWarnings([...compiled.warnings, ...tmm.warnings, ...fieldMonitor.warnings]);
  const resultHash = fnv1a64(
    stableStringify({
      analysisId: "analysis.maxwell.l4.phase1.coatingStackPlanarTmm",
      stack: hashableStack(stack),
      materialCatalogRefs: compiled.materialCatalogRefs,
      tmmHash: tmm.resultHash,
      fieldMonitorHash: fieldMonitor.resultHash,
      warningCodes: warnings.map((warning) => warning.code)
    })
  );

  return {
    id: stack.id,
    type: "l4CoatingStackPlanarTmm",
    analysisId: "analysis.maxwell.l4.phase1.coatingStackPlanarTmm",
    label: stack.label,
    materialCatalogRefs: compiled.materialCatalogRefs,
    compiledInput: compiled.input,
    tmm,
    fieldMonitor,
    warnings,
    resultHash,
    provenance: coatingStackProvenance()
  };
}

export function runCoatingSweep(stack: CoatingStackDefinition, sweep: CoatingSweepDefinition, options: CoatingStackRunOptions = {}): CoatingSweepResult {
  validateSweep(sweep);
  const samples: CoatingSweepSample[] = [];
  const warnings: SolverWarning[] = [];

  for (let i = 0; i < sweep.sampleCount; i += 1) {
    const wavelengthM =
      sweep.sampleCount === 1 ? sweep.startWavelengthM : sweep.startWavelengthM + ((sweep.endWavelengthM - sweep.startWavelengthM) * i) / (sweep.sampleCount - 1);
    const run = runCoatingStack({ ...stack, wavelengthM }, options);
    warnings.push(...run.warnings);
    samples.push({
      wavelengthM,
      reflectance: run.tmm.reflectance,
      transmittance: run.tmm.transmittance,
      absorbance: run.tmm.absorbance,
      energyBalanceError: run.tmm.energyBalanceError,
      resultHash: run.resultHash
    });
  }

  const reflectanceValues = samples.map((sample) => sample.reflectance);
  const transmittanceValues = samples.map((sample) => sample.transmittance);
  const absorbanceValues = samples.map((sample) => sample.absorbance);
  const resultHash = fnv1a64(
    stableStringify({
      analysisId: "analysis.maxwell.l4.phase1.coatingStackSweep",
      stack: hashableStack(stack),
      sweep,
      samples: samples.map((sample) => ({
        wavelengthM: roundNumber(sample.wavelengthM),
        r: roundNumber(sample.reflectance),
        t: roundNumber(sample.transmittance),
        a: roundNumber(sample.absorbance)
      }))
    })
  );

  return {
    id: `${stack.id}-sweep`,
    type: "l4CoatingStackWavelengthSweep",
    analysisId: "analysis.maxwell.l4.phase1.coatingStackSweep",
    label: `${stack.label} wavelength sweep`,
    sweep,
    samples,
    reflectanceMin: Math.min(...reflectanceValues),
    reflectanceMax: Math.max(...reflectanceValues),
    transmittanceMin: Math.min(...transmittanceValues),
    absorbanceMax: Math.max(...absorbanceValues),
    warnings: uniqueWarnings(warnings),
    resultHash,
    provenance: coatingStackProvenance()
  };
}

export function serializeCoatingStackDesign(
  stack: CoatingStackDefinition,
  catalog: MaxwellMaterialCatalog = l54BuiltInMaterialCatalog
): SerializedCoatingStackDesign {
  ensureCoatingStackMaterialsLoaded(stack, catalog);
  const materialCatalogRefs = materialCatalogRefsForStack(stack, catalog);
  const resultHash = fnv1a64(
    stableStringify({
      schema: "emmicro.coatingStack.v1",
      stack: hashableStack(stack),
      materialCatalogRefs
    })
  );
  return {
    schema: "emmicro.coatingStack.v1",
    stack: cloneStack(stack),
    materialCatalogRefs,
    resultHash
  };
}

export function deserializeCoatingStackDesign(
  design: SerializedCoatingStackDesign,
  catalog: MaxwellMaterialCatalog = l54BuiltInMaterialCatalog
): CoatingStackDefinition {
  if (design.schema !== "emmicro.coatingStack.v1") throw new Error("unsupported coating stack design schema");
  for (const reference of design.materialCatalogRefs) {
    try {
      const current = materialCatalogReferencesForIds([reference.materialId], catalog)[0];
      if (!current) throw new Error("missing");
      if (current.materialHash !== reference.materialHash) {
        throw new Error(`material '${reference.materialId}' hash changed; expected ${reference.materialHash}, found ${current.materialHash}`);
      }
    } catch (error) {
      if ((error as Error).message.includes("hash changed")) throw error;
      throw new Error(
        `Design references imported material ${reference.materialId}, but that material pack is not loaded. Import the original material pack or replace the material.`
      );
    }
  }
  ensureCoatingStackMaterialsLoaded(design.stack, catalog);
  return cloneStack(design.stack);
}

function validateCoatingStack(stack: CoatingStackDefinition, wavelengthM: number): SolverWarning[] {
  if (wavelengthM <= 0 || !Number.isFinite(wavelengthM)) throw new Error("coating stack wavelength must be positive");
  if (!Number.isFinite(stack.angleRad) || Math.abs(stack.angleRad) >= Math.PI / 2) throw new Error("coating stack angle must be finite and below grazing incidence");
  const warnings: SolverWarning[] = [
    {
      code: "maxwell.coatingStack.planarTmmOnly",
      message: "L4.1 coating stacks compile to a planar Maxwell TMM special case only; this is not a general 3D Maxwell solver."
    }
  ];
  for (const layer of stack.layers) {
    if (layer.thicknessM <= 0 || !Number.isFinite(layer.thicknessM)) throw new Error(`coating stack layer ${layer.id} thickness must be positive`);
    if (layer.thicknessM < wavelengthM / 5000) {
      warnings.push({
        code: "maxwell.coatingStack.layerVeryThin",
        message: `${layer.label} is thinner than wavelength/5000; verify physical layer thickness.`,
        elementId: layer.id
      });
    }
  }
  return warnings;
}

function ensureCoatingStackMaterialsLoaded(stack: CoatingStackDefinition, catalog: MaxwellMaterialCatalog): void {
  materialCatalogRefsForStack(stack, catalog);
}

function materialCatalogRefsForStack(stack: CoatingStackDefinition, catalog: MaxwellMaterialCatalog): MaterialCatalogReference[] {
  return materialCatalogReferencesForIds(
    [stack.incidentMaterialId, stack.substrateMaterialId, ...stack.layers.map((layer) => layer.materialId)],
    catalog
  );
}

function cloneStack(stack: CoatingStackDefinition): CoatingStackDefinition {
  return {
    ...stack,
    layers: stack.layers.map((layer) => ({ ...layer }))
  };
}

function validateSweep(sweep: CoatingSweepDefinition): void {
  if (sweep.sampleCount < 1 || !Number.isInteger(sweep.sampleCount)) throw new Error("coating sweep sampleCount must be a positive integer");
  if (sweep.startWavelengthM <= 0 || sweep.endWavelengthM <= 0) throw new Error("coating sweep wavelengths must be positive");
  if (sweep.endWavelengthM < sweep.startWavelengthM) throw new Error("coating sweep end wavelength must be >= start wavelength");
}

function coatingStackProvenance(): CoatingStackRunResult["provenance"] {
  return {
    label: "L4.1 wavelength-dependent material coating stack compiled to planar Maxwell TMM",
    limitations: [
      "Solves planar coating stacks only through the existing frequency-domain Maxwell TMM path.",
      "This is not a general 3D Maxwell solver; not FEM, BEM, RCWA, FDTD, curved optics, arbitrary CAD, aperture diffraction, or sensor-stack simulation.",
      "Built-in spectral material records are diagnostic samples, not an authoritative imported material database.",
      "Layer absorption is estimated from planar field-monitor flux drops, not full volumetric absorption density."
    ]
  };
}

function hashableStack(stack: CoatingStackDefinition): unknown {
  return {
    id: stack.id,
    wavelengthM: roundNumber(stack.wavelengthM),
    angleRad: roundNumber(stack.angleRad),
    polarization: stack.polarization,
    incidentMaterialId: stack.incidentMaterialId,
    substrateMaterialId: stack.substrateMaterialId,
    layers: stack.layers.map((layer) => ({
      id: layer.id,
      materialId: layer.materialId,
      thicknessM: roundNumber(layer.thicknessM)
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
