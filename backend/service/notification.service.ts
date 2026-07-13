import { NotificationSeverity, Prisma } from "@prisma/client";
import { prisma } from "../lib/db";
import { ApiError } from "../lib/ApiError";

export interface CreateNotificationInput {
  type: string;
  message: string;
  severity: NotificationSeverity | "INFO" | "WARNING" | "CRITICAL";
  meta?: Prisma.InputJsonValue;
}

// De-dupe window: don't spam the same notification type+message combo more
// than once per hour (e.g. multiple transactions in a row shouldn't each
// trigger their own "negative cash flow" toast).
const DEDUPE_WINDOW_MS = 60 * 60 * 1000;

export async function createNotification(input: CreateNotificationInput) {
  const since = new Date(Date.now() - DEDUPE_WINDOW_MS);
  const recentDuplicate = await prisma.notification.findFirst({
    where: {
      type: input.type,
      message: input.message,
      createdAt: { gte: since },
    },
  });
  if (recentDuplicate) return recentDuplicate;

  return prisma.notification.create({
    data: {
      type: input.type,
      message: input.message,
      severity: input.severity as NotificationSeverity,
      meta: input.meta ?? Prisma.JsonNull,
    },
  });
}

export async function listNotifications(
  page: number,
  limit: number,
  unreadOnly: boolean,
) {
  const where = unreadOnly ? { read: false } : {};
  const skip = (page - 1) * limit;

  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { read: false } }),
  ]);

  return {
    items,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function markNotificationRead(id: string) {
  const existing = await prisma.notification.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Notification not found");
  return prisma.notification.update({ where: { id }, data: { read: true } });
}

export async function markAllNotificationsRead() {
  await prisma.notification.updateMany({
    where: { read: false },
    data: { read: true },
  });
}
