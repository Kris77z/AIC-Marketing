"use client";

import type { AssetRecord, HotspotChannel, HotspotGenerateRequestBody, HotspotStance } from "@/lib/types";

export function TopicInput({
  value,
  assets,
  onChange
}: {
  value: HotspotGenerateRequestBody;
  assets: AssetRecord[];
  onChange: (patch: Partial<HotspotGenerateRequestBody>) => void;
}) {
  return (
    <section className="panel rounded-[30px] p-6 shadow-soft">
      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Step 1</div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">输入热点信息</h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="space-y-2 lg:col-span-2">
          <div className="text-sm font-medium text-ink">热点主题</div>
          <input
            className="w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 text-sm"
            value={value.topic}
            onChange={(event) => onChange({ topic: event.target.value })}
            placeholder="例如：世界杯、双十一、明星事件、AI 新产品发布"
          />
        </label>

        <label className="space-y-2">
          <div className="text-sm font-medium text-ink">品牌立场</div>
          <select
            className="w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 text-sm"
            value={value.stance}
            onChange={(event) => onChange({ stance: event.target.value as HotspotStance })}
          >
            <option value="cold">冷静克制</option>
            <option value="warm">热情参与</option>
            <option value="humorous">轻松幽默</option>
            <option value="deep">深度表达</option>
          </select>
        </label>

        <label className="space-y-2">
          <div className="text-sm font-medium text-ink">运营渠道</div>
          <select
            className="w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 text-sm"
            value={value.channel}
            onChange={(event) => onChange({ channel: event.target.value as HotspotChannel })}
          >
            <option value="xiaohongshu">小红书</option>
            <option value="weibo">微博</option>
            <option value="wechat">公众号</option>
            <option value="video">视频号</option>
          </select>
        </label>

        <label className="space-y-2 lg:col-span-2">
          <div className="text-sm font-medium text-ink">补充要求</div>
          <textarea
            className="min-h-28 w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 text-sm"
            value={value.brief ?? ""}
            onChange={(event) => onChange({ brief: event.target.value })}
            placeholder="例如：更偏品牌态度，不要太像营销号；最好能带出产品利益点。"
          />
        </label>

        <label className="space-y-2">
          <div className="text-sm font-medium text-ink">输出版本数</div>
          <select
            className="w-full rounded-2xl border border-black/8 bg-white/80 px-4 py-3 text-sm"
            value={String(value.variantCount ?? 3)}
            onChange={(event) => onChange({ variantCount: Number(event.target.value) })}
          >
            <option value="2">2 个版本</option>
            <option value="3">3 个版本</option>
            <option value="4">4 个版本</option>
          </select>
        </label>

        <label className="space-y-2 lg:col-span-2">
          <div className="text-sm font-medium text-ink">推荐素材</div>
          <div className="grid gap-2 rounded-[24px] border border-black/8 bg-white/75 p-3 md:grid-cols-2">
            {assets.map((asset) => {
              const selected = value.selectedAssetSlugs?.includes(asset.slug) ?? false;
              return (
                <label
                  key={asset.id}
                  className="flex items-center justify-between rounded-2xl border border-black/6 px-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-medium text-ink">{asset.name}</div>
                    <div className="text-xs text-[var(--muted)]">{asset.slug}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(event) => {
                      const current = value.selectedAssetSlugs ?? [];
                      onChange({
                        selectedAssetSlugs: event.target.checked
                          ? [...current, asset.slug]
                          : current.filter((slug) => slug !== asset.slug)
                      });
                    }}
                  />
                </label>
              );
            })}
          </div>
        </label>
      </div>
    </section>
  );
}
