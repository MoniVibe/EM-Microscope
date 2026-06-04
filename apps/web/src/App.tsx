import { useMemo, useRef, useState } from "react";
import {
  detectorHistogramToCsv,
  fieldImageToCsv,
  fieldImageToJson,
  fieldProfileToCsv,
  fieldProfileToJson,
  formatLength,
  formatPower,
  fromMeters,
  fromRadians,
  cameraWithDefaults,
  computeResolutionTargetMetrics2D,
  computeMtf2D,
  computePsfMetrics2D,
  computeSamplingMetrics2D,
  computeSnrMetrics2D,
  comparisonMetricsToCsv2D,
  comparisonReportToHtml,
  comparisonReportToJson,
  comparisonReportToMarkdown,
  createEngineeringReport,
  createComparisonReport2D,
  defaultL32CameraModel,
  defaultL32SweepDefinitions,
  defaultFitPresets2D,
  engineeringReportToHtml,
  engineeringReportToJson,
  engineeringReportToMarkdown,
  fitEvaluationsToCsv2D,
  fitPresetById2D,
  makeFitRunCacheKey2D,
  geometricL0Solver,
  geometricL1_2dSolver,
  l25PresetDefinitions,
  l25PresetScenes,
  l33PresetDefinitions,
  l33PresetScenes,
  l3PresetDefinitions,
  l3PresetScenes,
  parseScene,
  renderCameraImage2D,
  runDeterministicFit2D,
  runMeasuredSimulatedComparison2D,
  runSweepDefinition2D,
  sampleL1Scene,
  sampleL2Scene,
  scalarAngularSpectrumL2_1dSolver,
  scalarCoherentL3_2dSolver,
  scalarPartialCoherentL33_2dSolver,
  sweepResultToCsv,
  toMeters,
  toRadians,
  type CameraImageOutput2D,
  type CameraModel2D,
  type DetectorElement,
  type EnergyLedger,
  type EngineeringReport,
  type FieldOutput1D,
  type FieldOutput2D,
  type ComparisonReport2D,
  type ComparisonRunOutput2D,
  type FitPresetId2D,
  type FitRunOutput2D,
  type L25PresetId,
  type L33PresetId,
  type L3PresetId,
  type MeasurementSettings2D,
  type MeasuredImagePixels2D,
  type MtfMetrics2D,
  type OpticalElement,
  type PsfMetrics2D,
  type ResolutionTargetMetrics2D,
  type SamplePlane1D,
  type SamplingMetrics2D,
  type Scene,
  type SnrMetrics2D,
  type SolverResult,
  type SolverWarning,
  type SourceElement,
  type SweepDefinition,
  type SweepResult,
  type TestTarget2D
} from "@emmicro/core";
import {
  Aperture,
  Download,
  FileDown,
  FolderOpen,
  Gauge,
  Lightbulb,
  Plus,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Trash2,
  Waves
} from "lucide-react";
import { BenchCanvas } from "./canvas/BenchCanvas";
import { IlluminationPanel } from "./illumination/IlluminationPanel";
import { CalibrationPanel } from "./measurement/CalibrationPanel";
import { ComparePanel } from "./measurement/ComparePanel";
import { FitPanel } from "./measurement/FitPanel";
import { ImageImportPanel } from "./measurement/ImageImportPanel";
import { residualMapToPngDataUrl } from "./measurement/ResidualView";
import { RoiPanel } from "./measurement/RoiPanel";
import { MaxwellPanel } from "./maxwell/MaxwellPanel";
import { MtfPanel } from "./metrics/MtfPanel";
import { ResolutionTargetPanel } from "./metrics/ResolutionTargetPanel";
import { ReportPanel } from "./report/ReportPanel";
import { CameraPanel } from "./sensor/CameraPanel";
import { SnrPanel } from "./sensor/SnrPanel";
import { SweepPanel } from "./sweeps/SweepPanel";
import { TestTargetPanel } from "./targets/TestTargetPanel";
import { startL3ImageCompute, type L3ComputeJob, type L3ComputeProgress } from "./wave/computeL3Image";
import { ImageAnalysisPanel, validationSummaryText } from "./wave/ImageAnalysisPanel";
import { fieldImageToPngDataUrl, IntensityImageView, type IntensityDisplayMode } from "./wave/IntensityImageView";
import { IntensityProfilePlot } from "./wave/IntensityProfilePlot";
import { L3BenchmarkPanel } from "./wave/L3BenchmarkPanel";
import { L3ComputeStatus } from "./wave/L3ComputeStatus";

type SelectableKind = "source" | "element" | "detector";
export type SelectedItem = { kind: SelectableKind; id: string } | null;
type ActiveSolverId = Scene["solverSettings"]["activeSolverId"];
type WavePresetValue = L25PresetId | "custom";
type ImagePresetId = L3PresetId | L33PresetId;
type ImagePresetValue = ImagePresetId | "custom";

type EditableItem =
  | { kind: "source"; item: SourceElement }
  | { kind: "element"; item: OpticalElement }
  | { kind: "detector"; item: DetectorElement };

function nowIso(): string {
  return new Date().toISOString();
}

function id(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function isImageSolver(solverId: ActiveSolverId): boolean {
  return solverId === "scalar.coherent.l3.2d" || solverId === "scalar.partialCoherent.l3.3.2d";
}

function isL33PresetId(presetId: ImagePresetId): presetId is L33PresetId {
  return presetId in l33PresetScenes;
}

const uniformDiskSampleCounts = [1, 5, 9, 21, 49, 81] as const;
const annulusSampleCounts = [8, 16, 32, 64] as const;

function uniformDiskSampleCount(value: number): (typeof uniformDiskSampleCounts)[number] {
  return uniformDiskSampleCounts.includes(value as (typeof uniformDiskSampleCounts)[number])
    ? (value as (typeof uniformDiskSampleCounts)[number])
    : 9;
}

function annulusSampleCount(value: number): (typeof annulusSampleCounts)[number] {
  return annulusSampleCounts.includes(value as (typeof annulusSampleCounts)[number]) ? (value as (typeof annulusSampleCounts)[number]) : 16;
}

export function solverDisclosureFor(solverId: ActiveSolverId, hasSamplePlane = false): { label: string; detail: string } {
  if (solverId === "scalar.partialCoherent.l3.3.2d") {
    return {
      label: "L3.3 partial-coherence scalar brightfield approximation",
      detail: "2D scalar source-angle intensity averaging; not vector optics, fluorescence, true 3D, EM, or certified microscope metrology"
    };
  }
  if (solverId === "scalar.coherent.l3.2d") {
    return {
      label: "L3 coherent 2D scalar image approximation",
      detail: "2D coherent scalar image-plane intensity approximation; not partial coherence, vector optics, fluorescence, 3D physics, or EM"
    };
  }
  if (solverId === "scalar.angularSpectrum.l2.1d") {
    if (hasSamplePlane) {
      return {
        label: "L2 scalar 1D sample propagation",
        detail: "1D coherent transverse slice; not a full microscope image, full PSF, or Airy disk"
      };
    }
    return {
      label: "L2 scalar 1D field propagation",
      detail: "1D transverse slice; not a full circular-aperture Airy disk"
    };
  }
  if (solverId === "geometric.l1.2d") {
    return {
      label: "L1 2D Surface Ray Optics",
      detail: "Diffraction not propagated"
    };
  }
  return {
    label: "L0 Geometric Ray Optics",
    detail: "Diffraction not propagated"
  };
}

function wavePresetIdFor(scene: Scene): WavePresetValue {
  const suffix = scene.sceneId.startsWith("sample-l25-") ? scene.sceneId.slice("sample-l25-".length) : "";
  return suffix in l25PresetScenes ? (suffix as L25PresetId) : "custom";
}

function imagePresetIdFor(scene: Scene): ImagePresetValue {
  const l33Suffix = scene.sceneId.startsWith("sample-l33-") ? scene.sceneId.slice("sample-l33-".length) : "";
  if (l33Suffix in l33PresetScenes) return l33Suffix as L33PresetId;
  const suffix = scene.sceneId.startsWith("sample-l3-") ? scene.sceneId.slice("sample-l3-".length) : "";
  return suffix in l3PresetScenes ? (suffix as L3PresetId) : "custom";
}

function sampleVisualDiameterM(sample: SamplePlane1D): number {
  const transmission = sample.transmission;
  if (transmission.kind === "analyticPhase") return 0.006;
  const profile = transmission.kind === "analyticAmplitude" ? transmission.profile : transmission.amplitudeProfile;
  if (profile.kind === "singleSlit") return profile.widthM;
  if (profile.kind === "doubleSlit") return profile.separationM + profile.slitWidthM;
  if (profile.kind === "grating") return profile.periodM * profile.count;
  return profile.periodM * profile.bars;
}

function touch(scene: Scene): Scene {
  return {
    ...scene,
    metadata: {
      ...scene.metadata,
      modifiedAtIso: nowIso()
    }
  };
}

function findSelected(scene: Scene, selected: SelectedItem): EditableItem | null {
  if (!selected) return null;
  if (selected.kind === "source") {
    const item = scene.sources.find((source) => source.id === selected.id);
    return item ? { kind: "source", item } : null;
  }
  if (selected.kind === "element") {
    const item = scene.elements.find((element) => element.id === selected.id);
    return item ? { kind: "element", item } : null;
  }
  const item = scene.detectors.find((detector) => detector.id === selected.id);
  return item ? { kind: "detector", item } : null;
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

function MaxwellOnlyApp() {
  return (
    <div className="app-shell maxwell-only-shell">
      <header className="topbar maxwell-only-topbar">
        <div className="brand-block">
          <div className="brand-mark">EM</div>
          <div>
            <h1>EMMicro</h1>
            <p>L5.8 Maxwell Design Foundry</p>
          </div>
        </div>
        <div className="mode-badge">
          <Gauge size={16} />
          <span>PlanarTmmBackend Foundry</span>
          <strong>solver boundary, drift-aware robust search, and receipts</strong>
        </div>
      </header>

      <main className="maxwell-only-workspace" aria-label="Maxwell simulator">
        <div className="maxwell-only-main">
          <MaxwellPanel />
        </div>
      </main>
    </div>
  );
}

export function App() {
  return <MaxwellOnlyApp />;

  const [scene, setScene] = useState<Scene>(() => sampleL1Scene);
  const [selected, setSelected] = useState<SelectedItem>({ kind: "element", id: "lens-thick-biconvex" });
  const [l2Result, setL2Result] = useState<SolverResult | null>(null);
  const [l2Error, setL2Error] = useState<string | null>(null);
  const [l3Result, setL3Result] = useState<SolverResult | null>(null);
  const [l3Error, setL3Error] = useState<string | null>(null);
  const [l3Progress, setL3Progress] = useState<L3ComputeProgress | null>(null);
  const [l3Running, setL3Running] = useState(false);
  const [l3DisplayMode, setL3DisplayMode] = useState<IntensityDisplayMode>("gamma");
  const [l32CameraOverride, setL32CameraOverride] = useState<CameraModel2D | null>(null);
  const [l32SweepResult, setL32SweepResult] = useState<SweepResult | null>(null);
  const [measuredPixelsById, setMeasuredPixelsById] = useState<Record<string, MeasuredImagePixels2D>>({});
  const [l34bComparison, setL34bComparison] = useState<ComparisonRunOutput2D | null>(null);
  const [l34bFit, setL34bFit] = useState<FitRunOutput2D | null>(null);
  const [l34bError, setL34bError] = useState<string | null>(null);
  const [l34bFitRunning, setL34bFitRunning] = useState(false);
  const [l34bFitProgress, setL34bFitProgress] = useState(0);
  const [l34bFitCacheHit, setL34bFitCacheHit] = useState(false);
  const l3JobRef = useRef<L3ComputeJob | null>(null);
  const l34bFitTimeoutRef = useRef<number | null>(null);
  const l34bFitCacheRef = useRef<Map<string, FitRunOutput2D>>(new Map());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const result = useMemo(() => {
    return scene.solverSettings.activeSolverId === "geometric.l0"
      ? geometricL0Solver.run(scene, { solverId: "geometric.l0" })
      : geometricL1_2dSolver.run(scene, { solverId: "geometric.l1.2d" });
  }, [scene]);
  const activeL2Result = l2Result?.sceneHash === result.sceneHash ? l2Result : null;
  const activeL2Field = activeL2Result?.fieldOutputs?.[0];
  const activeL3Result = l3Result?.sceneHash === result.sceneHash ? l3Result : null;
  const activeL3Field = activeL3Result?.fieldImageOutputs?.[0];
  const l32Camera = useMemo<CameraModel2D>(() => cameraWithDefaults(l32CameraOverride ?? scene.cameraModels[0] ?? defaultL32CameraModel), [l32CameraOverride, scene.cameraModels]);
  const l32Measurement = useMemo<MeasurementSettings2D>(
    () =>
      scene.measurementSettings[0] ?? {
        id: "l3-measurement",
        label: "L3.2 target feature",
        targetFeaturePeriodM: 25e-6,
        mtfFrequencyCyclesPerM: 40_000,
        objectSpaceMagnification: 1
      },
    [scene.measurementSettings]
  );
  const l32SweepDefinition = useMemo<SweepDefinition | null>(() => scene.sweepDefinitions[0] ?? defaultL32SweepDefinitions[0] ?? null, [scene.sweepDefinitions]);
  const l32SensorImage = useMemo<CameraImageOutput2D | null>(() => (activeL3Field ? renderCameraImage2D(activeL3Field, l32Camera) : null), [activeL3Field, l32Camera]);
  const l32Snr = useMemo<SnrMetrics2D | null>(() => (l32SensorImage ? computeSnrMetrics2D(l32Camera, l32SensorImage) : null), [l32Camera, l32SensorImage]);
  const l32Mtf = useMemo<MtfMetrics2D | null>(() => (activeL3Field ? computeMtf2D(activeL3Field) : null), [activeL3Field]);
  const l32Psf = useMemo<PsfMetrics2D | null>(() => (activeL3Field ? computePsfMetrics2D(activeL3Field) : null), [activeL3Field]);
  const l32Sampling = useMemo<SamplingMetrics2D | null>(
    () => (l32Mtf ? computeSamplingMetrics2D({ pixelPitchM: l32Camera.pixelPitchM, measurement: l32Measurement, mtf: l32Mtf }) : null),
    [l32Camera.pixelPitchM, l32Measurement, l32Mtf]
  );
  const activeBrightfieldPipeline = scene.brightfieldPipelines2D[0];
  const activeTestTarget = useMemo<TestTarget2D | undefined>(
    () => (activeBrightfieldPipeline?.testTargetId ? scene.testTargets2D.find((target) => target.id === activeBrightfieldPipeline.testTargetId) : undefined),
    [activeBrightfieldPipeline?.testTargetId, scene.testTargets2D]
  );
  const l33TargetMetrics = useMemo<ResolutionTargetMetrics2D | null>(
    () => (activeL3Field && activeTestTarget ? computeResolutionTargetMetrics2D(activeL3Field, activeTestTarget) : null),
    [activeL3Field, activeTestTarget]
  );
  const activeMeasuredImage = scene.measuredImages2D[0];
  const activeMeasuredPixels = activeMeasuredImage === undefined ? undefined : measuredPixelsById[activeMeasuredImage!.id];
  const activeMeasurementRois = activeMeasuredImage === undefined ? [] : scene.measurementRois2D.filter((roi) => roi.imageId === activeMeasuredImage!.id);
  const l34bReport = useMemo<ComparisonReport2D | null>(
    () => (l34bComparison ? createComparisonReport2D({ scene, comparison: l34bComparison, fit: l34bFit }) : null),
    [l34bComparison, l34bFit, scene]
  );
  const l32Report = useMemo<EngineeringReport | null>(
    () =>
      activeL3Result && l32SensorImage && l32Snr && l32Mtf && l32Psf && l32Sampling
        ? createEngineeringReport({
            scene,
            result: activeL3Result,
            camera: l32Camera,
            measurement: l32Measurement,
            sensor: l32SensorImage,
            psf: l32Psf,
            mtf: l32Mtf,
            snr: l32Snr,
            sampling: l32Sampling,
            testTarget: activeTestTarget,
            resolutionTarget: l33TargetMetrics ?? undefined,
            sweep: l32SweepResult ?? undefined
          })
        : null,
    [activeL3Result, activeTestTarget, l32Camera, l32Measurement, l32Mtf, l32Psf, l32Sampling, l32SensorImage, l32Snr, l32SweepResult, l33TargetMetrics, scene]
  );
  const l2ValidationWarnings = useMemo(
    () => (scene.solverSettings.activeSolverId === "scalar.angularSpectrum.l2.1d" ? scalarAngularSpectrumL2_1dSolver.validateScene(scene) : []),
    [scene]
  );
  const l3ValidationWarnings = useMemo(
    () =>
      scene.solverSettings.activeSolverId === "scalar.partialCoherent.l3.3.2d"
        ? scalarPartialCoherentL33_2dSolver.validateScene(scene)
        : scene.solverSettings.activeSolverId === "scalar.coherent.l3.2d"
          ? scalarCoherentL3_2dSolver.validateScene(scene)
          : [],
    [scene]
  );
  const selectedItem = findSelected(scene, selected);
  const primaryHistogram = result.detectorHistograms?.[0];
  const primarySpot = result.readouts.spot?.[0];
  const primaryLens = result.readouts.thinLens?.[0];
  const primaryNA = result.readouts.numericalAperture?.[0];
  const primaryLensmaker = result.readouts.lensmaker?.[0];
  const primaryAberration = result.readouts.aberration?.[0];
  const primaryThickLens = scene.elements.find((element) => element.type === "thickLens2D");
  const l1FocusXM = (() => {
    if (primaryThickLens?.type !== "thickLens2D" || primaryLensmaker === undefined) return null;
    return primaryThickLens!.xM + primaryThickLens!.thicknessM + primaryLensmaker!.backFocalLengthM;
  })();
  const modeDisclosure = solverDisclosureFor(scene.solverSettings.activeSolverId, scene.samplePlanes1D.length > 0);

  function updateScene(updater: (current: Scene) => Scene): void {
    cancelL3Compute();
    cancelL34bFit();
    setL2Result(null);
    setL2Error(null);
    setL3Result(null);
    setL3Error(null);
    setL32SweepResult(null);
    setL34bComparison(null);
    setL34bFit(null);
    setL34bError(null);
    setScene((current) => touch(updater(current)));
  }

  function replaceScene(nextScene: Scene, nextSelected: SelectedItem = null): void {
    cancelL3Compute();
    cancelL34bFit();
    setL2Result(null);
    setL2Error(null);
    setL3Result(null);
    setL3Error(null);
    setL32CameraOverride(null);
    setL32SweepResult(null);
    setMeasuredPixelsById({});
    setL34bComparison(null);
    setL34bFit(null);
    setL34bError(null);
    setScene(nextScene);
    setSelected(nextSelected);
  }

  function loadWavePreset(presetId: L25PresetId): void {
    replaceScene(structuredClone(l25PresetScenes[presetId]), { kind: "element", id: "sample-marker" });
  }

  function loadImagePreset(presetId: ImagePresetId): void {
    replaceScene(structuredClone(isL33PresetId(presetId) ? l33PresetScenes[presetId] : l3PresetScenes[presetId]), { kind: "element", id: "l3-lens-marker" });
  }

  function updateItem(kind: SelectableKind, itemId: string, updater: (item: any) => any): void {
    updateScene((current) => {
      if (kind === "source") {
        return {
          ...current,
          sources: current.sources.map((source) => (source.id === itemId ? updater(source) : source))
        };
      }
      if (kind === "element") {
        const elements = current.elements.map((element) => (element.id === itemId ? updater(element) : element));
        const updated = elements.find((element) => element.id === itemId);
        return {
          ...current,
          elements,
          mediaCatalog:
            updated?.type === "thickLens2D"
              ? current.mediaCatalog.map((medium) =>
                  medium.id === updated.mediumId
                    ? { ...medium, refractiveIndex: { kind: "constant", n: updated.material.refractiveIndex } }
                    : medium
                )
              : current.mediaCatalog
        };
      }
      return {
        ...current,
        detectors: current.detectors.map((detector) => (detector.id === itemId ? updater(detector) : detector))
      };
    });
  }

  function updatePosition(target: SelectedItem, xM: number, yM: number | null): void {
    if (!target) return;
    updateItem(target.kind, target.id, (item: SourceElement | OpticalElement | DetectorElement) => {
      const next = { ...item, xM };
      if (yM === null) return next;
      if (item.type === "pointSource") return { ...next, yM };
      if (item.type === "collimatedSource") return { ...next, yCenterM: yM };
      return { ...next, yCenterM: yM };
    });
  }

  function addPointSource(): void {
    const newSource: SourceElement = {
      id: id("source"),
      type: "pointSource",
      label: "Point source",
      xM: 0.02,
      yM: 0,
      wavelengthM: scene.environment.defaultWavelengthM,
      powerW: 0.5,
      angularSpreadRad: toRadians(18, "deg"),
      rayCount: scene.solverSettings.rayCount
    };
    updateScene((current) => ({ ...current, sources: [...current.sources, newSource] }));
    setSelected({ kind: "source", id: newSource.id });
  }

  function addCollimatedSource(): void {
    const newSource: SourceElement = {
      id: id("beam"),
      type: "collimatedSource",
      label: "Collimated source",
      xM: 0.02,
      yCenterM: 0,
      beamHeightM: 0.014,
      wavelengthM: scene.environment.defaultWavelengthM,
      powerW: 0.5,
      angleRad: 0,
      rayCount: scene.solverSettings.rayCount
    };
    updateScene((current) => ({ ...current, sources: [...current.sources, newSource] }));
    setSelected({ kind: "source", id: newSource.id });
  }

  function addLens(): void {
    const lens: OpticalElement = {
      id: id("lens"),
      type: "thinLens",
      label: "Thin lens",
      xM: 0.095,
      yCenterM: 0,
      focalLengthM: 0.05,
      clearApertureM: 0.02,
      material: {
        refractiveIndex: 1.52,
        dispersionModel: "none"
      },
      approximation: "thinLensParaxial"
    };
    updateScene((current) => ({ ...current, elements: [...current.elements, lens] }));
    setSelected({ kind: "element", id: lens.id });
  }

  function addAperture(): void {
    const aperture: OpticalElement = {
      id: id("aperture"),
      type: "aperture",
      label: "Aperture stop",
      xM: 0.12,
      yCenterM: 0,
      diameterM: 0.012
    };
    updateScene((current) => ({ ...current, elements: [...current.elements, aperture] }));
    setSelected({ kind: "element", id: aperture.id });
  }

  function addDetector(): void {
    const detector: DetectorElement = {
      id: id("detector"),
      type: "screenDetector",
      label: "Screen detector",
      xM: 0.16,
      yCenterM: 0,
      heightM: 0.028,
      bins: 64
    };
    updateScene((current) => ({ ...current, detectors: [...current.detectors, detector] }));
    setSelected({ kind: "detector", id: detector.id });
  }

  function addThickLens(): void {
    const mediumId = id("glass");
    const lens: OpticalElement = {
      id: id("thick-lens"),
      type: "thickLens2D",
      label: "Biconvex thick lens",
      xM: 0.09,
      yCenterM: 0,
      thicknessM: 0.005,
      radius1M: 0.05,
      radius2M: -0.05,
      apertureDiameterM: 0.018,
      mediumId,
      material: {
        refractiveIndex: 1.5,
        dispersionModel: "none"
      },
      approximation: "surfaceSnell2D"
    };
    updateScene((current) => ({
      ...current,
      mediaCatalog: [
        ...current.mediaCatalog,
        {
          id: mediumId,
          label: "Glass n=1.5",
          refractiveIndex: {
            kind: "constant",
            n: 1.5
          }
        }
      ],
      elements: [...current.elements, lens],
      solverSettings: { ...current.solverSettings, activeSolverId: "geometric.l1.2d" }
    }));
    setSelected({ kind: "element", id: lens.id });
  }

  function deleteSelected(): void {
    if (!selected) return;
    updateScene((current) => {
      if (selected.kind === "source" && current.sources.length <= 1) return current;
      if (selected.kind === "detector" && current.detectors.length <= 1) return current;
      return {
        ...current,
        sources: selected.kind === "source" ? current.sources.filter((source) => source.id !== selected.id) : current.sources,
        elements: selected.kind === "element" ? current.elements.filter((element) => element.id !== selected.id) : current.elements,
        detectors:
          selected.kind === "detector" ? current.detectors.filter((detector) => detector.id !== selected.id) : current.detectors
      };
    });
    setSelected(null);
  }

  function saveScene(): void {
    downloadText(`${scene.name.replace(/\s+/g, "-").toLowerCase()}.emmicro.json`, "application/json", JSON.stringify(scene, null, 2));
  }

  async function loadScene(file: File): Promise<void> {
    const text = await file.text();
    const parsed = parseScene(JSON.parse(text));
    replaceScene(parsed);
  }

  function computeL2Profile(): void {
    try {
      const nextResult = scalarAngularSpectrumL2_1dSolver.run(scene, { solverId: "scalar.angularSpectrum.l2.1d" });
      setL2Result(nextResult);
      setL2Error(null);
    } catch (error) {
      setL2Result(null);
      setL2Error(error instanceof Error ? error.message : String(error));
    }
  }

  function computeL3Image(): void {
    cancelL3Compute();
    setL3Error(null);
    setL3Running(true);
    setL3Progress({ stage: "queued", percent: 0, message: "Queued L3 compute" });
    const sceneAtStart = scene;
    let job: L3ComputeJob;
    try {
      job = startL3ImageCompute(sceneAtStart, {
        onProgress: (progress) => {
          if (l3JobRef.current?.requestId === job.requestId) setL3Progress(progress);
        },
        onResult: (nextResult) => {
          if (l3JobRef.current?.requestId !== job.requestId) return;
          setL3Result(nextResult);
          setL3Running(false);
          setL3Progress({
            stage: nextResult.cacheHit ? "cache-hit" : "completed",
            percent: 100,
            message: nextResult.cacheHit ? "Loaded L3 result from cache" : "L3 image compute complete"
          });
          l3JobRef.current = null;
        },
        onError: (message) => {
          if (l3JobRef.current?.requestId !== job.requestId) return;
          setL3Result(null);
          setL3Running(false);
          setL3Error(message);
          setL3Progress({ stage: "error", percent: 100, message });
          l3JobRef.current = null;
        },
        onCancelled: () => {
          setL3Running(false);
          setL3Progress({ stage: "cancelled", percent: 100, message: "L3 compute cancelled" });
          l3JobRef.current = null;
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setL3Result(null);
      setL3Running(false);
      setL3Error(message);
      setL3Progress({ stage: "error", percent: 100, message });
      return;
    }
    l3JobRef.current = job;
  }

  function cancelL3Compute(): void {
    const job = l3JobRef.current;
    if (!job) return;
    l3JobRef.current = null;
    job.cancel();
  }

  function handleMeasuredPixelsReady(imageId: string, pixels: MeasuredImagePixels2D): void {
    setMeasuredPixelsById((current) => ({ ...current, [imageId]: pixels }));
  }

  function runL34bComparison(): void {
    try {
      if (!activeMeasuredImage) throw new Error("Import a measured image before comparing.");
      if (!activeMeasuredPixels) throw new Error("Measured pixels are not available in this browser session; re-import the image or use Fixture.");
      if (activeMeasurementRois.length === 0) throw new Error("Add at least one measured ROI before comparing.");
      if (!activeL3Field) throw new Error("Compute an L3/L3.3 simulated image before comparing.");
      const comparison = runMeasuredSimulatedComparison2D({
        id: `comparison-${Date.now().toString(36)}`,
        measuredImage: activeMeasuredImage,
        measuredPixels: activeMeasuredPixels,
        rois: activeMeasurementRois,
        simulatedField: activeL3Field,
        simulatedResult: activeL3Result,
        testTarget: activeTestTarget
      });
      setL34bComparison(comparison);
      setL34bFit(null);
      setL34bFitCacheHit(false);
      setL34bError(null);
    } catch (error) {
      setL34bComparison(null);
      setL34bFit(null);
      setL34bError(error instanceof Error ? error.message : String(error));
    }
  }

  function runL34bFit(presetId: FitPresetId2D): void {
    if (!l34bComparison) return;
    cancelL34bFit();
    const preset = fitPresetById2D(presetId);
    const cacheKey = makeFitRunCacheKey2D(l34bComparison, preset.parameters);
    const cached = l34bFitCacheRef.current.get(cacheKey);
    if (cached) {
      setL34bFit(cached);
      setL34bFitCacheHit(true);
      setL34bFitRunning(false);
      setL34bFitProgress(100);
      return;
    }
    setL34bFitRunning(true);
    setL34bFitProgress(5);
    setL34bFitCacheHit(false);
    setL34bError(null);
    l34bFitTimeoutRef.current = window.setTimeout(() => {
      try {
        setL34bFitProgress(45);
        const fit = runDeterministicFit2D({
          id: `fit-${Date.now().toString(36)}`,
          comparison: l34bComparison,
          fitParameters: preset.parameters
        });
        l34bFitCacheRef.current.set(cacheKey, fit);
        setL34bFit(fit);
        setL34bFitProgress(100);
      } catch (error) {
        setL34bError(error instanceof Error ? error.message : String(error));
        setL34bFit(null);
      } finally {
        setL34bFitRunning(false);
        l34bFitTimeoutRef.current = null;
      }
    }, 25);
  }

  function cancelL34bFit(): void {
    if (l34bFitTimeoutRef.current !== null) {
      window.clearTimeout(l34bFitTimeoutRef.current);
      l34bFitTimeoutRef.current = null;
    }
    setL34bFitRunning(false);
    setL34bFitProgress(0);
  }

  function exportL34bReport(format: "json" | "md" | "html"): void {
    if (!l34bReport) return;
    if (format === "json") {
      downloadText("comparison_report.json", "application/json", comparisonReportToJson(l34bReport));
      return;
    }
    if (format === "md") {
      downloadText("comparison_report.md", "text/markdown", comparisonReportToMarkdown(l34bReport));
      return;
    }
    downloadText("comparison_report.html", "text/html", comparisonReportToHtml(l34bReport));
  }

  function exportL34bMetricsCsv(): void {
    if (!l34bComparison) return;
    downloadText("measured_metrics.csv", "text/csv", comparisonMetricsToCsv2D(l34bComparison));
  }

  function exportL34bFitCsv(): void {
    if (!l34bFit) return;
    downloadText("fit_grid.csv", "text/csv", fitEvaluationsToCsv2D(l34bFit));
  }

  function exportL34bResidualPng(): void {
    if (!l34bComparison?.residualMap) return;
    const anchor = document.createElement("a");
    anchor.href = residualMapToPngDataUrl(l34bComparison.residualMap);
    anchor.download = "residual.png";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  function copyL3ValidationSummary(): void {
    const text = validationSummaryText(activeL3Field);
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(text);
      setL3Error(null);
      return;
    }
    downloadText("l3-validation-summary.txt", "text/plain", text);
  }

  function updateL32Camera(camera: CameraModel2D): void {
    setL32CameraOverride(camera);
    setL32SweepResult(null);
  }

  function runL32Sweep(): void {
    if (!activeL3Field || !l32SweepDefinition) return;
    setL32SweepResult(
      runSweepDefinition2D({
        field: activeL3Field,
        camera: l32Camera,
        measurement: l32Measurement,
        definition: l32SweepDefinition
      })
    );
  }

  function exportL32SweepCsv(): void {
    if (!l32SweepResult) return;
    downloadText(`${l32SweepResult.id}.csv`, "text/csv", sweepResultToCsv(l32SweepResult));
  }

  function exportL32SweepJson(): void {
    if (!l32SweepResult) return;
    downloadText(`${l32SweepResult.id}.json`, "application/json", JSON.stringify(l32SweepResult, null, 2));
  }

  function exportL32Report(format: "json" | "md" | "html"): void {
    if (!l32Report) return;
    if (format === "json") {
      downloadText("l32-engineering-report.json", "application/json", engineeringReportToJson(l32Report));
      return;
    }
    if (format === "md") {
      downloadText("l32-engineering-report.md", "text/markdown", engineeringReportToMarkdown(l32Report));
      return;
    }
    downloadText("l32-engineering-report.html", "text/html", engineeringReportToHtml(l32Report));
  }

  function exportPrimaryCsv(): void {
    if (isImageSolver(scene.solverSettings.activeSolverId) && activeL3Result && activeL3Field) {
      downloadText(`${activeL3Field.id}.csv`, "text/csv", fieldImageToCsv(activeL3Result, activeL3Field));
      return;
    }
    if (scene.solverSettings.activeSolverId === "scalar.angularSpectrum.l2.1d" && activeL2Result && activeL2Field) {
      downloadText(`${activeL2Field.id}.csv`, "text/csv", fieldProfileToCsv(activeL2Result, activeL2Field));
      return;
    }
    if (!primaryHistogram) return;
    downloadText(`${primaryHistogram.detectorId}-histogram.csv`, "text/csv", detectorHistogramToCsv(primaryHistogram));
  }

  function exportFieldJson(): void {
    if (isImageSolver(scene.solverSettings.activeSolverId) && activeL3Result && activeL3Field) {
      downloadText(`${activeL3Field.id}.json`, "application/json", fieldImageToJson(activeL3Result, activeL3Field));
      return;
    }
    if (!activeL2Result || !activeL2Field) return;
    downloadText(`${activeL2Field.id}.json`, "application/json", fieldProfileToJson(activeL2Result, activeL2Field));
  }

  function exportFieldPng(): void {
    if (!activeL3Field) return;
    const anchor = document.createElement("a");
    anchor.href = fieldImageToPngDataUrl(activeL3Field, l3DisplayMode);
    anchor.download = `${activeL3Field.id}.png`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">EM</div>
          <div>
            <h1>EMMicro</h1>
            <p>{scene.name}</p>
          </div>
        </div>
        <div className="mode-badge">
          <Gauge size={16} />
          <span>{modeDisclosure.label}</span>
          <strong>{modeDisclosure.detail}</strong>
        </div>
        <div className="top-actions">
          <button
            className="icon-button"
            type="button"
            title="Reset sample scene"
            onClick={() =>
              replaceScene(
                scene.solverSettings.activeSolverId === "scalar.coherent.l3.2d"
                  ? structuredClone(l3PresetScenes.airyPupil)
                  : scene.solverSettings.activeSolverId === "scalar.partialCoherent.l3.3.2d"
                    ? structuredClone(l33PresetScenes.linePairs)
                  : scene.solverSettings.activeSolverId === "scalar.angularSpectrum.l2.1d"
                    ? structuredClone(l25PresetScenes.singleSlit)
                    : sampleL1Scene,
                scene.solverSettings.activeSolverId === "scalar.coherent.l3.2d"
                  ? { kind: "element", id: "l3-lens-marker" }
                  : scene.solverSettings.activeSolverId === "scalar.partialCoherent.l3.3.2d"
                    ? { kind: "element", id: "l3-lens-marker" }
                  : scene.solverSettings.activeSolverId === "scalar.angularSpectrum.l2.1d"
                    ? { kind: "element", id: "sample-marker" }
                    : { kind: "element", id: "lens-thick-biconvex" }
              )
            }
          >
            <RotateCcw size={17} />
          </button>
          <button className="icon-button" type="button" title="Save scene JSON" onClick={saveScene}>
            <Save size={17} />
          </button>
          <button className="icon-button" type="button" title="Load scene JSON" onClick={() => fileInputRef.current?.click()}>
            <FolderOpen size={17} />
          </button>
          <button className="icon-button" type="button" title="Export current profile, image, or detector CSV" onClick={exportPrimaryCsv}>
            <FileDown size={17} />
          </button>
          <input
            ref={fileInputRef}
            className="hidden-file"
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void loadScene(file);
              event.currentTarget.value = "";
            }}
          />
        </div>
      </header>

      <main className="workspace">
        <aside className="tool-rail" aria-label="Optical elements">
          <div className="rail-section">
            <h2>Add</h2>
            <button type="button" title="Add point source" onClick={addPointSource}>
              <Lightbulb size={17} />
              <span>Point</span>
            </button>
            <button type="button" title="Add collimated beam" onClick={addCollimatedSource}>
              <Download size={17} />
              <span>Beam</span>
            </button>
            <button type="button" title="Add thin lens" onClick={addLens}>
              <Plus size={17} />
              <span>Lens</span>
            </button>
            <button type="button" title="Add biconvex thick lens" onClick={addThickLens}>
              <Plus size={17} />
              <span>Thick lens</span>
            </button>
            <button type="button" title="Add aperture stop" onClick={addAperture}>
              <Aperture size={17} />
              <span>Aperture</span>
            </button>
            <button type="button" title="Add detector screen" onClick={addDetector}>
              <SlidersHorizontal size={17} />
              <span>Detector</span>
            </button>
          </div>

          <SceneControls
            scene={scene}
            updateScene={updateScene}
            loadL2Sample={() => replaceScene(sampleL2Scene, { kind: "element", id: "slit-ray-marker" })}
            loadWavePreset={loadWavePreset}
            loadImagePreset={loadImagePreset}
          />

          <div className="rail-section">
            <h2>Scene</h2>
            <div className="compact-stat">
              <span>Scene hash</span>
              <strong>{result.sceneHash.slice(0, 10)}</strong>
            </div>
            <div className="compact-stat">
              <span>Seed</span>
              <strong>{result.seed}</strong>
            </div>
          </div>
        </aside>

        <section className="bench-region" aria-label="Optical bench">
          <BenchCanvas scene={scene} result={result} selected={selected} onSelect={setSelected} onMove={updatePosition} />
          <ReadoutStrip
            solverId={scene.solverSettings.activeSolverId}
            focalXM={scene.solverSettings.activeSolverId === "geometric.l0" ? primaryLens?.focalPlaneXM ?? null : l1FocusXM}
            magnification={primaryLens?.magnification ?? null}
            na={primaryNA?.numericalAperture ?? null}
            airyM={primaryNA?.airyRadiusM ?? null}
            spotM={primarySpot?.rmsRadiusM ?? null}
            effectiveFocalLengthM={primaryLensmaker?.effectiveFocalLengthM ?? null}
            backFocalLengthM={primaryLensmaker?.backFocalLengthM ?? null}
            aberrationM={primaryAberration?.longitudinalSphericalAberrationM ?? null}
            tirCount={primaryAberration?.tirCount ?? 0}
            detectorPowerW={primaryHistogram?.totalPowerW ?? 0}
            rayCount={primaryHistogram?.rayCount ?? 0}
            l2Field={activeL2Field}
            l2Energy={activeL2Result?.energyLedger}
            l2WarningCount={(activeL2Result?.warnings ?? l2ValidationWarnings).length}
            l3Field={activeL3Field}
            l3Energy={activeL3Result?.energyLedger}
            l3WarningCount={(activeL3Result?.warnings ?? l3ValidationWarnings).length}
          />
        </section>

        <aside className="properties" aria-label="Properties">
          <div className="panel-heading">
            <h2>Properties</h2>
            <button className="icon-button danger" type="button" title="Delete selected element" onClick={deleteSelected}>
              <Trash2 size={17} />
            </button>
          </div>
          <ElementProperties selectedItem={selectedItem} updateItem={updateItem} />
          <ImageImportPanel scene={scene} updateScene={updateScene} onPixelsReady={handleMeasuredPixelsReady} />
          <CalibrationPanel image={activeMeasuredImage} updateScene={updateScene} />
          <RoiPanel image={activeMeasuredImage} scene={scene} updateScene={updateScene} />
          <ComparePanel
            image={activeMeasuredImage}
            pixels={activeMeasuredPixels}
            rois={activeMeasurementRois}
            field={activeL3Field}
            comparison={l34bComparison}
            fit={l34bFit}
            error={l34bError}
            onRunCompare={runL34bComparison}
            onExportJson={() => exportL34bReport("json")}
            onExportMarkdown={() => exportL34bReport("md")}
            onExportHtml={() => exportL34bReport("html")}
            onExportMetricsCsv={exportL34bMetricsCsv}
            onExportResidualPng={exportL34bResidualPng}
          />
          <FitPanel
            comparison={l34bComparison}
            fit={l34bFit}
            running={l34bFitRunning}
            progress={l34bFitProgress}
            cacheHit={l34bFitCacheHit}
            onRunFit={runL34bFit}
            onCancelFit={cancelL34bFit}
            onExportFitCsv={exportL34bFitCsv}
          />
          <MaxwellPanel />

          {scene.solverSettings.activeSolverId === "scalar.angularSpectrum.l2.1d" && (
            <WavePanel
              field={activeL2Field}
              result={activeL2Result}
              validationWarnings={l2ValidationWarnings}
              error={l2Error}
              disclosure={modeDisclosure}
              onCompute={computeL2Profile}
              onExportCsv={exportPrimaryCsv}
              onExportJson={exportFieldJson}
            />
          )}
          {isImageSolver(scene.solverSettings.activeSolverId) && (
            <ImagePanel
              scene={scene}
              field={activeL3Field}
              result={activeL3Result}
              validationWarnings={l3ValidationWarnings}
              error={l3Error}
              disclosure={modeDisclosure}
              onCompute={computeL3Image}
              running={l3Running}
              progress={l3Progress}
              onCancel={cancelL3Compute}
              displayMode={l3DisplayMode}
              onDisplayModeChange={setL3DisplayMode}
              onExportCsv={exportPrimaryCsv}
              onExportJson={exportFieldJson}
              onExportPng={exportFieldPng}
              onCopyValidationSummary={copyL3ValidationSummary}
              camera={l32Camera}
              sensorImage={l32SensorImage}
              snr={l32Snr}
              mtf={l32Mtf}
              psf={l32Psf}
              sampling={l32Sampling}
              testTarget={activeTestTarget}
              resolutionTargetMetrics={l33TargetMetrics}
              sweepDefinition={l32SweepDefinition}
              sweepResult={l32SweepResult}
              report={l32Report}
              onCameraChange={updateL32Camera}
              onRunSweep={runL32Sweep}
              onExportSweepCsv={exportL32SweepCsv}
              onExportSweepJson={exportL32SweepJson}
              onExportReportJson={() => exportL32Report("json")}
              onExportReportMarkdown={() => exportL32Report("md")}
              onExportReportHtml={() => exportL32Report("html")}
            />
          )}

          <section className="readout-panel">
            <h2>Provenance</h2>
            <ul>
              <li>
                Ray paths: simulated{" "}
                {scene.solverSettings.activeSolverId === "geometric.l0" ? "L0 geometric" : "L1 2D surface context"}
              </li>
              <li>Thin-lens image: analytic paraxial estimate</li>
              <li>Thick-lens EFL/BFL: analytic paraxial estimate</li>
              <li>NA/Airy: analytic lower-bound estimate only</li>
              <li>Spot size: geometric detector RMS</li>
              {scene.solverSettings.activeSolverId === "scalar.angularSpectrum.l2.1d" && (
                <li>
                  L2 profile: simulated scalar 1D {scene.samplePlanes1D.length > 0 ? "sample propagation" : "angular-spectrum field"};
                  not a full microscope image, full PSF, or Airy disk
                </li>
              )}
              {scene.solverSettings.activeSolverId === "scalar.coherent.l3.2d" && (
                <li>L3 image: coherent 2D scalar image-plane intensity approximation; not partial coherence, vector optics, fluorescence, 3D physics, or EM</li>
              )}
              {scene.solverSettings.activeSolverId === "scalar.partialCoherent.l3.3.2d" && (
                <li>L3.3 image: partial-coherence scalar brightfield approximation using source-angle intensity averaging; not vector optics, fluorescence, 3D physics, EM, or certified metrology</li>
              )}
            </ul>
          </section>
        </aside>
      </main>
    </div>
  );
}

function SceneControls({
  scene,
  updateScene,
  loadL2Sample,
  loadWavePreset,
  loadImagePreset
}: {
  scene: Scene;
  updateScene: (updater: (current: Scene) => Scene) => void;
  loadL2Sample: () => void;
  loadWavePreset: (presetId: L25PresetId) => void;
  loadImagePreset: (presetId: ImagePresetId) => void;
}) {
  return (
    <div className="rail-section">
      <h2>Bench</h2>
      <label className="field-row">
        <span>Solver</span>
        <select
          value={scene.solverSettings.activeSolverId}
          onChange={(event) => {
            const activeSolverId = event.currentTarget.value as ActiveSolverId;
            if (activeSolverId === "scalar.coherent.l3.2d" && scene.fieldGrids2D.length === 0) {
              loadImagePreset("airyPupil");
              return;
            }
            if (activeSolverId === "scalar.partialCoherent.l3.3.2d" && scene.brightfieldPipelines2D.length === 0) {
              loadImagePreset("linePairs");
              return;
            }
            if (activeSolverId === "scalar.angularSpectrum.l2.1d" && scene.fieldGrids1D.length === 0) {
              loadWavePreset("singleSlit");
              return;
            }
            updateScene((current) => ({
              ...current,
              solverSettings: {
                ...current.solverSettings,
                activeSolverId
              }
            }));
          }}
        >
          <option value="geometric.l1.2d">L1 surface optics</option>
          <option value="geometric.l0">L0 thin lens</option>
          <option value="scalar.angularSpectrum.l2.1d">L2 wave profile</option>
          <option value="scalar.coherent.l3.2d">L3 image map</option>
          <option value="scalar.partialCoherent.l3.3.2d">L3.3 brightfield</option>
        </select>
      </label>
      <NumberField
        label="Wavelength"
        value={fromMeters(scene.environment.defaultWavelengthM, "nm")}
        unit="nm"
        min={200}
        max={1200}
        step={5}
        onChange={(value) =>
          updateScene((current) => {
            const wavelengthM = toMeters(value, "nm");
            return {
              ...current,
              environment: { ...current.environment, defaultWavelengthM: wavelengthM },
              sources: current.sources.map((source) => ({ ...source, wavelengthM }))
            };
          })
        }
      />
      <NumberField
        label="Ambient n"
        value={scene.environment.ambientRefractiveIndex}
        min={1}
        max={3}
        step={0.01}
        onChange={(value) =>
          updateScene((current) => ({
            ...current,
            environment: { ...current.environment, ambientRefractiveIndex: value }
          }))
        }
      />
      <NumberField
        label="Rays/source"
        value={scene.solverSettings.rayCount}
        min={1}
        max={512}
        step={1}
        onChange={(value) =>
          updateScene((current) => {
            const rayCount = Math.max(1, Math.round(value));
            return {
              ...current,
              solverSettings: { ...current.solverSettings, rayCount },
              sources: current.sources.map((source) => ({ ...source, rayCount }))
            };
          })
        }
      />
      {scene.solverSettings.activeSolverId === "scalar.angularSpectrum.l2.1d" && (
        <WaveControls scene={scene} updateScene={updateScene} loadL2Sample={loadL2Sample} loadWavePreset={loadWavePreset} />
      )}
      {isImageSolver(scene.solverSettings.activeSolverId) && <ImageControls scene={scene} updateScene={updateScene} loadImagePreset={loadImagePreset} />}
    </div>
  );
}

function WaveControls({
  scene,
  updateScene,
  loadL2Sample,
  loadWavePreset
}: {
  scene: Scene;
  updateScene: (updater: (current: Scene) => Scene) => void;
  loadL2Sample: () => void;
  loadWavePreset: (presetId: L25PresetId) => void;
}) {
  const grid = scene.fieldGrids1D[0];
  const detectorPlane = scene.fieldPlanes1D.find((plane) => plane.role === "detector");
  const mask = scene.masks1D.find((candidate) => candidate.type === "rectAperture1D");
  const sample = scene.samplePlanes1D[0];

  if (!grid || !detectorPlane) {
    return (
      <button type="button" title="Load L2.5 single-slit sample fixture" onClick={() => loadWavePreset("singleSlit")}>
        <Waves size={17} />
        <span>Sample fixture</span>
      </button>
    );
  }

  return (
    <>
      <label className="field-row">
        <span>Preset</span>
        <select
          value={wavePresetIdFor(scene)}
          onChange={(event) => {
            const presetId = event.currentTarget.value as WavePresetValue;
            if (presetId !== "custom") loadWavePreset(presetId);
          }}
        >
          <option value="custom">Custom scene</option>
          {l25PresetDefinitions.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>
      {sample ? (
        <SamplePlaneControls sample={sample} updateScene={updateScene} />
      ) : mask ? (
        <>
          <NumberField
            label="Slit width"
            value={fromMeters(mask.widthM, "um")}
            unit="um"
            min={10}
            max={2000}
            step={10}
            onChange={(value) => {
              const maskId = mask.id;
              updateScene((current) => ({
                ...current,
                masks1D: current.masks1D.map((candidate) =>
                  candidate.id === maskId && candidate.type === "rectAperture1D"
                    ? { ...candidate, widthM: Math.max(1e-9, toMeters(value, "um")) }
                    : candidate
                )
              }));
            }}
          />
          <button type="button" title="Load L2.5 sample preset" onClick={() => loadWavePreset("singleSlit")}>
            <Waves size={17} />
            <span>Use sample presets</span>
          </button>
        </>
      ) : (
        <button type="button" title="Load L2 slit diffraction fixture" onClick={loadL2Sample}>
          <Waves size={17} />
          <span>Slit fixture</span>
        </button>
      )}
      <NumberField
        label="Distance"
        value={fromMeters(detectorPlane.xM, "mm")}
        unit="mm"
        min={1}
        max={3000}
        step={10}
        onChange={(value) => {
          const planeId = detectorPlane.id;
          const detectorXM = Math.max(1e-6, toMeters(value, "mm"));
          updateScene((current) => ({
            ...current,
            fieldPlanes1D: current.fieldPlanes1D.map((plane) => (plane.id === planeId ? { ...plane, xM: detectorXM } : plane)),
            detectors: current.detectors.map((detector, index) => (index === 0 ? { ...detector, xM: detectorXM } : detector)),
            bench: { ...current.bench, xMaxM: Math.max(current.bench.xMaxM, detectorXM + 0.05) }
          }));
        }}
      />
      <NumberField
        label="Window"
        value={fromMeters(grid.yMaxM - grid.yMinM, "mm")}
        unit="mm"
        min={2}
        max={100}
        step={1}
        onChange={(value) => {
          const gridId = grid.id;
          const heightM = Math.max(1e-6, toMeters(value, "mm"));
          updateScene((current) => ({
            ...current,
            fieldGrids1D: current.fieldGrids1D.map((candidate) =>
              candidate.id === gridId
                ? {
                    ...candidate,
                    yMinM: -heightM / 2,
                    yMaxM: heightM / 2,
                    spacingM: heightM / candidate.samples
                  }
                : candidate
            ),
            bench: { ...current.bench, yMinM: -heightM / 2, yMaxM: heightM / 2 },
            detectors: current.detectors.map((detector, index) => (index === 0 ? { ...detector, heightM } : detector))
          }));
        }}
      />
      <label className="field-row">
        <span>Samples</span>
        <select
          value={grid.samples}
          onChange={(event) => {
            const samples = Number(event.currentTarget.value);
            const gridId = grid.id;
            updateScene((current) => ({
              ...current,
              fieldGrids1D: current.fieldGrids1D.map((candidate) =>
                candidate.id === gridId
                  ? {
                      ...candidate,
                      samples,
                      spacingM: (candidate.yMaxM - candidate.yMinM) / samples
                    }
                  : candidate
              )
            }));
          }}
        >
          <option value={1024}>1024</option>
          <option value={2048}>2048</option>
          <option value={4096}>4096</option>
          <option value={8192}>8192</option>
        </select>
      </label>
    </>
  );
}

function ImageControls({
  scene,
  updateScene,
  loadImagePreset
}: {
  scene: Scene;
  updateScene: (updater: (current: Scene) => Scene) => void;
  loadImagePreset: (presetId: ImagePresetId) => void;
}) {
  const grid = scene.fieldGrids2D[0];
  const pipeline = scene.microscopePipelines2D[0];
  const lens = pipeline ? scene.thinLensPhasePlanes2D.find((candidate) => candidate.id === pipeline.lensPlaneId) : undefined;
  const pupil = pipeline ? scene.pupilPlanes2D.find((candidate) => candidate.id === pipeline.pupilPlaneId) : undefined;
  const detector = pipeline ? scene.detectorPlanes2D.find((candidate) => candidate.id === pipeline.detectorPlaneId) : undefined;
  const brightfield = scene.brightfieldPipelines2D[0];
  const illumination = brightfield ? scene.illuminationModels2D.find((candidate) => candidate.id === brightfield.illuminationModelId) : undefined;
  const target = brightfield?.testTargetId ? scene.testTargets2D.find((candidate) => candidate.id === brightfield.testTargetId) : undefined;

  if (!grid || !pipeline || !lens || !pupil || !detector || (scene.solverSettings.activeSolverId === "scalar.partialCoherent.l3.3.2d" && (!brightfield || !illumination))) {
    return (
      <button type="button" title="Load L3 image fixture" onClick={() => loadImagePreset(scene.solverSettings.activeSolverId === "scalar.partialCoherent.l3.3.2d" ? "linePairs" : "airyPupil")}>
        <Waves size={17} />
        <span>{scene.solverSettings.activeSolverId === "scalar.partialCoherent.l3.3.2d" ? "L3.3 fixture" : "L3 fixture"}</span>
      </button>
    );
  }

  const pupilRadiusM = pupil.shape.kind === "circle" ? pupil.shape.radiusM : pupil.shape.outerRadiusM;

  return (
    <>
      <label className="field-row">
        <span>Preset</span>
        <select
          value={imagePresetIdFor(scene)}
          onChange={(event) => {
            const presetId = event.currentTarget.value as ImagePresetValue;
            if (presetId !== "custom") loadImagePreset(presetId);
          }}
        >
          <option value="custom">Custom scene</option>
          <optgroup label="L3 coherent">
            {l3PresetDefinitions.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="L3.3 brightfield">
            {l33PresetDefinitions.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </optgroup>
        </select>
      </label>
      {brightfield && illumination && (
        <>
          <label className="field-row">
            <span>Target</span>
            <select
              value={target?.id ?? ""}
              onChange={(event) => {
                const testTargetId = event.currentTarget.value;
                updateScene((current) => ({
                  ...current,
                  brightfieldPipelines2D: current.brightfieldPipelines2D.map((candidate) =>
                    candidate.id === brightfield.id ? { ...candidate, testTargetId } : candidate
                  )
                }));
              }}
            >
              {scene.testTargets2D.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.label}
                </option>
              ))}
            </select>
          </label>
          {illumination.kind !== "singleCoherentAngle" && (
            <NumberField
              label="Source NA"
              value={illumination.kind === "uniformDisk" ? illumination.sourceNA : illumination.outerNA}
              min={0}
              max={0.2}
              step={0.0005}
              onChange={(value) => {
                const sourceNA = Math.max(0, value);
                updateScene((current) => ({
                  ...current,
                  illuminationModels2D: current.illuminationModels2D.map((candidate) =>
                    candidate.id === illumination.id
                      ? candidate.kind === "uniformDisk"
                        ? { ...candidate, sourceNA }
                        : candidate.kind === "annulus"
                          ? { ...candidate, outerNA: Math.max(sourceNA, candidate.innerNA + 1e-6) }
                          : candidate
                      : candidate
                  )
                }));
              }}
            />
          )}
          {illumination.kind !== "singleCoherentAngle" && (
            <label className="field-row">
              <span>Angles</span>
              <select
                value={illumination.sampleCount}
                onChange={(event) => {
                  const sampleCount = Number(event.currentTarget.value);
                  updateScene((current) => ({
                    ...current,
                    illuminationModels2D: current.illuminationModels2D.map((candidate) =>
                      candidate.id === illumination.id && candidate.kind === "uniformDisk"
                        ? { ...candidate, sampleCount: uniformDiskSampleCount(sampleCount) }
                        : candidate.id === illumination.id && candidate.kind === "annulus"
                          ? { ...candidate, sampleCount: annulusSampleCount(sampleCount) }
                        : candidate
                    )
                  }));
                }}
              >
                {(illumination.kind === "uniformDisk" ? uniformDiskSampleCounts : annulusSampleCounts).map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </label>
          )}
        </>
      )}
      <div className="field-row readonly-row">
        <span>Grid</span>
        <strong>{grid.width} x {grid.height}</strong>
      </div>
      <div className="field-row readonly-row">
        <span>Wavelength</span>
        <strong>{(pipeline.wavelengthM * 1e9).toFixed(0)} nm</strong>
      </div>
      <div className="field-row readonly-row">
        <span>Focal length</span>
        <strong>{formatLength(lens.focalLengthM, "mm")}</strong>
      </div>
      <div className="field-row readonly-row">
        <span>Pupil</span>
        <strong>{formatLength(pupilRadiusM * 2, "um")}</strong>
      </div>
      <div className="field-row readonly-row">
        <span>Detector</span>
        <strong>{formatLength(detector.xM, "mm")}</strong>
      </div>
    </>
  );
}

function SamplePlaneControls({
  sample,
  updateScene
}: {
  sample: SamplePlane1D;
  updateScene: (updater: (current: Scene) => Scene) => void;
}) {
  const updateSample = (updater: (current: SamplePlane1D) => SamplePlane1D) => {
    updateScene((current) => {
      const existing = current.samplePlanes1D.find((candidate) => candidate.id === sample.id);
      if (!existing) return current;
      const markerSample = updater(existing);
      const samplePlanes1D = current.samplePlanes1D.map((candidate) => (candidate.id === sample.id ? markerSample : candidate));
      return {
        ...current,
        samplePlanes1D,
        elements: current.elements.map((element) =>
          element.id === "sample-marker" && element.type === "aperture"
            ? { ...element, label: markerSample.label, diameterM: sampleVisualDiameterM(markerSample) }
            : element
        )
      };
    });
  };

  const transmission = sample.transmission;
  const profile = transmission.kind === "analyticAmplitude" ? transmission.profile : transmission.kind === "analyticPhase" ? transmission.profile : transmission.amplitudeProfile;

  return (
    <>
      <div className="compact-stat">
        <span>Sample</span>
        <strong>{profile.kind}</strong>
      </div>
      {transmission.kind === "analyticAmplitude" && profile.kind === "singleSlit" && (
        <NumberField
          label="Width"
          value={fromMeters(profile.widthM, "um")}
          unit="um"
          min={5}
          max={2000}
          step={5}
          onChange={(value) =>
            updateSample((current) => ({
              ...current,
              transmission: {
                kind: "analyticAmplitude",
                profile: { ...profile, widthM: Math.max(1e-9, toMeters(value, "um")) }
              }
            }))
          }
        />
      )}
      {transmission.kind === "analyticAmplitude" && profile.kind === "doubleSlit" && (
        <>
          <NumberField
            label="Slit width"
            value={fromMeters(profile.slitWidthM, "um")}
            unit="um"
            min={2}
            max={500}
            step={2}
            onChange={(value) =>
              updateSample((current) => ({
                ...current,
                transmission: {
                  kind: "analyticAmplitude",
                  profile: { ...profile, slitWidthM: Math.max(1e-9, toMeters(value, "um")) }
                }
              }))
            }
          />
          <NumberField
            label="Separation"
            value={fromMeters(profile.separationM, "um")}
            unit="um"
            min={5}
            max={1000}
            step={5}
            onChange={(value) =>
              updateSample((current) => ({
                ...current,
                transmission: {
                  kind: "analyticAmplitude",
                  profile: { ...profile, separationM: Math.max(1e-9, toMeters(value, "um")) }
                }
              }))
            }
          />
        </>
      )}
      {transmission.kind === "analyticAmplitude" && profile.kind === "grating" && (
        <>
          <NumberField
            label="Period"
            value={fromMeters(profile.periodM, "um")}
            unit="um"
            min={2}
            max={500}
            step={1}
            onChange={(value) =>
              updateSample((current) => ({
                ...current,
                transmission: {
                  kind: "analyticAmplitude",
                  profile: { ...profile, periodM: Math.max(1e-9, toMeters(value, "um")) }
                }
              }))
            }
          />
          <NumberField
            label="Open width"
            value={fromMeters(profile.slitWidthM, "um")}
            unit="um"
            min={1}
            max={500}
            step={1}
            onChange={(value) =>
              updateSample((current) => ({
                ...current,
                transmission: {
                  kind: "analyticAmplitude",
                  profile: { ...profile, slitWidthM: Math.max(1e-9, toMeters(value, "um")) }
                }
              }))
            }
          />
          <NumberField
            label="Lines"
            value={profile.count}
            min={1}
            max={101}
            step={2}
            onChange={(value) =>
              updateSample((current) => ({
                ...current,
                transmission: {
                  kind: "analyticAmplitude",
                  profile: { ...profile, count: Math.max(1, Math.round(value)) }
                }
              }))
            }
          />
        </>
      )}
      {transmission.kind === "analyticAmplitude" && profile.kind === "barTarget1D" && (
        <>
          <NumberField
            label="Period"
            value={fromMeters(profile.periodM, "um")}
            unit="um"
            min={10}
            max={2000}
            step={10}
            onChange={(value) =>
              updateSample((current) => ({
                ...current,
                transmission: {
                  kind: "analyticAmplitude",
                  profile: { ...profile, periodM: Math.max(1e-9, toMeters(value, "um")) }
                }
              }))
            }
          />
          <NumberField
            label="Duty"
            value={profile.dutyCycle * 100}
            unit="%"
            min={1}
            max={99}
            step={1}
            onChange={(value) =>
              updateSample((current) => ({
                ...current,
                transmission: {
                  kind: "analyticAmplitude",
                  profile: { ...profile, dutyCycle: Math.min(0.99, Math.max(0.01, value / 100)) }
                }
              }))
            }
          />
          <NumberField
            label="Contrast"
            value={profile.contrast * 100}
            unit="%"
            min={0}
            max={100}
            step={1}
            onChange={(value) =>
              updateSample((current) => ({
                ...current,
                transmission: {
                  kind: "analyticAmplitude",
                  profile: { ...profile, contrast: Math.min(1, Math.max(0, value / 100)) }
                }
              }))
            }
          />
        </>
      )}
      {transmission.kind === "analyticPhase" && profile.kind === "phaseStep" && (
        <>
          <NumberField
            label="Step y"
            value={fromMeters(profile.stepYM, "um")}
            unit="um"
            step={10}
            onChange={(value) =>
              updateSample((current) => ({
                ...current,
                transmission: {
                  kind: "analyticPhase",
                  profile: { ...profile, stepYM: toMeters(value, "um") }
                }
              }))
            }
          />
          <NumberField
            label="Right phase"
            value={profile.phaseRightRad}
            unit="rad"
            min={-Math.PI * 4}
            max={Math.PI * 4}
            step={0.1}
            onChange={(value) =>
              updateSample((current) => ({
                ...current,
                transmission: {
                  kind: "analyticPhase",
                  profile: { ...profile, phaseRightRad: value }
                }
              }))
            }
          />
        </>
      )}
      {transmission.kind === "analyticPhase" && profile.kind === "phaseGrating" && (
        <>
          <NumberField
            label="Period"
            value={fromMeters(profile.periodM, "um")}
            unit="um"
            min={2}
            max={1000}
            step={2}
            onChange={(value) =>
              updateSample((current) => ({
                ...current,
                transmission: {
                  kind: "analyticPhase",
                  profile: { ...profile, periodM: Math.max(1e-9, toMeters(value, "um")) }
                }
              }))
            }
          />
          <NumberField
            label="Depth"
            value={profile.phaseDepthRad}
            unit="rad"
            min={-Math.PI * 4}
            max={Math.PI * 4}
            step={0.1}
            onChange={(value) =>
              updateSample((current) => ({
                ...current,
                transmission: {
                  kind: "analyticPhase",
                  profile: { ...profile, phaseDepthRad: value }
                }
              }))
            }
          />
        </>
      )}
    </>
  );
}

function ElementProperties({
  selectedItem,
  updateItem
}: {
  selectedItem: EditableItem | null;
  updateItem: (kind: SelectableKind, itemId: string, updater: (item: any) => any) => void;
}) {
  if (!selectedItem) {
    return <div className="empty-state">Select an element on the bench.</div>;
  }

  const { item, kind } = selectedItem;
  const update = (updater: (item: any) => any) => updateItem(kind, item.id, updater);

  return (
    <section className="property-fields">
      <div className="selected-title">
        <span>{item.type}</span>
        <strong>{item.label}</strong>
      </div>
      <TextField label="Label" value={item.label} onChange={(label) => update((current) => ({ ...current, label }))} />
      <NumberField label="x" value={fromMeters(item.xM, "mm")} unit="mm" step={1} onChange={(value) => update((current) => ({ ...current, xM: toMeters(value, "mm") }))} />

      {item.type === "pointSource" && (
        <>
          <NumberField label="y" value={fromMeters(item.yM, "mm")} unit="mm" step={0.25} onChange={(value) => update((current) => ({ ...current, yM: toMeters(value, "mm") }))} />
          <NumberField label="Spread" value={fromRadians(item.angularSpreadRad, "deg")} unit="deg" min={0} max={90} step={0.5} onChange={(value) => update((current) => ({ ...current, angularSpreadRad: toRadians(value, "deg") }))} />
          <SourceSharedFields source={item} update={update} />
        </>
      )}

      {item.type === "collimatedSource" && (
        <>
          <NumberField label="center y" value={fromMeters(item.yCenterM, "mm")} unit="mm" step={0.25} onChange={(value) => update((current) => ({ ...current, yCenterM: toMeters(value, "mm") }))} />
          <NumberField label="Beam height" value={fromMeters(item.beamHeightM, "mm")} unit="mm" min={0.1} step={0.25} onChange={(value) => update((current) => ({ ...current, beamHeightM: toMeters(value, "mm") }))} />
          <NumberField label="Angle" value={fromRadians(item.angleRad, "deg")} unit="deg" step={0.25} onChange={(value) => update((current) => ({ ...current, angleRad: toRadians(value, "deg") }))} />
          <SourceSharedFields source={item} update={update} />
        </>
      )}

      {item.type === "thinLens" && (
        <>
          <NumberField label="center y" value={fromMeters(item.yCenterM, "mm")} unit="mm" step={0.25} onChange={(value) => update((current) => ({ ...current, yCenterM: toMeters(value, "mm") }))} />
          <NumberField label="Focal length" value={fromMeters(item.focalLengthM, "mm")} unit="mm" step={1} onChange={(value) => update((current) => ({ ...current, focalLengthM: toMeters(value, "mm") || 1e-6 }))} />
          <NumberField label="Clear aperture" value={fromMeters(item.clearApertureM, "mm")} unit="mm" min={0.1} step={0.25} onChange={(value) => update((current) => ({ ...current, clearApertureM: toMeters(value, "mm") }))} />
          <NumberField label="Material n" value={item.material.refractiveIndex} min={1} max={3} step={0.01} onChange={(value) => update((current) => ({ ...current, material: { ...current.material, refractiveIndex: value } }))} />
        </>
      )}

      {item.type === "thickLens2D" && (
        <>
          <NumberField label="center y" value={fromMeters(item.yCenterM, "mm")} unit="mm" step={0.25} onChange={(value) => update((current) => ({ ...current, yCenterM: toMeters(value, "mm") }))} />
          <NumberField label="R1" value={fromMeters(item.radius1M, "mm")} unit="mm" step={1} onChange={(value) => update((current) => ({ ...current, radius1M: toMeters(value, "mm") || 1e-6 }))} />
          <NumberField label="R2" value={fromMeters(item.radius2M, "mm")} unit="mm" step={1} onChange={(value) => update((current) => ({ ...current, radius2M: toMeters(value, "mm") || -1e-6 }))} />
          <NumberField label="Thickness" value={fromMeters(item.thicknessM, "mm")} unit="mm" min={0.1} step={0.25} onChange={(value) => update((current) => ({ ...current, thicknessM: toMeters(value, "mm") }))} />
          <NumberField label="Aperture" value={fromMeters(item.apertureDiameterM, "mm")} unit="mm" min={0.1} step={0.25} onChange={(value) => update((current) => ({ ...current, apertureDiameterM: toMeters(value, "mm") }))} />
          <NumberField label="Material n" value={item.material.refractiveIndex} min={1} max={3} step={0.01} onChange={(value) => update((current) => ({ ...current, material: { ...current.material, refractiveIndex: value } }))} />
        </>
      )}

      {item.type === "aperture" && (
        <>
          <NumberField label="center y" value={fromMeters(item.yCenterM, "mm")} unit="mm" step={0.25} onChange={(value) => update((current) => ({ ...current, yCenterM: toMeters(value, "mm") }))} />
          <NumberField label="Diameter" value={fromMeters(item.diameterM, "mm")} unit="mm" min={0.1} step={0.25} onChange={(value) => update((current) => ({ ...current, diameterM: toMeters(value, "mm") }))} />
        </>
      )}

      {item.type === "screenDetector" && (
        <>
          <NumberField label="center y" value={fromMeters(item.yCenterM, "mm")} unit="mm" step={0.25} onChange={(value) => update((current) => ({ ...current, yCenterM: toMeters(value, "mm") }))} />
          <NumberField label="Height" value={fromMeters(item.heightM, "mm")} unit="mm" min={0.1} step={0.25} onChange={(value) => update((current) => ({ ...current, heightM: toMeters(value, "mm") }))} />
          <NumberField label="Bins" value={item.bins} min={4} max={512} step={1} onChange={(value) => update((current) => ({ ...current, bins: Math.max(4, Math.round(value)) }))} />
        </>
      )}
    </section>
  );
}

function SourceSharedFields({ source, update }: { source: SourceElement; update: (updater: (item: any) => any) => void }) {
  return (
    <>
      <NumberField label="Wavelength" value={fromMeters(source.wavelengthM, "nm")} unit="nm" min={200} max={1200} step={5} onChange={(value) => update((current) => ({ ...current, wavelengthM: toMeters(value, "nm") }))} />
      <NumberField label="Power" value={source.powerW} unit="W" min={0} step={0.05} onChange={(value) => update((current) => ({ ...current, powerW: value }))} />
      <NumberField label="Rays" value={source.rayCount} min={1} max={512} step={1} onChange={(value) => update((current) => ({ ...current, rayCount: Math.max(1, Math.round(value)) }))} />
    </>
  );
}

function WavePanel({
  field,
  result,
  validationWarnings,
  error,
  disclosure,
  onCompute,
  onExportCsv,
  onExportJson
}: {
  field: FieldOutput1D | undefined;
  result: SolverResult | null;
  validationWarnings: SolverWarning[];
  error: string | null;
  disclosure: { label: string; detail: string };
  onCompute: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
}) {
  const warnings = result?.warnings ?? validationWarnings;
  return (
    <section className="wave-panel">
      <div className="wave-actions">
        <button type="button" onClick={onCompute}>
          <Waves size={17} />
          <span>Compute profile</span>
        </button>
        <button type="button" disabled={!field || !result} onClick={onExportCsv}>
          <FileDown size={17} />
          <span>CSV</span>
        </button>
        <button type="button" disabled={!field || !result} onClick={onExportJson}>
          <Save size={17} />
          <span>JSON</span>
        </button>
      </div>
      <div className="l2-disclosure">
        <strong>{disclosure.label}</strong>
        <span>{disclosure.detail}</span>
      </div>
      {result && (
        <div className="profile-meta">
          <div className="compact-stat">
            <span>Result hash</span>
            <strong>{result.resultHash?.slice(0, 10) ?? "n/a"}</strong>
          </div>
          <div className="compact-stat">
            <span>Wave stages</span>
            <strong>{result.energyLedger?.stages?.length ?? 0}</strong>
          </div>
        </div>
      )}
      {error && <div className="error-banner">{error}</div>}
      {warnings.length > 0 && (
        <ul className="warning-list">
          {warnings.map((warning) => (
            <li key={`${warning.code}:${warning.elementId ?? ""}`}>{warning.message}</li>
          ))}
        </ul>
      )}
      {field ? (
        <IntensityProfilePlot field={field} />
      ) : (
        <div className="empty-state">No L2 field profile computed for the current scene.</div>
      )}
    </section>
  );
}

function ImagePanel({
  scene,
  field,
  result,
  validationWarnings,
  error,
  disclosure,
  onCompute,
  running,
  progress,
  onCancel,
  displayMode,
  onDisplayModeChange,
  onExportCsv,
  onExportJson,
  onExportPng,
  onCopyValidationSummary,
  camera,
  sensorImage,
  snr,
  mtf,
  psf,
  sampling,
  testTarget,
  resolutionTargetMetrics,
  sweepDefinition,
  sweepResult,
  report,
  onCameraChange,
  onRunSweep,
  onExportSweepCsv,
  onExportSweepJson,
  onExportReportJson,
  onExportReportMarkdown,
  onExportReportHtml
}: {
  scene: Scene;
  field: FieldOutput2D | undefined;
  result: SolverResult | null;
  validationWarnings: SolverWarning[];
  error: string | null;
  disclosure: { label: string; detail: string };
  onCompute: () => void;
  running: boolean;
  progress: L3ComputeProgress | null;
  onCancel: () => void;
  displayMode: IntensityDisplayMode;
  onDisplayModeChange: (mode: IntensityDisplayMode) => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onExportPng: () => void;
  onCopyValidationSummary: () => void;
  camera: CameraModel2D;
  sensorImage: CameraImageOutput2D | null;
  snr: SnrMetrics2D | null;
  mtf: MtfMetrics2D | null;
  psf: PsfMetrics2D | null;
  sampling: SamplingMetrics2D | null;
  testTarget?: TestTarget2D;
  resolutionTargetMetrics: ResolutionTargetMetrics2D | null;
  sweepDefinition: SweepDefinition | null;
  sweepResult: SweepResult | null;
  report: EngineeringReport | null;
  onCameraChange: (camera: CameraModel2D) => void;
  onRunSweep: () => void;
  onExportSweepCsv: () => void;
  onExportSweepJson: () => void;
  onExportReportJson: () => void;
  onExportReportMarkdown: () => void;
  onExportReportHtml: () => void;
}) {
  const warnings = result?.warnings ?? validationWarnings;
  return (
    <section className="wave-panel">
      <div className="wave-actions">
        <button type="button" onClick={onCompute} disabled={running}>
          <Waves size={17} />
          <span>Compute image</span>
        </button>
        <button type="button" disabled={!field || !result} onClick={onExportCsv}>
          <FileDown size={17} />
          <span>CSV</span>
        </button>
        <button type="button" disabled={!field || !result} onClick={onExportJson}>
          <Save size={17} />
          <span>JSON</span>
        </button>
        <button type="button" disabled={!field || !result} onClick={onExportPng}>
          <Download size={17} />
          <span>PNG</span>
        </button>
        <button type="button" disabled={!field} onClick={onCopyValidationSummary}>
          <FileDown size={17} />
          <span>Summary</span>
        </button>
      </div>
      <L3ComputeStatus running={running} progress={progress} onCancel={onCancel} />
      <div className="l2-disclosure">
        <strong>{disclosure.label}</strong>
        <span>{disclosure.detail}</span>
      </div>
      <label className="field-row">
        <span>Display</span>
        <select value={displayMode} onChange={(event) => onDisplayModeChange(event.currentTarget.value as IntensityDisplayMode)}>
          <option value="linear">Linear</option>
          <option value="log">Log</option>
          <option value="gamma">Gamma</option>
        </select>
      </label>
      {result && (
        <div className="profile-meta">
          <div className="compact-stat">
            <span>Result hash</span>
            <strong>{result.resultHash?.slice(0, 10) ?? "n/a"}</strong>
          </div>
          <div className="compact-stat">
            <span>Wave stages</span>
            <strong>{result.energyLedger?.stages?.length ?? 0}</strong>
          </div>
        </div>
      )}
      {error && <div className="error-banner">{error}</div>}
      {warnings.length > 0 && (
        <ul className="warning-list">
          {warnings.map((warning) => (
            <li key={`${warning.code}:${warning.elementId ?? ""}`}>{warning.message}</li>
          ))}
        </ul>
      )}
      <L3BenchmarkPanel result={result} />
      {field ? (
        <>
          <IntensityImageView field={field} displayMode={displayMode} />
          <ImageAnalysisPanel field={field} />
          {scene.solverSettings.activeSolverId === "scalar.partialCoherent.l3.3.2d" && (
            <>
              <IlluminationPanel sourceAngleSet={result?.sourceAngleSetOutput} partialCoherence={result?.partialCoherenceOutput} />
              <TestTargetPanel target={testTarget} />
              <ResolutionTargetPanel metrics={resolutionTargetMetrics} />
            </>
          )}
          <CameraPanel camera={camera} image={sensorImage} onCameraChange={onCameraChange} />
          <MtfPanel mtf={mtf} psf={psf} sampling={sampling} />
          <SnrPanel snr={snr} sampling={sampling} />
          <SweepPanel definition={sweepDefinition} result={sweepResult} onRun={onRunSweep} onExportCsv={onExportSweepCsv} onExportJson={onExportSweepJson} />
          <ReportPanel report={report} onExportJson={onExportReportJson} onExportMarkdown={onExportReportMarkdown} onExportHtml={onExportReportHtml} />
        </>
      ) : (
        <div className="empty-state">No L3 image map computed for the current scene.</div>
      )}
    </section>
  );
}

function formatRelativeEnergy(value: number | null | undefined): string {
  return value === null || value === undefined ? "n/a" : value.toExponential(3);
}

function ReadoutStrip({
  solverId,
  focalXM,
  magnification,
  na,
  airyM,
  spotM,
  effectiveFocalLengthM,
  backFocalLengthM,
  aberrationM,
  tirCount,
  detectorPowerW,
  rayCount,
  l2Field,
  l2Energy,
  l2WarningCount,
  l3Field,
  l3Energy,
  l3WarningCount
}: {
  solverId: Scene["solverSettings"]["activeSolverId"];
  focalXM: number | null;
  magnification: number | null;
  na: number | null;
  airyM: number | null;
  spotM: number | null;
  effectiveFocalLengthM: number | null;
  backFocalLengthM: number | null;
  aberrationM: number | null;
  tirCount: number;
  detectorPowerW: number;
  rayCount: number;
  l2Field: FieldOutput1D | undefined;
  l2Energy: EnergyLedger | undefined;
  l2WarningCount: number;
  l3Field: FieldOutput2D | undefined;
  l3Energy: EnergyLedger | undefined;
  l3WarningCount: number;
}) {
  if (isImageSolver(solverId)) {
    const peak = l3Field ? Math.max(...l3Field.intensity) : null;
    return (
      <div className="readout-strip">
        <Readout label="Image" value={l3Field ? "computed" : "pending"} source="on demand" />
        <Readout label="Peak I" value={formatRelativeEnergy(peak)} source="relative" />
        <Readout label="Input E" value={formatRelativeEnergy(l3Energy?.inputEnergy)} source="field" />
        <Readout label="After chain" value={formatRelativeEnergy(l3Energy?.afterMaskEnergy)} source="field" />
        <Readout label="Output E" value={formatRelativeEnergy(l3Energy?.outputEnergy)} source="field" />
        <Readout label="Warnings" value={String(l3WarningCount)} source={solverId === "scalar.partialCoherent.l3.3.2d" ? "L3.3 avg" : `${l3Field ? l3Field.width * l3Field.height : 0} px`} />
      </div>
    );
  }

  if (solverId === "scalar.angularSpectrum.l2.1d") {
    const peak = l2Field ? Math.max(...l2Field.intensity) : null;
    return (
      <div className="readout-strip">
        <Readout label="Profile" value={l2Field ? "computed" : "pending"} source="on demand" />
        <Readout label="Peak I" value={formatRelativeEnergy(peak)} source="relative" />
        <Readout label="Input E" value={formatRelativeEnergy(l2Energy?.inputEnergy)} source="field" />
        <Readout label="After chain" value={formatRelativeEnergy(l2Energy?.afterMaskEnergy)} source="field" />
        <Readout label="Output E" value={formatRelativeEnergy(l2Energy?.outputEnergy)} source="field" />
        <Readout label="Warnings" value={String(l2WarningCount)} source={`${l2Field?.yM.length ?? 0} samples`} />
      </div>
    );
  }

  if (solverId === "geometric.l1.2d") {
    return (
      <div className="readout-strip">
        <Readout label="L1 focus x" value={focalXM === null ? "n/a" : formatLength(focalXM, "mm")} source="analytic" />
        <Readout label="EFL" value={effectiveFocalLengthM === null ? "n/a" : formatLength(effectiveFocalLengthM, "mm")} source="paraxial" />
        <Readout label="BFL" value={backFocalLengthM === null ? "n/a" : formatLength(backFocalLengthM, "mm")} source="paraxial" />
        <Readout label="RMS spot" value={spotM === null ? "n/a" : formatLength(spotM, "um")} source="L1 ray" />
        <Readout label="LSA" value={aberrationM === null ? "n/a" : formatLength(aberrationM, "um")} source={`TIR ${tirCount}`} />
        <Readout label="Detector" value={`${rayCount} rays / ${formatPower(detectorPowerW)}`} source="simulated" />
      </div>
    );
  }

  return (
    <div className="readout-strip">
      <Readout label="Focus x" value={focalXM === null ? "n/a" : formatLength(focalXM, "mm")} source="analytic" />
      <Readout label="Mag" value={magnification === null ? "n/a" : magnification.toFixed(3)} source="analytic" />
      <Readout label="NA" value={na === null ? "n/a" : na.toFixed(4)} source="analytic" />
      <Readout label="Airy r" value={airyM === null ? "n/a" : formatLength(airyM, "um")} source="estimate" />
      <Readout label="RMS spot" value={spotM === null ? "n/a" : formatLength(spotM, "um")} source="L0 ray" />
      <Readout label="Detector" value={`${rayCount} rays / ${formatPower(detectorPowerW)}`} source="simulated" />
    </div>
  );
}

function Readout({ label, value, source }: { label: string; value: string; source: string }) {
  return (
    <div className="readout">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{source}</small>
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field-row">
      <span>{label}</span>
      <input type="text" value={value} onChange={(event) => onChange(event.currentTarget.value)} />
    </label>
  );
}

function NumberField({
  label,
  value,
  unit,
  min,
  max,
  step = 0.1,
  onChange
}: {
  label: string;
  value: number;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="field-row">
      <span>{label}</span>
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

function formatNumberInputValue(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (value === 0) return "0";
  const rounded = Math.abs(value) >= 1e-3 ? Number(value.toFixed(6)) : Number(value.toPrecision(6));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}
