import { describe, expect, it } from "vitest";
import { createOpticalBenchBundle } from "../fdtd/fdtdMultiElementBench";
import {
  addOpticalBenchCustomMonitor,
  commitOpticalBenchHistory,
  createOpticalBenchHistory,
  deleteOpticalBenchCustomMonitor,
  isOpticalBenchEditingBlocked,
  moveOpticalBenchElementInOrder,
  nudgeOpticalBenchElement,
  redoOpticalBenchHistory,
  snapOpticalBenchZ,
  undoOpticalBenchHistory,
  updateOpticalBenchCustomMonitor,
  updateOpticalBenchElementProperties,
  validateOpticalBenchEditing
} from "./opticalBenchEditing";
import { defaultOpticalBenchScenario } from "./multiElementBench";

describe("L8.5.1 optical bench element editor helpers", () => {
  it("edits element z/x and type-specific properties through numeric source of truth", () => {
    const scenario = defaultOpticalBenchScenario();
    const aperture = scenario.elements[0]!;
    const edited = updateOpticalBenchElementProperties(scenario, aperture.id, {
      zMm: 12.25,
      xUm: 1.5,
      apertureDiameterUm: 2.25
    });
    const element = edited.elements.find((item) => item.id === aperture.id)!;

    expect(element.zMm).toBe(12.25);
    expect(element.xUm).toBe(1.5);
    expect(element.apertureDiameterUm).toBe(2.25);
    expect(createOpticalBenchBundle(edited).scene.elements.find((item) => item.id === aperture.id)?.zMm).toBe(12.25);
  });

  it("nudges and snaps element positions without requiring drag", () => {
    const scenario = defaultOpticalBenchScenario();
    const aperture = scenario.elements[0]!;
    const moved = nudgeOpticalBenchElement(scenario, aperture.id, { zMm: 0.27, xUm: 0.25 }, { enabled: true, stepMm: 0.5 });
    const element = moved.elements.find((item) => item.id === aperture.id)!;

    expect(snapOpticalBenchZ(10.27, { enabled: true, stepMm: 0.5 })).toBe(10.5);
    expect(element.zMm).toBe(10.5);
    expect(element.xUm).toBe(0.25);
  });

  it("moves elements earlier and later by z order", () => {
    const scenario = defaultOpticalBenchScenario();
    const first = scenario.elements[0]!;
    const second = scenario.elements[1]!;
    const moved = moveOpticalBenchElementInOrder(scenario, second.id, "earlier");

    expect(moved.elements[0]?.id).toBe(second.id);
    expect(moved.elements[1]?.id).toBe(first.id);
  });

  it("adds, edits, exports, and deletes custom monitors around selected elements", () => {
    const scenario = defaultOpticalBenchScenario();
    const block = scenario.elements.find((element) => element.kind === "finite-transparent-block")!;
    const withMonitor = addOpticalBenchCustomMonitor(scenario, block.id, "after");
    const monitor = withMonitor.customMonitors?.[0]!;
    const edited = updateOpticalBenchCustomMonitor(withMonitor, monitor.id, { zMm: block.zMm + 2, xUm: 0.5 });
    const bundle = createOpticalBenchBundle(edited);

    expect(monitor.label).toContain(block.label);
    expect(bundle.scene.monitors.some((item) => item.id === monitor.id && item.solverRoute === "external-fdtd")).toBe(true);
    expect(bundle.fdtdBundle.manifest.monitors.some((item) => item.id === monitor.id)).toBe(true);
    expect(deleteOpticalBenchCustomMonitor(edited, monitor.id).customMonitors).toHaveLength(0);
  });

  it("surfaces edit-time blockers for overlap and outside-domain placement", () => {
    const scenario = {
      ...defaultOpticalBenchScenario(),
      elements: [
        { ...defaultOpticalBenchScenario().elements[0]!, zMm: 10, thicknessUm: 2000 },
        { ...defaultOpticalBenchScenario().elements[1]!, zMm: 10.5, thicknessUm: 2000 }
      ]
    };
    const outside = updateOpticalBenchElementProperties(scenario, scenario.elements[0]!.id, { xUm: 999 });
    const warnings = validateOpticalBenchEditing(outside);

    expect(warnings.map((warning) => warning.code)).toContain("opticalBench.element.overlap");
    expect(warnings.map((warning) => warning.code)).toContain("opticalBench.edit.elementOutsideDomain");
    expect(isOpticalBenchEditingBlocked(warnings)).toBe(true);
  });

  it("undoes and redoes position edits", () => {
    const scenario = defaultOpticalBenchScenario();
    const aperture = scenario.elements[0]!;
    const edited = updateOpticalBenchElementProperties(scenario, aperture.id, { zMm: 13 });
    const committed = commitOpticalBenchHistory(createOpticalBenchHistory(scenario), edited, "Move aperture");
    const undone = undoOpticalBenchHistory(committed);
    const redone = redoOpticalBenchHistory(undone);

    expect(undone.present.elements.find((item) => item.id === aperture.id)?.zMm).toBe(aperture.zMm);
    expect(redone.present.elements.find((item) => item.id === aperture.id)?.zMm).toBe(13);
  });
});
