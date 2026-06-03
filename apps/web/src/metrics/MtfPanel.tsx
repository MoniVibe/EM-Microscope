import type { MtfMetrics2D, PsfMetrics2D, SamplingMetrics2D } from "@emmicro/core";

export function MtfPanel({ mtf, psf, sampling }: { mtf: MtfMetrics2D | null; psf: PsfMetrics2D | null; sampling: SamplingMetrics2D | null }) {
  if (!mtf || !psf) return null;
  return (
    <div className="analysis-panel">
      <h3>MTF / PSF</h3>
      <div className="analysis-grid">
        <Metric label="MTF50" value={formatFrequency(mtf.mtf50CyclesPerM)} />
        <Metric label="MTF10" value={formatFrequency(mtf.mtf10CyclesPerM)} />
        <Metric label="Cutoff" value={formatFrequency(mtf.cutoffCyclesPerM)} />
        <Metric label="FWHM u/v" value={`${formatLength(psf.fwhmUM)} / ${formatLength(psf.fwhmVM)}`} />
      </div>
      <MtfCurve mtf={mtf} targetFrequency={sampling?.targetFrequencyCyclesPerM ?? null} />
      <span className="provenance-note">{mtf.provenanceLabel}</span>
      {psf.warnings.length > 0 && (
        <ul className="warning-list">
          {psf.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MtfCurve({ mtf, targetFrequency }: { mtf: MtfMetrics2D; targetFrequency: number | null }) {
  const width = 240;
  const height = 96;
  const maxFrequency = mtf.radial[mtf.radial.length - 1]?.frequencyCyclesPerM ?? 1;
  const points = mtf.radial
    .map((bin) => {
      const x = (bin.frequencyCyclesPerM / maxFrequency) * width;
      const y = height - Math.max(0, Math.min(1, bin.mtf)) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const targetX = targetFrequency === null ? null : Math.max(0, Math.min(width, (targetFrequency / maxFrequency) * width));
  return (
    <svg className="metric-plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Radial MTF curve">
      <rect x="0" y="0" width={width} height={height} />
      <polyline points={points} />
      {targetX !== null && <line className="target-line" x1={targetX} x2={targetX} y1="0" y2={height} />}
    </svg>
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

function formatFrequency(value: number | null): string {
  return value === null ? "n/a" : `${(value / 1000).toFixed(1)} cyc/mm`;
}

function formatLength(value: number | null): string {
  if (value === null) return "n/a";
  const abs = Math.abs(value);
  if (abs >= 1e-3) return `${(value * 1e3).toFixed(2)} mm`;
  return `${(value * 1e6).toFixed(2)} um`;
}
