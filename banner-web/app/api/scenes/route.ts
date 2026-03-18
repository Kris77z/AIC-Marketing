import { NextRequest, NextResponse } from "next/server";

import { deleteScene, getSceneById, insertScene, listScenes, updateScene } from "@/lib/db";
import type { BriefField, SceneRecord, SceneType } from "@/lib/types";
import { slugify } from "@/lib/utils";

function normalizeSceneType(value: unknown): SceneType {
  if (
    value === "festive" ||
    value === "collab" ||
    value === "product" ||
    value === "mascot-led" ||
    value === "generic"
  ) {
    return value;
  }
  throw new Error("不支持的场景类型。");
}

function normalizeBriefSchema(value: unknown): BriefField[] {
  if (!Array.isArray(value)) {
    throw new Error("Brief 字段定义必须是数组。");
  }
  return value as BriefField[];
}

function normalizeStringList(value: unknown, label: string) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} 必须是数组。`);
  }
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export async function GET(request: NextRequest) {
  const sceneId = request.nextUrl.searchParams.get("id");
  if (sceneId) {
    const scene = getSceneById(sceneId);
    if (!scene) {
      return NextResponse.json({ error: "场景不存在。" }, { status: 404 });
    }
    return NextResponse.json({ scene });
  }
  return NextResponse.json({ scenes: listScenes() });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      sourceSceneId?: string;
      name?: string;
      sceneType?: SceneType;
      briefSchema?: BriefField[];
      defaultAssets?: string[];
      defaultSizes?: string[];
      promptOverrides?: string[];
    };

    const source = body.sourceSceneId ? getSceneById(body.sourceSceneId) : null;
    const name = String(body.name ?? source?.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "场景名称不能为空。" }, { status: 400 });
    }

    const scene: SceneRecord = {
      id: `scene-${slugify(name)}-${crypto.randomUUID().slice(0, 6)}`,
      name,
      sceneType: normalizeSceneType(body.sceneType ?? source?.sceneType ?? "generic"),
      briefSchema: normalizeBriefSchema(body.briefSchema ?? source?.briefSchema ?? []),
      defaultAssets: normalizeStringList(body.defaultAssets ?? source?.defaultAssets ?? [], "默认素材"),
      defaultSizes: normalizeStringList(body.defaultSizes ?? source?.defaultSizes ?? ["1536x1024"], "默认尺寸"),
      promptOverrides: normalizeStringList(body.promptOverrides ?? source?.promptOverrides ?? [], "Prompt 覆盖"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    insertScene(scene);
    return NextResponse.json({ scene });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "场景创建失败。" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<SceneRecord> & { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: "缺少场景 id。" }, { status: 400 });
    }

    const current = getSceneById(body.id);
    if (!current) {
      return NextResponse.json({ error: "场景不存在。" }, { status: 404 });
    }

    const scene = updateScene(body.id, {
      name: body.name ? String(body.name).trim() : current.name,
      sceneType: body.sceneType ? normalizeSceneType(body.sceneType) : current.sceneType,
      briefSchema: body.briefSchema ? normalizeBriefSchema(body.briefSchema) : current.briefSchema,
      defaultAssets: body.defaultAssets ? normalizeStringList(body.defaultAssets, "默认素材") : current.defaultAssets,
      defaultSizes: body.defaultSizes ? normalizeStringList(body.defaultSizes, "默认尺寸") : current.defaultSizes,
      promptOverrides: body.promptOverrides
        ? normalizeStringList(body.promptOverrides, "Prompt 覆盖")
        : current.promptOverrides,
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ scene });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "场景更新失败。" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: "缺少场景 id。" }, { status: 400 });
    }
    deleteScene(body.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "场景删除失败。" },
      { status: 400 }
    );
  }
}
