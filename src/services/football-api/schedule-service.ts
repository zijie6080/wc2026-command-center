// ============================================================
//  Schedule Service — Football API
// ============================================================

import { apiClient } from "./client";
import type { ApiResponse, ApiMatch, ApiScheduleDate } from "./types";

export const scheduleService = {
  /** Get tournament matches */
  all: (): Promise<ApiResponse<ApiMatch[]>> =>
    apiClient.getCached<ApiMatch[]>("/competitions/WC/matches", {}, 300),

  /** Get group standings */
  standings: (): Promise<ApiResponse<unknown[]>> =>
    apiClient.getCached<unknown[]>("/competitions/WC/standings", {}, 300),

  /** Get today's matches */
  today: (): Promise<ApiResponse<ApiMatch[]>> => {
    const today = new Date().toISOString().split("T")[0];
    return apiClient.getCached<ApiMatch[]>("/schedule", { date: today }, 60);
  },

  /** Get tomorrow's matches */
  tomorrow: (): Promise<ApiResponse<ApiMatch[]>> => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    return apiClient.getCached<ApiMatch[]>("/schedule", { date: tomorrow }, 300);
  },

  /** Get this week's matches (Mon-Sun) */
  thisWeek: (): Promise<ApiResponse<ApiMatch[]>> => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return apiClient.getCached<ApiMatch[]>(
      "/schedule",
      {
        from: monday.toISOString().split("T")[0],
        to: sunday.toISOString().split("T")[0],
        sort: "date_asc",
      },
      300,
    );
  },

  /** Get matches for a specific date */
  byDate: (date: string): Promise<ApiResponse<ApiMatch[]>> =>
    apiClient.getCached<ApiMatch[]>("/schedule", { date }, 300),

  /** Get matches for a specific team */
  byTeam: (teamId: string): Promise<ApiResponse<ApiMatch[]>> =>
    apiClient.getCached<ApiMatch[]>("/schedule", { teamId, sort: "date_asc" }, 300),

  /** Get matches by group (group stage only) */
  byGroup: (group: string): Promise<ApiResponse<ApiMatch[]>> =>
    apiClient.getCached<ApiMatch[]>("/schedule", { group, stage: "group_stage", sort: "date_asc" }, 300),

  /** Get matches by knockout stage */
  byStage: (stage: string): Promise<ApiResponse<ApiMatch[]>> =>
    apiClient.getCached<ApiMatch[]>("/schedule", { stage, sort: "date_asc" }, 300),

  /** Get calendar view data (dates with match counts) */
  calendar: (): Promise<ApiResponse<ApiScheduleDate[]>> =>
    apiClient.getCached<ApiScheduleDate[]>("/schedule/calendar", {}, 3600),

  /** Get all dates that have matches */
  datesWithMatches: (): Promise<ApiResponse<string[]>> =>
    apiClient.getCached<string[]>("/schedule/dates", {}, 3600),
};
