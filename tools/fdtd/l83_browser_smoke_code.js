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
  await expectText("L8.3 Surface Geometry Interaction + External FDTD Benchmark Convergence");
  await expectText("Surface Geometry Elements");
  await expectText("X-Z Surface Geometry Cross-Section");
  await expectText("L8.3 Surface Geometry Interaction Starter Set");
  await page.screenshot({ path: `${artifactDir}/l83-surface-geometry-palette-smoke.png`, fullPage: true });

  step("add finite geometry");
  await page.getByRole("button", { name: "Add Transparent Block" }).click();
  await page.getByRole("button", { name: "Add Absorbing Block" }).click();
  await page.getByRole("button", { name: "Add Reflective Plate" }).click();
  await page.getByRole("button", { name: "Add Aperture/Blocker" }).click();
  await page.getByRole("button", { name: "Add Tilted Wedge" }).click();
  await expectText("transparent finite block");
  await expectText("absorbing finite block");
  await expectText("tilted interface/wedge");
  await page.screenshot({ path: `${artifactDir}/l83-xz-cross-section-smoke.png`, fullPage: true });

  step("export surface scene");
  const [sceneDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export Surface Geometry Scene" }).click()
  ]);
  const sceneFilename = sceneDownload.suggestedFilename();
  if (!sceneFilename.startsWith("surface_geometry_")) throw new Error(`Unexpected surface scene download: ${sceneFilename}`);

  step("transparent block fixture");
  await page.getByRole("button", { name: "Load Transparent Block Fixture" }).click();
  await expectText("planar-tmm-broad-block");
  await expectText("Field Slice");
  await page.screenshot({ path: `${artifactDir}/l83-transparent-block-field-smoke.png`, fullPage: true });

  step("surface report export");
  const [reportDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export Surface Geometry Report" }).click()
  ]);
  const reportFilename = reportDownload.suggestedFilename();
  if (!reportFilename.startsWith("surface_geometry_")) throw new Error(`Unexpected surface report download: ${reportFilename}`);

  step("absorbing block fixture");
  await page.getByRole("button", { name: "Load Absorbing Block Fixture" }).click();
  await expectText("beer-lambert");
  await expectText("Flux / Reference Validation");
  await page.screenshot({ path: `${artifactDir}/l83-absorbing-block-field-smoke.png`, fullPage: true });

  step("reflective plate fixture");
  await page.getByRole("button", { name: "Load Reflective Plate Fixture" }).click();
  await expectText("ideal-reflector");
  await expectText("fdtd.geometry.idealReflector");
  await page.screenshot({ path: `${artifactDir}/l83-reflective-plate-smoke.png`, fullPage: true });

  step("aperture blocker fixture");
  await page.getByRole("button", { name: "Load Aperture Blocker Fixture" }).click();
  await expectText("aperture-open-fraction");
  await expectText("diagnostic");
  await page.screenshot({ path: `${artifactDir}/l83-aperture-blocker-diagnostic-smoke.png`, fullPage: true });

  step("tilted wedge fixture");
  await page.getByRole("button", { name: "Load Wedge Fixture" }).click();
  await expectText("snell-fresnel");
  await expectText("fdtd.geometry.staircasingSensitive");
  await page.screenshot({ path: `${artifactDir}/l83-wedge-warning-smoke.png`, fullPage: true });

  step("unsupported lens guardrail");
  await page.getByRole("button", { name: "Add curved glass lens" }).click();
  await expectText("curved material lens solving is scaffold-only");
  await expectText("blocked");

  step("l82 benchmark regression");
  await page.getByRole("button", { name: "Generate Sweep Plan" }).click();
  await expectText("Resolution ppw");
  await page.getByRole("button", { name: "Load Transparent Convergence Fixture" }).click();
  await expectText("fresnel-normal-incidence");
  await expectText("Residual vs Resolution");

  step("l81 field import regression");
  await page.getByRole("button", { name: "Load Transparent FDTD Fixture" }).click();
  await expectText("l81-example-transparent-slab");
  await expectText("Imported Field Slice");

  step("l78 detector round-trip regression");
  await page.getByRole("button", { name: "Diagnostic Workbenches" }).click();
  await expectText("L7.8 Detector Round-Trip Acceptance Pack / Real Detector Bridge");
  await page.getByRole("button", { name: "Run Round-Trip Acceptance" }).click();
  await expectText("roundtrip_report.md");

  const unexpectedConsoleIssues = consoleIssues.filter((message) => !message.includes("Download the React DevTools"));
  const summary = {
    url,
    sceneDownload: sceneFilename,
    reportDownload: reportFilename,
    screenshots: [
      "l83-surface-geometry-palette-smoke.png",
      "l83-xz-cross-section-smoke.png",
      "l83-transparent-block-field-smoke.png",
      "l83-absorbing-block-field-smoke.png",
      "l83-reflective-plate-smoke.png",
      "l83-aperture-blocker-diagnostic-smoke.png",
      "l83-wedge-warning-smoke.png"
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
    console.log(`l83 smoke step: ${label}`);
  }
}
