export type NotificationType =
  | "HIGH_EXPENSE"
  | "WEEKLY_SPIKE"
  | "NEGATIVE_CASH_FLOW";

export type NotificationSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface AppNotification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  message: string;
  isRead: boolean;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: AppNotification[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    unreadCount: number;
  };
}
