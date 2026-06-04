// ============================================================
//  AI Prediction Prompts — Championship Probability Analysis
// ============================================================

import type { AggregatedPredictionData, TeamPredictionData } from "@/services/prediction-service";

// ---- System Prompt ----

const SYSTEM_PROMPT = `你是一位世界顶级的足球数据分析师，拥有20年以上的足球预测经验。

你的分析方法结合了：
1. 球队 FIFA 排名及排名变化趋势
2. 球队历史世界杯表现（夺冠次数、最佳成绩、参赛次数）
3. 近期比赛状态（近5场胜负，W=胜 D=平 L=负）
4. 小组积分榜表现（积分、净胜球）
5. 所在大洲的竞争水平（欧洲和南美球队历史表现更优）
6. 所在小组的竞争强度

你需要基于以上多维数据，为2026年世界杯的48支参赛球队生成科学的夺冠概率排名。

关键约束：
- 48支球队的概率总和必须恰好等于 100%
- 前3名合计应在 35-50% 之间
- 前10名合计应在 75-85% 之间
- 每支球队的概率最多保留1位小数
- 黑马球队（排名较低但状态好）应有合理的概率空间
- 排名靠后的球队不要给0%，至少保留0.1%

输出格式：只输出纯JSON，不要有任何markdown标记或解释文字。`;

// ---- Data formatting ----

function formatTeamData(teams: TeamPredictionData[], limit = 48): string {
  const sorted = [...teams]
    .filter((t) => t.fifaRanking != null)
    .sort((a, b) => (a.fifaRanking ?? 999) - (b.fifaRanking ?? 999));

  return sorted
    .slice(0, limit)
    .map((t) => {
      const groupInfo = t.groupStandings
        ? `${t.groupLetter}组 第${t.groupStandings.position}名 ${t.groupStandings.played}场${t.groupStandings.won}胜${t.groupStandings.drawn}平${t.groupStandings.lost}负 积${t.groupStandings.points}分 GD${t.groupStandings.goalDifference >= 0 ? "+" : ""}${t.groupStandings.goalDifference}`
        : `${t.groupLetter}组(未开赛)`;

      const rankChange =
        t.fifaRankingPrevious != null && t.fifaRanking != null
          ? t.fifaRankingPrevious - t.fifaRanking > 0
            ? `↑${t.fifaRankingPrevious - t.fifaRanking}`
            : t.fifaRankingPrevious - t.fifaRanking < 0
              ? `↓${t.fifaRanking - t.fifaRankingPrevious}`
              : "→"
          : "";

      return `${t.shortName}(${t.tla}) | FIFA#${t.fifaRanking ?? "?"} ${rankChange} | ${t.confederation} | 夺冠${t.worldCupTitles}次 | 最佳:${t.bestResult} | ${groupInfo} | 近5场:${t.recentForm}`;
    })
    .join("\n");
}

function formatGroupSummary(data: AggregatedPredictionData): string {
  return data.groups
    .map((g) => {
      const teamList = g.teams
        .sort((a, b) => b.points - a.points)
        .map((t) => `${t.name}(${t.tla} ${t.points}分)`)
        .join(" ");
      return `${g.letter}组: ${teamList}`;
    })
    .join("\n");
}

// ---- Prompt builder ----

export function buildPredictionPrompt(
  data: AggregatedPredictionData,
): { system: string; prompt: string } {
  const teamsText = formatTeamData(data.teams, 48);
  const groupsText = formatGroupSummary(data);

  const userPrompt = `请基于以下2026世界杯48支参赛球队的详细数据，生成夺冠概率分析和排名。

赛事概况：
- 总球队：48支
- 平均FIFA排名：#${data.summary.avgFifaRanking}
- 历史冠军总数：${data.summary.totalWorldCupTitles}次
- 大洲分布：${Object.entries(data.summary.confederations).map(([k, v]) => `${k}${v}队`).join(" ")}

小组形势：
${groupsText}

球队数据：
${teamsText}

请输出一个JSON对象，格式如下：
{
  "rankings": [
    {
      "rank": 1,
      "team": "Argentina",
      "code": "ARG",
      "probability": 18.5,
      "trend": "up",
      "change": 2.1,
      "reasoning": "卫冕冠军，梅西带队，FIFA排名第1，近5场全胜"
    }
  ],
  "analysis": {
    "favorites": "夺冠热门分析（200-300字）：深度分析排名前5球队的夺冠前景，包括阵容优势、战术特点、赛程路径。",
    "darkHorses": "黑马球队分析（150-250字）：识别排名10-25名中可能创造惊喜的3-5支球队，说明原因。",
    "groupStage": "小组出线形势分析（200-250字）：分析死亡之组、各小组出线热门、潜在冷门。",
    "keyFactors": "关键夺冠因素（150-200字）：总结决定本届冠军归属的核心要素。"
  },
  "generatedAt": "${data.generatedAt}"
}

要求：
- rankings数组必须包含全部48支球队
- 所有概率之和必须精确等于100.0
- reasoning用中文简要说明排名依据（15-30字）
- trend用"up"/"down"/"stable"表示趋势
- change是相对于世界杯开幕前的概率变化（正数表示上升）
- analysis四段均用流畅自然的中文撰写
- 直接输出JSON，不要任何markdown标记`;

  return { system: SYSTEM_PROMPT, prompt: userPrompt };
}
