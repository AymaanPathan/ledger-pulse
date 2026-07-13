import { Transaction, TransactionType } from "@prisma/client";
import { prisma } from "../lib/db";
import { createNotification } from "./notification.service";

const ABS_FLOOR = Number(process.env.HIGH_EXPENSE_ABS_FLOOR ?? 5000);
const Z_THRESHOLD = Number(process.env.HIGH_EXPENSE_ZSCORE_THRESHOLD ?? 2);
const WEEKLY_SPIKE_PCT = Number(
  process.env.WEEKLY_SPIKE_PERCENT_THRESHOLD ?? 35,
);
const ROLLING_SAMPLE_SIZE = 20;
const MIN_SAMPLES_FOR_ZSCORE = 5;

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[], avg: number): number {
  if (values.length < 2) return 0;
  const variance =
    values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

async function checkHighExpenseAnomaly(tx: Transaction) {
  if (tx.type !== TransactionType.EXPENSE) return;

  const amount = Number(tx.amount);
  if (amount < ABS_FLOOR) return; // never bother flagging small amounts

  const priorSameCategory = await prisma.transaction.findMany({
    where: {
      type: TransactionType.EXPENSE,
      category: tx.category,
      id: { not: tx.id },
    },
    orderBy: { date: "desc" },
    take: ROLLING_SAMPLE_SIZE,
    select: { amount: true },
  });

  if (priorSameCategory.length < MIN_SAMPLES_FOR_ZSCORE) {
    // Not enough history to judge statistically — fall back to the absolute
    // floor alone, but mark it as a lower-confidence "info" notice.
    await createNotification({
      type: "HIGH_EXPENSE",
      severity: "INFO",
      message: `High expense detected: ₹${amount.toLocaleString("en-IN")} in "${tx.category}" (not enough history yet to judge if this is unusual for you)`,
      meta: {
        transactionId: tx.id,
        amount,
        category: tx.category,
        sampleSize: priorSameCategory.length,
      },
    });
    return;
  }

  const amounts = priorSameCategory.map((t) => Number(t.amount));
  const avg = mean(amounts);
  const sd = stdDev(amounts, avg);
  const zScore = sd === 0 ? (amount > avg ? Infinity : 0) : (amount - avg) / sd;

  if (zScore >= Z_THRESHOLD) {
    await createNotification({
      type: "HIGH_EXPENSE",
      severity: "WARNING",
      message: `High expense detected: ₹${amount.toLocaleString("en-IN")} in "${tx.category}" — that's ${zScore === Infinity ? "far" : `${zScore.toFixed(1)}σ`} above your usual spend in this category (avg ₹${avg.toFixed(0)})`,
      meta: {
        transactionId: tx.id,
        amount,
        category: tx.category,
        zScore: isFinite(zScore) ? zScore : null,
        avg,
        stdDev: sd,
      },
    });
  }
}

async function checkWeeklySpike(tx: Transaction) {
  if (tx.type !== TransactionType.EXPENSE) return;

  const now = new Date(tx.date);
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay());
  startOfThisWeek.setHours(0, 0, 0, 0);

  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

  const [thisWeek, lastWeek] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        type: TransactionType.EXPENSE,
        date: { gte: startOfThisWeek, lte: now },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        type: TransactionType.EXPENSE,
        date: { gte: startOfLastWeek, lt: startOfThisWeek },
      },
      _sum: { amount: true },
    }),
  ]);

  const thisWeekTotal = Number(thisWeek._sum.amount ?? 0);
  const lastWeekTotal = Number(lastWeek._sum.amount ?? 0);

  if (lastWeekTotal <= 0) return; // no baseline to compare against yet

  const pctChange = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;

  if (pctChange >= WEEKLY_SPIKE_PCT) {
    await createNotification({
      type: "WEEKLY_SPIKE",
      severity: "WARNING",
      message: `You spent ${pctChange.toFixed(0)}% more this week (₹${thisWeekTotal.toLocaleString("en-IN")}) than last week (₹${lastWeekTotal.toLocaleString("en-IN")})`,
      meta: { thisWeekTotal, lastWeekTotal, pctChange },
    });
  }
}

async function checkNegativeCashFlow(tx: Transaction) {
  const now = new Date(tx.date);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [income, expense] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        type: TransactionType.INCOME,
        date: { gte: startOfMonth, lte: now },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        type: TransactionType.EXPENSE,
        date: { gte: startOfMonth, lte: now },
      },
      _sum: { amount: true },
    }),
  ]);

  const incomeTotal = Number(income._sum.amount ?? 0);
  const expenseTotal = Number(expense._sum.amount ?? 0);
  const netFlow = incomeTotal - expenseTotal;

  if (netFlow < 0) {
    await createNotification({
      type: "NEGATIVE_CASH_FLOW",
      severity: "CRITICAL",
      message: `Negative cash flow detected: this month's expenses (₹${expenseTotal.toLocaleString("en-IN")}) exceed income (₹${incomeTotal.toLocaleString("en-IN")}) by ₹${Math.abs(netFlow).toLocaleString("en-IN")}`,
      meta: { incomeTotal, expenseTotal, netFlow },
    });
  }
}

export async function analyzeNewTransaction(tx: Transaction) {
  // Run independently — one check failing shouldn't block the others.
  await Promise.allSettled([
    checkHighExpenseAnomaly(tx),
    checkWeeklySpike(tx),
    checkNegativeCashFlow(tx),
  ]);
}
