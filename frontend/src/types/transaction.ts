export type TransactionType = "INCOME" | "EXPENSE";

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description?: string;
  date: string;
  createdAt: string;
}

export interface TransactionFilters {
  page: number;
  limit: number;
  type?: TransactionType;
  category?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: "date" | "amount";
  sortOrder?: "asc" | "desc";
}

export interface CreateTransactionInput {
  amount: number;
  type: TransactionType;
  category: string;
  description?: string;
  date: string;
}

export type UpdateTransactionInput = Partial<CreateTransactionInput>;

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
