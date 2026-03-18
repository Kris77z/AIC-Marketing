import { useState } from "react";
import { Plus } from "lucide-react";

import type { GenerateSize } from "@/lib/types";
import { sizeToLabel } from "@/lib/utils";

const PRESET_SIZES: GenerateSize[] = [
  { width: 1536, height: 1024 },
  { width: 750, height: 750 },
  { width: 1080, height: 1920 },
  { width: 1920, height: 1080 }
];

function includesSize(sizes: GenerateSize[], target: GenerateSize) {
  return sizes.some((size) => size.width === target.width && size.height === target.height);
}

export function SizeSelector({
  sizes,
  onChange,
  variantCount,
  onVariantCountChange
}: {
  sizes: GenerateSize[];
  onChange: (sizes: GenerateSize[]) => void;
  variantCount: number;
  onVariantCountChange: (count: number) => void;
}) {
  const [customWidth, setCustomWidth] = useState("1200");
  const [customHeight, setCustomHeight] = useState("628");
  const estimatedSeconds = Math.max(18, sizes.length * variantCount * 22);

  return (
    <section className="panel rounded-[30px] p-6 shadow-soft">
      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Step 3</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">输出规格</h2>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="grid gap-3 md:grid-cols-2">
          {PRESET_SIZES.map((size) => {
            const active = includesSize(sizes, size);
            return (
              <button
                key={sizeToLabel(size.width, size.height)}
                type="button"
                onClick={() => {
                  const next = active
                    ? sizes.filter((item) => item.width !== size.width || item.height !== size.height)
                    : [...sizes, size];
                  onChange(next);
                }}
                className={`rounded-[22px] border p-4 text-left transition ${
                  active ? "border-transparent bg-ink text-white" : "border-black/8 bg-white/80 hover:border-black/18"
                }`}
              >
                <div className="text-base font-semibold">{sizeToLabel(size.width, size.height)}</div>
                <div className={`mt-2 text-sm ${active ? "text-white/72" : "text-[var(--muted)]"}`}>
                  {size.width >= size.height ? "横版 / 宽图" : "竖版 / 长图"}
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-4 rounded-[24px] border border-black/8 bg-white/75 p-4">
          <div>
            <div className="text-sm font-medium text-ink">生成变体</div>
            <div className="mt-3 flex gap-2">
              {[1, 3, 5].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => onVariantCountChange(count)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    variantCount === count
                      ? "bg-ink text-white"
                      : "bg-[var(--accent-soft)] text-ink hover:bg-black/10"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
            <div className="mt-3 text-xs text-[var(--muted)]">预估生成时间约 {estimatedSeconds}-{estimatedSeconds + 18} 秒</div>
          </div>

          <div className="border-t border-black/8 pt-4">
            <div className="text-sm font-medium text-ink">添加自定义尺寸</div>
            <div className="mt-3 flex gap-2">
              <input
                className="w-full rounded-2xl border border-black/8 bg-white px-3 py-2"
                value={customWidth}
                onChange={(event) => setCustomWidth(event.target.value)}
                placeholder="宽度"
              />
              <input
                className="w-full rounded-2xl border border-black/8 bg-white px-3 py-2"
                value={customHeight}
                onChange={(event) => setCustomHeight(event.target.value)}
                placeholder="高度"
              />
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl bg-ink px-4 py-2 text-white"
                onClick={() => {
                  const width = Number(customWidth);
                  const height = Number(customHeight);
                  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
                    return;
                  }
                  if (!includesSize(sizes, { width, height })) {
                    onChange([...sizes, { width, height }]);
                  }
                }}
              >
                <Plus className="h-4 w-4" />
                添加
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
