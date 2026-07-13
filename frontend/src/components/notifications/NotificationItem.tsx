"use client";

import { AppNotification } from "@/types/notification";
import { useAppDispatch } from "@/store/hooks";
import { markNotificationRead } from "@/store/slices/notificationSlice";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { AlertTriangle, AlertOctagon, Info } from "lucide-react";

const severityConfig = {
  INFO: { tone: "neutral" as const, icon: Info },
  WARNING: { tone: "warn" as const, icon: AlertTriangle },
  CRITICAL: { tone: "danger" as const, icon: AlertOctagon },
};

export default function NotificationItem({
  notification,
}: {
  notification: AppNotification;
}) {
  const dispatch = useAppDispatch();
  const { tone, icon: Icon } = severityConfig[notification.severity];

  return (
    <div
      className={`flex items-start gap-3 border-b border-border px-4 py-3 last:border-0 ${
        notification.isRead ? "bg-white" : "bg-ink-300/5"
      }`}
    >
      <Icon
        size={16}
        className={`mt-0.5 ${
          notification.severity === "CRITICAL"
            ? "text-danger"
            : notification.severity === "WARNING"
              ? "text-warn"
              : "text-ink-500"
        }`}
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Badge tone={tone}>{notification.severity}</Badge>
          <span className="text-xs text-ink-500">
            {formatDate(notification.createdAt)}
          </span>
        </div>
        <p className="mt-1 text-sm text-ink-900">{notification.message}</p>
      </div>
      {!notification.isRead && (
        <button
          onClick={() => dispatch(markNotificationRead(notification.id))}
          className="whitespace-nowrap text-xs font-medium text-ink-700 hover:text-ink-900"
        >
          Mark read
        </button>
      )}
    </div>
  );
}
