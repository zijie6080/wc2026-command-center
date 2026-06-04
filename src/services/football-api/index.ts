// ============================================================
//  Football API — Unified Service Layer
// ============================================================

export { apiClient, ApiError } from "./client";
export { matchService } from "./match-service";
export { teamService } from "./team-service";
export { playerService } from "./player-service";
export { scheduleService } from "./schedule-service";
export type * from "./types";

// ---- Combined service object for convenience ----
import { matchService } from "./match-service";
import { teamService } from "./team-service";
import { playerService } from "./player-service";
import { scheduleService } from "./schedule-service";

export const footballApi = {
  matches: matchService,
  teams: teamService,
  players: playerService,
  schedule: scheduleService,
} as const;
