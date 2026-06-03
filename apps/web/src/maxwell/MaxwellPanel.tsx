import { useMemo, useState } from "react";
import {
  l4AbsorbingFilmTmm,
  l4BareGlassTmm,
  l4ObliqueStackTmm,
  l4QuarterWaveArTmm,
  runPlanarTmm,
  type MaxwellPolarization,
  type PlanarTmmInput,
  type PlanarTmmResult
} from "@emmicro/core";
import { FileDown, Save } from "lucide-react";

const maxwellPresets = {
  bareGlass: {
    label: "Bare air/glass",
    input: l4BareGlassTmm
  },
  quarterWaveAr: {
    label: "MgF2 quarter-wave AR",
    input: l4QuarterWaveArTmm
  },
  absorbingFilm: {
    label: "Lossy chromium-like film",
    input: l4AbsorbingFilmTmm
  },
  obliqueAr: {
    label: "Oblique TM AR stack",
    input: l4ObliqueStackTmm
  }
} satisfies Record<string, { label: string; input: PlanarTmmInput }>;

type MaxwellPresetId = keyof typeof maxwellPresets;

const presetEntries = Object.entries(maxwellPresets) as Array<[MaxwellPresetId, (typeof maxwellPresets)[MaxwellPresetId]]>;

export function MaxwellPanel() {
  const [presetId, setPresetId] = useState<MaxwellPresetId>("quarterWaveAr");
  const [wavelengthNm, setWavelengthNm] = useState(nmFromM(maxwellPresets.quarterWaveAr.input.wavelengthM));
  const [angleDeg, setAngleDeg] = useState(degFromRad(maxwellPresets.quarterWaveAr.input.angleRad));
  const [polarization, setPolarization] = useState<MaxwellPolarization>(maxwellPresets.quarterWaveAr.input.polarization);
  const [thicknessScale, setThicknessScale] = useState(1);

  const input = useMemo(
    () => makeControlledInput(maxwellPresets[presetId].input, wavelengthNm, angleDeg, polarization, thicknessScale),
    [angleDeg, polarization, presetId, thicknessScale, wavelengthNm]
  );
  const result = useMemo(() => runPlanarTmm(input), [input]);

  function selectPreset(nextPresetId: MaxwellPresetId): void {
    const next = maxwellPresets[nextPresetId].input;
    setPresetId(nextPresetId);
    setWavelengthNm(nmFromM(next.wavelengthM));
    setAngleDeg(degFromRad(next.angleRad));
    setPolarization(next.polarization);
    setThicknessScale(1);
  }

  return (
    <section className="wave-panel maxwell-panel" aria-label="L4 Maxwell Phase 0">
      <h2>L4 Maxwell Phase 0</h2>
      <div className="l2-disclosure">
        <strong>frequency-domain Maxwell planar multilayer TMM special case</strong>
        <span>not a general 3D Maxwell solver</span>
      </div>
      <label className="field-row">
        <span>Preset</span>
        <select value={presetId} onChange={(event) => selectPreset(event.currentTarget.value as MaxwellPresetId)}>
          {presetEntries.map(([id, preset]) => (
            <option key={id} value={id}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field-row">
        <span>Wavelength</span>
        <div className="number-input">
          <input
            type="number"
            value={formatNumberInputValue(wavelengthNm)}
            min={200}
            max={2000}
            step={1}
            onChange={(event) => setWavelengthNm(Number(event.currentTarget.value))}
          />
          <em>nm</em>
        </div>
      </label>
      <label className="field-row">
        <span>Angle</span>
        <div className="number-input">
          <input
            type="number"
            value={formatNumberInputValue(angleDeg)}
            min={-80}
            max={80}
            step={0.25}
            onChange={(event) => setAngleDeg(Number(event.currentTarget.value))}
          />
          <em>deg</em>
        </div>
      </label>
      <label className="field-row">
        <span>Pol.</span>
        <select value={polarization} onChange={(event) => setPolarization(event.currentTarget.value as MaxwellPolarization)}>
          <option value="TE">TE</option>
          <option value="TM">TM</option>
        </select>
      </label>
      <label className="field-row">
        <span>Layer scale</span>
        <div className="number-input">
          <input
            type="number"
            value={formatNumberInputValue(thicknessScale)}
            min={0.05}
            max={5}
            step={0.05}
            onChange={(event) => setThicknessScale(Number(event.currentTarget.value))}
          />
          <em>x</em>
        </div>
      </label>

      <div className="wave-actions">
        <button type="button" onClick={() => exportMaxwellJson(input, result)}>
          <Save size={17} />
          <span>JSON</span>
        </button>
        <button type="button" onClick={() => exportMaxwellSummary(input, result)}>
          <FileDown size={17} />
          <span>Summary</span>
        </button>
      </div>

      <div className="profile-meta">
        <div className="compact-stat">
          <span>Result hash</span>
          <strong>{result.resultHash.slice(0, 10)}</strong>
        </div>
        <div className="compact-stat">
          <span>Layers</span>
          <strong>{result.layerCount}</strong>
        </div>
        <div className="compact-stat">
          <span>Energy error</span>
          <strong>{result.energyBalanceError.toExponential(2)}</strong>
        </div>
      </div>

      <div className="maxwell-flux" aria-label="Poynting flux ratios">
        <FluxRow label="R" value={result.reflectance} />
        <FluxRow label="T" value={result.transmittance} />
        <FluxRow label="A" value={result.absorbance} />
      </div>

      <div className="maxwell-stack">
        <h2>Layer Stack</h2>
        {input.layers.length > 0 ? (
          <ul>
            {input.layers.map((layer) => (
              <li key={layer.id}>
                <strong>{layer.label}</strong>
                <span>
                  {formatNm(layer.thicknessM)} nm, n={layer.material.refractiveIndex.n.toFixed(3)}, k=
                  {layer.material.refractiveIndex.k.toFixed(3)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">No internal film layer; this preset is the bare incident/substrate boundary.</div>
        )}
      </div>

      {result.warnings.length > 0 && (
        <ul className="warning-list">
          {result.warnings.map((warning) => (
            <li key={`${warning.code}:${warning.elementId ?? ""}`}>{warning.message}</li>
          ))}
        </ul>
      )}

      <div className="maxwell-stack">
        <h2>Limitations</h2>
        <ul>
          {result.provenance.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function makeControlledInput(
  base: PlanarTmmInput,
  wavelengthNm: number,
  angleDeg: number,
  polarization: MaxwellPolarization,
  thicknessScale: number
): PlanarTmmInput {
  const safeWavelengthNm = clamp(Number.isFinite(wavelengthNm) ? wavelengthNm : 550, 200, 2000);
  const safeAngleDeg = clamp(Number.isFinite(angleDeg) ? angleDeg : 0, -80, 80);
  const safeThicknessScale = clamp(Number.isFinite(thicknessScale) ? thicknessScale : 1, 0.05, 5);
  return {
    ...base,
    wavelengthM: safeWavelengthNm * 1e-9,
    angleRad: radFromDeg(safeAngleDeg),
    polarization,
    layers: base.layers.map((layer) => ({
      ...layer,
      thicknessM: layer.thicknessM * safeThicknessScale
    }))
  };
}

function FluxRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="maxwell-flux-row">
      <span>{label}</span>
      <div className="maxwell-flux-bar">
        <i style={{ width: `${clamp(value, 0, 1) * 100}%` }} />
      </div>
      <strong>{formatPercent(value)}</strong>
    </div>
  );
}

function exportMaxwellJson(input: PlanarTmmInput, result: PlanarTmmResult): void {
  downloadText(
    `l4-planar-tmm-${result.id}.json`,
    "application/json",
    JSON.stringify(
      {
        input,
        result
      },
      null,
      2
    )
  );
}

function exportMaxwellSummary(input: PlanarTmmInput, result: PlanarTmmResult): void {
  downloadText(
    `l4-planar-tmm-${result.id}.md`,
    "text/markdown",
    [
      `# ${result.label}`,
      "",
      `Analysis: ${result.provenance.label}`,
      `Wavelength: ${formatNm(input.wavelengthM)} nm`,
      `Angle: ${degFromRad(input.angleRad).toFixed(2)} deg`,
      `Polarization: ${input.polarization}`,
      "",
      `Reflectance: ${formatPercent(result.reflectance)}`,
      `Transmittance: ${formatPercent(result.transmittance)}`,
      `Absorbance: ${formatPercent(result.absorbance)}`,
      `Energy balance error: ${result.energyBalanceError.toExponential(3)}`,
      `Result hash: ${result.resultHash}`,
      "",
      "Limitations:",
      ...result.provenance.limitations.map((limitation) => `- ${limitation}`)
    ].join("\n")
  );
}

function downloadText(filename: string, mime: string, text: string): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function nmFromM(value: number): number {
  return value * 1e9;
}

function formatNm(value: number): string {
  return nmFromM(value).toFixed(value < 1e-6 ? 2 : 1);
}

function radFromDeg(value: number): number {
  return (value * Math.PI) / 180;
}

function degFromRad(value: number): number {
  return (value * 180) / Math.PI;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(value < 0.001 ? 4 : 2)}%`;
}

function formatNumberInputValue(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (value === 0) return "0";
  const rounded = Math.abs(value) >= 1e-3 ? Number(value.toFixed(6)) : Number(value.toPrecision(6));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}
