import { describe, expect, it } from "vitest";
import { createEngineeringReport, engineeringReportToHtml, engineeringReportToJson, engineeringReportToMarkdown } from "../report/engineeringReport";
import { renderCameraImage2D } from "../sensor/pixelSampling2d";
import { computeSamplingMetrics2D } from "../sensor/samplingMetrics";
import { computeSnrMetrics2D } from "../sensor/snrMetrics";
import { scalarCoherentL3_2dSolver } from "../solvers/scalarCoherentL3_2d";
import { l32Camera, l32Measurement, l32Scene, l32Sweep } from "../validation/fixturesL32";
import { computeMtf2D } from "../wave/otfMtf2d";
import { computePsfMetrics2D } from "../wave/psfMetrics2d";
import { runSweepDefinition2D, sweepResultToCsv } from "./sweepRunner";

describe("L3.2 sweep and engineering report", () => {
  it("runs deterministic post-processing sweeps", () => {
    const field = l3Field();
    const a = runSweepDefinition2D({ field, camera: l32Camera, measurement: l32Measurement, definition: l32Sweep });
    const b = runSweepDefinition2D({ field, camera: l32Camera, measurement: l32Measurement, definition: l32Sweep });

    expect(a.rowCount).toBe(12);
    expect(a).toEqual(b);
    expect(sweepResultToCsv(a)).toContain("snrMean");
  });

  it("exports self-contained engineering reports with provenance and warnings", () => {
    const result = scalarCoherentL3_2dSolver.run(l32Scene);
    const field = result.fieldImageOutputs[0];
    if (!field) throw new Error("missing L3 field");
    const sensor = renderCameraImage2D(field, l32Camera);
    const mtf = computeMtf2D(field);
    const sampling = computeSamplingMetrics2D({ pixelPitchM: l32Camera.pixelPitchM, measurement: l32Measurement, mtf });
    const report = createEngineeringReport({
      scene: l32Scene,
      result,
      camera: l32Camera,
      measurement: l32Measurement,
      sensor,
      psf: computePsfMetrics2D(field),
      mtf,
      snr: computeSnrMetrics2D(l32Camera, sensor),
      sampling,
      sweep: runSweepDefinition2D({ field, camera: l32Camera, measurement: l32Measurement, definition: l32Sweep })
    });

    expect(engineeringReportToJson(report)).toContain("solverVersion");
    expect(engineeringReportToMarkdown(report)).toContain("L3.2 Instrument Performance Report");
    expect(engineeringReportToHtml(report)).toContain("<html");
    expect(report.limitations.join(" ")).toContain("coherent scalar");
  });
});

function l3Field() {
  const result = scalarCoherentL3_2dSolver.run(l32Scene);
  const field = result.fieldImageOutputs[0];
  if (!field) throw new Error("missing L3 field");
  return field;
}
