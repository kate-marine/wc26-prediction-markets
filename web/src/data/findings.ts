export interface Stat {
  label: string;
  value: string;
}

export interface Finding {
  slug: string;
  //notebook: string;
  title: string;
  summary: string;
  stats: Stat[];
  figures: { src: string; alt: string; caption: string }[];
}

export const findings: Finding[] = [
  // {
  //   slug: "dominance",
  //  // notebook: "01_analysis_dominance.ipynb",
  //   title: "Performance dominance vs. price volatility",
  //   summary:
  //     "This was a preliminary analysis into whether a lopsided performance (measured by |xG margin|) corresponds to a calmer, more confidently-priced market? Across all 104 matches, bigger blowouts tend toward calmer markets, while closer matches show far more varied volatility.",
  //   stats: [
  //     { label: "Pearson r", value: "−0.38" },
  //     { label: "n", value: "104" },
  //   ],
  //   figures: [
  //     {
  //       src: "/figures/dominance_plot.png",
  //       alt: "Scatter plot of xG margin against Kalshi price range",
  //       caption: "|xG margin| vs. the price range of the market pricing the actual outcome, across all 104 matches.",
  //     },
  //   ],
  // },
  // {
  //   slug: "final-match",
  //   notebook: "02_analysis_final_match.ipynb",
  //   title: "A single match, end to end",
  //   summary:
  //     "Before aggregating anything, a case study: Kalshi's live implied win/lose/tie probabilities for the 2026 final (Spain vs. Argentina) against SofaScore's per-minute momentum, with the goal marked. The market prices in a draw well before full time, tracks the run of play, and reprices sharply at the extra-time goal.",
  //   stat: "1 match, minute-by-minute",
  //   figures: [
  //     {
  //       src: "/figures/final_plot.png",
  //       alt: "Kalshi price series and SofaScore momentum for the 2026 World Cup final",
  //       caption: "Kalshi implied probabilities vs. SofaScore momentum for the final, goal marked.",
  //     },
  //   ],
  // },
  {
    slug: "regression",
   // notebook: "03_analysis_regression.ipynb",
    title: "Final scoreline vs overall performance",
    summary:
      "I split price movement into during-game repricing and the final jump at settlement, then regressed on the actual goal margin vs. xG/possession/shots margins across all 104 matches. Goal margin is a strong, significant predictor of total movement and the settlement jump; xG margin is not, once both are in the same model.",
    stats: [
      { label: "goal β", value: "−0.185 (P < .001)" },
      { label: "xG β", value: "+0.003 (P = .88)" },
    ],
    figures: [
      {
        src: "/figures/regression_coefficients.png",
        alt: "Standardized regression coefficients for goal margin and xG margin across three price-movement outcomes",
        caption: "Standardized coefficients (95% CI) for goal margin vs. xG margin, three price-movement outcomes.",
      },
    ],
  },
  {
    slug: "overreaction",
  //  notebook: "04_analysis_overreaction.ipynb",
    title: "Does the market overreact to goals?",
    summary:
      "I conducted four independent tests at three different time scales, and all found no evidence of overreaction. Among first-half goals with a measurable price reaction, only 27.6\% showed subsequent drift opposite in sign to the initial jump, which is significantly less than the 50\% expected under a null of no systematic reversion.",
    stats: [
      { label: "observed reversion", value: "27.6% (P < .001)" },
      { label: "expected (null)", value: "50%" },
      { label: "n", value: "76" },
    ],
    figures: [
      {
        src: "/figures/overreaction_scatter.png",
        alt: "Scatter plot of immediate price jump vs subsequent drift for first-half goals",
        caption: "Immediate reaction (jump) vs. what happens over the following 6 minutes (drift), per goal.",
      },
    ],
  },
  {
    slug: "calibration",
   // notebook: "05_analysis_calibration.ipynb",
    title: "Is the market calibrated?",
    summary:
      "A different angle on the same question of whether a Kalshi price of X% is actually right X% of the time. I find that Brier scores improve as settlement approaches and they are better than the base-rate benchmark consistently. The reliability diagrams also show no obvious systematic bias.",
    stats: [
      { label: "Brier @ 3h", value: "0.166" },
      { label: "Brier @ 5min", value: "0.026" },
    ],
    figures: [
      {
        src: "/figures/calibration.png",
        alt: "Brier score over time and a reliability diagram at four checkpoints",
        caption: "Forecast accuracy vs. time to settlement, and a reliability diagram at four time stamps.",
      },
    ],
  },
  {
    slug: "attention",
   // notebook: "06_analysis_attention.ipynb",
    title: "Does public attention explain market behavior?",
    summary:
      "Using Kalshi's own volume and open interest as a proxy for public attention. Trading volume is concentrated in the group stage, not the final. In fact, the final ranks only #59 of 104 matches by volume. Around goals, bigger volume spikes predict bigger immediate price jumps, but not whether that jump later reverts.",
    stats: [
      { label: "final's rank by volume", value: "#59 / 104" },
      { label: "spike r on jump size", value: "+0.29 (P = .04)" },
    ],
    figures: [
      {
        src: "/figures/attention_by_stage.png",
        alt: "Bar chart of trading volume by tournament stage",
        caption: "Trading volume by tournament stage. Group stage draws the most, the final ranks #59 of 104.",
      },
      {
        src: "/figures/attention_vs_reaction.png",
        alt: "Scatter and box plots of volume spikes vs price reaction size and reversion",
        caption: "Attention vs. reaction size (left) and vs. whether a goal's reaction reverted (right).",
      },
    ],
  },
  {
    slug: "underreaction",
  //  notebook: "07_analysis_underreaction.ipynb",
    title: "Testing the underreaction",
    summary:
      "Instead of overreacting to goals, does the market underreact to performance quality the scoreline didn't capture? I used performance_gap (xG margin minus goal margin) to predict subsequent title-odds drift, across all 208 team-match observations. I found no evidence of underreaction either. Where there's any hint at all, it points the opposite direction from the prediction.",
    stats: [
      { label: "r, all goals", value: "−0.07 (P = .36)" },
      { label: "r, reactive subset", value: "−0.25 (P = .09)" },
      { label: "n", value: "153" },
    ],
    figures: [
      {
        src: "/figures/underreaction_test.png",
        alt: "Coefficient plot and scatter plot testing for underreaction to performance quality",
        caption: "Immediate reaction vs. delayed drift (left) and the underreaction test itself (right).",
      },
    ],
  },
  {
    slug: "heterogeneity",
   // notebook: "heterogeneity_analysis.ipynb",
    title: "Efficiency across matches",
    summary:
      "Matches attracting the greatest trading volume (and with the most money flowing through them) are priced measurably less accurately. Because group-stage matches are known to draw disproportionately higher volume than knockout matches, I tested whether the effect was confounded with tournament stage. I found that it is not, and adding a stage control actually slightly strengthens the volume coefficient (0.047 without a stage control, 0.075 with the full seven-stage tournament structure included).",
    stats: [
      { label: "low-volume Brier", value: "0.103" },
      { label: "high-volume Brier", value: "0.151" },
      { label: "P", value: "2.6×10⁻⁷" },
    ],
    figures: [
      {
        src: "/figures/heterogeneity_analysis.png",
        alt: "Three panels showing calibration by tournament progression, by volume tercile, and independent effects of volume and open interest",
        caption: "Calibration split by tournament progression, trading-volume tercile, and a joint attention/liquidity model.",
      },
    ],
  },
];
