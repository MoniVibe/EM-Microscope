import { describe, expect, it } from "vitest";
import { l3PresetScenes } from "@emmicro/core";
import { cachedL3ResultCount, clearL3ResultCache, startL3ImageCompute } from "./computeL3Image";

describe("L3 image compute service", () => {
  it("computes through the main-thread fallback and then returns a cache hit", async () => {
    clearL3ResultCache();
    const first = await compute(false);
    const second = await compute(false);

    expect(first.result.solverId).toBe("scalar.coherent.l3.2d");
    expect(first.result.performanceStats?.workerUsed).toBe(false);
    expect(first.result.performanceStats?.cacheHit).toBe(false);
    expect(second.result.cacheHit).toBe(true);
    expect(second.result.performanceStats?.cacheHit).toBe(true);
    expect(cachedL3ResultCount()).toBe(1);
  });

  it("falls back to the main thread when Worker is unavailable", async () => {
    clearL3ResultCache();
    const result = await waitForResult(true);

    expect(result.solverId).toBe("scalar.coherent.l3.2d");
    expect(result.performanceStats?.workerUsed).toBe(false);
    expect(result.performanceStats?.cacheHit).toBe(false);
  });

  it("does not publish a result after cancellation", async () => {
    clearL3ResultCache();
    let resultCount = 0;
    let cancelledCount = 0;
    const job = startL3ImageCompute(
      l3PresetScenes.airyPupil,
      {
        onProgress: () => undefined,
        onResult: () => {
          resultCount += 1;
        },
        onError: (message) => {
          throw new Error(message);
        },
        onCancelled: () => {
          cancelledCount += 1;
        }
      },
      false
    );
    job.cancel();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(resultCount).toBe(0);
    expect(cancelledCount).toBe(1);
  });
});

function compute(useWorker: boolean): Promise<{ result: Awaited<ReturnType<typeof waitForResult>> }> {
  return waitForResult(useWorker).then((result) => ({ result }));
}

function waitForResult(useWorker: boolean) {
  return new Promise<Parameters<Parameters<typeof startL3ImageCompute>[1]["onResult"]>[0]>((resolve, reject) => {
    startL3ImageCompute(
      l3PresetScenes.airyPupil,
      {
        onProgress: () => undefined,
        onResult: resolve,
        onError: reject,
        onCancelled: () => reject(new Error("unexpected cancellation"))
      },
      useWorker
    );
  });
}
