"use client";

import type { AssetType, BriefField, BriefFieldOption, BriefFieldType } from "@/lib/types";

const fieldTypeOptions: BriefFieldType[] = [
  "text",
  "textarea",
  "select",
  "radio",
  "number",
  "asset-single",
  "asset-multi"
];

const presetFields: Array<{ label: string; fields: BriefField[] }> = [
  {
    label: "活动主题",
    fields: [
      {
        name: "theme",
        label: "活动主题",
        type: "text",
        required: true,
        placeholder: "例如：春节红包活动，喜庆但不俗气"
      }
    ]
  },
  {
    label: "情绪氛围",
    fields: [
      {
        name: "mood",
        label: "情绪氛围",
        type: "text",
        placeholder: "例如：温暖、灵动、有呼吸感"
      }
    ]
  },
  {
    label: "文案留白",
    fields: [
      {
        name: "copySide",
        label: "文案留白",
        type: "radio",
        defaultValue: "left",
        options: [
          { label: "左侧", value: "left" },
          { label: "右侧", value: "right" },
          { label: "无留白", value: "none" }
        ]
      }
    ]
  },
  {
    label: "品牌 Logo",
    fields: [
      {
        name: "logos",
        label: "品牌 Logo",
        type: "asset-multi",
        assetType: "logo"
      }
    ]
  },
  {
    label: "吉祥物",
    fields: [
      {
        name: "mascot",
        label: "吉祥物",
        type: "asset-single",
        assetType: "mascot"
      }
    ]
  },
  {
    label: "风格参考",
    fields: [
      {
        name: "styleRef",
        label: "风格参考图",
        type: "asset-single",
        assetType: "style-ref"
      }
    ]
  },
  {
    label: "产品卖点",
    fields: [
      {
        name: "productFocus",
        label: "核心卖点",
        type: "textarea",
        placeholder: "例如：强调功能、速度或收益感知"
      }
    ]
  }
];

function emptyField(): BriefField {
  return {
    name: `field_${crypto.randomUUID().slice(0, 6)}`,
    label: "新字段",
    type: "text",
    required: false,
    placeholder: ""
  };
}

function serializeOptions(options?: BriefFieldOption[]) {
  return (options ?? []).map((option) => `${option.label}:${option.value}`).join("\n");
}

function parseOptions(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, value] = line.includes(":") ? line.split(/:(.+)/) : [line, line];
      return {
        label: label.trim(),
        value: value.trim()
      };
    })
    .filter((option) => option.label && option.value);
}

function isOptionField(type: BriefFieldType) {
  return type === "select" || type === "radio";
}

function isAssetField(type: BriefFieldType) {
  return type === "asset-single" || type === "asset-multi";
}

function isNumberField(type: BriefFieldType) {
  return type === "number";
}

function cloneField(field: BriefField): BriefField {
  return {
    ...field,
    options: field.options ? field.options.map((option) => ({ ...option })) : undefined
  };
}

export function SceneFieldEditor({
  fields,
  onChange
}: {
  fields: BriefField[];
  onChange: (fields: BriefField[]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-ink">Brief 字段</div>
          <div className="mt-1 text-xs text-[var(--muted)]">按运营语言定义表单字段，工作台会直接按这里生成表单。</div>
        </div>
        <button
          type="button"
          className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm"
          onClick={() => onChange([...fields, emptyField()])}
        >
          添加字段
        </button>
      </div>

      <div className="space-y-2 rounded-[24px] border border-black/8 bg-white/75 p-4">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">常用字段预设</div>
        <div className="flex flex-wrap gap-2">
          {presetFields.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs text-ink"
              onClick={() => onChange([...fields, ...preset.fields.map(cloneField)])}
            >
              + {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={`${field.name}-${index}`} className="rounded-[24px] border border-black/8 bg-white/75 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-ink">
                字段 {index + 1} · {field.label || field.name}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs"
                  onClick={() => {
                    if (index === 0) {
                      return;
                    }
                    const next = [...fields];
                    [next[index - 1], next[index]] = [next[index], next[index - 1]];
                    onChange(next);
                  }}
                >
                  上移
                </button>
                <button
                  type="button"
                  className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs"
                  onClick={() => {
                    if (index === fields.length - 1) {
                      return;
                    }
                    const next = [...fields];
                    [next[index], next[index + 1]] = [next[index + 1], next[index]];
                    onChange(next);
                  }}
                >
                  下移
                </button>
                <button
                  type="button"
                  className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700"
                  onClick={() => onChange(fields.filter((_, itemIndex) => itemIndex !== index))}
                >
                  删除
                </button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">字段标识</div>
                <input
                  className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
                  value={field.name}
                  onChange={(event) => {
                    const next = [...fields];
                    next[index] = { ...field, name: event.target.value };
                    onChange(next);
                  }}
                />
              </label>

              <label className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">显示名称</div>
                <input
                  className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
                  value={field.label}
                  onChange={(event) => {
                    const next = [...fields];
                    next[index] = { ...field, label: event.target.value };
                    onChange(next);
                  }}
                />
              </label>

              <label className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">字段类型</div>
                <select
                  className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
                  value={field.type}
                  onChange={(event) => {
                    const nextType = event.target.value as BriefFieldType;
                    const next = [...fields];
                    next[index] = {
                      ...field,
                      type: nextType,
                      options: isOptionField(nextType) ? field.options ?? [] : undefined,
                      assetType: isAssetField(nextType) ? field.assetType ?? "logo" : undefined,
                      min: isNumberField(nextType) ? field.min : undefined,
                      max: isNumberField(nextType) ? field.max : undefined
                    };
                    onChange(next);
                  }}
                >
                  {fieldTypeOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">默认值</div>
                <input
                  className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
                  value={field.defaultValue === undefined ? "" : String(field.defaultValue)}
                  onChange={(event) => {
                    const next = [...fields];
                    next[index] = {
                      ...field,
                      defaultValue: isNumberField(field.type)
                        ? (event.target.value === "" ? undefined : Number(event.target.value))
                        : event.target.value
                    };
                    onChange(next);
                  }}
                />
              </label>

              <label className="space-y-2 lg:col-span-2">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">占位提示</div>
                <input
                  className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
                  value={field.placeholder ?? ""}
                  onChange={(event) => {
                    const next = [...fields];
                    next[index] = { ...field, placeholder: event.target.value };
                    onChange(next);
                  }}
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={Boolean(field.required)}
                  onChange={(event) => {
                    const next = [...fields];
                    next[index] = { ...field, required: event.target.checked };
                    onChange(next);
                  }}
                />
                必填字段
              </label>

              {isAssetField(field.type) ? (
                <label className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">素材类型</div>
                  <select
                    className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
                    value={field.assetType ?? "logo"}
                    onChange={(event) => {
                      const next = [...fields];
                      next[index] = { ...field, assetType: event.target.value as AssetType };
                      onChange(next);
                    }}
                  >
                    <option value="mascot">mascot</option>
                    <option value="logo">logo</option>
                    <option value="style-ref">style-ref</option>
                  </select>
                </label>
              ) : null}

              {isNumberField(field.type) ? (
                <>
                  <label className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">最小值</div>
                    <input
                      className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
                      type="number"
                      value={field.min ?? ""}
                      onChange={(event) => {
                        const next = [...fields];
                        next[index] = { ...field, min: event.target.value === "" ? undefined : Number(event.target.value) };
                        onChange(next);
                      }}
                    />
                  </label>
                  <label className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">最大值</div>
                    <input
                      className="w-full rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm"
                      type="number"
                      value={field.max ?? ""}
                      onChange={(event) => {
                        const next = [...fields];
                        next[index] = { ...field, max: event.target.value === "" ? undefined : Number(event.target.value) };
                        onChange(next);
                      }}
                    />
                  </label>
                </>
              ) : null}

              {isOptionField(field.type) ? (
                <label className="space-y-2 lg:col-span-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">选项</div>
                  <textarea
                    className="min-h-28 w-full rounded-2xl border border-black/8 bg-white px-4 py-3 font-mono text-sm"
                    value={serializeOptions(field.options)}
                    onChange={(event) => {
                      const next = [...fields];
                      next[index] = { ...field, options: parseOptions(event.target.value) };
                      onChange(next);
                    }}
                    placeholder={"每行一项，格式：label:value\n例如：左侧:left"}
                  />
                </label>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {fields.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-black/12 bg-white/70 px-4 py-6 text-center text-sm text-[var(--muted)]">
          当前模板还没有字段。点击“添加字段”开始搭建运营 brief。
        </div>
      ) : null}
    </div>
  );
}
