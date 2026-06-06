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
  await expectText("L8.9 Real External FDTD Run Ingestion + Engineering Evidence Campaign");
  await expectText("Order and z-position");
  await expectText("Finite shape and transverse placement");
  await expectText("Inspector fields are exact source of truth");
  await expectText("Inspect");
  await expectText("Edit Geometry");
  await page.screenshot({ path: `${artifactDir}/l88a-two-view-labels-smoke.png`, fullPage: true });

  step("axis z-only drag");
  const axisNode = page.locator(".simulation-axis-node-element").first();
  const axisBox = await axisNode.boundingBox();
  if (!axisBox) throw new Error("Could not find optical-axis element node");
  await page.mouse.move(axisBox.x + axisBox.width / 2, axisBox.y + axisBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(axisBox.x + axisBox.width / 2 + 120, axisBox.y + axisBox.height / 2, { steps: 8 });
  await page.mouse.up();
  await expectText("Optical Axis Placement");
  await page.screenshot({ path: `${artifactDir}/l88a-axis-z-drag-smoke.png`, fullPage: true });

  step("xz edit mode body and handle drag");
  await page.getByRole("button", { name: "Edit Geometry" }).click();
  const finiteObject = page.locator(".surface-cross-section-object").first();
  const objectBox = await finiteObject.boundingBox();
  if (!objectBox) throw new Error("Could not find finite surface geometry object");
  await finiteObject.click();
  await page.mouse.move(objectBox.x + objectBox.width / 2, objectBox.y + objectBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(objectBox.x + objectBox.width / 2 + 70, objectBox.y + objectBox.height / 2 - 18, { steps: 8 });
  await page.mouse.up();
  const rightHandle = page.locator(".surface-cross-section-handle-right").first();
  const handleBox = await rightHandle.boundingBox();
  if (!handleBox) throw new Error("Could not find surface geometry thickness handle");
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox.x + handleBox.width / 2 + 30, handleBox.y + handleBox.height / 2, { steps: 5 });
  await page.mouse.up();
  await page.screenshot({ path: `${artifactDir}/l88a-xz-edit-handles-smoke.png`, fullPage: true });

  step("warning visuals");
  const inspector = page.getByLabel("L8.5.1 element inspector direct editing smoke preview");
  await inspector.getByLabel("x um").fill("999");
  await expectText("opticalBench.edit.elementOutsideDomain");
  await page.getByLabel("Surface geometry warning visual summary").waitFor({ state: "visible", timeout: 10000 });
  await page.screenshot({ path: `${artifactDir}/l88a-warning-visuals-smoke.png`, fullPage: true });

  step("l88 regression");
  await expectText("Golden Evidence Pack / External FDTD Acceptance Campaign");
  await expectText("Generate Engineer Review Dossier");

  const unexpectedConsoleIssues = consoleIssues.filter((message) => !message.includes("Download the React DevTools"));
  const summary = {
    url,
    screenshots: [
      "l88a-two-view-labels-smoke.png",
      "l88a-axis-z-drag-smoke.png",
      "l88a-xz-edit-handles-smoke.png",
      "l88a-warning-visuals-smoke.png"
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
    console.log(`l88a smoke step: ${label}`);
  }
}
