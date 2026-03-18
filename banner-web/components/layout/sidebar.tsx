"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, Flame, FolderKanban, GalleryVerticalEnd, ImagePlus, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

const navigation: Array<{ href: Route; label: string; icon: typeof Sparkles }> = [
  { href: "/generate", label: "统一出稿", icon: Sparkles },
  { href: "/hotspot", label: "自动热点", icon: Flame },
  { href: "/gallery", label: "图库", icon: GalleryVerticalEnd },
  { href: "/scenes", label: "场景模板", icon: Boxes },
  { href: "/assets", label: "素材库", icon: ImagePlus }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="panel sticky top-6 flex h-[calc(100vh-3rem)] w-full max-w-[280px] flex-col rounded-[28px] p-5 shadow-soft">
      <div className="mb-8 rounded-[24px] border border-black/5 bg-white/70 p-5">
        <div className="mb-3 inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
          AIC System
        </div>
        <div className="text-2xl font-semibold tracking-tight text-ink">AIC-Marketing</div>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          把 AI 生图、HTML 快排和自动热点流水线收进一个统一的营销生产后台。
        </p>
      </div>

      <nav className="space-y-2">
        {navigation.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                active
                  ? "bg-ink text-white shadow-soft"
                  : "text-[var(--muted)] hover:bg-white/70 hover:text-ink"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[24px] bg-gradient-to-br from-peach/55 via-white to-moss/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-ink shadow-soft">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">MVP 已开工</div>
            <div className="text-xs text-[var(--muted)]">先打通主链路，再补素材管理与异步任务</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
