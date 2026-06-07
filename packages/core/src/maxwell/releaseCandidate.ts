import { createEngineeringEvidenceCampaignBundle } from "../fdtd/engineeringEvidenceCampaign";
import { fnv1a64, stableStringify } from "../scene/hashScene";
import { advisorPacketExportFiles, createAdvisorReviewPacketFromPreset, type AdvisorReviewPacket } from "./advisorPacket";
import { createExampleLibraryRegistry } from "./exampleLibrary";

export type ReleaseCandidateStatus = "implemented" | "diagnostic-only" | "external-only" | "scaffold-only" | "not-implemented";

export type ReleaseCandidateMetadata = {
  releaseLabel: "L10.0 RC";
  releaseName: "L10.0 Engineer Review Release Candidate";
  releaseTag: "v0.10.0-rc.1";
  commitSha: string;
  buildDateIso: string;
  githubPagesUrl: string;
  appMode: "Engineer Review / Release Candidate";
};

export type ReleaseCandidateReviewStep = {
  order: number;
  action: string;
  workflow: string;
  exampleIds: string[];
  solverLanes: string[];
  expectedOutputs: string[];
  limitationsToReview: string[];
};

export type ReleaseCandidateReviewPath = {
  id: "fifteen-minute" | "thirty-minute" | "full-evidence";
  label: string;
  duration: string;
  purpose: string;
  steps: ReleaseCandidateReviewStep[];
};

export type ReleaseCandidateLimitation = {
  id: string;
  category: ReleaseCandidateStatus;
  label: string;
  statement: string;
  reviewAction: string;
};

export type ReleaseCandidateSmokeItem = {
  id: string;
  label: string;
  workflow: string;
  evidence: string;
  screenshot: string;
};

export type ReleaseCandidateQualityCheck = {
  id: string;
  label: string;
  command: string;
  passSignal: string;
  nonGoal: string;
};

export type ReleaseCandidateExportFile = {
  filename: string;
  mime: string;
  content: string;
};

export type ReleaseCandidatePackage = {
  schema: "emmicro.releaseCandidate.v1";
  label: "L10.0 Engineer Review Release Candidate";
  version: "L10.0 RC";
  metadata: ReleaseCandidateMetadata;
  releasePurpose: string;
  reviewFrontDoor: string[];
  reviewPaths: ReleaseCandidateReviewPath[];
  knownLimitations: ReleaseCandidateLimitation[];
  smokeMatrix: ReleaseCandidateSmokeItem[];
  qualityChecks: ReleaseCandidateQualityCheck[];
  releaseChecklist: string[];
  advisorPacketHash: string;
  advisorPacketExportFilenames: string[];
  exampleRegistryHash: string;
  evidenceCampaignHash: string;
  capabilitySnapshotHash: string;
  releaseExports: string[];
  boundary: string[];
  releaseHash: string;
};

export type ReleaseCandidateBuildOptions = Partial<Omit<ReleaseCandidateMetadata, "releaseLabel" | "releaseName" | "releaseTag" | "appMode">> & {
  advisorPacket?: AdvisorReviewPacket;
};

export const l100ReleaseCandidateBoundary = [
  "L10.0 is a release-candidate hardening and engineer-review packaging phase over existing L9.9-L7.x workflows; it does not add a solver or new optical physics.",
  "The release candidate organizes review paths, metadata, manifests, limitations, smoke evidence, advisor packets, and release documents.",
  "L10.0 is not automatic correctness proof, certified validation, certified solver selection, production RCWA/FDTD certification, arbitrary 3D Maxwell, FEM/BEM, an external solver replacement, a digital twin, or manufacturing certification.",
  "External FDTD remains an export/import evidence workflow; external execution remains outside the browser and under the user's control.",
  "Unsupported and scaffold-only items remain visible limitations and gap rows, not executable capability claims."
] as const;

export function createReleaseCandidatePackage(options: ReleaseCandidateBuildOptions = {}): ReleaseCandidatePackage {
  const registry = createExampleLibraryRegistry();
  const advisorPacket = options.advisorPacket ?? createAdvisorReviewPacketFromPreset("full-current-state");
  const campaign = createEngineeringEvidenceCampaignBundle();
  const knownLimitations = createKnownLimitations();
  const reviewPaths = createReviewPaths();
  const smokeMatrix = createSmokeMatrix();
  const qualityChecks = createQualityChecks();
  const releaseChecklist = createReleaseChecklist();
  const releaseExports = [
    "release_manifest.json",
    "release_notes.md",
    "review_checklist.md",
    "known_limitations.md",
    "public_demo_script.md"
  ];
  const metadata: ReleaseCandidateMetadata = {
    releaseLabel: "L10.0 RC",
    releaseName: "L10.0 Engineer Review Release Candidate",
    releaseTag: "v0.10.0-rc.1",
    commitSha: options.commitSha ?? "local-dev",
    buildDateIso: options.buildDateIso ?? "unknown",
    githubPagesUrl: options.githubPagesUrl ?? "https://monivibe.github.io/EM-Microscope/",
    appMode: "Engineer Review / Release Candidate"
  };
  const capabilitySnapshotHash = hash("l100-capability-snapshot", {
    registryHash: registry.registryHash,
    evidenceCampaignHash: campaign.summary.summaryHash,
    advisorPacketHash: advisorPacket.packetHash,
    limitations: knownLimitations.map((item) => [item.id, item.category, item.statement]),
    smokeMatrix: smokeMatrix.map((item) => [item.id, item.workflow])
  });
  const draft = {
    schema: "emmicro.releaseCandidate.v1" as const,
    label: "L10.0 Engineer Review Release Candidate" as const,
    version: "L10.0 RC" as const,
    metadata,
    releasePurpose: "Prepare the current EM-Microscope app for engineer review as a stable, public, tagged release candidate with clear review paths, release metadata, evidence exports, known limitations, and smoke evidence.",
    reviewFrontDoor: [
      "Start here",
      "What this app can do",
      "What this app cannot do",
      "Suggested review path",
      "Generate advisor packet",
      "Known limitations",
      "Release build info"
    ],
    reviewPaths,
    knownLimitations,
    smokeMatrix,
    qualityChecks,
    releaseChecklist,
    advisorPacketHash: advisorPacket.packetHash,
    advisorPacketExportFilenames: advisorPacketExportFiles(advisorPacket).map((file) => file.filename),
    exampleRegistryHash: registry.registryHash,
    evidenceCampaignHash: campaign.summary.summaryHash,
    capabilitySnapshotHash,
    releaseExports,
    boundary: [...l100ReleaseCandidateBoundary]
  };
  return { ...draft, releaseHash: hash("l100-release-candidate", packageForHash(draft)) };
}

export function releaseManifestJson(pkg: ReleaseCandidatePackage): string {
  return `${JSON.stringify(pkg, null, 2)}\n`;
}

export function releaseNotesMarkdown(pkg: ReleaseCandidatePackage): string {
  return [
    `# ${pkg.metadata.releaseTag} - EMMicro Engineer Review Candidate`,
    "",
    `Release hash: ${pkg.releaseHash}`,
    `Commit: ${pkg.metadata.commitSha}`,
    `Build date: ${pkg.metadata.buildDateIso}`,
    `Public URL: ${pkg.metadata.githubPagesUrl}`,
    "",
    "## Purpose",
    "",
    pkg.releasePurpose,
    "",
    "## What Changed",
    "",
    "- Added an Engineer Review / Release Candidate front door.",
    "- Added release metadata, review paths, known limitations, and release export documents.",
    "- Connected the release package to the L9.9 Full Current-State advisor packet, L9.8 example registry, and L8.8 evidence campaign hashes.",
    "- Added L10.0 review smoke coverage and public-quality/Lighthouse instructions.",
    "",
    "## Required Advisor Review",
    "",
    ...pkg.reviewPaths.map((path) => `- ${path.label}: ${path.duration}`),
    "",
    "## Boundary",
    "",
    ...pkg.boundary.map((line) => `- ${line}`)
  ].join("\n");
}

export function reviewChecklistMarkdown(pkg: ReleaseCandidatePackage): string {
  return [
    "# L10.0 Engineer Review Checklist",
    "",
    `Release: ${pkg.metadata.releaseTag}`,
    `Release hash: ${pkg.releaseHash}`,
    "",
    ...pkg.releaseChecklist.map((item) => `- [ ] ${item}`),
    "",
    "## Smoke Matrix",
    "",
    ...pkg.smokeMatrix.map((item) => `- [ ] ${item.label} (${item.workflow}) -> ${item.screenshot}`)
  ].join("\n");
}

export function knownLimitationsMarkdown(pkg: ReleaseCandidatePackage): string {
  const categories: ReleaseCandidateStatus[] = ["implemented", "diagnostic-only", "external-only", "scaffold-only", "not-implemented"];
  return [
    "# L10.0 Known Limitations / Capability Truth",
    "",
    `Capability snapshot hash: ${pkg.capabilitySnapshotHash}`,
    "",
    ...categories.flatMap((category) => [
      `## ${categoryLabel(category)}`,
      "",
      ...pkg.knownLimitations
        .filter((item) => item.category === category)
        .map((item) => `- ${item.label}: ${item.statement} Review action: ${item.reviewAction}`),
      ""
    ]),
    "## Boundary",
    "",
    ...pkg.boundary.map((line) => `- ${line}`)
  ].join("\n");
}

export function publicDemoScriptMarkdown(pkg: ReleaseCandidatePackage): string {
  return [
    "# L10.0 Public Demo Script",
    "",
    `Public URL: ${pkg.metadata.githubPagesUrl}`,
    "",
    ...pkg.reviewPaths.flatMap((path) => [
      `## ${path.label}`,
      "",
      `Duration: ${path.duration}`,
      path.purpose,
      "",
      ...path.steps.map((step) => `${step.order}. ${step.action} Expected outputs: ${step.expectedOutputs.join("; ")}. Limitations: ${step.limitationsToReview.join("; ")}.`),
      ""
    ])
  ].join("\n");
}

export function releaseCandidateExportFiles(pkg: ReleaseCandidatePackage): ReleaseCandidateExportFile[] {
  return [
    file("release_manifest.json", "application/json", releaseManifestJson(pkg)),
    file("release_notes.md", "text/markdown", `${releaseNotesMarkdown(pkg)}\n`),
    file("review_checklist.md", "text/markdown", `${reviewChecklistMarkdown(pkg)}\n`),
    file("known_limitations.md", "text/markdown", `${knownLimitationsMarkdown(pkg)}\n`),
    file("public_demo_script.md", "text/markdown", `${publicDemoScriptMarkdown(pkg)}\n`)
  ];
}

function createReviewPaths(): ReleaseCandidateReviewPath[] {
  return [
    {
      id: "fifteen-minute",
      label: "15-minute engineer review",
      duration: "15 minutes",
      purpose: "Walk the shortest path from public front door to evidence packet and major solver lanes.",
      steps: [
        step(1, "Open the Engineer Review / Release Candidate front door.", "Engineer Review / Release Candidate", [], ["release-package"], ["L10.0 RC badge", "release metadata", "known limitations"], ["release candidate only"]),
        step(2, "Open the Physics Sanity advisor packet.", "Advisor Review Packet", ["scalar-circular-aperture-airy"], ["scalar-propagation"], ["advisor packet", "claim ledger"], ["scalar diagnostics only"]),
        step(3, "Load the Airy aperture example.", "Example Library", ["scalar-circular-aperture-airy"], ["scalar-propagation"], ["example report", "analytic reference note"], ["not full microscope image"]),
        step(4, "Load the RCWA binary grating example.", "Example Library / RCWA Preview", ["rcwa-binary-grating"], ["rcwa-1d-preview"], ["order table", "convergence report"], ["bounded 1D preview only"]),
        step(5, "Load the 2D FDTD point source.", "Example Library / 2D FDTD Sandbox", ["fdtd2d-point-source"], ["fdtd-2d-cpu", "fdtd-2d-webgpu"], ["field snapshot", "validation report"], ["bounded 2D TMz diagnostics only"]),
        step(6, "Open the finite-geometry external FDTD example.", "External FDTD Run Pack", ["external-transparent-finite-block"], ["external-fdtd-meep"], ["run-pack manifest", "import checklist"], ["external execution required"]),
        step(7, "Generate the Full Current-State advisor packet.", "Advisor Review Packet", [], ["evidence-dossier"], ["claim ledger", "gap table", "receipts"], ["not certified validation"])
      ]
    },
    {
      id: "thirty-minute",
      label: "30-minute deep review",
      duration: "30 minutes",
      purpose: "Review solver routing, evidence quality, consistency checks, and unsupported gaps.",
      steps: [
        step(1, "Run Build My Simulation wizard.", "Build My Simulation", [], ["solver-router"], ["decision matrix", "generated template"], ["not certified solver selection"]),
        step(2, "Inspect Solver Credibility packet.", "Advisor Review Packet", ["planar-air-glass-interface", "fdtd2d-point-source"], ["planar-tmm", "fdtd-2d-cpu"], ["cross-solver rows", "residuals"], ["overlap cases only"]),
        step(3, "Open Cross-Solver Consistency.", "L9.6 Cross-Solver Consistency", [], ["planar-tmm", "rcwa-1d-preview", "fdtd-2d-cpu"], ["TMM/RCWA case", "CPU/WebGPU parity"], ["agreement is not proof"]),
        step(4, "Generate an Evidence Auto-Pack.", "L9.5 Evidence Auto-Pack", ["external-transparent-finite-block"], ["external-fdtd-meep"], ["evidence task report", "validation plan"], ["external-only rows require run receipts"]),
        step(5, "Open unsupported curved material lens gap.", "Example Library", ["gap-unsupported-curved-material-lens"], ["unsupported"], ["gap report", "required evidence"], ["arbitrary CAD/freeform not implemented"]),
        step(6, "Export release manifest and review checklist.", "Engineer Review / Release Candidate", [], ["release-package"], ["release_manifest.json", "review_checklist.md"], ["release package only"])
      ]
    },
    {
      id: "full-evidence",
      label: "Full evidence review",
      duration: "full session",
      purpose: "Review the complete L9.9-L7.x evidence stack, exports, diagnostics, smoke artifacts, and release boundaries.",
      steps: [
        step(1, "Export the Full Current-State advisor packet.", "Advisor Review Packet", [], ["evidence-dossier"], ["advisor_packet.md", "advisor_packet.html"], ["review packet, not certification"]),
        step(2, "Review all L9.8 example categories.", "Example Library", ["scalar-circular-aperture-airy", "rcwa-binary-grating", "fdtd2d-point-source", "external-transparent-finite-block", "diagnostic-slanted-edge-mtf", "gap-unsupported-curved-material-lens"], ["scalar-propagation", "rcwa-1d-preview", "fdtd-2d-cpu", "external-fdtd-meep", "diagnostics", "unsupported"], ["example registry", "route/evidence hashes"], ["starter workflows only"]),
        step(3, "Review L8.8 evidence campaign and L8.6/L8.7 robustness paths.", "Simulation Builder", ["evidence-engineering-campaign", "evidence-process-tolerance-runner", "evidence-robust-design-advisor"], ["engineering-evidence"], ["campaign dossier", "tolerance report", "robust report"], ["diagnostic evidence organization only"]),
        step(4, "Review L7.x imaging diagnostics spot checks.", "Diagnostic Workbenches", ["diagnostic-slanted-edge-mtf", "diagnostic-geometric-dot-grid"], ["diagnostics"], ["MTF report", "geometry residuals", "session QA"], ["not ISO/EMVA/lab certification"]),
        step(5, "Review public smoke screenshots and Lighthouse/public-quality report.", "Release Candidate Smoke", [], ["release-quality"], ["screenshots", "trace on failure", "Lighthouse report"], ["quality signal, not proof of physics"]),
        step(6, "Draft the GitHub release candidate.", "GitHub Release", [], ["release-management"], ["v0.10.0-rc.1 draft", "release notes", "public URL"], ["RC only until engineer feedback"])
      ]
    }
  ];
}

function createKnownLimitations(): ReleaseCandidateLimitation[] {
  return [
    limitation("advisor-packet", "implemented", "L9.9 Advisor Review Packet", "Full Current-State packets, claim ledger, evidence table, gap table, review questions, and receipts are implemented as review exports.", "Generate and inspect the Full Current-State advisor packet."),
    limitation("example-library", "implemented", "L9.8 Guided Example Library", "Known starter examples, hashes, solver routes, evidence tasks, and exports are implemented.", "Load one example from each main category."),
    limitation("solver-router", "implemented", "L9.4-L9.7 solver routing and intake", "The wizard and router map bounded problem descriptions to existing solver lanes and evidence tasks.", "Check accepted and rejected solver reasons."),
    limitation("rcwa-preview", "diagnostic-only", "RCWA preview", "The RCWA lane is a bounded 1D periodic diagnostic preview, not production RCWA certification.", "Review convergence and no-pattern TMM consistency."),
    limitation("fdtd2d-sandbox", "diagnostic-only", "2D FDTD sandbox", "The in-browser FDTD lane is a capped 2D TMz diagnostic sandbox, not full 3D Maxwell or production FDTD.", "Run the point-source and parity fixtures."),
    limitation("camera-diagnostics", "diagnostic-only", "Camera / MTF / geometry diagnostics", "Camera, MTF, geometric calibration, fiducial, detector bridge, and session QA workflows are diagnostics only.", "Check warnings and residuals without treating them as lab certification."),
    limitation("external-fdtd", "external-only", "External FDTD / Meep run packs", "Finite material geometry evidence requires exported run packs, external execution, imported receipts, and convergence/PML review.", "Inspect run-pack manifest and import checklist."),
    limitation("finite-geometry", "external-only", "Finite block/aperture/wedge geometry", "Finite transparent, absorbing, reflective, aperture, and wedge scenes are external-evidence workflows for serious finite-geometry claims.", "Review required external evidence rows."),
    limitation("unsupported-gap-reports", "scaffold-only", "Unsupported gap reports", "Unsupported curved/freeform/CAD material examples are scaffold-only gap reports with required evidence lists.", "Confirm they are not marked executable."),
    limitation("arbitrary-3d-maxwell", "not-implemented", "No arbitrary 3D Maxwell in browser", "Arbitrary 3D Maxwell execution is not implemented.", "Keep this in the unsupported/gap table."),
    limitation("production-fdtd-certification", "not-implemented", "No production FDTD certification", "Production FDTD certification is not implemented.", "Do not present FDTD diagnostics as certified results."),
    limitation("fem-bem", "not-implemented", "No FEM/BEM", "FEM and BEM solvers are not implemented.", "Keep FEM/BEM in not-implemented claims."),
    limitation("production-rcwa-certification", "not-implemented", "No production RCWA certification", "Production RCWA certification is not implemented.", "Keep RCWA framed as bounded diagnostic preview."),
    limitation("certified-tolerancing", "not-implemented", "No certified optical tolerancing", "Tolerance and robust-design workflows are diagnostic evidence tools, not certified optical tolerancing.", "Review tolerance wording before engineer handoff."),
    limitation("digital-twin", "not-implemented", "No full microscope digital twin", "A full microscope digital twin is not implemented.", "Keep hardware/process/digital-twin claims out of release notes."),
    limitation("manufacturing-certification", "not-implemented", "No manufacturing certification", "Manufacturing certification is not implemented.", "Keep manufacturing QA out of scope."),
    limitation("certified-camera-calibration", "not-implemented", "No certified camera calibration", "Certified camera calibration, ISO 12233 certification, EMVA certification, and lab-accredited metrology are not implemented.", "Review diagnostic copy for certification overclaims.")
  ];
}

function createSmokeMatrix(): ReleaseCandidateSmokeItem[] {
  return [
    smoke("l99-advisor-packet", "L9.9 Advisor Packet", "Advisor Review Packet", "Full Current-State packet, claim ledger, completeness, gap table, exports", "artifacts/l100-full-advisor-packet-smoke.png"),
    smoke("l98-example-library", "L9.8 Example Library", "Example Library", "Airy, RCWA, 2D FDTD, external FDTD, unsupported examples", "artifacts/l100-review-path-smoke.png"),
    smoke("l97-wizard", "L9.7 Wizard", "Build My Simulation", "Wizard answers, solver route, generated template", "artifacts/l100-review-path-smoke.png"),
    smoke("l96-consistency", "L9.6 Cross-Solver Consistency", "Simulation Builder", "TMM/RCWA, CPU/WebGPU, external slab rows", "artifacts/l100-review-path-smoke.png"),
    smoke("l95-evidence", "L9.5 Evidence Auto-Pack", "Simulation Builder", "Evidence task exports and validation plan", "artifacts/l100-release-manifest-smoke.png"),
    smoke("l94-router", "L9.4 Solver Router", "Simulation Builder", "Method matrix and unsupported route rows", "artifacts/l100-release-manifest-smoke.png"),
    smoke("l93-rcwa", "L9.3 RCWA", "RCWA Preview", "Default grating, order table, convergence", "artifacts/l100-public-smoke-smoke.png"),
    smoke("l92-fdtd", "L9.2 FDTD", "2D Maxwell Sandbox", "Fixture run, validation, backend diagnostics", "artifacts/l100-public-smoke-smoke.png"),
    smoke("l89-external-fdtd", "L8.9 External FDTD Ingestion", "Simulation Builder", "Run pack, fixture import, reproducibility report", "artifacts/l100-public-smoke-smoke.png"),
    smoke("l88-evidence-campaign", "L8.8 Evidence Campaign", "Simulation Builder", "Golden campaign dossier and truth table", "artifacts/l100-known-limitations-smoke.png"),
    smoke("l86-tolerance", "L8.6 Tolerance Runner", "Simulation Builder", "Tolerance report and sensitivity CSV", "artifacts/l100-known-limitations-smoke.png"),
    smoke("l7-diagnostics", "L7.x diagnostics spot checks", "Diagnostic Workbenches", "MTF, geometry, detector/session QA labels", "artifacts/l100-known-limitations-smoke.png")
  ];
}

function createQualityChecks(): ReleaseCandidateQualityCheck[] {
  return [
    {
      id: "public-console-clean",
      label: "Public console clean",
      command:
        "npx --yes --package @playwright/cli playwright-cli run-code --filename tools/fdtd/l100_browser_smoke_code.js against the public Pages URL",
      passSignal: "No public load failure and zero unexpected console errors.",
      nonGoal: "This is UI/release smoke, not physics validation."
    },
    {
      id: "lighthouse-public-quality",
      label: "Lighthouse public-quality report",
      command: "npx --yes lighthouse https://monivibe.github.io/EM-Microscope/ --output=json --output=html --output-path=artifacts/l100-lighthouse",
      passSignal: "No catastrophic accessibility issue and no major performance regression.",
      nonGoal: "Do not chase perfect Lighthouse scores for L10.0."
    },
    {
      id: "keyboard-navigation",
      label: "Keyboard navigation spot check",
      command: "Tab through top-level modes, review-path controls, and export buttons.",
      passSignal: "Main navigation and export buttons are reachable without focus traps.",
      nonGoal: "This is a release-readiness check, not full accessibility certification."
    }
  ];
}

function createReleaseChecklist(): string[] {
  return [
    "npm test",
    "npm run build",
    "npm audit --audit-level=high",
    "git diff --check",
    "local release-candidate browser smoke",
    "public Pages smoke",
    "advisor packet export smoke",
    "known limitations checked",
    "release_manifest.json exported",
    "release_notes.md exported",
    "review_checklist.md exported",
    "known_limitations.md exported",
    "public_demo_script.md exported",
    "Lighthouse/public-quality check documented or saved",
    "GitHub draft release prepared for v0.10.0-rc.1"
  ];
}

function step(
  order: number,
  action: string,
  workflow: string,
  exampleIds: string[],
  solverLanes: string[],
  expectedOutputs: string[],
  limitationsToReview: string[]
): ReleaseCandidateReviewStep {
  return { order, action, workflow, exampleIds, solverLanes, expectedOutputs, limitationsToReview };
}

function limitation(
  id: string,
  category: ReleaseCandidateStatus,
  label: string,
  statement: string,
  reviewAction: string
): ReleaseCandidateLimitation {
  return { id, category, label, statement, reviewAction };
}

function smoke(id: string, label: string, workflow: string, evidence: string, screenshot: string): ReleaseCandidateSmokeItem {
  return { id, label, workflow, evidence, screenshot };
}

function categoryLabel(category: ReleaseCandidateStatus): string {
  if (category === "implemented") return "Implemented";
  if (category === "diagnostic-only") return "Diagnostic only";
  if (category === "external-only") return "External-only";
  if (category === "scaffold-only") return "Scaffold-only";
  return "Not implemented";
}

function packageForHash(pkg: Omit<ReleaseCandidatePackage, "releaseHash">): unknown {
  return {
    schema: pkg.schema,
    version: pkg.version,
    metadata: pkg.metadata,
    reviewPaths: pkg.reviewPaths.map((path) => ({ id: path.id, steps: path.steps.map((step) => [step.order, step.workflow, step.exampleIds]) })),
    knownLimitations: pkg.knownLimitations.map((item) => [item.id, item.category, item.statement]),
    smokeMatrix: pkg.smokeMatrix.map((item) => [item.id, item.workflow, item.screenshot]),
    releaseChecklist: pkg.releaseChecklist,
    advisorPacketHash: pkg.advisorPacketHash,
    exampleRegistryHash: pkg.exampleRegistryHash,
    evidenceCampaignHash: pkg.evidenceCampaignHash,
    capabilitySnapshotHash: pkg.capabilitySnapshotHash,
    releaseExports: pkg.releaseExports,
    boundary: pkg.boundary
  };
}

function hash(namespace: string, value: unknown): string {
  return fnv1a64(`${namespace}:${stableStringify(value)}`);
}

function file(filename: string, mime: string, content: string): ReleaseCandidateExportFile {
  return { filename, mime, content };
}
