// ============================================================
//  AI Configuration — Server-side only (no NEXT_PUBLIC_ vars)
// ============================================================

import { createOpenAI } from "@ai-sdk/openai";

export interface AiConfig {
  isConfigured: boolean;
  model: string;
  provider: ReturnType<typeof createOpenAI> | null;
}

function buildConfig(): AiConfig {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    return { isConfigured: false, model: "", provider: null };
  }

  const baseURL = process.env.AI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.AI_MODEL || "gpt-4o-mini";

  const provider = createOpenAI({ baseURL, apiKey });

  return { isConfigured: true, model, provider };
}

export const aiConfig: AiConfig = buildConfig();
