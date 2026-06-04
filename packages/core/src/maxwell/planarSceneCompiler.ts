import type { CoatingStackDefinition, CoatingStackRunOptions } from "./coatingStack";
import type { MaxwellPolarization } from "./planarTmm";
import type { MaxwellProblemPolarization, PlanarStackProblem } from "./maxwellProblem";

export type PlanarStackProblemCompileOptions = {
  materialCatalogHash?: string;
  createdAt?: string;
};

export function compileCoatingStackToPlanarStackProblem(
  stack: CoatingStackDefinition,
  options: PlanarStackProblemCompileOptions | CoatingStackRunOptions = {}
): PlanarStackProblem {
  const materialCatalogHash = "materialCatalogHash" in options ? options.materialCatalogHash : "materialCatalog" in options ? options.materialCatalog?.resultHash : undefined;
  return {
    id: `${stack.id}-planar-tmm-problem`,
    kind: "planar-stack",
    backendId: "planar-tmm",
    version: "emmicro.maxwell.problem.v1",
    createdAt: "createdAt" in options ? options.createdAt : undefined,
    materialCatalogHash,
    source: {
      kind: "plane-wave",
      wavelengthNm: stack.wavelengthM * 1e9,
      angleDeg: radToDeg(stack.angleRad),
      polarization: problemPolarizationFromStack(stack.polarization)
    },
    monitors: [{ id: "planar-field-monitor", kind: "planar-field", label: "Planar field monitor" }],
    provenance: {
      label: "L5.8 coating stack compiled to solver-neutral planar stack problem",
      sourceStackId: stack.id,
      sourceStackLabel: stack.label,
      limitations: [
        "Compiles planar coating stacks only.",
        "Targets the PlanarTmmBackend frequency-domain multilayer transfer-matrix special case.",
        "This is not a 3D Maxwell, FEM, FDTD, BEM, RCWA, aperture, curved-surface, CAD, digital-twin, or sensor-stack problem."
      ]
    },
    stack: {
      label: stack.label,
      incidentMaterialId: stack.incidentMaterialId,
      substrateMaterialId: stack.substrateMaterialId,
      layers: stack.layers.map((layer) => ({
        id: layer.id,
        label: layer.label,
        materialId: layer.materialId,
        thicknessNm: layer.thicknessM * 1e9
      }))
    },
    sweep: {
      wavelengthsNm: [stack.wavelengthM * 1e9],
      angleDeg: radToDeg(stack.angleRad),
      polarization: problemPolarizationFromStack(stack.polarization)
    }
  };
}

export function coatingStackFromPlanarStackProblem(
  problem: PlanarStackProblem,
  wavelengthNm = problem.sweep.wavelengthsNm[0] ?? problem.source.wavelengthNm ?? 550,
  polarization: Exclude<MaxwellProblemPolarization, "unpolarized"> = problem.sweep.polarization === "tm" ? "tm" : "te"
): CoatingStackDefinition {
  return {
    id: problem.provenance.sourceStackId ?? problem.id,
    label: problem.provenance.sourceStackLabel ?? problem.stack.label,
    wavelengthM: wavelengthNm * 1e-9,
    angleRad: degToRad(problem.sweep.angleDeg),
    polarization: stackPolarizationFromProblem(polarization),
    incidentMaterialId: problem.stack.incidentMaterialId,
    substrateMaterialId: problem.stack.substrateMaterialId,
    layers: problem.stack.layers.map((layer) => ({
      id: layer.id,
      label: layer.label,
      materialId: layer.materialId,
      thicknessM: layer.thicknessNm * 1e-9
    }))
  };
}

export function problemPolarizationFromStack(polarization: MaxwellPolarization): MaxwellProblemPolarization {
  return polarization === "TM" ? "tm" : "te";
}

export function stackPolarizationFromProblem(polarization: Exclude<MaxwellProblemPolarization, "unpolarized">): MaxwellPolarization {
  return polarization === "tm" ? "TM" : "TE";
}

function radToDeg(value: number): number {
  return (value * 180) / Math.PI;
}

function degToRad(value: number): number {
  return (value * Math.PI) / 180;
}
