import { describe, expect, it } from "vitest";
import {
  addSimulationBuilderElement,
  beerLambertTransmission,
  createSimulationBuilderElement,
  defaultSimulationBuilderScenario,
  l80SimulationBuilderBoundary,
  orderedSimulationBuilderElements,
  runSimulationBuilderScenario,
  simulationBuilderScenarioJson,
  simulationBuilderValidationMetricsCsv,
  simulationBuilderValidationReportJson,
  simulationBuilderValidationReportMarkdown,
  validateSimulationBuilderScenario
} from "./simulationBuilder";

describe("simulation builder workflow", () => {
  it("renders ordered steps: grid, source, elements, target, compute, validate", () => {
    const result = runSimulationBuilderScenario(defaultSimulationBuilderScenario());

    expect(Object.keys(result.stepStatuses)).toEqual(["grid", "source", "elements", "target", "compute", "validate"]);
    expect(result.stepStatuses.compute).toBe("computed");
    expect(result.axis.map((node) => node.kind)).toContain("source");
    expect(result.axis.map((node) => node.kind)).toContain("target");
  });

  it("requires grid before compute", () => {
    const scenario = defaultSimulationBuilderScenario();
    const validation = validateSimulationBuilderScenario({ ...scenario, grid: null });

    expect(validation.valid).toBe(false);
    expect(validation.errors.join(" ")).toContain("grid must be defined before compute");
  });

  it("requires source before compute", () => {
    const scenario = defaultSimulationBuilderScenario();
    const validation = validateSimulationBuilderScenario({ ...scenario, source: null });

    expect(validation.valid).toBe(false);
    expect(validation.errors.join(" ")).toContain("source must be defined before compute");
  });

  it("orders elements by z position", () => {
    const elements = orderedSimulationBuilderElements([
      createSimulationBuilderElement("ideal-lens", 30),
      createSimulationBuilderElement("circular-aperture", 5),
      createSimulationBuilderElement("material-slab", 20)
    ]);

    expect(elements.map((element) => element.zMm)).toEqual([5, 20, 30]);
  });

  it("allows multiple apertures and lenses in the element list", () => {
    const scenario = defaultSimulationBuilderScenario();
    const expanded = addSimulationBuilderElement(
      addSimulationBuilderElement(scenario, createSimulationBuilderElement("circular-aperture", 15, "Second aperture")),
      createSimulationBuilderElement("ideal-lens", 18, "Ideal lens")
    );

    expect(expanded.elements.filter((element) => element.kind === "circular-aperture")).toHaveLength(2);
    expect(expanded.elements.some((element) => element.kind === "ideal-lens")).toBe(true);
  });

  it("shows executable/scaffold/not-implemented status per element", () => {
    const elements = [
      createSimulationBuilderElement("material-slab", 10),
      createSimulationBuilderElement("curved-material-lens", 20),
      createSimulationBuilderElement("finite-metal-aperture", 30)
    ];

    expect(elements.map((element) => element.status)).toEqual(["executable", "scaffold-only", "not-implemented"]);
  });

  it("exports scenario JSON with grid, source, elements, target, and validation settings", () => {
    const scenario = defaultSimulationBuilderScenario();
    const json = JSON.parse(simulationBuilderScenarioJson(scenario));

    expect(json.grid.pointsPerWavelength).toBe(10);
    expect(json.source.wavelengthNm).toBe(500);
    expect(json.elements.length).toBeGreaterThan(0);
    expect(json.target.kind).toBe("transparent-dielectric");
    expect(json.boundary.join(" ")).toContain("No arbitrary 3D material geometry");
  });
});

describe("surface interaction validation", () => {
  it("computes normal-incidence air-to-glass Fresnel reflectance near 4 percent", () => {
    const result = runSimulationBuilderScenario(defaultSimulationBuilderScenario());

    expect(result.validation.kind).toBe("transparent-dielectric");
    expect(result.validation.computed.reflectance).toBeCloseTo(0.04, 8);
    expect(result.validation.expected.reflectance).toBeCloseTo(0.04, 12);
  });

  it("reports R + T + A near 1 for lossless transparent interface", () => {
    const result = runSimulationBuilderScenario(defaultSimulationBuilderScenario());

    expect(result.validation.energyBalance).toBeCloseTo(1, 12);
    expect(result.validation.computed.absorbance).toBeCloseTo(0, 12);
  });

  it("reports ideal mirror R near 1 and T near 0", () => {
    const scenario = {
      ...defaultSimulationBuilderScenario(),
      target: {
        ...defaultSimulationBuilderScenario().target,
        kind: "mirror" as const,
        label: "Ideal mirror target"
      }
    };
    const result = runSimulationBuilderScenario(scenario);

    expect(result.validation.computed.reflectance).toBeCloseTo(1, 12);
    expect(result.validation.computed.transmittance).toBeCloseTo(0, 12);
    expect(result.validation.status).toBe("pass");
  });

  it("reports absorbing slab transmission decreases with thickness", () => {
    const thin = beerLambertTransmission(5000, 10e-6);
    const thick = beerLambertTransmission(5000, 100e-6);

    expect(thick).toBeLessThan(thin);
  });

  it("compares absorbing slab transmission against Beer-Lambert expectation", () => {
    const base = defaultSimulationBuilderScenario();
    const scenario = {
      ...base,
      target: {
        ...base.target,
        kind: "absorbing-slab" as const,
        label: "Beer-Lambert absorbing slab",
        absorptionCoefficientPerM: 5000,
        thicknessUm: 100
      }
    };
    const result = runSimulationBuilderScenario(scenario);

    expect(result.validation.computed.transmittance).toBeCloseTo(Math.exp(-0.5), 12);
    expect(result.validation.residuals.transmittance).toBeCloseTo(0, 12);
    expect(result.validation.status).toBe("pass");
  });

  it("exports material-interaction validation report", () => {
    const result = runSimulationBuilderScenario(defaultSimulationBuilderScenario());
    const json = JSON.parse(simulationBuilderValidationReportJson(result));
    const markdown = simulationBuilderValidationReportMarkdown(result);
    const csv = simulationBuilderValidationMetricsCsv(result);

    expect(json.validation.expected.reflectance).toBeCloseTo(0.04, 12);
    expect(markdown).toContain("Surface Validation");
    expect(markdown).toContain("No FDTD/FEM/BEM/RCWA execution");
    expect(csv).toContain("reflectance");
  });
});

describe("workflow clarity boundaries", () => {
  it("states arbitrary 3D Maxwell material geometry is not executable in-app", () => {
    expect(l80SimulationBuilderBoundary.join(" ")).toContain("No arbitrary 3D material geometry is executable in-app");
  });

  it("states L8.6 process variation is diagnostic and not certified tolerancing or auto redesign", () => {
    const boundary = l80SimulationBuilderBoundary.join(" ");
    const result = runSimulationBuilderScenario(defaultSimulationBuilderScenario());

    expect(boundary).toContain("L8.6 process/tolerance variation");
    expect(boundary).toContain("not certified tolerancing or auto redesign");
    expect(result.capabilitySummary.find((capability) => capability.id === "process-tolerance-variation-runner")?.status).toBe("executable");
    expect(result.capabilitySummary.find((capability) => capability.id === "external-fdtd-variation-sweep")?.status).toBe("executable");
    expect(result.capabilitySummary.find((capability) => capability.id === "certified-optical-tolerancing")?.status).toBe("not-implemented");
    expect(result.capabilitySummary.find((capability) => capability.id === "auto-redesign-inverse-optimization")?.status).toBe("not-implemented");
  });

  it("states curved material lens solving is scaffold-only if shown", () => {
    const element = createSimulationBuilderElement("curved-material-lens", 35);

    expect(element.status).toBe("scaffold-only");
    expect(element.validation).toContain("real curved material solve is not executable");
  });

  it("states ExternalFdtdBackend remains scaffold-only", () => {
    const result = runSimulationBuilderScenario(defaultSimulationBuilderScenario());

    expect(result.capabilitySummary.find((capability) => capability.id === "arbitrary-3d-material-geometry")?.evidence).toContain("ExternalFdtdBackend remains scaffold");
  });

  it("does not claim FDTD/FEM/BEM/RCWA execution", () => {
    const result = runSimulationBuilderScenario(defaultSimulationBuilderScenario());

    expect(result.limitations.join(" ")).toContain("No FDTD/FEM/BEM/RCWA execution");
    expect(result.limitations.join(" ")).not.toMatch(/FDTD execution is available|FEM execution is available|RCWA execution is available/i);
  });

  it("does not claim digital twin or manufacturing certification", () => {
    const result = runSimulationBuilderScenario(defaultSimulationBuilderScenario());

    expect(result.limitations.join(" ")).toContain("No real curved material lens solve");
    expect(result.limitations.join(" ")).toContain("digital twin");
    expect(result.limitations.join(" ")).toContain("manufacturing certification");
    expect(result.limitations.join(" ")).not.toMatch(/digital twin calibration available|manufacturing certification available/i);
  });
});
