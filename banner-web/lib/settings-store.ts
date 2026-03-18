import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { ensureAppDirectories, SETTINGS_PATH } from "@/lib/paths";
import { DEFAULT_SETTINGS } from "@/lib/seed-data";
import type { StoredSettings } from "@/lib/types";

function normalizeImageGenBaseUrl(baseUrl: string) {
  if (baseUrl.includes("gemini-global")) {
    return baseUrl.replace("gemini-global", "gemini");
  }
  return baseUrl;
}

function resolveEnvSettings(): Partial<StoredSettings> {
  const timeoutValue = Number(process.env.IMAGE_GEN_TIMEOUT_SECONDS || process.env.GEMINI_TIMEOUT_SECONDS || "");

  return {
    apiKey: process.env.GEMINI_API_KEY || process.env.GEMINI_AUTH_KEY || "",
    baseUrl: normalizeImageGenBaseUrl(
      process.env.IMAGE_GEN_BASE_URL || process.env.GEMINI_BASE_URL || DEFAULT_SETTINGS.baseUrl
    ),
    model: process.env.IMAGE_GEN_MODEL || DEFAULT_SETTINGS.model,
    apiFormat: "gemini",
    timeoutSeconds: Number.isFinite(timeoutValue) && timeoutValue > 0 ? timeoutValue : DEFAULT_SETTINGS.timeoutSeconds
  };
}

function pickPersistedSettings(settings: Partial<StoredSettings>): Omit<StoredSettings, "apiKey"> {
  return {
    baseUrl: settings.baseUrl ?? DEFAULT_SETTINGS.baseUrl,
    model: settings.model ?? DEFAULT_SETTINGS.model,
    apiFormat: settings.apiFormat ?? DEFAULT_SETTINGS.apiFormat,
    timeoutSeconds: settings.timeoutSeconds ?? DEFAULT_SETTINGS.timeoutSeconds
  };
}

export function readSettings(): StoredSettings {
  ensureAppDirectories();
  const envSettings = resolveEnvSettings();
  if (!existsSync(SETTINGS_PATH)) {
    const seeded: StoredSettings = {
      ...DEFAULT_SETTINGS,
      ...pickPersistedSettings(envSettings),
      apiKey: envSettings.apiKey ?? ""
    };
    writeFileSync(SETTINGS_PATH, JSON.stringify(pickPersistedSettings(seeded), null, 2));
    return seeded;
  }

  const raw = readFileSync(SETTINGS_PATH, "utf8");
  const parsed = JSON.parse(raw) as Partial<StoredSettings>;
  const resolved: StoredSettings = {
    ...DEFAULT_SETTINGS,
    ...pickPersistedSettings(parsed),
    ...pickPersistedSettings(envSettings),
    apiKey: envSettings.apiKey ?? ""
  };
  return resolved;
}

export function writeSettings(nextSettings: Partial<StoredSettings>) {
  const current = readSettings();
  const merged = { ...current, ...pickPersistedSettings(nextSettings) };
  writeFileSync(SETTINGS_PATH, JSON.stringify(pickPersistedSettings(merged), null, 2));
  return merged;
}
