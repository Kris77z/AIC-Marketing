import { NextRequest, NextResponse } from "next/server";

import { prepareGenerationRequest, runPreparedGeneration } from "@/lib/generate-service";
import type { GenerateRequestBody } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as GenerateRequestBody & { previewOnly?: boolean };
  const prepared = prepareGenerationRequest(body);

  if (!prepared.finalPrompt.trim()) {
    return NextResponse.json(
      {
        error: "Prompt 不能为空。",
        prompt: prepared.finalPrompt,
        negativePrompt: prepared.finalNegativePrompt,
        strategy: prepared.strategy
      },
      { status: 400 }
    );
  }

  if (body.previewOnly) {
    return NextResponse.json({
      prompt: prepared.finalPrompt,
      negativePrompt: prepared.finalNegativePrompt,
      strategy: prepared.strategy,
      assetsUsed: prepared.selectedAssets.map((asset) => asset.slug)
    });
  }

  if (prepared.sizes.length === 0) {
    return NextResponse.json(
      {
        error: "请至少选择一个输出尺寸。",
        prompt: prepared.finalPrompt,
        negativePrompt: prepared.finalNegativePrompt,
        strategy: prepared.strategy
      },
      { status: 400 }
    );
  }

  const configuredApiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_AUTH_KEY;
  if (!configuredApiKey) {
    return NextResponse.json(
      {
        error: "缺少 API Key。请先在本地环境变量中配置 GEMINI_AUTH_KEY 或 GEMINI_API_KEY。",
        prompt: prepared.finalPrompt,
        negativePrompt: prepared.finalNegativePrompt,
        strategy: prepared.strategy
      },
      { status: 400 }
    );
  }

  const settled = await runPreparedGeneration(prepared);

  return NextResponse.json({
    prompt: settled.prompt,
    negativePrompt: settled.negativePrompt,
    strategy: settled.strategy,
    results: settled.results
  });
}
