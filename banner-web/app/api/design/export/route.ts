import { writeFile } from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

import { insertJob } from "@/lib/db";
import { buildImageUrl } from "@/lib/image-routes";
import { OUTPUT_DIR } from "@/lib/paths";
import type { JobRecord } from "@/lib/types";
import { slugify } from "@/lib/utils";

function fromDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:image\/png;base64,(.+)$/);
  if (!match) {
    throw new Error("只支持 PNG 导出。");
  }
  return Buffer.from(match[1], "base64");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      items?: Array<{
        title?: string;
        templateId?: string;
        width: number;
        height: number;
        dataUrl: string;
      }>;
    };

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: "没有可导出的设计稿。" }, { status: 400 });
    }

    const jobs = await Promise.all(
      body.items.map(async (item) => {
        const bytes = fromDataUrl(item.dataUrl);
        const title = item.title?.trim() || "HTML 设计稿";
        const fileName = `${new Date().toISOString().slice(0, 10)}_${slugify(title)}_${item.width}x${item.height}_${crypto.randomUUID()}.png`;
        const outputPath = path.join(OUTPUT_DIR, fileName);
        await writeFile(outputPath, bytes);

        const job: JobRecord = {
          id: crypto.randomUUID(),
          jobType: "design",
          title,
          sceneId: null,
          status: "done",
          briefInput: {
            templateId: item.templateId ?? "unknown"
          },
          generatedPrompt: null,
          negativePrompt: null,
          model: "html-design",
          width: item.width,
          height: item.height,
          outputPath,
          errorMessage: null,
          assetsUsed: [],
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        };

        insertJob(job);
        return {
          ...job,
          imageUrl: buildImageUrl(outputPath)
        };
      })
    );

    return NextResponse.json({ jobs });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "设计稿导出失败。" },
      { status: 400 }
    );
  }
}
