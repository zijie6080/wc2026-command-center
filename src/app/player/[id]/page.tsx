"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { footballApi } from "@/services/football-api";
import PlayerPhoto from "@/shared/components/data-display/PlayerPhoto";
import { getChineseName } from "@/lib/player-names-zh";
import { getPlayerHonors } from "@/lib/player-honors";

// ============================================================
//  TYPES
// ============================================================

interface PlayerData {
  id: string | number;
  name: string;
  displayName?: string;
  number: number;
  position: string;
  positionGroup: "GK" | "DEF" | "MID" | "FWD";
  teamName: string;
  teamCode: string;
  teamId?: string | number;
  age?: number;
  dateOfBirth?: string;
  heightCm?: number;
  weightKg?: number;
  preferredFoot?: string;
  nationality?: string;
  club?: string;
  marketValue?: string;
  internationalCaps?: number;
  internationalGoals?: number;
  worldCupApps?: number;
  worldCupGoals?: number;
  isCaptain?: boolean;
  photoUrl?: string;
  abilityRadar?: Record<string, number>;
  tournamentStats?: TournamentStats;
  matchLog?: MatchLogItem[];
  honors?: string[];
}

interface TournamentStats {
  appearances?: number;
  minutesPlayed?: number;
  goals?: number;
  assists?: number;
  shots?: number;
  shotsOnTarget?: number;
  passAccuracy?: number;
  keyPasses?: number;
  successfulDribbles?: number;
  attemptedDribbles?: number;
  tackles?: number;
  interceptions?: number;
  foulsCommitted?: number;
  foulsSuffered?: number;
  yellowCards?: number;
  redCards?: number;
  distanceCovered?: number;
  averageRating?: number;
}

interface MatchLogItem {
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
  rating: number;
  isMVP: boolean;
}

// ============================================================
//  HELPERS
// ============================================================

const FLAG: Record<string, string> = {
  ARG: "🇦🇷", BRA: "🇧🇷", FRA: "🇫🇷", ESP: "🇪🇸", ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  POR: "🇵🇹", GER: "🇩🇪", ITA: "🇮🇹", NED: "🇳🇱", BEL: "🇧🇪", CRO: "🇭🇷",
  USA: "🇺🇸", CAN: "🇨🇦", MEX: "🇲🇽", JPN: "🇯🇵", KOR: "🇰🇷", IRN: "🇮🇷",
  NGA: "🇳🇬", MAR: "🇲🇦", SEN: "🇸🇳", EGY: "🇪🇬", GHA: "🇬🇭", CMR: "🇨🇲",
  AUS: "🇦🇺", NZL: "🇳🇿", URU: "🇺🇾", COL: "🇨🇴", ECU: "🇪🇨", PER: "🇵🇪",
  CHI: "🇨🇱", KSA: "🇸🇦", QAT: "🇶🇦", UAE: "🇦🇪", CIV: "🇨🇮",
  JAM: "🇯🇲", CZE: "🇨🇿", UKR: "🇺🇦", SUI: "🇨🇭", DEN: "🇩🇰",
  SWE: "🇸🇪", NOR: "🇳🇴", POL: "🇵🇱", AUT: "🇦🇹", HUN: "🇭🇺",
  SRB: "🇷🇸", TUR: "🇹🇷", GRE: "🇬🇷", PAR: "🇵🇾", BOL: "🇧🇴",
  VEN: "🇻🇪", ALG: "🇩🇿", TUN: "🇹🇳", COD: "🇨🇩", MLI: "🇲🇱", BFA: "🇧🇫",
};
function flag(c: string) {
  return FLAG[c] || "🏳️";
}
function cn(...c: (string | boolean | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

function fmtValue(v?: number): string {
  if (v == null) return "—";
  if (v >= 1_000_000) return `€${(v / 1_000_000).toFixed(0)}M`;
  if (v >= 1_000) return `€${(v / 1_000).toFixed(0)}K`;
  return `€${v}`;
}

// ============================================================
//  RADAR CHART (inline SVG)
// ============================================================

function RadarSVG({
  data,
  size = 200,
}: {
  data: { label: string; value: number }[];
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.35;
  const count = data.length;
  const angleSlice = (2 * Math.PI) / count;

  const points = data.map((d, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const val = Math.min(d.value, 100) / 100;
    return {
      x: cx + r * val * Math.cos(angle),
      y: cy + r * val * Math.sin(angle),
      label: d.label,
      value: d.value,
    };
  });

  const axisPoints = data.map((_, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto"
    >
      {[0.25, 0.5, 0.75, 1.0].map((level) => {
        const pts = data
          .map((_, i) => {
            const a = angleSlice * i - Math.PI / 2;
            return `${cx + r * level * Math.cos(a)},${cy + r * level * Math.sin(a)}`;
          })
          .join(" ");
        return (
          <polygon
            key={level}
            points={pts}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        );
      })}
      {axisPoints.map((p, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={p.x}
          y2={p.y}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.5"
        />
      ))}
      <polygon
        points={points.map((p) => `${p.x},${p.y}`).join(" ")}
        fill="rgba(0,224,122,0.12)"
        stroke="var(--color-brand)"
        strokeWidth="1.5"
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="4"
          fill="var(--color-brand)"
          stroke="var(--bg-root)"
          strokeWidth="1.5"
        />
      ))}
      {points.map((p, i) => (
        <text
          key={i}
          x={p.x}
          y={p.y}
          textAnchor="middle"
          dy="-12"
          fontSize="10"
          fontWeight="600"
          fill="var(--text-secondary)"
        >
          {p.label}
        </text>
      ))}
    </svg>
  );
}

// ============================================================
//  PAGE
// ============================================================

export default function PlayerDetailPage() {
  const params = useParams();
  const playerId = params.id as string;

  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "matchlog" | "honors">(
    "overview",
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Try the players API
        const res = await footballApi.players.getById(playerId);

        if (cancelled) return;

        if (res.success && res.data) {
          const raw = res.data as any;

          // Build radar from abilityRadar or construct defaults
          let radar: { label: string; value: number }[] = [];
          if (raw.abilityRadar && typeof raw.abilityRadar === "object") {
            radar = Object.entries(raw.abilityRadar).map(([k, v]) => ({
              label: k,
              value: Number(v) || 0,
            }));
          }

          const apiName = raw.displayName || raw.name || `${raw.firstName || ""} ${raw.lastName || ""}`.trim();
          const p: PlayerData = {
            id: raw.id || playerId,
            name: apiName,
            displayName: raw.displayNameCn || raw.displayName || "",
            number: raw.jerseyNumber || raw.shirtNumber || raw.number || 0,
            position: raw.positionDetail || raw.position || "",
            positionGroup: (raw.position?.toUpperCase() === "GK" ? "GK" : raw.position?.toUpperCase() === "DEF" ? "DEF" : raw.position?.toUpperCase() === "MID" ? "MID" : "FWD") as PlayerData["positionGroup"],
            teamName: raw.teamName || "",
            teamCode: raw.teamCode || "",
            teamId: raw.teamId,
            age: raw.age,
            dateOfBirth: raw.dateOfBirth,
            heightCm: raw.heightCm,
            weightKg: raw.weightKg,
            preferredFoot: raw.preferredFoot,
            nationality: raw.nationality,
            club: raw.clubTeam || raw.club || "",
            marketValue: raw.marketValueEur ? fmtValue(raw.marketValueEur) : undefined,
            internationalCaps: raw.internationalCaps,
            internationalGoals: raw.internationalGoals,
            worldCupApps: raw.worldCupAppearances,
            worldCupGoals: raw.worldCupGoals,
            isCaptain: raw.isCaptain,
            photoUrl: raw.photoUrl,
            abilityRadar: raw.abilityRadar,
            tournamentStats: raw.tournamentStats,
            matchLog: raw.matchLog,
            honors: raw.honors || getPlayerHonors(apiName) || [],
          };
          setPlayer(p);
          setError("");
        } else {
          // Fallback: search through teams for this player
          await loadFromTeamSquads();
        }
      } catch {
        if (!cancelled) {
          await loadFromTeamSquads();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function loadFromTeamSquads() {
      try {
        const teamsRes = await footballApi.teams.list();
        if (!teamsRes.success || !Array.isArray(teamsRes.data)) {
          if (!cancelled) setError("Player not found");
          return;
        }

        const teams = teamsRes.data as any[];
        for (const t of teams) {
          const squad = t.squad;
          if (!Array.isArray(squad)) continue;

          const found = squad.find(
            (sp: any) => String(sp.id) === String(playerId),
          );
          if (found) {
            const fallbackName = found.name || "";
            const p: PlayerData = {
              id: found.id,
              name: fallbackName,
              displayName: "",
              number: found.number || found.shirtNumber || 0,
              position: found.position || found.positionDetail || "",
              positionGroup: ((found.position || "").toUpperCase() === "GK" ? "GK" : (found.position || "").toUpperCase() === "DEF" ? "DEF" : (found.position || "").toUpperCase() === "MID" ? "MID" : "FWD") as PlayerData["positionGroup"],
              teamName: t.shortName || t.name || "",
              teamCode: t.tla || t.fifaCode || "",
              teamId: t.id,
              age: found.age || (found.dateOfBirth ? new Date().getFullYear() - new Date(found.dateOfBirth).getFullYear() : undefined),
              dateOfBirth: found.dateOfBirth,
              nationality: found.nationality,
              club: found.club || found.currentTeam?.name || "",
              isCaptain: found.isCaptain || false,
              honors: getPlayerHonors(fallbackName) || [],
              abilityRadar: undefined,
              tournamentStats: undefined,
              matchLog: undefined,
            };
            if (!cancelled) {
              setPlayer(p);
              setError("");
            }
            return;
          }
        }

        if (!cancelled) setError("Player not found");
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Failed to load player");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [playerId]);

  // Loading
  if (loading) {
    return (
      <div style={{ backgroundColor: "var(--bg-root)", minHeight: "100vh" }}>
        <div className="mx-auto max-w-[1000px] px-4 py-20">
          <div className="shimmer mx-auto h-32 w-32 rounded-full" />
          <div className="shimmer mx-auto mt-6 h-8 w-48 rounded" />
          <div className="shimmer mx-auto mt-2 h-5 w-64 rounded" />
        </div>
      </div>
    );
  }

  // Error
  if (error || !player) {
    return (
      <div
        style={{
          backgroundColor: "var(--bg-root)",
          minHeight: "100vh",
          color: "var(--text-primary)",
        }}
      >
        <div className="flex flex-col items-center py-20 text-center">
          <span className="text-5xl">👤</span>
          <h3 className="mt-4 text-lg font-bold">
            {error === "Player not found" ? "球员未找到" : "加载失败"}
          </h3>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {error === "Player not found"
              ? "该球员数据暂未录入系统"
              : error}
          </p>
          <a
            href="/players"
            className="mt-4 rounded-xl px-5 py-2 text-sm font-semibold text-black"
            style={{ backgroundColor: "var(--color-brand)" }}
          >
            返回球员列表
          </a>
        </div>
      </div>
    );
  }

  const radarData =
    player.abilityRadar && Object.keys(player.abilityRadar).length > 0
      ? Object.entries(player.abilityRadar).map(([k, v]) => ({
          label: k,
          value: v,
        }))
      : [
          { label: "射门", value: 0 },
          { label: "传球", value: 0 },
          { label: "盘带", value: 0 },
          { label: "速度", value: 0 },
          { label: "防守", value: 0 },
          { label: "体能", value: 0 },
        ];

  const hasRadar = player.abilityRadar && Object.keys(player.abilityRadar).length > 0;

  const stats = player.tournamentStats;

  return (
    <div
      style={{
        backgroundColor: "var(--bg-root)",
        minHeight: "100vh",
        color: "var(--text-primary)",
      }}
    >
      {/* HEADER */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          borderColor: "var(--border-default)",
          backgroundColor: "rgba(8,8,15,0.9)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div className="mx-auto flex h-14 max-w-[1000px] items-center gap-4 px-4 md:px-6">
          <a
            href="/players"
            className="flex shrink-0 items-center gap-1.5 text-sm font-medium transition-colors hover:text-white"
            style={{ color: "var(--text-secondary)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            球员
          </a>
          <span className="text-sm font-bold truncate">
            {player.name}{getChineseName(player.name) ? ` (${getChineseName(player.name)})` : ""} · #{player.number}
          </span>
        </div>
      </header>

      {/* HERO */}
      <div
        className="border-b"
        style={{
          borderColor: "var(--border-default)",
          background:
            "linear-gradient(180deg, rgba(117,170,219,0.08) 0%, var(--bg-root) 100%)",
        }}
      >
        <div className="mx-auto max-w-[1000px] px-4 py-8 md:px-6 md:py-10">
          <div className="flex flex-col items-center gap-6 md:flex-row md:gap-8">
            {/* Avatar */}
            <PlayerPhoto name={player.name} size={128} className="rounded-full border-2 border-[var(--border-default)]" />

            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center gap-2 md:justify-start">
                <span className="text-3xl font-extrabold">{player.name}</span>
                {getChineseName(player.name) && (
                  <span className="text-xl font-medium" style={{ color: "var(--text-muted)" }}>
                    ({getChineseName(player.name)})
                  </span>
                )}
                {player.isCaptain && <span className="text-sm">©</span>}
              </div>
              {player.displayName && (
                <p className="text-base mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {player.displayName}
                </p>
              )}
              <p className="text-base mt-0.5" style={{ color: "var(--text-secondary)" }}>
                #{player.number} · {player.position || "—"}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 text-sm md:justify-start md:gap-4">
                {player.club && (
                  <span style={{ color: "var(--text-muted)" }}>🏠 {player.club}</span>
                )}
                {player.age != null && (
                  <span style={{ color: "var(--text-muted)" }}>🎂 {player.age}岁</span>
                )}
                {player.heightCm != null && (
                  <span style={{ color: "var(--text-muted)" }}>📏 {player.heightCm}cm</span>
                )}
                {player.weightKg != null && (
                  <span style={{ color: "var(--text-muted)" }}>⚖️ {player.weightKg}kg</span>
                )}
                {player.preferredFoot && (
                  <span style={{ color: "var(--text-muted)" }}>🦶 {player.preferredFoot}</span>
                )}
                {player.marketValue && (
                  <span style={{ color: "var(--text-muted)" }}>💰 {player.marketValue}</span>
                )}
              </div>

              {/* Stats pills */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm md:justify-start">
                {player.internationalCaps != null && (
                  <div
                    className="rounded-xl px-3 py-2 text-center"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border-default)",
                    }}
                  >
                    <div className="text-lg font-bold font-mono">
                      {player.internationalCaps}
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      国家队出场
                    </div>
                  </div>
                )}
                {player.internationalGoals != null && (
                  <div
                    className="rounded-xl px-3 py-2 text-center"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border-default)",
                    }}
                  >
                    <div className="text-lg font-bold font-mono">
                      {player.internationalGoals}
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      国家队进球
                    </div>
                  </div>
                )}
                {player.worldCupApps != null && (
                  <div
                    className="rounded-xl px-3 py-2 text-center"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border-default)",
                    }}
                  >
                    <div className="text-lg font-bold font-mono">
                      {player.worldCupApps}
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      世界杯出场
                    </div>
                  </div>
                )}
                {player.worldCupGoals != null && (
                  <div
                    className="rounded-xl px-3 py-2 text-center"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border-default)",
                    }}
                  >
                    <div className="text-lg font-bold font-mono">
                      {player.worldCupGoals}
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      世界杯进球
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div
        className="sticky border-b"
        style={{
          top: 56,
          zIndex: 40,
          borderColor: "var(--border-default)",
          backgroundColor: "rgba(8,8,15,0.9)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="mx-auto flex max-w-[1000px] gap-0 px-4 md:px-6">
          {[
            { key: "overview" as const, label: "概览" },
            { key: "matchlog" as const, label: "比赛日志" },
            { key: "honors" as const, label: "荣誉" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="relative px-5 py-3 text-sm font-semibold transition-colors hover:text-white"
              style={{
                color:
                  activeTab === tab.key
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
              }}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span
                  className="absolute bottom-0 left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full"
                  style={{ backgroundColor: "var(--color-brand)" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto max-w-[1000px] px-4 py-6 md:px-6">
        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-8">
            {/* Tournament stats */}
            {stats && (
              <div>
                <h3 className="mb-3 text-base font-bold">📊 2026 世界杯表现</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {[
                    { label: "出场", value: stats.appearances },
                    { label: "进球", value: stats.goals },
                    { label: "助攻", value: stats.assists },
                    { label: "射门", value: stats.shots },
                    { label: "射正", value: stats.shotsOnTarget },
                    { label: "传球成功率", value: stats.passAccuracy != null ? `${stats.passAccuracy}%` : null },
                    { label: "关键传球", value: stats.keyPasses },
                    { label: "抢断", value: stats.tackles },
                    { label: "跑动距离", value: stats.distanceCovered != null ? `${stats.distanceCovered}km` : null },
                    { label: "评分", value: stats.averageRating != null ? stats.averageRating.toFixed(1) : null },
                  ]
                    .filter((s) => s.value != null)
                    .map((s) => (
                      <div
                        key={s.label}
                        className="rounded-xl border p-3 text-center"
                        style={{
                          borderColor: "var(--border-default)",
                          background:
                            "linear-gradient(135deg, var(--bg-card), rgba(15,15,26,0.6))",
                        }}
                      >
                        <div className="text-xl font-bold font-mono">{String(s.value)}</div>
                        <div
                          className="text-[10px] mt-0.5 font-semibold uppercase"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {s.label}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Radar */}
            <div className="flex flex-col items-center gap-6 md:flex-row">
              <div className="flex-1 w-full max-w-xs">
                <h3 className="mb-3 text-center text-base font-bold">🎯 能力雷达</h3>
                {hasRadar ? (
                  <RadarSVG data={radarData} size={240} />
                ) : (
                  <div
                    className="flex items-center justify-center"
                    style={{ height: 240 }}
                  >
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                      暂无能力数据
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 w-full">
                <h3 className="mb-3 text-base font-bold">📈 能力值</h3>
                {hasRadar ? (
                  <div className="flex flex-col gap-2">
                    {radarData.map((r) => (
                      <div key={r.label} className="flex items-center gap-3">
                        <span
                          className="w-16 text-right text-sm font-medium"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {r.label}
                        </span>
                        <div
                          className="h-2 flex-1 rounded-full overflow-hidden"
                          style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${r.value}%`,
                              backgroundColor:
                                r.value >= 90
                                  ? "var(--color-gold)"
                                  : r.value >= 80
                                    ? "var(--color-brand)"
                                    : "var(--text-muted)",
                            }}
                          />
                        </div>
                        <span className="w-8 text-right font-mono text-sm font-bold">
                          {r.value}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    能力值数据将在世界杯期间根据比赛表现更新
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MATCH LOG */}
        {activeTab === "matchlog" && (
          <div className="flex flex-col gap-2">
            <h3 className="mb-2 text-base font-bold">📅 比赛日志</h3>
            {player.matchLog && player.matchLog.length > 0 ? (
              player.matchLog.map((m, i) => (
                <a
                  key={m.matchId || i}
                  href={`/match/${m.matchId}`}
                  className="flex flex-col gap-2 rounded-xl border p-4 transition-all hover:bg-white/[0.02]"
                  style={{ borderColor: "var(--border-default)" }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-16 text-sm font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {m.date || "—"}
                    </span>
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-xs font-bold",
                        m.result === "W"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : m.result === "D"
                            ? "bg-yellow-500/10 text-yellow-400"
                            : "bg-red-500/10 text-red-400",
                      )}
                    >
                      {m.result || "—"}
                    </span>
                    <span className="flex-1 text-sm font-semibold">
                      {flag(player.teamCode)} {player.teamName}{" "}
                      {m.score || "? : ?"}{" "}
                      {flag(m.opponent?.code || "")} {m.opponent?.name || "—"}
                    </span>
                    {m.isMVP && (
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
                        style={{
                          backgroundColor: "rgba(245,158,11,0.15)",
                          color: "var(--color-gold)",
                        }}
                      >
                        ⭐ MVP
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 pl-[88px] text-xs">
                    <span style={{ color: "var(--text-muted)" }}>⚽ {m.goals ?? 0}</span>
                    <span style={{ color: "var(--text-muted)" }}>🅰 {m.assists ?? 0}</span>
                    <span style={{ color: "var(--text-muted)" }}>
                      🎯 {m.shots ?? 0}射门
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>
                      📨 {m.passes ? `${m.passes.accurate}/${m.passes.total}` : "—"}传球
                    </span>
                    <span
                      className={cn(
                        "ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold font-mono",
                      )}
                      style={{
                        backgroundColor:
                          m.rating >= 9
                            ? "var(--color-gold)"
                            : m.rating >= 8
                              ? "var(--color-brand)"
                              : "rgba(0,224,122,0.12)",
                        color: m.rating >= 8 ? "#000" : "var(--color-brand)",
                      }}
                    >
                      {m.rating?.toFixed(1) || "—"}
                    </span>
                  </div>
                </a>
              ))
            ) : (
              <div className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                暂无比赛记录。世界杯开赛后数据将自动更新。
              </div>
            )}
          </div>
        )}

        {/* HONORS */}
        {activeTab === "honors" && (
          <div>
            <h3 className="mb-3 text-base font-bold">🏆 职业生涯主要荣誉</h3>
            {player.honors && player.honors.length > 0 ? (
              <div className="flex flex-col gap-2">
                {player.honors.map((h, i) => (
                  <div
                    key={i}
                    className="rounded-xl border px-4 py-3 text-sm font-medium"
                    style={{
                      borderColor: "var(--border-default)",
                      background:
                        "linear-gradient(135deg, var(--bg-card), rgba(15,15,26,0.6))",
                    }}
                  >
                    {h}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                暂无荣誉数据
              </div>
            )}
          </div>
        )}
      </div>

      <div className="h-20" />
    </div>
  );
}
