"use client";

import { useState, useEffect, useMemo } from "react";
import { footballApi } from "@/services/football-api";

// ============================================================
//  TYPES
// ============================================================

interface TeamOption {
  id: string | number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

interface PredictionResult {
  homeTeam: { name: string; code: string };
  awayTeam: { name: string; code: string };
  winProbability: { home: number; draw: number; away: number };
  predictedScore: { home: number; away: number };
  analysis: {
    overview: string;
    keyPlayers: string;
    tacticalPreview: string;
    riskFactors: string;
  };
  headToHead?: {
    totalMatches: number;
    homeWins: number;
    draws: number;
    awayWins: number;
    recentMatches: { date: string; result: string }[];
  };
  source: "ai" | "fallback";
  generatedAt: string;
  cached?: boolean;
}

// ============================================================
//  HELPERS
// ============================================================

function cn(...c: (string | boolean | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

const FLAG: Record<string, string> = {
  ARG: "🇦🇷", BRA: "🇧🇷", FRA: "🇫🇷", ESP: "🇪🇸", ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  POR: "🇵🇹", GER: "🇩🇪", ITA: "🇮🇹", NED: "🇳🇱", BEL: "🇧🇪", CRO: "🇭🇷",
  USA: "🇺🇸", CAN: "🇨🇦", MEX: "🇲🇽", JPN: "🇯🇵", KOR: "🇰🇷", IRN: "🇮🇷",
  NGA: "🇳🇬", MAR: "🇲🇦", SEN: "🇸🇳", EGY: "🇪🇬", GHA: "🇬🇭", CMR: "🇨🇲",
  AUS: "🇦🇺", NZL: "🇳🇿", URU: "🇺🇾", COL: "🇨🇴", ECU: "🇪🇨", PER: "🇵🇪",
  CHI: "🇨🇱", KSA: "🇸🇦", QAT: "🇶🇦", UAE: "🇦🇪", CIV: "🇨🇮",
  JAM: "🇯🇲", CZE: "🇨🇿", UKR: "🇺🇦", SUI: "🇨🇭", DEN: "🇩🇰",
  SWE: "🇸🇪", NOR: "🇳🇴", POL: "🇵🇱", AUT: "🇦🇹", HUN: "🇭🇺",
  SRB: "🇷🇸", TUR: "🇹🇷", GRE: "🇬🇷", PAR: "🇵🇾", BOL: "🇧🇴",
  VEN: "🇻🇪", ALG: "🇩🇿", TUN: "🇹🇳", COD: "🇨🇩", MLI: "🇲🇱", BFA: "🇧🇫",
};
function flag(c: string) {
  return FLAG[c] || "🏳️";
}

// ============================================================
//  TEAM SELECTOR
// ============================================================

function TeamSelector({
  teams,
  selectedId,
  onSelect,
  placeholder,
}: {
  teams: TeamOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  placeholder: string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return teams.slice(0, 20);
    const q = search.toLowerCase();
    return teams
      .filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.shortName.toLowerCase().includes(q) ||
          t.tla.toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [teams, search]);

  const selected = teams.find((t) => String(t.id) === selectedId);

  return (
    <div className="relative">
      {selected ? (
        <button
          onClick={() => {
            onSelect("");
            setSearch("");
          }}
          className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all hover:bg-white/[0.02]"
          style={{
            borderColor: "var(--border-default)",
            background:
              "linear-gradient(135deg, var(--bg-card), rgba(15,15,26,0.6))",
          }}
        >
          {selected.crest ? (
            <img src={selected.crest} alt="" className="h-8 w-8 object-contain" />
          ) : (
            <span className="text-2xl">{flag(selected.tla)}</span>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold truncate">{selected.shortName || selected.name}</div>
            <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {selected.name}
            </div>
          </div>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            ✕
          </span>
        </button>
      ) : (
        <div>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-white/20"
            style={{
              borderColor: "var(--border-default)",
              backgroundColor: "rgba(255,255,255,0.02)",
              color: "var(--text-primary)",
            }}
          />
          {open && filtered.length > 0 && (
            <div
              className="absolute z-50 mt-1 w-full rounded-xl border py-1 shadow-2xl max-h-[300px] overflow-y-auto"
              style={{
                borderColor: "var(--border-default)",
                backgroundColor: "var(--bg-card)",
              }}
            >
              {filtered.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onSelect(String(t.id));
                    setSearch("");
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
                >
                  {t.crest ? (
                    <img src={t.crest} alt="" className="h-7 w-7 object-contain" />
                  ) : (
                    <span className="text-xl">{flag(t.tla)}</span>
                  )}
                  <span className="text-sm font-semibold">{t.shortName || t.name}</span>
                  <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
                    {flag(t.tla)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
//  PREDICTION RESULT
// ============================================================

function PredictionDisplay({ result }: { result: PredictionResult }) {
  const { winProbability, predictedScore, analysis } = result;
  const homePct = winProbability.home;
  const drawPct = winProbability.draw;
  const awayPct = winProbability.away;

  return (
    <div className="mt-8">
      {/* Scoreboard */}
      <div className="rounded-2xl border p-6 md:p-8 text-center"
        style={{
          borderColor: "var(--border-default)",
          background: "linear-gradient(135deg, rgba(15,15,26,0.8), var(--bg-card) 80%)",
        }}>
        <div className="flex items-center justify-center gap-6 md:gap-10">
          {/* Home */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <span className="text-4xl md:text-5xl">{flag(result.homeTeam.code)}</span>
            <span className="text-base font-bold md:text-lg">{result.homeTeam.name}</span>
          </div>

          {/* Score + VS */}
          <div className="flex flex-col items-center shrink-0">
            <span className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>预测比分</span>
            <div className="flex items-center gap-3 font-mono text-4xl md:text-5xl font-bold"
              style={{ color: "var(--color-brand)" }}>
              <span>{predictedScore.home}</span>
              <span style={{ color: "var(--text-muted)" }}>:</span>
              <span>{predictedScore.away}</span>
            </div>
            {result.source === "ai" && (
              <span className="mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: "rgba(0,224,122,0.1)", color: "var(--color-brand)" }}>
                AI 预测
              </span>
            )}
          </div>

          {/* Away */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <span className="text-4xl md:text-5xl">{flag(result.awayTeam.code)}</span>
            <span className="text-base font-bold md:text-lg">{result.awayTeam.name}</span>
          </div>
        </div>
      </div>

      {/* Win Probability Bars */}
      <div className="mt-4 rounded-2xl border p-5"
        style={{ borderColor: "var(--border-default)", background: "linear-gradient(135deg, var(--bg-card), rgba(15,15,26,0.6))" }}>
        <h3 className="text-sm font-bold mb-3">📊 胜率分布</h3>
        <div className="flex items-end gap-2 h-24">
          {/* Home bar */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-lg font-bold font-mono" style={{ color: "var(--color-brand)" }}>{homePct}%</span>
            <div className="w-full rounded-t-lg transition-all duration-700"
              style={{ height: `${homePct}%`, backgroundColor: "var(--color-brand)", opacity: 0.85, minHeight: homePct > 0 ? 4 : 0 }} />
            <span className="text-xs font-semibold">{result.homeTeam.name}</span>
          </div>
          {/* Draw bar */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-lg font-bold font-mono" style={{ color: "var(--text-muted)" }}>{drawPct}%</span>
            <div className="w-full rounded-t-lg transition-all duration-700"
              style={{ height: `${drawPct}%`, backgroundColor: "rgba(255,255,255,0.15)", minHeight: drawPct > 0 ? 4 : 0 }} />
            <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>平局</span>
          </div>
          {/* Away bar */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-lg font-bold font-mono" style={{ color: "var(--color-live)" }}>{awayPct}%</span>
            <div className="w-full rounded-t-lg transition-all duration-700"
              style={{ height: `${awayPct}%`, backgroundColor: "var(--color-live)", opacity: 0.85, minHeight: awayPct > 0 ? 4 : 0 }} />
            <span className="text-xs font-semibold">{result.awayTeam.name}</span>
          </div>
        </div>
      </div>

      {/* H2H History */}
      {result.headToHead && result.headToHead.totalMatches > 0 && (
        <div className="mt-4 rounded-2xl border p-5"
          style={{ borderColor: "var(--border-default)", background: "linear-gradient(135deg, var(--bg-card), rgba(15,15,26,0.6))" }}>
          <h3 className="text-sm font-bold mb-3">📜 历史交锋</h3>
          <div className="flex items-center justify-center gap-4 text-center">
            <div>
              <span className="text-xl font-bold font-mono" style={{ color: "var(--color-brand)" }}>
                {result.headToHead.homeWins}
              </span>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                {result.homeTeam.name}胜
              </div>
            </div>
            <div>
              <span className="text-xl font-bold font-mono" style={{ color: "var(--text-muted)" }}>
                {result.headToHead.draws}
              </span>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>平局</div>
            </div>
            <div>
              <span className="text-xl font-bold font-mono" style={{ color: "var(--color-live)" }}>
                {result.headToHead.awayWins}
              </span>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                {result.awayTeam.name}胜
              </div>
            </div>
          </div>
          <div className="mt-2 text-center text-[11px]" style={{ color: "var(--text-muted)" }}>
            共 {result.headToHead.totalMatches} 场交锋
          </div>
        </div>
      )}

      {/* Analysis Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {analysis.overview && (
          <AnalysisCard icon="🔍" title="比赛总览">
            {analysis.overview}
          </AnalysisCard>
        )}
        {analysis.keyPlayers && (
          <AnalysisCard icon="⭐" title="关键球员">
            {analysis.keyPlayers}
          </AnalysisCard>
        )}
        {analysis.tacticalPreview && (
          <AnalysisCard icon="🎯" title="战术预演">
            {analysis.tacticalPreview}
          </AnalysisCard>
        )}
        {analysis.riskFactors && (
          <AnalysisCard icon="⚠️" title="风险因素">
            {analysis.riskFactors}
          </AnalysisCard>
        )}
      </div>
    </div>
  );
}

function AnalysisCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border p-4"
      style={{ borderColor: "var(--border-default)", background: "linear-gradient(135deg, var(--bg-card), rgba(15,15,26,0.6))" }}>
      <h4 className="flex items-center gap-2 text-sm font-bold mb-2">
        <span>{icon}</span> {title}
      </h4>
      <div className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        {children}
      </div>
    </div>
  );
}

// ============================================================
//  SKELETON
// ============================================================

function ResultSkeleton() {
  return (
    <div className="mt-8">
      <div className="shimmer rounded-2xl" style={{ height: 180 }} />
      <div className="shimmer mt-4 rounded-2xl" style={{ height: 140 }} />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="shimmer rounded-xl" style={{ height: 160 }} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
//  PAGE
// ============================================================

export default function MatchPredictionPage() {
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [homeId, setHomeId] = useState<string | null>(null);
  const [awayId, setAwayId] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load teams
  useEffect(() => {
    footballApi.teams
      .list()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setTeams(
            (res.data as any[]).map((t: any) => ({
              id: t.id,
              name: t.name || "",
              shortName: t.shortName || t.name || "",
              tla: t.tla || "",
              crest: t.crest || "",
            })),
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoadingTeams(false));
  }, []);

  // Auto-predict when both teams selected
  useEffect(() => {
    if (!homeId || !awayId) {
      setResult(null);
      setError("");
      return;
    }
    if (homeId === awayId) {
      setError("请选择两支不同的球队");
      setResult(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    fetch("/api/ai/predict-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ homeTeamId: homeId, awayTeamId: awayId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.message || "预测失败");
          setResult(null);
        } else {
          setResult(data);
          setError("");
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || "网络错误");
        setResult(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [homeId, awayId]);

  // Swap teams
  const handleSwap = () => {
    setHomeId(awayId);
    setAwayId(homeId);
  };

  return (
    <div style={{ backgroundColor: "var(--bg-root)", minHeight: "100vh", color: "var(--text-primary)" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b"
        style={{ borderColor: "var(--border-default)", backgroundColor: "rgba(8,8,15,0.9)", backdropFilter: "blur(16px)" }}>
        <div className="mx-auto flex h-14 max-w-[800px] items-center gap-4 px-4 md:px-6">
          <a href="/predictions" className="flex shrink-0 items-center gap-1.5 text-sm font-medium transition-colors hover:text-white"
            style={{ color: "var(--text-secondary)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            预测中心
          </a>
          <span className="text-sm font-bold">⚽ 赛前预测</span>
          {result?.source === "ai" && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ backgroundColor: "rgba(0,224,122,0.1)", color: "var(--color-brand)" }}>
              AI 驱动
            </span>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-[800px] px-4 py-8 md:px-6">
        <h1 className="text-2xl font-extrabold text-center mb-2">⚽ 赛前预测</h1>
        <p className="text-sm text-center mb-8" style={{ color: "var(--text-muted)" }}>
          选择两支球队，AI 将生成专业赛前预测分析
        </p>

        {/* Team Selectors */}
        {loadingTeams ? (
          <div className="flex flex-col gap-3">
            <div className="shimmer h-14 rounded-xl" />
            <div className="flex justify-center">
              <div className="shimmer h-10 w-10 rounded-full" />
            </div>
            <div className="shimmer h-14 rounded-xl" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <TeamSelector teams={teams} selectedId={homeId} onSelect={setHomeId} placeholder="搜索主队..." />

            {/* Swap button */}
            <div className="flex justify-center">
              <button
                onClick={handleSwap}
                disabled={!homeId && !awayId}
                className="flex h-9 w-9 items-center justify-center rounded-full border transition-all hover:bg-white/[0.04] disabled:opacity-30"
                style={{ borderColor: "var(--border-default)", color: "var(--text-muted)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="7 16 3 12 7 8" />
                  <polyline points="17 8 21 12 17 16" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                </svg>
              </button>
            </div>

            <TeamSelector teams={teams} selectedId={awayId} onSelect={setAwayId} placeholder="搜索客队..." />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border px-4 py-3 text-center"
            style={{ borderColor: "rgba(239,68,68,0.2)", backgroundColor: "rgba(239,68,68,0.04)" }}>
            <span className="text-sm" style={{ color: "#f87171" }}>{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && homeId && awayId && <ResultSkeleton />}

        {/* Result */}
        {!loading && result && <PredictionDisplay result={result} />}

        {/* Empty state */}
        {!loading && !result && !error && (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="text-6xl">🤖</span>
            <h2 className="mt-4 text-lg font-bold">等待选择</h2>
            <p className="mt-1 text-sm max-w-sm" style={{ color: "var(--text-muted)" }}>
              请在上方搜索并选择两支球队，AI 将自动生成包括胜率、预测比分、关键球员和风险因素的完整赛前分析。
            </p>
          </div>
        )}

        {/* Disclaimer */}
        {result && (
          <p className="mt-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>
            🤖 以上预测由 AI 基于球队数据生成，仅供参考 · 足球比赛结果受多种因素影响
          </p>
        )}
      </div>

      <div className="h-20" />
    </div>
  );
}
