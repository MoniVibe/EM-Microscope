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

  await page.setViewportSize({ width: 1365, height: 768 });
  step("navigate");
  await page.goto(url, { waitUntil: "networkidle" });
  await expectText("L8.5 Multi-Element Optical Bench Propagation Chain");
  await expectText("Multi-Element Optical Bench");
  await expectText("Solver Plan");
  await expectText("Monitor Stack");
  await page.screenshot({ path: `${artifactDir}/l85-multi-element-bench-smoke.png`, fullPage: true });

  step("compose bench");
  const bench = page.getByLabel("L8.5 multi-element optical bench smoke preview");
  await bench.getByRole("button", { name: "Add slit" }).click();
  await bench.getByRole("button", { name: "Add ideal lens" }).click();
  await bench.getByRole("button", { name: "Add transparent block" }).click();
  await bench.getByRole("button", { name: "Add absorbing block" }).click();
  await bench.getByRole("button", { name: "Add monitor" }).click();
  await expectText("external-fdtd");
  await expectText("scalar-chain");
  await page.screenshot({ path: `${artifactDir}/l85-solver-plan-smoke.png`, fullPage: true });

  step("scalar preview");
  await bench.getByRole("button", { name: "Run Scalar Preview" }).click();
  await expectText("Scalar Chain Preview");
  await expectText("After source");
  await expectText("Observation plane");
  await page.screenshot({ path: `${artifactDir}/l85-scalar-chain-preview-smoke.png`, fullPage: true });
  await page.screenshot({ path: `${artifactDir}/l85-monitor-stack-smoke.png`, fullPage: true });

  step("export scene");
  const [sceneDownload] = await Promise.all([
    page.waitForEvent("download"),
    bench.getByRole("button", { name: "Export Multi-Element Scene" }).click()
  ]);
  const sceneFilename = sceneDownload.suggestedFilename();
  if (!sceneFilename.startsWith("multielement_") && sceneFilename !== "solver_plan.json" && sceneFilename !== "monitor_stack.csv") {
    throw new Error(`Unexpected multi-element scene download: ${sceneFilename}`);
  }

  step("external fixture");
  await bench.getByRole("button", { name: "Import Bundled Multi-Element Fixture" }).click();
  await expectText("External FDTD Chain Import");
  await expectText("imported fixture");
  await expectText("Energy balance");
  await page.screenshot({ path: `${artifactDir}/l85-external-fdtd-chain-import-smoke.png`, fullPage: true });

  step("export external chain");
  const [externalDownload] = await Promise.all([
    page.waitForEvent("download"),
    bench.getByRole("button", { name: "Export External FDTD Chain" }).click()
  ]);
  const externalFilename = externalDownload.suggestedFilename();
  if (!externalFilename.startsWith("multielement_")) throw new Error(`Unexpected external chain download: ${externalFilename}`);

  step("export validation report");
  const [reportDownload] = await Promise.all([
    page.waitForEvent("download"),
    bench.getByRole("button", { name: "Export Multi-Element Validation Report" }).click()
  ]);
  const reportFilename = reportDownload.suggestedFilename();
  if (!reportFilename.startsWith("multielement_")) throw new Error(`Unexpected validation report download: ${reportFilename}`);
  await page.screenshot({ path: `${artifactDir}/l85-validation-report-smoke.png`, fullPage: true });

  step("l84 aperture regression");
  await page.getByRole("button", { name: "Load Long Slit Fixture" }).click();
  await expectText("L8.4 Aperture / Blocker Edge-Diffraction Validation");
  await expectText("single-slit-sinc2");

  step("l82 convergence regression");
  await page.getByRole("button", { name: "Load Transparent Convergence Fixture" }).click();
  await expectText("fresnel-normal-incidence");
  await expectText("Residual vs Resolution");

  step("l78 detector regression");
  await page.getByRole("button", { name: "Diagnostic Workbenches" }).click();
  await expectText("L7.8 Detector Round-Trip Acceptance Pack / Real Detector Bridge");
  await page.getByRole("button", { name: "Run Round-Trip Acceptance" }).click();
  await expectText("roundtrip_report.md");

  const unexpectedConsoleIssues = consoleIssues.filter((message) => !message.includes("Download the React DevTools"));
  const summary = {
    url,
    sceneDownload: sceneFilename,
    externalDownload: externalFilename,
    reportDownload: reportFilename,
    screenshots: [
      "l85-multi-element-bench-smoke.png",
      "l85-solver-plan-smoke.png",
      "l85-monitor-stack-smoke.png",
      "l85-scalar-chain-preview-smoke.png",
      "l85-external-fdtd-chain-import-smoke.png",
      "l85-validation-report-smoke.png"
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
    console.log(`l85 smoke step: ${label}`);
  }
}
