import { useState } from "react";
import { measurementRoiWarnings2D, type MeasuredImage2D, type MeasurementRoi2D, type Scene } from "@emmicro/core";

const roiTypes: MeasurementRoi2D["type"][] = ["slantedEdge", "linePairs", "psfSpot", "flatField"];

export function RoiPanel({ image, scene, updateScene }: { image?: MeasuredImage2D; scene: Scene; updateScene: (updater: (current: Scene) => Scene) => void }) {
  const [selectedRoiId, setSelectedRoiId] = useState<string>("");
  if (!image) return null;
  const activeImage = image;
  const rois = scene.measurementRois2D.filter((roi) => roi.imageId === activeImage.id);
  const roi = rois.find((candidate) => candidate.id === selectedRoiId) ?? rois[0];
  const warnings = roi ? measurementRoiWarnings2D(roi, activeImage) : [];

  function addRoi(type: MeasurementRoi2D["type"]): void {
    const next: MeasurementRoi2D = {
      id: `roi-${Date.now().toString(36)}`,
      imageId: activeImage.id,
      label: `${type} ROI`,
      type,
      xPx: Math.round(activeImage.widthPx * 0.25),
      yPx: Math.round(activeImage.heightPx * 0.25),
      widthPx: Math.max(8, Math.round(activeImage.widthPx * 0.5)),
      heightPx: Math.max(8, Math.round(activeImage.heightPx * 0.5)),
      rotationRad: type === "slantedEdge" ? (5 * Math.PI) / 180 : 0
    };
    updateScene((current) => ({ ...current, measurementRois2D: [next, ...current.measurementRois2D] }));
    setSelectedRoiId(next.id);
  }

  function updateRoi(patch: Partial<MeasurementRoi2D>): void {
    if (!roi) return;
    updateScene((current) => ({
      ...current,
      measurementRois2D: current.measurementRois2D.map((candidate) => (candidate.id === roi.id ? { ...candidate, ...patch } : candidate))
    }));
  }

  return (
    <section className="analysis-panel">
      <div className="panel-heading">
        <h3>ROI</h3>
        <div className="compact-actions">
          {roiTypes.map((type) => (
            <button key={type} type="button" onClick={() => addRoi(type)}>
              {type}
            </button>
          ))}
        </div>
      </div>
      {roi ? (
        <>
          <label className="field-row">
            <span>Active</span>
            <select value={roi.id} onChange={(event) => setSelectedRoiId(event.currentTarget.value)}>
              {rois.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.label}
                </option>
              ))}
            </select>
          </label>
          <TextField label="Label" value={roi.label} onChange={(label) => updateRoi({ label })} />
          <label className="field-row">
            <span>Type</span>
            <select value={roi.type} onChange={(event) => updateRoi({ type: event.currentTarget.value as MeasurementRoi2D["type"] })}>
              {["slantedEdge", "linePairs", "usafStyleBars", "psfSpot", "flatField", "darkFrame", "freeformRect"].map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <NumberField label="x" value={roi.xPx} min={0} step={1} onChange={(value) => updateRoi({ xPx: Math.max(0, value) })} />
          <NumberField label="y" value={roi.yPx} min={0} step={1} onChange={(value) => updateRoi({ yPx: Math.max(0, value) })} />
          <NumberField label="w" value={roi.widthPx} min={1} step={1} onChange={(value) => updateRoi({ widthPx: Math.max(1, value) })} />
          <NumberField label="h" value={roi.heightPx} min={1} step={1} onChange={(value) => updateRoi({ heightPx: Math.max(1, value) })} />
          <NumberField label="Rotate" unit="deg" value={((roi.rotationRad ?? 0) * 180) / Math.PI} step={1} onChange={(value) => updateRoi({ rotationRad: (value * Math.PI) / 180 })} />
          {warnings.length > 0 && (
            <ul className="warning-list">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <div className="empty-state">Add an ROI for the imported measured image.</div>
      )}
    </section>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field-row">
      <span>{label}</span>
      <input type="text" value={value} onChange={(event) => onChange(event.currentTarget.value)} />
    </label>
  );
}

function NumberField({ label, value, unit, min, step, onChange }: { label: string; value: number; unit?: string; min?: number; step?: number; onChange: (value: number) => void }) {
  return (
    <label className="field-row">
      <span>{label}</span>
      <div className="number-input">
        <input type="number" value={formatNumberInputValue(value)} min={min} step={step ?? 0.1} onChange={(event) => onChange(Number(event.currentTarget.value))} />
        {unit && <em>{unit}</em>}
      </div>
    </label>
  );
}

function formatNumberInputValue(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (value === 0) return "0";
  const rounded = Math.abs(value) >= 1e-3 ? Number(value.toFixed(6)) : Number(value.toPrecision(6));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}
