import { NextResponse } from "next/server";

import { listHotspots, listJobs, listPipelineRuns } from "@/lib/db";
import { buildImageUrl } from "@/lib/image-routes";

export async function GET() {
  return NextResponse.json({
    hotspots: listHotspots(20),
    runs: listPipelineRuns(20),
    jobs: listJobs(40)
      .filter((job) => job.jobType === "hotspot")
      .map((job) => ({
        ...job,
        imageUrl: buildImageUrl(job.outputPath)
      }))
  });
}
