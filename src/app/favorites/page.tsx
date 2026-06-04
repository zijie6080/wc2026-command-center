"use client";

import { useState, useEffect, useCallback } from "react";

// ============================================================
//  TYPES
// ============================================================

interface FavItem {
  type: "team" | "player" | "match";
  id: string;
  name: string;
  code?: string;
  extra?: string;
  savedAt: number;
}

// ============================================================
//  HELPERS
// ============================================================

function cn(...c: (string | boolean | undefined | null)[]) { return c.filter(Boolean).join(" "); }

const FLAG: Record<string, string> = {
  ARG:"🇦🇷",BRA:"🇧🇷",FRA:"🇫🇷",ESP:"🇪🇸",ENG:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",POR:"🇵🇹",GER:"🇩🇪",ITA:"🇮🇹",NED:"🇳🇱",BEL:"🇧🇪",CRO:"🇭🇷",
  USA:"🇺🇸",CAN:"🇨🇦",MEX:"🇲🇽",JPN:"🇯🇵",KOR:"🇰🇷",IRN:"🇮🇷",NGA:"🇳🇬",MAR:"🇲🇦",SEN:"🇸🇳",EGY:"🇪🇬",GHA:"🇬🇭",CMR:"🇨🇲",
  AUS:"🇦🇺",NZL:"🇳🇿",URU:"🇺🇾",COL:"🇨🇴",ECU:"🇪🇨",PER:"🇵🇪",CHI:"🇨🇱",KSA:"🇸🇦",QAT:"🇶🇦",UAE:"🇦🇪",CIV:"🇨🇮",
  JAM:"🇯🇲",CZE:"🇨🇿",UKR:"🇺🇦",SUI:"🇨🇭",DEN:"🇩🇰",SWE:"🇸🇪",NOR:"🇳🇴",POL:"🇵🇱",AUT:"🇦🇹",HUN:"🇭🇺",
  SRB:"🇷🇸",TUR:"🇹🇷",GRE:"🇬🇷",PAR:"🇵🇾",BOL:"🇧🇴",VEN:"🇻🇪",ALG:"🇩🇿",TUN:"🇹🇳",COD:"🇨🇩",MLI:"🇲🇱",BFA:"🇧🇫",
};
function flag(c: string) { return FLAG[c] || "🏳️"; }

const STORAGE_KEY = "wc2026_favorites";

function loadFavorites(): FavItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveFavorites(items: FavItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
}

// ============================================================
//  LIVE DOT
// ============================================================

function LiveDot() {
  return <span className="relative flex h-2 w-2">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{backgroundColor:"var(--color-live)"}}/>
    <span className="relative inline-flex h-2 w-2 rounded-full" style={{backgroundColor:"var(--color-live)"}}/>
  </span>;
}

// ============================================================
//  EMPTY STATE
// ============================================================

type Tab = "all" | "teams" | "players" | "matches";

function EmptyFavorites({ tab }: { tab: Tab }) {
  const labels: Record<Tab, { icon: string; title: string; desc: string; href: string }> = {
    all: { icon:"⭐",title:"还没有收藏任何内容",desc:"浏览比赛、球队和球员页面，点击 ⭐ 即可收藏", href: "/" },
    teams: { icon:"👥",title:"还没有收藏球队",desc:"前往球队页面，点击 ⭐ 收藏你喜欢的国家队", href: "/teams" },
    players: { icon:"🌟",title:"还没有收藏球员",desc:"前往球员页面，点击 ⭐ 收藏你关注的球星", href: "/players" },
    matches: { icon:"⚽",title:"还没有收藏比赛",desc:"赛程页面中点击 ⭐ 标记你想看的比赛", href: "/schedule" },
  };
  const l = labels[tab];
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <span className="text-5xl">{l.icon}</span>
      <h3 className="mt-4 text-lg font-bold">{l.title}</h3>
      <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{l.desc}</p>
      <a href={l.href} className="mt-4 rounded-xl px-5 py-2 text-sm font-semibold text-black"
        style={{ backgroundColor: "var(--color-brand)" }}>去浏览</a>
    </div>
  );
}

// ============================================================
//  FAV CARD RENDERERS
// ============================================================

function TeamFavCard({ item, onRemove }: { item: FavItem; onRemove: () => void }) {
  return (
    <a href={`/team/${item.id || item.code}`}
      className="group relative flex items-center gap-4 rounded-xl border p-4 transition-all hover:-translate-y-0.5"
      style={{ borderColor: "var(--border-default)", background: "linear-gradient(135deg, var(--bg-card), rgba(15,15,26,0.6))" }}>
      <span className="text-3xl shrink-0">{flag(item.code || "")}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold">{item.name}</div>
        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.extra || ""}</div>
      </div>
      <button onClick={(e) => { e.preventDefault(); onRemove(); }}
        className="z-10 text-sm transition-colors hover:scale-110" title="取消收藏">⭐</button>
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-white opacity-0 transition-opacity group-hover:opacity-[0.02]" />
    </a>
  );
}

function PlayerFavCard({ item, onRemove }: { item: FavItem; onRemove: () => void }) {
  return (
    <a href={`/player/${item.id}`}
      className="group relative flex items-center gap-4 rounded-xl border p-4 transition-all hover:-translate-y-0.5"
      style={{ borderColor: "var(--border-default)", background: "linear-gradient(135deg, var(--bg-card), rgba(15,15,26,0.6))" }}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold font-mono"
        style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>👤</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold">{item.name}</span>
          {item.code && <span className="text-xs">{flag(item.code)}</span>}
        </div>
        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.extra || ""}</div>
      </div>
      <button onClick={(e) => { e.preventDefault(); onRemove(); }}
        className="z-10 text-sm transition-colors hover:scale-110" title="取消收藏">⭐</button>
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-white opacity-0 transition-opacity group-hover:opacity-[0.02]" />
    </a>
  );
}

function MatchFavCard({ item, onRemove }: { item: FavItem; onRemove: () => void }) {
  const parts = (item.extra || "").split("|");
  const status = parts[0] || "upcoming";
  const homeTeam = parts[1] || "—";
  const awayTeam = parts[2] || "—";
  const homeCode = parts[3] || "";
  const awayCode = parts[4] || "";
  const score = parts[5] || "";

  return (
    <a href={`/match/${item.id}`}
      className="group relative flex items-center gap-4 rounded-xl border p-4 transition-all hover:-translate-y-0.5"
      style={{
        borderColor: status === "live" ? "rgba(239,68,68,0.4)" : "var(--border-default)",
        background: status === "live"
          ? "linear-gradient(135deg, rgba(239,68,68,0.04), var(--bg-card))"
          : "linear-gradient(135deg, var(--bg-card), rgba(15,15,26,0.6))",
      }}>
      <span className="text-xl shrink-0">{flag(homeCode)}</span>
      <div className="flex-1 min-w-0 text-center">
        <div className="text-sm font-bold">{homeTeam} vs {awayTeam}</div>
        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.name}</div>
      </div>
      <span className="text-xl shrink-0">{flag(awayCode)}</span>
      {status === "live" && <LiveDot />}
      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase shrink-0",
        status === "live" ? "bg-red-500/15 text-red-400" :
        status === "finished" ? "bg-white/5 text-gray-500" : "bg-emerald-500/10 text-emerald-400")}>
        {status === "live" ? "LIVE" : status === "finished" ? "FT" : score || "VS"}
      </span>
      <button onClick={(e) => { e.preventDefault(); onRemove(); }}
        className="z-10 text-sm transition-colors hover:scale-110" title="取消收藏">⭐</button>
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-white opacity-0 transition-opacity group-hover:opacity-[0.02]" />
    </a>
  );
}

// ============================================================
//  PAGE
// ============================================================

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavItem[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setFavorites(loadFavorites());
    setMounted(true);
  }, []);

  const removeItem = useCallback((id: string, type: string) => {
    setFavorites(prev => {
      const next = prev.filter(f => !(f.id === id && f.type === type));
      saveFavorites(next);
      return next;
    });
  }, []);

  if (!mounted) {
    return (
      <div style={{ backgroundColor: "var(--bg-root)", minHeight: "100vh" }}>
        <div className="mx-auto max-w-[900px] px-4 py-20">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shimmer mb-2 rounded-xl" style={{ height: 72 }} />
          ))}
        </div>
      </div>
    );
  }

  const teamFavs = favorites.filter(f => f.type === "team");
  const playerFavs = favorites.filter(f => f.type === "player");
  const matchFavs = favorites.filter(f => f.type === "match");

  const totalCount = favorites.length;

  const tabs: { key: Tab; label: string; count: number; icon: string }[] = [
    { key: "all", label: "全部", count: totalCount, icon: "⭐" },
    { key: "teams", label: "球队", count: teamFavs.length, icon: "👥" },
    { key: "players", label: "球员", count: playerFavs.length, icon: "🌟" },
    { key: "matches", label: "比赛", count: matchFavs.length, icon: "⚽" },
  ];

  const showTeams = activeTab === "all" || activeTab === "teams";
  const showPlayers = activeTab === "all" || activeTab === "players";
  const showMatches = activeTab === "all" || activeTab === "matches";

  return (
    <div style={{ backgroundColor: "var(--bg-root)", minHeight: "100vh", color: "var(--text-primary)" }}>
      <header className="sticky top-0 z-50 border-b"
        style={{ borderColor: "var(--border-default)", backgroundColor: "rgba(8,8,15,0.9)", backdropFilter: "blur(16px)" }}>
        <div className="mx-auto flex h-14 max-w-[900px] items-center gap-4 px-4 md:px-6">
          <a href="/" className="flex shrink-0 items-center gap-1.5 text-sm font-medium transition-colors hover:text-white"
            style={{ color: "var(--text-secondary)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </a>
          <h1 className="text-base font-bold">⭐ 我的收藏</h1>
          <span className="ml-auto text-xs font-bold" style={{ color: "var(--text-muted)" }}>{totalCount} 项</span>
        </div>
      </header>

      <div className="sticky border-b" style={{ top: 56, zIndex: 40, borderColor: "var(--border-default)", backgroundColor: "rgba(8,8,15,0.9)", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex max-w-[900px] gap-1 px-4 py-2 md:px-6">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={cn("flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                activeTab === tab.key ? "text-black" : "text-gray-400 hover:text-white")}
              style={{ backgroundColor: activeTab === tab.key ? "var(--color-brand)" : "rgba(255,255,255,0.03)" }}>
              <span className="text-xs">{tab.icon}</span>
              {tab.label}
              <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                activeTab === tab.key ? "bg-black/20 text-black" : "bg-white/5")}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[900px] px-4 py-6 md:px-6">
        {totalCount === 0 ? (
          <EmptyFavorites tab="all" />
        ) : (
          <>
            {showTeams && (teamFavs.length > 0 || activeTab === "teams") && (
              <div className="mb-8">
                {activeTab === "all" && <h3 className="mb-3 text-base font-bold">👥 收藏球队</h3>}
                {teamFavs.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {teamFavs.map(t => <TeamFavCard key={t.id} item={t} onRemove={() => removeItem(t.id, "team")} />)}
                  </div>
                ) : activeTab === "teams" ? <EmptyFavorites tab="teams" /> : null}
              </div>
            )}

            {showPlayers && (playerFavs.length > 0 || activeTab === "players") && (
              <div className="mb-8">
                {activeTab === "all" && <h3 className="mb-3 text-base font-bold">🌟 收藏球员</h3>}
                {playerFavs.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {playerFavs.map(p => <PlayerFavCard key={p.id} item={p} onRemove={() => removeItem(p.id, "player")} />)}
                  </div>
                ) : activeTab === "players" ? <EmptyFavorites tab="players" /> : null}
              </div>
            )}

            {showMatches && (matchFavs.length > 0 || activeTab === "matches") && (
              <div className="mb-8">
                {activeTab === "all" && <h3 className="mb-3 text-base font-bold">⚽ 收藏比赛</h3>}
                {matchFavs.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {matchFavs.map(m => <MatchFavCard key={m.id} item={m} onRemove={() => removeItem(m.id, "match")} />)}
                  </div>
                ) : activeTab === "matches" ? <EmptyFavorites tab="matches" /> : null}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
