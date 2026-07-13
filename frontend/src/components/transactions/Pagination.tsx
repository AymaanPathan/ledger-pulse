"use client";

import { useAppDispatch } from "@/store/hooks";
import { setFilters } from "@/store/slices/transactionSlice";
import Button from "@/components/ui/Button";

export default function Pagination({
  page,
  totalPages,
  total,
}: {
  page: number;
  totalPages: number;
  total: number;
}) {
  const dispatch = useAppDispatch();

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-ink-500">
      <span>
        Page {page} of {Math.max(totalPages, 1)} · {total} total
      </span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => dispatch(setFilters({ page: page - 1 }))}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => dispatch(setFilters({ page: page + 1 }))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
