import { describe, expect, it } from "vitest";
import { fieldImageToCsv, fieldImageToJson } from "../export/fieldImageExport";
import { l3AiryReference, l3PresetScenes } from "../validation/fixturesL3";
import { centralRowMinimumNear, peakPixel2D, pixelCoordinateM } from "../wave/imageMetrics2d";
import { scalarCoherentL3_2dSolver } from "./scalarCoherentL3_2d";

describe("scalar coherent L3 2D solver", () => {
  it("produces a labeled 2D image-plane intensity output", () => {
    const result = scalarCoherentL3_2dSolver.run(l3PresetScenes.airyPupil);
    const field = result.fieldImageOutputs?.[0];
    if (!field) throw new Error("missing L3 field image output");

    expect(result.solverId).toBe("scalar.coherent.l3.2d");
    expect(field.type).toBe("fieldImage2D");
    expect(field.width).toBe(256);
    expect(field.height).toBe(256);
    expect(field.provenance.kind).toBe("simulated");
    expect(field.provenance.kind === "simulated" ? field.provenance.model : "").toBe("scalar-wave-2d-angular-spectrum");
    expect(result.assumptions.join(" ")).toContain("Not full microscope physics");
  });

  it("forms a centered Airy-like scalar focal spot through a circular pupil", () => {
    const result = scalarCoherentL3_2dSolver.run(l3PresetScenes.airyPupil);
    const field = result.fieldImageOutputs?.[0];
    if (!field) throw new Error("missing L3 field image output");

    const peak = peakPixel2D(field.intensity, field.width);
    const peakCoordinate = pixelCoordinateM(field, peak.uIndex, peak.vIndex);
    const minimum = centralRowMinimumNear(field, l3AiryReference.firstMinimumRadiusM);
    const pixelM = (field.uMaxM - field.uMinM) / field.width;

    expect(Math.abs(peakCoordinate.uM)).toBeLessThanOrEqual(pixelM);
    expect(Math.abs(peakCoordinate.vM)).toBeLessThanOrEqual(pixelM);
    expect(Math.abs(minimum.radiusM - l3AiryReference.firstMinimumRadiusM)).toBeLessThanOrEqual(pixelM * 3);
    expect(minimum.normalized).toBeLessThan(0.25);
  });

  it("tracks lens, pupil, propagation, and detector energy stages", () => {
    const result = scalarCoherentL3_2dSolver.run(l3PresetScenes.airyPupil);
    const energy = result.energyLedger;
    if (!energy) throw new Error("missing energy ledger");

    expect(energy.provenance.kind === "simulated" ? energy.provenance.solverId : "").toBe("scalar.coherent.l3.2d");
    expect(energy.stages?.map((stage) => stage.kind)).toEqual(["source", "lens", "pupil", "propagation", "detector"]);
    expect(energy.afterMaskEnergy).toBeLessThan(energy.inputEnergy);
    expect(Math.abs(energy.relativeOutputDrift)).toBeLessThan(1e-9);
  });

  it("is deterministic for identical L3 scenes", () => {
    const a = scalarCoherentL3_2dSolver.run(l3PresetScenes.airyPupil);
    const b = scalarCoherentL3_2dSolver.run(l3PresetScenes.airyPupil);

    expect(a.resultHash).toBe(b.resultHash);
  });

  it("emits 2D sampling warnings for deliberately bad fixtures", () => {
    const warnings = scalarCoherentL3_2dSolver.validateScene(l3PresetScenes.badSampling);

    expect(warnings.some((warning) => warning.code === "fieldGrid2D.lowSampleCount")).toBe(true);
    expect(warnings.some((warning) => warning.code === "pupil2D.undersampled")).toBe(true);
  });

  it("exports L3 image outputs with units, dimensions, hashes, and provenance", () => {
    const result = scalarCoherentL3_2dSolver.run(l3PresetScenes.airyPupil);
    const field = result.fieldImageOutputs?.[0];
    if (!field) throw new Error("missing L3 field image output");

    const csv = fieldImageToCsv(result, field);
    const json = fieldImageToJson(result, field);

    expect(csv).toContain("# solverId,scalar.coherent.l3.2d");
    expect(csv).toContain("# width,256");
    expect(csv).toContain("# uUnit,m");
    expect(csv).toContain("# provenance,L3:scalar-wave-2d-angular-spectrum");
    expect(csv).toContain("uM,vM,intensity,phaseRad,real,imag");
    expect(json).toContain('"type": "fieldImage2D"');
    expect(json).toContain('"resultHash"');
  });
});
