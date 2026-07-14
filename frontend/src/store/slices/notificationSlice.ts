import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { notificationsApi } from "../../api/notifications.api";
import { AppNotification } from "../../types/notification";

interface NotificationState {
  items: AppNotification[];
  unreadCount: number;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  status: "idle",
  error: null,
};

export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async (
    params: { page?: number; limit?: number; unreadOnly?: boolean } = {},
  ) => {
    return await notificationsApi.list(params);
  },
);

export const markNotificationRead = createAsyncThunk(
  "notifications/markRead",
  async (id: string) => {
    await notificationsApi.markRead(id);
    return id;
  },
);

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllRead",
  async () => {
    await notificationsApi.markAllRead();
  },
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = "succeeded";
        // API may return undefined/null data on empty result sets
        state.items = Array.isArray(action.payload?.data)
          ? action.payload.data
          : [];
        state.unreadCount = action.payload?.meta?.unreadCount ?? 0;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to load notifications";
        // don't leave stale items on screen if this was the first load
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const item = state.items.find((n) => n.id === action.payload);
        if (item && !item.isRead) {
          item.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach((n) => (n.isRead = true));
        state.unreadCount = 0;
      });
  },
});

export default notificationSlice.reducer;
