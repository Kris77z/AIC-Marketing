"use client";

import { useEffect, useMemo, useState } from "react";

import { EditorPanel } from "@/components/design/EditorPanel";
import { PreviewCanvas } from "@/components/design/PreviewCanvas";
import { TemplateSelector } from "@/components/design/TemplateSelector";
import { DESIGN_TEMPLATES, type DesignTemplateContent } from "@/lib/design-templates";
import { buildDesignHtmlDocument, renderDesignSvg, svgToDataUrl } from "@/lib/design-renderer";
import type { AssetRecord, GenerateSize, JobRecord } from "@/lib/types";

type AssetView = AssetRecord & { imageUrl?: string | null };

async function urlToDataUrl(url: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("读取素材图片失败"));
    reader.readAsDataURL(blob);
  });
}

async function svgToPngDataUrl(svg: string, size: GenerateSize) {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("设计稿渲染失败"));
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("浏览器不支持 Canvas 导出");
    }
    context.drawImage(image, 0, 0, size.width, size.height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function DesignWorkbench({ assets, embedded = false }: { assets: AssetView[]; embedded?: boolean }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(DESIGN_TEMPLATES[0].id);
  const selectedTemplate = useMemo(
    () => DESIGN_TEMPLATES.find((item) => item.id === selectedTemplateId) ?? DESIGN_TEMPLATES[0],
    [selectedTemplateId]
  );
  const [content, setContent] = useState<DesignTemplateContent>(selectedTemplate.defaultContent);
  const [sizes, setSizes] = useState<GenerateSize[]>([{ width: 1536, height: 1024 }]);
  const [previewSize, setPreviewSize] = useState<GenerateSize>({ width: 1536, height: 1024 });
  const [customSize, setCustomSize] = useState({ width: "1200", height: "628" });
  const [assetDataUrls, setAssetDataUrls] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setContent(selectedTemplate.defaultContent);
  }, [selectedTemplate]);

  useEffect(() => {
    const slugs = [content.backgroundImageSlug, content.heroImageSlug, content.logoSlug].filter(Boolean);
    if (slugs.length === 0) {
      setAssetDataUrls({});
      return;
    }

    let cancelled = false;
    async function hydrateAssets() {
      const pairs = await Promise.all(
        slugs.map(async (slug) => {
          const asset = assets.find((item) => item.slug === slug);
          if (!asset?.imageUrl) {
            return [slug, ""] as const;
          }
          return [slug, await urlToDataUrl(asset.imageUrl)] as const;
        })
      );
      if (!cancelled) {
        setAssetDataUrls(Object.fromEntries(pairs.filter((pair) => pair[1])));
      }
    }

    void hydrateAssets().catch(() => {
      if (!cancelled) {
        setMessage("部分素材预览加载失败，导出时可能会缺图。");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [assets, content.backgroundImageSlug, content.heroImageSlug, content.logoSlug]);

  const previewSvg = useMemo(
    () =>
      renderDesignSvg({
        template: selectedTemplate,
        content,
        size: previewSize,
        assets: {
          backgroundImageDataUrl: assetDataUrls[content.backgroundImageSlug],
          heroImageDataUrl: assetDataUrls[content.heroImageSlug],
          logoImageDataUrl: assetDataUrls[content.logoSlug]
        }
      }),
    [assetDataUrls, content, previewSize, selectedTemplate]
  );

  const templatePreviewUrls = useMemo(
    () =>
      Object.fromEntries(
        DESIGN_TEMPLATES.map((template) => {
          const svg = renderDesignSvg({
            template,
            content: template.defaultContent,
            size: { width: 960, height: 720 }
          });
          return [template.id, svgToDataUrl(svg)];
        })
      ),
    []
  );

  function downloadTextFile(contentText: string, fileName: string, mimeType: string) {
    const blob = new Blob([contentText], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleExport() {
    if (sizes.length === 0) {
      setMessage("请至少选择一个导出尺寸。");
      return;
    }

    setExporting(true);
    setMessage("");
    try {
      const items = await Promise.all(
        sizes.map(async (size) => {
          const svg = renderDesignSvg({
            template: selectedTemplate,
            content,
            size,
            assets: {
              backgroundImageDataUrl: assetDataUrls[content.backgroundImageSlug],
              heroImageDataUrl: assetDataUrls[content.heroImageSlug],
              logoImageDataUrl: assetDataUrls[content.logoSlug]
            }
          });
          return {
            title: content.title,
            templateId: selectedTemplate.id,
            width: size.width,
            height: size.height,
            dataUrl: await svgToPngDataUrl(svg, size)
          };
        })
      );

      const response = await fetch("/api/design/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items })
      });
      const json = (await response.json()) as { error?: string; jobs?: Array<JobRecord & { imageUrl?: string | null }> };
      if (!response.ok) {
        throw new Error(json.error ?? "导出失败");
      }

      items.forEach((item) => {
        const anchor = document.createElement("a");
        anchor.href = item.dataUrl;
        anchor.download = `${content.title || selectedTemplate.name}_${item.width}x${item.height}.png`;
        anchor.click();
      });

      setMessage(`已导出 ${items.length} 张 PNG，并同步写入图库。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "导出失败");
    } finally {
      setExporting(false);
    }
  }

  function handleExportSvg() {
    const fileName = `${content.title || selectedTemplate.name}_${previewSize.width}x${previewSize.height}.svg`;
    downloadTextFile(previewSvg, fileName, "image/svg+xml;charset=utf-8");
    setMessage("SVG 源码已导出。");
  }

  function handleExportHtml() {
    const html = buildDesignHtmlDocument(previewSvg, content.title || selectedTemplate.name);
    const fileName = `${content.title || selectedTemplate.name}_${previewSize.width}x${previewSize.height}.html`;
    downloadTextFile(html, fileName, "text/html;charset=utf-8");
    setMessage("HTML 源码已导出。");
  }

  return (
    <div className="space-y-6">
      {!embedded ? (
        <header className="panel rounded-[34px] px-8 py-7 shadow-soft">
          <div className="max-w-4xl">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">HTML Design Lab</div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">不用等 AI，先用固定版式把稿子快速排出来</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)]">
              这是 Phase 1.5 的第一块：先用固定模板、品牌色和素材库，把促销、新品、活动这些高频稿件快速出成 PNG。
            </p>
          </div>
        </header>
      ) : null}

      <TemplateSelector
        templates={DESIGN_TEMPLATES}
        selectedTemplateId={selectedTemplate.id}
        onSelect={setSelectedTemplateId}
        previewUrls={templatePreviewUrls}
      />

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <EditorPanel
          content={content}
          assets={assets}
          sizes={sizes}
          customSize={customSize}
          onContentChange={(patch) => setContent((current) => ({ ...current, ...patch }))}
          onSizesChange={setSizes}
          onCustomSizeChange={(patch) => setCustomSize((current) => ({ ...current, ...patch }))}
          exporting={exporting}
          onExport={() => void handleExport()}
        />
        <PreviewCanvas
          svgDataUrl={svgToDataUrl(previewSvg)}
          size={previewSize}
          onSizeChange={setPreviewSize}
          availableSizes={sizes.length > 0 ? sizes : [{ width: 1536, height: 1024 }]}
        />
      </div>

      <section className="rounded-[28px] border border-black/8 bg-white/80 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-ink">源码导出</div>
            <div className="mt-1 text-sm text-[var(--muted)]">如果你想在外部再微调，也可以把当前版本导成 SVG 或 HTML。</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm text-ink"
              onClick={handleExportSvg}
            >
              导出 SVG
            </button>
            <button
              type="button"
              className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm text-ink"
              onClick={handleExportHtml}
            >
              导出 HTML
            </button>
          </div>
        </div>
      </section>

      {message ? <div className="rounded-[24px] border border-black/8 bg-white/80 px-5 py-4 text-sm text-ink">{message}</div> : null}
    </div>
  );
}
