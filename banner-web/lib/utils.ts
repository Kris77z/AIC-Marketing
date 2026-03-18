import clsx from "clsx";

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "未完成";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function sizeToLabel(width: number, height: number) {
  return `${width}×${height}`;
}

export function parseSizeToken(token: string) {
  const match = token.match(/^(\d+)x(\d+)$/i);
  if (!match) {
    throw new Error(`Invalid size token: ${token}`);
  }
  return { width: Number(match[1]), height: Number(match[2]) };
}
