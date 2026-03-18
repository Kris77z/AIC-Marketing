import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

import { LEGACY_GALLERY_DIR, OUTPUT_DIR, UPLOAD_DIR } from "@/lib/paths";

const baseDirectories = {
  output: OUTPUT_DIR,
  upload: UPLOAD_DIR,
  gallery: LEGACY_GALLERY_DIR
} as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const [bucket, ...segments] = resolvedParams.path;

  if (!bucket || !(bucket in baseDirectories)) {
    return new NextResponse("Unsupported image bucket", { status: 400 });
  }

  const decodedSegments = segments.map(decodeURIComponent);
  const absolutePath = path.resolve(baseDirectories[bucket as keyof typeof baseDirectories], ...decodedSegments);

  if (!absolutePath.startsWith(baseDirectories[bucket as keyof typeof baseDirectories])) {
    return new NextResponse("Invalid path", { status: 400 });
  }

  if (!existsSync(absolutePath)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const bytes = readFileSync(absolutePath);
  const extension = path.extname(absolutePath).toLowerCase();
  const contentType =
    extension === ".jpg" || extension === ".jpeg"
      ? "image/jpeg"
      : extension === ".webp"
        ? "image/webp"
        : "image/png";

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
