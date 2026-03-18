import Image from "next/image";

import { buildImageUrl } from "@/lib/image-routes";
import type { JobRecord } from "@/lib/types";
import { formatDateTime, sizeToLabel } from "@/lib/utils";

export function ImageGrid({ jobs }: { jobs: JobRecord[] }) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-black/12 bg-white/70 px-6 py-12 text-center text-sm text-[var(--muted)]">
        还没有历史记录。先去生图工作台跑一张，我们再把它沉淀进图库。
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {jobs.map((job) => {
        const imageUrl = buildImageUrl(job.outputPath);
        return (
          <article key={job.id} className="overflow-hidden rounded-[28px] border border-black/8 bg-white/78 shadow-soft">
            <div className="relative aspect-[4/3] bg-[#ede7dd]">
              {imageUrl ? (
                <Image src={imageUrl} alt={job.id} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">{job.status}</div>
              )}
            </div>
            <div className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-base font-semibold text-ink">{job.status === "done" ? "已生成" : "任务异常"}</div>
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                  {sizeToLabel(job.width ?? 0, job.height ?? 0)}
                </div>
              </div>
              <div className="text-sm leading-6 text-[var(--muted)]">
                {job.generatedPrompt?.slice(0, 120) ?? job.errorMessage ?? "暂无 prompt"}
              </div>
              <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                <span>{formatDateTime(job.completedAt ?? job.createdAt)}</span>
                <span>{job.assetsUsed.join(" / ") || "无素材"}</span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
