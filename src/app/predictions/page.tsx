"use client";

import { useState, useEffect } from "react";
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
const fg = (c: string) => FLAG[c] || "🏳";

// ============================================================
//  PODIUM
// ============================================================

function PodiumCard({ team, medal, height }: { team: any; medal: string; height: string }) {
  const medals: Record<string, { glow: string; bg: string; border: string }> = {
    "🥇": { glow: "0 0 30px rgba(245,158,11,0.4)", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.25)" },
    "🥈": { glow: "0 0 24px rgba(148,163,184,0.3)", bg: "rgba(148,163,184,0.04)", border: "rgba(148,163,184,0.2)" },
    "🥉": { glow: "0 0 18px rgba(180,83,9,0.25)", bg: "rgba(180,83,9,0.04)", border: "rgba(180,83,9,0.2)" },
  };
  const m = medals[medal];

  return (
    <a href={`/team/${team.id||team.code}`}
      className="flex flex-col items-center justify-end group w-[clamp(90px,28vw,160px)]"
      style={{ minHeight: "clamp(140px, 35vw, 200px)" }}>
      <div className="flex flex-col items-center gap-2 mb-3">
        <span className="text-3xl drop-shadow-lg" style={{ filter: `drop-shadow(${m.glow})` }}>{medal}</span>
        <span className="text-3xl">{fg(team.code)}</span>
        <span className="text-sm font-bold text-center">{team.team}</span>
        <span className="text-2xl font-bold text-[var(--accent-primary)] tabular-nums">{team.probability}%</span>
        {team.trend && (
          <span className="text-[11px] font-medium" style={{
            color: team.trend === "up" ? "var(--accent-success)" : team.trend === "down" ? "var(--accent-danger)" : "var(--text-muted)"
          }}>
            {team.trend === "up" ? `▲ +${team.change}` : team.trend === "down" ? `▼ ${Math.abs(team.change)}` : "—"}
          </span>
        )}
      </div>
      {/* Podium step */}
      <div className="w-full rounded-t-xl transition-all"
        style={{
          height,
          background: `linear-gradient(180deg, ${m.bg} 0%, rgba(255,255,255,0.02) 100%)`,
          border: `1px solid ${m.border}`,
          borderBottom: "none",
        }} />
    </a>
  );
}

// ============================================================
//  PAGE
// ============================================================

export default function PredictionsPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/ai/predict-champion", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.message);
        else setResult(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-deep)]">
        <Header currentPath="/predictions" />
        <PageShell className="py-20">
          <div className="flex justify-center gap-4 mb-8">
            {[1,2,3].map(i=><div key={i} className="shimmer rounded-2xl w-36 h-48"/>)}
          </div>
          <div className="shimmer rounded-2xl h-96"/>
        </PageShell>
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className="min-h-screen bg-[var(--bg-deep)]">
        <Header currentPath="/predictions" />
        <PageShell className="py-20 text-center">
          <p className="text-5xl mb-4">⚠️</p>
          <h2 className="text-lg font-semibold">加载失败</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-[var(--accent-primary)] px-5 py-2 text-sm font-semibold text-white">重新加载</button>
        </PageShell>
      </div>
    );
  }

  const rankings = result?.rankings || [];
  const top3 = rankings.slice(0, 3);
  const podiumOrder = [1, 0, 2]; // Silver left, Gold center, Bronze right
  const podiumHeights = ["clamp(80px,22vw,120px)", "clamp(110px,30vw,160px)", "clamp(65px,18vw,100px)"];
  const rest = rankings.slice(3);

  return (
    <div className="min-h-screen bg-[var(--bg-deep)]">
      <Header currentPath="/predictions" />

      <PageShell className="py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-1.5">
            {result?.source === "ai" ? (
              <><span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-success)]" /><span className="text-[10px] font-semibold text-[var(--text-muted)]">AI 驱动 · 每日更新</span></>
            ) : (
              <><span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-warning)]" /><span className="text-[10px] font-semibold text-[var(--text-muted)]">规则预测</span></>
            )}
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-bold tracking-tight">冠军预测</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {result?.generatedAt ? new Date(result.generatedAt).toLocaleDateString("zh-CN", { month:"long", day:"numeric", hour:"2-digit", minute:"2-digit" }) + " 更新" : ""}
          </p>
        </div>

        {/* Podium — Top 3 */}
        <div className="flex items-end justify-center gap-3 md:gap-6 mb-10 max-w-lg mx-auto">
          {podiumOrder.map((idx, i) => {
            const t = top3[idx];
            if (!t) return null;
            const medals = ["🥇","🥈","🥉"];
            return <PodiumCard key={t.code} team={t} medal={medals[idx]} height={podiumHeights[idx]} />;
          })}
        </div>

        {/* Rest rankings + Quick links */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Leaderboard */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">48队完整排行</h2>
              <a href="/predictions/match" className="text-[13px] font-medium text-[var(--accent-primary)] hover:underline">⚽ 赛前预测 →</a>
            </div>
            <div className="space-y-1">
              {rest.map((r: any, i: number) => (
                <a key={r.code} href={`/team/${r.id||r.code}`}
                  className="flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors hover:bg-white/[0.02]"
                  style={{
                    animation: `fade-in 0.4s ease-out both`,
                    animationDelay: `${(i+3)*40}ms`,
                  }}>
                  <span className="w-6 text-center text-sm font-semibold text-[var(--text-muted)]">{r.rank}</span>
                  <span className="text-lg">{fg(r.code)}</span>
                  <span className="flex-1 text-sm font-medium">{r.team}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-28 h-1.5 rounded-full bg-white/[0.04] overflow-hidden hidden sm:block">
                      <div className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-1000"
                        style={{ width: `${Math.min(r.probability * 3, 100)}%` }} />
                    </div>
                    <span className="data-value-sm text-[var(--accent-primary)] w-14 text-right">{r.probability}%</span>
                    {r.trend && (
                      <span className="text-[11px] w-10 text-right font-medium"
                        style={{ color: r.trend === "up" ? "var(--accent-success)" : r.trend === "down" ? "var(--accent-danger)" : "var(--text-muted)" }}>
                        {r.trend === "up" ? `▲${r.change}` : r.trend === "down" ? `▼${Math.abs(r.change)}` : "—"}
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Side: Analysis */}
          <div className="lg:w-80 shrink-0">
            <h2 className="text-lg font-semibold mb-4">AI 深度分析</h2>
            <div className="space-y-4">
              {result?.analysis?.favorites && (
                <DataCard variant="glass" padding="md">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[var(--accent-primary)]" /> 夺冠热门
                  </h3>
                  <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{result.analysis.favorites}</p>
                </DataCard>
              )}
              {result?.analysis?.darkHorses && (
                <DataCard variant="glass" padding="md">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[var(--accent-warning)]" /> 黑马球队
                  </h3>
                  <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{result.analysis.darkHorses}</p>
                </DataCard>
              )}
              {result?.analysis?.groupStage && (
                <DataCard variant="glass" padding="md">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[var(--accent-cyan)]" /> 小组形势
                  </h3>
                  <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{result.analysis.groupStage}</p>
                </DataCard>
              )}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="mt-8 text-center text-[11px] text-[var(--text-muted)]">
          🤖 以上分析由 AI 基于多维数据生成，仅供参考 · football-data.org
        </p>
      </PageShell>
    </div>
  );
}
