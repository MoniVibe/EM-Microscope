import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { MaxwellFieldComponent3D, MaxwellVec3 } from "./maxwell3dTypes";
import type { MaxwellSolverReceipt } from "./solverBackend";

export type FieldDatasetFormat = "openpmd-json" | "hdf5" | "adios2" | "json";

export interface FieldDatasetManifest {
  schema: "emmicro.fieldDatasetManifest.v1";
  id: string;
  sceneId: string;
  sceneHash: string;
  backendId: "external-fdtd";
  generatedBy: "external-export" | "external-solver";
  format: FieldDatasetFormat;
  coordinateSystem: "cartesian";
  units: {
    length: "nm" | "um" | "mm" | "m";
    electricField: "arbitrary" | "V/m";
    magneticField: "arbitrary" | "A/m";
  };
  datasets: Array<{
    id: string;
    monitorId: string;
    kind: "field-volume" | "flux-plane";
    fields: MaxwellFieldComponent3D[];
    grid: {
      origin: MaxwellVec3;
      spacing: MaxwellVec3;
      shape: [number, number, number];
    };
    pathHint: string;
  }>;
  solver: MaxwellSolverReceipt;
  warnings: string[];
  resultHash: string;
}

export interface FieldVolume3D {
  monitorId: string;
  center: MaxwellVec3;
  size: MaxwellVec3;
  fields: MaxwellFieldComponent3D[];
  datasetManifest?: FieldDatasetManifest;
}

export interface FluxMonitorResult {
  monitorId: string;
  normal: MaxwellVec3;
  reflectedPower?: number;
  transmittedPower?: number;
  absorbedPower?: number;
  datasetManifest?: FieldDatasetManifest;
}

export function createFieldDatasetManifest(
  input: Omit<FieldDatasetManifest, "schema" | "coordinateSystem" | "resultHash">
): FieldDatasetManifest {
  const body = {
    schema: "emmicro.fieldDatasetManifest.v1" as const,
    coordinateSystem: "cartesian" as const,
    ...input
  };
  const resultHash = fnv1a64(
    stableStringify({
      ...body,
      solver: {
        id: body.solver.id,
        method: body.solver.method,
        solverVersion: body.solver.solverVersion,
        capabilities: body.solver.capabilities
      }
    })
  );

  return {
    ...body,
    resultHash
  };
}
