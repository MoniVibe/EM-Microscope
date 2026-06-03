import { useEffect, useRef } from "react";
import type { ResidualMap2D } from "@emmicro/core";

export function ResidualView({ residual }: { residual?: ResidualMap2D }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !residual) return;
    drawResidualMap(canvas, residual);
  }, [residual]);

  if (!residual) return <div className="empty-state">Run Compare to render a residual map.</div>;

  return (
    <div className="residual-card">
      <canvas ref={canvasRef} width={residual.width} height={residual.height} aria-label="Measured simulated residual map" />
      <div className="image-axis-row">
        <span>{residual.width} x {residual.height}</span>
        <span>RMS {residual.rms.toFixed(4)}</span>
        <span>{residual.mode}</span>
      </div>
    </div>
  );
}

export function residualMapToPngDataUrl(residual: ResidualMap2D): string {
  const canvas = document.createElement("canvas");
  canvas.width = residual.width;
  canvas.height = residual.height;
  drawResidualMap(canvas, residual);
  return canvas.toDataURL("image/png");
}

function drawResidualMap(canvas: HTMLCanvasElement, residual: ResidualMap2D): void {
  const context = canvas.getContext("2d");
  if (!context) return;
  const image = context.createImageData(residual.width, residual.height);
  const maxAbs = Math.max(Math.abs(residual.min), Math.abs(residual.max), 1e-9);
  for (let index = 0; index < residual.values.length; index += 1) {
    const value = residual.values[index] ?? 0;
    const normalized = residual.mode === "absolute" ? Math.min(1, Math.abs(value) / maxAbs) : Math.max(-1, Math.min(1, value / maxAbs));
    const [red, green, blue] = residual.mode === "absolute" ? heat(Math.abs(normalized)) : diverging(normalized);
    const offset = index * 4;
    image.data[offset] = red;
    image.data[offset + 1] = green;
    image.data[offset + 2] = blue;
    image.data[offset + 3] = 255;
  }
  context.putImageData(image, 0, 0);
}

function diverging(value: number): [number, number, number] {
  const x = Math.max(-1, Math.min(1, value));
  if (x >= 0) {
    const t = x;
    return [Math.round(238 + t * 17), Math.round(242 - t * 132), Math.round(247 - t * 135)];
  }
  const t = Math.abs(x);
  return [Math.round(238 - t * 182), Math.round(242 - t * 94), Math.round(247 - t * 48)];
}

function heat(value: number): [number, number, number] {
  const x = Math.max(0, Math.min(1, value));
  return [Math.round(35 + x * 220), Math.round(68 + x * 120), Math.round(130 - x * 90)];
}
