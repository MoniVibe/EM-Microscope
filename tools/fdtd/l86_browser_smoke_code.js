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

  await page.setViewportSize({ width: 1440, height: 960 });
  step("navigate");
  await page.goto(url, { waitUntil: "networkidle" });
  await expectText("L8.6 Process / Tolerance Runner + Direct Optical Bench Editing");
  await expectText("L8.6 Process / Tolerance Runner");

  const toleranceRunner = page.getByLabel("L8.6 process tolerance runner smoke preview");
  await toleranceRunner.getByRole("button", { name: "Run One-at-a-Time" }).click();
  await expectText("Variation Parameters");
  await expectText("Sensitivity Ranking");
  await page.screenshot({ path: `${artifactDir}/l86-variation-setup-smoke.png`, fullPage: true });

  step("grid sensitivity");
  await toleranceRunner.getByRole("button", { name: "Run Deterministic Grid" }).click();
  await expectText("Run Table / Worst Cases");
  await page.screenshot({ path: `${artifactDir}/l86-sensitivity-table-smoke.png`, fullPage: true });
  await page.screenshot({ path: `${artifactDir}/l86-worst-case-passfail-smoke.png`, fullPage: true });

  step("exports");
  const [reportDownload] = await Promise.all([
    page.waitForEvent("download"),
    toleranceRunner.getByRole("button", { name: "Export Tolerance Report" }).click()
  ]);
  const reportFilename = reportDownload.suggestedFilename();
  if (!reportFilename.startsWith("tolerance_")) throw new Error(`Unexpected tolerance report download: ${reportFilename}`);
  await reportDownload.saveAs(`${artifactDir}/l86-${reportFilename}`);

  const [sweepDownload] = await Promise.all([
    page.waitForEvent("download"),
    toleranceRunner.getByRole("button", { name: "Export FDTD Sweep Pack" }).click()
  ]);
  const sweepFilename = sweepDownload.suggestedFilename();
  if (!sweepFilename.startsWith("fdtd_variation_sweep_")) throw new Error(`Unexpected FDTD sweep download: ${sweepFilename}`);
  await sweepDownload.saveAs(`${artifactDir}/l86-${sweepFilename}`);

  step("fdtd summary import");
  await toleranceRunner.getByRole("button", { name: "Import Bundled FDTD Sweep" }).click();
  await expectText("summary imported");
  await page.screenshot({ path: `${artifactDir}/l86-fdtd-sweep-smoke.png`, fullPage: true });

  step("l851 editing regression");
  const elementList = page.getByLabel("L8.5 ordered element list smoke preview");
  const inspector = page.getByLabel("L8.5.1 element inspector direct editing smoke preview");
  await elementList.getByRole("button", { name: "Select Transparent block 1", exact: true }).click();
  await inspector.getByLabel("z mm").fill("22");
  await expectText("Transparent block 1");
  await inspector.getByRole("button", { name: "Undo" }).click();
  await expectText("Numeric/text fields are the source of truth");

  step("regressions");
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
      "l86-variation-setup-smoke.png",
      "l86-sensitivity-table-smoke.png",
      "l86-worst-case-passfail-smoke.png",
      "l86-fdtd-sweep-smoke.png",
      `l86-${reportFilename}`,
      `l86-${sweepFilename}`
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
    console.log(`l86 smoke step: ${label}`);
  }
}
