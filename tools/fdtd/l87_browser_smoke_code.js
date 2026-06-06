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

  await page.setViewportSize({ width: 1440, height: 980 });
  step("navigate");
  await page.goto(url, { waitUntil: "networkidle" });
  await expectText("L8.7 Robust Design Advisor + Process / Tolerance Runner");
  await expectText("L8.7 Robust Design Advisor");

  const advisor = page.getByLabel("L8.7 robust design advisor smoke preview");
  await expectText("Ranked Recommendations");
  await expectText("Baseline vs Candidate Comparison");
  await expectText("Tolerance Budget Advisor");
  await page.screenshot({ path: `${artifactDir}/l87-robust-advisor-recommendations-smoke.png`, fullPage: true });

  step("ranking and budget controls");
  await advisor.locator("select").first().selectOption("worst-case");
  await advisor.getByLabel(/^Lock /).first().check();
  await advisor.getByLabel(/ cost weight$/).first().fill("2.5");
  await expectText("locked");
  await page.screenshot({ path: `${artifactDir}/l87-tolerance-budget-smoke.png`, fullPage: true });

  step("robust report export");
  const [reportDownload] = await Promise.all([
    page.waitForEvent("download"),
    advisor.getByRole("button", { name: "Export Robust Design Report" }).click()
  ]);
  const reportFilename = reportDownload.suggestedFilename();
  if (!reportFilename.startsWith("robust_design_report")) {
    throw new Error(`Unexpected robust report download: ${reportFilename}`);
  }
  await reportDownload.saveAs(`${artifactDir}/l87-${reportFilename}`);
  await page.screenshot({ path: `${artifactDir}/l87-robust-design-report-smoke.png`, fullPage: true });

  step("candidate sweep export and import");
  const [sweepDownload] = await Promise.all([
    page.waitForEvent("download"),
    advisor.getByRole("button", { name: "Export Candidate FDTD Sweep" }).click()
  ]);
  const sweepFilename = sweepDownload.suggestedFilename();
  if (!sweepFilename.startsWith("fdtd_candidate_sweep_")) {
    throw new Error(`Unexpected candidate sweep download: ${sweepFilename}`);
  }
  await sweepDownload.saveAs(`${artifactDir}/l87-${sweepFilename}`);
  await advisor.getByRole("button", { name: "Import Bundled Candidate Sweep" }).click();
  await expectText("summary imported");
  await page.screenshot({ path: `${artifactDir}/l87-fdtd-candidate-sweep-smoke.png`, fullPage: true });

  step("explicit candidate apply");
  await advisor.getByRole("button", { name: "Apply Candidate" }).first().click();
  await expectText("L8.6 Process / Tolerance Runner");
  await expectText("Run Table / Worst Cases");
  await page.screenshot({ path: `${artifactDir}/l87-candidate-comparison-smoke.png`, fullPage: true });

  step("l86 regression");
  const toleranceRunner = page.getByLabel("L8.6 process tolerance runner smoke preview");
  await toleranceRunner.getByRole("button", { name: "Run One-at-a-Time" }).click();
  await expectText("Sensitivity Ranking");
  await toleranceRunner.getByRole("button", { name: "Run Deterministic Grid" }).click();
  await expectText("Run Table / Worst Cases");

  step("l851 editing regression");
  const elementList = page.getByLabel("L8.5 ordered element list smoke preview");
  const inspector = page.getByLabel("L8.5.1 element inspector direct editing smoke preview");
  await elementList.getByRole("button", { name: "Select Transparent block 1", exact: true }).click();
  await inspector.getByLabel("z mm").fill("22");
  await expectText("Transparent block 1");
  await inspector.getByRole("button", { name: "Undo" }).click();
  await expectText("Numeric/text fields are the source of truth");

  step("older regressions");
  await page.getByRole("button", { name: "Load Long Slit Fixture" }).click();
  await expectText("L8.4 Aperture / Blocker Edge-Diffraction Validation");
  await page.getByRole("button", { name: "Load Transparent Convergence Fixture" }).click();
  await expectText("Residual vs Resolution");
  await page.getByRole("button", { name: "Diagnostic Workbenches" }).click();
  await expectText("L7.8 Detector Round-Trip Acceptance Pack / Real Detector Bridge");

  const unexpectedConsoleIssues = consoleIssues.filter((message) => !message.includes("Download the React DevTools"));
  const summary = {
    url,
    reportDownload: reportFilename,
    sweepDownload: sweepFilename,
    screenshots: [
      "l87-robust-advisor-recommendations-smoke.png",
      "l87-candidate-comparison-smoke.png",
      "l87-tolerance-budget-smoke.png",
      "l87-fdtd-candidate-sweep-smoke.png",
      "l87-robust-design-report-smoke.png",
      `l87-${reportFilename}`,
      `l87-${sweepFilename}`
    ],
    consoleErrorCount: unexpectedConsoleIssues.length,
    consoleErrors: unexpectedConsoleIssues
  };
  console.log(JSON.stringify(summary, null, 2));
  if (unexpectedConsoleIssues.length > 0) throw new Error(`Console errors: ${unexpectedConsoleIssues.join("; ")}`);

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
    console.log(`l87 smoke step: ${label}`);
  }
}
