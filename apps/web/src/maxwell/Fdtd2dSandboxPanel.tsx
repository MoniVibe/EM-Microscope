import { useEffect, useMemo, useRef, useState } from "react";
import {
  cloneFdtd2dState,
  createFdtd2dFixtureScene,
  createFdtd2dSandboxReport,
  createFdtd2dScene,
  createFdtd2dSnapshot,
  estimateFdtd2dBudget,
  fdtd2dEnergyTraceCsv,
  fdtd2dFieldSnapshotCsv,
  fdtd2dMonitorTraceCsv,
  fdtd2dRunResultFromState,
  fdtd2dSandboxReportJson,
  fdtd2dSandboxReportMarkdown,
  initializeFdtd2dState,
  runFdtd2dValidationFixture,
  stepFdtd2dState,
  type Fdtd2dFixtureKind,
  type Fdtd2dObject,
  type Fdtd2dObjectKind,
  type Fdtd2dScene,
  type Fdtd2dState,
  type Fdtd2dWaveform
} from "@emmicro/core";
import { Download, Pause, Play, Plus, RotateCcw, ShieldCheck, StepForward, Waves } from "lucide-react";

type Fdtd2dViewMode = "field" | "intensity" | "material";

const fixtureKinds: Array<{ kind: Fdtd2dFixtureKind; label: string }> = [
  { kind: "empty-space", label: "Empty" },
  { kind: "pec-wall", label: "PEC Wall" },
  { kind: "dielectric-interface", label: "Dielectric" },
  { kind: "absorbing-slab", label: "Absorber" },
  { kind: "slit-diagnostic", label: "Slit" }
];

const objectButtons: Array<{ kind: Fdtd2dObjectKind; label: string }> = [
  { kind: "dielectric-rectangle", label: "Dielectric" },
  { kind: "absorbing-rectangle", label: "Absorber" },
  { kind: "pec-block", label: "PEC Block" },
  { kind: "slit-screen", label: "Slit Screen" }
];

function downloadText(filename: string, mime: string, text: string): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function createInitialState(scene: Fdtd2dScene): { state: Fdtd2dState | null; error: string | null } {
  try {
    return { state: initializeFdtd2dState(scene), error: null };
  } catch (error) {
    return { state: null, error: error instanceof Error ? error.message : String(error) };
  }
}

export function Fdtd2dSandboxPanel(props: { scene: Fdtd2dScene; onSceneChange: (scene: Fdtd2dScene) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewMode, setViewMode] = useState<Fdtd2dViewMode>("field");
  const [running, setRunning] = useState(false);
  const [stepsPerTick, setStepsPerTick] = useState(4);
  const [runBatchSteps, setRunBatchSteps] = useState(120);
  const [init, setInit] = useState(() => createInitialState(props.scene));

  useEffect(() => {
    const next = createInitialState(props.scene);
    setInit(next);
    if (next.error) setRunning(false);
  }, [props.scene]);

  useEffect(() => {
    if (!running || !init.state) return;
    const interval = window.setInterval(() => {
      setInit((current) => {
        if (!current.state) return current;
        const stepped = stepFdtd2dState(current.state, stepsPerTick);
        return { state: cloneFdtd2dState(stepped), error: null };
      });
    }, 70);
    return () => window.clearInterval(interval);
  }, [running, stepsPerTick, init.state]);

  const budget = useMemo(() => estimateFdtd2dBudget(props.scene.grid, props.scene.objects.length), [props.scene]);
  const snapshot = useMemo(() => (init.state ? createFdtd2dSnapshot(init.state) : null), [init.state]);
  const result = useMemo(() => (init.state ? fdtd2dRunResultFromState(init.state, init.state.step) : null), [init.state]);
  const validationReports = useMemo(() => fixtureKinds.map((fixture) => runFdtd2dValidationFixture(fixture.kind, 80)), []);

  useEffect(() => {
    if (!init.state) return;
    renderCanvas(canvasRef.current, init.state, viewMode);
  }, [init.state, viewMode]);

  function replaceScene(scene: Fdtd2dScene): void {
    setRunning(false);
    props.onSceneChange(scene);
  }

  function updateGrid(key: keyof Fdtd2dScene["grid"], value: number): void {
    replaceScene(createFdtd2dScene({ ...props.scene, grid: { ...props.scene.grid, [key]: value } }));
  }

  function updateSourceWaveform(waveform: Fdtd2dWaveform): void {
    replaceScene(createFdtd2dScene({
      ...props.scene,
      sources: props.scene.sources.map((source, index) => index === 0 ? { ...source, waveform } : source)
    }));
  }

  function reset(): void {
    setRunning(false);
    setInit(createInitialState(props.scene));
  }

  function stepOnce(): void {
    setInit((current) => {
      if (!current.state) return current;
      return { state: cloneFdtd2dState(stepFdtd2dState(current.state, 1)), error: null };
    });
  }

  function runBatch(): void {
    setInit((current) => {
      if (!current.state) return current;
      const steps = Math.min(Math.max(1, Math.round(runBatchSteps)), props.scene.grid.maxStepsPerRun);
      return { state: cloneFdtd2dState(stepFdtd2dState(current.state, steps)), error: null };
    });
  }

  function addObject(kind: Fdtd2dObjectKind): void {
    const count = props.scene.objects.filter((object) => object.kind === kind).length + 1;
    const x = Math.round(props.scene.grid.nx * (0.46 + Math.min(0.22, count * 0.03)));
    const y = Math.round(props.scene.grid.ny * 0.3);
    const object = objectForKind(kind, count, x, y, props.scene.grid.ny);
    replaceScene(createFdtd2dScene({ ...props.scene, objects: [...props.scene.objects, object] }));
  }

  function exportArtifacts(): void {
    if (!result) return;
    const report = createFdtd2dSandboxReport(result);
    downloadText("fdtd2d_sandbox_report.md", "text/markdown", `${fdtd2dSandboxReportMarkdown(report)}\n`);
    downloadText("fdtd2d_sandbox_report.json", "application/json", fdtd2dSandboxReportJson(report));
    downloadText("field_snapshot.csv", "text/csv", `${fdtd2dFieldSnapshotCsv(result.snapshot)}\n`);
    downloadText("monitor_trace.csv", "text/csv", `${fdtd2dMonitorTraceCsv(result)}\n`);
    downloadText("energy_trace.csv", "text/csv", `${fdtd2dEnergyTraceCsv(result)}\n`);
  }

  const statusClass = `fdtd2d-status fdtd2d-status-${budget.status}`;

  return (
    <section className="wave-panel simulation-builder-panel fdtd2d-panel" aria-label="L9.0 In-Browser 2D FDTD Maxwell Sandbox">
      <div className="maxwell-section-heading simulation-builder-title">
        <h2>L9.0 In-Browser 2D FDTD Maxwell Sandbox</h2>
        <strong className={statusClass}>{budget.status.toUpperCase()}</strong>
      </div>

      <div className="l2-disclosure">
        <strong>Bounded 2D diagnostic sandbox only: TMz fields Ez, Hx, Hy.</strong>
        <span>
          This is CPU typed-array 2D FDTD for small, capped grids. It is not full 3D Maxwell, not production FDTD, not a replacement for external Meep/FDTD, and not FEM/BEM/RCWA/CAD/digital-twin physics.
        </span>
      </div>

      <div className="fdtd2d-scene-meta" aria-label="L9.0 sandbox scene identity">
        <strong>{props.scene.label}</strong>
        <span>{props.scene.id}</span>
        <span>{props.scene.polarization}</span>
      </div>

      <div className="maxwell-layer-actions simulation-builder-actions fdtd2d-action-row">
        {fixtureKinds.map((fixture) => (
          <button type="button" key={fixture.kind} onClick={() => replaceScene(createFdtd2dFixtureScene(fixture.kind))}>
            <Waves size={15} />
            <span>{fixture.label}</span>
          </button>
        ))}
        <button type="button" onClick={reset} disabled={budget.status === "blocked"}>
          <RotateCcw size={15} />
          <span>Reset</span>
        </button>
        <button type="button" onClick={stepOnce} disabled={!init.state}>
          <StepForward size={15} />
          <span>Step</span>
        </button>
        <button type="button" onClick={() => setRunning((current) => !current)} disabled={!init.state}>
          {running ? <Pause size={15} /> : <Play size={15} />}
          <span>{running ? "Pause" : "Run"}</span>
        </button>
        <button type="button" onClick={runBatch} disabled={!init.state}>
          <StepForward size={15} />
          <span>Run N Steps</span>
        </button>
        <button type="button" onClick={exportArtifacts} disabled={!result}>
          <Download size={15} />
          <span>Export Sandbox Report</span>
        </button>
      </div>

      <div className="fdtd2d-export-list" aria-label="L9.0 sandbox export files">
        <strong>Exports</strong>
        <span>fdtd2d_sandbox_report.md</span>
        <span>fdtd2d_sandbox_report.json</span>
        <span>field_snapshot.csv</span>
        <span>monitor_trace.csv</span>
        <span>energy_trace.csv</span>
      </div>

      <div className="fdtd2d-layout">
        <div className="maxwell-workspace-panel simulation-builder-card fdtd2d-controls">
          <div className="maxwell-section-heading">
            <h2>Grid Safety / Memory Budget</h2>
            <strong>{formatBytes(budget.estimatedTotalBytes)}</strong>
          </div>
          <div className="simulation-field-grid">
            <NumberField label="nx" value={props.scene.grid.nx} min={8} step={8} onChange={(value) => updateGrid("nx", value)} />
            <NumberField label="ny" value={props.scene.grid.ny} min={8} step={8} onChange={(value) => updateGrid("ny", value)} />
            <NumberField label="dx" value={props.scene.grid.dxUm} unit="um" min={0.001} step={0.01} onChange={(value) => updateGrid("dxUm", value)} />
            <NumberField label="CFL" value={props.scene.grid.cfl} min={0.001} step={0.01} onChange={(value) => updateGrid("cfl", value)} />
            <NumberField label="edge cells" value={props.scene.grid.boundaryCells} min={0} step={1} onChange={(value) => updateGrid("boundaryCells", value)} />
            <NumberField label="max run steps" value={props.scene.grid.maxStepsPerRun} min={1} step={50} onChange={(value) => updateGrid("maxStepsPerRun", value)} />
            <NumberField label="run N" value={runBatchSteps} min={1} step={20} onChange={setRunBatchSteps} />
            <NumberField label="speed" value={stepsPerTick} min={1} step={1} onChange={setStepsPerTick} />
          </div>
          <div className="profile-meta fdtd2d-budget-stats">
            <Stat label="Cells" value={String(budget.cells)} />
            <Stat label="Warn cap" value={String(budget.warningGridCells)} />
            <Stat label="Hard cap" value={String(budget.maxGridCells)} />
            <Stat label="Objects" value={`${props.scene.objects.length}/${props.scene.grid.maxObjects}`} />
          </div>
          {init.error && <div className="error-banner">{init.error}</div>}
          {budget.warnings.length > 0 && (
            <div className="fdtd-warning-list">
              {budget.warnings.map((warning) => (
                <span key={warning.code}><strong>{warning.code}</strong> {warning.message}</span>
              ))}
            </div>
          )}
        </div>

        <div className="maxwell-workspace-panel simulation-builder-card fdtd2d-controls">
          <div className="maxwell-section-heading">
            <h2>Sources / Objects / View</h2>
            <strong>{props.scene.polarization}</strong>
          </div>
          <div className="simulation-field-grid">
            <label>
              <span>source waveform</span>
              <select value={props.scene.sources[0]?.waveform ?? "continuous"} onChange={(event) => updateSourceWaveform(event.currentTarget.value as Fdtd2dWaveform)}>
                <option value="continuous">continuous</option>
                <option value="gaussian-pulse">gaussian pulse</option>
              </select>
              <em>Ez</em>
            </label>
            <label>
              <span>view</span>
              <select value={viewMode} onChange={(event) => setViewMode(event.currentTarget.value as Fdtd2dViewMode)}>
                <option value="field">field map</option>
                <option value="intensity">intensity</option>
                <option value="material">material overlay</option>
              </select>
              <em>map</em>
            </label>
          </div>
          <div className="maxwell-layer-actions simulation-builder-actions fdtd2d-object-actions">
            {objectButtons.map((item) => (
              <button type="button" key={item.kind} onClick={() => addObject(item.kind)} disabled={props.scene.objects.length >= props.scene.grid.maxObjects}>
                <Plus size={15} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          <div className="profile-meta">
            <Stat label="Step" value={String(init.state?.step ?? 0)} />
            <Stat label="Max |Ez|" value={formatNumber(snapshot?.maxAbsEz ?? 0)} />
            <Stat label="Energy" value={formatNumber(snapshot?.totalEnergy ?? 0)} />
            <Stat label="Monitors" value={String(props.scene.monitors.length)} />
          </div>
        </div>

        <div className="maxwell-workspace-panel simulation-builder-card simulation-builder-wide fdtd2d-canvas-card">
          <div className="maxwell-section-heading">
            <h2>Field Map / Intensity / Material Overlay</h2>
            <strong>{props.scene.grid.nx} x {props.scene.grid.ny}</strong>
          </div>
          <canvas ref={canvasRef} className="fdtd2d-canvas" aria-label="2D FDTD field map canvas" />
          <div className="fdtd2d-legend">
            <span><i className="fdtd2d-legend-air" /> air</span>
            <span><i className="fdtd2d-legend-dielectric" /> dielectric</span>
            <span><i className="fdtd2d-legend-absorber" /> absorber</span>
            <span><i className="fdtd2d-legend-pec" /> PEC-like</span>
            <span><i className="fdtd2d-legend-boundary" /> absorbing boundary</span>
          </div>
        </div>

        <div className="maxwell-workspace-panel simulation-builder-card simulation-builder-wide">
          <div className="maxwell-section-heading">
            <h2>Validation Fixtures</h2>
            <strong><ShieldCheck size={15} /> diagnostic</strong>
          </div>
          <div className="fdtd2d-validation-grid">
            {validationReports.map((report) => (
              <div className="compact-stat fdtd2d-validation-stat" key={report.kind}>
                <span>{report.kind}</span>
                <strong>{report.status} / {formatNumber(report.maxAbsEz)}</strong>
              </div>
            ))}
          </div>
          <p className="simulation-builder-note">
            Fixture checks are sanity diagnostics: empty propagation, PEC-like wall, rough Fresnel dielectric interface, lossy slab attenuation, and qualitative slit spreading. They are not ISO, lab, or production solver certification.
          </p>
        </div>
      </div>
    </section>
  );
}

function renderCanvas(canvas: HTMLCanvasElement | null, state: Fdtd2dState, viewMode: Fdtd2dViewMode): void {
  if (!canvas) return;
  const { nx, ny } = state.scene.grid;
  canvas.width = nx;
  canvas.height = ny;
  const context = canvas.getContext("2d");
  if (!context) return;
  const image = context.createImageData(nx, ny);
  let maxAbs = 1e-9;
  let maxIntensity = 1e-9;
  for (let index = 0; index < state.ez.length; index += 1) {
    const ez = state.ez[index] ?? 0;
    maxAbs = Math.max(maxAbs, Math.abs(ez));
    maxIntensity = Math.max(maxIntensity, ez * ez);
  }
  for (let y = 0; y < ny; y += 1) {
    for (let x = 0; x < nx; x += 1) {
      const index = y * nx + x;
      const ez = state.ez[index] ?? 0;
      const material = state.material[index] ?? 0;
      const color = pixelColor(ez, maxAbs, maxIntensity, material, viewMode);
      const offset = index * 4;
      image.data[offset] = color[0];
      image.data[offset + 1] = color[1];
      image.data[offset + 2] = color[2];
      image.data[offset + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  context.fillStyle = "#111827";
  for (const source of state.scene.sources) {
    context.fillRect(source.x - 2, source.y - 2, 5, 5);
  }
  context.strokeStyle = "#5f3dc4";
  context.lineWidth = 2;
  for (const monitor of state.scene.monitors) {
    context.beginPath();
    context.moveTo(monitor.x, monitor.y);
    context.lineTo(monitor.x2 ?? monitor.x, monitor.y2 ?? monitor.y);
    context.stroke();
  }
}

function pixelColor(ez: number, maxAbs: number, maxIntensity: number, material: number, viewMode: Fdtd2dViewMode): [number, number, number] {
  const materialColor = materialRgb(material);
  if (viewMode === "material") return materialColor;
  if (viewMode === "intensity") {
    const t = Math.min(1, (ez * ez) / maxIntensity);
    return blend([247, 250, 252], [200, 140, 45], Math.sqrt(t), materialColor, material ? 0.22 : 0);
  }
  const t = Math.max(-1, Math.min(1, ez / maxAbs));
  const fieldColor: [number, number, number] = t >= 0
    ? [Math.round(246 - 210 * t), Math.round(250 - 94 * t), Math.round(252 - 72 * t)]
    : [Math.round(246 - 40 * -t), Math.round(250 - 180 * -t), Math.round(252 - 192 * -t)];
  return blend(fieldColor, materialColor, material ? 0.22 : 0);
}

function materialRgb(material: number): [number, number, number] {
  if (material === 1) return [125, 172, 214];
  if (material === 2) return [199, 159, 120];
  if (material === 3) return [70, 82, 96];
  if (material === 4) return [213, 222, 234];
  return [247, 250, 252];
}

function blend(a: [number, number, number], b: [number, number, number], amount: number, c?: [number, number, number], cAmount = 0): [number, number, number] {
  const t = Math.max(0, Math.min(1, amount));
  const base: [number, number, number] = [
    Math.round(a[0] * (1 - t) + b[0] * t),
    Math.round(a[1] * (1 - t) + b[1] * t),
    Math.round(a[2] * (1 - t) + b[2] * t)
  ];
  if (!c || cAmount <= 0) return base;
  const u = Math.max(0, Math.min(1, cAmount));
  return [
    Math.round(base[0] * (1 - u) + c[0] * u),
    Math.round(base[1] * (1 - u) + c[1] * u),
    Math.round(base[2] * (1 - u) + c[2] * u)
  ];
}

function objectForKind(kind: Fdtd2dObjectKind, count: number, x: number, y: number, ny: number): Fdtd2dObject {
  const base = {
    id: `${kind}-${count}`,
    label: `${kind} ${count}`,
    kind,
    x,
    y,
    width: kind === "slit-screen" ? 5 : 16,
    height: kind === "slit-screen" ? Math.round(ny * 0.7) : 44
  };
  if (kind === "dielectric-rectangle") return { ...base, epsilonR: 2.25 };
  if (kind === "absorbing-rectangle") return { ...base, epsilonR: 1.4, sigma: 0.08 };
  if (kind === "slit-screen") return { ...base, apertureWidth: Math.round(ny * 0.14), apertureCenterY: Math.round(ny * 0.5) };
  return base;
}

function NumberField(props: { label: string; value: number; unit?: string; min?: number; step?: number; onChange: (value: number) => void }) {
  return (
    <label>
      <span>{props.label}</span>
      <input
        aria-label={props.label}
        type="number"
        value={Number.isFinite(props.value) ? props.value : 0}
        min={props.min}
        step={props.step ?? 1}
        onChange={(event) => props.onChange(Number(event.currentTarget.value))}
      />
      {props.unit && <em>{props.unit}</em>}
    </label>
  );
}

function Stat(props: { label: string; value: string }) {
  return (
    <div className="compact-stat">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "n/a";
  if (value === 0) return "0";
  if (Math.abs(value) >= 1000 || Math.abs(value) < 0.001) return value.toExponential(3);
  return value.toPrecision(4);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
