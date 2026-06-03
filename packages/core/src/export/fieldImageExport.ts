import type { FieldOutput2D, SolverResult } from "../solvers/Solver";
import { pixelCoordinateM } from "../wave/imageMetrics2d";

export function fieldImageToCsv(result: SolverResult, field: FieldOutput2D): string {
  const provenance = field.provenance.kind === "simulated" ? `${field.provenance.level}:${field.provenance.model}` : field.provenance.kind;
  const metadata = [
    `# solverId,${result.solverId}`,
    `# solverVersion,${result.solverVersion}`,
    `# sceneHash,${result.sceneHash}`,
    `# resultHash,${result.resultHash ?? ""}`,
    `# fieldId,${field.id}`,
    `# planeId,${field.planeId}`,
    `# width,${field.width}`,
    `# height,${field.height}`,
    `# uUnit,${field.units.u}`,
    `# vUnit,${field.units.v}`,
    `# intensityUnit,${field.units.intensity}`,
    `# cacheKey,${result.cacheKey ?? ""}`,
    `# computeMs,${result.performanceStats?.computeMs ?? ""}`,
    `# workerUsed,${result.performanceStats?.workerUsed ?? ""}`,
    `# cacheHit,${result.performanceStats?.cacheHit ?? result.cacheHit ?? ""}`,
    `# estimatedBytes,${result.performanceStats?.estimatedBytes ?? ""}`,
    `# provenance,${provenance}`
  ];
  const header = "uM,vM,intensity,phaseRad,real,imag";
  const rows: string[] = [];
  for (let vIndex = 0; vIndex < field.height; vIndex += 1) {
    for (let uIndex = 0; uIndex < field.width; uIndex += 1) {
      const index = vIndex * field.width + uIndex;
      const { uM, vM } = pixelCoordinateM(field, uIndex, vIndex);
      rows.push([uM, vM, field.intensity[index], field.phaseRad?.[index] ?? "", field.real?.[index] ?? "", field.imag?.[index] ?? ""].join(","));
    }
  }
  return [...metadata, header, ...rows].join("\n");
}

export function fieldImageToJson(result: SolverResult, field: FieldOutput2D): string {
  return JSON.stringify(
    {
      solverId: result.solverId,
      solverVersion: result.solverVersion,
      sceneHash: result.sceneHash,
      resultHash: result.resultHash,
      field: {
        id: field.id,
        type: field.type,
        planeId: field.planeId,
        gridId: field.gridId,
        xM: field.xM,
        width: field.width,
        height: field.height,
        uMinM: field.uMinM,
        uMaxM: field.uMaxM,
        vMinM: field.vMinM,
        vMaxM: field.vMaxM,
        real: field.real ? Array.from(field.real) : undefined,
        imag: field.imag ? Array.from(field.imag) : undefined,
        intensity: Array.from(field.intensity),
        phaseRad: field.phaseRad ? Array.from(field.phaseRad) : undefined,
        normalization: field.normalization,
        units: field.units,
        provenance: field.provenance
      },
      energyLedger: result.energyLedger,
      warnings: result.warnings,
      cacheKey: result.cacheKey,
      cacheHit: result.cacheHit,
      cancelled: result.cancelled,
      progressStage: result.progressStage,
      performanceStats: result.performanceStats
    },
    null,
    2
  );
}
