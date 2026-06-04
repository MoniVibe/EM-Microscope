import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { FieldOutput2D, SolverWarning } from "../solvers/Solver";
import { airyFirstZero } from "./circularApertureValidation";

export type ThinLensFocalValidationConfig = {
  id: string;
  label: string;
  wavelengthM: number;
  source: {
    kind: "coherent-plane-wave";
    coherence: "single-spatial-mode-time-averaged-intensity";
  };
  lens: {
    kind: "ideal-zero-thickness-thin-lens-phase-mask";
    zM: number;
    focalLengthM: number;
    phaseConvention: "tau_lens(u,v)=P(u,v) exp[-i k (u^2+v^2)/(2f)]";
  };
  pupil: {
    kind: "ideal-circular-clear-pupil";
    diameterM: number;
    centerUM: number;
    centerVM: number;
  };
  observationPlane: {
    zM: number;
    sizeM: number;
    resolution: number;
    thickness: "zero-mathematical-plane";
  };
  radialSamples: number;
  numerical: {
    method: "radial-fresnel-thin-lens-quadrature";
    apertureRadialSamples: number;
    apertureAngularSamples: number;
    radialObservationSamples: number;
    focusScanSamples: number;
    focusScanHalfRangeM: number;
    focusScanRadialSamples: number;
  };
};

export type ThinLensFocalProfileSample = {
  radiusM: number;
  numericalIntensity: number;
  analyticIntensity: number;
  residual: number;
  residualAbs: number;
};

export type ThinLensFocusScanSample = {
  zM: number;
  defocusM: number;
  centerIntensityRelative: number;
  halfMaxRadiusM: number | null;
};

export type ThinLensFocalValidationPipelineStep = {
  index: number;
  label: string;
  detail: string;
};

export type ThinLensFocalValidationResult = {
  id: string;
  type: "l64ThinLensFocalValidation";
  analysisId: "analysis.wave.l6.phase4.thinLensFocalValidation";
  label: string;
  config: ThinLensFocalValidationConfig;
  configHash: string;
  resultHash: string;
  field: FieldOutput2D;
  numericalField: FieldOutput2D;
  analyticField: FieldOutput2D;
  residualField: FieldOutput2D;
  radialProfile: ThinLensFocalProfileSample[];
  focusScan: ThinLensFocusScanSample[];
  expected: {
    firstDarkRadiusM: number;
    firstDarkRadiusSmallAngleM: number;
    firstDarkCoefficient: number;
    focalLengthM: number;
    pupilDiameterM: number;
    numericalApertureEstimate: number;
    observationDefocusM: number;
    planeHalfWidthM: number;
    planeHalfDiagonalM: number;
    firstDarkInsidePlane: boolean;
    firstDarkInsidePlaneDiagonal: boolean;
  };
  comparison: {
    numericalMethod: ThinLensFocalValidationConfig["numerical"]["method"];
    numericalIndependentOfAnalyticReference: true;
    apertureRadialSamples: number;
    apertureAngularSamples: number;
    radialObservationSamples: number;
    observationResolution: number;
    apertureRadialSpacingM: number;
    observationPixelSpacingM: number;
    measuredFirstDarkRadiusM: number | null;
    firstDarkRadiusErrorM: number | null;
    firstDarkSearchStatus: "outside-plane" | "measured" | "not-resolved";
    energy: {
      pupilAreaM2: number;
      numericalPlaneIntegral: number;
      analyticPlaneIntegral: number;
      relativePlaneIntegralError: number;
      normalization: "peak-normalized finite-plane intensity integral";
      note: string;
    };
    focus: {
      metric: "relative-center-intensity-across-z-scan";
      sampleCount: number;
      bestFocusZM: number;
      bestFocusDefocusM: number;
      configuredPlanePeakRelative: number;
      configuredHalfMaxRadiusM: number | null;
      bestHalfMaxRadiusM: number | null;
    };
  };
  residuals: {
    rmsResidual: number;
    maxResidual: number;
    centerNormalizationError: number;
    radialSymmetryError: number;
    firstDarkRadiusErrorM: number | null;
    finitePlaneIntegralRelativeError: number;
  };
  formulas: {
    thinLensPhase: "tau_lens(u,v) = P(u,v) exp[-i k (u^2 + v^2) / (2f)]";
    pupil: "P(u,v) = 1 for sqrt(u^2+v^2) <= D/2, otherwise 0";
    focalAiryIntensity: "I/I0 = [2 J1(pi D r / (lambda f)) / (pi D r / (lambda f))]^2";
    firstDarkRadius: "r1 = 1.22 lambda f / D";
    numericalPropagation: "U(r,z) ~= integral_pupil exp[i k r_p^2(1/(2z)-1/(2f)) - i k r r_p cos(phi)/z] r_p dr_p dphi";
  };
  warnings: SolverWarning[];
  provenance: {
    label: "L6.4 ideal thin-lens scalar focal-plane validation";
    limitations: string[];
  };
};

type NumericalRadialSample = {
  radiusM: number;
  numericalIntensity: number;
  analyticIntensity: number;
};

type MapKind = "numerical" | "analytic" | "residual";

export function defaultThinLensFocalValidationConfig(): ThinLensFocalValidationConfig {
  return {
    id: "l64-ideal-thin-lens-focal-plane",
    label: "L6.4 ideal thin lens focal-plane validation",
    wavelengthM: 500e-9,
    source: {
      kind: "coherent-plane-wave",
      coherence: "single-spatial-mode-time-averaged-intensity"
    },
    lens: {
      kind: "ideal-zero-thickness-thin-lens-phase-mask",
      zM: 0,
      focalLengthM: 20e-3,
      phaseConvention: "tau_lens(u,v)=P(u,v) exp[-i k (u^2+v^2)/(2f)]"
    },
    pupil: {
      kind: "ideal-circular-clear-pupil",
      diameterM: 200e-6,
      centerUM: 0,
      centerVM: 0
    },
    observationPlane: {
      zM: 20e-3,
      sizeM: 300e-6,
      resolution: 257,
      thickness: "zero-mathematical-plane"
    },
    radialSamples: 161,
    numerical: {
      method: "radial-fresnel-thin-lens-quadrature",
      apertureRadialSamples: 96,
      apertureAngularSamples: 160,
      radialObservationSamples: 161,
      focusScanSamples: 17,
      focusScanHalfRangeM: 2e-3,
      focusScanRadialSamples: 41
    }
  };
}

export function runThinLensFocalValidation(input: Partial<ThinLensFocalValidationConfig> = {}): ThinLensFocalValidationResult {
  const config = normalizeThinLensConfig(input);
  validateThinLensConfig(config);

  const configHash = fnv1a64(stableStringify(configForHash(config)));
  const expected = expectedThinLensFocalValues(config);
  const numericalProfile = computeNumericalProfile(config);
  const radialProfile = renderThinLensRadialProfile(config, numericalProfile);
  const numericalField = renderThinLensField(config, radialProfile, "numerical");
  const analyticField = renderThinLensField(config, radialProfile, "analytic");
  const residuals = thinLensResiduals(config, radialProfile, numericalField, analyticField, expected);
  const residualField = renderThinLensField(config, radialProfile, "residual", residuals.maxResidual);
  const focusScan = computeFocusScan(config);
  const comparison = thinLensComparison(config, radialProfile, expected, residuals, numericalField, analyticField, focusScan);
  const warnings = thinLensWarnings(config, expected, comparison);
  const provenance = thinLensProvenance();
  const resultHash = fnv1a64(
    stableStringify({
      analysisId: "analysis.wave.l6.phase4.thinLensFocalValidation",
      configHash,
      expected: expectedForHash(expected),
      residuals: residualsForHash(residuals),
      comparison: comparisonForHash(comparison),
      focusScan: focusScan.map(focusSampleForHash),
      warningCodes: warnings.map((warning) => warning.code)
    })
  );

  return {
    id: config.id,
    type: "l64ThinLensFocalValidation",
    analysisId: "analysis.wave.l6.phase4.thinLensFocalValidation",
    label: config.label,
    config,
    configHash,
    resultHash,
    field: numericalField,
    numericalField,
    analyticField,
    residualField,
    radialProfile,
    focusScan,
    expected,
    comparison,
    residuals,
    formulas: {
      thinLensPhase: "tau_lens(u,v) = P(u,v) exp[-i k (u^2 + v^2) / (2f)]",
      pupil: "P(u,v) = 1 for sqrt(u^2+v^2) <= D/2, otherwise 0",
      focalAiryIntensity: "I/I0 = [2 J1(pi D r / (lambda f)) / (pi D r / (lambda f))]^2",
      firstDarkRadius: "r1 = 1.22 lambda f / D",
      numericalPropagation: "U(r,z) ~= integral_pupil exp[i k r_p^2(1/(2z)-1/(2f)) - i k r r_p cos(phi)/z] r_p dr_p dphi"
    },
    warnings,
    provenance
  };
}

export function airyThinLensFocalIntensity(radiusM: number, config: ThinLensFocalValidationConfig): number {
  const x = (Math.PI * config.pupil.diameterM * radiusM) / (config.wavelengthM * config.lens.focalLengthM);
  if (Math.abs(x) < 1e-10) return 1;
  const amplitude = (2 * besselJ1(x)) / x;
  return amplitude * amplitude;
}

export function expectedThinLensFocalValues(config: ThinLensFocalValidationConfig): ThinLensFocalValidationResult["expected"] {
  const firstDarkCoefficient = airyFirstZero / Math.PI;
  const firstDarkRadiusM = (airyFirstZero * config.wavelengthM * config.lens.focalLengthM) / (Math.PI * config.pupil.diameterM);
  const planeHalfWidthM = config.observationPlane.sizeM / 2;
  const planeHalfDiagonalM = Math.SQRT2 * planeHalfWidthM;
  const numericalApertureEstimate = (config.pupil.diameterM / 2) / config.lens.focalLengthM;
  return {
    firstDarkRadiusM,
    firstDarkRadiusSmallAngleM: firstDarkCoefficient * (config.wavelengthM * config.lens.focalLengthM) / config.pupil.diameterM,
    firstDarkCoefficient,
    focalLengthM: config.lens.focalLengthM,
    pupilDiameterM: config.pupil.diameterM,
    numericalApertureEstimate,
    observationDefocusM: config.observationPlane.zM - config.lens.focalLengthM,
    planeHalfWidthM,
    planeHalfDiagonalM,
    firstDarkInsidePlane: firstDarkRadiusM <= planeHalfWidthM,
    firstDarkInsidePlaneDiagonal: firstDarkRadiusM <= planeHalfDiagonalM
  };
}

export function thinLensFocalValidationPipeline(result: ThinLensFocalValidationResult): ThinLensFocalValidationPipelineStep[] {
  const config = result.config;
  return [
    {
      index: 1,
      label: "Source",
      detail: `coherent plane wave, wavelength ${formatNm(config.wavelengthM)} nm`
    },
    {
      index: 2,
      label: "Lens plane",
      detail: `ideal zero-thickness thin-lens phase mask at z = ${formatMm(config.lens.zM)} mm, focal length ${formatMm(config.lens.focalLengthM)} mm`
    },
    {
      index: 3,
      label: "Pupil",
      detail: `circular clear diameter ${formatUm(config.pupil.diameterM)} um centered on the optical axis`
    },
    {
      index: 4,
      label: "Propagation",
      detail: `scalar Fresnel propagation to z = ${formatMm(config.observationPlane.zM)} mm`
    },
    {
      index: 5,
      label: "Observation",
      detail: `${formatUm(config.observationPlane.sizeM)} um x ${formatUm(config.observationPlane.sizeM)} um focal-plane intensity map`
    },
    {
      index: 6,
      label: "Check",
      detail: `analytic Airy PSF, first dark radius ${formatUm(result.expected.firstDarkRadiusM)} um, residual map, radial overlay, and focus scan`
    }
  ];
}

export function thinLensFocalValidationJson(result: ThinLensFocalValidationResult): unknown {
  return {
    schema: "emmicro.thinLensFocalValidation.v1",
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
    pipeline: thinLensFocalValidationPipeline(result),
    radialProfile: result.radialProfile,
    focusScan: result.focusScan,
    fieldPreview: fieldPreview(result.field),
    analyticFieldPreview: fieldPreview(result.analyticField),
    numericalFieldPreview: fieldPreview(result.numericalField),
    residualFieldPreview: fieldPreview(result.residualField),
    provenance: result.provenance
  };
}

export function thinLensFocalValidationMarkdown(result: ThinLensFocalValidationResult): string {
  const pipelineLines = thinLensFocalValidationPipeline(result).map((step) => `${step.index}. ${step.label}: ${step.detail}`);
  const warningLines = result.warnings.map((warning) => `- ${warning.message}`);
  return [
    `# ${result.label}`,
    "",
    "## Pipeline",
    ...pipelineLines,
    "",
    "## Parameters",
    `- Wavelength: ${formatNm(result.config.wavelengthM)} nm`,
    `- Focal length: ${formatMm(result.config.lens.focalLengthM)} mm`,
    `- Pupil diameter: ${formatUm(result.config.pupil.diameterM)} um`,
    `- Observation z: ${formatMm(result.config.observationPlane.zM)} mm`,
    `- Observation plane: ${formatUm(result.config.observationPlane.sizeM)} um x ${formatUm(result.config.observationPlane.sizeM)} um`,
    `- Observation map resolution: ${result.config.observationPlane.resolution} x ${result.config.observationPlane.resolution}`,
    `- Numerical method: ${result.comparison.numericalMethod}`,
    `- Aperture samples: ${result.comparison.apertureRadialSamples} radial x ${result.comparison.apertureAngularSamples} angular`,
    `- Radial observation samples: ${result.comparison.radialObservationSamples}`,
    "",
    "## Formulas",
    `- ${result.formulas.thinLensPhase}`,
    `- ${result.formulas.pupil}`,
    `- ${result.formulas.focalAiryIntensity}`,
    `- ${result.formulas.firstDarkRadius}`,
    `- ${result.formulas.numericalPropagation}`,
    "",
    "## Hand Checks",
    `- Expected first dark radius: ${formatUm(result.expected.firstDarkRadiusM)} um`,
    `- Default hand value target: about 61 um for 500 nm, f=20 mm, D=200 um`,
    `- Measured first dark radius: ${
      result.comparison.measuredFirstDarkRadiusM === null ? result.comparison.firstDarkSearchStatus : `${formatUm(result.comparison.measuredFirstDarkRadiusM)} um`
    }`,
    `- First-dark error: ${result.comparison.firstDarkRadiusErrorM === null ? "n/a" : `${formatUm(result.comparison.firstDarkRadiusErrorM)} um`}`,
    `- First dark inside plane: ${result.expected.firstDarkInsidePlane ? "yes" : "no"}`,
    "",
    "## Residuals",
    `- RMS residual: ${result.residuals.rmsResidual.toExponential(3)}`,
    `- Max residual: ${result.residuals.maxResidual.toExponential(3)}`,
    `- Center normalization error: ${result.residuals.centerNormalizationError.toExponential(3)}`,
    `- Radial symmetry error: ${result.residuals.radialSymmetryError.toExponential(3)}`,
    `- Finite-plane integral relative error: ${result.residuals.finitePlaneIntegralRelativeError.toExponential(3)}`,
    "",
    "## Focus Scan",
    `- Focus metric: ${result.comparison.focus.metric}`,
    `- Best focus z: ${formatMm(result.comparison.focus.bestFocusZM)} mm`,
    `- Best focus defocus: ${formatMm(result.comparison.focus.bestFocusDefocusM)} mm`,
    `- Configured-plane peak relative: ${result.comparison.focus.configuredPlanePeakRelative.toFixed(4)}`,
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

export function thinLensFocalValidationCsv(result: ThinLensFocalValidationResult): string {
  const escape = (value: string) => `"${value.replaceAll("\"", "\"\"")}"`;
  const rows = [
    "section,name,radius_um,z_mm,numerical_intensity,analytic_intensity,residual,value",
    ["parameter", "wavelength_nm", "", "", "", "", "", formatNm(result.config.wavelengthM)].map(escape).join(","),
    ["parameter", "focal_length_mm", "", "", "", "", "", formatMm(result.config.lens.focalLengthM)].map(escape).join(","),
    ["parameter", "pupil_diameter_um", "", "", "", "", "", formatUm(result.config.pupil.diameterM)].map(escape).join(","),
    ["metric", "expected_first_dark_radius_um", "", "", "", "", "", formatUm(result.expected.firstDarkRadiusM)].map(escape).join(","),
    ["metric", "measured_first_dark_radius_um", "", "", "", "", "", result.comparison.measuredFirstDarkRadiusM === null ? result.comparison.firstDarkSearchStatus : formatUm(result.comparison.measuredFirstDarkRadiusM)].map(escape).join(","),
    ["metric", "rms_residual", "", "", "", "", "", result.residuals.rmsResidual.toPrecision(12)].map(escape).join(","),
    ["metric", "max_residual", "", "", "", "", "", result.residuals.maxResidual.toPrecision(12)].map(escape).join(","),
    ...result.radialProfile.map((sample) =>
      [
        "radial_profile",
        "focal_plane",
        (sample.radiusM * 1e6).toPrecision(12),
        (result.config.observationPlane.zM * 1e3).toPrecision(12),
        sample.numericalIntensity.toPrecision(12),
        sample.analyticIntensity.toPrecision(12),
        sample.residual.toPrecision(12),
        ""
      ]
        .map(escape)
        .join(",")
    ),
    ...result.focusScan.map((sample) =>
      [
        "focus_scan",
        "relative_center_intensity",
        "",
        (sample.zM * 1e3).toPrecision(12),
        sample.centerIntensityRelative.toPrecision(12),
        "",
        "",
        sample.halfMaxRadiusM === null ? "half_max_not_resolved" : `${(sample.halfMaxRadiusM * 1e6).toPrecision(12)} um half-max radius`
      ]
        .map(escape)
        .join(",")
    )
  ];
  return rows.join("\n");
}

function normalizeThinLensConfig(input: Partial<ThinLensFocalValidationConfig>): ThinLensFocalValidationConfig {
  const defaults = defaultThinLensFocalValidationConfig();
  return {
    ...defaults,
    ...input,
    source: {
      ...defaults.source,
      ...input.source
    },
    lens: {
      ...defaults.lens,
      ...input.lens
    },
    pupil: {
      ...defaults.pupil,
      ...input.pupil
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

function validateThinLensConfig(config: ThinLensFocalValidationConfig): void {
  if (config.wavelengthM <= 0 || !Number.isFinite(config.wavelengthM)) throw new Error("thin-lens validation wavelength must be positive");
  if (config.lens.focalLengthM <= 0 || !Number.isFinite(config.lens.focalLengthM)) throw new Error("thin-lens focal length must be positive");
  if (config.pupil.diameterM <= 0 || !Number.isFinite(config.pupil.diameterM)) throw new Error("thin-lens pupil diameter must be positive");
  if (config.observationPlane.zM <= config.lens.zM) throw new Error("observation plane must be downstream of the lens plane");
  if (config.observationPlane.sizeM <= 0 || !Number.isFinite(config.observationPlane.sizeM)) throw new Error("observation plane size must be positive");
  if (!Number.isInteger(config.observationPlane.resolution) || config.observationPlane.resolution < 17) throw new Error("observation plane resolution must be an integer >= 17");
  if (!Number.isInteger(config.radialSamples) || config.radialSamples < 17) throw new Error("radialSamples must be an integer >= 17");
  if (config.numerical.method !== "radial-fresnel-thin-lens-quadrature") throw new Error("unsupported thin-lens numerical propagation method");
  if (!Number.isInteger(config.numerical.apertureRadialSamples) || config.numerical.apertureRadialSamples < 8) throw new Error("apertureRadialSamples must be an integer >= 8");
  if (!Number.isInteger(config.numerical.apertureAngularSamples) || config.numerical.apertureAngularSamples < 16) throw new Error("apertureAngularSamples must be an integer >= 16");
  if (!Number.isInteger(config.numerical.radialObservationSamples) || config.numerical.radialObservationSamples < 17) throw new Error("radialObservationSamples must be an integer >= 17");
  if (!Number.isInteger(config.numerical.focusScanSamples) || config.numerical.focusScanSamples < 3) throw new Error("focusScanSamples must be an integer >= 3");
  if (config.numerical.focusScanHalfRangeM <= 0 || !Number.isFinite(config.numerical.focusScanHalfRangeM)) throw new Error("focusScanHalfRangeM must be positive");
  if (!Number.isInteger(config.numerical.focusScanRadialSamples) || config.numerical.focusScanRadialSamples < 5) throw new Error("focusScanRadialSamples must be an integer >= 5");
}

function computeNumericalProfile(config: ThinLensFocalValidationConfig): NumericalRadialSample[] {
  const maxRadiusM = (Math.SQRT2 * config.observationPlane.sizeM) / 2;
  const sampleCount = config.numerical.radialObservationSamples;
  const raw = new Float64Array(sampleCount);
  let peak = 0;

  for (let index = 0; index < sampleCount; index += 1) {
    const radiusM = (maxRadiusM * index) / (sampleCount - 1);
    const intensity = numericalThinLensRawIntensity(radiusM, config.observationPlane.zM, config);
    raw[index] = intensity;
    peak = Math.max(peak, intensity);
  }

  const safePeak = peak > 0 ? peak : 1;
  return Array.from({ length: sampleCount }, (_, index) => {
    const radiusM = (maxRadiusM * index) / (sampleCount - 1);
    return {
      radiusM,
      numericalIntensity: (raw[index] ?? 0) / safePeak,
      analyticIntensity: airyThinLensFocalIntensity(radiusM, config)
    };
  });
}

function renderThinLensRadialProfile(config: ThinLensFocalValidationConfig, numericalProfile: NumericalRadialSample[]): ThinLensFocalProfileSample[] {
  const maxRadiusM = (Math.SQRT2 * config.observationPlane.sizeM) / 2;
  return Array.from({ length: config.radialSamples }, (_, index) => {
    const radiusM = (maxRadiusM * index) / (config.radialSamples - 1);
    const numericalIntensity = interpolateNumericalProfile(numericalProfile, radiusM);
    const analyticIntensity = airyThinLensFocalIntensity(radiusM, config);
    const residual = numericalIntensity - analyticIntensity;
    return {
      radiusM,
      numericalIntensity,
      analyticIntensity,
      residual,
      residualAbs: Math.abs(residual)
    };
  });
}

function numericalThinLensRawIntensity(
  radiusM: number,
  observationZM: number,
  config: ThinLensFocalValidationConfig,
  options: { apertureRadialSamples?: number; apertureAngularSamples?: number } = {}
): number {
  const pupilRadiusM = config.pupil.diameterM / 2;
  const propagationDistanceM = observationZM - config.lens.zM;
  const waveNumber = (2 * Math.PI) / config.wavelengthM;
  const radialSamples = options.apertureRadialSamples ?? config.numerical.apertureRadialSamples;
  const angularSamples = options.apertureAngularSamples ?? config.numerical.apertureAngularSamples;
  const radialStepM = pupilRadiusM / radialSamples;
  const angularStepRad = (2 * Math.PI) / angularSamples;
  let real = 0;
  let imag = 0;

  for (let radialIndex = 0; radialIndex < radialSamples; radialIndex += 1) {
    const pupilRadiusSampleM = (radialIndex + 0.5) * radialStepM;
    const radialWeight = pupilRadiusSampleM * radialStepM;
    const defocusPhase = waveNumber * pupilRadiusSampleM * pupilRadiusSampleM * (1 / (2 * propagationDistanceM) - 1 / (2 * config.lens.focalLengthM));

    if (Math.abs(radiusM) < 1e-18) {
      const weight = radialWeight * 2 * Math.PI;
      real += Math.cos(defocusPhase) * weight;
      imag += Math.sin(defocusPhase) * weight;
      continue;
    }

    const angularWeight = radialWeight * angularStepRad;
    for (let angularIndex = 0; angularIndex < angularSamples; angularIndex += 1) {
      const phi = (angularIndex + 0.5) * angularStepRad;
      const phase = defocusPhase - (waveNumber * radiusM * pupilRadiusSampleM * Math.cos(phi)) / propagationDistanceM;
      real += Math.cos(phase) * angularWeight;
      imag += Math.sin(phase) * angularWeight;
    }
  }

  return real * real + imag * imag;
}

function computeFocusScan(config: ThinLensFocalValidationConfig): ThinLensFocusScanSample[] {
  const sampleCount = config.numerical.focusScanSamples;
  const halfRangeM = config.numerical.focusScanHalfRangeM;
  const startM = Math.max(config.lens.zM + 1e-9, config.lens.focalLengthM - halfRangeM);
  const endM = config.lens.focalLengthM + halfRangeM;
  const rawSamples = Array.from({ length: sampleCount }, (_, index) => {
    const zM = sampleCount === 1 ? config.lens.focalLengthM : startM + ((endM - startM) * index) / (sampleCount - 1);
    return {
      zM,
      centerRaw: numericalThinLensRawIntensity(0, zM, config)
    };
  });
  const peak = Math.max(1e-30, ...rawSamples.map((sample) => sample.centerRaw));
  return rawSamples.map((sample) => ({
    zM: sample.zM,
    defocusM: sample.zM - config.lens.focalLengthM,
    centerIntensityRelative: sample.centerRaw / peak,
    halfMaxRadiusM: estimateHalfMaxRadius(config, sample.zM, sample.centerRaw)
  }));
}

function estimateHalfMaxRadius(config: ThinLensFocalValidationConfig, zM: number, centerRaw: number): number | null {
  if (centerRaw <= 0) return null;
  const maxRadiusM = config.observationPlane.sizeM / 2;
  const sampleCount = config.numerical.focusScanRadialSamples;
  const radialSamples = Math.max(12, Math.floor(config.numerical.apertureRadialSamples / 2));
  const angularSamples = Math.max(32, Math.floor(config.numerical.apertureAngularSamples / 2));
  let previousRadiusM = 0;
  let previousValue = 1;
  for (let index = 1; index < sampleCount; index += 1) {
    const radiusM = (maxRadiusM * index) / (sampleCount - 1);
    const value = numericalThinLensRawIntensity(radiusM, zM, config, { apertureRadialSamples: radialSamples, apertureAngularSamples: angularSamples }) / centerRaw;
    if (value <= 0.5) {
      const span = previousValue - value;
      const t = span > 0 ? (previousValue - 0.5) / span : 0;
      return previousRadiusM + (radiusM - previousRadiusM) * clamp(t, 0, 1);
    }
    previousRadiusM = radiusM;
    previousValue = value;
  }
  return null;
}

function renderThinLensField(config: ThinLensFocalValidationConfig, profile: ThinLensFocalProfileSample[], kind: MapKind, maxResidual = 0): FieldOutput2D {
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
    planeId: "l64-thin-lens-observation-plane",
    gridId: "l64-thin-lens-observation-grid",
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
                "radial Fresnel scalar quadrature through an ideal thin-lens phase mask",
                "ideal circular pupil",
                "zero-thickness phase mask with no material thickness or vector polarization model"
              ]
            }
          : {
              kind: "estimated",
              model: "sampling-risk",
              dimensionality: "2d"
            }
  };
}

function fieldValueAtRadius(profile: ThinLensFocalProfileSample[], radiusM: number, kind: MapKind, maxResidual: number): number {
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

function interpolateProfile(profile: ThinLensFocalProfileSample[], radiusM: number): ThinLensFocalProfileSample {
  if (profile.length === 0) {
    return {
      radiusM,
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
    numericalIntensity,
    analyticIntensity,
    residual,
    residualAbs: Math.abs(residual)
  };
}

function thinLensResiduals(
  config: ThinLensFocalValidationConfig,
  profile: ThinLensFocalProfileSample[],
  numericalField: FieldOutput2D,
  analyticField: FieldOutput2D,
  expected: ThinLensFocalValidationResult["expected"]
): ThinLensFocalValidationResult["residuals"] {
  const rmsResidual = Math.sqrt(profile.reduce((sum, sample) => sum + sample.residual * sample.residual, 0) / Math.max(1, profile.length));
  const maxResidual = Math.max(0, ...profile.map((sample) => Math.abs(sample.residual)));
  const centerIndex = Math.floor(numericalField.height / 2) * numericalField.width + Math.floor(numericalField.width / 2);
  const measured = measureFirstDark(profile, expected);
  const finitePlane = finitePlaneIntegralComparison(config, numericalField, analyticField);
  return {
    rmsResidual,
    maxResidual,
    centerNormalizationError: Math.abs((numericalField.intensity[centerIndex] ?? 0) - 1),
    radialSymmetryError: radialSymmetryError(numericalField),
    firstDarkRadiusErrorM: measured.radiusM === null ? null : Math.abs(measured.radiusM - expected.firstDarkRadiusM),
    finitePlaneIntegralRelativeError: finitePlane.relativePlaneIntegralError
  };
}

function thinLensComparison(
  config: ThinLensFocalValidationConfig,
  profile: ThinLensFocalProfileSample[],
  expected: ThinLensFocalValidationResult["expected"],
  residuals: ThinLensFocalValidationResult["residuals"],
  numericalField: FieldOutput2D,
  analyticField: FieldOutput2D,
  focusScan: ThinLensFocusScanSample[]
): ThinLensFocalValidationResult["comparison"] {
  const measured = measureFirstDark(profile, expected);
  const energy = finitePlaneIntegralComparison(config, numericalField, analyticField);
  const bestFocus = focusScan.reduce((best, sample) => (sample.centerIntensityRelative > best.centerIntensityRelative ? sample : best), focusScan[0] ?? { zM: config.lens.focalLengthM, defocusM: 0, centerIntensityRelative: 1, halfMaxRadiusM: null });
  const configuredFocus = closestFocusSample(focusScan, config.observationPlane.zM);
  return {
    numericalMethod: config.numerical.method,
    numericalIndependentOfAnalyticReference: true,
    apertureRadialSamples: config.numerical.apertureRadialSamples,
    apertureAngularSamples: config.numerical.apertureAngularSamples,
    radialObservationSamples: config.numerical.radialObservationSamples,
    observationResolution: config.observationPlane.resolution,
    apertureRadialSpacingM: (config.pupil.diameterM / 2) / config.numerical.apertureRadialSamples,
    observationPixelSpacingM: config.observationPlane.sizeM / (config.observationPlane.resolution - 1),
    measuredFirstDarkRadiusM: measured.radiusM,
    firstDarkRadiusErrorM: residuals.firstDarkRadiusErrorM,
    firstDarkSearchStatus: measured.status,
    energy,
    focus: {
      metric: "relative-center-intensity-across-z-scan",
      sampleCount: focusScan.length,
      bestFocusZM: bestFocus.zM,
      bestFocusDefocusM: bestFocus.defocusM,
      configuredPlanePeakRelative: configuredFocus.centerIntensityRelative,
      configuredHalfMaxRadiusM: configuredFocus.halfMaxRadiusM,
      bestHalfMaxRadiusM: bestFocus.halfMaxRadiusM
    }
  };
}

function measureFirstDark(
  profile: ThinLensFocalProfileSample[],
  expected: ThinLensFocalValidationResult["expected"]
): { radiusM: number | null; status: ThinLensFocalValidationResult["comparison"]["firstDarkSearchStatus"] } {
  if (!expected.firstDarkInsidePlaneDiagonal) return { radiusM: null, status: "outside-plane" };
  if (profile.length < 5) return { radiusM: null, status: "not-resolved" };
  const low = expected.firstDarkRadiusM * 0.55;
  const high = expected.firstDarkRadiusM * 1.45;
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
  return { radiusM: center.radiusM + clamp(offsetSteps, -1, 1) * stepM, status: "measured" };
}

function finitePlaneIntegralComparison(
  config: ThinLensFocalValidationConfig,
  numericalField: FieldOutput2D,
  analyticField: FieldOutput2D
): ThinLensFocalValidationResult["comparison"]["energy"] {
  const spacingM = config.observationPlane.sizeM / (config.observationPlane.resolution - 1);
  const pixelAreaM2 = spacingM * spacingM;
  const numericalPlaneIntegral = sumField(numericalField.intensity) * pixelAreaM2;
  const analyticPlaneIntegral = sumField(analyticField.intensity) * pixelAreaM2;
  const relativePlaneIntegralError = analyticPlaneIntegral > 0 ? Math.abs(numericalPlaneIntegral - analyticPlaneIntegral) / analyticPlaneIntegral : 0;
  return {
    pupilAreaM2: Math.PI * Math.pow(config.pupil.diameterM / 2, 2),
    numericalPlaneIntegral,
    analyticPlaneIntegral,
    relativePlaneIntegralError,
    normalization: "peak-normalized finite-plane intensity integral",
    note: "This is a finite-plane, peak-normalized scalar intensity comparison, not total optical power conservation through a real lens."
  };
}

function radialSymmetryError(field: FieldOutput2D): number {
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

function closestFocusSample(focusScan: ThinLensFocusScanSample[], zM: number): ThinLensFocusScanSample {
  if (focusScan.length === 0) return { zM, defocusM: zM, centerIntensityRelative: 1, halfMaxRadiusM: null };
  return focusScan.reduce((best, sample) => (Math.abs(sample.zM - zM) < Math.abs(best.zM - zM) ? sample : best), focusScan[0]!);
}

function thinLensWarnings(
  config: ThinLensFocalValidationConfig,
  expected: ThinLensFocalValidationResult["expected"],
  comparison: ThinLensFocalValidationResult["comparison"]
): SolverWarning[] {
  const warnings: SolverWarning[] = [
    {
      code: "validation.thinLens.scalarIdealOnly",
      message:
        "L6.4 is scalar ideal thin-lens diffraction validation, not full 3D Maxwell, FDTD, FEM, BEM, RCWA, real curved-glass lens, sensor, or digital-twin solving."
    },
    {
      code: "validation.thinLens.zeroThicknessPhaseMask",
      message:
        "The lens is an ideal zero-thickness quadratic phase mask with a circular pupil; no material thickness, dispersion, coatings, aberrations, or polarization is modeled."
    }
  ];
  if (Math.abs(expected.observationDefocusM) > config.wavelengthM) {
    warnings.push({
      code: "validation.thinLens.observationDefocused",
      message: `Observation plane is ${formatMm(expected.observationDefocusM)} mm from the nominal focal plane; Airy residuals are focal-plane validation evidence only at z = f.`
    });
  }
  if (!expected.firstDarkInsidePlane) {
    warnings.push({
      code: "validation.thinLens.firstDarkOutsidePlane",
      message: `Expected first dark ring is ${formatUm(expected.firstDarkRadiusM)} um from center. Current plane half-width is ${formatUm(expected.planeHalfWidthM)} um.`
    });
  }
  if (samplingIsUnderResolved(config, comparison, expected)) {
    warnings.push({
      code: "validation.thinLens.underResolvedFocalPlane",
      message:
        "Thin-lens focal validation sampling is coarse; increase pupil quadrature, radial samples, or map resolution before treating residuals as convergence evidence."
    });
  }
  return warnings;
}

function samplingIsUnderResolved(
  config: ThinLensFocalValidationConfig,
  comparison: ThinLensFocalValidationResult["comparison"],
  expected: ThinLensFocalValidationResult["expected"]
): boolean {
  return (
    config.numerical.apertureRadialSamples < 48 ||
    config.numerical.apertureAngularSamples < 96 ||
    config.numerical.radialObservationSamples < 81 ||
    config.observationPlane.resolution < 129 ||
    comparison.observationPixelSpacingM > expected.firstDarkRadiusM / 8
  );
}

function thinLensProvenance(): ThinLensFocalValidationResult["provenance"] {
  return {
    label: "L6.4 ideal thin-lens scalar focal-plane validation",
    limitations: [
      "This is an ideal scalar diffraction validation bench, not a full vector Maxwell lens solve.",
      "The numerical map is computed by Fresnel quadrature through an ideal thin-lens phase mask and compared against, but not generated from, the analytic Airy formula.",
      "The lens is a zero-thickness phase mask with a circular pupil; no real curved glass, finite thickness, material dispersion, coatings, aberrations, or polarization is modeled.",
      "The focal-plane Airy reference is a diffraction-limited benchmark for a coherent plane wave and ideal circular pupil.",
      "No FDTD, FEM, BEM, RCWA, sensor transport, ray tracing, or microscope digital-twin calibration is executed in L6.4."
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

function sumField(values: Float64Array): number {
  let sum = 0;
  for (const value of values) sum += value;
  return sum;
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

function configForHash(config: ThinLensFocalValidationConfig): unknown {
  return {
    ...config,
    wavelengthM: roundNumber(config.wavelengthM),
    lens: {
      ...config.lens,
      zM: roundNumber(config.lens.zM),
      focalLengthM: roundNumber(config.lens.focalLengthM)
    },
    pupil: {
      ...config.pupil,
      diameterM: roundNumber(config.pupil.diameterM),
      centerUM: roundNumber(config.pupil.centerUM),
      centerVM: roundNumber(config.pupil.centerVM)
    },
    observationPlane: {
      ...config.observationPlane,
      zM: roundNumber(config.observationPlane.zM),
      sizeM: roundNumber(config.observationPlane.sizeM)
    },
    numerical: {
      ...config.numerical,
      focusScanHalfRangeM: roundNumber(config.numerical.focusScanHalfRangeM)
    }
  };
}

function expectedForHash(expected: ThinLensFocalValidationResult["expected"]): unknown {
  return {
    firstDarkRadiusM: roundNumber(expected.firstDarkRadiusM),
    firstDarkRadiusSmallAngleM: roundNumber(expected.firstDarkRadiusSmallAngleM),
    firstDarkCoefficient: roundNumber(expected.firstDarkCoefficient),
    focalLengthM: roundNumber(expected.focalLengthM),
    pupilDiameterM: roundNumber(expected.pupilDiameterM),
    numericalApertureEstimate: roundNumber(expected.numericalApertureEstimate),
    observationDefocusM: roundNumber(expected.observationDefocusM),
    planeHalfWidthM: roundNumber(expected.planeHalfWidthM),
    firstDarkInsidePlane: expected.firstDarkInsidePlane,
    firstDarkInsidePlaneDiagonal: expected.firstDarkInsidePlaneDiagonal
  };
}

function residualsForHash(residuals: ThinLensFocalValidationResult["residuals"]): unknown {
  return {
    rmsResidual: roundNumber(residuals.rmsResidual),
    maxResidual: roundNumber(residuals.maxResidual),
    centerNormalizationError: roundNumber(residuals.centerNormalizationError),
    radialSymmetryError: roundNumber(residuals.radialSymmetryError),
    firstDarkRadiusErrorM: residuals.firstDarkRadiusErrorM === null ? null : roundNumber(residuals.firstDarkRadiusErrorM),
    finitePlaneIntegralRelativeError: roundNumber(residuals.finitePlaneIntegralRelativeError)
  };
}

function comparisonForHash(comparison: ThinLensFocalValidationResult["comparison"]): unknown {
  return {
    numericalMethod: comparison.numericalMethod,
    numericalIndependentOfAnalyticReference: comparison.numericalIndependentOfAnalyticReference,
    apertureRadialSamples: comparison.apertureRadialSamples,
    apertureAngularSamples: comparison.apertureAngularSamples,
    radialObservationSamples: comparison.radialObservationSamples,
    observationResolution: comparison.observationResolution,
    measuredFirstDarkRadiusM: comparison.measuredFirstDarkRadiusM === null ? null : roundNumber(comparison.measuredFirstDarkRadiusM),
    firstDarkRadiusErrorM: comparison.firstDarkRadiusErrorM === null ? null : roundNumber(comparison.firstDarkRadiusErrorM),
    firstDarkSearchStatus: comparison.firstDarkSearchStatus,
    finitePlaneIntegralRelativeError: roundNumber(comparison.energy.relativePlaneIntegralError),
    focus: {
      bestFocusZM: roundNumber(comparison.focus.bestFocusZM),
      bestFocusDefocusM: roundNumber(comparison.focus.bestFocusDefocusM),
      configuredPlanePeakRelative: roundNumber(comparison.focus.configuredPlanePeakRelative),
      configuredHalfMaxRadiusM: comparison.focus.configuredHalfMaxRadiusM === null ? null : roundNumber(comparison.focus.configuredHalfMaxRadiusM),
      bestHalfMaxRadiusM: comparison.focus.bestHalfMaxRadiusM === null ? null : roundNumber(comparison.focus.bestHalfMaxRadiusM)
    }
  };
}

function focusSampleForHash(sample: ThinLensFocusScanSample): unknown {
  return {
    zM: roundNumber(sample.zM),
    defocusM: roundNumber(sample.defocusM),
    centerIntensityRelative: roundNumber(sample.centerIntensityRelative),
    halfMaxRadiusM: sample.halfMaxRadiusM === null ? null : roundNumber(sample.halfMaxRadiusM)
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
