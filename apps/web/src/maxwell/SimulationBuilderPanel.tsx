import { useMemo, useState } from "react";
import {
  addSimulationBuilderElement,
  createAbsorbingFdtdExampleBundle,
  createAbsorbingFdtdExampleScenario,
  createFdtdBenchmarkExampleBundle,
  createFdtdBenchmarkPack,
  createFdtdBenchmarkScenario,
  createSimulationBuilderElement,
  createTransparentFdtdExampleBundle,
  createTransparentFdtdExampleScenario,
  defaultSimulationBuilderScenario,
  fdtdBenchmarkManifestJson,
  fdtdBenchmarkReportJson,
  fdtdBenchmarkReportMarkdown,
  fdtdConvergenceMetricsCsv,
  fdtdConvergenceSummaryJson,
  exportFdtdBundleFromSimulationBuilder,
  fdtdFieldSliceToCsv,
  fdtdImportedRunJson,
  fdtdManifestJson,
  fdtdMeepScriptText,
  fdtdRunTableCsv,
  fdtdSweepPlanJson,
  fdtdValidationMetricsCsv,
  fdtdValidationReportJson,
  fdtdValidationReportMarkdown,
  importFdtdRunArtifacts,
  importFdtdConvergenceBundleArtifacts,
  l80ReleaseTrail,
  runSimulationBuilderScenario,
  simulationBuilderScenarioJson,
  simulationBuilderValidationMetricsCsv,
  simulationBuilderValidationReportJson,
  simulationBuilderValidationReportMarkdown,
  validateFdtdImportedRunAgainstScenario,
  type FdtdBenchmarkKind,
  type FdtdConvergenceSummary,
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
  const [benchmarkKind, setBenchmarkKind] = useState<FdtdBenchmarkKind>("transparent-interface");
  const [hasGeneratedBenchmarkPlan, setHasGeneratedBenchmarkPlan] = useState(true);
  const [fdtdConvergence, setFdtdConvergence] = useState<FdtdConvergenceSummary | null>(null);
  const [fdtdConvergenceError, setFdtdConvergenceError] = useState<string | null>(null);
  const result = useMemo(() => runSimulationBuilderScenario(scenario), [scenario]);
  const fdtdBundle = useMemo(() => exportFdtdBundleFromSimulationBuilder(scenario), [scenario]);
  const fdtdBenchmarkPack = useMemo(() => createFdtdBenchmarkPack({ benchmarkKind, scenario }), [benchmarkKind, scenario]);
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

  function selectBenchmarkKind(kind: FdtdBenchmarkKind): void {
    setBenchmarkKind(kind);
    setScenario(createFdtdBenchmarkScenario(kind));
    setFdtdConvergence(null);
    setFdtdConvergenceError(null);
    setHasGeneratedBenchmarkPlan(true);
    setHasComputed(true);
  }

  function exportFdtdBenchmarkPack(): void {
    downloadText("fdtd_benchmark_manifest.json", "application/json", fdtdBenchmarkManifestJson(fdtdBenchmarkPack.benchmarkManifest));
    downloadText("fdtd_sweep_plan.json", "application/json", fdtdSweepPlanJson(fdtdBenchmarkPack.sweepPlan));
    downloadText("fdtd_expected_reference.json", "application/json", fdtdBenchmarkPack.expectedReferenceJson);
    downloadText("fdtd_benchmark_readme.md", "text/markdown", `${fdtdBenchmarkPack.readme}\n`);
    if (fdtdBenchmarkPack.scripts[0]) {
      downloadText("fdtd_benchmark_first_run_meep.py", "text/x-python", fdtdBenchmarkPack.scripts[0].export.python);
    }
  }

  function loadFdtdBenchmarkFixture(kind: FdtdBenchmarkKind): void {
    const example = createFdtdBenchmarkExampleBundle(kind, kind === "absorbing-slab" ? { pmlSensitive: true } : {});
    setBenchmarkKind(kind);
    setScenario(createFdtdBenchmarkScenario(kind));
    setFdtdConvergence(example.convergenceSummary);
    setFdtdConvergenceError(null);
    setHasGeneratedBenchmarkPlan(true);
    setHasComputed(true);
  }

  function exportFdtdBenchmarkDossier(): void {
    if (!fdtdConvergence) return;
    downloadText("fdtd_benchmark_report.md", "text/markdown", fdtdBenchmarkReportMarkdown(fdtdConvergence));
    downloadText("fdtd_benchmark_report.json", "application/json", fdtdBenchmarkReportJson(fdtdConvergence));
    downloadText("fdtd_convergence_metrics.csv", "text/csv", `${fdtdConvergenceMetricsCsv(fdtdConvergence)}\n`);
    downloadText("fdtd_run_table.csv", "text/csv", `${fdtdRunTableCsv(fdtdConvergence)}\n`);
  }

  async function importFdtdConvergence(files: FileList | null): Promise<void> {
    setFdtdConvergenceError(null);
    if (!files || files.length === 0) return;
    const entries = await Promise.all(Array.from(files).map(async (file) => ({ name: file.name.toLowerCase(), text: await file.text() })));
    const convergence = entries.find((entry) => entry.name.includes("convergence") && entry.name.endsWith(".json")) ?? entries.find((entry) => entry.name.endsWith(".json"));
    const flux = entries.find((entry) => entry.name.includes("flux") && entry.name.endsWith(".json"));
    if (!convergence) {
      setFdtdConvergenceError("Select convergence_summary.json, optionally with flux_summaries.json.");
      return;
    }
    try {
      const imported = importFdtdConvergenceBundleArtifacts({
        convergenceSummaryJson: convergence.text,
        fluxSummariesJson: flux?.text,
        expectedPack: fdtdBenchmarkPack
      });
      setFdtdConvergence(imported);
    } catch (error) {
      setFdtdConvergenceError(error instanceof Error ? error.message : String(error));
    }
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
    <section className="wave-panel simulation-builder-panel" aria-label="L8.2 Simulation Builder">
      <div className="maxwell-section-heading simulation-builder-title">
        <h2>L8.2 Sequential Optical Bench + External FDTD Benchmark Convergence</h2>
        <strong className={`maxwell-l72-status maxwell-l72-status-${result.validation.status}`}>{result.validation.status.toUpperCase()}</strong>
      </div>

      <div className="l2-disclosure">
        <strong>Simulation Builder</strong>
        <span>
          Define grid density, source, ordered z-axis elements, target/material surface, compute path, validation report, L8.1 field-map import evidence, and L8.2 benchmark convergence diagnostics. In-app
          execution remains limited to transparent, reflective, and absorbing planar surface/slab checks only; arbitrary 3D Maxwell material geometry, browser FDTD/FEM/BEM/RCWA execution, real curved
          material lens solving, sensor-stack EM, digital twin behavior, and manufacturing certification are not implemented.
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

        <div className="maxwell-workspace-panel simulation-builder-card simulation-builder-wide" aria-label="L8.2 External FDTD / Field Maps">
          <div className="maxwell-section-heading">
            <h2>L8.2 External FDTD / Field Maps</h2>
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

          <div className="fdtd-verification-suite" aria-label="L8.2 FDTD benchmark suite smoke preview">
            <div className="maxwell-section-heading">
              <h2>L8.2 FDTD Verification Suite</h2>
              <strong>{fdtdConvergence?.status ?? "ready"}</strong>
            </div>
            <div className="l2-disclosure">
              <strong>Benchmark convergence evidence, not new in-browser physics.</strong>
              <span>
                Generate bounded external FDTD benchmark packs, import convergence summaries, compare against flux conservation, Fresnel/TMM, Beer-Lambert, or mirror references, and flag residual,
                energy-balance, trend, and PML sensitivity issues. Browser FDTD execution, arbitrary 3D Maxwell/CAD solving, FEM/BEM/RCWA, curved material lens solving, and production solver
                validation are not implemented.
              </span>
            </div>
            <div className="simulation-field-grid fdtd-verification-controls">
              <label>
                <span>Benchmark</span>
                <select aria-label="FDTD benchmark" value={benchmarkKind} onChange={(event) => selectBenchmarkKind(event.currentTarget.value as FdtdBenchmarkKind)}>
                  <option value="empty-space">empty space</option>
                  <option value="transparent-interface">transparent interface</option>
                  <option value="transparent-slab">transparent slab</option>
                  <option value="absorbing-slab">absorbing slab</option>
                  <option value="mirror">ideal mirror</option>
                </select>
              </label>
              <button type="button" onClick={() => setHasGeneratedBenchmarkPlan(true)}>
                <Sparkles size={15} />
                <span>Generate Sweep Plan</span>
              </button>
              <button type="button" onClick={exportFdtdBenchmarkPack}>
                <FileDown size={15} />
                <span>Export Benchmark Pack</span>
              </button>
              <button type="button" onClick={() => loadFdtdBenchmarkFixture("transparent-interface")}>
                <Sparkles size={15} />
                <span>Load Transparent Convergence Fixture</span>
              </button>
              <button type="button" onClick={() => loadFdtdBenchmarkFixture("absorbing-slab")}>
                <Sparkles size={15} />
                <span>Load Absorber Convergence Fixture</span>
              </button>
              <label className="fdtd-file-import">
                <span>Import Convergence</span>
                <input aria-label="Import FDTD convergence summary" type="file" accept=".json" multiple onChange={(event) => void importFdtdConvergence(event.currentTarget.files)} />
              </label>
              <button type="button" disabled={!fdtdConvergence} onClick={exportFdtdBenchmarkDossier}>
                <FileDown size={15} />
                <span>Export Benchmark Dossier</span>
              </button>
            </div>
            {fdtdConvergenceError && <div className="error-banner">{fdtdConvergenceError}</div>}

            <div className="fdtd-grid">
              <div className="maxwell-data-table" aria-label="L8.2 sweep plan smoke preview">
                <div className="maxwell-section-heading">
                  <h2>Sweep Plan</h2>
                  <strong>{hasGeneratedBenchmarkPlan ? `${fdtdBenchmarkPack.sweepPlan.runCount} runs` : "pending"}</strong>
                </div>
                <div className="maxwell-study-list">
                  <Stat label="Reference" value={fdtdBenchmarkPack.benchmarkManifest.reference.referenceModel} />
                  <Stat label="Expected R/T/A" value={`${pct(fdtdBenchmarkPack.benchmarkManifest.reference.expected.reflectance)} / ${pct(fdtdBenchmarkPack.benchmarkManifest.reference.expected.transmittance)} / ${pct(fdtdBenchmarkPack.benchmarkManifest.reference.expected.absorbance)}`} />
                  <Stat label="Resolution ppw" value={fdtdBenchmarkPack.sweepPlan.settings.resolutionPointsPerWavelength.join(", ")} />
                  <Stat label="PML um" value={fdtdBenchmarkPack.sweepPlan.settings.pmlThicknessUm.join(", ")} />
                  <Stat label="Padding lambda" value={fdtdBenchmarkPack.sweepPlan.settings.paddingWavelengths.join(", ")} />
                  <Stat label="Sweep hash" value={fdtdBenchmarkPack.sweepPlan.sweepHash.slice(0, 10)} />
                </div>
                <div className="fdtd-sweep-table">
                  <div className="fdtd-sweep-row fdtd-sweep-header">
                    <span>run</span>
                    <span>ppw</span>
                    <span>PML</span>
                    <span>pad</span>
                    <span>cells</span>
                  </div>
                  {fdtdBenchmarkPack.sweepPlan.runs.slice(0, 6).map((run) => (
                    <div className="fdtd-sweep-row" key={run.runId}>
                      <span>{run.index + 1}</span>
                      <span>{run.resolutionPointsPerWavelength}</span>
                      <span>{formatCompact(run.pmlThicknessUm)}</span>
                      <span>{formatCompact(run.paddingWavelengths)}</span>
                      <span>{formatCompact(run.estimatedCells)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="maxwell-data-table" aria-label="L8.2 convergence import smoke preview">
                <div className="maxwell-section-heading">
                  <h2>Convergence Summary</h2>
                  <strong>{fdtdConvergence?.status ?? "no import"}</strong>
                </div>
                <div className="maxwell-study-list">
                  <Stat label="Benchmark" value={fdtdConvergence ? benchmarkDisplayName(fdtdConvergence.benchmarkKind) : benchmarkDisplayName(benchmarkKind)} />
                  <Stat label="Trend" value={fdtdConvergence?.trend.status ?? "pending"} />
                  <Stat label="Final residual" value={fdtdConvergence ? formatCompact(fdtdConvergence.trend.finalReferenceResidual) : "n/a"} />
                  <Stat label="Energy error" value={fdtdConvergence ? formatCompact(fdtdConvergence.trend.finalEnergyBalanceError) : "n/a"} />
                  <Stat label="PML sensitivity" value={fdtdConvergence ? `${formatCompact(fdtdConvergence.pmlSensitivity.maxDelta)} (${fdtdConvergence.pmlSensitivity.status})` : "n/a"} />
                  <Stat label="Summary hash" value={fdtdConvergence?.summaryHash.slice(0, 10) ?? "n/a"} />
                </div>
              </div>

              <div className="maxwell-data-table" aria-label="L8.2 Fresnel convergence smoke preview">
                <div className="maxwell-section-heading">
                  <h2>Residual vs Resolution</h2>
                  <strong>{fdtdConvergence ? fdtdConvergence.trend.status : "pending"}</strong>
                </div>
                {fdtdConvergence ? <FdtdConvergenceTrendTable summary={fdtdConvergence} /> : <div className="empty-state">Load or import a convergence summary to inspect residual-vs-resolution evidence.</div>}
              </div>

              <div className="maxwell-data-table" aria-label="L8.2 absorber convergence smoke preview">
                <div className="maxwell-section-heading">
                  <h2>Reference Comparison</h2>
                  <strong>{fdtdConvergence?.reference.referenceModel ?? fdtdBenchmarkPack.benchmarkManifest.reference.referenceModel}</strong>
                </div>
                <div className="maxwell-study-list">
                  <Stat label="Invariant" value={fdtdConvergence?.reference.invariant ?? fdtdBenchmarkPack.benchmarkManifest.reference.invariant} />
                  <Stat label="Pass residual" value={formatCompact(fdtdBenchmarkPack.benchmarkManifest.reference.thresholds.referenceResidualPass)} />
                  <Stat label="Warning residual" value={formatCompact(fdtdBenchmarkPack.benchmarkManifest.reference.thresholds.referenceResidualWarning)} />
                  <Stat label="Field delta warn" value={formatCompact(fdtdBenchmarkPack.benchmarkManifest.reference.thresholds.fieldDeltaWarning)} />
                </div>
              </div>

              <div className="maxwell-data-table fdtd-wide" aria-label="L8.2 PML warning smoke preview">
                <div className="maxwell-section-heading">
                  <h2>PML / Stability Warnings</h2>
                  <strong>{fdtdConvergence?.warnings.length ?? fdtdBenchmarkPack.sweepPlan.warnings.length}</strong>
                </div>
                <div className="fdtd-warning-list">
                  {(fdtdConvergence?.warnings.length ? fdtdConvergence.warnings : fdtdBenchmarkPack.sweepPlan.warnings).map((warning, index) => (
                    <span key={`${warning.code}:${warning.elementId ?? ""}:${index}`}>
                      <strong>{warning.code}</strong> {warning.message}
                    </span>
                  ))}
                  {!fdtdConvergence && fdtdBenchmarkPack.sweepPlan.warnings.length === 0 && <span>No convergence warning imported yet.</span>}
                </div>
              </div>

              <div className="maxwell-data-table fdtd-wide" aria-label="L8.2 convergence run table smoke preview">
                <div className="maxwell-section-heading">
                  <h2>Run Residual Table</h2>
                  <strong>{fdtdConvergence ? `${fdtdConvergence.runs.length} runs` : "pending"}</strong>
                </div>
                {fdtdConvergence ? <FdtdConvergenceRunsTable summary={fdtdConvergence} /> : <div className="empty-state">No convergence run table imported yet.</div>}
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

function FdtdConvergenceTrendTable(props: { summary: FdtdConvergenceSummary }) {
  return (
    <div className="fdtd-sweep-table">
      <div className="fdtd-sweep-row fdtd-sweep-header">
        <span>ppw</span>
        <span>residual</span>
        <span>energy</span>
        <span>field</span>
        <span>runs</span>
      </div>
      {props.summary.trend.rows.map((row) => (
        <div className="fdtd-sweep-row" key={row.resolutionPointsPerWavelength}>
          <span>{row.resolutionPointsPerWavelength}</span>
          <span>{formatCompact(row.meanReferenceResidual)}</span>
          <span>{formatCompact(row.maxEnergyBalanceError)}</span>
          <span>{formatCompact(row.meanFieldSliceDelta)}</span>
          <span>{row.runCount}</span>
        </div>
      ))}
    </div>
  );
}

function FdtdConvergenceRunsTable(props: { summary: FdtdConvergenceSummary }) {
  return (
    <div className="fdtd-run-table">
      <div className="fdtd-run-row fdtd-run-header">
        <span>run</span>
        <span>ppw</span>
        <span>PML</span>
        <span>R/T/A</span>
        <span>residual</span>
        <span>status</span>
      </div>
      {props.summary.runs.slice(0, 9).map((run) => (
        <div className="fdtd-run-row" key={run.runId}>
          <span>{run.runId}</span>
          <span>{run.resolutionPointsPerWavelength}</span>
          <span>{formatCompact(run.pmlThicknessUm)}</span>
          <span>{`${pct(run.imported.reflectance)} / ${pct(run.imported.transmittance)} / ${pct(run.imported.absorbance)}`}</span>
          <span>{formatCompact(run.residuals.referenceResidual)}</span>
          <span>{run.status}</span>
        </div>
      ))}
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

function benchmarkDisplayName(kind: FdtdBenchmarkKind): string {
  if (kind === "empty-space") return "empty space";
  if (kind === "transparent-interface") return "transparent interface";
  if (kind === "transparent-slab") return "transparent slab";
  if (kind === "absorbing-slab") return "absorbing slab";
  return "ideal mirror";
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
