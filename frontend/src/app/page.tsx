"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchDashboardSummary } from "../store/slices/dashboardSlice";
import CashFlowChart from "@/components/dashboard/CashFlowChart";
import SummaryCards from "@/components/dashboard/SummaryCards";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { summary, status } = useAppSelector((s) => s.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardSummary());
  }, [dispatch]);

  if (status === "loading" && !summary) {
    return <div className="text-sm text-ink-500">Loading dashboard...</div>;
  }

  if (!summary) {
    return <div className="text-sm text-ink-500">No data available.</div>;
  }

  return (
    <div className="space-y-6">
      <SummaryCards summary={summary} />
      <CashFlowChart data={summary.monthlyCashFlow} />
    </div>
  );
}
