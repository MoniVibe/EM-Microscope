import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { FieldOutput2D, SolverWarning } from "../solvers/Solver";
import {
  defaultCircularApertureValidationConfig,
  runCircularApertureValidation,
  type CircularApertureValidationConfig
} from "../wave/circularApertureValidation";
import {
  defaultCoherenceDemonstratorConfig,
  runCoherenceDemonstrator,
  type CoherenceDemonstratorConfig
} from "../wave/coherenceDemonstrator";
import {
  defaultSlitOrderValidationConfig,
  runSlitOrderValidation,
  type SlitOrderBenchmarkKind,
  type SlitOrderValidationConfig
} from "../wave/slitOrderValidation";
import {
  defaultThinLensFocalValidationConfig,
  runThinLensFocalValidation,
  type ThinLensFocalValidationConfig
} from "../wave/thinLensFocalValidation";
import { runCoatingSweep, type CoatingStackDefinition, type CoatingStackRunOptions } from "../maxwell/coatingStack";
import { runRobustCoatingSearch, type RobustCoatingSearchSpec } from "../maxwell/coatingRobustSearch";

export type StudyCapabilityStatus = "executable" | "scaffold-only" | "not-implemented";

export type StudyCapability = {
  id: string;
  label: string;
  status: StudyCapabilityStatus;
  evidence: string;
  boundary: string;
};

export type StudyMetric = {
  id: string;
  label: string;
  value: number;
  unit?: string;
};

export type StudyProfilePoint = {
  xM: number;
  intensity: number;
  label?: string;
};

export type StudyMode =
  | "validation.circular-aperture"
  | "validation.single-slit"
  | "validation.double-slit"
  | "validation.thin-lens"
  | "validation.coherence"
  | "validation.advisor-review"
  | "measured.comparison"
  | "camera.sensor-lite"
  | "camera.calibration"
  | "image-quality.mtf"
  | "image-quality.focus-field-mtf"
  | "image-quality.geometric-calibration"
  | "coating.planar-stack"
  | "coating.optimizer"
  | "coating.robust-optimizer";

export type StudySnapshotInput = {
  id?: string;
  name: string;
  mode: StudyMode;
  selectedWorkbench: "validation-bench" | "coating-stack-workbench" | "advisor-review" | "measured-vs-simulated" | "camera-sensor-lite" | "camera-calibration" | "resolution-mtf" | "focus-field-mtf" | "geometric-calibration";
  inputs: unknown;
  appState?: unknown;
  backendReceipt: unknown;
  materialReceipts?: unknown[];
  uncertaintyReceipts?: unknown[];
  resultHashes: string[];
  metrics: StudyMetric[];
  profiles?: Record<string, StudyProfilePoint[]>;
  warnings: SolverWarning[];
  limitations: string[];
  createdAtIso?: string;
};

export type StudySnapshot = Required<Omit<StudySnapshotInput, "id" | "materialReceipts" | "uncertaintyReceipts" | "profiles" | "createdAtIso">> & {
  schema: "emmicro.studySnapshot.v1";
  type: "l66PracticalStudy" | "l67PracticalStudy" | "l68PracticalStudy" | "l69PracticalStudy" | "l70PracticalStudy" | "l71PracticalStudy" | "l72PracticalStudy";
  id: string;
  createdAtIso: string;
  materialReceipts: unknown[];
  uncertaintyReceipts: unknown[];
  profiles: Record<string, StudyProfilePoint[]>;
  capabilities: StudyCapability[];
  resultHash: string;
};

export type StudyBundle = {
  schema: "emmicro.studyBundle.v1";
  appVersion: string;
  manifest: {
    appVersion: string;
    studyHash: string;
    resultHashes: string[];
    backendReceipt: unknown;
    materialReceiptCount: number;
    uncertaintyReceiptCount: number;
    warningCount: number;
    capabilityBoundary: string;
  };
  study: StudySnapshot;
  metricsCsv: string;
  profilesCsv: string;
  warningsJson: SolverWarning[];
  capabilities: StudyCapability[];
  comparison?: StudyComparisonResult;
  measuredComparison?: unknown;
  cameraRun?: unknown;
  calibrationRun?: unknown;
  mtfRun?: unknown;
  mtfComparison?: unknown;
  linePairRun?: unknown;
  focusSweepRun?: unknown;
  fieldMtfMap?: unknown;
  qualificationRun?: unknown;
  focusFieldComparison?: unknown;
  geometricTarget?: unknown;
  geometricFit?: unknown;
  geometricComparison?: unknown;
  sweep?: PracticalSweepResult;
};

export type PracticalSweepFamily =
  | "coherence-gamma"
  | "validation-wavelength"
  | "observation-z"
  | "slit-width"
  | "double-slit-separation"
  | "thin-lens-defocus"
  | "coating-wavelength"
  | "coating-robust-sigma";

export type PracticalSweepInput = {
  id?: string;
  label?: string;
  family: PracticalSweepFamily;
  start: number;
  stop: number;
  sampleCount: number;
  maxRuns?: number;
};

export type PracticalSweepRow = {
  index: number;
  parameter: StudyMetric;
  metrics: StudyMetric[];
  resultHash: string;
  warningCount: number;
};

export type PracticalSweepResult = {
  schema: "emmicro.practicalSweep.v1";
  id: string;
  label: string;
  family: PracticalSweepFamily;
  requestedRunCount: number;
  executedRunCount: number;
  budget: {
    maxRuns: number;
    truncated: boolean;
  };
  rows: PracticalSweepRow[];
  bestRow: PracticalSweepRow | null;
  worstRow: PracticalSweepRow | null;
  warnings: SolverWarning[];
  resultHash: string;
  provenance: {
    label: "L6.6 practical parameter sweep";
    limitations: string[];
  };
};

export type FieldMarker = {
  id: string;
  label: string;
  uM: number;
  vM: number;
  intensity: number;
  units: {
    u: "m";
    v: "m";
    intensity: "relative" | "W/m^2";
  };
};

export type FieldRoiMeasurement = {
  id: string;
  label: string;
  uMinM: number;
  uMaxM: number;
  vMinM: number;
  vMaxM: number;
  sampleCount: number;
  minIntensity: number;
  maxIntensity: number;
  meanIntensity: number;
};

export type FirstMinimumDetection = {
  status: "measured" | "not-resolved";
  positionM: number | null;
  intensity: number | null;
  index: number | null;
};

export type StudyRunSummary = {
  id: string;
  label: string;
  kind: StudyMode | PracticalSweepFamily | string;
  resultHash: string;
  metrics: StudyMetric[];
  warnings?: SolverWarning[];
  limitations?: string[];
  field?: FieldOutput2D;
};

export type StudyComparisonDelta = {
  id: string;
  label: string;
  unit?: string;
  a: number;
  b: number;
  delta: number;
  percentDelta: number | null;
};

export type StudyComparisonResult = {
  schema: "emmicro.studyComparison.v1";
  id: string;
  label: string;
  runA: StudyRunSummary;
  runB: StudyRunSummary;
  compatible: boolean;
  deltas: StudyComparisonDelta[];
  differenceField?: FieldOutput2D;
  warnings: SolverWarning[];
  resultHash: string;
};

export function l70CapabilitiesMatrix(): StudyCapability[] {
  return l72CapabilitiesMatrix();
}

export function l71CapabilitiesMatrix(): StudyCapability[] {
  return l72CapabilitiesMatrix();
}

export function l72CapabilitiesMatrix(): StudyCapability[] {
  return [
    executable("planar-tmm-backend", "PlanarTmmBackend", "registered Maxwell backend executing 1D planar transfer-matrix coating stacks"),
    executable("coating-stack-optimizer", "Coating Stack Optimizer", "deterministic local material/order/thickness search over planar TMM runs"),
    executable("robust-coating-drift-yield", "Robust coating drift/yield", "deterministic thickness drift/yield re-ranking over planar coating candidates"),
    executable("circular-aperture-validation", "Circular aperture scalar validation", "Airy/Bessel scalar benchmark with numerical Huygens-Fresnel comparison"),
    executable("single-slit-validation", "Single slit scalar validation", "coherent long-slit sinc^2 benchmark"),
    executable("double-slit-validation", "Double slit/order validation", "coherent double-slit order-spacing benchmark"),
    executable("thin-lens-validation", "Thin lens scalar validation", "ideal zero-thickness thin-lens focal-plane scalar benchmark"),
    executable("coherence-demo", "Coherence scalar demo", "scalar double-slit gamma12 interference-term demonstrator"),
    executable("measured-vs-simulated-workbench", "Measured-vs-Simulated Workbench", "diagnostic profile/image-centerline comparison against existing scalar validation or planar TMM outputs"),
    executable("camera-sensor-lite-acquisition", "Camera/Sensor-Lite acquisition", "deterministic detector/acquisition post-process converting existing optical intensity to photons, electrons, DN, SNR, saturation, histogram, and profile metrics"),
    executable("camera-calibration-diagnostics", "Camera calibration diagnostics", "EMVA-inspired photon-transfer diagnostic import, fitting, residual, and report workflow over summary measurements"),
    executable("resolution-mtf-diagnostics", "Resolution MTF diagnostics", "deterministic slanted-edge ESF/LSF/SFR-MTF analysis with MTF50, MTF10, Nyquist, cycles/pixel, optional lp/mm, and exportable diagnostic reports"),
    executable("slanted-edge-sfr-diagnostics", "Slanted-edge SFR diagnostics", "ISO 12233-inspired ROI workbench for generated/imported slanted-edge targets, measured-vs-simulated MTF comparison, and line-pair sanity checks"),
    executable("focus-sweep-mtf-diagnostics", "Focus sweep MTF diagnostics", "deterministic synthetic/imported focus-position MTF50/MTF10/MTF-area sweep with best-focus and depth-of-focus readouts"),
    executable("field-mtf-map-diagnostics", "Field MTF map diagnostics", "center/corner/3x3 ROI slanted-edge MTF mapping with best/worst ROI, center-corner falloff, and uniformity summaries"),
    executable("mtf-qualification-threshold-report", "MTF qualification threshold report", "configurable diagnostic PASS/FAIL/WARNING report over focus sweep, field map, Nyquist availability, and warning policies"),
    executable("geometric-distortion-diagnostics", "Geometric distortion diagnostics", "deterministic dot/checker/line target point fitting with similarity, affine, radial distortion, residual vector, and correction diagnostics"),
    executable("pixel-scale-diagnostic-calibration", "Pixel-scale diagnostic calibration", "single-image 2D grid target pixel-scale, rotation, skew, residual, center/corner consistency, and report workflow"),
    scaffold("external-fdtd-export", "ExternalFdtdBackend export", "scene/result schema and Meep-style export scaffold only"),
    unavailable("3d-maxwell-solve", "3D Maxwell solve"),
    unavailable("fdtd-fem-bem-rcwa-execution", "FDTD/FEM/BEM/RCWA execution"),
    unavailable("arbitrary-cad-geometry", "Arbitrary CAD geometry"),
    unavailable("pixel-level-sensor-stack", "Pixel-level EM sensor stack"),
    unavailable("sensor-stack-simulation", "Sensor-stack simulation"),
    unavailable("emva-1288-certification", "EMVA 1288 certification"),
    unavailable("certified-emva-characterization", "Certified EMVA 1288 characterization"),
    unavailable("certified-lab-calibration", "Certified lab calibration"),
    unavailable("certified-camera-calibration", "Certified camera calibration"),
    unavailable("lab-accredited-metrology", "Lab-accredited metrology"),
    unavailable("iso-12233-certification", "ISO 12233 certification"),
    unavailable("imatest-equivalent-certification", "Imatest-equivalent certification"),
    unavailable("pure-lens-mtf-certification", "Pure lens-only MTF certification"),
    unavailable("calibrated-optical-model-fitting", "Calibrated optical model fitting"),
    unavailable("full-3d-pose-calibration", "Full 3D pose calibration"),
    unavailable("stereo-calibration", "Stereo calibration"),
    unavailable("material-uncertainty", "Material uncertainty"),
    unavailable("digital-twin-calibration", "Digital twin calibration"),
    unavailable("manufacturing-certification", "Manufacturing certification")
  ];
}

export function l69CapabilitiesMatrix(): StudyCapability[] {
  return l72CapabilitiesMatrix();
}

export function l68CapabilitiesMatrix(): StudyCapability[] {
  return l72CapabilitiesMatrix();
}

export function l67CapabilitiesMatrix(): StudyCapability[] {
  return l72CapabilitiesMatrix();
}

export function l66CapabilitiesMatrix(): StudyCapability[] {
  return l72CapabilitiesMatrix();
}

export function capabilitiesMarkdown(capabilities: StudyCapability[] = l72CapabilitiesMatrix()): string {
  return [
    "| Capability | Status | Evidence |",
    "| --- | --- | --- |",
    ...capabilities.map((capability) => `| ${capability.label} | ${capability.status} | ${capability.evidence} |`)
  ].join("\n");
}

export function capabilitiesCsv(capabilities: StudyCapability[] = l72CapabilitiesMatrix()): string {
  return [
    "id,label,status,evidence,boundary",
    ...capabilities.map((capability) => [capability.id, capability.label, capability.status, capability.evidence, capability.boundary].map(csvEscape).join(","))
  ].join("\n");
}

export function createStudySnapshot(input: StudySnapshotInput): StudySnapshot {
  const createdAtIso = input.createdAtIso ?? new Date().toISOString();
  const base = {
    schema: "emmicro.studySnapshot.v1" as const,
    type: "l72PracticalStudy" as const,
    id: input.id ?? slugId(input.name),
    name: input.name,
    mode: input.mode,
    selectedWorkbench: input.selectedWorkbench,
    createdAtIso,
    inputs: input.inputs,
    appState: input.appState ?? null,
    backendReceipt: input.backendReceipt,
    materialReceipts: input.materialReceipts ?? [],
    uncertaintyReceipts: input.uncertaintyReceipts ?? [],
    resultHashes: [...input.resultHashes],
    metrics: [...input.metrics],
    profiles: input.profiles ?? {},
    warnings: [...input.warnings],
    limitations: [...input.limitations],
    capabilities: l72CapabilitiesMatrix()
  };
  const resultHash = fnv1a64(stableStringify(studyForHash(base)));
  return { ...base, resultHash };
}

export function studyBundleJson(
  study: StudySnapshot,
  options: {
    sweep?: PracticalSweepResult;
    comparison?: StudyComparisonResult;
    measuredComparison?: unknown;
    cameraRun?: unknown;
    calibrationRun?: unknown;
    mtfRun?: unknown;
    mtfComparison?: unknown;
    linePairRun?: unknown;
    focusSweepRun?: unknown;
    fieldMtfMap?: unknown;
    qualificationRun?: unknown;
    focusFieldComparison?: unknown;
    geometricTarget?: unknown;
    geometricFit?: unknown;
    geometricComparison?: unknown;
  } = {}
): StudyBundle {
  return {
    schema: "emmicro.studyBundle.v1",
    appVersion: "L7.2 Geometric Calibration / Distortion & Pixel-Scale Workbench",
    manifest: {
      appVersion: "L7.2",
      studyHash: study.resultHash,
      resultHashes: [...study.resultHashes],
      backendReceipt: study.backendReceipt,
      materialReceiptCount: study.materialReceipts.length,
      uncertaintyReceiptCount: study.uncertaintyReceipts.length,
      warningCount: study.warnings.length,
      capabilityBoundary: "Executable capabilities are scalar validation, planar TMM, diagnostic measured-vs-simulated comparison, Camera/Sensor-Lite detector acquisition post-processing, EMVA-inspired diagnostic camera calibration, ISO 12233-inspired slanted-edge/line-pair MTF diagnostics, L7.1 focus/field MTF qualification diagnostics, and L7.2 diagnostic 2D geometric calibration/distortion/pixel-scale workflows only; pixel-level EM sensor stacks, certified camera calibration, ISO 12233 certification, Imatest-equivalent certification, lab-accredited metrology, EMVA 1288 certification, pure lens-only MTF certification, certified lab calibration, calibrated optical model fitting, full 3D pose/stereo calibration, 3D Maxwell/FDTD/FEM/BEM/RCWA/CAD, digital twins, and manufacturing certification are not implemented."
    },
    study,
    metricsCsv: studyMetricsCsv(study),
    profilesCsv: studyProfilesCsv(study),
    warningsJson: study.warnings,
    capabilities: study.capabilities,
    comparison: options.comparison,
    measuredComparison: options.measuredComparison,
    cameraRun: options.cameraRun,
    calibrationRun: options.calibrationRun,
    mtfRun: options.mtfRun,
    mtfComparison: options.mtfComparison,
    linePairRun: options.linePairRun,
    focusSweepRun: options.focusSweepRun,
    fieldMtfMap: options.fieldMtfMap,
    qualificationRun: options.qualificationRun,
    focusFieldComparison: options.focusFieldComparison,
    geometricTarget: options.geometricTarget,
    geometricFit: options.geometricFit,
    geometricComparison: options.geometricComparison,
    sweep: options.sweep
  };
}

export function parseStudyBundleJson(text: string): StudyBundle {
  const parsed = JSON.parse(text) as Partial<StudyBundle>;
  if (parsed.schema !== "emmicro.studyBundle.v1") throw new Error("unsupported study bundle schema");
  if (!parsed.study || parsed.study.schema !== "emmicro.studySnapshot.v1") throw new Error("study bundle is missing a study snapshot");
  return parsed as StudyBundle;
}

export function studyBundleMarkdown(bundle: StudyBundle): string {
  return [
    `# ${bundle.study.name}`,
    "",
    `App version: ${bundle.appVersion}`,
    `Study hash: ${bundle.study.resultHash}`,
    `Mode: ${bundle.study.mode}`,
    `Workbench: ${bundle.study.selectedWorkbench}`,
    "",
    "## Metrics",
    ...bundle.study.metrics.map((metric) => `- ${metric.label}: ${formatMetricValue(metric)}`),
    "",
    "## Capabilities",
    capabilitiesMarkdown(bundle.capabilities),
    "",
    "## Warnings",
    ...(bundle.study.warnings.length ? bundle.study.warnings.map((warning) => `- ${warning.message}`) : ["- none"]),
    "",
    "## Limitations",
    ...bundle.study.limitations.map((limitation) => `- ${limitation}`)
  ].join("\n");
}

export function studyMetricsCsv(study: StudySnapshot): string {
  return ["study_id,metric_id,label,value,unit", ...study.metrics.map((metric) => [study.id, metric.id, metric.label, metric.value, metric.unit ?? ""].map(csvEscape).join(","))].join("\n");
}

export function studyProfilesCsv(study: StudySnapshot): string {
  const rows = ["study_id,profile_id,x_m,intensity,label"];
  for (const [profileId, profile] of Object.entries(study.profiles)) {
    for (const sample of profile) {
      rows.push([study.id, profileId, sample.xM, sample.intensity, sample.label ?? ""].map(csvEscape).join(","));
    }
  }
  return rows.join("\n");
}

export function runCoherenceGammaSweep(input: Partial<PracticalSweepInput> = {}): PracticalSweepResult {
  const sweep = normalizeSweepInput({ ...input, family: "coherence-gamma" });
  const values = sweepValues(sweep);
  const rows = values.map((gamma, index) => {
    const result = runCoherenceDemonstrator({ mode: "partial-coherence", coherence: { gammaMagnitude: gamma, gammaPhaseRad: 0 } });
    return sweepRow(index, "gamma", "Coherence |gamma12|", gamma, "", [
      metric("visibility", "Fringe visibility", result.visibility.measured, ""),
      metric("visibilityError", "Visibility error", result.visibility.error, ""),
      metric("orderSpacingMm", "Order spacing", result.expected.orderSpacingSmallAngleM * 1e3, "mm")
    ], result.resultHash, result.warnings.length);
  });
  return finalizeSweep(sweep, rows, "visibility", "scalar gamma12 sweep over existing two-slit coherence demonstrator");
}

export function runCircularObservationZSweep(input: Partial<PracticalSweepInput> = {}): PracticalSweepResult {
  const sweep = normalizeSweepInput({ ...input, family: "observation-z" });
  const defaults = defaultCircularApertureValidationConfig();
  const values = sweepValues(sweep);
  const rows = values.map((zMm, index) => {
    const result = runCircularApertureValidation({
      observationPlane: {
        ...defaults.observationPlane,
        zM: zMm * 1e-3
      }
    });
    return sweepRow(index, "observationZ", "Observation z", zMm, "mm", [
      metric("expectedFirstMinimumMm", "Expected first minimum", result.expected.firstMinimumRadiusM * 1e3, "mm"),
      metric("measuredFirstMinimumMm", "Measured first minimum", result.comparison.measuredFirstMinimumRadiusM === null ? Number.NaN : result.comparison.measuredFirstMinimumRadiusM * 1e3, "mm"),
      metric("rmsResidual", "RMS residual", result.residuals.rmsResidual, "")
    ], result.resultHash, result.warnings.length);
  });
  return finalizeSweep(sweep, rows, "rmsResidual", "observation-plane z sweep over existing circular aperture validation");
}

export function runValidationWavelengthSweep(input: Partial<PracticalSweepInput> = {}, base: Partial<CircularApertureValidationConfig> = {}): PracticalSweepResult {
  const sweep = normalizeSweepInput({ ...input, family: "validation-wavelength" });
  const defaults = defaultCircularApertureValidationConfig();
  const values = sweepValues(sweep);
  const rows = values.map((wavelengthNm, index) => {
    const result = runCircularApertureValidation({
      ...base,
      wavelengthM: wavelengthNm * 1e-9,
      observationPlane: {
        ...defaults.observationPlane,
        ...(base.observationPlane ?? {})
      }
    });
    return sweepRow(index, "wavelength", "Validation wavelength", wavelengthNm, "nm", [
      metric("expectedFirstMinimumMm", "Expected first minimum", result.expected.firstMinimumRadiusM * 1e3, "mm"),
      metric("rmsResidual", "RMS residual", result.residuals.rmsResidual, "")
    ], result.resultHash, result.warnings.length);
  });
  return finalizeSweep(sweep, rows, "rmsResidual", "wavelength sweep over existing scalar circular aperture validation");
}

export function runSlitWidthSweep(input: Partial<PracticalSweepInput> = {}, kind: SlitOrderBenchmarkKind = "long-single-slit-sinc2"): PracticalSweepResult {
  const sweep = normalizeSweepInput({ ...input, family: "slit-width" });
  const defaults = defaultSlitOrderValidationConfig(kind);
  const values = sweepValues(sweep);
  const rows = values.map((widthUm, index) => {
    const result = runSlitOrderValidation({
      ...defaults,
      aperture: {
        ...defaults.aperture,
        slitWidthM: widthUm * 1e-6
      }
    });
    return sweepRow(index, "slitWidth", "Slit width", widthUm, "um", [
      metric("primarySpacingMm", "Primary spacing", result.expected.primarySpacingSmallAngleM * 1e3, "mm"),
      metric("rmsResidual", "RMS residual", result.residuals.rmsResidual, "")
    ], result.resultHash, result.warnings.length);
  });
  return finalizeSweep(sweep, rows, "rmsResidual", "slit-width sweep over existing scalar slit validation");
}

export function runDoubleSlitSeparationSweep(input: Partial<PracticalSweepInput> = {}): PracticalSweepResult {
  const sweep = normalizeSweepInput({ ...input, family: "double-slit-separation" });
  const defaults = defaultSlitOrderValidationConfig("double-slit-orders");
  const values = sweepValues(sweep);
  const rows = values.map((separationUm, index) => {
    const result = runSlitOrderValidation({
      ...defaults,
      aperture: {
        ...defaults.aperture,
        slitSeparationM: separationUm * 1e-6
      }
    });
    return sweepRow(index, "slitSeparation", "Double-slit separation", separationUm, "um", [
      metric("orderSpacingMm", "Order spacing", result.expected.primarySpacingSmallAngleM * 1e3, "mm"),
      metric("maxResidual", "Max residual", result.residuals.maxResidual, "")
    ], result.resultHash, result.warnings.length);
  });
  return finalizeSweep(sweep, rows, "orderSpacingMm", "double-slit separation sweep over existing scalar order validation");
}

export function runThinLensDefocusSweep(input: Partial<PracticalSweepInput> = {}, base: Partial<ThinLensFocalValidationConfig> = {}): PracticalSweepResult {
  const sweep = normalizeSweepInput({ ...input, family: "thin-lens-defocus" });
  const defaults = defaultThinLensFocalValidationConfig();
  const values = sweepValues(sweep);
  const rows = values.map((defocusMm, index) => {
    const focalLengthM = base.lens?.focalLengthM ?? defaults.lens.focalLengthM;
    const result = runThinLensFocalValidation({
      ...base,
      observationPlane: {
        ...defaults.observationPlane,
        ...(base.observationPlane ?? {}),
        zM: focalLengthM + defocusMm * 1e-3
      }
    });
    return sweepRow(index, "defocus", "Thin-lens defocus", defocusMm, "mm", [
      metric("centerPeak", "Configured center peak", result.comparison.focus.configuredPlanePeakRelative, ""),
      metric("bestFocusDefocusMm", "Best focus defocus", result.comparison.focus.bestFocusDefocusM * 1e3, "mm"),
      metric("firstDarkErrorUm", "First-dark error", result.residuals.firstDarkRadiusErrorM === null ? Number.NaN : result.residuals.firstDarkRadiusErrorM * 1e6, "um")
    ], result.resultHash, result.warnings.length);
  });
  return finalizeSweep(sweep, rows, "centerPeak", "thin-lens observation z/defocus sweep over existing scalar focal validation");
}

export function runCoatingWavelengthStudySweep(stack: CoatingStackDefinition, input: Partial<PracticalSweepInput> = {}, options: CoatingStackRunOptions = {}): PracticalSweepResult {
  const sweep = normalizeSweepInput({ ...input, family: "coating-wavelength" });
  const result = runCoatingSweep(stack, {
    startWavelengthM: sweep.start * 1e-9,
    endWavelengthM: sweep.stop * 1e-9,
    sampleCount: Math.min(sweep.sampleCount, sweep.maxRuns)
  }, options);
  const rows = result.samples.map((sample, index) =>
    sweepRow(index, "wavelength", "Coating wavelength", sample.wavelengthM * 1e9, "nm", [
      metric("reflectance", "Reflectance", sample.reflectance, ""),
      metric("transmittance", "Transmittance", sample.transmittance, ""),
      metric("absorbance", "Absorbance", sample.absorbance, "")
    ], sample.resultHash, result.warnings.length)
  );
  return finalizeSweep(sweep, rows, "reflectance", "coating wavelength sweep over existing planar TMM path", result.warnings);
}

export function runCoatingRobustSigmaSweep(baseSpec: RobustCoatingSearchSpec, input: Partial<PracticalSweepInput> = {}, options: CoatingStackRunOptions = {}): PracticalSweepResult {
  const sweep = normalizeSweepInput({ ...input, family: "coating-robust-sigma" });
  const values = sweepValues(sweep);
  const rows = values.map((sigmaNm, index) => {
    const result = runRobustCoatingSearch({
      ...baseSpec,
      id: `${baseSpec.id}-sigma-${index}`,
      label: `${baseSpec.label} sigma ${sigmaNm.toFixed(2)} nm`,
      uncertainty: {
        ...baseSpec.uncertainty,
        thickness: {
          mode: "deterministic-grid",
          sigmaLevels: baseSpec.uncertainty.thickness?.sigmaLevels ?? [-1, 0, 1],
          maxSamplesPerCandidate: baseSpec.uncertainty.thickness?.maxSamplesPerCandidate ?? 9,
          sigmaNm
        }
      }
    }, options);
    return sweepRow(index, "sigma", "Robust thickness sigma", sigmaNm, "nm", [
      metric("p90Score", "P90 score", result.best.yield.p90Score, ""),
      metric("expectedScore", "Expected score", result.best.yield.expectedScore, ""),
      metric("worstCaseScore", "Worst-case score", result.best.yield.worstCaseScore, ""),
      metric("passRate", "Pass rate", result.best.yield.passRate ?? Number.NaN, "")
    ], result.resultHash, result.warnings.length);
  });
  return finalizeSweep(sweep, rows, "p90Score", "robust sigma sweep over existing planar coating drift/yield search");
}

export function practicalSweepJson(result: PracticalSweepResult): unknown {
  return result;
}

export function practicalSweepCsv(result: PracticalSweepResult): string {
  const metricIds = Array.from(new Set(result.rows.flatMap((row) => row.metrics.map((metric) => metric.id))));
  return [
    ["index", "parameter_id", "parameter_label", "parameter_value", "parameter_unit", ...metricIds, "result_hash", "warning_count"].join(","),
    ...result.rows.map((row) => [
      row.index,
      row.parameter.id,
      row.parameter.label,
      row.parameter.value,
      row.parameter.unit ?? "",
      ...metricIds.map((id) => row.metrics.find((metric) => metric.id === id)?.value ?? ""),
      row.resultHash,
      row.warningCount
    ].map(csvEscape).join(","))
  ].join("\n");
}

export function practicalSweepMarkdown(result: PracticalSweepResult): string {
  return [
    `# ${result.label}`,
    "",
    `Family: ${result.family}`,
    `Runs: ${result.executedRunCount}/${result.requestedRunCount}`,
    result.budget.truncated ? `Budget warning: truncated to ${result.budget.maxRuns} runs.` : "Budget warning: none",
    "",
    "| Parameter | Metrics | Hash |",
    "| --- | --- | --- |",
    ...result.rows.map((row) => `| ${formatMetricValue(row.parameter)} | ${row.metrics.map(formatMetricValue).join("; ")} | ${row.resultHash} |`),
    "",
    "## Limitations",
    ...result.provenance.limitations.map((limitation) => `- ${limitation}`)
  ].join("\n");
}

export function sampleFieldAt(field: FieldOutput2D, uM: number, vM: number): FieldMarker {
  const column = nearestIndex(uM, field.uMinM, field.uMaxM, field.width);
  const row = nearestIndex(vM, field.vMinM, field.vMaxM, field.height);
  const index = row * field.width + column;
  return {
    id: `${field.id}-marker-${column}-${row}`,
    label: `${field.id} marker`,
    uM: coordinateForIndex(column, field.uMinM, field.uMaxM, field.width),
    vM: coordinateForIndex(row, field.vMinM, field.vMaxM, field.height),
    intensity: field.intensity[index] ?? 0,
    units: {
      u: field.units.u,
      v: field.units.v,
      intensity: field.units.intensity
    }
  };
}

export function createFieldMarker(field: FieldOutput2D, input: { id?: string; label?: string; uM: number; vM: number }): FieldMarker {
  const marker = sampleFieldAt(field, input.uM, input.vM);
  return {
    ...marker,
    id: input.id ?? marker.id,
    label: input.label ?? marker.label
  };
}

export function distanceBetweenMarkers(a: FieldMarker, b: FieldMarker): number {
  const du = a.uM - b.uM;
  const dv = a.vM - b.vM;
  return Math.sqrt(du * du + dv * dv);
}

export function findFieldPeak(field: FieldOutput2D): FieldMarker {
  return extremumMarker(field, "peak");
}

export function findFieldMinimum(field: FieldOutput2D): FieldMarker {
  return extremumMarker(field, "minimum");
}

export function measureFieldRoi(field: FieldOutput2D, input: { id?: string; label?: string; uMinM: number; uMaxM: number; vMinM: number; vMaxM: number }): FieldRoiMeasurement {
  const uMin = Math.min(input.uMinM, input.uMaxM);
  const uMax = Math.max(input.uMinM, input.uMaxM);
  const vMin = Math.min(input.vMinM, input.vMaxM);
  const vMax = Math.max(input.vMinM, input.vMaxM);
  const colMin = nearestIndex(uMin, field.uMinM, field.uMaxM, field.width);
  const colMax = nearestIndex(uMax, field.uMinM, field.uMaxM, field.width);
  const rowMin = nearestIndex(vMin, field.vMinM, field.vMaxM, field.height);
  const rowMax = nearestIndex(vMax, field.vMinM, field.vMaxM, field.height);
  let count = 0;
  let sum = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (let row = Math.min(rowMin, rowMax); row <= Math.max(rowMin, rowMax); row += 1) {
    for (let column = Math.min(colMin, colMax); column <= Math.max(colMin, colMax); column += 1) {
      const value = field.intensity[row * field.width + column] ?? 0;
      count += 1;
      sum += value;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }
  return {
    id: input.id ?? `${field.id}-roi`,
    label: input.label ?? `${field.id} ROI`,
    uMinM: uMin,
    uMaxM: uMax,
    vMinM: vMin,
    vMaxM: vMax,
    sampleCount: count,
    minIntensity: count ? min : 0,
    maxIntensity: count ? max : 0,
    meanIntensity: count ? sum / count : 0
  };
}

export function detectFirstMinimum(profile: StudyProfilePoint[], centerM = 0): FirstMinimumDetection {
  const candidates = profile
    .map((sample, index) => ({ sample, index }))
    .filter(({ sample }) => sample.xM > centerM)
    .sort((a, b) => a.sample.xM - b.sample.xM);
  for (let i = 1; i < candidates.length - 1; i += 1) {
    const previous = candidates[i - 1]!;
    const current = candidates[i]!;
    const next = candidates[i + 1]!;
    if (current.sample.intensity <= previous.sample.intensity && current.sample.intensity <= next.sample.intensity) {
      return {
        status: "measured",
        positionM: current.sample.xM,
        intensity: current.sample.intensity,
        index: current.index
      };
    }
  }
  return {
    status: "not-resolved",
    positionM: null,
    intensity: null,
    index: null
  };
}

export function profileCsv(profile: StudyProfilePoint[], profileId = "profile"): string {
  return ["profile_id,x_m,intensity,label", ...profile.map((sample) => [profileId, sample.xM, sample.intensity, sample.label ?? ""].map(csvEscape).join(","))].join("\n");
}

export function compareStudyRuns(runA: StudyRunSummary, runB: StudyRunSummary): StudyComparisonResult {
  const deltas = metricDeltas(runA.metrics, runB.metrics);
  const warnings: SolverWarning[] = [];
  const differenceField = compatibleFields(runA.field, runB.field) ? fieldDifference(runA.field as FieldOutput2D, runB.field as FieldOutput2D) : undefined;
  if (!differenceField && (runA.field || runB.field)) {
    warnings.push({
      code: "studyComparison.incompatibleFields",
      message: "Run comparison skipped the difference map because the selected runs do not share the same field grid."
    });
  }
  if (deltas.length === 0) {
    warnings.push({
      code: "studyComparison.noCommonMetrics",
      message: "Run comparison found no common metric ids; metric delta table is empty."
    });
  }
  const resultHash = fnv1a64(
    stableStringify({
      schema: "emmicro.studyComparison.v1",
      runA: runA.resultHash,
      runB: runB.resultHash,
      deltas: deltas.map((delta) => ({ id: delta.id, a: round(delta.a), b: round(delta.b), d: round(delta.delta) })),
      differenceFieldHash: differenceField ? fieldSummaryForHash(differenceField) : null,
      warningCodes: warnings.map((warning) => warning.code)
    })
  );
  return {
    schema: "emmicro.studyComparison.v1",
    id: `compare-${runA.id}-vs-${runB.id}`,
    label: `${runA.label} vs ${runB.label}`,
    runA,
    runB,
    compatible: warnings.length === 0 || warnings.every((warning) => warning.code !== "studyComparison.incompatibleFields"),
    deltas,
    differenceField,
    warnings,
    resultHash
  };
}

export function studyComparisonCsv(comparison: StudyComparisonResult): string {
  return [
    "metric_id,label,unit,run_a,run_b,delta,percent_delta",
    ...comparison.deltas.map((delta) => [delta.id, delta.label, delta.unit ?? "", delta.a, delta.b, delta.delta, delta.percentDelta ?? ""].map(csvEscape).join(","))
  ].join("\n");
}

export function studyComparisonMarkdown(comparison: StudyComparisonResult): string {
  return [
    `# ${comparison.label}`,
    "",
    `Run A hash: ${comparison.runA.resultHash}`,
    `Run B hash: ${comparison.runB.resultHash}`,
    `Difference map: ${comparison.differenceField ? "available" : "not available"}`,
    "",
    "| Metric | A | B | Delta |",
    "| --- | ---: | ---: | ---: |",
    ...comparison.deltas.map((delta) => `| ${delta.label} | ${delta.a.toPrecision(6)} | ${delta.b.toPrecision(6)} | ${delta.delta.toPrecision(6)} |`),
    "",
    "## Warnings",
    ...(comparison.warnings.length ? comparison.warnings.map((warning) => `- ${warning.message}`) : ["- none"])
  ].join("\n");
}

export function profileFromPairs(points: Array<{ xM: number; intensity: number; label?: string }>): StudyProfilePoint[] {
  return points.map((point) => ({ xM: point.xM, intensity: point.intensity, label: point.label }));
}

function executable(id: string, label: string, evidence: string): StudyCapability {
  return {
    id,
    label,
    status: "executable",
    evidence,
    boundary: "Executable in the current app, within scalar-validation, planar-TMM, measured-comparison, detector-acquisition, or diagnostic calibration scope only."
  };
}

function scaffold(id: string, label: string, evidence: string): StudyCapability {
  return {
    id,
    label,
    status: "scaffold-only",
    evidence,
    boundary: "Schema/export receipt only; no external solver execution is performed."
  };
}

function unavailable(id: string, label: string): StudyCapability {
  return {
    id,
    label,
    status: "not-implemented",
    evidence: "No executable path in L7.2.",
    boundary: "Must not be described as solved, simulated, certified, or executed."
  };
}

function normalizeSweepInput(input: Partial<PracticalSweepInput> & { family: PracticalSweepFamily }): Required<PracticalSweepInput> {
  const start = finite(input.start ?? defaultSweepRange(input.family).start, defaultSweepRange(input.family).start);
  const stop = finite(input.stop ?? defaultSweepRange(input.family).stop, start);
  const sampleCount = Math.max(1, Math.round(input.sampleCount ?? defaultSweepRange(input.family).sampleCount));
  const maxRuns = Math.max(1, Math.round(input.maxRuns ?? 21));
  return {
    id: input.id ?? `l66-${input.family}-sweep`,
    label: input.label ?? l66SweepLabel(input.family),
    family: input.family,
    start,
    stop,
    sampleCount,
    maxRuns
  };
}

function defaultSweepRange(family: PracticalSweepFamily): { start: number; stop: number; sampleCount: number } {
  if (family === "coherence-gamma") return { start: 0, stop: 1, sampleCount: 6 };
  if (family === "validation-wavelength") return { start: 450, stop: 650, sampleCount: 5 };
  if (family === "observation-z") return { start: 12, stop: 40, sampleCount: 5 };
  if (family === "slit-width") return { start: 20, stop: 200, sampleCount: 5 };
  if (family === "double-slit-separation") return { start: 80, stop: 160, sampleCount: 5 };
  if (family === "thin-lens-defocus") return { start: -1, stop: 1, sampleCount: 5 };
  if (family === "coating-wavelength") return { start: 450, stop: 650, sampleCount: 9 };
  return { start: 0, stop: 5, sampleCount: 4 };
}

function sweepValues(sweep: Required<PracticalSweepInput>): number[] {
  const count = Math.min(sweep.sampleCount, sweep.maxRuns);
  if (count <= 1) return [sweep.start];
  return Array.from({ length: count }, (_, index) => sweep.start + ((sweep.stop - sweep.start) * index) / (count - 1));
}

function sweepRow(index: number, parameterId: string, parameterLabel: string, value: number, unit: string, metrics: StudyMetric[], resultHash: string, warningCount: number): PracticalSweepRow {
  return {
    index,
    parameter: metric(parameterId, parameterLabel, value, unit),
    metrics,
    resultHash,
    warningCount
  };
}

function finalizeSweep(
  sweep: Required<PracticalSweepInput>,
  rows: PracticalSweepRow[],
  rankMetricId: string,
  limitation: string,
  extraWarnings: SolverWarning[] = []
): PracticalSweepResult {
  const warnings = [...extraWarnings];
  if (sweep.sampleCount > sweep.maxRuns) {
    warnings.push({
      code: "l66.sweep.budgetTruncated",
      message: `Requested ${sweep.sampleCount} sweep runs but L6.6 budget limited execution to ${sweep.maxRuns}.`
    });
  }
  const rankedRows = rows
    .filter((row) => Number.isFinite(row.metrics.find((item) => item.id === rankMetricId)?.value))
    .sort((a, b) => (a.metrics.find((item) => item.id === rankMetricId)?.value ?? 0) - (b.metrics.find((item) => item.id === rankMetricId)?.value ?? 0));
  const bestRow = rankedRows[0] ?? null;
  const worstRow = rankedRows[rankedRows.length - 1] ?? null;
  const resultHash = fnv1a64(
    stableStringify({
      schema: "emmicro.practicalSweep.v1",
      sweep,
      rows: rows.map((row) => ({
        parameter: roundMetric(row.parameter),
        metrics: row.metrics.map(roundMetric),
        resultHash: row.resultHash,
        warningCount: row.warningCount
      })),
      warningCodes: warnings.map((warning) => warning.code)
    })
  );
  return {
    schema: "emmicro.practicalSweep.v1",
    id: sweep.id,
    label: sweep.label,
    family: sweep.family,
    requestedRunCount: sweep.sampleCount,
    executedRunCount: rows.length,
    budget: {
      maxRuns: sweep.maxRuns,
      truncated: sweep.sampleCount > sweep.maxRuns
    },
    rows,
    bestRow,
    worstRow,
    warnings,
    resultHash,
    provenance: {
      label: "L6.6 practical parameter sweep",
      limitations: [
        limitation,
        "Sweeps orchestrate existing scalar-validation or planar-TMM functions; they do not add new solver physics.",
        "No FDTD, FEM, BEM, RCWA, arbitrary CAD, sensor-stack, digital-twin, or manufacturing certification path is executed."
      ]
    }
  };
}

function metric(id: string, label: string, value: number, unit?: string): StudyMetric {
  return {
    id,
    label,
    value,
    unit
  };
}

function metricDeltas(a: StudyMetric[], b: StudyMetric[]): StudyComparisonDelta[] {
  const byB = new Map(b.map((metricItem) => [metricItem.id, metricItem]));
  const deltas: StudyComparisonDelta[] = [];
  for (const metricA of a) {
    const metricB = byB.get(metricA.id);
    if (!metricB) continue;
    if (!Number.isFinite(metricA.value) || !Number.isFinite(metricB.value)) continue;
    const delta = metricB.value - metricA.value;
    deltas.push({
      id: metricA.id,
      label: metricA.label,
      unit: metricA.unit || metricB.unit,
      a: metricA.value,
      b: metricB.value,
      delta,
      percentDelta: Math.abs(metricA.value) > 1e-12 ? delta / metricA.value : null
    });
  }
  return deltas;
}

function compatibleFields(a?: FieldOutput2D, b?: FieldOutput2D): boolean {
  return Boolean(
    a &&
      b &&
      a.width === b.width &&
      a.height === b.height &&
      almostEqual(a.uMinM, b.uMinM) &&
      almostEqual(a.uMaxM, b.uMaxM) &&
      almostEqual(a.vMinM, b.vMinM) &&
      almostEqual(a.vMaxM, b.vMaxM)
  );
}

function fieldDifference(a: FieldOutput2D, b: FieldOutput2D): FieldOutput2D {
  const intensity = new Float64Array(a.intensity.length);
  let max = 0;
  for (let i = 0; i < intensity.length; i += 1) {
    const value = Math.abs((b.intensity[i] ?? 0) - (a.intensity[i] ?? 0));
    intensity[i] = value;
    max = Math.max(max, value);
  }
  if (max > 0) {
    for (let i = 0; i < intensity.length; i += 1) intensity[i] = intensity[i]! / max;
  }
  return {
    id: `${a.id}-vs-${b.id}-difference`,
    type: "fieldImage2D",
    planeId: a.planeId,
    gridId: a.gridId,
    xM: a.xM,
    width: a.width,
    height: a.height,
    uMinM: a.uMinM,
    uMaxM: a.uMaxM,
    vMinM: a.vMinM,
    vMaxM: a.vMaxM,
    intensity,
    normalization: "peak-normalized",
    units: a.units,
    provenance: a.provenance
  };
}

function extremumMarker(field: FieldOutput2D, kind: "peak" | "minimum"): FieldMarker {
  let bestIndex = 0;
  let bestValue = field.intensity[0] ?? 0;
  for (let i = 1; i < field.intensity.length; i += 1) {
    const value = field.intensity[i] ?? 0;
    if ((kind === "peak" && value > bestValue) || (kind === "minimum" && value < bestValue)) {
      bestIndex = i;
      bestValue = value;
    }
  }
  const row = Math.floor(bestIndex / field.width);
  const column = bestIndex % field.width;
  const marker = sampleFieldAt(field, coordinateForIndex(column, field.uMinM, field.uMaxM, field.width), coordinateForIndex(row, field.vMinM, field.vMaxM, field.height));
  return {
    ...marker,
    id: `${field.id}-${kind}`,
    label: kind === "peak" ? "Peak finder" : "Minimum finder"
  };
}

function nearestIndex(value: number, min: number, max: number, count: number): number {
  if (count <= 1) return 0;
  const normalized = (value - min) / (max - min);
  return Math.max(0, Math.min(count - 1, Math.round(normalized * (count - 1))));
}

function coordinateForIndex(index: number, min: number, max: number, count: number): number {
  if (count <= 1) return min;
  return min + ((max - min) * index) / (count - 1);
}

function l66SweepLabel(family: PracticalSweepFamily): string {
  if (family === "coherence-gamma") return "Coherence gamma sweep";
  if (family === "validation-wavelength") return "Validation wavelength sweep";
  if (family === "observation-z") return "Observation z sweep";
  if (family === "slit-width") return "Slit width sweep";
  if (family === "double-slit-separation") return "Double-slit separation sweep";
  if (family === "thin-lens-defocus") return "Thin-lens defocus sweep";
  if (family === "coating-wavelength") return "Coating wavelength sweep";
  return "Coating robust sigma sweep";
}

function studyForHash(study: Omit<StudySnapshot, "resultHash">): unknown {
  return {
    ...study,
    profiles: Object.fromEntries(Object.entries(study.profiles).map(([key, profile]) => [key, profile.map((sample) => ({ ...sample, intensity: round(sample.intensity), xM: round(sample.xM) }))])),
    metrics: study.metrics.map(roundMetric),
    capabilities: study.capabilities.map((capability) => ({ id: capability.id, status: capability.status }))
  };
}

function roundMetric(item: StudyMetric): StudyMetric {
  return {
    ...item,
    value: round(item.value)
  };
}

function fieldSummaryForHash(field: FieldOutput2D): unknown {
  return {
    id: field.id,
    width: field.width,
    height: field.height,
    uMinM: round(field.uMinM),
    uMaxM: round(field.uMaxM),
    vMinM: round(field.vMinM),
    vMaxM: round(field.vMaxM),
    sample: Array.from(field.intensity.slice(0, 16)).map(round)
  };
}

function formatMetricValue(metricItem: StudyMetric): string {
  const value = Number.isFinite(metricItem.value) ? metricItem.value.toPrecision(6) : "n/a";
  return `${metricItem.label}: ${value}${metricItem.unit ? ` ${metricItem.unit}` : ""}`;
}

function slugId(value: string): string {
  const slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "study";
}

function csvEscape(value: unknown): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Number(value.toPrecision(12));
}

function almostEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-15;
}
