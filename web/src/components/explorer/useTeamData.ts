import { useEffect, useRef, useState } from "react";
import type { TeamDetail } from "./types";

type Status = "idle" | "loading" | "error" | "ready";

export function useTeamData(teamId: string | null) {
  const cache = useRef(new Map<string, TeamDetail>());
  const [data, setData] = useState<TeamDetail | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (!teamId) {
      setData(null);
      setStatus("idle");
      return;
    }

    const cached = cache.current.get(teamId);
    if (cached) {
      setData(cached);
      setStatus("ready");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    fetch(`/data/teams/${teamId}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load team ${teamId}`);
        return res.json();
      })
      .then((json: TeamDetail) => {
        if (cancelled) return;
        cache.current.set(teamId, json);
        setData(json);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [teamId]);

  return { data, status };
}
