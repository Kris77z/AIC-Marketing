import { NextRequest, NextResponse } from "next/server";

import { readSettings, writeSettings } from "@/lib/settings-store";

export async function GET() {
  return NextResponse.json(readSettings());
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Record<string, unknown>;
  if (typeof body.apiKey === "string" && body.apiKey.trim()) {
    return NextResponse.json(
      { message: "API Key 已改为只支持服务端环境变量，请在 .env.local 中配置。" },
      { status: 400 }
    );
  }

  const settings = writeSettings({
    baseUrl: typeof body.baseUrl === "string" ? body.baseUrl : undefined,
    model: typeof body.model === "string" ? body.model : undefined,
    apiFormat:
      body.apiFormat === "gemini" || body.apiFormat === "openai" || body.apiFormat === "auto"
        ? body.apiFormat
        : undefined,
    timeoutSeconds: typeof body.timeoutSeconds === "number" ? body.timeoutSeconds : undefined
  });

  return NextResponse.json({ message: "设置已保存", settings });
}
