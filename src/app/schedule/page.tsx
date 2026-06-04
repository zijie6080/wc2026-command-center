"use client";

import { useState, useEffect, useMemo } from "react";
import { footballApi } from "@/services/football-api";
import type { ApiMatch, MatchStatus } from "@/services/football-api/types";
import DataCard from "@/shared/components/ui/DataCard";
import Badge from "@/shared/components/ui/Badge";
import PageShell from "@/shared/components/ui/PageShell";

const FLAG: Record<string, string> = {
  ARG:"🇦🇷",BRA:"🇧🇷",FRA:"🇫🇷",ESP:"🇪🇸",ENG:"🏴",POR:"🇵🇹",GER:"🇩🇪",ITA:"🇮🇹",
  NED:"🇳🇱",BEL:"🇧🇪",CRO:"🇭🇷",USA:"🇺🇸",CAN:"🇨🇦",MEX:"🇲🇽",JPN:"🇯🇵",KOR:"🇰🇷",
  IRN:"🇮🇷",NGA:"🇳🇬",MAR:"🇲🇦",SEN:"🇸🇳",EGY:"🇪🇬",AUS:"🇦🇺",NZL:"🇳🇿",URU:"🇺🇾",
  COL:"🇨🇴",ECU:"🇪🇨",PER:"🇵🇪",CHI:"🇨🇱",KSA:"🇸🇦",QAT:"🇶🇦",
};
const flag = (c: string) => FLAG[c] || "🏳️";
const GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

function isLive(s: MatchStatus) { return ["LIVE","IN_PLAY","PAUSED"].includes(s); }
function isFinished(s: MatchStatus) { return s === "FINISHED"; }

function MatchRow({ m }: { m: ApiMatch }) {
  const home = m.homeTeam as any; const away = m.awayTeam as any;
  const ft = m.score?.fullTime || m.score?.ft;
  const live = isLive(m.status); const finished = isFinished(m.status);
  return (
    <a href={`/match/${m.id}`} className="flex items-center gap-3 rounded-xl px-4 py-3.5 transition-colors hover:bg-white/[0.02]">
      <span className="w-12 shrink-0 text-sm font-semibold text-[var(--text-muted)]">{m.time || m.date?.slice(5)}</span>
      <div className="flex flex-1 items-center justify-end gap-2.5"><span className="text-sm font-semibold truncate">{home?.shortName || home?.name}</span><span className="text-xl">{flag(home?.code || home?.tla || "")}</span></div>
      <div className="shrink-0 mx-4 text-center">
        {live ? <span className="data-value-sm text-[var(--accent-danger)]">{ft?.home ?? 0}:{ft?.away ?? 0}</span>
         : finished ? <span className="data-value-sm text-[var(--text-muted)]">{ft?.home ?? 0}:{ft?.away ?? 0}</span>
         : <span className="text-[11px] font-semibold text-[var(--text-muted)]">VS</span>}
      </div>
      <div className="flex flex-1 items-center gap-2.5"><span className="text-xl">{flag(away?.code || away?.tla || "")}</span><span className="text-sm font-semibold truncate">{away?.shortName || away?.name}</span></div>
      <span className="w-16 shrink-0 text-right">{live ? <Badge variant="live">LIVE</Badge> : finished ? <Badge variant="muted">FT</Badge> : <Badge variant="green">即将</Badge>}</span>
    </a>
  );
}

export default function SchedulePage() {
  const [matches, setMatches] = useState<ApiMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"date"|"group"|"knockout">("date");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([footballApi.schedule.all(), footballApi.matches.upcoming(30)]).then(([sRes,uRes]) => {
      if (cancelled) return; const all: ApiMatch[] = [];
      if (sRes.success && Array.isArray(sRes.data)) all.push(...(sRes.data as unknown as ApiMatch[]));
      if (uRes.success && Array.isArray(uRes.data)) { for (const m of (uRes.data as unknown as ApiMatch[])) { if (!all.find(e=>e.id===m.id)) all.push(m); } }
      footballApi.matches.completed(1,50).then(r=>{ if (!cancelled && r.success && Array.isArray(r.data)) { for (const m of (r.data as unknown as ApiMatch[])) { if (!all.find(e=>e.id===m.id)) all.push(m); } setMatches(prev=>[...prev,...(r.data as unknown as ApiMatch[])]); } }).catch(()=>{});
      setMatches(all);
    }).catch(e=>{if(!cancelled)setError(e.message);}).finally(()=>{if(!cancelled)setLoading(false);});
    return () => { cancelled = true; };
  }, []);

  const dates = useMemo(() => [...new Set(matches.map(m=>m.date).filter(Boolean))].sort(), [matches]);
  const activeDate = selectedDate || dates[0] || new Date().toISOString().split("T")[0];
  const activeGroup = selectedGroup || "A";

  return (
    <div className="min-h-screen bg-[var(--bg-deep)]">
      <header className="glass-panel sticky top-0 z-50">
        <PageShell>
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/" className="text-sm font-medium text-[var(--text-muted)] hover:text-white">←</a>
              <span className="text-sm font-semibold">赛程中心</span>
            </div>
            <span className="text-xs text-[var(--text-muted)]">{matches.length}场</span>
          </div>
        </PageShell>
      </header>
      <div className="glass-panel sticky z-40 border-b border-[var(--border-subtle)]" style={{ top: 56 }}>
        <PageShell>
          <div className="flex gap-0">
            {[{key:"date"as const,label:"按日期"},{key:"group"as const,label:"按小组"},{key:"knockout"as const,label:"淘汰赛"}].map(tab=>(
              <button key={tab.key} onClick={()=>setViewMode(tab.key)} className="relative px-5 py-3 text-sm font-semibold transition-colors hover:text-white" style={{color:viewMode===tab.key?"var(--text-primary)":"var(--text-muted)"}}>
                {tab.label}{viewMode===tab.key && <span className="absolute bottom-0 left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-[var(--accent-primary)]"/>}
              </button>
            ))}
          </div>
        </PageShell>
      </div>
      <PageShell className="py-8">
        {loading ? <div className="space-y-2">{[...Array(6)].map((_,i)=><div key={i} className="shimmer rounded-xl h-14"/>)}</div>
        : error && matches.length===0 ? <div className="text-center py-20"><p className="text-5xl mb-4">⚠️</p><h2 className="text-lg font-semibold">加载失败</h2><p className="text-sm text-[var(--text-muted)] mt-1">{error}</p></div>
        : viewMode==="date" ? (
          <div>
            {dates.length > 0 ? (
              <>
                <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
                  {dates.map(d=>{const cnt=matches.filter(m=>m.date===d).length;const dt=new Date(d+"T00:00:00");const isA=d===activeDate;
                    return <button key={d} onClick={()=>setSelectedDate(d)} className="flex shrink-0 flex-col items-center rounded-xl px-4 py-2.5 text-center transition-all" style={{backgroundColor:isA?"var(--accent-primary)":"rgba(255,255,255,0.03)",color:isA?"#fff":"var(--text-secondary)",minWidth:64}}><span className="text-[11px] font-semibold">{dt.getMonth()+1}/{dt.getDate()}</span><span className="text-[10px] mt-0.5 opacity-70">{["日","一","二","三","四","五","六"][dt.getDay()]}</span><span className="text-xs font-bold mt-1">{cnt}场</span></button>;
                  })}
                </div>
                <h3 className="text-base font-semibold mb-3">{activeDate} · {matches.filter(m=>m.date===activeDate).length}场</h3>
                <div className="space-y-1">{matches.filter(m=>m.date===activeDate).map(m=><MatchRow key={m.id} m={m}/>)}</div>
              </>
            ) : <div className="text-center py-20"><p className="text-5xl mb-4">📅</p><p className="text-sm text-[var(--text-muted)]">暂无赛程数据</p></div>}
          </div>
        ) : viewMode==="group" ? (
          <div>
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
              {GROUPS.map(g=>{const cnt=matches.filter(m=>m.group===`Group ${g}`||m.group===g).length;const isA=g===activeGroup;
                return <button key={g} onClick={()=>setSelectedGroup(g)} className="flex shrink-0 flex-col items-center rounded-xl px-4 py-2.5 text-center transition-all" style={{backgroundColor:isA?"var(--accent-primary)":"rgba(255,255,255,0.03)",color:isA?"#fff":"var(--text-secondary)",minWidth:64}}><span className="text-sm font-bold">{g}组</span><span className="text-[10px] mt-0.5">{cnt}场</span></button>;
              })}
            </div>
            <h3 className="text-base font-semibold mb-3">{activeGroup}组 赛程</h3>
            <div className="space-y-1">{matches.filter(m=>m.group===`Group ${activeGroup}`||m.group===activeGroup).map(m=><MatchRow key={m.id} m={m}/>)}</div>
          </div>
        ) : (
          <div className="text-center py-20"><p className="text-5xl mb-4">🗺️</p><h3 className="text-lg font-semibold">淘汰赛晋级图</h3><p className="text-sm text-[var(--text-muted)] mt-1">小组赛结束后将生成完整晋级路线图</p></div>
        )}
      </PageShell>
    </div>
  );
}
