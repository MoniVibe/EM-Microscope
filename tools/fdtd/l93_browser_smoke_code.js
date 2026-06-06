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

  await page.setViewportSize({ width: 1520, height: 1180 });
  step("navigate");
  await page.goto(url, { waitUntil: "networkidle" });
  await expectText("L9.3 In-Browser 1D RCWA Preview");
  await expectText("RCWA Preview");

  step("open rcwa");
  await page.getByRole("button", { name: "RCWA Preview" }).click();
  await expectText("L9.3 In-Browser 1D RCWA Preview Solver");
  await expectText("Bounded 1D periodic solver preview only");
  await expectText("Load Default Binary Grating");
  await page.screenshot({ path: `${artifactDir}/l93-rcwa-default-grating-smoke.png`, fullPage: true });

  step("run default grating");
  await page.getByRole("button", { name: "Run RCWA" }).click();
  await expectText("Results");
  await expectText("Total R");
  await expectText("Total T");
  await expectText("Energy error");
  await expectText("propagating");
  await page.screenshot({ path: `${artifactDir}/l93-rcwa-order-table-smoke.png`, fullPage: true });

  step("convergence");
  await page.getByRole("button", { name: "Run Harmonic Convergence" }).click();
  await expectText("Validation");
  await expectText("3 H");
  await expectText("11 H");
  await page.screenshot({ path: `${artifactDir}/l93-rcwa-convergence-smoke.png`, fullPage: true });

  step("tmm consistency");
  await page.getByRole("button", { name: "Run No-Pattern TMM Check" }).click();
  await expectText("TMM consistency");
  await expectText("pass");
  await page.screenshot({ path: `${artifactDir}/l93-rcwa-tmm-consistency-smoke.png`, fullPage: true });

  step("exports");
  await expectText("rcwa_report.md");
  await expectText("rcwa_report.json");
  await expectText("rcwa_orders.csv");
  await expectText("rcwa_convergence.csv");
  await expectText("rcwa_tmm_consistency.csv");
  await page.screenshot({ path: `${artifactDir}/l93-rcwa-export-smoke.png`, fullPage: true });

  step("l92 and evidence regressions");
  await page.getByRole("button", { name: "2D Maxwell Sandbox" }).click();
  await expectText("L9.2 In-Browser 2D FDTD Maxwell Sandbox");
  await expectText("Backend / WebGPU");
  await page.getByRole("button", { name: "Simulation Builder" }).click();
  await expectText("L8.9 Real External FDTD Run Ingestion");
  await expectText("L8.8 Engineering Evidence Campaign");

  const unexpectedConsoleIssues = consoleIssues.filter((message) => !message.includes("Download the React DevTools"));
  const summary = {
    url,
    screenshots: [
      "l93-rcwa-default-grating-smoke.png",
      "l93-rcwa-order-table-smoke.png",
      "l93-rcwa-convergence-smoke.png",
      "l93-rcwa-tmm-consistency-smoke.png",
      "l93-rcwa-export-smoke.png"
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
    console.log(`l93 smoke step: ${label}`);
  }
}

module.exports = smoke;
