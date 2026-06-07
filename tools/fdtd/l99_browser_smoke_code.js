async function smoke(page) {
  const currentUrl = page.url();
  const url = currentUrl && currentUrl !== "about:blank" ? currentUrl : "http://127.0.0.1:5199/";
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
  await expectText("L9.9 Advisor Review Packet / Evidence Dossier Generator");
  await expectText("Advisor Review Packet");
  await expectText("Packet preset");
  await expectText("advisor_packet.md");
  await expectText("advisor_claim_ledger.csv");
  await assertNoL99Overflow();
  await page.screenshot({ path: `${artifactDir}/l99-advisor-packet-start-smoke.png`, fullPage: true });

  step("physics sanity packet");
  await clickButton("Generate Packet");
  await expectText("Physics Sanity");
  await expectText("Circular aperture Airy/Bessel");
  await expectText("Long single slit sinc^2");
  await expectText("Double slit order spacing");
  await expectText("Ideal thin lens focal plane");
  await expectText("Coherence demonstrator");
  await expectText("Packet completeness: 100%");
  await page.screenshot({ path: `${artifactDir}/l99-physics-sanity-packet-smoke.png`, fullPage: true });

  step("claim ledger and completeness");
  await expectText("Claim Ledger");
  await expectText("Completeness");
  await expectText("Iteration count is not validation");
  await expectText("Arbitrary 3D Maxwell");
  await expectText("FEM/BEM solver");
  await page.screenshot({ path: `${artifactDir}/l99-claim-ledger-smoke.png`, fullPage: true });
  await page.screenshot({ path: `${artifactDir}/l99-completeness-check-smoke.png`, fullPage: true });

  step("surface geometry packet");
  await selectPreset("surface-geometry");
  await expectText("Surface Geometry");
  await clickButton("Generate Packet");
  await expectText("Surface geometry review");
  await expectText("transparent finite block");
  await expectText("Absorbing block");
  await expectText("Reflective plate");
  await expectText("aperture");
  await expectText("Tilted wedge");
  await page.screenshot({ path: `${artifactDir}/l99-surface-geometry-packet-smoke.png`, fullPage: true });

  step("solver credibility and export");
  await selectPreset("solver-credibility");
  await expectText("Solver Credibility");
  await expectText("Solver credibility review");
  await expectText("TMM vs RCWA no-pattern");
  await expectText("CPU vs WebGPU FDTD parity");
  await expectText("TMM/Fresnel vs external FDTD");
  await selectPreset("full-current-state");
  await expectText("Full Current-State");
  await clickButton("Generate Packet");
  await expectText("Full current-state review");
  await expectText("advisor_packet.json");
  await expectText("advisor_evidence_table.csv");
  await expectText("advisor_gap_table.csv");
  await clickButton("Export All");
  await expectText("exported 9 files");
  await page.screenshot({ path: `${artifactDir}/l99-packet-export-smoke.png`, fullPage: true });

  step("regressions");
  await clickButton("Example Library");
  await expectText("L9.8 Guided Example Library / Known Experiment Pack");
  await clickButton("Simulation Builder");
  await expectText("L9.6 Cross-Solver Consistency Bench");
  await clickButton("RCWA Preview");
  await expectText("L9.3 In-Browser 1D RCWA Preview Solver");
  await clickButton("2D Maxwell Sandbox");
  await expectText("L9.2 In-Browser 2D FDTD Maxwell Sandbox");

  const unexpectedConsoleIssues = consoleIssues.filter((message) => !message.includes("Download the React DevTools"));
  const summary = {
    url,
    screenshots: [
      "l99-advisor-packet-start-smoke.png",
      "l99-physics-sanity-packet-smoke.png",
      "l99-surface-geometry-packet-smoke.png",
      "l99-claim-ledger-smoke.png",
      "l99-completeness-check-smoke.png",
      "l99-packet-export-smoke.png"
    ],
    consoleErrorCount: unexpectedConsoleIssues.length,
    consoleErrors: unexpectedConsoleIssues
  };
  console.log(JSON.stringify(summary, null, 2));
  if (unexpectedConsoleIssues.length > 0) throw new Error(`Console errors: ${unexpectedConsoleIssues.join("; ")}`);

  async function selectPreset(value) {
    await page.getByLabel("Packet preset").selectOption(value);
  }

  async function clickButton(name) {
    await page.getByRole("button", { name, exact: true }).click();
  }

  async function expectText(textOrPattern) {
    const body = page.locator("body");
    if (typeof textOrPattern === "string") {
      await body.getByText(textOrPattern, { exact: false }).filter({ visible: true }).first().waitFor({ timeout: 20000 });
      return;
    }
    await body.getByText(textOrPattern).filter({ visible: true }).first().waitFor({ timeout: 20000 });
  }

  async function assertNoL99Overflow() {
    const overflow = await page.getByLabel("L9.9 Advisor Review Packet").evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight
    }));
    if (overflow.scrollWidth > overflow.clientWidth + 2) {
      throw new Error(`L9.9 advisor packet horizontal overflow: ${overflow.scrollWidth} > ${overflow.clientWidth}`);
    }
  }

  function step(label) {
    console.log(`l99 smoke step: ${label}`);
  }
}

module.exports = smoke;
