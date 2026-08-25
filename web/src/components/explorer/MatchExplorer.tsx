import { useEffect, useState } from "react";
import { MatchTable } from "./MatchTable";
import { MatchChart } from "./MatchChart";
import { useMatchData } from "./useMatchData";
import type { ManifestEntry } from "./types";

function getInitialMatchId(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("match");
}

export function MatchExplorer() {
  const [manifest, setManifest] = useState<ManifestEntry[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(getInitialMatchId);
  const { data: match, status } = useMatchData(selectedId);

  useEffect(() => {
    fetch("/data/manifest.json")
      .then((res) => res.json())
      .then((json: ManifestEntry[]) => {
        setManifest(json);
        setSelectedId((current) => {
          if (current) return current;
          const final = [...json].sort((a, b) => b.kickoff.localeCompare(a.kickoff))[0];
          return final?.id ?? null;
        });
      });
  }, []);

  function handleSelect(id: string) {
    setSelectedId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("match", id);
    url.searchParams.delete("team");
    window.history.replaceState({}, "", url);
  }

  if (!manifest) {
    return <p>Loading matches&hellip;</p>;
  }

  return (
    <div>
      <MatchTable manifest={manifest} selectedId={selectedId} onSelect={handleSelect} />
      <div className="match-detail">
        {status === "loading" && <p>Loading match&hellip;</p>}
        {status === "error" && <p>Couldn&rsquo;t load that match. Try another.</p>}
        {status === "ready" && match && (
          <>
            <div className="match-detail-header">
              <strong>
                {match.homeTeam} {match.homeScore}&ndash;{match.awayScore} {match.awayTeam}
              </strong>{" "}
              &middot; {match.round}
              {match.decidedBy !== "regulation" && (
                <span className="status-badge">
                  {match.decidedBy === "penalties" ? "Decided on penalties" : "Decided in extra time"}
                </span>
              )}
            </div>
            <MatchChart match={match} />
          </>
        )}
      </div>
    </div>
  );
}
