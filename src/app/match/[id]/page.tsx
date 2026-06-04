"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { footballApi } from "@/services/football-api";
import type { ApiMatch, ApiMatchEvent, MatchStatus } from "@/services/football-api/types";
import DataCard from "@/shared/components/ui/DataCard";
import Badge from "@/shared/components/ui/Badge";
import PageShell from "@/shared/components/ui/PageShell";

const AiAnalysisTab = dynamic(() => import("@/features/match/components/AiAnalysisTab"), { ssr: false });

const FLAG: Record<string, string> = {
  ARG:"🇦🇷",BRA:"🇧🇷",FRA:"🇫🇷",ESP:"🇪🇸",ENG:"🏴",POR:"🇵🇹",GER:"🇩🇪",ITA:"🇮🇹",
  NED:"🇳🇱",BEL:"🇧🇪",CRO:"🇭🇷",USA:"🇺🇸",CAN:"🇨🇦",MEX:"🇲🇽",JPN:"🇯🇵",KOR:"🇰🇷",
  IRN:"🇮🇷",NGA:"🇳🇬",MAR:"🇲🇦",SEN:"🇸🇳",EGY:"🇪🇬",AUS:"🇦🇺",NZL:"🇳🇿",URU:"🇺🇾",
  COL:"🇨🇴",ECU:"🇪🇨",PER:"🇵🇪",CHI:"🇨🇱",KSA:"🇸🇦",QAT:"🇶🇦",
};
const f = (c: string) => FLAG[c] || "🏳️";
const cn = (...c: (string | boolean | undefined | null)[]) => c.filter(Boolean).join(" ");

function isLive(s: MatchStatus) { return ["LIVE","IN_PLAY","PAUSED"].includes(s); }
function isUpcoming(s: MatchStatus) { return ["SCHEDULED","TIMED"].includes(s); }

function eventEmoji(t: string) { const m: Record<string,string>={goal:"⚽",penalty_goal:"⚽",own_goal:"⚽",yellow_card:"🟡",red_card:"🟥",substitution:"🔄",var_review:"📺"}; return m[t]||"●"; }

// ============================================================
//  PAGE
// ============================================================

export default function MatchDetailPage() {
  const params = useParams(); const matchId = params.id as string;
  const [match, setMatch] = useState<ApiMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"timeline"|"stats"|"ai">("timeline");
  const [clock, setClock] = useState(0);
  const mounted = useRef(true);

  const fetchData = async () => {
    try {
      const res = await footballApi.matches.getById(matchId);
      if (!mounted.current) return;
      if (res.success && res.data) {
        const m = res.data as unknown as ApiMatch;
        setMatch(m);
        if (isLive(m.status) && m.minute != null) setClock(m.minute * 60);
        setError("");
      } else setError("Match not found");
    } catch (e: any) { if (mounted.current) setError(e.message); }
    finally { if (mounted.current) setLoading(false); }
  };

  useEffect(() => { mounted.current = true; fetchData(); return () => { mounted.current = false; }; }, [matchId]);
  useEffect(() => { if (!match || !isLive(match.status)) return; const i = setInterval(() => setClock(p => p + 1), 1000); return () => clearInterval(i); }, [match?.status]);
  useEffect(() => { if (!match || !isLive(match.status)) return; const i = setInterval(fetchData, 15000); return () => clearInterval(i); }, [match?.status, matchId]);

  if (loading) return <div className="min-h-screen bg-[var(--bg-deep)]"><PageShell className="py-20"><div className="shimmer mx-auto h-8 w-64 rounded"/><div className="shimmer mx-auto mt-4 h-20 w-80 rounded-2xl"/></PageShell></div>;
  if (error || !match) return <div className="min-h-screen bg-[var(--bg-deep)] flex flex-col items-center justify-center py-20"><p className="text-5xl mb-4">⚠️</p><h2 className="text-lg font-semibold">加载失败</h2><p className="text-sm text-[var(--text-muted)] mt-1">{error||"比赛不存在"}</p><a href="/live" className="mt-4 text-sm font-medium text-[var(--accent-primary)]">← 返回比赛中心</a></div>;

  const home = match.homeTeam as any; const away = match.awayTeam as any;
  const homeCode = home?.code || home?.tla || ""; const awayCode = away?.code || away?.tla || "";
  const homeName = home?.shortName || home?.name || "?"; const awayName = away?.shortName || away?.name || "?";
  const ft = match.score?.fullTime || match.score?.ft;
  const score = { home: ft?.home ?? 0, away: ft?.away ?? 0 };
  const live = isLive(match.status);
  const events = (match as any).events || match.events || [];
  const stats = (match as any).stats;
  const statRows: { label: string; home: number; away: number; unit?: string }[] = [];
  if (stats?.home && stats?.away) {
    const h = stats.home, a = stats.away;
    if (h.possession != null) statRows.push({ label: "控球率", home: h.possession, away: a.possession, unit: "%" });
    if (h.shots?.total != null) statRows.push({ label: "射门", home: h.shots.total, away: a.shots.total });
    if (h.shots?.onTarget != null) statRows.push({ label: "射正", home: h.shots.onTarget, away: a.shots.onTarget });
    if (h.xG != null) statRows.push({ label: "xG", home: h.xG, away: a.xG });
    if (h.passes?.total != null) statRows.push({ label: "传球", home: h.passes.total, away: a.passes.total });
    if (h.corners != null) statRows.push({ label: "角球", home: h.corners, away: a.corners });
    if (h.fouls?.committed != null) statRows.push({ label: "犯规", home: h.fouls.committed, away: a.fouls.committed });
    if (h.cards?.yellow != null) statRows.push({ label: "黄牌", home: h.cards.yellow, away: a.cards.yellow });
    if (h.offsides != null) statRows.push({ label: "越位", home: h.offsides, away: a.offsides });
  }

  return (
    <div className="min-h-screen bg-[var(--bg-deep)]">
      {/* HEADER */}
      <header className="glass-panel sticky top-0 z-50">
        <PageShell>
          <div className="flex h-14 items-center justify-between">
            <a href="/live" className="text-sm font-medium text-[var(--text-muted)] hover:text-white">← 返回</a>
            <span className="text-sm font-semibold">{homeName} vs {awayName}</span>
            {live ? <Badge variant="live">● LIVE</Badge> : match.status === "FINISHED" ? <Badge variant="muted">FT</Badge> : <Badge variant="green">VS</Badge>}
          </div>
        </PageShell>
      </header>

      {/* SCOREBOARD */}
      <div className="relative border-b border-[var(--border-subtle)] bg-gradient-to-b from-[var(--accent-primary)]/3 to-transparent">
        <PageShell>
          <div className="py-12 text-center">
            <div className="flex items-center justify-center gap-8 md:gap-16">
              <div className="flex flex-col items-center gap-3">
                <span className="text-5xl md:text-6xl">{f(homeCode)}</span>
                <h1 className="text-lg font-bold">{homeName}</h1>
              </div>
              <div className="shrink-0">
                {live ? (
                  <div className="mb-2 flex items-center justify-center gap-2">
                    <span className="live-dot"/><span className="text-sm font-semibold text-[var(--accent-danger)]">{Math.floor(clock/60)}&apos;:{String(clock%60).padStart(2,"0")}&quot;</span>
                  </div>
                ) : match.status === "FINISHED" ? <div className="mb-2 text-xs font-bold uppercase text-[var(--text-muted)]">FT</div> : <div className="mb-2 text-xs font-bold uppercase text-[var(--text-muted)]">VS</div>}
                <div className="data-value-lg text-5xl md:text-6xl">{score.home}:{score.away}</div>
                {match.venue?.name && <div className="mt-2 text-xs text-[var(--text-muted)]">{match.venue.name}</div>}
              </div>
              <div className="flex flex-col items-center gap-3">
                <span className="text-5xl md:text-6xl">{f(awayCode)}</span>
                <h1 className="text-lg font-bold">{awayName}</h1>
              </div>
            </div>
          </div>
        </PageShell>
      </div>

      {/* TABS */}
      <div className="glass-panel sticky z-40 border-b border-[var(--border-subtle)]" style={{ top: 56 }}>
        <PageShell>
          <div className="flex gap-0">
            {[
              { key: "timeline" as const, label: "时间轴" },
              { key: "stats" as const, label: "数据统计" },
              { key: "ai" as const, label: "AI分析" },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="relative px-5 py-3 text-sm font-semibold transition-colors hover:text-white"
                style={{ color: activeTab === tab.key ? "var(--text-primary)" : "var(--text-muted)" }}>
                {tab.label}
                {activeTab === tab.key && <span className="absolute bottom-0 left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full bg-[var(--accent-primary)]"/>}
              </button>
            ))}
          </div>
        </PageShell>
      </div>

      {/* CONTENT */}
      <PageShell className="py-8">
        {activeTab === "timeline" && (
          <div className="max-w-2xl mx-auto">
            {events.length > 0 ? events.map((ev: any, i: number) => {
              const isHome = ev.team === "home";
              if (ev.type === "halftime" || ev.type === "fulltime") {
                return <div key={i} className="flex items-center gap-3 py-3"><div className="flex-1 h-px bg-[var(--border-subtle)]"/><span className="shrink-0 rounded-full px-3 py-1 text-[11px] font-bold uppercase text-[var(--text-muted)] bg-white/[0.02]">{ev.detail || ev.type}</span><div className="flex-1 h-px bg-[var(--border-subtle)]"/></div>;
              }
              const minStr = ev.injuryMinute ? `${ev.minute}'+${ev.injuryMinute}` : `${ev.minute}'`;
              return (
                <div key={i} className={cn("flex gap-3 py-3", isHome ? "" : "flex-row-reverse")}>
                  <div className="flex shrink-0 flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm" style={{ backgroundColor: ev.type.includes("goal") ? "rgba(34,197,94,0.12)" : ev.type.includes("card") ? "rgba(234,179,8,0.08)" : "rgba(255,255,255,0.04)" }}>{eventEmoji(ev.type)}</div>
                    {i < events.length - 1 && <div className="mt-1 w-0.5 flex-1 bg-[var(--border-subtle)]"/>}
                  </div>
                  <div className={cn("flex-1 min-w-0", isHome ? "text-left" : "text-right")}>
                    <div className="flex items-center gap-2 mb-0.5" style={{ flexDirection: isHome ? "row" : "row-reverse" }}>
                      <span className="rounded-md px-1.5 py-0.5 text-xs font-bold bg-white/[0.04]">{minStr}</span>
                      <span className="text-xs font-semibold uppercase text-[var(--text-muted)]">
                        {({goal:"进球",penalty_goal:"点球",own_goal:"乌龙球",yellow_card:"黄牌",red_card:"红牌",substitution:"换人",var_review:"VAR"} as any)[ev.type] || ev.type}
                      </span>
                    </div>
                    {ev.player?.name && <div className={cn("flex items-center gap-2 text-sm font-semibold", isHome?"":"flex-row-reverse")}>{ev.player.name}{ev.player?.number && <span className="text-xs text-[var(--text-muted)]">#{ev.player.number}</span>}</div>}
                    {ev.assistBy?.name && <div className="mt-0.5 text-xs text-[var(--text-secondary)]">🅰 {ev.assistBy.name}</div>}
                    {ev.detail && <div className="mt-0.5 text-xs text-[var(--text-muted)]">{ev.detail}</div>}
                  </div>
                </div>
              );
            }) : <div className="py-12 text-center text-sm text-[var(--text-muted)]">{isUpcoming(match.status) ? "比赛尚未开始" : "暂无事件数据"}</div>}
          </div>
        )}

        {activeTab === "stats" && (
          <div className="max-w-xl mx-auto">
            {statRows.length > 0 ? (
              <>
                <div className="mb-6 flex items-center justify-between text-sm font-bold">
                  <span>{f(homeCode)} {homeName}</span><span className="text-[var(--text-muted)]">VS</span><span>{f(awayCode)} {awayName}</span>
                </div>
                {statRows.map(s => {
                  const total = s.home + s.away; const hp = total > 0 ? (s.home / total) * 100 : 50;
                  return (
                    <div key={s.label} className="flex items-center gap-3 py-2.5">
                      <span className="w-14 text-right text-sm font-semibold tabular-nums" style={{ color: s.home > s.away ? "var(--text-primary)" : "var(--text-muted)" }}>{s.home}{s.unit}</span>
                      <div className="flex h-2 flex-1 rounded-full overflow-hidden bg-white/[0.04]">
                        <div className="h-full rounded-full bg-[var(--accent-primary)]" style={{ width: `${hp}%` }}/>
                        <div className="h-full rounded-full bg-white/[0.06]" style={{ width: `${100-hp}%` }}/>
                      </div>
                      <span className="w-14 text-sm font-semibold tabular-nums" style={{ color: s.away > s.home ? "var(--text-primary)" : "var(--text-muted)" }}>{s.away}{s.unit}</span>
                      <span className="w-16 shrink-0 text-xs text-[var(--text-muted)]">{s.label}</span>
                    </div>
                  );
                })}
              </>
            ) : <div className="py-12 text-center text-sm text-[var(--text-muted)]">{isUpcoming(match.status) ? "比赛尚未开始" : "暂无统计数据"}</div>}
          </div>
        )}

        {activeTab === "ai" && (
          <div className="max-w-2xl mx-auto">
            {match.status === "FINISHED" ? <AiAnalysisTab match={match} matchId={matchId} />
             : <div className="text-center py-16"><p className="text-5xl mb-4">🤖</p><h3 className="text-lg font-semibold">AI分析将在比赛结束后生成</h3><p className="text-sm text-[var(--text-muted)] mt-1">比赛结束后AI将自动分析比赛数据。</p></div>}
          </div>
        )}
      </PageShell>
    </div>
  );
}
