"use client";

import Image from "next/image";
import { startTransition, useEffect, useMemo, useState } from "react";

import { BriefForm } from "@/components/generate/BriefForm";
import { CustomModeForm } from "@/components/generate/CustomModeForm";
import { GenerateButton } from "@/components/generate/GenerateButton";
import { PromptPreview } from "@/components/generate/PromptPreview";
import { SceneSelector } from "@/components/generate/SceneSelector";
import { SizeSelector } from "@/components/generate/SizeSelector";
import type { AssetRecord, GenerateResultItem, GenerateSize, JobRecord, SceneRecord } from "@/lib/types";
import { parseSizeToken, sizeToLabel } from "@/lib/utils";

function buildInitialBrief(scene: SceneRecord, assets: AssetRecord[]) {
  return scene.briefSchema.reduce<Record<string, unknown>>((accumulator, field) => {
    if (field.type === "asset-multi") {
      accumulator[field.name] = assets
        .filter((asset) => field.assetType && asset.type === field.assetType && scene.defaultAssets.includes(asset.slug))
        .map((asset) => asset.slug);
      return accumulator;
    }
    if (field.type === "asset-single") {
      accumulator[field.name] =
        assets.find((asset) => field.assetType && asset.type === field.assetType && scene.defaultAssets.includes(asset.slug))
          ?.slug ?? "";
      return accumulator;
    }
    accumulator[field.name] = field.defaultValue ?? "";
    return accumulator;
  }, {});
}

export function GenerateWorkbench({
  scenes,
  assets,
  initialJobId,
  embedded = false
}: {
  scenes: SceneRecord[];
  assets: AssetRecord[];
  initialJobId: string | null;
  embedded?: boolean;
}) {
  const [selectedSceneId, setSelectedSceneId] = useState(scenes[0].id);
  const customMode = selectedSceneId === "__custom__";
  const selectedScene = useMemo(() => scenes.find((scene) => scene.id === selectedSceneId) ?? scenes[0], [scenes, selectedSceneId]);
  const [brief, setBrief] = useState<Record<string, unknown>>(buildInitialBrief(selectedScene, assets));
  const [sizes, setSizes] = useState<GenerateSize[]>(selectedScene.defaultSizes.map(parseSizeToken));
  const [variantCount, setVariantCount] = useState(3);
  const [preview, setPreview] = useState({ prompt: "", negativePrompt: "", strategy: "" });
  const [promptOverride, setPromptOverride] = useState("");
  const [negativePromptOverride, setNegativePromptOverride] = useState("");
  const [customAssetSlugs, setCustomAssetSlugs] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<GenerateResultItem[]>([]);
  const [error, setError] = useState("");
  const [presetMessage, setPresetMessage] = useState("");

  function handleSceneChange(nextSceneId: string) {
    if (nextSceneId === "__custom__") {
      setSelectedSceneId(nextSceneId);
      setBrief({});
      setSizes([{ width: 1536, height: 1024 }]);
      setVariantCount(1);
      setPreview({ prompt: "", negativePrompt: "", strategy: "" });
      setPromptOverride("");
      setNegativePromptOverride("");
      setCustomAssetSlugs([]);
      setResults([]);
      setError("");
      setPresetMessage("");
      return;
    }

    const nextScene = scenes.find((scene) => scene.id === nextSceneId);
    if (!nextScene) {
      return;
    }
    setSelectedSceneId(nextSceneId);
    setBrief(buildInitialBrief(nextScene, assets));
    setSizes(nextScene.defaultSizes.map(parseSizeToken));
    setPreview({ prompt: "", negativePrompt: "", strategy: "" });
    setPromptOverride("");
    setNegativePromptOverride("");
    setCustomAssetSlugs([]);
    setResults([]);
    setError("");
    setPresetMessage("");
  }

  function getPayload() {
    return {
      sceneId: customMode ? undefined : selectedScene.id,
      brief,
      selectedAssetSlugs: customMode ? customAssetSlugs : undefined,
      sizes,
      variantCount,
      promptOverride,
      negativePromptOverride
    };
  }

  useEffect(() => {
    if (!initialJobId) {
      return;
    }

    let cancelled = false;

    async function hydrateFromJob() {
      const jobId = initialJobId;
      if (!jobId) {
        return;
      }
      const response = await fetch(`/api/jobs?id=${encodeURIComponent(jobId)}`);
      const json = (await response.json()) as { job?: JobRecord; error?: string };
      if (!response.ok || !json.job || cancelled) {
        if (!cancelled) {
          setError(json.error ?? "回填历史任务失败");
        }
        return;
      }

      const sourceJob = json.job;
      const nextScene = (sourceJob.sceneId ? scenes.find((scene) => scene.id === sourceJob.sceneId) : null) ?? scenes[0];
      setSelectedSceneId(nextScene.id);
      setBrief(sourceJob.briefInput);
      setSizes(
        sourceJob.width && sourceJob.height ? [{ width: sourceJob.width, height: sourceJob.height }] : nextScene.defaultSizes.map(parseSizeToken)
      );
      setVariantCount(1);
      setPreview({
        prompt: sourceJob.generatedPrompt ?? "",
        negativePrompt: sourceJob.negativePrompt ?? "",
        strategy: `from-job=${sourceJob.id}`
      });
      setPromptOverride(sourceJob.generatedPrompt ?? "");
      setNegativePromptOverride(sourceJob.negativePrompt ?? "");
      setPresetMessage("已从图库回填这次生成记录，你可以直接改 brief 或 prompt 再重新生成。");
      setResults([]);
      setError("");
    }

    void hydrateFromJob();

    return () => {
      cancelled = true;
    };
  }, [initialJobId, scenes]);

  async function refreshPreview() {
    setError("");
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...getPayload(), previewOnly: true })
    });
    const json = (await response.json()) as { prompt?: string; negativePrompt?: string; strategy?: string; error?: string };
    if (!response.ok) {
      throw new Error(json.error ?? "预览失败");
    }
    setPreview({
      prompt: json.prompt ?? "",
      negativePrompt: json.negativePrompt ?? "",
      strategy: json.strategy ?? ""
    });
  }

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getPayload())
      });
      const json = (await response.json()) as {
        results?: GenerateResultItem[];
        prompt?: string;
        negativePrompt?: string;
        strategy?: string;
        error?: string;
      };
      if (!response.ok) {
        setPreview({
          prompt: json.prompt ?? preview.prompt,
          negativePrompt: json.negativePrompt ?? preview.negativePrompt,
          strategy: json.strategy ?? preview.strategy
        });
        throw new Error(json.error ?? "生成失败");
      }
      setPreview({
        prompt: json.prompt ?? "",
        negativePrompt: json.negativePrompt ?? "",
        strategy: json.strategy ?? ""
      });
      setResults(json.results ?? []);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "生成失败");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      {!embedded ? (
        <header className="panel rounded-[34px] px-8 py-7 shadow-soft">
          <div className="max-w-4xl">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">Banner Image Production System</div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">只选主题和风格，把稳定出图交给系统</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)]">
              这一版先打通「选模板 → 填 brief → 系统拼 prompt → 生成 → 图库留痕」的主链路。默认不要求运营改 prompt，必要时再进高级模式。
            </p>
          </div>
        </header>
      ) : null}

      <SceneSelector scenes={scenes} selectedSceneId={selectedSceneId} onSelect={handleSceneChange} />
      {customMode ? (
        <CustomModeForm
          assets={assets}
          prompt={promptOverride}
          negativePrompt={negativePromptOverride}
          selectedAssetSlugs={customAssetSlugs}
          onPromptChange={setPromptOverride}
          onNegativePromptChange={setNegativePromptOverride}
          onSelectedAssetSlugsChange={setCustomAssetSlugs}
        />
      ) : (
        <BriefForm
          fields={selectedScene.briefSchema}
          assets={assets}
          value={brief}
          onChange={(name, nextValue) => setBrief((current) => ({ ...current, [name]: nextValue }))}
        />
      )}
      <SizeSelector
        sizes={sizes}
        onChange={setSizes}
        variantCount={variantCount}
        onVariantCountChange={setVariantCount}
      />
      <PromptPreview
        prompt={preview.prompt}
        negativePrompt={preview.negativePrompt}
        strategy={preview.strategy}
        loading={generating}
        onRefresh={() => {
          startTransition(() => {
            refreshPreview().catch((previewError) => {
              setError(previewError instanceof Error ? previewError.message : "Prompt 预览失败");
            });
          });
        }}
        promptOverride={promptOverride}
        onPromptOverrideChange={setPromptOverride}
        negativePromptOverride={negativePromptOverride}
        onNegativePromptOverrideChange={setNegativePromptOverride}
        customMode={customMode}
      />

      <div className="flex items-center justify-between gap-4 rounded-[28px] border border-black/8 bg-white/75 px-6 py-5">
        <div className="text-sm text-[var(--muted)]">
          当前将生成 {variantCount} 个变体，共 {variantCount * sizes.length} 张图，尺寸包括{" "}
          {sizes.map((size) => sizeToLabel(size.width, size.height)).join("、")}
        </div>
        <GenerateButton loading={generating} onClick={() => startTransition(() => void handleGenerate())} />
      </div>

      {error ? (
        <div className="rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>
      ) : null}

      {presetMessage ? (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          {presetMessage}
        </div>
      ) : null}

      <section className="panel rounded-[30px] p-6 shadow-soft">
        <div className="mb-5">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Results</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">生成结果</h2>
        </div>

        {results.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-black/12 bg-white/65 px-6 py-10 text-center text-sm text-[var(--muted)]">
            还没有结果。先刷新 prompt 看看，再开始生成。
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {results.map((item) => (
              <article key={item.job.id} className="overflow-hidden rounded-[24px] border border-black/8 bg-white/78">
                <div className="relative aspect-[4/3] bg-[#ece7de]">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.job.id} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">生成失败或暂无图片</div>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-ink">{item.job.status === "done" ? "已完成" : "失败"}</div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      {sizeToLabel(item.job.width ?? 0, item.job.height ?? 0)}
                    </div>
                  </div>
                  <div className="text-sm leading-6 text-[var(--muted)]">
                    {item.job.errorMessage ?? (preview.prompt.slice(0, 84) || "本次任务已写入图库记录。")}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
