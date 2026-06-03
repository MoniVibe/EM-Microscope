import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import { cabs2, cadd, cdiv, cfinite, cmul, cneg, complex, ccos, cscale, csin, csqrt, csub, type Complex } from "./complex";
import { complexIndex, relativePermittivityFromIndex, type MaxwellMaterialSample } from "./materials";

export type MaxwellPolarization = "TE" | "TM";

export type PlanarTmmLayer = {
  id: string;
  label: string;
  material: MaxwellMaterialSample;
  thicknessM: number;
};

export type PlanarTmmInput = {
  id: string;
  label: string;
  wavelengthM: number;
  angleRad: number;
  polarization: MaxwellPolarization;
  incidentMedium: MaxwellMaterialSample;
  substrateMedium: MaxwellMaterialSample;
  layers: PlanarTmmLayer[];
  tolerance?: number;
};

export type PlanarTmmResult = {
  id: string;
  type: "planarMultilayerMaxwellTmm";
  analysisId: "analysis.maxwell.l4.phase0.planarTmm";
  label: string;
  wavelengthM: number;
  angleRad: number;
  polarization: MaxwellPolarization;
  layerCount: number;
  amplitudeReflection: Complex;
  amplitudeTransmission: Complex;
  reflectance: number;
  transmittance: number;
  absorbance: number;
  rawAbsorbance: number;
  energyBalanceError: number;
  poyntingFlux: {
    incident: number;
    reflected: number;
    transmitted: number;
    absorbed: number;
  };
  admittance: {
    incident: Complex;
    substrate: Complex;
  };
  effectivePermittivity: {
    incident: Complex;
    substrate: Complex;
    layers: Array<{ id: string; epsilonR: Complex }>;
  };
  warnings: SolverWarning[];
  resultHash: string;
  provenance: {
    label: "frequency-domain Maxwell planar multilayer transfer-matrix special case";
    limitations: string[];
  };
};

type Matrix2 = [[Complex, Complex], [Complex, Complex]];

export function runPlanarTmm(input: PlanarTmmInput): PlanarTmmResult {
  const warnings = validatePlanarTmmInput(input);
  const tolerance = input.tolerance ?? 1e-6;
  const incidentIndex = propagationIndex(input.incidentMedium);
  const substrateIndex = propagationIndex(input.substrateMedium);
  const sinIncident = Math.sin(input.angleRad);
  const incidentCos = complex(Math.cos(input.angleRad));
  const substrateCos = propagationCosine(substrateIndex, incidentIndex, sinIncident);
  const incidentAdmittance = waveAdmittance(incidentIndex, incidentCos, input.polarization);
  const substrateAdmittance = waveAdmittance(substrateIndex, substrateCos, input.polarization);

  let matrix = identityMatrix();
  for (const layer of input.layers) {
    const n = propagationIndex(layer.material);
    const cosTheta = propagationCosine(n, incidentIndex, sinIncident);
    const q = waveAdmittance(n, cosTheta, input.polarization);
    const delta = cscale(cmul(n, cosTheta), (2 * Math.PI * layer.thicknessM) / input.wavelengthM);
    const layerMatrix = characteristicMatrix(delta, q);
    matrix = multiplyMatrix(matrix, layerMatrix);
  }

  const [m11, m12] = matrix[0];
  const [m21, m22] = matrix[1];
  const numerator = csub(csub(cadd(cmul(incidentAdmittance, m11), cmul(cmul(incidentAdmittance, substrateAdmittance), m12)), m21), cmul(substrateAdmittance, m22));
  const denominator = cadd(cadd(cadd(cmul(incidentAdmittance, m11), cmul(cmul(incidentAdmittance, substrateAdmittance), m12)), m21), cmul(substrateAdmittance, m22));
  const amplitudeReflection = cdiv(numerator, denominator);
  const amplitudeTransmission = cdiv(cscale(incidentAdmittance, 2), denominator);

  const reflectance = cabs2(amplitudeReflection);
  const transmittance = Math.max(0, (substrateAdmittance.re / Math.max(1e-15, incidentAdmittance.re)) * cabs2(amplitudeTransmission));
  const rawAbsorbance = 1 - reflectance - transmittance;
  const absorbance = Math.max(0, rawAbsorbance);
  const energyBalanceError = Math.abs(reflectance + transmittance + absorbance - 1);
  if (rawAbsorbance < -tolerance) {
    warnings.push({
      code: "maxwell.planarTmm.negativeAbsorbance",
      message: "Planar TMM produced negative absorbance beyond tolerance; check material signs, angle, or stack settings."
    });
  }
  if (energyBalanceError > tolerance) {
    warnings.push({
      code: "maxwell.planarTmm.energyBalance",
      message: `R+T+A energy balance error ${energyBalanceError.toExponential(3)} exceeds tolerance ${tolerance.toExponential(3)}.`
    });
  }

  const resultHash = tmmResultHash(input, {
    amplitudeReflection,
    amplitudeTransmission,
    reflectance,
    transmittance,
    absorbance,
    rawAbsorbance
  });

  return {
    id: input.id,
    type: "planarMultilayerMaxwellTmm",
    analysisId: "analysis.maxwell.l4.phase0.planarTmm",
    label: input.label,
    wavelengthM: input.wavelengthM,
    angleRad: input.angleRad,
    polarization: input.polarization,
    layerCount: input.layers.length,
    amplitudeReflection,
    amplitudeTransmission,
    reflectance,
    transmittance,
    absorbance,
    rawAbsorbance,
    energyBalanceError,
    poyntingFlux: {
      incident: 1,
      reflected: reflectance,
      transmitted: transmittance,
      absorbed: absorbance
    },
    admittance: {
      incident: incidentAdmittance,
      substrate: substrateAdmittance
    },
    effectivePermittivity: {
      incident: relativePermittivityFromIndex(input.incidentMedium.refractiveIndex),
      substrate: relativePermittivityFromIndex(input.substrateMedium.refractiveIndex),
      layers: input.layers.map((layer) => ({
        id: layer.id,
        epsilonR: relativePermittivityFromIndex(layer.material.refractiveIndex)
      }))
    },
    warnings: uniqueWarnings(warnings),
    resultHash,
    provenance: {
      label: "frequency-domain Maxwell planar multilayer transfer-matrix special case",
      limitations: [
        "Solves the steady-state Maxwell planar film-stack special case only.",
        "This is not a general 3D Maxwell solver; not arbitrary 3D FEM, BEM, RCWA, FDTD, CAD geometry, curved lens, aperture, or sensor-stack simulation.",
        "No ray approximation is used inside this planar TMM calculation.",
        "Material samples are constant n,k diagnostics unless replaced by wavelength-dependent data."
      ]
    }
  };
}

function propagationIndex(material: MaxwellMaterialSample): Complex {
  const index = complexIndex(material);
  // The characteristic-matrix convention here uses exp(-i omega t) phasors with
  // layer phase factors that attenuate for n - i k while public material samples
  // store the usual positive extinction coefficient k.
  return complex(index.re, -Math.abs(index.im));
}

export function fresnelReflectanceNormal(nIncident: number, nSubstrate: number): number {
  return ((nIncident - nSubstrate) / (nIncident + nSubstrate)) ** 2;
}

function validatePlanarTmmInput(input: PlanarTmmInput): SolverWarning[] {
  const warnings: SolverWarning[] = [
    {
      code: "maxwell.planarTmm.specialCase",
      message: "L4 Phase 0 is a planar multilayer frequency-domain Maxwell special case, not a general 3D Maxwell solver."
    }
  ];
  if (input.wavelengthM <= 0 || !Number.isFinite(input.wavelengthM)) {
    throw new Error("planar TMM wavelength must be positive");
  }
  if (!Number.isFinite(input.angleRad) || Math.abs(input.angleRad) >= Math.PI / 2) {
    throw new Error("planar TMM angle must be finite and below grazing incidence");
  }
  for (const layer of input.layers) {
    if (layer.thicknessM <= 0 || !Number.isFinite(layer.thicknessM)) {
      throw new Error(`planar TMM layer ${layer.id} thickness must be positive`);
    }
    if (layer.thicknessM < input.wavelengthM / 5000) {
      warnings.push({
        code: "maxwell.planarTmm.layerVeryThin",
        message: `${layer.label} is thinner than wavelength/5000; verify it is intended as a physical layer.`,
        elementId: layer.id
      });
    }
  }
  return warnings;
}

function propagationCosine(nLayer: Complex, nIncident: Complex, sinIncident: number): Complex {
  const ratio = cdiv(cscale(nIncident, sinIncident), nLayer);
  const cosSquared = csub(complex(1), cmul(ratio, ratio));
  let cosTheta = csqrt(cosSquared);
  if (cosTheta.re < 0 || (Math.abs(cosTheta.re) < 1e-12 && cosTheta.im < 0)) {
    cosTheta = cneg(cosTheta);
  }
  return cosTheta;
}

function waveAdmittance(n: Complex, cosTheta: Complex, polarization: MaxwellPolarization): Complex {
  return polarization === "TE" ? cmul(n, cosTheta) : cdiv(cosTheta, n);
}

function characteristicMatrix(delta: Complex, admittance: Complex): Matrix2 {
  const cosDelta = ccos(delta);
  const iSinDelta = cmul(complex(0, 1), csin(delta));
  return [
    [cosDelta, cdiv(iSinDelta, admittance)],
    [cmul(iSinDelta, admittance), cosDelta]
  ];
}

function identityMatrix(): Matrix2 {
  return [
    [complex(1), complex(0)],
    [complex(0), complex(1)]
  ];
}

function multiplyMatrix(a: Matrix2, b: Matrix2): Matrix2 {
  return [
    [cadd(cmul(a[0][0], b[0][0]), cmul(a[0][1], b[1][0])), cadd(cmul(a[0][0], b[0][1]), cmul(a[0][1], b[1][1]))],
    [cadd(cmul(a[1][0], b[0][0]), cmul(a[1][1], b[1][0])), cadd(cmul(a[1][0], b[0][1]), cmul(a[1][1], b[1][1]))]
  ];
}

function tmmResultHash(
  input: PlanarTmmInput,
  result: Pick<PlanarTmmResult, "amplitudeReflection" | "amplitudeTransmission" | "reflectance" | "transmittance" | "absorbance" | "rawAbsorbance">
): string {
  return fnv1a64(
    stableStringify({
      analysisId: "analysis.maxwell.l4.phase0.planarTmm",
      input: {
        id: input.id,
        wavelengthM: input.wavelengthM,
        angleRad: input.angleRad,
        polarization: input.polarization,
        incident: input.incidentMedium.refractiveIndex,
        substrate: input.substrateMedium.refractiveIndex,
        layers: input.layers.map((layer) => ({
          id: layer.id,
          material: layer.material.refractiveIndex,
          thicknessM: layer.thicknessM
        }))
      },
      result: {
        amplitudeReflection: roundComplex(result.amplitudeReflection),
        amplitudeTransmission: roundComplex(result.amplitudeTransmission),
        reflectance: roundNumber(result.reflectance),
        transmittance: roundNumber(result.transmittance),
        absorbance: roundNumber(result.absorbance),
        rawAbsorbance: roundNumber(result.rawAbsorbance)
      }
    })
  );
}

function roundComplex(value: Complex): Complex {
  if (!cfinite(value)) return value;
  return {
    re: roundNumber(value.re),
    im: roundNumber(value.im)
  };
}

function roundNumber(value: number): number {
  return Number(value.toFixed(12));
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
