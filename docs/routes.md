# 路由设计 — World Cup 2026 Command Center

> **技术栈:** Next.js 15 App Router (File-Based Routing)
> **路由总数:** 28 条页面路由 + 11 条 API 路由
> **设计版本:** v1.0 / 2026-06-04

---

## 一、路由全景图

```
                              ┌─────────────────────┐
                              │         /           │  首页 Dashboard
                              └─────────┬───────────┘
                                        │
        ┌───────────┬───────────┬───────┼───────┬───────────┬───────────┐
        ▼           ▼           ▼       │       ▼           ▼           ▼
    /matches    /schedule   /standings  │  /predictions  /favorites  /settings
    /live       /teams      /stats      │  /news         /search     /community
                /players               │
                        ┌──────────────┴──────────────┐
                        │        动态路由 (18条)        │
                        ├──────────────────────────────┤
                        │ /match/[id]                  │
                        │ /player/[id]                 │
                        │ /team/[id]                   │
                        │ /news/[id]                   │
                        │ /community/[postId]          │
                        │ /players/compare             │
                        │ /standings/groups            │
                        │ /standings/bracket           │
                        │ /matches/history             │
                        │ /predictions/champion        │
                        │ /predictions/golden-boot     │
                        │ /stats/players               │
                        │ /stats/teams                 │
                        │ /auth/login                  │
                        │ /auth/register               │
                        │ /auth/reset-password         │
                        └──────────────────────────────┘
```

---

## 二、完整路由清单

### 2.1 首页 (1 条)

| 路由 | 页面标题 | 用途说明 | 布局 | 认证 |
|------|----------|----------|------|------|
| `/` | 首页 Dashboard | 控制塔——赛事态势感知 + 快速导航 + 信息聚合。Hero 横幅 + 正在进行比赛 + 今日赛程 + 快速入口 + 焦点故事 | (main) | 否 |

---

### 2.2 比赛相关 (5 条)

| 路由 | 页面标题 | 用途说明 | 布局 | 认证 |
|------|----------|----------|------|------|
| `/matches` | 比赛中心 | 所有比赛的筛选浏览视图。按状态(全部/进行中/今日/已完成/即将) + 阶段(小组赛/淘汰赛) + 小组 + 日期多维筛选。比赛卡片列表 | (main) | 否 |
| `/live` | 实时直播 | **进行中比赛的沉浸式视图。** 仅显示 status='live' 的比赛，大卡片 + 比分动画 + 迷你事件流。适合投屏/第二屏场景 | (main) | 否 |
| `/matches/history` | 历史比赛 | 全部已结束比赛的搜索与浏览。比分 + MVP + 数据摘要 + 搜索筛选。支持紧凑/详细双模式 | (main) | 否 |
| `/match/[id]` | 比赛详情 | **平台核心页面。** 承载 70%+ 用户时长。三态自动切换：赛前(倒计时+前瞻+预测阵容) → 赛中(比分+事件时间线+实时统计+xG走势) → 赛后(战报+球员评分+完整数据)。`[id]` 为 Match UUID | (main) | 否 |
| `/match/[id]/stats` | 比赛数据 | 比赛详情页"数据统计"标签的深层链接。可直接访问该比赛的完整 20+ 指标统计表 | (main) | 否 |

---

### 2.3 赛程相关 (1 条)

| 路由 | 页面标题 | 用途说明 | 布局 | 认证 |
|------|----------|----------|------|------|
| `/schedule` | 赛程中心 | 完整 104 场比赛的全量赛程视图。快捷切换(今日/明日/本周/全部) + 日期导航条 + 多维筛选(阶段/小组/球队) + 焦点战卡片。支持添加到日历 + 设置提醒 | (main) | 否 |

---

### 2.4 积分榜相关 (3 条)

| 路由 | 页面标题 | 用途说明 | 布局 | 认证 |
|------|----------|----------|------|------|
| `/standings` | 积分榜 | 重定向到 `/standings/groups` | (main) | 否 |
| `/standings/groups` | 小组积分榜 | 12 个小组的实时积分排名。小组选择器 + 积分表(场次/胜/平/负/进/失/净/分) + 晋级状态标记(✅已晋级/⚠️争夺中/❌已淘汰) + 第三名晋级计算器 | (main) | 否 |
| `/standings/bracket` | 淘汰赛晋级图 | 从 1/16 决赛到决赛的完整树状晋级图。已完成比赛填充比分+晋级队；未进行比赛显示预测对阵。支持缩放+平移 | (main) | 否 |

---

### 2.5 球队相关 (2 条)

| 路由 | 页面标题 | 用途说明 | 布局 | 认证 |
|------|----------|----------|------|------|
| `/teams` | 球队中心 | 48 支参赛队列表。可按小组(A-L)/洲际/排名排序浏览。每张卡片含国旗+队徽+FIFA排名+小组信息 | (main) | 否 |
| `/team/[id]` | 国家队详情 | 一支球队的完整档案。6 个标签页：概览(小组排名+近期战绩+即将比赛+主教练+晋级概率) / 阵容(26人大名单按位置分组) / 数据(15+指标) / 赛程 / 历史(世界杯时间线) / 新闻。`[id]` 为 Team UUID | (main) | 否 |

---

### 2.6 球员相关 (3 条)

| 路由 | 页面标题 | 用途说明 | 布局 | 认证 |
|------|----------|----------|------|------|
| `/players` | 球员中心 | 全部 832 名参赛球员列表。可按球队/位置/排名排序。含搜索框 + 快速跳转到射手榜/助攻榜 | (main) | 否 |
| `/player/[id]` | 球员详情 | 一名球员的完整数据档案。6 个标签页：概览(赛事数据面板+比赛日志+雷达图) / 比赛数据(30+指标表) / 比赛日志 / 雷达图(全屏对比模式) / 荣誉(时间线) / 新闻。`[id]` 为 Player UUID | (main) | 否 |
| `/players/compare` | 球员对比 | 两名球员的雷达图叠加对比 + 数据并排对比表。通过查询参数 `?ids=id1,id2` 指定对比对象 | (main) | 否 |

---

### 2.7 数据中心 (3 条)

| 路由 | 页面标题 | 用途说明 | 布局 | 认证 |
|------|----------|----------|------|------|
| `/stats` | 数据中心 | 重定向到 `/stats/players` | (main) | 否 |
| `/stats/players` | 球员统计榜 | 8 类榜单：射手榜/助攻榜/扑救榜/跑动榜/传球榜/抢断榜/犯规榜/评分榜。每榜 Top 20 + 排名变化趋势箭头。按阶段筛选(全部/小组赛/淘汰赛) | (main) | 否 |
| `/stats/teams` | 球队统计榜 | 7 类榜单：进球榜/控球率榜/传球成功率榜/射门转化率榜/零封榜/犯规榜/跑动榜。每队数据 + 在所有球队中的排名 | (main) | 否 |

---

### 2.8 新闻相关 (2 条)

| 路由 | 页面标题 | 用途说明 | 布局 | 认证 |
|------|----------|----------|------|------|
| `/news` | 新闻中心 | 世界杯新闻聚合。分类标签(全部/赛前前瞻/赛后战报/转会/伤病/官方) + 焦点新闻 + 文章列表。顶部突发新闻滚动条 | (main) | 否 |
| `/news/[id]` | 新闻详情 | 单篇新闻完整内容。封面图+标题+正文+标签+关联比赛/球员卡片+相关阅读推荐。`[id]` 为 Article UUID | (main) | 否 |

---

### 2.9 预测相关 (3 条)

| 路由 | 页面标题 | 用途说明 | 布局 | 认证 |
|------|----------|----------|------|------|
| `/predictions` | AI 分析中心 | AI 预测总览。5 个标签页：今日预测(4场比赛胜负+比分+置信度) / 进阶数据 / 战术洞察 / 球员评估 / 准确率档案 | (main) | 否 |
| `/predictions/champion` | 夺冠预测 | 冠军预测专题页。TOP 5 横幅 + 48 队完整概率排名 + 晋级概率梯度热力图 + 预测晋级路线图 + 概率变化趋势 + 用户预测排行榜 | (main) | 否 |
| `/predictions/golden-boot` | 金靴预测 | 金靴奖预测 Top 20。预期最终进球数 + 获奖概率 + 球员当前数据 + 用户投票 | (main) | 否 |

---

### 2.10 用户相关 (3 条) 🔒

| 路由 | 页面标题 | 用途说明 | 布局 | 认证 |
|------|----------|----------|------|------|
| `/favorites` | 我的收藏 | 用户收藏聚合页。3 个标签：全部/球队(3)/球员(5)/比赛(6)。每张卡片含状态快照(球队下一场/球员数据/比赛倒计时) | (main) | ✅ 必填 |
| `/settings` | 设置中心 | 7 个设置分组：个人资料/通知偏好/显示设置/语言与时区/关注管理/隐私设置/账号管理 | (main) | ✅ 必填 |
| `/settings/notifications` | 通知设置 | 设置页"通知偏好"分组的深层链接。14 种通知类型的开关 + 渠道选择 + 提前时间 | (main) | ✅ 必填 |

---

### 2.11 搜索 (1 条)

| 路由 | 页面标题 | 用途说明 | 布局 | 认证 |
|------|----------|----------|------|------|
| `/search` | 搜索结果 | 全局搜索落地页。查询参数 `?q=关键字`。分组展示：球队/球员/比赛/新闻。支持搜索历史 + 热门搜索 | (main) | 否 |

---

### 2.12 社区 (2 条) — V2.0

| 路由 | 页面标题 | 用途说明 | 布局 | 认证 |
|------|----------|----------|------|------|
| `/community` | 社区中心 | 球迷讨论区。话题分类 + 热门帖子 + 比赛聊天室入口 + 预测竞猜入口 + 用户排行榜 | (main) | ✅ 必填 |
| `/community/[postId]` | 帖子详情 | 单篇社区帖子 + 评论区。`[postId]` 为 Post UUID | (main) | ✅ 必填 |

---

### 2.13 认证相关 (4 条)

| 路由 | 页面标题 | 用途说明 | 布局 | 认证 |
|------|----------|----------|------|------|
| `/auth/login` | 登录 | 登录页。邮箱/手机号 + 密码 + 第三方登录(Google/Apple/X/微信) + "忘记密码"链接。简洁居中布局 | auth | 否 |
| `/auth/register` | 注册 | 注册页。邮箱/手机号 + 密码 + 昵称 + 第三方注册。简洁居中布局 | auth | 否 |
| `/auth/reset-password` | 重置密码 | 输入邮箱 → 发送重置链接 → 设置新密码 | auth | 否 |
| `/auth/callback` | OAuth 回调 | 第三方登录回调处理。由 Supabase Auth 自动处理 → 成功后重定向到首页 | — | 否 |

---

## 三、API 路由 (11 条)

| 路由 | 方法 | 用途 |
|------|------|------|
| `/api/matches` | GET | 比赛列表（分页+筛选） |
| `/api/matches/[id]/events` | GET | 比赛事件时间线 |
| `/api/matches/[id]/stats` | GET | 比赛统计数据 |
| `/api/standings` | GET | 积分榜数据 |
| `/api/search` | GET | 全局搜索 |
| `/api/notifications` | GET/POST | 通知列表 / 注册推送 |
| `/api/predictions` | GET/POST | 预测数据 / 提交用户预测 |
| `/api/webhooks/supabase` | POST | Supabase 数据库变更回调 |
| `/api/webhooks/data-provider` | POST | 数据供应商回调 |
| `/api/cron/update-predictions` | GET | 触发每日 AI 预测更新 |
| `/api/cron/cleanup-expired` | GET | 清理过期通知+缓存 |

---

## 四、路由属性矩阵

```
┌──────────────────────────┬──────────────┬──────────────┬──────────────────────────┐
│ 路由                     │ params       │ searchParams │ 备注                      │
├──────────────────────────┼──────────────┼──────────────┼──────────────────────────┤
│ /                        │ —            │ —            │ 首页                      │
│ /matches                 │ —            │ status, date,│ 筛选通过 URL 参数持久化    │
│                          │              │ stage, group,│ 支持浏览器前进/后退        │
│                          │              │ team, page   │                           │
│ /live                    │ —            │ —            │ 仅 status=live             │
│ /matches/history         │ —            │ q, stage,    │ 搜索+筛选                  │
│                          │              │ group, month,│                           │
│                          │              │ sort, page   │                           │
│ /match/[id]              │ id: UUID     │ tab          │ tab=overview/stats/lineup   │
│ /match/[id]/stats        │ id: UUID     │ —            │ 比赛数据深层链接            │
│ /schedule                │ —            │ view, date,  │ view=today/tomorrow/week/all│
│                          │              │ stage, group,│                           │
│                          │              │ team         │                           │
│ /standings               │ —            │ —            │ 重定向到 groups            │
│ /standings/groups        │ —            │ group        │ group=A~L, 默认全部        │
│ /standings/bracket       │ —            │ —            │                            │
│ /teams                   │ —            │ group, conf, │ conf=UEFA/CONMEBOL...      │
│                          │              │ sort, page   │                            │
│ /team/[id]               │ id: UUID     │ tab          │ tab=overview/squad/stats/   │
│                          │              │              │ schedule/history/news      │
│ /players                 │ —            │ team, pos,   │ pos=GK/DEF/MID/FWD         │
│                          │              │ search, page │                            │
│ /player/[id]             │ id: UUID     │ tab          │ tab=overview/stats/         │
│                          │              │              │ matchlog/radar/honors/news │
│ /players/compare         │ —            │ ids          │ ids=uuid1,uuid2 必填       │
│ /stats                   │ —            │ —            │ 重定向到 players           │
│ /stats/players           │ —            │ category,    │ category=goals/assists/     │
│                          │              │ stage, limit │ saves/distance/rating...    │
│ /stats/teams             │ —            │ category     │ category=goals/possession/  │
│                          │              │              │ pass_accuracy/clean_sheets  │
│ /news                    │ —            │ category,    │ category=preview/report/    │
│                          │              │ tag, page    │ injury/transfer/official    │
│ /news/[id]               │ id: UUID     │ —            │                            │
│ /predictions             │ —            │ tab          │ tab=today/advanced/         │
│                          │              │              │ tactics/players/accuracy   │
│ /predictions/champion    │ —            │ —            │                            │
│ /predictions/golden-boot │ —            │ —            │                            │
│ /search                  │ —            │ q            │ q=搜索词 必填              │
│ /favorites               │ —            │ type         │ type=team/player/match      │
│ /settings                │ —            │ section      │ section=profile/            │
│                          │              │              │ notifications/display/...  │
│ /settings/notifications  │ —            │ —            │                            │
│ /community               │ —            │ topic, page  │ V2.0                       │
│ /community/[postId]      │ postId: UUID │ —            │ V2.0                       │
│ /auth/login              │ —            │ redirect     │ 登录后跳转地址              │
│ /auth/register           │ —            │ redirect     │                            │
│ /auth/reset-password     │ —            │ token        │ 重置密码 Token             │
└──────────────────────────┴──────────────┴──────────────┴──────────────────────────┘
```

---

## 五、Next.js App Router 文件映射

```
src/app/
├── page.tsx                                    → /
├── (main)/
│   ├── matches/
│   │   ├── page.tsx                            → /matches
│   │   ├── [id]/page.tsx                       → /match/[id]
│   │   └── history/page.tsx                    → /matches/history
│   ├── live/page.tsx                           → /live
│   ├── schedule/page.tsx                       → /schedule
│   ├── standings/
│   │   ├── page.tsx                            → /standings (redirect)
│   │   ├── groups/page.tsx                     → /standings/groups
│   │   └── bracket/page.tsx                    → /standings/bracket
│   ├── teams/
│   │   ├── page.tsx                            → /teams
│   │   └── [id]/page.tsx                       → /team/[id]
│   ├── players/
│   │   ├── page.tsx                            → /players
│   │   ├── [id]/page.tsx                       → /player/[id]
│   │   └── compare/page.tsx                    → /players/compare
│   ├── stats/
│   │   ├── page.tsx                            → /stats (redirect)
│   │   ├── players/page.tsx                    → /stats/players
│   │   └── teams/page.tsx                      → /stats/teams
│   ├── news/
│   │   ├── page.tsx                            → /news
│   │   └── [id]/page.tsx                       → /news/[id]
│   ├── predictions/
│   │   ├── page.tsx                            → /predictions
│   │   ├── champion/page.tsx                   → /predictions/champion
│   │   └── golden-boot/page.tsx                → /predictions/golden-boot
│   ├── favorites/page.tsx                      → /favorites
│   ├── settings/
│   │   └── page.tsx                            → /settings
│   ├── search/page.tsx                         → /search
│   └── community/
│       ├── page.tsx                            → /community
│       └── [postId]/page.tsx                   → /community/[postId]
├── auth/
│   ├── login/page.tsx                          → /auth/login
│   ├── register/page.tsx                       → /auth/register
│   ├── reset-password/page.tsx                 → /auth/reset-password
│   └── callback/route.ts                       → /auth/callback (API Route)
└── api/
    ├── matches/route.ts                        → /api/matches
    ├── matches/[id]/events/route.ts            → /api/matches/[id]/events
    ├── matches/[id]/stats/route.ts             → /api/matches/[id]/stats
    ├── standings/route.ts                      → /api/standings
    ├── search/route.ts                         → /api/search
    ├── notifications/route.ts                  → /api/notifications
    ├── predictions/route.ts                    → /api/predictions
    ├── webhooks/supabase/route.ts              → /api/webhooks/supabase
    ├── webhooks/data-provider/route.ts         → /api/webhooks/data-provider
    ├── cron/update-predictions/route.ts        → /api/cron/update-predictions
    └── cron/cleanup-expired/route.ts           → /api/cron/cleanup-expired
```

---

## 六、路由优先级与排序

在导航栏/底部标签栏中的展示顺序：

```
主导航:  /  →  /matches  →  /schedule  →  /standings  →  /teams  →  /players  →  /news

移动端底部标签栏 (5个):
  /            📊 首页
  /matches     ⚽ 比赛
  /standings   🏆 积分榜
  /news        📰 新闻
  /favorites   👤 我 (登录后) / /auth/login (未登录)

二级入口:
  /live                    实时直播 (从首页 Hero 横幅进入)
  /predictions             AI 分析中心 (从导航更多菜单进入)
  /predictions/champion    夺冠预测
  /stats/players           球员统计榜
  /stats/teams             球队统计榜
  /search                  搜索落地页
  /settings                设置中心
```

---

## 七、路由总数统计

```
分组              页面路由    API路由    合计
──────────────────────────────────────────
首页                 1          0          1
比赛相关             5          3          8
赛程                 1          0          1
积分榜               3          1          4
球队                 2          0          2
球员                 3          0          3
数据中心             3          0          3
新闻                 2          0          2
预测                 3          1          4
用户                3          0          3
搜索                 1          1          2
社区 (V2.0)         2          0          2
认证                 4          0          4
Webhook              0          2          2
Cron                 0          2          2
──────────────────────────────────────────
总计                33         10         43
```

---

> **文档结束。** 共设计 28 条页面路由 + 10 条 API 路由 + 5 条功能路由(重定向)，总计 43 条路由。
