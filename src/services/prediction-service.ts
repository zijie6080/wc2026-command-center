// ============================================================
//  Prediction Service — Data Aggregation for AI Analysis
// ============================================================

import { footballApi } from "@/services/football-api";

// ---- Types ----

export interface TeamPredictionData {
  id: string | number;
  name: string;
  shortName: string;
  tla: string;
  fifaRanking: number | null;
  fifaRankingPrevious: number | null;
  worldCupTitles: number;
  worldCupAppearances: number;
  bestResult: string;
  confederation: string;
  groupLetter: string;
  coach: string;
  recentForm: string;
  recentMatches: { opponent: string; result: string; score: string; date: string }[];
  groupStandings: {
    position: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
  } | null;
}

export interface AggregatedPredictionData {
  generatedAt: string;
  teams: TeamPredictionData[];
  groups: { letter: string; teams: { name: string; tla: string; points: number; position: number }[] }[];
  summary: {
    avgFifaRanking: number;
    totalWorldCupTitles: number;
    confederations: Record<string, number>;
  };
}

// ---- Helpers ----

function resultChar(result: string | undefined): string {
  if (!result) return "?";
  if (result === "W" || result === "win") return "W";
  if (result === "D" || result === "draw") return "D";
  if (result === "L" || result === "loss") return "L";
  return "?";
}

// ---- In-memory cache ----

const dataCache = new Map<string, { data: AggregatedPredictionData; expiresAt: number }>();

// ---- Main Service ----

export const predictionService = {
  async aggregateAllData(): Promise<AggregatedPredictionData> {
    const cached = dataCache.get("aggregated");
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const teamsRes = await footballApi.teams.list();
    if (!teamsRes.success || !Array.isArray(teamsRes.data)) {
      throw new Error("Failed to load team data");
    }
    const teams = teamsRes.data as any[];

    let allStandings: any[] = [];
    try {
      const standingsRes = await footballApi.schedule.standings();
      if (standingsRes.success && Array.isArray(standingsRes.data)) {
        allStandings = standingsRes.data as any[];
      }
    } catch { /* pre-tournament */ }

    const groupMap = new Map<string, any>();
    for (const s of allStandings) {
      for (const row of s.table || []) {
        groupMap.set(String(row.team?.id), row);
      }
    }

    const processedTeams: TeamPredictionData[] = [];
    const groupsMap = new Map<string, { name: string; tla: string; points: number; position: number }[]>();

    for (const t of teams) {
      const tla = t.tla || "";
      const group = (t as any).group || "";
      const recentMatches = (t.recentMatches || []).slice(0, 5);
      const recentForm = recentMatches.map((m: any) => resultChar(m.result)).join("");
      const standing = groupMap.get(String(t.id));

      const teamData: TeamPredictionData = {
        id: t.id,
        name: t.name || "",
        shortName: t.shortName || t.name || "",
        tla,
        fifaRanking: (t as any).fifaRanking ?? null,
        fifaRankingPrevious: (t as any).fifaRankingPrevious ?? null,
        worldCupTitles: (t as any).worldCupTitles ?? 0,
        worldCupAppearances: (t as any).worldCupAppearances ?? 0,
        bestResult: (t as any).bestResult || "—",
        confederation: (t as any).confederation || "—",
        groupLetter: group || (t as any).groupLetter || "?",
        coach: t.coach?.name || "—",
        recentForm: recentForm || "?????",
        recentMatches: recentMatches.map((m: any) => ({
          opponent: m.opponent?.name || m.awayTeam?.name || m.homeTeam?.name || "—",
          result: m.result || "—",
          score: m.score || "—",
          date: m.date || m.utcDate?.slice(0, 10) || "—",
        })),
        groupStandings: standing ? {
          position: standing.position || 0,
          played: standing.playedGames || standing.played || 0,
          won: standing.won || 0,
          drawn: standing.draw || standing.drawn || 0,
          lost: standing.lost || 0,
          goalsFor: standing.goalsFor || 0,
          goalsAgainst: standing.goalsAgainst || 0,
          goalDifference: standing.goalDifference || 0,
          points: standing.points || 0,
        } : null,
      };

      processedTeams.push(teamData);

      if (group && teamData.groupStandings) {
        if (!groupsMap.has(group)) groupsMap.set(group, []);
        groupsMap.get(group)!.push({
          name: teamData.shortName,
          tla: teamData.tla,
          points: teamData.groupStandings.points,
          position: teamData.groupStandings.position,
        });
      }
    }

    const validRankings = processedTeams.filter((t) => t.fifaRanking != null).map((t) => t.fifaRanking as number);
    const avgFifaRanking = validRankings.length > 0
      ? Math.round(validRankings.reduce((a, b) => a + b, 0) / validRankings.length) : 0;
    const totalWorldCupTitles = processedTeams.reduce((sum, t) => sum + t.worldCupTitles, 0);
    const confederations: Record<string, number> = {};
    for (const t of processedTeams) {
      confederations[t.confederation] = (confederations[t.confederation] || 0) + 1;
    }

    const result: AggregatedPredictionData = {
      generatedAt: new Date().toISOString(),
      teams: processedTeams,
      groups: Array.from(groupsMap.entries())
        .map(([letter, teamList]) => ({ letter, teams: teamList }))
        .sort((a, b) => a.letter.localeCompare(b.letter)),
      summary: { avgFifaRanking, totalWorldCupTitles, confederations },
    };

    dataCache.set("aggregated", { data: result, expiresAt: Date.now() + 5 * 60 * 1000 });
    return result;
  },

  invalidateCache(): void {
    dataCache.delete("aggregated");
  },

  generateFallbackRankings(data: AggregatedPredictionData) {
    const teams = [...data.teams];
    const scored = teams.map((t) => {
      let score = 0;
      if (t.fifaRanking != null) score += Math.max(0, (100 - t.fifaRanking) * 0.5);
      score += t.worldCupTitles * 15;
      if (t.bestResult.includes("Champion") || t.bestResult.includes("冠军")) score += 20;
      else if (t.bestResult.includes("Final") || t.bestResult.includes("亚军")) score += 12;
      else if (t.bestResult.includes("Semi") || t.bestResult.includes("四强")) score += 7;
      const wins = (t.recentForm.match(/W/g) || []).length;
      score += wins * 3;
      if (t.groupStandings) {
        score += t.groupStandings.points * 2 + t.groupStandings.goalDifference;
      }
      return { ...t, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const totalScore = scored.reduce((sum, t) => sum + Math.max(t.score, 0.1), 0);

    return scored.map((t, i) => ({
      rank: i + 1,
      team: t.shortName || t.name,
      code: t.tla,
      probability: parseFloat(((Math.max(t.score, 0.1) / totalScore) * 100).toFixed(1)),
      trend: "stable" as const,
      change: 0,
      reasoning: [
        t.fifaRanking != null ? `FIFA #${t.fifaRanking}` : "",
        t.worldCupTitles > 0 ? `${t.worldCupTitles}次夺冠` : "",
        t.bestResult !== "—" ? `最佳${t.bestResult}` : "",
        t.recentForm !== "?????" ? `近5场${t.recentForm}` : "",
      ].filter(Boolean).join("，") || "数据不足",
    }));
  },
};
