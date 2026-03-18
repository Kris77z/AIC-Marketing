"use client";

import Image from "next/image";
import { startTransition, useEffect, useMemo, useState } from "react";

import { AssetCard } from "@/components/assets/AssetCard";
import type { AssetRecord, AssetType, LockMode } from "@/lib/types";
import { slugify } from "@/lib/utils";

type AssetView = AssetRecord & { imageUrl?: string | null };

interface AssetDraft {
  type: AssetType;
  name: string;
  slug: string;
  lockMode: LockMode;
  constraintsText: string;
  tagsText: string;
  brandColor: string;
}

const emptyDraft: AssetDraft = {
  type: "mascot",
  name: "",
  slug: "",
  lockMode: "strong",
  constraintsText: "",
  tagsText: "",
  brandColor: ""
};

const typeLabels: Record<AssetType, string> = {
  mascot: "吉祥物",
  logo: "Logo",
  "style-ref": "风格参考"
};

function toDraft(asset?: AssetRecord): AssetDraft {
  if (!asset) {
    return emptyDraft;
  }
  return {
    type: asset.type,
    name: asset.name,
    slug: asset.slug,
    lockMode: asset.lockMode ?? "strong",
    constraintsText: asset.constraints.join("\n"),
    tagsText: asset.tags.join(", "),
    brandColor: asset.brandColor ?? ""
  };
}

export function AssetManager({ initialAssets }: { initialAssets: AssetView[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AssetDraft>(emptyDraft);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [typeFilter, setTypeFilter] = useState<AssetType | "all">("all");
  const [keyword, setKeyword] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl(nextUrl);
    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [file]);

  const filteredAssets = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return assets.filter((asset) => {
      if (typeFilter !== "all" && asset.type !== typeFilter) {
        return false;
      }
      if (!normalizedKeyword) {
        return true;
      }
      return [asset.name, asset.slug, asset.tags.join(" "), asset.constraints.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(normalizedKeyword);
    });
  }, [assets, keyword, typeFilter]);

  const groupedAssets = useMemo(
    () => ({
      mascot: filteredAssets.filter((asset) => asset.type === "mascot"),
      logo: filteredAssets.filter((asset) => asset.type === "logo"),
      "style-ref": filteredAssets.filter((asset) => asset.type === "style-ref")
    }),
    [filteredAssets]
  );

  const editingAsset = assets.find((asset) => asset.id === editingId) ?? null;

  function resetForm(nextAsset?: AssetRecord) {
    setEditingId(nextAsset?.id ?? null);
    setDraft(toDraft(nextAsset));
    setFile(null);
    setFileInputKey((current) => current + 1);
  }

  async function handleSubmit() {
    setMessage("");
    try {
      if (!draft.name.trim()) {
        throw new Error("请先填写素材名称。");
      }
      if (!editingId && !file) {
        throw new Error("新素材需要上传图片文件。");
      }

      const formData = new FormData();
      if (editingId) {
        formData.set("id", editingId);
      }
      formData.set("type", draft.type);
      formData.set("name", draft.name.trim());
      formData.set("slug", slugify(draft.slug || draft.name));
      formData.set("lockMode", draft.lockMode);
      formData.set("constraints", draft.constraintsText);
      formData.set("tags", draft.tagsText);
      formData.set("brandColor", draft.brandColor);
      if (file) {
        formData.set("file", file);
      }

      const response = await fetch("/api/assets", {
        method: editingId ? "PATCH" : "POST",
        body: formData
      });
      const json = (await response.json()) as { asset?: AssetView; error?: string };
      if (!response.ok || !json.asset) {
        throw new Error(json.error ?? "素材保存失败");
      }

      setAssets((current) => {
        const filtered = current.filter((asset) => asset.id !== json.asset?.id);
        return [json.asset!, ...filtered].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
      });
      resetForm();
      setMessage(editingId ? "素材已更新。" : "素材已上传进素材库。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "素材保存失败");
    }
  }

  async function handleDelete(asset: AssetRecord) {
    if (!window.confirm(`确认删除素材「${asset.name}」吗？`)) {
      return;
    }
    setMessage("");
    try {
      const response = await fetch("/api/assets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: asset.id })
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "删除失败");
      }
      setAssets((current) => current.filter((item) => item.id !== asset.id));
      if (editingId === asset.id) {
        resetForm();
      }
      setMessage("素材已删除。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除失败");
    }
  }

  async function handleCopySlug(asset: AssetRecord) {
    try {
      await navigator.clipboard.writeText(asset.slug);
      setMessage(`已复制 slug：${asset.slug}`);
    } catch {
      setMessage("复制失败，请手动复制 slug。");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="panel rounded-[30px] p-6 shadow-soft">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                Asset Editor
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                {editingId ? "编辑素材" : "上传新素材"}
              </h2>
            </div>
            {editingId ? (
              <button
                type="button"
                className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm"
                onClick={() => resetForm()}
              >
                新建一条
              </button>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-[24px] border border-black/8 bg-[#ebe4d9]">
              <div className="relative aspect-[4/3]">
                {previewUrl ? (
                  <Image src={previewUrl} alt="upload preview" fill className="object-contain p-4" unoptimized />
                ) : editingAsset?.imageUrl ? (
                  <Image src={editingAsset.imageUrl} alt={editingAsset.name} fill className="object-contain p-4" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
                    上传后会在这里预览素材
                  </div>
                )}
              </div>
            </div>

            <label className="block space-y-2">
              <div className="text-sm font-medium text-ink">素材类型</div>
              <select
                className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
                value={draft.type}
                onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as AssetType }))}
              >
                <option value="mascot">吉祥物</option>
                <option value="logo">Logo</option>
                <option value="style-ref">风格参考</option>
              </select>
            </label>

            <label className="block space-y-2">
              <div className="text-sm font-medium text-ink">名称</div>
              <input
                className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                    slug: current.slug ? current.slug : slugify(event.target.value)
                  }))
                }
                placeholder="例如：nano-banana"
              />
            </label>

            <label className="block space-y-2">
              <div className="text-sm font-medium text-ink">slug</div>
              <input
                className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
                value={draft.slug}
                onChange={(event) => setDraft((current) => ({ ...current, slug: slugify(event.target.value) }))}
                placeholder="自动生成，也可手动改"
              />
            </label>

            {draft.type === "mascot" ? (
              <label className="block space-y-2">
                <div className="text-sm font-medium text-ink">锁定模式</div>
                <select
                  className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
                  value={draft.lockMode}
                  onChange={(event) => setDraft((current) => ({ ...current, lockMode: event.target.value as LockMode }))}
                >
                  <option value="strong">强锁定</option>
                  <option value="loose">宽松</option>
                </select>
              </label>
            ) : null}

            {draft.type === "logo" ? (
              <label className="block space-y-2">
                <div className="text-sm font-medium text-ink">品牌色</div>
                <input
                  className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
                  value={draft.brandColor}
                  onChange={(event) => setDraft((current) => ({ ...current, brandColor: event.target.value }))}
                  placeholder="#FF6600"
                />
              </label>
            ) : null}

            <label className="block space-y-2">
              <div className="text-sm font-medium text-ink">约束 / 使用限制</div>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
                value={draft.constraintsText}
                onChange={(event) => setDraft((current) => ({ ...current, constraintsText: event.target.value }))}
                placeholder="一行一条，例如：保持原本轮廓与配色"
              />
            </label>

            <label className="block space-y-2">
              <div className="text-sm font-medium text-ink">标签</div>
              <input
                className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
                value={draft.tagsText}
                onChange={(event) => setDraft((current) => ({ ...current, tagsText: event.target.value }))}
                placeholder="用逗号分隔，例如：品牌, 联名"
              />
            </label>

            <label className="block space-y-2">
              <div className="text-sm font-medium text-ink">{editingId ? "替换图片（可选）" : "上传图片"}</div>
              <input
                key={fileInputKey}
                className="block w-full text-sm text-[var(--muted)]"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <div className="text-xs text-[var(--muted)]">支持 PNG / JPG / WebP，最大 5MB。</div>
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white"
                onClick={() => startTransition(() => void handleSubmit())}
              >
                {editingId ? "保存修改" : "上传素材"}
              </button>
              <button
                type="button"
                className="rounded-full border border-black/10 bg-white/80 px-5 py-3 text-sm"
                onClick={() => resetForm()}
              >
                清空
              </button>
            </div>

            {message ? <div className="rounded-[20px] bg-white/70 px-4 py-3 text-sm text-ink">{message}</div> : null}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[26px] border border-black/8 bg-white/80 p-5">
            <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
              <label className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">类型筛选</div>
                <select
                  className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value as AssetType | "all")}
                >
                  <option value="all">全部</option>
                  <option value="mascot">吉祥物</option>
                  <option value="logo">Logo</option>
                  <option value="style-ref">风格参考</option>
                </select>
              </label>

              <label className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">搜索</div>
                <input
                  className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索名称、slug、标签或约束"
                />
              </label>
            </div>
            <div className="mt-3 text-xs text-[var(--muted)]">当前命中 {filteredAssets.length} 个素材</div>
          </section>

          {(Object.keys(groupedAssets) as AssetType[]).map((type) => (
            <section key={type} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                    {typeLabels[type]}
                  </div>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                    {groupedAssets[type].length} 个已注册素材
                  </h3>
                </div>
              </div>

              {groupedAssets[type].length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-black/12 bg-white/70 px-4 py-8 text-center text-sm text-[var(--muted)]">
                  当前筛选条件下没有 {typeLabels[type]}。
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {groupedAssets[type].map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      imageUrl={asset.imageUrl}
                      onEdit={(nextAsset) => resetForm(nextAsset)}
                      onDelete={(nextAsset) => void handleDelete(nextAsset)}
                      onCopySlug={(nextAsset) => void handleCopySlug(nextAsset)}
                    />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
