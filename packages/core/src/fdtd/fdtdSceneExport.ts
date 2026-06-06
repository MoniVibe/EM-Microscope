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
  "L8.3 finite surface geometry is limited to placed transparent blocks, absorbing blocks, ideal reflector diagnostics, aperture/blocker masks, and tilted/wedge diagnostics with convergence warnings.",
  "L8.4 aperture/blocker edge-diffraction validation is limited to long-slit, circular-pinhole, rectangular-aperture, and opaque-blocker diagnostic scenes with scalar limiting-case references and convergence warnings.",
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
    warnings.push(...finiteGeometryWarnings(element, scenario, gridSpacingNm));
    supported.push({ id: element.id, label: element.label, evidence: finiteElementKind(element) ? "finite surface geometry export with L8.3 validation warnings" : element.kind === "absorbing-slab" || element.kind === "material-slab" ? "block/slab geometry export" : "placement metadata export" });
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
    ...manifest.geometry.flatMap((geometry) => fdtdGeometryPythonLines(geometry)),
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
  for (const element of orderedSimulationBuilderElements(scenario.elements)) {
    if (element.kind === "finite-transparent-block" || element.kind === "tilted-interface-wedge") {
      pushUniqueMaterial(materials, material(`element-${element.id}-dielectric`, element.label, element.materialIndex ?? 1.5, 0));
    } else if (element.kind === "finite-absorbing-block") {
      const n = element.materialIndex ?? 1.2;
      const k = element.extinctionCoefficient ?? ((element.absorptionCoefficientPerM ?? 5000) * scenario.source.wavelengthNm * 1e-9) / (4 * Math.PI);
      pushUniqueMaterial(materials, material(`element-${element.id}-absorber`, element.label, n, k, element.absorptionCoefficientPerM ?? 5000));
    } else if (element.kind === "finite-reflective-plate") {
      pushUniqueMaterial(materials, material(`element-${element.id}-ideal-reflector`, element.label, 1e6, 0));
    } else if (element.kind === "finite-aperture-blocker") {
      if (element.screenModel === "transparent-reference") {
        pushUniqueMaterial(materials, material(`element-${element.id}-blocker`, element.label, 1, 0));
      } else if (element.screenModel === "ideal-reflective-screen") {
        pushUniqueMaterial(materials, material(`element-${element.id}-blocker`, element.label, 1e6, 0));
      } else {
        pushUniqueMaterial(materials, material(`element-${element.id}-blocker`, element.label, 1.1, 0.05, 25000));
      }
    }
  }
  return materials;
}

function fdtdGeometryForScenario(scenario: SimulationBuilderScenario): FdtdGeometry[] {
  const target = scenario.target;
  const thicknessUm = target.kind === "transparent-dielectric" ? Math.max(1, target.thicknessUm || 100) : Math.max(1, target.thicknessUm || 100);
  const geometries: FdtdGeometry[] = [
    {
      id: "target-block",
      kind: target.kind === "absorbing-slab" ? "absorbing-slab" : target.kind === "mirror" ? "mirror-scaffold" : "transparent-slab",
      label: target.label,
      centerUm: { x: 0, y: 0, z: target.zMm * 1000 },
      sizeUm: { x: scenario.grid.domainWidthUm, y: scenario.grid.domainHeightUm, z: thicknessUm },
      materialId: target.kind === "absorbing-slab" ? "target-absorber" : target.kind === "mirror" ? "mirror-placeholder" : "target-dielectric"
    }
  ];
  for (const element of orderedSimulationBuilderElements(scenario.elements)) {
    const geometry = fdtdGeometryForFiniteElement(element);
    if (geometry) geometries.push(geometry);
  }
  return geometries;
}

function fdtdMonitorsForScenario(scenario: SimulationBuilderScenario): FdtdMonitor[] {
  const width = scenario.grid.domainWidthUm;
  const height = scenario.grid.domainHeightUm;
  const targetZUm = scenario.target.zMm * 1000;
  const sourceZUm = scenario.source.zMm * 1000;
  const observationZUm = scenario.observationPlaneZMm * 1000;
  const monitors: FdtdMonitor[] = [
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
  for (const element of orderedSimulationBuilderElements(scenario.elements)) {
    if (!finiteElementKind(element)) continue;
    const centerZ = element.zMm * 1000;
    const thickness = Math.max(0.1, element.thicknessUm ?? 1);
    const offset = Math.max(scenario.source.wavelengthNm / 1000, thickness);
    monitors.push(
      {
        id: `${element.id}-front-flux`,
        kind: "flux-plane",
        label: `${element.label} front flux`,
        centerUm: { x: element.xUm ?? 0, y: element.yUm ?? 0, z: centerZ - thickness / 2 - offset },
        sizeUm: { x: element.widthUm ?? width, y: element.heightUm ?? height, z: 0 },
        normal: "+z"
      },
      {
        id: `${element.id}-back-flux`,
        kind: "flux-plane",
        label: `${element.label} back flux`,
        centerUm: { x: element.xUm ?? 0, y: element.yUm ?? 0, z: centerZ + thickness / 2 + offset },
        sizeUm: { x: element.widthUm ?? width, y: element.heightUm ?? height, z: 0 },
        normal: "+z"
      }
    );
  }
  return monitors;
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

function pushUniqueMaterial(materials: FdtdMaterial[], next: FdtdMaterial): void {
  if (!materials.some((materialItem) => materialItem.id === next.id)) materials.push(next);
}

function finiteElementKind(element: SimulationBuilderElement): boolean {
  return element.kind === "finite-transparent-block" || element.kind === "finite-absorbing-block" || element.kind === "finite-reflective-plate" || element.kind === "finite-aperture-blocker" || element.kind === "tilted-interface-wedge";
}

function fdtdGeometryForFiniteElement(element: SimulationBuilderElement): FdtdGeometry | null {
  const centerUm = { x: element.xUm ?? 0, y: element.yUm ?? 0, z: element.zMm * 1000 };
  const sizeUm = {
    x: Math.max(0.05, element.widthUm ?? 1),
    y: Math.max(0.05, element.heightUm ?? element.widthUm ?? 1),
    z: Math.max(0.05, element.thicknessUm ?? 1)
  };
  if (element.kind === "finite-transparent-block") {
    return {
      id: element.id,
      kind: "finite-transparent-block",
      label: element.label,
      centerUm,
      sizeUm,
      materialId: `element-${element.id}-dielectric`,
      diagnostic: "analytic-reference",
      sourceElementId: element.id
    };
  }
  if (element.kind === "finite-absorbing-block") {
    return {
      id: element.id,
      kind: "finite-absorbing-block",
      label: element.label,
      centerUm,
      sizeUm,
      materialId: `element-${element.id}-absorber`,
      diagnostic: "analytic-reference",
      sourceElementId: element.id
    };
  }
  if (element.kind === "finite-reflective-plate") {
    return {
      id: element.id,
      kind: "finite-reflective-plate",
      label: element.label,
      centerUm,
      sizeUm,
      materialId: `element-${element.id}-ideal-reflector`,
      diagnostic: "ideal-reflector",
      sourceElementId: element.id
    };
  }
  if (element.kind === "finite-aperture-blocker") {
    return {
      id: element.id,
      kind: "finite-aperture-blocker",
      label: element.label,
      centerUm,
      sizeUm,
      materialId: `element-${element.id}-blocker`,
      apertureUm: {
        width: Math.max(0.01, Math.min(element.apertureWidthUm ?? sizeUm.x * 0.4, sizeUm.x)),
        height: Math.max(0.01, Math.min(element.apertureHeightUm ?? sizeUm.y * 0.4, sizeUm.y))
      },
      apertureShape: element.apertureShape ?? "rectangular-aperture",
      screenModel: element.screenModel ?? "absorbing-screen",
      diagnostic: "edge-field",
      sourceElementId: element.id
    };
  }
  if (element.kind === "tilted-interface-wedge") {
    return {
      id: element.id,
      kind: "tilted-interface-wedge",
      label: element.label,
      centerUm,
      sizeUm,
      materialId: `element-${element.id}-dielectric`,
      rotationDeg: element.orientationDeg ?? 12,
      diagnostic: "snell-fresnel",
      sourceElementId: element.id
    };
  }
  return null;
}

function finiteGeometryWarnings(element: SimulationBuilderElement, scenario: SimulationBuilderScenario, gridSpacingNm: number): SolverWarning[] {
  if (!finiteElementKind(element)) return [];
  const warnings: SolverWarning[] = [];
  const minDimensionUm = Math.min(Math.max(0, element.widthUm ?? 0), Math.max(0, element.heightUm ?? 0), Math.max(0, element.thicknessUm ?? 0));
  const cellsAcross = minDimensionUm / Math.max(1e-9, gridSpacingNm / 1000);
  if (cellsAcross < 6) {
    warnings.push({
      code: "fdtd.geometry.underResolved",
      message: `${element.label} is only ${cellsAcross.toPrecision(3)} cells across in its smallest dimension; increase resolution or dimensions before trusting geometry-edge fields.`,
      elementId: element.id
    });
  }
  const zCenterUm = element.zMm * 1000;
  const halfThicknessUm = Math.max(0, element.thicknessUm ?? 0) / 2;
  const distanceToStart = zCenterUm - halfThicknessUm - scenario.grid.zStartMm * 1000;
  const distanceToEnd = scenario.grid.zEndMm * 1000 - (zCenterUm + halfThicknessUm);
  const wavelengthUm = scenario.source.wavelengthNm / 1000;
  const pmlUm = Math.max(0.5, wavelengthUm * 1.5);
  const monitorOffsetUm = Math.max(wavelengthUm, Math.max(0, element.thicknessUm ?? 0));
  if (Math.min(distanceToStart, distanceToEnd) < pmlUm + wavelengthUm) {
    warnings.push({
      code: "fdtd.geometry.pmlProximity",
      message: `${element.label} is close to the domain/PML boundary; keep finite objects at least one wavelength plus PML thickness from boundaries.`,
      elementId: element.id
    });
  }
  if (monitorOffsetUm < 2 * wavelengthUm) {
    warnings.push({
      code: "fdtd.geometry.monitorProximity",
      message: `${element.label} has flux monitors within two wavelengths of the scatterer in the generated helper scene; move monitors farther away for production convergence runs.`,
      elementId: element.id
    });
  }
  if (element.kind === "finite-absorbing-block") {
    warnings.push({
      code: "fdtd.geometry.absorberDispersionUnverified",
      message: `${element.label} uses a simple lossy diagnostic material; dispersive material fitting and convergence evidence are required before production claims.`,
      elementId: element.id
    });
  }
  if (element.kind === "finite-reflective-plate") {
    warnings.push({
      code: "fdtd.geometry.idealReflector",
      message: `${element.label} is an ideal reflector diagnostic, not a real finite-thickness metal optics model.`,
      elementId: element.id
    });
  }
  if (element.kind === "finite-aperture-blocker") {
    const apertureWidth = Math.max(0, element.apertureWidthUm ?? element.apertureDiameterUm ?? 0);
    const apertureHeight = Math.max(0, element.apertureHeightUm ?? element.apertureDiameterUm ?? 0);
    const apertureCellsAcross = Math.min(
      apertureWidth > 0 ? apertureWidth / Math.max(1e-9, gridSpacingNm / 1000) : Number.POSITIVE_INFINITY,
      apertureHeight > 0 ? apertureHeight / Math.max(1e-9, gridSpacingNm / 1000) : Number.POSITIVE_INFINITY
    );
    if ((element.apertureShape ?? "rectangular-aperture") !== "opaque-blocker" && apertureCellsAcross < 12) {
      warnings.push({
        code: "fdtd.aperture.underResolved",
        message: `${element.label} aperture is only ${apertureCellsAcross.toPrecision(3)} cells across; increase grid density or aperture size before trusting edge diffraction.`,
        elementId: element.id
      });
    }
    warnings.push({
      code: "fdtd.geometry.edgeFieldConvergenceRequired",
      message: `${element.label} has aperture edges; treat downstream fields as diagnostic until resolution/PML convergence is shown.`,
      elementId: element.id
    });
    warnings.push({
      code: "fdtd.aperture.scalarLimit",
      message: `${element.label} finite FDTD screen is compared only to scalar limiting-case diffraction references; finite thickness and finite screen size can shift residuals.`,
      elementId: element.id
    });
    if (element.screenModel === "ideal-reflective-screen") {
      warnings.push({
        code: "fdtd.aperture.idealReflectorScreen",
        message: `${element.label} uses an ideal reflective screen diagnostic, not a production metal aperture model.`,
        elementId: element.id
      });
    }
  }
  if (element.kind === "tilted-interface-wedge") {
    warnings.push({
      code: "fdtd.geometry.staircasingSensitive",
      message: `${element.label} has tilted finite surfaces; staircasing/subpixel-smoothing sensitivity must be checked by convergence sweep.`,
      elementId: element.id
    });
  }
  return warnings;
}

function fdtdGeometryPythonLines(geometry: FdtdGeometry): string[] {
  if (geometry.kind === "finite-aperture-blocker" && geometry.apertureUm) return apertureBlockerPythonLines(geometry);
  const materialExpr = geometry.kind === "finite-reflective-plate" ? "mp.metal" : `materials[${quote(geometry.materialId)}]`;
  const rotation = geometry.rotationDeg ?? 0;
  const orientationArgs = rotation === 0
    ? ""
    : `, e1=mp.Vector3(${formatNumber(Math.cos(degToRad(rotation)))}, 0, ${formatNumber(Math.sin(degToRad(rotation)))}), e2=mp.Vector3(0, 1, 0), e3=mp.Vector3(${formatNumber(-Math.sin(degToRad(rotation)))}, 0, ${formatNumber(Math.cos(degToRad(rotation)))})`;
  return [
    `    mp.Block(center=mp.Vector3(${formatNumber(geometry.centerUm.x)}, ${formatNumber(geometry.centerUm.y)}, ${formatNumber(geometry.centerUm.z)}), size=mp.Vector3(${formatNumber(geometry.sizeUm.x)}, ${formatNumber(geometry.sizeUm.y)}, ${formatNumber(geometry.sizeUm.z)}), material=${materialExpr}${orientationArgs}),  # ${geometry.kind}`
  ];
}

function apertureBlockerPythonLines(geometry: FdtdGeometry): string[] {
  const aperture = geometry.apertureUm ?? { width: geometry.sizeUm.x * 0.4, height: geometry.sizeUm.y * 0.4 };
  if (geometry.apertureShape === "opaque-blocker") return solidApertureScreenPythonLines(geometry);
  if (geometry.apertureShape === "circular-pinhole") return circularPinholePythonLines(geometry, aperture);
  const sideWidth = Math.max(0, (geometry.sizeUm.x - aperture.width) / 2);
  const topHeight = Math.max(0, (geometry.sizeUm.y - aperture.height) / 2);
  const materialExpr = apertureMaterialExpr(geometry);
  const lines = [`    # ${geometry.kind}: ${geometry.apertureShape ?? "rectangular-aperture"} four-screen-block helper around aperture; diagnostic edge validation only`];
  if (sideWidth > 0) {
    lines.push(
      `    mp.Block(center=mp.Vector3(${formatNumber(geometry.centerUm.x - (aperture.width + sideWidth) / 2)}, ${formatNumber(geometry.centerUm.y)}, ${formatNumber(geometry.centerUm.z)}), size=mp.Vector3(${formatNumber(sideWidth)}, ${formatNumber(geometry.sizeUm.y)}, ${formatNumber(geometry.sizeUm.z)}), material=${materialExpr}),`,
      `    mp.Block(center=mp.Vector3(${formatNumber(geometry.centerUm.x + (aperture.width + sideWidth) / 2)}, ${formatNumber(geometry.centerUm.y)}, ${formatNumber(geometry.centerUm.z)}), size=mp.Vector3(${formatNumber(sideWidth)}, ${formatNumber(geometry.sizeUm.y)}, ${formatNumber(geometry.sizeUm.z)}), material=${materialExpr}),`
    );
  }
  if (topHeight > 0) {
    lines.push(
      `    mp.Block(center=mp.Vector3(${formatNumber(geometry.centerUm.x)}, ${formatNumber(geometry.centerUm.y - (aperture.height + topHeight) / 2)}, ${formatNumber(geometry.centerUm.z)}), size=mp.Vector3(${formatNumber(aperture.width)}, ${formatNumber(topHeight)}, ${formatNumber(geometry.sizeUm.z)}), material=${materialExpr}),`,
      `    mp.Block(center=mp.Vector3(${formatNumber(geometry.centerUm.x)}, ${formatNumber(geometry.centerUm.y + (aperture.height + topHeight) / 2)}, ${formatNumber(geometry.centerUm.z)}), size=mp.Vector3(${formatNumber(aperture.width)}, ${formatNumber(topHeight)}, ${formatNumber(geometry.sizeUm.z)}), material=${materialExpr}),`
    );
  }
  return lines;
}

function solidApertureScreenPythonLines(geometry: FdtdGeometry): string[] {
  return [
    `    # ${geometry.kind}: opaque-blocker solid screen diagnostic; not a production metal aperture model`,
    `    mp.Block(center=mp.Vector3(${formatNumber(geometry.centerUm.x)}, ${formatNumber(geometry.centerUm.y)}, ${formatNumber(geometry.centerUm.z)}), size=mp.Vector3(${formatNumber(geometry.sizeUm.x)}, ${formatNumber(geometry.sizeUm.y)}, ${formatNumber(geometry.sizeUm.z)}), material=${apertureMaterialExpr(geometry)}),`
  ];
}

function circularPinholePythonLines(geometry: FdtdGeometry, aperture: { width: number; height: number }): string[] {
  const radius = Math.max(0.01, Math.min(aperture.width, aperture.height) / 2);
  const screenRadius = Math.max(radius, Math.min(geometry.sizeUm.x, geometry.sizeUm.y) / 2);
  const materialExpr = apertureMaterialExpr(geometry);
  const lines = [
    `    # ${geometry.kind}: circular-pinhole segmented screen helper; Meep run should use convergence/subpixel review before interpretation`,
    `    # aperture_radius_um=${formatNumber(radius)} screen_radius_um=${formatNumber(screenRadius)}`
  ];
  const segmentCount = 8;
  for (let index = 0; index < segmentCount; index += 1) {
    const angle = (index * Math.PI * 2) / segmentCount;
    const nextAngle = ((index + 1) * Math.PI * 2) / segmentCount;
    const mid = (angle + nextAngle) / 2;
    const radialCenter = (radius + screenRadius) / 2;
    const segmentWidth = Math.max(0.01, screenRadius - radius);
    const segmentHeight = Math.max(0.01, (Math.PI * (radius + screenRadius)) / segmentCount);
    lines.push(
      `    mp.Block(center=mp.Vector3(${formatNumber(geometry.centerUm.x + Math.cos(mid) * radialCenter)}, ${formatNumber(geometry.centerUm.y + Math.sin(mid) * radialCenter)}, ${formatNumber(geometry.centerUm.z)}), size=mp.Vector3(${formatNumber(segmentWidth)}, ${formatNumber(segmentHeight)}, ${formatNumber(geometry.sizeUm.z)}), material=${materialExpr}, e1=mp.Vector3(${formatNumber(Math.cos(mid))}, ${formatNumber(Math.sin(mid))}, 0), e2=mp.Vector3(${formatNumber(-Math.sin(mid))}, ${formatNumber(Math.cos(mid))}, 0), e3=mp.Vector3(0, 0, 1)),`
    );
  }
  return lines;
}

function apertureMaterialExpr(geometry: FdtdGeometry): string {
  if (geometry.screenModel === "ideal-reflective-screen") return "mp.metal";
  return `materials[${quote(geometry.materialId)}]`;
}

function degToRad(value: number): number {
  return (value * Math.PI) / 180;
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
