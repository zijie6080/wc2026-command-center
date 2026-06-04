# 统计表设计 — PlayerStats · MatchStats · TeamStats

> **设计范围:** 仅 PlayerStats、MatchStats、TeamStats 三张表
> **设计依据:** 比赛详情页数据面板 + 球员详情页 + 球队数据页 + AI 分析中心
> **版本:** v1.0 / 2026-06-04

---

## 一、PlayerStats（球员比赛统计表）

### 1.1 表定位

记录 **一名球员在一场比赛中的全部个人表现数据**。这是球员评分计算、球员详情页"比赛日志"标签、球员排行榜的原始数据源。

一场比赛约产生 30-36 条记录（双方上场球员各 11 首发 + 若干替补）。

### 1.2 基础关联

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `id` | String(36) | ✅ 必填 | 记录唯一标识，UUID |
| `player_id` | String(36) | ✅ 必填 | 球员 ID，关联 Players 表 |
| `match_id` | String(36) | ✅ 必填 | 比赛 ID，关联 Matches 表 |
| `team_id` | String(36) | ✅ 必填 | 所属球队 ID，关联 Teams 表。冗余字段，加速按球队聚合查询 |
| `is_starter` | Boolean | ✅ 必填 | 是否首发（true=首发11人，false=替补登场） |
| `minutes_played` | Integer | ✅ 必填 | 实际上场分钟数。首发被换下≈60-90，替补登场≈15-30，打满全场=90(加时=120) |
| `substituted_in_minute` | Integer | 否 | 替补上场分钟数，首发为 null |
| `substituted_out_minute` | Integer | 否 | 被换下分钟数，打满全场为 null |

### 1.3 进攻数据

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `goals` | Integer | ✅ 必填 | 进球数（不含点球大战），默认 0 |
| `penalty_goals` | Integer | ✅ 必填 | 点球进球数（常规时间+加时赛中的点球），默认 0 |
| `own_goals` | Integer | ✅ 必填 | 乌龙球数，默认 0 |
| `assists` | Integer | ✅ 必填 | 助攻数，默认 0 |
| `shots` | Integer | ✅ 必填 | 射门总次数，默认 0 |
| `shots_on_target` | Integer | ✅ 必填 | 射正次数，默认 0 |
| `shots_off_target` | Integer | ✅ 必填 | 射偏次数，默认 0 |
| `shots_blocked` | Integer | ✅ 必填 | 射门被封堵次数，默认 0 |
| `shot_woodwork` | Integer | 否 | 击中门框次数（横梁/立柱） |
| `xG` | Decimal(6,4) | ✅ 必填 | 个人累计预期进球值（Expected Goals），如 1.4200 |
| `xG_open_play` | Decimal(6,4) | 否 | 运动战 xG（不含点球） |
| `key_passes` | Integer | ✅ 必填 | 关键传球次数（导致射门的传球），默认 0 |
| `big_chances_created` | Integer | 否 | 创造的绝佳机会次数 |
| `big_chances_missed` | Integer | 否 | 错失的绝佳机会次数 |
| `successful_dribbles` | Integer | ✅ 必填 | 成功过人次数，默认 0 |
| `attempted_dribbles` | Integer | ✅ 必填 | 尝试过人次数，0 表示无尝试 |
| `dribble_success_rate` | Decimal(5,2) | 否 | 过人成功率（百分比），由 successful/attempted 计算 |
| `fouls_won` | Integer | ✅ 必填 | 被犯规次数（造成对方犯规），默认 0 |
| `offsides` | Integer | ✅ 必填 | 越位次数，默认 0 |
| `penalties_won` | Integer | 否 | 制造点球次数 |

### 1.4 传球数据

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `total_passes` | Integer | ✅ 必填 | 传球总次数，默认 0 |
| `accurate_passes` | Integer | ✅ 必填 | 传球成功次数，默认 0 |
| `pass_accuracy` | Decimal(5,2) | 否 | 传球成功率（百分比），由 accurate/total 计算 |
| `long_balls` | Integer | 否 | 长传次数 |
| `accurate_long_balls` | Integer | 否 | 长传成功次数 |
| `crosses` | Integer | 否 | 传中次数 |
| `accurate_crosses` | Integer | 否 | 传中成功次数 |
| `through_balls` | Integer | 否 | 直塞球次数 |
| `accurate_through_balls` | Integer | 否 | 直塞球成功次数 |

### 1.5 防守数据

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `tackles` | Integer | ✅ 必填 | 抢断次数，默认 0 |
| `interceptions` | Integer | ✅ 必填 | 拦截次数，默认 0 |
| `clearances` | Integer | ✅ 必填 | 解围次数，默认 0 |
| `blocks` | Integer | 否 | 封堵射门/传球次数 |
| `aerial_duels_won` | Integer | 否 | 争顶成功次数 |
| `aerial_duels_total` | Integer | 否 | 争顶总次数 |
| `ground_duels_won` | Integer | 否 | 地面对抗成功次数 |
| `ground_duels_total` | Integer | 否 | 地面对抗总次数 |
| `fouls_committed` | Integer | ✅ 必填 | 犯规次数，默认 0 |
| `yellow_cards` | Integer | ✅ 必填 | 本场黄牌数（0 或 1），默认 0 |
| `red_cards` | Integer | ✅ 必填 | 本场红牌数（0 或 1），默认 0 |
| `penalties_committed` | Integer | 否 | 送出点球次数 |
| `errors_leading_to_goal` | Integer | 否 | 导致直接丢球的失误次数 |

### 1.6 门将专属（仅 position='GK' 时有效）

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `saves` | Integer | 否 | 扑救次数，非门将球员为 null |
| `penalties_saved` | Integer | 否 | 扑出点球次数 |
| `high_claims` | Integer | 否 | 高空球摘取次数 |
| `sweeper_clearances` | Integer | 否 | 出击解围次数 |
| `goals_conceded` | Integer | 否 | 失球数，非门将球员为 null |
| `clean_sheet` | Boolean | 否 | 是否零封，非门将球员为 null |

### 1.7 跑动与体能

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `distance_covered_km` | Decimal(6,2) | 否 | 跑动距离（公里），如 10.45 |
| `top_speed_kmh` | Decimal(5,2) | 否 | 最高冲刺速度（公里/小时） |
| `sprints` | Integer | 否 | 冲刺次数 |

### 1.8 评分与元数据

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `ai_rating` | Decimal(3,1) | 否 | AI 机器评分（1.0-10.0），赛后由模型计算填入，如 8.5 |
| `is_mvp` | Boolean | ✅ 必填 | 是否全场最佳球员（POTM），默认 false。每场比赛有且仅有 1 名 MVP |
| `data_source` | String(20) | ✅ 必填 | 数据来源，枚举值：opta / statsbomb / wyscout / manual |
| `data_version` | Integer | ✅ 必填 | 数据版本号，同一场比赛的数据可能多次更新（赛中实时→赛后修正），取最新版本 |
| `created_at` | DateTime | ✅ 必填 | 记录创建时间（UTC） |
| `updated_at` | DateTime | ✅ 必填 | 记录最后更新时间（UTC） |

---

### 1.9 字段统计

| 分组 | 字段数 |
|------|--------|
| 基础关联 | 8 |
| 进攻数据 | 18 |
| 传球数据 | 9 |
| 防守数据 | 13 |
| 门将专属 | 6 |
| 跑动体能 | 3 |
| 评分元数据 | 6 |
| **合计** | **63** |

---

## 二、MatchStats（比赛统计表）

### 2.1 表定位

记录 **一支球队在一场比赛中的全队聚合统计数据**。一场比赛产生 2 条记录（主队 1 条 + 客队 1 条），共 208 条（104 场 × 2）。

这是比赛详情页"实时统计面板"和赛后"完整数据统计表"的数据源。

### 2.2 基础关联

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `id` | String(36) | ✅ 必填 | 记录唯一标识，UUID |
| `match_id` | String(36) | ✅ 必填 | 比赛 ID，关联 Matches 表 |
| `team_id` | String(36) | ✅ 必填 | 球队 ID，关联 Teams 表 |
| `is_home` | Boolean | ✅ 必填 | 是否为主队 |

### 2.3 控球与节奏

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `possession_percent` | Decimal(4,1) | ✅ 必填 | 控球率（%），如 54.0。主客队之和 = 100% |
| `possession_own_half_percent` | Decimal(4,1) | 否 | 本方半场控球占比 |
| `possession_opposition_half_percent` | Decimal(4,1) | 否 | 对方半场控球占比 |
| `attacks` | Integer | 否 | 进攻次数 |
| `dangerous_attacks` | Integer | 否 | 危险进攻次数 |

### 2.4 射门与进球效率

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `total_shots` | Integer | ✅ 必填 | 射门总次数 |
| `shots_on_target` | Integer | ✅ 必填 | 射正次数 |
| `shots_off_target` | Integer | ✅ 必填 | 射偏次数 |
| `shots_blocked` | Integer | ✅ 必填 | 射门被封堵次数 |
| `shots_inside_box` | Integer | 否 | 禁区内射门次数 |
| `shots_outside_box` | Integer | 否 | 禁区外射门次数 |
| `shot_accuracy` | Decimal(5,2) | 否 | 射正率（%），shots_on_target / total_shots |
| `shot_conversion_rate` | Decimal(5,2) | 否 | 射门转化率（%），goals / total_shots |
| `xG` | Decimal(6,4) | ✅ 必填 | 全队累计预期进球值（Expected Goals），如 1.8200 |
| `xG_open_play` | Decimal(6,4) | 否 | 运动战 xG |
| `xG_set_piece` | Decimal(6,4) | 否 | 定位球 xG |
| `xG_per_shot` | Decimal(5,4) | 否 | 每次射门平均 xG，衡量射门质量 |
| `big_chances` | Integer | 否 | 绝佳机会次数 |
| `big_chances_missed` | Integer | 否 | 错失绝佳机会次数 |

### 2.5 传球与组织

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `total_passes` | Integer | ✅ 必填 | 传球总次数 |
| `accurate_passes` | Integer | ✅ 必填 | 传球成功次数 |
| `pass_accuracy` | Decimal(5,2) | 否 | 传球成功率（%） |
| `own_half_passes` | Integer | 否 | 本方半场传球次数 |
| `opposition_half_passes` | Integer | 否 | 对方半场传球次数 |
| `long_balls` | Integer | 否 | 长传次数 |
| `accurate_long_balls` | Integer | 否 | 长传成功次数 |
| `crosses` | Integer | 否 | 传中次数 |
| `accurate_crosses` | Integer | 否 | 传中成功次数 |
| `through_balls` | Integer | 否 | 直塞球次数 |
| `key_passes` | Integer | 否 | 关键传球次数（全队合计） |

### 2.6 防守与对抗

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `tackles` | Integer | ✅ 必填 | 抢断总次数 |
| `tackles_won` | Integer | 否 | 抢断成功次数 |
| `interceptions` | Integer | ✅ 必填 | 拦截次数 |
| `clearances` | Integer | ✅ 必填 | 解围次数 |
| `blocks` | Integer | 否 | 封堵次数 |
| `aerial_duels_won` | Integer | 否 | 争顶成功次数 |
| `aerial_duels_total` | Integer | 否 | 争顶总次数 |
| `ground_duels_won` | Integer | 否 | 地面对抗成功次数 |
| `ground_duels_total` | Integer | 否 | 地面对抗总次数 |

### 2.7 纪律

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `fouls_committed` | Integer | ✅ 必填 | 犯规次数 |
| `fouls_suffered` | Integer | ✅ 必填 | 被犯规次数 |
| `yellow_cards` | Integer | ✅ 必填 | 黄牌总数 |
| `red_cards` | Integer | ✅ 必填 | 红牌总数（直接红牌 + 两黄变红） |
| `offsides` | Integer | ✅ 必填 | 越位次数 |

### 2.8 定位球

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `corners` | Integer | ✅ 必填 | 角球次数 |
| `free_kicks` | Integer | 否 | 任意球次数 |
| `penalties_awarded` | Integer | 否 | 获得点球次数 |
| `throw_ins` | Integer | 否 | 界外球次数 |
| `goal_kicks` | Integer | 否 | 球门球次数 |

### 2.9 门将数据

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `saves` | Integer | 否 | 扑救总次数 |
| `saves_from_inside_box` | Integer | 否 | 禁区内扑救次数 |
| `saves_from_outside_box` | Integer | 否 | 禁区外扑救次数 |
| `penalties_saved` | Integer | 否 | 扑出点球次数 |
| `goals_conceded` | Integer | 否 | 失球数 |

### 2.10 跑动与体能

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `distance_covered_km` | Decimal(7,2) | 否 | 全队跑动距离（公里），如 112.45 |
| `sprints` | Integer | 否 | 全队冲刺总次数 |
| `high_intensity_runs` | Integer | 否 | 高强度跑次数 |

### 2.11 元数据

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `data_source` | String(20) | ✅ 必填 | 数据来源：opta / statsbomb / wyscout / manual |
| `data_version` | Integer | ✅ 必填 | 数据版本号，赛中实时→赛后修正递增 |
| `created_at` | DateTime | ✅ 必填 | 记录创建时间（UTC） |
| `updated_at` | DateTime | ✅ 必填 | 记录最后更新时间（UTC） |

### 2.12 字段统计

| 分组 | 字段数 |
|------|--------|
| 基础关联 | 4 |
| 控球节奏 | 5 |
| 射门效率 | 13 |
| 传球组织 | 11 |
| 防守对抗 | 10 |
| 纪律 | 5 |
| 定位球 | 5 |
| 门将 | 5 |
| 跑动体能 | 3 |
| 元数据 | 4 |
| **合计** | **65** |

---

## 三、TeamStats（球队赛事统计表）

### 3.1 表定位

记录 **一支球队在本届世界杯赛事中的全量聚合统计数据**。每支球队 1 条记录，共 48 条。

这是国家队详情页"球队统计快照"、数据中心"球队统计榜"、AI 分析中心的数据源。

### 3.2 基础关联

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `id` | String(36) | ✅ 必填 | 记录唯一标识，UUID |
| `team_id` | String(36) | ✅ 必填 | 球队 ID，关联 Teams 表，全局唯一（一队一条） |
| `matches_played` | Integer | ✅ 必填 | 已赛场次，默认 0，随赛事推进递增 |
| `matches_played_group` | Integer | 否 | 小组赛已赛场次 |
| `matches_played_knockout` | Integer | 否 | 淘汰赛已赛场次 |

### 3.3 战绩

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `wins` | Integer | ✅ 必填 | 胜场数（常规时间+加时赛胜），点球大战胜计入胜场（但实际记为"平局后点球胜"） |
| `draws` | Integer | ✅ 必填 | 平局数（常规时间+加时赛平，不含点球大战） |
| `losses` | Integer | ✅ 必填 | 负场数 |
| `goals_for` | Integer | ✅ 必填 | 总进球数（含加时赛，不含点球大战） |
| `goals_against` | Integer | ✅ 必填 | 总失球数 |
| `goal_difference` | Integer | ✅ 必填 | 净胜球，goals_for - goals_against |
| `clean_sheets` | Integer | ✅ 必填 | 零封场次 |
| `failed_to_score` | Integer | 否 | 未进球场次 |
| `points` | Integer | ✅ 必填 | 积分（仅小组赛有意义，淘汰赛阶段冻结） |
| `group_rank` | Integer | 否 | 小组排名（1-4），小组赛结束后确定 |
| `highest_lead` | Integer | 否 | 本届赛事中最大领先球数 |
| `comebacks` | Integer | 否 | 逆转取胜场次 |

### 3.4 进攻聚合

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `total_shots` | Integer | ✅ 必填 | 总射门次数（所有比赛合计） |
| `shots_on_target` | Integer | ✅ 必填 | 总射正次数 |
| `shots_per_match` | Decimal(5,2) | 否 | 场均射门，total_shots / matches_played |
| `shot_accuracy` | Decimal(5,2) | 否 | 射正率（%） |
| `shot_conversion_rate` | Decimal(5,2) | 否 | 射门转化率（%） |
| `total_xG` | Decimal(7,4) | 否 | 累计 xG（所有比赛合计） |
| `xG_per_match` | Decimal(5,3) | 否 | 场均 xG |
| `xG_diff` | Decimal(7,4) | 否 | xG 差值（实际进球 - xG），正值=效率高于预期，负值=效率低于预期 |
| `big_chances_total` | Integer | 否 | 绝佳机会总数 |
| `big_chances_converted` | Integer | 否 | 绝佳机会转化数 |
| `penalties_scored` | Integer | 否 | 点球进球总数 |
| `goals_from_open_play` | Integer | 否 | 运动战进球数 |
| `goals_from_set_piece` | Integer | 否 | 定位球进球数 |
| `goals_from_counter_attack` | Integer | 否 | 反击进球数 |
| `goals_from_penalty` | Integer | 否 | 点球进球数（常规+加时） |
| `own_goals_benefited` | Integer | 否 | 对方乌龙球（本方受益） |

### 3.5 传球聚合

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `total_passes` | Integer | 否 | 总传球次数 |
| `passes_per_match` | Decimal(6,1) | 否 | 场均传球 |
| `average_pass_accuracy` | Decimal(5,2) | 否 | 平均传球成功率（%），所有比赛 pass_accuracy 的平均值 |
| `average_possession` | Decimal(4,1) | 否 | 平均控球率（%），所有比赛 possession 的平均值 |

### 3.6 防守聚合

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `total_tackles` | Integer | 否 | 总抢断次数 |
| `tackles_per_match` | Decimal(5,2) | 否 | 场均抢断 |
| `total_interceptions` | Integer | 否 | 总拦截次数 |
| `total_clearances` | Integer | 否 | 总解围次数 |
| `total_saves` | Integer | 否 | 总扑救次数 |
| `goals_conceded_per_match` | Decimal(4,2) | 否 | 场均失球 |

### 3.7 纪律聚合

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `total_fouls` | Integer | 否 | 总犯规次数 |
| `fouls_per_match` | Decimal(5,2) | 否 | 场均犯规 |
| `total_yellow_cards` | Integer | ✅ 必填 | 总黄牌数 |
| `total_red_cards` | Integer | ✅ 必填 | 总红牌数 |
| `total_offsides` | Integer | 否 | 总越位次数 |

### 3.8 跑动与体能聚合

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `total_distance_km` | Decimal(8,2) | 否 | 总跑动距离（公里） |
| `distance_per_match_km` | Decimal(6,2) | 否 | 场均跑动距离（公里） |

### 3.9 元数据

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `last_match_id` | String(36) | 否 | 最近一场比赛 ID，用于增量更新判断 |
| `updated_at` | DateTime | ✅ 必填 | 记录最后更新时间（UTC），每场比赛结束后重新计算 |

### 3.10 字段统计

| 分组 | 字段数 |
|------|--------|
| 基础关联 | 5 |
| 战绩 | 12 |
| 进攻聚合 | 16 |
| 传球聚合 | 4 |
| 防守聚合 | 7 |
| 纪律聚合 | 5 |
| 跑动体能 | 2 |
| 元数据 | 2 |
| **合计** | **53** |

---

## 四、三表关系图

```
┌──────────┐
│  Teams   │
└────┬─────┘
     │
     │ 1:1
     ▼
┌──────────────┐         ┌──────────┐
│  TeamStats   │         │  Matches │
│  (48条)      │         └────┬─────┘
│  赛事聚合统计 │              │
└──────────────┘              │ 1:2 (主+客)
                              ▼
                     ┌──────────────┐
                     │  MatchStats  │
                     │  (208条)     │
                     │  比赛级别统计 │
                     └──────┬───────┘
                            │
                            │ 1:N (上场球员)
                            ▼
                     ┌──────────────┐
                     │ PlayerStats  │
                     │  (~4000条)   │
                     │  球员个人统计 │
                     └──────┬───────┘
                            │
                            │ N:1
                            ▼
                     ┌──────────┐
                     │ Players  │
                     └──────────┘
```

```
TeamStats   ←── 聚合 ──→   MatchStats   ←── 聚合 ──→   PlayerStats
  (48条)       所有比赛        (208条)      所有上场球员      (~4000条)
               场均/总计       每场每队       每场每人
```

---

## 五、数据流转与应用场景

### 5.1 球员评分（Player Rating）的计算

```
PlayerStats 原始数据
        │
        ▼
┌───────────────────────────────────────────────┐
│           AI 评分模型 (赛后离线计算)             │
│                                                │
│  输入特征 (来自 PlayerStats):                   │
│  ┌──────────────────────────────────────────┐  │
│  │ 进攻: goals, assists, xG, shots, dribbles │  │
│  │ 传球: pass_accuracy, key_passes, crosses  │  │
│  │ 防守: tackles, interceptions, clearances  │  │
│  │ 纪律: fouls, yellow_cards, red_cards      │  │
│  │ 时间: minutes_played (出场时间权重)        │  │
│  │ 位置: position (不同位置评分标准不同)       │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  输出: ai_rating (1.0-10.0)                    │
│  写入: PlayerStats.ai_rating                   │
└───────────────────────────────────────────────┘
        │
        ▼
  比赛详情页"球员评分表"
  球员详情页"比赛日志"
```

**评分权重参考（位置差异化）：**

| 位置 | 进球权重 | 防守权重 | 传球权重 | 跑动权重 |
|------|----------|----------|----------|----------|
| 前锋(FWD) | 40% | 5% | 20% | 15% |
| 中场(MID) | 15% | 20% | 35% | 20% |
| 后卫(DEF) | 5% | 40% | 25% | 15% |
| 门将(GK) | 0% | 60% | 10% | 5% |

得分最高的球员 → `is_mvp = true` → 比赛详情页 MVP 卡片 + 历史比赛 MVP 列表

---

### 5.2 比赛评分（Match Rating）的计算

```
MatchStats (主队) + MatchStats (客队)
        │
        ▼
┌───────────────────────────────────────────────┐
│           比赛质量评分模型                       │
│                                                │
│  输入特征:                                     │
│  ┌──────────────────────────────────────────┐  │
│  │ 总进球: goals_for (两队合计)              │  │
│  │ xG 总和: xG_home + xG_away               │  │
│  │ 射门总数: total_shots (两队合计)           │  │
│  │ 控球均衡度: |possession - 50%| 越低越好   │  │
│  │ 犯规比例: fouls / (fouls + tackles)      │  │
│  │ 绝佳机会: big_chances (两队合计)           │  │
│  │ 逆转因素: comebacks                      │  │
│  │ 对抗程度: cards + fouls 综合              │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  输出: 比赛质量分 (1-10)                        │
│  用途: 首页 Hero 横幅排序、焦点战标记建议         │
└───────────────────────────────────────────────┘
```

---

### 5.3 排行榜（Leaderboards）

#### 球员排行榜（数据中心 `/stats/players`）

```
PlayerStats 表聚合查询:

射手榜:
  SELECT player_id, SUM(goals) AS total_goals
  GROUP BY player_id  ORDER BY total_goals DESC  LIMIT 20

助攻榜:
  SELECT player_id, SUM(assists) AS total_assists
  GROUP BY player_id  ORDER BY total_assists DESC  LIMIT 20

扑救榜:
  SELECT player_id, SUM(saves) AS total_saves
  WHERE saves IS NOT NULL
  GROUP BY player_id  ORDER BY total_saves DESC  LIMIT 20

跑动榜:
  SELECT player_id, SUM(distance_covered_km) AS total_distance
  GROUP BY player_id  ORDER BY total_distance DESC  LIMIT 20

传球榜:
  SELECT player_id, SUM(total_passes) AS total_passes
  GROUP BY player_id  ORDER BY total_passes DESC  LIMIT 20

场均评分榜:
  SELECT player_id, AVG(ai_rating) AS avg_rating
  WHERE minutes_played >= 90  -- 至少打满1场
  GROUP BY player_id  ORDER BY avg_rating DESC  LIMIT 20
```

#### 球队排行榜（数据中心 `/stats/teams`）

```
TeamStats 表查询:

进球榜     → ORDER BY goals_for DESC
控球率榜   → ORDER BY average_possession DESC
传球成功率榜 → ORDER BY average_pass_accuracy DESC
零封榜     → ORDER BY clean_sheets DESC
射门转化率榜 → ORDER BY shot_conversion_rate DESC
跑动榜     → ORDER BY distance_per_match_km DESC

排名趋势: TeamStats.goal_difference 与 Standing 表对比
```

---

### 5.4 AI 分析（AI Analysis）

#### 预测模型输入特征

```
┌─────────────────────────────────────────────────────────────────┐
│               AI 预测模型 —— 数据输入管线                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  一支球队的特征向量 (52维) 来源:                                 │
│                                                                 │
│  ┌─ 来自 TeamStats ────────────────────────────────────────┐   │
│  │ · goals_for_per_match   (场均进球)                       │   │
│  │ · goals_against_per_match (场均失球)                     │   │
│  │ · average_possession    (平均控球率)                     │   │
│  │ · shot_conversion_rate  (射门转化率)                     │   │
│  │ · xG_per_match          (场均xG)                         │   │
│  │ · xG_diff               (实际 vs 预期差异)               │   │
│  │ · clean_sheets_ratio    (零封率)                         │   │
│  │ · passes_per_match      (场均传球)                       │   │
│  │ · tackles_per_match     (场均抢断)                       │   │
│  │ · fouls_per_match       (场均犯规)                       │   │
│  │ · distance_per_match_km (场均跑动)                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ 来自 MatchStats (最近5场) ─────────────────────────────┐   │
│  │ · possession_trend      (控球率趋势 ↑/↓/→)              │   │
│  │ · xG_trend              (xG趋势)                         │   │
│  │ · form_rating           (基于最近5场结果: W/D/L加权)     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ 来自 PlayerStats (关键球员) ───────────────────────────┐   │
│  │ · top_scorer_goals      (最佳射手进球数)                  │   │
│  │ · top_scorer_xG         (最佳射手 xG)                     │   │
│  │ · key_player_available  (核心球员是否可出场)              │   │
│  │ · squad_depth_rating    (阵容深度评分)                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ 来自 Teams ────────────────────────────────────────────┐   │
│  │ · fifa_ranking          (FIFA 排名)                      │   │
│  │ · world_cup_titles      (世界杯冠军经验)                  │   │
│  │ · coach_experience      (教练大赛经验)                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  输出: 胜负概率 + 最可能比分 + 夺冠概率                          │
└─────────────────────────────────────────────────────────────────┘
```

#### 预测模型使用 PlayerStats 的方式

```
┌─────────────────────────────────────────────────────────────────┐
│  金靴奖预测模型                                                 │
│                                                                │
│  输入: PlayerStats 聚合 + Teams 信息                            │
│                                                                │
│  特征:                                                          │
│  · current_goals          (当前进球数)                          │
│  · goals_per_90           (每90分钟进球率)                      │
│  · xG_per_90              (每90分钟 xG)                         │
│  · shot_conversion_rate   (个人射门转化率)                      │
│  · team_xG_per_match      (所在球队的场均 xG)                   │
│  · team_advancement_prob  (球队晋级概率，影响剩余场次)          │
│  · penalty_taker          (是否是点球手)                        │
│  · minutes_played_trend   (出场时间趋势: 主力? 轮换?)           │
│                                                                │
│  输出: 预期最终进球数 + 金靴概率                                │
│  展示: AI 分析中心 "金靴预测 Top 10"                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 六、数据更新策略

```
┌─────────────────────────────────────────────────────────────────┐
│                      三表更新策略                                │
├──────────────┬──────────────────────────────────────────────────┤
│ PlayerStats  │  赛中: 每 30 秒增量更新关键字段(goals/shots等)    │
│              │  赛后: 5 分钟内完成完整数据回填                    │
│              │  赛后 24h: AI 评分模型运行，填入 ai_rating        │
├──────────────┼──────────────────────────────────────────────────┤
│ MatchStats   │  赛中: 每 30 秒增量更新                           │
│              │  赛后: 5 分钟内完成完整数据回填 + 校验             │
├──────────────┼──────────────────────────────────────────────────┤
│ TeamStats    │  每场比赛结束后: 全量重新聚合计算                  │
│              │  = SUM(MatchStats) + AVG(MatchStats)              │
│              │  更新频率: 只在比赛结束后，赛中不更新              │
└──────────────┴──────────────────────────────────────────────────┘
```

---

## 七、三表总计

| 表 | 记录数 | 字段数 | 更新频率 | 核心用途 |
|------|------|------|------|------|
| **PlayerStats** | ~4,000 | 63 | 赛中 30s / 赛后完整 | 球员评分 · 比赛日志 · 球员排行榜 |
| **MatchStats** | 208 | 65 | 赛中 30s / 赛后完整 | 实时统计面板 · 赛后数据 · 比赛评分 |
| **TeamStats** | 48 | 53 | 每场赛后全量聚合 | 球队统计快照 · 球队排行榜 · AI 预测输入 |

---

> **文档结束。** 本设计覆盖 PlayerStats、MatchStats、TeamStats 三张统计表的完整字段结构，并解释了它们在球员评分、比赛评分、排行榜和 AI 分析中的应用方式。
