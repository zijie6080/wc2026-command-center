# API 层设计 — World Cup 2026 Command Center

> **技术栈:** Next.js 15 API Routes + Supabase Realtime (WebSocket)
> **设计模式:** RESTful + 实时订阅分离
> **版本:** v1.0 / 2026-06-04

---

## 一、API 设计原则

| 原则 | 说明 |
|------|------|
| **REST + Realtime 分层** | REST 用于请求-响应式数据获取；Supabase Realtime 用于比分/事件等持续推送 |
| **统一响应格式** | 所有 REST 响应包裹在 `{ success, data, error, meta }` 结构中 |
| **分页默认** | 列表接口默认 `page=1&limit=20`，返回 `meta.total` 总数 |
| **多语言支持** | 请求头 `Accept-Language: zh-CN` 控制返回内容语言 |
| **缓存策略** | 静态数据(球队/球员) CDN 缓存 1h；实时数据(比分) 不缓存 |
| **认证控制** | 公开数据无需 Token；用户私有数据需 Bearer Token |

---

## 二、API 全景路由图

```
                              ┌─────────────────────────┐
                              │    /api                  │
                              └────────────┬────────────┘
                                           │
        ┌──────────┬──────────┬───────────┼───────────┬──────────┬──────────┐
        ▼          ▼          ▼           ▼           ▼          ▼          ▼
    /matches   /teams    /players    /schedule   /standings  /predictions /favorites
    /stats     /news     /search     /notifications  /settings   /auth    /webhooks
                                                                          /cron

                              实时层 (Supabase Realtime)
                              ├── live-scores-channel
                              ├── match-events-channel
                              ├── notification-channel
                              └── chat-channel
```

---

## 三、REST API 路由详解

---

### 3.1 比赛相关 `/api/matches`

| 方法 | 路由 | 用途 | 认证 | 缓存 |
|------|------|------|------|------|
| `GET` | `/api/matches` | 获取比赛列表（分页）。支持筛选：`?status=live` 进行中 / `?date=2026-06-04` 按日期 / `?stage=group` 小组赛 / `?group=A` 按小组 / `?team_id=xxx` 按球队 / `?page=1&limit=20` 分页 | 否 | 30s |
| `GET` | `/api/matches/live` | 获取当前所有进行中比赛的摘要列表（比分+分钟+最新事件）。首页和比赛中心高频调用 | 否 | 不缓存 |
| `GET` | `/api/matches/today` | 获取今日全部比赛（含已结束+进行中+未开始）。首页"今日赛程"模块调用 | 否 | 30s |
| `GET` | `/api/matches/upcoming` | 获取未来 N 场比赛。`?days=7` 未来 7 天 | 否 | 5min |
| `GET` | `/api/matches/completed` | 获取已结束比赛列表。`?page=1&limit=20` 分页。历史比赛页调用 | 否 | 5min |
| `GET` | `/api/matches/[id]` | 获取单场比赛完整信息——对阵双方、比分、状态、场馆、裁判、转播商。比赛详情页核心接口 | 否 | 赛中不缓存 / 赛后 10min |
| `GET` | `/api/matches/[id]/events` | 获取单场比赛的完整事件时间线——进球/黄牌/红牌/换人/VAR。返回数组，按时间升序 | 否 | 赛中不缓存 / 赛后 10min |
| `GET` | `/api/matches/[id]/stats` | 获取单场比赛的主客队统计数据——控球率/射门/xG/传球/防守等 20+ 指标。返回 `{home: MatchStats, away: MatchStats}` | 否 | 赛中 10s / 赛后 10min |
| `GET` | `/api/matches/[id]/player-ratings` | 获取单场比赛的球员评分表——双方所有上场球员的评分+MVP 标记。按评分降序排列 | 否 | 赛后 10min |
| `GET` | `/api/matches/[id]/lineups` | 获取单场比赛的双方首发阵容 + 替补名单。含阵型图和球员位置 | 否 | 5min |
| `GET` | `/api/matches/[id]/xg-timeline` | 获取单场比赛的 xG 累计走势数据。返回按分钟的时间序列数组，供走势图渲染 | 否 | 赛后 10min |
| `GET` | `/api/matches/featured` | 获取焦点战列表（编辑标记 + AI 推荐）。首页 Hero 横幅调用，最多返回 5 场 | 否 | 1min |

**查询参数规范：**

```
/api/matches?status=live&stage=group&group=D&page=1&limit=20
/api/matches?date=2026-06-04
/api/matches?team_id=xxx          # 查询某支球队的全部比赛
/api/matches?from=2026-06-01&to=2026-06-07  # 日期范围
/api/matches?sort=date_asc        # date_asc / date_desc / most_goals
```

---

### 3.2 球队相关 `/api/teams`

| 方法 | 路由 | 用途 | 认证 | 缓存 |
|------|------|------|------|------|
| `GET` | `/api/teams` | 获取全部 48 支球队列表。`?group=A` 按小组筛选 / `?confederation=UEFA` 按洲际 / `?sort=fifa_rank` 按排名排序 | 否 | 1h |
| `GET` | `/api/teams/[id]` | 获取单支球队完整信息——身份/FIFA排名/主教练/队长/世界杯战绩。国家队详情页核心接口 | 否 | 10min |
| `GET` | `/api/teams/[id]/squad` | 获取球队 26 人大名单。按位置分组（GK/DEF/MID/FWD），含号码+球员名+俱乐部+年龄。阵容标签页调用 | 否 | 10min |
| `GET` | `/api/teams/[id]/stats` | 获取球队本届赛事的聚合统计数据——场均进球/控球率/传球成功率等 15+ 指标。球队统计快照调用 | 否 | 赛后更新 |
| `GET` | `/api/teams/[id]/schedule` | 获取球队本届世界杯的全部赛程（已赛+未赛），按时间排列。球队详情页赛程标签调用 | 否 | 5min |
| `GET` | `/api/teams/[id]/history` | 获取球队世界杯历史成绩时间线——从首届参赛到本届，每届的成绩和关键比赛。历史标签页调用 | 否 | 24h |
| `GET` | `/api/teams/[id]/form` | 获取球队最近 5 场比赛结果（含热身赛）。近期状态模块调用 | 否 | 赛后更新 |
| `GET` | `/api/teams/[id]/head-to-head` | 获取与指定对手的历史交锋记录。`?opponent_id=xxx` 必填。赛前前瞻区调用 | 否 | 1h |
| `GET` | `/api/teams/[id]/advancement-prob` | 获取球队的晋级概率路径——小组出线/16强/8强/4强/决赛/夺冠 6 级概率。晋级概率模块调用 | 否 | 1h |

---

### 3.3 球员相关 `/api/players`

| 方法 | 路由 | 用途 | 认证 | 缓存 |
|------|------|------|------|------|
| `GET` | `/api/players` | 获取全部球员列表。`?team_id=xxx` 按球队 / `?position=FWD` 按位置 / `?search=messi` 搜索 / `?page=1&limit=50` 分页 | 否 | 1h |
| `GET` | `/api/players/[id]` | 获取单名球员完整信息——身份/身体数据/俱乐部/国家队生涯/能力雷达图。球员详情页核心接口 | 否 | 10min |
| `GET` | `/api/players/[id]/stats` | 获取球员本届赛事的聚合个人数据——出场/进球/助攻/射门/传球/跑动等。球员数据面板调用 | 否 | 赛后更新 |
| `GET` | `/api/players/[id]/match-log` | 获取球员本届赛事每场比赛的个人表现数据。比赛日志列表调用，按日期倒序 | 否 | 赛后更新 |
| `GET` | `/api/players/[id]/honors` | 获取球员职业生涯主要荣誉列表——世界杯/洲际杯/俱乐部/个人奖项。荣誉标签页调用 | 否 | 24h |
| `GET` | `/api/players/[id]/similar` | 获取与当前球员风格相似的其他球员（AI 计算）。返回 Top 5 + 相似度百分比。相似球员推荐区调用 | 否 | 1h |
| `GET` | `/api/players/compare` | 球员对比。`?ids=id1,id2` 必填。返回两名球员的雷达图叠加数据 + 统计并排对比表 | 否 | 10min |
| `GET` | `/api/players/top-scorers` | 射手榜 Top 20。`?stage=all` 全部/小组赛/淘汰赛 | 否 | 赛后更新 |
| `GET` | `/api/players/top-assists` | 助攻榜 Top 20 | 否 | 赛后更新 |
| `GET` | `/api/players/top-rated` | 场均评分榜 Top 20。`?min_minutes=90` 至少打满 1 场 | 否 | 赛后更新 |

---

### 3.4 赛程相关 `/api/schedule`

| 方法 | 路由 | 用途 | 认证 | 缓存 |
|------|------|------|------|------|
| `GET` | `/api/schedule` | 获取全量赛程（104 场比赛），支持多重筛选：`?date=2026-06-04` / `?stage=group` / `?group=D` / `?team_id=xxx` | 否 | 5min |
| `GET` | `/api/schedule/today` | 获取今日赛程摘要——日期+当天全部比赛。首页"今日赛程"和赛程中心调用 | 否 | 1min |
| `GET` | `/api/schedule/tomorrow` | 获取明日赛程摘要 | 否 | 5min |
| `GET` | `/api/schedule/this-week` | 获取本周（周一~周日）全部赛程 | 否 | 5min |
| `GET` | `/api/schedule/date/[date]` | 获取指定日期的全部比赛。`date` 格式：YYYY-MM-DD | 否 | 5min |
| `GET` | `/api/schedule/team/[teamId]` | 获取指定球队的完整赛程 | 否 | 5min |
| `GET` | `/api/schedule/calendar` | 获取赛程日历视图数据。返回按月分组的比赛日期+场次数数组 | 否 | 1h |
| `GET` | `/api/schedule/dates-with-matches` | 获取所有有比赛的日期列表。返回 `["2026-06-03","2026-06-04",...]`。日期导航条渲染用 | 否 | 1h |

---

### 3.5 积分榜相关 `/api/standings`

| 方法 | 路由 | 用途 | 认证 | 缓存 |
|------|------|------|------|------|
| `GET` | `/api/standings/groups` | 获取全部 12 个小组的积分排名。返回 `{ groups: [{letter, standings[]}] }` | 否 | 赛后更新 |
| `GET` | `/api/standings/groups/[letter]` | 获取指定小组的积分排名。`letter` 取值 A-L | 否 | 赛后更新 |
| `GET` | `/api/standings/bracket` | 获取淘汰赛晋级图完整数据——从 1/16 决赛到决赛的所有节点和晋级关系。返回树状结构 | 否 | 赛后更新 |
| `GET` | `/api/standings/third-place` | 获取 12 个小组第三名排名对比（用于计算哪 8 支晋级） | 否 | 赛后更新 |

---

### 3.6 预测相关 `/api/predictions`

| 方法 | 路由 | 用途 | 认证 | 缓存 |
|------|------|------|------|------|
| `GET` | `/api/predictions` | 获取预测列表。`?type=champion` 按类型 / `?match_id=xxx` 某场比赛 / `?source=ai` 仅 AI 预测 | 否 | AI: 1h / User: 不缓存 |
| `GET` | `/api/predictions/champion` | 获取 48 队夺冠概率排名——每队夺冠概率+趋势箭头。夺冠预测页 TOP 5 横幅+完整排名调用 | 否 | 1h |
| `GET` | `/api/predictions/advancement` | 获取全部球队的晋级概率梯度数据——小组出线/16强/8强/4强/决赛/夺冠 6 级概率矩阵。热力图渲染用 | 否 | 1h |
| `GET` | `/api/predictions/bracket` | 获取预测晋级路线图数据——淘汰赛每场对阵的胜负概率。预测晋级图渲染用 | 否 | 1h |
| `GET` | `/api/predictions/match/[id]` | 获取单场比赛的 AI 预测——胜负概率(主/平/客)、最可能比分 Top 3、预期进球、置信度、关键因素分析。AI 分析中心"今日预测"调用 | 否 | 赛中不缓存 |
| `GET` | `/api/predictions/golden-boot` | 获取金靴奖预测 Top 10——预期最终进球+概率。AI 分析中心"金靴预测"调用 | 否 | 1h |
| `GET` | `/api/predictions/accuracy` | 获取 AI 模型的历史预测准确率数据——按赛事+按预测类型+综合。模型信任度展示用 | 否 | 1h |
| `POST` | `/api/predictions` | 提交用户预测。请求体：`{type, match_id?, team_id?, player_id?, predicted_winner?, predicted_home_score?, predicted_away_score?}` | ✅ 必填 | — |
| `GET` | `/api/predictions/user` | 获取当前用户的预测历史——已结算/未结算。我的预测页面调用 | ✅ 必填 | 不缓存 |
| `GET` | `/api/predictions/leaderboard` | 获取用户预测准确率排行榜 Top 100。`?page=1&limit=20` | 否 | 10min |

---

### 3.7 收藏相关 `/api/favorites` (🔒 需认证)

| 方法 | 路由 | 用途 | 认证 | 缓存 |
|------|------|------|------|------|
| `GET` | `/api/favorites` | 获取当前用户全部收藏。`?type=team` 按类型筛选 / `?page=1&limit=50` | ✅ 必填 | 不缓存 |
| `POST` | `/api/favorites` | 添加收藏。请求体：`{target_type, target_id, notes?}` | ✅ 必填 | — |
| `DELETE` | `/api/favorites/[id]` | 取消收藏。`id` 为收藏记录 ID | ✅ 必填 | — |
| `PUT` | `/api/favorites/[id]` | 更新收藏（备注/排序）。请求体：`{notes?, sort_order?}` | ✅ 必填 | — |
| `GET` | `/api/favorites/check` | 检查是否已收藏。`?target_type=team&target_id=xxx`。返回 `{isFavorited: true/false, favoriteId: ...}` | ✅ 必填 | 不缓存 |
| `PUT` | `/api/favorites/reorder` | 批量更新收藏排序。请求体：`{items: [{id, sort_order}]}` | ✅ 必填 | — |

---

### 3.8 通知相关 `/api/notifications` (🔒 需认证)

| 方法 | 路由 | 用途 | 认证 | 缓存 |
|------|------|------|------|------|
| `GET` | `/api/notifications` | 获取当前用户通知列表。`?is_read=false` 仅未读 / `?type=goal` 按类型 / `?page=1&limit=20` | ✅ 必填 | 不缓存 |
| `GET` | `/api/notifications/unread-count` | 获取未读通知数量。`{count: 5}`。顶部通知图标角标调用 | ✅ 必填 | 不缓存 |
| `PUT` | `/api/notifications/[id]/read` | 标记单条通知为已读 | ✅ 必填 | — |
| `PUT` | `/api/notifications/read-all` | 一键全部标记为已读 | ✅ 必填 | — |
| `DELETE` | `/api/notifications/[id]` | 删除单条通知 | ✅ 必填 | — |
| `POST` | `/api/notifications/subscribe` | 注册浏览器推送订阅。请求体：`{endpoint, keys: {p256dh, auth}}` | ✅ 必填 | — |
| `DELETE` | `/api/notifications/unsubscribe` | 取消推送订阅。请求体：`{endpoint}` | ✅ 必填 | — |

---

### 3.9 统计相关 `/api/stats`

| 方法 | 路由 | 用途 | 认证 | 缓存 |
|------|------|------|------|------|
| `GET` | `/api/stats/players` | 球员统计榜。`?category=goals` 射手榜 / `=assists` 助攻榜 / `=saves` 扑救榜 / `=distance` 跑动榜 / `=passes` 传球榜 / `=tackles` 抢断榜 / `=rating` 评分榜。`?stage=all` 阶段筛选 / `?limit=20` | 否 | 赛后更新 |
| `GET` | `/api/stats/teams` | 球队统计榜。`?category=goals` 进球榜 / `=possession` 控球率榜 / `=pass_accuracy` 传球成功率榜 / `=clean_sheets` 零封榜 / `=conversion` 射门转化率榜 / `=distance` 跑动榜 | 否 | 赛后更新 |
| `GET` | `/api/stats/overview` | 赛事总览快照——总进球/总比赛/射手王/助攻王/零封王。首页数据快照区调用 | 否 | 1min |

---

### 3.10 搜索相关 `/api/search`

| 方法 | 路由 | 用途 | 认证 | 缓存 |
|------|------|------|------|------|
| `GET` | `/api/search` | 全局搜索。`?q=messi` 搜索词 / `?type=player` 限定类型 / `?limit=10`。返回分组结果：`{teams:[], players:[], matches:[], news:[]}` | 否 | 1min |
| `GET` | `/api/search/suggestions` | 搜索自动补全建议。`?q=me`。返回 Top 5 建议项（含类型标识）。搜索框下拉面板调用 | 否 | 30s |
| `GET` | `/api/search/hot` | 热门搜索词 Top 10——当前平台上的热搜（球队名/球星名） | 否 | 5min |

---

### 3.11 新闻相关 `/api/news`

| 方法 | 路由 | 用途 | 认证 | 缓存 |
|------|------|------|------|------|
| `GET` | `/api/news` | 获取新闻列表。`?category=preview` 赛前前瞻 / `=report` 赛后战报 / `=injury` 伤病 / `=transfer` 转会 / `=official` 官方 / `?tag=argentina` 按标签 / `?page=1&limit=20` | 否 | 5min |
| `GET` | `/api/news/[id]` | 获取单篇新闻完整内容——标题/正文/封面图/标签/关联比赛/关联球员/相关阅读 | 否 | 10min |
| `GET` | `/api/news/breaking` | 获取当前突发新闻列表（Breaking级别）。首页突发新闻滚动条调用。最多 5 条 | 否 | 30s |
| `GET` | `/api/news/featured` | 获取编辑精选的焦点故事。首页"焦点故事"区调用。最多 4 条 | 否 | 5min |

---

### 3.12 认证相关 `/api/auth`

| 方法 | 路由 | 用途 | 认证 | 缓存 |
|------|------|------|------|------|
| `POST` | `/api/auth/register` | 邮箱/手机注册。请求体：`{email?, phone?, password, nickname}` | 否 | — |
| `POST` | `/api/auth/login` | 邮箱/手机登录。请求体：`{email?, phone?, password}`。返回 JWT Token + 用户信息 | 否 | — |
| `POST` | `/api/auth/logout` | 登出，清除服务端 Session | ✅ 必填 | — |
| `GET` | `/api/auth/callback` | OAuth 回调处理（Google/Apple/X/微信）。由 Supabase Auth 处理 | 否 | — |
| `POST` | `/api/auth/reset-password` | 发送密码重置邮件。请求体：`{email}` | 否 | — |
| `GET` | `/api/auth/me` | 获取当前登录用户信息。Token 验证 + 返回用户资料和偏好 | ✅ 必填 | 不缓存 |

---

### 3.13 设置相关 `/api/settings` (🔒 需认证)

| 方法 | 路由 | 用途 | 认证 | 缓存 |
|------|------|------|------|------|
| `GET` | `/api/settings` | 获取当前用户全部设置——个人资料+显示偏好+通知偏好+隐私设置 | ✅ 必填 | 不缓存 |
| `PUT` | `/api/settings/profile` | 更新个人资料——昵称/头像/简介 | ✅ 必填 | — |
| `PUT` | `/api/settings/display` | 更新显示偏好——主题/语言/时区/数据单位 | ✅ 必填 | — |
| `PUT` | `/api/settings/notifications` | 更新通知偏好——14 种通知类型的开关+渠道+提前时间 | ✅ 必填 | — |
| `PUT` | `/api/settings/privacy` | 更新隐私设置——可见性/搜索/数据共享 | ✅ 必填 | — |
| `DELETE` | `/api/settings/account` | 注销账号。请求体：`{confirmation: "DELETE"}`。软删除，30 天后悔期 | ✅ 必填 | — |

---

### 3.14 Webhook `/api/webhooks`

| 方法 | 路由 | 用途 | 认证 | 说明 |
|------|------|------|------|------|
| `POST` | `/api/webhooks/data-provider` | 接收外部数据供应商推送（Opta/StatsBomb）。实时比分/事件/统计数据回写数据库 | ✅ API Key | Header: `X-API-Key` |
| `POST` | `/api/webhooks/supabase` | 接收 Supabase Database Webhook。数据库变更后触发——如 MatchStats 更新→重新计算 TeamStats | ✅ Supabase Secret | 幂等处理 |

---

### 3.15 Cron Jobs `/api/cron`

| 方法 | 路由 | 用途 | 调度 | 说明 |
|------|------|------|------|------|
| `GET` | `/api/cron/update-predictions` | 每日 AI 预测模型更新——重新运行模型，写入新预测数据 | 每日 08:00 UTC | Vercel Cron Job 触发；Header: `Authorization: Bearer CRON_SECRET` |
| `GET` | `/api/cron/cleanup-expired` | 清理过期通知（expires_at < now）和过期缓存 | 每日 03:00 UTC | |
| `GET` | `/api/cron/sync-fifa-ranking` | 同步最新 FIFA 官方排名数据 | 每周一 08:00 UTC | |
| `GET` | `/api/cron/health-check` | 健康检查——数据管线状态/API 响应延迟/错误率汇总 | 每 15 分钟 | 接入监控告警 |

---

## 四、Supabase Realtime 实时频道

REST API 不适合"持续推送"场景，以下 4 条频道使用 Supabase Realtime（WebSocket）：

### 4.1 实时比分频道 `live-scores-channel`

| 属性 | 说明 |
|------|------|
| **订阅表** | `Matches` 表，filter: `status IN ('first_half','half_time','second_half','extra_time_first','extra_time_second','penalties')` |
| **推送事件** | UPDATE — 比分变化 / 状态变化(上半场→中场→下半场) / 比赛结束 |
| **推送数据** | `{match_id, home_score, away_score, status, current_minute, current_second}` |
| **消费方** | 首页"正在进行"卡片 · 比赛中心"进行中"列表 · 比赛详情页比分栏 · `useLiveStore` |
| **特点** | 最高频频道，每场比赛约 50-200 次更新 |

### 4.2 比赛事件频道 `match-events-channel`

| 属性 | 说明 |
|------|------|
| **订阅表** | `MatchEvents` 表，filter: `match_id = :current_match_id` |
| **推送事件** | INSERT — 新事件产生（进球/黄牌/红牌/换人/VAR/伤停补时/半场/全场） |
| **推送数据** | `{id, match_id, type, minute, second, player_id, assist_player_id?, description, ...}` |
| **消费方** | 比赛详情页事件时间线 · `useMatchEvents` hook |
| **特点** | 新事件插入时触发，约 15-30 次/场。新事件带高亮动画 |

### 4.3 通知频道 `notification-channel`

| 属性 | 说明 |
|------|------|
| **订阅表** | `Notifications` 表，filter: `user_id = :current_user_id AND is_sent = true` |
| **推送事件** | INSERT — 系统向用户发送新通知 |
| **推送数据** | `{id, type, title, body, link_type, link_id, priority}` |
| **消费方** | 浏览器 Service Worker → 桌面推送 · 页面内 Toast · `useNotificationStore` |
| **特点** | 用户专属频道，每人独立订阅；high 优先级触发桌面通知 |

### 4.4 聊天室频道 `chat-channel` (V2.0)

| 属性 | 说明 |
|------|------|
| **订阅表** | `ChatMessages` 表，filter: `match_id = :current_match_id` |
| **推送事件** | INSERT — 新聊天消息 |
| **推送数据** | `{id, user_id, nickname, avatar_url, content, type, created_at}` |
| **消费方** | 比赛详情页聊天室 · `useChatRoom` hook |

---

## 五、统一响应格式

### 5.1 成功响应

```
{
  "success": true,
  "data": { ... },           // 核心数据
  "meta": {                  // 元数据（列表接口）
    "page": 1,
    "limit": 20,
    "total": 104,
    "totalPages": 6
  }
}
```

### 5.2 错误响应

```
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",     // 错误码
    "message": "Match not found",  // 人类可读消息（多语言）
    "details": null           // 调试信息（仅开发环境）
  }
}
```

### 5.3 标准错误码

| 错误码 | HTTP 状态码 | 场景 |
|--------|------------|------|
| `BAD_REQUEST` | 400 | 请求参数不合法 |
| `UNAUTHORIZED` | 401 | 未登录或 Token 过期 |
| `FORBIDDEN` | 403 | 无权限访问 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `CONFLICT` | 409 | 资源冲突（重复收藏等） |
| `RATE_LIMITED` | 429 | 请求频率超限 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |
| `SERVICE_UNAVAILABLE` | 503 | 数据源暂时不可用 |

---

## 六、认证方案

```
┌─────────────────────────────────────────────────────────────────┐
│                       认证流程                                   │
│                                                                 │
│  客户端                          Supabase Auth                   │
│  ┌──────┐                       ┌──────────────┐                │
│  │用户   │── 邮箱/手机/第三方 ──▶│ 验证身份      │                │
│  │      │◀────── JWT Token ────│ 签发 Token   │                │
│  └──┬───┘                       └──────────────┘                │
│     │                                                            │
│     │ 每次 API 请求携带 Header:                                   │
│     │ Authorization: Bearer <JWT>                                │
│     │                                                            │
│     ▼                                                            │
│  ┌──────────┐                                                    │
│  │API Route │── 验证 JWT ──▶ supabase.auth.getUser()            │
│  │          │── 提取 user_id ──▶ 查询/操作数据                   │
│  └──────────┘                                                    │
│                                                                 │
│  公开接口: 无需 Token                                           │
│  私有接口: Authorization Header 必填，否则返回 401               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 七、缓存策略总览

```
┌─────────────────────────────────────────────────────────────────┐
│  数据类型        │ 缓存时长    │ 说明                             │
├─────────────────────────────────────────────────────────────────┤
│  实时比分/事件   │ 不缓存      │ 必须实时准确                     │
│  赛中统计数据    │ 10s         │ 短缓存防止瞬时请求洪峰            │
│  赛程(今天)      │ 1min        │ 倒计时和状态需较新               │
│  赛程(未来)      │ 5min        │ 变化概率低                       │
│  积分榜          │ 赛后更新    │ 只有比赛结束才变化                │
│  球队/球员基础信息│ 10min-1h   │ 基本不变                         │
│  历史数据        │ 24h         │ 完全不变                         │
│  AI 预测         │ 1h          │ 每日模型更新后刷新                │
│  用户私有数据    │ 不缓存      │ 个人数据实时准确                  │
│  新闻            │ 5-10min     │ 内容更新频率中等                  │
│  静态资源(CDN)   │ 7天         │ 国旗/队徽/照片等                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 八、API 路由索引

```
REST 路由 (共 68 个端点)

/api/matches (12)
  GET  /api/matches                       比赛列表
  GET  /api/matches/live                  进行中比赛
  GET  /api/matches/today                 今日比赛
  GET  /api/matches/upcoming              即将比赛
  GET  /api/matches/completed             已结束比赛
  GET  /api/matches/featured              焦点战
  GET  /api/matches/[id]                  比赛详情
  GET  /api/matches/[id]/events           事件时间线
  GET  /api/matches/[id]/stats            统计数据
  GET  /api/matches/[id]/player-ratings   球员评分
  GET  /api/matches/[id]/lineups          首发阵容
  GET  /api/matches/[id]/xg-timeline      xG走势

/api/teams (9)
  GET  /api/teams                         球队列表
  GET  /api/teams/[id]                    球队详情
  GET  /api/teams/[id]/squad              大名单
  GET  /api/teams/[id]/stats              统计数据
  GET  /api/teams/[id]/schedule           赛程
  GET  /api/teams/[id]/history            历史成绩
  GET  /api/teams/[id]/form               近期状态
  GET  /api/teams/[id]/head-to-head       历史交锋
  GET  /api/teams/[id]/advancement-prob   晋级概率

/api/players (10)
  GET  /api/players                       球员列表
  GET  /api/players/[id]                  球员详情
  GET  /api/players/[id]/stats            个人统计
  GET  /api/players/[id]/match-log        比赛日志
  GET  /api/players/[id]/honors           荣誉列表
  GET  /api/players/[id]/similar          相似球员
  GET  /api/players/compare               球员对比
  GET  /api/players/top-scorers           射手榜
  GET  /api/players/top-assists           助攻榜
  GET  /api/players/top-rated             评分榜

/api/schedule (8)
  GET  /api/schedule                      全量赛程
  GET  /api/schedule/today                今日赛程
  GET  /api/schedule/tomorrow             明日赛程
  GET  /api/schedule/this-week            本周赛程
  GET  /api/schedule/date/[date]          指定日期
  GET  /api/schedule/team/[teamId]        球队赛程
  GET  /api/schedule/calendar             日历视图
  GET  /api/schedule/dates-with-matches   比赛日列表

/api/standings (4)
  GET  /api/standings/groups              全部小组
  GET  /api/standings/groups/[letter]     指定小组
  GET  /api/standings/bracket             晋级图
  GET  /api/standings/third-place         第三名对比

/api/predictions (11)
  GET  /api/predictions                   预测列表
  GET  /api/predictions/champion          夺冠概率
  GET  /api/predictions/advancement       晋级梯度
  GET  /api/predictions/bracket           预测晋级图
  GET  /api/predictions/match/[id]        比赛预测
  GET  /api/predictions/golden-boot       金靴预测
  GET  /api/predictions/accuracy          模型准确率
  POST /api/predictions                   提交用户预测
  GET  /api/predictions/user              我的预测
  GET  /api/predictions/leaderboard       预测排行榜

/api/favorites (6) 🔒
  GET  /api/favorites                     收藏列表
  POST /api/favorites                     添加收藏
  DELETE /api/favorites/[id]              取消收藏
  PUT  /api/favorites/[id]                更新收藏
  GET  /api/favorites/check               检查收藏状态
  PUT  /api/favorites/reorder             批量排序

/api/notifications (7) 🔒
  GET  /api/notifications                 通知列表
  GET  /api/notifications/unread-count    未读计数
  PUT  /api/notifications/[id]/read       标记已读
  PUT  /api/notifications/read-all        全部已读
  DELETE /api/notifications/[id]          删除通知
  POST /api/notifications/subscribe       注册推送
  DELETE /api/notifications/unsubscribe   取消推送

/api/stats (3)
  GET  /api/stats/players                 球员统计榜
  GET  /api/stats/teams                   球队统计榜
  GET  /api/stats/overview                赛事总览

/api/search (3)
  GET  /api/search                        全局搜索
  GET  /api/search/suggestions            自动补全
  GET  /api/search/hot                    热搜词

/api/news (4)
  GET  /api/news                          新闻列表
  GET  /api/news/[id]                     新闻详情
  GET  /api/news/breaking                 突发新闻
  GET  /api/news/featured                 焦点故事

/api/auth (6)
  POST /api/auth/register                 注册
  POST /api/auth/login                    登录
  POST /api/auth/logout                   登出
  GET  /api/auth/callback                 OAuth回调
  POST /api/auth/reset-password           重置密码
  GET  /api/auth/me                       当前用户

/api/settings (6) 🔒
  GET  /api/settings                      全部设置
  PUT  /api/settings/profile              个人资料
  PUT  /api/settings/display              显示偏好
  PUT  /api/settings/notifications        通知偏好
  PUT  /api/settings/privacy              隐私设置
  DELETE /api/settings/account            注销账号

/api/webhooks (2)
  POST /api/webhooks/data-provider        数据供应商
  POST /api/webhooks/supabase             Supabase变更

/api/cron (4)
  GET  /api/cron/update-predictions       每日预测更新
  GET  /api/cron/cleanup-expired          过期清理
  GET  /api/cron/sync-fifa-ranking        排名同步
  GET  /api/cron/health-check             健康检查

Realtime 频道 (4)
  live-scores-channel                     实时比分推送
  match-events-channel                    比赛事件推送
  notification-channel                    用户通知推送
  chat-channel                            聊天室消息 (V2.0)
```

---

> **文档结束。** API 层共设计 68 个 REST 端点 + 4 条 WebSocket 实时频道，覆盖比赛/球队/球员/赛程/积分榜/预测/收藏/通知/统计/搜索/新闻/认证/设置 13 个业务域。
