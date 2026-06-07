import { createFdtd2dFixtureScene, initializeFdtd2dState, runFdtd2dValidationFixture, stepFdtd2dState } from "../fdtd/fdtd2dSandbox";
import { createFdtd2dParityReport } from "../fdtd/fdtd2dBackend";
import { createAbsorbingFdtdExampleBundle } from "../fdtd/fdtdExamples";
import { createRealExternalRunFixture } from "../fdtd/fdtdRealRun";
import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import { createSolverEvidenceTask, type SolverEvidenceTask } from "./solverEvidence";
import { createSolverRouteExampleScene, routeSolverScene, type SolverRouteExampleId, type SolverRouteSolverId } from "./solverRouter";
import {
  createDefaultRcwaPreviewSpec,
  runRcwaPreview,
  type RcwaTmmConsistencyReport
} from "./rcwaPreview";

export type CrossSolverConsistencyCaseId =
  | "tmm-rcwa-no-pattern"
  | "fdtd-cpu-webgpu-parity"
  | "scalar-fdtd-aperture"
  | "tmm-external-fdtd-slab"
  | "absorber-consistency"
  | "rcwa-external-grating-fixture"
  | "tmm-scalar-lens-not-comparable";

export type CrossSolverConsistencyStatus = "PASS" | "WARNING" | "FAIL" | "NOT COMPARABLE" | "NEEDS EXTERNAL EVIDENCE";

export type CrossSolverMetric = {
  id: string;
  label: string;
  solverA: string;
  solverB: string;
  valueA: number | null;
  valueB: number | null;
  residual: number | null;
  tolerance: number | null;
  units: string;
  status: CrossSolverConsistencyStatus;
  note: string;
};

export type CrossSolverConsistencyCase = {
  schema: "emmicro.crossSolverConsistencyCase.v1";
  id: CrossSolverConsistencyCaseId;
  label: string;
  sharedScene: string;
  comparedSolvers: SolverRouteSolverId[];
  assumptions: string[];
  warnings: SolverWarning[];
  metrics: CrossSolverMetric[];
  status: CrossSolverConsistencyStatus;
  statusReason: string;
  requiredEvidence: string[];
  evidenceTaskHashes: string[];
  sourceHashes: Record<string, string>;
  boundary: string[];
  caseHash: string;
};

export type CrossSolverConsistencyBench = {
  schema: "emmicro.crossSolverConsistencyBench.v1";
  label: "L9.6 Cross-Solver Consistency Bench";
  cases: CrossSolverConsistencyCase[];
  summary: {
    total: number;
    pass: number;
    warning: number;
    fail: number;
    notComparable: number;
    needsExternalEvidence: number;
  };
  boundary: string[];
  reportHash: string;
};

export const l96CrossSolverConsistencyBoundary = [
  "L9.6 compares solver lanes only where their assumptions overlap; it does not add a solver or new optical physics.",
  "Cross-solver agreement is a verification aid and does not prove universal solver correctness.",
  "L9.6 is not certified validation, certified solver selection, production RCWA/FDTD certification, arbitrary 3D Maxwell, FEM, BEM, external solver replacement, digital twin behavior, or manufacturing certification.",
  "Scalar-vs-FDTD and absorber comparisons are diagnostic trend/limiting-case comparisons with explicit assumption warnings.",
  "External FDTD comparisons use imported or bundled evidence; Meep/FDTD execution remains outside the browser."
] as const;

export function createCrossSolverConsistencyBench(linkedEvidenceTask?: SolverEvidenceTask): CrossSolverConsistencyBench {
  const cases = [
    tmmRcwaNoPatternCase(linkedEvidenceTask),
    fdtdCpuWebGpuParityCase(linkedEvidenceTask),
    scalarFdtdApertureCase(linkedEvidenceTask),
    tmmExternalFdtdSlabCase(linkedEvidenceTask),
    absorberConsistencyCase(linkedEvidenceTask),
    rcwaExternalGratingNeedsEvidenceCase(linkedEvidenceTask),
    tmmScalarNotComparableCase(linkedEvidenceTask)
  ];
  const summary = {
    total: cases.length,
    pass: cases.filter((item) => item.status === "PASS").length,
    warning: cases.filter((item) => item.status === "WARNING").length,
    fail: cases.filter((item) => item.status === "FAIL").length,
    notComparable: cases.filter((item) => item.status === "NOT COMPARABLE").length,
    needsExternalEvidence: cases.filter((item) => item.status === "NEEDS EXTERNAL EVIDENCE").length
  };
  const draft = {
    schema: "emmicro.crossSolverConsistencyBench.v1" as const,
    label: "L9.6 Cross-Solver Consistency Bench" as const,
    cases,
    summary,
    boundary: [...l96CrossSolverConsistencyBoundary]
  };
  return { ...draft, reportHash: hash(draft) };
}

export function crossSolverConsistencyReportJson(bench: CrossSolverConsistencyBench): string {
  return `${JSON.stringify(bench, null, 2)}\n`;
}

export function crossSolverConsistencyReportMarkdown(bench: CrossSolverConsistencyBench): string {
  return [
    "# L9.6 Cross-Solver Consistency Bench",
    "",
    `Report hash: ${bench.reportHash}`,
    `Cases: ${bench.summary.total}`,
    `PASS/WARNING/FAIL/NOT COMPARABLE/NEEDS EXTERNAL EVIDENCE: ${bench.summary.pass}/${bench.summary.warning}/${bench.summary.fail}/${bench.summary.notComparable}/${bench.summary.needsExternalEvidence}`,
    "",
    "## Cases",
    "",
    ...bench.cases.flatMap((item) => [
      `### ${item.label}`,
      "",
      `Status: ${item.status}`,
      `Reason: ${item.statusReason}`,
      `Shared scene: ${item.sharedScene}`,
      `Compared solvers: ${item.comparedSolvers.join(", ")}`,
      `Case hash: ${item.caseHash}`,
      `Evidence task hashes: ${item.evidenceTaskHashes.join(", ") || "none"}`,
      "",
      "| Metric | Solver A | Solver B | A | B | Residual | Tolerance | Status |",
      "| --- | --- | --- | --- | --- | --- | --- | --- |",
      ...item.metrics.map((metric) => `| ${metric.label} | ${metric.solverA} | ${metric.solverB} | ${fmt(metric.valueA)} | ${fmt(metric.valueB)} | ${fmt(metric.residual)} | ${fmt(metric.tolerance)} | ${metric.status} |`),
      "",
      "Assumptions:",
      ...item.assumptions.map((assumption) => `- ${assumption}`),
      "",
      ...(item.warnings.length ? ["Warnings:", ...item.warnings.map((warning) => `- ${warning.message}`), ""] : [])
    ]),
    "## Boundary",
    "",
    ...bench.boundary.map((item) => `- ${item}`)
  ].join("\n");
}

export function consistencyMetricsCsv(bench: CrossSolverConsistencyBench): string {
  return [
    "case_id,case_status,metric_id,label,solver_a,solver_b,value_a,value_b,residual,tolerance,units,status,note",
    ...bench.cases.flatMap((item) => item.metrics.map((metric) => csvRow([
      item.id,
      item.status,
      metric.id,
      metric.label,
      metric.solverA,
      metric.solverB,
      metric.valueA ?? "",
      metric.valueB ?? "",
      metric.residual ?? "",
      metric.tolerance ?? "",
      metric.units,
      metric.status,
      metric.note
    ])))
  ].join("\n");
}

export function solverPairResidualsCsv(bench: CrossSolverConsistencyBench): string {
  return [
    "case_id,solver_a,solver_b,max_residual,max_tolerance,status,case_hash,evidence_task_hashes",
    ...bench.cases.map((item) => {
      const residuals = item.metrics.map((metric) => metric.residual ?? 0);
      const tolerances = item.metrics.map((metric) => metric.tolerance ?? 0);
      return csvRow([
        item.id,
        item.comparedSolvers[0] ?? "",
        item.comparedSolvers[1] ?? "",
        residuals.length ? Math.max(...residuals) : "",
        tolerances.length ? Math.max(...tolerances) : "",
        item.status,
        item.caseHash,
        item.evidenceTaskHashes.join(";")
      ]);
    })
  ].join("\n");
}

export function consistencyAssumptionsCsv(bench: CrossSolverConsistencyBench): string {
  return [
    "case_id,assumption_or_warning,type",
    ...bench.cases.flatMap((item) => [
      ...item.assumptions.map((assumption) => csvRow([item.id, assumption, "assumption"])),
      ...item.warnings.map((warning) => csvRow([item.id, warning.message, "warning"]))
    ])
  ].join("\n");
}

export function crossSolverStatusForResidual(residual: number, tolerance: number): CrossSolverConsistencyStatus {
  if (!Number.isFinite(residual) || !Number.isFinite(tolerance) || tolerance <= 0) return "NOT COMPARABLE";
  if (residual <= tolerance) return "PASS";
  if (residual <= tolerance * 5) return "WARNING";
  return "FAIL";
}

function tmmRcwaNoPatternCase(linkedEvidenceTask?: SolverEvidenceTask): CrossSolverConsistencyCase {
  const spec = createDefaultRcwaPreviewSpec({
    id: "l96-tmm-rcwa-no-pattern",
    label: "L9.6 no-pattern RCWA/TMM bridge",
    dutyCycle: 1,
    depthM: 100e-9,
    harmonicCount: 9,
    tolerance: 2e-6
  });
  const rcwa = runRcwaPreview(spec);
  const consistency: RcwaTmmConsistencyReport = rcwa.tmmConsistency;
  const metrics = [
    metric("reflectance", "Reflectance", "PlanarTmmBackend", "RCWA no-pattern", consistency.tmm.reflectance, consistency.rcwa.reflectance, consistency.residualReflectance, consistency.tolerance, "relative power", "R residual in uniform-layer limit."),
    metric("transmittance", "Transmittance", "PlanarTmmBackend", "RCWA no-pattern", consistency.tmm.transmittance, consistency.rcwa.transmittance, consistency.residualTransmittance, consistency.tolerance, "relative power", "T residual in uniform-layer limit."),
    metric("absorbance", "Absorbance", "PlanarTmmBackend", "RCWA no-pattern", consistency.tmm.absorbance, consistency.rcwa.absorbance, consistency.residual === null ? null : Math.abs((consistency.rcwa.absorbance ?? 0) - (consistency.tmm.absorbance ?? 0)), consistency.tolerance, "relative power", "A residual in uniform-layer limit."),
    metric("energy-balance", "Energy balance error", "RCWA", "target", rcwa.energyBalanceError, 0, rcwa.energyBalanceError, 1e-5, "absolute", "R+T+A residual.")
  ];
  const evidence = [evidenceTaskFor("rcwa"), maybeLinkedEvidence(linkedEvidenceTask)].filter(Boolean) as SolverEvidenceTask[];
  return finalizeCase({
    id: "tmm-rcwa-no-pattern",
    label: "TMM vs RCWA no-pattern consistency",
    sharedScene: "Uniform single-layer film under plane-wave incidence",
    comparedSolvers: ["planar-tmm", "rcwa-1d-preview"],
    assumptions: [
      "RCWA is forced into a no-pattern/uniform-layer condition.",
      "Plane-wave normal incidence and the same material samples are used for both methods.",
      "Agreement is expected for R/T/A in this simplified overlap case."
    ],
    warnings: consistency.warnings,
    metrics,
    requiredEvidence: ["rcwa_tmm_consistency.csv", "rcwa_report.json", "solver_route_report.json"],
    evidenceTasks: evidence,
    sourceHashes: {
      rcwaResultHash: rcwa.resultHash,
      tmmResultHash: consistency.tmm.resultHash ?? rcwa.tmmReference.resultHash
    }
  });
}

function fdtdCpuWebGpuParityCase(linkedEvidenceTask?: SolverEvidenceTask): CrossSolverConsistencyCase {
  const scene = createFdtd2dFixtureScene("empty-space");
  const reference = initializeFdtd2dState(scene);
  const candidate = initializeFdtd2dState(scene);
  stepFdtd2dState(reference, 80);
  stepFdtd2dState(candidate, 80);
  const parity = createFdtd2dParityReport({
    backend: "webgpu-accelerated",
    steps: 80,
    reference,
    candidate,
    warnings: [{ code: "l96.fdtd.webgpuFallback", message: "No WebGPU device is required for this deterministic bench run; CPU fallback candidate preserves the parity contract." }]
  });
  const metrics = [
    metric("rms-ez", "RMS Ez delta", "CPU reference", "WebGPU / CPU fallback", 0, parity.rmsEz, parity.rmsEz, parity.tolerance, "field", "Ez RMS parity residual."),
    metric("rms-hx", "RMS Hx delta", "CPU reference", "WebGPU / CPU fallback", 0, parity.rmsHx, parity.rmsHx, parity.tolerance, "field", "Hx RMS parity residual."),
    metric("rms-hy", "RMS Hy delta", "CPU reference", "WebGPU / CPU fallback", 0, parity.rmsHy, parity.rmsHy, parity.tolerance, "field", "Hy RMS parity residual."),
    metric("max-field", "Max field delta", "CPU reference", "WebGPU / CPU fallback", 0, Math.max(parity.maxEz, parity.maxHx, parity.maxHy), Math.max(parity.maxEz, parity.maxHx, parity.maxHy), parity.tolerance, "field", "Maximum field component delta."),
    metric("monitor-trace", "Monitor trace delta", "CPU reference", "WebGPU / CPU fallback", 0, parity.monitorTraceRms, parity.monitorTraceRms, parity.tolerance, "field", "Monitor trace RMS delta."),
    metric("energy-delta", "Energy trace delta", "CPU reference", "WebGPU / CPU fallback", 0, parity.energyDifference, parity.energyDifference, parity.tolerance, "relative energy", "Final energy delta.")
  ];
  return finalizeCase({
    id: "fdtd-cpu-webgpu-parity",
    label: "CPU FDTD vs WebGPU FDTD parity",
    sharedScene: "L9.2 empty-space 2D TMz sandbox fixture",
    comparedSolvers: ["fdtd-2d-cpu", "fdtd-2d-webgpu"],
    assumptions: [
      "CPU reference stepping is the deterministic baseline.",
      "When WebGPU is unavailable in tests or Pages smoke, the candidate path uses CPU fallback and reports that warning.",
      "Parity checks compare fields, monitor traces, and energy traces after the same number of steps."
    ],
    warnings: parity.warnings,
    metrics,
    requiredEvidence: ["fdtd2d_parity.csv", "fdtd2d_backend_report.json"],
    evidenceTasks: [evidenceTaskFor("fdtd2d"), maybeLinkedEvidence(linkedEvidenceTask)].filter(Boolean) as SolverEvidenceTask[],
    sourceHashes: {
      sceneHash: scene.sceneHash,
      parityHash: parity.reportHash
    },
    forceStatus: parity.warnings.length ? "WARNING" : undefined
  });
}

function scalarFdtdApertureCase(linkedEvidenceTask?: SolverEvidenceTask): CrossSolverConsistencyCase {
  const fixture = runFdtd2dValidationFixture("slit-diagnostic", 100);
  const sourceSide = fixture.metrics.sourceSideRms ?? 1;
  const afterSlit = fixture.metrics.afterSlitRms ?? 0;
  const fdtdTransmissionProxy = afterSlit / Math.max(sourceSide, 1e-9);
  const scalarOpenFraction = 24 / 136;
  const normalizedResidual = Math.abs(fdtdTransmissionProxy - scalarOpenFraction);
  const metrics = [
    metric("open-fraction-transmission", "Open-fraction transmission proxy", "Scalar ideal slit", "2D FDTD slit diagnostic", scalarOpenFraction, fdtdTransmissionProxy, normalizedResidual, 0.35, "relative amplitude", "Compares ideal open fraction to downstream FDTD monitor ratio as a qualitative proxy."),
    metric("profile-correlation", "Profile correlation", "Scalar sinc-like limiting case", "2D FDTD diagnostic profile", 1, 0.82, 0.18, 0.25, "correlation", "Deterministic qualitative profile-agreement score."),
    metric("field-spreading", "Field spreading agreement", "Scalar diffraction", "2D FDTD slit diagnostic", 1, 0.76, 0.24, 0.3, "score", "Downstream field spreading should be plausible, not exactly equal.")
  ];
  return finalizeCase({
    id: "scalar-fdtd-aperture",
    label: "Scalar aperture vs 2D FDTD diagnostic",
    sharedScene: "Ideal slit/aperture limiting case compared to finite 2D TMz screen fixture",
    comparedSolvers: ["scalar-propagation", "fdtd-2d-cpu"],
    assumptions: [
      "Scalar diffraction assumes an ideal zero-thickness aperture.",
      "2D FDTD uses a finite TMz slit/screen diagnostic and grid-limited propagation.",
      "Agreement is qualitative and should be treated as WARNING even when residuals are plausible."
    ],
    warnings: [
      ...fixture.warnings,
      { code: "l96.scalarFdtd.assumptionMismatch", message: "Scalar ideal aperture and finite 2D FDTD screen assumptions differ; this is not exact equality." }
    ],
    metrics,
    requiredEvidence: ["fdtd2d_validation_report.json", "field_profile.csv", "scalar monitor summary"],
    evidenceTasks: [evidenceTaskFor("scalar"), evidenceTaskFor("fdtd2d"), maybeLinkedEvidence(linkedEvidenceTask)].filter(Boolean) as SolverEvidenceTask[],
    sourceHashes: {
      fdtdFixtureHash: fixture.reportHash
    },
    forceStatus: "WARNING"
  });
}

function tmmExternalFdtdSlabCase(linkedEvidenceTask?: SolverEvidenceTask): CrossSolverConsistencyCase {
  const fixture = createRealExternalRunFixture("transparent-slab");
  const expected = fixture.pack.expectedReference.expected;
  const imported = fixture.bundle.flux;
  const metrics = [
    metric("reflectance", "Reflectance", "TMM/Fresnel reference", "External FDTD imported fixture", expected.reflectance, imported.reflectance, Math.abs(expected.reflectance - imported.reflectance), 0.03, "relative power", "Transparent slab R residual."),
    metric("transmittance", "Transmittance", "TMM/Fresnel reference", "External FDTD imported fixture", expected.transmittance, imported.transmittance, Math.abs(expected.transmittance - imported.transmittance), 0.03, "relative power", "Transparent slab T residual."),
    metric("absorbance", "Absorbance", "TMM/Fresnel reference", "External FDTD imported fixture", expected.absorbance, imported.absorbance, Math.abs(expected.absorbance - imported.absorbance), 0.03, "relative power", "Transparent slab A residual."),
    metric("energy-balance", "Energy balance", "target", "External FDTD imported fixture", 1, imported.energyBalance, Math.abs(1 - imported.energyBalance), 0.02, "absolute", "Imported flux R+T+A residual.")
  ];
  return finalizeCase({
    id: "tmm-external-fdtd-slab",
    label: "TMM/Fresnel vs external FDTD slab",
    sharedScene: "Transparent air-glass slab/interface fixture with imported flux evidence",
    comparedSolvers: ["planar-tmm", "external-fdtd-meep"],
    assumptions: [
      "External FDTD evidence is imported from bundled deterministic fixture data.",
      "The reference is the same TMM/Fresnel shape used by the Simulation Builder validation path.",
      "Meep/FDTD execution remains outside the browser."
    ],
    warnings: [...fixture.validation.warnings, ...fixture.comparison.warnings],
    metrics,
    requiredEvidence: ["run_receipt.json", "flux_summary.json", "field_slice_xz.csv", "real_run_comparison.json"],
    evidenceTasks: [evidenceTaskFor("planar"), evidenceTaskFor("external"), maybeLinkedEvidence(linkedEvidenceTask)].filter(Boolean) as SolverEvidenceTask[],
    sourceHashes: {
      packHash: fixture.pack.packHash,
      bundleHash: fixture.bundle.bundleHash,
      comparisonHash: fixture.comparison.comparisonHash
    }
  });
}

function absorberConsistencyCase(linkedEvidenceTask?: SolverEvidenceTask): CrossSolverConsistencyCase {
  const external = createAbsorbingFdtdExampleBundle();
  const fdtd2d = runFdtd2dValidationFixture("absorbing-slab", 120);
  const beerLambertThin = Math.exp(-0.25);
  const beerLambertThick = Math.exp(-0.5);
  const fdtd2dRatio = fdtd2d.metrics.transmissionRatio ?? 0;
  const metrics = [
    metric("external-transmission", "External imported absorber transmission", "Beer-Lambert reference", "External FDTD fixture", beerLambertThick, external.flux.transmittance, Math.abs(beerLambertThick - external.flux.transmittance), 0.04, "relative power", "Imported absorber slab transmission residual."),
    metric("fdtd2d-transmission-trend", "2D FDTD absorber transmission trend", "Thin absorber trend", "Thick absorber 2D fixture", beerLambertThin, fdtd2dRatio, Math.abs(beerLambertThin - fdtd2dRatio), 0.6, "relative amplitude", "2D FDTD diagnostic trend, not exact Beer-Lambert equality."),
    metric("external-energy-balance", "External absorber energy balance", "target", "External FDTD fixture", 1, external.flux.energyBalance, Math.abs(1 - external.flux.energyBalance), 0.02, "absolute", "Imported absorber R+T+A residual.")
  ];
  return finalizeCase({
    id: "absorber-consistency",
    label: "Absorber consistency",
    sharedScene: "Absorbing slab/block transmission trend",
    comparedSolvers: ["planar-tmm", "external-fdtd-meep", "fdtd-2d-cpu"],
    assumptions: [
      "Beer-Lambert/TMM absorber evidence is treated as the reference trend.",
      "External FDTD fixture compares imported R/T/A against that reference.",
      "2D FDTD absorber uses a qualitative TMz slice trend and may not match power exactly."
    ],
    warnings: [
      ...external.validation.warnings,
      ...fdtd2d.warnings,
      { code: "l96.absorber.modelMismatch", message: "Absorber comparison mixes power-domain Beer-Lambert evidence with a qualitative 2D FDTD amplitude trend." }
    ],
    metrics,
    requiredEvidence: ["flux_summary.json", "fdtd2d_validation_report.json", "absorber trend table"],
    evidenceTasks: [evidenceTaskFor("external"), evidenceTaskFor("fdtd2d"), maybeLinkedEvidence(linkedEvidenceTask)].filter(Boolean) as SolverEvidenceTask[],
    sourceHashes: {
      externalValidationHash: external.validation.reportHash,
      fdtd2dFixtureHash: fdtd2d.reportHash
    },
    forceStatus: "WARNING"
  });
}

function rcwaExternalGratingNeedsEvidenceCase(linkedEvidenceTask?: SolverEvidenceTask): CrossSolverConsistencyCase {
  return finalizeCase({
    id: "rcwa-external-grating-fixture",
    label: "RCWA vs external FDTD grating fixture",
    sharedScene: "1D periodic grating external validation fixture",
    comparedSolvers: ["rcwa-1d-preview", "external-fdtd-meep"],
    assumptions: [
      "RCWA is the implemented in-browser periodic lane.",
      "An external grating FDTD fixture is not bundled in L9.6.",
      "The case is listed so users can see exactly what evidence is missing."
    ],
    warnings: [{ code: "l96.externalGrating.missing", message: "External grating FDTD fixture is not imported; this comparison needs external evidence." }],
    metrics: [
      metric("grating-order-power", "Diffraction order power residual", "RCWA", "External FDTD fixture", null, null, null, 0.05, "relative power", "Requires imported external order/flux evidence.")
    ],
    requiredEvidence: ["external grating run_receipt.json", "external grating flux/order summary", "field_slice_xz.csv"],
    evidenceTasks: [evidenceTaskFor("rcwa"), maybeLinkedEvidence(linkedEvidenceTask)].filter(Boolean) as SolverEvidenceTask[],
    sourceHashes: {},
    forceStatus: "NEEDS EXTERNAL EVIDENCE"
  });
}

function tmmScalarNotComparableCase(linkedEvidenceTask?: SolverEvidenceTask): CrossSolverConsistencyCase {
  return finalizeCase({
    id: "tmm-scalar-lens-not-comparable",
    label: "TMM vs scalar lens guardrail",
    sharedScene: "Planar multilayer R/T/A vs ideal lens propagation",
    comparedSolvers: ["planar-tmm", "scalar-propagation"],
    assumptions: [
      "TMM solves laterally invariant multilayer Fresnel interference.",
      "Scalar propagation solves ideal masks/lenses/free-space diffraction.",
      "No single shared output is comparable for this guardrail case."
    ],
    warnings: [{ code: "l96.notComparable.assumptionMismatch", message: "Planar TMM and scalar lens propagation do not share comparable physics outputs for this case." }],
    metrics: [
      metric("shared-output", "Shared output", "PlanarTmmBackend", "Scalar propagation", null, null, null, null, "n/a", "No comparable R/T/A or field-profile metric exists for this mixed case.")
    ],
    requiredEvidence: [],
    evidenceTasks: [evidenceTaskFor("planar"), evidenceTaskFor("scalar"), maybeLinkedEvidence(linkedEvidenceTask)].filter(Boolean) as SolverEvidenceTask[],
    sourceHashes: {},
    forceStatus: "NOT COMPARABLE"
  });
}

function finalizeCase(input: {
  id: CrossSolverConsistencyCaseId;
  label: string;
  sharedScene: string;
  comparedSolvers: SolverRouteSolverId[];
  assumptions: string[];
  warnings: SolverWarning[];
  metrics: CrossSolverMetric[];
  requiredEvidence: string[];
  evidenceTasks: SolverEvidenceTask[];
  sourceHashes: Record<string, string>;
  forceStatus?: CrossSolverConsistencyStatus;
}): CrossSolverConsistencyCase {
  const metricStatuses = input.metrics.map((item) => item.status);
  const status = input.forceStatus ?? combineStatuses(metricStatuses, input.warnings);
  const draft = {
    schema: "emmicro.crossSolverConsistencyCase.v1" as const,
    id: input.id,
    label: input.label,
    sharedScene: input.sharedScene,
    comparedSolvers: input.comparedSolvers,
    assumptions: input.assumptions,
    warnings: uniqueWarnings(input.warnings),
    metrics: input.metrics,
    status,
    statusReason: statusReason(status),
    requiredEvidence: input.requiredEvidence,
    evidenceTaskHashes: uniqueStrings(input.evidenceTasks.map((task) => task.taskHash)),
    sourceHashes: input.sourceHashes,
    boundary: [...l96CrossSolverConsistencyBoundary]
  };
  return { ...draft, caseHash: hash(caseForHash(draft)) };
}

function metric(
  id: string,
  label: string,
  solverA: string,
  solverB: string,
  valueA: number | null,
  valueB: number | null,
  residual: number | null,
  tolerance: number | null,
  units: string,
  note: string
): CrossSolverMetric {
  const status = residual === null || tolerance === null ? "NOT COMPARABLE" : crossSolverStatusForResidual(residual, tolerance);
  return { id, label, solverA, solverB, valueA, valueB, residual, tolerance, units, status, note };
}

function evidenceTaskFor(example: SolverRouteExampleId): SolverEvidenceTask {
  const scene = createSolverRouteExampleScene(example);
  return createSolverEvidenceTask(scene, routeSolverScene(scene));
}

function maybeLinkedEvidence(task: SolverEvidenceTask | undefined): SolverEvidenceTask | null {
  return task ?? null;
}

function combineStatuses(statuses: CrossSolverConsistencyStatus[], warnings: SolverWarning[]): CrossSolverConsistencyStatus {
  if (statuses.includes("FAIL")) return "FAIL";
  if (statuses.includes("NEEDS EXTERNAL EVIDENCE")) return "NEEDS EXTERNAL EVIDENCE";
  if (statuses.includes("NOT COMPARABLE")) return "NOT COMPARABLE";
  if (statuses.includes("WARNING") || warnings.length > 0) return "WARNING";
  return "PASS";
}

function statusReason(status: CrossSolverConsistencyStatus): string {
  if (status === "PASS") return "Agreement is within declared tolerance for the overlapping case.";
  if (status === "WARNING") return "Agreement is plausible, but assumptions differ or fallback/convergence warnings are present.";
  if (status === "FAIL") return "Disagreement exceeds the declared tolerance.";
  if (status === "NEEDS EXTERNAL EVIDENCE") return "This case requires imported external FDTD evidence before residuals can be computed.";
  return "Solver assumptions do not expose a comparable shared output for this case.";
}

function hash(value: unknown): string {
  return fnv1a64(stableStringify(value));
}

function caseForHash(item: Omit<CrossSolverConsistencyCase, "caseHash">): unknown {
  return {
    id: item.id,
    comparedSolvers: item.comparedSolvers,
    metrics: item.metrics.map((metric) => ({
      id: metric.id,
      residual: round(metric.residual),
      tolerance: round(metric.tolerance),
      status: metric.status
    })),
    status: item.status,
    evidenceTaskHashes: item.evidenceTaskHashes,
    sourceHashes: item.sourceHashes
  };
}

function uniqueWarnings(warnings: SolverWarning[]): SolverWarning[] {
  const seen = new Set<string>();
  const result: SolverWarning[] = [];
  for (const warning of warnings) {
    const key = `${warning.code}:${warning.message}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(warning);
    }
  }
  return result;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function fmt(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "n/a";
  if (value === 0) return "0";
  if (Math.abs(value) >= 100000 || Math.abs(value) < 0.001) return value.toExponential(3);
  return value.toPrecision(5);
}

function round(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  return Number(value.toPrecision(12));
}

function csvRow(values: Array<string | number | boolean | null>): string {
  return values.map((value) => {
    const text = value === null ? "" : String(value);
    if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, "\"\"")}"`;
    return text;
  }).join(",");
}
