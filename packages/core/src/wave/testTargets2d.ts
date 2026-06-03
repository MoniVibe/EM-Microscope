import type { FieldGrid2D, SamplePlane2D, SampleTransmission2D, TestTarget2D } from "../scene/schema";

export function samplePlaneFromTestTarget2D(
  target: TestTarget2D,
  options: {
    xM: number;
    gridId: string;
    id?: string;
  }
): SamplePlane2D {
  return {
    id: options.id ?? testTargetSamplePlaneId(target),
    type: "samplePlane2D",
    label: target.label,
    xM: options.xM,
    gridId: options.gridId,
    transmission: transmissionFromTestTarget2D(target)
  };
}

export function transmissionFromTestTarget2D(target: TestTarget2D): SampleTransmission2D {
  if (target.kind === "linePairs") {
    return {
      kind: "barTarget2D",
      periodM: target.periodM,
      dutyCycle: target.dutyCycle,
      bars: 129,
      contrast: target.contrast,
      orientationRad: target.orientationRad,
      centerUM: 0,
      centerVM: 0
    };
  }
  if (target.kind === "usafStyleBars") {
    const periodM = usaf1951PeriodM(target.group, target.element);
    if (target.orientation === "both") {
      return {
        kind: "checkerboard",
        periodM,
        contrast: target.contrast,
        centerUM: 0,
        centerVM: 0
      };
    }
    return {
      kind: "barTarget2D",
      periodM,
      dutyCycle: 0.5,
      bars: 81,
      contrast: target.contrast,
      orientationRad: target.orientation === "vertical" ? 0 : Math.PI / 2,
      centerUM: 0,
      centerVM: 0
    };
  }
  if (target.kind === "slantedEdge") {
    return {
      kind: "slantedEdge2D",
      edgeAngleRad: target.edgeAngleRad,
      contrast: target.contrast,
      centerUM: 0,
      centerVM: 0
    };
  }
  if (target.kind === "siemensStarLike") {
    return {
      kind: "siemensStarLike2D",
      spokeCount: target.spokeCount,
      innerRadiusM: target.innerRadiusM,
      outerRadiusM: target.outerRadiusM,
      contrast: target.contrast,
      centerUM: 0,
      centerVM: 0
    };
  }
  return {
    kind: "checkerboard",
    periodM: target.periodM,
    contrast: target.contrast,
    centerUM: 0,
    centerVM: 0
  };
}

export function testTargetFeaturePeriodM(target: TestTarget2D): number | null {
  if (target.kind === "linePairs" || target.kind === "checkerboard") return target.periodM;
  if (target.kind === "usafStyleBars") return usaf1951PeriodM(target.group, target.element);
  if (target.kind === "siemensStarLike") {
    const referenceRadiusM = Math.max(target.innerRadiusM, target.outerRadiusM * 0.25);
    return (Math.PI * 2 * referenceRadiusM) / target.spokeCount;
  }
  return null;
}

export function testTargetCyclesPerM(target: TestTarget2D): number | null {
  const periodM = testTargetFeaturePeriodM(target);
  return periodM ? 1 / periodM : null;
}

export function testTargetSamplePlaneId(target: TestTarget2D): string {
  return `l33-target-${target.id}`;
}

export function usaf1951LinePairsPerMm(group: number, element: number): number {
  return 2 ** (group + (element - 1) / 6);
}

export function usaf1951PeriodM(group: number, element: number): number {
  return 1 / (usaf1951LinePairsPerMm(group, element) * 1000);
}

export function testTargetCoverageFraction(target: TestTarget2D, grid: FieldGrid2D): number | null {
  if (target.kind !== "siemensStarLike") return null;
  const gridRadiusM = Math.min(grid.uMaxM - grid.uMinM, grid.vMaxM - grid.vMinM) / 2;
  return gridRadiusM > 0 ? Math.min(1, target.outerRadiusM / gridRadiusM) : null;
}
