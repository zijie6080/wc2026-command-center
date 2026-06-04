# 核心表设计 — Teams · Players · Matches

> **设计范围:** 仅 Teams、Players、Matches 三张表
> **设计依据:** 基于已确定的 29 个数据实体 + 10 个页面原型
> **版本:** v1.0 / 2026-06-04

---

## 一、Teams（球队表）

存储 48 支参赛国家队的核心信息，支撑国家队详情页、积分榜、赛程、收藏等功能。

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `id` | String(36) | ✅ 必填 | 球队唯一标识，UUID |
| `fifa_code` | String(3) | ✅ 必填 | FIFA 三字母国家代码，如 ARG、BRA、FRA，全局唯一 |
| `name_en` | String(60) | ✅ 必填 | 球队英文全称，如 Argentina National Football Team |
| `name_cn` | String(60) | ✅ 必填 | 球队中文全称，如 阿根廷国家足球队 |
| `short_name` | String(20) | ✅ 必填 | 球队简称，如 Argentina / 阿根廷，用于卡片和列表展示 |
| `nickname` | String(40) | 否 | 球队昵称，如 Albiceleste / 蓝白军团 |
| `confederation` | String(10) | ✅ 必填 | 所属洲际足联，枚举值：UEFA / CONMEBOL / CONCACAF / CAF / AFC / OFC |
| `flag_url` | String(255) | ✅ 必填 | 国旗图片 URL（圆形裁剪，32×32px） |
| `crest_url` | String(255) | ✅ 必填 | 足协队徽矢量图 URL（64×64px） |
| `fifa_ranking` | Integer | ✅ 必填 | 当前 FIFA 世界排名（1-211），随 FIFA 官方更新 |
| `fifa_ranking_previous` | Integer | 否 | 上一期 FIFA 排名，用于计算排名变化趋势箭头 |
| `group_letter` | String(1) | 否 | 所属小组字母，A-L，淘汰赛后保留（用于历史查询） |
| `coach_name` | String(80) | ✅ 必填 | 主教练姓名（英文全名），如 Lionel Scaloni |
| `coach_name_cn` | String(40) | 否 | 主教练中文名 |
| `captain_player_id` | String(36) | 否 | 队长球员 ID，关联 Players 表 |
| `world_cup_appearances` | Integer | ✅ 必填 | 世界杯历史参赛次数（含本届） |
| `world_cup_titles` | Integer | ✅ 必填 | 世界杯夺冠次数 |
| `best_result` | String(40) | ✅ 必填 | 世界杯历史最佳战绩，如 Winner (1978, 1986, 2022) / Runner-up (2014) |
| `primary_color` | String(7) | ✅ 必填 | 球队主色调，Hex 颜色码，如 #75AADB（阿根廷蓝），用于 UI 背景渐变 |
| `secondary_color` | String(7) | 否 | 球队辅色调，Hex 颜色码 |
| `home_venue` | String(100) | 否 | 本届世界杯主要比赛场馆（大本营），如 MetLife Stadium |
| `preparation_results` | String(500) | 否 | 赛前热身赛战绩摘要，格式 JSON 数组 |
| `status` | String(20) | ✅ 必填 | 球队在本届赛事中的状态，枚举值：active（存活）/ eliminated（已淘汰）/ champion（已夺冠） |
| `elimination_stage` | String(30) | 否 | 如已淘汰，记录淘汰阶段，如 Group Stage / Round of 16 / Quarter-Final |
| `qualification_method` | String(60) | 否 | 晋级本届世界杯的方式，如 CONMEBOL Qualifiers - 2nd Place |
| `created_at` | DateTime | ✅ 必填 | 记录创建时间（UTC） |
| `updated_at` | DateTime | ✅ 必填 | 记录最后更新时间（UTC），排名/状态变化时更新 |

---

## 二、Players（球员表）

存储 832 名参赛球员的核心信息，支撑球员详情页、阵容展示、球员评分、统计数据等功能。

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `id` | String(36) | ✅ 必填 | 球员唯一标识，UUID |
| `team_id` | String(36) | ✅ 必填 | 所属国家队 ID，关联 Teams 表 |
| `first_name` | String(40) | ✅ 必填 | 球员名（英文），如 Lionel |
| `last_name` | String(40) | ✅ 必填 | 球员姓（英文），如 Messi |
| `display_name` | String(80) | ✅ 必填 | 球员全名，如 Lionel Messi，用于卡片和搜索 |
| `display_name_cn` | String(40) | 否 | 球员中文名，如 莱昂内尔·梅西 |
| `jersey_number` | Integer | ✅ 必填 | 球衣号码（1-99），同一球队内唯一 |
| `position` | String(10) | ✅ 必填 | 场上位置，枚举值：GK（门将）/ DEF（后卫）/ MID（中场）/ FWD（前锋） |
| `position_detail` | String(20) | 否 | 细化位置，如 Center-Back / Defensive Midfielder / Right Winger |
| `date_of_birth` | Date | ✅ 必填 | 出生日期 |
| `age` | Integer | ✅ 必填 | 当前年龄（岁），由 date_of_birth 计算，方便查询 |
| `height_cm` | Integer | 否 | 身高（厘米），如 170 |
| `weight_kg` | Integer | 否 | 体重（公斤），如 72 |
| `preferred_foot` | String(5) | 否 | 惯用脚，枚举值：Left / Right / Both |
| `nationality` | String(3) | ✅ 必填 | 国籍 FIFA 代码，通常与所属球队一致（归化球员可能不同） |
| `club_team` | String(80) | ✅ 必填 | 当前俱乐部，如 Inter Miami CF |
| `club_league` | String(60) | 否 | 俱乐部所在联赛，如 Major League Soccer |
| `market_value_eur` | Integer | 否 | 市场身价（欧元），如 35000000 |
| `international_caps` | Integer | ✅ 必填 | 国家队出场次数（截至本届赛事前） |
| `international_goals` | Integer | ✅ 必填 | 国家队进球数（截至本届赛事前） |
| `world_cup_appearances` | Integer | 否 | 世界杯历史出场次数（含往届），如 26 |
| `world_cup_goals` | Integer | 否 | 世界杯历史总进球数（含往届），如 13 |
| `photo_url` | String(255) | ✅ 必填 | 球员半身照 URL（180×240px），比赛期间抓拍 |
| `is_captain` | Boolean | ✅ 必填 | 是否为球队队长，默认 false。每队有且仅有 1 名队长 |
| `is_vice_captain` | Boolean | 否 | 是否为副队长 |
| `ability_radar` | String(500) | 否 | 八维能力雷达图数据，JSON 格式：{shooting:92, passing:88, dribbling:95, speed:78, defense:35, physical:72, creativity:96, leadership:90} |
| `status` | String(20) | ✅ 必填 | 球员当前状态，枚举值：active（正常）/ injured（伤病）/ suspended（停赛）/ doubtful（出战成疑） |
| `injury_detail` | String(200) | 否 | 伤病详情，如 Hamstring strain - Expected return: June 15 |
| `yellow_cards_accumulated` | Integer | ✅ 必填 | 本届赛事累计黄牌数（用于停赛风险计算），默认 0 |
| `red_cards` | Integer | ✅ 必填 | 本届赛事累计红牌数，默认 0 |
| `created_at` | DateTime | ✅ 必填 | 记录创建时间（UTC） |
| `updated_at` | DateTime | ✅ 必填 | 记录最后更新时间（UTC） |

---

## 三、Matches（比赛表）

存储全部 104 场比赛的核心信息，支撑比赛详情页（赛前/赛中/赛后三态）、比赛中心、赛程中心、历史比赛页面。

### 3.1 比赛标识与阶段

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `id` | String(36) | ✅ 必填 | 比赛唯一标识，UUID |
| `match_number` | Integer | ✅ 必填 | 官方比赛编号 1-104，由 FIFA 赛程确定，全局唯一 |
| `tournament_phase` | String(20) | ✅ 必填 | 赛事阶段，枚举值：group_stage（小组赛）/ round_of_32（1/16决赛）/ round_of_16（1/8决赛）/ quarter_final（1/4决赛）/ semi_final（半决赛）/ third_place（三四名决赛）/ final（决赛） |
| `group_letter` | String(1) | 否 | 小组字母 A-L，仅小组赛阶段有值，淘汰赛阶段为 null |
| `matchday` | Integer | ✅ 必填 | 比赛日轮次编号，小组赛为 1-3，淘汰赛随轮次递增 |
| `round_label` | String(30) | ✅ 必填 | 可读的轮次描述，如 Group Stage - Matchday 1 / Round of 16 |

### 3.2 时间与场馆

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `match_date` | Date | ✅ 必填 | 比赛日期（本地时区），如 2026-06-04 |
| `kickoff_time` | Time | ✅ 必填 | 开球时间（本地时区），如 19:00:00 |
| `kickoff_time_utc` | DateTime | ✅ 必填 | 开球时间（UTC），用于全球同步和倒计时计算 |
| `venue_name` | String(100) | ✅ 必填 | 比赛场馆名称，如 MetLife Stadium |
| `venue_city` | String(60) | ✅ 必填 | 场馆所在城市，如 New York / New Jersey |
| `venue_capacity` | Integer | 否 | 场馆容量 |
| `venue_timezone` | String(40) | ✅ 必填 | 场馆所在时区，如 America/New_York |

### 3.3 对阵双方

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `home_team_id` | String(36) | ✅ 必填 | 主队 ID，关联 Teams 表 |
| `away_team_id` | String(36) | ✅ 必填 | 客队 ID，关联 Teams 表 |
| `home_team_label` | String(10) | 否 | 赛程表上的主队标签，如 H1 / A2（小组赛），1A / 2B（淘汰赛待定），用于晋级图展示 |

### 3.4 比分（支持所有比赛结果场景）

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `score_ht_home` | Integer | 否 | 半场主队进球数，比赛开始后才有值 |
| `score_ht_away` | Integer | 否 | 半场客队进球数 |
| `score_ft_home` | Integer | 否 | 全场主队进球数（90分钟常规时间） |
| `score_ft_away` | Integer | 否 | 全场客队进球数（90分钟常规时间） |
| `score_et_home` | Integer | 否 | 加时赛后主队进球数，仅淘汰赛加时有效 |
| `score_et_away` | Integer | 否 | 加时赛后客队进球数，仅淘汰赛加时有效 |
| `penalties_home` | Integer | 否 | 点球大战主队得分，仅点球大战有效 |
| `penalties_away` | Integer | 否 | 点球大战客队得分，仅点球大战有效 |
| `final_score_home` | Integer | 否 | 最终主队得分（含加时+点球决胜），用于列表排序和积分计算 |
| `final_score_away` | Integer | 否 | 最终客队得分 |

### 3.5 比赛状态与时间控制

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `status` | String(20) | ✅ 必填 | 比赛状态，枚举值：upcoming（未开始）/ first_half（上半场）/ half_time（中场休息）/ second_half（下半场）/ extra_time_first（加时上半场）/ extra_time_second（加时下半场）/ penalties（点球大战）/ finished（已结束）/ postponed（延期）/ cancelled（取消） |
| `current_minute` | Integer | 否 | 当前比赛分钟数（0-120+），赛中实时更新，赛后冻结 |
| `current_second` | Integer | 否 | 当前比赛秒数（0-59），支持比赛时钟精确到秒 |
| `injury_time_first_half` | Integer | 否 | 上半场伤停补时分钟数，裁判举牌后填写 |
| `injury_time_second_half` | Integer | 否 | 下半场伤停补时分钟数 |
| `actual_start_time` | DateTime | 否 | 实际开球时间（UTC），如因故延迟开球则与 kickoff_time_utc 不同 |
| `actual_end_time` | DateTime | 否 | 实际比赛结束时间（UTC） |

### 3.6 场馆环境与上座

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `attendance` | Integer | 否 | 实际上座人数，比赛结束后填写 |
| `weather_condition` | String(30) | 否 | 天气状况，如 Clear / Cloudy / Rain / Thunderstorm |
| `temperature_celsius` | Integer | 否 | 温度（摄氏度），如 28 |
| `humidity_percent` | Integer | 否 | 湿度百分比，如 70 |

### 3.7 裁判与转播

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `referee_name` | String(80) | 否 | 主裁判姓名，如 Michael Oliver |
| `referee_nationality` | String(3) | 否 | 主裁判国籍 FIFA 代码，如 ENG |
| `broadcasters` | String(500) | 否 | 主要转播商列表，JSON 数组格式，如 ["FOX","BBC","CCTV-5"] |

### 3.8 标记与分类

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `is_featured` | Boolean | ✅ 必填 | 是否为焦点战（⚡标记），由编辑团队标记。焦点战在首页 Hero、赛程列表等处视觉突出展示 |
| `is_derby` | Boolean | 否 | 是否为德比/世仇对决，如 Argentina vs Brazil |
| `tags` | String(300) | 否 | 比赛标签，JSON 数组，如 ["梅西告别战","小组出线关键战"] |
| `pre_match_preview` | String(36) | 否 | 赛前前瞻文章 ID，关联 Article 实体 |
| `post_match_report` | String(36) | 否 | 赛后战报文章 ID，关联 Article 实体 |
| `highlights_url` | String(255) | 否 | 比赛集锦视频 URL |
| `full_replay_url` | String(255) | 否 | 全场回放视频 URL（V2.0） |
| `created_at` | DateTime | ✅ 必填 | 记录创建时间（UTC），通常在赛程公布时就创建 |
| `updated_at` | DateTime | ✅ 必填 | 记录最后更新时间（UTC），赛中高频更新 |

---

## 四、三表关系图

```
┌──────────┐               ┌──────────┐
│  Teams   │               │  Teams   │
│ (主队)   │               │ (客队)   │
└────┬─────┘               └────┬─────┘
     │                          │
     │ home_team_id             │ away_team_id
     │                          │
     │     ┌────────────────┐   │
     └─────▶    Matches     ◀───┘
           └───────┬────────┘
                   │
                   │ (通过 Squad 中间表间接关联)
                   │
           ┌───────┴────────┐
           │    Players     │
           └───────┬────────┘
                   │
                   │ team_id
                   │
           ┌───────┴────────┐
           │     Teams      │
           │  (所属国家队)   │
           └────────────────┘
```

```
Teams  1 ──── N  Players        (一支球队拥有 26 名球员)
Teams  1 ──── N  Matches(主)    (一支球队作为主队参与多场比赛)
Teams  1 ──── N  Matches(客)    (一支球队作为客队参与多场比赛)
```

**注意：** Players 与 Matches 之间不是直接外键关系，而是通过 Squad（阵容中间表）关联 —— 一场比赛有哪些球员上场、首发/替补、上场分钟等。但本设计限定三表，故暂不展开 Squad。

---

## 五、字段分组速览

```
┌─────────────┬──────────────────────────────────────────────────────┐
│    表       │ 字段分组                                             │
├─────────────┼──────────────────────────────────────────────────────┤
│   Teams     │ 身份(6) │ 排名(2) │ 所属(2) │ 教练队长(4) │          │
│   20字段     │ 历史(3) │ 视觉(3) │ 状态(3) │ 元数据(2)     │          │
├─────────────┼──────────────────────────────────────────────────────┤
│   Players   │ 身份(8) │ 身体(4) │ 俱乐部(3) │ 国家队(5) │           │
│   26字段     │ 能力(2) │ 状态(3) │ 纪律(2) │ 元数据(2)    │           │
├─────────────┼──────────────────────────────────────────────────────┤
│   Matches   │ 标识&阶段(6) │ 时间&场馆(6) │ 对阵(3) │ 比分(10)       │
│   36字段     │ 状态&时间(7) │ 环境(4) │ 裁判&转播(3) │ 标记(7) │ 元数据(2) │
└─────────────┴──────────────────────────────────────────────────────┘
```

---

> **文档结束。** 本设计仅覆盖 Teams · Players · Matches 三张核心表，其余 26 个实体的表结构不在本文档范围内。
