import { AssetManager } from "@/components/assets/AssetManager";
import { listAssets } from "@/lib/db";
import { buildImageUrl } from "@/lib/image-routes";

export default function AssetsPage() {
  const assets = listAssets().map((asset) => ({
    ...asset,
    imageUrl: buildImageUrl(asset.filePath)
  }));

  return (
    <div className="space-y-6">
      <header className="panel rounded-[34px] px-8 py-7 shadow-soft">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">Assets</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">把素材上传、整理和复用入口收回到一个页面里</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)]">
          现在支持上传新素材、编辑元数据、删除素材和复制 slug。工作台里的素材选择会直接复用这里的数据。
        </p>
      </header>
      <AssetManager initialAssets={assets} />
    </div>
  );
}
