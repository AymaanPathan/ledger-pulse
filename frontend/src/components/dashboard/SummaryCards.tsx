import { Card, CardBody } from "@/components/ui/Card";
import { formatCurrency, cn } from "@/lib/utils";
import { DashboardSummary } from "@/types/dashboard";
import {
  ArrowDownRight,
  ArrowUpRight,
  WalletCards,
  TrendingUp,
  CreditCard,
  CircleDollarSign,
} from "lucide-react";

export default function SummaryCards({
  summary,
}: {
  summary: DashboardSummary;
}) {
  const cards = [
    {
      label: "Total balance",
      value: summary.totalBalance,
      change: summary.balanceChangePct,
      icon: WalletCards,
      positive: true,
    },
    {
      label: "Revenue",
      value: summary.totalIncome,
      change: summary.incomeChangePct,
      icon: TrendingUp,
      positive: true,
    },
    {
      label: "Expenses",
      value: summary.totalExpense,
      change: summary.expenseChangePct,
      icon: CreditCard,
      positive: false,
    },
    {
      label: "Net cash flow",
      value: summary.netCashFlow,
      change: summary.netChangePct,
      icon: CircleDollarSign,
      positive: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, change, icon: Icon, positive }, i) => (
        <Card
          key={label}
          data-reveal
          style={{ transitionDelay: `${i * 60}ms` }}
          className="hover:-translate-y-[1px]"
        >
          <CardBody>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[#6B7280]">{label}</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F7F8FA] text-[#6B7280]">
                <Icon size={16} />
              </span>
            </div>
            <p className="mt-3 text-[26px] font-semibold tracking-[-0.02em] text-[#16181D]">
              {formatCurrency(value)}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                  positive
                    ? "bg-[#EAF8F1] text-[#16815D]"
                    : "bg-[#FFF0F0] text-[#D14343]",
                )}
              >
                {positive ? (
                  <ArrowUpRight size={12} />
                ) : (
                  <ArrowDownRight size={12} />
                )}
                {change > 0 ? "+" : ""}
                {change}%
              </span>
              <span className="text-xs text-[#9CA3AF]">vs. last month</span>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
