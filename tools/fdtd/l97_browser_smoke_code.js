async function smoke(page) {
  const currentUrl = page.url();
  const url = currentUrl && currentUrl !== "about:blank" ? currentUrl : "http://127.0.0.1:5197/";
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
  await expectText("L9.7 Solver Method Decision Wizard / Simulation Intake");
  await expectText("Build My Simulation");
  await expectText("Problem Type");
  await expectText("Desired Output");
  await expectText("Geometry");
  await expectText("Materials");
  await expectText("Rigor / Evidence Level");
  await expectText("Recommendation");
  await expectText("PlanarTmmBackend");
  await expectText("simulation_decision_report.md");
  await expectText("simulation_decision_report.json");
  await expectText("simulation_decision_matrix.csv");
  await expectText("generated_scene_template.json");
  await expectText("wizard_answers.json");
  await assertNoL97Overflow();
  await page.screenshot({ path: `${artifactDir}/l97-wizard-start-smoke.png`, fullPage: true });

  step("default template and evidence");
  await clickWizardAction("Create Scene Template");
  await expectText("created");
  await clickWizardAction("Generate Evidence Pack");
  await expectText("generated");

  step("rcwa route");
  await clickOption("Periodic grating / metasurface unit cell", "L9.7 Problem Type");
  await clickOption("Diffraction orders", "L9.7 Desired Output");
  await clickOption("1D periodic grating", "L9.7 Geometry");
  await clickOption("periodic material pattern", "L9.7 Materials");
  await clickOption("Convergence-tested report", "L9.7 Rigor / Evidence Level");
  await expectText("RCWA Preview Solver");
  await expectText("L9.7 RCWA binary grating template");
  await expectText("rcwa-convergence");
  await page.screenshot({ path: `${artifactDir}/l97-wizard-rcwa-route-smoke.png`, fullPage: true });
  await clickWizardAction("Open Recommended Solver");
  await expectText("L9.3 In-Browser 1D RCWA Preview Solver");
  await page.getByRole("button", { name: "Build My Simulation" }).click();

  step("external fdtd route");
  await clickOption("Finite material object / blocker / aperture edge", "L9.7 Problem Type");
  await clickOption("2D field map", "L9.7 Desired Output");
  await clickOption("Finite block / aperture / wedge", "L9.7 Geometry");
  await clickOption("absorbing n/k or alpha", "L9.7 Materials");
  await clickOption("External solver evidence", "L9.7 Rigor / Evidence Level");
  await expectText("External FDTD / Meep export-import");
  await expectText("L9.7 external FDTD Simulation Builder template");
  await expectText("external-fdtd-run-pack");
  await clickWizardAction("Open Consistency Bench");
  await expectText("TMM/Fresnel vs external FDTD slab");
  await page.screenshot({ path: `${artifactDir}/l97-wizard-external-fdtd-route-smoke.png`, fullPage: true });

  step("unsupported gap route");
  await clickOption("Unsupported: arbitrary CAD / curved 3D material geometry", "L9.7 Geometry");
  await expectText("Unsupported gap report");
  await expectText("L9.7 unsupported gap report template");
  await expectText("future solver");
  await expectText("validated CAD meshing");
  await expectText("automatic correctness proof");
  await clickWizardAction("Show Unsupported Gap Report");
  await page.screenshot({ path: `${artifactDir}/l97-wizard-unsupported-gap-smoke.png`, fullPage: true });

  step("decision report exports");
  await clickWizardAction("Export Decision Report");
  await expectText("simulation_decision_report.md");
  await expectText("simulation_decision_report.json");
  await expectText("simulation_decision_matrix.csv");
  await expectText("generated_scene_template.json");
  await expectText("wizard_answers.json");
  await page.screenshot({ path: `${artifactDir}/l97-wizard-decision-report-smoke.png`, fullPage: true });

  step("regressions");
  await expectText("L9.6 Cross-Solver Consistency Bench");
  await expectText("L9.5 Solver Router Evidence Auto-Pack / L9.4 Method Selection Matrix");
  await page.getByRole("button", { name: "RCWA Preview" }).click();
  await expectText("L9.3 In-Browser 1D RCWA Preview Solver");
  await page.getByRole("button", { name: "2D Maxwell Sandbox" }).click();
  await expectText("L9.2 In-Browser 2D FDTD Maxwell Sandbox");
  await page.getByRole("button", { name: "Build My Simulation" }).click();
  await expectText("L8.9 Real External FDTD Run Ingestion");
  await expectText("L8.8 Engineering Evidence Campaign");

  const unexpectedConsoleIssues = consoleIssues.filter((message) => !message.includes("Download the React DevTools"));
  const summary = {
    url,
    screenshots: [
      "l97-wizard-start-smoke.png",
      "l97-wizard-rcwa-route-smoke.png",
      "l97-wizard-external-fdtd-route-smoke.png",
      "l97-wizard-unsupported-gap-smoke.png",
      "l97-wizard-decision-report-smoke.png"
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

  async function clickWizardAction(label) {
    await page.getByLabel("L9.7 wizard actions").getByRole("button", { name: label }).click();
  }

  async function clickOption(label, groupLabel) {
    await page.getByLabel(groupLabel).getByRole("button", { name: label }).click();
  }

  async function assertNoL97Overflow() {
    const overflow = await page.getByLabel("L9.7 Build My Simulation wizard smoke preview").evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight
    }));
    if (overflow.scrollWidth > overflow.clientWidth + 2) {
      throw new Error(`L9.7 wizard horizontal overflow: ${overflow.scrollWidth} > ${overflow.clientWidth}`);
    }
  }

  function step(label) {
    console.log(`l97 smoke step: ${label}`);
  }
}

module.exports = smoke;
