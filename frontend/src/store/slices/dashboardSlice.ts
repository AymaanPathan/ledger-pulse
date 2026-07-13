import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { dashboardApi } from "../../api/dashboard.api";
import { DashboardSummary } from "../../types/dashboard";

interface DashboardState {
  summary: DashboardSummary | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: DashboardState = {
  summary: null,
  status: "idle",
  error: null,
};

export const fetchDashboardSummary = createAsyncThunk(
  "dashboard/fetchSummary",
  async () => {
    return await dashboardApi.getSummary();
  },
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.summary = action.payload;
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to load dashboard";
      });
  },
});

export default dashboardSlice.reducer;
