"""Exports Kalshi + SofaScore data into static JSON for the explore dashboard.

Reuses the exact team-name crosswalk and Kalshi/SofaScore join logic already
validated in ../../code/04_analysis_overreaction.ipynb and
../../code/02_analysis_final_match.ipynb (kickoff anchoring, subtitle
cleanup), plus the KXWCGAME<->KXMENWORLDCUP crosswalk from
../../code/07_analysis_underreaction.ipynb -- do not re-derive this
independently if it needs to change.

Run manually whenever data/ changes:
    cd web && .venv-export/bin/python scripts/export_data.py
"""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
WEB = Path(__file__).resolve().parents[1]
DATA_OUT = WEB / "public" / "data"
MATCHES_OUT = DATA_OUT / "matches"
TEAMS_OUT = DATA_OUT / "teams"
FIGURES_OUT = WEB / "public" / "figures"

TEAM_NAME_ALIASES = {
    "Cape Verde": "Cabo Verde",
    "Bosnia and Herzegovina": "Bosnia & Herzegovina",
    "Congo DR": "DR Congo",
    "Ivory Coast": "Côte d'Ivoire",
    "IR Iran": "Iran",
    "Turkiye": "Türkiye",
    "Curacao": "Curaçao",
    "Korea Republic": "South Korea",
}
REVERSE_TEAM_ALIASES = {v: k for k, v in TEAM_NAME_ALIASES.items()}
FUTURES_ALIASES = {"Korea Republic": "South Korea", "Turkiye": "Turkey", "IR Iran": "Iran"}

# Same fixed checkpoints (minutes before close) as code/05_analysis_calibration.ipynb
# and code/heterogeneity_analysis.ipynb, applied per match rather than pooled: the
# mean squared error between the winning market's price and the settled outcome
# (1.0) at each checkpoint. Lower = the market called the right winner earlier and
# more confidently; not the same as the paper's pooled reliability-diagram
# calibration, but the same underlying accuracy measure, one match at a time.
CALIBRATION_CHECKPOINTS = [180, 150, 120, 90, 60, 30, 15, 5]


def match_calibration_error(grp: pd.DataFrame, close_time) -> float | None:
    if grp is None or pd.isna(close_time):
        return None
    sq_errors = []
    for cp in CALIBRATION_CHECKPOINTS:
        target = close_time - pd.Timedelta(minutes=cp)
        before = grp[grp["timestamp"] <= target]
        if len(before):
            price = before["price_close"].iloc[-1]
            if pd.notna(price):
                sq_errors.append((price - 1.0) ** 2)
    if not sq_errors:
        return None
    return round(sum(sq_errors) / len(sq_errors), 4)


def slugify(name: str) -> str:
    name = name.replace("KXWCGAME-", "").lower()
    return re.sub(r"[^a-z0-9]+", "-", name).strip("-")


def decided_by(status: str) -> str:
    if status == "AP":
        return "penalties"
    if status == "AET":
        return "extra_time"
    return "regulation"


def derive_round(round_name: str | None, tournament_name: str) -> str:
    if isinstance(round_name, str) and round_name:
        return round_name
    if ", Group " in tournament_name:
        return "Group " + tournament_name.split(", Group ")[-1]
    return tournament_name


def sofa_to_futures_name(sofa_name: str) -> str:
    kalshi_raw = REVERSE_TEAM_ALIASES.get(sofa_name, sofa_name)
    return FUTURES_ALIASES.get(kalshi_raw, kalshi_raw)


def team_outcome(matches: list[dict]) -> str:
    """A short human label for how far a team got, from their sorted match list."""
    if not matches:
        return "Did not play"
    last = matches[-1]
    if last["round"] == "Final":
        return "Champion" if last["result"] == "win" else "Runner-up"
    if last["round"] == "Match for 3rd place":
        return "3rd place" if last["result"] == "win" else "4th place"
    if last["round"] == "Group stage" or last["round"].startswith("Group "):
        return "Group stage"
    return f"Eliminated: {last['round']}"


def main() -> None:
    markets = pd.read_parquet(ROOT / "data/kalshi/kxwcgame_markets.parquet")
    candles = pd.read_parquet(ROOT / "data/kalshi/candlesticks/kxwcgame_minute.parquet")
    schedule = pd.read_parquet(ROOT / "data/sofascore/schedule.parquet")
    momentum = pd.read_parquet(ROOT / "data/sofascore/momentum.parquet")
    incidents = pd.read_parquet(ROOT / "data/sofascore/incidents.parquet")
    sofa_stats = pd.read_parquet(ROOT / "data/sofascore/statistics.parquet")

    markets["close_time"] = pd.to_datetime(markets["close_time"])
    markets["subtitle_clean"] = (
        markets["yes_team_subtitle"].str.replace("Reg Time: ", "", regex=False).str.strip()
    )
    parts = markets["event_title"].str.split(" vs ", n=1, expand=True)
    markets["team1_kalshi"] = parts[0].str.strip()
    markets["team2_kalshi"] = parts[1].str.split(":").str[0].str.strip()
    markets["team_set"] = [
        frozenset(t)
        for t in zip(
            markets["team1_kalshi"].replace(TEAM_NAME_ALIASES),
            markets["team2_kalshi"].replace(TEAM_NAME_ALIASES),
        )
    ]

    sched = schedule.copy()
    sched["team_set"] = [frozenset(t) for t in zip(sched["home_team"], sched["away_team"])]

    match_to_event = markets[["event_ticker", "team_set"]].drop_duplicates().merge(
        sched[["team_set", "event_id", "start_time"]], on="team_set", how="left"
    )
    n_unmatched = match_to_event["event_id"].isna().sum()
    print(f"Kalshi events matched to SofaScore: {len(match_to_event) - n_unmatched} / {len(match_to_event)}")
    if n_unmatched:
        raise RuntimeError(
            f"{n_unmatched} Kalshi event(s) failed to match a SofaScore match -- "
            "check TEAM_NAME_ALIASES before proceeding."
        )

    markets = markets.merge(
        match_to_event[["event_ticker", "event_id", "start_time"]], on="event_ticker", how="left"
    )
    candles_by_ticker = {t: g.sort_values("timestamp") for t, g in candles.groupby("market_ticker")}
    match_volume_by_event = markets.groupby("event_id")["volume"].sum()

    # xG margin per event_id, deduped per (event_id, stat_name) -- SofaScore
    # lists some stats under >1 group_name with identical values (see
    # 06_analysis_attention.ipynb's note); undeduped this silently doubles.
    xg = sofa_stats[(sofa_stats["period"] == "ALL") & (sofa_stats["stat_name"] == "Expected goals")]
    xg = xg.drop_duplicates(subset=["event_id"]).set_index("event_id")
    xg_margin_by_event = (xg["home_value"] - xg["away_value"]).abs()

    DATA_OUT.mkdir(parents=True, exist_ok=True)
    MATCHES_OUT.mkdir(parents=True, exist_ok=True)
    TEAMS_OUT.mkdir(parents=True, exist_ok=True)
    FIGURES_OUT.mkdir(parents=True, exist_ok=True)

    manifest = []
    seen_aliased_teams = set()
    # team -> list of {opponent, isHome, teamGoals, oppGoals, result, kickoff, round, decidedBy}
    team_matches: dict[str, list[dict]] = {}

    for event_id, group in markets.groupby("event_id"):
        sched_row = sched[sched["event_id"] == event_id].iloc[0]
        kickoff = group["start_time"].iloc[0]

        market_payloads = []
        for m in group.itertuples():
            grp = candles_by_ticker.get(m.market_ticker)
            if grp is None:
                continue
            series = [
                {
                    "t": round((ts - kickoff).total_seconds() / 60, 1),
                    "price": round(price, 3),
                }
                for ts, price in zip(grp["timestamp"], grp["price_close"])
                if pd.notna(price)
            ]
            if m.subtitle_clean == "Tie":
                team_label = "Draw"
            else:
                team_label = TEAM_NAME_ALIASES.get(m.subtitle_clean, m.subtitle_clean)
                seen_aliased_teams.add(team_label)
            market_payloads.append(
                {"team": team_label, "settledYes": m.result == "yes", "series": series}
            )

        outcome_market = next((m for m in market_payloads if m["settledYes"]), None)
        price_range = None
        if outcome_market and outcome_market["series"]:
            prices = [p["price"] for p in outcome_market["series"]]
            price_range = round(max(prices) - min(prices), 3)

        outcome_market_row = next((m for m in group.itertuples() if m.result == "yes"), None)
        calibration_error = None
        if outcome_market_row is not None:
            calibration_error = match_calibration_error(
                candles_by_ticker.get(outcome_market_row.market_ticker), outcome_market_row.close_time
            )

        match_momentum = momentum[momentum["event_id"] == event_id]
        momentum_payload = [
            {"minute": row.minute, "value": int(row.value)} for row in match_momentum.itertuples()
        ]

        match_incidents = incidents[incidents["event_id"] == event_id]
        match_goals = match_incidents[match_incidents["incident_type"] == "goal"]
        goals_payload = []
        for g in match_goals.itertuples():
            scoring_team = sched_row["home_team"] if g.is_home else sched_row["away_team"]
            added_time = 0 if pd.isna(g.added_time) else g.added_time
            minute = 0 if pd.isna(g.time) else g.time
            goals_payload.append(
                {
                    "minute": minute + added_time,
                    "isHome": bool(g.is_home),
                    "isOwnGoal": g.incident_class == "ownGoal",
                    "scoringTeam": scoring_team,
                    "player": g.player_name,
                }
            )

        decided = decided_by(sched_row["status"])
        round_label = derive_round(sched_row["round_name"], sched_row["tournament_name"])
        home_score, away_score = int(sched_row["home_score"]), int(sched_row["away_score"])

        # Resolve who actually advanced when regulation+ET ended level: take
        # the shootout's own running score (separate from match goals), the
        # max reached per side across all penaltyShootout incident rows.
        home_advanced = home_score > away_score
        if decided == "penalties":
            shootout = match_incidents[match_incidents["incident_type"] == "penaltyShootout"]
            home_pens = shootout["home_score"].max()
            away_pens = shootout["away_score"].max()
            home_advanced = home_pens > away_pens

        for team, opponent, is_home, team_goals, opp_goals in [
            (sched_row["home_team"], sched_row["away_team"], True, home_score, away_score),
            (sched_row["away_team"], sched_row["home_team"], False, away_score, home_score),
        ]:
            if decided == "regulation" and home_score == away_score:
                result = "draw"
            else:
                result = "win" if (is_home == home_advanced) else "loss"
            team_matches.setdefault(team, []).append(
                {
                    "opponent": opponent,
                    "isHome": is_home,
                    "teamGoals": team_goals,
                    "oppGoals": opp_goals,
                    "result": result,
                    "kickoff": kickoff.isoformat(),
                    "round": round_label,
                    "decidedBy": decided,
                }
            )

        match_id = slugify(group["event_ticker"].iloc[0])
        record = {
            "id": match_id,
            "eventTicker": group["event_ticker"].iloc[0],
            "homeTeam": sched_row["home_team"],
            "awayTeam": sched_row["away_team"],
            "homeScore": home_score,
            "awayScore": away_score,
            "kickoff": kickoff.isoformat(),
            "round": round_label,
            "decidedBy": decided,
            "markets": market_payloads,
            "momentum": momentum_payload,
            "goals": goals_payload,
        }
        (MATCHES_OUT / f"{match_id}.json").write_text(json.dumps(record, allow_nan=False))

        xg_margin = xg_margin_by_event.get(event_id)
        manifest.append(
            {
                "id": match_id,
                "eventTicker": record["eventTicker"],
                "homeTeam": record["homeTeam"],
                "awayTeam": record["awayTeam"],
                "homeScore": home_score,
                "awayScore": away_score,
                "kickoff": record["kickoff"],
                "round": round_label,
                "decidedBy": decided,
                "goalMargin": abs(home_score - away_score),
                "xgMargin": round(float(xg_margin), 2) if pd.notna(xg_margin) else None,
                "priceRange": price_range,
                "volume": round(float(match_volume_by_event.get(event_id, 0)), 0),
                "calibrationError": calibration_error,
            }
        )

    manifest.sort(key=lambda r: r["kickoff"])
    (DATA_OUT / "manifest.json").write_text(json.dumps(manifest, allow_nan=False))

    print(f"Wrote {len(manifest)} match files to {MATCHES_OUT}")
    print(f"Wrote manifest with {len(manifest)} entries to {DATA_OUT / 'manifest.json'}")

    expected_alias_targets = set(TEAM_NAME_ALIASES.values())
    missing = expected_alias_targets - seen_aliased_teams
    if missing:
        print(f"WARNING: expected aliased team names never seen in output: {missing}")
    else:
        print(f"All {len(expected_alias_targets)} aliased team names confirmed present in output.")

    # ---- team-level tournament-winner futures export ----
    futures_markets = pd.read_parquet(ROOT / "data/kalshi/kxmenworldcup_markets.parquet")
    futures_candles = pd.read_parquet(ROOT / "data/kalshi/candlesticks/kxmenworldcup_hourly.parquet")
    futures_candles_by_ticker = {
        t: g.sort_values("timestamp") for t, g in futures_candles.groupby("market_ticker")
    }

    all_sofa_teams = set(schedule["home_team"]) | set(schedule["away_team"])
    futures_to_sofa = {sofa_to_futures_name(t): t for t in all_sofa_teams}

    n_futures_unmatched = sum(1 for t in futures_markets["team_subtitle"] if t not in futures_to_sofa)
    print(f"\nKXMENWORLDCUP teams matched to SofaScore: {len(futures_markets) - n_futures_unmatched} / {len(futures_markets)}")
    if n_futures_unmatched:
        raise RuntimeError(
            f"{n_futures_unmatched} KXMENWORLDCUP team(s) failed to match a SofaScore team -- "
            "check FUTURES_ALIASES before proceeding."
        )

    teams_manifest = []
    for row in futures_markets.itertuples():
        sofa_name = futures_to_sofa[row.team_subtitle]
        slug = slugify(sofa_name)
        matches = sorted(team_matches.get(sofa_name, []), key=lambda m: m["kickoff"])

        grp = futures_candles_by_ticker.get(row.market_ticker)
        series = []
        if grp is not None:
            series = [
                {"t": ts.isoformat(), "price": round(price, 3)}
                for ts, price in zip(grp["timestamp"], grp["price_close"])
                if pd.notna(price)
            ]

        (TEAMS_OUT / f"{slug}.json").write_text(
            json.dumps({"id": slug, "name": sofa_name, "series": series, "matches": matches}, allow_nan=False)
        )
        teams_manifest.append(
            {
                "id": slug,
                "name": sofa_name,
                "matchesPlayed": len(matches),
                "outcome": team_outcome(matches),
            }
        )

    teams_manifest.sort(key=lambda t: t["name"])
    (DATA_OUT / "teams-manifest.json").write_text(json.dumps(teams_manifest, allow_nan=False))
    print(f"Wrote {len(teams_manifest)} team files to {TEAMS_OUT}")
    print(f"Wrote teams-manifest with {len(teams_manifest)} entries to {DATA_OUT / 'teams-manifest.json'}")

    fig_dir = ROOT / "output" / "figures"
    for png in fig_dir.glob("*.png"):
        shutil.copy(png, FIGURES_OUT / png.name)
    print(f"Copied {len(list(fig_dir.glob('*.png')))} figures to {FIGURES_OUT}")


if __name__ == "__main__":
    main()
