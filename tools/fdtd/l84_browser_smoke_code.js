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
  await expectText("L8.4 Aperture / Blocker Edge-Diffraction Validation");
  await expectText("Aperture / Blocker Validation");
  await expectText("aperture cells across");
  await expectText("Residual vs Resolution");
  await page.screenshot({ path: `${artifactDir}/l84-aperture-validation-panel-smoke.png`, fullPage: true });

  step("long slit fixture");
  await page.getByRole("button", { name: "Load Long Slit Fixture" }).click();
  await expectText("single-slit-sinc2");
  await expectText("Aperture Field Slice");
  await expectText("Profile RMS");
  await page.screenshot({ path: `${artifactDir}/l84-long-slit-fixture-smoke.png`, fullPage: true });

  step("export aperture scene");
  const [sceneDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export Aperture Scene" }).click()
  ]);
  const sceneFilename = sceneDownload.suggestedFilename();
  if (!sceneFilename.startsWith("aperture_")) throw new Error(`Unexpected aperture scene download: ${sceneFilename}`);

  step("export aperture dossier");
  const [dossierDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export Aperture Dossier" }).click()
  ]);
  const dossierFilename = dossierDownload.suggestedFilename();
  if (!dossierFilename.startsWith("aperture_")) throw new Error(`Unexpected aperture dossier download: ${dossierFilename}`);

  step("circular pinhole fixture");
  await page.getByRole("button", { name: "Load Circular Pinhole Fixture" }).click();
  await expectText("airy-bessel");
  await expectText("First minimum");
  await page.screenshot({ path: `${artifactDir}/l84-circular-pinhole-smoke.png`, fullPage: true });

  step("opaque blocker fixture");
  await page.getByRole("button", { name: "Load Opaque Blocker Fixture" }).click();
  await expectText("blocker-shadow-flux");
  await expectText("blocked power");
  await expectText("fdtd.aperture.blockerNoClosedForm");
  await page.screenshot({ path: `${artifactDir}/l84-opaque-blocker-smoke.png`, fullPage: true });

  step("l83 surface geometry regression");
  await page.getByRole("button", { name: "Load Transparent Block Fixture" }).click();
  await expectText("planar-tmm-broad-block");
  await expectText("L8.3 Surface Geometry Interaction Starter Set");

  step("l82 benchmark regression");
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
    dossierDownload: dossierFilename,
    screenshots: [
      "l84-aperture-validation-panel-smoke.png",
      "l84-long-slit-fixture-smoke.png",
      "l84-circular-pinhole-smoke.png",
      "l84-opaque-blocker-smoke.png"
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
    console.log(`l84 smoke step: ${label}`);
  }
}
