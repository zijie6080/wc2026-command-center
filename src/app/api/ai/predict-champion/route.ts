// ============================================================
//  POST /api/ai/predict-champion
//  Returns JSON with AI-generated championship rankings + analysis
// ============================================================

import { NextRequest } from "next/server";
import { generateText } from "ai";
import { aiConfig } from "@/lib/ai-config";
import { buildPredictionPrompt } from "@/lib/ai-prediction-prompts";
import { predictionService } from "@/services/prediction-service";

// ---- Types ----

export interface PredictionResult {
  rankings: {
    rank: number;
    team: string;
    code: string;
    probability: number;
    trend: "up" | "down" | "stable";
    change: number;
    reasoning: string;
  }[];
  analysis: {
    favorites: string;
    darkHorses: string;
    groupStage: string;
    keyFactors: string;
  };
  generatedAt: string;
  source: "ai" | "fallback";
}

// ---- 24h cache ----

const predictionCache = new Map<string, { data: PredictionResult; expiresAt: number }>();

async function fallbackPrediction() {
  try {
    const data = await predictionService.aggregateAllData();
    const rankings = predictionService.generateFallbackRankings(data);
    return Response.json({
      rankings,
      analysis: {
        favorites: "AI 未配置。配置 AI_API_KEY 后可使用 AI 深度分析。",
        darkHorses: "", groupStage: "", keyFactors: "",
      },
      generatedAt: data.generatedAt,
      source: "fallback",
    } as PredictionResult);
  } catch (err: any) {
    return Response.json(
      { error: "DATA_ERROR", message: err.message || "数据加载失败" },
      { status: 500 },
    );
  }
}

export async function POST(_request: NextRequest) {
  // 1. Check AI is configured
  if (!aiConfig.isConfigured) {
    return fallbackPrediction();
  }

  // 2. Check cache (24h TTL)
  const cached = predictionCache.get("latest");
  if (cached && Date.now() < cached.expiresAt) {
    return Response.json({ ...cached.data, cached: true });
  }

  // 3. Aggregate data
  let data;
  try {
    data = await predictionService.aggregateAllData();
  } catch (err: any) {
    console.error("[predict-champion] Data error:", err.message);
    return fallbackPrediction();
  }

  // 4. Generate AI analysis
  try {
    const { system, prompt } = buildPredictionPrompt(data);

    const result = await generateText({
      model: aiConfig.provider!(aiConfig.model),
      system,
      prompt,
      temperature: 0.5,
      maxOutputTokens: 4096,
    });

    // Parse the AI response as JSON
    let parsed: any;
    const text = result.text.trim();

    // Strip markdown code fences if present
    const jsonStr = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      // Try to extract JSON from the text
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("AI 返回格式异常，无法解析 JSON");
      }
    }

    // Validate and normalize the response
    if (!parsed.rankings || !Array.isArray(parsed.rankings)) {
      throw new Error("AI 返回数据缺少 rankings 字段");
    }

    // Ensure all 48 teams exist
    // If AI missed some teams due to token limits, fill from fallback
    if (parsed.rankings.length < 48) {
      const fallback = predictionService.generateFallbackRankings(data);
      const existingCodes = new Set(parsed.rankings.map((r: any) => r.code));
      const missing = fallback.filter((r) => !existingCodes.has(r.code));
      parsed.rankings.push(...missing);
      // Re-sort by probability
      parsed.rankings.sort((a: any, b: any) => b.probability - a.probability);
      parsed.rankings.forEach((r: any, i: number) => (r.rank = i + 1));
    }

    const finalResult: PredictionResult = {
      rankings: parsed.rankings.map((r: any) => ({
        rank: r.rank,
        team: r.team,
        code: r.code,
        probability: r.probability,
        trend: r.trend || "stable",
        change: r.change || 0,
        reasoning: r.reasoning || "",
      })),
      analysis: {
        favorites: parsed.analysis?.favorites || "",
        darkHorses: parsed.analysis?.darkHorses || "",
        groupStage: parsed.analysis?.groupStage || "",
        keyFactors: parsed.analysis?.keyFactors || "",
      },
      generatedAt: parsed.generatedAt || data.generatedAt,
      source: "ai",
    };

    // Cache for 24 hours
    predictionCache.set("latest", {
      data: finalResult,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    return Response.json({ ...finalResult, cached: false });
  } catch (err: any) {
    console.error("[predict-champion] AI failed:", err.message);
    return fallbackPrediction();
  }
}

// Allow manual cache invalidation
export async function DELETE() {
  predictionCache.delete("latest");
  predictionService.invalidateCache();
  return Response.json({ ok: true, message: "预测缓存已清除" });
}
