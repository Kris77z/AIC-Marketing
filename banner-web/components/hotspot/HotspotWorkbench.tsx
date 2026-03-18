"use client";

import Image from "next/image";
import Link from "next/link";
import { startTransition, useMemo, useState } from "react";

import type { HotspotRecord, JobRecord, PipelineRunRecord } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

type HotspotJob = JobRecord & { imageUrl?: string | null };

const statusTone: Record<HotspotRecord["status"] | PipelineRunRecord["status"], string> = {
  new: "bg-sky-100 text-sky-700",
  planned: "bg-amber-100 text-amber-800",
  produced: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-700",
  pending: "bg-sky-100 text-sky-700",
  running: "bg-amber-100 text-amber-800",
  done: "bg-emerald-100 text-emerald-800"
};

export function HotspotWorkbench({
  hotspots: initialHotspots,
  runs: initialRuns,
  jobs: initialJobs
}: {
  hotspots: HotspotRecord[];
  runs: PipelineRunRecord[];
  jobs: HotspotJob[];
}) {
  const [hotspots, setHotspots] = useState(initialHotspots);
  const [runs, setRuns] = useState(initialRuns);
  const [jobs, setJobs] = useState(initialJobs);
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState<"idle" | "collect" | "run">("idle");

  const jobsById = useMemo(() => Object.fromEntries(jobs.map((job) => [job.id, job])), [jobs]);

  async function refreshPipeline() {
    const response = await fetch("/api/pipeline");
    const json = (await response.json()) as {
      hotspots?: HotspotRecord[];
      runs?: PipelineRunRecord[];
      jobs?: HotspotJob[];
      error?: string;
    };
    if (!response.ok) {
      throw new Error(json.error ?? "刷新流水线状态失败");
    }
    setHotspots(json.hotspots ?? []);
    setRuns(json.runs ?? []);
    setJobs(json.jobs ?? []);
  }

  async function handleCollect() {
    setWorking("collect");
    setMessage("");
    try {
      const response = await fetch("/api/pipeline/collect", {
        method: "POST"
      });
      const json = (await response.json()) as { hotspots?: HotspotRecord[]; note?: string; error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "热点同步失败");
      }
      setHotspots(json.hotspots ?? []);
      setMessage(json.note ?? "已同步热点源。");
      await refreshPipeline();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "热点同步失败");
    } finally {
      setWorking("idle");
    }
  }

  async function handleRun() {
    setWorking("run");
    setMessage("");
    try {
      const response = await fetch("/api/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectFirst: true, limit: 3 })
      });
      const json = (await response.json()) as { runs?: PipelineRunRecord[]; error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "自动出稿失败");
      }
      await refreshPipeline();
      setMessage(`已完成 ${json.runs?.length ?? 0} 条热点的自动出稿。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "自动出稿失败");
    } finally {
      setWorking("idle");
    }
  }

  return (
    <div className="space-y-6">
      <header className="panel rounded-[34px] px-8 py-7 shadow-soft">
        <div className="max-w-5xl">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">AIC Hotspot Pipeline</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">自动收热点，自动决定走 AI 生图还是 HTML 设计</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)]">
            这里不再手填主题。系统会先读取热点源，再由 planner 判定更适合走情绪型 AI 视觉，还是信息型 HTML 版式，最后自动写入图库。
          </p>
        </div>
      </header>

      <section className="rounded-[28px] border border-black/8 bg-white/80 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm leading-7 text-[var(--muted)]">
            推荐把 `x-collect` 的输出写到 `banner-web/data/hotspots-feed.json`，或者配置 `HOTSPOT_COLLECT_COMMAND`。
            这样这个面板就能直接作为自动热点生产入口。
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm text-ink disabled:opacity-60"
              disabled={working !== "idle"}
              onClick={() => startTransition(() => void handleCollect())}
            >
              {working === "collect" ? "同步中..." : "同步热点源"}
            </button>
            <button
              type="button"
              className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
              disabled={working !== "idle"}
              onClick={() => startTransition(() => void handleRun())}
            >
              {working === "run" ? "执行中..." : "自动跑一轮"}
            </button>
          </div>
        </div>
      </section>

      {message ? <div className="rounded-[24px] border border-black/8 bg-white/80 px-5 py-4 text-sm text-ink">{message}</div> : null}

      <section className="panel rounded-[30px] p-6 shadow-soft">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Feed</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">热点池</h2>
          </div>
          <div className="text-sm text-[var(--muted)]">按热度排序，状态会随流水线自动更新</div>
        </div>

        {hotspots.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-black/12 bg-white/65 px-6 py-10 text-center text-sm text-[var(--muted)]">
            还没有热点记录。先同步热点源。
          </div>
        ) : (
          <div className="space-y-4">
            {hotspots.map((hotspot) => (
              <article key={hotspot.id} className="rounded-[24px] border border-black/8 bg-white/80 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-3xl">
                    <div className="text-lg font-semibold text-ink">{hotspot.title}</div>
                    <div className="mt-2 text-sm leading-7 text-[var(--muted)]">{hotspot.summary}</div>
                  </div>
                  <div className="space-y-2 text-right">
                    <div className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusTone[hotspot.status]}`}>
                      {hotspot.status}
                    </div>
                    <div className="text-xs text-[var(--muted)]">热度 {hotspot.score}</div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
                  <span>来源：{hotspot.source}</span>
                  <span>发布时间：{formatDateTime(hotspot.publishedAt)}</span>
                  <span>标签：{hotspot.tags.join(" / ") || "未标记"}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="panel rounded-[30px] p-6 shadow-soft">
          <div className="mb-5">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Runs</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">流水线执行记录</h2>
          </div>

          {runs.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-black/12 bg-white/65 px-6 py-10 text-center text-sm text-[var(--muted)]">
              还没有自动出稿记录。
            </div>
          ) : (
            <div className="space-y-4">
              {runs.map((run) => (
                <article key={run.id} className="rounded-[24px] border border-black/8 bg-white/80 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-ink">{run.hotspotTitle}</div>
                      <div className="mt-1 text-sm text-[var(--muted)]">
                        {run.mode === "ai" ? "AI 生图" : "HTML 设计"} · {formatDateTime(run.createdAt)}
                      </div>
                    </div>
                    <div className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusTone[run.status]}`}>
                      {run.status}
                    </div>
                  </div>
                  <div className="mt-3 text-sm leading-7 text-[var(--muted)]">{run.reasoning}</div>
                  <div className="mt-4 text-xs text-[var(--muted)]">
                    产出任务：
                    {run.jobIds.length > 0 ? run.jobIds.join(" / ") : " 尚未写入任务"}
                  </div>
                  {run.errorMessage ? <div className="mt-3 text-xs text-red-600">{run.errorMessage}</div> : null}
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="panel rounded-[30px] p-6 shadow-soft">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Outputs</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">自动出稿结果</h2>
            </div>
            <Link href="/gallery" className="text-sm text-[var(--accent)] underline-offset-4 hover:underline">
              去图库查看全部
            </Link>
          </div>

          {jobs.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-black/12 bg-white/65 px-6 py-10 text-center text-sm text-[var(--muted)]">
              流水线跑完后，这里会显示最近的自动出稿。
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {jobs.slice(0, 6).map((job) => (
                <article key={job.id} className="overflow-hidden rounded-[24px] border border-black/8 bg-white/80">
                  <div className="relative aspect-[4/3] bg-[#ede7dd]">
                    {job.imageUrl ? (
                      <Image src={job.imageUrl} alt={job.title ?? job.id} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">暂无图片</div>
                    )}
                  </div>
                  <div className="space-y-2 p-4">
                    <div className="text-sm font-semibold text-ink">{job.title ?? job.id}</div>
                    <div className="text-xs text-[var(--muted)]">
                      {job.model === "html-design-auto" ? "HTML 自动设计" : "AI 自动生图"} · {formatDateTime(job.completedAt ?? job.createdAt)}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      关联运行：
                      {hotspots.find((hotspot) => hotspot.latestRunId && runs.some((run) => run.id === hotspot.latestRunId && run.jobIds.includes(job.id)))
                        ?.latestRunId ?? "未关联"}
                    </div>
                    {jobsById[job.id]?.imageUrl ? (
                      <a
                        href={jobsById[job.id]?.imageUrl ?? "#"}
                        className="inline-flex rounded-full border border-black/10 bg-white px-3 py-2 text-xs text-ink"
                      >
                        打开预览
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
