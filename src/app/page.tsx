"use client";

import { useState, useEffect, useMemo } from "react";
import { footballApi } from "@/services/football-api";
import DataCard from "@/shared/components/ui/DataCard";
import Badge from "@/shared/components/ui/Badge";
import PageShell from "@/shared/components/ui/PageShell";
import Header from "@/shared/components/layout/Header";

// ============================================================
//  CONSTANTS & HELPERS
// ============================================================

import { flag as fg, cnName, HOST_CITIES } from "@/lib/constants";

// ============================================================
//  HEADER — Command Center navigation
// ============================================================

// ============================================================
//  TOP STATUS BAR
// ============================================================

function StatusBar({ teams, matches }: { teams: any[]; matches: any[] }) {
  const liveCount = matches.filter((m: any) => ["LIVE","IN_PLAY","PAUSED"].includes(m.status)).length;
  const todayCount = matches.filter((m: any) => {
    const d = new Date(m.utcDate || m.date).toDateString();
    return d === new Date().toDateString();
  }).length;
  const worldCupStart = new Date("2026-06-11T00:00:00Z").getTime();
  const daysLeft = Math.max(0, Math.ceil((worldCupStart - Date.now()) / 86400000));

  const stats = [
    { label: "距开幕", value: `${daysLeft}天`, accent: true },
    { label: "参赛球队", value: teams.length || 48, accent: false },
    { label: "今日比赛", value: todayCount, live: liveCount > 0, accent: false },
    { label: "总比赛场次", value: 104, accent: false },
  ];

  return (
    <div className="border-b border-[var(--border-subtle)]">
      <PageShell>
        <div className="flex gap-3 py-4 overflow-x-auto">
          {stats.map((s) => (
            <div key={s.label}
              className="flex shrink-0 items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-2.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                {s.label}
              </span>
              <span className="text-lg font-bold tabular-nums"
                style={{ color: s.accent ? "var(--accent-primary)" : "var(--text-primary)" }}>
                {s.value}
              </span>
              {s.live && <span className="live-dot" />}
            </div>
          ))}
          {/* Data source indicator */}
          <div className="ml-auto hidden shrink-0 items-center gap-1.5 self-center lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-success)]" />
            <span className="text-[10px] font-medium text-[var(--text-muted)]">实时数据</span>
          </div>
        </div>
      </PageShell>
    </div>
  );
}

// ============================================================
//  HERO — Trophy visual anchor
// ============================================================

function Hero() {
  const worldCupStart = new Date("2026-06-11T00:00:00Z").getTime();
  const now = Date.now();
  const daysLeft = Math.max(0, Math.ceil((worldCupStart - now) / 86400000));
  const hoursLeft = Math.floor(((worldCupStart - now) % 86400000) / 3600000);

  return (
    <section className="relative overflow-hidden border-b border-[var(--border-subtle)]">
      {/* Subtle world map texture overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent-primary)]/[0.02] via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, var(--accent-primary) 1px, transparent 1px),
            radial-gradient(circle at 80% 70%, var(--accent-cyan) 1px, transparent 1px),
            radial-gradient(circle at 50% 50%, var(--accent-primary) 1px, transparent 1px)`,
          backgroundSize: "120px 80px, 180px 120px, 200px 100px",
        }} />
      <PageShell>
        <div className="py-12 md:py-20">
          {/* Label */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-success)] animate-pulse-soft" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">
              FIFA World Cup 2026 · USA · Canada · Mexico
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-[clamp(2.5rem,6vw,5.5rem)] font-bold leading-none tracking-tight max-w-4xl">
            World Cup
            <br />
            <span className="text-[var(--accent-primary)]">Command Center</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--text-secondary)]">
            覆盖48支参赛球队、104场比赛的全球赛事实时数据指挥中心。
            实时比分、战术分析、AI预测 — 一屏掌控世界杯全局。
          </p>

          {/* Countdown + Data Row */}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            {/* Countdown module */}
            <div className="flex items-center gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-6 py-4">
              <div className="text-center">
                <div className="text-3xl font-bold tabular-nums text-[var(--text-primary)]">{daysLeft}</div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">天</div>
              </div>
              <span className="text-2xl font-light text-[var(--text-muted)]">:</span>
              <div className="text-center">
                <div className="text-3xl font-bold tabular-nums text-[var(--text-primary)]">{String(hoursLeft).padStart(2,"0")}</div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">时</div>
              </div>
              <span className="h-8 w-px bg-[var(--border-subtle)]" />
              <span className="text-[11px] font-medium text-[var(--text-muted)]">距开幕</span>
            </div>

            {/* CTA buttons */}
            <a href="/live"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--accent-primary)]/90 active:scale-95">
              <span className="live-dot" />
              进入实时中心
            </a>
            <a href="/predictions"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] px-5 py-3 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-elevated)] hover:text-white active:scale-95">
              AI夺冠预测 →
            </a>
          </div>
        </div>
      </PageShell>

      {/* Host cities strip */}
      <div className="border-t border-[var(--border-subtle)]">
        <PageShell>
          <div className="flex items-center gap-6 overflow-x-auto py-3">
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              主办城市
            </span>
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
//  LIVE CENTER — Data panel style
// ============================================================

function LiveCenter({ matches }: { matches: any[] }) {
  const live = matches.filter((m: any) => ["LIVE","IN_PLAY","PAUSED"].includes(m.status));
  const upcoming = matches.filter((m: any) => ["SCHEDULED","TIMED"].includes(m.status)).slice(0, 3);
  const finished = matches.filter((m: any) => m.status === "FINISHED").slice(0, 2);

  if (live.length + upcoming.length + finished.length === 0) {
    return (
      <section className="border-b border-[var(--border-subtle)]">
        <PageShell className="py-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Live Center</h2>
            <Badge variant="muted">赛事未开始</Badge>
          </div>
          <DataCard variant="glass" padding="lg" className="text-center">
            <p className="text-3xl mb-2">⚽</p>
            <p className="text-sm text-[var(--text-secondary)]">赛事将于6月11日开幕</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">实时数据将在比赛开始后自动更新</p>
          </DataCard>
        </PageShell>
      </section>
    );
  }

  return (
    <section className="border-b border-[var(--border-subtle)]">
      <PageShell className="py-10">
        <div className="mb-4 flex items-center gap-3">
          {live.length > 0 && <span className="live-dot" />}
          <h2 className="text-lg font-semibold">Live Center</h2>
          {live.length > 0 && <Badge variant="live">{live.length} LIVE</Badge>}
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {/* Live matches with stat bars */}
          {live.map((m: any) => {
            const home = m.homeTeam || {}; const away = m.awayTeam || {};
            const ft = m.score?.fullTime || m.score?.ft;
            const hScore = ft?.home ?? 0; const aScore = ft?.away ?? 0;
            const st = (m as any).stats;
            return (
              <a key={m.id} href={`/match/${m.id}`}>
                <DataCard className="group border-l-[3px] border-l-[var(--accent-danger)]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold text-[var(--text-muted)]">{m.time || m.date?.slice(5)}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="live-dot" />
                      <Badge variant="live">{m.minute ?? 0}&apos;</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{fg(home.code || home.tla || "")}</span>
                      <span className="text-sm font-bold truncate">{home.shortName || home.name}</span>
                    </div>
                    <span className="data-value-md shrink-0 mx-4">{hScore}:{aScore}</span>
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <span className="text-sm font-bold truncate">{away.shortName || away.name}</span>
                      <span className="text-2xl">{fg(away.code || away.tla || "")}</span>
                    </div>
                  </div>
                  {/* Mini stat bars */}
                  {st && (
                    <div className="flex gap-3 text-[10px] text-[var(--text-muted)]">
                      {st.possession != null && (
                        <span className="flex items-center gap-1">
                          控球 <span className="font-semibold text-[var(--text-secondary)]">{st.possession}%</span>
                        </span>
                      )}
                      {st.shots?.total != null && (
                        <span className="flex items-center gap-1">
                          射门 <span className="font-semibold text-[var(--text-secondary)]">{st.shots.total}</span>
                        </span>
                      )}
                      {st.corners != null && (
                        <span className="flex items-center gap-1">
                          角球 <span className="font-semibold text-[var(--text-secondary)]">{st.corners}</span>
                        </span>
                      )}
                    </div>
                  )}
                </DataCard>
              </a>
            );
          })}

          {/* Finished */}
          {finished.map((m: any) => {
            const home = m.homeTeam || {}; const away = m.awayTeam || {};
            const ft = m.score?.fullTime || m.score?.ft;
            return (
              <a key={m.id} href={`/match/${m.id}`}>
                <DataCard className="group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-xl">{fg(home.code || home.tla || "")}</span>
                      <span className="text-sm font-medium">{home.shortName || home.name}</span>
                    </div>
                    <span className="data-value-md shrink-0 mx-4 text-[var(--text-muted)]">
                      {ft?.home ?? 0}:{ft?.away ?? 0}
                    </span>
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <span className="text-sm font-medium">{away.shortName || away.name}</span>
                      <span className="text-xl">{fg(away.code || away.tla || "")}</span>
                    </div>
                  </div>
                </DataCard>
              </a>
            );
          })}

          {/* Upcoming */}
          {upcoming.map((m: any) => {
            const home = m.homeTeam || {}; const away = m.awayTeam || {};
            return (
              <a key={m.id} href={`/match/${m.id}`}>
                <DataCard className="group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-xl">{fg(home.code || home.tla || "")}</span>
                      <span className="text-sm font-medium">{home.shortName || home.name}</span>
                    </div>
                    <div className="shrink-0 mx-4 text-center">
                      <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                        {m.time || m.date?.slice(5)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <span className="text-sm font-medium">{away.shortName || away.name}</span>
                      <span className="text-xl">{fg(away.code || away.tla || "")}</span>
                    </div>
                  </div>
                </DataCard>
              </a>
            );
          })}
        </div>
      </PageShell>
    </section>
  );
}

// ============================================================
//  POWER RANKINGS — Podium design
// ============================================================

function PowerRankings({ teams }: { teams: any[] }) {
  const [predictions, setPredictions] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch("/api/ai/predict-champion", { method: "POST" })
      .then((r) => r.json())
      .then((p) => { if (!p.error) setPredictions(p); })
      .catch(() => {});
    setTimeout(() => setVisible(true), 100);
  }, []);

  const rankings = predictions?.rankings || teams
    .filter((t: any) => t.tla)
    .sort((a: any, b: any) => (a.fifaRanking || 99) - (b.fifaRanking || 99))
    .slice(0, 10)
    .map((t: any, i: number) => ({
      rank: i + 1,
      team: t.shortName || t.name,
      code: t.tla,
      probability: parseFloat((22 - i * 2.2).toFixed(1)),
      trend: (["up","up","down","stable","up","down","stable","up","stable","down"] as const)[i],
      change: [2.1, -1.5, 0.8, 1.2, -0.3, 3.2, 0, 0.5, -2.1, 0][i],
    }));

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);
  const medals = ["🥇","🥈","🥉"];
  const podiumOrder = [1, 0, 2]; // Silver, Gold, Bronze for visual

  return (
    <section className="border-b border-[var(--border-subtle)]">
      <PageShell className="py-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Power Rankings</h2>
          <a href="/predictions" className="text-[13px] font-medium text-[var(--accent-primary)] hover:underline">
            完整排行 →
          </a>
        </div>

        {/* Podium — Top 3 */}
        <div className="flex items-end justify-center gap-3 md:gap-4 mb-6"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "all 0.6s ease-out" }}>
          {podiumOrder.map((idx) => {
            const t = top3[idx];
            if (!t) return null;
            const podiumH = idx === 0 ? "h-24" : idx === 1 ? "h-16" : "h-20";
            const podiumY = idx === 1 ? "-mt-2" : "";
            const medalGlow = idx === 0 ? "0 0 24px rgba(245,158,11,0.3)" : idx === 1 ? "0 0 20px rgba(148,163,184,0.25)" : "0 0 16px rgba(180,83,9,0.2)";
            return (
              <a key={t.code} href={`/team/${t.code}`}
                className={`flex flex-col items-center gap-2 group ${podiumY}`}
                style={{ transition: "all 0.4s ease-out", transitionDelay: `${idx * 150}ms` }}>
                <span className="text-2xl drop-shadow-lg" style={{ filter: `drop-shadow(${medalGlow})` }}>
                  {medals[idx]}
                </span>
                <span className="text-3xl">{fg(t.code)}</span>
                <span className="text-sm font-bold">{t.team}</span>
                <span className="text-xl font-bold text-[var(--accent-primary)] tabular-nums">{t.probability}%</span>
                <span className="text-[11px] font-medium"
                  style={{ color: t.trend === "up" ? "var(--accent-success)" : t.trend === "down" ? "var(--accent-danger)" : "var(--text-muted)" }}>
                  {t.trend === "up" ? `▲ +${t.change}` : t.trend === "down" ? `▼ ${t.change}` : "—"}
                </span>
              </a>
            );
          })}
        </div>

        {/* Rest of rankings */}
        <div className="space-y-1 max-w-3xl mx-auto">
          {rest.map((r: any, i: number) => (
            <a key={r.code} href={`/team/${r.code}`}
              className="flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors hover:bg-white/[0.02]"
              style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)", transition: `all 0.4s ease-out ${(i+3)*60}ms` }}>
              <span className="w-6 text-center text-sm font-semibold text-[var(--text-muted)]">{r.rank}</span>
              <span className="text-lg">{fg(r.code)}</span>
              <span className="flex-1 text-sm font-medium">{r.team}{cnName(r.code) ? <span className="text-[var(--text-muted)] ml-1 text-[11px]">({cnName(r.code)})</span> : ""}</span>
              <div className="flex items-center gap-3">
                {/* Progress bar */}
                <div className="w-24 h-1.5 rounded-full bg-white/[0.04] overflow-hidden hidden sm:block">
                  <div className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-1000"
                    style={{ width: `${r.probability * 3}%` }} />
                </div>
                <span className="data-value-sm text-[var(--accent-primary)] w-14 text-right">{r.probability}%</span>
                <span className="text-[11px] w-10 text-right font-medium"
                  style={{ color: r.trend === "up" ? "var(--accent-success)" : r.trend === "down" ? "var(--accent-danger)" : "var(--text-muted)" }}>
                  {r.trend === "up" ? `▲${r.change}` : r.trend === "down" ? `▼${Math.abs(r.change)}` : "—"}
                </span>
              </div>
            </a>
          ))}
        </div>
      </PageShell>
    </section>
  );
}

// ============================================================
//  INTELLIGENCE — Dashboard panels
// ============================================================

function Intelligence({ teams }: { teams: any[] }) {
  const confederations = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of teams) {
      const c = (t as any).confederation || (t as any).area?.name || "—";
      map[c] = (map[c] || 0) + 1;
    }
    return Object.entries(map).sort(([,a],[,b]) => (b as number) - (a as number));
  }, [teams]);

  return (
    <section className="border-b border-[var(--border-subtle)]">
      <PageShell className="py-10">
        <h2 className="text-lg font-semibold mb-4">Tournament Intelligence</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Confederation distribution */}
          <DataCard variant="glass" padding="lg">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--accent-cyan)]" />
              参赛大洲分布
            </h3>
            <div className="space-y-2.5">
              {confederations.slice(0, 6).map(([name, count]) => {
                const pct = Math.round(((count as number) / 48) * 100);
                return (
                  <div key={name}>
                    <div className="flex items-center justify-between text-[12px] mb-1">
                      <span className="text-[var(--text-secondary)]">{name}</span>
                      <span className="font-semibold tabular-nums">{count as number}队</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--accent-cyan)]/60 transition-all duration-1000"
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </DataCard>

          {/* Tournament facts */}
          <DataCard variant="glass" padding="lg">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)]" />
              赛事数据
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { v: "48", l: "参赛球队" },
                { v: "104", l: "比赛场次" },
                { v: "16", l: "主办城市" },
                { v: "3", l: "主办国家" },
                { v: "12", l: "小组" },
                { v: "32", l: "淘汰赛名额" },
              ].map((s) => (
                <div key={s.l} className="text-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] py-3 px-2">
                  <div className="data-value-md text-[var(--accent-primary)]">{s.v}</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </DataCard>

          {/* AI Insights */}
          <DataCard variant="glass" padding="lg">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--accent-success)]" />
              AI 赛事洞察
            </h3>
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-4">
              基于FIFA排名、球队近期战绩、阵容实力、历史数据等多维数据，AI将持续分析并更新夺冠概率和赛事预测。
            </p>
            <div className="space-y-2">
              <a href="/predictions" className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-sm font-medium transition-all hover:bg-[var(--bg-elevated)]">
                <span>🏆 夺冠概率预测</span>
                <span className="text-[var(--accent-primary)]">→</span>
              </a>
              <a href="/predictions/match" className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 text-sm font-medium transition-all hover:bg-[var(--bg-elevated)]">
                <span>⚽ 赛前预测分析</span>
                <span className="text-[var(--accent-primary)]">→</span>
              </a>
            </div>
          </DataCard>
        </div>
      </PageShell>
    </section>
  );
}

// ============================================================
//  FOOTER
// ============================================================

function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)]">
      <PageShell className="py-6">
        <div className="flex flex-col items-center gap-3 text-center md:flex-row md:justify-between">
          <span className="text-xs font-bold tracking-tight text-[var(--accent-primary)]">WC26</span>
          <p className="text-[11px] text-[var(--text-muted)]">
            FIFA World Cup 2026 Command Center · 数据来源 football-data.org · AI分析仅供参考
          </p>
        </div>
      </PageShell>
    </footer>
  );
}

// ============================================================
//  PAGE
// ============================================================

export default function HomePage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    footballApi.teams.list()
      .then((r) => { if (r.success) setTeams(r.data as any[]); })
      .catch(() => {})
      .finally(() => setLoading(false));
    // Fetch matches — try list + upcoming to get pre-tournament schedule
    Promise.all([
      footballApi.matches.list({}).catch(() => ({ success: false, data: [] })),
      footballApi.matches.upcoming(30).catch(() => ({ success: false, data: [] })),
      footballApi.schedule.all().catch(() => ({ success: false, data: [] })),
    ]).then(([listRes, upcomingRes, scheduleRes]) => {
      const all: any[] = [];
      const seen = new Set<string>();
      const add = (arr: any[]) => {
        for (const m of arr) { if (!seen.has(m.id)) { seen.add(m.id); all.push(m); } }
      };
      if (listRes.success) add(listRes.data as any[]);
      if (upcomingRes.success) add(upcomingRes.data as any[]);
      if (scheduleRes.success) add(scheduleRes.data as any[]);
      setMatches(all);
    }).catch(() => {});
  }, []);

  const liveCount = matches.filter((m: any) => ["LIVE","IN_PLAY","PAUSED"].includes(m.status)).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-deep)]">
        <Header liveCount={0} currentPath="/" />
        <PageShell className="py-20">
          <div className="flex gap-3 mb-8">{[1,2,3,4].map(i=><div key={i} className="shimmer rounded-xl h-16 w-36"/>)}</div>
          <div className="grid gap-4 lg:grid-cols-2">{[1,2].map(i=><div key={i} className="shimmer rounded-2xl h-32"/>)}</div>
        </PageShell>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-deep)]">
      <Header liveCount={liveCount} currentPath="/" />
      <StatusBar teams={teams} matches={matches} />
      <Hero />
      <LiveCenter matches={matches} />
      <PowerRankings teams={teams} />
      <Intelligence teams={teams} />
      <Footer />
      <style>{`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
          70% { box-shadow: 0 0 0 40px rgba(59,130,246,0); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }
      `}</style>
    </div>
  );
}
