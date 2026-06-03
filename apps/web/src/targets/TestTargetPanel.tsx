import { testTargetCyclesPerM, testTargetFeaturePeriodM, type TestTarget2D } from "@emmicro/core";

export function TestTargetPanel({ target }: { target?: TestTarget2D }) {
  if (!target) return null;
  const periodM = testTargetFeaturePeriodM(target);
  const cyclesPerM = testTargetCyclesPerM(target);
  return (
    <section className="analysis-panel">
      <h3>Test Target</h3>
      <div className="analysis-grid">
        <Metric label="Kind" value={target.kind} />
        <Metric label="Contrast" value={"contrast" in target ? target.contrast.toFixed(2) : "n/a"} />
        <Metric label="Period" value={periodM === null ? "n/a" : `${(periodM * 1e6).toFixed(1)} um`} />
        <Metric label="Frequency" value={cyclesPerM === null ? "n/a" : `${cyclesPerM.toExponential(2)} cyc/m`} />
      </div>
      <p className="provenance-note">{target.label}</p>
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
