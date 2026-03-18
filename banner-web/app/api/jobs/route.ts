import { NextResponse } from "next/server";

import { getJobById, listJobs } from "@/lib/db";
import { buildImageUrl } from "@/lib/image-routes";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get("id");
  if (jobId) {
    const job = getJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: "任务不存在。" }, { status: 404 });
    }
    return NextResponse.json({
      job: {
        ...job,
        imageUrl: buildImageUrl(job.outputPath)
      }
    });
  }

  const limit = Number(url.searchParams.get("limit") ?? "60");
  const jobs = listJobs(Number.isFinite(limit) ? limit : 60).map((job) => ({
    ...job,
    imageUrl: buildImageUrl(job.outputPath)
  }));
  return NextResponse.json({ jobs });
}
