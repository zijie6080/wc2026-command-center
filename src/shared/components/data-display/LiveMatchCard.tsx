"use client";

import { memo } from "react";

// ============================================================
//  TYPES
// ============================================================

export interface TeamInfo {
  name: string;
  code: string;
  score?: number;
}

export interface CardCount {
  yellow: number;
  red: number;
}

export interface MatchEvent {
  minute: number;
  type: "goal" | "yellow_card" | "red_card" | "substitution" | "var";
  player: string;
  team: "home" | "away";
}

export type MatchStatus = "upcoming" | "live" | "halftime" | "finished" | "postponed" | "cancelled";
export type CardVariant = "default" | "compact" | "featured";
export type CardSize = "sm" | "md" | "lg";

export interface LiveMatchCardProps {
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  status: MatchStatus;
  minute?: number;
  injuryTime?: number;
  homeCards?: CardCount;
  awayCards?: CardCount;
  events?: MatchEvent[];
  href?: string;
  variant?: CardVariant;
  size?: CardSize;
  className?: string;
  onClick?: () => void;
}

// ============================================================
//  FLAG EMOJI MAP
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
//  STATUS CONFIG
// ============================================================

interface StatusConfig {
  label: string;
  dot: boolean;
  dotColor: string;
  borderColor: string;
  bgGlow: string;
}

function getStatusConfig(status: MatchStatus): StatusConfig {
  switch (status) {
    case "live":
      return {
        label: `LIVE`,
        dot: true,
        dotColor: "var(--color-live)",
        borderColor: "rgba(239,68,68,0.45)",
        bgGlow: "rgba(239,68,68,0.06)",
      };
    case "halftime":
      return {
        label: "HT",
        dot: false,
        dotColor: "",
        borderColor: "rgba(245,158,11,0.4)",
        bgGlow: "rgba(245,158,11,0.04)",
      };
    case "finished":
      return {
        label: "FT",
        dot: false,
        dotColor: "",
        borderColor: "var(--border-default)",
        bgGlow: "transparent",
      };
    case "upcoming":
      return {
        label: "",
        dot: false,
        dotColor: "",
        borderColor: "var(--border-default)",
        bgGlow: "transparent",
      };
    case "postponed":
      return {
        label: "延期",
        dot: false,
        dotColor: "",
        borderColor: "rgba(239,68,68,0.3)",
        bgGlow: "transparent",
      };
    case "cancelled":
      return {
        label: "取消",
        dot: false,
        dotColor: "",
        borderColor: "rgba(255,255,255,0.03)",
        bgGlow: "transparent",
      };
  }
}

// ============================================================
//  SUB-COMPONENTS
// ============================================================

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span
        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
        style={{ backgroundColor: "var(--color-live)" }}
      />
      <span
        className="relative inline-flex h-2 w-2 rounded-full"
        style={{ backgroundColor: "var(--color-live)" }}
      />
    </span>
  );
}

function CardBadge({ yellow, red }: CardCount) {
  return (
    <div className="flex items-center gap-1.5" title={`黄牌 ${yellow} · 红牌 ${red}`}>
      {yellow > 0 && (
        <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-bold"
          style={{ backgroundColor: "rgba(234,179,8,0.15)", color: "#eab308" }}>
          <span className="inline-block h-2 w-1.5 rounded-sm" style={{ backgroundColor: "#eab308" }} />
          {yellow}
        </span>
      )}
      {red > 0 && (
        <span className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-bold"
          style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
          <span className="inline-block h-2 w-1.5 rounded-sm" style={{ backgroundColor: "#ef4444" }} />
          {red}
        </span>
      )}
      {yellow === 0 && red === 0 && (
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>—</span>
      )}
    </div>
  );
}

function MinuteDisplay({ status, minute, injuryTime }: { status: MatchStatus; minute?: number; injuryTime?: number }) {
  if (status === "upcoming" || status === "postponed" || status === "cancelled") return null;
  if (status === "finished") return <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>FT</span>;

  const display = minute ?? 0;
  const extra = injuryTime ? `+${injuryTime}` : "";
  return (
    <span className="text-xs font-mono font-bold tabular-nums" style={{ color: "var(--color-live)" }}>
      {display}&apos;{extra}
    </span>
  );
}

// ============================================================
//  MAIN COMPONENT
// ============================================================

function LiveMatchCardInner({
  homeTeam,
  awayTeam,
  status,
  minute,
  injuryTime,
  homeCards = { yellow: 0, red: 0 },
  awayCards = { yellow: 0, red: 0 },
  events,
  href,
  variant = "default",
  size = "md",
  className = "",
  onClick,
}: LiveMatchCardProps) {
  const cfg = getStatusConfig(status);
  const isLive = status === "live";
  const isUpcoming = status === "upcoming";
  const isFinished = status === "finished";
  const isCancelled = status === "cancelled" || status === "postponed";

  // ---- Size tokens ----
  const sizeTokens = {
    sm: { card: "w-[180px] p-3 gap-2", flag: "text-xl", team: "text-[11px]", score: "text-lg", pad: "px-2 py-1" },
    md: { card: "w-[240px] p-4 gap-3", flag: "text-2xl", team: "text-xs", score: "text-xl", pad: "px-3 py-1.5" },
    lg: { card: "w-[320px] p-5 gap-4", flag: "text-3xl", team: "text-sm", score: "text-2xl", pad: "px-4 py-2" },
  };
  const t = sizeTokens[size];

  // ---- Featured variant adds extra height ----
  const isFeatured = variant === "featured";
  const cardClass = cn(
    "relative flex shrink-0 flex-col rounded-2xl border transition-all duration-300 select-none",
    t.card,
    isLive && "live-card-glow",
    isCancelled && "opacity-50",
    (href || onClick) && "cursor-pointer hover:-translate-y-0.5",
    isFeatured && "ring-1 ring-[rgba(245,158,11,0.15)]",
    className,
  );

  const Wrapper = href ? "a" : "div";
  const wrapperProps = href ? { href, onClick } : { onClick };

  return (
    <Wrapper
      {...(wrapperProps as Record<string, unknown>)}
      className={cardClass}
      style={{
        background: isFeatured
          ? "linear-gradient(135deg, rgba(245,158,11,0.04) 0%, var(--bg-card) 50%, rgba(245,158,11,0.02) 100%)"
          : "linear-gradient(135deg, var(--bg-card), rgba(15,15,26,0.6))",
        borderColor: cfg.borderColor,
        boxShadow: isLive ? `0 0 20px ${cfg.bgGlow}` : undefined,
      }}
    >
      {/* ---- Status bar ---- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {cfg.dot && <LiveDot />}
          {cfg.label && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{
                backgroundColor: isLive ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
                color: isLive ? "var(--color-live)" : "var(--text-muted)",
              }}
            >
              {cfg.label}
            </span>
          )}
          <MinuteDisplay status={status} minute={minute} injuryTime={injuryTime} />
        </div>
        <div className="flex items-center gap-2">
          <CardBadge {...homeCards} />
          <CardBadge {...awayCards} />
        </div>
      </div>

      {/* ---- Teams & Score ---- */}
      <div className="flex items-center justify-between">
        {/* Home */}
        <div className="flex flex-1 flex-col items-center gap-1 text-center">
          <span className={t.flag}>{flag(homeTeam.code)}</span>
          <span className={cn("font-medium truncate max-w-full", t.team)} style={{ color: "var(--text-secondary)" }}>
            {homeTeam.name}
          </span>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center px-2">
          {isUpcoming ? (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xs font-extrabold tracking-wider" style={{ color: "var(--text-muted)" }}>VS</span>
              {minute !== undefined && (
                <span className="text-xs font-mono font-bold" style={{ color: "var(--color-brand)" }}>
                  {minute}&apos;
                </span>
              )}
            </div>
          ) : isCancelled ? (
            <span className="text-xs font-bold tracking-wider" style={{ color: "var(--text-muted)" }}>
              {status === "postponed" ? "延期" : "取消"}
            </span>
          ) : (
            <div
              className={cn("flex items-center gap-1.5 rounded-xl font-mono font-bold tracking-tight", t.pad)}
              style={{
                background: isLive
                  ? "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.02))"
                  : "linear-gradient(135deg, var(--bg-card), var(--bg-elevated))",
                border: `1px solid ${isLive ? "rgba(239,68,68,0.2)" : "var(--border-default)"}`,
              }}
            >
              <span className={t.score} style={{ color: isLive ? "var(--text-primary)" : "var(--text-primary)" }}>
                {homeTeam.score ?? 0}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>:</span>
              <span className={t.score} style={{ color: isLive ? "var(--text-primary)" : "var(--text-primary)" }}>
                {awayTeam.score ?? 0}
              </span>
            </div>
          )}
        </div>

        {/* Away */}
        <div className="flex flex-1 flex-col items-center gap-1 text-center">
          <span className={t.flag}>{flag(awayTeam.code)}</span>
          <span className={cn("font-medium truncate max-w-full", t.team)} style={{ color: "var(--text-secondary)" }}>
            {awayTeam.name}
          </span>
        </div>
      </div>

      {/* ---- Events (featured variant only) ---- */}
      {isFeatured && events && events.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {events.slice(0, 3).map((ev, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: ev.type === "goal"
                  ? "rgba(0,224,122,0.1)"
                  : ev.type === "yellow_card"
                    ? "rgba(234,179,8,0.1)"
                    : ev.type === "red_card"
                      ? "rgba(239,68,68,0.1)"
                      : "rgba(255,255,255,0.04)",
                color: ev.type === "goal"
                  ? "var(--color-brand)"
                  : ev.type === "yellow_card"
                    ? "#eab308"
                    : ev.type === "red_card"
                      ? "#ef4444"
                      : "var(--text-muted)",
              }}
            >
              {ev.type === "goal" && "⚽"}
              {ev.type === "yellow_card" && "🟡"}
              {ev.type === "red_card" && "🟥"}
              {ev.type === "substitution" && "🔄"}
              {ev.type === "var" && "📺"}
              {ev.player} {ev.minute}&apos;
            </span>
          ))}
          {events.length > 3 && (
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              +{events.length - 3}
            </span>
          )}
        </div>
      )}

      {/* ---- Inline style ---- */}
      <style>{`
        @keyframes liveCardPulse {
          0%, 100% { border-color: rgba(239,68,68,0.45); }
          50% { border-color: rgba(239,68,68,0.7); }
        }
        .live-card-glow {
          animation: liveCardPulse 1.8s ease-in-out infinite;
        }
      `}</style>
    </Wrapper>
  );
}

// ============================================================
//  UTIL + EXPORT
// ============================================================

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export const LiveMatchCard = memo(LiveMatchCardInner);
export default LiveMatchCard;
