"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { MonthlyCashFlow } from "@/types/dashboard";
import { formatCurrency } from "@/lib/utils";

export default function CashFlowChart({ data }: { data: MonthlyCashFlow[] }) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-medium text-ink-900">Monthly Cash Flow</h3>
      </CardHeader>
      <CardBody className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#71717a" }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
              width={70}
              tickFormatter={(v) => formatCurrency(v)}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                borderColor: "#e5e7eb",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="income"
              fill="#16a34a"
              radius={[3, 3, 0, 0]}
              name="Income"
            />
            <Bar
              dataKey="expense"
              fill="#dc2626"
              radius={[3, 3, 0, 0]}
              name="Expense"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
}
