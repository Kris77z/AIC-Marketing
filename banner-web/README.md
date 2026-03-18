# Banner Web

基于 `product-spec.md` 落地的第一版 Web MVP，把 CLI 脚本升级为一个内部可视化生图工具。

## Phase 1 完成情况（2026-03-18）

### ✅ 已实现

**生图工作台**
- 四步流程：场景选择 → brief 表单 → 尺寸选择 → prompt 预览 → 生成
- 5 种场景模板（节庆/联名/产品/吉祥物/通用）
- Prompt 构建引擎，支持自定义 prompt 模式
- 多尺寸并行生成

**图库**
- 网格展示所有历史生成图片
- 场景类型、时间范围、关键词三维过滤
- 详情面板：大图预览、meta 信息、prompt 查看、下载/重新生成/修改再生

**素材库**
- 拖拽上传三类素材（IP 吉祥物 / 品牌 Logo / 风格参考）
- 元数据编辑（名称、约束、标签、品牌色等）
- 按类型分组，搜索和过滤
- 文件存储到 public/assets/uploads/，自动清理

**场景管理**
- 新建/复制/编辑/删除场景模板
- 可视化编辑 brief 字段定义
- 设定默认素材和输出尺寸

**失败降级**
- API 失败时保留 prompt 和 negativePrompt
- 返回文本供人工使用或重试

### API 接口（全部已实现）

```
生成:
  POST   /api/generate          生成图片（支持多尺寸/多变体）
  GET    /api/jobs              查询历史任务

素材:
  POST   /api/assets            上传素材（multipart/form-data）
  GET    /api/assets            列表/查询素材
  PATCH  /api/assets            编辑素材元数据
  DELETE /api/assets/{id}       删除素材（自动清理文件）

场景:
  POST   /api/scenes            新建场景
  GET    /api/scenes            列表/查询场景
  PATCH  /api/scenes            更新场景
  DELETE /api/scenes/{id}       删除场景

其他:
  GET    /api/images/[...path]  serve 本地生成的图片
  GET    /api/settings          读取系统设置
```

### 数据和存储

- **JSON 文件存储**：`data/store.json`（素材、场景、任务）
- **���片输出**：`data/output/{date}_{scene}_{width}x{height}_{jobId}.png`
- **素材上传**：`public/assets/uploads/{type}/{slug}.{ext}`
- **缓存机制**：内存缓存 + 文件持久化

## 启动

```bash
# 安装依赖
npm install

# 开发环境
npm run dev          # localhost:3000

# 生产构建
npm run build
npm run start
```

## 环境配置（.env.local）

```bash
GEMINI_AUTH_KEY=your-key
IMAGE_GEN_BASE_URL=https://ai.co.link/gemini
IMAGE_GEN_MODEL=gemini-2.5-flash-image
```

默认已对齐 Tg-news L6 配置：
- relay 模式使用 `x-auth-key` 头
- 官方 Gemini 模式使用 `x-goog-api-key` 头

## 页面和功能

| 页面 | 路由 | 说明 |
|---|---|---|
| 生图工作台 | `/generate` | 核心：选场景 → 填 brief → 选尺寸 → 生成 |
| 图库 | `/gallery` | 历史记录，支持过滤、搜索、详情查看 |
| 素材库 | `/assets` | 上传和管理素材 |
| 场景管理 | `/scenes` | 新建和编辑场景模板 |
| 系统设置 | `/settings` | API Key、模型、超时时间等 |

## 项目结构

```
banner-web/
├── app/
│   ├── (dashboard)/         仪表盘页面
│   │   ├── generate/page.tsx   生图工作台
│   │   ├── gallery/page.tsx    图库列表
│   │   ├── assets/page.tsx     素材库
│   │   ├── scenes/page.tsx     场景管理
│   │   └── settings/page.tsx   系统设置
│   └── api/                 API 路由
│       ├── generate/        生成图片
│       ├── jobs/            查询任务
│       ├── assets/          素材管理
│       ├── scenes/          场景管理
│       ├── images/          图片服务
│       └── settings/        配置读取
├── components/
│   ├── generate/            生图工作台组件
│   ├── gallery/             图库组件
│   ├── assets/              素材库组件
│   ├── scenes/              场景管理组件
│   ├── settings/            设置组件
│   └── layout/              导航和布局
├── lib/
│   ├── db.ts                JSON 数据库（CRUD）
│   ├── types.ts             TypeScript 类型定义
│   ├── prompt-builder.ts    Prompt 构建引擎
│   ├── gemini-client.ts     Gemini API 客户端
│   ├── image-routes.ts      图片 URL 构建
│   ├── paths.ts             文件路径常量
│   └── utils.ts             工具函数
└── data/                    运行时数据（gitignore）
    ├── store.json           素材/场景/任务存储
    └── output/              生成的图片
```

## 待办事项

### P0 - 本周（影响可用性）
- [ ] 图库详情面板的"修改再生"跳转逻辑
- [ ] 生成失败时的前端 UI（prompt 展示 + 操作）
- [ ] 素材上传后的实时刷新

### P1 - 下周（体验提升）
- [ ] 异步生成 + 进度反馈（轮询或 SSE）
- [ ] Prompt 手工编辑模式
- [ ] 错误边界和加载态

### P2 - 后续
- [ ] 移动端适配
- [ ] 批量生成
- [ ] Vercel 部署优化（解决 60s 超时）

## 编译状态

✅ `npm run build` 通过，无 TypeScript 错误

## 技术栈

- Next.js 15 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS
- lucide-react (icons)
