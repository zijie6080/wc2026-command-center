
# WC2026 Command Center

**FIFA World Cup 2026 — 全球赛事实时指挥中心**

实时比分 · 48支球队 · 104场比赛 · AI 预测 · 战术分析

[![Deploy Status](https://img.shields.io/badge/deploy-vercel-black?logo=vercel)](https://world-cup-2026-ruddy-eight.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)](https://nextjs.org)

---

## 功能

| 页面 | 功能 |
|------|------|
| 🏠 指挥中心 | 赛事总览 · 倒计时 · Live Center · Power Rankings · 主办城市 |
| ⚽ 实时比赛 | 实时比分 · 自动刷新 · 比赛状态 · 数据面板 |
| 📅 赛程中心 | 按日期/小组/淘汰赛 · 104场完整赛程 |
| 📊 比赛详情 | 时间轴 · 技术统计 · AI 赛后分析 |
| 👥 球队 | 48队信息 · 阵容 · 积分榜 · 近期战绩 |
| ⭐ 球员 | 中英双名 · 照片 · 能力雷达 · 荣誉 |
| 🔮 预测中心 | AI 夺冠概率 · 领奖台 · 赛前预测 |
| 📱 移动端 | 底部Tab · 下拉刷新 · 滑出导航 · 原生体验 |

## 技术栈

```
Next.js 15.5 · React 19 · TypeScript · Tailwind CSS
football-data.org API · DeepSeek AI · Vercel
```

## 快速启动

### 1. 克隆项目

```bash
git clone https://github.com/zijie6080/wc2026-command-center.git
cd wc2026-command-center
```

### 2. 安装依赖

```bash
npm install --legacy-peer-deps
```

### 3. 配置 API Key

复制 `.env.example` 为 `.env.local`，填入你的 API Key：

```bash
# 必填：football-data.org API Key
# 免费注册获取：https://www.football-data.org/client/register
FOOTBALL_API_KEY=你的API_KEY

# 可选：AI 分析（DeepSeek / OpenAI）
# 注册获取：https://platform.deepseek.com
AI_API_KEY=你的AI_KEY
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
```

> 如果没有 API Key，设置 `NEXT_PUBLIC_API_MOCK_MODE=true` 使用模拟模式启动。

### 4. 启动

```bash
npm run dev
```

访问 **http://localhost:3000**

## 构建部署

```bash
npm run build
npm start
```

一键部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/zijie6080/wc2026-command-center)

## 项目结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── page.tsx            # 首页 · Command Center
│   ├── live/               # 实时比赛
│   ├── schedule/           # 赛程
│   ├── match/[id]/         # 比赛详情
│   ├── teams/              # 球队列表
│   ├── team/[id]/          # 球队详情
│   ├── players/            # 球员列表
│   ├── player/[id]/        # 球员详情
│   ├── predictions/        # 预测中心
│   ├── favorites/          # 收藏
│   └── api/                # API 路由
│       ├── proxy/           # football-data.org CORS 代理
│       └── ai/              # AI 分析端点
├── lib/                    # 工具库
│   ├── constants.ts        # 国旗 · 中文名 · 常量
│   ├── ai-*.ts             # AI 配置 · 缓存 · 提示词
│   └── player-*.ts         # 球员名翻译 · 荣誉数据库
├── services/
│   └── football-api/       # football-data.org API 客户端
└── shared/components/      # 共享组件
    ├── layout/             # Header · BottomTabBar · ClientLayout
    ├── ui/                 # DataCard · Badge · DataValue · PageShell
    └── data-display/       # LiveMatchCard · ChampionLeaderboard · PlayerPhoto
```

## 环境变量

| 变量 | 必填 | 说明 |
|------|:--:|------|
| `FOOTBALL_API_KEY` | ✅ | football-data.org API Key |
| `AI_API_KEY` | - | AI 分析（DeepSeek/OpenAI） |
| `AI_BASE_URL` | - | AI API 地址 |
| `AI_MODEL` | - | AI 模型名 |
| `NEXT_PUBLIC_API_MOCK_MODE` | - | 模拟模式（无API时设为 true） |

## License

MIT
