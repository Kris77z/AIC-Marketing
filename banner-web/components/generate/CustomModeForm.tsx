"use client";

import type { AssetRecord } from "@/lib/types";

export function CustomModeForm({
  assets,
  prompt,
  negativePrompt,
  selectedAssetSlugs,
  onPromptChange,
  onNegativePromptChange,
  onSelectedAssetSlugsChange
}: {
  assets: AssetRecord[];
  prompt: string;
  negativePrompt: string;
  selectedAssetSlugs: string[];
  onPromptChange: (value: string) => void;
  onNegativePromptChange: (value: string) => void;
  onSelectedAssetSlugsChange: (slugs: string[]) => void;
}) {
  const groupedAssets = {
    mascot: assets.filter((asset) => asset.type === "mascot"),
    logo: assets.filter((asset) => asset.type === "logo"),
    "style-ref": assets.filter((asset) => asset.type === "style-ref")
  };

  return (
    <section className="panel rounded-[30px] p-6 shadow-soft">
      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Step 2</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">自定义 Prompt</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          不走模板规则，直接写 prompt。仍然可以带上 logo、吉祥物或风格参考图作为辅助素材。
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <label className="block space-y-2">
            <div className="text-sm font-medium text-ink">Prompt</div>
            <textarea
              className="min-h-40 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 text-sm leading-7 text-ink outline-none"
              value={prompt}
              onChange={(event) => onPromptChange(event.target.value)}
              placeholder="直接描述你要的画面，例如：春日活动横版 KV，左侧留白，奶油暖色，品牌商业插画质感。"
            />
          </label>

          <label className="block space-y-2">
            <div className="text-sm font-medium text-ink">Negative Prompt</div>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 text-sm leading-7 text-ink outline-none"
              value={negativePrompt}
              onChange={(event) => onNegativePromptChange(event.target.value)}
              placeholder="可选：补充要避免的内容，例如：避免文字、水印、低幼感。"
            />
          </label>
        </div>

        <div className="space-y-4 rounded-[24px] border border-black/8 bg-white/75 p-4">
          <div>
            <div className="text-sm font-medium text-ink">可选参考素材</div>
            <div className="mt-2 text-xs leading-6 text-[var(--muted)]">勾选后会把素材图一并作为 reference 发给模型。</div>
          </div>

          {(["mascot", "logo", "style-ref"] as const).map((type) => (
            <div key={type} className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{type}</div>
              <div className="space-y-2">
                {groupedAssets[type].map((asset) => {
                  const checked = selectedAssetSlugs.includes(asset.slug);
                  return (
                    <label
                      key={asset.id}
                      className="flex items-center justify-between rounded-2xl border border-black/6 bg-white/80 px-3 py-2 text-sm"
                    >
                      <div>
                        <div className="font-medium text-ink">{asset.name}</div>
                        <div className="text-xs text-[var(--muted)]">{asset.slug}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          const next = event.target.checked
                            ? [...selectedAssetSlugs, asset.slug]
                            : selectedAssetSlugs.filter((slug) => slug !== asset.slug);
                          onSelectedAssetSlugsChange(next);
                        }}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
