import { planarTmmBackend } from "./planarTmmBackend";
import type { MaxwellSolverBackend, MaxwellSolverBackendId, MaxwellSolverMethod } from "./solverBackend";

export const futureMaxwellSolverMethods: Exclude<MaxwellSolverMethod, "planar-tmm">[] = ["rcwa", "fdtd", "fem-frequency-domain", "bem-frequency-domain"];

const registry = new Map<MaxwellSolverBackendId, MaxwellSolverBackend>([[planarTmmBackend.id, planarTmmBackend]]);

export function listMaxwellSolverBackends(): MaxwellSolverBackend[] {
  return [...registry.values()];
}
export function getMaxwellSolverBackend(backendId: MaxwellSolverBackendId): MaxwellSolverBackend {
  const backend = registry.get(backendId);
  if (!backend) throw new Error(`Maxwell solver backend '${backendId}' is not registered`);
  return backend;
}

export function isMaxwellSolverMethodAvailable(method: MaxwellSolverMethod): boolean {
  return listMaxwellSolverBackends().some((backend) => backend.method === method);
}

export function unavailableMaxwellSolverMethods(): Exclude<MaxwellSolverMethod, "planar-tmm">[] {
  return futureMaxwellSolverMethods.filter((method) => !isMaxwellSolverMethodAvailable(method));
}
