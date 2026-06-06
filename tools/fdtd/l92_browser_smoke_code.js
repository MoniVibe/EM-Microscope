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
  await expectText("L9.2 WebGPU-Accelerated 2D FDTD Sandbox");
  await expectText("2D Maxwell Sandbox");

  step("open sandbox");
  await page.getByRole("button", { name: "2D Maxwell Sandbox" }).click();
  await expectText("L9.2 In-Browser 2D FDTD Maxwell Sandbox");
  await expectText("Backend / WebGPU");
  await expectText("CPU reference");
  await expectText("Execution backend");
  await expectText("fdtd2d_backend_report.json");
  await page.screenshot({ path: `${artifactDir}/l92-backend-selector-smoke.png`, fullPage: true });

  step("webgpu status");
  await expectText("WebGPU status");
  await expectText("Effective backend");
  await expectText("Fallback");
  await expectText("GPU memory");
  await page.screenshot({ path: `${artifactDir}/l92-webgpu-status-smoke.png`, fullPage: true });

  step("fallback or optional webgpu");
  await page.getByLabel("Execution backend").selectOption("webgpu-accelerated");
  await expectText("WebGPU");
  await expectText("CPU reference");
  await page.screenshot({ path: `${artifactDir}/l92-fallback-cpu-smoke.png`, fullPage: true });

  step("parity");
  await page.getByRole("button", { name: "Run CPU/GPU Parity Check" }).click();
  await expectText("Parity RMS Ez");
  await expectText(/pass|warning|fail/i);
  await page.screenshot({ path: `${artifactDir}/l92-cpu-gpu-parity-smoke.png`, fullPage: true });

  step("performance");
  await page.getByRole("button", { name: "Run Performance Benchmark" }).click();
  await expectText("steps/sec");
  await expectText("ms/step");
  await page.screenshot({ path: `${artifactDir}/l92-performance-benchmark-smoke.png`, fullPage: true });

  step("fixtures and exports");
  await page.getByRole("button", { name: "Dielectric" }).first().click();
  await expectText("Reference Checks");
  await expectText("Dielectric interface Fresnel trend");
  await page.getByRole("button", { name: "Absorber" }).first().click();
  await expectText("Absorbing slab thickness trend");
  await expectText("fdtd2d_backend_report.md");
  await expectText("fdtd2d_parity.csv");
  await expectText("fdtd2d_performance.csv");

  step("builder handoff and regressions");
  await page.getByRole("button", { name: "Simulation Builder" }).click();
  await expectText("L9.2 Simulation Builder + 2D Sandbox Handoff");
  await expectText("Export 2D Slice to Maxwell Sandbox");
  await expectText("L8.9 Real External FDTD Run Ingestion");
  await expectText("L8.8 Engineering Evidence Campaign");
  await page.getByRole("button", { name: "Export 2D Slice to Maxwell Sandbox" }).click();
  await expectText("L9.2 In-Browser 2D FDTD Maxwell Sandbox");
  await expectText("L9.2 2D sandbox slice");

  const unexpectedConsoleIssues = consoleIssues.filter((message) => !message.includes("Download the React DevTools"));
  const summary = {
    url,
    screenshots: [
      "l92-backend-selector-smoke.png",
      "l92-webgpu-status-smoke.png",
      "l92-cpu-gpu-parity-smoke.png",
      "l92-performance-benchmark-smoke.png",
      "l92-fallback-cpu-smoke.png"
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
    console.log(`l92 smoke step: ${label}`);
  }
}

module.exports = smoke;
