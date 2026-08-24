# wc26-prediction-markets

My goal is to analyze prediction markets like Kalshi during the
2026 World Cup. My main question is whether market prices respond more
strongly to final results or to a team's underlying performance, measured
through things like shot quality, possession, cards, momentum, and
overall dominance. I am also interested in whether public attention or
social media factors, such as famous players, underdog wins, or trending
fan bases help explain market movements beyond what would be expected
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

### Data pull

- **`data_pull_kalshi.ipynb`** — World Cup 2026 market data from Kalshi's
  public API: per-match win/lose/tie prices around each of the 104 matches (`KXWCGAME`), and
  tournament-winner futures odds (`KXMENWORLDCUP`).
- **`data_pull_fbref.ipynb`** —  match data via the `soccerdata` library (drives Chrome via Selenium to get
  past FBref's Cloudflare check). Shooting/keeper/misc team stats per
  match, goal/card/sub event timeline, lineups, and full player-level
  match box scores. 
- **`data_pull_sofascore.ipynb`** — uses SofaScore's public JSON API. Gives per-minute "momentum" index (fbref doesn't have),
  team stats split by half,
  minute-stamped incidents, and  per-shot log with xG/xGOT and pitch
  coordinates.

Note: used Claude Code to help generate these notebooks as trying to scrape the data myself was very hard.

### Analysis

- **`dominance_analysis.ipynb`** — tournament-wide scatter plot of |xG
  margin| against Kalshi price volatility.

- **`final_match_analysis.ipynb`** — plots Kalshi win/lose/tie probabilities against SofaScore's per-minute momentum for the final.

- **`regression_analysis.ipynb`** — regresses price movement (split into in-match repricing vs. the jump at settlement) on the actual goal margin vs. xG/possession/shots margins, across all 104 matches, to see whether the market moves more with results or with underlying performance.

- **`overreaction_analysis.ipynb`** — event study on goals: does the market overreact and partially correct, or keep drifting the same way? First-half goals only (see the notebook for why — reconstructing real match time for the 2nd half/extra time needs break durations the data doesn't have). Preliminary result: no overreaction — if anything a mild, statistically significant tendency to keep drifting the same direction (p < 0.001 vs. a 50/50 null), though the effect is small in magnitude.

- **`calibration_analysis.ipynb`** — a different angle on the same "are reactions justified" question: is a Kalshi price of X% actually right X% of the time (Brier score + reliability diagram), tracked at fixed times before each market's settlement instead of around discrete events. Sidesteps the match-time reconstruction problem entirely (uses Kalshi's own `close_time`, no cross-source join), so it covers all 312 markets across the full pre-match-to-close window, not just first-half goals. Result so far: Brier score improves smoothly as settlement approaches and beats the base-rate benchmark throughout; the reliability diagram tracks the diagonal reasonably well with no obvious systematic bias — consistent with the overreaction notebook's finding, though it's answering a related, not identical, question (average calibration vs. specific-event reversion).

- **`attention_analysis.ipynb`** — answers the README's original "does public attention explain market movements" question using Kalshi's own `volume`/`open_interest` (never touched by any earlier notebook) as a revealed-preference attention proxy, since no social/attention data source has ever been found. Two findings: (1) trading volume is concentrated in the group stage, not the final — the final ranks only #59 of 104 matches by volume, the opposite of the naive intuition; (2) around goals, bigger volume spikes predict bigger immediate price jumps (r = +0.29, p = 0.04) but not whether that jump later reverts (p = 0.65) — a fourth line of evidence, alongside the three notebooks above, that this market isn't showing overreaction. The `KXMENWORLDCUP` tournament futures data is still unused — noted as the natural next step.


- **`underreaction_analysis.ipynb`** — tests the mirror-image behavioral hypothesis: instead of overreacting to goals, does the market *underreact* to performance quality the scoreline didn't capture? Uses `performance_gap` (xG margin minus goal margin — did a team deserve better or worse than their result) to predict subsequent title-odds drift, across all 208 team-match observations (not just wins, fixing `tournament_futures_analysis.ipynb`'s power problem — 153 usable, 48 with a real reaction). Result: no evidence of underreaction either — the correlation is small and non-significant (r = -0.07, p = 0.36 on the full sample; r = -0.25, p = 0.09 restricted to real reactions), and where there's any hint at all it points the *opposite* direction from the prediction. Combined with the four overreaction-focused notebooks above, this market shows no clean directional bias in either direction on the tests run so far.

- **`heterogeneity_analysis.ipynb`** — the strongest finding in the project: re-cuts `calibration_analysis.ipynb`'s Brier-score methodology across 3 conditions instead of reporting one pooled number. No effect from tournament progression (p = 0.76). But **match-level attention (total volume) predicts significantly worse calibration** — high-volume matches are worse-priced than low-volume ones at every single checkpoint, not just on average (p = 2.6×10⁻⁷) — while **checkpoint-level open interest independently predicts better calibration** (p < 0.001 for both, controlling for each other and for time-to-close). Read together: a lot of trading *flow* in a popular match is associated with worse pricing, while a lot of accumulated *positions* is associated with better pricing — a plausible noise-trader story, though correlational, not proven. **Stress-tested with a stage control**, since group-stage matches are known to draw disproportionate volume: the attention effect doesn't just survive controlling for group-stage-vs-knockout, it *strengthens* (coefficient roughly 0.047 → 0.075, p tightening from 1.4×10⁻²³ to 1.7×10⁻³⁹) — and that check surfaced a second real finding along the way, that knockout matches are independently worse-calibrated than group-stage ones. This is the first genuinely significant, non-null result in the whole project, and it's the one that finally connects to the "public attention" thread from the README's original question.




