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
  await expectText("L9.1 In-Browser 2D FDTD Maxwell Sandbox");
  await expectText("2D Maxwell Sandbox");

  step("open sandbox");
  await page.getByRole("button", { name: "2D Maxwell Sandbox" }).click();
  await expectText("Grid Safety / Memory Budget");
  await expectText("TMz fields Ez, Hx, Hy");
  await expectText("fdtd2d_sandbox_report.md");
  await page.screenshot({ path: `${artifactDir}/l90-fdtd-sandbox-grid-smoke.png`, fullPage: true });

  step("step fields");
  await page.getByRole("button", { name: "Run N Steps" }).click();
  await page.waitForTimeout(250);
  await expectText("Field Map / Intensity / Material Overlay");
  await page.screenshot({ path: `${artifactDir}/l90-fdtd-source-field-smoke.png`, fullPage: true });

  step("material fixture");
  await page.getByRole("button", { name: "Dielectric" }).first().click();
  await page.getByLabel("view").selectOption("material");
  await expectText("Validation Fixtures");
  await page.screenshot({ path: `${artifactDir}/l90-fdtd-material-scatter-smoke.png`, fullPage: true });

  step("monitor trace export surface");
  await page.getByLabel("view").selectOption("intensity");
  await page.getByRole("button", { name: "Run N Steps" }).click();
  await page.waitForTimeout(250);
  await expectText("monitor_trace.csv");
  await expectText("energy_trace.csv");
  await page.screenshot({ path: `${artifactDir}/l90-fdtd-monitor-trace-smoke.png`, fullPage: true });

  step("builder handoff");
  await page.getByRole("button", { name: "Simulation Builder" }).click();
  await expectText("Export 2D Slice to Maxwell Sandbox");
  await expectText("fdtd2d_sandbox_scene.json");
  await page.getByRole("button", { name: "Export 2D Slice to Maxwell Sandbox" }).click();
  await expectText("L9.1 In-Browser 2D FDTD Maxwell Sandbox");
  await expectText("L9.1 2D sandbox slice");
  await page.screenshot({ path: `${artifactDir}/l90-builder-to-sandbox-smoke.png`, fullPage: true });

  const unexpectedConsoleIssues = consoleIssues.filter((message) => !message.includes("Download the React DevTools"));
  const summary = {
    url,
    screenshots: [
      "l90-fdtd-sandbox-grid-smoke.png",
      "l90-fdtd-source-field-smoke.png",
      "l90-fdtd-material-scatter-smoke.png",
      "l90-fdtd-monitor-trace-smoke.png",
      "l90-builder-to-sandbox-smoke.png"
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
    console.log(`l90 smoke step: ${label}`);
  }
}
