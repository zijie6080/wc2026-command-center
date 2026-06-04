"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { footballApi } from "@/services/football-api";
import type { ApiMatch, MatchStatus } from "@/services/football-api/types";
import DataCard from "@/shared/components/ui/DataCard";
import Badge from "@/shared/components/ui/Badge";
import PageShell from "@/shared/components/ui/PageShell";
import Header from "@/shared/components/layout/Header";

// ============================================================
//  HELPERS
// ============================================================

const FLAG: Record<string, string> = {
  ARG:"🇦🇷",BRA:"🇧🇷",FRA:"🇫🇷",ESP:"🇪🇸",ENG:"🏴",POR:"🇵🇹",GER:"🇩🇪",ITA:"🇮🇹",
  NED:"🇳🇱",BEL:"🇧🇪",CRO:"🇭🇷",USA:"🇺🇸",CAN:"🇨🇦",MEX:"🇲🇽",JPN:"🇯🇵",KOR:"🇰🇷",
  IRN:"🇮🇷",NGA:"🇳🇬",MAR:"🇲🇦",SEN:"🇸🇳",EGY:"🇪🇬",AUS:"🇦🇺",NZL:"🇳🇿",URU:"🇺🇾",
  COL:"🇨🇴",ECU:"🇪🇨",PER:"🇵🇪",CHI:"🇨🇱",KSA:"🇸🇦",QAT:"🇶🇦",UAE:"🇦🇪",CIV:"🇨🇮",
  JAM:"🇯🇲",CZE:"🇨🇿",UKR:"🇺🇦",SUI:"🇨🇭",DEN:"🇩🇰",SWE:"🇸🇪",NOR:"🇳🇴",POL:"🇵🇱",
  AUT:"🇦🇹",HUN:"🇭🇺",SRB:"🇷🇸",TUR:"🇹🇷",GRE:"🇬🇷",PAR:"🇵🇾",BOL:"🇧🇴",VEN:"🇻🇪",
  ALG:"🇩🇿",TUN:"🇹🇳",COD:"🇨🇩",MLI:"🇲🇱",BFA:"🇧🇫",CMR:"🇨🇲",GHA:"🇬🇭",
};
const flag = (c: string) => FLAG[c] || "🏳️";
const cn = (...c: (string | boolean | undefined | null)[]) => c.filter(Boolean).join(" ");

function isLive(s: MatchStatus) { return ["LIVE","IN_PLAY","PAUSED"].includes(s); }
function isFinished(s: MatchStatus) { return s === "FINISHED"; }
function isUpcoming(s: MatchStatus) { return ["SCHEDULED","TIMED"].includes(s); }

// ============================================================
//  MATCH CARDS
// ============================================================

function LiveMatchCard({ m }: { m: ApiMatch }) {
  const home = m.homeTeam as any; const away = m.awayTeam as any;
  const ft = m.score?.fullTime || m.score?.ft;
  const homeScore = ft?.home ?? 0; const awayScore = ft?.away ?? 0;
  return (
    <a href={`/match/${m.id}`}>
      <DataCard className="group border-l-[3px] border-l-[var(--accent-danger)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-[var(--text-muted)]">{m.time || m.date}</span>
          <div className="flex items-center gap-1.5">
            <span className="live-dot" />
            <Badge variant="live">{m.minute ?? 0}&apos;</Badge>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <span className="text-2xl">{flag(home.code || home.tla || "")}</span>
            <span className="text-sm font-semibold truncate">{home.shortName || home.name}</span>
          </div>
          <span className="data-value-md shrink-0 mx-4">{homeScore}:{awayScore}</span>
          <div className="flex items-center gap-3 flex-1 justify-end">
            <span className="text-sm font-semibold truncate">{away.shortName || away.name}</span>
            <span className="text-2xl">{flag(away.code || away.tla || "")}</span>
          </div>
        </div>
      </DataCard>
    </a>
  );
}

function MatchRow({ m }: { m: ApiMatch }) {
  const home = m.homeTeam as any; const away = m.awayTeam as any;
  const ft = m.score?.fullTime || m.score?.ft;
  const homeScore = ft?.home ?? 0; const awayScore = ft?.away ?? 0;
  const live = isLive(m.status); const finished = isFinished(m.status);
  return (
    <a href={`/match/${m.id}`} className="flex items-center gap-4 rounded-xl px-4 py-3.5 transition-colors hover:bg-white/[0.02]">
      <span className="w-12 shrink-0 text-sm font-semibold text-[var(--text-muted)]">{m.time || m.date?.slice(5)}</span>
      <div className="flex flex-1 items-center justify-end gap-2.5">
        <span className="text-sm font-semibold">{home.shortName || home.name}</span>
        <span className="text-xl">{flag(home.code || home.tla || "")}</span>
      </div>
      <div className="shrink-0 mx-4 text-center">
        {live ? <span className="data-value-sm text-[var(--accent-danger)]">{homeScore}:{awayScore}</span>
         : finished ? <span className="data-value-sm text-[var(--text-muted)]">{homeScore}:{awayScore}</span>
         : <span className="text-[11px] font-semibold text-[var(--text-muted)]">VS</span>}
      </div>
      <div className="flex flex-1 items-center gap-2.5">
        <span className="text-xl">{flag(away.code || away.tla || "")}</span>
        <span className="text-sm font-semibold">{away.shortName || away.name}</span>
      </div>
      <span className="w-14 shrink-0 text-right">
        {live ? <Badge variant="live">LIVE</Badge> : finished ? <Badge variant="muted">FT</Badge> : <Badge variant="green">即将</Badge>}
      </span>
    </a>
  );
}

// ============================================================
//  PAGE
// ============================================================

export default function LivePage() {
  const [matches, setMatches] = useState<ApiMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await footballApi.matches.list({} as any);
      if (!mountedRef.current) return;
      if (res.success && Array.isArray(res.data)) {
        setMatches(res.data as unknown as ApiMatch[]);
        setLastUpdate(new Date());
        setError("");
      }
    } catch (e: any) { if (mountedRef.current) setError(e.message); }
    finally { if (mountedRef.current) { setLoading(false); setRefreshing(false); } }
  }, []);

  useEffect(() => { mountedRef.current = true; fetchData(); return () => { mountedRef.current = false; }; }, [fetchData]);
  useEffect(() => { const i = setInterval(() => fetchData(false), 30000); return () => clearInterval(i); }, [fetchData]);

  const live = matches.filter((m) => isLive(m.status));
  const finished = matches.filter((m) => isFinished(m.status));
  const upcoming = matches.filter((m) => isUpcoming(m.status));

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-deep)]">
        <Header currentPath="/live" />
        <PageShell className="py-12"><div className="grid gap-4 lg:grid-cols-2">{[1,2,3].map(i=><div key={i} className="shimmer rounded-2xl h-48"/>)}</div></PageShell>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-deep)]">
      <Header currentPath="/live" />
      <PageShell className="py-8">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => fetchData(true)} disabled={refreshing}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-white hover:bg-white/[0.04] disabled:opacity-50">
            {refreshing ? "⏳" : "↻"} 刷新
          </button>
          {lastUpdate && <span className="text-[11px] text-[var(--text-muted)]">上次更新：{Math.floor((Date.now()-lastUpdate.getTime())/1000)}秒前</span>}
        </div>
        {error && matches.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">⚠️</p>
            <h2 className="text-lg font-semibold mb-2">数据加载失败</h2>
            <p className="text-sm text-[var(--text-muted)] mb-4">{error}</p>
            <button onClick={() => fetchData(true)} className="rounded-xl px-5 py-2 text-sm font-semibold bg-[var(--accent-primary)] text-white">重新加载</button>
          </div>
        )}

        {matches.length === 0 && !error && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">⚽</p>
            <h2 className="text-lg font-semibold mb-2">暂无比赛数据</h2>
            <p className="text-sm text-[var(--text-muted)] mb-4">2026世界杯将于6月11日开幕</p>
            <a href="/schedule" className="text-sm font-medium text-[var(--accent-primary)] hover:underline">查看完整赛程 →</a>
          </div>
        )}

        {live.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="live-dot" />
              <h2 className="text-xl font-semibold">正在进行</h2>
              <Badge variant="live">{live.length} LIVE</Badge>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">{live.map(m => <LiveMatchCard key={m.id} m={m} />)}</div>
          </section>
        )}

        {finished.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">已结束</h2>
            <div className="space-y-1">{finished.map(m => <MatchRow key={m.id} m={m} />)}</div>
          </section>
        )}

        {upcoming.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">即将开始</h2>
            <div className="space-y-1">{upcoming.map(m => <MatchRow key={m.id} m={m} />)}</div>
          </section>
        )}
      </PageShell>
    </div>
  );
}
