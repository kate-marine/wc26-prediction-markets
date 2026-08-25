import { useMemo, useState } from "react";
import type { ManifestEntry } from "./types";

interface Props {
  manifest: ManifestEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

type SortKey = "kickoff" | "goalMargin" | "xgMargin" | "priceRange" | "volume";
type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "kickoff", label: "Date" },
  { key: "goalMargin", label: "Goal margin" },
  { key: "xgMargin", label: "xG margin" },
  { key: "priceRange", label: "Price range" },
  { key: "volume", label: "Volume" },
];

function fmt(n: number | null, digits = 2): string {
  return n === null || n === undefined ? "—" : n.toFixed(digits);
}

export function MatchTable({ manifest, selectedId, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("kickoff");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let filtered = manifest;
    if (q) {
      filtered = manifest.filter((m) => `${m.homeTeam} ${m.awayTeam} ${m.round}`.toLowerCase().includes(q));
    }
    const sorted = [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === null) return 1;
      if (bv === null) return -1;
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [manifest, query, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "kickoff" ? "asc" : "desc");
    }
  }

  return (
    <div className="match-table-wrap">
      <input
        type="text"
        placeholder="Search by team or round"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search matches"
        className="match-table-search"
      />
      <div className="match-table-scroll">
        <table className="match-table">
          <thead>
            <tr>
              <th>Match</th>
              {COLUMNS.map((c) => (
                <th key={c.key}>
                  <button type="button" onClick={() => toggleSort(c.key)} className="sort-button">
                    {c.label}
                    {sortKey === c.key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr
                key={m.id}
                aria-current={m.id === selectedId ? "true" : undefined}
                onClick={() => onSelect(m.id)}
              >
                <td>
                  <span className="match-table-teams">
                    {m.homeTeam} {m.homeScore}&ndash;{m.awayScore} {m.awayTeam}
                  </span>
                  <span className="match-picker__meta">
                    {m.round}
                    {m.decidedBy !== "regulation" ? ` (${m.decidedBy === "penalties" ? "pens" : "AET"})` : ""}
                  </span>
                </td>
                <td className="num">{new Date(m.kickoff).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</td>
                <td className="num">{m.goalMargin}</td>
                <td className="num">{fmt(m.xgMargin)}</td>
                <td className="num">{fmt(m.priceRange)}</td>
                <td className="num">{(m.volume / 1e6).toFixed(1)}M</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="match-picker__empty">
                  No matches found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
