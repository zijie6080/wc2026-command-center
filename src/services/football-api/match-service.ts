// ============================================================
//  Match Service — Football API
// ============================================================

import { apiClient } from "./client";
import type { ApiResponse, ApiMatch, ApiMatchEvent, ApiMatchStats, MatchQuery } from "./types";

export const matchService = {
  /** Get filtered match list */
  list: (query: MatchQuery = {}): Promise<ApiResponse<ApiMatch[]>> =>
    apiClient.getCached<ApiMatch[]>("/matches", query as Record<string, string | number | undefined>, 30),

  /** Get live matches only */
  live: (): Promise<ApiResponse<ApiMatch[]>> =>
    apiClient.get<ApiMatch[]>("/matches", { params: { status: "LIVE" } }),

  /** Get today's matches */
  today: (): Promise<ApiResponse<ApiMatch[]>> => {
    const today = new Date().toISOString().split("T")[0];
    return apiClient.getCached<ApiMatch[]>(
      "/matches",
      { date: today },
      60,
    );
  },

  /** Get a single match by ID */
  getById: (matchId: string): Promise<ApiResponse<ApiMatch>> =>
    apiClient.getCached<ApiMatch>(`/matches/${matchId}`, {}, 10),

  /** Get match events (timeline) */
  events: (matchId: string): Promise<ApiResponse<ApiMatchEvent[]>> =>
    apiClient.get<ApiMatchEvent[]>(`/matches/${matchId}/events`),

  /** Get match team stats */
  stats: (matchId: string): Promise<ApiResponse<{ home: ApiMatchStats; away: ApiMatchStats }>> =>
    apiClient.getCached<{ home: ApiMatchStats; away: ApiMatchStats }>(
      `/matches/${matchId}/stats`,
      {},
      10,
    ),

  /** Get completed matches */
  completed: (page = 1, limit = 20): Promise<ApiResponse<ApiMatch[]>> =>
    apiClient.getCached<ApiMatch[]>(
      "/matches",
      { status: "FINISHED", sort: "date_desc", page, limit },
      300,
    ),

  /** Get upcoming matches */
  upcoming: (days = 7): Promise<ApiResponse<ApiMatch[]>> => {
    const today = new Date().toISOString().split("T")[0];
    const end = new Date(Date.now() + days * 86400000).toISOString().split("T")[0];
    return apiClient.getCached<ApiMatch[]>(
      "/matches",
      { from: today, to: end, status: "SCHEDULED", sort: "date_asc" },
      300,
    );
  },

  /** Get featured/high-profile matches */
  featured: (): Promise<ApiResponse<ApiMatch[]>> =>
    apiClient.getCached<ApiMatch[]>(
      "/matches",
      { isFeatured: "true", limit: "5" },
      60,
    ),
};
