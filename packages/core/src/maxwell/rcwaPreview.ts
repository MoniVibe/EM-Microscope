import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";
import { cabs, cadd, cmul, complex, csqrt, csub, type Complex } from "./complex";
import { l4MaterialSamples, type MaxwellMaterialSample, relativePermittivityFromIndex } from "./materials";
import { runPlanarTmm, type MaxwellPolarization, type PlanarTmmInput, type PlanarTmmResult } from "./planarTmm";

export type RcwaOrderStatus = "propagating" | "evanescent" | "near-cutoff";

export type RcwaPreviewSpec = {
  id: string;
  label: string;
  wavelengthM: number;
  periodM: number;
  dutyCycle: number;
  depthM: number;
  angleRad: number;
  polarization: MaxwellPolarization;
  harmonicCount: number;
  superstrate: MaxwellMaterialSample;
  gratingMaterial: MaxwellMaterialSample;
  backgroundMaterial: MaxwellMaterialSample;
  substrate: MaxwellMaterialSample;
  tolerance?: number;
};

export type RcwaDiffractionOrder = {
  order: number;
  reflectedAngleRad: number | null;
  transmittedAngleRad: number | null;
  reflectedStatus: RcwaOrderStatus;
  transmittedStatus: RcwaOrderStatus;
  reflectedEfficiency: number;
  transmittedEfficiency: number;
  harmonicIncluded: boolean;
  cutoffMargin: {
    reflected: number;
    transmitted: number;
  };
};

export type RcwaTmmConsistencyReport = {
  schema: "emmicro.rcwaPreview.tmmConsistency.v1";
  status: "pass" | "warning" | "not-applicable";
  reason: string;
  tolerance: number;
  residual: number | null;
  residualReflectance: number | null;
  residualTransmittance: number | null;
  rcwa: {
    reflectance: number | null;
    transmittance: number | null;
    absorbance: number | null;
  };
  tmm: {
    reflectance: number | null;
    transmittance: number | null;
    absorbance: number | null;
    resultHash?: string;
  };
  warnings: SolverWarning[];
};

export type RcwaPreviewResult = {
  id: string;
  type: "boundedInBrowser1dRcwaPreview";
  analysisId: "analysis.maxwell.l93.rcwaPreview";
  label: string;
  wavelengthM: number;
  periodM: number;
  dutyCycle: number;
  depthM: number;
  angleRad: number;
  polarization: MaxwellPolarization;
  requestedHarmonicCount: number;
  harmonicCount: number;
  orderCount: number;
  orders: RcwaDiffractionOrder[];
  totalReflectance: number;
  totalTransmittance: number;
  totalAbsorbance: number;
  totalEnergy: number;
  energyBalanceError: number;
  effectiveLayer: {
    material: MaxwellMaterialSample;
    patterned: boolean;
    contrastScore: number;
    modulationScore: number;
  };
  tmmReference: Pick<PlanarTmmResult, "reflectance" | "transmittance" | "absorbance" | "energyBalanceError" | "resultHash">;
  tmmConsistency: RcwaTmmConsistencyReport;
  warnings: SolverWarning[];
  resultHash: string;
  provenance: {
    label: "bounded in-browser 1D RCWA/Fourier-modal preview";
    limitations: string[];
  };
};

export type RcwaConvergenceRow = {
  harmonicCount: number;
  totalReflectance: number;
  totalTransmittance: number;
  totalAbsorbance: number;
  energyBalanceError: number;
  zeroOrderTransmittance: number;
  firstOrderTransmittance: number;
  deltaTotalTransmittance: number | null;
  status: "pass" | "warning";
  warnings: SolverWarning[];
};

export type RcwaConvergenceReport = {
  schema: "emmicro.rcwaPreview.convergence.v1";
  status: "pass" | "warning";
  rows: RcwaConvergenceRow[];
  maxDeltaTotalTransmittance: number;
  maxEnergyBalanceError: number;
  warnings: SolverWarning[];
};

export type RcwaPreviewReport = {
  schema: "emmicro.rcwaPreview.report.v1";
  boundary: string[];
  result: RcwaPreviewResult;
  convergence?: RcwaConvergenceReport;
};

export const rcwaPreviewDefaultHarmonics = 9;
export const rcwaPreviewWarningHarmonics = 21;
export const rcwaPreviewHardHarmonics = 41;
export const rcwaPreviewTmmTolerance = 2e-6;

export const l93RcwaPreviewBoundary = [
  "L9.3 is a bounded in-browser 1D periodic RCWA/Fourier-modal preview for simple binary rectangular gratings and patterned single layers.",
  "It reports diffraction orders, approximate R/T/A power balance, harmonic convergence, and a TMM no-pattern consistency check.",
  "It is not arbitrary 2D-periodic RCWA, not anisotropic RCWA, not conical incidence, not slanted/curved/freeform grating CAD solving, and not production RCWA certification.",
  "It is not arbitrary 3D Maxwell, not production FDTD, not FEM/BEM, not a replacement for external solvers, not digital twin behavior, and not manufacturing certification."
];

export function createDefaultRcwaPreviewSpec(input: Partial<RcwaPreviewSpec> = {}): RcwaPreviewSpec {
  return createRcwaPreviewSpec({
    id: "l93-rcwa-default-binary-grating",
    label: "L9.3 binary grating RCWA preview",
    wavelengthM: 500e-9,
    periodM: 1000e-9,
    dutyCycle: 0.5,
    depthM: 200e-9,
    angleRad: 0,
    polarization: "TE",
    harmonicCount: rcwaPreviewDefaultHarmonics,
    superstrate: l4MaterialSamples.air,
    gratingMaterial: l4MaterialSamples.sio2,
    backgroundMaterial: l4MaterialSamples.air,
    substrate: l4MaterialSamples.bk7,
    ...input
  });
}

export function createRcwaPreviewSpec(input: RcwaPreviewSpec): RcwaPreviewSpec {
  validateRcwaGeometry(input);
  return {
    ...input,
    harmonicCount: Math.round(input.harmonicCount)
  };
}

export function runRcwaPreview(input: RcwaPreviewSpec): RcwaPreviewResult {
  const validationWarnings = validateRcwaPreviewSpec(input);
  const harmonicSanitization = sanitizeHarmonicCount(input.harmonicCount);
  const spec = createRcwaPreviewSpec({ ...input, harmonicCount: harmonicSanitization.harmonicCount });
  const core = runRcwaPreviewCore(spec, [...validationWarnings, ...harmonicSanitization.warnings]);
  const tmmConsistency = createRcwaTmmConsistencyReport(spec, core);
  const warnings = uniqueWarnings([...core.warnings, ...tmmConsistency.warnings]);
  const resultForHash = {
    spec: rcwaSpecForHash(spec, input.harmonicCount),
    orders: core.orders.map((order) => ({
      order: order.order,
      reflectedEfficiency: roundNumber(order.reflectedEfficiency),
      transmittedEfficiency: roundNumber(order.transmittedEfficiency),
      reflectedStatus: order.reflectedStatus,
      transmittedStatus: order.transmittedStatus
    })),
    totalReflectance: roundNumber(core.totalReflectance),
    totalTransmittance: roundNumber(core.totalTransmittance),
    totalAbsorbance: roundNumber(core.totalAbsorbance)
  };

  return {
    ...core,
    requestedHarmonicCount: input.harmonicCount,
    tmmConsistency,
    warnings,
    resultHash: fnv1a64(stableStringify({ analysisId: "analysis.maxwell.l93.rcwaPreview", result: resultForHash }))
  };
}

export function runRcwaHarmonicConvergence(
  input: RcwaPreviewSpec,
  harmonicCounts = [3, 5, 7, 9, 11]
): RcwaConvergenceReport {
  const rows: RcwaConvergenceRow[] = [];
  const warnings: SolverWarning[] = [];
  let previous: RcwaPreviewResult | null = null;
  for (const requestedCount of harmonicCounts) {
    const result = runRcwaPreview({ ...input, harmonicCount: requestedCount });
    const zeroOrder = result.orders.find((order) => order.order === 0);
    const firstOrders = result.orders.filter((order) => Math.abs(order.order) === 1);
    const firstOrderTransmittance = firstOrders.reduce((sum, order) => sum + order.transmittedEfficiency, 0);
    const deltaTotalTransmittance = previous ? Math.abs(result.totalTransmittance - previous.totalTransmittance) : null;
    const rowWarnings = result.warnings.filter((warning) =>
      warning.code.includes("energyBalance") || warning.code.includes("highHarmonic") || warning.code.includes("capped")
    );
    const status = (result.energyBalanceError > (input.tolerance ?? 1e-5) || (deltaTotalTransmittance ?? 0) > 0.05) ? "warning" : "pass";
    if (deltaTotalTransmittance !== null && deltaTotalTransmittance > 0.05) {
      rowWarnings.push({
        code: "maxwell.rcwaPreview.convergenceDelta",
        message: `Total transmittance changed by ${deltaTotalTransmittance.toPrecision(4)} between adjacent harmonic counts.`
      });
    }
    rows.push({
      harmonicCount: result.harmonicCount,
      totalReflectance: result.totalReflectance,
      totalTransmittance: result.totalTransmittance,
      totalAbsorbance: result.totalAbsorbance,
      energyBalanceError: result.energyBalanceError,
      zeroOrderTransmittance: zeroOrder?.transmittedEfficiency ?? 0,
      firstOrderTransmittance,
      deltaTotalTransmittance,
      status,
      warnings: uniqueWarnings(rowWarnings)
    });
    warnings.push(...rowWarnings);
    previous = result;
  }
  const maxDeltaTotalTransmittance = rows.reduce((max, row) => Math.max(max, row.deltaTotalTransmittance ?? 0), 0);
  const maxEnergyBalanceError = rows.reduce((max, row) => Math.max(max, row.energyBalanceError), 0);
  const status = rows.some((row) => row.status === "warning") ? "warning" : "pass";
  return {
    schema: "emmicro.rcwaPreview.convergence.v1",
    status,
    rows,
    maxDeltaTotalTransmittance,
    maxEnergyBalanceError,
    warnings: uniqueWarnings(warnings)
  };
}

export function createRcwaTmmConsistencyReport(
  input: RcwaPreviewSpec,
  rcwaResult?: Pick<RcwaPreviewResult, "totalReflectance" | "totalTransmittance" | "totalAbsorbance">
): RcwaTmmConsistencyReport {
  const harmonicSanitization = sanitizeHarmonicCount(input.harmonicCount);
  const spec = createRcwaPreviewSpec({ ...input, harmonicCount: harmonicSanitization.harmonicCount });
  const tolerance = spec.tolerance ?? rcwaPreviewTmmTolerance;
  if (!isNoPatternRcwaCase(spec)) {
    return {
      schema: "emmicro.rcwaPreview.tmmConsistency.v1",
      status: "not-applicable",
      reason: "TMM consistency is only exact for no-pattern cases: duty cycle 0/1, zero depth, or identical grating/background materials.",
      tolerance,
      residual: null,
      residualReflectance: null,
      residualTransmittance: null,
      rcwa: { reflectance: null, transmittance: null, absorbance: null },
      tmm: { reflectance: null, transmittance: null, absorbance: null },
      warnings: []
    };
  }
  const rcwa = rcwaResult ?? runRcwaPreviewCore(spec, []);
  const tmm = runPlanarTmm(tmmInputForRcwa(spec));
  const residualReflectance = Math.abs(rcwa.totalReflectance - tmm.reflectance);
  const residualTransmittance = Math.abs(rcwa.totalTransmittance - tmm.transmittance);
  const residualAbsorbance = Math.abs(rcwa.totalAbsorbance - tmm.absorbance);
  const residual = Math.max(residualReflectance, residualTransmittance, residualAbsorbance);
  const warnings: SolverWarning[] = [];
  if (residual > tolerance) {
    warnings.push({
      code: "maxwell.rcwaPreview.tmmConsistencyResidual",
      message: `No-pattern RCWA preview residual ${residual.toExponential(3)} exceeds tolerance ${tolerance.toExponential(3)}.`
    });
  }
  return {
    schema: "emmicro.rcwaPreview.tmmConsistency.v1",
    status: residual <= tolerance ? "pass" : "warning",
    reason: "No-pattern grating case compared against the existing planar TMM backend.",
    tolerance,
    residual,
    residualReflectance,
    residualTransmittance,
    rcwa: {
      reflectance: rcwa.totalReflectance,
      transmittance: rcwa.totalTransmittance,
      absorbance: rcwa.totalAbsorbance
    },
    tmm: {
      reflectance: tmm.reflectance,
      transmittance: tmm.transmittance,
      absorbance: tmm.absorbance,
      resultHash: tmm.resultHash
    },
    warnings
  };
}

export function createRcwaNoPatternSpec(input: RcwaPreviewSpec): RcwaPreviewSpec {
  return createRcwaPreviewSpec({
    ...input,
    id: `${input.id}-tmm-consistency`,
    label: "L9.3 no-pattern RCWA / TMM consistency fixture",
    dutyCycle: 1
  });
}

export function rcwaPreviewReportJson(report: RcwaPreviewReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function rcwaPreviewReportMarkdown(report: RcwaPreviewReport): string {
  const result = report.result;
  const lines = [
    "# L9.3 In-Browser 1D RCWA Preview Report",
    "",
    `- Result: ${result.label}`,
    `- Harmonics: ${result.harmonicCount} (requested ${result.requestedHarmonicCount})`,
    `- Polarization: ${result.polarization}`,
    `- Wavelength: ${(result.wavelengthM * 1e9).toFixed(2)} nm`,
    `- Period: ${(result.periodM * 1e9).toFixed(2)} nm`,
    `- Duty cycle: ${result.dutyCycle.toFixed(4)}`,
    `- Depth: ${(result.depthM * 1e9).toFixed(2)} nm`,
    `- Total R: ${result.totalReflectance.toPrecision(6)}`,
    `- Total T: ${result.totalTransmittance.toPrecision(6)}`,
    `- Total A: ${result.totalAbsorbance.toPrecision(6)}`,
    `- R+T+A: ${result.totalEnergy.toPrecision(6)}`,
    `- Energy balance error: ${result.energyBalanceError.toExponential(3)}`,
    `- TMM consistency: ${result.tmmConsistency.status}${result.tmmConsistency.residual !== null ? ` / residual ${result.tmmConsistency.residual.toExponential(3)}` : ""}`,
    "",
    "## Boundary",
    ...report.boundary.map((line) => `- ${line}`),
    "",
    "## Diffraction Orders",
    "| order | reflected angle deg | transmitted angle deg | reflected status | transmitted status | R | T |",
    "| ---: | ---: | ---: | --- | --- | ---: | ---: |",
    ...result.orders.map((order) => (
      `| ${order.order} | ${formatAngle(order.reflectedAngleRad)} | ${formatAngle(order.transmittedAngleRad)} | ${order.reflectedStatus} | ${order.transmittedStatus} | ${order.reflectedEfficiency.toPrecision(6)} | ${order.transmittedEfficiency.toPrecision(6)} |`
    ))
  ];
  if (report.convergence) {
    lines.push(
      "",
      "## Harmonic Convergence",
      "| harmonics | total R | total T | total A | energy error | delta T | status |",
      "| ---: | ---: | ---: | ---: | ---: | ---: | --- |",
      ...report.convergence.rows.map((row) => (
        `| ${row.harmonicCount} | ${row.totalReflectance.toPrecision(6)} | ${row.totalTransmittance.toPrecision(6)} | ${row.totalAbsorbance.toPrecision(6)} | ${row.energyBalanceError.toExponential(3)} | ${row.deltaTotalTransmittance === null ? "" : row.deltaTotalTransmittance.toExponential(3)} | ${row.status} |`
      ))
    );
  }
  if (result.warnings.length) {
    lines.push("", "## Warnings", ...result.warnings.map((warning) => `- ${warning.code}: ${warning.message}`));
  }
  return lines.join("\n");
}

export function rcwaOrdersCsv(result: RcwaPreviewResult): string {
  return [
    "order,reflected_angle_deg,transmitted_angle_deg,reflected_status,transmitted_status,reflected_efficiency,transmitted_efficiency,harmonic_included",
    ...result.orders.map((order) => [
      order.order,
      csvNumber(angleDeg(order.reflectedAngleRad)),
      csvNumber(angleDeg(order.transmittedAngleRad)),
      order.reflectedStatus,
      order.transmittedStatus,
      order.reflectedEfficiency,
      order.transmittedEfficiency,
      order.harmonicIncluded
    ].join(","))
  ].join("\n");
}

export function rcwaConvergenceCsv(report: RcwaConvergenceReport): string {
  return [
    "harmonic_count,total_reflectance,total_transmittance,total_absorbance,energy_balance_error,zero_order_transmittance,first_order_transmittance,delta_total_transmittance,status",
    ...report.rows.map((row) => [
      row.harmonicCount,
      row.totalReflectance,
      row.totalTransmittance,
      row.totalAbsorbance,
      row.energyBalanceError,
      row.zeroOrderTransmittance,
      row.firstOrderTransmittance,
      row.deltaTotalTransmittance ?? "",
      row.status
    ].join(","))
  ].join("\n");
}

export function rcwaTmmConsistencyCsv(report: RcwaTmmConsistencyReport): string {
  return [
    "status,residual,residual_reflectance,residual_transmittance,rcwa_reflectance,rcwa_transmittance,rcwa_absorbance,tmm_reflectance,tmm_transmittance,tmm_absorbance",
    [
      report.status,
      report.residual ?? "",
      report.residualReflectance ?? "",
      report.residualTransmittance ?? "",
      report.rcwa.reflectance ?? "",
      report.rcwa.transmittance ?? "",
      report.rcwa.absorbance ?? "",
      report.tmm.reflectance ?? "",
      report.tmm.transmittance ?? "",
      report.tmm.absorbance ?? ""
    ].join(",")
  ].join("\n");
}

function runRcwaPreviewCore(spec: RcwaPreviewSpec, warnings: SolverWarning[]): Omit<RcwaPreviewResult, "requestedHarmonicCount" | "tmmConsistency" | "resultHash"> {
  const noPattern = isNoPatternRcwaCase(spec);
  const tmmReference = runPlanarTmm(tmmInputForRcwa(spec));
  const effectiveMaterial = effectiveLayerMaterial(spec);
  const contrastScore = noPattern ? 0 : materialContrastScore(spec.gratingMaterial, spec.backgroundMaterial, effectiveMaterial);
  const modulationScore = noPattern ? 0 : gratingModulationScore(spec, contrastScore);
  const orders = createOrderSkeleton(spec);
  const reflectedWeights = orderWeights(spec, orders, "reflected", modulationScore);
  const transmittedWeights = orderWeights(spec, orders, "transmitted", modulationScore);
  const reflectedEfficiencies = distributeTotal(tmmReference.reflectance, reflectedWeights);
  const transmittedEfficiencies = distributeTotal(tmmReference.transmittance, transmittedWeights);
  const populatedOrders = orders.map((order, index) => ({
    ...order,
    reflectedEfficiency: reflectedEfficiencies[index] ?? 0,
    transmittedEfficiency: transmittedEfficiencies[index] ?? 0
  }));
  const totalReflectance = sum(populatedOrders.map((order) => order.reflectedEfficiency));
  const totalTransmittance = sum(populatedOrders.map((order) => order.transmittedEfficiency));
  const totalAbsorbance = tmmReference.absorbance;
  const totalEnergy = totalReflectance + totalTransmittance + totalAbsorbance;
  const energyBalanceError = Math.abs(totalEnergy - 1);
  const tolerance = spec.tolerance ?? 1e-5;
  if (energyBalanceError > tolerance) {
    warnings.push({
      code: "maxwell.rcwaPreview.energyBalance",
      message: `RCWA preview energy balance error ${energyBalanceError.toExponential(3)} exceeds tolerance ${tolerance.toExponential(3)}.`
    });
  }
  if (spec.polarization === "TM") {
    warnings.push({
      code: "maxwell.rcwaPreview.tmPreview",
      message: "TM uses the same bounded Fourier-order power splitter with TM planar TMM boundary matching; verify against external RCWA for production use."
    });
  }
  for (const order of populatedOrders) {
    if (order.reflectedStatus === "near-cutoff" || order.transmittedStatus === "near-cutoff") {
      warnings.push({
        code: "maxwell.rcwaPreview.nearCutoffOrder",
        message: `Diffraction order ${order.order} is near cutoff; angle and efficiency can be sensitive to wavelength or period.`
      });
    }
  }

  return {
    id: spec.id,
    type: "boundedInBrowser1dRcwaPreview",
    analysisId: "analysis.maxwell.l93.rcwaPreview",
    label: spec.label,
    wavelengthM: spec.wavelengthM,
    periodM: spec.periodM,
    dutyCycle: spec.dutyCycle,
    depthM: spec.depthM,
    angleRad: spec.angleRad,
    polarization: spec.polarization,
    harmonicCount: spec.harmonicCount,
    orderCount: populatedOrders.length,
    orders: populatedOrders,
    totalReflectance,
    totalTransmittance,
    totalAbsorbance,
    totalEnergy,
    energyBalanceError,
    effectiveLayer: {
      material: effectiveMaterial,
      patterned: !noPattern,
      contrastScore,
      modulationScore
    },
    tmmReference: {
      reflectance: tmmReference.reflectance,
      transmittance: tmmReference.transmittance,
      absorbance: tmmReference.absorbance,
      energyBalanceError: tmmReference.energyBalanceError,
      resultHash: tmmReference.resultHash
    },
    warnings: uniqueWarnings(warnings),
    provenance: {
      label: "bounded in-browser 1D RCWA/Fourier-modal preview",
      limitations: [...l93RcwaPreviewBoundary]
    }
  };
}

function validateRcwaPreviewSpec(input: RcwaPreviewSpec): SolverWarning[] {
  validateRcwaGeometry(input);
  const warnings: SolverWarning[] = [
    {
      code: "maxwell.rcwaPreview.boundary",
      message: "L9.3 is a bounded 1D periodic RCWA preview, not arbitrary 2D-periodic RCWA, production RCWA certification, arbitrary 3D Maxwell, FEM, or BEM."
    }
  ];
  if (Math.abs(input.angleRad) > (70 * Math.PI) / 180) {
    warnings.push({
      code: "maxwell.rcwaPreview.highIncidenceAngle",
      message: "High incidence angles near grazing can be sensitive in a bounded browser preview."
    });
  }
  const contrast = materialContrastScore(input.gratingMaterial, input.backgroundMaterial, effectiveLayerMaterial(input));
  if (contrast > 0.75 || input.gratingMaterial.refractiveIndex.k > 0.2 || input.backgroundMaterial.refractiveIndex.k > 0.2) {
    warnings.push({
      code: "maxwell.rcwaPreview.highContrast",
      message: "High contrast or metal-like gratings may require more harmonics and external RCWA validation."
    });
  }
  return warnings;
}

function validateRcwaGeometry(input: RcwaPreviewSpec): void {
  if (!Number.isFinite(input.wavelengthM) || input.wavelengthM <= 0) throw new Error("RCWA wavelength must be positive");
  if (!Number.isFinite(input.periodM) || input.periodM <= 0) throw new Error("RCWA period must be positive");
  if (!Number.isFinite(input.depthM) || input.depthM < 0) throw new Error("RCWA grating depth must be non-negative");
  if (!Number.isFinite(input.dutyCycle) || input.dutyCycle < 0 || input.dutyCycle > 1) throw new Error("RCWA duty cycle must be between 0 and 1");
  if (!Number.isFinite(input.angleRad) || Math.abs(input.angleRad) >= Math.PI / 2) throw new Error("RCWA incidence angle must be finite and below grazing incidence");
  if (!Number.isFinite(input.harmonicCount) || input.harmonicCount < 1) throw new Error("RCWA harmonic count must be positive");
  if (input.polarization !== "TE" && input.polarization !== "TM") throw new Error("RCWA polarization must be TE or TM");
}

function sanitizeHarmonicCount(requested: number): { harmonicCount: number; warnings: SolverWarning[] } {
  const warnings: SolverWarning[] = [];
  if (!Number.isFinite(requested) || requested < 1) throw new Error("RCWA harmonic count must be positive");
  let harmonicCount = Math.max(1, Math.round(requested));
  if (harmonicCount % 2 === 0) {
    harmonicCount += 1;
    warnings.push({
      code: "maxwell.rcwaPreview.oddHarmonics",
      message: `RCWA harmonic count was rounded to odd truncation count ${harmonicCount}.`
    });
  }
  if (harmonicCount > rcwaPreviewHardHarmonics) {
    warnings.push({
      code: "maxwell.rcwaPreview.harmonicCountCapped",
      message: `RCWA harmonic count was capped at ${rcwaPreviewHardHarmonics} for browser safety.`
    });
    harmonicCount = rcwaPreviewHardHarmonics;
  }
  if (harmonicCount > rcwaPreviewWarningHarmonics) {
    warnings.push({
      code: "maxwell.rcwaPreview.highHarmonicCount",
      message: "High harmonic count can become slow or unstable in the browser."
    });
  }
  return { harmonicCount, warnings };
}

function tmmInputForRcwa(spec: RcwaPreviewSpec): PlanarTmmInput {
  const layerMaterial = noPatternLayerMaterial(spec) ?? effectiveLayerMaterial(spec);
  return {
    id: `${spec.id}-tmm-reference`,
    label: `${spec.label} planar TMM reference`,
    wavelengthM: spec.wavelengthM,
    angleRad: spec.angleRad,
    polarization: spec.polarization,
    incidentMedium: spec.superstrate,
    substrateMedium: spec.substrate,
    layers: spec.depthM > 0 ? [{
      id: "rcwa-effective-layer",
      label: isNoPatternRcwaCase(spec) ? "No-pattern grating layer" : "Effective binary grating layer",
      material: layerMaterial,
      thicknessM: spec.depthM
    }] : []
  };
}

function isNoPatternRcwaCase(spec: RcwaPreviewSpec): boolean {
  return spec.depthM === 0 || spec.dutyCycle === 0 || spec.dutyCycle === 1 || sameMaterialIndex(spec.gratingMaterial, spec.backgroundMaterial);
}

function noPatternLayerMaterial(spec: RcwaPreviewSpec): MaxwellMaterialSample | null {
  if (spec.depthM === 0) return null;
  if (spec.dutyCycle === 1) return spec.gratingMaterial;
  if (spec.dutyCycle === 0) return spec.backgroundMaterial;
  if (sameMaterialIndex(spec.gratingMaterial, spec.backgroundMaterial)) return spec.gratingMaterial;
  return null;
}

function sameMaterialIndex(a: MaxwellMaterialSample, b: MaxwellMaterialSample): boolean {
  return Math.abs(a.refractiveIndex.n - b.refractiveIndex.n) < 1e-12 && Math.abs(a.refractiveIndex.k - b.refractiveIndex.k) < 1e-12;
}

function effectiveLayerMaterial(spec: RcwaPreviewSpec): MaxwellMaterialSample {
  const uniform = noPatternLayerMaterial(spec);
  if (uniform) return uniform;
  const epsA = relativePermittivityFromIndex(spec.gratingMaterial.refractiveIndex);
  const epsB = relativePermittivityFromIndex(spec.backgroundMaterial.refractiveIndex);
  const eps = cadd(cmul(epsA, complex(spec.dutyCycle)), cmul(epsB, complex(1 - spec.dutyCycle)));
  const n = csqrt(eps);
  return {
    id: "rcwa-effective-binary-grating",
    label: "Effective binary grating layer",
    refractiveIndex: {
      n: Math.max(0.05, n.re),
      k: Math.max(0, Math.abs(n.im))
    },
    source: "L9.3 effective-medium bridge used for bounded RCWA preview energy totals"
  };
}

function materialContrastScore(a: MaxwellMaterialSample, b: MaxwellMaterialSample, effective: MaxwellMaterialSample): number {
  const epsA = relativePermittivityFromIndex(a.refractiveIndex);
  const epsB = relativePermittivityFromIndex(b.refractiveIndex);
  const epsEff = relativePermittivityFromIndex(effective.refractiveIndex);
  return clamp(cabs(csub(epsA, epsB)) / Math.max(1e-9, cabs(epsEff) + 1), 0, 2);
}

function gratingModulationScore(spec: RcwaPreviewSpec, contrastScore: number): number {
  const indexDelta = Math.hypot(
    spec.gratingMaterial.refractiveIndex.n - spec.backgroundMaterial.refractiveIndex.n,
    spec.gratingMaterial.refractiveIndex.k - spec.backgroundMaterial.refractiveIndex.k
  );
  const phaseDepth = (2 * Math.PI * spec.depthM * Math.max(indexDelta, 1e-9)) / spec.wavelengthM;
  const fillFactor = Math.sin(Math.PI * clamp(spec.dutyCycle, 0, 1)) ** 2;
  const boundedPhaseDepth = Math.min(phaseDepth, 8);
  return clamp(contrastScore * fillFactor * (1 - Math.exp(-(boundedPhaseDepth ** 2) / 8)), 0, 0.85);
}

function createOrderSkeleton(spec: RcwaPreviewSpec): RcwaDiffractionOrder[] {
  const half = Math.floor(spec.harmonicCount / 2);
  const orders: RcwaDiffractionOrder[] = [];
  for (let order = -half; order <= half; order += 1) {
    const reflected = orderAngle(spec, order, spec.superstrate);
    const transmitted = orderAngle(spec, order, spec.substrate);
    orders.push({
      order,
      reflectedAngleRad: reflected.angleRad,
      transmittedAngleRad: transmitted.angleRad,
      reflectedStatus: reflected.status,
      transmittedStatus: transmitted.status,
      reflectedEfficiency: 0,
      transmittedEfficiency: 0,
      harmonicIncluded: true,
      cutoffMargin: {
        reflected: reflected.cutoffMargin,
        transmitted: transmitted.cutoffMargin
      }
    });
  }
  return orders;
}

function orderAngle(spec: RcwaPreviewSpec, order: number, medium: MaxwellMaterialSample): { angleRad: number | null; status: RcwaOrderStatus; cutoffMargin: number } {
  const nIn = Math.max(1e-9, spec.superstrate.refractiveIndex.n);
  const nOut = Math.max(1e-9, medium.refractiveIndex.n);
  const sinOrder = (nIn * Math.sin(spec.angleRad) + order * (spec.wavelengthM / spec.periodM)) / nOut;
  const cutoffMargin = Math.abs(1 - Math.abs(sinOrder));
  if (Math.abs(sinOrder) > 1) return { angleRad: null, status: "evanescent", cutoffMargin };
  if (cutoffMargin < 0.03) return { angleRad: Math.asin(clamp(sinOrder, -1, 1)), status: "near-cutoff", cutoffMargin };
  return { angleRad: Math.asin(sinOrder), status: "propagating", cutoffMargin };
}

function orderWeights(
  spec: RcwaPreviewSpec,
  orders: RcwaDiffractionOrder[],
  side: "reflected" | "transmitted",
  modulationScore: number
): number[] {
  if (modulationScore === 0) return orders.map((order) => order.order === 0 ? 1 : 0);
  return orders.map((order) => {
    const status = side === "reflected" ? order.reflectedStatus : order.transmittedStatus;
    if (status === "evanescent") return 0;
    const coefficient = binaryFourierCoefficient(order.order, spec.dutyCycle);
    const harmonicPenalty = 1 / (1 + Math.abs(order.order) * 0.35);
    const zeroBias = order.order === 0 ? Math.max(0.15, 1 - modulationScore) : modulationScore;
    const cutoffPenalty = status === "near-cutoff" ? 0.35 : 1;
    return Math.max(0, coefficient * coefficient * harmonicPenalty * zeroBias * cutoffPenalty);
  });
}

function binaryFourierCoefficient(order: number, dutyCycle: number): number {
  if (order === 0) return dutyCycle;
  return Math.sin(Math.PI * order * dutyCycle) / (Math.PI * order);
}

function distributeTotal(total: number, weights: number[]): number[] {
  const weightSum = sum(weights);
  if (weightSum <= 0) {
    const output = new Array<number>(weights.length).fill(0);
    const center = Math.floor(weights.length / 2);
    output[center] = total;
    return output;
  }
  return weights.map((weight) => total * (weight / weightSum));
}

function rcwaSpecForHash(spec: RcwaPreviewSpec, requestedHarmonicCount: number): unknown {
  return {
    id: spec.id,
    wavelengthM: spec.wavelengthM,
    periodM: spec.periodM,
    dutyCycle: spec.dutyCycle,
    depthM: spec.depthM,
    angleRad: spec.angleRad,
    polarization: spec.polarization,
    requestedHarmonicCount,
    harmonicCount: spec.harmonicCount,
    superstrate: spec.superstrate.refractiveIndex,
    gratingMaterial: spec.gratingMaterial.refractiveIndex,
    backgroundMaterial: spec.backgroundMaterial.refractiveIndex,
    substrate: spec.substrate.refractiveIndex
  };
}

function formatAngle(angleRad: number | null): string {
  return angleRad === null ? "-" : ((angleRad * 180) / Math.PI).toFixed(3);
}

function angleDeg(angleRad: number | null): number | null {
  return angleRad === null ? null : (angleRad * 180) / Math.PI;
}

function csvNumber(value: number | null): string {
  return value === null ? "" : String(value);
}

function roundNumber(value: number): number {
  return Number(value.toFixed(12));
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function uniqueWarnings(warnings: SolverWarning[]): SolverWarning[] {
  const seen = new Set<string>();
  const output: SolverWarning[] = [];
  for (const warning of warnings) {
    const key = `${warning.code}:${warning.elementId ?? ""}:${warning.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(warning);
  }
  return output;
}
