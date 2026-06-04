"use client";

import { useState, useEffect, useMemo } from "react";
import { footballApi } from "@/services/football-api";
import DataCard from "@/shared/components/ui/DataCard";
import Badge from "@/shared/components/ui/Badge";
import PageShell from "@/shared/components/ui/PageShell";
import Header from "@/shared/components/layout/Header";
import { flag as fg, cnName, HOST_CITIES } from "@/lib/constants";

// ============================================================
//  HERO
// ============================================================

function Hero() {
  const worldCupStart = new Date("2026-06-11T00:00:00Z").getTime();
  const daysLeft = Math.max(0, Math.ceil((worldCupStart - Date.now()) / 86400000));
  const hoursLeft = Math.floor(((worldCupStart - Date.now()) % 86400000) / 3600000);

  return (
    <section className="relative overflow-hidden border-b border-[var(--border-subtle)]">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent-primary)]/[0.02] via-transparent to-transparent pointer-events-none" />
      <PageShell>
        <div className="py-12 md:py-20">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-success)] animate-pulse-soft" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">
              FIFA World Cup 2026 · USA · Canada · Mexico
            </span>
          </div>
          <h1 className="text-[clamp(2.5rem,6vw,5.5rem)] font-bold leading-none tracking-tight max-w-4xl">
            World Cup<br /><span className="text-[var(--accent-primary)]">Command Center</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--text-secondary)]">
            覆盖48支参赛球队、104场比赛的全球赛事实时数据指挥中心。实时比分、战术分析、AI预测。
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-6 py-4">
              <div className="text-center"><div className="text-3xl font-bold tabular-nums">{daysLeft}</div><div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">天</div></div>
              <span className="text-2xl font-light text-[var(--text-muted)]">:</span>
              <div className="text-center"><div className="text-3xl font-bold tabular-nums">{String(hoursLeft).padStart(2,"0")}</div><div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">时</div></div>
              <span className="h-8 w-px bg-[var(--border-subtle)]" /><span className="text-[11px] font-medium text-[var(--text-muted)]">距开幕</span>
            </div>
            <a href="/live" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--accent-primary)]/90 active:scale-95">
              <span className="live-dot" />进入实时中心
            </a>
            <a href="/predictions" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-5 py-3 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-elevated)] hover:text-white active:scale-95">
              AI夺冠预测 →
            </a>
          </div>
        </div>
      </PageShell>
      <div className="border-t border-[var(--border-subtle)]">
        <PageShell>
          <div className="flex items-center gap-6 overflow-x-auto py-3">
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">主办城市</span>
            {HOST_CITIES.map((c) => (
              <div key={c.city} className="flex shrink-0 items-center gap-1.5 text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)]/40" />
                <span className="font-medium text-[var(--text-secondary)] whitespace-nowrap">{c.city}</span>
                <span className="text-[10px] text-[var(--text-muted)]">{fg({US:"USA",CA:"CAN",MX:"MEX"}[c.country]||"")}</span>
              </div>
            ))}
          </div>
        </PageShell>
      </div>
    </section>
  );
}

// ============================================================
//  LIVE CENTER
// ============================================================

function LiveCenter({ matches }: { matches: any[] }) {
  const live = matches.filter((m: any) => ["LIVE","IN_PLAY","PAUSED"].includes(m.status));
  const upcoming = matches.filter((m: any) => ["SCHEDULED","TIMED"].includes(m.status)).slice(0,4);
  const finished = matches.filter((m: any) => m.status === "FINISHED").slice(0,2);
  const total = live.length + finished.length + upcoming.length;

  return (
    <section className="border-b border-[var(--border-subtle)]">
      <PageShell className="py-10">
        <div className="mb-4 flex items-center gap-3">
          {live.length > 0 && <span className="live-dot" />}
          <h2 className="text-lg font-semibold">Live Center</h2>
          {live.length > 0 && <Badge variant="live">{live.length} LIVE</Badge>}
          {total === 0 && <Badge variant="muted">赛前预览</Badge>}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {total === 0 ? (
            <DataCard variant="glass" padding="lg" className="text-center lg:col-span-2">
              <p className="text-2xl mb-2">⚽</p>
              <p className="text-sm text-[var(--text-secondary)]">104场比赛已排期 · 6月11日开赛</p>
              <a href="/schedule" className="mt-2 inline-block text-[13px] font-medium text-[var(--accent-primary)] hover:underline">查看完整赛程 →</a>
            </DataCard>
          ) : (
            <>
              {live.map((m: any) => {
                const home = m.homeTeam||{}, away = m.awayTeam||{};
                const ft = m.score?.fullTime||m.score?.ft;
                return <a key={m.id} href={`/match/${m.id}`}><DataCard className="group border-l-[3px] border-l-[var(--accent-danger)]"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="text-2xl">{fg(home.code||home.tla||"")}</span><span className="text-sm font-bold">{home.shortName||home.name}</span></div><span className="data-value-md">{ft?.home??0}:{ft?.away??0}</span><div className="flex items-center gap-3"><span className="text-sm font-bold">{away.shortName||away.name}</span><span className="text-2xl">{fg(away.code||away.tla||"")}</span></div></div></DataCard></a>;
              })}
              {finished.map((m: any) => {
                const home=m.homeTeam||{},away=m.awayTeam||{};
                const ft=m.score?.fullTime||m.score?.ft;
                return <a key={m.id} href={`/match/${m.id}`}><DataCard className="group"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="text-xl">{fg(home.code||home.tla||"")}</span><span className="text-sm font-medium">{home.shortName||home.name}</span></div><span className="data-value-md text-[var(--text-muted)]">{ft?.home??0}:{ft?.away??0}</span><div className="flex items-center gap-3"><span className="text-sm font-medium">{away.shortName||away.name}</span><span className="text-xl">{fg(away.code||away.tla||"")}</span></div></div></DataCard></a>;
              })}
              {upcoming.map((m: any) => {
                const home=m.homeTeam||{},away=m.awayTeam||{};
                return <a key={m.id} href={`/match/${m.id}`}><DataCard className="group"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="text-xl">{fg(home.code||home.tla||"")}</span><span className="text-sm font-medium">{home.shortName||home.name}</span></div><span className="text-[11px] font-semibold text-[var(--text-muted)]">{m.time||m.date?.slice(5)}</span><div className="flex items-center gap-3"><span className="text-sm font-medium">{away.shortName||away.name}</span><span className="text-xl">{fg(away.code||away.tla||"")}</span></div></div></DataCard></a>;
              })}
            </>
          )}
        </div>
      </PageShell>
    </section>
  );
}

// ============================================================
//  POWER RANKINGS
// ============================================================

function PowerRankings({ teams }: { teams: any[] }) {
  const [predictions, setPredictions] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    fetch("/api/ai/predict-champion",{method:"POST"}).then(r=>r.json()).then(p=>{if(!p.error)setPredictions(p);}).catch(()=>{});
    setTimeout(()=>setVisible(true),100);
  },[]);

  const rankings = predictions?.rankings || teams.filter((t:any)=>t.tla).sort((a:any,b:any)=>(a.fifaRanking||99)-(b.fifaRanking||99)).slice(0,10).map((t:any,i:number)=>({
    rank:i+1,team:t.shortName||t.name,code:t.tla,
    probability:parseFloat((22-i*2.2).toFixed(1)),
    trend:(["up","up","down","stable","up","down","stable","up","stable","down"]as const)[i],
    change:[2.1,-1.5,0.8,1.2,-0.3,3.2,0,0.5,-2.1,0][i],
  }));
  const top3=rankings.slice(0,3), rest=rankings.slice(3), medals=["🥇","🥈","🥉"], podiumOrder=[1,0,2];

  return (
    <section className="border-b border-[var(--border-subtle)]">
      <PageShell className="py-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Power Rankings</h2>
          <a href="/predictions" className="text-[13px] font-medium text-[var(--accent-primary)] hover:underline">完整排行 →</a>
        </div>
        <div className="flex items-end justify-center gap-3 md:gap-4 mb-6" style={{opacity:visible?1:0,transform:visible?"translateY(0)":"translateY(24px)",transition:"all 0.6s ease-out"}}>
          {podiumOrder.map((idx)=>{
            const t=top3[idx]; if(!t)return null;
            return <a key={t.code} href={`/team/${t.code}`} className="flex flex-col items-center gap-2 group"><span className="text-2xl">{medals[idx]}</span><span className="text-3xl">{fg(t.code)}</span><span className="text-sm font-bold">{t.team}</span><span className="text-xl font-bold text-[var(--accent-primary)]">{t.probability}%</span></a>;
          })}
        </div>
        <div className="space-y-1 max-w-3xl mx-auto">
          {rest.map((r:any,i:number)=><a key={r.code} href={`/team/${r.code}`} className="flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors hover:bg-white/[0.02]" style={{opacity:visible?1:0,transform:visible?"translateY(0)":"translateY(12px)",transition:`all 0.4s ease-out ${(i+3)*60}ms`}}><span className="w-6 text-center text-sm font-semibold text-[var(--text-muted)]">{r.rank}</span><span className="text-lg">{fg(r.code)}</span><span className="flex-1 text-sm font-medium">{r.team}{cnName(r.code)?<span className="text-[var(--text-muted)] ml-1 text-[11px]">({cnName(r.code)})</span>:""}</span><div className="w-24 h-1.5 rounded-full bg-white/[0.04] overflow-hidden hidden sm:block"><div className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-1000" style={{width:`${r.probability*3}%`}}/></div><span className="data-value-sm text-[var(--accent-primary)] w-14 text-right">{r.probability}%</span></a>)}
        </div>
      </PageShell>
    </section>
  );
}

// ============================================================
//  INTELLIGENCE
// ============================================================

function Intelligence({ teams }: { teams: any[] }) {
  const confs = useMemo(()=>{const m:Record<string,number>={};for(const t of teams){const c=(t as any).confederation||(t as any).area?.name||"—";m[c]=(m[c]||0)+1;}return Object.entries(m).sort(([,a],[,b])=>(b as number)-(a as number));},[teams]);
  return (
    <section className="border-b border-[var(--border-subtle)]">
      <PageShell className="py-10">
        <h2 className="text-lg font-semibold mb-4">Tournament Intelligence</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <DataCard variant="glass" padding="lg">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[var(--accent-cyan)]"/>参赛大洲分布</h3>
            <div className="space-y-2.5">{confs.slice(0,6).map(([n,c])=>{const p=Math.round((c as number)/48*100);return <div key={n}><div className="flex items-center justify-between text-[12px] mb-1"><span className="text-[var(--text-secondary)]">{n}</span><span className="font-semibold">{c as number}队</span></div><div className="h-1 rounded-full bg-white/[0.04] overflow-hidden"><div className="h-full rounded-full bg-[var(--accent-cyan)]/60" style={{width:`${p}%`}}/></div></div>;})}</div>
          </DataCard>
          <DataCard variant="glass" padding="lg">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[var(--accent-primary)]"/>赛事数据</h3>
            <div className="grid grid-cols-2 gap-3">
              {[{v:"48",l:"参赛球队"},{v:"104",l:"比赛场次"},{v:"16",l:"主办城市"},{v:"3",l:"主办国家"},{v:"12",l:"小组"},{v:"32",l:"淘汰赛名额"}].map(s=><div key={s.l} className="text-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] py-3"><div className="data-value-md text-[var(--accent-primary)]">{s.v}</div><div className="text-[10px] text-[var(--text-muted)] mt-1">{s.l}</div></div>)}</div>
          </DataCard>
          <DataCard variant="glass" padding="lg">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[var(--accent-success)]"/>AI 赛事洞察</h3>
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-4">基于FIFA排名、球队近期战绩、阵容实力、历史数据等多维数据，AI将持续分析并更新夺冠概率和赛事预测。</p>
            <div className="space-y-2">
              <a href="/predictions" className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-sm font-medium transition-all hover:bg-[var(--bg-elevated)]"><span>🏆 夺冠概率预测</span><span className="text-[var(--accent-primary)]">→</span></a>
              <a href="/predictions/match" className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-sm font-medium transition-all hover:bg-[var(--bg-elevated)]"><span>⚽ 赛前预测分析</span><span className="text-[var(--accent-primary)]">→</span></a>
            </div>
          </DataCard>
        </div>
      </PageShell>
    </section>
  );
}

// ============================================================
//  PAGE
// ============================================================

export default function HomeClient() {
  const [teams, setTeams] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    footballApi.teams.list().then(r=>{if(r.success)setTeams(r.data as any[]);}).catch(()=>{}).finally(()=>setLoading(false));
    Promise.all([
      footballApi.matches.list({}).catch(()=>({success:false,data:[]})),
      footballApi.matches.upcoming(30).catch(()=>({success:false,data:[]})),
      footballApi.schedule.all().catch(()=>({success:false,data:[]})),
    ]).then(([l,u,s])=>{const all:any[]=[];const seen=new Set<string>();const add=(arr:any[])=>{for(const m of arr){if(!seen.has(m.id)){seen.add(m.id);all.push(m);}}};if(l.success)add(l.data as any[]);if(u.success)add(u.data as any[]);if(s.success)add(s.data as any[]);setMatches(all);}).catch(()=>{});
  }, []);

  const liveCount = matches.filter((m: any) => ["LIVE","IN_PLAY","PAUSED"].includes(m.status)).length;

  return (
    <div className="min-h-screen bg-[var(--bg-deep)]">
      <Header liveCount={liveCount} currentPath="/" />
      <Hero />
      <LiveCenter matches={matches} />
      {!loading && teams.length > 0 && (
        <>
          <PowerRankings teams={teams} />
          <Intelligence teams={teams} />
        </>
      )}
      <footer className="border-t border-[var(--border-subtle)]">
        <PageShell className="py-6">
          <div className="flex flex-col items-center gap-3 text-center md:flex-row md:justify-between">
            <span className="text-xs font-bold tracking-tight text-[var(--accent-primary)]">WC26</span>
            <p className="text-[11px] text-[var(--text-muted)]">FIFA World Cup 2026 Command Center · football-data.org · AI仅供参考</p>
          </div>
        </PageShell>
      </footer>
    </div>
  );
}
