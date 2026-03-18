import { ProductionWorkbench } from "@/components/production/ProductionWorkbench";
import { listAssets, listScenes } from "@/lib/db";
import { buildImageUrl } from "@/lib/image-routes";

export default async function GeneratePage({
  searchParams
}: {
  searchParams: Promise<{ fromJob?: string; workflow?: string }>;
}) {
  const scenes = listScenes();
  const assets = listAssets().map((asset) => ({
    ...asset,
    imageUrl: buildImageUrl(asset.filePath)
  }));
  const resolvedSearchParams = await searchParams;
  const initialMode = resolvedSearchParams.workflow === "design" ? "design" : "ai";

  if (scenes.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-black/12 bg-white/72 px-6 py-12 text-center text-sm text-[var(--muted)]">
        当前还没有场景模板数据。先检查数据库初始化是否成功。
      </div>
    );
  }

  return <ProductionWorkbench scenes={scenes} assets={assets} initialJobId={resolvedSearchParams.fromJob ?? null} initialMode={initialMode} />;
}
