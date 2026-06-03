import type { SamplingMetrics2D, SnrMetrics2D } from "@emmicro/core";

export function SnrPanel({ snr, sampling }: { snr: SnrMetrics2D | null; sampling: SamplingMetrics2D | null }) {
  if (!snr) return null;
  return (
    <div className="analysis-panel">
      <h3>SNR / Sampling</h3>
      <div className="analysis-grid">
        <Metric label="Mean SNR" value={snr.meanSnr.toFixed(2)} />
        <Metric label="Peak SNR" value={snr.peakSnr.toFixed(2)} />
        <Metric label="Saturation" value={`${(snr.saturationFraction * 100).toFixed(3)}%`} />
        <Metric label="Dyn range" value={snr.dynamicRange.toFixed(0)} />
        <Metric label="Nyquist" value={sampling ? formatFrequency(sampling.nyquistCyclesPerM) : "n/a"} />
        <Metric label="Target contrast" value={sampling?.contrastAtTarget === null || !sampling ? "n/a" : sampling.contrastAtTarget.toFixed(3)} />
      </div>
      {[...snr.warnings, ...(sampling?.warnings ?? [])].length > 0 && (
        <ul className="warning-list">
          {[...snr.warnings, ...(sampling?.warnings ?? [])].map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
    </div>
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

function formatFrequency(value: number): string {
  return `${(value / 1000).toFixed(1)} cyc/mm`;
}
