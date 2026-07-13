import { Card, CardBody } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { DashboardSummary } from "@/types/dashboard";
import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";

export default function SummaryCards({
  summary,
}: {
  summary: DashboardSummary;
}) {
  const cards = [
    {
      label: "Total Balance",
      value: summary.totalBalance,
      icon: Wallet,
      tone: "text-ink-900",
    },
    {
      label: "Total Income",
      value: summary.totalIncome,
      icon: ArrowUpRight,
      tone: "text-accent",
    },
    {
      label: "Total Expense",
      value: summary.totalExpense,
      icon: ArrowDownRight,
      tone: "text-danger",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map(({ label, value, icon: Icon, tone }) => (
        <Card key={label}>
          <CardBody className="flex items-start justify-between">
            <div>
              <p className="text-xs text-ink-500">{label}</p>
              <p className={`mt-1 text-xl font-semibold ${tone}`}>
                {formatCurrency(value)}
              </p>
            </div>
            <Icon size={18} className={tone} />
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
