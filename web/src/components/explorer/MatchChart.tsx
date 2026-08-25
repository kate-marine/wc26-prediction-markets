import { useMemo, useState } from "react";
import { scaleLinear } from "d3-scale";
import { line as d3line, curveMonotoneX } from "d3-shape";
import type { MatchDetail } from "./types";

interface Props {
  match: MatchDetail;
}

const WIDTH = 860;
const PRICE_HEIGHT = 300;
const MOMENTUM_HEIGHT = 140;
const MARGIN = { top: 20, right: 20, bottom: 30, left: 58 };
const GAP = 28;

// Fixed order, never cycled — matches the validated categorical triad in
// global.css (dataviz skill: first 3 slots of the default 8-hue theme,
// all-pairs CVD-checked against both site surfaces).
const SERIES_COLORS = ["var(--chart-series-1)", "var(--chart-series-2)", "var(--chart-series-3)"];

function nearest<T>(points: T[], value: number, getX: (p: T) => number): T | null {
  if (points.length === 0) return null;
  let closest = points[0];
  let bestDiff = Math.abs(value - getX(closest));
  for (const p of points) {
    const diff = Math.abs(value - getX(p));
    if (diff < bestDiff) {
      bestDiff = diff;
      closest = p;
    }
  }
  return closest;
}

export function MatchChart({ match }: Props) {
  const [hoverT, setHoverT] = useState<number | null>(null);

  const innerWidth = WIDTH - MARGIN.left - MARGIN.right;

  const allT = match.markets.flatMap((m) => m.series.map((p) => p.t));
  const tMin = Math.min(...allT, ...match.goals.map((g) => g.minute));
  const tMax = Math.max(...allT, ...match.goals.map((g) => g.minute));

  const xScale = useMemo(
    () => scaleLinear().domain([tMin, tMax]).range([0, innerWidth]),
    [tMin, tMax, innerWidth]
  );
  const yPriceScale = useMemo(
    () => scaleLinear().domain([0, 1]).range([PRICE_HEIGHT, 0]),
    []
  );
  const momentumMax = Math.max(1, ...match.momentum.map((m) => Math.abs(m.value)));
  const yMomentumScale = useMemo(
    () => scaleLinear().domain([-momentumMax, momentumMax]).range([MOMENTUM_HEIGHT, 0]),
    [momentumMax]
  );

  const priceLine = d3line<{ t: number; price: number }>()
    .x((d) => xScale(d.t))
    .y((d) => yPriceScale(d.price))
    .curve(curveMonotoneX);

  const momentumLine = d3line<{ minute: number; value: number }>()
    .x((d) => xScale(d.minute))
    .y((d) => yMomentumScale(d.value))
    .curve(curveMonotoneX);

  const fullHeight = PRICE_HEIGHT + GAP + MOMENTUM_HEIGHT;
  const totalHeight = MARGIN.top + fullHeight + MARGIN.bottom;

  function handleMouseMove(e: React.MouseEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPixel = e.clientX - rect.left;
    setHoverT(xScale.invert(xPixel));
  }

  const priceTicks = [0, 0.25, 0.5, 0.75, 1];
  const xTicks = xScale.ticks(8);
  const hoverMomentum = hoverT !== null ? nearest(match.momentum, hoverT, (p) => p.minute) : null;

  return (
    <svg
      className="match-chart"
      viewBox={`0 0 ${WIDTH} ${totalHeight}`}
      role="img"
      aria-label={`Price and momentum chart for ${match.homeTeam} vs ${match.awayTeam}`}
    >
      <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
        {/* --- price pane --- */}
        <g>
          {priceTicks.map((t) => (
            <g key={t} transform={`translate(0, ${yPriceScale(t)})`}>
              <line x1={0} x2={innerWidth} stroke="var(--chart-grid)" strokeWidth={1} />
              <text x={-10} dy="0.32em" textAnchor="end" className="chart-axis-label">
                {Math.round(t * 100)}%
              </text>
            </g>
          ))}
          <text
            className="chart-axis-title"
            textAnchor="middle"
            transform={`translate(-42, ${PRICE_HEIGHT / 2}) rotate(-90)`}
          >
            Kalshi implied probability
          </text>

          {match.markets.map((m, i) => (
            <path
              key={m.team}
              d={priceLine(m.series) ?? undefined}
              fill="none"
              stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
              strokeWidth={m.settledYes ? 2.5 : 1.5}
              opacity={m.settledYes ? 1 : 0.75}
            />
          ))}

          {match.goals.map((g, i) => (
            <g key={i}>
              <line
                x1={xScale(g.minute)}
                x2={xScale(g.minute)}
                y1={0}
                y2={PRICE_HEIGHT}
                stroke="var(--chart-event)"
                strokeDasharray="4 3"
              />
              <text x={xScale(g.minute)} y={-6} textAnchor="middle" className="chart-goal-label">
                {g.scoringTeam}
                {g.isOwnGoal ? " (OG)" : ""}
              </text>
            </g>
          ))}
        </g>

        {/* --- legend, doubles as the hover readout --- */}
        <g transform={`translate(0, ${PRICE_HEIGHT + 14})`}>
          {match.markets.map((m, i) => {
            const point = hoverT !== null ? nearest(m.series, hoverT, (p) => p.t) : null;
            return (
              <g key={m.team} transform={`translate(${i * 170}, 0)`}>
                <rect width={10} height={10} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
                <text x={16} dy="0.8em" className="chart-legend-label">
                  {m.team}
                  {point ? `: ${Math.round(point.price * 100)}%` : ""}
                </text>
              </g>
            );
          })}
          {hoverT !== null && (
            <text x={innerWidth} dy="0.8em" textAnchor="end" className="chart-legend-label chart-hover-readout">
              minute {Math.round(hoverT)}
              {hoverMomentum !== null ? `, momentum ${hoverMomentum.value}` : ""}
            </text>
          )}
        </g>

        {/* --- momentum pane --- */}
        <g transform={`translate(0, ${PRICE_HEIGHT + GAP})`}>
          <line x1={0} x2={innerWidth} y1={yMomentumScale(0)} y2={yMomentumScale(0)} stroke="var(--chart-grid)" />
          <path d={momentumLine(match.momentum) ?? undefined} fill="none" stroke="var(--chart-momentum)" strokeWidth={1.5} />
          {match.goals.map((g, i) => (
            <line
              key={i}
              x1={xScale(g.minute)}
              x2={xScale(g.minute)}
              y1={0}
              y2={MOMENTUM_HEIGHT}
              stroke="var(--chart-event)"
              strokeDasharray="4 3"
            />
          ))}
          <text x={-10} y={4} textAnchor="end" className="chart-axis-label">
            +
          </text>
          <text x={-10} y={MOMENTUM_HEIGHT} textAnchor="end" className="chart-axis-label">
            &minus;
          </text>
          <text
            className="chart-axis-title"
            textAnchor="middle"
            transform={`translate(-42, ${MOMENTUM_HEIGHT / 2}) rotate(-90)`}
          >
            SofaScore momentum
          </text>

          {xTicks.map((t) => (
            <text key={t} x={xScale(t)} y={MOMENTUM_HEIGHT + 20} textAnchor="middle" className="chart-axis-label">
              {t}
            </text>
          ))}
          <text x={innerWidth / 2} y={MOMENTUM_HEIGHT + 34} textAnchor="middle" className="chart-axis-title">
            minutes since kickoff
          </text>
        </g>

        {/* --- shared crosshair + hit area, spans both panes --- */}
        {hoverT !== null && (
          <line x1={xScale(hoverT)} x2={xScale(hoverT)} y1={0} y2={fullHeight} stroke="var(--chart-hover)" />
        )}
        <rect
          width={innerWidth}
          height={fullHeight}
          fill="transparent"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverT(null)}
        />
      </g>
    </svg>
  );
}
