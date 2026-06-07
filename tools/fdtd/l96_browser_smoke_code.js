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
  await expectText("L9.6 Cross-Solver Consistency Bench");
  await expectText("Cross-Solver Consistency");
  await expectText("PASS");
  await expectText("WARNING");
  await expectText("NOT COMPARABLE");
  await expectText("NEEDS EXTERNAL EVIDENCE");
  await expectText("cross_solver_consistency_report.md");
  await expectText("cross_solver_consistency_report.json");
  await expectText("consistency_metrics.csv");
  await expectText("solver_pair_residuals.csv");
  await expectText("consistency_assumptions.csv");
  await page.screenshot({ path: `${artifactDir}/l96-cross-solver-overview-smoke.png`, fullPage: true });

  step("tmm rcwa");
  await clickButton("TMM vs RCWA no-pattern consistency");
  await expectText("Uniform single-layer film");
  await expectText("Reflectance");
  await expectText("Transmittance");
  await expectText("rcwa_tmm_consistency.csv");
  await page.screenshot({ path: `${artifactDir}/l96-cross-solver-tmm-rcwa-smoke.png`, fullPage: true });

  step("fdtd parity");
  await clickButton("CPU FDTD vs WebGPU FDTD parity");
  await expectText("RMS Ez delta");
  await expectText("Monitor trace delta");
  await expectText("CPU fallback candidate preserves the parity contract");
  await page.screenshot({ path: `${artifactDir}/l96-cross-solver-fdtd-parity-smoke.png`, fullPage: true });

  step("scalar aperture");
  await clickButton("Scalar aperture vs 2D FDTD diagnostic");
  await expectText("Open-fraction transmission proxy");
  await expectText("qualitative");
  await expectText("Scalar ideal aperture and finite 2D FDTD screen assumptions differ");

  step("external slab");
  await clickButton("Import Bundled External FDTD Slab Fixture");
  await expectText("TMM/Fresnel vs external FDTD slab");
  await expectText("run_receipt.json");
  await expectText("flux_summary.json");
  await expectText("External FDTD run pack and import checklist");
  await page.screenshot({ path: `${artifactDir}/l96-cross-solver-external-slab-smoke.png`, fullPage: true });

  step("missing evidence and guardrail");
  await clickButton("RCWA vs external FDTD grating fixture");
  await expectText("external grating");
  await expectText("NEEDS EXTERNAL EVIDENCE");
  await clickButton("TMM vs scalar lens guardrail");
  await expectText("No comparable R/T/A or field-profile metric exists");
  await expectText("NOT COMPARABLE");

  step("export");
  await clickButton("Export Consistency Report");
  await expectText("solver_evidence_task.md");
  await expectText("L9.5 Solver Router Evidence Auto-Pack");
  await page.screenshot({ path: `${artifactDir}/l96-cross-solver-report-export-smoke.png`, fullPage: true });

  step("regressions");
  await expectText("L9.4 Method Selection Matrix");
  await page.getByRole("button", { name: "RCWA Preview" }).click();
  await expectText("L9.3 In-Browser 1D RCWA Preview Solver");
  await page.getByRole("button", { name: "2D Maxwell Sandbox" }).click();
  await expectText("L9.2 In-Browser 2D FDTD Maxwell Sandbox");
  await page.getByRole("button", { name: "Simulation Builder" }).click();
  await expectText("L8.9 Real External FDTD Run Ingestion");
  await expectText("L8.8 Engineering Evidence Campaign");

  const unexpectedConsoleIssues = consoleIssues.filter((message) => !message.includes("Download the React DevTools"));
  const summary = {
    url,
    screenshots: [
      "l96-cross-solver-overview-smoke.png",
      "l96-cross-solver-tmm-rcwa-smoke.png",
      "l96-cross-solver-fdtd-parity-smoke.png",
      "l96-cross-solver-external-slab-smoke.png",
      "l96-cross-solver-report-export-smoke.png"
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
    console.log(`l96 smoke step: ${label}`);
  }
}

module.exports = smoke;
