import { useMemo, useState } from "react";
import { scaleLinear, scaleTime } from "d3-scale";
import { line as d3line, curveMonotoneX } from "d3-shape";
import type { TeamDetail, TeamMatch } from "./types";

interface Props {
  team: TeamDetail;
}

const WIDTH = 860;
const HEIGHT = 320;
const MARGIN = { top: 20, right: 20, bottom: 40, left: 58 };

const RESULT_COLOR: Record<string, string> = {
  win: "var(--status-good)",
  loss: "var(--status-bad)",
  draw: "var(--status-neutral)",
};
const RESULT_LABEL: Record<string, string> = { win: "W", loss: "L", draw: "D" };

export function TeamChart({ team }: Props) {
  const [hoverT, setHoverT] = useState<Date | null>(null);
  const [hoveredMatch, setHoveredMatch] = useState<TeamMatch | null>(null);

  const innerWidth = WIDTH - MARGIN.left - MARGIN.right;
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

  const points = useMemo(
    () => team.series.map((p) => ({ date: new Date(p.t), price: p.price })),
    [team.series]
  );

  const xScale = useMemo(() => {
    const dates = points.map((p) => p.date);
    return scaleTime()
      .domain([dates[0] ?? new Date(), dates[dates.length - 1] ?? new Date()])
      .range([0, innerWidth]);
  }, [points, innerWidth]);

  const yScale = useMemo(() => scaleLinear().domain([0, 1]).range([innerHeight, 0]), [innerHeight]);

  const priceLine = d3line<{ date: Date; price: number }>()
    .x((d) => xScale(d.date))
    .y((d) => yScale(d.price))
    .curve(curveMonotoneX);

  function priceNear(date: Date): number | null {
    if (points.length === 0) return null;
    let closest = points[0];
    let bestDiff = Math.abs(date.getTime() - closest.date.getTime());
    for (const p of points) {
      const diff = Math.abs(date.getTime() - p.date.getTime());
      if (diff < bestDiff) {
        bestDiff = diff;
        closest = p;
      }
    }
    return closest.price;
  }

  function handleMouseMove(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPixel = e.clientX - rect.left;
    setHoverT(xScale.invert(xPixel));
  }

  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const xTicks = xScale.ticks(6);
  const hoverPrice = hoverT ? priceNear(hoverT) : null;

  return (
    <svg
      className="match-chart"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`Tournament-winner odds for ${team.name}`}
    >
      <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
        {yTicks.map((t) => (
          <g key={t} transform={`translate(0, ${yScale(t)})`}>
            <line x1={0} x2={innerWidth} stroke="var(--chart-grid)" strokeWidth={1} />
            <text x={-10} dy="0.32em" textAnchor="end" className="chart-axis-label">
              {Math.round(t * 100)}%
            </text>
          </g>
        ))}
        <text
          className="chart-axis-title"
          textAnchor="middle"
          transform={`translate(-42, ${innerHeight / 2}) rotate(-90)`}
        >
          Kalshi implied title odds
        </text>

        <path d={priceLine(points) ?? undefined} fill="none" stroke="var(--signal)" strokeWidth={2} />

        {/* Hit area for the crosshair — must render BEFORE the dots below, so
            the dots sit on top and can receive their own hover instead of
            this rect intercepting every mouse event on top of them. */}
        <rect
          width={innerWidth}
          height={innerHeight}
          fill="transparent"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverT(null)}
        />

        {hoverT && (
          <line x1={xScale(hoverT)} x2={xScale(hoverT)} y1={0} y2={innerHeight} stroke="var(--chart-hover)" />
        )}

        {team.matches.map((m, i) => {
          const cx = xScale(new Date(m.kickoff));
          const price = priceNear(new Date(m.kickoff));
          if (price === null) return null;
          const isHovered = hoveredMatch === m;
          return (
            <circle
              key={i}
              cx={cx}
              cy={yScale(price)}
              r={isHovered ? 7 : 5}
              fill={RESULT_COLOR[m.result]}
              stroke="var(--surface)"
              strokeWidth={1.5}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setHoveredMatch(m)}
              onMouseLeave={() => setHoveredMatch(null)}
            >
              <title>
                {RESULT_LABEL[m.result]} {m.teamGoals}&ndash;{m.oppGoals} vs {m.opponent} ({m.round}
                {m.decidedBy === "penalties" ? ", penalties" : ""})
              </title>
            </circle>
          );
        })}

        {hoveredMatch ? (
          <text x={innerWidth} y={12} textAnchor="end" className="chart-legend-label chart-hover-readout">
            {RESULT_LABEL[hoveredMatch.result]} {hoveredMatch.teamGoals}&ndash;{hoveredMatch.oppGoals} vs{" "}
            {hoveredMatch.opponent} ({hoveredMatch.round}
            {hoveredMatch.decidedBy === "penalties" ? ", pens" : ""})
          </text>
        ) : (
          hoverT &&
          hoverPrice !== null && (
            <text x={innerWidth} y={12} textAnchor="end" className="chart-legend-label chart-hover-readout">
              {hoverT.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}:{" "}
              {Math.round(hoverPrice * 100)}%
            </text>
          )
        )}

        {xTicks.map((t, i) => (
          <text key={i} x={xScale(t)} y={innerHeight + 20} textAnchor="middle" className="chart-axis-label">
            {t.toLocaleDateString(undefined, { month: "short", year: "2-digit" })}
          </text>
        ))}
        <text x={innerWidth / 2} y={innerHeight + 36} textAnchor="middle" className="chart-axis-title">
          dots = matches played, colored by result &middot; hover for exact odds, hover a dot for match detail
        </text>
      </g>
    </svg>
  );
}
