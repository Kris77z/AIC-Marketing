"use client";

import type { AssetRecord, HotspotVariant } from "@/lib/types";

export function BannerPreview({
  variants,
  assets
}: {
  variants: HotspotVariant[];
  assets: Array<AssetRecord & { imageUrl?: string | null }>;
}) {
  return (
    <section className="panel rounded-[30px] p-6 shadow-soft">
      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Step 3</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">视觉出稿方向</h2>
      </div>

      {variants.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-black/12 bg-white/65 px-6 py-10 text-center text-sm text-[var(--muted)]">
          生成后这里会显示每个版本的视觉方向、配图 prompt 和推荐素材。
        </div>
      ) : (
        <div className="space-y-4">
          {variants.map((variant) => (
            <article key={variant.id} className="rounded-[24px] border border-black/8 bg-white/80 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-lg font-semibold text-ink">{variant.angleTitle}</div>
                <div className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs text-ink">视觉占位版</div>
              </div>
              <div className="mt-3 text-sm leading-7 text-[var(--muted)]">{variant.visualDirection}</div>
              <div className="mt-4 rounded-[20px] border border-black/8 bg-[#111318] p-4 text-sm leading-7 text-white/86">
                {variant.bannerPrompt}
              </div>
              <div className="mt-4 text-sm text-[var(--muted)]">
                推荐素材：
                {variant.selectedAssetSlugs.length > 0
                  ? ` ${variant.selectedAssetSlugs
                      .map((slug) => assets.find((asset) => asset.slug === slug)?.name ?? slug)
                      .join(" / ")}`
                  : " 暂未选择"}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
