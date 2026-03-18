import { NextRequest, NextResponse } from "next/server";

import { buildHotspotVariants } from "@/lib/hotspot-builder";
import type { HotspotGenerateRequestBody } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as HotspotGenerateRequestBody;
    if (!body.topic?.trim()) {
      return NextResponse.json({ error: "请先填写热点主题。" }, { status: 400 });
    }

    const variants = buildHotspotVariants(body);

    return NextResponse.json({
      topic: body.topic.trim(),
      stance: body.stance,
      channel: body.channel,
      variants,
      note: "当前是 Phase 1.5 骨架版：先输出文案与视觉 prompt，占位等待 hotspot.md 规则和真实并行模型接入。"
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "热点草稿生成失败。" },
      { status: 400 }
    );
  }
}
