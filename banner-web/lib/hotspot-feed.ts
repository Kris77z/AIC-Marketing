import { exec as execCallback } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { promisify } from "node:util";

import { HOTSPOT_FEED_PATH } from "@/lib/paths";
import { DEFAULT_HOTSPOTS } from "@/lib/seed-data";
import type { HotspotRecord } from "@/lib/types";
import { slugify } from "@/lib/utils";

const exec = promisify(execCallback);

interface RawHotspotItem {
  id?: string;
  title?: string;
  summary?: string;
  source?: string;
  sourceUrl?: string;
  url?: string;
  score?: number;
  tags?: string[] | string;
  publishedAt?: string;
}

export interface HotspotFeedResult {
  items: HotspotRecord[];
  mode: "seed" | "file" | "command";
  note: string;
}

function normalizeHotspotItem(item: RawHotspotItem, fallbackSource: string): HotspotRecord | null {
  const title = item.title?.trim();
  if (!title) {
    return null;
  }

  const publishedAt = item.publishedAt && !Number.isNaN(Date.parse(item.publishedAt)) ? item.publishedAt : new Date().toISOString();
  const tags = Array.isArray(item.tags)
    ? item.tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
    : typeof item.tags === "string"
      ? item.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

  return {
    id: item.id?.trim() || `hotspot-${slugify(`${title}-${publishedAt}`)}`,
    title,
    summary: item.summary?.trim() || "未提供摘要，建议由 planner 自动补足视觉和文案方向。",
    source: item.source?.trim() || fallbackSource,
    sourceUrl: item.sourceUrl?.trim() || item.url?.trim() || null,
    score: Math.max(0, Math.min(100, Math.round(item.score ?? 60))),
    tags,
    publishedAt,
    collectedAt: new Date().toISOString(),
    status: "new",
    latestRunId: null
  };
}

function parseFeedPayload(raw: string, fallbackSource: string) {
  const parsed = JSON.parse(raw) as RawHotspotItem[] | { items?: RawHotspotItem[] };
  const list = Array.isArray(parsed) ? parsed : parsed.items ?? [];
  return list
    .map((item) => normalizeHotspotItem(item, fallbackSource))
    .filter((item): item is HotspotRecord => item !== null);
}

async function readFromCommand(command: string) {
  const { stdout } = await exec(command, { maxBuffer: 1024 * 1024 * 4 });
  return parseFeedPayload(stdout, "x-collect");
}

function readFromFile(filePath: string) {
  const raw = readFileSync(filePath, "utf8");
  return parseFeedPayload(raw, "file-feed");
}

export async function collectHotspotFeed(): Promise<HotspotFeedResult> {
  const command = process.env.HOTSPOT_COLLECT_COMMAND?.trim();
  if (command) {
    try {
      const items = await readFromCommand(command);
      if (items.length > 0) {
        return {
          items,
          mode: "command",
          note: `已通过 HOTSPOT_COLLECT_COMMAND 拉取 ${items.length} 条热点。`
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误";
      return {
        items: DEFAULT_HOTSPOTS.map((item) => ({ ...item, collectedAt: new Date().toISOString() })),
        mode: "seed",
        note: `热点命令执行失败，已回退到内置示例数据。原因：${message}`
      };
    }
  }

  const filePath = process.env.HOTSPOT_SOURCE_FILE?.trim() || HOTSPOT_FEED_PATH;
  if (existsSync(filePath)) {
    const items = readFromFile(filePath);
    if (items.length > 0) {
      return {
        items,
        mode: "file",
        note: `已从 ${filePath} 读取 ${items.length} 条热点。`
      };
    }
  }

  return {
    items: DEFAULT_HOTSPOTS.map((item) => ({ ...item, collectedAt: new Date().toISOString() })),
    mode: "seed",
    note: "未检测到外部热点源，当前使用内置示例热点。"
  };
}
