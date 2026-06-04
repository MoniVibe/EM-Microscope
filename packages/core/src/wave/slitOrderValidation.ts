import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { FieldOutput2D, SolverWarning } from "../solvers/Solver";
import {
  runCircularApertureValidation,
  type CircularApertureValidationResult
} from "./circularApertureValidation";

export type SlitOrderBenchmarkKind = "long-single-slit-sinc2" | "double-slit-orders";

export type SlitOrderValidationConfig = {
  id: string;
  label: string;
  kind: SlitOrderBenchmarkKind;
  wavelengthM: number;
  propagationDistanceM: number;
  source: {
    kind: "coherent-plane-wave";
  };
  aperture: {
    kind: "ideal-zero-thickness-long-rectangular-slit-mask";
    slitWidthM: number;
    slitSeparationM: number | null;
    slitCount: 1 | 2;
  };
  observationPlane: {
    widthM: number;
    heightM: number;
    widthSamples: number;
    heightSamples: number;
    thickness: "zero-mathematical-plane";
  };
  numerical: {
    method: "one-dimensional-huygens-fresnel-quadrature";
    apertureSamples: number;
  };
  orders: {
    min: number;
    max: number;
  };
};

export type SlitOrderProfileSample = {
  positionM: number;
  numericalIntensity: number;
  analyticIntensity: number;
  residual: number;
  residualAbs: number;
};

export type SlitOrderMeasuredFeature = {
  order: number;
  expectedPositionM: number;
  smallAnglePositionM: number;
  measuredPositionM: number | null;
  errorM: number | null;
  visible: boolean;
  kind: "minimum" | "order-maximum";
};

export type SlitOrderValidationResult = {
  id: string;
  type: "l63SlitOrderValidation";
  analysisId: "analysis.wave.l6.phase3.slitOrderValidation";
  label: string;
  config: SlitOrderValidationConfig;
  configHash: string;
  resultHash: string;
  field: FieldOutput2D;
  numericalField: FieldOutput2D;
  analyticField: FieldOutput2D;
  residualField: FieldOutput2D;
  profile: SlitOrderProfileSample[];
  expected: {
    primarySpacingM: number;
    primarySpacingSmallAngleM: number;
    features: SlitOrderMeasuredFeature[];
  };
  residuals: {
    rmsResidual: number;
    maxResidual: number;
    centerNormalizationError: number;
    finitePlaneIntegralRelativeError: number;
  };
  formulas: {
    singleSlitMinima: "a sin(theta) = m lambda";
    singleSlitIntensity: "I/I0 = sinc^2(pi a sin(theta) / lambda)";
    doubleSlitOrders: "d sin(theta) = m lambda";
    doubleSlitIntensity: "I/I0 = sinc^2(pi a sin(theta) / lambda) cos^2(pi d sin(theta) / lambda)";
    numericalPropagation: "U(y) ~= integral_open_slits exp(i k (R - L)) dx";
  };
  warnings: SolverWarning[];
  provenance: {
    label: "L6.3 coherent slit/order scalar validation";
    limitations: string[];
  };
};

export type AdvisorValidationSummary = {
  id: string;
  benchmark: string;
  expected: string;
  measured: string;
  rmsResidual: number;
  maxResidual: number;
  warningCount: number;
  status: "pass" | "warning" | "fail";
};

export type AdvisorValidationReviewResult = {
  id: "l63-advisor-validation-review";
  schema: "emmicro.advisorValidationReview.v1";
  label: "L6.3 Advisor Review Mode";
  resultHash: string;
  generatedBenchmarks: ["circular-pinhole-airy-bessel", "long-single-slit-sinc2", "double-slit-orders"];
  circular: AdvisorValidationSummary;
  singleSlit: AdvisorValidationSummary;
  doubleSlit: AdvisorValidationSummary;
  warnings: SolverWarning[];
  limitations: string[];
};

type MapKind = "numerical" | "analytic" | "residual";

export function defaultSlitOrderValidationConfig(kind: SlitOrderBenchmarkKind = "long-single-slit-sinc2"): SlitOrderValidationConfig {
  if (kind === "double-slit-orders") {
    return {
      id: "l63-double-slit-orders",
      label: "L6.3 coherent double-slit order validation",
      kind,
      wavelengthM: 500e-9,
      propagationDistanceM: 1,
      source: { kind: "coherent-plane-wave" },
      aperture: {
        kind: "ideal-zero-thickness-long-rectangular-slit-mask",
        slitWidthM: 20e-6,
        slitSeparationM: 100e-6,
        slitCount: 2
      },
      observationPlane: {
        widthM: 40e-3,
        heightM: 10e-3,
        widthSamples: 401,
        heightSamples: 81,
        thickness: "zero-mathematical-plane"
      },
      numerical: {
        method: "one-dimensional-huygens-fresnel-quadrature",
        apertureSamples: 256
      },
      orders: { min: -3, max: 3 }
    };
  }

  return {
    id: "l63-long-single-slit-sinc2",
    label: "L6.3 coherent long single-slit sinc^2 validation",
    kind,
    wavelengthM: 500e-9,
    propagationDistanceM: 1,
    source: { kind: "coherent-plane-wave" },
    aperture: {
      kind: "ideal-zero-thickness-long-rectangular-slit-mask",
      slitWidthM: 100e-6,
      slitSeparationM: null,
      slitCount: 1
    },
    observationPlane: {
      widthM: 25e-3,
      heightM: 10e-3,
      widthSamples: 257,
      heightSamples: 81,
      thickness: "zero-mathematical-plane"
    },
    numerical: {
      method: "one-dimensional-huygens-fresnel-quadrature",
      apertureSamples: 192
    },
    orders: { min: -2, max: 2 }
  };
}

export function runSlitOrderValidation(input: Partial<SlitOrderValidationConfig> = {}): SlitOrderValidationResult {
  const config = normalizeSlitOrderConfig(input);
  validateSlitOrderConfig(config);

  const configHash = fnv1a64(stableStringify(configForHash(config)));
  const profile = computeSlitProfile(config);
  const features = measureExpectedFeatures(config, profile);
  const numericalField = renderSlitField(config, profile, "numerical");
  const analyticField = renderSlitField(config, profile, "analytic");
  const residuals = slitResiduals(config, profile, numericalField, analyticField);
  const residualField = renderSlitField(config, profile, "residual", residuals.maxResidual);
  const warnings = slitWarnings(config, features);
  const resultHash = fnv1a64(
    stableStringify({
      analysisId: "analysis.wave.l6.phase3.slitOrderValidation",
      configHash,
      features: features.map(featureForHash),
      residuals: residualsForHash(residuals),
      warningCodes: warnings.map((warning) => warning.code)
    })
  );

  return {
    id: config.id,
    type: "l63SlitOrderValidation",
    analysisId: "analysis.wave.l6.phase3.slitOrderValidation",
    label: config.label,
    config,
    configHash,
    resultHash,
    field: numericalField,
    numericalField,
    analyticField,
    residualField,
    profile,
    expected: {
      primarySpacingM: primarySpacing(config),
      primarySpacingSmallAngleM: primarySpacingSmallAngle(config),
      features
    },
    residuals,
    formulas: {
      singleSlitMinima: "a sin(theta) = m lambda",
      singleSlitIntensity: "I/I0 = sinc^2(pi a sin(theta) / lambda)",
      doubleSlitOrders: "d sin(theta) = m lambda",
      doubleSlitIntensity: "I/I0 = sinc^2(pi a sin(theta) / lambda) cos^2(pi d sin(theta) / lambda)",
      numericalPropagation: "U(y) ~= integral_open_slits exp(i k (R - L)) dx"
    },
    warnings,
    provenance: {
      label: "L6.3 coherent slit/order scalar validation",
      limitations: [
        "This is scalar coherent diffraction validation, not a full vector Maxwell aperture solve.",
        "Slits are ideal zero-thickness amplitude masks with no finite-thickness material, edge boundary, or subwavelength vector aperture model.",
        "The numerical map is generated by Huygens-Fresnel quadrature across open slit intervals and compared against, but not generated from, sinc^2/order formulas.",
        "No FDTD, FEM, BEM, RCWA, sensor transport, curved lenses, physical blocker interaction, or microscope digital-twin calibration is executed in L6.3."
      ]
    }
  };
}

export function slitOrderValidationJson(result: SlitOrderValidationResult): unknown {
  return {
    schema: "emmicro.slitOrderValidation.v1",
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
    profile: result.profile,
    fieldPreview: fieldPreview(result.field),
    analyticFieldPreview: fieldPreview(result.analyticField),
    residualFieldPreview: fieldPreview(result.residualField),
    provenance: result.provenance
  };
}

export function slitOrderValidationMarkdown(result: SlitOrderValidationResult): string {
  const featureLines = result.expected.features.map(
    (feature) =>
      `- ${feature.kind} m=${feature.order}: expected ${formatMm(feature.expectedPositionM)} mm, small-angle ${formatMm(feature.smallAnglePositionM)} mm, measured ${
        feature.measuredPositionM === null ? "n/a" : `${formatMm(feature.measuredPositionM)} mm`
      }, error ${feature.errorM === null ? "n/a" : `${formatMm(feature.errorM)} mm`}`
  );
  return [
    `# ${result.label}`,
    "",
    "## Parameters",
    `- Wavelength: ${formatNm(result.config.wavelengthM)} nm`,
    `- Propagation distance: ${formatM(result.config.propagationDistanceM)} m`,
    `- Slit width: ${formatUm(result.config.aperture.slitWidthM)} um`,
    result.config.aperture.slitSeparationM === null ? "- Slit separation: n/a" : `- Slit separation: ${formatUm(result.config.aperture.slitSeparationM)} um`,
    `- Observation width: ${formatMm(result.config.observationPlane.widthM)} mm`,
    `- Numerical method: ${result.config.numerical.method}`,
    `- Aperture samples: ${result.config.numerical.apertureSamples}`,
    "",
    "## Hand Checks",
    result.config.kind === "long-single-slit-sinc2" ? `- First minima: y1 ~= lambda L / a = ${formatMm(result.expected.primarySpacingSmallAngleM)} mm` : `- Order spacing: dy ~= lambda L / d = ${formatMm(result.expected.primarySpacingSmallAngleM)} mm`,
    ...featureLines,
    "",
    "## Formulas",
    `- ${result.formulas.singleSlitMinima}`,
    `- ${result.formulas.singleSlitIntensity}`,
    `- ${result.formulas.doubleSlitOrders}`,
    `- ${result.formulas.doubleSlitIntensity}`,
    `- ${result.formulas.numericalPropagation}`,
    "",
    "## Residuals",
    `- RMS residual: ${result.residuals.rmsResidual.toExponential(3)}`,
    `- Max residual: ${result.residuals.maxResidual.toExponential(3)}`,
    `- Center normalization error: ${result.residuals.centerNormalizationError.toExponential(3)}`,
    `- Finite-plane integral relative error: ${result.residuals.finitePlaneIntegralRelativeError.toExponential(3)}`,
    "",
    "## Warnings",
    ...(result.warnings.length ? result.warnings.map((warning) => `- ${warning.message}`) : ["- none"]),
    "",
    "## Limitations",
    ...result.provenance.limitations.map((limitation) => `- ${limitation}`),
    "",
    `Config hash: ${result.configHash}`,
    `Result hash: ${result.resultHash}`
  ].join("\n");
}

export function runAdvisorValidationReview(): AdvisorValidationReviewResult {
  const circular = runCircularApertureValidation();
  const singleSlit = runSlitOrderValidation({ kind: "long-single-slit-sinc2" });
  const doubleSlit = runSlitOrderValidation({ kind: "double-slit-orders" });
  const warnings = [
    ...circular.warnings.map((warning) => ({ ...warning, elementId: "circular-pinhole-airy-bessel" })),
    ...singleSlit.warnings.map((warning) => ({ ...warning, elementId: "long-single-slit-sinc2" })),
    ...doubleSlit.warnings.map((warning) => ({ ...warning, elementId: "double-slit-orders" }))
  ];
  const circularSummary = circularAdvisorSummary(circular);
  const singleSummary = slitAdvisorSummary(singleSlit);
  const doubleSummary = slitAdvisorSummary(doubleSlit);
  const limitations = [
    "Advisor Review Mode is a scalar diffraction validation report, not a full 3D Maxwell/FDTD/FEM/BEM/RCWA solve.",
    "All aperture/slit elements are ideal zero-thickness masks.",
    "Reports are hand-checkable benchmark evidence, not manufacturing or microscope digital-twin certification."
  ];
  const resultHash = fnv1a64(
    stableStringify({
      circular: circularSummary,
      singleSlit: singleSummary,
      doubleSlit: doubleSummary,
      warningCodes: warnings.map((warning) => warning.code),
      limitations
    })
  );

  return {
    id: "l63-advisor-validation-review",
    schema: "emmicro.advisorValidationReview.v1",
    label: "L6.3 Advisor Review Mode",
    resultHash,
    generatedBenchmarks: ["circular-pinhole-airy-bessel", "long-single-slit-sinc2", "double-slit-orders"],
    circular: circularSummary,
    singleSlit: singleSummary,
    doubleSlit: doubleSummary,
    warnings,
    limitations
  };
}

export function advisorValidationReviewJson(review: AdvisorValidationReviewResult): unknown {
  return review;
}

export function advisorValidationReviewMarkdown(review: AdvisorValidationReviewResult): string {
  const rows = [review.circular, review.singleSlit, review.doubleSlit].map(
    (summary) =>
      `| ${summary.benchmark} | ${summary.expected} | ${summary.measured} | ${summary.rmsResidual.toExponential(3)} | ${summary.maxResidual.toExponential(3)} | ${summary.status} |`
  );
  return [
    `# ${review.label}`,
    "",
    "| Benchmark | Expected | Measured | RMS residual | Max residual | Status |",
    "| --- | --- | --- | --- | --- | --- |",
    ...rows,
    "",
    "## Included Benchmarks",
    "- Circular pinhole Airy/Bessel",
    "- Long single slit sinc^2",
    "- Double slit / grating orders",
    "",
    "## Warnings",
    ...(review.warnings.length ? review.warnings.map((warning) => `- ${warning.elementId ?? "benchmark"}: ${warning.message}`) : ["- none"]),
    "",
    "## Limitations",
    ...review.limitations.map((limitation) => `- ${limitation}`),
    "",
    `Result hash: ${review.resultHash}`
  ].join("\n");
}

export function advisorValidationReviewCsv(review: AdvisorValidationReviewResult): string {
  const escape = (value: string) => `"${value.replaceAll("\"", "\"\"")}"`;
  return [
    "benchmark,expected,measured,rms_residual,max_residual,warning_count,status",
    ...[review.circular, review.singleSlit, review.doubleSlit].map((summary) =>
      [
        escape(summary.benchmark),
        escape(summary.expected),
        escape(summary.measured),
        summary.rmsResidual.toPrecision(12),
        summary.maxResidual.toPrecision(12),
        String(summary.warningCount),
        summary.status
      ].join(",")
    )
  ].join("\n");
}

function normalizeSlitOrderConfig(input: Partial<SlitOrderValidationConfig>): SlitOrderValidationConfig {
  const defaults = defaultSlitOrderValidationConfig(input.kind ?? "long-single-slit-sinc2");
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
    },
    orders: {
      ...defaults.orders,
      ...input.orders
    }
  };
}

function validateSlitOrderConfig(config: SlitOrderValidationConfig): void {
  if (config.wavelengthM <= 0 || !Number.isFinite(config.wavelengthM)) throw new Error("slit validation wavelength must be positive");
  if (config.propagationDistanceM <= 0 || !Number.isFinite(config.propagationDistanceM)) throw new Error("slit propagation distance must be positive");
  if (config.aperture.slitWidthM <= 0 || !Number.isFinite(config.aperture.slitWidthM)) throw new Error("slit width must be positive");
  if (config.kind === "double-slit-orders" && (!config.aperture.slitSeparationM || config.aperture.slitSeparationM <= config.aperture.slitWidthM)) {
    throw new Error("double-slit separation must be greater than slit width");
  }
  if (config.observationPlane.widthM <= 0 || config.observationPlane.heightM <= 0) throw new Error("observation plane dimensions must be positive");
  if (!Number.isInteger(config.observationPlane.widthSamples) || config.observationPlane.widthSamples < 33) throw new Error("observation widthSamples must be an integer >= 33");
  if (!Number.isInteger(config.observationPlane.heightSamples) || config.observationPlane.heightSamples < 3) throw new Error("observation heightSamples must be an integer >= 3");
  if (!Number.isInteger(config.numerical.apertureSamples) || config.numerical.apertureSamples < 16) throw new Error("apertureSamples must be an integer >= 16");
  if (!Number.isInteger(config.orders.min) || !Number.isInteger(config.orders.max) || config.orders.min > config.orders.max) throw new Error("invalid order range");
}

function computeSlitProfile(config: SlitOrderValidationConfig): SlitOrderProfileSample[] {
  const width = config.observationPlane.widthM;
  const samples = config.observationPlane.widthSamples;
  const numericalRaw = new Float64Array(samples);
  let peak = 0;

  for (let index = 0; index < samples; index += 1) {
    const positionM = -width / 2 + (width * index) / (samples - 1);
    const intensity = numericalSlitIntensity(positionM, config);
    numericalRaw[index] = intensity;
    peak = Math.max(peak, intensity);
  }

  const safePeak = peak > 0 ? peak : 1;
  return Array.from({ length: samples }, (_, index) => {
    const positionM = -width / 2 + (width * index) / (samples - 1);
    const numericalIntensity = (numericalRaw[index] ?? 0) / safePeak;
    const analyticIntensity = analyticSlitIntensity(positionM, config);
    const residual = numericalIntensity - analyticIntensity;
    return {
      positionM,
      numericalIntensity,
      analyticIntensity,
      residual,
      residualAbs: Math.abs(residual)
    };
  });
}

function numericalSlitIntensity(positionM: number, config: SlitOrderValidationConfig): number {
  const intervals = slitIntervals(config);
  const samplesPerInterval = Math.max(8, Math.floor(config.numerical.apertureSamples / intervals.length));
  const waveNumber = (2 * Math.PI) / config.wavelengthM;
  let real = 0;
  let imag = 0;

  for (const interval of intervals) {
    const dx = (interval.maxM - interval.minM) / samplesPerInterval;
    for (let index = 0; index < samplesPerInterval; index += 1) {
      const aperturePositionM = interval.minM + (index + 0.5) * dx;
      const pathM = Math.sqrt(config.propagationDistanceM * config.propagationDistanceM + (positionM - aperturePositionM) * (positionM - aperturePositionM));
      const phase = waveNumber * (pathM - config.propagationDistanceM);
      real += Math.cos(phase) * dx;
      imag += Math.sin(phase) * dx;
    }
  }

  return real * real + imag * imag;
}

function slitIntervals(config: SlitOrderValidationConfig): Array<{ minM: number; maxM: number }> {
  const halfWidth = config.aperture.slitWidthM / 2;
  if (config.kind === "long-single-slit-sinc2") return [{ minM: -halfWidth, maxM: halfWidth }];
  const separation = config.aperture.slitSeparationM ?? 0;
  return [
    { minM: -separation / 2 - halfWidth, maxM: -separation / 2 + halfWidth },
    { minM: separation / 2 - halfWidth, maxM: separation / 2 + halfWidth }
  ];
}

function analyticSlitIntensity(positionM: number, config: SlitOrderValidationConfig): number {
  const sinTheta = positionM / Math.sqrt(positionM * positionM + config.propagationDistanceM * config.propagationDistanceM);
  const beta = (Math.PI * config.aperture.slitWidthM * sinTheta) / config.wavelengthM;
  const envelope = sinc(beta);
  if (config.kind === "long-single-slit-sinc2") return envelope * envelope;
  const separation = config.aperture.slitSeparationM ?? 1;
  const interference = Math.cos((Math.PI * separation * sinTheta) / config.wavelengthM);
  return envelope * envelope * interference * interference;
}

function measureExpectedFeatures(config: SlitOrderValidationConfig, profile: SlitOrderProfileSample[]): SlitOrderMeasuredFeature[] {
  const features: SlitOrderMeasuredFeature[] = [];
  for (let order = config.orders.min; order <= config.orders.max; order += 1) {
    if (config.kind === "long-single-slit-sinc2" && order === 0) continue;
    const expectedPositionM = expectedFeaturePosition(config, order);
    if (!Number.isFinite(expectedPositionM)) continue;
    const smallAnglePositionM =
      config.kind === "long-single-slit-sinc2"
        ? (order * config.wavelengthM * config.propagationDistanceM) / config.aperture.slitWidthM
        : (order * config.wavelengthM * config.propagationDistanceM) / (config.aperture.slitSeparationM ?? 1);
    const visible = Math.abs(expectedPositionM) <= config.observationPlane.widthM / 2;
    const measured = visible ? measureFeature(profile, expectedPositionM, primarySpacing(config), config.kind === "long-single-slit-sinc2" ? "minimum" : "order-maximum") : null;
    features.push({
      order,
      expectedPositionM,
      smallAnglePositionM,
      measuredPositionM: measured,
      errorM: measured === null ? null : Math.abs(measured - expectedPositionM),
      visible,
      kind: config.kind === "long-single-slit-sinc2" ? "minimum" : "order-maximum"
    });
  }
  return features;
}

function expectedFeaturePosition(config: SlitOrderValidationConfig, order: number): number {
  const pitch = config.kind === "long-single-slit-sinc2" ? config.aperture.slitWidthM : (config.aperture.slitSeparationM ?? 1);
  const sinTheta = (order * config.wavelengthM) / pitch;
  if (Math.abs(sinTheta) >= 1) return Number.NaN;
  return config.propagationDistanceM * (sinTheta / Math.sqrt(1 - sinTheta * sinTheta));
}

function measureFeature(
  profile: SlitOrderProfileSample[],
  expectedPositionM: number,
  spacingM: number,
  kind: SlitOrderMeasuredFeature["kind"]
): number | null {
  const windowM = Math.max(Math.abs(spacingM) * 0.35, 1e-9);
  let best: SlitOrderProfileSample | null = null;
  for (const sample of profile) {
    if (Math.abs(sample.positionM - expectedPositionM) > windowM) continue;
    if (!best) {
      best = sample;
      continue;
    }
    if (kind === "minimum" && sample.numericalIntensity < best.numericalIntensity) best = sample;
    if (kind === "order-maximum" && sample.numericalIntensity > best.numericalIntensity) best = sample;
  }
  return best?.positionM ?? null;
}

function primarySpacing(config: SlitOrderValidationConfig): number {
  const pitch = config.kind === "long-single-slit-sinc2" ? config.aperture.slitWidthM : (config.aperture.slitSeparationM ?? 1);
  const sinTheta = config.wavelengthM / pitch;
  return config.propagationDistanceM * (sinTheta / Math.sqrt(1 - sinTheta * sinTheta));
}

function primarySpacingSmallAngle(config: SlitOrderValidationConfig): number {
  const pitch = config.kind === "long-single-slit-sinc2" ? config.aperture.slitWidthM : (config.aperture.slitSeparationM ?? 1);
  return (config.wavelengthM * config.propagationDistanceM) / pitch;
}

function renderSlitField(config: SlitOrderValidationConfig, profile: SlitOrderProfileSample[], kind: MapKind, maxResidual = 0): FieldOutput2D {
  const width = config.observationPlane.widthSamples;
  const height = config.observationPlane.heightSamples;
  const intensity = new Float64Array(width * height);
  const phaseRad = new Float64Array(width * height);

  for (let vIndex = 0; vIndex < height; vIndex += 1) {
    for (let uIndex = 0; uIndex < width; uIndex += 1) {
      const sample = profile[uIndex] ?? profile[profile.length - 1]!;
      const index = vIndex * width + uIndex;
      intensity[index] =
        kind === "numerical"
          ? sample.numericalIntensity
          : kind === "analytic"
            ? sample.analyticIntensity
            : maxResidual > 0
              ? Math.abs(sample.residual) / maxResidual
              : 0;
    }
  }

  return {
    id: `${config.id}-${kind}-map`,
    type: "fieldImage2D",
    planeId: "l63-slit-observation-plane",
    gridId: "l63-slit-observation-grid",
    xM: config.propagationDistanceM,
    width,
    height,
    uMinM: -config.observationPlane.widthM / 2,
    uMaxM: config.observationPlane.widthM / 2,
    vMinM: -config.observationPlane.heightM / 2,
    vMaxM: config.observationPlane.heightM / 2,
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
        ? { kind: "analytic", model: "fraunhofer-reference", dimensionality: "2d" }
        : kind === "numerical"
          ? {
              kind: "simulated",
              level: "L2",
              solverId: "scalar.angularSpectrum.l2.1d",
              model: "scalar-wave-1d-angular-spectrum",
              dimensionality: "2d",
              approximation: ["1D Huygens-Fresnel quadrature across slit openings", "long-slit invariant map extrusion", "ideal zero-thickness amplitude masks"]
            }
          : { kind: "estimated", model: "sampling-risk", dimensionality: "2d" }
  };
}

function slitResiduals(
  config: SlitOrderValidationConfig,
  profile: SlitOrderProfileSample[],
  numericalField: FieldOutput2D,
  analyticField: FieldOutput2D
): SlitOrderValidationResult["residuals"] {
  const rmsResidual = Math.sqrt(profile.reduce((sum, sample) => sum + sample.residual * sample.residual, 0) / profile.length);
  const maxResidual = Math.max(0, ...profile.map((sample) => Math.abs(sample.residual)));
  const centerIndex = Math.floor(profile.length / 2);
  const numericalIntegral = sumField(numericalField.intensity);
  const analyticIntegral = sumField(analyticField.intensity);
  return {
    rmsResidual,
    maxResidual,
    centerNormalizationError: Math.abs((profile[centerIndex]?.numericalIntensity ?? 0) - 1),
    finitePlaneIntegralRelativeError: analyticIntegral > 0 ? Math.abs(numericalIntegral - analyticIntegral) / analyticIntegral : 0
  };
}

function slitWarnings(config: SlitOrderValidationConfig, features: SlitOrderMeasuredFeature[]): SolverWarning[] {
  const warnings: SolverWarning[] = [
    {
      code: "validation.diffraction.scalarOnly",
      message: "L6.3 slit/order validation is scalar diffraction validation, not full 3D Maxwell, FDTD, FEM, BEM, RCWA, physical aperture, or digital-twin solving."
    }
  ];
  if (features.some((feature) => !feature.visible)) {
    warnings.push({
      code: "validation.diffraction.featureOutsidePlane",
      message: "At least one expected slit minimum or interference order is outside the finite observation plane."
    });
  }
  if (config.numerical.apertureSamples < 96 || config.observationPlane.widthSamples < 129) {
    warnings.push({
      code: "validation.diffraction.underResolvedSlitPropagation",
      message: "Slit/order numerical sampling is coarse; increase aperture samples or observation samples before treating residuals as convergence evidence."
    });
  }
  return warnings;
}

function circularAdvisorSummary(result: CircularApertureValidationResult): AdvisorValidationSummary {
  const warningOnly = result.warnings.some((warning) => warning.code === "validation.diffraction.firstMinimumOutsidePlane");
  return {
    id: "circular-pinhole-airy-bessel",
    benchmark: "Circular pinhole Airy/Bessel",
    expected: `first minimum ${formatMm(result.expected.firstMinimumRadiusM)} mm`,
    measured: result.comparison.measuredFirstMinimumRadiusM === null ? result.comparison.firstMinimumSearchStatus : `${formatMm(result.comparison.measuredFirstMinimumRadiusM)} mm`,
    rmsResidual: result.residuals.rmsResidual,
    maxResidual: result.residuals.maxResidual,
    warningCount: result.warnings.length,
    status: result.residuals.rmsResidual < 1e-3 ? (warningOnly ? "warning" : "pass") : "fail"
  };
}

function slitAdvisorSummary(result: SlitOrderValidationResult): AdvisorValidationSummary {
  const visibleMeasured = result.expected.features.filter((feature) => feature.visible && feature.measuredPositionM !== null);
  const expectedLabel =
    result.config.kind === "long-single-slit-sinc2" ? `first minima +/-${formatMm(result.expected.primarySpacingSmallAngleM)} mm` : `order spacing ${formatMm(result.expected.primarySpacingSmallAngleM)} mm`;
  const measuredLabel =
    result.config.kind === "long-single-slit-sinc2"
      ? visibleMeasured
          .filter((feature) => Math.abs(feature.order) === 1)
          .map((feature) => `m=${feature.order} ${formatMm(feature.measuredPositionM ?? 0)} mm`)
          .join("; ")
      : visibleMeasured
          .filter((feature) => Math.abs(feature.order) <= 2)
          .map((feature) => `m=${feature.order} ${formatMm(feature.measuredPositionM ?? 0)} mm`)
          .join("; ");
  return {
    id: result.config.kind,
    benchmark: result.config.kind === "long-single-slit-sinc2" ? "Long single slit sinc^2" : "Double slit / grating orders",
    expected: expectedLabel,
    measured: measuredLabel || "n/a",
    rmsResidual: result.residuals.rmsResidual,
    maxResidual: result.residuals.maxResidual,
    warningCount: result.warnings.length,
    status: result.residuals.rmsResidual < 1e-3 && visibleMeasured.length > 0 ? "pass" : "warning"
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

function sumField(values: Float64Array): number {
  let sum = 0;
  for (const value of values) sum += value;
  return sum;
}

function sinc(value: number): number {
  if (Math.abs(value) < 1e-12) return 1;
  return Math.sin(value) / value;
}

function configForHash(config: SlitOrderValidationConfig): unknown {
  return {
    ...config,
    wavelengthM: roundNumber(config.wavelengthM),
    propagationDistanceM: roundNumber(config.propagationDistanceM),
    aperture: {
      ...config.aperture,
      slitWidthM: roundNumber(config.aperture.slitWidthM),
      slitSeparationM: config.aperture.slitSeparationM === null ? null : roundNumber(config.aperture.slitSeparationM)
    },
    observationPlane: {
      ...config.observationPlane,
      widthM: roundNumber(config.observationPlane.widthM),
      heightM: roundNumber(config.observationPlane.heightM)
    }
  };
}

function featureForHash(feature: SlitOrderMeasuredFeature): unknown {
  return {
    order: feature.order,
    expectedPositionM: roundNumber(feature.expectedPositionM),
    smallAnglePositionM: roundNumber(feature.smallAnglePositionM),
    measuredPositionM: feature.measuredPositionM === null ? null : roundNumber(feature.measuredPositionM),
    errorM: feature.errorM === null ? null : roundNumber(feature.errorM),
    visible: feature.visible,
    kind: feature.kind
  };
}

function residualsForHash(residuals: SlitOrderValidationResult["residuals"]): unknown {
  return {
    rmsResidual: roundNumber(residuals.rmsResidual),
    maxResidual: roundNumber(residuals.maxResidual),
    centerNormalizationError: roundNumber(residuals.centerNormalizationError),
    finitePlaneIntegralRelativeError: roundNumber(residuals.finitePlaneIntegralRelativeError)
  };
}

function roundNumber(value: number): number {
  return Number(value.toPrecision(12));
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

function formatM(valueM: number): string {
  return valueM.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}
