import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";

export type L72TargetKind = "dot-grid" | "checkerboard" | "line-grid";
export type L72FitModel = "similarity" | "affine" | "radial-k1" | "radial-k1-k2";
export type L72GeometryStatus = "pass" | "warning" | "fail";

export type L72GeometryPoint = {
  id: string;
  row?: number;
  col?: number;
  xPx: number;
  yPx: number;
  xWorldUm?: number;
  yWorldUm?: number;
  idealXPx?: number;
  idealYPx?: number;
};

export type L72GeometricTargetInput = {
  id?: string;
  label?: string;
  kind?: L72TargetKind;
  widthPx?: number;
  heightPx?: number;
  rows?: number;
  columns?: number;
  spacingUm?: number;
  pixelPitchUm?: number;
  rotationDeg?: number;
  translateXPx?: number;
  translateYPx?: number;
  radialK1?: number;
  radialK2?: number;
  dotRadiusPx?: number;
  contrast?: number;
};

export type L72GeometricTarget = {
  schema: "emmicro.l72.geometricTarget.v1";
  appVersion: "L7.2 Geometric Calibration / Distortion & Pixel-Scale Workbench";
  id: string;
  label: string;
  kind: L72TargetKind;
  image: {
    widthPx: number;
    heightPx: number;
    pixels: number[];
    imageHash: string;
  };
  settings: Required<Omit<L72GeometricTargetInput, "id" | "label" | "kind">> & {
    kind: L72TargetKind;
  };
  points: L72GeometryPoint[];
  warnings: SolverWarning[];
  limitations: string[];
  resultHash: string;
};

export type L72PointCsvImportOptions = {
  id?: string;
  label?: string;
  rows?: number;
  columns?: number;
  spacingUm?: number;
};

export type L72PointSet = {
  schema: "emmicro.l72.pointSet.v1";
  id: string;
  label: string;
  points: L72GeometryPoint[];
  sourceHash: string;
  warnings: SolverWarning[];
  limitations: string[];
};

export type L72ResidualVector = {
  pointId: string;
  row?: number;
  col?: number;
  measuredXPx: number;
  measuredYPx: number;
  fittedXPx: number;
  fittedYPx: number;
  dxPx: number;
  dyPx: number;
  residualPx: number;
  residualUm: number | null;
  radiusNorm: number;
  region: "center" | "corner" | "field";
};

export type L72GeometricFitSpec = {
  model: L72FitModel;
  residualRmsWarnPx: number;
  residualRmsFailPx: number;
  maxResidualWarnPx: number;
  maxResidualFailPx: number;
  scaleAnisotropyWarn: number;
  cornerCenterRatioWarn: number;
};

export type L72GeometricFitResult = {
  schema: "emmicro.l72.geometricFit.v1";
  appVersion: "L7.2 Geometric Calibration / Distortion & Pixel-Scale Workbench";
  id: string;
  label: string;
  model: L72FitModel;
  status: L72GeometryStatus;
  pointSetHash: string;
  pointCount: number;
  transform: {
    a: number;
    b: number;
    c: number;
    d: number;
    txPx: number;
    tyPx: number;
  };
  radial: {
    enabled: boolean;
    centerXPx: number | null;
    centerYPx: number | null;
    radiusNormPx: number | null;
    k1: number | null;
    k2: number | null;
  };
  metrics: {
    pixelScaleXUmPerPx: number | null;
    pixelScaleYUmPerPx: number | null;
    meanPixelScaleUmPerPx: number | null;
    rotationDeg: number | null;
    shear: number | null;
    scaleAnisotropy: number | null;
    rmsResidualPx: number;
    rmsResidualUm: number | null;
    maxResidualPx: number;
    maxResidualUm: number | null;
    centerResidualAveragePx: number | null;
    cornerResidualAveragePx: number | null;
    cornerCenterResidualRatio: number | null;
    fieldDistortionPercent: number | null;
    straightLineBowPx: number | null;
  };
  residuals: L72ResidualVector[];
  correctedPoints: L72GeometryPoint[];
  issues: Array<{ code: string; severity: "warning" | "fail"; message: string; value?: number | null; threshold?: number }>;
  warnings: SolverWarning[];
  limitations: string[];
  resultHash: string;
};

export type L72GeometryComparisonResult = {
  schema: "emmicro.l72.geometryComparison.v1";
  appVersion: "L7.2 Geometric Calibration / Distortion & Pixel-Scale Workbench";
  id: string;
  label: string;
  measuredHash: string;
  simulatedHash: string;
  metricDeltas: Array<{ id: string; label: string; measured: number | null; simulated: number | null; delta: number | null }>;
  residualRows: Array<{ pointId: string; measuredResidualPx: number | null; simulatedResidualPx: number | null; deltaPx: number | null }>;
  rmsResidualDeltaPx: number | null;
  maxResidualDeltaPx: number | null;
  matchedPointCount: number;
  warnings: SolverWarning[];
  limitations: string[];
  resultHash: string;
};

export const l72GeometricLimitations = [
  "L7.2 geometric calibration is diagnostic 2D image-geometry analysis only; it is not certified camera calibration, ISO/Imatest-equivalent calibration, or lab-accredited metrology.",
  "Similarity, affine, and radial coefficients are single-image diagnostic fits; they are not full camera resectioning, multi-view bundle adjustment, 3D pose calibration, stereo calibration, or a microscope digital twin.",
  "The workbench does not execute full 3D Maxwell, FDTD, FEM, BEM, RCWA, pixel-level sensor-stack EM, hardware control, or manufacturing certification workflows."
] as const;

export function defaultL72GeometricFitSpec(): L72GeometricFitSpec {
  return {
    model: "similarity",
    residualRmsWarnPx: 0.2,
    residualRmsFailPx: 0.75,
    maxResidualWarnPx: 1,
    maxResidualFailPx: 2.5,
    scaleAnisotropyWarn: 0.005,
    cornerCenterRatioWarn: 2
  };
}

export function generateGeometricCalibrationTarget(input: L72GeometricTargetInput = {}): L72GeometricTarget {
  const kind = input.kind ?? "dot-grid";
  const widthPx = integerInRange(input.widthPx ?? 360, 96, 2048);
  const heightPx = integerInRange(input.heightPx ?? 260, 96, 2048);
  const rows = integerInRange(input.rows ?? 7, 2, 80);
  const columns = integerInRange(input.columns ?? 9, 2, 80);
  const spacingUm = Math.max(0.001, finite(input.spacingUm ?? 50, 50));
  const pixelPitchUm = Math.max(0.001, finite(input.pixelPitchUm ?? 5, 5));
  const rotationDeg = finite(input.rotationDeg ?? 2, 2);
  const translateXPx = finite(input.translateXPx ?? 0, 0);
  const translateYPx = finite(input.translateYPx ?? 0, 0);
  const radialK1 = finite(input.radialK1 ?? 0, 0);
  const radialK2 = finite(input.radialK2 ?? 0, 0);
  const dotRadiusPx = Math.max(1, finite(input.dotRadiusPx ?? 3, 3));
  const contrast = clamp(finite(input.contrast ?? 0.9, 0.9), 0, 1);
  const imageCenter = { x: widthPx / 2 + translateXPx, y: heightPx / 2 + translateYPx };
  const points: L72GeometryPoint[] = [];
  const c = Math.cos(rad(rotationDeg));
  const s = Math.sin(rad(rotationDeg));
  const widthWorldUm = (columns - 1) * spacingUm;
  const heightWorldUm = (rows - 1) * spacingUm;
  const radiusNormPx = Math.max(1, Math.hypot(widthWorldUm / pixelPitchUm, heightWorldUm / pixelPitchUm) * 0.5);
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const xWorldUm = col * spacingUm - widthWorldUm / 2;
      const yWorldUm = row * spacingUm - heightWorldUm / 2;
      const idealXPx = imageCenter.x + (xWorldUm / pixelPitchUm) * c - (yWorldUm / pixelPitchUm) * s;
      const idealYPx = imageCenter.y + (xWorldUm / pixelPitchUm) * s + (yWorldUm / pixelPitchUm) * c;
      const distorted = applyRadialToPixel(idealXPx, idealYPx, imageCenter.x, imageCenter.y, radiusNormPx, radialK1, radialK2);
      points.push({
        id: `p-${row}-${col}`,
        row,
        col,
        xPx: round(distorted.x),
        yPx: round(distorted.y),
        xWorldUm: round(xWorldUm),
        yWorldUm: round(yWorldUm),
        idealXPx: round(idealXPx),
        idealYPx: round(idealYPx)
      });
    }
  }
  const pixels = renderTargetPixels({ kind, widthPx, heightPx, points, dotRadiusPx, contrast });
  const imageHash = fnv1a64(stableStringify({ widthPx, heightPx, sample: sampleForHash(pixels) }));
  const warnings = targetWarnings(points, widthPx, heightPx);
  const partial = {
    schema: "emmicro.l72.geometricTarget.v1" as const,
    appVersion: "L7.2 Geometric Calibration / Distortion & Pixel-Scale Workbench" as const,
    id: input.id ?? "l72-geometric-target",
    label: input.label ?? "L7.2 generated geometric calibration target",
    kind,
    image: { widthPx, heightPx, pixels, imageHash },
    settings: {
      kind,
      widthPx,
      heightPx,
      rows,
      columns,
      spacingUm,
      pixelPitchUm,
      rotationDeg,
      translateXPx,
      translateYPx,
      radialK1,
      radialK2,
      dotRadiusPx,
      contrast
    },
    points,
    warnings,
    limitations: [...l72GeometricLimitations]
  };
  return { ...partial, resultHash: fnv1a64(stableStringify(resultForHash(partial))) };
}

export function parseGeometricPointCsv(text: string, options: L72PointCsvImportOptions = {}): L72PointSet {
  const rows = parseCsvRows(text);
  if (rows.length < 2) throw new Error("geometric point CSV is empty");
  const headers = rows[0]!.map((header) => normalizeHeader(header));
  const required = ["id", "x_px", "y_px"];
  for (const column of required) {
    if (!headers.includes(column)) throw new Error(`geometric point CSV missing required column: ${column}`);
  }
  const index = (name: string) => headers.indexOf(name);
  const idIndex = index("id");
  const xIndex = index("x_px");
  const yIndex = index("y_px");
  const xWorldIndex = index("x_world_um");
  const yWorldIndex = index("y_world_um");
  const rowIndex = index("row");
  const colIndex = index("col");
  const warnings: SolverWarning[] = [];
  const seen = new Set<string>();
  const points = rows.slice(1).filter((row) => row.some((cell) => cell.trim())).map((row, pointIndex) => {
    const id = row[idIndex]?.trim() || `p-${pointIndex}`;
    if (seen.has(id)) {
      warnings.push({ code: "l72.points.duplicateId", message: `Duplicate point id '${id}' was imported.` });
    }
    seen.add(id);
    const parsedRow = optionalInteger(row[rowIndex]);
    const parsedCol = optionalInteger(row[colIndex]);
    const point: L72GeometryPoint = {
      id,
      xPx: requiredNumber(row[xIndex], `x_px row ${pointIndex + 2}`),
      yPx: requiredNumber(row[yIndex], `y_px row ${pointIndex + 2}`),
      row: parsedRow,
      col: parsedCol,
      xWorldUm: optionalNumber(row[xWorldIndex]),
      yWorldUm: optionalNumber(row[yWorldIndex])
    };
    if ((point.xWorldUm === undefined || point.yWorldUm === undefined) && parsedRow !== undefined && parsedCol !== undefined && options.spacingUm !== undefined) {
      point.xWorldUm = round(parsedCol * options.spacingUm);
      point.yWorldUm = round(parsedRow * options.spacingUm);
    }
    return point;
  });
  if (points.length < 3) {
    warnings.push({ code: "l72.points.tooFew", message: "Fewer than three points were imported; similarity fitting will be under-constrained." });
  }
  if (points.some((point) => point.xWorldUm === undefined || point.yWorldUm === undefined)) {
    warnings.push({ code: "l72.points.worldCoordinatesMissing", message: "Some points are missing world coordinates; fit models require x_world_um and y_world_um or row/col with spacing." });
  }
  return {
    schema: "emmicro.l72.pointSet.v1",
    id: options.id ?? "l72-imported-points",
    label: options.label ?? "L7.2 imported geometric points",
    points,
    sourceHash: fnv1a64(stableStringify({ headers, points: points.map(pointForHash) })),
    warnings,
    limitations: [...l72GeometricLimitations]
  };
}

export function pointSetFromTarget(target: L72GeometricTarget): L72PointSet {
  return {
    schema: "emmicro.l72.pointSet.v1",
    id: `${target.id}-points`,
    label: `${target.label} points`,
    points: target.points,
    sourceHash: target.resultHash,
    warnings: target.warnings,
    limitations: target.limitations
  };
}

export function fitGeometricCalibration({
  id = "l72-geometric-fit",
  label = "L7.2 geometric calibration fit",
  points,
  model = "similarity",
  spec = { ...defaultL72GeometricFitSpec(), model }
}: {
  id?: string;
  label?: string;
  points: L72GeometryPoint[] | L72PointSet | L72GeometricTarget;
  model?: L72FitModel;
  spec?: L72GeometricFitSpec;
}): L72GeometricFitResult {
  const normalized = normalizePointInput(points);
  const warnings: SolverWarning[] = [...normalized.warnings];
  const usable = normalized.points.filter(hasWorld);
  if (usable.length < 3) throw new Error("At least three points with world coordinates are required for geometric calibration.");
  if ((model === "affine" || model.startsWith("radial")) && usable.length < 4) {
    warnings.push({ code: "l72.fit.lowPointCount", message: "Affine/radial fit has fewer than four points; diagnostic fit may be unstable." });
  }
  const baseTransform = model === "affine" ? fitAffineTransform(usable) : fitSimilarityTransform(usable);
  const radial = model.startsWith("radial") ? fitRadialDiagnostic(usable, baseTransform, model === "radial-k1-k2") : disabledRadial();
  const residuals = residualVectors(usable, baseTransform, radial);
  const correctedPoints = residuals.map((residual) => {
    const source = usable.find((point) => point.id === residual.pointId)!;
    return {
      ...source,
      xPx: round(residual.fittedXPx),
      yPx: round(residual.fittedYPx)
    };
  });
  const metrics = fitMetrics(baseTransform, residuals, radial);
  const issues = fitIssues(metrics, spec);
  const status: L72GeometryStatus = issues.some((issue) => issue.severity === "fail") ? "fail" : issues.some((issue) => issue.severity === "warning") || warnings.length ? "warning" : "pass";
  const partial = {
    schema: "emmicro.l72.geometricFit.v1" as const,
    appVersion: "L7.2 Geometric Calibration / Distortion & Pixel-Scale Workbench" as const,
    id,
    label,
    model,
    status,
    pointSetHash: normalized.hash,
    pointCount: usable.length,
    transform: baseTransform,
    radial,
    metrics,
    residuals,
    correctedPoints,
    issues,
    warnings,
    limitations: [...l72GeometricLimitations]
  };
  return { ...partial, resultHash: fnv1a64(stableStringify(resultForHash(partial))) };
}

export function compareGeometricCalibrations({
  id = "l72-geometric-comparison",
  label = "L7.2 measured vs simulated geometric calibration",
  measured,
  simulated
}: {
  id?: string;
  label?: string;
  measured: L72GeometricFitResult;
  simulated: L72GeometricFitResult;
}): L72GeometryComparisonResult {
  const metricDefs: Array<[string, string, keyof L72GeometricFitResult["metrics"]]> = [
    ["meanPixelScaleUmPerPx", "Mean pixel scale", "meanPixelScaleUmPerPx"],
    ["rotationDeg", "Rotation", "rotationDeg"],
    ["shear", "Shear", "shear"],
    ["rmsResidualPx", "RMS residual px", "rmsResidualPx"],
    ["maxResidualPx", "Max residual px", "maxResidualPx"],
    ["fieldDistortionPercent", "Field distortion percent", "fieldDistortionPercent"]
  ];
  const metricDeltas = metricDefs.map(([id, labelText, key]) => {
    const a = nullableNumber(measured.metrics[key]);
    const b = nullableNumber(simulated.metrics[key]);
    return { id, label: labelText, measured: a, simulated: b, delta: a !== null && b !== null ? round(a - b) : null };
  });
  metricDeltas.push({
    id: "radialK1",
    label: "Radial k1",
    measured: measured.radial.k1,
    simulated: simulated.radial.k1,
    delta: measured.radial.k1 !== null && simulated.radial.k1 !== null ? round(measured.radial.k1 - simulated.radial.k1) : null
  });
  const simulatedById = new Map(simulated.residuals.map((residual) => [residual.pointId, residual]));
  const residualRows = measured.residuals.flatMap((residual) => {
    const match = simulatedById.get(residual.pointId);
    if (!match) return [];
    return [{
      pointId: residual.pointId,
      measuredResidualPx: residual.residualPx,
      simulatedResidualPx: match.residualPx,
      deltaPx: round(residual.residualPx - match.residualPx)
    }];
  });
  const warnings: SolverWarning[] = [];
  if (residualRows.length === 0) {
    warnings.push({ code: "l72.comparison.noMatchingPoints", message: "No matching point ids were available for measured-vs-simulated geometric comparison." });
  }
  const partial = {
    schema: "emmicro.l72.geometryComparison.v1" as const,
    appVersion: "L7.2 Geometric Calibration / Distortion & Pixel-Scale Workbench" as const,
    id,
    label,
    measuredHash: measured.resultHash,
    simulatedHash: simulated.resultHash,
    metricDeltas,
    residualRows,
    rmsResidualDeltaPx: round(measured.metrics.rmsResidualPx - simulated.metrics.rmsResidualPx),
    maxResidualDeltaPx: round(measured.metrics.maxResidualPx - simulated.metrics.maxResidualPx),
    matchedPointCount: residualRows.length,
    warnings,
    limitations: [...l72GeometricLimitations]
  };
  return { ...partial, resultHash: fnv1a64(stableStringify(resultForHash(partial))) };
}

export function geometricPointsCsv(points: L72GeometryPoint[] | L72GeometricTarget | L72PointSet): string {
  const normalized = Array.isArray(points) ? points : points.points;
  return [
    "id,row,col,x_px,y_px,x_world_um,y_world_um,ideal_x_px,ideal_y_px",
    ...normalized.map((point) => [
      point.id,
      point.row ?? "",
      point.col ?? "",
      point.xPx,
      point.yPx,
      point.xWorldUm ?? "",
      point.yWorldUm ?? "",
      point.idealXPx ?? "",
      point.idealYPx ?? ""
    ].map(csvEscape).join(","))
  ].join("\n");
}

export function geometricResidualsCsv(result: L72GeometricFitResult): string {
  return [
    "point_id,row,col,measured_x_px,measured_y_px,fitted_x_px,fitted_y_px,dx_px,dy_px,residual_px,residual_um,region",
    ...result.residuals.map((residual) => [
      residual.pointId,
      residual.row ?? "",
      residual.col ?? "",
      residual.measuredXPx,
      residual.measuredYPx,
      residual.fittedXPx,
      residual.fittedYPx,
      residual.dxPx,
      residual.dyPx,
      residual.residualPx,
      residual.residualUm ?? "",
      residual.region
    ].map(csvEscape).join(","))
  ].join("\n");
}

export function distortionMapCsv(result: L72GeometricFitResult): string {
  return [
    "point_id,radius_norm,residual_px,dx_px,dy_px",
    ...result.residuals.map((residual) => [residual.pointId, residual.radiusNorm, residual.residualPx, residual.dxPx, residual.dyPx].map(csvEscape).join(","))
  ].join("\n");
}

export function geometricComparisonCsv(result: L72GeometryComparisonResult): string {
  return [
    "kind,id,measured,simulated,delta",
    ...result.metricDeltas.map((metric) => ["metric", metric.id, metric.measured ?? "", metric.simulated ?? "", metric.delta ?? ""].map(csvEscape).join(",")),
    ...result.residualRows.map((row) => ["point", row.pointId, row.measuredResidualPx ?? "", row.simulatedResidualPx ?? "", row.deltaPx ?? ""].map(csvEscape).join(","))
  ].join("\n");
}

export function geometricCalibrationReportJson(result: L72GeometricFitResult, comparison?: L72GeometryComparisonResult): string {
  return JSON.stringify({ result, comparison: comparison ?? null }, null, 2);
}

export function geometricCalibrationReportMarkdown(result: L72GeometricFitResult, comparison?: L72GeometryComparisonResult): string {
  return [
    `# ${result.label}`,
    "",
    `Status: ${result.status.toUpperCase()}`,
    `Model: ${result.model}`,
    `Result hash: ${result.resultHash}`,
    "",
    "## Pixel Scale And Geometry",
    `- Pixel scale X: ${formatNullable(result.metrics.pixelScaleXUmPerPx)} um/px`,
    `- Pixel scale Y: ${formatNullable(result.metrics.pixelScaleYUmPerPx)} um/px`,
    `- Mean pixel scale: ${formatNullable(result.metrics.meanPixelScaleUmPerPx)} um/px`,
    `- Rotation: ${formatNullable(result.metrics.rotationDeg)} deg`,
    `- Shear/skew: ${formatNullable(result.metrics.shear)}`,
    `- Radial k1/k2: ${formatNullable(result.radial.k1)} / ${formatNullable(result.radial.k2)}`,
    "",
    "## Residuals",
    `- RMS residual: ${result.metrics.rmsResidualPx.toPrecision(6)} px`,
    `- Max residual: ${result.metrics.maxResidualPx.toPrecision(6)} px`,
    `- Center residual average: ${formatNullable(result.metrics.centerResidualAveragePx)} px`,
    `- Corner residual average: ${formatNullable(result.metrics.cornerResidualAveragePx)} px`,
    `- Field distortion: ${formatNullable(result.metrics.fieldDistortionPercent)}%`,
    "",
    "## Comparison",
    comparison ? `- Matched points: ${comparison.matchedPointCount}; RMS delta: ${formatNullable(comparison.rmsResidualDeltaPx)} px` : "- Not attached",
    "",
    "## Issues",
    ...(result.issues.length ? result.issues.map((issue) => `- ${issue.severity.toUpperCase()}: ${issue.message}`) : ["- none"]),
    "",
    "## Limitations",
    ...result.limitations.map((limitation) => `- ${limitation}`)
  ].join("\n");
}

function fitSimilarityTransform(points: Array<L72GeometryPoint & { xWorldUm: number; yWorldUm: number }>): L72GeometricFitResult["transform"] {
  const meanWorld = meanPoint(points.map((point) => ({ x: point.xWorldUm, y: point.yWorldUm })));
  const meanPixel = meanPoint(points.map((point) => ({ x: point.xPx, y: point.yPx })));
  let den = 0;
  let aNum = 0;
  let bNum = 0;
  for (const point of points) {
    const x = point.xWorldUm - meanWorld.x;
    const y = point.yWorldUm - meanWorld.y;
    const px = point.xPx - meanPixel.x;
    const py = point.yPx - meanPixel.y;
    den += x * x + y * y;
    aNum += x * px + y * py;
    bNum += x * py - y * px;
  }
  if (Math.abs(den) < 1e-12) throw new Error("World points are degenerate; cannot fit similarity transform.");
  const a = aNum / den;
  const b = bNum / den;
  return {
    a: round(a),
    b: round(-b),
    c: round(b),
    d: round(a),
    txPx: round(meanPixel.x - a * meanWorld.x + b * meanWorld.y),
    tyPx: round(meanPixel.y - b * meanWorld.x - a * meanWorld.y)
  };
}

function fitAffineTransform(points: Array<L72GeometryPoint & { xWorldUm: number; yWorldUm: number }>): L72GeometricFitResult["transform"] {
  const ata = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const atx = [0, 0, 0];
  const aty = [0, 0, 0];
  for (const point of points) {
    const row = [point.xWorldUm, point.yWorldUm, 1];
    for (let r = 0; r < 3; r += 1) {
      atx[r]! += row[r]! * point.xPx;
      aty[r]! += row[r]! * point.yPx;
      for (let c = 0; c < 3; c += 1) ata[r]![c]! += row[r]! * row[c]!;
    }
  }
  const x = solve3(ata, atx);
  const y = solve3(ata, aty);
  return { a: round(x[0]), b: round(x[1]), c: round(y[0]), d: round(y[1]), txPx: round(x[2]), tyPx: round(y[2]) };
}

function fitRadialDiagnostic(points: Array<L72GeometryPoint & { xWorldUm: number; yWorldUm: number }>, transform: L72GeometricFitResult["transform"], includeK2: boolean): L72GeometricFitResult["radial"] {
  const idealPixels = points.map((point) => point.idealXPx !== undefined && point.idealYPx !== undefined ? { x: point.idealXPx, y: point.idealYPx } : applyTransform(transform, point.xWorldUm, point.yWorldUm));
  const center = meanPoint(idealPixels);
  const radiusNormPx = Math.max(1, ...idealPixels.map((point) => Math.hypot(point.x - center.x, point.y - center.y)));
  let ata00 = 0;
  let ata01 = 0;
  let ata11 = 0;
  let atb0 = 0;
  let atb1 = 0;
  for (let index = 0; index < points.length; index += 1) {
    const ideal = idealPixels[index]!;
    const point = points[index]!;
    const ux = ideal.x - center.x;
    const uy = ideal.y - center.y;
    const r2 = (ux * ux + uy * uy) / (radiusNormPx * radiusNormPx);
    if (r2 < 1e-12) continue;
    const measuredDx = point.xPx - center.x;
    const measuredDy = point.yPx - center.y;
    const scale = (measuredDx * ux + measuredDy * uy) / Math.max(1e-12, ux * ux + uy * uy) - 1;
    const r4 = r2 * r2;
    ata00 += r2 * r2;
    ata01 += r2 * r4;
    ata11 += r4 * r4;
    atb0 += r2 * scale;
    atb1 += r4 * scale;
  }
  let k1 = 0;
  let k2 = 0;
  if (includeK2) {
    const det = ata00 * ata11 - ata01 * ata01;
    if (Math.abs(det) > 1e-12) {
      k1 = (atb0 * ata11 - atb1 * ata01) / det;
      k2 = (ata00 * atb1 - ata01 * atb0) / det;
    }
  } else if (Math.abs(ata00) > 1e-12) {
    k1 = atb0 / ata00;
  }
  return { enabled: true, centerXPx: round(center.x), centerYPx: round(center.y), radiusNormPx: round(radiusNormPx), k1: round(k1), k2: includeK2 ? round(k2) : null };
}

function residualVectors(points: Array<L72GeometryPoint & { xWorldUm: number; yWorldUm: number }>, transform: L72GeometricFitResult["transform"], radial: L72GeometricFitResult["radial"]): L72ResidualVector[] {
  const rows = points.map((point) => point.row).filter((value): value is number => value !== undefined);
  const cols = points.map((point) => point.col).filter((value): value is number => value !== undefined);
  const minRow = rows.length ? Math.min(...rows) : null;
  const maxRow = rows.length ? Math.max(...rows) : null;
  const minCol = cols.length ? Math.min(...cols) : null;
  const maxCol = cols.length ? Math.max(...cols) : null;
  const scaleUmPerPx = meanPixelScale(transform);
  return points.map((point) => {
    const ideal = radial.enabled && point.idealXPx !== undefined && point.idealYPx !== undefined ? { x: point.idealXPx, y: point.idealYPx } : applyTransform(transform, point.xWorldUm, point.yWorldUm);
    const fitted = radial.enabled && radial.centerXPx !== null && radial.centerYPx !== null && radial.radiusNormPx !== null
      ? applyRadialToPixel(ideal.x, ideal.y, radial.centerXPx, radial.centerYPx, radial.radiusNormPx, radial.k1 ?? 0, radial.k2 ?? 0)
      : ideal;
    const dx = point.xPx - fitted.x;
    const dy = point.yPx - fitted.y;
    const residualPx = Math.hypot(dx, dy);
    const region = point.row !== undefined && point.col !== undefined && minRow !== null && maxRow !== null && minCol !== null && maxCol !== null
      ? point.row === minRow || point.row === maxRow || point.col === minCol || point.col === maxCol
        ? point.row !== minRow && point.row !== maxRow && point.col !== minCol && point.col !== maxCol
          ? "field"
          : (point.row === minRow || point.row === maxRow) && (point.col === minCol || point.col === maxCol)
            ? "corner"
            : "field"
        : "center"
      : "field";
    const radiusNorm = radial.centerXPx !== null && radial.centerYPx !== null && radial.radiusNormPx !== null
      ? Math.hypot(ideal.x - radial.centerXPx, ideal.y - radial.centerYPx) / radial.radiusNormPx
      : 0;
    return {
      pointId: point.id,
      row: point.row,
      col: point.col,
      measuredXPx: round(point.xPx),
      measuredYPx: round(point.yPx),
      fittedXPx: round(fitted.x),
      fittedYPx: round(fitted.y),
      dxPx: round(dx),
      dyPx: round(dy),
      residualPx: round(residualPx),
      residualUm: scaleUmPerPx === null ? null : round(residualPx * scaleUmPerPx),
      radiusNorm: round(radiusNorm),
      region
    };
  });
}

function fitMetrics(transform: L72GeometricFitResult["transform"], residuals: L72ResidualVector[], radial: L72GeometricFitResult["radial"]): L72GeometricFitResult["metrics"] {
  const xScalePxPerUm = Math.hypot(transform.a, transform.c);
  const yScalePxPerUm = Math.hypot(transform.b, transform.d);
  const xScaleUmPerPx = xScalePxPerUm > 0 ? 1 / xScalePxPerUm : null;
  const yScaleUmPerPx = yScalePxPerUm > 0 ? 1 / yScalePxPerUm : null;
  const meanScale = xScaleUmPerPx !== null && yScaleUmPerPx !== null ? (xScaleUmPerPx + yScaleUmPerPx) * 0.5 : null;
  const residualValues = residuals.map((residual) => residual.residualPx);
  const center = averageNullable(residuals.filter((residual) => residual.region === "center").map((residual) => residual.residualPx));
  const corner = averageNullable(residuals.filter((residual) => residual.region === "corner").map((residual) => residual.residualPx));
  const maxRadius = Math.max(1e-9, ...residuals.map((residual) => residual.radiusNorm));
  const fieldDistortionPercent = radial.enabled && radial.k1 !== null ? Math.abs(radial.k1 + (radial.k2 ?? 0)) * maxRadius * 100 : averageNullable(residualValues);
  return {
    pixelScaleXUmPerPx: xScaleUmPerPx === null ? null : round(xScaleUmPerPx),
    pixelScaleYUmPerPx: yScaleUmPerPx === null ? null : round(yScaleUmPerPx),
    meanPixelScaleUmPerPx: meanScale === null ? null : round(meanScale),
    rotationDeg: round(deg(Math.atan2(transform.c, transform.a))),
    shear: xScalePxPerUm > 0 && yScalePxPerUm > 0 ? round((transform.a * transform.b + transform.c * transform.d) / (xScalePxPerUm * yScalePxPerUm)) : null,
    scaleAnisotropy: xScaleUmPerPx !== null && yScaleUmPerPx !== null && meanScale !== null && meanScale > 0 ? round(Math.abs(xScaleUmPerPx - yScaleUmPerPx) / meanScale) : null,
    rmsResidualPx: rms(residualValues),
    rmsResidualUm: meanScale === null ? null : round(rms(residualValues) * meanScale),
    maxResidualPx: round(Math.max(0, ...residualValues)),
    maxResidualUm: meanScale === null ? null : round(Math.max(0, ...residualValues) * meanScale),
    centerResidualAveragePx: center,
    cornerResidualAveragePx: corner,
    cornerCenterResidualRatio: center !== null && corner !== null && center > 1e-9 ? round(corner / center) : null,
    fieldDistortionPercent: fieldDistortionPercent === null ? null : round(fieldDistortionPercent),
    straightLineBowPx: straightLineBow(residuals)
  };
}

function fitIssues(metrics: L72GeometricFitResult["metrics"], spec: L72GeometricFitSpec): L72GeometricFitResult["issues"] {
  const issues: L72GeometricFitResult["issues"] = [];
  if (metrics.rmsResidualPx > spec.residualRmsFailPx) issues.push({ code: "l72.fit.rmsResidualFail", severity: "fail", message: "RMS reprojection residual exceeds the fail threshold.", value: metrics.rmsResidualPx, threshold: spec.residualRmsFailPx });
  else if (metrics.rmsResidualPx > spec.residualRmsWarnPx) issues.push({ code: "l72.fit.rmsResidualWarn", severity: "warning", message: "RMS reprojection residual exceeds the warning threshold.", value: metrics.rmsResidualPx, threshold: spec.residualRmsWarnPx });
  if (metrics.maxResidualPx > spec.maxResidualFailPx) issues.push({ code: "l72.fit.maxResidualFail", severity: "fail", message: "Max reprojection residual exceeds the fail threshold.", value: metrics.maxResidualPx, threshold: spec.maxResidualFailPx });
  else if (metrics.maxResidualPx > spec.maxResidualWarnPx) issues.push({ code: "l72.fit.maxResidualWarn", severity: "warning", message: "Max reprojection residual exceeds the warning threshold.", value: metrics.maxResidualPx, threshold: spec.maxResidualWarnPx });
  if ((metrics.scaleAnisotropy ?? 0) > spec.scaleAnisotropyWarn) issues.push({ code: "l72.fit.scaleAnisotropyWarn", severity: "warning", message: "Pixel scale anisotropy exceeds the diagnostic threshold.", value: metrics.scaleAnisotropy, threshold: spec.scaleAnisotropyWarn });
  if ((metrics.cornerCenterResidualRatio ?? 0) > spec.cornerCenterRatioWarn) issues.push({ code: "l72.fit.cornerResidualWarn", severity: "warning", message: "Corner residuals are high relative to center residuals.", value: metrics.cornerCenterResidualRatio, threshold: spec.cornerCenterRatioWarn });
  return issues;
}

function renderTargetPixels({ kind, widthPx, heightPx, points, dotRadiusPx, contrast }: { kind: L72TargetKind; widthPx: number; heightPx: number; points: L72GeometryPoint[]; dotRadiusPx: number; contrast: number }): number[] {
  const high = 0.95;
  const low = clamp(1 - contrast, 0, 1);
  const pixels = new Array(widthPx * heightPx).fill(high);
  if (kind === "line-grid") {
    for (const point of points) {
      const x = Math.round(point.xPx);
      const y = Math.round(point.yPx);
      for (let yy = 0; yy < heightPx; yy += 1) if (x >= 0 && x < widthPx) pixels[yy * widthPx + x] = low;
      for (let xx = 0; xx < widthPx; xx += 1) if (y >= 0 && y < heightPx) pixels[y * widthPx + xx] = low;
    }
    return pixels;
  }
  for (const point of points) {
    const radius = kind === "checkerboard" ? Math.max(2, dotRadiusPx * 1.4) : dotRadiusPx;
    const minX = Math.max(0, Math.floor(point.xPx - radius));
    const maxX = Math.min(widthPx - 1, Math.ceil(point.xPx + radius));
    const minY = Math.max(0, Math.floor(point.yPx - radius));
    const maxY = Math.min(heightPx - 1, Math.ceil(point.yPx + radius));
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const d = Math.hypot(x - point.xPx, y - point.yPx);
        if (d <= radius) pixels[y * widthPx + x] = kind === "checkerboard" && ((point.row ?? 0) + (point.col ?? 0)) % 2 ? 0.35 : low;
      }
    }
  }
  return pixels;
}

function targetWarnings(points: L72GeometryPoint[], widthPx: number, heightPx: number): SolverWarning[] {
  const warnings: SolverWarning[] = [];
  const outside = points.filter((point) => point.xPx < 0 || point.xPx >= widthPx || point.yPx < 0 || point.yPx >= heightPx).length;
  if (outside > 0) warnings.push({ code: "l72.target.pointsOutsideImage", message: `${outside} generated calibration points fall outside the image bounds.` });
  return warnings;
}

function normalizePointInput(points: L72GeometryPoint[] | L72PointSet | L72GeometricTarget): { points: L72GeometryPoint[]; hash: string; warnings: SolverWarning[] } {
  if (Array.isArray(points)) return { points, hash: fnv1a64(stableStringify(points.map(pointForHash))), warnings: [] };
  if ("schema" in points && points.schema === "emmicro.l72.geometricTarget.v1") return { points: points.points, hash: points.resultHash, warnings: points.warnings };
  return { points: points.points, hash: points.sourceHash, warnings: points.warnings };
}

function hasWorld(point: L72GeometryPoint): point is L72GeometryPoint & { xWorldUm: number; yWorldUm: number } {
  return point.xWorldUm !== undefined && Number.isFinite(point.xWorldUm) && point.yWorldUm !== undefined && Number.isFinite(point.yWorldUm);
}

function disabledRadial(): L72GeometricFitResult["radial"] {
  return { enabled: false, centerXPx: null, centerYPx: null, radiusNormPx: null, k1: null, k2: null };
}

function applyTransform(transform: L72GeometricFitResult["transform"], xWorldUm: number, yWorldUm: number): { x: number; y: number } {
  return {
    x: transform.a * xWorldUm + transform.b * yWorldUm + transform.txPx,
    y: transform.c * xWorldUm + transform.d * yWorldUm + transform.tyPx
  };
}

function applyRadialToPixel(xPx: number, yPx: number, centerXPx: number, centerYPx: number, radiusNormPx: number, k1: number, k2: number): { x: number; y: number } {
  const dx = xPx - centerXPx;
  const dy = yPx - centerYPx;
  const r2 = (dx * dx + dy * dy) / Math.max(1e-12, radiusNormPx * radiusNormPx);
  const factor = 1 + k1 * r2 + k2 * r2 * r2;
  return { x: centerXPx + dx * factor, y: centerYPx + dy * factor };
}

function meanPixelScale(transform: L72GeometricFitResult["transform"]): number | null {
  const sx = Math.hypot(transform.a, transform.c);
  const sy = Math.hypot(transform.b, transform.d);
  if (sx <= 0 || sy <= 0) return null;
  return (1 / sx + 1 / sy) * 0.5;
}

function meanPoint(points: Array<{ x: number; y: number }>): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 };
  return { x: points.reduce((sum, point) => sum + point.x, 0) / points.length, y: points.reduce((sum, point) => sum + point.y, 0) / points.length };
}

function solve3(matrix: number[][], rhs: number[]): [number, number, number] {
  const a = matrix.map((row, index) => [...row, rhs[index] ?? 0]);
  for (let pivot = 0; pivot < 3; pivot += 1) {
    let best = pivot;
    for (let row = pivot + 1; row < 3; row += 1) if (Math.abs(a[row]![pivot]!) > Math.abs(a[best]![pivot]!)) best = row;
    if (Math.abs(a[best]![pivot]!) < 1e-12) throw new Error("Point geometry is degenerate; cannot solve affine transform.");
    [a[pivot], a[best]] = [a[best]!, a[pivot]!];
    const div = a[pivot]![pivot]!;
    for (let col = pivot; col < 4; col += 1) a[pivot]![col]! /= div;
    for (let row = 0; row < 3; row += 1) {
      if (row === pivot) continue;
      const factor = a[row]![pivot]!;
      for (let col = pivot; col < 4; col += 1) a[row]![col]! -= factor * a[pivot]![col]!;
    }
  }
  return [a[0]![3]!, a[1]![3]!, a[2]![3]!];
}

function parseCsvRows(text: string): string[][] {
  return text.trim().split(/\r?\n/).map((line) => line.split(",").map((cell) => cell.trim()));
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function requiredNumber(value: string | undefined, label: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`invalid numeric value for ${label}`);
  return parsed;
}

function optionalNumber(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalInteger(value: string | undefined): number | undefined {
  const parsed = optionalNumber(value);
  return parsed === undefined ? undefined : Math.round(parsed);
}

function averageNullable(values: number[]): number | null {
  const finiteValues = values.filter(Number.isFinite);
  if (finiteValues.length === 0) return null;
  return round(finiteValues.reduce((sum, value) => sum + value, 0) / finiteValues.length);
}

function straightLineBow(residuals: L72ResidualVector[]): number | null {
  const byRow = new Map<number, L72ResidualVector[]>();
  for (const residual of residuals) {
    if (residual.row === undefined) continue;
    byRow.set(residual.row, [...(byRow.get(residual.row) ?? []), residual]);
  }
  let bow = 0;
  for (const row of byRow.values()) {
    if (row.length < 3) continue;
    const sorted = [...row].sort((a, b) => (a.col ?? 0) - (b.col ?? 0));
    const first = sorted[0]!;
    const last = sorted[sorted.length - 1]!;
    const lineLength = Math.max(1e-12, Math.hypot(last.measuredXPx - first.measuredXPx, last.measuredYPx - first.measuredYPx));
    for (const point of sorted.slice(1, -1)) {
      bow = Math.max(bow, Math.abs((last.measuredXPx - first.measuredXPx) * (first.measuredYPx - point.measuredYPx) - (first.measuredXPx - point.measuredXPx) * (last.measuredYPx - first.measuredYPx)) / lineLength);
    }
  }
  return round(bow);
}

function rms(values: number[]): number {
  if (values.length === 0) return 0;
  return round(Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length));
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function pointForHash(point: L72GeometryPoint): unknown {
  return {
    id: point.id,
    row: point.row,
    col: point.col,
    xPx: round(point.xPx),
    yPx: round(point.yPx),
    xWorldUm: point.xWorldUm === undefined ? undefined : round(point.xWorldUm),
    yWorldUm: point.yWorldUm === undefined ? undefined : round(point.yWorldUm),
    idealXPx: point.idealXPx === undefined ? undefined : round(point.idealXPx),
    idealYPx: point.idealYPx === undefined ? undefined : round(point.idealYPx)
  };
}

function sampleForHash(values: number[]): number[] {
  const stride = Math.max(1, Math.floor(values.length / 128));
  const sample: number[] = [];
  for (let index = 0; index < values.length; index += stride) sample.push(round(values[index] ?? 0));
  return sample;
}

function resultForHash(value: unknown): unknown {
  return JSON.parse(stableStringify(value), (_key, item) => (typeof item === "number" && Number.isFinite(item) ? round(item) : item));
}

function csvEscape(value: unknown): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}

function formatNullable(value: number | null): string {
  return value === null || !Number.isFinite(value) ? "n/a" : value.toPrecision(6);
}

function integerInRange(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(finite(value, min))));
}

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function rad(degValue: number): number {
  return (degValue * Math.PI) / 180;
}

function deg(radValue: number): number {
  return (radValue * 180) / Math.PI;
}

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Number(value.toPrecision(12));
}
