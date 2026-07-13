"use client";

import { usePathname } from "next/navigation";
import NotificationBell from "@/components/notifications/NotificationBell";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/transactions": "Transactions",
  "/notifications": "Notifications",
};

export default function Header() {
  const pathname = usePathname();
  const title = titles[pathname] || "LedgerPulse";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      <h1 className="text-sm font-medium text-ink-900">{title}</h1>
      <NotificationBell />
    </header>
  );
}
