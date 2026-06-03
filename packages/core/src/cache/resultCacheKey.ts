import { fnv1a64, hashScene, stableStringify } from "../scene/hashScene";
import { parseScene, type Scene } from "../scene/schema";
import type { SolverId } from "../solvers/Solver";

export function makeL3ResultCacheKey(sceneInput: Scene, solverVersion = "0.4.0"): string {
  const scene = parseScene(sceneInput);
  const pipeline = scene.microscopePipelines2D[0];
  const grid = pipeline
    ? scene.fieldGrids2D.find((candidate) => candidate.id === scene.fieldPlanes2D.find((plane) => plane.id === pipeline.sourcePlaneId)?.gridId)
    : scene.fieldGrids2D[0];

  return makeResultCacheKey({
    sceneHash: hashScene(scene),
    solverId: "scalar.coherent.l3.2d",
    solverVersion,
    pipelineId: pipeline?.id,
    gridId: grid?.id,
    gridWidth: grid?.width,
    gridHeight: grid?.height,
    wavelengthM: pipeline?.wavelengthM,
    mediumId: pipeline?.mediumId
  });
}

export function makeL33ResultCacheKey(sceneInput: Scene, solverVersion = "0.6.0"): string {
  const scene = parseScene(sceneInput);
  const brightfieldPipeline = scene.brightfieldPipelines2D[0];
  const coherentPipeline = brightfieldPipeline
    ? scene.microscopePipelines2D.find((candidate) => candidate.id === brightfieldPipeline.coherentPipelineId)
    : scene.microscopePipelines2D[0];
  const grid = coherentPipeline
    ? scene.fieldGrids2D.find((candidate) => candidate.id === scene.fieldPlanes2D.find((plane) => plane.id === coherentPipeline.sourcePlaneId)?.gridId)
    : scene.fieldGrids2D[0];

  return makeResultCacheKey({
    sceneHash: hashScene(scene),
    solverId: "scalar.partialCoherent.l3.3.2d",
    solverVersion,
    pipelineId: brightfieldPipeline?.id ?? coherentPipeline?.id,
    gridId: grid?.id,
    gridWidth: grid?.width,
    gridHeight: grid?.height,
    wavelengthM: coherentPipeline?.wavelengthM,
    mediumId: coherentPipeline?.mediumId,
    illuminationModelId: brightfieldPipeline?.illuminationModelId,
    testTargetId: brightfieldPipeline?.testTargetId
  });
}

export function makeResultCacheKey({
  sceneHash,
  solverId,
  solverVersion,
  pipelineId,
  gridId,
  gridWidth,
  gridHeight,
  wavelengthM,
  mediumId,
  illuminationModelId,
  testTargetId
}: {
  sceneHash: string;
  solverId: SolverId;
  solverVersion: string;
  pipelineId?: string;
  gridId?: string;
  gridWidth?: number;
  gridHeight?: number;
  wavelengthM?: number;
  mediumId?: string;
  illuminationModelId?: string;
  testTargetId?: string;
}): string {
  return fnv1a64(
    stableStringify({
      sceneHash,
      solverId,
      solverVersion,
      pipelineId,
      gridId,
      gridWidth,
      gridHeight,
      wavelengthM,
      mediumId,
      illuminationModelId,
      testTargetId
    })
  );
}
