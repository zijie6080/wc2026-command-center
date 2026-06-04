"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { footballApi } from "@/services/football-api";
import Header from "@/shared/components/layout/Header";
import DataCard from "@/shared/components/ui/DataCard";
import Badge from "@/shared/components/ui/Badge";
import PageShell from "@/shared/components/ui/PageShell";

const FLAG: Record<string, string> = {
  ARG:"🇦🇷",BRA:"🇧🇷",FRA:"🇫🇷",ESP:"🇪🇸",ENG:"🏴",POR:"🇵🇹",GER:"🇩🇪",ITA:"🇮🇹",
  NED:"🇳🇱",BEL:"🇧🇪",CRO:"🇭🇷",USA:"🇺🇸",CAN:"🇨🇦",MEX:"🇲🇽",JPN:"🇯🇵",KOR:"🇰🇷",
  IRN:"🇮🇷",NGA:"🇳🇬",MAR:"🇲🇦",SEN:"🇸🇳",EGY:"🇪🇬",AUS:"🇦🇺",NZL:"🇳🇿",URU:"🇺🇾",
  COL:"🇨🇴",ECU:"🇪🇨",PER:"🇵🇪",CHI:"🇨🇱",KSA:"🇸🇦",QAT:"🇶🇦",
};
const fg = (c: string) => FLAG[c] || "🏳️";
const cn = (...c: (string | boolean | undefined | null)[]) => c.filter(Boolean).join(" ");

// ============================================================
//  PAGE
// ============================================================

export default function TeamDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [team, setTeam] = useState<any>(null);
  const [standings, setStandings] = useState<any[]>([]);
  const [groupTable, setGroupTable] = useState<any[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview"|"squad"|"standings"|"matches">("overview");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      // If id is a team code (letters), look up numeric ID first
      let teamId = id;
      if (!/^\d+$/.test(id)) {
        try {
          const teamsRes = await footballApi.teams.list();
          if (teamsRes.success && Array.isArray(teamsRes.data)) {
            const found = (teamsRes.data as any[]).find((t: any) => t.tla === id);
            if (found) teamId = String(found.id);
          }
        } catch {}
      }
      try {
        const [teamRes, standingsRes, recentRes, upcomingRes] = await Promise.all([
          footballApi.teams.getById(teamId),
          footballApi.schedule.standings(),
          footballApi.teams.recentMatches(teamId).catch(() => ({ success: false, data: [] })),
          footballApi.teams.upcomingMatches(teamId).catch(() => ({ success: false, data: [] })),
        ]);
        if (cancelled) return;
        if (teamRes.success && teamRes.data) {
        const t = teamRes.data as any;
        setTeam(t);
        if (standingsRes.success && Array.isArray(standingsRes.data)) {
          const all = standingsRes.data as any[];
          setStandings(all);
          const group = all.find((s: any) => s.table?.some((row: any) => row.team?.id === t.id));
          if (group) setGroupTable(group.table);
        }
        if (recentRes.success && Array.isArray(recentRes.data)) setRecentMatches(recentRes.data);
        if (upcomingRes.success && Array.isArray(upcomingRes.data)) setUpcomingMatches(upcomingRes.data);
      } else setError("Team not found");
      } catch(e: any) { if (!cancelled) setError(e.message); }
      finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg-deep)]">
      <Header currentPath="/teams" />
      <PageShell className="py-20">
        <div className="shimmer mx-auto h-24 w-24 rounded-full" />
        <div className="shimmer mx-auto mt-4 h-8 w-48 rounded" />
        <div className="shimmer mx-auto mt-2 h-5 w-64 rounded" />
      </PageShell>
    </div>
  );

  if (error || !team) return (
    <div className="min-h-screen bg-[var(--bg-deep)]">
      <Header currentPath="/teams" />
      <PageShell className="py-20 text-center">
        <p className="text-5xl mb-4">⚠️</p>
        <h2 className="text-lg font-semibold">加载失败</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">{error || "Team not found"}</p>
        <a href="/teams" className="mt-4 inline-block text-sm font-medium text-[var(--accent-primary)]">← 返回球队列表</a>
      </PageShell>
    </div>
  );

  const groupLetter = standings.find((s: any) => s.table?.some((r: any) => r.team?.id === team.id))?.group || "?";
  const squad = team.squad || [];

  return (
    <div className="min-h-screen bg-[var(--bg-deep)]">
      <Header currentPath="/teams" />

      {/* Hero */}
      <section className="border-b border-[var(--border-subtle)] bg-gradient-to-b from-[var(--accent-primary)]/5 to-transparent">
        <PageShell>
          <div className="py-10 text-center">
            {team.crest ? <img src={team.crest} alt="" className="mx-auto h-20 w-20 md:h-24 md:w-24 object-contain" /> : <span className="text-6xl">{fg(team.tla || "")}</span>}
            <h1 className="mt-4 text-2xl font-extrabold md:text-3xl">{team.name}</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{team.area?.name} · {groupLetter}组</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
              {team.founded && <span className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1.5 text-[var(--text-muted)]">成立于 {team.founded}</span>}
              {team.venue && <span className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1.5 text-[var(--text-muted)]">🏟 {team.venue}</span>}
              {team.coach?.name && <span className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1.5 text-[var(--text-muted)]">🧑‍💼 {team.coach.name}</span>}
            </div>
          </div>
        </PageShell>
      </section>

      {/* Tabs */}
      <div className="glass-panel sticky z-40 border-b border-[var(--border-subtle)]" style={{ top: 56 }}>
        <PageShell>
          <div className="flex gap-0 overflow-x-auto">
            {[
              { key: "overview" as const, label: "概览" },
              { key: "squad" as const, label: `阵容 (${squad.length})` },
              { key: "standings" as const, label: "积分榜" },
              { key: "matches" as const, label: "比赛" },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="relative px-5 py-3 text-sm font-semibold transition-colors hover:text-white"
                style={{ color: activeTab === tab.key ? "var(--text-primary)" : "var(--text-muted)" }}>
                {tab.label}
                {activeTab === tab.key && <span className="absolute bottom-0 left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full bg-[var(--accent-primary)]" />}
              </button>
            ))}
          </div>
        </PageShell>
      </div>

      {/* Content */}
      <PageShell className="py-8">
        {/* Overview */}
        {activeTab === "overview" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "FIFA代码", value: team.tla || "—" },
              { label: "所属地区", value: team.area?.name || "—" },
              { label: "主教练", value: team.coach?.name || "—" },
              { label: "成立年份", value: team.founded || "—" },
            ].map(s => (
              <DataCard key={s.label} padding="md">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">{s.label}</div>
                <div className="text-base font-bold">{String(s.value)}</div>
              </DataCard>
            ))}
            {(team as any).fifaRanking != null && (
              <DataCard padding="md">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">FIFA排名</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[var(--accent-primary)]">#{(team as any).fifaRanking}</span>
                  {(team as any).fifaRankingPrevious && (
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {(team as any).fifaRankingPrevious > (team as any).fifaRanking ? "↑" : "↓"} {Math.abs((team as any).fifaRankingPrevious - (team as any).fifaRanking)}
                    </span>
                  )}
                </div>
              </DataCard>
            )}
            {(team as any).worldCupTitles > 0 && (
              <DataCard padding="md">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">世界杯冠军</div>
                <div className="text-2xl font-bold text-[var(--accent-warning)]">{(team as any).worldCupTitles}次</div>
              </DataCard>
            )}
          </div>
        )}

        {/* Squad */}
        {activeTab === "squad" && (
          <div>
            {squad.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {squad.map((p: any) => (
                  <a key={p.id} href={`/player/${p.id}`}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 transition-all hover:bg-[var(--bg-elevated)] hover:-translate-y-0.5">
                    <span className="w-8 shrink-0 text-center text-xs font-bold text-[var(--text-muted)]">{p.position || "—"}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{p.name}</div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        {p.nationality} · {p.dateOfBirth ? new Date(p.dateOfBirth).getFullYear() : "—"}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : <div className="py-12 text-center text-sm text-[var(--text-muted)]">阵容数据暂未开放</div>}
          </div>
        )}

        {/* Standings */}
        {activeTab === "standings" && (
          <div>
            {groupTable.length > 0 ? (
              <div>
                <h3 className="text-base font-semibold mb-3">{groupLetter}组 积分榜</h3>
                <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border-subtle)] text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                        <th className="py-2.5 pl-4 text-left">#</th><th className="py-2.5 text-left">球队</th><th className="py-2.5 px-2">场</th><th className="py-2.5 px-2">胜</th><th className="py-2.5 px-2">平</th><th className="py-2.5 px-2">负</th><th className="py-2.5 px-2">进</th><th className="py-2.5 px-2">失</th><th className="py-2.5 px-2">净</th><th className="py-2.5 pr-4 font-bold">分</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupTable.map((row: any) => (
                        <tr key={row.team?.id} className={cn("border-b border-[var(--border-subtle)] transition-colors hover:bg-white/[0.02]", row.team?.id === team.id ? "font-bold bg-[var(--accent-primary)]/5" : "")}>
                          <td className="py-2.5 pl-4">{row.position}</td>
                          <td className="py-2.5 flex items-center gap-2">
                            {row.team?.crest && <img src={row.team.crest} alt="" className="h-5 w-5" />}
                            {row.team?.name || row.teamName}
                          </td>
                          <td className="py-2.5 px-2 text-center">{row.playedGames ?? row.played}</td>
                          <td className="py-2.5 px-2 text-center">{row.won}</td>
                          <td className="py-2.5 px-2 text-center">{row.draw ?? row.drawn}</td>
                          <td className="py-2.5 px-2 text-center">{row.lost}</td>
                          <td className="py-2.5 px-2 text-center">{row.goalsFor}</td>
                          <td className="py-2.5 px-2 text-center">{row.goalsAgainst}</td>
                          <td className="py-2.5 px-2 text-center" style={{ color: row.goalDifference > 0 ? "var(--accent-success)" : row.goalDifference < 0 ? "var(--accent-danger)" : undefined }}>
                            {row.goalDifference > 0 ? "+" : ""}{row.goalDifference}
                          </td>
                          <td className="py-2.5 pr-4 text-center font-bold">{row.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : <div className="py-12 text-center text-sm text-[var(--text-muted)]">积分榜数据暂未开放</div>}
          </div>
        )}

        {/* Matches */}
        {activeTab === "matches" && (
          <div className="space-y-8">
            {upcomingMatches.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[var(--accent-primary)]" /> 即将进行</h3>
                <div className="space-y-2">
                  {upcomingMatches.map((m: any, i: number) => (
                    <a key={i} href={`/match/${m.id}`}
                      className="flex items-center gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 transition-colors hover:bg-[var(--bg-elevated)]">
                      <span className="text-sm font-semibold text-[var(--accent-primary)]">{m.date || m.utcDate?.slice(0,10)}</span>
                      <span className="text-sm font-medium">{m.homeTeam?.name || m.opponent?.name} vs {m.awayTeam?.name || "—"}</span>
                      <span className="ml-auto text-[11px] text-[var(--text-muted)]">{m.stage || m.group || ""}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[var(--text-muted)]" /> 最近比赛</h3>
              {recentMatches.length > 0 ? (
                <div className="space-y-2">
                  {recentMatches.map((m: any, i: number) => {
                    const hName = m.homeTeam?.name || m.homeTeam?.shortName || "—";
                    const aName = m.awayTeam?.name || m.awayTeam?.shortName || "—";
                    let result = m.result || "";
                    if (!result && m.score?.fullTime) {
                      const h = m.score.fullTime.home ?? 0; const a = m.score.fullTime.away ?? 0;
                      result = h > a ? "W" : h < a ? "L" : "D";
                    }
                    return (
                      <a key={i} href={`/match/${m.id}`}
                        className="flex items-center gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 transition-colors hover:bg-[var(--bg-elevated)]">
                        <span className="text-sm text-[var(--text-muted)] w-20 shrink-0">{m.date || m.utcDate?.slice(0,10)}</span>
                        <span className="text-sm font-medium flex-1">{hName} vs {aName}</span>
                        <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                          result === "W" ? "text-[var(--accent-success)] bg-[var(--accent-success)]/10" :
                          result === "D" ? "text-[var(--accent-warning)] bg-[var(--accent-warning)]/10" :
                          "text-[var(--accent-danger)] bg-[var(--accent-danger)]/10")}>{result}</span>
                        {m.score && (
                          <span className="text-sm font-semibold">
                            {m.score.fullTime ? `${m.score.fullTime.home ?? 0}:${m.score.fullTime.away ?? 0}` : m.score}
                          </span>
                        )}
                      </a>
                    );
                  })}
                </div>
              ) : <div className="py-8 text-center text-sm text-[var(--text-muted)]">暂无比赛记录</div>}
            </div>
          </div>
        )}
      </PageShell>
    </div>
  );
}
