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
  | "scalar.angularSpectrum.l2.1d"
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

export type PhysicsLevel = "L0" | "L1" | "L2" | "L3" | "L4";

export type PhysicsProvenance =
  | {
      kind: "simulated";
      level: PhysicsLevel;
      solverId: SolverId;
      model:
        | "geometric-ray-2d-thin-lens"
        | "geometric-ray-2d-surface"
        | "scalar-wave-1d-angular-spectrum"
        | "scalar-wave-2d-angular-spectrum"
        | "hybrid-ray-wave"
        | "em-fdtd-bounded";
      dimensionality: "1d" | "2d" | "3d";
      approximation: string[];
    }
  | {
      kind: "analytic";
      model: "paraxial" | "lensmaker" | "fraunhofer-reference" | "airy-estimate";
      dimensionality: "1d" | "2d" | "3d" | "n/a";
    }
  | {
      kind: "estimated";
      model: "diffraction-limit" | "sampling-risk" | "spot-summary";
      dimensionality: "n/a" | "1d" | "2d" | "3d";
    }
  | {
      kind: "visualizationOnly";
      model: "3d-view-of-2d-solver" | "rendered-element-mesh";
      dimensionality: "3d";
    }
  | {
      kind: "external";
      level: "L4";
      solverName: "meep" | "other";
      importFormat: "hdf5" | "json" | "csv";
      validationStatus: "unvalidated" | "benchmark-checked";
    };

export type FieldOutput1D = {
  id: string;
  type: "fieldProfile1D";
  planeId: string;
  gridId: string;
  xM: number;
  yM: Float64Array;
  real: Float64Array;
  imag: Float64Array;
  intensity: Float64Array;
  phaseRad: Float64Array;
  units: {
    y: "m";
    intensity: "relative";
    phase: "rad";
  };
  provenance: PhysicsProvenance;
};

export type EnergyLedger = {
  inputEnergy: number;
  afterMaskEnergy: number;
  outputEnergy: number;
  clippedEnergy: number;
  relativeOutputDrift: number;
  units: "relative-field-energy";
  provenance: PhysicsProvenance;
};

export type SolverResult = {
  solverId: SolverId;
  sceneHash: string;
  resultHash?: string;
  seed: number;
  solverVersion: string;
  computedAtIso?: string;
  assumptions: string[];
  warnings: SolverWarning[];
  rays?: RayPath[];
  detectorHits?: DetectorHit[];
  detectorHistograms?: DetectorHistogram[];
  fieldOutputs?: FieldOutput1D[];
  energyLedger?: EnergyLedger;
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
