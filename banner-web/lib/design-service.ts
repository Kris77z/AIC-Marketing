import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";

import { getAssetsBySlugs, insertJob } from "@/lib/db";
import { DESIGN_TEMPLATES, type DesignTemplateContent } from "@/lib/design-templates";
import { renderDesignSvg } from "@/lib/design-renderer";
import { buildImageUrl } from "@/lib/image-routes";
import { OUTPUT_DIR } from "@/lib/paths";
import type { GenerateResultItem, HotspotRecord, JobRecord, PipelinePlan } from "@/lib/types";
import { slugify } from "@/lib/utils";

function fileToDataUrl(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  const mimeType =
    extension === ".jpg" || extension === ".jpeg"
      ? "image/jpeg"
      : extension === ".webp"
        ? "image/webp"
        : extension === ".svg"
          ? "image/svg+xml"
          : "image/png";

  const buffer = readFileSync(filePath);
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function resolveDesignContent(hotspot: HotspotRecord, plan: PipelinePlan) {
  const template = DESIGN_TEMPLATES.find((item) => item.id === plan.templateId) ?? DESIGN_TEMPLATES[0];
  const assets = getAssetsBySlugs(plan.selectedAssetSlugs);
  const backgroundAsset = assets.find((asset) => asset.type === "style-ref");
  const heroAsset = assets.find((asset) => asset.type === "mascot") ?? backgroundAsset;
  const logoAsset = assets.find((asset) => asset.type === "logo");

  const content: DesignTemplateContent = {
    ...template.defaultContent,
    title: plan.designContent?.title ?? hotspot.title,
    subtitle: plan.designContent?.subtitle ?? hotspot.summary,
    cta: plan.designContent?.cta ?? "查看热点解读",
    eyebrow: plan.designContent?.eyebrow ?? "AIC HOTSPOT",
    backgroundColor: plan.designContent?.backgroundColor ?? template.defaultContent.backgroundColor,
    accentColor: plan.designContent?.accentColor ?? logoAsset?.brandColor ?? template.defaultContent.accentColor,
    textColor: plan.designContent?.textColor ?? template.defaultContent.textColor,
    backgroundImageSlug: plan.designContent?.backgroundImageSlug ?? backgroundAsset?.slug ?? "",
    heroImageSlug: plan.designContent?.heroImageSlug ?? heroAsset?.slug ?? "",
    logoSlug: plan.designContent?.logoSlug ?? logoAsset?.slug ?? ""
  };

  return {
    template,
    content,
    assetDataUrls: {
      backgroundImageDataUrl: backgroundAsset ? fileToDataUrl(backgroundAsset.filePath) : undefined,
      heroImageDataUrl: heroAsset ? fileToDataUrl(heroAsset.filePath) : undefined,
      logoImageDataUrl: logoAsset ? fileToDataUrl(logoAsset.filePath) : undefined
    }
  };
}

export async function runAutomatedDesignProduction({
  hotspot,
  plan
}: {
  hotspot: HotspotRecord;
  plan: PipelinePlan;
}) {
  const { template, content, assetDataUrls } = resolveDesignContent(hotspot, plan);

  const results = await Promise.all(
    plan.sizes.map(async (size) => {
      const svg = renderDesignSvg({
        template,
        content,
        size,
        assets: assetDataUrls
      });

      const fileName = `${new Date().toISOString().slice(0, 10)}_${slugify(plan.title)}_${size.width}x${size.height}_${crypto.randomUUID()}.svg`;
      const outputPath = path.join(OUTPUT_DIR, fileName);
      await writeFile(outputPath, svg, "utf8");

      const job: JobRecord = {
        id: crypto.randomUUID(),
        jobType: "hotspot",
        title: plan.title,
        sceneId: null,
        status: "done",
        briefInput: {
          hotspotId: hotspot.id,
          templateId: template.id,
          content
        },
        generatedPrompt: plan.reasoning,
        negativePrompt: null,
        model: "html-design-auto",
        width: size.width,
        height: size.height,
        outputPath,
        errorMessage: null,
        assetsUsed: plan.selectedAssetSlugs,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      };

      insertJob(job);
      return {
        job,
        imageUrl: buildImageUrl(outputPath) ?? undefined
      } satisfies GenerateResultItem;
    })
  );

  return results;
}
