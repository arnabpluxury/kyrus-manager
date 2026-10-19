export type ChartSeries = {
  label: string;
  color: string;
  values: number[];
};

function pad(values: number[]): number[] {
  if (values.length === 0) return [];
  if (values.length === 1) return [values[0], values[0]];
  return values;
}

export function AreaChart({
  series,
  height = 132,
  yMax,
  ticks,
  formatTick,
  xLeftLabel = "60 seconds ago",
  xRightLabel = "Now",
}: {
  series: ChartSeries[];
  height?: number;
  yMax?: number;
  ticks?: number[];
  formatTick?: (n: number) => string;
  xLeftLabel?: string;
  xRightLabel?: string;
}) {
  const width = 728;
  const padBox = { l: 34, r: 8, t: 10, b: 22 };
  const innerW = width - padBox.l - padBox.r;
  const innerH = height - padBox.t - padBox.b;
  const lengths = series.map((s) => s.values.length);
  const count = Math.max(0, ...lengths);
  const flat = series.flatMap((s) => s.values);
  const max = yMax ?? Math.max(1, ...flat, 0);
  const axisTicks = ticks ?? (yMax === 100 ? [100, 75, 50, 25, 0] : [max, max * 0.75, max * 0.5, max * 0.25, 0]);

  const toPath = (values: number[], close: boolean) => {
    const rows = pad(values);
    if (!rows.length) return "";
    const pts = rows.map((v, i) => {
      const x = padBox.l + (i / Math.max(rows.length - 1, 1)) * innerW;
      const y = padBox.t + innerH - (Math.max(0, Math.min(v, max)) / max) * innerH;
      return [x, y] as const;
    });
    const line = pts
      .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
      .join(" ");
    if (!close) return line;
    const last = pts[pts.length - 1];
    const first = pts[0];
    const base = padBox.t + innerH;
    return `${line} L${last[0].toFixed(1)} ${base.toFixed(1)} L${first[0].toFixed(1)} ${base.toFixed(1)} Z`;
  };

  return (
    <div className="chart-block">
      <svg className="area-chart" viewBox={`0 0 ${width} ${height}`} role="img" preserveAspectRatio="none">
        {axisTicks.map((tick) => {
          const y = padBox.t + innerH - (tick / max) * innerH;
          return (
            <g key={tick}>
              <line
                x1={padBox.l}
                x2={width - padBox.r}
                y1={y}
                y2={y}
                stroke="var(--line)"
                strokeWidth="1"
              />
              <text x={0} y={y + 4} className="chart-tick">
                {formatTick ? formatTick(tick) : tick >= 100 ? tick.toFixed(0) : tick.toFixed(tick >= 10 ? 0 : 1)}
              </text>
            </g>
          );
        })}
        {count > 0 &&
          series.map((s) => (
            <path key={`${s.label}-fill`} d={toPath(s.values, true)} fill={s.color} fillOpacity={0.16} />
          ))}
        {count > 0 &&
          series.map((s) => (
            <path
              key={`${s.label}-line`}
              d={toPath(s.values, false)}
              fill="none"
              stroke={s.color}
              strokeWidth="1.75"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
        <text x={padBox.l} y={height - 4} className="chart-tick">
          {xLeftLabel}
        </text>
        <text x={width - padBox.r} y={height - 4} textAnchor="end" className="chart-tick">
          {xRightLabel}
        </text>
      </svg>
      <div className="legend">
        {series.map((s) => (
          <span key={s.label}>
            <i style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
