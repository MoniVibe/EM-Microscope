import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { MaxwellMaterialCatalog } from "./materialCatalog";
import type { MaxwellBoundary3D, MaxwellMonitor3D, MaxwellObject3D, MaxwellScene3D, MaxwellSource3D, MaxwellVec2, MaxwellVec3 } from "./maxwell3dTypes";
import { validateMaxwellScene3D } from "./maxwell3dValidation";
import { externalFdtdSolverReceipt } from "./externalFdtdBackend";

export interface ExternalFdtdScaffoldExport {
  schema: "emmicro.externalFdtdScaffold.v1";
  warning: "Generated scaffold only; not yet validated as an executable Meep workflow.";
  notExecutableInApp: true;
  scene: MaxwellScene3D;
  backend: ReturnType<typeof externalFdtdSolverReceipt>;
  meepPythonStub: string;
  resultHash: string;
}

export function exportExternalFdtdScaffold(scene: MaxwellScene3D, options: { materialCatalog?: MaxwellMaterialCatalog } = {}): ExternalFdtdScaffoldExport {
  const backend = externalFdtdSolverReceipt();
  const meepPythonStub = exportMeepPythonStub(scene, options);
  const body = {
    schema: "emmicro.externalFdtdScaffold.v1" as const,
    warning: "Generated scaffold only; not yet validated as an executable Meep workflow." as const,
    notExecutableInApp: true as const,
    scene,
    backend,
    meepPythonStub
  };
  const resultHash = fnv1a64(
    stableStringify({
      ...body,
      backend: {
        id: backend.id,
        method: backend.method,
        solverVersion: backend.solverVersion,
        capabilities: backend.capabilities
      }
    })
  );

  return {
    ...body,
    resultHash
  };
}

export function exportMeepPythonStub(scene: MaxwellScene3D, options: { materialCatalog?: MaxwellMaterialCatalog } = {}): string {
  const validation = validateMaxwellScene3D(scene, options.materialCatalog);
  if (!validation.valid) throw new Error(`Cannot export invalid 3D Maxwell scene: ${validation.errors.join("; ")}`);

  return [
    "# Generated scaffold only; not yet validated as an executable Meep workflow.",
    "# L6.0 does not execute 3D Maxwell solves in-app.",
    `# scene_id: ${scene.id}`,
    `# scene_hash: ${scene.receipts.sceneHash}`,
    `# units: ${scene.units}`,
    "",
    "import meep as mp",
    "",
    `cell_size = mp.Vector3(${formatVec3(scene.domain.size)})`,
    `resolution = ${formatResolution(scene)}`,
    "",
    "# Material receipts are provenance placeholders; replace with validated Meep material models before execution.",
    "materials = {",
    ...scene.receipts.materials.map((reference) => `    ${quote(reference.materialId)}: mp.Medium(index=1.0),  # ${reference.label}; hash ${reference.materialHash}`),
    "}",
    "",
    "geometry = [",
    ...scene.objects.map((object) => `    ${objectToMeep(object)},`),
    "]",
    "",
    "sources = [",
    ...scene.sources.map((source) => `    ${sourceToMeep(source)},`),
    "]",
    "",
    "pml_layers = [",
    ...scene.boundaries.flatMap(boundaryToMeepPml),
    "]",
    "",
    "sim = mp.Simulation(",
    "    cell_size=cell_size,",
    "    boundary_layers=pml_layers,",
    "    geometry=geometry,",
    "    sources=sources,",
    `    default_material=materials[${quote(scene.backgroundMaterialId)}],`,
    "    resolution=resolution,",
    ")",
    "",
    "# Monitor scaffold. Convert these declarations into Meep add_flux/add_dft_fields calls after backend validation.",
    ...scene.monitors.map((monitor) => `# ${monitorToComment(monitor)}`),
    "",
    "# HDF5/openPMD output hint: persist field-volume monitors with scene_hash metadata.",
    "# sim.run(until=200)  # intentionally commented; scaffold-only export.",
    "# sim.output_epsilon()",
    "# sim.output_efield_z()",
    ""
  ].join("\n");
}

function formatResolution(scene: MaxwellScene3D): number {
  const pixelsPerWavelength = scene.domain.resolution?.pixelsPerWavelength;
  if (pixelsPerWavelength !== undefined && Number.isFinite(pixelsPerWavelength) && pixelsPerWavelength > 0) return Math.round(pixelsPerWavelength);
  const voxelSize = scene.domain.resolution?.voxelSize;
  if (voxelSize) {
    const smallest = Math.min(...voxelSize);
    if (Number.isFinite(smallest) && smallest > 0) return Math.max(1, Math.round(1 / smallest));
  }
  return 16;
}

function objectToMeep(object: MaxwellObject3D): string {
  if (object.kind === "box") {
    return `mp.Block(center=mp.Vector3(${formatVec3(object.center)}), size=mp.Vector3(${formatVec3(object.size)}), material=materials[${quote(object.materialId)}])`;
  }
  return `mp.Sphere(center=mp.Vector3(${formatVec3(object.center)}), radius=${formatNumber(object.radius)}, material=materials[${quote(object.materialId)}])`;
}

function sourceToMeep(source: MaxwellSource3D): string {
  const component = dominantElectricComponent(source.polarization);
  return `mp.Source(mp.ContinuousSource(wavelength=${formatNumber(source.wavelengthNm / 1000)}), component=${component}, center=mp.Vector3(0, 0, 0), size=cell_size, amplitude=${formatNumber(source.amplitude)})  # direction ${formatVec3(source.direction)}`;
}

function boundaryToMeepPml(boundary: MaxwellBoundary3D): string[] {
  if (boundary.kind !== "pml") return [`    # ${boundary.kind} boundary scaffold is declared in the manifest but not converted to Meep in L6.0.`];
  return boundary.sides.map((side) => `    mp.PML(thickness=${formatNumber(boundary.thickness)}, direction=${sideDirection(side)}, side=${sideHalf(side)}),`);
}

function monitorToComment(monitor: MaxwellMonitor3D): string {
  if (monitor.kind === "field-volume") {
    return `field-volume ${monitor.id}: center ${formatVec3(monitor.center)}, size ${formatVec3(monitor.size)}, fields ${monitor.fields.join(", ")}`;
  }
  return `flux-plane ${monitor.id}: center ${formatVec3(monitor.center)}, size ${formatVec2(monitor.size)}, normal ${formatVec3(monitor.normal)}`;
}

function dominantElectricComponent(polarization: MaxwellVec3): "mp.Ex" | "mp.Ey" | "mp.Ez" {
  const absolute = polarization.map((value) => Math.abs(value)) as MaxwellVec3;
  if (absolute[1] >= absolute[0] && absolute[1] >= absolute[2]) return "mp.Ey";
  if (absolute[2] >= absolute[0] && absolute[2] >= absolute[1]) return "mp.Ez";
  return "mp.Ex";
}

function sideDirection(side: string): "mp.X" | "mp.Y" | "mp.Z" {
  if (side.startsWith("y")) return "mp.Y";
  if (side.startsWith("z")) return "mp.Z";
  return "mp.X";
}

function sideHalf(side: string): "mp.Low" | "mp.High" {
  return side.endsWith("min") ? "mp.Low" : "mp.High";
}

function formatVec3(value: MaxwellVec3): string {
  return `${formatNumber(value[0])}, ${formatNumber(value[1])}, ${formatNumber(value[2])}`;
}

function formatVec2(value: MaxwellVec2): string {
  return `${formatNumber(value[0])}, ${formatNumber(value[1])}`;
}

function formatNumber(value: number): string {
  return Number(value.toPrecision(12)).toString();
}

function quote(value: string): string {
  return JSON.stringify(value);
}
