import axiosClient from "./axiosClient";
import {
  CreateTransactionInput,
  PaginatedResponse,
  Transaction,
  TransactionFilters,
  UpdateTransactionInput,
} from "../types/transaction";

export const transactionsApi = {
  list: async (filters: TransactionFilters) => {
    const { data } = await axiosClient.get<PaginatedResponse<Transaction>>(
      "/transactions",
      { params: filters },
    );
    return data;
  },

  getById: async (id: string) => {
    const { data } = await axiosClient.get<{
      success: boolean;
      data: Transaction;
    }>(`/transactions/${id}`);
    return data.data;
  },

  create: async (payload: CreateTransactionInput) => {
    const { data } = await axiosClient.post<{
      success: boolean;
      data: Transaction;
    }>("/transactions", payload);
    return data.data;
  },

  update: async (id: string, payload: UpdateTransactionInput) => {
    const { data } = await axiosClient.put<{
      success: boolean;
      data: Transaction;
    }>(`/transactions/${id}`, payload);
    return data.data;
  },

  remove: async (id: string) => {
    await axiosClient.delete(`/transactions/${id}`);
    return id;
  },
};
