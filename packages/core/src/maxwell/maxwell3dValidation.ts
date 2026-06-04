import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import {
  l54BuiltInMaterialCatalog,
  listCatalogMaterials,
  materialCatalogReference,
  materialCatalogReferencesForIds,
  type MaxwellMaterialCatalog
} from "./materialCatalog";
import type {
  MaxwellBoundary3D,
  MaxwellBoundarySide3D,
  MaxwellFieldComponent3D,
  MaxwellMonitor3D,
  MaxwellObject3D,
  MaxwellScene3D,
  MaxwellSource3D,
  MaxwellVec2,
  MaxwellVec3
} from "./maxwell3dTypes";
import type { MaxwellProblemValidation } from "./maxwellProblem";

const boundarySides: MaxwellBoundarySide3D[] = ["xmin", "xmax", "ymin", "ymax", "zmin", "zmax"];
const fieldComponents: MaxwellFieldComponent3D[] = ["Ex", "Ey", "Ez", "Hx", "Hy", "Hz"];

export type MaxwellScene3DCreateOptions = {
  id?: string;
  label?: string;
  materialCatalog?: MaxwellMaterialCatalog;
  backgroundMaterialId?: string;
  objectMaterialId?: string;
};

export function createMinimalMaxwellScene3D(options: MaxwellScene3DCreateOptions = {}): MaxwellScene3D {
  const catalog = options.materialCatalog ?? l54BuiltInMaterialCatalog;
  const backgroundMaterialId = options.backgroundMaterialId ?? "air";
  const objectMaterialId = options.objectMaterialId ?? "bk7";
  const materialRefs = materialCatalogReferencesForIds([backgroundMaterialId, objectMaterialId], catalog);
  const scene: MaxwellScene3D = {
    version: "emmicro.maxwell.scene3d.v1",
    id: options.id ?? "l60-minimal-fdtd-scaffold",
    label: options.label ?? "L6.0 minimal 3D FDTD scaffold scene",
    units: "um",
    backendId: "external-fdtd",
    domain: {
      size: [8, 8, 8],
      resolution: {
        pixelsPerWavelength: 16,
        voxelSize: [0.05, 0.05, 0.05]
      }
    },
    backgroundMaterialId,
    boundaries: [
      {
        kind: "pml",
        thickness: 1,
        sides: [...boundarySides]
      }
    ],
    objects: [
      {
        id: "sample-box",
        kind: "box",
        center: [0, 0, 0],
        size: [1.2, 1.2, 0.4],
        materialId: objectMaterialId
      }
    ],
    sources: [
      {
        id: "normal-plane-wave-550nm",
        kind: "plane-wave",
        wavelengthNm: 550,
        direction: [0, 0, -1],
        polarization: [1, 0, 0],
        amplitude: 1
      }
    ],
    monitors: [
      {
        id: "field-volume-center",
        kind: "field-volume",
        center: [0, 0, 0],
        size: [3, 3, 3],
        fields: ["Ex", "Ey", "Ez", "Hx", "Hy", "Hz"]
      },
      {
        id: "transmission-flux-plane",
        kind: "flux-plane",
        center: [0, 0, -2.5],
        size: [4, 4],
        normal: [0, 0, -1]
      }
    ],
    receipts: {
      materials: materialRefs,
      materialCatalogHash: catalog.resultHash,
      sceneHash: ""
    },
    provenance: maxwellScene3DProvenance()
  };

  return withMaxwellScene3DHash(scene);
}

export function validateMaxwellScene3D(scene: MaxwellScene3D, catalog: MaxwellMaterialCatalog = l54BuiltInMaterialCatalog): MaxwellProblemValidation {
  const errors: string[] = [];
  const warnings: SolverWarning[] = [
    {
      code: "maxwell.scene3d.schemaOnly",
      message: "L6.0 validates and exports 3D Maxwell scene manifests only; it does not execute 3D Maxwell solves in-app."
    }
  ];

  if (scene.version !== "emmicro.maxwell.scene3d.v1") errors.push("unsupported 3D Maxwell scene version");
  if (scene.backendId !== "external-fdtd") errors.push("3D Maxwell scenes in L6.0 require backendId 'external-fdtd'");
  if (!scene.id) errors.push("3D Maxwell scene id is required");
  if (!scene.label) errors.push("3D Maxwell scene label is required");
  if (!["nm", "um", "mm", "m"].includes(scene.units)) errors.push("3D Maxwell scene units must be nm, um, mm, or m");
  validatePositiveVec3(scene.domain?.size, "domain size", errors);
  if (scene.domain?.resolution?.pixelsPerWavelength !== undefined && !isPositiveFinite(scene.domain.resolution.pixelsPerWavelength)) {
    errors.push("domain resolution pixelsPerWavelength must be positive");
  }
  if (scene.domain?.resolution?.voxelSize !== undefined) validatePositiveVec3(scene.domain.resolution.voxelSize, "domain voxelSize", errors);
  if (!scene.backgroundMaterialId) errors.push("background material id is required");
  if (!scene.boundaries?.length) errors.push("at least one 3D boundary declaration is required");
  if (!scene.sources?.length) errors.push("at least one 3D source is required");
  if (!scene.monitors?.length) errors.push("at least one 3D monitor is required");

  validateMaterialReferences(scene, catalog, errors);
  scene.boundaries?.forEach((boundary, index) => validateBoundary(boundary, index, errors));
  scene.objects?.forEach((object, index) => validateObject(object, index, errors));
  scene.sources?.forEach((source, index) => validateSource(source, index, errors));
  scene.monitors?.forEach((monitor, index) => validateMonitor(monitor, index, errors));

  const expectedHash = hashMaxwellScene3D(scene);
  if (!scene.receipts?.sceneHash) {
    errors.push("3D Maxwell scene receipts.sceneHash is required");
  } else if (scene.receipts.sceneHash !== expectedHash) {
    errors.push(`3D Maxwell scene hash mismatch; expected ${expectedHash}, found ${scene.receipts.sceneHash}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export function hashMaxwellScene3D(scene: MaxwellScene3D): string {
  return fnv1a64(stableStringify(sceneForHash(scene)));
}

export function withMaxwellScene3DHash(scene: MaxwellScene3D): MaxwellScene3D {
  const clone = cloneScene(scene);
  clone.receipts = {
    ...clone.receipts,
    materials: clone.receipts.materials.map((reference) => ({ ...reference })),
    sceneHash: ""
  };
  clone.receipts.sceneHash = hashMaxwellScene3D(clone);
  return clone;
}

export function materialIdsInMaxwellScene3D(scene: MaxwellScene3D): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const materialId of [scene.backgroundMaterialId, ...scene.objects.map((object) => object.materialId)]) {
    if (!materialId || seen.has(materialId)) continue;
    seen.add(materialId);
    output.push(materialId);
  }
  return output;
}

export function serializeMaxwellScene3DManifest(scene: MaxwellScene3D): string {
  return stableStringify(scene);
}

export function deserializeMaxwellScene3DManifest(serialized: string): MaxwellScene3D {
  const parsed = JSON.parse(serialized) as MaxwellScene3D;
  if (parsed.version !== "emmicro.maxwell.scene3d.v1") throw new Error("unsupported 3D Maxwell scene manifest version");
  return parsed;
}

export function maxwellScene3DProvenance(): MaxwellScene3D["provenance"] {
  return {
    label: "L6.0 3D Maxwell schema/export scaffold",
    limitations: [
      "Schema and export scaffold only; no 3D Maxwell solve is executed in the browser.",
      "External FDTD is registered as scaffold-only/unavailable in L6.0.",
      "The Meep-style export is a script skeleton, not a validated executable solver workflow.",
      "No FEM, BEM, RCWA, CAD import, curved lenses, aperture diffraction solve, sensor transport, digital twin, adjoint optimization, or GPU/HPC job runner is implemented."
    ]
  };
}

function validateMaterialReferences(scene: MaxwellScene3D, catalog: MaxwellMaterialCatalog, errors: string[]): void {
  const materials = listCatalogMaterials(catalog);
  const byId = new Map(materials.map((material) => [material.id, material]));
  const byReceipt = new Map((scene.receipts?.materials ?? []).map((reference) => [reference.materialId, reference]));

  for (const materialId of materialIdsInMaxwellScene3D(scene)) {
    const material = byId.get(materialId);
    if (!material) {
      errors.push(`3D scene references unknown material '${materialId}'`);
      continue;
    }
    const receipt = byReceipt.get(materialId);
    if (!receipt) {
      errors.push(`3D scene material receipt missing for '${materialId}'`);
      continue;
    }
    const current = materialCatalogReference(material);
    if (receipt.materialHash !== current.materialHash) {
      errors.push(`3D scene material '${materialId}' hash changed; expected ${receipt.materialHash}, found ${current.materialHash}`);
    }
    if (receipt.sourcePackHash !== current.sourcePackHash) {
      errors.push(`3D scene material '${materialId}' source pack hash changed`);
    }
  }
}

function validateBoundary(boundary: MaxwellBoundary3D, index: number, errors: string[]): void {
  if (boundary.kind === "pml") {
    if (!isPositiveFinite(boundary.thickness)) errors.push(`boundary ${index} PML thickness must be positive`);
    validateSides(boundary.sides, `boundary ${index} PML`, errors);
    return;
  }
  if (boundary.kind === "periodic") {
    if (!["x", "y", "z"].includes(boundary.axis)) errors.push(`boundary ${index} periodic axis must be x, y, or z`);
    return;
  }
  if (boundary.kind === "pec") {
    validateSides(boundary.sides, `boundary ${index} PEC`, errors);
    return;
  }
  errors.push(`boundary ${index} kind is unsupported`);
}

function validateObject(object: MaxwellObject3D, index: number, errors: string[]): void {
  if (!object.id) errors.push(`object ${index} id is required`);
  if (!object.materialId) errors.push(`object ${object.id || index} materialId is required`);
  validateVec3(object.center, `object ${object.id || index} center`, errors);
  if (object.kind === "box") {
    validatePositiveVec3(object.size, `object ${object.id || index} size`, errors);
    return;
  }
  if (object.kind === "sphere") {
    if (!isPositiveFinite(object.radius)) errors.push(`object ${object.id || index} radius must be positive`);
    return;
  }
}

function validateSource(source: MaxwellSource3D, index: number, errors: string[]): void {
  if (!source.id) errors.push(`source ${index} id is required`);
  if (source.kind !== "plane-wave") errors.push(`source ${source.id || index} kind is unsupported`);
  if (!isPositiveFinite(source.wavelengthNm)) errors.push(`source ${source.id || index} wavelengthNm must be positive`);
  if (!Number.isFinite(source.amplitude)) errors.push(`source ${source.id || index} amplitude must be finite`);
  validateNonZeroVec3(source.direction, `source ${source.id || index} direction`, errors);
  validateNonZeroVec3(source.polarization, `source ${source.id || index} polarization`, errors);
}

function validateMonitor(monitor: MaxwellMonitor3D, index: number, errors: string[]): void {
  if (!monitor.id) errors.push(`monitor ${index} id is required`);
  validateVec3(monitor.center, `monitor ${monitor.id || index} center`, errors);
  if (monitor.kind === "field-volume") {
    validatePositiveVec3(monitor.size, `monitor ${monitor.id || index} size`, errors);
    if (!monitor.fields.length) errors.push(`monitor ${monitor.id || index} requires at least one field component`);
    for (const field of monitor.fields) {
      if (!fieldComponents.includes(field)) errors.push(`monitor ${monitor.id || index} has unsupported field '${field}'`);
    }
    return;
  }
  if (monitor.kind === "flux-plane") {
    validatePositiveVec2(monitor.size, `monitor ${monitor.id || index} size`, errors);
    validateNonZeroVec3(monitor.normal, `monitor ${monitor.id || index} normal`, errors);
    return;
  }
}

function validateSides(sides: MaxwellBoundarySide3D[], label: string, errors: string[]): void {
  if (!sides.length) errors.push(`${label} requires at least one side`);
  for (const side of sides) {
    if (!boundarySides.includes(side)) errors.push(`${label} has unsupported side '${side}'`);
  }
}

function validateVec3(value: MaxwellVec3 | undefined, label: string, errors: string[]): void {
  if (!Array.isArray(value) || value.length !== 3) {
    errors.push(`${label} must be a 3-vector`);
    return;
  }
  for (const entry of value) {
    if (!Number.isFinite(entry)) errors.push(`${label} entries must be finite`);
  }
}

function validatePositiveVec3(value: MaxwellVec3 | undefined, label: string, errors: string[]): void {
  validateVec3(value, label, errors);
  if (!value) return;
  for (const entry of value) {
    if (!isPositiveFinite(entry)) errors.push(`${label} entries must be positive`);
  }
}

function validatePositiveVec2(value: MaxwellVec2 | undefined, label: string, errors: string[]): void {
  if (!Array.isArray(value) || value.length !== 2) {
    errors.push(`${label} must be a 2-vector`);
    return;
  }
  for (const entry of value) {
    if (!isPositiveFinite(entry)) errors.push(`${label} entries must be positive`);
  }
}

function validateNonZeroVec3(value: MaxwellVec3 | undefined, label: string, errors: string[]): void {
  validateVec3(value, label, errors);
  if (!value) return;
  const magnitude = Math.hypot(value[0], value[1], value[2]);
  if (!isPositiveFinite(magnitude)) errors.push(`${label} must be non-zero`);
}

function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function sceneForHash(scene: MaxwellScene3D): unknown {
  return {
    version: scene.version,
    id: scene.id,
    label: scene.label,
    units: scene.units,
    backendId: scene.backendId,
    domain: {
      size: vec3ForHash(scene.domain.size),
      resolution: scene.domain.resolution
        ? {
            pixelsPerWavelength:
              scene.domain.resolution.pixelsPerWavelength === undefined ? undefined : roundNumber(scene.domain.resolution.pixelsPerWavelength),
            voxelSize: scene.domain.resolution.voxelSize ? vec3ForHash(scene.domain.resolution.voxelSize) : undefined
          }
        : undefined
    },
    backgroundMaterialId: scene.backgroundMaterialId,
    boundaries: scene.boundaries.map(boundaryForHash),
    objects: scene.objects.map(objectForHash),
    sources: scene.sources.map(sourceForHash),
    monitors: scene.monitors.map(monitorForHash),
    receipts: {
      materials: scene.receipts.materials.map((reference) => ({ ...reference })),
      materialCatalogHash: scene.receipts.materialCatalogHash
    },
    provenance: scene.provenance
  };
}

function boundaryForHash(boundary: MaxwellBoundary3D): unknown {
  if (boundary.kind === "pml") {
    return {
      kind: boundary.kind,
      thickness: roundNumber(boundary.thickness),
      sides: [...boundary.sides].sort()
    };
  }
  if (boundary.kind === "periodic") return { kind: boundary.kind, axis: boundary.axis };
  return {
    kind: boundary.kind,
    sides: [...boundary.sides].sort()
  };
}

function objectForHash(object: MaxwellObject3D): unknown {
  if (object.kind === "box") {
    return {
      id: object.id,
      kind: object.kind,
      center: vec3ForHash(object.center),
      size: vec3ForHash(object.size),
      materialId: object.materialId
    };
  }
  return {
    id: object.id,
    kind: object.kind,
    center: vec3ForHash(object.center),
    radius: roundNumber(object.radius),
    materialId: object.materialId
  };
}

function sourceForHash(source: MaxwellSource3D): unknown {
  return {
    id: source.id,
    kind: source.kind,
    wavelengthNm: roundNumber(source.wavelengthNm),
    direction: vec3ForHash(source.direction),
    polarization: vec3ForHash(source.polarization),
    amplitude: roundNumber(source.amplitude),
    coherenceGroupId: source.coherenceGroupId
  };
}

function monitorForHash(monitor: MaxwellMonitor3D): unknown {
  if (monitor.kind === "field-volume") {
    return {
      id: monitor.id,
      kind: monitor.kind,
      center: vec3ForHash(monitor.center),
      size: vec3ForHash(monitor.size),
      fields: [...monitor.fields].sort()
    };
  }
  return {
    id: monitor.id,
    kind: monitor.kind,
    center: vec3ForHash(monitor.center),
    size: vec2ForHash(monitor.size),
    normal: vec3ForHash(monitor.normal)
  };
}

function vec3ForHash(value: MaxwellVec3): MaxwellVec3 {
  return [roundNumber(value[0]), roundNumber(value[1]), roundNumber(value[2])];
}

function vec2ForHash(value: MaxwellVec2): MaxwellVec2 {
  return [roundNumber(value[0]), roundNumber(value[1])];
}

function roundNumber(value: number): number {
  return Number(value.toPrecision(12));
}

function cloneScene(scene: MaxwellScene3D): MaxwellScene3D {
  return JSON.parse(JSON.stringify(scene)) as MaxwellScene3D;
}
