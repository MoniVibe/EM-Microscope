import { fnv1a64, stableStringify } from "../scene/hashScene";
import type { SolverWarning } from "../solvers/Solver";

export type L70MtfWindow = "hann" | "hamming" | "none";
export type L70MtfSmoothing = "none" | "moving-average" | "savgol-lite";
export type L70SlantedEdgePolarity = "auto" | "dark-to-light" | "light-to-dark";

export type L70Rect = {
  xPx: number;
  yPx: number;
  widthPx: number;
  heightPx: number;
};

export type L70ResolutionTargetKind = "slanted-edge" | "line-pair";

export type L70ResolutionTargetImage = {
  schema: "emmicro.l70.resolutionTarget.v1";
  appVersion: "L7.0 Slanted-Edge / Resolution Target MTF Workbench";
  id: string;
  label: string;
  kind: L70ResolutionTargetKind;
  widthPx: number;
  heightPx: number;
  pixelPitchUm: number | null;
  pixels: number[];
  settings: Record<string, unknown>;
  warnings: SolverWarning[];
  limitations: string[];
  resultHash: string;
};

export type L70SlantedEdgeTargetInput = {
  id?: string;
  label?: string;
  widthPx?: number;
  heightPx?: number;
  edgeAngleDeg?: number;
  contrast?: number;
  meanSignal?: number;
  polarity?: Exclude<L70SlantedEdgePolarity, "auto">;
  offsetPx?: number;
  blurSigmaPx?: number;
  pixelPitchUm?: number | null;
};

export type L70LinePairTargetInput = {
  id?: string;
  label?: string;
  widthPx?: number;
  heightPx?: number;
  frequenciesCyclesPerPx?: number[];
  contrast?: number;
  meanSignal?: number;
  blurSigmaPx?: number;
  pixelPitchUm?: number | null;
};

export type L70ImageLike = {
  widthPx: number;
  heightPx: number;
  pixels: ArrayLike<number>;
  pixelPitchUm?: number | null;
};

export type SlantedEdgeMtfInput = {
  id?: string;
  label?: string;
  image?: L70ResolutionTargetImage | L70ImageLike;
  widthPx?: number;
  heightPx?: number;
  pixels?: ArrayLike<number>;
  roi?: Partial<L70Rect>;
  pixelPitchUm?: number | null;
  edgeAngleDeg?: number;
  oversampling?: number;
  window?: L70MtfWindow;
  smoothing?: L70MtfSmoothing;
  polarity?: L70SlantedEdgePolarity;
  sourceLabel?: string;
};

export type L70EsfPoint = {
  distancePx: number;
  value: number;
};

export type L70LsfPoint = {
  distancePx: number;
  value: number;
};

export type L70MtfPoint = {
  frequencyCyclesPerPx: number;
  frequencyLpPerMm: number | null;
  mtf: number;
};

export type SlantedEdgeMtfMetrics = {
  edgeAngleDeg: number;
  edgeContrast: number;
  mtf50CyclesPerPx: number | null;
  mtf10CyclesPerPx: number | null;
  mtf50LpPerMm: number | null;
  mtf10LpPerMm: number | null;
  mtfAtNyquist: number | null;
  nyquistCyclesPerPx: 0.5;
  nyquistLpPerMm: number | null;
  esfBinCount: number;
  lsfSampleCount: number;
  roiSampleCount: number;
};

export type SlantedEdgeMtfResult = {
  schema: "emmicro.l70.slantedEdgeMtf.v1";
  appVersion: "L7.0 Slanted-Edge / Resolution Target MTF Workbench";
  id: string;
  label: string;
  sourceLabel: string;
  image: {
    widthPx: number;
    heightPx: number;
    pixelPitchUm: number | null;
  };
  roi: L70Rect;
  settings: {
    edgeAngleDeg: number | null;
    estimatedEdgeAngleDeg: number;
    oversampling: number;
    window: L70MtfWindow;
    smoothing: L70MtfSmoothing;
    polarity: L70SlantedEdgePolarity;
    resolvedPolarity: Exclude<L70SlantedEdgePolarity, "auto">;
  };
  esf: L70EsfPoint[];
  lsf: L70LsfPoint[];
  mtf: L70MtfPoint[];
  metrics: SlantedEdgeMtfMetrics;
  warnings: SolverWarning[];
  limitations: string[];
  hashes: {
    inputHash: string;
    resultHash: string;
  };
};

export type L70LinePairContrastRow = {
  frequencyCyclesPerPx: number;
  frequencyLpPerMm: number | null;
  contrastMichelson: number;
  bandYStartPx: number;
  bandYEndPx: number;
};

export type L70LinePairAnalysisResult = {
  schema: "emmicro.l70.linePairAnalysis.v1";
  appVersion: "L7.0 Slanted-Edge / Resolution Target MTF Workbench";
  id: string;
  label: string;
  image: {
    widthPx: number;
    heightPx: number;
    pixelPitchUm: number | null;
  };
  rows: L70LinePairContrastRow[];
  warnings: SolverWarning[];
  limitations: string[];
  resultHash: string;
};

export type L70MtfComparisonPoint = {
  frequencyCyclesPerPx: number;
  frequencyLpPerMm: number | null;
  measuredMtf: number;
  simulatedMtf: number;
  deltaMtf: number;
};

export type L70MtfComparisonResult = {
  schema: "emmicro.l70.mtfComparison.v1";
  appVersion: "L7.0 Slanted-Edge / Resolution Target MTF Workbench";
  id: string;
  label: string;
  measuredHash: string;
  simulatedHash: string;
  metrics: {
    mtf50DeltaCyclesPerPx: number | null;
    mtf10DeltaCyclesPerPx: number | null;
    nyquistDelta: number | null;
    rmsDelta: number;
    maxAbsDelta: number;
  };
  points: L70MtfComparisonPoint[];
  warnings: SolverWarning[];
  limitations: string[];
  resultHash: string;
};

export type L70ParsedCsvFrame = {
  widthPx: number;
  heightPx: number;
  pixels: number[];
};

export const l70MtfLimitations = [
  "ISO 12233-inspired diagnostic workflow only; this is not certified ISO 12233, Imatest-equivalent, or lab-accredited resolution measurement.",
  "Slanted-edge MTF is computed from normalized 2D image samples and ROI geometry; it does not isolate a pure lens-only MTF when a camera pipeline, demosaic, sharpening, compression, or display resampling is present.",
  "Line-pair targets are visual sanity checks and contrast diagnostics, not a replacement for a certified slanted-edge SFR workflow.",
  "The L7.0 workbench does not execute 3D Maxwell, FDTD, FEM, BEM, RCWA, CAD geometry, pixel-level sensor-stack EM, or manufacturing certification workflows."
] as const;

export function generateSlantedEdgeTarget(input: L70SlantedEdgeTargetInput = {}): L70ResolutionTargetImage {
  const widthPx = integerInRange(input.widthPx ?? 160, 32, 4096);
  const heightPx = integerInRange(input.heightPx ?? 120, 32, 4096);
  const edgeAngleDeg = finite(input.edgeAngleDeg ?? 5, 5);
  const contrast = clamp(finite(input.contrast ?? 0.9, 0.9), 0, 1);
  const meanSignal = clamp(finite(input.meanSignal ?? 0.5, 0.5), 0, 1);
  const polarity = input.polarity ?? "dark-to-light";
  const offsetPx = finite(input.offsetPx ?? 0, 0);
  const blurSigmaPx = Math.max(0, finite(input.blurSigmaPx ?? 0.85, 0.85));
  const pixelPitchUm = normalizePixelPitch(input.pixelPitchUm);
  const low = clamp(meanSignal - contrast * 0.5, 0, 1);
  const high = clamp(meanSignal + contrast * 0.5, 0, 1);
  const slope = Math.tan(degToRad(edgeAngleDeg));
  const denom = Math.sqrt(1 + slope * slope);
  const centerX = (widthPx - 1) / 2;
  const centerY = (heightPx - 1) / 2;
  const pixels: number[] = [];
  const warnings: SolverWarning[] = [];

  for (let y = 0; y < heightPx; y += 1) {
    for (let x = 0; x < widthPx; x += 1) {
      const distancePx = (x - centerX - slope * (y - centerY) - offsetPx) / denom;
      const blend = edgeBlend(distancePx, blurSigmaPx);
      const rising = low + (high - low) * blend;
      pixels.push(polarity === "dark-to-light" ? rising : high + low - rising);
    }
  }

  if (Math.abs(edgeAngleDeg) < 1 || Math.abs(edgeAngleDeg) > 15) {
    warnings.push({
      code: "l70.mtf.slantedEdge.angleOutsidePreferredRange",
      message: "Slanted-edge target angle is outside the preferred 1-15 degree diagnostic range."
    });
  }
  if (contrast < 0.1) {
    warnings.push({
      code: "l70.mtf.slantedEdge.lowContrastTarget",
      message: "Generated slanted-edge target contrast is low; MTF metrics may be unstable."
    });
  }

  return finalizeTarget({
    id: input.id ?? "l70-slanted-edge-target",
    label: input.label ?? "L7.0 slanted-edge target",
    kind: "slanted-edge",
    widthPx,
    heightPx,
    pixelPitchUm,
    pixels,
    settings: {
      edgeAngleDeg,
      contrast,
      meanSignal,
      polarity,
      offsetPx,
      blurSigmaPx
    },
    warnings
  });
}

export function generateLinePairTarget(input: L70LinePairTargetInput = {}): L70ResolutionTargetImage {
  const widthPx = integerInRange(input.widthPx ?? 192, 48, 4096);
  const heightPx = integerInRange(input.heightPx ?? 144, 48, 4096);
  const frequencies = normalizeLinePairFrequencies(input.frequenciesCyclesPerPx);
  const contrast = clamp(finite(input.contrast ?? 0.88, 0.88), 0, 1);
  const meanSignal = clamp(finite(input.meanSignal ?? 0.5, 0.5), 0, 1);
  const blurSigmaPx = Math.max(0, finite(input.blurSigmaPx ?? 0.85, 0.85));
  const pixelPitchUm = normalizePixelPitch(input.pixelPitchUm);
  const pixels = new Array(widthPx * heightPx).fill(meanSignal);
  const bandHeight = Math.max(1, Math.floor(heightPx / frequencies.length));

  for (let band = 0; band < frequencies.length; band += 1) {
    const frequency = frequencies[band] ?? 0.1;
    const yStart = band * bandHeight;
    const yEnd = band === frequencies.length - 1 ? heightPx : Math.min(heightPx, yStart + bandHeight);
    const attenuation = gaussianMtfAtFrequency(frequency, blurSigmaPx);
    const amplitude = contrast * 0.5 * attenuation;
    for (let y = yStart; y < yEnd; y += 1) {
      for (let x = 0; x < widthPx; x += 1) {
        const square = Math.sin(2 * Math.PI * frequency * (x + 0.5)) >= 0 ? 1 : -1;
        pixels[y * widthPx + x] = clamp(meanSignal + amplitude * square, 0, 1);
      }
    }
  }

  return finalizeTarget({
    id: input.id ?? "l70-line-pair-target",
    label: input.label ?? "L7.0 line-pair target",
    kind: "line-pair",
    widthPx,
    heightPx,
    pixelPitchUm,
    pixels,
    settings: {
      frequenciesCyclesPerPx: frequencies,
      contrast,
      meanSignal,
      blurSigmaPx
    },
    warnings: []
  });
}

export function runSlantedEdgeMtf(input: SlantedEdgeMtfInput): SlantedEdgeMtfResult {
  const normalized = normalizeSlantedEdgeInput(input);
  const roi = normalizeRoi(normalized.widthPx, normalized.heightPx, input.roi);
  const oversampling = integerInRange(input.oversampling ?? 4, 2, 16);
  const window = input.window ?? "hann";
  const smoothing = input.smoothing ?? "moving-average";
  const polarity = input.polarity ?? "auto";
  const crop = cropPixels(normalized.pixels, normalized.widthPx, normalized.heightPx, roi);
  const warnings: SolverWarning[] = [];
  const stats = sampleStats(crop.data);

  if (roi.widthPx < 32 || roi.heightPx < 32) {
    warnings.push({
      code: "l70.mtf.roi.tooSmall",
      message: "MTF ROI is small; use at least a 32 x 32 pixel crop for a more stable slanted-edge estimate."
    });
  }
  if (roiTouchesBoundary(roi, normalized.widthPx, normalized.heightPx)) {
    warnings.push({
      code: "l70.mtf.roi.touchesBoundary",
      message: "MTF ROI touches the image boundary; edge fitting and ESF tails may be biased."
    });
  }
  if (stats.max - stats.min < 0.08) {
    warnings.push({
      code: "l70.mtf.roi.lowContrast",
      message: "MTF ROI has low contrast; MTF50/MTF10 metrics may be unstable."
    });
  }
  if ((stats.saturatedLow + stats.saturatedHigh) / Math.max(1, crop.data.length) > 0.01) {
    warnings.push({
      code: "l70.mtf.roi.saturated",
      message: "MTF ROI contains more than 1% clipped/saturated samples."
    });
  }

  const edgeFit = fitEdgeLine(crop, input.edgeAngleDeg);
  warnings.push(...edgeFit.warnings);
  if (Math.abs(edgeFit.angleDeg) < 1 || Math.abs(edgeFit.angleDeg) > 15) {
    warnings.push({
      code: "l70.mtf.edge.angleOutsidePreferredRange",
      message: "Estimated slanted-edge angle is outside the preferred 1-15 degree diagnostic range."
    });
  }

  const projected = projectEdgeSamples(crop, edgeFit);
  const sideMeans = projectedSideMeans(projected);
  const resolvedPolarity: Exclude<L70SlantedEdgePolarity, "auto"> =
    polarity === "auto" ? (sideMeans.highDistanceMean >= sideMeans.lowDistanceMean ? "dark-to-light" : "light-to-dark") : polarity;
  const risingSamples = projected.map((sample) => ({
    distancePx: sample.distancePx,
    value: resolvedPolarity === "dark-to-light" ? sample.value : 1 - sample.value
  }));

  const esf = binEsf(risingSamples, oversampling, smoothing);
  const lsf = computeLsf(esf);
  const windowedLsf = applyLsfWindow(lsf, window);
  const mtf = computeMtf(windowedLsf, pixelPitchMm(normalized.pixelPitchUm));
  const edgeContrast = Math.abs(sideMeans.highDistanceMean - sideMeans.lowDistanceMean);
  const mtf50CyclesPerPx = frequencyCrossing(mtf, 0.5);
  const mtf10CyclesPerPx = frequencyCrossing(mtf, 0.1);
  const mtfAtNyquist = interpolateMtf(mtf, 0.5);
  const nyquistLpPerMm = cyclesPerPxToLpPerMm(0.5, normalized.pixelPitchUm);

  if (normalized.pixelPitchUm === null) {
    warnings.push({
      code: "l70.mtf.pixelPitchMissing",
      message: "Pixel pitch is missing; cycles/pixel metrics are available but lp/mm metrics are omitted."
    });
  }
  if (mtf50CyclesPerPx === null) {
    warnings.push({
      code: "l70.mtf.mtf50NoCrossing",
      message: "MTF50 did not cross within the sampled frequency range."
    });
  }
  if (mtf10CyclesPerPx === null) {
    warnings.push({
      code: "l70.mtf.mtf10NoCrossing",
      message: "MTF10 did not cross within the sampled frequency range."
    });
  }

  const inputHash = fnv1a64(
    stableStringify({
      schema: "emmicro.l70.slantedEdgeMtf.input.v1",
      imageHash: hashImageSamples(normalized.widthPx, normalized.heightPx, normalized.pixels),
      roi,
      pixelPitchUm: normalized.pixelPitchUm,
      edgeAngleDeg: input.edgeAngleDeg ?? null,
      oversampling,
      window,
      smoothing,
      polarity
    })
  );
  const partial = {
    schema: "emmicro.l70.slantedEdgeMtf.v1" as const,
    appVersion: "L7.0 Slanted-Edge / Resolution Target MTF Workbench" as const,
    id: input.id ?? "l70-slanted-edge-mtf",
    label: input.label ?? "L7.0 slanted-edge MTF",
    sourceLabel: input.sourceLabel ?? normalized.sourceLabel,
    image: {
      widthPx: normalized.widthPx,
      heightPx: normalized.heightPx,
      pixelPitchUm: normalized.pixelPitchUm
    },
    roi,
    settings: {
      edgeAngleDeg: input.edgeAngleDeg ?? null,
      estimatedEdgeAngleDeg: edgeFit.angleDeg,
      oversampling,
      window,
      smoothing,
      polarity,
      resolvedPolarity
    },
    esf,
    lsf,
    mtf,
    metrics: {
      edgeAngleDeg: edgeFit.angleDeg,
      edgeContrast,
      mtf50CyclesPerPx,
      mtf10CyclesPerPx,
      mtf50LpPerMm: cyclesPerPxToLpPerMm(mtf50CyclesPerPx, normalized.pixelPitchUm),
      mtf10LpPerMm: cyclesPerPxToLpPerMm(mtf10CyclesPerPx, normalized.pixelPitchUm),
      mtfAtNyquist,
      nyquistCyclesPerPx: 0.5 as const,
      nyquistLpPerMm,
      esfBinCount: esf.length,
      lsfSampleCount: lsf.length,
      roiSampleCount: roi.widthPx * roi.heightPx
    },
    warnings: uniqueWarnings(warnings),
    limitations: [...l70MtfLimitations]
  };
  const resultHash = fnv1a64(stableStringify(resultForHash(partial)));
  return {
    ...partial,
    hashes: {
      inputHash,
      resultHash
    }
  };
}

export function analyzeLinePairTarget(image: L70ResolutionTargetImage | L70ImageLike, frequenciesCyclesPerPx?: number[]): L70LinePairAnalysisResult {
  const normalized = normalizeImageLike(image);
  const frequencies = normalizeLinePairFrequencies(frequenciesCyclesPerPx ?? targetFrequencies(image));
  const bandHeight = Math.max(1, Math.floor(normalized.heightPx / frequencies.length));
  const rows: L70LinePairContrastRow[] = [];
  const warnings: SolverWarning[] = [];
  for (let band = 0; band < frequencies.length; band += 1) {
    const yStart = band * bandHeight;
    const yEnd = band === frequencies.length - 1 ? normalized.heightPx : Math.min(normalized.heightPx, yStart + bandHeight);
    const samples: number[] = [];
    const xMargin = Math.max(0, Math.floor(normalized.widthPx * 0.05));
    for (let y = yStart; y < yEnd; y += 1) {
      for (let x = xMargin; x < normalized.widthPx - xMargin; x += 1) {
        samples.push(normalized.pixels[y * normalized.widthPx + x] ?? 0);
      }
    }
    rows.push({
      frequencyCyclesPerPx: frequencies[band] ?? 0,
      frequencyLpPerMm: cyclesPerPxToLpPerMm(frequencies[band] ?? null, normalized.pixelPitchUm),
      contrastMichelson: michelsonContrast(samples),
      bandYStartPx: yStart,
      bandYEndPx: Math.max(yStart, yEnd - 1)
    });
  }
  if (normalized.pixelPitchUm === null) {
    warnings.push({
      code: "l70.linePair.pixelPitchMissing",
      message: "Pixel pitch is missing; line-pair frequencies are reported in cycles/pixel only."
    });
  }
  const partial = {
    schema: "emmicro.l70.linePairAnalysis.v1" as const,
    appVersion: "L7.0 Slanted-Edge / Resolution Target MTF Workbench" as const,
    id: "l70-line-pair-analysis",
    label: "L7.0 line-pair contrast analysis",
    image: {
      widthPx: normalized.widthPx,
      heightPx: normalized.heightPx,
      pixelPitchUm: normalized.pixelPitchUm
    },
    rows,
    warnings,
    limitations: [...l70MtfLimitations]
  };
  return {
    ...partial,
    resultHash: fnv1a64(stableStringify(resultForHash(partial)))
  };
}

export function compareMtfRuns(measured: SlantedEdgeMtfResult, simulated: SlantedEdgeMtfResult): L70MtfComparisonResult {
  const warnings: SolverWarning[] = [];
  if (measured.image.pixelPitchUm !== simulated.image.pixelPitchUm) {
    warnings.push({
      code: "l70.mtfComparison.pixelPitchMismatch",
      message: "Measured and simulated MTF runs use different pixel pitches; lp/mm deltas may not be directly comparable."
    });
  }
  const points = measured.mtf.map((point) => {
    const simulatedMtf = interpolateMtf(simulated.mtf, point.frequencyCyclesPerPx) ?? 0;
    return {
      frequencyCyclesPerPx: point.frequencyCyclesPerPx,
      frequencyLpPerMm: point.frequencyLpPerMm,
      measuredMtf: point.mtf,
      simulatedMtf,
      deltaMtf: point.mtf - simulatedMtf
    };
  });
  const rmsDelta = Math.sqrt(points.reduce((sum, point) => sum + point.deltaMtf * point.deltaMtf, 0) / Math.max(1, points.length));
  const maxAbsDelta = points.reduce((max, point) => Math.max(max, Math.abs(point.deltaMtf)), 0);
  const partial = {
    schema: "emmicro.l70.mtfComparison.v1" as const,
    appVersion: "L7.0 Slanted-Edge / Resolution Target MTF Workbench" as const,
    id: `${measured.id}-vs-${simulated.id}`,
    label: `${measured.label} vs ${simulated.label}`,
    measuredHash: measured.hashes.resultHash,
    simulatedHash: simulated.hashes.resultHash,
    metrics: {
      mtf50DeltaCyclesPerPx: nullableDelta(measured.metrics.mtf50CyclesPerPx, simulated.metrics.mtf50CyclesPerPx),
      mtf10DeltaCyclesPerPx: nullableDelta(measured.metrics.mtf10CyclesPerPx, simulated.metrics.mtf10CyclesPerPx),
      nyquistDelta: nullableDelta(measured.metrics.mtfAtNyquist, simulated.metrics.mtfAtNyquist),
      rmsDelta,
      maxAbsDelta
    },
    points,
    warnings,
    limitations: [...l70MtfLimitations]
  };
  return {
    ...partial,
    resultHash: fnv1a64(stableStringify(resultForHash(partial)))
  };
}

export function parseMtfCsvFrame(text: string): L70ParsedCsvFrame {
  const rows = text
    .trim()
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean);
  if (rows.length === 0) throw new Error("CSV frame is empty");
  const first = splitCsvRow(rows[0] ?? "");
  const header = first.map((cell) => cell.trim().toLowerCase());
  if (header.includes("x_px") && header.includes("y_px") && (header.includes("dn") || header.includes("value") || header.includes("intensity"))) {
    const xIndex = header.indexOf("x_px");
    const yIndex = header.indexOf("y_px");
    const valueIndex = Math.max(header.indexOf("dn"), header.indexOf("value"), header.indexOf("intensity"));
    const samples: Array<{ x: number; y: number; value: number }> = [];
    for (const row of rows.slice(1)) {
      const cells = splitCsvRow(row);
      const x = Math.round(Number(cells[xIndex] ?? Number.NaN));
      const y = Math.round(Number(cells[yIndex] ?? Number.NaN));
      const value = Number(cells[valueIndex] ?? Number.NaN);
      if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(value)) {
        samples.push({ x, y, value: clamp(value, 0, 1) });
      }
    }
    if (samples.length === 0) throw new Error("CSV point frame contains no numeric x_px,y_px,value rows");
    const widthPx = Math.max(...samples.map((sample) => sample.x)) + 1;
    const heightPx = Math.max(...samples.map((sample) => sample.y)) + 1;
    const pixels = new Array(widthPx * heightPx).fill(0);
    for (const sample of samples) {
      pixels[sample.y * widthPx + sample.x] = sample.value;
    }
    return { widthPx, heightPx, pixels };
  }

  const matrix = rows.map((row) => splitCsvRow(row).map((cell) => Number(cell.trim())));
  const widthPx = matrix[0]?.length ?? 0;
  if (widthPx === 0 || matrix.some((row) => row.length !== widthPx || row.some((value) => !Number.isFinite(value)))) {
    throw new Error("CSV frame must be either a numeric matrix or x_px,y_px,dn rows");
  }
  return {
    widthPx,
    heightPx: matrix.length,
    pixels: matrix.flat().map((value) => clamp(value, 0, 1))
  };
}

export function slantedEdgeMtfReportJson(result: SlantedEdgeMtfResult, comparison?: L70MtfComparisonResult, linePair?: L70LinePairAnalysisResult): string {
  return JSON.stringify({ result, comparison, linePair }, null, 2);
}

export function slantedEdgeMtfReportMarkdown(result: SlantedEdgeMtfResult, comparison?: L70MtfComparisonResult, linePair?: L70LinePairAnalysisResult): string {
  return [
    `# ${result.label}`,
    "",
    `App version: ${result.appVersion}`,
    `Result hash: ${result.hashes.resultHash}`,
    `Source: ${result.sourceLabel}`,
    `ROI: ${result.roi.xPx},${result.roi.yPx} ${result.roi.widthPx}x${result.roi.heightPx} px`,
    "",
    "## Metrics",
    `- Edge angle: ${formatNumber(result.metrics.edgeAngleDeg)} deg`,
    `- Edge contrast: ${formatNumber(result.metrics.edgeContrast)}`,
    `- MTF50: ${formatCycles(result.metrics.mtf50CyclesPerPx, result.metrics.mtf50LpPerMm)}`,
    `- MTF10: ${formatCycles(result.metrics.mtf10CyclesPerPx, result.metrics.mtf10LpPerMm)}`,
    `- MTF at Nyquist: ${formatNullable(result.metrics.mtfAtNyquist)}`,
    "",
    "## Comparison",
    comparison
      ? `- RMS delta: ${formatNumber(comparison.metrics.rmsDelta)}; max abs delta: ${formatNumber(comparison.metrics.maxAbsDelta)}`
      : "- none",
    "",
    "## Line-Pair Check",
    linePair ? `- ${linePair.rows.length} frequency bands analyzed.` : "- none",
    "",
    "## Warnings",
    ...(result.warnings.length ? result.warnings.map((warning) => `- ${warning.message}`) : ["- none"]),
    "",
    "## Limitations",
    ...result.limitations.map((limitation) => `- ${limitation}`)
  ].join("\n");
}

export function slantedEdgeMtfCurveCsv(result: SlantedEdgeMtfResult): string {
  return [
    "frequency_cycles_per_px,frequency_lp_per_mm,mtf",
    ...result.mtf.map((point) => [point.frequencyCyclesPerPx, point.frequencyLpPerMm ?? "", point.mtf].map(csvEscape).join(","))
  ].join("\n");
}

export function slantedEdgeEsfCsv(result: SlantedEdgeMtfResult): string {
  return ["distance_px,value", ...result.esf.map((point) => [point.distancePx, point.value].map(csvEscape).join(","))].join("\n");
}

export function slantedEdgeLsfCsv(result: SlantedEdgeMtfResult): string {
  return ["distance_px,value", ...result.lsf.map((point) => [point.distancePx, point.value].map(csvEscape).join(","))].join("\n");
}

export function linePairContrastCsv(result: L70LinePairAnalysisResult): string {
  return [
    "frequency_cycles_per_px,frequency_lp_per_mm,contrast_michelson,band_y_start_px,band_y_end_px",
    ...result.rows.map((row) => [row.frequencyCyclesPerPx, row.frequencyLpPerMm ?? "", row.contrastMichelson, row.bandYStartPx, row.bandYEndPx].map(csvEscape).join(","))
  ].join("\n");
}

export function mtfComparisonCsv(result: L70MtfComparisonResult): string {
  return [
    "frequency_cycles_per_px,frequency_lp_per_mm,measured_mtf,simulated_mtf,delta_mtf",
    ...result.points.map((point) => [point.frequencyCyclesPerPx, point.frequencyLpPerMm ?? "", point.measuredMtf, point.simulatedMtf, point.deltaMtf].map(csvEscape).join(","))
  ].join("\n");
}

function finalizeTarget({
  id,
  label,
  kind,
  widthPx,
  heightPx,
  pixelPitchUm,
  pixels,
  settings,
  warnings
}: {
  id: string;
  label: string;
  kind: L70ResolutionTargetKind;
  widthPx: number;
  heightPx: number;
  pixelPitchUm: number | null;
  pixels: number[];
  settings: Record<string, unknown>;
  warnings: SolverWarning[];
}): L70ResolutionTargetImage {
  const partial = {
    schema: "emmicro.l70.resolutionTarget.v1" as const,
    appVersion: "L7.0 Slanted-Edge / Resolution Target MTF Workbench" as const,
    id,
    label,
    kind,
    widthPx,
    heightPx,
    pixelPitchUm,
    pixels: pixels.map((value) => round(clamp(value, 0, 1))),
    settings,
    warnings: uniqueWarnings(warnings),
    limitations: [...l70MtfLimitations]
  };
  return {
    ...partial,
    resultHash: fnv1a64(stableStringify(resultForHash(partial)))
  };
}

function normalizeSlantedEdgeInput(input: SlantedEdgeMtfInput): {
  widthPx: number;
  heightPx: number;
  pixels: number[];
  pixelPitchUm: number | null;
  sourceLabel: string;
} {
  if (input.image) {
    const image = normalizeImageLike(input.image);
    return {
      ...image,
      sourceLabel: "label" in input.image && typeof input.image.label === "string" ? input.image.label : input.sourceLabel ?? "image input"
    };
  }
  if (!input.widthPx || !input.heightPx || !input.pixels) {
    throw new Error("slanted-edge MTF input requires either image or widthPx,heightPx,pixels");
  }
  return {
    widthPx: integerInRange(input.widthPx, 1, 65536),
    heightPx: integerInRange(input.heightPx, 1, 65536),
    pixels: normalizePixels(input.widthPx, input.heightPx, input.pixels),
    pixelPitchUm: normalizePixelPitch(input.pixelPitchUm),
    sourceLabel: input.sourceLabel ?? "pixel input"
  };
}

function normalizeImageLike(image: L70ResolutionTargetImage | L70ImageLike): {
  widthPx: number;
  heightPx: number;
  pixels: number[];
  pixelPitchUm: number | null;
} {
  return {
    widthPx: integerInRange(image.widthPx, 1, 65536),
    heightPx: integerInRange(image.heightPx, 1, 65536),
    pixels: normalizePixels(image.widthPx, image.heightPx, image.pixels),
    pixelPitchUm: normalizePixelPitch(image.pixelPitchUm)
  };
}

function normalizePixels(widthPx: number, heightPx: number, pixels: ArrayLike<number>): number[] {
  const expected = widthPx * heightPx;
  if (pixels.length !== expected) throw new Error(`image data length ${pixels.length} does not match expected ${expected}`);
  const output = new Array(expected);
  for (let index = 0; index < expected; index += 1) {
    output[index] = clamp(finite(Number(pixels[index] ?? 0), 0), 0, 1);
  }
  return output;
}

function normalizeRoi(widthPx: number, heightPx: number, roi?: Partial<L70Rect>): L70Rect {
  const defaultMarginX = Math.max(0, Math.floor(widthPx * 0.12));
  const defaultMarginY = Math.max(0, Math.floor(heightPx * 0.12));
  const xPx = integerInRange(roi?.xPx ?? defaultMarginX, 0, Math.max(0, widthPx - 1));
  const yPx = integerInRange(roi?.yPx ?? defaultMarginY, 0, Math.max(0, heightPx - 1));
  const width = integerInRange(roi?.widthPx ?? widthPx - defaultMarginX * 2, 1, widthPx - xPx);
  const height = integerInRange(roi?.heightPx ?? heightPx - defaultMarginY * 2, 1, heightPx - yPx);
  return {
    xPx,
    yPx,
    widthPx: width,
    heightPx: height
  };
}

function cropPixels(pixels: number[], widthPx: number, _heightPx: number, roi: L70Rect): { widthPx: number; heightPx: number; data: number[] } {
  const data: number[] = [];
  for (let y = 0; y < roi.heightPx; y += 1) {
    const sourceY = roi.yPx + y;
    for (let x = 0; x < roi.widthPx; x += 1) {
      data.push(pixels[sourceY * widthPx + roi.xPx + x] ?? 0);
    }
  }
  return {
    widthPx: roi.widthPx,
    heightPx: roi.heightPx,
    data
  };
}

function fitEdgeLine(crop: { widthPx: number; heightPx: number; data: number[] }, manualAngleDeg?: number): { slope: number; intercept: number; angleDeg: number; warnings: SolverWarning[] } {
  const warnings: SolverWarning[] = [];
  const stats = sampleStats(crop.data);
  const threshold = (stats.min + stats.max) * 0.5;
  const crossings: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < crop.heightPx; y += 1) {
    let best: { x: number; gradient: number } | null = null;
    for (let x = 0; x < crop.widthPx - 1; x += 1) {
      const a = crop.data[y * crop.widthPx + x] ?? 0;
      const b = crop.data[y * crop.widthPx + x + 1] ?? 0;
      const crosses = (a <= threshold && b >= threshold) || (a >= threshold && b <= threshold);
      if (!crosses) continue;
      const span = b - a;
      const t = Math.abs(span) > 1e-12 ? (threshold - a) / span : 0;
      const gradient = Math.abs(span);
      if (!best || gradient > best.gradient) best = { x: x + clamp(t, 0, 1), gradient };
    }
    if (best) crossings.push({ x: best.x, y });
  }
  if (crossings.length < Math.max(8, Math.floor(crop.heightPx * 0.25))) {
    warnings.push({
      code: "l70.mtf.edgeFit.weakCrossingSet",
      message: "Edge fit found too few row crossings; falling back to configured/centered edge geometry."
    });
  }
  if (manualAngleDeg !== undefined) {
    const slope = Math.tan(degToRad(manualAngleDeg));
    const intercept =
      crossings.length > 0
        ? crossings.reduce((sum, sample) => sum + sample.x - slope * sample.y, 0) / crossings.length
        : (crop.widthPx - 1) / 2 - slope * ((crop.heightPx - 1) / 2);
    return { slope, intercept, angleDeg: manualAngleDeg, warnings };
  }
  if (crossings.length >= 2) {
    const fit = linearFit(crossings);
    return {
      slope: fit.slope,
      intercept: fit.intercept,
      angleDeg: radToDeg(Math.atan(fit.slope)),
      warnings
    };
  }
  const fallbackAngleDeg = 5;
  const slope = Math.tan(degToRad(fallbackAngleDeg));
  return {
    slope,
    intercept: (crop.widthPx - 1) / 2 - slope * ((crop.heightPx - 1) / 2),
    angleDeg: fallbackAngleDeg,
    warnings
  };
}

function projectEdgeSamples(crop: { widthPx: number; heightPx: number; data: number[] }, edgeFit: { slope: number; intercept: number }): Array<{ distancePx: number; value: number }> {
  const denom = Math.sqrt(1 + edgeFit.slope * edgeFit.slope);
  const samples: Array<{ distancePx: number; value: number }> = [];
  for (let y = 0; y < crop.heightPx; y += 1) {
    for (let x = 0; x < crop.widthPx; x += 1) {
      samples.push({
        distancePx: (x - edgeFit.slope * y - edgeFit.intercept) / denom,
        value: crop.data[y * crop.widthPx + x] ?? 0
      });
    }
  }
  samples.sort((a, b) => a.distancePx - b.distancePx);
  return samples;
}

function projectedSideMeans(samples: Array<{ distancePx: number; value: number }>): { lowDistanceMean: number; highDistanceMean: number } {
  if (samples.length === 0) return { lowDistanceMean: 0, highDistanceMean: 0 };
  const tailCount = Math.max(4, Math.floor(samples.length * 0.12));
  const low = samples.slice(0, tailCount);
  const high = samples.slice(Math.max(0, samples.length - tailCount));
  return {
    lowDistanceMean: low.reduce((sum, sample) => sum + sample.value, 0) / low.length,
    highDistanceMean: high.reduce((sum, sample) => sum + sample.value, 0) / high.length
  };
}

function binEsf(samples: Array<{ distancePx: number; value: number }>, oversampling: number, smoothing: L70MtfSmoothing): L70EsfPoint[] {
  if (samples.length === 0) return [];
  const minDistance = samples[0]?.distancePx ?? 0;
  const maxDistance = samples[samples.length - 1]?.distancePx ?? minDistance;
  const span = Math.max(1e-9, maxDistance - minDistance);
  const binCount = integerInRange(Math.ceil(span * oversampling), 64, 1024);
  const sums = new Array(binCount).fill(0);
  const counts = new Array(binCount).fill(0);
  for (const sample of samples) {
    const index = Math.min(binCount - 1, Math.max(0, Math.floor(((sample.distancePx - minDistance) / span) * binCount)));
    sums[index] = (sums[index] ?? 0) + sample.value;
    counts[index] = (counts[index] ?? 0) + 1;
  }
  const values = new Array(binCount).fill(Number.NaN);
  for (let index = 0; index < binCount; index += 1) {
    if ((counts[index] ?? 0) > 0) values[index] = (sums[index] ?? 0) / (counts[index] ?? 1);
  }
  fillMissingSamples(values);
  const smoothed = smoothing === "none" ? values : movingAverage(values, smoothing === "savgol-lite" ? 5 : 3);
  const binSpacing = span / Math.max(1, binCount - 1);
  return smoothed.map((value, index) => ({
    distancePx: round(minDistance + binSpacing * index),
    value: round(value)
  }));
}

function computeLsf(esf: L70EsfPoint[]): L70LsfPoint[] {
  if (esf.length < 2) return [];
  const lsf: L70LsfPoint[] = [];
  for (let index = 0; index < esf.length - 1; index += 1) {
    const a = esf[index]!;
    const b = esf[index + 1]!;
    const dx = Math.max(1e-12, b.distancePx - a.distancePx);
    lsf.push({
      distancePx: round((a.distancePx + b.distancePx) * 0.5),
      value: round((b.value - a.value) / dx)
    });
  }
  return lsf;
}

function applyLsfWindow(lsf: L70LsfPoint[], window: L70MtfWindow): L70LsfPoint[] {
  if (window === "none" || lsf.length <= 1) return lsf;
  const nMax = lsf.length - 1;
  return lsf.map((sample, index) => {
    const t = index / nMax;
    const coefficient = window === "hann" ? 0.5 - 0.5 * Math.cos(2 * Math.PI * t) : 0.54 - 0.46 * Math.cos(2 * Math.PI * t);
    return {
      distancePx: sample.distancePx,
      value: round(sample.value * coefficient)
    };
  });
}

function computeMtf(lsf: L70LsfPoint[], pixelPitchMmValue: number | null): L70MtfPoint[] {
  if (lsf.length < 2) return [];
  const spacingPx = averageSpacing(lsf.map((point) => point.distancePx));
  const values = lsf.map((point) => point.value);
  const magnitudes = dftMagnitude(values);
  const reference = Math.max(1e-12, magnitudes[0] ?? 0);
  const points: L70MtfPoint[] = [];
  for (let index = 0; index < magnitudes.length; index += 1) {
    const frequencyCyclesPerPx = index / (values.length * spacingPx);
    if (frequencyCyclesPerPx > 0.5 + 1e-9) break;
    const frequencyLpPerMm = pixelPitchMmValue === null ? null : frequencyCyclesPerPx / pixelPitchMmValue;
    points.push({
      frequencyCyclesPerPx: round(frequencyCyclesPerPx),
      frequencyLpPerMm: frequencyLpPerMm === null ? null : round(frequencyLpPerMm),
      mtf: round(clamp((magnitudes[index] ?? 0) / reference, 0, 1.5))
    });
  }
  if (points.length > 0) points[0] = { ...points[0]!, mtf: 1 };
  return points;
}

function dftMagnitude(values: number[]): number[] {
  const limit = Math.floor(values.length / 2) + 1;
  const output: number[] = [];
  for (let k = 0; k < limit; k += 1) {
    let real = 0;
    let imag = 0;
    for (let n = 0; n < values.length; n += 1) {
      const phase = (-2 * Math.PI * k * n) / values.length;
      const value = values[n] ?? 0;
      real += value * Math.cos(phase);
      imag += value * Math.sin(phase);
    }
    output.push(Math.hypot(real, imag));
  }
  return output;
}

function frequencyCrossing(mtf: L70MtfPoint[], threshold: number): number | null {
  if (mtf.length < 2) return null;
  for (let index = 1; index < mtf.length; index += 1) {
    const previous = mtf[index - 1]!;
    const current = mtf[index]!;
    if (previous.mtf >= threshold && current.mtf <= threshold) {
      const span = current.mtf - previous.mtf;
      const t = Math.abs(span) > 1e-12 ? (threshold - previous.mtf) / span : 0;
      return round(previous.frequencyCyclesPerPx + t * (current.frequencyCyclesPerPx - previous.frequencyCyclesPerPx));
    }
  }
  return null;
}

function interpolateMtf(mtf: L70MtfPoint[], frequencyCyclesPerPx: number): number | null {
  if (mtf.length === 0) return null;
  if (frequencyCyclesPerPx <= (mtf[0]?.frequencyCyclesPerPx ?? 0)) return mtf[0]?.mtf ?? null;
  for (let index = 1; index < mtf.length; index += 1) {
    const previous = mtf[index - 1]!;
    const current = mtf[index]!;
    if (frequencyCyclesPerPx <= current.frequencyCyclesPerPx) {
      const span = current.frequencyCyclesPerPx - previous.frequencyCyclesPerPx;
      const t = span > 0 ? (frequencyCyclesPerPx - previous.frequencyCyclesPerPx) / span : 0;
      return round(previous.mtf + t * (current.mtf - previous.mtf));
    }
  }
  return null;
}

function targetFrequencies(image: L70ResolutionTargetImage | L70ImageLike): number[] {
  if ("settings" in image && Array.isArray(image.settings["frequenciesCyclesPerPx"])) {
    return normalizeLinePairFrequencies(image.settings["frequenciesCyclesPerPx"] as number[]);
  }
  return normalizeLinePairFrequencies();
}

function normalizeLinePairFrequencies(values?: number[]): number[] {
  const defaults = [0.04, 0.08, 0.12, 0.18, 0.25, 0.35, 0.45];
  const frequencies = (values && values.length > 0 ? values : defaults)
    .map((value) => finite(value, Number.NaN))
    .filter((value) => Number.isFinite(value) && value > 0 && value <= 0.5)
    .sort((a, b) => a - b);
  return frequencies.length > 0 ? Array.from(new Set(frequencies.map((value) => round(value)))) : defaults;
}

function gaussianMtfAtFrequency(frequencyCyclesPerPx: number, sigmaPx: number): number {
  if (sigmaPx <= 0) return 1;
  return Math.exp(-2 * Math.PI * Math.PI * sigmaPx * sigmaPx * frequencyCyclesPerPx * frequencyCyclesPerPx);
}

function edgeBlend(distancePx: number, blurSigmaPx: number): number {
  if (blurSigmaPx <= 1e-6) return distancePx >= 0 ? 1 : 0;
  return clamp(0.5 * (1 + erf(distancePx / (Math.SQRT2 * blurSigmaPx))), 0, 1);
}

function erf(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x));
  return sign * y;
}

function linearFit(samples: Array<{ x: number; y: number }>): { slope: number; intercept: number } {
  let sumX = 0;
  let sumY = 0;
  let sumYY = 0;
  let sumYX = 0;
  for (const sample of samples) {
    sumX += sample.x;
    sumY += sample.y;
    sumYY += sample.y * sample.y;
    sumYX += sample.y * sample.x;
  }
  const n = samples.length;
  const denom = n * sumYY - sumY * sumY;
  if (Math.abs(denom) < 1e-12) return { slope: 0, intercept: sumX / Math.max(1, n) };
  const slope = (n * sumYX - sumY * sumX) / denom;
  const intercept = (sumX - slope * sumY) / n;
  return { slope, intercept };
}

function sampleStats(values: number[]): { min: number; max: number; saturatedLow: number; saturatedHigh: number } {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let saturatedLow = 0;
  let saturatedHigh = 0;
  for (const value of values) {
    min = Math.min(min, value);
    max = Math.max(max, value);
    if (value <= 0.001) saturatedLow += 1;
    if (value >= 0.999) saturatedHigh += 1;
  }
  if (values.length === 0) return { min: 0, max: 0, saturatedLow: 0, saturatedHigh: 0 };
  return { min, max, saturatedLow, saturatedHigh };
}

function fillMissingSamples(values: number[]): void {
  let last = Number.NaN;
  for (let index = 0; index < values.length; index += 1) {
    if (Number.isFinite(values[index])) {
      last = values[index]!;
    } else if (Number.isFinite(last)) {
      values[index] = last;
    }
  }
  let next = Number.NaN;
  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (Number.isFinite(values[index])) {
      next = values[index]!;
    } else if (Number.isFinite(next)) {
      values[index] = next;
    } else {
      values[index] = 0;
    }
  }
}

function movingAverage(values: number[], radius: number): number[] {
  return values.map((_value, index) => {
    let sum = 0;
    let count = 0;
    for (let offset = -radius; offset <= radius; offset += 1) {
      const sample = values[index + offset];
      if (sample === undefined) continue;
      sum += sample;
      count += 1;
    }
    return count > 0 ? sum / count : values[index] ?? 0;
  });
}

function michelsonContrast(samples: number[]): number {
  if (samples.length === 0) return 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const sample of samples) {
    min = Math.min(min, sample);
    max = Math.max(max, sample);
  }
  const denom = max + min;
  return denom > 1e-12 ? round((max - min) / denom) : 0;
}

function nullableDelta(a: number | null, b: number | null): number | null {
  if (a === null || b === null) return null;
  return round(a - b);
}

function cyclesPerPxToLpPerMm(cyclesPerPx: number | null, pixelPitchUm: number | null): number | null {
  if (cyclesPerPx === null || pixelPitchUm === null || pixelPitchUm <= 0) return null;
  return round(cyclesPerPx / (pixelPitchUm * 1e-3));
}

function pixelPitchMm(pixelPitchUm: number | null): number | null {
  return pixelPitchUm === null ? null : pixelPitchUm * 1e-3;
}

function normalizePixelPitch(value: number | null | undefined): number | null {
  if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) return null;
  return value;
}

function hashImageSamples(widthPx: number, heightPx: number, pixels: number[]): string {
  const parts = [`${widthPx}x${heightPx}:`];
  for (const value of pixels) parts.push(Math.round(clamp(value, 0, 1) * 65535).toString(16), ",");
  return fnv1a64(parts.join(""));
}

function resultForHash(value: unknown): unknown {
  return JSON.parse(stableStringify(value), (_key, item) => (typeof item === "number" && Number.isFinite(item) ? round(item) : item));
}

function averageSpacing(values: number[]): number {
  if (values.length < 2) return 1;
  let sum = 0;
  for (let index = 1; index < values.length; index += 1) {
    sum += Math.abs((values[index] ?? 0) - (values[index - 1] ?? 0));
  }
  return Math.max(1e-12, sum / (values.length - 1));
}

function roiTouchesBoundary(roi: L70Rect, widthPx: number, heightPx: number): boolean {
  return roi.xPx <= 0 || roi.yPx <= 0 || roi.xPx + roi.widthPx >= widthPx || roi.yPx + roi.heightPx >= heightPx;
}

function integerInRange(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(finite(value, min))));
}

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

function round(value: number): number {
  if (!Number.isFinite(value)) return value;
  return Number(value.toPrecision(12));
}

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toPrecision(6) : "n/a";
}

function formatNullable(value: number | null): string {
  return value === null ? "n/a" : formatNumber(value);
}

function formatCycles(cyclesPerPx: number | null, lpPerMm: number | null): string {
  if (cyclesPerPx === null) return "n/a";
  return `${formatNumber(cyclesPerPx)} cyc/px${lpPerMm === null ? "" : ` (${formatNumber(lpPerMm)} lp/mm)`}`;
}

function csvEscape(value: unknown): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}

function splitCsvRow(row: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < row.length; index += 1) {
    const char = row[index];
    const next = row[index + 1];
    if (char === "\"" && quoted && next === "\"") {
      current += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

function uniqueWarnings(warnings: SolverWarning[]): SolverWarning[] {
  const seen = new Set<string>();
  const output: SolverWarning[] = [];
  for (const warning of warnings) {
    if (seen.has(warning.code)) continue;
    seen.add(warning.code);
    output.push(warning);
  }
  return output;
}
