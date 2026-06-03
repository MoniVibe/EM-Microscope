import { isPowerOfTwo } from "../math/fft";
import { makeL3ResultCacheKey } from "../cache/resultCacheKey";
import { refractiveIndexById } from "../optics/media";
import { l3Scalar2DProvenance, makeWaveEnergyLedger } from "../readouts/waveEnergy";
import { fnv1a64, hashScene, stableStringify } from "../scene/hashScene";
import {
  parseScene,
  type CoherentMicroscopePipeline2D,
  type DetectorPlane2D,
  type FieldGrid2D,
  type FieldPlane2D,
  type PupilPlane2D,
  type SamplePlane2D,
  type Scene,
  type ThinLensPhasePlane2D
} from "../scene/schema";
import { propagateAngularSpectrum2D } from "../wave/angularSpectrum2d";
import { type ComplexGrid2D } from "../wave/complex2d";
import { createFieldFromPlane2D, fieldEnergy2D, intensityAndPhase2D } from "../wave/field2d";
import { applyPupilPlane2D } from "../wave/pupil2d";
import { applySamplePlane2D, type PlaneApplication2D } from "../wave/sampleMasks2d";
import { edgeEnergyWarning2D, gridSamplingWarnings2D, pupilSamplingWarnings2D, sampleSamplingWarnings2D } from "../wave/sampling2d";
import { applyThinLensPhase2D } from "../wave/thinLensPhase2d";
import type { FieldOutput2D, Solver, SolverRequest, SolverResult, SolverWarning, WaveEnergyStage } from "./Solver";

const assumptions = [
  "L3 coherent 2D scalar image-plane intensity approximation",
  "Monochromatic coherent scalar field",
  "2D angular-spectrum propagation on a fixed transverse grid",
  "Paraxial thin-lens phase model",
  "Circular or annular scalar pupil mask",
  "Homogeneous medium between source, sample, lens, pupil, and detector planes",
  "Not full microscope physics, partial coherence, vector optics, fluorescence, true 3D, or EM"
];

type L3Interaction2D =
  | { kind: "sample"; xM: number; item: SamplePlane2D }
  | { kind: "lens"; xM: number; item: ThinLensPhasePlane2D }
  | { kind: "pupil"; xM: number; item: PupilPlane2D };

export const scalarCoherentL3_2dSolver: Solver = {
  id: "scalar.coherent.l3.2d",
  label: "L3 Coherent 2D Scalar Microscope",
  level: "L3",
  capabilities: ["field2D", "angularSpectrumPropagation2D", "thinLensPhase2D", "pupil2D", "energyLedger", "samplingWarnings"],
  validateScene(scene) {
    return validateL3Scene(scene);
  },
  run(sceneInput, request = {}) {
    const startedMs = Date.now();
    const scene = parseScene(sceneInput);
    const solverRequest: SolverRequest = {
      solverId: "scalar.coherent.l3.2d",
      outputs: ["field2D", "readouts"],
      ...request
    };
    if (solverRequest.solverId !== "scalar.coherent.l3.2d") {
      throw new Error(`scalarCoherentL3_2dSolver cannot run request for ${solverRequest.solverId}`);
    }

    const pipeline = firstPipeline(scene);
    const sourcePlane = planeById(scene.fieldPlanes2D, pipeline.sourcePlaneId, "2D source field plane");
    const detectorPlane = planeById(scene.detectorPlanes2D, pipeline.detectorPlaneId, "2D detector plane");
    const grid = gridById(scene, sourcePlane.gridId);
    if (detectorPlane.gridId !== grid.id) {
      throw new Error("L3 requires source and detector planes to use the same 2D field grid");
    }
    if (!isPowerOfTwo(grid.width) || !isPowerOfTwo(grid.height)) {
      throw new Error("L3 2D angular-spectrum solver requires power-of-two grid dimensions");
    }
    if (detectorPlane.xM < sourcePlane.xM) {
      throw new Error("L3 requires detector xM to be greater than or equal to source xM");
    }

    const warnings = validateL3Scene(scene);
    const mediumN = refractiveIndexById(scene, pipeline.mediumId, pipeline.wavelengthM);
    let currentX = sourcePlane.xM;
    let field = createFieldFromPlane2D(grid, sourcePlane, { wavelengthM: pipeline.wavelengthM, refractiveIndex: mediumN });
    let propagationCount = 0;
    const inputEnergy = fieldEnergy2D(field, grid.spacingUM, grid.spacingVM);
    const stages: WaveEnergyStage[] = [
      {
        id: `${sourcePlane.id}-energy`,
        label: sourcePlane.label,
        kind: "source",
        xM: sourcePlane.xM,
        inputEnergy,
        outputEnergy: inputEnergy,
        clippedEnergy: 0,
        relativeChange: 0,
        elementId: sourcePlane.id
      }
    ];

    for (const interaction of orderedL3Interactions(scene, pipeline, grid.id, sourcePlane.xM, detectorPlane.xM)) {
      if (interaction.xM < currentX - 1e-15) {
        throw new Error("L3 wave interactions must be ordered from source toward detector");
      }
      if (interaction.xM > currentX) {
        const before = fieldEnergy2D(field, grid.spacingUM, grid.spacingVM);
        field = propagateAngularSpectrum2D(field, grid, pipeline.wavelengthM, mediumN, interaction.xM - currentX);
        propagationCount += 1;
        const after = fieldEnergy2D(field, grid.spacingUM, grid.spacingVM);
        stages.push(makeStage("propagation", `Propagate to ${interaction.item.label}`, interaction.xM, before, after, interaction.item.id));
        currentX = interaction.xM;
      }

      const applied = applyInteraction(field, interaction, grid, pipeline.wavelengthM, mediumN);
      field = applied.field;
      stages.push(makeStage(interaction.kind, interaction.item.label, interaction.xM, applied.inputEnergy, applied.outputEnergy, interaction.item.id));
    }

    const afterInteractionEnergy = fieldEnergy2D(field, grid.spacingUM, grid.spacingVM);
    if (detectorPlane.xM > currentX) {
      const before = afterInteractionEnergy;
      field = propagateAngularSpectrum2D(field, grid, pipeline.wavelengthM, mediumN, detectorPlane.xM - currentX);
      propagationCount += 1;
      const after = fieldEnergy2D(field, grid.spacingUM, grid.spacingVM);
      stages.push(makeStage("propagation", `Propagate to ${detectorPlane.label}`, detectorPlane.xM, before, after, detectorPlane.id));
    }

    const { intensity, phaseRad } = intensityAndPhase2D(field);
    warnings.push(...edgeEnergyWarning2D(intensity, grid.width, grid.height));
    const outputEnergy = fieldEnergy2D(field, grid.spacingUM, grid.spacingVM);
    stages.push(makeStage("detector", detectorPlane.label, detectorPlane.xM, outputEnergy, outputEnergy, detectorPlane.id));
    const fieldOutput: FieldOutput2D = {
      id: `${detectorPlane.id}-image`,
      type: "fieldImage2D",
      planeId: detectorPlane.id,
      gridId: grid.id,
      xM: detectorPlane.xM,
      width: grid.width,
      height: grid.height,
      uMinM: grid.uMinM,
      uMaxM: grid.uMaxM,
      vMinM: grid.vMinM,
      vMaxM: grid.vMaxM,
      real: field.real,
      imag: field.imag,
      intensity,
      phaseRad,
      normalization: "raw",
      units: {
        u: "m",
        v: "m",
        intensity: "relative"
      },
      provenance: l3Scalar2DProvenance
    };
    const sceneHash = hashScene(scene);
    const energyLedger = makeWaveEnergyLedger({
      inputEnergy,
      afterMaskEnergy: afterInteractionEnergy,
      outputEnergy,
      stages,
      provenance: l3Scalar2DProvenance
    });
    const resultHash = l3ResultHash(sceneHash, fieldOutput, energyLedger);
    const cacheKey = makeL3ResultCacheKey(scene);
    const estimatedBytes = grid.width * grid.height * 8 * 8;
    const computeMs = Math.max(0, Date.now() - startedMs);

    return {
      solverId: "scalar.coherent.l3.2d",
      sceneHash,
      resultHash,
      cacheKey,
      cacheHit: false,
      cancelled: false,
      progressStage: "completed",
      performanceStats: {
        gridWidth: grid.width,
        gridHeight: grid.height,
        fftCount: propagationCount * 2,
        estimatedBytes,
        computeMs,
        workerUsed: solverRequest.computePolicy === "worker",
        cacheHit: false,
        cancelled: false
      },
      seed: scene.seed,
      solverVersion: "0.4.0",
      computedAtIso: new Date().toISOString(),
      assumptions,
      warnings,
      fieldImageOutputs: [fieldOutput],
      energyLedger,
      readouts: {}
    };
  }
};

function validateL3Scene(scene: Scene): SolverWarning[] {
  const warnings: SolverWarning[] = [];
  if (scene.fieldGrids2D.length === 0) {
    warnings.push({ code: "fieldGrid2D.missing", message: "L3 requires a 2D field grid." });
  }
  if (scene.microscopePipelines2D.length === 0) {
    warnings.push({ code: "pipeline2D.missing", message: "L3 requires a coherent 2D microscope pipeline." });
  }
  for (const grid of scene.fieldGrids2D) {
    warnings.push(...gridSamplingWarnings2D(grid));
  }
  for (const sample of scene.samplePlanes2D) {
    const grid = scene.fieldGrids2D.find((candidate) => candidate.id === sample.gridId);
    if (grid) warnings.push(...sampleSamplingWarnings2D(sample, grid));
  }
  for (const pupil of scene.pupilPlanes2D) {
    const grid = scene.fieldGrids2D.find((candidate) => candidate.id === pupil.gridId);
    if (grid) warnings.push(...pupilSamplingWarnings2D(pupil, grid));
  }
  return warnings;
}

function firstPipeline(scene: Scene): CoherentMicroscopePipeline2D {
  const pipeline = scene.microscopePipelines2D[0];
  if (!pipeline) {
    throw new Error("L3 scene is missing a coherent 2D microscope pipeline");
  }
  return pipeline;
}

function gridById(scene: Scene, gridId: string): FieldGrid2D {
  const grid = scene.fieldGrids2D.find((candidate) => candidate.id === gridId);
  if (!grid) {
    throw new Error(`L3 scene is missing 2D field grid ${gridId}`);
  }
  return grid;
}

function planeById<T extends { id: string }>(planes: T[], id: string, label: string): T {
  const plane = planes.find((candidate) => candidate.id === id);
  if (!plane) {
    throw new Error(`L3 scene is missing ${label} ${id}`);
  }
  return plane;
}

function orderedL3Interactions(scene: Scene, pipeline: CoherentMicroscopePipeline2D, gridId: string, sourceXM: number, detectorXM: number): L3Interaction2D[] {
  const sampleIds = new Set(pipeline.samplePlaneIds);
  const interactions: L3Interaction2D[] = [
    ...scene.samplePlanes2D
      .filter((sample) => sample.gridId === gridId && sampleIds.has(sample.id))
      .map((item) => ({ kind: "sample" as const, xM: item.xM, item })),
    ...scene.thinLensPhasePlanes2D
      .filter((lens) => lens.gridId === gridId && lens.id === pipeline.lensPlaneId)
      .map((item) => ({ kind: "lens" as const, xM: item.xM, item })),
    ...scene.pupilPlanes2D
      .filter((pupil) => pupil.gridId === gridId && pupil.id === pipeline.pupilPlaneId)
      .map((item) => ({ kind: "pupil" as const, xM: item.xM, item }))
  ];

  for (const interaction of interactions) {
    if (interaction.xM < sourceXM - 1e-15 || interaction.xM > detectorXM + 1e-15) {
      throw new Error(`${interaction.item.label} must lie between the source and detector 2D planes`);
    }
  }

  return interactions.sort((a, b) => {
    if (a.xM !== b.xM) return a.xM - b.xM;
    const order = interactionOrder(a.kind) - interactionOrder(b.kind);
    if (order !== 0) return order;
    return a.item.id.localeCompare(b.item.id);
  });
}

function interactionOrder(kind: L3Interaction2D["kind"]): number {
  if (kind === "sample") return 0;
  if (kind === "lens") return 1;
  return 2;
}

function applyInteraction(
  field: ComplexGrid2D,
  interaction: L3Interaction2D,
  grid: FieldGrid2D,
  wavelengthM: number,
  refractiveIndex: number
): PlaneApplication2D {
  if (interaction.kind === "sample") {
    return applySamplePlane2D(field, interaction.item, grid);
  }
  if (interaction.kind === "lens") {
    return applyThinLensPhase2D(field, interaction.item, grid, wavelengthM, refractiveIndex);
  }
  return applyPupilPlane2D(field, interaction.item, grid);
}

function makeStage(
  kind: WaveEnergyStage["kind"],
  label: string,
  xM: number,
  inputEnergy: number,
  outputEnergy: number,
  elementId?: string
): WaveEnergyStage {
  return {
    id: `${kind}-${elementId ?? label}-${xM}`,
    label,
    kind,
    xM,
    inputEnergy,
    outputEnergy,
    clippedEnergy: Math.max(0, inputEnergy - outputEnergy),
    relativeChange: inputEnergy > 0 ? (outputEnergy - inputEnergy) / inputEnergy : 0,
    elementId
  };
}

function l3ResultHash(sceneHash: string, field: FieldOutput2D, energyLedger: SolverResult["energyLedger"]): string {
  return fnv1a64(
    stableStringify({
      solverId: "scalar.coherent.l3.2d",
      sceneHash,
      field: {
        width: field.width,
        height: field.height,
        real: Array.from(field.real ?? []),
        imag: Array.from(field.imag ?? []),
        intensity: Array.from(field.intensity),
        phaseRad: Array.from(field.phaseRad ?? [])
      },
      energyLedger
    })
  );
}
