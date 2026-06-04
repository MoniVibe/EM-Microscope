import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { FieldOutput2D, SolverWarning } from "../solvers/Solver";

export type CoherenceDemonstratorMode = "coherent-fields" | "partial-coherence" | "incoherent-intensities";

export type CoherenceDemonstratorConfig = {
  id: string;
  label: string;
  mode: CoherenceDemonstratorMode;
  wavelengthM: number;
  propagationDistanceM: number;
  source: {
    kind: "monochromatic-scalar-source";
    coherenceModel: "two-slit-complex-degree-of-coherence";
  };
  aperture: {
    kind: "ideal-zero-thickness-long-double-slit-mask";
    slitWidthM: number;
    slitSeparationM: number;
  };
  coherence: {
    gammaMagnitude: number;
    gammaPhaseRad: number;
  };
  observationPlane: {
    widthM: number;
    heightM: number;
    widthSamples: number;
    heightSamples: number;
    thickness: "zero-mathematical-plane";
  };
  numerical: {
    method: "two-slit-scalar-huygens-fresnel-quadrature";
    apertureSamplesPerSlit: number;
  };
  orders: {
    min: number;
    max: number;
  };
};

export type CoherenceProfileSample = {
  positionM: number;
  slit1Intensity: number;
  slit2Intensity: number;
  coherentIntensity: number;
  incoherentIntensity: number;
  partialIntensity: number;
  selectedIntensity: number;
  interferenceTerm: number;
  interferenceMagnitude: number;
};

export type CoherenceOrderFeature = {
  order: number;
  expectedPositionM: number;
  smallAnglePositionM: number;
  measuredPositionM: number | null;
  errorM: number | null;
  visible: boolean;
};

export type CoherenceDemonstratorResult = {
  id: string;
  type: "l65CoherenceDemonstrator";
  analysisId: "analysis.wave.l6.phase5.coherenceDemonstrator";
  label: string;
  config: CoherenceDemonstratorConfig;
  configHash: string;
  resultHash: string;
  field: FieldOutput2D;
  selectedField: FieldOutput2D;
  coherentField: FieldOutput2D;
  incoherentField: FieldOutput2D;
  partialField: FieldOutput2D;
  interferenceField: FieldOutput2D;
  profile: CoherenceProfileSample[];
  expected: {
    orderSpacingM: number;
    orderSpacingSmallAngleM: number;
    equalIntensityVisibility: number;
    features: CoherenceOrderFeature[];
  };
  visibility: {
    measured: number;
    expected: number;
    error: number;
    maxIntensity: number;
    minIntensity: number;
    maxPositionM: number;
    minPositionM: number;
    formula: "V = (Imax - Imin) / (Imax + Imin)";
  };
  formulas: {
    coherentFields: "Icoh = |U1 + U2|^2";
    incoherentIntensities: "Iinc = |U1|^2 + |U2|^2";
    partialCoherence: "I = |U1|^2 + |U2|^2 + 2 Re(gamma12 U1 U2*)";
    visibility: "V = (Imax - Imin) / (Imax + Imin)";
    equalIntensityVisibility: "for equal slit intensities, V ~= |gamma12|";
    doubleSlitOrders: "d sin(theta) = m lambda";
  };
  warnings: SolverWarning[];
  provenance: {
    label: "L6.5 scalar double-slit coherence demonstrator";
    limitations: string[];
  };
};

type Complex = { re: number; im: number };
type CoherenceMapKind = "selected" | "coherent" | "incoherent" | "partial" | "interference";
type RawSample = {
  positionM: number;
  slit1Raw: number;
  slit2Raw: number;
  coherentRaw: number;
  incoherentRaw: number;
  partialRaw: number;
  selectedRaw: number;
  interferenceRaw: number;
};

export function defaultCoherenceDemonstratorConfig(): CoherenceDemonstratorConfig {
  return {
    id: "l65-coherence-demonstrator",
    label: "L6.5 Coherence Demonstrator: double slit",
    mode: "partial-coherence",
    wavelengthM: 500e-9,
    propagationDistanceM: 1,
    source: {
      kind: "monochromatic-scalar-source",
      coherenceModel: "two-slit-complex-degree-of-coherence"
    },
    aperture: {
      kind: "ideal-zero-thickness-long-double-slit-mask",
      slitWidthM: 20e-6,
      slitSeparationM: 100e-6
    },
    coherence: {
      gammaMagnitude: 1,
      gammaPhaseRad: 0
    },
    observationPlane: {
      widthM: 40e-3,
      heightM: 10e-3,
      widthSamples: 401,
      heightSamples: 81,
      thickness: "zero-mathematical-plane"
    },
    numerical: {
      method: "two-slit-scalar-huygens-fresnel-quadrature",
      apertureSamplesPerSlit: 160
    },
    orders: { min: -3, max: 3 }
  };
}

export function runCoherenceDemonstrator(input: Partial<CoherenceDemonstratorConfig> = {}): CoherenceDemonstratorResult {
  const config = normalizeCoherenceConfig(input);
  validateCoherenceConfig(config);

  const configHash = fnv1a64(stableStringify(configForHash(config)));
  const rawProfile = computeRawProfile(config);
  const profile = normalizeProfile(rawProfile);
  const features = measureOrderFeatures(config, profile);
  const selectedField = renderCoherenceField(config, profile, "selected");
  const coherentField = renderCoherenceField(config, profile, "coherent");
  const incoherentField = renderCoherenceField(config, profile, "incoherent");
  const partialField = renderCoherenceField(config, profile, "partial");
  const interferenceField = renderCoherenceField(config, profile, "interference");
  const visibility = measureVisibility(config, profile);
  const warnings = coherenceWarnings(config, visibility);
  const resultHash = fnv1a64(
    stableStringify({
      analysisId: "analysis.wave.l6.phase5.coherenceDemonstrator",
      configHash,
      visibility: visibilityForHash(visibility),
      features: features.map(featureForHash),
      warningCodes: warnings.map((warning) => warning.code)
    })
  );

  return {
    id: config.id,
    type: "l65CoherenceDemonstrator",
    analysisId: "analysis.wave.l6.phase5.coherenceDemonstrator",
    label: config.label,
    config,
    configHash,
    resultHash,
    field: selectedField,
    selectedField,
    coherentField,
    incoherentField,
    partialField,
    interferenceField,
    profile,
    expected: {
      orderSpacingM: orderSpacing(config),
      orderSpacingSmallAngleM: orderSpacingSmallAngle(config),
      equalIntensityVisibility: activeGammaMagnitude(config),
      features
    },
    visibility,
    formulas: {
      coherentFields: "Icoh = |U1 + U2|^2",
      incoherentIntensities: "Iinc = |U1|^2 + |U2|^2",
      partialCoherence: "I = |U1|^2 + |U2|^2 + 2 Re(gamma12 U1 U2*)",
      visibility: "V = (Imax - Imin) / (Imax + Imin)",
      equalIntensityVisibility: "for equal slit intensities, V ~= |gamma12|",
      doubleSlitOrders: "d sin(theta) = m lambda"
    },
    warnings,
    provenance: {
      label: "L6.5 scalar double-slit coherence demonstrator",
      limitations: [
        "This is a scalar two-slit coherence demonstrator, not a full stochastic/vector 3D Maxwell source model.",
        "The degree of coherence gamma12 only scales the two-slit interference term in a hand-checkable scalar formula.",
        "Slits are ideal zero-thickness amplitude masks with no finite-thickness material, edge boundary, or subwavelength vector aperture model.",
        "No FDTD, FEM, BEM, RCWA, sensor transport, real source statistics engine, or microscope digital-twin calibration is executed in L6.5."
      ]
    }
  };
}

export function coherenceDemonstratorJson(result: CoherenceDemonstratorResult): unknown {
  return {
    schema: "emmicro.coherenceDemonstrator.v1",
    id: result.id,
    type: result.type,
    analysisId: result.analysisId,
    label: result.label,
    config: result.config,
    configHash: result.configHash,
    resultHash: result.resultHash,
    formulas: result.formulas,
    expected: result.expected,
    visibility: result.visibility,
    warnings: result.warnings,
    profile: result.profile,
    selectedFieldPreview: fieldPreview(result.selectedField),
    coherentFieldPreview: fieldPreview(result.coherentField),
    incoherentFieldPreview: fieldPreview(result.incoherentField),
    partialFieldPreview: fieldPreview(result.partialField),
    interferenceFieldPreview: fieldPreview(result.interferenceField),
    provenance: result.provenance
  };
}

export function coherenceDemonstratorMarkdown(result: CoherenceDemonstratorResult): string {
  const featureLines = result.expected.features.map(
    (feature) =>
      `- Order m=${feature.order}: expected ${formatMm(feature.expectedPositionM)} mm, small-angle ${formatMm(feature.smallAnglePositionM)} mm, measured ${
        feature.measuredPositionM === null ? "n/a" : `${formatMm(feature.measuredPositionM)} mm`
      }, error ${feature.errorM === null ? "n/a" : `${formatMm(feature.errorM)} mm`}`
  );
  return [
    `# ${result.label}`,
    "",
    "## Parameters",
    `- Mode: ${modeLabel(result.config.mode)}`,
    `- Wavelength: ${formatNm(result.config.wavelengthM)} nm`,
    `- Slit width: ${formatUm(result.config.aperture.slitWidthM)} um`,
    `- Slit separation: ${formatUm(result.config.aperture.slitSeparationM)} um`,
    `- Propagation distance: ${formatM(result.config.propagationDistanceM)} m`,
    `- Observation plane: ${formatMm(result.config.observationPlane.widthM)} mm x ${formatMm(result.config.observationPlane.heightM)} mm`,
    `- Degree of coherence |gamma12|: ${result.config.coherence.gammaMagnitude.toFixed(3)}`,
    `- Coherence phase arg(gamma12): ${result.config.coherence.gammaPhaseRad.toFixed(3)} rad`,
    "",
    "## Hand Checks",
    `- Order spacing: dy ~= lambda L / d = ${formatMm(result.expected.orderSpacingSmallAngleM)} mm`,
    `- Visibility: V = ${result.visibility.measured.toFixed(3)}`,
    `- Expected equal-intensity visibility: |gamma12| ~= ${result.visibility.expected.toFixed(3)}`,
    `- Visibility error: ${result.visibility.error.toFixed(3)}`,
    ...featureLines,
    "",
    "## Formulas",
    `- ${result.formulas.coherentFields}`,
    `- ${result.formulas.incoherentIntensities}`,
    `- ${result.formulas.partialCoherence}`,
    `- ${result.formulas.visibility}`,
    `- ${result.formulas.equalIntensityVisibility}`,
    `- ${result.formulas.doubleSlitOrders}`,
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

export function coherenceDemonstratorCsv(result: CoherenceDemonstratorResult): string {
  const escape = (value: string) => `"${value.replaceAll("\"", "\"\"")}"`;
  const metricRows = [
    ["metric", "mode", "", "", "", "", "", modeLabel(result.config.mode)],
    ["metric", "gamma_magnitude", "", "", "", "", "", result.config.coherence.gammaMagnitude.toPrecision(12)],
    ["metric", "visibility_measured", "", "", "", "", "", result.visibility.measured.toPrecision(12)],
    ["metric", "visibility_expected", "", "", "", "", "", result.visibility.expected.toPrecision(12)],
    ["metric", "visibility_error", "", "", "", "", "", result.visibility.error.toPrecision(12)],
    ["metric", "order_spacing_mm", "", "", "", "", "", formatMm(result.expected.orderSpacingSmallAngleM)]
  ];
  const profileRows = result.profile.map((sample) => [
    "profile",
    "centerline",
    (sample.positionM * 1e3).toPrecision(12),
    sample.coherentIntensity.toPrecision(12),
    sample.incoherentIntensity.toPrecision(12),
    sample.partialIntensity.toPrecision(12),
    sample.selectedIntensity.toPrecision(12),
    sample.interferenceTerm.toPrecision(12)
  ]);
  return [
    "section,name,position_mm,coherent_intensity,incoherent_intensity,partial_intensity,selected_intensity,interference_term_or_value",
    ...metricRows.map((row) => row.map(escape).join(",")),
    ...profileRows.map((row) => row.map(escape).join(","))
  ].join("\n");
}

function normalizeCoherenceConfig(input: Partial<CoherenceDemonstratorConfig>): CoherenceDemonstratorConfig {
  const defaults = defaultCoherenceDemonstratorConfig();
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
    coherence: {
      ...defaults.coherence,
      ...input.coherence
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

function validateCoherenceConfig(config: CoherenceDemonstratorConfig): void {
  if (config.wavelengthM <= 0 || !Number.isFinite(config.wavelengthM)) throw new Error("coherence wavelength must be positive");
  if (config.propagationDistanceM <= 0 || !Number.isFinite(config.propagationDistanceM)) throw new Error("coherence propagation distance must be positive");
  if (config.aperture.slitWidthM <= 0 || !Number.isFinite(config.aperture.slitWidthM)) throw new Error("coherence slit width must be positive");
  if (config.aperture.slitSeparationM <= config.aperture.slitWidthM) throw new Error("coherence slit separation must be greater than slit width");
  if (config.coherence.gammaMagnitude < 0 || config.coherence.gammaMagnitude > 1 || !Number.isFinite(config.coherence.gammaMagnitude)) {
    throw new Error("coherence gamma magnitude must be finite and between 0 and 1");
  }
  if (!Number.isFinite(config.coherence.gammaPhaseRad)) throw new Error("coherence gamma phase must be finite");
  if (config.observationPlane.widthM <= 0 || config.observationPlane.heightM <= 0) throw new Error("coherence observation plane dimensions must be positive");
  if (!Number.isInteger(config.observationPlane.widthSamples) || config.observationPlane.widthSamples < 65) throw new Error("coherence widthSamples must be an integer >= 65");
  if (!Number.isInteger(config.observationPlane.heightSamples) || config.observationPlane.heightSamples < 3) throw new Error("coherence heightSamples must be an integer >= 3");
  if (!Number.isInteger(config.numerical.apertureSamplesPerSlit) || config.numerical.apertureSamplesPerSlit < 16) throw new Error("apertureSamplesPerSlit must be an integer >= 16");
  if (!Number.isInteger(config.orders.min) || !Number.isInteger(config.orders.max) || config.orders.min > config.orders.max) throw new Error("invalid coherence order range");
}

function computeRawProfile(config: CoherenceDemonstratorConfig): RawSample[] {
  const samples = config.observationPlane.widthSamples;
  const width = config.observationPlane.widthM;
  const left = slitInterval(-config.aperture.slitSeparationM / 2, config.aperture.slitWidthM);
  const right = slitInterval(config.aperture.slitSeparationM / 2, config.aperture.slitWidthM);
  const gammaRe = activeGammaMagnitude(config) * Math.cos(config.coherence.gammaPhaseRad);
  const gammaIm = activeGammaMagnitude(config) * Math.sin(config.coherence.gammaPhaseRad);

  return Array.from({ length: samples }, (_, index) => {
    const positionM = -width / 2 + (width * index) / (samples - 1);
    const u1 = complexSlitContribution(positionM, left, config);
    const u2 = complexSlitContribution(positionM, right, config);
    const slit1Raw = complexIntensity(u1);
    const slit2Raw = complexIntensity(u2);
    const u1u2Conjugate = complexMultiply(u1, { re: u2.re, im: -u2.im });
    const coherentInterferenceRaw = 2 * u1u2Conjugate.re;
    const partialInterferenceRaw = 2 * (gammaRe * u1u2Conjugate.re - gammaIm * u1u2Conjugate.im);
    const incoherentRaw = slit1Raw + slit2Raw;
    const coherentRaw = clampNonnegative(incoherentRaw + coherentInterferenceRaw);
    const partialRaw = clampNonnegative(incoherentRaw + partialInterferenceRaw);
    const selectedRaw =
      config.mode === "coherent-fields"
        ? coherentRaw
        : config.mode === "incoherent-intensities"
          ? incoherentRaw
          : partialRaw;
    return {
      positionM,
      slit1Raw,
      slit2Raw,
      coherentRaw,
      incoherentRaw,
      partialRaw,
      selectedRaw,
      interferenceRaw: partialInterferenceRaw
    };
  });
}

function normalizeProfile(rawProfile: RawSample[]): CoherenceProfileSample[] {
  const slitPeak = Math.max(1e-30, ...rawProfile.map((sample) => Math.max(sample.slit1Raw, sample.slit2Raw)));
  const coherentPeak = Math.max(1e-30, ...rawProfile.map((sample) => sample.coherentRaw));
  const incoherentPeak = Math.max(1e-30, ...rawProfile.map((sample) => sample.incoherentRaw));
  const partialPeak = Math.max(1e-30, ...rawProfile.map((sample) => sample.partialRaw));
  const selectedPeak = Math.max(1e-30, ...rawProfile.map((sample) => sample.selectedRaw));
  const interferencePeak = Math.max(1e-30, ...rawProfile.map((sample) => Math.abs(sample.interferenceRaw)));
  return rawProfile.map((sample) => ({
    positionM: sample.positionM,
    slit1Intensity: sample.slit1Raw / slitPeak,
    slit2Intensity: sample.slit2Raw / slitPeak,
    coherentIntensity: sample.coherentRaw / coherentPeak,
    incoherentIntensity: sample.incoherentRaw / incoherentPeak,
    partialIntensity: sample.partialRaw / partialPeak,
    selectedIntensity: sample.selectedRaw / selectedPeak,
    interferenceTerm: sample.interferenceRaw / interferencePeak,
    interferenceMagnitude: Math.abs(sample.interferenceRaw) / interferencePeak
  }));
}

function renderCoherenceField(config: CoherenceDemonstratorConfig, profile: CoherenceProfileSample[], kind: CoherenceMapKind): FieldOutput2D {
  const width = config.observationPlane.widthSamples;
  const height = config.observationPlane.heightSamples;
  const intensity = new Float64Array(width * height);
  const phaseRad = new Float64Array(width * height);

  for (let vIndex = 0; vIndex < height; vIndex += 1) {
    for (let uIndex = 0; uIndex < width; uIndex += 1) {
      const sample = profile[uIndex] ?? profile[profile.length - 1]!;
      const index = vIndex * width + uIndex;
      intensity[index] =
        kind === "coherent"
          ? sample.coherentIntensity
          : kind === "incoherent"
            ? sample.incoherentIntensity
            : kind === "partial"
              ? sample.partialIntensity
              : kind === "interference"
                ? sample.interferenceMagnitude
                : sample.selectedIntensity;
    }
  }

  return {
    id: `${config.id}-${kind}-map`,
    type: "fieldImage2D",
    planeId: "l65-coherence-observation-plane",
    gridId: "l65-coherence-observation-grid",
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
    provenance: {
      kind: "simulated",
      level: "L2",
      solverId: "scalar.angularSpectrum.l2.1d",
      model: "scalar-wave-1d-angular-spectrum",
      dimensionality: "2d",
      approximation: [
        "two-slit scalar Huygens-Fresnel quadrature",
        "long-slit invariant map extrusion",
        "ideal zero-thickness amplitude masks",
        "complex degree of coherence scales only the interference term"
      ]
    }
  };
}

function measureVisibility(config: CoherenceDemonstratorConfig, profile: CoherenceProfileSample[]): CoherenceDemonstratorResult["visibility"] {
  const spacing = orderSpacingSmallAngle(config);
  const centerWindow = Math.max(spacing * 0.18, config.observationPlane.widthM / (config.observationPlane.widthSamples - 1));
  const valleyWindow = Math.max(spacing * 0.18, config.observationPlane.widthM / (config.observationPlane.widthSamples - 1));
  const centralSamples = profile.filter((sample) => Math.abs(sample.positionM) <= centerWindow);
  const valleySamples = profile.filter((sample) => Math.abs(Math.abs(sample.positionM) - spacing / 2) <= valleyWindow);
  const maxSample = maxBy(centralSamples.length ? centralSamples : profile, (sample) => sample.selectedIntensity);
  const minSample = minBy(valleySamples.length ? valleySamples : profile, (sample) => sample.selectedIntensity);
  const denominator = maxSample.selectedIntensity + minSample.selectedIntensity;
  const measured = denominator > 0 ? clamp((maxSample.selectedIntensity - minSample.selectedIntensity) / denominator, 0, 1) : 0;
  const expected = activeGammaMagnitude(config);
  return {
    measured,
    expected,
    error: Math.abs(measured - expected),
    maxIntensity: maxSample.selectedIntensity,
    minIntensity: minSample.selectedIntensity,
    maxPositionM: maxSample.positionM,
    minPositionM: minSample.positionM,
    formula: "V = (Imax - Imin) / (Imax + Imin)"
  };
}

function measureOrderFeatures(config: CoherenceDemonstratorConfig, profile: CoherenceProfileSample[]): CoherenceOrderFeature[] {
  const features: CoherenceOrderFeature[] = [];
  const spacingM = orderSpacing(config);
  for (let order = config.orders.min; order <= config.orders.max; order += 1) {
    const expectedPositionM = expectedOrderPosition(config, order);
    if (!Number.isFinite(expectedPositionM)) continue;
    const smallAnglePositionM = order * orderSpacingSmallAngle(config);
    const visible = Math.abs(expectedPositionM) <= config.observationPlane.widthM / 2;
    const measured = visible ? measureCoherentMaximum(profile, expectedPositionM, spacingM) : null;
    features.push({
      order,
      expectedPositionM,
      smallAnglePositionM,
      measuredPositionM: measured,
      errorM: measured === null ? null : Math.abs(measured - expectedPositionM),
      visible
    });
  }
  return features;
}

function measureCoherentMaximum(profile: CoherenceProfileSample[], expectedPositionM: number, spacingM: number): number | null {
  const windowM = Math.max(Math.abs(spacingM) * 0.35, 1e-9);
  const samples = profile.filter((sample) => Math.abs(sample.positionM - expectedPositionM) <= windowM);
  return samples.length ? maxBy(samples, (sample) => sample.coherentIntensity).positionM : null;
}

function coherenceWarnings(config: CoherenceDemonstratorConfig, visibility: CoherenceDemonstratorResult["visibility"]): SolverWarning[] {
  const warnings: SolverWarning[] = [
    {
      code: "validation.coherence.scalarOnly",
      message: "L6.5 coherence demonstrator is scalar two-slit validation, not full stochastic/vector 3D Maxwell, FDTD, FEM, BEM, RCWA, sensor, or digital-twin solving."
    }
  ];
  if (config.numerical.apertureSamplesPerSlit < 96 || config.observationPlane.widthSamples < 129) {
    warnings.push({
      code: "validation.coherence.underResolved",
      message: "Coherence demonstration sampling is coarse; increase slit quadrature or observation samples before treating visibility as convergence evidence."
    });
  }
  if (visibility.error > 0.12) {
    warnings.push({
      code: "validation.coherence.visibilityApproximation",
      message: "Measured visibility is far from the equal-intensity approximation; check gamma phase, geometry, and finite envelope variation."
    });
  }
  return warnings;
}

function activeGammaMagnitude(config: CoherenceDemonstratorConfig): number {
  if (config.mode === "coherent-fields") return 1;
  if (config.mode === "incoherent-intensities") return 0;
  return config.coherence.gammaMagnitude;
}

function expectedOrderPosition(config: CoherenceDemonstratorConfig, order: number): number {
  const sinTheta = (order * config.wavelengthM) / config.aperture.slitSeparationM;
  if (Math.abs(sinTheta) >= 1) return Number.NaN;
  return config.propagationDistanceM * (sinTheta / Math.sqrt(1 - sinTheta * sinTheta));
}

function orderSpacing(config: CoherenceDemonstratorConfig): number {
  const sinTheta = config.wavelengthM / config.aperture.slitSeparationM;
  return config.propagationDistanceM * (sinTheta / Math.sqrt(1 - sinTheta * sinTheta));
}

function orderSpacingSmallAngle(config: CoherenceDemonstratorConfig): number {
  return (config.wavelengthM * config.propagationDistanceM) / config.aperture.slitSeparationM;
}

function complexSlitContribution(positionM: number, interval: { minM: number; maxM: number }, config: CoherenceDemonstratorConfig): Complex {
  const samples = config.numerical.apertureSamplesPerSlit;
  const dx = (interval.maxM - interval.minM) / samples;
  const waveNumber = (2 * Math.PI) / config.wavelengthM;
  let re = 0;
  let im = 0;
  for (let index = 0; index < samples; index += 1) {
    const aperturePositionM = interval.minM + (index + 0.5) * dx;
    const pathM = Math.sqrt(config.propagationDistanceM * config.propagationDistanceM + (positionM - aperturePositionM) * (positionM - aperturePositionM));
    const phase = waveNumber * (pathM - config.propagationDistanceM);
    re += Math.cos(phase) * dx;
    im += Math.sin(phase) * dx;
  }
  return { re, im };
}

function slitInterval(centerM: number, widthM: number): { minM: number; maxM: number } {
  return {
    minM: centerM - widthM / 2,
    maxM: centerM + widthM / 2
  };
}

function complexIntensity(value: Complex): number {
  return value.re * value.re + value.im * value.im;
}

function complexMultiply(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re
  };
}

function clampNonnegative(value: number): number {
  return value < 0 && value > -1e-24 ? 0 : Math.max(0, value);
}

function minBy<T>(items: T[], score: (item: T) => number): T {
  if (items.length === 0) throw new Error("minBy requires at least one item");
  let best = items[0] as T;
  for (let i = 1; i < items.length; i++) {
    const item = items[i] as T;
    if (score(item) < score(best)) best = item;
  }
  return best;
}

function maxBy<T>(items: T[], score: (item: T) => number): T {
  if (items.length === 0) throw new Error("maxBy requires at least one item");
  let best = items[0] as T;
  for (let i = 1; i < items.length; i++) {
    const item = items[i] as T;
    if (score(item) > score(best)) best = item;
  }
  return best;
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

function configForHash(config: CoherenceDemonstratorConfig): unknown {
  return {
    ...config,
    wavelengthM: roundNumber(config.wavelengthM),
    propagationDistanceM: roundNumber(config.propagationDistanceM),
    aperture: {
      ...config.aperture,
      slitWidthM: roundNumber(config.aperture.slitWidthM),
      slitSeparationM: roundNumber(config.aperture.slitSeparationM)
    },
    coherence: {
      gammaMagnitude: roundNumber(config.coherence.gammaMagnitude),
      gammaPhaseRad: roundNumber(config.coherence.gammaPhaseRad)
    },
    observationPlane: {
      ...config.observationPlane,
      widthM: roundNumber(config.observationPlane.widthM),
      heightM: roundNumber(config.observationPlane.heightM)
    }
  };
}

function featureForHash(feature: CoherenceOrderFeature): unknown {
  return {
    order: feature.order,
    expectedPositionM: roundNumber(feature.expectedPositionM),
    smallAnglePositionM: roundNumber(feature.smallAnglePositionM),
    measuredPositionM: feature.measuredPositionM === null ? null : roundNumber(feature.measuredPositionM),
    errorM: feature.errorM === null ? null : roundNumber(feature.errorM),
    visible: feature.visible
  };
}

function visibilityForHash(visibility: CoherenceDemonstratorResult["visibility"]): unknown {
  return {
    measured: roundNumber(visibility.measured),
    expected: roundNumber(visibility.expected),
    error: roundNumber(visibility.error),
    maxIntensity: roundNumber(visibility.maxIntensity),
    minIntensity: roundNumber(visibility.minIntensity),
    maxPositionM: roundNumber(visibility.maxPositionM),
    minPositionM: roundNumber(visibility.minPositionM)
  };
}

function modeLabel(mode: CoherenceDemonstratorMode): string {
  if (mode === "coherent-fields") return "Coherent fields";
  if (mode === "incoherent-intensities") return "Incoherent intensities";
  return "Partial coherence";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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
