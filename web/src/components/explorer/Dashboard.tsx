import { useState } from "react";
import { MatchExplorer } from "./MatchExplorer";
import { TeamExplorer } from "./TeamExplorer";
import { AccuracyExplorer } from "./AccuracyExplorer";

type Tab = "match" | "team" | "accuracy";

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
        <button type="button" role="tab" aria-selected={tab === "accuracy"} onClick={() => setTab("accuracy")}>
          Pricing accuracy
        </button>
      </div>
      {tab === "match" && <MatchExplorer />}
      {tab === "team" && <TeamExplorer />}
      {tab === "accuracy" && <AccuracyExplorer onSelectMatch={() => setTab("match")} />}
    </div>
  );
}
