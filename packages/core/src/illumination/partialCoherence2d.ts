import { makeWaveEnergyLedger } from "../readouts/waveEnergy";
import type { EnergyLedger, FieldOutput2D, PhysicsProvenance } from "../solvers/Solver";

export type WeightedFieldOutput2D = {
  field: FieldOutput2D;
  weight: number;
};

export type WeightedEnergyLedger = {
  ledger: EnergyLedger;
  weight: number;
};

export function averageIntensityFieldOutputs2D({
  fields,
  id,
  provenance
}: {
  fields: WeightedFieldOutput2D[];
  id: string;
  provenance: PhysicsProvenance;
}): FieldOutput2D {
  if (fields.length === 0) {
    throw new Error("partial-coherence averaging requires at least one coherent field");
  }
  const reference = fields[0]?.field;
  if (!reference) {
    throw new Error("missing reference field for partial-coherence averaging");
  }
  const weightSum = fields.reduce((sum, item) => sum + item.weight, 0);
  if (weightSum <= 0) {
    throw new Error("partial-coherence averaging requires positive source-angle weights");
  }
  const averaged = new Float64Array(reference.intensity.length);
  for (const { field, weight } of fields) {
    assertSameGeometry(reference, field);
    const normalizedWeight = weight / weightSum;
    for (let index = 0; index < averaged.length; index += 1) {
      averaged[index] = (averaged[index] ?? 0) + (field.intensity[index] ?? 0) * normalizedWeight;
    }
  }
  return {
    id,
    type: "fieldImage2D",
    planeId: reference.planeId,
    gridId: reference.gridId,
    xM: reference.xM,
    width: reference.width,
    height: reference.height,
    uMinM: reference.uMinM,
    uMaxM: reference.uMaxM,
    vMinM: reference.vMinM,
    vMaxM: reference.vMaxM,
    intensity: averaged,
    normalization: reference.normalization,
    units: reference.units,
    provenance
  };
}

export function averageEnergyLedgers2D(entries: WeightedEnergyLedger[], provenance: PhysicsProvenance): EnergyLedger | undefined {
  if (entries.length === 0) return undefined;
  const weightSum = entries.reduce((sum, item) => sum + item.weight, 0);
  if (weightSum <= 0) return undefined;

  const inputEnergy = weightedSum(entries, (entry) => entry.ledger.inputEnergy, weightSum);
  const afterMaskEnergy = weightedSum(entries, (entry) => entry.ledger.afterMaskEnergy, weightSum);
  const outputEnergy = weightedSum(entries, (entry) => entry.ledger.outputEnergy, weightSum);
  const stageCount = entries[0]?.ledger.stages?.length ?? 0;
  const stages =
    stageCount > 0 && entries.every((entry) => (entry.ledger.stages?.length ?? 0) === stageCount)
      ? entries[0]?.ledger.stages?.map((stage, stageIndex) => ({
          ...stage,
          inputEnergy: weightedSum(entries, (entry) => entry.ledger.stages?.[stageIndex]?.inputEnergy ?? 0, weightSum),
          outputEnergy: weightedSum(entries, (entry) => entry.ledger.stages?.[stageIndex]?.outputEnergy ?? 0, weightSum),
          clippedEnergy: weightedSum(entries, (entry) => entry.ledger.stages?.[stageIndex]?.clippedEnergy ?? 0, weightSum),
          relativeChange: weightedSum(entries, (entry) => entry.ledger.stages?.[stageIndex]?.relativeChange ?? 0, weightSum)
        }))
      : undefined;

  return makeWaveEnergyLedger({
    inputEnergy,
    afterMaskEnergy,
    outputEnergy,
    stages,
    provenance
  });
}

function assertSameGeometry(reference: FieldOutput2D, field: FieldOutput2D): void {
  if (
    reference.width !== field.width ||
    reference.height !== field.height ||
    reference.gridId !== field.gridId ||
    reference.planeId !== field.planeId ||
    reference.uMinM !== field.uMinM ||
    reference.uMaxM !== field.uMaxM ||
    reference.vMinM !== field.vMinM ||
    reference.vMaxM !== field.vMaxM
  ) {
    throw new Error("partial-coherence averaging requires all coherent fields to share detector geometry");
  }
}

function weightedSum(entries: WeightedEnergyLedger[], select: (entry: WeightedEnergyLedger) => number, weightSum: number): number {
  return entries.reduce((sum, entry) => sum + select(entry) * (entry.weight / weightSum), 0);
}
