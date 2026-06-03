import type { TestTarget2D } from "../scene/schema";
import type { FieldOutput2D } from "../solvers/Solver";
import { testTargetCyclesPerM, testTargetFeaturePeriodM } from "../wave/testTargets2d";
import { computeSlantedEdgeSfr2D } from "./slantedEdgeSfr";
import { centralColumnIntensity, centralRowIntensity, fullFieldContrast, michelsonContrast } from "./targetContrast2d";

export type ResolutionTargetMetrics2D = {
  targetId: string;
  targetLabel: string;
  targetKind: TestTarget2D["kind"];
  targetFeaturePeriodM: number | null;
  targetCyclesPerM: number | null;
  contrastMichelson: number | null;
  sfr50CyclesPerM: number | null;
  resolved: boolean | null;
  provenanceLabel: "L3.3 scalar target contrast/SFR approximation";
  warnings: string[];
};

const resolvedContrastThreshold = 0.1;

export function computeResolutionTargetMetrics2D(field: FieldOutput2D, target: TestTarget2D): ResolutionTargetMetrics2D {
  const targetFeaturePeriodM = testTargetFeaturePeriodM(target);
  const targetCyclesPerM = testTargetCyclesPerM(target);
  const warnings: string[] = [];
  let contrastMichelson: number | null;
  let sfr50CyclesPerM: number | null = null;

  if (target.kind === "slantedEdge") {
    const sfr = computeSlantedEdgeSfr2D(field, target);
    contrastMichelson = sfr.edgeContrast;
    sfr50CyclesPerM = sfr.sfr50CyclesPerM;
    warnings.push(...sfr.warnings);
  } else if (target.kind === "linePairs") {
    const useColumn = Math.abs(Math.sin(target.orientationRad)) > Math.abs(Math.cos(target.orientationRad));
    contrastMichelson = michelsonContrast(useColumn ? centralColumnIntensity(field) : centralRowIntensity(field));
  } else if (target.kind === "usafStyleBars") {
    contrastMichelson =
      target.orientation === "horizontal"
        ? michelsonContrast(centralColumnIntensity(field))
        : target.orientation === "vertical"
          ? michelsonContrast(centralRowIntensity(field))
          : fullFieldContrast(field);
  } else {
    contrastMichelson = fullFieldContrast(field);
  }

  const resolved = contrastMichelson === null ? null : contrastMichelson >= resolvedContrastThreshold;
  if (contrastMichelson !== null && contrastMichelson < resolvedContrastThreshold) {
    warnings.push(`Target contrast is below the ${resolvedContrastThreshold.toFixed(2)} scalar workbench threshold.`);
  }

  return {
    targetId: target.id,
    targetLabel: target.label,
    targetKind: target.kind,
    targetFeaturePeriodM,
    targetCyclesPerM,
    contrastMichelson,
    sfr50CyclesPerM,
    resolved,
    provenanceLabel: "L3.3 scalar target contrast/SFR approximation",
    warnings
  };
}
