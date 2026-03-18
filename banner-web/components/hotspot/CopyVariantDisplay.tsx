"use client";

import type { HotspotVariant } from "@/lib/types";

export function CopyVariantDisplay({
  variants,
  onCopy
}: {
  variants: HotspotVariant[];
  onCopy: (text: string, message: string) => void;
}) {
  return (
    <section className="panel rounded-[30px] p-6 shadow-soft">
      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Step 2</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">文案版本</h2>
      </div>

      {variants.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-black/12 bg-white/65 px-6 py-10 text-center text-sm text-[var(--muted)]">
          还没有版本。先输入热点信息再点击生成。
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          {variants.map((variant) => (
            <article key={variant.id} className="rounded-[24px] border border-black/8 bg-white/80 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">{variant.angleTitle}</div>
              <div className="mt-3 text-lg font-semibold text-ink">{variant.hook}</div>
              <div className="mt-4 text-sm leading-7 text-[var(--muted)]">{variant.copy}</div>
              <div className="mt-4 rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-sm text-ink">CTA：{variant.cta}</div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs text-ink"
                  onClick={() => onCopy(variant.copy, `${variant.angleTitle} 文案已复制。`)}
                >
                  复制文案
                </button>
                <button
                  type="button"
                  className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs text-ink"
                  onClick={() => onCopy(variant.bannerPrompt, `${variant.angleTitle} 配图 prompt 已复制。`)}
                >
                  复制配图 Prompt
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
