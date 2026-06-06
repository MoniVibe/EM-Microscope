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

  await page.setViewportSize({ width: 1600, height: 1200 });
  step("navigate");
  await page.goto(url, { waitUntil: "networkidle" });
  await expectText("L9.5 Solver Router Evidence Auto-Pack");
  await expectText("Evidence Pack");
  await expectText("solver_evidence_task.md");
  await expectText("solver_evidence_task.json");
  await expectText("solver_evidence_artifacts.csv");
  await expectText("solver_evidence_validation_plan.csv");

  step("tmm evidence");
  await page.getByRole("button", { name: "Load planar coating scene" }).click();
  await expectText("TMM R/T/A evidence report");
  await expectText("tmm_evidence_report.md");
  await clickButton("Generate Evidence Pack");
  await expectText("Generated");
  await expectText("yes");
  await page.screenshot({ path: `${artifactDir}/l95-evidence-tmm-smoke.png`, fullPage: true });

  step("scalar evidence");
  await page.getByRole("button", { name: "Load ideal aperture/lens scene" }).click();
  await expectText("Scalar propagation validation pack");
  await expectText("scalar_validation_report.md");
  await expectText("scalar_profiles.csv");
  await page.screenshot({ path: `${artifactDir}/l95-evidence-scalar-smoke.png`, fullPage: true });

  step("rcwa evidence");
  await page.getByRole("button", { name: "Load binary grating scene" }).click();
  await expectText("RCWA convergence evidence pack");
  await expectText("rcwa_convergence.csv");
  await expectText("Run In-Browser Checks");
  await page.screenshot({ path: `${artifactDir}/l95-evidence-rcwa-smoke.png`, fullPage: true });

  step("2d fdtd evidence");
  await page.getByRole("button", { name: "Load finite 2D slice scene" }).click();
  await expectText("2D FDTD stability/convergence evidence pack");
  await expectText("fdtd2d_validation_report.md");
  await expectText("fdtd2d_convergence.csv");
  await page.screenshot({ path: `${artifactDir}/l95-evidence-fdtd2d-smoke.png`, fullPage: true });

  step("external fdtd evidence");
  await page.getByRole("button", { name: "Load finite block/aperture scene" }).click();
  await expectText("External FDTD run pack and import checklist");
  await expectText("external_fdtd_run_pack/scene_manifest.json");
  await expectText("external_fdtd_import_checklist.csv");
  await expectText("Generate External Run Pack");
  await expectText("Open Run Instructions");
  await expectText("Import Results");
  await expectText("Validate Receipts");
  await page.screenshot({ path: `${artifactDir}/l95-evidence-external-smoke.png`, fullPage: true });

  step("unsupported evidence");
  await page.getByRole("button", { name: "Load unsupported curved material lens scene" }).click();
  await expectText("Unsupported solver gap report");
  await expectText("unsupported_gap_report.md");
  await expectText("Show Unsupported Gap Report");
  await page.screenshot({ path: `${artifactDir}/l95-evidence-unsupported-smoke.png`, fullPage: true });

  step("campaign promotion");
  await clickButton("Add to Engineering Evidence Campaign");
  await expectText("accepted-with-warnings");
  await expectText("Engineering Evidence Campaign");
  await page.screenshot({ path: `${artifactDir}/l95-evidence-promotion-smoke.png`, fullPage: true });

  step("regressions");
  await expectText("L9.4 Method Selection Matrix");
  await page.getByRole("button", { name: "RCWA Preview" }).click();
  await expectText("L9.3 IN-BROWSER 1D RCWA PREVIEW SOLVER");
  await page.getByRole("button", { name: "2D Maxwell Sandbox" }).click();
  await expectText("L9.2 IN-BROWSER 2D FDTD MAXWELL SANDBOX");
  await page.getByRole("button", { name: "Simulation Builder" }).click();
  await expectText("L8.9 REAL EXTERNAL FDTD RUN INGESTION");
  await expectText("L8.8 Engineering Evidence Campaign");

  const unexpectedConsoleIssues = consoleIssues.filter((message) => !message.includes("Download the React DevTools"));
  const summary = {
    url,
    screenshots: [
      "l95-evidence-tmm-smoke.png",
      "l95-evidence-scalar-smoke.png",
      "l95-evidence-rcwa-smoke.png",
      "l95-evidence-fdtd2d-smoke.png",
      "l95-evidence-external-smoke.png",
      "l95-evidence-unsupported-smoke.png",
      "l95-evidence-promotion-smoke.png"
    ],
    consoleErrorCount: unexpectedConsoleIssues.length,
    consoleErrors: unexpectedConsoleIssues
  };
  console.log(JSON.stringify(summary, null, 2));
  if (unexpectedConsoleIssues.length > 0) throw new Error(`Console errors: ${unexpectedConsoleIssues.join("; ")}`);

  async function expectText(textOrPattern) {
    const body = page.locator("body");
    if (typeof textOrPattern === "string") {
      await body.getByText(textOrPattern, { exact: false }).first().waitFor({ timeout: 20000 });
      return;
    }
    await body.getByText(textOrPattern).first().waitFor({ timeout: 20000 });
  }

  async function clickButton(label) {
    await page.getByRole("button", { name: label }).first().click();
  }

  function step(label) {
    console.log(`l95 smoke step: ${label}`);
  }
}

module.exports = smoke;
