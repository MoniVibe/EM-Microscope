import type { ComparisonMetricDelta2D } from "@emmicro/core";

export function MetricTable({ deltas }: { deltas: ComparisonMetricDelta2D[] }) {
  if (deltas.length === 0) {
    return <div className="empty-state">No comparable measured/simulated metrics for the active ROI.</div>;
  }
  return (
    <div className="metric-table-wrap">
      <table className="metric-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Measured</th>
            <th>Sim</th>
            <th>Delta</th>
          </tr>
        </thead>
        <tbody>
          {deltas.map((delta) => (
            <tr key={`${delta.roiId}-${delta.metric}`}>
              <td>{delta.metric}</td>
              <td>{formatMetric(delta.measured, delta.unit)}</td>
              <td>{formatMetric(delta.simulated, delta.unit)}</td>
              <td>{formatMetric(delta.delta, delta.unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatMetric(value: number, unit?: string): string {
  const formatted = Math.abs(value) >= 1e-3 && Math.abs(value) < 1e4 ? value.toFixed(4) : value.toExponential(3);
  return unit ? `${formatted} ${unit}` : formatted;
}
