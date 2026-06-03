import type { ImageCalibration2D, MeasuredImage2D, Scene } from "@emmicro/core";

export function CalibrationPanel({ image, updateScene }: { image?: MeasuredImage2D; updateScene: (updater: (current: Scene) => Scene) => void }) {
  if (!image) return null;
  const calibration = image.calibration ?? {};
  const updateCalibration = (patch: Partial<ImageCalibration2D>) => {
    updateScene((current) => ({
      ...current,
      measuredImages2D: current.measuredImages2D.map((candidate) =>
        candidate.id === image.id
          ? {
              ...candidate,
              calibration: {
                ...(candidate.calibration ?? {}),
                ...patch
              }
            }
          : candidate
      )
    }));
  };

  return (
    <section className="analysis-panel">
      <h3>Calibration</h3>
      <NumberField label="Pixel U" unit="um" value={calibration.pixelSizeUM ?? 0} step={0.05} onChange={(value) => updateCalibration({ pixelSizeUM: Math.max(1e-9, value) })} />
      <NumberField label="Pixel V" unit="um" value={calibration.pixelSizeVM ?? 0} step={0.05} onChange={(value) => updateCalibration({ pixelSizeVM: Math.max(1e-9, value) })} />
      <NumberField label="Mag" value={calibration.magnification ?? 1} min={0.001} step={0.5} onChange={(value) => updateCalibration({ magnification: Math.max(0.001, value) })} />
      <NumberField label="Wavelength" unit="nm" value={(calibration.wavelengthM ?? 0) * 1e9} min={0} step={5} onChange={(value) => updateCalibration({ wavelengthM: Math.max(1e-12, value * 1e-9) })} />
      <NumberField label="Obj NA" value={calibration.objectiveNA ?? 0} min={0} max={1.4} step={0.005} onChange={(value) => updateCalibration({ objectiveNA: Math.max(0, value) })} />
      <NumberField label="Source NA" value={calibration.sourceNA ?? 0} min={0} max={1.4} step={0.005} onChange={(value) => updateCalibration({ sourceNA: Math.max(0, value) })} />
      <NumberField label="Exposure" unit="s" value={calibration.exposureS ?? 0} min={0} step={0.001} onChange={(value) => updateCalibration({ exposureS: Math.max(1e-9, value) })} />
      <label className="field-row">
        <span>Bit depth</span>
        <select
          value={calibration.bitDepth ?? ""}
          onChange={(event) =>
            updateCalibration({
              bitDepth: event.currentTarget.value === "" ? undefined : (Number(event.currentTarget.value) as ImageCalibration2D["bitDepth"])
            })
          }
        >
          <option value="">Unknown</option>
          {[8, 10, 12, 14, 16].map((bits) => (
            <option key={bits} value={bits}>
              {bits}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}

function NumberField({
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange
}: {
  label: string;
  value: number;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field-row">
      <span>{label}</span>
      <div className="number-input">
        <input type="number" value={formatNumberInputValue(value)} min={min} max={max} step={step ?? 0.1} onChange={(event) => onChange(Number(event.currentTarget.value))} />
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
