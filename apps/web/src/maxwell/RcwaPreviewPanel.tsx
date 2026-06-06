import { useMemo, useState } from "react";
import {
  createDefaultRcwaPreviewSpec,
  createMaterialCatalog,
  createRcwaNoPatternSpec,
  l93RcwaPreviewBoundary,
  listCatalogMaterials,
  rcwaConvergenceCsv,
  rcwaOrdersCsv,
  rcwaPreviewReportJson,
  rcwaPreviewReportMarkdown,
  rcwaTmmConsistencyCsv,
  runRcwaHarmonicConvergence,
  runRcwaPreview,
  sampleCatalogMaterial,
  type MaxwellMaterialCatalog,
  type MaxwellPolarization,
  type RcwaConvergenceReport,
  type RcwaPreviewResult,
  type RcwaPreviewSpec
} from "@emmicro/core";
import { Download, Gauge, RotateCcw, ShieldCheck, TableProperties, Waves } from "lucide-react";

const builtInCatalog = createMaterialCatalog({ id: "l93-built-in-rcwa-material-catalog" });

type RcwaControls = {
  wavelengthNm: number;
  periodNm: number;
  dutyCycle: number;
  depthNm: number;
  angleDeg: number;
  polarization: MaxwellPolarization;
  harmonicCount: number;
  superstrateId: string;
  gratingMaterialId: string;
  backgroundMaterialId: string;
  substrateId: string;
};

const defaultControls: RcwaControls = {
  wavelengthNm: 500,
  periodNm: 1000,
  dutyCycle: 0.5,
  depthNm: 200,
  angleDeg: 0,
  polarization: "TE",
  harmonicCount: 9,
  superstrateId: "air",
  gratingMaterialId: "sio2",
  backgroundMaterialId: "air",
  substrateId: "bk7"
};

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

export function RcwaPreviewPanel() {
  const [controls, setControls] = useState<RcwaControls>(defaultControls);
  const [result, setResult] = useState<RcwaPreviewResult>(() => runRcwaPreview(specFromControls(defaultControls, builtInCatalog)));
  const [convergence, setConvergence] = useState<RcwaConvergenceReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const materialOptions = useMemo(() => listCatalogMaterials(builtInCatalog), []);
  const specState = useMemo(() => {
    try {
      return { spec: specFromControls(controls, builtInCatalog), error: null };
    } catch (caught) {
      return { spec: null, error: caught instanceof Error ? caught.message : String(caught) };
    }
  }, [controls]);
  const activeResult = result;

  function update<K extends keyof RcwaControls>(key: K, value: RcwaControls[K]): void {
    setControls((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function loadDefault(): void {
    setControls(defaultControls);
    const next = runRcwaPreview(specFromControls(defaultControls, builtInCatalog));
    setResult(next);
    setConvergence(null);
    setError(null);
  }

  function runPreview(): void {
    if (!specState.spec) {
      setError(specState.error ?? "RCWA spec is invalid.");
      return;
    }
    try {
      setResult(runRcwaPreview(specState.spec));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  }

  function runConvergence(): void {
    if (!specState.spec) {
      setError(specState.error ?? "RCWA spec is invalid.");
      return;
    }
    try {
      const next = runRcwaPreview(specState.spec);
      setResult(next);
      setConvergence(runRcwaHarmonicConvergence(specState.spec, [3, 5, 7, 9, 11]));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  }

  function runNoPatternCheck(): void {
    if (!specState.spec) {
      setError(specState.error ?? "RCWA spec is invalid.");
      return;
    }
    try {
      const noPattern = createRcwaNoPatternSpec(specState.spec);
      const nextControls = { ...controls, dutyCycle: noPattern.dutyCycle };
      setControls(nextControls);
      setResult(runRcwaPreview(noPattern));
      setConvergence(runRcwaHarmonicConvergence(noPattern, [3, 5, 7, 9, 11]));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  }

  function exportArtifacts(): void {
    const report = { schema: "emmicro.rcwaPreview.report.v1" as const, boundary: l93RcwaPreviewBoundary, result: activeResult, convergence: convergence ?? undefined };
    downloadText("rcwa_report.md", "text/markdown", `${rcwaPreviewReportMarkdown(report)}\n`);
    downloadText("rcwa_report.json", "application/json", rcwaPreviewReportJson(report));
    downloadText("rcwa_orders.csv", "text/csv", `${rcwaOrdersCsv(activeResult)}\n`);
    if (convergence) downloadText("rcwa_convergence.csv", "text/csv", `${rcwaConvergenceCsv(convergence)}\n`);
    downloadText("rcwa_tmm_consistency.csv", "text/csv", `${rcwaTmmConsistencyCsv(activeResult.tmmConsistency)}\n`);
  }

  const tmmResidual = activeResult.tmmConsistency.residual;

  return (
    <section className="wave-panel simulation-builder-panel rcwa-panel" aria-label="L9.3 In-Browser 1D RCWA Preview Solver">
      <div className="maxwell-section-heading simulation-builder-title">
        <h2>L9.3 In-Browser 1D RCWA Preview Solver</h2>
        <strong className={`fdtd2d-status fdtd2d-status-${activeResult.energyBalanceError < 1e-5 ? "safe" : "warning"}`}>
          {activeResult.energyBalanceError < 1e-5 ? "PASS" : "WARNING"}
        </strong>
      </div>

      <div className="l2-disclosure">
        <strong>Bounded 1D periodic solver preview only: binary rectangular grating, single patterned layer, plane-wave incidence.</strong>
        <span>
          RCWA preview results are diagnostic and include harmonic convergence and TMM no-pattern checks. This is not arbitrary 2D-periodic RCWA, not production RCWA certification, not arbitrary 3D Maxwell, not FEM/BEM, not a replacement for external solvers, and not manufacturing certification.
        </span>
      </div>

      <div className="simulation-builder-layout rcwa-layout">
        <div className="maxwell-workspace-panel simulation-builder-card rcwa-controls">
          <div className="maxwell-section-heading">
            <h2>Periodic Structure</h2>
            <strong>binary 1D</strong>
          </div>
          <div className="simulation-field-grid rcwa-field-grid">
            <NumberField label="wavelength" value={controls.wavelengthNm} min={250} step={10} unit="nm" onChange={(value) => update("wavelengthNm", value)} />
            <NumberField label="period" value={controls.periodNm} min={100} step={25} unit="nm" onChange={(value) => update("periodNm", value)} />
            <NumberField label="duty cycle" value={controls.dutyCycle} min={0} max={1} step={0.05} onChange={(value) => update("dutyCycle", value)} />
            <NumberField label="depth" value={controls.depthNm} min={0} step={10} unit="nm" onChange={(value) => update("depthNm", value)} />
            <MaterialSelect label="superstrate" value={controls.superstrateId} options={materialOptions} onChange={(value) => update("superstrateId", value)} />
            <MaterialSelect label="grating material" value={controls.gratingMaterialId} options={materialOptions} onChange={(value) => update("gratingMaterialId", value)} />
            <MaterialSelect label="background" value={controls.backgroundMaterialId} options={materialOptions} onChange={(value) => update("backgroundMaterialId", value)} />
            <MaterialSelect label="substrate" value={controls.substrateId} options={materialOptions} onChange={(value) => update("substrateId", value)} />
          </div>
        </div>

        <div className="maxwell-workspace-panel simulation-builder-card rcwa-controls">
          <div className="maxwell-section-heading">
            <h2>Source / Solver</h2>
            <strong>{controls.polarization}</strong>
          </div>
          <div className="simulation-field-grid rcwa-field-grid">
            <NumberField label="incidence angle" value={controls.angleDeg} min={-80} max={80} step={1} unit="deg" onChange={(value) => update("angleDeg", value)} />
            <label>
              <span>polarization</span>
              <select value={controls.polarization} onChange={(event) => update("polarization", event.currentTarget.value as MaxwellPolarization)}>
                <option value="TE">TE</option>
                <option value="TM">TM</option>
              </select>
              <em>mode</em>
            </label>
            <NumberField label="harmonic count" value={controls.harmonicCount} min={1} step={2} onChange={(value) => update("harmonicCount", value)} />
          </div>
          <p className="simulation-builder-note">
            Harmonic count defaults to 9, warns above 21, and caps at 41 for browser safety. High-contrast or metal-like gratings need external RCWA validation.
            Order statuses are reported as propagating/evanescent/near-cutoff for each reflected and transmitted branch.
          </p>
          <div className="maxwell-layer-actions simulation-builder-actions rcwa-actions">
            <button type="button" onClick={loadDefault}>
              <RotateCcw size={15} />
              <span>Load Default Binary Grating</span>
            </button>
            <button type="button" onClick={runPreview} disabled={!specState.spec}>
              <Waves size={15} />
              <span>Run RCWA</span>
            </button>
            <button type="button" onClick={runConvergence} disabled={!specState.spec}>
              <Gauge size={15} />
              <span>Run Harmonic Convergence</span>
            </button>
            <button type="button" onClick={runNoPatternCheck} disabled={!specState.spec}>
              <ShieldCheck size={15} />
              <span>Run No-Pattern TMM Check</span>
            </button>
            <button type="button" onClick={exportArtifacts}>
              <Download size={15} />
              <span>Export RCWA Reports</span>
            </button>
          </div>
          {error && <div className="error-banner">{error}</div>}
          {specState.error && <div className="error-banner">{specState.error}</div>}
        </div>

        <div className="maxwell-workspace-panel simulation-builder-card simulation-builder-wide rcwa-results">
          <div className="maxwell-section-heading">
            <h2>Results</h2>
            <strong>{activeResult.harmonicCount} harmonics</strong>
          </div>
          <div className="profile-meta rcwa-summary-grid">
            <Stat label="Total R" value={formatNumber(activeResult.totalReflectance)} />
            <Stat label="Total T" value={formatNumber(activeResult.totalTransmittance)} />
            <Stat label="Total A" value={formatNumber(activeResult.totalAbsorbance)} />
            <Stat label="R+T+A" value={formatNumber(activeResult.totalEnergy)} />
            <Stat label="Energy error" value={formatNumber(activeResult.energyBalanceError)} />
            <Stat label="TMM consistency" value={activeResult.tmmConsistency.status} />
            <Stat label="TMM residual" value={tmmResidual === null ? "n/a" : formatNumber(tmmResidual)} />
            <Stat label="Patterned" value={activeResult.effectiveLayer.patterned ? "yes" : "no"} />
          </div>
          <div className="rcwa-order-diagram" aria-label="RCWA order-angle diagram">
            {activeResult.orders.filter((order) => order.transmittedStatus !== "evanescent").map((order) => (
              <span key={order.order} style={{ left: `${50 + Math.sin(order.transmittedAngleRad ?? 0) * 42}%` }}>
                {order.order}
              </span>
            ))}
          </div>
          <div className="rcwa-table-wrap">
            <table className="rcwa-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>R angle</th>
                  <th>T angle</th>
                  <th>R status</th>
                  <th>T status</th>
                  <th>R eff.</th>
                  <th>T eff.</th>
                </tr>
              </thead>
              <tbody>
                {activeResult.orders.map((order) => (
                  <tr key={order.order}>
                    <td>{order.order}</td>
                    <td>{formatAngle(order.reflectedAngleRad)}</td>
                    <td>{formatAngle(order.transmittedAngleRad)}</td>
                    <td>{order.reflectedStatus}</td>
                    <td>{order.transmittedStatus}</td>
                    <td>{formatNumber(order.reflectedEfficiency)}</td>
                    <td>{formatNumber(order.transmittedEfficiency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="maxwell-workspace-panel simulation-builder-card rcwa-results">
          <div className="maxwell-section-heading">
            <h2>Validation</h2>
            <strong>{convergence?.status ?? "ready"}</strong>
          </div>
          <div className="fdtd-warning-list">
            {activeResult.warnings.length
              ? activeResult.warnings.map((warning) => <span key={`${warning.code}:${warning.message}`}><strong>{warning.code}</strong> {warning.message}</span>)
              : <span><strong>clear</strong> RCWA preview guardrails are clear</span>}
          </div>
          <p className="simulation-builder-note">
            TMM consistency is exact only for no-pattern fixtures: duty cycle 0/1, zero depth, or identical grating/background materials.
          </p>
          {convergence ? (
            <div className="rcwa-mini-table" aria-label="RCWA harmonic convergence table">
              {convergence.rows.map((row) => (
                <div key={row.harmonicCount}>
                  <span>{row.harmonicCount} H</span>
                  <strong>T {formatNumber(row.totalTransmittance)}</strong>
                  <em>err {formatNumber(row.energyBalanceError)}</em>
                </div>
              ))}
            </div>
          ) : (
            <p className="simulation-builder-note">Run harmonic convergence to populate 3/5/7/9/11 harmonic totals.</p>
          )}
        </div>

        <div className="maxwell-workspace-panel simulation-builder-card rcwa-results">
          <div className="maxwell-section-heading">
            <h2>Exports</h2>
            <strong><TableProperties size={15} /> report</strong>
          </div>
          <div className="fdtd2d-export-list" aria-label="L9.3 RCWA export files">
            <span>rcwa_report.md</span>
            <span>rcwa_report.json</span>
            <span>rcwa_orders.csv</span>
            <span>rcwa_convergence.csv</span>
            <span>rcwa_tmm_consistency.csv</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function specFromControls(controls: RcwaControls, catalog: MaxwellMaterialCatalog): RcwaPreviewSpec {
  const wavelengthM = controls.wavelengthNm * 1e-9;
  return createDefaultRcwaPreviewSpec({
    wavelengthM,
    periodM: controls.periodNm * 1e-9,
    dutyCycle: controls.dutyCycle,
    depthM: controls.depthNm * 1e-9,
    angleRad: (controls.angleDeg * Math.PI) / 180,
    polarization: controls.polarization,
    harmonicCount: controls.harmonicCount,
    superstrate: sampleCatalogMaterial(controls.superstrateId, wavelengthM, catalog, { extrapolation: "clamp" }).material,
    gratingMaterial: sampleCatalogMaterial(controls.gratingMaterialId, wavelengthM, catalog, { extrapolation: "clamp" }).material,
    backgroundMaterial: sampleCatalogMaterial(controls.backgroundMaterialId, wavelengthM, catalog, { extrapolation: "clamp" }).material,
    substrate: sampleCatalogMaterial(controls.substrateId, wavelengthM, catalog, { extrapolation: "clamp" }).material
  });
}

function MaterialSelect(props: {
  label: string;
  value: string;
  options: ReturnType<typeof listCatalogMaterials>;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span>{props.label}</span>
      <select value={props.value} onChange={(event) => props.onChange(event.currentTarget.value)}>
        {props.options.map((material) => <option key={material.id} value={material.id}>{material.label}</option>)}
      </select>
      <em>n/k</em>
    </label>
  );
}

function NumberField(props: { label: string; value: number; unit?: string; min?: number; max?: number; step?: number; onChange: (value: number) => void }) {
  return (
    <label>
      <span>{props.label}</span>
      <input
        aria-label={props.label}
        type="number"
        value={Number.isFinite(props.value) ? props.value : 0}
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        onChange={(event) => props.onChange(Number(event.currentTarget.value))}
      />
      {props.unit && <em>{props.unit}</em>}
    </label>
  );
}

function Stat(props: { label: string; value: string }) {
  return (
    <div className="compact-stat">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "n/a";
  if (value === 0) return "0";
  if (Math.abs(value) >= 1000 || Math.abs(value) < 0.001) return value.toExponential(3);
  return value.toPrecision(4);
}

function formatAngle(angleRad: number | null): string {
  if (angleRad === null) return "-";
  return `${((angleRad * 180) / Math.PI).toFixed(2)} deg`;
}
