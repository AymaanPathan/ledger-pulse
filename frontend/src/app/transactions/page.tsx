"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTransactions } from "@/store/slices/transactionSlice";
import { Card } from "@/components/ui/Card";
import TransactionForm from "@/components/transactions/TransactionForm";
import TransactionFilters from "@/components/transactions/TransactionFilters";
import TransactionTable from "@/components/transactions/TransactionTable";
import Pagination from "@/components/transactions/Pagination";

export default function TransactionsPage() {
  const dispatch = useAppDispatch();
  const { items, filters, meta, status } = useAppSelector(
    (s) => s.transactions,
  );

  useEffect(() => {
    dispatch(fetchTransactions(filters));
  }, [dispatch, filters]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <TransactionFilters />
        <TransactionForm />
      </div>

      <Card>
        {status === "loading" && items.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-ink-500">
            Loading...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <TransactionTable items={items} />
            </div>
            <Pagination
              page={meta?.page ?? 1}
              totalPages={meta?.totalPages ?? 1}
              total={meta?.total ?? 0}
            />
          </>
        )}
      </Card>
    </div>
  );
}
