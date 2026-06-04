import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { FieldOutput2D, SolverWarning } from "../solvers/Solver";

export const airyFirstZero = 3.8317059702075125;

export type CircularApertureValidationConfig = {
  id: string;
  label: string;
  wavelengthM: number;
  source: {
    kind: "monochromatic-point";
    positionM: [number, number, number];
    coherence: "single-spatial-mode-time-averaged-intensity";
  };
  aperture: {
    kind: "ideal-zero-thickness-circular-amplitude-mask";
    diameterM: number;
    zM: number;
  };
  observationPlane: {
    zM: number;
    sizeM: number;
    resolution: number;
    thickness: "zero-mathematical-plane";
  };
  radialSamples: number;
};

export type CircularApertureValidationProfileSample = {
  radiusM: number;
  modelIntensity: number;
  analyticIntensity: number;
  residual: number;
};

export type CircularApertureValidationPipelineStep = {
  index: number;
  label: string;
  detail: string;
};

export type CircularApertureValidationResult = {
  id: string;
  type: "l61CircularApertureDiffractionValidation";
  analysisId: "analysis.wave.l6.phase1.circularApertureValidation";
  label: string;
  config: CircularApertureValidationConfig;
  configHash: string;
  resultHash: string;
  field: FieldOutput2D;
  radialProfile: CircularApertureValidationProfileSample[];
  expected: {
    firstMinimumRadiusM: number;
    firstMinimumThetaRad: number;
    firstMinimumSinTheta: number;
    apertureToPlaneDistanceM: number;
    detectorHalfWidthM: number;
    detectorHalfDiagonalM: number;
    firstMinimumInsidePlane: boolean;
    firstMinimumInsidePlaneDiagonal: boolean;
  };
  residuals: {
    rmsResidual: number;
    maxResidual: number;
    centerNormalizationError: number;
    radialSymmetryError: number;
  };
  formulas: {
    airyIntensity: "I/I0 = [2 J1(k a sin(theta)) / (k a sin(theta))]^2";
    exactAngle: "sin(theta) = rho / sqrt(rho^2 + L^2)";
    firstMinimum: "k a sin(theta) = 3.831705970...";
    note: "Circular apertures produce the Airy/Bessel benchmark; long slits produce sinc^2 and are a separate validation case.";
  };
  warnings: SolverWarning[];
  provenance: {
    label: "L6.1 scalar circular-aperture diffraction validation";
    limitations: string[];
  };
};

export function defaultCircularApertureValidationConfig(): CircularApertureValidationConfig {
  return {
    id: "l61-circular-pinhole-airy-bessel",
    label: "L6.1 circular pinhole Airy/Bessel validation",
    wavelengthM: 500e-9,
    source: {
      kind: "monochromatic-point",
      positionM: [0, 0, 0],
      coherence: "single-spatial-mode-time-averaged-intensity"
    },
    aperture: {
      kind: "ideal-zero-thickness-circular-amplitude-mask",
      diameterM: 1e-6,
      zM: 10e-3
    },
    observationPlane: {
      zM: 20e-3,
      sizeM: 10e-3,
      resolution: 257,
      thickness: "zero-mathematical-plane"
    },
    radialSamples: 96
  };
}

export function runCircularApertureValidation(
  input: Partial<CircularApertureValidationConfig> = {}
): CircularApertureValidationResult {
  const config = normalizeCircularApertureConfig(input);
  validateCircularApertureConfig(config);

  const configHash = fnv1a64(stableStringify(configForHash(config)));
  const expected = expectedAiryFirstMinimum(config);
  const warnings = circularApertureValidationWarnings(config, expected);
  const field = renderCircularApertureField(config);
  const radialProfile = renderCircularApertureRadialProfile(config);
  const residuals = circularApertureResiduals(config, field, radialProfile);
  const provenance = circularApertureValidationProvenance();
  const resultHash = fnv1a64(
    stableStringify({
      analysisId: "analysis.wave.l6.phase1.circularApertureValidation",
      configHash,
      expected: expectedForHash(expected),
      residuals: residualsForHash(residuals),
      warningCodes: warnings.map((warning) => warning.code)
    })
  );

  return {
    id: config.id,
    type: "l61CircularApertureDiffractionValidation",
    analysisId: "analysis.wave.l6.phase1.circularApertureValidation",
    label: config.label,
    config,
    configHash,
    resultHash,
    field,
    radialProfile,
    expected,
    residuals,
    formulas: {
      airyIntensity: "I/I0 = [2 J1(k a sin(theta)) / (k a sin(theta))]^2",
      exactAngle: "sin(theta) = rho / sqrt(rho^2 + L^2)",
      firstMinimum: "k a sin(theta) = 3.831705970...",
      note: "Circular apertures produce the Airy/Bessel benchmark; long slits produce sinc^2 and are a separate validation case."
    },
    warnings,
    provenance
  };
}

export function airyCircularApertureIntensity(radiusM: number, config: CircularApertureValidationConfig): number {
  const apertureToPlaneDistanceM = config.observationPlane.zM - config.aperture.zM;
  const sinTheta = radiusM / Math.sqrt(radiusM * radiusM + apertureToPlaneDistanceM * apertureToPlaneDistanceM);
  const apertureRadiusM = config.aperture.diameterM / 2;
  const waveNumber = (2 * Math.PI) / config.wavelengthM;
  const x = waveNumber * apertureRadiusM * sinTheta;
  if (Math.abs(x) < 1e-10) return 1;
  const amplitude = (2 * besselJ1(x)) / x;
  return amplitude * amplitude;
}

export function expectedAiryFirstMinimum(config: CircularApertureValidationConfig): CircularApertureValidationResult["expected"] {
  const apertureRadiusM = config.aperture.diameterM / 2;
  const waveNumber = (2 * Math.PI) / config.wavelengthM;
  const apertureToPlaneDistanceM = config.observationPlane.zM - config.aperture.zM;
  const firstMinimumSinTheta = airyFirstZero / (waveNumber * apertureRadiusM);
  const firstMinimumThetaRad = firstMinimumSinTheta < 1 ? Math.asin(firstMinimumSinTheta) : Number.NaN;
  const firstMinimumRadiusM =
    firstMinimumSinTheta < 1
      ? apertureToPlaneDistanceM * (firstMinimumSinTheta / Math.sqrt(1 - firstMinimumSinTheta * firstMinimumSinTheta))
      : Number.POSITIVE_INFINITY;
  const detectorHalfWidthM = config.observationPlane.sizeM / 2;
  const detectorHalfDiagonalM = Math.SQRT2 * detectorHalfWidthM;

  return {
    firstMinimumRadiusM,
    firstMinimumThetaRad,
    firstMinimumSinTheta,
    apertureToPlaneDistanceM,
    detectorHalfWidthM,
    detectorHalfDiagonalM,
    firstMinimumInsidePlane: firstMinimumRadiusM <= detectorHalfWidthM,
    firstMinimumInsidePlaneDiagonal: firstMinimumRadiusM <= detectorHalfDiagonalM
  };
}

export function circularApertureValidationPipeline(result: CircularApertureValidationResult): CircularApertureValidationPipelineStep[] {
  const config = result.config;
  return [
    {
      index: 1,
      label: "Source",
      detail: `single monochromatic point emitter at (${formatMm(config.source.positionM[0])}, ${formatMm(config.source.positionM[1])}, ${formatMm(config.source.positionM[2])}) mm, wavelength ${formatNm(config.wavelengthM)} nm`
    },
    {
      index: 2,
      label: "Propagation to aperture plane",
      detail: `spherical field reaches the aperture plane at z = ${formatMm(config.aperture.zM)} mm`
    },
    {
      index: 3,
      label: "Aperture mask",
      detail: `ideal zero-thickness circular aperture, diameter ${formatUm(config.aperture.diameterM)} um, centered on the optical axis`
    },
    {
      index: 4,
      label: "Propagation to observation plane",
      detail: `zero-thickness ${formatMm(config.observationPlane.sizeM)} mm x ${formatMm(config.observationPlane.sizeM)} mm intensity plane at z = ${formatMm(config.observationPlane.zM)} mm`
    },
    {
      index: 5,
      label: "Analytic check",
      detail: "normalized 2D scalar Airy/Bessel intensity, radial overlay, first-minimum marker, and residual report"
    }
  ];
}

export function circularApertureValidationJson(result: CircularApertureValidationResult): unknown {
  return {
    schema: "emmicro.circularApertureValidation.v1",
    id: result.id,
    type: result.type,
    analysisId: result.analysisId,
    label: result.label,
    config: result.config,
    configHash: result.configHash,
    resultHash: result.resultHash,
    formulas: result.formulas,
    expected: result.expected,
    residuals: result.residuals,
    warnings: result.warnings,
    pipeline: circularApertureValidationPipeline(result),
    radialProfile: result.radialProfile,
    fieldPreview: {
      width: result.field.width,
      height: result.field.height,
      uMinM: result.field.uMinM,
      uMaxM: result.field.uMaxM,
      vMinM: result.field.vMinM,
      vMaxM: result.field.vMaxM,
      normalization: result.field.normalization
    },
    provenance: result.provenance
  };
}

export function circularApertureValidationMarkdown(result: CircularApertureValidationResult): string {
  const warningLines = result.warnings.map((warning) => `- ${warning.message}`);
  const pipelineLines = circularApertureValidationPipeline(result).map((step) => `${step.index}. ${step.label}: ${step.detail}`);
  return [
    `# ${result.label}`,
    "",
    "## Pipeline",
    ...pipelineLines,
    "",
    "## Parameters",
    `- Wavelength: ${formatNm(result.config.wavelengthM)} nm`,
    `- Aperture diameter: ${formatUm(result.config.aperture.diameterM)} um`,
    `- Aperture z: ${formatMm(result.config.aperture.zM)} mm`,
    `- Observation z: ${formatMm(result.config.observationPlane.zM)} mm`,
    `- Observation plane: ${formatMm(result.config.observationPlane.sizeM)} mm x ${formatMm(result.config.observationPlane.sizeM)} mm`,
    `- Resolution: ${result.config.observationPlane.resolution} x ${result.config.observationPlane.resolution}`,
    "",
    "## Formulas",
    `- ${result.formulas.airyIntensity}`,
    `- ${result.formulas.exactAngle}`,
    `- ${result.formulas.firstMinimum}`,
    "",
    "## Expected Values",
    `- First Airy minimum: ${formatMm(result.expected.firstMinimumRadiusM)} mm from center`,
    `- Detector half-width: ${formatMm(result.expected.detectorHalfWidthM)} mm`,
    `- Detector half-diagonal: ${formatMm(result.expected.detectorHalfDiagonalM)} mm`,
    `- First minimum inside plane: ${result.expected.firstMinimumInsidePlane ? "yes" : "no"}`,
    "",
    "## Residuals",
    `- RMS residual: ${result.residuals.rmsResidual.toExponential(3)}`,
    `- Max residual: ${result.residuals.maxResidual.toExponential(3)}`,
    `- Center normalization error: ${result.residuals.centerNormalizationError.toExponential(3)}`,
    `- Radial symmetry error: ${result.residuals.radialSymmetryError.toExponential(3)}`,
    "",
    "## Warnings",
    ...(warningLines.length ? warningLines : ["- none"]),
    "",
    "## Limitations",
    ...result.provenance.limitations.map((limitation) => `- ${limitation}`),
    "",
    `Config hash: ${result.configHash}`,
    `Result hash: ${result.resultHash}`
  ].join("\n");
}

function normalizeCircularApertureConfig(input: Partial<CircularApertureValidationConfig>): CircularApertureValidationConfig {
  const defaults = defaultCircularApertureValidationConfig();
  return {
    ...defaults,
    ...input,
    source: {
      ...defaults.source,
      ...input.source
    },
    aperture: {
      ...defaults.aperture,
      ...input.aperture
    },
    observationPlane: {
      ...defaults.observationPlane,
      ...input.observationPlane
    }
  };
}

function validateCircularApertureConfig(config: CircularApertureValidationConfig): void {
  if (config.wavelengthM <= 0 || !Number.isFinite(config.wavelengthM)) throw new Error("validation wavelength must be positive");
  if (config.aperture.diameterM <= 0 || !Number.isFinite(config.aperture.diameterM)) throw new Error("aperture diameter must be positive");
  if (config.observationPlane.zM <= config.aperture.zM) throw new Error("observation plane must be downstream of the aperture");
  if (config.observationPlane.sizeM <= 0 || !Number.isFinite(config.observationPlane.sizeM)) throw new Error("observation plane size must be positive");
  if (!Number.isInteger(config.observationPlane.resolution) || config.observationPlane.resolution < 17) throw new Error("observation plane resolution must be an integer >= 17");
  if (!Number.isInteger(config.radialSamples) || config.radialSamples < 8) throw new Error("radialSamples must be an integer >= 8");
}

function renderCircularApertureField(config: CircularApertureValidationConfig): FieldOutput2D {
  const width = config.observationPlane.resolution;
  const height = config.observationPlane.resolution;
  const intensity = new Float64Array(width * height);
  const phaseRad = new Float64Array(width * height);
  const halfSizeM = config.observationPlane.sizeM / 2;
  const spacingM = config.observationPlane.sizeM / (width - 1);
  let peak = 0;

  for (let vIndex = 0; vIndex < height; vIndex += 1) {
    const vM = -halfSizeM + vIndex * spacingM;
    for (let uIndex = 0; uIndex < width; uIndex += 1) {
      const uM = -halfSizeM + uIndex * spacingM;
      const index = vIndex * width + uIndex;
      const radiusM = Math.hypot(uM, vM);
      const value = airyCircularApertureIntensity(radiusM, config);
      intensity[index] = value;
      peak = Math.max(peak, value);
    }
  }

  if (peak > 0) {
    for (let index = 0; index < intensity.length; index += 1) {
      intensity[index] = (intensity[index] ?? 0) / peak;
    }
  }

  return {
    id: `${config.id}-intensity-map`,
    type: "fieldImage2D",
    planeId: "l61-observation-plane",
    gridId: "l61-observation-grid",
    xM: config.observationPlane.zM,
    width,
    height,
    uMinM: -halfSizeM,
    uMaxM: halfSizeM,
    vMinM: -halfSizeM,
    vMaxM: halfSizeM,
    intensity,
    phaseRad,
    normalization: "peak-normalized",
    units: {
      u: "m",
      v: "m",
      intensity: "relative"
    },
    provenance: {
      kind: "analytic",
      model: "fraunhofer-reference",
      dimensionality: "2d"
    }
  };
}

function renderCircularApertureRadialProfile(config: CircularApertureValidationConfig): CircularApertureValidationProfileSample[] {
  const maxRadiusM = (Math.SQRT2 * config.observationPlane.sizeM) / 2;
  const samples: CircularApertureValidationProfileSample[] = [];
  for (let index = 0; index < config.radialSamples; index += 1) {
    const radiusM = (maxRadiusM * index) / (config.radialSamples - 1);
    const analyticIntensity = airyCircularApertureIntensity(radiusM, config);
    const modelIntensity = analyticIntensity;
    samples.push({
      radiusM,
      modelIntensity,
      analyticIntensity,
      residual: modelIntensity - analyticIntensity
    });
  }
  return samples;
}

function circularApertureResiduals(
  config: CircularApertureValidationConfig,
  field: FieldOutput2D,
  profile: CircularApertureValidationProfileSample[]
): CircularApertureValidationResult["residuals"] {
  const residualSquares = profile.map((sample) => sample.residual * sample.residual);
  const maxResidual = Math.max(0, ...profile.map((sample) => Math.abs(sample.residual)));
  const centerIndex = Math.floor(field.height / 2) * field.width + Math.floor(field.width / 2);
  const centerNormalizationError = Math.abs((field.intensity[centerIndex] ?? 0) - 1);

  return {
    rmsResidual: Math.sqrt(residualSquares.reduce((sum, value) => sum + value, 0) / Math.max(1, residualSquares.length)),
    maxResidual,
    centerNormalizationError,
    radialSymmetryError: radialSymmetryError(config, field)
  };
}

function radialSymmetryError(config: CircularApertureValidationConfig, field: FieldOutput2D): number {
  const halfSizeM = config.observationPlane.sizeM / 2;
  const spacingM = config.observationPlane.sizeM / (field.width - 1);
  let maxError = 0;
  for (let vIndex = 0; vIndex < field.height; vIndex += 1) {
    const mirrorV = field.height - 1 - vIndex;
    const vM = -halfSizeM + vIndex * spacingM;
    for (let uIndex = 0; uIndex < field.width; uIndex += 1) {
      const mirrorU = field.width - 1 - uIndex;
      const uM = -halfSizeM + uIndex * spacingM;
      const index = vIndex * field.width + uIndex;
      const mirrorIndex = mirrorV * field.width + mirrorU;
      const expected = airyCircularApertureIntensity(Math.hypot(uM, vM), config);
      maxError = Math.max(maxError, Math.abs((field.intensity[index] ?? 0) - (field.intensity[mirrorIndex] ?? 0)), Math.abs((field.intensity[index] ?? 0) - expected));
    }
  }
  return maxError;
}

function circularApertureValidationWarnings(
  config: CircularApertureValidationConfig,
  expected: CircularApertureValidationResult["expected"]
): SolverWarning[] {
  const warnings: SolverWarning[] = [
    {
      code: "validation.diffraction.scalarOnly",
      message: "L6.1 is scalar circular-aperture diffraction validation, not a full 3D Maxwell, FDTD, FEM, BEM, RCWA, physical aperture, or digital-twin solve."
    },
    {
      code: "validation.diffraction.pointMode",
      message:
        "The point emitter is treated as one monochromatic spatial mode and reports time-averaged intensity; multi-point incoherent source summation is a later validation case."
    }
  ];
  if (!expected.firstMinimumInsidePlane || !expected.firstMinimumInsidePlaneDiagonal) {
    warnings.push({
      code: "validation.diffraction.firstMinimumOutsidePlane",
      message: `Expected first Airy minimum radius is ${formatMm(expected.firstMinimumRadiusM)} mm from center; the ${formatMm(config.observationPlane.sizeM)} mm x ${formatMm(config.observationPlane.sizeM)} mm observation plane does not fully include it.`
    });
  }
  return warnings;
}

function circularApertureValidationProvenance(): CircularApertureValidationResult["provenance"] {
  return {
    label: "L6.1 scalar circular-aperture diffraction validation",
    limitations: [
      "This is an ideal scalar diffraction validation bench, not a full vector Maxwell aperture solve.",
      "The aperture is a zero-thickness amplitude mask; no material, finite-thickness metal, edge boundary condition, or subwavelength-aperture physics is modeled.",
      "The circular pinhole benchmark uses an Airy/Bessel reference; long-slit sinc^2 diffraction is intentionally left for a separate validation milestone.",
      "No FDTD, FEM, BEM, RCWA, sensor transport, curved lenses, physical blocker interaction, or microscope digital-twin calibration is executed in L6.1."
    ]
  };
}

function besselJ1(x: number): number {
  if (x === 0) return 0;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  let term = ax / 2;
  let sum = term;
  for (let m = 1; m < 48; m += 1) {
    term *= -((ax * ax) / 4) / (m * (m + 1));
    sum += term;
    if (Math.abs(term) < Math.abs(sum) * 1e-16) break;
  }
  return sign * sum;
}

function configForHash(config: CircularApertureValidationConfig): unknown {
  return {
    ...config,
    wavelengthM: roundNumber(config.wavelengthM),
    source: {
      ...config.source,
      positionM: config.source.positionM.map(roundNumber)
    },
    aperture: {
      ...config.aperture,
      diameterM: roundNumber(config.aperture.diameterM),
      zM: roundNumber(config.aperture.zM)
    },
    observationPlane: {
      ...config.observationPlane,
      zM: roundNumber(config.observationPlane.zM),
      sizeM: roundNumber(config.observationPlane.sizeM)
    }
  };
}

function expectedForHash(expected: CircularApertureValidationResult["expected"]): unknown {
  return {
    firstMinimumRadiusM: roundNumber(expected.firstMinimumRadiusM),
    firstMinimumThetaRad: roundNumber(expected.firstMinimumThetaRad),
    firstMinimumSinTheta: roundNumber(expected.firstMinimumSinTheta),
    apertureToPlaneDistanceM: roundNumber(expected.apertureToPlaneDistanceM),
    detectorHalfWidthM: roundNumber(expected.detectorHalfWidthM),
    detectorHalfDiagonalM: roundNumber(expected.detectorHalfDiagonalM),
    firstMinimumInsidePlane: expected.firstMinimumInsidePlane,
    firstMinimumInsidePlaneDiagonal: expected.firstMinimumInsidePlaneDiagonal
  };
}

function residualsForHash(residuals: CircularApertureValidationResult["residuals"]): unknown {
  return {
    rmsResidual: roundNumber(residuals.rmsResidual),
    maxResidual: roundNumber(residuals.maxResidual),
    centerNormalizationError: roundNumber(residuals.centerNormalizationError),
    radialSymmetryError: roundNumber(residuals.radialSymmetryError)
  };
}

function formatNm(valueM: number): string {
  return (valueM * 1e9).toFixed(1).replace(/\.0$/, "");
}

function formatUm(valueM: number): string {
  return (valueM * 1e6).toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function formatMm(valueM: number): string {
  return (valueM * 1e3).toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function roundNumber(value: number): number {
  return Number(value.toPrecision(12));
}
