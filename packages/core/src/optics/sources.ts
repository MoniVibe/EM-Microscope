import { seededJitterCentered } from "../math/rng";
import type { SceneV1, SourceElement } from "../scene/schema";
import type { Ray } from "./ray";

export function generateSourceRays(scene: SceneV1): Ray[] {
  const rays: Ray[] = [];
  for (const source of scene.sources) {
    rays.push(...generateRaysForSource(source, scene.seed, scene.solverSettings.sampling));
  }
  return rays;
}

export function generateRaysForSource(
  source: SourceElement,
  seed: number,
  sampling: SceneV1["solverSettings"]["sampling"]
): Ray[] {
  if (source.type === "pointSource") {
    return generatePointSourceRays(source, seed, sampling);
  }
  return generateCollimatedSourceRays(source, seed, sampling);
}

function fraction(index: number, count: number): number {
  if (count === 1) return 0.5;
  return index / (count - 1);
}

function generatePointSourceRays(
  source: Extract<SourceElement, { type: "pointSource" }>,
  seed: number,
  sampling: SceneV1["solverSettings"]["sampling"]
): Ray[] {
  const count = source.rayCount;
  const powerPerRay = source.powerW / count;
  return Array.from({ length: count }, (_, index) => {
    const centered = fraction(index, count) - 0.5;
    const jitter =
      sampling === "seededJitter" && count > 1
        ? seededJitterCentered(seed, index, source.angularSpreadRad / count)
        : 0;
    const angle = centered * source.angularSpreadRad + jitter;
    return {
      id: `${source.id}:ray:${index}`,
      sourceId: source.id,
      x: source.xM,
      y: source.yM,
      slope: Math.tan(angle),
      wavelengthM: source.wavelengthM,
      powerW: powerPerRay,
      alive: true
    };
  });
}

function generateCollimatedSourceRays(
  source: Extract<SourceElement, { type: "collimatedSource" }>,
  seed: number,
  sampling: SceneV1["solverSettings"]["sampling"]
): Ray[] {
  const count = source.rayCount;
  const powerPerRay = source.powerW / count;
  const spacing = count > 1 ? source.beamHeightM / (count - 1) : 0;
  return Array.from({ length: count }, (_, index) => {
    const baseY = source.yCenterM + (fraction(index, count) - 0.5) * source.beamHeightM;
    const jitter =
      sampling === "seededJitter" && count > 1
        ? seededJitterCentered(seed, index, spacing)
        : 0;
    return {
      id: `${source.id}:ray:${index}`,
      sourceId: source.id,
      x: source.xM,
      y: baseY + jitter,
      slope: Math.tan(source.angleRad),
      wavelengthM: source.wavelengthM,
      powerW: powerPerRay,
      alive: true
    };
  });
}
