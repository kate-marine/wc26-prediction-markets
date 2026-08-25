import { useEffect, useRef, useState } from "react";
import type { MatchDetail } from "./types";

type Status = "idle" | "loading" | "error" | "ready";

export function useMatchData(matchId: string | null) {
  const cache = useRef(new Map<string, MatchDetail>());
  const [data, setData] = useState<MatchDetail | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (!matchId) {
      setData(null);
      setStatus("idle");
      return;
    }

    const cached = cache.current.get(matchId);
    if (cached) {
      setData(cached);
      setStatus("ready");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    fetch(`/data/matches/${matchId}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load match ${matchId}`);
        return res.json();
      })
      .then((json: MatchDetail) => {
        if (cancelled) return;
        cache.current.set(matchId, json);
        setData(json);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [matchId]);

  return { data, status };
}
