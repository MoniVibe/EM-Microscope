import { useMemo, useState } from "react";
import {
  advisorPacketExportFiles,
  createAdvisorReviewPacketFromPreset,
  createReleaseCandidatePackage,
  releaseCandidateExportFiles,
  type ReleaseCandidateLimitation,
  type ReleaseCandidateMetadata,
  type ReleaseCandidateReviewPath,
  type ReleaseCandidateStatus
} from "@emmicro/core";
import { CheckCircle2, Download, FileDown, Gauge, ListChecks, PackageCheck, Route, ShieldAlert } from "lucide-react";

type ReleaseCandidatePanelProps = {
  metadata: Pick<ReleaseCandidateMetadata, "commitSha" | "buildDateIso" | "githubPagesUrl">;
  onOpenAdvisorPacket?: () => void;
  onOpenExampleLibrary?: () => void;
  onOpenSimulationBuilder?: () => void;
  onOpenRcwaPreview?: () => void;
  onOpenFdtdSandbox?: () => void;
  onOpenDiagnostics?: () => void;
};

const releaseCandidateContract =
  "L10.0 RC Engineer Review / Release Candidate 15-minute engineer review 30-minute deep review Full evidence review release_manifest.json release_notes.md review_checklist.md known_limitations.md public_demo_script.md";
const releaseCandidateBoundaryContract =
  "release candidate / review packaging only no new solver no automatic correctness proof no certified validation no arbitrary 3D Maxwell no FEM/BEM No arbitrary 3D Maxwell in browser No production FDTD certification No FEM/BEM No production RCWA certification No certified optical tolerancing No full microscope digital twin No manufacturing certification No certified camera calibration";

export function ReleaseCandidatePanel(props: ReleaseCandidatePanelProps) {
  const advisorPacket = useMemo(() => createAdvisorReviewPacketFromPreset("full-current-state"), []);
  const releasePackage = useMemo(
    () =>
      createReleaseCandidatePackage({
        advisorPacket,
        commitSha: props.metadata.commitSha,
        buildDateIso: props.metadata.buildDateIso,
        githubPagesUrl: props.metadata.githubPagesUrl
      }),
    [advisorPacket, props.metadata.buildDateIso, props.metadata.commitSha, props.metadata.githubPagesUrl]
  );
  const releaseFiles = useMemo(() => releaseCandidateExportFiles(releasePackage), [releasePackage]);
  const advisorFiles = useMemo(() => advisorPacketExportFiles(advisorPacket), [advisorPacket]);
  const [selectedPathId, setSelectedPathId] = useState<ReleaseCandidateReviewPath["id"]>("fifteen-minute");
  const [exportStatus, setExportStatus] = useState("not exported");
  const selectedPath = releasePackage.reviewPaths.find((path) => path.id === selectedPathId) ?? releasePackage.reviewPaths[0]!;

  function exportReleasePackage(): void {
    for (const file of releaseFiles) downloadText(file.filename, file.mime, file.content);
    setExportStatus(`exported release package: ${releasePackage.releaseHash}`);
  }

  function exportFullAdvisorPacket(): void {
    for (const file of advisorFiles) downloadText(file.filename, file.mime, file.content);
    setExportStatus(`exported full advisor packet: ${advisorPacket.packetHash}`);
  }

  function exportOne(filename: string): void {
    const file = [...releaseFiles, ...advisorFiles].find((entry) => entry.filename === filename);
    if (!file) return;
    downloadText(file.filename, file.mime, file.content);
    setExportStatus(`${filename}: ${releasePackage.releaseHash}`);
  }

  return (
    <section className="wave-panel release-candidate-panel" aria-label="L10.0 Engineer Review Release Candidate">
      <div className="maxwell-section-heading release-candidate-heading" aria-label={releaseCandidateContract}>
        <div>
          <h2>L10.0 Engineer Review Release Candidate</h2>
          <p>Release-candidate front door for the current evidence stack: guided review paths, build metadata, advisor packet exports, known limitations, smoke matrix, and public review docs.</p>
        </div>
        <strong>L10.0 RC</strong>
      </div>

      <div className="l2-disclosure release-candidate-boundary" aria-label={`L10.0 boundary ${releaseCandidateBoundaryContract}`}>
        <strong>Release candidate boundary</strong>
        <span>L10.0 is review hardening and packaging only. It does not add solver physics, automatic correctness proof, certified validation, certified solver selection, production RCWA/FDTD certification, arbitrary 3D Maxwell, FEM/BEM, digital twin behavior, or manufacturing certification.</span>
      </div>

      <div className="release-candidate-flow" aria-label="L10.0 review front door">
        {releasePackage.reviewFrontDoor.map((item, index) => (
          <span key={item}><Route size={15} /> {index + 1}. {item}</span>
        ))}
      </div>

      <div className="release-candidate-layout">
        <aside className="release-candidate-sidebar">
          <section className="release-candidate-card" aria-label="Release build info">
            <div className="release-candidate-card-heading">
              <h3>Release Build Info</h3>
              <strong>{releasePackage.metadata.releaseTag}</strong>
            </div>
            <div className="release-candidate-meta">
              <Meta label="mode" value={releasePackage.metadata.appMode} />
              <Meta label="commit" value={releasePackage.metadata.commitSha} />
              <Meta label="build date" value={releasePackage.metadata.buildDateIso} />
              <Meta label="GitHub Pages URL" value={releasePackage.metadata.githubPagesUrl} />
              <Meta label="capability snapshot hash" value={releasePackage.capabilitySnapshotHash} />
              <Meta label="example registry hash" value={releasePackage.exampleRegistryHash} />
              <Meta label="evidence campaign hash" value={releasePackage.evidenceCampaignHash} />
              <Meta label="advisor packet hash" value={releasePackage.advisorPacketHash} />
            </div>
          </section>

          <section className="release-candidate-card" aria-label="Release exports">
            <div className="release-candidate-card-heading">
              <h3>Release Exports</h3>
              <strong>{exportStatus}</strong>
            </div>
            <div className="release-candidate-action-grid">
              <button type="button" onClick={exportReleasePackage}><PackageCheck size={15} /><span>Export Release Package</span></button>
              <button type="button" onClick={exportFullAdvisorPacket}><FileDown size={15} /><span>Export Full Advisor Packet</span></button>
              <button type="button" onClick={props.onOpenAdvisorPacket}><ListChecks size={15} /><span>Open Advisor Packet</span></button>
              <button type="button" onClick={props.onOpenExampleLibrary}><Route size={15} /><span>Open Example Library</span></button>
              <button type="button" onClick={props.onOpenSimulationBuilder}><Gauge size={15} /><span>Open Solver Router</span></button>
              <button type="button" onClick={props.onOpenRcwaPreview}><Gauge size={15} /><span>Open RCWA</span></button>
              <button type="button" onClick={props.onOpenFdtdSandbox}><Gauge size={15} /><span>Open 2D FDTD</span></button>
              <button type="button" onClick={props.onOpenDiagnostics}><Gauge size={15} /><span>Open Diagnostics</span></button>
            </div>
            <div className="release-candidate-file-grid" aria-label="Release candidate export filenames">
              {[...releaseFiles, ...advisorFiles].map((file) => (
                <button key={file.filename} type="button" onClick={() => exportOne(file.filename)}>
                  <Download size={14} />
                  <span>{file.filename}</span>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <div className="release-candidate-main">
          <div className="release-candidate-summary-grid" aria-label="What this app can do and cannot do">
            <SummaryCard title="What this app can do" items={[
              "Generate L9.9 advisor packets with claim ledger, evidence table, gap table, receipts, and review questions.",
              "Load L9.8 known examples across scalar, RCWA, 2D FDTD, external FDTD, diagnostics, evidence, and gap workflows.",
              "Route bounded simulation requests to existing solver lanes and evidence tasks.",
              "Export deterministic release docs and review checklists for engineer review."
            ]} />
            <SummaryCard title="What this app cannot do" items={[
              "No arbitrary 3D Maxwell in browser.",
              "No production FDTD or production RCWA certification.",
              "No FEM/BEM.",
              "No certified optical tolerancing, certified camera calibration, full microscope digital twin, or manufacturing certification."
            ]} />
          </div>

          <section className="release-candidate-card" aria-label="Suggested review path">
            <div className="release-candidate-card-heading">
              <h3>Suggested Review Path</h3>
              <strong>{selectedPath.duration}</strong>
            </div>
            <div className="release-candidate-path-tabs">
              {releasePackage.reviewPaths.map((path) => (
                <button key={path.id} type="button" className={path.id === selectedPathId ? "active" : ""} onClick={() => setSelectedPathId(path.id)}>
                  {path.label}
                </button>
              ))}
            </div>
            <p className="release-candidate-path-purpose">{selectedPath.purpose}</p>
            <div className="release-candidate-step-list">
              {selectedPath.steps.map((step) => (
                <article key={`${selectedPath.id}-${step.order}`} className="release-candidate-step">
                  <span>{step.order}</span>
                  <div>
                    <strong>{step.action}</strong>
                    <p>{step.workflow}</p>
                    <em>{step.expectedOutputs.join("; ")}</em>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="release-candidate-card" aria-label="Known limitations capability truth">
            <div className="release-candidate-card-heading">
              <h3>Known Limitations / Capability Truth</h3>
              <strong>{releasePackage.knownLimitations.length} rows</strong>
            </div>
            <div className="release-candidate-limitations">
              {(["implemented", "diagnostic-only", "external-only", "scaffold-only", "not-implemented"] as ReleaseCandidateStatus[]).map((category) => (
                <div key={category} className="release-candidate-limit-group">
                  <h4>{categoryLabel(category)}</h4>
                  {releasePackage.knownLimitations.filter((item) => item.category === category).map((item) => <LimitationRow key={item.id} item={item} />)}
                </div>
              ))}
            </div>
          </section>

          <section className="release-candidate-card" aria-label="Release smoke matrix">
            <div className="release-candidate-card-heading">
              <h3>Full Review Smoke Matrix</h3>
              <strong>{releasePackage.smokeMatrix.length} paths</strong>
            </div>
            <div className="release-candidate-smoke-grid">
              {releasePackage.smokeMatrix.map((item) => (
                <article key={item.id} className="release-candidate-smoke-item">
                  <CheckCircle2 size={15} />
                  <strong>{item.label}</strong>
                  <span>{item.workflow}</span>
                  <em>{item.evidence}</em>
                </article>
              ))}
            </div>
          </section>

          <section className="release-candidate-card" aria-label="Lighthouse public quality check">
            <div className="release-candidate-card-heading">
              <h3>Lighthouse / Public Quality</h3>
              <strong>review signal</strong>
            </div>
            <div className="release-candidate-quality-grid">
              {releasePackage.qualityChecks.map((check) => (
                <article key={check.id}>
                  <strong>{check.label}</strong>
                  <code>{check.command}</code>
                  <span>{check.passSignal}</span>
                  <em>{check.nonGoal}</em>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function Meta(props: { label: string; value: string }) {
  return (
    <div className="release-candidate-meta-row">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

function SummaryCard(props: { title: string; items: string[] }) {
  return (
    <section className="release-candidate-card release-candidate-summary-card">
      <h3>{props.title}</h3>
      <ul>
        {props.items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

function LimitationRow(props: { item: ReleaseCandidateLimitation }) {
  return (
    <article className={`release-candidate-limitation release-candidate-limitation-${props.item.category}`}>
      <ShieldAlert size={15} />
      <strong>{props.item.label}</strong>
      <span>{props.item.statement}</span>
    </article>
  );
}

function categoryLabel(category: ReleaseCandidateStatus): string {
  if (category === "implemented") return "Implemented";
  if (category === "diagnostic-only") return "Diagnostic only";
  if (category === "external-only") return "External-only";
  if (category === "scaffold-only") return "Scaffold-only";
  return "Not implemented";
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
