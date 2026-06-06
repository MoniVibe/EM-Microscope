import { useMemo, useRef, useState, type PointerEvent } from "react";
import {
  addOpticalBenchCustomMonitor,
  addSimulationBuilderElement,
  apertureConvergenceCsv,
  apertureFluxSummaryJson,
  apertureKindLabel,
  apertureMetricsCsv,
  apertureProfileCsv,
  apertureReceiptJson,
  apertureValidationReportJson,
  apertureValidationReportMarkdown,
  apertureValidationSceneJson,
  createAbsorbingFdtdExampleBundle,
  createAbsorbingFdtdExampleScenario,
  createApertureConvergenceReport,
  createApertureValidationExampleBundle,
  createApertureValidationScenario,
  createApertureValidationScene,
  createFdtdBenchmarkExampleBundle,
  createFdtdBenchmarkPack,
  createFdtdBenchmarkScenario,
  commitOpticalBenchHistory,
  createOpticalBenchHistory,
  createSimulationBuilderElement,
  createExampleToleranceFdtdSweepSummary,
  createExampleRobustFdtdCandidateSweepSummary,
  createEngineeringEvidenceCampaignBundle,
  createEngineeringEvidenceCampaignManifest,
  createSurfaceGeometryConvergencePack,
  createSurfaceGeometryElement,
  createRobustFdtdCandidateSweepManifest,
  createToleranceFdtdSweepManifest,
  createSurfaceGeometryExampleBundle,
  createSurfaceGeometryScene,
  createTransparentFdtdExampleBundle,
  createTransparentFdtdExampleScenario,
  defaultOpticalBenchScenario,
  defaultSimulationBuilderScenario,
  defaultToleranceMetrics,
  defaultToleranceThresholds,
  defaultToleranceVariationSpecs,
  deleteOpticalBenchCustomMonitor,
  deleteOpticalBenchElement,
  duplicateOpticalBenchElement,
  fdtdBenchmarkManifestJson,
  fdtdBenchmarkReportJson,
  fdtdBenchmarkReportMarkdown,
  fdtdConvergenceMetricsCsv,
  fdtdConvergenceSummaryJson,
  exportFdtdBundleFromSimulationBuilder,
  fdtdFieldSliceToCsv,
  fdtdImportedRunJson,
  fdtdManifestJson,
  fdtdMeepScriptText,
  fdtdRunTableCsv,
  fdtdSweepPlanJson,
  fdtdValidationMetricsCsv,
  fdtdValidationReportJson,
  fdtdValidationReportMarkdown,
  engineeringEvidenceCampaignManifestJson,
  engineeringEvidenceCapabilityTruthTableCsv,
  engineeringEvidenceConvergenceSummaryCsv,
  engineeringEvidenceDossierJson,
  engineeringEvidenceDossierMarkdown,
  engineeringEvidenceRobustCandidateSummaryCsv,
  engineeringEvidenceScenarioSummaryCsv,
  engineeringEvidenceToleranceSummaryCsv,
  engineeringEvidenceUnsupportedItemsCsv,
  isOpticalBenchEditingBlocked,
  createOpticalBenchBundle,
  createRealExternalRunFixture,
  createRealExternalRunPack,
  createRealExternalRunReproducibilityReport,
  importFdtdRunArtifacts,
  importFdtdConvergenceBundleArtifacts,
  importRealExternalRunBundle,
  l80ReleaseTrail,
  metricLabel,
  moveOpticalBenchElementInOrder,
  nudgeOpticalBenchElement,
  opticalBenchMetricsCsv,
  opticalBenchMonitorStackCsv,
  opticalBenchSceneJson,
  opticalBenchSolverPlanJson,
  opticalBenchValidationReportJson,
  opticalBenchValidationReportMarkdown,
  redoOpticalBenchHistory,
  compareRealExternalRunToReferences,
  robustBeforeAfterMetricsCsv,
  robustCandidateTableCsv,
  robustDesignReportJson,
  robustDesignReportMarkdown,
  robustFdtdCandidateSweepManifestJson,
  robustFdtdCandidateSweepSummaryJson,
  robustRecommendationsCsv,
  robustToleranceBudgetCsv,
  runSimulationBuilderScenario,
  runRobustDesignAdvisor,
  runToleranceAnalysis,
  setOpticalBenchElementEnabled,
  simulationBuilderToFdtd2dSandbox,
  undoOpticalBenchHistory,
  simulationBuilderScenarioJson,
  simulationBuilderValidationMetricsCsv,
  simulationBuilderValidationReportJson,
  simulationBuilderValidationReportMarkdown,
  parseRealExternalRunBundleJson,
  promoteRealExternalRunToEvidenceCampaign,
  realExternalRunBundleJson,
  realExternalRunComparisonJson,
  realExternalRunMetricsCsv,
  realExternalRunPackManifestJson,
  realExternalRunPromotionJson,
  realExternalRunReproducibilityMarkdown,
  realExternalRunReproducibilityReportJson,
  realExternalRunValidationJson,
  realExternalRunWarningsJson,
  surfaceGeometryMetricsCsv,
  surfaceGeometrySceneJson,
  surfaceGeometryValidationReportJson,
  surfaceGeometryValidationReportMarkdown,
  updateOpticalBenchElementZ,
  updateOpticalBenchCustomMonitor,
  updateOpticalBenchElementProperties,
  validateApertureImportedRun,
  validateRealExternalRunBundle,
  validateOpticalBenchEditing,
  validateFdtdImportedRunAgainstScenario,
  goldenEvidenceCampaignSummaryJson,
  parseEngineeringEvidenceCampaignManifest,
  parseGoldenEvidenceCampaignSummary,
  parseRobustFdtdCandidateSweepSummary,
  parseToleranceFdtdSweepSummary,
  toleranceFailingCasesCsv,
  toleranceFdtdSweepManifestJson,
  toleranceFdtdSweepSummaryJson,
  toleranceReportJson,
  toleranceReportMarkdown,
  toleranceRunTableCsv,
  toleranceSensitivityCsv,
  validateToleranceFdtdSweepSummary,
  validateRobustFdtdCandidateSweepSummary,
  validateEngineeringEvidenceCampaign,
  type ApertureConvergenceReport,
  type ApertureScreenModel,
  type ApertureValidationExampleBundle,
  type ApertureValidationKind,
  type EngineeringEvidenceCampaignManifest,
  type EngineeringEvidenceScenarioId,
  type ApertureValidationReport,
  type FdtdBenchmarkKind,
  type FdtdConvergenceSummary,
  type FdtdFieldSlice,
  type Fdtd2dScene,
  type GoldenEvidenceCampaignSummary,
  type FdtdImportedRun,
  type FdtdValidationReport,
  type RealExternalRunBundle,
  type RealExternalRunFixtureKind,
  type RealExternalRunPromotion,
  type OpticalBenchHistoryState,
  type OpticalBenchElement,
  type OpticalBenchMonitor,
  type OpticalBenchMonitorSnapshot,
  type OpticalBenchSolverPlanRow,
  type RobustDesignAdvisorReport,
  type RobustDesignCandidate,
  type RobustDesignRankingMode,
  type RobustDesignVariablePermission,
  type RobustFdtdCandidateSweepManifest,
  type RobustFdtdCandidateSweepSummary,
  type SolverWarning,
  type SurfaceGeometryExampleBundle,
  type SurfaceGeometryKind,
  type SimulationBuilderCustomMonitor,
  type SimulationBuilderAxisNode,
  type SimulationBuilderElement,
  type SimulationBuilderElementKind,
  type SimulationBuilderGrid,
  type SimulationBuilderScenario,
  type SimulationBuilderSource,
  type SimulationBuilderTarget,
  type SimulationBuilderTargetKind,
  type ToleranceAnalysisReport,
  type ToleranceFdtdSweepManifest,
  type ToleranceFdtdSweepSummary,
  type ToleranceRunMode,
  type ToleranceThreshold,
  type ToleranceVariationProperty,
  type ToleranceVariationSpec
} from "@emmicro/core";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Copy, Eye, EyeOff, FileDown, Plus, Redo2, Sparkles, Trash2, Undo2 } from "lucide-react";

const stepLabels = [
  ["grid", "1 Grid"],
  ["source", "2 Source"],
  ["elements", "3 Elements"],
  ["target", "4 Target / Material"],
  ["compute", "5 Compute"],
  ["validate", "6 Validate"]
] as const;

const elementActions: Array<{ kind: SimulationBuilderElementKind; label: string }> = [
  { kind: "circular-aperture", label: "Add aperture" },
  { kind: "ideal-lens", label: "Add ideal lens" },
  { kind: "material-interface", label: "Add material interface" },
  { kind: "material-slab", label: "Add material slab" },
  { kind: "mirror-surface", label: "Add mirror surface" },
  { kind: "absorbing-slab", label: "Add absorbing slab" },
  { kind: "curved-material-lens", label: "Add curved glass lens" }
];

const surfaceGeometryActions: Array<{ kind: SurfaceGeometryKind; label: string }> = [
  { kind: "transparent-block", label: "Add Transparent Block" },
  { kind: "absorbing-block", label: "Add Absorbing Block" },
  { kind: "reflective-plate", label: "Add Reflective Plate" },
  { kind: "aperture-blocker", label: "Add Aperture/Blocker" },
  { kind: "tilted-wedge", label: "Add Tilted Wedge" }
];

const apertureValidationActions: Array<{ kind: ApertureValidationKind; label: string; addLabel: string; fixtureLabel: string }> = [
  { kind: "long-slit", label: "Long Slit", addLabel: "Add Long Slit", fixtureLabel: "Load Long Slit Fixture" },
  { kind: "circular-pinhole", label: "Circular Pinhole", addLabel: "Add Circular Pinhole", fixtureLabel: "Load Circular Pinhole Fixture" },
  { kind: "rectangular-aperture", label: "Rectangular Aperture", addLabel: "Add Rectangular Aperture", fixtureLabel: "Load Rectangular Aperture Fixture" },
  { kind: "opaque-blocker", label: "Opaque Blocker", addLabel: "Add Opaque Blocker", fixtureLabel: "Load Opaque Blocker Fixture" }
];

const l85BenchActions: Array<{ kind: SimulationBuilderElementKind; label: string; overrides?: Partial<SimulationBuilderElement> }> = [
  { kind: "circular-aperture", label: "Add aperture" },
  { kind: "finite-aperture-blocker", label: "Add slit", overrides: { apertureShape: "long-slit", apertureWidthUm: 3, apertureHeightUm: 14, label: "Long slit" } },
  { kind: "ideal-lens", label: "Add ideal lens" },
  { kind: "finite-transparent-block", label: "Add transparent block" },
  { kind: "finite-absorbing-block", label: "Add absorbing block" },
  { kind: "finite-reflective-plate", label: "Add reflective plate" },
  { kind: "finite-aperture-blocker", label: "Add blocker", overrides: { apertureShape: "opaque-blocker", apertureWidthUm: 2, apertureHeightUm: 6, label: "Opaque blocker" } },
  { kind: "tilted-interface-wedge", label: "Add wedge" },
  { kind: "curved-material-lens", label: "Add curved lens scaffold" }
];

type L85Selection = { kind: "element" | "monitor"; id: string };
type L85CommitOptions = {
  select?: L85Selection | null | ((previous: SimulationBuilderScenario, next: SimulationBuilderScenario) => L85Selection | null | undefined);
  scalarDirty?: boolean;
  externalDirty?: boolean;
};
type XzGeometryMode = "inspect" | "edit";
type SurfaceGeometryDragKind = "body" | "thickness-start" | "thickness-end" | "height-top" | "height-bottom";
type SurfaceGeometryDragPreview = {
  elementId: string;
  dragKind: SurfaceGeometryDragKind;
  patch: Partial<SimulationBuilderElement>;
};

function l86VariationPropertyMeta(property: ToleranceVariationProperty): { label: string; unit: ToleranceVariationSpec["unit"]; application: ToleranceVariationSpec["application"]; delta: number } {
  switch (property) {
    case "xUm":
      return { label: "x decenter", unit: "um", application: "absolute", delta: 1 };
    case "yUm":
      return { label: "y decenter", unit: "um", application: "absolute", delta: 1 };
    case "zMm":
      return { label: "z shift", unit: "mm", application: "absolute", delta: 0.05 };
    case "thicknessUm":
      return { label: "thickness tolerance", unit: "relative", application: "relative", delta: 0.02 };
    case "materialIndex":
      return { label: "material n tolerance", unit: "unitless", application: "absolute", delta: 0.02 };
    case "focalLengthMm":
      return { label: "focal length tolerance", unit: "mm", application: "absolute", delta: 0.5 };
    case "orientationDeg":
      return { label: "tilt tolerance", unit: "deg", application: "absolute", delta: 0.5 };
    case "widthUm":
      return { label: "width tolerance", unit: "relative", application: "relative", delta: 0.02 };
    case "heightUm":
      return { label: "height tolerance", unit: "relative", application: "relative", delta: 0.02 };
    case "absorptionCoefficientPerM":
      return { label: "absorption tolerance", unit: "relative", application: "relative", delta: 0.05 };
    case "wavelengthNm":
      return { label: "wavelength tolerance", unit: "nm", application: "absolute", delta: 5 };
    case "sourceIntensityScale":
      return { label: "source intensity metadata", unit: "relative", application: "relative", delta: 0.05 };
    default:
      return { label: property, unit: "unitless", application: "absolute", delta: 1 };
  }
}

function downloadText(filename: string, mime: string, text: string): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function initialL85Selection(): L85Selection {
  const firstElement = defaultOpticalBenchScenario().elements[0];
  return { kind: "element", id: firstElement?.id ?? "source" };
}

export function SimulationBuilderPanel(props: { onExportSandboxScene?: (scene: Fdtd2dScene) => void } = {}) {
  const [scenario, setScenario] = useState<SimulationBuilderScenario>(() => defaultOpticalBenchScenario());
  const [selectedL85, setSelectedL85] = useState<L85Selection>(() => initialL85Selection());
  const [l85SnapStepMm, setL85SnapStepMm] = useState(0.5);
  const [xzGeometryMode, setXzGeometryMode] = useState<XzGeometryMode>("inspect");
  const [l85History, setL85History] = useState<OpticalBenchHistoryState>(() => createOpticalBenchHistory(defaultOpticalBenchScenario()));
  const [hasComputed, setHasComputed] = useState(false);
  const [hasL85ScalarPreview, setHasL85ScalarPreview] = useState(true);
  const [hasL85ExternalEvidence, setHasL85ExternalEvidence] = useState(true);
  const [l86Mode, setL86Mode] = useState<ToleranceRunMode>("one-at-a-time");
  const [l86Variations, setL86Variations] = useState<ToleranceVariationSpec[]>(() => defaultToleranceVariationSpecs(defaultOpticalBenchScenario()));
  const [l86Thresholds, setL86Thresholds] = useState<ToleranceThreshold[]>(() => defaultToleranceThresholds());
  const [l86FdtdSummary, setL86FdtdSummary] = useState<ToleranceFdtdSweepSummary | null>(null);
  const [l86FdtdImportError, setL86FdtdImportError] = useState<string | null>(null);
  const [l87RankingMode, setL87RankingMode] = useState<RobustDesignRankingMode>("weighted");
  const [l87Permissions, setL87Permissions] = useState<RobustDesignVariablePermission[]>([]);
  const [l87FdtdSummary, setL87FdtdSummary] = useState<RobustFdtdCandidateSweepSummary | null>(null);
  const [l87FdtdImportError, setL87FdtdImportError] = useState<string | null>(null);
  const [l88Manifest, setL88Manifest] = useState<EngineeringEvidenceCampaignManifest>(() => createEngineeringEvidenceCampaignManifest());
  const [l88Summary, setL88Summary] = useState<GoldenEvidenceCampaignSummary | null>(null);
  const [l88ImportError, setL88ImportError] = useState<string | null>(null);
  const [l89RunBundle, setL89RunBundle] = useState<RealExternalRunBundle | null>(null);
  const [l89Promotion, setL89Promotion] = useState<RealExternalRunPromotion | null>(null);
  const [l89ImportError, setL89ImportError] = useState<string | null>(null);
  const [importedFdtd, setImportedFdtd] = useState<FdtdImportedRun | null>(null);
  const [fdtdImportError, setFdtdImportError] = useState<string | null>(null);
  const [benchmarkKind, setBenchmarkKind] = useState<FdtdBenchmarkKind>("transparent-interface");
  const [hasGeneratedBenchmarkPlan, setHasGeneratedBenchmarkPlan] = useState(true);
  const [fdtdConvergence, setFdtdConvergence] = useState<FdtdConvergenceSummary | null>(null);
  const [fdtdConvergenceError, setFdtdConvergenceError] = useState<string | null>(null);
  const [surfaceGeometryKind, setSurfaceGeometryKind] = useState<SurfaceGeometryKind>("transparent-block");
  const [surfaceGeometryExample, setSurfaceGeometryExample] = useState<SurfaceGeometryExampleBundle | null>(null);
  const [apertureKind, setApertureKind] = useState<ApertureValidationKind>("long-slit");
  const [apertureScreenModel, setApertureScreenModel] = useState<ApertureScreenModel>("absorbing-screen");
  const [apertureExample, setApertureExample] = useState<ApertureValidationExampleBundle | null>(null);
  const [apertureReport, setApertureReport] = useState<ApertureValidationReport | null>(null);
  const [apertureFieldSlice, setApertureFieldSlice] = useState<FdtdFieldSlice | null>(null);
  const [apertureImportError, setApertureImportError] = useState<string | null>(null);
  const result = useMemo(() => runSimulationBuilderScenario(scenario), [scenario]);
  const l85Bundle = useMemo(() => createOpticalBenchBundle(scenario), [scenario]);
  const fdtdBundle = useMemo(() => exportFdtdBundleFromSimulationBuilder(scenario), [scenario]);
  const fdtd2dHandoff = useMemo(() => simulationBuilderToFdtd2dSandbox(scenario), [scenario]);
  const l89RunPack = useMemo(() => createRealExternalRunPack(scenario), [scenario]);
  const fdtdBenchmarkPack = useMemo(() => createFdtdBenchmarkPack({ benchmarkKind, scenario }), [benchmarkKind, scenario]);
  const surfaceGeometryScene = useMemo(() => surfaceGeometryExample?.scene ?? createSurfaceGeometryScene(scenario), [scenario, surfaceGeometryExample]);
  const surfaceGeometryConvergencePack = useMemo(() => createSurfaceGeometryConvergencePack(surfaceGeometryScene.kind), [surfaceGeometryScene.kind]);
  const apertureScene = useMemo(
    () => apertureExample?.scene ?? (hasApertureValidationElement(scenario) ? createApertureValidationScene(scenario, apertureScreenModel) : createApertureValidationScene(apertureKind, apertureScreenModel)),
    [apertureExample, apertureKind, apertureScreenModel, scenario]
  );
  const apertureConvergence = useMemo<ApertureConvergenceReport>(() => apertureReport?.convergence ?? apertureExample?.validation.convergence ?? createApertureConvergenceReport(apertureScene.kind), [apertureExample, apertureReport, apertureScene.kind]);
  const activeApertureReport = apertureReport ?? apertureExample?.validation ?? null;
  const activeApertureFieldSlice = apertureFieldSlice ?? apertureExample?.fieldSlice ?? null;
  const fdtdValidation = useMemo<FdtdValidationReport | null>(
    () => (importedFdtd ? validateFdtdImportedRunAgainstScenario(scenario, fdtdBundle, importedFdtd) : null),
    [fdtdBundle, importedFdtd, scenario]
  );
  const l89Validation = useMemo(
    () => (l89RunBundle ? validateRealExternalRunBundle(scenario, l89RunPack, l89RunBundle) : null),
    [l89RunBundle, l89RunPack, scenario]
  );
  const l89Comparison = useMemo(
    () => (l89RunBundle && l89Validation ? compareRealExternalRunToReferences(l89RunPack, l89RunBundle, l89Validation) : null),
    [l89RunBundle, l89RunPack, l89Validation]
  );
  const activeL89Promotion = l89Promotion && l89Comparison && l89Promotion.receipts.comparisonHash === l89Comparison.comparisonHash ? l89Promotion : null;
  const l89Report = useMemo(
    () => createRealExternalRunReproducibilityReport(l89RunPack, l89RunBundle, l89Validation, l89Comparison, activeL89Promotion),
    [activeL89Promotion, l89Comparison, l89RunBundle, l89RunPack, l89Validation]
  );
  const l85Snap = useMemo(() => ({ enabled: l85SnapStepMm > 0, stepMm: l85SnapStepMm }), [l85SnapStepMm]);
  const l85EditingWarnings = useMemo(() => validateOpticalBenchEditing(scenario), [scenario]);
  const l85EditingBlocked = useMemo(() => isOpticalBenchEditingBlocked(l85EditingWarnings), [l85EditingWarnings]);
  const selectedL85Element = selectedL85.kind === "element" ? scenario.elements.find((element) => element.id === selectedL85.id) ?? null : null;
  const selectedL85SceneElement = selectedL85.kind === "element" ? l85Bundle.scene.elements.find((element) => element.id === selectedL85.id) ?? null : null;
  const selectedL85Monitor = selectedL85.kind === "monitor" ? l85Bundle.scene.monitors.find((monitor) => monitor.id === selectedL85.id) ?? null : null;
  const selectedL85CustomMonitor = selectedL85.kind === "monitor" ? (scenario.customMonitors ?? []).find((monitor) => monitor.id === selectedL85.id) ?? null : null;
  const editableL85MonitorIds = useMemo(() => new Set(["observation-plane", ...(scenario.customMonitors ?? []).map((monitor) => monitor.id)]), [scenario.customMonitors]);
  const l86Report = useMemo(
    () => runToleranceAnalysis(scenario, {
      variations: l86Variations,
      thresholds: l86Thresholds,
      selectedMetrics: [...defaultToleranceMetrics],
      mode: l86Mode,
      gridMaxRuns: 27,
      seededSamples: 12,
      seed: 860
    }),
    [l86Mode, l86Thresholds, l86Variations, scenario]
  );
  const l86SweepManifest = useMemo(
    () => createToleranceFdtdSweepManifest(scenario, {
      variations: l86Variations,
      thresholds: l86Thresholds,
      selectedMetrics: [...defaultToleranceMetrics],
      mode: "deterministic-grid",
      gridMaxRuns: 18
    }),
    [l86Thresholds, l86Variations, scenario]
  );
  const l86FdtdWarnings = useMemo(() => (l86FdtdSummary ? validateToleranceFdtdSweepSummary(l86SweepManifest, l86FdtdSummary) : []), [l86FdtdSummary, l86SweepManifest]);
  const l87Report = useMemo(
    () => runRobustDesignAdvisor(scenario, {
      baselineReport: l86Report,
      variations: l86Variations,
      thresholds: l86Thresholds,
      rankingMode: l87RankingMode,
      permissions: l87Permissions,
      gridMaxRuns: 8,
      candidateLimit: 6
    }),
    [l86Report, l86Thresholds, l86Variations, l87Permissions, l87RankingMode, scenario]
  );
  const l87FdtdManifest = useMemo(() => createRobustFdtdCandidateSweepManifest(l87Report, 8), [l87Report]);
  const l87FdtdWarnings = useMemo(() => (l87FdtdSummary ? validateRobustFdtdCandidateSweepSummary(l87FdtdManifest, l87FdtdSummary) : []), [l87FdtdManifest, l87FdtdSummary]);
  const l88Warnings = useMemo(() => (l88Summary ? validateEngineeringEvidenceCampaign(l88Manifest, l88Summary) : []), [l88Manifest, l88Summary]);
  const zMin = Math.min(scenario.grid.zStartMm, ...result.axis.map((node) => node.zMm));
  const zMax = Math.max(scenario.observationPlaneZMm, scenario.grid.zEndMm, ...result.axis.map((node) => node.zMm));

  function updateGrid<K extends keyof SimulationBuilderGrid>(key: K, value: SimulationBuilderGrid[K]): void {
    setScenario((current) => ({ ...current, grid: { ...current.grid, [key]: value } }));
  }

  function updateSource<K extends keyof SimulationBuilderSource>(key: K, value: SimulationBuilderSource[K]): void {
    setScenario((current) => ({ ...current, source: { ...current.source, [key]: value } }));
  }

  function updateTarget<K extends keyof SimulationBuilderTarget>(key: K, value: SimulationBuilderTarget[K]): void {
    setScenario((current) => ({ ...current, target: { ...current.target, [key]: value } }));
  }

  function setTargetKind(kind: SimulationBuilderTargetKind): void {
    setScenario((current) => ({ ...current, target: targetForKind(kind, current.target.zMm) }));
  }

  function addElement(kind: SimulationBuilderElementKind): void {
    const nextZ = Math.min(scenario.observationPlaneZMm - 1, Math.max(...scenario.elements.map((element) => element.zMm), scenario.source.zMm) + 3);
    const labelSuffix = scenario.elements.filter((element) => element.kind === kind).length + 1;
    setScenario((current) => addSimulationBuilderElement(current, createSimulationBuilderElement(kind, nextZ, `${elementButtonLabel(kind)} ${labelSuffix}`)));
    setSurfaceGeometryExample(null);
  }

  function addSurfaceGeometry(kind: SurfaceGeometryKind): void {
    const nextZ = Math.min(scenario.observationPlaneZMm - 1, Math.max(...scenario.elements.map((element) => element.zMm), scenario.source.zMm) + 3);
    const labelSuffix = scenario.elements.filter((element) => isSurfaceGeometryElementKind(element.kind)).length + 1;
    setSurfaceGeometryKind(kind);
    setSurfaceGeometryExample(null);
    setScenario((current) => addSimulationBuilderElement(current, { ...createSurfaceGeometryElement(kind, nextZ), id: `l83-${kind}-${labelSuffix}`, label: `${surfaceGeometryDisplayName(kind)} ${labelSuffix}` }));
  }

  function commitL85Edit(label: string, updater: (current: SimulationBuilderScenario) => SimulationBuilderScenario, options: L85CommitOptions = {}): void {
    const current = scenario;
    const next = updater(current);
    if (JSON.stringify(next) === JSON.stringify(current)) return;
    setScenario(next);
    setL85History((history) => commitOpticalBenchHistory({ ...history, present: current }, next, label));
    if (options.select !== undefined) {
      const selection = typeof options.select === "function" ? options.select(current, next) : options.select;
      if (selection) setSelectedL85(selection);
    }
    if (options.scalarDirty !== false) setHasL85ScalarPreview(false);
    if (options.externalDirty !== false) setHasL85ExternalEvidence(false);
    setSurfaceGeometryExample(null);
    clearApertureEvidence();
    setL89Promotion(null);
  }

  function resetL85Bench(): void {
    const next = defaultOpticalBenchScenario();
    setScenario(next);
    setL85History(createOpticalBenchHistory(next));
    setSelectedL85(initialL85Selection());
    setL86Variations(defaultToleranceVariationSpecs(next));
    setL86Thresholds(defaultToleranceThresholds());
    setL86FdtdSummary(null);
    setL86FdtdImportError(null);
    setL87Permissions([]);
    setL87FdtdSummary(null);
    setL87FdtdImportError(null);
    setHasComputed(true);
    setHasL85ScalarPreview(true);
    setHasL85ExternalEvidence(true);
    setSurfaceGeometryExample(null);
    setL89RunBundle(null);
    setL89Promotion(null);
    setL89ImportError(null);
    clearApertureEvidence();
  }

  function addL85BenchElement(action: { kind: SimulationBuilderElementKind; label: string; overrides?: Partial<SimulationBuilderElement> }): void {
    commitL85Edit("Add optical bench element", (current) => {
      const nextZ = Math.min(current.grid.zEndMm - 1, Math.max(current.source.zMm, current.target.zMm - 2, ...current.elements.map((element) => element.zMm)) + 5);
      const labelSuffix = current.elements.filter((element) => element.kind === action.kind).length + 1;
      const label = action.overrides?.label ? `${action.overrides.label} ${labelSuffix}` : `${elementButtonLabel(action.kind)} ${labelSuffix}`;
      const element = {
        ...createSimulationBuilderElement(action.kind, nextZ, label),
        ...action.overrides,
        id: `l85-${action.kind}-${labelSuffix}-${Math.round(nextZ * 1000)}`,
        label
      };
      return addSimulationBuilderElement(current, element);
    }, {
      select: (previous, next) => {
        const added = next.elements.find((element) => !previous.elements.some((oldElement) => oldElement.id === element.id));
        return added ? { kind: "element", id: added.id } : null;
      },
      scalarDirty: false
    });
  }

  function duplicateL85Element(elementId: string): void {
    commitL85Edit("Duplicate optical bench element", (current) => duplicateOpticalBenchElement(current, elementId), {
      select: (previous, next) => {
        const duplicate = next.elements.find((element) => !previous.elements.some((oldElement) => oldElement.id === element.id));
        return duplicate ? { kind: "element", id: duplicate.id } : null;
      }
    });
  }

  function deleteL85Element(elementId: string): void {
    commitL85Edit("Delete optical bench element", (current) => deleteOpticalBenchElement(current, elementId), {
      select: (_previous, next) => (next.elements[0] ? { kind: "element", id: next.elements[0].id } : null)
    });
  }

  function toggleL85Element(element: OpticalBenchElement): void {
    commitL85Edit(`${element.enabled ? "Disable" : "Enable"} optical bench element`, (current) => setOpticalBenchElementEnabled(current, element.id, !element.enabled), {
      select: { kind: "element", id: element.id }
    });
  }

  function updateL85ElementZ(elementId: string, value: number): void {
    commitL85Edit("Move optical bench element", (current) => updateOpticalBenchElementZ(current, elementId, value), {
      select: { kind: "element", id: elementId }
    });
  }

  function addL85ObservationMonitor(): void {
    commitL85Edit("Move observation monitor", (current) => ({
      ...current,
      observationPlaneZMm: Math.min(current.grid.zEndMm, Math.max(current.observationPlaneZMm + 5, ...current.elements.map((element) => element.zMm + 2)))
    }), {
      select: { kind: "monitor", id: "observation-plane" },
      externalDirty: false
    });
  }

  function updateL85ElementPatch(elementId: string, patch: Partial<SimulationBuilderElement>, label = "Edit optical bench element"): void {
    commitL85Edit(label, (current) => updateOpticalBenchElementProperties(current, elementId, patch), {
      select: { kind: "element", id: elementId }
    });
  }

  function moveL85ElementOrder(elementId: string, direction: "earlier" | "later"): void {
    commitL85Edit(`Move element ${direction}`, (current) => moveOpticalBenchElementInOrder(current, elementId, direction), {
      select: { kind: "element", id: elementId }
    });
  }

  function nudgeL85Selection(delta: { zMm?: number; xUm?: number }): void {
    if (selectedL85.kind === "element") {
      commitL85Edit("Nudge optical bench element", (current) => nudgeOpticalBenchElement(current, selectedL85.id, delta, l85Snap), {
        select: selectedL85
      });
      return;
    }
    if (selectedL85.id === "observation-plane") {
      commitL85Edit("Nudge observation monitor", (current) => ({
        ...current,
        observationPlaneZMm: clampNumber(current.observationPlaneZMm + (delta.zMm ?? 0), current.grid.zStartMm, current.grid.zEndMm)
      }), {
        select: selectedL85,
        externalDirty: false
      });
      return;
    }
    if (selectedL85CustomMonitor) {
      commitL85Edit("Nudge custom monitor", (current) => updateOpticalBenchCustomMonitor(current, selectedL85.id, {
        zMm: clampNumber(selectedL85CustomMonitor.zMm + (delta.zMm ?? 0), current.grid.zStartMm, current.grid.zEndMm),
        xUm: selectedL85CustomMonitor.xUm + (delta.xUm ?? 0)
      }), {
        select: selectedL85
      });
    }
  }

  function addL85MonitorAround(elementId: string, placement: "before" | "after"): void {
    commitL85Edit(`Add monitor ${placement} element`, (current) => addOpticalBenchCustomMonitor(current, elementId, placement), {
      select: (previous, next) => {
        const added = (next.customMonitors ?? []).find((monitor) => !(previous.customMonitors ?? []).some((oldMonitor) => oldMonitor.id === monitor.id));
        return added ? { kind: "monitor", id: added.id } : null;
      }
    });
  }

  function updateL85MonitorPatch(monitorId: string, patch: Partial<SimulationBuilderCustomMonitor>): void {
    if (monitorId === "observation-plane") {
      commitL85Edit("Edit observation monitor", (current) => ({
        ...current,
        observationPlaneZMm: patch.zMm ?? current.observationPlaneZMm
      }), {
        select: { kind: "monitor", id: monitorId },
        externalDirty: false
      });
      return;
    }
    commitL85Edit("Edit custom monitor", (current) => updateOpticalBenchCustomMonitor(current, monitorId, patch), {
      select: { kind: "monitor", id: monitorId }
    });
  }

  function deleteL85Monitor(monitorId: string): void {
    if (monitorId === "observation-plane") return;
    commitL85Edit("Delete custom monitor", (current) => deleteOpticalBenchCustomMonitor(current, monitorId), {
      select: { kind: "monitor", id: "observation-plane" }
    });
  }

  function commitL85DiagramPosition(selection: L85Selection, position: { zMm: number; xUm?: number }): void {
    if (selection.kind === "element") {
      const patch: Partial<SimulationBuilderElement> = { zMm: snapOpticalBenchValue(position.zMm) };
      if (position.xUm !== undefined) patch.xUm = position.xUm;
      commitL85Edit("Drag optical bench element", (current) => updateOpticalBenchElementProperties(current, selection.id, patch), {
        select: selection
      });
      return;
    }
    updateL85MonitorPatch(selection.id, { zMm: snapOpticalBenchValue(position.zMm), xUm: position.xUm });
  }

  function commitOpticalAxisNodePosition(node: SimulationBuilderAxisNode, zMm: number): void {
    const nextZ = clampNumber(snapOpticalBenchValue(zMm), scenario.grid.zStartMm, scenario.grid.zEndMm);
    if (node.kind === "element") {
      commitL85Edit("Drag optical axis element z-only", (current) => updateOpticalBenchElementProperties(current, node.id, { zMm: nextZ }), {
        select: { kind: "element", id: node.id }
      });
      return;
    }
    if (node.kind === "observation") {
      commitL85Edit("Drag optical axis observation z-only", (current) => ({
        ...current,
        observationPlaneZMm: nextZ
      }), {
        select: { kind: "monitor", id: "observation-plane" },
        externalDirty: false
      });
      return;
    }
    if (node.kind === "source") {
      commitL85Edit("Drag optical axis source z-only", (current) => ({
        ...current,
        source: { ...current.source, zMm: nextZ }
      }));
      return;
    }
    if (node.kind === "target") {
      commitL85Edit("Drag optical axis target z-only", (current) => ({
        ...current,
        target: { ...current.target, zMm: nextZ }
      }));
    }
  }

  function commitSurfaceGeometryEdit(elementId: string, patch: Partial<SimulationBuilderElement>, label = "Edit finite surface geometry"): void {
    const normalized: Partial<SimulationBuilderElement> = { ...patch };
    if (normalized.zMm !== undefined) normalized.zMm = clampNumber(snapOpticalBenchValue(normalized.zMm), scenario.grid.zStartMm, scenario.grid.zEndMm);
    if (normalized.widthUm !== undefined) normalized.widthUm = Math.max(0.05, normalized.widthUm);
    if (normalized.heightUm !== undefined) normalized.heightUm = Math.max(0.05, normalized.heightUm);
    if (normalized.thicknessUm !== undefined) normalized.thicknessUm = Math.max(0.05, normalized.thicknessUm);
    if (normalized.apertureWidthUm !== undefined) normalized.apertureWidthUm = Math.max(0.05, normalized.apertureWidthUm);
    if (normalized.apertureHeightUm !== undefined) normalized.apertureHeightUm = Math.max(0.05, normalized.apertureHeightUm);
    commitL85Edit(label, (current) => updateOpticalBenchElementProperties(current, elementId, normalized), {
      select: { kind: "element", id: elementId }
    });
  }

  function undoL85Edit(): void {
    const next = undoOpticalBenchHistory({ ...l85History, present: scenario });
    if (JSON.stringify(next.present) === JSON.stringify(scenario)) return;
    setScenario(next.present);
    setL85History(next);
    setHasL85ScalarPreview(false);
    setHasL85ExternalEvidence(false);
  }

  function redoL85Edit(): void {
    const next = redoOpticalBenchHistory({ ...l85History, present: scenario });
    if (JSON.stringify(next.present) === JSON.stringify(scenario)) return;
    setScenario(next.present);
    setL85History(next);
    setHasL85ScalarPreview(false);
    setHasL85ExternalEvidence(false);
  }

  function exportL85SelectedJson(): void {
    if (selectedL85.kind === "element" && selectedL85Element) {
      downloadText(`${selectedL85Element.id}.json`, "application/json", `${JSON.stringify(selectedL85Element, null, 2)}\n`);
      return;
    }
    if (selectedL85.kind === "monitor" && selectedL85Monitor) {
      downloadText(`${selectedL85Monitor.id}.json`, "application/json", `${JSON.stringify(selectedL85Monitor, null, 2)}\n`);
    }
  }

  function snapOpticalBenchValue(valueMm: number): number {
    return l85Snap.enabled ? Math.round(valueMm / l85Snap.stepMm) * l85Snap.stepMm : valueMm;
  }

  function exportL85Scene(): void {
    if (l85EditingBlocked) return;
    downloadText("multielement_scene.json", "application/json", opticalBenchSceneJson(l85Bundle.scene));
    downloadText("solver_plan.json", "application/json", opticalBenchSolverPlanJson(l85Bundle.solverPlan));
    downloadText("monitor_stack.csv", "text/csv", `${opticalBenchMonitorStackCsv(l85Bundle.scalarPreview)}\n`);
  }

  function exportL85ExternalFdtdChain(): void {
    if (l85EditingBlocked) return;
    downloadText("multielement_fdtd_scene_manifest.json", "application/json", fdtdManifestJson(l85Bundle.fdtdBundle.manifest));
    downloadText("multielement_meep.py", "text/x-python", fdtdMeepScriptText(l85Bundle.fdtdBundle.script));
    downloadText("multielement_fixture_receipt.json", "application/json", JSON.stringify(l85Bundle.externalEvidence.receipt, null, 2));
    downloadText("multielement_fixture_flux_summary.json", "application/json", JSON.stringify(l85Bundle.externalEvidence.flux, null, 2));
    downloadText("multielement_fixture_field_slice_xz.csv", "text/csv", `${l85Bundle.externalEvidence.fieldSliceCsv}\n`);
  }

  function exportL90SandboxSlice(): void {
    downloadText("fdtd2d_sandbox_scene.json", "application/json", `${JSON.stringify(fdtd2dHandoff.scene, null, 2)}\n`);
    downloadText("fdtd2d_sandbox_handoff.json", "application/json", `${JSON.stringify(fdtd2dHandoff, null, 2)}\n`);
    props.onExportSandboxScene?.(fdtd2dHandoff.scene);
  }

  function exportL85ValidationReport(): void {
    if (l85EditingBlocked) return;
    downloadText("multielement_validation_report.md", "text/markdown", `${opticalBenchValidationReportMarkdown(l85Bundle.validationReport)}\n`);
    downloadText("multielement_validation_report.json", "application/json", opticalBenchValidationReportJson(l85Bundle.validationReport));
    downloadText("multielement_metrics.csv", "text/csv", `${opticalBenchMetricsCsv(l85Bundle.validationReport)}\n`);
  }

  function resetL86Variations(): void {
    setL86Variations(defaultToleranceVariationSpecs(scenario));
    setL86Thresholds(defaultToleranceThresholds());
    setL86FdtdSummary(null);
    setL86FdtdImportError(null);
    setL87Permissions([]);
    setL87FdtdSummary(null);
    setL87FdtdImportError(null);
  }

  function updateL86VariationDelta(specId: string, delta: number): void {
    setL86Variations((current) => current.map((spec) => spec.id === specId && spec.model.kind === "plus-minus" ? { ...spec, model: { ...spec.model, delta: Math.max(0, delta) } } : spec));
    setL86FdtdSummary(null);
  }

  function toggleL86Variation(specId: string): void {
    setL86Variations((current) => current.map((spec) => spec.id === specId ? { ...spec, enabled: !spec.enabled } : spec));
    setL86FdtdSummary(null);
  }

  function updateL86Threshold(thresholdId: string, value: number): void {
    setL86Thresholds((current) => current.map((threshold) => threshold.id === thresholdId ? { ...threshold, pass: value } : threshold));
  }

  function toggleL86Threshold(thresholdId: string): void {
    setL86Thresholds((current) => current.map((threshold) => threshold.id === thresholdId ? { ...threshold, enabled: !threshold.enabled } : threshold));
  }

  function addL86SourceWavelengthVariation(): void {
    const count = l86Variations.filter((spec) => spec.targetKind === "source" && spec.property === "wavelengthNm").length + 1;
    setL86Variations((current) => [
      ...current,
      {
        id: `l86-source-wavelength-${count}`,
        label: `Source wavelength tolerance ${count}`,
        targetKind: "source",
        targetId: "source",
        property: "wavelengthNm",
        unit: "nm",
        application: "absolute",
        model: { kind: "plus-minus", delta: 5, includeNominal: true },
        enabled: true
      }
    ]);
    setL86FdtdSummary(null);
  }

  function addL86SelectedVariation(property: ToleranceVariationProperty): void {
    if (!selectedL85Element) return;
    const meta = l86VariationPropertyMeta(property);
    const count = l86Variations.filter((spec) => spec.targetId === selectedL85Element.id && spec.property === property).length + 1;
    setL86Variations((current) => [
      ...current,
      {
        id: `l86-${selectedL85Element.id}-${property}-${count}`,
        label: `${selectedL85Element.label} ${meta.label} ${count}`,
        targetKind: "element",
        targetId: selectedL85Element.id,
        property,
        unit: meta.unit,
        application: meta.application,
        model: { kind: "plus-minus", delta: meta.delta, includeNominal: true },
        enabled: true
      }
    ]);
    setL86FdtdSummary(null);
  }

  function exportL86ToleranceReport(): void {
    downloadText("tolerance_report.md", "text/markdown", `${toleranceReportMarkdown(l86Report, l86FdtdSummary)}\n`);
    downloadText("tolerance_report.json", "application/json", toleranceReportJson(l86Report));
    downloadText("tolerance_run_table.csv", "text/csv", `${toleranceRunTableCsv(l86Report)}\n`);
    downloadText("tolerance_sensitivity.csv", "text/csv", `${toleranceSensitivityCsv(l86Report)}\n`);
    downloadText("failing_cases.csv", "text/csv", `${toleranceFailingCasesCsv(l86Report)}\n`);
  }

  function exportL86FdtdSweepPack(): void {
    const summary = createExampleToleranceFdtdSweepSummary(l86SweepManifest);
    downloadText("fdtd_variation_sweep_manifest.json", "application/json", toleranceFdtdSweepManifestJson(l86SweepManifest));
    downloadText("fdtd_variation_sweep_fixture_summary.json", "application/json", toleranceFdtdSweepSummaryJson(summary));
  }

  function importL86BundledFdtdSummary(): void {
    setL86FdtdSummary(createExampleToleranceFdtdSweepSummary(l86SweepManifest));
    setL86FdtdImportError(null);
  }

  async function handleL86FdtdSummaryFiles(files: FileList | null): Promise<void> {
    const file = files?.[0];
    if (!file) return;
    try {
      setL86FdtdSummary(parseToleranceFdtdSweepSummary(await file.text()));
      setL86FdtdImportError(null);
    } catch (error) {
      setL86FdtdImportError(error instanceof Error ? error.message : String(error));
    }
  }

  function updateL87Permission(specId: string, patch: Partial<RobustDesignVariablePermission>): void {
    setL87Permissions((current) => {
      const existing = current.find((permission) => permission.specId === specId);
      if (existing) return current.map((permission) => permission.specId === specId ? { ...permission, ...patch } : permission);
      return [...current, { specId, ...patch }];
    });
    setL87FdtdSummary(null);
  }

  function resetL87Permissions(): void {
    setL87Permissions([]);
    setL87FdtdSummary(null);
    setL87FdtdImportError(null);
  }

  function applyL87Candidate(candidate: RobustDesignCandidate): void {
    commitL85Edit(`Apply ${candidate.label}`, () => candidate.scenario, {
      select: selectedL85,
      scalarDirty: true,
      externalDirty: true
    });
    setL86Variations(candidate.variations);
    setL86Thresholds(candidate.thresholds);
    setL86FdtdSummary(null);
    setL86FdtdImportError(null);
    setL87FdtdSummary(null);
    setL87FdtdImportError(null);
  }

  function exportL87RobustDesignReport(): void {
    downloadText("robust_design_report.md", "text/markdown", `${robustDesignReportMarkdown(l87Report, l87FdtdSummary)}\n`);
    downloadText("robust_design_report.json", "application/json", robustDesignReportJson(l87Report));
    downloadText("candidate_table.csv", "text/csv", `${robustCandidateTableCsv(l87Report)}\n`);
    downloadText("recommendations.csv", "text/csv", `${robustRecommendationsCsv(l87Report)}\n`);
    downloadText("before_after_metrics.csv", "text/csv", `${robustBeforeAfterMetricsCsv(l87Report)}\n`);
    downloadText("tolerance_budget.csv", "text/csv", `${robustToleranceBudgetCsv(l87Report)}\n`);
  }

  function exportL87FdtdCandidateSweepPack(): void {
    const summary = createExampleRobustFdtdCandidateSweepSummary(l87FdtdManifest);
    downloadText("fdtd_candidate_sweep_manifest.json", "application/json", robustFdtdCandidateSweepManifestJson(l87FdtdManifest));
    downloadText("candidate_sweep_summary_fixture.json", "application/json", robustFdtdCandidateSweepSummaryJson(summary));
  }

  function importL87BundledFdtdSummary(): void {
    setL87FdtdSummary(createExampleRobustFdtdCandidateSweepSummary(l87FdtdManifest));
    setL87FdtdImportError(null);
  }

  async function handleL87FdtdSummaryFiles(files: FileList | null): Promise<void> {
    const file = files?.[0];
    if (!file) return;
    try {
      setL87FdtdSummary(parseRobustFdtdCandidateSweepSummary(await file.text()));
      setL87FdtdImportError(null);
    } catch (error) {
      setL87FdtdImportError(error instanceof Error ? error.message : String(error));
    }
  }

  function loadL88BundledCampaign(): void {
    const bundle = createEngineeringEvidenceCampaignBundle();
    setL88Manifest(bundle.manifest);
    setL88Summary(bundle.summary);
    setL88ImportError(null);
  }

  function exportL88EngineerReviewDossier(): void {
    const bundle = l88Summary ? { manifest: l88Manifest, summary: l88Summary } : createEngineeringEvidenceCampaignBundle();
    downloadText("campaign_manifest.json", "application/json", engineeringEvidenceCampaignManifestJson(bundle.manifest));
    downloadText("golden_campaign_summary.json", "application/json", goldenEvidenceCampaignSummaryJson(bundle.summary));
    downloadText("engineering_evidence_dossier.md", "text/markdown", `${engineeringEvidenceDossierMarkdown(bundle.summary)}\n`);
    downloadText("engineering_evidence_dossier.json", "application/json", engineeringEvidenceDossierJson(bundle.summary));
    downloadText("scenario_summary.csv", "text/csv", `${engineeringEvidenceScenarioSummaryCsv(bundle.summary)}\n`);
    downloadText("convergence_summary.csv", "text/csv", `${engineeringEvidenceConvergenceSummaryCsv(bundle.summary)}\n`);
    downloadText("tolerance_summary.csv", "text/csv", `${engineeringEvidenceToleranceSummaryCsv(bundle.summary)}\n`);
    downloadText("robust_candidate_summary.csv", "text/csv", `${engineeringEvidenceRobustCandidateSummaryCsv(bundle.summary)}\n`);
    downloadText("capability_truth_table.csv", "text/csv", `${engineeringEvidenceCapabilityTruthTableCsv(bundle.summary)}\n`);
    downloadText("unsupported_items.csv", "text/csv", `${engineeringEvidenceUnsupportedItemsCsv(bundle.summary)}\n`);
  }

  async function handleL88CampaignFiles(files: FileList | null): Promise<void> {
    if (!files || files.length === 0) return;
    try {
      let nextManifest: EngineeringEvidenceCampaignManifest | null = null;
      let nextSummary: GoldenEvidenceCampaignSummary | null = null;
      const entries = await Promise.all(Array.from(files).map(async (file) => ({ name: file.name.toLowerCase(), text: await file.text() })));
      for (const entry of entries) {
        const parsed = JSON.parse(entry.text) as { schema?: string };
        if (parsed.schema === "emmicro.l88.evidenceCampaignManifest.v1") nextManifest = parseEngineeringEvidenceCampaignManifest(entry.text);
        if (parsed.schema === "emmicro.l88.goldenCampaignSummary.v1") nextSummary = parseGoldenEvidenceCampaignSummary(entry.text);
      }
      if (!nextManifest && !nextSummary) throw new Error("Import campaign_manifest.json and/or golden_campaign_summary.json.");
      setL88Manifest(nextManifest ?? l88Manifest);
      setL88Summary(nextSummary ?? l88Summary);
      setL88ImportError(null);
    } catch (error) {
      setL88ImportError(error instanceof Error ? error.message : String(error));
    }
  }

  function exportL89RunPack(): void {
    downloadText("l89_run_pack_manifest.json", "application/json", realExternalRunPackManifestJson(l89RunPack));
    for (const file of l89RunPack.files) {
      downloadText(file.path, file.mime, file.text);
    }
  }

  function loadL89Fixture(kind: RealExternalRunFixtureKind): void {
    const fixture = createRealExternalRunFixture(kind);
    setScenario(fixture.scenario);
    setL89RunBundle(fixture.bundle);
    setL89Promotion(fixture.promotion.accepted ? fixture.promotion : null);
    setImportedFdtd(fixture.bundle.imported);
    setFdtdImportError(null);
    setL89ImportError(null);
    setHasComputed(true);
  }

  async function importL89RunFiles(files: FileList | null): Promise<void> {
    setL89ImportError(null);
    if (!files || files.length === 0) return;
    const entries = await Promise.all(Array.from(files).map(async (file) => ({ name: file.name.toLowerCase(), text: await file.text() })));
    const bundleJson = entries.find((entry) => entry.name.includes("real_run_bundle") && entry.name.endsWith(".json"));
    try {
      if (bundleJson) {
        const bundle = parseRealExternalRunBundleJson(bundleJson.text);
        setL89RunBundle(bundle);
        setImportedFdtd(bundle.imported);
        setL89Promotion(null);
        setHasComputed(true);
        return;
      }
      const receipt = entries.find((entry) => entry.name.includes("receipt") && entry.name.endsWith(".json"));
      const flux = entries.find((entry) => entry.name.includes("flux") && entry.name.endsWith(".json"));
      const fieldSlice = entries.find((entry) => entry.name.includes("field_slice") && entry.name.endsWith(".csv")) ?? entries.find((entry) => entry.name.includes("slice") && entry.name.endsWith(".csv")) ?? entries.find((entry) => entry.name.endsWith(".csv"));
      const energy = entries.find((entry) => entry.name.includes("energy_balance") && entry.name.endsWith(".json"));
      const log = entries.find((entry) => entry.name.includes("postprocess_log") && entry.name.endsWith(".json"));
      if (!receipt || !flux || !fieldSlice) {
        throw new Error("Select l89 real_run_bundle.json or run_receipt.json, flux_summary.json, and field_slice_xz.csv together.");
      }
      const imported = importRealExternalRunBundle(l89RunPack, {
        receiptJson: receipt.text,
        fluxJson: flux.text,
        fieldSliceCsv: fieldSlice.text,
        fieldSlice: {
          id: l89RunPack.runConfig.fieldSliceId,
          sourceScenarioHash: l89RunPack.sourceScenarioHash,
          manifestHash: l89RunPack.manifestHash
        },
        energyBalanceJson: energy?.text,
        postprocessLogJson: log?.text
      });
      setL89RunBundle(imported);
      setImportedFdtd(imported.imported);
      setL89Promotion(null);
      setHasComputed(true);
    } catch (error) {
      setL89ImportError(error instanceof Error ? error.message : String(error));
    }
  }

  function promoteL89Run(acceptWarnings = false): void {
    if (!l89Comparison || !l89Validation) return;
    setL89Promotion(promoteRealExternalRunToEvidenceCampaign(l89RunPack, l89Comparison, l89Validation, acceptWarnings));
  }

  function exportL89ImportedBundle(): void {
    if (!l89RunBundle) return;
    downloadText("real_run_bundle.json", "application/json", realExternalRunBundleJson(l89RunBundle));
    downloadText("run_receipt.json", "application/json", `${JSON.stringify(l89RunBundle.receipt, null, 2)}\n`);
    downloadText("flux_summary.json", "application/json", `${JSON.stringify(l89RunBundle.flux, null, 2)}\n`);
    downloadText("field_slice_xz.csv", "text/csv", `${l89RunBundle.fieldSliceCsv}\n`);
    downloadText("energy_balance.json", "application/json", `${JSON.stringify(l89RunBundle.energyBalance, null, 2)}\n`);
    downloadText("postprocess_log.json", "application/json", `${JSON.stringify(l89RunBundle.postprocessLog, null, 2)}\n`);
  }

  function exportL89ReproducibilityReport(): void {
    downloadText("reproducibility_report.md", "text/markdown", `${realExternalRunReproducibilityMarkdown(l89Report)}\n`);
    downloadText("reproducibility_report.json", "application/json", realExternalRunReproducibilityReportJson(l89Report));
    downloadText("real_run_metrics.csv", "text/csv", `${realExternalRunMetricsCsv(l89Comparison, l89Validation)}\n`);
    downloadText("real_run_warnings.json", "application/json", realExternalRunWarningsJson(l89Report));
    if (l89Validation) downloadText("real_run_validation.json", "application/json", realExternalRunValidationJson(l89Validation));
    if (l89Comparison) downloadText("real_run_comparison.json", "application/json", realExternalRunComparisonJson(l89Comparison));
    if (activeL89Promotion) downloadText("real_run_promotion.json", "application/json", realExternalRunPromotionJson(activeL89Promotion));
  }

  function exportScenario(): void {
    downloadText("simulation_builder_scenario.json", "application/json", simulationBuilderScenarioJson(scenario));
  }

  function exportValidationBundle(): void {
    downloadText("validation_report.md", "text/markdown", simulationBuilderValidationReportMarkdown(result));
    downloadText("validation_report.json", "application/json", simulationBuilderValidationReportJson(result));
    downloadText("validation_metrics.csv", "text/csv", simulationBuilderValidationMetricsCsv(result));
  }

  function exportFdtdManifest(): void {
    downloadText("fdtd_scene_manifest.json", "application/json", fdtdManifestJson(fdtdBundle.manifest));
  }

  function exportFdtdMeepScript(): void {
    downloadText("meep_scene.py", "text/x-python", fdtdMeepScriptText(fdtdBundle.script));
  }

  function exportFdtdImportEvidence(): void {
    if (!importedFdtd) return;
    downloadText("fdtd_imported_run.json", "application/json", fdtdImportedRunJson(importedFdtd));
    downloadText("fdtd_field_slice_xz.csv", "text/csv", `${fdtdFieldSliceToCsv(importedFdtd.fieldSlice)}\n`);
  }

  function exportFdtdValidationReport(): void {
    if (!fdtdValidation) return;
    downloadText("fdtd_validation_report.md", "text/markdown", fdtdValidationReportMarkdown(fdtdValidation));
    downloadText("fdtd_validation_report.json", "application/json", fdtdValidationReportJson(fdtdValidation));
    downloadText("fdtd_validation_metrics.csv", "text/csv", fdtdValidationMetricsCsv(fdtdValidation));
  }

  function exportSurfaceGeometryScene(): void {
    downloadText("surface_geometry_scene.json", "application/json", surfaceGeometrySceneJson(surfaceGeometryScene));
    downloadText("surface_geometry_meep.py", "text/x-python", surfaceGeometryScene.bundle.script.python);
  }

  function exportSurfaceGeometryReport(): void {
    if (!surfaceGeometryExample) return;
    downloadText("surface_geometry_validation_report.md", "text/markdown", `${surfaceGeometryValidationReportMarkdown(surfaceGeometryExample.validation)}\n`);
    downloadText("surface_geometry_validation_report.json", "application/json", surfaceGeometryValidationReportJson(surfaceGeometryExample.validation));
    downloadText("surface_geometry_metrics.csv", "text/csv", `${surfaceGeometryMetricsCsv(surfaceGeometryExample.validation)}\n`);
  }

  function loadSurfaceGeometryFixture(kind: SurfaceGeometryKind): void {
    const example = createSurfaceGeometryExampleBundle(kind);
    setSurfaceGeometryKind(kind);
    setSurfaceGeometryExample(example);
    setScenario(example.scene.scenario);
    setImportedFdtd(example.imported);
    setFdtdImportError(null);
    setHasComputed(true);
  }

  function clearApertureEvidence(): void {
    setApertureExample(null);
    setApertureReport(null);
    setApertureFieldSlice(null);
    setApertureImportError(null);
  }

  function selectApertureScreenModel(model: ApertureScreenModel): void {
    setApertureScreenModel(model);
    clearApertureEvidence();
    if (hasApertureValidationElement(scenario)) {
      setScenario(createApertureValidationScenario(apertureKind, model));
      setHasComputed(true);
    }
  }

  function addApertureValidation(kind: ApertureValidationKind): void {
    setApertureKind(kind);
    clearApertureEvidence();
    setScenario(createApertureValidationScenario(kind, apertureScreenModel));
    setImportedFdtd(null);
    setHasComputed(true);
  }

  function loadApertureFixture(kind: ApertureValidationKind): void {
    const example = createApertureValidationExampleBundle(kind, apertureScreenModel);
    setApertureKind(kind);
    setApertureExample(example);
    setApertureReport(example.validation);
    setApertureFieldSlice(example.fieldSlice);
    setApertureImportError(null);
    setScenario(example.scene.scenario);
    setImportedFdtd(example.imported);
    setHasComputed(true);
  }

  function exportApertureScene(): void {
    downloadText("aperture_validation_scene.json", "application/json", apertureValidationSceneJson(apertureScene));
    downloadText("aperture_fdtd_scene_manifest.json", "application/json", fdtdManifestJson(apertureScene.bundle.manifest));
    downloadText("aperture_meep.py", "text/x-python", fdtdMeepScriptText(apertureScene.bundle.script));
  }

  function exportApertureDossier(): void {
    const report = activeApertureReport;
    if (!report) return;
    downloadText("aperture_validation_report.md", "text/markdown", `${apertureValidationReportMarkdown(report)}\n`);
    downloadText("aperture_validation_report.json", "application/json", apertureValidationReportJson(report));
    downloadText("aperture_metrics.csv", "text/csv", `${apertureMetricsCsv(report)}\n`);
    downloadText("aperture_profile.csv", "text/csv", `${apertureProfileCsv(report)}\n`);
    downloadText("aperture_convergence.csv", "text/csv", `${apertureConvergenceCsv(report)}\n`);
    if (apertureExample) {
      downloadText("aperture_run_receipt.json", "application/json", apertureReceiptJson(apertureExample));
      downloadText("aperture_flux_summary.json", "application/json", apertureFluxSummaryJson(apertureExample));
      downloadText("aperture_field_slice_xz.csv", "text/csv", `${apertureExample.fieldSliceCsv}\n`);
    }
  }

  async function importApertureFiles(files: FileList | null): Promise<void> {
    setApertureImportError(null);
    if (!files || files.length === 0) return;
    const entries = await Promise.all(Array.from(files).map(async (file) => ({ name: file.name.toLowerCase(), text: await file.text() })));
    const receipt = entries.find((entry) => entry.name.includes("receipt") && entry.name.endsWith(".json"));
    const flux = entries.find((entry) => entry.name.includes("flux") && entry.name.endsWith(".json"));
    const fieldSlice = entries.find((entry) => entry.name.includes("slice") && entry.name.endsWith(".csv")) ?? entries.find((entry) => entry.name.endsWith(".csv"));
    if (!receipt || !flux || !fieldSlice) {
      setApertureImportError("Select an aperture run receipt JSON, flux summary JSON, and field-slice CSV together.");
      return;
    }
    try {
      const imported = importFdtdRunArtifacts({
        receiptJson: receipt.text,
        fluxJson: flux.text,
        fieldSliceCsv: fieldSlice.text,
        fieldSlice: {
          id: "aperture-field-slice-xz",
          sourceScenarioHash: apertureScene.bundle.manifest.sourceScenarioHash,
          manifestHash: apertureScene.bundle.manifest.manifestHash
        }
      });
      setApertureExample(null);
      setApertureReport(validateApertureImportedRun(apertureScene, imported));
      setApertureFieldSlice(imported.fieldSlice);
      setImportedFdtd(imported);
      setHasComputed(true);
    } catch (error) {
      setApertureImportError(error instanceof Error ? error.message : String(error));
    }
  }

  function selectBenchmarkKind(kind: FdtdBenchmarkKind): void {
    setBenchmarkKind(kind);
    setScenario(createFdtdBenchmarkScenario(kind));
    setFdtdConvergence(null);
    setFdtdConvergenceError(null);
    setHasGeneratedBenchmarkPlan(true);
    setHasComputed(true);
  }

  function exportFdtdBenchmarkPack(): void {
    downloadText("fdtd_benchmark_manifest.json", "application/json", fdtdBenchmarkManifestJson(fdtdBenchmarkPack.benchmarkManifest));
    downloadText("fdtd_sweep_plan.json", "application/json", fdtdSweepPlanJson(fdtdBenchmarkPack.sweepPlan));
    downloadText("fdtd_expected_reference.json", "application/json", fdtdBenchmarkPack.expectedReferenceJson);
    downloadText("fdtd_benchmark_readme.md", "text/markdown", `${fdtdBenchmarkPack.readme}\n`);
    if (fdtdBenchmarkPack.scripts[0]) {
      downloadText("fdtd_benchmark_first_run_meep.py", "text/x-python", fdtdBenchmarkPack.scripts[0].export.python);
    }
  }

  function loadFdtdBenchmarkFixture(kind: FdtdBenchmarkKind): void {
    const example = createFdtdBenchmarkExampleBundle(kind, kind === "absorbing-slab" ? { pmlSensitive: true } : {});
    setBenchmarkKind(kind);
    setScenario(createFdtdBenchmarkScenario(kind));
    setFdtdConvergence(example.convergenceSummary);
    setFdtdConvergenceError(null);
    setHasGeneratedBenchmarkPlan(true);
    setHasComputed(true);
  }

  function exportFdtdBenchmarkDossier(): void {
    if (!fdtdConvergence) return;
    downloadText("fdtd_benchmark_report.md", "text/markdown", fdtdBenchmarkReportMarkdown(fdtdConvergence));
    downloadText("fdtd_benchmark_report.json", "application/json", fdtdBenchmarkReportJson(fdtdConvergence));
    downloadText("fdtd_convergence_metrics.csv", "text/csv", `${fdtdConvergenceMetricsCsv(fdtdConvergence)}\n`);
    downloadText("fdtd_run_table.csv", "text/csv", `${fdtdRunTableCsv(fdtdConvergence)}\n`);
  }

  async function importFdtdConvergence(files: FileList | null): Promise<void> {
    setFdtdConvergenceError(null);
    if (!files || files.length === 0) return;
    const entries = await Promise.all(Array.from(files).map(async (file) => ({ name: file.name.toLowerCase(), text: await file.text() })));
    const convergence = entries.find((entry) => entry.name.includes("convergence") && entry.name.endsWith(".json")) ?? entries.find((entry) => entry.name.endsWith(".json"));
    const flux = entries.find((entry) => entry.name.includes("flux") && entry.name.endsWith(".json"));
    if (!convergence) {
      setFdtdConvergenceError("Select convergence_summary.json, optionally with flux_summaries.json.");
      return;
    }
    try {
      const imported = importFdtdConvergenceBundleArtifacts({
        convergenceSummaryJson: convergence.text,
        fluxSummariesJson: flux?.text,
        expectedPack: fdtdBenchmarkPack
      });
      setFdtdConvergence(imported);
    } catch (error) {
      setFdtdConvergenceError(error instanceof Error ? error.message : String(error));
    }
  }

  function loadTransparentFdtdFixture(): void {
    const example = createTransparentFdtdExampleBundle();
    setScenario(createTransparentFdtdExampleScenario());
    setImportedFdtd(example.imported);
    setFdtdImportError(null);
    setHasComputed(true);
  }

  function loadAbsorbingFdtdFixture(): void {
    const example = createAbsorbingFdtdExampleBundle();
    setScenario(createAbsorbingFdtdExampleScenario());
    setImportedFdtd(example.imported);
    setFdtdImportError(null);
    setHasComputed(true);
  }

  async function importFdtdArtifacts(files: FileList | null): Promise<void> {
    setFdtdImportError(null);
    if (!files || files.length === 0) return;
    const entries = await Promise.all(Array.from(files).map(async (file) => ({ name: file.name.toLowerCase(), text: await file.text() })));
    const receipt = entries.find((entry) => entry.name.includes("receipt") && entry.name.endsWith(".json"));
    const flux = entries.find((entry) => entry.name.includes("flux") && entry.name.endsWith(".json"));
    const fieldSlice = entries.find((entry) => entry.name.includes("slice") && entry.name.endsWith(".csv")) ?? entries.find((entry) => entry.name.endsWith(".csv"));
    if (!receipt || !flux || !fieldSlice) {
      setFdtdImportError("Select a run receipt JSON, flux summary JSON, and field slice CSV together.");
      return;
    }
    try {
      const imported = importFdtdRunArtifacts({
        receiptJson: receipt.text,
        fluxJson: flux.text,
        fieldSliceCsv: fieldSlice.text,
        fieldSlice: {
          id: "field-slice-xz",
          sourceScenarioHash: fdtdBundle.manifest.sourceScenarioHash,
          manifestHash: fdtdBundle.manifest.manifestHash
        }
      });
      setImportedFdtd(imported);
    } catch (error) {
      setFdtdImportError(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <section className="wave-panel simulation-builder-panel" aria-label="L9.1 Simulation Builder">
      <div className="maxwell-section-heading simulation-builder-title">
        <h2>L9.1 Simulation Builder + 2D Sandbox Handoff</h2>
        <strong className={`maxwell-l72-status maxwell-l72-status-${result.validation.status}`}>{result.validation.status.toUpperCase()}</strong>
      </div>

      <div className="l2-disclosure">
        <strong>Simulation Builder</strong>
        <span>
          Define grid density, source, as many ordered z-axis elements as needed, target geometry, monitors, solver routing, scalar multi-plane preview, a bounded L9.1 2D FDTD sandbox handoff exporting fdtd2d_sandbox_scene.json and fdtd2d_sandbox_handoff.json, diagnostic process/tolerance variation studies, robust-design recommendations, engineering evidence campaign dossiers, real external FDTD run ingestion and reproducibility reports, precise numeric edits, optional diagram drag, and a validation report.
          The L9.1 sandbox is capped 2D TMz only with stability, validation, boundary, and convergence diagnostics. Arbitrary 3D Maxwell material geometry/CAD solving, production FDTD, WebGPU acceleration, FDTD/FEM/BEM/RCWA execution beyond the bounded 2D sandbox, real curved material lens solving, certified validation, full inverse design, automatic final design approval, sensor-stack EM, digital twin behavior, and manufacturing
          certification are not implemented.
        </span>
      </div>

      <div className="simulation-stepper" aria-label="Simulation Builder ordered steps">
        {stepLabels.map(([step, label]) => (
          <div className={`simulation-step simulation-step-${result.stepStatuses[step]}`} key={step}>
            <span>{label}</span>
            <strong>{result.stepStatuses[step]}</strong>
          </div>
        ))}
      </div>

      <div className="maxwell-workspace-panel simulation-builder-card simulation-builder-wide l85-bench" aria-label="L8.5.1 multi-element optical bench editor smoke preview">
        <div className="maxwell-section-heading">
          <h2>Multi-Element Optical Bench</h2>
          <strong>{l85Bundle.validationReport.computationStatus}</strong>
        </div>
        <div className="l2-disclosure">
          <strong>Grid -&gt; source -&gt; element chain -&gt; target -&gt; observation / monitors -&gt; validation report.</strong>
          <span>
            The scalar preview executes ideal apertures, slits, lenses, free-space segments, and observation planes. Finite transparent blocks, absorbing blocks, reflective plates, aperture/blockers, and
            tilted wedges are routed to deterministic external FDTD export/import evidence with receipts. Unsupported or scaffold-only items stay visible in the solver plan.
          </span>
        </div>
        <div className="maxwell-layer-actions simulation-builder-actions l85-action-row">
          <button type="button" onClick={resetL85Bench}>
            <Sparkles size={15} />
            <span>Load L8.5 Bench</span>
          </button>
          {l85BenchActions.map((action) => (
            <button type="button" key={`${action.kind}:${action.label}`} onClick={() => addL85BenchElement(action)}>
              <Plus size={15} />
              <span>{action.label}</span>
            </button>
          ))}
          <button type="button" onClick={addL85ObservationMonitor}>
            <Plus size={15} />
            <span>Add monitor</span>
          </button>
          <button type="button" onClick={undoL85Edit} disabled={l85History.past.length === 0}>
            <Undo2 size={15} />
            <span>Undo</span>
          </button>
          <button type="button" onClick={redoL85Edit} disabled={l85History.future.length === 0}>
            <Redo2 size={15} />
            <span>Redo</span>
          </button>
          <label className="l85-snap-control">
            <span>Snap</span>
            <select aria-label="L8.5 snap step" value={l85SnapStepMm} onChange={(event) => setL85SnapStepMm(Number(event.currentTarget.value))}>
              <option value={0}>Off</option>
              <option value={0.1}>0.1 mm</option>
              <option value={0.5}>0.5 mm</option>
              <option value={1}>1 mm</option>
            </select>
          </label>
          <button type="button" onClick={() => setHasL85ScalarPreview(true)} disabled={l85EditingBlocked}>
            <Sparkles size={15} />
            <span>Run Scalar Preview</span>
          </button>
          <button type="button" onClick={() => setHasL85ExternalEvidence(true)}>
            <Sparkles size={15} />
            <span>Import Bundled Multi-Element Fixture</span>
          </button>
          <button type="button" onClick={exportL85Scene} disabled={l85EditingBlocked}>
            <FileDown size={15} />
            <span>Export Multi-Element Scene</span>
          </button>
          <button type="button" onClick={exportL85ExternalFdtdChain} disabled={l85EditingBlocked}>
            <FileDown size={15} />
            <span>Export External FDTD Chain</span>
          </button>
          <button type="button" onClick={exportL90SandboxSlice}>
            <FileDown size={15} />
            <span>Export 2D Slice to Maxwell Sandbox</span>
          </button>
          <button type="button" onClick={exportL85ValidationReport} disabled={l85EditingBlocked}>
            <FileDown size={15} />
            <span>Export Multi-Element Validation Report</span>
          </button>
        </div>

        <div className="l85-grid">
          <div className="maxwell-data-table l85-wide" aria-label="L8.5 ordered element list smoke preview">
            <div className="maxwell-section-heading">
              <h2>Element Chain</h2>
              <strong>{l85Bundle.scene.elements.length} elements</strong>
            </div>
            <div className="l85-element-table">
              <div className="l85-element-row l85-element-header">
                <span>order</span>
                <span>element</span>
                <span>z mm</span>
                <span>route</span>
                <span>status</span>
                <span>controls</span>
              </div>
              {l85Bundle.scene.elements.map((element, index) => (
                <div
                  className={`l85-element-row ${selectedL85.kind === "element" && selectedL85.id === element.id ? "l85-selected-row" : ""}`}
                  key={element.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${element.label}`}
                  aria-pressed={selectedL85.kind === "element" && selectedL85.id === element.id}
                  onClick={() => setSelectedL85({ kind: "element", id: element.id })}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedL85({ kind: "element", id: element.id });
                    }
                  }}
                >
                  <span>{index + 1}</span>
                  <strong>{element.label}</strong>
                  <input
                    aria-label={`${element.label} z position`}
                    type="number"
                    value={element.zMm}
                    step={l85Snap.enabled ? l85Snap.stepMm : 0.1}
                    onClick={(event) => event.stopPropagation()}
                    onFocus={() => setSelectedL85({ kind: "element", id: element.id })}
                    onChange={(event) => updateL85ElementZ(element.id, Number(event.currentTarget.value))}
                  />
                  <span>{element.solverRoute}</span>
                  <em className={`simulation-capability simulation-capability-${element.status === "external-only" ? "scaffold-only" : element.status}`}>{element.status}</em>
                  <span className="l85-row-actions" onClick={(event) => event.stopPropagation()}>
                    <button type="button" onClick={() => duplicateL85Element(element.id)} title={`Duplicate ${element.label}`}>
                      <Copy size={13} />
                      <span>Duplicate</span>
                    </button>
                    <button type="button" onClick={() => toggleL85Element(element)} title={`${element.enabled ? "Disable" : "Enable"} ${element.label}`}>
                      {element.enabled ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{element.enabled ? "Disable" : "Enable"}</span>
                    </button>
                    <button type="button" onClick={() => addL85MonitorAround(element.id, "after")} title={`Add monitor after ${element.label}`}>
                      <Plus size={13} />
                      <span>Monitor</span>
                    </button>
                    <button type="button" onClick={() => deleteL85Element(element.id)} title={`Delete ${element.label}`}>
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="maxwell-data-table l85-wide l85-inspector-panel" aria-label="L8.5.1 element inspector direct editing smoke preview">
            <div className="maxwell-section-heading">
              <h2>Element Inspector</h2>
              <strong>{selectedL85.kind === "element" ? selectedL85SceneElement?.solverRoute ?? "no element" : "monitor"}</strong>
            </div>
            <L85ElementInspector
              selected={selectedL85}
              element={selectedL85Element}
              sceneElement={selectedL85SceneElement}
              monitor={selectedL85Monitor}
              customMonitor={selectedL85CustomMonitor}
              warnings={l85EditingWarnings}
              snapStepMm={l85Snap.enabled ? l85Snap.stepMm : 0.1}
              canUndo={l85History.past.length > 0}
              canRedo={l85History.future.length > 0}
              onSelect={setSelectedL85}
              onElementPatch={updateL85ElementPatch}
              onMonitorPatch={updateL85MonitorPatch}
              onNudge={nudgeL85Selection}
              onMoveOrder={moveL85ElementOrder}
              onDuplicate={duplicateL85Element}
              onDelete={deleteL85Element}
              onToggle={toggleL85Element}
              onAddMonitor={addL85MonitorAround}
              onDeleteMonitor={deleteL85Monitor}
              onExportSelected={exportL85SelectedJson}
              onUndo={undoL85Edit}
              onRedo={redoL85Edit}
            />
          </div>

          <div className="maxwell-data-table l85-wide" aria-label="L8.5 x-z cross-section smoke preview">
            <div className="maxwell-section-heading">
              <h2>X-Z Bench Cross-Section</h2>
              <strong>Finite shape and transverse placement</strong>
            </div>
            <p className="simulation-builder-note l88a-two-view-helper">
              Optical Axis Placement edits order and z-position. X-Z Surface Geometry edits finite shape and transverse placement in Edit Geometry mode. Inspector fields are exact source of truth.
            </p>
            <L85BenchCrossSection
              bundle={l85Bundle}
              selected={selectedL85}
              snapStepMm={l85Snap.enabled ? l85Snap.stepMm : 0.1}
              mode={xzGeometryMode}
              editableMonitorIds={editableL85MonitorIds}
              onSelect={setSelectedL85}
              onCommitPosition={commitL85DiagramPosition}
              onKeyboardNudge={nudgeL85Selection}
            />
          </div>

          <div className="maxwell-data-table" aria-label="L8.5 solver plan smoke preview">
            <div className="maxwell-section-heading">
              <h2>Solver Plan</h2>
              <strong>{l85Bundle.solverPlan.filter((row) => row.solverRoute === "external-fdtd").length} external</strong>
            </div>
            <L85SolverPlanTable rows={l85Bundle.solverPlan} />
          </div>

          <div className="maxwell-data-table" aria-label="L8.5 monitor stack smoke preview">
            <div className="maxwell-section-heading">
              <h2>Monitor Stack</h2>
              <strong>{hasL85ScalarPreview ? `${l85Bundle.scalarPreview.snapshots.length} snapshots` : "ready"}</strong>
            </div>
            {hasL85ScalarPreview ? <L85MonitorStack snapshots={l85Bundle.scalarPreview.snapshots} /> : <div className="empty-state">Run scalar preview to compute monitor snapshots for supported ideal plane elements.</div>}
          </div>

          <div className="maxwell-data-table" aria-label="L8.5 scalar chain preview smoke preview">
            <div className="maxwell-section-heading">
              <h2>Scalar Chain Preview</h2>
              <strong>{l85Bundle.scalarPreview.previewHash.slice(0, 10)}</strong>
            </div>
            <div className="maxwell-study-list">
              <Stat label="Snapshots" value={String(l85Bundle.scalarPreview.snapshots.length)} />
              <Stat label="Warnings" value={String(l85Bundle.scalarPreview.warnings.length)} />
              <Stat label="First monitor" value={l85Bundle.scalarPreview.snapshots[0]?.label ?? "n/a"} />
              <Stat label="Last monitor" value={l85Bundle.scalarPreview.snapshots[l85Bundle.scalarPreview.snapshots.length - 1]?.label ?? "n/a"} />
            </div>
          </div>

          <div className="maxwell-data-table" aria-label="L8.5 external FDTD chain import smoke preview">
            <div className="maxwell-section-heading">
              <h2>External FDTD Chain Import</h2>
              <strong>{hasL85ExternalEvidence ? "imported fixture" : "not imported"}</strong>
            </div>
            <div className="maxwell-study-list">
              <Stat label="Run receipt" value={hasL85ExternalEvidence ? l85Bundle.externalEvidence.receipt.runId : "none"} />
              <Stat label="Imported R/T/A" value={hasL85ExternalEvidence ? `${pct(l85Bundle.externalEvidence.flux.reflectance)} / ${pct(l85Bundle.externalEvidence.flux.transmittance)} / ${pct(l85Bundle.externalEvidence.flux.absorbance)}` : "n/a"} />
              <Stat label="Energy balance" value={hasL85ExternalEvidence ? formatCompact(l85Bundle.externalEvidence.flux.energyBalance) : "n/a"} />
              <Stat label="Field slice" value={hasL85ExternalEvidence ? `${l85Bundle.externalEvidence.fieldSlice.xCount} x ${l85Bundle.externalEvidence.fieldSlice.zCount}` : "n/a"} />
              <Stat label="Report hash" value={l85Bundle.validationReport.reportHash.slice(0, 10)} />
            </div>
          </div>

          <div className="maxwell-data-table l85-wide" aria-label="L8.5 boundary warning smoke preview">
            <div className="maxwell-section-heading">
              <h2>Validation Warnings / Boundaries</h2>
              <strong>{l85EditingBlocked ? "blocked" : `${l85EditingWarnings.length + l85Bundle.validationReport.warnings.length}`}</strong>
            </div>
            <div className="fdtd-warning-list">
              {l85EditingWarnings.slice(0, 8).map((warning, index) => (
                <span key={`edit:${warning.code}:${warning.elementId ?? ""}:${index}`}>
                  <strong>{warning.code}</strong> {warning.message}
                </span>
              ))}
              {l85Bundle.validationReport.warnings.slice(0, 9).map((warning, index) => (
                <span key={`report:${warning.code}:${warning.elementId ?? ""}:${index}`}>
                  <strong>{warning.code}</strong> {warning.message}
                </span>
              ))}
              {l85EditingWarnings.length + l85Bundle.validationReport.warnings.length === 0 && <span>No L8.5.1 warnings for the current ordered scene.</span>}
              {l85EditingBlocked && <span><strong>export blocked</strong> Resolve overlap/domain/unsupported edit blockers before scalar preview or export.</span>}
              <span>
                <strong>boundary</strong> No production in-browser FDTD execution, arbitrary CAD/freeform geometry solve, general arbitrary 3D Maxwell, FEM/BEM/RCWA, production EM solver, digital twin, or
                manufacturing certification is claimed.
              </span>
            </div>
          </div>

          <L86ToleranceRunnerPanel
            report={l86Report}
            mode={l86Mode}
            variations={l86Variations}
            thresholds={l86Thresholds}
            selectedElement={selectedL85Element}
            sweepManifest={l86SweepManifest}
            fdtdSummary={l86FdtdSummary}
            fdtdWarnings={l86FdtdWarnings}
            fdtdImportError={l86FdtdImportError}
            onMode={setL86Mode}
            onReset={resetL86Variations}
            onToggleVariation={toggleL86Variation}
            onVariationDelta={updateL86VariationDelta}
            onAddSourceWavelength={addL86SourceWavelengthVariation}
            onAddSelectedVariation={addL86SelectedVariation}
            onToggleThreshold={toggleL86Threshold}
            onThreshold={updateL86Threshold}
            onExportReport={exportL86ToleranceReport}
            onExportFdtdSweep={exportL86FdtdSweepPack}
            onImportBundledFdtdSummary={importL86BundledFdtdSummary}
            onImportFdtdSummaryFiles={handleL86FdtdSummaryFiles}
          />
          <L87RobustDesignAdvisorPanel
            report={l87Report}
            rankingMode={l87RankingMode}
            permissions={l87Permissions}
            fdtdManifest={l87FdtdManifest}
            fdtdSummary={l87FdtdSummary}
            fdtdWarnings={l87FdtdWarnings}
            fdtdImportError={l87FdtdImportError}
            onRankingMode={setL87RankingMode}
            onPermission={updateL87Permission}
            onResetPermissions={resetL87Permissions}
            onApplyCandidate={applyL87Candidate}
            onExportReport={exportL87RobustDesignReport}
            onExportFdtdSweep={exportL87FdtdCandidateSweepPack}
            onImportBundledFdtdSummary={importL87BundledFdtdSummary}
            onImportFdtdSummaryFiles={handleL87FdtdSummaryFiles}
          />
          <L88EngineeringEvidenceCampaignPanel
            manifest={l88Manifest}
            summary={l88Summary}
            warnings={l88Warnings}
            importError={l88ImportError}
            onLoadBundled={loadL88BundledCampaign}
            onExportDossier={exportL88EngineerReviewDossier}
            onImportFiles={handleL88CampaignFiles}
          />
        </div>
      </div>

      <div className="simulation-builder-layout">
        <div className="maxwell-workspace-panel simulation-builder-card" aria-label="L8.0 grid step">
          <div className="maxwell-section-heading">
            <h2>1 Grid</h2>
            <strong>{formatCompact(result.grid.estimatedVolumetricSamples)} samples</strong>
          </div>
          <div className="simulation-field-grid">
            <label>
              <span>Units</span>
              <select aria-label="Grid units" value={scenario.grid.units} onChange={(event) => updateGrid("units", event.currentTarget.value as SimulationBuilderGrid["units"])}>
                <option value="mm">mm</option>
                <option value="um">um</option>
                <option value="nm">nm</option>
              </select>
            </label>
            <NumberField label="Domain width" unit="um" value={scenario.grid.domainWidthUm} min={0.1} step={0.5} onChange={(value) => updateGrid("domainWidthUm", value)} />
            <NumberField label="Domain height" unit="um" value={scenario.grid.domainHeightUm} min={0.1} step={0.5} onChange={(value) => updateGrid("domainHeightUm", value)} />
            <NumberField label="z start" unit="mm" value={scenario.grid.zStartMm} step={0.5} onChange={(value) => updateGrid("zStartMm", value)} />
            <NumberField label="z end" unit="mm" value={scenario.grid.zEndMm} min={scenario.grid.zStartMm + 0.1} step={0.5} onChange={(value) => updateGrid("zEndMm", value)} />
            <NumberField label="Grid density" unit="pts/lambda" value={scenario.grid.pointsPerWavelength} min={1} step={1} onChange={(value) => updateGrid("pointsPerWavelength", value)} />
          </div>
          <div className="maxwell-data-table" aria-label="L8.0 grid density smoke preview">
            <div className="maxwell-study-list">
              <Stat label="dx / dy / dz" value={`${formatCompact(result.grid.dxNm)} nm`} />
              <Stat label="Samples x/y/z" value={`${result.grid.samplesX}/${result.grid.samplesY}/${result.grid.samplesZ}`} />
              <Stat label="Warning count" value={String(result.grid.warnings.length)} />
            </div>
          </div>
          <p className="simulation-builder-note">This grid controls the sampled field/intensity representation for this validation scene. Full 3D Maxwell volumetric solving is not executable in-app yet.</p>
        </div>

        <div className="maxwell-workspace-panel simulation-builder-card" aria-label="L8.0 source step">
          <div className="maxwell-section-heading">
            <h2>2 Source</h2>
            <strong>{scenario.source.wavelengthNm} nm</strong>
          </div>
          <div className="simulation-field-grid">
            <label>
              <span>Source type</span>
              <select aria-label="Source type" value={scenario.source.type} onChange={(event) => updateSource("type", event.currentTarget.value as SimulationBuilderSource["type"])}>
                <option value="plane-wave">plane wave</option>
                <option value="point-source">point source</option>
              </select>
            </label>
            <NumberField label="Wavelength" unit="nm" value={scenario.source.wavelengthNm} min={100} step={10} onChange={(value) => updateSource("wavelengthNm", value)} />
            <NumberField label="x" unit="um" value={scenario.source.xUm} step={0.5} onChange={(value) => updateSource("xUm", value)} />
            <NumberField label="y" unit="um" value={scenario.source.yUm} step={0.5} onChange={(value) => updateSource("yUm", value)} />
            <NumberField label="z" unit="mm" value={scenario.source.zMm} step={0.5} onChange={(value) => updateSource("zMm", value)} />
            <label>
              <span>Coherence</span>
              <select aria-label="Source coherence" value={scenario.source.coherence} onChange={(event) => updateSource("coherence", event.currentTarget.value as SimulationBuilderSource["coherence"])}>
                <option value="coherent">coherent</option>
                <option value="incoherent">incoherent</option>
                <option value="partial">partial</option>
              </select>
            </label>
          </div>
        </div>

        <div className="maxwell-workspace-panel simulation-builder-card simulation-builder-wide" aria-label="L8.0 optical elements step">
          <div className="maxwell-section-heading">
            <h2>3 Optical Elements</h2>
            <strong>{result.orderedElements.length} placed</strong>
          </div>
          <div className="maxwell-layer-actions simulation-builder-actions">
            {elementActions.map((action) => (
              <button type="button" key={action.kind} onClick={() => addElement(action.kind)}>
                <Plus size={15} />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
          <div className="l2-disclosure surface-geometry-palette" aria-label="L8.3 surface geometry palette smoke preview">
            <strong>Surface Geometry Elements</strong>
            <span>Finite transparent, absorbing, reflective, aperture/blocker, and tilted/wedge geometry can be placed, exported to external FDTD helper scripts, and validated through imported fixture evidence.</span>
          </div>
          <div className="maxwell-layer-actions simulation-builder-actions surface-geometry-actions">
            {surfaceGeometryActions.map((action) => (
              <button type="button" key={action.kind} onClick={() => addSurfaceGeometry(action.kind)}>
                <Plus size={15} />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
          <div className="simulation-elements-table" aria-label="L8.0 ordered element list smoke preview">
            <div className="simulation-elements-row simulation-elements-header">
              <span>Order</span>
              <span>Element</span>
              <span>x / z</span>
              <span>Size W/H/T</span>
              <span>Model</span>
              <span>Status</span>
            </div>
            {result.orderedElements.map((element, index) => (
              <div className="simulation-elements-row" key={element.id}>
                <span>{index + 1}</span>
                <strong>{element.label}</strong>
                <span>{elementPositionText(element)}</span>
                <span>{elementSizeText(element)}</span>
                <span>{element.model}</span>
                <em className={`simulation-capability simulation-capability-${element.status}`}>{element.status}</em>
              </div>
            ))}
          </div>
        </div>

        <div className="maxwell-workspace-panel simulation-builder-card simulation-builder-wide" aria-label="L8.0 optical axis diagram">
          <div className="maxwell-section-heading">
            <h2>Optical Axis Placement</h2>
            <strong>Order and z-position</strong>
          </div>
          <p className="simulation-builder-note l88a-two-view-helper">Order and z-position only: drag or keyboard-nudge nodes along z, then commit on drop. Escape cancels preview; solver/evidence recompute waits until the committed edit.</p>
          <OpticalAxisPlacementDiagram
            axis={result.axis}
            zMin={zMin}
            zMax={zMax}
            selected={selectedL85}
            snapStepMm={l85Snap.enabled ? l85Snap.stepMm : 0.1}
            onSelect={setSelectedL85}
            onCommitZ={commitOpticalAxisNodePosition}
          />
        </div>

        <div className="maxwell-workspace-panel simulation-builder-card simulation-builder-wide" aria-label="L8.3 x-z cross-section geometry smoke preview">
          <div className="maxwell-section-heading">
            <h2>X-Z Surface Geometry Cross-Section</h2>
            <strong>Finite shape and transverse placement</strong>
          </div>
          <div className="l88a-view-toolbar" aria-label="L8.8a two-view interaction model smoke preview">
            <p className="simulation-builder-note l88a-two-view-helper">
              Inspect mode selects geometry without moving it. Edit Geometry enables body drag for x/z and handles for thickness/transverse size; numeric fields remain authoritative.
            </p>
            <div className="l88a-mode-toggle" role="group" aria-label="X-Z geometry interaction mode">
              <button type="button" className={xzGeometryMode === "inspect" ? "l88a-mode-toggle-active" : ""} onClick={() => setXzGeometryMode("inspect")}>Inspect</button>
              <button type="button" className={xzGeometryMode === "edit" ? "l88a-mode-toggle-active" : ""} onClick={() => setXzGeometryMode("edit")}>Edit Geometry</button>
            </div>
          </div>
          <SurfaceGeometryCrossSection
            scenario={scenario}
            zMin={zMin}
            zMax={zMax}
            selected={selectedL85}
            mode={xzGeometryMode}
            warnings={l85EditingWarnings}
            snapStepMm={l85Snap.enabled ? l85Snap.stepMm : 0.1}
            onSelect={setSelectedL85}
            onCommitGeometry={commitSurfaceGeometryEdit}
          />
        </div>

        <div className="maxwell-workspace-panel simulation-builder-card" aria-label="L8.0 target material step">
          <div className="maxwell-section-heading">
            <h2>4 Target / Material</h2>
            <strong>{targetDisplayName(scenario.target.kind)}</strong>
          </div>
          <div className="simulation-field-grid">
            <label>
              <span>Target case</span>
              <select aria-label="Target case" value={scenario.target.kind} onChange={(event) => setTargetKind(event.currentTarget.value as SimulationBuilderTargetKind)}>
                <option value="transparent-dielectric">transparent dielectric</option>
                <option value="mirror">mirror surface</option>
                <option value="absorbing-slab">absorbing slab</option>
              </select>
            </label>
            <NumberField label="Target z" unit="mm" value={scenario.target.zMm} step={0.5} onChange={(value) => updateTarget("zMm", value)} />
            {scenario.target.kind === "transparent-dielectric" && (
              <>
                <NumberField label="n incident" value={scenario.target.incidentIndex} min={0.1} step={0.01} onChange={(value) => updateTarget("incidentIndex", value)} />
                <NumberField label="n substrate" value={scenario.target.substrateIndex} min={0.1} step={0.01} onChange={(value) => updateTarget("substrateIndex", value)} />
              </>
            )}
            {scenario.target.kind === "absorbing-slab" && (
              <>
                <NumberField label="alpha" unit="1/m" value={scenario.target.absorptionCoefficientPerM} min={0} step={500} onChange={(value) => updateTarget("absorptionCoefficientPerM", value)} />
                <NumberField label="Thickness" unit="um" value={scenario.target.thicknessUm} min={0} step={10} onChange={(value) => updateTarget("thicknessUm", value)} />
              </>
            )}
          </div>
        </div>

        <div className="maxwell-workspace-panel simulation-builder-card" aria-label="L8.0 compute and validate step">
          <div className="maxwell-section-heading">
            <h2>5 Compute / 6 Validate</h2>
            <strong>{hasComputed ? "computed" : "ready"}</strong>
          </div>
          <div className="maxwell-layer-actions simulation-builder-actions">
            <button type="button" onClick={() => setHasComputed(true)}>
              <Sparkles size={15} />
              <span>Compute Surface Validation</span>
            </button>
            <button type="button" onClick={exportScenario}>
              <FileDown size={15} />
              <span>Export Scenario JSON</span>
            </button>
            <button type="button" onClick={exportValidationBundle}>
              <FileDown size={15} />
              <span>Export Validation Report</span>
            </button>
          </div>
          <div className="maxwell-data-table" aria-label="L8.0 surface validation smoke preview">
            <div className="maxwell-study-list">
              <Stat label="Solver path" value={result.validation.solverPath} />
              <Stat label="Computed R/T/A" value={`${pct(result.validation.computed.reflectance)} / ${pct(result.validation.computed.transmittance)} / ${pct(result.validation.computed.absorbance)}`} />
              <Stat label="Expected R/T/A" value={`${pct(result.validation.expected.reflectance)} / ${pct(result.validation.expected.transmittance)} / ${pct(result.validation.expected.absorbance)}`} />
              <Stat label="Energy balance" value={`${formatCompact(result.validation.energyBalance)} (${result.validation.status})`} />
              <Stat label="Residual R/T/A" value={`${formatCompact(result.validation.residuals.reflectance)} / ${formatCompact(result.validation.residuals.transmittance)} / ${formatCompact(result.validation.residuals.absorbance)}`} />
            </div>
          </div>
          <div className="simulation-bars" aria-label="L8.0 R T A field intensity preview">
            <Bar label="R" value={result.validation.computed.reflectance} />
            <Bar label="T" value={result.validation.computed.transmittance} />
            <Bar label="A" value={result.validation.computed.absorbance} />
          </div>
          <p className="simulation-builder-note">{result.validation.analyticReference}</p>
        </div>

        <div className="maxwell-workspace-panel simulation-builder-card simulation-builder-wide" aria-label="L8.3 Surface Geometry Interaction Starter Set">
          <div className="maxwell-section-heading">
            <h2>L8.3 Surface Geometry Interaction Starter Set</h2>
            <strong>{surfaceGeometryExample?.validation.classification ?? "fixture ready"}</strong>
          </div>
          <div className="l2-disclosure">
            <strong>Finite placed geometry with external FDTD evidence.</strong>
            <span>
              Place transparent, absorbing, reflective, aperture/blocker, and tilted/wedge surfaces; export deterministic FDTD geometry/scripts; import bundled or external field/flux evidence; and review
              energy, reference, monitor, PML, staircasing, and convergence warnings. This remains external export/import only, not browser-native arbitrary 3D Maxwell.
            </span>
          </div>
          <div className="simulation-field-grid fdtd-verification-controls">
            <label>
              <span>Geometry fixture</span>
              <select aria-label="Surface geometry fixture" value={surfaceGeometryKind} onChange={(event) => setSurfaceGeometryKind(event.currentTarget.value as SurfaceGeometryKind)}>
                <option value="transparent-block">transparent block</option>
                <option value="absorbing-block">absorbing block</option>
                <option value="reflective-plate">reflective plate</option>
                <option value="aperture-blocker">aperture/blocker</option>
                <option value="tilted-wedge">tilted wedge</option>
              </select>
            </label>
            <button type="button" onClick={() => loadSurfaceGeometryFixture("transparent-block")}>
              <Sparkles size={15} />
              <span>Load Transparent Block Fixture</span>
            </button>
            <button type="button" onClick={() => loadSurfaceGeometryFixture("absorbing-block")}>
              <Sparkles size={15} />
              <span>Load Absorbing Block Fixture</span>
            </button>
            <button type="button" onClick={() => loadSurfaceGeometryFixture("reflective-plate")}>
              <Sparkles size={15} />
              <span>Load Reflective Plate Fixture</span>
            </button>
            <button type="button" onClick={() => loadSurfaceGeometryFixture("aperture-blocker")}>
              <Sparkles size={15} />
              <span>Load Aperture Blocker Fixture</span>
            </button>
            <button type="button" onClick={() => loadSurfaceGeometryFixture("tilted-wedge")}>
              <Sparkles size={15} />
              <span>Load Wedge Fixture</span>
            </button>
            <button type="button" onClick={exportSurfaceGeometryScene}>
              <FileDown size={15} />
              <span>Export Surface Geometry Scene</span>
            </button>
            <button type="button" disabled={!surfaceGeometryExample} onClick={exportSurfaceGeometryReport}>
              <FileDown size={15} />
              <span>Export Surface Geometry Report</span>
            </button>
          </div>
          <div className="fdtd-grid">
            <div className="maxwell-data-table" aria-label="L8.3 transparent block field smoke preview">
              <div className="maxwell-section-heading">
                <h2>Finite Geometry Scene</h2>
                <strong>{surfaceGeometryDisplayName(surfaceGeometryScene.kind)}</strong>
              </div>
              <div className="maxwell-study-list">
                <Stat label="Scene hash" value={surfaceGeometryScene.sceneHash.slice(0, 10)} />
                <Stat label="Manifest hash" value={surfaceGeometryScene.bundle.manifest.manifestHash.slice(0, 10)} />
                <Stat label="Script hash" value={surfaceGeometryScene.bundle.script.scriptHash.slice(0, 10)} />
                <Stat label="Geometry ids" value={surfaceGeometryScene.geometryIds.join(", ") || "none"} />
                <Stat label="Reference" value={surfaceGeometryScene.reference.model} />
                <Stat label="Sweep hook" value={`${surfaceGeometryConvergencePack.sweepPlan.runCount} runs`} />
              </div>
            </div>

            <div className="maxwell-data-table" aria-label="L8.3 absorbing block field smoke preview">
              <div className="maxwell-section-heading">
                <h2>Field Slice Around Geometry</h2>
                <strong>{surfaceGeometryExample ? `${surfaceGeometryExample.fieldSlice.xCount} x ${surfaceGeometryExample.fieldSlice.zCount}` : "no fixture"}</strong>
              </div>
              {surfaceGeometryExample ? <FdtdFieldSlicePreview slice={surfaceGeometryExample.fieldSlice} /> : <div className="empty-state">Load a surface geometry fixture to display an imported X-Z field/intensity slice.</div>}
            </div>

            <div className="maxwell-data-table" aria-label="L8.3 reflective plate smoke preview">
              <div className="maxwell-section-heading">
                <h2>Flux / Reference Validation</h2>
                <strong>{surfaceGeometryExample?.validation.status ?? "pending"}</strong>
              </div>
              <div className="maxwell-study-list">
                <Stat label="Classification" value={surfaceGeometryExample?.validation.classification ?? "n/a"} />
                <Stat label="Imported R/T/A" value={surfaceGeometryExample ? `${pct(surfaceGeometryExample.validation.imported.reflectance)} / ${pct(surfaceGeometryExample.validation.imported.transmittance)} / ${pct(surfaceGeometryExample.validation.imported.absorbance)}` : "n/a"} />
                <Stat label="Reference R/T/A" value={`${pct(surfaceGeometryScene.reference.expected.reflectance)} / ${pct(surfaceGeometryScene.reference.expected.transmittance)} / ${pct(surfaceGeometryScene.reference.expected.absorbance)}`} />
                <Stat label="Energy balance" value={surfaceGeometryExample ? `${formatCompact(surfaceGeometryExample.validation.energyBalance)} (${formatCompact(surfaceGeometryExample.validation.residuals.energyBalance)} residual)` : "n/a"} />
                <Stat label="Report hash" value={surfaceGeometryExample?.validation.reportHash.slice(0, 10) ?? "n/a"} />
              </div>
            </div>

            <div className="maxwell-data-table" aria-label="L8.3 aperture blocker diagnostic smoke preview">
              <div className="maxwell-section-heading">
                <h2>Monitor / Export Receipt</h2>
                <strong>{surfaceGeometryScene.monitorIds.length} monitors</strong>
              </div>
              <div className="fdtd-sweep-table">
                <div className="fdtd-sweep-row fdtd-sweep-header">
                  <span>monitor</span>
                  <span>z um</span>
                  <span>normal</span>
                  <span>type</span>
                  <span>hash</span>
                </div>
                {surfaceGeometryScene.bundle.manifest.monitors.slice(0, 6).map((monitor) => (
                  <div className="fdtd-sweep-row" key={monitor.id}>
                    <span>{monitor.id}</span>
                    <span>{formatCompact(monitor.centerUm.z)}</span>
                    <span>{monitor.normal}</span>
                    <span>{monitor.kind}</span>
                    <span>{surfaceGeometryScene.sceneHash.slice(0, 6)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="maxwell-data-table fdtd-wide" aria-label="L8.3 wedge warning smoke preview">
              <div className="maxwell-section-heading">
                <h2>Finite Geometry Warnings</h2>
                <strong>{surfaceGeometryScene.warnings.length}</strong>
              </div>
              <div className="fdtd-warning-list">
                {surfaceGeometryScene.warnings.map((warning, index) => (
                  <span key={`${warning.code}:${warning.elementId ?? ""}:${index}`}>
                    <strong>{warning.code}</strong> {warning.message}
                  </span>
                ))}
                {surfaceGeometryScene.warnings.length === 0 && <span>No finite-geometry warnings for the current fixture setup.</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="maxwell-workspace-panel simulation-builder-card simulation-builder-wide" aria-label="L8.4 Aperture / Blocker Edge-Diffraction Validation">
          <div className="maxwell-section-heading">
            <h2>L8.4 Aperture / Blocker Edge-Diffraction Validation</h2>
            <strong>{activeApertureReport?.classification ?? "fixture ready"}</strong>
          </div>
          <div className="l2-disclosure">
            <strong>Aperture / Blocker Validation</strong>
            <span>
              Long-slit, circular-pinhole, rectangular-aperture, and opaque-blocker external FDTD evidence can be compared against scalar limiting references: single-slit-sinc2, airy-bessel,
              rectangular-sinc2, and blocked power / shadow flux diagnostics. Production browser FDTD execution, production metal aperture models, arbitrary CAD aperture solving, FEM/BEM/RCWA, sensor-stack EM,
              digital twins, and manufacturing certification are not implemented.
            </span>
          </div>
          <div className="simulation-field-grid fdtd-verification-controls aperture-validation-controls">
            <label>
              <span>Aperture kind</span>
              <select aria-label="Aperture validation kind" value={apertureKind} onChange={(event) => addApertureValidation(event.currentTarget.value as ApertureValidationKind)}>
                <option value="long-slit">long slit</option>
                <option value="circular-pinhole">circular pinhole</option>
                <option value="rectangular-aperture">rectangular aperture</option>
                <option value="opaque-blocker">opaque blocker</option>
              </select>
            </label>
            <label>
              <span>Screen model</span>
              <select aria-label="Aperture screen model" value={apertureScreenModel} onChange={(event) => selectApertureScreenModel(event.currentTarget.value as ApertureScreenModel)}>
                <option value="absorbing-screen">absorbing screen</option>
                <option value="ideal-reflective-screen">ideal reflective screen</option>
                <option value="transparent-reference">transparent reference</option>
              </select>
            </label>
            {apertureValidationActions.map((action) => (
              <button type="button" key={`add-${action.kind}`} onClick={() => addApertureValidation(action.kind)}>
                <Plus size={15} />
                <span>{action.addLabel}</span>
              </button>
            ))}
            {apertureValidationActions.map((action) => (
              <button type="button" key={`fixture-${action.kind}`} onClick={() => loadApertureFixture(action.kind)}>
                <Sparkles size={15} />
                <span>{action.fixtureLabel}</span>
              </button>
            ))}
            <label className="fdtd-file-import">
              <span>Import Aperture Run</span>
              <input aria-label="Import aperture receipt flux and field slice" type="file" accept=".json,.csv" multiple onChange={(event) => void importApertureFiles(event.currentTarget.files)} />
            </label>
            <button type="button" onClick={exportApertureScene}>
              <FileDown size={15} />
              <span>Export Aperture Scene</span>
            </button>
            <button type="button" disabled={!activeApertureReport} onClick={exportApertureDossier}>
              <FileDown size={15} />
              <span>Export Aperture Dossier</span>
            </button>
          </div>
          {apertureImportError && <div className="error-banner">{apertureImportError}</div>}
          <div className="fdtd-grid aperture-validation-grid">
            <div className="maxwell-data-table" aria-label="L8.4 aperture scalar reference smoke preview">
              <div className="maxwell-section-heading">
                <h2>Aperture Scene</h2>
                <strong>{apertureKindLabel(apertureScene.kind)}</strong>
              </div>
              <div className="maxwell-study-list">
                <Stat label="Reference" value={apertureScene.reference.model} />
                <Stat label="Screen model" value={apertureScene.screenModel} />
                <Stat label="Scene hash" value={apertureScene.sceneHash.slice(0, 10)} />
                <Stat label="Manifest hash" value={apertureScene.bundle.manifest.manifestHash.slice(0, 10)} />
                <Stat label="Script hash" value={apertureScene.bundle.script.scriptHash.slice(0, 10)} />
                <Stat label="First minimum" value={apertureScene.reference.expectedFirstMinimumUm === null ? "n/a" : `${formatCompact(apertureScene.reference.expectedFirstMinimumUm)} um`} />
              </div>
            </div>

            <div className="maxwell-data-table" aria-label="L8.4 aperture cells across diagnostics smoke preview">
              <div className="maxwell-section-heading">
                <h2>Resolution Diagnostics</h2>
                <strong>{formatCompact(apertureScene.diagnostics.gridSpacingNm)} nm/cell</strong>
              </div>
              <div className="maxwell-study-list">
                <Stat label="aperture cells across" value={formatCompact(apertureScene.diagnostics.apertureCellsAcross)} />
                <Stat label="thickness cells" value={formatCompact(apertureScene.diagnostics.screenThicknessCells)} />
                <Stat label="PML distance" value={`${formatCompact(apertureScene.diagnostics.pmlDistanceWavelengths)} lambda`} />
                <Stat label="monitor distance" value={`${formatCompact(apertureScene.diagnostics.monitorDistanceWavelengths)} lambda`} />
                <Stat label="minimum in window" value={apertureScene.diagnostics.observationContainsFirstMinimum ? "yes" : "no"} />
                <Stat label="blocked power" value={activeApertureReport ? pct(activeApertureReport.imported.blockedPower) : "pending"} />
              </div>
            </div>

            <div className="maxwell-data-table fdtd-wide" aria-label="L8.4 aperture x-z preview smoke preview">
              <div className="maxwell-section-heading">
                <h2>X-Z Aperture / Blocker Preview</h2>
                <strong>{apertureScene.geometryIds.length} geometry ids</strong>
              </div>
              <SurfaceGeometryCrossSection scenario={apertureScene.scenario} zMin={apertureScene.scenario.grid.zStartMm} zMax={apertureScene.scenario.grid.zEndMm} />
            </div>

            <div className="maxwell-data-table" aria-label="L8.4 aperture field slice smoke preview">
              <div className="maxwell-section-heading">
                <h2>Aperture Field Slice</h2>
                <strong>{activeApertureFieldSlice ? `${activeApertureFieldSlice.xCount} x ${activeApertureFieldSlice.zCount}` : "no import"}</strong>
              </div>
              {activeApertureFieldSlice ? <FdtdFieldSlicePreview slice={activeApertureFieldSlice} /> : <div className="empty-state">No aperture/blocker field slice imported yet.</div>}
            </div>

            <div className="maxwell-data-table" aria-label="L8.4 aperture profile comparison smoke preview">
              <div className="maxwell-section-heading">
                <h2>Scalar Profile Comparison</h2>
                <strong>{activeApertureReport?.reference.model ?? apertureScene.reference.model}</strong>
              </div>
              {activeApertureReport ? (
                <ApertureProfilePreview report={activeApertureReport} />
              ) : (
                <div className="maxwell-study-list">
                  <Stat label="single-slit-sinc2" value={apertureScene.kind === "long-slit" ? "active" : "available"} />
                  <Stat label="airy-bessel" value={apertureScene.kind === "circular-pinhole" ? "active" : "available"} />
                  <Stat label="rectangular-sinc2" value={apertureScene.kind === "rectangular-aperture" ? "active" : "available"} />
                  <Stat label="blocker-shadow-flux" value={apertureScene.kind === "opaque-blocker" ? "active" : "available"} />
                </div>
              )}
            </div>

            <div className="maxwell-data-table" aria-label="L8.4 aperture residual vs resolution smoke preview">
              <div className="maxwell-section-heading">
                <h2>Residual vs Resolution</h2>
                <strong>{apertureConvergence.trend}</strong>
              </div>
              <ApertureConvergenceTable report={apertureConvergence} />
            </div>

            <div className="maxwell-data-table fdtd-wide" aria-label="L8.4 aperture warning smoke preview">
              <div className="maxwell-section-heading">
                <h2>Aperture / PML / Monitor Warnings</h2>
                <strong>{(activeApertureReport?.warnings ?? apertureScene.warnings).length}</strong>
              </div>
              <div className="fdtd-warning-list">
                {(activeApertureReport?.warnings ?? apertureScene.warnings).map((warning, index) => (
                  <span key={`${warning.code}:${warning.elementId ?? ""}:${index}`}>
                    <strong>{warning.code}</strong> {warning.message}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="maxwell-workspace-panel simulation-builder-card simulation-builder-wide" aria-label="L8.2 External FDTD / Field Maps">
          <div className="maxwell-section-heading">
            <h2>L8.2 External FDTD / Field Maps</h2>
            <strong>{fdtdReadinessLabel(fdtdBundle.manifest.readiness.status)}</strong>
          </div>
          <div className="l2-disclosure">
            <strong>External FDTD export/import only.</strong>
            <span>
              Export a manifest and deterministic Meep helper script, then import external run receipt, flux summary, and field-slice CSV evidence. Production FDTD execution stays external;
              arbitrary 3D CAD geometry, curved material lens solving, finite-thickness metal aperture Maxwell solving, FEM/BEM/RCWA, sensor-stack EM, digital twin behavior, and manufacturing
              certification are not implemented.
            </span>
          </div>
          <div className="maxwell-layer-actions simulation-builder-actions fdtd-action-row">
            <button type="button" onClick={exportFdtdManifest}>
              <FileDown size={15} />
              <span>Export FDTD Manifest</span>
            </button>
            <button type="button" onClick={exportFdtdMeepScript}>
              <FileDown size={15} />
              <span>Export Meep Script</span>
            </button>
            <button type="button" onClick={loadTransparentFdtdFixture}>
              <Sparkles size={15} />
              <span>Load Transparent FDTD Fixture</span>
            </button>
            <button type="button" onClick={loadAbsorbingFdtdFixture}>
              <Sparkles size={15} />
              <span>Load Absorbing FDTD Fixture</span>
            </button>
            <label className="fdtd-file-import">
              <span>Import Field Run</span>
              <input aria-label="Import FDTD receipt flux and field slice" type="file" accept=".json,.csv" multiple onChange={(event) => void importFdtdArtifacts(event.currentTarget.files)} />
            </label>
            <button type="button" disabled={!importedFdtd} onClick={exportFdtdImportEvidence}>
              <FileDown size={15} />
              <span>Export FDTD Import Evidence</span>
            </button>
            <button type="button" disabled={!fdtdValidation} onClick={exportFdtdValidationReport}>
              <FileDown size={15} />
              <span>Export FDTD Validation</span>
            </button>
          </div>
          {fdtdImportError && <div className="error-banner">{fdtdImportError}</div>}
          <div className="fdtd-grid">
            <div className="maxwell-data-table" aria-label="L8.1 FDTD export readiness smoke preview">
              <div className="maxwell-study-list">
                <Stat label="Readiness" value={fdtdReadinessLabel(fdtdBundle.manifest.readiness.status)} />
                <Stat label="Scene hash" value={fdtdBundle.manifest.sourceScenarioHash.slice(0, 10)} />
                <Stat label="Manifest hash" value={fdtdBundle.manifest.manifestHash.slice(0, 10)} />
                <Stat label="Grid spacing" value={`${formatCompact(fdtdBundle.manifest.grid.gridSpacingNm)} nm`} />
                <Stat label="Estimated cells" value={formatCompact(fdtdBundle.manifest.grid.estimatedCells)} />
                <Stat label="Geometry blocks" value={String(fdtdBundle.manifest.geometry.length)} />
                <Stat label="Monitors" value={String(fdtdBundle.manifest.monitors.length)} />
                <Stat label="Warnings" value={String(fdtdBundle.manifest.readiness.warnings.length)} />
              </div>
            </div>

            <div className="maxwell-data-table" aria-label="L8.1 Meep script export smoke preview">
              <div className="maxwell-study-list">
                <Stat label="Script hash" value={fdtdBundle.script.scriptHash.slice(0, 10)} />
                <Stat label="Python lines" value={String(fdtdBundle.script.python.split("\n").length)} />
                <Stat label="PML thickness" value={`${formatCompact(fdtdBundle.manifest.boundaries.pmlThicknessUm)} um`} />
                <Stat label="Source component" value={fdtdBundle.manifest.source.component} />
              </div>
              <pre className="fdtd-script-preview">{fdtdBundle.script.python.split("\n").slice(0, 8).join("\n")}</pre>
            </div>

            <div className="maxwell-data-table" aria-label="L8.1 field slice import smoke preview">
              <div className="maxwell-section-heading">
                <h2>Imported Field Slice</h2>
                <strong>{importedFdtd ? `${importedFdtd.fieldSlice.xCount} x ${importedFdtd.fieldSlice.zCount}` : "no import"}</strong>
              </div>
              {importedFdtd ? <FdtdFieldSlicePreview slice={importedFdtd.fieldSlice} /> : <div className="empty-state">No external FDTD field slice imported yet.</div>}
            </div>

            <div className="maxwell-data-table" aria-label="L8.1 FDTD flux validation smoke preview">
              <div className="maxwell-study-list">
                <Stat label="Imported run" value={importedFdtd?.receipt.runId ?? "none"} />
                <Stat label="Validation" value={fdtdValidation?.status ?? "pending"} />
                <Stat label="Imported R/T/A" value={fdtdValidation ? `${pct(fdtdValidation.imported.reflectance)} / ${pct(fdtdValidation.imported.transmittance)} / ${pct(fdtdValidation.imported.absorbance)}` : "n/a"} />
                <Stat label="L8.0 expected R/T/A" value={fdtdValidation ? `${pct(fdtdValidation.expected.reflectance)} / ${pct(fdtdValidation.expected.transmittance)} / ${pct(fdtdValidation.expected.absorbance)}` : "n/a"} />
                <Stat label="Energy balance" value={fdtdValidation ? `${formatCompact(fdtdValidation.energyBalance)} (${formatCompact(fdtdValidation.residuals.energyBalance)} residual)` : "n/a"} />
                <Stat label="Report hash" value={fdtdValidation?.reportHash.slice(0, 10) ?? "n/a"} />
              </div>
            </div>

            <div className="maxwell-data-table fdtd-wide" aria-label="L8.1 unsupported geometry warning smoke preview">
              <div className="maxwell-section-heading">
                <h2>FDTD Boundary / Unsupported Geometry</h2>
                <strong>{fdtdBundle.manifest.readiness.unsupported.length} blocked</strong>
              </div>
              <div className="fdtd-warning-list">
                {fdtdBundle.manifest.readiness.unsupported.length === 0 ? (
                  <span>No blocked geometry in the current export. Placement-only scalar elements and large grids may still emit warnings.</span>
                ) : (
                  fdtdBundle.manifest.readiness.unsupported.map((item) => (
                    <span key={item.id}>
                      <strong>{item.label}</strong> {item.reason}
                    </span>
                  ))
                )}
                {fdtdBundle.manifest.readiness.warnings.map((warning) => (
                  <span key={`${warning.code}:${warning.elementId ?? ""}`}>
                    <strong>{warning.code}</strong> {warning.message}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="fdtd-verification-suite l89-real-run-suite" aria-label="L8.9 real external FDTD run ingestion smoke preview">
            <div className="maxwell-section-heading">
              <h2>L8.9 Real External FDTD Run Ingestion</h2>
              <strong>{l89Comparison?.status ?? l89Validation?.status ?? fdtdReadinessLabel(l89RunPack.bundle.manifest.readiness.status)}</strong>
            </div>
            <div className="l2-disclosure">
              <strong>Export pack, run Meep locally, import receipts, compare, and promote evidence.</strong>
              <span>
                The pack includes scene_manifest.json, meep_scene.py, expected_reference.json, run_config.json, material_receipts.json, monitor_receipts.json, README.md,
                reproduce.sh, reproduce.ps1, postprocess.py, and requirements-meep.txt. Meep/Python stay local to the user machine; npm tests, the browser runtime, and GitHub Pages do not execute FDTD.
                Browser FDTD, arbitrary 3D Maxwell/FDTD/FEM/BEM/RCWA/CAD physics, production solver certification, digital twins, hardware control, and manufacturing certification are not implemented.
              </span>
            </div>
            <div className="maxwell-layer-actions simulation-builder-actions fdtd-action-row">
              <button type="button" onClick={exportL89RunPack}>
                <FileDown size={15} />
                <span>Export Real Run Pack</span>
              </button>
              <button type="button" onClick={() => loadL89Fixture("transparent-slab")}>
                <Sparkles size={15} />
                <span>Load Transparent Real Run Fixture</span>
              </button>
              <button type="button" onClick={() => loadL89Fixture("aperture-blocker")}>
                <Sparkles size={15} />
                <span>Load Aperture Real Run Fixture</span>
              </button>
              <button type="button" onClick={() => loadL89Fixture("hash-mismatch")}>
                <Sparkles size={15} />
                <span>Load Hash-Mismatch Fixture</span>
              </button>
              <label className="fdtd-file-import">
                <span>Import Real Run Bundle</span>
                <input aria-label="Import L8.9 real external FDTD run bundle" type="file" accept=".json,.csv" multiple onChange={(event) => void importL89RunFiles(event.currentTarget.files)} />
              </label>
              <button type="button" disabled={!l89RunBundle} onClick={exportL89ImportedBundle}>
                <FileDown size={15} />
                <span>Export Imported Real Run</span>
              </button>
              <button type="button" disabled={!l89Comparison || l89Comparison.status !== "pass"} onClick={() => promoteL89Run(false)}>
                <Sparkles size={15} />
                <span>Promote to Engineering Evidence Campaign</span>
              </button>
              <button type="button" disabled={!l89Comparison || l89Comparison.status === "fail"} onClick={() => promoteL89Run(true)}>
                <Sparkles size={15} />
                <span>Accept Warnings + Promote</span>
              </button>
              <button type="button" onClick={exportL89ReproducibilityReport}>
                <FileDown size={15} />
                <span>Export Reproducibility Report</span>
              </button>
            </div>
            {l89ImportError && <div className="error-banner">{l89ImportError}</div>}
            <div className="fdtd-grid">
              <div className="maxwell-data-table" aria-label="L8.9 real run pack receipt smoke preview">
                <div className="maxwell-section-heading">
                  <h2>Run Pack Receipts</h2>
                  <strong>{l89RunPack.packHash.slice(0, 10)}</strong>
                </div>
                <div className="maxwell-study-list">
                  <Stat label="Scene hash" value={l89RunPack.sourceScenarioHash.slice(0, 10)} />
                  <Stat label="Manifest hash" value={l89RunPack.manifestHash.slice(0, 10)} />
                  <Stat label="Script hash" value={l89RunPack.scriptHash.slice(0, 10)} />
                  <Stat label="Material hash" value={l89RunPack.materialHash.slice(0, 10)} />
                  <Stat label="Monitor hash" value={l89RunPack.monitorHash.slice(0, 10)} />
                  <Stat label="Run config" value={l89RunPack.runConfigHash.slice(0, 10)} />
                </div>
              </div>

              <div className="maxwell-data-table" aria-label="L8.9 local run instructions smoke preview">
                <div className="maxwell-section-heading">
                  <h2>Local Run Contract</h2>
                  <strong>{l89RunPack.runConfig.requiredMonitorIds.length} monitors</strong>
                </div>
                <div className="maxwell-study-list">
                  <Stat label="Resolution" value={String(l89RunPack.runConfig.resolution)} />
                  <Stat label="Until" value={String(l89RunPack.runConfig.until)} />
                  <Stat label="PML" value={`${formatCompact(l89RunPack.runConfig.pmlThicknessUm)} um`} />
                  <Stat label="Field slice" value={l89RunPack.runConfig.fieldSliceId} />
                  <Stat label="Required files" value={String(l89RunPack.runConfig.outputFiles.length)} />
                  <Stat label="Install" value="requirements-meep.txt" />
                </div>
                <pre className="fdtd-script-preview">{[l89RunPack.commands.install, l89RunPack.commands.run, l89RunPack.commands.postprocess].join("\n")}</pre>
              </div>

              <div className="maxwell-data-table" aria-label="L8.9 imported real run receipt smoke preview">
                <div className="maxwell-section-heading">
                  <h2>Imported Real Run</h2>
                  <strong>{l89RunBundle?.receipt.runId ?? "no import"}</strong>
                </div>
                <div className="maxwell-study-list">
                  <Stat label="Tool" value={l89RunBundle ? `${l89RunBundle.receipt.tool.name} ${l89RunBundle.receipt.tool.version}` : "n/a"} />
                  <Stat label="Files" value={l89RunBundle ? String(l89RunBundle.postprocessLog.files.length) : "n/a"} />
                  <Stat label="Energy balance" value={l89RunBundle ? `${formatCompact(l89RunBundle.energyBalance.rtaSum)} (${l89RunBundle.energyBalance.status})` : "n/a"} />
                  <Stat label="Field preview" value={l89RunBundle ? `${l89RunBundle.fieldPreview.width} x ${l89RunBundle.fieldPreview.height}` : "n/a"} />
                  <Stat label="Bundle hash" value={l89RunBundle?.bundleHash.slice(0, 10) ?? "n/a"} />
                </div>
              </div>

              <div className="maxwell-data-table" aria-label="L8.9 receipt hash validation smoke preview">
                <div className="maxwell-section-heading">
                  <h2>Hash Validation</h2>
                  <strong>{l89Validation?.status ?? "pending"}</strong>
                </div>
                <div className="maxwell-study-list">
                  <Stat label="Material hash" value={l89Validation?.materialHashStatus ?? "pending"} />
                  <Stat label="Monitor hash" value={l89Validation?.monitorHashStatus ?? "pending"} />
                  <Stat label="Run config hash" value={l89Validation?.runConfigHashStatus ?? "pending"} />
                  <Stat label="Required files" value={l89Validation?.requiredFilesStatus ?? "pending"} />
                  <Stat label="Required monitors" value={l89Validation?.requiredMonitorsStatus ?? "pending"} />
                  <Stat label="Receipt hashes" value={l89Validation?.receiptStatus ?? "pending"} />
                </div>
              </div>

              <div className="maxwell-data-table" aria-label="L8.9 RTA comparison smoke preview">
                <div className="maxwell-section-heading">
                  <h2>Reference Comparison</h2>
                  <strong>{l89Comparison?.status ?? "pending"}</strong>
                </div>
                <div className="maxwell-study-list">
                  <Stat label="Expected R/T/A" value={`${pct(l89RunPack.expectedReference.expected.reflectance)} / ${pct(l89RunPack.expectedReference.expected.transmittance)} / ${pct(l89RunPack.expectedReference.expected.absorbance)}`} />
                  <Stat label="Imported R/T/A" value={l89RunBundle ? `${pct(l89RunBundle.flux.reflectance)} / ${pct(l89RunBundle.flux.transmittance)} / ${pct(l89RunBundle.flux.absorbance)}` : "n/a"} />
                  <Stat label="R/T/A delta" value={l89Comparison ? `${formatCompact(l89Comparison.rtaDelta.reflectance)} / ${formatCompact(l89Comparison.rtaDelta.transmittance)} / ${formatCompact(l89Comparison.rtaDelta.absorbance)}` : "n/a"} />
                  <Stat label="Energy delta" value={l89Comparison ? formatCompact(l89Comparison.energyBalanceDelta) : "n/a"} />
                  <Stat label="Field RMS delta" value={l89Comparison ? formatCompact(l89Comparison.fieldSliceRmsDelta) : "n/a"} />
                  <Stat label="Reference residual" value={l89Comparison ? formatCompact(l89Comparison.referenceResidual) : "n/a"} />
                </div>
              </div>

              <div className="maxwell-data-table" aria-label="L8.9 evidence promotion smoke preview">
                <div className="maxwell-section-heading">
                  <h2>Evidence Promotion</h2>
                  <strong>{activeL89Promotion ? (activeL89Promotion.acceptedWithWarnings ? "accepted with warnings" : "accepted") : "not promoted"}</strong>
                </div>
                <div className="maxwell-study-list">
                  <Stat label="Campaign target" value={activeL89Promotion?.campaignTarget ?? "Engineering Evidence Campaign"} />
                  <Stat label="Promotion hash" value={activeL89Promotion?.promotionHash.slice(0, 10) ?? "n/a"} />
                  <Stat label="Validation hash" value={l89Validation?.validationHash.slice(0, 10) ?? "n/a"} />
                  <Stat label="Comparison hash" value={l89Comparison?.comparisonHash.slice(0, 10) ?? "n/a"} />
                  <Stat label="Report hash" value={l89Report.reportHash.slice(0, 10)} />
                </div>
              </div>

              <div className="maxwell-data-table" aria-label="L8.9 real run field preview smoke preview">
                <div className="maxwell-section-heading">
                  <h2>Real Run Field / Intensity</h2>
                  <strong>{l89RunBundle ? `${l89RunBundle.fieldSlice.xCount} x ${l89RunBundle.fieldSlice.zCount}` : "no import"}</strong>
                </div>
                {l89RunBundle ? <FdtdFieldSlicePreview slice={l89RunBundle.fieldSlice} /> : <div className="empty-state">Import a real run bundle or load an L8.9 fixture to inspect field/intensity slices.</div>}
              </div>

              <div className="maxwell-data-table fdtd-wide" aria-label="L8.9 run warnings and boundaries smoke preview">
                <div className="maxwell-section-heading">
                  <h2>Real Run Warnings / Boundary</h2>
                  <strong>{l89Report.warnings.length} warnings</strong>
                </div>
                <div className="fdtd-warning-list">
                  {l89Report.warnings.length === 0 ? <span>No L8.9 real-run warnings for the active pack/import.</span> : l89Report.warnings.map((warning, index) => (
                    <span key={`${warning.code}:${warning.elementId ?? ""}:${index}`}>
                      <strong>{warning.code}</strong> {warning.message}
                    </span>
                  ))}
                  {l89Report.boundary.slice(0, 3).map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="fdtd-verification-suite" aria-label="L8.2 FDTD benchmark suite smoke preview">
            <div className="maxwell-section-heading">
              <h2>L8.2 FDTD Verification Suite</h2>
              <strong>{fdtdConvergence?.status ?? "ready"}</strong>
            </div>
            <div className="l2-disclosure">
              <strong>Benchmark convergence evidence, not new in-browser physics.</strong>
              <span>
                Generate bounded external FDTD benchmark packs, import convergence summaries, compare against flux conservation, Fresnel/TMM, Beer-Lambert, or mirror references, and flag residual,
                energy-balance, trend, and PML sensitivity issues. Production browser FDTD execution, arbitrary 3D Maxwell/CAD solving, FEM/BEM/RCWA, curved material lens solving, and production solver
                validation are not implemented.
              </span>
            </div>
            <div className="simulation-field-grid fdtd-verification-controls">
              <label>
                <span>Benchmark</span>
                <select aria-label="FDTD benchmark" value={benchmarkKind} onChange={(event) => selectBenchmarkKind(event.currentTarget.value as FdtdBenchmarkKind)}>
                  <option value="empty-space">empty space</option>
                  <option value="transparent-interface">transparent interface</option>
                  <option value="transparent-slab">transparent slab</option>
                  <option value="absorbing-slab">absorbing slab</option>
                  <option value="mirror">ideal mirror</option>
                </select>
              </label>
              <button type="button" onClick={() => setHasGeneratedBenchmarkPlan(true)}>
                <Sparkles size={15} />
                <span>Generate Sweep Plan</span>
              </button>
              <button type="button" onClick={exportFdtdBenchmarkPack}>
                <FileDown size={15} />
                <span>Export Benchmark Pack</span>
              </button>
              <button type="button" onClick={() => loadFdtdBenchmarkFixture("transparent-interface")}>
                <Sparkles size={15} />
                <span>Load Transparent Convergence Fixture</span>
              </button>
              <button type="button" onClick={() => loadFdtdBenchmarkFixture("absorbing-slab")}>
                <Sparkles size={15} />
                <span>Load Absorber Convergence Fixture</span>
              </button>
              <label className="fdtd-file-import">
                <span>Import Convergence</span>
                <input aria-label="Import FDTD convergence summary" type="file" accept=".json" multiple onChange={(event) => void importFdtdConvergence(event.currentTarget.files)} />
              </label>
              <button type="button" disabled={!fdtdConvergence} onClick={exportFdtdBenchmarkDossier}>
                <FileDown size={15} />
                <span>Export Benchmark Dossier</span>
              </button>
            </div>
            {fdtdConvergenceError && <div className="error-banner">{fdtdConvergenceError}</div>}

            <div className="fdtd-grid">
              <div className="maxwell-data-table" aria-label="L8.2 sweep plan smoke preview">
                <div className="maxwell-section-heading">
                  <h2>Sweep Plan</h2>
                  <strong>{hasGeneratedBenchmarkPlan ? `${fdtdBenchmarkPack.sweepPlan.runCount} runs` : "pending"}</strong>
                </div>
                <div className="maxwell-study-list">
                  <Stat label="Reference" value={fdtdBenchmarkPack.benchmarkManifest.reference.referenceModel} />
                  <Stat label="Expected R/T/A" value={`${pct(fdtdBenchmarkPack.benchmarkManifest.reference.expected.reflectance)} / ${pct(fdtdBenchmarkPack.benchmarkManifest.reference.expected.transmittance)} / ${pct(fdtdBenchmarkPack.benchmarkManifest.reference.expected.absorbance)}`} />
                  <Stat label="Resolution ppw" value={fdtdBenchmarkPack.sweepPlan.settings.resolutionPointsPerWavelength.join(", ")} />
                  <Stat label="PML um" value={fdtdBenchmarkPack.sweepPlan.settings.pmlThicknessUm.join(", ")} />
                  <Stat label="Padding lambda" value={fdtdBenchmarkPack.sweepPlan.settings.paddingWavelengths.join(", ")} />
                  <Stat label="Sweep hash" value={fdtdBenchmarkPack.sweepPlan.sweepHash.slice(0, 10)} />
                </div>
                <div className="fdtd-sweep-table">
                  <div className="fdtd-sweep-row fdtd-sweep-header">
                    <span>run</span>
                    <span>ppw</span>
                    <span>PML</span>
                    <span>pad</span>
                    <span>cells</span>
                  </div>
                  {fdtdBenchmarkPack.sweepPlan.runs.slice(0, 6).map((run) => (
                    <div className="fdtd-sweep-row" key={run.runId}>
                      <span>{run.index + 1}</span>
                      <span>{run.resolutionPointsPerWavelength}</span>
                      <span>{formatCompact(run.pmlThicknessUm)}</span>
                      <span>{formatCompact(run.paddingWavelengths)}</span>
                      <span>{formatCompact(run.estimatedCells)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="maxwell-data-table" aria-label="L8.2 convergence import smoke preview">
                <div className="maxwell-section-heading">
                  <h2>Convergence Summary</h2>
                  <strong>{fdtdConvergence?.status ?? "no import"}</strong>
                </div>
                <div className="maxwell-study-list">
                  <Stat label="Benchmark" value={fdtdConvergence ? benchmarkDisplayName(fdtdConvergence.benchmarkKind) : benchmarkDisplayName(benchmarkKind)} />
                  <Stat label="Trend" value={fdtdConvergence?.trend.status ?? "pending"} />
                  <Stat label="Final residual" value={fdtdConvergence ? formatCompact(fdtdConvergence.trend.finalReferenceResidual) : "n/a"} />
                  <Stat label="Energy error" value={fdtdConvergence ? formatCompact(fdtdConvergence.trend.finalEnergyBalanceError) : "n/a"} />
                  <Stat label="PML sensitivity" value={fdtdConvergence ? `${formatCompact(fdtdConvergence.pmlSensitivity.maxDelta)} (${fdtdConvergence.pmlSensitivity.status})` : "n/a"} />
                  <Stat label="Summary hash" value={fdtdConvergence?.summaryHash.slice(0, 10) ?? "n/a"} />
                </div>
              </div>

              <div className="maxwell-data-table" aria-label="L8.2 Fresnel convergence smoke preview">
                <div className="maxwell-section-heading">
                  <h2>Residual vs Resolution</h2>
                  <strong>{fdtdConvergence ? fdtdConvergence.trend.status : "pending"}</strong>
                </div>
                {fdtdConvergence ? <FdtdConvergenceTrendTable summary={fdtdConvergence} /> : <div className="empty-state">Load or import a convergence summary to inspect residual-vs-resolution evidence.</div>}
              </div>

              <div className="maxwell-data-table" aria-label="L8.2 absorber convergence smoke preview">
                <div className="maxwell-section-heading">
                  <h2>Reference Comparison</h2>
                  <strong>{fdtdConvergence?.reference.referenceModel ?? fdtdBenchmarkPack.benchmarkManifest.reference.referenceModel}</strong>
                </div>
                <div className="maxwell-study-list">
                  <Stat label="Invariant" value={fdtdConvergence?.reference.invariant ?? fdtdBenchmarkPack.benchmarkManifest.reference.invariant} />
                  <Stat label="Pass residual" value={formatCompact(fdtdBenchmarkPack.benchmarkManifest.reference.thresholds.referenceResidualPass)} />
                  <Stat label="Warning residual" value={formatCompact(fdtdBenchmarkPack.benchmarkManifest.reference.thresholds.referenceResidualWarning)} />
                  <Stat label="Field delta warn" value={formatCompact(fdtdBenchmarkPack.benchmarkManifest.reference.thresholds.fieldDeltaWarning)} />
                </div>
              </div>

              <div className="maxwell-data-table fdtd-wide" aria-label="L8.2 PML warning smoke preview">
                <div className="maxwell-section-heading">
                  <h2>PML / Stability Warnings</h2>
                  <strong>{fdtdConvergence?.warnings.length ?? fdtdBenchmarkPack.sweepPlan.warnings.length}</strong>
                </div>
                <div className="fdtd-warning-list">
                  {(fdtdConvergence?.warnings.length ? fdtdConvergence.warnings : fdtdBenchmarkPack.sweepPlan.warnings).map((warning, index) => (
                    <span key={`${warning.code}:${warning.elementId ?? ""}:${index}`}>
                      <strong>{warning.code}</strong> {warning.message}
                    </span>
                  ))}
                  {!fdtdConvergence && fdtdBenchmarkPack.sweepPlan.warnings.length === 0 && <span>No convergence warning imported yet.</span>}
                </div>
              </div>

              <div className="maxwell-data-table fdtd-wide" aria-label="L8.2 convergence run table smoke preview">
                <div className="maxwell-section-heading">
                  <h2>Run Residual Table</h2>
                  <strong>{fdtdConvergence ? `${fdtdConvergence.runs.length} runs` : "pending"}</strong>
                </div>
                {fdtdConvergence ? <FdtdConvergenceRunsTable summary={fdtdConvergence} /> : <div className="empty-state">No convergence run table imported yet.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="simulation-builder-footer">
        <div className="maxwell-workspace-panel simulation-builder-card" aria-label="L8.0 capabilities matrix delta">
          <div className="maxwell-section-heading">
            <h2>Capability Tags</h2>
            <strong>explicit</strong>
          </div>
          <div className="simulation-capability-list">
            {result.capabilitySummary.slice(0, 8).map((capability) => (
              <div className="compact-stat" key={capability.id}>
                <span>{capability.label}</span>
                <strong>{capability.status}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="maxwell-workspace-panel simulation-builder-card" aria-label="What has been added since first review?">
          <div className="maxwell-section-heading">
            <h2>What has been added since first review?</h2>
            <strong>runnable milestones</strong>
          </div>
          <div className="l2-disclosure">
            <strong>Iteration count is not validation.</strong>
            <span>Each item below maps to a runnable benchmark, report, or workflow category.</span>
          </div>
          <div className="simulation-release-trail">
            {l80ReleaseTrail.map((item) => (
              <div className="compact-stat" key={item.milestone}>
                <span>{item.milestone} {item.label}</span>
                <strong>{item.runnable}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function L86ToleranceRunnerPanel(props: {
  report: ToleranceAnalysisReport;
  mode: ToleranceRunMode;
  variations: ToleranceVariationSpec[];
  thresholds: ToleranceThreshold[];
  selectedElement: SimulationBuilderElement | null;
  sweepManifest: ToleranceFdtdSweepManifest;
  fdtdSummary: ToleranceFdtdSweepSummary | null;
  fdtdWarnings: SolverWarning[];
  fdtdImportError: string | null;
  onMode: (mode: ToleranceRunMode) => void;
  onReset: () => void;
  onToggleVariation: (specId: string) => void;
  onVariationDelta: (specId: string, delta: number) => void;
  onAddSourceWavelength: () => void;
  onAddSelectedVariation: (property: ToleranceVariationProperty) => void;
  onToggleThreshold: (thresholdId: string) => void;
  onThreshold: (thresholdId: string, value: number) => void;
  onExportReport: () => void;
  onExportFdtdSweep: () => void;
  onImportBundledFdtdSummary: () => void;
  onImportFdtdSummaryFiles: (files: FileList | null) => void | Promise<void>;
}) {
  const runCount = props.report.runs.length + 1;
  const topSensitivity = props.report.sensitivity[0];
  return (
    <div className="maxwell-data-table l85-wide l86-tolerance-panel" aria-label="L8.6 process tolerance runner smoke preview">
      <div className="maxwell-section-heading">
        <h2>L8.6 Process / Tolerance Runner</h2>
        <strong>{props.report.passRate >= 1 ? "pass" : props.report.failingCases.length > 0 ? "fail cases" : "warnings"}</strong>
      </div>
      <div className="l2-disclosure">
        <strong>Diagnostic process variation over the current editable bench scene.</strong>
        <span>
          Assign source, placement, material, and geometry tolerances; run deterministic one-at-a-time, grid, or seeded studies; inspect sensitivity, worst cases, pass/fail, and external FDTD sweep evidence.
          This is not certified tolerancing, auto redesign, inverse optimization, browser FDTD, arbitrary 3D Maxwell, FEM/BEM/RCWA, production EM solving, digital twin behavior, or manufacturing certification.
        </span>
      </div>
      <div className="maxwell-layer-actions simulation-builder-actions l86-action-row">
        <button type="button" onClick={props.onReset}>
          <Sparkles size={15} />
          <span>Load L8.6 Demo Tolerances</span>
        </button>
        {(["one-at-a-time", "deterministic-grid", "seeded-samples"] as const).map((mode) => (
          <button type="button" key={mode} className={props.mode === mode ? "active" : ""} onClick={() => props.onMode(mode)}>
            <Sparkles size={15} />
            <span>{mode === "one-at-a-time" ? "Run One-at-a-Time" : mode === "deterministic-grid" ? "Run Deterministic Grid" : "Run Seeded Samples"}</span>
          </button>
        ))}
        <button type="button" onClick={props.onAddSourceWavelength}>
          <Plus size={15} />
          <span>Add Source Wavelength</span>
        </button>
        <button type="button" onClick={() => props.onAddSelectedVariation("xUm")} disabled={!props.selectedElement}>
          <Plus size={15} />
          <span>Add Selected x</span>
        </button>
        <button type="button" onClick={() => props.onAddSelectedVariation("zMm")} disabled={!props.selectedElement}>
          <Plus size={15} />
          <span>Add Selected z</span>
        </button>
        <button type="button" onClick={() => props.onAddSelectedVariation("thicknessUm")} disabled={!props.selectedElement}>
          <Plus size={15} />
          <span>Add Selected Thickness</span>
        </button>
        <button type="button" onClick={() => props.onAddSelectedVariation("materialIndex")} disabled={!props.selectedElement}>
          <Plus size={15} />
          <span>Add Selected n</span>
        </button>
        <button type="button" onClick={props.onExportReport}>
          <FileDown size={15} />
          <span>Export Tolerance Report</span>
        </button>
        <button type="button" onClick={props.onExportFdtdSweep}>
          <FileDown size={15} />
          <span>Export FDTD Sweep Pack</span>
        </button>
        <button type="button" onClick={props.onImportBundledFdtdSummary}>
          <Sparkles size={15} />
          <span>Import Bundled FDTD Sweep</span>
        </button>
        <label className="l86-file-import">
          <span>Import Sweep JSON</span>
          <input aria-label="Import FDTD tolerance sweep summary" type="file" accept="application/json,.json" onChange={(event) => void props.onImportFdtdSummaryFiles(event.currentTarget.files)} />
        </label>
      </div>

      <div className="l86-summary-grid">
        <Stat label="Variation hash" value={props.report.variationHash.slice(0, 10)} />
        <Stat label="Run count" value={String(runCount)} />
        <Stat label="Pass rate" value={pct(props.report.passRate)} />
        <Stat label="Worst case" value={props.report.worstCase.label} />
        <Stat label="Top driver" value={topSensitivity ? `${topSensitivity.label} / ${metricLabel(topSensitivity.metric)}` : "n/a"} />
        <Stat label="FDTD sweep cases" value={String(props.sweepManifest.caseCount)} />
      </div>

      <div className="l86-layout">
        <div className="l86-card" aria-label="L8.6 variation parameter setup smoke preview">
          <div className="maxwell-section-heading">
            <h3>Variation Parameters</h3>
            <strong>{props.variations.filter((spec) => spec.enabled).length} enabled</strong>
          </div>
          <div className="l86-variation-table">
            <div className="l86-variation-row l86-header">
              <span>on</span>
              <span>variation</span>
              <span>target</span>
              <span>+/- delta</span>
              <span>unit</span>
            </div>
            {props.variations.map((spec) => (
              <div className="l86-variation-row" key={spec.id}>
                <input aria-label={`Enable ${spec.label}`} type="checkbox" checked={spec.enabled} onChange={() => props.onToggleVariation(spec.id)} />
                <strong>{spec.label}</strong>
                <span>{spec.targetKind}:{spec.targetId}</span>
                <input
                  aria-label={`${spec.label} delta`}
                  type="number"
                  disabled={spec.model.kind !== "plus-minus"}
                  value={spec.model.kind === "plus-minus" ? spec.model.delta : 0}
                  step={spec.application === "relative" ? 0.005 : spec.unit === "mm" ? 0.01 : 0.25}
                  onChange={(event) => props.onVariationDelta(spec.id, Number(event.currentTarget.value))}
                />
                <em>{spec.application === "relative" ? "relative" : spec.unit}</em>
              </div>
            ))}
          </div>
        </div>

        <div className="l86-card" aria-label="L8.6 metrics requirements smoke preview">
          <div className="maxwell-section-heading">
            <h3>Metrics / Requirements</h3>
            <strong>{props.thresholds.filter((threshold) => threshold.enabled).length} active</strong>
          </div>
          <div className="l86-threshold-table">
            {props.thresholds.map((threshold) => (
              <label className="l86-threshold-row" key={threshold.id}>
                <input aria-label={`Enable ${threshold.label}`} type="checkbox" checked={threshold.enabled} onChange={() => props.onToggleThreshold(threshold.id)} />
                <span>{metricLabel(threshold.metric)}</span>
                <em>{threshold.direction}</em>
                <input aria-label={`${threshold.label} threshold`} type="number" value={threshold.pass} step={threshold.metric === "centroidShiftAbsUm" ? 0.5 : 0.01} onChange={(event) => props.onThreshold(threshold.id, Number(event.currentTarget.value))} />
              </label>
            ))}
          </div>
        </div>

        <div className="l86-card" aria-label="L8.6 sensitivity table smoke preview">
          <div className="maxwell-section-heading">
            <h3>Sensitivity Ranking</h3>
            <strong>{props.report.sensitivity.length} rows</strong>
          </div>
          <div className="l86-sensitivity-table">
            <div className="l86-sensitivity-row l86-header">
              <span>driver</span>
              <span>metric</span>
              <span>delta</span>
              <span>slope</span>
            </div>
            {props.report.sensitivity.slice(0, 8).map((row) => (
              <div className="l86-sensitivity-row" key={`${row.specId}:${row.metric}`}>
                <strong>{row.label}</strong>
                <span>{metricLabel(row.metric)}</span>
                <span>{formatCompact(row.delta)}</span>
                <span>{formatCompact(row.slopePerUnit)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="l86-card" aria-label="L8.6 worst case pass fail smoke preview">
          <div className="maxwell-section-heading">
            <h3>Run Table / Worst Cases</h3>
            <strong>{props.report.failingCases.length} failing</strong>
          </div>
          <div className="l86-run-table">
            <div className="l86-run-row l86-header">
              <span>run</span>
              <span>status</span>
              <span>peak</span>
              <span>centroid</span>
              <span>flux</span>
            </div>
            {[props.report.nominalRun, ...props.report.runs].slice(0, 10).map((run) => (
              <div className={`l86-run-row l86-run-${run.status}`} key={run.id}>
                <strong>{run.label}</strong>
                <span>{run.status}</span>
                <span>{formatCompact(run.metrics.peakIntensity)}</span>
                <span>{formatCompact(run.metrics.centroidShiftAbsUm)}</span>
                <span>{formatCompact(run.metrics.transmittedFlux)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="l86-card l86-wide-card" aria-label="L8.6 external FDTD sweep pack smoke preview">
          <div className="maxwell-section-heading">
            <h3>External FDTD Variation Sweep</h3>
            <strong>{props.fdtdSummary ? "summary imported" : "manifest ready"}</strong>
          </div>
          <div className="l86-summary-grid">
            <Stat label="Manifest hash" value={props.sweepManifest.manifestHash.slice(0, 10)} />
            <Stat label="Variation hash" value={props.sweepManifest.variationHash.slice(0, 10)} />
            <Stat label="Case count" value={String(props.sweepManifest.caseCount)} />
            <Stat label="Imported rows" value={String(props.fdtdSummary?.results.length ?? 0)} />
          </div>
          <div className="fdtd-warning-list">
            {props.fdtdSummary && <span><strong>summary</strong> {props.fdtdSummary.summaryHash.slice(0, 12)} imported with {props.fdtdSummary.results.filter((row) => row.status === "pass").length} passing rows.</span>}
            {props.fdtdWarnings.map((warning, index) => <span key={`${warning.code}:${index}`}><strong>{warning.code}</strong> {warning.message}</span>)}
            {props.fdtdImportError && <span><strong>import error</strong> {props.fdtdImportError}</span>}
            {!props.fdtdSummary && <span><strong>boundary</strong> Export/import only. Production FDTD execution stays external and does not certify tolerance sweeps.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function L87RobustDesignAdvisorPanel(props: {
  report: RobustDesignAdvisorReport;
  rankingMode: RobustDesignRankingMode;
  permissions: RobustDesignVariablePermission[];
  fdtdManifest: RobustFdtdCandidateSweepManifest;
  fdtdSummary: RobustFdtdCandidateSweepSummary | null;
  fdtdWarnings: SolverWarning[];
  fdtdImportError: string | null;
  onRankingMode: (mode: RobustDesignRankingMode) => void;
  onPermission: (specId: string, patch: Partial<RobustDesignVariablePermission>) => void;
  onResetPermissions: () => void;
  onApplyCandidate: (candidate: RobustDesignCandidate) => void;
  onExportReport: () => void;
  onExportFdtdSweep: () => void;
  onImportBundledFdtdSummary: () => void;
  onImportFdtdSummaryFiles: (files: FileList | null) => void | Promise<void>;
}) {
  const best = props.report.bestCandidate;
  const bestDelta = best?.comparison.passRateDelta ?? 0;
  const rankingModes: RobustDesignRankingMode[] = ["weighted", "worst-case", "p90", "pass-rate", "expected", "improvement-per-cost"];
  return (
    <div className="maxwell-data-table l85-wide l87-robust-panel" aria-label="L8.7 robust design advisor smoke preview">
      <div className="maxwell-section-heading">
        <h2>L8.7 Robust Design Advisor</h2>
        <strong>{best ? "candidate ready" : "diagnostic"}</strong>
      </div>
      <div className="l2-disclosure">
        <strong>Tolerance-to-action guidance over the current L8.6 result.</strong>
        <span>
          Rank practical recentering, tolerance tightening, tolerance relaxation, and robust-grid candidates with cost-aware comparison.
          This is diagnostic robust-design guidance only, not certified optical tolerancing, automatic final design approval, full inverse design, browser FDTD, arbitrary 3D Maxwell, FEM/BEM/RCWA, production EM solving, digital twin behavior, or manufacturing certification.
        </span>
      </div>

      <div className="maxwell-layer-actions simulation-builder-actions l87-action-row">
        <label className="l87-select-field">
          <span>Ranking</span>
          <select value={props.rankingMode} onChange={(event) => props.onRankingMode(event.currentTarget.value as RobustDesignRankingMode)}>
            {rankingModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
          </select>
        </label>
        <button type="button" onClick={props.onResetPermissions}>
          <Sparkles size={15} />
          <span>Reset Cost / Locks</span>
        </button>
        <button type="button" onClick={props.onExportReport}>
          <FileDown size={15} />
          <span>Export Robust Design Report</span>
        </button>
        <button type="button" onClick={props.onExportFdtdSweep}>
          <FileDown size={15} />
          <span>Export Candidate FDTD Sweep</span>
        </button>
        <button type="button" onClick={props.onImportBundledFdtdSummary}>
          <Sparkles size={15} />
          <span>Import Bundled Candidate Sweep</span>
        </button>
        <label className="l87-file-import">
          <span>Import Candidate Sweep JSON</span>
          <input aria-label="Import robust candidate sweep summary" type="file" accept="application/json,.json" onChange={(event) => void props.onImportFdtdSummaryFiles(event.currentTarget.files)} />
        </label>
      </div>

      <div className="l87-summary-grid">
        <Stat label="Baseline pass rate" value={pct(props.report.baselineEvaluation.passRate)} />
        <Stat label="Best candidate" value={best?.label ?? "none"} />
        <Stat label="Pass-rate delta" value={pct(bestDelta)} />
        <Stat label="Worst-case improvement" value={formatCompact(best?.comparison.worstCaseImprovement ?? 0)} />
        <Stat label="P90 improvement" value={formatCompact(best?.comparison.p90Improvement ?? 0)} />
        <Stat label="Recommendations" value={String(props.report.recommendations.length)} />
      </div>

      <div className="l87-layout">
        <div className="l87-card l87-wide-card" aria-label="L8.7 robust advisor recommendations smoke preview">
          <div className="maxwell-section-heading">
            <h3>Ranked Recommendations</h3>
            <strong>{props.report.recommendations.length} actions</strong>
          </div>
          <div className="l87-recommendation-table">
            <div className="l87-recommendation-row l87-header">
              <span>action</span>
              <span>why</span>
              <span>metric</span>
              <span>improve/cost</span>
              <span>confidence</span>
            </div>
            {props.report.recommendations.slice(0, 8).map((item) => (
              <div className="l87-recommendation-row" key={item.id}>
                <strong>{item.label}</strong>
                <span>{item.why}</span>
                <span>{metricLabel(item.metric)}</span>
                <span>{formatCompact(item.improvementPerCost)}</span>
                <em>{item.confidence}</em>
              </div>
            ))}
          </div>
        </div>

        <div className="l87-card l87-wide-card" aria-label="L8.7 candidate comparison smoke preview">
          <div className="maxwell-section-heading">
            <h3>Baseline vs Candidate Comparison</h3>
            <strong>{props.report.candidates.length} candidates</strong>
          </div>
          <div className="l87-candidate-table">
            <div className="l87-candidate-row l87-header">
              <span>candidate</span>
              <span>kind</span>
              <span>pass delta</span>
              <span>worst</span>
              <span>p90</span>
              <span>cost</span>
              <span>action</span>
            </div>
            {props.report.candidates.slice(0, 8).map((candidate) => (
              <div className="l87-candidate-row" key={candidate.id}>
                <strong>{candidate.label}</strong>
                <span>{candidate.actionKind}</span>
                <span>{pct(candidate.comparison.passRateDelta)}</span>
                <span>{formatCompact(candidate.comparison.worstCaseImprovement)}</span>
                <span>{formatCompact(candidate.comparison.p90Improvement)}</span>
                <span>{formatCompact(candidate.costScore)}</span>
                <button type="button" onClick={() => props.onApplyCandidate(candidate)}>
                  <Sparkles size={14} />
                  <span>Apply Candidate</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="l87-card" aria-label="L8.7 tolerance budget smoke preview">
          <div className="maxwell-section-heading">
            <h3>Tolerance Budget Advisor</h3>
            <strong>{props.report.toleranceBudget.filter((row) => row.action !== "keep").length} changes</strong>
          </div>
          <div className="l87-budget-table">
            <div className="l87-budget-row l87-header">
              <span>lock</span>
              <span>variation</span>
              <span>action</span>
              <span>current</span>
              <span>recommended</span>
              <span>cost</span>
            </div>
            {props.report.toleranceBudget.map((row) => {
              const permission = props.permissions.find((item) => item.specId === row.specId);
              return (
                <div className="l87-budget-row" key={row.specId}>
                  <input aria-label={`Lock ${row.label}`} type="checkbox" checked={permission?.locked ?? row.action === "locked"} onChange={(event) => props.onPermission(row.specId, { locked: event.currentTarget.checked })} />
                  <strong>{row.label}</strong>
                  <span>{row.action}</span>
                  <span>{formatCompact(row.currentDelta)}</span>
                  <span>{formatCompact(row.recommendedDelta)}</span>
                  <input aria-label={`${row.label} cost weight`} type="number" min="0" step="0.25" value={permission?.costWeight ?? row.costWeight} onChange={(event) => props.onPermission(row.specId, { costWeight: Number(event.currentTarget.value) })} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="l87-card" aria-label="L8.7 fdtd candidate sweep smoke preview">
          <div className="maxwell-section-heading">
            <h3>External FDTD Candidate Sweep</h3>
            <strong>{props.fdtdSummary ? "summary imported" : "manifest ready"}</strong>
          </div>
          <div className="l87-summary-grid compact">
            <Stat label="Manifest hash" value={props.fdtdManifest.manifestHash.slice(0, 10)} />
            <Stat label="Candidates" value={String(props.fdtdManifest.candidateCount)} />
            <Stat label="Imported rows" value={String(props.fdtdSummary?.results.length ?? 0)} />
          </div>
          <div className="fdtd-warning-list">
            {props.fdtdSummary && <span><strong>summary</strong> {props.fdtdSummary.summaryHash.slice(0, 12)} imported with {props.fdtdSummary.results.filter((row) => row.status === "pass").length} passing candidates.</span>}
            {props.fdtdWarnings.map((warning, index) => <span key={`${warning.code}:${index}`}><strong>{warning.code}</strong> {warning.message}</span>)}
            {props.fdtdImportError && <span><strong>import error</strong> {props.fdtdImportError}</span>}
            {!props.fdtdSummary && <span><strong>boundary</strong> Export/import only. Production FDTD execution stays external and does not approve a final robust design.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function L88EngineeringEvidenceCampaignPanel(props: {
  manifest: EngineeringEvidenceCampaignManifest;
  summary: GoldenEvidenceCampaignSummary | null;
  warnings: SolverWarning[];
  importError: string | null;
  onLoadBundled: () => void;
  onExportDossier: () => void;
  onImportFiles: (files: FileList | null) => void | Promise<void>;
}) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<EngineeringEvidenceScenarioId>("transparent-slab");
  const summary = props.summary;
  const selected = summary?.scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? summary?.scenarios[0] ?? null;
  const scenarioCount = summary?.scenarios.length ?? props.manifest.scenarioIds.length;
  return (
    <div className="maxwell-data-table l85-wide l88-evidence-panel" aria-label="L8.8 engineering evidence campaign smoke preview">
      <div className="maxwell-section-heading">
        <h2>L8.8 Engineering Evidence Campaign</h2>
        <strong>{summary ? `${scenarioCount} scenarios` : "not loaded"}</strong>
      </div>
      <div className="l2-disclosure">
        <strong>Golden Evidence Pack / External FDTD Acceptance Campaign.</strong>
        <span>
          Engineer-facing dossier only: curated scenes, references, residuals, convergence/PML status, L8.6 tolerance evidence, L8.7 robust before/after metrics, and limitations.
          Not certified validation, in-browser FDTD, arbitrary 3D Maxwell, FEM/BEM/RCWA, digital twin, or manufacturing certification.
        </span>
      </div>

      <div className="maxwell-layer-actions simulation-builder-actions l88-action-row">
        <button type="button" onClick={props.onLoadBundled}>
          <Sparkles size={15} />
          <span>Load Bundled Golden Campaign</span>
        </button>
        <button type="button" onClick={props.onExportDossier}>
          <FileDown size={15} />
          <span>Generate Engineer Review Dossier</span>
        </button>
        <label className="l87-file-import">
          <span>Import campaign JSON</span>
          <input aria-label="Import L8.8 evidence campaign JSON" type="file" accept="application/json,.json" multiple onChange={(event) => void props.onImportFiles(event.currentTarget.files)} />
        </label>
      </div>

      {props.importError && (
        <div className="fdtd-warning-list">
          <span><strong>campaign import</strong> {props.importError}</span>
        </div>
      )}
      {props.warnings.length > 0 && (
        <div className="fdtd-warning-list">
          {props.warnings.slice(0, 6).map((warning, index) => <span key={`${warning.code}:${index}`}><strong>{warning.code}</strong> {warning.message}</span>)}
        </div>
      )}

      <div className="l88-summary-grid">
        <Stat label="Campaign hash" value={props.manifest.manifestHash.slice(0, 10)} />
        <Stat label="Status" value={summary ? `${summary.scenarios.filter((scenario) => scenario.status === "pass").length} pass / ${summary.scenarios.filter((scenario) => scenario.status === "warning").length} warn` : "load campaign"} />
        <Stat label="Truth rows" value={String(summary?.capabilityTruthTable.length ?? 0)} />
        <Stat label="Unsupported" value={String(summary?.unsupportedItems.length ?? 0)} />
      </div>

      <div className="l88-layout">
        <div className="l88-card l88-wide-card" aria-label="L8.8 golden scenarios table smoke preview">
          <div className="maxwell-section-heading">
            <h3>Golden Scenarios</h3>
            <strong>{summary ? "loaded" : "load bundled"}</strong>
          </div>
          <div className="l88-scenario-table">
            <div className="l88-scenario-row l88-header">
              <span>Scenario</span>
              <span>Reference</span>
              <span>Status</span>
              <span>Residual</span>
              <span>Convergence</span>
              <span>Evidence</span>
            </div>
            {(summary?.scenarios ?? []).map((scenario) => (
              <button className={`l88-scenario-row ${scenario.id === selected?.id ? "active" : ""}`} key={scenario.id} type="button" onClick={() => setSelectedScenarioId(scenario.id)}>
                <span>{scenario.label}</span>
                <span>{scenario.referenceModel}</span>
                <strong>{scenario.status.toUpperCase()}</strong>
                <span>{formatCompact(scenario.residual)}</span>
                <span>{scenario.convergenceStatus}</span>
                <span>{scenario.evidenceType}</span>
              </button>
            ))}
            {!summary && <p className="simulation-builder-note">Load the bundled golden campaign or import campaign_manifest.json and golden_campaign_summary.json.</p>}
          </div>
        </div>

        <div className="l88-card l88-wide-card" aria-label="L8.8 scenario detail smoke preview">
          <div className="maxwell-section-heading">
            <h3>{selected?.label ?? "Scenario Detail"}</h3>
            <strong>{selected?.status ?? "n/a"}</strong>
          </div>
          {selected ? (
            <div className="l88-detail-grid">
              <Stat label="Purpose" value={selected.purpose} />
              <Stat label="Reference" value={selected.referenceDescription} />
              <Stat label="Expected R/T/A" value={`${fmtOptional(selected.expected.reflectance)} / ${fmtOptional(selected.expected.transmittance)} / ${fmtOptional(selected.expected.absorbance)}`} />
              <Stat label="Computed R/T/A" value={`${fmtOptional(selected.computed.reflectance)} / ${fmtOptional(selected.computed.transmittance)} / ${fmtOptional(selected.computed.absorbance)}`} />
              <Stat label="Scene hash" value={selected.receipts.sceneHash ? selected.receipts.sceneHash.slice(0, 12) : "n/a"} />
              <Stat label="Manifest/script" value={`${selected.receipts.manifestHash?.slice(0, 8) ?? "n/a"} / ${selected.receipts.scriptHash?.slice(0, 8) ?? "n/a"}`} />
              <Stat label="Result hash" value={(selected.receipts.resultHash ?? selected.receipts.summaryHash ?? "n/a").slice(0, 12)} />
              <Stat label="Warnings" value={String(selected.warnings.length)} />
            </div>
          ) : (
            <p className="simulation-builder-note">No L8.8 scenario selected.</p>
          )}
        </div>

        <div className="l88-card" aria-label="L8.8 convergence review smoke preview">
          <div className="maxwell-section-heading">
            <h3>Convergence Review</h3>
            <strong>{summary?.convergence.length ?? 0} rows</strong>
          </div>
          <div className="l88-compact-list">
            {(summary?.convergence ?? []).slice(0, 6).map((row) => (
              <div key={row.scenarioId}>
                <strong>{row.label}</strong>
                <span>{row.trend} / residual {formatCompact(row.finalResidual)} / PML {row.pmlSensitivity === null ? "n/a" : formatCompact(row.pmlSensitivity)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="l88-card" aria-label="L8.8 robust before after smoke preview">
          <div className="maxwell-section-heading">
            <h3>Tolerance + Robust Improvement</h3>
            <strong>{summary ? "ready" : "n/a"}</strong>
          </div>
          {summary ? (
            <div className="l88-detail-grid compact">
              <Stat label="L8.6 pass rate" value={pct(summary.toleranceSummary.passRate)} />
              <Stat label="Top sensitivity" value={summary.toleranceSummary.topSensitivity} />
              <Stat label="Best candidate" value={summary.robustSummary.bestCandidateLabel} />
              <Stat label="Before / after" value={`${pct(summary.robustSummary.baselinePassRate)} -> ${pct(summary.robustSummary.candidatePassRate)}`} />
              <Stat label="Worst-case improvement" value={formatCompact(summary.robustSummary.worstCaseImprovement)} />
              <Stat label="Remaining driver" value={summary.robustSummary.remainingFailureDriver} />
            </div>
          ) : (
            <p className="simulation-builder-note">Load the campaign to review L8.6 and L8.7 evidence.</p>
          )}
        </div>

        <div className="l88-card l88-wide-card" aria-label="L8.8 capability truth table smoke preview">
          <div className="maxwell-section-heading">
            <h3>Capability Truth Table</h3>
            <strong>{summary?.capabilityTruthTable.length ?? 0} rows</strong>
          </div>
          <div className="l88-truth-table">
            {(summary?.capabilityTruthTable ?? []).slice(0, 10).map((row) => (
              <div key={row.id}>
                <strong>{row.label}</strong>
                <span>{row.status}</span>
                <small>{row.evidence}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="l88-card" aria-label="L8.8 engineer dossier export smoke preview">
          <div className="maxwell-section-heading">
            <h3>Final Dossier</h3>
            <strong>{summary ? summary.summaryHash.slice(0, 10) : "pending"}</strong>
          </div>
          <div className="l88-compact-list">
            {(summary?.dossierExports ?? props.manifest.requiredArtifacts).slice(0, 10).map((name) => (
              <div key={name}>
                <strong>{name}</strong>
                <span>engineer review artifact</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function L85ElementInspector(props: {
  selected: L85Selection;
  element: SimulationBuilderElement | null;
  sceneElement: OpticalBenchElement | null;
  monitor: OpticalBenchMonitor | null;
  customMonitor: SimulationBuilderCustomMonitor | null;
  warnings: SolverWarning[];
  snapStepMm: number;
  canUndo: boolean;
  canRedo: boolean;
  onSelect: (selection: L85Selection) => void;
  onElementPatch: (elementId: string, patch: Partial<SimulationBuilderElement>, label?: string) => void;
  onMonitorPatch: (monitorId: string, patch: Partial<SimulationBuilderCustomMonitor>) => void;
  onNudge: (delta: { zMm?: number; xUm?: number }) => void;
  onMoveOrder: (elementId: string, direction: "earlier" | "later") => void;
  onDuplicate: (elementId: string) => void;
  onDelete: (elementId: string) => void;
  onToggle: (element: OpticalBenchElement) => void;
  onAddMonitor: (elementId: string, placement: "before" | "after") => void;
  onDeleteMonitor: (monitorId: string) => void;
  onExportSelected: () => void;
  onUndo: () => void;
  onRedo: () => void;
}) {
  if (props.selected.kind === "monitor") {
    const monitor = props.monitor;
    if (!monitor) return <div className="empty-state">Select an element or monitor to inspect editable properties.</div>;
    const editable = monitor.id === "observation-plane" || props.customMonitor;
    return (
      <div className="l85-inspector">
        <div className="l85-inspector-summary">
          <strong>{monitor.label}</strong>
          <span>{monitor.kind} monitor</span>
          <em>{editable ? "editable" : "auto-generated"}</em>
        </div>
        <div className="l85-inspector-grid">
          <L85NumberField label="z mm" value={monitor.zMm} step={props.snapStepMm} disabled={!editable} onChange={(value) => props.onMonitorPatch(monitor.id, { zMm: value })} />
          <L85NumberField label="x um" value={monitor.xUm} step={0.25} disabled={!props.customMonitor} onChange={(value) => props.onMonitorPatch(monitor.id, { xUm: value })} />
          <L85NumberField label="width um" value={monitor.widthUm} step={0.25} disabled={!props.customMonitor} onChange={(value) => props.onMonitorPatch(monitor.id, { widthUm: value })} />
          <L85NumberField label="height um" value={monitor.heightUm} step={0.25} disabled={!props.customMonitor} onChange={(value) => props.onMonitorPatch(monitor.id, { heightUm: value })} />
        </div>
        <div className="l85-inspector-actions">
          <button type="button" onClick={() => props.onNudge({ zMm: -props.snapStepMm })}><ArrowLeft size={14} /><span>Nudge -z</span></button>
          <button type="button" onClick={() => props.onNudge({ zMm: props.snapStepMm })}><ArrowRight size={14} /><span>Nudge +z</span></button>
          {props.customMonitor && <button type="button" onClick={() => props.onDeleteMonitor(monitor.id)}><Trash2 size={14} /><span>Delete monitor</span></button>}
          <button type="button" onClick={props.onExportSelected}><FileDown size={14} /><span>Export JSON</span></button>
        </div>
        <div className="l85-inspector-boundary">Numeric monitor fields are authoritative. Diagram drag is an optional convenience and commits on drop.</div>
      </div>
    );
  }

  const element = props.element;
  const sceneElement = props.sceneElement;
  if (!element || !sceneElement) return <div className="empty-state">Select an element from the chain or x-z diagram to inspect editable properties.</div>;
  const warnings = props.warnings.filter((warning) => warning.elementId === element.id);
  const finiteMaterial = element.kind === "finite-transparent-block" || element.kind === "finite-absorbing-block" || element.kind === "finite-reflective-plate" || element.kind === "tilted-interface-wedge" || element.kind === "finite-aperture-blocker";
  return (
    <div className="l85-inspector">
      <div className="l85-inspector-summary">
        <strong>{element.label}</strong>
        <span>{element.kind}</span>
        <em>{sceneElement.solverRoute} / {sceneElement.status}</em>
      </div>
      <div className="l85-inspector-grid">
        <label className="l85-text-field">
          <span>Label</span>
          <input aria-label="Selected element label" value={element.label} onChange={(event) => props.onElementPatch(element.id, { label: event.currentTarget.value }, "Rename optical bench element")} />
        </label>
        <L85NumberField label="z mm" value={element.zMm} step={props.snapStepMm} onChange={(value) => props.onElementPatch(element.id, { zMm: value }, "Move optical bench element")} />
        <L85NumberField label="x um" value={element.xUm ?? 0} step={0.25} onChange={(value) => props.onElementPatch(element.id, { xUm: value }, "Move optical bench element x")} />
        <L85NumberField label="y um" value={element.yUm ?? 0} step={0.25} onChange={(value) => props.onElementPatch(element.id, { yUm: value }, "Move optical bench element y")} />
        <L85NumberField label="width um" value={element.widthUm ?? sceneElement.widthUm} step={0.25} onChange={(value) => props.onElementPatch(element.id, { widthUm: value }, "Resize optical bench element")} />
        <L85NumberField label="height um" value={element.heightUm ?? sceneElement.heightUm} step={0.25} onChange={(value) => props.onElementPatch(element.id, { heightUm: value }, "Resize optical bench element")} />
        <L85NumberField label="thickness um" value={element.thicknessUm ?? sceneElement.thicknessUm} step={0.25} onChange={(value) => props.onElementPatch(element.id, { thicknessUm: value }, "Edit element thickness")} />
        {element.kind === "circular-aperture" && <L85NumberField label="diameter um" value={element.apertureDiameterUm ?? sceneElement.widthUm} step={0.1} onChange={(value) => props.onElementPatch(element.id, { apertureDiameterUm: value }, "Edit aperture diameter")} />}
        {element.kind === "finite-aperture-blocker" && (
          <>
            <L85NumberField label="aperture width um" value={element.apertureWidthUm ?? sceneElement.widthUm} step={0.1} onChange={(value) => props.onElementPatch(element.id, { apertureWidthUm: value }, "Edit aperture width")} />
            <L85NumberField label="aperture height um" value={element.apertureHeightUm ?? sceneElement.heightUm} step={0.1} onChange={(value) => props.onElementPatch(element.id, { apertureHeightUm: value }, "Edit aperture height")} />
            <label className="l85-text-field">
              <span>Screen model</span>
              <select value={element.screenModel ?? "absorbing-screen"} onChange={(event) => props.onElementPatch(element.id, { screenModel: event.currentTarget.value as SimulationBuilderElement["screenModel"] }, "Edit screen model")}>
                <option value="absorbing-screen">absorbing-screen</option>
                <option value="ideal-reflective-screen">ideal-reflective-screen</option>
                <option value="transparent-reference">transparent-reference</option>
              </select>
            </label>
          </>
        )}
        {element.kind === "ideal-lens" && <L85NumberField label="focal length mm" value={element.focalLengthMm ?? 20} step={0.5} onChange={(value) => props.onElementPatch(element.id, { focalLengthMm: value }, "Edit focal length")} />}
        {finiteMaterial && <L85NumberField label="material n" value={element.materialIndex ?? 1.5} step={0.01} onChange={(value) => props.onElementPatch(element.id, { materialIndex: value }, "Edit material index")} />}
        {finiteMaterial && <L85NumberField label="k" value={element.extinctionCoefficient ?? 0} step={0.005} onChange={(value) => props.onElementPatch(element.id, { extinctionCoefficient: value }, "Edit extinction coefficient")} />}
        {element.kind === "finite-absorbing-block" && <L85NumberField label="alpha 1/m" value={element.absorptionCoefficientPerM ?? 5000} step={250} onChange={(value) => props.onElementPatch(element.id, { absorptionCoefficientPerM: value }, "Edit absorption coefficient")} />}
        {element.kind === "tilted-interface-wedge" && <L85NumberField label="tilt deg" value={element.orientationDeg ?? 0} step={0.5} onChange={(value) => props.onElementPatch(element.id, { orientationDeg: value }, "Edit wedge tilt")} />}
      </div>
      <div className="l85-inspector-readout">
        <Stat label="Model" value={element.model} />
        <Stat label="Material" value={element.materialLabel} />
        <Stat label="Solver route" value={sceneElement.solverRoute} />
        <Stat label="Validation" value={sceneElement.validationReference} />
      </div>
      <div className="l85-inspector-actions">
        <button type="button" onClick={() => props.onNudge({ zMm: -props.snapStepMm })}><ArrowLeft size={14} /><span>Nudge -z</span></button>
        <button type="button" onClick={() => props.onNudge({ zMm: props.snapStepMm })}><ArrowRight size={14} /><span>Nudge +z</span></button>
        <button type="button" onClick={() => props.onNudge({ xUm: 0.25 })}><ArrowUp size={14} /><span>Nudge +x</span></button>
        <button type="button" onClick={() => props.onNudge({ xUm: -0.25 })}><ArrowDown size={14} /><span>Nudge -x</span></button>
        <button type="button" onClick={() => props.onMoveOrder(element.id, "earlier")}><ArrowLeft size={14} /><span>Move earlier</span></button>
        <button type="button" onClick={() => props.onMoveOrder(element.id, "later")}><ArrowRight size={14} /><span>Move later</span></button>
        <button type="button" onClick={() => props.onDuplicate(element.id)}><Copy size={14} /><span>Duplicate</span></button>
        <button type="button" onClick={() => props.onToggle(sceneElement)}>{sceneElement.enabled ? <EyeOff size={14} /> : <Eye size={14} />}<span>{sceneElement.enabled ? "Disable" : "Enable"}</span></button>
        <button type="button" onClick={() => props.onAddMonitor(element.id, "before")}><Plus size={14} /><span>Monitor before</span></button>
        <button type="button" onClick={() => props.onAddMonitor(element.id, "after")}><Plus size={14} /><span>Monitor after</span></button>
        <button type="button" onClick={props.onExportSelected}><FileDown size={14} /><span>Export JSON</span></button>
        <button type="button" onClick={props.onUndo} disabled={!props.canUndo}><Undo2 size={14} /><span>Undo</span></button>
        <button type="button" onClick={props.onRedo} disabled={!props.canRedo}><Redo2 size={14} /><span>Redo</span></button>
        <button type="button" onClick={() => props.onDelete(element.id)}><Trash2 size={14} /><span>Delete</span></button>
      </div>
      <div className="fdtd-warning-list l85-inspector-warnings">
        {warnings.length ? warnings.map((warning, index) => <span key={`${warning.code}:${index}`}><strong>{warning.code}</strong> {warning.message}</span>) : <span><strong>ok</strong> No edit warnings for the selected element.</span>}
      </div>
      <div className="l85-inspector-boundary">Numeric/text fields are the source of truth. Drag is optional; no arbitrary CAD, browser FDTD, arbitrary 3D Maxwell, FEM/BEM/RCWA, production solver, digital twin, or manufacturing certification is implied.</div>
    </div>
  );
}

function L85NumberField(props: { label: string; value: number; step: number; disabled?: boolean; onChange: (value: number) => void }) {
  return (
    <label className="l85-text-field">
      <span>{props.label}</span>
      <input aria-label={props.label} type="number" value={Number.isFinite(props.value) ? props.value : 0} step={props.step} disabled={props.disabled} onChange={(event) => props.onChange(Number(event.currentTarget.value))} />
    </label>
  );
}

function OpticalAxisPlacementDiagram(props: {
  axis: SimulationBuilderAxisNode[];
  zMin: number;
  zMax: number;
  selected: L85Selection;
  snapStepMm: number;
  onSelect: (selection: L85Selection) => void;
  onCommitZ: (node: SimulationBuilderAxisNode, zMm: number) => void;
}) {
  const domainRef = useRef<HTMLDivElement | null>(null);
  const zRange = Math.max(1e-9, props.zMax - props.zMin);
  const [dragPreview, setDragPreview] = useState<{ nodeId: string; zMm: number } | null>(null);

  function selectionForNode(node: SimulationBuilderAxisNode): L85Selection | null {
    if (node.kind === "element") return { kind: "element", id: node.id };
    if (node.kind === "observation") return { kind: "monitor", id: "observation-plane" };
    return null;
  }

  function zFromPointer(event: PointerEvent<HTMLDivElement>): number {
    const rect = domainRef.current?.getBoundingClientRect();
    if (!rect) return props.zMin;
    const xPercent = clampPercent(((event.clientX - rect.left) / Math.max(1, rect.width)) * 100);
    const rawZ = props.zMin + (xPercent / 100) * zRange;
    const snappedZ = props.snapStepMm > 0 ? Math.round(rawZ / props.snapStepMm) * props.snapStepMm : rawZ;
    return clampNumber(snappedZ, props.zMin, props.zMax);
  }

  return (
    <div
      className="simulation-axis"
      ref={domainRef}
      aria-label="L8.0 optical-axis diagram smoke preview"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setDragPreview(null);
        }
      }}
    >
      <div className="simulation-axis-line" />
      {props.axis.map((node) => {
        const selection = selectionForNode(node);
        const preview = dragPreview?.nodeId === node.id ? dragPreview : null;
        const nodeZ = preview?.zMm ?? node.zMm;
        const left = ((nodeZ - props.zMin) / zRange) * 100;
        const selected = selection && props.selected.kind === selection.kind && props.selected.id === selection.id;
        return (
          <div
            className={`simulation-axis-node simulation-axis-node-${node.kind} l88a-axis-node-draggable ${selected ? "l88a-axis-node-selected" : ""} ${preview ? "l88a-axis-node-preview" : ""}`}
            key={node.id}
            role="button"
            tabIndex={0}
            aria-label={`Move ${node.label} along optical axis`}
            style={{ left: `${clampPercent(left)}%` }}
            title={`${node.label}: z ${formatCompact(node.zMm)} mm. Axis drag is z-only; x and finite dimensions live in X-Z Surface Geometry.`}
            onClick={() => {
              if (selection) props.onSelect(selection);
            }}
            onPointerDown={(event) => {
              event.preventDefault();
              if (selection) props.onSelect(selection);
              event.currentTarget.setPointerCapture(event.pointerId);
              setDragPreview({ nodeId: node.id, zMm: zFromPointer(event) });
            }}
            onPointerMove={(event) => {
              if (!dragPreview || dragPreview.nodeId !== node.id) return;
              setDragPreview({ nodeId: node.id, zMm: zFromPointer(event) });
            }}
            onPointerUp={(event) => {
              if (!dragPreview || dragPreview.nodeId !== node.id) return;
              const nextZ = zFromPointer(event);
              setDragPreview(null);
              props.onCommitZ(node, nextZ);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                setDragPreview(null);
                return;
              }
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                if (selection) props.onSelect(selection);
                return;
              }
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                props.onCommitZ(node, node.zMm - props.snapStepMm);
                return;
              }
              if (event.key === "ArrowRight") {
                event.preventDefault();
                props.onCommitZ(node, node.zMm + props.snapStepMm);
              }
            }}
          >
            <span>{node.label}</span>
            <strong>{formatCompact(nodeZ)} mm</strong>
            <em>{preview ? "preview" : node.status}</em>
          </div>
        );
      })}
      {dragPreview && <div className="l88a-axis-distance-label">z {formatCompact(dragPreview.zMm)} mm</div>}
    </div>
  );
}

function L85BenchCrossSection(props: {
  bundle: ReturnType<typeof createOpticalBenchBundle>;
  selected: L85Selection;
  snapStepMm: number;
  mode: XzGeometryMode;
  editableMonitorIds: ReadonlySet<string>;
  onSelect: (selection: L85Selection) => void;
  onCommitPosition: (selection: L85Selection, position: { zMm: number; xUm?: number }) => void;
  onKeyboardNudge: (delta: { zMm?: number; xUm?: number }) => void;
}) {
  const scene = props.bundle.scene;
  const zMin = scene.grid.zStartMm;
  const zMax = scene.grid.zEndMm;
  const zRange = Math.max(1e-9, zMax - zMin);
  const xExtent = Math.max(scene.grid.domainWidthUm / 2, 1, ...props.bundle.crossSection.map((item) => Math.abs(item.xUm) + Math.max(0.1, item.widthUm) / 2));
  const domainRef = useRef<HTMLDivElement | null>(null);
  const [dragPreview, setDragPreview] = useState<{ selection: L85Selection; zMm: number; xUm: number } | null>(null);

  function selectionForItem(item: ReturnType<typeof createOpticalBenchBundle>["crossSection"][number]): L85Selection | null {
    if (item.kind === "element") return { kind: "element", id: item.id };
    if (item.kind === "monitor" && props.editableMonitorIds.has(item.id)) return { kind: "monitor", id: item.id };
    return null;
  }

  function positionFromPointer(event: PointerEvent<HTMLDivElement>): { zMm: number; xUm: number } {
    const rect = domainRef.current?.getBoundingClientRect();
    if (!rect) return { zMm: zMin, xUm: 0 };
    const xPercent = clampPercent(((event.clientX - rect.left) / Math.max(1, rect.width)) * 100);
    const yPercent = clampPercent(((event.clientY - rect.top) / Math.max(1, rect.height)) * 100);
    const rawZ = zMin + (xPercent / 100) * zRange;
    const snappedZ = props.snapStepMm > 0 ? Math.round(rawZ / props.snapStepMm) * props.snapStepMm : rawZ;
    return {
      zMm: clampNumber(snappedZ, zMin, zMax),
      xUm: clampNumber(((50 - yPercent) / 38) * xExtent, -xExtent, xExtent)
    };
  }

  return (
    <div className="l85-cross-section">
      <div
        className="l85-cross-section-domain"
        ref={domainRef}
        tabIndex={0}
        aria-label="Interactive L8.5.1 x-z bench diagram"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setDragPreview(null);
            return;
          }
          if (props.mode !== "edit") return;
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            props.onKeyboardNudge({ zMm: -props.snapStepMm });
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            props.onKeyboardNudge({ zMm: props.snapStepMm });
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            props.onKeyboardNudge({ xUm: 0.25 });
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
            props.onKeyboardNudge({ xUm: -0.25 });
          }
        }}
      >
        <div className="l85-cross-section-axis" />
        {props.bundle.crossSection.map((item) => {
          const selection = selectionForItem(item);
          const preview = dragPreview && dragPreview.selection.id === item.id && dragPreview.selection.kind === selection?.kind ? dragPreview : null;
          const itemZ = preview?.zMm ?? item.zMm;
          const itemX = preview?.xUm ?? item.xUm;
          const left = ((itemZ - zMin) / zRange) * 100;
          const height = item.kind === "monitor" || item.kind === "source" || item.kind === "target" ? 86 : Math.max(10, (item.heightUm / Math.max(1e-9, xExtent * 2)) * 82);
          const top = item.kind === "monitor" || item.kind === "source" || item.kind === "target" ? 7 : 50 - (itemX / Math.max(1e-9, xExtent)) * 38 - height / 2;
          const width = item.kind === "monitor" || item.kind === "source" || item.kind === "target" ? 0.65 : Math.max(0.8, Math.min(10, ((Math.max(0.02, item.thicknessUm) / 1000) / zRange) * 100));
          const selected = selection && props.selected.kind === selection.kind && props.selected.id === selection.id;
          const interactive = Boolean(selection);
          const draggable = interactive && props.mode === "edit";
          return (
            <div
              className={`l85-cross-section-item l85-cross-section-item-${item.kind} l85-cross-section-route-${item.solverRoute} ${draggable ? "l85-cross-section-draggable" : ""} ${interactive && !draggable ? "l85-cross-section-selectable" : ""} ${interactive ? "" : "l85-cross-section-readonly"} ${selected ? "l85-cross-section-selected" : ""} ${preview ? "l85-cross-section-drag-preview" : ""}`}
              key={item.id}
              role={interactive ? "button" : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={interactive ? `${props.mode === "edit" ? "Drag" : "Select"} ${item.label}` : undefined}
              style={{ left: `${clampPercent(left)}%`, top: `${clampPercent(top)}%`, width: `${width}%`, height: `${clampPercent(height)}%` }}
              title={`${item.label}: z ${formatCompact(item.zMm)} mm, route ${item.solverRoute}`}
              onClick={() => {
                if (selection) props.onSelect(selection);
              }}
              onPointerDown={(event) => {
                if (!draggable || !selection) return;
                event.preventDefault();
                props.onSelect(selection);
                event.currentTarget.setPointerCapture(event.pointerId);
                setDragPreview({ selection, ...positionFromPointer(event) });
              }}
              onPointerMove={(event) => {
                if (!draggable || !dragPreview || !selection || dragPreview.selection.id !== item.id || dragPreview.selection.kind !== selection.kind) return;
                setDragPreview({ selection, ...positionFromPointer(event) });
              }}
              onPointerUp={(event) => {
                if (!draggable || !dragPreview || !selection || dragPreview.selection.id !== item.id || dragPreview.selection.kind !== selection.kind) return;
                const next = positionFromPointer(event);
                setDragPreview(null);
                props.onCommitPosition(selection, next);
              }}
              onKeyDown={(event) => {
                if (!selection) return;
                if (event.key === "Escape") {
                  event.preventDefault();
                  setDragPreview(null);
                  return;
                }
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  props.onSelect(selection);
                }
              }}
            >
              <span>{l85CrossSectionLabel(item.type, item.kind)}</span>
            </div>
          );
        })}
      </div>
      <div className="surface-cross-section-legend">
        <span>z {formatCompact(zMin)}-{formatCompact(zMax)} mm</span>
        <span>x span {formatCompact(xExtent * 2)} um</span>
        <span>monitors, target, PML, and finite extents shown</span>
      </div>
    </div>
  );
}

function L85SolverPlanTable(props: { rows: OpticalBenchSolverPlanRow[] }) {
  return (
    <div className="l85-solver-plan-table">
      <div className="l85-solver-plan-row l85-solver-plan-header">
        <span>segment</span>
        <span>route</span>
        <span>status</span>
      </div>
      {props.rows.map((row) => (
        <div className="l85-solver-plan-row" key={row.id}>
          <strong>{row.segment}</strong>
          <span>{row.solverRoute}</span>
          <em className={`simulation-capability simulation-capability-${row.status === "external-only" ? "scaffold-only" : row.status}`}>{row.status}</em>
        </div>
      ))}
    </div>
  );
}

function L85MonitorStack(props: { snapshots: OpticalBenchMonitorSnapshot[] }) {
  return (
    <div className="l85-monitor-stack">
      {props.snapshots.slice(0, 6).map((snapshot) => (
        <div className="l85-monitor-card" key={snapshot.monitorId}>
          <div className="maxwell-section-heading">
            <h2>{snapshot.label}</h2>
            <strong>{snapshot.status}</strong>
          </div>
          <div className="maxwell-study-list">
            <Stat label="z" value={`${formatCompact(snapshot.zMm)} mm`} />
            <Stat label="route" value={snapshot.solverRoute} />
            <Stat label="peak" value={formatCompact(snapshot.metrics.peakIntensity)} />
            <Stat label="power" value={formatCompact(snapshot.metrics.relativePower)} />
          </div>
          <div className="l85-monitor-profile" aria-label={`${snapshot.label} monitor profile`}>
            {snapshot.profile.slice(0, 32).map((point, index) => (
              <span
                key={`${snapshot.monitorId}:${index}`}
                title={`x ${formatCompact(point.xUm)} um; I ${formatCompact(point.intensity)}`}
                style={{ height: `${Math.max(3, Math.min(100, point.intensity * 100))}%` }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SurfaceGeometryCrossSection(props: {
  scenario: SimulationBuilderScenario;
  zMin: number;
  zMax: number;
  selected?: L85Selection;
  mode?: XzGeometryMode;
  warnings?: SolverWarning[];
  snapStepMm?: number;
  onSelect?: (selection: L85Selection) => void;
  onCommitGeometry?: (elementId: string, patch: Partial<SimulationBuilderElement>, label?: string) => void;
}) {
  const finiteElements = props.scenario.elements.filter((element) => isSurfaceGeometryElementKind(element.kind));
  const zRange = Math.max(1e-9, props.zMax - props.zMin);
  const xExtent = Math.max(
    props.scenario.grid.domainWidthUm / 2,
    1,
    ...finiteElements.map((element) => Math.abs(element.xUm ?? 0) + Math.max(0.1, element.widthUm ?? 1) / 2)
  );
  const mode = props.mode ?? "inspect";
  const editable = mode === "edit" && Boolean(props.onCommitGeometry);
  const snapStepMm = props.snapStepMm ?? 0.1;
  const domainRef = useRef<HTMLDivElement | null>(null);
  const [dragPreview, setDragPreview] = useState<SurfaceGeometryDragPreview | null>(null);
  const sourceLeft = ((props.scenario.source.zMm - props.zMin) / zRange) * 100;
  const observationLeft = ((props.scenario.observationPlaneZMm - props.zMin) / zRange) * 100;

  function positionFromPointer(event: PointerEvent<HTMLElement>, snapZ: boolean): { zMm: number; xUm: number } {
    const rect = domainRef.current?.getBoundingClientRect();
    if (!rect) return { zMm: props.zMin, xUm: 0 };
    const zPercent = clampPercent(((event.clientX - rect.left) / Math.max(1, rect.width)) * 100);
    const xPercent = clampPercent(((event.clientY - rect.top) / Math.max(1, rect.height)) * 100);
    const rawZ = props.zMin + (zPercent / 100) * zRange;
    const zMm = snapZ && snapStepMm > 0 ? Math.round(rawZ / snapStepMm) * snapStepMm : rawZ;
    return {
      zMm: clampNumber(zMm, props.zMin, props.zMax),
      xUm: clampNumber(((50 - xPercent) / 38) * xExtent, -xExtent, xExtent)
    };
  }

  function patchForGeometryDrag(element: SimulationBuilderElement, dragKind: SurfaceGeometryDragKind, event: PointerEvent<HTMLElement>): Partial<SimulationBuilderElement> {
    const position = positionFromPointer(event, dragKind === "body");
    if (dragKind === "body") {
      return { zMm: position.zMm, xUm: Number(position.xUm.toPrecision(12)) };
    }
    if (dragKind === "thickness-start" || dragKind === "thickness-end") {
      const currentThicknessMm = Math.max(0.00005, (element.thicknessUm ?? 1) / 1000);
      const startEdge = element.zMm - currentThicknessMm / 2;
      const endEdge = element.zMm + currentThicknessMm / 2;
      const fixedEdge = dragKind === "thickness-start" ? endEdge : startEdge;
      const nextThicknessUm = Math.max(0.05, Math.abs(position.zMm - fixedEdge) * 1000);
      const nextZ = clampNumber((position.zMm + fixedEdge) / 2, props.scenario.grid.zStartMm, props.scenario.grid.zEndMm);
      return { zMm: Number(nextZ.toPrecision(12)), thicknessUm: Number(nextThicknessUm.toPrecision(12)) };
    }
    const currentWidthUm = Math.max(0.05, element.widthUm ?? 1);
    const centerX = element.xUm ?? 0;
    const negativeEdge = centerX - currentWidthUm / 2;
    const positiveEdge = centerX + currentWidthUm / 2;
    const fixedEdge = dragKind === "height-top" ? negativeEdge : positiveEdge;
    const nextWidthUm = Math.max(0.05, Math.abs(position.xUm - fixedEdge));
    const nextX = (position.xUm + fixedEdge) / 2;
    return { xUm: Number(nextX.toPrecision(12)), widthUm: Number(nextWidthUm.toPrecision(12)) };
  }

  function startGeometryDrag(event: PointerEvent<HTMLElement>, element: SimulationBuilderElement, dragKind: SurfaceGeometryDragKind): void {
    if (!editable || !props.onCommitGeometry) return;
    event.preventDefault();
    event.stopPropagation();
    props.onSelect?.({ kind: "element", id: element.id });
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragPreview({ elementId: element.id, dragKind, patch: patchForGeometryDrag(element, dragKind, event) });
  }

  function elementWarnings(elementId: string): SolverWarning[] {
    return (props.warnings ?? []).filter((warning) => warning.elementId === elementId);
  }

  const visibleWarnings = (props.warnings ?? []).filter((warning) => warning.elementId && finiteElements.some((element) => element.id === warning.elementId)).slice(0, 4);

  return (
    <div className="surface-cross-section">
      <div
        className={`surface-cross-section-domain ${editable ? "surface-cross-section-domain-edit" : ""}`}
        ref={domainRef}
        onPointerMove={(event) => {
          if (!dragPreview) return;
          const element = finiteElements.find((item) => item.id === dragPreview.elementId);
          if (!element) return;
          setDragPreview({ ...dragPreview, patch: patchForGeometryDrag(element, dragPreview.dragKind, event) });
        }}
        onPointerUp={() => {
          if (!dragPreview || !props.onCommitGeometry) return;
          props.onCommitGeometry(dragPreview.elementId, dragPreview.patch, "Drag finite surface geometry");
          setDragPreview(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setDragPreview(null);
        }}
      >
        <span className="surface-cross-section-pml surface-cross-section-pml-start">PML</span>
        <span className="surface-cross-section-pml surface-cross-section-pml-end">PML</span>
        <div className="surface-cross-section-axis" />
        <div className="surface-cross-section-source" style={{ left: `${clampPercent(sourceLeft)}%` }}>
          source
        </div>
        <div className="surface-cross-section-observation" style={{ left: `${clampPercent(observationLeft)}%` }}>
          monitor
        </div>
        {finiteElements.map((element) => {
          const preview = dragPreview?.elementId === element.id ? dragPreview : null;
          const displayElement = preview ? { ...element, ...preview.patch } : element;
          const widthPercent = Math.max(1.2, ((Math.max(0.05, displayElement.thicknessUm ?? 1) / 1000) / zRange) * 100);
          const left = ((displayElement.zMm - props.zMin) / zRange) * 100 - widthPercent / 2;
          const heightPercent = Math.max(8, (Math.max(0.05, displayElement.widthUm ?? 1) / (xExtent * 2)) * 78);
          const top = 50 - ((displayElement.xUm ?? 0) / Math.max(1e-9, xExtent)) * 38 - heightPercent / 2;
          const selected = props.selected?.kind === "element" && props.selected.id === element.id;
          const warnings = elementWarnings(element.id);
          return (
            <div
              className={`surface-cross-section-object surface-cross-section-object-${element.kind} ${props.onSelect ? "surface-cross-section-object-selectable" : ""} ${editable ? "surface-cross-section-object-editable" : ""} ${selected ? "surface-cross-section-object-selected" : ""} ${warnings.length ? "surface-cross-section-object-warning" : ""} ${preview ? "surface-cross-section-object-drag-preview" : ""}`}
              key={element.id}
              role={props.onSelect ? "button" : undefined}
              tabIndex={props.onSelect ? 0 : undefined}
              aria-label={`${editable ? "Edit" : "Inspect"} ${element.label}`}
              style={{
                left: `${clampPercent(left)}%`,
                width: `${Math.min(32, widthPercent)}%`,
                top: `${clampPercent(top)}%`,
                height: `${Math.min(82, heightPercent)}%`,
                transform: displayElement.orientationDeg ? `rotate(${displayElement.orientationDeg}deg)` : undefined
              }}
              title={`${element.label}: x ${formatCompact(displayElement.xUm ?? 0)} um, z ${formatCompact(displayElement.zMm)} mm, ${elementSizeText(displayElement)}${warnings.length ? `; warnings ${warnings.map((warning) => warning.code).join(", ")}` : ""}`}
              onClick={() => props.onSelect?.({ kind: "element", id: element.id })}
              onPointerDown={(event) => startGeometryDrag(event, element, "body")}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  setDragPreview(null);
                  return;
                }
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  props.onSelect?.({ kind: "element", id: element.id });
                  return;
                }
                if (!editable || !props.onCommitGeometry) return;
                if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  props.onCommitGeometry(element.id, { zMm: element.zMm - snapStepMm }, "Keyboard nudge finite surface geometry");
                  return;
                }
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  props.onCommitGeometry(element.id, { zMm: element.zMm + snapStepMm }, "Keyboard nudge finite surface geometry");
                  return;
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  props.onCommitGeometry(element.id, { xUm: (element.xUm ?? 0) + 0.25 }, "Keyboard nudge finite surface geometry");
                  return;
                }
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  props.onCommitGeometry(element.id, { xUm: (element.xUm ?? 0) - 0.25 }, "Keyboard nudge finite surface geometry");
                }
              }}
            >
              <span>{surfaceElementShortLabel(element.kind)}</span>
              {editable && selected && (
                <>
                  <i className="surface-cross-section-handle surface-cross-section-handle-left" title="Drag thickness start" onPointerDown={(event) => startGeometryDrag(event, element, "thickness-start")} />
                  <i className="surface-cross-section-handle surface-cross-section-handle-right" title="Drag thickness end" onPointerDown={(event) => startGeometryDrag(event, element, "thickness-end")} />
                  <i className="surface-cross-section-handle surface-cross-section-handle-top" title="Drag x-width positive edge" onPointerDown={(event) => startGeometryDrag(event, element, "height-top")} />
                  <i className="surface-cross-section-handle surface-cross-section-handle-bottom" title="Drag x-width negative edge" onPointerDown={(event) => startGeometryDrag(event, element, "height-bottom")} />
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="surface-cross-section-legend">
        <span>z {formatCompact(props.scenario.grid.zStartMm)}-{formatCompact(props.scenario.grid.zEndMm)} mm</span>
        <span>x span {formatCompact(xExtent * 2)} um</span>
        <span>{finiteElements.length ? `${mode} mode; finite extents shown` : "add or load a finite surface fixture"}</span>
      </div>
      {visibleWarnings.length > 0 && (
        <div className="surface-cross-section-warning-strip" aria-label="Surface geometry warning visual summary">
          {visibleWarnings.map((warning, index) => (
            <span key={`${warning.code}:${warning.elementId ?? ""}:${index}`}><strong>{warning.code}</strong> {warning.message}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function NumberField(props: { label: string; value: number; unit?: string; min?: number; step?: number; onChange: (value: number) => void }) {
  return (
    <label>
      <span>{props.label}</span>
      <input
        aria-label={props.label}
        type="number"
        value={Number.isFinite(props.value) ? props.value : 0}
        min={props.min}
        step={props.step ?? 1}
        onChange={(event) => props.onChange(Number(event.currentTarget.value))}
      />
      {props.unit && <em>{props.unit}</em>}
    </label>
  );
}

function Stat(props: { label: string; value: string }) {
  return (
    <div className="compact-stat">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

function Bar(props: { label: string; value: number }) {
  return (
    <div className="simulation-bar">
      <span>{props.label}</span>
      <div>
        <strong style={{ width: `${Math.max(0, Math.min(100, props.value * 100))}%` }} />
      </div>
      <em>{pct(props.value)}</em>
    </div>
  );
}

function FdtdFieldSlicePreview(props: { slice: FdtdFieldSlice }) {
  const range = Math.max(1e-12, props.slice.maxIntensity - props.slice.minIntensity);
  return (
    <div
      className="fdtd-field-map"
      style={{ gridTemplateColumns: `repeat(${props.slice.xCount}, minmax(0, 1fr))` }}
      aria-label="Imported FDTD field intensity map"
    >
      {props.slice.samples.map((sample, index) => {
        const normalized = (sample.intensity - props.slice.minIntensity) / range;
        return (
          <span
            key={`${sample.xUm}:${sample.zUm}:${index}`}
            title={`x ${formatCompact(sample.xUm)} um, z ${formatCompact(sample.zUm)} um, I ${formatCompact(sample.intensity)}`}
            style={{ opacity: 0.28 + normalized * 0.72 }}
          />
        );
      })}
    </div>
  );
}

function ApertureProfilePreview(props: { report: ApertureValidationReport }) {
  const maxValue = Math.max(1e-9, ...props.report.profile.map((point) => Math.max(point.importedIntensity, point.referenceIntensity)));
  return (
    <div className="aperture-profile-preview">
      <div className="maxwell-study-list">
        <Stat label="Classification" value={props.report.classification} />
        <Stat label="Profile RMS" value={formatCompact(props.report.residuals.profileRms)} />
        <Stat label="Reference residual" value={formatCompact(props.report.residuals.referenceResidual)} />
        <Stat label="First minimum" value={props.report.residuals.firstMinimumUm === null ? "n/a" : `${formatCompact(props.report.residuals.firstMinimumUm)} um`} />
      </div>
      <div className="aperture-profile-bars" aria-label="Imported versus scalar aperture profile">
        {props.report.profile.slice(0, 28).map((point, index) => (
          <div className="aperture-profile-bar" key={`${point.coordinateUm}:${index}`} title={`x ${formatCompact(point.coordinateUm)} um; imported ${formatCompact(point.importedIntensity)}; reference ${formatCompact(point.referenceIntensity)}`}>
            <span style={{ height: `${Math.max(2, (point.referenceIntensity / maxValue) * 100)}%` }} />
            <strong style={{ height: `${Math.max(2, (point.importedIntensity / maxValue) * 100)}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ApertureConvergenceTable(props: { report: ApertureConvergenceReport }) {
  return (
    <div className="fdtd-sweep-table aperture-convergence-table">
      <div className="fdtd-sweep-row fdtd-sweep-header">
        <span>ppw</span>
        <span>cells</span>
        <span>PML</span>
        <span>residual</span>
        <span>status</span>
      </div>
      {props.report.rows.map((row) => (
        <div className="fdtd-sweep-row" key={row.runId}>
          <span>{row.resolutionPpw}</span>
          <span>{formatCompact(row.apertureCellsAcross)}</span>
          <span>{formatCompact(row.pmlPaddingLambda)}</span>
          <span>{formatCompact(row.referenceResidual)}</span>
          <span>{row.status}</span>
        </div>
      ))}
    </div>
  );
}

function FdtdConvergenceTrendTable(props: { summary: FdtdConvergenceSummary }) {
  return (
    <div className="fdtd-sweep-table">
      <div className="fdtd-sweep-row fdtd-sweep-header">
        <span>ppw</span>
        <span>residual</span>
        <span>energy</span>
        <span>field</span>
        <span>runs</span>
      </div>
      {props.summary.trend.rows.map((row) => (
        <div className="fdtd-sweep-row" key={row.resolutionPointsPerWavelength}>
          <span>{row.resolutionPointsPerWavelength}</span>
          <span>{formatCompact(row.meanReferenceResidual)}</span>
          <span>{formatCompact(row.maxEnergyBalanceError)}</span>
          <span>{formatCompact(row.meanFieldSliceDelta)}</span>
          <span>{row.runCount}</span>
        </div>
      ))}
    </div>
  );
}

function FdtdConvergenceRunsTable(props: { summary: FdtdConvergenceSummary }) {
  return (
    <div className="fdtd-run-table">
      <div className="fdtd-run-row fdtd-run-header">
        <span>run</span>
        <span>ppw</span>
        <span>PML</span>
        <span>R/T/A</span>
        <span>residual</span>
        <span>status</span>
      </div>
      {props.summary.runs.slice(0, 9).map((run) => (
        <div className="fdtd-run-row" key={run.runId}>
          <span>{run.runId}</span>
          <span>{run.resolutionPointsPerWavelength}</span>
          <span>{formatCompact(run.pmlThicknessUm)}</span>
          <span>{`${pct(run.imported.reflectance)} / ${pct(run.imported.transmittance)} / ${pct(run.imported.absorbance)}`}</span>
          <span>{formatCompact(run.residuals.referenceResidual)}</span>
          <span>{run.status}</span>
        </div>
      ))}
    </div>
  );
}

function isSurfaceGeometryElementKind(kind: SimulationBuilderElementKind): boolean {
  return kind === "finite-transparent-block" || kind === "finite-absorbing-block" || kind === "finite-reflective-plate" || kind === "finite-aperture-blocker" || kind === "tilted-interface-wedge";
}

function hasApertureValidationElement(scenario: SimulationBuilderScenario): boolean {
  return scenario.elements.some((element) => element.kind === "finite-aperture-blocker" && Boolean(element.apertureShape));
}

function surfaceGeometryDisplayName(kind: SurfaceGeometryKind): string {
  if (kind === "transparent-block") return "transparent finite block";
  if (kind === "absorbing-block") return "absorbing finite block";
  if (kind === "reflective-plate") return "ideal reflective plate";
  if (kind === "aperture-blocker") return "aperture/blocker";
  return "tilted interface/wedge";
}

function surfaceElementShortLabel(kind: SimulationBuilderElementKind): string {
  if (kind === "finite-transparent-block") return "T";
  if (kind === "finite-absorbing-block") return "A";
  if (kind === "finite-reflective-plate") return "R";
  if (kind === "finite-aperture-blocker") return "MASK";
  if (kind === "tilted-interface-wedge") return "W";
  return "E";
}

function l85CrossSectionLabel(type: string, kind: string): string {
  if (kind === "source") return "SRC";
  if (kind === "monitor") return "MON";
  if (kind === "target") return "TGT";
  if (kind === "pml") return "PML";
  if (type.includes("lens")) return "LENS";
  if (type.includes("aperture") || type.includes("slit")) return "MASK";
  if (type.includes("absorbing")) return "ABS";
  if (type.includes("reflective")) return "REF";
  if (type.includes("wedge")) return "WEDGE";
  return "BLK";
}

function elementPositionText(element: SimulationBuilderElement): string {
  if (isSurfaceGeometryElementKind(element.kind)) return `x ${formatCompact(element.xUm ?? 0)} um / z ${formatCompact(element.zMm)} mm`;
  return `z ${formatCompact(element.zMm)} mm`;
}

function elementSizeText(element: SimulationBuilderElement): string {
  if (isSurfaceGeometryElementKind(element.kind)) {
    const base = `${formatCompact(element.widthUm ?? 0)} / ${formatCompact(element.heightUm ?? 0)} / ${formatCompact(element.thicknessUm ?? 0)} um`;
    if (element.kind === "finite-aperture-blocker") return `${base}; aperture ${formatCompact(element.apertureWidthUm ?? 0)} x ${formatCompact(element.apertureHeightUm ?? 0)} um`;
    if (element.kind === "tilted-interface-wedge") return `${base}; ${formatCompact(element.orientationDeg ?? 0)} deg`;
    return base;
  }
  if (element.apertureDiameterUm) return `${element.apertureDiameterUm} um`;
  if (element.thicknessUm) return `${element.thicknessUm} um`;
  if (element.focalLengthMm) return `f=${element.focalLengthMm} mm`;
  return "-";
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function targetForKind(kind: SimulationBuilderTargetKind, zMm: number): SimulationBuilderTarget {
  if (kind === "mirror") {
    return {
      kind,
      label: "Ideal mirror / PEC-like reflector",
      zMm,
      incidentIndex: 1,
      substrateIndex: 1,
      extinctionCoefficient: 0,
      absorptionCoefficientPerM: 0,
      thicknessUm: 0
    };
  }
  if (kind === "absorbing-slab") {
    return {
      kind,
      label: "Beer-Lambert absorbing slab",
      zMm,
      incidentIndex: 1,
      substrateIndex: 1,
      extinctionCoefficient: 0,
      absorptionCoefficientPerM: 5000,
      thicknessUm: 100
    };
  }
  return {
    kind,
    label: "Air to glass transparent dielectric interface",
    zMm,
    incidentIndex: 1,
    substrateIndex: 1.5,
    extinctionCoefficient: 0,
    absorptionCoefficientPerM: 0,
    thicknessUm: 0
  };
}

function elementButtonLabel(kind: SimulationBuilderElementKind): string {
  if (kind === "circular-aperture") return "Aperture";
  if (kind === "ideal-lens") return "Ideal lens";
  if (kind === "material-interface") return "Interface";
  if (kind === "material-slab") return "Material slab";
  if (kind === "mirror-surface") return "Mirror";
  if (kind === "absorbing-slab") return "Absorber";
  if (kind === "finite-transparent-block") return "Transparent block";
  if (kind === "finite-absorbing-block") return "Absorbing block";
  if (kind === "finite-reflective-plate") return "Reflective plate";
  if (kind === "finite-aperture-blocker") return "Aperture blocker";
  if (kind === "tilted-interface-wedge") return "Tilted wedge";
  if (kind === "curved-material-lens") return "Curved lens";
  return "Unsupported element";
}

function targetDisplayName(kind: SimulationBuilderTargetKind): string {
  if (kind === "mirror") return "mirror";
  if (kind === "absorbing-slab") return "absorber";
  return "transparent";
}

function benchmarkDisplayName(kind: FdtdBenchmarkKind): string {
  if (kind === "empty-space") return "empty space";
  if (kind === "transparent-interface") return "transparent interface";
  if (kind === "transparent-slab") return "transparent slab";
  if (kind === "absorbing-slab") return "absorbing slab";
  return "ideal mirror";
}

function fdtdReadinessLabel(status: "ready" | "warning" | "blocked"): string {
  if (status === "blocked") return "blocked";
  if (status === "warning") return "exportable with warnings";
  return "exportable";
}

function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return "n/a";
  if (value === 0) return "0";
  if (Math.abs(value) >= 100000 || Math.abs(value) < 0.001) return value.toExponential(3);
  return value.toPrecision(4);
}

function fmtOptional(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? formatCompact(value) : "n/a";
}

function pct(value: number): string {
  return `${(value * 100).toFixed(value > 0.995 ? 2 : 3)}%`;
}
