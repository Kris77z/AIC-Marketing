import type { ReactNode } from "react";

import type { AssetRecord, BriefField } from "@/lib/types";

function FieldShell({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <div className="text-sm font-medium text-ink">
        {label}
        {required ? <span className="ml-1 text-[var(--accent)]">*</span> : null}
      </div>
      {children}
    </label>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-[var(--muted)]/70 focus:border-black/20 focus:ring-4 focus:ring-black/5";

export function BriefForm({
  fields,
  assets,
  value,
  onChange
}: {
  fields: BriefField[];
  assets: AssetRecord[];
  value: Record<string, unknown>;
  onChange: (name: string, nextValue: string | string[]) => void;
}) {
  return (
    <section className="panel rounded-[30px] p-6 shadow-soft">
      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Step 2</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">填写活动 Brief</h2>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {fields.map((field) => {
          const current = value[field.name];
          const assetOptions = field.assetType ? assets.filter((asset) => asset.type === field.assetType) : [];

          if (field.type === "textarea") {
            return (
              <FieldShell key={field.name} label={field.label} required={field.required}>
                <textarea
                  className={`${inputClassName} min-h-32 resize-y`}
                  placeholder={field.placeholder}
                  value={typeof current === "string" ? current : ""}
                  onChange={(event) => onChange(field.name, event.target.value)}
                />
              </FieldShell>
            );
          }

          if (field.type === "select" || field.type === "asset-single") {
            return (
              <FieldShell key={field.name} label={field.label} required={field.required}>
                <select
                  className={inputClassName}
                  value={typeof current === "string" ? current : ""}
                  onChange={(event) => onChange(field.name, event.target.value)}
                >
                  <option value="">请选择</option>
                  {(field.type === "asset-single" ? assetOptions : []).map((option) => (
                    <option key={option.slug} value={option.slug}>
                      {option.name}
                    </option>
                  ))}
                  {(field.options ?? []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FieldShell>
            );
          }

          if (field.type === "asset-multi") {
            const selectedValues = Array.isArray(current) ? current : [];
            return (
              <FieldShell key={field.name} label={field.label} required={field.required}>
                <div className="grid gap-2 rounded-[24px] border border-black/8 bg-white/75 p-3">
                  {assetOptions.map((option) => {
                    const checked = selectedValues.includes(option.slug);
                    return (
                      <label
                        key={option.slug}
                        className="flex items-center justify-between rounded-2xl border border-black/6 px-3 py-2 text-sm"
                      >
                        <div>
                          <div className="font-medium text-ink">{option.name}</div>
                          <div className="text-xs text-[var(--muted)]">{option.tags.join(" / ")}</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            const next = event.target.checked
                              ? [...selectedValues, option.slug]
                              : selectedValues.filter((slug) => slug !== option.slug);
                            onChange(field.name, next);
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
              </FieldShell>
            );
          }

          if (field.type === "radio") {
            return (
              <FieldShell key={field.name} label={field.label} required={field.required}>
                <div className="flex flex-wrap gap-2">
                  {(field.options ?? []).map((option) => {
                    const active = current === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(field.name, option.value)}
                        className={`rounded-full border px-4 py-2 text-sm transition ${
                          active
                            ? "border-transparent bg-ink text-white"
                            : "border-black/10 bg-white/80 text-[var(--muted)] hover:border-black/20 hover:text-ink"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </FieldShell>
            );
          }

          return (
            <FieldShell key={field.name} label={field.label} required={field.required}>
              <input
                className={inputClassName}
                placeholder={field.placeholder}
                value={typeof current === "string" ? current : ""}
                onChange={(event) => onChange(field.name, event.target.value)}
              />
            </FieldShell>
          );
        })}
      </div>
    </section>
  );
}
