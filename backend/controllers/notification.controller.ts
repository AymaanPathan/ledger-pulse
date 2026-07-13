import { Request, Response } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import * as notificationService from "../service/notification.service";

export const listNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const unreadOnly = req.query.unreadOnly === "true";
    const result = await notificationService.listNotifications(
      page,
      limit,
      unreadOnly,
    );
    res.json({
      success: true,
      data: result.items,
      unreadCount: result.unreadCount,
      pagination: result.pagination,
    });
  },
);

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await notificationService.markNotificationRead(
    req.params.id,
  );
  res.json({ success: true, data: notification });
});

export const markAllRead = asyncHandler(
  async (_req: Request, res: Response) => {
    await notificationService.markAllNotificationsRead();
    res.json({ success: true });
  },
);
