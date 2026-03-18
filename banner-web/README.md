# AIC-Marketing

`AIC-Marketing` 是一套内部营销生产后台，把三类能力收进同一个系统：

- 统一出稿：在一个工作台里选择 `AI 生图` 或 `HTML 设计`
- 自动热点：读取热点 feed，自动判定走 AI 视觉还是 HTML 信息稿
- 图库留痕：所有自动或手动产出都会回写图库

## 当前能力

### 统一出稿

- `/generate` 作为统一入口，支持 `AI 生图 / HTML 设计`
- AI 生图默认用场景模板自动拼 prompt，不要求运营手改提示词
- HTML 设计支持固定模板、SVG/HTML 导出和图库留痕

### 自动热点 pipeline

- `/hotspot` 不再手填主题，而是展示热点池和流水线运行记录
- 支持读取外部热点 feed 文件，或执行 `HOTSPOT_COLLECT_COMMAND`
- planner 自动判定热点更适合：
  - `AI 生图`
  - `HTML 自动设计`
- 自动产出会直接写入 jobs 和图库

### 基础管理

- 图库：过滤、搜索、详情、复制 prompt、重进统一出稿
- 素材库：上传、编辑、删除、标签管理
- 场景模板：配置 brief 字段、默认素材和尺寸

## 关键路由

```bash
/generate              # 统一出稿
/hotspot               # 自动热点流水线
/gallery               # 图库
/assets                # 素材库
/scenes                # 场景管理
```

```bash
POST /api/generate
POST /api/design/export
GET  /api/pipeline
POST /api/pipeline/collect
POST /api/pipeline/run
```

## 启动

```bash
npm install
npm run dev
```

## 环境变量

### 生图模型

```bash
GEMINI_AUTH_KEY=your-key
IMAGE_GEN_BASE_URL=https://ai.co.link/gemini
IMAGE_GEN_MODEL=gemini-2.5-flash-image
```

### 热点源

方式 1：让自动化把热点写到本地 feed 文件

```bash
HOTSPOT_SOURCE_FILE=/absolute/path/to/hotspots-feed.json
```

方式 2：直接执行外部热点采集命令

```bash
HOTSPOT_COLLECT_COMMAND="your-hotspot-command --json"
```

如果都没有配置，系统会回退到内置示例热点。

## 接 x-collect 的推荐方式

如果你要用 `x-collect` 做定时热点采集，推荐流程是：

1. 安装 skill
```bash
npx skillstore add kangarooking/x-collect
```

2. 让 automation 或脚本定时把结果写到：
```bash
banner-web/data/hotspots-feed.json
```

3. 在应用里配置：
```bash
HOTSPOT_SOURCE_FILE=./data/hotspots-feed.json
```

这样 `/hotspot` 页面就能直接消费热点并自动出稿。

## 技术说明

- 存储：`data/store.json`
- 自动热点产物：`jobType = "hotspot"`
- HTML 自动设计目前走服务端 SVG 落盘，图库可直接预览

## 验证

```bash
npm run build
```
