async function smoke(page) {
  const currentUrl = page.url();
  const url = currentUrl && currentUrl !== "about:blank" ? currentUrl : "http://127.0.0.1:5175/";
  const artifactDir = "artifacts";
  const consoleIssues = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleIssues.push(message.text());
  });
  page.on("pageerror", (error) => {
    consoleIssues.push(error.message);
  });

  await page.setViewportSize({ width: 1500, height: 1040 });
  step("navigate");
  await page.goto(url, { waitUntil: "networkidle" });
  await expectText("L8.8 Engineering Evidence Campaign + Robust Design Advisor");
  await expectText("L8.8 Engineering Evidence Campaign");

  const campaign = page.getByLabel("L8.8 engineering evidence campaign smoke preview");
  await campaign.getByRole("button", { name: "Load Bundled Golden Campaign" }).click();
  await expectText("Golden Scenarios");
  await expectText("Transparent slab");
  await expectText("Absorbing slab");
  await expectText("Circular aperture");
  await expectText("Capability Truth Table");
  await page.screenshot({ path: `${artifactDir}/l88-evidence-campaign-table-smoke.png`, fullPage: true });

  step("transparent slab detail");
  await campaign.getByRole("button", { name: /Transparent slab/i }).first().click();
  await expectText("planar-tmm-stack");
  await expectText("Expected R/T/A");
  await page.screenshot({ path: `${artifactDir}/l88-transparent-slab-evidence-smoke.png`, fullPage: true });

  step("absorber and aperture detail");
  await campaign.getByRole("button", { name: /Absorbing slab/i }).first().click();
  await expectText("beer-lambert");
  await campaign.getByRole("button", { name: /Circular aperture/i }).first().click();
  await expectText("airy-bessel");
  await page.screenshot({ path: `${artifactDir}/l88-aperture-evidence-smoke.png`, fullPage: true });

  step("multi-element and robust detail");
  await campaign.getByRole("button", { name: /Multi-element chain/i }).first().click();
  await expectText("stage-by-stage receipts");
  await campaign.getByRole("button", { name: /Robust candidate/i }).first().click();
  await expectText("Tolerance + Robust Improvement");
  await expectText("Before / after");
  await page.screenshot({ path: `${artifactDir}/l88-robust-before-after-smoke.png`, fullPage: true });

  step("engineer dossier export");
  const downloads = [];
  page.on("download", (download) => downloads.push(download));
  await campaign.getByRole("button", { name: "Generate Engineer Review Dossier" }).click();
  await waitForDownloads(8);
  const filenames = [];
  for (const download of downloads) {
    const filename = download.suggestedFilename();
    filenames.push(filename);
    await download.saveAs(`${artifactDir}/l88-${filename}`);
  }
  for (const expected of [
    "engineering_evidence_dossier.md",
    "engineering_evidence_dossier.json",
    "scenario_summary.csv",
    "convergence_summary.csv",
    "capability_truth_table.csv",
    "unsupported_items.csv"
  ]) {
    if (!filenames.includes(expected)) throw new Error(`Missing dossier download: ${expected}`);
  }
  await page.screenshot({ path: `${artifactDir}/l88-engineer-dossier-export-smoke.png`, fullPage: true });

  step("l87 and l86 regressions");
  await expectText("L8.7 Robust Design Advisor");
  const advisor = page.getByLabel("L8.7 robust design advisor smoke preview");
  await advisor.getByRole("button", { name: "Import Bundled Candidate Sweep" }).click();
  await expectText("summary imported");
  const toleranceRunner = page.getByLabel("L8.6 process tolerance runner smoke preview");
  await toleranceRunner.getByRole("button", { name: "Run One-at-a-Time" }).click();
  await expectText("Sensitivity Ranking");

  step("l84 and l78 regressions");
  await page.getByRole("button", { name: "Load Long Slit Fixture" }).click();
  await expectText("L8.4 Aperture / Blocker Edge-Diffraction Validation");
  await page.getByRole("button", { name: "Diagnostic Workbenches" }).click();
  await expectText("L7.8 Detector Round-Trip Acceptance Pack / Real Detector Bridge");

  const unexpectedConsoleIssues = consoleIssues.filter((message) => !message.includes("Download the React DevTools"));
  const summary = {
    url,
    downloads: filenames,
    screenshots: [
      "l88-evidence-campaign-table-smoke.png",
      "l88-transparent-slab-evidence-smoke.png",
      "l88-aperture-evidence-smoke.png",
      "l88-robust-before-after-smoke.png",
      "l88-engineer-dossier-export-smoke.png"
    ],
    consoleErrorCount: unexpectedConsoleIssues.length,
    consoleErrors: unexpectedConsoleIssues
  };
  console.log(JSON.stringify(summary, null, 2));
  if (unexpectedConsoleIssues.length > 0) throw new Error(`Console errors: ${unexpectedConsoleIssues.join("; ")}`);

  async function waitForDownloads(count) {
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      if (downloads.length >= count) return;
      await page.waitForTimeout(100);
    }
    throw new Error(`Expected ${count} downloads, saw ${downloads.length}`);
  }

  async function expectText(text) {
    const body = page.locator("body");
    const expectedText = text.toLowerCase();
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      const bodyText = await body.innerText({ timeout: 1000 }).catch(() => "");
      if (bodyText.toLowerCase().includes(expectedText)) return;
      await page.waitForTimeout(100);
    }
    throw new Error(`Expected text not found: ${text}`);
  }

  function step(label) {
    console.log(`l88 smoke step: ${label}`);
  }
}
