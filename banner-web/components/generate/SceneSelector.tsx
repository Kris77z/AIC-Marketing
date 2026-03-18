import type { SceneRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

const sceneEmoji: Record<SceneRecord["sceneType"], string> = {
  festive: "🎊",
  collab: "🤝",
  product: "📦",
  "mascot-led": "🐼",
  generic: "✨"
};

export function SceneSelector({
  scenes,
  selectedSceneId,
  onSelect
}: {
  scenes: SceneRecord[];
  selectedSceneId: string;
  onSelect: (sceneId: string) => void;
}) {
  return (
    <section className="panel rounded-[30px] p-6 shadow-soft">
      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Step 1</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">选择场景模板</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <button
          type="button"
          onClick={() => onSelect("__custom__")}
          className={cn(
            "rounded-[24px] border p-5 text-left transition",
            selectedSceneId === "__custom__"
              ? "border-transparent bg-ink text-white shadow-soft"
              : "border-black/8 bg-white/70 hover:-translate-y-0.5 hover:border-black/15"
          )}
        >
          <div className="mb-4 text-3xl">🪄</div>
          <div className="text-base font-semibold">高级模式</div>
          <div className={cn("mt-2 text-sm", selectedSceneId === "__custom__" ? "text-white/72" : "text-[var(--muted)]")}>
            必要时再手动写 Prompt
          </div>
        </button>
        {scenes.map((scene) => {
          const active = scene.id === selectedSceneId;
          return (
            <button
              key={scene.id}
              type="button"
              onClick={() => onSelect(scene.id)}
              className={cn(
                "rounded-[24px] border p-5 text-left transition",
                active
                  ? "border-transparent bg-ink text-white shadow-soft"
                  : "border-black/8 bg-white/70 hover:-translate-y-0.5 hover:border-black/15"
              )}
            >
              <div className="mb-4 text-3xl">{sceneEmoji[scene.sceneType]}</div>
              <div className="text-base font-semibold">{scene.name}</div>
              <div className={cn("mt-2 text-sm", active ? "text-white/72" : "text-[var(--muted)]")}>
                {scene.sceneType}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
