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

  await page.setViewportSize({ width: 1500, height: 1040 });
  step("navigate");
  await page.goto(url, { waitUntil: "networkidle" });
  await expectText("L8.9 Real External FDTD Run Ingestion");
  await expectText("Export Real Run Pack");
  await expectText("Import Real Run Bundle");
  await expectText("Export Reproducibility Report");
  await expectText("Meep/Python stay local to the user machine");
  await page.screenshot({ path: `${artifactDir}/l89-real-run-pack-smoke.png`, fullPage: true });

  step("transparent fixture");
  await page.getByRole("button", { name: /Load Transparent Real Run Fixture/i }).click();
  await expectText("Hash Validation");
  await expectText("Reference Comparison");
  await expectText("Material hash");
  await expectText("Monitor hash");
  await expectText("Run config hash");
  await expectText("Promote to Engineering Evidence Campaign");
  await page.screenshot({ path: `${artifactDir}/l89-real-run-fixture-smoke.png`, fullPage: true });

  step("hash mismatch fixture");
  await page.getByRole("button", { name: /Load Hash-Mismatch Fixture/i }).click();
  await expectText("fdtd.realRun.materialHashMismatch");
  await expectText("fdtd.realRun.monitorHashMismatch");
  await expectText("fdtd.realRun.runConfigHashMismatch");
  await page.screenshot({ path: `${artifactDir}/l89-hash-mismatch-smoke.png`, fullPage: true });

  step("aperture and report controls");
  await page.getByRole("button", { name: /Load Aperture Real Run Fixture/i }).click();
  await expectText("Real Run Field / Intensity");
  await expectText("Evidence Promotion");
  await expectText("Export Reproducibility Report");
  await page.screenshot({ path: `${artifactDir}/l89-repro-report-smoke.png`, fullPage: true });

  step("l88 regression");
  await expectText("Golden Evidence Pack / External FDTD Acceptance Campaign");
  await expectText("Generate Engineer Review Dossier");

  const unexpectedConsoleIssues = consoleIssues.filter((message) => !message.includes("Download the React DevTools"));
  const summary = {
    url,
    screenshots: [
      "l89-real-run-pack-smoke.png",
      "l89-real-run-fixture-smoke.png",
      "l89-hash-mismatch-smoke.png",
      "l89-repro-report-smoke.png"
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
    console.log(`l89 smoke step: ${label}`);
  }
}
