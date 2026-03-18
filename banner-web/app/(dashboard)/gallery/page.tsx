import { GalleryWorkspace } from "@/components/gallery/GalleryWorkspace";
import { listJobs, listScenes } from "@/lib/db";
import { buildImageUrl } from "@/lib/image-routes";

export default function GalleryPage() {
  const jobs = listJobs(60).map((job) => ({
    ...job,
    imageUrl: buildImageUrl(job.outputPath)
  }));
  const scenes = listScenes();

  return (
    <div className="space-y-6">
      <header className="panel rounded-[34px] px-8 py-7 shadow-soft">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">Gallery</div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">历史生成记录和复现入口</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)]">
          现在已经能按场景和时间筛选，也能在详情里直接下载、复制 prompt、重新生成，或者回到工作台继续修改。
        </p>
      </header>
      <GalleryWorkspace initialJobs={jobs} scenes={scenes} />
    </div>
  );
}
