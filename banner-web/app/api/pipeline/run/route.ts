import { NextRequest, NextResponse } from "next/server";

import { runHotspotPipeline, syncHotspots } from "@/lib/pipeline-runner";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      hotspotIds?: string[];
      limit?: number;
      collectFirst?: boolean;
    };

    const shouldCollectFirst = body.collectFirst ?? true;
    const syncResult = shouldCollectFirst ? await syncHotspots() : null;
    const runs = await runHotspotPipeline({
      hotspotIds: body.hotspotIds,
      limit: body.limit
    });

    return NextResponse.json({
      sync: syncResult,
      runs
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "自动出稿失败。" },
      { status: 400 }
    );
  }
}
