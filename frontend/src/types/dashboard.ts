export interface DashboardSummary {
  monthlyCashFlow: MonthlyCashFlow[];
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  balanceChangePct: number;
  incomeChangePct: number;
  expenseChangePct: number;
  netChangePct: number;
}

export interface MonthlyCashFlow {
  month: string;
  income: number;
  expense: number;
}
