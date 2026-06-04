// ============================================================
//  Player Service — Football API
// ============================================================

import { apiClient } from "./client";
import type { ApiResponse, ApiPlayer, ApiPlayerTournamentStats, ApiPlayerMatchLog, PlayerQuery } from "./types";

export const playerService = {
  /** Get filtered player list */
  list: (query: PlayerQuery = {}): Promise<ApiResponse<ApiPlayer[]>> =>
    apiClient.getCached<ApiPlayer[]>("/players", query as Record<string, string | number | undefined>, 3600),

  /** Get a single player by ID */
  getById: (playerId: string): Promise<ApiResponse<ApiPlayer>> =>
    apiClient.getCached<ApiPlayer>(`/players/${playerId}`, {}, 600),

  /** Get player tournament stats */
  stats: (playerId: string): Promise<ApiResponse<ApiPlayerTournamentStats>> =>
    apiClient.getCached<ApiPlayerTournamentStats>(`/players/${playerId}/stats`, {}, 300),

  /** Get player match log */
  matchLog: (playerId: string): Promise<ApiResponse<ApiPlayerMatchLog[]>> =>
    apiClient.getCached<ApiPlayerMatchLog[]>(`/players/${playerId}/match-log`, {}, 300),

  /** Get player honors */
  honors: (playerId: string): Promise<ApiResponse<string[]>> =>
    apiClient.getCached<string[]>(`/players/${playerId}/honors`, {}, 86400),

  /** Get similar players (by play style) */
  similar: (playerId: string): Promise<ApiResponse<{ playerId: string; name: string; teamCode: string; similarity: number }[]>> =>
    apiClient.getCached(`/players/${playerId}/similar`, {}, 3600),

  /** Compare two players */
  compare: (playerId1: string, playerId2: string): Promise<ApiResponse<{ player1: ApiPlayer; player2: ApiPlayer; comparison: Record<string, { value1: number; value2: number }> }>> =>
    apiClient.getCached(`/players/compare`, { ids: `${playerId1},${playerId2}` }, 600),

  /** Get top scorers leaderboard */
  topScorers: (stage?: string, limit = 20): Promise<ApiResponse<ApiPlayer[]>> =>
    apiClient.getCached<ApiPlayer[]>(
      "/players",
      { sort: "goals_desc", position: "FWD", limit, stage: stage || undefined },
      300,
    ),

  /** Get top assists leaderboard */
  topAssists: (stage?: string, limit = 20): Promise<ApiResponse<ApiPlayer[]>> =>
    apiClient.getCached<ApiPlayer[]>(
      "/players",
      { sort: "assists_desc", limit, stage: stage || undefined },
      300,
    ),

  /** Get top rated players */
  topRated: (minMinutes = 90, limit = 20): Promise<ApiResponse<ApiPlayer[]>> =>
    apiClient.getCached<ApiPlayer[]>(
      "/players",
      { sort: "rating_desc", limit },
      300,
    ),
};
