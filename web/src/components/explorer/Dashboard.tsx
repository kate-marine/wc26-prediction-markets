import { useState } from "react";
import { MatchExplorer } from "./MatchExplorer";
import { TeamExplorer } from "./TeamExplorer";

type Tab = "match" | "team";

function getInitialTab(): Tab {
  if (typeof window === "undefined") return "match";
  return new URLSearchParams(window.location.search).get("team") ? "team" : "match";
}

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>(getInitialTab);

  return (
    <div>
      <div className="tab-switcher" role="tablist" aria-label="Browse by">
        <button type="button" role="tab" aria-selected={tab === "match"} onClick={() => setTab("match")}>
          By match
        </button>
        <button type="button" role="tab" aria-selected={tab === "team"} onClick={() => setTab("team")}>
          By team
        </button>
      </div>
      {tab === "match" ? <MatchExplorer /> : <TeamExplorer />}
    </div>
  );
}
