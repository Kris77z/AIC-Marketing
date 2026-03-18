import { mkdirSync } from "node:fs";
import path from "node:path";

export const APP_ROOT = process.cwd();
export const DATA_DIR = path.join(APP_ROOT, "data");
export const OUTPUT_DIR = path.join(DATA_DIR, "output");
export const DB_PATH = path.join(DATA_DIR, "banner.db");
export const STORE_PATH = path.join(DATA_DIR, "store.json");
export const SETTINGS_PATH = path.join(DATA_DIR, "settings.json");
export const HOTSPOT_FEED_PATH = path.join(DATA_DIR, "hotspots-feed.json");
export const UPLOAD_DIR = path.join(APP_ROOT, "public", "assets", "uploads");
export const LEGACY_SKILL_ROOT = path.join(APP_ROOT, "..", "banner-image-design_副本");
export const LEGACY_GALLERY_DIR = path.join(LEGACY_SKILL_ROOT, "assets", "gallery");

export function ensureAppDirectories() {
  [DATA_DIR, OUTPUT_DIR, UPLOAD_DIR].forEach((directory) => {
    mkdirSync(directory, { recursive: true });
  });
}
