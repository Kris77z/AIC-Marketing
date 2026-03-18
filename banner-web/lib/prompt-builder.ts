import type { AssetRecord, PromptBuildResult, SceneRecord, SceneType } from "@/lib/types";

const BASE_QUALITY_BLOCK = [
  "整体画面灵动、不僵硬，有空气感与呼吸感。",
  "前景、中景、背景分层清楚，光影有流动感。",
  "构图克制，主体明确，避免元素平均堆满画面。",
  "保留适合后续排版的干净留白区域。",
  "质感偏高级商业插画或品牌 KV，不要廉价电商海报感。"
].join("");

const BASE_NEGATIVE = [
  "避免文字、水印、乱码、错误 logo",
  "避免低幼 Q 版、廉价萌系、塑料感 3D",
  "避免生硬站桩、四肢僵硬、手部错误",
  "避免荧光脏色、土味促销感、元素堆砌",
  "避免画面没有视觉中心"
].join("，");

function textValue(input: Record<string, unknown>, key: string, fallback = "") {
  const value = input[key];
  return typeof value === "string" ? value.trim() : fallback;
}

function multiTextValue(input: Record<string, unknown>, key: string) {
  const value = input[key];
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function resolveCopyInstruction(copySide: string) {
  switch (copySide) {
    case "right":
      return "画面右侧保留大面积干净留白，方便后续文案排版。";
    case "none":
      return "整体构图完整饱满，但仍保留呼吸感，不要塞满。";
    case "left":
    default:
      return "画面左侧保留大面积干净留白，方便后续文案排版。";
  }
}

function pickSceneStrategy(sceneType: SceneType, assets: AssetRecord[]) {
  if (assets.some((asset) => asset.type === "mascot")) {
    return "mascot-led";
  }
  return sceneType;
}

function mascotPrompt(theme: string, mood: string, copySide: string, mascot: AssetRecord, overrides: string[]) {
  return [
    `严格参考提供的吉祥物 ${mascot.name} 形象，保持原本轮廓、配色、表情识别度和核心特征不变。`,
    "吉祥物必须成为唯一主角，不允许人物替代，不增加第二角色。",
    `围绕“${theme}”构建横版活动主视觉，整体气质为${mood || "温暖、灵动、品牌感"}。`,
    "让吉祥物以自然半侧身或轻微迈步的姿态成为视觉中心，背景只做陪衬。",
    resolveCopyInstruction(copySide),
    BASE_QUALITY_BLOCK,
    overrides.join("")
  ].join("");
}

function collabPrompt(theme: string, mood: string, copySide: string, logos: AssetRecord[], overrides: string[]) {
  const logoText = logos.length > 0 ? `准确参考 ${logos.map((item) => item.name).join("、")} 的 logo，但 logo 不是最大主体。` : "";
  return [
    `为“${theme}”生成联名活动横版主视觉。`,
    logoText,
    `整体氛围为${mood || "高级、清爽、层次分明"}，更像品牌联名 KV，而不是促销海报。`,
    "让画面有一个明确的主角或主物件，配合少量流光、丝带或光粒增强动势。",
    resolveCopyInstruction(copySide),
    BASE_QUALITY_BLOCK,
    overrides.join("")
  ].join("");
}

function productPrompt(theme: string, mood: string, copySide: string, productFocus: string, overrides: string[]) {
  return [
    `为“${theme}”生成产品或功能上线主视觉。`,
    productFocus ? `重点表达：${productFocus}。` : "",
    `整体氛围为${mood || "高质感、现代、克制科技感"}。`,
    "让产品或功能核心对象成为唯一视觉重心，使用明确主光与干净背景层次。",
    resolveCopyInstruction(copySide),
    BASE_QUALITY_BLOCK,
    overrides.join("")
  ].join("");
}

function festivePrompt(theme: string, mood: string, copySide: string, styleRef: AssetRecord | undefined, overrides: string[]) {
  return [
    `为“${theme}”生成节庆活动头图。`,
    `画面气质为${mood || "温暖、灵动、有呼吸感"}。`,
    styleRef ? `可参考 ${styleRef.name} 的色调与节庆氛围，但不要直接复制构图。` : "",
    "通过暖色光影、花枝、丝带、粒子或流光表达节庆感，避免大红大金堆砌。",
    resolveCopyInstruction(copySide),
    BASE_QUALITY_BLOCK,
    overrides.join("")
  ].join("");
}

function genericPrompt(theme: string, mood: string, copySide: string, overrides: string[]) {
  return [
    `为“${theme}”生成活动横版主视觉。`,
    `整体氛围为${mood || "明亮、层次感、品牌感"}。`,
    "画面要有一个清晰主角或焦点，辅以少量动势元素营造轻微流动感。",
    resolveCopyInstruction(copySide),
    BASE_QUALITY_BLOCK,
    overrides.join("")
  ].join("");
}

export function buildPrompt({
  scene,
  brief,
  selectedAssets
}: {
  scene: SceneRecord;
  brief: Record<string, unknown>;
  selectedAssets: AssetRecord[];
}): PromptBuildResult {
  const sceneStrategy = pickSceneStrategy(scene.sceneType, selectedAssets);
  const theme = textValue(brief, "theme", scene.name);
  const mood = textValue(brief, "mood");
  const copySide = textValue(brief, "copySide", "left");
  const productFocus = textValue(brief, "productFocus");

  const mascot = selectedAssets.find((asset) => asset.type === "mascot");
  const logos = selectedAssets.filter((asset) => asset.type === "logo");
  const styleRef = selectedAssets.find((asset) => asset.type === "style-ref");
  const strategyNotes = [
    `scene=${scene.sceneType}`,
    mascot ? `mascot=${mascot.slug}` : null,
    logos.length ? `logos=${logos.map((item) => item.slug).join(",")}` : null,
    styleRef ? `style=${styleRef.slug}` : null
  ].filter(Boolean) as string[];

  const prompt =
    sceneStrategy === "mascot-led" && mascot
      ? mascotPrompt(theme, mood, copySide, mascot, scene.promptOverrides)
      : sceneStrategy === "collab"
        ? collabPrompt(theme, mood, copySide, logos, scene.promptOverrides)
        : sceneStrategy === "product"
          ? productPrompt(theme, mood, copySide, productFocus, scene.promptOverrides)
          : sceneStrategy === "festive"
            ? festivePrompt(theme, mood, copySide, styleRef, scene.promptOverrides)
            : genericPrompt(theme, mood, copySide, scene.promptOverrides);

  const negativePrompt = mascot
    ? `${BASE_NEGATIVE}，避免吉祥物识别度丢失、避免替换成人类角色。`
    : BASE_NEGATIVE;

  const assetsUsed = selectedAssets.map((asset) => asset.slug);
  const referencePaths = selectedAssets.map((asset) => asset.filePath);

  return {
    prompt,
    negativePrompt,
    assetsUsed,
    referencePaths,
    strategy: strategyNotes.join(" | ")
  };
}
