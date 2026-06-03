import { describe, expect, it } from "vitest";
import { reflectDirection } from "./reflection";
import { refractDirection } from "./snell";

function incidentAtDegrees(thetaDeg: number) {
  const theta = (thetaDeg * Math.PI) / 180;
  return { x: Math.cos(theta), y: Math.sin(theta) };
}

describe("Snell and reflection kernels", () => {
  it("keeps normal-incidence direction unchanged", () => {
    const result = refractDirection({ x: 1, y: 0 }, { x: -1, y: 0 }, 1, 1.5);

    expect(result.kind).toBe("refracted");
    if (result.kind === "refracted") {
      expect(result.direction.x).toBeCloseTo(1, 12);
      expect(result.direction.y).toBeCloseTo(0, 12);
    }
  });

  it("matches air to glass at 30 degrees", () => {
    const result = refractDirection(incidentAtDegrees(30), { x: -1, y: 0 }, 1, 1.5);

    expect(result.kind).toBe("refracted");
    if (result.kind === "refracted") {
      expect((result.thetaTransmittedRad * 180) / Math.PI).toBeCloseTo(19.471220634, 9);
    }
  });

  it("matches glass to air at 30 degrees", () => {
    const result = refractDirection(incidentAtDegrees(30), { x: -1, y: 0 }, 1.5, 1);

    expect(result.kind).toBe("refracted");
    if (result.kind === "refracted") {
      expect((result.thetaTransmittedRad * 180) / Math.PI).toBeCloseTo(48.59037789, 8);
    }
  });

  it("detects total internal reflection above the critical angle", () => {
    const result = refractDirection(incidentAtDegrees(45), { x: -1, y: 0 }, 1.5, 1);

    expect(result.kind).toBe("tir");
    if (result.kind === "tir") {
      expect((result.criticalAngleRad * 180) / Math.PI).toBeCloseTo(41.8103149, 8);
    }
  });

  it("reflects with equal incidence and reflection angle", () => {
    const incident = incidentAtDegrees(20);
    const reflected = reflectDirection(incident, { x: -1, y: 0 });

    expect(reflected.x).toBeCloseTo(-incident.x, 12);
    expect(reflected.y).toBeCloseTo(incident.y, 12);
  });
});
