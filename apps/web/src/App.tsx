import { useMemo, useRef, useState } from "react";
import {
  detectorHistogramToCsv,
  formatLength,
  formatPower,
  fromMeters,
  fromRadians,
  geometricL0Solver,
  parseSceneV1,
  sampleScene,
  toMeters,
  toRadians,
  type DetectorElement,
  type OpticalElement,
  type SceneV1,
  type SourceElement
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
  Trash2
} from "lucide-react";
import { BenchCanvas } from "./canvas/BenchCanvas";

type SelectableKind = "source" | "element" | "detector";
export type SelectedItem = { kind: SelectableKind; id: string } | null;

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

function touch(scene: SceneV1): SceneV1 {
  return {
    ...scene,
    metadata: {
      ...scene.metadata,
      modifiedAtIso: nowIso()
    }
  };
}

function findSelected(scene: SceneV1, selected: SelectedItem): EditableItem | null {
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

export function App() {
  const [scene, setScene] = useState<SceneV1>(() => sampleScene);
  const [selected, setSelected] = useState<SelectedItem>({ kind: "element", id: "lens-objective" });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const result = useMemo(() => geometricL0Solver.run(scene), [scene]);
  const selectedItem = findSelected(scene, selected);
  const primaryDetector = scene.detectors[0];
  const primaryHistogram = result.detectorHistograms?.[0];
  const primarySpot = result.readouts.spot?.[0];
  const primaryLens = result.readouts.thinLens?.[0];
  const primaryNA = result.readouts.numericalAperture?.[0];

  function updateScene(updater: (current: SceneV1) => SceneV1): void {
    setScene((current) => touch(updater(current)));
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
        return {
          ...current,
          elements: current.elements.map((element) => (element.id === itemId ? updater(element) : element))
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
    const parsed = parseSceneV1(JSON.parse(text));
    setScene(parsed);
    setSelected(null);
  }

  function exportDetectorCsv(): void {
    if (!primaryHistogram) return;
    downloadText(`${primaryHistogram.detectorId}-histogram.csv`, "text/csv", detectorHistogramToCsv(primaryHistogram));
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
          <span>L0 Geometric Ray Optics</span>
          <strong>No diffraction field propagation</strong>
        </div>
        <div className="top-actions">
          <button className="icon-button" type="button" title="Reset sample scene" onClick={() => setScene(sampleScene)}>
            <RotateCcw size={17} />
          </button>
          <button className="icon-button" type="button" title="Save scene JSON" onClick={saveScene}>
            <Save size={17} />
          </button>
          <button className="icon-button" type="button" title="Load scene JSON" onClick={() => fileInputRef.current?.click()}>
            <FolderOpen size={17} />
          </button>
          <button className="icon-button" type="button" title="Export detector histogram CSV" onClick={exportDetectorCsv}>
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
            <button type="button" title="Add aperture stop" onClick={addAperture}>
              <Aperture size={17} />
              <span>Aperture</span>
            </button>
            <button type="button" title="Add detector screen" onClick={addDetector}>
              <SlidersHorizontal size={17} />
              <span>Detector</span>
            </button>
          </div>

          <SceneControls scene={scene} updateScene={updateScene} />

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
            focalXM={primaryLens?.focalPlaneXM ?? null}
            magnification={primaryLens?.magnification ?? null}
            na={primaryNA?.numericalAperture ?? null}
            airyM={primaryNA?.airyRadiusM ?? null}
            spotM={primarySpot?.rmsRadiusM ?? null}
            detectorPowerW={primaryHistogram?.totalPowerW ?? 0}
            rayCount={primaryHistogram?.rayCount ?? 0}
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

          <section className="readout-panel">
            <h2>Provenance</h2>
            <ul>
              <li>Ray paths: simulated L0 geometric</li>
              <li>Thin-lens image: analytic paraxial estimate</li>
              <li>NA/Airy: analytic lower-bound estimate</li>
              <li>Spot size: geometric detector RMS</li>
            </ul>
          </section>
        </aside>
      </main>
    </div>
  );
}

function SceneControls({
  scene,
  updateScene
}: {
  scene: SceneV1;
  updateScene: (updater: (current: SceneV1) => SceneV1) => void;
}) {
  return (
    <div className="rail-section">
      <h2>Bench</h2>
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
    </div>
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

function ReadoutStrip({
  focalXM,
  magnification,
  na,
  airyM,
  spotM,
  detectorPowerW,
  rayCount
}: {
  focalXM: number | null;
  magnification: number | null;
  na: number | null;
  airyM: number | null;
  spotM: number | null;
  detectorPowerW: number;
  rayCount: number;
}) {
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
          value={Number.isFinite(value) ? value : 0}
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
