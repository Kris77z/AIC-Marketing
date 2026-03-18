import { SceneManager } from "@/components/scenes/SceneManager";
import { listAssets, listScenes } from "@/lib/db";

export default function ScenesPage() {
  const scenes = listScenes();
  const assets = listAssets();

  return (
    <div className="space-y-6">
      <header className="panel rounded-[34px] px-8 py-7 shadow-soft">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">Scenes</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">把模板定义、默认素材和 prompt 规则集中维护</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)]">
          现在支持查看、编辑、复制、新建和删除模板。Brief 字段定义先用 JSON 维护，后续再做可视化字段编辑器。
        </p>
      </header>
      <SceneManager initialScenes={scenes} assets={assets} />
    </div>
  );
}
