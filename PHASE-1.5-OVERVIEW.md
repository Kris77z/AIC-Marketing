# Banner 系统扩展规划总结

## 项目全景图

### 现有系统（Phase 1 完成）

```
Banner 图像生产系统 v1.0
│
├── 生图工作台 (/generate)
│   ├── 选场景（5种：节庆/联名/产品/吉祥物/通用）
│   ├── 填 brief（自定义表单）
│   ├── 选尺寸（多选并行生成）
│   └── AI 生图（调用 Gemini API）
│
├── 图库 (/gallery)
│   ├── 网格展示（历史图片）
│   ├── 3 维过滤（场景/时间/关键词）
│   └── 详情查看（大图 + 下载 + 复现）
│
├── 素材库 (/assets)
│   ├── 吉祥物管理
│   ├── Logo 管理
│   └── 风格参考管理
│
├── 场景模板 (/scenes)
│   ├── 新建场景
│   ├── 编辑 brief 字段
│   └── 管理默认配置
│
└── 系统设置 (/settings)
    ├── API Key 配置
    └── 模型和超时配置
```

### 新增扩展（Phase 1.5 规划）

```
新增两个出稿模块
│
├── HTML+CSS 设计器 (/design)         ← 快速出稿，不用 AI
│   ├── 选择模板（5-10 个预定义）
│   ├── 填充内容（文案/颜色/图片）
│   ├── 实时预览
│   └── PNG 导出（多尺寸）
│
└── 热点快速出稿 (/hotspot)           ← 结合热点，快速生成
    ├── 输入热点（主题/立场/渠道）
    ├── 生成文案（多个版本）
    ├── 生成配图（并行 AI 生成）
    └── 输出组合方案（文案+图）
```

---

## 两个新模块的详细说明

### 模块 A：HTML+CSS 设计器（即插即用）

**为什么需要这个**：
- 有时候要快速出稿，不想等 30-180s 的 AI 生成
- 固定场景（促销、新品、活动）可以用模板快速搞定
- 保证品牌一致性（预定义色卡、字体、布局）

**核心流程**：
```
1. 选模板
   顶部通栏型 / 卡片型 / 分割型 / 叠加型 / 渐变型

2. 填内容
   标题 / 副标题 / CTA 文案
   背景图 / 主图 / 素���（logo、吉祥物）

3. 实时预览
   浏览器内渲染，多尺寸预览

4. 导出下载
   PNG 图片（1536×1024 / 750×750 / 自定义）
   可选：导出 HTML/CSS 源码
```

**工作量**：3-5 天
- Day 1：定义 5 个模板 + 模板数据结构
- Day 2-3：DesignWorkbench 组件 + 表单编辑器
- Day 4：html2canvas 导出 + 多尺寸支持
- Day 5：测试和优化

**技术栈**：
- 前端：React + Tailwind / CSS-in-JS
- 导出：html2canvas（客户端）或 Puppeteer（服务端可选）
- 数据：JSON 模板库 + 历史存储

---

### 模块 B：热点快速出稿（依赖 hotspot.md）

**为什么需要这个**：
- 运营看到热点事件，要快速响应
- 一键生成"品牌化的文案+配图"组合
- 可以生成多个角度的文案版本

**核心流程**：
```
1. 输入热点信息
   热点主题："世界杯"、"双十一"、"明星八卦"
   品牌立场：冷淡 / 热情 / 幽默 / 深度参与
   运营渠道：小红书 / 微博 / 视频号 / 公众号
   推荐素材：logo、吉祥物、颜色

2. 系统生成
   调用 hotspot-builder 生成 prompts
   ├→ 文案 prompt（多个角度版本）
   └→ Banner prompt（视觉配图）

3. 并行调用 API
   ├→ 文案生成（可选，需文本模型）
   └→ Gemini 生成多张 banner 图

4. 组合结果
   展示"文案+配图"的多个组合方案
   用户可一键复制文案+下载图
```

**工作量**：4-7 天（依赖你提供 hotspot.md）
- Day 1：等你提供 hotspot.md
- Day 2：实现 hotspot-builder.ts（Prompt 构建）
- Day 3-4：实现 /api/hotspot/generate（并行 API 调用）
- Day 5-6：HotspotWorkbench 组件（前端展示和操作）
- Day 7：测试和优化

**技术栈**：
- Prompt 构建：hotspot-builder.ts（类似 prompt-builder.ts）
- 并行 API：Promise.all（文案 + banner）
- 前端：React 组件展示多个版本
- 数据：job type = "hotspot"

---

## 集成到现有系统

### 新页面路由
```
/generate     ← 生图工作台（现有）
/hotspot      ← 热点快速出稿（新）
/design       ← HTML 设计器（新）
/gallery      ← 图库（现有）
/assets       ← 素材库（现有）
/scenes       ← 场景模板（现有）
/settings     ← 系统设置（现有）
```

### 共享数据
- 三个���稿模块都用 `/api/assets` 的素材库（logo、吉祥物）
- 三个出稿模块都输出到 `data/output/` 和 jobs 表
- 图库展示所有类型的输出（AI 生成 / HTML 设计 / 热点出稿）

### 新增 API 端点

```
POST /api/design/export        （可选，服务端导出）
POST /api/hotspot/generate     （热点生成）
GET  /api/hotspot/variations   （获取热点的多个版本）
```

---

## 实现优先级建议

### 推荐顺序：HTML 设计器 > 热点出稿

**理由**：
1. HTML 设计器独立完整，不依赖外部输入
2. 热点出稿需要等你提供 hotspot.md（Skill 规范）
3. 并行做可以 1 周内都完成

---

## 品牌定制信息需求

为了准确实现 HTML 设计器和热点出稿，需要你确认：

### 1. 品牌色卡（5 个主色）

```json
{
  "primary": "#FF6600",          // 主色（最常用）
  "secondary": "#FFA366",        // 辅色
  "accent": "#00CCFF",           // 点缀色
  "neutral": "#333333",          // 文字色
  "background": "#FFFFFF"        // 背景色
}
```

### 2. 品牌字体

- **标题字体**：（如 "SourceHanSansCN-Bold"）
- **正文字体**：（如 "SourceHanSansCN-Regular"）

### 3. Logo 和吉祥物使用风格

- **Logo 位置偏好**：左上 / 右上 / 底部 / 其他
- **吉祥物风格**：大（主体）/ 小（点缀）/ 侧边 / 叠加 / 其他

### 4. hotspot.md 文件

你会提供的热点出稿 Skill 规范，定义：
- 常用的热点类型
- 品牌立场选项和对应的 prompt 规则
- 运营渠道（小红书/微博/视频号等）对应的文案风格
- 色彩和配图建议

---

## 时间线预估

| 时间 | 任务 | 预计工作量 |
|---|---|---|
| 本周四～五 | Phase 1 细节修补 | 1-2 天 |
| 下周一～三 | HTML 设计器开发 | 3-5 天 |
| 下周四～五 | 等 hotspot.md + 热点出稿开发 | 4-7 天 |
| **总计** | **完成 Phase 1.5** | **约 2 周** |

---

## 文件清单（预期新增）

```
banner-web/
├── components/
│   ├── design/
│   │   ├── DesignWorkbench.tsx
│   │   ├── TemplateSelector.tsx
│   │   ├── PreviewCanvas.tsx
│   │   └── EditorPanel.tsx
│   │
│   └── hotspot/
│       ├── HotspotWorkbench.tsx
│       ├── TopicInput.tsx
│       ├── CopyVariantDisplay.tsx
│       └── BannerPreview.tsx
│
├── lib/
│   ├── design-templates.ts         # 5-10 个模板定义
│   ├── design-renderer.ts          # Canvas/PNG 渲染
│   └── hotspot-builder.ts          # Prompt 构建（需 hotspot.md）
│
├── app/
│   ├── api/
│   │   ├── design/export/route.ts  # （可选）服务端导出
│   │   └── hotspot/generate/       # 热点生成
│   │
│   └── (dashboard)/
│       ├── design/page.tsx         # 设计器页面
│       └── hotspot/page.tsx        # 热点出稿页面
│
└── data/
    ├── design-templates.json       # 模板库备份
    └── hotspot-skill.md            # 你提供的规范（待获取）
```

---

## 关键决策点

1. **HTML 设计器的导出方式**
   - 方案 A（推荐）：html2canvas（客户端，即插即用）
   - 方案 B：Puppeteer（服务端，更精准，需部署成本）
   → **建议先用 A，后期升级 B**

2. **热点出稿的文案生成**
   - 方案 A：纯 prompt 文案（不调用 API，只输出文本）
   - 方案 B：调用文本模型生成文案（需要 Claude API 等）
   → **需要你明确你们的架构和能力**

3. **两个模块的并行度**
   - 方案 A：串行（先做 HTML 设计器，再做热点出稿）
   - 方案 B：并行（同时开发）
   → **建议并行，可以 1 周完成 Phase 1.5**

---

## 下一步行动清单

### 你需要做的：
- [ ] 确认品牌色卡和字体信息
- [ ] 确认 Logo 和吉祥物的使用风格
- [ ] 提供 hotspot.md 文件（热点出稿规范）
- [ ] 确认文案生成的方式（纯 prompt vs 调用 API）

### 我可以立即开始的：
- [ ] Phase 1 细节修补（修改再生、失败处理、刷新）
- [ ] HTML 设计器框架和 5 个模板
- [ ] 等你提供信息后，实现热点出稿

**预计总时间：2 周完成 Phase 1.5，3 月底前可投入内测。**
