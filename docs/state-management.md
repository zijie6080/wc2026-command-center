# 状态管理方案 — World Cup 2026 Command Center

> **方案:** Zustand (全局) + React Query/TanStack Query (服务端缓存) + React State (页面级)
> **设计原则:** 最小化全局状态，最大化服务端缓存，隔离页面状态
> **版本:** v1.0 / 2026-06-04

---

## 一、状态分层架构

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            STATE ARCHITECTURE                                     │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                        Layer 1: 全局状态 (Zustand)                           │ │
│  │                                                                              │ │
│  │  职责: 跨页面共享的实时数据 + 用户会话 + UI 偏好                              │ │
│  │  特点: 持久化到 localStorage · 订阅 Supabase Realtime · 5 个 Store           │ │
│  │  生命周期: 应用启动 → 应用关闭                                                │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                    Layer 2: 服务端缓存 (TanStack Query)                        │ │
│  │                                                                              │ │
│  │  职责: API 请求的缓存/去重/后台刷新/乐观更新                                  │ │
│  │  特点: 自动缓存 · staleTime · 自动重新获取 · 分页/无限滚动                   │ │
│  │  生命周期: 由缓存策略控制 (staleTime + gcTime)                                │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                    Layer 3: 页面状态 (React State)                            │ │
│  │                                                                              │ │
│  │  职责: 页面级 UI 状态 · 表单输入 · 筛选条件 · 展开/折叠                       │ │
│  │  特点: useState/useReducer · 页面卸载即销毁                                   │ │
│  │  生命周期: 页面挂载 → 页面卸载                                                │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 二、全局状态设计 (Zustand — 5 个 Store)

### 2.1 Store 总览

| Store | 职责 | 持久化 | 订阅 Realtime | 消费者 |
|-------|------|--------|---------------|--------|
| `useLiveStore` | 所有进行中比赛的实时比分/事件/时钟 | 否 | ✅ live-scores + match-events | 首页/比赛中心/比赛详情/Live页 |
| `useUserStore` | 用户认证状态+收藏列表缓存 | ✅ localStorage | 否 | 全局/导航栏/收藏页/设置页 |
| `useUIStore` | 主题/语言/侧栏展开等 UI 偏好 | ✅ localStorage | 否 | 全局 (layout.tsx) |
| `useSearchStore` | 搜索词/搜索建议/搜索历史 | ✅ localStorage (仅历史) | 否 | 全局搜索弹窗 |
| `useNotificationStore` | 未读通知计数+通知列表缓存 | 否 | ✅ notification-channel | 导航栏角标/通知面板 |

---

### 2.2 `useLiveStore` — 实时比赛状态

**为什么需要全局状态？**
实时比分是跨页面共享数据——用户在首页看到比分、在比赛中心看到比分、进入比赛详情页看到的仍是同一份数据。每个页面独立请求会造成数据不一致（同一时刻不同页面显示不同比分）。

| 状态 | 类型 | 说明 |
|------|------|------|
| `liveMatches` | `Map<matchId, LiveMatch>` | 所有进行中比赛的实时快照。每场比赛含：比分/状态/当前分钟/进球摘要 |
| `updateMatchScore` | Action | Realtime 推送比分变化时调用。更新对应 matchId 的比分+触发动画标记 |
| `updateMatchClock` | Action | 每秒更新一次当前分钟:秒。实际由 MatchClock 组件本地计时，Store 仅在收到推送时同步校正 |
| `addMatchEvent` | Action | Realtime 推送新事件时调用。将事件加入对应比赛的 eventBuffer，触发事件时间线更新 |
| `setMatchStatus` | Action | 比赛状态变更(上半场→中场→下半场→结束)。结束的比赛从 liveMatches 移除 |
| `getMatchById` | Selector | 组件获取单场比赛实时数据 |
| `getLiveMatchIds` | Selector | 获取所有进行中的 matchId 列表（首页"正在进行"渲染用） |

**数据流：**

```
Supabase Realtime (live-scores-channel)
        │ 推送: { matchId, score_ft_home, score_ft_away, status, current_minute }
        ▼
useLiveStore.updateMatchScore()
        │
        ▼
所有订阅该 matchId 的组件自动重渲染
        │
        ├── 首页 "正在进行" 卡片 → 比分翻转动画
        ├── 比赛中心 "进行中" 列表 → 比分更新
        ├── 比赛详情页 比分栏 → 大字号比分+动画
        └── /live 页面 → 沉浸式比分
```

---

### 2.3 `useUserStore` — 用户认证与收藏

**为什么需要全局状态？**
用户登录状态决定导航栏显示头像还是登录按钮、决定哪些页面可访问、决定收藏数据的归属。收藏列表在多页面共享（首页个性化推荐 + 我的收藏页 + 赛程"我的观赛计划"）。

| 状态 | 类型 | 说明 |
|------|------|------|
| `user` | `User \| null` | 当前登录用户信息（id/nickname/avatar/email） |
| `isLoading` | `boolean` | 初始认证状态检查中（避免闪烁） |
| `favoriteIds` | `{ teams: Set<string>, players: Set<string>, matches: Set<string> }` | 收藏 ID 集合。用于快速判断"是否已收藏"（⭐按钮状态） |
| `favoriteCount` | `{ teams: number, players: number, matches: number }` | 各类收藏计数 |
| `login` | Action | Supabase Auth 登录成功回调 |
| `logout` | Action | 清空用户状态 + 收藏缓存 |
| `updateProfile` | Action | 更新昵称/头像 |
| `addFavorite / removeFavorite` | Action | 乐观更新收藏状态（先改 UI 再请求 API，失败回滚） |
| `isFavorited` | Selector | 判断某目标是否已收藏 |

**持久化策略：**
- `user` 的 JWT Token 由 Supabase Auth 管理（httpOnly cookie）
- `favoriteIds` 持久化到 localStorage，页面加载时恢复，减少首屏请求
- 登录后从服务端全量同步一次收藏列表，覆盖本地缓存

---

### 2.4 `useUIStore` — UI 偏好

**为什么需要全局状态？**
主题切换和语言切换影响整个应用的视觉呈现，所有页面必须同步响应。这些偏好需要持久化到 localStorage，下次访问时恢复。

| 状态 | 类型 | 说明 |
|------|------|------|
| `theme` | `'dark' \| 'light' \| 'system'` | 主题模式。默认 `dark`（观赛场景） |
| `resolvedTheme` | `'dark' \| 'light'` | 实际生效的主题（system 模式下根据系统偏好解析） |
| `themeColor` | `'blue' \| 'green' \| 'orange' \| 'red' \| 'purple'` | 主色调。影响按钮/链接/高亮色 |
| `locale` | `'en' \| 'zh' \| 'es' \| 'fr' \| 'ar' \| 'pt' \| 'ja' \| 'ko'` | 当前语言 |
| `sidebarCollapsed` | `boolean` | 桌面端侧边栏是否折叠（仅数据中心/设置页） |
| `hamburgerOpen` | `boolean` | 移动端汉堡菜单是否展开 |
| `searchOpen` | `boolean` | 全局搜索面板是否打开（⌘K 触发） |
| `scoreFontSize` | `'small' \| 'normal' \| 'large' \| 'xlarge'` | 比分字号偏好 |
| `setTheme / setLocale / toggleSidebar` | Actions | 更新 UI 状态 |

**与 `next-themes` 的关系：**
主题切换使用 `next-themes` 库处理（避免 SSR 闪屏）。`useUIStore` 订阅 `next-themes` 的变化，保持两者同步。

---

### 2.5 `useSearchStore` — 搜索状态

**为什么需要全局状态？**
搜索面板由 `SearchCommand` 组件（⌘K）在任何页面触发。搜索结果和搜索历史需要在全局可访问。

| 状态 | 类型 | 说明 |
|------|------|------|
| `query` | `string` | 当前搜索词 |
| `suggestions` | `Suggestion[]` | 搜索建议列表（球队/球员/比赛/新闻分组） |
| `isLoading` | `boolean` | 搜索建议加载中 |
| `searchHistory` | `string[]` | 搜索历史（最近 10 条）。持久化 localStorage |
| `setQuery` | Action | 更新搜索词 + 触发建议获取（防抖 300ms） |
| `addToHistory` | Action | 执行搜索后将词加入历史 |
| `clearHistory` | Action | 清空搜索历史 |

---

### 2.6 `useNotificationStore` — 通知状态

**为什么需要全局状态？**
未读通知数量需要在导航栏角标实时更新。通知面板可从任意页面展开。

| 状态 | 类型 | 说明 |
|------|------|------|
| `unreadCount` | `number` | 未读通知数量（导航栏角标） |
| `notifications` | `Notification[]` | 最近 20 条通知缓存（通知面板用） |
| `addNotification` | Action | Realtime 推送新通知时调用。更新 unreadCount + 插入列表头部 |
| `markAsRead` | Action | 标记已读。乐观更新 unreadCount |
| `markAllAsRead` | Action | 全部已读。unreadCount = 0 |
| `fetchNotifications` | Action | 从服务端加载通知列表（页面首次打开通知面板时） |

**数据流：**

```
Supabase Realtime (notification-channel)
        │ 推送: { id, type, title, body, link_type, link_id, priority }
        ▼
useNotificationStore.addNotification()
        │
        ├── unreadCount + 1 → 导航栏角标更新
        ├── Toast 弹出（high 优先级）
        ├── 浏览器桌面推送（Service Worker）
        └── 通知面板（如已展开）实时插入新通知
```

---

## 三、服务端缓存层 (TanStack Query)

### 3.1 为什么需要这一层？

全局 Zustand Store 不适合管理所有服务端数据，因为：
- 数据体量大（832 名球员、104 场比赛、完整统计数据）
- 需要自动过期和重新获取
- 需要分页/无限滚动
- 需要乐观更新 + 失败回滚
- 需要请求去重（多个组件请求同一数据时合并为一个请求）

TanStack Query 作为服务端状态缓存层，接管了 80% 的数据获取逻辑。

### 3.2 Query Key 设计

| Query Key | 对应 API | 缓存策略 |
|-----------|----------|----------|
| `['matches', { status, date, stage, group, page }]` | `/api/matches` | staleTime: 30s (赛中) / 5min (赛后) |
| `['matches', 'live']` | `/api/matches/live` | staleTime: 0 (不缓存) |
| `['matches', 'today']` | `/api/matches/today` | staleTime: 60s |
| `['match', matchId]` | `/api/matches/[id]` | 赛中 staleTime: 0 / 赛后 staleTime: 10min |
| `['match', matchId, 'events']` | `/api/matches/[id]/events` | 赛中 staleTime: 0 |
| `['match', matchId, 'stats']` | `/api/matches/[id]/stats` | 赛中 staleTime: 10s |
| `['match', matchId, 'ratings']` | `/api/matches/[id]/player-ratings` | staleTime: 10min |
| `['teams']` | `/api/teams` | staleTime: 1h |
| `['team', teamId]` | `/api/teams/[id]` | staleTime: 10min |
| `['team', teamId, 'squad']` | `/api/teams/[id]/squad` | staleTime: 10min |
| `['team', teamId, 'stats']` | `/api/teams/[id]/stats` | staleTime: 赛后更新 |
| `['players']` | `/api/players` | staleTime: 1h |
| `['player', playerId]` | `/api/players/[id]` | staleTime: 10min |
| `['player', playerId, 'stats']` | `/api/players/[id]/stats` | staleTime: 赛后更新 |
| `['schedule', { date, stage, group, team }]` | `/api/schedule` | staleTime: 5min |
| `['standings', 'groups']` | `/api/standings/groups` | staleTime: 赛后更新 |
| `['standings', 'bracket']` | `/api/standings/bracket` | staleTime: 赛后更新 |
| `['predictions', type]` | `/api/predictions` | staleTime: 1h |
| `['news', { category, page }]` | `/api/news` | staleTime: 5min |
| `['search', query]` | `/api/search` | staleTime: 60s |

### 3.3 与 Zustand 的协作

```
组件请求数据
        │
        ├── 实时数据 (比分/事件) → useLiveStore (Zustand + Realtime)
        │                        不经过 TanStack Query
        │
        ├── 用户状态 (认证/收藏) → useUserStore (Zustand)
        │                         初始加载通过 TanStack Query
        │
        ├── UI 偏好 (主题/语言)  → useUIStore (Zustand + localStorage)
        │
        └── 服务端数据 (球队/球员/赛程/统计/新闻/预测)
            → TanStack Query
              自动缓存 · 自动重新获取 · 分页 · 请求去重
```

---

## 四、页面状态设计 (React State)

### 4.1 哪些数据只放在页面内？

| 页面 | 页面级状态 | 类型 | 说明 |
|------|-----------|------|------|
| **所有页面** | `isLoading` / `error` | TanStack Query 内置 | 由 useQuery 返回，组件内消费 |
| **首页** | `heroSlideIndex` | `useState(0)` | Hero 横幅当前轮播位置 |
| **比赛中心** | `activeFilter` / `activeDate` | `useState` + URL searchParams | 当前选中的筛选标签和日期。同步到 URL 参数(支持浏览器前进/后退) |
| **比赛详情** | `activeTab` | `useState('live')` | 当前页内标签(实时/数据/阵容/赛前/聊天)。同步到 URL `?tab=` |
| **比赛详情** | `eventFilter` | `useState('all')` | 事件筛选器当前值(全部/进球/黄牌/红牌/换人/VAR) |
| **赛程中心** | `viewMode` / `compactMode` | `useState` | 快捷视图(今日/明日/本周/全部) + 卡片模式(详细/紧凑) |
| **积分榜** | `selectedGroup` | `useState('A')` | 当前查看的小组 |
| **球队详情** | `activeTab` | `useState('overview')` | 当前页内标签。同步到 URL |
| **球员详情** | `activeTab` | `useState('overview')` | 当前页内标签 |
| **球员对比** | `player1 / player2` | `useState` + URL `?ids=` | 对比的两位球员 |
| **数据中心** | `statCategory` | `useState('goals')` | 当前查看的统计类别 |
| **新闻中心** | `newsCategory` | `useState('all')` | 新闻分类筛选 |
| **设置中心** | `activeSection` | `useState('profile')` | 当前设置分组 |
| **历史比赛** | `searchQuery` / `filters` | `useState` + URL | 搜索词和筛选条件 |
| **表单** | 所有表单输入值 | `useState` | 登录/注册/设置表单，提交前不需要全局共享 |
| **弹窗/Modal** | `isOpen` | `useState(false)` | 对话框/侧滑面板的显隐 |

### 4.2 为什么这些不用全局状态？

```
┌─────────────────────────────────────────────────────────────────┐
│  判断标准                    示例                                │
├─────────────────────────────────────────────────────────────────┤
│  只在当前页面使用             activeTab: 切换"概览/阵容/数据"    │
│  页面卸载后不需要             eventFilter: 离开详情页即重置      │
│  可通过 URL 恢复              ?tab=stats → 页面内初始化即可      │
│  不影响其他页面               selectedGroup: 只影响积分榜显示   │
│  表单输入                    登录表单值: 切换页面应清空          │
│  瞬时 UI 状态                弹窗显隐: 关闭即丢弃               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 五、状态分类决策树

```
                        需要这个数据在多个页面之间共享吗？
                                │
                    ┌───────────┴───────────┐
                    │ 是                    │ 否
                    ▼                       ▼
            需要实时更新吗？          需要跨组件但不跨页面？
                    │                       │
        ┌───────────┴──────┐        ┌───────┴───────┐
        │ 是               │ 否     │ 是            │ 否
        ▼                  ▼        ▼               ▼
   Zustand Store      Zustand    通过 Props       React State
   + Realtime         Store      传递或           (useState)
   订阅              + 持久化    TanStack Query   (页面内)
                                 共享缓存
   示例:              示例:       示例:           示例:
   实时比分           用户信息    比赛卡片列表    表单输入
   比赛事件           主题/语言    (父传子)       弹窗显隐
   未读通知           收藏列表                   筛选条件
```

---

## 六、状态同步策略

| 同步场景 | 策略 | 说明 |
|----------|------|------|
| **URL ↔ 页面状态** | `useSearchParams` + `useRouter` | 筛选条件/标签页/搜索词写入 URL 参数。支持浏览器前进/后退和链接分享 |
| **localStorage ↔ Zustand** | `persist` middleware | 主题/语言/收藏 ID 集合/搜索历史持久化。登录后从服务端全量同步一次 |
| **Realtime ↔ Zustand** | Supabase channel `.on('postgres_changes')` | 数据库变更自动推送到 Store。无需手动轮询 |
| **Zustand ↔ TanStack Query** | `queryClient.invalidateQueries` | Zustand 中的操作（如添加收藏）完成后，失效相关 TanStack Query 缓存，触发重新获取 |
| **Tab 标签页同步** | `BroadcastChannel API` | 用户打开多个标签页时，一个标签页修改主题/语言，其他标签页同步更新 |
| **乐观更新** | 先改 UI → 再发 API → 失败回滚 | 收藏/预测/设置修改。提升交互响应速度 |

---

## 七、各页面状态使用一览

```
┌──────────────────┬──────────────────────┬──────────────────────┬─────────────────┐
│ 页面              │ 全局 Zustand         │ TanStack Query        │ 页面 React State │
├──────────────────┼──────────────────────┼──────────────────────┼─────────────────┤
│ 首页              │ useLiveStore         │ ['matches','live']    │ heroSlideIndex  │
│                   │ useUserStore         │ ['matches','today']   │                 │
│                   │ useUIStore           │ ['news','featured']   │                 │
│                   │ useNotificationStore │ ['stats','overview']  │                 │
├──────────────────┼──────────────────────┼──────────────────────┼─────────────────┤
│ /live             │ useLiveStore         │ ['matches','live']    │ —               │
│                   │ useUIStore           │                       │                 │
├──────────────────┼──────────────────────┼──────────────────────┼─────────────────┤
│ 比赛详情           │ useLiveStore         │ ['match', id]         │ activeTab       │
│                   │ useUserStore         │ ['match',id,'events'] │ eventFilter     │
│                   │ useUIStore           │ ['match',id,'stats']  │                 │
│                   │                      │ ['match',id,'ratings']│                 │
├──────────────────┼──────────────────────┼──────────────────────┼─────────────────┤
│ 赛程中心           │ useUserStore         │ ['schedule', filters] │ viewMode        │
│                   │ useUIStore           │                       │ compactMode     │
│                   │                      │                       │ filters         │
├──────────────────┼──────────────────────┼──────────────────────┼─────────────────┤
│ 积分榜             │ useUIStore           │ ['standings','groups']│ selectedGroup   │
│                   │                      │ ['standings','bracket']│                │
├──────────────────┼──────────────────────┼──────────────────────┼─────────────────┤
│ 球队详情           │ useUserStore         │ ['team', id]          │ activeTab       │
│                   │ useUIStore           │ ['team',id,'squad']   │                 │
│                   │                      │ ['team',id,'stats']   │                 │
├──────────────────┼──────────────────────┼──────────────────────┼─────────────────┤
│ 球员详情           │ useUserStore         │ ['player', id]        │ activeTab       │
│                   │ useUIStore           │ ['player',id,'stats'] │                 │
├──────────────────┼──────────────────────┼──────────────────────┼─────────────────┤
│ AI 分析/夺冠预测   │ useUIStore           │ ['predictions',type]  │ activeTab       │
│                   │ useUserStore         │                       │                 │
├──────────────────┼──────────────────────┼──────────────────────┼─────────────────┤
│ 我的收藏           │ useUserStore         │ ['favorites', type]   │ activeType      │
│                   │ useUIStore           │                       │                 │
├──────────────────┼──────────────────────┼──────────────────────┼─────────────────┤
│ 设置中心           │ useUserStore         │ ['settings']          │ activeSection   │
│                   │ useUIStore           │                       │ 表单输入        │
├──────────────────┼──────────────────────┼──────────────────────┼─────────────────┤
│ 全局搜索           │ useSearchStore       │ ['search', query]     │ —               │
│                   │ useUIStore           │                       │                 │
└──────────────────┴──────────────────────┴──────────────────────┴─────────────────┘
```

---

## 八、总结

```
┌─────────────────────────────────────────────────────────────────┐
│                      状态分层占比                                 │
│                                                                  │
│  Zustand (全局)       5 个 Store    用于: 实时比分/用户/UI/搜索/通知  │
│                       ~15% 的状态   特点: 跨页面共享 + 持久化       │
│                                                                  │
│  TanStack Query       30+ Query Keys 用于: 服务端数据缓存          │
│                       ~60% 的状态    特点: 自动缓存+重新获取+分页  │
│                                                                  │
│  React State          每页面 2-5 个  用于: UI 交互/表单/筛选       │
│                       ~25% 的状态    特点: 页面隔离+自动销毁       │
│                                                                  │
│  核心原则:                                                        │
│  · 能放在页面内 → 不放到全局                                      │
│  · 能通过 URL 恢复 → 不放到 Store                                 │
│  · 能通过 Props 传递 → 不放到 Store                               │
│  · 跨页面共享 + 需要实时更新 → Zustand + Realtime                  │
│  · 服务端数据 → TanStack Query（让库管理缓存和失效）               │
└─────────────────────────────────────────────────────────────────┘
```

---

> **文档结束。** 状态管理方案采用 Zustand(5 Store) + TanStack Query(30+ Query Keys) + React State 三层架构。核心原则：最小化全局状态，最大化服务端缓存，隔离页面状态。
