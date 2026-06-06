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
  stepFdtd2dState,
  type Fdtd2dFixtureKind,
  type Fdtd2dObject,
  type Fdtd2dObjectKind,
  type Fdtd2dScene,
  type Fdtd2dState,
  type Fdtd2dWaveform
} from "@emmicro/core";
import {
  createFdtd2dStabilityReport,
  createFdtd2dValidationHarnessReport,
  fdtd2dConvergenceCsv,
  fdtd2dStabilityReportJson,
  fdtd2dValidationReportJson,
  fdtd2dValidationReportMarkdown,
  createFdtd2dBackendReport,
  createFdtd2dPerformanceReport,
  fdtd2dBackendReportJson,
  fdtd2dBackendReportMarkdown,
  fdtd2dParityCsv,
  fdtd2dPerformanceCsv,
  probeFdtd2dWebGpuAvailability,
  runFdtd2dCpuGpuParityCheck,
  runFdtd2dWebGpuScene,
  runFdtd2dConvergenceDiagnostic,
  runFdtd2dValidationSuite,
  type Fdtd2dBackendReport,
  type Fdtd2dConvergenceReport
} from "@emmicro/core";
import {
  Cpu,
  Download,
  Gauge,
  Pause,
  Play,
  Plus,
  RotateCcw,
  ShieldCheck,
  StepForward,
  Waves,
  Zap,
  type LucideIcon
} from "lucide-react";
import type {
  Fdtd2dExecutionBackend,
  Fdtd2dParityReport,
  Fdtd2dPerformanceReport,
  Fdtd2dReadbackMode,
  Fdtd2dWebGpuAvailabilityReport
} from "@emmicro/core";

type Fdtd2dViewMode = "field" | "intensity" | "material";

const fixtureKinds: Array<{ kind: Fdtd2dFixtureKind; label: string }> = [
  { kind: "empty-space", label: "Empty" },
  { kind: "pec-wall", label: "PEC Wall" },
  { kind: "dielectric-interface", label: "Dielectric" },
  { kind: "absorbing-slab", label: "Absorber" },
  { kind: "point-source-symmetry", label: "Point Symmetry" },
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

function fallbackWebGpuStatus(selectedBackend: Fdtd2dExecutionBackend): Fdtd2dWebGpuAvailabilityReport {
  const cpuSelected = selectedBackend === "cpu-reference";
  return {
    schema: "emmicro.fdtd2d.webgpuAvailability.v1",
    requestedBackend: selectedBackend,
    effectiveBackend: "cpu-reference",
    status: cpuSelected ? "fallback-to-cpu" : "unavailable",
    available: false,
    fallbackToCpu: true,
    reason: cpuSelected ? "CPU reference backend selected." : "WebGPU status check is pending; CPU reference backend remains active.",
    deviceReady: false,
    secureContext: true,
    limitsKnown: false,
    warnings: cpuSelected ? [] : [{ code: "fdtd2d.webgpu.pending", message: "WebGPU availability is still being checked." }]
  };
}

export function Fdtd2dSandboxPanel(props: { scene: Fdtd2dScene; onSceneChange: (scene: Fdtd2dScene) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewMode, setViewMode] = useState<Fdtd2dViewMode>("field");
  const [running, setRunning] = useState(false);
  const [stepsPerTick, setStepsPerTick] = useState(4);
  const [runBatchSteps, setRunBatchSteps] = useState(120);
  const [convergenceReport, setConvergenceReport] = useState<Fdtd2dConvergenceReport | null>(null);
  const [selectedBackend, setSelectedBackend] = useState<Fdtd2dExecutionBackend>("cpu-reference");
  const [readbackMode, setReadbackMode] = useState<Fdtd2dReadbackMode>("validation-checkpoint");
  const [readbackCadence, setReadbackCadence] = useState(20);
  const [webGpuStatus, setWebGpuStatus] = useState<Fdtd2dWebGpuAvailabilityReport | null>(null);
  const [parityReport, setParityReport] = useState<Fdtd2dParityReport | null>(null);
  const [performanceReport, setPerformanceReport] = useState<Fdtd2dPerformanceReport | null>(null);
  const [backendBusy, setBackendBusy] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [init, setInit] = useState(() => createInitialState(props.scene));

  useEffect(() => {
    const next = createInitialState(props.scene);
    setInit(next);
    if (next.error) setRunning(false);
    setParityReport(null);
    setPerformanceReport(null);
    setBackendError(null);
  }, [props.scene]);

  useEffect(() => {
    let cancelled = false;
    void probeFdtd2dWebGpuAvailability({ requestedBackend: "webgpu-accelerated" }).then((status) => {
      if (!cancelled) setWebGpuStatus(status);
    }).catch((error) => {
      if (!cancelled) {
        setWebGpuStatus({
          ...fallbackWebGpuStatus("webgpu-accelerated"),
          reason: error instanceof Error ? error.message : String(error),
          warnings: [{ code: "fdtd2d.webgpu.probeFailed", message: error instanceof Error ? error.message : String(error) }]
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!running || !init.state) return;
    if (selectedBackend === "webgpu-accelerated" && webGpuStatus?.available) {
      setRunning(false);
      return;
    }
    const interval = window.setInterval(() => {
      setInit((current) => {
        if (!current.state) return current;
        const stepped = stepFdtd2dState(current.state, stepsPerTick);
        return { state: cloneFdtd2dState(stepped), error: null };
      });
    }, 70);
    return () => window.clearInterval(interval);
  }, [running, stepsPerTick, init.state, selectedBackend, webGpuStatus]);

  const budget = useMemo(() => estimateFdtd2dBudget(props.scene.grid, props.scene.objects.length), [props.scene]);
  const snapshot = useMemo(() => (init.state ? createFdtd2dSnapshot(init.state) : null), [init.state]);
  const result = useMemo(() => (init.state ? fdtd2dRunResultFromState(init.state, init.state.step) : null), [init.state]);
  const stabilityReport = useMemo(() => createFdtd2dStabilityReport(init.state ?? props.scene), [init.state, props.scene]);
  const validationSuite = useMemo(() => runFdtd2dValidationSuite(80), []);
  const validationReports = validationSuite.fixtureReports;
  const backendAvailability = selectedBackend === "webgpu-accelerated"
    ? webGpuStatus ?? fallbackWebGpuStatus("webgpu-accelerated")
    : fallbackWebGpuStatus("cpu-reference");
  const currentBackendReport = useMemo(() => createFdtd2dBackendReport({
    scene: props.scene,
    selectedBackend,
    availability: backendAvailability,
    parity: parityReport ?? undefined,
    performance: performanceReport ?? undefined
  }), [props.scene, selectedBackend, backendAvailability, parityReport, performanceReport]);
  const effectiveBackend = currentBackendReport.effectiveBackend;

  useEffect(() => {
    if (!init.state) return;
    renderCanvas(canvasRef.current, init.state, viewMode);
  }, [init.state, viewMode]);

  function replaceScene(scene: Fdtd2dScene): void {
    setRunning(false);
    setConvergenceReport(null);
    setParityReport(null);
    setPerformanceReport(null);
    setBackendError(null);
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
    if (effectiveBackend === "webgpu-accelerated") {
      void runWebGpuSteps(1);
      return;
    }
    setInit((current) => {
      if (!current.state) return current;
      return { state: cloneFdtd2dState(stepFdtd2dState(current.state, 1)), error: null };
    });
  }

  function runBatch(): void {
    if (effectiveBackend === "webgpu-accelerated") {
      void runWebGpuSteps(runBatchSteps);
      return;
    }
    setInit((current) => {
      if (!current.state) return current;
      const steps = Math.min(Math.max(1, Math.round(runBatchSteps)), props.scene.grid.maxStepsPerRun);
      return { state: cloneFdtd2dState(stepFdtd2dState(current.state, steps)), error: null };
    });
  }

  async function runWebGpuSteps(steps: number): Promise<void> {
    if (!init.state) return;
    setBackendBusy(true);
    setBackendError(null);
    try {
      const targetSteps = Math.min(init.state.step + Math.max(1, Math.round(steps)), props.scene.grid.maxStepsPerRun);
      const accelerated = await runFdtd2dWebGpuScene(props.scene, targetSteps, { readbackMode, readbackCadenceSteps: readbackCadence });
      setInit({ state: cloneFdtd2dState(accelerated.state), error: null });
      if (accelerated.performance) setPerformanceReport(accelerated.performance);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setBackendError(`WebGPU unavailable. Using CPU reference backend. ${message}`);
      setInit((current) => {
        if (!current.state) return current;
        const safeSteps = Math.min(Math.max(1, Math.round(steps)), props.scene.grid.maxStepsPerRun);
        return { state: cloneFdtd2dState(stepFdtd2dState(current.state, safeSteps)), error: null };
      });
    } finally {
      setBackendBusy(false);
    }
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
    const validationReport = createFdtd2dValidationHarnessReport({ scene: props.scene, state: init.state, validationSuite, convergence: convergenceReport ?? undefined, backend: currentBackendReport });
    downloadText("fdtd2d_sandbox_report.md", "text/markdown", `${fdtd2dSandboxReportMarkdown(report)}\n`);
    downloadText("fdtd2d_sandbox_report.json", "application/json", fdtd2dSandboxReportJson(report));
    downloadText("fdtd2d_validation_report.md", "text/markdown", `${fdtd2dValidationReportMarkdown(validationReport)}\n`);
    downloadText("fdtd2d_validation_report.json", "application/json", fdtd2dValidationReportJson(validationReport));
    downloadText("fdtd2d_backend_report.md", "text/markdown", `${fdtd2dBackendReportMarkdown(currentBackendReport)}\n`);
    downloadText("fdtd2d_backend_report.json", "application/json", fdtd2dBackendReportJson(currentBackendReport));
    if (parityReport) downloadText("fdtd2d_parity.csv", "text/csv", `${fdtd2dParityCsv(parityReport)}\n`);
    if (performanceReport) downloadText("fdtd2d_performance.csv", "text/csv", `${fdtd2dPerformanceCsv(performanceReport)}\n`);
    if (convergenceReport) downloadText("fdtd2d_convergence.csv", "text/csv", `${fdtd2dConvergenceCsv(convergenceReport)}\n`);
    downloadText("fdtd2d_stability_report.json", "application/json", fdtd2dStabilityReportJson(stabilityReport));
    downloadText("field_snapshot.csv", "text/csv", `${fdtd2dFieldSnapshotCsv(result.snapshot)}\n`);
    downloadText("monitor_trace.csv", "text/csv", `${fdtd2dMonitorTraceCsv(result)}\n`);
    downloadText("energy_trace.csv", "text/csv", `${fdtd2dEnergyTraceCsv(result)}\n`);
    downloadText("fdtd2d_monitor_trace.csv", "text/csv", `${fdtd2dMonitorTraceCsv(result)}\n`);
    downloadText("fdtd2d_energy_trace.csv", "text/csv", `${fdtd2dEnergyTraceCsv(result)}\n`);
  }

  function runConvergence(): void {
    setConvergenceReport(runFdtd2dConvergenceDiagnostic({ fixtureKind: "empty-space", levels: [128, 256, 384], steps: 80 }));
  }

  function measureCpuPerformance(benchmarkSteps: number): Fdtd2dPerformanceReport {
    const cpuStarted = window.performance.now();
    const cpuState = initializeFdtd2dState(props.scene);
    stepFdtd2dState(cpuState, benchmarkSteps);
    const cpuElapsed = window.performance.now() - cpuStarted;
    return createFdtd2dPerformanceReport({
      backend: "cpu-reference",
      scene: props.scene,
      steps: benchmarkSteps,
      elapsedMs: cpuElapsed,
      readbackMode: "visual-frame",
      readbackCadenceSteps: 1,
      readbackMs: 0,
      renderMs: 0
    });
  }

  async function runParityCheck(): Promise<void> {
    setBackendBusy(true);
    setBackendError(null);
    try {
      const report = await runFdtd2dCpuGpuParityCheck({
        scene: props.scene,
        steps: 80,
        acceleratedRunner: backendAvailability.available ? async (scene, steps) => (await runFdtd2dWebGpuScene(scene, steps, { readbackMode, readbackCadenceSteps: readbackCadence })).state : undefined
      });
      setParityReport(report);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const fallbackReport = await runFdtd2dCpuGpuParityCheck({ scene: props.scene, steps: 80 });
      setParityReport(fallbackReport);
      setBackendError(`WebGPU parity execution unavailable. Using CPU reference fallback parity. ${message}`);
    } finally {
      setBackendBusy(false);
    }
  }

  async function runPerformanceBenchmark(): Promise<void> {
    setBackendBusy(true);
    setBackendError(null);
    const benchmarkSteps = Math.min(180, props.scene.grid.maxStepsPerRun);
    const cpuPerformance = measureCpuPerformance(benchmarkSteps);
    try {
      if (effectiveBackend === "webgpu-accelerated") {
        const accelerated = await runFdtd2dWebGpuScene(props.scene, benchmarkSteps, { readbackMode, readbackCadenceSteps: readbackCadence });
        const acceleratedPerf = accelerated.performance;
        setPerformanceReport(acceleratedPerf ? createFdtd2dPerformanceReport({
          backend: "webgpu-accelerated",
          scene: props.scene,
          steps: acceleratedPerf.steps,
          elapsedMs: acceleratedPerf.elapsedMs,
          readbackMode: acceleratedPerf.readbackMode,
          readbackCadenceSteps: acceleratedPerf.readbackCadenceSteps,
          readbackMs: acceleratedPerf.readbackMs,
          renderMs: acceleratedPerf.renderMs,
          cpuReferenceMsPerStep: cpuPerformance.msPerStep,
          warnings: acceleratedPerf.warnings
        }) : cpuPerformance);
      } else {
        setPerformanceReport(cpuPerformance);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setPerformanceReport(cpuPerformance);
      setBackendError(`WebGPU performance execution unavailable. Using CPU reference benchmark. ${message}`);
    } finally {
      setBackendBusy(false);
    }
  }

  const statusClass = `fdtd2d-status fdtd2d-status-${budget.status}`;
  const stabilityClass = `fdtd2d-status fdtd2d-status-${stabilityReport.status === "stable" ? "safe" : stabilityReport.status === "marginal" ? "warning" : "blocked"}`;
  const backendStatusClass = `fdtd2d-status fdtd2d-status-${backendAvailability.available ? "safe" : backendAvailability.status === "fallback-to-cpu" ? "safe" : "warning"}`;

  return (
    <section className="wave-panel simulation-builder-panel fdtd2d-panel" aria-label="L9.2 In-Browser 2D FDTD Maxwell Sandbox">
      <div className="maxwell-section-heading simulation-builder-title">
        <h2>L9.2 In-Browser 2D FDTD Maxwell Sandbox</h2>
        <strong className={statusClass}>{budget.status.toUpperCase()}</strong>
      </div>

      <div className="l2-disclosure">
        <strong>Bounded 2D diagnostic sandbox only: TMz fields Ez, Hx, Hy.</strong>
        <span>
          CPU reference remains the validation baseline and fallback. WebGPU acceleration is optional, experimental, and diagnostic where supported. This is not full 3D Maxwell, not production FDTD, not a replacement for external Meep/FDTD, and not FEM/BEM/RCWA/CAD/digital-twin physics.
        </span>
      </div>

      <div className="fdtd2d-scene-meta" aria-label="L9.2 sandbox scene identity">
        <strong>{props.scene.label}</strong>
        <span>{props.scene.id}</span>
        <span>{props.scene.polarization}</span>
        <span>{effectiveBackend}</span>
      </div>

      <div className="maxwell-layer-actions simulation-builder-actions fdtd2d-action-row">
        {fixtureKinds.map((fixture) => (
          <button type="button" key={fixture.kind} onClick={() => replaceScene(createFdtd2dFixtureScene(fixture.kind))}>
            <Waves size={15} />
            <span>{fixture.label}</span>
          </button>
        ))}
        <button type="button" onClick={reset} disabled={budget.status === "blocked" || backendBusy}>
          <RotateCcw size={15} />
          <span>Reset</span>
        </button>
        <button type="button" onClick={stepOnce} disabled={!init.state || backendBusy}>
          <StepForward size={15} />
          <span>Step</span>
        </button>
        <button type="button" onClick={() => setRunning((current) => !current)} disabled={!init.state || backendBusy || effectiveBackend === "webgpu-accelerated"}>
          {running ? <Pause size={15} /> : <Play size={15} />}
          <span>{running ? "Pause" : "Run"}</span>
        </button>
        <button type="button" onClick={runBatch} disabled={!init.state || backendBusy}>
          <StepForward size={15} />
          <span>Run N Steps</span>
        </button>
        <button type="button" onClick={exportArtifacts} disabled={!result || backendBusy}>
          <Download size={15} />
          <span>Export Validation Report</span>
        </button>
      </div>

      <div className="fdtd2d-export-list" aria-label="L9.2 sandbox export files">
        <strong>Exports</strong>
        <span>fdtd2d_sandbox_report.md</span>
        <span>fdtd2d_sandbox_report.json</span>
        <span>fdtd2d_validation_report.md</span>
        <span>fdtd2d_validation_report.json</span>
        <span>fdtd2d_backend_report.md</span>
        <span>fdtd2d_backend_report.json</span>
        <span>fdtd2d_parity.csv</span>
        <span>fdtd2d_performance.csv</span>
        <span>fdtd2d_convergence.csv</span>
        <span>fdtd2d_stability_report.json</span>
        <span>fdtd2d_energy_trace.csv</span>
        <span>fdtd2d_monitor_trace.csv</span>
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

        <div className="maxwell-workspace-panel simulation-builder-card fdtd2d-controls fdtd2d-backend-panel">
          <div className="maxwell-section-heading">
            <h2>Backend / WebGPU</h2>
            <strong className={backendStatusClass}><Zap size={15} /> {backendAvailability.status}</strong>
          </div>
          <div className="simulation-field-grid">
            <label>
              <span>Execution backend</span>
              <select value={selectedBackend} onChange={(event) => {
                setSelectedBackend(event.currentTarget.value as Fdtd2dExecutionBackend);
                setRunning(false);
              }}>
                <option value="cpu-reference">CPU reference</option>
                <option value="webgpu-accelerated">WebGPU accelerated</option>
              </select>
              <em>{effectiveBackend === "webgpu-accelerated" ? "GPU" : "CPU"}</em>
            </label>
            <label>
              <span>readback mode</span>
              <select value={readbackMode} onChange={(event) => setReadbackMode(event.currentTarget.value as Fdtd2dReadbackMode)}>
                <option value="visual-frame">visual frame</option>
                <option value="fast-run">fast run</option>
                <option value="validation-checkpoint">validation checkpoint</option>
              </select>
              <em>cadence</em>
            </label>
            <NumberField label="readback cadence" value={readbackCadence} min={1} step={1} onChange={setReadbackCadence} />
          </div>
          <div className="profile-meta fdtd2d-diagnostic-stats">
            <Stat label="WebGPU status" value={backendAvailability.status} />
            <Stat label="Effective backend" value={effectiveBackend} />
            <Stat label="Fallback" value={backendAvailability.fallbackToCpu ? "CPU reference" : "not active"} />
            <Stat label="GPU memory" value={formatBytes(currentBackendReport.gpuMemory.estimatedTotalBytes)} />
            <Stat label="Adapter limits" value={backendAvailability.limitsKnown ? "known" : "unknown"} />
            <Stat label="Device" value={backendAvailability.deviceReady ? "ready" : "deferred"} />
          </div>
          <p className="simulation-builder-note">
            WebGPU acceleration is experimental and diagnostic. CPU reference remains the validation baseline; unavailable or failed WebGPU paths fall back to CPU.
          </p>
          <div className="maxwell-layer-actions simulation-builder-actions fdtd2d-action-row">
            <button type="button" onClick={() => void runParityCheck()} disabled={backendBusy || budget.status === "blocked"}>
              <Cpu size={15} />
              <span>Run CPU/GPU Parity Check</span>
            </button>
            <button type="button" onClick={() => void runPerformanceBenchmark()} disabled={backendBusy || budget.status === "blocked"}>
              <Gauge size={15} />
              <span>Run Performance Benchmark</span>
            </button>
          </div>
          {backendError && <div className="error-banner">{backendError}</div>}
          <div className="fdtd-warning-list">
            {(backendAvailability.warnings.length || currentBackendReport.gpuMemory.warnings.length)
              ? [...backendAvailability.warnings, ...currentBackendReport.gpuMemory.warnings].map((warning) => (
                <span key={`${warning.code}:${warning.message}`}><strong>{warning.code}</strong> {warning.message}</span>
              ))
              : <span><strong>clear</strong> CPU fallback and WebGPU guardrails are ready</span>}
          </div>
          <div className="fdtd2d-backend-results">
            <div className="compact-stat fdtd2d-validation-stat">
              <span>Parity RMS Ez</span>
              <strong>{parityReport ? `${formatNumber(parityReport.rmsEz)} / ${parityReport.status}` : "not run"}</strong>
            </div>
            <div className="compact-stat fdtd2d-validation-stat">
              <span>Parity max Ez</span>
              <strong>{parityReport ? formatNumber(parityReport.maxEz) : "not run"}</strong>
            </div>
            <div className="compact-stat fdtd2d-validation-stat">
              <span>steps/sec</span>
              <strong>{performanceReport ? formatNumber(performanceReport.stepsPerSecond) : "not run"}</strong>
            </div>
            <div className="compact-stat fdtd2d-validation-stat">
              <span>ms/step</span>
              <strong>{performanceReport ? formatNumber(performanceReport.msPerStep) : "not run"}</strong>
            </div>
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

        <div className="maxwell-workspace-panel simulation-builder-card simulation-builder-wide fdtd2d-validation-panel">
          <div className="maxwell-section-heading">
            <h2>Validation + Stability</h2>
            <strong className={stabilityClass}><ShieldCheck size={15} /> {stabilityReport.statusLabel}</strong>
          </div>
          <div className="fdtd2d-diagnostic-layout">
            <div className="fdtd2d-diagnostic-section">
              <div className="maxwell-section-heading">
                <h2>1. Stability</h2>
                <strong>{stabilityReport.statusLabel}</strong>
              </div>
              <div className="profile-meta fdtd2d-diagnostic-stats">
                <Stat label="CFL factor" value={formatNumber(stabilityReport.cflFactor)} />
                <Stat label="dt s" value={formatNumber(stabilityReport.dtSeconds)} />
                <Stat label="dx / dy" value={`${formatNumber(stabilityReport.dxUm)} um`} />
                <Stat label="wave speed" value={`${formatNumber(stabilityReport.waveSpeedEstimateMPerS)} m/s`} />
                <Stat label="Max |Ez|" value={formatNumber(stabilityReport.maxAbsEz)} />
                <Stat label="Max |Hx|" value={formatNumber(stabilityReport.maxAbsHx)} />
                <Stat label="Max |Hy|" value={formatNumber(stabilityReport.maxAbsHy)} />
                <Stat label="NaN / Infinity" value={stabilityReport.hasNonFinite ? "detected" : "clear"} />
                <Stat label="Energy trend" value={stabilityReport.energyTrend} />
                <Stat label="Boundary loss" value={formatNumber(stabilityReport.boundaryEnergyFraction)} />
                <Stat label="Memory" value={formatBytes(stabilityReport.memoryEstimateBytes)} />
              </div>
            </div>

            <div className="fdtd2d-diagnostic-section">
              <div className="maxwell-section-heading">
                <h2>2. FDTD Validation Fixtures</h2>
                <strong>{validationSuite.status}</strong>
              </div>
              <div className="fdtd2d-validation-grid">
                {validationReports.map((report) => (
                  <div className="compact-stat fdtd2d-validation-stat" key={report.kind}>
                    <span>{report.kind}</span>
                    <strong>{report.status} / {formatNumber(report.maxAbsEz)}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="fdtd2d-diagnostic-section">
              <div className="maxwell-section-heading">
                <h2>3. Reference Checks</h2>
                <strong>Fresnel + absorber</strong>
              </div>
              <div className="fdtd2d-reference-grid">
                {validationSuite.referenceChecks.map((check) => (
                  <div className="compact-stat fdtd2d-validation-stat" key={check.id}>
                    <span>{check.label}</span>
                    <strong>{check.status} / residual {formatNumber(check.residual)}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="fdtd2d-diagnostic-section">
              <div className="maxwell-section-heading">
                <h2>4. Grid Convergence</h2>
                <strong>2D sandbox convergence diagnostic</strong>
              </div>
              <div className="maxwell-layer-actions simulation-builder-actions fdtd2d-action-row">
                <button type="button" onClick={runConvergence} disabled={budget.status === "blocked"}>
                  <StepForward size={15} />
                  <span>Run Bounded Convergence</span>
                </button>
              </div>
              {convergenceReport ? (
                <div className="fdtd2d-convergence-table" aria-label="L9.2 convergence residual table">
                  <div className="fdtd2d-convergence-row fdtd2d-convergence-header">
                    <span>grid</span>
                    <span>energy</span>
                    <span>monitor</span>
                    <span>residual</span>
                    <span>delta</span>
                  </div>
                  {convergenceReport.rows.map((row) => (
                    <div className="fdtd2d-convergence-row" key={row.level}>
                      <span>{row.nx}x{row.ny}</span>
                      <span>{formatNumber(row.finalEnergy)}</span>
                      <span>{formatNumber(row.monitorRms)}</span>
                      <span>{formatNumber(row.residualFromPrevious)}</span>
                      <span>{formatNumber(row.fieldSnapshotDelta)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="simulation-builder-note">Run the bounded 128 x 128, 256 x 256, 384 x 384 convergence diagnostic to populate the residual-vs-grid table.</p>
              )}
            </div>

            <div className="fdtd2d-diagnostic-section">
              <div className="maxwell-section-heading">
                <h2>5. Boundaries</h2>
                <strong>{props.scene.boundary.kind}</strong>
              </div>
              <div className="fdtd-warning-list">
                {stabilityReport.warnings.length ? stabilityReport.warnings.map((warning) => (
                  <span key={`${warning.code}:${warning.elementId ?? ""}`}><strong>{warning.code}</strong> {warning.message}</span>
                )) : <span><strong>clear</strong> source/object/monitor proximity checks are clear</span>}
              </div>
            </div>
          </div>
          <p className="simulation-builder-note">
            Fixture checks are sanity diagnostics: empty propagation, PEC-like wall, rough Fresnel dielectric interface, lossy slab attenuation, point-source radial symmetry, and qualitative slit spreading. Optional WebGPU acceleration is diagnostic only; this is not ISO, lab, production FDTD, 3D Maxwell, or solver certification.
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
