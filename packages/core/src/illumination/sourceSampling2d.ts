import { mulberry32 } from "../math/rng";
import type { IlluminationModel2D, SourceAngleSample2D, SourceAngleSet2D } from "../scene/schema";
import { clampNAForAngleSampling, effectiveSourceNA } from "./sourceModels2d";

const goldenAngleRad = Math.PI * (3 - Math.sqrt(5));

export function sampleSourceAngles2D(model: IlluminationModel2D): SourceAngleSet2D {
  const samples =
    model.kind === "singleCoherentAngle"
      ? [{ angleURad: model.angleURad, angleVRad: model.angleVRad, weight: 1 }]
      : model.kind === "uniformDisk"
        ? sampleUniformDisk(model)
        : sampleAnnulus(model);

  return {
    id: `${model.id}-source-angles`,
    label: `${model.label} source-angle samples`,
    illuminationModelId: model.id,
    samples: normalizeSourceAngleWeights(samples)
  };
}

export function normalizeSourceAngleWeights(samples: SourceAngleSample2D[]): SourceAngleSample2D[] {
  const weightSum = samples.reduce((sum, sample) => sum + sample.weight, 0);
  if (samples.length === 0 || weightSum <= 0) {
    throw new Error("source-angle sampling requires at least one positive-weight angle");
  }
  return samples.map((sample) => ({ ...sample, weight: sample.weight / weightSum }));
}

export function sourceAngleWeightSum(samples: SourceAngleSample2D[]): number {
  return samples.reduce((sum, sample) => sum + sample.weight, 0);
}

function sampleUniformDisk(model: Extract<IlluminationModel2D, { kind: "uniformDisk" }>): SourceAngleSample2D[] {
  const count = model.pattern === "center" ? 1 : model.sampleCount;
  const maxAngleRad = Math.asin(clampNAForAngleSampling(effectiveSourceNA(model)));
  if (count === 1 || maxAngleRad === 0) {
    return [{ angleURad: 0, angleVRad: 0, weight: 1 }];
  }
  if (model.pattern === "deterministicJitter") {
    return jitteredDiskSamples(count, maxAngleRad, model.seed);
  }
  return spiralDiskSamples(count, 0, maxAngleRad);
}

function sampleAnnulus(model: Extract<IlluminationModel2D, { kind: "annulus" }>): SourceAngleSample2D[] {
  const innerAngleRad = Math.asin(clampNAForAngleSampling(model.innerNA));
  const outerAngleRad = Math.asin(clampNAForAngleSampling(model.outerNA));
  if (outerAngleRad <= innerAngleRad) {
    throw new Error(`illumination model ${model.id} annulus outerNA must exceed innerNA`);
  }
  return spiralDiskSamples(model.sampleCount, innerAngleRad, outerAngleRad);
}

function spiralDiskSamples(count: number, innerRadiusRad: number, outerRadiusRad: number): SourceAngleSample2D[] {
  const samples: SourceAngleSample2D[] = [];
  if (innerRadiusRad === 0) {
    samples.push({ angleURad: 0, angleVRad: 0, weight: 1 });
  }
  const remaining = count - samples.length;
  for (let index = 0; index < remaining; index += 1) {
    const fraction = remaining === 1 ? 1 : (index + 0.5) / remaining;
    const radiusRad = Math.sqrt(innerRadiusRad * innerRadiusRad + (outerRadiusRad * outerRadiusRad - innerRadiusRad * innerRadiusRad) * fraction);
    const thetaRad = (index + 1) * goldenAngleRad;
    samples.push({
      angleURad: radiusRad * Math.cos(thetaRad),
      angleVRad: radiusRad * Math.sin(thetaRad),
      weight: 1
    });
  }
  return samples;
}

function jitteredDiskSamples(count: number, maxAngleRad: number, seed: number): SourceAngleSample2D[] {
  const random = mulberry32(seed);
  const samples: SourceAngleSample2D[] = [];
  for (let index = 0; index < count; index += 1) {
    const radiusRad = maxAngleRad * Math.sqrt(random());
    const thetaRad = random() * Math.PI * 2;
    samples.push({
      angleURad: radiusRad * Math.cos(thetaRad),
      angleVRad: radiusRad * Math.sin(thetaRad),
      weight: 1
    });
  }
  return samples;
}
