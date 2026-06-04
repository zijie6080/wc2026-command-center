// ============================================================
//  Football API — Type Definitions
// ============================================================

// ---- API Response wrapper ----
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ---- Match types ----
export interface ApiMatch {
  id: string;
  matchNumber: number;
  date: string;           // YYYY-MM-DD
  time: string;           // HH:mm (local)
  kickoffUtc: string;     // ISO 8601
  status: MatchStatus;
  minute?: number;
  injuryTime?: number;
  tournamentPhase: TournamentPhase;
  group?: string;
  matchday: number;
  roundLabel: string;

  homeTeam: ApiTeamBasic;
  awayTeam: ApiTeamBasic;

  score: {
    halfTime?: { home: number | null; away: number | null };
    fullTime?: { home: number | null; away: number | null };
    extraTime?: { home: number | null; away: number | null };
    penalties?: { home: number | null; away: number | null };
    ht?: { home: number | null; away: number | null };
    ft?: { home: number | null; away: number | null };
    et?: { home: number | null; away: number | null };
    final?: { home: number | null; away: number | null };
  };

  venue: ApiVenue;
  referee?: ApiReferee;
  attendance?: number;
  weather?: { condition: string; temperature: number; humidity: number };
  broadcasters: string[];
  isFeatured: boolean;

  events: ApiMatchEvent[];
  stats?: ApiMatchStats;

  createdAt: string;
  updatedAt: string;
}

// football-data.org v4 actual status values
export type MatchStatus = "SCHEDULED" | "TIMED" | "LIVE" | "IN_PLAY"
  | "PAUSED" | "FINISHED" | "POSTPONED" | "SUSPENDED" | "CANCELLED";

export type TournamentPhase = "group_stage" | "round_of_32" | "round_of_16"
  | "quarter_final" | "semi_final" | "third_place" | "final";

export interface ApiTeamBasic {
  id: string | number;
  name: string;
  shortName?: string;
  tla?: string;
  code?: string;
  crest?: string;
  score?: number;
}

export interface ApiVenue {
  name: string;
  city: string;
  capacity: number;
  timezone: string;
}

export interface ApiReferee {
  name: string;
  nationality: string;
  nationalityCode: string;
}

export interface ApiMatchEvent {
  id: string;
  type: "goal" | "penalty_goal" | "own_goal" | "yellow_card" | "red_card"
    | "second_yellow" | "substitution" | "var_review" | "halftime" | "fulltime";
  minute: number;
  injuryMinute?: number;
  player: { id: string; name: string; number: number };
  assistBy?: { id: string; name: string };
  team: "home" | "away";
  detail?: string;
}

export interface ApiMatchStats {
  teamId: string;
  possession: number;
  shots: { total: number; onTarget: number; offTarget: number; blocked: number };
  xG: number;
  passes: { total: number; accurate: number; accuracy: number };
  tackles: number;
  interceptions: number;
  clearances: number;
  fouls: { committed: number; suffered: number };
  cards: { yellow: number; red: number };
  corners: number;
  offsides: number;
  saves: number;
  distanceCovered: number;
}

// ---- Team types ----
export interface ApiTeam {
  id: string;
  fifaCode: string;
  nameEn: string;
  nameCn: string;
  shortName: string;
  nickname?: string;
  confederation: Confederation;
  flagUrl: string;
  crestUrl: string;
  fifaRanking: number;
  fifaRankingPrevious?: number;
  groupLetter?: string;
  coach: { name: string; nameCn?: string };
  captainId?: string;
  worldCupAppearances: number;
  worldCupTitles: number;
  bestResult: string;
  primaryColor: string;
  secondaryColor?: string;
  status: TeamStatus;
  squad: ApiSquadPlayer[];
  recentMatches: ApiTeamMatch[];
  upcomingMatches: ApiTeamMatch[];
  groupStandings?: ApiStandingRow[];
}

export type Confederation = "UEFA" | "CONMEBOL" | "CONCACAF" | "CAF" | "AFC" | "OFC";
export type TeamStatus = "active" | "eliminated" | "champion";

export interface ApiSquadPlayer {
  id: string;
  name: string;
  number: number;
  position: "GK" | "DEF" | "MID" | "FWD";
  positionDetail: string;
  age: number;
  club: string;
  isCaptain: boolean;
}

export interface ApiTeamMatch {
  id: string;
  date: string;
  opponent: { name: string; code: string };
  homeAway: "home" | "away";
  score?: string;
  result?: "W" | "D" | "L";
  stage: string;
  status: "finished" | "upcoming" | "live";
}

export interface ApiStandingRow {
  teamCode: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

// ---- Player types ----
export interface ApiPlayer {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  displayNameCn?: string;
  jerseyNumber: number;
  position: "GK" | "DEF" | "MID" | "FWD";
  positionDetail: string;
  dateOfBirth: string;
  age: number;
  heightCm?: number;
  weightKg?: number;
  preferredFoot?: "Left" | "Right" | "Both";
  nationality: string;
  teamId: string;
  teamName: string;
  teamCode: string;
  clubTeam: string;
  clubLeague?: string;
  marketValueEur?: number;
  internationalCaps: number;
  internationalGoals: number;
  worldCupAppearances?: number;
  worldCupGoals?: number;
  photoUrl?: string;
  isCaptain: boolean;
  abilityRadar?: Record<string, number>;
  status: "active" | "injured" | "suspended" | "doubtful";
  tournamentStats?: ApiPlayerTournamentStats;
  matchLog?: ApiPlayerMatchLog[];
}

export interface ApiPlayerTournamentStats {
  appearances: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  passAccuracy: number;
  keyPasses: number;
  successfulDribbles: number;
  attemptedDribbles: number;
  tackles: number;
  interceptions: number;
  foulsCommitted: number;
  foulsSuffered: number;
  yellowCards: number;
  redCards: number;
  distanceCovered: number;
  averageRating: number;
}

export interface ApiPlayerMatchLog {
  matchId: string;
  date: string;
  opponent: { name: string; code: string };
  stage: string;
  result: string;
  score: string;
  goals: number;
  assists: number;
  shots: number;
  passes: { total: number; accurate: number };
  dribbles: { successful: number; attempted: number };
  rating: number;
  isMVP: boolean;
}

// ---- Schedule types ----
export interface ApiScheduleDate {
  date: string;
  weekday: string;
  matchCount: number;
  matches: ApiMatch[];
}

// ---- Query params ----
export interface MatchQuery {
  status?: MatchStatus;
  date?: string;
  from?: string;
  to?: string;
  stage?: TournamentPhase;
  group?: string;
  teamId?: string;
  sort?: "date_asc" | "date_desc" | "most_goals";
  page?: number;
  limit?: number;
}

export interface PlayerQuery {
  teamId?: string;
  position?: "GK" | "DEF" | "MID" | "FWD";
  search?: string;
  sort?: "rating" | "goals" | "assists" | "name" | "number";
  page?: number;
  limit?: number;
}

export interface TeamQuery {
  group?: string;
  confederation?: Confederation;
  sort?: "fifa_rank" | "name" | "group";
  search?: string;
  page?: number;
  limit?: number;
}
