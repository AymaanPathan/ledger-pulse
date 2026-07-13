import axiosClient from "./axiosClient";
import { NotificationListResponse } from "../types/notification";

export const notificationsApi = {
  list: async (
    params: { page?: number; limit?: number; unreadOnly?: boolean } = {},
  ) => {
    const { data } = await axiosClient.get<NotificationListResponse>(
      "/notifications",
      {
        params,
      },
    );
    return data;
  },

  markRead: async (id: string) => {
    const { data } = await axiosClient.patch(`/notifications/${id}/read`);
    return data;
  },

  markAllRead: async () => {
    const { data } = await axiosClient.patch("/notifications/read-all");
    return data;
  },
};
