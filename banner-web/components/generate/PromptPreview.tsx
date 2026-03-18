export function PromptPreview({
  prompt,
  negativePrompt,
  strategy,
  onRefresh,
  loading,
  promptOverride,
  onPromptOverrideChange,
  negativePromptOverride,
  onNegativePromptOverrideChange,
  customMode
}: {
  prompt: string;
  negativePrompt: string;
  strategy?: string;
  onRefresh: () => void;
  loading: boolean;
  promptOverride: string;
  onPromptOverrideChange: (value: string) => void;
  negativePromptOverride: string;
  onNegativePromptOverrideChange: (value: string) => void;
  customMode: boolean;
}) {
  return (
    <section className="panel rounded-[30px] p-6 shadow-soft">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Step 4</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">系统策略预览</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            默认由系统自动拼 prompt 和负向约束。这里只做确认和排错，不要求运营手动改写。
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="rounded-full border border-black/10 bg-white/85 px-4 py-2 text-sm transition hover:border-black/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "刷新中..." : "刷新系统策略"}
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-[24px] border border-black/8 bg-[#111318] p-5 text-sm leading-7 text-white/88">
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-white/48">
              {customMode ? "Resolved Prompt" : "System Prompt"}
            </div>
            {prompt || (customMode ? "直接写 prompt 后会在这里显示最终发送内容。" : "点击“刷新系统策略”预览系统构建结果。")}
          </div>
          {!customMode ? (
            <details className="rounded-[24px] border border-black/8 bg-white/85 p-5">
              <summary className="cursor-pointer list-none text-sm font-medium text-ink">高级模式：手动覆盖 Prompt</summary>
              <div className="mt-4 space-y-4">
                <label className="block rounded-[24px] border border-black/8 bg-white/85 p-5">
                  <div className="mb-3 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Prompt Override</div>
                  <textarea
                    className="min-h-40 w-full resize-y rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm leading-7 text-ink outline-none"
                    placeholder="可选：必要时在这里手动改写 prompt。留空则使用系统 prompt。"
                    value={promptOverride}
                    onChange={(event) => onPromptOverrideChange(event.target.value)}
                  />
                </label>
                <label className="block rounded-[24px] border border-black/8 bg-white/85 p-5">
                  <div className="mb-3 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Negative Override</div>
                  <textarea
                    className="min-h-28 w-full resize-y rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm leading-7 text-ink outline-none"
                    placeholder="可选：必要时手动覆盖负向 prompt。留空则使用系统负向 prompt。"
                    value={negativePromptOverride}
                    onChange={(event) => onNegativePromptOverrideChange(event.target.value)}
                  />
                </label>
              </div>
            </details>
          ) : null}
        </div>
        <div className="space-y-4">
          <div className="rounded-[24px] border border-black/8 bg-white/85 p-5 text-sm leading-7 text-ink">
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Negative Prompt</div>
            {negativePrompt || "系统会自动补全基础负向限制。"}
          </div>
          <div className="rounded-[24px] border border-black/8 bg-[var(--moss-soft)] p-5 text-sm leading-7 text-ink">
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Strategy</div>
            {strategy || "场景策略尚未生成。"}
          </div>
        </div>
      </div>
    </section>
  );
}
