import { useMemo, useState } from "react";
import {
  auditMaterialCatalog,
  createMaterialImportTemplate,
  listL4SpectralMaterials,
  parseMaterialImportJson,
  runCoatingStack,
  runCoatingDesignFoundry,
  runCoatingYieldAnalysis,
  runCoatingSweep,
  visibleArObjective,
  type CoatingDesignResult,
  type CoatingStackDefinition,
  type CoatingStackRunResult,
  type CoatingSweepResult,
  type CoatingYieldResult,
  type MaterialCatalogAudit,
  type MaterialImportResult,
  type MaxwellPolarization,
  type PlanarFieldMonitorResult,
  type SolverWarning
} from "@emmicro/core";
import { FileDown, Plus, Save, ShieldCheck, Sparkles, Trash2, Upload } from "lucide-react";

type StackPresetId = "bareGlass" | "quarterWaveAr" | "broadbandAr" | "absorbingFilm";

type EditableLayer = {
  id: string;
  materialId: string;
  thicknessNm: number;
};

type StackPreset = {
  label: string;
  incidentMaterialId: string;
  substrateMaterialId: string;
  wavelengthNm: number;
  angleDeg: number;
  polarization: MaxwellPolarization;
  layers: EditableLayer[];
};

const materialOptions = listL4SpectralMaterials();
const layerMaterialOptions = materialOptions.filter((material) => material.family !== "ambient");
const builtInMaterialAudit = auditMaterialCatalog(materialOptions, "built-in-l4-material-catalog");

const stackPresets = {
  bareGlass: {
    label: "Bare air/glass",
    incidentMaterialId: "air",
    substrateMaterialId: "bk7",
    wavelengthNm: 550,
    angleDeg: 0,
    polarization: "TE",
    layers: []
  },
  quarterWaveAr: {
    label: "MgF2 quarter-wave AR",
    incidentMaterialId: "air",
    substrateMaterialId: "bk7",
    wavelengthNm: 550,
    angleDeg: 0,
    polarization: "TE",
    layers: [{ id: "layer-mgf2-qw", materialId: "mgf2", thicknessNm: 550 / (4 * 1.38) }]
  },
  broadbandAr: {
    label: "Three-layer visible AR",
    incidentMaterialId: "air",
    substrateMaterialId: "bk7",
    wavelengthNm: 550,
    angleDeg: 0,
    polarization: "TE",
    layers: [
      { id: "layer-tio2", materialId: "tio2", thicknessNm: 46 },
      { id: "layer-sio2", materialId: "sio2", thicknessNm: 96 },
      { id: "layer-mgf2", materialId: "mgf2", thicknessNm: 104 }
    ]
  },
  absorbingFilm: {
    label: "Lossy absorber on glass",
    incidentMaterialId: "air",
    substrateMaterialId: "bk7",
    wavelengthNm: 550,
    angleDeg: 0,
    polarization: "TE",
    layers: [{ id: "layer-chromium", materialId: "chromiumLossy", thicknessNm: 18 }]
  }
} satisfies Record<StackPresetId, StackPreset>;

const presetEntries = Object.entries(stackPresets) as Array<[StackPresetId, StackPreset]>;

export function MaxwellPanel() {
  const [presetId, setPresetId] = useState<StackPresetId>("quarterWaveAr");
  const [incidentMaterialId, setIncidentMaterialId] = useState(stackPresets.quarterWaveAr.incidentMaterialId);
  const [substrateMaterialId, setSubstrateMaterialId] = useState(stackPresets.quarterWaveAr.substrateMaterialId);
  const [wavelengthNm, setWavelengthNm] = useState(stackPresets.quarterWaveAr.wavelengthNm);
  const [angleDeg, setAngleDeg] = useState(stackPresets.quarterWaveAr.angleDeg);
  const [polarization, setPolarization] = useState<MaxwellPolarization>(stackPresets.quarterWaveAr.polarization);
  const [layers, setLayers] = useState<EditableLayer[]>(() => cloneLayers(stackPresets.quarterWaveAr.layers));
  const [sweepStartNm, setSweepStartNm] = useState(420);
  const [sweepEndNm, setSweepEndNm] = useState(700);
  const [sweepCount, setSweepCount] = useState(33);
  const [materialImport, setMaterialImport] = useState<MaterialImportResult | null>(null);
  const [materialImportError, setMaterialImportError] = useState<string | null>(null);

  const stack = useMemo<CoatingStackDefinition>(
    () => ({
      id: `l41-${presetId}`,
      label: `L4.1 ${stackPresets[presetId].label}`,
      wavelengthM: clamp(wavelengthNm, 200, 2000) * 1e-9,
      angleRad: radFromDeg(clamp(angleDeg, -80, 80)),
      polarization,
      incidentMaterialId,
      substrateMaterialId,
      layers: layers.map((layer) => ({
        id: layer.id,
        label: materialLabel(layer.materialId),
        materialId: layer.materialId,
        thicknessM: clamp(layer.thicknessNm, 0.1, 10000) * 1e-9
      }))
    }),
    [angleDeg, incidentMaterialId, layers, polarization, presetId, substrateMaterialId, wavelengthNm]
  );
  const run = useMemo<CoatingStackRunResult>(() => runCoatingStack(stack), [stack]);
  const sweep = useMemo<CoatingSweepResult>(
    () =>
      runCoatingSweep(stack, {
        startWavelengthM: clamp(sweepStartNm, 200, 2000) * 1e-9,
        endWavelengthM: clamp(Math.max(sweepStartNm, sweepEndNm), 200, 2000) * 1e-9,
        sampleCount: Math.max(3, Math.min(81, Math.round(sweepCount)))
      }),
    [stack, sweepCount, sweepEndNm, sweepStartNm]
  );
  const foundry = useMemo<CoatingDesignResult>(
    () =>
      runCoatingDesignFoundry({
        id: `l51-${presetId}-visible-ar`,
        label: `L5.1 ${stackPresets[presetId].label} design foundry`,
        seedStack: stack,
        objective: visibleArObjective,
        settings: { passes: 2, samplesPerVariable: 7, candidateCount: 3 }
      }),
    [presetId, stack]
  );
  const yieldAnalysis = useMemo<CoatingYieldResult>(
    () =>
      runCoatingYieldAnalysis({
        id: `l52-${presetId}-visible-ar-yield`,
        label: `L5.2 ${stackPresets[presetId].label} tolerance yield`,
        stack: foundry.best.stack,
        objective: visibleArObjective,
        tolerances: foundry.best.stack.layers.map((layer) => ({ layerId: layer.id, sigmaM: 2e-9 })),
        settings: { sampleCount: 41, confidenceLevel: 0.95 }
      }),
    [foundry, presetId]
  );
  const materialAudit = useMemo<MaterialCatalogAudit>(
    () => (materialImport ? auditMaterialCatalog([...materialOptions, ...materialImport.records], "l53-material-catalog-with-import-preview") : builtInMaterialAudit),
    [materialImport]
  );
  const warnings = useMemo(
    () => uniquePanelWarnings([...materialAudit.warnings, ...(materialImport?.warnings ?? []), ...yieldAnalysis.warnings, ...foundry.warnings, ...run.warnings]),
    [foundry, materialAudit, materialImport, run, yieldAnalysis]
  );

  function selectPreset(nextPresetId: StackPresetId): void {
    const preset = stackPresets[nextPresetId];
    setPresetId(nextPresetId);
    setIncidentMaterialId(preset.incidentMaterialId);
    setSubstrateMaterialId(preset.substrateMaterialId);
    setWavelengthNm(preset.wavelengthNm);
    setAngleDeg(preset.angleDeg);
    setPolarization(preset.polarization);
    setLayers(cloneLayers(preset.layers));
  }

  function updateLayer(layerId: string, updater: (layer: EditableLayer) => EditableLayer): void {
    setLayers((current) => current.map((layer) => (layer.id === layerId ? updater(layer) : layer)));
  }

  function addLayer(materialId: string): void {
    setLayers((current) => [
      ...current,
      {
        id: `layer-${materialId}-${Date.now().toString(36)}`,
        materialId,
        thicknessNm: defaultThicknessNm(materialId)
      }
    ]);
  }

  function removeLayer(layerId: string): void {
    setLayers((current) => current.filter((layer) => layer.id !== layerId));
  }

  function applyFoundryBest(): void {
    setIncidentMaterialId(foundry.best.stack.incidentMaterialId);
    setSubstrateMaterialId(foundry.best.stack.substrateMaterialId);
    setWavelengthNm(foundry.best.stack.wavelengthM * 1e9);
    setAngleDeg(degFromRad(foundry.best.stack.angleRad));
    setPolarization(foundry.best.stack.polarization);
    setLayers(
      foundry.best.stack.layers.map((layer) => ({
        id: layer.id,
        materialId: layer.materialId,
        thicknessNm: layer.thicknessM * 1e9
      }))
    );
  }

  async function importMaterialFile(file: File | null): Promise<void> {
    if (!file) return;
    try {
      const text = await file.text();
      setMaterialImport(parseMaterialImportJson(text));
      setMaterialImportError(null);
    } catch (error) {
      setMaterialImport(null);
      setMaterialImportError((error as Error).message);
    }
  }

  return (
    <section className="wave-panel maxwell-panel" aria-label="L5.3 Maxwell Design Foundry">
      <h2>L5.3 Maxwell Design Foundry</h2>
      <div className="l2-disclosure">
        <strong>frequency-domain Maxwell planar coating-stack TMM plus material provenance, design, and yield analysis</strong>
        <span>not a general 3D Maxwell solver</span>
      </div>

      <div className="maxwell-grid">
        <label className="field-row">
          <span>Preset</span>
          <select value={presetId} onChange={(event) => selectPreset(event.currentTarget.value as StackPresetId)}>
            {presetEntries.map(([id, preset]) => (
              <option key={id} value={id}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field-row">
          <span>Incident</span>
          <select value={incidentMaterialId} onChange={(event) => setIncidentMaterialId(event.currentTarget.value)}>
            {materialOptions.map((material) => (
              <option key={material.id} value={material.id}>
                {material.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field-row">
          <span>Substrate</span>
          <select value={substrateMaterialId} onChange={(event) => setSubstrateMaterialId(event.currentTarget.value)}>
            {materialOptions.map((material) => (
              <option key={material.id} value={material.id}>
                {material.label}
              </option>
            ))}
          </select>
        </label>
        <NumberField label="Wavelength" value={wavelengthNm} unit="nm" min={200} max={2000} step={1} onChange={setWavelengthNm} />
        <NumberField label="Angle" value={angleDeg} unit="deg" min={-80} max={80} step={0.25} onChange={setAngleDeg} />
        <label className="field-row">
          <span>Pol.</span>
          <select value={polarization} onChange={(event) => setPolarization(event.currentTarget.value as MaxwellPolarization)}>
            <option value="TE">TE</option>
            <option value="TM">TM</option>
          </select>
        </label>
      </div>

      <div className="maxwell-material-card">
        <div className="maxwell-section-heading">
          <h2>Material Library</h2>
          <strong>{materialAudit.resultHash.slice(0, 10)}</strong>
        </div>
        <div className="profile-meta">
          <div className="compact-stat">
            <span>Records</span>
            <strong>{materialAudit.recordCount}</strong>
          </div>
          <div className="compact-stat">
            <span>Samples</span>
            <strong>{materialAudit.sampleCount}</strong>
          </div>
          <div className="compact-stat">
            <span>Sourced</span>
            <strong>{materialAudit.sourcedRecordCount}</strong>
          </div>
          <div className="compact-stat">
            <span>Diagnostic</span>
            <strong>{materialAudit.diagnosticRecordCount}</strong>
          </div>
          <div className="compact-stat">
            <span>Range</span>
            <strong>{formatWavelengthRange(materialAudit.wavelengthRangeM)}</strong>
          </div>
        </div>
        {materialImport ? (
          <div className="maxwell-material-records">
            {materialImport.records.map((record) => (
              <div className="compact-stat" key={record.id}>
                <span>{record.label}</span>
                <strong>{record.samples.length} samples</strong>
              </div>
            ))}
          </div>
        ) : materialImportError ? (
          <div className="error-banner">{materialImportError}</div>
        ) : (
          <div className="empty-state">Built-in diagnostic records only.</div>
        )}
        <div className="maxwell-layer-actions">
          <label className="maxwell-file-action">
            <Upload size={15} />
            <span>Material JSON</span>
            <input
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                void importMaterialFile(event.currentTarget.files?.[0] ?? null);
                event.currentTarget.value = "";
              }}
            />
          </label>
          <button type="button" onClick={exportMaterialTemplateJson}>
            <FileDown size={15} />
            <span>Template JSON</span>
          </button>
        </div>
      </div>

      <div className="maxwell-layer-editor">
        <div className="maxwell-section-heading">
          <h2>Coating Stack</h2>
          <div className="maxwell-layer-actions">
            <button type="button" onClick={() => addLayer("mgf2")}>
              <Plus size={15} />
              <span>MgF2</span>
            </button>
            <button type="button" onClick={() => addLayer("tio2")}>
              <Plus size={15} />
              <span>TiO2</span>
            </button>
            <button type="button" onClick={() => addLayer("chromiumLossy")}>
              <Plus size={15} />
              <span>Absorber</span>
            </button>
          </div>
        </div>

        {layers.length > 0 ? (
          <div className="maxwell-layer-list">
            {layers.map((layer) => (
              <div className="maxwell-layer-row" key={layer.id}>
                <select value={layer.materialId} onChange={(event) => updateLayer(layer.id, (current) => ({ ...current, materialId: event.currentTarget.value }))}>
                  {layerMaterialOptions.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.label}
                    </option>
                  ))}
                </select>
                <div className="number-input">
                  <input
                    type="number"
                    value={formatNumberInputValue(layer.thicknessNm)}
                    min={0.1}
                    max={10000}
                    step={1}
                    onChange={(event) => updateLayer(layer.id, (current) => ({ ...current, thicknessNm: Number(event.currentTarget.value) }))}
                  />
                  <em>nm</em>
                </div>
                <button className="icon-button danger" type="button" title="Remove layer" onClick={() => removeLayer(layer.id)}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No coating layer; this is the bare incident/substrate boundary.</div>
        )}
      </div>

      <div className="wave-actions">
        <button type="button" onClick={() => exportStackJson(run, sweep, foundry, yieldAnalysis)}>
          <Save size={17} />
          <span>JSON</span>
        </button>
        <button type="button" onClick={() => exportStackSummary(run, sweep, foundry, yieldAnalysis)}>
          <FileDown size={17} />
          <span>Summary</span>
        </button>
        <button type="button" onClick={() => exportSweepCsv(sweep)}>
          <FileDown size={17} />
          <span>Sweep CSV</span>
        </button>
        <button type="button" onClick={() => exportMonitorCsv(run.fieldMonitor)}>
          <FileDown size={17} />
          <span>Monitor CSV</span>
        </button>
      </div>

      <div className="profile-meta">
        <div className="compact-stat">
          <span>Stack hash</span>
          <strong>{run.resultHash.slice(0, 10)}</strong>
        </div>
        <div className="compact-stat">
          <span>Layers</span>
          <strong>{run.tmm.layerCount}</strong>
        </div>
        <div className="compact-stat">
          <span>Energy error</span>
          <strong>{run.tmm.energyBalanceError.toExponential(2)}</strong>
        </div>
      </div>

      <div className="maxwell-flux" aria-label="Poynting flux ratios">
        <FluxRow label="R" value={run.tmm.reflectance} />
        <FluxRow label="T" value={run.tmm.transmittance} />
        <FluxRow label="A" value={run.tmm.absorbance} />
      </div>

      <div className="maxwell-monitor-card">
        <div className="maxwell-section-heading">
          <h2>Planar Field Monitor</h2>
          <strong>{run.fieldMonitor.resultHash.slice(0, 10)}</strong>
        </div>
        <FieldMonitorPlot monitor={run.fieldMonitor} />
        <div className="profile-meta">
          <div className="compact-stat">
            <span>Max |E|^2</span>
            <strong>{run.fieldMonitor.maxElectricIntensity.toExponential(2)}</strong>
          </div>
          <div className="compact-stat">
            <span>Layer A sum</span>
            <strong>{formatPercent(run.fieldMonitor.aggregateLayerAbsorbance)}</strong>
          </div>
          <div className="compact-stat">
            <span>Samples</span>
            <strong>{run.fieldMonitor.samples.length}</strong>
          </div>
        </div>
        {run.fieldMonitor.layerFlux.length > 0 ? (
          <div className="maxwell-layer-absorption">
            {run.fieldMonitor.layerFlux.map((layer) => (
              <div className="compact-stat" key={layer.layerId}>
                <span>{layer.label}</span>
                <strong>{formatPercent(layer.absorbedFlux)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No coating layer absorption rows for a bare boundary.</div>
        )}
      </div>

      <div className="maxwell-foundry-card">
        <div className="maxwell-section-heading">
          <h2>Design Foundry</h2>
          <strong>{foundry.resultHash.slice(0, 10)}</strong>
        </div>
        <div className="profile-meta">
          <div className="compact-stat">
            <span>Objective</span>
            <strong>{foundry.objective.label}</strong>
          </div>
          <div className="compact-stat">
            <span>Variables</span>
            <strong>{foundry.variableCount}</strong>
          </div>
          <div className="compact-stat">
            <span>Evaluations</span>
            <strong>{foundry.evaluationCount}</strong>
          </div>
        </div>
        <div className="profile-meta">
          <div className="compact-stat">
            <span>Seed score</span>
            <strong>{foundry.seed.score.toExponential(2)}</strong>
          </div>
          <div className="compact-stat">
            <span>Best score</span>
            <strong>{foundry.best.score.toExponential(2)}</strong>
          </div>
          <div className="compact-stat">
            <span>Best mean R</span>
            <strong>{formatPercent(foundry.best.metrics.meanReflectance)}</strong>
          </div>
          <div className="compact-stat">
            <span>Certified</span>
            <strong>{foundry.best.certifiedRun.resultHash.slice(0, 10)}</strong>
          </div>
        </div>
        {foundry.best.stack.layers.length > 0 ? (
          <div className="maxwell-foundry-layers">
            {foundry.best.stack.layers.map((layer) => (
              <div className="compact-stat" key={layer.id}>
                <span>{layer.label}</span>
                <strong>{(layer.thicknessM * 1e9).toFixed(2)} nm</strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No coating variables for a bare boundary.</div>
        )}
        <div className="maxwell-layer-actions">
          <button type="button" disabled={foundry.variableCount === 0} onClick={applyFoundryBest}>
            <Sparkles size={15} />
            <span>Apply Best</span>
          </button>
          <button type="button" onClick={() => exportFoundryJson(foundry)}>
            <FileDown size={15} />
            <span>Foundry JSON</span>
          </button>
        </div>
      </div>

      <div className="maxwell-yield-card">
        <div className="maxwell-section-heading">
          <h2>Tolerance Yield</h2>
          <strong>{yieldAnalysis.resultHash.slice(0, 10)}</strong>
        </div>
        <div className="profile-meta">
          <div className="compact-stat">
            <span>Pass rate</span>
            <strong>{formatPercent(yieldAnalysis.passRate)}</strong>
          </div>
          <div className="compact-stat">
            <span>95% CI</span>
            <strong>{formatInterval(yieldAnalysis.confidenceInterval.lower, yieldAnalysis.confidenceInterval.upper)}</strong>
          </div>
          <div className="compact-stat">
            <span>Samples</span>
            <strong>{yieldAnalysis.samples.length}</strong>
          </div>
          <div className="compact-stat">
            <span>Worst score</span>
            <strong>{yieldAnalysis.worstSample.score.toExponential(2)}</strong>
          </div>
        </div>
        <div className="maxwell-yield-requirements">
          {yieldAnalysis.requirements.map((requirement) => (
            <div className="compact-stat" key={requirement.requirement.id}>
              <span>{requirement.requirement.label}</span>
              <strong>
                {formatPercent(requirement.passRate)} pass / worst {formatMetric(requirement.requirement.metric, requirement.worstValue)}
              </strong>
            </div>
          ))}
        </div>
        {yieldAnalysis.sensitivities.length > 0 ? (
          <div className="maxwell-yield-requirements">
            {yieldAnalysis.sensitivities.slice(0, 3).map((sensitivity) => (
              <div className="compact-stat" key={sensitivity.layerId}>
                <span>
                  #{sensitivity.rank} {sensitivity.label}
                </span>
                <strong>{sensitivity.impactScore.toExponential(2)} score impact</strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No coating tolerance sensitivities for a bare boundary.</div>
        )}
        <div className="maxwell-layer-actions">
          <button type="button" onClick={() => exportYieldJson(yieldAnalysis)}>
            <ShieldCheck size={15} />
            <span>Yield JSON</span>
          </button>
        </div>
      </div>

      <div className="maxwell-sweep-card">
        <div className="maxwell-section-heading">
          <h2>Wavelength Sweep</h2>
          <strong>{sweep.resultHash.slice(0, 10)}</strong>
        </div>
        <div className="maxwell-sweep-controls">
          <NumberField label="Start" value={sweepStartNm} unit="nm" min={200} max={2000} step={5} onChange={setSweepStartNm} />
          <NumberField label="End" value={sweepEndNm} unit="nm" min={200} max={2000} step={5} onChange={setSweepEndNm} />
          <NumberField label="Samples" value={sweepCount} min={3} max={81} step={2} onChange={setSweepCount} />
        </div>
        <SweepPlot sweep={sweep} />
        <div className="profile-meta">
          <div className="compact-stat">
            <span>R min</span>
            <strong>{formatPercent(sweep.reflectanceMin)}</strong>
          </div>
          <div className="compact-stat">
            <span>R max</span>
            <strong>{formatPercent(sweep.reflectanceMax)}</strong>
          </div>
          <div className="compact-stat">
            <span>A max</span>
            <strong>{formatPercent(sweep.absorbanceMax)}</strong>
          </div>
        </div>
      </div>

      {warnings.length > 0 && (
        <ul className="warning-list">
          {warnings.map((warning, index) => (
            <li key={`${index}:${warning.code}:${warning.elementId ?? ""}`}>{warning.message}</li>
          ))}
        </ul>
      )}

      <div className="maxwell-stack">
        <h2>Limitations</h2>
        <ul>
          {yieldAnalysis.provenance.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
          {foundry.provenance.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
          {run.provenance.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function NumberField({
  label,
  value,
  unit,
  min,
  max,
  step = 0.1,
  onChange
}: {
  label: string;
  value: number;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field-row">
      <span>{label}</span>
      <div className="number-input">
        <input
          type="number"
          value={formatNumberInputValue(value)}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(Number(event.currentTarget.value))}
        />
        {unit && <em>{unit}</em>}
      </div>
    </label>
  );
}

function FluxRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="maxwell-flux-row">
      <span>{label}</span>
      <div className="maxwell-flux-bar">
        <i style={{ width: `${clamp(value, 0, 1) * 100}%` }} />
      </div>
      <strong>{formatPercent(value)}</strong>
    </div>
  );
}

function SweepPlot({ sweep }: { sweep: CoatingSweepResult }) {
  const width = 720;
  const height = 150;
  const pad = 20;
  const usableWidth = width - pad * 2;
  const usableHeight = height - pad * 2;
  const yMax = Math.max(0.05, ...sweep.samples.map((sample) => sample.reflectance));
  const points = sweep.samples
    .map((sample, index) => {
      const x = pad + (usableWidth * index) / Math.max(1, sweep.samples.length - 1);
      const y = pad + usableHeight * (1 - sample.reflectance / yMax);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg className="maxwell-sweep-plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Reflectance over wavelength sweep">
      <rect x="0" y="0" width={width} height={height} />
      <line className="profile-axis" x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} />
      <line className="profile-axis" x1={pad} y1={pad} x2={pad} y2={height - pad} />
      <polyline className="maxwell-sweep-line" points={points} />
      <text x={pad} y={height - 5}>
        {(sweep.sweep.startWavelengthM * 1e9).toFixed(0)} nm
      </text>
      <text x={width - pad - 48} y={height - 5}>
        {(sweep.sweep.endWavelengthM * 1e9).toFixed(0)} nm
      </text>
      <text x={pad + 4} y={pad + 12}>
        R max {formatPercent(yMax)}
      </text>
    </svg>
  );
}

function FieldMonitorPlot({ monitor }: { monitor: PlanarFieldMonitorResult }) {
  const width = 720;
  const height = 150;
  const pad = 20;
  const usableWidth = width - pad * 2;
  const usableHeight = height - pad * 2;
  const maxPositionM = Math.max(monitor.totalThicknessM, 1e-12);
  const yMax = Math.max(0.05, monitor.maxElectricIntensity);
  const points = monitor.samples
    .map((sample) => {
      const x = pad + usableWidth * (sample.positionM / maxPositionM);
      const y = pad + usableHeight * (1 - sample.electricIntensity / yMax);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg className="maxwell-sweep-plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Planar field monitor electric intensity through coating stack">
      <rect x="0" y="0" width={width} height={height} />
      <line className="profile-axis" x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} />
      <line className="profile-axis" x1={pad} y1={pad} x2={pad} y2={height - pad} />
      <polyline className="maxwell-monitor-line" points={points} />
      <text x={pad} y={height - 5}>
        0 nm
      </text>
      <text x={width - pad - 60} y={height - 5}>
        {(monitor.totalThicknessM * 1e9).toFixed(1)} nm
      </text>
      <text x={pad + 4} y={pad + 12}>
        max |E|^2 {yMax.toFixed(2)}
      </text>
    </svg>
  );
}

function exportStackJson(run: CoatingStackRunResult, sweep: CoatingSweepResult, foundry: CoatingDesignResult, yieldAnalysis: CoatingYieldResult): void {
  downloadText("l52-coating-design-yield-stack.json", "application/json", JSON.stringify({ run, sweep, foundry, yieldAnalysis }, null, 2));
}

function exportStackSummary(run: CoatingStackRunResult, sweep: CoatingSweepResult, foundry: CoatingDesignResult, yieldAnalysis: CoatingYieldResult): void {
  downloadText(
    "l52-coating-design-yield-stack.md",
    "text/markdown",
    [
      `# ${run.label}`,
      "",
      `Analysis: ${run.provenance.label}`,
      `Wavelength: ${(run.tmm.wavelengthM * 1e9).toFixed(2)} nm`,
      `Angle: ${degFromRad(run.tmm.angleRad).toFixed(2)} deg`,
      `Polarization: ${run.tmm.polarization}`,
      "",
      `Reflectance: ${formatPercent(run.tmm.reflectance)}`,
      `Transmittance: ${formatPercent(run.tmm.transmittance)}`,
      `Absorbance: ${formatPercent(run.tmm.absorbance)}`,
      `Energy balance error: ${run.tmm.energyBalanceError.toExponential(3)}`,
      `Stack hash: ${run.resultHash}`,
      `Monitor hash: ${run.fieldMonitor.resultHash}`,
      `Sweep hash: ${sweep.resultHash}`,
      `Foundry hash: ${foundry.resultHash}`,
      `Yield hash: ${yieldAnalysis.resultHash}`,
      "",
      "Planar field monitor:",
      `- Max |E|^2: ${run.fieldMonitor.maxElectricIntensity.toExponential(3)}`,
      `- Layer absorption sum: ${formatPercent(run.fieldMonitor.aggregateLayerAbsorbance)}`,
      ...run.fieldMonitor.layerFlux.map((layer) => `- ${layer.label}: ${formatPercent(layer.absorbedFlux)}`),
      "",
      "Design foundry:",
      `- Objective: ${foundry.objective.label}`,
      `- Seed score: ${foundry.seed.score.toExponential(3)}`,
      `- Best score: ${foundry.best.score.toExponential(3)}`,
      `- Best mean reflectance: ${formatPercent(foundry.best.metrics.meanReflectance)}`,
      `- Best max reflectance: ${formatPercent(foundry.best.metrics.maxReflectance)}`,
      `- Certified run hash: ${foundry.best.certifiedRun.resultHash}`,
      ...foundry.best.stack.layers.map((layer) => `- ${layer.label}: ${(layer.thicknessM * 1e9).toFixed(3)} nm`),
      "",
      "Tolerance yield:",
      `- Pass rate: ${formatPercent(yieldAnalysis.passRate)}`,
      `- 95% CI: ${formatInterval(yieldAnalysis.confidenceInterval.lower, yieldAnalysis.confidenceInterval.upper)}`,
      `- Samples: ${yieldAnalysis.samples.length}`,
      `- Worst score: ${yieldAnalysis.worstSample.score.toExponential(3)}`,
      ...yieldAnalysis.requirements.map(
        (requirement) =>
          `- ${requirement.requirement.label}: ${formatPercent(requirement.passRate)} pass, worst ${formatMetric(requirement.requirement.metric, requirement.worstValue)}`
      ),
      ...yieldAnalysis.sensitivities.slice(0, 3).map((sensitivity) => `- sensitivity #${sensitivity.rank} ${sensitivity.label}: ${sensitivity.impactScore.toExponential(3)} score impact`),
      "",
      "Sweep:",
      `- R min: ${formatPercent(sweep.reflectanceMin)}`,
      `- R max: ${formatPercent(sweep.reflectanceMax)}`,
      `- A max: ${formatPercent(sweep.absorbanceMax)}`,
      "",
      "Limitations:",
      ...yieldAnalysis.provenance.limitations.map((limitation) => `- ${limitation}`),
      ...foundry.provenance.limitations.map((limitation) => `- ${limitation}`),
      ...run.provenance.limitations.map((limitation) => `- ${limitation}`)
    ].join("\n")
  );
}

function exportFoundryJson(foundry: CoatingDesignResult): void {
  downloadText("l51-design-foundry.json", "application/json", JSON.stringify(foundry, null, 2));
}

function exportYieldJson(yieldAnalysis: CoatingYieldResult): void {
  downloadText("l52-yield-analysis.json", "application/json", JSON.stringify(yieldAnalysis, null, 2));
}

function exportMaterialTemplateJson(): void {
  downloadText("l53-material-import-template.json", "application/json", JSON.stringify(createMaterialImportTemplate(), null, 2));
}

function exportSweepCsv(sweep: CoatingSweepResult): void {
  const rows = [
    "wavelength_nm,reflectance,transmittance,absorbance,energy_balance_error,result_hash",
    ...sweep.samples.map((sample) =>
      [
        (sample.wavelengthM * 1e9).toFixed(6),
        sample.reflectance.toPrecision(12),
        sample.transmittance.toPrecision(12),
        sample.absorbance.toPrecision(12),
        sample.energyBalanceError.toPrecision(6),
        sample.resultHash
      ].join(",")
    )
  ];
  downloadText("l41-coating-sweep.csv", "text/csv", rows.join("\n"));
}

function exportMonitorCsv(monitor: PlanarFieldMonitorResult): void {
  const rows = [
    "id,kind,position_nm,layer_id,depth_nm,e_re,e_im,h_re,h_im,electric_intensity,normalized_poynting_flux,phase_rad",
    ...monitor.samples.map((sample) =>
      [
        sample.id,
        sample.kind,
        (sample.positionM * 1e9).toFixed(6),
        sample.layerId ?? "",
        sample.depthInLayerM === undefined ? "" : (sample.depthInLayerM * 1e9).toFixed(6),
        sample.eTangential.re.toPrecision(12),
        sample.eTangential.im.toPrecision(12),
        sample.hTangential.re.toPrecision(12),
        sample.hTangential.im.toPrecision(12),
        sample.electricIntensity.toPrecision(12),
        sample.normalizedPoyntingFlux.toPrecision(12),
        sample.phaseRad.toPrecision(12)
      ].join(",")
    )
  ];
  downloadText("l42-planar-field-monitor.csv", "text/csv", rows.join("\n"));
}

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

function cloneLayers(layers: EditableLayer[]): EditableLayer[] {
  return layers.map((layer) => ({ ...layer }));
}

function materialLabel(materialId: string): string {
  return materialOptions.find((material) => material.id === materialId)?.label ?? materialId;
}

function defaultThicknessNm(materialId: string): number {
  if (materialId === "tio2") return 50;
  if (materialId === "sio2") return 100;
  if (materialId === "chromiumLossy") return 18;
  if (materialId === "silicon") return 200;
  return 100;
}

function clamp(value: number, min: number, max: number): number {
  const finite = Number.isFinite(value) ? value : min;
  return Math.min(max, Math.max(min, finite));
}

function radFromDeg(value: number): number {
  return (value * Math.PI) / 180;
}

function degFromRad(value: number): number {
  return (value * 180) / Math.PI;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(value < 0.001 ? 4 : 2)}%`;
}

function formatInterval(lower: number, upper: number): string {
  return `${formatPercent(lower)}-${formatPercent(upper)}`;
}

function formatWavelengthRange(range: [number, number] | null): string {
  if (!range) return "n/a";
  return `${(range[0] * 1e9).toFixed(0)}-${(range[1] * 1e9).toFixed(0)} nm`;
}

function formatMetric(metric: string, value: number): string {
  if (metric.toLowerCase().includes("reflectance") || metric.toLowerCase().includes("transmittance") || metric.toLowerCase().includes("absorbance")) {
    return formatPercent(value);
  }
  return value.toExponential(2);
}

function formatNumberInputValue(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (value === 0) return "0";
  const rounded = Math.abs(value) >= 1e-3 ? Number(value.toFixed(6)) : Number(value.toPrecision(6));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function uniquePanelWarnings(warnings: SolverWarning[]): SolverWarning[] {
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
