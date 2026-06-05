import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import {
  orderedSimulationBuilderElements,
  runSimulationBuilderScenario,
  type SimulationBuilderElement,
  type SimulationBuilderScenario
} from "../maxwell/simulationBuilder";
import type {
  FdtdExportBundle,
  FdtdExportReadiness,
  FdtdGeometry,
  FdtdMaterial,
  FdtdMeepScriptExport,
  FdtdMonitor,
  FdtdSceneManifest
} from "./fdtdTypes";

export const l81FdtdBoundary = [
  "External FDTD export/import only; the browser app does not execute FDTD.",
  "Generated Meep scripts are deterministic helper artifacts for optional local execution.",
  "Imported field/flux maps are external-run evidence with receipts, not in-browser Maxwell solves.",
  "No arbitrary 3D CAD geometry, curved material lens solve, finite-thickness metal aperture Maxwell solve, FEM/BEM/RCWA execution, production solver validation, sensor-stack EM, digital twin, or manufacturing certification is claimed."
] as const;

export function fdtdSceneHash(scenario: SimulationBuilderScenario): string {
  return fnv1a64(
    stableStringify({
      schema: scenario.schema,
      id: scenario.id,
      grid: scenario.grid,
      source: scenario.source,
      elements: orderedSimulationBuilderElements(scenario.elements),
      target: scenario.target,
      observationPlaneZMm: scenario.observationPlaneZMm
    })
  );
}

export function validateFdtdExportReadiness(scenario: SimulationBuilderScenario): FdtdExportReadiness {
  const warnings: SolverWarning[] = [];
  const supported: FdtdExportReadiness["supported"] = [];
  const unsupported: FdtdExportReadiness["unsupported"] = [];
  const sourceScenarioHash = fdtdSceneHash(scenario);
  const l80 = runSimulationBuilderScenario(scenario);
  const estimatedCells = l80.grid.estimatedVolumetricSamples;
  const gridSpacingNm = l80.grid.dxNm;

  if (scenario.source.type === "plane-wave" || scenario.source.type === "point-source") {
    supported.push({ id: "source", label: scenario.source.label, evidence: `${scenario.source.type} source exported as Meep source scaffold` });
  } else {
    unsupported.push({ id: "source", label: scenario.source.label, reason: "source type is not supported by L8.1 export", status: "not-implemented" });
  }

  for (const element of orderedSimulationBuilderElements(scenario.elements)) {
    const reason = unsupportedElementReason(element);
    if (reason) {
      unsupported.push({ id: element.id, label: element.label, reason, status: element.status });
      continue;
    }
    if (element.kind === "circular-aperture" || element.kind === "ideal-lens") {
      warnings.push({
        code: "fdtd.export.scalarElementPlacementOnly",
        message: `${element.label} is retained in the manifest as placement context but is not exported as a material FDTD geometry in L8.1.`,
        elementId: element.id
      });
    }
    supported.push({ id: element.id, label: element.label, evidence: element.kind === "absorbing-slab" || element.kind === "material-slab" ? "block/slab geometry export" : "placement metadata export" });
  }

  if (scenario.target.kind === "transparent-dielectric") {
    supported.push({ id: "target", label: scenario.target.label, evidence: "transparent dielectric slab/block export with Fresnel/TMM comparison" });
  } else if (scenario.target.kind === "absorbing-slab") {
    supported.push({ id: "target", label: scenario.target.label, evidence: "lossy absorbing slab/block export with Beer-Lambert comparison" });
  } else {
    warnings.push({
      code: "fdtd.export.mirrorScaffold",
      message: "Ideal mirror target is exported as a high-reflectivity scaffold marker; use imported flux evidence before treating it as a material result."
    });
    supported.push({ id: "target", label: scenario.target.label, evidence: "mirror scaffold export with conservative warning" });
  }

  if (estimatedCells > 100_000_000) {
    warnings.push({
      code: "fdtd.export.largeGrid",
      message: "Estimated FDTD grid is large; external execution may require coarser resolution or HPC resources."
    });
  }

  const status = unsupported.length > 0 ? "blocked" : warnings.length > 0 ? "warning" : "ready";
  return {
    status,
    supported,
    unsupported,
    warnings: uniqueWarnings(warnings),
    estimatedCells,
    gridSpacingNm,
    sceneHash: sourceScenarioHash
  };
}

export function exportFdtdSceneManifest(scenario: SimulationBuilderScenario): FdtdSceneManifest {
  const readiness = validateFdtdExportReadiness(scenario);
  const materials = fdtdMaterialsForScenario(scenario);
  const geometry = fdtdGeometryForScenario(scenario);
  const monitors = fdtdMonitorsForScenario(scenario);
  const draft = {
    schema: "emmicro.fdtd.sceneManifest.v1" as const,
    id: `l81-fdtd-${scenario.id}`,
    label: `L8.1 external FDTD export for ${scenario.label}`,
    sourceScenarioId: scenario.id,
    sourceScenarioHash: readiness.sceneHash,
    targetKind: scenario.target.kind,
    units: "um" as const,
    grid: {
      domainWidthUm: scenario.grid.domainWidthUm,
      domainHeightUm: scenario.grid.domainHeightUm,
      zStartUm: scenario.grid.zStartMm * 1000,
      zEndUm: scenario.grid.zEndMm * 1000,
      gridSpacingNm: readiness.gridSpacingNm,
      pointsPerWavelength: scenario.grid.pointsPerWavelength,
      estimatedCells: readiness.estimatedCells
    },
    source: {
      kind: scenario.source.type,
      wavelengthUm: scenario.source.wavelengthNm / 1000,
      centerUm: { x: scenario.source.xUm, y: scenario.source.yUm, z: scenario.source.zMm * 1000 },
      direction: scenario.source.direction,
      component: "Ez" as const
    },
    materials,
    geometry,
    monitors,
    boundaries: {
      pmlThicknessUm: Math.max(0.5, (scenario.source.wavelengthNm / 1000) * 1.5),
      note: "PML boundary scaffold for optional external Meep execution."
    },
    readiness,
    limitations: [...l81FdtdBoundary]
  };
  const manifestHash = fnv1a64(stableStringify(draft));
  return { ...draft, manifestHash };
}

export function exportMeepScriptForFdtdManifest(manifest: FdtdSceneManifest): FdtdMeepScriptExport {
  const warnings: SolverWarning[] = manifest.readiness.status === "blocked"
    ? [{ code: "fdtd.meep.blockedManifest", message: "Manifest contains unsupported geometry and should not be run until corrected." }]
    : [];
  const python = [
    "# Generated by EMMicro L8.1 External FDTD / Field Maps.",
    "# Optional external helper only; the browser app does not execute FDTD.",
    `# source_scenario_hash: ${manifest.sourceScenarioHash}`,
    `# manifest_hash: ${manifest.manifestHash}`,
    "",
    "import json",
    "import meep as mp",
    "",
    `cell_size = mp.Vector3(${formatNumber(manifest.grid.domainWidthUm)}, ${formatNumber(manifest.grid.domainHeightUm)}, ${formatNumber((manifest.grid.zEndUm - manifest.grid.zStartUm))})`,
    `resolution = ${meepResolution(manifest)}`,
    `pml_layers = [mp.PML(${formatNumber(manifest.boundaries.pmlThicknessUm)})]`,
    "",
    "materials = {",
    ...manifest.materials.map((material) => `    ${quote(material.id)}: mp.Medium(index=${formatNumber(material.refractiveIndex.n)}),  # k=${formatNumber(material.refractiveIndex.k)} hash=${material.materialHash}`),
    "}",
    "",
    "geometry = [",
    ...manifest.geometry.map((geometry) => `    mp.Block(center=mp.Vector3(${formatNumber(geometry.centerUm.x)}, ${formatNumber(geometry.centerUm.y)}, ${formatNumber(geometry.centerUm.z)}), size=mp.Vector3(${formatNumber(geometry.sizeUm.x)}, ${formatNumber(geometry.sizeUm.y)}, ${formatNumber(geometry.sizeUm.z)}), material=materials[${quote(geometry.materialId)}]),  # ${geometry.kind}`),
    "]",
    "",
    "sources = [",
    `    mp.Source(mp.ContinuousSource(wavelength=${formatNumber(manifest.source.wavelengthUm)}), component=mp.${manifest.source.component}, center=mp.Vector3(${formatNumber(manifest.source.centerUm.x)}, ${formatNumber(manifest.source.centerUm.y)}, ${formatNumber(manifest.source.centerUm.z)}), size=mp.Vector3(${formatNumber(manifest.grid.domainWidthUm)}, ${formatNumber(manifest.grid.domainHeightUm)}, 0)),`,
    "]",
    "",
    "sim = mp.Simulation(cell_size=cell_size, boundary_layers=pml_layers, geometry=geometry, sources=sources, resolution=resolution)",
    "",
    "# Monitor definitions. External postprocess writes flux_summary.json and field_slice_xz.csv.",
    ...manifest.monitors.map((monitor) => `# monitor ${monitor.id}: ${monitor.kind} center=(${formatNumber(monitor.centerUm.x)}, ${formatNumber(monitor.centerUm.y)}, ${formatNumber(monitor.centerUm.z)}) size=(${formatNumber(monitor.sizeUm.x)}, ${formatNumber(monitor.sizeUm.y)}, ${formatNumber(monitor.sizeUm.z)}) normal=${monitor.normal}`),
    "",
    "# sim.run(until=200)",
    "# sim.output_efield_z()",
    "# Use tools/fdtd/postprocess_meep_output.py to produce importable JSON/CSV summaries.",
    ""
  ].join("\n");
  const scriptHash = fnv1a64(stableStringify({ manifestHash: manifest.manifestHash, python }));
  return {
    schema: "emmicro.fdtd.meepScript.v1",
    manifestHash: manifest.manifestHash,
    sourceScenarioHash: manifest.sourceScenarioHash,
    scriptHash,
    python,
    warnings
  };
}

export function exportFdtdBundleFromSimulationBuilder(scenario: SimulationBuilderScenario): FdtdExportBundle {
  const manifest = exportFdtdSceneManifest(scenario);
  return {
    manifest,
    script: exportMeepScriptForFdtdManifest(manifest)
  };
}

export function fdtdManifestJson(manifest: FdtdSceneManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export function fdtdMeepScriptText(script: FdtdMeepScriptExport): string {
  return script.python;
}

function unsupportedElementReason(element: SimulationBuilderElement): string | null {
  if (element.kind === "curved-material-lens") return "curved material lens solving is scaffold-only and not exportable as executable FDTD geometry in L8.1";
  if (element.kind === "finite-metal-aperture") return "finite-thickness metal aperture Maxwell solve is not implemented";
  if (element.status === "not-implemented") return `${element.label} is not implemented`;
  return null;
}

function fdtdMaterialsForScenario(scenario: SimulationBuilderScenario): FdtdMaterial[] {
  const target = scenario.target;
  const materials: FdtdMaterial[] = [
    material("air", "Air", 1, 0)
  ];
  if (target.kind === "transparent-dielectric") {
    materials.push(material("target-dielectric", target.label, target.substrateIndex, 0));
  } else if (target.kind === "absorbing-slab") {
    const k = (target.absorptionCoefficientPerM * scenario.source.wavelengthNm * 1e-9) / (4 * Math.PI);
    materials.push(material("target-absorber", target.label, Math.max(1, target.substrateIndex), k, target.absorptionCoefficientPerM));
  } else {
    materials.push(material("mirror-placeholder", target.label, 8, 6));
  }
  return materials;
}

function fdtdGeometryForScenario(scenario: SimulationBuilderScenario): FdtdGeometry[] {
  const target = scenario.target;
  const thicknessUm = target.kind === "transparent-dielectric" ? Math.max(1, target.thicknessUm || 100) : Math.max(1, target.thicknessUm || 100);
  return [
    {
      id: "target-block",
      kind: target.kind === "absorbing-slab" ? "absorbing-slab" : target.kind === "mirror" ? "mirror-scaffold" : "transparent-slab",
      label: target.label,
      centerUm: { x: 0, y: 0, z: target.zMm * 1000 },
      sizeUm: { x: scenario.grid.domainWidthUm, y: scenario.grid.domainHeightUm, z: thicknessUm },
      materialId: target.kind === "absorbing-slab" ? "target-absorber" : target.kind === "mirror" ? "mirror-placeholder" : "target-dielectric"
    }
  ];
}

function fdtdMonitorsForScenario(scenario: SimulationBuilderScenario): FdtdMonitor[] {
  const width = scenario.grid.domainWidthUm;
  const height = scenario.grid.domainHeightUm;
  const targetZUm = scenario.target.zMm * 1000;
  const sourceZUm = scenario.source.zMm * 1000;
  const observationZUm = scenario.observationPlaneZMm * 1000;
  return [
    {
      id: "incident-flux",
      kind: "flux-plane",
      label: "Incident flux plane",
      centerUm: { x: 0, y: 0, z: Math.max(sourceZUm + 100, targetZUm - 500) },
      sizeUm: { x: width, y: height, z: 0 },
      normal: "+z"
    },
    {
      id: "reflected-flux",
      kind: "flux-plane",
      label: "Reflected flux plane",
      centerUm: { x: 0, y: 0, z: Math.max(sourceZUm + 50, targetZUm - 800) },
      sizeUm: { x: width, y: height, z: 0 },
      normal: "-z"
    },
    {
      id: "transmitted-flux",
      kind: "flux-plane",
      label: "Transmitted flux plane",
      centerUm: { x: 0, y: 0, z: Math.min(observationZUm, targetZUm + 800) },
      sizeUm: { x: width, y: height, z: 0 },
      normal: "+z"
    },
    {
      id: "field-slice-xz",
      kind: "field-slice",
      label: "XZ field/intensity slice",
      centerUm: { x: 0, y: 0, z: (scenario.grid.zStartMm + scenario.grid.zEndMm) * 500 },
      sizeUm: { x: width, y: 0, z: (scenario.grid.zEndMm - scenario.grid.zStartMm) * 1000 },
      normal: "+y",
      fields: ["Ez", "intensity"]
    }
  ];
}

function material(id: string, label: string, n: number, k: number, absorptionCoefficientPerM?: number): FdtdMaterial {
  const base = {
    id,
    label,
    refractiveIndex: { n, k },
    absorptionCoefficientPerM
  };
  return {
    ...base,
    materialHash: fnv1a64(stableStringify(base))
  };
}

function meepResolution(manifest: FdtdSceneManifest): number {
  return Math.max(1, Math.round(1000 / manifest.grid.gridSpacingNm));
}

function formatNumber(value: number): string {
  return Number(value.toPrecision(12)).toString();
}

function quote(value: string): string {
  return JSON.stringify(value);
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
