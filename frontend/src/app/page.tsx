import CashFlowChart from "@/components/dashboard/CashFlowChart";
import SummaryCards from "@/components/dashboard/SummaryCards";
import { DashboardSummary } from "@/types/dashboard";

// ISR: this page is prerendered, then regenerated at most every 30s.
// In a production build Next sends: Cache-Control: s-maxage=30, stale-while-revalidate
export const revalidate = 30;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Rendered whenever the backend can't be reached (build time, tests, outages)
const FALLBACK_SUMMARY = {
  totalBalance: 0,
  totalIncome: 0,
  totalExpense: 0,
  netCashFlow: 0,
  balanceChangePct: 0,
  incomeChangePct: 0,
  expenseChangePct: 0,
  netChangePct: 0,
  monthlyCashFlow: [],
} as unknown as DashboardSummary;

async function getSummary(): Promise<DashboardSummary> {
  try {
    const res = await fetch(`${API_URL}/dashboard/summary`, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(2000), // fail fast when no backend is running
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json?.data ?? json ?? FALLBACK_SUMMARY;
  } catch {
    return FALLBACK_SUMMARY;
  }
}

export default async function DashboardPage() {
  const summary = await getSummary();

  return (
    <div className="space-y-6">
      <SummaryCards summary={summary} />
      <CashFlowChart data={summary.monthlyCashFlow ?? []} />
    </div>
  );
}
