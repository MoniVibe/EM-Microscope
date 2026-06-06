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

  await page.setViewportSize({ width: 1440, height: 920 });
  step("navigate");
  await page.goto(url, { waitUntil: "networkidle" });
  await expectText("L8.5.1 Element Inspector + Direct Optical Bench Editing");
  await expectText("Element Inspector");
  await expectText("Numeric/text fields are the source of truth");
  const bench = page.getByLabel("L8.5.1 multi-element optical bench editor smoke preview");
  const elementList = page.getByLabel("L8.5 ordered element list smoke preview");
  const inspector = page.getByLabel("L8.5.1 element inspector direct editing smoke preview");
  await page.screenshot({ path: `${artifactDir}/l851-element-inspector-smoke.png`, fullPage: true });

  step("numeric edit");
  await inspector.getByLabel("z mm").fill("12");
  await page.screenshot({ path: `${artifactDir}/l851-element-actions-smoke.png`, fullPage: true });

  step("drag edit");
  const firstElementShape = page.locator(".l85-cross-section-item-element").first();
  const box = await firstElementShape.boundingBox();
  if (!box) throw new Error("Could not find element shape for drag smoke");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 90, box.y + box.height / 2 - 12, { steps: 8 });
  await page.mouse.up();
  await page.screenshot({ path: `${artifactDir}/l851-drag-move-smoke.png`, fullPage: true });

  step("nudge alternative");
  await inspector.getByRole("button", { name: "Nudge +z" }).click();

  step("duplicate and delete");
  await elementList.getByRole("button", { name: "Select Ideal thin lens 1", exact: true }).click();
  await inspector.getByRole("button", { name: "Duplicate" }).click();
  await expectText("copy");
  await inspector.getByRole("button", { name: "Delete" }).click();

  step("disable absorber and add monitor");
  await elementList.getByRole("button", { name: "Select Absorbing blocker 1", exact: true }).click();
  await inspector.getByRole("button", { name: "Disable" }).click();
  await expectText("scaffold");
  await elementList.getByRole("button", { name: "Select Transparent block 1", exact: true }).click();
  await inspector.getByRole("button", { name: "Monitor after" }).click();
  await expectText("After Transparent block 1 monitor");

  step("outside-domain warning and undo");
  await elementList.getByRole("button", { name: "Select Transparent block 1", exact: true }).click();
  await inspector.getByLabel("x um").fill("999");
  await expectText("opticalBench.edit.elementOutsideDomain");
  await expectText("export blocked");
  await page.screenshot({ path: `${artifactDir}/l851-edit-warnings-smoke.png`, fullPage: true });
  await inspector.getByRole("button", { name: "Undo" }).click();
  await expectText("Undo");

  step("export edited scene");
  const [sceneDownload] = await Promise.all([
    page.waitForEvent("download"),
    bench.getByRole("button", { name: "Export Multi-Element Scene" }).click()
  ]);
  const sceneFilename = sceneDownload.suggestedFilename();
  if (!sceneFilename.startsWith("multielement_")) throw new Error(`Unexpected scene download: ${sceneFilename}`);
  await sceneDownload.saveAs(`${artifactDir}/l851-exported-scene.json`);
  await page.screenshot({ path: `${artifactDir}/l851-undo-export-smoke.png`, fullPage: true });

  step("scalar and external fixture");
  await bench.getByRole("button", { name: "Run Scalar Preview" }).click();
  await expectText("Scalar Chain Preview");
  await bench.getByRole("button", { name: "Import Bundled Multi-Element Fixture" }).click();
  await expectText("External FDTD Chain Import");
  await expectText("imported fixture");

  step("regressions");
  await page.getByRole("button", { name: "Load Long Slit Fixture" }).click();
  await expectText("L8.4 Aperture / Blocker Edge-Diffraction Validation");
  await page.getByRole("button", { name: "Load Transparent Convergence Fixture" }).click();
  await expectText("Residual vs Resolution");
  await page.getByRole("button", { name: "Diagnostic Workbenches" }).click();
  await expectText("L7.8 Detector Round-Trip Acceptance Pack / Real Detector Bridge");

  const unexpectedConsoleIssues = consoleIssues.filter((message) => !message.includes("Download the React DevTools"));
  const summary = {
    url,
    sceneDownload: sceneFilename,
    screenshots: [
      "l851-element-inspector-smoke.png",
      "l851-drag-move-smoke.png",
      "l851-element-actions-smoke.png",
      "l851-edit-warnings-smoke.png",
      "l851-undo-export-smoke.png",
      "l851-exported-scene.json"
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
    console.log(`l851 smoke step: ${label}`);
  }
}
