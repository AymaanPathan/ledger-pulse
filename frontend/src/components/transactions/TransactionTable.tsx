"use client";

import { useAppDispatch } from "@/store/hooks";
import { deleteTransaction } from "@/store/slices/transactionSlice";
import { Transaction } from "@/types/transaction";
import { formatCurrency, formatDate } from "@/lib/utils";
import Badge from "@/components/ui/Badge";
import { Trash2 } from "lucide-react";

export default function TransactionTable({ items }: { items: Transaction[] }) {
  const dispatch = useAppDispatch();

  if (items.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-ink-500">
        No transactions found.
      </div>
    );
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-border text-xs text-ink-500">
          <th className="px-4 py-2 font-medium">Date</th>
          <th className="px-4 py-2 font-medium">Category</th>
          <th className="px-4 py-2 font-medium">Description</th>
          <th className="px-4 py-2 font-medium">Type</th>
          <th className="px-4 py-2 text-right font-medium">Amount</th>
          <th className="px-4 py-2 text-right font-medium"></th>
        </tr>
      </thead>
      <tbody>
        {items.map((tx) => (
          <tr
            key={tx.id}
            className="border-b border-border last:border-0 hover:bg-ink-300/5"
          >
            <td className="px-4 py-2.5 text-ink-700">{formatDate(tx.date)}</td>
            <td className="px-4 py-2.5 text-ink-900">{tx.category}</td>
            <td className="px-4 py-2.5 text-ink-500">
              {tx.description || "—"}
            </td>
            <td className="px-4 py-2.5">
              <Badge tone={tx.type === "INCOME" ? "success" : "danger"}>
                {tx.type}
              </Badge>
            </td>
            <td
              className={`px-4 py-2.5 text-right font-medium ${
                tx.type === "INCOME" ? "text-accent" : "text-danger"
              }`}
            >
              {tx.type === "INCOME" ? "+" : "-"}
              {formatCurrency(tx.amount)}
            </td>
            <td className="px-4 py-2.5 text-right">
              <button
                onClick={() => dispatch(deleteTransaction(tx.id))}
                className="rounded p-1 text-ink-500 hover:bg-danger-soft hover:text-danger"
              >
                <Trash2 size={14} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
