import { externalFdtdBackend } from "./externalFdtdBackend";
import { planarTmmBackend } from "./planarTmmBackend";
import type { AnyMaxwellSolverBackend, MaxwellSolverBackendId, MaxwellSolverMethod } from "./solverBackend";

export const futureMaxwellSolverMethods: Exclude<MaxwellSolverMethod, "planar-tmm">[] = ["rcwa", "fdtd", "fem-frequency-domain", "bem-frequency-domain"];

const registry = new Map<MaxwellSolverBackendId, AnyMaxwellSolverBackend>([
  [planarTmmBackend.id, planarTmmBackend],
  [externalFdtdBackend.id, externalFdtdBackend]
]);

export function listMaxwellSolverBackends(): AnyMaxwellSolverBackend[] {
  return [...registry.values()];
}

export function listExecutableMaxwellSolverBackends(): AnyMaxwellSolverBackend[] {
  return listMaxwellSolverBackends().filter((backend) => backend.capabilities().availability === "executable");
}

export function listScaffoldedMaxwellSolverBackends(): AnyMaxwellSolverBackend[] {
  return listMaxwellSolverBackends().filter((backend) => backend.capabilities().availability === "scaffold-only");
}

export function getMaxwellSolverBackend(backendId: MaxwellSolverBackendId): AnyMaxwellSolverBackend {
  const backend = registry.get(backendId);
  if (!backend) throw new Error(`Maxwell solver backend '${backendId}' is not registered`);
  return backend;
}

export function isMaxwellSolverMethodAvailable(method: MaxwellSolverMethod): boolean {
  return listExecutableMaxwellSolverBackends().some((backend) => backend.method === method);
}

export function unavailableMaxwellSolverMethods(): Exclude<MaxwellSolverMethod, "planar-tmm">[] {
  return futureMaxwellSolverMethods.filter((method) => !isMaxwellSolverMethodAvailable(method));
}
