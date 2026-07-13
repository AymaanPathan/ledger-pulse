"use client";

import { useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import { createTransaction } from "@/store/slices/transactionSlice";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { CreateTransactionInput } from "@/types/transaction";

const initialForm: CreateTransactionInput = {
  amount: 0,
  type: "EXPENSE",
  category: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
};

export default function TransactionForm() {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateTransactionInput>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.category || !form.date) return;
    setSubmitting(true);
    try {
      await dispatch(
        createTransaction({
          ...form,
          amount: Number(form.amount),
          date: new Date(form.date).toISOString(),
        }),
      ).unwrap();
      setForm(initialForm);
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Add Transaction</Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Transaction">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-ink-500">Amount</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.amount || ""}
                onChange={(e) =>
                  setForm({ ...form, amount: Number(e.target.value) })
                }
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-500">Type</label>
              <Select
                value={form.type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    type: e.target.value as "INCOME" | "EXPENSE",
                  })
                }
                className="w-full"
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-ink-500">Category</label>
            <Input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="e.g. Groceries"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-ink-500">
              Description
            </label>
            <Input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-ink-500">Date</label>
            <Input
              type="date"
              value={form.date.slice(0, 10)}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
