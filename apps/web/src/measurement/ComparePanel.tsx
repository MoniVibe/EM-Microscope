import type { ComparisonRunOutput2D, FieldOutput2D, FitRunOutput2D, MeasuredImage2D, MeasuredImagePixels2D, MeasurementRoi2D } from "@emmicro/core";
import { FileDown, Save, Waves } from "lucide-react";
import { MetricTable } from "./MetricTable";
import { ResidualView } from "./ResidualView";

export function ComparePanel({
  image,
  pixels,
  rois,
  field,
  comparison,
  fit,
  error,
  onRunCompare,
  onExportJson,
  onExportMarkdown,
  onExportHtml,
  onExportMetricsCsv,
  onExportResidualPng
}: {
  image?: MeasuredImage2D;
  pixels?: MeasuredImagePixels2D;
  rois: MeasurementRoi2D[];
  field?: FieldOutput2D;
  comparison: ComparisonRunOutput2D | null;
  fit: FitRunOutput2D | null;
  error: string | null;
  onRunCompare: () => void;
  onExportJson: () => void;
  onExportMarkdown: () => void;
  onExportHtml: () => void;
  onExportMetricsCsv: () => void;
  onExportResidualPng: () => void;
}) {
  const ready = Boolean(image && pixels && rois.length > 0 && field);
  const primary = comparison?.roiOutputs[0];
  return (
    <section className="analysis-panel">
      <div className="panel-heading">
        <h3>Compare</h3>
        <button type="button" disabled={!ready} onClick={onRunCompare}>
          <Waves size={15} />
          <span>Compare</span>
        </button>
      </div>
      <div className="l2-disclosure">
        <strong>measured-vs-simulated workbench</strong>
        <span>Not certified ISO 12233, EMVA 1288, clinical, or hardware calibration.</span>
      </div>
      {!image && <div className="empty-state">Import or load a measured fixture image.</div>}
      {image && !pixels && <div className="empty-state">Measured pixels are available only for the current browser session; re-import the image or use Fixture.</div>}
      {image && pixels && rois.length === 0 && <div className="empty-state">Add an ROI before comparing measured and simulated data.</div>}
      {image && pixels && rois.length > 0 && !field && <div className="empty-state">Compute an L3/L3.3 image before comparing to the measured ROI.</div>}
      {error && <div className="error-banner">{error}</div>}
      {comparison && (
        <>
          <div className="analysis-grid">
            <Metric label="Run" value={comparison.resultHash.slice(0, 10)} />
            <Metric label="ROIs" value={String(comparison.roiIds.length)} />
            <Metric label="Residual RMS" value={comparison.residualMap ? comparison.residualMap.rms.toFixed(4) : "n/a"} />
            <Metric label="Warnings" value={String(comparison.warnings.length + (fit?.warnings.length ?? 0))} />
          </div>
          <ResidualView residual={comparison.residualMap} />
          {primary && <CrossSectionPlot measured={primary.crossSection.measured} simulated={primary.crossSection.simulated} />}
          <MetricTable deltas={comparison.metricDeltas} />
          <div className="wave-actions compact-actions">
            <button type="button" onClick={onExportJson}>
              <Save size={15} />
              <span>JSON</span>
            </button>
            <button type="button" onClick={onExportMarkdown}>
              <FileDown size={15} />
              <span>MD</span>
            </button>
            <button type="button" onClick={onExportHtml}>
              <FileDown size={15} />
              <span>HTML</span>
            </button>
            <button type="button" onClick={onExportMetricsCsv}>
              <FileDown size={15} />
              <span>Metrics</span>
            </button>
            <button type="button" disabled={!comparison.residualMap} onClick={onExportResidualPng}>
              <FileDown size={15} />
              <span>Residual</span>
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function CrossSectionPlot({ measured, simulated }: { measured: number[]; simulated: number[] }) {
  const width = 220;
  const height = 70;
  const measuredPath = pathFor(measured, width, height);
  const simulatedPath = pathFor(simulated, width, height);
  return (
    <div className="cross-section-plot" aria-label="Measured and simulated cross-section plot">
      <svg viewBox={`0 0 ${width} ${height}`} role="img">
        <path d={simulatedPath} className="sim-line" />
        <path d={measuredPath} className="measured-line" />
      </svg>
      <div className="image-axis-row">
        <span>measured</span>
        <span>cross-section</span>
        <span>sim</span>
      </div>
    </div>
  );
}

function pathFor(values: number[], width: number, height: number): string {
  if (values.length === 0) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1e-9, max - min);
  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="compact-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
