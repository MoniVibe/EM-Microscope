import type { ResolutionTargetMetrics2D } from "@emmicro/core";

export function ResolutionTargetPanel({ metrics }: { metrics: ResolutionTargetMetrics2D | null }) {
  if (!metrics) return null;
  return (
    <section className="analysis-panel">
      <h3>Resolution Target</h3>
      <div className="analysis-grid">
        <Metric label="Contrast" value={metrics.contrastMichelson === null ? "n/a" : metrics.contrastMichelson.toFixed(3)} />
        <Metric label="Resolved" value={metrics.resolved === null ? "n/a" : metrics.resolved ? "yes" : "no"} />
        <Metric label="Target freq" value={metrics.targetCyclesPerM === null ? "n/a" : `${metrics.targetCyclesPerM.toExponential(2)} cyc/m`} />
        <Metric label="SFR50" value={metrics.sfr50CyclesPerM === null ? "n/a" : `${metrics.sfr50CyclesPerM.toExponential(2)} cyc/m`} />
      </div>
      <p className="provenance-note">{metrics.provenanceLabel}</p>
      {metrics.warnings.length > 0 && (
        <ul className="warning-list">
          {metrics.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
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
