import { dot, normalize, scale, add, negate, type Vec2 } from "../math/vec2";
import { reflectDirection } from "./reflection";

export type SnellResult =
  | {
      kind: "refracted";
      direction: Vec2;
      normal: Vec2;
      thetaIncidentRad: number;
      thetaTransmittedRad: number;
    }
  | {
      kind: "tir";
      direction: Vec2;
      normal: Vec2;
      thetaIncidentRad: number;
      criticalAngleRad: number;
    };

export function refractDirection(incidentInput: Vec2, normalInput: Vec2, n1: number, n2: number): SnellResult {
  const incident = normalize(incidentInput);
  let normal = normalize(normalInput);
  if (dot(incident, normal) > 0) {
    normal = negate(normal);
  }

  const eta = n1 / n2;
  const cosI = Math.min(1, Math.max(-1, -dot(normal, incident)));
  const sin2T = eta * eta * (1 - cosI * cosI);
  const thetaIncidentRad = Math.acos(cosI);

  if (sin2T > 1) {
    return {
      kind: "tir",
      direction: reflectDirection(incident, normal),
      normal,
      thetaIncidentRad,
      criticalAngleRad: n1 > n2 ? Math.asin(n2 / n1) : Math.PI / 2
    };
  }

  const transmitted = normalize(add(scale(incident, eta), scale(normal, eta * cosI - Math.sqrt(1 - sin2T))));
  return {
    kind: "refracted",
    direction: transmitted,
    normal,
    thetaIncidentRad,
    thetaTransmittedRad: Math.asin(Math.sqrt(Math.max(0, sin2T)))
  };
}
