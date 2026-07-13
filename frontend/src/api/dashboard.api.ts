import axiosClient from "./axiosClient";
import { DashboardSummary } from "../types/dashboard";

export const dashboardApi = {
  getSummary: async () => {
    const { data } = await axiosClient.get<{
      success: boolean;
      data: DashboardSummary;
    }>("/dashboard/summary");
    return data.data;
  },
};
