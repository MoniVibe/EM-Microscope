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
  | "image-quality.target-detection"
  | "image-quality.batch-session-qa"
  | "image-quality.fiducial-board"
  | "image-quality.external-detector-bridge"
  | "coating.planar-stack"
  | "coating.optimizer"
  | "coating.robust-optimizer";

export type StudySnapshotInput = {
  id?: string;
  name: string;
  mode: StudyMode;
  selectedWorkbench: "validation-bench" | "coating-stack-workbench" | "advisor-review" | "measured-vs-simulated" | "camera-sensor-lite" | "camera-calibration" | "resolution-mtf" | "focus-field-mtf" | "geometric-calibration" | "batch-session-qa" | "fiducial-board" | "external-detector-bridge";
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
  type: "l66PracticalStudy" | "l67PracticalStudy" | "l68PracticalStudy" | "l69PracticalStudy" | "l70PracticalStudy" | "l71PracticalStudy" | "l72PracticalStudy" | "l73PracticalStudy" | "l74PracticalStudy" | "l75PracticalStudy" | "l76PracticalStudy" | "l77PracticalStudy" | "l78PracticalStudy";
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
  geometricDetection?: unknown;
  geometricFit?: unknown;
  geometricComparison?: unknown;
  sessionQa?: unknown;
  fiducialBoard?: unknown;
  fiducialDetection?: unknown;
  fiducialFit?: unknown;
  externalDetectorImport?: unknown;
  externalDetectorComparison?: unknown;
  detectorRoundTripReport?: unknown;
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
  return l75CapabilitiesMatrix();
}

export function l71CapabilitiesMatrix(): StudyCapability[] {
  return l75CapabilitiesMatrix();
}

export function l72CapabilitiesMatrix(): StudyCapability[] {
  return l75CapabilitiesMatrix();
}

export function l73CapabilitiesMatrix(): StudyCapability[] {
  return l75CapabilitiesMatrix();
}

export function l74CapabilitiesMatrix(): StudyCapability[] {
  return l76CapabilitiesMatrix();
}

export function l75CapabilitiesMatrix(): StudyCapability[] {
  return l76CapabilitiesMatrix();
}

export function l76CapabilitiesMatrix(): StudyCapability[] {
  return [
    executable("sequential-simulation-builder", "Sequential Simulation Builder", "L8.0 ordered Grid -> Source -> Elements -> Target / Material -> Compute -> Validate workflow with z-axis placement"),
    executable("transparent-interface-slab-validation", "Transparent interface/slab validation", "PlanarTmmBackend/Fresnel normal-incidence R/T/A residual and energy-balance check"),
    executable("reflective-surface-validation", "Reflective surface validation", "ideal mirror/PEC-like analytic R near 1, T near 0, A near 0 validation case"),
    executable("absorbing-slab-validation", "Absorbing slab validation", "Beer-Lambert attenuation check with thickness-dependent transmission and R/T/A energy balance"),
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
    executable("dot-grid-target-detection", "Dot-grid measured target detection", "diagnostic ROI-limited blob detection, centroiding, grid matching, manual point correction, confidence report, and L7.2 fit handoff"),
    executable("batch-measurement-session-qa", "Batch measurement session QA", "diagnostic manifest/result-row session aggregation, repeatability metrics, outlier detection, drift trends, and QA report exports"),
    executable("repeatability-diagnostics", "Repeatability diagnostics", "deterministic mean/std/min/max, coefficient-of-variation, drift, and threshold status over existing L6.8-L7.4 metrics"),
    executable("synthetic-fiducial-board-workflow", "Synthetic fiducial board workflow", "diagnostic ChArUco-style board generation with deterministic marker IDs, world coordinates, preview image, and manifest exports"),
    executable("fiducial-detection-import", "Fiducial detection import", "deterministic marker-corner CSV, ChArUco-style corner CSV, and JSON detection bundle import with duplicate-ID validation"),
    executable("charuco-style-fiducial-matching", "ChArUco-style fiducial matching", "diagnostic ID-to-board matching over imported/synthetic detections with coverage, missing-ID, partial-view, and residual evidence"),
    executable("fiducial-manual-correction", "Fiducial manual correction", "manual accept/reject/move/relabel edits for marker and ChArUco-style detections before geometry fitting"),
    executable("fiducial-geometry-session-handoff", "Fiducial geometry/session handoff", "matched fiducial points feed L7.2 similarity/affine/radial diagnostic fits and L7.4 session QA frame metrics"),
    executable("external-detector-json-csv-import", "External detector JSON/CSV import", "canonical emmicro.detector.v1 JSON and marker-corner CSV import into the existing L7.5 fiducial detection workflow"),
    executable("detector-receipt-validation", "Detector receipt validation", "detector/image/board receipt validation with deterministic source, detection, warning, and result hashes"),
    executable("external-detector-comparison", "External detector comparison", "synthetic-vs-imported, imported-vs-imported, and manual-corrected-vs-raw detector comparison with mean/max pixel deltas, coverage deltas, and fit RMS deltas"),
    executable("detector-bridge-reports", "Detector bridge report exports", "diagnostic detector_bridge_report.md, detector_bridge_report.json, imported_detections.csv, and detector_comparison.csv exports"),
    executable("opencv-charuco-external-helper", "OpenCV ChArUco external helper", "optional tools/detectors Python CLI can generate OpenCV-compatible ChArUco boards and emit canonical emmicro.detector.v1 JSON/CSV outside the web runtime"),
    executable("opencv-detector-json-import", "OpenCV detector JSON import", "OpenCV ChArUco runner receipts preserve dictionary, detector parameters, board hash, image hash, and warning evidence through the L7.6-compatible bridge schema"),
    executable("detector-roundtrip-wizard", "Detector round-trip wizard", "guided board export, optional external helper output import, receipt/hash validation, ID match, diagnostic geometry fit, L7.4 session QA, and evidence-export chain"),
    executable("detector-roundtrip-acceptance-reports", "Detector round-trip acceptance reports", "diagnostic roundtrip_report.md, roundtrip_report.json, roundtrip_metrics.csv, and roundtrip_warnings.json exports over imported detector evidence"),
    scaffold("checkerboard-target-detection", "Checkerboard automatic detection", "generated/checkerboard target metadata and manual/CSV workflow remain available; robust automatic checkerboard detection is scaffold-only"),
    executable("external-fdtd-scene-manifest-export", "External FDTD scene manifest export", "L8.1 Simulation Builder exports supported slab target scenes with readiness, geometry, material, monitor, and boundary evidence"),
    executable("external-meep-script-export", "External Meep helper script export", "L8.1 deterministic Python helper script is exportable for optional local Meep workflows outside the browser"),
    executable("external-fdtd-result-import", "External FDTD result import", "L8.1 imports run receipt JSON, flux summary JSON, and field-slice CSV evidence for R/T/A and field-map comparison"),
    executable("external-fdtd-benchmark-export", "External FDTD benchmark export", "L8.2 exports benchmark manifests, bounded sweep plans, expected reference files, and Meep helper scripts for optional external FDTD execution"),
    executable("external-fdtd-convergence-import", "External FDTD convergence import", "L8.2 imports convergence_summary.json and optional per-run flux summaries for reference residual and energy-balance diagnostics"),
    executable("external-fdtd-convergence-diagnostics", "FDTD convergence diagnostics", "L8.2 computes residual-vs-resolution trends, field-slice delta summaries, PML/padding sensitivity, and PASS/WARNING/FAIL dossiers over imported evidence"),
    executable("external-fdtd-finite-surface-geometry-export", "External FDTD finite surface geometry export", "L8.3 exports finite transparent blocks, absorbing blocks, ideal reflective plates, aperture/blockers, and tilted interface/wedge scenes with x/y/z placement, dimensions, monitors, warnings, and Meep helper geometry"),
    executable("external-fdtd-surface-geometry-fixtures", "Surface geometry fixture import/validation", "L8.3 imports deterministic field/flux/receipt fixtures and validates broad-block, Beer-Lambert, ideal reflector, aperture diagnostic, and tilted-wedge diagnostic references"),
    executable("surface-geometry-xz-cross-section", "Surface geometry X-Z cross-section", "L8.3 renders finite placed geometry previews and warning/report evidence without browser solver execution"),
    executable("external-fdtd-long-slit-aperture-diagnostic", "Long-slit aperture diagnostic", "L8.4 exports/imports long-slit aperture evidence and compares profiles against the scalar single-slit sinc2 limiting reference"),
    executable("external-fdtd-circular-pinhole-diagnostic", "Circular pinhole diagnostic", "L8.4 exports/imports circular-pinhole evidence and compares the first ring/profile against the scalar Airy/Bessel limiting reference"),
    executable("external-fdtd-opaque-blocker-diagnostic", "Opaque blocker diagnostic", "L8.4 exports/imports opaque-blocker evidence with blocked-power and shadow-flux diagnostics without a closed-form finite-edge overclaim"),
    executable("aperture-edge-convergence-diagnostics", "Aperture edge convergence diagnostics", "L8.4 reports aperture cells-across, thickness cells, PML distance, monitor distance, residual-vs-resolution rows, field-slice evidence, and PASS/WARNING/DIAGNOSTIC dossiers over external evidence"),
    executable("multi-element-optical-bench-chain", "Multi-element optical bench chain", "L8.5.1 ordered grid/source/elements/target/monitor scene graph with element inspector, numeric editing, optional diagram drag, z-order controls, x-z cross-section, solver plan, scalar monitor stack, and report exports"),
    executable("element-inspector-direct-editing", "Element inspector direct editing", "L8.5.1 selects elements from the list or x-z diagram, edits precise numeric properties, supports snap/nudge controls, undo/redo, custom monitors, and edit warnings without adding new physics"),
    executable("scalar-multi-plane-preview", "Scalar multi-plane preview", "L8.5 computes deterministic field/intensity snapshots for ideal apertures/slits/lenses/free-space/observation planes without claiming full Maxwell"),
    executable("external-fdtd-chain-export-import", "External FDTD chain export/import", "L8.5 exports deterministic multi-element FDTD manifests/scripts and imports bundled receipt/flux/field evidence for supported finite geometry chains"),
    executable("in-browser-2d-fdtd-sandbox", "In-browser 2D FDTD sandbox", "L9.2 runs a capped diagnostic TMz sandbox over Ez/Hx/Hy with CPU reference stepping, optional WebGPU acceleration, grid/object/step/monitor caps, and reports/traces"),
    executable("fdtd2d-cpu-reference-backend", "2D FDTD CPU reference backend", "L9.2 keeps deterministic CPU typed-array stepping as the validation baseline and fallback"),
    executable("webgpu-fdtd-acceleration", "Optional WebGPU 2D FDTD acceleration", "L9.2 optionally accelerates bounded 2D TMz stepping with WebGPU when browser, secure context, adapter, device, and memory caps permit it"),
    executable("fdtd2d-webgpu-fallback", "2D FDTD WebGPU fallback", "L9.2 reports unavailable/failed WebGPU status and falls back to CPU reference without requiring WebGPU for tests, build, Pages, or runtime"),
    executable("fdtd2d-cpu-gpu-parity", "2D FDTD CPU/GPU parity diagnostics", "L9.2 computes CPU-vs-GPU or CPU-fallback RMS/max field, monitor trace, and energy differences with PASS/WARNING/FAIL status"),
    executable("fdtd2d-performance-diagnostics", "2D FDTD backend performance diagnostics", "L9.2 reports steps/sec, ms/step, readback cadence, readback time, and CPU-vs-WebGPU speedup when available"),
    executable("fdtd2d-stability-diagnostics", "2D FDTD stability diagnostics", "L9.2 computes CFL/dt/grid safety, max Ez/Hx/Hy, NaN/Infinity guards, energy trend, boundary-loss estimate, memory estimate, and stability report exports"),
    executable("fdtd2d-validation-fixtures", "2D FDTD validation fixtures", "L9.2 runs empty-space, PEC-like wall, dielectric interface, absorbing slab, point-source symmetry, and qualitative slit diagnostics with finite-trace checks"),
    executable("fdtd2d-convergence-diagnostics", "2D FDTD convergence diagnostics", "L9.2 runs bounded grid refinement diagnostics with residual-vs-grid rows and convergence CSV exports"),
    executable("in-browser-1d-rcwa-preview", "In-browser 1D RCWA preview", "L9.3 runs a bounded diagnostic 1D periodic binary-grating RCWA/Fourier-modal preview with diffraction orders, R/T/A totals, harmonic convergence, TMM consistency, and report exports"),
    executable("rcwa-diffraction-order-table", "RCWA diffraction order table", "L9.3 identifies reflected/transmitted order angles, propagating/evanescent/near-cutoff status, and per-order efficiencies for capped 1D binary gratings"),
    executable("rcwa-harmonic-convergence", "RCWA harmonic convergence diagnostics", "L9.3 runs bounded 3/5/7/9/11 harmonic sweeps and reports R/T/A, energy error, order efficiencies, and convergence warnings"),
    executable("rcwa-tmm-consistency", "RCWA/TMM no-pattern consistency", "L9.3 compares no-pattern RCWA preview cases against the existing PlanarTmmBackend and reports residuals"),
    executable("solver-router-method-selection", "Solver Router / Method Selection Matrix", "L9.4 classifies planar, scalar, 1D periodic RCWA, bounded 2D FDTD, external FDTD, and unsupported/scaffold scene patterns with deterministic recommendations and alternatives"),
    executable("solver-route-report-export", "Solver route report export", "L9.4 exports solver_route_report.md, solver_route_report.json, solver_route_matrix.csv, unsupported_items.csv, and validation_plan.csv with reasons, assumptions, limitations, validation checks, and route actions"),
    executable("route-specific-next-actions", "Route-specific next actions", "L9.4 offers Open TMM/diagnostics, Open RCWA Preview, Send 2D Slice to FDTD Sandbox, Export External FDTD Run Pack, Open Engineering Evidence Campaign, and Show Unsupported Items actions without adding solver physics"),
    executable("solver-evidence-autopack", "Solver evidence auto-pack", "L9.5 creates deterministic route-specific evidence tasks for TMM, scalar, RCWA, 2D FDTD, external FDTD, and unsupported/gap-report routes with hashes, inputs, artifacts, validation plans, and exports"),
    executable("solver-evidence-task-export", "Solver evidence task export", "L9.5 exports solver_evidence_task.md, solver_evidence_task.json, solver_evidence_artifacts.csv, and solver_evidence_validation_plan.csv without claiming automatic correctness"),
    executable("solver-evidence-campaign-promotion", "Solver evidence campaign promotion", "L9.5 preserves route/task/scene hashes, warnings, limitations, and promotion metadata for Engineering Evidence Campaign handoff"),
    executable("cross-solver-consistency-bench", "Cross-solver consistency bench", "L9.6 compares overlapping solver lanes for TMM/RCWA no-pattern, CPU/WebGPU FDTD parity, scalar-vs-2D FDTD aperture diagnostics, external FDTD slab evidence, absorber consistency, missing external grating evidence, and non-comparable guardrails"),
    executable("cross-solver-consistency-export", "Cross-solver consistency export", "L9.6 exports cross_solver_consistency_report.md/json, consistency_metrics.csv, solver_pair_residuals.csv, and consistency_assumptions.csv with case hashes and preserved L9.5 evidence task hashes"),
    executable("process-tolerance-variation-runner", "Process / tolerance variation runner", "L8.6 attaches source, element, material, geometry, and monitor variation specs to the editable optical bench and computes diagnostic pass/fail, sensitivity, ranking, and worst-case evidence"),
    executable("one-at-a-time-tolerance-sensitivity", "One-at-a-time tolerance sensitivity", "L8.6 runs deterministic plus/minus one-at-a-time tolerance cases and ranks metric sensitivity without claiming certified optical tolerancing"),
    executable("deterministic-grid-tolerance-study", "Deterministic grid tolerance study", "L8.6 runs bounded deterministic tolerance grids over enabled variation specs with explicit run-count limits and diagnostic threshold checks"),
    executable("external-fdtd-variation-sweep", "External FDTD variation sweep", "L8.6 exports deterministic variation sweep manifests and imports summary receipts from optional external FDTD execution; production FDTD execution stays external"),
    executable("robust-design-advisor", "Robust Design Advisor", "L8.7 converts L8.6 tolerance sensitivity into diagnostic recentering, tolerance tightening, tolerance relaxation, robust-grid, and cost-weighted recommendations"),
    executable("recenter-candidate-generation", "Recenter candidate generation", "L8.7 generates deterministic nominal recentering candidates for allowed source, element, target, and monitor variables and never applies them without explicit user action"),
    executable("tolerance-budget-recommendations", "Tolerance budget recommendations", "L8.7 suggests tightening sensitive dimensions and relaxing low-sensitivity dimensions while respecting locks, min/max bounds, and simple cost weights"),
    executable("robust-candidate-comparison", "Robust candidate comparison", "L8.7 compares baseline vs candidate nominal, worst-case, p90, pass-rate, expected, and improvement-per-cost scores over existing L8.6 evidence"),
    executable("external-fdtd-candidate-sweep", "External FDTD candidate sweep", "L8.7 exports robust candidate sweep manifests and imports summary receipts for supported finite geometry; production FDTD execution stays external"),
    executable("engineering-evidence-campaign", "Engineering Evidence Campaign", "L8.8 loads/imports curated golden evidence campaigns with scenario references, residuals, convergence/PML review, tolerance summary, robust before/after metrics, hashes, capability truth table, and dossier exports"),
    executable("golden-scenario-validation-dossier", "Golden scenario validation dossier", "L8.8 exports engineer-facing Markdown/JSON/CSV evidence dossiers over transparent, absorbing, reflective, aperture, multi-element, and robust-candidate fixtures"),
    unavailable("arbitrary-freeform-cad-lens", "Arbitrary CAD/freeform material lens"),
    unavailable("curved-material-lens-solve", "Curved material lens solve"),
    scaffold("external-fdtd-backend-runner", "ExternalFdtdBackend runner", "External execution remains outside the browser; in-app production FDTD solving is not implemented"),
    unavailable("arbitrary-3d-material-geometry", "Arbitrary 3D material geometry"),
    unavailable("3d-maxwell-solve", "3D Maxwell solve"),
    unavailable("in-browser-3d-fdtd", "In-browser 3D FDTD"),
    unavailable("2d-periodic-rcwa", "Arbitrary 2D-periodic RCWA"),
    unavailable("production-rcwa-certification", "Production RCWA certification"),
    unavailable("anisotropic-rcwa", "Anisotropic/conical RCWA"),
    unavailable("automatic-certified-solver-selection", "Automatic certified solver selection"),
    unavailable("fem-bem-route", "FEM/BEM route"),
    scaffold("arbitrary-3d-maxwell-route", "Arbitrary 3D Maxwell route", "L9.4 can flag arbitrary 3D Maxwell as unsupported/external-scaffold only; it does not execute arbitrary 3D Maxwell"),
    unavailable("production-browser-fdtd-execution", "Production browser FDTD execution"),
    unavailable("fdtd-fem-bem-rcwa-execution", "Production in-app FDTD/FEM/BEM/RCWA execution"),
    unavailable("production-metal-aperture-model", "Production metal aperture model"),
    unavailable("arbitrary-cad-geometry", "Arbitrary CAD geometry"),
    unavailable("pixel-level-sensor-stack", "Pixel-level EM sensor stack"),
    unavailable("sensor-stack-simulation", "Sensor-stack simulation"),
    unavailable("emva-1288-certification", "EMVA 1288 certification"),
    unavailable("certified-emva-characterization", "Certified EMVA 1288 characterization"),
    unavailable("certified-lab-calibration", "Certified lab calibration"),
    unavailable("certified-metrology-report", "Certified metrology report"),
    unavailable("lab-accreditation-workflow", "Lab accreditation workflow"),
    unavailable("certified-camera-calibration", "Certified camera calibration"),
    unavailable("lab-accredited-metrology", "Lab-accredited metrology"),
    unavailable("iso-12233-certification", "ISO 12233 certification"),
    unavailable("imatest-equivalent-certification", "Imatest-equivalent certification"),
    unavailable("pure-lens-mtf-certification", "Pure lens-only MTF certification"),
    unavailable("calibrated-optical-model-fitting", "Calibrated optical model fitting"),
    unavailable("full-3d-pose-calibration", "Full 3D pose calibration"),
    unavailable("stereo-calibration", "Stereo calibration"),
    unavailable("apriltag-aruco-detection", "Built-in/browser ArUco or AprilTag detector execution"),
    unavailable("browser-native-opencv-aruco-detector", "Browser-native OpenCV.js/ArUco detector"),
    unavailable("apriltag-decoder", "AprilTag decoder"),
    unavailable("material-uncertainty", "Material uncertainty"),
    unavailable("certified-validation", "Certified validation"),
    unavailable("certified-optical-tolerancing", "Certified optical tolerancing"),
    unavailable("production-em-solver-certification", "Production EM solver certification"),
    unavailable("auto-redesign-inverse-optimization", "Auto redesign / inverse optimization"),
    unavailable("automatic-final-design-approval", "Automatic final design approval"),
    unavailable("full-inverse-design", "Full inverse design"),
    unavailable("digital-twin-calibration", "Digital twin calibration"),
    unavailable("manufacturing-certification", "Manufacturing certification")
  ];
}

export function l69CapabilitiesMatrix(): StudyCapability[] {
  return l75CapabilitiesMatrix();
}

export function l68CapabilitiesMatrix(): StudyCapability[] {
  return l75CapabilitiesMatrix();
}

export function l67CapabilitiesMatrix(): StudyCapability[] {
  return l75CapabilitiesMatrix();
}

export function l66CapabilitiesMatrix(): StudyCapability[] {
  return l75CapabilitiesMatrix();
}

export function capabilitiesMarkdown(capabilities: StudyCapability[] = l75CapabilitiesMatrix()): string {
  return [
    "| Capability | Status | Evidence |",
    "| --- | --- | --- |",
    ...capabilities.map((capability) => `| ${capability.label} | ${capability.status} | ${capability.evidence} |`)
  ].join("\n");
}

export function capabilitiesCsv(capabilities: StudyCapability[] = l75CapabilitiesMatrix()): string {
  return [
    "id,label,status,evidence,boundary",
    ...capabilities.map((capability) => [capability.id, capability.label, capability.status, capability.evidence, capability.boundary].map(csvEscape).join(","))
  ].join("\n");
}

export function createStudySnapshot(input: StudySnapshotInput): StudySnapshot {
  const createdAtIso = input.createdAtIso ?? new Date().toISOString();
  const base = {
    schema: "emmicro.studySnapshot.v1" as const,
    type: "l78PracticalStudy" as const,
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
    capabilities: l76CapabilitiesMatrix()
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
    geometricDetection?: unknown;
    geometricFit?: unknown;
    geometricComparison?: unknown;
    sessionQa?: unknown;
    fiducialBoard?: unknown;
    fiducialDetection?: unknown;
    fiducialFit?: unknown;
    externalDetectorImport?: unknown;
    externalDetectorComparison?: unknown;
    detectorRoundTripReport?: unknown;
  } = {}
): StudyBundle {
  return {
    schema: "emmicro.studyBundle.v1",
    appVersion: "L8.8 Engineering Evidence Campaign + Robust Design Advisor + Process / Tolerance Runner + Multi-Element Optical Bench Editing / L7.8 Detector Round-Trip Acceptance Pack",
    manifest: {
      appVersion: "L8.8",
      studyHash: study.resultHash,
      resultHashes: [...study.resultHashes],
      backendReceipt: study.backendReceipt,
      materialReceiptCount: study.materialReceipts.length,
      uncertaintyReceiptCount: study.uncertaintyReceipts.length,
      warningCount: study.warnings.length,
      capabilityBoundary: "Executable capabilities are scalar validation, planar TMM, diagnostic measured-vs-simulated comparison, Camera/Sensor-Lite detector acquisition post-processing, EMVA-inspired diagnostic camera calibration, ISO 12233-inspired slanted-edge/line-pair MTF diagnostics, L7.1 focus/field MTF qualification diagnostics, L7.2 diagnostic 2D geometric calibration/distortion/pixel-scale workflows, L7.3 diagnostic ROI-limited dot-grid measured target detection, L7.4 diagnostic batch measurement session QA/repeatability aggregation, L7.5 diagnostic synthetic fiducial board generation/imported detection matching/manual correction/geometry-fit/session-QA handoff, L7.6 external detector JSON/CSV import, receipt validation, comparison, and report exports, L7.7 optional external OpenCV ChArUco helper tooling, L7.8 detector round-trip acceptance reports over imported evidence only, L8.1 external FDTD manifest/script export plus receipt/flux/field-slice import evidence, L8.2 external FDTD benchmark export/convergence import diagnostics over external evidence, L8.3 finite placed transparent/absorbing/reflective/aperture/wedge geometry export/import diagnostics over external FDTD evidence, L8.4 long-slit/circular-pinhole/rectangular-aperture/opaque-blocker edge-diffraction validation dossiers over external FDTD evidence with scalar limiting references and convergence warnings, L8.5.1 multi-element optical bench scene graph/solver plan/scalar monitor stack/external FDTD chain export-import workflow plus element inspector numeric editing, optional drag, snap/nudge controls, undo/redo, and custom monitor editing for supported ordered geometry, L8.6 diagnostic process/tolerance variation studies with one-at-a-time, bounded deterministic-grid, seeded-sample, sensitivity, threshold, worst-case, and external FDTD variation sweep receipt workflows, L8.7 diagnostic robust-design guidance with ranked recentering/tolerance-budget recommendations, robust candidate comparison, explicit user-applied candidate actions, and external FDTD candidate sweep receipts, L8.8 engineering evidence campaign dossiers with curated golden scenarios, analytic/TMM/scalar references, convergence/PML summaries, L8.6 tolerance evidence, L8.7 robust before/after metrics, capability truth tables, reproducibility hashes, and Markdown/JSON/CSV exports, L9.2 capped diagnostic in-browser 2D TMz FDTD sandbox reports/traces with CPU reference stepping, optional browser-supported WebGPU acceleration, CPU/GPU parity, performance, stability, fixture, reference, boundary, and convergence diagnostics, L9.3 bounded diagnostic in-browser 1D periodic binary-grating RCWA/Fourier-modal preview reports with diffraction orders, R/T/A totals, energy-balance checks, harmonic convergence, and TMM no-pattern consistency diagnostics, L9.4 solver-router method selection with deterministic scene classification, recommended solver, alternatives, route actions, method matrix, and solver_route_report.md/json plus CSV exports, L9.5 solver-router evidence task auto-pack with route/task/scene hashes, evidence artifacts, validation plans, export bundles, and Engineering Evidence Campaign promotion metadata, and L9.6 cross-solver consistency diagnostics for overlapping TMM/RCWA, CPU/WebGPU FDTD, scalar-vs-2D FDTD, external FDTD slab, absorber, missing evidence, and non-comparable guardrail cases with cross_solver_consistency_report.md/json, consistency_metrics.csv, solver_pair_residuals.csv, and consistency_assumptions.csv exports; pixel-level EM sensor stacks, certified validation, certified camera calibration, ISO 12233 certification, Imatest-equivalent certification, lab-accredited metrology, EMVA 1288 certification, pure lens-only MTF certification, certified lab calibration, certified metrology reports, lab accreditation workflows, calibrated optical model fitting, certified optical tolerancing, automatic certified solver selection, automatic solver correctness proof, production EM solver certification, production RCWA certification, production FDTD certification, arbitrary 2D-periodic RCWA, anisotropic/conical RCWA, automatic final design approval, auto redesign, full inverse design, inverse optimization, production metal aperture models, curved/freeform material lens solves, conformal curved coating solves, full 3D pose/stereo calibration, browser-native OpenCV.js/ArUco detector execution, AprilTag decoding, hardware control, in-browser 3D FDTD, production browser FDTD execution, production in-app FDTD/FEM/BEM/RCWA, FEM/BEM route execution, arbitrary 3D Maxwell/CAD solving, digital twins, and manufacturing certification are not implemented."
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
    geometricDetection: options.geometricDetection,
    geometricFit: options.geometricFit,
    geometricComparison: options.geometricComparison,
    sessionQa: options.sessionQa,
    fiducialBoard: options.fiducialBoard,
    fiducialDetection: options.fiducialDetection,
    fiducialFit: options.fiducialFit,
    externalDetectorImport: options.externalDetectorImport,
    externalDetectorComparison: options.externalDetectorComparison,
    detectorRoundTripReport: options.detectorRoundTripReport,
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
    evidence: "No executable path in the current app.",
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
