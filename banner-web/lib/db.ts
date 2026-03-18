import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { ensureAppDirectories, STORE_PATH } from "@/lib/paths";
import { DEFAULT_ASSETS, DEFAULT_HOTSPOTS, DEFAULT_SCENES } from "@/lib/seed-data";
import type { AssetRecord, HotspotRecord, JobRecord, PipelineRunRecord, SceneRecord } from "@/lib/types";

interface StoreFile {
  assets: AssetRecord[];
  scenes: SceneRecord[];
  jobs: JobRecord[];
  hotspots: HotspotRecord[];
  pipelineRuns: PipelineRunRecord[];
}

let cache: StoreFile | null = null;

function createInitialStore(): StoreFile {
  return {
    assets: DEFAULT_ASSETS,
    scenes: DEFAULT_SCENES,
    jobs: [],
    hotspots: DEFAULT_HOTSPOTS,
    pipelineRuns: []
  };
}

function writeStore(store: StoreFile) {
  ensureAppDirectories();
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

function readStore(): StoreFile {
  if (cache) {
    return cache;
  }

  ensureAppDirectories();
  if (!existsSync(STORE_PATH)) {
    cache = createInitialStore();
    writeStore(cache);
    return cache;
  }

  const raw = readFileSync(STORE_PATH, "utf8");
  const parsed = JSON.parse(raw) as Partial<StoreFile>;
  cache = {
    assets: parsed.assets ?? DEFAULT_ASSETS,
    scenes: parsed.scenes ?? DEFAULT_SCENES,
    jobs: parsed.jobs ?? [],
    hotspots: parsed.hotspots ?? DEFAULT_HOTSPOTS,
    pipelineRuns: parsed.pipelineRuns ?? []
  };
  return cache;
}

function mutateStore(mutator: (store: StoreFile) => void) {
  const store = readStore();
  mutator(store);
  writeStore(store);
  cache = store;
  return store;
}

export function listAssets(): AssetRecord[] {
  return [...readStore().assets].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function listScenes(): SceneRecord[] {
  return [...readStore().scenes].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export function getSceneById(sceneId: string): SceneRecord | null {
  return readStore().scenes.find((scene) => scene.id === sceneId) ?? null;
}

export function insertAsset(asset: AssetRecord): AssetRecord {
  mutateStore((store) => {
    store.assets.unshift(asset);
  });
  return asset;
}

export function updateAsset(assetId: string, patch: Partial<AssetRecord>): AssetRecord {
  let updated: AssetRecord | null = null;

  mutateStore((store) => {
    const index = store.assets.findIndex((asset) => asset.id === assetId);
    if (index === -1) {
      throw new Error(`Asset ${assetId} not found`);
    }
    const nextAsset = {
      ...store.assets[index],
      ...patch
    };
    store.assets[index] = nextAsset;
    updated = nextAsset;
  });

  if (!updated) {
    throw new Error(`Asset ${assetId} not found`);
  }

  return updated as AssetRecord;
}

export function deleteAsset(assetId: string): AssetRecord {
  let removed: AssetRecord | null = null;

  mutateStore((store) => {
    const index = store.assets.findIndex((asset) => asset.id === assetId);
    if (index === -1) {
      throw new Error(`Asset ${assetId} not found`);
    }
    removed = store.assets[index];
    store.assets.splice(index, 1);
  });

  if (!removed) {
    throw new Error(`Asset ${assetId} not found`);
  }

  return removed as AssetRecord;
}

export function insertScene(scene: SceneRecord): SceneRecord {
  mutateStore((store) => {
    store.scenes.push(scene);
  });
  return scene;
}

export function updateScene(sceneId: string, patch: Partial<SceneRecord>): SceneRecord {
  let updated: SceneRecord | null = null;

  mutateStore((store) => {
    const index = store.scenes.findIndex((scene) => scene.id === sceneId);
    if (index === -1) {
      throw new Error(`Scene ${sceneId} not found`);
    }
    const nextScene = {
      ...store.scenes[index],
      ...patch
    };
    store.scenes[index] = nextScene;
    updated = nextScene;
  });

  if (!updated) {
    throw new Error(`Scene ${sceneId} not found`);
  }

  return updated as SceneRecord;
}

export function deleteScene(sceneId: string): SceneRecord {
  let removed: SceneRecord | null = null;

  mutateStore((store) => {
    const index = store.scenes.findIndex((scene) => scene.id === sceneId);
    if (index === -1) {
      throw new Error(`Scene ${sceneId} not found`);
    }
    removed = store.scenes[index];
    store.scenes.splice(index, 1);
  });

  if (!removed) {
    throw new Error(`Scene ${sceneId} not found`);
  }

  return removed as SceneRecord;
}

export function getAssetsBySlugs(slugs: string[]): AssetRecord[] {
  if (slugs.length === 0) {
    return [];
  }
  const slugSet = new Set(slugs);
  return readStore().assets.filter((asset) => slugSet.has(asset.slug));
}

export function listHotspots(limit = 30): HotspotRecord[] {
  return [...readStore().hotspots]
    .sort((left, right) => {
      const scoreDelta = right.score - left.score;
      if (scoreDelta !== 0) {
        return scoreDelta;
      }
      return right.publishedAt.localeCompare(left.publishedAt);
    })
    .slice(0, limit);
}

export function getHotspotById(hotspotId: string): HotspotRecord | null {
  return readStore().hotspots.find((hotspot) => hotspot.id === hotspotId) ?? null;
}

export function upsertHotspots(hotspots: HotspotRecord[]) {
  let updatedRecords: HotspotRecord[] = [];

  mutateStore((store) => {
    const byId = new Map(store.hotspots.map((item) => [item.id, item]));

    for (const hotspot of hotspots) {
      const current = byId.get(hotspot.id);
      byId.set(hotspot.id, {
        ...current,
        ...hotspot,
        status: current?.status === "produced" ? "produced" : hotspot.status,
        latestRunId: current?.latestRunId ?? hotspot.latestRunId ?? null
      });
    }

    store.hotspots = Array.from(byId.values());
    updatedRecords = hotspots.map((hotspot) => byId.get(hotspot.id) ?? hotspot);
  });

  return updatedRecords;
}

export function updateHotspot(hotspotId: string, patch: Partial<HotspotRecord>): HotspotRecord {
  let updated: HotspotRecord | null = null;

  mutateStore((store) => {
    const index = store.hotspots.findIndex((hotspot) => hotspot.id === hotspotId);
    if (index === -1) {
      throw new Error(`Hotspot ${hotspotId} not found`);
    }
    const nextHotspot = {
      ...store.hotspots[index],
      ...patch
    };
    store.hotspots[index] = nextHotspot;
    updated = nextHotspot;
  });

  if (!updated) {
    throw new Error(`Hotspot ${hotspotId} not found`);
  }

  return updated as HotspotRecord;
}

export function listPipelineRuns(limit = 30): PipelineRunRecord[] {
  return [...readStore().pipelineRuns]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, limit);
}

export function insertPipelineRun(run: PipelineRunRecord) {
  mutateStore((store) => {
    store.pipelineRuns.unshift(run);
  });
  return run;
}

export function updatePipelineRun(runId: string, patch: Partial<PipelineRunRecord>): PipelineRunRecord {
  let updated: PipelineRunRecord | null = null;

  mutateStore((store) => {
    const index = store.pipelineRuns.findIndex((run) => run.id === runId);
    if (index === -1) {
      throw new Error(`Pipeline run ${runId} not found`);
    }
    const nextRun = {
      ...store.pipelineRuns[index],
      ...patch
    };
    store.pipelineRuns[index] = nextRun;
    updated = nextRun;
  });

  if (!updated) {
    throw new Error(`Pipeline run ${runId} not found`);
  }

  return updated as PipelineRunRecord;
}

export function listJobs(limit = 60): JobRecord[] {
  return [...readStore().jobs]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, limit);
}

export function getJobById(jobId: string): JobRecord | null {
  return readStore().jobs.find((job) => job.id === jobId) ?? null;
}

export function insertJob(job: JobRecord) {
  mutateStore((store) => {
    store.jobs.unshift(job);
  });
  return job;
}

export function updateJob(jobId: string, patch: Partial<JobRecord>): JobRecord {
  let updated: JobRecord | null = null;

  mutateStore((store) => {
    const index = store.jobs.findIndex((job) => job.id === jobId);
    if (index === -1) {
      throw new Error(`Job ${jobId} not found`);
    }
    const nextJob = {
      ...store.jobs[index],
      ...patch
    };
    store.jobs[index] = nextJob;
    updated = nextJob;
  });

  if (!updated) {
    throw new Error(`Job ${jobId} not found`);
  }

  return updated as JobRecord;
}
