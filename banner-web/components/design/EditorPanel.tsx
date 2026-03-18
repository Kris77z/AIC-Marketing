"use client";

import type { DesignTemplateContent } from "@/lib/design-templates";
import type { AssetRecord, GenerateSize } from "@/lib/types";

function assetOptions(assets: AssetRecord[], type: AssetRecord["type"]) {
  return assets.filter((asset) => asset.type === type);
}

export function EditorPanel({
  content,
  assets,
  sizes,
  customSize,
  onContentChange,
  onSizesChange,
  onCustomSizeChange,
  exporting,
  onExport
}: {
  content: DesignTemplateContent;
  assets: Array<AssetRecord & { imageUrl?: string | null }>;
  sizes: GenerateSize[];
  customSize: { width: string; height: string };
  onContentChange: (patch: Partial<DesignTemplateContent>) => void;
  onSizesChange: (sizes: GenerateSize[]) => void;
  onCustomSizeChange: (patch: Partial<{ width: string; height: string }>) => void;
  exporting: boolean;
  onExport: () => void;
}) {
  const presetSizes: GenerateSize[] = [
    { width: 1536, height: 1024 },
    { width: 750, height: 750 },
    { width: 1080, height: 1920 }
  ];

  function toggleSize(size: GenerateSize) {
    const exists = sizes.some((item) => item.width === size.width && item.height === size.height);
    onSizesChange(
      exists ? sizes.filter((item) => item.width !== size.width || item.height !== size.height) : [...sizes, size]
    );
  }

  function addCustomSize() {
    const width = Number(customSize.width);
    const height = Number(customSize.height);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      return;
    }
    const exists = sizes.some((item) => item.width === width && item.height === height);
    if (!exists) {
      onSizesChange([...sizes, { width, height }]);
    }
  }

  return (
    <section className="panel rounded-[30px] p-6 shadow-soft">
      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Step 2</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">填写内容</h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2 lg:col-span-2">
          <div className="text-sm font-medium text-ink">标题</div>
          <input
            className="w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 text-sm"
            value={content.title}
            onChange={(event) => onContentChange({ title: event.target.value })}
          />
        </label>

        <label className="space-y-2">
          <div className="text-sm font-medium text-ink">Eyebrow</div>
          <input
            className="w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 text-sm"
            value={content.eyebrow}
            onChange={(event) => onContentChange({ eyebrow: event.target.value })}
          />
        </label>

        <label className="space-y-2">
          <div className="text-sm font-medium text-ink">CTA</div>
          <input
            className="w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 text-sm"
            value={content.cta}
            onChange={(event) => onContentChange({ cta: event.target.value })}
          />
        </label>

        <label className="space-y-2 lg:col-span-2">
          <div className="text-sm font-medium text-ink">副标题</div>
          <textarea
            className="min-h-28 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 text-sm"
            value={content.subtitle}
            onChange={(event) => onContentChange({ subtitle: event.target.value })}
          />
        </label>

        <label className="space-y-2">
          <div className="text-sm font-medium text-ink">背景色</div>
          <input
            className="h-12 w-full rounded-2xl border border-black/8 bg-white/80 px-3 py-2"
            type="color"
            value={content.backgroundColor}
            onChange={(event) => onContentChange({ backgroundColor: event.target.value })}
          />
        </label>

        <label className="space-y-2">
          <div className="text-sm font-medium text-ink">强调色</div>
          <input
            className="h-12 w-full rounded-2xl border border-black/8 bg-white/80 px-3 py-2"
            type="color"
            value={content.accentColor}
            onChange={(event) => onContentChange({ accentColor: event.target.value })}
          />
        </label>

        <label className="space-y-2">
          <div className="text-sm font-medium text-ink">文字色</div>
          <input
            className="h-12 w-full rounded-2xl border border-black/8 bg-white/80 px-3 py-2"
            type="color"
            value={content.textColor}
            onChange={(event) => onContentChange({ textColor: event.target.value })}
          />
        </label>

        <label className="space-y-2">
          <div className="text-sm font-medium text-ink">背景图</div>
          <select
            className="w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 text-sm"
            value={content.backgroundImageSlug}
            onChange={(event) => onContentChange({ backgroundImageSlug: event.target.value })}
          >
            <option value="">不使用</option>
            {assetOptions(assets, "style-ref").map((asset) => (
              <option key={asset.id} value={asset.slug}>
                {asset.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <div className="text-sm font-medium text-ink">主图 / 吉祥物</div>
          <select
            className="w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 text-sm"
            value={content.heroImageSlug}
            onChange={(event) => onContentChange({ heroImageSlug: event.target.value })}
          >
            <option value="">不使用</option>
            {assets.filter((asset) => asset.type === "mascot" || asset.type === "style-ref").map((asset) => (
              <option key={asset.id} value={asset.slug}>
                {asset.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <div className="text-sm font-medium text-ink">Logo</div>
          <select
            className="w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 text-sm"
            value={content.logoSlug}
            onChange={(event) => onContentChange({ logoSlug: event.target.value })}
          >
            <option value="">不使用</option>
            {assetOptions(assets, "logo").map((asset) => (
              <option key={asset.id} value={asset.slug}>
                {asset.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 rounded-[24px] border border-black/8 bg-white/75 p-4">
        <div className="text-sm font-medium text-ink">导出尺寸</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {presetSizes.map((size) => {
            const active = sizes.some((item) => item.width === size.width && item.height === size.height);
            return (
              <button
                key={`${size.width}x${size.height}`}
                type="button"
                className={`rounded-full px-4 py-2 text-sm ${
                  active ? "bg-ink text-white" : "border border-black/10 bg-white/80 text-ink"
                }`}
                onClick={() => toggleSize(size)}
              >
                {size.width}×{size.height}
              </button>
            );
          })}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input
            className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
            placeholder="自定义宽度"
            value={customSize.width}
            onChange={(event) => onCustomSizeChange({ width: event.target.value })}
          />
          <input
            className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
            placeholder="自定义高度"
            value={customSize.height}
            onChange={(event) => onCustomSizeChange({ height: event.target.value })}
          />
          <button
            type="button"
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink"
            onClick={addCustomSize}
          >
            添加尺寸
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="text-sm text-[var(--muted)]">会直接导出 PNG，并同步把记录写入图库。</div>
        <button
          type="button"
          disabled={exporting || sizes.length === 0}
          className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-white disabled:opacity-60"
          onClick={onExport}
        >
          {exporting ? "导出中..." : "导出 PNG"}
        </button>
      </div>
    </section>
  );
}
