import {
  getHotspotById,
  insertPipelineRun,
  listHotspots,
  updateHotspot,
  updatePipelineRun,
  upsertHotspots
} from "@/lib/db";
import { runAutomatedDesignProduction } from "@/lib/design-service";
import { prepareGenerationRequest, runPreparedGeneration } from "@/lib/generate-service";
import { collectHotspotFeed } from "@/lib/hotspot-feed";
import { buildPipelinePlan } from "@/lib/pipeline-planner";
import type { HotspotRecord, PipelineRunRecord } from "@/lib/types";

export async function syncHotspots() {
  const feed = await collectHotspotFeed();
  const hotspots = upsertHotspots(feed.items);
  return {
    hotspots,
    mode: feed.mode,
    note: feed.note
  };
}

async function runSingleHotspot(hotspot: HotspotRecord) {
  const plan = buildPipelinePlan(hotspot);
  const run = insertPipelineRun({
    id: crypto.randomUUID(),
    hotspotId: hotspot.id,
    hotspotTitle: hotspot.title,
    mode: plan.mode,
    status: "running",
    reasoning: plan.reasoning,
    sceneId: plan.sceneId ?? null,
    templateId: plan.templateId ?? null,
    jobIds: [],
    createdAt: new Date().toISOString(),
    completedAt: null,
    errorMessage: null
  });

  updateHotspot(hotspot.id, {
    status: "planned",
    latestRunId: run.id
  });

  try {
    const results =
      plan.mode === "ai"
        ? (
            await runPreparedGeneration(
              prepareGenerationRequest({
                sceneId: plan.sceneId ?? undefined,
                brief: plan.brief ?? {},
                selectedAssetSlugs: plan.selectedAssetSlugs,
                sizes: plan.sizes,
                variantCount: plan.variantCount,
                jobType: "hotspot",
                title: plan.title
              })
            )
          ).results
        : await runAutomatedDesignProduction({
            hotspot,
            plan
          });

    const failed = results.every((item) => item.job.status === "failed");

    const updatedRun = updatePipelineRun(run.id, {
      status: failed ? "failed" : "done",
      jobIds: results.map((item) => item.job.id),
      completedAt: new Date().toISOString(),
      errorMessage: failed ? results.map((item) => item.job.errorMessage).filter(Boolean).join(" | ") : null
    });

    updateHotspot(hotspot.id, {
      status: failed ? "failed" : "produced",
      latestRunId: updatedRun.id
    });

    return updatedRun;
  } catch (error) {
    const message = error instanceof Error ? error.message : "流水线执行失败";
    const updatedRun = updatePipelineRun(run.id, {
      status: "failed",
      completedAt: new Date().toISOString(),
      errorMessage: message
    });
    updateHotspot(hotspot.id, {
      status: "failed",
      latestRunId: updatedRun.id
    });
    return updatedRun;
  }
}

export async function runHotspotPipeline({ hotspotIds, limit = 3 }: { hotspotIds?: string[]; limit?: number } = {}) {
  const sourceHotspots =
    hotspotIds && hotspotIds.length > 0
      ? hotspotIds.map((hotspotId) => getHotspotById(hotspotId)).filter((item): item is HotspotRecord => item !== null)
      : listHotspots(20).filter((hotspot) => hotspot.status !== "produced").slice(0, limit);

  const runs: PipelineRunRecord[] = [];
  for (const hotspot of sourceHotspots) {
    runs.push(await runSingleHotspot(hotspot));
  }
  return runs;
}
