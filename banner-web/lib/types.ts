export type AssetType = "mascot" | "logo" | "style-ref";
export type LockMode = "strong" | "loose";
export type SceneType = "festive" | "collab" | "product" | "mascot-led" | "generic";
export type JobStatus = "pending" | "running" | "done" | "failed";
export type ApiFormat = "gemini" | "openai" | "auto";
export type JobType = "generate" | "design" | "hotspot";

export type BriefFieldType =
  | "text"
  | "textarea"
  | "select"
  | "radio"
  | "number"
  | "asset-single"
  | "asset-multi";

export interface BriefFieldOption {
  label: string;
  value: string;
}

export interface BriefField {
  name: string;
  label: string;
  type: BriefFieldType;
  required?: boolean;
  placeholder?: string;
  options?: BriefFieldOption[];
  assetType?: AssetType;
  min?: number;
  max?: number;
  defaultValue?: string | number;
}

export interface AssetRecord {
  id: string;
  slug: string;
  type: AssetType;
  name: string;
  filePath: string;
  lockMode?: LockMode | null;
  constraints: string[];
  brandColor?: string | null;
  tags: string[];
  createdAt: string;
}

export interface SceneRecord {
  id: string;
  name: string;
  sceneType: SceneType;
  briefSchema: BriefField[];
  defaultAssets: string[];
  defaultSizes: string[];
  promptOverrides: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JobRecord {
  id: string;
  jobType?: JobType;
  title?: string | null;
  sceneId?: string | null;
  status: JobStatus;
  briefInput: Record<string, unknown>;
  generatedPrompt?: string | null;
  negativePrompt?: string | null;
  model?: string | null;
  width?: number | null;
  height?: number | null;
  outputPath?: string | null;
  errorMessage?: string | null;
  assetsUsed: string[];
  createdAt: string;
  completedAt?: string | null;
}

export interface StoredSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  apiFormat: ApiFormat;
  timeoutSeconds: number;
}

export interface GenerateSize {
  width: number;
  height: number;
}

export interface GenerateRequestBody {
  sceneId?: string;
  brief: Record<string, unknown>;
  selectedAssetSlugs?: string[];
  sizes: GenerateSize[];
  variantCount?: number;
  promptOverride?: string;
  negativePromptOverride?: string;
}

export interface PromptBuildResult {
  prompt: string;
  negativePrompt: string;
  assetsUsed: string[];
  referencePaths: string[];
  strategy: string;
}

export interface GenerateResultItem {
  job: JobRecord;
  imageUrl?: string;
}

export type HotspotStance = "cold" | "warm" | "humorous" | "deep";
export type HotspotChannel = "xiaohongshu" | "weibo" | "wechat" | "video";

export interface HotspotVariant {
  id: string;
  angleTitle: string;
  hook: string;
  copy: string;
  cta: string;
  bannerPrompt: string;
  visualDirection: string;
  selectedAssetSlugs: string[];
}

export interface HotspotGenerateRequestBody {
  topic: string;
  stance: HotspotStance;
  channel: HotspotChannel;
  brief?: string;
  selectedAssetSlugs?: string[];
  variantCount?: number;
}
