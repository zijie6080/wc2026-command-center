# 环境变量设计 — World Cup 2026 Command Center

> **技术栈:** Next.js 15 · Supabase · Football API · AI/ML · Vercel
> **环境分层:** Development · Preview · Production
> **版本:** v1.0 / 2026-06-04

---

## 一、设计原则

| 原则 | 说明 |
|------|------|
| **敏感信息零硬编码** | 所有 Key/Secret/Token 进入环境变量，`.env.local` 加入 `.gitignore` |
| **环境分层隔离** | Dev(本地) / Preview(Vercel Preview) / Prod(Vercel Production) 三套独立值 |
| **前缀命名规范** | `NEXT_PUBLIC_` 仅用于浏览器可见变量；其余为服务端机密 |
| **变量模板提供** | `.env.example` 文件含所有变量名 + 示例值 + 获取方式说明，提交到 Git |
| **运行时校验** | 应用启动时校验所有必填变量是否存在，缺失则立即报错阻止启动 |

---

## 二、完整环境变量清单

### 2.1 应用基础配置 (App)

| 变量名 | 是否必填 | 环境 | 用途说明 |
|--------|----------|------|----------|
| `NEXT_PUBLIC_APP_NAME` | ✅ 必填 | 全部 | 应用名称，用于页面 Title / OG 标签 / PWA Manifest。值: `WC2026 Command Center` |
| `NEXT_PUBLIC_APP_URL` | ✅ 必填 | 全部 | 应用完整 URL。Dev: `http://localhost:3000` / Preview: Vercel 自动分配 / Prod: `https://wc2026.example.com` |
| `NEXT_PUBLIC_APP_ENV` | ✅ 必填 | 全部 | 当前运行环境标识: `development` / `preview` / `production`。影响日志级别和调试功能开关 |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | 否 | Prod | 网站 Meta Description，用于 SEO。值: `2026世界杯实时观测平台——最快最准最好看的比分、数据、预测` |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | 否 | 全部 | 默认语言，值: `en`。用户未设置语言时的回退值 |

---

### 2.2 Supabase 数据库 (Supabase — Core)

| 变量名 | 是否必填 | 环境 | 用途说明 |
|--------|----------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ 必填 | 全部 | Supabase 项目 URL。格式: `https://<project-id>.supabase.co`。浏览器端和服务端均使用 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ 必填 | 全部 | Supabase 匿名公钥——客户端安全使用，受 Row Level Security 约束。只能访问被 RLS 策略允许的数据 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ 必填 | 服务端 | Supabase Service Role 密钥——**绕过 RLS，拥有数据库完全访问权限**。**严禁暴露给浏览器**。仅用于 API Routes / Cron Jobs / Webhooks |
| `SUPABASE_DB_URL` | 否 | 服务端 | Supabase PostgreSQL 直连 URL。格式: `postgresql://postgres:<password>@db.<project-id>.supabase.co:5432/postgres`。用于数据迁移和种子脚本 |
| `SUPABASE_JWT_SECRET` | 否 | 服务端 | Supabase Auth JWT 签名密钥，用于验证 Auth Webhook 回调的签名。在 Supabase Dashboard → Settings → Auth 中获取 |

---

### 2.3 Supabase 实时数据配置 (Supabase — Realtime)

| 变量名 | 是否必填 | 环境 | 用途说明 |
|--------|----------|------|----------|
| `NEXT_PUBLIC_REALTIME_ENABLED` | 否 | 全部 | 是否启用 Realtime 功能。Dev 可设为 `false` 以简化本地调试。默认 `true` |
| `REALTIME_BROADCAST_KEY` | 否 | 服务端 | Supabase Realtime Broadcast 授权密钥。用于服务端向频道广播消息（如系统通知广播） |
| `REALTIME_MAX_RETRIES` | 否 | 全部 | WebSocket 断线重连最大次数，默认 `10`。超过此次数后降级为轮询模式 |
| `REALTIME_RETRY_INTERVAL_MS` | 否 | 全部 | WebSocket 重连间隔（毫秒），默认 `3000` (3s)。指数退避：3s → 6s → 12s → 24s → ... |

---

### 2.4 Football API 数据供应商 (Football API)

| 变量名 | 是否必填 | 环境 | 用途说明 |
|--------|----------|------|----------|
| `FOOTBALL_API_BASE_URL` | ✅ 必填 | 全部 | Football API 根 URL。值: `https://api.opta.com/v3` 或 `https://api.statsbomb.com/v2` |
| `FOOTBALL_API_KEY` | ✅ 必填 | 全部 | API 认证密钥。请求头: `X-API-Key: <value>` |
| `FOOTBALL_API_SECRET` | 否 | 服务端 | API 签名密钥，用于 HMAC 签名认证（部分供应商需要双因素认证） |
| `FOOTBALL_API_PROVIDER` | ✅ 必填 | 全部 | 数据供应商标识。值: `opta` / `statsbomb` / `fifa_official`。影响服务层适配器选择 |
| `FOOTBALL_API_RATE_LIMIT_RPS` | 否 | 服务端 | 供应商每秒请求上限。默认 `10`。超过限制时自动排队+延迟 |
| `FOOTBALL_API_TIMEOUT_MS` | 否 | 服务端 | 请求超时时间（毫秒），默认 `10000` (10s)。超时后降级使用缓存数据 |
| `FOOTBALL_API_CACHE_TTL_S` | 否 | 服务端 | 数据缓存时间（秒），默认 `30`。在此时间内的重复请求直接返回缓存 |
| `FOOTBALL_API_RETRY_COUNT` | 否 | 服务端 | 失败重试次数，默认 `3`。仅对可重试错误(5xx/超时)生效 |
| `FOOTBALL_API_MOCK_MODE` | 否 | Dev | 模拟模式开关。`true` 时使用本地 Mock 数据，无需真实 API 调用。仅 Dev 环境有效 |

---

### 2.5 数据回退与冗余 (Data Fallback)

| 变量名 | 是否必填 | 环境 | 用途说明 |
|--------|----------|------|----------|
| `FALLBACK_API_BASE_URL` | 否 | Prod | 备用数据供应商 URL——当主 Football API 不可用时自动切换 |
| `FALLBACK_API_KEY` | 否 | Prod | 备用数据供应商 API Key |
| `FALLBACK_API_PROVIDER` | 否 | Prod | 备用供应商标识。值: `opta` / `statsbomb` / `livescore` |
| `DATA_SWITCH_THRESHOLD_FAILURES` | 否 | Prod | 触发主备切换的连续失败次数，默认 `5` |
| `DATA_SWITCH_AUTO_RECOVER_MIN` | 否 | Prod | 主数据源恢复后自动切回前的稳定时间（分钟），默认 `5` |

---

### 2.6 AI/ML 预测功能 (AI / Machine Learning)

| 变量名 | 是否必填 | 环境 | 用途说明 |
|--------|----------|------|----------|
| `AI_MODEL_API_URL` | ✅ 必填 | 全部 | AI 预测模型 API URL。独立部署的 Python/ML 推理服务。格式: `https://ai-ml.wc2026.example.com` |
| `AI_MODEL_API_KEY` | ✅ 必填 | 全部 | AI 模型 API 认证密钥。请求头: `Authorization: Bearer <value>` |
| `AI_MODEL_VERSION` | 否 | 全部 | 模型版本标签，如 `v3.2`。传入模型 API 用于选择正确的模型版本 |
| `AI_PREDICTION_CRON_SECRET` | ✅ 必填 | Prod | Vercel Cron Job 调用 `/api/cron/update-predictions` 时的认证密钥。防止外部恶意调用 |
| `AI_SIMULATION_COUNT` | 否 | 全部 | 蒙特卡洛模拟次数，默认 `10000`。数值越大预测越准但耗时越长。Dev 可设为 `100` |
| `AI_MAX_FEATURES` | 否 | 全部 | 最大特征维度，默认 `52`。与模型训练的特征数一致 |
| `AI_RATING_MODEL_URL` | 否 | Prod | 球员评分模型独立 URL（如果与预测模型分开部署） |
| `AI_RATING_MODEL_KEY` | 否 | Prod | 球员评分模型 API Key |
| `AI_TIMEOUT_MS` | 否 | 服务端 | AI 模型请求超时（毫秒），默认 `60000` (60s)。模型推理耗时较长 |

---

### 2.7 Vercel 部署配置 (Vercel)

| 变量名 | 是否必填 | 环境 | 用途说明 |
|--------|----------|------|----------|
| `VERCEL_URL` | 否 | Preview/Prod | Vercel 自动注入——当前部署的 URL。用于生成绝对路径和 OG 图片 URL |
| `VERCEL_ENV` | 否 | Preview/Prod | Vercel 自动注入——当前环境: `preview` / `production` |
| `VERCEL_GIT_COMMIT_SHA` | 否 | Preview/Prod | Vercel 自动注入——当前部署对应的 Git Commit SHA。用于错误追踪 |
| `CRON_SECRET` | ✅ 必填 | Prod | **所有 Cron Job 的通用认证密钥**。Cron 请求头: `Authorization: Bearer <CRON_SECRET>` |
| `CRON_UPDATE_PREDICTIONS_SCHEDULE` | 否 | Prod | 每日预测更新 Cron 表达式，默认 `0 8 * * *` (每日 08:00 UTC) |
| `CRON_CLEANUP_SCHEDULE` | 否 | Prod | 过期数据清理 Cron 表达式，默认 `0 3 * * *` (每日 03:00 UTC) |
| `CRON_SYNC_RANKING_SCHEDULE` | 否 | Prod | FIFA 排名同步 Cron 表达式，默认 `0 8 * * 1` (每周一 08:00 UTC) |
| `CRON_HEALTH_CHECK_SCHEDULE` | 否 | Prod | 健康检查 Cron 表达式，默认 `*/15 * * * *` (每 15 分钟) |
| `EDGE_CONFIG_ID` | 否 | Prod | Vercel Edge Config ID——用于动态配置（功能开关/缓存策略），无需重新部署即可修改 |
| `EDGE_CONFIG_TOKEN` | 否 | Prod | Vercel Edge Config 读写 Token |

---

### 2.8 认证增强 (Auth)

| 变量名 | 是否必填 | 环境 | 用途说明 |
|--------|----------|------|----------|
| `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED` | 否 | 全部 | 是否启用 Google 登录。值: `true` / `false` |
| `NEXT_PUBLIC_AUTH_APPLE_ENABLED` | 否 | 全部 | 是否启用 Apple 登录 |
| `NEXT_PUBLIC_AUTH_X_ENABLED` | 否 | 全部 | 是否启用 X(Twitter) 登录 |
| `NEXT_PUBLIC_AUTH_WECHAT_ENABLED` | 否 | 全部 | 是否启用微信登录（中国市场） |
| `AUTH_GOOGLE_CLIENT_ID` | 否 | 服务端 | Google OAuth Client ID（Supabase Dashboard → Auth → Providers 配置） |
| `AUTH_GOOGLE_CLIENT_SECRET` | 否 | 服务端 | Google OAuth Client Secret |
| `AUTH_APPLE_CLIENT_ID` | 否 | 服务端 | Apple OAuth Service ID |
| `AUTH_APPLE_CLIENT_SECRET` | 否 | 服务端 | Apple OAuth Private Key |
| `AUTH_X_CLIENT_ID` | 否 | 服务端 | X(Twitter) OAuth Client ID |
| `AUTH_X_CLIENT_SECRET` | 否 | 服务端 | X(Twitter) OAuth Client Secret |

> **注意:** 这些 OAuth 凭据实际配置在 Supabase Dashboard → Auth → Providers 中。环境变量仅用于控制前端登录按钮的显隐。

---

### 2.9 推送通知 (Web Push)

| 变量名 | 是否必填 | 环境 | 用途说明 |
|--------|----------|------|----------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ✅ 必填 | 全部 | Web Push VAPID 公钥——浏览器端订阅推送时使用 |
| `VAPID_PRIVATE_KEY` | ✅ 必填 | 服务端 | Web Push VAPID 私钥——服务端发送推送消息时签名。**严禁暴露** |
| `VAPID_SUBJECT` | 否 | 服务端 | VAPID 主体标识，通常为 `mailto:admin@example.com` |
| `NEXT_PUBLIC_WEB_PUSH_ENABLED` | 否 | 全部 | 是否启用 Web Push 功能，默认 `true` |

---

### 2.10 邮件服务 (Email)

| 变量名 | 是否必填 | 环境 | 用途说明 |
|--------|----------|------|----------|
| `EMAIL_PROVIDER` | 否 | Prod | 邮件服务商: `sendgrid` / `resend` / `supabase`。默认使用 Supabase 内置邮件 |
| `SENDGRID_API_KEY` | 否 | Prod | SendGrid API Key（如使用 SendGrid 发送通知邮件） |
| `SENDGRID_FROM_EMAIL` | 否 | Prod | 发件人邮箱，如 `noreply@wc2026.example.com` |
| `RESEND_API_KEY` | 否 | Prod | Resend API Key（备选邮件服务商） |

---

### 2.11 第三方集成 (Third-Party)

| 变量名 | 是否必填 | 环境 | 用途说明 |
|--------|----------|------|----------|
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` | 否 | Prod | Google Analytics 4 Measurement ID。格式: `G-XXXXXXXXXX`。用户行为分析 |
| `NEXT_PUBLIC_SENTRY_DSN` | 否 | Prod | Sentry DSN——前端错误监控。格式: `https://<key>@sentry.io/<project>` |
| `SENTRY_AUTH_TOKEN` | 否 | Prod | Sentry Auth Token——上传 Source Map |
| `SENTRY_ORG` | 否 | Prod | Sentry 组织名 |
| `SENTRY_PROJECT` | 否 | Prod | Sentry 项目名 |
| `NEXT_PUBLIC_POSTHOG_KEY` | 否 | Prod | PostHog API Key——产品分析（用户行为漏斗） |
| `NEXT_PUBLIC_POSTHOG_HOST` | 否 | Prod | PostHog 实例 URL，如 `https://app.posthog.com` |

---

### 2.12 CDN 与存储 (CDN & Storage)

| 变量名 | 是否必填 | 环境 | 用途说明 |
|--------|----------|------|----------|
| `NEXT_PUBLIC_CDN_URL` | 否 | Prod | 静态资源 CDN URL。国旗/队徽/球员照片的前缀路径。格式: `https://cdn.wc2026.example.com` |
| `NEXT_PUBLIC_IMAGE_PROXY_URL` | 否 | Prod | 图片代理/优化服务 URL。如使用 Vercel 内置 Image Optimization 则无需配置 |
| `SUPABASE_STORAGE_URL` | 否 | 全部 | Supabase Storage URL——用于用户上传头像等。格式: `https://<project-id>.supabase.co/storage/v1` |

---

### 2.13 缓存与性能 (Cache & Performance)

| 变量名 | 是否必填 | 环境 | 用途说明 |
|--------|----------|------|----------|
| `CACHE_STATIC_MAX_AGE_S` | 否 | Prod | 静态数据(球队/球员) CDN 缓存时间(秒)，默认 `3600` (1h) |
| `CACHE_SCHEDULE_MAX_AGE_S` | 否 | Prod | 赛程数据缓存时间(秒)，默认 `300` (5min) |
| `CACHE_LIVE_MAX_AGE_S` | 否 | Prod | 实时数据缓存时间(秒)，默认 `0` (不缓存) |
| `NEXT_PUBLIC_ISR_REVALIDATE_S` | 否 | Prod | Next.js ISR 页面重新验证间隔(秒)。静态页面(球队/球员详情)的增量静态再生。默认 `3600` |
| `RATE_LIMIT_REQUESTS_PER_MIN` | 否 | Prod | API 全局限速——每分钟最大请求数/IP。默认 `120` |
| `RATE_LIMIT_AUTH_PER_MIN` | 否 | Prod | 认证接口限速——每分钟每 IP 最大请求数。默认 `10` |

---

### 2.14 安全 (Security)

| 变量名 | 是否必填 | 环境 | 用途说明 |
|--------|----------|------|----------|
| `CSRF_SECRET` | 否 | Prod | CSRF Token 签名密钥。用于防跨站请求伪造 |
| `ENCRYPTION_KEY` | 否 | Prod | 敏感数据加密密钥（用户手机号等）。32 字节 Base64 编码 |
| `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` | 否 | Prod | hCaptcha 站点 Key——登录/注册页面防机器人 |
| `HCAPTCHA_SECRET_KEY` | 否 | Prod | hCaptcha 服务端验证密钥 |
| `ALLOWED_ORIGINS` | 否 | Prod | CORS 允许的源列表，逗号分隔。Prod: `https://wc2026.example.com`。防止跨域攻击 |
| `CONTENT_SECURITY_POLICY` | 否 | Prod | 自定义 CSP 策略字符串。默认使用 Next.js 内置 CSP |

---

### 2.15 调试与日志 (Debug & Logging)

| 变量名 | 是否必填 | 环境 | 用途说明 |
|--------|----------|------|----------|
| `LOG_LEVEL` | 否 | 全部 | 日志级别: `error` / `warn` / `info` / `debug`。Dev 默认 `debug`，Prod 默认 `info` |
| `NEXT_PUBLIC_DEBUG_MODE` | 否 | Dev | 调试模式开关。`true` 时显示开发工具栏+数据加载耗时+Realtime 事件日志 |
| `NEXT_PUBLIC_API_MOCK_MODE` | 否 | Dev | API Mock 模式——`true` 时前端使用 Mock Service Worker 拦截所有 API 请求 |
| `SUPABASE_LOG_QUERIES` | 否 | Dev | 是否打印 Supabase 查询日志。Dev 默认 `true`，Prod 必须 `false` |

---

### 2.16 国际化 (i18n)

| 变量名 | 是否必填 | 环境 | 用途说明 |
|--------|----------|------|----------|
| `NEXT_PUBLIC_SUPPORTED_LOCALES` | 否 | 全部 | 支持的语言列表，逗号分隔。值: `en,zh,es,fr,ar,pt,ja,ko` |
| `NEXT_PUBLIC_I18N_FALLBACK_LOCALE` | 否 | 全部 | 翻译缺失时的回退语言。默认 `en` |
| `I18N_LOAD_TRANSLATIONS_PATH` | 否 | 服务端 | 翻译字典文件路径。默认 `src/i18n/dictionaries` |

---

## 三、环境变量分组速查

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ENV VARIABLES INDEX                                     │
│                                                                                   │
│  分组              数量  浏览器可见    关键机密                                   │
│  ──────────────────────────────────────────────────────────────────────────────  │
│  App                5     5            0                                         │
│  Supabase Core      5     2            1 (SUPABASE_SERVICE_ROLE_KEY)              │
│  Supabase Realtime  3     1            0                                         │
│  Football API       9     1            2 (KEY + SECRET)                          │
│  Data Fallback      5     0            1 (FALLBACK_API_KEY)                      │
│  AI/ML              8     0            2 (API_KEY + CRON_SECRET)                 │
│  Vercel             9     0            2 (CRON_SECRET + EDGE_CONFIG_TOKEN)       │
│  Auth               10    4            6 (OAuth Secrets)                          │
│  Web Push           3     1            1 (VAPID_PRIVATE_KEY)                     │
│  Email              3     0            1 (SENDGRID_API_KEY)                      │
│  Third-Party        7     3            1 (SENTRY_AUTH_TOKEN)                     │
│  CDN & Storage      3     2            0                                         │
│  Cache              5     1            0                                         │
│  Security           5     1            4 (SECRET + KEY + HCAPTCHA)               │
│  Debug              4     2            0                                         │
│  i18n               3     2            0                                         │
│  ──────────────────────────────────────────────────────────────────────────────  │
│  合计               87    25           22 (机密不可暴露)                          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 四、`.env.example` 模板

```
# =============================================================================
# World Cup 2026 Command Center — Environment Variables
# =============================================================================
# 使用说明:
#   1. 复制此文件为 .env.local
#   2. 填入实际值
#   3. .env.local 已加入 .gitignore，不会被提交
#
# 获取方式:
#   Supabase:   https://supabase.com/dashboard/project/<id>/settings/api
#   Football API: 联系数据供应商获取
#   AI Model:  联系 AI 团队获取 API 地址和密钥
#   Vercel:    https://vercel.com/<team>/<project>/settings/environment-variables
# =============================================================================

# --- App ---
NEXT_PUBLIC_APP_NAME=WC2026 Command Center
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_SITE_DESCRIPTION=2026世界杯实时观测平台
NEXT_PUBLIC_DEFAULT_LOCALE=en

# --- Supabase ---
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DB_URL=postgresql://postgres:<password>@db.<project-id>.supabase.co:5432/postgres
SUPABASE_JWT_SECRET=your-jwt-secret-here

# --- Supabase Realtime ---
NEXT_PUBLIC_REALTIME_ENABLED=true
REALTIME_BROADCAST_KEY=
REALTIME_MAX_RETRIES=10
REALTIME_RETRY_INTERVAL_MS=3000

# --- Football API ---
FOOTBALL_API_BASE_URL=https://api.opta.com/v3
FOOTBALL_API_KEY=your-api-key-here
FOOTBALL_API_SECRET=
FOOTBALL_API_PROVIDER=opta
FOOTBALL_API_RATE_LIMIT_RPS=10
FOOTBALL_API_TIMEOUT_MS=10000
FOOTBALL_API_CACHE_TTL_S=30
FOOTBALL_API_RETRY_COUNT=3
FOOTBALL_API_MOCK_MODE=false

# --- Data Fallback ---
FALLBACK_API_BASE_URL=
FALLBACK_API_KEY=
FALLBACK_API_PROVIDER=
DATA_SWITCH_THRESHOLD_FAILURES=5
DATA_SWITCH_AUTO_RECOVER_MIN=5

# --- AI/ML ---
AI_MODEL_API_URL=https://ai-ml.wc2026.example.com
AI_MODEL_API_KEY=your-ai-model-api-key
AI_MODEL_VERSION=v3.2
AI_PREDICTION_CRON_SECRET=random-secret-string-here
AI_SIMULATION_COUNT=10000
AI_MAX_FEATURES=52
AI_RATING_MODEL_URL=
AI_RATING_MODEL_KEY=
AI_TIMEOUT_MS=60000

# --- Vercel ---
CRON_SECRET=another-random-secret-string
CRON_UPDATE_PREDICTIONS_SCHEDULE=0 8 * * *
CRON_CLEANUP_SCHEDULE=0 3 * * *
CRON_SYNC_RANKING_SCHEDULE=0 8 * * 1
CRON_HEALTH_CHECK_SCHEDULE=*/15 * * * *
EDGE_CONFIG_ID=
EDGE_CONFIG_TOKEN=

# --- Auth (OAuth) ---
NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true
NEXT_PUBLIC_AUTH_APPLE_ENABLED=true
NEXT_PUBLIC_AUTH_X_ENABLED=true
NEXT_PUBLIC_AUTH_WECHAT_ENABLED=false
AUTH_GOOGLE_CLIENT_ID=
AUTH_GOOGLE_CLIENT_SECRET=
AUTH_APPLE_CLIENT_ID=
AUTH_APPLE_CLIENT_SECRET=
AUTH_X_CLIENT_ID=
AUTH_X_CLIENT_SECRET=

# --- Web Push ---
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:admin@example.com
NEXT_PUBLIC_WEB_PUSH_ENABLED=true

# --- Email ---
EMAIL_PROVIDER=supabase
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@wc2026.example.com
RESEND_API_KEY=

# --- Third-Party ---
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://<key>@sentry.io/<project>
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# --- CDN & Storage ---
NEXT_PUBLIC_CDN_URL=
NEXT_PUBLIC_IMAGE_PROXY_URL=
SUPABASE_STORAGE_URL=

# --- Cache ---
CACHE_STATIC_MAX_AGE_S=3600
CACHE_SCHEDULE_MAX_AGE_S=300
CACHE_LIVE_MAX_AGE_S=0
NEXT_PUBLIC_ISR_REVALIDATE_S=3600
RATE_LIMIT_REQUESTS_PER_MIN=120
RATE_LIMIT_AUTH_PER_MIN=10

# --- Security ---
CSRF_SECRET=random-csrf-secret
ENCRYPTION_KEY=32-byte-base64-encoded-key
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=
HCAPTCHA_SECRET_KEY=
ALLOWED_ORIGINS=http://localhost:3000
CONTENT_SECURITY_POLICY=

# --- Debug ---
LOG_LEVEL=debug
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_API_MOCK_MODE=false
SUPABASE_LOG_QUERIES=true

# --- i18n ---
NEXT_PUBLIC_SUPPORTED_LOCALES=en,zh,es,fr,ar,pt,ja,ko
NEXT_PUBLIC_I18N_FALLBACK_LOCALE=en
I18N_LOAD_TRANSLATIONS_PATH=src/i18n/dictionaries
```

---

## 五、安全分级

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SECURITY CLASSIFICATION                                 │
│                                                                                   │
│  🔴 CRITICAL (泄露=灾难)                                                          │
│  ├── SUPABASE_SERVICE_ROLE_KEY    数据库完全访问权限，可读写删除所有数据          │
│  ├── FOOTBALL_API_KEY + SECRET   付费数据源，泄露造成财务损失和数据滥用            │
│  ├── AI_MODEL_API_KEY            AI 推理服务，泄露造成算力盗用                    │
│  ├── CRON_SECRET                 Cron Job 认证，可触发批量数据操作                │
│  ├── VAPID_PRIVATE_KEY           推送签名密钥，可向所有用户发送虚假推送            │
│  └── ENCRYPTION_KEY              用户隐私数据解密                                 │
│                                                                                   │
│  🟡 HIGH (泄露=风险)                                                              │
│  ├── OAuth Client Secrets        可伪造第三方登录                                │
│  ├── SUPABASE_JWT_SECRET         可伪造 Auth Webhook                             │
│  ├── SUPABASE_DB_URL             数据库直连 URL                                  │
│  ├── AI_PREDICTION_CRON_SECRET   预测更新触发密钥                                 │
│  └── CSRF_SECRET                 防跨站请求伪造                                   │
│                                                                                   │
│  🟢 SAFE (浏览器可见)                                                             │
│  ├── NEXT_PUBLIC_*               所有 NEXT_PUBLIC_ 前缀变量                       │
│  └── (不会暴露敏感信息)                                                            │
│                                                                                   │
│  管理方式:                                                                        │
│  · Dev:           .env.local 文件 (不提交 Git)                                    │
│  · Preview/Prod:  Vercel Environment Variables 面板                               │
│  · CI/CD:         GitHub Secrets → Vercel 同步                                    │
│  · 密钥轮换:      所有 🔴 级密钥每 90 天轮换一次                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 六、Vercel 环境变量配置界面映射

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                   Vercel Dashboard → Settings → Environment Variables            │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │  Key                              Value                    Environment      ││
│  ├─────────────────────────────────────────────────────────────────────────────┤│
│  │  NEXT_PUBLIC_APP_URL              https://wc2026.app       Production       ││
│  │  NEXT_PUBLIC_SUPABASE_URL         https://xxx.supabase.co  Production       ││
│  │  NEXT_PUBLIC_SUPABASE_ANON_KEY    eyJhbG...                Production       ││
│  │  SUPABASE_SERVICE_ROLE_KEY        eyJhbG...                Production       ││
│  │  FOOTBALL_API_KEY                 sk_live_...              Production       ││
│  │  AI_MODEL_API_KEY                 ai_key_...               Production       ││
│  │  CRON_SECRET                      ********                 Production       ││
│  │  ...                             ...                       ...              ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                   │
│  生产环境 (Production)  : 使用正式 Football API + 付费 AI 模型                     │
│  预览环境 (Preview)     : 继承 Production 变量，可覆盖为 Staging 数据源             │
│  开发环境 (Development) : 本地 .env.local，可使用 Mock 数据进行开发                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 七、`.gitignore` 相关配置

```
# 环境变量 — 绝不提交
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# 保留示例文件
!.env.example
```

---

> **文档结束。** 环境变量设计覆盖 16 个分组共 87 个变量，其中 22 个为机密不可暴露。`.env.example` 文件可直接复制到项目根目录使用。
