"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchNotifications,
  markAllNotificationsRead,
} from "@/store/slices/notificationSlice";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import NotificationItem from "./NotificationItem";

export default function NotificationList() {
  const dispatch = useAppDispatch();
  const { items, unreadCount, status } = useAppSelector((s) => s.notifications);

  useEffect(() => {
    dispatch(fetchNotifications({ page: 1, limit: 50 }));
  }, [dispatch]);

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium text-ink-900">
          Notifications {unreadCount > 0 && `(${unreadCount} unread)`}
        </h3>
        <Button
          variant="secondary"
          size="sm"
          disabled={unreadCount === 0}
          onClick={() => dispatch(markAllNotificationsRead())}
        >
          Mark all read
        </Button>
      </div>

      {status === "loading" && items.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-ink-500">
          Loading...
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-ink-500">
          No notifications yet.
        </div>
      ) : (
        <div>
          {items.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>
      )}
    </Card>
  );
}
