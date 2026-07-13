"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setFilters } from "@/store/slices/transactionSlice";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

export default function TransactionFilters() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((s) => s.transactions.filters);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Search description or category..."
        className="w-60"
        defaultValue={filters.search || ""}
        onChange={(e) =>
          dispatch(setFilters({ search: e.target.value || undefined, page: 1 }))
        }
      />

      <Select
        value={filters.type || ""}
        onChange={(e) =>
          dispatch(
            setFilters({
              type: (e.target.value || undefined) as
                | "INCOME"
                | "EXPENSE"
                | undefined,
              page: 1,
            }),
          )
        }
      >
        <option value="">All types</option>
        <option value="INCOME">Income</option>
        <option value="EXPENSE">Expense</option>
      </Select>

      <Input
        placeholder="Category"
        className="w-36"
        defaultValue={filters.category || ""}
        onChange={(e) =>
          dispatch(
            setFilters({ category: e.target.value || undefined, page: 1 }),
          )
        }
      />

      <Select
        value={filters.sortBy || "date"}
        onChange={(e) =>
          dispatch(setFilters({ sortBy: e.target.value as "date" | "amount" }))
        }
      >
        <option value="date">Sort: Date</option>
        <option value="amount">Sort: Amount</option>
      </Select>

      <Select
        value={filters.sortOrder || "desc"}
        onChange={(e) =>
          dispatch(setFilters({ sortOrder: e.target.value as "asc" | "desc" }))
        }
      >
        <option value="desc">Descending</option>
        <option value="asc">Ascending</option>
      </Select>
    </div>
  );
}
