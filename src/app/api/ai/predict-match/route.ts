// ============================================================
//  POST /api/ai/predict-match
//  AI-powered pre-match prediction for two selected teams
// ============================================================

import { NextRequest } from "next/server";
import { generateText } from "ai";
import { aiConfig } from "@/lib/ai-config";
import { footballApi } from "@/services/football-api";

// ---- Types ----

export interface MatchPredictionResult {
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
}

// ---- Cache (1h per match pair) ----

const matchCache = new Map<string, { data: MatchPredictionResult; expiresAt: number }>();

// ---- System Prompt ----

const SYSTEM_PROMPT = `你是一位资深足球分析师，精通赛前预测。你的分析基于球队实力、历史交锋、近期状态、球员阵容和战术风格。

请用流暢自然的中文撰写分析。球员名和球队名使用提供的英文原名。
输出必须是有效的JSON格式，不要包含任何markdown标记。`;

function buildPrompt(homeTeam: any, awayTeam: any, h2h: any): string {
  const homeSquad = (homeTeam.squad || []).slice(0, 5).map((p: any) => p.name).join("、");
  const awaySquad = (awayTeam.squad || []).slice(0, 5).map((p: any) => p.name).join("、");
  const homeForm = (homeTeam.recentMatches || []).slice(0, 5).map((m: any) =>
    `${m.date || "?"} ${m.opponent?.name || m.homeTeam?.name || "?"} ${m.result || m.score || "?"}`
  ).join("; ");
  const awayForm = (awayTeam.recentMatches || []).slice(0, 5).map((m: any) =>
    `${m.date || "?"} ${m.opponent?.name || m.homeTeam?.name || "?"} ${m.result || m.score || "?"}`
  ).join("; ");
  const h2hStr = h2h ? `历史交锋: ${h2h.totalMatches}场 ${homeTeam.shortName}${h2h.homeWins || h2h.team1Wins || 0}胜 ${h2h.draws || 0}平 ${awayTeam.shortName}${h2h.awayWins || h2h.team2Wins || 0}胜` : "暂无历史交锋数据";

  return `请预测以下比赛：

主队: ${homeTeam.name} (${homeTeam.tla || ""})
  FIFA排名: #${(homeTeam as any).fifaRanking || "?"}
  大洲: ${(homeTeam as any).confederation || "?"}
  世界杯最佳: ${(homeTeam as any).bestResult || "?"}
  核心球员: ${homeSquad || "数据暂缺"}
  近5场: ${homeForm || "数据暂缺"}

客队: ${awayTeam.name} (${awayTeam.tla || ""})
  FIFA排名: #${(awayTeam as any).fifaRanking || "?"}
  大洲: ${(awayTeam as any).confederation || "?"}
  世界杯最佳: ${(awayTeam as any).bestResult || "?"}
  核心球员: ${awaySquad || "数据暂缺"}
  近5场: ${awayForm || "数据暂缺"}

${h2hStr}

请输出JSON对象：
{
  "winProbability": { "home": 40.0, "draw": 25.0, "away": 35.0 },
  "predictedScore": { "home": 2, "away": 1 },
  "analysis": {
    "overview": "比赛总览（200-250字）：分析双方实力对比、近期状态、比赛的看点和悬念。",
    "keyPlayers": "关键球员（150-200字）：双方各选出2-3名关键球员，分析他们的作用和可能的影响。",
    "tacticalPreview": "战术预演（150-200字）：双方的战术风格对比，可能的战术博弈。",
    "riskFactors": "风险因素（100-150字）：伤病、停赛、赛程压力、天气等可能影响比赛的关键变量。"
  }
}

要求：
- winProbability中 home + draw + away 必须等于100
- predictedScore给出具体比分预测
- 所有分析用流畅中文撰写
- 直接输出JSON，无markdown标记`;
}

export async function POST(request: NextRequest) {
  // 1. Parse request
  let homeId: string, awayId: string;
  try {
    const body = await request.json();
    homeId = body.homeTeamId;
    awayId = body.awayTeamId;
  } catch {
    return Response.json({ error: "INVALID_REQUEST", message: "请求格式错误" }, { status: 400 });
  }

  if (!homeId || !awayId) {
    return Response.json({ error: "MISSING_PARAMS", message: "请选择两支球队" }, { status: 400 });
  }

  if (homeId === awayId) {
    return Response.json({ error: "SAME_TEAM", message: "请选择不同的两支球队" }, { status: 400 });
  }

  // 2. Check cache (1h, keyed by sorted IDs) — prune expired entries on access
  const cacheKey = [homeId, awayId].sort().join("_vs_");
  const cached = matchCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return Response.json({ ...cached.data, cached: true });
  }
  // Clean expired entry if present
  if (cached) matchCache.delete(cacheKey);
  // Prune all expired entries periodically (every ~10 accesses)
  if (matchCache.size > 50) {
    const now = Date.now();
    for (const [k, v] of matchCache) {
      if (now >= v.expiresAt) matchCache.delete(k);
    }
  }

  // 3. Fetch team data
  let homeTeam: any, awayTeam: any, h2h: any = null;
  try {
    const [homeRes, awayRes] = await Promise.all([
      footballApi.teams.getById(homeId),
      footballApi.teams.getById(awayId),
    ]);
    if (!homeRes.success || !awayRes.success) {
      return Response.json({ error: "TEAM_NOT_FOUND", message: "球队数据获取失败" }, { status: 404 });
    }
    homeTeam = homeRes.data as any;
    awayTeam = awayRes.data as any;

    // Fetch head-to-head
    try {
      const h2hRes = await footballApi.teams.headToHead(homeId, awayId);
      if (h2hRes.success) h2h = h2hRes.data;
    } catch { /* H2H may not exist */ }
  } catch (err: any) {
    return Response.json({ error: "DATA_ERROR", message: err.message }, { status: 500 });
  }

  // Build fallback prediction
  const fallbackResult: MatchPredictionResult = buildFallbackPrediction(homeTeam, awayTeam, h2h);

  // 4. If AI not configured, return fallback
  if (!aiConfig.isConfigured) {
    return Response.json(fallbackResult);
  }

  // 5. Generate AI prediction
  try {
    const prompt = buildPrompt(homeTeam, awayTeam, h2h);

    const result = await generateText({
      model: aiConfig.provider!(aiConfig.model),
      system: SYSTEM_PROMPT,
      prompt,
      temperature: 0.6,
      maxOutputTokens: 2048,
    });

    const text = result.text.trim();
    const jsonStr = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
      else throw new Error("AI 返回格式异常");
    }

    const prediction: MatchPredictionResult = {
      homeTeam: { name: homeTeam.shortName || homeTeam.name, code: homeTeam.tla || "" },
      awayTeam: { name: awayTeam.shortName || awayTeam.name, code: awayTeam.tla || "" },
      winProbability: {
        home: parsed.winProbability?.home ?? fallbackResult.winProbability.home,
        draw: parsed.winProbability?.draw ?? fallbackResult.winProbability.draw,
        away: parsed.winProbability?.away ?? fallbackResult.winProbability.away,
      },
      predictedScore: {
        home: parsed.predictedScore?.home ?? fallbackResult.predictedScore.home,
        away: parsed.predictedScore?.away ?? fallbackResult.predictedScore.away,
      },
      analysis: {
        overview: parsed.analysis?.overview || "",
        keyPlayers: parsed.analysis?.keyPlayers || "",
        tacticalPreview: parsed.analysis?.tacticalPreview || "",
        riskFactors: parsed.analysis?.riskFactors || "",
      },
      headToHead: h2h ? {
        totalMatches: h2h.totalMatches || 0,
        homeWins: h2h.team1Wins || h2h.homeWins || 0,
        draws: h2h.draws || 0,
        awayWins: h2h.team2Wins || h2h.awayWins || 0,
        recentMatches: (h2h.recentMatches || []).slice(0, 5).map((m: any) => ({
          date: m.date || "",
          result: m.score || m.result || "",
        })),
      } : undefined,
      source: "ai",
      generatedAt: new Date().toISOString(),
    };

    matchCache.set(cacheKey, { data: prediction, expiresAt: Date.now() + 3600000 });
    return Response.json({ ...prediction, cached: false });
  } catch (err: any) {
    console.error("[predict-match] AI failed:", err.message);
    return Response.json(fallbackResult);
  }
}

// ---- Fallback: Rule-based prediction ----

function buildFallbackPrediction(homeTeam: any, awayTeam: any, h2h: any): MatchPredictionResult {
  const homeRank = (homeTeam as any).fifaRanking ?? 50;
  const awayRank = (awayTeam as any).fifaRanking ?? 50;
  const homeTitles = (homeTeam as any).worldCupTitles ?? 0;
  const awayTitles = (awayTeam as any).worldCupTitles ?? 0;

  // Score based on ranking difference + titles
  const rankDiff = awayRank - homeRank;
  const titleBonus = (homeTitles - awayTitles) * 3;
  const h2hBonus = h2h ? ((h2h.homeWins || h2h.team1Wins || 0) - (h2h.awayWins || h2h.team2Wins || 0)) * 2 : 0;
  const totalScore = rankDiff * 0.3 + titleBonus + h2hBonus;

  const homeProb = Math.round(Math.min(70, Math.max(15, 38 + totalScore)));
  const drawProb = Math.round(Math.min(30, Math.max(15, 28 - Math.abs(totalScore) * 0.3)));
  const awayProb = 100 - homeProb - drawProb;

  const homeGoals = Math.round(Math.max(0, 1.5 + totalScore * 0.05));
  const awayGoals = Math.round(Math.max(0, 1.2 - totalScore * 0.04));

  return {
    homeTeam: { name: homeTeam.shortName || homeTeam.name, code: homeTeam.tla || "" },
    awayTeam: { name: awayTeam.shortName || awayTeam.name, code: awayTeam.tla || "" },
    winProbability: { home: homeProb, draw: drawProb, away: awayProb },
    predictedScore: { home: homeGoals, away: awayGoals },
    analysis: {
      overview: `基于FIFA排名和近期数据的规则预测。${homeTeam.name}排名#${homeRank}，${awayTeam.name}排名#${awayRank}。配置AI_API_KEY后可获得AI深度分析。`,
      keyPlayers: "",
      tacticalPreview: "",
      riskFactors: "",
    },
    headToHead: h2h ? {
      totalMatches: h2h.totalMatches || 0,
      homeWins: h2h.team1Wins || h2h.homeWins || 0,
      draws: h2h.draws || 0,
      awayWins: h2h.team2Wins || h2h.awayWins || 0,
      recentMatches: [],
    } : undefined,
    source: "fallback",
    generatedAt: new Date().toISOString(),
  };
}
