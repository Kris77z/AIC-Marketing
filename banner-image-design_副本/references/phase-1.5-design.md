# Phase 1.5 新模块详细实现计划

## 模块概览

### 模块 6：HTML+CSS 设计器（DesignStudio）

**核心特性**：
- 5-10 个预定义的 HTML/CSS 模板
- 实时预览（浏览器内渲染）
- 拖拽式表单编辑（文案、颜色、��材）
- PNG 导出（多尺寸）
- 设��方案保存到历史

**技术栈**：
- 前端：React + Tailwind / CSS-in-JS
- 导出：html2canvas（客户端）或 Puppeteer（服务端）
- 数据：JSON 模板库 + 历史存储

**文件清单**：
```
components/
  ├── design/
  │   ├── DesignWorkbench.tsx        主工作台
  │   ├── TemplateSelector.tsx       模板选择
  │   ├── PreviewCanvas.tsx          实时预览
  │   └── EditorPanel.tsx            表单编辑

lib/
  ├── design-templates.ts             5-10 个模板定义
  ├── design-renderer.ts              HTML to Canvas/PNG

app/
  └── (dashboard)/design/
      └── page.tsx

data/
  └── design-templates.json           模板库备份
```

**实现步骤**：
1. 定义 5 个基础模板（顶部通栏、卡片、分割、叠加、渐变）
2. 写 DesignWorkbench 组件（选择模板 → 编辑表单 → 预览 → 导出）
3. 集成 html2canvas，实现 PNG 导出
4. 保存设计方案到 store.json（类似 job 记录）
5. 在图库中展示设计类出稿（与 AI 生成区分）

---

### 模块 7：热点快速出稿（HotspotStudio）

**核心特性**：
- 输入热点主题和品牌立场
- 自动生成多个文案版本（不同风格/渠道）
- 并行生成对应的 banner 配图
- 展示"文案 + 配图"的组合方案

**技术栈**：
- 前端��React
- Prompt 构建：hotspot-builder.ts（需要你的 hotspot.md）
- 文案生成：可选，需文本模型（如 Claude API）
- Banner 生成：现有的 Gemini 客户端

**文件清单**：
```
components/
  ├── hotspot/
  │   ├── HotspotWorkbench.tsx       主工作台
  │   ├── TopicInput.tsx              热点输入
  │   ├── CopyVariantDisplay.tsx      文案展示
  │   └── BannerPreview.tsx           配图展示

lib/
  ├── hotspot-builder.ts              Prompt 构建引擎

app/
  ├── api/hotspot/
  │   └── generate/route.ts           热点生成 API
  └── (dashboard)/hotspot/
      └── page.tsx

data/
  └── hotspot-skil.md                 你提供的规范（待获取）
```

**实现步骤**：
1. 等你提供 hotspot.md（Skill 文件）
2. 写 hotspot-builder.ts，根据 hotspot.md 构建 prompt
3. 写 POST /api/hotspot/generate，并行调用：
   - 文案生成（可选）
   - Banner Gemini 生成
4. 前端 HotspotWorkbench，展示多个"文案+图"的组合
5. 支持"一键复制文案+下载图"

---

## 实现顺序建议

### Week 1（本周）：完成 Phase 1 细节 + 开始 Phase 1.5

**Monday-Wednesday**：Phase 1 细节修补
- 图库"修改再生"跳转逻辑
- 生成失败 UI
- 素材上传实时刷新

**Thursday-Friday**：HTML 设计器起手

- [ ] 定义 5 个基础模板（结合你的品牌）
- [ ] 写 DesignWorkbench 主框架
- [ ] 集成 html2canvas，实现导出

### Week 2（下周）：HTML 设计器完成 + 热点出稿开始

**Monday-Wednesday**：HTML 设计器细节打磨
- 完善所有 5 个模板
- 实时预览优化
- 多尺寸导出

**Thursday-Friday**：等你提供 hotspot.md，开始热点出稿
- 你提供 hotspot.md
- 写 hotspot-builder.ts
- 写 /api/hotspot/generate

---

## 设计器和模板的品牌定制

### 需要你确认的信息：

1. **品牌色卡**
   ```json
   {
     "primary": "#FF6600",      // 主色
     "secondary": "#FFA366",    // 辅色
     "accent": "#00CCFF",       // 点缀色
     "neutral": "#333333",      // 文字色
     "background": "#FFFFFF"    // 背景色
   }
   ```

2. **品牌字体**
   - 标题字体（如"SourceHanSansCN-Bold"）
   - 正文字体（如"SourceHanSansCN-Regular"）

3. **Logo 和吉祥物位置风格**
   - Logo 通常放在哪些位置？（左上/右上/底部）
   - 吉祥物风格喜好？（大/小/侧边/叠加）

4. **热点出稿的规范**（等你提供 hotspot.md）
   - 哪些热点类型常用？（节庆/营销/热搜/大事件）
   - 品牌立场通常怎么选？（冷淡/热情/幽默/参与）
   - 运营渠道倾向？（小红书/微博/视频号/公众号）

---

## 数据流图

### HTML 设计器

```
用户选模板
  ↓
选填文案/颜色/图片
  ↓
实时预览（浏览器渲染）
  ↓
点击导出
  ├→ html2canvas 导出 PNG
  ├→ 保存设计到 jobs 表（type=design）
  └→ 返回可下载的图片 URL

点击保存方案
  ↓
保存到 store.json（可编辑历史）
```

### 热点快速出稿

```
输入热点主题、立场、渠道
  ↓
调用 hotspot-builder 生成 prompts
  ├→ 文案 prompt（如果支持文本模型）
  └→ Banner prompt（标准 Gemini）
  ↓
并行调用
  ├→ 文案 API（可选）
  └→ Gemini 生成多张 banner
  ↓
组合结果：N 个"文案+图"的组合
  ↓
展示选项，允许一键复制文案+下载图
```

---

## 关键问题清单

- [ ] 你的品牌色卡（5 个主色）
- [ ] 品牌字体名称
- [ ] Logo / 吉祥物使用风格偏好
- [ ] hotspot.md 文件（热点出稿规范）
- [ ] 热点出稿是否需要文本生成？（需要的话需要文本模型 API）

---

## 预期时间线

- **现在～本周五**：Phase 1 细节修补 + HTML 设计器框架
- **下周一～五**：HTML 设计器完成 + 热点出稿开发
- **下周五～下下周一**：集成测试、优化、上线内测

共约 **2 周**完成 Phase 1.5。
