import { crossSectionsThroughPeak, radialProfile2D, summarizeImage2D, type FieldOutput2D } from "@emmicro/core";

export function ImageAnalysisPanel({ field }: { field: FieldOutput2D | undefined }) {
  if (!field) return null;

  const summary = summarizeImage2D(field);
  const crossSections = crossSectionsThroughPeak(field);
  const radial = radialProfile2D(field, 48);
  const firstLowBin = radial.find((bin) => bin.samples > 0 && bin.normalized < 0.1);
  const horizontalHalf = firstCrossing(crossSections.horizontal.map((sample) => sample.normalized), 0.5);
  const verticalHalf = firstCrossing(crossSections.vertical.map((sample) => sample.normalized), 0.5);

  return (
    <div className="analysis-panel">
      <h3>Image Analysis</h3>
      <div className="analysis-grid">
        <Metric label="Centroid u" value={formatLength(summary.centroidUM)} />
        <Metric label="Centroid v" value={formatLength(summary.centroidVM)} />
        <Metric label="Edge frac" value={summary.edgeFraction.toExponential(2)} />
        <Metric label="Dynamic" value={summary.dynamicRange.toExponential(2)} />
        <Metric label="Radial low" value={firstLowBin ? formatLength(firstLowBin.radiusM) : "n/a"} />
        <Metric label="Half-width" value={horizontalHalf === null || verticalHalf === null ? "n/a" : `${horizontalHalf}/${verticalHalf} px`} />
      </div>
    </div>
  );
}

export function validationSummaryText(field: FieldOutput2D | undefined): string {
  if (!field) return "No L3 image has been computed.";
  const summary = summarizeImage2D(field);
  const radial = radialProfile2D(field, 48);
  const firstLowBin = radial.find((bin) => bin.samples > 0 && bin.normalized < 0.1);
  return [
    `L3 field: ${field.width} x ${field.height}`,
    `Peak intensity: ${summary.peakIntensity.toExponential(6)}`,
    `Centroid: u=${summary.centroidUM.toExponential(6)} m, v=${summary.centroidVM.toExponential(6)} m`,
    `Edge fraction: ${summary.edgeFraction.toExponential(6)}`,
    `Radial low bin: ${firstLowBin ? firstLowBin.radiusM.toExponential(6) : "n/a"} m`,
    "Model: coherent 2D scalar image-plane intensity approximation"
  ].join("\n");
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="compact-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function firstCrossing(values: number[], threshold: number): number | null {
  const center = Math.floor(values.length / 2);
  for (let index = center; index < values.length; index += 1) {
    if ((values[index] ?? 0) < threshold) return index - center;
  }
  return null;
}

function formatLength(valueM: number): string {
  const abs = Math.abs(valueM);
  if (abs >= 1e-3) return `${(valueM * 1e3).toFixed(3)} mm`;
  if (abs >= 1e-6) return `${(valueM * 1e6).toFixed(2)} um`;
  return `${valueM.toExponential(2)} m`;
}
