"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { MonthlyCashFlow } from "@/types/dashboard";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

export default function CashFlowChart({ data }: { data: MonthlyCashFlow[] }) {
  const totalIn = data.reduce((sum, d) => sum + d.income, 0);
  const totalOut = data.reduce((sum, d) => sum + d.expense, 0);

  return (
    <Card data-reveal>
      <CardHeader>
        <div>
          <h3 className="text-sm font-semibold text-[#16181D]">Cash flow</h3>
          <p className="mt-0.5 text-xs text-[#6B7280]">
            Money moving in and out of your business
          </p>
        </div>
      </CardHeader>
      <CardBody>
        <div className="mb-4 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#176B4D]" />
            <span className="text-xs text-[#6B7280]">Cash in</span>
            <span className="text-sm font-semibold text-[#16181D]">
              {formatCurrency(totalIn)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#C7CDD4]" />
            <span className="text-xs text-[#6B7280]">Cash out</span>
            <span className="text-sm font-semibold text-[#16181D]">
              {formatCurrency(totalOut)}
            </span>
          </div>
        </div>

        <div className="h-[290px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="cashInFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#176B4D" stopOpacity={0.16} />
                  <stop offset="100%" stopColor="#176B4D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#EEF0F2"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#9CA3AF" }}
                axisLine={false}
                tickLine={false}
                width={56}
                tickFormatter={(v) => formatCompactCurrency(v)}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "none",
                  background: "#16181D",
                  color: "#fff",
                }}
              />
              <Area
                type="monotone"
                dataKey="income"
                name="Cash in"
                stroke="#176B4D"
                strokeWidth={2}
                fill="url(#cashInFill)"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Area
                type="monotone"
                dataKey="expense"
                name="Cash out"
                stroke="#C7CDD4"
                strokeWidth={2}
                fill="transparent"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}
