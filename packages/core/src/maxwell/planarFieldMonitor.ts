import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import { cabs, cabs2, cadd, cconj, cdiv, cmul, cneg, complex, ccos, cscale, csin, csqrt, csub, type Complex } from "./complex";
import { complexIndex, type MaxwellMaterialSample } from "./materials";
import { runPlanarTmm, type MaxwellPolarization, type PlanarTmmInput, type PlanarTmmResult } from "./planarTmm";

type Matrix2 = [[Complex, Complex], [Complex, Complex]];
type FieldVector = [Complex, Complex];

export type PlanarFieldMonitorSampleKind = "incidentBoundary" | "layerFront" | "layerMid" | "layerBack" | "substrateBoundary";

export type PlanarFieldMonitorSample = {
  id: string;
  kind: PlanarFieldMonitorSampleKind;
  positionM: number;
  layerId?: string;
  layerLabel?: string;
  depthInLayerM?: number;
  eTangential: Complex;
  hTangential: Complex;
  electricMagnitude: number;
  magneticMagnitude: number;
  electricIntensity: number;
  magneticIntensity: number;
  phaseRad: number;
  normalizedPoyntingFlux: number;
};

export type PlanarLayerFluxMonitor = {
  layerId: string;
  label: string;
  frontPositionM: number;
  backPositionM: number;
  frontFlux: number;
  backFlux: number;
  rawAbsorbedFlux: number;
  absorbedFlux: number;
};

export type PlanarFieldMonitorResult = {
  id: string;
  type: "planarTmmFieldMonitor";
  analysisId: "analysis.maxwell.l4.phase2.planarFieldMonitor";
  label: string;
  tmmResultHash: string;
  totalThicknessM: number;
  samples: PlanarFieldMonitorSample[];
  layerFlux: PlanarLayerFluxMonitor[];
  aggregateLayerAbsorbance: number;
  maxElectricIntensity: number;
  maxMagneticIntensity: number;
  warnings: SolverWarning[];
  resultHash: string;
  provenance: {
    label: "planar TMM internal field monitor for complex tangential E/H";
    limitations: string[];
  };
};

type LayerOptics = {
  id: string;
  label: string;
  thicknessM: number;
  admittance: Complex;
  opticalPhaseFull: Complex;
};

export function runPlanarFieldMonitor(input: PlanarTmmInput, tmm: PlanarTmmResult = runPlanarTmm(input)): PlanarFieldMonitorResult {
  const warnings: SolverWarning[] = [
    {
      code: "maxwell.fieldMonitor.planarOnly",
      message: "L4.2 field monitor samples complex tangential E/H inside a planar TMM special case only; this is not a general 3D Maxwell field solution."
    }
  ];
  const incidentIndex = propagationIndex(input.incidentMedium);
  const substrateIndex = propagationIndex(input.substrateMedium);
  const sinIncident = Math.sin(input.angleRad);
  const incidentCos = complex(Math.cos(input.angleRad));
  const substrateCos = propagationCosine(substrateIndex, incidentIndex, sinIncident);
  const incidentAdmittance = waveAdmittance(incidentIndex, incidentCos, input.polarization);
  const substrateAdmittance = waveAdmittance(substrateIndex, substrateCos, input.polarization);
  const layers = input.layers.map((layer): LayerOptics => {
    const n = propagationIndex(layer.material);
    const cosTheta = propagationCosine(n, incidentIndex, sinIncident);
    const admittance = waveAdmittance(n, cosTheta, input.polarization);
    return {
      id: layer.id,
      label: layer.label,
      thicknessM: layer.thicknessM,
      admittance,
      opticalPhaseFull: cscale(cmul(n, cosTheta), (2 * Math.PI * layer.thicknessM) / input.wavelengthM)
    };
  });
  const substrateField: FieldVector = [tmm.amplitudeTransmission, cmul(substrateAdmittance, tmm.amplitudeTransmission)];
  const incidentFluxScale = Math.max(1e-15, incidentAdmittance.re);
  const totalThicknessM = layers.reduce((sum, layer) => sum + layer.thicknessM, 0);
  const samples: PlanarFieldMonitorSample[] = [];
  const layerFlux: PlanarLayerFluxMonitor[] = [];

  samples.push(makeSample("incident-boundary", "incidentBoundary", 0, fieldAt(input, layers, substrateField, -1, 0), incidentFluxScale));

  let positionM = 0;
  for (let i = 0; i < layers.length; i += 1) {
    const layer = layers[i];
    if (!layer) continue;
    const frontField = fieldAt(input, layers, substrateField, i, 0);
    const midField = fieldAt(input, layers, substrateField, i, layer.thicknessM / 2);
    const backField = fieldAt(input, layers, substrateField, i, layer.thicknessM);
    const front = makeSample(`${layer.id}-front`, "layerFront", positionM, frontField, incidentFluxScale, layer, 0);
    const mid = makeSample(`${layer.id}-mid`, "layerMid", positionM + layer.thicknessM / 2, midField, incidentFluxScale, layer, layer.thicknessM / 2);
    const back = makeSample(`${layer.id}-back`, "layerBack", positionM + layer.thicknessM, backField, incidentFluxScale, layer, layer.thicknessM);
    samples.push(front, mid, back);
    const rawAbsorbedFlux = front.normalizedPoyntingFlux - back.normalizedPoyntingFlux;
    if (rawAbsorbedFlux < -1e-6) {
      warnings.push({
        code: "maxwell.fieldMonitor.negativeLayerAbsorption",
        message: `${layer.label} has negative flux-drop absorption beyond tolerance; verify material signs and stack settings.`,
        elementId: layer.id
      });
    }
    layerFlux.push({
      layerId: layer.id,
      label: layer.label,
      frontPositionM: positionM,
      backPositionM: positionM + layer.thicknessM,
      frontFlux: front.normalizedPoyntingFlux,
      backFlux: back.normalizedPoyntingFlux,
      rawAbsorbedFlux,
      absorbedFlux: Math.max(0, rawAbsorbedFlux)
    });
    positionM += layer.thicknessM;
  }

  samples.push(makeSample("substrate-boundary", "substrateBoundary", totalThicknessM, substrateField, incidentFluxScale));

  const aggregateLayerAbsorbance = layerFlux.reduce((sum, layer) => sum + layer.absorbedFlux, 0);
  const maxElectricIntensity = Math.max(...samples.map((sample) => sample.electricIntensity));
  const maxMagneticIntensity = Math.max(...samples.map((sample) => sample.magneticIntensity));
  if (Math.abs(aggregateLayerAbsorbance - tmm.absorbance) > 5e-4) {
    warnings.push({
      code: "maxwell.fieldMonitor.absorptionMismatch",
      message: `Layer flux-drop absorption ${aggregateLayerAbsorbance.toExponential(3)} differs from aggregate TMM absorbance ${tmm.absorbance.toExponential(3)}.`
    });
  }
  const resultHash = fnv1a64(
    stableStringify({
      analysisId: "analysis.maxwell.l4.phase2.planarFieldMonitor",
      tmmResultHash: tmm.resultHash,
      samples: samples.map((sample) => ({
        id: sample.id,
        e: roundComplex(sample.eTangential),
        h: roundComplex(sample.hTangential),
        flux: roundNumber(sample.normalizedPoyntingFlux)
      })),
      layerFlux: layerFlux.map((layer) => ({
        id: layer.layerId,
        absorbedFlux: roundNumber(layer.absorbedFlux)
      }))
    })
  );

  return {
    id: `${input.id}-field-monitor`,
    type: "planarTmmFieldMonitor",
    analysisId: "analysis.maxwell.l4.phase2.planarFieldMonitor",
    label: `${input.label} planar field monitor`,
    tmmResultHash: tmm.resultHash,
    totalThicknessM,
    samples,
    layerFlux,
    aggregateLayerAbsorbance,
    maxElectricIntensity,
    maxMagneticIntensity,
    warnings: uniqueWarnings(warnings),
    resultHash,
    provenance: {
      label: "planar TMM internal field monitor for complex tangential E/H",
      limitations: [
        "Samples tangential E/H equivalents in a planar multilayer transfer-matrix special case only.",
        "This is not a general 3D Maxwell field solution; not FEM, BEM, RCWA, FDTD, curved optics, CAD geometry, aperture diffraction, or sensor-stack simulation.",
        "Poynting values are normalized flux ratios for the planar stack, not integrated monitor surfaces in 3D.",
        "Per-layer absorption is estimated from front/back planar flux drop, not full volumetric absorption density."
      ]
    }
  };
}

function fieldAt(input: PlanarTmmInput, layers: LayerOptics[], substrateField: FieldVector, layerIndex: number, depthM: number): FieldVector {
  let matrix = identityMatrix();
  const start = Math.max(0, layerIndex);
  if (layerIndex >= 0) {
    const layer = layers[layerIndex];
    if (!layer) throw new Error(`missing layer at index ${layerIndex}`);
    const remainingDepthM = Math.max(0, layer.thicknessM - depthM);
    const remainingDelta = cscale(layer.opticalPhaseFull, remainingDepthM / layer.thicknessM);
    matrix = multiplyMatrix(matrix, characteristicMatrix(remainingDelta, layer.admittance));
  }
  for (let i = layerIndex >= 0 ? start + 1 : 0; i < layers.length; i += 1) {
    const layer = layers[i];
    if (!layer) continue;
    matrix = multiplyMatrix(matrix, characteristicMatrix(layer.opticalPhaseFull, layer.admittance));
  }
  return multiplyMatrixVector(matrix, substrateField);
}

function makeSample(
  id: string,
  kind: PlanarFieldMonitorSampleKind,
  positionM: number,
  field: FieldVector,
  incidentFluxScale: number,
  layer?: LayerOptics,
  depthInLayerM?: number
): PlanarFieldMonitorSample {
  const [eTangential, hTangential] = field;
  const normalizedPoyntingFlux = cmul(eTangential, cconj(hTangential)).re / incidentFluxScale;
  return {
    id,
    kind,
    positionM,
    layerId: layer?.id,
    layerLabel: layer?.label,
    depthInLayerM,
    eTangential,
    hTangential,
    electricMagnitude: cabs(eTangential),
    magneticMagnitude: cabs(hTangential),
    electricIntensity: cabs2(eTangential),
    magneticIntensity: cabs2(hTangential),
    phaseRad: Math.atan2(eTangential.im, eTangential.re),
    normalizedPoyntingFlux
  };
}

function propagationIndex(material: MaxwellMaterialSample): Complex {
  const index = complexIndex(material);
  return complex(index.re, -Math.abs(index.im));
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

function multiplyMatrixVector(matrix: Matrix2, vector: FieldVector): FieldVector {
  return [cadd(cmul(matrix[0][0], vector[0]), cmul(matrix[0][1], vector[1])), cadd(cmul(matrix[1][0], vector[0]), cmul(matrix[1][1], vector[1]))];
}

function roundComplex(value: Complex): Complex {
  return {
    re: roundNumber(value.re),
    im: roundNumber(value.im)
  };
}

function roundNumber(value: number): number {
  return Number(value.toPrecision(12));
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
