"use client";

import Link from "next/link";
import Image from "next/image";
import { startTransition, useMemo, useState } from "react";

import type { JobRecord, SceneRecord, SceneType } from "@/lib/types";
import { formatDateTime, sizeToLabel } from "@/lib/utils";

type TimeRange = "all" | "today" | "week" | "month";

interface JobCardRecord extends JobRecord {
  imageUrl?: string | null;
  sceneName: string;
  sceneType: SceneType | "unknown";
}

const sceneTypeLabels: Record<SceneType | "unknown", string> = {
  festive: "节庆",
  collab: "联名",
  product: "产品",
  "mascot-led": "吉祥物",
  generic: "通用",
  unknown: "未归类"
};

const statusLabels: Record<JobRecord["status"], string> = {
  pending: "排队中",
  running: "生成中",
  done: "已完成",
  failed: "失败"
};

function inTimeRange(value: string, range: TimeRange) {
  if (range === "all") {
    return true;
  }
  const timestamp = new Date(value).getTime();
  const now = Date.now();
  const distance = now - timestamp;
  const day = 24 * 60 * 60 * 1000;
  if (range === "today") {
    return distance <= day;
  }
  if (range === "week") {
    return distance <= 7 * day;
  }
  return distance <= 30 * day;
}

function flattenBrief(brief: Record<string, unknown>) {
  return Object.values(brief)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter((item): item is string => typeof item === "string")
    .join(" ");
}

function shortError(message: string | null | undefined) {
  if (!message) {
    return "生成失败";
  }
  return message.length > 72 ? `${message.slice(0, 72)}...` : message;
}

function canRegenerate(job: JobRecord) {
  return job.jobType !== "design" && job.model !== "html-design-auto";
}

export function GalleryWorkspace({
  initialJobs,
  scenes
}: {
  initialJobs: Array<JobRecord & { imageUrl?: string | null }>;
  scenes: SceneRecord[];
}) {
  const [jobs, setJobs] = useState<JobCardRecord[]>(() =>
    initialJobs.map((job) => {
      const scene = scenes.find((item) => item.id === job.sceneId);
      return {
        ...job,
        sceneName: scene?.name ?? job.title ?? (job.jobType === "design" ? "HTML 设计稿" : "通用活动海报"),
        sceneType: scene?.sceneType ?? "unknown"
      };
    })
  );
  const [sceneFilter, setSceneFilter] = useState<SceneType | "all">("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [keyword, setKeyword] = useState("");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [regenerating, setRegenerating] = useState(false);

  const filteredJobs = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return jobs.filter((job) => {
      if (sceneFilter !== "all" && job.sceneType !== sceneFilter) {
        return false;
      }
      if (!inTimeRange(job.completedAt ?? job.createdAt, timeRange)) {
        return false;
      }
      if (!normalizedKeyword) {
        return true;
      }
      const haystack = [
        job.sceneName,
        job.title ?? "",
        job.generatedPrompt ?? "",
        job.errorMessage ?? "",
        job.assetsUsed.join(" "),
        flattenBrief(job.briefInput)
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedKeyword);
    });
  }, [jobs, keyword, sceneFilter, timeRange]);

  const activeJob = filteredJobs.find((job) => job.id === activeJobId) ?? jobs.find((job) => job.id === activeJobId) ?? null;

  async function refreshJobs() {
    const response = await fetch("/api/jobs?limit=60");
    const json = (await response.json()) as { jobs?: Array<JobRecord & { imageUrl?: string | null }> };
    if (json.jobs) {
      setJobs(
        json.jobs.map((job) => {
          const scene = scenes.find((item) => item.id === job.sceneId);
          return {
            ...job,
            sceneName: scene?.name ?? job.title ?? (job.jobType === "design" ? "HTML 设计稿" : "通用活动海报"),
            sceneType: scene?.sceneType ?? "unknown"
          };
        })
      );
    }
  }

  async function handleRegenerate(job: JobCardRecord) {
    setRegenerating(true);
    setMessage("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sceneId: job.sceneId ?? undefined,
          brief: job.briefInput,
          selectedAssetSlugs: job.assetsUsed,
          sizes: job.width && job.height ? [{ width: job.width, height: job.height }] : [],
          variantCount: 1,
          promptOverride: job.generatedPrompt ?? ""
        })
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "重新生成失败");
      }
      await refreshJobs();
      setMessage("已重新发起生成，最新结果已经刷新到图库。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "重新生成失败");
    } finally {
      setRegenerating(false);
    }
  }

  async function handleCopy(text: string, successMessage: string) {
    if (!text.trim()) {
      setMessage("当前没有可复制的内容。");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setMessage(successMessage);
    } catch {
      setMessage("复制失败，请手动复制。");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-[28px] border border-black/8 bg-white/80 p-5 lg:grid-cols-[1.2fr_0.8fr_1fr]">
        <label className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">场景类型</div>
          <select
            className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
            value={sceneFilter}
            onChange={(event) => setSceneFilter(event.target.value as SceneType | "all")}
          >
            <option value="all">全部</option>
            <option value="festive">节庆</option>
            <option value="collab">联名</option>
            <option value="product">产品</option>
            <option value="mascot-led">吉祥物</option>
            <option value="generic">通用</option>
          </select>
        </label>

        <label className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">时间范围</div>
          <select
            className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
            value={timeRange}
            onChange={(event) => setTimeRange(event.target.value as TimeRange)}
          >
            <option value="all">全部</option>
            <option value="today">今天</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
          </select>
        </label>

        <label className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">关键词</div>
          <input
            className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索 brief、素材 slug 或 prompt"
          />
        </label>
      </div>

      {message ? <div className="rounded-[22px] border border-black/8 bg-white/80 px-5 py-4 text-sm text-ink">{message}</div> : null}

      {filteredJobs.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-black/12 bg-white/70 px-6 py-12 text-center text-sm text-[var(--muted)]">
          当前筛选条件下没有记录。试试放宽时间范围或清空关键词。
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredJobs.map((job) => (
            <article
              key={job.id}
              className="overflow-hidden rounded-[28px] border border-black/8 bg-white/78 shadow-soft transition hover:-translate-y-0.5"
            >
              <button type="button" className="block w-full text-left" onClick={() => setActiveJobId(job.id)}>
                <div className="relative aspect-[4/3] bg-[#ede7dd]">
                  {job.imageUrl ? (
                    <Image src={job.imageUrl} alt={job.sceneName} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">生成失败或暂无图片</div>
                  )}
                </div>
                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-ink">{job.sceneName}</div>
                      <div className="mt-1 text-sm text-[var(--muted)]">{sceneTypeLabels[job.sceneType]}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                        {sizeToLabel(job.width ?? 0, job.height ?? 0)}
                      </div>
                      <div
                        className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          job.status === "done"
                            ? "bg-emerald-100 text-emerald-800"
                            : job.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {statusLabels[job.status]}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm leading-6 text-[var(--muted)]">
                    {job.status === "failed"
                      ? shortError(job.errorMessage)
                      : (job.generatedPrompt ?? "暂无 prompt").slice(0, 96)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                    <span>{formatDateTime(job.completedAt ?? job.createdAt)}</span>
                    <span>{job.assetsUsed.join(" / ") || "无素材"}</span>
                  </div>
                </div>
              </button>
              <div className="flex flex-wrap gap-2 border-t border-black/6 px-5 py-4">
                <button
                  type="button"
                  className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs text-ink"
                  onClick={() => setActiveJobId(job.id)}
                >
                  查看详情
                </button>
                <button
                  type="button"
                  className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs text-ink"
                  onClick={() => void handleCopy(job.generatedPrompt ?? "", "Prompt 已复制到剪贴板。")}
                >
                  复制 Prompt
                </button>
                {canRegenerate(job) ? (
                  <button
                    type="button"
                    className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs text-ink"
                    onClick={() => startTransition(() => void handleRegenerate(job))}
                  >
                    快速重试
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      {activeJob ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4 py-8 backdrop-blur-sm">
          <div className="grid max-h-full w-full max-w-6xl gap-6 overflow-auto rounded-[32px] bg-[#f6f1e8] p-6 shadow-2xl xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Detail</div>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{activeJob.sceneName}</h2>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm"
                  onClick={() => setActiveJobId(null)}
                >
                  关闭
                </button>
              </div>

              <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-[#e9e1d3]">
                {activeJob.imageUrl ? (
                  <Image src={activeJob.imageUrl} alt={activeJob.sceneName} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">暂无图片</div>
                )}
              </div>

              {activeJob.status === "failed" ? (
                <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Fallback</div>
                  <div>这次生图没有成功，但 prompt、negative prompt 和 brief 都已经保存在任务记录里了。</div>
                  <div className="mt-2">你可以直接复制 prompt 去其他工具手工生成，或者点“重新生成”稍后再试。</div>
                  {activeJob.errorMessage ? <div className="mt-3 text-xs text-amber-700">错误信息：{activeJob.errorMessage}</div> : null}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                {activeJob.imageUrl ? (
                  <a
                    href={activeJob.imageUrl}
                    download
                    className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white"
                  >
                    下载原图
                  </a>
                ) : null}
                {canRegenerate(activeJob) ? (
                  <button
                    type="button"
                    disabled={regenerating}
                    className="rounded-full border border-black/12 bg-white/85 px-5 py-3 text-sm"
                    onClick={() => startTransition(() => void handleRegenerate(activeJob))}
                  >
                    {regenerating ? "重新生成中..." : "重新生成"}
                  </button>
                ) : null}
                {canRegenerate(activeJob) ? (
                  <Link
                    href={`/generate?fromJob=${activeJob.id}`}
                    className="rounded-full border border-black/12 bg-white/85 px-5 py-3 text-sm"
                  >
                    修改再生
                  </Link>
                ) : (
                  <Link href="/generate?workflow=design" className="rounded-full border border-black/12 bg-white/85 px-5 py-3 text-sm">
                    去统一出稿
                  </Link>
                )}
                <button
                  type="button"
                  className="rounded-full border border-black/12 bg-white/85 px-5 py-3 text-sm"
                  onClick={() => void handleCopy(activeJob.generatedPrompt ?? "", "Prompt 已复制到剪贴板。")}
                >
                  复制 Prompt
                </button>
                <button
                  type="button"
                  className="rounded-full border border-black/12 bg-white/85 px-5 py-3 text-sm"
                  onClick={() => void handleCopy(activeJob.negativePrompt ?? "", "Negative prompt 已复制到剪贴板。")}
                >
                  复制 Negative
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[24px] border border-black/8 bg-white/80 p-5 text-sm leading-7 text-[var(--muted)]">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Meta</div>
                <div>场景模板：{activeJob.sceneName}</div>
                <div>来源模块：{activeJob.jobType === "design" ? "HTML 设计器" : activeJob.jobType === "hotspot" ? "热点出稿" : "AI 生图"}</div>
                <div>场景类型：{sceneTypeLabels[activeJob.sceneType]}</div>
                <div>生成时间：{formatDateTime(activeJob.completedAt ?? activeJob.createdAt)}</div>
                <div>尺寸：{sizeToLabel(activeJob.width ?? 0, activeJob.height ?? 0)}</div>
                <div>模型：{activeJob.model ?? "未记录"}</div>
                <div>状态：{statusLabels[activeJob.status]}</div>
                <div>使用素材：{activeJob.assetsUsed.join(" / ") || "无"}</div>
              </div>

              <div className="rounded-[24px] border border-black/8 bg-white/80 p-5 text-sm leading-7 text-ink">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Brief</div>
                <div className="space-y-2">
                  {Object.entries(activeJob.briefInput).map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium">{key}：</span>
                      <span>{Array.isArray(value) ? value.join(" / ") : String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-black/8 bg-[#111318] p-5 text-sm leading-7 text-white/88">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Prompt</div>
                {activeJob.generatedPrompt || "暂无 prompt"}
              </div>

              <div className="rounded-[24px] border border-black/8 bg-white/80 p-5 text-sm leading-7 text-ink">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                  Negative Prompt
                </div>
                {activeJob.negativePrompt || "暂无负向提示词"}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
