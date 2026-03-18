import { writeFile } from "node:fs/promises";
import path from "node:path";

import { getAssetsBySlugs, getSceneById, insertJob, updateJob } from "@/lib/db";
import { generateImage } from "@/lib/gemini-client";
import { buildImageUrl } from "@/lib/image-routes";
import { OUTPUT_DIR } from "@/lib/paths";
import { buildPrompt } from "@/lib/prompt-builder";
import { readSettings } from "@/lib/settings-store";
import type {
  AssetRecord,
  GenerateRequestBody,
  GenerateResultItem,
  JobRecord,
  JobType,
  SceneRecord
} from "@/lib/types";
import { slugify } from "@/lib/utils";

export interface PreparedGenerationRequest {
  scene: SceneRecord;
  brief: Record<string, unknown>;
  selectedAssets: AssetRecord[];
  finalPrompt: string;
  finalNegativePrompt: string;
  strategy: string;
  sizes: Array<{ width: number; height: number }>;
  variantCount: number;
  model: string;
  jobType: JobType;
  title?: string | null;
}

function fallbackScene(): SceneRecord {
  return {
    id: "scene-generic-fallback",
    name: "通用活动海报",
    sceneType: "generic",
    briefSchema: [],
    defaultAssets: [],
    defaultSizes: ["1536x1024"],
    promptOverrides: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function collectAssetSlugs(scene: SceneRecord, brief: Record<string, unknown>, selectedAssetSlugs: string[]) {
  const fromFields = scene.briefSchema.flatMap((field) => {
    if (field.type === "asset-single") {
      const value = brief[field.name];
      return typeof value === "string" && value ? [value] : [];
    }
    if (field.type === "asset-multi") {
      const value = brief[field.name];
      return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
    }
    return [];
  });

  return Array.from(new Set([...scene.defaultAssets, ...selectedAssetSlugs, ...fromFields]));
}

function createPendingJob({
  scene,
  brief,
  prompt,
  negativePrompt,
  model,
  width,
  height,
  assetsUsed,
  jobType,
  title
}: {
  scene: SceneRecord;
  brief: Record<string, unknown>;
  prompt: string;
  negativePrompt: string;
  model: string;
  width: number;
  height: number;
  assetsUsed: string[];
  jobType: JobType;
  title?: string | null;
}): JobRecord {
  return {
    id: crypto.randomUUID(),
    jobType,
    title: title ?? null,
    sceneId: scene.id,
    status: "pending",
    briefInput: brief,
    generatedPrompt: prompt,
    negativePrompt,
    model,
    width,
    height,
    outputPath: null,
    errorMessage: null,
    assetsUsed,
    createdAt: new Date().toISOString(),
    completedAt: null
  };
}

async function runSingleGeneration({
  scene,
  brief,
  selectedAssets,
  width,
  height,
  prompt,
  negativePrompt,
  model,
  jobType,
  title
}: {
  scene: SceneRecord;
  brief: Record<string, unknown>;
  selectedAssets: AssetRecord[];
  width: number;
  height: number;
  prompt: string;
  negativePrompt: string;
  model: string;
  jobType: JobType;
  title?: string | null;
}): Promise<GenerateResultItem> {
  const settings = readSettings();
  const pendingJob = insertJob(
    createPendingJob({
      scene,
      brief,
      prompt,
      negativePrompt,
      model,
      width,
      height,
      assetsUsed: selectedAssets.map((asset) => asset.slug),
      jobType,
      title
    })
  );

  const configuredApiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_AUTH_KEY;
  if (!configuredApiKey) {
    const failedJob = updateJob(pendingJob.id, {
      status: "failed",
      errorMessage: "缺少 API Key。请先在本地环境变量中配置 GEMINI_AUTH_KEY 或 GEMINI_API_KEY。",
      completedAt: new Date().toISOString()
    });
    return { job: failedJob };
  }

  updateJob(pendingJob.id, { status: "running" });

  try {
    const imageBytes = await generateImage({
      apiKey: configuredApiKey,
      baseUrl: process.env.IMAGE_GEN_BASE_URL || process.env.GEMINI_BASE_URL || settings.baseUrl,
      model: process.env.IMAGE_GEN_MODEL || settings.model,
      apiFormat: settings.apiFormat,
      timeoutSeconds: settings.timeoutSeconds,
      prompt,
      negativePrompt,
      width,
      height,
      references: selectedAssets.map((asset) => asset.filePath)
    });

    const datePrefix = new Date().toISOString().slice(0, 10);
    const fileName = `${datePrefix}_${slugify(title || scene.name)}_${width}x${height}_${pendingJob.id}.png`;
    const outputPath = path.join(OUTPUT_DIR, fileName);
    await writeFile(outputPath, imageBytes);

    const doneJob = updateJob(pendingJob.id, {
      status: "done",
      outputPath,
      completedAt: new Date().toISOString(),
      model: process.env.IMAGE_GEN_MODEL || settings.model
    });
    return { job: doneJob, imageUrl: buildImageUrl(outputPath) ?? undefined };
  } catch (error) {
    const failedJob = updateJob(pendingJob.id, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "未知错误",
      completedAt: new Date().toISOString()
    });
    return { job: failedJob };
  }
}

export function prepareGenerationRequest(body: GenerateRequestBody & { sceneId?: string; jobType?: JobType; title?: string | null }) {
  const scene = (body.sceneId ? getSceneById(body.sceneId) : null) ?? fallbackScene();
  const brief = body.brief ?? {};
  const sizes = body.sizes ?? [];
  const variantCount = Math.max(1, Math.min(5, body.variantCount ?? 1));
  const selectedAssetSlugs = collectAssetSlugs(scene, brief, body.selectedAssetSlugs ?? []);
  const selectedAssets = getAssetsBySlugs(selectedAssetSlugs);
  const promptResult = buildPrompt({
    scene,
    brief,
    selectedAssets
  });

  const finalPrompt = body.promptOverride?.trim() ? body.promptOverride : promptResult.prompt;
  const finalNegativePrompt = body.negativePromptOverride?.trim()
    ? body.negativePromptOverride
    : promptResult.negativePrompt;
  const settings = readSettings();
  const model = process.env.IMAGE_GEN_MODEL || settings.model;

  return {
    scene,
    brief,
    selectedAssets,
    finalPrompt,
    finalNegativePrompt,
    strategy: promptResult.strategy,
    sizes,
    variantCount,
    model,
    jobType: body.jobType ?? "generate",
    title: body.title ?? null
  } satisfies PreparedGenerationRequest;
}

export async function runPreparedGeneration(prepared: PreparedGenerationRequest) {
  const tasks = prepared.sizes.flatMap((size) =>
    Array.from({ length: prepared.variantCount }, () =>
      runSingleGeneration({
        scene: prepared.scene,
        brief: prepared.brief,
        selectedAssets: prepared.selectedAssets,
        width: size.width,
        height: size.height,
        prompt: prepared.finalPrompt,
        negativePrompt: prepared.finalNegativePrompt,
        model: prepared.model,
        jobType: prepared.jobType,
        title: prepared.title
      })
    )
  );

  const results = await Promise.all(tasks);
  return {
    prompt: prepared.finalPrompt,
    negativePrompt: prepared.finalNegativePrompt,
    strategy: prepared.strategy,
    results
  };
}
