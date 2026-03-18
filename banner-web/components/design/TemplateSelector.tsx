"use client";

import Image from "next/image";

import type { DesignTemplateDefinition } from "@/lib/design-templates";
import { cn } from "@/lib/utils";

export function TemplateSelector({
  templates,
  selectedTemplateId,
  onSelect,
  previewUrls
}: {
  templates: DesignTemplateDefinition[];
  selectedTemplateId: string;
  onSelect: (templateId: string) => void;
  previewUrls: Record<string, string>;
}) {
  return (
    <section className="panel rounded-[30px] p-6 shadow-soft">
      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Step 1</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">选择模板</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {templates.map((template) => {
          const active = template.id === selectedTemplateId;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.id)}
              className={cn(
                "rounded-[24px] border p-5 text-left transition",
                active
                  ? "border-transparent bg-ink text-white shadow-soft"
                  : "border-black/8 bg-white/70 hover:-translate-y-0.5 hover:border-black/15"
              )}
            >
              <div className="overflow-hidden rounded-[18px] border border-black/8 bg-[#efe5d8]">
                <div className="relative aspect-[4/3]">
                  {previewUrls[template.id] ? (
                    <Image src={previewUrls[template.id]} alt={template.name} fill className="object-cover" unoptimized />
                  ) : null}
                </div>
              </div>
              <div className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">{template.category}</div>
              <div className="mt-2 text-base font-semibold">{template.name}</div>
              <div className={cn("mt-3 text-sm leading-6", active ? "text-white/72" : "text-[var(--muted)]")}>
                {template.description}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
