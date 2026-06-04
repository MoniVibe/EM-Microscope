import { useEffect, useMemo, useState } from "react";
import {
  applyCoatingSearchCandidate,
  auditMaterialCatalog,
  createMaterialCatalog,
  createMaterialImportTemplate,
  importMaterialPackage,
  listCatalogMaterials,
  applyRobustCoatingSearchCandidate,
  parseMaterialImportJson,
  runCoatingSearch,
  runRobustCoatingSearch,
  runCoatingStack,
  runCoatingDesignFoundry,
  runCoatingYieldAnalysis,
  runCoatingSweep,
  serializeCoatingStackDesign,
  visibleArObjective,
  type CoatingDesignResult,
  type CoatingSearchCandidate,
  type CoatingSearchResult,
  type CoatingStackDefinition,
  type CoatingStackRunResult,
  type CoatingSweepResult,
  type CoatingYieldResult,
  type CoatingUncertaintyModel,
  type MaterialCatalogEntry,
  type MaterialCatalogAudit,
  type MaterialImportResult,
  type MaxwellMaterialCatalog,
  type MaxwellPolarization,
  type PlanarFieldMonitorResult,
  type RobustCoatingSearchCandidate,
  type RobustCoatingSearchPrimaryMetric,
  type RobustCoatingSearchResult,
  type SolverWarning
} from "@emmicro/core";
import { FileDown, Plus, Save, ShieldCheck, Sparkles, Trash2, Upload } from "lucide-react";

type StackPresetId = "bareGlass" | "quarterWaveAr" | "broadbandAr" | "absorbingFilm";
type RobustUncertaintyModeId = "independent-thickness" | "shared-scale" | "shared-offset-residual";

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

const builtInMaterialCatalog = createMaterialCatalog({ id: "built-in-l54-material-catalog" });
const builtInMaterialOptions = listCatalogMaterials(builtInMaterialCatalog);
const builtInMaterialAudit = auditMaterialCatalog(builtInMaterialOptions, "built-in-l54-material-catalog");

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
  const [searchWavelengthsText, setSearchWavelengthsText] = useState("450, 550, 650");
  const [searchLayerMin, setSearchLayerMin] = useState(1);
  const [searchLayerMax, setSearchLayerMax] = useState(3);
  const [searchThicknessMinNm, setSearchThicknessMinNm] = useState(40);
  const [searchThicknessMaxNm, setSearchThicknessMaxNm] = useState(180);
  const [searchThicknessStepNm, setSearchThicknessStepNm] = useState(35);
  const [searchBeamWidth, setSearchBeamWidth] = useState(8);
  const [searchMaterialIds, setSearchMaterialIds] = useState<string[]>(["mgf2", "sio2", "tio2"]);
  const [searchResult, setSearchResult] = useState<CoatingSearchResult | null>(null);
  const [robustSearchEnabled, setRobustSearchEnabled] = useState(false);
  const [robustUncertaintyMode, setRobustUncertaintyMode] = useState<RobustUncertaintyModeId>("independent-thickness");
  const [robustThicknessSigmaNm, setRobustThicknessSigmaNm] = useState(2);
  const [robustSigmaLevelsText, setRobustSigmaLevelsText] = useState("-2, 0, 2");
  const [robustScaleSigmaPercent, setRobustScaleSigmaPercent] = useState(1);
  const [robustOffsetSigmaNm, setRobustOffsetSigmaNm] = useState(1);
  const [robustResidualSigmaNm, setRobustResidualSigmaNm] = useState(0.5);
  const [robustMaxSamples, setRobustMaxSamples] = useState(81);
  const [robustPrimaryMetric, setRobustPrimaryMetric] = useState<RobustCoatingSearchPrimaryMetric>("p90Score");
  const [robustPassThresholdText, setRobustPassThresholdText] = useState("");
  const [robustResult, setRobustResult] = useState<RobustCoatingSearchResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const materialCatalog = useMemo<MaxwellMaterialCatalog>(
    () => createMaterialCatalog({ id: materialImport ? "l54-material-catalog-with-imports" : "l54-built-in-material-catalog", imports: materialImport ? [materialImport] : [] }),
    [materialImport]
  );
  const materialOptions = useMemo(() => listCatalogMaterials(materialCatalog), [materialCatalog]);
  const layerMaterialOptions = useMemo(() => materialOptions.filter((material) => material.family !== "ambient"), [materialOptions]);
  const importedLayerMaterial = useMemo(() => layerMaterialOptions.find((material) => material.origin === "imported"), [layerMaterialOptions]);
  const materialRunOptions = useMemo(
    () => ({
      materialCatalog,
      materialResolution: { extrapolation: "clamp" as const }
    }),
    [materialCatalog]
  );

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
        label: materialLabel(layer.materialId, materialCatalog),
        materialId: layer.materialId,
        thicknessM: clamp(layer.thicknessNm, 0.1, 10000) * 1e-9
      }))
    }),
    [angleDeg, incidentMaterialId, layers, materialCatalog, polarization, presetId, substrateMaterialId, wavelengthNm]
  );
  const run = useMemo<CoatingStackRunResult>(() => runCoatingStack(stack, materialRunOptions), [materialRunOptions, stack]);
  const sweep = useMemo<CoatingSweepResult>(
    () =>
      runCoatingSweep(stack, {
        startWavelengthM: clamp(sweepStartNm, 200, 2000) * 1e-9,
        endWavelengthM: clamp(Math.max(sweepStartNm, sweepEndNm), 200, 2000) * 1e-9,
        sampleCount: Math.max(3, Math.min(81, Math.round(sweepCount)))
      }, materialRunOptions),
    [materialRunOptions, stack, sweepCount, sweepEndNm, sweepStartNm]
  );
  const foundry = useMemo<CoatingDesignResult>(
    () =>
      runCoatingDesignFoundry({
        id: `l51-${presetId}-visible-ar`,
        label: `L5.1 ${stackPresets[presetId].label} design foundry`,
        seedStack: stack,
        objective: visibleArObjective,
        settings: { passes: 2, samplesPerVariable: 7, candidateCount: 3 },
        ...materialRunOptions
      }),
    [materialRunOptions, presetId, stack]
  );
  const yieldAnalysis = useMemo<CoatingYieldResult>(
    () =>
      runCoatingYieldAnalysis({
        id: `l52-${presetId}-visible-ar-yield`,
        label: `L5.2 ${stackPresets[presetId].label} tolerance yield`,
        stack: foundry.best.stack,
        objective: visibleArObjective,
        tolerances: foundry.best.stack.layers.map((layer) => ({ layerId: layer.id, sigmaM: 2e-9 })),
        settings: { sampleCount: 41, confidenceLevel: 0.95 },
        ...materialRunOptions
      }),
    [foundry, materialRunOptions, presetId]
  );
  const materialAudit = useMemo<MaterialCatalogAudit>(
    () => (materialImport ? auditMaterialCatalog(materialOptions, "l54-material-catalog-with-imports") : builtInMaterialAudit),
    [materialImport, materialOptions]
  );
  const warnings = useMemo(
    () =>
      uniquePanelWarnings([
        ...materialAudit.warnings,
        ...materialCatalog.warnings,
        ...(materialImport?.warnings ?? []),
        ...(robustResult?.warnings ?? []),
        ...(searchResult?.warnings ?? []),
        ...yieldAnalysis.warnings,
        ...foundry.warnings,
        ...run.warnings
      ]),
    [foundry, materialAudit, materialCatalog, materialImport, robustResult, run, searchResult, yieldAnalysis]
  );

  useEffect(() => {
    setSearchMaterialIds((current) => {
      const available = new Set(layerMaterialOptions.map((material) => material.id));
      const imported = layerMaterialOptions.filter((material) => material.origin === "imported").map((material) => material.id);
      const retained = current.filter((id) => available.has(id));
      const next = [...retained, ...imported.filter((id) => !retained.includes(id))];
      if (next.length > 0) return next;
      return ["mgf2", "sio2", "tio2"].filter((id) => available.has(id));
    });
  }, [layerMaterialOptions]);

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

  function loadExampleMaterialPack(): void {
    try {
      setMaterialImport(importMaterialPackage(createMaterialImportTemplate()));
      setMaterialImportError(null);
    } catch (error) {
      setMaterialImport(null);
      setMaterialImportError((error as Error).message);
    }
  }

  function toggleSearchMaterial(materialId: string): void {
    setSearchMaterialIds((current) => (current.includes(materialId) ? current.filter((id) => id !== materialId) : [...current, materialId]));
  }

  function runSearch(): void {
    try {
      const candidateMaterialIds = searchMaterialIds.filter((id) => layerMaterialOptions.some((material) => material.id === id));
      const wavelengthsNm = parseNumberList(searchWavelengthsText);
      if (candidateMaterialIds.length === 0) throw new Error("Select at least one coating search material.");
      if (wavelengthsNm.length === 0) throw new Error("Enter at least one target wavelength.");
      const layerMin = Math.max(0, Math.round(Math.min(searchLayerMin, searchLayerMax)));
      const layerMax = Math.max(layerMin, Math.round(Math.max(searchLayerMin, searchLayerMax)));
      const thicknessMinNm = clamp(Math.min(searchThicknessMinNm, searchThicknessMaxNm), 0.1, 10000);
      const thicknessMaxNm = clamp(Math.max(searchThicknessMinNm, searchThicknessMaxNm), thicknessMinNm, 10000);
      const thicknessStepNm = clamp(searchThicknessStepNm, 1, Math.max(1, thicknessMaxNm - thicknessMinNm));
      const nominalSearch = {
        id: `l57-${presetId}-coating-search`,
        label: `L5.7 ${stackPresets[presetId].label} coating search`,
        baseStack: { ...stack, layers: [] },
        wavelengthsM: wavelengthsNm.map((nm) => clamp(nm, 200, 2000) * 1e-9),
        anglesRad: [stack.angleRad],
        polarizations: ["unpolarized" as const],
        candidateMaterialIds,
        layerCount: { min: layerMin, max: layerMax },
        thicknessM: {
          min: thicknessMinNm * 1e-9,
          max: thicknessMaxNm * 1e-9,
          step: thicknessStepNm * 1e-9
        },
        constraints: {
          disallowAdjacentSameMaterial: true,
          maxTotalThicknessM: layerMax * thicknessMaxNm * 1e-9,
          maxAbsorbance: 0.02
        },
        objective: {
          terms: [
            { metric: "reflectance" as const, direction: "minimize" as const, weight: 1 },
            { metric: "absorbance" as const, direction: "minimize" as const, weight: 0.2 }
          ]
        },
        search: {
          mode: "beam" as const,
          beamWidth: Math.max(2, Math.min(32, Math.round(searchBeamWidth))),
          maxCandidates: 5,
          refinementPasses: 1,
          seed: 57
        }
      };
      if (robustSearchEnabled) {
        const sigmaLevels = parseSignedNumberList(robustSigmaLevelsText);
        if (sigmaLevels.length === 0) throw new Error("Enter at least one robust sigma level.");
        const passThreshold = parseOptionalNumber(robustPassThresholdText);
        if (robustPrimaryMetric === "passRate" && passThreshold === undefined) throw new Error("Pass-rate robust ranking requires a pass score threshold.");
        const maxSamplesPerCandidate = Math.max(1, Math.min(1000, Math.round(robustMaxSamples)));
        const independentThickness = {
          mode: "deterministic-grid" as const,
          sigmaNm: clamp(robustThicknessSigmaNm, 0, 1000),
          sigmaLevels,
          maxSamplesPerCandidate
        };
        const uncertaintyModel: CoatingUncertaintyModel =
          robustUncertaintyMode === "shared-scale"
            ? {
                mode: "correlated-thickness",
                preset: "shared-scale",
                globalThicknessScale: {
                  sigmaFraction: clamp(robustScaleSigmaPercent, 0, 100) / 100,
                  sigmaLevels
                },
                maxSamplesPerCandidate
              }
            : robustUncertaintyMode === "shared-offset-residual"
              ? {
                  mode: "correlated-thickness",
                  preset: "shared-offset-residual",
                  globalThicknessOffsetNm: {
                    sigmaNm: clamp(robustOffsetSigmaNm, 0, 1000),
                    sigmaLevels
                  },
                  perLayerResidualNm: {
                    sigmaNm: clamp(robustResidualSigmaNm, 0, 1000),
                    sigmaLevels: [-1, 0, 1]
                  },
                  maxSamplesPerCandidate
                }
              : {
                  mode: "independent-thickness",
                  sigmaNm: independentThickness.sigmaNm,
                  sigmaLevels,
                  maxSamplesPerCandidate
                };
        const robust = runRobustCoatingSearch(
          {
            id: `l57-${presetId}-robust-yield-search`,
            label: `L5.7 ${stackPresets[presetId].label} robust-yield coating search`,
            nominalSearch,
            uncertainty: {
              thickness: independentThickness,
              model: uncertaintyModel
            },
            robustObjective: {
              primary: robustPrimaryMetric,
              passThreshold,
              weights: { nominalScore: 0.05 }
            },
            candidateLimit: 5
          },
          materialRunOptions
        );
        setRobustResult(robust);
        setSearchResult(robust.nominalSearchResult);
      } else {
        const result = runCoatingSearch(nominalSearch, materialRunOptions);
        setSearchResult(result);
        setRobustResult(null);
      }
      setSearchError(null);
    } catch (error) {
      setSearchResult(null);
      setRobustResult(null);
      setSearchError((error as Error).message);
    }
  }

  function applySearchCandidate(candidate: CoatingSearchCandidate): void {
    const applied = applyCoatingSearchCandidate(stack, candidate);
    setLayers(
      applied.layers.map((layer) => ({
        id: layer.id,
        materialId: layer.materialId,
        thicknessNm: layer.thicknessM * 1e9
      }))
    );
  }

  function applyRobustSearchCandidate(candidate: RobustCoatingSearchCandidate): void {
    const applied = applyRobustCoatingSearchCandidate(stack, candidate);
    setLayers(
      applied.layers.map((layer) => ({
        id: layer.id,
        materialId: layer.materialId,
        thicknessNm: layer.thicknessM * 1e9
      }))
    );
  }

  return (
    <section className="wave-panel maxwell-panel" aria-label="L5.7 Maxwell Design Foundry">
      <h2>L5.7 Maxwell Design Foundry</h2>
      <div className="l2-disclosure">
        <strong>frequency-domain Maxwell planar coating-stack TMM plus drift-aware robust material/order search, provenance, design, and yield analysis</strong>
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
            <MaterialSelectOptions materials={materialOptions} />
          </select>
        </label>
        <label className="field-row">
          <span>Substrate</span>
          <select value={substrateMaterialId} onChange={(event) => setSubstrateMaterialId(event.currentTarget.value)}>
            <MaterialSelectOptions materials={materialOptions} />
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
            {materialOptions
              .filter((record) => record.origin === "imported")
              .map((record) => (
              <div className="compact-stat" key={record.id}>
                <span>{record.label}</span>
                <strong>{record.materialHash.slice(0, 10)}</strong>
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
          <button type="button" onClick={loadExampleMaterialPack}>
            <Upload size={15} />
            <span>Example Pack</span>
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
            {importedLayerMaterial && (
              <button type="button" onClick={() => addLayer(importedLayerMaterial.id)}>
                <Plus size={15} />
                <span>Imported</span>
              </button>
            )}
          </div>
        </div>

        {layers.length > 0 ? (
          <div className="maxwell-layer-list">
            {layers.map((layer) => {
              const selectedMaterial = materialEntryFor(layer.materialId, materialCatalog);
              return (
                <div className="maxwell-layer-item" key={layer.id}>
                  <div className="maxwell-layer-row">
                    <select value={layer.materialId} onChange={(event) => updateLayer(layer.id, (current) => ({ ...current, materialId: event.currentTarget.value }))}>
                      <MaterialSelectOptions materials={layerMaterialOptions} />
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
                  <MaterialPassport material={selectedMaterial} wavelengthNm={wavelengthNm} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">No coating layer; this is the bare incident/substrate boundary.</div>
        )}
      </div>

      <div className="wave-actions">
        <button type="button" onClick={() => exportStackJson(stack, materialCatalog, run, sweep, foundry, yieldAnalysis)}>
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

      <div className="maxwell-search-card">
        <div className="maxwell-section-heading">
          <h2>Coating Search</h2>
          <strong>{robustResult ? robustResult.resultHash.slice(0, 10) : searchResult ? searchResult.resultHash.slice(0, 10) : "not run"}</strong>
        </div>
        <div className="maxwell-search-controls">
          <label className="field-row">
            <span>Targets</span>
            <input value={searchWavelengthsText} onChange={(event) => setSearchWavelengthsText(event.currentTarget.value)} />
          </label>
          <NumberField label="Layer min" value={searchLayerMin} min={0} max={6} step={1} onChange={setSearchLayerMin} />
          <NumberField label="Layer max" value={searchLayerMax} min={1} max={6} step={1} onChange={setSearchLayerMax} />
          <NumberField label="Min thick" value={searchThicknessMinNm} unit="nm" min={1} max={1000} step={5} onChange={setSearchThicknessMinNm} />
          <NumberField label="Max thick" value={searchThicknessMaxNm} unit="nm" min={1} max={1000} step={5} onChange={setSearchThicknessMaxNm} />
          <NumberField label="Step" value={searchThicknessStepNm} unit="nm" min={1} max={250} step={5} onChange={setSearchThicknessStepNm} />
          <NumberField label="Beam" value={searchBeamWidth} min={2} max={32} step={1} onChange={setSearchBeamWidth} />
        </div>
        <div className="maxwell-robust-controls">
          <label className="maxwell-material-check">
            <input type="checkbox" checked={robustSearchEnabled} onChange={() => setRobustSearchEnabled((current) => !current)} />
            <span>Robust Search</span>
            <strong>drift yield</strong>
          </label>
          <label className="field-row">
            <span>Model</span>
            <select value={robustUncertaintyMode} onChange={(event) => setRobustUncertaintyMode(event.currentTarget.value as RobustUncertaintyModeId)}>
              <option value="independent-thickness">Independent thickness</option>
              <option value="shared-scale">Shared deposition scale</option>
              <option value="shared-offset-residual">Shared offset + residual</option>
            </select>
          </label>
          <NumberField label="Sigma" value={robustThicknessSigmaNm} unit="nm" min={0} max={50} step={0.25} onChange={setRobustThicknessSigmaNm} />
          <label className="field-row">
            <span>Levels</span>
            <input value={robustSigmaLevelsText} onChange={(event) => setRobustSigmaLevelsText(event.currentTarget.value)} />
          </label>
          <NumberField label="Scale sigma" value={robustScaleSigmaPercent} unit="%" min={0} max={20} step={0.1} onChange={setRobustScaleSigmaPercent} />
          <NumberField label="Offset sigma" value={robustOffsetSigmaNm} unit="nm" min={0} max={50} step={0.25} onChange={setRobustOffsetSigmaNm} />
          <NumberField label="Residual" value={robustResidualSigmaNm} unit="nm" min={0} max={20} step={0.25} onChange={setRobustResidualSigmaNm} />
          <NumberField label="Max samples" value={robustMaxSamples} min={1} max={243} step={1} onChange={setRobustMaxSamples} />
          <label className="field-row">
            <span>Ranking</span>
            <select value={robustPrimaryMetric} onChange={(event) => setRobustPrimaryMetric(event.currentTarget.value as RobustCoatingSearchPrimaryMetric)}>
              <option value="p90Score">p90 score</option>
              <option value="expectedScore">expected score</option>
              <option value="worstCaseScore">worst-case score</option>
              <option value="passRate">pass rate</option>
            </select>
          </label>
          <label className="field-row">
            <span>Pass score</span>
            <input value={robustPassThresholdText} placeholder="optional" onChange={(event) => setRobustPassThresholdText(event.currentTarget.value)} />
          </label>
        </div>
        <div className="maxwell-search-materials">
          {layerMaterialOptions.map((material) => (
            <label key={material.id} className="maxwell-material-check">
              <input type="checkbox" checked={searchMaterialIds.includes(material.id)} onChange={() => toggleSearchMaterial(material.id)} />
              <span>{material.label}</span>
              <strong>{material.origin === "imported" ? "imported" : "built-in"}</strong>
            </label>
          ))}
        </div>
        <div className="maxwell-layer-actions">
          <button type="button" onClick={runSearch}>
            <Sparkles size={15} />
            <span>{robustSearchEnabled ? "Run Robust Search" : "Run Search"}</span>
          </button>
          {(robustResult || searchResult) && (
            <button type="button" onClick={() => (robustResult ? exportRobustSearchJson(robustResult) : searchResult ? exportSearchJson(searchResult) : undefined)}>
              <FileDown size={15} />
              <span>{robustResult ? "Robust Search JSON" : "Search JSON"}</span>
            </button>
          )}
        </div>
        {searchError && <div className="error-banner">{searchError}</div>}
        {robustResult ? (
          <div className="maxwell-search-results">
            <div className="profile-meta">
              <div className="compact-stat">
                <span>Best p90</span>
                <strong>{robustResult.best.yield.p90Score.toExponential(2)}</strong>
              </div>
              <div className="compact-stat">
                <span>Model</span>
                <strong>{robustResult.best.uncertaintyReceipt.label}</strong>
              </div>
              <div className="compact-stat">
                <span>Robust samples</span>
                <strong>{robustResult.sampleEvaluationCount}</strong>
              </div>
              <div className="compact-stat">
                <span>Nominal evals</span>
                <strong>{robustResult.evaluationCount}</strong>
              </div>
            </div>
            {robustResult.candidates.map((candidate) => (
              <div className="maxwell-search-row" key={candidate.resultHash}>
                <div className="maxwell-search-stack">
                  <span>#{candidate.rank}</span>
                  <strong>{formatSearchStack(candidate.nominalCandidate)}</strong>
                  <em>{candidate.materialCatalogRefs.some((reference) => reference.origin === "imported") ? "imported fixed n/k" : "built-in fixed n/k"}</em>
                </div>
                <div className="profile-meta">
                  <div className="compact-stat">
                    <span>Nominal</span>
                    <strong>{candidate.nominal.score.toExponential(2)}</strong>
                  </div>
                  <div className="compact-stat">
                    <span>Expected</span>
                    <strong>{candidate.yield.expectedScore.toExponential(2)}</strong>
                  </div>
                  <div className="compact-stat">
                    <span>P90</span>
                    <strong>{candidate.yield.p90Score.toExponential(2)}</strong>
                  </div>
                  <div className="compact-stat">
                    <span>Worst</span>
                    <strong>{candidate.yield.worstCaseScore.toExponential(2)}</strong>
                  </div>
                  <div className="compact-stat">
                    <span>Pass rate</span>
                    <strong>{candidate.yield.passRate === undefined ? "n/a" : formatPercent(candidate.yield.passRate)}</strong>
                  </div>
                  <div className="compact-stat">
                    <span>Samples</span>
                    <strong>{candidate.yield.sampleCount}</strong>
                  </div>
                  {candidate.comparison && (
                    <>
                      <div className="compact-stat">
                        <span>Independent P90</span>
                        <strong>{candidate.comparison.independentThickness.p90Score.toExponential(2)}</strong>
                      </div>
                      <div className="compact-stat">
                        <span>P90 delta</span>
                        <strong>{formatSignedExponential(candidate.yield.p90Score - candidate.comparison.independentThickness.p90Score)}</strong>
                      </div>
                    </>
                  )}
                </div>
                <div className="profile-meta">
                  <div className="compact-stat">
                    <span>Expected R</span>
                    <strong>{formatPercent(candidate.yield.expectedReflectance)}</strong>
                  </div>
                  <div className="compact-stat">
                    <span>P90 R</span>
                    <strong>{formatPercent(candidate.yield.p90Reflectance)}</strong>
                  </div>
                  <div className="compact-stat">
                    <span>Worst R</span>
                    <strong>{formatPercent(candidate.yield.worstCaseReflectance)}</strong>
                  </div>
                </div>
                <div className="maxwell-search-provenance">
                  <span>{formatUncertaintyReceipt(candidate.uncertaintyReceipt)}</span>
                  <span>{formatUncertaintySamples(candidate.uncertaintyReceipt)}</span>
                  {candidate.comparison && <span>baseline independent P90 {candidate.comparison.independentThickness.p90Score.toExponential(2)}</span>}
                  {candidate.materialCatalogRefs.map((reference) => (
                    <span key={reference.materialId}>
                      {reference.label} {reference.materialHash.slice(0, 8)}
                    </span>
                  ))}
                </div>
                <div className="maxwell-layer-actions">
                  <button type="button" onClick={() => applyRobustSearchCandidate(candidate)}>
                    <Sparkles size={15} />
                    <span>Apply Robust</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : searchResult ? (
          <div className="maxwell-search-results">
            <div className="profile-meta">
              <div className="compact-stat">
                <span>Best mean R</span>
                <strong>{formatPercent(searchResult.best.metrics.meanReflectance)}</strong>
              </div>
              <div className="compact-stat">
                <span>Evaluations</span>
                <strong>{searchResult.evaluationCount}</strong>
              </div>
              <div className="compact-stat">
                <span>Rejected</span>
                <strong>{searchResult.rejectedCount}</strong>
              </div>
            </div>
            {searchResult.candidates.map((candidate) => (
              <div className="maxwell-search-row" key={candidate.resultHash}>
                <div className="maxwell-search-stack">
                  <span>#{candidate.rank}</span>
                  <strong>{formatSearchStack(candidate)}</strong>
                  <em>{candidate.materialCatalogRefs.some((reference) => reference.origin === "imported") ? "imported material" : "built-in only"}</em>
                </div>
                <div className="profile-meta">
                  <div className="compact-stat">
                    <span>Score</span>
                    <strong>{candidate.score.toExponential(2)}</strong>
                  </div>
                  <div className="compact-stat">
                    <span>Mean R</span>
                    <strong>{formatPercent(candidate.metrics.meanReflectance)}</strong>
                  </div>
                  <div className="compact-stat">
                    <span>Mean T</span>
                    <strong>{formatPercent(candidate.metrics.meanTransmittance)}</strong>
                  </div>
                  <div className="compact-stat">
                    <span>Mean A</span>
                    <strong>{formatPercent(candidate.metrics.meanAbsorbance)}</strong>
                  </div>
                </div>
                <div className="maxwell-search-provenance">
                  {candidate.materialCatalogRefs.map((reference) => (
                    <span key={reference.materialId}>
                      {reference.label} {reference.materialHash.slice(0, 8)}
                    </span>
                  ))}
                </div>
                <div className="maxwell-layer-actions">
                  <button type="button" onClick={() => applySearchCandidate(candidate)}>
                    <Sparkles size={15} />
                    <span>Apply Search</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Run search to rank planar coating material/order/thickness candidates.</div>
        )}
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
          {(robustResult?.provenance.limitations ?? searchResult?.provenance.limitations ?? []).map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
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

function MaterialSelectOptions({ materials }: { materials: MaterialCatalogEntry[] }) {
  const builtIn = materials.filter((material) => material.origin === "builtIn");
  const imported = materials.filter((material) => material.origin === "imported");
  return (
    <>
      <optgroup label="Built-in">
        {builtIn.map((material) => (
          <option key={material.id} value={material.id}>
            {material.label}
          </option>
        ))}
      </optgroup>
      {imported.length > 0 && (
        <optgroup label="Imported">
          {imported.map((material) => (
            <option key={material.id} value={material.id}>
              {material.label}
            </option>
          ))}
        </optgroup>
      )}
    </>
  );
}

function MaterialPassport({ material, wavelengthNm }: { material: MaterialCatalogEntry | undefined; wavelengthNm: number }) {
  if (!material) {
    return <div className="maxwell-material-passport warning">Missing material reference</div>;
  }
  const range = materialWavelengthRange(material);
  const outsideRange = range ? wavelengthNm * 1e-9 < range[0] || wavelengthNm * 1e-9 > range[1] : false;
  return (
    <div className={`maxwell-material-passport${outsideRange ? " warning" : ""}`} title={material.source}>
      <span>{material.origin === "imported" ? "Imported" : "Built-in diagnostic"}</span>
      <strong>{material.materialHash.slice(0, 10)}</strong>
      <span>{formatWavelengthRange(range)}</span>
      <span>{material.origin === "imported" ? material.sourcePackLabel ?? material.sourcePackId ?? "imported pack" : material.sourceRecordId}</span>
      {outsideRange && <span>outside wavelength range</span>}
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

function exportStackJson(
  stack: CoatingStackDefinition,
  materialCatalog: MaxwellMaterialCatalog,
  run: CoatingStackRunResult,
  sweep: CoatingSweepResult,
  foundry: CoatingDesignResult,
  yieldAnalysis: CoatingYieldResult
): void {
  const design = serializeCoatingStackDesign(stack, materialCatalog);
  downloadText("l54-coating-material-selection-stack.json", "application/json", JSON.stringify({ design, run, sweep, foundry, yieldAnalysis }, null, 2));
}

function exportStackSummary(run: CoatingStackRunResult, sweep: CoatingSweepResult, foundry: CoatingDesignResult, yieldAnalysis: CoatingYieldResult): void {
  downloadText(
    "l54-coating-material-selection-stack.md",
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
      "Material references:",
      ...run.materialCatalogRefs.map((reference) => `- ${reference.label}: ${reference.materialId} / ${reference.materialHash}`),
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

function exportSearchJson(search: CoatingSearchResult): void {
  downloadText("l55-coating-search.json", "application/json", JSON.stringify(search, null, 2));
}

function exportRobustSearchJson(search: RobustCoatingSearchResult): void {
  downloadText("l57-drift-correlation-robust-coating-search.json", "application/json", JSON.stringify(search, null, 2));
}

function exportYieldJson(yieldAnalysis: CoatingYieldResult): void {
  downloadText("l52-yield-analysis.json", "application/json", JSON.stringify(yieldAnalysis, null, 2));
}

function exportMaterialTemplateJson(): void {
  downloadText("l54-material-import-template.json", "application/json", JSON.stringify(createMaterialImportTemplate(), null, 2));
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

function materialEntryFor(materialId: string, materialCatalog: MaxwellMaterialCatalog): MaterialCatalogEntry | undefined {
  return listCatalogMaterials(materialCatalog).find((material) => material.id === materialId);
}

function materialLabel(materialId: string, materialCatalog: MaxwellMaterialCatalog): string {
  return materialEntryFor(materialId, materialCatalog)?.label ?? materialId;
}

function defaultThicknessNm(materialId: string): number {
  if (materialId === "tio2") return 50;
  if (materialId === "sio2") return 100;
  if (materialId === "chromiumLossy") return 18;
  if (materialId === "silicon") return 200;
  return 100;
}

function parseNumberList(value: string): number[] {
  return value
    .split(/[,;\s]+/)
    .map((part) => Number(part.trim()))
    .filter((part) => Number.isFinite(part) && part > 0);
}

function parseSignedNumberList(value: string): number[] {
  return value
    .split(/[,;\s]+/)
    .map((part) => Number(part.trim()))
    .filter((part) => Number.isFinite(part));
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatSearchStack(candidate: CoatingSearchCandidate): string {
  if (candidate.layers.length === 0) return "Bare boundary";
  return candidate.layers.map((layer) => `${layer.label} ${(layer.thicknessM * 1e9).toFixed(1)} nm`).join(" / ");
}

function formatUncertaintyReceipt(receipt: RobustCoatingSearchCandidate["uncertaintyReceipt"]): string {
  const parts = [receipt.label];
  if (receipt.model === "independent-thickness") parts.push(`${(receipt.sigmaNm ?? 0).toFixed(2)} nm sigma`);
  if (receipt.globalThicknessScale) parts.push(`${formatPercent(receipt.globalThicknessScale.sigmaFraction)} scale sigma`);
  if (receipt.globalThicknessOffsetNm) parts.push(`${receipt.globalThicknessOffsetNm.sigmaNm.toFixed(2)} nm offset sigma`);
  if (receipt.perLayerResidualNm) parts.push(`${receipt.perLayerResidualNm.sigmaNm.toFixed(2)} nm residual sigma`);
  if (receipt.layerGroupDrift?.length) parts.push(`${receipt.layerGroupDrift.length} group driver${receipt.layerGroupDrift.length === 1 ? "" : "s"}`);
  return parts.join(" / ");
}

function formatUncertaintySamples(receipt: RobustCoatingSearchCandidate["uncertaintyReceipt"]): string {
  const reduction = receipt.sampleReduction === "none" ? "full grid" : "deterministic cap";
  return `${receipt.generatedSamplesPerCandidate}/${receipt.theoreticalSamplesPerCandidate} samples / ${reduction}`;
}

function formatSignedExponential(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toExponential(2)}`;
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

function materialWavelengthRange(material: MaterialCatalogEntry): [number, number] | null {
  if (material.samples.length === 0) return null;
  const wavelengths = material.samples.map((sample) => sample.wavelengthM);
  return [Math.min(...wavelengths), Math.max(...wavelengths)];
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
