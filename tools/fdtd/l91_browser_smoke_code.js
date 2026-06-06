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

  await page.setViewportSize({ width: 1500, height: 1120 });
  step("navigate");
  await page.goto(url, { waitUntil: "networkidle" });
  await expectText("L9.1 In-Browser 2D FDTD Validation + Stability Harness");
  await expectText("2D Maxwell Sandbox");

  step("open sandbox");
  await page.getByRole("button", { name: "2D Maxwell Sandbox" }).click();
  await expectText("L9.1 In-Browser 2D FDTD Maxwell Sandbox");
  await expectText("Validation + Stability");
  await expectText("CFL factor");
  await expectText("dt s");
  await expectText("NaN / Infinity");
  await expectText("fdtd2d_stability_report.json");
  await page.screenshot({ path: `${artifactDir}/l91-fdtd-stability-dashboard-smoke.png`, fullPage: true });

  step("unsafe CFL block");
  await page.getByLabel("CFL").fill("0.85");
  await expectText("Run blocked: CFL factor exceeds stability limit.");
  await page.getByLabel("CFL").fill("0.45");
  await expectText("Stable");

  step("fixtures");
  await page.getByRole("button", { name: "Empty" }).click();
  await page.getByRole("button", { name: "PEC Wall" }).click();
  await page.getByRole("button", { name: "Dielectric" }).first().click();
  await page.getByRole("button", { name: "Absorber" }).first().click();
  await page.getByRole("button", { name: "Point Symmetry" }).click();
  await expectText("FDTD Validation Fixtures");
  await expectText("point-source-symmetry");
  await page.screenshot({ path: `${artifactDir}/l91-fdtd-fixtures-smoke.png`, fullPage: true });

  step("reference checks");
  await expectText("Reference Checks");
  await expectText("Dielectric interface Fresnel trend");
  await expectText("Absorbing slab thickness trend");
  await expectText("Beer-Lambert-style absorber reference");
  await expectText("Point-source radial symmetry score");
  await page.screenshot({ path: `${artifactDir}/l91-fresnel-absorber-reference-smoke.png`, fullPage: true });

  step("convergence");
  await page.getByRole("button", { name: "Run Bounded Convergence" }).click();
  await expectText("residual");
  await expectText("128x128");
  await expectText("256x256");
  await page.screenshot({ path: `${artifactDir}/l91-grid-convergence-smoke.png`, fullPage: true });

  step("export surface");
  await expectText("fdtd2d_validation_report.md");
  await expectText("fdtd2d_validation_report.json");
  await expectText("fdtd2d_convergence.csv");
  await expectText("fdtd2d_energy_trace.csv");
  await expectText("fdtd2d_monitor_trace.csv");
  await page.screenshot({ path: `${artifactDir}/l91-validation-export-smoke.png`, fullPage: true });

  step("builder handoff and regressions");
  await page.getByRole("button", { name: "Simulation Builder" }).click();
  await expectText("L9.1 Simulation Builder + 2D Sandbox Handoff");
  await expectText("Export 2D Slice to Maxwell Sandbox");
  await expectText("L8.9 Real External FDTD Run Ingestion");
  await expectText("L8.8 Engineering Evidence Campaign");
  await page.getByRole("button", { name: "Export 2D Slice to Maxwell Sandbox" }).click();
  await expectText("L9.1 In-Browser 2D FDTD Maxwell Sandbox");
  await expectText("L9.1 2D sandbox slice");

  const unexpectedConsoleIssues = consoleIssues.filter((message) => !message.includes("Download the React DevTools"));
  const summary = {
    url,
    screenshots: [
      "l91-fdtd-stability-dashboard-smoke.png",
      "l91-fdtd-fixtures-smoke.png",
      "l91-fresnel-absorber-reference-smoke.png",
      "l91-grid-convergence-smoke.png",
      "l91-validation-export-smoke.png"
    ],
    consoleErrorCount: unexpectedConsoleIssues.length,
    consoleErrors: unexpectedConsoleIssues
  };
  console.log(JSON.stringify(summary, null, 2));
  if (unexpectedConsoleIssues.length > 0) throw new Error(`Console errors: ${unexpectedConsoleIssues.join("; ")}`);

  async function expectText(text) {
    const body = page.locator("body");
    const expectedText = text.toLowerCase();
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline) {
      const bodyText = await body.innerText({ timeout: 1000 }).catch(() => "");
      if (bodyText.toLowerCase().includes(expectedText)) return;
      await page.waitForTimeout(120);
    }
    throw new Error(`Expected text not found: ${text}`);
  }

  function step(label) {
    console.log(`l91 smoke step: ${label}`);
  }
}
