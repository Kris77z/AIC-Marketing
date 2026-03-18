"use client";

import Image from "next/image";

import type { GenerateSize } from "@/lib/types";

export function PreviewCanvas({
  svgDataUrl,
  size,
  onSizeChange,
  availableSizes
}: {
  svgDataUrl: string;
  size: GenerateSize;
  onSizeChange: (size: GenerateSize) => void;
  availableSizes: GenerateSize[];
}) {
  return (
    <section className="panel rounded-[30px] p-6 shadow-soft">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Step 3</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">实时预览</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">先在浏览器里看版式、颜色和图像位置，再一键导出 PNG。</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {availableSizes.map((item) => {
            const active = item.width === size.width && item.height === size.height;
            return (
              <button
                key={`${item.width}x${item.height}`}
                type="button"
                className={`rounded-full px-4 py-2 text-sm ${
                  active ? "bg-ink text-white" : "border border-black/10 bg-white/80 text-ink"
                }`}
                onClick={() => onSizeChange(item)}
              >
                {item.width}×{item.height}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[28px] border border-black/8 bg-[#e8dfd2] p-4">
        <div className="relative mx-auto aspect-[3/2] w-full max-w-[980px] overflow-hidden rounded-[24px] border border-black/10 bg-white shadow-soft">
          <Image src={svgDataUrl} alt="Design preview" fill className="object-contain" unoptimized />
        </div>
      </div>
    </section>
  );
}
