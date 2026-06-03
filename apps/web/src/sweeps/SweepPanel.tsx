import type { SweepDefinition, SweepResult } from "@emmicro/core";
import { Download, Play, Save } from "lucide-react";

export function SweepPanel({
  definition,
  result,
  onRun,
  onExportCsv,
  onExportJson
}: {
  definition: SweepDefinition | null;
  result: SweepResult | null;
  onRun: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
}) {
  return (
    <div className="analysis-panel">
      <h3>Sweep</h3>
      <div className="wave-actions compact-actions">
        <button type="button" disabled={!definition} onClick={onRun}>
          <Play size={15} />
          <span>Run sweep</span>
        </button>
        <button type="button" disabled={!result} onClick={onExportCsv}>
          <Download size={15} />
          <span>CSV</span>
        </button>
        <button type="button" disabled={!result} onClick={onExportJson}>
          <Save size={15} />
          <span>JSON</span>
        </button>
      </div>
      {definition && (
        <span className="provenance-note">
          {definition.label}: {definition.parameters.map((parameter) => `${parameter.kind} (${parameter.values.length})`).join(" x ")}
        </span>
      )}
      {result ? (
        <div className="sweep-table" aria-label="L3.2 sweep results">
          {result.rows.slice(0, 8).map((row, index) => (
            <div key={`${result.id}-${index}`} className="sweep-row">
              <span>{formatParameters(row.parameters)}</span>
              <strong>{formatOutputs(row.outputs)}</strong>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">No sweep results yet.</div>
      )}
    </div>
  );
}

function formatParameters(parameters: Record<string, number>): string {
  return Object.entries(parameters)
    .map(([key, value]) => `${key}=${formatNumber(value)}`)
    .join(", ");
}

function formatOutputs(outputs: Record<string, number | null>): string {
  return Object.entries(outputs)
    .map(([key, value]) => `${key}=${value === null ? "n/a" : formatNumber(value)}`)
    .join(", ");
}

function formatNumber(value: number): string {
  if (Math.abs(value) >= 1000 || Math.abs(value) < 0.01) return value.toExponential(2);
  return value.toFixed(3);
}
