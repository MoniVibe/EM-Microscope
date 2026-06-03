import { useState } from "react";
import { defaultFitPresets2D, type FitPresetId2D, type FitRunOutput2D, type ComparisonRunOutput2D } from "@emmicro/core";
import { Gauge, RotateCcw } from "lucide-react";

export function FitPanel({
  comparison,
  fit,
  running,
  progress,
  cacheHit,
  onRunFit,
  onCancelFit,
  onExportFitCsv
}: {
  comparison: ComparisonRunOutput2D | null;
  fit: FitRunOutput2D | null;
  running: boolean;
  progress: number;
  cacheHit: boolean;
  onRunFit: (presetId: FitPresetId2D) => void;
  onCancelFit: () => void;
  onExportFitCsv: () => void;
}) {
  const activePreset = defaultFitPresets2D[0];
  const defaultId = activePreset?.id ?? "focus";
  const [selectedPresetId, setSelectedPresetId] = useState<FitPresetId2D>(defaultId);
  const selectedPreset = defaultFitPresets2D.find((preset) => preset.id === selectedPresetId) ?? activePreset;

  return (
    <section className="analysis-panel">
      <div className="panel-heading">
        <h3>Fit</h3>
        <div className="compact-actions">
          {running && (
            <button type="button" onClick={onCancelFit}>
              <RotateCcw size={15} />
              <span>Cancel</span>
            </button>
          )}
          <button type="button" disabled={!comparison || !selectedPreset || running} onClick={() => onRunFit(selectedPreset?.id ?? defaultId)}>
            <Gauge size={15} />
            <span>Run</span>
          </button>
          <button type="button" disabled={!fit} onClick={onExportFitCsv}>
            <Gauge size={15} />
            <span>Grid</span>
          </button>
        </div>
      </div>
      <label className="field-row">
        <span>Preset</span>
        <select value={selectedPresetId} onChange={(event) => setSelectedPresetId(event.currentTarget.value as FitPresetId2D)}>
          {defaultFitPresets2D.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>
      {selectedPreset && (
        <div className="fit-parameter-list">
          {selectedPreset.parameters.map((parameter) => (
            <div key={parameter.kind} className="compact-stat">
              <span>{parameter.kind}</span>
              <strong>
                {formatNumber(parameter.min)}..{formatNumber(parameter.max)} / {parameter.steps}
              </strong>
            </div>
          ))}
        </div>
      )}
      {running && (
        <div className="l3-status">
          <div>
            <strong>Fit running</strong>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <progress value={progress} max={100} />
        </div>
      )}
      {!comparison && <div className="empty-state">Run Compare before fitting measured data.</div>}
      {fit && (
        <>
          <div className="analysis-grid">
            <Metric label="Score" value={fit.score.toFixed(5)} />
            <Metric label="Residual" value={fit.residualRms.toFixed(5)} />
            <Metric label="Grid" value={String(fit.evaluatedCount)} />
            <Metric label="Cache" value={cacheHit ? "hit" : "miss"} />
          </div>
          <div className="fit-parameter-list">
            {Object.entries(fit.bestParameters).map(([key, value]) => (
              <div key={key} className="compact-stat">
                <span>{key}</span>
                <strong>{formatNumber(value ?? 0)}</strong>
              </div>
            ))}
          </div>
          <div className="l2-disclosure">
            <strong>{fit.confidenceLabel}</strong>
            <span>Deterministic grid-search estimate; diagnostic only.</span>
          </div>
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="compact-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "n/a";
  return Math.abs(value) >= 1e-3 && Math.abs(value) < 1e4 ? value.toFixed(4) : value.toExponential(2);
}
