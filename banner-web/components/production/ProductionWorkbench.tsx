"use client";

import { useState } from "react";

import { DesignWorkbench } from "@/components/design/DesignWorkbench";
import { GenerateWorkbench } from "@/components/generate/GenerateWorkbench";
import type { AssetRecord, SceneRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

type AssetView = AssetRecord & { imageUrl?: string | null };
type WorkflowMode = "ai" | "design";

const workflowCards: Array<{
  mode: WorkflowMode;
  label: string;
  title: string;
  description: string;
}> = [
  {
    mode: "ai",
    label: "AI 生图",
    title: "稳定运营图",
    description: "固定场景模板和素材约束，系统自动拼 prompt 并直接出图，默认不需要人工改提示词。"
  },
  {
    mode: "design",
    label: "HTML 设计",
    title: "固定版式快排",
    description: "需要稳定版式、明确文案层级时，走模板化设计导出，适合活动、促销和海报信息稿。"
  }
];

export function ProductionWorkbench({
  scenes,
  assets,
  initialJobId,
  initialMode
}: {
  scenes: SceneRecord[];
  assets: AssetView[];
  initialJobId: string | null;
  initialMode: WorkflowMode;
}) {
  const [mode, setMode] = useState<WorkflowMode>(initialMode);

  return (
    <div className="space-y-6">
      <header className="panel rounded-[34px] px-8 py-7 shadow-soft">
        <div className="max-w-5xl">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">Unified Production Flow</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">统一出稿入口，先决定方法，再交给系统执行</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)]">
            AI 生图和 HTML 设计不再拆成两个模块。先根据任务类型选择出稿方式，后续再把热点自动采集、自动分发和定时生产接到同一条工作流里。
          </p>
        </div>
      </header>

      <section className="panel rounded-[30px] p-6 shadow-soft">
        <div className="mb-5">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Step 0</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">选择出稿方式</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {workflowCards.map((card) => {
            const active = card.mode === mode;
            return (
              <button
                key={card.mode}
                type="button"
                onClick={() => setMode(card.mode)}
                className={cn(
                  "rounded-[28px] border p-5 text-left transition",
                  active
                    ? "border-transparent bg-ink text-white shadow-soft"
                    : "border-black/8 bg-white/70 hover:-translate-y-0.5 hover:border-black/15"
                )}
              >
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">{card.label}</div>
                <div className="mt-3 text-2xl font-semibold tracking-tight">{card.title}</div>
                <div className={cn("mt-3 text-sm leading-7", active ? "text-white/78" : "text-[var(--muted)]")}>
                  {card.description}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {mode === "ai" ? (
        <GenerateWorkbench scenes={scenes} assets={assets} initialJobId={initialJobId} embedded />
      ) : (
        <DesignWorkbench assets={assets} embedded />
      )}
    </div>
  );
}
