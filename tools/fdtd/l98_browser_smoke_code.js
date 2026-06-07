async function smoke(page) {
  const currentUrl = page.url();
  const url = currentUrl && currentUrl !== "about:blank" ? currentUrl : "http://127.0.0.1:5198/";
  const artifactDir = "artifacts";
  const consoleIssues = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleIssues.push(message.text());
  });
  page.on("pageerror", (error) => {
    consoleIssues.push(error.message);
  });

  await page.setViewportSize({ width: 1680, height: 1200 });
  step("navigate");
  await page.goto(url, { waitUntil: "networkidle" });
  await expectText("L9.8 Guided Example Library / Known Experiment Pack");
  await expectText("Example Library");
  await expectText("Known experiment starter packs");
  await expectText("example_report.md");
  await expectText("example_registry.csv");
  await assertNoL98Overflow();
  await page.screenshot({ path: `${artifactDir}/l98-example-library-start-smoke.png`, fullPage: true });

  step("airy scalar example");
  await search("Airy");
  await selectExample("Circular aperture Airy/Bessel");
  await expectText("Scalar propagation");
  await expectText("scalar-validation");
  await clickExampleAction("Generate Evidence Pack");
  await expectText("Evidence pack generated");
  await clickExampleAction("Add to Engineering Evidence Campaign");
  await expectText("Campaign handoff preserved");
  await clickExampleAction("Export Example Report");
  await expectText("Example report exported");
  await clickExampleAction("Load Example");
  await expectText("L9.7 Solver Method Decision Wizard / Simulation Intake");
  await expectText("Scalar propagation");
  await expectText("scalar-validation");
  await page.screenshot({ path: `${artifactDir}/l98-airy-example-smoke.png`, fullPage: true });

  step("rcwa example");
  await openExamples();
  await search("grating");
  await selectExample("RCWA binary grating");
  await expectText("RCWA Preview Solver");
  await expectText("rcwa-convergence");
  await clickExampleAction("Load Example");
  await expectText("L9.3 In-Browser 1D RCWA Preview Solver");
  await expectText("Run Harmonic Convergence");
  await page.screenshot({ path: `${artifactDir}/l98-rcwa-example-smoke.png`, fullPage: true });

  step("fdtd example");
  await openExamples();
  await search("FDTD point");
  await selectExample("2D FDTD point source");
  await expectText("fdtd2d-validation");
  await clickExampleAction("Load Example");
  await expectText("L9.2 In-Browser 2D FDTD Maxwell Sandbox");
  await expectText("point-source radial symmetry fixture");
  await page.screenshot({ path: `${artifactDir}/l98-fdtd-example-smoke.png`, fullPage: true });

  step("external fdtd example");
  await openExamples();
  await search("transparent finite");
  await selectExample("External FDTD transparent finite block");
  await expectText("External FDTD / Meep export-import");
  await expectText("external-fdtd-run-pack");
  await clickExampleAction("Load Example");
  await expectText("L9.7 Solver Method Decision Wizard / Simulation Intake");
  await expectText("External FDTD / Meep export-import");
  await expectText("external-fdtd-run-pack");
  await page.screenshot({ path: `${artifactDir}/l98-external-fdtd-example-smoke.png`, fullPage: true });

  step("unsupported gap example");
  await openExamples();
  await search("curved lens");
  await selectExample("Unsupported curved material lens / arbitrary CAD gap");
  await expectText("Unsupported gap report");
  await expectText("No executable in-app route");
  await clickExampleAction("Load Example");
  await expectText("L9.7 Solver Method Decision Wizard / Simulation Intake");
  await expectText("Unsupported gap report");
  await expectText("validated CAD meshing");
  await page.screenshot({ path: `${artifactDir}/l98-gap-example-smoke.png`, fullPage: true });

  step("regressions");
  await page.getByRole("button", { name: "RCWA Preview" }).click();
  await expectText("L9.3 In-Browser 1D RCWA Preview Solver");
  await page.getByRole("button", { name: "2D Maxwell Sandbox" }).click();
  await expectText("L9.2 In-Browser 2D FDTD Maxwell Sandbox");
  await page.getByRole("button", { name: "Build My Simulation" }).click();
  await expectText("L9.7 Solver Method Decision Wizard / Simulation Intake");

  const unexpectedConsoleIssues = consoleIssues.filter((message) => !message.includes("Download the React DevTools"));
  const summary = {
    url,
    screenshots: [
      "l98-example-library-start-smoke.png",
      "l98-airy-example-smoke.png",
      "l98-rcwa-example-smoke.png",
      "l98-fdtd-example-smoke.png",
      "l98-external-fdtd-example-smoke.png",
      "l98-gap-example-smoke.png"
    ],
    consoleErrorCount: unexpectedConsoleIssues.length,
    consoleErrors: unexpectedConsoleIssues
  };
  console.log(JSON.stringify(summary, null, 2));
  if (unexpectedConsoleIssues.length > 0) throw new Error(`Console errors: ${unexpectedConsoleIssues.join("; ")}`);

  async function openExamples() {
    await page.getByRole("button", { name: "Example Library" }).click();
    await expectText("L9.8 Guided Example Library / Known Experiment Pack");
  }

  async function search(value) {
    const input = page.getByLabel("Search examples");
    await input.fill(value);
  }

  async function selectExample(name) {
    await page.getByRole("button", { name: `Select example ${name}` }).click();
    await expectText(name);
  }

  async function clickExampleAction(label) {
    await page.getByLabel("L9.8 example actions").getByRole("button", { name: label }).click();
  }

  async function expectText(textOrPattern) {
    const body = page.locator("body");
    if (typeof textOrPattern === "string") {
      await body.getByText(textOrPattern, { exact: false }).first().waitFor({ timeout: 20000 });
      return;
    }
    await body.getByText(textOrPattern).first().waitFor({ timeout: 20000 });
  }

  async function assertNoL98Overflow() {
    const overflow = await page.getByLabel("L9.8 Example Library").evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight
    }));
    if (overflow.scrollWidth > overflow.clientWidth + 2) {
      throw new Error(`L9.8 example library horizontal overflow: ${overflow.scrollWidth} > ${overflow.clientWidth}`);
    }
  }

  function step(label) {
    console.log(`l98 smoke step: ${label}`);
  }
}

module.exports = smoke;
