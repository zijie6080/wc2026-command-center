// ============================================================
//  AI Prompt Templates — Chinese football analyst persona
// ============================================================

import type { ApiMatch } from "@/services/football-api/types";

// ---- Shared system prompt ----
const SYSTEM_PROMPT = `你是一位资深的中文足球评论员，曾为《体坛周报》和央视体育频道撰稿。
你的写作风格：专业但不枯燥，富有激情但客观公正，善于捕捉比赛细节和战术变化。
请使用流畅自然的中文，像一位在现场观赛的资深记者一样描述分析。
不要使用任何英文词汇（除非是球员名字或专业术语如xG、VAR）。
请直接输出分析内容，不要使用标题或前缀。`;

// ---- Build compact match data context for prompts ----
function buildMatchContext(match: ApiMatch): string {
  const homeName = match.homeTeam?.shortName || match.homeTeam?.name || "主队";
  const awayName = match.awayTeam?.shortName || match.awayTeam?.name || "客队";
  const s = match.score as any;
  const ft = s?.fullTime || s?.ft;
  const ht = s?.halfTime || s?.ht;
  const ftStr =
    ft && ft.home != null
      ? `${ft.home ?? 0}:${ft.away ?? 0}`
      : "? : ?";
  const htStr =
    ht && ht.home != null
      ? `(${ht.home ?? 0}:${ht.away ?? 0})`
      : "";

  const events = (match.events || []).slice(0, 30); // Cap at 30 events
  const eventsStr = events
    .map((e) => {
      const pName = e.player?.name || "";
      const assist = e.assistBy?.name ? ` (助攻: ${e.assistBy.name})` : "";
      const detail = e.detail ? ` [${e.detail}]` : "";
      const min = e.injuryMinute ? `${e.minute}'+${e.injuryMinute}` : `${e.minute}'`;
      const typeCN =
        e.type === "goal"
          ? "进球"
          : e.type === "penalty_goal"
            ? "点球进球"
            : e.type === "own_goal"
              ? "乌龙球"
              : e.type === "yellow_card"
                ? "黄牌"
                : e.type === "red_card"
                  ? "红牌"
                  : e.type === "substitution"
                    ? "换人"
                    : e.type === "var_review"
                      ? "VAR回看"
                      : e.type;
      return `  ${min} ${typeCN} - ${pName}(${e.team === "home" ? homeName : awayName})${assist}${detail}`;
    })
    .join("\n");

  const stats = match.stats as any;
  let statsStr = "";
  if (stats) {
    const h = stats.home || stats;
    const a = stats.away;
    if (h && a) {
      statsStr = [
        `控球率: ${homeName} ${h.possession ?? "?"}% - ${awayName} ${a.possession ?? "?"}%`,
        `射门: ${homeName} ${h.shots?.total ?? "?"} (射正 ${h.shots?.onTarget ?? "?"}) - ${awayName} ${a.shots?.total ?? "?"} (射正 ${a.shots?.onTarget ?? "?"})`,
        `xG(预期进球): ${homeName} ${h.xG ?? "?"} - ${awayName} ${a.xG ?? "?"}`,
        `传球: ${homeName} ${h.passes?.total ?? "?"} (成功率 ${h.passes?.accuracy ?? "?"}%) - ${awayName} ${a.passes?.total ?? "?"} (成功率 ${a.passes?.accuracy ?? "?"}%)`,
        `角球: ${homeName} ${h.corners ?? "?"} - ${awayName} ${a.corners ?? "?"}`,
        `黄牌: ${homeName} ${h.cards?.yellow ?? "?"} - ${awayName} ${a.cards?.yellow ?? "?"}`,
        `红牌: ${homeName} ${h.cards?.red ?? "?"} - ${awayName} ${a.cards?.red ?? "?"}`,
      ].join("\n");
    }
  }

  return `比赛: ${homeName} vs ${awayName}
最终比分: ${ftStr} 半场比分: ${htStr}
赛事阶段: ${match.group ? match.group + "组" : ""} ${match.roundLabel || match.tournamentPhase || ""}
球场: ${match.venue?.name || "未知"}

比赛事件:
${eventsStr || "无事件数据"}

技术统计:
${statsStr || "无统计数据"}`;
}

// ---- Prompt builders ----

export function matchSummaryPrompt(match: ApiMatch): {
  system: string;
  prompt: string;
} {
  const ctx = buildMatchContext(match);
  return {
    system: SYSTEM_PROMPT,
    prompt: `${ctx}

请用2-3段话总结这场比赛：
第一段：概括比赛过程和最终结果，描述比赛的节奏和基调。
第二段：分析双方表现差异，哪支球队控制了比赛，为什么。
第三段：指出比赛的转折点或最关键的数据统计。

> 要求：像赛后新闻报道一样流畅自然，200-300字。`,
  };
}

export function keyEventsPrompt(match: ApiMatch): {
  system: string;
  prompt: string;
} {
  const ctx = buildMatchContext(match);
  return {
    system: SYSTEM_PROMPT,
    prompt: `${ctx}

请分析这场比赛的关键转折事件。
重点分析：
1. 每个进球是如何发生的，对比赛走势的影响
2. 红黄牌对球队战术和士气的影响
3. 关键的VAR判罚或争议
4. 重要的换人调整及其效果

> 要求：用连贯的叙事串联这些事件，像赛后的深度分析文章，200-300字。`,
  };
}

export function bestPlayerPrompt(match: ApiMatch): {
  system: string;
  prompt: string;
} {
  const ctx = buildMatchContext(match);
  return {
    system: SYSTEM_PROMPT,
    prompt: `${ctx}

请选出本场比赛表现最出色的球员（可以是进球者、助攻者或防守核心）。
分析要求：
1. 明确写出该球员的名字和他的关键数据贡献
2. 分析他在比赛中的具体表现（进球、助攻、关键传球、抢断等）
3. 说明他在球队战术体系中的核心作用
4. 如果有多位候选者，简要对比后说明你的选择理由

> 要求：用具体数据支撑观点，像专业球评，150-250字。`,
  };
}

export function tacticalPrompt(match: ApiMatch): {
  system: string;
  prompt: string;
} {
  const ctx = buildMatchContext(match);
  return {
    system: SYSTEM_PROMPT,
    prompt: `${ctx}

请分析这场比赛的战术层面：
1. 双方的大致阵型布置和比赛策略
2. 进攻套路的分析（边路突破、中路渗透、定位球战术等）
3. 防守组织的特点（高位逼抢还是低位防守）
4. 教练的关键战术调整和换人带来的变化
利用控球率、传球、xG等数据来支撑你的分析。

> 要求：专业但不晦涩，让球迷能看懂战术细节，200-300字。`,
  };
}

// ---- Prompt for determining if there's enough data ----
export function hasEnoughData(match: ApiMatch): boolean {
  const hasScore =
    ((match.score?.fullTime || match.score?.ft) &&
      (match.score?.fullTime?.home != null || (match.score as any)?.ft?.home != null)) ||
    ((match.score?.halfTime || match.score?.ht) &&
      (match.score?.halfTime?.home != null || (match.score as any)?.ht?.home != null));
  const hasEvents = (match.events || []).length > 0;
  const hasStats = match.stats != null;
  return hasScore || hasEvents || hasStats;
}
