import { useEffect, useMemo, useRef } from "react";
import type { FieldOutput2D } from "@emmicro/core";

export function IntensityImageView({ field }: { field: FieldOutput2D }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const peak = useMemo(() => maxValue(field.intensity), [field]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawIntensityToCanvas(canvas, field);
  }, [field]);

  return (
    <div className="intensity-image-card">
      <canvas
        ref={canvasRef}
        width={field.width}
        height={field.height}
        aria-label="L3 2D normalized intensity image"
        className="intensity-image-canvas"
      />
      <div className="image-axis-row">
        <span>{formatAxis(field.uMinM)}</span>
        <span>I/Imax</span>
        <span>{formatAxis(field.uMaxM)}</span>
      </div>
      <div className="image-axis-row">
        <span>{field.width} x {field.height}</span>
        <span>Peak {peak.toExponential(3)}</span>
        <span>{formatAxis(field.vMaxM)}</span>
      </div>
    </div>
  );
}

export function fieldImageToPngDataUrl(field: FieldOutput2D): string {
  const canvas = document.createElement("canvas");
  canvas.width = field.width;
  canvas.height = field.height;
  drawIntensityToCanvas(canvas, field);
  return canvas.toDataURL("image/png");
}

function drawIntensityToCanvas(canvas: HTMLCanvasElement, field: FieldOutput2D): void {
  const context = canvas.getContext("2d");
  if (!context) return;
  const image = context.createImageData(field.width, field.height);
  const peak = maxValue(field.intensity);
  for (let index = 0; index < field.intensity.length; index += 1) {
    const normalized = peak > 0 ? Math.sqrt((field.intensity[index] ?? 0) / peak) : 0;
    const [red, green, blue] = heatColor(normalized);
    const offset = index * 4;
    image.data[offset] = red;
    image.data[offset + 1] = green;
    image.data[offset + 2] = blue;
    image.data[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);
}

function heatColor(value: number): [number, number, number] {
  const x = Math.max(0, Math.min(1, value));
  if (x < 0.33) {
    const t = x / 0.33;
    return [Math.round(20 + t * 10), Math.round(32 + t * 95), Math.round(54 + t * 155)];
  }
  if (x < 0.66) {
    const t = (x - 0.33) / 0.33;
    return [Math.round(30 + t * 90), Math.round(127 + t * 95), Math.round(209 - t * 150)];
  }
  const t = (x - 0.66) / 0.34;
  return [Math.round(120 + t * 135), Math.round(222 + t * 25), Math.round(59 - t * 45)];
}

function maxValue(values: Float64Array): number {
  let max = 0;
  for (const value of values) max = Math.max(max, value);
  return max;
}

function formatAxis(valueM: number): string {
  return `${(valueM * 1000).toFixed(2)} mm`;
}
