"use client";

import { useState, useTransition } from "react";

import type { StoredSettings } from "@/lib/types";

export function SettingsForm({ initialSettings }: { initialSettings: StoredSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="panel rounded-[30px] p-6 shadow-soft"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          setMessage("");
          const response = await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(settings)
          });
          const json = (await response.json()) as { message?: string };
          setMessage(json.message ?? "已保存");
        });
      }}
    >
      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Settings</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">系统设置</h2>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <label className="space-y-2 lg:col-span-2">
          <div className="text-sm font-medium text-ink">API Key / Auth Key</div>
          <input
            className="w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3"
            type="password"
            value={settings.apiKey}
            onChange={(event) => setSettings((current) => ({ ...current, apiKey: event.target.value }))}
            placeholder="支持 GEMINI_API_KEY 或 GEMINI_AUTH_KEY"
          />
        </label>

        <label className="space-y-2">
          <div className="text-sm font-medium text-ink">Base URL</div>
          <input
            className="w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3"
            value={settings.baseUrl}
            onChange={(event) => setSettings((current) => ({ ...current, baseUrl: event.target.value }))}
          />
        </label>

        <label className="space-y-2">
          <div className="text-sm font-medium text-ink">Model</div>
          <input
            className="w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3"
            value={settings.model}
            onChange={(event) => setSettings((current) => ({ ...current, model: event.target.value }))}
          />
        </label>

        <label className="space-y-2">
          <div className="text-sm font-medium text-ink">API Format</div>
          <select
            className="w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3"
            value={settings.apiFormat}
            onChange={(event) =>
              setSettings((current) => ({ ...current, apiFormat: event.target.value as StoredSettings["apiFormat"] }))
            }
          >
            <option value="auto">auto</option>
            <option value="gemini">gemini</option>
            <option value="openai">openai</option>
          </select>
        </label>

        <label className="space-y-2">
          <div className="text-sm font-medium text-ink">超时时间（秒）</div>
          <input
            className="w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3"
            type="number"
            min={30}
            max={600}
            value={settings.timeoutSeconds}
            onChange={(event) => setSettings((current) => ({ ...current, timeoutSeconds: Number(event.target.value) }))}
          />
        </label>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="text-sm text-[var(--muted)]">{message || "设置会写入 banner-web/data/settings.json"}</div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-white shadow-soft disabled:opacity-70"
        >
          {isPending ? "保存中..." : "保存设置"}
        </button>
      </div>
    </form>
  );
}
