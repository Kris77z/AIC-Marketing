import { DESIGN_TEMPLATES } from "@/lib/design-templates";
import type { HotspotRecord, PipelinePlan } from "@/lib/types";

function includesKeyword(haystack: string, keywords: string[]) {
  return keywords.some((keyword) => haystack.includes(keyword));
}

function compactText(value: string, limit: number) {
  if (value.length <= limit) {
    return value;
  }
  return `${value.slice(0, Math.max(0, limit - 1)).trim()}…`;
}

function pickMode(hotspot: HotspotRecord) {
  const haystack = `${hotspot.title} ${hotspot.summary} ${hotspot.tags.join(" ")}`.toLowerCase();

  if (includesKeyword(haystack, ["发布", "上线", "功能", "版本", "报告", "数据", "公告", "政策", "教程", "解读"])) {
    return "design" as const;
  }

  if (includesKeyword(haystack, ["节日", "联名", "社区", "meme", "表情", "吉祥物", "热点", "梗", "情绪"])) {
    return "ai" as const;
  }

  return hotspot.score >= 85 ? "ai" as const : "design" as const;
}

function pickAssetSlugs(hotspot: HotspotRecord) {
  const haystack = `${hotspot.title} ${hotspot.summary} ${hotspot.tags.join(" ")}`.toLowerCase();
  const slugs = ["aicoin-logo"];

  if (includesKeyword(haystack, ["联名", "okx"])) {
    slugs.push("okx-logo");
  }
  if (includesKeyword(haystack, ["吉祥物", "meme", "社区", "梗"])) {
    slugs.push("nano-banana-mascot");
  }
  if (includesKeyword(haystack, ["节日", "春节", "活动", "campaign"])) {
    slugs.push("festive-atmosphere-ref");
  }

  return Array.from(new Set(slugs));
}

function pickSceneId(hotspot: HotspotRecord) {
  const haystack = `${hotspot.title} ${hotspot.summary} ${hotspot.tags.join(" ")}`.toLowerCase();
  if (includesKeyword(haystack, ["联名", "合作", "okx"])) {
    return "scene-collab";
  }
  if (includesKeyword(haystack, ["吉祥物", "meme", "社区", "梗"])) {
    return "scene-mascot";
  }
  if (includesKeyword(haystack, ["发布", "上线", "功能", "产品", "版本"])) {
    return "scene-product";
  }
  if (includesKeyword(haystack, ["节日", "活动", "春节"])) {
    return "scene-festive";
  }
  return "scene-generic";
}

function pickTemplateId(hotspot: HotspotRecord) {
  const haystack = `${hotspot.title} ${hotspot.summary} ${hotspot.tags.join(" ")}`.toLowerCase();
  if (includesKeyword(haystack, ["联名", "合作", "okx"])) {
    return "split-hero";
  }
  if (includesKeyword(haystack, ["发布", "上线", "功能", "数据", "报告"])) {
    return "stack-card";
  }
  if (includesKeyword(haystack, ["热点", "快讯", "情绪", "表情"])) {
    return "gradient-poster";
  }
  return DESIGN_TEMPLATES[0]?.id ?? "top-banner";
}

function buildAiPlan(hotspot: HotspotRecord): PipelinePlan {
  const sceneId = pickSceneId(hotspot);
  const selectedAssetSlugs = pickAssetSlugs(hotspot);

  return {
    mode: "ai",
    title: hotspot.title,
    reasoning: "该热点更依赖情绪表达和视觉氛围，优先走 AI 生图，确保在讨论期快速给出一版品牌化头图。",
    sceneId,
    brief: {
      theme: hotspot.title,
      mood: hotspot.score >= 88 ? "快速响应、品牌感、带一点情绪张力" : "克制、清晰、适合社媒传播",
      productFocus: compactText(hotspot.summary, 72),
      copySide: "left"
    },
    sizes: [{ width: 1536, height: 1024 }],
    variantCount: hotspot.score >= 90 ? 2 : 1,
    selectedAssetSlugs
  };
}

function buildDesignPlan(hotspot: HotspotRecord): PipelinePlan {
  const templateId = pickTemplateId(hotspot);
  const selectedAssetSlugs = pickAssetSlugs(hotspot);

  return {
    mode: "design",
    title: hotspot.title,
    reasoning: "该热点信息密度更高，优先走 HTML 设计模板，保证信息层级稳定、改文案也更可控。",
    templateId,
    sizes: [{ width: 1200, height: 628 }],
    variantCount: 1,
    selectedAssetSlugs,
    designContent: {
      eyebrow: hotspot.tags.slice(0, 2).join(" / ").toUpperCase() || "AIC HOTSPOT",
      title: compactText(hotspot.title, 24),
      subtitle: compactText(hotspot.summary, 54),
      cta: "查看完整解读"
    }
  };
}

export function buildPipelinePlan(hotspot: HotspotRecord): PipelinePlan {
  return pickMode(hotspot) === "ai" ? buildAiPlan(hotspot) : buildDesignPlan(hotspot);
}
