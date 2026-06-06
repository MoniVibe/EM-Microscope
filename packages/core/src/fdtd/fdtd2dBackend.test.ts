import { describe, expect, it } from "vitest";
import {
  createFdtd2dBackendReport,
  createFdtd2dCpuBackend,
  createFdtd2dParityReport,
  createFdtd2dPerformanceReport,
  estimateFdtd2dGpuMemory,
  fdtd2dBackendReportJson,
  fdtd2dBackendReportMarkdown,
  fdtd2dParityCsv,
  fdtd2dPerformanceCsv,
  l92Fdtd2dBackendBoundary,
  probeFdtd2dWebGpuAvailability,
  runFdtd2dCpuGpuParityCheck
} from "./fdtd2dBackend";
import {
  cloneFdtd2dState,
  createFdtd2dScene,
  initializeFdtd2dState,
  l92Fdtd2dBoundary,
  stepFdtd2dState
} from "./fdtd2dSandbox";

describe("L9.2 FDTD backend abstraction", () => {
  it("uses CPU reference backend by default and preserves scene metadata", async () => {
    const scene = createFdtd2dScene();
    const backend = createFdtd2dCpuBackend(scene);

    expect(backend.id).toBe("cpu-reference");
    expect(await backend.available()).toBe(true);

    const step = await backend.step(8);
    const fields = await backend.readFields();

    expect(step.state.scene.sceneHash).toBe(scene.sceneHash);
    expect(step.performance?.backend).toBe("cpu-reference");
    expect(fields.ez).toHaveLength(scene.grid.nx * scene.grid.ny);
    expect(step.result.stepsCompleted).toBe(8);
  });

  it("reports WebGPU unavailable and falls back to CPU when navigator.gpu is absent", async () => {
    const report = await probeFdtd2dWebGpuAvailability({
      runtime: { navigator: {}, isSecureContext: true }
    });

    expect(report.status).toBe("unavailable");
    expect(report.available).toBe(false);
    expect(report.effectiveBackend).toBe("cpu-reference");
    expect(report.reason).toContain("CPU reference");
  });

  it("reports secure-context and device creation failures clearly", async () => {
    const insecure = await probeFdtd2dWebGpuAvailability({
      runtime: { navigator: { gpu: { requestAdapter: async () => ({}) } }, isSecureContext: false }
    });
    const deviceFailed = await probeFdtd2dWebGpuAvailability({
      runtime: {
        navigator: { gpu: { requestAdapter: async () => ({ requestDevice: async () => { throw new Error("device denied"); } }) } },
        isSecureContext: true
      },
      createDevice: true
    });

    expect(insecure.status).toBe("secure-context-required");
    expect(deviceFailed.status).toBe("device-creation-failed");
    expect(deviceFailed.reason).toContain("device denied");
  });
});

describe("L9.2 WebGPU guardrails", () => {
  it("does not require WebGPU for tests/build and keeps grid memory caps enforced", () => {
    const scene = createFdtd2dScene();
    const memory = estimateFdtd2dGpuMemory(scene);
    const oversized = estimateFdtd2dGpuMemory(createFdtd2dScene({ grid: { ...scene.grid, nx: 1024, ny: 1024 } }), 1024);

    expect(memory.schema).toBe("emmicro.fdtd2d.gpuMemoryEstimate.v1");
    expect(memory.status).toBe("safe");
    expect(memory.estimatedTotalBytes).toBeGreaterThan(0);
    expect(oversized.status).toBe("blocked");
    expect(oversized.warnings.map((warning) => warning.code)).toContain("fdtd2d.webgpu.memoryBlocked");
  });

  it("keeps L9.2 boundary language strict", () => {
    const text = [...l92Fdtd2dBoundary, ...l92Fdtd2dBackendBoundary].join(" ");

    expect(text).toContain("CPU typed-array stepping remains the reference validation baseline and fallback");
    expect(text).toContain("WebGPU acceleration is optional");
    expect(text).toContain("not full 3D Maxwell");
    expect(text).toContain("not production FDTD");
    expect(text).toContain("No FEM/BEM/RCWA execution");
    expect(text).not.toMatch(/production FDTD is available|3D Maxwell is implemented|WebGPU is always available|replacement for external Meep/i);
  });
});

describe("L9.2 CPU GPU parity reporting", () => {
  it("computes RMS, max, monitor, and energy differences", () => {
    const reference = initializeFdtd2dState(createFdtd2dScene());
    stepFdtd2dState(reference, 20);
    const candidate = cloneFdtd2dState(reference);
    candidate.ez[10] = (candidate.ez[10] ?? 0) + 0.001;
    candidate.monitorTraces[Object.keys(candidate.monitorTraces)[0] ?? "center-line"] = [0.001, 0.002];

    const report = createFdtd2dParityReport({ backend: "webgpu-accelerated", steps: 20, reference, candidate, tolerance: 0.01 });

    expect(report.schema).toBe("emmicro.fdtd2d.parityReport.v1");
    expect(report.rmsEz).toBeGreaterThan(0);
    expect(report.maxEz).toBeGreaterThan(0);
    expect(Number.isFinite(report.monitorTraceRms)).toBe(true);
    expect(Number.isFinite(report.energyDifference)).toBe(true);
    expect(report.status).toBe("pass");
  });

  it("reports WARNING/FAIL when differences exceed tolerance and exports parity CSV", () => {
    const reference = initializeFdtd2dState(createFdtd2dScene());
    const candidate = cloneFdtd2dState(reference);
    candidate.ez.fill(1);
    const report = createFdtd2dParityReport({ backend: "webgpu-accelerated", steps: 1, reference, candidate, tolerance: 1e-6 });
    const csv = fdtd2dParityCsv(report);

    expect(report.status).toBe("fail");
    expect(report.warnings.map((warning) => warning.code)).toContain("fdtd2d.backend.parityWarning");
    expect(csv).toContain("rms_ez");
    expect(csv).toContain("energy_difference");
  });

  it("runs fallback parity without a real WebGPU device", async () => {
    const report = await runFdtd2dCpuGpuParityCheck({ scene: createFdtd2dScene(), steps: 12 });

    expect(report.backend).toBe("cpu-reference");
    expect(report.status).toBe("pass");
    expect(report.warnings.map((warning) => warning.code)).toContain("fdtd2d.backend.cpuFallbackParity");
  });
});

describe("L9.2 FDTD performance reporting", () => {
  it("reports steps per second, ms per step, readback cadence, and CSV export", () => {
    const scene = createFdtd2dScene();
    const report = createFdtd2dPerformanceReport({
      backend: "webgpu-accelerated",
      scene,
      steps: 100,
      elapsedMs: 50,
      readbackMode: "fast-run",
      readbackCadenceSteps: 25,
      readbackMs: 4,
      renderMs: 2,
      cpuReferenceMsPerStep: 2
    });
    const csv = fdtd2dPerformanceCsv(report);

    expect(report.msPerStep).toBeCloseTo(0.5);
    expect(report.stepsPerSecond).toBeCloseTo(2000);
    expect(report.speedupVsCpu).toBeCloseTo(4);
    expect(csv).toContain("steps_per_second");
    expect(csv).toContain("readback_cadence_steps");
  });

  it("exports backend reports with parity and performance evidence", async () => {
    const scene = createFdtd2dScene();
    const availability = await probeFdtd2dWebGpuAvailability({ runtime: { navigator: {}, isSecureContext: true } });
    const parity = await runFdtd2dCpuGpuParityCheck({ scene, steps: 10 });
    const performance = createFdtd2dPerformanceReport({
      backend: "cpu-reference",
      scene,
      steps: 10,
      elapsedMs: 20,
      readbackMode: "visual-frame",
      readbackCadenceSteps: 1,
      readbackMs: 0,
      renderMs: 1
    });
    const report = createFdtd2dBackendReport({ scene, selectedBackend: "webgpu-accelerated", availability, parity, performance });
    const markdown = fdtd2dBackendReportMarkdown(report);

    expect(report.effectiveBackend).toBe("cpu-reference");
    expect(fdtd2dBackendReportJson(report)).toContain("emmicro.fdtd2d.backendReport.v1");
    expect(markdown).toContain("L9.2 WebGPU-Accelerated 2D FDTD Sandbox Backend Report");
    expect(markdown).toContain("CPU reference");
  });
});
