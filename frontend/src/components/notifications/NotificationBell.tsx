"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchNotifications } from "@/store/slices/notificationSlice";

export default function NotificationBell() {
  const dispatch = useAppDispatch();
  const unreadCount = useAppSelector((s) => s.notifications.unreadCount);

  useEffect(() => {
    dispatch(fetchNotifications({ page: 1, limit: 10 }));
    const interval = setInterval(() => {
      dispatch(fetchNotifications({ page: 1, limit: 10 }));
    }, 30000);
    return () => clearInterval(interval);
  }, [dispatch]);

  return (
    <Link
      href="/notifications"
      className="relative rounded-md p-2 hover:bg-ink-300/10"
    >
      <Bell size={18} className="text-ink-700" />
      {unreadCount > 0 && (
        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-medium text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
