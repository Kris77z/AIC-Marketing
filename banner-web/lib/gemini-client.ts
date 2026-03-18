import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import type { ApiFormat } from "@/lib/types";

interface RequestOptions {
  apiKey: string;
  baseUrl: string;
  model: string;
  apiFormat: ApiFormat;
  timeoutSeconds: number;
  prompt: string;
  negativePrompt: string;
  width: number;
  height: number;
  references?: string[];
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: { data?: string };
        inline_data?: { data?: string };
      }>;
    };
  }>;
  choices?: Array<{
    message?: {
      images?: Array<{
        b64_json?: string;
        image_url?: { url?: string };
      }>;
    };
  }>;
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
  error?: {
    message?: string;
    status?: string;
  };
}

interface EncodedReference {
  mimeType: string;
  data: string;
}

const MAX_REFERENCE_EDGE = 1600;
const SMALL_REFERENCE_BYTES = 450 * 1024;

function isOfficialGeminiBaseUrl(baseUrl: string) {
  return baseUrl.includes("generativelanguage.googleapis.com");
}

function isRelayGeminiBaseUrl(baseUrl: string) {
  return !isOfficialGeminiBaseUrl(baseUrl);
}

function normalizeImageGenBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/$/, "");
  if (trimmed.includes("gemini-global")) {
    return trimmed.replace("gemini-global", "gemini");
  }
  return trimmed;
}

function aspectRatioFromSize(width: number, height: number) {
  const ratio = width / height;
  const known = [
    ["16:9", 16 / 9],
    ["4:3", 4 / 3],
    ["3:2", 3 / 2],
    ["1:1", 1],
    ["9:16", 9 / 16]
  ] as const;
  return known.reduce((best, item) =>
    Math.abs(item[1] - ratio) < Math.abs(best[1] - ratio) ? item : best
  )[0];
}

function imageSizeTier(width: number, height: number) {
  const longest = Math.max(width, height);
  if (longest >= 3000) {
    return "4K";
  }
  if (longest >= 1800) {
    return "2K";
  }
  return "1K";
}

function guessMimeType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }
  if (extension === ".webp") {
    return "image/webp";
  }
  return "image/png";
}

async function encodeReference(filePath: string): Promise<EncodedReference> {
  const bytes = await readFile(filePath);
  if (bytes.byteLength <= SMALL_REFERENCE_BYTES) {
    return {
      mimeType: guessMimeType(filePath),
      data: Buffer.from(bytes).toString("base64")
    };
  }

  const image = sharp(bytes, { failOn: "none" }).rotate();
  const metadata = await image.metadata();
  const resized = image.resize({
    width: MAX_REFERENCE_EDGE,
    height: MAX_REFERENCE_EDGE,
    fit: "inside",
    withoutEnlargement: true
  });

  const output = metadata.hasAlpha
    ? await resized.webp({ quality: 80, alphaQuality: 80 }).toBuffer()
    : await resized.jpeg({ quality: 82, mozjpeg: true }).toBuffer();

  return {
    mimeType: metadata.hasAlpha ? "image/webp" : "image/jpeg",
    data: output.toString("base64")
  };
}

async function buildGeminiPayload(options: RequestOptions) {
  const referenceParts = await Promise.all(
    (options.references ?? []).map(async (referencePath) => {
      const encoded = await encodeReference(referencePath);
      return {
        inline_data: {
          mime_type: encoded.mimeType,
          data: encoded.data
        }
      };
    })
  );

  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${options.prompt} Avoid: ${options.negativePrompt}. Target banner size: ${options.width}x${options.height}.`
          },
          ...referenceParts
        ]
      }
    ],
    generationConfig: {
      ...(isRelayGeminiBaseUrl(options.baseUrl)
        ? {
            response_modalities: ["IMAGE", "TEXT"],
            image_config: {
              aspect_ratio: aspectRatioFromSize(options.width, options.height),
              image_size: imageSizeTier(options.width, options.height)
            }
          }
        : {
            responseModalities: ["IMAGE", "TEXT"],
            imageConfig: {
              aspectRatio: aspectRatioFromSize(options.width, options.height),
              imageSize: imageSizeTier(options.width, options.height)
            }
          })
    }
  };
}

async function buildOpenAiPayload(options: RequestOptions) {
  const references = await Promise.all(
    (options.references ?? []).map(async (referencePath) => {
      const encoded = await encodeReference(referencePath);
      return {
        type: "image_url",
        image_url: {
          url: `data:${encoded.mimeType};base64,${encoded.data}`
        }
      };
    })
  );

  return {
    model: options.model,
    stream: false,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `${options.prompt} Avoid: ${options.negativePrompt}. Target banner size: ${options.width}x${options.height}.`
          },
          ...references
        ]
      }
    ],
    extra_body: {
      google: {
        image_config: {
          aspect_ratio: aspectRatioFromSize(options.width, options.height),
          image_size: imageSizeTier(options.width, options.height)
        }
      }
    }
  };
}

function resolveGeminiUrl(baseUrl: string, model: string) {
  const normalizedBase = normalizeImageGenBaseUrl(baseUrl);
  if (isOfficialGeminiBaseUrl(normalizedBase)) {
    return `${normalizedBase}/v1beta/models/${model}:generateContent`;
  }
  return `${normalizedBase}/${model}:generateContent`;
}

function resolveOpenAiUrl(baseUrl: string) {
  return `${baseUrl.replace(/\/$/, "")}/v1beta/openai/chat/completions`;
}

function responseErrorMessage(json: GeminiResponse, status: number) {
  if (json.error?.message) {
    return `${status}${json.error.status ? ` ${json.error.status}` : ""}: ${json.error.message}`;
  }
  return `Request failed with status ${status}`;
}

function extractImageBytes(json: GeminiResponse) {
  for (const candidate of json.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      const data = part.inlineData?.data ?? part.inline_data?.data;
      if (data) {
        return Buffer.from(data, "base64");
      }
    }
  }

  for (const choice of json.choices ?? []) {
    for (const image of choice.message?.images ?? []) {
      if (image.b64_json) {
        return Buffer.from(image.b64_json, "base64");
      }
      const url = image.image_url?.url;
      if (url?.startsWith("data:")) {
        const encoded = url.split(",")[1];
        if (encoded) {
          return Buffer.from(encoded, "base64");
        }
      }
    }
  }

  for (const item of json.data ?? []) {
    if (item.b64_json) {
      return Buffer.from(item.b64_json, "base64");
    }
    if (item.url?.startsWith("data:")) {
      const encoded = item.url.split(",")[1];
      if (encoded) {
        return Buffer.from(encoded, "base64");
      }
    }
  }

  throw new Error("API response did not contain image bytes.");
}

async function postJson(url: string, apiKey: string, body: unknown, timeoutSeconds: number, openaiCompatible: boolean) {
  const usesOfficialGeminiHost = url.includes("generativelanguage.googleapis.com");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(openaiCompatible
        ? { Authorization: `Bearer ${apiKey}` }
        : usesOfficialGeminiHost
          ? { "x-goog-api-key": apiKey }
          : { "x-auth-key": apiKey })
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutSeconds * 1000)
  });
  const rawText = await response.text();
  let json: GeminiResponse | null = null;
  try {
    json = JSON.parse(rawText) as GeminiResponse;
  } catch {
    const preview = rawText.replace(/\s+/g, " ").slice(0, 160);
    throw new Error(
      `${response.status} ${response.statusText}: upstream returned non-JSON response (${response.headers.get("content-type") ?? "unknown"}). ${preview}`
    );
  }

  if (!response.ok) {
    throw new Error(responseErrorMessage(json, response.status));
  }
  return json;
}

function shouldTryOpenAiFallback(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("404") || normalized.includes("chat/completions") || normalized.includes("openai_error");
}

export async function generateImage(options: RequestOptions) {
  const geminiPayload = await buildGeminiPayload(options);
  const openAiPayload = await buildOpenAiPayload(options);

  if (options.apiFormat === "openai") {
    const response = await postJson(
      resolveOpenAiUrl(options.baseUrl),
      options.apiKey,
      openAiPayload,
      options.timeoutSeconds,
      true
    );
    return extractImageBytes(response);
  }

  try {
    const response = await postJson(
      resolveGeminiUrl(options.baseUrl, options.model),
      options.apiKey,
      geminiPayload,
      options.timeoutSeconds,
      false
    );
    return extractImageBytes(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (options.apiFormat === "auto" && shouldTryOpenAiFallback(message)) {
      const response = await postJson(
        resolveOpenAiUrl(options.baseUrl),
        options.apiKey,
        openAiPayload,
        options.timeoutSeconds,
        true
      );
      return extractImageBytes(response);
    }
    throw error;
  }
}
