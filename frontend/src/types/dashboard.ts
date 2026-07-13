export interface MonthlyCashFlow {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface DashboardSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  monthlyCashFlow: MonthlyCashFlow[];
}
