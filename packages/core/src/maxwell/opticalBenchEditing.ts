import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import { createOpticalBenchScene, opticalBenchWarnings } from "./multiElementBench";
import {
  orderedSimulationBuilderCustomMonitors,
  orderedSimulationBuilderElements,
  type SimulationBuilderCustomMonitor,
  type SimulationBuilderElement,
  type SimulationBuilderScenario
} from "./simulationBuilder";

export type OpticalBenchSnapSettings = {
  enabled: boolean;
  stepMm: number;
};

export type OpticalBenchMoveDirection = "earlier" | "later";
export type OpticalBenchMonitorPlacement = "before" | "after";

export type OpticalBenchHistoryEntry = {
  label: string;
  scenario: SimulationBuilderScenario;
};

export type OpticalBenchHistoryState = {
  past: OpticalBenchHistoryEntry[];
  present: SimulationBuilderScenario;
  future: OpticalBenchHistoryEntry[];
};

export function updateOpticalBenchElementProperties(
  scenario: SimulationBuilderScenario,
  elementId: string,
  patch: Partial<SimulationBuilderElement>
): SimulationBuilderScenario {
  return {
    ...scenario,
    elements: orderedSimulationBuilderElements(scenario.elements.map((element) => (element.id === elementId ? { ...element, ...patch, id: element.id, kind: element.kind } : element)))
  };
}

export function nudgeOpticalBenchElement(
  scenario: SimulationBuilderScenario,
  elementId: string,
  delta: { zMm?: number; xUm?: number },
  snap: OpticalBenchSnapSettings = { enabled: false, stepMm: 0.5 }
): SimulationBuilderScenario {
  const element = scenario.elements.find((item) => item.id === elementId);
  if (!element) return scenario;
  const nextZ = snapOpticalBenchZ((element.zMm ?? 0) + (delta.zMm ?? 0), snap);
  const nextX = (element.xUm ?? 0) + (delta.xUm ?? 0);
  return updateOpticalBenchElementProperties(scenario, elementId, {
    zMm: clamp(nextZ, scenario.grid.zStartMm, scenario.grid.zEndMm),
    xUm: Number(nextX.toPrecision(12))
  });
}

export function moveOpticalBenchElementInOrder(
  scenario: SimulationBuilderScenario,
  elementId: string,
  direction: OpticalBenchMoveDirection
): SimulationBuilderScenario {
  const ordered = orderedSimulationBuilderElements(scenario.elements);
  const index = ordered.findIndex((element) => element.id === elementId);
  const swapIndex = direction === "earlier" ? index - 1 : index + 1;
  if (index < 0 || swapIndex < 0 || swapIndex >= ordered.length) return scenario;
  const current = ordered[index]!;
  const other = ordered[swapIndex]!;
  return {
    ...scenario,
    elements: orderedSimulationBuilderElements(
      scenario.elements.map((element) => {
        if (element.id === current.id) return { ...element, zMm: other.zMm };
        if (element.id === other.id) return { ...element, zMm: current.zMm };
        return element;
      })
    )
  };
}

export function addOpticalBenchCustomMonitor(
  scenario: SimulationBuilderScenario,
  elementId: string,
  placement: OpticalBenchMonitorPlacement
): SimulationBuilderScenario {
  const element = scenario.elements.find((item) => item.id === elementId);
  if (!element) return scenario;
  const width = Math.max(1, element.widthUm ?? element.apertureDiameterUm ?? element.apertureWidthUm ?? scenario.grid.domainWidthUm);
  const height = Math.max(1, element.heightUm ?? element.apertureDiameterUm ?? element.apertureHeightUm ?? scenario.grid.domainHeightUm);
  const offsetMm = Math.max(0.25, (element.thicknessUm ?? 1) / 1000, scenario.source.wavelengthNm / 1000 / 1000);
  const zMm = clamp(element.zMm + (placement === "before" ? -offsetMm : offsetMm), scenario.grid.zStartMm, scenario.grid.zEndMm);
  const labelPrefix = placement === "before" ? "Before" : "After";
  const monitor: SimulationBuilderCustomMonitor = {
    id: uniqueMonitorId(`${element.id}-${placement}-monitor`, scenario.customMonitors ?? []),
    label: `${labelPrefix} ${element.label} monitor`,
    kind: finiteElementKind(element) ? "flux" : "field",
    zMm: Number(zMm.toPrecision(12)),
    xUm: element.xUm ?? 0,
    yUm: element.yUm ?? 0,
    widthUm: width,
    heightUm: height,
    sourceElementId: element.id,
    solverRoute: finiteElementKind(element) ? "external-fdtd" : "scalar-chain"
  };
  return {
    ...scenario,
    customMonitors: orderedSimulationBuilderCustomMonitors([...(scenario.customMonitors ?? []), monitor])
  };
}

export function updateOpticalBenchCustomMonitor(
  scenario: SimulationBuilderScenario,
  monitorId: string,
  patch: Partial<SimulationBuilderCustomMonitor>
): SimulationBuilderScenario {
  return {
    ...scenario,
    customMonitors: orderedSimulationBuilderCustomMonitors(
      (scenario.customMonitors ?? []).map((monitor) => (monitor.id === monitorId ? { ...monitor, ...patch, id: monitor.id } : monitor))
    )
  };
}

export function deleteOpticalBenchCustomMonitor(scenario: SimulationBuilderScenario, monitorId: string): SimulationBuilderScenario {
  return {
    ...scenario,
    customMonitors: (scenario.customMonitors ?? []).filter((monitor) => monitor.id !== monitorId)
  };
}

export function snapOpticalBenchZ(valueMm: number, snap: OpticalBenchSnapSettings): number {
  if (!snap.enabled || !Number.isFinite(snap.stepMm) || snap.stepMm <= 0) return Number(valueMm.toPrecision(12));
  return Number((Math.round(valueMm / snap.stepMm) * snap.stepMm).toPrecision(12));
}

export function validateOpticalBenchEditing(scenario: SimulationBuilderScenario): SolverWarning[] {
  const scene = createOpticalBenchScene(scenario);
  const warnings: SolverWarning[] = [...opticalBenchWarnings(scene)];
  for (const element of orderedSimulationBuilderElements(scenario.elements)) {
    const halfWidth = Math.max(0, element.widthUm ?? element.apertureDiameterUm ?? element.apertureWidthUm ?? 0) / 2;
    const xUm = element.xUm ?? 0;
    if (element.zMm < scenario.grid.zStartMm || element.zMm > scenario.grid.zEndMm || Math.abs(xUm) + halfWidth > scenario.grid.domainWidthUm / 2) {
      warnings.push({
        code: "opticalBench.edit.elementOutsideDomain",
        message: `${element.label} is outside the simulation domain; move it inside the x/z bounds before compute or export.`,
        elementId: element.id
      });
    }
    const apertureWidthUm = element.apertureDiameterUm ?? Math.min(element.apertureWidthUm ?? Number.POSITIVE_INFINITY, element.apertureHeightUm ?? Number.POSITIVE_INFINITY);
    const minCells = apertureWidthUm / gridSpacingUm(scenario);
    if (Number.isFinite(minCells) && minCells < 6) {
      warnings.push({
        code: "opticalBench.edit.underResolvedAperture",
        message: `${element.label} aperture is only ${minCells.toPrecision(3)} cells across; increase aperture size or grid density before trusting edge fields.`,
        elementId: element.id
      });
    }
    const thicknessCells = (element.thicknessUm ?? Number.POSITIVE_INFINITY) / gridSpacingUm(scenario);
    if (finiteElementKind(element) && Number.isFinite(thicknessCells) && thicknessCells < 6) {
      warnings.push({
        code: "opticalBench.edit.underResolvedThickness",
        message: `${element.label} thickness is only ${thicknessCells.toPrecision(3)} cells; external FDTD geometry needs convergence before interpretation.`,
        elementId: element.id
      });
    }
  }
  for (const monitor of orderedSimulationBuilderCustomMonitors(scenario.customMonitors ?? [])) {
    if (monitor.zMm < scenario.grid.zStartMm || monitor.zMm > scenario.grid.zEndMm || Math.abs(monitor.xUm) + monitor.widthUm / 2 > scenario.grid.domainWidthUm / 2) {
      warnings.push({
        code: "opticalBench.edit.monitorOutsideDomain",
        message: `${monitor.label} is outside the simulation domain.`,
        elementId: monitor.sourceElementId
      });
    }
  }
  return uniqueWarnings(warnings);
}

export function isOpticalBenchEditingBlocked(warnings: SolverWarning[]): boolean {
  return warnings.some((warning) =>
    warning.code === "opticalBench.element.overlap" ||
    warning.code === "opticalBench.element.unsupported" ||
    warning.code === "opticalBench.edit.elementOutsideDomain" ||
    warning.code === "opticalBench.edit.monitorOutsideDomain" ||
    warning.code === "opticalBench.monitor.insideMaterial"
  );
}

export function createOpticalBenchHistory(scenario: SimulationBuilderScenario): OpticalBenchHistoryState {
  return { past: [], present: cloneScenario(scenario), future: [] };
}

export function commitOpticalBenchHistory(history: OpticalBenchHistoryState, scenario: SimulationBuilderScenario, label: string): OpticalBenchHistoryState {
  if (scenarioFingerprint(history.present) === scenarioFingerprint(scenario)) return history;
  return {
    past: [...history.past.slice(-31), { label, scenario: cloneScenario(history.present) }],
    present: cloneScenario(scenario),
    future: []
  };
}

export function undoOpticalBenchHistory(history: OpticalBenchHistoryState): OpticalBenchHistoryState {
  const previous = history.past[history.past.length - 1];
  if (!previous) return history;
  return {
    past: history.past.slice(0, -1),
    present: cloneScenario(previous.scenario),
    future: [{ label: "redo", scenario: cloneScenario(history.present) }, ...history.future]
  };
}

export function redoOpticalBenchHistory(history: OpticalBenchHistoryState): OpticalBenchHistoryState {
  const next = history.future[0];
  if (!next) return history;
  return {
    past: [...history.past, { label: "undo", scenario: cloneScenario(history.present) }],
    present: cloneScenario(next.scenario),
    future: history.future.slice(1)
  };
}

function uniqueMonitorId(baseId: string, monitors: SimulationBuilderCustomMonitor[]): string {
  const ids = new Set(monitors.map((monitor) => monitor.id));
  if (!ids.has(baseId)) return baseId;
  let index = 2;
  while (ids.has(`${baseId}-${index}`)) index += 1;
  return `${baseId}-${index}`;
}

function finiteElementKind(element: SimulationBuilderElement): boolean {
  return (
    element.kind === "finite-transparent-block" ||
    element.kind === "finite-absorbing-block" ||
    element.kind === "finite-reflective-plate" ||
    element.kind === "finite-aperture-blocker" ||
    element.kind === "tilted-interface-wedge"
  );
}

function gridSpacingUm(scenario: SimulationBuilderScenario): number {
  return Math.max(1e-9, scenario.source.wavelengthNm / Math.max(1, scenario.grid.pointsPerWavelength) / 1000);
}

function scenarioFingerprint(scenario: SimulationBuilderScenario): string {
  return fnv1a64(stableStringify(scenario));
}

function cloneScenario(scenario: SimulationBuilderScenario): SimulationBuilderScenario {
  return JSON.parse(JSON.stringify(scenario)) as SimulationBuilderScenario;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function uniqueWarnings(warnings: SolverWarning[]): SolverWarning[] {
  const seen = new Set<string>();
  const output: SolverWarning[] = [];
  for (const warning of warnings) {
    const key = `${warning.code}:${warning.elementId ?? ""}:${warning.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(warning);
  }
  return output;
}
