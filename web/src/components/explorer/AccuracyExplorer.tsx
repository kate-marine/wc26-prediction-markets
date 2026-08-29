import { useEffect, useMemo, useState } from "react";
import { AccuracyChart } from "./AccuracyChart";
import type { ManifestEntry } from "./types";

interface Props {
  onSelectMatch: (id: string) => void;
}

type SortKey = "calibrationError" | "volume";
type SortDir = "asc" | "desc";

export function AccuracyExplorer({ onSelectMatch }: Props) {
  const [manifest, setManifest] = useState<ManifestEntry[] | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("calibrationError");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    fetch("/data/manifest.json")
      .then((res) => res.json())
      .then((json: ManifestEntry[]) => setManifest(json));
  }, []);

  const rows = useMemo(() => {
    if (!manifest) return [];
    const withError = manifest.filter((m) => m.calibrationError !== null);
    return [...withError].sort((a, b) => {
      const av = a[sortKey] as number;
      const bv = b[sortKey] as number;
      const cmp = av - bv;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [manifest, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function handleSelect(id: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("match", id);
    url.searchParams.delete("team");
    window.history.replaceState({}, "", url);
    onSelectMatch(id);
  }

  if (!manifest) {
    return <p>Loading matches&hellip;</p>;
  }

  return (
    <div>
      <p className="prose">
        Every point is one match, plotted by how much money traded on it against how accurately its winning-side
        market was priced &mdash; the mean squared error between that market&rsquo;s price and the eventual outcome
        at the same eight checkpoints used in the paper&rsquo;s calibration test, applied match by match instead of
        pooled. Hover a point or a row for detail; click either to open that match. The pattern here is the site&rsquo;s
        headline finding made explorable: the most heavily-traded matches skew toward the top of the chart.
      </p>
      <AccuracyChart manifest={rows} onSelect={handleSelect} />
      <div className="match-table-wrap">
        <div className="match-table-scroll">
          <table className="match-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Match</th>
                <th>
                  <button type="button" onClick={() => toggleSort("calibrationError")} className="sort-button">
                    Pricing error{sortKey === "calibrationError" ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => toggleSort("volume")} className="sort-button">
                    Volume{sortKey === "volume" ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m, i) => (
                <tr key={m.id} onClick={() => handleSelect(m.id)}>
                  <td className="num">{i + 1}</td>
                  <td>
                    <span className="match-table-teams">
                      {m.homeTeam} {m.homeScore}&ndash;{m.awayScore} {m.awayTeam}
                    </span>
                    <span className="match-picker__meta">{m.round}</span>
                  </td>
                  <td className="num">{m.calibrationError!.toFixed(3)}</td>
                  <td className="num">{(m.volume / 1e6).toFixed(1)}M</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
