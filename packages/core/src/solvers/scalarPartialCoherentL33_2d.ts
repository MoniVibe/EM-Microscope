import { makeL33ResultCacheKey } from "../cache/resultCacheKey";
import { averageEnergyLedgers2D, averageIntensityFieldOutputs2D } from "../illumination/partialCoherence2d";
import { sampleSourceAngles2D, sourceAngleWeightSum } from "../illumination/sourceSampling2d";
import { l33PartialCoherence2DProvenance } from "../readouts/waveEnergy";
import { fnv1a64, hashScene, stableStringify } from "../scene/hashScene";
import {
  parseScene,
  type BrightfieldPipeline2D,
  type CoherentMicroscopePipeline2D,
  type DetectorPlane2D,
  type FieldPlane2D,
  type IlluminationModel2D,
  type SamplePlane2D,
  type Scene,
  type SourceAngleSample2D,
  type TestTarget2D
} from "../scene/schema";
import { samplePlaneFromTestTarget2D } from "../wave/testTargets2d";
import type { EnergyLedger, FieldOutput2D, Solver, SolverRequest, SolverResult, SolverWarning } from "./Solver";
import { scalarCoherentL3_2dSolver } from "./scalarCoherentL3_2d";

const solverVersion = "0.6.0";

const assumptions = [
  "Partial-coherence scalar brightfield approximation",
  "Intensity averaged over deterministic source angles; complex fields are not averaged",
  "Each source angle reuses the coherent L3 2D angular-spectrum propagation path",
  "Monochromatic scalar field",
  "2D target masks are analytic approximations on the detector grid",
  "No vector polarization, fluorescence, scattering, true 3D, or certified ISO microscope metrology"
];

export const scalarPartialCoherentL33_2dSolver: Solver = {
  id: "scalar.partialCoherent.l3.3.2d",
  label: "L3.3 Partial-Coherent 2D Brightfield",
  level: "L3",
  capabilities: [
    "field2D",
    "partialCoherence2D",
    "sourceAngleSampling2D",
    "brightfieldTargetMasks2D",
    "intensityAveraging",
    "samplingWarnings"
  ],
  validateScene(scene) {
    return validateL33Scene(scene);
  },
  run(sceneInput, request = {}) {
    const startedMs = Date.now();
    const scene = parseScene(sceneInput);
    const solverRequest: SolverRequest = {
      solverId: "scalar.partialCoherent.l3.3.2d",
      outputs: ["field2D", "readouts"],
      ...request
    };
    if (solverRequest.solverId !== "scalar.partialCoherent.l3.3.2d") {
      throw new Error(`scalarPartialCoherentL33_2dSolver cannot run request for ${solverRequest.solverId}`);
    }

    const brightfieldPipeline = firstBrightfieldPipeline(scene);
    const coherentPipeline = coherentPipelineById(scene, brightfieldPipeline.coherentPipelineId);
    const sourcePlane = fieldPlaneById(scene, coherentPipeline.sourcePlaneId);
    const detectorPlane = detectorPlaneById(scene, coherentPipeline.detectorPlaneId);
    const illuminationModel = illuminationModelById(scene, brightfieldPipeline.illuminationModelId);
    const testTarget = brightfieldPipeline.testTargetId ? testTargetById(scene, brightfieldPipeline.testTargetId) : undefined;
    const sourceAngleSet = scene.sourceAngleSets2D.find((set) => set.illuminationModelId === illuminationModel.id) ?? sampleSourceAngles2D(illuminationModel);
    const samples = sourceAngleSet.samples;
    const warnings = uniqueWarnings(validateL33Scene(scene));

    const weightedFields: { field: FieldOutput2D; weight: number }[] = [];
    const weightedLedgers: { ledger: EnergyLedger; weight: number }[] = [];
    let fftCount = 0;
    let coherentEstimatedBytes = 0;

    for (const sample of samples) {
      const angleScene = sceneForSourceAngle({
        scene,
        brightfieldPipeline,
        coherentPipeline,
        sourcePlane,
        testTarget,
        sample
      });
      const coherentResult = scalarCoherentL3_2dSolver.run(angleScene, {
        solverId: "scalar.coherent.l3.2d",
        computePolicy: solverRequest.computePolicy
      });
      const field = coherentResult.fieldImageOutputs?.[0];
      if (!field) {
        throw new Error("coherent L3 sub-solve did not return a detector field");
      }
      weightedFields.push({ field, weight: sample.weight });
      if (coherentResult.energyLedger) {
        weightedLedgers.push({ ledger: coherentResult.energyLedger, weight: sample.weight });
      }
      fftCount += coherentResult.performanceStats?.fftCount ?? 0;
      coherentEstimatedBytes += coherentResult.performanceStats?.estimatedBytes ?? 0;
      warnings.push(...coherentResult.warnings);
    }

    const averagedField = averageIntensityFieldOutputs2D({
      fields: weightedFields,
      id: `${detectorPlane.id}-partial-coherent-brightfield`,
      provenance: l33PartialCoherence2DProvenance
    });
    const energyLedger = averageEnergyLedgers2D(weightedLedgers, l33PartialCoherence2DProvenance);
    const sceneHash = hashScene(scene);
    const resultHash = l33ResultHash(sceneHash, averagedField, sourceAngleSet.samples, brightfieldPipeline.id);
    const cacheKey = makeL33ResultCacheKey(scene, solverVersion);
    const computeMs = Math.max(0, Date.now() - startedMs);
    const estimatedBytes = averagedField.width * averagedField.height * 8 * (samples.length + 2) + coherentEstimatedBytes;

    return {
      solverId: "scalar.partialCoherent.l3.3.2d",
      sceneHash,
      resultHash,
      cacheKey,
      cacheHit: false,
      cancelled: false,
      progressStage: "completed",
      performanceStats: {
        gridWidth: averagedField.width,
        gridHeight: averagedField.height,
        fftCount,
        estimatedBytes,
        computeMs,
        workerUsed: solverRequest.computePolicy === "worker",
        cacheHit: false,
        cancelled: false
      },
      seed: scene.seed,
      solverVersion,
      computedAtIso: new Date().toISOString(),
      assumptions,
      warnings: uniqueWarnings(warnings),
      fieldImageOutputs: [averagedField],
      energyLedger,
      sourceAngleSetOutput: {
        id: sourceAngleSet.id,
        label: sourceAngleSet.label,
        illuminationModelId: sourceAngleSet.illuminationModelId,
        samples,
        weightSum: sourceAngleWeightSum(samples)
      },
      partialCoherenceOutput: {
        brightfieldPipelineId: brightfieldPipeline.id,
        coherentPipelineId: coherentPipeline.id,
        illuminationModelId: illuminationModel.id,
        testTargetId: testTarget?.id,
        angleCount: samples.length,
        intensityAveraging: "incoherent-detector-intensity",
        provenanceLabel: "Partial-coherence scalar brightfield approximation"
      },
      readouts: {}
    };
  }
};

function validateL33Scene(sceneInput: Scene): SolverWarning[] {
  const scene = parseScene(sceneInput);
  const warnings: SolverWarning[] = [];
  if (scene.brightfieldPipelines2D.length === 0) {
    warnings.push({ code: "brightfieldPipeline2D.missing", message: "L3.3 requires a brightfield 2D pipeline." });
  }
  if (scene.illuminationModels2D.length === 0) {
    warnings.push({ code: "illuminationModel2D.missing", message: "L3.3 requires a 2D illumination model." });
  }
  for (const model of scene.illuminationModels2D) {
    if ((model.kind === "uniformDisk" && model.sourceNA > 1) || (model.kind === "annulus" && model.outerNA > 1)) {
      warnings.push({ code: "illuminationModel2D.naHigh", message: `${model.label} NA exceeds 1 in the scalar air-angle approximation.`, elementId: model.id });
    }
    const count = model.kind === "singleCoherentAngle" ? 1 : model.sampleCount;
    if (count > 49) {
      warnings.push({ code: "illuminationModel2D.expensive", message: `${model.label} uses ${count} coherent sub-solves per image.`, elementId: model.id });
    }
  }
  for (const pipeline of scene.brightfieldPipelines2D) {
    const coherentPipeline = scene.microscopePipelines2D.find((candidate) => candidate.id === pipeline.coherentPipelineId);
    if (!coherentPipeline) continue;
    const sourcePlane = scene.fieldPlanes2D.find((plane) => plane.id === coherentPipeline.sourcePlaneId);
    const detectorPlane = scene.detectorPlanes2D.find((plane) => plane.id === coherentPipeline.detectorPlaneId);
    if (sourcePlane && detectorPlane && sourcePlane.gridId !== detectorPlane.gridId) {
      warnings.push({ code: "brightfieldPipeline2D.gridMismatch", message: `${pipeline.label} requires source and detector to share a 2D field grid.`, elementId: pipeline.id });
    }
  }
  warnings.push(...scalarCoherentL3_2dSolver.validateScene(scene));
  return uniqueWarnings(warnings);
}

function sceneForSourceAngle({
  scene,
  brightfieldPipeline,
  coherentPipeline,
  sourcePlane,
  testTarget,
  sample
}: {
  scene: Scene;
  brightfieldPipeline: BrightfieldPipeline2D;
  coherentPipeline: CoherentMicroscopePipeline2D;
  sourcePlane: FieldPlane2D;
  testTarget: TestTarget2D | undefined;
  sample: SourceAngleSample2D;
}): Scene {
  const source = sourcePlane.fieldSource;
  const amplitude = source && "amplitude" in source ? source.amplitude : 1;
  const phaseRad = source && "phaseRad" in source ? source.phaseRad : 0;
  const targetSample = testTarget
    ? samplePlaneFromTestTarget2D(testTarget, {
        xM: sourcePlane.xM,
        gridId: sourcePlane.gridId
      })
    : undefined;
  const targetSampleIds = targetSample ? [targetSample.id] : [];
  const updatedCoherentPipeline: CoherentMicroscopePipeline2D = {
    ...coherentPipeline,
    samplePlaneIds: [...coherentPipeline.samplePlaneIds.filter((id) => !targetSampleIds.includes(id)), ...targetSampleIds]
  };

  return {
    ...scene,
    solverSettings: {
      ...scene.solverSettings,
      activeSolverId: "scalar.coherent.l3.2d"
    },
    fieldPlanes2D: scene.fieldPlanes2D.map((plane) =>
      plane.id === sourcePlane.id
        ? {
            ...plane,
            fieldSource: {
              kind: "tiltedPlaneWave",
              amplitude,
              phaseRad,
              angleURad: sample.angleURad,
              angleVRad: sample.angleVRad
            }
          }
        : plane
    ),
    samplePlanes2D: targetSample
      ? [...scene.samplePlanes2D.filter((plane) => plane.id !== targetSample.id), targetSample]
      : scene.samplePlanes2D,
    microscopePipelines2D: [
      updatedCoherentPipeline,
      ...scene.microscopePipelines2D.filter((pipeline) => pipeline.id !== coherentPipeline.id)
    ],
    brightfieldPipelines2D: [brightfieldPipeline, ...scene.brightfieldPipelines2D.filter((pipeline) => pipeline.id !== brightfieldPipeline.id)]
  };
}

function firstBrightfieldPipeline(scene: Scene): BrightfieldPipeline2D {
  const pipeline = scene.brightfieldPipelines2D[0];
  if (!pipeline) {
    throw new Error("L3.3 scene is missing a brightfield 2D pipeline");
  }
  return pipeline;
}

function coherentPipelineById(scene: Scene, pipelineId: string): CoherentMicroscopePipeline2D {
  const pipeline = scene.microscopePipelines2D.find((candidate) => candidate.id === pipelineId);
  if (!pipeline) {
    throw new Error(`L3.3 brightfield pipeline references missing coherent pipeline ${pipelineId}`);
  }
  return pipeline;
}

function fieldPlaneById(scene: Scene, planeId: string): FieldPlane2D {
  const plane = scene.fieldPlanes2D.find((candidate) => candidate.id === planeId);
  if (!plane) {
    throw new Error(`L3.3 scene is missing field plane ${planeId}`);
  }
  return plane;
}

function detectorPlaneById(scene: Scene, planeId: string): DetectorPlane2D {
  const plane = scene.detectorPlanes2D.find((candidate) => candidate.id === planeId);
  if (!plane) {
    throw new Error(`L3.3 scene is missing detector plane ${planeId}`);
  }
  return plane;
}

function illuminationModelById(scene: Scene, modelId: string): IlluminationModel2D {
  const model = scene.illuminationModels2D.find((candidate) => candidate.id === modelId);
  if (!model) {
    throw new Error(`L3.3 scene is missing illumination model ${modelId}`);
  }
  return model;
}

function testTargetById(scene: Scene, targetId: string): TestTarget2D {
  const target = scene.testTargets2D.find((candidate) => candidate.id === targetId);
  if (!target) {
    throw new Error(`L3.3 scene is missing test target ${targetId}`);
  }
  return target;
}

function uniqueWarnings(warnings: SolverWarning[]): SolverWarning[] {
  const seen = new Set<string>();
  const output: SolverWarning[] = [];
  for (const warning of warnings) {
    const key = `${warning.code}:${warning.elementId ?? ""}:${warning.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(warning);
  }
  return output;
}

function l33ResultHash(sceneHash: string, field: FieldOutput2D, sourceAngles: SourceAngleSample2D[], brightfieldPipelineId: string): string {
  return fnv1a64(
    stableStringify({
      solverId: "scalar.partialCoherent.l3.3.2d",
      sceneHash,
      brightfieldPipelineId,
      sourceAngles,
      field: {
        width: field.width,
        height: field.height,
        intensity: Array.from(field.intensity)
      }
    })
  );
}
