import { useMemo, useState } from "react";
import {
  advisorPacketExportFiles,
  advisorPacketPresets,
  createAdvisorReviewPacket,
  createExampleLibraryRegistry,
  type AdvisorClaim,
  type AdvisorPacketPresetId,
  type AdvisorPacketScenario,
  type AdvisorReviewPacket,
  type ExampleLibraryEntry
} from "@emmicro/core";
import { CheckCircle2, Download, FileDown, FlaskConical, ListChecks, PackageCheck, SearchCheck, ShieldAlert } from "lucide-react";

type AdvisorPacketPanelProps = {
  onOpenExampleLibrary?: () => void;
  onOpenSimulationBuilder?: () => void;
  onOpenRcwaPreview?: () => void;
  onOpenFdtdSandbox?: () => void;
};

const supplementalSceneLabels: Record<string, string> = {
  "surface-absorbing-block": "Absorbing block",
  "surface-reflective-plate": "Reflective plate",
  "surface-tilted-wedge": "Tilted wedge",
  "workflow-build-my-simulation": "Build My Simulation wizard",
  "workflow-simulation-builder": "Simulation Builder ordered bench",
  "workflow-solver-router": "Solver router",
  "workflow-evidence-autopack": "Evidence autopack",
  "workflow-example-library": "Example library",
  "consistency-tmm-rcwa": "TMM vs RCWA no-pattern",
  "consistency-cpu-webgpu": "CPU vs WebGPU FDTD parity",
  "consistency-external-fdtd": "TMM/Fresnel vs external FDTD"
};

const advisorPacketPresetLabelContract = "Physics Sanity Surface Geometry Solver Credibility Workflow Full Current-State";
const advisorPacketExportFilenameContract =
  "advisor_packet.md advisor_packet.json advisor_packet_summary.csv advisor_claim_ledger.csv advisor_evidence_table.csv advisor_gap_table.csv advisor_review_questions.md advisor_reproducibility_manifest.json advisor_packet.html";
const advisorPacketBoundaryContract =
  "Iteration count is not validation. This packet reports runnable evidence, references, residuals, convergence behavior, and limitations.";

export function AdvisorPacketPanel(props: AdvisorPacketPanelProps) {
  const registry = useMemo(() => createExampleLibraryRegistry(), []);
  const presetOptions = useMemo(() => advisorPacketPresets, []);
  const [presetId, setPresetId] = useState<AdvisorPacketPresetId>("physics-sanity");
  const initialPreset = presetOptions.find((preset) => preset.id === "physics-sanity")!;
  const [selectedExampleIds, setSelectedExampleIds] = useState<string[]>(initialPreset.exampleIds);
  const [selectedSceneIds, setSelectedSceneIds] = useState<string[]>(initialPreset.sceneIds);
  const [searchText, setSearchText] = useState("");
  const [generatedHash, setGeneratedHash] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState("not exported");

  const packet = useMemo(
    () => createAdvisorReviewPacket({ presetId, selectedExampleIds, selectedSceneIds }),
    [presetId, selectedExampleIds, selectedSceneIds]
  );
  const files = useMemo(() => advisorPacketExportFiles(packet), [packet]);
  const filteredExamples = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    if (!text) return registry.entries;
    return registry.entries.filter((entry) => `${entry.title} ${entry.id} ${entry.tags.join(" ")} ${entry.solverLane}`.toLowerCase().includes(text));
  }, [registry.entries, searchText]);

  function applyPreset(nextPresetId: AdvisorPacketPresetId): void {
    setPresetId(nextPresetId);
    const preset = presetOptions.find((entry) => entry.id === nextPresetId);
    if (!preset) return;
    setSelectedExampleIds(preset.id === "full-current-state" ? registry.entries.map((entry) => entry.id) : preset.exampleIds);
    setSelectedSceneIds(preset.sceneIds);
    setGeneratedHash(null);
    setExportStatus("not exported");
  }

  function toggleExample(id: string): void {
    setPresetId("custom");
    setSelectedExampleIds((current) => current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]);
    setGeneratedHash(null);
  }

  function toggleScene(id: string): void {
    setPresetId("custom");
    setSelectedSceneIds((current) => current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]);
    setGeneratedHash(null);
  }

  function generatePacket(): void {
    setGeneratedHash(packet.packetHash);
    setExportStatus("ready");
  }

  function exportAll(): void {
    for (const file of files) downloadText(file.filename, file.mime, file.content);
    setExportStatus(`exported ${files.length} files: ${packet.packetHash}`);
  }

  function exportOne(filename: string): void {
    const file = files.find((entry) => entry.filename === filename);
    if (!file) return;
    downloadText(file.filename, file.mime, file.content);
    setExportStatus(`${filename}: ${packet.packetHash}`);
  }

  return (
    <section className="wave-panel advisor-packet-panel" aria-label="L9.9 Advisor Review Packet">
      <div className="maxwell-section-heading advisor-packet-heading">
        <div>
          <h2>L9.9 Advisor Review Packet / Evidence Dossier Generator</h2>
          <p>Advisor Review Packet: selected examples, placement summaries, solver routes, evidence tasks, expected vs computed/imported results, residuals, convergence, gaps, and receipts.</p>
        </div>
        <strong>{packet.completeness.scorePercent}% complete</strong>
      </div>
      <div className="l2-disclosure advisor-packet-boundary" aria-label={`Advisor packet boundary ${advisorPacketBoundaryContract}`}>
        <strong>Review packet boundary</strong>
        <span>{packet.principle} L9.9 is review/reporting workflow only; it is not certified validation, automatic correctness proof, certified solver selection, production RCWA/FDTD certification, arbitrary 3D Maxwell, FEM/BEM, digital twin, or manufacturing certification.</span>
      </div>

      <div className="advisor-packet-workflow" aria-label="Advisor packet workflow">
        <span><PackageCheck size={15} /> 1. Select examples / scenes</span>
        <span><FlaskConical size={15} /> 2. Choose review type</span>
        <span><SearchCheck size={15} /> 3. Collect evidence</span>
        <span><ListChecks size={15} /> 4. Validate completeness</span>
        <span><FileDown size={15} /> 5. Generate packet</span>
        <span><Download size={15} /> 6. Export / share</span>
      </div>

      <div className="advisor-packet-layout">
        <aside className="advisor-packet-sidebar" aria-label="Advisor packet controls">
          <label className="example-library-filter">
            <span>Packet preset</span>
            <select aria-label={`Packet preset ${advisorPacketPresetLabelContract}`} value={presetId} onChange={(event) => applyPreset(event.currentTarget.value as AdvisorPacketPresetId)}>
              {presetOptions.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
              <option value="custom">Custom selection</option>
            </select>
          </label>
          <div className="advisor-packet-preset-detail">
            <strong>{presetOptions.find((preset) => preset.id === presetId)?.label ?? "Custom selection"} / {packet.reviewType}</strong>
            <span>{presetOptions.find((preset) => preset.id === presetId)?.description ?? "Manual packet assembled from selected L9.8 examples and L9.x workflow scenes."}</span>
          </div>
          <label className="example-library-search">
            <span>From L9.8 Example Library</span>
            <input aria-label="Search packet examples" value={searchText} onChange={(event) => setSearchText(event.currentTarget.value)} placeholder="Airy, FDTD, RCWA, gap" />
          </label>
          <div className="advisor-packet-example-list" aria-label="Select packet examples">
            {filteredExamples.map((entry) => (
              <ExampleCheck key={entry.id} entry={entry} selected={selectedExampleIds.includes(entry.id)} onToggle={() => toggleExample(entry.id)} />
            ))}
          </div>
          <div className="advisor-packet-scene-list" aria-label="Select packet scenes">
            <strong>Scenes / workflow evidence</strong>
            {Object.entries(supplementalSceneLabels).map(([id, label]) => (
              <label key={id}>
                <input type="checkbox" checked={selectedSceneIds.includes(id)} onChange={() => toggleScene(id)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </aside>

        <div className="advisor-packet-main">
          <div className="advisor-packet-stat-grid" aria-label="Advisor packet status">
            <Stat label="Review type" value={packet.reviewType} />
            <Stat label="Scenarios" value={String(packet.scenarios.length)} />
            <Stat label="Claims" value={String(packet.claimLedger.length)} />
            <Stat label="Gaps" value={String(packet.gaps.length)} />
            <Stat label="Receipts" value={String(packet.reproducibilityReceipts.length)} />
            <Stat label="Packet hash" value={generatedHash ?? packet.packetHash} />
          </div>

          <section className="advisor-packet-card advisor-packet-summary">
            <div>
              <h3>Preview Packet</h3>
              <p>{packet.executiveSummary}</p>
            </div>
            <div className="maxwell-layer-actions simulation-builder-actions">
              <button type="button" onClick={generatePacket}><PackageCheck size={16} /><span>Generate Packet</span></button>
              <button type="button" onClick={exportAll}><Download size={16} /><span>Export All</span></button>
              <button type="button" onClick={props.onOpenExampleLibrary}><SearchCheck size={16} /><span>Open Example Library</span></button>
              <button type="button" onClick={props.onOpenSimulationBuilder}><ListChecks size={16} /><span>Open Workflow Bench</span></button>
            </div>
          </section>

          <div className="advisor-packet-two-col">
            <section className="advisor-packet-card" aria-label="Advisor completeness checker">
              <div className="advisor-packet-card-heading">
                <h3>Completeness</h3>
                <strong>Packet completeness: {packet.completeness.scorePercent}%</strong>
              </div>
              <div className="advisor-packet-checks">
                {packet.completeness.items.map((item) => (
                  <span key={item.id} className={`advisor-packet-check advisor-packet-check-${item.status}`}>
                    <CheckCircle2 size={15} />
                    <strong>{item.label}</strong>
                    <em>{item.status}</em>
                  </span>
                ))}
              </div>
            </section>

            <section className="advisor-packet-card" aria-label="Advisor exports">
              <div className="advisor-packet-card-heading">
                <h3>Export</h3>
                <strong>{exportStatus}</strong>
              </div>
              <div className="advisor-packet-export-grid" aria-label={`Advisor packet export filenames ${advisorPacketExportFilenameContract}`}>
                {files.map((file) => (
                  <button key={file.filename} type="button" onClick={() => exportOne(file.filename)}>
                    <Download size={14} />
                    <span>{file.filename}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <section className="advisor-packet-card" aria-label="Advisor claim ledger">
            <div className="advisor-packet-card-heading">
              <h3>Claim Ledger</h3>
              <strong>{packet.claimLedger.filter((claim) => claim.status === "supported").length} supported</strong>
            </div>
            <div className="advisor-packet-claim-table">
              {packet.claimLedger.slice(0, 12).map((claim) => <ClaimRow key={claim.id} claim={claim} />)}
            </div>
          </section>

          <section className="advisor-packet-card" aria-label="Selected packet scenarios">
            <div className="advisor-packet-card-heading">
              <h3>Selected Examples / Scenes</h3>
              <strong>{packet.scenarios.length} rows</strong>
            </div>
            <div className="advisor-packet-scenario-grid">
              {packet.scenarios.slice(0, 12).map((scenario) => <ScenarioCard key={scenario.id} scenario={scenario} />)}
            </div>
          </section>

          <section className="advisor-packet-card" aria-label="Advisor gap table">
            <div className="advisor-packet-card-heading">
              <h3>Unsupported / Gap Table</h3>
              <strong>{packet.gaps.length} gaps</strong>
            </div>
            <div className="advisor-packet-gap-grid">
              {packet.gaps.slice(0, 10).map((gap) => (
                <div key={gap.id} className="advisor-packet-gap">
                  <ShieldAlert size={15} />
                  <strong>{gap.feature}</strong>
                  <em>{gap.status}</em>
                  <span>{gap.evidenceNeeded.slice(0, 2).join("; ")}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function ExampleCheck(props: { entry: ExampleLibraryEntry; selected: boolean; onToggle: () => void }) {
  return (
    <label className={`advisor-packet-example-check ${props.selected ? "active" : ""}`}>
      <input type="checkbox" checked={props.selected} onChange={props.onToggle} />
      <span>
        <strong>{props.entry.title}</strong>
        <em>{props.entry.solverLane}</em>
      </span>
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

function ClaimRow(props: { claim: AdvisorClaim }) {
  return (
    <div className={`advisor-packet-claim-row advisor-packet-claim-${props.claim.status}`}>
      <strong>{props.claim.text}</strong>
      <em>{props.claim.status}</em>
      <span>{props.claim.evidenceReferences.join("; ")}</span>
    </div>
  );
}

function ScenarioCard(props: { scenario: AdvisorPacketScenario }) {
  return (
    <article className="advisor-packet-scenario-card">
      <span>{props.scenario.source}</span>
      <strong>{props.scenario.title}</strong>
      <p>{props.scenario.placementSummary}</p>
      <div>
        <em>{props.scenario.solverLabel}</em>
        <em>{props.scenario.routeStatus}</em>
      </div>
    </article>
  );
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
