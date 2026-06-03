import {
  makeL33ResultCacheKey,
  makeL3ResultCacheKey,
  scalarCoherentL3_2dSolver,
  scalarPartialCoherentL33_2dSolver,
  type Scene,
  type SolverResult
} from "@emmicro/core";
import type { L3WorkerMessage } from "../workers/l3Worker";

export type L3ComputeProgress = {
  stage: string;
  percent: number;
  message: string;
};

export type L3ComputeJob = {
  requestId: string;
  cacheKey: string;
  cancel: () => void;
};

export type L3ComputeCallbacks = {
  onProgress: (progress: L3ComputeProgress) => void;
  onResult: (result: SolverResult) => void;
  onError: (message: string) => void;
  onCancelled: (cacheKey: string) => void;
};

const l3ResultCache = new Map<string, SolverResult>();

export function clearL3ResultCache(): void {
  l3ResultCache.clear();
}

export function cachedL3ResultCount(): number {
  return l3ResultCache.size;
}

export function startL3ImageCompute(scene: Scene, callbacks: L3ComputeCallbacks, useWorker = true): L3ComputeJob {
  const requestId = `l3-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const cacheKey = imageCacheKey(scene);
  const cached = l3ResultCache.get(cacheKey);
  let cancelled = false;
  let worker: Worker | null = null;

  const runMainThreadFallback = () => {
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        callbacks.onProgress({ stage: "main-thread", percent: 15, message: "Computing L3 image on main thread" });
        const result = runActiveImageSolver(scene, {
          computePolicy: "mainThread"
        });
        result.performanceStats = {
          ...(result.performanceStats ?? {
            computeMs: 0,
            workerUsed: false,
            cacheHit: false,
            cancelled: false
          }),
          workerUsed: false,
          cacheHit: false,
          cancelled: false
        };
        l3ResultCache.set(cacheKey, result);
        callbacks.onProgress({ stage: "completed", percent: 100, message: "L3 image compute complete" });
        callbacks.onResult(result);
      } catch (error) {
        callbacks.onError(error instanceof Error ? error.message : String(error));
      }
    });
  };

  if (cached) {
    queueMicrotask(() => {
      if (cancelled) return;
      callbacks.onProgress({ stage: "cache-hit", percent: 100, message: "Loaded L3 result from cache" });
      callbacks.onResult(markCacheHit(cached));
    });
    return {
      requestId,
      cacheKey,
      cancel: () => {
        cancelled = true;
        callbacks.onCancelled(cacheKey);
      }
    };
  }

  queueMicrotask(() => {
    if (!cancelled) callbacks.onProgress({ stage: "queued", percent: 0, message: "Queued L3 compute" });
  });

  if (useWorker && typeof Worker !== "undefined") {
    try {
      worker = new Worker(new URL("../workers/l3Worker.ts", import.meta.url), { type: "module" });
      worker.onmessage = (event: MessageEvent<L3WorkerMessage>) => {
        if (event.data.requestId !== requestId || cancelled) return;
        if (event.data.type === "progress") {
          callbacks.onProgress({
            stage: event.data.stage,
            percent: event.data.percent,
            message: event.data.message
          });
          return;
        }
        if (event.data.type === "result") {
          const result = {
            ...event.data.result,
            cacheKey,
            cacheHit: false,
            cancelled: false,
            performanceStats: {
              ...(event.data.result.performanceStats ?? {
                computeMs: 0,
                workerUsed: true,
                cacheHit: false,
                cancelled: false
              }),
              workerUsed: true,
              cacheHit: false,
              cancelled: false
            }
          };
          l3ResultCache.set(cacheKey, result);
          callbacks.onResult(result);
          worker?.terminate();
          worker = null;
          return;
        }
        callbacks.onError(event.data.message);
        worker?.terminate();
        worker = null;
      };
      worker.onerror = (event) => {
        if (cancelled) return;
        callbacks.onError(event.message);
        worker?.terminate();
        worker = null;
      };
      worker.postMessage({ type: "compute", requestId, scene });
    } catch {
      worker?.terminate();
      worker = null;
      runMainThreadFallback();
    }
  } else {
    runMainThreadFallback();
  }

  return {
    requestId,
    cacheKey,
    cancel: () => {
      if (cancelled) return;
      cancelled = true;
      worker?.terminate();
      worker = null;
      callbacks.onCancelled(cacheKey);
    }
  };
}

function imageCacheKey(scene: Scene): string {
  return scene.solverSettings.activeSolverId === "scalar.partialCoherent.l3.3.2d" ? makeL33ResultCacheKey(scene) : makeL3ResultCacheKey(scene);
}

function runActiveImageSolver(scene: Scene, options: { computePolicy: "mainThread" | "worker" }): SolverResult {
  if (scene.solverSettings.activeSolverId === "scalar.partialCoherent.l3.3.2d") {
    return scalarPartialCoherentL33_2dSolver.run(scene, {
      solverId: "scalar.partialCoherent.l3.3.2d",
      computePolicy: options.computePolicy
    });
  }
  return scalarCoherentL3_2dSolver.run(scene, {
    solverId: "scalar.coherent.l3.2d",
    computePolicy: options.computePolicy
  });
}

function markCacheHit(result: SolverResult): SolverResult {
  return {
    ...result,
    cacheHit: true,
    cancelled: false,
    progressStage: "cache-hit",
    performanceStats: {
      ...(result.performanceStats ?? {
        computeMs: 0,
        workerUsed: false,
        cacheHit: true,
        cancelled: false
      }),
      computeMs: 0,
      cacheHit: true,
      cancelled: false
    }
  };
}
