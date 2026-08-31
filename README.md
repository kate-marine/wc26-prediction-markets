# wc26-prediction-markets

My goal is to analyze prediction markets like Kalshi during the
2026 World Cup. My main question is whether market prices respond more
strongly to final results or to a team's underlying performance, measured
through things like shot quality, possession, cards, momentum, and
overall dominance. I am also interested in whether public attention can help explain market movements beyond what would be expected
from performance alone. More broadly, I want to look at whether large
market reactions are justified by new information or whether they seem
to be overreacting in the short term.


### Setup

```
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/jupyter lab
```


## Notebooks

Every notebook lives in [`code/`](code/) and writes its output under `data/` (pulls) or `output/figures/` (analyses); none of them take arguments or need editing to run — just execute top to bottom.

### Data pull

- **[`00_pull_kalshi.ipynb`](code/00_pull_kalshi.ipynb)**
  - **Input:** Kalshi's public market-data API via `kalshi_client.py` 
  - **Does:** fetches `KXWCGAME` (the 104 per-match 3-way win/lose/tie markets, with minute candles anchored to each market's own close time) and `KXMENWORLDCUP` (one tournament-winner futures market per team, hourly candles for the full series).
  - **Output:** `data/kalshi/kxwcgame_markets.parquet`/`.csv`, `data/kalshi/kxmenworldcup_markets.parquet`/`.csv`, `data/kalshi/candlesticks/kxwcgame_minute.parquet`, `data/kalshi/candlesticks/kxmenworldcup_hourly.parquet`.

- **[`00_pull_fbref.ipynb`](code/00_pull_fbref.ipynb)**
  - **Input:** FBref match-report pages, scraped via the `soccerdata` library (drives a real Chrome browser through Selenium to get past FBref's Cloudflare check; no API key, self-throttled to ~7s/request).
  - **Does:** pulls team-season shooting/keeper/misc match logs and restricts them to this tournament's 104 matches; pulls per-match goal/card/sub event timelines, lineups, and full player-level box scores.
  - **Output:** `data/fbref/schedule.parquet`, `team_match_shooting.parquet`, `team_match_keeper.parquet`, `team_match_misc.parquet`, `events.parquet`, `lineup.parquet`, `player_match_summary.parquet`, `player_match_keepers.parquet`.

- **[`00_pull_sofascore.ipynb`](code/00_pull_sofascore.ipynb)**
  - **Input:** SofaScore's undocumented public JSON API via `sofascore_client.py`.
  - **Does:** pulls the schedule, long-format per-match, period, team statistics, a minute-stamped incident feed (goals/cards/subs/VAR), a per-minute momentum index, and a per-shot log with xG/xGOT and pitch coordinates.
  - **Output:** `data/sofascore/schedule.parquet`, `statistics.parquet`, `incidents.parquet`, `momentum.parquet`, `shotmap.parquet`.

Note: used Claude Code to help generate these notebooks, since trying to scrape the data myself was very hard.

### Analysis

- **[`01_analysis_dominance.ipynb`](code/01_analysis_dominance.ipynb)**
  - **Input:** `data/kalshi/kxwcgame_markets.parquet` + `candlesticks/kxwcgame_minute.parquet`; `data/sofascore/schedule.parquet` + `statistics.parquet`.
  - **Does:** joins each match's outcome-market price range to SofaScore's |xG margin| (team-name crosswalk, exact-match join) and correlates performance dominance against price volatility.
  - **Output:** `output/figures/dominance_plot.png`; prints Pearson r and n.

- **[`02_analysis_final_match.ipynb`](code/02_analysis_final_match.ipynb)**
  - **Input:** Kalshi `kxwcgame_markets.parquet` + minute candles; SofaScore `schedule.parquet`, `momentum.parquet`, `incidents.parquet` for the single match with the latest close time (the final).
  - **Does:** overlays Kalshi's live win/lose/tie prices against SofaScore's per-minute momentum and goal timestamps, anchored to kickoff.
  - **Output:** `output/figures/final_plot.png`.

- **[`03_analysis_regression.ipynb`](code/03_analysis_regression.ipynb)**
  - **Input:** Kalshi markets + minute candles; SofaScore schedule + statistics.
  - **Does:** decomposes each outcome market's price series into in-match movement, the settlement jump, and total price range, then regresses each (OLS) on standardized goal margin vs. xG/possession/shots margins to see whether price tracks results or performance.
  - **Output:** `output/figures/regression_coefficients.png`; three OLS regression summaries printed inline.

- **[`04_analysis_overreaction.ipynb`](code/04_analysis_overreaction.ipynb)**
  - **Input:** Kalshi markets + minute candles; SofaScore schedule + incidents.
  - **Does:** an event study on first-half goals. Splits each goal's price reaction into an immediate jump and subsequent drift, tests reversion against a 50/50 null with a binomial sign test. Result: no overreaction; if anything, a mild statistically significant tendency to keep drifting the same direction.
  - **Output:** `output/figures/overreaction_scatter.png`; reversion-rate stats printed inline.

- **[`05_analysis_calibration.ipynb`](code/05_analysis_calibration.ipynb)**
  - **Input:** Kalshi markets + minute candles (all 312 finalized `KXWCGAME` markets).
  - **Does:** samples each market's price at 8 fixed checkpoints before its own close time and computes Brier score and reliability diagrams against the eventual outcome. Result so far: Brier score improves as settlement approaches and beats the base-rate benchmark throughout; the reliability diagram tracks the diagonal reasonably well with no obvious systematic bias.
  - **Output:** `output/figures/calibration.png`.

- **[`06_analysis_attention.ipynb`](code/06_analysis_attention.ipynb)**
  - **Input:** Kalshi markets + minute candles; SofaScore schedule + incidents.
  - **Does:** Part 1: trading volume by tournament stage (finds volume concentrated in the group stage, not the final). Part 2 : correlates goal-triggered volume spikes with immediate reaction size (r = +0.29, p = 0.04) and whether that reaction later reverts (p = 0.65, not significant).
  - **Output:** `output/figures/attention_by_stage.png`, `output/figures/attention_vs_reaction.png`.

- **[`07_analysis_underreaction.ipynb`](code/07_analysis_underreaction.ipynb)**
  - **Input:** Kalshi `KXWCGAME` markets; Kalshi `KXMENWORLDCUP` futures markets + hourly candles; SofaScore schedule + statistics.
  - **Does:** tests the mirror-image behavioral hypothesis of whether the market *underreacts* to performance quality the scoreline didn't capture. Uses `performance_gap` (xG margin minus goal margin) to predict subsequent title-odds drift, across all 208 team-match observations. Result: no evidence of underreaction either (r = −0.07, p = 0.36 on the full sample; r = −0.25, p = 0.09 restricted to matches with a real immediate reaction).
  - **Output:** `output/figures/underreaction_test.png`.

- **[`08_heterogeneity_analysis.ipynb`](code/08_heterogeneity_analysis.ipynb)**
  - **Input:** Kalshi markets + minute candles; SofaScore schedule.
  - **Does:** splits `05_analysis_calibration.ipynb`'s Brier-score methodology across three conditions instead of one pooled average (tournament progression, match-level trading volume, and checkpoint-level open interest) then a joint regression with checkpoint fixed effects, plus a tournament-stage robustness check. No effect from tournament progression (p = 0.76). Match-level attention (volume) predicts significantly worse calibration (p = 2.6×10⁻⁷); checkpoint-level open interest independently predicts *better* calibration (p < 0.001 for both, controlling for each other and time-to-close). A lot of trading *flow* in a popular match is associated with worse pricing, while a lot of accumulated *positions* is associated with better pricing.
  - **Output:** `output/figures/heterogeneity_analysis.png`.

