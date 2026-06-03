import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { OpticalElement, RayPath, Scene, SolverResult } from "@emmicro/core";
import type { SelectedItem } from "../App";

type BenchCanvasProps = {
  scene: Scene;
  result: SolverResult;
  selected: SelectedItem;
  onSelect: (selected: SelectedItem) => void;
  onMove: (selected: SelectedItem, xM: number, yM: number | null) => void;
};

type Viewport = {
  width: number;
  height: number;
  paddingLeft: number;
  paddingTop: number;
  plotWidth: number;
  plotHeight: number;
};

function wavelengthColor(wavelengthM: number, alpha = 1): string {
  const nm = wavelengthM * 1e9;
  if (nm < 450) return `rgba(110, 132, 255, ${alpha})`;
  if (nm < 500) return `rgba(36, 196, 222, ${alpha})`;
  if (nm < 570) return `rgba(95, 210, 118, ${alpha})`;
  if (nm < 610) return `rgba(238, 192, 74, ${alpha})`;
  return `rgba(238, 96, 80, ${alpha})`;
}

function selectedKey(selected: SelectedItem): string {
  return selected ? `${selected.kind}:${selected.id}` : "";
}

export function BenchCanvas({ scene, result, selected, onSelect, onMove }: BenchCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewport, setViewport] = useState<Viewport>({
    width: 900,
    height: 520,
    paddingLeft: 48,
    paddingTop: 28,
    plotWidth: 804,
    plotHeight: 444
  });
  const [dragging, setDragging] = useState<SelectedItem>(null);

  const transform = useMemo(() => {
    const xSpan = scene.bench.xMaxM - scene.bench.xMinM;
    const ySpan = scene.bench.yMaxM - scene.bench.yMinM;
    const toPx = (xM: number, yM: number) => ({
      x: viewport.paddingLeft + ((xM - scene.bench.xMinM) / xSpan) * viewport.plotWidth,
      y: viewport.paddingTop + (1 - (yM - scene.bench.yMinM) / ySpan) * viewport.plotHeight
    });
    const fromPx = (xPx: number, yPx: number) => ({
      xM: scene.bench.xMinM + ((xPx - viewport.paddingLeft) / viewport.plotWidth) * xSpan,
      yM: scene.bench.yMinM + (1 - (yPx - viewport.paddingTop) / viewport.plotHeight) * ySpan
    });
    return { toPx, fromPx };
  }, [scene.bench, viewport]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const width = Math.max(640, Math.floor(entry.contentRect.width));
      const height = Math.max(360, Math.floor(entry.contentRect.height));
      setViewport({
        width,
        height,
        paddingLeft: 52,
        paddingTop: 30,
        plotWidth: width - 92,
        plotHeight: height - 78
      });
    });
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBench(ctx, scene, result.rays ?? [], selected, viewport, transform.toPx);
  }, [result, scene, selected, transform, viewport]);

  function pointerToCanvas(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function hitTest(xPx: number, yPx: number): SelectedItem {
    const candidates: Array<{ selected: SelectedItem; distance: number }> = [];

    for (const source of scene.sources) {
      const center = transform.toPx(source.xM, source.type === "pointSource" ? source.yM : source.yCenterM);
      candidates.push({ selected: { kind: "source", id: source.id }, distance: Math.hypot(center.x - xPx, center.y - yPx) });
    }

    for (const element of scene.elements) {
      const center = transform.toPx(element.xM, element.yCenterM);
      const halfHeightM = elementHalfHeightM(element);
      const top = transform.toPx(element.xM, element.yCenterM + halfHeightM);
      const bottom = transform.toPx(element.xM, element.yCenterM - halfHeightM);
      const yMin = Math.min(top.y, bottom.y) - 12;
      const yMax = Math.max(top.y, bottom.y) + 12;
      const distance = xPx >= center.x - 12 && xPx <= center.x + 12 && yPx >= yMin && yPx <= yMax ? Math.abs(center.x - xPx) : 9999;
      candidates.push({ selected: { kind: "element", id: element.id }, distance });
    }

    for (const detector of scene.detectors) {
      const top = transform.toPx(detector.xM, detector.yCenterM + detector.heightM / 2);
      const bottom = transform.toPx(detector.xM, detector.yCenterM - detector.heightM / 2);
      const yMin = Math.min(top.y, bottom.y) - 12;
      const yMax = Math.max(top.y, bottom.y) + 12;
      const distance = xPx >= top.x - 12 && xPx <= top.x + 12 && yPx >= yMin && yPx <= yMax ? Math.abs(top.x - xPx) : 9999;
      candidates.push({ selected: { kind: "detector", id: detector.id }, distance });
    }

    const hit = candidates.sort((a, b) => a.distance - b.distance)[0];
    return hit && hit.distance < 18 ? hit.selected : null;
  }

  return (
    <div className="canvas-frame">
      <canvas
        ref={canvasRef}
        aria-label="2D optical bench"
        onPointerDown={(event) => {
          const point = pointerToCanvas(event);
          if (!point) return;
          const hit = hitTest(point.x, point.y);
          onSelect(hit);
          setDragging(hit);
          if (hit) event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragging) return;
          const point = pointerToCanvas(event);
          if (!point) return;
          const scenePoint = transform.fromPx(point.x, point.y);
          const xM = Math.min(scene.bench.xMaxM, Math.max(scene.bench.xMinM, scenePoint.xM));
          const yM = Math.min(scene.bench.yMaxM, Math.max(scene.bench.yMinM, scenePoint.yM));
          onMove(dragging, xM, event.shiftKey ? yM : null);
        }}
        onPointerUp={(event) => {
          setDragging(null);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={() => setDragging(null)}
      />
      <div className="canvas-hint">Drag moves x. Shift-drag recenters y.</div>
    </div>
  );
}

function drawBench(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  rays: RayPath[],
  selected: SelectedItem,
  viewport: Viewport,
  toPx: (xM: number, yM: number) => { x: number; y: number }
) {
  ctx.clearRect(0, 0, viewport.width, viewport.height);
  ctx.fillStyle = "#f7f8fb";
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  const plotX = viewport.paddingLeft;
  const plotY = viewport.paddingTop;
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#cdd4df";
  ctx.lineWidth = 1;
  roundRect(ctx, plotX, plotY, viewport.plotWidth, viewport.plotHeight, 6);
  ctx.fill();
  ctx.stroke();

  drawGrid(ctx, scene, viewport, toPx);

  const axisA = toPx(scene.bench.xMinM, scene.bench.opticalAxisYM);
  const axisB = toPx(scene.bench.xMaxM, scene.bench.opticalAxisYM);
  ctx.strokeStyle = "#7b8798";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.moveTo(axisA.x, axisA.y);
  ctx.lineTo(axisB.x, axisB.y);
  ctx.stroke();
  ctx.setLineDash([]);

  for (const ray of rays) {
    drawRay(ctx, ray, toPx);
  }

  for (const source of scene.sources) {
    const point = toPx(source.xM, source.type === "pointSource" ? source.yM : source.yCenterM);
    const active = selectedKey(selected) === `source:${source.id}`;
    ctx.fillStyle = active ? "#1e5f8c" : "#346b8f";
    ctx.strokeStyle = active ? "#0f3555" : "#274f6e";
    ctx.lineWidth = active ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.arc(point.x, point.y, source.type === "pointSource" ? 7 : 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (source.type === "collimatedSource") {
      const top = toPx(source.xM, source.yCenterM + source.beamHeightM / 2);
      const bottom = toPx(source.xM, source.yCenterM - source.beamHeightM / 2);
      ctx.beginPath();
      ctx.moveTo(top.x, top.y);
      ctx.lineTo(bottom.x, bottom.y);
      ctx.stroke();
    }
  }

  for (const element of scene.elements) {
    const active = selectedKey(selected) === `element:${element.id}`;
    if (element.type === "thinLens") {
      const top = toPx(element.xM, element.yCenterM + element.clearApertureM / 2);
      const bottom = toPx(element.xM, element.yCenterM - element.clearApertureM / 2);
      ctx.strokeStyle = active ? "#0b6d77" : "#198c96";
      ctx.lineWidth = active ? 4 : 3;
      ctx.beginPath();
      ctx.moveTo(top.x, top.y);
      ctx.lineTo(bottom.x, bottom.y);
      ctx.stroke();
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.arc(top.x, top.y, 4, 0, Math.PI * 2);
      ctx.arc(bottom.x, bottom.y, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (element.type === "aperture") {
      const top = toPx(element.xM, scene.bench.yMaxM);
      const bottom = toPx(element.xM, scene.bench.yMinM);
      const gapTop = toPx(element.xM, element.yCenterM + element.diameterM / 2);
      const gapBottom = toPx(element.xM, element.yCenterM - element.diameterM / 2);
      ctx.strokeStyle = active ? "#a75d19" : "#c8782e";
      ctx.lineWidth = active ? 4 : 3;
      ctx.beginPath();
      ctx.moveTo(top.x, top.y);
      ctx.lineTo(gapTop.x, gapTop.y);
      ctx.moveTo(gapBottom.x, gapBottom.y);
      ctx.lineTo(bottom.x, bottom.y);
      ctx.stroke();
    } else {
      drawThickLens(ctx, element, active, toPx);
    }
  }

  for (const detector of scene.detectors) {
    const active = selectedKey(selected) === `detector:${detector.id}`;
    const top = toPx(detector.xM, detector.yCenterM + detector.heightM / 2);
    const bottom = toPx(detector.xM, detector.yCenterM - detector.heightM / 2);
    ctx.strokeStyle = active ? "#5548a8" : "#6b63bb";
    ctx.lineWidth = active ? 4 : 3;
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(bottom.x, bottom.y);
    ctx.stroke();
  }

  drawAxes(ctx, scene, viewport, toPx);
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  viewport: Viewport,
  toPx: (xM: number, yM: number) => { x: number; y: number }
) {
  ctx.strokeStyle = "#e7ebf1";
  ctx.lineWidth = 1;
  const xStep = 0.02;
  for (let x = Math.ceil(scene.bench.xMinM / xStep) * xStep; x <= scene.bench.xMaxM + 1e-12; x += xStep) {
    const p = toPx(x, scene.bench.yMinM);
    ctx.beginPath();
    ctx.moveTo(p.x, viewport.paddingTop);
    ctx.lineTo(p.x, viewport.paddingTop + viewport.plotHeight);
    ctx.stroke();
  }
  const yStep = 0.01;
  for (let y = Math.ceil(scene.bench.yMinM / yStep) * yStep; y <= scene.bench.yMaxM + 1e-12; y += yStep) {
    const p = toPx(scene.bench.xMinM, y);
    ctx.beginPath();
    ctx.moveTo(viewport.paddingLeft, p.y);
    ctx.lineTo(viewport.paddingLeft + viewport.plotWidth, p.y);
    ctx.stroke();
  }
}

function drawAxes(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  viewport: Viewport,
  toPx: (xM: number, yM: number) => { x: number; y: number }
) {
  ctx.fillStyle = "#4a5568";
  ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  for (let x = 0; x <= scene.bench.xMaxM + 1e-12; x += 0.04) {
    const p = toPx(x, scene.bench.yMinM);
    ctx.fillText(`${Math.round(x * 1000)} mm`, p.x - 16, viewport.paddingTop + viewport.plotHeight + 22);
  }
  ctx.fillText("x", viewport.paddingLeft + viewport.plotWidth - 8, viewport.paddingTop + viewport.plotHeight + 40);
  ctx.fillText("y", viewport.paddingLeft - 28, viewport.paddingTop + 10);
}

function drawRay(ctx: CanvasRenderingContext2D, ray: RayPath, toPx: (xM: number, yM: number) => { x: number; y: number }) {
  ctx.strokeStyle = ray.alive ? wavelengthColor(ray.wavelengthM, 0.64) : "rgba(119, 128, 140, 0.42)";
  ctx.lineWidth = ray.alive ? 1.4 : 1;
  ctx.beginPath();
  for (const [index, segment] of ray.segments.entries()) {
    const a = toPx(segment.x0, segment.y0);
    const b = toPx(segment.x1, segment.y1);
    if (index === 0) ctx.moveTo(a.x, a.y);
    else ctx.lineTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
  }
  ctx.stroke();
}

function elementHalfHeightM(element: OpticalElement): number {
  if (element.type === "thinLens") return element.clearApertureM / 2;
  if (element.type === "aperture") return element.diameterM / 2;
  return element.apertureDiameterM / 2;
}

function drawThickLens(
  ctx: CanvasRenderingContext2D,
  element: Extract<OpticalElement, { type: "thickLens2D" }>,
  active: boolean,
  toPx: (xM: number, yM: number) => { x: number; y: number }
) {
  const halfAperture = element.apertureDiameterM / 2;
  const front = sampleCircularSurface(element.xM, element.yCenterM, element.radius1M, halfAperture, 26);
  const back = sampleCircularSurface(element.xM + element.thicknessM, element.yCenterM, element.radius2M, halfAperture, 26);

  ctx.fillStyle = active ? "rgba(20, 130, 150, 0.16)" : "rgba(34, 150, 165, 0.12)";
  ctx.strokeStyle = active ? "#0b6d77" : "#198c96";
  ctx.lineWidth = active ? 3 : 2;

  ctx.beginPath();
  for (const [index, point] of front.entries()) {
    const p = toPx(point.x, point.y);
    if (index === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  for (const point of [...back].reverse()) {
    const p = toPx(point.x, point.y);
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const topFront = toPx(front[0]?.x ?? element.xM, front[0]?.y ?? element.yCenterM + halfAperture);
  const bottomFront = toPx(front[front.length - 1]?.x ?? element.xM, front[front.length - 1]?.y ?? element.yCenterM - halfAperture);
  ctx.fillStyle = ctx.strokeStyle;
  ctx.beginPath();
  ctx.arc(topFront.x, topFront.y, 3.5, 0, Math.PI * 2);
  ctx.arc(bottomFront.x, bottomFront.y, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function sampleCircularSurface(vertexXM: number, centerYM: number, radiusM: number, apertureRadiusM: number, steps: number) {
  const centerXM = vertexXM + radiusM;
  const sign = Math.sign(radiusM) || 1;
  const radiusAbs = Math.abs(radiusM);
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < steps; i += 1) {
    const t = i / (steps - 1);
    const y = centerYM + apertureRadiusM - 2 * apertureRadiusM * t;
    const yRel = y - centerYM;
    const x = centerXM - sign * Math.sqrt(Math.max(0, radiusAbs * radiusAbs - yRel * yRel));
    points.push({ x, y });
  }
  return points;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}
