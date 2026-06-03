import { angularFrequencyGrid, fft, isPowerOfTwo } from "../math/fft";
import { refractiveIndexById } from "../optics/media";
import { makeWaveEnergyLedger, l2Scalar1DProvenance } from "../readouts/waveEnergy";
import { hashScene, stableStringify, fnv1a64 } from "../scene/hashScene";
import { parseScene, type FieldGrid1D, type FieldPlane1D, type RectApertureMask1D, type SamplePlane1D, type Scene } from "../scene/schema";
import { applyRectAperture1D } from "../wave/apertures1d";
import { cloneComplexArray, multiplyByComplex, type ComplexArray } from "../wave/complex";
import { createFieldFromPlane, fieldEnergy, gridCoordinates, intensityAndPhase } from "../wave/field1d";
import { applySamplePlane1D } from "../wave/samplePlanes1D";
import { apertureSamplingWarnings, edgeEnergyWarning, gridSamplingWarnings, propagationWindowWarnings, sampleSamplingWarnings } from "../wave/sampling";
import type { FieldOutput1D, Solver, SolverRequest, SolverResult, SolverWarning, WaveEnergyStage } from "./Solver";

const assumptions = [
  "L2 scalar 1D field propagation",
  "1D transverse slice, not full circular-aperture Airy disk",
  "L2 scalar 1D sample propagation when sample planes are present",
  "1D coherent transverse slice; not a full microscope image, full PSF, or Airy disk",
  "Coherent monochromatic angular-spectrum propagation",
  "Homogeneous medium between source, sample, pupil, and detector planes",
  "No polarization, scattering, fluorescence, or incoherent imaging"
];

type WaveInteraction1D =
  | { kind: "sample"; xM: number; item: SamplePlane1D }
  | { kind: "aperture"; xM: number; item: RectApertureMask1D };

export const scalarAngularSpectrumL2_1dSolver: Solver = {
  id: "scalar.angularSpectrum.l2.1d",
  label: "L2 Scalar 1D Angular Spectrum",
  level: "L2",
  capabilities: ["field1D", "angularSpectrumPropagation", "rectAperture1D", "energyLedger", "samplingWarnings"],
  validateScene(scene) {
    return validateL2Scene(scene);
  },
  run(sceneInput, request = {}) {
    const scene = parseScene(sceneInput);
    const solverRequest: SolverRequest = {
      solverId: "scalar.angularSpectrum.l2.1d",
      outputs: ["field1D", "readouts"],
      ...request
    };
    if (solverRequest.solverId !== "scalar.angularSpectrum.l2.1d") {
      throw new Error(`scalarAngularSpectrumL2_1dSolver cannot run request for ${solverRequest.solverId}`);
    }

    const sourcePlane = firstPlane(scene, "source");
    const detectorPlane = firstPlane(scene, "detector");
    const grid = gridById(scene, sourcePlane.gridId);
    if (detectorPlane.gridId !== grid.id) {
      throw new Error("L2.5 requires the source and detector field planes to use the same 1D grid");
    }
    if (!isPowerOfTwo(grid.samples)) {
      throw new Error("L2 angular-spectrum solver requires a power-of-two grid");
    }
    if (detectorPlane.xM < sourcePlane.xM) {
      throw new Error("L2.5 requires detector xM to be greater than or equal to source xM");
    }

    const warnings = validateL2Scene(scene);
    const yM = gridCoordinates(grid);
    let currentX = sourcePlane.xM;
    let field = createFieldFromPlane(grid, sourcePlane);
    const inputEnergy = fieldEnergy(field, grid.spacingM);
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
    const mediumN = refractiveIndexById(scene, sourcePlane.mediumId, scene.environment.defaultWavelengthM);
    const interactions = orderedWaveInteractions(scene, grid.id, sourcePlane.xM, detectorPlane.xM);

    for (const interaction of interactions) {
      if (interaction.xM < currentX - 1e-15) {
        throw new Error("L2.5 wave interactions must be ordered from source toward detector");
      }
      if (interaction.xM > currentX) {
        const before = fieldEnergy(field, grid.spacingM);
        field = propagateAngularSpectrum1D(field, grid, scene.environment.defaultWavelengthM, mediumN, interaction.xM - currentX);
        const after = fieldEnergy(field, grid.spacingM);
        stages.push(makeStage("propagation", `Propagate to ${interaction.item.label}`, interaction.xM, before, after, interaction.item.id));
        currentX = interaction.xM;
      }

      if (interaction.kind === "sample") {
        const applied = applySamplePlane1D(field, interaction.item, yM, grid.spacingM);
        field = applied.field;
        stages.push(makeStage("sample", interaction.item.label, interaction.xM, applied.inputEnergy, applied.outputEnergy, interaction.item.id));
      } else {
        const applied = applyRectAperture1D(field, interaction.item, yM, grid.spacingM);
        field = applied.field;
        stages.push(makeStage("aperture", interaction.item.label, interaction.xM, applied.inputEnergy, applied.outputEnergy, interaction.item.id));
        warnings.push(
          ...propagationWindowWarnings({
            wavelengthM: scene.environment.defaultWavelengthM,
            propagationM: detectorPlane.xM - interaction.item.xM,
            apertureWidthM: interaction.item.widthM,
            grid
          })
        );
      }
    }

    const afterInteractionEnergy = fieldEnergy(field, grid.spacingM);
    if (detectorPlane.xM > currentX) {
      const before = afterInteractionEnergy;
      field = propagateAngularSpectrum1D(field, grid, scene.environment.defaultWavelengthM, mediumN, detectorPlane.xM - currentX);
      const after = fieldEnergy(field, grid.spacingM);
      stages.push(makeStage("propagation", `Propagate to ${detectorPlane.label}`, detectorPlane.xM, before, after, detectorPlane.id));
    }

    const { intensity, phaseRad } = intensityAndPhase(field);
    warnings.push(...edgeEnergyWarning(intensity));
    const outputEnergy = fieldEnergy(field, grid.spacingM);
    stages.push(makeStage("detector", detectorPlane.label, detectorPlane.xM, outputEnergy, outputEnergy, detectorPlane.id));
    const fieldOutput: FieldOutput1D = {
      id: `${detectorPlane.id}-profile`,
      type: "fieldProfile1D",
      planeId: detectorPlane.id,
      gridId: grid.id,
      xM: detectorPlane.xM,
      yM,
      real: field.real,
      imag: field.imag,
      intensity,
      phaseRad,
      units: {
        y: "m",
        intensity: "relative",
        phase: "rad"
      },
      provenance: l2Scalar1DProvenance
    };
    const sceneHash = hashScene(scene);
    const energyLedger = makeWaveEnergyLedger({ inputEnergy, afterMaskEnergy: afterInteractionEnergy, outputEnergy, stages });
    const resultHash = l2ResultHash(sceneHash, fieldOutput, energyLedger);

    return {
      solverId: "scalar.angularSpectrum.l2.1d",
      sceneHash,
      resultHash,
      seed: scene.seed,
      solverVersion: "0.3.0",
      computedAtIso: new Date().toISOString(),
      assumptions,
      warnings,
      fieldOutputs: [fieldOutput],
      energyLedger,
      readouts: {}
    };
  }
};

export function propagateAngularSpectrum1D(
  input: ComplexArray,
  grid: FieldGrid1D,
  vacuumWavelengthM: number,
  refractiveIndex: number,
  distanceM: number
): ComplexArray {
  if (distanceM < 0) {
    throw new Error("Angular-spectrum propagation distance must be nonnegative");
  }
  if (distanceM === 0) {
    return cloneComplexArray(input);
  }

  const spectrum = fft(input);
  const kyValues = angularFrequencyGrid(grid.samples, grid.spacingM);
  const mediumWavelengthM = vacuumWavelengthM / refractiveIndex;
  const k = (2 * Math.PI) / mediumWavelengthM;

  for (let index = 0; index < kyValues.length; index += 1) {
    const ky = kyValues[index] ?? 0;
    const longitudinalSquared = k * k - ky * ky;
    if (longitudinalSquared >= 0) {
      const phase = Math.sqrt(longitudinalSquared) * distanceM;
      multiplyByComplex(spectrum.real, spectrum.imag, index, Math.cos(phase), Math.sin(phase));
    } else {
      const decay = Math.exp(-Math.sqrt(-longitudinalSquared) * distanceM);
      spectrum.real[index] = (spectrum.real[index] ?? 0) * decay;
      spectrum.imag[index] = (spectrum.imag[index] ?? 0) * decay;
    }
  }

  return fft(spectrum, true);
}

function validateL2Scene(scene: Scene): SolverWarning[] {
  const warnings: SolverWarning[] = [];
  if (scene.fieldGrids1D.length === 0) {
    warnings.push({ code: "fieldGrid.missing", message: "L2 requires a 1D field grid." });
  }
  if (!scene.fieldPlanes1D.some((plane) => plane.role === "source")) {
    warnings.push({ code: "fieldPlane.sourceMissing", message: "L2 requires a source field plane." });
  }
  if (!scene.fieldPlanes1D.some((plane) => plane.role === "detector")) {
    warnings.push({ code: "fieldPlane.detectorMissing", message: "L2 requires a detector field plane." });
  }

  for (const grid of scene.fieldGrids1D) {
    warnings.push(...gridSamplingWarnings(grid));
  }
  for (const mask of scene.masks1D) {
    if (mask.type === "rectAperture1D") {
      const grid = scene.fieldGrids1D.find((candidate) => candidate.id === mask.gridId);
      if (grid) warnings.push(...apertureSamplingWarnings(mask, grid));
    }
  }
  for (const sample of scene.samplePlanes1D) {
    const grid = scene.fieldGrids1D.find((candidate) => candidate.id === sample.gridId);
    if (grid) warnings.push(...sampleSamplingWarnings(sample, grid));
    warnings.push(...sampleGeometryWarnings(sample));
  }
  return warnings;
}

function firstPlane(scene: Scene, role: FieldPlane1D["role"]): FieldPlane1D {
  const plane = scene.fieldPlanes1D.find((candidate) => candidate.role === role);
  if (!plane) {
    throw new Error(`L2 scene is missing a ${role} field plane`);
  }
  return plane;
}

function gridById(scene: Scene, gridId: string): FieldGrid1D {
  const grid = scene.fieldGrids1D.find((candidate) => candidate.id === gridId);
  if (!grid) {
    throw new Error(`L2 scene is missing field grid ${gridId}`);
  }
  return grid;
}

function orderedWaveInteractions(scene: Scene, gridId: string, sourceXM: number, detectorXM: number): WaveInteraction1D[] {
  const interactions: WaveInteraction1D[] = [
    ...scene.samplePlanes1D
      .filter((sample) => sample.gridId === gridId)
      .map((item) => ({ kind: "sample" as const, xM: item.xM, item })),
    ...scene.masks1D
      .filter((mask): mask is RectApertureMask1D => mask.type === "rectAperture1D" && mask.gridId === gridId)
      .map((item) => ({ kind: "aperture" as const, xM: item.xM, item }))
  ];

  for (const interaction of interactions) {
    if (interaction.xM < sourceXM - 1e-15 || interaction.xM > detectorXM + 1e-15) {
      throw new Error(`${interaction.item.label} must lie between the source and detector field planes`);
    }
  }

  return interactions.sort((a, b) => {
    if (a.xM !== b.xM) return a.xM - b.xM;
    if (a.kind === b.kind) return a.item.id.localeCompare(b.item.id);
    return a.kind === "sample" ? -1 : 1;
  });
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

function sampleGeometryWarnings(sample: SamplePlane1D): SolverWarning[] {
  const transmission = sample.transmission;
  const profiles =
    transmission.kind === "analyticAmplitude"
      ? [transmission.profile]
      : transmission.kind === "analyticComplex"
        ? [transmission.amplitudeProfile]
        : [];
  const warnings: SolverWarning[] = [];
  for (const profile of profiles) {
    if (profile.kind === "doubleSlit" && profile.separationM <= profile.slitWidthM) {
      warnings.push({
        code: "sample.doubleSlitInvalid",
        message: `${sample.label} separation must exceed slit width.`,
        elementId: sample.id
      });
    }
    if (profile.kind === "grating" && profile.periodM < profile.slitWidthM) {
      warnings.push({
        code: "sample.gratingInvalid",
        message: `${sample.label} period must be at least the slit width.`,
        elementId: sample.id
      });
    }
  }
  return warnings;
}

function l2ResultHash(sceneHash: string, field: FieldOutput1D, energyLedger: SolverResult["energyLedger"]): string {
  return fnv1a64(
    stableStringify({
      solverId: "scalar.angularSpectrum.l2.1d",
      sceneHash,
      field: {
        yM: Array.from(field.yM),
        real: Array.from(field.real),
        imag: Array.from(field.imag),
        intensity: Array.from(field.intensity),
        phaseRad: Array.from(field.phaseRad)
      },
      energyLedger
    })
  );
}
