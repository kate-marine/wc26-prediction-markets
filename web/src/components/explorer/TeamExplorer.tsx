import { useEffect, useState } from "react";
import { TeamPicker } from "./TeamPicker";
import { TeamChart } from "./TeamChart";
import { useTeamData } from "./useTeamData";
import type { TeamManifestEntry } from "./types";

function getInitialTeamId(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("team");
}

export function TeamExplorer() {
  const [manifest, setManifest] = useState<TeamManifestEntry[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(getInitialTeamId);
  const { data: team, status } = useTeamData(selectedId);

  useEffect(() => {
    fetch("/data/teams-manifest.json")
      .then((res) => res.json())
      .then((json: TeamManifestEntry[]) => {
        setManifest(json);
        setSelectedId((current) => current ?? json.find((t) => t.outcome === "Champion")?.id ?? json[0]?.id ?? null);
      });
  }, []);

  function handleSelect(id: string) {
    setSelectedId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("team", id);
    url.searchParams.delete("match");
    window.history.replaceState({}, "", url);
  }

  if (!manifest) {
    return <p>Loading teams&hellip;</p>;
  }

  return (
    <div>
      <div className="team-picker-row">
        <TeamPicker manifest={manifest} selectedId={selectedId} onSelect={handleSelect} />
      </div>
      <div className="match-detail">
        {status === "loading" && <p>Loading team&hellip;</p>}
        {status === "error" && <p>Couldn&rsquo;t load that team. Try another.</p>}
        {status === "ready" && team && (
          <>
            <div className="match-detail-header">
              <strong>{team.name}</strong> &middot; {team.matches.length} matches played
            </div>
            <TeamChart team={team} />
          </>
        )}
      </div>
    </div>
  );
}
