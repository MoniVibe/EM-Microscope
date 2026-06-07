import { useMemo, useState } from "react";
import {
  createExampleLibraryRegistry,
  exampleLibraryCategoryLabels,
  exampleLibraryDifficultyLabels,
  exampleLibraryExportFiles,
  exampleLibraryPhysicsLabels,
  filterExampleLibraryEntries,
  loadExampleLibraryEntry,
  solverEvidenceBundleFiles,
  type ExampleLibraryAction,
  type ExampleLibraryDifficultyId,
  type ExampleLibraryEntry,
  type ExampleLibraryFilters,
  type ExampleLibraryLoadedExample,
  type ExampleLibraryPhysicsTypeId,
  type ExampleLibrarySolverLaneId,
  type Fdtd2dScene,
  type SimulationIntakeAnswers
} from "@emmicro/core";
import { ClipboardList, Download, FileDown, FolderOpen, Route, Search, Sparkles } from "lucide-react";

type BooleanFilter = "all" | "yes" | "no";

type ExampleLibraryPanelProps = {
  onOpenWizardAnswers?: (answers: SimulationIntakeAnswers) => void;
  onOpenRcwaPreview?: () => void;
  onExportSandboxScene?: (scene: Fdtd2dScene) => void;
  onOpenDiagnosticWorkbenches?: () => void;
  onOpenSimulationBuilder?: () => void;
};

const solverLaneOptions: Array<{ id: ExampleLibrarySolverLaneId | "all"; label: string }> = [
  { id: "all", label: "All lanes" },
  { id: "planar-tmm", label: "Planar TMM" },
  { id: "scalar-propagation", label: "Scalar" },
  { id: "rcwa-1d-preview", label: "RCWA" },
  { id: "fdtd-2d-cpu", label: "2D FDTD" },
  { id: "external-fdtd-meep", label: "External FDTD" },
  { id: "diagnostics", label: "Diagnostics" },
  { id: "engineering-evidence", label: "Evidence" },
  { id: "unsupported", label: "Unsupported" }
];

const physicsOptions: Array<{ id: ExampleLibraryPhysicsTypeId | "all"; label: string }> = [
  { id: "all", label: "All physics" },
  ...Object.entries(exampleLibraryPhysicsLabels).map(([id, label]) => ({ id: id as ExampleLibraryPhysicsTypeId, label }))
];

const difficultyOptions: Array<{ id: ExampleLibraryDifficultyId | "all"; label: string }> = [
  { id: "all", label: "All difficulty" },
  ...Object.entries(exampleLibraryDifficultyLabels).map(([id, label]) => ({ id: id as ExampleLibraryDifficultyId, label }))
];

export function ExampleLibraryPanel(props: ExampleLibraryPanelProps) {
  const registry = useMemo(() => createExampleLibraryRegistry(), []);
  const [searchText, setSearchText] = useState("");
  const [solverLane, setSolverLane] = useState<ExampleLibrarySolverLaneId | "all">("all");
  const [physicsType, setPhysicsType] = useState<ExampleLibraryPhysicsTypeId | "all">("all");
  const [difficulty, setDifficulty] = useState<ExampleLibraryDifficultyId | "all">("all");
  const [runnable, setRunnable] = useState<BooleanFilter>("all");
  const [externalEvidence, setExternalEvidence] = useState<BooleanFilter>("all");
  const [analyticReference, setAnalyticReference] = useState<BooleanFilter>("all");
  const [convergenceEvidence, setConvergenceEvidence] = useState<BooleanFilter>("all");
  const [measuredWorkflow, setMeasuredWorkflow] = useState<BooleanFilter>("all");
  const [unsupported, setUnsupported] = useState<BooleanFilter>("all");
  const [selectedId, setSelectedId] = useState(registry.entries[0]?.id ?? "");
  const [lastLoadedHash, setLastLoadedHash] = useState<string | null>(null);
  const [lastEvidenceHash, setLastEvidenceHash] = useState<string | null>(null);
  const [lastCampaignHash, setLastCampaignHash] = useState<string | null>(null);
  const [lastExportHash, setLastExportHash] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("ready");

  const filters: ExampleLibraryFilters = {
    text: searchText,
    solverLane,
    physicsType,
    difficulty,
    runnableInBrowser: boolFilter(runnable),
    externalEvidenceRequired: boolFilter(externalEvidence),
    hasAnalyticReference: boolFilter(analyticReference),
    hasConvergenceEvidence: boolFilter(convergenceEvidence),
    hasMeasuredDataWorkflow: boolFilter(measuredWorkflow),
    unsupported: boolFilter(unsupported)
  };
  const entries = useMemo(() => filterExampleLibraryEntries(filters, registry.entries), [registry.entries, searchText, solverLane, physicsType, difficulty, runnable, externalEvidence, analyticReference, convergenceEvidence, measuredWorkflow, unsupported]);
  const selected = registry.entries.find((entry) => entry.id === selectedId) ?? entries[0] ?? registry.entries[0]!;
  const loaded = useMemo(() => loadExampleLibraryEntry(selected.id), [selected.id]);

  function runAction(action: ExampleLibraryAction): void {
    if (!action.enabled) {
      setStatusText(action.reason);
      return;
    }
    if (action.id === "load-example") {
      loadExample(loaded);
      return;
    }
    if (action.id === "open-wizard-answers" || action.id === "show-solver-route" || action.id === "open-consistency-bench") {
      props.onOpenWizardAnswers?.({ ...loaded.example.wizardAnswers });
      setStatusText(`${action.label}: ${loaded.routeDecision.recommendedSolverLabel}`);
      return;
    }
    if (action.id === "generate-evidence-pack") {
      for (const file of solverEvidenceBundleFiles(loaded.evidenceTask)) {
        downloadText(file.filename, file.mime, file.content);
      }
      setLastEvidenceHash(loaded.evidenceTask.taskHash);
      setStatusText(`Evidence pack generated: ${loaded.evidenceTask.taskHash}`);
      return;
    }
    if (action.id === "add-to-engineering-evidence-campaign") {
      setLastCampaignHash(loaded.campaignPromotion.promotionHash);
      setStatusText(`Campaign handoff preserved: ${loaded.campaignPromotion.promotionHash}`);
      return;
    }
    for (const file of exampleLibraryExportFiles(loaded, registry)) {
      downloadText(file.filename, file.mime, file.content);
    }
    setLastExportHash(loaded.loadHash);
    setStatusText(`Example report exported: ${loaded.loadHash}`);
  }

  function loadExample(example: ExampleLibraryLoadedExample): void {
    setLastLoadedHash(example.loadHash);
    setStatusText(`${example.example.title}: ${example.routeDecision.recommendedSolverLabel}`);
    if (example.example.targetWorkbench === "fdtd2d-sandbox" && example.fdtd2dScene) {
      props.onExportSandboxScene?.(example.fdtd2dScene);
      return;
    }
    if (example.example.targetWorkbench === "rcwa-preview") {
      props.onOpenRcwaPreview?.();
      return;
    }
    if (example.example.targetWorkbench === "diagnostics") {
      props.onOpenDiagnosticWorkbenches?.();
      return;
    }
    if (example.example.targetWorkbench === "engineering-evidence") {
      props.onOpenWizardAnswers?.({ ...example.example.wizardAnswers });
      return;
    }
    if (example.example.targetWorkbench === "gap-report") {
      props.onOpenWizardAnswers?.({ ...example.example.wizardAnswers });
      return;
    }
    props.onOpenWizardAnswers?.({ ...example.example.wizardAnswers });
    props.onOpenSimulationBuilder?.();
  }

  return (
    <section className="wave-panel example-library-panel" aria-label="L9.8 Example Library">
      <div className="maxwell-section-heading example-library-heading">
        <div>
          <h2>L9.8 Guided Example Library / Known Experiment Pack</h2>
          <p>Known experiment starter packs, solver routes, evidence tasks, exports, and unsupported gap reports over the existing L9.7-L8.9 workbenches.</p>
        </div>
        <strong>{entries.length} / {registry.entries.length} examples</strong>
      </div>
      <div className="l2-disclosure">
        <strong>Example Library boundary</strong>
        <span>L9.8 examples are starter workflows and evidence scaffolds only; they do not add solver physics, automatic correctness proof, certified validation, certified solver selection, arbitrary 3D Maxwell/FDTD/FEM/BEM execution, digital twins, or manufacturing certification.</span>
      </div>

      <div className="example-library-controls" aria-label="L9.8 example filters">
        <label className="example-library-search">
          <span><Search size={15} /> Search</span>
          <input aria-label="Search examples" value={searchText} onChange={(event) => setSearchText(event.currentTarget.value)} placeholder="Airy, FDTD, RCWA, coating, MTF" />
        </label>
        <FilterSelect label="Solver lane" value={solverLane} options={solverLaneOptions} onChange={(value) => setSolverLane(value as ExampleLibrarySolverLaneId | "all")} />
        <FilterSelect label="Physics type" value={physicsType} options={physicsOptions} onChange={(value) => setPhysicsType(value as ExampleLibraryPhysicsTypeId | "all")} />
        <FilterSelect label="Difficulty" value={difficulty} options={difficultyOptions} onChange={(value) => setDifficulty(value as ExampleLibraryDifficultyId | "all")} />
        <BooleanSelect label="Runnable" value={runnable} onChange={setRunnable} />
        <BooleanSelect label="External evidence" value={externalEvidence} onChange={setExternalEvidence} />
        <BooleanSelect label="Analytic ref" value={analyticReference} onChange={setAnalyticReference} />
        <BooleanSelect label="Convergence" value={convergenceEvidence} onChange={setConvergenceEvidence} />
        <BooleanSelect label="Measured data" value={measuredWorkflow} onChange={setMeasuredWorkflow} />
        <BooleanSelect label="Unsupported" value={unsupported} onChange={setUnsupported} />
      </div>

      <div className="example-library-layout">
        <div className="example-library-grid" aria-label="L9.8 example grid">
          {entries.length === 0 ? (
            <div className="empty-state">No examples match the active filters.</div>
          ) : (
            entries.map((entry) => <ExampleCard key={entry.id} entry={entry} selected={entry.id === selected.id} onSelect={() => setSelectedId(entry.id)} />)
          )}
        </div>

        <div className="example-library-detail" aria-label="L9.8 example detail">
          <div className="example-library-detail-heading">
            <div>
              <h3>{selected.title}</h3>
              <span>{selected.id}</span>
            </div>
            <em className={`example-library-status ${selected.unsupported ? "example-library-status-gap" : selected.externalEvidenceRequired ? "example-library-status-external" : "example-library-status-ready"}`}>
              {selected.unsupported ? "gap" : selected.externalEvidenceRequired ? "evidence" : "browser"}
            </em>
          </div>
          <div className="example-library-meta">
            <Stat label="Category" value={exampleLibraryCategoryLabels[selected.category]} />
            <Stat label="Difficulty" value={exampleLibraryDifficultyLabels[selected.difficulty]} />
            <Stat label="Solver route" value={loaded.routeDecision.recommendedSolverLabel} />
            <Stat label="Evidence task" value={loaded.evidenceTask.taskType} />
            <Stat label="Example hash" value={selected.exampleHash} />
            <Stat label="Route hash" value={loaded.routeDecision.resultHash} />
          </div>
          <section className="example-library-subsection">
            <h4>Setup</h4>
            <p>{selected.setupSummary}</p>
          </section>
          <section className="example-library-subsection">
            <h4>Expected physics</h4>
            <ul>{selected.expectedPhysics.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section className="example-library-subsection">
            <h4>Evidence</h4>
            <ul>{selected.evidence.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section className="example-library-subsection">
            <h4>Limitations</h4>
            <ul>{selected.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <div className="maxwell-layer-actions simulation-builder-actions example-library-actions" aria-label="L9.8 example actions">
            {loaded.actions.map((action) => (
              <button key={action.id} type="button" disabled={!action.enabled} onClick={() => runAction(action)}>
                {iconForAction(action.id)}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
          <div className="l94-export-list example-library-exports" aria-label="L9.8 example export filenames">
            <span><strong>report</strong> example_report.md</span>
            <span><strong>json</strong> example_report.json</span>
            <span><strong>registry</strong> example_registry.csv</span>
            <span><strong>scene</strong> example_scene_template.json</span>
            <span><strong>answers</strong> example_wizard_answers.json</span>
          </div>
          <div className="example-library-status-strip" aria-label="L9.8 example action status">
            <span><strong>status</strong> {statusText}</span>
            <span><strong>loaded</strong> {lastLoadedHash ?? "not loaded"}</span>
            <span><strong>evidence</strong> {lastEvidenceHash ?? "not generated"}</span>
            <span><strong>campaign</strong> {lastCampaignHash ?? "not added"}</span>
            <span><strong>export</strong> {lastExportHash ?? "not exported"}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExampleCard(props: { entry: ExampleLibraryEntry; selected: boolean; onSelect: () => void }) {
  const entry = props.entry;
  return (
    <button type="button" className={`example-library-card ${props.selected ? "active" : ""}`} onClick={props.onSelect} aria-label={`Select example ${entry.title}`}>
      <span>{exampleLibraryCategoryLabels[entry.category]}</span>
      <strong>{entry.title}</strong>
      <p>{entry.whatThisDemonstrates}</p>
      <div>
        <em>{exampleLibraryDifficultyLabels[entry.difficulty]}</em>
        <em>{entry.solverLane}</em>
        {entry.hasAnalyticReference && <em>analytic</em>}
        {entry.hasConvergenceEvidence && <em>convergence</em>}
        {entry.externalEvidenceRequired && <em>external evidence</em>}
        {entry.unsupported && <em>gap report</em>}
      </div>
    </button>
  );
}

function FilterSelect<T extends string>(props: { label: string; value: T; options: Array<{ id: T; label: string }>; onChange: (value: T) => void }) {
  return (
    <label className="example-library-filter">
      <span>{props.label}</span>
      <select value={props.value} onChange={(event) => props.onChange(event.currentTarget.value as T)}>
        {props.options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
    </label>
  );
}

function BooleanSelect(props: { label: string; value: BooleanFilter; onChange: (value: BooleanFilter) => void }) {
  return (
    <label className="example-library-filter">
      <span>{props.label}</span>
      <select value={props.value} onChange={(event) => props.onChange(event.currentTarget.value as BooleanFilter)}>
        <option value="all">All</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
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

function boolFilter(value: BooleanFilter): boolean | null {
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

function iconForAction(actionId: ExampleLibraryAction["id"]) {
  if (actionId === "load-example") return <Sparkles size={16} />;
  if (actionId === "open-wizard-answers") return <ClipboardList size={16} />;
  if (actionId === "show-solver-route") return <Route size={16} />;
  if (actionId === "generate-evidence-pack") return <FolderOpen size={16} />;
  if (actionId === "open-consistency-bench") return <Search size={16} />;
  if (actionId === "add-to-engineering-evidence-campaign") return <FileDown size={16} />;
  return <Download size={16} />;
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
