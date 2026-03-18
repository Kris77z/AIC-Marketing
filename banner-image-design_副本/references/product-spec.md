# Banner 图像生产系统 — Web 产品方案文档

> 版本：v0.1
> 状态：草案
> 更新：2026-03-17

---

## 一、产品定位

### 一句话定义

> 一套以场景模板为驱动、品牌素材库为根基的团队内部 AI 图像生产工具——运营填写活动 brief，系统自动构建 prompt、调用 API 生图、归档结果，无需懂 prompt 工程。

### 解决的核心问题

| 现在的痛点 | 产品解决方式 |
|---|---|
| 每次出图要手写 prompt，门槛高 | 场景模板 + brief 表单，自动构建 prompt |
| 吉祥物、logo 每次要手动找路径 | 素材库统一注册，选 slug 即可引用 |
| 不同运营场景没有风格规范 | 场景模板内置风格约束，输出风格统一 |
| 多尺寸出图要重复执行命令 | 一次填写，自动并发生成多尺寸 |
| 历史图片找不到、prompt 无法复现 | 每张图附带完整 meta，支持重新生成 |
| 只有懂命令行的人能用 | Web UI，运营、设计均可独立操作 |

### 用户角色

| 角色 | 使用频率 | 主要操作 |
|---|---|---|
| 运营 | 高频 | 选模板 → 填 brief → 生图 → 下载 |
| 设计 | 中频 | 上传素材 → 管理素材库 → 审查输出质量 |
| 研发/AI | 低频 | 维护场景模板、升级 prompt 规则、排查 API 问题 |

---

## 二、功能模块

### 模块全景

```
Banner 图像生产系统
│
├── 🎨 生图工作台     ← 核心，运营日常入口
├── 🖼  图库           ← 历史生成记录，可下载/复现
├── 🗂  场景模板        ← 定义"哪种活动用哪套规则"
├── 📁 素材库          ← 管理 logo、吉祥物、风格参考图
└── ⚙️  系统设置        ← API Key、存储路径、模型配置
```

### 模块 1：生图工作台

核心流程分四步，每步独立一个视觉区块：

```
Step 1        Step 2         Step 3         Step 4
选场景模板  →  填活动 brief →  选输出规格  →  预览 & 生成
```

**Step 1 — 选场景模板**

- 以卡片形式展示所有模板，每张卡片显示：模板名称、场景类型标签（节庆/联名/产品/通用）、缩略示例图
- 支持"自定义模式"（不用模板，直接写 prompt）

**Step 2 — 填活动 Brief**

- 表单字段由所选模板定义（不同场景字段不同）
- 典型字段：活动主题、情绪氛围、必须出现的品牌/角色（下拉选素材库）、文案留白方向、变体数量
- 所有字段均为运营语言，无 prompt 术语

**Step 3 — 选输出规格**

- 预设尺寸多选：`1536×1024`（横版）、`750×750`（方图）、`1080×1920`（竖版）
- 支持自定义尺寸输入
- 显示预估生成时间

**Step 4 — Prompt 预览 & 生成**

- 折叠面板展示系统构建的完整 prompt（可手动编辑）
- 显示负向 prompt
- 【生成】按钮触发任务，原地展示进度 + 结果

### 模块 2：图库

完整的生成历史管理和快捷操作中心。

**列表页面**

- 瀑布流/网格展示所有历史生成图片（默认按最新排序）
- 顶部过滤条：
  - 场景类型：全部 / 节庆 / 联名 / 产品 / 吉祥物 / 通用
  - 时间范围：今天 / 本周 / 本月 / 全部
  - 素材关键词：搜索图片对应的 brief 内容或用到的素材
- 每张图片卡片显示：缩略图、场景名��生成时间、变体序号（v1/v2/v3）

**详情面板**（点击图片弹出）

```
┌─────────────────────────────────────────┐
│  详情                          [关闭 ×]  │
├─────────────────────────────────────────┤
│                                         │
│  [大图预览]                              │
│                                         │
├─────────────────────────────────────────┤
│  场景模板  spring-festival               │
│  生成时间  2026-03-17 14:23             │
│  尺寸      1536 × 1024                  │
│  模型      gemini-2.5-flash-image       │
│                                         │
│  使用的素材：                            │
│  ・nano-banana（吉祥物）                 │
│  ・aicoin（Logo）                       │
│                                         │
│  Brief 输入：                            │
│  活动主题：春节红包活动，喜庆不俗气      │
│  情绪：温暖、灵动、有呼吸感               │
│                                         │
│  ▶ 生成的 Prompt（可复制）               │
│  严格参考提供的吉祥物...                  │
│  [复制] [在新标签页编辑]                 │
│                                         │
│  ▶ 负向 Prompt                          ��
│  避免文字、水印、乱码...                  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [⬇ 下载]  [🔄 重新生成]  [✏️ 修改���生]  │
│                                         │
└─────────────────────────────────────────┘
```

**详情中的操作：**

- **下载**：保存原图到本地
- **重新生成**：用完全相同的参数立即重新生成一张（不弹窗，直接开始）
- **修改再生**：跳回生图工作台，预填充此图的 brief，允许微调后重新生成（对应"基于此 brief 修改后再生成"）

### 模块 3：场景模板

- 列出所有场景模板，显示名称、类型、最近使用时间
- 每个模板可查看/编辑：
  - 场景类型（决定选哪套 SKILL.md 模板规则）
  - brief 表单字段定义（哪些字段、哪些必填、下拉选项）
  - 默认素材组合
  - 默认输出尺寸
  - 内置 prompt 规则覆盖（高级）
- 支持复制模板、新建模板

**内置场景模板（初始版）：**

| 模板名称 | 场景类型 | 说明 |
|---|---|---|
| 节庆活动头图 | festive | 春节、中秋、情人节等 |
| 品牌联名合作 | collab | 两个品牌联名的主视觉 |
| 产品功能上线 | product | 以产品/功能为主视觉核心 |
| 吉祥物主题图 | mascot-led | 以 IP 吉祥物为唯一主角 |
| 通用活动海报 | generic | 不限场景的通用横版图 |

### 模块 4：素材库

素材分三类，每类独立管理。素材上传和管理是团队协作的关键。

**列表页面**

按素材类型分组展示，每个素材卡片显示：缩略图、slug、类型、创建时间、操作（编辑/删除）

**IP 吉祥物（Mascot）**

上传流程：

```
1. 点击 [+ 上传吉祥物]
2. 拖拽或点击选择图片（支持 PNG/JPG/WebP，最大 5MB）
3. 填写元数据表单：
   - 吉祥物名称：nano-banana
   - 英文 slug：nano-banana（用于 API 引用，自动 slugify）
   - 锁定模式：[强锁定 ◉] [宽松 ◯]
   - 强锁定约束（多选）：
     ☑ 保持原本轮廓和配色不变
     ☑ 不允许替换成人物
     ☑ 不允许增加第二角色
     ☑ 不允许改成其他动物
     ☐ [其他约束...]
   - [保存]
4. 图片自动存到 public/assets/uploads/mascots/{slug}.png
5. 元数据写入 store.json
```

上传后的卡片展示：

```
┌────────────┐
│  缩略图    │
│            │
├────────────┤
│ nano-      │
│ banana     │
│ 强锁定 ●   │
├────────────┤
│[编辑][删除]│
└────────────┘
```

编辑：可修改名称、约束列表，或替换图片

**品牌 Logo**

上传流程：

```
1. 点击 [+ 上传 Logo]
2. 拖拽或点击选择图片
3. 填写元数据：
   - 品牌名：Aicoin
   - 英文 slug：aicoin
   - 主品牌色：#FF6600（取色器或输入 HEX）
   - 使用场景限制（可选，多选）：
     ☑ 可出现在联名合作图
     ☑ 可作为单一品牌主体
     ☑ 可在产品图中出现
   - [保存]
4. 图片自动存到 public/assets/uploads/logos/{slug}.png
5. 元数据写入 store.json
```

**风格参考图（Style Ref）**

上传流程：

```
1. 点击 [+ 上传风格参考]
2. 拖拽或点击选择图片
3. 填写元数据：
   - 参考名称：春节暖色系
   - 英文 slug：lunar-new-year-warm
   - 用途标签（多选）：
     ☑ 节庆氛围
     ☑ 暖色调
     ☐ 冷色调
     ☐ 科技感
     ☐ 温暖治愈
     ☐ 梦幻感
   - 描述（可选）：暖金色和奶油色，传达春节喜庆
   - [保存]
4. 图片自动存到 public/assets/uploads/style-refs/{slug}.png
5. 元数据写入 store.json
```

**素材库管理操作**

每个素材卡片的操作：
- **编辑**：修改元数据（名称、约束、颜色等）
- **删除**：删除素材（确认删除，以免误删后影响已生成的图片记录）
- **复制 slug**：一键复制 slug 到剪贴板，便于在其他地方引用

**素材库与生图工作台的联动**

生图工作台的 brief 表单中，素材选择字段（如"吉祥物"、"品牌 Logo"）的下拉列表会实时从素材库拉取最新数据。用户在素材库上传了新的吉祥物后，刷新生图工作台页面，新吉祥物就能在下拉列表中出现。

### 模块 5：系统设置

- API Key 配置（GEMINI_API_KEY，本地加密存储）
- 默认模型选择
- 图片输出路径（本地部署时配置存储目录）
- 生成超时时间

### 模块 6：热点快速出稿（Phase 1.5 新增）

**定位**：结合热点话题，快速生成品牌化的运营文案 + 配图

**核心流��**：

1. **输入热点信息**
   - 热点主题（文本描��，如"世界杯"、"双十一"、"明星八卦"）
   - 品牌立场（冷淡 / 热情 / 幽默 / 深度参与）
   - 运营渠道（小红书 / 微博 / 视频号 / 公众号）
   - 可选推荐素材（logo、吉祥物、颜色）

2. **系统生成**
   - 调用文案生成（可选，需文本模型支持）
   - 生成 N 个文案版本（不同角度和长度）
   - 并行调用 Gemini 生成对应 banner 图
   - 返回"文案 + 对应配图"的组合方案

3. **输出可用**
   - 文案版本列表（可复制到剪贴板）
   - 每个文案对应的 banner 配图
   - 建议的图片尺寸和排版方向
   - 支持"一键复制文案+下载图"

**所需文件**：
- `hotspot.md` — 你提供的热点出稿规范（类似 SKILL.md）
- 定义：不同热点类型的 prompt 框架、文案风格约束、配色建议

**技术实现**：
- 新增 `lib/hotspot-builder.ts` — 根据热点信息构建 prompt
- 新增 `/api/hotspot/generate` — 生成热点文案 + banner
- 新增 `/hotspot` 页面和 `HotspotWorkbench` 组件

---

### 模块 7：HTML+CSS 设计器（Phase 1.5 新增）

**定位**：用模板化的 HTML/CSS 快速制作品牌 banner，无需等待 AI 生成

**为什么需要**：
- 快速出稿（秒级，不用等 30-180s）
- 固定场景模板化（促销/新品/活动）
- 品牌一致性高（预定义的字体、色卡、布局）

**核心流程**：

1. **选择模板**
   - 顶部通栏型（简洁，适合导航栏下方）
   - 卡片型（独立卡片，适合内容流中）
   - 分割型（左文右图或上文下图）
   - 图层叠加型（文案+素材叠加）
   - 渐变背景型（纯色/渐变背景，极简）

2. **填充内容**
   - 标题 / 副标题 / 描述文本
   - CTA 按钮文案和链接（可选）
   - 选择配色（预定义品牌色卡，或自定义 HEX）
   - 上传/选择背景图、主图、或素材（logo、吉祥物）
   - 选择字体大小、布局间距

3. **实时预览**
   - 浏览器内实时渲染
   - 支持多尺寸预览（1536×1024 / 750×750 / 其他）
   - 拖拽调整素材位置（可选高级功能）

4. **导出**
   - 下载 PNG 图片
   - 可选：导出 HTML/CSS 源码
   - 保存设计方案到历史（可再编辑）

**所需数据**：
- `lib/design-templates.ts` — 预定义的 5-10 个 HTML/CSS 模板
- 每个模板定义：布局结构、默认样式、可配置项

**技术实现**：
- 前端：React 组件 + TailwindCSS 或原生 CSS
- 导出 PNG：使用 `html2canvas` 或 `Canvas` API
- 后端（可选）：如需复杂渲染，用 Puppeteer
- 新增 `/api/design/export` — PNG 导出接口
- 新增 `/design` 页面和 `DesignWorkbench` 组件

**示例模板**：

```
模板 1：顶部 Logo + 大标题 + CTA
┌─────────────────────────────┐
│ [Logo]                      │
│                             │
│  春日限定活动              │
│     限时 5 折               │
│                             │
│       [立即购买 →]         │
└─────────────────────────────┘

模板 2：左文右图
┌──────────────┬──────────────┐
│ 新品上线      │              │
│              │  [Product    │
│  立即体验     │   Image]     │
│ [按钮]       │              │
└──────────────┴──────────────┘

模板 3：渐变背景
┌──────────────��──────────────┐
│ ╱ 渐变背景                   │
│╱  ＢＯ Ｎ Ｕ Ｓ              │
│╱  限定礼盒                  │
│╱  [按钮]                    │
└─────────────────────────────┘
```

---

## 三、页面导航

### 侧边栏导航

```
┌──────────────────���──┐
│  Logo / 项目名      │
├─────────────────────┤
│ 🎨 生图工作台      │  /generate
│ 🔥 热点快速出稿    │  /hotspot       ← Phase 1.5
│ 🖌️  HTML 设计器     │  /design        ← Phase 1.5
│ 📁 图库             │  /gallery
│ 🗂  素材库          │  /assets
│ 📋 场景模板        │  /scenes
│ ⚙️  系统设置        │  /settings
├─────────────────────┤
│ 关于 / 帮助         │
└─────────────────────┘
```

### 页面快速导航

| 页面 | 路由 | 用户 | 功能 |
|---|---|---|---|
| 生图工作台 | `/generate` | 全部 | 用 AI 生成高质量配图 |
| 热点快速出稿 | `/hotspot` | 运营 | 结合热点，快速出文案+配图 |
| HTML 设计器 | `/design` | 运营 | 用模板快速设计 banner |
| 图库 | `/gallery` | 全部 | 查看历史，复现、修改、下载 |
| 素材库 | `/assets` | 设计 | 上传管理 logo、吉祥物、风格参考 |
| 场景模板 | `/scenes` | 研发/设计 | 定义出图规则和默认配置 |
| 系统设置 | `/settings` | 研发 | API Key、模型、超时配置 |

---

## 四、技术架构

## 三、导航和入口

### 技术栈

| 层次 | 技术选型 | 理由 |
|---|---|---|
| 框架 | **Next.js 15**（App Router） | Vercel 原生，本地 `next start` 也能跑，API Route 做后端 |
| UI 组件 | **shadcn/ui + Tailwind CSS** | 最活跃的 Next.js 组件生态，高度可定制 |
| 语言 | **TypeScript** | 团队协作必备，IDE 提示友好 |
| 元数据存储 | **SQLite**（better-sqlite3） | 零运维，文件即数据库，内部工具够用 |
| 图片存储 | **本地文件系统** | 存 `./data/output/`，API Route 提供服务 |
| 素材存储 | **本地文件系统** | 存 `./public/assets/uploads/` |
| 状态管理 | **React 内置 + SWR** | 轻量，够用 |

### 目录结构

```
banner-web/
│
├── app/                          ← Next.js App Router
│   ├── (dashboard)/
│   │   ├── layout.tsx            ← 侧边栏 + 顶栏 shell
│   │   ├── generate/
│   │   │   └── page.tsx          ← 生图工作台
│   │   ├── gallery/
│   │   │   └── page.tsx          ← 图库
│   │   ├── scenes/
│   │   │   └── page.tsx          ← 场景模板管理
│   │   ├── assets/
│   │   │   └── page.tsx          ← 素材库
│   │   └── settings/
│   │       └── page.tsx          ← 系统设置
│   │
│   └── api/
│       ├── generate/
│       │   └── route.ts          ← 核心：构建 prompt + 调 Gemini API + 存图
│       ├── images/
│       │   └── [filename]/
│       │       └── route.ts      ← serve 本地图片
│       ├── assets/
│       │   └── route.ts          ← 素材上传 + 查询
│       ├── scenes/
│       │   └── route.ts          ← 场景模板 CRUD
│       └── jobs/
│           └── route.ts          ← 生成历史查询
│
├── components/
│   ├── ui/                       ← shadcn/ui 基础组件
│   ├── generate/
│   │   ├── SceneSelector.tsx
│   │   ├── BriefForm.tsx
│   │   ├── SizeSelector.tsx
│   │   ├── PromptPreview.tsx
│   │   └── GenerateButton.tsx
│   ├── gallery/
│   │   ├── ImageGrid.tsx
│   │   └── ImageDetail.tsx
│   └── assets/
│       ├── AssetUploader.tsx
│       └── AssetCard.tsx
│
├── lib/
│   ├── db.ts                     ← SQLite 连接 + 初始化
│   ├── prompt-builder.ts         ← SKILL.md 逻辑的程序化版本（核心）
│   ├── gemini-client.ts          ← generate_banner.py 逻辑的 TS 版本
│   └── asset-registry.ts        ← 素材库查询
│
├── data/                         ← 运行时数据（gitignore）
│   ├── banner.db                 ← SQLite 数据库文件
│   └── output/                   ← 生成图片
│       └── 2026-03-17_spring-festival-v1_1536x1024.png
│
└── public/
    └── assets/
        └── uploads/              ← 上传的素材（logo、mascot）
```

### 数据模型（SQLite 三张核心表）

```sql
-- 素材表
CREATE TABLE assets (
  id          TEXT PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  type        TEXT NOT NULL,          -- mascot | logo | style-ref
  name        TEXT NOT NULL,
  file_path   TEXT NOT NULL,
  lock_mode   TEXT,                   -- strong | loose
  constraints TEXT,                   -- JSON 字符串，约束列表
  brand_color TEXT,                   -- logo 专用，主品牌色 HEX
  tags        TEXT,                   -- JSON 字符串，标签数组
  created_at  TEXT NOT NULL
);

-- 场景模板表
CREATE TABLE scenes (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  scene_type      TEXT NOT NULL,      -- festive | collab | product | mascot-led | generic
  brief_schema    TEXT NOT NULL,      -- JSON，定义表单字段
  default_assets  TEXT,               -- JSON，默认素材 slug 列表
  default_sizes   TEXT,               -- JSON，默认尺寸列表
  prompt_overrides TEXT,              -- JSON，覆盖默认 prompt 规则
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

-- 生成任务表
CREATE TABLE jobs (
  id              TEXT PRIMARY KEY,
  scene_id        TEXT,
  status          TEXT NOT NULL,      -- pending | running | done | failed
  brief_input     TEXT NOT NULL,      -- JSON，用户填写的 brief
  generated_prompt TEXT,              -- 系统构建的完整 prompt
  negative_prompt  TEXT,
  model           TEXT,
  width           INTEGER,
  height          INTEGER,
  output_path     TEXT,               -- 生成图片的本地路径
  error_message   TEXT,
  assets_used     TEXT,               -- JSON，引用的素材 slug 列表
  created_at      TEXT NOT NULL,
  completed_at    TEXT
);
```

### 数据流

```
[用户填 Brief]
       │
       ▼
[前端 POST /api/generate]
       │  { scene_id, brief, sizes, variants, assets }
       ▼
[prompt-builder.ts]
   根据 scene_type 选 SKILL.md 对应模板
   注入 brief 字段 → 生成完整 prompt + 负向 prompt
       │
       ▼
[gemini-client.ts]
   组装 Gemini API payload（含 base64 reference 图）
   调用 API，等待响应（30-180s）
       │
       ├─── 成功 ──────────────────┐
       │                            │
       │                            ▼
       │                    [保存结果]
       │                    图片写入 ./data/output/
       │                    元数据写入 store.json
       │                            │
       │                            ▼
       │                    [API 返回图片 URL + meta]
       │                    [前端展示结果]
       │
       └─── 失败（超时/API 错/网络错）
                            │
                            ▼
                    [降级处理]
                    ✓ 写入 job 记录（status: failed）
                    ✓ 记录完整 prompt + 负向 prompt
                    ✓ 保存 error message
                    ✓ **返回 prompt 文本供人工使用**
                    │
                    ▼
           [前端显示]
           "生成失败，但 prompt 已保存，可手工提交"
           [展示 Prompt] [复制] [在其他工具用]
```

**失败降级策略：**

当 Gemini API 失败（超时、限额、网络、401 等）时，不要白白丢弃 prompt。系统应该：

1. 创建 job 记录，标记为 `failed`
2. 记录完整 prompt + 负向 prompt + error 信息
3. 返回给前端一个可用的 prompt 文本
4. 前端显示"生成失败，但 prompt 已保存"的消息，并展示 prompt 让用户可以：
   - 复制 prompt 到剪贴板
   - 在 Gemini / Midjourney / 其他工具手工使用
   - 点击"重试"按钮稍后重新调用 API
   - 保存 prompt 为 YAML 场景模板（Advanced）
```

---

## 四、核心逻辑：Prompt 构建引擎

这是产品的"大脑"，把 SKILL.md 的规则程序化。

### 构建逻辑（`lib/prompt-builder.ts`）

```
输入
├── scene_type         → 决定选哪套基础模板
├── brief.theme        → 主题注入
├── brief.mood         → 氛围词注入
├── brief.copy_side    → 文案留白方向
├── assets.mascot      → 如果有吉祥物 → 强制启用 mascot-strong-lock 模板
├── assets.logos[]     → 联名 logo 注入
└── assets.style_ref   → 附加参考图

↓ 模板选择逻辑

if (assets.mascot)           → 吉祥物强锁定模板
elif (scene_type === collab) → 联名合作模板
elif (scene_type === product)→ 产品主视觉模板
elif (scene_type === festive)→ 节庆插画模板
else                         → 通用模板

↓ 变量注入

将 brief 字段填入模板占位符
附加默认质量语句（来自 SKILL.md 的 default visual direction）
拼接负向 prompt（base + scene-specific）

↓ 输出

{ prompt: string, negativePrompt: string }
```

---

## 五、API 接口设计

### POST /api/generate

生成图片的核心接口。

**请求体：**

```json
{
  "sceneId": "scene-spring-festival",      // 可选，若不提供则用通用场景
  "brief": {
    "theme": "春节红包活动，喜庆不俗气",
    "mood": "温暖、灵动、有呼吸感",
    "mascot": "nano-banana",               // 吉祥物 slug
    "logos": ["aicoin"],                   // logo slug 数组
    "copySide": "left"
  },
  "sizes": [
    { "width": 1536, "height": 1024 },
    { "width": 750, "height": 750 }
  ],
  "variantCount": 3,                       // 每个尺寸生成几个变体
  "promptOverride": ""                     // 可选，用户手工编辑的 prompt
}
```

**响应体（成功 200）：**

```json
{
  "success": true,
  "jobs": [
    {
      "id": "job-uuid",
      "sceneId": "scene-spring-festival",
      "status": "done",
      "width": 1536,
      "height": 1024,
      "variant": 1,
      "outputPath": "/api/images/2026-03-17_spring-festival-v1_1536x1024.png",
      "imageUrl": "/api/images/2026-03-17_spring-festival-v1_1536x1024.png",
      "generatedPrompt": "...",
      "negativePrompt": "...",
      "model": "gemini-2.5-flash-image",
      "assetsUsed": ["nano-banana", "aicoin"],
      "createdAt": "2026-03-17T14:23:00Z",
      "completedAt": "2026-03-17T14:25:30Z"
    },
    // ... 更多 job 记录
  ]
}
```

**响应体（失败 200 带 fallback）：**

```json
{
  "success": false,
  "error": "API timeout after 180s",
  "jobs": [
    {
      "id": "job-uuid",
      "status": "failed",
      "errorMessage": "API timeout after 180s",
      "generatedPrompt": "...",           // 保留完整 prompt，供人工使用
      "negativePrompt": "...",
      "width": 1536,
      "height": 1024,
      "createdAt": "2026-03-17T14:23:00Z"
    }
  ]
}
```

### GET /api/jobs

查询历史生成任务。

**查询参数：**

```
?limit=60&offset=0&sceneId=xxx&status=done
```

**响应体：**

```json
{
  "jobs": [
    {
      "id": "...",
      "sceneId": "...",
      "status": "done",
      "width": 1536,
      "height": 1024,
      "outputPath": "/api/images/...",
      "imageUrl": "/api/images/...",
      "briefInput": { ... },
      "generatedPrompt": "...",
      "assetsUsed": ["..."],
      "createdAt": "2026-03-17T14:23:00Z",
      "completedAt": "2026-03-17T14:25:30Z"
    }
  ],
  "total": 127
}
```

### POST /api/assets

上传新素材。

**请求（multipart/form-data）：**

```
file: <binary image data>
type: mascot | logo | style-ref
name: nano-banana
slug: nano-banana (可选，自动生成)
lockMode: strong | loose (仅 mascot)
constraints: ["保持轮廓配色", "不替换人物"] (JSON)
brandColor: #FF6600 (仅 logo)
tags: ["春节", "暖色"] (JSON)
```

**响应体（成功 201）：**

```json
{
  "asset": {
    "id": "asset-uuid",
    "slug": "nano-banana",
    "type": "mascot",
    "name": "nano-banana",
    "filePath": "/assets/uploads/mascots/nano-banana.png",
    "lockMode": "strong",
    "constraints": ["保持轮廓配色", "不替换人物"],
    "tags": [],
    "createdAt": "2026-03-17T14:23:00Z"
  }
}
```

### GET /api/assets

查询素材库。

**查询参数：**

```
?type=mascot|logo|style-ref&tags=春节&q=nano
```

**响应体：**

```json
{
  "assets": [
    {
      "id": "...",
      "slug": "nano-banana",
      "type": "mascot",
      "name": "nano-banana",
      "filePath": "/assets/uploads/mascots/nano-banana.png",
      "createdAt": "2026-03-17T14:23:00Z"
    }
  ]
}
```

### DELETE /api/assets/{slug}

删除素材（确认删除，但不删除已生成的图片记录，只是标记为 deleted）。

**响应体（成功 200）：**

```json
{
  "success": true,
  "message": "Asset nano-banana deleted"
}
```

### GET /api/scenes

查询场景模板。

**响应体：**

```json
{
  "scenes": [
    {
      "id": "scene-spring-festival",
      "name": "节庆活动头图",
      "sceneType": "festive",
      "briefSchema": [
        {
          "name": "theme",
          "label": "活动主题",
          "type": "textarea",
          "required": true
        },
        {
          "name": "mood",
          "label": "情绪氛围",
          "type": "textarea"
        },
        {
          "name": "mascot",
          "label": "吉祥物",
          "type": "asset-single",
          "assetType": "mascot"
        }
      ],
      "defaultAssets": ["nano-banana"],
      "defaultSizes": ["1536x1024", "750x750"],
      "createdAt": "2026-03-17T14:23:00Z"
    }
  ]
}
```

### GET /api/images/[...path]

serve 本地生成的图片。例如 `/api/images/2026-03-17_spring-festival-v1_1536x1024.png`

返回图片二进制 + 适当的 `Content-Type` 和缓存头。

### GET /api/settings

读取系统设置（仅用于前端显示，API Key 不返回）。

**响应体：**

```json
{
  "model": "gemini-2.5-flash-image",
  "baseUrl": "https://ai.co.link/gemini",
  "timeoutSeconds": 180
}
```

---

## 六、页面交互设计

### 图库页面（完整设计）

```
┌────────────────────────────────────────────────────────────────┐
│  图库                                 [过滤 ▼] [搜索...]        │
├────────────────────────────────────────────────────────────────┤
│  场景：[全部 ●] [节庆] [联名] [产品] [吉祥物] [通用]            │
│  时间：[全部 ●] [今天] [本周] [本月]                            │
│  搜索框：[输入关键词...]                                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │
│  │        │ │        │ │        │ │        │ │        │      │
│  │  图片  │ │  图片  │ │  图片  │ │  图片  │ │  图片  │      │
│  │        │ │        │ │        │ │        │ │        │      │
│  │春节 v1 │ │春节 v2 │ │春节 v3 │ │联名 v1 │ │产品 v1 │      │
│  │1536×   │ │1536×   │ │ 750×   │ │1536×   │ │1536×   │      │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘      │
│                                                                │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                 │
│  │        │ │        │ │        │ │        │                 │
│  │  图片  │ │  图片  │ │  图片  │ │  图片  │                 │
│  │        │ │        │ │        │ │        │                 │
│  │吉祥物v1│ │产品 v2 │ │节庆 v1 │ │联名 v2 │                 │
│  │ 750×   │ │ 750×   │ │1536×   │ │1536×   │                 │
│  └────────┘ └────────┘ └────────┘ └────────┘                 │
│                                                                │
│  [加载更多]                                                   │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**图片卡片交互：**

- 鼠标 hover 时显示操作菜单：[👁 预览] [⬇ 下载] [🔄 重新生成] [✏️ 修改再生]
- 点击卡片本身打开全屏详情面板

**搜索与过滤机制：**

搜索关键词匹配：
- brief 中的 theme/mood 字段
- 使用的素材名称（吉祥物名、logo 名）
- 生成的 prompt 内容（模糊搜索）

过滤是累积的，如选择"节庆" + "本周"，则显示本周生成的所有节庆活动图片。

### 生图工作台（核心页）

```
┌────────────────────────────────────────────────────────────┐
│  生图工作台                                    [历史记录 →]  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  1  选择场景模板                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ 🎊       │ │ 🤝       │ │ 📦       │ │ 🐼       │     │
│  │ 节庆活动 │ │ 品牌联名 │ │ 产品上线 │ │ 吉祥物图 │     │
│  │  头图    │ │  合作    │ │          │ │          │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  2  活动 Brief                                             │
│                                                            │
│  活动主题    [春节红包活动，喜庆不俗气               ]       │
│  情绪氛围    [温暖 / 灵动 / 有呼吸感                 ]       │
│  吉祥物      [▼ nano-banana    ] ☑ 强锁定模式         │
│  品牌 Logo   [▼ Aicoin  ] [+ 添加]                    │
│  文案留白    [● 左侧  ○ 右侧  ○ 无留白]               │
│  生成变体    [○ 1  ● 3  ○ 5]                          │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  3  输出尺寸                                               │
│  ☑ 1536×1024  横版头图      □ 1920×1080  宽屏            │
│  ☑ 750×750    方图/APP      □ 1080×1920  竖版            │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ▶ 查看生成 Prompt（可选修改）                              │
│                                                            │
│            [ 🚀  开始生成  ]                               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 生成进行中 & 结果展示

```
┌────────────────────────────────────────────────────────────┐
│  正在生成... 3 变体 × 2 尺寸 = 6 张                         │
│                                                            │
│  ████████████████░░░░░░░  67%   约还需 45s               │
│                                                            │
│  已完成：                                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                    │
│  │ ✓ v1 │ │ ✓ v1 │ │ ⟳ v2 │ │ · v3 │                    │
│  │1536  │ │ 750  │ │1536  │ │      │                    │
│  └──────┘ └──────┘ └──────┘ └──────┘                    │
└────────────────────────────────────────────────────────────┘
```

### 图库

```
┌────────────────────────────────────────────────────────────┐
│  图库                                   [过滤 ▼] [搜索...]  │
├────────────────────────────────────────────────────────────┤
│  今天                                                      │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │
│  │        │ │        │ │        │ │        │            │
│  │  图片  │ │  图片  │ │  图片  │ │  图片  │            │
│  │        │ │        │ │        │ │        │            │
│  │春节·v1 │ │春节·v2 │ │春节·v3 │ │联名·v1 │            │
│  │1536×   │ │1536×   │ │ 750×   │ │1536×   │            │
│  └────────┘ └────────┘ └────────┘ └────────┘            │
│                                                            │
│  本周                                                      │
│  ...                                                       │
└────────────────────────────────────────────────────────────┘
```

---

## 六、参考开源项目

| 项目 | Stars | 用途 | 链接 |
|---|---|---|---|
| **nicremo/openllmpix** | 3 | 生成 UI 交互模式、Gemini API 调用方式 | https://github.com/nicremo/openllmpix |
| **Kiranism/next-shadcn-dashboard-starter** | 6045 | App 整体结构、侧边栏、组件规范 | https://github.com/Kiranism/next-shadcn-dashboard-starter |
| **shadcnstore/shadcn-dashboard-landing-template** | 609 | 页面布局参考 | https://github.com/shadcnstore/shadcn-dashboard-landing-template |

---

## 八、开发路线图

基于当前代码现状（生图工作台核心已完成），补充缺失部分。

### Phase 1 — 图库 + 素材库（已完成，约 1 周）

**目标：** 图库可用，素材可上传和管理

✅ 已实现：GalleryWorkspace、AssetManager、SceneManager、所有 API

**待补充**：3 个细节 UI（见 Phase 1 缺失部分）

### Phase 1.5 — 新增两个出稿模块（可选，约 1-2 周）

**目标：** 快速满足不同出稿场景

#### 子项 1：HTML+CSS 设计器（推荐先做）

**理由**：不依赖外部 skill，可立即实现

- [ ] **DesignWorkbench 组件**
  - [ ] 模板选择（5-10 个预定义模板）
  - [ ] 实时预览（浏览器渲染）
  - [ ] 表单编辑器（文案、颜色、素材选择）
  - [ ] 多尺寸预览切换

- [ ] **前端导出**
  - [ ] html2canvas 或 Canvas API 导出 PNG
  - [ ] 多尺寸导出（1536×1024 / 750×750 / 自定义）
  - [ ] 可选：导出 HTML/CSS 源码

- [ ] **数据层**
  - [ ] `lib/design-templates.ts` — 模板定义
  - [ ] 新增 job type：`design`（与 AI 生成的区别）
  - [ ] 保存设计方案到 store.json 和图库

- [ ] **API**
  - [ ] `POST /api/design/export` — 服务端 PNG 导出（可选，需 Puppeteer）

#### 子项 2：热点快速出稿（等你提供 hotspot.md）

**依赖**：hotspot.md（你提供的 Skill 文件）

- [ ] **HotspotWorkbench 组件**
  - [ ] 输入热点主题、品牌立场、渠道、素材
  - [ ] 实时生成 N 个文案版本
  - [ ] 并行生成对应 banner 图

- [ ] **Prompt 构建**
  - [ ] `lib/hotspot-builder.ts` — 根据热点信息构建文案 + banner prompt
  - [ ] 调用 buildPrompt（文案用新规则，banner 用现有规则）

- [ ] **并行生成**
  - [ ] 文案生成（可选，需文本模型如 Claude API）
  - [ ] Banner 生成（用现有 Gemini）
  - [ ] 返回"文案+图"的配对方案

- [ ] **数据层**
  - [ ] job type：`hotspot`
  - [ ] 记录热点主题、品牌立场、生成的文案和图

### Phase 2 — 异步化 + 进度反馈（约 1 周）

**目标：** 解决长生成时间的阻塞问题

（详见之前的 Phase 2 描述）

### Phase 3 — 高级编辑和扩展（约 1 周）

**目标：** 提升团队创意效率

（详见之前的 Phase 3 描述）

---

## 九、功能实现细节补充

### HTML+CSS 设计器的模板数据结构

```typescript
interface BannerTemplate {
  id: string;
  name: string;
  category: "simple" | "card" | "split" | "overlay" | "gradient";
  defaultWidth: number;
  defaultHeight: number;
  structure: {
    // HTML 结构模板
    html: string;  // 用 {title}, {subtitle}, {image}, {logo} 等占位符
    css: string;   // 与之对应的样式
  };
  editableFields: {
    // 用户可编辑的字段
    title: { label: "标题", type: "text", fontSize?: number };
    subtitle?: { label: "副标题", type: "text" };
    ctaText?: { label: "按钮文案", type: "text" };
    bgColor?: { label: "背景色", type: "color" };
    accentColor?: { label: "强调色", type: "color" };
    imageUrl?: { label: "背景图/主图", type: "image" };
    logoUrl?: { label: "Logo", type: "asset-select", assetType: "logo" };
    mascotUrl?: { label: "吉祥物", type: "asset-select", assetType: "mascot" };
  };
  previewUrl?: string;  // 模板预览缩略图
  createdAt: string;
}
```

### 热点出稿的输入数据结构

```typescript
interface HotspotGenerateRequest {
  topic: string;           // 热点话题："世界杯"、"双十一"
  stance: "cool" | "warm" | "humorous" | "deep";  // 品牌立场
  channels: ("xiaohongshu" | "weibo" | "video" | "wechat")[];  // 运营渠道
  selectedAssets?: {
    logos?: string[];      // logo slugs
    mascots?: string[];    // mascot slugs
    colorScheme?: string;  // 颜色方案 slug
  };
  variantCount?: number;   // 生成几个版本（默认 3）
}

interface HotspotGenerateResult {
  variants: Array<{
    id: string;
    copyVersions: Array<{
      id: string;
      channel: string;
      text: string;
      style: string;  // "长篇"/"短篇"/"标题式" 等
    }>;
    bannerImageUrl: string;
    suggestedSizes: string[];
  }>;
}
```

---

## 十、约束与边界
  - [ ] 网格展示所有生成的图片
  - [ ] 场景、时间过滤器
  - [ ] 搜索框（模糊匹配 theme/mood/素材名）
  - [ ] 图片卡片 hover 显示操作菜单
  - [ ] 无限滚动或分页加载

- [ ] **图库详情面板**
  - [ ] 全屏大图预览
  - [ ] 显示完整 meta 信息（scene、size、model、时间、素材列表）
  - [ ] 展示生成的 prompt + 负向 prompt（可复制）
  - [ ] [⬇ 下载] 按钮（下载原图）
  - [ ] [🔄 重新生成] 按钮（同参数重新生成，直接开始，无弹窗）
  - [ ] [✏️ 修改再生] 按钮（跳回生图工作台，预填 brief，允许修改后重新生成）

- [ ] **素材库上传页**
  - [ ] 三个上传区域（吉祥物 / Logo / 风格参考）
  - [ ] 拖拽或点击上传图片
  - [ ] 填写素材元数据表单
  - [ ] 图片预处理（自动 resize，生成缩略图）
  - [ ] `/api/assets` POST 接口实现（文件存储到 public/assets/uploads/）
  - [ ] 上传后立即显示在素材列表中

- [ ] **素材库管理页**
  - [ ] 按素材类型分组显示
  - [ ] 每个素材卡片显示缩略图 + 元数据
  - [ ] 编辑功能（修改元数据，替换图片）
  - [ ] 删��功能（软删除，不删除已生成记录）
  - [ ] `/api/assets` GET 接口实现（支持 type/tags 过滤）

- [ ] **错误处理**
  - [ ] 生成失败时，不舍弃 prompt
  - [ ] 返回 prompt 文本给前端
  - [ ] 前端显示降级 UI："生成失败，prompt 已保存"
  - [ ] 提供复制、重试、导出 prompt 的选项
  - [ ] `/api/generate` 修改返回格式，支持 success=false 但有 prompt 的响应

### Phase 2 — 异步生成 + 进度反馈（约 1 周）

**目标：** 解决长生成时间的阻塞问题，用户可看到实时进度

**任务清单：**

- [ ] **后端异步化**
  - [ ] 改 `/api/generate` 为返回 job ID，不阻塞等待
  - [ ] 创建后台 worker 处理任务队列（初期可用简单的轮询 + 文件锁）
  - [ ] 实现 job status 的状态机（pending → running → done/failed）

- [ ] **前端进度反馈**
  - [ ] 生成开始后显示进度面板（不是模态框，在原地显示）
  - [ ] 实时轮询 `/api/jobs/{jobId}` 获取状态
  - [ ] 显示进度条 + 预估时间 + 完成的 job 列表
  - [ ] 完成自动刷新图库列表
  - [ ] 支持后台生成（用户可离开页面，回来时看已生成的结果）

- [ ] **SSE 可选优化**
  - [ ] 如果要更丝滑，可改用 Server-Sent Events（而不是轮询）
  - [ ] `/api/generate/stream` 返回 EventStream，推送进度更新

### Phase 3 — 场景模板编辑 + 高级功能（约 1 周）

**目标：** 团队可自定义场景模板，支持高级用户手动编辑 prompt

**任务清单：**

- [ ] **场景模板管理页**
  - [ ] 列出所有内置 + 用户创建的场景
  - [ ] 新建模板（复制已有模板为起点）
  - [ ] 编辑模板：修改名称、scene_type、brief 字段、默认素材、默认尺寸
  - [ ] 删除模板（软删除）
  - [ ] `/api/scenes` POST/PUT/DELETE 接口实现

- [ ] **Prompt 手动编辑**
  - [ ] 生图工作台的 prompt 预览支持"编辑模式"
  - [ ] 允许用户直接修改生成的 prompt，再点击生成
  - [ ] 保存自定义 prompt override 到 brief 表单（下次用此模板时回忆）

- [ ] **高级导出**
  - [ ] 支持导出单张图片的完整信息为 YAML / JSON
  - [ ] 支持从 YAML 导入并重新生成（便于分享配置）

### Phase 4 — 可选扩展 & 优化

- [ ] 移动端适配（优先桌面端）
- [ ] 生成结果一键分享到飞书 / Slack
- [ ] 批量生成（选多个模板，一次性跑）
- [ ] 图片版本管理（同一个 brief 的多次生成历史对比）
- [ ] Vercel 部署支持（解决 60s 超时，改用外部 worker 或改长超时）

---

## 九、约束与边界

**当前版本不包含：**
- 用户认证（内部工具，跳过）
- 云端图片存储（本地优先）
- 审批/协作工作流（Phase 3+ 考虑）
- 移动端完整适配（优先桌面端）

**当前代码状态（2026-03-18）：**
- 生图工作台核心完成，支持 5 种场景模板
- Gemini API 客户端已集成
- 数据层用 JSON 文件（简单，足以支持团队规模）
- P1 优先补充：图库完整页面、素材上传、错误降级
- P2 再做异步化（目前同步，Vercel 有 60s 超时风险）

**Vercel 部署注意：**
- Vercel Functions 默认超时 60s（Pro 计划可到 300s）
- 图片生成通常需要 30-180s，本地部署无此限制
- 上 Vercel 前需评估是否加任务队列（BullMQ + Redis）或改用 Vercel 外部 Worker

**本地部署：**
```bash
npm install
npm run dev       # 开发
npm run build && npm run start   # 生产
```

---

## 十、待决策事项

| 问题 | 选项 A | 选项 B | 建议 |
|---|---|---|---|
| 生成同步 vs 异步 | 同步等待（简单） | 任务队列（复杂） | Phase 1 保持同步，Phase 2 异步化 |
| Vercel vs 纯本地 | Vercel（需处理超时） | 本地 `next start` | 先本地，稳定后评估 Vercel |
| 图片 serve 方式 | Next.js API route | nginx 静态文件 | API route 简单，够用 |
| 素材存储 | public/ 目录 | 独立 uploads 目录 | public/ 更简单，直接可访问 |
| 队列实现 | BullMQ + Redis | 简���的文件锁轮询 | Phase 2 先用文件锁，稳定后升级 |
