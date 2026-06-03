import { angularFrequencyGrid, fft, isPowerOfTwo } from "../math/fft";
import { refractiveIndexById } from "../optics/media";
import { makeWaveEnergyLedger, l2Scalar1DProvenance } from "../readouts/waveEnergy";
import { hashScene, stableStringify, fnv1a64 } from "../scene/hashScene";
import { parseScene, type FieldGrid1D, type FieldPlane1D, type RectApertureMask1D, type Scene } from "../scene/schema";
import { applyRectAperture1D } from "../wave/apertures1d";
import { cloneComplexArray, multiplyByComplex, type ComplexArray } from "../wave/complex";
import { createFieldFromPlane, fieldEnergy, gridCoordinates, intensityAndPhase } from "../wave/field1d";
import { apertureSamplingWarnings, edgeEnergyWarning, gridSamplingWarnings, propagationWindowWarnings } from "../wave/sampling";
import type { FieldOutput1D, Solver, SolverRequest, SolverResult, SolverWarning } from "./Solver";

const assumptions = [
  "L2 scalar 1D field propagation",
  "1D transverse slice, not full circular-aperture Airy disk",
  "Coherent monochromatic angular-spectrum propagation",
  "Homogeneous medium between source, mask, and detector planes",
  "No polarization, scattering, fluorescence, or incoherent imaging"
];

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
      throw new Error("L2 v0 requires the source and detector field planes to use the same 1D grid");
    }
    if (!isPowerOfTwo(grid.samples)) {
      throw new Error("L2 angular-spectrum solver requires a power-of-two grid");
    }
    if (detectorPlane.xM < sourcePlane.xM) {
      throw new Error("L2 v0 requires detector xM to be greater than or equal to source xM");
    }

    const warnings = validateL2Scene(scene);
    const yM = gridCoordinates(grid);
    let currentX = sourcePlane.xM;
    let field = createFieldFromPlane(grid, sourcePlane);
    const inputEnergy = fieldEnergy(field, grid.spacingM);

    const mask = firstRectAperture(scene, grid.id);
    let afterMaskEnergy = inputEnergy;
    if (mask) {
      if (mask.xM < currentX) {
        throw new Error("L2 v0 requires the aperture mask to be at or after the source field plane");
      }
      if (mask.xM > currentX) {
        field = propagateAngularSpectrum1D(field, grid, scene.environment.defaultWavelengthM, refractiveIndexById(scene, sourcePlane.mediumId, scene.environment.defaultWavelengthM), mask.xM - currentX);
        currentX = mask.xM;
      }
      const apertureResult = applyRectAperture1D(field, mask, yM, grid.spacingM);
      field = apertureResult.field;
      afterMaskEnergy = apertureResult.outputEnergy;
      warnings.push(
        ...propagationWindowWarnings({
          wavelengthM: scene.environment.defaultWavelengthM,
          propagationM: detectorPlane.xM - mask.xM,
          apertureWidthM: mask.widthM,
          grid
        })
      );
    }

    if (detectorPlane.xM > currentX) {
      field = propagateAngularSpectrum1D(
        field,
        grid,
        scene.environment.defaultWavelengthM,
        refractiveIndexById(scene, detectorPlane.mediumId, scene.environment.defaultWavelengthM),
        detectorPlane.xM - currentX
      );
    }

    const { intensity, phaseRad } = intensityAndPhase(field);
    warnings.push(...edgeEnergyWarning(intensity));
    const outputEnergy = fieldEnergy(field, grid.spacingM);
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
    const energyLedger = makeWaveEnergyLedger({ inputEnergy, afterMaskEnergy, outputEnergy });
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

function firstRectAperture(scene: Scene, gridId: string): RectApertureMask1D | null {
  return scene.masks1D.find((mask): mask is RectApertureMask1D => mask.type === "rectAperture1D" && mask.gridId === gridId) ?? null;
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
