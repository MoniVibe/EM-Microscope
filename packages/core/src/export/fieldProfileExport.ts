import type { FieldOutput1D, SolverResult } from "../solvers/Solver";

export function fieldProfileToCsv(result: SolverResult, field: FieldOutput1D): string {
  const provenance = field.provenance.kind === "simulated" ? `${field.provenance.level}:${field.provenance.model}` : field.provenance.kind;
  const metadata = [
    `# solverId,${result.solverId}`,
    `# solverVersion,${result.solverVersion}`,
    `# sceneHash,${result.sceneHash}`,
    `# resultHash,${result.resultHash ?? ""}`,
    `# fieldId,${field.id}`,
    `# planeId,${field.planeId}`,
    `# yUnit,${field.units.y}`,
    `# intensityUnit,${field.units.intensity}`,
    `# phaseUnit,${field.units.phase}`,
    `# provenance,${provenance}`
  ];
  const header = "yM,intensity,phaseRad,real,imag";
  const rows: string[] = [];
  for (let index = 0; index < field.yM.length; index += 1) {
    rows.push([field.yM[index], field.intensity[index], field.phaseRad[index], field.real[index], field.imag[index]].join(","));
  }
  return [...metadata, header, ...rows].join("\n");
}

export function fieldProfileToJson(result: SolverResult, field: FieldOutput1D): string {
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
        yM: Array.from(field.yM),
        real: Array.from(field.real),
        imag: Array.from(field.imag),
        intensity: Array.from(field.intensity),
        phaseRad: Array.from(field.phaseRad),
        units: field.units,
        provenance: field.provenance
      },
      energyLedger: result.energyLedger,
      warnings: result.warnings
    },
    null,
    2
  );
}
