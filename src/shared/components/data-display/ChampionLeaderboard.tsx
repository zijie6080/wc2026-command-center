"use client";

import { memo, useEffect, useState } from "react";

// ============================================================
//  TYPES
// ============================================================

export interface ChampionTeam {
  rank: number;
  team: string;
  code: string;
  probability: number;
  trend: "up" | "down" | "stable";
  change: number;
  color: string;
}

export interface ChampionLeaderboardProps {
  teams: ChampionTeam[];
  maxDisplay?: number;
  defaultExpanded?: boolean;
  className?: string;
}

// ============================================================
//  FLAGS
// ============================================================

const FLAG_MAP: Record<string, string> = {
  AR: "🇦🇷", BR: "🇧🇷", FR: "🇫🇷", ES: "🇪🇸", GB: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", EN: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  PT: "🇵🇹", DE: "🇩🇪", IT: "🇮🇹", NL: "🇳🇱", BE: "🇧🇪", HR: "🇭🇷",
  US: "🇺🇸", CA: "🇨🇦", MX: "🇲🇽", JP: "🇯🇵", IR: "🇮🇷", KR: "🇰🇷",
  NG: "🇳🇬", MA: "🇲🇦", SN: "🇸🇳", GH: "🇬🇭", EG: "🇪🇬", CM: "🇨🇲",
  AU: "🇦🇺", NZ: "🇳🇿", UY: "🇺🇾", CO: "🇨🇴", EC: "🇪🇨", PE: "🇵🇪",
  CL: "🇨🇱", SA: "🇸🇦", QA: "🇶🇦", AE: "🇦🇪", CN: "🇨🇳",
};

function flag(code: string): string {
  return FLAG_MAP[code] || "🏳️";
}

// ============================================================
//  PODIUM MEDAL
// ============================================================

function PodiumMedal({ rank }: { rank: number }) {
  const medals: Record<number, { emoji: string; glow: string }> = {
    1: { emoji: "🥇", glow: "0 0 24px rgba(245,158,11,0.4)" },
    2: { emoji: "🥈", glow: "0 0 18px rgba(148,163,184,0.3)" },
    3: { emoji: "🥉", glow: "0 0 14px rgba(180,83,9,0.3)" },
  };
  const medal = medals[rank];
  if (!medal) return <span className="font-mono text-sm font-bold tabular-nums w-6 text-center" style={{ color: "var(--text-muted)" }}>{rank}</span>;

  return (
    <span className="text-2xl leading-none" style={{ filter: `drop-shadow(${medal.glow})` }}>
      {medal.emoji}
    </span>
  );
}

// ============================================================
//  TREND ARROW
// ============================================================

function TrendArrow({ trend, change }: { trend: string; change: number }) {
  const isUp = trend === "up";
  const isDown = trend === "down";
  if (trend === "stable") {
    return <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>— 0</span>;
  }
  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs font-mono font-semibold"
      style={{ color: isUp ? "var(--color-brand)" : "var(--color-live)" }}
    >
      <span>{isUp ? "▲" : "▼"}</span>
      <span>{isUp ? "+" : ""}{change.toFixed(1)}%</span>
    </span>
  );
}

// ============================================================
//  PROBABILITY BAR
// ============================================================

function ProbBar({ value, color, isTop3 }: { value: number; color: string; isTop3: boolean }) {
  return (
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className="h-2 flex-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${Math.min(value * 4, 100)}%`,
            backgroundColor: color,
            boxShadow: isTop3 ? `0 0 8px ${color}40` : undefined,
          }}
        />
      </div>
      <span className="w-14 text-right font-mono text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
        {value.toFixed(1)}%
      </span>
    </div>
  );
}

// ============================================================
//  SINGLE ROW
// ============================================================

function LeaderboardRow({
  team,
  isTop3,
  animateDelay,
}: {
  team: ChampionTeam;
  isTop3: boolean;
  animateDelay: number;
}) {
  return (
    <a
      href={`/team/${team.code}`}
      className="group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 hover:bg-white/[0.03] sm:gap-4 sm:px-5"
      style={{
        background: isTop3
          ? team.rank === 1
            ? "linear-gradient(90deg, rgba(245,158,11,0.08) 0%, transparent 40%)"
            : team.rank === 2
              ? "linear-gradient(90deg, rgba(148,163,184,0.05) 0%, transparent 40%)"
              : "linear-gradient(90deg, rgba(180,83,9,0.04) 0%, transparent 40%)"
          : "transparent",
        animation: `rowFadeIn 0.5s ease-out ${animateDelay}ms both`,
      }}
    >
      {/* Rank */}
      <div className="flex w-8 shrink-0 justify-center">
        <PodiumMedal rank={team.rank} />
      </div>

      {/* Flag + Team */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0" style={{ width: "clamp(120px, 20vw, 180px)" }}>
        <span
          className="text-xl sm:text-2xl leading-none shrink-0 transition-transform duration-200 group-hover:scale-110"
          style={{ filter: isTop3 ? "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" : undefined }}
        >
          {flag(team.code)}
        </span>
        <span
          className={cn("truncate font-semibold", isTop3 ? "text-sm sm:text-base" : "text-sm")}
          style={{ color: isTop3 ? "var(--text-primary)" : "var(--text-secondary)" }}
        >
          {team.team}
        </span>
      </div>

      {/* Prob bar (desktop) */}
      <div className="hidden flex-1 sm:flex">
        <ProbBar value={team.probability} color={team.color} isTop3={isTop3} />
      </div>

      {/* Prob value (mobile only) + Trend */}
      <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0">
        <span className="font-mono text-sm font-bold tabular-nums sm:hidden" style={{ color: "var(--text-primary)" }}>
          {team.probability.toFixed(1)}%
        </span>
        <TrendArrow trend={team.trend} change={team.change} />
      </div>
    </a>
  );
}

// ============================================================
//  MAIN COMPONENT
// ============================================================

function ChampionLeaderboardInner({
  teams,
  maxDisplay = 48,
  defaultExpanded = false,
  className = "",
}: ChampionLeaderboardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const sorted = [...teams].sort((a, b) => a.rank - b.rank);
  const displayTeams = expanded ? sorted.slice(0, maxDisplay) : sorted.slice(0, 8);
  const hasMore = sorted.length > 8;

  return (
    <div className={cn("flex flex-col", className)}>
      {/* ---- Header ---- */}
      <div className="mb-1 flex items-center px-4 py-2 sm:px-5" style={{ borderBottom: "1px solid var(--border-default)" }}>
        <div className="flex w-8 shrink-0 justify-center">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>#</span>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)", width: "clamp(120px, 20vw, 180px)" }}>
          球队
        </span>
        <span className="hidden flex-1 text-xs font-semibold uppercase tracking-wider sm:block" style={{ color: "var(--text-muted)" }}>
          夺冠概率
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider ml-auto sm:ml-0" style={{ color: "var(--text-muted)", width: "56px", textAlign: "right" }}>
          趋势
        </span>
      </div>

      {/* ---- Rows ---- */}
      <div
        className="flex flex-col"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
        }}
      >
        {displayTeams.map((team, i) => (
          <LeaderboardRow
            key={team.code}
            team={team}
            isTop3={team.rank <= 3}
            animateDelay={i * 40}
          />
        ))}
      </div>

      {/* ---- Expand/Collapse ---- */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mx-4 mt-2 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all duration-200 hover:bg-white/[0.03] sm:mx-5"
          style={{ color: "var(--text-secondary)" }}
        >
          {expanded ? (
            <>
              收起榜单
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="18 15 12 9 6 15" /></svg>
            </>
          ) : (
            <>
              查看全部 {sorted.length} 支球队
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
            </>
          )}
        </button>
      )}

      <style>{`
        @keyframes rowFadeIn {
          0% { opacity: 0; transform: translateX(-8px); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// ============================================================
//  HELPERS + EXPORT
// ============================================================

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export const ChampionLeaderboard = memo(ChampionLeaderboardInner);
export default ChampionLeaderboard;
