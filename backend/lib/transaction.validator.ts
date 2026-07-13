import { z } from "zod";

export const transactionTypeEnum = z.enum(["INCOME", "EXPENSE"]);

export const createTransactionSchema = z.object({
  body: z.object({
    amount: z.coerce.number().positive("Amount must be greater than 0"),
    type: transactionTypeEnum,
    category: z.string().trim().min(1, "Category is required").max(60),
    description: z.string().trim().max(500).optional().or(z.literal("")),
    date: z.coerce.date({ errorMap: () => ({ message: "Invalid date" }) }),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateTransactionSchema = z.object({
  body: z.object({
    amount: z.coerce.number().positive().optional(),
    type: transactionTypeEnum.optional(),
    category: z.string().trim().min(1).max(60).optional(),
    description: z.string().trim().max(500).optional().or(z.literal("")),
    date: z.coerce.date().optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
  query: z.object({}).optional(),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const listTransactionsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    type: transactionTypeEnum.optional(),
    category: z.string().trim().optional(),
    search: z.string().trim().optional(),
    sortBy: z.enum(["date", "amount", "createdAt"]).default("date"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});
