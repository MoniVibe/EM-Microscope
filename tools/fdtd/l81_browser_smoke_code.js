async function smoke(page) {
  const currentUrl = page.url();
  const url = currentUrl && currentUrl !== "about:blank" ? currentUrl : "http://127.0.0.1:5182/";
  const artifactDir = ".playwright-cli";
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
  await expectText("L8.2 Sequential Optical Bench + External FDTD Benchmark Convergence");
  await expectText("L8.2 External FDTD / Field Maps");
  await expectText("External FDTD export/import only");
  await page.screenshot({ path: `${artifactDir}/l81-fdtd-export-readiness-smoke.png`, fullPage: true });

  step("downloads");
  const [manifestDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export FDTD Manifest" }).click()
  ]);
  const [scriptDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export Meep Script" }).click()
  ]);
  await page.screenshot({ path: `${artifactDir}/l81-meep-script-export-smoke.png`, fullPage: true });

  step("transparent fixture");
  await page.getByRole("button", { name: "Load Transparent FDTD Fixture" }).click();
  await expectText("l81-example-transparent-slab");
  await expectText("Imported Field Slice");
  await page.screenshot({ path: `${artifactDir}/l81-field-slice-import-smoke.png`, fullPage: true });

  step("absorbing fixture");
  await page.getByRole("button", { name: "Load Absorbing FDTD Fixture" }).click();
  await expectText("l81-example-absorbing-slab");
  await expectText("Beer-Lambert");
  await page.screenshot({ path: `${artifactDir}/l81-fdtd-flux-validation-smoke.png`, fullPage: true });

  step("unsupported lens");
  await page.getByRole("button", { name: "Add curved glass lens" }).click();
  await expectText("curved material lens solving is scaffold-only");
  await expectText("blocked");
  await page.screenshot({ path: `${artifactDir}/l81-unsupported-geometry-warning-smoke.png`, fullPage: true });

  step("diagnostics");
  await page.getByRole("button", { name: "Diagnostic Workbenches" }).click();
  await expectText("L7.8 Detector Round-Trip Acceptance Pack / Real Detector Bridge");
  await page.getByRole("button", { name: "Run Round-Trip Acceptance" }).click();
  await expectText("roundtrip_report.md");

  const unexpectedConsoleIssues = consoleIssues.filter((message) => !message.includes("Download the React DevTools"));
  const summary = {
    url,
    manifestDownload: manifestDownload.suggestedFilename(),
    scriptDownload: scriptDownload.suggestedFilename(),
    screenshots: [
      "l81-fdtd-export-readiness-smoke.png",
      "l81-meep-script-export-smoke.png",
      "l81-field-slice-import-smoke.png",
      "l81-fdtd-flux-validation-smoke.png",
      "l81-unsupported-geometry-warning-smoke.png"
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
    console.log(`l81 smoke step: ${label}`);
  }
}
