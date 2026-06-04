import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { FieldOutput2D, SolverWarning } from "../solvers/Solver";

export const airyFirstZero = 3.8317059702075125;

export type CircularApertureComputationMode = "analytic-reference" | "numerical-scalar-propagation" | "compare-numerical-analytic";

export type CircularApertureNumericalSettings = {
  method: "radial-huygens-fresnel-quadrature";
  apertureRadialSamples: number;
  apertureAngularSamples: number;
  radialObservationSamples: number;
};

export type CircularApertureValidationConfig = {
  id: string;
  label: string;
  computationMode: CircularApertureComputationMode;
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
  numerical: CircularApertureNumericalSettings;
};

export type CircularApertureValidationProfileSample = {
  radiusM: number;
  modelIntensity: number;
  numericalIntensity: number;
  analyticIntensity: number;
  residual: number;
  residualAbs: number;
};

export type CircularApertureValidationPipelineStep = {
  index: number;
  label: string;
  detail: string;
};

export type CircularApertureValidationResult = {
  id: string;
  type: "l62NumericalScalarPropagationValidation";
  analysisId: "analysis.wave.l6.phase2.numericalScalarPropagationValidation";
  label: string;
  config: CircularApertureValidationConfig;
  configHash: string;
  resultHash: string;
  field: FieldOutput2D;
  numericalField: FieldOutput2D;
  analyticField: FieldOutput2D;
  residualField: FieldOutput2D;
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
  comparison: {
    numericalMethod: CircularApertureNumericalSettings["method"];
    numericalIndependentOfAnalyticReference: true;
    apertureRadialSamples: number;
    apertureAngularSamples: number;
    radialObservationSamples: number;
    observationResolution: number;
    apertureRadialSpacingM: number;
    observationPixelSpacingM: number;
    measuredFirstMinimumRadiusM: number | null;
    firstMinimumErrorM: number | null;
    firstMinimumSearchStatus: "outside-plane" | "measured" | "not-resolved";
    energy: {
      apertureAreaM2: number;
      numericalPlaneIntegral: number;
      analyticPlaneIntegral: number;
      relativePlaneIntegralError: number;
      normalization: "peak-normalized finite-plane intensity integral";
      note: string;
    };
  };
  residuals: {
    rmsResidual: number;
    maxResidual: number;
    centerNormalizationError: number;
    radialSymmetryError: number;
    firstMinimumErrorM: number | null;
    finitePlaneIntegralRelativeError: number;
  };
  formulas: {
    airyIntensity: "I/I0 = [2 J1(k a sin(theta)) / (k a sin(theta))]^2";
    exactAngle: "sin(theta) = rho / sqrt(rho^2 + L^2)";
    firstMinimum: "k a sin(theta) = 3.831705970...";
    numericalPropagation: "U(rho) ~= integral_aperture exp(i k (R - L)) r dr dphi";
    note: "Circular apertures produce the Airy/Bessel benchmark; long slits produce sinc^2 and are a separate validation case.";
  };
  warnings: SolverWarning[];
  provenance: {
    label: "L6.2 numerical scalar propagation validation";
    limitations: string[];
  };
};

type NumericalRadialSample = {
  radiusM: number;
  numericalIntensity: number;
  analyticIntensity: number;
};

type MapKind = "numerical" | "analytic" | "residual";

export function defaultCircularApertureValidationConfig(): CircularApertureValidationConfig {
  return {
    id: "l62-circular-pinhole-numerical-scalar-propagation",
    label: "L6.2 circular pinhole numerical scalar propagation validation",
    computationMode: "compare-numerical-analytic",
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
    radialSamples: 128,
    numerical: {
      method: "radial-huygens-fresnel-quadrature",
      apertureRadialSamples: 48,
      apertureAngularSamples: 96,
      radialObservationSamples: 128
    }
  };
}

export function runCircularApertureValidation(
  input: Partial<CircularApertureValidationConfig> = {}
): CircularApertureValidationResult {
  const config = normalizeCircularApertureConfig(input);
  validateCircularApertureConfig(config);

  const configHash = fnv1a64(stableStringify(configForHash(config)));
  const expected = expectedAiryFirstMinimum(config);
  const numericalProfile = computeNumericalPropagationProfile(config);
  const radialProfile = renderCircularApertureRadialProfile(config, numericalProfile);
  const analyticField = renderCircularApertureField(config, radialProfile, "analytic");
  const numericalField = renderCircularApertureField(config, radialProfile, "numerical");
  const residuals = circularApertureResiduals(config, numericalField, radialProfile);
  const residualField = renderCircularApertureField(config, radialProfile, "residual", residuals.maxResidual);
  const comparison = circularApertureComparison(config, radialProfile, expected, residuals, numericalField, analyticField);
  const warnings = circularApertureValidationWarnings(config, expected, comparison);
  const provenance = circularApertureValidationProvenance();
  const resultHash = fnv1a64(
    stableStringify({
      analysisId: "analysis.wave.l6.phase2.numericalScalarPropagationValidation",
      configHash,
      expected: expectedForHash(expected),
      residuals: residualsForHash(residuals),
      comparison: comparisonForHash(comparison),
      warningCodes: warnings.map((warning) => warning.code)
    })
  );

  return {
    id: config.id,
    type: "l62NumericalScalarPropagationValidation",
    analysisId: "analysis.wave.l6.phase2.numericalScalarPropagationValidation",
    label: config.label,
    config,
    configHash,
    resultHash,
    field: numericalField,
    numericalField,
    analyticField,
    residualField,
    radialProfile,
    expected,
    comparison,
    residuals,
    formulas: {
      airyIntensity: "I/I0 = [2 J1(k a sin(theta)) / (k a sin(theta))]^2",
      exactAngle: "sin(theta) = rho / sqrt(rho^2 + L^2)",
      firstMinimum: "k a sin(theta) = 3.831705970...",
      numericalPropagation: "U(rho) ~= integral_aperture exp(i k (R - L)) r dr dphi",
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
      label: "Independent numerical propagation",
      detail: `${config.numerical.method} with ${config.numerical.apertureRadialSamples} radial x ${config.numerical.apertureAngularSamples} angular aperture samples`
    },
    {
      index: 5,
      label: "Observation plane",
      detail: `zero-thickness ${formatMm(config.observationPlane.sizeM)} mm x ${formatMm(config.observationPlane.sizeM)} mm intensity plane at z = ${formatMm(config.observationPlane.zM)} mm`
    },
    {
      index: 6,
      label: "Analytic check",
      detail: "numerical map, analytic Airy/Bessel reference map, residual map, radial overlay, first-minimum marker, and mismatch report"
    }
  ];
}

export function circularApertureValidationJson(result: CircularApertureValidationResult): unknown {
  return {
    schema: "emmicro.circularApertureValidation.v2",
    id: result.id,
    type: result.type,
    analysisId: result.analysisId,
    label: result.label,
    config: result.config,
    configHash: result.configHash,
    resultHash: result.resultHash,
    formulas: result.formulas,
    expected: result.expected,
    comparison: result.comparison,
    residuals: result.residuals,
    warnings: result.warnings,
    pipeline: circularApertureValidationPipeline(result),
    radialProfile: result.radialProfile,
    fieldPreview: fieldPreview(result.field),
    analyticFieldPreview: fieldPreview(result.analyticField),
    numericalFieldPreview: fieldPreview(result.numericalField),
    residualFieldPreview: fieldPreview(result.residualField),
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
    `- Computation mode: ${result.config.computationMode}`,
    `- Wavelength: ${formatNm(result.config.wavelengthM)} nm`,
    `- Aperture diameter: ${formatUm(result.config.aperture.diameterM)} um`,
    `- Aperture z: ${formatMm(result.config.aperture.zM)} mm`,
    `- Observation z: ${formatMm(result.config.observationPlane.zM)} mm`,
    `- Observation plane: ${formatMm(result.config.observationPlane.sizeM)} mm x ${formatMm(result.config.observationPlane.sizeM)} mm`,
    `- Observation map resolution: ${result.config.observationPlane.resolution} x ${result.config.observationPlane.resolution}`,
    `- Numerical method: ${result.comparison.numericalMethod}`,
    `- Aperture samples: ${result.comparison.apertureRadialSamples} radial x ${result.comparison.apertureAngularSamples} angular`,
    `- Radial observation samples: ${result.comparison.radialObservationSamples}`,
    "",
    "## Formulas",
    `- ${result.formulas.airyIntensity}`,
    `- ${result.formulas.exactAngle}`,
    `- ${result.formulas.firstMinimum}`,
    `- ${result.formulas.numericalPropagation}`,
    "",
    "## Expected Values",
    `- First Airy minimum: ${formatMm(result.expected.firstMinimumRadiusM)} mm from center`,
    `- Detector half-width: ${formatMm(result.expected.detectorHalfWidthM)} mm`,
    `- Detector half-diagonal: ${formatMm(result.expected.detectorHalfDiagonalM)} mm`,
    `- First minimum inside plane: ${result.expected.firstMinimumInsidePlane ? "yes" : "no"}`,
    "",
    "## Numerical Comparison",
    `- Numerical path independent of analytic Airy renderer: ${result.comparison.numericalIndependentOfAnalyticReference ? "yes" : "no"}`,
    `- Measured first minimum: ${result.comparison.measuredFirstMinimumRadiusM === null ? result.comparison.firstMinimumSearchStatus : `${formatMm(result.comparison.measuredFirstMinimumRadiusM)} mm`}`,
    `- First-minimum error: ${result.comparison.firstMinimumErrorM === null ? "n/a" : `${formatMm(result.comparison.firstMinimumErrorM)} mm`}`,
    `- Numerical plane integral: ${result.comparison.energy.numericalPlaneIntegral.toExponential(3)}`,
    `- Analytic plane integral: ${result.comparison.energy.analyticPlaneIntegral.toExponential(3)}`,
    `- Finite-plane integral relative error: ${result.comparison.energy.relativePlaneIntegralError.toExponential(3)}`,
    `- Energy note: ${result.comparison.energy.note}`,
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
    },
    numerical: {
      ...defaults.numerical,
      ...input.numerical
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
  if (config.numerical.method !== "radial-huygens-fresnel-quadrature") throw new Error("unsupported numerical scalar propagation method");
  if (!Number.isInteger(config.numerical.apertureRadialSamples) || config.numerical.apertureRadialSamples < 4) {
    throw new Error("apertureRadialSamples must be an integer >= 4");
  }
  if (!Number.isInteger(config.numerical.apertureAngularSamples) || config.numerical.apertureAngularSamples < 12) {
    throw new Error("apertureAngularSamples must be an integer >= 12");
  }
  if (!Number.isInteger(config.numerical.radialObservationSamples) || config.numerical.radialObservationSamples < 16) {
    throw new Error("radialObservationSamples must be an integer >= 16");
  }
}

function computeNumericalPropagationProfile(config: CircularApertureValidationConfig): NumericalRadialSample[] {
  const maxRadiusM = (Math.SQRT2 * config.observationPlane.sizeM) / 2;
  const sampleCount = config.numerical.radialObservationSamples;
  const raw = new Float64Array(sampleCount);
  let peak = 0;

  for (let index = 0; index < sampleCount; index += 1) {
    const radiusM = (maxRadiusM * index) / (sampleCount - 1);
    const intensity = numericalScalarPropagationIntensity(radiusM, config);
    raw[index] = intensity;
    peak = Math.max(peak, intensity);
  }

  const safePeak = peak > 0 ? peak : 1;
  const samples: NumericalRadialSample[] = [];
  for (let index = 0; index < sampleCount; index += 1) {
    const radiusM = (maxRadiusM * index) / (sampleCount - 1);
    samples.push({
      radiusM,
      numericalIntensity: (raw[index] ?? 0) / safePeak,
      analyticIntensity: airyCircularApertureIntensity(radiusM, config)
    });
  }
  return samples;
}

function numericalScalarPropagationIntensity(radiusM: number, config: CircularApertureValidationConfig): number {
  const apertureRadiusM = config.aperture.diameterM / 2;
  const propagationDistanceM = config.observationPlane.zM - config.aperture.zM;
  const waveNumber = (2 * Math.PI) / config.wavelengthM;
  const radialSamples = config.numerical.apertureRadialSamples;
  const angularSamples = config.numerical.apertureAngularSamples;
  const apertureRadialStepM = apertureRadiusM / radialSamples;
  const apertureAngularStepRad = (2 * Math.PI) / angularSamples;
  let real = 0;
  let imag = 0;

  for (let radialIndex = 0; radialIndex < radialSamples; radialIndex += 1) {
    const apertureRadiusSampleM = (radialIndex + 0.5) * apertureRadialStepM;
    const radialWeight = apertureRadiusSampleM * apertureRadialStepM * apertureAngularStepRad;
    for (let angularIndex = 0; angularIndex < angularSamples; angularIndex += 1) {
      const phi = (angularIndex + 0.5) * apertureAngularStepRad;
      const apertureU = apertureRadiusSampleM * Math.cos(phi);
      const propagationPathM = Math.sqrt(
        propagationDistanceM * propagationDistanceM +
          radiusM * radiusM +
          apertureRadiusSampleM * apertureRadiusSampleM -
          2 * radiusM * apertureU
      );
      const phaseRad = waveNumber * (propagationPathM - propagationDistanceM);
      real += Math.cos(phaseRad) * radialWeight;
      imag += Math.sin(phaseRad) * radialWeight;
    }
  }

  return real * real + imag * imag;
}

function renderCircularApertureRadialProfile(
  config: CircularApertureValidationConfig,
  numericalProfile: NumericalRadialSample[]
): CircularApertureValidationProfileSample[] {
  const maxRadiusM = (Math.SQRT2 * config.observationPlane.sizeM) / 2;
  const samples: CircularApertureValidationProfileSample[] = [];
  for (let index = 0; index < config.radialSamples; index += 1) {
    const radiusM = (maxRadiusM * index) / (config.radialSamples - 1);
    const numericalIntensity = interpolateNumericalProfile(numericalProfile, radiusM);
    const analyticIntensity = airyCircularApertureIntensity(radiusM, config);
    const residual = numericalIntensity - analyticIntensity;
    samples.push({
      radiusM,
      modelIntensity: numericalIntensity,
      numericalIntensity,
      analyticIntensity,
      residual,
      residualAbs: Math.abs(residual)
    });
  }
  return samples;
}

function renderCircularApertureField(
  config: CircularApertureValidationConfig,
  profile: CircularApertureValidationProfileSample[],
  kind: MapKind,
  maxResidual = 0
): FieldOutput2D {
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
      const value = fieldValueAtRadius(profile, radiusM, kind, maxResidual);
      intensity[index] = value;
      peak = Math.max(peak, value);
    }
  }

  if (kind !== "residual" && peak > 0) {
    for (let index = 0; index < intensity.length; index += 1) {
      intensity[index] = (intensity[index] ?? 0) / peak;
    }
  }

  return {
    id: `${config.id}-${kind}-intensity-map`,
    type: "fieldImage2D",
    planeId: "l62-observation-plane",
    gridId: "l62-observation-grid",
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
    provenance:
      kind === "analytic"
        ? {
            kind: "analytic",
            model: "fraunhofer-reference",
            dimensionality: "2d"
          }
        : kind === "numerical"
          ? {
              kind: "simulated",
              level: "L2",
              solverId: "scalar.angularSpectrum.l2.1d",
              model: "scalar-wave-2d-angular-spectrum",
              dimensionality: "2d",
              approximation: [
                "radial Huygens-Fresnel scalar quadrature over an ideal circular aperture",
                "zero-thickness amplitude mask",
                "2D map rendered from the independently computed radial numerical field"
              ]
            }
          : {
              kind: "estimated",
              model: "sampling-risk",
              dimensionality: "2d"
            }
  };
}

function fieldValueAtRadius(
  profile: CircularApertureValidationProfileSample[],
  radiusM: number,
  kind: MapKind,
  maxResidual: number
): number {
  const sample = interpolateProfile(profile, radiusM);
  if (kind === "numerical") return sample.numericalIntensity;
  if (kind === "analytic") return sample.analyticIntensity;
  return maxResidual > 0 ? Math.abs(sample.residual) / maxResidual : 0;
}

function interpolateNumericalProfile(profile: NumericalRadialSample[], radiusM: number): number {
  if (profile.length === 0) return 0;
  if (radiusM <= profile[0]!.radiusM) return profile[0]!.numericalIntensity;
  const last = profile[profile.length - 1]!;
  if (radiusM >= last.radiusM) return last.numericalIntensity;
  const spacingM = last.radiusM / (profile.length - 1);
  const lower = Math.max(0, Math.min(profile.length - 2, Math.floor(radiusM / spacingM)));
  const left = profile[lower]!;
  const right = profile[lower + 1]!;
  const span = right.radiusM - left.radiusM;
  const t = span > 0 ? (radiusM - left.radiusM) / span : 0;
  return left.numericalIntensity + (right.numericalIntensity - left.numericalIntensity) * t;
}

function interpolateProfile(profile: CircularApertureValidationProfileSample[], radiusM: number): CircularApertureValidationProfileSample {
  if (profile.length === 0) {
    return {
      radiusM,
      modelIntensity: 0,
      numericalIntensity: 0,
      analyticIntensity: 0,
      residual: 0,
      residualAbs: 0
    };
  }
  if (radiusM <= profile[0]!.radiusM) return profile[0]!;
  const last = profile[profile.length - 1]!;
  if (radiusM >= last.radiusM) return last;
  const spacingM = last.radiusM / (profile.length - 1);
  const lower = Math.max(0, Math.min(profile.length - 2, Math.floor(radiusM / spacingM)));
  const left = profile[lower]!;
  const right = profile[lower + 1]!;
  const span = right.radiusM - left.radiusM;
  const t = span > 0 ? (radiusM - left.radiusM) / span : 0;
  const numericalIntensity = left.numericalIntensity + (right.numericalIntensity - left.numericalIntensity) * t;
  const analyticIntensity = left.analyticIntensity + (right.analyticIntensity - left.analyticIntensity) * t;
  const residual = numericalIntensity - analyticIntensity;
  return {
    radiusM,
    modelIntensity: numericalIntensity,
    numericalIntensity,
    analyticIntensity,
    residual,
    residualAbs: Math.abs(residual)
  };
}

function circularApertureResiduals(
  config: CircularApertureValidationConfig,
  numericalField: FieldOutput2D,
  profile: CircularApertureValidationProfileSample[]
): CircularApertureValidationResult["residuals"] {
  const residualSquares = profile.map((sample) => sample.residual * sample.residual);
  const maxResidual = Math.max(0, ...profile.map((sample) => Math.abs(sample.residual)));
  const centerIndex = Math.floor(numericalField.height / 2) * numericalField.width + Math.floor(numericalField.width / 2);
  const centerNormalizationError = Math.abs((numericalField.intensity[centerIndex] ?? 0) - 1);
  const firstMinimum = expectedAiryFirstMinimum(config);
  const measured = measureFirstMinimum(config, profile, firstMinimum);
  const finitePlane = finitePlaneIntegralComparison(config, numericalField, renderCircularApertureField(config, profile, "analytic"));

  return {
    rmsResidual: Math.sqrt(residualSquares.reduce((sum, value) => sum + value, 0) / Math.max(1, residualSquares.length)),
    maxResidual,
    centerNormalizationError,
    radialSymmetryError: radialSymmetryError(config, numericalField),
    firstMinimumErrorM: measured.radiusM === null ? null : Math.abs(measured.radiusM - firstMinimum.firstMinimumRadiusM),
    finitePlaneIntegralRelativeError: finitePlane.relativePlaneIntegralError
  };
}

function circularApertureComparison(
  config: CircularApertureValidationConfig,
  profile: CircularApertureValidationProfileSample[],
  expected: CircularApertureValidationResult["expected"],
  residuals: CircularApertureValidationResult["residuals"],
  numericalField: FieldOutput2D,
  analyticField: FieldOutput2D
): CircularApertureValidationResult["comparison"] {
  const measured = measureFirstMinimum(config, profile, expected);
  const energy = finitePlaneIntegralComparison(config, numericalField, analyticField);
  return {
    numericalMethod: config.numerical.method,
    numericalIndependentOfAnalyticReference: true,
    apertureRadialSamples: config.numerical.apertureRadialSamples,
    apertureAngularSamples: config.numerical.apertureAngularSamples,
    radialObservationSamples: config.numerical.radialObservationSamples,
    observationResolution: config.observationPlane.resolution,
    apertureRadialSpacingM: (config.aperture.diameterM / 2) / config.numerical.apertureRadialSamples,
    observationPixelSpacingM: config.observationPlane.sizeM / (config.observationPlane.resolution - 1),
    measuredFirstMinimumRadiusM: measured.radiusM,
    firstMinimumErrorM: residuals.firstMinimumErrorM,
    firstMinimumSearchStatus: measured.status,
    energy
  };
}

function measureFirstMinimum(
  config: CircularApertureValidationConfig,
  profile: CircularApertureValidationProfileSample[],
  expected: CircularApertureValidationResult["expected"]
): { radiusM: number | null; status: CircularApertureValidationResult["comparison"]["firstMinimumSearchStatus"] } {
  if (!expected.firstMinimumInsidePlaneDiagonal) return { radiusM: null, status: "outside-plane" };
  if (profile.length < 5) return { radiusM: null, status: "not-resolved" };
  const low = expected.firstMinimumRadiusM * 0.55;
  const high = expected.firstMinimumRadiusM * 1.45;
  let bestIndex = -1;
  let bestValue = Number.POSITIVE_INFINITY;

  for (let index = 1; index < profile.length - 1; index += 1) {
    const sample = profile[index]!;
    if (sample.radiusM < low || sample.radiusM > high) continue;
    if (sample.numericalIntensity < bestValue) {
      bestValue = sample.numericalIntensity;
      bestIndex = index;
    }
  }

  if (bestIndex <= 0 || bestIndex >= profile.length - 1) return { radiusM: null, status: "not-resolved" };
  const left = profile[bestIndex - 1]!;
  const center = profile[bestIndex]!;
  const right = profile[bestIndex + 1]!;
  const stepM = (right.radiusM - left.radiusM) / 2;
  const denominator = left.numericalIntensity - 2 * center.numericalIntensity + right.numericalIntensity;
  const offsetSteps = Math.abs(denominator) > 1e-18 ? 0.5 * (left.numericalIntensity - right.numericalIntensity) / denominator : 0;
  const refinedRadiusM = center.radiusM + clamp(offsetSteps, -1, 1) * stepM;
  return { radiusM: refinedRadiusM, status: "measured" };
}

function finitePlaneIntegralComparison(
  config: CircularApertureValidationConfig,
  numericalField: FieldOutput2D,
  analyticField: FieldOutput2D
): CircularApertureValidationResult["comparison"]["energy"] {
  const spacingM = config.observationPlane.sizeM / (config.observationPlane.resolution - 1);
  const pixelAreaM2 = spacingM * spacingM;
  const numericalPlaneIntegral = sumField(numericalField.intensity) * pixelAreaM2;
  const analyticPlaneIntegral = sumField(analyticField.intensity) * pixelAreaM2;
  const relativePlaneIntegralError =
    analyticPlaneIntegral > 0 ? Math.abs(numericalPlaneIntegral - analyticPlaneIntegral) / analyticPlaneIntegral : 0;

  return {
    apertureAreaM2: Math.PI * Math.pow(config.aperture.diameterM / 2, 2),
    numericalPlaneIntegral,
    analyticPlaneIntegral,
    relativePlaneIntegralError,
    normalization: "peak-normalized finite-plane intensity integral",
    note: "This is a finite-plane, peak-normalized scalar intensity sanity check, not a physical source-power conservation claim."
  };
}

function sumField(values: Float64Array): number {
  let sum = 0;
  for (let index = 0; index < values.length; index += 1) sum += values[index] ?? 0;
  return sum;
}

function radialSymmetryError(config: CircularApertureValidationConfig, field: FieldOutput2D): number {
  let maxError = 0;
  for (let vIndex = 0; vIndex < field.height; vIndex += 1) {
    const mirrorV = field.height - 1 - vIndex;
    for (let uIndex = 0; uIndex < field.width; uIndex += 1) {
      const mirrorU = field.width - 1 - uIndex;
      const index = vIndex * field.width + uIndex;
      const mirrorIndex = mirrorV * field.width + mirrorU;
      maxError = Math.max(maxError, Math.abs((field.intensity[index] ?? 0) - (field.intensity[mirrorIndex] ?? 0)));
    }
  }
  return maxError;
}

function circularApertureValidationWarnings(
  config: CircularApertureValidationConfig,
  expected: CircularApertureValidationResult["expected"],
  comparison: CircularApertureValidationResult["comparison"]
): SolverWarning[] {
  const warnings: SolverWarning[] = [
    {
      code: "validation.diffraction.scalarOnly",
      message: "L6.2 is scalar circular-aperture numerical propagation validation, not a full 3D Maxwell, FDTD, FEM, BEM, RCWA, physical aperture, or digital-twin solve."
    },
    {
      code: "validation.diffraction.pointMode",
      message:
        "The point emitter is treated as one monochromatic spatial mode and reports time-averaged intensity; multi-point incoherent source summation is a later validation case."
    },
    {
      code: "validation.diffraction.highAngleScalarApproximation",
      message:
        "The 1 um aperture at 500 nm creates a high-angle diffraction case; scalar propagation is useful validation, not a full vector Maxwell aperture solution."
    }
  ];
  if (!expected.firstMinimumInsidePlane || !expected.firstMinimumInsidePlaneDiagonal) {
    warnings.push({
      code: "validation.diffraction.firstMinimumOutsidePlane",
      message: `Expected first Airy minimum radius is ${formatMm(expected.firstMinimumRadiusM)} mm from center; the ${formatMm(config.observationPlane.sizeM)} mm x ${formatMm(config.observationPlane.sizeM)} mm observation plane does not fully include it.`
    });
  }
  if (samplingIsUnderResolved(config, comparison)) {
    warnings.push({
      code: "validation.diffraction.underResolvedNumericalPropagation",
      message:
        "Numerical scalar propagation sampling is intentionally coarse; increase aperture radial/angular samples, radial observation samples, or map resolution before treating residuals as convergence evidence."
    });
  }
  return warnings;
}

function samplingIsUnderResolved(
  config: CircularApertureValidationConfig,
  comparison: CircularApertureValidationResult["comparison"]
): boolean {
  return (
    config.numerical.apertureRadialSamples < 24 ||
    config.numerical.apertureAngularSamples < 48 ||
    config.numerical.radialObservationSamples < 64 ||
    config.observationPlane.resolution < 65 ||
    comparison.apertureRadialSpacingM > config.wavelengthM / 6
  );
}

function circularApertureValidationProvenance(): CircularApertureValidationResult["provenance"] {
  return {
    label: "L6.2 numerical scalar propagation validation",
    limitations: [
      "This is an ideal scalar diffraction validation bench, not a full vector Maxwell aperture solve.",
      "The numerical map is computed by radial Huygens-Fresnel quadrature over the aperture and compared against, but not generated from, the Airy/Bessel formula.",
      "The aperture is a zero-thickness amplitude mask; no material, finite-thickness metal, edge boundary condition, or subwavelength-aperture physics is modeled.",
      "The circular pinhole benchmark uses an Airy/Bessel reference; long-slit sinc^2 diffraction is intentionally left for a separate validation milestone.",
      "No FDTD, FEM, BEM, RCWA, sensor transport, curved lenses, physical blocker interaction, or microscope digital-twin calibration is executed in L6.2."
    ]
  };
}

function fieldPreview(field: FieldOutput2D): unknown {
  return {
    id: field.id,
    width: field.width,
    height: field.height,
    uMinM: field.uMinM,
    uMaxM: field.uMaxM,
    vMinM: field.vMinM,
    vMaxM: field.vMaxM,
    normalization: field.normalization,
    provenance: field.provenance
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
    radialSymmetryError: roundNumber(residuals.radialSymmetryError),
    firstMinimumErrorM: residuals.firstMinimumErrorM === null ? null : roundNumber(residuals.firstMinimumErrorM),
    finitePlaneIntegralRelativeError: roundNumber(residuals.finitePlaneIntegralRelativeError)
  };
}

function comparisonForHash(comparison: CircularApertureValidationResult["comparison"]): unknown {
  return {
    numericalMethod: comparison.numericalMethod,
    numericalIndependentOfAnalyticReference: comparison.numericalIndependentOfAnalyticReference,
    apertureRadialSamples: comparison.apertureRadialSamples,
    apertureAngularSamples: comparison.apertureAngularSamples,
    radialObservationSamples: comparison.radialObservationSamples,
    observationResolution: comparison.observationResolution,
    measuredFirstMinimumRadiusM: comparison.measuredFirstMinimumRadiusM === null ? null : roundNumber(comparison.measuredFirstMinimumRadiusM),
    firstMinimumErrorM: comparison.firstMinimumErrorM === null ? null : roundNumber(comparison.firstMinimumErrorM),
    firstMinimumSearchStatus: comparison.firstMinimumSearchStatus,
    relativePlaneIntegralError: roundNumber(comparison.energy.relativePlaneIntegralError)
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
