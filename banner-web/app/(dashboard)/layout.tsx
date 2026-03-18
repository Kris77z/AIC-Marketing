import type { ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid-fog min-h-screen px-6 py-6">
      <div className="mx-auto flex max-w-[1600px] gap-6">
        <Sidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
