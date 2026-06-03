import { useEffect, useMemo, useRef } from "react";
import type { CameraImageOutput2D } from "@emmicro/core";

export function SensorImageView({ image }: { image: CameraImageOutput2D }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const peak = useMemo(() => maxDigital(image.digitalNumbers), [image]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const bitmap = context.createImageData(image.widthPx, image.heightPx);
    for (let index = 0; index < image.digitalNumbers.length; index += 1) {
      const value = peak > 0 ? (image.digitalNumbers[index] ?? 0) / peak : 0;
      const [red, green, blue] = sensorColor(value);
      const offset = index * 4;
      bitmap.data[offset] = red;
      bitmap.data[offset + 1] = green;
      bitmap.data[offset + 2] = blue;
      bitmap.data[offset + 3] = 255;
    }
    context.putImageData(bitmap, 0, 0);
  }, [image, peak]);

  return (
    <div className="intensity-image-card">
      <canvas
        ref={canvasRef}
        className="intensity-image-canvas"
        width={image.widthPx}
        height={image.heightPx}
        aria-label="L3.2 virtual camera image"
      />
      <div className="image-axis-row">
        <span>{formatAxis(image.uMinM)}</span>
        <span>camera DN</span>
        <span>{formatAxis(image.uMaxM)}</span>
      </div>
      <div className="image-axis-row">
        <span>{image.widthPx} x {image.heightPx}</span>
        <span>Peak DN {peak}</span>
        <span>{formatAxis(image.pixelPitchM)} px</span>
      </div>
    </div>
  );
}

function maxDigital(values: Uint16Array): number {
  let max = 0;
  for (const value of values) max = Math.max(max, value);
  return max;
}

function sensorColor(value: number): [number, number, number] {
  const x = Math.max(0, Math.min(1, value));
  return [Math.round(20 + x * 235), Math.round(28 + x * 220), Math.round(44 + x * 185)];
}

function formatAxis(valueM: number): string {
  const abs = Math.abs(valueM);
  if (abs >= 1e-3) return `${(valueM * 1e3).toFixed(2)} mm`;
  if (abs >= 1e-6) return `${(valueM * 1e6).toFixed(1)} um`;
  return `${valueM.toExponential(2)} m`;
}
