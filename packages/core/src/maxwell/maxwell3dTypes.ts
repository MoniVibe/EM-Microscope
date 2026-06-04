import type { MaterialCatalogReference } from "./materialCatalog";

export type MaxwellVec2 = [number, number];
export type MaxwellVec3 = [number, number, number];

export type MaxwellScene3DVersion = "emmicro.maxwell.scene3d.v1";
export type MaxwellLengthUnit3D = "nm" | "um" | "mm" | "m";
export type MaxwellFieldComponent3D = "Ex" | "Ey" | "Ez" | "Hx" | "Hy" | "Hz";
export type MaxwellBoundarySide3D = "xmin" | "xmax" | "ymin" | "ymax" | "zmin" | "zmax";

export interface MaxwellScene3D {
  version: MaxwellScene3DVersion;
  id: string;
  label: string;
  units: MaxwellLengthUnit3D;
  backendId: "external-fdtd";
  domain: {
    size: MaxwellVec3;
    resolution?: {
      pixelsPerWavelength?: number;
      voxelSize?: MaxwellVec3;
    };
  };
  backgroundMaterialId: string;
  boundaries: MaxwellBoundary3D[];
  objects: MaxwellObject3D[];
  sources: MaxwellSource3D[];
  monitors: MaxwellMonitor3D[];
  receipts: {
    materials: MaterialCatalogReference[];
    materialCatalogHash?: string;
    sceneHash: string;
  };
  provenance: {
    label: "L6.0 3D Maxwell schema/export scaffold";
    limitations: string[];
  };
}

export type MaxwellObject3D =
  | {
      id: string;
      kind: "box";
      center: MaxwellVec3;
      size: MaxwellVec3;
      materialId: string;
    }
  | {
      id: string;
      kind: "sphere";
      center: MaxwellVec3;
      radius: number;
      materialId: string;
    };

export type MaxwellSource3D = {
  id: string;
  kind: "plane-wave";
  wavelengthNm: number;
  direction: MaxwellVec3;
  polarization: MaxwellVec3;
  amplitude: number;
  coherenceGroupId?: string;
};

export type MaxwellMonitor3D =
  | {
      id: string;
      kind: "field-volume";
      center: MaxwellVec3;
      size: MaxwellVec3;
      fields: MaxwellFieldComponent3D[];
    }
  | {
      id: string;
      kind: "flux-plane";
      center: MaxwellVec3;
      size: MaxwellVec2;
      normal: MaxwellVec3;
    };

export type MaxwellBoundary3D =
  | {
      kind: "pml";
      thickness: number;
      sides: MaxwellBoundarySide3D[];
    }
  | {
      kind: "periodic";
      axis: "x" | "y" | "z";
    }
  | {
      kind: "pec";
      sides: MaxwellBoundarySide3D[];
    };
