import type { Solver } from "./Solver";

export const scalarL2PlaceholderSolver: Solver = {
  id: "scalar.angularSpectrum.l2",
  label: "L2 Scalar Wave Optics",
  level: "L2",
  capabilities: [],
  validateScene() {
    return [
      {
        code: "solver.unavailable",
        message: "L2 scalar diffraction is intentionally unavailable in v0; use L0 rays plus analytic Airy estimate."
      }
    ];
  },
  run() {
    throw new Error("L2 scalar diffraction is not implemented in v0.");
  }
};
