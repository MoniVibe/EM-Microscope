import { scalarCoherentL3_2dSolver, scalarPartialCoherentL33_2dSolver, type Scene, type SolverResult } from "@emmicro/core";

type L3WorkerRequest = {
  type: "compute";
  requestId: string;
  scene: Scene;
};

type L3WorkerProgressMessage = {
  type: "progress";
  requestId: string;
  stage: string;
  percent: number;
  message: string;
};

type L3WorkerResultMessage = {
  type: "result";
  requestId: string;
  result: SolverResult;
};

type L3WorkerErrorMessage = {
  type: "error";
  requestId: string;
  message: string;
};

export type L3WorkerMessage = L3WorkerProgressMessage | L3WorkerResultMessage | L3WorkerErrorMessage;

type L3WorkerScope = {
  onmessage: ((event: MessageEvent<L3WorkerRequest>) => void) | null;
  postMessage: (message: L3WorkerMessage, transfer?: Transferable[]) => void;
};

const workerScope = self as unknown as L3WorkerScope;

workerScope.onmessage = (event: MessageEvent<L3WorkerRequest>) => {
  const request = event.data;
  if (request.type !== "compute") return;

  try {
    workerScope.postMessage({
      type: "progress",
      requestId: request.requestId,
      stage: "started",
      percent: 5,
      message: "Starting L3 worker compute"
    } satisfies L3WorkerProgressMessage);

    const result =
      request.scene.solverSettings.activeSolverId === "scalar.partialCoherent.l3.3.2d"
        ? scalarPartialCoherentL33_2dSolver.run(request.scene, {
            solverId: "scalar.partialCoherent.l3.3.2d",
            computePolicy: "worker"
          })
        : scalarCoherentL3_2dSolver.run(request.scene, {
            solverId: "scalar.coherent.l3.2d",
            computePolicy: "worker"
          });
    result.performanceStats = {
      ...(result.performanceStats ?? {
        computeMs: 0,
        workerUsed: true,
        cacheHit: false,
        cancelled: false
      }),
      workerUsed: true,
      cacheHit: false,
      cancelled: false
    };

    workerScope.postMessage({
      type: "progress",
      requestId: request.requestId,
      stage: "completed",
      percent: 100,
      message: "L3 worker compute complete"
    } satisfies L3WorkerProgressMessage);

    workerScope.postMessage(
      {
        type: "result",
        requestId: request.requestId,
        result
      } satisfies L3WorkerResultMessage,
      transferablesFor(result)
    );
  } catch (error) {
    workerScope.postMessage({
      type: "error",
      requestId: request.requestId,
      message: error instanceof Error ? error.message : String(error)
    } satisfies L3WorkerErrorMessage);
  }
};

function transferablesFor(result: SolverResult): Transferable[] {
  const transferables: Transferable[] = [];
  for (const field of result.fieldImageOutputs ?? []) {
    if (field.real) transferables.push(field.real.buffer);
    if (field.imag) transferables.push(field.imag.buffer);
    transferables.push(field.intensity.buffer);
    if (field.phaseRad) transferables.push(field.phaseRad.buffer);
  }
  return transferables;
}
