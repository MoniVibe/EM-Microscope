import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createAbsorbingFdtdExampleBundle,
  createFdtdBenchmarkExampleBundles,
  createSurfaceGeometryConvergencePack,
  createSurfaceGeometryExampleBundles,
  createTransparentFdtdExampleBundle,
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

await writeExample("README.md", [
  "# L8.1/L8.2/L8.3 FDTD Example Fixtures",
  "",
  "These files are deterministic diagnostic fixtures generated from `packages/core`.",
  "They are for import/export and convergence smoke testing only and are not measured lab results.",
  "L8.3 adds finite placed surface-geometry diagnostics for transparent blocks, absorbing blocks, reflective plates, aperture/blockers, and tilted interface wedges.",
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

async function writeExample(name, text) {
  await writeFile(resolve(outDir, name), text, "utf8");
}
