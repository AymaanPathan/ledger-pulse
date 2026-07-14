"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Bell,
  ChartNoAxesCombined,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-[248px] shrink-0 flex-col border-r border-[#E8EAED] bg-white md:flex">
      <div className="flex h-[72px] items-center gap-2.5 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#176B4D] text-white">
          <ChartNoAxesCombined size={16} />
        </span>
        <span className="text-[17px] font-semibold tracking-tight text-[#16181D]">
          LedgerPulse
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex h-[42px] items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-200",
                active
                  ? "bg-[#EAF8F1] font-medium text-[#176B4D]"
                  : "text-[#6B7280] hover:bg-[#F7F8FA] hover:text-[#16181D]",
              )}
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#E8EAED] px-5 py-3 text-xs text-[#9CA3AF]">
        v0.1.0
      </div>
    </aside>
  );
}
