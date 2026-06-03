import type { EngineeringReport } from "@emmicro/core";
import { FileDown, Save } from "lucide-react";

export function ReportPanel({
  report,
  onExportJson,
  onExportMarkdown,
  onExportHtml
}: {
  report: EngineeringReport | null;
  onExportJson: () => void;
  onExportMarkdown: () => void;
  onExportHtml: () => void;
}) {
  return (
    <div className="analysis-panel">
      <h3>Report</h3>
      <div className="wave-actions compact-actions">
        <button type="button" disabled={!report} onClick={onExportJson}>
          <Save size={15} />
          <span>JSON</span>
        </button>
        <button type="button" disabled={!report} onClick={onExportMarkdown}>
          <FileDown size={15} />
          <span>MD</span>
        </button>
        <button type="button" disabled={!report} onClick={onExportHtml}>
          <FileDown size={15} />
          <span>HTML</span>
        </button>
      </div>
      {report ? (
        <div className="analysis-grid">
          <Metric label="Warnings" value={String(report.warnings.length)} />
          <Metric label="Limitations" value={String(report.limitations.length)} />
          <Metric label="Scene" value={report.scene.sceneHash.slice(0, 10)} />
          <Metric label="Result" value={report.solver.resultHash?.slice(0, 10) ?? "n/a"} />
        </div>
      ) : (
        <div className="empty-state">Compute an L3 image to generate an engineering report.</div>
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
