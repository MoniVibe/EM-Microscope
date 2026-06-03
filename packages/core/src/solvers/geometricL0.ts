import { buildDetectorHistogram, hitDetector } from "../optics/detectors";
import type { DetectorHit } from "../optics/detectors";
import { applyAperture, applyThinLens, propagateRayToX } from "../optics/elements";
import type { Ray, RayPath } from "../optics/ray";
import { generateSourceRays } from "../optics/sources";
import { computeNAReadouts } from "../readouts/numericalAperture";
import { computeSpotReadouts } from "../readouts/spotSize";
import { computeThinLensReadouts } from "../readouts/thinLens";
import { hashScene, stableStringify, fnv1a64 } from "../scene/hashScene";
import { parseSceneV1, type DetectorElement, type OpticalElement, type SceneV1 } from "../scene/schema";
import type { Solver, SolverRequest, SolverResult, SolverWarning } from "./Solver";

type Interaction =
  | { kind: "element"; xM: number; item: OpticalElement }
  | { kind: "detector"; xM: number; item: DetectorElement };

const assumptions = [
  "L0 Geometric Ray Optics",
  "Thin lens paraxial approximation",
  "No diffraction field propagation",
  "Wavelength is carried for readouts but does not change L0 ray paths"
];

export const geometricL0Solver: Solver = {
  id: "geometric.l0",
  label: "L0 Geometric Ray Optics",
  level: "L0",
  capabilities: ["rays", "thinLens", "apertureClipping", "detectorHistogram", "analyticNA", "analyticAiryEstimate"],
  validateScene(scene) {
    const warnings: SolverWarning[] = [];
    for (const element of scene.elements) {
      if (element.xM < scene.bench.xMinM || element.xM > scene.bench.xMaxM) {
        warnings.push({ code: "element.outOfBench", message: `${element.label} is outside the bench`, elementId: element.id });
      }
    }
    for (const detector of scene.detectors) {
      if (detector.xM < scene.bench.xMinM || detector.xM > scene.bench.xMaxM) {
        warnings.push({ code: "detector.outOfBench", message: `${detector.label} is outside the bench`, elementId: detector.id });
      }
    }
    return warnings;
  },
  run(sceneInput, request = {}) {
    const scene = parseSceneV1(sceneInput);
    const solverRequest: SolverRequest = {
      solverId: "geometric.l0",
      outputs: ["rays", "detectorHits", "detectorHistogram", "readouts"],
      ...request
    };
    if (solverRequest.solverId !== "geometric.l0") {
      throw new Error(`geometricL0Solver cannot run request for ${solverRequest.solverId}`);
    }

    const warnings = this.validateScene(scene);
    const interactions = orderedInteractions(scene);
    const rayPaths: RayPath[] = [];
    const detectorHits: DetectorHit[] = [];
    const rays = generateSourceRays(scene);
    const sourcePowerW = rays.reduce((sum, ray) => sum + ray.powerW, 0);

    for (const initialRay of rays) {
      const { path, hits } = traceRay(initialRay, interactions);
      rayPaths.push(path);
      detectorHits.push(...hits);
    }

    const detectorHistograms = scene.detectors.map((detector) => buildDetectorHistogram(detector, detectorHits));
    const detectorPowerW = detectorHistograms.reduce((sum, histogram) => sum + histogram.totalPowerW, 0);
    const survivingPowerW = rayPaths.filter((ray) => ray.alive).reduce((sum, ray) => sum + ray.powerW, 0);
    const clippedPowerW = sourcePowerW - survivingPowerW;

    const result: SolverResult = {
      solverId: "geometric.l0",
      sceneHash: hashScene(scene),
      seed: scene.seed,
      solverVersion: "0.1.0",
      assumptions,
      warnings,
      rays: rayPaths,
      detectorHits,
      detectorHistograms,
      readouts: {
        thinLens: computeThinLensReadouts(scene),
        numericalAperture: computeNAReadouts(scene),
        spot: computeSpotReadouts(detectorHistograms),
        energy: {
          sourcePowerW,
          survivingPowerW,
          clippedPowerW,
          detectorPowerW,
          provenance: "L0 ray power accounting"
        }
      }
    };

    return result;
  }
};

function orderedInteractions(scene: SceneV1): Interaction[] {
  return [
    ...scene.elements.map((item) => ({ kind: "element" as const, xM: item.xM, item })),
    ...scene.detectors.map((item) => ({ kind: "detector" as const, xM: item.xM, item }))
  ].sort((a, b) => {
    if (a.xM !== b.xM) return a.xM - b.xM;
    if (a.kind === b.kind) return a.item.id.localeCompare(b.item.id);
    return a.kind === "element" ? -1 : 1;
  });
}

function traceRay(initialRay: Ray, interactions: Interaction[]): { path: RayPath; hits: DetectorHit[] } {
  let ray = initialRay;
  const segments: RayPath["segments"] = [];
  const hits: DetectorHit[] = [];

  for (const interaction of interactions) {
    if (!ray.alive) break;
    if (interaction.xM < ray.x - 1e-15) continue;

    const propagated = propagateRayToX(ray, interaction.xM);
    segments.push({ x0: ray.x, y0: ray.y, x1: propagated.x, y1: propagated.y });
    ray = propagated;

    if (interaction.kind === "detector") {
      const hit = hitDetector(ray, interaction.item);
      if (hit) hits.push(hit);
      continue;
    }

    if (interaction.item.type === "aperture") {
      ray = applyAperture(ray, interaction.item);
    } else if (interaction.item.type === "thinLens") {
      ray = applyThinLens(ray, interaction.item);
    }
  }

  return {
    hits,
    path: {
      id: ray.id,
      sourceId: ray.sourceId,
      wavelengthM: ray.wavelengthM,
      powerW: ray.powerW,
      alive: ray.alive,
      clippedBy: ray.clippedBy,
      finalX: ray.x,
      finalY: ray.y,
      finalSlope: ray.slope,
      segments
    }
  };
}

export function resultHash(result: SolverResult): string {
  return fnv1a64(
    stableStringify({
      solverId: result.solverId,
      sceneHash: result.sceneHash,
      seed: result.seed,
      rays: result.rays,
      hits: result.detectorHits,
      histograms: result.detectorHistograms,
      readouts: result.readouts
    })
  );
}
