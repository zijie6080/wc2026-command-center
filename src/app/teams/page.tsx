"use client";

import { useState, useEffect, useMemo } from "react";
import { footballApi } from "@/services/football-api";
import DataCard from "@/shared/components/ui/DataCard";
import PageShell from "@/shared/components/ui/PageShell";

interface FDTeam { id: number; name: string; shortName: string; tla: string; crest: string; area: { name: string }; coach?: { name: string }; }

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
const GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"];
const TEAM_GROUPS: Record<string, string> = {
  USA:"A",CAN:"A",MEX:"A",JAM:"A", JPN:"B",SEN:"B",PER:"B",CIV:"B",
  ENG:"C",IRN:"C",AUS:"C",QAT:"C", ARG:"D",NGA:"D",MAR:"D",NZL:"D",
  BRA:"E",GER:"E",KOR:"E",CMR:"E", ESP:"F",POR:"F",CRO:"F",GHA:"F",
  NED:"G",BEL:"G",ECU:"G",KSA:"G", FRA:"H",EGY:"H",CHI:"H",UAE:"H",
  ITA:"I",URU:"I",COL:"I",PAR:"I", CZE:"J",UKR:"J",SUI:"J",DEN:"J",
  SWE:"K",NOR:"K",POL:"K",AUT:"K", SRB:"L",TUR:"L",GRE:"L",HUN:"L",
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<FDTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<string | null>(null);

  useEffect(() => {
    footballApi.teams.list().then(res => {
      if (res.success && Array.isArray(res.data)) setTeams(res.data as unknown as FDTeam[]);
      else setError("Failed to load teams");
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...teams];
    if (search.trim()) { const q = search.trim().toLowerCase(); list = list.filter(t => t.name.toLowerCase().includes(q) || t.tla.toLowerCase().includes(q)); }
    if (groupFilter) list = list.filter(t => TEAM_GROUPS[t.tla] === groupFilter);
    return list;
  }, [teams, search, groupFilter]);

  return (
    <div className="min-h-screen bg-[var(--bg-deep)]">
      <header className="glass-panel sticky top-0 z-50">
        <PageShell>
          <div className="flex h-14 items-center gap-4">
            <a href="/" className="text-sm font-medium text-[var(--text-muted)] hover:text-white">←</a>
            <div className="relative flex-1 max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color:"var(--text-muted)"}}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索球队..." className="w-full rounded-lg border border-[var(--border-subtle)] bg-white/[0.02] py-1.5 pl-9 pr-3 text-sm outline-none text-[var(--text-primary)]"/>
            </div>
            <span className="ml-auto text-xs font-semibold text-[var(--text-muted)]">{teams.length} 支球队</span>
          </div>
        </PageShell>
      </header>

      <div className="glass-panel sticky z-40 border-b border-[var(--border-subtle)]" style={{ top: 56 }}>
        <PageShell>
          <div className="flex gap-1.5 overflow-x-auto py-3">
            <button onClick={() => setGroupFilter(null)} className="shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all" style={{ backgroundColor: !groupFilter ? "var(--accent-primary)" : "rgba(255,255,255,0.03)", color: !groupFilter ? "#fff" : "var(--text-secondary)" }}>全部</button>
            {GROUPS.map(g => <button key={g} onClick={() => setGroupFilter(g)} className="shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all" style={{ backgroundColor: groupFilter === g ? "var(--accent-primary)" : "rgba(255,255,255,0.03)", color: groupFilter === g ? "#fff" : "var(--text-secondary)" }}>{g}组</button>)}
          </div>
        </PageShell>
      </div>

      <PageShell className="py-8">
        {loading ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({length:8}).map((_,i)=><div key={i} className="shimmer rounded-2xl h-40"/>)}</div>
        : error ? <div className="text-center py-20"><p className="text-5xl mb-4">⚠️</p><h3 className="text-lg font-semibold">加载失败</h3><p className="text-sm text-[var(--text-muted)] mt-1">{error}</p></div>
        : filtered.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(team => {
              const group = TEAM_GROUPS[team.tla] || "?";
              return (
                <a key={team.id} href={`/team/${team.id}`}>
                  <DataCard className="group">
                    <div className="flex items-start justify-between mb-3">
                      {team.crest ? <img src={team.crest} alt="" className="h-10 w-10 object-contain"/> : <span className="text-2xl">{flag(team.tla)}</span>}
                      <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--text-muted)] bg-white/[0.03]">{group}组</span>
                    </div>
                    <h3 className="text-sm font-bold">{team.shortName || team.name}</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{team.area?.name}</p>
                    {team.coach && <p className="text-[11px] text-[var(--text-muted)] mt-1">🧑‍💼 {team.coach.name}</p>}
                  </DataCard>
                </a>
              );
            })}
          </div>
        ) : <div className="text-center py-20"><p className="text-5xl mb-4">🔍</p><h3 className="text-lg font-semibold">未找到匹配球队</h3><button onClick={() => { setSearch(""); setGroupFilter(null); }} className="mt-4 rounded-xl px-5 py-2 text-sm font-semibold bg-[var(--accent-primary)] text-white">清除筛选</button></div>}
      </PageShell>
    </div>
  );
}
