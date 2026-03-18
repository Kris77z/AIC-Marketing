import path from "node:path";

import { LEGACY_GALLERY_DIR, OUTPUT_DIR, UPLOAD_DIR } from "@/lib/paths";

function toEncodedPath(prefix: string, absolutePath: string, baseDir: string) {
  const relative = path.relative(baseDir, absolutePath);
  const segments = relative.split(path.sep).filter(Boolean).map(encodeURIComponent);
  return `/api/images/${prefix}/${segments.join("/")}`;
}

export function buildImageUrl(absolutePath: string | null | undefined) {
  if (!absolutePath) {
    return null;
  }
  if (absolutePath.startsWith(OUTPUT_DIR)) {
    return toEncodedPath("output", absolutePath, OUTPUT_DIR);
  }
  if (absolutePath.startsWith(UPLOAD_DIR)) {
    return toEncodedPath("upload", absolutePath, UPLOAD_DIR);
  }
  if (absolutePath.startsWith(LEGACY_GALLERY_DIR)) {
    return toEncodedPath("gallery", absolutePath, LEGACY_GALLERY_DIR);
  }
  return null;
}
