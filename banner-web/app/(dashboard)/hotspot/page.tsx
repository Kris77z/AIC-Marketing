import { HotspotWorkbench } from "@/components/hotspot/HotspotWorkbench";
import { listHotspots, listJobs, listPipelineRuns } from "@/lib/db";
import { buildImageUrl } from "@/lib/image-routes";

export default function HotspotPage() {
  const hotspots = listHotspots(20);
  const runs = listPipelineRuns(20);
  const jobs = listJobs(40)
    .filter((job) => job.jobType === "hotspot")
    .map((job) => ({
      ...job,
      imageUrl: buildImageUrl(job.outputPath)
    }));

  return <HotspotWorkbench hotspots={hotspots} runs={runs} jobs={jobs} />;
}
