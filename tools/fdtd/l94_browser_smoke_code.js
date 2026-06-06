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
  await expectText("L9.4 Solver Router / Method Selection Matrix");
  await expectText("Solver Recommendation");
  await expectText("Method Selection Matrix");

  step("planar route");
  await page.getByRole("button", { name: "Load planar coating scene" }).click();
  await expectText("PlanarTmmBackend");
  await expectText("TMM energy balance");
  await page.screenshot({ path: `${artifactDir}/l94-solver-router-planar-smoke.png`, fullPage: true });

  step("rcwa route");
  await page.getByRole("button", { name: "Load binary grating scene" }).click();
  await expectText("RCWA Preview Solver");
  await expectText("Harmonic convergence");
  await expectText("Open RCWA Preview Solver");
  await page.screenshot({ path: `${artifactDir}/l94-solver-router-rcwa-smoke.png`, fullPage: true });

  step("external fdtd route");
  await page.getByRole("button", { name: "Load finite block/aperture scene" }).click();
  await expectText("External FDTD / Meep export-import");
  await expectText("Export External FDTD Run Pack");
  await expectText("2D FDTD CPU reference");
  await page.screenshot({ path: `${artifactDir}/l94-solver-router-fdtd-smoke.png`, fullPage: true });

  step("unsupported route");
  await page.getByRole("button", { name: "Load unsupported curved material lens scene" }).click();
  await expectText("Unsupported / scaffold");
  await expectText("Show Unsupported Items");
  await expectText("curved/freeform/CAD");

  step("method matrix");
  await page.getByRole("button", { name: /Finite dielectric block/i }).click();
  await expectText("TMM is rejected for finite lateral geometry.");
  await expectText("Best available evidence path for finite material geometry.");
  await page.screenshot({ path: `${artifactDir}/l94-method-matrix-smoke.png`, fullPage: true });

  step("route report exports");
  await expectText("solver_route_report.md");
  await expectText("solver_route_report.json");
  await expectText("solver_route_matrix.csv");
  await expectText("unsupported_items.csv");
  await expectText("validation_plan.csv");
  await page.screenshot({ path: `${artifactDir}/l94-route-report-smoke.png`, fullPage: true });

  step("l93 l92 l89 regressions");
  await page.getByRole("button", { name: "RCWA Preview" }).click();
  await expectText("L9.3 In-Browser 1D RCWA Preview Solver");
  await page.getByRole("button", { name: "Run RCWA" }).click();
  await expectText("Total R");
  await page.getByRole("button", { name: "2D Maxwell Sandbox" }).click();
  await expectText("L9.2 WebGPU-Accelerated 2D FDTD Sandbox");
  await page.getByRole("button", { name: "Simulation Builder" }).click();
  await expectText("L8.9 Real External FDTD Run Ingestion");
  await expectText("L8.8 Engineering Evidence Campaign");

  const unexpectedConsoleIssues = consoleIssues.filter((message) => !message.includes("Download the React DevTools"));
  const summary = {
    url,
    screenshots: [
      "l94-solver-router-planar-smoke.png",
      "l94-solver-router-rcwa-smoke.png",
      "l94-solver-router-fdtd-smoke.png",
      "l94-method-matrix-smoke.png",
      "l94-route-report-smoke.png"
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

  function step(label) {
    console.log(`l94 smoke step: ${label}`);
  }
}

module.exports = smoke;
