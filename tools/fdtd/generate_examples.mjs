import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createAbsorbingFdtdExampleBundle,
  createTransparentFdtdExampleBundle,
  fdtdExampleFluxSummaryJson,
  fdtdExampleReceiptJson,
  fdtdManifestJson,
  fdtdMeepScriptText,
  fdtdValidationMetricsCsv,
  fdtdValidationReportJson,
  fdtdValidationReportMarkdown
} from "../../packages/core/src/index.ts";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "examples");

await mkdir(outDir, { recursive: true });

const transparent = createTransparentFdtdExampleBundle();
const absorbing = createAbsorbingFdtdExampleBundle();

await writeExample("README.md", [
  "# L8.1 FDTD Example Fixtures",
  "",
  "These files are deterministic diagnostic fixtures generated from `packages/core`.",
  "They are for import/export smoke testing only and are not measured lab results.",
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

async function writeExample(name, text) {
  await writeFile(resolve(outDir, name), text, "utf8");
}
