import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { ensureAppDirectories, STORE_PATH } from "@/lib/paths";
import { DEFAULT_ASSETS, DEFAULT_SCENES } from "@/lib/seed-data";
import type { AssetRecord, JobRecord, SceneRecord } from "@/lib/types";

interface StoreFile {
  assets: AssetRecord[];
  scenes: SceneRecord[];
  jobs: JobRecord[];
}

let cache: StoreFile | null = null;

function createInitialStore(): StoreFile {
  return {
    assets: DEFAULT_ASSETS,
    scenes: DEFAULT_SCENES,
    jobs: []
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
    jobs: parsed.jobs ?? []
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

  return updated;
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

  return removed;
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

  return updated;
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

  return removed;
}

export function getAssetsBySlugs(slugs: string[]): AssetRecord[] {
  if (slugs.length === 0) {
    return [];
  }
  const slugSet = new Set(slugs);
  return readStore().assets.filter((asset) => slugSet.has(asset.slug));
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

export function updateJob(jobId: string, patch: Partial<JobRecord>) {
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

  return updated;
}
