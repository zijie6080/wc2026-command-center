# 核心表设计 — Users · Favorites · Notifications · Predictions

> **设计范围:** 仅 Users、Favorites、Notifications、Predictions 四张表
> **设计依据:** 基于全部 11 个页面原型 + 29 个数据实体
> **版本:** v1.0 / 2026-06-04

---

## 一、四表关系总览

```
                              ┌──────────────┐
                              │    Users     │
                              │   用户表     │
                              └──────┬───────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │ 1:N            │ 1:N            │ 1:N
                    ▼                ▼                ▼
            ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
            │  Favorites   │ │Notifications │ │ Predictions  │
            │   收藏表     │ │   通知表     │ │   预测表     │
            └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
                   │               │                │
              ┌────┼────┐          │           ┌────┼────┐
              ▼    ▼    ▼          ▼           ▼    ▼    ▼
            Team Player Match    Match       Match Team  Player
           (三选一关联)         (通知来源)   (预测目标: 三选一)
```

`Users` 是用户域的中心，三条 1:N 关系向外辐射。

`Favorites` 与 `Predictions` 采用相同的"三选一目标"模式——通过 `target_type` + `target_id` 灵活关联三种实体。

---

## 二、Users（用户表）

### 2.1 表定位

所有个人功能的基础——认证登录、身份标识、注册来源。一条记录 = 一个注册用户。目标首月 50 万 DAU。

### 2.2 身份认证

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `id` | String(36) | ✅ 必填 | 用户唯一标识，UUID |
| `email` | String(255) | 否 | 邮箱地址，邮箱注册时必填，第三方登录时可选。全局唯一（null 除外） |
| `email_verified` | Boolean | ✅ 必填 | 邮箱是否已验证，默认 false |
| `phone` | String(20) | 否 | 手机号码，含国家代码，如 +86138****8888 |
| `phone_verified` | Boolean | ✅ 必填 | 手机是否已验证，默认 false |
| `password_hash` | String(255) | 否 | 密码哈希（bcrypt/argon2），仅邮箱/手机注册用户有值，第三方登录用户为 null |
| `auth_provider` | String(20) | ✅ 必填 | 认证来源，枚举值：email（邮箱注册）/ phone（手机注册）/ google / apple / x（Twitter）/ wechat |
| `auth_provider_id` | String(255) | 否 | 第三方认证平台返回的用户 ID（Google sub / Apple user / X user_id），与 auth_provider 组合唯一 |

### 2.3 个人资料

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `nickname` | String(60) | ✅ 必填 | 用户昵称，展示用。第三方登录默认使用平台昵称，用户可修改 |
| `avatar_url` | String(255) | 否 | 头像 URL。第三方登录默认使用平台头像 |
| `bio` | String(200) | 否 | 个人简介，最多 200 字 |
| `country_code` | String(3) | 否 | 用户所在国家/地区 FIFA 代码，如 CHN，用于默认时区和内容推荐 |
| `language` | String(10) | ✅ 必填 | 界面语言偏好，如 zh-CN / en-US / es-ES / fr-FR / ar-SA / pt-BR / ja-JP / ko-KR。默认根据浏览器自动检测 |

### 2.4 显示与偏好

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `theme_mode` | String(10) | ✅ 必填 | 主题模式，枚举值：dark（深色，默认，观赛场景）/ light（浅色）/ system（跟随系统） |
| `theme_color` | String(20) | ✅ 必填 | 主色调，枚举值：blue / green / orange / red / purple。默认 blue |
| `timezone` | String(40) | ✅ 必填 | 用户时区，如 Asia/Shanghai / America/New_York。默认根据浏览器自动检测 |
| `time_format` | String(5) | ✅ 必填 | 时间格式：24h（24小时制）/ 12h（12小时制 AM/PM）。默认 24h |
| `date_format` | String(10) | ✅ 必填 | 日期格式：YYYY-MM-DD / MM/DD/YYYY / DD/MM/YYYY。默认 YYYY-MM-DD |
| `temperature_unit` | String(1) | ✅ 必填 | 温度单位：C（摄氏度）/ F（华氏度）。默认 C |
| `distance_unit` | String(2) | ✅ 必填 | 距离单位：km（公里）/ mi（英里）。默认 km |
| `default_match_view` | String(10) | ✅ 必填 | 默认比赛详情页视图，枚举值：live（赛中）/ prematch（赛前）/ postmatch（赛后）。默认 live |
| `score_font_size` | String(10) | ✅ 必填 | 比分显示字号偏好：small / normal / large / xlarge。默认 normal |

### 2.5 隐私与状态

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `profile_visibility` | String(10) | ✅ 必填 | 个人资料可见性：public（公开）/ private（仅自己）/ friends（仅好友）。默认 private |
| `favorites_visibility` | String(10) | ✅ 必填 | 收藏列表可见性：public / private。默认 private |
| `predictions_visibility` | String(10) | ✅ 必填 | 预测记录可见性：public / private。默认 public（可参与排行榜） |
| `allow_search` | Boolean | ✅ 必填 | 是否允许被其他用户搜索到，默认 true |
| `allow_data_share` | Boolean | ✅ 必填 | 是否同意匿名数据用于模型优化，默认 false |
| `account_status` | String(15) | ✅ 必填 | 账号状态：active（正常）/ suspended（封禁）/ deactivated（自行注销）。默认 active |

### 2.6 活动统计（冗余加速）

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `last_login_at` | DateTime | 否 | 最后登录时间（UTC），更新于每次登录 |
| `last_login_ip` | String(45) | 否 | 最后登录 IP 地址 |
| `login_count` | Integer | ✅ 必填 | 累计登录次数，默认 0 |
| `prediction_accuracy` | Decimal(5,2) | 否 | 用户预测综合准确率（%），每次赛后结算时更新 |
| `prediction_count` | Integer | ✅ 必填 | 累计预测次数，默认 0 |
| `prediction_streak` | Integer | ✅ 必填 | 当前连续预测正确次数，默认 0 |

### 2.7 元数据

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `created_at` | DateTime | ✅ 必填 | 注册时间（UTC） |
| `updated_at` | DateTime | ✅ 必填 | 最后更新时间（UTC） |
| `deleted_at` | DateTime | 否 | 注销时间（UTC），软删除标记 |

### 2.8 字段统计

| 分组 | 字段数 |
|------|--------|
| 身份认证 | 8 |
| 个人资料 | 5 |
| 显示偏好 | 9 |
| 隐私状态 | 6 |
| 活动统计 | 6 |
| 元数据 | 3 |
| **合计** | **37** |

---

## 三、Favorites（收藏表）

### 3.1 表定位

用户标记"想看/关注"的比赛、球队、球员。驱动"我的收藏"页面、个性化首页推荐、"我的观赛计划"侧边栏。

一条记录 = 一个用户收藏一个目标对象。

### 3.2 字段设计

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `id` | String(36) | ✅ 必填 | 收藏唯一标识，UUID |
| `user_id` | String(36) | ✅ 必填 | 用户 ID，关联 Users 表 |
| `target_type` | String(10) | ✅ 必填 | 收藏目标类型，枚举值：team / player / match。决定 target_id 关联哪张表 |
| `target_id` | String(36) | ✅ 必填 | 收藏目标 ID。当 target_type='team' → Teams.id；当 target_type='player' → Players.id；当 target_type='match' → Matches.id |
| `notes` | String(200) | 否 | 用户自定义备注，如"一定要看！梅西最后一场世界杯" |
| `sort_order` | Integer | ✅ 必填 | 用户自定义排序权重，默认 0。数值越大越靠前，支持拖拽排序 |
| `created_at` | DateTime | ✅ 必填 | 收藏时间（UTC） |

### 3.3 唯一约束

`user_id` + `target_type` + `target_id` 三字段组合唯一——同一用户不能重复收藏同一个对象。

### 3.4 表关系

```
Users 1 ──── N Favorites     (一个用户有 0~N 条收藏)

Favorites ── target_type ──┬── 'team'   → Teams.id
                           ├── 'player' → Players.id
                           └── 'match'  → Matches.id
                           (通过 target_type + target_id 多态关联)
```

### 3.5 查询场景

| 场景 | 查询方式 | 对应页面 |
|------|----------|----------|
| 我的收藏-全部 | user_id 查全部，按 created_at 倒序 | 我的收藏页"全部"标签 |
| 我的收藏-球队 | user_id + target_type='team' | 我的收藏页"球队"标签 |
| 我的收藏-球员 | user_id + target_type='player' | 我的收藏页"球员"标签 |
| 我的收藏-比赛 | user_id + target_type='match' | 我的收藏页"比赛"标签 |
| 收藏数展示 | COUNT WHERE target_type='match' AND target_id=xxx | 比赛详情页"已收藏 N 次" |
| 个性化推荐 | user_id 查 target_type='team' → 获取球队 → 推荐该球队即将比赛 | 首页"你可能关注" |

### 3.6 字段统计

| 分组 | 字段数 |
|------|--------|
| 关联 + 目标 | 4 |
| 备注 + 排序 | 2 |
| 元数据 | 1 |
| **合计** | **7** |

---

## 四、Notifications（通知表）

### 4.1 表定位

系统向用户推送的每一条消息记录。驱动浏览器推送、页面内通知面板、邮件通知。

一条记录 = 一条已发送的通知。

### 4.2 字段设计

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `id` | String(36) | ✅ 必填 | 通知唯一标识，UUID |
| `user_id` | String(36) | ✅ 必填 | 接收用户 ID，关联 Users 表 |

### 4.3 通知类型与内容

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `type` | String(30) | ✅ 必填 | 通知类型，枚举值见下方"通知类型表" |
| `title` | String(120) | ✅ 必填 | 通知标题（多语言），如"⚽ 进球！阿根廷 1:0 巴西" / "🔔 比赛即将开始" |
| `body` | String(500) | ✅ 必填 | 通知正文（多语言），如"梅西 23' 接迪马利亚助攻推射破门。阿根廷 1:0 巴西。点击查看详情 →" |
| `image_url` | String(255) | 否 | 通知配图 URL（富文本推送用），进球队徽/球员头像 |

### 4.4 关联实体

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `link_type` | String(10) | 否 | 点击通知跳转的目标类型：match / team / player / news / prediction。null 表示无跳转 |
| `link_id` | String(36) | 否 | 点击通知跳转的目标 ID。与 link_type 配合使用，拼接跳转 URL |
| `source_match_id` | String(36) | 否 | 触发通知的比赛 ID，用于"XX比赛进球"类通知。冗余字段，方便追踪 |
| `source_player_id` | String(36) | 否 | 触发通知的球员 ID，用于"XX球员进球"类通知 |
| `source_team_id` | String(36) | 否 | 触发通知的球队 ID，用于"XX球队比赛开始"类通知 |

### 4.5 送达与读取状态

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `channel` | String(10) | ✅ 必填 | 推送渠道：push（浏览器推送）/ email（邮件）/ in_app（站内信）。可多位，用逗号分隔 |
| `is_read` | Boolean | ✅ 必填 | 是否已读，默认 false |
| `read_at` | DateTime | 否 | 阅读时间（UTC） |
| `is_sent` | Boolean | ✅ 必填 | 是否已成功发送，默认 false |
| `sent_at` | DateTime | 否 | 发送时间（UTC） |
| `send_error` | String(300) | 否 | 发送失败原因，如"浏览器未授权推送权限" |
| `priority` | String(6) | ✅ 必填 | 优先级：high（进球/红牌，立即推送）/ normal（比赛开始/结束）/ low（新闻摘要，批量推送） |
| `expires_at` | DateTime | 否 | 通知过期时间，过期后不再展示 |

### 4.6 元数据

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `created_at` | DateTime | ✅ 必填 | 通知创建时间（UTC） |

### 4.7 通知类型枚举

| type 值 | 触发条件 | 优先级 | 示例标题 |
|----------|----------|--------|----------|
| `goal` | 关注球队进球 | high | ⚽ 进球！阿根廷 1:0 巴西 |
| `red_card` | 关注球队/比赛红牌 | high | 🟥 红牌！巴西球员被罚下 |
| `penalty` | 关注球队/比赛点球 | high | 📢 点球判罚！阿根廷获得点球 |
| `match_start` | 关注球队比赛开始前 N 分钟 | normal | 🔔 阿根廷 vs 巴西 即将开始 |
| `half_time` | 关注球队半场结束 | low | ⏸️ 半场结束 阿根廷 1:0 巴西 |
| `full_time` | 关注球队全场结束 | normal | 🏁 全场结束 阿根廷 2:1 巴西 |
| `lineup_announced` | 关注比赛首发公布 | normal | 📋 阿根廷首发公布！梅西领衔 |
| `var_decision` | 关注比赛 VAR 重大改判 | high | 📺 VAR改判！点球取消 |
| `upset_alert` | 大冷门预警（弱队领先强队） | high | ⚡ 冷门预警！沙特 1:0 阿根廷 |
| `breaking_news` | 突发新闻（伤病/退出等） | high | 🚨 梅西训练受伤出战成疑 |
| `daily_digest` | 每日赛程摘要 | low | 📅 今日6场小组赛看点 |
| `prediction_result` | 用户预测结果出炉 | normal | ✅ 你猜对了！阿根廷 2:1 巴西 |
| `knockout_update` | 淘汰赛晋级信息更新 | normal | 🏆 阿根廷晋级 8 强！ |
| `custom` | 运营自定义推送 | normal | 由运营团队指定内容 |

### 4.8 表关系

```
Users 1 ──── N Notifications    (一个用户收到 0~N 条通知)

Notifications ── link_type ──┬── 'match'      → Matches.id
                             ├── 'team'       → Teams.id
                             ├── 'player'     → Players.id
                             ├── 'news'       → Article.id
                             └── 'prediction' → Predictions.id
                             (点击跳转目标，通过 link_type + link_id 多态)

Notifications ── source_match_id  → Matches.id   (触发来源)
Notifications ── source_player_id → Players.id   (触发来源)
Notifications ── source_team_id   → Teams.id     (触发来源)
```

### 4.9 字段统计

| 分组 | 字段数 |
|------|--------|
| 基础关联 | 2 |
| 类型与内容 | 4 |
| 关联实体 | 5 |
| 送达与状态 | 8 |
| 元数据 | 1 |
| **合计** | **20** |

---

## 五、Predictions（预测表）

### 5.1 表定位

AI 模型生成的每一条预测结果 + 用户提交的每一条预测。同时服务 AI 分析中心（"今日预测"）和夺冠预测页（"冠军预测"）。

两种数据来源共存于同一张表，通过 `source` 字段区分。

### 5.2 基础关联

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `id` | String(36) | ✅ 必填 | 预测唯一标识，UUID |
| `source` | String(10) | ✅ 必填 | 预测来源：ai（AI 模型生成）/ user（用户提交）。决定 user_id 是否必填 |
| `user_id` | String(36) | 否 | 用户 ID，关联 Users 表。source='user' 时必填；source='ai' 时为 null |
| `model_version` | String(10) | 否 | AI 模型版本号，如 v3.2。source='ai' 时必填；source='user' 时为 null |

### 5.3 预测目标

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `type` | String(15) | ✅ 必填 | 预测类型，枚举值：match_result（比赛胜负）/ match_score（比赛比分）/ champion（冠军归属）/ golden_boot（金靴奖）/ group_qualifier（小组出线）/ total_goals（总进球数） |
| `match_id` | String(36) | 否 | 预测目标比赛 ID。type 为 match_result / match_score / total_goals 时必填 |
| `team_id` | String(36) | 否 | 预测目标球队 ID。type 为 champion / group_qualifier 时必填 |
| `player_id` | String(36) | 否 | 预测目标球员 ID。type 为 golden_boot 时必填 |

### 5.4 预测内容（按 type 使用不同字段组）

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `predicted_winner` | String(10) | 否 | 预测胜方：home / away / draw。type=match_result 时必填 |
| `home_win_prob` | Decimal(5,2) | 否 | 主胜概率（%），如 48.50。AI 预测填写 |
| `draw_prob` | Decimal(5,2) | 否 | 平局概率（%），如 26.30 |
| `away_win_prob` | Decimal(5,2) | 否 | 客胜概率（%），如 25.20 |
| `predicted_home_score` | Integer | 否 | 预测主队进球数。type=match_score 时必填 |
| `predicted_away_score` | Integer | 否 | 预测客队进球数。type=match_score 时必填 |
| `predicted_score_prob` | Decimal(5,2) | 否 | 该比分预测的概率（%），如 18.50。仅 AI 预测填写 |
| `expected_home_goals` | Decimal(5,2) | 否 | 主队预期进球数（xG预测），如 2.40 |
| `expected_away_goals` | Decimal(5,2) | 否 | 客队预期进球数，如 1.10 |
| `predicted_total_goals` | Integer | 否 | 预测总进球数。type=total_goals 时必填 |
| `champion_prob` | Decimal(5,2) | 否 | 夺冠概率（%）。type=champion 时必填，如 22.50 |
| `golden_boot_prob` | Decimal(5,2) | 否 | 金靴概率（%）。type=golden_boot 时必填 |
| `predicted_goals` | Integer | 否 | 预测最终进球数。type=golden_boot 时必填 |
| `group_advance_prob` | Decimal(5,2) | 否 | 小组出线概率（%）。type=group_qualifier 时必填 |

### 5.5 预测置信度与模拟

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `confidence_level` | Decimal(5,2) | 否 | AI 预测置信度（%），如 78.00。用户预测为 null |
| `confidence_stars` | Integer | 否 | 置信度星级（1-5），由 confidence_level 映射：≥80%=5星, 60-79%=4星, 40-59%=3星, 20-39%=2星, <20%=1星 |
| `simulation_count` | Integer | 否 | 蒙特卡洛模拟次数，如 10000。仅 AI 预测填写 |
| `key_factors` | String(500) | 否 | 影响预测的关键因素，JSON 数组，如 [{"factor":"阿根廷近5场4W1D","impact":"+8%"},{"factor":"梅西状态火热","impact":"+5%"}] |

### 5.6 结果校验

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `is_settled` | Boolean | ✅ 必填 | 是否已结算（比赛结束/冠军产生后可校验），默认 false |
| `is_correct` | Boolean | 否 | 预测是否正确。null=未结算，true=正确，false=错误 |
| `points_earned` | Integer | 否 | 用户预测获得的积分（用于排行榜）。AI 预测为 null |
| `actual_result` | String(100) | 否 | 实际结果的简要描述，如"阿根廷 2:1 巴西 (梅西23',45'; 维尼修斯78')" |
| `settled_at` | DateTime | 否 | 结算时间（UTC） |

### 5.7 元数据

| 字段名 | 字段类型 | 是否必填 | 字段说明 |
|--------|----------|----------|----------|
| `created_at` | DateTime | ✅ 必填 | 预测创建时间（UTC） |
| `updated_at` | DateTime | ✅ 必填 | 预测更新时间（UTC），结算时更新 |

### 5.8 表关系

```
Predictions ── source ──┬── 'ai'   → model_version 有值, user_id 为 null
                        └── 'user' → user_id 有值, model_version 为 null

Users    1 ──── N Predictions   (一个用户提交多条预测)
Matches  1 ──── N Predictions   (一场比赛有多条预测: AI的 + 多个用户的)
Teams    1 ──── N Predictions   (一支球队有冠军/出线预测)
Players  1 ──── N Predictions   (一名球员有金靴预测)

Predictions ── type ──┬── match_result    → match_id 必填
                      ├── match_score     → match_id 必填
                      ├── champion        → team_id 必填
                      ├── golden_boot     → player_id 必填
                      ├── group_qualifier → team_id 必填
                      └── total_goals     → match_id 必填
```

### 5.9 查询场景

| 场景 | 查询方式 | 对应页面 |
|------|----------|----------|
| 今日比赛 AI 预测 | source='ai' + match_id IN (今日比赛IDs) | AI 分析中心"今日预测" |
| 某场比赛用户预测汇总 | source='user' + match_id=xxx，按 predicted_home_score, predicted_away_score 分组统计 | 比赛详情页预测区 |
| 冠军概率排名 | source='ai' + type='champion'，ORDER BY champion_prob DESC | 夺冠预测页 TOP 5 横幅 |
| 金靴预测排名 | source='ai' + type='golden_boot'，ORDER BY golden_boot_prob DESC | AI 分析中心"金靴预测" |
| 用户预测准确率 | source='user' + user_id=xxx，AVG(is_correct) | 设置页/用户预测排行榜 |
| 用户预测排行榜 | source='user' + is_settled=true，GROUP BY user_id，ORDER BY SUM(points_earned) DESC | 夺冠预测页"用户预测"标签 |
| AI 模型准确率追踪 | source='ai' + is_settled=true，AVG(is_correct) | AI 分析中心"准确率档案" |
| 焦点战深度分析 | source='ai' + match_id=xxx + type='match_score'，取 key_factors | AI 分析中心"焦点战深度预测" |

### 5.10 字段统计

| 分组 | 字段数 |
|------|--------|
| 基础关联 | 4 |
| 预测目标 | 4 |
| 预测内容 | 13 |
| 置信度模拟 | 4 |
| 结果校验 | 5 |
| 元数据 | 2 |
| **合计** | **32** |

---

## 六、四表总计

| 表 | 记录数（估算） | 字段数 | 核心关系 |
|------|------|------|------|
| **Users** | 500,000+ | 37 | 用户域中心，1:N → Favorites / Notifications / Predictions |
| **Favorites** | 2,000,000+ | 7 | user_id + target_type + target_id 三字段唯一 |
| **Notifications** | 10,000,000+ | 20 | user_id 索引，is_read 筛选，expires_at 自动清理 |
| **Predictions** | 50,000+ | 32 | source 区分 AI/用户，type 决定目标实体，is_settled 驱动结算 |

---

> **文档结束。** 本设计覆盖 Users、Favorites、Notifications、Predictions 四张表的完整字段结构和表关系。Favorites 和 Predictions 均采用 target_type + target_id 的多态关联模式，灵活支持三类目标实体。
