import { NextResponse } from "next/server";

import { syncHotspots } from "@/lib/pipeline-runner";

export async function POST() {
  try {
    const result = await syncHotspots();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "热点同步失败。" },
      { status: 400 }
    );
  }
}
