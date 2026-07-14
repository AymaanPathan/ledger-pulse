import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { transactionsApi } from "../../api/transactions.api";
import {
  CreateTransactionInput,
  Transaction,
  TransactionFilters,
  UpdateTransactionInput,
} from "../../types/transaction";

interface TransactionState {
  items: Transaction[];
  filters: TransactionFilters;
  meta: { page: number; limit: number; total: number; totalPages: number };
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const defaultMeta = { page: 1, limit: 10, total: 0, totalPages: 0 };

const initialState: TransactionState = {
  items: [],
  filters: { page: 1, limit: 10, sortBy: "date", sortOrder: "desc" },
  meta: defaultMeta,
  status: "idle",
  error: null,
};

export const fetchTransactions = createAsyncThunk(
  "transactions/fetch",
  async (filters: TransactionFilters) => {
    return await transactionsApi.list(filters);
  },
);

export const createTransaction = createAsyncThunk(
  "transactions/create",
  async (payload: CreateTransactionInput) => {
    return await transactionsApi.create(payload);
  },
);

export const updateTransaction = createAsyncThunk(
  "transactions/update",
  async ({ id, payload }: { id: string; payload: UpdateTransactionInput }) => {
    return await transactionsApi.update(id, payload);
  },
);

export const deleteTransaction = createAsyncThunk(
  "transactions/delete",
  async (id: string) => {
    return await transactionsApi.remove(id);
  },
);

const transactionSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<TransactionFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.status = "succeeded";
        // API may omit `data`/`meta` entirely on empty results (204, or {} body)
        state.items = Array.isArray(action.payload?.data)
          ? action.payload.data
          : [];
        state.meta = action.payload?.meta ?? {
          ...defaultMeta,
          page: state.filters.page ?? 1,
          limit: state.filters.limit ?? 10,
        };
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to load transactions";
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        if (action.payload) state.items.unshift(action.payload);
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        if (!action.payload) return;
        const idx = state.items.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.id !== action.payload);
      });
  },
});

export const { setFilters, resetFilters } = transactionSlice.actions;
export default transactionSlice.reducer;
