import { useMemo, useState } from "react";
import {
  addSimulationBuilderElement,
  createAbsorbingFdtdExampleBundle,
  createAbsorbingFdtdExampleScenario,
  createSimulationBuilderElement,
  createTransparentFdtdExampleBundle,
  createTransparentFdtdExampleScenario,
  defaultSimulationBuilderScenario,
  exportFdtdBundleFromSimulationBuilder,
  fdtdFieldSliceToCsv,
  fdtdImportedRunJson,
  fdtdManifestJson,
  fdtdMeepScriptText,
  fdtdValidationMetricsCsv,
  fdtdValidationReportJson,
  fdtdValidationReportMarkdown,
  importFdtdRunArtifacts,
  l80ReleaseTrail,
  runSimulationBuilderScenario,
  simulationBuilderScenarioJson,
  simulationBuilderValidationMetricsCsv,
  simulationBuilderValidationReportJson,
  simulationBuilderValidationReportMarkdown,
  validateFdtdImportedRunAgainstScenario,
  type FdtdFieldSlice,
  type FdtdImportedRun,
  type FdtdValidationReport,
  type SimulationBuilderElementKind,
  type SimulationBuilderGrid,
  type SimulationBuilderScenario,
  type SimulationBuilderSource,
  type SimulationBuilderTarget,
  type SimulationBuilderTargetKind
} from "@emmicro/core";
import { FileDown, Plus, Sparkles } from "lucide-react";

const stepLabels = [
  ["grid", "1 Grid"],
  ["source", "2 Source"],
  ["elements", "3 Elements"],
  ["target", "4 Target / Material"],
  ["compute", "5 Compute"],
  ["validate", "6 Validate"]
] as const;

const elementActions: Array<{ kind: SimulationBuilderElementKind; label: string }> = [
  { kind: "circular-aperture", label: "Add aperture" },
  { kind: "ideal-lens", label: "Add ideal lens" },
  { kind: "material-interface", label: "Add material interface" },
  { kind: "material-slab", label: "Add material slab" },
  { kind: "mirror-surface", label: "Add mirror surface" },
  { kind: "absorbing-slab", label: "Add absorbing slab" },
  { kind: "curved-material-lens", label: "Add curved glass lens" }
];

function downloadText(filename: string, mime: string, text: string): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function SimulationBuilderPanel() {
  const [scenario, setScenario] = useState<SimulationBuilderScenario>(() => defaultSimulationBuilderScenario());
  const [hasComputed, setHasComputed] = useState(false);
  const [importedFdtd, setImportedFdtd] = useState<FdtdImportedRun | null>(null);
  const [fdtdImportError, setFdtdImportError] = useState<string | null>(null);
  const result = useMemo(() => runSimulationBuilderScenario(scenario), [scenario]);
  const fdtdBundle = useMemo(() => exportFdtdBundleFromSimulationBuilder(scenario), [scenario]);
  const fdtdValidation = useMemo<FdtdValidationReport | null>(
    () => (importedFdtd ? validateFdtdImportedRunAgainstScenario(scenario, fdtdBundle, importedFdtd) : null),
    [fdtdBundle, importedFdtd, scenario]
  );
  const zMin = Math.min(scenario.grid.zStartMm, ...result.axis.map((node) => node.zMm));
  const zMax = Math.max(scenario.observationPlaneZMm, scenario.grid.zEndMm, ...result.axis.map((node) => node.zMm));

  function updateGrid<K extends keyof SimulationBuilderGrid>(key: K, value: SimulationBuilderGrid[K]): void {
    setScenario((current) => ({ ...current, grid: { ...current.grid, [key]: value } }));
  }

  function updateSource<K extends keyof SimulationBuilderSource>(key: K, value: SimulationBuilderSource[K]): void {
    setScenario((current) => ({ ...current, source: { ...current.source, [key]: value } }));
  }

  function updateTarget<K extends keyof SimulationBuilderTarget>(key: K, value: SimulationBuilderTarget[K]): void {
    setScenario((current) => ({ ...current, target: { ...current.target, [key]: value } }));
  }

  function setTargetKind(kind: SimulationBuilderTargetKind): void {
    setScenario((current) => ({ ...current, target: targetForKind(kind, current.target.zMm) }));
  }

  function addElement(kind: SimulationBuilderElementKind): void {
    const nextZ = Math.min(scenario.observationPlaneZMm - 1, Math.max(...scenario.elements.map((element) => element.zMm), scenario.source.zMm) + 3);
    const labelSuffix = scenario.elements.filter((element) => element.kind === kind).length + 1;
    setScenario((current) => addSimulationBuilderElement(current, createSimulationBuilderElement(kind, nextZ, `${elementButtonLabel(kind)} ${labelSuffix}`)));
  }

  function exportScenario(): void {
    downloadText("simulation_builder_scenario.json", "application/json", simulationBuilderScenarioJson(scenario));
  }

  function exportValidationBundle(): void {
    downloadText("validation_report.md", "text/markdown", simulationBuilderValidationReportMarkdown(result));
    downloadText("validation_report.json", "application/json", simulationBuilderValidationReportJson(result));
    downloadText("validation_metrics.csv", "text/csv", simulationBuilderValidationMetricsCsv(result));
  }

  function exportFdtdManifest(): void {
    downloadText("fdtd_scene_manifest.json", "application/json", fdtdManifestJson(fdtdBundle.manifest));
  }

  function exportFdtdMeepScript(): void {
    downloadText("meep_scene.py", "text/x-python", fdtdMeepScriptText(fdtdBundle.script));
  }

  function exportFdtdImportEvidence(): void {
    if (!importedFdtd) return;
    downloadText("fdtd_imported_run.json", "application/json", fdtdImportedRunJson(importedFdtd));
    downloadText("fdtd_field_slice_xz.csv", "text/csv", `${fdtdFieldSliceToCsv(importedFdtd.fieldSlice)}\n`);
  }

  function exportFdtdValidationReport(): void {
    if (!fdtdValidation) return;
    downloadText("fdtd_validation_report.md", "text/markdown", fdtdValidationReportMarkdown(fdtdValidation));
    downloadText("fdtd_validation_report.json", "application/json", fdtdValidationReportJson(fdtdValidation));
    downloadText("fdtd_validation_metrics.csv", "text/csv", fdtdValidationMetricsCsv(fdtdValidation));
  }

  function loadTransparentFdtdFixture(): void {
    const example = createTransparentFdtdExampleBundle();
    setScenario(createTransparentFdtdExampleScenario());
    setImportedFdtd(example.imported);
    setFdtdImportError(null);
    setHasComputed(true);
  }

  function loadAbsorbingFdtdFixture(): void {
    const example = createAbsorbingFdtdExampleBundle();
    setScenario(createAbsorbingFdtdExampleScenario());
    setImportedFdtd(example.imported);
    setFdtdImportError(null);
    setHasComputed(true);
  }

  async function importFdtdArtifacts(files: FileList | null): Promise<void> {
    setFdtdImportError(null);
    if (!files || files.length === 0) return;
    const entries = await Promise.all(Array.from(files).map(async (file) => ({ name: file.name.toLowerCase(), text: await file.text() })));
    const receipt = entries.find((entry) => entry.name.includes("receipt") && entry.name.endsWith(".json"));
    const flux = entries.find((entry) => entry.name.includes("flux") && entry.name.endsWith(".json"));
    const fieldSlice = entries.find((entry) => entry.name.includes("slice") && entry.name.endsWith(".csv")) ?? entries.find((entry) => entry.name.endsWith(".csv"));
    if (!receipt || !flux || !fieldSlice) {
      setFdtdImportError("Select a run receipt JSON, flux summary JSON, and field slice CSV together.");
      return;
    }
    try {
      const imported = importFdtdRunArtifacts({
        receiptJson: receipt.text,
        fluxJson: flux.text,
        fieldSliceCsv: fieldSlice.text,
        fieldSlice: {
          id: "field-slice-xz",
          sourceScenarioHash: fdtdBundle.manifest.sourceScenarioHash,
          manifestHash: fdtdBundle.manifest.manifestHash
        }
      });
      setImportedFdtd(imported);
    } catch (error) {
      setFdtdImportError(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <section className="wave-panel simulation-builder-panel" aria-label="L8.1 Simulation Builder">
      <div className="maxwell-section-heading simulation-builder-title">
        <h2>L8.1 Sequential Optical Bench + External FDTD Field Maps</h2>
        <strong className={`maxwell-l72-status maxwell-l72-status-${result.validation.status}`}>{result.validation.status.toUpperCase()}</strong>
      </div>

      <div className="l2-disclosure">
        <strong>Simulation Builder</strong>
        <span>
          Define grid density, source, ordered z-axis elements, target/material surface, compute path, validation report, and L8.1 external FDTD export/import evidence. In-app execution remains
          limited to transparent, reflective, and absorbing planar surface/slab checks only; arbitrary 3D Maxwell material geometry, browser FDTD/FEM/BEM/RCWA execution, real curved material lens
          solving, sensor-stack EM, digital twin behavior, and manufacturing certification are not implemented.
        </span>
      </div>

      <div className="simulation-stepper" aria-label="Simulation Builder ordered steps">
        {stepLabels.map(([step, label]) => (
          <div className={`simulation-step simulation-step-${result.stepStatuses[step]}`} key={step}>
            <span>{label}</span>
            <strong>{result.stepStatuses[step]}</strong>
          </div>
        ))}
      </div>

      <div className="simulation-builder-layout">
        <div className="maxwell-workspace-panel simulation-builder-card" aria-label="L8.0 grid step">
          <div className="maxwell-section-heading">
            <h2>1 Grid</h2>
            <strong>{formatCompact(result.grid.estimatedVolumetricSamples)} samples</strong>
          </div>
          <div className="simulation-field-grid">
            <label>
              <span>Units</span>
              <select aria-label="Grid units" value={scenario.grid.units} onChange={(event) => updateGrid("units", event.currentTarget.value as SimulationBuilderGrid["units"])}>
                <option value="mm">mm</option>
                <option value="um">um</option>
                <option value="nm">nm</option>
              </select>
            </label>
            <NumberField label="Domain width" unit="um" value={scenario.grid.domainWidthUm} min={0.1} step={0.5} onChange={(value) => updateGrid("domainWidthUm", value)} />
            <NumberField label="Domain height" unit="um" value={scenario.grid.domainHeightUm} min={0.1} step={0.5} onChange={(value) => updateGrid("domainHeightUm", value)} />
            <NumberField label="z start" unit="mm" value={scenario.grid.zStartMm} step={0.5} onChange={(value) => updateGrid("zStartMm", value)} />
            <NumberField label="z end" unit="mm" value={scenario.grid.zEndMm} min={scenario.grid.zStartMm + 0.1} step={0.5} onChange={(value) => updateGrid("zEndMm", value)} />
            <NumberField label="Grid density" unit="pts/lambda" value={scenario.grid.pointsPerWavelength} min={1} step={1} onChange={(value) => updateGrid("pointsPerWavelength", value)} />
          </div>
          <div className="maxwell-data-table" aria-label="L8.0 grid density smoke preview">
            <div className="maxwell-study-list">
              <Stat label="dx / dy / dz" value={`${formatCompact(result.grid.dxNm)} nm`} />
              <Stat label="Samples x/y/z" value={`${result.grid.samplesX}/${result.grid.samplesY}/${result.grid.samplesZ}`} />
              <Stat label="Warning count" value={String(result.grid.warnings.length)} />
            </div>
          </div>
          <p className="simulation-builder-note">This grid controls the sampled field/intensity representation for this validation scene. Full 3D Maxwell volumetric solving is not executable in-app yet.</p>
        </div>

        <div className="maxwell-workspace-panel simulation-builder-card" aria-label="L8.0 source step">
          <div className="maxwell-section-heading">
            <h2>2 Source</h2>
            <strong>{scenario.source.wavelengthNm} nm</strong>
          </div>
          <div className="simulation-field-grid">
            <label>
              <span>Source type</span>
              <select aria-label="Source type" value={scenario.source.type} onChange={(event) => updateSource("type", event.currentTarget.value as SimulationBuilderSource["type"])}>
                <option value="plane-wave">plane wave</option>
                <option value="point-source">point source</option>
              </select>
            </label>
            <NumberField label="Wavelength" unit="nm" value={scenario.source.wavelengthNm} min={100} step={10} onChange={(value) => updateSource("wavelengthNm", value)} />
            <NumberField label="x" unit="um" value={scenario.source.xUm} step={0.5} onChange={(value) => updateSource("xUm", value)} />
            <NumberField label="y" unit="um" value={scenario.source.yUm} step={0.5} onChange={(value) => updateSource("yUm", value)} />
            <NumberField label="z" unit="mm" value={scenario.source.zMm} step={0.5} onChange={(value) => updateSource("zMm", value)} />
            <label>
              <span>Coherence</span>
              <select aria-label="Source coherence" value={scenario.source.coherence} onChange={(event) => updateSource("coherence", event.currentTarget.value as SimulationBuilderSource["coherence"])}>
                <option value="coherent">coherent</option>
                <option value="incoherent">incoherent</option>
                <option value="partial">partial</option>
              </select>
            </label>
          </div>
        </div>

        <div className="maxwell-workspace-panel simulation-builder-card simulation-builder-wide" aria-label="L8.0 optical elements step">
          <div className="maxwell-section-heading">
            <h2>3 Optical Elements</h2>
            <strong>{result.orderedElements.length} placed</strong>
          </div>
          <div className="maxwell-layer-actions simulation-builder-actions">
            {elementActions.map((action) => (
              <button type="button" key={action.kind} onClick={() => addElement(action.kind)}>
                <Plus size={15} />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
          <div className="simulation-elements-table" aria-label="L8.0 ordered element list smoke preview">
            <div className="simulation-elements-row simulation-elements-header">
              <span>Order</span>
              <span>Element</span>
              <span>z mm</span>
              <span>Size / thickness</span>
              <span>Model</span>
              <span>Status</span>
            </div>
            {result.orderedElements.map((element, index) => (
              <div className="simulation-elements-row" key={element.id}>
                <span>{index + 1}</span>
                <strong>{element.label}</strong>
                <span>{formatCompact(element.zMm)}</span>
                <span>{element.apertureDiameterUm ? `${element.apertureDiameterUm} um` : element.thicknessUm ? `${element.thicknessUm} um` : element.focalLengthMm ? `f=${element.focalLengthMm} mm` : "-"}</span>
                <span>{element.model}</span>
                <em className={`simulation-capability simulation-capability-${element.status}`}>{element.status}</em>
              </div>
            ))}
          </div>
        </div>

        <div className="maxwell-workspace-panel simulation-builder-card simulation-builder-wide" aria-label="L8.0 optical axis diagram">
          <div className="maxwell-section-heading">
            <h2>Optical Axis Placement</h2>
            <strong>{formatCompact(zMin)}-{formatCompact(zMax)} mm</strong>
          </div>
          <div className="simulation-axis" aria-label="L8.0 optical-axis diagram smoke preview">
            <div className="simulation-axis-line" />
            {result.axis.map((node) => {
              const left = zMax === zMin ? 0 : ((node.zMm - zMin) / (zMax - zMin)) * 100;
              return (
                <div className={`simulation-axis-node simulation-axis-node-${node.kind}`} key={node.id} style={{ left: `${Math.max(0, Math.min(100, left))}%` }}>
                  <span>{node.label}</span>
                  <strong>{formatCompact(node.zMm)} mm</strong>
                  <em>{node.status}</em>
                </div>
              );
            })}
          </div>
        </div>

        <div className="maxwell-workspace-panel simulation-builder-card" aria-label="L8.0 target material step">
          <div className="maxwell-section-heading">
            <h2>4 Target / Material</h2>
            <strong>{targetDisplayName(scenario.target.kind)}</strong>
          </div>
          <div className="simulation-field-grid">
            <label>
              <span>Target case</span>
              <select aria-label="Target case" value={scenario.target.kind} onChange={(event) => setTargetKind(event.currentTarget.value as SimulationBuilderTargetKind)}>
                <option value="transparent-dielectric">transparent dielectric</option>
                <option value="mirror">mirror surface</option>
                <option value="absorbing-slab">absorbing slab</option>
              </select>
            </label>
            <NumberField label="Target z" unit="mm" value={scenario.target.zMm} step={0.5} onChange={(value) => updateTarget("zMm", value)} />
            {scenario.target.kind === "transparent-dielectric" && (
              <>
                <NumberField label="n incident" value={scenario.target.incidentIndex} min={0.1} step={0.01} onChange={(value) => updateTarget("incidentIndex", value)} />
                <NumberField label="n substrate" value={scenario.target.substrateIndex} min={0.1} step={0.01} onChange={(value) => updateTarget("substrateIndex", value)} />
              </>
            )}
            {scenario.target.kind === "absorbing-slab" && (
              <>
                <NumberField label="alpha" unit="1/m" value={scenario.target.absorptionCoefficientPerM} min={0} step={500} onChange={(value) => updateTarget("absorptionCoefficientPerM", value)} />
                <NumberField label="Thickness" unit="um" value={scenario.target.thicknessUm} min={0} step={10} onChange={(value) => updateTarget("thicknessUm", value)} />
              </>
            )}
          </div>
        </div>

        <div className="maxwell-workspace-panel simulation-builder-card" aria-label="L8.0 compute and validate step">
          <div className="maxwell-section-heading">
            <h2>5 Compute / 6 Validate</h2>
            <strong>{hasComputed ? "computed" : "ready"}</strong>
          </div>
          <div className="maxwell-layer-actions simulation-builder-actions">
            <button type="button" onClick={() => setHasComputed(true)}>
              <Sparkles size={15} />
              <span>Compute Surface Validation</span>
            </button>
            <button type="button" onClick={exportScenario}>
              <FileDown size={15} />
              <span>Export Scenario JSON</span>
            </button>
            <button type="button" onClick={exportValidationBundle}>
              <FileDown size={15} />
              <span>Export Validation Report</span>
            </button>
          </div>
          <div className="maxwell-data-table" aria-label="L8.0 surface validation smoke preview">
            <div className="maxwell-study-list">
              <Stat label="Solver path" value={result.validation.solverPath} />
              <Stat label="Computed R/T/A" value={`${pct(result.validation.computed.reflectance)} / ${pct(result.validation.computed.transmittance)} / ${pct(result.validation.computed.absorbance)}`} />
              <Stat label="Expected R/T/A" value={`${pct(result.validation.expected.reflectance)} / ${pct(result.validation.expected.transmittance)} / ${pct(result.validation.expected.absorbance)}`} />
              <Stat label="Energy balance" value={`${formatCompact(result.validation.energyBalance)} (${result.validation.status})`} />
              <Stat label="Residual R/T/A" value={`${formatCompact(result.validation.residuals.reflectance)} / ${formatCompact(result.validation.residuals.transmittance)} / ${formatCompact(result.validation.residuals.absorbance)}`} />
            </div>
          </div>
          <div className="simulation-bars" aria-label="L8.0 R T A field intensity preview">
            <Bar label="R" value={result.validation.computed.reflectance} />
            <Bar label="T" value={result.validation.computed.transmittance} />
            <Bar label="A" value={result.validation.computed.absorbance} />
          </div>
          <p className="simulation-builder-note">{result.validation.analyticReference}</p>
        </div>

        <div className="maxwell-workspace-panel simulation-builder-card simulation-builder-wide" aria-label="L8.1 External FDTD / Field Maps">
          <div className="maxwell-section-heading">
            <h2>L8.1 External FDTD / Field Maps</h2>
            <strong>{fdtdReadinessLabel(fdtdBundle.manifest.readiness.status)}</strong>
          </div>
          <div className="l2-disclosure">
            <strong>External FDTD export/import only.</strong>
            <span>
              Export a manifest and deterministic Meep helper script, then import external run receipt, flux summary, and field-slice CSV evidence. The browser app does not execute FDTD;
              arbitrary 3D CAD geometry, curved material lens solving, finite-thickness metal aperture Maxwell solving, FEM/BEM/RCWA, sensor-stack EM, digital twin behavior, and manufacturing
              certification are not implemented.
            </span>
          </div>
          <div className="maxwell-layer-actions simulation-builder-actions fdtd-action-row">
            <button type="button" onClick={exportFdtdManifest}>
              <FileDown size={15} />
              <span>Export FDTD Manifest</span>
            </button>
            <button type="button" onClick={exportFdtdMeepScript}>
              <FileDown size={15} />
              <span>Export Meep Script</span>
            </button>
            <button type="button" onClick={loadTransparentFdtdFixture}>
              <Sparkles size={15} />
              <span>Load Transparent FDTD Fixture</span>
            </button>
            <button type="button" onClick={loadAbsorbingFdtdFixture}>
              <Sparkles size={15} />
              <span>Load Absorbing FDTD Fixture</span>
            </button>
            <label className="fdtd-file-import">
              <span>Import Field Run</span>
              <input aria-label="Import FDTD receipt flux and field slice" type="file" accept=".json,.csv" multiple onChange={(event) => void importFdtdArtifacts(event.currentTarget.files)} />
            </label>
            <button type="button" disabled={!importedFdtd} onClick={exportFdtdImportEvidence}>
              <FileDown size={15} />
              <span>Export FDTD Import Evidence</span>
            </button>
            <button type="button" disabled={!fdtdValidation} onClick={exportFdtdValidationReport}>
              <FileDown size={15} />
              <span>Export FDTD Validation</span>
            </button>
          </div>
          {fdtdImportError && <div className="error-banner">{fdtdImportError}</div>}
          <div className="fdtd-grid">
            <div className="maxwell-data-table" aria-label="L8.1 FDTD export readiness smoke preview">
              <div className="maxwell-study-list">
                <Stat label="Readiness" value={fdtdReadinessLabel(fdtdBundle.manifest.readiness.status)} />
                <Stat label="Scene hash" value={fdtdBundle.manifest.sourceScenarioHash.slice(0, 10)} />
                <Stat label="Manifest hash" value={fdtdBundle.manifest.manifestHash.slice(0, 10)} />
                <Stat label="Grid spacing" value={`${formatCompact(fdtdBundle.manifest.grid.gridSpacingNm)} nm`} />
                <Stat label="Estimated cells" value={formatCompact(fdtdBundle.manifest.grid.estimatedCells)} />
                <Stat label="Geometry blocks" value={String(fdtdBundle.manifest.geometry.length)} />
                <Stat label="Monitors" value={String(fdtdBundle.manifest.monitors.length)} />
                <Stat label="Warnings" value={String(fdtdBundle.manifest.readiness.warnings.length)} />
              </div>
            </div>

            <div className="maxwell-data-table" aria-label="L8.1 Meep script export smoke preview">
              <div className="maxwell-study-list">
                <Stat label="Script hash" value={fdtdBundle.script.scriptHash.slice(0, 10)} />
                <Stat label="Python lines" value={String(fdtdBundle.script.python.split("\n").length)} />
                <Stat label="PML thickness" value={`${formatCompact(fdtdBundle.manifest.boundaries.pmlThicknessUm)} um`} />
                <Stat label="Source component" value={fdtdBundle.manifest.source.component} />
              </div>
              <pre className="fdtd-script-preview">{fdtdBundle.script.python.split("\n").slice(0, 8).join("\n")}</pre>
            </div>

            <div className="maxwell-data-table" aria-label="L8.1 field slice import smoke preview">
              <div className="maxwell-section-heading">
                <h2>Imported Field Slice</h2>
                <strong>{importedFdtd ? `${importedFdtd.fieldSlice.xCount} x ${importedFdtd.fieldSlice.zCount}` : "no import"}</strong>
              </div>
              {importedFdtd ? <FdtdFieldSlicePreview slice={importedFdtd.fieldSlice} /> : <div className="empty-state">No external FDTD field slice imported yet.</div>}
            </div>

            <div className="maxwell-data-table" aria-label="L8.1 FDTD flux validation smoke preview">
              <div className="maxwell-study-list">
                <Stat label="Imported run" value={importedFdtd?.receipt.runId ?? "none"} />
                <Stat label="Validation" value={fdtdValidation?.status ?? "pending"} />
                <Stat label="Imported R/T/A" value={fdtdValidation ? `${pct(fdtdValidation.imported.reflectance)} / ${pct(fdtdValidation.imported.transmittance)} / ${pct(fdtdValidation.imported.absorbance)}` : "n/a"} />
                <Stat label="L8.0 expected R/T/A" value={fdtdValidation ? `${pct(fdtdValidation.expected.reflectance)} / ${pct(fdtdValidation.expected.transmittance)} / ${pct(fdtdValidation.expected.absorbance)}` : "n/a"} />
                <Stat label="Energy balance" value={fdtdValidation ? `${formatCompact(fdtdValidation.energyBalance)} (${formatCompact(fdtdValidation.residuals.energyBalance)} residual)` : "n/a"} />
                <Stat label="Report hash" value={fdtdValidation?.reportHash.slice(0, 10) ?? "n/a"} />
              </div>
            </div>

            <div className="maxwell-data-table fdtd-wide" aria-label="L8.1 unsupported geometry warning smoke preview">
              <div className="maxwell-section-heading">
                <h2>FDTD Boundary / Unsupported Geometry</h2>
                <strong>{fdtdBundle.manifest.readiness.unsupported.length} blocked</strong>
              </div>
              <div className="fdtd-warning-list">
                {fdtdBundle.manifest.readiness.unsupported.length === 0 ? (
                  <span>No blocked geometry in the current export. Placement-only scalar elements and large grids may still emit warnings.</span>
                ) : (
                  fdtdBundle.manifest.readiness.unsupported.map((item) => (
                    <span key={item.id}>
                      <strong>{item.label}</strong> {item.reason}
                    </span>
                  ))
                )}
                {fdtdBundle.manifest.readiness.warnings.map((warning) => (
                  <span key={`${warning.code}:${warning.elementId ?? ""}`}>
                    <strong>{warning.code}</strong> {warning.message}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="simulation-builder-footer">
        <div className="maxwell-workspace-panel simulation-builder-card" aria-label="L8.0 capabilities matrix delta">
          <div className="maxwell-section-heading">
            <h2>Capability Tags</h2>
            <strong>explicit</strong>
          </div>
          <div className="simulation-capability-list">
            {result.capabilitySummary.slice(0, 8).map((capability) => (
              <div className="compact-stat" key={capability.id}>
                <span>{capability.label}</span>
                <strong>{capability.status}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="maxwell-workspace-panel simulation-builder-card" aria-label="What has been added since first review?">
          <div className="maxwell-section-heading">
            <h2>What has been added since first review?</h2>
            <strong>runnable milestones</strong>
          </div>
          <div className="l2-disclosure">
            <strong>Iteration count is not validation.</strong>
            <span>Each item below maps to a runnable benchmark, report, or workflow category.</span>
          </div>
          <div className="simulation-release-trail">
            {l80ReleaseTrail.map((item) => (
              <div className="compact-stat" key={item.milestone}>
                <span>{item.milestone} {item.label}</span>
                <strong>{item.runnable}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function NumberField(props: { label: string; value: number; unit?: string; min?: number; step?: number; onChange: (value: number) => void }) {
  return (
    <label>
      <span>{props.label}</span>
      <input
        aria-label={props.label}
        type="number"
        value={Number.isFinite(props.value) ? props.value : 0}
        min={props.min}
        step={props.step ?? 1}
        onChange={(event) => props.onChange(Number(event.currentTarget.value))}
      />
      {props.unit && <em>{props.unit}</em>}
    </label>
  );
}

function Stat(props: { label: string; value: string }) {
  return (
    <div className="compact-stat">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

function Bar(props: { label: string; value: number }) {
  return (
    <div className="simulation-bar">
      <span>{props.label}</span>
      <div>
        <strong style={{ width: `${Math.max(0, Math.min(100, props.value * 100))}%` }} />
      </div>
      <em>{pct(props.value)}</em>
    </div>
  );
}

function FdtdFieldSlicePreview(props: { slice: FdtdFieldSlice }) {
  const range = Math.max(1e-12, props.slice.maxIntensity - props.slice.minIntensity);
  return (
    <div
      className="fdtd-field-map"
      style={{ gridTemplateColumns: `repeat(${props.slice.xCount}, minmax(0, 1fr))` }}
      aria-label="Imported FDTD field intensity map"
    >
      {props.slice.samples.map((sample, index) => {
        const normalized = (sample.intensity - props.slice.minIntensity) / range;
        return (
          <span
            key={`${sample.xUm}:${sample.zUm}:${index}`}
            title={`x ${formatCompact(sample.xUm)} um, z ${formatCompact(sample.zUm)} um, I ${formatCompact(sample.intensity)}`}
            style={{ opacity: 0.28 + normalized * 0.72 }}
          />
        );
      })}
    </div>
  );
}

function targetForKind(kind: SimulationBuilderTargetKind, zMm: number): SimulationBuilderTarget {
  if (kind === "mirror") {
    return {
      kind,
      label: "Ideal mirror / PEC-like reflector",
      zMm,
      incidentIndex: 1,
      substrateIndex: 1,
      extinctionCoefficient: 0,
      absorptionCoefficientPerM: 0,
      thicknessUm: 0
    };
  }
  if (kind === "absorbing-slab") {
    return {
      kind,
      label: "Beer-Lambert absorbing slab",
      zMm,
      incidentIndex: 1,
      substrateIndex: 1,
      extinctionCoefficient: 0,
      absorptionCoefficientPerM: 5000,
      thicknessUm: 100
    };
  }
  return {
    kind,
    label: "Air to glass transparent dielectric interface",
    zMm,
    incidentIndex: 1,
    substrateIndex: 1.5,
    extinctionCoefficient: 0,
    absorptionCoefficientPerM: 0,
    thicknessUm: 0
  };
}

function elementButtonLabel(kind: SimulationBuilderElementKind): string {
  if (kind === "circular-aperture") return "Aperture";
  if (kind === "ideal-lens") return "Ideal lens";
  if (kind === "material-interface") return "Interface";
  if (kind === "material-slab") return "Material slab";
  if (kind === "mirror-surface") return "Mirror";
  if (kind === "absorbing-slab") return "Absorber";
  if (kind === "curved-material-lens") return "Curved lens";
  return "Unsupported element";
}

function targetDisplayName(kind: SimulationBuilderTargetKind): string {
  if (kind === "mirror") return "mirror";
  if (kind === "absorbing-slab") return "absorber";
  return "transparent";
}

function fdtdReadinessLabel(status: "ready" | "warning" | "blocked"): string {
  if (status === "blocked") return "blocked";
  if (status === "warning") return "exportable with warnings";
  return "exportable";
}

function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return "n/a";
  if (value === 0) return "0";
  if (Math.abs(value) >= 100000 || Math.abs(value) < 0.001) return value.toExponential(3);
  return value.toPrecision(4);
}

function pct(value: number): string {
  return `${(value * 100).toFixed(value > 0.995 ? 2 : 3)}%`;
}
