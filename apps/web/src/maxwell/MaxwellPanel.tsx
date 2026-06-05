import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  applyCoatingSearchCandidate,
  advisorValidationReviewCsv,
  advisorValidationReviewJson,
  advisorValidationReviewMarkdown,
  auditMaterialCatalog,
  circularApertureValidationJson,
  circularApertureValidationMarkdown,
  circularApertureValidationPipeline,
  coherenceDemonstratorCsv,
  coherenceDemonstratorJson,
  coherenceDemonstratorMarkdown,
  compareStudyRuns,
  cameraHistogramCsv,
  cameraCalibrationMetricsCsv,
  cameraCalibrationReportBundleJson,
  cameraCalibrationResidualsCsv,
  cameraPhotonTransferCsv,
  cameraMetricsCsv,
  cameraProfileCsv,
  cameraReportBundleJson,
  cameraRunToMeasuredDataset,
  createMaterialCatalog,
  createMaterialImportTemplate,
  createFieldMarker,
  createStudySnapshot,
  compareMtfRuns,
  defaultCoherenceDemonstratorConfig,
  defaultThinLensFocalValidationConfig,
  defaultCircularApertureValidationConfig,
  distanceBetweenMarkers,
  findFieldMinimum,
  findFieldPeak,
  compareMeasuredToSimulatedProfile,
  createMeasuredProfileFromImagePixels,
  importMaterialPackage,
  l75CapabilitiesMatrix,
  l69ExampleCalibrationCsv,
  linePairContrastCsv,
  measuredComparisonBundleJson,
  listCatalogMaterials,
  opticalInputFromProfile,
  applyRobustCoatingSearchCandidate,
  createMinimalMaxwellScene3D,
  parseMaterialImportJson,
  parseStudyBundleJson,
  parseCameraCalibrationCsv,
  parseGeometricPointCsv,
  parseMtfCsvFrame,
  parseMeasuredCsvProfile,
  exportExternalFdtdScaffold,
  externalFdtdSolverReceipt,
  compareGeometricCalibrations,
  compareFocusFieldMtf,
  defaultL71QualificationSpec,
  distortionMapCsv,
  fieldMtfMapCsv,
  fiducialBoardManifestJson,
  fiducialDetectionReportJson,
  fiducialDetectionReportMarkdown,
  fiducialMatchedPointsCsv,
  fiducialRejectedPointsCsv,
  fitFiducialBoardDetection,
  fitGeometricCalibration,
  fitGridCsv,
  finalizeFocusSweep,
  focusFieldComparisonCsv,
  focusSweepCsv,
  generateFiducialBoard,
  generateGeometricCalibrationTarget,
  generateSyntheticFiducialDetection,
  geometricCalibrationReportJson,
  geometricCalibrationReportMarkdown,
  geometricComparisonCsv,
  geometricPointsCsv,
  geometricResidualsCsv,
  applyDetectionManualEdits,
  applyFiducialManualEdits,
  attachGeometryFitMetricsToDetection,
  defaultL73Roi,
  detectMeasuredTargetPoints,
  detectedPointsCsv,
  detectionReportJson,
  detectionReportMarkdown,
  normalizeTargetImage,
  matchFiducialBoardDetection,
  pointSetFromDetection,
  rejectedPointsCsv,
  targetImageFromGeometricTarget,
  defaultL74Thresholds,
  exampleL74SessionManifestCsv,
  frameMetricsCsv,
  l74FrameFromCameraCalibration,
  l74FrameFromCameraRun,
  l74FrameFromDetection,
  l74FrameFromFieldMap,
  l74FrameFromFiducialFit,
  l74FrameFromFocusSweep,
  l74FrameFromGeometricFit,
  l74FrameFromMtf,
  l74SyntheticFramesFromManifest,
  outliersCsv,
  parseFiducialDetectionJson,
  parseL74SessionManifestCsv,
  runL74SessionQa,
  sessionMetricsCsv,
  sessionReportJson,
  sessionReportMarkdown,
  sessionWarningsJson,
  residualProfileCsv,
  practicalSweepCsv,
  practicalSweepJson,
  practicalSweepMarkdown,
  profileCsv,
  analyzeLinePairTarget,
  generateLinePairTarget,
  generateSlantedEdgeTarget,
  runCoatingSearch,
  runRobustCoatingSearch,
  runCoatingStack,
  runCoatingDesignFoundry,
  runCoatingYieldAnalysis,
  runCoatingSweep,
  runFieldMtfMap,
  runSyntheticFocusSweepMtf,
  runL67DiagnosticFit,
  runCameraSensorLite,
  runCameraCalibration,
  runSlantedEdgeMtf,
  runCircularApertureValidation,
  runCircularObservationZSweep,
  runCoherenceDemonstrator,
  runCoherenceGammaSweep,
  runCoatingWavelengthStudySweep,
  runDoubleSlitSeparationSweep,
  runSlitWidthSweep,
  runThinLensFocalValidation,
  runThinLensDefocusSweep,
  runValidationWavelengthSweep,
  runAdvisorValidationReview,
  runSlitOrderValidation,
  serializeCoatingStackDesign,
  slitOrderValidationJson,
  slitOrderValidationMarkdown,
  simulatedMetricsCsv,
  qualifyFocusFieldMtf,
  qualificationReportJson,
  qualificationReportMarkdown,
  slantedEdgeEsfCsv,
  slantedEdgeLsfCsv,
  slantedEdgeMtfCurveCsv,
  slantedEdgeMtfReportJson,
  slantedEdgeMtfReportMarkdown,
  studyBundleJson,
  studyBundleMarkdown,
  studyComparisonCsv,
  studyComparisonMarkdown,
  measuredMetricsCsv,
  mtfComparisonCsv,
  pointSetFromTarget,
  thinLensFocalValidationCsv,
  thinLensFocalValidationJson,
  thinLensFocalValidationMarkdown,
  thinLensFocalValidationPipeline,
  visibleArObjective,
  type AdvisorValidationReviewResult,
  type CircularApertureComputationMode,
  type CircularApertureValidationResult,
  type CoherenceDemonstratorMode,
  type CoherenceDemonstratorResult,
  type CoatingDesignResult,
  type CoatingSearchCandidate,
  type CoatingSearchResult,
  type CoatingStackDefinition,
  type CoatingStackRunResult,
  type CoatingSweepResult,
  type CoatingYieldResult,
  type CoatingUncertaintyModel,
  type MaterialCatalogEntry,
  type MaterialCatalogAudit,
  type MaterialImportResult,
  type MaxwellMaterialCatalog,
  type MaxwellPolarization,
  type ExternalFdtdScaffoldExport,
  type FieldMarker,
  type L67DiagnosticFitResult,
  type L67MeasuredComparisonResult,
  type L67MeasuredDataset,
  type L67SimulatedProfile,
  type L68CameraNoiseMode,
  type L68CameraRunResult,
  type L68CameraSettings,
  type L69CameraCalibrationDataset,
  type L69CameraCalibrationResult,
  type L70LinePairAnalysisResult,
  type L70MtfComparisonResult,
  type L70ParsedCsvFrame,
  type L70ResolutionTargetImage,
  type L71FieldLayout,
  type L71FieldMtfMapResult,
  type L71FocusFieldComparisonResult,
  type L71FocusMetric,
  type L71FocusSweepRow,
  type L71FocusSweepResult,
  type L71QualificationResult,
  type L72FitModel,
  type L72GeometricFitResult,
  type L72GeometricTarget,
  type L72GeometryComparisonResult,
  type L72PointSet,
  type L72TargetKind,
  type L73DetectionResult,
  type L73DotPolarity,
  type L73TargetImage,
  type L73ThresholdMode,
  type L74SessionFrame,
  type L74SessionQaResult,
  type L74SessionThresholds,
  type L75FiducialBoard,
  type L75FiducialDetectionBundle,
  type L75FiducialFitResult,
  type L75FiducialMatchResult,
  type SlantedEdgeMtfResult,
  type PlanarFieldMonitorResult,
  type PracticalSweepFamily,
  type PracticalSweepResult,
  type RobustCoatingSearchCandidate,
  type RobustCoatingSearchPrimaryMetric,
  type RobustCoatingSearchResult,
  type FieldOutput2D,
  type SlitOrderValidationResult,
  type SolverWarning,
  type StudyCapability,
  type StudyComparisonResult,
  type StudyMetric,
  type StudyMode,
  type StudyRunSummary,
  type StudySnapshot,
  type ThinLensFocalValidationResult
} from "@emmicro/core";
import { FileDown, Plus, Save, ShieldCheck, Sparkles, Trash2, Upload } from "lucide-react";
import { ExplainButton, ExplainLabel, ShowAllExplanationsDrawer } from "../explainability/Explainability";
import type { ExplainEntryId } from "../explainabilityContent";

type StackPresetId = "bareGlass" | "quarterWaveAr" | "broadbandAr" | "absorbingFilm";
type RobustUncertaintyModeId = "independent-thickness" | "shared-scale" | "shared-offset-residual";
type ValidationBenchmarkId = "circular-pinhole" | "single-slit" | "double-slit" | "thin-lens" | "coherence" | "advisor-review";

type EditableLayer = {
  id: string;
  materialId: string;
  thicknessNm: number;
};

type StackPreset = {
  label: string;
  incidentMaterialId: string;
  substrateMaterialId: string;
  wavelengthNm: number;
  angleDeg: number;
  polarization: MaxwellPolarization;
  layers: EditableLayer[];
};

const builtInMaterialCatalog = createMaterialCatalog({ id: "built-in-l54-material-catalog" });
const builtInMaterialOptions = listCatalogMaterials(builtInMaterialCatalog);
const builtInMaterialAudit = auditMaterialCatalog(builtInMaterialOptions, "built-in-l54-material-catalog");

const stackPresets = {
  bareGlass: {
    label: "Bare air/glass",
    incidentMaterialId: "air",
    substrateMaterialId: "bk7",
    wavelengthNm: 550,
    angleDeg: 0,
    polarization: "TE",
    layers: []
  },
  quarterWaveAr: {
    label: "MgF2 quarter-wave AR",
    incidentMaterialId: "air",
    substrateMaterialId: "bk7",
    wavelengthNm: 550,
    angleDeg: 0,
    polarization: "TE",
    layers: [{ id: "layer-mgf2-qw", materialId: "mgf2", thicknessNm: 550 / (4 * 1.38) }]
  },
  broadbandAr: {
    label: "Three-layer visible AR",
    incidentMaterialId: "air",
    substrateMaterialId: "bk7",
    wavelengthNm: 550,
    angleDeg: 0,
    polarization: "TE",
    layers: [
      { id: "layer-tio2", materialId: "tio2", thicknessNm: 46 },
      { id: "layer-sio2", materialId: "sio2", thicknessNm: 96 },
      { id: "layer-mgf2", materialId: "mgf2", thicknessNm: 104 }
    ]
  },
  absorbingFilm: {
    label: "Lossy absorber on glass",
    incidentMaterialId: "air",
    substrateMaterialId: "bk7",
    wavelengthNm: 550,
    angleDeg: 0,
    polarization: "TE",
    layers: [{ id: "layer-chromium", materialId: "chromiumLossy", thicknessNm: 18 }]
  }
} satisfies Record<StackPresetId, StackPreset>;

const presetEntries = Object.entries(stackPresets) as Array<[StackPresetId, StackPreset]>;

export function MaxwellPanel() {
  const [presetId, setPresetId] = useState<StackPresetId>("quarterWaveAr");
  const [incidentMaterialId, setIncidentMaterialId] = useState(stackPresets.quarterWaveAr.incidentMaterialId);
  const [substrateMaterialId, setSubstrateMaterialId] = useState(stackPresets.quarterWaveAr.substrateMaterialId);
  const [wavelengthNm, setWavelengthNm] = useState(stackPresets.quarterWaveAr.wavelengthNm);
  const [angleDeg, setAngleDeg] = useState(stackPresets.quarterWaveAr.angleDeg);
  const [polarization, setPolarization] = useState<MaxwellPolarization>(stackPresets.quarterWaveAr.polarization);
  const [layers, setLayers] = useState<EditableLayer[]>(() => cloneLayers(stackPresets.quarterWaveAr.layers));
  const [sweepStartNm, setSweepStartNm] = useState(420);
  const [sweepEndNm, setSweepEndNm] = useState(700);
  const [sweepCount, setSweepCount] = useState(33);
  const [materialImport, setMaterialImport] = useState<MaterialImportResult | null>(null);
  const [materialImportError, setMaterialImportError] = useState<string | null>(null);
  const [searchWavelengthsText, setSearchWavelengthsText] = useState("450, 550, 650");
  const [searchLayerMin, setSearchLayerMin] = useState(1);
  const [searchLayerMax, setSearchLayerMax] = useState(3);
  const [searchThicknessMinNm, setSearchThicknessMinNm] = useState(40);
  const [searchThicknessMaxNm, setSearchThicknessMaxNm] = useState(180);
  const [searchThicknessStepNm, setSearchThicknessStepNm] = useState(35);
  const [searchBeamWidth, setSearchBeamWidth] = useState(8);
  const [searchMaterialIds, setSearchMaterialIds] = useState<string[]>(["mgf2", "sio2", "tio2"]);
  const [searchResult, setSearchResult] = useState<CoatingSearchResult | null>(null);
  const [robustSearchEnabled, setRobustSearchEnabled] = useState(false);
  const [robustUncertaintyMode, setRobustUncertaintyMode] = useState<RobustUncertaintyModeId>("independent-thickness");
  const [robustThicknessSigmaNm, setRobustThicknessSigmaNm] = useState(2);
  const [robustSigmaLevelsText, setRobustSigmaLevelsText] = useState("-2, 0, 2");
  const [robustScaleSigmaPercent, setRobustScaleSigmaPercent] = useState(1);
  const [robustOffsetSigmaNm, setRobustOffsetSigmaNm] = useState(1);
  const [robustResidualSigmaNm, setRobustResidualSigmaNm] = useState(0.5);
  const [robustMaxSamples, setRobustMaxSamples] = useState(81);
  const [robustPrimaryMetric, setRobustPrimaryMetric] = useState<RobustCoatingSearchPrimaryMetric>("p90Score");
  const [robustPassThresholdText, setRobustPassThresholdText] = useState("");
  const [robustResult, setRobustResult] = useState<RobustCoatingSearchResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [validationBenchmark, setValidationBenchmark] = useState<ValidationBenchmarkId>("circular-pinhole");
  const [explainMode, setExplainMode] = useState(false);
  const [showExplanations, setShowExplanations] = useState(false);
  const [validationPlaneZMm, setValidationPlaneZMm] = useState(20);
  const [validationMode, setValidationMode] = useState<CircularApertureComputationMode>("compare-numerical-analytic");
  const [validationResolution, setValidationResolution] = useState(257);
  const [validationApertureRadialSamples, setValidationApertureRadialSamples] = useState(48);
  const [validationApertureAngularSamples, setValidationApertureAngularSamples] = useState(96);
  const [validationRadialSamples, setValidationRadialSamples] = useState(128);
  const [lensWavelengthNm, setLensWavelengthNm] = useState(500);
  const [lensFocalLengthMm, setLensFocalLengthMm] = useState(20);
  const [lensPupilDiameterUm, setLensPupilDiameterUm] = useState(200);
  const [lensObservationZMm, setLensObservationZMm] = useState(20);
  const [lensPlaneSizeUm, setLensPlaneSizeUm] = useState(300);
  const [lensResolution, setLensResolution] = useState(257);
  const [lensFocusRangeMm, setLensFocusRangeMm] = useState(2);
  const [coherenceMode, setCoherenceMode] = useState<CoherenceDemonstratorMode>("partial-coherence");
  const [coherenceGammaMagnitude, setCoherenceGammaMagnitude] = useState(1);
  const [coherenceGammaPhaseDeg, setCoherenceGammaPhaseDeg] = useState(0);
  const [coherenceWavelengthNm, setCoherenceWavelengthNm] = useState(500);
  const [coherenceSlitWidthUm, setCoherenceSlitWidthUm] = useState(20);
  const [coherenceSlitSeparationUm, setCoherenceSlitSeparationUm] = useState(100);
  const [coherencePropagationDistanceM, setCoherencePropagationDistanceM] = useState(1);
  const [studyName, setStudyName] = useState("L7.5 fiducial working study");
  const [savedStudies, setSavedStudies] = useState<StudySnapshot[]>([]);
  const [selectedStudyId, setSelectedStudyId] = useState<string>("");
  const [studyStatus, setStudyStatus] = useState("No study saved yet.");
  const [workspaceSweepFamily, setWorkspaceSweepFamily] = useState<PracticalSweepFamily>("coherence-gamma");
  const [workspaceSweepStart, setWorkspaceSweepStart] = useState(0);
  const [workspaceSweepStop, setWorkspaceSweepStop] = useState(1);
  const [workspaceSweepCount, setWorkspaceSweepCount] = useState(6);
  const [workspaceSweepResult, setWorkspaceSweepResult] = useState<PracticalSweepResult | null>(null);
  const [measurementMarkers, setMeasurementMarkers] = useState<FieldMarker[]>([]);
  const [comparisonAId, setComparisonAId] = useState<string>("");
  const [comparisonBId, setComparisonBId] = useState<string>("");
  const [studyComparison, setStudyComparison] = useState<StudyComparisonResult | null>(null);
  const [measuredCsvText, setMeasuredCsvText] = useState("");
  const [measuredPixelSizeUm, setMeasuredPixelSizeUm] = useState(50);
  const [measuredOffsetUm, setMeasuredOffsetUm] = useState(0);
  const [measuredRoiMinMm, setMeasuredRoiMinMm] = useState(-10);
  const [measuredRoiMaxMm, setMeasuredRoiMaxMm] = useState(10);
  const [measuredSimulatedStudyId, setMeasuredSimulatedStudyId] = useState("");
  const [measuredDataset, setMeasuredDataset] = useState<L67MeasuredDataset | null>(null);
  const [measuredComparison, setMeasuredComparison] = useState<L67MeasuredComparisonResult | null>(null);
  const [measuredFit, setMeasuredFit] = useState<L67DiagnosticFitResult | null>(null);
  const [cameraSimulatedStudyId, setCameraSimulatedStudyId] = useState("");
  const [cameraPixelPitchUm, setCameraPixelPitchUm] = useState(6.5);
  const [cameraWidthPx, setCameraWidthPx] = useState(96);
  const [cameraHeightPx, setCameraHeightPx] = useState(48);
  const [cameraQuantumEfficiency, setCameraQuantumEfficiency] = useState(0.6);
  const [cameraExposureMs, setCameraExposureMs] = useState(10);
  const [cameraPhotonFluxScale, setCameraPhotonFluxScale] = useState(2_000_000);
  const [cameraFullWellElectrons, setCameraFullWellElectrons] = useState(30_000);
  const [cameraReadNoiseElectrons, setCameraReadNoiseElectrons] = useState(2);
  const [cameraDarkCurrentElectrons, setCameraDarkCurrentElectrons] = useState(1);
  const [cameraBitDepth, setCameraBitDepth] = useState<L68CameraSettings["bitDepth"]>(12);
  const [cameraGainDnPerElectron, setCameraGainDnPerElectron] = useState(0.12);
  const [cameraBlackLevelDn, setCameraBlackLevelDn] = useState(64);
  const [cameraSeed, setCameraSeed] = useState(1234);
  const [cameraNoiseMode, setCameraNoiseMode] = useState<L68CameraNoiseMode>("shot-read-dark");
  const [cameraRun, setCameraRun] = useState<L68CameraRunResult | null>(null);
  const [cameraCalibrationCsvText, setCameraCalibrationCsvText] = useState(l69ExampleCalibrationCsv(false));
  const [cameraCalibrationDataset, setCameraCalibrationDataset] = useState<L69CameraCalibrationDataset | null>(null);
  const [cameraCalibrationRun, setCameraCalibrationRun] = useState<L69CameraCalibrationResult | null>(null);
  const [mtfWidthPx, setMtfWidthPx] = useState(160);
  const [mtfHeightPx, setMtfHeightPx] = useState(120);
  const [mtfEdgeAngleDeg, setMtfEdgeAngleDeg] = useState(5);
  const [mtfBlurSigmaPx, setMtfBlurSigmaPx] = useState(1.1);
  const [mtfContrast, setMtfContrast] = useState(0.9);
  const [mtfOversampling, setMtfOversampling] = useState(4);
  const [mtfPixelPitchUm, setMtfPixelPitchUm] = useState(3.45);
  const [mtfCsvText, setMtfCsvText] = useState("");
  const [mtfTarget, setMtfTarget] = useState<L70ResolutionTargetImage | null>(null);
  const [mtfImportedFrame, setMtfImportedFrame] = useState<L70ParsedCsvFrame | null>(null);
  const [mtfRun, setMtfRun] = useState<SlantedEdgeMtfResult | null>(null);
  const [mtfReferenceRun, setMtfReferenceRun] = useState<SlantedEdgeMtfResult | null>(null);
  const [mtfComparison, setMtfComparison] = useState<L70MtfComparisonResult | null>(null);
  const [linePairTarget, setLinePairTarget] = useState<L70ResolutionTargetImage | null>(null);
  const [linePairRun, setLinePairRun] = useState<L70LinePairAnalysisResult | null>(null);
  const [l71FocusStartMm, setL71FocusStartMm] = useState(-0.2);
  const [l71FocusStopMm, setL71FocusStopMm] = useState(0.2);
  const [l71FocusSamples, setL71FocusSamples] = useState(9);
  const [l71BestFocusMm, setL71BestFocusMm] = useState(0.04);
  const [l71DefocusBlurPerMm, setL71DefocusBlurPerMm] = useState(18);
  const [l71FocusMetric, setL71FocusMetric] = useState<L71FocusMetric>("mtf50");
  const [l71FocusThreshold, setL71FocusThreshold] = useState(0.05);
  const [l71FieldLayout, setL71FieldLayout] = useState<L71FieldLayout>("center-corners");
  const [l71CenterMtf50Min, setL71CenterMtf50Min] = useState(0.14);
  const [l71CornerMtf50Min, setL71CornerMtf50Min] = useState(0.08);
  const [l71NyquistMtfMin, setL71NyquistMtfMin] = useState(0.02);
  const [l71DepthOfFocusMinMm, setL71DepthOfFocusMinMm] = useState(0.1);
  const [l71DisallowWarnings, setL71DisallowWarnings] = useState(true);
  const [l71FocusSweepRun, setL71FocusSweepRun] = useState<L71FocusSweepResult | null>(null);
  const [l71FieldMapRun, setL71FieldMapRun] = useState<L71FieldMtfMapResult | null>(null);
  const [l71QualificationRun, setL71QualificationRun] = useState<L71QualificationResult | null>(null);
  const [l71FocusFieldComparison, setL71FocusFieldComparison] = useState<L71FocusFieldComparisonResult | null>(null);
  const [l72TargetKind, setL72TargetKind] = useState<L72TargetKind>("dot-grid");
  const [l72WidthPx, setL72WidthPx] = useState(360);
  const [l72HeightPx, setL72HeightPx] = useState(260);
  const [l72Rows, setL72Rows] = useState(7);
  const [l72Columns, setL72Columns] = useState(9);
  const [l72SpacingUm, setL72SpacingUm] = useState(50);
  const [l72PixelPitchUm, setL72PixelPitchUm] = useState(5);
  const [l72RotationDeg, setL72RotationDeg] = useState(2);
  const [l72RadialK1, setL72RadialK1] = useState(0.04);
  const [l72RadialK2, setL72RadialK2] = useState(0);
  const [l72FitModel, setL72FitModel] = useState<L72FitModel>("similarity");
  const [l72PointCsvText, setL72PointCsvText] = useState("");
  const [l72Target, setL72Target] = useState<L72GeometricTarget | null>(null);
  const [l72ImportedPointSet, setL72ImportedPointSet] = useState<L72PointSet | null>(null);
  const [l72Fit, setL72Fit] = useState<L72GeometricFitResult | null>(null);
  const [l72Comparison, setL72Comparison] = useState<L72GeometryComparisonResult | null>(null);
  const [l73TargetImage, setL73TargetImage] = useState<L73TargetImage | null>(null);
  const [l73RoiXPx, setL73RoiXPx] = useState(11);
  const [l73RoiYPx, setL73RoiYPx] = useState(8);
  const [l73RoiWidthPx, setL73RoiWidthPx] = useState(338);
  const [l73RoiHeightPx, setL73RoiHeightPx] = useState(244);
  const [l73ThresholdMode, setL73ThresholdMode] = useState<L73ThresholdMode>("auto");
  const [l73Threshold, setL73Threshold] = useState(0.5);
  const [l73Polarity, setL73Polarity] = useState<L73DotPolarity>("auto");
  const [l73MinBlobAreaPx, setL73MinBlobAreaPx] = useState(6);
  const [l73MaxBlobAreaPx, setL73MaxBlobAreaPx] = useState(240);
  const [l73MaxMissingPoints, setL73MaxMissingPoints] = useState(2);
  const [l73OutlierResidualWarnPx, setL73OutlierResidualWarnPx] = useState(8);
  const [l73Detection, setL73Detection] = useState<L73DetectionResult | null>(null);
  const [l73SelectedPointId, setL73SelectedPointId] = useState("");
  const [l73ShowLabels, setL73ShowLabels] = useState(true);
  const [l74ManifestText, setL74ManifestText] = useState(exampleL74SessionManifestCsv());
  const [l74MaxGeometricRmsResidualPx, setL74MaxGeometricRmsResidualPx] = useState(1);
  const [l74MaxPixelScaleRepeatabilityStd, setL74MaxPixelScaleRepeatabilityStd] = useState(0.05);
  const [l74MinMtf50CyclesPerPx, setL74MinMtf50CyclesPerPx] = useState(0.1);
  const [l74MaxMtf50Cv, setL74MaxMtf50Cv] = useState(0.15);
  const [l74MaxCameraBlackLevelDriftDn, setL74MaxCameraBlackLevelDriftDn] = useState(4);
  const [l74MaxAllowedWarningCount, setL74MaxAllowedWarningCount] = useState(2);
  const [l74MinDetectionCoverage, setL74MinDetectionCoverage] = useState(0.95);
  const [l74MaxZScore, setL74MaxZScore] = useState(2.5);
  const [l74SessionQa, setL74SessionQa] = useState<L74SessionQaResult | null>(null);
  const [l75SquaresX, setL75SquaresX] = useState(7);
  const [l75SquaresY, setL75SquaresY] = useState(5);
  const [l75SquareSizeMm, setL75SquareSizeMm] = useState(10);
  const [l75MarkerSizeFraction, setL75MarkerSizeFraction] = useState(0.65);
  const [l75DroppedMarkerModulo, setL75DroppedMarkerModulo] = useState(4);
  const [l75NoisePx, setL75NoisePx] = useState(0.02);
  const [l75DetectionJsonText, setL75DetectionJsonText] = useState(exampleL75DetectionJson());
  const [l75Board, setL75Board] = useState<L75FiducialBoard | null>(null);
  const [l75Detection, setL75Detection] = useState<L75FiducialDetectionBundle | null>(null);
  const [l75Match, setL75Match] = useState<L75FiducialMatchResult | null>(null);
  const [l75Fit, setL75Fit] = useState<L75FiducialFitResult | null>(null);
  const [l75SelectedMarkerId, setL75SelectedMarkerId] = useState("");
  const materialCatalog = useMemo<MaxwellMaterialCatalog>(
    () => createMaterialCatalog({ id: materialImport ? "l54-material-catalog-with-imports" : "l54-built-in-material-catalog", imports: materialImport ? [materialImport] : [] }),
    [materialImport]
  );
  const materialOptions = useMemo(() => listCatalogMaterials(materialCatalog), [materialCatalog]);
  const layerMaterialOptions = useMemo(() => materialOptions.filter((material) => material.family !== "ambient"), [materialOptions]);
  const importedLayerMaterial = useMemo(() => layerMaterialOptions.find((material) => material.origin === "imported"), [layerMaterialOptions]);
  const materialRunOptions = useMemo(
    () => ({
      materialCatalog,
      materialResolution: { extrapolation: "clamp" as const }
    }),
    [materialCatalog]
  );
  const fdtdBackendReceipt = useMemo(() => externalFdtdSolverReceipt(), []);
  const fdtdScaffoldScene = useMemo(() => createMinimalMaxwellScene3D({ materialCatalog }), [materialCatalog]);
  const fdtdScaffold = useMemo<ExternalFdtdScaffoldExport>(
    () => exportExternalFdtdScaffold(fdtdScaffoldScene, { materialCatalog }),
    [fdtdScaffoldScene, materialCatalog]
  );
  const validationResult = useMemo<CircularApertureValidationResult>(() => {
    const defaults = defaultCircularApertureValidationConfig();
    return runCircularApertureValidation({
      computationMode: validationMode,
      observationPlane: {
        ...defaults.observationPlane,
        zM: clamp(validationPlaneZMm, 11, 60) * 1e-3,
        resolution: oddInteger(validationResolution, 65, 513)
      },
      radialSamples: oddInteger(validationRadialSamples, 65, 257),
      numerical: {
        ...defaults.numerical,
        apertureRadialSamples: Math.round(clamp(validationApertureRadialSamples, 8, 128)),
        apertureAngularSamples: Math.round(clamp(validationApertureAngularSamples, 24, 256)),
        radialObservationSamples: oddInteger(validationRadialSamples, 65, 257)
      }
    });
  }, [validationApertureAngularSamples, validationApertureRadialSamples, validationMode, validationPlaneZMm, validationRadialSamples, validationResolution]);
  const validationPipeline = useMemo(() => circularApertureValidationPipeline(validationResult), [validationResult]);
  const lensResult = useMemo<ThinLensFocalValidationResult>(() => {
    const defaults = defaultThinLensFocalValidationConfig();
    return runThinLensFocalValidation({
      wavelengthM: clamp(lensWavelengthNm, 350, 800) * 1e-9,
      lens: {
        ...defaults.lens,
        focalLengthM: clamp(lensFocalLengthMm, 1, 100) * 1e-3
      },
      pupil: {
        ...defaults.pupil,
        diameterM: clamp(lensPupilDiameterUm, 20, 1000) * 1e-6
      },
      observationPlane: {
        ...defaults.observationPlane,
        zM: clamp(lensObservationZMm, 1, 120) * 1e-3,
        sizeM: clamp(lensPlaneSizeUm, 40, 1200) * 1e-6,
        resolution: oddInteger(lensResolution, 65, 513)
      },
      numerical: {
        ...defaults.numerical,
        focusScanHalfRangeM: clamp(lensFocusRangeMm, 0.2, 10) * 1e-3
      }
    });
  }, [lensFocalLengthMm, lensFocusRangeMm, lensObservationZMm, lensPlaneSizeUm, lensPupilDiameterUm, lensResolution, lensWavelengthNm]);
  const lensPipeline = useMemo(() => thinLensFocalValidationPipeline(lensResult), [lensResult]);
  const singleSlitResult = useMemo<SlitOrderValidationResult>(() => runSlitOrderValidation({ kind: "long-single-slit-sinc2" }), []);
  const doubleSlitResult = useMemo<SlitOrderValidationResult>(() => runSlitOrderValidation({ kind: "double-slit-orders" }), []);
  const selectedSlitResult = validationBenchmark === "double-slit" ? doubleSlitResult : singleSlitResult;
  const coherenceResult = useMemo<CoherenceDemonstratorResult>(() => {
    const defaults = defaultCoherenceDemonstratorConfig();
    return runCoherenceDemonstrator({
      mode: coherenceMode,
      wavelengthM: clamp(coherenceWavelengthNm, 350, 800) * 1e-9,
      propagationDistanceM: clamp(coherencePropagationDistanceM, 0.1, 5),
      aperture: {
        ...defaults.aperture,
        slitWidthM: clamp(coherenceSlitWidthUm, 2, 200) * 1e-6,
        slitSeparationM: clamp(coherenceSlitSeparationUm, Math.max(3, coherenceSlitWidthUm + 1), 1000) * 1e-6
      },
      coherence: {
        gammaMagnitude: clamp(coherenceGammaMagnitude, 0, 1),
        gammaPhaseRad: radFromDeg(clamp(coherenceGammaPhaseDeg, -180, 180))
      }
    });
  }, [coherenceGammaMagnitude, coherenceGammaPhaseDeg, coherenceMode, coherencePropagationDistanceM, coherenceSlitSeparationUm, coherenceSlitWidthUm, coherenceWavelengthNm]);
  const advisorReview = useMemo<AdvisorValidationReviewResult>(() => runAdvisorValidationReview(), []);
  const activeValidationHash =
    validationBenchmark === "thin-lens"
      ? lensResult.resultHash
      : validationBenchmark === "coherence"
        ? coherenceResult.resultHash
      : validationBenchmark === "single-slit" || validationBenchmark === "double-slit"
        ? selectedSlitResult.resultHash
        : validationBenchmark === "advisor-review"
          ? advisorReview.resultHash
          : validationResult.resultHash;

  const stack = useMemo<CoatingStackDefinition>(
    () => ({
      id: `l41-${presetId}`,
      label: `L4.1 ${stackPresets[presetId].label}`,
      wavelengthM: clamp(wavelengthNm, 200, 2000) * 1e-9,
      angleRad: radFromDeg(clamp(angleDeg, -80, 80)),
      polarization,
      incidentMaterialId,
      substrateMaterialId,
      layers: layers.map((layer) => ({
        id: layer.id,
        label: materialLabel(layer.materialId, materialCatalog),
        materialId: layer.materialId,
        thicknessM: clamp(layer.thicknessNm, 0.1, 10000) * 1e-9
      }))
    }),
    [angleDeg, incidentMaterialId, layers, materialCatalog, polarization, presetId, substrateMaterialId, wavelengthNm]
  );
  const run = useMemo<CoatingStackRunResult>(() => runCoatingStack(stack, materialRunOptions), [materialRunOptions, stack]);
  const sweep = useMemo<CoatingSweepResult>(
    () =>
      runCoatingSweep(stack, {
        startWavelengthM: clamp(sweepStartNm, 200, 2000) * 1e-9,
        endWavelengthM: clamp(Math.max(sweepStartNm, sweepEndNm), 200, 2000) * 1e-9,
        sampleCount: Math.max(3, Math.min(81, Math.round(sweepCount)))
      }, materialRunOptions),
    [materialRunOptions, stack, sweepCount, sweepEndNm, sweepStartNm]
  );
  const foundry = useMemo<CoatingDesignResult>(
    () =>
      runCoatingDesignFoundry({
        id: `l51-${presetId}-visible-ar`,
        label: `L5.1 ${stackPresets[presetId].label} design foundry`,
        seedStack: stack,
        objective: visibleArObjective,
        settings: { passes: 2, samplesPerVariable: 7, candidateCount: 3 },
        ...materialRunOptions
      }),
    [materialRunOptions, presetId, stack]
  );
  const yieldAnalysis = useMemo<CoatingYieldResult>(
    () =>
      runCoatingYieldAnalysis({
        id: `l52-${presetId}-visible-ar-yield`,
        label: `L5.2 ${stackPresets[presetId].label} tolerance yield`,
        stack: foundry.best.stack,
        objective: visibleArObjective,
        tolerances: foundry.best.stack.layers.map((layer) => ({ layerId: layer.id, sigmaM: 2e-9 })),
        settings: { sampleCount: 41, confidenceLevel: 0.95 },
        ...materialRunOptions
      }),
    [foundry, materialRunOptions, presetId]
  );
  const materialAudit = useMemo<MaterialCatalogAudit>(
    () => (materialImport ? auditMaterialCatalog(materialOptions, "l54-material-catalog-with-imports") : builtInMaterialAudit),
    [materialImport, materialOptions]
  );
  const warnings = useMemo(
    () =>
      uniquePanelWarnings([
        ...materialAudit.warnings,
        ...materialCatalog.warnings,
        ...(materialImport?.warnings ?? []),
        ...(robustResult?.warnings ?? []),
        ...(searchResult?.warnings ?? []),
        ...yieldAnalysis.warnings,
        ...foundry.warnings,
        ...run.warnings
      ]),
    [foundry, materialAudit, materialCatalog, materialImport, robustResult, run, searchResult, yieldAnalysis]
  );
  const capabilities = useMemo(() => l75CapabilitiesMatrix(), []);
  const selectedStudy = savedStudies.find((study) => study.id === selectedStudyId) ?? null;
  const studyRunSummaries = useMemo<StudyRunSummary[]>(
    () =>
      savedStudies.map((study) => ({
        id: study.id,
        label: study.name,
        kind: study.mode,
        resultHash: study.resultHash,
        metrics: study.metrics,
        warnings: study.warnings,
        limitations: study.limitations
      })),
    [savedStudies]
  );

  useEffect(() => {
    setSearchMaterialIds((current) => {
      const available = new Set(layerMaterialOptions.map((material) => material.id));
      const imported = layerMaterialOptions.filter((material) => material.origin === "imported").map((material) => material.id);
      const retained = current.filter((id) => available.has(id));
      const next = [...retained, ...imported.filter((id) => !retained.includes(id))];
      if (next.length > 0) return next;
      return ["mgf2", "sio2", "tio2"].filter((id) => available.has(id));
    });
  }, [layerMaterialOptions]);

  function saveStudy(study: StudySnapshot): void {
    setSavedStudies((current) => [study, ...current.filter((item) => item.id !== study.id)]);
    setSelectedStudyId(study.id);
    setStudyStatus(`Saved study: ${study.name}`);
  }

  function saveValidationStudy(): void {
    saveStudy(captureValidationStudy(studyName.trim() || "Validation study"));
  }

  function saveCoatingStudy(): void {
    saveStudy(captureCoatingStudy(studyName.trim() || "Coating study"));
  }

  function captureValidationStudy(name: string): StudySnapshot {
    const summary = activeValidationStudySummary();
    return createStudySnapshot({
      id: `${summary.id}-${Date.now().toString(36)}`,
      name,
      mode: summary.mode,
      selectedWorkbench: summary.mode === "validation.advisor-review" ? "advisor-review" : "validation-bench",
      inputs: summary.inputs,
      appState: currentAppState(),
      backendReceipt: { label: "Scalar Validation Bench", availability: "executable", scope: "scalar validation only" },
      materialReceipts: [{ materialId: "not-applicable", materialHash: "scalar-validation" }],
      resultHashes: [summary.resultHash],
      metrics: summary.metrics,
      profiles: summary.profiles,
      warnings: summary.warnings,
      limitations: summary.limitations
    });
  }

  function captureCoatingStudy(name: string): StudySnapshot {
    return createStudySnapshot({
      id: `coating-study-${Date.now().toString(36)}`,
      name,
      mode: robustResult ? "coating.robust-optimizer" : searchResult ? "coating.optimizer" : "coating.planar-stack",
      selectedWorkbench: "coating-stack-workbench",
      inputs: {
        stack,
        search: searchResult?.spec ?? null,
        robustSearch: robustResult?.spec ?? null
      },
      appState: currentAppState(),
      backendReceipt: run.solverBackend,
      materialReceipts: run.materialCatalogRefs,
      uncertaintyReceipts: robustResult ? [robustResult.best.uncertaintyReceipt] : yieldAnalysis.tolerances,
      resultHashes: [run.resultHash, sweep.resultHash, foundry.resultHash, yieldAnalysis.resultHash, searchResult?.resultHash, robustResult?.resultHash].filter(Boolean) as string[],
      metrics: [
        { id: "reflectance", label: "Reflectance", value: run.tmm.reflectance },
        { id: "transmittance", label: "Transmittance", value: run.tmm.transmittance },
        { id: "absorbance", label: "Absorbance", value: run.tmm.absorbance },
        { id: "yieldPassRate", label: "Tolerance pass rate", value: yieldAnalysis.passRate },
        { id: "bestFoundryScore", label: "Best foundry score", value: foundry.best.score },
        ...(robustResult ? [{ id: "robustP90Score", label: "Robust P90 score", value: robustResult.best.yield.p90Score }] : [])
      ],
      warnings,
      limitations: [
        ...run.provenance.limitations,
        ...foundry.provenance.limitations,
        ...yieldAnalysis.provenance.limitations,
        ...(searchResult?.provenance.limitations ?? []),
        ...(robustResult?.provenance.limitations ?? [])
      ]
    });
  }

  function loadSelectedStudy(): void {
    const study = selectedStudy;
    if (!study) {
      setStudyStatus("Select a study to load.");
      return;
    }
    applyStudyState(study);
    setStudyStatus(`Loaded study: ${study.name}`);
  }

  function duplicateSelectedStudy(): void {
    const study = selectedStudy;
    if (!study) {
      setStudyStatus("Select a study to duplicate.");
      return;
    }
    const duplicate = createStudySnapshot({
      ...study,
      id: `${study.id}-copy-${Date.now().toString(36)}`,
      name: `${study.name} copy`,
      createdAtIso: undefined
    });
    saveStudy(duplicate);
  }

  function deleteSelectedStudy(): void {
    if (!selectedStudyId) {
      setStudyStatus("Select a study to delete.");
      return;
    }
    setSavedStudies((current) => current.filter((study) => study.id !== selectedStudyId));
    setSelectedStudyId("");
    setStudyStatus("Deleted selected study.");
  }

  function applyStudyState(study: StudySnapshot): void {
    const state = study.appState as Record<string, unknown> | null;
    if (!state) return;
    const validation = state.validation as Record<string, unknown> | undefined;
    if (validation) {
      setValidationBenchmark((validation.benchmark as ValidationBenchmarkId) ?? validationBenchmark);
      if (typeof validation.planeZMm === "number") setValidationPlaneZMm(validation.planeZMm);
      if (typeof validation.coherenceGamma === "number") setCoherenceGammaMagnitude(validation.coherenceGamma);
      if (typeof validation.coherenceMode === "string") setCoherenceMode(validation.coherenceMode as CoherenceDemonstratorMode);
      if (typeof validation.lensObservationZMm === "number") setLensObservationZMm(validation.lensObservationZMm);
    }
    const coating = state.coating as Record<string, unknown> | undefined;
    if (coating) {
      if (typeof coating.presetId === "string" && coating.presetId in stackPresets) setPresetId(coating.presetId as StackPresetId);
      if (typeof coating.wavelengthNm === "number") setWavelengthNm(coating.wavelengthNm);
      if (typeof coating.angleDeg === "number") setAngleDeg(coating.angleDeg);
      if (coating.polarization === "TE" || coating.polarization === "TM") setPolarization(coating.polarization);
      if (Array.isArray(coating.layers)) setLayers(coating.layers as EditableLayer[]);
    }
    const measured = state.measured as Record<string, unknown> | undefined;
    if (measured) {
      if (typeof measured.pixelSizeUm === "number") setMeasuredPixelSizeUm(measured.pixelSizeUm);
      if (typeof measured.xOffsetUm === "number") setMeasuredOffsetUm(measured.xOffsetUm);
      if (typeof measured.roiMinMm === "number") setMeasuredRoiMinMm(measured.roiMinMm);
      if (typeof measured.roiMaxMm === "number") setMeasuredRoiMaxMm(measured.roiMaxMm);
      if (typeof measured.simulatedStudyId === "string") setMeasuredSimulatedStudyId(measured.simulatedStudyId);
    }
    const camera = state.camera as Record<string, unknown> | undefined;
    if (camera) {
      if (typeof camera.simulatedStudyId === "string") setCameraSimulatedStudyId(camera.simulatedStudyId);
      if (typeof camera.pixelPitchUm === "number") setCameraPixelPitchUm(camera.pixelPitchUm);
      if (typeof camera.widthPx === "number") setCameraWidthPx(camera.widthPx);
      if (typeof camera.heightPx === "number") setCameraHeightPx(camera.heightPx);
      if (typeof camera.quantumEfficiency === "number") setCameraQuantumEfficiency(camera.quantumEfficiency);
      if (typeof camera.exposureMs === "number") setCameraExposureMs(camera.exposureMs);
      if (typeof camera.photonFluxScale === "number") setCameraPhotonFluxScale(camera.photonFluxScale);
      if (typeof camera.fullWellElectrons === "number") setCameraFullWellElectrons(camera.fullWellElectrons);
      if (typeof camera.readNoiseElectrons === "number") setCameraReadNoiseElectrons(camera.readNoiseElectrons);
      if (typeof camera.darkCurrentElectrons === "number") setCameraDarkCurrentElectrons(camera.darkCurrentElectrons);
      if (camera.bitDepth === 8 || camera.bitDepth === 10 || camera.bitDepth === 12 || camera.bitDepth === 14 || camera.bitDepth === 16) setCameraBitDepth(camera.bitDepth);
      if (typeof camera.gainDnPerElectron === "number") setCameraGainDnPerElectron(camera.gainDnPerElectron);
      if (typeof camera.blackLevelDn === "number") setCameraBlackLevelDn(camera.blackLevelDn);
      if (typeof camera.seed === "number") setCameraSeed(camera.seed);
      if (camera.noiseMode === "noiseless" || camera.noiseMode === "shot-only" || camera.noiseMode === "shot-read" || camera.noiseMode === "shot-read-dark") setCameraNoiseMode(camera.noiseMode);
    }
    const calibration = state.calibration as Record<string, unknown> | undefined;
    if (calibration) {
      if (typeof calibration.csvText === "string") setCameraCalibrationCsvText(calibration.csvText);
      setCameraCalibrationDataset(null);
      setCameraCalibrationRun(null);
    }
    const mtf = state.mtf as Record<string, unknown> | undefined;
    if (mtf) {
      if (typeof mtf.widthPx === "number") setMtfWidthPx(mtf.widthPx);
      if (typeof mtf.heightPx === "number") setMtfHeightPx(mtf.heightPx);
      if (typeof mtf.edgeAngleDeg === "number") setMtfEdgeAngleDeg(mtf.edgeAngleDeg);
      if (typeof mtf.blurSigmaPx === "number") setMtfBlurSigmaPx(mtf.blurSigmaPx);
      if (typeof mtf.contrast === "number") setMtfContrast(mtf.contrast);
      if (typeof mtf.oversampling === "number") setMtfOversampling(mtf.oversampling);
      if (typeof mtf.pixelPitchUm === "number") setMtfPixelPitchUm(mtf.pixelPitchUm);
      if (typeof mtf.csvText === "string") setMtfCsvText(mtf.csvText);
      setMtfTarget(null);
      setMtfImportedFrame(null);
      setMtfRun(null);
      setMtfReferenceRun(null);
      setMtfComparison(null);
    }
    const focusField = state.focusField as Record<string, unknown> | undefined;
    if (focusField) {
      if (typeof focusField.focusStartMm === "number") setL71FocusStartMm(focusField.focusStartMm);
      if (typeof focusField.focusStopMm === "number") setL71FocusStopMm(focusField.focusStopMm);
      if (typeof focusField.focusSamples === "number") setL71FocusSamples(focusField.focusSamples);
      if (typeof focusField.bestFocusMm === "number") setL71BestFocusMm(focusField.bestFocusMm);
      if (typeof focusField.defocusBlurPerMm === "number") setL71DefocusBlurPerMm(focusField.defocusBlurPerMm);
      if (focusField.focusMetric === "mtf50" || focusField.focusMetric === "mtf10" || focusField.focusMetric === "nyquist" || focusField.focusMetric === "mtf-area") setL71FocusMetric(focusField.focusMetric);
      if (typeof focusField.focusThreshold === "number") setL71FocusThreshold(focusField.focusThreshold);
      if (focusField.fieldLayout === "center" || focusField.fieldLayout === "center-corners" || focusField.fieldLayout === "grid-3x3") setL71FieldLayout(focusField.fieldLayout);
      if (typeof focusField.centerMtf50Min === "number") setL71CenterMtf50Min(focusField.centerMtf50Min);
      if (typeof focusField.cornerMtf50Min === "number") setL71CornerMtf50Min(focusField.cornerMtf50Min);
      if (typeof focusField.nyquistMtfMin === "number") setL71NyquistMtfMin(focusField.nyquistMtfMin);
      if (typeof focusField.depthOfFocusMinMm === "number") setL71DepthOfFocusMinMm(focusField.depthOfFocusMinMm);
      if (typeof focusField.disallowWarnings === "boolean") setL71DisallowWarnings(focusField.disallowWarnings);
      setL71FocusSweepRun(null);
      setL71FieldMapRun(null);
      setL71QualificationRun(null);
      setL71FocusFieldComparison(null);
    }
    const geometric = state.geometric as Record<string, unknown> | undefined;
    if (geometric) {
      if (geometric.targetKind === "dot-grid" || geometric.targetKind === "checkerboard" || geometric.targetKind === "line-grid") setL72TargetKind(geometric.targetKind);
      if (typeof geometric.widthPx === "number") setL72WidthPx(geometric.widthPx);
      if (typeof geometric.heightPx === "number") setL72HeightPx(geometric.heightPx);
      if (typeof geometric.rows === "number") setL72Rows(geometric.rows);
      if (typeof geometric.columns === "number") setL72Columns(geometric.columns);
      if (typeof geometric.spacingUm === "number") setL72SpacingUm(geometric.spacingUm);
      if (typeof geometric.pixelPitchUm === "number") setL72PixelPitchUm(geometric.pixelPitchUm);
      if (typeof geometric.rotationDeg === "number") setL72RotationDeg(geometric.rotationDeg);
      if (typeof geometric.radialK1 === "number") setL72RadialK1(geometric.radialK1);
      if (typeof geometric.radialK2 === "number") setL72RadialK2(geometric.radialK2);
      if (geometric.fitModel === "similarity" || geometric.fitModel === "affine" || geometric.fitModel === "radial-k1" || geometric.fitModel === "radial-k1-k2") setL72FitModel(geometric.fitModel);
      if (typeof geometric.pointCsvText === "string") setL72PointCsvText(geometric.pointCsvText);
      setL72Target(null);
      setL72ImportedPointSet(null);
      setL72Fit(null);
      setL72Comparison(null);
    }
    const targetDetection = state.targetDetection as Record<string, unknown> | undefined;
    if (targetDetection) {
      if (typeof targetDetection.roiXPx === "number") setL73RoiXPx(targetDetection.roiXPx);
      if (typeof targetDetection.roiYPx === "number") setL73RoiYPx(targetDetection.roiYPx);
      if (typeof targetDetection.roiWidthPx === "number") setL73RoiWidthPx(targetDetection.roiWidthPx);
      if (typeof targetDetection.roiHeightPx === "number") setL73RoiHeightPx(targetDetection.roiHeightPx);
      if (targetDetection.thresholdMode === "auto" || targetDetection.thresholdMode === "manual") setL73ThresholdMode(targetDetection.thresholdMode);
      if (typeof targetDetection.threshold === "number") setL73Threshold(targetDetection.threshold);
      if (targetDetection.polarity === "auto" || targetDetection.polarity === "dark-on-light" || targetDetection.polarity === "light-on-dark") setL73Polarity(targetDetection.polarity);
      if (typeof targetDetection.minBlobAreaPx === "number") setL73MinBlobAreaPx(targetDetection.minBlobAreaPx);
      if (typeof targetDetection.maxBlobAreaPx === "number") setL73MaxBlobAreaPx(targetDetection.maxBlobAreaPx);
      if (typeof targetDetection.maxMissingPoints === "number") setL73MaxMissingPoints(targetDetection.maxMissingPoints);
      if (typeof targetDetection.outlierResidualWarnPx === "number") setL73OutlierResidualWarnPx(targetDetection.outlierResidualWarnPx);
      if (typeof targetDetection.showLabels === "boolean") setL73ShowLabels(targetDetection.showLabels);
      setL73TargetImage(null);
      setL73Detection(null);
      setL73SelectedPointId("");
    }
    const batchSession = state.batchSession as Record<string, unknown> | undefined;
    if (batchSession) {
      if (typeof batchSession.manifestText === "string") setL74ManifestText(batchSession.manifestText);
      if (typeof batchSession.maxGeometricRmsResidualPx === "number") setL74MaxGeometricRmsResidualPx(batchSession.maxGeometricRmsResidualPx);
      if (typeof batchSession.maxPixelScaleRepeatabilityStd === "number") setL74MaxPixelScaleRepeatabilityStd(batchSession.maxPixelScaleRepeatabilityStd);
      if (typeof batchSession.minMtf50CyclesPerPx === "number") setL74MinMtf50CyclesPerPx(batchSession.minMtf50CyclesPerPx);
      if (typeof batchSession.maxMtf50Cv === "number") setL74MaxMtf50Cv(batchSession.maxMtf50Cv);
      if (typeof batchSession.maxCameraBlackLevelDriftDn === "number") setL74MaxCameraBlackLevelDriftDn(batchSession.maxCameraBlackLevelDriftDn);
      if (typeof batchSession.maxAllowedWarningCount === "number") setL74MaxAllowedWarningCount(batchSession.maxAllowedWarningCount);
      if (typeof batchSession.minDetectionCoverage === "number") setL74MinDetectionCoverage(batchSession.minDetectionCoverage);
      if (typeof batchSession.maxZScore === "number") setL74MaxZScore(batchSession.maxZScore);
      setL74SessionQa(null);
    }
  }

  async function importStudyBundleFile(file: File | null): Promise<void> {
    if (!file) return;
    try {
      const bundle = parseStudyBundleJson(await file.text());
      setSavedStudies((current) => [bundle.study, ...current.filter((study) => study.id !== bundle.study.id)]);
      setSelectedStudyId(bundle.study.id);
      setStudyStatus(`Imported study bundle: ${bundle.study.name}`);
    } catch (error) {
      setStudyStatus(`Import failed: ${(error as Error).message}`);
    }
  }

  async function copyShareableStudyUrl(): Promise<void> {
    const study = selectedStudy ?? (savedStudies[0] ?? null);
    if (!study) {
      setStudyStatus("Save or select a study before copying a URL.");
      return;
    }
    const payload = window.btoa(JSON.stringify({ schema: "emmicro.studyUrl.v1", studyId: study.id, appState: study.appState }));
    const url = `${window.location.origin}${window.location.pathname}?study=${encodeURIComponent(payload)}`;
    try {
      await navigator.clipboard?.writeText(url);
      setStudyStatus("Copied shareable study URL.");
    } catch {
      setStudyStatus(url);
    }
  }

  function runWorkspaceSweep(): void {
    const input = {
      family: workspaceSweepFamily,
      start: workspaceSweepStart,
      stop: workspaceSweepStop,
      sampleCount: Math.round(workspaceSweepCount),
      maxRuns: 21
    };
    const result =
      workspaceSweepFamily === "coherence-gamma"
        ? runCoherenceGammaSweep(input)
        : workspaceSweepFamily === "validation-wavelength"
          ? runValidationWavelengthSweep(input)
          : workspaceSweepFamily === "observation-z"
            ? runCircularObservationZSweep(input)
            : workspaceSweepFamily === "slit-width"
              ? runSlitWidthSweep(input)
              : workspaceSweepFamily === "double-slit-separation"
                ? runDoubleSlitSeparationSweep(input)
                : workspaceSweepFamily === "thin-lens-defocus"
                  ? runThinLensDefocusSweep(input)
                  : runCoatingWavelengthStudySweep(stack, input, materialRunOptions);
    setWorkspaceSweepResult(result);
    setStudyStatus(`Sweep complete: ${result.label}`);
  }

  function pinCenterMarker(): void {
    const field = activeMeasurementField();
    const marker = createFieldMarker(field, { id: `center-${measurementMarkers.length + 1}`, label: "Crosshair center", uM: 0, vM: 0 });
    setMeasurementMarkers((current) => [...current, marker]);
  }

  function pinPeakMarker(): void {
    const marker = findFieldPeak(activeMeasurementField());
    setMeasurementMarkers((current) => [...current, { ...marker, id: `peak-${current.length + 1}` }]);
  }

  function pinMinimumMarker(): void {
    const marker = findFieldMinimum(activeMeasurementField());
    setMeasurementMarkers((current) => [...current, { ...marker, id: `minimum-${current.length + 1}` }]);
  }

  function runGammaComparison(): void {
    const gamma1 = runCoherenceDemonstrator({ mode: "partial-coherence", coherence: { gammaMagnitude: 1, gammaPhaseRad: 0 } });
    const gamma0 = runCoherenceDemonstrator({ mode: "partial-coherence", coherence: { gammaMagnitude: 0, gammaPhaseRad: 0 } });
    setStudyComparison(
      compareStudyRuns(
        coherenceRunSummary("gamma1", "gamma=1", gamma1),
        coherenceRunSummary("gamma0", "gamma=0", gamma0)
      )
    );
    setStudyStatus("Compared gamma=1 vs gamma=0.");
  }

  function compareSelectedStudies(): void {
    const runA = studyRunSummaries.find((study) => study.id === comparisonAId);
    const runB = studyRunSummaries.find((study) => study.id === comparisonBId);
    if (!runA || !runB) {
      setStudyStatus("Select Run A and Run B first.");
      return;
    }
    setStudyComparison(compareStudyRuns(runA, runB));
    setStudyStatus(`Compared ${runA.label} vs ${runB.label}.`);
  }

  function activeL67SimulatedProfile(sourceStudyId = measuredSimulatedStudyId): L67SimulatedProfile {
    const selectedMeasuredStudy = savedStudies.find((study) => study.id === sourceStudyId && Object.keys(study.profiles).length > 0);
    if (selectedMeasuredStudy) {
      const profileEntry = Object.entries(selectedMeasuredStudy.profiles)[0];
      if (profileEntry) {
        return {
          id: selectedMeasuredStudy.id,
          label: `${selectedMeasuredStudy.name} ${profileEntry[0]}`,
          resultHash: selectedMeasuredStudy.resultHash,
          profile: profileEntry[1],
          sourceKind: selectedMeasuredStudy.mode
        };
      }
    }
    const summary = activeValidationStudySummary();
    const profileEntry = Object.entries(summary.profiles)[0];
    if (!profileEntry) throw new Error("Run or select a validation study with profile data before comparing measured data.");
    return {
      id: summary.id,
      label: `${summary.mode} ${profileEntry[0]}`,
      resultHash: summary.resultHash,
      profile: profileEntry[1],
      sourceKind: summary.mode
    };
  }

  function currentCameraSettings(overrides: Partial<L68CameraSettings> = {}): Partial<L68CameraSettings> {
    return {
      id: "l69-camera-sensor-lite",
      label: "L6.9 Camera/Sensor-Lite acquisition",
      pixelPitchM: clamp(cameraPixelPitchUm, 0.01, 10000) * 1e-6,
      widthPx: Math.round(clamp(cameraWidthPx, 8, 512)),
      heightPx: Math.round(clamp(cameraHeightPx, 8, 512)),
      quantumEfficiency: clamp(cameraQuantumEfficiency, 0, 1),
      exposureS: clamp(cameraExposureMs, 0, 1_000_000) * 1e-3,
      photonFluxScale: Math.max(0, cameraPhotonFluxScale),
      fullWellElectrons: Math.max(1, cameraFullWellElectrons),
      readNoiseElectronsRms: Math.max(0, cameraReadNoiseElectrons),
      darkCurrentElectronsPerS: Math.max(0, cameraDarkCurrentElectrons),
      bitDepth: cameraBitDepth,
      gainDnPerElectron: Math.max(0, cameraGainDnPerElectron),
      blackLevelDn: Math.max(0, cameraBlackLevelDn),
      seed: Math.round(cameraSeed),
      noiseMode: cameraNoiseMode,
      ...overrides
    };
  }

  function createCameraRunFromSimulated(simulated: L67SimulatedProfile, overrides: Partial<L68CameraSettings> = {}): L68CameraRunResult {
    return runCameraSensorLite({
      id: `l69-camera-${Date.now().toString(36)}`,
      label: "L6.9 Camera/Sensor-Lite acquisition",
      optical: opticalInputFromProfile(simulated.profile, {
        id: simulated.id,
        label: simulated.label,
        resultHash: simulated.resultHash,
        kind: simulated.sourceKind,
        heightPx: Math.round(clamp(cameraHeightPx, 8, 512))
      }),
      settings: currentCameraSettings(overrides)
    });
  }

  function generateCameraRun(overrides: Partial<L68CameraSettings> = {}): L68CameraRunResult | null {
    try {
      const simulated = activeL67SimulatedProfile(cameraSimulatedStudyId);
      const nextRun = createCameraRunFromSimulated(simulated, overrides);
      setCameraRun(nextRun);
      setStudyStatus(`Camera output generated: mean DN ${cameraMetricValue(nextRun, "meanDn").toPrecision(4)}, saturation ${(cameraMetricValue(nextRun, "saturationFraction") * 100).toPrecision(3)}%.`);
      return nextRun;
    } catch (error) {
      setStudyStatus(`Camera output failed: ${(error as Error).message}`);
      return null;
    }
  }

  function saturateCameraExposure(): void {
    const exposureMs = Math.max(cameraExposureMs * 20, 250);
    const photonFluxScale = Math.max(cameraPhotonFluxScale, 50_000_000);
    const gainDnPerElectron = Math.max(cameraGainDnPerElectron, 0.25);
    setCameraExposureMs(exposureMs);
    setCameraPhotonFluxScale(photonFluxScale);
    setCameraGainDnPerElectron(gainDnPerElectron);
    generateCameraRun({
      exposureS: exposureMs * 1e-3,
      photonFluxScale,
      gainDnPerElectron
    });
  }

  function saveCameraStudy(): void {
    const nextRun = cameraRun ?? generateCameraRun();
    if (!nextRun) return;
    saveStudy(
      createStudySnapshot({
        id: `l69-camera-study-${Date.now().toString(36)}`,
        name: "L6.9 camera sensor-lite study",
        mode: "camera.sensor-lite",
        selectedWorkbench: "camera-sensor-lite",
        inputs: {
          source: nextRun.source,
          settings: nextRun.settings
        },
        appState: currentAppState(),
        backendReceipt: { label: "L6.9 Camera/Sensor-Lite", availability: "executable", scope: "detector acquisition post-process over existing optical output only" },
        resultHashes: [nextRun.source.resultHash, nextRun.resultHash],
        metrics: nextRun.metrics,
        profiles: {
          optical: nextRun.profile.map((point) => ({ xM: point.xM, intensity: point.opticalIntensity, label: "optical intensity" })),
          photons: nextRun.profile.map((point) => ({ xM: point.xM, intensity: point.photons, label: "photons" })),
          electrons: nextRun.profile.map((point) => ({ xM: point.xM, intensity: point.electrons, label: "electrons" })),
          digitalNumbers: nextRun.profile.map((point) => ({ xM: point.xM, intensity: point.digitalNumber, label: "DN" }))
        },
        warnings: nextRun.warnings,
        limitations: nextRun.limitations
      })
    );
  }

  function exportCameraReport(): void {
    const nextRun = cameraRun ?? generateCameraRun();
    if (!nextRun) return;
    const bundle = cameraReportBundleJson(nextRun);
    downloadText("l69-camera_report.json", "application/json", JSON.stringify(bundle, null, 2));
    downloadText("l69-camera_report.md", "text/markdown", bundle.cameraReportMarkdown);
    downloadText("l69-camera_metrics.csv", "text/csv", cameraMetricsCsv(nextRun));
    downloadText("l69-camera_profile.csv", "text/csv", cameraProfileCsv(nextRun));
    downloadText("l69-camera_histogram.csv", "text/csv", cameraHistogramCsv(nextRun));
    downloadText("l69-camera_warnings.json", "application/json", JSON.stringify(bundle.warningsJson, null, 2));
    setStudyStatus("Exported L6.9 camera report bundle.");
  }

  function loadCameraCalibrationExample(includePhotons: boolean): void {
    const csv = l69ExampleCalibrationCsv(includePhotons);
    setCameraCalibrationCsvText(csv);
    try {
      const dataset = parseCameraCalibrationCsv(csv, { sourceName: includePhotons ? "l69-example-with-photons.csv" : "l69-example-no-photons.csv", bitDepth: cameraBitDepth });
      setCameraCalibrationDataset(dataset);
      setCameraCalibrationRun(null);
      setStudyStatus(includePhotons ? "Loaded example calibration CSV with known photons_per_pixel." : "Loaded example calibration CSV without photon input; QE will remain unidentifiable.");
    } catch (error) {
      setStudyStatus(`Example calibration import failed: ${(error as Error).message}`);
    }
  }

  function importCameraCalibrationCsvFromText(sourceName = "camera-calibration.csv"): L69CameraCalibrationDataset | null {
    try {
      const dataset = parseCameraCalibrationCsv(cameraCalibrationCsvText, {
        sourceName,
        bitDepth: cameraBitDepth
      });
      setCameraCalibrationDataset(dataset);
      setCameraCalibrationRun(null);
      setStudyStatus(`Imported calibration data: ${dataset.rowCount} rows / ${dataset.dataHash.slice(0, 10)}.`);
      return dataset;
    } catch (error) {
      setStudyStatus(`Calibration import failed: ${(error as Error).message}`);
      return null;
    }
  }

  async function importCameraCalibrationFile(file: File | null): Promise<void> {
    if (!file) return;
    try {
      const text = await file.text();
      const dataset = parseCameraCalibrationCsv(text, { sourceName: file.name, bitDepth: cameraBitDepth });
      setCameraCalibrationCsvText(text);
      setCameraCalibrationDataset(dataset);
      setCameraCalibrationRun(null);
      setStudyStatus(`Loaded calibration CSV file: ${file.name}`);
    } catch (error) {
      setStudyStatus(`Calibration file import failed: ${(error as Error).message}`);
    }
  }

  function runCameraCalibrationFit(): L69CameraCalibrationResult | null {
    const dataset = cameraCalibrationDataset ?? importCameraCalibrationCsvFromText();
    if (!dataset) return null;
    return fitCameraCalibrationDataset(dataset);
  }

  function fitCameraCalibrationDataset(dataset: L69CameraCalibrationDataset): L69CameraCalibrationResult {
    const calibration = runCameraCalibration({
      id: `l69-camera-calibration-${Date.now().toString(36)}`,
      label: "L6.9 Camera Calibration / Photon-Transfer",
      dataset,
      baseSettings: currentCameraSettings()
    });
    setCameraCalibrationDataset(dataset);
    setCameraCalibrationRun(calibration);
    setStudyStatus(`Photon-transfer fit complete: gain ${calibration.fittedProfile.gainDnPerElectron.toPrecision(4)} DN/e-, read noise ${calibration.fittedProfile.readNoiseElectronsRms.toPrecision(4)} e-.`);
    return calibration;
  }

  function applyCalibratedCameraProfile(): void {
    const calibration = cameraCalibrationRun ?? runCameraCalibrationFit();
    if (!calibration) return;
    const profile = calibration.fittedProfile;
    setCameraPixelPitchUm(profile.pixelPitchM * 1e6);
    if (profile.quantumEfficiency !== null) setCameraQuantumEfficiency(profile.quantumEfficiency);
    setCameraFullWellElectrons(profile.fullWellElectrons);
    setCameraReadNoiseElectrons(profile.readNoiseElectronsRms);
    setCameraDarkCurrentElectrons(profile.darkCurrentElectronsPerS);
    setCameraGainDnPerElectron(profile.gainDnPerElectron);
    setCameraBlackLevelDn(profile.blackLevelDn);
    setCameraBitDepth(profile.bitDepth);
    setStudyStatus(`Applied calibrated camera profile: black ${profile.blackLevelDn.toPrecision(4)} DN / gain ${profile.gainDnPerElectron.toPrecision(4)} DN/e-.`);
  }

  function saveCameraCalibrationStudy(): void {
    const dataset = cameraCalibrationDataset ?? importCameraCalibrationCsvFromText();
    if (!dataset) return;
    const calibration = cameraCalibrationRun?.dataset.dataHash === dataset.dataHash ? cameraCalibrationRun : fitCameraCalibrationDataset(dataset);
    if (!calibration || !dataset) return;
    saveStudy(
      createStudySnapshot({
        id: `l69-camera-calibration-study-${Date.now().toString(36)}`,
        name: "L6.9 camera calibration study",
        mode: "camera.calibration",
        selectedWorkbench: "camera-calibration",
        inputs: {
          dataset: {
            sourceName: dataset.sourceName,
            dataHash: dataset.dataHash,
            sourceTextHash: dataset.sourceTextHash,
            rows: dataset.rows
          },
          fittedProfile: calibration.fittedProfile,
          assumptions: calibration.assumptions
        },
        appState: currentAppState(),
        backendReceipt: { label: "L6.9 Camera Calibration", availability: "executable", scope: "EMVA-inspired diagnostic photon-transfer workflow over summary data only" },
        resultHashes: [dataset.dataHash, calibration.resultHash],
        metrics: calibration.metrics,
        profiles: {
          meanResidualDn: calibration.residuals.map((point) => ({ xM: point.exposureMs * 1e-3, intensity: point.residualMeanDn, label: "mean DN residual" })),
          measuredMeanDn: calibration.residuals.map((point) => ({ xM: point.exposureMs * 1e-3, intensity: point.measuredMeanDn, label: "measured mean DN" })),
          simulatedMeanDn: calibration.residuals.map((point) => ({ xM: point.exposureMs * 1e-3, intensity: point.simulatedMeanDn, label: "simulated mean DN" }))
        },
        warnings: calibration.warnings,
        limitations: calibration.limitations
      })
    );
  }

  function exportCameraCalibrationReport(): void {
    const dataset = cameraCalibrationDataset ?? importCameraCalibrationCsvFromText();
    if (!dataset) return;
    const calibration = cameraCalibrationRun?.dataset.dataHash === dataset.dataHash ? cameraCalibrationRun : fitCameraCalibrationDataset(dataset);
    if (!calibration || !dataset) return;
    const bundle = cameraCalibrationReportBundleJson(dataset, calibration);
    downloadText("l69-camera_calibration_report.json", "application/json", JSON.stringify(bundle, null, 2));
    downloadText("l69-camera_calibration_report.md", "text/markdown", bundle.calibrationReportMarkdown);
    downloadText("l69-camera_calibration_metrics.csv", "text/csv", cameraCalibrationMetricsCsv(calibration));
    downloadText("l69-camera_photon_transfer.csv", "text/csv", cameraPhotonTransferCsv(calibration));
    downloadText("l69-camera_residuals.csv", "text/csv", cameraCalibrationResidualsCsv(calibration));
    downloadText("l69-camera_calibration_warnings.json", "application/json", JSON.stringify(bundle.warningsJson, null, 2));
    setStudyStatus("Exported L6.9 camera calibration report bundle.");
  }

  function sendCameraToMeasuredComparison(): void {
    try {
      const simulated = activeL67SimulatedProfile(cameraSimulatedStudyId);
      const nextRun = cameraRun?.source.resultHash === simulated.resultHash ? cameraRun : createCameraRunFromSimulated(simulated);
      setCameraRun(nextRun);
      const dataset = cameraRunToMeasuredDataset(nextRun);
      const comparison = compareMeasuredToSimulatedProfile({
        id: `l69-camera-comparison-${Date.now().toString(36)}`,
        label: "L6.9 synthetic camera vs clean optical profile",
        measured: dataset,
        simulated
      });
      setMeasuredDataset(dataset);
      setMeasuredComparison(comparison);
      setMeasuredFit(null);
      setMeasuredSimulatedStudyId(cameraSimulatedStudyId);
      setMeasuredCsvText(measuredCsvFromDataset(dataset));
      setStudyStatus(`Synthetic camera image sent to Measured-vs-Simulated: RMS ${comparison.metrics.rmsResidual.toPrecision(4)}.`);
    } catch (error) {
      setStudyStatus(`Camera-to-measured comparison failed: ${(error as Error).message}`);
    }
  }

  function createMtfTargetFromControls(overrides: { blurSigmaPx?: number; id?: string; label?: string } = {}): L70ResolutionTargetImage {
    return generateSlantedEdgeTarget({
      id: overrides.id ?? `l70-slanted-edge-target-${Date.now().toString(36)}`,
      label: overrides.label ?? "L7.0 generated slanted-edge target",
      widthPx: mtfWidthPx,
      heightPx: mtfHeightPx,
      edgeAngleDeg: mtfEdgeAngleDeg,
      blurSigmaPx: overrides.blurSigmaPx ?? mtfBlurSigmaPx,
      contrast: mtfContrast,
      pixelPitchUm: mtfPixelPitchUm
    });
  }

  function generateMtfSlantedEdgeTarget(): L70ResolutionTargetImage {
    const target = createMtfTargetFromControls();
    setMtfTarget(target);
    setMtfImportedFrame(null);
    setMtfRun(null);
    setMtfReferenceRun(null);
    setMtfComparison(null);
    setStudyStatus(`Generated slanted-edge target: ${target.widthPx} x ${target.heightPx} px / ${target.resultHash.slice(0, 10)}.`);
    return target;
  }

  function currentMtfImageInput(): L70ResolutionTargetImage | { widthPx: number; heightPx: number; pixels: number[]; pixelPitchUm: number } {
    if (mtfImportedFrame) {
      return {
        widthPx: mtfImportedFrame.widthPx,
        heightPx: mtfImportedFrame.heightPx,
        pixels: mtfImportedFrame.pixels,
        pixelPitchUm: mtfPixelPitchUm
      };
    }
    return createMtfTargetFromControls();
  }

  function runMtfAnalysis(): SlantedEdgeMtfResult | null {
    try {
      const image = currentMtfImageInput();
      if (!mtfImportedFrame && "schema" in image) setMtfTarget(image);
      const result = runSlantedEdgeMtf({
        id: `l70-mtf-${Date.now().toString(36)}`,
        label: mtfImportedFrame ? "L7.0 imported slanted-edge MTF" : "L7.0 generated slanted-edge MTF",
        sourceLabel: mtfImportedFrame ? "Imported CSV/image frame" : "Generated slanted-edge target",
        image,
        edgeAngleDeg: mtfImportedFrame ? mtfEdgeAngleDeg : undefined,
        oversampling: mtfOversampling,
        window: "hann",
        smoothing: "moving-average",
        polarity: "auto"
      });
      setMtfRun(result);
      setStudyStatus(`MTF analysis complete: MTF50 ${formatNullableMetric(result.metrics.mtf50CyclesPerPx)} cyc/px / ${result.hashes.resultHash.slice(0, 10)}.`);
      return result;
    } catch (error) {
      setStudyStatus(`MTF analysis failed: ${(error as Error).message}`);
      return null;
    }
  }

  function importMtfCsvFromText(sourceName = "mtf-frame.csv"): L70ParsedCsvFrame | null {
    try {
      const frame = parseMtfCsvFrame(mtfCsvText);
      setMtfImportedFrame(frame);
      setMtfTarget(null);
      setMtfRun(null);
      setMtfReferenceRun(null);
      setMtfComparison(null);
      setStudyStatus(`Imported MTF CSV frame: ${sourceName} / ${frame.widthPx} x ${frame.heightPx} px.`);
      return frame;
    } catch (error) {
      setStudyStatus(`MTF CSV import failed: ${(error as Error).message}`);
      return null;
    }
  }

  async function importMtfCsvFile(file: File | null): Promise<void> {
    if (!file) return;
    try {
      const text = await file.text();
      const frame = parseMtfCsvFrame(text);
      setMtfCsvText(text);
      setMtfImportedFrame(frame);
      setMtfTarget(null);
      setMtfRun(null);
      setMtfReferenceRun(null);
      setMtfComparison(null);
      setStudyStatus(`Loaded MTF CSV file: ${file.name} / ${frame.widthPx} x ${frame.heightPx} px.`);
    } catch (error) {
      setStudyStatus(`MTF file import failed: ${(error as Error).message}`);
    }
  }

  function sendCameraToMtfWorkbench(): void {
    const nextRun = cameraRun ?? generateCameraRun();
    if (!nextRun) return;
    const maxDn = Math.max(1, 2 ** nextRun.settings.bitDepth - 1);
    const pixels = Array.from(nextRun.maps.digitalNumbers, (value) => clamp(value / maxDn, 0, 1));
    setMtfImportedFrame({
      widthPx: nextRun.settings.widthPx,
      heightPx: nextRun.settings.heightPx,
      pixels
    });
    setMtfPixelPitchUm(nextRun.settings.pixelPitchM * 1e6);
    setMtfWidthPx(nextRun.settings.widthPx);
    setMtfHeightPx(nextRun.settings.heightPx);
    setMtfTarget(null);
    setMtfRun(null);
    setMtfReferenceRun(null);
    setMtfComparison(null);
    setStudyStatus(`Sent camera DN frame to MTF workbench: ${nextRun.settings.widthPx} x ${nextRun.settings.heightPx} px.`);
  }

  function compareCurrentMtfToBlurredTarget(): void {
    const measured = mtfRun ?? runMtfAnalysis();
    if (!measured) return;
    const blurredTarget = createMtfTargetFromControls({
      blurSigmaPx: Math.max(mtfBlurSigmaPx + 1.4, mtfBlurSigmaPx * 1.8),
      id: `l70-blur-reference-${Date.now().toString(36)}`,
      label: "L7.0 blurrier simulated reference"
    });
    const simulated = runSlantedEdgeMtf({
      id: `l70-blur-reference-mtf-${Date.now().toString(36)}`,
      label: "L7.0 blurrier simulated reference MTF",
      sourceLabel: "Generated blurrier simulated reference",
      image: blurredTarget,
      oversampling: mtfOversampling,
      window: "hann",
      smoothing: "moving-average"
    });
    const comparison = compareMtfRuns(measured, simulated);
    setMtfReferenceRun(simulated);
    setMtfComparison(comparison);
    setStudyStatus(`Compared measured vs simulated MTF: RMS delta ${comparison.metrics.rmsDelta.toPrecision(4)}.`);
  }

  function generateAndAnalyzeLinePairTarget(): void {
    const target = generateLinePairTarget({
      id: `l70-line-pair-target-${Date.now().toString(36)}`,
      label: "L7.0 line-pair target",
      widthPx: mtfWidthPx,
      heightPx: mtfHeightPx,
      contrast: mtfContrast,
      blurSigmaPx: mtfBlurSigmaPx,
      pixelPitchUm: mtfPixelPitchUm
    });
    const analysis = analyzeLinePairTarget(target);
    setLinePairTarget(target);
    setLinePairRun(analysis);
    setStudyStatus(`Generated line-pair target: ${analysis.rows.length} bands / ${analysis.resultHash.slice(0, 10)}.`);
  }

  function saveMtfStudy(): void {
    const result = mtfRun ?? runMtfAnalysis();
    if (!result) return;
    saveStudy(
      createStudySnapshot({
        id: `l70-mtf-study-${Date.now().toString(36)}`,
        name: "L7.0 slanted-edge MTF study",
        mode: "image-quality.mtf",
        selectedWorkbench: "resolution-mtf",
        inputs: {
          target: mtfTarget?.settings ?? { importedFrame: mtfImportedFrame ? `${mtfImportedFrame.widthPx}x${mtfImportedFrame.heightPx}` : "generated-on-run" },
          settings: result.settings,
          linePairTarget: linePairTarget?.settings ?? null
        },
        appState: currentAppState(),
        backendReceipt: {
          label: "L7.0 Slanted-Edge / Resolution Target MTF Workbench",
          availability: "executable",
          scope: "ISO 12233-inspired diagnostic image-quality analysis only; not certified ISO, Imatest, lab, or pure lens-only MTF"
        },
        resultHashes: [result.hashes.resultHash, mtfReferenceRun?.hashes.resultHash, mtfComparison?.resultHash, linePairRun?.resultHash].filter(Boolean) as string[],
        metrics: mtfStudyMetrics(result),
        profiles: {
          mtf: result.mtf.map((point) => ({ xM: point.frequencyCyclesPerPx, intensity: point.mtf, label: "MTF cycles/pixel" })),
          esf: result.esf.map((point) => ({ xM: point.distancePx, intensity: point.value, label: "ESF distance px" })),
          lsf: result.lsf.map((point) => ({ xM: point.distancePx, intensity: point.value, label: "LSF distance px" }))
        },
        warnings: result.warnings,
        limitations: result.limitations
      })
    );
  }

  function exportMtfReport(): void {
    const result = mtfRun ?? runMtfAnalysis();
    if (!result) return;
    downloadText("l70-mtf_report.json", "application/json", slantedEdgeMtfReportJson(result, mtfComparison ?? undefined, linePairRun ?? undefined));
    downloadText("l70-mtf_report.md", "text/markdown", slantedEdgeMtfReportMarkdown(result, mtfComparison ?? undefined, linePairRun ?? undefined));
    downloadText("l70-mtf_curve.csv", "text/csv", slantedEdgeMtfCurveCsv(result));
    downloadText("l70-mtf_esf.csv", "text/csv", slantedEdgeEsfCsv(result));
    downloadText("l70-mtf_lsf.csv", "text/csv", slantedEdgeLsfCsv(result));
    if (mtfComparison) downloadText("l70-mtf_comparison.csv", "text/csv", mtfComparisonCsv(mtfComparison));
    if (linePairRun) downloadText("l70-line_pair_contrast.csv", "text/csv", linePairContrastCsv(linePairRun));
    setStudyStatus("Exported L7.0 MTF report bundle.");
  }

  function l71FocusPositions(): number[] {
    const count = Math.max(1, Math.min(41, Math.round(l71FocusSamples)));
    const start = Math.min(l71FocusStartMm, l71FocusStopMm);
    const stop = Math.max(l71FocusStartMm, l71FocusStopMm);
    if (count === 1) return [roundForUi(start)];
    return Array.from({ length: count }, (_unused, index) => roundForUi(start + ((stop - start) * index) / (count - 1)));
  }

  function l71QualificationSpec() {
    return {
      ...defaultL71QualificationSpec(),
      centerMtf50Min: l71CenterMtf50Min,
      cornerMtf50Min: l71CornerMtf50Min,
      nyquistMtfMin: l71NyquistMtfMin,
      depthOfFocusMinMm: l71DepthOfFocusMinMm,
      disallowSaturatedRois: l71DisallowWarnings,
      disallowLowContrastRois: l71DisallowWarnings,
      disallowBadAngleRois: l71DisallowWarnings
    };
  }

  function runL71FocusSweep(): L71FocusSweepResult {
    const result = runSyntheticFocusSweepMtf({
      id: `l71-focus-sweep-${Date.now().toString(36)}`,
      label: "L7.1 synthetic focus sweep MTF",
      focusPositionsMm: l71FocusPositions(),
      widthPx: mtfWidthPx,
      heightPx: mtfHeightPx,
      edgeAngleDeg: mtfEdgeAngleDeg,
      contrast: mtfContrast,
      pixelPitchUm: mtfPixelPitchUm,
      bestFocusMm: l71BestFocusMm,
      baseBlurSigmaPx: mtfBlurSigmaPx,
      defocusBlurSigmaPerMm: l71DefocusBlurPerMm,
      metric: l71FocusMetric,
      threshold: l71FocusThreshold,
      oversampling: mtfOversampling
    });
    setL71FocusSweepRun(result);
    setL71QualificationRun(null);
    setL71FocusFieldComparison(null);
    setStudyStatus(`L7.1 focus sweep complete: best focus ${formatNullableMetric(result.bestFocus.focusZMm)} mm / DOF ${result.depthOfFocus.rangeMm.toPrecision(4)} mm.`);
    return result;
  }

  function importCurrentMtfIntoL71FocusSweep(): L71FocusSweepResult | null {
    const mtf = mtfRun ?? runMtfAnalysis();
    if (!mtf) return null;
    const row: L71FocusSweepRow = {
      index: 0,
      focusZMm: roundForUi(l71BestFocusMm),
      blurSigmaPx: roundForUi(mtfBlurSigmaPx),
      mtf50CyclesPerPx: mtf.metrics.mtf50CyclesPerPx,
      mtf10CyclesPerPx: mtf.metrics.mtf10CyclesPerPx,
      mtfAtNyquist: mtf.metrics.mtfAtNyquist,
      mtfArea: mtfCurveArea(mtf),
      selectedMetricValue: selectedL71MetricValue(mtf, l71FocusMetric),
      resultHash: mtf.hashes.resultHash,
      warningCodes: mtf.warnings.map((warning) => warning.code)
    };
    const result = finalizeFocusSweep({
      id: `l71-imported-focus-sweep-${Date.now().toString(36)}`,
      label: mtfImportedFrame ? "L7.1 imported current-frame focus MTF" : "L7.1 current generated-frame focus MTF",
      metric: l71FocusMetric,
      threshold: l71FocusThreshold,
      rows: [row]
    });
    setL71FocusSweepRun(result);
    setL71QualificationRun(null);
    setL71FocusFieldComparison(null);
    setStudyStatus(`Imported current MTF into L7.1 focus sweep: ${formatNullableMetric(row.selectedMetricValue)} ${l71FocusMetric}.`);
    return result;
  }

  function runL71FieldMap(): L71FieldMtfMapResult {
    const result = runFieldMtfMap({
      id: `l71-field-map-${Date.now().toString(36)}`,
      label: "L7.1 synthetic field MTF map",
      layout: l71FieldLayout,
      widthPx: mtfWidthPx,
      heightPx: mtfHeightPx,
      edgeAngleDeg: mtfEdgeAngleDeg,
      contrast: mtfContrast,
      pixelPitchUm: mtfPixelPitchUm,
      centerBlurSigmaPx: Math.max(0.05, mtfBlurSigmaPx * 0.65),
      fieldBlurSigmaPx: Math.max(mtfBlurSigmaPx + 0.9, mtfBlurSigmaPx * 1.8),
      oversampling: mtfOversampling
    });
    setL71FieldMapRun(result);
    setL71QualificationRun(null);
    setL71FocusFieldComparison(null);
    setStudyStatus(`L7.1 field MTF map complete: ${result.rows.length} ROIs / worst ${result.worstRoi?.roi.label ?? "n/a"}.`);
    return result;
  }

  function runL71Qualification(): L71QualificationResult {
    const focusSweep = l71FocusSweepRun ?? runL71FocusSweep();
    const fieldMap = l71FieldMapRun ?? runL71FieldMap();
    const result = qualifyFocusFieldMtf({
      id: `l71-qualification-${Date.now().toString(36)}`,
      label: "L7.1 focus + field MTF qualification",
      focusSweep,
      fieldMap,
      spec: l71QualificationSpec()
    });
    setL71QualificationRun(result);
    setStudyStatus(`L7.1 qualification ${result.status.toUpperCase()}: ${result.recommendation}`);
    return result;
  }

  function runL71FocusFieldComparison(): L71FocusFieldComparisonResult {
    const measuredFocus = l71FocusSweepRun ?? runL71FocusSweep();
    const measuredField = l71FieldMapRun ?? runL71FieldMap();
    const simulatedFocus = runSyntheticFocusSweepMtf({
      id: `l71-simulated-focus-sweep-${Date.now().toString(36)}`,
      label: "L7.1 simulated reference focus sweep",
      focusPositionsMm: l71FocusPositions(),
      widthPx: mtfWidthPx,
      heightPx: mtfHeightPx,
      edgeAngleDeg: mtfEdgeAngleDeg,
      contrast: mtfContrast,
      pixelPitchUm: mtfPixelPitchUm,
      bestFocusMm: l71BestFocusMm + 0.05,
      baseBlurSigmaPx: Math.max(0.05, mtfBlurSigmaPx * 0.9),
      defocusBlurSigmaPerMm: l71DefocusBlurPerMm,
      metric: l71FocusMetric,
      threshold: l71FocusThreshold,
      oversampling: mtfOversampling
    });
    const simulatedField = runFieldMtfMap({
      id: `l71-simulated-field-map-${Date.now().toString(36)}`,
      label: "L7.1 simulated reference field MTF map",
      layout: l71FieldLayout,
      widthPx: mtfWidthPx,
      heightPx: mtfHeightPx,
      edgeAngleDeg: mtfEdgeAngleDeg,
      contrast: mtfContrast,
      pixelPitchUm: mtfPixelPitchUm,
      centerBlurSigmaPx: Math.max(0.05, mtfBlurSigmaPx * 0.55),
      fieldBlurSigmaPx: Math.max(mtfBlurSigmaPx + 0.5, mtfBlurSigmaPx * 1.4),
      oversampling: mtfOversampling
    });
    const comparison = compareFocusFieldMtf({
      id: `l71-focus-field-comparison-${Date.now().toString(36)}`,
      label: "L7.1 measured vs simulated focus/field MTF",
      measuredFocus,
      simulatedFocus,
      measuredField,
      simulatedField
    });
    setL71FocusFieldComparison(comparison);
    setStudyStatus(`L7.1 focus/field comparison complete: best-focus delta ${formatNullableMetric(comparison.bestFocusDeltaMm)} mm.`);
    return comparison;
  }

  function exportL71QualificationBundle(): void {
    const focusSweep = l71FocusSweepRun ?? runL71FocusSweep();
    const fieldMap = l71FieldMapRun ?? runL71FieldMap();
    const qualification = l71QualificationRun ?? qualifyFocusFieldMtf({ focusSweep, fieldMap, spec: l71QualificationSpec() });
    const comparison = l71FocusFieldComparison ?? runL71FocusFieldComparison();
    setL71QualificationRun(qualification);
    downloadText("focus_sweep.csv", "text/csv", focusSweepCsv(focusSweep));
    downloadText("field_mtf_map.csv", "text/csv", fieldMtfMapCsv(fieldMap));
    downloadText("qualification_report.md", "text/markdown", qualificationReportMarkdown(qualification, focusSweep, fieldMap, comparison));
    downloadText("qualification_report.json", "application/json", qualificationReportJson(qualification));
    downloadText("mtf_comparison.csv", "text/csv", focusFieldComparisonCsv(comparison));
    setStudyStatus("Exported L7.1 focus/field qualification bundle.");
  }

  function saveL71QualificationStudy(): void {
    const focusSweep = l71FocusSweepRun ?? runL71FocusSweep();
    const fieldMap = l71FieldMapRun ?? runL71FieldMap();
    const qualification = l71QualificationRun ?? runL71Qualification();
    saveStudy(
      createStudySnapshot({
        id: `l71-focus-field-study-${Date.now().toString(36)}`,
        name: "L7.1 focus + field MTF qualification study",
        mode: "image-quality.focus-field-mtf",
        selectedWorkbench: "focus-field-mtf",
        inputs: {
          focus: { startMm: l71FocusStartMm, stopMm: l71FocusStopMm, samples: l71FocusSamples, bestFocusMm: l71BestFocusMm, metric: l71FocusMetric },
          field: { layout: l71FieldLayout, widthPx: mtfWidthPx, heightPx: mtfHeightPx },
          spec: l71QualificationSpec()
        },
        appState: currentAppState(),
        backendReceipt: {
          label: "L7.1 Focus + Field MTF Qualification Workbench",
          availability: "executable",
          scope: "diagnostic focus/field slanted-edge MTF thresholding only; not ISO 12233 certification, Imatest-equivalent testing, calibrated optical model fitting, or 3D Maxwell"
        },
        resultHashes: [focusSweep.resultHash, fieldMap.resultHash, qualification.resultHash, l71FocusFieldComparison?.resultHash].filter(Boolean) as string[],
        metrics: l71StudyMetrics(focusSweep, fieldMap, qualification),
        profiles: {
          focus: focusSweep.rows.map((row) => ({ xM: row.focusZMm, intensity: row.selectedMetricValue ?? 0, label: l71FocusMetric })),
          field: fieldMap.rows.map((row, index) => ({ xM: index, intensity: row.mtf50CyclesPerPx ?? 0, label: row.roi.id }))
        },
        warnings: [...focusSweep.warnings, ...fieldMap.warnings, ...qualification.warnings],
        limitations: qualification.limitations
      })
    );
  }

  function l72GenerateTarget(): L72GeometricTarget {
    const target = generateGeometricCalibrationTarget({
      id: `l72-geometric-target-${Date.now().toString(36)}`,
      label: "L7.2 generated geometric calibration target",
      kind: l72TargetKind,
      widthPx: l72WidthPx,
      heightPx: l72HeightPx,
      rows: l72Rows,
      columns: l72Columns,
      spacingUm: l72SpacingUm,
      pixelPitchUm: l72PixelPitchUm,
      rotationDeg: l72RotationDeg,
      radialK1: l72RadialK1,
      radialK2: l72RadialK2,
      dotRadiusPx: 3,
      contrast: 0.9
    });
    setL72Target(target);
    setL72ImportedPointSet(null);
    setL72PointCsvText(geometricPointsCsv(target));
    setL72Fit(null);
    setL72Comparison(null);
    setL73Detection(null);
    setL73SelectedPointId("");
    setStudyStatus(`Generated L7.2 ${target.kind} target: ${target.points.length} points / ${target.resultHash.slice(0, 10)}.`);
    return target;
  }

  function importL72PointCsv(): L72PointSet | null {
    try {
      const pointSet = parseGeometricPointCsv(l72PointCsvText, { spacingUm: l72SpacingUm, rows: l72Rows, columns: l72Columns });
      setL72ImportedPointSet(pointSet);
      setL72Fit(null);
      setL72Comparison(null);
      setL73Detection(null);
      setL73SelectedPointId("");
      setStudyStatus(`Imported L7.2 point CSV: ${pointSet.points.length} points / ${pointSet.sourceHash.slice(0, 10)}.`);
      return pointSet;
    } catch (error) {
      setStudyStatus(`L7.2 point CSV import failed: ${(error as Error).message}`);
      return null;
    }
  }

  async function importL72PointCsvFile(file: File | null): Promise<void> {
    if (!file) return;
    try {
      const text = await file.text();
      const pointSet = parseGeometricPointCsv(text, { spacingUm: l72SpacingUm, rows: l72Rows, columns: l72Columns });
      setL72PointCsvText(text);
      setL72ImportedPointSet(pointSet);
      setL72Fit(null);
      setL72Comparison(null);
      setL73Detection(null);
      setL73SelectedPointId("");
      setStudyStatus(`Loaded L7.2 point file: ${file.name} / ${pointSet.points.length} points.`);
    } catch (error) {
      setStudyStatus(`L7.2 point file import failed: ${(error as Error).message}`);
    }
  }

  function activeL72PointSource(): L72GeometricTarget | L72PointSet {
    if (l72ImportedPointSet) return l72ImportedPointSet;
    return l72Target ?? l72GenerateTarget();
  }

  function runL72Fit(model: L72FitModel = l72FitModel, sourceOverride?: L72GeometricTarget | L72PointSet): L72GeometricFitResult | null {
    try {
      const source = sourceOverride ?? activeL72PointSource();
      const fit = fitGeometricCalibration({
        id: `l72-geometric-fit-${Date.now().toString(36)}`,
        label: `L7.2 ${model} geometric calibration fit`,
        points: source,
        model
      });
      setL72FitModel(model);
      setL72Fit(fit);
      setL72Comparison(null);
      setStudyStatus(`L7.2 ${model} fit ${fit.status.toUpperCase()}: RMS ${fit.metrics.rmsResidualPx.toPrecision(4)} px / scale ${formatNullableMetric(fit.metrics.meanPixelScaleUmPerPx)} um/px.`);
      return fit;
    } catch (error) {
      setStudyStatus(`L7.2 geometric fit failed: ${(error as Error).message}`);
      return null;
    }
  }

  function runL72Comparison(measuredOverride?: L72GeometricFitResult): L72GeometryComparisonResult | null {
    const measured = measuredOverride ?? l72Fit ?? runL72Fit(l72FitModel);
    if (!measured) return null;
    const simulatedTarget = generateGeometricCalibrationTarget({
      id: `l72-simulated-geometry-${Date.now().toString(36)}`,
      label: "L7.2 simulated geometry reference",
      kind: l72TargetKind,
      widthPx: l72WidthPx,
      heightPx: l72HeightPx,
      rows: l72Rows,
      columns: l72Columns,
      spacingUm: l72SpacingUm,
      pixelPitchUm: l72PixelPitchUm,
      rotationDeg: l72RotationDeg * 0.8,
      radialK1: l72RadialK1 * 0.5,
      radialK2: l72RadialK2 * 0.5
    });
    const simulated = fitGeometricCalibration({
      id: `l72-simulated-fit-${Date.now().toString(36)}`,
      label: "L7.2 simulated reference geometric fit",
      points: pointSetFromTarget(simulatedTarget),
      model: measured.model
    });
    const comparison = compareGeometricCalibrations({ measured, simulated });
    setL72Comparison(comparison);
    setStudyStatus(`Compared L7.2 measured vs simulated geometry: ${comparison.matchedPointCount} matched points.`);
    return comparison;
  }

  function exportL72GeometricBundle(): void {
    const source = l72ImportedPointSet ?? l72Target ?? l72GenerateTarget();
    const fit = l72Fit ?? runL72Fit(l72FitModel, source);
    if (!fit) return;
    const comparison = l72Comparison ?? runL72Comparison(fit) ?? undefined;
    downloadText("geometric_calibration_report.md", "text/markdown", geometricCalibrationReportMarkdown(fit, comparison));
    downloadText("geometric_calibration_report.json", "application/json", geometricCalibrationReportJson(fit, comparison));
    downloadText("points.csv", "text/csv", geometricPointsCsv(source));
    downloadText("residuals.csv", "text/csv", geometricResidualsCsv(fit));
    downloadText("distortion_map.csv", "text/csv", distortionMapCsv(fit));
    if (comparison) downloadText("geometric_comparison.csv", "text/csv", geometricComparisonCsv(comparison));
    setStudyStatus("Exported L7.2 geometric calibration bundle.");
  }

  function saveL72GeometricStudy(): void {
    const source = l72ImportedPointSet ?? l72Target ?? l72GenerateTarget();
    const target = source.schema === "emmicro.l72.geometricTarget.v1" ? source : l72Target;
    const sourceHash = source.schema === "emmicro.l72.geometricTarget.v1" ? source.resultHash : source.sourceHash;
    const fit = l72Fit ?? runL72Fit(l72FitModel, source);
    if (!fit) return;
    saveStudy(
      createStudySnapshot({
        id: `l72-geometric-study-${Date.now().toString(36)}`,
        name: "L7.2 geometric calibration study",
        mode: "image-quality.geometric-calibration",
        selectedWorkbench: "geometric-calibration",
        inputs: {
          target: target?.settings ?? {
            kind: l72TargetKind,
            widthPx: l72WidthPx,
            heightPx: l72HeightPx,
            rows: l72Rows,
            columns: l72Columns,
            spacingUm: l72SpacingUm,
            pixelPitchUm: l72PixelPitchUm,
            rotationDeg: l72RotationDeg,
            radialK1: l72RadialK1,
            radialK2: l72RadialK2
          },
          pointSource: sourceHash,
          model: fit.model
        },
        appState: currentAppState(),
        backendReceipt: {
          label: "L7.2 Geometric Calibration / Distortion & Pixel-Scale Workbench",
          availability: "executable",
          scope: "diagnostic 2D image geometry only; not certified camera calibration, lab metrology, full 3D pose/stereo calibration, digital twin, or 3D Maxwell"
        },
        resultHashes: [target?.resultHash, sourceHash, fit.resultHash, l72Comparison?.resultHash].filter(Boolean) as string[],
        metrics: l72StudyMetrics(fit),
        profiles: {
          residuals: fit.residuals.map((residual, index) => ({ xM: index, intensity: residual.residualPx, label: residual.pointId })),
          distortion: fit.residuals.map((residual) => ({ xM: residual.radiusNorm, intensity: residual.residualPx, label: residual.pointId }))
        },
        warnings: fit.warnings,
        limitations: fit.limitations
      })
    );
  }

  function l73DetectionSettings() {
    return {
      detector: "dot-grid" as const,
      expectedRows: Math.round(clamp(l72Rows, 2, 80)),
      expectedColumns: Math.round(clamp(l72Columns, 2, 80)),
      spacingUm: l72SpacingUm,
      thresholdMode: l73ThresholdMode,
      threshold: l73Threshold,
      polarity: l73Polarity,
      minBlobAreaPx: l73MinBlobAreaPx,
      maxBlobAreaPx: l73MaxBlobAreaPx,
      maxMissingPoints: Math.round(clamp(l73MaxMissingPoints, 0, 500)),
      outlierResidualWarnPx: l73OutlierResidualWarnPx,
      subpixelWindowPx: 3
    };
  }

  function l73RoiInput() {
    return {
      xPx: Math.round(l73RoiXPx),
      yPx: Math.round(l73RoiYPx),
      widthPx: Math.round(l73RoiWidthPx),
      heightPx: Math.round(l73RoiHeightPx)
    };
  }

  function setL73RoiFromImage(image: L73TargetImage, marginFraction = 0.03): void {
    const roi = defaultL73Roi(image, marginFraction);
    setL73RoiXPx(roi.xPx);
    setL73RoiYPx(roi.yPx);
    setL73RoiWidthPx(roi.widthPx);
    setL73RoiHeightPx(roi.heightPx);
  }

  function useL73GeneratedTargetAsImage(): L73TargetImage {
    const target = l72Target ?? l72GenerateTarget();
    const image = targetImageFromGeometricTarget(target);
    setL73TargetImage(image);
    setL73RoiFromImage(image);
    setL73Detection(null);
    setL73SelectedPointId("");
    setStudyStatus(`Loaded L7.3 measured target image from generated ${target.kind}: ${image.imageHash.slice(0, 10)}.`);
    return image;
  }

  async function importL73TargetImageFile(file: File | null): Promise<void> {
    if (!file) return;
    try {
      const image = await decodeL73TargetImageFile(file);
      setL73TargetImage(image);
      setL73RoiFromImage(image);
      setL73Detection(null);
      setL73SelectedPointId("");
      setStudyStatus(`Imported L7.3 target image: ${file.name} / ${image.widthPx} x ${image.heightPx}.`);
    } catch (error) {
      setStudyStatus(`L7.3 target image import failed: ${(error as Error).message}`);
    }
  }

  function runL73AutoDetect(): L73DetectionResult | null {
    try {
      const image = l73TargetImage ?? useL73GeneratedTargetAsImage();
      const detection = detectMeasuredTargetPoints({
        id: `l73-target-detection-${Date.now().toString(36)}`,
        label: "L7.3 measured target dot-grid detection",
        image,
        roi: l73RoiInput(),
        settings: l73DetectionSettings()
      });
      setL73Detection(detection);
      setL72ImportedPointSet(pointSetFromDetection(detection));
      setL72Fit(null);
      setL72Comparison(null);
      setL73SelectedPointId(detection.points[0]?.id ?? detection.rejectedPoints[0]?.id ?? "");
      setStudyStatus(`L7.3 Auto Detect: ${detection.acceptedPointCount}/${detection.expectedPointCount} accepted points / coverage ${detection.coverageScore.toPrecision(4)}.`);
      return detection;
    } catch (error) {
      setStudyStatus(`L7.3 Auto Detect failed: ${(error as Error).message}`);
      return null;
    }
  }

  function applyL73ManualEdits(edits: Parameters<typeof applyDetectionManualEdits>[1]): L73DetectionResult | null {
    const detection = l73Detection ?? runL73AutoDetect();
    if (!detection) return null;
    const updated = applyDetectionManualEdits(detection, edits);
    setL73Detection(updated);
    setL72ImportedPointSet(pointSetFromDetection(updated));
    setL72Fit(null);
    setL72Comparison(null);
    setL73SelectedPointId(selectedL73Point(updated, l73SelectedPointId)?.id ?? updated.points[0]?.id ?? updated.rejectedPoints[0]?.id ?? "");
    setStudyStatus(`Applied L7.3 manual edits: ${updated.acceptedPointCount} accepted / ${updated.rejectedPointCount} rejected.`);
    return updated;
  }

  function moveSelectedL73Point(): void {
    const detection = l73Detection ?? runL73AutoDetect();
    const point = selectedL73Point(detection, l73SelectedPointId);
    if (!detection || !point) {
      setStudyStatus("Run L7.3 detection before moving a point.");
      return;
    }
    applyL73ManualEdits([{ type: "move", id: point.id, xPx: point.xPx + 1.5, yPx: point.yPx + 0.75 }]);
  }

  function rejectSelectedL73Point(): void {
    const detection = l73Detection ?? runL73AutoDetect();
    const point = selectedL73Point(detection, l73SelectedPointId);
    if (!detection || !point) {
      setStudyStatus("Run L7.3 detection before rejecting a point.");
      return;
    }
    applyL73ManualEdits([{ type: "reject", id: point.id, reason: "manual rejection" }]);
  }

  function acceptSelectedL73Point(): void {
    const detection = l73Detection;
    const point = selectedL73Point(detection, l73SelectedPointId);
    if (!detection || !point) {
      setStudyStatus("Select a rejected L7.3 point before accepting it.");
      return;
    }
    applyL73ManualEdits([{ type: "accept", id: point.id }]);
  }

  function addL73Point(): void {
    const detection = l73Detection ?? runL73AutoDetect();
    if (!detection) return;
    const nextIndex = detection.points.length + detection.rejectedPoints.length;
    const row = Math.min(l72Rows - 1, Math.floor(nextIndex / Math.max(1, l72Columns)));
    const col = Math.min(l72Columns - 1, nextIndex % Math.max(1, l72Columns));
    applyL73ManualEdits([{ type: "add", row, col, xPx: l73RoiXPx + l73RoiWidthPx * 0.5, yPx: l73RoiYPx + l73RoiHeightPx * 0.5 }]);
  }

  function deleteSelectedL73Point(): void {
    const detection = l73Detection;
    const point = selectedL73Point(detection, l73SelectedPointId);
    if (!detection || !point) {
      setStudyStatus("Select an L7.3 point before deleting it.");
      return;
    }
    applyL73ManualEdits([{ type: "delete", id: point.id }]);
  }

  function clearL73Detection(): void {
    setL73Detection(null);
    setL73SelectedPointId("");
    setL72ImportedPointSet(null);
    setL72Fit(null);
    setL72Comparison(null);
    setStudyStatus("Cleared L7.3 measured target detection.");
  }

  function runL73GeometryFit(model: L72FitModel = l72FitModel): L72GeometricFitResult | null {
    const detection = l73Detection ?? runL73AutoDetect();
    if (!detection) return null;
    const pointSet = pointSetFromDetection(detection);
    const fit = runL72Fit(model, pointSet);
    if (!fit) return null;
    const updated = attachGeometryFitMetricsToDetection(detection, fit);
    setL73Detection(updated);
    setL72ImportedPointSet(pointSetFromDetection(updated));
    setStudyStatus(`L7.3 Run Geometry Fit: ${model} RMS ${fit.metrics.rmsResidualPx.toPrecision(4)} px / coverage ${updated.coverageScore.toPrecision(4)}.`);
    return fit;
  }

  function exportL73DetectionBundle(): void {
    const detection = l73Detection ?? runL73AutoDetect();
    if (!detection) return;
    downloadText("detected_points.csv", "text/csv", detectedPointsCsv(detection));
    downloadText("rejected_points.csv", "text/csv", rejectedPointsCsv(detection));
    downloadText("detection_report.md", "text/markdown", detectionReportMarkdown(detection));
    downloadText("detection_report.json", "application/json", detectionReportJson(detection));
    if (l72Fit) downloadText("residuals.csv", "text/csv", geometricResidualsCsv(l72Fit));
    setStudyStatus("Exported L7.3 detection bundle.");
  }

  function saveL73DetectionStudy(): void {
    const detection = l73Detection ?? runL73AutoDetect();
    if (!detection) return;
    const fit = l72Fit ?? runL73GeometryFit("similarity");
    saveStudy(
      createStudySnapshot({
        id: `l73-detection-study-${Date.now().toString(36)}`,
        name: "L7.3 measured target detection study",
        mode: "image-quality.target-detection",
        selectedWorkbench: "geometric-calibration",
        inputs: {
          imageHash: detection.imageHash,
          roi: detection.roi,
          settings: detection.settings,
          detection,
          fit
        },
        appState: currentAppState(),
        backendReceipt: {
          label: "L7.3 Measured Target Detection and ROI Hardening",
          availability: "executable",
          scope: "diagnostic ROI-limited dot-grid target detection and L7.2 fit handoff only; not certified camera calibration, lab metrology, AprilTag/ArUco, full 3D pose/stereo, digital twin, or 3D Maxwell"
        },
        resultHashes: [detection.imageHash, detection.resultHash, fit?.resultHash].filter(Boolean) as string[],
        metrics: l73StudyMetrics(detection, fit),
        profiles: {
          detectedPoints: detection.points.map((point) => ({ xM: point.xPx, intensity: point.yPx, label: point.id })),
          rejectedPoints: detection.rejectedPoints.map((point) => ({ xM: point.xPx, intensity: point.yPx, label: point.id })),
          residuals: fit?.residuals.map((residual, index) => ({ xM: index, intensity: residual.residualPx, label: residual.pointId })) ?? []
        },
        warnings: [...detection.warnings, ...(fit?.warnings ?? [])],
        limitations: [...detection.limitations, ...(fit?.limitations ?? [])]
      })
    );
  }

  function generateL75Board(): L75FiducialBoard {
    const board = generateFiducialBoard({
      id: `l75-board-${Date.now().toString(36)}`,
      label: "L7.5 diagnostic ChArUco-style synthetic fiducial board",
      squaresX: Math.round(clamp(l75SquaresX, 3, 20)),
      squaresY: Math.round(clamp(l75SquaresY, 3, 20)),
      squareSizeMm: clamp(l75SquareSizeMm, 0.1, 1000),
      markerSizeFraction: clamp(l75MarkerSizeFraction, 0.2, 0.95),
      imageWidthPx: 560,
      imageHeightPx: 400,
      marginPx: 28
    });
    setL75Board(board);
    setL75Detection(null);
    setL75Match(null);
    setL75Fit(null);
    setL75SelectedMarkerId(board.markers[0]?.id.toString() ?? "");
    setStudyStatus(`Generated L7.5 fiducial board: ${board.markers.length} markers / ${board.charucoCorners.length} ChArUco-style corners / ${board.resultHash.slice(0, 10)}.`);
    return board;
  }

  function createL75SyntheticDetectionForBoard(board: L75FiducialBoard): L75FiducialDetectionBundle {
    const droppedMarkerModulo = Math.round(clamp(l75DroppedMarkerModulo, 0, 50));
    return generateSyntheticFiducialDetection(board, {
      id: `l75-detection-${Date.now().toString(36)}`,
      label: "L7.5 synthetic clean-board fiducial detections",
      droppedMarkerModulo: droppedMarkerModulo >= 2 ? droppedMarkerModulo : undefined,
      includeCharucoCorners: true,
      noisePx: clamp(l75NoisePx, 0, 20)
    });
  }

  function generateL75SyntheticDetections(): L75FiducialDetectionBundle {
    const board = l75Board ?? generateL75Board();
    const detection = createL75SyntheticDetectionForBoard(board);
    setL75Detection(detection);
    setL75Match(null);
    setL75Fit(null);
    setL75SelectedMarkerId(detection.markers[0]?.id.toString() ?? "");
    setStudyStatus(`Generated L7.5 synthetic detections: ${detection.markers.length} markers / ${detection.charucoCorners.length} ChArUco-style corners.`);
    return detection;
  }

  function loadExampleL75DetectionJson(): void {
    setL75DetectionJsonText(exampleL75DetectionJson());
    setStudyStatus("Loaded L7.5 example fiducial detection JSON.");
  }

  function importL75DetectionJson(): L75FiducialDetectionBundle | null {
    try {
      const detection = parseFiducialDetectionJson(l75DetectionJsonText, {
        id: `l75-imported-detection-${Date.now().toString(36)}`,
        label: "L7.5 imported fiducial detection JSON"
      });
      setL75Detection(detection);
      setL75Match(null);
      setL75Fit(null);
      setL75SelectedMarkerId(detection.markers[0]?.id.toString() ?? "");
      setStudyStatus(`Imported L7.5 fiducial JSON: ${detection.markers.length} markers / ${detection.charucoCorners.length} ChArUco-style corners.`);
      return detection;
    } catch (error) {
      setStudyStatus(`L7.5 fiducial JSON import failed: ${(error as Error).message}`);
      return null;
    }
  }

  function matchL75FiducialIds(): L75FiducialMatchResult | null {
    try {
      const board = l75Board ?? generateL75Board();
      const detection = l75Detection ?? createL75SyntheticDetectionForBoard(board);
      if (!l75Detection) {
        setL75Detection(detection);
        setL75SelectedMarkerId(detection.markers[0]?.id.toString() ?? "");
      }
      const match = matchFiducialBoardDetection({
        id: `l75-fiducial-match-${Date.now().toString(36)}`,
        label: "L7.5 diagnostic fiducial ID match",
        board,
        detection
      });
      setL75Match(match);
      setL75Fit(null);
      setL72ImportedPointSet(match.pointSet);
      setL72Fit(null);
      setL72Comparison(null);
      setStudyStatus(`Matched L7.5 fiducial IDs: ${match.matchedPointCount} points / coverage ${match.coverageScore.toPrecision(4)} / missing ${match.missingMarkerIds.length}.`);
      return match;
    } catch (error) {
      setStudyStatus(`L7.5 fiducial matching failed: ${(error as Error).message}`);
      return null;
    }
  }

  function runL75FiducialFit(model: L72FitModel = l72FitModel): L75FiducialFitResult | null {
    try {
      const board = l75Board ?? generateL75Board();
      const detection = l75Detection ?? createL75SyntheticDetectionForBoard(board);
      if (!l75Detection) {
        setL75Detection(detection);
        setL75SelectedMarkerId(detection.markers[0]?.id.toString() ?? "");
      }
      const result = fitFiducialBoardDetection({
        id: `l75-fiducial-fit-${Date.now().toString(36)}`,
        label: `L7.5 fiducial ${model} geometry handoff`,
        board,
        detection,
        model
      });
      setL75Fit(result);
      setL75Match(result.match);
      setL72FitModel(model);
      setL72ImportedPointSet(result.match.pointSet);
      setL72Fit(result.fit);
      setL72Comparison(null);
      setStudyStatus(`L7.5 fiducial ${model} fit ${result.status.toUpperCase()}: ${result.match.matchedPointCount} matched points${result.fit ? ` / RMS ${result.fit.metrics.rmsResidualPx.toPrecision(4)} px` : ""}.`);
      return result;
    } catch (error) {
      setStudyStatus(`L7.5 fiducial fit failed: ${(error as Error).message}`);
      return null;
    }
  }

  function applyL75ManualEdits(edits: Parameters<typeof applyFiducialManualEdits>[1]): L75FiducialDetectionBundle | null {
    const detection = l75Detection ?? generateL75SyntheticDetections();
    const updated = applyFiducialManualEdits(detection, edits);
    setL75Detection(updated);
    setL75Match(null);
    setL75Fit(null);
    setL72Fit(null);
    setL72Comparison(null);
    setL75SelectedMarkerId(selectedL75Marker(updated, l75SelectedMarkerId)?.id.toString() ?? updated.markers[0]?.id.toString() ?? "");
    setStudyStatus(`Applied L7.5 manual fiducial edits: ${updated.markers.filter((marker) => marker.status === "accepted").length} accepted markers / ${updated.markers.filter((marker) => marker.status === "rejected").length} rejected.`);
    return updated;
  }

  function rejectSelectedL75Marker(): void {
    const detection = l75Detection ?? generateL75SyntheticDetections();
    const marker = selectedL75Marker(detection, l75SelectedMarkerId);
    if (!marker) {
      setStudyStatus("Generate or import L7.5 detections before rejecting a marker.");
      return;
    }
    applyL75ManualEdits([{ type: "reject-marker", id: marker.id, reason: "manual marker rejection" }]);
  }

  function acceptSelectedL75Marker(): void {
    const detection = l75Detection;
    const marker = selectedL75Marker(detection, l75SelectedMarkerId);
    if (!detection || !marker) {
      setStudyStatus("Select a rejected L7.5 marker before accepting it.");
      return;
    }
    applyL75ManualEdits([{ type: "accept-marker", id: marker.id }]);
  }

  function moveSelectedL75Corner(): void {
    const detection = l75Detection ?? generateL75SyntheticDetections();
    const marker = selectedL75Marker(detection, l75SelectedMarkerId);
    if (!marker) {
      setStudyStatus("Generate or import L7.5 detections before moving a marker corner.");
      return;
    }
    const corner = marker.cornersPx[0];
    applyL75ManualEdits([{ type: "move-marker-corner", id: marker.id, cornerIndex: 0, xPx: corner.xPx + 1.2, yPx: corner.yPx + 0.6 }]);
  }

  function relabelSelectedL75Marker(): void {
    const board = l75Board ?? generateL75Board();
    const detection = l75Detection ?? generateL75SyntheticDetections();
    const marker = selectedL75Marker(detection, l75SelectedMarkerId);
    if (!marker) {
      setStudyStatus("Generate or import L7.5 detections before relabeling a marker.");
      return;
    }
    const usedIds = new Set(detection.markers.map((candidate) => candidate.id));
    const missingBoardMarker = board.markers.find((candidate) => !usedIds.has(candidate.id));
    applyL75ManualEdits([{ type: "relabel-marker", id: marker.id, nextId: missingBoardMarker?.id ?? marker.id + 1000 }]);
  }

  function exportL75FiducialBundle(): void {
    const board = l75Board ?? generateL75Board();
    const detection = l75Detection ?? generateL75SyntheticDetections();
    const result = l75Fit ?? runL75FiducialFit("similarity");
    if (!result) return;
    downloadText("board_manifest.json", "application/json", fiducialBoardManifestJson(board));
    downloadText("fiducial_detection_report.md", "text/markdown", fiducialDetectionReportMarkdown(result));
    downloadText("fiducial_detection_report.json", "application/json", fiducialDetectionReportJson(result));
    downloadText("matched_points.csv", "text/csv", fiducialMatchedPointsCsv(result));
    downloadText("rejected_points.csv", "text/csv", fiducialRejectedPointsCsv(detection));
    setStudyStatus("Exported L7.5 fiducial board bundle.");
  }

  function addL75FiducialToSessionQa(): L74SessionQaResult | null {
    const result = l75Fit ?? runL75FiducialFit("similarity");
    if (!result) return null;
    try {
      const manifestText = "frame_id,type,path_or_name,notes\nfid_001,fiducial_board,l75-fiducial-detection.json,L7.5 fiducial board handoff";
      const manifest = parseL74SessionManifestCsv(manifestText);
      const frame = l74FrameFromFiducialFit(manifest.rows[0]!, result);
      const session = runL74SessionQa({
        id: `l75-fiducial-session-qa-${Date.now().toString(36)}`,
        label: "L7.5 fiducial session QA handoff",
        manifestHash: manifest.manifestHash,
        frames: [frame],
        thresholds: l74Thresholds(),
        warnings: manifest.warnings
      });
      setL74ManifestText(manifestText);
      setL74SessionQa(session);
      setStudyStatus(`Added L7.5 fiducial frame to L7.4 session QA: ${session.status.toUpperCase()} / ${session.aggregates.length} aggregate metrics.`);
      return session;
    } catch (error) {
      setStudyStatus(`L7.5 fiducial session handoff failed: ${(error as Error).message}`);
      return null;
    }
  }

  function saveL75FiducialStudy(): void {
    const board = l75Board ?? generateL75Board();
    const detection = l75Detection ?? generateL75SyntheticDetections();
    const result = l75Fit ?? runL75FiducialFit("similarity");
    if (!result) return;
    saveStudy(
      createStudySnapshot({
        id: `l75-fiducial-study-${Date.now().toString(36)}`,
        name: "L7.5 fiducial board diagnostic study",
        mode: "image-quality.fiducial-board",
        selectedWorkbench: "fiducial-board",
        inputs: {
          board: board.settings,
          detection,
          match: result.match,
          fit: result.fit
        },
        appState: currentAppState(),
        backendReceipt: {
          label: "L7.5 Fiducial Board / ChArUco-style Target Workflow",
          availability: "executable",
          scope: "diagnostic synthetic fiducial board generation, imported/synthetic detection matching, manual correction, L7.2 geometry handoff, and L7.4 session QA handoff only; not OpenCV-compatible ArUco/ChArUco marker decoding, AprilTag decoding, certified camera calibration, hardware control, full 3D pose/stereo calibration, digital twin, manufacturing certification, or 3D Maxwell"
        },
        resultHashes: [board.resultHash, detection.resultHash, result.match.resultHash, result.fit?.resultHash, result.resultHash].filter(Boolean) as string[],
        metrics: l75StudyMetrics(result),
        profiles: {
          matchedPoints: result.match.matchedPoints.map((point, index) => ({ xM: index, intensity: point.xPx, label: point.id })),
          residuals: result.fit?.residuals.map((residual, index) => ({ xM: index, intensity: residual.residualPx, label: residual.pointId })) ?? []
        },
        warnings: [...board.warnings, ...detection.warnings, ...result.match.warnings, ...result.warnings, ...(result.fit?.warnings ?? [])],
        limitations: result.limitations
      })
    );
  }

  function l74Thresholds(): L74SessionThresholds {
    return defaultL74Thresholds({
      maxGeometricRmsResidualPx: l74MaxGeometricRmsResidualPx,
      maxPixelScaleRepeatabilityStdUmPerPx: l74MaxPixelScaleRepeatabilityStd,
      minMtf50CyclesPerPx: l74MinMtf50CyclesPerPx,
      maxMtf50CoefficientOfVariation: l74MaxMtf50Cv,
      maxCameraBlackLevelDriftDn: l74MaxCameraBlackLevelDriftDn,
      maxAllowedWarningCount: l74MaxAllowedWarningCount,
      minDetectionCoverage: l74MinDetectionCoverage,
      maxZScore: l74MaxZScore
    });
  }

  function loadL74ExampleManifest(): void {
    setL74ManifestText(exampleL74SessionManifestCsv());
    setL74SessionQa(null);
    setStudyStatus("Loaded L7.4 example batch session manifest.");
  }

  function buildL74FramesFromManifest(rows: ReturnType<typeof parseL74SessionManifestCsv>["rows"]): L74SessionFrame[] {
    const synthetic = l74SyntheticFramesFromManifest(rows);
    return rows.map((row, index) => {
      if ((row.type === "dot_grid" || row.type === "target_detection") && l73Detection) return l74FrameFromDetection(row, l73Detection);
      if ((row.type === "dot_grid" || row.type === "point_csv" || row.type === "geometric_fit") && l72Fit) return l74FrameFromGeometricFit(row, l72Fit);
      if (row.type === "fiducial_board" && l75Fit) return l74FrameFromFiducialFit(row, l75Fit);
      if (row.type === "slanted_edge" && mtfRun) return l74FrameFromMtf(row, mtfRun);
      if (row.type === "focus_sweep_mtf" && l71FocusSweepRun) return l74FrameFromFocusSweep(row, l71FocusSweepRun);
      if (row.type === "field_mtf_map" && l71FieldMapRun) return l74FrameFromFieldMap(row, l71FieldMapRun);
      if (row.type === "camera_calibration" && cameraCalibrationRun) return l74FrameFromCameraCalibration(row, cameraCalibrationRun);
      if (row.type === "camera_frame" && cameraRun) return l74FrameFromCameraRun(row, cameraRun);
      return synthetic[index]!;
    });
  }

  function runL74SessionAnalysis(): L74SessionQaResult | null {
    try {
      const manifest = parseL74SessionManifestCsv(l74ManifestText);
      const frames = buildL74FramesFromManifest(manifest.rows);
      const result = runL74SessionQa({
        id: `l74-session-qa-${Date.now().toString(36)}`,
        label: "L7.4 batch measurement session QA",
        manifestHash: manifest.manifestHash,
        frames,
        thresholds: l74Thresholds(),
        warnings: manifest.warnings
      });
      setL74SessionQa(result);
      setStudyStatus(`L7.4 session QA ${result.status.toUpperCase()}: ${result.frameCount} frames / ${result.outliers.length} outliers / ${result.rejectedFrameCount} rejected.`);
      return result;
    } catch (error) {
      setStudyStatus(`L7.4 session analysis failed: ${(error as Error).message}`);
      return null;
    }
  }

  function exportL74SessionBundle(): void {
    const result = l74SessionQa ?? runL74SessionAnalysis();
    if (!result) return;
    downloadText("session_report.md", "text/markdown", sessionReportMarkdown(result));
    downloadText("session_report.json", "application/json", sessionReportJson(result));
    downloadText("frame_metrics.csv", "text/csv", frameMetricsCsv(result));
    downloadText("session_metrics.csv", "text/csv", sessionMetricsCsv(result));
    downloadText("outliers.csv", "text/csv", outliersCsv(result));
    downloadText("warnings.json", "application/json", sessionWarningsJson(result));
    setStudyStatus("Exported L7.4 session QA bundle.");
  }

  function saveL74SessionStudy(): void {
    const result = l74SessionQa ?? runL74SessionAnalysis();
    if (!result) return;
    saveStudy(
      createStudySnapshot({
        id: `l74-session-study-${Date.now().toString(36)}`,
        name: "L7.4 batch measurement session QA study",
        mode: "image-quality.batch-session-qa",
        selectedWorkbench: "batch-session-qa",
        inputs: {
          manifestText: l74ManifestText,
          manifestHash: result.manifestHash,
          thresholds: result.thresholds,
          frames: result.frames,
          aggregates: result.aggregates,
          outliers: result.outliers
        },
        appState: currentAppState(),
        backendReceipt: {
          label: "L7.4 Batch Measurement Session + Repeatability QA",
          availability: "executable",
          scope: "diagnostic batch repeatability/session QA over existing L6.8-L7.3 metrics only; not certified calibration, ISO/Imatest/EMVA certification, lab metrology, hardware control, full 3D pose/stereo, digital twin, manufacturing certification, or 3D Maxwell"
        },
        resultHashes: [result.resultHash, ...result.frames.map((frame) => frame.resultHash)].filter(Boolean),
        metrics: l74StudyMetrics(result),
        profiles: {
          frameStatus: result.frames.map((frame, index) => ({ xM: index, intensity: frame.status === "fail" ? 2 : frame.status === "warning" ? 1 : 0, label: frame.frameId })),
          outliers: result.outliers.map((outlier, index) => ({ xM: index, intensity: outlier.value, label: `${outlier.frameId}:${outlier.metricId}` }))
        },
        warnings: result.warnings,
        limitations: result.limitations
      })
    );
  }

  function generateSyntheticMeasuredCsv(): void {
    try {
      const simulated = activeL67SimulatedProfile();
      setMeasuredCsvText(syntheticMeasuredCsvFromProfile(simulated.profile, { shiftM: 2e-4, scale: 0.88, background: 0.035 }));
      setMeasuredDataset(null);
      setMeasuredComparison(null);
      setMeasuredFit(null);
      setStudyStatus("Generated synthetic measured CSV from active simulated profile.");
    } catch (error) {
      setStudyStatus(`Synthetic measured CSV failed: ${(error as Error).message}`);
    }
  }

  function importMeasuredCsvFromText(): L67MeasuredDataset | null {
    try {
      const dataset = parseMeasuredCsvProfile(measuredCsvText, {
        id: `l67-csv-${Date.now().toString(36)}`,
        label: "L6.7 measured CSV profile",
        sourceName: "measured-profile.csv",
        calibration: {
          positionUnit: "m",
          pixelSizeM: measuredPixelSizeUm * 1e-6,
          xOffsetM: measuredOffsetUm * 1e-6,
          roi: { xMinM: measuredRoiMinMm * 1e-3, xMaxM: measuredRoiMaxMm * 1e-3 },
          normalizationMode: "none"
        },
        notes: "Imported through L6.7 measured-vs-simulated workspace"
      });
      setMeasuredDataset(dataset);
      setMeasuredComparison(null);
      setMeasuredFit(null);
      setStudyStatus(`Imported measured profile: ${dataset.measuredDataHash.slice(0, 10)}`);
      return dataset;
    } catch (error) {
      setStudyStatus(`Measured CSV import failed: ${(error as Error).message}`);
      return null;
    }
  }

  async function importMeasuredDataFile(file: File | null): Promise<void> {
    if (!file) return;
    try {
      if (/\.csv$/i.test(file.name) || file.type.includes("csv") || file.type === "text/plain") {
        setMeasuredCsvText(await file.text());
        setMeasuredDataset(null);
        setMeasuredComparison(null);
        setMeasuredFit(null);
        setStudyStatus(`Loaded measured CSV file: ${file.name}`);
        return;
      }
      if (!file.type.startsWith("image/")) throw new Error("Measured import supports PNG/JPEG images or CSV profiles.");
      const decoded = await decodeMeasuredImageFile(file);
      const dataset = createMeasuredProfileFromImagePixels({
        id: `l67-image-${Date.now().toString(36)}`,
        label: "L6.7 measured image centerline",
        sourceName: file.name,
        widthPx: decoded.widthPx,
        heightPx: decoded.heightPx,
        data: decoded.data,
        channels: "rgba",
        calibration: {
          pixelSizeM: measuredPixelSizeUm * 1e-6,
          xOffsetM: measuredOffsetUm * 1e-6,
          roi: { xMinM: measuredRoiMinMm * 1e-3, xMaxM: measuredRoiMaxMm * 1e-3 },
          normalizationMode: "peak"
        },
        notes: "PNG/JPEG decoded to grayscale centerline for diagnostic comparison"
      });
      setMeasuredDataset(dataset);
      setMeasuredComparison(null);
      setMeasuredFit(null);
      setStudyStatus(`Imported measured image: ${dataset.measuredDataHash.slice(0, 10)}`);
    } catch (error) {
      setStudyStatus(`Measured file import failed: ${(error as Error).message}`);
    }
  }

  function runMeasuredVsSimulatedComparison(): void {
    const dataset = measuredDataset ?? importMeasuredCsvFromText();
    if (!dataset) return;
    try {
      const comparison = compareMeasuredToSimulatedProfile({
        id: `l67-comparison-${Date.now().toString(36)}`,
        label: "L6.7 measured-vs-simulated profile comparison",
        measured: dataset,
        simulated: activeL67SimulatedProfile()
      });
      setMeasuredComparison(comparison);
      setMeasuredFit(null);
      setStudyStatus(`Measured comparison complete: RMS ${comparison.metrics.rmsResidual.toPrecision(4)}`);
    } catch (error) {
      setStudyStatus(`Measured comparison failed: ${(error as Error).message}`);
    }
  }

  function runMeasuredDiagnosticFit(): void {
    const dataset = measuredDataset ?? importMeasuredCsvFromText();
    if (!dataset) return;
    const comparison =
      measuredComparison ??
      compareMeasuredToSimulatedProfile({
        id: `l67-comparison-${Date.now().toString(36)}`,
        label: "L6.7 measured-vs-simulated profile comparison",
        measured: dataset,
        simulated: activeL67SimulatedProfile()
      });
    try {
      const fit = runL67DiagnosticFit({
        comparison,
        measured: dataset,
        simulated: activeL67SimulatedProfile(),
        settings: {
          shiftStartM: -5e-4,
          shiftStopM: 5e-4,
          shiftSteps: 11,
          scaleStart: 0.7,
          scaleStop: 1.2,
          scaleSteps: 6,
          backgroundStart: -0.05,
          backgroundStop: 0.1,
          backgroundSteps: 7
        }
      });
      const fittedComparison = compareMeasuredToSimulatedProfile({
        id: comparison.id,
        label: comparison.label,
        measured: dataset,
        simulated: activeL67SimulatedProfile(),
        shiftM: fit.best.shiftM,
        intensityScale: fit.best.intensityScale,
        backgroundOffset: fit.best.backgroundOffset
      });
      setMeasuredComparison(fittedComparison);
      setMeasuredFit(fit);
      setStudyStatus(`Diagnostic fit improved RMS by ${fit.improvement.rmsResidualDelta.toExponential(3)}.`);
    } catch (error) {
      setStudyStatus(`Measured fit failed: ${(error as Error).message}`);
    }
  }

  function saveMeasuredComparisonStudy(): void {
    if (!measuredComparison) {
      setStudyStatus("Run measured comparison before saving a comparison study.");
      return;
    }
    const bundle = measuredComparisonBundleJson(measuredComparison, measuredFit ?? undefined);
    saveStudy(
      createStudySnapshot({
        id: `l67-measured-comparison-${Date.now().toString(36)}`,
        name: "L6.7 measured comparison",
        mode: "measured.comparison",
        selectedWorkbench: "measured-vs-simulated",
        inputs: {
          measured: measuredComparison.measured,
          simulated: measuredComparison.simulated,
          alignment: measuredComparison.alignment,
          fit: measuredFit?.best ?? null
        },
        appState: currentAppState(),
        backendReceipt: { label: "L6.7 Measured-vs-Simulated Workbench", availability: "diagnostic", scope: "existing scalar validation or planar TMM outputs only" },
        resultHashes: [measuredComparison.resultHash, measuredFit?.resultHash].filter(Boolean) as string[],
        metrics: [
          { id: "rmsResidual", label: "RMS residual", value: measuredComparison.metrics.rmsResidual },
          { id: "maeResidual", label: "MAE residual", value: measuredComparison.metrics.maeResidual },
          { id: "maxAbsResidual", label: "Max absolute residual", value: measuredComparison.metrics.maxAbsResidual },
          { id: "normalizedCrossCorrelation", label: "Normalized cross-correlation", value: measuredComparison.metrics.normalizedCrossCorrelation },
          ...(measuredFit ? [{ id: "fitRmsImprovement", label: "Fit RMS improvement", value: measuredFit.improvement.rmsResidualDelta }] : [])
        ],
        profiles: {
          residual: measuredComparison.residualProfile.map((point) => ({ xM: point.xM, intensity: point.residual })),
          measured: measuredComparison.residualProfile.map((point) => ({ xM: point.xM, intensity: point.measured })),
          simulated: measuredComparison.residualProfile.map((point) => ({ xM: point.xM, intensity: point.simulated }))
        },
        warnings: bundle.warningsJson,
        limitations: measuredComparison.limitations
      })
    );
  }

  function exportMeasuredComparisonReport(): void {
    if (!measuredComparison) {
      setStudyStatus("Run measured comparison before exporting a report.");
      return;
    }
    const bundle = measuredComparisonBundleJson(measuredComparison, measuredFit ?? undefined);
    downloadText("l67-comparison_report.json", "application/json", JSON.stringify(bundle, null, 2));
    downloadText("l67-comparison_report.md", "text/markdown", bundle.comparisonReportMarkdown);
    downloadText("l67-measured_metrics.csv", "text/csv", measuredMetricsCsv(measuredComparison));
    downloadText("l67-simulated_metrics.csv", "text/csv", simulatedMetricsCsv(measuredComparison));
    downloadText("l67-residual_profile.csv", "text/csv", residualProfileCsv(measuredComparison));
    downloadText("l67-fit_grid.csv", "text/csv", fitGridCsv(measuredFit ?? undefined));
    downloadText("l67-warnings.json", "application/json", JSON.stringify(bundle.warningsJson, null, 2));
    setStudyStatus("Exported L6.7 measured comparison report bundle.");
  }

  function activeValidationStudySummary(): {
    id: string;
    mode: StudyMode;
    inputs: unknown;
    resultHash: string;
    metrics: StudyMetric[];
    profiles: Record<string, { xM: number; intensity: number }[]>;
    warnings: SolverWarning[];
    limitations: string[];
  } {
    if (validationBenchmark === "coherence") {
      return {
        id: "coherence-study",
        mode: "validation.coherence",
        inputs: coherenceResult.config,
        resultHash: coherenceResult.resultHash,
        metrics: [
          { id: "visibility", label: "Fringe visibility", value: coherenceResult.visibility.measured },
          { id: "visibilityError", label: "Visibility error", value: coherenceResult.visibility.error },
          { id: "orderSpacingMm", label: "Order spacing", value: coherenceResult.expected.orderSpacingSmallAngleM * 1e3, unit: "mm" }
        ],
        profiles: {
          centerline: coherenceResult.profile.map((sample) => ({ xM: sample.positionM, intensity: sample.partialIntensity }))
        },
        warnings: coherenceResult.warnings,
        limitations: coherenceResult.provenance.limitations
      };
    }
    if (validationBenchmark === "thin-lens") {
      return {
        id: "thin-lens-study",
        mode: "validation.thin-lens",
        inputs: lensResult.config,
        resultHash: lensResult.resultHash,
        metrics: [
          { id: "firstDarkRadiusUm", label: "First dark radius", value: lensResult.expected.firstDarkRadiusM * 1e6, unit: "um" },
          { id: "focusPeak", label: "Configured focus peak", value: lensResult.comparison.focus.configuredPlanePeakRelative },
          { id: "rmsResidual", label: "RMS residual", value: lensResult.residuals.rmsResidual }
        ],
        profiles: {
          radial: lensResult.radialProfile.map((sample) => ({ xM: sample.radiusM, intensity: sample.numericalIntensity }))
        },
        warnings: lensResult.warnings,
        limitations: lensResult.provenance.limitations
      };
    }
    if (validationBenchmark === "single-slit" || validationBenchmark === "double-slit") {
      const result = selectedSlitResult;
      return {
        id: `${validationBenchmark}-study`,
        mode: validationBenchmark === "single-slit" ? "validation.single-slit" : "validation.double-slit",
        inputs: result.config,
        resultHash: result.resultHash,
        metrics: [
          { id: "primarySpacingMm", label: "Primary spacing", value: result.expected.primarySpacingSmallAngleM * 1e3, unit: "mm" },
          { id: "rmsResidual", label: "RMS residual", value: result.residuals.rmsResidual },
          { id: "maxResidual", label: "Max residual", value: result.residuals.maxResidual }
        ],
        profiles: {
          centerline: result.profile.map((sample) => ({ xM: sample.positionM, intensity: sample.numericalIntensity }))
        },
        warnings: result.warnings,
        limitations: result.provenance.limitations
      };
    }
    if (validationBenchmark === "advisor-review") {
      return {
        id: "advisor-review-study",
        mode: "validation.advisor-review",
        inputs: advisorReview.generatedBenchmarks,
        resultHash: advisorReview.resultHash,
        metrics: [
          { id: "warningCount", label: "Warning count", value: advisorReview.warnings.length },
          { id: "benchmarkCount", label: "Benchmark count", value: advisorReview.generatedBenchmarks.length }
        ],
        profiles: {},
        warnings: advisorReview.warnings,
        limitations: advisorReview.limitations
      };
    }
    return {
      id: "circular-aperture-study",
      mode: "validation.circular-aperture",
      inputs: validationResult.config,
      resultHash: validationResult.resultHash,
      metrics: [
        { id: "firstMinimumMm", label: "Expected first minimum", value: validationResult.expected.firstMinimumRadiusM * 1e3, unit: "mm" },
        { id: "rmsResidual", label: "RMS residual", value: validationResult.residuals.rmsResidual },
        { id: "finitePlaneError", label: "Finite-plane error", value: validationResult.comparison.energy.relativePlaneIntegralError }
      ],
      profiles: {
        radial: validationResult.radialProfile.map((sample) => ({ xM: sample.radiusM, intensity: sample.numericalIntensity }))
      },
      warnings: validationResult.warnings,
      limitations: validationResult.provenance.limitations
    };
  }

  function currentAppState(): unknown {
    return {
      validation: {
        benchmark: validationBenchmark,
        planeZMm: validationPlaneZMm,
        mode: validationMode,
        coherenceMode,
        coherenceGamma: coherenceGammaMagnitude,
        coherenceSlitWidthUm,
        coherenceSlitSeparationUm,
        coherencePropagationDistanceM,
        lensObservationZMm
      },
      coating: {
        presetId,
        incidentMaterialId,
        substrateMaterialId,
        wavelengthNm,
        angleDeg,
        polarization,
        layers
      },
      measured: {
        pixelSizeUm: measuredPixelSizeUm,
        xOffsetUm: measuredOffsetUm,
        roiMinMm: measuredRoiMinMm,
        roiMaxMm: measuredRoiMaxMm,
        simulatedStudyId: measuredSimulatedStudyId,
        measuredDataHash: measuredDataset?.measuredDataHash ?? null,
        comparisonHash: measuredComparison?.resultHash ?? null,
        fitHash: measuredFit?.resultHash ?? null
      },
      camera: {
        simulatedStudyId: cameraSimulatedStudyId,
        pixelPitchUm: cameraPixelPitchUm,
        widthPx: cameraWidthPx,
        heightPx: cameraHeightPx,
        quantumEfficiency: cameraQuantumEfficiency,
        exposureMs: cameraExposureMs,
        photonFluxScale: cameraPhotonFluxScale,
        fullWellElectrons: cameraFullWellElectrons,
        readNoiseElectrons: cameraReadNoiseElectrons,
        darkCurrentElectrons: cameraDarkCurrentElectrons,
        bitDepth: cameraBitDepth,
        gainDnPerElectron: cameraGainDnPerElectron,
        blackLevelDn: cameraBlackLevelDn,
        seed: cameraSeed,
        noiseMode: cameraNoiseMode,
        cameraRunHash: cameraRun?.resultHash ?? null,
        sourceResultHash: cameraRun?.source.resultHash ?? null
      },
      calibration: {
        csvText: cameraCalibrationCsvText,
        datasetHash: cameraCalibrationDataset?.dataHash ?? null,
        calibrationRunHash: cameraCalibrationRun?.resultHash ?? null
      },
      mtf: {
        widthPx: mtfWidthPx,
        heightPx: mtfHeightPx,
        edgeAngleDeg: mtfEdgeAngleDeg,
        blurSigmaPx: mtfBlurSigmaPx,
        contrast: mtfContrast,
        oversampling: mtfOversampling,
        pixelPitchUm: mtfPixelPitchUm,
        csvText: mtfCsvText,
        targetHash: mtfTarget?.resultHash ?? null,
        importedSize: mtfImportedFrame ? `${mtfImportedFrame.widthPx}x${mtfImportedFrame.heightPx}` : null,
        runHash: mtfRun?.hashes.resultHash ?? null,
        comparisonHash: mtfComparison?.resultHash ?? null,
        linePairHash: linePairRun?.resultHash ?? null
      },
      focusField: {
        focusStartMm: l71FocusStartMm,
        focusStopMm: l71FocusStopMm,
        focusSamples: l71FocusSamples,
        bestFocusMm: l71BestFocusMm,
        defocusBlurPerMm: l71DefocusBlurPerMm,
        focusMetric: l71FocusMetric,
        focusThreshold: l71FocusThreshold,
        fieldLayout: l71FieldLayout,
        centerMtf50Min: l71CenterMtf50Min,
        cornerMtf50Min: l71CornerMtf50Min,
        nyquistMtfMin: l71NyquistMtfMin,
        depthOfFocusMinMm: l71DepthOfFocusMinMm,
        disallowWarnings: l71DisallowWarnings,
        focusSweepHash: l71FocusSweepRun?.resultHash ?? null,
        fieldMapHash: l71FieldMapRun?.resultHash ?? null,
        qualificationHash: l71QualificationRun?.resultHash ?? null,
        comparisonHash: l71FocusFieldComparison?.resultHash ?? null
      },
      geometric: {
        targetKind: l72TargetKind,
        widthPx: l72WidthPx,
        heightPx: l72HeightPx,
        rows: l72Rows,
        columns: l72Columns,
        spacingUm: l72SpacingUm,
        pixelPitchUm: l72PixelPitchUm,
        rotationDeg: l72RotationDeg,
        radialK1: l72RadialK1,
        radialK2: l72RadialK2,
        fitModel: l72FitModel,
        pointCsvText: l72PointCsvText,
        targetHash: l72Target?.resultHash ?? null,
        importedPointHash: l72ImportedPointSet?.sourceHash ?? null,
        fitHash: l72Fit?.resultHash ?? null,
        comparisonHash: l72Comparison?.resultHash ?? null
      },
      targetDetection: {
        imageHash: l73TargetImage?.imageHash ?? null,
        detectionHash: l73Detection?.resultHash ?? null,
        selectedPointId: l73SelectedPointId,
        showLabels: l73ShowLabels,
        roiXPx: l73RoiXPx,
        roiYPx: l73RoiYPx,
        roiWidthPx: l73RoiWidthPx,
        roiHeightPx: l73RoiHeightPx,
        thresholdMode: l73ThresholdMode,
        threshold: l73Threshold,
        polarity: l73Polarity,
        minBlobAreaPx: l73MinBlobAreaPx,
        maxBlobAreaPx: l73MaxBlobAreaPx,
        maxMissingPoints: l73MaxMissingPoints,
        outlierResidualWarnPx: l73OutlierResidualWarnPx
      },
      batchSession: {
        manifestText: l74ManifestText,
        sessionHash: l74SessionQa?.resultHash ?? null,
        maxGeometricRmsResidualPx: l74MaxGeometricRmsResidualPx,
        maxPixelScaleRepeatabilityStd: l74MaxPixelScaleRepeatabilityStd,
        minMtf50CyclesPerPx: l74MinMtf50CyclesPerPx,
        maxMtf50Cv: l74MaxMtf50Cv,
        maxCameraBlackLevelDriftDn: l74MaxCameraBlackLevelDriftDn,
        maxAllowedWarningCount: l74MaxAllowedWarningCount,
        minDetectionCoverage: l74MinDetectionCoverage,
        maxZScore: l74MaxZScore
      },
      fiducialBoard: {
        squaresX: l75SquaresX,
        squaresY: l75SquaresY,
        squareSizeMm: l75SquareSizeMm,
        markerSizeFraction: l75MarkerSizeFraction,
        droppedMarkerModulo: l75DroppedMarkerModulo,
        noisePx: l75NoisePx,
        boardHash: l75Board?.resultHash ?? null,
        detectionHash: l75Detection?.sourceHash ?? null,
        matchHash: l75Match?.resultHash ?? null,
        fitHash: l75Fit?.resultHash ?? null,
        selectedMarkerId: l75SelectedMarkerId
      }
    };
  }

  function activeMeasurementField(): FieldOutput2D {
    if (validationBenchmark === "coherence") return coherenceResult.partialField;
    if (validationBenchmark === "thin-lens") return lensResult.numericalField;
    if (validationBenchmark === "single-slit" || validationBenchmark === "double-slit") return selectedSlitResult.numericalField;
    return validationResult.numericalField;
  }

  function activeProfileCsv(): string {
    const summary = activeValidationStudySummary();
    const firstProfile = Object.entries(summary.profiles)[0];
    if (!firstProfile) return "profile_id,x_m,intensity,label";
    return profileCsv(firstProfile[1].map((sample) => ({ ...sample })), firstProfile[0]);
  }

  function coherenceRunSummary(id: string, label: string, result: CoherenceDemonstratorResult): StudyRunSummary {
    return {
      id,
      label,
      kind: "validation.coherence",
      resultHash: result.resultHash,
      metrics: [
        { id: "visibility", label: "Fringe visibility", value: result.visibility.measured },
        { id: "orderSpacingMm", label: "Order spacing", value: result.expected.orderSpacingSmallAngleM * 1e3, unit: "mm" }
      ],
      warnings: result.warnings,
      limitations: result.provenance.limitations,
      field: result.partialField
    };
  }

  function selectPreset(nextPresetId: StackPresetId): void {
    const preset = stackPresets[nextPresetId];
    setPresetId(nextPresetId);
    setIncidentMaterialId(preset.incidentMaterialId);
    setSubstrateMaterialId(preset.substrateMaterialId);
    setWavelengthNm(preset.wavelengthNm);
    setAngleDeg(preset.angleDeg);
    setPolarization(preset.polarization);
    setLayers(cloneLayers(preset.layers));
  }

  function updateLayer(layerId: string, updater: (layer: EditableLayer) => EditableLayer): void {
    setLayers((current) => current.map((layer) => (layer.id === layerId ? updater(layer) : layer)));
  }

  function addLayer(materialId: string): void {
    setLayers((current) => [
      ...current,
      {
        id: `layer-${materialId}-${Date.now().toString(36)}`,
        materialId,
        thicknessNm: defaultThicknessNm(materialId)
      }
    ]);
  }

  function removeLayer(layerId: string): void {
    setLayers((current) => current.filter((layer) => layer.id !== layerId));
  }

  function applyFoundryBest(): void {
    setIncidentMaterialId(foundry.best.stack.incidentMaterialId);
    setSubstrateMaterialId(foundry.best.stack.substrateMaterialId);
    setWavelengthNm(foundry.best.stack.wavelengthM * 1e9);
    setAngleDeg(degFromRad(foundry.best.stack.angleRad));
    setPolarization(foundry.best.stack.polarization);
    setLayers(
      foundry.best.stack.layers.map((layer) => ({
        id: layer.id,
        materialId: layer.materialId,
        thicknessNm: layer.thicknessM * 1e9
      }))
    );
  }

  async function importMaterialFile(file: File | null): Promise<void> {
    if (!file) return;
    try {
      const text = await file.text();
      setMaterialImport(parseMaterialImportJson(text));
      setMaterialImportError(null);
    } catch (error) {
      setMaterialImport(null);
      setMaterialImportError((error as Error).message);
    }
  }

  function loadExampleMaterialPack(): void {
    try {
      setMaterialImport(importMaterialPackage(createMaterialImportTemplate()));
      setMaterialImportError(null);
    } catch (error) {
      setMaterialImport(null);
      setMaterialImportError((error as Error).message);
    }
  }

  function toggleSearchMaterial(materialId: string): void {
    setSearchMaterialIds((current) => (current.includes(materialId) ? current.filter((id) => id !== materialId) : [...current, materialId]));
  }

  function runSearch(): void {
    try {
      const candidateMaterialIds = searchMaterialIds.filter((id) => layerMaterialOptions.some((material) => material.id === id));
      const wavelengthsNm = parseNumberList(searchWavelengthsText);
      if (candidateMaterialIds.length === 0) throw new Error("Select at least one coating search material.");
      if (wavelengthsNm.length === 0) throw new Error("Enter at least one target wavelength.");
      const layerMin = Math.max(0, Math.round(Math.min(searchLayerMin, searchLayerMax)));
      const layerMax = Math.max(layerMin, Math.round(Math.max(searchLayerMin, searchLayerMax)));
      const thicknessMinNm = clamp(Math.min(searchThicknessMinNm, searchThicknessMaxNm), 0.1, 10000);
      const thicknessMaxNm = clamp(Math.max(searchThicknessMinNm, searchThicknessMaxNm), thicknessMinNm, 10000);
      const thicknessStepNm = clamp(searchThicknessStepNm, 1, Math.max(1, thicknessMaxNm - thicknessMinNm));
      const nominalSearch = {
        id: `l63-${presetId}-coating-search`,
        label: `L6.3 ${stackPresets[presetId].label} coating search`,
        baseStack: { ...stack, layers: [] },
        wavelengthsM: wavelengthsNm.map((nm) => clamp(nm, 200, 2000) * 1e-9),
        anglesRad: [stack.angleRad],
        polarizations: ["unpolarized" as const],
        candidateMaterialIds,
        layerCount: { min: layerMin, max: layerMax },
        thicknessM: {
          min: thicknessMinNm * 1e-9,
          max: thicknessMaxNm * 1e-9,
          step: thicknessStepNm * 1e-9
        },
        constraints: {
          disallowAdjacentSameMaterial: true,
          maxTotalThicknessM: layerMax * thicknessMaxNm * 1e-9,
          maxAbsorbance: 0.02
        },
        objective: {
          terms: [
            { metric: "reflectance" as const, direction: "minimize" as const, weight: 1 },
            { metric: "absorbance" as const, direction: "minimize" as const, weight: 0.2 }
          ]
        },
        search: {
          mode: "beam" as const,
          beamWidth: Math.max(2, Math.min(32, Math.round(searchBeamWidth))),
          maxCandidates: 5,
          refinementPasses: 1,
          seed: 58
        }
      };
      if (robustSearchEnabled) {
        const sigmaLevels = parseSignedNumberList(robustSigmaLevelsText);
        if (sigmaLevels.length === 0) throw new Error("Enter at least one robust sigma level.");
        const passThreshold = parseOptionalNumber(robustPassThresholdText);
        if (robustPrimaryMetric === "passRate" && passThreshold === undefined) throw new Error("Pass-rate robust ranking requires a pass score threshold.");
        const maxSamplesPerCandidate = Math.max(1, Math.min(1000, Math.round(robustMaxSamples)));
        const independentThickness = {
          mode: "deterministic-grid" as const,
          sigmaNm: clamp(robustThicknessSigmaNm, 0, 1000),
          sigmaLevels,
          maxSamplesPerCandidate
        };
        const uncertaintyModel: CoatingUncertaintyModel =
          robustUncertaintyMode === "shared-scale"
            ? {
                mode: "correlated-thickness",
                preset: "shared-scale",
                globalThicknessScale: {
                  sigmaFraction: clamp(robustScaleSigmaPercent, 0, 100) / 100,
                  sigmaLevels
                },
                maxSamplesPerCandidate
              }
            : robustUncertaintyMode === "shared-offset-residual"
              ? {
                  mode: "correlated-thickness",
                  preset: "shared-offset-residual",
                  globalThicknessOffsetNm: {
                    sigmaNm: clamp(robustOffsetSigmaNm, 0, 1000),
                    sigmaLevels
                  },
                  perLayerResidualNm: {
                    sigmaNm: clamp(robustResidualSigmaNm, 0, 1000),
                    sigmaLevels: [-1, 0, 1]
                  },
                  maxSamplesPerCandidate
                }
              : {
                  mode: "independent-thickness",
                  sigmaNm: independentThickness.sigmaNm,
                  sigmaLevels,
                  maxSamplesPerCandidate
                };
        const robust = runRobustCoatingSearch(
          {
            id: `l63-${presetId}-robust-yield-search`,
            label: `L6.3 ${stackPresets[presetId].label} robust-yield coating search`,
            nominalSearch,
            uncertainty: {
              thickness: independentThickness,
              model: uncertaintyModel
            },
            robustObjective: {
              primary: robustPrimaryMetric,
              passThreshold,
              weights: { nominalScore: 0.05 }
            },
            candidateLimit: 5
          },
          materialRunOptions
        );
        setRobustResult(robust);
        setSearchResult(robust.nominalSearchResult);
      } else {
        const result = runCoatingSearch(nominalSearch, materialRunOptions);
        setSearchResult(result);
        setRobustResult(null);
      }
      setSearchError(null);
    } catch (error) {
      setSearchResult(null);
      setRobustResult(null);
      setSearchError((error as Error).message);
    }
  }

  function applySearchCandidate(candidate: CoatingSearchCandidate): void {
    const applied = applyCoatingSearchCandidate(stack, candidate);
    setLayers(
      applied.layers.map((layer) => ({
        id: layer.id,
        materialId: layer.materialId,
        thicknessNm: layer.thicknessM * 1e9
      }))
    );
  }

  function applyRobustSearchCandidate(candidate: RobustCoatingSearchCandidate): void {
    const applied = applyRobustCoatingSearchCandidate(stack, candidate);
    setLayers(
      applied.layers.map((layer) => ({
        id: layer.id,
        materialId: layer.materialId,
        thicknessNm: layer.thicknessM * 1e9
      }))
    );
  }

  return (
    <section className={`wave-panel maxwell-panel${explainMode ? " explain-mode-root" : ""}`} aria-label="L7.5 Fiducial Board / ChArUco-style Target Workflow">
      <h2>L7.5 Fiducial Board / ChArUco-style Target Workflow</h2>
      <div className="l2-disclosure">
        <strong>diagnostic fiducial board generation, imported/synthetic marker matching, partial-view QA, manual correction, L7.2 geometry handoff, L7.4 session QA, measured target ROI handling, focus/field MTF, camera diagnostics, saved studies, capabilities, and exports over the existing planar/scalar engines</strong>
        <span>PlanarTmmBackend, scalar validation, diagnostic measured comparison, detector acquisition post-processing, EMVA-inspired camera calibration, ISO 12233-inspired slanted-edge/line-pair MTF diagnostics, L7.1 focus/field MTF qualification diagnostics, L7.2 diagnostic 2D geometric calibration/distortion/pixel-scale workflows, L7.3 diagnostic ROI-limited dot-grid measured target detection, L7.4 diagnostic batch measurement session QA/repeatability aggregation, and L7.5 diagnostic synthetic fiducial board generation/imported detection matching/manual correction/session handoff are the executable scope; this is not pixel-level sensor-stack EM, certified camera calibration, certified metrology reports, lab-accredited metrology, lab accreditation workflows, hardware control, full 3D pose/stereo calibration, real OpenCV ArUco/ChArUco marker decoding, AprilTag decoding, a digital twin, manufacturing certification, or 3D Maxwell/FDTD/FEM/BEM/RCWA/CAD execution</span>
      </div>
      <div className="explain-toolbar" aria-label="Explainability controls">
        <label className="maxwell-material-check">
          <input type="checkbox" checked={explainMode} onChange={() => setExplainMode((current) => !current)} />
          <span>Explain mode</span>
          <strong>highlight help</strong>
        </label>
        <button type="button" onClick={() => setShowExplanations(true)}>
          <Sparkles size={15} />
          <span>Show all explanations</span>
        </button>
        <ExplainButton entryId="backend.planarTmm" label="Under the hood: PlanarTmmBackend" explainMode={explainMode} />
      </div>
      <ShowAllExplanationsDrawer open={showExplanations} onClose={() => setShowExplanations(false)} />

      <GuidedOpticalBenchCards explainMode={explainMode} />

      <PracticalStudyWorkspacePanel
        capabilities={capabilities}
        studyName={studyName}
        setStudyName={setStudyName}
        savedStudies={savedStudies}
        selectedStudyId={selectedStudyId}
        setSelectedStudyId={setSelectedStudyId}
        studyStatus={studyStatus}
        onSaveValidation={saveValidationStudy}
        onSaveCoating={saveCoatingStudy}
        onLoadStudy={loadSelectedStudy}
        onDuplicateStudy={duplicateSelectedStudy}
        onDeleteStudy={deleteSelectedStudy}
        onExportBundle={() =>
          exportStudyBundle(
            selectedStudy ?? captureValidationStudy(studyName.trim() || "Validation study"),
            workspaceSweepResult,
            studyComparison,
            measuredComparison,
            cameraRun,
            cameraCalibrationRun,
            mtfRun,
            mtfComparison,
            linePairRun,
            l71FocusSweepRun,
            l71FieldMapRun,
            l71QualificationRun,
            l71FocusFieldComparison,
            l72Target,
            l73Detection,
            l72Fit,
            l72Comparison,
            l74SessionQa,
            l75Board,
            l75Detection,
            l75Fit
          )
        }
        onImportBundle={importStudyBundleFile}
        onCopyShareableUrl={copyShareableStudyUrl}
        sweepFamily={workspaceSweepFamily}
        setSweepFamily={setWorkspaceSweepFamily}
        sweepStart={workspaceSweepStart}
        setSweepStart={setWorkspaceSweepStart}
        sweepStop={workspaceSweepStop}
        setSweepStop={setWorkspaceSweepStop}
        sweepCount={workspaceSweepCount}
        setSweepCount={setWorkspaceSweepCount}
        sweepResult={workspaceSweepResult}
        onRunSweep={runWorkspaceSweep}
        onExportSweepJson={() => workspaceSweepResult && exportPracticalSweepJson(workspaceSweepResult)}
        onExportSweepMarkdown={() => workspaceSweepResult && exportPracticalSweepMarkdown(workspaceSweepResult)}
        onExportSweepCsv={() => workspaceSweepResult && exportPracticalSweepCsv(workspaceSweepResult)}
        markers={measurementMarkers}
        onPinCenter={pinCenterMarker}
        onPinPeak={pinPeakMarker}
        onPinMinimum={pinMinimumMarker}
        onClearMarkers={() => setMeasurementMarkers([])}
        markerDistanceM={measurementMarkers.length >= 2 ? distanceBetweenMarkers(measurementMarkers[0]!, measurementMarkers[1]!) : null}
        onExportProfileCsv={() => exportActiveProfileCsv(activeProfileCsv())}
        studyRuns={studyRunSummaries}
        comparisonAId={comparisonAId}
        setComparisonAId={setComparisonAId}
        comparisonBId={comparisonBId}
        setComparisonBId={setComparisonBId}
        comparison={studyComparison}
        onCompareGamma={runGammaComparison}
        onCompareSelected={compareSelectedStudies}
        onExportComparisonMarkdown={() => studyComparison && exportStudyComparisonMarkdown(studyComparison)}
        onExportComparisonCsv={() => studyComparison && exportStudyComparisonCsv(studyComparison)}
        measuredCsvText={measuredCsvText}
        setMeasuredCsvText={setMeasuredCsvText}
        measuredPixelSizeUm={measuredPixelSizeUm}
        setMeasuredPixelSizeUm={setMeasuredPixelSizeUm}
        measuredOffsetUm={measuredOffsetUm}
        setMeasuredOffsetUm={setMeasuredOffsetUm}
        measuredRoiMinMm={measuredRoiMinMm}
        setMeasuredRoiMinMm={setMeasuredRoiMinMm}
        measuredRoiMaxMm={measuredRoiMaxMm}
        setMeasuredRoiMaxMm={setMeasuredRoiMaxMm}
        measuredSimulatedStudyId={measuredSimulatedStudyId}
        setMeasuredSimulatedStudyId={setMeasuredSimulatedStudyId}
        measuredDataset={measuredDataset}
        measuredComparison={measuredComparison}
        measuredFit={measuredFit}
        onGenerateSyntheticMeasuredCsv={generateSyntheticMeasuredCsv}
        onImportMeasuredCsv={importMeasuredCsvFromText}
        onImportMeasuredFile={importMeasuredDataFile}
        onCompareMeasured={runMeasuredVsSimulatedComparison}
        onRunMeasuredFit={runMeasuredDiagnosticFit}
        onSaveMeasuredComparison={saveMeasuredComparisonStudy}
        onExportMeasuredComparison={exportMeasuredComparisonReport}
        cameraSimulatedStudyId={cameraSimulatedStudyId}
        setCameraSimulatedStudyId={setCameraSimulatedStudyId}
        cameraPixelPitchUm={cameraPixelPitchUm}
        setCameraPixelPitchUm={setCameraPixelPitchUm}
        cameraWidthPx={cameraWidthPx}
        setCameraWidthPx={setCameraWidthPx}
        cameraHeightPx={cameraHeightPx}
        setCameraHeightPx={setCameraHeightPx}
        cameraQuantumEfficiency={cameraQuantumEfficiency}
        setCameraQuantumEfficiency={setCameraQuantumEfficiency}
        cameraExposureMs={cameraExposureMs}
        setCameraExposureMs={setCameraExposureMs}
        cameraPhotonFluxScale={cameraPhotonFluxScale}
        setCameraPhotonFluxScale={setCameraPhotonFluxScale}
        cameraFullWellElectrons={cameraFullWellElectrons}
        setCameraFullWellElectrons={setCameraFullWellElectrons}
        cameraReadNoiseElectrons={cameraReadNoiseElectrons}
        setCameraReadNoiseElectrons={setCameraReadNoiseElectrons}
        cameraDarkCurrentElectrons={cameraDarkCurrentElectrons}
        setCameraDarkCurrentElectrons={setCameraDarkCurrentElectrons}
        cameraBitDepth={cameraBitDepth}
        setCameraBitDepth={setCameraBitDepth}
        cameraGainDnPerElectron={cameraGainDnPerElectron}
        setCameraGainDnPerElectron={setCameraGainDnPerElectron}
        cameraBlackLevelDn={cameraBlackLevelDn}
        setCameraBlackLevelDn={setCameraBlackLevelDn}
        cameraSeed={cameraSeed}
        setCameraSeed={setCameraSeed}
        cameraNoiseMode={cameraNoiseMode}
        setCameraNoiseMode={setCameraNoiseMode}
        cameraRun={cameraRun}
        cameraCalibrationCsvText={cameraCalibrationCsvText}
        setCameraCalibrationCsvText={setCameraCalibrationCsvText}
        cameraCalibrationDataset={cameraCalibrationDataset}
        cameraCalibrationRun={cameraCalibrationRun}
        onLoadCalibrationExample={loadCameraCalibrationExample}
        onImportCameraCalibrationCsv={importCameraCalibrationCsvFromText}
        onImportCameraCalibrationFile={importCameraCalibrationFile}
        onRunCameraCalibrationFit={runCameraCalibrationFit}
        onApplyCalibratedCameraProfile={applyCalibratedCameraProfile}
        onSaveCameraCalibrationStudy={saveCameraCalibrationStudy}
        onExportCameraCalibrationReport={exportCameraCalibrationReport}
        onGenerateCameraRun={() => generateCameraRun()}
        onSaturateCameraExposure={saturateCameraExposure}
        onExportCameraReport={exportCameraReport}
        onSendCameraToMeasured={sendCameraToMeasuredComparison}
        onSaveCameraStudy={saveCameraStudy}
      />

      <BatchMeasurementSessionQaPanel
        manifestText={l74ManifestText}
        setManifestText={setL74ManifestText}
        maxGeometricRmsResidualPx={l74MaxGeometricRmsResidualPx}
        setMaxGeometricRmsResidualPx={setL74MaxGeometricRmsResidualPx}
        maxPixelScaleRepeatabilityStd={l74MaxPixelScaleRepeatabilityStd}
        setMaxPixelScaleRepeatabilityStd={setL74MaxPixelScaleRepeatabilityStd}
        minMtf50CyclesPerPx={l74MinMtf50CyclesPerPx}
        setMinMtf50CyclesPerPx={setL74MinMtf50CyclesPerPx}
        maxMtf50Cv={l74MaxMtf50Cv}
        setMaxMtf50Cv={setL74MaxMtf50Cv}
        maxCameraBlackLevelDriftDn={l74MaxCameraBlackLevelDriftDn}
        setMaxCameraBlackLevelDriftDn={setL74MaxCameraBlackLevelDriftDn}
        maxAllowedWarningCount={l74MaxAllowedWarningCount}
        setMaxAllowedWarningCount={setL74MaxAllowedWarningCount}
        minDetectionCoverage={l74MinDetectionCoverage}
        setMinDetectionCoverage={setL74MinDetectionCoverage}
        maxZScore={l74MaxZScore}
        setMaxZScore={setL74MaxZScore}
        result={l74SessionQa}
        onLoadExample={loadL74ExampleManifest}
        onRun={runL74SessionAnalysis}
        onExport={exportL74SessionBundle}
        onSave={saveL74SessionStudy}
      />

      <GeometricCalibrationWorkbenchPanel
        targetKind={l72TargetKind}
        setTargetKind={setL72TargetKind}
        widthPx={l72WidthPx}
        setWidthPx={setL72WidthPx}
        heightPx={l72HeightPx}
        setHeightPx={setL72HeightPx}
        rows={l72Rows}
        setRows={setL72Rows}
        columns={l72Columns}
        setColumns={setL72Columns}
        spacingUm={l72SpacingUm}
        setSpacingUm={setL72SpacingUm}
        pixelPitchUm={l72PixelPitchUm}
        setPixelPitchUm={setL72PixelPitchUm}
        rotationDeg={l72RotationDeg}
        setRotationDeg={setL72RotationDeg}
        radialK1={l72RadialK1}
        setRadialK1={setL72RadialK1}
        radialK2={l72RadialK2}
        setRadialK2={setL72RadialK2}
        fitModel={l72FitModel}
        setFitModel={setL72FitModel}
        pointCsvText={l72PointCsvText}
        setPointCsvText={setL72PointCsvText}
        target={l72Target}
        importedPointSet={l72ImportedPointSet}
        fit={l72Fit}
        comparison={l72Comparison}
        targetImage={l73TargetImage}
        roiXPx={l73RoiXPx}
        setRoiXPx={setL73RoiXPx}
        roiYPx={l73RoiYPx}
        setRoiYPx={setL73RoiYPx}
        roiWidthPx={l73RoiWidthPx}
        setRoiWidthPx={setL73RoiWidthPx}
        roiHeightPx={l73RoiHeightPx}
        setRoiHeightPx={setL73RoiHeightPx}
        thresholdMode={l73ThresholdMode}
        setThresholdMode={setL73ThresholdMode}
        threshold={l73Threshold}
        setThreshold={setL73Threshold}
        polarity={l73Polarity}
        setPolarity={setL73Polarity}
        minBlobAreaPx={l73MinBlobAreaPx}
        setMinBlobAreaPx={setL73MinBlobAreaPx}
        maxBlobAreaPx={l73MaxBlobAreaPx}
        setMaxBlobAreaPx={setL73MaxBlobAreaPx}
        maxMissingPoints={l73MaxMissingPoints}
        setMaxMissingPoints={setL73MaxMissingPoints}
        outlierResidualWarnPx={l73OutlierResidualWarnPx}
        setOutlierResidualWarnPx={setL73OutlierResidualWarnPx}
        detection={l73Detection}
        selectedPointId={l73SelectedPointId}
        setSelectedPointId={setL73SelectedPointId}
        showDetectionLabels={l73ShowLabels}
        setShowDetectionLabels={setL73ShowLabels}
        onGenerateTarget={l72GenerateTarget}
        onImportCsv={importL72PointCsv}
        onImportFile={importL72PointCsvFile}
        onRunFit={runL72Fit}
        onCompare={runL72Comparison}
        onExport={exportL72GeometricBundle}
        onSave={saveL72GeometricStudy}
        onUseGeneratedTargetAsImage={useL73GeneratedTargetAsImage}
        onImportTargetImage={importL73TargetImageFile}
        onAutoDetect={runL73AutoDetect}
        onClearDetection={clearL73Detection}
        onMoveSelectedPoint={moveSelectedL73Point}
        onRejectSelectedPoint={rejectSelectedL73Point}
        onAcceptSelectedPoint={acceptSelectedL73Point}
        onAddPoint={addL73Point}
        onDeleteSelectedPoint={deleteSelectedL73Point}
        onRunDetectionFit={runL73GeometryFit}
        onExportDetection={exportL73DetectionBundle}
        onSaveDetectionStudy={saveL73DetectionStudy}
        fiducialBoard={l75Board}
        fiducialDetection={l75Detection}
        fiducialMatch={l75Match}
        fiducialFit={l75Fit}
        fiducialSquaresX={l75SquaresX}
        setFiducialSquaresX={setL75SquaresX}
        fiducialSquaresY={l75SquaresY}
        setFiducialSquaresY={setL75SquaresY}
        fiducialSquareSizeMm={l75SquareSizeMm}
        setFiducialSquareSizeMm={setL75SquareSizeMm}
        fiducialMarkerSizeFraction={l75MarkerSizeFraction}
        setFiducialMarkerSizeFraction={setL75MarkerSizeFraction}
        fiducialDroppedMarkerModulo={l75DroppedMarkerModulo}
        setFiducialDroppedMarkerModulo={setL75DroppedMarkerModulo}
        fiducialNoisePx={l75NoisePx}
        setFiducialNoisePx={setL75NoisePx}
        fiducialDetectionJsonText={l75DetectionJsonText}
        setFiducialDetectionJsonText={setL75DetectionJsonText}
        selectedFiducialMarkerId={l75SelectedMarkerId}
        setSelectedFiducialMarkerId={setL75SelectedMarkerId}
        onGenerateFiducialBoard={generateL75Board}
        onGenerateFiducialDetection={generateL75SyntheticDetections}
        onLoadFiducialDetectionExample={loadExampleL75DetectionJson}
        onImportFiducialDetectionJson={importL75DetectionJson}
        onMatchFiducialIds={matchL75FiducialIds}
        onRunFiducialFit={runL75FiducialFit}
        onRejectFiducialMarker={rejectSelectedL75Marker}
        onAcceptFiducialMarker={acceptSelectedL75Marker}
        onMoveFiducialCorner={moveSelectedL75Corner}
        onRelabelFiducialMarker={relabelSelectedL75Marker}
        onExportFiducialBundle={exportL75FiducialBundle}
        onAddFiducialToSession={addL75FiducialToSessionQa}
        onSaveFiducialStudy={saveL75FiducialStudy}
        sessionQa={l74SessionQa}
      />

      <FocusFieldMtfQualificationPanel
        focusStartMm={l71FocusStartMm}
        setFocusStartMm={setL71FocusStartMm}
        focusStopMm={l71FocusStopMm}
        setFocusStopMm={setL71FocusStopMm}
        focusSamples={l71FocusSamples}
        setFocusSamples={setL71FocusSamples}
        bestFocusMm={l71BestFocusMm}
        setBestFocusMm={setL71BestFocusMm}
        defocusBlurPerMm={l71DefocusBlurPerMm}
        setDefocusBlurPerMm={setL71DefocusBlurPerMm}
        focusMetric={l71FocusMetric}
        setFocusMetric={setL71FocusMetric}
        focusThreshold={l71FocusThreshold}
        setFocusThreshold={setL71FocusThreshold}
        fieldLayout={l71FieldLayout}
        setFieldLayout={setL71FieldLayout}
        centerMtf50Min={l71CenterMtf50Min}
        setCenterMtf50Min={setL71CenterMtf50Min}
        cornerMtf50Min={l71CornerMtf50Min}
        setCornerMtf50Min={setL71CornerMtf50Min}
        nyquistMtfMin={l71NyquistMtfMin}
        setNyquistMtfMin={setL71NyquistMtfMin}
        depthOfFocusMinMm={l71DepthOfFocusMinMm}
        setDepthOfFocusMinMm={setL71DepthOfFocusMinMm}
        disallowWarnings={l71DisallowWarnings}
        setDisallowWarnings={setL71DisallowWarnings}
        focusSweep={l71FocusSweepRun}
        fieldMap={l71FieldMapRun}
        qualification={l71QualificationRun}
        comparison={l71FocusFieldComparison}
        onRunFocusSweep={runL71FocusSweep}
        onImportCurrentMtf={importCurrentMtfIntoL71FocusSweep}
        onRunFieldMap={runL71FieldMap}
        onRunQualification={runL71Qualification}
        onCompare={runL71FocusFieldComparison}
        onExport={exportL71QualificationBundle}
        onSave={saveL71QualificationStudy}
      />

      <ResolutionMtfWorkbenchPanel
        mtfWidthPx={mtfWidthPx}
        setMtfWidthPx={setMtfWidthPx}
        mtfHeightPx={mtfHeightPx}
        setMtfHeightPx={setMtfHeightPx}
        mtfEdgeAngleDeg={mtfEdgeAngleDeg}
        setMtfEdgeAngleDeg={setMtfEdgeAngleDeg}
        mtfBlurSigmaPx={mtfBlurSigmaPx}
        setMtfBlurSigmaPx={setMtfBlurSigmaPx}
        mtfContrast={mtfContrast}
        setMtfContrast={setMtfContrast}
        mtfOversampling={mtfOversampling}
        setMtfOversampling={setMtfOversampling}
        mtfPixelPitchUm={mtfPixelPitchUm}
        setMtfPixelPitchUm={setMtfPixelPitchUm}
        mtfCsvText={mtfCsvText}
        setMtfCsvText={setMtfCsvText}
        mtfTarget={mtfTarget}
        mtfImportedFrame={mtfImportedFrame}
        mtfRun={mtfRun}
        mtfReferenceRun={mtfReferenceRun}
        mtfComparison={mtfComparison}
        linePairTarget={linePairTarget}
        linePairRun={linePairRun}
        onGenerateTarget={generateMtfSlantedEdgeTarget}
        onImportCsv={importMtfCsvFromText}
        onImportFile={importMtfCsvFile}
        onRunMtf={runMtfAnalysis}
        onCompareBlur={compareCurrentMtfToBlurredTarget}
        onGenerateLinePair={generateAndAnalyzeLinePairTarget}
        onSendCameraFrame={sendCameraToMtfWorkbench}
        onExportMtfReport={exportMtfReport}
        onSaveMtfStudy={saveMtfStudy}
      />

      <div className="profile-meta">
        <div className="compact-stat">
          <ExplainLabel entryId="backend.planarTmm" explainMode={explainMode}>Active solver backend</ExplainLabel>
          <strong>{run.solverBackend.label}</strong>
        </div>
        <div className="compact-stat">
          <span>Method</span>
          <strong>{run.solverBackend.method}</strong>
        </div>
        <div className="compact-stat">
          <ExplainLabel entryId="backend.dimension1dPlanar" explainMode={explainMode}>Dimensions</ExplainLabel>
          <strong>{run.solverBackend.capabilities.dimensions.join(", ")}</strong>
        </div>
        <div className="compact-stat">
          <span>Status</span>
          <strong>{run.solverBackend.capabilities.availability}</strong>
        </div>
        <div className="compact-stat">
          <ExplainLabel entryId="backend.capabilityReceipt" explainMode={explainMode}>Unsupported</ExplainLabel>
          <strong>3D geometry, apertures, curved surfaces, FEM/FDTD/BEM/RCWA</strong>
        </div>
      </div>

      <div className="maxwell-material-card maxwell-backend-card" aria-label="Future 3D Backends">
        <div className="maxwell-section-heading">
          <h2>Future 3D Backends</h2>
          <strong>{fdtdScaffold.resultHash.slice(0, 10)}</strong>
        </div>
        <div className="l2-disclosure">
          <strong>L6.0 does not execute 3D Maxwell solves.</strong>
          <span>It defines the 3D problem/result contract and external-backend export scaffold only.</span>
        </div>
        <div className="explain-inline-row">
          <ExplainButton entryId="backend.externalFdtdScaffold" label="Under the hood: ExternalFdtdBackend" explainMode={explainMode} />
          <ExplainButton entryId="backend.capabilityReceipt" label="Under the hood: capability receipt" explainMode={explainMode} />
        </div>
        <div className="profile-meta">
          <div className="compact-stat">
            <ExplainLabel entryId="backend.planarTmm" explainMode={explainMode}>Available</ExplainLabel>
            <strong>{run.solverBackend.label}</strong>
          </div>
          <div className="compact-stat">
            <span>Available method</span>
            <strong>{run.solverBackend.method}</strong>
          </div>
          <div className="compact-stat">
            <ExplainLabel entryId="backend.dimension1dPlanar" explainMode={explainMode}>Available dimensions</ExplainLabel>
            <strong>{run.solverBackend.capabilities.dimensions.join(", ")}</strong>
          </div>
          <div className="compact-stat">
            <ExplainLabel entryId="backend.externalFdtdScaffold" explainMode={explainMode}>Scaffolded, not executable</ExplainLabel>
            <strong>{fdtdBackendReceipt.label}</strong>
          </div>
          <div className="compact-stat">
            <span>Scaffold method</span>
            <strong>{fdtdBackendReceipt.method}</strong>
          </div>
          <div className="compact-stat">
            <span>Scaffold dimensions</span>
            <strong>{fdtdBackendReceipt.capabilities.dimensions.join(", ")}</strong>
          </div>
          <div className="compact-stat">
            <span>Scaffold status</span>
            <strong>schema/export only in L6.0</strong>
          </div>
        </div>
        <div className="profile-meta">
          <div className="compact-stat">
            <span>3D scene hash</span>
            <strong>{fdtdScaffold.scene.receipts.sceneHash.slice(0, 10)}</strong>
          </div>
          <div className="compact-stat">
            <span>Units</span>
            <strong>{fdtdScaffold.scene.units}</strong>
          </div>
          <div className="compact-stat">
            <span>Domain</span>
            <strong>{fdtdScaffold.scene.domain.size.join(" x ")}</strong>
          </div>
          <div className="compact-stat">
            <span>Boundary</span>
            <strong>{fdtdScaffold.scene.boundaries[0]?.kind ?? "none"}</strong>
          </div>
          <div className="compact-stat">
            <span>Source</span>
            <strong>{fdtdScaffold.scene.sources[0]?.kind ?? "none"}</strong>
          </div>
          <div className="compact-stat">
            <span>Monitor</span>
            <strong>{fdtdScaffold.scene.monitors[0]?.kind ?? "none"}</strong>
          </div>
        </div>
        <div className="maxwell-layer-actions">
          <button type="button" onClick={() => exportFdtdScaffoldJson(fdtdScaffold)}>
            <FileDown size={15} />
            <span>Export 3D FDTD Scaffold</span>
          </button>
          <ExplainButton entryId="exports.fdtdScaffold" label="Under the hood: FDTD scaffold export" explainMode={explainMode} />
        </div>
      </div>

      <div className="maxwell-material-card maxwell-validation-card" aria-label="Validation Bench">
        <div className="maxwell-section-heading">
          <h2>Validation Bench</h2>
          <strong>{activeValidationHash.slice(0, 10)}</strong>
        </div>
        <div className="l2-disclosure">
          <strong>Physics exam sequence</strong>
          <span>hand-checkable scalar diffraction benchmarks with numerical results, analytic references, residuals, and report exports</span>
        </div>
        <div className="explain-inline-row">
          <ExplainButton entryId="validation.analyticReference.airyBessel" label="Under the hood: Airy/Bessel reference" explainMode={explainMode} />
          <ExplainButton entryId="validation.numericalPropagation.huygensFresnel" label="Under the hood: numerical propagation" explainMode={explainMode} />
          <ExplainButton entryId="validation.lens.thinLensPhase" label="Under the hood: thin lens phase" explainMode={explainMode} />
        </div>
        <ValidationBenchGuide explainMode={explainMode} />
        <div className="maxwell-validation-tabs" role="tablist" aria-label="Validation benchmark selector">
          <button type="button" className={validationBenchmark === "circular-pinhole" ? "active" : ""} onClick={() => setValidationBenchmark("circular-pinhole")}>
            Circular pinhole Airy/Bessel
          </button>
          <button type="button" className={validationBenchmark === "single-slit" ? "active" : ""} onClick={() => setValidationBenchmark("single-slit")}>
            Long single slit sinc^2
          </button>
          <button type="button" className={validationBenchmark === "double-slit" ? "active" : ""} onClick={() => setValidationBenchmark("double-slit")}>
            Double slit / grating orders
          </button>
          <button type="button" className={validationBenchmark === "thin-lens" ? "active" : ""} onClick={() => setValidationBenchmark("thin-lens")}>
            Ideal thin lens focal plane
          </button>
          <button type="button" className={validationBenchmark === "coherence" ? "active" : ""} onClick={() => setValidationBenchmark("coherence")}>
            Coherence Demonstrator
          </button>
          <button type="button" className={validationBenchmark === "advisor-review" ? "active" : ""} onClick={() => setValidationBenchmark("advisor-review")}>
            Advisor Review Mode
          </button>
        </div>
        {validationBenchmark === "circular-pinhole" && (
          <>
        <div className="maxwell-validation-pipeline">
          {validationPipeline.map((step) => (
            <div className="compact-stat" key={step.index}>
              <span>
                {step.index}. {step.label}
              </span>
              <strong>{step.detail}</strong>
            </div>
          ))}
        </div>
        <div className="profile-meta">
          <div className="compact-stat">
            <ExplainLabel entryId="validation.source.wavelength" explainMode={explainMode}>Wavelength</ExplainLabel>
            <strong>500 nm</strong>
          </div>
          <div className="compact-stat">
            <ExplainLabel entryId="validation.source.pointSource" explainMode={explainMode}>Point source</ExplainLabel>
            <strong>0,0,0 mm</strong>
          </div>
          <div className="compact-stat">
            <span>Benchmark</span>
            <strong>Circular aperture, not long slit</strong>
          </div>
          <div className="compact-stat">
            <ExplainLabel entryId="validation.source.pointSource" explainMode={explainMode}>Source</ExplainLabel>
            <strong>500 nm point mode at 0,0,0 mm</strong>
          </div>
          <div className="compact-stat">
            <ExplainLabel entryId="validation.aperture.circularDiameter" explainMode={explainMode}>Aperture</ExplainLabel>
            <strong>1 um diameter at z=10 mm</strong>
          </div>
          <div className="compact-stat">
            <ExplainLabel entryId="validation.observation.zeroThicknessPlane" explainMode={explainMode}>Observation plane</ExplainLabel>
            <strong>10 mm x 10 mm, zero thickness</strong>
          </div>
          <div className="compact-stat">
            <span>Resolution</span>
            <strong>
              {validationResult.numericalField.width} x {validationResult.numericalField.height}
            </strong>
          </div>
          <div className="compact-stat">
            <ExplainLabel entryId="validation.numericalPropagation.huygensFresnel" explainMode={explainMode}>Numerical method</ExplainLabel>
            <strong>{validationResult.comparison.numericalMethod}</strong>
          </div>
          <div className="compact-stat">
            <span>External FDTD</span>
            <strong>still scaffold-only</strong>
          </div>
        </div>
        <div className="maxwell-validation-controls">
          <label className="field-row">
            <ExplainLabel entryId="validation.numericalPropagation.huygensFresnel" explainMode={explainMode}>Computation mode</ExplainLabel>
            <select value={validationMode} onChange={(event) => setValidationMode(event.currentTarget.value as CircularApertureComputationMode)}>
              <option value="analytic-reference">Analytic Airy reference</option>
              <option value="numerical-scalar-propagation">Numerical scalar propagation</option>
              <option value="compare-numerical-analytic">Compare numerical vs analytic</option>
            </select>
          </label>
          <NumberField label="Map grid" explainId="validation.samplingControls" explainMode={explainMode} value={validationResolution} unit="px" min={65} max={513} step={2} onChange={(value) => setValidationResolution(oddInteger(value, 65, 513))} />
          <NumberField label="Radial obs." explainId="validation.samplingControls" explainMode={explainMode} value={validationRadialSamples} unit="samples" min={65} max={257} step={2} onChange={(value) => setValidationRadialSamples(oddInteger(value, 65, 257))} />
          <NumberField label="Aperture radial" explainId="validation.samplingControls" explainMode={explainMode} value={validationApertureRadialSamples} unit="samples" min={8} max={128} step={4} onChange={(value) => setValidationApertureRadialSamples(Math.round(clamp(value, 8, 128)))} />
          <NumberField label="Aperture angular" explainId="validation.samplingControls" explainMode={explainMode} value={validationApertureAngularSamples} unit="samples" min={24} max={256} step={8} onChange={(value) => setValidationApertureAngularSamples(Math.round(clamp(value, 24, 256)))} />
        </div>
        <label className="field-row">
          <ExplainLabel entryId="validation.observation.zPlane" explainMode={explainMode}>Observation z</ExplainLabel>
          <div className="maxwell-slider-control">
            <input
              type="range"
              min={11}
              max={60}
              step={1}
              value={validationPlaneZMm}
              onChange={(event) => setValidationPlaneZMm(Number(event.currentTarget.value))}
              onInput={(event) => setValidationPlaneZMm(Number(event.currentTarget.value))}
            />
            <input
              type="number"
              min={11}
              max={60}
              step={1}
              value={formatNumberInputValue(validationPlaneZMm)}
              onChange={(event) => setValidationPlaneZMm(clamp(Number(event.currentTarget.value), 11, 60))}
            />
            <strong>{validationPlaneZMm.toFixed(0)} mm</strong>
          </div>
        </label>
        <div className="profile-meta">
          <div className="compact-stat">
            <ExplainLabel entryId="validation.firstAiryMinimum" explainMode={explainMode}>Expected first Airy minimum</ExplainLabel>
            <strong>{formatMm(validationResult.expected.firstMinimumRadiusM)} mm</strong>
          </div>
          <div className="compact-stat">
            <ExplainLabel entryId="validation.observation.planeSize" explainMode={explainMode}>Detector half-width</ExplainLabel>
            <strong>{formatMm(validationResult.expected.detectorHalfWidthM)} mm</strong>
          </div>
          <div className="compact-stat">
            <span>Detector half-diagonal</span>
            <strong>{formatMm(validationResult.expected.detectorHalfDiagonalM)} mm</strong>
          </div>
          <div className="compact-stat">
            <ExplainLabel entryId="validation.rmsResidual" explainMode={explainMode}>RMS residual</ExplainLabel>
            <strong>{validationResult.residuals.rmsResidual.toExponential(2)}</strong>
          </div>
          <div className="compact-stat">
            <ExplainLabel entryId="validation.maxResidual" explainMode={explainMode}>Max residual</ExplainLabel>
            <strong>{validationResult.residuals.maxResidual.toExponential(2)}</strong>
          </div>
          <div className="compact-stat">
            <span>Symmetry error</span>
            <strong>{validationResult.residuals.radialSymmetryError.toExponential(2)}</strong>
          </div>
          <div className="compact-stat">
            <span>Measured first min</span>
            <strong>{validationResult.comparison.measuredFirstMinimumRadiusM === null ? validationResult.comparison.firstMinimumSearchStatus : `${formatMm(validationResult.comparison.measuredFirstMinimumRadiusM)} mm`}</strong>
          </div>
          <div className="compact-stat">
            <span>First-min error</span>
            <strong>{validationResult.comparison.firstMinimumErrorM === null ? "n/a" : `${formatMm(validationResult.comparison.firstMinimumErrorM)} mm`}</strong>
          </div>
          <div className="compact-stat">
            <ExplainLabel entryId="validation.finitePlaneEnergy" explainMode={explainMode}>Finite-plane energy check</ExplainLabel>
            <strong>{validationResult.comparison.energy.relativePlaneIntegralError.toExponential(2)}</strong>
          </div>
        </div>
        <div className="error-banner">
          Expected first Airy minimum: {formatMm(validationResult.expected.firstMinimumRadiusM)} mm from center. Detector half-width: {formatMm(validationResult.expected.detectorHalfWidthM)} mm.
          {!validationResult.expected.firstMinimumInsidePlane && " Warning: first minimum is outside the 10 mm x 10 mm observation plane."}
        </div>
        <div className="maxwell-validation-output-grid three">
          {validationMode !== "analytic-reference" && (
            <div>
              <div className="maxwell-section-heading">
                <h2><ExplainLabel entryId="validation.numericalPropagation.huygensFresnel" explainMode={explainMode}>Numerical Intensity Map</ExplainLabel></h2>
                <strong>computed</strong>
              </div>
              <ValidationIntensityMap field={validationResult.numericalField} tone="numerical" ariaLabel="Numerical scalar propagation intensity map" />
            </div>
          )}
          {validationMode !== "numerical-scalar-propagation" && (
            <div>
              <div className="maxwell-section-heading">
                <h2><ExplainLabel entryId="validation.analyticReference.airyBessel" explainMode={explainMode}>Analytic Reference Map</ExplainLabel></h2>
                <strong>Airy/Bessel</strong>
              </div>
              <ValidationIntensityMap field={validationResult.analyticField} tone="analytic" ariaLabel="Analytic Airy Bessel reference intensity map" />
            </div>
          )}
          {validationMode === "compare-numerical-analytic" && (
            <div>
              <div className="maxwell-section-heading">
                <h2><ExplainLabel entryId="validation.residualMap" explainMode={explainMode}>Residual Map</ExplainLabel></h2>
                <strong>|numerical - analytic|</strong>
              </div>
              <ValidationIntensityMap field={validationResult.residualField} tone="residual" ariaLabel="Numerical minus analytic scalar propagation residual map" />
            </div>
          )}
        </div>
        <div className="maxwell-validation-output-grid">
          <div className="maxwell-validation-profile-panel">
            <div className="maxwell-section-heading">
              <h2><ExplainLabel entryId="validation.radialOverlay" explainMode={explainMode}>Radial Overlay</ExplainLabel></h2>
              <div className="maxwell-heading-actions">
                <strong>numerical vs Airy</strong>
                <ExplainButton entryId="validation.radialOverlay" label="Where is this?" explainMode={explainMode} />
              </div>
            </div>
            <ValidationRadialPlot result={validationResult} />
            <WhereMeasuredBlock entryId="validation.whereMeasured" explainMode={explainMode}>
              Extracted from the zero-thickness observation plane at z = {formatMm(validationResult.config.observationPlane.zM)} mm.
              Source is at z = 0 mm, the circular aperture is at z = {formatMm(validationResult.config.aperture.zM)} mm,
              and the plane is {formatMm(validationResult.config.observationPlane.sizeM)} mm x {formatMm(validationResult.config.observationPlane.sizeM)} mm.
              The radial overlay is an analysis view, not a physical element.
            </WhereMeasuredBlock>
          </div>
          <div className="maxwell-validation-profile-panel">
            <div className="maxwell-section-heading">
              <h2><ExplainLabel entryId="validation.residualCurve" explainMode={explainMode}>Residual Curve</ExplainLabel></h2>
              <div className="maxwell-heading-actions">
                <strong>signed mismatch</strong>
                <ExplainButton entryId="validation.residualCurve" label="Where is this?" explainMode={explainMode} />
              </div>
            </div>
            <ValidationResidualPlot result={validationResult} />
            <WhereMeasuredBlock entryId="validation.whereMeasured" explainMode={explainMode}>
              Computed at the same zero-thickness observation plane at z = {formatMm(validationResult.config.observationPlane.zM)} mm.
              The residual curve compares sampled numerical intensity against the Airy reference along the analysis profile.
            </WhereMeasuredBlock>
          </div>
        </div>
        <ul className="warning-list">
          {validationResult.warnings.map((warning) => (
            <li key={warning.code}>{warning.message}</li>
          ))}
        </ul>
        <div className="maxwell-layer-actions">
          <button type="button" onClick={() => setValidationPlaneZMm((current) => clamp(current, 11, 60))}>
            <Sparkles size={15} />
            <span>Run Comparison</span>
          </button>
          <button type="button" onClick={() => exportValidationJson(validationResult)}>
            <Save size={15} />
            <span>Validation JSON</span>
          </button>
          <button type="button" onClick={() => exportValidationMarkdown(validationResult)}>
            <FileDown size={15} />
            <span>Validation Markdown</span>
          </button>
        </div>
          </>
        )}
        {(validationBenchmark === "single-slit" || validationBenchmark === "double-slit") && <SlitValidationPanel result={selectedSlitResult} explainMode={explainMode} />}
        {validationBenchmark === "thin-lens" && (
          <ThinLensValidationPanel
            result={lensResult}
            pipeline={lensPipeline}
            explainMode={explainMode}
            wavelengthNm={lensWavelengthNm}
            setWavelengthNm={setLensWavelengthNm}
            focalLengthMm={lensFocalLengthMm}
            setFocalLengthMm={setLensFocalLengthMm}
            pupilDiameterUm={lensPupilDiameterUm}
            setPupilDiameterUm={setLensPupilDiameterUm}
            observationZMm={lensObservationZMm}
            setObservationZMm={setLensObservationZMm}
            planeSizeUm={lensPlaneSizeUm}
            setPlaneSizeUm={setLensPlaneSizeUm}
            resolution={lensResolution}
            setResolution={setLensResolution}
            focusRangeMm={lensFocusRangeMm}
            setFocusRangeMm={setLensFocusRangeMm}
          />
        )}
        {validationBenchmark === "coherence" && (
          <CoherenceValidationPanel
            result={coherenceResult}
            explainMode={explainMode}
            mode={coherenceMode}
            setMode={setCoherenceMode}
            gammaMagnitude={coherenceGammaMagnitude}
            setGammaMagnitude={setCoherenceGammaMagnitude}
            gammaPhaseDeg={coherenceGammaPhaseDeg}
            setGammaPhaseDeg={setCoherenceGammaPhaseDeg}
            wavelengthNm={coherenceWavelengthNm}
            setWavelengthNm={setCoherenceWavelengthNm}
            slitWidthUm={coherenceSlitWidthUm}
            setSlitWidthUm={setCoherenceSlitWidthUm}
            slitSeparationUm={coherenceSlitSeparationUm}
            setSlitSeparationUm={setCoherenceSlitSeparationUm}
            propagationDistanceM={coherencePropagationDistanceM}
            setPropagationDistanceM={setCoherencePropagationDistanceM}
          />
        )}
        {validationBenchmark === "advisor-review" && <AdvisorReviewPanel review={advisorReview} />}
      </div>

      <CoatingStackGuide explainMode={explainMode} />

      <div className="maxwell-grid">
        <label className="field-row">
          <span>Example setup</span>
          <select value={presetId} onChange={(event) => selectPreset(event.currentTarget.value as StackPresetId)}>
            {presetEntries.map(([id, preset]) => (
              <option key={id} value={id}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field-row">
          <ExplainLabel entryId="coating.incidentMedium" explainMode={explainMode}>Incident medium, where light comes from</ExplainLabel>
          <select value={incidentMaterialId} onChange={(event) => setIncidentMaterialId(event.currentTarget.value)}>
            <MaterialSelectOptions materials={materialOptions} />
          </select>
        </label>
        <label className="field-row">
          <ExplainLabel entryId="coating.substrateMedium" explainMode={explainMode}>Substrate medium, where light exits</ExplainLabel>
          <select value={substrateMaterialId} onChange={(event) => setSubstrateMaterialId(event.currentTarget.value)}>
            <MaterialSelectOptions materials={materialOptions} />
          </select>
        </label>
        <NumberField label="Wavelength" explainId="validation.source.wavelength" explainMode={explainMode} value={wavelengthNm} unit="nm" min={200} max={2000} step={1} onChange={setWavelengthNm} />
        <NumberField label="Angle" value={angleDeg} unit="deg" min={-80} max={80} step={0.25} onChange={setAngleDeg} />
        <label className="field-row">
          <span>Pol.</span>
          <select value={polarization} onChange={(event) => setPolarization(event.currentTarget.value as MaxwellPolarization)}>
            <option value="TE">TE</option>
            <option value="TM">TM</option>
          </select>
        </label>
      </div>
      <div className="explain-inline-row">
        <ExplainButton entryId="coating.incidentMedium" label="Where is this? Incident medium" explainMode={explainMode} />
        <ExplainButton entryId="coating.substrateMedium" label="Where is this? Substrate medium" explainMode={explainMode} />
      </div>

      <div className="maxwell-material-card">
        <div className="maxwell-section-heading">
          <h2><ExplainLabel entryId="coating.provenanceReceipt" explainMode={explainMode}>Material Library</ExplainLabel></h2>
          <strong>{materialAudit.resultHash.slice(0, 10)}</strong>
        </div>
        <div className="profile-meta">
          <div className="compact-stat">
            <span>Records</span>
            <strong>{materialAudit.recordCount}</strong>
          </div>
          <div className="compact-stat">
            <span>Samples</span>
            <strong>{materialAudit.sampleCount}</strong>
          </div>
          <div className="compact-stat">
            <span>Sourced</span>
            <strong>{materialAudit.sourcedRecordCount}</strong>
          </div>
          <div className="compact-stat">
            <span>Diagnostic</span>
            <strong>{materialAudit.diagnosticRecordCount}</strong>
          </div>
          <div className="compact-stat">
            <span>Range</span>
            <strong>{formatWavelengthRange(materialAudit.wavelengthRangeM)}</strong>
          </div>
        </div>
        {materialImport ? (
          <div className="maxwell-material-records">
            {materialOptions
              .filter((record) => record.origin === "imported")
              .map((record) => (
              <div className="compact-stat" key={record.id}>
                <span>{record.label}</span>
                <strong>{record.materialHash.slice(0, 10)}</strong>
              </div>
            ))}
          </div>
        ) : materialImportError ? (
          <div className="error-banner">{materialImportError}</div>
        ) : (
          <div className="empty-state">Built-in diagnostic records only.</div>
        )}
        <div className="maxwell-layer-actions">
          <label className="maxwell-file-action">
            <Upload size={15} />
            <span>Material JSON</span>
            <input
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                void importMaterialFile(event.currentTarget.files?.[0] ?? null);
                event.currentTarget.value = "";
              }}
            />
          </label>
          <button type="button" onClick={exportMaterialTemplateJson}>
            <FileDown size={15} />
            <span>Template JSON</span>
          </button>
          <button type="button" onClick={loadExampleMaterialPack}>
            <Upload size={15} />
            <span>Example Pack</span>
          </button>
        </div>
      </div>

      <div className="maxwell-layer-editor">
        <div className="maxwell-section-heading">
          <h2>Coating Stack</h2>
          <div className="maxwell-layer-actions">
            <button type="button" onClick={() => addLayer("mgf2")}>
              <Plus size={15} />
              <span>MgF2</span>
            </button>
            <button type="button" onClick={() => addLayer("tio2")}>
              <Plus size={15} />
              <span>TiO2</span>
            </button>
            <button type="button" onClick={() => addLayer("chromiumLossy")}>
              <Plus size={15} />
              <span>Absorber</span>
            </button>
            {importedLayerMaterial && (
              <button type="button" onClick={() => addLayer(importedLayerMaterial.id)}>
                <Plus size={15} />
                <span>Imported</span>
              </button>
            )}
          </div>
        </div>

        {layers.length > 0 ? (
          <div className="maxwell-layer-list">
            {layers.map((layer) => {
              const selectedMaterial = materialEntryFor(layer.materialId, materialCatalog);
              return (
                <div className="maxwell-layer-item" key={layer.id}>
                  <div className="maxwell-layer-row">
                    <select value={layer.materialId} onChange={(event) => updateLayer(layer.id, (current) => ({ ...current, materialId: event.currentTarget.value }))}>
                      <MaterialSelectOptions materials={layerMaterialOptions} />
                    </select>
                    <div className="number-input">
                      <input
                        type="number"
                        value={formatNumberInputValue(layer.thicknessNm)}
                        min={0.1}
                        max={10000}
                        step={1}
                        onChange={(event) => updateLayer(layer.id, (current) => ({ ...current, thicknessNm: Number(event.currentTarget.value) }))}
                      />
                      <em>nm</em>
                    </div>
                    <button className="icon-button danger" type="button" aria-label="Remove layer" onClick={() => removeLayer(layer.id)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <MaterialPassport material={selectedMaterial} wavelengthNm={wavelengthNm} explainMode={explainMode} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">No coating layer; this is the bare incident/substrate boundary.</div>
        )}
      </div>

      <div className="wave-actions">
        <button type="button" onClick={() => exportStackJson(stack, materialCatalog, run, sweep, foundry, yieldAnalysis)}>
          <Save size={17} />
          <span>JSON</span>
        </button>
        <button type="button" onClick={() => exportStackSummary(run, sweep, foundry, yieldAnalysis)}>
          <FileDown size={17} />
          <span>Summary</span>
        </button>
        <button type="button" onClick={() => exportSweepCsv(sweep)}>
          <FileDown size={17} />
          <span>Sweep CSV</span>
        </button>
        <button type="button" onClick={() => exportMonitorCsv(run.fieldMonitor)}>
          <FileDown size={17} />
          <span>Monitor CSV</span>
        </button>
      </div>

      <div className="profile-meta">
        <div className="compact-stat">
          <span>Stack hash</span>
          <strong>{run.resultHash.slice(0, 10)}</strong>
        </div>
        <div className="compact-stat">
          <span>Layers</span>
          <strong>{run.tmm.layerCount}</strong>
        </div>
        <div className="compact-stat">
          <ExplainLabel entryId="coating.energyBalance" explainMode={explainMode}>Energy error</ExplainLabel>
          <strong>{run.tmm.energyBalanceError.toExponential(2)}</strong>
        </div>
      </div>

      <div className="maxwell-flux" aria-label="Poynting flux ratios">
        <FluxRow label="R" value={run.tmm.reflectance} explainId="coating.reflectance" explainMode={explainMode} />
        <FluxRow label="T" value={run.tmm.transmittance} explainId="coating.transmittance" explainMode={explainMode} />
        <FluxRow label="A" value={run.tmm.absorbance} explainId="coating.absorbance" explainMode={explainMode} />
      </div>
      <WhereMeasuredBlock entryId="coating.rtaMeasurementLocation" explainMode={explainMode}>
        R/T/A are measured across an ideal infinite planar coating stack. The incident side is before the first
        coating layer; the substrate side is after the last layer. There is no 3D source-to-substrate distance in this solver.
      </WhereMeasuredBlock>

      <div className="maxwell-monitor-card">
        <div className="maxwell-section-heading">
          <h2><ExplainLabel entryId="coating.fieldMonitor" explainMode={explainMode}>Planar Field Monitor</ExplainLabel></h2>
          <div className="maxwell-heading-actions">
            <strong>{run.fieldMonitor.resultHash.slice(0, 10)}</strong>
            <ExplainButton entryId="coating.fieldMonitorLocation" label="Where is this?" explainMode={explainMode} />
          </div>
        </div>
        <FieldMonitorPlot monitor={run.fieldMonitor} />
        <WhereMeasuredBlock entryId="coating.fieldMonitorLocation" explainMode={explainMode}>
          Samples are taken through planar stack depth: incident boundary, layer fronts/middles/backs, and substrate boundary.
          This monitor is a 1D coating-stack diagnostic, not a volumetric 3D field probe.
        </WhereMeasuredBlock>
        <div className="profile-meta">
          <div className="compact-stat">
            <span>Max |E|^2</span>
            <strong>{run.fieldMonitor.maxElectricIntensity.toExponential(2)}</strong>
          </div>
          <div className="compact-stat">
            <span>Layer A sum</span>
            <strong>{formatPercent(run.fieldMonitor.aggregateLayerAbsorbance)}</strong>
          </div>
          <div className="compact-stat">
            <span>Samples</span>
            <strong>{run.fieldMonitor.samples.length}</strong>
          </div>
        </div>
        {run.fieldMonitor.layerFlux.length > 0 ? (
          <div className="maxwell-layer-absorption">
            {run.fieldMonitor.layerFlux.map((layer) => (
              <div className="compact-stat" key={layer.layerId}>
                <span>{layer.label}</span>
                <strong>{formatPercent(layer.absorbedFlux)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No coating layer absorption rows for a bare boundary.</div>
        )}
      </div>

      <div className="maxwell-foundry-card">
        <div className="maxwell-section-heading">
          <h2>Design Foundry</h2>
          <strong>{foundry.resultHash.slice(0, 10)}</strong>
        </div>
        <div className="profile-meta">
          <div className="compact-stat">
            <span>Objective</span>
            <strong>{foundry.objective.label}</strong>
          </div>
          <div className="compact-stat">
            <span>Variables</span>
            <strong>{foundry.variableCount}</strong>
          </div>
          <div className="compact-stat">
            <span>Evaluations</span>
            <strong>{foundry.evaluationCount}</strong>
          </div>
        </div>
        <div className="profile-meta">
          <div className="compact-stat">
            <span>Seed score</span>
            <strong>{foundry.seed.score.toExponential(2)}</strong>
          </div>
          <div className="compact-stat">
            <span>Best score</span>
            <strong>{foundry.best.score.toExponential(2)}</strong>
          </div>
          <div className="compact-stat">
            <span>Best mean R</span>
            <strong>{formatPercent(foundry.best.metrics.meanReflectance)}</strong>
          </div>
          <div className="compact-stat">
            <span>Certified</span>
            <strong>{foundry.best.certifiedRun.resultHash.slice(0, 10)}</strong>
          </div>
        </div>
        {foundry.best.stack.layers.length > 0 ? (
          <div className="maxwell-foundry-layers">
            {foundry.best.stack.layers.map((layer) => (
              <div className="compact-stat" key={layer.id}>
                <span>{layer.label}</span>
                <strong>{(layer.thicknessM * 1e9).toFixed(2)} nm</strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No coating variables for a bare boundary.</div>
        )}
        <div className="maxwell-layer-actions">
          <button type="button" disabled={foundry.variableCount === 0} onClick={applyFoundryBest}>
            <Sparkles size={15} />
            <span>Apply Best</span>
          </button>
          <button type="button" onClick={() => exportFoundryJson(foundry)}>
            <FileDown size={15} />
            <span>Foundry JSON</span>
          </button>
        </div>
      </div>

      <div className="maxwell-search-card">
        <div className="maxwell-section-heading">
          <h2><ExplainLabel entryId="optimizer.coatingStack" explainMode={explainMode}>Coating Stack Optimizer</ExplainLabel></h2>
          <div className="maxwell-heading-actions">
            <strong>{robustResult ? robustResult.resultHash.slice(0, 10) : searchResult ? searchResult.resultHash.slice(0, 10) : "not run"}</strong>
            <ExplainButton entryId="optimizer.coatingStack" label="Where is this?" explainMode={explainMode} />
          </div>
        </div>
        <div className="l2-disclosure">
          <strong>Planar coating candidate finder</strong>
          <span>The optimizer tries selected materials, layer orders, and thicknesses. It does not search the internet or fetch new material data.</span>
        </div>
        <div className="maxwell-search-controls">
          <label className="field-row">
            <span>Targets</span>
            <input value={searchWavelengthsText} onChange={(event) => setSearchWavelengthsText(event.currentTarget.value)} />
          </label>
          <NumberField label="Layer min" value={searchLayerMin} min={0} max={6} step={1} onChange={setSearchLayerMin} />
          <NumberField label="Layer max" value={searchLayerMax} min={1} max={6} step={1} onChange={setSearchLayerMax} />
          <NumberField label="Min thick" value={searchThicknessMinNm} unit="nm" min={1} max={1000} step={5} onChange={setSearchThicknessMinNm} />
          <NumberField label="Max thick" value={searchThicknessMaxNm} unit="nm" min={1} max={1000} step={5} onChange={setSearchThicknessMaxNm} />
          <NumberField label="Step" value={searchThicknessStepNm} unit="nm" min={1} max={250} step={5} onChange={setSearchThicknessStepNm} />
          <NumberField label="Beam" explainId="search.beamWidth" explainMode={explainMode} value={searchBeamWidth} min={2} max={32} step={1} onChange={setSearchBeamWidth} />
        </div>
        <div className="maxwell-robust-controls">
          <label className="maxwell-material-check">
            <input type="checkbox" checked={robustSearchEnabled} onChange={() => setRobustSearchEnabled((current) => !current)} />
            <ExplainLabel entryId="robust.p90Score" explainMode={explainMode}>Robust optimizer</ExplainLabel>
            <strong>drift yield</strong>
          </label>
          <label className="field-row">
            <ExplainLabel entryId={robustUncertaintyMode === "shared-scale" ? "robust.sharedDepositionScale" : robustUncertaintyMode === "shared-offset-residual" ? "robust.sharedOffsetResidual" : "robust.independentThickness"} explainMode={explainMode}>Model</ExplainLabel>
            <select value={robustUncertaintyMode} onChange={(event) => setRobustUncertaintyMode(event.currentTarget.value as RobustUncertaintyModeId)}>
              <option value="independent-thickness">Independent thickness</option>
              <option value="shared-scale">Shared deposition scale</option>
              <option value="shared-offset-residual">Shared offset + residual</option>
            </select>
          </label>
          <NumberField label="Sigma" value={robustThicknessSigmaNm} unit="nm" min={0} max={50} step={0.25} onChange={setRobustThicknessSigmaNm} />
          <label className="field-row">
            <span>Levels</span>
            <input value={robustSigmaLevelsText} onChange={(event) => setRobustSigmaLevelsText(event.currentTarget.value)} />
          </label>
          <NumberField label="Scale sigma" value={robustScaleSigmaPercent} unit="%" min={0} max={20} step={0.1} onChange={setRobustScaleSigmaPercent} />
          <NumberField label="Offset sigma" value={robustOffsetSigmaNm} unit="nm" min={0} max={50} step={0.25} onChange={setRobustOffsetSigmaNm} />
          <NumberField label="Residual" value={robustResidualSigmaNm} unit="nm" min={0} max={20} step={0.25} onChange={setRobustResidualSigmaNm} />
          <NumberField label="Max samples" explainId="robust.sampleReduction" explainMode={explainMode} value={robustMaxSamples} min={1} max={243} step={1} onChange={setRobustMaxSamples} />
          <label className="field-row">
            <ExplainLabel entryId={robustPrimaryMetric === "expectedScore" ? "robust.expectedScore" : robustPrimaryMetric === "worstCaseScore" ? "robust.worstCaseScore" : robustPrimaryMetric === "passRate" ? "robust.passRate" : "robust.p90Score"} explainMode={explainMode}>Ranking</ExplainLabel>
            <select value={robustPrimaryMetric} onChange={(event) => setRobustPrimaryMetric(event.currentTarget.value as RobustCoatingSearchPrimaryMetric)}>
              <option value="p90Score">p90 score</option>
              <option value="expectedScore">expected score</option>
              <option value="worstCaseScore">worst-case score</option>
              <option value="passRate">pass rate</option>
            </select>
          </label>
          <label className="field-row">
            <span>Pass score</span>
            <input value={robustPassThresholdText} placeholder="optional" onChange={(event) => setRobustPassThresholdText(event.currentTarget.value)} />
          </label>
        </div>
        <div className="maxwell-search-materials">
          {layerMaterialOptions.map((material) => (
            <label key={material.id} className="maxwell-material-check">
              <input type="checkbox" checked={searchMaterialIds.includes(material.id)} onChange={() => toggleSearchMaterial(material.id)} />
              <span>{material.label}</span>
              <strong>{material.origin === "imported" ? "imported" : "built-in"}</strong>
            </label>
          ))}
        </div>
        <WhereMeasuredBlock entryId="optimizer.candidateMaterials" explainMode={explainMode}>
          Candidate materials are selected from the loaded material catalog. The optimizer only combines those fixed records
          into planar layer stacks for the configured incident and substrate media.
        </WhereMeasuredBlock>
        <div className="maxwell-layer-actions">
          <button type="button" onClick={runSearch}>
            <Sparkles size={15} />
            <span>{robustSearchEnabled ? "Find Robust Coating Candidates" : "Find Candidate Coatings"}</span>
          </button>
          {(robustResult || searchResult) && (
            <button type="button" onClick={() => (robustResult ? exportRobustSearchJson(robustResult) : searchResult ? exportSearchJson(searchResult) : undefined)}>
              <FileDown size={15} />
              <span>{robustResult ? "Robust Optimizer JSON" : "Optimizer JSON"}</span>
            </button>
          )}
        </div>
        {searchError && <div className="error-banner">{searchError}</div>}
        {robustResult ? (
          <div className="maxwell-search-results">
            <div className="profile-meta">
              <div className="compact-stat">
                <ExplainLabel entryId="robust.p90Score" explainMode={explainMode}>Best p90</ExplainLabel>
                <strong>{robustResult.best.yield.p90Score.toExponential(2)}</strong>
              </div>
              <div className="compact-stat">
                <span>Model</span>
                <strong>{robustResult.best.uncertaintyReceipt.label}</strong>
              </div>
              <div className="compact-stat">
                <span>Robust samples</span>
                <strong>{robustResult.sampleEvaluationCount}</strong>
              </div>
              <div className="compact-stat">
                <span>Nominal evals</span>
                <strong>{robustResult.evaluationCount}</strong>
              </div>
            </div>
            {robustResult.candidates.map((candidate) => (
              <div className="maxwell-search-row" key={candidate.resultHash}>
                <div className="maxwell-search-stack">
                  <span>#{candidate.rank}</span>
                  <strong>{formatSearchStack(candidate.nominalCandidate)}</strong>
                  <em>{candidate.materialCatalogRefs.some((reference) => reference.origin === "imported") ? "imported fixed n/k" : "built-in fixed n/k"}</em>
                </div>
                <div className="profile-meta">
                  <div className="compact-stat">
                    <span>Nominal</span>
                    <strong>{candidate.nominal.score.toExponential(2)}</strong>
                  </div>
                  <div className="compact-stat">
                    <ExplainLabel entryId="robust.expectedScore" explainMode={explainMode}>Expected</ExplainLabel>
                    <strong>{candidate.yield.expectedScore.toExponential(2)}</strong>
                  </div>
                  <div className="compact-stat">
                    <ExplainLabel entryId="robust.p90Score" explainMode={explainMode}>P90</ExplainLabel>
                    <strong>{candidate.yield.p90Score.toExponential(2)}</strong>
                  </div>
                  <div className="compact-stat">
                    <ExplainLabel entryId="robust.worstCaseScore" explainMode={explainMode}>Worst</ExplainLabel>
                    <strong>{candidate.yield.worstCaseScore.toExponential(2)}</strong>
                  </div>
                  <div className="compact-stat">
                    <ExplainLabel entryId="robust.passRate" explainMode={explainMode}>Pass rate</ExplainLabel>
                    <strong>{candidate.yield.passRate === undefined ? "n/a" : formatPercent(candidate.yield.passRate)}</strong>
                  </div>
                  <div className="compact-stat">
                    <span>Samples</span>
                    <strong>{candidate.yield.sampleCount}</strong>
                  </div>
                  {candidate.comparison && (
                    <>
                      <div className="compact-stat">
                        <span>Independent P90</span>
                        <strong>{candidate.comparison.independentThickness.p90Score.toExponential(2)}</strong>
                      </div>
                      <div className="compact-stat">
                        <span>P90 delta</span>
                        <strong>{formatSignedExponential(candidate.yield.p90Score - candidate.comparison.independentThickness.p90Score)}</strong>
                      </div>
                    </>
                  )}
                </div>
                <div className="profile-meta">
                  <div className="compact-stat">
                    <span>Expected R</span>
                    <strong>{formatPercent(candidate.yield.expectedReflectance)}</strong>
                  </div>
                  <div className="compact-stat">
                    <span>P90 R</span>
                    <strong>{formatPercent(candidate.yield.p90Reflectance)}</strong>
                  </div>
                  <div className="compact-stat">
                    <span>Worst R</span>
                    <strong>{formatPercent(candidate.yield.worstCaseReflectance)}</strong>
                  </div>
                </div>
                <div className="maxwell-search-provenance">
                  <span>{formatUncertaintyReceipt(candidate.uncertaintyReceipt)}</span>
                  <span>{formatUncertaintySamples(candidate.uncertaintyReceipt)}</span>
                  {candidate.comparison && <span>baseline independent P90 {candidate.comparison.independentThickness.p90Score.toExponential(2)}</span>}
                  {candidate.materialCatalogRefs.map((reference) => (
                    <span key={reference.materialId}>
                      {reference.label} {reference.materialHash.slice(0, 8)}
                    </span>
                  ))}
                </div>
                <div className="maxwell-layer-actions">
                  <button type="button" onClick={() => applyRobustSearchCandidate(candidate)}>
                    <Sparkles size={15} />
                    <span>Apply Robust Coating Candidate</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : searchResult ? (
          <div className="maxwell-search-results">
            <div className="profile-meta">
              <div className="compact-stat">
                <span>Best mean R</span>
                <strong>{formatPercent(searchResult.best.metrics.meanReflectance)}</strong>
              </div>
              <div className="compact-stat">
                <span>Evaluations</span>
                <strong>{searchResult.evaluationCount}</strong>
              </div>
              <div className="compact-stat">
                <span>Rejected</span>
                <strong>{searchResult.rejectedCount}</strong>
              </div>
            </div>
            {searchResult.candidates.map((candidate) => (
              <div className="maxwell-search-row" key={candidate.resultHash}>
                <div className="maxwell-search-stack">
                  <span>#{candidate.rank}</span>
                  <strong>{formatSearchStack(candidate)}</strong>
                  <em>{candidate.materialCatalogRefs.some((reference) => reference.origin === "imported") ? "imported material" : "built-in only"}</em>
                </div>
                <div className="profile-meta">
                  <div className="compact-stat">
                    <span>Score</span>
                    <strong>{candidate.score.toExponential(2)}</strong>
                  </div>
                  <div className="compact-stat">
                    <span>Mean R</span>
                    <strong>{formatPercent(candidate.metrics.meanReflectance)}</strong>
                  </div>
                  <div className="compact-stat">
                    <span>Mean T</span>
                    <strong>{formatPercent(candidate.metrics.meanTransmittance)}</strong>
                  </div>
                  <div className="compact-stat">
                    <span>Mean A</span>
                    <strong>{formatPercent(candidate.metrics.meanAbsorbance)}</strong>
                  </div>
                </div>
                <div className="maxwell-search-provenance">
                  {candidate.materialCatalogRefs.map((reference) => (
                    <span key={reference.materialId}>
                      {reference.label} {reference.materialHash.slice(0, 8)}
                    </span>
                  ))}
                </div>
                <div className="maxwell-layer-actions">
                  <button type="button" onClick={() => applySearchCandidate(candidate)}>
                    <Sparkles size={15} />
                    <span>Apply Coating Candidate</span>
                  </button>
                  <ExplainButton entryId="optimizer.applyCandidate" label="Under the hood: apply coating candidate" explainMode={explainMode} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">Find candidate coatings to rank planar material/order/thickness designs.</div>
        )}
      </div>

      <div className="maxwell-yield-card">
        <div className="maxwell-section-heading">
          <h2>Tolerance Yield</h2>
          <strong>{yieldAnalysis.resultHash.slice(0, 10)}</strong>
        </div>
        <div className="profile-meta">
          <div className="compact-stat">
            <span>Pass rate</span>
            <strong>{formatPercent(yieldAnalysis.passRate)}</strong>
          </div>
          <div className="compact-stat">
            <span>95% CI</span>
            <strong>{formatInterval(yieldAnalysis.confidenceInterval.lower, yieldAnalysis.confidenceInterval.upper)}</strong>
          </div>
          <div className="compact-stat">
            <span>Samples</span>
            <strong>{yieldAnalysis.samples.length}</strong>
          </div>
          <div className="compact-stat">
            <span>Worst score</span>
            <strong>{yieldAnalysis.worstSample.score.toExponential(2)}</strong>
          </div>
        </div>
        <div className="maxwell-yield-requirements">
          {yieldAnalysis.requirements.map((requirement) => (
            <div className="compact-stat" key={requirement.requirement.id}>
              <span>{requirement.requirement.label}</span>
              <strong>
                {formatPercent(requirement.passRate)} pass / worst {formatMetric(requirement.requirement.metric, requirement.worstValue)}
              </strong>
            </div>
          ))}
        </div>
        {yieldAnalysis.sensitivities.length > 0 ? (
          <div className="maxwell-yield-requirements">
            {yieldAnalysis.sensitivities.slice(0, 3).map((sensitivity) => (
              <div className="compact-stat" key={sensitivity.layerId}>
                <span>
                  #{sensitivity.rank} {sensitivity.label}
                </span>
                <strong>{sensitivity.impactScore.toExponential(2)} score impact</strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No coating tolerance sensitivities for a bare boundary.</div>
        )}
        <div className="maxwell-layer-actions">
          <button type="button" onClick={() => exportYieldJson(yieldAnalysis)}>
            <ShieldCheck size={15} />
            <span>Yield JSON</span>
          </button>
        </div>
      </div>

      <div className="maxwell-sweep-card">
        <div className="maxwell-section-heading">
          <h2>Wavelength Sweep</h2>
          <strong>{sweep.resultHash.slice(0, 10)}</strong>
        </div>
        <div className="maxwell-sweep-controls">
          <NumberField label="Start" value={sweepStartNm} unit="nm" min={200} max={2000} step={5} onChange={setSweepStartNm} />
          <NumberField label="End" value={sweepEndNm} unit="nm" min={200} max={2000} step={5} onChange={setSweepEndNm} />
          <NumberField label="Samples" value={sweepCount} min={3} max={81} step={2} onChange={setSweepCount} />
        </div>
        <SweepPlot sweep={sweep} />
        <div className="profile-meta">
          <div className="compact-stat">
            <span>R min</span>
            <strong>{formatPercent(sweep.reflectanceMin)}</strong>
          </div>
          <div className="compact-stat">
            <span>R max</span>
            <strong>{formatPercent(sweep.reflectanceMax)}</strong>
          </div>
          <div className="compact-stat">
            <span>A max</span>
            <strong>{formatPercent(sweep.absorbanceMax)}</strong>
          </div>
        </div>
      </div>

      {warnings.length > 0 && (
        <ul className="warning-list">
          {warnings.map((warning, index) => (
            <li key={`${index}:${warning.code}:${warning.elementId ?? ""}`}>{warning.message}</li>
          ))}
        </ul>
      )}

      <div className="maxwell-stack">
        <h2>Limitations</h2>
        <ul>
          {(robustResult?.provenance.limitations ?? searchResult?.provenance.limitations ?? []).map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
          {yieldAnalysis.provenance.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
          {foundry.provenance.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
          {run.provenance.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function NumberField({
  label,
  explainId,
  explainMode = false,
  value,
  unit,
  min,
  max,
  step = 0.1,
  onChange
}: {
  label: string;
  explainId?: ExplainEntryId;
  explainMode?: boolean;
  value: number;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field-row">
      {explainId ? <ExplainLabel entryId={explainId} explainMode={explainMode}>{label}</ExplainLabel> : <span>{label}</span>}
      <div className="number-input">
        <input
          type="number"
          value={formatNumberInputValue(value)}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(Number(event.currentTarget.value))}
        />
        {unit && <em>{unit}</em>}
      </div>
    </label>
  );
}

function BatchMeasurementSessionQaPanel({
  manifestText,
  setManifestText,
  maxGeometricRmsResidualPx,
  setMaxGeometricRmsResidualPx,
  maxPixelScaleRepeatabilityStd,
  setMaxPixelScaleRepeatabilityStd,
  minMtf50CyclesPerPx,
  setMinMtf50CyclesPerPx,
  maxMtf50Cv,
  setMaxMtf50Cv,
  maxCameraBlackLevelDriftDn,
  setMaxCameraBlackLevelDriftDn,
  maxAllowedWarningCount,
  setMaxAllowedWarningCount,
  minDetectionCoverage,
  setMinDetectionCoverage,
  maxZScore,
  setMaxZScore,
  result,
  onLoadExample,
  onRun,
  onExport,
  onSave
}: {
  manifestText: string;
  setManifestText: (value: string) => void;
  maxGeometricRmsResidualPx: number;
  setMaxGeometricRmsResidualPx: (value: number) => void;
  maxPixelScaleRepeatabilityStd: number;
  setMaxPixelScaleRepeatabilityStd: (value: number) => void;
  minMtf50CyclesPerPx: number;
  setMinMtf50CyclesPerPx: (value: number) => void;
  maxMtf50Cv: number;
  setMaxMtf50Cv: (value: number) => void;
  maxCameraBlackLevelDriftDn: number;
  setMaxCameraBlackLevelDriftDn: (value: number) => void;
  maxAllowedWarningCount: number;
  setMaxAllowedWarningCount: (value: number) => void;
  minDetectionCoverage: number;
  setMinDetectionCoverage: (value: number) => void;
  maxZScore: number;
  setMaxZScore: (value: number) => void;
  result: L74SessionQaResult | null;
  onLoadExample: () => void;
  onRun: () => L74SessionQaResult | null;
  onExport: () => void;
  onSave: () => void;
}) {
  const aggregateRows = result?.aggregates.slice(0, 8) ?? [];
  const frameRows = result?.frames.slice(0, 10) ?? [];
  const outlierRows = result?.outliers.slice(0, 8) ?? [];
  const trendAggregate = result?.aggregates.find((aggregate) => aggregate.metricId === "mtf50_cycles_per_px")
    ?? result?.aggregates.find((aggregate) => aggregate.metricId === "rms_residual_px")
    ?? result?.aggregates.find((aggregate) => aggregate.count >= 2)
    ?? null;
  const trendRows = trendAggregate && result
    ? result.frames
      .map((frame) => {
        const metricRow = frame.metrics.find((metric) => metric.id === trendAggregate.metricId);
        return metricRow && Number.isFinite(metricRow.value) ? { frameId: frame.frameId, value: metricRow.value } : null;
      })
      .filter((row): row is { frameId: string; value: number } => row !== null)
    : [];
  const trendMin = trendRows.length > 0 ? Math.min(...trendRows.map((row) => row.value)) : 0;
  const trendMax = trendRows.length > 0 ? Math.max(...trendRows.map((row) => row.value)) : 1;
  const trendRange = Math.max(1e-9, trendMax - trendMin);
  const exportNames = ["session_report.md", "session_report.json", "frame_metrics.csv", "session_metrics.csv", "outliers.csv", "warnings.json"];

  return (
    <div className="maxwell-study-card maxwell-l74-panel" aria-label="L7.4 Batch Measurement Session + Repeatability QA">
      <div className="maxwell-section-heading">
        <h2>L7.4 Batch Measurement Session + Repeatability QA</h2>
        <strong className={`maxwell-l74-status ${result ? `maxwell-l74-status-${result.status}` : ""}`}>{result ? result.status.toUpperCase() : "not run"}</strong>
      </div>
      <div className="l2-disclosure">
        <strong>Import a batch manifest, normalize existing diagnostic frame metrics, aggregate repeatability and drift, flag outliers, and export a session report.</strong>
        <span>Diagnostic session QA only: this does not certify camera calibration, ISO/Imatest/EMVA performance, lab metrology, hardware control, full 3D pose/stereo calibration, manufacturing calibration, or new 3D Maxwell/FDTD/FEM/BEM/RCWA/CAD physics.</span>
      </div>

      <div className="maxwell-workspace-grid maxwell-l74-grid">
        <div className="maxwell-workspace-panel" aria-label="L7.4 session manifest editor">
          <div className="maxwell-section-heading">
            <h2>Batch Session Manifest</h2>
            <strong>{manifestText.split(/\r?\n/).filter((line) => line.trim()).length} lines</strong>
          </div>
          <label className="maxwell-measured-textarea-label">
            <span>CSV columns: frame_id,type,path_or_name,focus_z_um,exposure_ms,gain,temperature_c,notes</span>
            <textarea
              className="maxwell-measured-textarea maxwell-l74-textarea"
              value={manifestText}
              spellCheck={false}
              onChange={(event) => setManifestText(event.currentTarget.value)}
              aria-label="L7.4 batch session manifest CSV"
            />
          </label>
          <div className="maxwell-layer-actions">
            <button type="button" onClick={onLoadExample}><Sparkles size={15} /><span>Load Example Session Manifest</span></button>
            <button type="button" onClick={() => onRun()}><ShieldCheck size={15} /><span>Run Session QA</span></button>
            <button type="button" onClick={onExport}><FileDown size={15} /><span>Export Session QA</span></button>
            <button type="button" onClick={onSave}><Save size={15} /><span>Save Session Study</span></button>
          </div>
        </div>

        <div className="maxwell-workspace-panel" aria-label="L7.4 repeatability threshold controls">
          <div className="maxwell-section-heading">
            <h2>Repeatability Thresholds</h2>
            <strong>diagnostic</strong>
          </div>
          <div className="maxwell-study-controls">
            <NumberField label="Max geometric RMS px" value={maxGeometricRmsResidualPx} min={0.01} max={10} step={0.01} onChange={setMaxGeometricRmsResidualPx} />
            <NumberField label="Max pixel-scale std" value={maxPixelScaleRepeatabilityStd} unit="um/px" min={0.001} max={1} step={0.001} onChange={setMaxPixelScaleRepeatabilityStd} />
            <NumberField label="Min MTF50" value={minMtf50CyclesPerPx} unit="cycles/px" min={0} max={0.5} step={0.005} onChange={setMinMtf50CyclesPerPx} />
            <NumberField label="Max MTF50 CV" value={maxMtf50Cv} min={0.001} max={2} step={0.005} onChange={setMaxMtf50Cv} />
            <NumberField label="Max black-level drift" value={maxCameraBlackLevelDriftDn} unit="DN" min={0} max={100} step={0.1} onChange={setMaxCameraBlackLevelDriftDn} />
            <NumberField label="Max warnings" value={maxAllowedWarningCount} min={0} max={20} step={1} onChange={setMaxAllowedWarningCount} />
            <NumberField label="Min detection coverage" value={minDetectionCoverage} min={0} max={1} step={0.01} onChange={setMinDetectionCoverage} />
            <NumberField label="Max z-score" value={maxZScore} min={0.1} max={10} step={0.1} onChange={setMaxZScore} />
          </div>
        </div>

        <div className="maxwell-workspace-panel" aria-label="L7.4 session summary smoke preview">
          <div className="maxwell-section-heading">
            <h2>Session Summary</h2>
            <strong>{result ? result.resultHash.slice(0, 10) : "pending"}</strong>
          </div>
          {result ? (
            <div className="profile-meta">
              <div className="compact-stat"><span>Status</span><strong>{result.status.toUpperCase()}</strong></div>
              <div className="compact-stat"><span>Frames</span><strong>{result.frameCount}</strong></div>
              <div className="compact-stat"><span>Accepted / rejected</span><strong>{result.acceptedFrameCount} / {result.rejectedFrameCount}</strong></div>
              <div className="compact-stat"><span>Aggregates</span><strong>{result.aggregates.length}</strong></div>
              <div className="compact-stat"><span>Outliers</span><strong>{result.outliers.length}</strong></div>
              <div className="compact-stat"><span>Manifest hash</span><strong>{result.manifestHash.slice(0, 10)}</strong></div>
            </div>
          ) : (
            <div className="empty-state">Run Session QA to compute repeatability aggregates, trend slopes, outlier tables, and exportable reports.</div>
          )}
        </div>

        <div className="maxwell-workspace-panel" aria-label="L7.4 session manifest smoke preview">
          <div className="maxwell-section-heading">
            <h2>Frame Review</h2>
            <strong>{frameRows.length} shown</strong>
          </div>
          {result ? (
            <div className="maxwell-data-table maxwell-l74-table" aria-label="L7.4 session manifest smoke preview">
              <div className="maxwell-l74-row header"><span>Frame</span><span>Type</span><span>Status</span><span>Source</span><span>Warnings</span></div>
              {frameRows.map((frame) => (
                <div className="maxwell-l74-row" key={frame.frameId}>
                  <span>{frame.frameId}</span>
                  <span>{frame.type}</span>
                  <strong className={`maxwell-l74-status maxwell-l74-status-${frame.status}`}>{frame.status}</strong>
                  <span>{frame.sourceLabel}</span>
                  <span>{frame.warnings.length}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">Manifest frame review appears after analysis.</div>
          )}
        </div>

        <div className="maxwell-workspace-panel" aria-label="L7.4 session aggregate metrics smoke preview">
          <div className="maxwell-section-heading">
            <h2>Aggregate Metrics</h2>
            <strong>{aggregateRows.length} shown</strong>
          </div>
          {result ? (
            <div className="maxwell-data-table maxwell-l74-table" aria-label="L7.4 session aggregate metrics smoke preview">
              <div className="maxwell-l74-row aggregate header"><span>Metric</span><span>Count</span><span>Mean</span><span>Std</span><span>Drift/frame</span></div>
              {aggregateRows.map((aggregate) => (
                <div className="maxwell-l74-row aggregate" key={aggregate.metricId}>
                  <span>{aggregate.label}</span>
                  <span>{aggregate.count}</span>
                  <strong>{formatNullableMetric(aggregate.mean)}{aggregate.unit ? ` ${aggregate.unit}` : ""}</strong>
                  <span>{formatNullableMetric(aggregate.std)}</span>
                  <span>{formatNullableMetric(aggregate.driftSlopePerFrame)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">Aggregate mean/std/CV/repeatability and drift slopes appear after analysis.</div>
          )}
        </div>

        <div className="maxwell-workspace-panel" aria-label="L7.4 session outlier table smoke preview">
          <div className="maxwell-section-heading">
            <h2>Outlier Table</h2>
            <strong>{outlierRows.length} shown</strong>
          </div>
          {result ? (
            <div className="maxwell-data-table maxwell-l74-table" aria-label="L7.4 session outlier table smoke preview">
              <div className="maxwell-l74-row outlier header"><span>Frame</span><span>Metric</span><span>Severity</span><span>Rule</span><span>Value</span></div>
              {outlierRows.length > 0 ? outlierRows.map((outlier) => (
                <div className="maxwell-l74-row outlier" key={`${outlier.frameId}-${outlier.metricId}-${outlier.rule}`}>
                  <span>{outlier.frameId}</span>
                  <span>{outlier.metricId}</span>
                  <strong className={`maxwell-l74-status maxwell-l74-status-${outlier.severity}`}>{outlier.severity}</strong>
                  <span>{outlier.rule}</span>
                  <span>{formatNullableMetric(outlier.value)}</span>
                </div>
              )) : <div className="empty-state">No outliers at the current thresholds.</div>}
            </div>
          ) : (
            <div className="empty-state">Outlier rows appear after analysis.</div>
          )}
        </div>

        <div className="maxwell-workspace-panel" aria-label="L7.4 session trend plot smoke preview">
          <div className="maxwell-section-heading">
            <h2>Trend Plot</h2>
            <strong>{trendAggregate ? trendAggregate.label : "pending"}</strong>
          </div>
          {trendRows.length > 0 ? (
            <div className="maxwell-l74-trend" aria-label="L7.4 session trend plot smoke preview">
              {trendRows.map((row) => (
                <i key={row.frameId} style={{ height: `${18 + ((row.value - trendMin) / trendRange) * 86}%` }}>
                  <span>{row.frameId}</span>
                </i>
              ))}
            </div>
          ) : (
            <div className="empty-state">Run Session QA to draw an MTF50 or residual trend over frame order.</div>
          )}
        </div>

        <div className="maxwell-workspace-panel" aria-label="L7.4 session export smoke preview">
          <div className="maxwell-section-heading">
            <h2>Export Bundle</h2>
            <strong>{exportNames.length} files</strong>
          </div>
          <div className="maxwell-data-table maxwell-l74-export-list" aria-label="L7.4 session export smoke preview">
            {exportNames.map((name) => <div className="compact-stat" key={name}><span>{name}</span><strong>{result ? "ready" : "on run"}</strong></div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function GeometricCalibrationWorkbenchPanel({
  targetKind,
  setTargetKind,
  widthPx,
  setWidthPx,
  heightPx,
  setHeightPx,
  rows,
  setRows,
  columns,
  setColumns,
  spacingUm,
  setSpacingUm,
  pixelPitchUm,
  setPixelPitchUm,
  rotationDeg,
  setRotationDeg,
  radialK1,
  setRadialK1,
  radialK2,
  setRadialK2,
  fitModel,
  setFitModel,
  pointCsvText,
  setPointCsvText,
  target,
  importedPointSet,
  fit,
  comparison,
  targetImage,
  roiXPx,
  setRoiXPx,
  roiYPx,
  setRoiYPx,
  roiWidthPx,
  setRoiWidthPx,
  roiHeightPx,
  setRoiHeightPx,
  thresholdMode,
  setThresholdMode,
  threshold,
  setThreshold,
  polarity,
  setPolarity,
  minBlobAreaPx,
  setMinBlobAreaPx,
  maxBlobAreaPx,
  setMaxBlobAreaPx,
  maxMissingPoints,
  setMaxMissingPoints,
  outlierResidualWarnPx,
  setOutlierResidualWarnPx,
  detection,
  selectedPointId,
  setSelectedPointId,
  showDetectionLabels,
  setShowDetectionLabels,
  onGenerateTarget,
  onImportCsv,
  onImportFile,
  onRunFit,
  onCompare,
  onExport,
  onSave,
  onUseGeneratedTargetAsImage,
  onImportTargetImage,
  onAutoDetect,
  onClearDetection,
  onMoveSelectedPoint,
  onRejectSelectedPoint,
  onAcceptSelectedPoint,
  onAddPoint,
  onDeleteSelectedPoint,
  onRunDetectionFit,
  onExportDetection,
  onSaveDetectionStudy,
  fiducialBoard,
  fiducialDetection,
  fiducialMatch,
  fiducialFit,
  fiducialSquaresX,
  setFiducialSquaresX,
  fiducialSquaresY,
  setFiducialSquaresY,
  fiducialSquareSizeMm,
  setFiducialSquareSizeMm,
  fiducialMarkerSizeFraction,
  setFiducialMarkerSizeFraction,
  fiducialDroppedMarkerModulo,
  setFiducialDroppedMarkerModulo,
  fiducialNoisePx,
  setFiducialNoisePx,
  fiducialDetectionJsonText,
  setFiducialDetectionJsonText,
  selectedFiducialMarkerId,
  setSelectedFiducialMarkerId,
  onGenerateFiducialBoard,
  onGenerateFiducialDetection,
  onLoadFiducialDetectionExample,
  onImportFiducialDetectionJson,
  onMatchFiducialIds,
  onRunFiducialFit,
  onRejectFiducialMarker,
  onAcceptFiducialMarker,
  onMoveFiducialCorner,
  onRelabelFiducialMarker,
  onExportFiducialBundle,
  onAddFiducialToSession,
  onSaveFiducialStudy,
  sessionQa
}: {
  targetKind: L72TargetKind;
  setTargetKind: (value: L72TargetKind) => void;
  widthPx: number;
  setWidthPx: (value: number) => void;
  heightPx: number;
  setHeightPx: (value: number) => void;
  rows: number;
  setRows: (value: number) => void;
  columns: number;
  setColumns: (value: number) => void;
  spacingUm: number;
  setSpacingUm: (value: number) => void;
  pixelPitchUm: number;
  setPixelPitchUm: (value: number) => void;
  rotationDeg: number;
  setRotationDeg: (value: number) => void;
  radialK1: number;
  setRadialK1: (value: number) => void;
  radialK2: number;
  setRadialK2: (value: number) => void;
  fitModel: L72FitModel;
  setFitModel: (value: L72FitModel) => void;
  pointCsvText: string;
  setPointCsvText: (value: string) => void;
  target: L72GeometricTarget | null;
  importedPointSet: L72PointSet | null;
  fit: L72GeometricFitResult | null;
  comparison: L72GeometryComparisonResult | null;
  targetImage: L73TargetImage | null;
  roiXPx: number;
  setRoiXPx: (value: number) => void;
  roiYPx: number;
  setRoiYPx: (value: number) => void;
  roiWidthPx: number;
  setRoiWidthPx: (value: number) => void;
  roiHeightPx: number;
  setRoiHeightPx: (value: number) => void;
  thresholdMode: L73ThresholdMode;
  setThresholdMode: (value: L73ThresholdMode) => void;
  threshold: number;
  setThreshold: (value: number) => void;
  polarity: L73DotPolarity;
  setPolarity: (value: L73DotPolarity) => void;
  minBlobAreaPx: number;
  setMinBlobAreaPx: (value: number) => void;
  maxBlobAreaPx: number;
  setMaxBlobAreaPx: (value: number) => void;
  maxMissingPoints: number;
  setMaxMissingPoints: (value: number) => void;
  outlierResidualWarnPx: number;
  setOutlierResidualWarnPx: (value: number) => void;
  detection: L73DetectionResult | null;
  selectedPointId: string;
  setSelectedPointId: (value: string) => void;
  showDetectionLabels: boolean;
  setShowDetectionLabels: (value: boolean) => void;
  onGenerateTarget: () => void;
  onImportCsv: () => void;
  onImportFile: (file: File | null) => void | Promise<void>;
  onRunFit: (model?: L72FitModel) => void;
  onCompare: () => void;
  onExport: () => void;
  onSave: () => void;
  onUseGeneratedTargetAsImage: () => void;
  onImportTargetImage: (file: File | null) => void | Promise<void>;
  onAutoDetect: () => void;
  onClearDetection: () => void;
  onMoveSelectedPoint: () => void;
  onRejectSelectedPoint: () => void;
  onAcceptSelectedPoint: () => void;
  onAddPoint: () => void;
  onDeleteSelectedPoint: () => void;
  onRunDetectionFit: (model?: L72FitModel) => void;
  onExportDetection: () => void;
  onSaveDetectionStudy: () => void;
  fiducialBoard: L75FiducialBoard | null;
  fiducialDetection: L75FiducialDetectionBundle | null;
  fiducialMatch: L75FiducialMatchResult | null;
  fiducialFit: L75FiducialFitResult | null;
  fiducialSquaresX: number;
  setFiducialSquaresX: (value: number) => void;
  fiducialSquaresY: number;
  setFiducialSquaresY: (value: number) => void;
  fiducialSquareSizeMm: number;
  setFiducialSquareSizeMm: (value: number) => void;
  fiducialMarkerSizeFraction: number;
  setFiducialMarkerSizeFraction: (value: number) => void;
  fiducialDroppedMarkerModulo: number;
  setFiducialDroppedMarkerModulo: (value: number) => void;
  fiducialNoisePx: number;
  setFiducialNoisePx: (value: number) => void;
  fiducialDetectionJsonText: string;
  setFiducialDetectionJsonText: (value: string) => void;
  selectedFiducialMarkerId: string;
  setSelectedFiducialMarkerId: (value: string) => void;
  onGenerateFiducialBoard: () => void;
  onGenerateFiducialDetection: () => void;
  onLoadFiducialDetectionExample: () => void;
  onImportFiducialDetectionJson: () => void;
  onMatchFiducialIds: () => void;
  onRunFiducialFit: (model?: L72FitModel) => void;
  onRejectFiducialMarker: () => void;
  onAcceptFiducialMarker: () => void;
  onMoveFiducialCorner: () => void;
  onRelabelFiducialMarker: () => void;
  onExportFiducialBundle: () => void;
  onAddFiducialToSession: () => void;
  onSaveFiducialStudy: () => void;
  sessionQa: L74SessionQaResult | null;
}) {
  const activePoints = importedPointSet?.points ?? target?.points ?? [];
  const activeWidthPx = target?.image.widthPx ?? widthPx;
  const activeHeightPx = target?.image.heightPx ?? heightPx;
  const previewPoints = activePoints.slice(0, 120);
  const residualPeak = Math.max(1e-9, ...(fit?.residuals.map((row) => row.residualPx) ?? [1]));
  const correctedPreview = fit?.correctedPoints.slice(0, 10) ?? [];
  const statusLabel = fit?.status.toUpperCase() ?? "PENDING";
  const imageWidthPx = targetImage?.widthPx ?? activeWidthPx;
  const imageHeightPx = targetImage?.heightPx ?? activeHeightPx;
  const roiLeft = clamp((roiXPx / Math.max(1, imageWidthPx)) * 100, 0, 100);
  const roiTop = clamp((roiYPx / Math.max(1, imageHeightPx)) * 100, 0, 100);
  const roiWidth = clamp((roiWidthPx / Math.max(1, imageWidthPx)) * 100, 0, 100 - roiLeft);
  const roiHeight = clamp((roiHeightPx / Math.max(1, imageHeightPx)) * 100, 0, 100 - roiTop);
  const detectionPoints = detection ? [...detection.points, ...detection.rejectedPoints] : [];
  const selectedPoint = detectionPoints.find((point) => point.id === selectedPointId) ?? detectionPoints[0] ?? null;
  const targetImagePreview = targetImage ? l73ImagePreviewCells(targetImage, 44, 30) : null;
  const fiducialBoardWidthUm = fiducialBoard ? fiducialBoard.settings.squaresX * fiducialBoard.settings.squareSizeMm * 1000 : fiducialSquaresX * fiducialSquareSizeMm * 1000;
  const fiducialBoardHeightUm = fiducialBoard ? fiducialBoard.settings.squaresY * fiducialBoard.settings.squareSizeMm * 1000 : fiducialSquaresY * fiducialSquareSizeMm * 1000;
  const fiducialPreviewWidthPx = fiducialBoard?.image.widthPx ?? 560;
  const fiducialPreviewHeightPx = fiducialBoard?.image.heightPx ?? 400;
  const selectedFiducialMarker = selectedL75Marker(fiducialDetection, selectedFiducialMarkerId);
  const fiducialVisibleMarkers = fiducialDetection?.markers ?? [];
  const fiducialDetectionPreview = fiducialVisibleMarkers.slice(0, 140).map((marker) => {
    const center = marker.cornersPx.reduce((acc, corner) => ({ xPx: acc.xPx + corner.xPx / 4, yPx: acc.yPx + corner.yPx / 4 }), { xPx: 0, yPx: 0 });
    return { id: marker.id, status: marker.status, xPx: center.xPx, yPx: center.yPx };
  });
  const fiducialCoverage = fiducialFit?.match ?? fiducialMatch;
  const fiducialExportNames = ["board_manifest.json", "fiducial_detection_report.md", "fiducial_detection_report.json", "matched_points.csv", "rejected_points.csv"];

  return (
    <div className="maxwell-study-card maxwell-l72-panel" aria-label="L7.3 Measured Target Detection and ROI Hardening">
      <div className="maxwell-section-heading">
        <h2>L7.3 Measured Target Detection and ROI Hardening</h2>
        <strong>{fit ? `${statusLabel} / ${fit.model}` : target ? `${target.points.length} target points` : "not run"}</strong>
      </div>
      <div className="l2-disclosure">
        <strong>Import or generate measured target images, adjust ROI, auto-detect dot grids, correct points manually, fit L7.2 geometry, and export detection confidence reports.</strong>
        <span>Diagnostic measured-target detection only; this is not certified camera calibration, lab-accredited metrology, full 3D pose or stereo calibration, AprilTag/ArUco support, a manufacturing digital twin, or 3D Maxwell/FDTD/FEM/BEM/RCWA execution.</span>
      </div>

      <div className="maxwell-workspace-grid">
        <div className="maxwell-workspace-panel maxwell-l75-panel" aria-label="L7.5 Fiducial Board / ChArUco-style Target Workflow">
          <div className="maxwell-section-heading">
            <h2>L7.5 Fiducial Board / ChArUco-style Target Workflow</h2>
            <strong>{fiducialBoard ? `${fiducialBoard.markers.length} markers` : "generate board"}</strong>
          </div>
          <div className="l2-disclosure">
            <strong>Fiducial Board / ChArUco-style Target</strong>
            <span>Diagnostic ChArUco-style synthetic fiducial board generation, imported/synthetic detection matching, manual correction, L7.2 geometry handoff, and L7.4 session QA handoff only; the default board is not OpenCV-compatible and AprilTag decoding is not implemented.</span>
          </div>
          <div className="maxwell-study-controls">
            <NumberField label="Squares X" value={fiducialSquaresX} min={3} max={20} step={1} onChange={(value) => setFiducialSquaresX(Math.round(clamp(value, 3, 20)))} />
            <NumberField label="Squares Y" value={fiducialSquaresY} min={3} max={20} step={1} onChange={(value) => setFiducialSquaresY(Math.round(clamp(value, 3, 20)))} />
            <NumberField label="Square size" value={fiducialSquareSizeMm} unit="mm" min={0.1} max={1000} step={0.1} onChange={setFiducialSquareSizeMm} />
            <NumberField label="Marker fraction" value={fiducialMarkerSizeFraction} min={0.2} max={0.95} step={0.01} onChange={setFiducialMarkerSizeFraction} />
          </div>
          <div className="maxwell-layer-actions">
            <button type="button" onClick={onGenerateFiducialBoard}><Sparkles size={15} /><span>Generate Fiducial Board</span></button>
            <button type="button" onClick={onGenerateFiducialDetection}><ShieldCheck size={15} /><span>Generate Synthetic Detections</span></button>
          </div>
          <div
            className="maxwell-l75-board-preview"
            aria-label="L7.5 fiducial board generator smoke preview"
            style={{ aspectRatio: `${Math.max(1, fiducialPreviewWidthPx)} / ${Math.max(1, fiducialPreviewHeightPx)}` }}
          >
            {fiducialBoard ? (
              fiducialBoard.markers.slice(0, 160).map((marker) => (
                <i
                  key={marker.id}
                  title={`marker ${marker.id}`}
                  style={{
                    left: `${clamp(((marker.centerWorldUm.xWorldUm + fiducialBoardWidthUm / 2) / Math.max(1, fiducialBoardWidthUm)) * 100, 0, 100)}%`,
                    top: `${clamp(((marker.centerWorldUm.yWorldUm + fiducialBoardHeightUm / 2) / Math.max(1, fiducialBoardHeightUm)) * 100, 0, 100)}%`
                  }}
                >
                  <span>{marker.id}</span>
                </i>
              ))
            ) : (
              <span>Generate a diagnostic board to preview marker IDs and board coordinates.</span>
            )}
          </div>
        </div>

        <div className="maxwell-workspace-panel maxwell-l75-panel" aria-label="L7.5 fiducial detection import and match">
          <div className="maxwell-section-heading">
            <h2>Fiducial Detection Import + Match</h2>
            <strong>{fiducialDetection ? `${fiducialDetection.markers.length} markers` : "pending"}</strong>
          </div>
          <div className="maxwell-study-controls">
            <NumberField label="Drop every Nth marker" value={fiducialDroppedMarkerModulo} min={0} max={50} step={1} onChange={(value) => setFiducialDroppedMarkerModulo(Math.round(clamp(value, 0, 50)))} />
            <NumberField label="Synthetic noise" value={fiducialNoisePx} unit="px" min={0} max={20} step={0.01} onChange={setFiducialNoisePx} />
            <label className="field-row">
              <span>Selected marker</span>
              <select value={selectedFiducialMarker?.id.toString() ?? ""} onChange={(event) => setSelectedFiducialMarkerId(event.currentTarget.value)}>
                <option value="">none</option>
                {fiducialVisibleMarkers.slice(0, 180).map((marker) => (
                  <option key={`${marker.id}-${marker.status}`} value={marker.id.toString()}>{marker.id} {marker.status}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="maxwell-measured-textarea-label">
            <span>Detection JSON import</span>
            <textarea
              className="maxwell-measured-textarea maxwell-l75-textarea"
              value={fiducialDetectionJsonText}
              spellCheck={false}
              onChange={(event) => setFiducialDetectionJsonText(event.currentTarget.value)}
              aria-label="L7.5 fiducial detection JSON"
            />
          </label>
          <div className="maxwell-layer-actions">
            <button type="button" onClick={onLoadFiducialDetectionExample}><Sparkles size={15} /><span>Load Example Fiducial JSON</span></button>
            <button type="button" onClick={onImportFiducialDetectionJson}><Upload size={15} /><span>Import Fiducial JSON</span></button>
            <button type="button" onClick={onMatchFiducialIds}><ShieldCheck size={15} /><span>Match Fiducial IDs</span></button>
          </div>
          <div
            className="maxwell-l75-detection-preview"
            aria-label="L7.5 fiducial detection overlay smoke preview"
            style={{ aspectRatio: `${Math.max(1, fiducialPreviewWidthPx)} / ${Math.max(1, fiducialPreviewHeightPx)}` }}
          >
            {fiducialDetectionPreview.length ? (
              fiducialDetectionPreview.map((marker) => (
                <i
                  key={`${marker.id}-${marker.status}`}
                  className={`${marker.status}${marker.id.toString() === selectedFiducialMarkerId ? " selected" : ""}`}
                  title={`marker ${marker.id}: ${marker.status}`}
                  style={{
                    left: `${clamp((marker.xPx / Math.max(1, fiducialPreviewWidthPx)) * 100, 0, 100)}%`,
                    top: `${clamp((marker.yPx / Math.max(1, fiducialPreviewHeightPx)) * 100, 0, 100)}%`
                  }}
                >
                  {marker.id}
                </i>
              ))
            ) : (
              <span>Generate synthetic detections or import detector JSON to preview marker overlays.</span>
            )}
          </div>
        </div>

        <div className="maxwell-workspace-panel maxwell-l75-panel" aria-label="L7.5 fiducial partial-view QA fit and session handoff">
          <div className="maxwell-section-heading">
            <h2>Fiducial Fit + Session Handoff</h2>
            <strong className={`maxwell-l72-status maxwell-l72-status-${fiducialFit?.status ?? "pending"}`}>{fiducialFit?.status.toUpperCase() ?? "PENDING"}</strong>
          </div>
          {fiducialCoverage ? (
            <div className="maxwell-data-table" aria-label="L7.5 partial-view coverage smoke preview">
              <div className="maxwell-study-list">
                <div className="compact-stat"><span>Matched points</span><strong>{fiducialCoverage.matchedPointCount}</strong></div>
                <div className="compact-stat"><span>Marker coverage</span><strong>{fiducialCoverage.markerCoverageScore.toPrecision(4)}</strong></div>
                <div className="compact-stat"><span>ChArUco coverage</span><strong>{fiducialCoverage.charucoCoverageScore.toPrecision(4)}</strong></div>
                <div className="compact-stat"><span>Board-area coverage</span><strong>{fiducialCoverage.boardAreaCoverageScore.toPrecision(4)}</strong></div>
                <div className="compact-stat"><span>Quadrants</span><strong>{fiducialCoverage.coveredQuadrants.length}/4</strong></div>
                <div className="compact-stat"><span>Missing IDs</span><strong>{fiducialCoverage.missingMarkerIds.length}</strong></div>
              </div>
              {fiducialCoverage.warnings.slice(0, 4).map((warning) => <div className="error-banner" key={`${warning.code}-${warning.message}`}>{warning.message}</div>)}
            </div>
          ) : (
            <div className="empty-state" aria-label="L7.5 partial-view coverage smoke preview">Match fiducial IDs to compute coverage, missing IDs, partial-view warnings, and L7.2 point-set handoff.</div>
          )}
          {fiducialFit?.fit ? (
            <div className="maxwell-data-table" aria-label="L7.5 fiducial fit results smoke preview">
              <div className="maxwell-study-list">
                <div className="compact-stat"><span>Fit model</span><strong>{fiducialFit.model}</strong></div>
                <div className="compact-stat"><span>RMS residual</span><strong>{fiducialFit.fit.metrics.rmsResidualPx.toPrecision(4)} px</strong></div>
                <div className="compact-stat"><span>Max residual</span><strong>{fiducialFit.fit.metrics.maxResidualPx.toPrecision(4)} px</strong></div>
                <div className="compact-stat"><span>Pixel scale</span><strong>{formatNullableMetric(fiducialFit.fit.metrics.meanPixelScaleUmPerPx)} um/px</strong></div>
              </div>
            </div>
          ) : (
            <div className="empty-state" aria-label="L7.5 fiducial fit results smoke preview">Run a fiducial fit to feed L7.2 similarity or affine calibration evidence.</div>
          )}
          <div className="maxwell-layer-actions">
            <button type="button" onClick={onRejectFiducialMarker}><Trash2 size={15} /><span>Reject Selected Marker</span></button>
            <button type="button" onClick={onAcceptFiducialMarker}><ShieldCheck size={15} /><span>Accept Selected Marker</span></button>
            <button type="button" onClick={onMoveFiducialCorner}><Sparkles size={15} /><span>Move Selected Corner</span></button>
            <button type="button" onClick={onRelabelFiducialMarker}><Plus size={15} /><span>Relabel Selected Marker</span></button>
            <button type="button" onClick={() => onRunFiducialFit("similarity")}><ShieldCheck size={15} /><span>Run Fiducial Similarity Fit</span></button>
            <button type="button" onClick={() => onRunFiducialFit("affine")}><ShieldCheck size={15} /><span>Run Fiducial Affine Fit</span></button>
            <button type="button" onClick={onExportFiducialBundle}><FileDown size={15} /><span>Export Fiducial Bundle</span></button>
            <button type="button" onClick={onAddFiducialToSession}><ShieldCheck size={15} /><span>Add Fiducial Frame to Session QA</span></button>
            <button type="button" onClick={onSaveFiducialStudy}><Save size={15} /><span>Save Fiducial Study</span></button>
          </div>
          <div className="maxwell-data-table maxwell-l75-export-list" aria-label="L7.5 fiducial session handoff smoke preview">
            <div className="compact-stat"><span>Session QA handoff</span><strong>{sessionQa?.frames.some((frame) => frame.type === "fiducial_board") ? "ready" : "pending"}</strong></div>
            {fiducialExportNames.map((name) => <div className="compact-stat" key={name}><span>{name}</span><strong>{fiducialFit ? "ready" : "on fit"}</strong></div>)}
          </div>
        </div>

        <div className="maxwell-workspace-panel">
          <div className="maxwell-section-heading">
            <h2>Geometric Calibration / Distortion Workbench</h2>
            <strong>{importedPointSet ? "CSV points active" : target ? target.kind : "generate or import"}</strong>
          </div>
          <div className="maxwell-study-controls">
            <label className="field-row">
              <span>Target kind</span>
              <select value={targetKind} onChange={(event) => setTargetKind(event.currentTarget.value as L72TargetKind)}>
                <option value="dot-grid">Dot grid</option>
                <option value="checkerboard">Checkerboard</option>
                <option value="line-grid">Line grid</option>
              </select>
            </label>
            <label className="field-row">
              <span>Fit model</span>
              <select value={fitModel} onChange={(event) => setFitModel(event.currentTarget.value as L72FitModel)}>
                <option value="similarity">Similarity</option>
                <option value="affine">Affine</option>
                <option value="radial-k1">Radial k1</option>
                <option value="radial-k1-k2">Radial k1+k2</option>
              </select>
            </label>
            <NumberField label="Width px" value={widthPx} min={80} max={2048} step={1} onChange={(value) => setWidthPx(Math.round(clamp(value, 80, 2048)))} />
            <NumberField label="Height px" value={heightPx} min={80} max={2048} step={1} onChange={(value) => setHeightPx(Math.round(clamp(value, 80, 2048)))} />
            <NumberField label="Rows" value={rows} min={3} max={32} step={1} onChange={(value) => setRows(Math.round(clamp(value, 3, 32)))} />
            <NumberField label="Columns" value={columns} min={3} max={32} step={1} onChange={(value) => setColumns(Math.round(clamp(value, 3, 32)))} />
            <NumberField label="Spacing um" value={spacingUm} min={1} max={5000} step={1} onChange={setSpacingUm} />
            <NumberField label="Pixel pitch um" value={pixelPitchUm} min={0.01} max={1000} step={0.01} onChange={setPixelPitchUm} />
            <NumberField label="Rotation deg" value={rotationDeg} min={-45} max={45} step={0.1} onChange={setRotationDeg} />
            <NumberField label="Radial k1" value={radialK1} min={-0.5} max={0.5} step={0.005} onChange={setRadialK1} />
            <NumberField label="Radial k2" value={radialK2} min={-0.5} max={0.5} step={0.005} onChange={setRadialK2} />
          </div>
          <label className="maxwell-measured-textarea-label">
            <span>Point CSV import</span>
            <textarea
              className="maxwell-measured-textarea maxwell-l72-textarea"
              value={pointCsvText}
              onChange={(event) => setPointCsvText(event.currentTarget.value)}
              placeholder="id,x_px,y_px,x_world_um,y_world_um,row,col&#10;p-0-0,120,90,-200,-150,0,0"
            />
          </label>
          <div className="maxwell-layer-actions">
            <button type="button" onClick={onGenerateTarget}><Sparkles size={15} /><span>Generate Dot/Grid Target</span></button>
            <button type="button" onClick={onImportCsv}><Upload size={15} /><span>Import Point CSV</span></button>
            <label className="maxwell-file-action">
              <Upload size={15} />
              <span>Import Point File</span>
              <input type="file" accept=".csv,text/csv,text/plain" onChange={(event) => void onImportFile(event.currentTarget.files?.[0] ?? null)} />
            </label>
          </div>
          <div
            className={`maxwell-l72-target-preview maxwell-l72-target-preview-${targetKind}`}
            aria-label="L7.2 generated geometric target smoke preview"
            style={{ aspectRatio: `${Math.max(1, activeWidthPx)} / ${Math.max(1, activeHeightPx)}` }}
          >
            {previewPoints.length ? (
              previewPoints.map((point) => (
                <i
                  key={point.id}
                  title={`${point.id}: ${formatNullableMetric(point.xPx)} px, ${formatNullableMetric(point.yPx)} px`}
                  style={{
                    left: `${clamp((point.xPx / Math.max(1, activeWidthPx)) * 100, 0, 100)}%`,
                    top: `${clamp((point.yPx / Math.max(1, activeHeightPx)) * 100, 0, 100)}%`
                  }}
                />
              ))
            ) : (
              <span>Generate or import points to preview the calibration target.</span>
            )}
          </div>
        </div>

        <div className="maxwell-workspace-panel">
          <div className="maxwell-section-heading">
            <h2>Measured Image Detection</h2>
            <strong>{targetImage ? `${targetImage.widthPx} x ${targetImage.heightPx}` : "no image"}</strong>
          </div>
          <div className="l2-disclosure">
            <strong>ROI-limited dot-grid detection with human-correctable points.</strong>
            <span>Checkerboard automatic detection is scaffold-only; AprilTag/ArUco fiducials are not implemented in L7.3.</span>
          </div>
          <div className="maxwell-study-controls">
            <NumberField label="ROI x" value={roiXPx} min={0} max={imageWidthPx} step={1} onChange={(value) => setRoiXPx(Math.round(clamp(value, 0, imageWidthPx)))} />
            <NumberField label="ROI y" value={roiYPx} min={0} max={imageHeightPx} step={1} onChange={(value) => setRoiYPx(Math.round(clamp(value, 0, imageHeightPx)))} />
            <NumberField label="ROI width" value={roiWidthPx} min={1} max={imageWidthPx} step={1} onChange={(value) => setRoiWidthPx(Math.round(clamp(value, 1, imageWidthPx)))} />
            <NumberField label="ROI height" value={roiHeightPx} min={1} max={imageHeightPx} step={1} onChange={(value) => setRoiHeightPx(Math.round(clamp(value, 1, imageHeightPx)))} />
            <label className="field-row">
              <span>Threshold mode</span>
              <select value={thresholdMode} onChange={(event) => setThresholdMode(event.currentTarget.value as L73ThresholdMode)}>
                <option value="auto">Auto</option>
                <option value="manual">Manual</option>
              </select>
            </label>
            <label className="field-row">
              <span>Polarity</span>
              <select value={polarity} onChange={(event) => setPolarity(event.currentTarget.value as L73DotPolarity)}>
                <option value="auto">Auto</option>
                <option value="dark-on-light">Dark dots on light</option>
                <option value="light-on-dark">Light dots on dark</option>
              </select>
            </label>
            <NumberField label="Threshold" value={threshold} min={0} max={1} step={0.01} onChange={setThreshold} />
            <NumberField label="Min blob area" value={minBlobAreaPx} min={1} max={5000} step={1} onChange={setMinBlobAreaPx} />
            <NumberField label="Max blob area" value={maxBlobAreaPx} min={1} max={20000} step={1} onChange={setMaxBlobAreaPx} />
            <NumberField label="Max missing" value={maxMissingPoints} min={0} max={200} step={1} onChange={(value) => setMaxMissingPoints(Math.round(clamp(value, 0, 200)))} />
            <NumberField label="Outlier px" value={outlierResidualWarnPx} min={0.1} max={100} step={0.1} onChange={setOutlierResidualWarnPx} />
          </div>
          <div className="maxwell-layer-actions">
            <button type="button" onClick={onUseGeneratedTargetAsImage}><Sparkles size={15} /><span>Use Target As Measured Image</span></button>
            <label className="maxwell-file-action">
              <Upload size={15} />
              <span>Import Target Image</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void onImportTargetImage(event.currentTarget.files?.[0] ?? null)} />
            </label>
            <button type="button" onClick={onAutoDetect}><ShieldCheck size={15} /><span>Auto Detect</span></button>
            <button type="button" onClick={onClearDetection}><Trash2 size={15} /><span>Clear Detection</span></button>
          </div>
          <div
            className="maxwell-l73-image-preview"
            aria-label="L7.3 target image ROI smoke preview"
            style={{ aspectRatio: `${Math.max(1, imageWidthPx)} / ${Math.max(1, imageHeightPx)}` }}
          >
            {targetImagePreview && (
              <span
                className="maxwell-l73-image-raster"
                aria-hidden="true"
                style={{ gridTemplateColumns: `repeat(${targetImagePreview.columns}, minmax(0, 1fr))` }}
              >
                {targetImagePreview.cells.map((cell) => (
                  <b key={cell.id} style={{ backgroundColor: `rgb(${cell.shade}, ${cell.shade}, ${cell.shade})` }} />
                ))}
              </span>
            )}
            <span className="maxwell-l73-roi" style={{ left: `${roiLeft}%`, top: `${roiTop}%`, width: `${roiWidth}%`, height: `${roiHeight}%` }} />
            {detectionPoints.map((point) => (
              <i
                key={`${point.id}-${point.status}`}
                className={point.status === "rejected" ? "rejected" : point.id === selectedPointId ? "selected" : undefined}
                title={`${point.id}: ${point.status}`}
                style={{
                  left: `${clamp((point.xPx / Math.max(1, imageWidthPx)) * 100, 0, 100)}%`,
                  top: `${clamp((point.yPx / Math.max(1, imageHeightPx)) * 100, 0, 100)}%`
                }}
              >
                {showDetectionLabels ? `${point.row ?? "?"},${point.col ?? "?"}` : ""}
              </i>
            ))}
            {!targetImage && <em>Use the generated target or import an image to enable ROI detection.</em>}
          </div>
        </div>

        <div className="maxwell-workspace-panel">
          <div className="maxwell-section-heading">
            <h2>Detection Confidence Report</h2>
            <strong>{detection ? `${detection.acceptedPointCount}/${detection.expectedPointCount}` : "pending"}</strong>
          </div>
          <label className="maxwell-material-check">
            <input type="checkbox" checked={showDetectionLabels} onChange={(event) => setShowDetectionLabels(event.currentTarget.checked)} />
            <span>Point labels</span>
            <strong>row,col</strong>
          </label>
          {detection ? (
            <div className="maxwell-data-table" aria-label="L7.3 detection confidence report smoke preview">
              <div className="maxwell-study-list">
                <div className="compact-stat"><span>Expected points</span><strong>{detection.expectedPointCount}</strong></div>
                <div className="compact-stat"><span>Detected points</span><strong>{detection.detectedPointCount}</strong></div>
                <div className="compact-stat"><span>Accepted / rejected</span><strong>{detection.acceptedPointCount} / {detection.rejectedPointCount}</strong></div>
                <div className="compact-stat"><span>Coverage score</span><strong>{detection.coverageScore.toPrecision(4)}</strong></div>
                <div className="compact-stat"><span>Grid match RMS</span><strong>{formatNullableMetric(detection.gridMatchRmsPx)} px</strong></div>
                <div className="compact-stat"><span>Fit RMS / max</span><strong>{formatNullableMetric(detection.fitRmsPx)} / {formatNullableMetric(detection.fitMaxPx)} px</strong></div>
                <div className="compact-stat"><span>Image hash</span><strong>{detection.imageHash.slice(0, 10)}</strong></div>
              </div>
              {detection.warnings.slice(0, 5).map((warning) => <div className="error-banner" key={`${warning.code}-${warning.message}`}>{warning.message}</div>)}
            </div>
          ) : (
            <div className="empty-state">Run dot-grid Auto Detect to produce point counts, coverage, residual confidence, and warnings.</div>
          )}
          <div className="maxwell-study-controls">
            <label className="field-row">
              <span>Selected point</span>
              <select value={selectedPoint?.id ?? ""} onChange={(event) => setSelectedPointId(event.currentTarget.value)}>
                <option value="">none</option>
                {detectionPoints.slice(0, 160).map((point) => (
                  <option key={point.id} value={point.id}>{point.id} {point.status}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="maxwell-layer-actions">
            <button type="button" onClick={onMoveSelectedPoint}><Sparkles size={15} /><span>Move Selected Point</span></button>
            <button type="button" onClick={onRejectSelectedPoint}><Trash2 size={15} /><span>Reject Selected Point</span></button>
            <button type="button" onClick={onAcceptSelectedPoint}><ShieldCheck size={15} /><span>Accept Selected Point</span></button>
            <button type="button" onClick={onAddPoint}><Plus size={15} /><span>Add Point</span></button>
            <button type="button" onClick={onDeleteSelectedPoint}><Trash2 size={15} /><span>Delete Selected Point</span></button>
            <button type="button" onClick={() => onRunDetectionFit("similarity")}><ShieldCheck size={15} /><span>Run Geometry Fit</span></button>
            <button type="button" onClick={onExportDetection}><FileDown size={15} /><span>Export Detection Report</span></button>
            <button type="button" onClick={onSaveDetectionStudy}><Save size={15} /><span>Save Detection Study</span></button>
          </div>
        </div>

        <div className="maxwell-workspace-panel">
          <div className="maxwell-section-heading">
            <h2>Fit Results</h2>
            <strong className={`maxwell-l72-status maxwell-l72-status-${fit?.status ?? "pending"}`}>{statusLabel}</strong>
          </div>
          <div className="maxwell-layer-actions">
            <button type="button" onClick={() => onRunFit("similarity")}><ShieldCheck size={15} /><span>Run Similarity Fit</span></button>
            <button type="button" onClick={() => onRunFit("affine")}><ShieldCheck size={15} /><span>Run Affine Fit</span></button>
            <button type="button" onClick={() => onRunFit("radial-k1")}><ShieldCheck size={15} /><span>Run Radial Fit</span></button>
            <button type="button" onClick={() => onRunFit(fitModel)}><Sparkles size={15} /><span>Run Selected Fit</span></button>
          </div>
          {fit ? (
            <div className="maxwell-data-table" aria-label="L7.2 geometric fit results smoke preview">
              <div className="maxwell-study-list">
                <div className="compact-stat"><span>Pixel scale</span><strong>{formatNullableMetric(fit.metrics.meanPixelScaleUmPerPx)} um/px</strong></div>
                <div className="compact-stat"><span>Rotation</span><strong>{formatNullableMetric(fit.metrics.rotationDeg)} deg</strong></div>
                <div className="compact-stat"><span>Shear</span><strong>{formatNullableMetric(fit.metrics.shear)}</strong></div>
                <div className="compact-stat"><span>RMS residual</span><strong>{fit.metrics.rmsResidualPx.toPrecision(4)} px</strong></div>
                <div className="compact-stat"><span>Max residual</span><strong>{fit.metrics.maxResidualPx.toPrecision(4)} px</strong></div>
                <div className="compact-stat"><span>Radial k1</span><strong>{formatNullableMetric(fit.radial.k1)}</strong></div>
                <div className="compact-stat"><span>Radial k2</span><strong>{formatNullableMetric(fit.radial.k2)}</strong></div>
                <div className="compact-stat"><span>Field distortion</span><strong>{formatNullableMetric(fit.metrics.fieldDistortionPercent)}%</strong></div>
              </div>
              {fit.issues.length ? fit.issues.slice(0, 5).map((issue) => <div className="error-banner" key={issue.code}>{issue.severity.toUpperCase()}: {issue.message}</div>) : <div className="empty-state">Fit is within the configured diagnostic residual thresholds.</div>}
            </div>
          ) : (
            <div className="empty-state">Run a similarity, affine, or radial fit after generating/importing points.</div>
          )}
        </div>

        <div className="maxwell-workspace-panel">
          <div className="maxwell-section-heading">
            <h2>Residual vector map</h2>
            <strong>{fit ? `${fit.residuals.length} vectors` : "pending"}</strong>
          </div>
          {fit ? (
            <div className="maxwell-l72-vector-map" aria-label="L7.2 distortion vector map smoke preview">
              {fit.residuals.slice(0, 160).map((row) => (
                <span
                  key={row.pointId}
                  title={`${row.pointId}: ${row.residualPx.toPrecision(4)} px residual`}
                  style={{
                    left: `${clamp((row.measuredXPx / Math.max(1, activeWidthPx)) * 100, 0, 100)}%`,
                    top: `${clamp((row.measuredYPx / Math.max(1, activeHeightPx)) * 100, 0, 100)}%`,
                    width: `${Math.max(9, 9 + (row.residualPx / residualPeak) * 24)}px`,
                    transform: `translate(-50%, -50%) rotate(${Math.atan2(row.dyPx, row.dxPx) * 180 / Math.PI}deg)`,
                    opacity: 0.35 + 0.65 * (row.residualPx / residualPeak)
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">Residual vectors appear here after a fit.</div>
          )}
          {fit && (
            <div className="maxwell-l72-heatmap" aria-label="L7.2 residual heatmap smoke preview">
              {fit.residuals.slice(0, 80).map((row) => (
                <i
                  key={`${row.pointId}-heat`}
                  title={`${row.region}: ${row.residualPx.toPrecision(4)} px`}
                  style={{ opacity: 0.2 + 0.8 * (row.residualPx / residualPeak) }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="maxwell-workspace-panel">
          <div className="maxwell-section-heading">
            <h2>Corrected / undistorted points</h2>
            <strong>{fit ? `${fit.correctedPoints.length} corrected` : "pending"}</strong>
          </div>
          {fit ? (
            <div className="maxwell-l72-corrected-table" aria-label="L7.2 undistort preview smoke table">
              <div><strong>id</strong><strong>x px</strong><strong>y px</strong><strong>ideal x</strong><strong>ideal y</strong></div>
              {correctedPreview.map((point) => (
                <div key={point.id}>
                  <span>{point.id}</span>
                  <span>{point.xPx.toPrecision(4)}</span>
                  <span>{point.yPx.toPrecision(4)}</span>
                  <span>{formatNullableMetric(point.idealXPx ?? null)}</span>
                  <span>{formatNullableMetric(point.idealYPx ?? null)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">The diagnostic correction preview will list fitted undistorted point coordinates after a radial or affine fit.</div>
          )}
          <div className="maxwell-layer-actions">
            <button type="button" onClick={() => onCompare()}><ShieldCheck size={15} /><span>Compare Geometry</span></button>
            <button type="button" onClick={onExport}><FileDown size={15} /><span>Export Geometric Bundle</span></button>
            <button type="button" onClick={onSave}><Save size={15} /><span>Save Geometric Study</span></button>
          </div>
          {comparison ? (
            <div className="maxwell-data-table" aria-label="L7.2 measured vs simulated geometry comparison smoke preview">
              <div className="maxwell-study-list">
                <div className="compact-stat"><span>Matched points</span><strong>{comparison.matchedPointCount}</strong></div>
                <div className="compact-stat"><span>RMS residual delta</span><strong>{formatNullableMetric(comparison.rmsResidualDeltaPx)} px</strong></div>
                <div className="compact-stat"><span>Max residual delta</span><strong>{formatNullableMetric(comparison.maxResidualDeltaPx)} px</strong></div>
              </div>
              {comparison.metricDeltas.slice(0, 4).map((row) => (
                <div className="compact-stat" key={row.id}><span>{row.label}</span><strong>{formatNullableMetric(row.delta)}</strong></div>
              ))}
            </div>
          ) : (
            <div className="empty-state">Compare measured-vs-simulated geometry after at least one fit.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function FocusFieldMtfQualificationPanel({
  focusStartMm,
  setFocusStartMm,
  focusStopMm,
  setFocusStopMm,
  focusSamples,
  setFocusSamples,
  bestFocusMm,
  setBestFocusMm,
  defocusBlurPerMm,
  setDefocusBlurPerMm,
  focusMetric,
  setFocusMetric,
  focusThreshold,
  setFocusThreshold,
  fieldLayout,
  setFieldLayout,
  centerMtf50Min,
  setCenterMtf50Min,
  cornerMtf50Min,
  setCornerMtf50Min,
  nyquistMtfMin,
  setNyquistMtfMin,
  depthOfFocusMinMm,
  setDepthOfFocusMinMm,
  disallowWarnings,
  setDisallowWarnings,
  focusSweep,
  fieldMap,
  qualification,
  comparison,
  onRunFocusSweep,
  onImportCurrentMtf,
  onRunFieldMap,
  onRunQualification,
  onCompare,
  onExport,
  onSave
}: {
  focusStartMm: number;
  setFocusStartMm: (value: number) => void;
  focusStopMm: number;
  setFocusStopMm: (value: number) => void;
  focusSamples: number;
  setFocusSamples: (value: number) => void;
  bestFocusMm: number;
  setBestFocusMm: (value: number) => void;
  defocusBlurPerMm: number;
  setDefocusBlurPerMm: (value: number) => void;
  focusMetric: L71FocusMetric;
  setFocusMetric: (value: L71FocusMetric) => void;
  focusThreshold: number;
  setFocusThreshold: (value: number) => void;
  fieldLayout: L71FieldLayout;
  setFieldLayout: (value: L71FieldLayout) => void;
  centerMtf50Min: number;
  setCenterMtf50Min: (value: number) => void;
  cornerMtf50Min: number;
  setCornerMtf50Min: (value: number) => void;
  nyquistMtfMin: number;
  setNyquistMtfMin: (value: number) => void;
  depthOfFocusMinMm: number;
  setDepthOfFocusMinMm: (value: number) => void;
  disallowWarnings: boolean;
  setDisallowWarnings: (value: boolean) => void;
  focusSweep: L71FocusSweepResult | null;
  fieldMap: L71FieldMtfMapResult | null;
  qualification: L71QualificationResult | null;
  comparison: L71FocusFieldComparisonResult | null;
  onRunFocusSweep: () => void;
  onImportCurrentMtf: () => void;
  onRunFieldMap: () => void;
  onRunQualification: () => void;
  onCompare: () => void;
  onExport: () => void;
  onSave: () => void;
}) {
  const focusPeak = Math.max(1e-9, ...(focusSweep?.rows.map((row) => row.selectedMetricValue ?? 0) ?? [1]));
  const fieldPeak = Math.max(1e-9, ...(fieldMap?.rows.map((row) => row.mtf50CyclesPerPx ?? 0) ?? [1]));
  const statusLabel = qualification?.status.toUpperCase() ?? "PENDING";

  return (
    <div className="maxwell-study-card maxwell-l71-panel" aria-label="L7.1 Focus + Field MTF Qualification Workbench">
      <div className="maxwell-section-heading">
        <h2>L7.1 Focus + Field MTF Qualification Workbench</h2>
        <strong>{qualification ? statusLabel : focusSweep || fieldMap ? "ready to qualify" : "not run"}</strong>
      </div>
      <div className="l2-disclosure">
        <strong>Run synthetic or current-frame focus MTF sweeps, map field ROIs, apply diagnostic thresholds, and compare measured vs simulated focus/field residuals.</strong>
        <span>Diagnostic thresholding only; this is not ISO 12233 certification, Imatest-equivalent testing, calibrated optical model fitting, pure lens-only MTF certification, sensor-stack EM, or 3D Maxwell/FDTD/FEM/BEM/RCWA execution.</span>
      </div>

      <div className="maxwell-workspace-grid">
        <div className="maxwell-workspace-panel">
          <div className="maxwell-section-heading">
            <h2>Focus Sweep</h2>
            <strong>{focusSweep ? `Best focus ${formatNullableMetric(focusSweep.bestFocus.focusZMm)} mm` : `${focusSamples} samples`}</strong>
          </div>
          <div className="maxwell-study-controls">
            <NumberField label="Start focus" value={focusStartMm} unit="mm" min={-10} max={10} step={0.01} onChange={setFocusStartMm} />
            <NumberField label="Stop focus" value={focusStopMm} unit="mm" min={-10} max={10} step={0.01} onChange={setFocusStopMm} />
            <NumberField label="Samples" value={focusSamples} min={1} max={41} step={1} onChange={(value) => setFocusSamples(Math.round(clamp(value, 1, 41)))} />
            <NumberField label="Nominal best" value={bestFocusMm} unit="mm" min={-10} max={10} step={0.01} onChange={setBestFocusMm} />
            <NumberField label="Defocus blur" value={defocusBlurPerMm} unit="sigma/mm" min={0} max={200} step={0.5} onChange={setDefocusBlurPerMm} />
            <NumberField label="Focus threshold" value={focusThreshold} min={0} max={1} step={0.005} onChange={setFocusThreshold} />
            <label className="field-row">
              <span>Focus metric</span>
              <select value={focusMetric} onChange={(event) => setFocusMetric(event.currentTarget.value as L71FocusMetric)}>
                <option value="mtf50">MTF50</option>
                <option value="mtf10">MTF10</option>
                <option value="nyquist">Nyquist MTF</option>
                <option value="mtf-area">MTF area</option>
              </select>
            </label>
          </div>
          <div className="maxwell-layer-actions">
            <button type="button" onClick={onRunFocusSweep}><Sparkles size={15} /><span>Run Focus Sweep</span></button>
            <button type="button" onClick={onImportCurrentMtf}><Upload size={15} /><span>Import Current MTF Into Sweep</span></button>
          </div>
          {focusSweep ? (
            <div className="maxwell-data-table">
              <div className="maxwell-study-list">
                <div className="compact-stat"><span>MTF50 vs focus</span><strong>{focusSweep.rows.length} rows</strong></div>
                <div className="compact-stat"><span>Best focus</span><strong>{formatNullableMetric(focusSweep.bestFocus.focusZMm)} mm</strong></div>
                <div className="compact-stat"><span>Depth of focus</span><strong>{focusSweep.depthOfFocus.rangeMm.toPrecision(4)} mm</strong></div>
              </div>
              <div className="maxwell-l71-focus-bars" aria-label="L7.1 MTF50 vs focus smoke preview">
                {focusSweep.rows.map((row) => (
                  <i key={`${row.index}-${row.focusZMm}`} style={{ height: `${Math.max(2, ((row.selectedMetricValue ?? 0) / focusPeak) * 100)}%` }} title={`${row.focusZMm} mm ${formatNullableMetric(row.selectedMetricValue)}`} />
                ))}
              </div>
              {focusSweep.warnings.map((warning) => <div className="error-banner" key={`${warning.code}-${warning.message}`}>{warning.message}</div>)}
            </div>
          ) : (
            <div className="empty-state">Run a focus sweep to plot MTF50/MTF10/Nyquist/area against focus position.</div>
          )}
        </div>

        <div className="maxwell-workspace-panel">
          <div className="maxwell-section-heading">
            <h2>Field MTF Map</h2>
            <strong>{fieldMap ? `${fieldMap.rows.length} ROIs` : fieldLayout}</strong>
          </div>
          <div className="maxwell-study-controls">
            <label className="field-row">
              <span>ROI layout</span>
              <select value={fieldLayout} onChange={(event) => setFieldLayout(event.currentTarget.value as L71FieldLayout)}>
                <option value="center">Center</option>
                <option value="center-corners">Center + corners</option>
                <option value="grid-3x3">3x3 field</option>
              </select>
            </label>
          </div>
          <div className="maxwell-layer-actions">
            <button type="button" onClick={onRunFieldMap}><Sparkles size={15} /><span>Run Field Map</span></button>
          </div>
          {fieldMap ? (
            <div className="maxwell-data-table">
              <div className="maxwell-study-list">
                <div className="compact-stat"><span>Worst-field ROI</span><strong>{fieldMap.worstRoi?.roi.label ?? "n/a"}</strong></div>
                <div className="compact-stat"><span>Center-corner falloff</span><strong>{formatNullableMetric(fieldMap.centerToCornerFalloff)}</strong></div>
                <div className="compact-stat"><span>Uniformity</span><strong>{formatNullableMetric(fieldMap.fieldUniformityScore)}</strong></div>
              </div>
              <div className="maxwell-l71-field-grid" aria-label="L7.1 field MTF map smoke preview">
                {fieldMap.rows.map((row) => (
                  <span key={row.roi.id} style={{ opacity: 0.2 + 0.8 * ((row.mtf50CyclesPerPx ?? 0) / fieldPeak) }} title={`${row.roi.label}: ${formatNullableMetric(row.mtf50CyclesPerPx)} cyc/px`}>
                    {row.roi.label}
                    <strong>{formatNullableMetric(row.mtf50CyclesPerPx)}</strong>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">Run a center/corner or 3x3 field map to inspect best/worst ROI MTF and falloff.</div>
          )}
        </div>

        <div className="maxwell-workspace-panel">
          <div className="maxwell-section-heading">
            <h2>Qualification Report</h2>
            <strong className={`maxwell-l71-status maxwell-l71-status-${qualification?.status ?? "pending"}`}>{statusLabel}</strong>
          </div>
          <div className="maxwell-study-controls">
            <NumberField label="Center MTF50 min" value={centerMtf50Min} min={0} max={1} step={0.005} onChange={setCenterMtf50Min} />
            <NumberField label="Worst-field MTF50 min" value={cornerMtf50Min} min={0} max={1} step={0.005} onChange={setCornerMtf50Min} />
            <NumberField label="Nyquist MTF min" value={nyquistMtfMin} min={0} max={1} step={0.005} onChange={setNyquistMtfMin} />
            <NumberField label="DOF min" value={depthOfFocusMinMm} unit="mm" min={0} max={10} step={0.01} onChange={setDepthOfFocusMinMm} />
            <label className="maxwell-material-check">
              <input type="checkbox" checked={disallowWarnings} onChange={(event) => setDisallowWarnings(event.currentTarget.checked)} />
              <span>Disallow ROI warnings</span>
              <strong>saturation / contrast / angle</strong>
            </label>
          </div>
          <div className="maxwell-layer-actions">
            <button type="button" onClick={onRunQualification}><ShieldCheck size={15} /><span>Run Qualification</span></button>
            <button type="button" onClick={onExport}><FileDown size={15} /><span>Export Qualification Bundle</span></button>
            <button type="button" onClick={onSave}><Save size={15} /><span>Save Qualification Study</span></button>
          </div>
          {qualification ? (
            <div className="maxwell-data-table" aria-label="L7.1 qualification report smoke preview">
              <div className="compact-stat"><span>Recommendation</span><strong>{qualification.recommendation}</strong></div>
              {qualification.issues.length ? qualification.issues.slice(0, 6).map((issue) => <div className="error-banner" key={`${issue.code}-${issue.roiId ?? "global"}`}>{issue.severity.toUpperCase()}: {issue.message}</div>) : <div className="empty-state">No qualification issues at the configured thresholds.</div>}
            </div>
          ) : (
            <div className="empty-state">Run qualification after focus and field diagnostics to produce PASS, FAIL, or WARNING.</div>
          )}
        </div>

        <div className="maxwell-workspace-panel">
          <div className="maxwell-section-heading">
            <h2>Measured vs Simulated Focus/Field</h2>
            <strong>{comparison ? `Delta ${formatNullableMetric(comparison.bestFocusDeltaMm)} mm` : "not compared"}</strong>
          </div>
          <div className="maxwell-layer-actions">
            <button type="button" onClick={onCompare}><ShieldCheck size={15} /><span>Compare Focus Field MTF</span></button>
          </div>
          {comparison ? (
            <div className="maxwell-data-table" aria-label="L7.1 measured vs simulated MTF smoke preview">
              <div className="maxwell-study-list">
                <div className="compact-stat"><span>Best focus delta</span><strong>{formatNullableMetric(comparison.bestFocusDeltaMm)} mm</strong></div>
                <div className="compact-stat"><span>Focus RMS delta</span><strong>{formatNullableMetric(comparison.focusMetricRmsDelta)}</strong></div>
                <div className="compact-stat"><span>Field RMS delta</span><strong>{formatNullableMetric(comparison.fieldMtf50RmsDelta)}</strong></div>
                <div className="compact-stat"><span>Matched ROIs</span><strong>{comparison.matchedFieldRoiCount}</strong></div>
              </div>
              <div className="maxwell-l71-comparison-bars">
                {comparison.focusRows.map((row) => (
                  <span key={row.focusZMm} title={`${row.focusZMm} mm measured ${formatNullableMetric(row.measured)} simulated ${formatNullableMetric(row.simulated)}`}>
                    <i style={{ height: `${Math.max(2, clamp(row.measured ?? 0, 0, 1) * 100)}%` }} />
                    <b style={{ height: `${Math.max(2, clamp(row.simulated ?? 0, 0, 1) * 100)}%` }} />
                  </span>
                ))}
              </div>
              <div className="empty-state">{comparison.diagnosticFit.note}</div>
            </div>
          ) : (
            <div className="empty-state">Compare current focus/field diagnostics against a deterministic simulated reference.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResolutionMtfWorkbenchPanel({
  mtfWidthPx,
  setMtfWidthPx,
  mtfHeightPx,
  setMtfHeightPx,
  mtfEdgeAngleDeg,
  setMtfEdgeAngleDeg,
  mtfBlurSigmaPx,
  setMtfBlurSigmaPx,
  mtfContrast,
  setMtfContrast,
  mtfOversampling,
  setMtfOversampling,
  mtfPixelPitchUm,
  setMtfPixelPitchUm,
  mtfCsvText,
  setMtfCsvText,
  mtfTarget,
  mtfImportedFrame,
  mtfRun,
  mtfReferenceRun,
  mtfComparison,
  linePairTarget,
  linePairRun,
  onGenerateTarget,
  onImportCsv,
  onImportFile,
  onRunMtf,
  onCompareBlur,
  onGenerateLinePair,
  onSendCameraFrame,
  onExportMtfReport,
  onSaveMtfStudy
}: {
  mtfWidthPx: number;
  setMtfWidthPx: (value: number) => void;
  mtfHeightPx: number;
  setMtfHeightPx: (value: number) => void;
  mtfEdgeAngleDeg: number;
  setMtfEdgeAngleDeg: (value: number) => void;
  mtfBlurSigmaPx: number;
  setMtfBlurSigmaPx: (value: number) => void;
  mtfContrast: number;
  setMtfContrast: (value: number) => void;
  mtfOversampling: number;
  setMtfOversampling: (value: number) => void;
  mtfPixelPitchUm: number;
  setMtfPixelPitchUm: (value: number) => void;
  mtfCsvText: string;
  setMtfCsvText: (value: string) => void;
  mtfTarget: L70ResolutionTargetImage | null;
  mtfImportedFrame: L70ParsedCsvFrame | null;
  mtfRun: SlantedEdgeMtfResult | null;
  mtfReferenceRun: SlantedEdgeMtfResult | null;
  mtfComparison: L70MtfComparisonResult | null;
  linePairTarget: L70ResolutionTargetImage | null;
  linePairRun: L70LinePairAnalysisResult | null;
  onGenerateTarget: () => void;
  onImportCsv: () => void;
  onImportFile: (file: File | null) => void | Promise<void>;
  onRunMtf: () => void;
  onCompareBlur: () => void;
  onGenerateLinePair: () => void;
  onSendCameraFrame: () => void;
  onExportMtfReport: () => void;
  onSaveMtfStudy: () => void;
}) {
  const activeImage = mtfImportedFrame
    ? { widthPx: mtfImportedFrame.widthPx, heightPx: mtfImportedFrame.heightPx, pixels: mtfImportedFrame.pixels, label: "Imported MTF frame" }
    : mtfTarget
      ? { widthPx: mtfTarget.widthPx, heightPx: mtfTarget.heightPx, pixels: mtfTarget.pixels, label: mtfTarget.label }
      : null;
  const preview = activeImage ? sampleImagePreview(activeImage.widthPx, activeImage.heightPx, activeImage.pixels, 32, 12) : [];
  const linePreview = linePairTarget ? sampleImagePreview(linePairTarget.widthPx, linePairTarget.heightPx, linePairTarget.pixels, 32, 10) : [];
  const lsfPeak = mtfRun ? Math.max(1e-9, ...mtfRun.lsf.map((point) => Math.abs(point.value))) : 1;
  const comparisonMtf50Delta = mtfComparison?.metrics.mtf50DeltaCyclesPerPx ?? null;

  return (
    <div className="maxwell-study-card maxwell-mtf-panel" aria-label="L7.0 Slanted-Edge / Resolution Target MTF Workbench">
      <div className="maxwell-section-heading">
        <h2>L7.0 Slanted-Edge / Resolution Target MTF Workbench</h2>
        <strong>{mtfRun ? mtfRun.hashes.resultHash.slice(0, 10) : activeImage ? `${activeImage.widthPx} x ${activeImage.heightPx}` : "not run"}</strong>
      </div>
      <div className="l2-disclosure">
        <strong>Generate/import slanted-edge targets, compute ESF/LSF/SFR-MTF, compare measured vs simulated MTF, and sanity-check line-pair contrast.</strong>
        <span>ISO 12233-inspired diagnostics only; this is not ISO 12233 certification, Imatest-equivalent measurement, lab accreditation, pure lens-only MTF, sensor-stack EM, or 3D Maxwell/FDTD/FEM/BEM/RCWA execution.</span>
      </div>

      <div className="maxwell-workspace-grid">
        <div className="maxwell-workspace-panel">
          <div className="maxwell-section-heading">
            <h2>Target Controls</h2>
            <strong>{activeImage?.label ?? "generated/imported"}</strong>
          </div>
          <div className="maxwell-study-controls">
            <NumberField label="Target width px" value={mtfWidthPx} min={32} max={512} step={1} onChange={setMtfWidthPx} />
            <NumberField label="Target height px" value={mtfHeightPx} min={32} max={512} step={1} onChange={setMtfHeightPx} />
            <NumberField label="Edge angle deg" value={mtfEdgeAngleDeg} min={-20} max={20} step={0.1} onChange={setMtfEdgeAngleDeg} />
            <NumberField label="Blur sigma px" value={mtfBlurSigmaPx} min={0} max={12} step={0.1} onChange={setMtfBlurSigmaPx} />
            <NumberField label="Contrast" value={mtfContrast} min={0} max={1} step={0.01} onChange={setMtfContrast} />
            <NumberField label="Oversampling" value={mtfOversampling} min={2} max={16} step={1} onChange={setMtfOversampling} />
            <NumberField label="Pixel pitch um" value={mtfPixelPitchUm} min={0.01} max={10000} step={0.01} onChange={setMtfPixelPitchUm} />
          </div>
          <label className="maxwell-measured-textarea-label">
            <span>MTF import CSV</span>
            <textarea
              className="maxwell-measured-textarea maxwell-mtf-textarea"
              value={mtfCsvText}
              onChange={(event) => setMtfCsvText(event.currentTarget.value)}
              placeholder="x_px,y_px,dn&#10;0,0,0&#10;1,0,1&#10;0,1,0"
            />
          </label>
          <div className="maxwell-layer-actions">
            <button type="button" onClick={onGenerateTarget}><Sparkles size={15} /><span>Generate Slanted Edge Target</span></button>
            <button type="button" onClick={onImportCsv}><Upload size={15} /><span>Import MTF CSV</span></button>
            <label className="maxwell-file-action">
              <Upload size={15} />
              <span>Import MTF File</span>
              <input type="file" accept=".csv,text/csv" onChange={(event) => void onImportFile(event.currentTarget.files?.[0] ?? null)} />
            </label>
            <button type="button" onClick={onSendCameraFrame}><Sparkles size={15} /><span>Send Camera DN Frame to MTF</span></button>
          </div>
          {activeImage && (
            <div className="maxwell-mtf-image-preview" aria-label="Slanted-edge target smoke preview">
              {preview.map((value, index) => <i key={`${index}-${value}`} style={{ opacity: 0.18 + 0.82 * clamp(value, 0, 1) }} />)}
            </div>
          )}
        </div>

        <div className="maxwell-workspace-panel">
          <div className="maxwell-section-heading">
            <h2>MTF Analysis</h2>
            <strong>{mtfRun ? `${formatNullableMetric(mtfRun.metrics.mtf50CyclesPerPx)} cyc/px MTF50` : "pending"}</strong>
          </div>
          <div className="maxwell-layer-actions">
            <button type="button" onClick={onRunMtf}><Sparkles size={15} /><span>Run Slanted-Edge MTF</span></button>
            <button type="button" onClick={onCompareBlur}><ShieldCheck size={15} /><span>Compare Blur Response</span></button>
            <button type="button" onClick={onGenerateLinePair}><Sparkles size={15} /><span>Generate Line-Pair Target</span></button>
            <button type="button" onClick={onExportMtfReport}><FileDown size={15} /><span>Export MTF Bundle</span></button>
            <button type="button" onClick={onSaveMtfStudy}><Save size={15} /><span>Save MTF Study</span></button>
          </div>
          {mtfRun && (
            <div className="maxwell-data-table">
              <div className="maxwell-study-list">
                <div className="compact-stat"><span>MTF50 / MTF10</span><strong>{formatNullableMetric(mtfRun.metrics.mtf50CyclesPerPx)} / {formatNullableMetric(mtfRun.metrics.mtf10CyclesPerPx)} cyc/px</strong></div>
                <div className="compact-stat"><span>MTF50 / MTF10 lp/mm</span><strong>{formatNullableMetric(mtfRun.metrics.mtf50LpPerMm)} / {formatNullableMetric(mtfRun.metrics.mtf10LpPerMm)}</strong></div>
                <div className="compact-stat"><span>Nyquist</span><strong>{formatNullableMetric(mtfRun.metrics.mtfAtNyquist)} @ 0.5 cyc/px</strong></div>
                <div className="compact-stat"><span>Edge angle / contrast</span><strong>{mtfRun.metrics.edgeAngleDeg.toPrecision(4)} deg / {mtfRun.metrics.edgeContrast.toPrecision(4)}</strong></div>
              </div>
              <div className="maxwell-mtf-preview-grid">
                <div className="maxwell-mtf-bars" aria-label="ESF smoke preview">
                  {mtfRun.esf.slice(0, 80).map((point, index) => <i key={`${point.distancePx}-${index}`} style={{ height: `${Math.max(2, clamp(point.value, 0, 1) * 100)}%` }} title={`ESF ${point.value.toPrecision(4)}`} />)}
                </div>
                <div className="maxwell-mtf-bars" aria-label="LSF smoke preview">
                  {mtfRun.lsf.slice(0, 80).map((point, index) => <i key={`${point.distancePx}-${index}`} style={{ height: `${Math.max(2, (Math.abs(point.value) / lsfPeak) * 100)}%` }} title={`LSF ${point.value.toPrecision(4)}`} />)}
                </div>
                <div className="maxwell-mtf-bars" aria-label="MTF curve smoke preview">
                  {mtfRun.mtf.slice(0, 80).map((point, index) => <i key={`${point.frequencyCyclesPerPx}-${index}`} style={{ height: `${Math.max(2, clamp(point.mtf, 0, 1) * 100)}%` }} title={`${point.frequencyCyclesPerPx.toPrecision(4)} cyc/px MTF ${point.mtf.toPrecision(4)}`} />)}
                </div>
              </div>
              {mtfRun.warnings.map((warning) => <div className="error-banner" key={`${warning.code}-${warning.message}`}>{warning.message}</div>)}
            </div>
          )}
        </div>

        <div className="maxwell-workspace-panel">
          <div className="maxwell-section-heading">
            <h2>Measured vs Simulated MTF</h2>
            <strong>{mtfComparison ? `RMS ${mtfComparison.metrics.rmsDelta.toPrecision(4)}` : mtfReferenceRun ? mtfReferenceRun.hashes.resultHash.slice(0, 10) : "not compared"}</strong>
          </div>
          {mtfComparison ? (
            <div className="maxwell-data-table">
              <div className="maxwell-study-list">
                <div className="compact-stat"><span>MTF50 delta</span><strong>{formatNullableMetric(comparisonMtf50Delta)} cyc/px</strong></div>
                <div className="compact-stat"><span>Nyquist delta</span><strong>{formatNullableMetric(mtfComparison.metrics.nyquistDelta)}</strong></div>
                <div className="compact-stat"><span>RMS / max delta</span><strong>{mtfComparison.metrics.rmsDelta.toPrecision(4)} / {mtfComparison.metrics.maxAbsDelta.toPrecision(4)}</strong></div>
              </div>
              <div className="maxwell-mtf-comparison-bars" aria-label="MTF blur comparison smoke preview">
                {mtfComparison.points.slice(0, 72).map((point, index) => (
                  <span key={`${point.frequencyCyclesPerPx}-${index}`} title={`measured=${point.measuredMtf.toPrecision(4)} simulated=${point.simulatedMtf.toPrecision(4)}`}>
                    <i style={{ height: `${Math.max(2, clamp(point.measuredMtf, 0, 1) * 100)}%` }} />
                    <b style={{ height: `${Math.max(2, clamp(point.simulatedMtf, 0, 1) * 100)}%` }} />
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">Run MTF, then compare against a blurrier generated reference.</div>
          )}
        </div>

        <div className="maxwell-workspace-panel">
          <div className="maxwell-section-heading">
            <h2>Line-Pair Target</h2>
            <strong>{linePairRun ? `${linePairRun.rows.length} bands` : "not generated"}</strong>
          </div>
          {linePairTarget && (
            <div className="maxwell-mtf-image-preview maxwell-line-pair-preview" aria-label="Line-pair target smoke preview">
              {linePreview.map((value, index) => <i key={`${index}-${value}`} style={{ opacity: 0.18 + 0.82 * clamp(value, 0, 1) }} />)}
            </div>
          )}
          {linePairRun ? (
            <div className="maxwell-data-table">
              {linePairRun.rows.map((row) => (
                <div className="compact-stat" key={row.frequencyCyclesPerPx}>
                  <span>{row.frequencyCyclesPerPx.toPrecision(3)} cyc/px{row.frequencyLpPerMm === null ? "" : ` / ${row.frequencyLpPerMm.toPrecision(4)} lp/mm`}</span>
                  <strong>contrast {row.contrastMichelson.toPrecision(4)}</strong>
                </div>
              ))}
              {linePairRun.warnings.map((warning) => <div className="error-banner" key={`${warning.code}-${warning.message}`}>{warning.message}</div>)}
            </div>
          ) : (
            <div className="empty-state">Generate a line-pair target to compare band contrast across spatial frequencies.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function sampleImagePreview(widthPx: number, heightPx: number, pixels: ArrayLike<number>, columns: number, rows: number): number[] {
  const output: number[] = [];
  for (let row = 0; row < rows; row += 1) {
    const y = Math.min(heightPx - 1, Math.floor(((row + 0.5) * heightPx) / rows));
    for (let column = 0; column < columns; column += 1) {
      const x = Math.min(widthPx - 1, Math.floor(((column + 0.5) * widthPx) / columns));
      output.push(Number(pixels[y * widthPx + x] ?? 0));
    }
  }
  return output;
}

function PracticalStudyWorkspacePanel({
  capabilities,
  studyName,
  setStudyName,
  savedStudies,
  selectedStudyId,
  setSelectedStudyId,
  studyStatus,
  onSaveValidation,
  onSaveCoating,
  onLoadStudy,
  onDuplicateStudy,
  onDeleteStudy,
  onExportBundle,
  onImportBundle,
  onCopyShareableUrl,
  sweepFamily,
  setSweepFamily,
  sweepStart,
  setSweepStart,
  sweepStop,
  setSweepStop,
  sweepCount,
  setSweepCount,
  sweepResult,
  onRunSweep,
  onExportSweepJson,
  onExportSweepMarkdown,
  onExportSweepCsv,
  markers,
  onPinCenter,
  onPinPeak,
  onPinMinimum,
  onClearMarkers,
  markerDistanceM,
  onExportProfileCsv,
  studyRuns,
  comparisonAId,
  setComparisonAId,
  comparisonBId,
  setComparisonBId,
  comparison,
  onCompareGamma,
  onCompareSelected,
  onExportComparisonMarkdown,
  onExportComparisonCsv,
  measuredCsvText,
  setMeasuredCsvText,
  measuredPixelSizeUm,
  setMeasuredPixelSizeUm,
  measuredOffsetUm,
  setMeasuredOffsetUm,
  measuredRoiMinMm,
  setMeasuredRoiMinMm,
  measuredRoiMaxMm,
  setMeasuredRoiMaxMm,
  measuredSimulatedStudyId,
  setMeasuredSimulatedStudyId,
  measuredDataset,
  measuredComparison,
  measuredFit,
  onGenerateSyntheticMeasuredCsv,
  onImportMeasuredCsv,
  onImportMeasuredFile,
  onCompareMeasured,
  onRunMeasuredFit,
  onSaveMeasuredComparison,
  onExportMeasuredComparison,
  cameraSimulatedStudyId,
  setCameraSimulatedStudyId,
  cameraPixelPitchUm,
  setCameraPixelPitchUm,
  cameraWidthPx,
  setCameraWidthPx,
  cameraHeightPx,
  setCameraHeightPx,
  cameraQuantumEfficiency,
  setCameraQuantumEfficiency,
  cameraExposureMs,
  setCameraExposureMs,
  cameraPhotonFluxScale,
  setCameraPhotonFluxScale,
  cameraFullWellElectrons,
  setCameraFullWellElectrons,
  cameraReadNoiseElectrons,
  setCameraReadNoiseElectrons,
  cameraDarkCurrentElectrons,
  setCameraDarkCurrentElectrons,
  cameraBitDepth,
  setCameraBitDepth,
  cameraGainDnPerElectron,
  setCameraGainDnPerElectron,
  cameraBlackLevelDn,
  setCameraBlackLevelDn,
  cameraSeed,
  setCameraSeed,
  cameraNoiseMode,
  setCameraNoiseMode,
  cameraRun,
  cameraCalibrationCsvText,
  setCameraCalibrationCsvText,
  cameraCalibrationDataset,
  cameraCalibrationRun,
  onLoadCalibrationExample,
  onImportCameraCalibrationCsv,
  onImportCameraCalibrationFile,
  onRunCameraCalibrationFit,
  onApplyCalibratedCameraProfile,
  onSaveCameraCalibrationStudy,
  onExportCameraCalibrationReport,
  onGenerateCameraRun,
  onSaturateCameraExposure,
  onExportCameraReport,
  onSendCameraToMeasured,
  onSaveCameraStudy
}: {
  capabilities: StudyCapability[];
  studyName: string;
  setStudyName: (value: string) => void;
  savedStudies: StudySnapshot[];
  selectedStudyId: string;
  setSelectedStudyId: (value: string) => void;
  studyStatus: string;
  onSaveValidation: () => void;
  onSaveCoating: () => void;
  onLoadStudy: () => void;
  onDuplicateStudy: () => void;
  onDeleteStudy: () => void;
  onExportBundle: () => void;
  onImportBundle: (file: File | null) => void | Promise<void>;
  onCopyShareableUrl: () => void | Promise<void>;
  sweepFamily: PracticalSweepFamily;
  setSweepFamily: (value: PracticalSweepFamily) => void;
  sweepStart: number;
  setSweepStart: (value: number) => void;
  sweepStop: number;
  setSweepStop: (value: number) => void;
  sweepCount: number;
  setSweepCount: (value: number) => void;
  sweepResult: PracticalSweepResult | null;
  onRunSweep: () => void;
  onExportSweepJson: () => void;
  onExportSweepMarkdown: () => void;
  onExportSweepCsv: () => void;
  markers: FieldMarker[];
  onPinCenter: () => void;
  onPinPeak: () => void;
  onPinMinimum: () => void;
  onClearMarkers: () => void;
  markerDistanceM: number | null;
  onExportProfileCsv: () => void;
  studyRuns: StudyRunSummary[];
  comparisonAId: string;
  setComparisonAId: (value: string) => void;
  comparisonBId: string;
  setComparisonBId: (value: string) => void;
  comparison: StudyComparisonResult | null;
  onCompareGamma: () => void;
  onCompareSelected: () => void;
  onExportComparisonMarkdown: () => void;
  onExportComparisonCsv: () => void;
  measuredCsvText: string;
  setMeasuredCsvText: (value: string) => void;
  measuredPixelSizeUm: number;
  setMeasuredPixelSizeUm: (value: number) => void;
  measuredOffsetUm: number;
  setMeasuredOffsetUm: (value: number) => void;
  measuredRoiMinMm: number;
  setMeasuredRoiMinMm: (value: number) => void;
  measuredRoiMaxMm: number;
  setMeasuredRoiMaxMm: (value: number) => void;
  measuredSimulatedStudyId: string;
  setMeasuredSimulatedStudyId: (value: string) => void;
  measuredDataset: L67MeasuredDataset | null;
  measuredComparison: L67MeasuredComparisonResult | null;
  measuredFit: L67DiagnosticFitResult | null;
  onGenerateSyntheticMeasuredCsv: () => void;
  onImportMeasuredCsv: () => void;
  onImportMeasuredFile: (file: File | null) => void | Promise<void>;
  onCompareMeasured: () => void;
  onRunMeasuredFit: () => void;
  onSaveMeasuredComparison: () => void;
  onExportMeasuredComparison: () => void;
  cameraSimulatedStudyId: string;
  setCameraSimulatedStudyId: (value: string) => void;
  cameraPixelPitchUm: number;
  setCameraPixelPitchUm: (value: number) => void;
  cameraWidthPx: number;
  setCameraWidthPx: (value: number) => void;
  cameraHeightPx: number;
  setCameraHeightPx: (value: number) => void;
  cameraQuantumEfficiency: number;
  setCameraQuantumEfficiency: (value: number) => void;
  cameraExposureMs: number;
  setCameraExposureMs: (value: number) => void;
  cameraPhotonFluxScale: number;
  setCameraPhotonFluxScale: (value: number) => void;
  cameraFullWellElectrons: number;
  setCameraFullWellElectrons: (value: number) => void;
  cameraReadNoiseElectrons: number;
  setCameraReadNoiseElectrons: (value: number) => void;
  cameraDarkCurrentElectrons: number;
  setCameraDarkCurrentElectrons: (value: number) => void;
  cameraBitDepth: L68CameraSettings["bitDepth"];
  setCameraBitDepth: (value: L68CameraSettings["bitDepth"]) => void;
  cameraGainDnPerElectron: number;
  setCameraGainDnPerElectron: (value: number) => void;
  cameraBlackLevelDn: number;
  setCameraBlackLevelDn: (value: number) => void;
  cameraSeed: number;
  setCameraSeed: (value: number) => void;
  cameraNoiseMode: L68CameraNoiseMode;
  setCameraNoiseMode: (value: L68CameraNoiseMode) => void;
  cameraRun: L68CameraRunResult | null;
  cameraCalibrationCsvText: string;
  setCameraCalibrationCsvText: (value: string) => void;
  cameraCalibrationDataset: L69CameraCalibrationDataset | null;
  cameraCalibrationRun: L69CameraCalibrationResult | null;
  onLoadCalibrationExample: (includePhotons: boolean) => void;
  onImportCameraCalibrationCsv: () => void;
  onImportCameraCalibrationFile: (file: File | null) => void | Promise<void>;
  onRunCameraCalibrationFit: () => void;
  onApplyCalibratedCameraProfile: () => void;
  onSaveCameraCalibrationStudy: () => void;
  onExportCameraCalibrationReport: () => void;
  onGenerateCameraRun: () => void;
  onSaturateCameraExposure: () => void;
  onExportCameraReport: () => void;
  onSendCameraToMeasured: () => void;
  onSaveCameraStudy: () => void;
}) {
  const executableCount = capabilities.filter((capability) => capability.status === "executable").length;
  const scaffoldCount = capabilities.filter((capability) => capability.status === "scaffold-only").length;
  const unavailableCount = capabilities.filter((capability) => capability.status === "not-implemented").length;
  const cameraMaxDn = cameraRun ? Math.max(1, 2 ** cameraRun.settings.bitDepth - 1) : 1;
  const cameraMaxHistogram = cameraRun ? Math.max(...cameraRun.histogram.map((bin) => bin.count), 1) : 1;
  const cameraMetric = (id: string) => (cameraRun ? cameraMetricValue(cameraRun, id) : Number.NaN);
  const calibrationMetric = (id: string) => (cameraCalibrationRun ? calibrationMetricValue(cameraCalibrationRun, id) : Number.NaN);
  const calibrationMaxResidual = cameraCalibrationRun ? Math.max(...cameraCalibrationRun.residuals.map((point) => Math.abs(point.residualMeanDn)), 1) : 1;
  const calibrationMaxMean = cameraCalibrationRun ? Math.max(...cameraCalibrationRun.residuals.map((point) => Math.max(point.measuredMeanDn, point.simulatedMeanDn)), 1) : 1;

  return (
    <div className="maxwell-study-card" aria-label="L7.1 Practical Study Workspace">
      <div className="maxwell-section-heading">
        <h2>L7.1 Practical Study Workspace</h2>
        <strong>{savedStudies.length} saved</strong>
      </div>
      <div className="l2-disclosure">
        <strong>Save studies, export evidence, run sweeps, compare measured vs simulated profiles, calibrate camera-lite data, and hand off resolution MTF diagnostics.</strong>
        <span>Workflow layer only: diagnostic photon-transfer calibration, slanted-edge/line-pair MTF, and the existing scalar/planar engines; this is not EMVA 1288 certification, ISO 12233 certification, certified lab calibration, new diffraction physics, or sensor-stack EM.</span>
      </div>

      <div className="maxwell-workspace-grid">
        <div className="maxwell-workspace-panel" aria-label="Capabilities Matrix">
          <div className="maxwell-section-heading">
            <h2>Capabilities Matrix</h2>
            <strong>{executableCount} executable / {scaffoldCount} scaffold / {unavailableCount} unavailable</strong>
          </div>
          <div className="maxwell-capability-table">
            {capabilities.map((capability) => (
              <div className={`maxwell-capability-row ${capability.status}`} key={capability.id}>
                <span>{capability.label}</span>
                <strong>{capability.status}</strong>
                <em>{capability.boundary}</em>
              </div>
            ))}
          </div>
        </div>

        <div className="maxwell-workspace-panel" aria-label="Study Manager">
          <div className="maxwell-section-heading">
            <h2>Study Manager</h2>
            <strong>{studyStatus}</strong>
          </div>
          <div className="maxwell-study-controls">
            <label className="field-row">
              <span>Study name</span>
              <input value={studyName} onChange={(event) => setStudyName(event.currentTarget.value)} />
            </label>
            <label className="field-row">
              <span>Saved studies</span>
              <select value={selectedStudyId} onChange={(event) => setSelectedStudyId(event.currentTarget.value)}>
                <option value="">Select study</option>
                {savedStudies.map((study) => (
                  <option key={study.id} value={study.id}>
                    {study.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="maxwell-layer-actions">
            <button type="button" onClick={onSaveValidation}><Save size={15} /><span>Save Study</span></button>
            <button type="button" onClick={onSaveCoating}><Save size={15} /><span>Save Coating Study</span></button>
            <button type="button" onClick={onLoadStudy}><Upload size={15} /><span>Load Study</span></button>
            <button type="button" onClick={onDuplicateStudy}><Plus size={15} /><span>Duplicate Study</span></button>
            <button type="button" onClick={onDeleteStudy}><Trash2 size={15} /><span>Delete Study</span></button>
          </div>
          <div className="maxwell-layer-actions">
            <button type="button" onClick={onExportBundle}><FileDown size={15} /><span>Export Study Bundle</span></button>
            <label className="maxwell-file-action">
              <Upload size={15} />
              <span>Import Study Bundle</span>
              <input type="file" accept="application/json,.json" onChange={(event) => void onImportBundle(event.currentTarget.files?.[0] ?? null)} />
            </label>
            <button type="button" onClick={() => void onCopyShareableUrl()}><FileDown size={15} /><span>Copy Shareable URL</span></button>
          </div>
          {savedStudies.length > 0 && (
            <div className="maxwell-study-list">
              {savedStudies.slice(0, 4).map((study) => (
                <div className="compact-stat" key={study.id}>
                  <span>{study.name}</span>
                  <strong>{study.mode} / {study.resultHash.slice(0, 8)}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="maxwell-workspace-panel" aria-label="Parameter Sweep Runner">
          <div className="maxwell-section-heading">
            <h2>Parameter Sweep Runner</h2>
            <strong>{sweepResult ? `${sweepResult.executedRunCount} rows` : "not run"}</strong>
          </div>
          <div className="maxwell-study-controls">
            <label className="field-row">
              <span>Parameter</span>
              <select value={sweepFamily} onChange={(event) => setSweepFamily(event.currentTarget.value as PracticalSweepFamily)}>
                <option value="coherence-gamma">coherence gamma</option>
                <option value="validation-wavelength">validation wavelength</option>
                <option value="observation-z">observation z</option>
                <option value="slit-width">slit width</option>
                <option value="double-slit-separation">double-slit separation</option>
                <option value="thin-lens-defocus">thin-lens defocus</option>
                <option value="coating-wavelength">coating wavelength</option>
              </select>
            </label>
            <NumberField label="Start" value={sweepStart} min={-1000} max={3000} step={0.1} onChange={setSweepStart} />
            <NumberField label="Stop" value={sweepStop} min={-1000} max={3000} step={0.1} onChange={setSweepStop} />
            <NumberField label="Samples" value={sweepCount} min={1} max={200} step={1} onChange={setSweepCount} />
          </div>
          <div className="maxwell-layer-actions">
            <button type="button" onClick={onRunSweep}><Sparkles size={15} /><span>Run Sweep</span></button>
            <button type="button" onClick={onRunSweep}><ShieldCheck size={15} /><span>Cancel Sweep</span></button>
            {sweepResult && <button type="button" onClick={onExportSweepJson}><FileDown size={15} /><span>Sweep JSON</span></button>}
            {sweepResult && <button type="button" onClick={onExportSweepMarkdown}><FileDown size={15} /><span>Sweep Markdown</span></button>}
            {sweepResult && <button type="button" onClick={onExportSweepCsv}><FileDown size={15} /><span>Sweep CSV</span></button>}
          </div>
          {sweepResult && (
            <>
              {sweepResult.budget.truncated && <div className="error-banner">Budget warning: requested {sweepResult.requestedRunCount}, ran {sweepResult.executedRunCount}.</div>}
              <div className="maxwell-data-table">
                {sweepResult.rows.slice(0, 8).map((row) => (
                  <div className="compact-stat" key={`${row.index}-${row.resultHash}`}>
                    <span>{row.parameter.label} {row.parameter.value.toPrecision(4)} {row.parameter.unit}</span>
                    <strong>{row.metrics.map((metricItem) => `${metricItem.label}: ${Number.isFinite(metricItem.value) ? metricItem.value.toPrecision(4) : "n/a"}${metricItem.unit ? ` ${metricItem.unit}` : ""}`).join(" / ")}</strong>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="maxwell-workspace-panel" aria-label="Measurement Tools">
          <div className="maxwell-section-heading">
            <h2>Measurement Tools</h2>
            <strong>{markers.length} marker{markers.length === 1 ? "" : "s"}</strong>
          </div>
          <div className="maxwell-layer-actions">
            <button type="button" onClick={onPinCenter}><Sparkles size={15} /><span>Pin Crosshair</span></button>
            <button type="button" onClick={onPinPeak}><Sparkles size={15} /><span>Peak Finder</span></button>
            <button type="button" onClick={onPinMinimum}><Sparkles size={15} /><span>Minimum Finder</span></button>
            <button type="button" onClick={onExportProfileCsv}><FileDown size={15} /><span>Profile CSV</span></button>
            <button type="button" onClick={onClearMarkers}><Trash2 size={15} /><span>Clear Markers</span></button>
          </div>
          <div className="maxwell-marker-list">
            {markers.map((marker) => (
              <div className="compact-stat" key={marker.id}>
                <span>{marker.label}</span>
                <strong>x {formatMm(marker.uM)} mm / y {formatMm(marker.vM)} mm / I {marker.intensity.toPrecision(4)}</strong>
              </div>
            ))}
            {markerDistanceM !== null && (
              <div className="compact-stat">
                <span>Marker distance</span>
                <strong>{formatMm(markerDistanceM)} mm</strong>
              </div>
            )}
          </div>
          <div className="l2-disclosure">
            <strong>ROI measurement and line profile extraction are represented by marker/table/profile exports in this pass.</strong>
            <span>Map/profile coordinates are read from the active zero-thickness validation plane.</span>
          </div>
        </div>

        <div className="maxwell-workspace-panel maxwell-camera-calibration-panel" aria-label="Camera Calibration Workbench">
          <div className="maxwell-section-heading">
            <h2>Camera Calibration Workbench</h2>
            <strong>{cameraCalibrationRun ? cameraCalibrationRun.resultHash.slice(0, 10) : cameraCalibrationDataset ? cameraCalibrationDataset.dataHash.slice(0, 10) : "not imported"}</strong>
          </div>
          <div className="l2-disclosure">
            <strong>This is an EMVA-inspired diagnostic calibration workflow.</strong>
            <span>It is not an EMVA 1288 certification, ISO-certified calibration, lab-accredited camera characterization, sensor-stack EM, digital twin, or full 3D Maxwell/FDTD/FEM/BEM/RCWA execution.</span>
          </div>
          <label className="maxwell-measured-textarea-label">
            <span>Calibration CSV summary</span>
            <textarea
              className="maxwell-measured-textarea maxwell-calibration-textarea"
              value={cameraCalibrationCsvText}
              onChange={(event) => setCameraCalibrationCsvText(event.currentTarget.value)}
              placeholder="frame_type,exposure_ms,mean_dn,variance_dn2,photons_per_pixel&#10;dark,1,64,3,&#10;flat,10,3562,342,36000"
            />
          </label>
          <div className="maxwell-layer-actions">
            <button type="button" onClick={() => onLoadCalibrationExample(false)}><Sparkles size={15} /><span>Load Example Calibration CSV</span></button>
            <button type="button" onClick={() => onLoadCalibrationExample(true)}><Sparkles size={15} /><span>Load Example With photons_per_pixel</span></button>
            <button type="button" onClick={onImportCameraCalibrationCsv}><Upload size={15} /><span>Import Calibration CSV</span></button>
            <label className="maxwell-file-action">
              <Upload size={15} />
              <span>Import Calibration File</span>
              <input type="file" accept=".csv,text/csv" onChange={(event) => void onImportCameraCalibrationFile(event.currentTarget.files?.[0] ?? null)} />
            </label>
            <button type="button" onClick={onRunCameraCalibrationFit}><Sparkles size={15} /><span>Run Photon-Transfer Fit</span></button>
            <button type="button" onClick={onApplyCalibratedCameraProfile}><ShieldCheck size={15} /><span>Apply Calibrated Camera Profile</span></button>
            <button type="button" onClick={onExportCameraCalibrationReport}><FileDown size={15} /><span>Export Calibration Bundle</span></button>
            <button type="button" onClick={onSaveCameraCalibrationStudy}><Save size={15} /><span>Save Calibration Study</span></button>
          </div>
          {cameraCalibrationDataset && (
            <div className="maxwell-data-table">
              <div className="maxwell-study-list">
                <div className="compact-stat"><span>Rows / skipped</span><strong>{cameraCalibrationDataset.rowCount} / {cameraCalibrationDataset.skippedRowCount}</strong></div>
                <div className="compact-stat"><span>Data hash</span><strong>{cameraCalibrationDataset.dataHash.slice(0, 12)}</strong></div>
                <div className="compact-stat"><span>Source hash</span><strong>{cameraCalibrationDataset.sourceTextHash.slice(0, 12)}</strong></div>
                <div className="compact-stat"><span>Source</span><strong>{cameraCalibrationDataset.sourceName}</strong></div>
              </div>
              <div className="maxwell-calibration-table" aria-label="Imported calibration table">
                <div><strong>type</strong><strong>exposure</strong><strong>mean DN</strong><strong>variance</strong><strong>photons</strong></div>
                {cameraCalibrationDataset.rows.slice(0, 8).map((row) => (
                  <div key={`${row.frameType}-${row.exposureMs}-${row.sourceIndex}`}>
                    <span>{row.frameType}</span>
                    <span>{row.exposureMs.toPrecision(4)} ms</span>
                    <span>{row.meanDn.toPrecision(5)}</span>
                    <span>{row.varianceDn2.toPrecision(5)}</span>
                    <span>{row.photonsPerPixel === undefined ? "n/a" : row.photonsPerPixel.toPrecision(5)}</span>
                  </div>
                ))}
              </div>
              {cameraCalibrationDataset.warnings.map((warning) => <div className="error-banner" key={`${warning.code}-${warning.message}`}>{warning.message}</div>)}
            </div>
          )}
          {cameraCalibrationRun && (
            <div className="maxwell-data-table">
              <div className="maxwell-study-list">
                <div className="compact-stat"><span>Black level</span><strong>{formatCompact(calibrationMetric("blackLevelDn"))} DN</strong></div>
                <div className="compact-stat"><span>Gain / conversion</span><strong>{formatCompact(calibrationMetric("gainDnPerElectron"))} DN/e- / {formatCompact(calibrationMetric("conversionGainElectronsPerDn"))} e-/DN</strong></div>
                <div className="compact-stat"><span>Read noise / dark current</span><strong>{formatCompact(calibrationMetric("readNoiseElectronsRms"))} e- / {formatCompact(calibrationMetric("darkCurrentElectronsPerS"))} e-/s</strong></div>
                <div className="compact-stat"><span>Full well / saturation</span><strong>{formatCompact(calibrationMetric("fullWellElectrons"))} e- / {formatCompact(calibrationMetric("saturationDn"))} DN</strong></div>
                <div className="compact-stat"><span>Effective QE</span><strong>{Number.isFinite(calibrationMetric("effectiveQuantumEfficiency")) ? calibrationMetric("effectiveQuantumEfficiency").toPrecision(4) : "not identifiable"}</strong></div>
                <div className="compact-stat"><span>Residual RMS / max</span><strong>{formatCompact(calibrationMetric("residualRmsDn"))} / {formatCompact(calibrationMetric("maxResidualDn"))} DN</strong></div>
                <div className="compact-stat"><span>Linearity / SNR mismatch</span><strong>{formatCompact(calibrationMetric("linearityError"))} / {formatCompact(calibrationMetric("snrMismatchRms"))}</strong></div>
                <div className="compact-stat"><span>Dynamic range</span><strong>{formatCompact(calibrationMetric("dynamicRange"))}</strong></div>
              </div>
              <div className="maxwell-calibration-curves" aria-label="Measured vs simulated mean DN">
                {cameraCalibrationRun.residuals.slice(0, 32).map((point, index) => (
                  <span key={`${point.exposureMs}-${index}`} title={`${point.frameType} ${point.exposureMs} ms measured=${point.measuredMeanDn.toPrecision(4)} simulated=${point.simulatedMeanDn.toPrecision(4)}`}>
                    <i style={{ height: `${Math.max(2, clamp(point.measuredMeanDn / calibrationMaxMean, 0, 1) * 100)}%` }} />
                    <b style={{ height: `${Math.max(2, clamp(point.simulatedMeanDn / calibrationMaxMean, 0, 1) * 100)}%` }} />
                  </span>
                ))}
              </div>
              <div className="maxwell-calibration-residuals" aria-label="Calibration residual curve">
                {cameraCalibrationRun.residuals.slice(0, 32).map((point, index) => (
                  <i key={`${point.exposureMs}-${point.residualMeanDn}-${index}`} style={{ height: `${Math.max(3, (Math.abs(point.residualMeanDn) / calibrationMaxResidual) * 100)}%` }} title={`residual=${point.residualMeanDn.toPrecision(4)} DN`} />
                ))}
              </div>
              {cameraCalibrationRun.warnings.map((warning) => <div className="error-banner" key={`${warning.code}-${warning.message}`}>{warning.message}</div>)}
            </div>
          )}
        </div>

        <div className="maxwell-workspace-panel maxwell-camera-panel" aria-label="Camera / Sensor-Lite">
          <div className="maxwell-section-heading">
            <h2>Camera / Sensor-Lite</h2>
            <strong>{cameraRun ? cameraRun.resultHash.slice(0, 10) : "not generated"}</strong>
          </div>
          <div className="l2-disclosure">
            <strong>Convert selected simulated optical intensity into photons, electrons, DN, SNR, saturation, histogram, and line-profile evidence.</strong>
            <span>Camera/Sensor-Lite converts an existing simulated intensity map into synthetic detector readout; it does not model pixel-level electromagnetic absorption, microlenses, color filters, charge diffusion, semiconductor transport, a calibrated sensor stack, certified EMVA compliance, digital twin behavior, or 3D Maxwell/FDTD/FEM/BEM/RCWA execution.</span>
          </div>
          <div className="maxwell-study-controls">
            <label className="field-row">
              <span>Simulated optical result</span>
              <select value={cameraSimulatedStudyId} onChange={(event) => setCameraSimulatedStudyId(event.currentTarget.value)}>
                <option value="">Active validation profile</option>
                {savedStudies.filter((study) => Object.keys(study.profiles).length > 0).map((study) => (
                  <option key={study.id} value={study.id}>{study.name}</option>
                ))}
              </select>
            </label>
            <NumberField label="Pixel pitch um" value={cameraPixelPitchUm} min={0.01} max={10000} step={0.1} onChange={setCameraPixelPitchUm} />
            <NumberField label="Sensor width px" value={cameraWidthPx} min={8} max={512} step={1} onChange={setCameraWidthPx} />
            <NumberField label="Sensor height px" value={cameraHeightPx} min={8} max={512} step={1} onChange={setCameraHeightPx} />
            <NumberField label="Quantum efficiency QE" value={cameraQuantumEfficiency} min={0} max={1} step={0.01} onChange={setCameraQuantumEfficiency} />
            <NumberField label="Exposure time ms" value={cameraExposureMs} min={0} max={1000000} step={0.1} onChange={setCameraExposureMs} />
            <NumberField label="Photon flux scale" value={cameraPhotonFluxScale} min={0} max={1e12} step={1000} onChange={setCameraPhotonFluxScale} />
            <NumberField label="Full well e-" value={cameraFullWellElectrons} min={1} max={1e9} step={100} onChange={setCameraFullWellElectrons} />
            <NumberField label="Read noise e- RMS" value={cameraReadNoiseElectrons} min={0} max={100000} step={0.1} onChange={setCameraReadNoiseElectrons} />
            <NumberField label="Dark current e-/px/s" value={cameraDarkCurrentElectrons} min={0} max={1e9} step={0.1} onChange={setCameraDarkCurrentElectrons} />
            <label className="field-row">
              <span>ADC bit depth</span>
              <select value={cameraBitDepth} onChange={(event) => setCameraBitDepth(Number(event.currentTarget.value) as L68CameraSettings["bitDepth"])}>
                <option value={8}>8</option>
                <option value={10}>10</option>
                <option value={12}>12</option>
                <option value={14}>14</option>
                <option value={16}>16</option>
              </select>
            </label>
            <NumberField label="Conversion gain DN/e-" value={cameraGainDnPerElectron} min={0} max={100000} step={0.01} onChange={setCameraGainDnPerElectron} />
            <NumberField label="Black level DN" value={cameraBlackLevelDn} min={0} max={65535} step={1} onChange={setCameraBlackLevelDn} />
            <NumberField label="Seed" value={cameraSeed} min={0} max={4294967295} step={1} onChange={setCameraSeed} />
            <label className="field-row">
              <span>Noise mode</span>
              <select value={cameraNoiseMode} onChange={(event) => setCameraNoiseMode(event.currentTarget.value as L68CameraNoiseMode)}>
                <option value="noiseless">ideal/noiseless</option>
                <option value="shot-only">shot only</option>
                <option value="shot-read">shot + read</option>
                <option value="shot-read-dark">shot + read + dark</option>
              </select>
            </label>
          </div>
          <div className="maxwell-layer-actions">
            <button type="button" onClick={onGenerateCameraRun}><Sparkles size={15} /><span>Generate Camera Output</span></button>
            <button type="button" onClick={onSaturateCameraExposure}><ShieldCheck size={15} /><span>Saturate Exposure</span></button>
            <button type="button" onClick={onExportCameraReport}><FileDown size={15} /><span>Export Camera Report</span></button>
            <button type="button" onClick={onSendCameraToMeasured}><Sparkles size={15} /><span>Send synthetic camera image to Measured-vs-Simulated</span></button>
            <button type="button" onClick={onSaveCameraStudy}><Save size={15} /><span>Save Camera Study</span></button>
          </div>
          {cameraRun && (
            <div className="maxwell-data-table">
              <div className="maxwell-camera-preview" aria-label="Digital number / raw image">
                {cameraRun.maps.digitalNumbers.slice(0, 96).map((value, index) => (
                  <i key={`${value}-${index}`} style={{ opacity: 0.16 + 0.84 * clamp(value / cameraMaxDn, 0, 1) }} title={`DN ${value}`} />
                ))}
              </div>
              <div className="maxwell-camera-histogram" aria-label="Histogram">
                {cameraRun.histogram.map((bin, index) => (
                  <i key={`${bin.minDn}-${bin.maxDn}-${index}`} style={{ height: `${Math.max(3, (bin.count / cameraMaxHistogram) * 100)}%` }} title={`${bin.minDn}-${bin.maxDn}: ${bin.count}`} />
                ))}
              </div>
              <div className="maxwell-camera-profile-preview" aria-label="Line profile before/after camera model">
                {cameraRun.profile.slice(0, 64).map((point, index) => (
                  <span key={`${point.xM}-${index}`} title={`x=${formatMm(point.xM)} mm optical=${point.opticalIntensity.toPrecision(4)} DN=${point.digitalNumber}`}>
                    <i style={{ height: `${Math.max(2, clamp(point.opticalIntensity, 0, 1) * 100)}%` }} />
                    <b style={{ height: `${Math.max(2, clamp(point.digitalNumber / cameraMaxDn, 0, 1) * 100)}%` }} />
                  </span>
                ))}
              </div>
              <div className="maxwell-study-list">
                <div className="compact-stat"><span>Mean / peak photons</span><strong>{formatCompact(cameraMetric("meanPhotons"))} / {formatCompact(cameraMetric("peakPhotons"))}</strong></div>
                <div className="compact-stat"><span>Mean / peak electrons</span><strong>{formatCompact(cameraMetric("meanSignalElectrons"))} / {formatCompact(cameraMetric("peakSignalElectrons"))}</strong></div>
                <div className="compact-stat"><span>Mean / peak DN</span><strong>{formatCompact(cameraMetric("meanDn"))} / {formatCompact(cameraMetric("peakDn"))}</strong></div>
                <div className="compact-stat"><span>Saturation fraction</span><strong>{formatPercent(cameraMetric("saturationFraction"))}</strong></div>
                <div className="compact-stat"><span>Mean / peak SNR</span><strong>{formatCompact(cameraMetric("meanSnr"))} / {formatCompact(cameraMetric("peakSnr"))}</strong></div>
                <div className="compact-stat"><span>Dynamic range estimate</span><strong>{formatCompact(cameraMetric("dynamicRange"))}</strong></div>
              </div>
              {cameraRun.warnings.map((warning) => <div className="error-banner" key={`${warning.code}-${warning.message}`}>{warning.message}</div>)}
            </div>
          )}
        </div>

        <div className="maxwell-workspace-panel maxwell-measured-panel" aria-label="Measured-vs-Simulated">
          <div className="maxwell-section-heading">
            <h2>Measured-vs-Simulated</h2>
            <strong>{measuredComparison ? measuredComparison.resultHash.slice(0, 10) : measuredDataset ? measuredDataset.measuredDataHash.slice(0, 10) : "no measured data"}</strong>
          </div>
          <div className="l2-disclosure">
            <strong>Compare imported measured CSV/image profiles to the selected scalar validation profile.</strong>
            <span>This is diagnostic alignment and residual analysis, not certified instrument calibration, sensor simulation, digital twin, or new Maxwell physics.</span>
          </div>
          <div className="maxwell-study-controls">
            <label className="field-row">
              <span>Simulated run</span>
              <select value={measuredSimulatedStudyId} onChange={(event) => setMeasuredSimulatedStudyId(event.currentTarget.value)}>
                <option value="">Active validation profile</option>
                {savedStudies.filter((study) => Object.keys(study.profiles).length > 0).map((study) => (
                  <option key={study.id} value={study.id}>{study.name}</option>
                ))}
              </select>
            </label>
            <NumberField label="Pixel size um" value={measuredPixelSizeUm} min={0.001} max={10000} step={0.1} onChange={setMeasuredPixelSizeUm} />
            <NumberField label="X offset um" value={measuredOffsetUm} min={-10000} max={10000} step={1} onChange={setMeasuredOffsetUm} />
            <NumberField label="ROI min mm" value={measuredRoiMinMm} min={-1000} max={1000} step={0.1} onChange={setMeasuredRoiMinMm} />
            <NumberField label="ROI max mm" value={measuredRoiMaxMm} min={-1000} max={1000} step={0.1} onChange={setMeasuredRoiMaxMm} />
          </div>
          <label className="maxwell-measured-textarea-label">
            <span>Measured CSV profile</span>
            <textarea
              className="maxwell-measured-textarea"
              value={measuredCsvText}
              onChange={(event) => setMeasuredCsvText(event.currentTarget.value)}
              placeholder="x_m,intensity&#10;-0.001,0.2&#10;0,1&#10;0.001,0.2"
            />
          </label>
          <div className="maxwell-layer-actions">
            <button type="button" onClick={onGenerateSyntheticMeasuredCsv}><Sparkles size={15} /><span>Generate Synthetic CSV</span></button>
            <button type="button" onClick={onImportMeasuredCsv}><Upload size={15} /><span>Import Measured CSV</span></button>
            <label className="maxwell-file-action">
              <Upload size={15} />
              <span>Import PNG/JPEG/CSV</span>
              <input type="file" accept=".csv,text/csv,image/png,image/jpeg" onChange={(event) => void onImportMeasuredFile(event.currentTarget.files?.[0] ?? null)} />
            </label>
            <button type="button" onClick={onCompareMeasured}><Sparkles size={15} /><span>Compare Measured vs Simulated</span></button>
            <button type="button" onClick={onRunMeasuredFit}><Sparkles size={15} /><span>Run Diagnostic Fit</span></button>
            <button type="button" onClick={onSaveMeasuredComparison}><Save size={15} /><span>Save Comparison Study</span></button>
            <button type="button" onClick={onExportMeasuredComparison}><FileDown size={15} /><span>Export Comparison Report</span></button>
          </div>
          {measuredComparison && (
            <div className="maxwell-data-table">
              <div className="compact-stat">
                <span>RMS / MAE residual</span>
                <strong>{measuredComparison.metrics.rmsResidual.toPrecision(4)} / {measuredComparison.metrics.maeResidual.toPrecision(4)}</strong>
              </div>
              <div className="compact-stat">
                <span>Normalized cross-correlation</span>
                <strong>{measuredComparison.metrics.normalizedCrossCorrelation.toPrecision(4)}</strong>
              </div>
              <div className="compact-stat">
                <span>Peak / centroid error</span>
                <strong>{formatMm(measuredComparison.metrics.peakPositionErrorM ?? Number.NaN)} mm / {formatMm(measuredComparison.metrics.centroidErrorM ?? Number.NaN)} mm</strong>
              </div>
              {measuredFit && (
                <div className="compact-stat">
                  <span>Fit best shift / scale / background</span>
                  <strong>{formatMm(measuredFit.best.shiftM)} mm / {measuredFit.best.intensityScale.toPrecision(4)} / {measuredFit.best.backgroundOffset.toPrecision(4)}</strong>
                </div>
              )}
              {measuredFit && (
                <div className="compact-stat">
                  <span>Fit RMS improvement</span>
                  <strong>{measuredFit.before.rmsResidual.toPrecision(4)} to {measuredFit.best.rmsResidual.toPrecision(4)}</strong>
                </div>
              )}
              <div className="maxwell-residual-preview">
                {measuredComparison.residualProfile.slice(0, 32).map((point, index) => (
                  <i key={`${point.xM}-${index}`} style={{ height: `${Math.min(100, Math.abs(point.residual) * 100)}%` }} title={`x=${formatMm(point.xM)} mm residual=${point.residual.toPrecision(4)}`} />
                ))}
              </div>
              {measuredComparison.warnings.map((warning) => <div className="error-banner" key={`${warning.code}-${warning.message}`}>{warning.message}</div>)}
            </div>
          )}
        </div>

        <div className="maxwell-workspace-panel" aria-label="Run Comparison">
          <div className="maxwell-section-heading">
            <h2>Run Comparison</h2>
            <strong>{comparison ? comparison.resultHash.slice(0, 10) : "not compared"}</strong>
          </div>
          <div className="maxwell-study-controls">
            <label className="field-row">
              <span>Run A</span>
              <select value={comparisonAId} onChange={(event) => setComparisonAId(event.currentTarget.value)}>
                <option value="">Select Run A</option>
                {studyRuns.map((run) => <option key={run.id} value={run.id}>{run.label}</option>)}
              </select>
            </label>
            <label className="field-row">
              <span>Run B</span>
              <select value={comparisonBId} onChange={(event) => setComparisonBId(event.currentTarget.value)}>
                <option value="">Select Run B</option>
                {studyRuns.map((run) => <option key={run.id} value={run.id}>{run.label}</option>)}
              </select>
            </label>
          </div>
          <div className="maxwell-layer-actions">
            <button type="button" onClick={onCompareGamma}><Sparkles size={15} /><span>Compare Gamma 1 vs Gamma 0</span></button>
            <button type="button" onClick={onCompareSelected}><Sparkles size={15} /><span>Compare Selected Runs</span></button>
            {comparison && <button type="button" onClick={onExportComparisonMarkdown}><FileDown size={15} /><span>Comparison Markdown</span></button>}
            {comparison && <button type="button" onClick={onExportComparisonCsv}><FileDown size={15} /><span>Comparison CSV</span></button>}
          </div>
          {comparison && (
            <div className="maxwell-data-table">
              {comparison.deltas.map((delta) => (
                <div className="compact-stat" key={delta.id}>
                  <span>{delta.label}</span>
                  <strong>{delta.a.toPrecision(4)} to {delta.b.toPrecision(4)} / delta {delta.delta.toPrecision(4)} {delta.unit ?? ""}</strong>
                </div>
              ))}
              {comparison.warnings.map((warning) => <div className="error-banner" key={warning.code}>{warning.message}</div>)}
            </div>
          )}
        </div>

        <div className="maxwell-workspace-panel" aria-label="Study Bundle Export">
          <div className="maxwell-section-heading">
            <h2>Study Bundle Export</h2>
            <strong>JSON + Markdown + CSV</strong>
          </div>
          <div className="l2-disclosure">
            <strong>Bundle contents</strong>
            <span>study.json, study.md, metrics.csv, profiles.csv, warnings.json, capabilities.json, manifest.json, backend/material/uncertainty receipts, result hashes, and limitations.</span>
          </div>
          <div className="maxwell-layer-actions">
            <button type="button" onClick={onExportBundle}><FileDown size={15} /><span>Export Study Bundle</span></button>
            {sweepResult && <button type="button" onClick={onExportSweepCsv}><FileDown size={15} /><span>metrics.csv</span></button>}
            {comparison && <button type="button" onClick={onExportComparisonCsv}><FileDown size={15} /><span>comparison.csv</span></button>}
            <button type="button" onClick={onExportProfileCsv}><FileDown size={15} /><span>profiles.csv</span></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FluxRow({ label, value, explainId, explainMode = false }: { label: string; value: number; explainId?: ExplainEntryId; explainMode?: boolean }) {
  return (
    <div className="maxwell-flux-row">
      {explainId ? <ExplainLabel entryId={explainId} explainMode={explainMode}>{label}</ExplainLabel> : <span>{label}</span>}
      <div className="maxwell-flux-bar">
        <i style={{ width: `${clamp(value, 0, 1) * 100}%` }} />
      </div>
      <strong>{formatPercent(value)}</strong>
    </div>
  );
}

function MaterialSelectOptions({ materials }: { materials: MaterialCatalogEntry[] }) {
  const builtIn = materials.filter((material) => material.origin === "builtIn");
  const imported = materials.filter((material) => material.origin === "imported");
  return (
    <>
      <optgroup label="Built-in">
        {builtIn.map((material) => (
          <option key={material.id} value={material.id}>
            {material.label}
          </option>
        ))}
      </optgroup>
      {imported.length > 0 && (
        <optgroup label="Imported">
          {imported.map((material) => (
            <option key={material.id} value={material.id}>
              {material.label}
            </option>
          ))}
        </optgroup>
      )}
    </>
  );
}

function MaterialPassport({ material, wavelengthNm, explainMode = false }: { material: MaterialCatalogEntry | undefined; wavelengthNm: number; explainMode?: boolean }) {
  if (!material) {
    return <div className="maxwell-material-passport warning">Missing material reference</div>;
  }
  const range = materialWavelengthRange(material);
  const outsideRange = range ? wavelengthNm * 1e-9 < range[0] || wavelengthNm * 1e-9 > range[1] : false;
  return (
    <div className={`maxwell-material-passport${outsideRange ? " warning" : ""}`}>
      <ExplainLabel entryId="coating.provenanceReceipt" explainMode={explainMode}>{material.origin === "imported" ? "Imported" : "Built-in diagnostic"}</ExplainLabel>
      <strong>{material.materialHash.slice(0, 10)}</strong>
      <span>{formatWavelengthRange(range)}</span>
      <span>{material.origin === "imported" ? material.sourcePackLabel ?? material.sourcePackId ?? "imported pack" : material.sourceRecordId}</span>
      <span>{material.source}</span>
      {outsideRange && <span>outside wavelength range</span>}
    </div>
  );
}

function SweepPlot({ sweep }: { sweep: CoatingSweepResult }) {
  const width = 720;
  const height = 150;
  const pad = 20;
  const usableWidth = width - pad * 2;
  const usableHeight = height - pad * 2;
  const yMax = Math.max(0.05, ...sweep.samples.map((sample) => sample.reflectance));
  const points = sweep.samples
    .map((sample, index) => {
      const x = pad + (usableWidth * index) / Math.max(1, sweep.samples.length - 1);
      const y = pad + usableHeight * (1 - sample.reflectance / yMax);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg className="maxwell-sweep-plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Reflectance over wavelength sweep">
      <rect x="0" y="0" width={width} height={height} />
      <line className="profile-axis" x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} />
      <line className="profile-axis" x1={pad} y1={pad} x2={pad} y2={height - pad} />
      <polyline className="maxwell-sweep-line" points={points} />
      <text x={pad} y={height - 5}>
        {(sweep.sweep.startWavelengthM * 1e9).toFixed(0)} nm
      </text>
      <text x={width - pad - 48} y={height - 5}>
        {(sweep.sweep.endWavelengthM * 1e9).toFixed(0)} nm
      </text>
      <text x={pad + 4} y={pad + 12}>
        R max {formatPercent(yMax)}
      </text>
    </svg>
  );
}

function FieldMonitorPlot({ monitor }: { monitor: PlanarFieldMonitorResult }) {
  const width = 720;
  const height = 150;
  const pad = 20;
  const usableWidth = width - pad * 2;
  const usableHeight = height - pad * 2;
  const maxPositionM = Math.max(monitor.totalThicknessM, 1e-12);
  const yMax = Math.max(0.05, monitor.maxElectricIntensity);
  const points = monitor.samples
    .map((sample) => {
      const x = pad + usableWidth * (sample.positionM / maxPositionM);
      const y = pad + usableHeight * (1 - sample.electricIntensity / yMax);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg className="maxwell-sweep-plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Planar field monitor electric intensity through coating stack">
      <rect x="0" y="0" width={width} height={height} />
      <line className="profile-axis" x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} />
      <line className="profile-axis" x1={pad} y1={pad} x2={pad} y2={height - pad} />
      <polyline className="maxwell-monitor-line" points={points} />
      <text x={pad} y={height - 5}>
        0 nm
      </text>
      <text x={width - pad - 60} y={height - 5}>
        {(monitor.totalThicknessM * 1e9).toFixed(1)} nm
      </text>
      <text x={pad + 4} y={pad + 12}>
        max |E|^2 {yMax.toFixed(2)}
      </text>
    </svg>
  );
}

function GuidedOpticalBenchCards({ explainMode = false }: { explainMode?: boolean }) {
  return (
    <div className="maxwell-mental-model-grid" aria-label="Guided optical bench mental models">
      <div className="maxwell-guidance-card">
        <div className="maxwell-section-heading">
          <h2><ExplainLabel entryId="validation.spatialBench" explainMode={explainMode}>Validation Bench: spatial optical layout</ExplainLabel></h2>
          <strong>placed along z</strong>
        </div>
        <div className="maxwell-diagram-strip" aria-label="Validation bench optical axis diagram">
          <span>z = 0 mm Source</span>
          <i>-&gt;</i>
          <span>Aperture / Slit / Lens</span>
          <i>-&gt;</i>
          <span>Observation Plane</span>
        </div>
        <p>Use this section for source, aperture, slit, lens, and observation-plane validation along the optical z-axis.</p>
        <ExplainButton entryId="validation.spatialBench" label="Where is this?" explainMode={explainMode} />
      </div>
      <div className="maxwell-guidance-card">
        <div className="maxwell-section-heading">
          <h2><ExplainLabel entryId="coating.planarStack" explainMode={explainMode}>Coating Stack Workbench: planar layer model</ExplainLabel></h2>
          <strong>boundary media</strong>
        </div>
        <div className="maxwell-diagram-strip" aria-label="Planar coating stack diagram">
          <span>Light direction</span>
          <i>-&gt;</i>
          <span>Incident medium</span>
          <i>-&gt;</i>
          <span>Coating layers</span>
          <i>-&gt;</i>
          <span>Substrate medium</span>
        </div>
        <p>Use this section for an ideal infinite planar stack: incident medium, ordered coating layers, then substrate medium.</p>
        <ExplainButton entryId="coating.planarStack" label="Where is this?" explainMode={explainMode} />
      </div>
    </div>
  );
}

function ValidationBenchGuide({ explainMode = false }: { explainMode?: boolean }) {
  return (
    <div className="maxwell-how-to-card" aria-label="Validation Bench usage">
      <div className="maxwell-section-heading">
        <h2><ExplainLabel entryId="validation.opticalZAxis" explainMode={explainMode}>How to use this section</ExplainLabel></h2>
        <strong>spatial bench</strong>
      </div>
      <div className="maxwell-diagram-strip" aria-label="Example spatial validation bench">
        <span>z = 0 mm Source</span>
        <i>-&gt;</i>
        <span>z = 10 mm Aperture / Slit / Lens</span>
        <i>-&gt;</i>
        <span>z = 20 mm Observation Plane</span>
      </div>
      <p>
        Select a benchmark, adjust its physical controls, then read the map, radial overlay, residual curve, and exported
        report as measurements at the observation plane. Each benchmark below lists its exact z and plane values.
      </p>
    </div>
  );
}

function CoatingStackGuide({ explainMode = false }: { explainMode?: boolean }) {
  return (
    <div className="maxwell-how-to-card" aria-label="Coating Stack Workbench usage">
      <div className="maxwell-section-heading">
        <h2><ExplainLabel entryId="coating.planarStack" explainMode={explainMode}>How to use this section</ExplainLabel></h2>
        <strong>planar stack</strong>
      </div>
      <div className="maxwell-diagram-strip" aria-label="Coating stack order">
        <span>Light direction</span>
        <i>-&gt;</i>
        <span>Incident medium</span>
        <i>-&gt;</i>
        <span>Layer 1</span>
        <i>-&gt;</i>
        <span>Layer 2</span>
        <i>-&gt;</i>
        <span>Substrate medium</span>
      </div>
      <p>
        Load an example setup, choose the boundary media, then edit ordered coating layers. This solver has no 3D source
        distance, curved lens geometry, or finite substrate thickness.
      </p>
    </div>
  );
}

function WhereMeasuredBlock({ entryId, explainMode = false, children }: { entryId: ExplainEntryId; explainMode?: boolean; children: ReactNode }) {
  return (
    <div className="maxwell-where-measured">
      <div className="maxwell-section-heading">
        <strong>Where is this measured?</strong>
        <ExplainButton entryId={entryId} label="Where is this?" explainMode={explainMode} />
      </div>
      <div className="maxwell-where-body">{children}</div>
    </div>
  );
}

function SlitValidationPanel({ result, explainMode = false }: { result: SlitOrderValidationResult; explainMode?: boolean }) {
  const isSingle = result.config.kind === "long-single-slit-sinc2";
  const visibleFeatures = result.expected.features.filter((feature) => feature.visible);

  return (
    <div className="maxwell-validation-mode-panel">
      <div className="l2-disclosure">
        <strong>{isSingle ? "Long single slit sinc^2 validation" : "Double slit / grating order validation"}</strong>
        <span>{isSingle ? "coherent plane wave through a 100 um long slit; hand check y1 ~= lambda L / a = 5.00 mm" : "coherent plane wave through two long slits; hand check order spacing dy ~= lambda L / d = 5.00 mm"}</span>
      </div>
      <div className="profile-meta">
        <div className="compact-stat">
          <ExplainLabel entryId="validation.source.wavelength" explainMode={explainMode}>Source</ExplainLabel>
          <strong>500 nm coherent plane wave</strong>
        </div>
        <div className="compact-stat">
          <ExplainLabel entryId="validation.aperture.circularDiameter" explainMode={explainMode}>Aperture</ExplainLabel>
          <strong>{isSingle ? "100 um long slit" : "20 um slits, 100 um separation"}</strong>
        </div>
        <div className="compact-stat">
          <ExplainLabel entryId="validation.numericalPropagation.huygensFresnel" explainMode={explainMode}>Propagation</ExplainLabel>
          <strong>1 m to zero-thickness plane</strong>
        </div>
        <div className="compact-stat">
          <span>Hand calculation</span>
          <strong>{isSingle ? "y1 ~= 5.00 mm" : "orders every 5.00 mm"}</strong>
        </div>
        <div className="compact-stat">
          <ExplainLabel entryId="validation.rmsResidual" explainMode={explainMode}>RMS residual</ExplainLabel>
          <strong>{result.residuals.rmsResidual.toExponential(2)}</strong>
        </div>
        <div className="compact-stat">
          <ExplainLabel entryId="validation.maxResidual" explainMode={explainMode}>Max residual</ExplainLabel>
          <strong>{result.residuals.maxResidual.toExponential(2)}</strong>
        </div>
      </div>
      <div className="maxwell-validation-output-grid three">
        <div>
          <div className="maxwell-section-heading">
            <h2>Numerical Slit Map</h2>
            <strong>computed</strong>
          </div>
          <ValidationIntensityMap field={result.numericalField} tone="numerical" ariaLabel={`${result.label} numerical intensity map`} />
        </div>
        <div>
          <div className="maxwell-section-heading">
            <h2>Analytic Reference Map</h2>
            <strong>{isSingle ? "sinc^2" : "orders + envelope"}</strong>
          </div>
          <ValidationIntensityMap field={result.analyticField} tone="analytic" ariaLabel={`${result.label} analytic reference map`} />
        </div>
        <div>
          <div className="maxwell-section-heading">
            <h2>Residual Map</h2>
            <strong>|numerical - analytic|</strong>
          </div>
          <ValidationIntensityMap field={result.residualField} tone="residual" ariaLabel={`${result.label} residual map`} />
        </div>
      </div>
      <div className="maxwell-validation-output-grid">
        <div className="maxwell-validation-profile-panel">
          <div className="maxwell-section-heading">
            <h2>{isSingle ? "sinc^2 Centerline" : "Order Centerline"}</h2>
            <div className="maxwell-heading-actions">
              <strong>numerical vs analytic</strong>
              <ExplainButton entryId="validation.radialOverlay" label="Where is this?" explainMode={explainMode} />
            </div>
          </div>
          <SlitProfilePlot result={result} />
          <WhereMeasuredBlock entryId="validation.whereMeasured" explainMode={explainMode}>
            Extracted from the zero-thickness observation plane {formatMm(result.config.propagationDistanceM)} mm downstream of the slit.
            The plane is {formatMm(result.config.observationPlane.widthM)} mm wide by {formatMm(result.config.observationPlane.heightM)} mm high.
            The centerline is an analysis view, not another optical element.
          </WhereMeasuredBlock>
        </div>
        <div className="maxwell-validation-profile-panel">
          <div className="maxwell-section-heading">
            <h2><ExplainLabel entryId="validation.residualCurve" explainMode={explainMode}>Residual Curve</ExplainLabel></h2>
            <div className="maxwell-heading-actions">
              <strong>signed mismatch</strong>
              <ExplainButton entryId="validation.residualCurve" label="Where is this?" explainMode={explainMode} />
            </div>
          </div>
          <SlitResidualPlot result={result} />
          <WhereMeasuredBlock entryId="validation.whereMeasured" explainMode={explainMode}>
            Computed on the same zero-thickness observation plane as the slit map. The residual curve compares the sampled
            centerline against the analytic slit/order formula.
          </WhereMeasuredBlock>
        </div>
      </div>
      <div className="maxwell-order-table" aria-label={isSingle ? "Single slit minima table" : "Double slit order table"}>
        {visibleFeatures.map((feature) => (
          <div className="compact-stat" key={`${feature.kind}-${feature.order}`}>
            <span>{feature.kind === "minimum" ? "Minimum" : "Order"} m={feature.order}</span>
            <strong>
              expected {formatMm(feature.expectedPositionM)} mm / measured {feature.measuredPositionM === null ? "n/a" : `${formatMm(feature.measuredPositionM)} mm`}
            </strong>
          </div>
        ))}
      </div>
      <ul className="warning-list">
        {result.warnings.map((warning) => (
          <li key={warning.code}>{warning.message}</li>
        ))}
      </ul>
      <div className="maxwell-layer-actions">
        <button type="button" onClick={() => undefined}>
          <Sparkles size={15} />
          <span>Run Slit Benchmark</span>
        </button>
        <button type="button" onClick={() => exportSlitValidationJson(result)}>
          <Save size={15} />
          <span>Slit JSON</span>
        </button>
        <button type="button" onClick={() => exportSlitValidationMarkdown(result)}>
          <FileDown size={15} />
          <span>Slit Markdown</span>
        </button>
      </div>
    </div>
  );
}

function CoherenceValidationPanel({
  result,
  explainMode = false,
  mode,
  setMode,
  gammaMagnitude,
  setGammaMagnitude,
  gammaPhaseDeg,
  setGammaPhaseDeg,
  wavelengthNm,
  setWavelengthNm,
  slitWidthUm,
  setSlitWidthUm,
  slitSeparationUm,
  setSlitSeparationUm,
  propagationDistanceM,
  setPropagationDistanceM
}: {
  result: CoherenceDemonstratorResult;
  explainMode?: boolean;
  mode: CoherenceDemonstratorMode;
  setMode: (value: CoherenceDemonstratorMode) => void;
  gammaMagnitude: number;
  setGammaMagnitude: (value: number) => void;
  gammaPhaseDeg: number;
  setGammaPhaseDeg: (value: number) => void;
  wavelengthNm: number;
  setWavelengthNm: (value: number) => void;
  slitWidthUm: number;
  setSlitWidthUm: (value: number) => void;
  slitSeparationUm: number;
  setSlitSeparationUm: (value: number) => void;
  propagationDistanceM: number;
  setPropagationDistanceM: (value: number) => void;
}) {
  return (
    <div className="maxwell-validation-mode-panel" aria-label="Coherence Demonstrator">
      <div className="l2-disclosure">
        <strong>Coherence Demonstrator: double slit</strong>
        <span>same double-slit layout, same wavelength, same geometry; only the complex degree of coherence changes the interference term</span>
      </div>
      <div className="maxwell-validation-pipeline">
        {[
          ["1. Source", `${wavelengthNm.toFixed(0)} nm monochromatic scalar source`],
          ["2. Slits", `two ideal long slits, d=${slitSeparationUm.toFixed(0)} um, a=${slitWidthUm.toFixed(0)} um`],
          ["3. Propagation", `${propagationDistanceM.toFixed(2)} m to a zero-thickness observation plane`],
          ["4. Coherence model", "coherent fields / partial gamma / incoherent intensities"],
          ["5. Observation", "maps, centerline profile, visibility metric, and order-spacing table"]
        ].map(([label, detail]) => (
          <div className="compact-stat" key={label}>
            <span>{label}</span>
            <strong>{detail}</strong>
          </div>
        ))}
      </div>
      <div className="profile-meta">
        <div className="compact-stat">
          <ExplainLabel entryId="coherence.mode" explainMode={explainMode}>Mode</ExplainLabel>
          <strong>{coherenceModeLabel(mode)}</strong>
        </div>
        <div className="compact-stat">
          <ExplainLabel entryId="coherence.gamma" explainMode={explainMode}>Degree of coherence |gamma12|</ExplainLabel>
          <strong>{result.config.coherence.gammaMagnitude.toFixed(2)}</strong>
        </div>
        <div className="compact-stat">
          <ExplainLabel entryId="coherence.visibility" explainMode={explainMode}>Fringe visibility V</ExplainLabel>
          <strong>{result.visibility.measured.toFixed(2)}</strong>
        </div>
        <div className="compact-stat">
          <span>Expected V</span>
          <strong>{result.visibility.expected.toFixed(2)}</strong>
        </div>
        <div className="compact-stat">
          <span>Visibility error</span>
          <strong>{result.visibility.error.toFixed(2)}</strong>
        </div>
        <div className="compact-stat">
          <ExplainLabel entryId="coherence.orderSpacing" explainMode={explainMode}>Order spacing</ExplainLabel>
          <strong>{formatMm(result.expected.orderSpacingSmallAngleM)} mm</strong>
        </div>
      </div>
      <div className="maxwell-validation-controls">
        <label className="field-row">
          <ExplainLabel entryId="coherence.mode" explainMode={explainMode}>Mode</ExplainLabel>
          <select value={mode} onChange={(event) => setMode(event.currentTarget.value as CoherenceDemonstratorMode)}>
            <option value="coherent-fields">Coherent fields</option>
            <option value="partial-coherence">Partial coherence</option>
            <option value="incoherent-intensities">Incoherent intensities</option>
          </select>
        </label>
        <NumberField label="Wavelength" explainId="validation.source.wavelength" explainMode={explainMode} value={wavelengthNm} unit="nm" min={350} max={800} step={1} onChange={(value) => setWavelengthNm(clamp(value, 350, 800))} />
        <NumberField label="Slit width a" explainId="coherence.slitGeometry" explainMode={explainMode} value={slitWidthUm} unit="um" min={2} max={200} step={1} onChange={(value) => setSlitWidthUm(clamp(value, 2, 200))} />
        <NumberField label="Slit separation d" explainId="coherence.slitGeometry" explainMode={explainMode} value={slitSeparationUm} unit="um" min={3} max={1000} step={1} onChange={(value) => setSlitSeparationUm(clamp(value, Math.max(3, slitWidthUm + 1), 1000))} />
        <NumberField label="Propagation L" explainId="validation.opticalZAxis" explainMode={explainMode} value={propagationDistanceM} unit="m" min={0.1} max={5} step={0.05} onChange={(value) => setPropagationDistanceM(clamp(value, 0.1, 5))} />
        <NumberField label="Gamma phase" explainId="coherence.gamma" explainMode={explainMode} value={gammaPhaseDeg} unit="deg" min={-180} max={180} step={1} onChange={(value) => setGammaPhaseDeg(clamp(value, -180, 180))} />
      </div>
      <label className="field-row">
        <ExplainLabel entryId="coherence.gamma" explainMode={explainMode}>Degree of coherence |gamma12|</ExplainLabel>
        <div className="maxwell-slider-control">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={clamp(gammaMagnitude, 0, 1)}
            onChange={(event) => setGammaMagnitude(Number(event.currentTarget.value))}
            onInput={(event) => setGammaMagnitude(Number(event.currentTarget.value))}
          />
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={formatNumberInputValue(gammaMagnitude)}
            onChange={(event) => setGammaMagnitude(clamp(Number(event.currentTarget.value), 0, 1))}
          />
          <strong>{clamp(gammaMagnitude, 0, 1).toFixed(2)}</strong>
        </div>
      </label>
      <div className="maxwell-layer-actions" aria-label="Coherence gamma presets">
        {[
          { value: 1, label: "Gamma 1.00" },
          { value: 0.5, label: "Gamma 0.50" },
          { value: 0, label: "Gamma 0.00" }
        ].map((preset) => (
          <button
            type="button"
            key={preset.label}
            onClick={() => {
              setMode("partial-coherence");
              setGammaMagnitude(preset.value);
              setGammaPhaseDeg(0);
            }}
          >
            <Sparkles size={15} />
            <span>{preset.label}</span>
          </button>
        ))}
      </div>
      <div className="l2-disclosure">
        <strong><ExplainLabel entryId="coherence.formula" explainMode={explainMode}>I = |U1|^2 + |U2|^2 + 2 Re(gamma12 U1 U2*)</ExplainLabel></strong>
        <span>V = (Imax - Imin) / (Imax + Imin); gamma=1 keeps coherent fringes, gamma=0 removes the interference term, and intermediate gamma fades fringe contrast</span>
      </div>
      <div className="explain-inline-row">
        <ExplainButton entryId="coherence.coherentFields" label="Under the hood: coherent fields" explainMode={explainMode} />
        <ExplainButton entryId="coherence.incoherentIntensities" label="Under the hood: incoherent intensities" explainMode={explainMode} />
        <ExplainButton entryId="coherence.gamma" label="Under the hood: gamma12" explainMode={explainMode} />
        <ExplainButton entryId="coherence.visibility" label="Under the hood: visibility" explainMode={explainMode} />
      </div>
      <div className="maxwell-validation-output-grid three">
        <div>
          <div className="maxwell-section-heading">
            <h2><ExplainLabel entryId="coherence.coherentFields" explainMode={explainMode}>Coherent Map</ExplainLabel></h2>
            <strong>sharp fringes</strong>
          </div>
          <ValidationIntensityMap field={result.coherentField} tone="numerical" ariaLabel="Coherent double-slit intensity map" />
        </div>
        <div>
          <div className="maxwell-section-heading">
            <h2><ExplainLabel entryId="coherence.incoherentIntensities" explainMode={explainMode}>Incoherent Map</ExplainLabel></h2>
            <strong>summed envelopes</strong>
          </div>
          <ValidationIntensityMap field={result.incoherentField} tone="analytic" ariaLabel="Incoherent double-slit intensity map" />
        </div>
        <div>
          <div className="maxwell-section-heading">
            <h2><ExplainLabel entryId="coherence.gamma" explainMode={explainMode}>Partial-Coherence Map</ExplainLabel></h2>
            <strong>|gamma12| {result.config.coherence.gammaMagnitude.toFixed(2)}</strong>
          </div>
          <ValidationIntensityMap field={result.partialField} tone="numerical" ariaLabel="Partial-coherence double-slit intensity map" />
        </div>
      </div>
      <div className="maxwell-validation-output-grid">
        <div className="maxwell-validation-profile-panel">
          <div className="maxwell-section-heading">
            <h2><ExplainLabel entryId="coherence.visibility" explainMode={explainMode}>Centerline Profile</ExplainLabel></h2>
            <div className="maxwell-heading-actions">
              <strong>fringe visibility</strong>
              <ExplainButton entryId="coherence.visibility" label="Where is this?" explainMode={explainMode} />
            </div>
          </div>
          <CoherenceProfilePlot result={result} />
          <WhereMeasuredBlock entryId="validation.whereMeasured" explainMode={explainMode}>
            Profile and visibility are extracted from the zero-thickness observation plane {formatMm(result.config.propagationDistanceM)} mm downstream of the two ideal slits.
            The profile is an analysis view of the observation plane, not a physical element.
          </WhereMeasuredBlock>
        </div>
        <div className="maxwell-validation-profile-panel">
          <div className="maxwell-section-heading">
            <h2>Interference-Term Map</h2>
            <strong>|partial - incoherent|</strong>
          </div>
          <ValidationIntensityMap field={result.interferenceField} tone="residual" ariaLabel="Coherence interference term magnitude map" />
          <CoherenceInterferencePlot result={result} />
        </div>
      </div>
      <div className="maxwell-order-table" aria-label="Coherence demonstrator order table">
        {result.expected.features
          .filter((feature) => Math.abs(feature.order) <= 2)
          .map((feature) => (
            <div className="compact-stat" key={feature.order}>
              <span>Order m={feature.order}</span>
              <strong>
                expected {formatMm(feature.expectedPositionM)} mm / measured {feature.measuredPositionM === null ? "n/a" : `${formatMm(feature.measuredPositionM)} mm`}
              </strong>
            </div>
          ))}
      </div>
      <ul className="warning-list">
        {result.warnings.map((warning) => (
          <li key={warning.code}>{warning.message}</li>
        ))}
      </ul>
      <div className="maxwell-layer-actions">
        <button type="button" onClick={() => setGammaMagnitude(clamp(gammaMagnitude, 0, 1))}>
          <Sparkles size={15} />
          <span>Run Coherence Demo</span>
        </button>
        <button type="button" onClick={() => exportCoherenceJson(result)}>
          <Save size={15} />
          <span>Coherence JSON</span>
        </button>
        <button type="button" onClick={() => exportCoherenceMarkdown(result)}>
          <FileDown size={15} />
          <span>Coherence Markdown</span>
        </button>
        <button type="button" onClick={() => exportCoherenceCsv(result)}>
          <FileDown size={15} />
          <span>Coherence CSV</span>
        </button>
      </div>
    </div>
  );
}

function ThinLensValidationPanel({
  result,
  pipeline,
  explainMode = false,
  wavelengthNm,
  setWavelengthNm,
  focalLengthMm,
  setFocalLengthMm,
  pupilDiameterUm,
  setPupilDiameterUm,
  observationZMm,
  setObservationZMm,
  planeSizeUm,
  setPlaneSizeUm,
  resolution,
  setResolution,
  focusRangeMm,
  setFocusRangeMm
}: {
  result: ThinLensFocalValidationResult;
  pipeline: ReturnType<typeof thinLensFocalValidationPipeline>;
  explainMode?: boolean;
  wavelengthNm: number;
  setWavelengthNm: (value: number) => void;
  focalLengthMm: number;
  setFocalLengthMm: (value: number) => void;
  pupilDiameterUm: number;
  setPupilDiameterUm: (value: number) => void;
  observationZMm: number;
  setObservationZMm: (value: number) => void;
  planeSizeUm: number;
  setPlaneSizeUm: (value: number) => void;
  resolution: number;
  setResolution: (value: number) => void;
  focusRangeMm: number;
  setFocusRangeMm: (value: number) => void;
}) {
  const minZMm = Math.max(1, focalLengthMm - focusRangeMm);
  const maxZMm = focalLengthMm + focusRangeMm;
  const sliderZMm = clamp(observationZMm, minZMm, maxZMm);

  return (
    <div className="maxwell-validation-mode-panel">
      <div className="l2-disclosure">
        <strong>Ideal thin lens focal-plane validation</strong>
        <span>coherent plane wave through a circular pupil and zero-thickness lens phase mask; hand check r1 ~= 1.22 lambda f / D = 61 um</span>
      </div>
      <div className="maxwell-validation-pipeline">
        {pipeline.map((step) => (
          <div className="compact-stat" key={step.index}>
            <span>
              {step.index}. {step.label}
            </span>
            <strong>{step.detail}</strong>
          </div>
        ))}
      </div>
      <div className="profile-meta">
        <div className="compact-stat">
          <ExplainLabel entryId="validation.source.wavelength" explainMode={explainMode}>Source</ExplainLabel>
          <strong>{wavelengthNm.toFixed(0)} nm coherent plane wave</strong>
        </div>
        <div className="compact-stat">
          <ExplainLabel entryId="validation.lens.thinLensPhase" explainMode={explainMode}>Lens phase</ExplainLabel>
          <strong>zero-thickness quadratic mask</strong>
        </div>
        <div className="compact-stat">
          <ExplainLabel entryId="validation.lens.pupil" explainMode={explainMode}>Pupil</ExplainLabel>
          <strong>{pupilDiameterUm.toFixed(0)} um circular clear aperture</strong>
        </div>
        <div className="compact-stat">
          <ExplainLabel entryId="validation.lens.airyRadius" explainMode={explainMode}>Expected first dark</ExplainLabel>
          <strong>{formatUm(result.expected.firstDarkRadiusM)} um</strong>
        </div>
        <div className="compact-stat">
          <span>Measured first dark</span>
          <strong>{result.comparison.measuredFirstDarkRadiusM === null ? result.comparison.firstDarkSearchStatus : `${formatUm(result.comparison.measuredFirstDarkRadiusM)} um`}</strong>
        </div>
        <div className="compact-stat">
          <ExplainLabel entryId="validation.rmsResidual" explainMode={explainMode}>RMS residual</ExplainLabel>
          <strong>{result.residuals.rmsResidual.toExponential(2)}</strong>
        </div>
        <div className="compact-stat">
          <ExplainLabel entryId="validation.maxResidual" explainMode={explainMode}>Max residual</ExplainLabel>
          <strong>{result.residuals.maxResidual.toExponential(2)}</strong>
        </div>
        <div className="compact-stat">
          <ExplainLabel entryId="validation.lens.focusMetric" explainMode={explainMode}>Best focus z</ExplainLabel>
          <strong>{formatMm(result.comparison.focus.bestFocusZM)} mm</strong>
        </div>
      </div>
      <div className="maxwell-validation-controls">
        <NumberField label="Wavelength" explainId="validation.source.wavelength" explainMode={explainMode} value={wavelengthNm} unit="nm" min={350} max={800} step={1} onChange={(value) => setWavelengthNm(clamp(value, 350, 800))} />
        <NumberField label="Focal length" explainId="validation.lens.focalLength" explainMode={explainMode} value={focalLengthMm} unit="mm" min={1} max={100} step={0.25} onChange={(value) => setFocalLengthMm(clamp(value, 1, 100))} />
        <NumberField label="Pupil D" explainId="validation.lens.pupil" explainMode={explainMode} value={pupilDiameterUm} unit="um" min={20} max={1000} step={5} onChange={(value) => setPupilDiameterUm(clamp(value, 20, 1000))} />
        <NumberField label="Plane size" explainId="validation.observation.planeSize" explainMode={explainMode} value={planeSizeUm} unit="um" min={40} max={1200} step={5} onChange={(value) => setPlaneSizeUm(clamp(value, 40, 1200))} />
        <NumberField label="Map grid" explainId="validation.samplingControls" explainMode={explainMode} value={resolution} unit="px" min={65} max={513} step={2} onChange={(value) => setResolution(oddInteger(value, 65, 513))} />
        <NumberField label="Focus range" explainId="validation.lens.focusMetric" explainMode={explainMode} value={focusRangeMm} unit="mm" min={0.2} max={10} step={0.1} onChange={(value) => setFocusRangeMm(clamp(value, 0.2, 10))} />
      </div>
      <label className="field-row">
        <ExplainLabel entryId="validation.observation.zPlane" explainMode={explainMode}>Observation z</ExplainLabel>
        <div className="maxwell-slider-control">
          <input
            type="range"
            min={minZMm}
            max={maxZMm}
            step={0.05}
            value={sliderZMm}
            onChange={(event) => setObservationZMm(Number(event.currentTarget.value))}
            onInput={(event) => setObservationZMm(Number(event.currentTarget.value))}
          />
          <input
            type="number"
            min={1}
            max={120}
            step={0.05}
            value={formatNumberInputValue(observationZMm)}
            onChange={(event) => setObservationZMm(clamp(Number(event.currentTarget.value), 1, 120))}
          />
          <strong>{observationZMm.toFixed(2)} mm</strong>
        </div>
      </label>
      <div className="error-banner">
        Expected first dark ring is {formatUm(result.expected.firstDarkRadiusM)} um. Current plane half-width is {formatUm(result.expected.planeHalfWidthM)} um.
        {!result.expected.firstDarkInsidePlane && " Warning: the field of view does not include the first dark ring."}
      </div>
      <div className="explain-inline-row">
        <ExplainButton entryId="validation.lens.thinLensPhase" label="Under the hood: thin-lens phase" explainMode={explainMode} />
        <ExplainButton entryId="validation.lens.airyRadius" label="Under the hood: focal Airy radius" explainMode={explainMode} />
        <ExplainButton entryId="validation.lens.scalarLimitations" label="Under the hood: lens limitations" explainMode={explainMode} />
      </div>
      <div className="maxwell-validation-output-grid three">
        <div>
          <div className="maxwell-section-heading">
            <h2><ExplainLabel entryId="validation.numericalPropagation.huygensFresnel" explainMode={explainMode}>Numerical Focal Map</ExplainLabel></h2>
            <strong>computed</strong>
          </div>
          <ValidationIntensityMap field={result.numericalField} tone="numerical" ariaLabel="Ideal thin lens numerical focal-plane intensity map" />
        </div>
        <div>
          <div className="maxwell-section-heading">
            <h2><ExplainLabel entryId="validation.lens.airyRadius" explainMode={explainMode}>Analytic Airy Map</ExplainLabel></h2>
            <strong>Airy PSF</strong>
          </div>
          <ValidationIntensityMap field={result.analyticField} tone="analytic" ariaLabel="Ideal thin lens analytic Airy focal-plane map" />
        </div>
        <div>
          <div className="maxwell-section-heading">
            <h2><ExplainLabel entryId="validation.residualMap" explainMode={explainMode}>Residual Map</ExplainLabel></h2>
            <strong>|numerical - analytic|</strong>
          </div>
          <ValidationIntensityMap field={result.residualField} tone="residual" ariaLabel="Ideal thin lens focal-plane residual map" />
        </div>
      </div>
      <div className="maxwell-validation-output-grid">
        <div className="maxwell-validation-profile-panel">
          <div className="maxwell-section-heading">
            <h2><ExplainLabel entryId="validation.radialOverlay" explainMode={explainMode}>Radial Overlay</ExplainLabel></h2>
            <div className="maxwell-heading-actions">
              <strong>numerical vs Airy</strong>
              <ExplainButton entryId="validation.radialOverlay" label="Where is this?" explainMode={explainMode} />
            </div>
          </div>
          <ThinLensRadialPlot result={result} />
          <WhereMeasuredBlock entryId="validation.whereMeasured" explainMode={explainMode}>
            Extracted from the zero-thickness focal observation plane at z = {formatMm(result.config.observationPlane.zM)} mm.
            The ideal lens plane is at z = {formatMm(result.config.lens.zM)} mm and the sampled field of view is {formatUm(result.config.observationPlane.sizeM)} um x {formatUm(result.config.observationPlane.sizeM)} um.
            The radial overlay is an analysis view, not a physical element.
          </WhereMeasuredBlock>
        </div>
        <div className="maxwell-validation-profile-panel">
          <div className="maxwell-section-heading">
            <h2><ExplainLabel entryId="validation.residualCurve" explainMode={explainMode}>Residual Curve</ExplainLabel></h2>
            <div className="maxwell-heading-actions">
              <strong>signed mismatch</strong>
              <ExplainButton entryId="validation.residualCurve" label="Where is this?" explainMode={explainMode} />
            </div>
          </div>
          <ThinLensResidualPlot result={result} />
          <WhereMeasuredBlock entryId="validation.whereMeasured" explainMode={explainMode}>
            Computed at the same zero-thickness focal observation plane. The residual curve compares sampled numerical
            focal intensity against the analytic Airy PSF profile.
          </WhereMeasuredBlock>
        </div>
      </div>
      <div className="maxwell-validation-profile-panel">
        <div className="maxwell-section-heading">
          <h2><ExplainLabel entryId="validation.lens.focusMetric" explainMode={explainMode}>Focus Scan</ExplainLabel></h2>
          <strong>peak near z=f</strong>
        </div>
        <ThinLensFocusScanPlot result={result} />
      </div>
      <ul className="warning-list">
        {result.warnings.map((warning) => (
          <li key={warning.code}>{warning.message}</li>
        ))}
      </ul>
      <div className="maxwell-layer-actions">
        <button type="button" onClick={() => setObservationZMm(focalLengthMm)}>
          <Sparkles size={15} />
          <span>Run Lens Benchmark</span>
        </button>
        <button type="button" onClick={() => exportThinLensValidationJson(result)}>
          <Save size={15} />
          <span>Lens JSON</span>
        </button>
        <button type="button" onClick={() => exportThinLensValidationMarkdown(result)}>
          <FileDown size={15} />
          <span>Lens Markdown</span>
        </button>
        <button type="button" onClick={() => exportThinLensValidationCsv(result)}>
          <FileDown size={15} />
          <span>Lens CSV</span>
        </button>
      </div>
    </div>
  );
}

function AdvisorReviewPanel({ review }: { review: AdvisorValidationReviewResult }) {
  const summaries = [review.circular, review.singleSlit, review.doubleSlit, review.thinLens, review.coherence];
  return (
    <div className="maxwell-validation-mode-panel" aria-label="Advisor Review Mode">
      <div className="l2-disclosure">
        <strong>Run Advisor Review</strong>
        <span>one-click report for circular pinhole, long slit sinc^2, double-slit order spacing, ideal thin-lens focal-plane, and coherence demonstrator validations</span>
      </div>
      <div className="maxwell-advisor-grid">
        {summaries.map((summary) => (
          <div className={`maxwell-advisor-card ${summary.status}`} key={summary.id}>
            <div className="maxwell-section-heading">
              <h2>{summary.benchmark}</h2>
              <strong>{summary.status}</strong>
            </div>
            <div className="compact-stat">
              <span>Expected</span>
              <strong>{summary.expected}</strong>
            </div>
            <div className="compact-stat">
              <span>Measured</span>
              <strong>{summary.measured}</strong>
            </div>
            <div className="compact-stat">
              <span>Residuals</span>
              <strong>
                RMS {summary.rmsResidual.toExponential(2)} / max {summary.maxResidual.toExponential(2)}
              </strong>
            </div>
          </div>
        ))}
      </div>
      <ul className="warning-list">
        {review.warnings.slice(0, 8).map((warning, index) => (
          <li key={`${warning.elementId ?? "review"}-${warning.code}-${index}`}>{warning.elementId ? `${warning.elementId}: ` : ""}{warning.message}</li>
        ))}
      </ul>
      <div className="maxwell-layer-actions">
        <button type="button" onClick={() => exportAdvisorReviewMarkdown(review)}>
          <FileDown size={15} />
          <span>Advisor Markdown</span>
        </button>
        <button type="button" onClick={() => exportAdvisorReviewJson(review)}>
          <Save size={15} />
          <span>Advisor JSON</span>
        </button>
        <button type="button" onClick={() => exportAdvisorReviewCsv(review)}>
          <FileDown size={15} />
          <span>Advisor CSV</span>
        </button>
      </div>
    </div>
  );
}

function ValidationIntensityMap({ field, tone, ariaLabel }: { field: FieldOutput2D; tone: "numerical" | "analytic" | "residual"; ariaLabel: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = field.width;
    const height = field.height;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;
    const image = context.createImageData(width, height);
    for (let index = 0; index < field.intensity.length; index += 1) {
      const value = Math.pow(clamp(field.intensity[index] ?? 0, 0, 1), tone === "residual" ? 0.5 : 0.38);
      const offset = index * 4;
      if (tone === "residual") {
        image.data[offset] = Math.round(24 + 226 * value);
        image.data[offset + 1] = Math.round(44 + 120 * (1 - value));
        image.data[offset + 2] = Math.round(78 + 30 * (1 - value));
      } else if (tone === "analytic") {
        image.data[offset] = Math.round(22 + 170 * value);
        image.data[offset + 1] = Math.round(38 + 190 * value);
        image.data[offset + 2] = Math.round(66 + 130 * value);
      } else {
        image.data[offset] = Math.round(18 + 224 * value);
        image.data[offset + 1] = Math.round(34 + 170 * value);
        image.data[offset + 2] = Math.round(52 + 72 * value);
      }
      image.data[offset + 3] = 255;
    }
    context.putImageData(image, 0, 0);
  }, [field, tone]);

  return <canvas className={`maxwell-validation-map ${tone}`} ref={canvasRef} aria-label={ariaLabel} />;
}

function ValidationRadialPlot({ result }: { result: CircularApertureValidationResult }) {
  const width = 720;
  const height = 190;
  const pad = 24;
  const usableWidth = width - pad * 2;
  const usableHeight = height - pad * 2;
  const maxRadiusM = result.radialProfile[result.radialProfile.length - 1]?.radiusM ?? 1;
  const modelPoints = result.radialProfile.map((sample) => plotPoint(sample.radiusM, sample.modelIntensity)).join(" ");
  const analyticPoints = result.radialProfile.map((sample) => plotPoint(sample.radiusM, sample.analyticIntensity)).join(" ");
  const markerX = pad + usableWidth * Math.min(1, result.expected.firstMinimumRadiusM / maxRadiusM);
  const markerLabel = result.expected.firstMinimumRadiusM <= maxRadiusM ? "first min" : "first min outside";

  function plotPoint(radiusM: number, intensity: number): string {
    const x = pad + usableWidth * (radiusM / maxRadiusM);
    const y = pad + usableHeight * (1 - clamp(intensity, 0, 1));
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }

  return (
    <svg className="maxwell-validation-profile" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Radial Airy Bessel analytic overlay and model profile">
      <rect x="0" y="0" width={width} height={height} />
      <line className="profile-axis" x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} />
      <line className="profile-axis" x1={pad} y1={pad} x2={pad} y2={height - pad} />
      <polyline className="maxwell-validation-analytic-line" points={analyticPoints} />
      <polyline className="maxwell-validation-model-line" points={modelPoints} />
      <line className="maxwell-validation-marker" x1={markerX} y1={pad} x2={markerX} y2={height - pad} />
      <text x={Math.max(pad + 4, markerX - 92)} y={pad + 13}>
        {markerLabel}
      </text>
      <text x={pad} y={height - 6}>
        0 mm
      </text>
      <text x={width - pad - 76} y={height - 6}>
        {formatMm(maxRadiusM)} mm
      </text>
    </svg>
  );
}

function ValidationResidualPlot({ result }: { result: CircularApertureValidationResult }) {
  const width = 720;
  const height = 190;
  const pad = 24;
  const usableWidth = width - pad * 2;
  const usableHeight = height - pad * 2;
  const maxRadiusM = result.radialProfile[result.radialProfile.length - 1]?.radiusM ?? 1;
  const maxResidual = Math.max(1e-12, result.residuals.maxResidual);
  const zeroY = pad + usableHeight / 2;
  const points = result.radialProfile
    .map((sample) => {
      const x = pad + usableWidth * (sample.radiusM / maxRadiusM);
      const y = zeroY - (usableHeight / 2) * clamp(sample.residual / maxResidual, -1, 1);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg className="maxwell-validation-profile" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Numerical minus analytic radial residual curve">
      <rect x="0" y="0" width={width} height={height} />
      <line className="profile-axis" x1={pad} y1={zeroY} x2={width - pad} y2={zeroY} />
      <line className="profile-axis" x1={pad} y1={pad} x2={pad} y2={height - pad} />
      <polyline className="maxwell-validation-residual-line" points={points} />
      <text x={pad} y={height - 6}>
        0 mm
      </text>
      <text x={width - pad - 76} y={height - 6}>
        {formatMm(maxRadiusM)} mm
      </text>
      <text x={pad + 4} y={pad + 12}>
        max residual {maxResidual.toExponential(1)}
      </text>
    </svg>
  );
}

function SlitProfilePlot({ result }: { result: SlitOrderValidationResult }) {
  const width = 720;
  const height = 190;
  const pad = 24;
  const usableWidth = width - pad * 2;
  const usableHeight = height - pad * 2;
  const minPositionM = result.profile[0]?.positionM ?? -1;
  const maxPositionM = result.profile[result.profile.length - 1]?.positionM ?? 1;
  const spanM = maxPositionM - minPositionM;
  const numericalPoints = result.profile.map((sample) => plotPoint(sample.positionM, sample.numericalIntensity)).join(" ");
  const analyticPoints = result.profile.map((sample) => plotPoint(sample.positionM, sample.analyticIntensity)).join(" ");
  const markerLines = result.expected.features
    .filter((feature) => feature.visible)
    .map((feature) => {
      const x = pad + usableWidth * ((feature.expectedPositionM - minPositionM) / spanM);
      return <line className="maxwell-validation-marker" key={feature.order} x1={x} y1={pad} x2={x} y2={height - pad} />;
    });

  function plotPoint(positionM: number, intensity: number): string {
    const x = pad + usableWidth * ((positionM - minPositionM) / spanM);
    const y = pad + usableHeight * (1 - clamp(intensity, 0, 1));
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }

  return (
    <svg className="maxwell-validation-profile" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${result.label} centerline numerical and analytic overlay`}>
      <rect x="0" y="0" width={width} height={height} />
      <line className="profile-axis" x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} />
      <line className="profile-axis" x1={pad} y1={pad} x2={pad} y2={height - pad} />
      <polyline className="maxwell-validation-analytic-line" points={analyticPoints} />
      <polyline className="maxwell-validation-model-line" points={numericalPoints} />
      {markerLines}
      <text x={pad} y={height - 6}>
        {formatMm(minPositionM)} mm
      </text>
      <text x={width - pad - 82} y={height - 6}>
        {formatMm(maxPositionM)} mm
      </text>
      <text x={pad + 4} y={pad + 12}>
        {result.config.kind === "long-single-slit-sinc2" ? "minima markers" : "order markers"}
      </text>
    </svg>
  );
}

function SlitResidualPlot({ result }: { result: SlitOrderValidationResult }) {
  const width = 720;
  const height = 190;
  const pad = 24;
  const usableWidth = width - pad * 2;
  const usableHeight = height - pad * 2;
  const minPositionM = result.profile[0]?.positionM ?? -1;
  const maxPositionM = result.profile[result.profile.length - 1]?.positionM ?? 1;
  const spanM = maxPositionM - minPositionM;
  const maxResidual = Math.max(1e-12, result.residuals.maxResidual);
  const zeroY = pad + usableHeight / 2;
  const points = result.profile
    .map((sample) => {
      const x = pad + usableWidth * ((sample.positionM - minPositionM) / spanM);
      const y = zeroY - (usableHeight / 2) * clamp(sample.residual / maxResidual, -1, 1);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg className="maxwell-validation-profile" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${result.label} signed residual curve`}>
      <rect x="0" y="0" width={width} height={height} />
      <line className="profile-axis" x1={pad} y1={zeroY} x2={width - pad} y2={zeroY} />
      <line className="profile-axis" x1={pad} y1={pad} x2={pad} y2={height - pad} />
      <polyline className="maxwell-validation-residual-line" points={points} />
      <text x={pad} y={height - 6}>
        {formatMm(minPositionM)} mm
      </text>
      <text x={width - pad - 82} y={height - 6}>
        {formatMm(maxPositionM)} mm
      </text>
      <text x={pad + 4} y={pad + 12}>
        max residual {maxResidual.toExponential(1)}
      </text>
    </svg>
  );
}

function CoherenceProfilePlot({ result }: { result: CoherenceDemonstratorResult }) {
  const width = 720;
  const height = 190;
  const pad = 24;
  const usableWidth = width - pad * 2;
  const usableHeight = height - pad * 2;
  const minPositionM = result.profile[0]?.positionM ?? -1;
  const maxPositionM = result.profile[result.profile.length - 1]?.positionM ?? 1;
  const spanM = maxPositionM - minPositionM;
  const coherentPoints = result.profile.map((sample) => plotPoint(sample.positionM, sample.coherentIntensity)).join(" ");
  const incoherentPoints = result.profile.map((sample) => plotPoint(sample.positionM, sample.incoherentIntensity)).join(" ");
  const partialPoints = result.profile.map((sample) => plotPoint(sample.positionM, sample.partialIntensity)).join(" ");
  const markerLines = result.expected.features
    .filter((feature) => feature.visible)
    .map((feature) => {
      const x = pad + usableWidth * ((feature.expectedPositionM - minPositionM) / spanM);
      return <line className="maxwell-validation-marker" key={feature.order} x1={x} y1={pad} x2={x} y2={height - pad} />;
    });

  function plotPoint(positionM: number, intensity: number): string {
    const x = pad + usableWidth * ((positionM - minPositionM) / spanM);
    const y = pad + usableHeight * (1 - clamp(intensity, 0, 1));
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }

  return (
    <svg className="maxwell-validation-profile" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Coherence demonstrator centerline profile overlay">
      <rect x="0" y="0" width={width} height={height} />
      <line className="profile-axis" x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} />
      <line className="profile-axis" x1={pad} y1={pad} x2={pad} y2={height - pad} />
      <polyline className="maxwell-validation-analytic-line" points={coherentPoints} />
      <polyline className="maxwell-validation-residual-line" points={incoherentPoints} />
      <polyline className="maxwell-validation-model-line" points={partialPoints} />
      {markerLines}
      <text x={pad} y={height - 6}>
        {formatMm(minPositionM)} mm
      </text>
      <text x={width - pad - 82} y={height - 6}>
        {formatMm(maxPositionM)} mm
      </text>
      <text x={pad + 4} y={pad + 12}>
        coherent / incoherent / partial
      </text>
      <text x={pad + 4} y={pad + 28}>
        V {result.visibility.measured.toFixed(2)} expected {result.visibility.expected.toFixed(2)}
      </text>
    </svg>
  );
}

function CoherenceInterferencePlot({ result }: { result: CoherenceDemonstratorResult }) {
  const width = 720;
  const height = 120;
  const pad = 20;
  const usableWidth = width - pad * 2;
  const usableHeight = height - pad * 2;
  const minPositionM = result.profile[0]?.positionM ?? -1;
  const maxPositionM = result.profile[result.profile.length - 1]?.positionM ?? 1;
  const spanM = maxPositionM - minPositionM;
  const zeroY = pad + usableHeight / 2;
  const points = result.profile
    .map((sample) => {
      const x = pad + usableWidth * ((sample.positionM - minPositionM) / spanM);
      const y = zeroY - (usableHeight / 2) * clamp(sample.interferenceTerm, -1, 1);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg className="maxwell-validation-profile" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Signed coherence interference term curve">
      <rect x="0" y="0" width={width} height={height} />
      <line className="profile-axis" x1={pad} y1={zeroY} x2={width - pad} y2={zeroY} />
      <line className="profile-axis" x1={pad} y1={pad} x2={pad} y2={height - pad} />
      <polyline className="maxwell-validation-residual-line" points={points} />
      <text x={pad} y={height - 6}>
        {formatMm(minPositionM)} mm
      </text>
      <text x={width - pad - 82} y={height - 6}>
        {formatMm(maxPositionM)} mm
      </text>
      <text x={pad + 4} y={pad + 12}>
        signed interference term
      </text>
    </svg>
  );
}

function ThinLensRadialPlot({ result }: { result: ThinLensFocalValidationResult }) {
  const width = 720;
  const height = 190;
  const pad = 24;
  const usableWidth = width - pad * 2;
  const usableHeight = height - pad * 2;
  const maxRadiusM = result.radialProfile[result.radialProfile.length - 1]?.radiusM ?? 1;
  const numericalPoints = result.radialProfile.map((sample) => plotPoint(sample.radiusM, sample.numericalIntensity)).join(" ");
  const analyticPoints = result.radialProfile.map((sample) => plotPoint(sample.radiusM, sample.analyticIntensity)).join(" ");
  const markerX = pad + usableWidth * Math.min(1, result.expected.firstDarkRadiusM / maxRadiusM);
  const markerLabel = result.expected.firstDarkRadiusM <= maxRadiusM ? "first dark" : "first dark outside";

  function plotPoint(radiusM: number, intensity: number): string {
    const x = pad + usableWidth * (radiusM / maxRadiusM);
    const y = pad + usableHeight * (1 - clamp(intensity, 0, 1));
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }

  return (
    <svg className="maxwell-validation-profile" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Thin lens focal-plane radial Airy overlay">
      <rect x="0" y="0" width={width} height={height} />
      <line className="profile-axis" x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} />
      <line className="profile-axis" x1={pad} y1={pad} x2={pad} y2={height - pad} />
      <polyline className="maxwell-validation-analytic-line" points={analyticPoints} />
      <polyline className="maxwell-validation-model-line" points={numericalPoints} />
      <line className="maxwell-validation-marker" x1={markerX} y1={pad} x2={markerX} y2={height - pad} />
      <text x={Math.max(pad + 4, markerX - 100)} y={pad + 13}>
        {markerLabel}
      </text>
      <text x={pad} y={height - 6}>
        0 um
      </text>
      <text x={width - pad - 84} y={height - 6}>
        {formatUm(maxRadiusM)} um
      </text>
    </svg>
  );
}

function ThinLensResidualPlot({ result }: { result: ThinLensFocalValidationResult }) {
  const width = 720;
  const height = 190;
  const pad = 24;
  const usableWidth = width - pad * 2;
  const usableHeight = height - pad * 2;
  const maxRadiusM = result.radialProfile[result.radialProfile.length - 1]?.radiusM ?? 1;
  const maxResidual = Math.max(1e-12, result.residuals.maxResidual);
  const zeroY = pad + usableHeight / 2;
  const points = result.radialProfile
    .map((sample) => {
      const x = pad + usableWidth * (sample.radiusM / maxRadiusM);
      const y = zeroY - (usableHeight / 2) * clamp(sample.residual / maxResidual, -1, 1);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg className="maxwell-validation-profile" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Thin lens numerical minus analytic radial residual curve">
      <rect x="0" y="0" width={width} height={height} />
      <line className="profile-axis" x1={pad} y1={zeroY} x2={width - pad} y2={zeroY} />
      <line className="profile-axis" x1={pad} y1={pad} x2={pad} y2={height - pad} />
      <polyline className="maxwell-validation-residual-line" points={points} />
      <text x={pad} y={height - 6}>
        0 um
      </text>
      <text x={width - pad - 84} y={height - 6}>
        {formatUm(maxRadiusM)} um
      </text>
      <text x={pad + 4} y={pad + 12}>
        max residual {maxResidual.toExponential(1)}
      </text>
    </svg>
  );
}

function ThinLensFocusScanPlot({ result }: { result: ThinLensFocalValidationResult }) {
  const width = 720;
  const height = 190;
  const pad = 24;
  const usableWidth = width - pad * 2;
  const usableHeight = height - pad * 2;
  const minZM = result.focusScan[0]?.zM ?? result.config.lens.focalLengthM;
  const maxZM = result.focusScan[result.focusScan.length - 1]?.zM ?? result.config.lens.focalLengthM;
  const spanZM = Math.max(1e-12, maxZM - minZM);
  const points = result.focusScan
    .map((sample) => {
      const x = pad + usableWidth * ((sample.zM - minZM) / spanZM);
      const y = pad + usableHeight * (1 - clamp(sample.centerIntensityRelative, 0, 1));
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const focalX = pad + usableWidth * ((result.config.lens.focalLengthM - minZM) / spanZM);
  const currentX = pad + usableWidth * ((result.config.observationPlane.zM - minZM) / spanZM);

  return (
    <svg className="maxwell-validation-profile" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Thin lens relative center intensity focus scan">
      <rect x="0" y="0" width={width} height={height} />
      <line className="profile-axis" x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} />
      <line className="profile-axis" x1={pad} y1={pad} x2={pad} y2={height - pad} />
      <polyline className="maxwell-validation-model-line" points={points} />
      <line className="maxwell-validation-marker" x1={focalX} y1={pad} x2={focalX} y2={height - pad} />
      <line className="maxwell-validation-residual-line" x1={currentX} y1={pad} x2={currentX} y2={height - pad} />
      <text x={Math.max(pad + 4, focalX - 44)} y={pad + 13}>
        z=f
      </text>
      <text x={pad} y={height - 6}>
        {formatMm(minZM)} mm
      </text>
      <text x={width - pad - 82} y={height - 6}>
        {formatMm(maxZM)} mm
      </text>
      <text x={pad + 4} y={pad + 30}>
        current {formatMm(result.config.observationPlane.zM)} mm
      </text>
    </svg>
  );
}

function exportStackJson(
  stack: CoatingStackDefinition,
  materialCatalog: MaxwellMaterialCatalog,
  run: CoatingStackRunResult,
  sweep: CoatingSweepResult,
  foundry: CoatingDesignResult,
  yieldAnalysis: CoatingYieldResult
): void {
  const design = serializeCoatingStackDesign(stack, materialCatalog);
  downloadText("l63-slit-order-validation-stack.json", "application/json", JSON.stringify({ solverBackend: run.solverBackend, design, run, sweep, foundry, yieldAnalysis }, null, 2));
}

function exportStackSummary(run: CoatingStackRunResult, sweep: CoatingSweepResult, foundry: CoatingDesignResult, yieldAnalysis: CoatingYieldResult): void {
  downloadText(
    "l54-coating-material-selection-stack.md",
    "text/markdown",
    [
      `# ${run.label}`,
      "",
      `Analysis: ${run.provenance.label}`,
      `Solver backend: ${run.solverBackend.label}`,
      `Solver method: ${run.solverBackend.method}`,
      `Backend dimensions: ${run.solverBackend.capabilities.dimensions.join(", ")}`,
      `Unsupported: ${run.solverBackend.unsupported.join(", ")}`,
      `Wavelength: ${(run.tmm.wavelengthM * 1e9).toFixed(2)} nm`,
      `Angle: ${degFromRad(run.tmm.angleRad).toFixed(2)} deg`,
      `Polarization: ${run.tmm.polarization}`,
      "",
      `Reflectance: ${formatPercent(run.tmm.reflectance)}`,
      `Transmittance: ${formatPercent(run.tmm.transmittance)}`,
      `Absorbance: ${formatPercent(run.tmm.absorbance)}`,
      `Energy balance error: ${run.tmm.energyBalanceError.toExponential(3)}`,
      `Stack hash: ${run.resultHash}`,
      `Monitor hash: ${run.fieldMonitor.resultHash}`,
      `Sweep hash: ${sweep.resultHash}`,
      `Foundry hash: ${foundry.resultHash}`,
      `Yield hash: ${yieldAnalysis.resultHash}`,
      "",
      "Material references:",
      ...run.materialCatalogRefs.map((reference) => `- ${reference.label}: ${reference.materialId} / ${reference.materialHash}`),
      "",
      "Planar field monitor:",
      `- Max |E|^2: ${run.fieldMonitor.maxElectricIntensity.toExponential(3)}`,
      `- Layer absorption sum: ${formatPercent(run.fieldMonitor.aggregateLayerAbsorbance)}`,
      ...run.fieldMonitor.layerFlux.map((layer) => `- ${layer.label}: ${formatPercent(layer.absorbedFlux)}`),
      "",
      "Design foundry:",
      `- Objective: ${foundry.objective.label}`,
      `- Seed score: ${foundry.seed.score.toExponential(3)}`,
      `- Best score: ${foundry.best.score.toExponential(3)}`,
      `- Best mean reflectance: ${formatPercent(foundry.best.metrics.meanReflectance)}`,
      `- Best max reflectance: ${formatPercent(foundry.best.metrics.maxReflectance)}`,
      `- Certified run hash: ${foundry.best.certifiedRun.resultHash}`,
      ...foundry.best.stack.layers.map((layer) => `- ${layer.label}: ${(layer.thicknessM * 1e9).toFixed(3)} nm`),
      "",
      "Tolerance yield:",
      `- Pass rate: ${formatPercent(yieldAnalysis.passRate)}`,
      `- 95% CI: ${formatInterval(yieldAnalysis.confidenceInterval.lower, yieldAnalysis.confidenceInterval.upper)}`,
      `- Samples: ${yieldAnalysis.samples.length}`,
      `- Worst score: ${yieldAnalysis.worstSample.score.toExponential(3)}`,
      ...yieldAnalysis.requirements.map(
        (requirement) =>
          `- ${requirement.requirement.label}: ${formatPercent(requirement.passRate)} pass, worst ${formatMetric(requirement.requirement.metric, requirement.worstValue)}`
      ),
      ...yieldAnalysis.sensitivities.slice(0, 3).map((sensitivity) => `- sensitivity #${sensitivity.rank} ${sensitivity.label}: ${sensitivity.impactScore.toExponential(3)} score impact`),
      "",
      "Sweep:",
      `- R min: ${formatPercent(sweep.reflectanceMin)}`,
      `- R max: ${formatPercent(sweep.reflectanceMax)}`,
      `- A max: ${formatPercent(sweep.absorbanceMax)}`,
      "",
      "Limitations:",
      ...yieldAnalysis.provenance.limitations.map((limitation) => `- ${limitation}`),
      ...foundry.provenance.limitations.map((limitation) => `- ${limitation}`),
      ...run.provenance.limitations.map((limitation) => `- ${limitation}`)
    ].join("\n")
  );
}

function exportFoundryJson(foundry: CoatingDesignResult): void {
  downloadText("l51-design-foundry.json", "application/json", JSON.stringify(foundry, null, 2));
}

function exportSearchJson(search: CoatingSearchResult): void {
  downloadText("l64b-coating-stack-optimizer.json", "application/json", JSON.stringify(search, null, 2));
}

function exportRobustSearchJson(search: RobustCoatingSearchResult): void {
  downloadText("l64b-robust-coating-stack-optimizer.json", "application/json", JSON.stringify(search, null, 2));
}

function exportFdtdScaffoldJson(scaffold: ExternalFdtdScaffoldExport): void {
  downloadText("l63-3d-fdtd-scaffold.json", "application/json", JSON.stringify(scaffold, null, 2));
}

function exportValidationJson(result: CircularApertureValidationResult): void {
  downloadText("l63-circular-pinhole-validation-bench.json", "application/json", JSON.stringify(circularApertureValidationJson(result), null, 2));
}

function exportValidationMarkdown(result: CircularApertureValidationResult): void {
  downloadText("l63-circular-pinhole-validation-bench.md", "text/markdown", circularApertureValidationMarkdown(result));
}

function exportSlitValidationJson(result: SlitOrderValidationResult): void {
  downloadText(`${result.config.kind}.json`, "application/json", JSON.stringify(slitOrderValidationJson(result), null, 2));
}

function exportSlitValidationMarkdown(result: SlitOrderValidationResult): void {
  downloadText(`${result.config.kind}.md`, "text/markdown", slitOrderValidationMarkdown(result));
}

function exportThinLensValidationJson(result: ThinLensFocalValidationResult): void {
  downloadText("l64-thin-lens-focal-validation.json", "application/json", JSON.stringify(thinLensFocalValidationJson(result), null, 2));
}

function exportThinLensValidationMarkdown(result: ThinLensFocalValidationResult): void {
  downloadText("l64-thin-lens-focal-validation.md", "text/markdown", thinLensFocalValidationMarkdown(result));
}

function exportThinLensValidationCsv(result: ThinLensFocalValidationResult): void {
  downloadText("l64-thin-lens-focal-validation.csv", "text/csv", thinLensFocalValidationCsv(result));
}

function exportCoherenceJson(result: CoherenceDemonstratorResult): void {
  downloadText("l65-coherence-demonstrator.json", "application/json", JSON.stringify(coherenceDemonstratorJson(result), null, 2));
}

function exportCoherenceMarkdown(result: CoherenceDemonstratorResult): void {
  downloadText("l65-coherence-demonstrator.md", "text/markdown", coherenceDemonstratorMarkdown(result));
}

function exportCoherenceCsv(result: CoherenceDemonstratorResult): void {
  downloadText("l65-coherence-demonstrator.csv", "text/csv", coherenceDemonstratorCsv(result));
}

function exportAdvisorReviewMarkdown(review: AdvisorValidationReviewResult): void {
  downloadText("advisor_validation_report.md", "text/markdown", advisorValidationReviewMarkdown(review));
}

function exportAdvisorReviewJson(review: AdvisorValidationReviewResult): void {
  downloadText("advisor_validation_report.json", "application/json", JSON.stringify(advisorValidationReviewJson(review), null, 2));
}

function exportAdvisorReviewCsv(review: AdvisorValidationReviewResult): void {
  downloadText("advisor_validation_report.csv", "text/csv", advisorValidationReviewCsv(review));
}

function syntheticMeasuredCsvFromProfile(profile: { xM: number; intensity: number }[], transform: { shiftM: number; scale: number; background: number }): string {
  const normalized = normalizeLocalProfile(profile);
  const rows = ["x_m,intensity"];
  for (const point of normalized) {
    const shifted = sampleLocalProfile(normalized, point.xM - transform.shiftM) ?? 0;
    rows.push(`${point.xM},${shifted * transform.scale + transform.background}`);
  }
  return rows.join("\n");
}

function measuredCsvFromDataset(dataset: L67MeasuredDataset): string {
  return ["x_m,intensity", ...dataset.profile.map((point) => `${point.xM},${point.intensity}`)].join("\n");
}

function cameraMetricValue(run: L68CameraRunResult, metricId: string): number {
  return run.metrics.find((metric) => metric.id === metricId)?.value ?? Number.NaN;
}

function calibrationMetricValue(run: L69CameraCalibrationResult, metricId: string): number {
  return run.metrics.find((metric) => metric.id === metricId)?.value ?? Number.NaN;
}

function mtfStudyMetrics(result: SlantedEdgeMtfResult): StudyMetric[] {
  return [
    { id: "edgeAngleDeg", label: "Edge angle", value: result.metrics.edgeAngleDeg, unit: "deg" },
    { id: "edgeContrast", label: "Edge contrast", value: result.metrics.edgeContrast },
    { id: "mtf50CyclesPerPx", label: "MTF50", value: result.metrics.mtf50CyclesPerPx ?? Number.NaN, unit: "cycles/pixel" },
    { id: "mtf10CyclesPerPx", label: "MTF10", value: result.metrics.mtf10CyclesPerPx ?? Number.NaN, unit: "cycles/pixel" },
    { id: "mtfAtNyquist", label: "MTF at Nyquist", value: result.metrics.mtfAtNyquist ?? Number.NaN },
    { id: "mtf50LpPerMm", label: "MTF50", value: result.metrics.mtf50LpPerMm ?? Number.NaN, unit: "lp/mm" },
    { id: "mtf10LpPerMm", label: "MTF10", value: result.metrics.mtf10LpPerMm ?? Number.NaN, unit: "lp/mm" }
  ];
}

function l71StudyMetrics(focusSweep: L71FocusSweepResult, fieldMap: L71FieldMtfMapResult, qualification: L71QualificationResult): StudyMetric[] {
  return [
    { id: "bestFocusMm", label: "Best focus", value: focusSweep.bestFocus.focusZMm ?? Number.NaN, unit: "mm" },
    { id: "bestFocusMetric", label: "Best focus metric", value: focusSweep.bestFocus.metricValue ?? Number.NaN },
    { id: "depthOfFocusMm", label: "Depth of focus", value: focusSweep.depthOfFocus.rangeMm, unit: "mm" },
    { id: "centerMtf50CyclesPerPx", label: "Center MTF50", value: fieldMap.centerMtf50CyclesPerPx ?? Number.NaN, unit: "cycles/pixel" },
    { id: "cornerAverageMtf50CyclesPerPx", label: "Corner average MTF50", value: fieldMap.cornerAverageMtf50CyclesPerPx ?? Number.NaN, unit: "cycles/pixel" },
    { id: "centerToCornerFalloff", label: "Center-corner falloff", value: fieldMap.centerToCornerFalloff ?? Number.NaN },
    { id: "fieldUniformityScore", label: "Field uniformity", value: fieldMap.fieldUniformityScore ?? Number.NaN },
    { id: "qualificationIssueCount", label: "Qualification issue count", value: qualification.issues.length }
  ];
}

function l72StudyMetrics(fit: L72GeometricFitResult): StudyMetric[] {
  return [
    { id: "pixelScaleXUmPerPx", label: "Pixel scale X", value: fit.metrics.pixelScaleXUmPerPx ?? Number.NaN, unit: "um/px" },
    { id: "pixelScaleYUmPerPx", label: "Pixel scale Y", value: fit.metrics.pixelScaleYUmPerPx ?? Number.NaN, unit: "um/px" },
    { id: "meanPixelScaleUmPerPx", label: "Mean pixel scale", value: fit.metrics.meanPixelScaleUmPerPx ?? Number.NaN, unit: "um/px" },
    { id: "rotationDeg", label: "Rotation", value: fit.metrics.rotationDeg ?? Number.NaN, unit: "deg" },
    { id: "shear", label: "Shear", value: fit.metrics.shear ?? Number.NaN },
    { id: "scaleAnisotropy", label: "Scale anisotropy", value: fit.metrics.scaleAnisotropy ?? Number.NaN },
    { id: "rmsResidualPx", label: "RMS residual", value: fit.metrics.rmsResidualPx, unit: "px" },
    { id: "maxResidualPx", label: "Max residual", value: fit.metrics.maxResidualPx, unit: "px" },
    { id: "fieldDistortionPercent", label: "Field distortion", value: fit.metrics.fieldDistortionPercent ?? Number.NaN, unit: "%" },
    { id: "radialK1", label: "Radial k1", value: fit.radial.k1 ?? Number.NaN },
    { id: "radialK2", label: "Radial k2", value: fit.radial.k2 ?? Number.NaN }
  ];
}

function selectedL73Point(detection: L73DetectionResult | null, id: string): L73DetectionResult["points"][number] | null {
  if (!detection) return null;
  const points = [...detection.points, ...detection.rejectedPoints];
  return points.find((point) => point.id === id) ?? points[0] ?? null;
}

function selectedL75Marker(detection: L75FiducialDetectionBundle | null, id: string): L75FiducialDetectionBundle["markers"][number] | null {
  if (!detection) return null;
  return detection.markers.find((marker) => marker.id.toString() === id) ?? detection.markers[0] ?? null;
}

function l73StudyMetrics(detection: L73DetectionResult, fit: L72GeometricFitResult | null): StudyMetric[] {
  return [
    { id: "expectedPointCount", label: "Expected points", value: detection.expectedPointCount },
    { id: "detectedPointCount", label: "Detected points", value: detection.detectedPointCount },
    { id: "acceptedPointCount", label: "Accepted points", value: detection.acceptedPointCount },
    { id: "rejectedPointCount", label: "Rejected points", value: detection.rejectedPointCount },
    { id: "coverageScore", label: "Coverage score", value: detection.coverageScore },
    { id: "gridMatchRmsPx", label: "Grid match RMS", value: detection.gridMatchRmsPx ?? Number.NaN, unit: "px" },
    { id: "fitRmsPx", label: "Fit RMS", value: fit?.metrics.rmsResidualPx ?? detection.fitRmsPx ?? Number.NaN, unit: "px" },
    { id: "fitMaxPx", label: "Fit max", value: fit?.metrics.maxResidualPx ?? detection.fitMaxPx ?? Number.NaN, unit: "px" }
  ];
}

function l74StudyMetrics(result: L74SessionQaResult): StudyMetric[] {
  const metricValue = (id: string): number => result.aggregates.find((aggregate) => aggregate.metricId === id)?.mean ?? Number.NaN;
  const repeatability = (id: string): number => result.aggregates.find((aggregate) => aggregate.metricId === id)?.repeatabilityStd ?? Number.NaN;
  return [
    { id: "frameCount", label: "Session frames", value: result.frameCount },
    { id: "acceptedFrameCount", label: "Accepted frames", value: result.acceptedFrameCount },
    { id: "rejectedFrameCount", label: "Rejected frames", value: result.rejectedFrameCount },
    { id: "outlierCount", label: "Outliers", value: result.outliers.length },
    { id: "warningCount", label: "Warnings", value: result.warnings.length },
    { id: "meanMtf50CyclesPerPx", label: "Mean MTF50", value: metricValue("mtf50_cycles_per_px"), unit: "cycles/px" },
    { id: "mtf50RepeatabilityStd", label: "MTF50 repeatability std", value: repeatability("mtf50_cycles_per_px"), unit: "cycles/px" },
    { id: "meanGeometricRmsResidualPx", label: "Mean RMS residual", value: metricValue("rms_residual_px"), unit: "px" },
    { id: "pixelScaleRepeatabilityStd", label: "Pixel-scale repeatability std", value: repeatability("mean_pixel_scale_um_per_px"), unit: "um/px" }
  ];
}

function l75StudyMetrics(result: L75FiducialFitResult): StudyMetric[] {
  return [
    { id: "fiducialMarkerCount", label: "Fiducial markers", value: result.match.markerCount },
    { id: "acceptedFiducialMarkers", label: "Accepted fiducial markers", value: result.match.acceptedMarkerCount },
    { id: "acceptedCharucoCorners", label: "Accepted ChArUco-style corners", value: result.match.acceptedCharucoCornerCount },
    { id: "matchedFiducialPoints", label: "Matched fiducial points", value: result.match.matchedPointCount },
    { id: "fiducialCoverageScore", label: "Fiducial coverage score", value: result.match.coverageScore },
    { id: "fiducialBoardAreaCoverage", label: "Fiducial board-area coverage", value: result.match.boardAreaCoverageScore },
    { id: "fiducialMissingMarkerCount", label: "Missing marker IDs", value: result.match.missingMarkerIds.length },
    { id: "fiducialRmsResidualPx", label: "Fiducial RMS residual", value: result.fit?.metrics.rmsResidualPx ?? Number.NaN, unit: "px" },
    { id: "fiducialMaxResidualPx", label: "Fiducial max residual", value: result.fit?.metrics.maxResidualPx ?? Number.NaN, unit: "px" },
    { id: "fiducialMeanPixelScaleUmPerPx", label: "Fiducial mean pixel scale", value: result.fit?.metrics.meanPixelScaleUmPerPx ?? Number.NaN, unit: "um/px" }
  ];
}

function exampleL75DetectionJson(): string {
  return JSON.stringify(
    {
      frameId: "fid_example_001",
      boardId: "l75-board-7x5",
      markers: [
        { id: 0, cornersPx: [[108, 84], [144, 84], [144, 120], [108, 120]], confidence: 0.99 },
        { id: 1, cornersPx: [[178, 84], [214, 84], [214, 120], [178, 120]], confidence: 0.98 },
        { id: 7, cornersPx: [[108, 154], [144, 154], [144, 190], [108, 190]], confidence: 0.97 },
        { id: 8, cornersPx: [[178, 154], [214, 154], [214, 190], [178, 190]], confidence: 0.96 }
      ],
      charucoCorners: [
        { id: 0, xPx: 92, yPx: 68, confidence: 0.95 },
        { id: 1, xPx: 162, yPx: 68, confidence: 0.95 },
        { id: 8, xPx: 92, yPx: 138, confidence: 0.94 },
        { id: 9, xPx: 162, yPx: 138, confidence: 0.94 }
      ]
    },
    null,
    2
  );
}

function selectedL71MetricValue(result: SlantedEdgeMtfResult, metric: L71FocusMetric): number | null {
  if (metric === "mtf10") return result.metrics.mtf10CyclesPerPx;
  if (metric === "nyquist") return result.metrics.mtfAtNyquist;
  if (metric === "mtf-area") return mtfCurveArea(result);
  return result.metrics.mtf50CyclesPerPx;
}

function mtfCurveArea(result: SlantedEdgeMtfResult): number {
  if (result.mtf.length < 2) return 0;
  let area = 0;
  for (let index = 1; index < result.mtf.length; index += 1) {
    const a = result.mtf[index - 1]!;
    const b = result.mtf[index]!;
    area += ((a.mtf + b.mtf) * 0.5) * Math.max(0, b.frequencyCyclesPerPx - a.frequencyCyclesPerPx);
  }
  return roundForUi(area);
}

function roundForUi(value: number): number {
  return Number.isFinite(value) ? Number(value.toPrecision(12)) : value;
}

function formatNullableMetric(value: number | null): string {
  return value === null || !Number.isFinite(value) ? "n/a" : value.toPrecision(4);
}

function normalizeLocalProfile(profile: { xM: number; intensity: number }[]): { xM: number; intensity: number }[] {
  const sorted = [...profile].filter((point) => Number.isFinite(point.xM) && Number.isFinite(point.intensity)).sort((a, b) => a.xM - b.xM);
  const peak = Math.max(0, ...sorted.map((point) => Math.abs(point.intensity)));
  return sorted.map((point) => ({ xM: point.xM, intensity: peak > 0 ? point.intensity / peak : point.intensity }));
}

function sampleLocalProfile(profile: { xM: number; intensity: number }[], xM: number): number | null {
  if (profile.length === 0 || xM < profile[0]!.xM || xM > profile[profile.length - 1]!.xM) return null;
  let low = 0;
  let high = profile.length - 1;
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (profile[mid]!.xM <= xM) low = mid;
    else high = mid;
  }
  const a = profile[low]!;
  const b = profile[Math.min(profile.length - 1, low + 1)]!;
  if (a.xM === b.xM) return a.intensity;
  const t = (xM - a.xM) / (b.xM - a.xM);
  return a.intensity * (1 - t) + b.intensity * t;
}

async function decodeMeasuredImageFile(file: File): Promise<{ widthPx: number; heightPx: number; data: number[] }> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("browser canvas is unavailable for measured image decoding");
    context.drawImage(bitmap, 0, 0);
    const image = context.getImageData(0, 0, bitmap.width, bitmap.height);
    return {
      widthPx: bitmap.width,
      heightPx: bitmap.height,
      data: Array.from(image.data, (value) => value / 255)
    };
  } finally {
    bitmap.close();
  }
}

async function decodeL73TargetImageFile(file: File): Promise<L73TargetImage> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("browser canvas is unavailable for L7.3 target image decoding");
    context.drawImage(bitmap, 0, 0);
    const rgba = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
    const pixels: number[] = [];
    for (let index = 0; index < rgba.length; index += 4) {
      const red = rgba[index] ?? 0;
      const green = rgba[index + 1] ?? 0;
      const blue = rgba[index + 2] ?? 0;
      const alpha = (rgba[index + 3] ?? 255) / 255;
      const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
      pixels.push(clamp(luminance * alpha + (1 - alpha), 0, 1));
    }
    return normalizeTargetImage({ widthPx: bitmap.width, heightPx: bitmap.height, pixels, sourceName: file.name });
  } finally {
    bitmap.close();
  }
}

function l73ImagePreviewCells(image: L73TargetImage, columns: number, rows: number): { columns: number; cells: { id: string; shade: number }[] } {
  const safeColumns = Math.max(1, Math.round(columns));
  const safeRows = Math.max(1, Math.round(rows));
  const cells: { id: string; shade: number }[] = [];
  for (let row = 0; row < safeRows; row += 1) {
    const y = Math.min(image.heightPx - 1, Math.round(((row + 0.5) / safeRows) * image.heightPx));
    for (let col = 0; col < safeColumns; col += 1) {
      const x = Math.min(image.widthPx - 1, Math.round(((col + 0.5) / safeColumns) * image.widthPx));
      const value = clamp(image.pixels[y * image.widthPx + x] ?? 0, 0, 1);
      const shade = Math.round(value * 255);
      cells.push({ id: `${row}-${col}`, shade });
    }
  }
  return { columns: safeColumns, cells };
}

function exportStudyBundle(
  study: StudySnapshot,
  sweep: PracticalSweepResult | null,
  comparison: StudyComparisonResult | null,
  measuredComparison: L67MeasuredComparisonResult | null,
  cameraRun: L68CameraRunResult | null,
  calibrationRun: L69CameraCalibrationResult | null,
  mtfRun: SlantedEdgeMtfResult | null,
  mtfComparison: L70MtfComparisonResult | null,
  linePairRun: L70LinePairAnalysisResult | null,
  focusSweepRun: L71FocusSweepResult | null,
  fieldMtfMap: L71FieldMtfMapResult | null,
  qualificationRun: L71QualificationResult | null,
  focusFieldComparison: L71FocusFieldComparisonResult | null,
  geometricTarget: L72GeometricTarget | null,
  geometricDetection: L73DetectionResult | null,
  geometricFit: L72GeometricFitResult | null,
  geometricComparison: L72GeometryComparisonResult | null,
  sessionQa: L74SessionQaResult | null,
  fiducialBoard: L75FiducialBoard | null,
  fiducialDetection: L75FiducialDetectionBundle | null,
  fiducialFit: L75FiducialFitResult | null
): void {
  const bundle = studyBundleJson(study, {
    sweep: sweep ?? undefined,
    comparison: comparison ?? undefined,
    measuredComparison: measuredComparison ?? undefined,
    cameraRun: cameraRun ?? undefined,
    calibrationRun: calibrationRun ?? undefined,
    mtfRun: mtfRun ?? undefined,
    mtfComparison: mtfComparison ?? undefined,
    linePairRun: linePairRun ?? undefined,
    focusSweepRun: focusSweepRun ?? undefined,
    fieldMtfMap: fieldMtfMap ?? undefined,
    qualificationRun: qualificationRun ?? undefined,
    focusFieldComparison: focusFieldComparison ?? undefined,
    geometricTarget: geometricTarget ?? undefined,
    geometricDetection: geometricDetection ?? undefined,
    geometricFit: geometricFit ?? undefined,
    geometricComparison: geometricComparison ?? undefined,
    sessionQa: sessionQa ?? undefined,
    fiducialBoard: fiducialBoard ?? undefined,
    fiducialDetection: fiducialDetection ?? undefined,
    fiducialFit: fiducialFit ?? undefined
  });
  downloadText("l75-study-bundle.json", "application/json", JSON.stringify(bundle, null, 2));
  downloadText("l75-study.md", "text/markdown", studyBundleMarkdown(bundle));
  downloadText("l75-metrics.csv", "text/csv", bundle.metricsCsv);
  downloadText("l75-profiles.csv", "text/csv", bundle.profilesCsv);
  downloadText("l75-warnings.json", "application/json", JSON.stringify(bundle.warningsJson, null, 2));
  downloadText("l75-capabilities.json", "application/json", JSON.stringify(bundle.capabilities, null, 2));
  if (comparison) downloadText("l75-comparison.csv", "text/csv", studyComparisonCsv(comparison));
  if (sweep) downloadText("l75-sweep.csv", "text/csv", practicalSweepCsv(sweep));
  if (measuredComparison) downloadText("l75-measured-residual-profile.csv", "text/csv", residualProfileCsv(measuredComparison));
  if (cameraRun) downloadText("l75-camera_profile.csv", "text/csv", cameraProfileCsv(cameraRun));
  if (calibrationRun) downloadText("l75-camera_calibration_residuals.csv", "text/csv", cameraCalibrationResidualsCsv(calibrationRun));
  if (mtfRun) downloadText("l75-mtf_curve.csv", "text/csv", slantedEdgeMtfCurveCsv(mtfRun));
  if (mtfComparison) downloadText("l75-mtf_comparison.csv", "text/csv", mtfComparisonCsv(mtfComparison));
  if (linePairRun) downloadText("l75-line_pair_contrast.csv", "text/csv", linePairContrastCsv(linePairRun));
  if (focusSweepRun) downloadText("focus_sweep.csv", "text/csv", focusSweepCsv(focusSweepRun));
  if (fieldMtfMap) downloadText("field_mtf_map.csv", "text/csv", fieldMtfMapCsv(fieldMtfMap));
  if (qualificationRun) downloadText("qualification_report.json", "application/json", qualificationReportJson(qualificationRun));
  if (qualificationRun) downloadText("qualification_report.md", "text/markdown", qualificationReportMarkdown(qualificationRun, focusSweepRun ?? undefined, fieldMtfMap ?? undefined, focusFieldComparison ?? undefined));
  if (focusFieldComparison) downloadText("mtf_comparison.csv", "text/csv", focusFieldComparisonCsv(focusFieldComparison));
  if (geometricTarget) downloadText("points.csv", "text/csv", geometricPointsCsv(geometricTarget));
  if (geometricFit) downloadText("residuals.csv", "text/csv", geometricResidualsCsv(geometricFit));
  if (geometricFit) downloadText("distortion_map.csv", "text/csv", distortionMapCsv(geometricFit));
  if (geometricFit) downloadText("geometric_calibration_report.json", "application/json", geometricCalibrationReportJson(geometricFit, geometricComparison ?? undefined));
  if (geometricFit) downloadText("geometric_calibration_report.md", "text/markdown", geometricCalibrationReportMarkdown(geometricFit, geometricComparison ?? undefined));
  if (geometricComparison) downloadText("geometric_comparison.csv", "text/csv", geometricComparisonCsv(geometricComparison));
  if (geometricDetection) downloadText("detected_points.csv", "text/csv", detectedPointsCsv(geometricDetection));
  if (geometricDetection) downloadText("rejected_points.csv", "text/csv", rejectedPointsCsv(geometricDetection));
  if (geometricDetection) downloadText("detection_report.md", "text/markdown", detectionReportMarkdown(geometricDetection));
  if (geometricDetection) downloadText("detection_report.json", "application/json", detectionReportJson(geometricDetection));
  if (sessionQa) downloadText("session_report.md", "text/markdown", sessionReportMarkdown(sessionQa));
  if (sessionQa) downloadText("session_report.json", "application/json", sessionReportJson(sessionQa));
  if (sessionQa) downloadText("frame_metrics.csv", "text/csv", frameMetricsCsv(sessionQa));
  if (sessionQa) downloadText("session_metrics.csv", "text/csv", sessionMetricsCsv(sessionQa));
  if (sessionQa) downloadText("outliers.csv", "text/csv", outliersCsv(sessionQa));
  if (sessionQa) downloadText("warnings.json", "application/json", sessionWarningsJson(sessionQa));
  if (fiducialBoard) downloadText("board_manifest.json", "application/json", fiducialBoardManifestJson(fiducialBoard));
  if (fiducialFit) downloadText("fiducial_detection_report.md", "text/markdown", fiducialDetectionReportMarkdown(fiducialFit));
  if (fiducialFit) downloadText("fiducial_detection_report.json", "application/json", fiducialDetectionReportJson(fiducialFit));
  if (fiducialFit) downloadText("matched_points.csv", "text/csv", fiducialMatchedPointsCsv(fiducialFit));
  if (fiducialDetection) downloadText("rejected_points.csv", "text/csv", fiducialRejectedPointsCsv(fiducialDetection));
}

function exportPracticalSweepJson(result: PracticalSweepResult): void {
  downloadText("l66-parameter-sweep.json", "application/json", JSON.stringify(practicalSweepJson(result), null, 2));
}

function exportPracticalSweepMarkdown(result: PracticalSweepResult): void {
  downloadText("l66-parameter-sweep.md", "text/markdown", practicalSweepMarkdown(result));
}

function exportPracticalSweepCsv(result: PracticalSweepResult): void {
  downloadText("l66-parameter-sweep.csv", "text/csv", practicalSweepCsv(result));
}

function exportActiveProfileCsv(csv: string): void {
  downloadText("l66-profile.csv", "text/csv", csv);
}

function exportStudyComparisonMarkdown(comparison: StudyComparisonResult): void {
  downloadText("l66-run-comparison.md", "text/markdown", studyComparisonMarkdown(comparison));
}

function exportStudyComparisonCsv(comparison: StudyComparisonResult): void {
  downloadText("l66-run-comparison.csv", "text/csv", studyComparisonCsv(comparison));
}

function exportYieldJson(yieldAnalysis: CoatingYieldResult): void {
  downloadText("l52-yield-analysis.json", "application/json", JSON.stringify(yieldAnalysis, null, 2));
}

function exportMaterialTemplateJson(): void {
  downloadText("l54-material-import-template.json", "application/json", JSON.stringify(createMaterialImportTemplate(), null, 2));
}

function exportSweepCsv(sweep: CoatingSweepResult): void {
  const rows = [
    "wavelength_nm,reflectance,transmittance,absorbance,energy_balance_error,result_hash",
    ...sweep.samples.map((sample) =>
      [
        (sample.wavelengthM * 1e9).toFixed(6),
        sample.reflectance.toPrecision(12),
        sample.transmittance.toPrecision(12),
        sample.absorbance.toPrecision(12),
        sample.energyBalanceError.toPrecision(6),
        sample.resultHash
      ].join(",")
    )
  ];
  downloadText("l41-coating-sweep.csv", "text/csv", rows.join("\n"));
}

function exportMonitorCsv(monitor: PlanarFieldMonitorResult): void {
  const rows = [
    "id,kind,position_nm,layer_id,depth_nm,e_re,e_im,h_re,h_im,electric_intensity,normalized_poynting_flux,phase_rad",
    ...monitor.samples.map((sample) =>
      [
        sample.id,
        sample.kind,
        (sample.positionM * 1e9).toFixed(6),
        sample.layerId ?? "",
        sample.depthInLayerM === undefined ? "" : (sample.depthInLayerM * 1e9).toFixed(6),
        sample.eTangential.re.toPrecision(12),
        sample.eTangential.im.toPrecision(12),
        sample.hTangential.re.toPrecision(12),
        sample.hTangential.im.toPrecision(12),
        sample.electricIntensity.toPrecision(12),
        sample.normalizedPoyntingFlux.toPrecision(12),
        sample.phaseRad.toPrecision(12)
      ].join(",")
    )
  ];
  downloadText("l42-planar-field-monitor.csv", "text/csv", rows.join("\n"));
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

function cloneLayers(layers: EditableLayer[]): EditableLayer[] {
  return layers.map((layer) => ({ ...layer }));
}

function materialEntryFor(materialId: string, materialCatalog: MaxwellMaterialCatalog): MaterialCatalogEntry | undefined {
  return listCatalogMaterials(materialCatalog).find((material) => material.id === materialId);
}

function materialLabel(materialId: string, materialCatalog: MaxwellMaterialCatalog): string {
  return materialEntryFor(materialId, materialCatalog)?.label ?? materialId;
}

function defaultThicknessNm(materialId: string): number {
  if (materialId === "tio2") return 50;
  if (materialId === "sio2") return 100;
  if (materialId === "chromiumLossy") return 18;
  if (materialId === "silicon") return 200;
  return 100;
}

function parseNumberList(value: string): number[] {
  return value
    .split(/[,;\s]+/)
    .map((part) => Number(part.trim()))
    .filter((part) => Number.isFinite(part) && part > 0);
}

function parseSignedNumberList(value: string): number[] {
  return value
    .split(/[,;\s]+/)
    .map((part) => Number(part.trim()))
    .filter((part) => Number.isFinite(part));
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatSearchStack(candidate: CoatingSearchCandidate): string {
  if (candidate.layers.length === 0) return "Bare boundary";
  return candidate.layers.map((layer) => `${layer.label} ${(layer.thicknessM * 1e9).toFixed(1)} nm`).join(" / ");
}

function formatUncertaintyReceipt(receipt: RobustCoatingSearchCandidate["uncertaintyReceipt"]): string {
  const parts = [receipt.label];
  if (receipt.model === "independent-thickness") parts.push(`${(receipt.sigmaNm ?? 0).toFixed(2)} nm sigma`);
  if (receipt.globalThicknessScale) parts.push(`${formatPercent(receipt.globalThicknessScale.sigmaFraction)} scale sigma`);
  if (receipt.globalThicknessOffsetNm) parts.push(`${receipt.globalThicknessOffsetNm.sigmaNm.toFixed(2)} nm offset sigma`);
  if (receipt.perLayerResidualNm) parts.push(`${receipt.perLayerResidualNm.sigmaNm.toFixed(2)} nm residual sigma`);
  if (receipt.layerGroupDrift?.length) parts.push(`${receipt.layerGroupDrift.length} group driver${receipt.layerGroupDrift.length === 1 ? "" : "s"}`);
  return parts.join(" / ");
}

function formatUncertaintySamples(receipt: RobustCoatingSearchCandidate["uncertaintyReceipt"]): string {
  const reduction = receipt.sampleReduction === "none" ? "full grid" : "deterministic cap";
  return `${receipt.generatedSamplesPerCandidate}/${receipt.theoreticalSamplesPerCandidate} samples / ${reduction}`;
}

function formatSignedExponential(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toExponential(2)}`;
}

function clamp(value: number, min: number, max: number): number {
  const finite = Number.isFinite(value) ? value : min;
  return Math.min(max, Math.max(min, finite));
}

function oddInteger(value: number, min: number, max: number): number {
  const bounded = Math.round(clamp(value, min, max));
  if (bounded % 2 === 1) return bounded;
  return bounded + 1 <= max ? bounded + 1 : bounded - 1;
}

function radFromDeg(value: number): number {
  return (value * Math.PI) / 180;
}

function degFromRad(value: number): number {
  return (value * 180) / Math.PI;
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "n/a";
  return `${(value * 100).toFixed(value < 0.001 ? 4 : 2)}%`;
}

function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return "n/a";
  if (Math.abs(value) >= 1e5 || (Math.abs(value) > 0 && Math.abs(value) < 1e-3)) return value.toExponential(3);
  return value.toPrecision(4);
}

function formatMm(valueM: number): string {
  return (valueM * 1e3).toFixed(valueM < 0.001 ? 3 : 2).replace(/0+$/, "").replace(/\.$/, "");
}

function formatUm(valueM: number): string {
  return (valueM * 1e6).toFixed(valueM < 1e-4 ? 3 : 2).replace(/0+$/, "").replace(/\.$/, "");
}

function formatInterval(lower: number, upper: number): string {
  return `${formatPercent(lower)}-${formatPercent(upper)}`;
}

function formatWavelengthRange(range: [number, number] | null): string {
  if (!range) return "n/a";
  return `${(range[0] * 1e9).toFixed(0)}-${(range[1] * 1e9).toFixed(0)} nm`;
}

function materialWavelengthRange(material: MaterialCatalogEntry): [number, number] | null {
  if (material.samples.length === 0) return null;
  const wavelengths = material.samples.map((sample) => sample.wavelengthM);
  return [Math.min(...wavelengths), Math.max(...wavelengths)];
}

function formatMetric(metric: string, value: number): string {
  if (metric.toLowerCase().includes("reflectance") || metric.toLowerCase().includes("transmittance") || metric.toLowerCase().includes("absorbance")) {
    return formatPercent(value);
  }
  return value.toExponential(2);
}

function coherenceModeLabel(mode: CoherenceDemonstratorMode): string {
  if (mode === "coherent-fields") return "Coherent fields";
  if (mode === "incoherent-intensities") return "Incoherent intensities";
  return "Partial coherence";
}

function formatNumberInputValue(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (value === 0) return "0";
  const rounded = Math.abs(value) >= 1e-3 ? Number(value.toFixed(6)) : Number(value.toPrecision(6));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function uniquePanelWarnings(warnings: SolverWarning[]): SolverWarning[] {
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
