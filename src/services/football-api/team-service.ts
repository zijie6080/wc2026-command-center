// ============================================================
//  Team Service — Football API
// ============================================================

import { apiClient } from "./client";
import type { ApiResponse, ApiTeam, ApiSquadPlayer, ApiTeamMatch, ApiStandingRow, TeamQuery } from "./types";

export const teamService = {
  /** Get all 48 WC 2026 teams */
  list: (): Promise<ApiResponse<ApiTeam[]>> =>
    apiClient.getCached<ApiTeam[]>("/competitions/WC/teams", {}, 3600),

  /** Get a single team by ID */
  getById: (teamId: string): Promise<ApiResponse<ApiTeam>> =>
    apiClient.getCached<ApiTeam>(`/teams/${teamId}`, {}, 600),

  /** Get team squad (26 players) */
  squad: (teamId: string): Promise<ApiResponse<ApiSquadPlayer[]>> =>
    apiClient.getCached<ApiSquadPlayer[]>(`/teams/${teamId}/squad`, {}, 600),

  /** Get team recent matches */
  recentMatches: (teamId: string, limit = 5): Promise<ApiResponse<ApiTeamMatch[]>> =>
    apiClient.getCached<ApiTeamMatch[]>(
      `/teams/${teamId}/matches`,
      { status: "FINISHED", sort: "date_desc", limit },
      300,
    ),

  /** Get team upcoming matches */
  upcomingMatches: (teamId: string): Promise<ApiResponse<ApiTeamMatch[]>> =>
    apiClient.getCached<ApiTeamMatch[]>(
      `/teams/${teamId}/matches`,
      { status: "SCHEDULED", sort: "date_asc" },
      300,
    ),

  /** Get team group standings */
  standings: (teamId: string): Promise<ApiResponse<ApiStandingRow[]>> =>
    apiClient.getCached<ApiStandingRow[]>(`/teams/${teamId}/standings`, {}, 300),

  /** Get team tournament stats */
  stats: (teamId: string): Promise<ApiResponse<Record<string, number>>> =>
    apiClient.getCached<Record<string, number>>(`/teams/${teamId}/stats`, {}, 300),

  /** Get team world cup history */
  history: (teamId: string): Promise<ApiResponse<{ year: number; result: string; stage: string }[]>> =>
    apiClient.getCached<{ year: number; result: string; stage: string }[]>(
      `/teams/${teamId}/history`,
      {},
      86400,
    ),

  /** Get head-to-head between two teams */
  headToHead: (teamId1: string, teamId2: string): Promise<ApiResponse<{ totalMatches: number; team1Wins: number; draws: number; team2Wins: number; recentMatches: ApiTeamMatch[] }>> =>
    apiClient.getCached(
      `/teams/${teamId1}/head-to-head`,
      { opponentId: teamId2 },
      3600,
    ),
};
