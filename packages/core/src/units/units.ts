export type DisplayLengthUnit = "m" | "mm" | "um" | "nm";
export type DisplayAngleUnit = "rad" | "deg";

const lengthScalesToM: Record<DisplayLengthUnit, number> = {
  m: 1,
  mm: 1e-3,
  um: 1e-6,
  nm: 1e-9
};

export function toMeters(value: number, unit: DisplayLengthUnit): number {
  return value * lengthScalesToM[unit];
}

export function fromMeters(valueM: number, unit: DisplayLengthUnit): number {
  return valueM / lengthScalesToM[unit];
}

export function toRadians(value: number, unit: DisplayAngleUnit): number {
  return unit === "deg" ? (value * Math.PI) / 180 : value;
}

export function fromRadians(valueRad: number, unit: DisplayAngleUnit): number {
  return unit === "deg" ? (valueRad * 180) / Math.PI : valueRad;
}

export function formatLength(valueM: number, preferred: DisplayLengthUnit): string {
  const value = fromMeters(valueM, preferred);
  const abs = Math.abs(value);
  if (abs > 0 && abs < 0.001) {
    return `<0.001 ${preferred}`;
  }
  const digits = abs >= 100 ? 2 : abs >= 10 ? 3 : 4;
  return `${Number(value.toPrecision(digits))} ${preferred}`;
}

export function formatPower(powerW: number): string {
  if (powerW === 0) return "0 W";
  if (Math.abs(powerW) < 1e-3) return `${Number((powerW * 1e6).toPrecision(4))} uW`;
  if (Math.abs(powerW) < 1) return `${Number((powerW * 1e3).toPrecision(4))} mW`;
  return `${Number(powerW.toPrecision(4))} W`;
}
