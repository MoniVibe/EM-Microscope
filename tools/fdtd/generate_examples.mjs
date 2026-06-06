import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  apertureConvergenceCsv,
  apertureFluxSummaryJson,
  apertureMetricsCsv,
  apertureProfileCsv,
  apertureReceiptJson,
  apertureValidationReportJson,
  apertureValidationReportMarkdown,
  apertureValidationSceneJson,
  createAbsorbingFdtdExampleBundle,
  createApertureValidationExampleBundles,
  createFdtdBenchmarkExampleBundles,
  createOpticalBenchBundle,
  createSurfaceGeometryConvergencePack,
  createSurfaceGeometryExampleBundles,
  createTransparentFdtdExampleBundle,
  defaultOpticalBenchScenario,
  fdtdBenchmarkManifestJson,
  fdtdBenchmarkReportJson,
  fdtdBenchmarkReportMarkdown,
  fdtdConvergenceMetricsCsv,
  fdtdConvergenceSummaryJson,
  fdtdExampleFluxSummaryJson,
  fdtdExampleReceiptJson,
  fdtdFluxSummariesJson,
  fdtdManifestJson,
  fdtdMeepScriptText,
  fdtdRunTableCsv,
  fdtdSweepPlanJson,
  fdtdValidationMetricsCsv,
  fdtdValidationReportJson,
  fdtdValidationReportMarkdown,
  opticalBenchMetricsCsv,
  opticalBenchMonitorStackCsv,
  opticalBenchSceneJson,
  opticalBenchSolverPlanJson,
  opticalBenchValidationReportJson,
  opticalBenchValidationReportMarkdown,
  surfaceGeometryFluxSummaryJson,
  surfaceGeometryMetricsCsv,
  surfaceGeometryReceiptJson,
  surfaceGeometrySceneJson,
  surfaceGeometryValidationReportJson,
  surfaceGeometryValidationReportMarkdown
} from "../../packages/core/src/index.ts";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "examples");

await mkdir(outDir, { recursive: true });

const transparent = createTransparentFdtdExampleBundle();
const absorbing = createAbsorbingFdtdExampleBundle();
const benchmarkExamples = createFdtdBenchmarkExampleBundles();
const surfaceGeometryExamples = createSurfaceGeometryExampleBundles();
const apertureExamples = createApertureValidationExampleBundles();
const multiElementBench = createOpticalBenchBundle(defaultOpticalBenchScenario());

await writeExample("README.md", [
  "# L8.1/L8.2/L8.3/L8.4/L8.5 FDTD Example Fixtures",
  "",
  "These files are deterministic diagnostic fixtures generated from `packages/core`.",
  "They are for import/export and convergence smoke testing only and are not measured lab results.",
  "L8.3 adds finite placed surface-geometry diagnostics for transparent blocks, absorbing blocks, reflective plates, aperture/blockers, and tilted interface wedges.",
  "L8.4 adds finite aperture/blocker edge-diffraction validation diagnostics for long slits, circular pinholes, rectangular apertures, and opaque blockers.",
  "L8.5 adds a multi-element optical bench chain fixture with scene graph, solver plan, monitor stack, validation report, FDTD manifest/script, and bundled external evidence.",
  "",
  "Regenerate with:",
  "",
  "```powershell",
  "npx --yes tsx tools/fdtd/generate_examples.mjs",
  "```",
  ""
].join("\n"));

await writeBundle("transparent_slab", transparent);
await writeBundle("absorbing_slab", absorbing);
for (const [kind, example] of Object.entries(benchmarkExamples)) {
  await writeBenchmarkBundle(`l82_${kind.replaceAll("-", "_")}`, example);
}
for (const [kind, example] of Object.entries(surfaceGeometryExamples)) {
  await writeSurfaceGeometryBundle(`l83_${kind.replaceAll("-", "_")}`, example);
}
for (const [kind, example] of Object.entries(apertureExamples)) {
  await writeApertureBundle(`l84_${kind.replaceAll("-", "_")}`, example);
}
await writeMultiElementBenchBundle("l85_multi_element_bench", multiElementBench);

async function writeBundle(prefix, example) {
  await writeExample(`${prefix}_scene.json`, fdtdManifestJson(example.manifest));
  await writeExample(`${prefix}_meep.py`, fdtdMeepScriptText(example.script));
  await writeExample(`${prefix}_run_receipt.json`, fdtdExampleReceiptJson(example));
  await writeExample(`${prefix}_flux_summary.json`, fdtdExampleFluxSummaryJson(example));
  await writeExample(`${prefix}_field_slice.csv`, `${example.fieldSliceCsv}\n`);
  await writeExample(`${prefix}_validation_report.json`, fdtdValidationReportJson(example.validation));
  await writeExample(`${prefix}_validation_report.md`, `${fdtdValidationReportMarkdown(example.validation)}\n`);
  await writeExample(`${prefix}_validation_metrics.csv`, `${fdtdValidationMetricsCsv(example.validation)}\n`);
}

async function writeBenchmarkBundle(prefix, example) {
  await writeExample(`${prefix}_benchmark_manifest.json`, fdtdBenchmarkManifestJson(example.pack.benchmarkManifest));
  await writeExample(`${prefix}_sweep_plan.json`, fdtdSweepPlanJson(example.pack.sweepPlan));
  await writeExample(`${prefix}_expected_reference.json`, example.pack.expectedReferenceJson);
  await writeExample(`${prefix}_convergence_summary.json`, fdtdConvergenceSummaryJson(example.convergenceSummary));
  await writeExample(`${prefix}_flux_summaries.json`, fdtdFluxSummariesJson(example.fluxSummaries));
  await writeExample(`${prefix}_benchmark_report.json`, fdtdBenchmarkReportJson(example.convergenceSummary));
  await writeExample(`${prefix}_benchmark_report.md`, `${fdtdBenchmarkReportMarkdown(example.convergenceSummary)}\n`);
  await writeExample(`${prefix}_convergence_metrics.csv`, `${fdtdConvergenceMetricsCsv(example.convergenceSummary)}\n`);
  await writeExample(`${prefix}_run_table.csv`, `${fdtdRunTableCsv(example.convergenceSummary)}\n`);
  await writeExample(`${prefix}_readme.md`, `${example.pack.readme}\n`);
  if (example.pack.scripts[0]) {
    await writeExample(`${prefix}_${example.pack.scripts[0].filename}`, example.pack.scripts[0].export.python);
  }
}

async function writeSurfaceGeometryBundle(prefix, example) {
  const convergencePack = createSurfaceGeometryConvergencePack(example.scene.kind);
  await writeExample(`${prefix}_surface_geometry_scene.json`, surfaceGeometrySceneJson(example.scene));
  await writeExample(`${prefix}_fdtd_scene_manifest.json`, fdtdManifestJson(example.scene.bundle.manifest));
  await writeExample(`${prefix}_meep.py`, fdtdMeepScriptText(example.scene.bundle.script));
  await writeExample(`${prefix}_run_receipt.json`, surfaceGeometryReceiptJson(example));
  await writeExample(`${prefix}_flux_summary.json`, surfaceGeometryFluxSummaryJson(example));
  await writeExample(`${prefix}_field_slice.csv`, `${example.fieldSliceCsv}\n`);
  await writeExample(`${prefix}_validation_report.json`, surfaceGeometryValidationReportJson(example.validation));
  await writeExample(`${prefix}_validation_report.md`, `${surfaceGeometryValidationReportMarkdown(example.validation)}\n`);
  await writeExample(`${prefix}_validation_metrics.csv`, `${surfaceGeometryMetricsCsv(example.validation)}\n`);
  await writeExample(`${prefix}_benchmark_manifest.json`, fdtdBenchmarkManifestJson(convergencePack.benchmarkManifest));
  await writeExample(`${prefix}_sweep_plan.json`, fdtdSweepPlanJson(convergencePack.sweepPlan));
  await writeExample(`${prefix}_expected_reference.json`, convergencePack.expectedReferenceJson);
  await writeExample(`${prefix}_readme.md`, `${convergencePack.readme}\n`);
  if (convergencePack.scripts[0]) {
    await writeExample(`${prefix}_${convergencePack.scripts[0].filename}`, convergencePack.scripts[0].export.python);
  }
}

async function writeApertureBundle(prefix, example) {
  await writeExample(`${prefix}_aperture_validation_scene.json`, apertureValidationSceneJson(example.scene));
  await writeExample(`${prefix}_fdtd_scene_manifest.json`, fdtdManifestJson(example.scene.bundle.manifest));
  await writeExample(`${prefix}_meep.py`, fdtdMeepScriptText(example.scene.bundle.script));
  await writeExample(`${prefix}_run_receipt.json`, apertureReceiptJson(example));
  await writeExample(`${prefix}_flux_summary.json`, apertureFluxSummaryJson(example));
  await writeExample(`${prefix}_field_slice.csv`, `${example.fieldSliceCsv}\n`);
  await writeExample(`${prefix}_validation_report.json`, apertureValidationReportJson(example.validation));
  await writeExample(`${prefix}_validation_report.md`, `${apertureValidationReportMarkdown(example.validation)}\n`);
  await writeExample(`${prefix}_validation_metrics.csv`, `${apertureMetricsCsv(example.validation)}\n`);
  await writeExample(`${prefix}_profile.csv`, `${apertureProfileCsv(example.validation)}\n`);
  await writeExample(`${prefix}_convergence.csv`, `${apertureConvergenceCsv(example.validation)}\n`);
}

async function writeMultiElementBenchBundle(prefix, bundle) {
  await writeExample(`${prefix}_multielement_scene.json`, opticalBenchSceneJson(bundle.scene));
  await writeExample(`${prefix}_solver_plan.json`, opticalBenchSolverPlanJson(bundle.solverPlan));
  await writeExample(`${prefix}_monitor_stack.csv`, `${opticalBenchMonitorStackCsv(bundle.scalarPreview)}\n`);
  await writeExample(`${prefix}_validation_report.json`, opticalBenchValidationReportJson(bundle.validationReport));
  await writeExample(`${prefix}_validation_report.md`, `${opticalBenchValidationReportMarkdown(bundle.validationReport)}\n`);
  await writeExample(`${prefix}_metrics.csv`, `${opticalBenchMetricsCsv(bundle.validationReport)}\n`);
  await writeExample(`${prefix}_fdtd_scene_manifest.json`, fdtdManifestJson(bundle.fdtdBundle.manifest));
  await writeExample(`${prefix}_meep.py`, fdtdMeepScriptText(bundle.fdtdBundle.script));
  await writeExample(`${prefix}_run_receipt.json`, `${JSON.stringify(bundle.externalEvidence.receipt, null, 2)}\n`);
  await writeExample(`${prefix}_flux_summary.json`, `${JSON.stringify(bundle.externalEvidence.flux, null, 2)}\n`);
  await writeExample(`${prefix}_field_slice.csv`, `${bundle.externalEvidence.fieldSliceCsv}\n`);
}

async function writeExample(name, text) {
  await writeFile(resolve(outDir, name), text, "utf8");
}
