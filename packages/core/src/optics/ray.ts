export type Ray = {
  id: string;
  sourceId: string;
  x: number;
  y: number;
  slope: number;
  wavelengthM: number;
  powerW: number;
  alive: boolean;
  clippedBy?: string;
};

export type RaySegment = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
};

export type RayPath = {
  id: string;
  sourceId: string;
  wavelengthM: number;
  powerW: number;
  alive: boolean;
  clippedBy?: string;
  finalX: number;
  finalY: number;
  finalSlope: number;
  segments: RaySegment[];
};
