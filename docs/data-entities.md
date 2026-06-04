# 核心数据实体分析 — World Cup 2026 Command Center

> **文档类型:** 数据架构分析（非数据库设计）
> **分析视角:** 基于 11 页完整产品原型，提取核心实体及关系
> **版本:** v1.0 / 2026-06-04

---

## 一、实体全景关系图

```
                              ┌─────────────┐
                              │   赛事/锦标赛  │
                              │  Tournament  │
                              └──────┬──────┘
                                     │ 1
                                     │ 包含
                                     │ N
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
        ┌──────────┐          ┌──────────┐          ┌──────────┐
        │   小组    │          │ 淘汰赛阶段 │          │   场馆    │
        │  Group   │          │KnockoutSt │          │  Venue   │
        └────┬─────┘          └────┬─────┘          └────┬─────┘
             │                     │                      │
             │ 1:N                 │ 1:N                  │ 1:N
             ▼                     ▼                      │
        ┌──────────┐          ┌──────────┐               │
        │  积分榜   │          │   比赛    │◀──────────────┘
        │ Standing │          │  Match   │
        └──────────┘          └────┬─────┘
                                   │
          ┌────────────┬───────────┼───────────┬────────────┐
          │            │           │           │            │
          ▼            ▼           ▼           ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ 比赛事件  │ │ 比赛统计  │ │ 球员评分  │ │ 阵容/首发 │ │  裁判    │
    │MatchEvent│ │MatchStats│ │PlayerRate│ │  Squad   │ │ Referee  │
    └──────────┘ └──────────┘ └────┬─────┘ └────┬─────┘ └──────────┘
                                   │             │
                                   │             │
              ┌────────────────────┼─────────────┘
              │                    │
              ▼                    ▼
        ┌──────────┐        ┌──────────┐
        │   球队    │◀──────▶│   球员    │
        │  Team    │  N:N   │  Player  │
        └────┬─────┘        └────┬─────┘
             │                   │
             │                   │
        ┌────┴────┐         ┌────┴────┐
        │  主教练  │         │ 球员荣誉 │
        │  Coach  │         │PlayerHon│
        └─────────┘         └─────────┘

    ┌──────────────────────────────────────────────────────┐
    │                      用户域                          │
    │                                                      │
    │  ┌──────────┐                                        │
    │  │   用户    │                                        │
    │  │   User   │                                        │
    │  └────┬─────┘                                        │
    │       │                                               │
    │       ├──▶ 收藏 ──▶ 球队/球员/比赛                    │
    │       ├──▶ 关注 ──▶ 球队/球员                         │
    │       ├──▶ 通知设置                                   │
    │       ├──▶ 推送通知                                   │
    │       ├──▶ 用户预测                                   │
    │       ├──▶ 显示/隐私设置                              │
    │       └──▶ 聊天消息                                   │
    └──────────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────────┐
    │                     内容域                            │
    │                                                      │
    │  ┌──────────┐     ┌──────────┐     ┌──────────┐      │
    │  │  新闻文章 │     │  AI预测   │     │ 社区帖子  │      │
    │  │  Article │     │Prediction│     │CommPost  │      │
    │  └────┬─────┘     └────┬─────┘     └──────────┘      │
    │       │                │                              │
    │       ├── 关联 ──▶ 球队/球员/比赛                     │
    │       └── 评论 ──▶ 用户                               │
    └──────────────────────────────────────────────────────┘
```

---

## 二、核心实体详解

### 2.1 域一：赛事架构（Tournament Structure）

---

#### 实体 1：赛事 (Tournament)

| 维度 | 描述 |
|------|------|
| **作用** | 代表 2026 世界杯这项赛事本身——所有数据的顶层容器 |
| **生命周期** | 赛前创建 → 赛中活跃 → 赛后归档 |
| **关键职责** | 定义赛事名称、起止日期、参赛球队范围、赛事规则版本 |

**关系：**

```
Tournament 1 ──── N Team          (赛事包含 48 支参赛球队)
Tournament 1 ──── N Match         (赛事包含 104 场比赛)
Tournament 1 ──── N Group         (赛事划分为 12 个小组)
Tournament 1 ──── N KnockoutStage (赛事包含多轮淘汰赛)
Tournament 1 ──── N Venue         (赛事使用多个场馆)
Tournament 1 ──── N Article       (赛事相关的所有新闻)
Tournament 1 ──── N Prediction    (赛事级别的 AI 预测)
```

---

#### 实体 2：小组 (Group)

| 维度 | 描述 |
|------|------|
| **作用** | 12 个小组的划分——小组赛阶段球队分组和积分排名的容器 |
| **生命周期** | 抽签时创建 → 小组赛结束时"关闭"（积分榜冻结） |

**关系：**

```
Group N ──── 1 Tournament   (小组属于赛事)
Group 1 ──── 4 Team         (每组 4 支球队)
Group 1 ──── N Standing     (产生积分排名)
Group 1 ──── N Match        (组内所有比赛)
```

---

#### 实体 3：淘汰赛阶段 (KnockoutStage)

| 维度 | 描述 |
|------|------|
| **作用** | 淘汰赛的每一轮结构定义——1/16决赛→1/8→1/4→半决赛→三四名→决赛 |
| **职责** | 定义轮次顺序、晋级规则(90分钟平局→加时→点球) |

**关系：**

```
KnockoutStage N ──── 1 Tournament    (淘汰赛属于赛事)
KnockoutStage 1 ──── N Match         (每轮包含多场比赛)
KnockoutStage 1 ──── 0..1 KnockoutStage  (前一轮 → 后一轮，形成树状晋级链)
```

---

#### 实体 4：场馆 (Venue)

| 维度 | 描述 |
|------|------|
| **作用** | 比赛举办场地——存储体育场信息和容量 |
| **职责** | 提供场馆名称、城市、容量、时区，供赛程展示和比赛详情使用 |

**关系：**

```
Venue N ──── 1 Tournament   (场馆属于本届赛事)
Venue 1 ──── N Match        (一个场馆举办多场比赛)
```

---

### 2.2 域二：参赛主体（Participants）

---

#### 实体 5：球队 (Team)

| 维度 | 描述 |
|------|------|
| **作用** | 48 支参赛国家队——整个平台的核心实体之一 |
| **职责** | 承载球队身份、FIFA 排名、历史成绩、战术风格、晋级状态 |
| **页面映射** | 国家队详情页 `/teams/:id` |

**关系：**

```
Team N ──── N Tournament    (球队参加赛事，通过中间实体关联)
Team N ──── N Group         (球队属于小组)
Team N ──── N Player        (球队拥有 26 名球员，球员可能转会但本届阵容固定)
Team 1 ──── 1 Coach         (球队有 1 名主教练)
Team 1 ──── N Match         (球队参与比赛，主队或客队)
Team 1 ──── N Standing      (球队产生积分排名)
Team 1 ──── N Squad         (球队提交正式大名单)
Team 1 ──── N TeamHonor     (球队拥有世界杯历史荣誉)
Team N ──── N User          (用户收藏/关注球队)
Team 1 ──── N Prediction    (球队是预测对象)
```

---

#### 实体 6：球员 (Player)

| 维度 | 描述 |
|------|------|
| **作用** | 832 名参赛球员——用户高频搜索和查看的实体 |
| **职责** | 承载球员身份、位置、身体数据、能力雷达、本届表现 |
| **页面映射** | 球员详情页 `/players/:id` |

**关系：**

```
Player N ──── N Team          (球员属于国家队，本届阵容固定)
Player N ──── N Match         (球员参与比赛，通过出场/阵容关联)
Player 1 ──── N MatchEvent    (球员触发比赛事件——进球、黄牌、换人等)
Player 1 ──── N PlayerMatchStats (球员每场比赛的个人统计)
Player 1 ──── N PlayerRating  (球员每场比赛的评分)
Player 1 ──── N PlayerHonor   (球员职业生涯荣誉)
Player 1 ──── N Squad         (球员被选入大名单)
Player N ──── N User          (用户收藏/关注球员)
Player 1 ──── N Prediction    (球员是金靴预测对象)
```

---

#### 实体 7：主教练 (Coach)

| 维度 | 描述 |
|------|------|
| **作用** | 48 位主教练——球队的战术决策者 |
| **职责** | 承载教练身份、执教战绩、常用阵型、执教风格 |

**关系：**

```
Coach 1 ──── 1 Team           (教练执教 1 支球队)
Coach 1 ──── N CoachHonor     (教练执教荣誉)
```

---

#### 实体 8：裁判 (Referee)

| 维度 | 描述 |
|------|------|
| **作用** | 执法比赛的裁判团队 |
| **职责** | 承载裁判姓名、国籍、执法场次记录 |

**关系：**

```
Referee N ──── N Match        (裁判执法多场比赛)
```

---

### 2.3 域三：比赛核心（Match Core）

---

#### 实体 9：比赛 (Match)

| 维度 | 描述 |
|------|------|
| **作用** | 104 场比赛——**这是整个平台最核心的实体，数据密度最高** |
| **职责** | 承载对阵双方、开球时间、比赛状态、比分、场馆、裁判 |
| **页面映射** | 比赛详情页 `/matches/:id` · 比赛中心 · 赛程中心 · 历史比赛 |

**关系：**

```
Match N ──── 1 Tournament     (比赛属于赛事)
Match N ──── 1 Group          (小组赛比赛属于小组)
Match N ──── 1 KnockoutStage  (淘汰赛比赛属于某轮)
Match N ──── 1 Venue          (比赛在某个场馆举行)
Match N ──── 2 Team           (比赛有 2 支参赛队: 主队 + 客队)
Match N ──── N Referee        (比赛有裁判团队)
Match 1 ──── N MatchEvent     (比赛包含一系列事件)
Match 1 ──── 1 MatchStats     (比赛有 1 组统计数据)
Match 1 ──── N PlayerRating   (比赛产生所有上场球员的评分)
Match 1 ──── N Squad          (比赛双方各提交首发+替补名单)
Match 1 ──── N PlayerMatchStats (比赛产生每个上场球员的个人统计)
Match 1 ──── N Prediction     (比赛是预测对象)
Match 1 ──── N Article        (比赛关联新闻报道)
Match N ──── N User           (用户收藏比赛)
```

---

#### 实体 10：比赛事件 (MatchEvent)

| 维度 | 描述 |
|------|------|
| **作用** | 比赛中发生的每一个关键事件的记录——**这是实时推送和事件时间线的数据源** |
| **类型** | 进球(含点球/乌龙) · 黄牌 · 红牌(含两黄变红) · 换人 · VAR回看 · 半场/全场 · 伤停补时 |
| **职责** | 承载事件类型、发生时间(分钟+秒)、涉事球员、助攻球员、事件描述 |

**关系：**

```
MatchEvent N ──── 1 Match        (事件属于一场比赛)
MatchEvent N ──── 1 Player       (事件涉及主要球员: 进球者/被罚者/被换下者)
MatchEvent N ──── 0..1 Player    (事件涉及次要球员: 助攻者/换上者)
```

---

#### 实体 11：比赛统计 (MatchStats)

| 维度 | 描述 |
|------|------|
| **作用** | 一场比赛的核心统计数据——控球率、射门、xG 等 20+ 指标 |
| **职责** | 按球队分组存储比赛级别的聚合统计数据 |

**关系：**

```
MatchStats 1 ──── 1 Match       (统计属于一场比赛)
MatchStats N ──── 1 Team        (统计数据按球队分组: 主队统计 + 客队统计)
```

---

#### 实体 12：球员比赛统计 (PlayerMatchStats)

| 维度 | 描述 |
|------|------|
| **作用** | 单个球员在单场比赛中的个人表现数据 |
| **职责** | 承载进球、助攻、射门、传球、抢断、跑动距离等个人指标 |

**关系：**

```
PlayerMatchStats N ──── 1 Match    (关联一场比赛)
PlayerMatchStats N ──── 1 Player   (关联一名球员)
PlayerMatchStats N ──── 1 Team     (关联球员所属球队)
```

---

#### 实体 13：球员评分 (PlayerRating)

| 维度 | 描述 |
|------|------|
| **作用** | 赛后 AI 对每位上场球员的综合评分(1-10 分) |
| **职责** | 承载评分值、是否是全场最佳(MVP)、评分依据摘要 |

**关系：**

```
PlayerRating N ──── 1 Match      (评分属于一场比赛)
PlayerRating N ──── 1 Player     (评分针对一名球员)
```

---

#### 实体 14：阵容/大名单 (Squad)

| 维度 | 描述 |
|------|------|
| **作用** | 球队的正式 26 人大名单 + 每场比赛的首发 11 人 + 替补 |
| **职责** | 区分"赛前预测阵容"和"官方公布阵容"；记录首发/替补/未上场状态 |

**关系：**

```
Squad N ──── 1 Team              (阵容属于一支球队)
Squad N ──── 1 Match             (阵容关联一场比赛——首发+替补)
Squad 1 ──── N Player            (阵容包含多名球员，每名球员有: 是否首发/替补上场时间/被换下时间/号码)
```

---

#### 实体 15：积分榜 (Standing)

| 维度 | 描述 |
|------|------|
| **作用** | 小组赛阶段的实时积分排名——**晋级判断的核心数据** |
| **职责** | 承载胜/平/负场次、进/失球、净胜球、积分、晋级状态(已晋级/争夺中/已淘汰) |

**关系：**

```
Standing N ──── 1 Group          (积分榜属于一个小组)
Standing N ──── 1 Team           (积分榜每行对应一支球队)
Standing N ──── 1 Tournament     (积分榜属于一届赛事)
```

---

### 2.4 域四：荣誉体系（Honors）

---

#### 实体 16：球队荣誉 (TeamHonor)

| 维度 | 描述 |
|------|------|
| **作用** | 球队在世界杯历史上的成绩记录——从 1930 年到 2022 年 |
| **职责** | 承载每届世界杯的最终成绩(冠军/亚军/季军/第几名/阶段) |

**关系：**

```
TeamHonor N ──── 1 Team          (荣誉属于一支球队)
TeamHonor N ──── 1 Tournament    (荣誉关联具体赛事——每届世界杯)
```

---

#### 实体 17：球员荣誉 (PlayerHonor)

| 维度 | 描述 |
|------|------|
| **作用** | 球员职业生涯的主要荣誉(世界杯冠军/金球奖/欧冠等) |
| **职责** | 承载荣誉名称、获得年份、所属球队/俱乐部 |

**关系：**

```
PlayerHonor N ──── 1 Player      (荣誉属于一名球员)
```

---

#### 实体 18：教练荣誉 (CoachHonor)

| 维度 | 描述 |
|------|------|
| **作用** | 主教练执教生涯的主要荣誉 |
| **职责** | 承载荣誉名称、获得年份、执教球队 |

**关系：**

```
CoachHonor N ──── 1 Coach        (荣誉属于一位教练)
```

---

### 2.5 域五：用户体系（User Domain）

---

#### 实体 19：用户 (User)

| 维度 | 描述 |
|------|------|
| **作用** | 所有个人功能的归属——收藏、关注、通知、预测记录 |
| **职责** | 承载用户身份、认证信息、注册来源 |

**关系：**

```
User 1 ──── N Favorite          (用户有收藏列表)
User 1 ──── N Follow            (用户有关注列表)
User 1 ──── N Notification      (用户收到通知)
User 1 ──── 1 NotificationPref  (用户有通知偏好设置)
User 1 ──── 1 UserSetting       (用户有显示/语言/隐私设置)
User 1 ──── N UserPrediction    (用户提交的预测)
User 1 ──── N ChatMessage       (用户发送的聊天消息)
User 1 ──── N CommunityPost     (用户发布的社区帖子)
```

---

#### 实体 20：收藏 (Favorite)

| 维度 | 描述 |
|------|------|
| **作用** | 用户标记"想看"的球队/球员/比赛——驱动"我的收藏"页面 |
| **职责** | 承载收藏类型(球队/球员/比赛)、收藏时间 |

**关系：**

```
Favorite N ──── 1 User           (收藏属于一个用户)
Favorite N ──── 0..1 Team        (收藏对象是球队)
Favorite N ──── 0..1 Player      (收藏对象是球员)
Favorite N ──── 0..1 Match       (收藏对象是比赛)
```

---

#### 实体 21：关注 (Follow)

| 维度 | 描述 |
|------|------|
| **作用** | 用户设定"主队"和"关注球员"——驱动个性化首页和推送 |
| **职责** | 承载关注对象、关注时间。与收藏不同，关注会产生推送触达 |

**关系：**

```
Follow N ──── 1 User             (关注属于一个用户)
Follow N ──── 0..1 Team          (关注一支球队)
Follow N ──── 0..1 Player        (关注一名球员)
```

---

#### 实体 22：推送通知 (Notification)

| 维度 | 描述 |
|------|------|
| **作用** | 系统向用户推送的消息——比赛开始、进球、红牌等 |
| **职责** | 承载通知类型、标题、内容、关联实体链接、是否已读、发送时间 |

**关系：**

```
Notification N ──── 1 User       (通知发送给某个用户)
Notification N ──── 0..1 Match   (通知关联比赛)
Notification N ──── 0..1 Team    (通知关联球队)
Notification N ──── 0..1 Player  (通知关联球员)
```

---

#### 实体 23：通知偏好 (NotificationPreference)

| 维度 | 描述 |
|------|------|
| **作用** | 用户对通知的精细化控制——哪些事件发通知、通过什么渠道 |
| **职责** | 承载事件类型开关(比赛开始/进球/红牌/新闻)、渠道选择(浏览器/邮件)、提前时间 |

**关系：**

```
NotificationPreference 1 ──── 1 User    (每个用户有 1 份通知偏好)
```

---

#### 实体 24：用户设置 (UserSetting)

| 维度 | 描述 |
|------|------|
| **作用** | 用户的显示偏好、语言、时区、隐私设置 |
| **职责** | 承载主题模式、语言选择、时区、数据单位、隐私开关 |

**关系：**

```
UserSetting 1 ──── 1 User        (每个用户有 1 份设置)
```

---

### 2.6 域六：内容与社交（Content & Social）

---

#### 实体 25：新闻文章 (Article)

| 维度 | 描述 |
|------|------|
| **作用** | 世界杯相关的新闻报道和深度内容——驱动新闻中心和首页焦点故事 |
| **职责** | 承载标题、正文、封面图、分类标签、发布来源、语言版本 |

**关系：**

```
Article N ──── 1 Tournament      (文章属于赛事)
Article N ──── 0..1 Match        (文章关联比赛——赛前前瞻/赛后战报)
Article N ──── 0..1 Team         (文章关联球队)
Article N ──── 0..1 Player       (文章关联球员)
Article N ──── N Tag             (文章有多个标签)
```

---

#### 实体 26：AI 预测 (Prediction)

| 维度 | 描述 |
|------|------|
| **作用** | AI 模型对比赛胜负/比分/冠军/金靴的预测——驱动预测中心和 AI 分析中心 |
| **职责** | 承载预测类型、预测值、置信度、模型版本、模拟次数 |

**关系：**

```
Prediction N ──── 1 Tournament   (预测属于赛事)
Prediction N ──── 0..1 Match     (预测针对一场比赛——胜负/比分)
Prediction N ──── 0..1 Team      (预测针对一支球队——夺冠概率/晋级概率)
Prediction N ──── 0..1 Player    (预测针对一名球员——金靴概率)
```

---

#### 实体 27：用户预测 (UserPrediction)

| 维度 | 描述 |
|------|------|
| **作用** | 用户提交的预测——比分预测、冠军预测等 |
| **职责** | 承载用户预测值、实际结果对比、得分(用于排行榜) |

**关系：**

```
UserPrediction N ──── 1 User     (预测由用户提交)
UserPrediction N ──── 1 Match    (预测针对一场比赛)
UserPrediction N ──── 0..1 Team  (预测冠军归属)
```

---

#### 实体 28：社区帖子 (CommunityPost)

| 维度 | 描述 |
|------|------|
| **作用** | 用户发布的战术分析、球评、讨论帖——驱动社区中心(V2.0) |
| **职责** | 承载标题、正文、话题分类、点赞数、回复数 |

**关系：**

```
CommunityPost N ──── 1 User      (帖子由用户发布)
CommunityPost N ──── 1 Topic     (帖子属于某个话题分类)
CommunityPost N ──── N Match     (帖子关联比赛)
CommunityPost N ──── N Team      (帖子关联球队)
```

---

#### 实体 29：聊天消息 (ChatMessage)

| 维度 | 描述 |
|------|------|
| **作用** | 比赛聊天室中的实时消息——驱动比赛详情页聊天室 |
| **职责** | 承载消息内容、发送时间、消息类型(文字/表情/GIF) |

**关系：**

```
ChatMessage N ──── 1 User        (消息由用户发送)
ChatMessage N ──── 1 Match       (消息属于一场比赛的聊天室)
```

---

## 三、实体关系速查矩阵

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           实体关系速查 (→ 表示"多对一"或"一对多")                   │
├────────────┬────────────────────────────────────────────────────────────────────┤
│ Tournament │ → Group · KnockoutStage · Venue · Match · Team · Prediction · Article │
│ Group      │ → Tournament · Team(4) · Standing · Match                            │
│ KnockoutSt │ → Tournament · Match                                                 │
│ Venue      │ → Tournament · Match                                                 │
│ Team       │ → Tournament · Group · Coach · Player · Match(主/客) · Standing       │
│            │ → Honor · Prediction · Squad · Article · Favorite · Follow           │
│ Player     │ → Team · Squad · MatchEvent · MatchStats · Rating · Honor            │
│            │ → Prediction · Favorite · Follow                                     │
│ Coach      │ → Team · Honor                                                       │
│ Referee    │ → Match                                                              │
│ Match      │ → Tournament · Group/Knockout · Venue · Team(2) · Referee            │
│            │ → Event · Stats · Rating · Squad · Prediction · Article · Favorite   │
│ MatchEvent │ → Match · Player(主要) · Player(助攻/次要)                           │
│ MatchStats │ → Match · Team                                                       │
│ PlayerMS   │ → Match · Player · Team                                              │
│ PlayerRate │ → Match · Player                                                     │
│ Squad      │ → Team · Match · Player                                              │
│ Standing   │ → Group · Team · Tournament                                          │
│ Honor      │ → Team / Player / Coach                                              │
│ User       │ → Favorite · Follow · Notification · Pref · Setting · Prediction     │
│            │ → ChatMessage · CommunityPost                                        │
│ Favorite   │ → User · Team/Player/Match(三选一)                                   │
│ Follow     │ → User · Team/Player(二选一)                                         │
│ Notif      │ → User · Match/Team/Player(可选关联)                                 │
│ Article    │ → Tournament · Match/Team/Player(可选) · Tag                          │
│ Prediction │ → Tournament · Match/Team/Player(可选)                               │
│ UserPred   │ → User · Match · Team(可选)                                          │
│ CommPost   │ → User · Topic · Match/Team(可选)                                    │
│ ChatMsg    │ → User · Match                                                       │
└────────────┴────────────────────────────────────────────────────────────────────┘
```

---

## 四、实体索引（按域分组）

```
┌──────────────────────────────────────────────────────────────────┐
│ 域            实体数    实体列表                                 │
├──────────────────────────────────────────────────────────────────┤
│ 赛事架构        4       Tournament · Group · KnockoutStage · Venue│
│ 参赛主体        4       Team · Player · Coach · Referee          │
│ 比赛核心        7       Match · MatchEvent · MatchStats ·        │
│                         PlayerMatchStats · PlayerRating ·        │
│                         Squad · Standing                        │
│ 荣誉体系        3       TeamHonor · PlayerHonor · CoachHonor     │
│ 用户体系        6       User · Favorite · Follow · Notification  │
│                         · NotificationPreference · UserSetting   │
│ 内容社交        5       Article · Prediction · UserPrediction   │
│                         · CommunityPost · ChatMessage            │
├──────────────────────────────────────────────────────────────────┤
│ 合计           29                                                │
└──────────────────────────────────────────────────────────────────┘
```

---

## 五、数据量级估算

| 实体 | 估算基数 | 说明 |
|------|----------|------|
| Tournament | 1 | 本届世界杯 |
| Group | 12 | A 组 ~ L 组 |
| KnockoutStage | 7 | 1/16→1/8→1/4→半决赛→三四名→决赛 |
| Venue | 16 | 16 座场馆 |
| Team | 48 | 48 支参赛队 |
| Player | ~832 | 48 队 × 约 26 人 |
| Coach | 48 | 每队 1 名主教练 |
| Referee | ~100 | 主裁+助理裁判+VAR 团队 |
| **Match** | **104** | **全部比赛** |
| MatchEvent | ~1,500 | 每场约 15 个事件 |
| MatchStats | 104×2 | 每场主客队各 1 组 |
| PlayerMatchStats | ~4,000 | 每场约 30 球员有统计 |
| PlayerRating | ~4,000 | 每场约 30 球员获评分 |
| Squad | 104×2 | 每场比赛双方各 1 份 |
| Standing | 48 | 48 队在各自小组的排名 |
| TeamHonor | ~500+ | 每队约 10~20 届世界杯历史 |
| PlayerHonor | ~3,000+ | 每球员约 3~5 个荣誉 |
| User (目标) | 500,000+ | MVP 首月 DAU 目标 |
| Favorite | ~2,000,000+ | 每用户平均 4 个收藏 |
| Notification | ~10,000,000+ | 每用户赛事期间约 20 条 |
| Prediction | ~500+ | 每场比赛胜负+比分+冠军+金靴 |
| Article | ~2,000+ | 赛事期间约 30 篇/天 |
| ChatMessage | ~100,000,000+ | 热门比赛聊天室可能数十万条 |

---

> **文档结束。** 基于完整产品原型,共识别 29 个核心数据实体,划分为 6 个域。Match 是数据密度最高的中心实体。
