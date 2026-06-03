import type { DetectorHistogram, DetectorHit } from "../optics/detectors";
import type { RayPath } from "../optics/ray";
import type { NAReadout } from "../readouts/numericalAperture";
import type { SpotReadout } from "../readouts/spotSize";
import type { ThinLensReadout } from "../readouts/thinLens";
import type { LensmakerReadout } from "../optics/assemblies/thickLens2d";
import type { Scene } from "../scene/schema";

export type SolverId =
  | "geometric.l0"
  | "geometric.l1.2d"
  | "geometric.surfaces.l1"
  | "scalar.angularSpectrum.l2"
  | "hybrid.microscope.l3"
  | "em.fdtdIsland.l4";

export type SolverOutput = "rays" | "detectorHits" | "detectorHistogram" | "readouts" | "field1D" | "field2D";

export type SolverRequest = {
  solverId: SolverId;
  outputs: SolverOutput[];
  maxComputeMs?: number;
};

export type SolverWarning = {
  code: string;
  message: string;
  elementId?: string;
};

export type EnergyReadout = {
  sourcePowerW: number;
  survivingPowerW: number;
  clippedPowerW: number;
  detectorPowerW: number;
  provenance: "L0 ray power accounting" | "L1 ray power accounting";
};

export type AberrationReadout = {
  elementId: string;
  paraxialFocusXM: number | null;
  marginalFocusXM: number | null;
  longitudinalSphericalAberrationM: number | null;
  tirCount: number;
  reflectedCount: number;
  clippedCount: number;
  provenance: "simulated.geometric.l1.2d";
};

export type SolverResult = {
  solverId: SolverId;
  sceneHash: string;
  seed: number;
  solverVersion: string;
  assumptions: string[];
  warnings: SolverWarning[];
  rays?: RayPath[];
  detectorHits?: DetectorHit[];
  detectorHistograms?: DetectorHistogram[];
  readouts: {
    thinLens?: ThinLensReadout[];
    numericalAperture?: NAReadout[];
    spot?: SpotReadout[];
    energy?: EnergyReadout;
    lensmaker?: LensmakerReadout[];
    aberration?: AberrationReadout[];
  };
};

export interface Solver {
  id: SolverId;
  label: string;
  level: "L0" | "L1" | "L2" | "L3" | "L4";
  capabilities: string[];
  validateScene(scene: Scene): SolverWarning[];
  run(scene: Scene, request?: Partial<SolverRequest>): SolverResult;
}
