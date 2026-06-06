async function smoke(page) {
  const currentUrl = page.url();
  const url = currentUrl && currentUrl !== "about:blank" ? currentUrl : "http://127.0.0.1:5182/";
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
  await expectText("L8.2 Sequential Optical Bench + External FDTD Benchmark Convergence");
  await expectText("L8.2 FDTD Verification Suite");
  await expectText("Benchmark convergence evidence, not new in-browser physics");
  await page.screenshot({ path: `${artifactDir}/l82-fdtd-benchmark-suite-smoke.png`, fullPage: true });

  step("sweep plan");
  await page.getByRole("button", { name: "Generate Sweep Plan" }).click();
  await expectText("36 runs");
  await expectText("Resolution ppw");
  await expectText("PML um");
  await page.screenshot({ path: `${artifactDir}/l82-sweep-plan-smoke.png`, fullPage: true });

  step("export benchmark pack");
  const [packDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export Benchmark Pack" }).click()
  ]);

  step("transparent convergence fixture");
  await page.getByRole("button", { name: "Load Transparent Convergence Fixture" }).click();
  await expectText("transparent interface");
  await expectText("fresnel-normal-incidence");
  await expectText("Residual vs Resolution");
  await page.screenshot({ path: `${artifactDir}/l82-convergence-import-smoke.png`, fullPage: true });
  await page.screenshot({ path: `${artifactDir}/l82-fresnel-convergence-smoke.png`, fullPage: true });

  step("absorber convergence fixture");
  await page.getByRole("button", { name: "Load Absorber Convergence Fixture" }).click();
  await expectText("absorbing slab");
  await expectText("beer-lambert");
  await expectText("fdtd.convergence.highPmlSensitivity");
  await page.screenshot({ path: `${artifactDir}/l82-absorber-convergence-smoke.png`, fullPage: true });
  await page.screenshot({ path: `${artifactDir}/l82-pml-warning-smoke.png`, fullPage: true });

  step("unsupported lens");
  await page.getByRole("button", { name: "Add curved glass lens" }).click();
  await expectText("curved material lens solving is scaffold-only");
  await expectText("blocked");

  step("l81 field import regression");
  await page.getByRole("button", { name: "Load Transparent FDTD Fixture" }).click();
  await expectText("l81-example-transparent-slab");
  await expectText("Imported Field Slice");

  step("l80 material validation regression");
  await page.getByRole("button", { name: "Compute Surface Validation" }).click();
  await expectText("Computed R/T/A");

  step("diagnostics");
  await page.getByRole("button", { name: "Diagnostic Workbenches" }).click();
  await expectText("L7.8 Detector Round-Trip Acceptance Pack / Real Detector Bridge");
  await page.getByRole("button", { name: "Run Round-Trip Acceptance" }).click();
  await expectText("roundtrip_report.md");

  const unexpectedConsoleIssues = consoleIssues.filter((message) => !message.includes("Download the React DevTools"));
  const summary = {
    url,
    packDownload: packDownload.suggestedFilename(),
    screenshots: [
      "l82-fdtd-benchmark-suite-smoke.png",
      "l82-sweep-plan-smoke.png",
      "l82-convergence-import-smoke.png",
      "l82-fresnel-convergence-smoke.png",
      "l82-absorber-convergence-smoke.png",
      "l82-pml-warning-smoke.png"
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
    console.log(`l82 smoke step: ${label}`);
  }
}
