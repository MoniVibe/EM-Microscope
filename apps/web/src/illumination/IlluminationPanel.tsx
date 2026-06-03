import type { PartialCoherenceOutput, SourceAngleSetOutput } from "@emmicro/core";

export function IlluminationPanel({
  sourceAngleSet,
  partialCoherence
}: {
  sourceAngleSet?: SourceAngleSetOutput;
  partialCoherence?: PartialCoherenceOutput;
}) {
  if (!sourceAngleSet && !partialCoherence) return null;
  const maxAngle = sourceAngleSet
    ? Math.max(...sourceAngleSet.samples.map((sample) => Math.hypot(sample.angleURad, sample.angleVRad)))
    : null;
  return (
    <section className="analysis-panel">
      <h3>Illumination</h3>
      <div className="analysis-grid">
        <Metric label="Angles" value={sourceAngleSet ? String(sourceAngleSet.samples.length) : "n/a"} />
        <Metric label="Weight sum" value={sourceAngleSet ? sourceAngleSet.weightSum.toFixed(6) : "n/a"} />
        <Metric label="Max angle" value={maxAngle === null ? "n/a" : `${(maxAngle * 1e3).toFixed(2)} mrad`} />
        <Metric label="Averaging" value={partialCoherence ? "intensity" : "n/a"} />
      </div>
      <p className="provenance-note">{partialCoherence?.provenanceLabel ?? "Partial-coherence source-angle set pending compute."}</p>
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
