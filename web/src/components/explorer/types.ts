export interface ManifestEntry {
  id: string;
  eventTicker: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  kickoff: string;
  round: string;
  decidedBy: "regulation" | "extra_time" | "penalties";
  goalMargin: number;
  xgMargin: number | null;
  priceRange: number | null;
  volume: number;
  calibrationError: number | null;
}

export interface PricePoint {
  t: number;
  price: number;
}

export interface MarketSeries {
  team: string;
  settledYes: boolean;
  series: PricePoint[];
}

export interface MomentumPoint {
  minute: number;
  value: number;
}

export interface Goal {
  minute: number;
  isHome: boolean;
  isOwnGoal: boolean;
  scoringTeam: string;
  player: string | null;
}

export interface MatchDetail {
  id: string;
  eventTicker: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  kickoff: string;
  round: string;
  decidedBy: "regulation" | "extra_time" | "penalties";
  markets: MarketSeries[];
  momentum: MomentumPoint[];
  goals: Goal[];
}

export interface TeamManifestEntry {
  id: string;
  name: string;
  matchesPlayed: number;
  outcome: string;
}

export interface TeamResultPoint {
  t: string;
  price: number;
}

export interface TeamMatch {
  opponent: string;
  isHome: boolean;
  teamGoals: number;
  oppGoals: number;
  result: "win" | "loss" | "draw";
  kickoff: string;
  round: string;
  decidedBy: "regulation" | "extra_time" | "penalties";
}

export interface TeamDetail {
  id: string;
  name: string;
  series: TeamResultPoint[];
  matches: TeamMatch[];
}
