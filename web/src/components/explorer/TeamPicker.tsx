import { useMemo, useState } from "react";
import type { TeamManifestEntry } from "./types";

interface Props {
  manifest: TeamManifestEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function TeamPicker({ manifest, selectedId, onSelect }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...manifest].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return sorted;
    return sorted.filter((t) => `${t.name} ${t.outcome}`.toLowerCase().includes(q));
  }, [manifest, query]);

  return (
    <div className="match-picker">
      <input
        type="text"
        placeholder="Search by team or result (e.g. 'champion')"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search teams"
      />
      <ul className="match-picker__list" role="listbox">
        {filtered.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              aria-current={t.id === selectedId ? "true" : undefined}
              onClick={() => onSelect(t.id)}
            >
              <span className="match-picker__teams">{t.name}</span>
              <span className="match-picker__meta">{t.outcome}</span>
            </button>
          </li>
        ))}
        {filtered.length === 0 && <li className="match-picker__empty">No teams found.</li>}
      </ul>
    </div>
  );
}
