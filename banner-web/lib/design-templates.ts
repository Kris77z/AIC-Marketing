export interface DesignTemplateContent {
  title: string;
  subtitle: string;
  cta: string;
  eyebrow: string;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  backgroundImageSlug: string;
  heroImageSlug: string;
  logoSlug: string;
}

export interface DesignTemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultContent: DesignTemplateContent;
}

export const DESIGN_TEMPLATES: DesignTemplateDefinition[] = [
  {
    id: "top-banner",
    name: "顶部通栏型",
    description: "大标题置顶，适合活动预告和新品上线。",
    category: "brand-kv",
    defaultContent: {
      eyebrow: "SPRING CAMPAIGN",
      title: "把活动主视觉快速排出来",
      subtitle: "用固定版式和品牌色卡，在几分钟内产出一版能直接发群确认的头图。",
      cta: "立即参与",
      backgroundColor: "#f3e0c7",
      accentColor: "#1b6b5f",
      textColor: "#111318",
      backgroundImageSlug: "",
      heroImageSlug: "",
      logoSlug: ""
    }
  },
  {
    id: "split-hero",
    name: "分割型",
    description: "左右分栏，适合品牌联名和信息量较多的场景。",
    category: "collab",
    defaultContent: {
      eyebrow: "BRAND COLLAB",
      title: "把品牌信息和主视觉拆开摆",
      subtitle: "一侧承载情绪和主体，一侧留给文案和行动按钮，适合联名与活动页头图。",
      cta: "查看详情",
      backgroundColor: "#f7f2eb",
      accentColor: "#ef7a4f",
      textColor: "#111318",
      backgroundImageSlug: "",
      heroImageSlug: "",
      logoSlug: ""
    }
  },
  {
    id: "stack-card",
    name: "卡片型",
    description: "信息卡片叠放，适合促销、功能亮点和专题页。",
    category: "product",
    defaultContent: {
      eyebrow: "FEATURE DROP",
      title: "重点卖点直接装进卡片里",
      subtitle: "用清晰层级把主题、补充说明和 CTA 打包，减少运营排版压力。",
      cta: "了解功能",
      backgroundColor: "#dce6f8",
      accentColor: "#3558d8",
      textColor: "#111318",
      backgroundImageSlug: "",
      heroImageSlug: "",
      logoSlug: ""
    }
  },
  {
    id: "gradient-poster",
    name: "渐变型",
    description: "大面积渐变和高对比排版，适合热点和情绪化海报。",
    category: "campaign",
    defaultContent: {
      eyebrow: "FLASH UPDATE",
      title: "热点来了，先把海报骨架搭出来",
      subtitle: "用强烈配色和简洁排版先占位，后续再补文案和图片也来得及。",
      cta: "马上响应",
      backgroundColor: "#131728",
      accentColor: "#ff8f5a",
      textColor: "#ffffff",
      backgroundImageSlug: "",
      heroImageSlug: "",
      logoSlug: ""
    }
  },
  {
    id: "overlay-focus",
    name: "叠加型",
    description: "图像为主，信息叠在图上，适合吉祥物和主视觉型头图。",
    category: "hero",
    defaultContent: {
      eyebrow: "MASCOT STORY",
      title: "让主图自己先说话",
      subtitle: "适合把吉祥物或产品主图做成第一视觉，再把文案压在安全区域里。",
      cta: "立即查看",
      backgroundColor: "#e9ddd0",
      accentColor: "#c28c3d",
      textColor: "#111318",
      backgroundImageSlug: "",
      heroImageSlug: "",
      logoSlug: ""
    }
  }
];
