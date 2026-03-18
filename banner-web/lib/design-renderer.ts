import type { GenerateSize } from "@/lib/types";

import type { DesignTemplateContent, DesignTemplateDefinition } from "@/lib/design-templates";

interface RenderOptions {
  template: DesignTemplateDefinition;
  content: DesignTemplateContent;
  size: GenerateSize;
  assets?: {
    backgroundImageDataUrl?: string;
    heroImageDataUrl?: string;
    logoImageDataUrl?: string;
  };
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function layoutBlock(templateId: string, content: DesignTemplateContent, width: number, height: number, assets?: RenderOptions["assets"]) {
  const titleSize = Math.max(42, Math.round(width * 0.042));
  const subtitleSize = Math.max(18, Math.round(width * 0.016));
  const eyebrowSize = Math.max(12, Math.round(width * 0.01));
  const cardBackground = content.textColor === "#ffffff" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.68)";
  const darkCard = "rgba(17,19,24,0.56)";

  const backgroundImage = assets?.backgroundImageDataUrl
    ? `<image href="${assets.backgroundImageDataUrl}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" opacity="0.32" />`
    : "";

  const logoImage = assets?.logoImageDataUrl
    ? `<image href="${assets.logoImageDataUrl}" x="${width - 168}" y="44" width="124" height="124" preserveAspectRatio="xMidYMid meet" />`
    : "";

  const heroImage = assets?.heroImageDataUrl
    ? `<image href="${assets.heroImageDataUrl}" x="${width * 0.58}" y="${height * 0.16}" width="${width * 0.32}" height="${height * 0.68}" preserveAspectRatio="xMidYMid meet" />`
    : "";

  const commonText = `
    <div xmlns="http://www.w3.org/1999/xhtml" style="display:flex;flex-direction:column;height:100%;color:${content.textColor};font-family:'Space Grotesk','Manrope',Arial,sans-serif;">
      <div style="font-size:${eyebrowSize}px;letter-spacing:0.34em;text-transform:uppercase;font-weight:700;color:${content.accentColor};">${escapeXml(content.eyebrow)}</div>
      <div style="margin-top:18px;font-size:${titleSize}px;line-height:1.02;font-weight:700;max-width:12ch;">${escapeXml(content.title)}</div>
      <div style="margin-top:18px;font-size:${subtitleSize}px;line-height:1.55;max-width:36ch;opacity:0.86;">${escapeXml(content.subtitle)}</div>
      <div style="margin-top:auto;display:inline-flex;width:max-content;align-items:center;gap:10px;border-radius:999px;background:${content.accentColor};color:${content.textColor === "#ffffff" ? "#111318" : "#ffffff"};padding:12px 18px;font-size:${Math.max(14, Math.round(width * 0.011))}px;font-weight:700;">${escapeXml(content.cta)}</div>
    </div>
  `;

  if (templateId === "split-hero") {
    return `
      ${backgroundImage}
      <rect x="0" y="0" width="${width * 0.46}" height="${height}" fill="${content.accentColor}" opacity="0.12" />
      <foreignObject x="54" y="52" width="${width * 0.42}" height="${height - 104}">${commonText}</foreignObject>
      <rect x="${width * 0.52}" y="${height * 0.1}" width="${width * 0.34}" height="${height * 0.74}" rx="34" fill="${cardBackground}" />
      ${heroImage}
      ${logoImage}
    `;
  }

  if (templateId === "stack-card") {
    return `
      ${backgroundImage}
      <rect x="42" y="42" width="${width - 84}" height="${height - 84}" rx="38" fill="${darkCard}" />
      <rect x="56" y="58" width="${width * 0.46}" height="${height - 116}" rx="28" fill="${cardBackground}" />
      <foreignObject x="84" y="92" width="${width * 0.4}" height="${height - 168}">${commonText}</foreignObject>
      <rect x="${width * 0.57}" y="${height * 0.16}" width="${width * 0.26}" height="${height * 0.5}" rx="26" fill="${content.accentColor}" opacity="0.18" />
      ${heroImage}
      ${logoImage}
    `;
  }

  if (templateId === "gradient-poster") {
    return `
      <defs>
        <linearGradient id="banner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${content.backgroundColor}" />
          <stop offset="100%" stop-color="${content.accentColor}" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${width}" height="${height}" fill="url(#banner-gradient)" />
      ${backgroundImage}
      <foreignObject x="58" y="58" width="${width * 0.5}" height="${height - 116}">${commonText}</foreignObject>
      <circle cx="${width * 0.78}" cy="${height * 0.32}" r="${width * 0.11}" fill="rgba(255,255,255,0.12)" />
      <circle cx="${width * 0.84}" cy="${height * 0.64}" r="${width * 0.06}" fill="rgba(255,255,255,0.16)" />
      ${heroImage}
      ${logoImage}
    `;
  }

  if (templateId === "overlay-focus") {
    return `
      ${backgroundImage}
      ${heroImage}
      <rect x="32" y="${height * 0.58}" width="${width * 0.5}" height="${height * 0.28}" rx="30" fill="${cardBackground}" />
      <foreignObject x="60" y="${height * 0.61}" width="${width * 0.44}" height="${height * 0.22}">${commonText}</foreignObject>
      ${logoImage}
    `;
  }

  return `
    ${backgroundImage}
    <rect x="34" y="34" width="${width - 68}" height="${height - 68}" rx="40" fill="${cardBackground}" />
    <foreignObject x="66" y="62" width="${width * 0.5}" height="${height - 124}">${commonText}</foreignObject>
    <rect x="${width * 0.62}" y="${height * 0.18}" width="${width * 0.24}" height="${height * 0.24}" rx="28" fill="${content.accentColor}" opacity="0.18" />
    <rect x="${width * 0.66}" y="${height * 0.46}" width="${width * 0.18}" height="${height * 0.18}" rx="20" fill="${content.accentColor}" opacity="0.28" />
    ${heroImage}
    ${logoImage}
  `;
}

export function renderDesignSvg(options: RenderOptions) {
  const { template, content, size, assets } = options;
  const width = size.width;
  const height = size.height;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
      <rect x="0" y="0" width="${width}" height="${height}" rx="0" fill="${content.backgroundColor}" />
      ${layoutBlock(template.id, content, width, height, assets)}
    </svg>
  `.trim();
}

export function svgToDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function buildDesignHtmlDocument(svg: string, title: string) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeXml(title)}</title>
    <style>
      * { box-sizing: border-box; }
      html, body { margin: 0; min-height: 100%; background: #f4ecdf; font-family: "Space Grotesk", "Manrope", Arial, sans-serif; }
      body { display: grid; place-items: center; padding: 32px; }
      .frame { width: min(100%, 1280px); border-radius: 28px; overflow: hidden; box-shadow: 0 24px 80px rgba(17, 19, 24, 0.18); }
      svg { display: block; width: 100%; height: auto; }
    </style>
  </head>
  <body>
    <div class="frame">
      ${svg}
    </div>
  </body>
</html>`;
}
