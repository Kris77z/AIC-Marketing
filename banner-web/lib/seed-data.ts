import path from "node:path";

import type { AssetRecord, SceneRecord, StoredSettings } from "@/lib/types";
import { LEGACY_GALLERY_DIR } from "@/lib/paths";

const now = new Date().toISOString();

export const DEFAULT_ASSETS: AssetRecord[] = [
  {
    id: "asset-mascot-1",
    slug: "nano-banana-mascot",
    type: "mascot",
    name: "Nano Banana 吉祥物",
    filePath: path.join(LEGACY_GALLERY_DIR, "吉祥物.png"),
    lockMode: "strong",
    constraints: [
      "保持原本轮廓与配色",
      "不替换成人物",
      "不增加第二角色"
    ],
    brandColor: null,
    tags: ["吉祥物", "IP", "活动主角"],
    createdAt: now
  },
  {
    id: "asset-logo-aicoin",
    slug: "aicoin-logo",
    type: "logo",
    name: "Aicoin Logo",
    filePath: path.join(LEGACY_GALLERY_DIR, "Aicoin LOGO.png"),
    lockMode: null,
    constraints: ["准确使用 logo", "不作为唯一主体"],
    brandColor: "#f7931a",
    tags: ["品牌", "联名"],
    createdAt: now
  },
  {
    id: "asset-logo-okx",
    slug: "okx-logo",
    type: "logo",
    name: "OKX Logo",
    filePath: path.join(LEGACY_GALLERY_DIR, "OKX LOGO.png"),
    lockMode: null,
    constraints: ["准确使用 logo", "不放大到压过主视觉"],
    brandColor: "#111111",
    tags: ["品牌", "联名"],
    createdAt: now
  },
  {
    id: "asset-style-festive",
    slug: "festive-atmosphere-ref",
    type: "style-ref",
    name: "节庆氛围参考",
    filePath: path.join(LEGACY_GALLERY_DIR, "爱意正浓，年味正盛.png"),
    lockMode: null,
    constraints: ["只借鉴氛围和色调", "不直接复制构图"],
    brandColor: null,
    tags: ["春节氛围", "暖色", "节庆"],
    createdAt: now
  }
];

export const DEFAULT_SCENES: SceneRecord[] = [
  {
    id: "scene-festive",
    name: "节庆活动头图",
    sceneType: "festive",
    briefSchema: [
      { name: "theme", label: "活动主题", type: "text", required: true, placeholder: "春节红包活动，喜庆但不俗气" },
      { name: "mood", label: "情绪氛围", type: "text", placeholder: "温暖、灵动、有呼吸感" },
      {
        name: "copySide",
        label: "文案留白",
        type: "radio",
        defaultValue: "left",
        options: [
          { label: "左侧", value: "left" },
          { label: "右侧", value: "right" },
          { label: "无留白", value: "none" }
        ]
      },
      {
        name: "styleRef",
        label: "风格参考图",
        type: "asset-single",
        assetType: "style-ref"
      }
    ],
    defaultAssets: ["festive-atmosphere-ref"],
    defaultSizes: ["1536x1024", "750x750"],
    promptOverrides: ["克制使用节庆元素，不堆红金符号。"],
    createdAt: now,
    updatedAt: now
  },
  {
    id: "scene-collab",
    name: "品牌联名合作",
    sceneType: "collab",
    briefSchema: [
      { name: "theme", label: "联名主题", type: "text", required: true, placeholder: "Aicoin x OKX 春日联名活动" },
      { name: "mood", label: "氛围关键词", type: "text", placeholder: "高级、清爽、轻微动势" },
      {
        name: "logos",
        label: "品牌 Logo",
        type: "asset-multi",
        assetType: "logo"
      },
      {
        name: "copySide",
        label: "文案留白",
        type: "radio",
        defaultValue: "left",
        options: [
          { label: "左侧", value: "left" },
          { label: "右侧", value: "right" },
          { label: "无留白", value: "none" }
        ]
      }
    ],
    defaultAssets: ["aicoin-logo", "okx-logo"],
    defaultSizes: ["1536x1024"],
    promptOverrides: ["logo 准确且克制，主角应先于品牌标识。"],
    createdAt: now,
    updatedAt: now
  },
  {
    id: "scene-product",
    name: "产品功能上线",
    sceneType: "product",
    briefSchema: [
      { name: "theme", label: "产品主题", type: "text", required: true, placeholder: "新功能上线海报" },
      { name: "productFocus", label: "核心卖点", type: "textarea", placeholder: "强调功能、速度或收益感知" },
      { name: "mood", label: "视觉氛围", type: "text", placeholder: "高质感、科技感、不过度科幻" },
      {
        name: "copySide",
        label: "文案留白",
        type: "radio",
        defaultValue: "left",
        options: [
          { label: "左侧", value: "left" },
          { label: "右侧", value: "right" },
          { label: "无留白", value: "none" }
        ]
      }
    ],
    defaultAssets: [],
    defaultSizes: ["1536x1024", "1080x1920"],
    promptOverrides: ["视觉重点应聚焦产品或功能实体，不走廉价科技蓝。"],
    createdAt: now,
    updatedAt: now
  },
  {
    id: "scene-mascot",
    name: "吉祥物主题图",
    sceneType: "mascot-led",
    briefSchema: [
      { name: "theme", label: "活动主题", type: "text", required: true, placeholder: "春日问候海报" },
      { name: "mood", label: "氛围词", type: "text", placeholder: "温暖、轻盈、品牌感" },
      {
        name: "mascot",
        label: "吉祥物",
        type: "asset-single",
        assetType: "mascot"
      },
      {
        name: "copySide",
        label: "文案留白",
        type: "radio",
        defaultValue: "left",
        options: [
          { label: "左侧", value: "left" },
          { label: "右侧", value: "right" },
          { label: "无留白", value: "none" }
        ]
      }
    ],
    defaultAssets: ["nano-banana-mascot"],
    defaultSizes: ["1536x1024", "750x750"],
    promptOverrides: ["吉祥物必须是唯一主角。"],
    createdAt: now,
    updatedAt: now
  },
  {
    id: "scene-generic",
    name: "通用活动海报",
    sceneType: "generic",
    briefSchema: [
      { name: "theme", label: "活动主题", type: "text", required: true, placeholder: "春日拉新活动主视觉" },
      { name: "mood", label: "氛围关键词", type: "text", placeholder: "明亮、层次感、品牌 KV" },
      {
        name: "copySide",
        label: "文案留白",
        type: "radio",
        defaultValue: "left",
        options: [
          { label: "左侧", value: "left" },
          { label: "右侧", value: "right" },
          { label: "无留白", value: "none" }
        ]
      }
    ],
    defaultAssets: [],
    defaultSizes: ["1536x1024"],
    promptOverrides: [],
    createdAt: now,
    updatedAt: now
  }
];

export const DEFAULT_SETTINGS: StoredSettings = {
  apiKey: "",
  baseUrl: "https://ai.co.link/gemini",
  model: "gemini-2.5-flash-image",
  apiFormat: "gemini",
  timeoutSeconds: 180
};
