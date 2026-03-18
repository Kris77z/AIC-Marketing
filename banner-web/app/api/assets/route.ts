import { mkdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

import { deleteAsset, insertAsset, listAssets, updateAsset } from "@/lib/db";
import { buildImageUrl } from "@/lib/image-routes";
import { UPLOAD_DIR } from "@/lib/paths";
import type { AssetRecord, AssetType, LockMode } from "@/lib/types";
import { slugify } from "@/lib/utils";

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

const typeDirectory: Record<AssetType, string> = {
  mascot: "mascots",
  logo: "logos",
  "style-ref": "style-refs"
};

function normalizeListField(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeAssetType(value: FormDataEntryValue | null): AssetType {
  const raw = String(value ?? "");
  if (raw === "mascot" || raw === "logo" || raw === "style-ref") {
    return raw;
  }
  throw new Error("不支持的素材类型。");
}

function normalizeLockMode(value: FormDataEntryValue | null): LockMode | null {
  const raw = String(value ?? "");
  if (raw === "strong" || raw === "loose") {
    return raw;
  }
  return null;
}

function extensionFromName(name: string) {
  const extension = path.extname(name).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg" || extension === ".webp") {
    return extension;
  }
  return ".png";
}

async function saveUpload(file: File, assetType: AssetType, slug: string) {
  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error("图片不能超过 5MB。");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const directory = path.join(UPLOAD_DIR, typeDirectory[assetType]);
  await mkdir(directory, { recursive: true });
  const filePath = path.join(directory, `${slug}${extensionFromName(file.name)}`);
  await writeFile(filePath, bytes);
  return filePath;
}

async function maybeRenameExistingFile(asset: AssetRecord, nextSlug: string, nextType: AssetType) {
  if (!asset.filePath.startsWith(UPLOAD_DIR)) {
    return asset.filePath;
  }

  const directory = path.join(UPLOAD_DIR, typeDirectory[nextType]);
  await mkdir(directory, { recursive: true });
  const nextPath = path.join(directory, `${nextSlug}${path.extname(asset.filePath).toLowerCase() || ".png"}`);
  if (nextPath === asset.filePath) {
    return asset.filePath;
  }
  await rename(asset.filePath, nextPath);
  return nextPath;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const assets = listAssets()
    .filter((asset) => (type ? asset.type === type : true))
    .map((asset) => ({ ...asset, imageUrl: buildImageUrl(asset.filePath) }));
  return NextResponse.json({ assets });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "请先选择图片文件。" }, { status: 400 });
    }

    const type = normalizeAssetType(formData.get("type"));
    const name = String(formData.get("name") ?? "").trim();
    const slug = slugify(String(formData.get("slug") ?? name));
    if (!name || !slug) {
      return NextResponse.json({ error: "名称和 slug 不能为空。" }, { status: 400 });
    }

    if (listAssets().some((asset) => asset.slug === slug)) {
      return NextResponse.json({ error: "slug 已存在，请换一个。" }, { status: 409 });
    }

    const asset: AssetRecord = {
      id: crypto.randomUUID(),
      slug,
      type,
      name,
      filePath: await saveUpload(file, type, slug),
      lockMode: type === "mascot" ? normalizeLockMode(formData.get("lockMode")) : null,
      constraints: normalizeListField(formData.get("constraints")),
      brandColor: type === "logo" ? String(formData.get("brandColor") ?? "").trim() || null : null,
      tags: normalizeListField(formData.get("tags")),
      createdAt: new Date().toISOString()
    };

    insertAsset(asset);
    return NextResponse.json({ asset: { ...asset, imageUrl: buildImageUrl(asset.filePath) } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "素材上传失败。" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const formData = await request.formData();
    const id = String(formData.get("id") ?? "").trim();
    if (!id) {
      return NextResponse.json({ error: "缺少素材 id。" }, { status: 400 });
    }

    const current = listAssets().find((asset) => asset.id === id);
    if (!current) {
      return NextResponse.json({ error: "素材不存在。" }, { status: 404 });
    }

    const nextType = formData.get("type") ? normalizeAssetType(formData.get("type")) : current.type;
    const nextName = String(formData.get("name") ?? current.name).trim();
    const nextSlug = slugify(String(formData.get("slug") ?? current.slug));
    if (!nextName || !nextSlug) {
      return NextResponse.json({ error: "名称和 slug 不能为空。" }, { status: 400 });
    }

    if (listAssets().some((asset) => asset.id !== id && asset.slug === nextSlug)) {
      return NextResponse.json({ error: "slug 已存在，请换一个。" }, { status: 409 });
    }

    const upload = formData.get("file");
    const nextFilePath =
      upload instanceof File && upload.size > 0
        ? await saveUpload(upload, nextType, nextSlug)
        : await maybeRenameExistingFile(current, nextSlug, nextType);

    if (
      upload instanceof File &&
      upload.size > 0 &&
      current.filePath.startsWith(UPLOAD_DIR) &&
      current.filePath !== nextFilePath
    ) {
      await unlink(current.filePath).catch(() => undefined);
    }

    const asset = updateAsset(id, {
      type: nextType,
      name: nextName,
      slug: nextSlug,
      filePath: nextFilePath,
      lockMode: nextType === "mascot" ? normalizeLockMode(formData.get("lockMode")) : null,
      constraints: formData.get("constraints") ? normalizeListField(formData.get("constraints")) : current.constraints,
      brandColor:
        nextType === "logo"
          ? String(formData.get("brandColor") ?? current.brandColor ?? "").trim() || null
          : null,
      tags: formData.get("tags") ? normalizeListField(formData.get("tags")) : current.tags
    });

    return NextResponse.json({ asset: { ...asset, imageUrl: buildImageUrl(asset.filePath) } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "素材更新失败。" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: "缺少素材 id。" }, { status: 400 });
    }

    const removed = deleteAsset(body.id);
    if (removed.filePath.startsWith(UPLOAD_DIR)) {
      await unlink(removed.filePath).catch(() => undefined);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "素材删除失败。" },
      { status: 400 }
    );
  }
}
