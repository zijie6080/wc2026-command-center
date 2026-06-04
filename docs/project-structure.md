# 项目目录结构设计 — World Cup 2026 Command Center

> **技术栈:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Shadcn/ui · Supabase
> **架构模式:** Feature-Based + Service Layer + Real-Time
> **设计版本:** v1.0 / 2026-06-04

---

## 一、设计原则

| 原则 | 说明 |
|------|------|
| **按功能域分层** | `features/` 下每个功能模块独立，包含该模块的组件、hooks、types |
| **共享层抽离** | 跨模块复用的 UI 组件、业务服务、工具函数放入 `shared/` |
| **服务层隔离数据** | `services/` 封装 Supabase 调用和外部 API，页面组件不直接访问数据层 |
| **实时数据单独管理** | `realtime/` 管理 WebSocket 订阅和 Supabase Realtime，与 REST 请求分离 |
| **类型安全贯穿** | `types/` 统一类型定义，从数据库类型到 API 响应类型完整覆盖 |

---

## 二、完整目录树

```
world-cup-2026/
│
├── .github/                            # GitHub CI/CD + 模板
│   ├── workflows/                      # GitHub Actions 工作流
│   │   ├── ci.yml                      # 类型检查 + Lint + 测试
│   │   ├── preview.yml                 # Vercel Preview Deploy
│   │   └── cron-daily-predictions.yml  # 每日 AI 预测更新定时任务
│   └── ISSUE_TEMPLATE.md
│
├── supabase/                           # Supabase 本地开发 + 迁移
│   ├── migrations/                     # 数据库迁移文件（按时间戳命名）
│   │   ├── 001_create_teams.sql
│   │   ├── 002_create_players.sql
│   │   ├── 003_create_matches.sql
│   │   └── ...
│   ├── seed.sql                        # 种子数据（48队 + 832球员 + 104场比赛）
│   ├── config.toml                     # Supabase CLI 配置
│   └── schemas/                        # 数据库 Schema 定义（可选）
│
├── public/                             # 静态资源
│   ├── flags/                          # 国旗 SVG（48 个国家）
│   ├── crests/                         # 队徽 SVG（48 个足协）
│   ├── players/                        # 球员照片（832 张）
│   ├── venues/                         # 场馆图片（16 座）
│   ├── og/                             # Open Graph 社交分享卡片模板
│   ├── fonts/                          # 自托管字体
│   ├── locales/                        # 静态翻译 JSON 文件（i18n 备用）
│   │   ├── en.json
│   │   ├── zh.json
│   │   ├── es.json
│   │   ├── fr.json
│   │   ├── ar.json
│   │   └── pt.json
│   ├── manifest.json                   # PWA Manifest
│   ├── sw.js                           # Service Worker（离线缓存）
│   ├── robots.txt
│   └── favicon.ico
│
├── src/                                # 应用源代码
│   │
│   ├── app/                            # Next.js 15 App Router（路由 + 页面）
│   │   ├── layout.tsx                  # 根布局：HTML结构 + 全局Provider
│   │   ├── page.tsx                    # 首页 `/`
│   │   ├── loading.tsx                 # 首页加载骨架屏
│   │   ├── error.tsx                   # 全局错误边界
│   │   ├── not-found.tsx               # 404 页面
│   │   ├── globals.css                 # 全局样式（Tailwind 指令 + CSS变量）
│   │   │
│   │   ├── (main)/                     # 主布局组（含导航栏 + 页脚）
│   │   │   ├── layout.tsx              # 主布局：TopNavbar + Footer
│   │   │   │
│   │   │   ├── matches/               # 比赛中心 `/matches`
│   │   │   │   ├── page.tsx            # 比赛列表页
│   │   │   │   ├── loading.tsx         # 骨架屏
│   │   │   │   ├── [id]/              # 比赛详情 `/matches/:id`
│   │   │   │   │   ├── page.tsx        # 比赛详情页（赛前/赛中/赛后）
│   │   │   │   │   └── loading.tsx
│   │   │   │   └── history/           # 历史比赛 `/matches/history`
│   │   │   │       ├── page.tsx
│   │   │   │       └── loading.tsx
│   │   │   │
│   │   │   ├── schedule/              # 赛程中心 `/schedule`
│   │   │   │   ├── page.tsx
│   │   │   │   └── loading.tsx
│   │   │   │
│   │   │   ├── standings/             # 积分榜 `/standings`
│   │   │   │   ├── page.tsx            # 重定向到 groups
│   │   │   │   ├── groups/            # 小组积分榜 `/standings/groups`
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── loading.tsx
│   │   │   │   └── bracket/           # 淘汰赛晋级图 `/standings/bracket`
│   │   │   │       ├── page.tsx
│   │   │   │       └── loading.tsx
│   │   │   │
│   │   │   ├── teams/                 # 球队中心 `/teams`
│   │   │   │   ├── page.tsx            # 球队列表页
│   │   │   │   ├── loading.tsx
│   │   │   │   └── [id]/              # 球队详情 `/teams/:id`
│   │   │   │       ├── page.tsx
│   │   │   │       └── loading.tsx
│   │   │   │
│   │   │   ├── players/               # 球员中心 `/players`
│   │   │   │   ├── page.tsx            # 球员列表页
│   │   │   │   ├── loading.tsx
│   │   │   │   ├── [id]/              # 球员详情 `/players/:id`
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── loading.tsx
│   │   │   │   └── compare/           # 球员对比 `/players/compare?id=...`
│   │   │   │       ├── page.tsx
│   │   │   │       └── loading.tsx
│   │   │   │
│   │   │   ├── stats/                 # 数据中心 `/stats`
│   │   │   │   ├── page.tsx            # 重定向到 players
│   │   │   │   ├── players/           # 球员统计榜 `/stats/players`
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── loading.tsx
│   │   │   │   └── teams/             # 球队统计榜 `/stats/teams`
│   │   │   │       ├── page.tsx
│   │   │   │       └── loading.tsx
│   │   │   │
│   │   │   ├── news/                  # 新闻中心 `/news`
│   │   │   │   ├── page.tsx
│   │   │   │   ├── loading.tsx
│   │   │   │   └── [id]/              # 新闻详情 `/news/:id`
│   │   │   │       ├── page.tsx
│   │   │   │       └── loading.tsx
│   │   │   │
│   │   │   ├── predictions/           # AI 预测中心 `/predictions`
│   │   │   │   ├── page.tsx            # 今日预测
│   │   │   │   ├── loading.tsx
│   │   │   │   ├── champion/          # 夺冠预测 `/predictions/champion`
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── loading.tsx
│   │   │   │   └── golden-boot/       # 金靴预测 `/predictions/golden-boot`
│   │   │   │       ├── page.tsx
│   │   │   │       └── loading.tsx
│   │   │   │
│   │   │   ├── community/             # 社区中心 `/community` (V2.0)
│   │   │   │   ├── page.tsx
│   │   │   │   └── [postId]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── favorites/             # 我的收藏 `/favorites`
│   │   │   │   ├── page.tsx
│   │   │   │   └── loading.tsx
│   │   │   │
│   │   │   ├── settings/              # 设置中心 `/settings`
│   │   │   │   ├── page.tsx
│   │   │   │   └── loading.tsx
│   │   │   │
│   │   │   └── search/                # 搜索结果 `/search?q=...`
│   │   │       ├── page.tsx
│   │   │       └── loading.tsx
│   │   │
│   │   ├── auth/                       # 认证路由组（无导航栏）
│   │   │   ├── layout.tsx              # 认证布局：简洁居中
│   │   │   ├── login/                  # 登录页 `/auth/login`
│   │   │   │   └── page.tsx
│   │   │   ├── register/               # 注册页 `/auth/register`
│   │   │   │   └── page.tsx
│   │   │   ├── callback/               # OAuth 回调 `/auth/callback`
│   │   │   │   └── route.ts            # API Route 处理 OAuth 回调
│   │   │   └── reset-password/         # 重置密码 `/auth/reset-password`
│   │   │       └── page.tsx
│   │   │
│   │   └── api/                        # API Routes（后端接口）
│   │       ├── matches/                # 比赛数据接口
│   │       │   └── [id]/
│   │       │       ├── events/route.ts # GET 比赛事件 / SSE 实时推送
│   │       │       └── stats/route.ts  # GET 比赛统计数据
│   │       ├── standings/route.ts      # GET 积分榜
│   │       ├── search/route.ts         # GET 全局搜索
│   │       ├── notifications/          # 通知接口
│   │       │   └── route.ts            # POST 注册推送 / GET 获取通知
│   │       ├── predictions/route.ts    # GET AI 预测数据
│   │       ├── webhooks/               # 外部 Webhook 接收
│   │       │   ├── supabase/route.ts   # Supabase 数据库变更回调
│   │       │   └── data-provider/route.ts # 数据供应商回调（Opta等）
│   │       └── cron/                   # Vercel Cron Jobs 触发
│   │           ├── update-predictions/route.ts
│   │           └── cleanup-expired/route.ts
│   │
│   ├── features/                        # 功能模块（按业务领域分组）
│   │   │
│   │   ├── match/                       # 比赛功能模块
│   │   │   ├── components/              # 比赛相关组件
│   │   │   │   ├── MatchCard.tsx         # 比赛卡片（4 种状态变体）
│   │   │   │   ├── MatchCardCompact.tsx  # 紧凑模式卡片
│   │   │   │   ├── MatchHero.tsx         # Hero 横幅区
│   │   │   │   ├── MatchScoreBar.tsx     # 比分状态栏（赛中/赛后/赛前）
│   │   │   │   ├── MatchSwitcher.tsx     # 比赛导航切换条
│   │   │   │   ├── MatchCountdown.tsx    # 开赛倒计时
│   │   │   │   ├── MatchClock.tsx        # 比赛时钟（精确到秒）
│   │   │   │   ├── EventTimeline.tsx     # 事件时间线（核心组件）
│   │   │   │   ├── EventCard.tsx         # 单个事件卡片（6种事件类型）
│   │   │   │   ├── EventFilter.tsx       # 事件类型筛选器
│   │   │   │   ├── LiveStatsPanel.tsx    # 实时统计面板（右侧边栏）
│   │   │   │   ├── XgTimeline.tsx        # xG 累计走势图
│   │   │   │   ├── MatchInfoCard.tsx     # 比赛信息卡片
│   │   │   │   ├── PlayerRatingTable.tsx # 赛后球员评分表
│   │   │   │   ├── PredictedLineup.tsx   # 预测首发阵型图
│   │   │   │   ├── HeadToHead.tsx        # 历史交锋记录
│   │   │   │   ├── MatchReport.tsx       # AI 赛后战报
│   │   │   │   ├── MatchHighlights.tsx   # 集锦视频列表
│   │   │   │   └── index.ts             # 统一导出
│   │   │   ├── hooks/
│   │   │   │   ├── useMatch.ts           # 获取单场比赛数据
│   │   │   │   ├── useMatchEvents.ts     # 订阅比赛事件（Supabase Realtime）
│   │   │   │   ├── useLiveMatches.ts     # 获取所有进行中比赛
│   │   │   │   ├── useMatchStats.ts      # 获取比赛统计
│   │   │   │   └── useMatchCountdown.ts  # 倒计时逻辑
│   │   │   ├── types.ts                  # 比赛模块类型定义
│   │   │   └── utils.ts                  # 比赛模块工具函数（比分格式化/状态判断）
│   │   │
│   │   ├── team/                         # 球队功能模块
│   │   │   ├── components/
│   │   │   │   ├── TeamHero.tsx           # 球队英雄区
│   │   │   │   ├── TeamCard.tsx           # 球队卡片
│   │   │   │   ├── TeamSquad.tsx          # 阵容展示（按位置分组）
│   │   │   │   ├── TeamStatsPanel.tsx     # 球队统计面板
│   │   │   │   ├── TeamHistory.tsx        # 世界杯历史时间线
│   │   │   │   ├── TeamSchedule.tsx       # 球队赛程列表
│   │   │   │   ├── CoachCard.tsx          # 主教练信息卡片
│   │   │   │   ├── GroupStandingTable.tsx # 小组积分表
│   │   │   │   ├── AdvancementProb.tsx    # 晋级概率展示
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useTeam.ts
│   │   │   │   ├── useTeamStats.ts
│   │   │   │   └── useTeamSquad.ts
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   │
│   │   ├── player/                       # 球员功能模块
│   │   │   ├── components/
│   │   │   │   ├── PlayerHero.tsx         # 球员英雄区
│   │   │   │   ├── PlayerCard.tsx         # 球员卡片
│   │   │   │   ├── PlayerRadar.tsx        # 能力雷达图
│   │   │   │   ├── PlayerStatsPanel.tsx   # 球员数据面板
│   │   │   │   ├── PlayerMatchLog.tsx     # 比赛日志列表
│   │   │   │   ├── PlayerHonors.tsx       # 荣誉时间线
│   │   │   │   ├── SimilarPlayers.tsx     # 相似球员推荐
│   │   │   │   ├── PlayerCompare.tsx      # 球员对比视图
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── usePlayer.ts
│   │   │   │   ├── usePlayerStats.ts
│   │   │   │   └── usePlayerCompare.ts
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   │
│   │   ├── schedule/                     # 赛程功能模块
│   │   │   ├── components/
│   │   │   │   ├── ScheduleCard.tsx       # 赛程卡片
│   │   │   │   ├── ScheduleCardFeatured.tsx # 焦点战卡片
│   │   │   │   ├── ScheduleCardCompact.tsx  # 紧凑模式卡片
│   │   │   │   ├── DateNavigator.tsx      # 日期导航条
│   │   │   │   ├── DateGroupHeader.tsx    # 日期分组标题
│   │   │   │   ├── WatchPlan.tsx          # 我的观赛计划侧边栏
│   │   │   │   ├── QuickStageFilter.tsx   # 按阶段快捷筛选
│   │   │   │   ├── QuickGroupFilter.tsx   # 按小组快捷筛选
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useSchedule.ts
│   │   │   │   └── useScheduleFilters.ts
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   │
│   │   ├── standing/                     # 积分榜功能模块
│   │   │   ├── components/
│   │   │   │   ├── GroupStandingsTable.tsx # 小组积分表
│   │   │   │   ├── GroupSelector.tsx       # 小组选择器
│   │   │   │   ├── BracketView.tsx         # 晋级图可视化
│   │   │   │   ├── BracketNode.tsx         # 晋级图节点
│   │   │   │   ├── ThirdPlaceCalculator.tsx# 第三名晋级计算器
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useStandings.ts
│   │   │   │   └── useBracket.ts
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   │
│   │   ├── prediction/                   # 预测功能模块
│   │   │   ├── components/
│   │   │   │   ├── ChampionTop5.tsx       # 夺冠TOP5横幅
│   │   │   │   ├── ChampionRanking.tsx    # 48队完整概率排名
│   │   │   │   ├── AdvancementHeatmap.tsx # 晋级概率梯度热力图
│   │   │   │   ├── PredictedBracket.tsx   # 预测晋级路线图
│   │   │   │   ├── MatchPredictionCard.tsx# 单场预测卡片
│   │   │   │   ├── DeepPrediction.tsx     # 焦点战深度预测
│   │   │   │   ├── GoldenBootRanking.tsx  # 金靴预测排名
│   │   │   │   ├── PredictionAccuracy.tsx # 预测准确率追踪
│   │   │   │   ├── UserPredictionRanking.tsx # 用户预测排行榜
│   │   │   │   ├── ModelInfoCard.tsx      # AI模型说明卡片
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── usePredictions.ts
│   │   │   │   ├── useChampionPrediction.ts
│   │   │   │   └── useUserPrediction.ts
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   │
│   │   ├── user/                         # 用户功能模块
│   │   │   ├── components/
│   │   │   │   ├── UserMenu.tsx            # 用户头像下拉菜单
│   │   │   │   ├── FavoritesList.tsx       # 收藏列表
│   │   │   │   ├── FavoriteCard.tsx        # 收藏卡片（球队/球员/比赛）
│   │   │   │   ├── NotificationPanel.tsx   # 通知面板
│   │   │   │   ├── NotificationItem.tsx    # 单条通知
│   │   │   │   ├── SettingsForm.tsx        # 设置表单容器
│   │   │   │   ├── ProfileSection.tsx      # 个人资料设置
│   │   │   │   ├── NotificationPrefs.tsx   # 通知偏好设置
│   │   │   │   ├── DisplaySettings.tsx     # 显示设置
│   │   │   │   ├── LanguageSettings.tsx    # 语言与时区设置
│   │   │   │   ├── PrivacySettings.tsx     # 隐私设置
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useUser.ts
│   │   │   │   ├── useFavorites.ts
│   │   │   │   ├── useNotifications.ts
│   │   │   │   └── useSettings.ts
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   │
│   │   ├── news/                         # 新闻功能模块
│   │   │   ├── components/
│   │   │   │   ├── NewsCard.tsx
│   │   │   │   ├── NewsCardFeatured.tsx
│   │   │   │   ├── NewsTicker.tsx         # 突发新闻滚动条
│   │   │   │   ├── NewsArticle.tsx        # 文章详情
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   └── useNews.ts
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   │
│   │   └── community/                    # 社区功能模块 (V2.0)
│   │       ├── components/
│   │       │   ├── ChatRoom.tsx
│   │       │   ├── ChatMessage.tsx
│   │       │   ├── CommunityPost.tsx
│   │       │   ├── PostEditor.tsx
│   │       │   └── index.ts
│   │       ├── hooks/
│   │       │   └── useChatRoom.ts
│   │       ├── types.ts
│   │       └── utils.ts
│   │
│   ├── shared/                           # 共享层（跨模块复用）
│   │   │
│   │   ├── components/                   # 共享 UI 组件
│   │   │   ├── ui/                        # Shadcn/ui 安装组件（自动生成）
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── tooltip.tsx
│   │   │   │   ├── skeleton.tsx
│   │   │   │   ├── toast.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── avatar.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── sheet.tsx              # 移动端侧滑面板
│   │   │   │   ├── command.tsx            # 搜索面板 (⌘K)
│   │   │   │   ├── popover.tsx
│   │   │   │   ├── hover-card.tsx
│   │   │   │   └── scroll-area.tsx
│   │   │   ├── layout/                    # 布局组件
│   │   │   │   ├── TopNavbar.tsx           # 顶部全局导航栏
│   │   │   │   ├── BottomTabBar.tsx        # 移动端底部标签栏
│   │   │   │   ├── Sidebar.tsx             # 桌面端侧边栏（设置/数据中心）
│   │   │   │   ├── HamburgerMenu.tsx       # 移动端侧滑菜单
│   │   │   │   ├── Footer.tsx              # 底部页脚
│   │   │   │   └── PageHeader.tsx          # 页面标题栏通用组件
│   │   │   ├── data-display/              # 数据展示组件
│   │   │   │   ├── FlagBadge.tsx           # 国旗标识
│   │   │   │   ├── CountryLabel.tsx        # 国旗 + 队名组合
│   │   │   │   ├── StatBar.tsx             # 双向统计进度条（控球率/射门等）
│   │   │   │   ├── StatCard.tsx            # 统计卡片（大数字+标签）
│   │   │   │   ├── RadarChart.tsx          # 球员雷达图
│   │   │   │   ├── ProgressBar.tsx         # 通用进度条
│   │   │   │   ├── RankingTable.tsx        # 通用排行榜表格
│   │   │   │   ├── Countdown.tsx           # 通用倒计时组件
│   │   │   │   └── ScoreDisplay.tsx        # 比分展示（含动画）
│   │   │   ├── feedback/                   # 反馈组件
│   │   │   │   ├── EmptyState.tsx           # 空状态通用组件
│   │   │   │   ├── ErrorState.tsx           # 错误状态通用组件
│   │   │   │   ├── LoadingSkeleton.tsx      # 骨架屏通用组件
│   │   │   │   └── OfflineBanner.tsx        # 离线提示条
│   │   │   ├── input/                      # 输入组件
│   │   │   │   ├── SearchCommand.tsx        # 全局搜索 (⌘K)
│   │   │   │   ├── FilterBar.tsx            # 通用筛选栏
│   │   │   │   ├── DatePicker.tsx           # 日期选择器
│   │   │   │   └── TeamSelector.tsx         # 球队选择器
│   │   │   └── index.ts                    # 统一导出
│   │   │
│   │   ├── hooks/                         # 共享 Hooks
│   │   │   ├── useDebounce.ts              # 输入防抖（搜索用）
│   │   │   ├── useLocalStorage.ts          # 本地存储（非敏感偏好）
│   │   │   ├── useMediaQuery.ts            # 响应式断点判断
│   │   │   ├── useScrollSpy.ts             # 滚动监听（页内标签高亮）
│   │   │   ├── useKeyboard.ts              # 全局快捷键
│   │   │   ├── useOnlineStatus.ts          # 在线/离线状态
│   │   │   ├── useShare.ts                 # Web Share API 封装
│   │   │   └── index.ts
│   │   │
│   │   └── utils/                         # 工具函数
│   │       ├── cn.ts                       # Tailwind 类名合并 (clsx + twMerge)
│   │       ├── format.ts                   # 日期/数字/比分格式化
│   │       ├── timezone.ts                 # 时区转换
│   │       ├── constants.ts               # 全局常量（赛事日期/阶段/48队代码）
│   │       ├── match-status.ts             # 比赛状态判断逻辑
│   │       ├── fifa-ranking.ts             # FIFA 排名数据
│   │       └── index.ts
│   │
│   ├── services/                          # 数据服务层（封装数据访问）
│   │   ├── supabase/                      # Supabase 客户端
│   │   │   ├── client.ts                  # 浏览器端 Supabase Client（含 Auth）
│   │   │   ├── server.ts                  # 服务端 Supabase Client（含 Service Role）
│   │   │   ├── middleware.ts              # Supabase Auth 中间件
│   │   │   └── admin.ts                   # 管理员操作专用 Client
│   │   ├── match-service.ts               # 比赛数据 CRUD + 实时订阅
│   │   ├── team-service.ts                # 球队数据 CRUD
│   │   ├── player-service.ts              # 球员数据 CRUD
│   │   ├── standing-service.ts            # 积分榜查询
│   │   ├── stats-service.ts               # 统计数据聚合查询
│   │   ├── prediction-service.ts          # AI 预测数据查询
│   │   ├── news-service.ts                # 新闻数据查询
│   │   ├── search-service.ts              # 全局搜索（Supabase 全文搜索）
│   │   ├── notification-service.ts        # 推送通知管理
│   │   ├── user-service.ts                # 用户 CRUD + 偏好管理
│   │   ├── favorite-service.ts            # 收藏增删查
│   │   └── index.ts
│   │
│   ├── realtime/                          # 实时数据层
│   │   ├── supabase-subscriptions.ts      # Supabase Realtime 订阅管理
│   │   ├── match-events-channel.ts        # 比赛事件实时推送频道
│   │   ├── live-scores-channel.ts         # 实时比分频道
│   │   ├── notification-channel.ts        # 用户通知推送频道
│   │   ├── chat-channel.ts                # 聊天室频道 (V2.0)
│   │   └── index.ts
│   │
│   ├── stores/                            # 状态管理（Zustand）
│   │   ├── useLiveStore.ts                # 实时比赛状态（比分/事件/时间）
│   │   ├── useUserStore.ts                # 用户状态（认证/偏好/收藏）
│   │   ├── useUIStore.ts                  # UI 状态（主题/语言/侧栏展开）
│   │   ├── useSearchStore.ts              # 搜索状态（搜索词/结果/历史）
│   │   ├── useNotificationStore.ts        # 通知状态（未读数/列表）
│   │   └── index.ts
│   │
│   ├── i18n/                              # 国际化
│   │   ├── config.ts                      # 语言配置（支持的语言/默认语言）
│   │   ├── server.ts                      # 服务端 i18n（字典加载）
│   │   ├── client.ts                      # 客户端 i18n hooks
│   │   ├── dictionaries/                  # 翻译字典
│   │   │   ├── en.json                     # 英语
│   │   │   ├── zh.json                     # 中文简体
│   │   │   ├── es.json                     # 西班牙语
│   │   │   ├── fr.json                     # 法语
│   │   │   ├── ar.json                     # 阿拉伯语
│   │   │   ├── pt.json                     # 葡萄牙语
│   │   │   ├── ja.json                     # 日语
│   │   │   └── ko.json                     # 韩语
│   │   └── index.ts
│   │
│   ├── types/                             # 全局类型定义
│   │   ├── database.ts                    # Supabase 生成的数据库类型（自动）
│   │   ├── models.ts                      # 业务实体类型（Team/Player/Match/...）
│   │   ├── api.ts                         # API 请求/响应类型
│   │   ├── events.ts                      # 比赛事件类型定义
│   │   ├── predictions.ts                 # 预测相关类型
│   │   └── index.ts
│   │
│   └── config/                            # 应用配置
│       ├── site.ts                        # 站点元数据（名称/描述/URL）
│       ├── tournament.ts                  # 赛事配置（开赛日期/阶段/规则）
│       ├── navigation.ts                  # 导航配置（主导航项/底部标签项）
│       ├── metadata.ts                    # SEO metadata 生成工具
│       └── index.ts
│
├── .env.local                            # 本地环境变量（不提交）
├── .env.example                          # 环境变量模板
├── next.config.ts                        # Next.js 配置
├── tailwind.config.ts                    # Tailwind 配置
├── components.json                       # Shadcn/ui 配置
├── tsconfig.json                         # TypeScript 配置
├── package.json                          # 依赖管理
├── .eslintrc.json                        # ESLint 配置
├── .prettierrc                           # Prettier 配置
├── vitest.config.ts                      # 测试配置
├── playwright.config.ts                  # E2E 测试配置
└── README.md                             # 项目文档
```

---

## 三、目录职责速查

### 3.1 顶层目录

```
目录              职责
────────────────────────────────────────────────────────────────
.github/           CI/CD 工作流 + Issue 模板
supabase/          数据库迁移 + 种子数据 + Supabase CLI 配置
public/            静态资源（国旗/队徽/球员照片/字体/翻译文件）
src/               全部应用源代码
```

### 3.2 `src/app/` — 路由与页面

```
目录              职责                                     对应页面
────────────────────────────────────────────────────────────────────
app/               路由根，全局 layout/error/not-found
app/(main)/        主布局组（TopNavbar + Footer）
  matches/         比赛中心 + 比赛详情 + 历史比赛           /matches/*
  schedule/        赛程中心                                 /schedule
  standings/       积分榜 + 晋级图                          /standings/*
  teams/           球队中心 + 球队详情                       /teams/*
  players/         球员中心 + 球员详情 + 球员对比            /players/*
  stats/           数据中心 + 球员榜 + 球队榜                /stats/*
  news/            新闻中心 + 新闻详情                       /news/*
  predictions/     AI预测中心 + 夺冠预测 + 金靴预测         /predictions/*
  favorites/       我的收藏                                 /favorites
  settings/        设置中心                                 /settings
  search/          全局搜索结果                             /search
app/auth/          认证路由组（login/register/callback）     /auth/*
app/api/           API Routes（REST + Webhook + Cron）     /api/*
```

### 3.3 `src/features/` — 功能模块

```
模块              组件数    职责
────────────────────────────────────────────────────────────────
match/            16       比赛卡片/事件时间线/实时统计/xG走势图/评分表
team/             9        球队英雄/阵容/统计/历史时间线/晋级概率
player/           8        球员英雄/雷达图/数据面板/比赛日志/对比
schedule/         9        赛程卡片(3模式)/日期导航/观赛计划
standing/         6        积分表/小组选择器/晋级图/第三名计算器
prediction/       10       冠军TOP5/热力图/晋级路线/金靴预测/准确率
user/             11       收藏/通知/设置表单/隐私
news/             4        新闻卡片/突发新闻条/文章详情
community/        4        聊天室/消息/帖子/编辑器 (V2.0)
```

每个功能模块遵循统一结构：

```
feature/
├── components/    # 该模块专属 UI 组件
├── hooks/         # 该模块专属数据获取 hooks
├── types.ts       # 该模块 TypeScript 类型
├── utils.ts       # 该模块工具函数
└── index.ts       # 统一导出
```

### 3.4 `src/shared/` — 共享层

```
目录              说明
────────────────────────────────────────────────────────────────
components/ui/     Shadcn/ui 组件（button/card/dialog 等 18+）
components/layout/ 全局布局（导航栏/侧栏/页脚/汉堡菜单）
components/data-display/  通用数据展示（国旗/统计条/雷达图/排行榜）
components/feedback/      空状态/错误/加载/离线提示
components/input/         搜索/筛选/日期选择器/球队选择器
hooks/             通用 hooks（防抖/断点/快捷键/在线状态）
utils/             工具函数（类名合并/格式化/时区/常量）
```

### 3.5 `src/services/` — 数据服务层

```
服务              封装的 Supabase 表/操作
────────────────────────────────────────────────────────────────
supabase/         客户端初始化（Browser/Server/Admin/Middleware）
match-service     Matches + MatchEvents + MatchStats + PlayerStats 表
team-service      Teams + TeamStats + TeamHonor + Squad 表
player-service    Players + PlayerHonor 表
standing-service  Standings 表 + 聚合查询
stats-service     PlayerStats/MatchStats/TeamStats 聚合查询
prediction-service Predictions 表（AI + 用户）
news-service      Articles 表
search-service    Supabase 全文搜索索引
notification-service Notifications 表 + Web Push API
user-service      Users + UserSettings 表
favorite-service  Favorites 表 (CRUD)
```

**调用链：** `Page → Hook → Service → Supabase Client`

### 3.6 `src/realtime/` — 实时数据

```
频道                      订阅的表              推送目标
──────────────────────────────────────────────────────────────────
match-events-channel      MatchEvents 变更      比赛详情页事件时间线
live-scores-channel       Matches.score 变更     首页/比赛中心比分
notification-channel      Notifications 插入    用户浏览器推送
chat-channel              ChatMessages 插入     比赛聊天室 (V2.0)
```

### 3.7 `src/stores/` — 全局状态 (Zustand)

```
Store               存储内容                   消费页面
──────────────────────────────────────────────────────────────────
useLiveStore        进行中比赛比分/事件/时钟     首页·比赛中心·比赛详情
useUserStore        用户认证状态/偏好/收藏列表   全局·导航栏·我的收藏
useUIStore          主题/语言/侧栏/搜索面板      全局
useSearchStore      搜索词/建议/历史             全局搜索
useNotificationStore 未读数/通知列表             顶部通知图标
```

### 3.8 `src/i18n/` — 国际化

支持 8 种语言（en/zh/es/fr/ar/pt/ja/ko），使用 Next.js 内置 i18n 路由或 `next-intl` 库。翻译字典按命名空间拆分（common/match/team/player/settings）。

### 3.9 `src/types/` — 类型定义

```
文件              来源                 内容
──────────────────────────────────────────────────────────────
database.ts       Supabase CLI 自动生成  数据库表完整类型
models.ts         手动维护              业务实体 TS 接口
api.ts            手动维护              API 请求参数 + 响应类型
events.ts         手动维护              比赛事件枚举 + 类型
predictions.ts    手动维护              预测相关类型
```

---

## 四、数据流架构

```
┌─────────────────────────────────────────────────────────────────┐
│                       数据流层次                                 │
│                                                                 │
│  ┌─────────┐     ┌──────────┐     ┌──────────┐     ┌─────────┐ │
│  │   UI    │ ──▶ │  Hooks   │ ──▶ │ Services │ ──▶ │Supabase │ │
│  │Components│ ◀── │(数据获取) │ ◀── │(数据访问) │ ◀── │(Postgres│ │
│  │  页面    │     │          │     │          │     │ +Realtime│ │
│  └─────────┘     └──────────┘     └──────────┘     └─────────┘ │
│       │                                                         │
│       │ 实时更新                                                 │
│       ▼                                                         │
│  ┌─────────┐     ┌──────────┐                                   │
│  │ Stores  │ ◀── │ Realtime │  ← Supabase Realtime 订阅         │
│  │(Zustand)│     │ Channels │                                   │
│  └─────────┘     └──────────┘                                   │
│                                                                 │
│  路由层           数据层                 存储层                  │
│  src/app/    src/services/          Supabase PostgreSQL         │
│              src/realtime/          + Realtime WebSocket        │
│              src/stores/                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 五、关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| **路由模式** | App Router + 路由分组 `(main)` | 主页面共享导航布局，认证页独立简洁布局 |
| **组件组织** | Feature-Based | 10+ 功能模块，按业务域分组避免 `components/` 膨胀 |
| **数据获取** | Service Layer 隔离 | 页面不直接调 Supabase，未来可替换后端而页面无感知 |
| **实时数据** | Supabase Realtime + Zustand | 事件驱动更新 Store，UI 自动响应 |
| **状态管理** | Zustand (轻量) | 不需要 Redux 的重量，5 个 store 足够覆盖全局状态 |
| **国际化** | `next-intl` + 字典文件 | 支持 8 种语言的 SSR 翻译 |
| **类型生成** | Supabase CLI 自动生成 `database.ts` | 数据库变更后一条命令更新全局类型 |
| **移动端适配** | 响应式（Tailwind 断点） + 底部标签栏 | MVP 阶段不拆为独立移动端项目 |

---

> **文档结束。** 项目目录结构覆盖 Next.js 15 App Router 全栈架构，按 Feature-Based 模式组织 9 个功能模块，通过 Service Layer 隔离数据访问。
