"use client";

import Image from "next/image";

import type { AssetRecord } from "@/lib/types";

export function AssetCard({
  asset,
  imageUrl,
  onEdit,
  onDelete,
  onCopySlug
}: {
  asset: AssetRecord;
  imageUrl?: string | null;
  onEdit?: (asset: AssetRecord) => void;
  onDelete?: (asset: AssetRecord) => void;
  onCopySlug?: (asset: AssetRecord) => void;
}) {
  return (
    <article className="overflow-hidden rounded-[26px] border border-black/8 bg-white/80 shadow-soft">
      <div className="relative aspect-[4/3] bg-[#ebe4d9]">
        {imageUrl ? <Image src={imageUrl} alt={asset.name} fill className="object-contain p-4" /> : null}
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-ink">{asset.name}</div>
            <div className="text-sm text-[var(--muted)]">{asset.slug}</div>
          </div>
          <div className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-ink">{asset.type}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {asset.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-black/5 px-3 py-1 text-xs text-[var(--muted)]">
              {tag}
            </span>
          ))}
        </div>
        <div className="text-sm leading-6 text-[var(--muted)]">{asset.constraints.join(" / ")}</div>
        {onEdit || onDelete || onCopySlug ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {onCopySlug ? (
              <button
                type="button"
                className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs text-ink"
                onClick={() => onCopySlug(asset)}
              >
                复制 slug
              </button>
            ) : null}
            {onEdit ? (
              <button
                type="button"
                className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs text-ink"
                onClick={() => onEdit(asset)}
              >
                编辑
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                onClick={() => onDelete(asset)}
              >
                删除
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
