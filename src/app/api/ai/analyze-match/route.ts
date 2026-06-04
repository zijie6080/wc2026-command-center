// ============================================================
//  POST /api/ai/analyze-match
//  Streaming SSE endpoint for AI match analysis
// ============================================================

import { NextRequest } from "next/server";
import { streamText } from "ai";
import { aiConfig } from "@/lib/ai-config";
import { analysisCache } from "@/lib/ai-cache";
import type { AnalysisSections } from "@/lib/ai-cache";
import {
  matchSummaryPrompt,
  keyEventsPrompt,
  bestPlayerPrompt,
  tacticalPrompt,
  hasEnoughData,
} from "@/lib/ai-prompts";

// ---- Section definitions ----
const SECTIONS = [
  { key: "summary" as const, label: "比赛总结", builder: matchSummaryPrompt, maxTokens: 600 },
  { key: "keyEvents" as const, label: "关键事件分析", builder: keyEventsPrompt, maxTokens: 500 },
  { key: "bestPlayer" as const, label: "最佳球员分析", builder: bestPlayerPrompt, maxTokens: 500 },
  { key: "tactical" as const, label: "战术分析", builder: tacticalPrompt, maxTokens: 500 },
];

export async function POST(request: NextRequest) {
  // 1. Check AI is configured
  if (!aiConfig.isConfigured) {
    return Response.json(
      {
        error: "AI_NOT_CONFIGURED",
        message:
          "请在 .env.local 中配置 AI_API_KEY 和 AI_BASE_URL 以启用 AI 分析功能",
      },
      { status: 503 },
    );
  }

  // 2. Parse request body
  let matchId: string;
  let match: any;
  try {
    const body = await request.json();
    matchId = body.matchId;
    match = body.match;
  } catch {
    return Response.json(
      { error: "INVALID_REQUEST", message: "请求格式错误" },
      { status: 400 },
    );
  }

  if (!matchId || !match) {
    return Response.json(
      { error: "MISSING_PARAMS", message: "缺少 matchId 或 match 数据" },
      { status: 400 },
    );
  }

  // 3. Check cache
  const cached = analysisCache.get(matchId);
  if (cached) {
    return Response.json({ sections: cached, cached: true });
  }

  // 4. Check data sufficiency
  if (!hasEnoughData(match)) {
    return Response.json(
      { error: "INSUFFICIENT_DATA", message: "暂无足够数据生成分析" },
      { status: 422 },
    );
  }

  // 5. Stream sections via SSE
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const accumulated: Partial<AnalysisSections> = {};
      const abortSignal = request.signal;

      function enqueue(event: string, data: unknown) {
        if (abortSignal.aborted) return;
        controller.enqueue(
          encoder.encode(
            `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
          ),
        );
      }

      try {
        for (const section of SECTIONS) {
          if (abortSignal.aborted) break;

          // Notify: section starting
          enqueue("section_start", { key: section.key, label: section.label });

          const { system, prompt } = section.builder(match);

          const result = streamText({
            model: aiConfig.provider!(aiConfig.model),
            system,
            prompt,
            temperature: 0.7,
            maxOutputTokens: section.maxTokens,
          });

          let sectionText = "";
          for await (const chunk of result.textStream) {
            if (abortSignal.aborted) break;
            sectionText += chunk;
            enqueue("token", { key: section.key, text: chunk });
          }

          accumulated[section.key] = sectionText;

          // Notify: section complete
          enqueue("section_end", { key: section.key, label: section.label });
        }

        // Cache the completed analysis
        if (
          accumulated.summary &&
          accumulated.keyEvents &&
          accumulated.bestPlayer &&
          accumulated.tactical
        ) {
          analysisCache.set(matchId, accumulated as AnalysisSections);
        }

        enqueue("done", {
          cached: false,
          cacheCount: analysisCache.size(),
        });
      } catch (err: any) {
        enqueue("error", {
          message: err.message || "AI 分析生成失败",
          code: err.name || "UNKNOWN",
        });
      } finally {
        if (!abortSignal.aborted) {
          controller.close();
        }
      }
    },
    cancel() {
      // Client disconnected — nothing to clean up
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
