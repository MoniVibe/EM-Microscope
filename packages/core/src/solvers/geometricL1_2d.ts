import { buildDetectorHistogram, hitDetector, type DetectorHit } from "../optics/detectors";
import { applyAperture, applyThinLens } from "../optics/elements";
import type { Ray, RayPath } from "../optics/ray";
import { generateSourceRays } from "../optics/sources";
import { lensmakerThickLensInAir, surfacesForThickLens2D } from "../optics/assemblies/thickLens2d";
import { refractiveIndexById } from "../optics/media";
import { reflectDirection } from "../optics/reflection";
import { refractDirection } from "../optics/snell";
import {
  intersectSurface2D,
  surfaceVertexXM,
  type Ray2D,
  type Surface2D
} from "../optics/surfaces2d";
import { add, normalize, scale, type Vec2 } from "../math/vec2";
import { computeSpotReadouts } from "../readouts/spotSize";
import { computeThinLensReadouts } from "../readouts/thinLens";
import { hashScene } from "../scene/hashScene";
import {
  parseScene,
  type ApertureElement,
  type DetectorElement,
  type OpticalElement,
  type Scene,
  type SurfaceElement2D,
  type ThickLens2DElement,
  type ThinLensElement
} from "../scene/schema";
import type { AberrationReadout, Solver, SolverRequest, SolverResult, SolverWarning } from "./Solver";

type L1Interaction =
  | { kind: "surface"; xM: number; item: Surface2D; ownerElementId?: string }
  | { kind: "thinLens"; xM: number; item: ThinLensElement }
  | { kind: "aperture"; xM: number; item: ApertureElement }
  | { kind: "detector"; xM: number; item: DetectorElement };

type TraceCounters = {
  tirCount: number;
  reflectedCount: number;
  clippedCount: number;
};

const assumptions = [
  "L1 2D surface ray optics",
  "Vector Snell refraction at explicit 2D surfaces",
  "Thick lenses are two spherical surfaces plus finite aperture",
  "Diffraction is not propagated"
];

export const geometricL1_2dSolver: Solver = {
  id: "geometric.l1.2d",
  label: "L1 2D Surface Ray Optics",
  level: "L1",
  capabilities: ["surfaceSnell2D", "thickLens2D", "totalInternalReflection", "detectorHistogram", "lensmakerReadout"],
  validateScene(scene) {
    const warnings: SolverWarning[] = [];
    for (const element of scene.elements) {
      if (element.xM < scene.bench.xMinM || element.xM > scene.bench.xMaxM) {
        warnings.push({ code: "element.outOfBench", message: `${element.label} is outside the bench`, elementId: element.id });
      }
      if (element.type === "thickLens2D") {
        if (Math.abs(element.radius1M) < element.apertureDiameterM / 2 || Math.abs(element.radius2M) < element.apertureDiameterM / 2) {
          warnings.push({
            code: "lens.apertureTooLarge",
            message: `${element.label} aperture exceeds one of the spherical radii`,
            elementId: element.id
          });
        }
      }
    }
    return warnings;
  },
  run(sceneInput, request = {}) {
    const scene = parseScene(sceneInput);
    const solverRequest: SolverRequest = {
      solverId: "geometric.l1.2d",
      outputs: ["rays", "detectorHits", "detectorHistogram", "readouts"],
      ...request
    };
    if (solverRequest.solverId !== "geometric.l1.2d") {
      throw new Error(`geometricL1_2dSolver cannot run request for ${solverRequest.solverId}`);
    }

    const warnings = this.validateScene(scene);
    const interactions = orderedL1Interactions(scene);
    const rayPaths: RayPath[] = [];
    const detectorHits: DetectorHit[] = [];
    const counters: TraceCounters = { tirCount: 0, reflectedCount: 0, clippedCount: 0 };
    const initialRays = generateSourceRays(scene);
    const sourcePowerW = initialRays.reduce((sum, ray) => sum + ray.powerW, 0);

    for (const initialRay of initialRays) {
      const { path, hits } = traceRayL1(scene, initialRay, interactions, counters);
      rayPaths.push(path);
      detectorHits.push(...hits);
    }

    const detectorHistograms = scene.detectors.map((detector) => buildDetectorHistogram(detector, detectorHits));
    const detectorPowerW = detectorHistograms.reduce((sum, histogram) => sum + histogram.totalPowerW, 0);
    const survivingPowerW = rayPaths.filter((ray) => ray.alive).reduce((sum, ray) => sum + ray.powerW, 0);
    const clippedPowerW = sourcePowerW - survivingPowerW;

    const result: SolverResult = {
      solverId: "geometric.l1.2d",
      sceneHash: hashScene(scene),
      seed: scene.seed,
      solverVersion: "0.2.0",
      assumptions,
      warnings,
      rays: rayPaths,
      detectorHits,
      detectorHistograms,
      readouts: {
        thinLens: computeThinLensReadouts(scene),
        spot: computeSpotReadouts(detectorHistograms),
        lensmaker: scene.elements
          .filter((element): element is ThickLens2DElement => element.type === "thickLens2D")
          .map(lensmakerThickLensInAir),
        aberration: computeAberrationReadouts(scene, rayPaths, counters),
        energy: {
          sourcePowerW,
          survivingPowerW,
          clippedPowerW,
          detectorPowerW,
          provenance: "L1 ray power accounting"
        }
      }
    };

    return result;
  }
};

function orderedL1Interactions(scene: Scene): L1Interaction[] {
  const interactions: L1Interaction[] = [];

  for (const element of scene.elements) {
    if (element.type === "thinLens") {
      interactions.push({ kind: "thinLens", xM: element.xM, item: element });
    } else if (element.type === "aperture") {
      interactions.push({ kind: "aperture", xM: element.xM, item: element });
    } else if (element.type === "thickLens2D") {
      const [front, back] = surfacesForThickLens2D(element, surroundingMediumId(scene));
      interactions.push({ kind: "surface", xM: surfaceVertexXM(front), item: front, ownerElementId: element.id });
      interactions.push({ kind: "surface", xM: surfaceVertexXM(back), item: back, ownerElementId: element.id });
    }
  }

  for (const surfaceElement of scene.surfaceElements2D) {
    const surface = surfaceElementToRuntime(surfaceElement);
    interactions.push({ kind: "surface", xM: surfaceVertexXM(surface), item: surface, ownerElementId: surface.id });
  }

  for (const detector of scene.detectors) {
    interactions.push({ kind: "detector", xM: detector.xM, item: detector });
  }

  return interactions.sort((a, b) => {
    if (a.xM !== b.xM) return a.xM - b.xM;
    if (a.kind === b.kind) return a.item.id.localeCompare(b.item.id);
    if (a.kind === "detector") return 1;
    if (b.kind === "detector") return -1;
    return 0;
  });
}

function surfaceElementToRuntime(surface: SurfaceElement2D): Surface2D {
  if (surface.type === "planeSurface2D") {
    return {
      id: surface.id,
      type: "planeSurface2D",
      label: surface.label,
      vertex: { x: surface.vertex.xM, y: surface.vertex.yM },
      normal: surface.normal,
      apertureRadiusM: surface.apertureRadiusM,
      mediumBeforeId: surface.mediumBeforeId,
      mediumAfterId: surface.mediumAfterId,
      interaction: surface.interaction
    };
  }

  return {
    id: surface.id,
    type: "circularSurface2D",
    label: surface.label,
    vertex: { x: surface.vertex.xM, y: surface.vertex.yM },
    center: { x: surface.vertex.xM + surface.radiusOfCurvatureM, y: surface.vertex.yM },
    radiusM: Math.abs(surface.radiusOfCurvatureM),
    signedRadiusM: surface.radiusOfCurvatureM,
    apertureRadiusM: surface.apertureRadiusM,
    mediumBeforeId: surface.mediumBeforeId,
    mediumAfterId: surface.mediumAfterId,
    interaction: surface.interaction
  };
}

function traceRayL1(
  scene: Scene,
  initialRay: Ray,
  interactions: L1Interaction[],
  counters: TraceCounters
): { path: RayPath; hits: DetectorHit[] } {
  let ray: Ray2D = {
    id: initialRay.id,
    sourceId: initialRay.sourceId,
    origin: { x: initialRay.x, y: initialRay.y },
    dir: normalize({ x: 1, y: initialRay.slope }),
    wavelengthM: initialRay.wavelengthM,
    powerW: initialRay.powerW,
    mediumId: surroundingMediumId(scene),
    alive: true
  };
  const segments: RayPath["segments"] = [];
  const hits: DetectorHit[] = [];

  for (const interaction of interactions) {
    if (!ray.alive) break;

    if (interaction.kind === "detector") {
      const hitPoint = intersectVerticalDetector(ray, interaction.item.xM);
      if (!hitPoint) continue;
      segments.push({ x0: ray.origin.x, y0: ray.origin.y, x1: hitPoint.x, y1: hitPoint.y });
      const hit = hitDetector(rayToLegacy(ray, hitPoint), interaction.item);
      if (hit) hits.push(hit);
      ray = { ...ray, origin: hitPoint };
      continue;
    }

    if (interaction.kind === "thinLens" || interaction.kind === "aperture") {
      const planeHit = intersectVerticalPlane(ray, interaction.xM);
      if (!planeHit) continue;
      segments.push({ x0: ray.origin.x, y0: ray.origin.y, x1: planeHit.x, y1: planeHit.y });
      const legacy = rayToLegacy(ray, planeHit);
      if (interaction.kind === "aperture") {
        const next = applyAperture(legacy, interaction.item);
        if (!next.alive) {
          counters.clippedCount += 1;
          ray = { ...ray, origin: planeHit, alive: false, clippedBy: interaction.item.id };
          break;
        }
        ray = { ...ray, origin: planeHit };
      } else {
        const next = applyThinLens(legacy, interaction.item);
        if (!next.alive) {
          counters.clippedCount += 1;
          ray = { ...ray, origin: planeHit, alive: false, clippedBy: interaction.item.id };
          break;
        }
        ray = { ...ray, origin: planeHit, dir: normalize({ x: 1, y: next.slope }) };
      }
      continue;
    }

    const surfaceHit = intersectSurface2D(ray, interaction.item);
    if (!surfaceHit) {
      counters.clippedCount += 1;
      ray = { ...ray, alive: false, clippedBy: interaction.item.id };
      break;
    }
    segments.push({ x0: ray.origin.x, y0: ray.origin.y, x1: surfaceHit.point.x, y1: surfaceHit.point.y });

    if (!surfaceHit.aperturePassed) {
      counters.clippedCount += 1;
      ray = { ...ray, origin: surfaceHit.point, alive: false, clippedBy: interaction.item.id };
      break;
    }

    if (interaction.item.interaction === "reflect") {
      counters.reflectedCount += 1;
      const reflected = reflectDirection(ray.dir, surfaceHit.normal);
      ray = advanceFromHit(ray, surfaceHit.point, reflected, ray.mediumId);
      continue;
    }

    const n1 = refractiveIndexById(scene, interaction.item.mediumBeforeId, ray.wavelengthM);
    const n2 = refractiveIndexById(scene, interaction.item.mediumAfterId, ray.wavelengthM);
    const refracted = refractDirection(ray.dir, surfaceHit.normal, n1, n2);
    if (refracted.kind === "tir") {
      counters.tirCount += 1;
      counters.reflectedCount += 1;
      ray = advanceFromHit(ray, surfaceHit.point, refracted.direction, ray.mediumId);
    } else {
      ray = advanceFromHit(ray, surfaceHit.point, refracted.direction, interaction.item.mediumAfterId);
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
      finalX: ray.origin.x,
      finalY: ray.origin.y,
      finalSlope: ray.dir.x === 0 ? Number.POSITIVE_INFINITY : ray.dir.y / ray.dir.x,
      segments
    }
  };
}

function surroundingMediumId(scene: Scene): string {
  return scene.mediaCatalog.find((medium) => medium.id === "air")?.id ?? scene.mediaCatalog[0]?.id ?? "air";
}

function intersectVerticalPlane(ray: Ray2D, xM: number): Vec2 | null {
  if (Math.abs(ray.dir.x) < 1e-14) return null;
  const t = (xM - ray.origin.x) / ray.dir.x;
  if (t <= 1e-10) return null;
  return add(ray.origin, scale(ray.dir, t));
}

function intersectVerticalDetector(ray: Ray2D, xM: number): Vec2 | null {
  return intersectVerticalPlane(ray, xM);
}

function rayToLegacy(ray: Ray2D, point: Vec2): Ray {
  return {
    id: ray.id,
    sourceId: ray.sourceId,
    x: point.x,
    y: point.y,
    slope: ray.dir.x === 0 ? Number.POSITIVE_INFINITY : ray.dir.y / ray.dir.x,
    wavelengthM: ray.wavelengthM,
    powerW: ray.powerW,
    alive: ray.alive,
    clippedBy: ray.clippedBy
  };
}

function advanceFromHit(ray: Ray2D, hitPoint: Vec2, dir: Vec2, mediumId: string): Ray2D {
  const normalized = normalize(dir);
  return {
    ...ray,
    origin: add(hitPoint, scale(normalized, 1e-9)),
    dir: normalized,
    mediumId
  };
}

function computeAberrationReadouts(scene: Scene, rayPaths: RayPath[], counters: TraceCounters): AberrationReadout[] {
  const thickLenses = scene.elements.filter((element): element is ThickLens2DElement => element.type === "thickLens2D");
  if (thickLenses.length === 0) return [];

  const usable = rayPaths
    .filter((path) => path.alive && Number.isFinite(path.finalSlope) && Math.abs(path.finalSlope) > 1e-12)
    .map((path) => {
      const firstSegment = path.segments[0];
      const initialY = firstSegment?.y0 ?? path.finalY;
      const focusXM = path.finalX - path.finalY / path.finalSlope;
      return { initialY, focusXM };
    });

  const maxAbsY = Math.max(...usable.map((item) => Math.abs(item.initialY)), 0);
  const paraxial = usable.filter((item) => Math.abs(item.initialY) <= maxAbsY * 0.35);
  const marginal = usable.filter((item) => Math.abs(item.initialY) >= maxAbsY * 0.75);
  const paraxialFocusXM = average(paraxial.map((item) => item.focusXM));
  const marginalFocusXM = average(marginal.map((item) => item.focusXM));

  return thickLenses.map((lens) => ({
    elementId: lens.id,
    paraxialFocusXM,
    marginalFocusXM,
    longitudinalSphericalAberrationM:
      paraxialFocusXM === null || marginalFocusXM === null ? null : marginalFocusXM - paraxialFocusXM,
    tirCount: counters.tirCount,
    reflectedCount: counters.reflectedCount,
    clippedCount: counters.clippedCount,
    provenance: "simulated.geometric.l1.2d"
  }));
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
