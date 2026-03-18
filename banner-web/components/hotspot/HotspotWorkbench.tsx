"use client";

import { startTransition, useState } from "react";

import { BannerPreview } from "@/components/hotspot/BannerPreview";
import { CopyVariantDisplay } from "@/components/hotspot/CopyVariantDisplay";
import { TopicInput } from "@/components/hotspot/TopicInput";
import type { AssetRecord, HotspotGenerateRequestBody, HotspotVariant } from "@/lib/types";

type AssetView = AssetRecord & { imageUrl?: string | null };

const initialForm: HotspotGenerateRequestBody = {
  topic: "",
  stance: "warm",
  channel: "xiaohongshu",
  brief: "",
  selectedAssetSlugs: [],
  variantCount: 3
};

export function HotspotWorkbench({ assets }: { assets: AssetView[] }) {
  const [form, setForm] = useState<HotspotGenerateRequestBody>(initialForm);
  const [variants, setVariants] = useState<HotspotVariant[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/hotspot/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const json = (await response.json()) as { variants?: HotspotVariant[]; note?: string; error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "热点草稿生成失败");
      }
      setVariants(json.variants ?? []);
      setMessage(json.note ?? "已生成热点草稿。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "热点草稿生成失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(text: string, successMessage: string) {
    if (!text.trim()) {
      setMessage("当前没有可复制内容。");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setMessage(successMessage);
    } catch {
      setMessage("复制失败，请手动复制。");
    }
  }

  return (
    <div className="space-y-6">
      <header className="panel rounded-[34px] px-8 py-7 shadow-soft">
        <div className="max-w-4xl">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">Hotspot Draft Lab</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">先把热点响应的文案和视觉方向骨架搭起来</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)]">
            这是 Phase 1.5 的骨架版。先把热点输入、文案版本、视觉 prompt 输出链路跑通，等 `hotspot.md`
            到位后再替换成正式 builder 和真实模型并行调用。
          </p>
        </div>
      </header>

      <TopicInput value={form} assets={assets} onChange={(patch) => setForm((current) => ({ ...current, ...patch }))} />

      <section className="rounded-[28px] border border-black/8 bg-white/80 px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-[var(--muted)]">
            当前已选素材：{form.selectedAssetSlugs?.length ? form.selectedAssetSlugs.join(" / ") : "未选择"}。下一阶段会补独立素材选择器和真实并行配图。
          </div>
          <button
            type="button"
            className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-white disabled:opacity-60"
            disabled={loading}
            onClick={() => startTransition(() => void handleGenerate())}
          >
            {loading ? "生成中..." : "生成热点方案"}
          </button>
        </div>
      </section>

      {message ? <div className="rounded-[24px] border border-black/8 bg-white/80 px-5 py-4 text-sm text-ink">{message}</div> : null}

      <CopyVariantDisplay variants={variants} onCopy={handleCopy} />
      <BannerPreview variants={variants} assets={assets} />
    </div>
  );
}
