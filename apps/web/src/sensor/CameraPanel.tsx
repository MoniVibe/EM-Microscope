import type { CameraImageOutput2D, CameraModel2D } from "@emmicro/core";
import { SensorImageView } from "./SensorImageView";

export function CameraPanel({
  camera,
  image,
  onCameraChange
}: {
  camera: CameraModel2D;
  image: CameraImageOutput2D | null;
  onCameraChange: (camera: CameraModel2D) => void;
}) {
  return (
    <div className="analysis-panel">
      <h3>Camera</h3>
      <CameraNumber label="Pixel" value={camera.pixelPitchM * 1e6} unit="um" step={0.1} onChange={(value) => onCameraChange({ ...camera, pixelPitchM: value * 1e-6 })} />
      <CameraNumber label="Exposure" value={camera.exposureS * 1e3} unit="ms" step={0.25} onChange={(value) => onCameraChange({ ...camera, exposureS: Math.max(1e-6, value * 1e-3) })} />
      <CameraNumber label="QE" value={camera.quantumEfficiency * 100} unit="%" step={1} onChange={(value) => onCameraChange({ ...camera, quantumEfficiency: Math.max(0, Math.min(1, value / 100)) })} />
      <CameraNumber label="Full well" value={camera.fullWellElectrons} unit="e-" step={500} onChange={(value) => onCameraChange({ ...camera, fullWellElectrons: Math.max(1, value) })} />
      <CameraNumber label="Read noise" value={camera.readNoiseElectronsRms} unit="e-" step={0.1} onChange={(value) => onCameraChange({ ...camera, readNoiseElectronsRms: Math.max(0, value) })} />
      <CameraNumber label="Dark" value={camera.darkCurrentElectronsPerS} unit="e-/s" step={0.1} onChange={(value) => onCameraChange({ ...camera, darkCurrentElectronsPerS: Math.max(0, value) })} />
      <label className="field-row">
        <span>Bit depth</span>
        <select value={camera.bitDepth} onChange={(event) => onCameraChange({ ...camera, bitDepth: Number(event.currentTarget.value) as CameraModel2D["bitDepth"] })}>
          {[8, 10, 12, 14, 16].map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </label>
      {image && <SensorImageView image={image} />}
    </div>
  );
}

function CameraNumber({
  label,
  value,
  unit,
  step,
  onChange
}: {
  label: string;
  value: number;
  unit: string;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field-row">
      <span>{label}</span>
      <div className="number-input">
        <input type="number" value={formatValue(value)} step={step} onChange={(event) => onChange(Number(event.currentTarget.value))} />
        <em>{unit}</em>
      </div>
    </label>
  );
}

function formatValue(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return String(Number(value.toFixed(6)));
}
