import type { SimulationBuilderValidationStatus } from "../maxwell/simulationBuilder";
import type { SolverWarning } from "../solvers/Solver";
import { fnv1a64, stableStringify } from "../scene/hashScene";
import {
  cloneFdtd2dState,
  createFdtd2dScene,
  estimateFdtd2dBudget,
  fdtd2dRunResultFromState,
  initializeFdtd2dState,
  runFdtd2dScene,
  stepFdtd2dState,
  type Fdtd2dMonitor,
  type Fdtd2dRunResult,
  type Fdtd2dScene,
  type Fdtd2dSource,
  type Fdtd2dState
} from "./fdtd2dSandbox";

export type Fdtd2dExecutionBackend = "cpu-reference" | "webgpu-accelerated";
export type Fdtd2dWebGpuAvailabilityStatus = "available" | "unavailable" | "adapter-unavailable" | "device-creation-failed" | "secure-context-required" | "fallback-to-cpu";
export type Fdtd2dReadbackMode = "visual-frame" | "fast-run" | "validation-checkpoint";

export type Fdtd2dFields = {
  ez: Float32Array;
  hx: Float32Array;
  hy: Float32Array;
};

export type Fdtd2dStepResult = {
  state: Fdtd2dState;
  result: Fdtd2dRunResult;
  performance?: Fdtd2dPerformanceReport;
  warnings: SolverWarning[];
};

export type Fdtd2dBackend = {
  id: Fdtd2dExecutionBackend;
  label: string;
  available(): Promise<boolean>;
  initialize(scene: Fdtd2dScene): Promise<void>;
  step(n: number): Promise<Fdtd2dStepResult>;
  readFields(): Promise<Fdtd2dFields>;
  dispose(): void;
};

export type Fdtd2dWebGpuAvailabilityReport = {
  schema: "emmicro.fdtd2d.webgpuAvailability.v1";
  requestedBackend: Fdtd2dExecutionBackend;
  effectiveBackend: Fdtd2dExecutionBackend;
  status: Fdtd2dWebGpuAvailabilityStatus;
  available: boolean;
  fallbackToCpu: boolean;
  reason: string;
  adapterName?: string;
  deviceReady: boolean;
  secureContext: boolean;
  limitsKnown: boolean;
  maxBufferSize?: number;
  warnings: SolverWarning[];
};

export type Fdtd2dGpuMemoryEstimate = {
  schema: "emmicro.fdtd2d.gpuMemoryEstimate.v1";
  gridCells: number;
  fieldBufferBytes: number;
  coefficientBufferBytes: number;
  maskBufferBytes: number;
  sourceBufferBytes: number;
  readbackBufferBytes: number;
  estimatedTotalBytes: number;
  budgetBytes: number;
  status: "safe" | "warning" | "blocked";
  warnings: SolverWarning[];
};

export type Fdtd2dParityReport = {
  schema: "emmicro.fdtd2d.parityReport.v1";
  backend: Fdtd2dExecutionBackend;
  referenceBackend: "cpu-reference";
  steps: number;
  tolerance: number;
  rmsEz: number;
  rmsHx: number;
  rmsHy: number;
  maxEz: number;
  maxHx: number;
  maxHy: number;
  monitorTraceRms: number;
  energyDifference: number;
  status: SimulationBuilderValidationStatus;
  warnings: SolverWarning[];
  reportHash: string;
};

export type Fdtd2dPerformanceReport = {
  schema: "emmicro.fdtd2d.performanceReport.v1";
  backend: Fdtd2dExecutionBackend;
  grid: string;
  steps: number;
  elapsedMs: number;
  msPerStep: number;
  stepsPerSecond: number;
  readbackMode: Fdtd2dReadbackMode;
  readbackCadenceSteps: number;
  readbackMs: number;
  renderMs: number;
  cpuReferenceMsPerStep?: number;
  speedupVsCpu?: number;
  status: SimulationBuilderValidationStatus;
  warnings: SolverWarning[];
  reportHash: string;
};

export type Fdtd2dBackendReport = {
  schema: "emmicro.fdtd2d.backendReport.v1";
  label: string;
  sceneHash: string;
  selectedBackend: Fdtd2dExecutionBackend;
  effectiveBackend: Fdtd2dExecutionBackend;
  availability: Fdtd2dWebGpuAvailabilityReport;
  gpuMemory: Fdtd2dGpuMemoryEstimate;
  parity?: Fdtd2dParityReport;
  performance?: Fdtd2dPerformanceReport;
  boundary: string[];
  reportHash: string;
};

export type Fdtd2dWebGpuRuntime = {
  navigator?: { gpu?: { requestAdapter?: (options?: unknown) => Promise<unknown> } };
  isSecureContext?: boolean;
  now?: () => number;
  GPUBufferUsage?: Record<string, number>;
  GPUMapMode?: Record<string, number>;
};

export type Fdtd2dWebGpuRunOptions = {
  readbackMode?: Fdtd2dReadbackMode;
  readbackCadenceSteps?: number;
  runtime?: Fdtd2dWebGpuRuntime;
};

export const defaultFdtd2dExecutionBackend: Fdtd2dExecutionBackend = "cpu-reference";
export const fdtd2dGpuBufferBudgetBytes = 128 * 1024 * 1024;
export const fdtd2dParityDefaultTolerance = 2.5e-3;

export const l92Fdtd2dBackendBoundary = [
  "L9.2 adds optional WebGPU acceleration for the bounded 2D TMz sandbox only.",
  "CPU reference stepping remains the validation baseline and fallback.",
  "WebGPU is experimental, diagnostic, and available only when the browser, secure context, adapter, and device permit it.",
  "No in-browser 3D FDTD, production FDTD, FEM/BEM/RCWA, arbitrary CAD/freeform geometry, sensor-stack EM, digital twin, hardware control, or manufacturing certification is implemented."
];

export async function probeFdtd2dWebGpuAvailability(input: {
  requestedBackend?: Fdtd2dExecutionBackend;
  runtime?: Fdtd2dWebGpuRuntime;
  createDevice?: boolean;
} = {}): Promise<Fdtd2dWebGpuAvailabilityReport> {
  const requestedBackend = input.requestedBackend ?? "webgpu-accelerated";
  if (requestedBackend === "cpu-reference") {
    return availabilityReport({
      requestedBackend,
      status: "fallback-to-cpu",
      reason: "CPU reference backend selected.",
      available: false,
      fallbackToCpu: true,
      deviceReady: false
    });
  }
  const runtime = input.runtime ?? defaultWebGpuRuntime();
  const secureContext = runtime.isSecureContext ?? true;
  if (!secureContext) {
    return availabilityReport({
      requestedBackend,
      status: "secure-context-required",
      reason: "WebGPU requires a secure context; using CPU reference backend.",
      available: false,
      fallbackToCpu: true,
      secureContext,
      deviceReady: false,
      warnings: [{ code: "fdtd2d.webgpu.secureContext", message: "WebGPU requires HTTPS, localhost, or another secure context." }]
    });
  }
  const gpu = runtime.navigator?.gpu;
  if (!gpu?.requestAdapter) {
    return availabilityReport({
      requestedBackend,
      status: "unavailable",
      reason: "WebGPU not supported in this browser; using CPU reference backend.",
      available: false,
      fallbackToCpu: true,
      secureContext,
      deviceReady: false,
      warnings: [{ code: "fdtd2d.webgpu.unavailable", message: "navigator.gpu is not available; CPU reference backend remains active." }]
    });
  }
  let adapter: any;
  try {
    adapter = await gpu.requestAdapter();
  } catch (error) {
    return availabilityReport({
      requestedBackend,
      status: "adapter-unavailable",
      reason: `WebGPU adapter request failed: ${errorMessage(error)}. Using CPU reference backend.`,
      available: false,
      fallbackToCpu: true,
      secureContext,
      deviceReady: false,
      warnings: [{ code: "fdtd2d.webgpu.adapterFailed", message: `WebGPU adapter request failed: ${errorMessage(error)}` }]
    });
  }
  if (!adapter) {
    return availabilityReport({
      requestedBackend,
      status: "adapter-unavailable",
      reason: "WebGPU adapter unavailable; using CPU reference backend.",
      available: false,
      fallbackToCpu: true,
      secureContext,
      deviceReady: false,
      warnings: [{ code: "fdtd2d.webgpu.noAdapter", message: "No WebGPU adapter was returned by the browser." }]
    });
  }
  if (!input.createDevice) {
    return availabilityReport({
      requestedBackend,
      status: "available",
      reason: "WebGPU adapter is available; device will be created only for accelerated runs.",
      available: true,
      fallbackToCpu: false,
      secureContext,
      deviceReady: false,
      adapterName: adapter.info?.description ?? adapter.info?.vendor ?? "adapter available",
      limitsKnown: Boolean(adapter.limits),
      maxBufferSize: typeof adapter.limits?.maxBufferSize === "number" ? adapter.limits.maxBufferSize : undefined
    });
  }
  try {
    const device = await adapter.requestDevice();
    device?.destroy?.();
    return availabilityReport({
      requestedBackend,
      status: "available",
      reason: "WebGPU adapter and device are available.",
      available: true,
      fallbackToCpu: false,
      secureContext,
      deviceReady: true,
      adapterName: adapter.info?.description ?? adapter.info?.vendor ?? "adapter available",
      limitsKnown: Boolean(adapter.limits),
      maxBufferSize: typeof adapter.limits?.maxBufferSize === "number" ? adapter.limits.maxBufferSize : undefined
    });
  } catch (error) {
    return availabilityReport({
      requestedBackend,
      status: "device-creation-failed",
      reason: `WebGPU device creation failed: ${errorMessage(error)}. Using CPU reference backend.`,
      available: false,
      fallbackToCpu: true,
      secureContext,
      deviceReady: false,
      adapterName: adapter.info?.description ?? adapter.info?.vendor,
      limitsKnown: Boolean(adapter.limits),
      maxBufferSize: typeof adapter.limits?.maxBufferSize === "number" ? adapter.limits.maxBufferSize : undefined,
      warnings: [{ code: "fdtd2d.webgpu.deviceFailed", message: `WebGPU device creation failed: ${errorMessage(error)}` }]
    });
  }
}

export function estimateFdtd2dGpuMemory(scene: Fdtd2dScene, budgetBytes = fdtd2dGpuBufferBudgetBytes): Fdtd2dGpuMemoryEstimate {
  const cells = scene.grid.nx * scene.grid.ny;
  const fieldBufferBytes = cells * 4 * 6;
  const coefficientBufferBytes = cells * 4 * 3;
  const maskBufferBytes = cells * 4;
  const sourceBufferBytes = cells * 4;
  const readbackBufferBytes = cells * 4 * 3;
  const estimatedTotalBytes = fieldBufferBytes + coefficientBufferBytes + maskBufferBytes + sourceBufferBytes + readbackBufferBytes;
  const warnings: SolverWarning[] = [];
  const budget = estimateFdtd2dBudget(scene.grid, scene.objects.length);
  if (budget.status === "blocked") warnings.push(...budget.warnings);
  if (estimatedTotalBytes > budgetBytes) {
    warnings.push({ code: "fdtd2d.webgpu.memoryBlocked", message: "Estimated WebGPU buffers exceed the L9.2 diagnostic memory budget." });
  } else if (estimatedTotalBytes > budgetBytes * 0.65) {
    warnings.push({ code: "fdtd2d.webgpu.memoryWarning", message: "Estimated WebGPU buffers are near the L9.2 diagnostic memory budget." });
  }
  const status = estimatedTotalBytes > budgetBytes || budget.status === "blocked" ? "blocked" : warnings.length ? "warning" : "safe";
  return {
    schema: "emmicro.fdtd2d.gpuMemoryEstimate.v1",
    gridCells: cells,
    fieldBufferBytes,
    coefficientBufferBytes,
    maskBufferBytes,
    sourceBufferBytes,
    readbackBufferBytes,
    estimatedTotalBytes,
    budgetBytes,
    status,
    warnings
  };
}

export function createFdtd2dCpuBackend(scene: Fdtd2dScene): Fdtd2dBackend {
  let state = initializeFdtd2dState(scene);
  return {
    id: "cpu-reference",
    label: "CPU reference",
    async available() {
      return true;
    },
    async initialize(nextScene: Fdtd2dScene) {
      state = initializeFdtd2dState(nextScene);
    },
    async step(n: number) {
      const started = now();
      stepFdtd2dState(state, n);
      const elapsedMs = now() - started;
      const result = fdtd2dRunResultFromState(state, n);
      return {
        state: cloneFdtd2dState(state),
        result,
        performance: createFdtd2dPerformanceReport({
          backend: "cpu-reference",
          scene: state.scene,
          steps: Math.max(0, Math.floor(n)),
          elapsedMs,
          readbackMode: "visual-frame",
          readbackCadenceSteps: 1,
          readbackMs: 0,
          renderMs: 0,
          warnings: []
        }),
        warnings: [...state.warnings]
      };
    },
    async readFields() {
      return { ez: new Float32Array(state.ez), hx: new Float32Array(state.hx), hy: new Float32Array(state.hy) };
    },
    dispose() {
      return;
    }
  };
}

export async function runFdtd2dWebGpuScene(scene: Fdtd2dScene, steps: number, options: Fdtd2dWebGpuRunOptions = {}): Promise<Fdtd2dStepResult> {
  const memory = estimateFdtd2dGpuMemory(scene);
  if (memory.status === "blocked") {
    throw new Error(memory.warnings[0]?.message ?? "Estimated WebGPU buffers exceed the L9.2 diagnostic memory budget.");
  }
  const availability = await probeFdtd2dWebGpuAvailability({ runtime: options.runtime, createDevice: false });
  if (!availability.available) throw new Error(availability.reason);
  const runtime = options.runtime ?? defaultWebGpuRuntime();
  const gpu = runtime.navigator?.gpu;
  if (!gpu?.requestAdapter) throw new Error("WebGPU not supported in this browser.");
  const adapter: any = await gpu.requestAdapter();
  if (!adapter) throw new Error("WebGPU adapter unavailable.");
  const device: any = await adapter.requestDevice();
  const constants = gpuConstants(runtime);
  const state = initializeFdtd2dState(createFdtd2dScene(scene));
  const cells = state.scene.grid.nx * state.scene.grid.ny;
  const readbackCadenceSteps = Math.max(1, Math.floor(options.readbackCadenceSteps ?? cadenceForMode(options.readbackMode ?? "validation-checkpoint")));
  const requestedSteps = Math.max(0, Math.min(Math.floor(steps), state.scene.grid.maxStepsPerRun));
  const started = now(runtime);
  let readbackMs = 0;

  const ezBuffer = gpuBuffer(device, state.ez, constants.STORAGE | constants.COPY_SRC | constants.COPY_DST);
  const hxBuffer = gpuBuffer(device, state.hx, constants.STORAGE | constants.COPY_SRC | constants.COPY_DST);
  const hyBuffer = gpuBuffer(device, state.hy, constants.STORAGE | constants.COPY_SRC | constants.COPY_DST);
  const epsilonBuffer = gpuBuffer(device, state.epsilonR, constants.STORAGE | constants.COPY_DST);
  const sigmaBuffer = gpuBuffer(device, state.sigma, constants.STORAGE | constants.COPY_DST);
  const pecBuffer = gpuBuffer(device, uint8ToUint32(state.pec), constants.STORAGE | constants.COPY_DST);
  const sourceBuffer = gpuBuffer(device, new Float32Array(cells), constants.STORAGE | constants.COPY_DST);
  const paramsBuffer = device.createBuffer({ size: 32, usage: constants.UNIFORM | constants.COPY_DST });
  const shader = device.createShaderModule({ code: fdtd2dWebGpuShader });
  const hPipeline = device.createComputePipeline({ layout: "auto", compute: { module: shader, entryPoint: "update_h" } });
  const ePipeline = device.createComputePipeline({ layout: "auto", compute: { module: shader, entryPoint: "update_e" } });
  const hBind = device.createBindGroup({
    layout: hPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: ezBuffer } },
      { binding: 1, resource: { buffer: hxBuffer } },
      { binding: 2, resource: { buffer: hyBuffer } },
      { binding: 3, resource: { buffer: paramsBuffer } }
    ]
  });
  const eBind = device.createBindGroup({
    layout: ePipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: ezBuffer } },
      { binding: 1, resource: { buffer: hxBuffer } },
      { binding: 2, resource: { buffer: hyBuffer } },
      { binding: 3, resource: { buffer: epsilonBuffer } },
      { binding: 4, resource: { buffer: sigmaBuffer } },
      { binding: 5, resource: { buffer: pecBuffer } },
      { binding: 6, resource: { buffer: sourceBuffer } },
      { binding: 7, resource: { buffer: paramsBuffer } }
    ]
  });

  for (let step = 0; step < requestedSteps; step += 1) {
    const sourceMap = sourceInjectionMap(state.scene, state.step);
    device.queue.writeBuffer(sourceBuffer, 0, sourceMap);
    device.queue.writeBuffer(paramsBuffer, 0, paramsArray(state.scene.grid.nx, state.scene.grid.ny, cells, state.step, state.dtCells));
    const encoder = device.createCommandEncoder();
    const passH = encoder.beginComputePass();
    passH.setPipeline(hPipeline);
    passH.setBindGroup(0, hBind);
    passH.dispatchWorkgroups(Math.ceil(cells / 256));
    passH.end();
    const passE = encoder.beginComputePass();
    passE.setPipeline(ePipeline);
    passE.setBindGroup(0, eBind);
    passE.dispatchWorkgroups(Math.ceil(cells / 256));
    passE.end();
    device.queue.submit([encoder.finish()]);
    state.step += 1;
    if (state.step % readbackCadenceSteps === 0 || step === requestedSteps - 1) {
      const readStarted = now(runtime);
      await readFieldsFromGpu(device, constants, state, ezBuffer, hxBuffer, hyBuffer);
      readbackMs += now(runtime) - readStarted;
      recordGpuTraces(state);
    }
  }

  const elapsedMs = Math.max(0.0001, now(runtime) - started);
  const result = fdtd2dRunResultFromState(state, requestedSteps);
  const performance = createFdtd2dPerformanceReport({
    backend: "webgpu-accelerated",
    scene,
    steps: requestedSteps,
    elapsedMs,
    readbackMode: options.readbackMode ?? "validation-checkpoint",
    readbackCadenceSteps,
    readbackMs,
    renderMs: 0,
    warnings: []
  });
  for (const buffer of [ezBuffer, hxBuffer, hyBuffer, epsilonBuffer, sigmaBuffer, pecBuffer, sourceBuffer, paramsBuffer]) {
    buffer.destroy?.();
  }
  device.destroy?.();
  return { state, result, performance, warnings: [] };
}

export function createFdtd2dParityReport(input: {
  backend: Fdtd2dExecutionBackend;
  steps: number;
  reference: Fdtd2dState;
  candidate: Fdtd2dState;
  tolerance?: number;
  warnings?: SolverWarning[];
}): Fdtd2dParityReport {
  const tolerance = input.tolerance ?? fdtd2dParityDefaultTolerance;
  const rmsEz = rmsDifference(input.reference.ez, input.candidate.ez);
  const rmsHx = rmsDifference(input.reference.hx, input.candidate.hx);
  const rmsHy = rmsDifference(input.reference.hy, input.candidate.hy);
  const maxEz = maxDifference(input.reference.ez, input.candidate.ez);
  const maxHx = maxDifference(input.reference.hx, input.candidate.hx);
  const maxHy = maxDifference(input.reference.hy, input.candidate.hy);
  const monitorTraceRms = monitorDifference(input.reference.monitorTraces, input.candidate.monitorTraces);
  const referenceEnergy = input.reference.energyTrace.at(-1) ?? totalFieldEnergy(input.reference);
  const candidateEnergy = input.candidate.energyTrace.at(-1) ?? totalFieldEnergy(input.candidate);
  const energyDifference = Math.abs(referenceEnergy - candidateEnergy);
  const worst = Math.max(rmsEz, rmsHx, rmsHy, maxEz, maxHx, maxHy, monitorTraceRms);
  const status: SimulationBuilderValidationStatus = worst <= tolerance ? "pass" : worst <= tolerance * 8 ? "warning" : "fail";
  const warnings = [...(input.warnings ?? [])];
  if (status !== "pass") warnings.push({ code: "fdtd2d.backend.parityWarning", message: "CPU/GPU parity difference exceeds the L9.2 diagnostic tolerance." });
  const draft = {
    schema: "emmicro.fdtd2d.parityReport.v1" as const,
    backend: input.backend,
    referenceBackend: "cpu-reference" as const,
    steps: input.steps,
    tolerance,
    rmsEz,
    rmsHx,
    rmsHy,
    maxEz,
    maxHx,
    maxHy,
    monitorTraceRms,
    energyDifference,
    status,
    warnings: uniqueWarnings(warnings)
  };
  return { ...draft, reportHash: hash(draft) };
}

export async function runFdtd2dCpuGpuParityCheck(input: {
  scene: Fdtd2dScene;
  steps?: number;
  tolerance?: number;
  acceleratedRunner?: (scene: Fdtd2dScene, steps: number) => Promise<Fdtd2dState> | Fdtd2dState;
}): Promise<Fdtd2dParityReport> {
  const steps = Math.max(1, Math.floor(input.steps ?? 80));
  const reference = initializeFdtd2dState(input.scene);
  stepFdtd2dState(reference, steps);
  const warnings: SolverWarning[] = [];
  let candidate: Fdtd2dState;
  if (input.acceleratedRunner) {
    candidate = await input.acceleratedRunner(input.scene, steps);
  } else {
    candidate = initializeFdtd2dState(input.scene);
    stepFdtd2dState(candidate, steps);
    warnings.push({ code: "fdtd2d.backend.cpuFallbackParity", message: "WebGPU runner was not available; parity check used CPU fallback as the candidate path." });
  }
  return createFdtd2dParityReport({
    backend: input.acceleratedRunner ? "webgpu-accelerated" : "cpu-reference",
    steps,
    reference,
    candidate,
    tolerance: input.tolerance,
    warnings
  });
}

export function createFdtd2dPerformanceReport(input: {
  backend: Fdtd2dExecutionBackend;
  scene: Fdtd2dScene;
  steps: number;
  elapsedMs: number;
  readbackMode: Fdtd2dReadbackMode;
  readbackCadenceSteps: number;
  readbackMs: number;
  renderMs: number;
  cpuReferenceMsPerStep?: number;
  warnings?: SolverWarning[];
}): Fdtd2dPerformanceReport {
  const steps = Math.max(1, Math.floor(input.steps));
  const elapsedMs = Math.max(0.0001, input.elapsedMs);
  const msPerStep = elapsedMs / steps;
  const stepsPerSecond = 1000 / msPerStep;
  const speedupVsCpu = input.cpuReferenceMsPerStep && msPerStep > 0 ? input.cpuReferenceMsPerStep / msPerStep : undefined;
  const warnings = [...(input.warnings ?? [])];
  if (input.backend === "webgpu-accelerated" && input.readbackCadenceSteps <= 1) warnings.push({ code: "fdtd2d.webgpu.readbackCadence", message: "Reading back every step can dominate WebGPU runtime; use fast-run or validation checkpoint cadence for performance checks." });
  const draft = {
    schema: "emmicro.fdtd2d.performanceReport.v1" as const,
    backend: input.backend,
    grid: `${input.scene.grid.nx}x${input.scene.grid.ny}`,
    steps,
    elapsedMs,
    msPerStep,
    stepsPerSecond,
    readbackMode: input.readbackMode,
    readbackCadenceSteps: input.readbackCadenceSteps,
    readbackMs: input.readbackMs,
    renderMs: input.renderMs,
    cpuReferenceMsPerStep: input.cpuReferenceMsPerStep,
    speedupVsCpu,
    status: warnings.length ? "warning" as const : "pass" as const,
    warnings: uniqueWarnings(warnings)
  };
  return { ...draft, reportHash: hash(draft) };
}

export function createFdtd2dBackendReport(input: {
  scene: Fdtd2dScene;
  selectedBackend: Fdtd2dExecutionBackend;
  availability: Fdtd2dWebGpuAvailabilityReport;
  parity?: Fdtd2dParityReport;
  performance?: Fdtd2dPerformanceReport;
}): Fdtd2dBackendReport {
  const draft = {
    schema: "emmicro.fdtd2d.backendReport.v1" as const,
    label: "L9.2 WebGPU-Accelerated 2D FDTD Sandbox Backend Report",
    sceneHash: input.scene.sceneHash,
    selectedBackend: input.selectedBackend,
    effectiveBackend: input.selectedBackend === "webgpu-accelerated" && input.availability.available ? "webgpu-accelerated" as const : "cpu-reference" as const,
    availability: input.availability,
    gpuMemory: estimateFdtd2dGpuMemory(input.scene),
    parity: input.parity,
    performance: input.performance,
    boundary: [...l92Fdtd2dBackendBoundary]
  };
  return { ...draft, reportHash: hash(draft) };
}

export function fdtd2dBackendReportJson(report: Fdtd2dBackendReport): string {
  return json(report);
}

export function fdtd2dBackendReportMarkdown(report: Fdtd2dBackendReport): string {
  return [
    "# L9.2 WebGPU-Accelerated 2D FDTD Sandbox Backend Report",
    "",
    `Scene hash: ${report.sceneHash}`,
    `Selected backend: ${report.selectedBackend}`,
    `Effective backend: ${report.effectiveBackend}`,
    `WebGPU status: ${report.availability.status}`,
    `Fallback: ${report.availability.fallbackToCpu ? "CPU reference" : "not active"}`,
    `GPU memory estimate: ${formatNumber(report.gpuMemory.estimatedTotalBytes)} bytes`,
    "",
    "## Parity",
    ...(report.parity ? [
      `Status: ${report.parity.status.toUpperCase()}`,
      `RMS Ez/Hx/Hy: ${formatNumber(report.parity.rmsEz)} / ${formatNumber(report.parity.rmsHx)} / ${formatNumber(report.parity.rmsHy)}`,
      `Max Ez/Hx/Hy: ${formatNumber(report.parity.maxEz)} / ${formatNumber(report.parity.maxHx)} / ${formatNumber(report.parity.maxHy)}`,
      `Monitor trace RMS: ${formatNumber(report.parity.monitorTraceRms)}`,
      `Energy difference: ${formatNumber(report.parity.energyDifference)}`
    ] : ["- not run"]),
    "",
    "## Performance",
    ...(report.performance ? [
      `Backend: ${report.performance.backend}`,
      `Steps/sec: ${formatNumber(report.performance.stepsPerSecond)}`,
      `ms/step: ${formatNumber(report.performance.msPerStep)}`,
      `Readback cadence: every ${report.performance.readbackCadenceSteps} step(s)`,
      `Readback time: ${formatNumber(report.performance.readbackMs)} ms`
    ] : ["- not run"]),
    "",
    "## Boundary",
    ...report.boundary.map((item) => `- ${item}`)
  ].join("\n");
}

export function fdtd2dParityCsv(report: Fdtd2dParityReport): string {
  return [
    "backend,steps,tolerance,rms_ez,rms_hx,rms_hy,max_ez,max_hx,max_hy,monitor_trace_rms,energy_difference,status",
    [
      report.backend,
      report.steps,
      report.tolerance,
      report.rmsEz,
      report.rmsHx,
      report.rmsHy,
      report.maxEz,
      report.maxHx,
      report.maxHy,
      report.monitorTraceRms,
      report.energyDifference,
      report.status
    ].join(",")
  ].join("\n");
}

export function fdtd2dPerformanceCsv(report: Fdtd2dPerformanceReport): string {
  return [
    "backend,grid,steps,elapsed_ms,ms_per_step,steps_per_second,readback_mode,readback_cadence_steps,readback_ms,render_ms,cpu_reference_ms_per_step,speedup_vs_cpu,status",
    [
      report.backend,
      report.grid,
      report.steps,
      report.elapsedMs,
      report.msPerStep,
      report.stepsPerSecond,
      report.readbackMode,
      report.readbackCadenceSteps,
      report.readbackMs,
      report.renderMs,
      report.cpuReferenceMsPerStep ?? "",
      report.speedupVsCpu ?? "",
      report.status
    ].join(",")
  ].join("\n");
}

export const fdtd2dWebGpuShader = `
struct Params {
  nx: u32,
  ny: u32,
  cells: u32,
  step: u32,
  dt: f32,
  source_count: u32,
  pad0: u32,
  pad1: u32
};

@group(0) @binding(0) var<storage, read> ez_h: array<f32>;
@group(0) @binding(1) var<storage, read_write> hx_h: array<f32>;
@group(0) @binding(2) var<storage, read_write> hy_h: array<f32>;
@group(0) @binding(3) var<uniform> h_params: Params;

@compute @workgroup_size(256)
fn update_h(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let idx = global_id.x;
  if (idx >= h_params.cells) {
    return;
  }
  let x = idx % h_params.nx;
  let y = idx / h_params.nx;
  if (y < h_params.ny - 1u) {
    hx_h[idx] = hx_h[idx] - h_params.dt * (ez_h[idx + h_params.nx] - ez_h[idx]);
  }
  if (x < h_params.nx - 1u) {
    hy_h[idx] = hy_h[idx] + h_params.dt * (ez_h[idx + 1u] - ez_h[idx]);
  }
}

@group(0) @binding(0) var<storage, read_write> ez_e: array<f32>;
@group(0) @binding(1) var<storage, read> hx_e: array<f32>;
@group(0) @binding(2) var<storage, read> hy_e: array<f32>;
@group(0) @binding(3) var<storage, read> eps_e: array<f32>;
@group(0) @binding(4) var<storage, read> sigma_e: array<f32>;
@group(0) @binding(5) var<storage, read> pec_e: array<u32>;
@group(0) @binding(6) var<storage, read> source_e: array<f32>;
@group(0) @binding(7) var<uniform> e_params: Params;

@compute @workgroup_size(256)
fn update_e(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let idx = global_id.x;
  if (idx >= e_params.cells) {
    return;
  }
  let x = idx % e_params.nx;
  let y = idx / e_params.nx;
  if (x == 0u || y == 0u || x >= e_params.nx - 1u || y >= e_params.ny - 1u) {
    return;
  }
  if (pec_e[idx] != 0u) {
    ez_e[idx] = 0.0;
    return;
  }
  let d_hy_dx = hy_e[idx] - hy_e[idx - 1u];
  let d_hx_dy = hx_e[idx] - hx_e[idx - e_params.nx];
  let eps = max(0.1, eps_e[idx]);
  let loss = max(0.0, sigma_e[idx]);
  let damping = 1.0 / (1.0 + loss * e_params.dt);
  ez_e[idx] = damping * (ez_e[idx] + (e_params.dt / eps) * (d_hy_dx - d_hx_dy)) + source_e[idx];
}
`;

function availabilityReport(input: {
  requestedBackend: Fdtd2dExecutionBackend;
  status: Fdtd2dWebGpuAvailabilityStatus;
  reason: string;
  available: boolean;
  fallbackToCpu: boolean;
  secureContext?: boolean;
  deviceReady: boolean;
  adapterName?: string;
  limitsKnown?: boolean;
  maxBufferSize?: number;
  warnings?: SolverWarning[];
}): Fdtd2dWebGpuAvailabilityReport {
  return {
    schema: "emmicro.fdtd2d.webgpuAvailability.v1",
    requestedBackend: input.requestedBackend,
    effectiveBackend: input.available && input.requestedBackend === "webgpu-accelerated" ? "webgpu-accelerated" : "cpu-reference",
    status: input.status,
    available: input.available,
    fallbackToCpu: input.fallbackToCpu,
    reason: input.reason,
    adapterName: input.adapterName,
    deviceReady: input.deviceReady,
    secureContext: input.secureContext ?? true,
    limitsKnown: input.limitsKnown ?? false,
    maxBufferSize: input.maxBufferSize,
    warnings: uniqueWarnings(input.warnings ?? [])
  };
}

function defaultWebGpuRuntime(): Fdtd2dWebGpuRuntime {
  const global = globalThis as unknown as Fdtd2dWebGpuRuntime;
  return {
    navigator: global.navigator,
    isSecureContext: global.isSecureContext,
    now: () => now(),
    GPUBufferUsage: global.GPUBufferUsage,
    GPUMapMode: global.GPUMapMode
  };
}

function gpuConstants(runtime: Fdtd2dWebGpuRuntime) {
  const usage = runtime.GPUBufferUsage ?? (globalThis as unknown as Fdtd2dWebGpuRuntime).GPUBufferUsage;
  const mapMode = runtime.GPUMapMode ?? (globalThis as unknown as Fdtd2dWebGpuRuntime).GPUMapMode;
  if (!usage || !mapMode) throw new Error("WebGPU constants are unavailable.");
  return {
    STORAGE: gpuConstant(usage, "STORAGE"),
    COPY_SRC: gpuConstant(usage, "COPY_SRC"),
    COPY_DST: gpuConstant(usage, "COPY_DST"),
    UNIFORM: gpuConstant(usage, "UNIFORM"),
    MAP_READ: gpuConstant(usage, "MAP_READ"),
    MAP_READ_MODE: gpuConstant(mapMode, "READ")
  };
}

function gpuConstant(record: Record<string, number>, key: string): number {
  const value = record[key];
  if (typeof value !== "number") throw new Error(`WebGPU constant ${key} is unavailable.`);
  return value;
}

function gpuBuffer(device: any, data: Float32Array | Uint32Array, usage: number) {
  const buffer = device.createBuffer({ size: align4(data.byteLength), usage, mappedAtCreation: true });
  const mapped = data instanceof Float32Array ? new Float32Array(buffer.getMappedRange()) : new Uint32Array(buffer.getMappedRange());
  mapped.set(data);
  buffer.unmap();
  return buffer;
}

function paramsArray(nx: number, ny: number, cells: number, step: number, dt: number): ArrayBuffer {
  const buffer = new ArrayBuffer(32);
  const u32 = new Uint32Array(buffer);
  const f32 = new Float32Array(buffer);
  u32[0] = nx;
  u32[1] = ny;
  u32[2] = cells;
  u32[3] = step;
  f32[4] = dt;
  u32[5] = 0;
  u32[6] = 0;
  u32[7] = 0;
  return buffer;
}

async function readFieldsFromGpu(device: any, constants: ReturnType<typeof gpuConstants>, state: Fdtd2dState, ezBuffer: any, hxBuffer: any, hyBuffer: any): Promise<void> {
  const buffers = [ezBuffer, hxBuffer, hyBuffer];
  const targets = [state.ez, state.hx, state.hy];
  const readBuffers = buffers.map((buffer) => {
    const read = device.createBuffer({ size: align4(buffer.size ?? targets[0]!.byteLength), usage: constants.COPY_DST | constants.MAP_READ });
    const encoder = device.createCommandEncoder();
    encoder.copyBufferToBuffer(buffer, 0, read, 0, align4(targets[0]!.byteLength));
    device.queue.submit([encoder.finish()]);
    return read;
  });
  for (let index = 0; index < readBuffers.length; index += 1) {
    const read = readBuffers[index]!;
    await read.mapAsync(constants.MAP_READ_MODE);
    targets[index]!.set(new Float32Array(read.getMappedRange()).slice(0, targets[index]!.length));
    read.unmap();
    read.destroy?.();
  }
}

function sourceInjectionMap(scene: Fdtd2dScene, step: number): Float32Array {
  const map = new Float32Array(scene.grid.nx * scene.grid.ny);
  for (const source of scene.sources) {
    const value = sourceValue(source, step);
    if (source.kind === "point") {
      addSourceAtMap(map, scene.grid.nx, scene.grid.ny, source.x, source.y, value);
    } else {
      const x1 = source.x;
      const y1 = source.y;
      const x2 = source.x2 ?? source.x;
      const y2 = source.y2 ?? source.y;
      const count = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
      for (let index = 0; index <= count; index += 1) {
        const t = index / count;
        addSourceAtMap(map, scene.grid.nx, scene.grid.ny, Math.round(x1 + (x2 - x1) * t), Math.round(y1 + (y2 - y1) * t), value / Math.sqrt(count + 1));
      }
    }
  }
  return map;
}

function addSourceAtMap(map: Float32Array, nx: number, ny: number, x: number, y: number, value: number): void {
  const cx = clampInt(Math.round(x), 1, nx - 2);
  const cy = clampInt(Math.round(y), 1, ny - 2);
  const index = cy * nx + cx;
  map[index] = (map[index] ?? 0) + value;
}

function sourceValue(source: Fdtd2dSource, step: number): number {
  const phase = (2 * Math.PI * step) / Math.max(2, source.periodSteps);
  if (source.waveform === "gaussian-pulse") {
    const envelope = Math.exp(-Math.pow((step - source.pulseCenterStep) / Math.max(1, source.pulseWidthSteps), 2));
    return source.amplitude * envelope * Math.sin(phase);
  }
  return source.amplitude * Math.sin(phase);
}

function recordGpuTraces(state: Fdtd2dState): void {
  state.energyTrace.push(totalFieldEnergy(state));
  capTrace(state.energyTrace, state.scene.grid.maxMonitorSamples);
  for (const monitor of state.scene.monitors) {
    const trace = state.monitorTraces[monitor.id] ?? [];
    trace.push(sampleMonitor(state, monitor));
    capTrace(trace, state.scene.grid.maxMonitorSamples);
    state.monitorTraces[monitor.id] = trace;
  }
}

function totalFieldEnergy(state: Fdtd2dState): number {
  let sum = 0;
  for (let index = 0; index < state.ez.length; index += 1) {
    const ez = state.ez[index] ?? 0;
    const hx = state.hx[index] ?? 0;
    const hy = state.hy[index] ?? 0;
    sum += ez * ez + hx * hx + hy * hy;
  }
  return sum;
}

function sampleMonitor(state: Fdtd2dState, monitor: Fdtd2dMonitor): number {
  if (monitor.kind === "point") {
    return state.ez[index2d(clampInt(Math.round(monitor.x), 0, state.scene.grid.nx - 1), clampInt(Math.round(monitor.y), 0, state.scene.grid.ny - 1), state.scene.grid.nx)] ?? 0;
  }
  const x1 = monitor.x;
  const y1 = monitor.y;
  const x2 = monitor.x2 ?? monitor.x;
  const y2 = monitor.y2 ?? monitor.y;
  const count = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
  let sum = 0;
  for (let index = 0; index <= count; index += 1) {
    const t = index / count;
    const x = clampInt(Math.round(x1 + (x2 - x1) * t), 0, state.scene.grid.nx - 1);
    const y = clampInt(Math.round(y1 + (y2 - y1) * t), 0, state.scene.grid.ny - 1);
    sum += state.ez[index2d(x, y, state.scene.grid.nx)] ?? 0;
  }
  return sum / (count + 1);
}

function rmsDifference(a: Float32Array, b: Float32Array): number {
  const count = Math.min(a.length, b.length);
  if (!count) return 0;
  let sum = 0;
  for (let index = 0; index < count; index += 1) {
    const delta = (a[index] ?? 0) - (b[index] ?? 0);
    sum += delta * delta;
  }
  return Math.sqrt(sum / count);
}

function maxDifference(a: Float32Array, b: Float32Array): number {
  const count = Math.min(a.length, b.length);
  let max = 0;
  for (let index = 0; index < count; index += 1) max = Math.max(max, Math.abs((a[index] ?? 0) - (b[index] ?? 0)));
  return max;
}

function monitorDifference(a: Record<string, number[]>, b: Record<string, number[]>): number {
  const ids = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
  const deltas: number[] = [];
  for (const id of ids) {
    const traceA = a[id] ?? [];
    const traceB = b[id] ?? [];
    const count = Math.min(traceA.length, traceB.length);
    for (let index = 0; index < count; index += 1) deltas.push((traceA[index] ?? 0) - (traceB[index] ?? 0));
  }
  if (!deltas.length) return 0;
  return Math.sqrt(deltas.reduce((sum, value) => sum + value * value, 0) / deltas.length);
}

function capTrace(trace: number[], maxSamples: number): void {
  if (trace.length > maxSamples) trace.splice(0, trace.length - maxSamples);
}

function uint8ToUint32(values: Uint8Array): Uint32Array {
  const output = new Uint32Array(values.length);
  for (let index = 0; index < values.length; index += 1) output[index] = values[index] ?? 0;
  return output;
}

function cadenceForMode(mode: Fdtd2dReadbackMode): number {
  if (mode === "visual-frame") return 1;
  if (mode === "fast-run") return 50;
  return 20;
}

function uniqueWarnings(warnings: SolverWarning[]): SolverWarning[] {
  const seen = new Set<string>();
  const output: SolverWarning[] = [];
  for (const warning of warnings) {
    const key = `${warning.code}:${warning.elementId ?? ""}:${warning.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(warning);
  }
  return output;
}

function align4(value: number): number {
  return Math.ceil(value / 4) * 4;
}

function index2d(x: number, y: number, nx: number): number {
  return y * nx + x;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function now(runtime?: Fdtd2dWebGpuRuntime): number {
  return runtime?.now?.() ?? Date.now();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function hash(value: unknown): string {
  return fnv1a64(stableStringify(value));
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "non-finite";
  if (value === 0) return "0";
  if (Math.abs(value) >= 1000 || Math.abs(value) < 0.001) return value.toExponential(4);
  return value.toPrecision(6);
}
