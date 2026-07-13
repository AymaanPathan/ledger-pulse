import { TransactionType } from "@prisma/client";
import { prisma } from "../lib/db";
import { cacheGet, cacheSet } from "../lib/redis";

const SUMMARY_CACHE_KEY = "dashboard:summary";
const SUMMARY_CACHE_TTL_SECONDS = 30;

export interface MonthlyCashFlowPoint {
  month: string; // e.g. "2026-07"
  income: number;
  expense: number;
  net: number;
}

export interface DashboardSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  monthlyCashFlow: MonthlyCashFlowPoint[];
  cachedAt: string;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const cached = await cacheGet<DashboardSummary>(SUMMARY_CACHE_KEY);
  if (cached) return { ...cached, cachedAt: cached.cachedAt };

  const [incomeAgg, expenseAgg, allTx] = await Promise.all([
    prisma.transaction.aggregate({
      where: { type: TransactionType.INCOME },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: TransactionType.EXPENSE },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      select: { amount: true, type: true, date: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const totalIncome = Number(incomeAgg._sum.amount ?? 0);
  const totalExpense = Number(expenseAgg._sum.amount ?? 0);
  const totalBalance = totalIncome - totalExpense;

  // Bucket into last 6 calendar months (including months with zero activity
  // so the chart doesn't have gaps).
  const monthBuckets = new Map<string, { income: number; expense: number }>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthBuckets.set(key, { income: 0, expense: 0 });
  }

  for (const tx of allTx) {
    const d = new Date(tx.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthBuckets.has(key)) continue; // outside the 6-month window
    const bucket = monthBuckets.get(key)!;
    if (tx.type === TransactionType.INCOME) bucket.income += Number(tx.amount);
    else bucket.expense += Number(tx.amount);
  }

  const monthlyCashFlow: MonthlyCashFlowPoint[] = Array.from(
    monthBuckets.entries(),
  ).map(([month, { income, expense }]) => ({
    month,
    income,
    expense,
    net: income - expense,
  }));

  const summary: DashboardSummary = {
    totalBalance,
    totalIncome,
    totalExpense,
    monthlyCashFlow,
    cachedAt: new Date().toISOString(),
  };

  await cacheSet(SUMMARY_CACHE_KEY, summary, SUMMARY_CACHE_TTL_SECONDS);
  return summary;
}
