import type { SolverResult } from "@emmicro/core";

const bytesPerPixelEstimate = 8 * 8;

export function L3BenchmarkPanel({ result }: { result: SolverResult | null }) {
  const stats = result?.performanceStats;
  return (
    <div className="analysis-panel">
      <h3>Performance</h3>
      <div className="analysis-grid">
        <Metric label="Grid" value={stats?.gridWidth && stats.gridHeight ? `${stats.gridWidth} x ${stats.gridHeight}` : "n/a"} />
        <Metric label="Compute" value={stats ? `${stats.computeMs.toFixed(0)} ms` : "n/a"} />
        <Metric label="FFT count" value={stats?.fftCount === undefined ? "n/a" : String(stats.fftCount)} />
        <Metric label="Memory" value={stats?.estimatedBytes ? formatBytes(stats.estimatedBytes) : "n/a"} />
        <Metric label="Worker" value={stats ? (stats.workerUsed ? "yes" : "no") : "n/a"} />
        <Metric label="Cache" value={stats ? (stats.cacheHit ? "hit" : "miss") : "n/a"} />
      </div>
      <div className="benchmark-grid" aria-label="L3 grid benchmark estimates">
        {[128, 256, 512, 1024].map((size) => (
          <div key={size} className="benchmark-row">
            <span>{size}²</span>
            <strong>{formatBytes(size * size * bytesPerPixelEstimate)}</strong>
            <em>{size >= 1024 ? "experimental" : size >= 512 ? "worker" : "standard"}</em>
          </div>
        ))}
      </div>
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

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}
