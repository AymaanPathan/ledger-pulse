"use client";

import { usePathname } from "next/navigation";
import NotificationBell from "@/components/notifications/NotificationBell";

const titles: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Financial overview",
    subtitle: "Track your cash flow, revenue, and business performance.",
  },
  "/transactions": {
    title: "Transactions",
    subtitle: "Your latest business activity.",
  },
  "/notifications": {
    title: "Notifications",
    subtitle: "Updates on your accounts and activity.",
  },
};

export default function Header() {
  const pathname = usePathname();
  const { title, subtitle } = titles[pathname] ?? {
    title: "LedgerPulse",
    subtitle: "",
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#E8EAED] bg-white px-6 lg:px-8">
      <div>
        <h1 className="text-[15px] font-semibold text-[#16181D]">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-xs text-[#6B7280]">{subtitle}</p>
        )}
      </div>
      <NotificationBell />
    </header>
  );
}
