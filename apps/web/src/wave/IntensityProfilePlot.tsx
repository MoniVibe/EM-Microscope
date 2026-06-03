import type { FieldOutput1D } from "@emmicro/core";

type IntensityProfilePlotProps = {
  field: FieldOutput1D;
};

function formatMm(valueM: number): string {
  return `${(valueM * 1000).toFixed(1)} mm`;
}

export function IntensityProfilePlot({ field }: IntensityProfilePlotProps) {
  const width = 640;
  const height = 224;
  const paddingLeft = 52;
  const paddingRight = 16;
  const paddingTop = 18;
  const paddingBottom = 34;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;
  const yMin = field.yM[0] ?? -1;
  const yMax = field.yM[field.yM.length - 1] ?? 1;
  let peak = 0;
  for (const value of field.intensity) {
    peak = Math.max(peak, value);
  }

  const stride = Math.max(1, Math.floor(field.yM.length / 900));
  const points: string[] = [];
  for (let index = 0; index < field.yM.length; index += stride) {
    const yM = field.yM[index] ?? yMin;
    const intensity = peak > 0 ? (field.intensity[index] ?? 0) / peak : 0;
    const x = paddingLeft + ((yM - yMin) / (yMax - yMin)) * plotWidth;
    const y = paddingTop + (1 - intensity) * plotHeight;
    points.push(`${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }

  const zeroX = paddingLeft + ((0 - yMin) / (yMax - yMin)) * plotWidth;

  return (
    <svg className="profile-plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="L2 normalized intensity profile">
      <rect x={paddingLeft} y={paddingTop} width={plotWidth} height={plotHeight} rx="6" />
      <line className="profile-axis" x1={paddingLeft} y1={paddingTop + plotHeight} x2={paddingLeft + plotWidth} y2={paddingTop + plotHeight} />
      <line className="profile-axis" x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={paddingTop + plotHeight} />
      {zeroX > paddingLeft && zeroX < paddingLeft + plotWidth && (
        <line className="profile-zero" x1={zeroX} y1={paddingTop} x2={zeroX} y2={paddingTop + plotHeight} />
      )}
      <path className="profile-line" d={points.join(" ")} />
      <text x={paddingLeft} y={height - 10}>
        {formatMm(yMin)}
      </text>
      <text x={paddingLeft + plotWidth - 44} y={height - 10}>
        {formatMm(yMax)}
      </text>
      <text x={10} y={paddingTop + 8}>
        I/Imax
      </text>
      <text x={paddingLeft + plotWidth / 2 - 18} y={height - 10}>
        y
      </text>
    </svg>
  );
}
