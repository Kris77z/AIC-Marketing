"use client";

import { startTransition, useState } from "react";

import { SceneFieldEditor } from "@/components/scenes/SceneFieldEditor";
import type { AssetRecord, BriefField, SceneRecord, SceneType } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

interface SceneDraft {
  name: string;
  sceneType: SceneType;
  defaultAssetsText: string;
  defaultSizesText: string;
  promptOverridesText: string;
}

function toDraft(scene?: SceneRecord): SceneDraft {
  return {
    name: scene?.name ?? "",
    sceneType: scene?.sceneType ?? "generic",
    defaultAssetsText: (scene?.defaultAssets ?? []).join(", "),
    defaultSizesText: (scene?.defaultSizes ?? ["1536x1024"]).join(", "),
    promptOverridesText: (scene?.promptOverrides ?? []).join("\n")
  };
}

function splitTextList(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function SceneManager({
  initialScenes,
  assets
}: {
  initialScenes: SceneRecord[];
  assets: AssetRecord[];
}) {
  const [scenes, setScenes] = useState(initialScenes);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(initialScenes[0]?.id ?? null);
  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId) ?? null;
  const [draft, setDraft] = useState<SceneDraft>(() => toDraft(selectedScene ?? undefined));
  const [draftFields, setDraftFields] = useState<BriefField[]>(selectedScene?.briefSchema ?? []);
  const [message, setMessage] = useState("");

  function resetEditor(scene?: SceneRecord | null) {
    setSelectedSceneId(scene?.id ?? null);
    setDraft(toDraft(scene ?? undefined));
    setDraftFields(scene?.briefSchema ?? []);
  }

  async function submit(mode: "create" | "update" | "copy") {
    setMessage("");
    try {
      const body = {
        ...(mode !== "create" && selectedScene ? { sourceSceneId: selectedScene.id } : {}),
        ...(mode === "update" && selectedScene ? { id: selectedScene.id } : {}),
        name: draft.name.trim(),
        sceneType: draft.sceneType,
        briefSchema: draftFields,
        defaultAssets: splitTextList(draft.defaultAssetsText),
        defaultSizes: splitTextList(draft.defaultSizesText),
        promptOverrides: splitTextList(draft.promptOverridesText)
      };

      const response = await fetch("/api/scenes", {
        method: mode === "update" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const json = (await response.json()) as { scene?: SceneRecord; error?: string };
      if (!response.ok || !json.scene) {
        throw new Error(json.error ?? "场景保存失败");
      }

      setScenes((current) => {
        const withoutCurrent = current.filter((scene) => scene.id !== json.scene?.id);
        return [...withoutCurrent, json.scene!].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
      });
      resetEditor(json.scene);
      setMessage(mode === "update" ? "场景模板已保存。" : mode === "copy" ? "已复制出新的模板。" : "新模板已创建。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "场景保存失败");
    }
  }

  async function removeScene() {
    if (!selectedScene) {
      return;
    }
    if (!window.confirm(`确认删除场景模板「${selectedScene.name}」吗？`)) {
      return;
    }

    setMessage("");
    try {
      const response = await fetch("/api/scenes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedScene.id })
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "删除失败");
      }

      const nextScenes = scenes.filter((scene) => scene.id !== selectedScene.id);
      setScenes(nextScenes);
      resetEditor(nextScenes[0] ?? null);
      setMessage("场景模板已删除。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除失败");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
      <section className="space-y-4">
        {scenes.map((scene) => {
          const active = scene.id === selectedSceneId;
          return (
            <button
              key={scene.id}
              type="button"
              className={`w-full rounded-[26px] border p-5 text-left transition ${
                active ? "border-transparent bg-ink text-white shadow-soft" : "border-black/8 bg-white/80"
              }`}
              onClick={() => resetEditor(scene)}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">{scene.name}</div>
                  <div className={`mt-2 text-sm ${active ? "text-white/72" : "text-[var(--muted)]"}`}>
                    {scene.sceneType}
                  </div>
                </div>
                <div className={`text-xs ${active ? "text-white/60" : "text-[var(--muted)]"}`}>
                  {scene.defaultSizes.join(" / ")}
                </div>
              </div>
              <div className={`mt-4 text-sm leading-6 ${active ? "text-white/72" : "text-[var(--muted)]"}`}>
                字段 {scene.briefSchema.length} 个 · 默认素材 {scene.defaultAssets.length} 个 · 最近更新{" "}
                {formatDateTime(scene.updatedAt)}
              </div>
            </button>
          );
        })}
      </section>

      <section className="panel rounded-[30px] p-6 shadow-soft">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Scene Editor</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              {selectedScene ? `编辑模板：${selectedScene.name}` : "新建模板"}
            </h2>
          </div>
          <button
            type="button"
            className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm"
            onClick={() => resetEditor(null)}
          >
            新建空模板
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <div className="text-sm font-medium text-ink">模板名称</div>
            <input
              className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="例如：春日活动 KV"
            />
          </label>

          <label className="space-y-2">
            <div className="text-sm font-medium text-ink">场景类型</div>
            <select
              className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
              value={draft.sceneType}
              onChange={(event) => setDraft((current) => ({ ...current, sceneType: event.target.value as SceneType }))}
            >
              <option value="festive">festive</option>
              <option value="collab">collab</option>
              <option value="product">product</option>
              <option value="mascot-led">mascot-led</option>
              <option value="generic">generic</option>
            </select>
          </label>

          <label className="space-y-2 lg:col-span-2">
            <SceneFieldEditor fields={draftFields} onChange={setDraftFields} />
          </label>

          <label className="space-y-2">
            <div className="text-sm font-medium text-ink">默认素材 slug</div>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
              value={draft.defaultAssetsText}
              onChange={(event) => setDraft((current) => ({ ...current, defaultAssetsText: event.target.value }))}
              placeholder="多个 slug 用逗号或换行分隔"
            />
            <div className="text-xs text-[var(--muted)]">可用素材：{assets.map((asset) => asset.slug).join(" / ")}</div>
          </label>

          <label className="space-y-2">
            <div className="text-sm font-medium text-ink">默认尺寸</div>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
              value={draft.defaultSizesText}
              onChange={(event) => setDraft((current) => ({ ...current, defaultSizesText: event.target.value }))}
              placeholder="例如：1536x1024, 750x750"
            />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <div className="text-sm font-medium text-ink">Prompt 覆盖规则</div>
            <textarea
              className="min-h-32 w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
              value={draft.promptOverridesText}
              onChange={(event) => setDraft((current) => ({ ...current, promptOverridesText: event.target.value }))}
              placeholder="一行一条"
            />
          </label>

          <label className="space-y-2 lg:col-span-2">
            <div className="text-sm font-medium text-ink">字段 JSON 预览</div>
            <textarea
              className="min-h-40 w-full rounded-2xl border border-black/8 bg-[#111318] px-4 py-3 font-mono text-xs leading-6 text-white/82"
              value={JSON.stringify(draftFields, null, 2)}
              readOnly
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white"
            onClick={() => startTransition(() => void submit(selectedScene ? "update" : "create"))}
          >
            {selectedScene ? "保存修改" : "创建模板"}
          </button>
          {selectedScene ? (
            <button
              type="button"
              className="rounded-full border border-black/10 bg-white/80 px-5 py-3 text-sm"
              onClick={() => startTransition(() => void submit("copy"))}
            >
              复制当前模板
            </button>
          ) : null}
          {selectedScene ? (
            <button
              type="button"
              className="rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700"
              onClick={() => void removeScene()}
            >
              删除模板
            </button>
          ) : null}
        </div>

        {message ? <div className="mt-4 rounded-[20px] bg-white/70 px-4 py-3 text-sm text-ink">{message}</div> : null}
      </section>
    </div>
  );
}
