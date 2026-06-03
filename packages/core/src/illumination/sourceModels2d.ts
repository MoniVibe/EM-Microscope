import type { IlluminationModel2D } from "../scene/schema";

export function effectiveSourceNA(model: IlluminationModel2D): number {
  if (model.kind === "singleCoherentAngle") {
    return Math.hypot(Math.sin(model.angleURad), Math.sin(model.angleVRad));
  }
  if (model.kind === "uniformDisk") {
    return Math.max(0, model.condenserNA === undefined ? model.sourceNA : Math.min(model.sourceNA, model.condenserNA));
  }
  return Math.max(0, model.outerNA);
}

export function illuminationModelSummary(model: IlluminationModel2D): string {
  if (model.kind === "singleCoherentAngle") {
    return `single angle u=${model.angleURad.toExponential(2)} rad, v=${model.angleVRad.toExponential(2)} rad`;
  }
  if (model.kind === "uniformDisk") {
    return `uniform source disk NA ${effectiveSourceNA(model).toFixed(4)}, ${model.sampleCount} deterministic angles`;
  }
  return `annular source NA ${model.innerNA.toFixed(4)}-${model.outerNA.toFixed(4)}, ${model.sampleCount} deterministic angles`;
}

export function clampNAForAngleSampling(na: number): number {
  return Math.min(Math.max(na, 0), 0.999999);
}
