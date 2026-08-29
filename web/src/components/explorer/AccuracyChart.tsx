import { useMemo, useState } from "react";
import { scaleLog, scaleLinear } from "d3-scale";
import type { ManifestEntry } from "./types";

interface Props {
  manifest: ManifestEntry[];
  onSelect: (id: string) => void;
}

const WIDTH = 860;
const HEIGHT = 420;
const MARGIN = { top: 20, right: 20, bottom: 54, left: 60 };

export function AccuracyChart({ manifest, onSelect }: Props) {
  const [hovered, setHovered] = useState<ManifestEntry | null>(null);

  const points = useMemo(
    () => manifest.filter((m): m is ManifestEntry & { calibrationError: number } => m.calibrationError !== null),
    [manifest]
  );

  const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

  const volumeExtent = useMemo(() => {
    const vols = points.map((p) => p.volume).filter((v) => v > 0);
    return [Math.min(...vols), Math.max(...vols)];
  }, [points]);

  const xScale = useMemo(
    () => scaleLog().domain(volumeExtent.length ? volumeExtent : [1, 10]).range([0, innerWidth]),
    [volumeExtent, innerWidth]
  );

  const maxError = useMemo(() => Math.max(0.05, ...points.map((p) => p.calibrationError)), [points]);
  const yScale = useMemo(() => scaleLinear().domain([0, maxError]).range([innerHeight, 0]), [maxError, innerHeight]);

  const yTicks = yScale.ticks(5);
  const xTicks = xScale.ticks(6).filter((t) => t > 0);

  return (
    <svg
      className="match-chart"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Scatter plot of trading volume against pricing error, one point per match"
    >
      <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
        {yTicks.map((t) => (
          <g key={t} transform={`translate(0, ${yScale(t)})`}>
            <line x1={0} x2={innerWidth} stroke="var(--chart-grid)" strokeWidth={1} />
            <text x={-10} dy="0.32em" textAnchor="end" className="chart-axis-label">
              {t.toFixed(2)}
            </text>
          </g>
        ))}
        <text
          className="chart-axis-title"
          textAnchor="middle"
          transform={`translate(-44, ${innerHeight / 2}) rotate(-90)`}
        >
          pricing error (lower = more accurate)
        </text>

        {xTicks.map((t) => (
          <line
            key={t}
            x1={xScale(t)}
            x2={xScale(t)}
            y1={0}
            y2={innerHeight}
            stroke="var(--chart-grid)"
            strokeWidth={1}
            opacity={0.5}
          />
        ))}
        {xTicks.map((t) => (
          <text key={t} x={xScale(t)} y={innerHeight + 20} textAnchor="middle" className="chart-axis-label">
            {t >= 1e6 ? `${Math.round(t / 1e6)}M` : t}
          </text>
        ))}
        <text x={innerWidth / 2} y={innerHeight + 40} textAnchor="middle" className="chart-axis-title">
          trading volume (log scale)
        </text>

        {points.map((p) => {
          const isHovered = hovered?.id === p.id;
          return (
            <circle
              key={p.id}
              cx={xScale(Math.max(p.volume, volumeExtent[0]))}
              cy={yScale(p.calibrationError)}
              r={isHovered ? 6 : 4}
              fill="var(--signal)"
              opacity={isHovered ? 1 : 0.75}
              stroke="var(--surface)"
              strokeWidth={1}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHovered(p)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(p.id)}
            />
          );
        })}

        {hovered && (
          <text x={innerWidth} y={12} textAnchor="end" className="chart-legend-label chart-hover-readout">
            {hovered.homeTeam} {hovered.homeScore}&ndash;{hovered.awayScore} {hovered.awayTeam}: error{" "}
            {hovered.calibrationError!.toFixed(3)}, {(hovered.volume / 1e6).toFixed(1)}M volume
          </text>
        )}
      </g>
    </svg>
  );
}
