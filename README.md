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




