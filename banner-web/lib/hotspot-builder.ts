import type { HotspotChannel, HotspotGenerateRequestBody, HotspotStance, HotspotVariant } from "@/lib/types";

const stanceLabels: Record<HotspotStance, string> = {
  cold: "冷静克制",
  warm: "热情参与",
  humorous: "轻松幽默",
  deep: "深度表达"
};

const channelStyles: Record<HotspotChannel, { name: string; copyStyle: string; cta: string }> = {
  xiaohongshu: {
    name: "小红书",
    copyStyle: "像一个有审美、有观点的品牌账号在分享观察，语言轻巧但不油腻。",
    cta: "评论区聊聊你的看法"
  },
  weibo: {
    name: "微博",
    copyStyle: "信息密度更高，适合一句态度 + 一句延展，节奏更快。",
    cta: "转发说说你的观点"
  },
  wechat: {
    name: "公众号",
    copyStyle: "更完整、适合有起承转合的品牌表达，语气沉稳。",
    cta: "点击查看完整观点"
  },
  video: {
    name: "视频号",
    copyStyle: "语言要短、镜头感强，适合封面标题和字幕式表达。",
    cta: "打开视频看完整版"
  }
};

const anglePresets = [
  {
    title: "品牌态度版",
    hook: "热点出现得很快，但品牌没必要抢着大声表态。",
    visual: "把热点主题转成一张情绪明确、留白克制的品牌头图，主体清晰，适合叠加一句态度型标题。"
  },
  {
    title: "用户共鸣版",
    hook: "真正能留下来的，不是追热点本身，而是和用户站在一起的那个瞬间。",
    visual: "围绕用户情绪做视觉，画面更贴近日常场景，主视觉和文案之间保留明确的呼吸区。"
  },
  {
    title: "传播转化版",
    hook: "如果要发，这一版更适合先抢到注意力，再把用户引到品牌动作里。",
    visual: "强调信息层级和按钮感，用更强对比的色块和动态构图承接热点气氛。"
  }
];

export function buildHotspotVariants(input: HotspotGenerateRequestBody): HotspotVariant[] {
  const topic = input.topic.trim();
  const count = Math.max(1, Math.min(5, input.variantCount ?? 3));
  const channel = channelStyles[input.channel];
  const stance = stanceLabels[input.stance];
  const selectedAssetSlugs = input.selectedAssetSlugs ?? [];

  return anglePresets.slice(0, count).map((preset, index) => ({
    id: `hotspot-${index + 1}`,
    angleTitle: preset.title,
    hook: preset.hook,
    copy: [
      `关于「${topic}」，这次我们更想用一种${stance}的方式回应。`,
      `${preset.hook}`,
      `在 ${channel.name} 这个渠道里，文案应该 ${channel.copyStyle}`,
      input.brief?.trim() ? `补充要求：${input.brief.trim()}` : ""
    ]
      .filter(Boolean)
      .join(" "),
    cta: channel.cta,
    bannerPrompt: [
      `围绕热点主题“${topic}”设计一张适合${channel.name}传播的品牌海报。`,
      `整体语气为${stance}，不是情绪失控的追热点，而是有品牌判断的快速回应。`,
      preset.visual,
      selectedAssetSlugs.length ? `适度引入这些品牌素材：${selectedAssetSlugs.join("、")}。` : "",
      "避免硬蹭、避免低质营销感、避免通篇大字堆满画面。"
    ]
      .filter(Boolean)
      .join(" "),
    visualDirection: preset.visual,
    selectedAssetSlugs
  }));
}
