(async function smoke(page) {
  const currentUrl = page.url();
  const url = currentUrl && currentUrl !== "about:blank" ? currentUrl : "http://127.0.0.1:5199/";
  const artifactDir = "artifacts";
  const consoleIssues = [];
  let traceActive = false;

  page.on("console", (message) => {
    if (message.type() === "error") consoleIssues.push(message.text());
  });
  page.on("pageerror", (error) => {
    consoleIssues.push(error.message);
  });

  try {
    await page.context().tracing.start({ screenshots: true, snapshots: true });
    traceActive = true;
  } catch (error) {
    console.log(`l100 smoke trace unavailable: ${error.message}`);
  }

  try {
    await page.setViewportSize({ width: 1680, height: 1200 });
    step("navigate");
    await page.goto(url, { waitUntil: "networkidle" });
    await expectText("L10.0 Engineer Review Release Candidate");
    await expectText("L10.0 RC");
    await expectText("Release Build Info");
    await expectText("release_manifest.json");
    await expectText("known_limitations.md");
    await expectText("No arbitrary 3D Maxwell in browser");
    await assertNoL100Overflow();
    await page.screenshot({ path: `${artifactDir}/l100-rc-front-door-smoke.png`, fullPage: true });

    step("review paths");
    await clickButton("30-minute deep review");
    await expectText("Run Build My Simulation wizard");
    await expectText("Open unsupported curved material lens gap");
    await clickButton("Full evidence review");
    await expectText("Review all L9.8 example categories");
    await expectText("Draft the GitHub release candidate");
    await page.screenshot({ path: `${artifactDir}/l100-review-path-smoke.png`, fullPage: true });

    step("release exports");
    await clickButton("Export Release Package");
    await expectText("exported release package");
    await expectText("release_notes.md");
    await expectText("review_checklist.md");
    await expectText("public_demo_script.md");
    await page.screenshot({ path: `${artifactDir}/l100-release-manifest-smoke.png`, fullPage: true });

    step("full advisor packet export");
    await clickButton("Export Full Advisor Packet");
    await expectText("exported full advisor packet");
    await expectText("advisor_packet.md");
    await expectText("advisor_claim_ledger.csv");
    await expectText("advisor_reproducibility_manifest.json");
    await page.screenshot({ path: `${artifactDir}/l100-full-advisor-packet-smoke.png`, fullPage: true });

    step("known limitations");
    await expectText("Known Limitations / Capability Truth");
    await expectText("No production FDTD certification");
    await expectText("No FEM/BEM");
    await expectText("No production RCWA certification");
    await expectText("No full microscope digital twin");
    await expectText("No manufacturing certification");
    await expectText("No certified camera calibration");
    await page.screenshot({ path: `${artifactDir}/l100-known-limitations-smoke.png`, fullPage: true });

    step("top-level workflow matrix");
    await clickButton("Advisor Review Packet");
    await expectText("L9.9 Advisor Review Packet / Evidence Dossier Generator");
    await clickButton("Generate Packet");
    await expectText("Claim Ledger");
    await clickButton("Example Library");
    await expectText("L9.8 Guided Example Library / Known Experiment Pack");
    await clickButton("Build My Simulation");
    await expectText("L9.7 Solver Method Decision Wizard / Simulation Intake");
    await clickButton("Simulation Builder");
    await expectText("L9.6 Cross-Solver Consistency Bench");
    await clickButton("RCWA Preview");
    await expectText("L9.3 In-Browser 1D RCWA Preview Solver");
    await clickButton("2D Maxwell Sandbox");
    await expectText("L9.2 In-Browser 2D FDTD Maxwell Sandbox");
    await clickButton("Diagnostic Workbenches");
    await expectText("L7.0 Slanted-Edge / Resolution Target MTF Workbench");
    await page.screenshot({ path: `${artifactDir}/l100-public-smoke-smoke.png`, fullPage: true });

    if (traceActive) {
      await page.context().tracing.stop();
      traceActive = false;
    }
  } catch (error) {
    if (traceActive) {
      await page.context().tracing.stop({ path: `${artifactDir}/l100-release-smoke-trace.zip` });
      traceActive = false;
    }
    throw error;
  }

  const unexpectedConsoleIssues = consoleIssues.filter((message) => !message.includes("Download the React DevTools"));
  const summary = {
    url,
    screenshots: [
      "l100-rc-front-door-smoke.png",
      "l100-review-path-smoke.png",
      "l100-full-advisor-packet-smoke.png",
      "l100-known-limitations-smoke.png",
      "l100-release-manifest-smoke.png",
      "l100-public-smoke-smoke.png"
    ],
    traceOnFailure: "l100-release-smoke-trace.zip",
    consoleErrorCount: unexpectedConsoleIssues.length,
    consoleErrors: unexpectedConsoleIssues
  };
  console.log(JSON.stringify(summary, null, 2));
  if (unexpectedConsoleIssues.length > 0) throw new Error(`Console errors: ${unexpectedConsoleIssues.join("; ")}`);

  async function clickButton(name) {
    await page.getByRole("button", { name, exact: true }).click();
  }

  async function expectText(textOrPattern) {
    const body = page.locator("body");
    if (typeof textOrPattern === "string") {
      await body.getByText(textOrPattern, { exact: false }).filter({ visible: true }).first().waitFor({ timeout: 25000 });
      return;
    }
    await body.getByText(textOrPattern).filter({ visible: true }).first().waitFor({ timeout: 25000 });
  }

  async function assertNoL100Overflow() {
    const overflow = await page.getByLabel("L10.0 Engineer Review Release Candidate").evaluate((element) => ({
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight
    }));
    if (overflow.scrollWidth > overflow.clientWidth + 2) {
      throw new Error(`L10.0 release candidate horizontal overflow: ${overflow.scrollWidth} > ${overflow.clientWidth}`);
    }
  }

  function step(label) {
    console.log(`l100 smoke step: ${label}`);
  }
})
